import WebSocket, { WebSocketServer } from 'ws';
import Redis from 'ioredis';

const PORT = process.env.REALTIME_PORT ? parseInt(process.env.REALTIME_PORT) : 4001;
const wss = new WebSocketServer({ port: PORT });
const redis = new Redis(process.env.REDIS_URL);

type ClientMeta = { workspaceId?: string };

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    try {
      const obj = JSON.parse(String(msg));
      if (obj.type === 'identify' && obj.workspaceId) {
        (ws as any).meta = { workspaceId: obj.workspaceId } as ClientMeta;
      }
    } catch (e) {}
  });
});

// optionally subscribe to Redis pub/sub for multi-instance
redis.subscribe('flags:updated', (err, _count) => {
  if (err) console.error('subscribe err', err);
});

redis.on('message', (_channel, message) => {
  try {
    const payload = JSON.parse(message);
    broadcast(JSON.stringify(payload));
  } catch (e) {}
});

export function broadcastFlagChange(workspaceId: string, flagKey: string) {
  const message = JSON.stringify({ type: 'flag_updated', workspaceId, flagKey });
  // publish to redis channel as well so other realtime instances receive it
  redis.publish('flags:updated', message);
  broadcast(message);
}

function broadcast(message: string) {
  for (const client of wss.clients) {
    const meta = (client as any).meta as ClientMeta | undefined;
    if (meta && meta.workspaceId && client.readyState === WebSocket.OPEN) {
      try { client.send(message); } catch (e) {}
    }
  }
}

console.log(`Realtime WS server running at ws://localhost:${PORT}`);
