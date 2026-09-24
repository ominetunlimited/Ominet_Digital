-- Seed data mirroring the placeholder content baked into the design
-- (project/*.dc.html) so the live site looks the same the moment this runs.
-- Safe to re-run: every insert is keyed by a stable slug/unique key.

insert into categories (name, slug) values
  ('Essay', 'essay'), ('Research', 'research'), ('Fiction', 'fiction'), ('Interview', 'interview')
on conflict (slug) do nothing;

insert into content (type, title, slug, dek, excerpt, body, access, price_cents, currency, status, published_at, read_minutes, category_id)
select 'essay', 'On Writing as a Second Country', 'on-writing-as-a-second-country',
  'Migration, memory and the languages we write in when the first one is no longer enough.',
  'A long essay on migration, memory and the languages we write in when the first one is no longer enough.',
  E'There is a particular silence that arrives with a new language — not the absence of words, but the absence of the right ones. For years I mistook this silence for a failure of vocabulary. It was something else: a second country, arriving slowly, with its own weather.\n\nEvery migrant writer knows this territory. The first language holds the childhood; the second language holds the adult who has to explain the childhood to people who were never there. Between them is a border that no passport describes.',
  'paid', 300, 'USD', 'published', '2026-09-12T00:00:00Z', 12, c.id
from categories c where c.slug = 'essay'
on conflict (slug) do nothing;

insert into content (type, title, slug, excerpt, access, status, published_at, read_minutes, category_id)
select 'research', 'Coastal Erosion and the Politics of Retreat', 'coastal-erosion-and-the-politics-of-retreat',
  'A field study of three delta towns weighing relocation against a shrinking coastline.',
  'paid', 'published', '2026-08-28T00:00:00Z', 18, c.id
from categories c where c.slug = 'research'
on conflict (slug) do nothing;

insert into content (type, title, slug, excerpt, access, status, published_at, read_minutes, category_id)
select 'fiction', 'The House on Ndoli Street', 'the-house-on-ndoli-street',
  'A short story about a house that keeps changing hands, and the one thing no owner ever moves.',
  'free', 'published', '2026-08-12T00:00:00Z', 9, c.id
from categories c where c.slug = 'fiction'
on conflict (slug) do nothing;

insert into content (type, title, slug, excerpt, access, status, published_at, read_minutes, category_id)
select 'interview', 'A Conversation on Independent Publishing', 'a-conversation-on-independent-publishing',
  'Talking with a small-press editor about what changes when a writer builds their own platform.',
  'free', 'published', '2026-07-30T00:00:00Z', 15, c.id
from categories c where c.slug = 'interview'
on conflict (slug) do nothing;

insert into books (title, slug, kind, year, pages, excerpt, formats, status, featured) values
  ('The Long Return', 'the-long-return', 'Novel', '2026', '312 pages',
   'A family separated by three borders finds its way back to a single house, one letter at a time. Told across four decades and three countries, it is a novel about what a house remembers when the people who built it are gone.',
   array['Ebook','Paperback','Audio'], 'published', true),
  ('Correspondence', 'correspondence', 'Novel', '2022', null,
   'A novel told entirely in letters between two estranged siblings.', array['Ebook','Paperback'], 'published', false),
  ('The Water Line', 'the-water-line', 'Essays', '2019', null,
   E'Essays on the Niger Delta''s shifting coastline.', array['Ebook','Paperback'], 'published', false),
  ('Small Hours', 'small-hours', 'Poetry', '2016', null,
   'A debut poetry collection.', array['Paperback'], 'published', false),
  ('A Small Country of Rain', 'a-small-country-of-rain', 'Essays', '2027', null, '', '{}', 'draft', false),
  ('Field Notes', 'field-notes', 'Research', '2027', null, '', '{}', 'draft', false),
  ('Ndoli Street & Other Stories', 'ndoli-street-and-other-stories', 'Fiction', '2027', null, '', '{}', 'draft', false)
on conflict (slug) do nothing;

insert into book_purchase_links (book_id, platform, label, url, display_order)
select b.id, 'selar', 'Buy on Selar', 'https://selar.co/', 0 from books b where b.slug = 'the-long-return'
union all
select b.id, 'amazon', 'Buy on Amazon', 'https://amazon.com/', 1 from books b where b.slug = 'the-long-return'
union all
select b.id, 'google_books', 'Google Books', 'https://books.google.com/', 2 from books b where b.slug = 'the-long-return'
on conflict do nothing;

insert into ad_placements (slot_key, label, provider, active) values
  ('home_top', 'Homepage top', 'adsense', false),
  ('home_middle', 'Homepage middle', 'adsense', false),
  ('article_inline', 'Article inline', 'adsense', false),
  ('article_sidebar', 'Article sidebar', 'adsense', false),
  ('book_page', 'Book page', 'adsense', false),
  ('media_page', 'Media page', 'adsense', false),
  ('footer', 'Footer', 'adsense', false)
on conflict (slot_key) do nothing;

-- Public media bucket for the admin media library and content featured images.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

insert into social_accounts (platform, status) values
  ('facebook', 'not_connected'), ('x', 'not_connected'),
  ('linkedin', 'not_connected'), ('telegram', 'not_connected')
on conflict (platform) do nothing;
