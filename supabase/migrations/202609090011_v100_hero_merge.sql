-- Bladehound v1.0.0 hero merge: character and summon hero are one "Hero" system.
-- Every account holds up to 5 heroes; the free starter is always common.
-- The characters table gains a rarity column (with optional summon link).

alter table public.characters
  add column if not exists rarity text not null default 'common'
    check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary'));

alter table public.characters
  add column if not exists summon_id text;

create index if not exists characters_owner_rarity_idx
  on public.characters (owner_id, rarity);