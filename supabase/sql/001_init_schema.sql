create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  image_url text not null,
  external_url text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metrics jsonb not null,
  score int not null check (score between 0 and 100)
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (scan_id, product_id)
);

create index if not exists scans_user_id_created_at_idx
  on public.scans (user_id, created_at desc);

create index if not exists recommendations_scan_id_idx
  on public.recommendations (scan_id);

create index if not exists recommendations_product_id_idx
  on public.recommendations (product_id);

alter table public.products enable row level security;
alter table public.scans enable row level security;
alter table public.recommendations enable row level security;

create policy "products are readable by authenticated users"
on public.products
for select
to authenticated
using (true);

create policy "scans selectable by owner"
on public.scans
for select
to authenticated
using (auth.uid() = user_id);

create policy "scans insertable by owner"
on public.scans
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "recommendations selectable by owner"
on public.recommendations
for select
to authenticated
using (
  exists (
    select 1
    from public.scans s
    where s.id = recommendations.scan_id
      and s.user_id = auth.uid()
  )
);

create policy "recommendations insertable by owner"
on public.recommendations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.scans s
    where s.id = recommendations.scan_id
      and s.user_id = auth.uid()
  )
);
