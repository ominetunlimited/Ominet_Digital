-- Short share links: ominetdigital.com.ng/s/<code> redirects to a real content page.
-- Only the server (service role) reads or writes this table, so row-level security is on with no public policies.
create table if not exists public.short_links (
  code        text primary key check (code ~ '^[a-z0-9]{4,12}$'),
  path        text not null unique check (path ~ '^/(books|articles|blog|services)/[a-z0-9][a-z0-9-]*$'),
  created_at  timestamptz not null default now()
);

alter table public.short_links enable row level security;
revoke all on public.short_links from anon, authenticated;
