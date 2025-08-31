import { NextResponse } from 'next/server';
import { upsertFlag, deleteFlag } from '@/lib/flagsService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const flag = await upsertFlag(body);
    return NextResponse.json(flag);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, key, actorId } = body;
    await deleteFlag({ workspaceId, key, actorId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
