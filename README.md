# AI Beauty Recommendation Platform

Production-ready React + Vite frontend with a cinematic UI and a Supabase-backed flow:

- Auth with Supabase Auth
- AI scan persistence to Supabase Postgres
- Product recommendations loaded from Supabase
- Scan history loaded from Supabase only (no local fallback)

## 1) Prerequisites

- Node.js 20+
- A Supabase project

## 2) Environment setup

1. Copy `.env.example` to `.env`
2. Fill values from Supabase Project Settings → API

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_EMAILS=admin@yourdomain.com,ops@yourdomain.com
```

The app now requires these env vars at startup.

## 3) Database setup (Supabase SQL Editor)

Run these scripts in order:

1. `supabase/sql/001_init_schema.sql`
2. `supabase/sql/002_seed_products.sql`

What these scripts do:

- Create tables: `products`, `scans`, `recommendations`
- Add indexes for history and recommendation lookups
- Enable RLS and add policies:
  - authenticated users can read products
  - users can insert/select only their own scans
  - users can insert/select recommendations only for their own scans
- Seed product catalog used by recommendation UI and scan persistence

## 4) Run app

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## 5) Validate Supabase flow

1. Sign up or sign in
2. Go to AI Scan and run scan
3. Confirm scan is saved in `public.scans`
4. Confirm recommendation rows are created in `public.recommendations`
5. Open Recommendations page and verify products load from `public.products`

## Available scripts

- `npm run dev` – start development server
- `npm run build` – type check + production build
- `npm run lint` – run ESLint
- `npm run preview` – preview production build
