# Phase 3 progress report: Blog, NYSC and CAC

Branch `phase3-build`. Migration 0039 is already applied to Supabase (project `sioqrzpggnotrvjwilgw`).

## Built and verified
| Area | What exists | How it was checked |
|---|---|---|
| Blog | `/blog` (featured story, latest grid, category chips, search, month filter, pagination, newsletter box) and `/blog/[slug]` (breadcrumbs, cover, byline, updated date, reading time, body, tags, author box, share bar, related articles, newsletter) | Production build passes. Visibility rules tested in the database (see below). Pages not yet viewed with real articles |
| Blog admin | In Admin > Content: "Publish in Blog", category, tags, featured story, author, cover alt text, dedicated 1:1 social image with square preview and warnings, SEO fields, draft / scheduled / published / archived. Admin > Blog categories (editable). "New blog article" shortcut | Type check, lint, build. Not clicked through on the live admin |
| Square social image | Open Graph uses the 1:1 image (1080 x 1080, centre-cropped on the fly, original untouched). Falls back to the cover. X gets a 1200 x 630 crop for its large card. Alt text, canonical, article type, dates, author, section, tags | Code only. Needs a real share test (see "Needs you") |
| Scheduling | Scheduled posts go live automatically when due. A database function promotes them whenever blog pages or the sitemap are built (no scheduler extension was enabled) | Tested in the database: future post hidden, due post promoted and then visible, draft hidden |
| Blog SEO | Unique titles, descriptions, canonical URLs, BlogPosting + BreadcrumbList + Blog JSON-LD, sitemap includes published posts only, filtered and paged views are noindex, blog posts redirect from `/writing/<slug>` to `/blog/<slug>` | Build; not validated in Google's Rich Results tool |
| robots.txt | `/api/og-image` is now explicitly allowed. It was blocked by `Disallow: /api`, which stops X and others loading share images served from it | Code |
| NYSC | One service, four options (Direct Posting 3 weeks, PPA Posting 72 hours, Relocation 1 month, Reposting 48 hours) stored in the database and edited in admin | Seed verified in the database. Form logic tested in a browser |
| CAC | Separate service with 17 sub-services in five groups, each switchable on or off | Seed verified |
| Request form | `/services/<slug>/request`: first question is "Which NYSC / CAC service do you require?" (NYSC single choice, CAC multiple), duration shown from the database, conditional fields per option, optional uploads, consent box, "never send passwords, PINs or OTPs" notice, honeypot and rate limits, server-side re-validation of every field and option | Conditional fields and duration display tested in a browser for all four NYSC options and a multi-select CAC case. Submission code not run against the live database or Mailgun |
| Emails | One acknowledgement template for both services with dynamic values, plus an admin notification to info@ominetdigital.com.ng, logged in Email activity | Code only. Mailgun is not configured, so no email has been sent |
| Quotations | Itemised charges: professional fee, official charge, other. Total is the sum. Shown in the admin editor, quotation emails and PDFs | PDF renders without error. Emails and admin editor not exercised |
| Admin bookings | Filters for NYSC / CAC / project enquiries, sub-service, date range, search by name, email or reference | Type check and build; not clicked through |
| Admin options editor | On the service edit page: name, group, time, price mode (fixed, from, range, quote), official charge, requirements, active switch, order | Type check and build |
| Security | Anonymous visitors cannot see draft services, inactive options, draft or future-dated posts, and cannot write options | Tested in the database |

## Not built or not done
- Popular and trending articles. There is no reliable view tracking on articles, and the brief forbids made-up figures.
- Embedded video inside blog articles. The editor has no video embed.
- Comments management for blog articles. The existing comments system was not connected to /blog.
- Separate NYSC email template per option (one reusable template was requested and built). Quotation acceptance, receipt and completion emails use the existing workflow, which now carries the option in the service title.
- NYSC and CAC prices, CAC official fees and CAC durations. None were invented. CAC options are "Quote on request" with no time. The CAC trustees and documentation sub-services are seeded inactive until you confirm you offer them.
- Whole-site performance work (Part Seven): no baseline or after Lighthouse measurements were taken, no image or bundle audit, no cache-header changes. Nothing is claimed.
- Automated accessibility audit, load testing, and an automated test suite.
- Data retention and deletion procedure for enquiry files (Part Ten). Files are private and signed-URL only, as before, but no retention rule was added.

## Needs you
1. Merge, then check Admin > Services: NYSC and CAC are **drafts**. Set prices, confirm CAC details against current CAC information, then publish.
2. Set up Mailgun (docs/MAILGUN_SETUP.md). Until then no acknowledgement or quotation emails are sent.
3. Write one blog article, tick "Publish in Blog", add a square image, publish, then test the link in the Facebook Sharing Debugger and the X Card validator and WhatsApp.
4. Test the full journey once with your own email: submit a NYSC request, quote it, record a payment, issue a receipt.
