-- Audit log: an append-only record of important admin actions.
--
-- Two writers:
--   1. Database triggers on the content-bearing tables (below). They fire for
--      every change however it was made, so a code path can't forget to log.
--      They record WHO (from the request's login token), WHAT (table + row),
--      WHICH FIELDS changed and, for a short allow-list of non-sensitive
--      fields (status, role, sales mode, price, visibility...), the before
--      and after. Free-text bodies, emails, notes and settings values are
--      never copied into the log.
--   2. The app server (service role) for events that aren't row changes:
--      sign-in, failed sign-in, sign-out.
--
-- Nobody can edit or delete log rows: there is no update/delete policy, and a
-- trigger refuses updates, deletes and truncation even from the service role.
-- Only admins and super admins can read it. A logging failure never blocks the
-- change being logged (it raises a warning instead).

create table if not exists audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  entity_label text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists audit_log_created_idx on audit_log (created_at desc);
create index if not exists audit_log_action_idx on audit_log (action, created_at desc);
create index if not exists audit_log_actor_idx on audit_log (actor_id, created_at desc);
create index if not exists audit_log_entity_idx on audit_log (entity_type, entity_id);

alter table audit_log enable row level security;

drop policy if exists audit_log_admin_select on audit_log;
create policy audit_log_admin_select on audit_log for select using (is_admin());

create or replace function audit_log_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;

drop trigger if exists audit_log_no_change on audit_log;
create trigger audit_log_no_change before update or delete on audit_log
  for each row execute function audit_log_immutable();

drop trigger if exists audit_log_no_truncate on audit_log;
create trigger audit_log_no_truncate before truncate on audit_log
  for each statement execute function audit_log_immutable();

create or replace function audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_j jsonb;
  old_j jsonb;
  row_j jsonb;
  act text;
  k text;
  changed text[] := '{}';
  meta jsonb := '{}'::jsonb;
  label text;
  tracked constant text[] := array['status', 'role', 'sales_mode', 'active', 'featured', 'price_cents', 'currency', 'access', 'visibility', 'booking_enabled'];
  ignored constant text[] := array['updated_at', 'moderated_at', 'moderated_by'];
  jwt jsonb := auth.jwt();
  publishable constant text[] := array['content', 'books', 'products', 'services'];
begin
  begin
    if tg_op <> 'DELETE' then new_j := to_jsonb(new); end if;
    if tg_op <> 'INSERT' then old_j := to_jsonb(old); end if;
    row_j := coalesce(new_j, old_j);
    act := tg_table_name || '.' || lower(tg_op);

    if tg_op = 'UPDATE' then
      for k in select jsonb_object_keys(new_j) loop
        if not (k = any (ignored)) and (new_j -> k) is distinct from (old_j -> k) then
          changed := changed || k;
          if k = any (tracked) then
            meta := meta || jsonb_build_object(k, jsonb_build_object('from', old_j -> k, 'to', new_j -> k));
          end if;
        end if;
      end loop;
      if array_length(changed, 1) is null then
        return null; -- nothing meaningful changed
      end if;
      meta := meta || jsonb_build_object('changed', to_jsonb(changed));

      if 'status' = any (changed) then
        if tg_table_name = any (publishable) then
          if new_j ->> 'status' = 'published' then act := tg_table_name || '.publish';
          elsif old_j ->> 'status' = 'published' then act := tg_table_name || '.unpublish';
          elsif new_j ->> 'status' = 'archived' then act := tg_table_name || '.archive';
          end if;
        else
          act := tg_table_name || '.status_change';
        end if;
      end if;
    end if;

    if tg_table_name = 'profiles' then
      -- Ordinary readers get a profile automatically; only staff-role changes matter.
      if tg_op = 'INSERT' and (new_j ->> 'role') is null then return null; end if;
      if tg_op = 'UPDATE' then
        if not ('role' = any (changed)) then return null; end if;
        act := 'profiles.role_change';
      end if;
      if tg_op = 'DELETE' and (old_j ->> 'role') is null then return null; end if;
    end if;

    if tg_table_name in ('bookings', 'comments', 'profiles') then
      label := initcap(tg_table_name) || ' ' || left(row_j ->> 'id', 8);
    else
      label := coalesce(row_j ->> 'title', row_j ->> 'label', row_j ->> 'name', row_j ->> 'original_name',
                        row_j ->> 'slug', row_j ->> 'platform', row_j ->> 'key', 'record ' || left(row_j ->> 'id', 8));
    end if;

    insert into audit_log (actor_id, actor_email, action, entity_type, entity_id, entity_label, metadata)
    values (
      auth.uid(),
      jwt ->> 'email',
      act,
      tg_table_name,
      row_j ->> 'id',
      left(label, 200),
      meta || jsonb_build_object('via', coalesce(jwt ->> 'role', 'database'))
    );
  exception when others then
    raise warning 'audit_row_change failed for %.%: %', tg_table_name, tg_op, sqlerrm;
  end;
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'content', 'books', 'book_files', 'products', 'services', 'bookings', 'comments',
    'ad_placements', 'social_accounts', 'research_profiles', 'selected_work',
    'site_settings', 'redirects', 'media_assets', 'profiles'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists audit_%1$s on public.%1$I', t);
      execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function audit_row_change()', t);
    end if;
  end loop;
end;
$$;
