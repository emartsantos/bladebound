-- Bladehound v0.1.6 production persistence foundation.
-- Apply with the Supabase CLI or paste into the Supabase SQL editor.

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 24),
  class text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_saves (
  character_id uuid primary key references public.characters(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  schema_version integer not null default 2,
  revision bigint not null default 1,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.economy_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  category text not null check (category in ('gold','item','skill_xp','combat_xp','bhc')),
  asset_id text not null,
  delta numeric not null,
  balance numeric not null check (balance >= 0),
  reason text not null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

alter table public.characters enable row level security;
alter table public.game_saves enable row level security;
alter table public.economy_transactions enable row level security;

create policy "characters_owner_read" on public.characters for select using (auth.uid() = owner_id);
create policy "characters_owner_insert" on public.characters for insert with check (auth.uid() = owner_id);
create policy "characters_owner_update" on public.characters for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "saves_owner_read" on public.game_saves for select using (auth.uid() = owner_id);
create policy "saves_owner_insert" on public.game_saves for insert with check (auth.uid() = owner_id);
create policy "saves_owner_update" on public.game_saves for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "ledger_owner_read" on public.economy_transactions for select using (auth.uid() = owner_id);

-- Ledger rows are intentionally append-only. Production economy mutations
-- should be exposed through SECURITY DEFINER RPCs/Edge Functions after their
-- reward rules are finalized; clients receive no direct insert/update/delete.
create index if not exists characters_owner_idx on public.characters(owner_id);
create index if not exists saves_owner_idx on public.game_saves(owner_id);
create index if not exists ledger_character_created_idx on public.economy_transactions(character_id, created_at desc);
