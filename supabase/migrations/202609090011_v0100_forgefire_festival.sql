-- Bladehound v0.10.0 — Forgefire Festival
-- Server-side, idempotent event progress and milestone claims.
create table if not exists public.event_crafting_progress (
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  points integer not null default 0 check (points >= 0),
  equipment_forged integer not null default 0 check (equipment_forged >= 0),
  claimed_milestones integer[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (owner_id, event_id)
);

create table if not exists public.event_crafting_receipts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  idempotency_key text not null,
  rarity text not null check (rarity in ('common','uncommon','rare','epic','legendary')),
  points integer not null check (points > 0),
  created_at timestamptz not null default now(),
  unique (owner_id, event_id, idempotency_key)
);

alter table public.event_crafting_progress enable row level security;
alter table public.event_crafting_receipts enable row level security;
grant select on public.event_crafting_progress to authenticated;
grant select on public.event_crafting_receipts to authenticated;

drop policy if exists "read own event crafting progress" on public.event_crafting_progress;
create policy "read own event crafting progress" on public.event_crafting_progress for select using (owner_id = auth.uid());
drop policy if exists "read own event crafting receipts" on public.event_crafting_receipts;
create policy "read own event crafting receipts" on public.event_crafting_receipts for select using (owner_id = auth.uid());

create or replace function public.record_forgefire_craft(p_rarity text, p_idempotency_key text)
returns table(points integer, equipment_forged integer, newly_awarded integer)
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid := auth.uid();
  v_award integer;
begin
  if v_owner is null then raise exception 'authentication_required'; end if;
  if now() < timestamptz '2026-09-23 00:00:00+00' or now() >= timestamptz '2026-09-30 00:00:00+00' then raise exception 'event_inactive'; end if;
  v_award := case p_rarity when 'common' then 1 when 'uncommon' then 2 when 'rare' then 3 when 'epic' then 5 when 'legendary' then 8 else 0 end;
  if v_award = 0 or nullif(trim(p_idempotency_key), '') is null then raise exception 'invalid_craft_receipt'; end if;

  insert into public.event_crafting_receipts(owner_id,event_id,idempotency_key,rarity,points)
  values (v_owner,'forgefire-festival-2026',p_idempotency_key,p_rarity,v_award)
  on conflict (owner_id,event_id,idempotency_key) do nothing;
  if not found then
    return query select p.points, p.equipment_forged, 0 from public.event_crafting_progress p where p.owner_id=v_owner and p.event_id='forgefire-festival-2026';
    return;
  end if;

  insert into public.event_crafting_progress(owner_id,event_id,points,equipment_forged)
  values (v_owner,'forgefire-festival-2026',v_award,1)
  on conflict (owner_id,event_id) do update set points=event_crafting_progress.points+excluded.points, equipment_forged=event_crafting_progress.equipment_forged+1, updated_at=now();
  return query select p.points, p.equipment_forged, v_award from public.event_crafting_progress p where p.owner_id=v_owner and p.event_id='forgefire-festival-2026';
end $$;

create or replace function public.claim_forgefire_milestone(p_milestone integer)
returns table(item_id text, quantity integer)
language plpgsql security definer set search_path = public as $$
declare v_owner uuid := auth.uid(); v_progress public.event_crafting_progress%rowtype;
begin
  if v_owner is null then raise exception 'authentication_required'; end if;
  if p_milestone not in (5,15,30) then raise exception 'invalid_milestone'; end if;
  select * into v_progress from public.event_crafting_progress where owner_id=v_owner and event_id='forgefire-festival-2026' for update;
  if v_progress.points < p_milestone then raise exception 'milestone_locked'; end if;
  if p_milestone = any(v_progress.claimed_milestones) then raise exception 'milestone_already_claimed'; end if;
  update public.event_crafting_progress set claimed_milestones=array_append(claimed_milestones,p_milestone), updated_at=now() where owner_id=v_owner and event_id='forgefire-festival-2026';
  if p_milestone=5 then return query select 'forge_core'::text,1;
  elsif p_milestone=15 then return query select 'forge_core'::text,2;
  else return query select 'forgefire_hammer_cosmetic'::text,1;
  end if;
end $$;

revoke all on function public.record_forgefire_craft(text,text) from public;
revoke all on function public.claim_forgefire_milestone(integer) from public;
grant execute on function public.record_forgefire_craft(text,text) to authenticated;
grant execute on function public.claim_forgefire_milestone(integer) to authenticated;

do $$ begin
  if to_regclass('public.game_saves') is not null then
    alter table public.game_saves alter column schema_version set default 12;
  end if;
end $$;
