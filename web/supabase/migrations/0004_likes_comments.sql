-- Likes and comments on content (articles/essays/...) and books, plus a
-- like-style reaction on individual comments. Keyed by user_id, referencing
-- profiles (not auth.users directly) so PostgREST can embed the commenter's
-- display_name in a normal select — every auth user already gets a profiles
-- row via the handle_new_user trigger in 0001, so this is a 1:1 stand-in for
-- auth.users with the same cascade-delete behavior.

create table likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  content_id uuid references content (id) on delete cascade,
  book_id uuid references books (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint like_target check (content_id is not null or book_id is not null),
  unique (user_id, content_id),
  unique (user_id, book_id)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  content_id uuid references content (id) on delete cascade,
  book_id uuid references books (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint comment_target check (content_id is not null or book_id is not null)
);

create table comment_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  comment_id uuid not null references comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, comment_id)
);

create index likes_content_idx on likes (content_id);
create index likes_book_idx on likes (book_id);
create index comments_content_idx on comments (content_id, created_at desc);
create index comments_book_idx on comments (book_id, created_at desc);
create index comment_reactions_comment_idx on comment_reactions (comment_id);

alter table likes enable row level security;
alter table comments enable row level security;
alter table comment_reactions enable row level security;

-- Counts/lists are public (shown to every visitor); writes are limited to
-- the signed-in reader's own row. Staff can delete any comment (moderation).
create policy likes_public_select on likes for select using (true);
create policy likes_owner_write on likes for insert with check (user_id = auth.uid());
create policy likes_owner_delete on likes for delete using (user_id = auth.uid());

create policy comments_public_select on comments for select using (true);
create policy comments_owner_insert on comments for insert with check (user_id = auth.uid());
create policy comments_owner_or_staff_delete on comments for delete using (user_id = auth.uid() or is_staff());

create policy comment_reactions_public_select on comment_reactions for select using (true);
create policy comment_reactions_owner_write on comment_reactions for insert with check (user_id = auth.uid());
create policy comment_reactions_owner_delete on comment_reactions for delete using (user_id = auth.uid());
