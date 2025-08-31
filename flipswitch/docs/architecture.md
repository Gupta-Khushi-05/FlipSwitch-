# FlipSwitch architecture

Components:
- Next.js App (frontend + API routes)
- PostgreSQL (Prisma)
- Redis (compiled flag cache + pub/sub)
- Realtime WS server (broadcast to connected clients)

Flow:
- Admin updates flag via Next.js API -> Prisma writes -> Redis cache invalidated -> AuditLog written -> Redis pub/sub + realtime server broadcasts -> clients refetch compiled flags
- SDK / front-end calls `/api/v1/evaluate` with workspaceId, flagKey, unitId, attributes -> server reads compiled flag from Redis -> evaluates rules -> returns `{value, reason}`
