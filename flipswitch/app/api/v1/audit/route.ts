import { NextResponse } from 'next/server';
import prisma from '@/lib/prismaClient';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get('workspaceId');
    const flagKey = url.searchParams.get('flagKey');
    const take = parseInt(url.searchParams.get('take') || '50', 10);
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    const where: any = { workspaceId };
    if (flagKey) where.flagKey = flagKey;
    const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take });
    return NextResponse.json(logs);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
