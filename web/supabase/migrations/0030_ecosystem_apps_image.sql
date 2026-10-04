-- Lets an admin attach a logo/image to each ecosystem app entry (Admin ->
-- Ecosystem apps), shown on the public Partners & Services strip
-- (src/components/PartnersStrip.tsx) under the homepage hero, and on
-- /profile and /cortexa-office. Nullable: an entry with no image just
-- shows its title/description, same as before this column existed.
alter table ecosystem_apps add column if not exists image_url text;
