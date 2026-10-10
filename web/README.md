# Ominet Digital — web

Next.js (App Router, TypeScript) implementation of the approved Ominet
Digital design (see `../project/`), backed by Supabase.

> **Going live? Read [`SECURITY.md`](./SECURITY.md) first.** It covers the admin
> authorization layers, RLS, the Paystack webhook, rate limiting, secret
> handling, and a launch checklist (MFA, WAF, env vars) for production.

## Local development

```bash
npm install
npm run dev
```

Without a configured Supabase project, pages fall back to placeholder
content bundled in `src/lib/content.ts` — the site still renders, but admin,
payments and search-against-a-real-database are inert.

## Wiring up Supabase

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from
   Settings → API.
3. Run the migrations in `supabase/migrations/` against that project, in order
   (via the SQL editor in the dashboard, or `supabase db push` if you have the
   CLI linked). `0001_init.sql` creates the schema, RLS policies and the
   `media` storage bucket; `0002_seed.sql` seeds the placeholder content so
   the live site matches the design immediately.
4. Sign up once on `/admin/login` isn't possible yet (there's no self-serve
   signup) — instead, create your admin user from the Supabase dashboard
   (Authentication → Users → Add user), then in the SQL editor run:
   ```sql
   update profiles set role = 'super_admin' where id = '<the user's UUID>';
   ```
5. Sign in at `/admin/login`.

## Wiring up Paystack

1. Get your secret key from the Paystack dashboard (Settings → API Keys &
   Webhooks) and set `PAYSTACK_SECRET_KEY` in `.env.local`.
2. Add a webhook in the Paystack dashboard pointing at
   `https://<your-domain>/api/webhooks/paystack` — this is the authoritative
   fulfillment path; `/checkout/callback` is just the UX redirect and
   re-verifies the same way.
3. Set `NEXT_PUBLIC_SITE_URL` to your real domain once deployed (checkout
   callback URLs are built from it).

Only Paystack is implemented live. `src/lib/payments/paystack.ts` is the
shape to copy for Stripe/Flutterwave later — nothing else in the checkout
flow should need to change.

## What's stubbed, honestly

- **Store**: the `products` table and admin list are live; the public
  `/store` page still renders placeholder items — next pass.
- **Social**: no platform is API-connected (that needs each platform's
  developer app + OAuth). `/admin/social` generates pre-filled share links
  instead of posting directly, and says so on the page.
- **AdSense**: slots render nothing until `NEXT_PUBLIC_ADSENSE_CLIENT_ID` and
  a placement's `ad_client`/`ad_slot` are set in `/admin/advertising`.
- **Newsletter**: subscribers are captured; sending campaigns needs an email
  provider (Resend, Mailgun, etc.) wired into `/admin/newsletter`.
