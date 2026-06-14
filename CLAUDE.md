@AGENTS.md

# Project: FIFA World Cup 2026 tracker

Next.js 16 App Router + React 19 site for the 2026 World Cup: group standings, knockout bracket, and a prediction game. No login — visitors claim a username (stored in a cookie + `visitors` table in Supabase) via `lib/actions/visitor.ts`.

- `lib/world-cup-data.ts` — static group-stage draw (groups A-L, dummy standings)
- `lib/football-data.ts` — live standings/matches from football-data.org, cached in Upstash Redis (60s TTL — free tier is limited to 10 req/min, don't lower this without checking)
- `lib/predictions.ts` / `lib/actions/predictions.ts` — prediction scoring rules (points vary by knockout stage) and server actions
- `lib/supabase/server.ts` — admin Supabase client using the secret key; server-only, never import into client components
- `app/point-table/` — standings page, `app/tree/` — bracket page

Required env vars (in `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `FOOTBALL_DATA_API_TOKEN`.
