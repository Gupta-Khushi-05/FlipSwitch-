import prisma from './prismaClient';
import { getRedis } from './redis';
import { broadcastFlagChange } from './realtime';

const redis = getRedis();

export async function upsertFlag(payload: {
  workspaceId: string;
  key: string;
  defaultValue: boolean;
  isEnabled: boolean;
  rulesJson: string;
  actorId?: string;
}) {
  const { workspaceId, key, actorId } = payload;
  const existing = await prisma.flag.findUnique({ where: { workspaceId_key: { workspaceId, key } } });
  const flag = await prisma.flag.upsert({
    where: { workspaceId_key: { workspaceId, key } },
    update: {
      defaultValue: payload.defaultValue,
      isEnabled: payload.isEnabled,
      rulesJson: payload.rulesJson,
    },
    create: {
      workspaceId,
      key,
      defaultValue: payload.defaultValue,
      isEnabled: payload.isEnabled,
      rulesJson: payload.rulesJson,
    }
  });

  await prisma.auditLog.create({
    data: {
      workspaceId,
      flagKey: key,
      action: existing ? 'UPDATE' : 'CREATE',
      actorId: actorId || null,
      payload: { before: existing, after: flag }
    }
  });

  await redis.hdel(`flags:compiled:${workspaceId}`, key);
  await broadcastFlagChange(workspaceId, key);
  return flag;
}

export async function deleteFlag({ workspaceId, key, actorId }: { workspaceId: string, key: string, actorId?: string }) {
  const existing = await prisma.flag.findUnique({ where: { workspaceId_key: { workspaceId, key } } });
  if (!existing) return null;
  await prisma.flag.delete({ where: { id: existing.id } });
  await prisma.auditLog.create({ data: { workspaceId, flagKey: key, action: 'DELETE', actorId: actorId || null, payload: existing } });
  await redis.hdel(`flags:compiled:${workspaceId}`, key);
  await broadcastFlagChange(workspaceId, key);
  return true;
}
