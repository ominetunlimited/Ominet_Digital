-- Book delivery: paid books can be ordered and entitled, and every download
-- is logged. Files stay in the private bucket; a download is only ever a
-- short-lived signed link issued by the server after an access check.
--
-- ALSO closes a privacy hole from 0007: the guest branches of the orders and
-- entitlements policies let ANY holder of the public anon key list every
-- guest's orders and entitlements (which carry buyer emails). Guest access is
-- now checked server-side with the service role against the buyer's own
-- httpOnly cookie, so those branches are removed here.

alter table orders add column if not exists book_id uuid references books (id) on delete set null;
alter table orders drop constraint if exists order_target;
alter table orders add constraint order_target check (content_id is not null or product_id is not null or book_id is not null);

alter table entitlements add column if not exists book_id uuid references books (id) on delete cascade;
alter table entitlements drop constraint if exists entitlement_target;
alter table entitlements add constraint entitlement_target check (content_id is not null or product_id is not null or book_id is not null);

create unique index if not exists entitlements_user_book_uidx on entitlements (user_id, book_id) where user_id is not null and book_id is not null;
create unique index if not exists entitlements_guest_book_uidx on entitlements (guest_key, book_id) where guest_key is not null and book_id is not null;

drop policy if exists entitlements_owner_select on entitlements;
create policy entitlements_owner_select on entitlements for select using (
  (user_id is not null and user_id = auth.uid()) or is_staff()
);

drop policy if exists orders_owner_select on orders;
create policy orders_owner_select on orders for select using (
  (user_id is not null and user_id = auth.uid()) or is_staff()
);

drop policy if exists orders_owner_insert on orders;
create policy orders_owner_insert on orders for insert with check (
  user_id is not null and user_id = auth.uid()
);

-- One row per file handed out. Doubles as the record of who got what and as
-- the basis for rate limiting free downloads. Staff-read only; written by the
-- server with the service role.
create table if not exists book_downloads (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books (id) on delete cascade,
  file_id uuid references book_files (id) on delete set null,
  kind text not null check (kind in ('free', 'paid')),
  order_id uuid references orders (id) on delete set null,
  guest_key text,
  created_at timestamptz not null default now()
);
create index if not exists book_downloads_book_idx on book_downloads (book_id, created_at desc);
create index if not exists book_downloads_guest_idx on book_downloads (guest_key, created_at desc);

alter table book_downloads enable row level security;
drop policy if exists book_downloads_staff_select on book_downloads;
create policy book_downloads_staff_select on book_downloads for select using (is_staff());
