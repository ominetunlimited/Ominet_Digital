-- Services CMS: Ominet Digital/Omini Nfawa's professional services (writing,
-- photography, video, design, dev, consulting, etc.) are not hard-coded —
-- admin can add any service, with its own pricing, booking configuration,
-- FAQ and SEO, exactly like books/content already work.

create type service_status as enum ('draft', 'published', 'archived');
create type service_pricing_mode as enum ('fixed', 'hourly', 'package', 'quote');

create table services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  full_description text,
  featured_image_url text,
  gallery jsonb not null default '[]'::jsonb,
  category text,
  price_cents integer,
  currency text not null default 'NGN',
  pricing_mode service_pricing_mode not null default 'quote',
  duration text,
  availability text,
  location_mode text not null default 'remote', -- remote | in_person | hybrid
  booking_enabled boolean not null default true,
  requirements text,
  faq jsonb not null default '[]'::jsonb, -- [{question, answer}]
  external_booking_url text,
  cta_label text,
  status service_status not null default 'draft',
  featured boolean not null default false,
  display_order integer not null default 0,
  seo_title text,
  seo_description text,
  og_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_status_order_idx on services (status, display_order);

alter table services enable row level security;
create policy services_public_select on services for select using (status = 'published' or is_staff());
create policy services_staff_write on services for all using (is_staff()) with check (is_staff());
