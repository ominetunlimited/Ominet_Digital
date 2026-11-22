# Ominet Digital: What We Fix Next

Compiled 22 November 2026 from the Site Review, Security and Growth Report, your additions to it (two outside reviews and a strategy brief), and a fresh check of the code and database.

**Labels.** *Verified* = I checked it in the code, database or your screenshots. *Reported* = an outside review said it, not yet verified by me. *Recommendation* = judgement, not fact.

## Working rules (so nothing already built breaks)

1. One small change per pull request. Each is branched from `main`, built (`tsc` and `next build`), reviewed, then merged.
2. Database changes are additive only: add columns or tables, never drop or rename. Each gets a numbered migration file that is committed with the code.
3. Content and settings changes (wording, services, images, WhatsApp number) go through the admin Centre wherever possible, not code.
4. After every merge, confirm the Vercel deployment is READY and check runtime errors before starting the next step.
5. Nothing is redesigned in one go. Working forms, emails, quotations, the blog taxonomy and the admin stay as they are unless a step names them.

## Part A. What is built, committed and pushed

Everything below is merged to `main` on GitHub (`ominetunlimited/Ominet_Digital`) and deployed on Vercel. Migrations are applied to the live Supabase project and recorded in `web/supabase/migrations/`.

| Area | What exists | Where |
|---|---|---|
| Rebrand and company-first site | Ominet Digital identity, hero with bold wordmark, intro, business areas, founder section lower on the page | PRs #2, #3, #7 |
| Enquiry and documents workflow | Project enquiry form, quotations with line items, documents, Mailgun webhook route, honeypot, consent box | Phase 3, PR #6 |
| Blog | Blog and Articles split, categories and subcategories (about 110 seeded), one primary category, editorial labels, disclosure and correction notes, related posts, category archives | PR #7, migrations 0040 to 0042 |
| NYSC and CAC services | Configurable options and itemised quotations, saved as drafts without prices | PR #6, migration 0039 |
| Trust and policy pages | Contact, Terms, Cookies, Privacy (with advertising paragraph), sitemap entries | PR #7 |
| Email | Mailgun API route plus SMTP fallback, admin status row, delivery confirmed by your real test emails | PRs #8, #9 |
| Newsletter contacts | Everyone who enquires is saved as a contact (not mailed unless they opt in); optional opt-in checkbox on both enquiry forms; admin shows name, status, source | PR #10, migration 0043 |
| AdSense | Plain script in every page head, `ads.txt` live (you confirmed it displays) | PR #10 |
| Security hardening | Pinned `search_path` on six functions, tighter newsletter insert rule, rate limits on enquiry, NYSC/CAC and newsletter forms | PR #11, migration 0044 |
| Already in place before | Strict CSP and security headers, admin proxy with staff check, row-level security on every public table, signed Paystack and Mailgun webhooks | verified |

## Part B. What we fix next, most important first

Each item says what it is, why it ranks there, how we do it without harming what exists, and how we know it worked.

### 1. Rotate the exposed credentials (you, about 15 minutes)
- **Why first.** The Mailgun SMTP password and API key were pasted into chat. Treat them as compromised. This risk outranks everything because anyone holding them can send mail as your domain.
- **Steps.** Create a new SMTP credential and API key in Mailgun, delete the old ones, update the values in Vercel project settings, redeploy.
- **Done when.** A new enquiry still produces the acknowledgement and alert emails, and the old credentials are deleted in Mailgun.

### 2. Fix the WhatsApp link (verified bug, small, high impact)
- **Evidence.** The live setting stores the number as `09026057899`. The site builds the link as `wa.me/09026057899`, which WhatsApp rejects. The Contact page already uses the correct `2349026057899`, so only the setting-driven buttons are broken.
- **Fix, two parts.** (a) In admin, change the saved WhatsApp number to `2349026057899`. (b) A tiny code change that converts a Nigerian local number (starting with 0) to the international form, so this cannot recur. One shared helper, used by the button and the Services page.
- **Done when.** Tapping any WhatsApp button on a phone opens a chat with +234 902 605 7899.

### 3. One company email everywhere (verified, small)
- **Evidence.** The default booking email in code and the saved setting is `ominetmedia@gmail.com`, while the rest of the site uses `info@ominetdigital.com.ng`. The outside review says the gmail address appears on the homepage contact area (reported, not yet seen by me).
- **Fix.** Change the saved setting in admin; search the site for any visible gmail address; keep gmail only if you deliberately want internal alerts there.
- **Done when.** No public page shows a personal gmail address.

### 4. Confirm live basics (you, about 10 minutes)
- View source on the home page, one article and one service page. Confirm the canonical tag starts with `https://www.ominetdigital.com.ng`.
- Vercel, Domains: confirm the `*.vercel.app` address redirects to the main domain.
- Search Console: confirm ownership and submit `/sitemap.xml`.
- Check that Mailgun and Selar links work for a real customer.
- **Why.** The Improvement Plan flagged these in October. The code now blocks vercel.app canonicals, but I cannot see live pages from here.

### 5. Account security (you)
- Two-factor authentication on admin, GitHub, Vercel, Supabase, Mailgun and AdSense.
- Supabase leaked-password protection (may need a paid plan).
- Optional later: a Vercel Firewall rate-limit rule for a hard global limit on forms.

### 6. Email deliverability (you in Mailgun, then a small code step)
- Add the delivery webhook and signing key, so bounces and complaints are recorded (route already exists).
- Verify the root domain (SPF, DKIM, DMARC) to remove the "on behalf of" display and protect against spoofing.
- Send yourself a test campaign before the first real newsletter.
- Reported but not verified: an earlier drafted welcome email may have gone out with guessed services in square brackets. If you sent it, a short correction is better sooner than later.

### 7. Content depth, the AdSense blocker (ongoing, you with my help)
- **Evidence.** Google rejected the site on 18 Oct 2026 for low value content (verified from your screenshot).
- **Plan.** Roughly 15 to 25 substantial original posts and articles before asking for review (my rule of thumb, Google publishes no number). Hide or noindex any empty or draft page. Do not request review until the target is met.
- **Check the blog's fit.** The outside review says the blog leads with global news and gaming, which does not match the services pitch, and that blog cards show a whole paragraph instead of an excerpt (reported). We verify both, then decide the topic focus and card excerpt length. News posts need clear sources.

### 8. Company identity pages (medium risk, do as separate PRs)
From your strategy brief, the parts that fit the current build:
- **8a. About Ominet Digital vs Founder.** Today `/about` still tells the founder's story, and `/omini-nfawa` exists. Make `/about` the company page (draft text is in your brief) and leave the founder story on its own page. Content only, no layout rebuild.
- **8b. Homepage copy.** Check for duplicated hero and About text, and replace vague product blurbs. The homepage title is just "Ominet Digital"; add a keyword-bearing title and description (for example book publishing, design and writing services in Nigeria). Page titles use a dash separator that conflicts with your no-em-dash style, which we can change in one line.
- **8c. Navigation.** Current top level is long. The brief proposes Home, Explore, Services, Products, About, Contact plus a Discuss a Project button, with dropdowns. Do this after 8a so the destinations exist. Test on a phone before and after.
- **8d. Honest product status.** PROFILE and Cortexa Office should say clearly whether they are available, in development or coming soon, and sit lower in navigation until launched. The Media page should not look empty.

### 9. Proof of work (the biggest gap in the Improvement Plan)
- Add a Work page and three honest case studies, each labelled personal, simulated, volunteer or paid. Use your own photos and videos, not stock images.
- Upload real media (photography, video, book covers, design samples) in the admin Media section. Get permission before showing any client work.
- Group services under four headings (publishing and editorial, creative and media, digital solutions, business and professional support) and use one page template: who it is for, what is included, process, timeline, price or "Request a quote", questions, enquiry button.
- NYSC and CAC stay under business support, separate professional fees from official charges, and promise no government outcomes. Set prices, then publish.

### 10. Measure what works
- Install Google Analytics 4 behind the cookie consent banner. Track form submissions, WhatsApp clicks, email clicks and newsletter signups.
- Monthly numbers: service page visits, enquiries by source, signups, top search pages, enquiry-to-call rate.
- Add campaign tags to shared links.

### 11. Newsletter that people want
- Replace the generic signup note with one concrete promise and frequency (for example one monthly email: one lesson, one project, one reading), plus a free checklist from your own work.
- Later: let subscribers choose interests, and keep transactional and marketing mail separate (already true in code: enquirers are contacts, not subscribers, unless they opt in).
- Add a retention rule for cold enquiries (for example 12 to 24 months) and state it in the privacy page. Not legal advice.

### 12. Growth and performance
- Link essays to matching services with one line.
- Run PageSpeed Insights on mobile for the home page, an article and a service page. Fix the largest images first.
- Structured data for the organisation and services (articles already have it).
- Market through search, LinkedIn, WhatsApp communities, guest articles and one free pilot project in return for a case study. The X link block is still unresolved (see `docs/X_LINK_BLOCK.md`), so lean on other channels meanwhile.
- When AdSense is approved: exclude admin, enquiry and checkout pages from auto ads.

## Part C. Outside review claims against the code (so we do not chase ghosts)

| Claim | Status |
|---|---|
| Homepage leads with the founder, not the company | Out of date. The company-first hero shipped in PR #7. |
| Broken WhatsApp number format | **Confirmed.** Fix is step 2. |
| Gmail shown instead of company email | Setting confirmed; visible placement not yet confirmed. Step 3. |
| Navigation crowded | Plausible; to be re-checked on a phone. Step 8c. |
| Duplicate hero and About copy | Not checked. Step 8b. |
| Homepage title too generic | Confirmed in code (title is only the site name). Step 8b. |
| Blog off-topic and cards too long | Not checked. Step 7. |
| Empty Media, "coming soon" pages | Not checked live; consistent with the Improvement Plan. Steps 8d and 9. |
| Stock photography | Not verified. Step 9. |
| Em dash in a homepage line | Not found in the homepage file. Page title template does use one. |
| Mailgun workflows and consent split | Largely built; segmentation and preferences are future work. Step 11. |

## Part D. Suggested order of work

1. You: steps 1, 4 and 5 (credentials, live checks, two-factor). Parallel to everything else.
2. Me, one PR each: step 2 (WhatsApp), then step 3 (email), after you change the two admin settings.
3. Me: step 8b (title, description, duplicate copy), then 8a (About vs Founder).
4. You and me: step 7 and step 9 as continuous work (posts, media, case studies).
5. Me: step 10 (analytics with consent), step 8c (navigation), step 6 follow-ups.

Not yet built from earlier plans: popular and trending posts, comments management, a full performance and accessibility audit, the final Phase 4 report, and before/after performance numbers.
