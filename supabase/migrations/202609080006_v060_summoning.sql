-- Bladehound v0.6.0: capped Hero summoning, economy split, pity, and reward battles.

alter table public.game_saves alter column schema_version set default 7;
alter table public.investment_transactions drop constraint if exists investment_transactions_investment_type_check;
alter table public.investment_transactions add constraint investment_transactions_investment_type_check
  check (investment_type in ('forge','awaken','weapon_reroll','hero_rebirth','hero_reforge','marketplace_listing','hero_summon'));

create table if not exists public.summoning_config (
  id boolean primary key default true check (id),
  config_version integer not null default 1,
  enabled boolean not null default true,
  summon_cost numeric(18,6) not null default 1 check (summon_cost > 0),
  burn_share numeric(18,6) not null default 0.50 check (burn_share >= 0),
  reward_pool_share numeric(18,6) not null default 0.40 check (reward_pool_share >= 0),
  treasury_share numeric(18,6) not null default 0.10 check (treasury_share >= 0),
  rare_pity integer not null default 10 check (rare_pity > 0),
  epic_pity integer not null default 50 check (epic_pity > 0),
  legendary_pity integer not null default 100 check (legendary_pity > 0),
  daily_reward_battle_cap integer not null default 5 check (daily_reward_battle_cap > 0),
  updated_at timestamptz not null default now(),
  check (burn_share + reward_pool_share + treasury_share = summon_cost)
);
insert into public.summoning_config(id) values (true)
on conflict (id) do update set config_version = excluded.config_version, updated_at = now();

create table if not exists public.summoning_economy (
  id boolean primary key default true check (id),
  reward_pool_balance numeric(18,6) not null default 0 check (reward_pool_balance >= 0),
  treasury_balance numeric(18,6) not null default 0 check (treasury_balance >= 0),
  total_burned numeric(18,6) not null default 0 check (total_burned >= 0),
  updated_at timestamptz not null default now()
);
insert into public.summoning_economy(id) values (true) on conflict (id) do nothing;

create table if not exists public.summon_archetypes (
  id text primary key,
  hero_class text not null check (hero_class in ('warrior','assassin','ranger','mage','knight')),
  rarity text not null check (rarity in ('common','uncommon','rare','epic','legendary')),
  variation smallint not null check (variation between 1 and 5),
  max_supply integer not null check (max_supply > 0),
  minted_supply integer not null default 0 check (minted_supply between 0 and max_supply),
  enabled boolean not null default true,
  unique(hero_class, rarity, variation)
);
insert into public.summon_archetypes(id, hero_class, rarity, variation, max_supply)
select c.hero_class || '-' || r.rarity || '-' || v.variation, c.hero_class, r.rarity, v.variation,
  case r.rarity when 'common' then 10000 when 'uncommon' then 5000 when 'rare' then 2000 when 'epic' then 500 else 100 end
from (values ('warrior'),('assassin'),('ranger'),('mage'),('knight')) c(hero_class)
cross join (values ('common'),('uncommon'),('rare'),('epic'),('legendary')) r(rarity)
cross join generate_series(1,5) v(variation)
on conflict (id) do nothing;

create table if not exists public.summon_accounts (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  total_summons integer not null default 0 check (total_summons >= 0),
  legendary_pity integer not null default 0 check (legendary_pity >= 0),
  essence integer not null default 0 check (essence >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.summoned_heroes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  archetype_id text not null references public.summon_archetypes(id) on delete restrict,
  copies integer not null default 1 check (copies > 0),
  essence integer not null default 0 check (essence >= 0),
  next_battle_at timestamptz not null default to_timestamp(0),
  summoned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, archetype_id)
);

create table if not exists public.summon_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  payer_character_id uuid not null references public.characters(id) on delete restrict,
  summoned_hero_id uuid not null references public.summoned_heroes(id) on delete restrict,
  archetype_id text not null references public.summon_archetypes(id) on delete restrict,
  rarity text not null,
  duplicate boolean not null,
  server_roll double precision not null check (server_roll >= 0 and server_roll < 1),
  cost numeric(18,6) not null,
  burned numeric(18,6) not null,
  reward_pool_contribution numeric(18,6) not null,
  treasury_contribution numeric(18,6) not null,
  config_version integer not null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.summoned_hero_battles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  summoned_hero_id uuid not null references public.summoned_heroes(id) on delete restrict,
  payout_character_id uuid not null references public.characters(id) on delete restrict,
  reward numeric(18,6) not null check (reward > 0),
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists summon_history_owner_idx on public.summon_transactions(owner_id, created_at desc);
create index if not exists summoned_battles_owner_day_idx on public.summoned_hero_battles(owner_id, created_at desc);

alter table public.summoning_config enable row level security;
alter table public.summoning_economy enable row level security;
alter table public.summon_archetypes enable row level security;
alter table public.summon_accounts enable row level security;
alter table public.summoned_heroes enable row level security;
alter table public.summon_transactions enable row level security;
alter table public.summoned_hero_battles enable row level security;

create policy "summoning_config_read" on public.summoning_config for select using (true);
create policy "summon_archetypes_read" on public.summon_archetypes for select using (true);
create policy "summon_account_owner_read" on public.summon_accounts for select using (auth.uid() = owner_id);
create policy "summoned_heroes_owner_read" on public.summoned_heroes for select using (auth.uid() = owner_id);
create policy "summon_transactions_owner_read" on public.summon_transactions for select using (auth.uid() = owner_id);
create policy "summoned_battles_owner_read" on public.summoned_hero_battles for select using (auth.uid() = owner_id);
-- Economy pool totals and every mutation remain server-only.

create or replace function public.summon_hero(p_payer_character_id uuid, p_idempotency_key text)
returns table(transaction_id uuid, summoned_hero_id uuid, archetype_id text, rarity text, duplicate boolean, server_roll double precision, balance_after numeric)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_owner uuid; v_config public.summoning_config%rowtype; v_account public.summon_accounts%rowtype;
  v_balance numeric(18,6); v_roll double precision; v_rarity text; v_archetype public.summon_archetypes%rowtype;
  v_hero_id uuid; v_duplicate boolean; v_essence integer; v_tx uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) < 8 then raise exception 'invalid_idempotency_key'; end if;
  select id into v_tx from public.summon_transactions where idempotency_key = p_idempotency_key;
  if v_tx is not null then
    return query select st.id, st.summoned_hero_id, st.archetype_id, st.rarity, st.duplicate, st.server_roll, b.balance
      from public.summon_transactions st join public.bhc_balances b on b.character_id = st.payer_character_id where st.id = v_tx;
    return;
  end if;
  select owner_id into v_owner from public.characters where id = p_payer_character_id and archived_at is null for update;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'character_not_found'; end if;
  select * into v_config from public.summoning_config where id = true for update;
  if not v_config.enabled then raise exception 'summoning_disabled'; end if;
  insert into public.summon_accounts(owner_id) values (auth.uid()) on conflict (owner_id) do nothing;
  select * into v_account from public.summon_accounts where owner_id = auth.uid() for update;
  insert into public.bhc_balances(character_id, owner_id) values (p_payer_character_id, auth.uid()) on conflict (character_id) do nothing;
  select balance into v_balance from public.bhc_balances where character_id = p_payer_character_id for update;
  if v_balance < v_config.summon_cost then raise exception 'insufficient_bhc'; end if;

  v_roll := random();
  v_rarity := case when v_roll < 0.55 then 'common' when v_roll < 0.82 then 'uncommon' when v_roll < 0.94 then 'rare' when v_roll < 0.99 then 'epic' else 'legendary' end;
  if v_account.legendary_pity >= v_config.legendary_pity - 1 then v_rarity := 'legendary';
  elsif (v_account.total_summons + 1) % v_config.epic_pity = 0 and v_rarity in ('common','uncommon','rare') then v_rarity := 'epic';
  elsif (v_account.total_summons + 1) % v_config.rare_pity = 0 and v_rarity in ('common','uncommon') then v_rarity := 'rare';
  end if;

  select * into v_archetype from public.summon_archetypes
    where rarity = v_rarity and enabled and minted_supply < max_supply order by random() limit 1 for update skip locked;
  if v_archetype.id is null then raise exception 'rarity_supply_exhausted'; end if;
  select id into v_hero_id from public.summoned_heroes where owner_id = auth.uid() and archetype_id = v_archetype.id for update;
  v_duplicate := v_hero_id is not null;
  v_essence := case v_rarity when 'common' then 1 when 'uncommon' then 2 when 'rare' then 5 when 'epic' then 12 else 30 end;
  if v_duplicate then
    update public.summoned_heroes set copies = copies + 1, essence = essence + v_essence, updated_at = now() where id = v_hero_id;
    update public.summon_accounts set essence = essence + v_essence where owner_id = auth.uid();
  else
    insert into public.summoned_heroes(owner_id, archetype_id) values (auth.uid(), v_archetype.id) returning id into v_hero_id;
    update public.summon_archetypes set minted_supply = minted_supply + 1 where id = v_archetype.id;
  end if;
  update public.summon_accounts set total_summons = total_summons + 1,
    legendary_pity = case when v_rarity = 'legendary' then 0 else legendary_pity + 1 end, updated_at = now() where owner_id = auth.uid();
  update public.bhc_balances set balance = balance - v_config.summon_cost,
    burned_total = burned_total + v_config.burn_share, updated_at = now() where character_id = p_payer_character_id returning balance into v_balance;
  update public.summoning_economy set reward_pool_balance = reward_pool_balance + v_config.reward_pool_share,
    treasury_balance = treasury_balance + v_config.treasury_share, total_burned = total_burned + v_config.burn_share, updated_at = now() where id = true;
  insert into public.summon_transactions(owner_id,payer_character_id,summoned_hero_id,archetype_id,rarity,duplicate,server_roll,cost,burned,reward_pool_contribution,treasury_contribution,config_version,idempotency_key)
    values (auth.uid(),p_payer_character_id,v_hero_id,v_archetype.id,v_rarity,v_duplicate,v_roll,v_config.summon_cost,v_config.burn_share,v_config.reward_pool_share,v_config.treasury_share,v_config.config_version,p_idempotency_key)
    returning id into v_tx;
  insert into public.investment_transactions(owner_id,character_id,investment_type,cost,balance_after,idempotency_key,payload)
    values (auth.uid(),p_payer_character_id,'hero_summon',v_config.burn_share,v_balance,'summon-burn:'||p_idempotency_key,jsonb_build_object('summon_transaction_id',v_tx));
  return query select v_tx,v_hero_id,v_archetype.id,v_rarity,v_duplicate,v_roll,v_balance;
end $$;

create or replace function public.claim_summoned_hero_battle(p_summoned_hero_id uuid, p_payout_character_id uuid, p_idempotency_key text)
returns table(battle_id uuid, reward numeric, next_battle_at timestamptz, balance_after numeric)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_hero public.summoned_heroes%rowtype; v_owner uuid; v_cap integer; v_today integer;
  v_reward numeric(18,6); v_pool numeric(18,6); v_balance numeric(18,6); v_battle uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select id into v_battle from public.summoned_hero_battles where idempotency_key = p_idempotency_key;
  if v_battle is not null then
    return query select sb.id,sb.reward,sh.next_battle_at,b.balance from public.summoned_hero_battles sb
      join public.summoned_heroes sh on sh.id=sb.summoned_hero_id join public.bhc_balances b on b.character_id=sb.payout_character_id where sb.id=v_battle;
    return;
  end if;
  select * into v_hero from public.summoned_heroes where id=p_summoned_hero_id and owner_id=auth.uid() for update;
  if v_hero.id is null then raise exception 'summoned_hero_not_found'; end if;
  if v_hero.next_battle_at > now() then raise exception 'battle_cooldown'; end if;
  select owner_id into v_owner from public.characters where id=p_payout_character_id and archived_at is null for update;
  if v_owner is null or v_owner<>auth.uid() then raise exception 'character_not_found'; end if;
  select daily_reward_battle_cap into v_cap from public.summoning_config where id=true;
  select count(*) into v_today from public.summoned_hero_battles where owner_id=auth.uid() and created_at>=date_trunc('day',now());
  if v_today>=v_cap then raise exception 'daily_summoned_battle_cap'; end if;
  select case sa.rarity when 'common' then 0.05 when 'uncommon' then 0.07 when 'rare' then 0.10 when 'epic' then 0.14 else 0.20 end
    into v_reward from public.summon_archetypes sa where sa.id=v_hero.archetype_id;
  select reward_pool_balance into v_pool from public.summoning_economy where id=true for update;
  if v_pool<v_reward then raise exception 'reward_pool_depleted'; end if;
  update public.summoning_economy set reward_pool_balance=reward_pool_balance-v_reward,updated_at=now() where id=true;
  update public.summoned_heroes set next_battle_at=now()+interval '24 hours',updated_at=now() where id=v_hero.id;
  update public.bhc_balances set balance=balance+v_reward,updated_at=now() where character_id=p_payout_character_id returning balance into v_balance;
  insert into public.summoned_hero_battles(owner_id,summoned_hero_id,payout_character_id,reward,idempotency_key)
    values(auth.uid(),v_hero.id,p_payout_character_id,v_reward,p_idempotency_key) returning id into v_battle;
  insert into public.economy_transactions(owner_id,character_id,category,asset_id,delta,balance,reason,idempotency_key)
    values(auth.uid(),p_payout_character_id,'bhc','bhc',v_reward,v_balance,'summoned_hero_battle','summon-battle:'||p_idempotency_key);
  return query select v_battle,v_reward,now()+interval '24 hours',v_balance;
end $$;

revoke all on function public.summon_hero(uuid,text) from public;
revoke all on function public.claim_summoned_hero_battle(uuid,uuid,text) from public;
grant execute on function public.summon_hero(uuid,text) to authenticated;
grant execute on function public.claim_summoned_hero_battle(uuid,uuid,text) to authenticated;
