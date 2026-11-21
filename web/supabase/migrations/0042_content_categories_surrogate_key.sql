-- PostgREST treats a table whose primary key is exactly (content_id, category_id) as a many-to-many junction.
-- That made `content?select=categories(...)` ambiguous (HTTP 300) and broke every blog query.
-- A surrogate primary key keeps the pair unique but stops the junction detection.
alter table public.content_categories add column if not exists id uuid not null default gen_random_uuid();
alter table public.content_categories drop constraint if exists content_categories_pkey;
alter table public.content_categories add constraint content_categories_pkey primary key (id);
alter table public.content_categories add constraint content_categories_unique_pair unique (content_id, category_id);
notify pgrst, 'reload schema';
