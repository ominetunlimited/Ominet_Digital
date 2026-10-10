-- RLS safety net.
--
-- Every table created in 0001–0032 already has row level security enabled and
-- an explicit policy set. This migration is a guard rail for the FUTURE: if a
-- later migration adds a table in the public schema but forgets
-- `alter table … enable row level security`, that table would be wide open to
-- the anon key (Supabase does NOT enable RLS by default). Running this after
-- any schema change force-enables RLS on every public table that is missing
-- it, so a forgotten table fails closed (no access) instead of open (all
-- access). Add the real policies alongside it — this only guarantees the
-- lock exists, not that the door is unlocked for the right people.
--
-- Safe to run repeatedly. It only ever ADDS rls enforcement; it never disables
-- it and never touches policies.

do $$
declare
  t text;
  enabled_count int := 0;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'          -- ordinary tables only (not views/sequences)
      and not c.relrowsecurity      -- RLS currently OFF
  loop
    execute format('alter table public.%I enable row level security', t);
    enabled_count := enabled_count + 1;
    raise warning 'RLS safety net: enabled row level security on public.% (add an explicit policy for it!)', t;
  end loop;

  if enabled_count = 0 then
    raise notice 'RLS safety net: all public tables already have row level security enabled.';
  end if;
end $$;
