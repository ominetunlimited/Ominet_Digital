-- Phase 3 (additive only): blog fields on content, editable blog categories,
-- configurable service options (NYSC, CAC), quotation line items.

-- ── Blog: extend the existing content table ───────────────────────────────
alter table public.content add column if not exists in_blog boolean not null default false;
alter table public.content add column if not exists featured_image_alt text;
alter table public.content add column if not exists social_image_url text;      -- dedicated 1:1 (1080x1080) share image
alter table public.content add column if not exists social_image_alt text;
alter table public.content add column if not exists author_name text;
alter table public.content add column if not exists author_bio text;
alter table public.content add column if not exists blog_featured boolean not null default false;
create index if not exists content_blog_idx on public.content (in_blog, status, published_at desc);

alter table public.categories add column if not exists description text;
alter table public.categories add column if not exists display_order int not null default 0;
alter table public.categories add column if not exists blog_enabled boolean not null default false;

insert into public.categories (name, slug, blog_enabled, display_order, description) values
  ('News','news',true,1,'News and announcements'),
  ('Events','events',true,2,'Events and event coverage'),
  ('Company Updates','company-updates',true,3,'Product and service updates from Ominet Digital'),
  ('Technology','technology',true,4,'Technology and digital media'),
  ('Reviews','reviews',true,5,'Reviews and recommendations'),
  ('Tutorials','tutorials',true,6,'Tutorials and educational articles'),
  ('Features','features',true,7,'Features and interviews'),
  ('Opinions','opinions',true,8,'Opinion and commentary'),
  ('General Gist','general-gist',true,9,'Trending stories and general gist')
on conflict (slug) do update set blog_enabled = true;

-- Scheduled posts go live without anyone re-saving them.
create or replace function public.publish_due_content() returns integer
language plpgsql security invoker as $$
declare n integer;
begin
  update public.content set status = 'published', updated_at = now()
   where status = 'scheduled' and published_at is not null and published_at <= now();
  get diagnostics n = row_count;
  return n;
end $$;

do $$ begin
  begin
    create extension if not exists pg_cron;
    perform cron.schedule('publish-due-content', '*/5 * * * *', 'select public.publish_due_content()');
  exception when others then
    raise notice 'pg_cron not enabled; scheduled posts are promoted lazily by the app (%).', sqlerrm;
  end;
end $$;

-- ── Service options (NYSC: 4 options under one service; CAC: sub-services) ─
create table if not exists public.service_options (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  key text not null,
  label text not null,
  group_label text,
  description text,
  requirements text,
  duration text,
  price_mode text not null default 'quote' check (price_mode in ('fixed','from','range','quote')),
  price_cents bigint check (price_cents is null or price_cents >= 0),
  price_max_cents bigint check (price_max_cents is null or price_max_cents >= 0),
  official_fee_cents bigint check (official_fee_cents is null or official_fee_cents >= 0),
  official_fee_note text,
  currency text not null default 'NGN',
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, key)
);
create index if not exists service_options_service_idx on public.service_options (service_id, display_order);
alter table public.service_options enable row level security;
drop policy if exists service_options_public_select on public.service_options;
create policy service_options_public_select on public.service_options for select
  using (is_staff() or (active and exists (select 1 from public.services s where s.id = service_id and s.status = 'published')));
drop policy if exists service_options_staff_write on public.service_options;
create policy service_options_staff_write on public.service_options for all using (is_staff()) with check (is_staff());

alter table public.bookings add column if not exists service_option_ids uuid[] not null default '{}';
create index if not exists bookings_option_ids_idx on public.bookings using gin (service_option_ids);

-- Quotation line items: professional fee / official charge / other. price_cents stays the total.
alter table public.quotations add column if not exists line_items jsonb not null default '[]'::jsonb;

-- ── Seed the two services as DRAFTS (nothing goes public until an admin publishes) ──
insert into public.services (title, slug, short_description, full_description, category, pricing_mode, duration, availability, booking_enabled, requirements, status, display_order, faq, seo_title, seo_description)
values
('NYSC Posting, Relocation and Reposting Services','nysc-posting-relocation-reposting',
 'Assistance with selected NYSC posting-related enquiries and eligible administrative processes: direct posting, PPA posting, relocation and reposting.',
 '<p>Ominet Digital provides assistance with selected NYSC posting-related enquiries and eligible administrative processes. Whether you need assistance with direct posting, PPA posting, relocation or reposting, you can submit your request through our platform.</p><p>Estimated processing or effect times are estimates, not guaranteed approval periods. Actual outcomes and timelines depend on eligibility, documentation and decisions by the relevant NYSC authorities.</p><h3>Important</h3><ul><li>Ominet Digital is an independent business. It is not the National Youth Service Corps and does not represent the NYSC or any government body.</li><li>Assistance is subject to eligibility and applicable procedures. Approval rests with the relevant NYSC authorities.</li><li>We do not facilitate forged documents, impersonation, bribery or any attempt to bypass official procedures.</li><li>Charges and professional fees are communicated to you before any payment.</li></ul>',
 'NYSC Services','quote','Depends on the option selected','Admin-controlled',true,
 '<ul><li>Your NYSC call-up or statement-of-result details</li><li>Your current PPA and posting letter (where relevant)</li><li>Supporting documents for your request</li></ul><p>Never send us your passwords, PINs or OTPs.</p>',
 'draft',90,
 '[{"question":"Is Ominet Digital part of the NYSC?","answer":"No. Ominet Digital is an independent business and is not affiliated with the National Youth Service Corps. Decisions on posting, relocation and reposting rest with the relevant NYSC authorities."},{"question":"Are the processing times guaranteed?","answer":"No. They are estimates. Actual timelines depend on eligibility, documentation and decisions by the relevant NYSC authorities."},{"question":"When do I pay?","answer":"We send you a quotation first. Charges and professional fees are communicated before any payment is requested."}]'::jsonb,
 'NYSC Posting, Relocation and Reposting Assistance',
 'Request assistance with NYSC direct posting, PPA posting, relocation or reposting. Estimated times shown; approval rests with the relevant NYSC authorities.'),
('CAC Registration and Business Services','cac-registration-business-services',
 'Professional assistance with business name registration, company incorporation, CAC documentation and selected post-registration services.',
 '<p>Ominet Digital provides professional assistance with business registration, company incorporation, CAC documentation and selected post-registration services.</p><p>Whether you are starting a new business, incorporating a company, registering an organisation or updating existing CAC records, you can submit your request through our platform.</p><p>Services are subject to applicable Corporate Affairs Commission requirements, documentation and availability. Official CAC charges, where they apply, are shown separately from our professional fees in your quotation.</p>',
 'Business Registration','quote','Depends on the service selected','Admin-controlled',true,
 '<ul><li>Proposed business or company name, plus an alternative</li><li>Business activity and address</li><li>Identification and other documents we list for your chosen service</li></ul><p>Never send us your passwords, PINs or OTPs.</p>',
 'draft',91,
 '[{"question":"Is Ominet Digital the Corporate Affairs Commission?","answer":"No. Ominet Digital is an independent business offering assistance. It is not the CAC and does not represent it."},{"question":"What do the CAC charge and what do you charge?","answer":"Your quotation lists official CAC charges, our professional fees and any other charges as separate lines, with a clear total."}]'::jsonb,
 'CAC Registration and Business Services','Request business name registration, company incorporation, post-registration filings and CAC documentation support. Subject to CAC requirements.')
on conflict (slug) do nothing;

insert into public.service_options (service_id, key, label, group_label, description, duration, active, display_order)
select s.id, o.key, o.label, 'NYSC', o.description, o.duration, true, o.ord from public.services s,
 (values
  ('direct-posting','Direct Posting','Assistance with a direct posting request.','3 weeks',1),
  ('ppa-posting','PPA Posting','Assistance with a PPA (place of primary assignment) posting request.','72 hours',2),
  ('relocation','Relocation','Assistance with an eligible relocation request.','1 month',3),
  ('reposting','Reposting','Assistance with an eligible reposting request.','48 hours',4)
 ) as o(key,label,description,duration,ord)
where s.slug = 'nysc-posting-relocation-reposting'
on conflict (service_id, key) do nothing;

-- CAC: no prices, no durations and no official fees are seeded. They must be entered by an admin after checking current CAC information.
insert into public.service_options (service_id, key, label, group_label, active, display_order)
select s.id, o.key, o.label, o.grp, o.active, o.ord from public.services s,
 (values
  ('bn-availability','Business name availability search and reservation assistance','Business Name Registration',true,1),
  ('bn-registration','Business name registration','Business Name Registration',true,2),
  ('bn-update','Business name information update (eligible changes)','Business Name Registration',true,3),
  ('bn-status','Business name status enquiry','Business Name Registration',true,4),
  ('co-private-shares','Private company registration (limited by shares)','Company Registration and Incorporation',true,10),
  ('co-other','Other company registration category (on request)','Company Registration and Incorporation',true,11),
  ('it-registration','Incorporated trustees (NGO, foundation, association) registration','Incorporated Trustees and Other Categories',false,20),
  ('pr-annual-returns','Annual returns','Post-Registration Services',true,30),
  ('pr-company-info','Change of business or company information','Post-Registration Services',true,31),
  ('pr-directors','Change involving directors','Post-Registration Services',true,32),
  ('pr-shareholders','Change involving shareholders','Post-Registration Services',true,33),
  ('pr-address','Registered address update','Post-Registration Services',true,34),
  ('pr-compliance','Post-registration compliance enquiry','Post-Registration Services',true,35),
  ('doc-certificate','Certificate retrieval enquiry','CAC Documentation and Support',false,40),
  ('doc-replacement','Replacement or correction enquiry','CAC Documentation and Support',false,41),
  ('doc-ctc','Certified True Copy','CAC Documentation and Support',false,42),
  ('doc-status-report','Status report','CAC Documentation and Support',false,43)
 ) as o(key,label,grp,active,ord)
where s.slug = 'cac-registration-business-services'
on conflict (service_id, key) do nothing;
