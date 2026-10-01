-- Three independent additions:
--
-- 1. Guest comments. Same identity pattern already used for likes
--    (0005_anonymous_likes.sql) — user_id becomes optional, a guest is
--    identified by anon_key (the httpOnly omd_anon cookie) instead, plus a
--    display name since there's no profile to pull one from. Whether guest
--    commenting is actually offered is a Site settings toggle (checked in
--    the server action, src/lib/engagement-actions.ts) — this migration
--    only makes the row shape capable of it.
alter table comments alter column user_id drop not null;
alter table comments add column if not exists anon_key text;
alter table comments add column if not exists guest_name text;
alter table comments drop constraint if exists comments_identity_check;
alter table comments add constraint comments_identity_check check (user_id is not null or anon_key is not null);

drop policy if exists comments_owner_insert on comments;
create policy comments_owner_insert on comments for insert with check (
  (user_id is not null and user_id = auth.uid()) or (user_id is null and anon_key is not null)
);
drop policy if exists comments_public_select on comments;
create policy comments_public_select on comments for select using (
  status = 'approved' or user_id = auth.uid() or (user_id is null and anon_key is not null) or is_staff()
);
drop policy if exists comments_owner_or_staff_delete on comments;
create policy comments_owner_or_staff_delete on comments for delete using (
  user_id = auth.uid() or is_staff()
);

-- 2. Studio gallery fields on media_assets — lets an uploaded image/video/
--    audio file be shown on the /ominet-digital (Studio) page with credit
--    and a download allowed/blocked choice, instead of the page's previous
--    hardcoded placeholder project list.
alter table media_assets add column if not exists attribution text;
alter table media_assets add column if not exists allow_download boolean not null default true;
alter table media_assets add column if not exists show_on_studio boolean not null default false;
alter table media_assets add column if not exists display_order int not null default 0;
create index if not exists media_assets_studio_idx on media_assets (show_on_studio, display_order);

-- 3. content.featured already exists (0022) and already backs "Sort:
--    Featured" on the Writing page; this just confirms no new column is
--    needed for the homepage to prefer it too (see src/lib/data.ts).
