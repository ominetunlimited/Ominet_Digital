-- Sending real newsletter campaigns (via Mailgun — see src/lib/mailgun.ts)
-- needs two things the subscriber-list-only setup didn't: a way for each
-- recipient to unsubscribe without an account (a per-subscriber token, same
-- spirit as the anon_key/guest pattern used elsewhere), and a record of
-- what was actually sent, to show in Admin -> Newsletter and to stop an
-- admin from accidentally double-sending the same draft.

alter table newsletter_subscribers add column if not exists unsubscribe_token uuid not null default gen_random_uuid();
create unique index if not exists newsletter_subscribers_token_idx on newsletter_subscribers (unsubscribe_token);

create table if not exists newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body_html text not null,
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent', 'failed')),
  recipient_count int not null default 0,
  error text,
  sent_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists newsletter_campaigns_created_idx on newsletter_campaigns (created_at desc);

alter table newsletter_campaigns enable row level security;
drop policy if exists newsletter_campaigns_staff_all on newsletter_campaigns;
create policy newsletter_campaigns_staff_all on newsletter_campaigns for all using (is_staff()) with check (is_staff());

-- The public unsubscribe route (src/app/unsubscribe) needs to flip one
-- subscriber to 'unsubscribed' by token, without being able to read or
-- touch any other row. A plain RLS policy can't express "only the row
-- whose token matches the one the caller is asserting" — RLS has no
-- visibility into a request parameter, only column values and session
-- context — so this is a SECURITY DEFINER function instead (the same
-- pattern as is_staff()/is_admin() in 0001_init.sql): it alone can see
-- every row, but all it will ever do is this one narrow, token-gated
-- update. No RLS policy grants broader access to this table.
create or replace function unsubscribe_newsletter(token uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  update newsletter_subscribers
  set status = 'unsubscribed'
  where unsubscribe_token = token and status = 'subscribed'
  returning true;
$$;
-- Called directly via supabase.rpc() by anyone with an unsubscribe link,
-- signed in or not — PostgREST needs explicit execute rights for that,
-- unlike is_staff()/is_admin(), which Postgres only ever invokes itself
-- from inside an RLS policy.
grant execute on function unsubscribe_newsletter(uuid) to anon, authenticated;
