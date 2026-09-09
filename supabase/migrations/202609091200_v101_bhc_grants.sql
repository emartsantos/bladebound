-- Bladehound v1.0.1 BHC grants: server-authoritative premium currency grants.
-- A grant survives stale local saves because it is claimed (atomically) on the
-- client during session restore / login / hero selection, not by editing the
-- save rows directly.

create table if not exists public.bhc_grants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null default 0 check (amount > 0),
  reason text not null default '',
  applied_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists bhc_grants_pending_idx
  on public.bhc_grants (owner_id, applied_at);

alter table public.bhc_grants enable row level security;

create policy bhc_grants_select_own on public.bhc_grants
  for select using (owner_id = auth.uid());

-- Atomically mark a caller's pending grants as applied and bump the target
-- character's save. Only callable for the caller's own owner id; the postgres
-- (server / management) role may apply grants directly for admin use.
create or replace function public.claim_bhc_grants(p_owner_id uuid, p_character_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric := 0;
begin
  if p_owner_id is null then
    return 0;
  end if;
  if auth.uid() is not null and p_owner_id <> auth.uid() then
    return 0;
  end if;

  with claimed as (
    update public.bhc_grants
    set applied_at = clock_timestamp()
    where owner_id = p_owner_id
      and applied_at is null
    returning amount
  )
  select coalesce(sum(amount), 0) into v_total from claimed;

  if v_total > 0 then
    update public.game_saves
    set save_data = jsonb_set(
      save_data,
      '{investment,bhc}',
      to_jsonb(round((coalesce((save_data->'investment'->>'bhc')::numeric, 0) + v_total)::numeric, 3))
    ),
    updated_at = clock_timestamp()
    where character_id = p_character_id;
  end if;

  return v_total;
end;
$$;

grant execute on function public.claim_bhc_grants(uuid, uuid) to authenticated;