-- Bladehound v1.0.4: sync bhc_balances with the grants / save economy.
-- Best-effort backfill plus ongoing reconciliation: the claim RPC now credits
-- bhc_balances in the same transaction it credits game_saves, so manually
-- granted BHC appears in both places immediately.

-- One-time backfill from the authoritative save data.
insert into public.bhc_balances (character_id, owner_id, balance, burned_total, updated_at)
select s.character_id,
       s.owner_id,
       coalesce((s.save_data->'investment'->>'bhc')::numeric, 0),
       coalesce((s.save_data->'investment'->>'burnedTotal')::numeric, 0),
       now()
from public.game_saves s
on conflict (character_id) do update
set balance      = excluded.balance,
    burned_total = excluded.burned_total,
    updated_at   = now();

-- claim_bhc_grants credits bhc_balances alongside game_saves.
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

    insert into public.bhc_balances (character_id, owner_id, balance, burned_total)
    values (p_character_id, p_owner_id, v_total, 0)
    on conflict (character_id) do update
    set balance    = public.bhc_balances.balance + v_total,
        updated_at = now();
  end if;

  return v_total;
end;
$$;

grant execute on function public.claim_bhc_grants(uuid, uuid) to authenticated;