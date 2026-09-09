-- Bladehound v1.0.3 admin BHC grants.
-- Admins mint pending BHC grants from the Supabase SQL editor:
--
--   select * from public.admin_find_account('runeknightrom');      -- find an account
--   select public.admin_grant_bhc('player@example.com', 1000, 'refund');  -- queue a grant
--
-- A granted row sits in bhc_grants and is atomically claimed by the player on
-- their next session restore (v101/v102 flows), so the balance survives stale
-- local saves.

-- Admin identity list. Seed it (via the management API / postgres role) with
-- the emails allowed to use the admin functions.
create table if not exists public.admin_users (
  owner_email text primary key,
  role text not null default 'admin' check (role in ('admin', 'superadmin')),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
-- No policies: reachable only through the security definer functions below
-- (or the postgres / management role).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a
    where a.owner_email = (select email from auth.users where id = auth.uid())
  );
$$;

-- Search accounts by email or character name (admin only).
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
         (s.save_data->'investment'->>'bhc')::numeric as bhc,
         s.updated_at
  from auth.users u
  left join public.characters c on c.owner_id = u.id and c.archived_at is null
  left join public.game_saves s on s.character_id = c.id
  where u.email ilike '%' || p_search || '%'
     or c.name ilike '%' || p_search || '%'
  order by s.updated_at desc nulls last
  limit 20;
$$;

-- Queue a pending BHC grant for an account by email (admin only).
create or replace function public.admin_grant_bhc(p_owner_email text, p_amount numeric, p_reason text default 'admin grant')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_id  uuid;
begin
  if session_user <> 'postgres' and not public.is_admin() then
    raise exception 'Not authorized to grant BHC';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;
  select u.id into v_uid from auth.users u where u.email = lower(trim(p_owner_email));
  if v_uid is null then
    raise exception 'No account with email %', p_owner_email;
  end if;
  insert into public.bhc_grants (owner_id, amount, reason)
  values (v_uid, round(p_amount, 3), coalesce(nullif(trim(p_reason), ''), 'admin grant'))
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.admin_find_account(text) to authenticated;
grant execute on function public.admin_grant_bhc(text, numeric, text) to authenticated;
-- is_admin() is intentionally not public: only the definer functions use it.