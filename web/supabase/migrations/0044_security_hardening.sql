-- Pin search_path on functions flagged by the Supabase linter (prevents search_path hijacking).
alter function public.publish_due_content() set search_path = public, pg_temp;
alter function public.categories_depth_guard() set search_path = public, pg_temp;
alter function public.check_content_categories(uuid) set search_path = public, pg_temp;
alter function public.content_categories_check_trg() set search_path = public, pg_temp;
alter function public.set_content_categories(uuid, uuid[], uuid) set search_path = public, pg_temp;
alter function public.merge_categories(uuid, uuid) set search_path = public, pg_temp;

-- Anonymous visitors may only create an ordinary website signup. They can no longer choose status, source, name or phone
-- through the public REST endpoint (those are set server-side for enquiry contacts).
drop policy if exists newsletter_public_insert on public.newsletter_subscribers;
create policy newsletter_public_insert on public.newsletter_subscribers for insert
  with check (status = 'subscribed' and coalesce(source, 'website_signup') = 'website_signup' and name is null and phone is null);
