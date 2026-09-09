-- Bladehound v0.6.1 stores per-copy forged rarity inside save_data JSON.
-- Existing saves are upgraded client-side; this default only affects new rows.
-- Some local-only installations do not have the optional cloud-save table.
do $$
begin
  if to_regclass('public.game_saves') is not null then
    alter table public.game_saves alter column schema_version set default 8;
  end if;
end
$$;
