-- Guest service bookings: no account, no login. Visitors submit through a
-- server action (which validates, rate-limits and inserts with the service
-- role), so there are deliberately NO public policies on this table — the
-- browser can neither read nor write it. Only staff can see or change
-- bookings, since they contain names, emails and phone numbers.

create type booking_status as enum ('pending', 'confirmed', 'declined', 'cancelled', 'completed');

create table bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services (id) on delete set null,
  service_title text not null, -- snapshot, so the booking still reads correctly if the service is renamed/deleted
  name text not null,
  email text not null,
  phone text,
  preferred_date date,
  preferred_time text,
  message text,
  status booking_status not null default 'pending',
  confirmed_date date,
  confirmed_time text,
  internal_notes text,
  guest_key text, -- anonymous cookie id, used only for rate limiting
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_status_created_idx on bookings (status, created_at desc);
create index bookings_email_created_idx on bookings (email, created_at desc);
create index bookings_guest_created_idx on bookings (guest_key, created_at desc);

alter table bookings enable row level security;
create policy bookings_staff_all on bookings for all using (is_staff()) with check (is_staff());
