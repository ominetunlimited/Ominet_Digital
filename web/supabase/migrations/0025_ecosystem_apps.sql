-- A scalable, admin-managed list of the apps/sites Ominet Digital runs
-- outside the main site (PROFILE, Cortexa Office, and whatever's added
-- later) — separate from the two hand-built pages (/profile,
-- /cortexa-office), which keep their own private/public switch in
-- site_settings. This table is what lets new ones be added without a code
-- change: title, description, the external URL, and a private/public
-- visibility switch, same idea as a book/article's status.

create table if not exists ecosystem_apps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  url text not null,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ecosystem_apps_order_idx on ecosystem_apps (display_order, created_at);

alter table ecosystem_apps enable row level security;
drop policy if exists ecosystem_apps_public_select on ecosystem_apps;
create policy ecosystem_apps_public_select on ecosystem_apps for select using (visibility = 'public' or is_staff());
drop policy if exists ecosystem_apps_staff_write on ecosystem_apps;
create policy ecosystem_apps_staff_write on ecosystem_apps for all using (is_staff()) with check (is_staff());
