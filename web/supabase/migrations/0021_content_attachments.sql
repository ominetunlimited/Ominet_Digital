-- Lets an article/essay carry one downloadable document (PDF or DOCX)
-- alongside — or instead of — its body text. The file itself lives in a
-- PRIVATE storage bucket ("content-files", created by a script with the
-- service role, same as book-files); this migration only adds the metadata
-- columns. The storage path is never selected by public-facing queries (see
-- src/lib/data.ts) — only the app's own gated download route reads it, via
-- the service role, after checking the article is published and (for paid
-- articles) that the reader actually owns it. A bare path string leaking
-- would still be harmless (the bucket has no public-read policy and refuses
-- unsigned requests), but there is no reason to hand it out regardless.

alter table content add column if not exists attachment_storage_path text;
alter table content add column if not exists attachment_original_name text;
alter table content add column if not exists attachment_format text;
alter table content add column if not exists attachment_size_bytes bigint;

alter table content drop constraint if exists content_attachment_format_check;
alter table content add constraint content_attachment_format_check
  check (attachment_format is null or attachment_format in ('pdf', 'docx'));

alter table content drop constraint if exists content_attachment_complete_check;
alter table content add constraint content_attachment_complete_check check (
  (attachment_storage_path is null and attachment_original_name is null and attachment_format is null and attachment_size_bytes is null)
  or (attachment_storage_path is not null and attachment_original_name is not null and attachment_format is not null and attachment_size_bytes is not null)
);

-- One row per attachment handed out — the basis for rate limiting, mirroring
-- book_downloads (0013_book_delivery.sql). Staff-read only; written by the
-- server (service role) from src/app/api/content/download/route.ts.
create table if not exists content_downloads (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references content (id) on delete cascade,
  guest_key text,
  created_at timestamptz not null default now()
);
create index if not exists content_downloads_content_idx on content_downloads (content_id, created_at desc);
create index if not exists content_downloads_guest_idx on content_downloads (guest_key, created_at desc);

alter table content_downloads enable row level security;
drop policy if exists content_downloads_staff_select on content_downloads;
create policy content_downloads_staff_select on content_downloads for select using (is_staff());
