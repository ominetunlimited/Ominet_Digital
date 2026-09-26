-- Academic / research profile links (Google Scholar, ResearchGate, Academia.edu,
-- ORCID, other) managed from the Admin Centre. A dedicated table rather than
-- site_settings, because site_settings is publicly readable and shouldn't
-- become a dumping ground for anything that isn't meant to be public.
--
-- The public can read only ACTIVE rows; staff manage everything. Where a link
-- shows up is chosen per link (footer / profile pages / research articles).

create table if not exists research_profiles (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('google_scholar', 'researchgate', 'academia', 'orcid', 'other')),
  label text not null,
  url text not null check (url ~* '^https://'),
  display_order integer not null default 0,
  active boolean not null default true,
  show_in_footer boolean not null default true,
  show_on_profile boolean not null default true,
  show_on_research boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists research_profiles_order_idx on research_profiles (display_order);

alter table research_profiles enable row level security;

drop policy if exists research_profiles_public_select on research_profiles;
create policy research_profiles_public_select on research_profiles for select using (active);

drop policy if exists research_profiles_staff_all on research_profiles;
create policy research_profiles_staff_all on research_profiles for all using (is_staff()) with check (is_staff());
