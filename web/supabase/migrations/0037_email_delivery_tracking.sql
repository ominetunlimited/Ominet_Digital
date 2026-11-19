-- Delivery tracking from Mailgun webhooks (additive).
alter table public.email_log add column if not exists delivery_status text
  check (delivery_status in ('delivered','opened','clicked','deferred','bounced','complained','unsubscribed','rejected'));
alter table public.email_log add column if not exists delivery_detail text;
alter table public.email_log add column if not exists delivered_at timestamptz;
alter table public.email_log add column if not exists last_event_at timestamptz;
create index if not exists email_log_provider_idx on public.email_log (provider_id) where provider_id is not null;

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  email_log_id uuid references public.email_log(id) on delete set null,
  provider_id text,
  event text not null,
  recipient text,
  reason text,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);
create unique index if not exists email_events_event_id_key on public.email_events (event_id);
create index if not exists email_events_log_idx on public.email_events (email_log_id, occurred_at desc);
alter table public.email_events enable row level security;
drop policy if exists email_events_staff_read on public.email_events;
create policy email_events_staff_read on public.email_events for select using ((select public.is_staff()));
