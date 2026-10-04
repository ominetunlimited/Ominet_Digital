-- Star ratings (1-5) + an optional written review, on either a book or an
-- article. Same shape and identity pattern as comments (0004/0006/0026):
-- user_id OR anon_key+guest_name, moderated (comment_status) before it's
-- public to anyone but its own author and staff. One review per
-- reader/guest per item (unique indexes below) -- posting again isn't
-- supported, only delete-and-repost, same as comments.
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete cascade,
  anon_key text,
  guest_name text,
  content_id uuid references content (id) on delete cascade,
  book_id uuid references books (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text,
  status comment_status not null default 'pending',
  moderated_at timestamptz,
  moderated_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint reviews_target check (content_id is not null or book_id is not null),
  constraint reviews_identity check (user_id is not null or anon_key is not null)
);

create index if not exists reviews_content_idx on reviews (content_id, status);
create index if not exists reviews_book_idx on reviews (book_id, status);
create unique index if not exists reviews_user_content_uidx on reviews (user_id, content_id) where user_id is not null and content_id is not null;
create unique index if not exists reviews_user_book_uidx on reviews (user_id, book_id) where user_id is not null and book_id is not null;
create unique index if not exists reviews_anon_content_uidx on reviews (anon_key, content_id) where anon_key is not null and content_id is not null;
create unique index if not exists reviews_anon_book_uidx on reviews (anon_key, book_id) where anon_key is not null and book_id is not null;

alter table reviews enable row level security;
drop policy if exists reviews_public_select on reviews;
create policy reviews_public_select on reviews for select using (
  status = 'approved' or user_id = auth.uid() or (user_id is null and anon_key is not null) or is_staff()
);
drop policy if exists reviews_owner_insert on reviews;
create policy reviews_owner_insert on reviews for insert with check (
  (user_id is not null and user_id = auth.uid()) or (user_id is null and anon_key is not null)
);
drop policy if exists reviews_owner_or_staff_delete on reviews;
create policy reviews_owner_or_staff_delete on reviews for delete using (user_id = auth.uid() or is_staff());
drop policy if exists reviews_staff_update on reviews;
create policy reviews_staff_update on reviews for update using (is_staff()) with check (is_staff());
