# X (Twitter) says the site link is harmful

## What I could and could not check
- The live site content, as fetched, shows nothing that normally trips link-safety systems: no login or payment forms, no crypto content, no hidden frames, no pop-ups, no URL shorteners, no redirect chains. The code has no user-agent based behaviour, so the page cannot look different to X's crawler than to a visitor.
- I could **not** query reputation databases (Google Safe Browsing, VirusTotal, urlscan) from the build environment, and I cannot see X's own list. So I cannot tell you which list holds the flag. The steps below find that out.

## How X decides (from X's own Help Center)
X blocks or warns on links using third-party security vendors, industry and NGO partners, its own tooling, and user reports. Links flagged by a vendor with low confidence get a warning; reviewed links can be blocked outright. A site owner can ask for review through X's "block appeal" form from the Help Center article "Our approach to blocking links" (https://help.x.com/en/safety-and-security/phishing-spam-and-malware-links.html). The form wants the full, un-shortened URL.

## Do these, in this order
1. **Note exactly what X shows**: a hard block ("can't post this link") or a warning page. Screenshot it.
2. **Find the source list** (all free, none need an account):
   - Google Safe Browsing: https://transparencyreport.google.com/safe-browsing/search and Search Console, Security issues (add `ominetdigital.com.ng` as a Domain property).
   - VirusTotal: search the domain and the www URL; note any vendor with a red flag.
   - Spamhaus DBL, SURBL and URLhaus lookups for the domain.
3. **If a vendor flags it**: use that vendor's delisting form. X's vendors follow those lists, so clearing the source is what actually removes the block.
4. **Submit X's block appeal** with the full URL `https://www.ominetdigital.com.ng/` (and, if only some paths are blocked, one of those too). Say it is your own site, name the organisation, and mention it was rebuilt this month.
5. **Test with both forms** (`www` and the bare domain) and with a deep link such as `/books`. Report which are blocked; it tells X's reviewers whether it is domain-wide.
6. **Do not work around it** with link shorteners or look-alike domains. X blocks those and it can make the domain's reputation worse.

## Things that commonly cause this, worth ruling out
- The domain, or its previous site, was reported or listed before the rebrand (new or recently changed `.com.ng` domains start with little reputation, so one report goes a long way).
- Another site on the same hosting IP was flagged. This site is on Vercel's shared network, so ask in the appeal for a domain-level review rather than IP-level.
- A page that was changed or compromised in the past is still cached by a vendor. Delisting forms usually ask you to confirm the site is clean.

## What is already in order on our side
Strict security headers (HSTS, a content security policy, no framing), a sitemap and robots file, a single canonical URL, HTTPS only, and no third-party scripts unless AdSense is switched on.
After the rebrand branch is deployed, re-run step 2 once, because the live site still serves the old build until you merge.

## Findings from the November 2026 check

- Nothing in the site's code, headers or robots.txt triggers an X block. X's "potentially harmful" notice comes from its own and partner reputation lists, which cannot be queried from Vercel or Supabase.
- The apex domain (ominetdigital.com.ng) answers with a 308 redirect to www. Post the www address directly so link checkers see no redirect chain.
- The duplicate Vercel domain (ominet-digital-ftpx.vercel.app) serves the same site. Redirect it to www in Vercel (Project, Settings, Domains) so there is one address and one reputation.
- Steps for the owner: check the domain on Google Safe Browsing and VirusTotal, confirm it in Google Search Console, then send X an appeal through the Help Center link in the error message. Test with a fresh www post after each step.
