# FlipSwitch

1. Copy `.env.example` to `.env` and adjust values if needed.
2. Start services with Docker Compose:
   ```bash
   docker compose up --build
   ```
   This will start Postgres, Redis, and the app (which runs migrations and seeds on startup).
3. Open http://localhost:3000

## Local dev without Docker

1. Ensure Postgres and Redis running locally.
2. Copy `.env.example` -> `.env` and set env vars.
3. Install deps:
   ```bash
   npm install
   ```
4. Run migrations & seed:
   ```bash
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```
5. Start realtime server:
   ```bash
   npm run start:realtime
   ```
6. Start app:
   ```bash
   npm run dev
   ```

## Notes

- The repo uses Redis for caching compiled flags and pub/sub for realtime broadcasts.
- The evaluation endpoint: `POST /api/v1/evaluate`
  body: `{ workspaceId, flagKey, unitId, attributes }`
