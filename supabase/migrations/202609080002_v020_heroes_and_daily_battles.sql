-- Bladehound v0.2.0: multi-hero roster and server-authoritative daily battles.

alter table public.characters add column if not exists archived_at timestamptz;
alter table public.game_saves alter column schema_version set default 3;

create table if not exists public.battle_attempts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  idempotency_key text not null unique,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  result text check (result in ('victory', 'defeat')),
  reward jsonb not null default '{}'::jsonb
);

alter table public.battle_attempts enable row level security;

drop policy if exists "battle_owner_read" on public.battle_attempts;
create policy "battle_owner_read" on public.battle_attempts for select using (auth.uid() = owner_id);

create index if not exists characters_active_owner_idx on public.characters(owner_id) where archived_at is null;
create index if not exists battle_character_started_idx on public.battle_attempts(character_id, started_at desc);

create or replace function public.claim_daily_battle(p_character_id uuid, p_idempotency_key text)
returns table(attempt_id uuid, next_battle_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_last timestamptz;
  v_id uuid;
begin
  select owner_id into v_owner from public.characters
    where id = p_character_id and archived_at is null for update;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'character_not_found'; end if;

  select max(started_at) into v_last from public.battle_attempts where character_id = p_character_id;
  if v_last is not null and v_last + interval '24 hours' > now() then
    raise exception 'battle_cooldown';
  end if;

  insert into public.battle_attempts(owner_id, character_id, idempotency_key)
    values (auth.uid(), p_character_id, p_idempotency_key)
    returning id into v_id;
  return query select v_id, now() + interval '24 hours';
end;
$$;

revoke all on function public.claim_daily_battle(uuid, text) from public;
grant execute on function public.claim_daily_battle(uuid, text) to authenticated;
