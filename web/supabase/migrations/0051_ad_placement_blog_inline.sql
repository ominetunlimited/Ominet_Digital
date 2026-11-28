-- A switched-off ad position for blog posts, like the other five. Nothing shows until it is configured and activated in Admin, Advertising.
insert into public.ad_placements (slot_key, label, provider, active)
select 'blog_inline', 'Blog post (after the post)', 'adsense', false
where not exists (select 1 from public.ad_placements where slot_key = 'blog_inline');
