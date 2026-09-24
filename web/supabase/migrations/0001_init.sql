-- Ominet Digital — initial schema.
-- Admin is the source of truth for publishable content (see project/README.md
-- "ADMIN-FIRST CONTENT ARCHITECTURE"); this migration creates that layer.

create extension if not exists "pgcrypto";

-- ══════════════════════════════════════════════════════════════════════════
-- Roles & profiles
-- ══════════════════════════════════════════════════════════════════════════

create type admin_role as enum ('super_admin', 'admin', 'editor', 'author');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role admin_role, -- null = ordinary reader, not staff
  created_at timestamptz not null default now()
);

-- Auto-create a profile row (no role — plain reader) whenever someone signs
-- up via Supabase Auth (readers use email OTP for checkout/paywall access).
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create function is_staff()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role is not null
  );
$$;

create function is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('super_admin', 'admin')
  );
$$;

-- ══════════════════════════════════════════════════════════════════════════
-- Taxonomy
-- ══════════════════════════════════════════════════════════════════════════

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════════════
-- Content — articles, essays, poems, fiction, research, reviews, interviews.
-- One table with a type discriminator; every content type shares the same
-- editorial/access/SEO shape per the design handoff's data model.
-- ══════════════════════════════════════════════════════════════════════════

create type content_type as enum
  ('article', 'essay', 'research', 'poem', 'fiction', 'review', 'interview', 'note');
create type content_status as enum ('draft', 'scheduled', 'published', 'archived');
create type access_type as enum ('free', 'paid', 'members', 'preview');

create table content (
  id uuid primary key default gen_random_uuid(),
  type content_type not null default 'article',
  title text not null,
  slug text not null unique,
  dek text,
  excerpt text,
  body text,
  featured_image_url text,
  category_id uuid references categories (id) on delete set null,
  author_id uuid references profiles (id) on delete set null,
  access access_type not null default 'free',
  price_cents integer,
  currency text default 'NGN',
  status content_status not null default 'draft',
  published_at timestamptz,
  read_minutes integer,
  seo_title text,
  seo_description text,
  og_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table content_tags (
  content_id uuid references content (id) on delete cascade,
  tag_id uuid references tags (id) on delete cascade,
  primary key (content_id, tag_id)
);

create index content_status_published_idx on content (status, published_at desc);
create index content_type_idx on content (type);

-- ══════════════════════════════════════════════════════════════════════════
-- Media library
-- ══════════════════════════════════════════════════════════════════════════

create table media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  url text not null,
  kind text not null default 'image', -- image | video | audio | document
  title text,
  alt_text text,
  caption text,
  credit text,
  width integer,
  height integer,
  uploaded_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════════════
-- Books
-- ══════════════════════════════════════════════════════════════════════════

create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  kind text not null default 'Novel',
  cover_image_url text,
  excerpt text,
  description text,
  isbn text,
  publisher text,
  year text,
  pages text,
  language text default 'English',
  formats text[] default '{}',
  status content_status not null default 'draft',
  featured boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table book_purchase_links (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books (id) on delete cascade,
  platform text not null, -- selar | amazon | google_books | kdp | publisher | other
  label text not null,
  url text not null,
  country text,
  format text,
  currency text,
  affiliate boolean not null default false,
  display_order integer not null default 0,
  active boolean not null default true
);

-- ══════════════════════════════════════════════════════════════════════════
-- Store — digital/physical products, downloads, affiliate/external items
-- ══════════════════════════════════════════════════════════════════════════

create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  image_url text,
  price_cents integer,
  currency text default 'NGN',
  access text not null default 'paid', -- free | paid | external | affiliate | gated
  external_url text,
  external_label text,
  affiliate_disclosure text,
  file_storage_path text, -- for paid/free downloads
  status content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════════════
-- Commerce — orders/payments (Paystack first; provider is a free-text column
-- so Stripe/Flutterwave can be added later without a migration)
-- ══════════════════════════════════════════════════════════════════════════

create type order_status as enum ('pending', 'paid', 'failed', 'cancelled');

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  content_id uuid references content (id) on delete set null,
  product_id uuid references products (id) on delete set null,
  amount_cents integer not null,
  currency text not null default 'NGN',
  provider text not null default 'paystack',
  provider_reference text not null unique,
  status order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_target check (content_id is not null or product_id is not null)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  provider text not null,
  provider_reference text not null,
  status order_status not null,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- Grants access to a specific paid content item or product once payment
-- clears. Keyed by user_id (Supabase Auth email-OTP session), not raw email,
-- so RLS can scope a reader to only their own entitlements.
create table entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content_id uuid references content (id) on delete cascade,
  product_id uuid references products (id) on delete cascade,
  order_id uuid references orders (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint entitlement_target check (content_id is not null or product_id is not null),
  unique (user_id, content_id),
  unique (user_id, product_id)
);

-- ══════════════════════════════════════════════════════════════════════════
-- Advertising
-- ══════════════════════════════════════════════════════════════════════════

create table ad_placements (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null unique, -- e.g. 'home_top', 'article_inline'
  label text not null,
  provider text not null default 'adsense', -- adsense | direct | sponsored
  ad_client text,
  ad_slot text,
  html_snippet text, -- for direct/sponsored placements
  active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════════════
-- Social
-- ══════════════════════════════════════════════════════════════════════════

create table social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null unique, -- facebook | x | linkedin | telegram
  status text not null default 'not_connected', -- not_connected | connected | expired
  connected_at timestamptz
);

create table social_posts (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references content (id) on delete cascade,
  platform text not null,
  caption text,
  status text not null default 'draft', -- draft | shared | scheduled
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════════════
-- Newsletter, redirects, settings, analytics
-- ══════════════════════════════════════════════════════════════════════════

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now(),
  status text not null default 'subscribed' -- subscribed | unsubscribed
);

create table redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  status_code integer not null default 301,
  active boolean not null default true
);

create table site_settings (
  key text primary key,
  value jsonb not null
);

create table analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null, -- page_view | outbound_click | download | purchase | share | signup
  path text,
  content_id uuid references content (id) on delete set null,
  product_id uuid references products (id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index analytics_events_type_idx on analytics_events (event_type, created_at desc);

-- ══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ══════════════════════════════════════════════════════════════════════════

alter table profiles enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table content enable row level security;
alter table content_tags enable row level security;
alter table media_assets enable row level security;
alter table books enable row level security;
alter table book_purchase_links enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table payments enable row level security;
alter table entitlements enable row level security;
alter table ad_placements enable row level security;
alter table social_accounts enable row level security;
alter table social_posts enable row level security;
alter table newsletter_subscribers enable row level security;
alter table redirects enable row level security;
alter table site_settings enable row level security;
alter table analytics_events enable row level security;

-- profiles: a user can read their own profile; staff can read all.
create policy profiles_self_select on profiles for select using (id = auth.uid() or is_staff());
create policy profiles_staff_write on profiles for all using (is_admin()) with check (is_admin());

-- public read of published content; staff can read/write everything.
create policy categories_public_select on categories for select using (true);
create policy categories_staff_write on categories for all using (is_staff()) with check (is_staff());

create policy tags_public_select on tags for select using (true);
create policy tags_staff_write on tags for all using (is_staff()) with check (is_staff());

create policy content_public_select on content for select
  using (status = 'published' or is_staff());
create policy content_staff_write on content for all using (is_staff()) with check (is_staff());

create policy content_tags_public_select on content_tags for select using (true);
create policy content_tags_staff_write on content_tags for all using (is_staff()) with check (is_staff());

create policy media_public_select on media_assets for select using (true);
create policy media_staff_write on media_assets for all using (is_staff()) with check (is_staff());

create policy books_public_select on books for select using (status = 'published' or is_staff());
create policy books_staff_write on books for all using (is_staff()) with check (is_staff());

create policy book_links_public_select on book_purchase_links for select using (
  active and exists (select 1 from books b where b.id = book_id and (b.status = 'published' or is_staff()))
);
create policy book_links_staff_write on book_purchase_links for all using (is_staff()) with check (is_staff());

create policy products_public_select on products for select using (status = 'published' or is_staff());
create policy products_staff_write on products for all using (is_staff()) with check (is_staff());

-- orders/payments: a user can see their own orders; staff sees all. Writes
-- only happen from trusted server code (service role) — see payments lib.
create policy orders_owner_select on orders for select using (user_id = auth.uid() or is_staff());
create policy orders_owner_insert on orders for insert with check (user_id = auth.uid());
create policy payments_staff_select on payments for select using (is_staff());

create policy entitlements_owner_select on entitlements for select using (user_id = auth.uid() or is_staff());

create policy ads_public_select on ad_placements for select using (active or is_staff());
create policy ads_staff_write on ad_placements for all using (is_staff()) with check (is_staff());

create policy social_accounts_staff on social_accounts for all using (is_staff()) with check (is_staff());
create policy social_posts_staff on social_posts for all using (is_staff()) with check (is_staff());

create policy newsletter_staff_select on newsletter_subscribers for select using (is_staff());
create policy newsletter_public_insert on newsletter_subscribers for insert with check (true);

create policy redirects_public_select on redirects for select using (active);
create policy redirects_staff_write on redirects for all using (is_staff()) with check (is_staff());

create policy settings_public_select on site_settings for select using (true);
create policy settings_staff_write on site_settings for all using (is_staff()) with check (is_staff());

create policy analytics_public_insert on analytics_events for insert with check (true);
create policy analytics_staff_select on analytics_events for select using (is_staff());

-- ══════════════════════════════════════════════════════════════════════════
-- Storage: public read of the media bucket, staff-only upload/delete
-- ══════════════════════════════════════════════════════════════════════════

create policy media_bucket_public_read on storage.objects for select
  using (bucket_id = 'media');
create policy media_bucket_staff_write on storage.objects for insert
  with check (bucket_id = 'media' and is_staff());
create policy media_bucket_staff_update on storage.objects for update
  using (bucket_id = 'media' and is_staff());
create policy media_bucket_staff_delete on storage.objects for delete
  using (bucket_id = 'media' and is_staff());
