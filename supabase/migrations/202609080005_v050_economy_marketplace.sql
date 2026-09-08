-- Bladehound v0.5.0: server-authoritative marketplace and atomic BHC settlement.

alter table public.game_saves alter column schema_version set default 6;
alter table public.investment_transactions drop constraint if exists investment_transactions_investment_type_check;
alter table public.investment_transactions add constraint investment_transactions_investment_type_check
  check (investment_type in ('forge','awaken','weapon_reroll','hero_rebirth','hero_reforge','marketplace_listing'));

create table if not exists public.marketplace_config (
  id boolean primary key default true check (id),
  listing_fee numeric(18,6) not null default 0.075 check (listing_fee >= 0),
  min_price numeric(18,6) not null default 0.01 check (min_price > 0),
  max_price numeric(18,6) not null default 1000000 check (max_price >= min_price),
  updated_at timestamptz not null default now()
);
insert into public.marketplace_config(id, listing_fee) values (true, 0.075)
on conflict (id) do update set listing_fee = excluded.listing_fee, updated_at = now();

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete restrict,
  seller_character_id uuid not null references public.characters(id) on delete restrict,
  asset_type text not null check (asset_type in ('hero','weapon')),
  asset_id text not null,
  title text not null,
  asset_snapshot jsonb not null,
  price numeric(18,6) not null check (price > 0),
  listing_fee numeric(18,6) not null check (listing_fee >= 0),
  status text not null default 'active' check (status in ('active','sold','cancelled')),
  buyer_id uuid references auth.users(id) on delete restrict,
  buyer_character_id uuid references public.characters(id) on delete restrict,
  idempotency_key text not null unique,
  purchase_idempotency_key text unique,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((status = 'active' and buyer_id is null and completed_at is null) or status <> 'active')
);

create unique index if not exists marketplace_active_hero_idx
  on public.marketplace_listings(asset_id) where status = 'active' and asset_type = 'hero';
create unique index if not exists marketplace_active_weapon_idx
  on public.marketplace_listings(seller_character_id, asset_id) where status = 'active' and asset_type = 'weapon';
create index if not exists marketplace_browse_idx
  on public.marketplace_listings(status, asset_type, created_at desc);
create index if not exists marketplace_seller_idx
  on public.marketplace_listings(seller_id, created_at desc);

create table if not exists public.marketplace_sales (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.marketplace_listings(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  asset_type text not null check (asset_type in ('hero','weapon')),
  asset_id text not null,
  price numeric(18,6) not null check (price > 0),
  sold_at timestamptz not null default now()
);

alter table public.marketplace_config enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_sales enable row level security;

drop policy if exists "market_config_read" on public.marketplace_config;
create policy "market_config_read" on public.marketplace_config for select using (true);
drop policy if exists "market_listings_read" on public.marketplace_listings;
create policy "market_listings_read" on public.marketplace_listings for select
  using (status = 'active' or auth.uid() = seller_id or auth.uid() = buyer_id);
drop policy if exists "market_sales_party_read" on public.marketplace_sales;
create policy "market_sales_party_read" on public.marketplace_sales for select
  using (auth.uid() = seller_id or auth.uid() = buyer_id);

-- An actively listed Hero is frozen at the database boundary. The marketplace
-- SECURITY DEFINER functions can still cancel or transfer it atomically.
drop policy if exists "characters_owner_update" on public.characters;
create policy "characters_owner_update" on public.characters for update
  using (auth.uid() = owner_id and not exists (
    select 1 from public.marketplace_listings ml where ml.status = 'active' and ml.asset_type = 'hero' and ml.asset_id = characters.id::text
  ))
  with check (auth.uid() = owner_id);
drop policy if exists "saves_owner_update" on public.game_saves;
create policy "saves_owner_update" on public.game_saves for update
  using (auth.uid() = owner_id and not exists (
    select 1 from public.marketplace_listings ml where ml.status = 'active' and ml.asset_type = 'hero' and ml.asset_id = game_saves.character_id::text
  ))
  with check (auth.uid() = owner_id);

-- No direct insert/update/delete policies exist. Every mutation below locks
-- its rows and runs as one transaction through a SECURITY DEFINER function.

create or replace function public.create_marketplace_listing(
  p_seller_character_id uuid,
  p_asset_type text,
  p_asset_id text,
  p_price numeric,
  p_idempotency_key text
) returns table(listing_id uuid, fee_burned numeric, balance_after numeric)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_owner uuid;
  v_fee numeric(18,6);
  v_min numeric(18,6);
  v_max numeric(18,6);
  v_balance numeric(18,6);
  v_save jsonb;
  v_qty integer;
  v_asset_character uuid;
  v_snapshot jsonb;
  v_title text;
  v_listing uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_asset_type not in ('hero','weapon') or p_idempotency_key is null or char_length(p_idempotency_key) < 8 then raise exception 'invalid_listing'; end if;

  select owner_id into v_owner from public.characters where id = p_seller_character_id and archived_at is null for update;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'character_not_found'; end if;
  select listing_fee, min_price, max_price into v_fee, v_min, v_max from public.marketplace_config where id = true;
  if p_price < v_min or p_price > v_max then raise exception 'invalid_price'; end if;

  -- Idempotent retries return the original successful listing without another burn.
  select id into v_listing from public.marketplace_listings where idempotency_key = p_idempotency_key;
  if v_listing is not null then
    return query select v_listing, 0::numeric, b.balance from public.bhc_balances b where b.character_id = p_seller_character_id;
    return;
  end if;

  if p_asset_type = 'hero' then
    begin v_asset_character := p_asset_id::uuid; exception when invalid_text_representation then raise exception 'invalid_hero'; end;
    if v_asset_character = p_seller_character_id then raise exception 'payout_hero_required'; end if;
    select jsonb_build_object(
      'id', c.id, 'name', c.name, 'class', c.class,
      'save', coalesce(gs.save_data, '{}'::jsonb),
      'nextBattleAt', coalesce((gs.save_data #>> '{dailyBattle,nextBattleAt}')::bigint, 0)
    ), c.name || ' · Level ' || coalesce(gs.save_data->>'combatLevel', '1') || ' ' || c.class
    into v_snapshot, v_title
    from public.characters c left join public.game_saves gs on gs.character_id = c.id
    where c.id = v_asset_character and c.owner_id = auth.uid() and c.archived_at is null for update of c;
    if v_snapshot is null then raise exception 'hero_not_owned'; end if;
  else
    select save_data into v_save from public.game_saves where character_id = p_seller_character_id for update;
    v_qty := coalesce((v_save->'inventory'->>p_asset_id)::integer, 0);
    if v_qty < 1 then raise exception 'weapon_not_owned'; end if;
    if v_save #>> '{equipment,weapon,itemId}' = p_asset_id then raise exception 'weapon_must_be_unequipped'; end if;
    v_snapshot := jsonb_build_object('itemId', p_asset_id, 'investment',
      coalesce((select to_jsonb(i) - 'owner_id' from public.item_investments i where i.character_id = p_seller_character_id and i.item_uid = p_asset_id), '{}'::jsonb));
    v_title := p_asset_id;
    v_save := jsonb_set(v_save, array['inventory', p_asset_id], to_jsonb(v_qty - 1), true);
    update public.game_saves set save_data = v_save, revision = revision + 1, updated_at = now() where character_id = p_seller_character_id;
  end if;

  insert into public.bhc_balances(character_id, owner_id) values (p_seller_character_id, auth.uid()) on conflict (character_id) do nothing;
  select balance into v_balance from public.bhc_balances where character_id = p_seller_character_id for update;
  if v_balance < v_fee then raise exception 'insufficient_bhc'; end if;

  insert into public.marketplace_listings(seller_id, seller_character_id, asset_type, asset_id, title, asset_snapshot, price, listing_fee, idempotency_key)
    values (auth.uid(), p_seller_character_id, p_asset_type, p_asset_id, v_title, v_snapshot, p_price, v_fee, p_idempotency_key)
    returning id into v_listing;
  update public.bhc_balances set balance = balance - v_fee, burned_total = burned_total + v_fee, updated_at = now()
    where character_id = p_seller_character_id returning balance into v_balance;
  insert into public.investment_transactions(owner_id, character_id, investment_type, cost, balance_after, idempotency_key, payload)
    values (auth.uid(), p_seller_character_id, 'marketplace_listing', v_fee, v_balance, 'market-fee:' || p_idempotency_key, jsonb_build_object('listing_id', v_listing));
  return query select v_listing, v_fee, v_balance;
end $$;

create or replace function public.cancel_marketplace_listing(p_listing_id uuid)
returns table(listing_id uuid, status text, fee_refunded numeric)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_listing public.marketplace_listings%rowtype; v_save jsonb; v_qty integer;
begin
  select * into v_listing from public.marketplace_listings where id = p_listing_id for update;
  if v_listing.id is null or v_listing.seller_id <> auth.uid() then raise exception 'listing_not_found'; end if;
  if v_listing.status <> 'active' then raise exception 'listing_not_active'; end if;
  if v_listing.asset_type = 'weapon' then
    select save_data into v_save from public.game_saves where character_id = v_listing.seller_character_id for update;
    v_qty := coalesce((v_save->'inventory'->>v_listing.asset_id)::integer, 0);
    update public.game_saves set save_data = jsonb_set(v_save, array['inventory', v_listing.asset_id], to_jsonb(v_qty + 1), true), revision = revision + 1, updated_at = now()
      where character_id = v_listing.seller_character_id;
  end if;
  update public.marketplace_listings set status = 'cancelled', completed_at = now() where id = p_listing_id;
  return query select p_listing_id, 'cancelled'::text, 0::numeric;
end $$;

create or replace function public.buy_marketplace_listing(
  p_listing_id uuid,
  p_buyer_character_id uuid,
  p_idempotency_key text
) returns table(listing_id uuid, price_paid numeric, buyer_balance numeric)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_listing public.marketplace_listings%rowtype;
  v_buyer_owner uuid;
  v_buyer_balance numeric(18,6);
  v_seller_balance numeric(18,6);
  v_save jsonb;
  v_qty integer;
  v_asset_character uuid;
  v_buyer_heroes integer;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into v_listing from public.marketplace_listings where id = p_listing_id for update;
  if v_listing.id is null then raise exception 'listing_not_found'; end if;
  if v_listing.purchase_idempotency_key = p_idempotency_key and v_listing.buyer_id = auth.uid() then
    return query select v_listing.id, v_listing.price, b.balance from public.bhc_balances b where b.character_id = p_buyer_character_id;
    return;
  end if;
  if v_listing.status <> 'active' then raise exception 'listing_not_active'; end if;
  if v_listing.seller_id = auth.uid() then raise exception 'self_purchase_forbidden'; end if;
  select owner_id into v_buyer_owner from public.characters where id = p_buyer_character_id and archived_at is null for update;
  if v_buyer_owner is null or v_buyer_owner <> auth.uid() then raise exception 'buyer_character_not_found'; end if;

  insert into public.bhc_balances(character_id, owner_id) values (p_buyer_character_id, auth.uid()) on conflict (character_id) do nothing;
  select balance into v_buyer_balance from public.bhc_balances where character_id = p_buyer_character_id for update;
  select balance into v_seller_balance from public.bhc_balances where character_id = v_listing.seller_character_id for update;
  if v_buyer_balance < v_listing.price then raise exception 'insufficient_bhc'; end if;

  update public.bhc_balances set balance = balance - v_listing.price, updated_at = now() where character_id = p_buyer_character_id returning balance into v_buyer_balance;
  update public.bhc_balances set balance = balance + v_listing.price, updated_at = now() where character_id = v_listing.seller_character_id returning balance into v_seller_balance;

  if v_listing.asset_type = 'weapon' then
    select save_data into v_save from public.game_saves where character_id = p_buyer_character_id for update;
    v_qty := coalesce((v_save->'inventory'->>v_listing.asset_id)::integer, 0);
    update public.game_saves set save_data = jsonb_set(v_save, array['inventory', v_listing.asset_id], to_jsonb(v_qty + 1), true), revision = revision + 1, updated_at = now()
      where character_id = p_buyer_character_id;
  else
    v_asset_character := v_listing.asset_id::uuid;
    select count(*) into v_buyer_heroes from public.characters where owner_id = auth.uid() and archived_at is null;
    if v_buyer_heroes >= 3 then raise exception 'hero_slots_full'; end if;
    -- Move the sold Hero's wallet into the seller's payout Hero before ownership changes.
    update public.bhc_balances payout set balance = payout.balance + sold.balance, burned_total = payout.burned_total + sold.burned_total, updated_at = now()
      from public.bhc_balances sold where payout.character_id = v_listing.seller_character_id and sold.character_id = v_asset_character;
    delete from public.bhc_balances where character_id = v_asset_character;
    update public.characters set owner_id = auth.uid(), updated_at = now() where id = v_asset_character;
    update public.game_saves set owner_id = auth.uid(), updated_at = now() where character_id = v_asset_character;
    update public.battle_attempts set owner_id = auth.uid() where character_id = v_asset_character;
    update public.progression_events set owner_id = auth.uid() where character_id = v_asset_character;
    update public.character_mail set owner_id = auth.uid() where character_id = v_asset_character;
    update public.item_investments set owner_id = auth.uid() where character_id = v_asset_character;
    update public.investment_transactions set owner_id = auth.uid() where character_id = v_asset_character;
    insert into public.bhc_balances(character_id, owner_id, balance, burned_total) values (v_asset_character, auth.uid(), 0, 0);
    select balance into v_seller_balance from public.bhc_balances where character_id = v_listing.seller_character_id;
  end if;

  update public.marketplace_listings set status = 'sold', buyer_id = auth.uid(), buyer_character_id = p_buyer_character_id,
    purchase_idempotency_key = p_idempotency_key, completed_at = now() where id = p_listing_id;
  insert into public.marketplace_sales(listing_id, seller_id, buyer_id, asset_type, asset_id, price)
    values (p_listing_id, v_listing.seller_id, auth.uid(), v_listing.asset_type, v_listing.asset_id, v_listing.price);
  insert into public.economy_transactions(owner_id, character_id, category, asset_id, delta, balance, reason, idempotency_key)
    values
      (auth.uid(), p_buyer_character_id, 'bhc', 'bhc', -v_listing.price, v_buyer_balance, 'marketplace_purchase', 'market-buy:' || p_idempotency_key),
      (v_listing.seller_id, v_listing.seller_character_id, 'bhc', 'bhc', v_listing.price, v_seller_balance, 'marketplace_sale', 'market-sell:' || p_idempotency_key);
  return query select p_listing_id, v_listing.price, v_buyer_balance;
end $$;

revoke all on function public.create_marketplace_listing(uuid,text,text,numeric,text) from public;
revoke all on function public.cancel_marketplace_listing(uuid) from public;
revoke all on function public.buy_marketplace_listing(uuid,uuid,text) from public;
grant execute on function public.create_marketplace_listing(uuid,text,text,numeric,text) to authenticated;
grant execute on function public.cancel_marketplace_listing(uuid) to authenticated;
grant execute on function public.buy_marketplace_listing(uuid,uuid,text) to authenticated;

-- Preserve the v0.2 daily cadence while rejecting battles from escrowed Heroes.
create or replace function public.claim_daily_battle(p_character_id uuid, p_idempotency_key text)
returns table(attempt_id uuid, next_battle_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid; v_last timestamptz; v_id uuid;
begin
  select owner_id into v_owner from public.characters where id = p_character_id and archived_at is null for update;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'character_not_found'; end if;
  if exists (select 1 from public.marketplace_listings where status = 'active' and asset_type = 'hero' and asset_id = p_character_id::text) then
    raise exception 'hero_market_locked';
  end if;
  select max(started_at) into v_last from public.battle_attempts where character_id = p_character_id;
  if v_last is not null and v_last + interval '24 hours' > now() then raise exception 'battle_cooldown'; end if;
  insert into public.battle_attempts(owner_id, character_id, idempotency_key) values (auth.uid(), p_character_id, p_idempotency_key) returning id into v_id;
  return query select v_id, now() + interval '24 hours';
end $$;
revoke all on function public.claim_daily_battle(uuid,text) from public;
grant execute on function public.claim_daily_battle(uuid,text) to authenticated;
