-- Additive only: extends bookings so the Discuss a Project form can store a full enquiry.
alter table public.bookings add column if not exists reference text;
alter table public.bookings add column if not exists enquiry_kind text not null default 'service_request';
alter table public.bookings add column if not exists service_ids uuid[] not null default '{}';
alter table public.bookings add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.bookings add column if not exists email_status jsonb not null default '{}'::jsonb;
create unique index if not exists bookings_reference_key on public.bookings (reference) where reference is not null;
create index if not exists bookings_email_created_idx on public.bookings (email, created_at desc);
