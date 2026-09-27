-- Redirect manager (Stage 15). The `redirects` table itself already existed
-- (0001_init.sql) but nothing ever read it — this wires it up and adds the
-- tracking columns the admin needs (hit count, last hit, created/updated).
--
-- Redirects are served by a last-resort catch-all page
-- (src/app/[...catchall]/page.tsx) that only runs when nothing else on the
-- site matches the URL — a real page always wins, so a redirect entry can
-- never hijack a working route. 301 is served as an HTTP 308 (permanent) and
-- 302 as a 307 (temporary): Next's App Router only exposes those two codes
-- from a page, and search engines treat 308/301 and 307/302 as equivalent.
-- Loop prevention (a redirect chain that would lead back to its own start)
-- is checked in the admin server action before a redirect is saved.

alter table redirects add column if not exists hit_count integer not null default 0;
alter table redirects add column if not exists last_hit_at timestamptz;
alter table redirects add column if not exists archived boolean not null default false;
alter table redirects add column if not exists created_at timestamptz not null default now();
alter table redirects add column if not exists updated_at timestamptz not null default now();

alter table redirects drop constraint if exists redirects_status_code_check;
alter table redirects add constraint redirects_status_code_check check (status_code in (301, 302));

drop policy if exists redirects_public_select on redirects;
create policy redirects_public_select on redirects for select using (active and not archived);
-- redirects_staff_write (from 0001_init.sql) already gives staff full CRUD and still applies.

create index if not exists redirects_lookup_idx on redirects (from_path) where active and not archived;

-- Records one hit without giving the public any other access to the table.
-- SECURITY DEFINER so the catch-all page (run as an anonymous visitor) can
-- call it directly; it can only ever increment a counter on a live redirect.
create or replace function record_redirect_hit(target_path text)
returns void
language sql
security definer
set search_path = public
as $$
  update redirects
  set hit_count = hit_count + 1, last_hit_at = now()
  where from_path = target_path and active and not archived;
$$;
revoke all on function record_redirect_hit(text) from public;
grant execute on function record_redirect_hit(text) to anon, authenticated;

do $$
begin
  if to_regprocedure('audit_row_change()') is not null then
    drop trigger if exists audit_redirects on public.redirects;
    create trigger audit_redirects after insert or update or delete on public.redirects
      for each row execute function audit_row_change();
  end if;
end;
$$;
