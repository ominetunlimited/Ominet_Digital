-- Homepage hero becomes a slideshow drawn from media_assets, the same
-- opt-in pattern as show_on_studio (0026) and show_on_photography (0027):
-- defaults false, so nothing changes until an admin picks images for it
-- (Admin -> Media Library -> edit an image -> "Show in Homepage Hero").
-- attribution_url pairs with the existing free-text `attribution` column
-- (0026) so a credit like "Photo by Dmytro Sheremeta" can link out to
-- where the image came from.
alter table media_assets add column if not exists show_on_hero boolean not null default false;
alter table media_assets add column if not exists attribution_url text;
create index if not exists media_assets_hero_idx on media_assets (show_on_hero, display_order, created_at desc);
