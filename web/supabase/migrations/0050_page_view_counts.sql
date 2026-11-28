-- Total first-party page views per public path, for the admin lists.
-- security invoker: the caller's own row-level security applies, so only staff (analytics_staff_select) get counts.
create index if not exists analytics_events_page_view_path_idx
  on public.analytics_events (path)
  where event_type = 'page_view';

create or replace function public.page_view_counts(p_paths text[])
returns table(path text, views bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select e.path, count(*)::bigint
  from public.analytics_events e
  where e.event_type = 'page_view' and e.path = any(p_paths)
  group by e.path
$$;

revoke execute on function public.page_view_counts(text[]) from public, anon;
grant execute on function public.page_view_counts(text[]) to authenticated;
