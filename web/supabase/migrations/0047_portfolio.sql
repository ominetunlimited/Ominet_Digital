-- Portfolio: case studies and projects shown on /work, managed in Admin → Portfolio. Additive only.
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  label text not null default 'personal' check (label in ('personal','simulated','volunteer','paid')),
  client_name text,
  role text,
  year_label text,
  services text,
  body_html text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  featured boolean not null default false,
  display_order integer not null default 0,
  permission_confirmed boolean not null default false,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Client work (volunteer or paid) can only be published once permission to show it is confirmed.
  constraint portfolio_permission_chk check (status <> 'published' or label in ('personal','simulated') or permission_confirmed)
);
create index if not exists portfolio_items_status_idx on public.portfolio_items (status, display_order);

create table if not exists public.portfolio_media (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.portfolio_items(id) on delete cascade,
  kind text not null check (kind in ('image','video','slides','pdf','link')),
  url text not null,
  title text,
  caption text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists portfolio_media_item_idx on public.portfolio_media (item_id, display_order);

alter table public.portfolio_items enable row level security;
alter table public.portfolio_media enable row level security;
drop policy if exists portfolio_items_select on public.portfolio_items;
create policy portfolio_items_select on public.portfolio_items for select using (status = 'published' or is_staff());
drop policy if exists portfolio_items_staff_write on public.portfolio_items;
create policy portfolio_items_staff_write on public.portfolio_items for all using (is_staff()) with check (is_staff());
drop policy if exists portfolio_media_select on public.portfolio_media;
create policy portfolio_media_select on public.portfolio_media for select
  using (is_staff() or exists (select 1 from public.portfolio_items i where i.id = item_id and i.status = 'published'));
drop policy if exists portfolio_media_staff_write on public.portfolio_media;
create policy portfolio_media_staff_write on public.portfolio_media for all using (is_staff()) with check (is_staff());
