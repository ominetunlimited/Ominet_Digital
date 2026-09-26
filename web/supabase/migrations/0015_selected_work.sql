-- The About page's "Selected work" list used to be hard-coded in the page.
-- It now lives here and is edited from the Admin Centre (add / edit / reorder /
-- hide / remove). The public can read only visible rows; staff manage all.
--
-- The three rows seeded below are exactly what the page already showed, so
-- nothing changes publicly when this is applied. They are the site owner's to
-- confirm or correct in the admin; only the novel has been confirmed as real.

create table if not exists selected_work (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  year_label text not null default '',
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists selected_work_order_idx on selected_work (display_order);

alter table selected_work enable row level security;

drop policy if exists selected_work_public_select on selected_work;
create policy selected_work_public_select on selected_work for select using (active);

drop policy if exists selected_work_staff_all on selected_work;
create policy selected_work_staff_all on selected_work for all using (is_staff()) with check (is_staff());

insert into selected_work (label, year_label, display_order)
select v.label, v.year_label, v.display_order
from (values
  ('A Child''s Cry in the Savannah, novel', '2026', 0),
  ('Founder, Ominet Digital', '2021–present', 1),
  ('Founder, PROFILE', '2024–present', 2)
) as v(label, year_label, display_order)
where not exists (select 1 from selected_work);
