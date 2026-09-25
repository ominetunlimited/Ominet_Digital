-- Optional video attachment on any content item (article, essay, review,
-- interview, etc.) — a YouTube/TikTok/Vimeo/Facebook link with a thumbnail,
-- so a post can carry an embedded video alongside its own cover image.
alter table content add column if not exists video_url text;
alter table content add column if not exists video_thumbnail_url text;
