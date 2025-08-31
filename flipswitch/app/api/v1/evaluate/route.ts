import { NextResponse } from 'next/server';
import { evaluateFlag } from '@/lib/evaluation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, flagKey, unitId, attributes } = body;
    if (!workspaceId || !flagKey || !unitId) {
      return NextResponse.json({ error: 'workspaceId, flagKey and unitId required' }, { status: 400 });
    }
    const result = await evaluateFlag(workspaceId, flagKey, unitId, attributes || {});
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
