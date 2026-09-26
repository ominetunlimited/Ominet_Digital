-- Site settings (name, contact emails, social links, footer, favicon, Search
-- Console code) change how the whole site presents itself, so only admins and
-- super admins may edit them. Editors and authors could previously write to
-- this table (is_staff). Reading stays public: everything stored here is
-- public by design, and credentials never go in this table (they live in
-- server environment variables).

drop policy if exists settings_staff_write on site_settings;
drop policy if exists settings_admin_write on site_settings;
create policy settings_admin_write on site_settings for all using (is_admin()) with check (is_admin());
