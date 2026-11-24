-- Public read counters for blog posts, articles and books.
-- Reads are counted by /api/read (same-origin, rate limited, one count per visitor
-- per item per few hours, only for items that exist and are published).
-- The counter itself is only writable through a function that the service role alone may run.

create table if not exists read_counts (
  kind text not null check (kind in ('blog', 'articles', 'books')),
  slug text not null,
  reads bigint not null default 0 check (reads >= 0),
  updated_at timestamptz not null default now(),
  primary key (kind, slug)
);

alter table read_counts enable row level security;

drop policy if exists read_counts_public_select on read_counts;
create policy read_counts_public_select on read_counts for select using (true);
-- No insert/update/delete policies: only the service role (which bypasses RLS) writes.

create or replace function increment_read(p_kind text, p_slug text)
returns bigint
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into read_counts (kind, slug, reads) values (p_kind, p_slug, 1)
  on conflict (kind, slug) do update set reads = read_counts.reads + 1, updated_at = now()
  returning reads;
$$;

revoke all on function increment_read(text, text) from public, anon, authenticated;
grant execute on function increment_read(text, text) to service_role;

-- Start from real history: every page view already recorded for these paths.
insert into read_counts (kind, slug, reads)
select split_part(trim(both '/' from split_part(path, '?', 1)), '/', 1) as kind,
       split_part(trim(both '/' from split_part(path, '?', 1)), '/', 2) as slug,
       count(*)
from analytics_events
where event_type = 'page_view'
  and path ~ '^/(blog|articles|books)/[^/?#]+/?($|\?)'
group by 1, 2
on conflict (kind, slug) do nothing;
