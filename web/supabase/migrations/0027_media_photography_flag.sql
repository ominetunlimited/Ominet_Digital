-- The Media page's Photography section (src/lib/data.ts getMediaPhotos)
-- used to show every image in the library, including covers, the logo and
-- the hero stock photo uploaded for other purposes — none of that is
-- photography. Same opt-in pattern as media_assets.show_on_studio
-- (0026): defaults false, so nothing shows there until an admin picks
-- real photographs for it (Admin -> Media Library -> edit an image).
alter table media_assets add column if not exists show_on_photography boolean not null default false;
create index if not exists media_assets_photography_idx on media_assets (show_on_photography, created_at desc);
