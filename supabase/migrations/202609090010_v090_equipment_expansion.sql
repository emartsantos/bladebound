-- Bladehound v0.9.0 — Equipment Expansion
-- Adds affix storage to existing JSON saves without resetting characters.
do $$
begin
  if to_regclass('public.game_saves') is not null then
    update public.game_saves
    set save_data = jsonb_set(
      coalesce(save_data, '{}'::jsonb),
      '{forgedEquipmentAffixes}',
      coalesce(save_data->'forgedEquipmentAffixes', '{}'::jsonb),
      true
    )
    where save_data->'forgedEquipmentAffixes' is null;

    alter table public.game_saves alter column schema_version set default 11;
  end if;
end
$$;
