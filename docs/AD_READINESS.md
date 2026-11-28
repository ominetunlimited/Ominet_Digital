# Ad readiness report

Status as of 28 November 2026. Facts are from the repository and the live database. Items marked "unknown" could not be verified from here.

## Verdict

The plumbing is built and safe. Nothing is live yet, by design: every ad position is switched off and no AdSense or direct-ad IDs exist. Turning ads on is a configuration and approval task, not a coding one.

## Ready

- `ads.txt` is served and correct.
- The AdSense script loads site-wide in the head.
- Six positions exist: `home_top`, `home_middle`, `article_inline`, `book_page`, `media_page`, `blog_inline` (new, migration 0051).
- Direct ads (advertisers, campaigns, creatives, placements, impression and click tracking) with an "Advertisement" or "Sponsored" label and `rel="sponsored noopener noreferrer"`.
- AdSense units now request an ad only when within 300 px of the viewport, push once, reserve space (no layout shift), label themselves, and hide if Google returns no ad or the script is blocked.
- Privacy and cookie pages mention AdSense.

## Not ready

1. All six placements are inactive and have no AdSense client or slot IDs.
2. There are no advertisers, campaigns or ads in the database.
3. AdSense loads without a consent choice. Visitors from the EEA and UK require a Google-certified consent platform before personalised ads.
4. The Content Security Policy is an allowlist. Google supports only a strict, nonce-based policy for ads. Test with a live ad and read the browser console.
5. AdSense approval status: unknown.
6. Content quality: 16 pages are still unindexed and some are thin. AdSense reviewers judge this.

## Placement and design guidance

- Best: `article_inline`, `blog_inline`, `book_page`, `home_middle`. These sit between content blocks, after the reader has what they came for.
- Avoid `home_top` (above the fold, hurts first impression and speed).
- Keep ads away from download, buy and submit buttons. Accidental clicks cause invalid-traffic penalties.
- No popups, sticky overlays or interstitials.
- One good unit per page beats several. Use responsive sizes.

## On "makes a visitor click"

Google AdSense forbids encouraging or tricking clicks: arrows, "click my ads", disguised or misleading placement. Breaching this gets the account banned. Legitimate gains come from relevance, a clear label, fast pages, responsive sizes and good position.

## Go-live checklist

1. Confirm AdSense approval for ominetdigital.com.ng.
2. Create ad units, then enter client and slot IDs in Admin, Advertising.
3. Decide on consent: add a certified CMP, or limit to non-personalised ads.
4. Activate one placement (`article_inline`), check the console for CSP errors, then add others.
5. For direct ads: create advertiser, campaign and creative, assign to a placement.
6. Watch Core Web Vitals for a week after activation.
