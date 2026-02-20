# Venture Intelligence Daily

Internal venture intelligence for AI-native, Vertical SaaS, Fintech, and Robotics.

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Supabase (Postgres + Auth)
- Claude API (Anthropic)
- Vercel-ready

## Setup

1. **Env**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in:

   - `ANTHROPIC_API_KEY` – from [console.anthropic.com](https://console.anthropic.com)
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` – from Supabase project

2. **Supabase**

   - Create a project at [supabase.com](https://supabase.com).
   - Run the SQL in `supabase/migrations/001_initial_schema.sql` in the SQL editor.
   - (Optional) Create a user and set `DEMO_USER_ID` in the app to that user id, or keep the placeholder for local demo.

3. **Install and run**

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## API Routes

- `POST /api/ingest` – fetch RSS, classify with Claude, insert articles (call from cron or manually).
- `POST /api/send-digest` – disabled (no-op); re-enable later with Resend if needed.
- `POST /api/star` – body: `{ userId, startupName, startupWebsite?, sectorTags? }`.
- `DELETE /api/star?userId=&startupId=` – unstar.
- `GET /api/tracked-updates?userId=` – updates for starred startups.

## Vercel

- Connect repo, set env vars.
- Cron: `POST /api/ingest` and `POST /api/cron/tracked-startups` daily (e.g. 6:00 and 8:00 UTC).

## Optional (placeholders)

- Portfolio company tracking
- Competitor VC tracking
- Export to CSV
