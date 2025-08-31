'use client';
import useSWR from 'swr';
import { useEffect } from 'react';

const fetcher = (url:string)=>fetch(url).then(r=>r.json());

export default function FlagsPage() {
  const workspaceId = 'default-workspace-id'; // replace: derive from session
  const { data, mutate } = useSWR(`/api/flags?workspaceId=${workspaceId}`, fetcher);

  useEffect(()=>{
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    ws.onopen = ()=>{ ws.send(JSON.stringify({ type: 'identify', workspaceId })); };
    ws.onmessage = (e)=>{ const d = JSON.parse(e.data); if (d.type==='flag_updated') { mutate(); } }
    return ()=>{ ws.close(); }
  }, [mutate]);

  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <h1>Flags</h1>
      <ul>
        {data.map((f:any)=> (
          <li key={f.key}>{f.key} — enabled: {String(f.isEnabled)}</li>
        ))}
      </ul>
    </div>
  );
}
