# Ominet Digital rebrand and platform upgrade: technical completion report

Branch `rebrand-2026` (app in `web/`), Supabase project `sioqrzpggnotrvjwilgw`, Vercel project `ominet-digital-ftpx`.
Nothing on the live site has changed yet. The live site serves the old build until the branch is merged and deployed.
The database changes below are already applied to the live Supabase project; they are additive and safe for the old site.

## 1. What was delivered

**Brand and site (phase 1)**
- New logo, favicon and brand system (indigo, ivory, cyan, azure), applied through the site and the admin.
- SVG card and art system, admin page toggles, rebuilt Services pages with the specified wording.
- Homepage reordered: the ecosystem moved down the page.

**Phase 2**
- **Discuss a project** (`/discuss-a-project`): detailed form, mandatory email, service-specific fields, reference numbers, acknowledgement and internal emails, optional reference files (up to 5, 4 MB each, content-checked, private storage).
- **Rich-text editor** (TipTap) across the admin: services, books, site settings and the document editor. Content is sanitised on save and again on render.
- **Quotation and booking workflow**: 14 controlled stages, versioned quotations with history, client accepted or declined, booking confirmed only from an accepted quotation, client emails at the stages that need them, full audit trail.
- **Payments**: deposits, instalments, balances; outstanding amount computed; overpayment refused; payments can be voided with a reason.
- **Documents and PDFs**: quotation, booking confirmation, agreement, invoice, payment receipt, completion note. Unique yearly numbers (`INV-2026-0001`), editable drafts, `[[placeholders]]` block issuing, issued documents locked, void instead of delete, PDF emailed as an attachment. A receipt exists only for a recorded payment (enforced in the database).
- **Admin sections**: Bookings (workflow panel), Clients, Projects, Documents, Email activity (with retry).
- **Mailgun delivery tracking**: signed webhook, idempotent, stores events, updates delivery status.
- **Card families**: books, articles, media, portfolio (photography), ecosystem. Services cards unchanged.
- Amazon author page link in place.

## 2. Database migrations (already applied live)
`0034` booking enquiry fields, `0035` quotation workflow, `0036` payments and documents (payments table is `booking_payments`; the store's Paystack `payments` table is untouched), `0037` email delivery tracking, `0038` enquiry uploads and private storage bucket.
All new tables use row-level security limited to staff. Supabase security advisors show 5 intentional anon-callable functions (unchanged), plus "leaked password protection disabled", which is a dashboard setting.

## 3. How it was checked
| Area | Check | Result |
|---|---|---|
| Whole app | TypeScript, `next build` | Clean |
| Lint | ESLint | 2 errors, both in the older AdSense components (`any` types), not in this work |
| Rich text | Playwright paste test incl. `<script>` and `javascript:` | Stripped |
| PDFs | Rendered all six kinds, inspected pages | Layout good; ₦ prints as "NGN" (built-in fonts have no naira sign) |
| Document numbering | Run in the live database, rolled back | Sequential; receipt without payment rejected |
| Webhook | Signature, stale, tampered, ordering logic | Behaves as intended |
| Uploads | Type and magic-byte validation, name sanitising | Rejects disguised files and path tricks |
| Email with PDF | Request built by the real code against a stand-in for Mailgun | Attachment present, named, byte-identical |
| Cards | Screenshots of books, writing, ecosystem | Good at desktop and phone width |

## 4. Not verified (be honest about these)
- **A real email through Mailgun.** No Mailgun credentials were in the database and the build environment cannot reach Mailgun. See `docs/MAILGUN_SETUP.md`, section 4, for the test.
- **The Mailgun webhook against Mailgun itself**, and a real file upload (no storage key locally). Try both on the preview deployment.
- **Vercel**: deployments, domains, environment variable names, runtime errors and the served logo, favicon and OG image. The Vercel team access link still needs your approval.
- **Accessibility and SEO audits** were designed in (labels, focus styles, alt text, sitemap, metadata) but no automated audit (axe, Lighthouse) was run.
- **No automated test suite** was added; checks above were targeted scripts.
- **The X link block**: see `docs/X_LINK_BLOCK.md`. The cause could not be identified from here.

## 5. Known limits and decisions
- Agreement text is built only from the accepted quotation, with an editable "Additional terms" section. Have a lawyer review the template before first use.
- Invoices need payment details typed in (placeholder blocks issuing until filled).
- 4 MB per uploaded file is the hosting request limit; bigger files go by email.
- Portfolio cards are used for photography on `/media`; the site has no separate portfolio content type yet.
- Totals in Clients and Projects are shown per currency and never summed across currencies.

## 6. Merge and deploy checklist (in this order)
1. Approve the Vercel team access link (needed for my checks, not for deploying).
2. **Vercel environment, Production**: confirm names exist (values stay in Vercel): `NEXT_PUBLIC_SITE_URL` (= `https://www.ominetdigital.com.ng`), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`. Optional: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NEXT_PUBLIC_PROFILE_APP_URL`, `NEXT_PUBLIC_CORTEXA_APP_URL`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, and the Mailgun fallbacks (`MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_REGION`, `MAILGUN_WEBHOOK_SIGNING_KEY`).
3. Open a pull request from `rebrand-2026` to `main`; let Vercel build the **preview** first and click through: home, services, books, writing, media, discuss-a-project, admin login, a booking's Details panel.
4. Merge. Watch the production build.
5. After deploy: view-source the home page and confirm the logo, favicon and `og:image` are the new ones, and that `og:url` and canonical use `https://www.ominetdigital.com.ng`.
6. Set up Mailgun (`docs/MAILGUN_SETUP.md`), then run its test plan.
7. Dashboard items that only you can do: Supabase Auth Site URL and redirect URLs, Paystack callback and webhook URLs, PROFILE and Cortexa environment variables, enable leaked-password protection, resubmit the sitemap in Search Console.
8. Work through `docs/X_LINK_BLOCK.md`, and re-check the link after the deploy.

## 7. Rollback
Vercel keeps the previous production deployment; "Promote" it to roll the code back instantly. The database changes are additive, so the old code keeps working against the new schema.
