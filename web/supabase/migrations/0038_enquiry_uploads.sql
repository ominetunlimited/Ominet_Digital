-- Reference files attached to project enquiries. Private bucket; the server uploads with the service role
-- and staff read through short-lived signed links. No public policies are created on purpose.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('enquiry-files', 'enquiry-files', false, 4194304,
  array['application/pdf','image/png','image/jpeg','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.enquiry_uploads (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  original_name text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 4194304),
  mime text not null,
  uploader text not null,
  booking_id uuid references public.bookings(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists enquiry_uploads_booking_idx on public.enquiry_uploads (booking_id);
create index if not exists enquiry_uploads_pending_idx on public.enquiry_uploads (uploader, created_at) where booking_id is null;
alter table public.enquiry_uploads enable row level security;
drop policy if exists enquiry_uploads_staff_read on public.enquiry_uploads;
create policy enquiry_uploads_staff_read on public.enquiry_uploads for select using ((select public.is_staff()));
