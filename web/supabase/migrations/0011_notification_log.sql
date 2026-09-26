-- Telegram alerts must never break the thing that triggered them, and must
-- not spam or double-send. This log is how: a unique dedupe_key means a
-- retried webhook or a double-clicked button can't send the same alert
-- twice, and counting recent rows gives a simple send-rate ceiling. It also
-- records failures (with secrets redacted) so a broken bot is visible in
-- the admin instead of failing silently.
--
-- Written only by the server (service role). Staff can read it; nobody else.

create table notification_log (
  id bigint generated always as identity primary key,
  channel text not null default 'telegram',
  event_type text not null,
  dedupe_key text unique,
  status text not null, -- sent | failed | skipped | rate_limited | not_configured
  error text,
  created_at timestamptz not null default now()
);

create index notification_log_created_idx on notification_log (created_at desc);

alter table notification_log enable row level security;
create policy notification_log_staff_select on notification_log for select using (is_staff());
