import ImurmurHash from 'imurmurhash';
import prisma from './prismaClient';
import { getRedis } from './redis';

export type Rule = {
  attribute: string;
  comparator: '=' | 'in';
  value: string;
  rolloutPercentage?: number;
}

export type FlagCompiled = {
  key: string;
  workspaceId: string;
  defaultValue: boolean;
  isEnabled: boolean;
  rules: Rule[];
  updatedAt: string;
}

const redis = getRedis();

export function deterministicBucket(workspaceId: string, flagKey: string, unitId: string): number {
  const input = `${workspaceId}:${flagKey}:${unitId}`;
  const h = new ImurmurHash(input).result();
  const intH = (h >>> 0);
  return intH % 10000; // 0..9999
}

function matchesComparator(rule: Rule, attributes: Record<string, any>): boolean {
  const raw = attributes[rule.attribute];
  if (raw === undefined || raw === null) return false;
  if (rule.comparator === '=') {
    return String(raw) === rule.value;
  } else if (rule.comparator === 'in') {
    const opts = rule.value.split(',').map(s => s.trim());
    return opts.includes(String(raw));
  }
  return false;
}

export function compileFlag(dbFlag: any): FlagCompiled {
  const rules: Rule[] = JSON.parse(dbFlag.rulesJson || '[]');
  return {
    key: dbFlag.key,
    workspaceId: dbFlag.workspaceId,
    defaultValue: dbFlag.defaultValue,
    isEnabled: dbFlag.isEnabled,
    rules,
    updatedAt: dbFlag.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export async function getCompiledFlag(workspaceId: string, flagKey: string): Promise<FlagCompiled | null> {
  const cacheKey = `flags:compiled:${workspaceId}`;
  const raw = await redis.hget(cacheKey, flagKey);
  if (raw) {
    try {
      return JSON.parse(raw) as FlagCompiled;
    } catch (e) {
      await redis.hdel(cacheKey, flagKey);
    }
  }
  const dbFlag = await prisma.flag.findUnique({
    where: { workspaceId_key: { workspaceId, key: flagKey } }
  });
  if (!dbFlag) return null;
  const compiled = compileFlag(dbFlag);
  await redis.hset(cacheKey, flagKey, JSON.stringify(compiled));
  return compiled;
}

export async function evaluateFlag(workspaceId: string, flagKey: string, unitId: string, attributes: Record<string, any>) {
  const compiled = await getCompiledFlag(workspaceId, flagKey);
  if (!compiled) {
    return { value: false, reason: 'flag_not_found' };
  }
  if (!compiled.isEnabled) {
    return { value: compiled.defaultValue, reason: 'flag_disabled' };
  }
  for (let i = 0; i < compiled.rules.length; i++) {
    const rule = compiled.rules[i];
    if (matchesComparator(rule, attributes)) {
      if (rule.rolloutPercentage !== undefined && rule.rolloutPercentage < 100) {
        const bucket = deterministicBucket(workspaceId, flagKey, unitId);
        const threshold = Math.round((rule.rolloutPercentage / 100) * 10000);
        if (bucket < threshold) {
          return { value: true, reason: `rule_match_${i}_rollout(${rule.rolloutPercentage}%)` };
        } else {
          continue;
        }
      } else {
        return { value: true, reason: `rule_match_${i}` };
      }
    }
  }
  return { value: compiled.defaultValue, reason: 'default' };
}
