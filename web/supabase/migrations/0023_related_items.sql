-- Internal linking: lets staff connect any two of {content, book, service}
-- ("this essay relates to that book", "this service relates to this
-- article") and shows a "Related" section on both sides — one row covers
-- both directions when rendering (see src/lib/related.ts).
--
-- No single-table foreign key works here since source/target can each be
-- one of three different tables, so integrity (the row points at something
-- real) is enforced in the server action (src/lib/admin/related-actions.ts)
-- rather than a DB constraint. Publicly readable like content_tags; staff-
-- only write.

create table if not exists related_items (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('content', 'book', 'service')),
  source_id uuid not null,
  target_type text not null check (target_type in ('content', 'book', 'service')),
  target_id uuid not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint related_items_not_self check (not (source_type = target_type and source_id = target_id))
);

create index if not exists related_items_source_idx on related_items (source_type, source_id);
create index if not exists related_items_target_idx on related_items (target_type, target_id);

alter table related_items enable row level security;
drop policy if exists related_items_public_select on related_items;
create policy related_items_public_select on related_items for select using (true);
drop policy if exists related_items_staff_write on related_items;
create policy related_items_staff_write on related_items for all using (is_staff()) with check (is_staff());
