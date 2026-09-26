-- Ominet Digital's public-access model does not require visitors to create
-- an account for anything as low-stakes as a like (see project spec section
-- 7). Likes were previously keyed only by user_id (NOT NULL, tied to a
-- signed-in reader), which silently forced every "like" through the same
-- magic-link sign-in used for comments. This migration lets a like be keyed
-- by an opaque per-browser anon_key (a cookie, not an account — no email, no
-- password, no profile) instead, while a signed-in reader's likes still work
-- exactly as before.

alter table likes alter column user_id drop not null;
alter table likes add column if not exists anon_key text;

alter table likes drop constraint if exists likes_user_id_content_id_key;
alter table likes drop constraint if exists likes_user_id_book_id_key;
alter table likes add constraint like_identity check (user_id is not null or anon_key is not null);

create unique index if not exists likes_user_content_uidx on likes (user_id, content_id) where user_id is not null and content_id is not null;
create unique index if not exists likes_user_book_uidx on likes (user_id, book_id) where user_id is not null and book_id is not null;
create unique index if not exists likes_anon_content_uidx on likes (anon_key, content_id) where anon_key is not null and content_id is not null;
create unique index if not exists likes_anon_book_uidx on likes (anon_key, book_id) where anon_key is not null and book_id is not null;

drop policy if exists likes_owner_write on likes;
drop policy if exists likes_owner_delete on likes;

-- A signed-in reader can only write their own user_id row (as before). An
-- anonymous like is only ever inserted server-side by toggleLike() with a
-- cookie-derived anon_key — there is no meaningful "owner" check possible
-- for an anonymous row beyond that, matching the spec's own guidance that a
-- simple like only needs "reasonable abuse protection" (rate limiting,
-- duplicate prevention), not account-grade security.
create policy likes_write on likes for insert with check (
  (user_id is not null and user_id = auth.uid()) or (user_id is null and anon_key is not null)
);
create policy likes_delete on likes for delete using (
  (user_id is not null and user_id = auth.uid()) or (user_id is null and anon_key is not null)
);
