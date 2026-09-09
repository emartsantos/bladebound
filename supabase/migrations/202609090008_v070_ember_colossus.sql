-- v0.7.0 event progress lives inside save_data JSON.
do $$
begin
  if to_regclass('public.game_saves') is not null then
    alter table public.game_saves alter column schema_version set default 9;
  end if;
end
$$;
