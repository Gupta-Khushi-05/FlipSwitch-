'use client';
import { useState } from 'react';

export default function FlagEditPage({ params }: { params: { key: string } }) {
  const [unitId, setUnitId] = useState('user-1');
  const [attrs, setAttrs] = useState('{"emailDomain":"example.com"}');
  const [result, setResult] = useState<any>(null);
  const workspaceId = 'default-workspace-id';
  const flagKey = params.key;

  async function testEval() {
    try {
      const r = await fetch('/api/v1/evaluate', { method: 'POST', body: JSON.stringify({ workspaceId, flagKey, unitId, attributes: JSON.parse(attrs) }), headers: { 'Content-Type': 'application/json' } });
      const j = await r.json();
      setResult(j);
    } catch (e) { setResult({ error: 'bad attrs' }); }
  }

  return (
    <div>
      <h1>Edit Flag: {flagKey}</h1>
      <div>
        <h2>Test Evaluation</h2>
        <label>unitId: <input value={unitId} onChange={e=>setUnitId(e.target.value)} /></label>
        <br />
        <label>attributes JSON: <textarea value={attrs} onChange={e=>setAttrs(e.target.value)} /></label>
        <br />
        <button onClick={testEval}>Evaluate</button>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  );
}
