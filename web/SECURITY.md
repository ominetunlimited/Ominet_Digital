# Security — Ominet Digital

This document is the single source of truth for how the site is protected, what
was hardened before launch, and the small set of things that must be configured
**in the hosting/Supabase dashboards** (they can't live in the repo). Read it
top to bottom before the first production deploy, and re-check the "Launch
checklist" each time you deploy.

---

## 1. Threat model in one paragraph

Public visitors browse and (for paid items) buy without an account. Staff sign
in to `/admin` to publish content, moderate, and read buyer data. The two
things that must never happen: **(a)** a non-staff user reaching an admin write,
and **(b)** a forged or replayed Paystack webhook granting a free download.
Everything below defends one of those two, or the secrets/infrastructure around
them.

---

## 2. Authorization — defence in depth (writes fail closed twice)

There are **two independent layers** in front of every privileged write:

1. **Route guard — `src/proxy.ts`.** In Next.js 16 this file is the middleware
   (the framework renamed `middleware.ts` → `proxy.ts`; see `AGENTS.md`'s
   "This is NOT the Next.js you know"). It runs before any `/admin/*` page
   renders, re-validates the session JWT with Supabase, loads the caller's
   `profiles.role`, and redirects to `/admin/login` if there's no user or no
   staff role. The build output lists it as `ƒ Proxy (Middleware)`, confirming
   it's active.

2. **Per-action guard — `src/lib/auth/guard.ts`.** Every admin **server action**
   (the actual writes) calls `requireStaff()` or `requireAdmin()` first. This
   re-checks the role **at the application layer** on top of RLS, so a forgotten
   or mis-scoped RLS policy can't, on its own, expose a write. `requireAdmin`
   (super_admin/admin only) guards the money- and settings-adjacent actions
   (site settings, Mailgun/integrations); `requireStaff` guards ordinary
   content/moderation.

3. **Row-level security (RLS) — `supabase/migrations/*`.** The database itself
   is the final boundary. **All public tables have RLS enabled**, with policies
   built on `is_staff()` / `is_admin()` security-definer functions. A non-staff
   caller updating a protected row affects **zero rows** — the action then
   reports that as an error rather than a silent success.

`0033_rls_safety_net.sql` is a guard rail for the future: if a later migration
ever adds a `public` table without enabling RLS, running it force-enables RLS on
that table so it **fails closed** instead of open. Run it after any schema
change (it's idempotent and only ever adds enforcement).

> Read-only admin screens (dashboard, analytics, ad data, integrations health)
> intentionally rely on layers 1 + 3 rather than the write guard — there's
> nothing to write, and RLS already restricts their SELECTs to staff.

---

## 3. Authentication

- **Admin** sign-in is email + password via Supabase Auth (`src/lib/admin/actions.ts`),
  with **per-email+IP and per-IP throttling** on repeated failures
  (`MAX_FAILS_PER_EMAIL_AND_IP`, `MAX_FAILS_PER_IP`, 15-minute window) and an
  **audit-log entry** for every success, failure, block and sign-out
  (`src/lib/audit.ts`). Failed-login counters are read from the append-only
  `audit_log` table.
- **Readers** use passwordless email OTP for paywall/checkout access
  (`src/lib/auth-actions.ts`); guests can also like/comment/buy with an opaque
  `omd_anon` cookie (`src/lib/anon-key.ts`) — no account required, by design.
- Session cookies are `httpOnly` and `secure` in production
  (`AUTH_COOKIE_OPTIONS` in `src/lib/supabase/env.ts`).

### Recommended (dashboard-only, not in code): enforce MFA for staff
The strongest remaining auth upgrade is **multi-factor authentication for every
staff account**. This is configured in Supabase, not the app:

1. Supabase Dashboard → **Authentication → Sign In / Providers**: enable
   **MFA verification** and require it for the `authenticated` role (or enforce
   per-user under Authentication → Users).
2. Have each admin enrol an authenticator app (TOTP) on first sign-in.
3. Set a short **JWT expiry** with refresh-token rotation so a stolen token has
   a small window.

The app already re-validates the JWT server-side on every privileged action
(`getUser()`), so once MFA is required in Supabase it's enforced everywhere with
no further code change.

---

## 4. Payments — Paystack webhook integrity

`src/app/api/webhooks/paystack/route.ts` + `src/lib/payments/paystack.ts`:

- **Authenticity (layer 1):** the raw request body is checked against the
  `x-paystack-signature` header with an **HMAC-SHA512** keyed by
  `PAYSTACK_SECRET_KEY`, compared in **constant time** (`crypto.timingSafeEqual`)
  so a signature can't be narrowed byte-by-byte from timing.
- **Replay (layer 2):** fulfillment (`src/lib/payments/fulfill.ts`) never trusts
  the webhook payload — it **re-verifies the reference directly with Paystack**
  and is **idempotent** (a `paid` order short-circuits). So even a captured,
  validly-signed event replayed later grants nothing new. The route additionally
  raises a dedupe'd Telegram alert for events older than 30 minutes, so replay
  attempts are **visible** without ever dropping a genuinely late first delivery.
- **Fail-loud:** if fulfillment throws, the route returns 500 so Paystack
  retries, rather than 200-ing and silently dropping a paid order.
- The secret key is **server-only**; it's never sent to the browser and never
  logged. `src/lib/admin/integrations.ts` reports only whether a key is set and
  whether it's `sk_live_`/`sk_test_` — never the key itself.

---

## 5. Abuse protection

- **Rate limiting** (`src/lib/rate-limit.ts`) now guards the public endpoints
  that cost real work per call:
  - `/api/og-image` — **60/min/IP** (fetches a remote image + canvas re-encode;
    the most expensive public route).
  - `/api/search` — **60/min/IP** (a DB query per call).
  - `/api/track` — **300/min/IP** (analytics beacon; over the limit the event is
    dropped but still answers 200, so a beacon never breaks the page).
  - Downloads already had their own limits (`/api/books/download`,
    `/api/content/download`): per-reader/hour and a site-wide free cap.
  - Admin login is throttled per §3.
- **Origin checks** on the public write beacons reject cross-origin posters.
- **Bot filtering** on ad events (`BOT_RE`).
- **Idempotency/dedupe** on Telegram alerts (`notification_log.dedupe_key`) with
  a global per-minute ceiling, so no flood can become an alert flood.

> The in-memory limiter is per serverless instance. It stops a single abusive
> client from monopolising an instance. For a **hard global** limit in front of
> the whole site, add an edge rule (see §7) — that's the right layer for a
> distributed flood.

---

## 6. Secrets & configuration

- **No secrets are committed.** `.env*` is gitignored; only `.env.local.example`
  is tracked. Verified: `git ls-files` shows no real `.env` in the repo.
- Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`,
  `TELEGRAM_BOT_TOKEN`) are read from `process.env` and used **only** in
  server code (route handlers / server actions). They are never placed in a
  response body and never logged. Telegram additionally **redacts** its token
  from any error text it stores (`redact()` in `src/lib/notify/telegram.ts`).
- The service-role client (`src/lib/supabase/admin.ts`) bypasses RLS and is used
  **only** where there's no user session to act as (webhook fulfillment, guest
  download entitlement checks). It is never imported by a client component.
- Set all environment variables in **Vercel → Project → Settings → Environment
  Variables** for the Production environment. Never paste them into the admin
  CMS, a chat, or a ticket.


---

## 7. Infrastructure hardening (configure in the dashboard, not the repo)

These are the highest-leverage protections and they live outside the codebase:

- **WAF / CDN / DDoS:** put the site behind **Vercel Firewall** (or Cloudflare
  in front). At minimum: enable Vercel's **Bot Management / Attack Challenge**
  and a rate-limit rule on `/api/*` and `/admin/login`. This is the correct
  layer for global, distributed rate limiting that the in-memory limiter can't
  provide. Security headers (CSP, HSTS, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
  `Cross-Opener-Policy`) are already set in `next.config.ts` for production and
  the admin is `noindex`/`no-store`.
- **Supabase:** enable **Leaked Password Protection** (Auth → Policies), keep
  **email confirmations** on, and review **Auth → Rate Limits**. Restrict the
  database's allowed connections and rotate the service-role key if it's ever
  been shared.
- **Monitoring/alerting:** the app already pushes security events (bad-signature
  webhooks, blocked logins, stale webhooks) to Telegram via
  `src/lib/notify/telegram.ts`. For production, also wire **Vercel's runtime
  logs** to an error tracker (Sentry, Axiom, etc.) and set an uptime check on
  `/`. Alerts on 5xx spikes on `/api/webhooks/paystack` catch fulfillment
  outages fast.

---

## 8. Launch checklist

Before flipping the site live, confirm every box:

- [ ] All migrations `0001 → 0033` applied, **including `0033_rls_safety_net.sql`**.
- [ ] In the Supabase SQL editor, sanity-check RLS is on for every table:

  ```sql
  select tablename from pg_tables
  where schemaname = 'public'
    and not exists (
      select 1 from pg_class
      where oid = ('public.' || tablename)::regclass and relrowsecurity
    );
  ```

  → should return **no rows**.

- [ ] Production env vars set in Vercel: `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
      `PAYSTACK_SECRET_KEY` (live key), `NEXT_PUBLIC_SITE_URL` (https, real
      domain), and optionally `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`.
- [ ] At least one `super_admin` exists
      (`update profiles set role='super_admin' where id='<uuid>';`).
- [ ] **MFA required** for all staff accounts in Supabase (see §3).
- [ ] Paystack **live** webhook registered at
      `https://<domain>/api/webhooks/paystack`, and a test `charge.success`
      fulfills an order end to end.
- [ ] Vercel Firewall (or Cloudflare) in front with bot/attack challenge + a
      rate-limit rule on `/api/*` (see §7).
- [ ] Verify a **non-staff** signed-in user is redirected away from `/admin/*`
      and that calling an admin action directly returns "Not allowed."
- [ ] Confirm `NEXT_PUBLIC_SITE_URL` is `https://` (drives secure callback URLs).

---

## 9. Reporting a vulnerability

If you find a security issue, don't open a public issue. Email the site owner
directly with steps to reproduce; treat any leaked key as compromised and
rotate it in the provider's dashboard immediately.

