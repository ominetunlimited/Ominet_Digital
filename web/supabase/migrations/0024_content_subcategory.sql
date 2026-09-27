-- A second, finer-grained classification under content.type — e.g. type
-- "fiction" with subcategory "Novel", "Short story" or "Play / Drama". Free
-- text (not a foreign key) since the allowed options per type live in the
-- admin UI (src/components/admin/ContentForm.tsx SUBCATEGORIES map), not the
-- database; optional, so existing rows and types with no subcategory list
-- (e.g. "note") are unaffected.

alter table content add column if not exists subcategory text;
