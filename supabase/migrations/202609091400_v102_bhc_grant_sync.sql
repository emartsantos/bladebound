-- Bladehound v1.0.2 BHC grant reconciliation guard.
-- A browser tab running an older bundle (or a stale device) pushes the full
-- local save on every action and would otherwise overwrite a freshly granted
-- balance. Each save row now carries grants_seen_at: the RPC stamps it when it
-- credits a grant, and the client echoes it on every push. A BEFORE UPDATE
-- trigger rejects any client save that has not seen the newest applied grant,
-- so only post-grant clients (whose grants_seen_at >= applied_at) can write.

alter table public.game_saves
  add column if not exists grants_seen_at timestamptz;

create or replace function public.reject_stale_bhc_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin / server writes (management API, RPC) are always allowed.
  if current_user = 'postgres' then
    return new;
  end if;
  if exists (
    select 1 from public.bhc_grants g
    where g.owner_id = new.owner_id
      and g.applied_at is not null
      and g.applied_at > coalesce(new.grants_seen_at, '-infinity')
  ) then
    raise exception 'STALE_SAVE_GRANT: newer BHC grant must be synced before this save is accepted';
  end if;
  return new;
end;
$$;

-- Update path only: INSERTing a brand-new save row carries no prior state and
-- must never be blocked (e.g. a fresh hero's first save).
create trigger game_saves_stale_grant_guard
  before update on public.game_saves
  for each row execute function public.reject_stale_bhc_save();

-- RPC now records the credit timestamp so the claiming client's next push has
-- a grants_seen_at that satisfies the guard.
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
    grants_seen_at = clock_timestamp(),
    updated_at = clock_timestamp()
    where character_id = p_character_id;
  end if;

  return v_total;
end;
$$;

grant execute on function public.claim_bhc_grants(uuid, uuid) to authenticated;