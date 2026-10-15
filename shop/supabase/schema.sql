-- Ryaan Jewellers — database schema (Supabase / Postgres)
-- Run once in: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Then run supabase/seed_products.sql.

create table if not exists public.products (
  id          text primary key,
  name        text not null,
  collection  text,
  price_aed   numeric(12,2) not null check (price_aed > 0),
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table if not exists public.coupons (
  code        text primary key,
  percent_off integer not null check (percent_off between 1 and 50),
  active      boolean not null default true
);

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  ref               text not null unique,
  status            text not null default 'pending',   -- pending | paid | expired
  customer          jsonb not null,
  items             jsonb not null,
  total_fils        integer not null,                   -- AED x 100 (Stripe unit)
  currency          text not null default 'aed',
  coupon            text,
  stripe_session_id text unique,
  created_at        timestamptz not null default now(),
  paid_at           timestamptz
);

-- Public (anon) users may read active products only.
alter table public.products enable row level security;
drop policy if exists "read active products" on public.products;
create policy "read active products" on public.products
  for select to anon, authenticated using (active);

-- Coupons and orders have NO anon policies: only Edge Functions (service role) touch them.
alter table public.coupons enable row level security;
alter table public.orders  enable row level security;

insert into public.coupons (code, percent_off, active)
values ('RYAAN5', 5, true)
on conflict (code) do nothing;
