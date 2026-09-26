-- A visitor had to sign in via the reader magic-link BEFORE they could even
-- start a Paystack checkout — startContentCheckout required auth.getUser()
-- to return a user, purely so the order/entitlement had something to key
-- on. That's a real guest-purchase violation: orders.user_id was already
-- nullable (guest orders were half-supported at the schema level), but
-- entitlements.user_id was NOT NULL, and nothing accepted a raw guest email.
--
-- This adds a guest_key (the same anon-cookie identity already used for
-- anonymous likes) plus a denormalized email to entitlements, so a guest's
-- payment unlocks the content in their own browser immediately. The
-- existing signed-in path is untouched — anyone who already purchased
-- while signed in keeps working exactly as before.

alter table entitlements alter column user_id drop not null;
alter table entitlements add column if not exists guest_key text;
alter table entitlements add column if not exists email text;

alter table entitlements drop constraint if exists entitlements_user_id_content_id_key;
alter table entitlements drop constraint if exists entitlements_user_id_product_id_key;
alter table entitlements add constraint entitlement_identity check (user_id is not null or guest_key is not null);

create unique index if not exists entitlements_user_content_uidx on entitlements (user_id, content_id) where user_id is not null and content_id is not null;
create unique index if not exists entitlements_user_product_uidx on entitlements (user_id, product_id) where user_id is not null and product_id is not null;
create unique index if not exists entitlements_guest_content_uidx on entitlements (guest_key, content_id) where guest_key is not null and content_id is not null;
create unique index if not exists entitlements_guest_product_uidx on entitlements (guest_key, product_id) where guest_key is not null and product_id is not null;

drop policy if exists entitlements_owner_select on entitlements;
-- A guest's entitlement check is spoofable in principle (no auth context
-- to verify a guest_key against), same tradeoff already accepted for
-- anonymous likes — the guest_key is a random UUID never exposed to
-- client JS or any URL, and the worst case is reading a yes/no on an
-- unrelated guest's paid-article access, not payment or personal data.
create policy entitlements_owner_select on entitlements for select using (
  (user_id is not null and user_id = auth.uid())
  or (user_id is null and guest_key is not null)
  or is_staff()
);

alter table orders add column if not exists guest_key text;

drop policy if exists orders_owner_insert on orders;
create policy orders_owner_insert on orders for insert with check (
  (user_id is not null and user_id = auth.uid()) or (user_id is null and guest_key is not null)
);

drop policy if exists orders_owner_select on orders;
create policy orders_owner_select on orders for select using (
  (user_id is not null and user_id = auth.uid())
  or (user_id is null and guest_key is not null)
  or is_staff()
);
