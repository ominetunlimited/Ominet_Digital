-- Phase 4 (additive): blog taxonomy with subcategories, many-to-many post classification
-- with one primary category, an explicit Blog Post / Article content kind, and
-- long-form article and editorial-integrity fields.

-- ── Content kind: Blog Post or Article, decided deliberately by the editor via in_blog ──
alter table public.content add column if not exists content_kind text
  generated always as (case when in_blog then 'post' else 'article' end) stored;

-- ── Article and editorial fields ──────────────────────────────────────────
alter table public.content add column if not exists abstract text;
alter table public.content add column if not exists references_html text;
alter table public.content add column if not exists show_toc boolean not null default true;
alter table public.content add column if not exists image_credit text;
alter table public.content add column if not exists contributors text;
alter table public.content add column if not exists editorial_label text;
alter table public.content add column if not exists disclosure text;
alter table public.content add column if not exists correction_note text;
alter table public.content drop constraint if exists content_editorial_label_chk;
alter table public.content add constraint content_editorial_label_chk
  check (editorial_label is null or editorial_label in ('news','analysis','opinion','review','sponsored','fiction','explainer'));

-- ── Categories become a two-level, editable taxonomy ──────────────────────
alter table public.categories add column if not exists parent_id uuid references public.categories(id) on delete restrict;
alter table public.categories add column if not exists image_url text;
alter table public.categories add column if not exists seo_title text;
alter table public.categories add column if not exists seo_description text;
alter table public.categories add column if not exists show_when_empty boolean not null default false;
create index if not exists categories_parent_idx on public.categories (parent_id, display_order);

create or replace function public.categories_depth_guard() returns trigger
language plpgsql security invoker as $$
begin
  if new.parent_id is not null then
    if new.parent_id = new.id then raise exception 'A category cannot be its own parent'; end if;
    if exists (select 1 from public.categories p where p.id = new.parent_id and p.parent_id is not null) then
      raise exception 'Subcategories can only sit one level below a main category';
    end if;
    if exists (select 1 from public.categories c where c.parent_id = new.id) then
      raise exception 'A category that has subcategories cannot itself become a subcategory';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists categories_depth_guard_trg on public.categories;
create trigger categories_depth_guard_trg before insert or update of parent_id on public.categories
  for each row execute function public.categories_depth_guard();

-- ── Many-to-many: posts <-> categories, with exactly one primary ──────────
create table if not exists public.content_categories (
  content_id uuid not null references public.content(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  is_primary boolean not null default false,
  primary key (content_id, category_id)
);
create unique index if not exists content_categories_one_primary on public.content_categories (content_id) where is_primary;
create index if not exists content_categories_cat_idx on public.content_categories (category_id);
alter table public.content_categories enable row level security;
drop policy if exists content_categories_select on public.content_categories;
create policy content_categories_select on public.content_categories for select
  using (is_staff() or exists (select 1 from public.content c where c.id = content_id and c.status = 'published'));
drop policy if exists content_categories_staff_write on public.content_categories;
create policy content_categories_staff_write on public.content_categories for all using (is_staff()) with check (is_staff());

-- Backfill: every blog post keeps the single category it already had, as its primary.
insert into public.content_categories (content_id, category_id, is_primary)
select c.id, c.category_id, true from public.content c
where c.in_blog and c.category_id is not null
on conflict do nothing;

-- Integrity, checked when the transaction commits: one primary; a subcategory needs its parent assigned too.
create or replace function public.check_content_categories(p_content uuid) returns void
language plpgsql security invoker as $$
declare n int; prim int;
begin
  select count(*), count(*) filter (where is_primary) into n, prim from public.content_categories where content_id = p_content;
  if n > 0 and prim <> 1 then raise exception 'A post must have exactly one primary category (found %)', prim; end if;
  if exists (
    select 1 from public.content_categories cc
    join public.categories c on c.id = cc.category_id
    where cc.content_id = p_content and c.parent_id is not null
      and not exists (select 1 from public.content_categories p where p.content_id = p_content and p.category_id = c.parent_id)
  ) then raise exception 'A subcategory can only be used together with its main category'; end if;
end $$;

create or replace function public.content_categories_check_trg() returns trigger
language plpgsql security invoker as $$
begin
  perform public.check_content_categories(coalesce(new.content_id, old.content_id));
  return null;
end $$;
drop trigger if exists content_categories_check on public.content_categories;
create constraint trigger content_categories_check after insert or update or delete on public.content_categories
  deferrable initially deferred for each row execute function public.content_categories_check_trg();

-- One transaction: replace a post's categories and mirror the primary into content.category_id.
create or replace function public.set_content_categories(p_content uuid, p_categories uuid[], p_primary uuid) returns void
language plpgsql security invoker as $$
begin
  if coalesce(array_length(p_categories, 1), 0) > 0 and (p_primary is null or not (p_primary = any (p_categories))) then
    raise exception 'The primary category must be one of the assigned categories';
  end if;
  delete from public.content_categories where content_id = p_content;
  if coalesce(array_length(p_categories, 1), 0) > 0 then
    insert into public.content_categories (content_id, category_id, is_primary)
    select p_content, c, (c = p_primary) from unnest(p_categories) as c;
  end if;
  update public.content set category_id = p_primary where id = p_content;
end $$;

-- ── Initial editable taxonomy ─────────────────────────────────────────────
-- The earlier "Opinions" category becomes "Opinion"; nothing else is renamed or removed.
update public.categories set name = 'Opinion', slug = 'opinion' where slug = 'opinions' and not exists (select 1 from public.categories where slug = 'opinion');

insert into public.categories (name, slug, blog_enabled, display_order, description) values
  ('Sports','sports',true,20,'Football, basketball, tennis, athletics, boxing and the business and culture around sport.'),
  ('Science','science',true,21,'Discoveries, research and explainers across the sciences.'),
  ('Science Fiction','science-fiction',true,22,'Sci-fi books, films, games, ideas and original speculative writing.'),
  ('Artificial Intelligence','artificial-intelligence',true,23,'AI news, tools, research, ethics and practical commentary.'),
  ('Business','business',true,24,'Entrepreneurship, strategy, marketing, finance and industry analysis.'),
  ('Entertainment and Culture','entertainment-culture',true,25,'Film, music, books, performance, visual arts and popular culture.'),
  ('Education','education',true,26,'Learning, teaching, higher education, skills and student life.'),
  ('Lifestyle and Society','lifestyle-society',true,27,'Everyday life, social trends, travel, food, community and human interest.')
on conflict (slug) do nothing;

-- Subcategories. Slugs are prefixed with the parent so they stay unique across the whole taxonomy.
with sub(parent, name, ord) as (values
  ('sports','Football',1),('sports','Basketball',2),('sports','Tennis',3),('sports','Athletics',4),('sports','Boxing',5),('sports','Other Sports',6),
  ('sports','Teams and Clubs',7),('sports','Players and Athletes',8),('sports','Tactics and Analysis',9),('sports','Transfers and Contracts',10),
  ('sports','Competitions and Tournaments',11),('sports','Sports Business',12),('sports','Sports Culture',13),
  ('technology','Consumer Technology',1),('technology','Gadgets and Devices',2),('technology','Software and Applications',3),('technology','Internet and Web',4),
  ('technology','Cybersecurity',5),('technology','Digital Infrastructure',6),('technology','Mobile Technology',7),('technology','Emerging Technologies',8),
  ('technology','Technology Business',9),('technology','Reviews and Comparisons',10),('technology','Tutorials and How-to',11),
  ('news','Nigeria',1),('news','Africa',2),('news','World',3),('news','Business and Economy',4),('news','Politics and Governance',5),('news','Education',6),
  ('news','Environment and Climate',7),('news','Society and Culture',8),('news','Media and Entertainment',9),('news','Public Policy',10),('news','Development',11),
  ('reviews','Technology Reviews',1),('reviews','Software and Apps',2),('reviews','Gadgets',3),('reviews','Books',4),('reviews','Films and Television',5),
  ('reviews','Games',6),('reviews','Products and Services',7),('reviews','Websites and Digital Platforms',8),('reviews','Events and Experiences',9),
  ('opinion','Society',1),('opinion','Politics and Governance',2),('opinion','Culture',3),('opinion','Education',4),('opinion','Technology',5),
  ('opinion','Sports',6),('opinion','Media',7),('opinion','Business',8),('opinion','Literature',9),('opinion','Personal Commentary',10),
  ('science','Space and Astronomy',1),('science','Physics',2),('science','Biology',3),('science','Health and Human Biology',4),
  ('science','Environment and Climate Science',5),('science','Earth Science',6),('science','Chemistry',7),('science','Psychology and Behaviour',8),
  ('science','Scientific Discoveries',9),('science','Research and Innovation',10),('science','Science Explainers',11),
  ('science-fiction','Sci-Fi Books',1),('science-fiction','Sci-Fi Films and Television',2),('science-fiction','Sci-Fi Games',3),('science-fiction','Reviews and Criticism',4),
  ('science-fiction','Sci-Fi Ideas and Concepts',5),('science-fiction','Futures and Speculation',6),('science-fiction','Worldbuilding',7),
  ('science-fiction','Original Sci-Fi Writing',8),('science-fiction','Science and Fiction',9),('science-fiction','African Science Fiction',10),
  ('artificial-intelligence','AI News',1),('artificial-intelligence','Generative AI',2),('artificial-intelligence','AI Tools and Applications',3),
  ('artificial-intelligence','AI Research',4),('artificial-intelligence','AI in Business',5),('artificial-intelligence','AI in Education',6),
  ('artificial-intelligence','AI and Creativity',7),('artificial-intelligence','AI and Media',8),('artificial-intelligence','AI Ethics and Society',9),
  ('artificial-intelligence','AI Tutorials',10),('artificial-intelligence','AI Reviews',11),('artificial-intelligence','Automation and Productivity',12),
  ('business','Entrepreneurship',1),('business','Small Business',2),('business','Startups',3),('business','Business Strategy',4),('business','Marketing and Branding',5),
  ('business','Finance and Investment',6),('business','Business Technology',7),('business','Work and Careers',8),('business','Industry Analysis',9),
  ('business','Nigerian Business',10),('business','African Business',11),
  ('entertainment-culture','Film and Television',1),('entertainment-culture','Music',2),('entertainment-culture','Books and Literature',3),
  ('entertainment-culture','Theatre and Performance',4),('entertainment-culture','Visual Arts',5),('entertainment-culture','Digital Culture',6),
  ('entertainment-culture','Celebrity and Public Figures',7),('entertainment-culture','Events',8),('entertainment-culture','Popular Culture',9),
  ('education','Learning and Teaching',1),('education','Higher Education',2),('education','Schools and Education Policy',3),('education','Career Development',4),
  ('education','Research and Scholarship',5),('education','Digital Learning',6),('education','Skills and Training',7),('education','Student Life',8),
  ('lifestyle-society','Relationships and Family',1),('lifestyle-society','Everyday Life',2),('lifestyle-society','Social Trends',3),('lifestyle-society','Travel and Places',4),
  ('lifestyle-society','Food and Culture',5),('lifestyle-society','Personal Development',6),('lifestyle-society','Community',7),('lifestyle-society','Human Interest',8)
)
insert into public.categories (name, slug, parent_id, blog_enabled, display_order)
select s.name, s.parent || '-' || trim(both '-' from regexp_replace(lower(s.name), '[^a-z0-9]+', '-', 'g')), p.id, true, s.ord
from sub s join public.categories p on p.slug = s.parent and p.parent_id is null
on conflict (slug) do nothing;
