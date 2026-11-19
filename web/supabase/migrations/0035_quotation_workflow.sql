-- Quotation and booking workflow (additive). Staff-only via is_staff() RLS.

alter table public.bookings add column if not exists stage text not null default 'new_enquiry';
alter table public.bookings drop constraint if exists bookings_stage_check;
alter table public.bookings add constraint bookings_stage_check check (stage in (
  'new_enquiry','under_review','awaiting_info','quotation_prepared','quotation_sent','negotiation',
  'awaiting_acceptance','awaiting_payment','booking_confirmed','in_progress','awaiting_review','completed','cancelled','archived'));
alter table public.bookings add column if not exists booking_ref text;
alter table public.bookings add column if not exists agreed_quotation_id uuid;
alter table public.bookings add column if not exists location text;
alter table public.bookings add column if not exists event_date date;
create unique index if not exists bookings_booking_ref_key on public.bookings (booking_ref) where booking_ref is not null;

-- Existing rows keep their meaning.
update public.bookings set stage = case status::text
  when 'confirmed' then 'booking_confirmed' when 'completed' then 'completed'
  when 'declined' then 'cancelled' when 'cancelled' then 'cancelled' else 'new_enquiry' end
where stage = 'new_enquiry' and status::text <> 'pending';

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reference text not null,
  version int not null,
  status text not null default 'draft' check (status in ('draft','sent','superseded','accepted','declined','expired')),
  scope text,
  price_cents bigint not null check (price_cents >= 0),
  discount_cents bigint not null default 0 check (discount_cents >= 0),
  currency text not null default 'NGN',
  duration text,
  start_date date,
  completion_date date,
  location text,
  event_date date,
  deliverables text,
  milestones jsonb not null default '[]'::jsonb,
  payment_terms text,
  revision_terms text,
  conditions text,
  expiry_date date,
  sent_at timestamptz,
  responded_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, version)
);
create index if not exists quotations_booking_idx on public.quotations (booking_id, version desc);
create unique index if not exists quotations_reference_version_key on public.quotations (reference, version);

alter table public.bookings drop constraint if exists bookings_agreed_quotation_fk;
alter table public.bookings add constraint bookings_agreed_quotation_fk foreign key (agreed_quotation_id) references public.quotations(id) on delete set null;
create index if not exists bookings_agreed_quotation_idx on public.bookings (agreed_quotation_id);

create table if not exists public.enquiry_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  kind text not null,
  from_stage text,
  to_stage text,
  note text,
  actor uuid,
  created_at timestamptz not null default now()
);
create index if not exists enquiry_events_booking_idx on public.enquiry_events (booking_id, created_at desc);

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  quotation_id uuid references public.quotations(id) on delete set null,
  kind text not null,
  recipient text not null,
  subject text not null,
  status text not null check (status in ('accepted','failed','not_configured')),
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists email_log_created_idx on public.email_log (created_at desc);
create index if not exists email_log_booking_idx on public.email_log (booking_id);
create index if not exists email_log_quotation_idx on public.email_log (quotation_id);

alter table public.quotations enable row level security;
alter table public.enquiry_events enable row level security;
alter table public.email_log enable row level security;
create policy quotations_staff_all on public.quotations for all using ((select public.is_staff())) with check ((select public.is_staff()));
create policy enquiry_events_staff_all on public.enquiry_events for all using ((select public.is_staff())) with check ((select public.is_staff()));
create policy email_log_staff_all on public.email_log for all using ((select public.is_staff())) with check ((select public.is_staff()));
