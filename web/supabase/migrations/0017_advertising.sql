-- Advertising CMS.
--
--   advertiser  -> who is paying / promoting (private: contact details)
--   campaign    -> one engagement with an advertiser: dates, agreed fee, status
--   ad          -> one creative (image + destination) shown in one placement
--   placement   -> a spot on the site (ad_placements, already existed)
--
-- The public can read an ad ONLY while it is published AND its campaign is
-- active AND today is inside the campaign's dates — enforced here in the
-- database, not in page code. Advertisers and campaigns are staff-only.
--
-- Direct ads are structured (image, headline, link) and rendered by the site;
-- raw HTML snippets are no longer displayed (they would run arbitrary script
-- on public pages). The old column is kept but emptied.
--
-- Impressions and clicks are raw events. No revenue is calculated anywhere:
-- the only money figure is the fee the admin types in for a campaign.

create table if not exists ad_advertisers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  contact_name text,
  contact_email text,
  notes text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references ad_advertisers (id) on delete cascade,
  name text not null,
  starts_on date,
  ends_on date,
  fee_cents integer check (fee_cents is null or fee_cents >= 0),
  currency text not null default 'NGN',
  fee_note text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ad_campaign_dates check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

create table if not exists ads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references ad_campaigns (id) on delete cascade,
  slot_key text not null references ad_placements (slot_key) on update cascade on delete restrict,
  kind text not null default 'banner' check (kind in ('banner', 'sponsored_content', 'book', 'partner')),
  title text not null,               -- internal name, also the image's fallback alt text
  headline text,                     -- optional public text
  image_url text,
  image_alt text,
  portrait boolean not null default false, -- true = A5 portrait (1 : 1.414) artwork
  destination_url text not null,     -- https://… or an internal path such as /books/…
  cta_label text,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished', 'archived')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ads_destination_ok check (destination_url ~* '^https://' or destination_url ~ '^/[^/\\]'),
  constraint ads_has_content check (image_url is not null or headline is not null)
);

create index if not exists ads_slot_idx on ads (slot_key, status);
create index if not exists ads_campaign_idx on ads (campaign_id);
create index if not exists ad_campaigns_advertiser_idx on ad_campaigns (advertiser_id);

create table if not exists ad_events (
  id bigint generated always as identity primary key,
  ad_id uuid not null references ads (id) on delete cascade,
  event_type text not null check (event_type in ('impression', 'click')),
  guest_key text,
  created_at timestamptz not null default now()
);

create index if not exists ad_events_ad_idx on ad_events (ad_id, created_at desc);
create index if not exists ad_events_guest_idx on ad_events (guest_key, created_at desc);

-- Is this campaign running right now? SECURITY DEFINER so the public policy on
-- ads can ask about campaigns without being able to read the campaigns table.
create or replace function ad_campaign_is_live(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from ad_campaigns c
    join ad_advertisers a on a.id = c.advertiser_id
    where c.id = cid
      and c.status = 'active'
      and a.status = 'active'
      and (c.starts_on is null or c.starts_on <= current_date)
      and (c.ends_on is null or c.ends_on >= current_date)
  );
$$;

alter table ad_advertisers enable row level security;
alter table ad_campaigns enable row level security;
alter table ads enable row level security;
alter table ad_events enable row level security;

drop policy if exists ad_advertisers_staff_all on ad_advertisers;
create policy ad_advertisers_staff_all on ad_advertisers for all using (is_staff()) with check (is_staff());

drop policy if exists ad_campaigns_staff_all on ad_campaigns;
create policy ad_campaigns_staff_all on ad_campaigns for all using (is_staff()) with check (is_staff());

drop policy if exists ads_public_select on ads;
create policy ads_public_select on ads for select using (
  (status = 'published' and ad_campaign_is_live(campaign_id)) or is_staff()
);
drop policy if exists ads_staff_write on ads;
create policy ads_staff_write on ads for all using (is_staff()) with check (is_staff());

-- Events are written only by the server (service role) after validation.
drop policy if exists ad_events_staff_select on ad_events;
create policy ad_events_staff_select on ad_events for select using (is_staff());

-- Per-ad totals for the admin. security_invoker so it obeys the caller's RLS.
create or replace view ad_stats with (security_invoker = true) as
select
  ad_id,
  count(*) filter (where event_type = 'impression') as impressions_total,
  count(*) filter (where event_type = 'click') as clicks_total,
  count(*) filter (where event_type = 'impression' and created_at > now() - interval '30 days') as impressions_30d,
  count(*) filter (where event_type = 'click' and created_at > now() - interval '30 days') as clicks_30d,
  max(created_at) as last_event_at
from ad_events
group by ad_id;

-- Raw HTML from the old direct-ad box is never rendered now; clear it.
update ad_placements set html_snippet = null where html_snippet is not null;
update ad_placements set provider = 'direct' where provider not in ('adsense', 'direct');

-- These two slots were never placed on any page (there is no sidebar, and the footer
-- is shared with error pages that can't host an ad), so they could never show anything.
delete from ad_placements where slot_key in ('article_sidebar', 'footer') and active = false
  and not exists (select 1 from ads where ads.slot_key = ad_placements.slot_key);

-- Log changes to the new tables in the audit log (0016).
do $$
declare
  t text;
begin
  if to_regprocedure('audit_row_change()') is not null then
    foreach t in array array['ad_advertisers', 'ad_campaigns', 'ads'] loop
      execute format('drop trigger if exists audit_%1$s on public.%1$I', t);
      execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function audit_row_change()', t);
    end loop;
  end if;
end;
$$;
