-- v0.8.0 event framework state is persisted inside save_data JSON.
do $$
begin
  if to_regclass('public.game_saves') is not null then
    alter table public.game_saves alter column schema_version set default 10;
  end if;
end
$$;
