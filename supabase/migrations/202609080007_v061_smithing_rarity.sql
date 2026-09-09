-- Bladehound v0.6.1 stores per-copy forged rarity inside save_data JSON.
-- Existing saves are upgraded client-side; this default only affects new rows.
alter table public.game_saves
  alter column schema_version set default 8;
