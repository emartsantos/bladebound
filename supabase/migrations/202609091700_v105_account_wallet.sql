-- Bladehound v1.0.5: account-wide BHC.
-- BHC moves from per-character save data to ONE wallet per account. Every
-- character's save mirrors the wallet balance, so summoning or winning BHC on
-- any hero changes the balance every hero shows. Grants now credit the wallet;
-- a stale-wallet guard (same rule as game_saves) stops pre-grant clients from
-- overwriting a freshly credited balance.

create table if not exists public.account_wallets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  balance numeric(12,3) not null default 0 check (balance >= 0),
  burned_total numeric(12,3) not null default 0 check (burned_total >= 0),
  grants_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_wallets enable row level security;

drop policy if exists "wallet_owner_read" on public.account_wallets;
create policy "wallet_owner_read" on public.account_wallets
  for select using (auth.uid() = owner_id);

drop policy if exists "wallet_owner_insert" on public.account_wallets;
create policy "wallet_owner_insert" on public.account_wallets
  for insert with check (auth.uid() = owner_id);

drop policy if exists "wallet_owner_update" on public.account_wallets;
create policy "wallet_owner_update" on public.account_wallets
  for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Backfill one merged pot per account from the authoritative save data.
insert into public.account_wallets (owner_id, balance, burned_total, updated_at)
select s.owner_id,
       round(sum(coalesce((s.save_data->'investment'->>'bhc')::numeric, 0)), 3),
       round(sum(coalesce((s.save_data->'investment'->>'burnedTotal')::numeric, 0)), 3),
       now()
from public.game_saves s
group by s.owner_id
on conflict (owner_id) do nothing;

-- Clients mirror the pot into account_wallets on every push. Reject a write
-- from a client that has not seen the newest applied grant, exactly like the
-- game_saves guard in v102.
create or replace function public.reject_stale_wallet_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user = 'postgres' then
    return new;
  end if;
  if exists (
    select 1 from public.bhc_grants g
    where g.owner_id = new.owner_id
      and g.applied_at is not null
      and g.applied_at > coalesce(new.grants_seen_at, '-infinity')
  ) then
    raise exception 'STALE_WALLET_GRANT: newer BHC grant must be synced before this wallet is accepted';
  end if;
  return new;
end;
$$;

drop trigger if exists account_wallets_stale_grant_guard on public.account_wallets;
create trigger account_wallets_stale_grant_guard
  before update on public.account_wallets
  for each row execute function public.reject_stale_wallet_save();

-- claim_bhc_grants now credits the account wallet (one pool for the whole
-- account) and stamps the grant time on every save so stale clients cannot
-- write over the new balance.
create or replace function public.claim_bhc_grants(p_owner_id uuid, p_character_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric := 0;
  v_stamp timestamptz;
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
    v_stamp := clock_timestamp();

    insert into public.account_wallets (owner_id, balance, grants_seen_at, updated_at)
    values (p_owner_id, v_total, v_stamp, now())
    on conflict (owner_id) do update
    set balance        = public.account_wallets.balance + v_total,
        grants_seen_at = v_stamp,
        updated_at     = now();

    update public.game_saves
    set grants_seen_at = v_stamp,
        updated_at     = clock_timestamp()
    where owner_id = p_owner_id;
  end if;

  return v_total;
end;
$$;

grant execute on function public.claim_bhc_grants(uuid, uuid) to authenticated;

-- admin_find_account reports the account wallet balance (the single BHC number
-- for the account) instead of one character's save.
create or replace function public.admin_find_account(p_search text)
returns table(email text, user_id uuid, character_name text, character_class text, bhc numeric, updated_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select u.email,
         u.id,
         c.name as character_name,
         c.class as character_class,
         coalesce(w.balance, (s.save_data->'investment'->>'bhc')::numeric) as bhc,
         s.updated_at
  from auth.users u
  left join public.account_wallets w on w.owner_id = u.id
  left join public.characters c on c.owner_id = u.id and c.archived_at is null
  left join public.game_saves s on s.character_id = c.id
  where u.email ilike '%' || p_search || '%'
     or c.name ilike '%' || p_search || '%'
  order by s.updated_at desc nulls last
  limit 20;
$$;

grant execute on function public.admin_find_account(text) to authenticated;