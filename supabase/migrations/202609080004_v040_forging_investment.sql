-- Bladehound v0.4.0: authoritative BHC balances and investment audit trail.

alter table public.game_saves alter column schema_version set default 5;

create table if not exists public.bhc_balances (
  character_id uuid primary key references public.characters(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  balance numeric(18,6) not null default 0 check (balance >= 0),
  burned_total numeric(18,6) not null default 0 check (burned_total >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.item_investments (
  character_id uuid not null references public.characters(id) on delete cascade,
  item_uid text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  forge_level smallint not null default 0 check (forge_level between 0 and 10),
  awakening_tier smallint not null default 0 check (awakening_tier between 0 and 5),
  reroll_count integer not null default 0 check (reroll_count >= 0),
  bonus_stat text,
  bonus_value numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key(character_id, item_uid)
);

create table if not exists public.investment_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  investment_type text not null check (investment_type in ('forge','awaken','weapon_reroll','hero_rebirth','hero_reforge')),
  cost numeric(18,6) not null check (cost > 0),
  balance_after numeric(18,6) not null check (balance_after >= 0),
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.bhc_balances enable row level security;
alter table public.item_investments enable row level security;
alter table public.investment_transactions enable row level security;

drop policy if exists "bhc_owner_read" on public.bhc_balances;
create policy "bhc_owner_read" on public.bhc_balances for select using (auth.uid() = owner_id);
drop policy if exists "investment_item_owner_read" on public.item_investments;
create policy "investment_item_owner_read" on public.item_investments for select using (auth.uid() = owner_id);
drop policy if exists "investment_ledger_owner_read" on public.investment_transactions;
create policy "investment_ledger_owner_read" on public.investment_transactions for select using (auth.uid() = owner_id);

create index if not exists investment_character_created_idx on public.investment_transactions(character_id, created_at desc);

-- Mutations intentionally have no browser insert/update policy. A future
-- gameserver/RPC settles verified battle emissions and burns atomically.
