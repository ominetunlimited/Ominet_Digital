-- Seven signature blog categories. Additive: nothing is renamed or removed.
-- Like every category, each only appears to readers once a published post uses it (unless show_when_empty is switched on).
insert into public.categories (name, slug, blog_enabled, display_order, description) values
  ('Belief and Sacred Spaces','belief-sacred-spaces',true,30,'Faith, ritual, doctrine, places of worship and how belief shapes people and societies.'),
  ('Literature','literature',true,31,'Books, authors, criticism, storytelling and the writing life.'),
  ('Nollywood','nollywood',true,32,'Nigerian film and television: stories, craft, industry and culture.'),
  ('Forgotten History','forgotten-history',true,33,'People, events and places that history left in the margins.'),
  ('Science and Logic','science-logic',true,34,'Evidence, reasoning and how we know what we know.'),
  ('Global Mysteries','global-mysteries',true,35,'Unexplained events, disputed stories and open questions from around the world.'),
  ('Human Nature','human-nature',true,36,'Behaviour, motive, emotion and what makes people do what they do.')
on conflict (slug) do nothing;
