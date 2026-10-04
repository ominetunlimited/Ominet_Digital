-- Holds service credentials (Mailgun today) that an admin sets from the
-- admin centre instead of a Vercel environment variable. Deliberately a
-- separate table from site_settings, which is publicly readable (see the
-- comment at the top of site-settings-validate.ts) -- this one is never
-- exposed to anonymous or non-admin readers.
create table if not exists integration_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles (id) on delete set null
);

alter table integration_settings enable row level security;
drop policy if exists integration_settings_admin_all on integration_settings;
create policy integration_settings_admin_all on integration_settings for all using (is_admin()) with check (is_admin());
