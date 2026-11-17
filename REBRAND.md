# Ominet Digital rebrand: what changed and what you must do

## What changed (all inside `web/`)
- **Brand tokens**: new palette, Georgia headings, restrained radii and shadows in `src/app/globals.css`. Old token names still work.
- **Logo**: official mark (traced from your logo file) in `public/images/ominet-digital-logo.svg/.png`, favicons, app icons, web manifest and the default share image. Nav, footer, home and admin use it.
- **SVG art system**: `public/art/` holds 10 service illustrations, 10 portfolio illustrations (with `image-slot-*` groups), 9 content-type illustrations (book, article, essay, blog, media, store, profile, cortexa, default), A5 portrait variants, the brand mark and the style reference.
- **One card**: `src/components/ArtCard.tsx` (whole card is one keyboard-focusable link). An uploaded image always wins; otherwise the branded SVG shows. `PlaceholderImage` now renders this art everywhere it was already used.
- **Services page**: rebuilt from your specification (hero, card directory, process, call to action). Home page gets a services section.
- **Admin → Pages & tabs** (`/admin/pages`): switch any page on or off; add new tabs (an internal path such as `/podcast`, or an https link). Off pages vanish from the menu, footer and sitemap and answer 404. Stored under the existing `site_settings` table, key `site_pages`. No migration needed.
- **URLs**: `SITE_URL` can never be a `*.vercel.app` address; it falls back to `https://www.ominetdigital.com.ng`. `metadataBase` is set. Sitemap now follows the page toggles.
- PROFILE and Cortexa app addresses are now read from `NEXT_PUBLIC_PROFILE_APP_URL` and `NEXT_PUBLIC_CORTEXA_APP_URL`.

## You must do these in the dashboards (not possible from code)
1. **Vercel → Settings → Environment Variables**: set `NEXT_PUBLIC_SITE_URL=https://www.ominetdigital.com.ng` for Production, then redeploy.
2. **Vercel → Domains**: make `www.ominetdigital.com.ng` the primary domain and redirect the `*.vercel.app` address to it.
3. **Supabase → Authentication → URL Configuration**: set Site URL to `https://www.ominetdigital.com.ng` and keep `https://www.ominetdigital.com.ng/auth/callback` in the redirect list; remove vercel.app entries.
4. **Paystack**: callback and webhook URLs should use the ominetdigital.com.ng address.
5. **Admin → Settings**: if a logo, favicon or default share image was uploaded earlier, it overrides the new static files. Clear them (or upload the new logo) so the new identity shows.
6. **PROFILE / Cortexa**: once those apps have their own ominetdigital.com.ng addresses, set the two env vars above.
7. Re-submit the sitemap in Google Search Console after deploying.

## Known limits
- Checked with `tsc` and `next build`, and by eye in headless Chrome on the home page, the card grid, mobile and dark mode. Not tested against your live Supabase data, so the admin Pages screen and real service records are untested.
- Two existing lint errors in `AdSenseAd.tsx` and `AdSenseResponsive.tsx` (`any`) were left alone.
- `web/.env.local` is committed in the repo. It only holds the public AdSense ID, but it is better ignored by git.
- Book, writing and media list pages keep their existing layouts (new colours, fonts and art fallbacks). Moving them onto `ArtCard` is the natural next step.
