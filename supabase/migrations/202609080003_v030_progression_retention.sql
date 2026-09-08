-- Bladehound v0.3.0: progression event ledger and durable per-hero mailbox.

alter table public.game_saves alter column schema_version set default 4;

create table if not exists public.progression_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  event_type text not null,
  event_key text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(character_id, event_key)
);

create table if not exists public.character_mail (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  title text not null,
  message text not null,
  reward jsonb not null default '{}'::jsonb,
  claimed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.progression_events enable row level security;
alter table public.character_mail enable row level security;

drop policy if exists "progression_owner_read" on public.progression_events;
create policy "progression_owner_read" on public.progression_events for select using (auth.uid() = owner_id);
drop policy if exists "mail_owner_read" on public.character_mail;
create policy "mail_owner_read" on public.character_mail for select using (auth.uid() = owner_id);

create index if not exists progression_character_created_idx on public.progression_events(character_id, created_at desc);
create index if not exists mail_character_created_idx on public.character_mail(character_id, created_at desc);

-- Writes remain server/RPC-only. Browser clients cannot mint achievements,
-- login rewards, quest rewards, or mailbox grants directly.
