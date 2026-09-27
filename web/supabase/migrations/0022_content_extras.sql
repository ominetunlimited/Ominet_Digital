-- Two small, independent additions to content (articles/essays):
--
-- 1. featured — same meaning as books.featured / services.featured (already
--    tracked by the generic audit-log trigger, which already lists
--    'featured' among the columns it watches). Backs the Writing page's
--    "Sort: Featured" link, which had nothing to sort by until now.
--
-- 2. external_url / external_label — an optional "also published on
--    ResearchGate" (or Academia.edu, SSRN, a journal site, etc.) link for a
--    specific piece, shown as a button on its page. Free text label so it
--    isn't ResearchGate-only; the UI defaults the label to "ResearchGate"
--    when left blank.

alter table content add column if not exists featured boolean not null default false;
alter table content add column if not exists external_url text;
alter table content add column if not exists external_label text;
