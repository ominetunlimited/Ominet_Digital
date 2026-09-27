-- A book set to 'scheduled' (announced, not yet released — "coming soon")
-- was previously invisible to real visitors: books_public_select only
-- allowed 'published' rows, so the public /books page's own "Upcoming"
-- section could never actually show anything to anyone but staff.
--
-- 'scheduled' books become publicly readable (title, cover, metadata) but
-- carry no purchase links or deliverable file unless the admin adds them;
-- the Books page still only links through to a full book page for
-- 'published' titles, and book delivery already requires status='published'
-- (src/lib/books/delivery.ts), so a scheduled book can't be bought or
-- downloaded early no matter what its sales_mode says.

drop policy if exists books_public_select on books;
create policy books_public_select on books for select using (status in ('published', 'scheduled') or is_staff());
