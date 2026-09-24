# Omini Nfawa Digital House — project brief

Full spec pasted by user covers an entire publishing ecosystem (personal site + Ominet Digital + PROFILE gateway): editorial writing platform, book catalogue w/ external purchase links, media/photography, store, admin/CMS, search, newsletter, analytics, migration from Blogger/WordPress, full data model and API architecture, and a "Claude Code Implementation Handoff" doc.

Key constraints from the brief:
- Three distinct identities: OMINI NFAWA (person/author), OMINET DIGITAL (creative org), PROFILE (separate product, own identity — gateway only, not a full section).
- Visual system: dark teal-black/green/rounded-card palette (ref: uploads/WhatsApp Image 2026-09-24.jpeg — #023337 dark, #4ea674 green, #c0e6b9 light green, #e9f8e7 near-white) applied to every page EXCEPT the PROFILE page, which keeps its own blue identity (--om-blue family) per its "separate product" requirement. Implemented via token overrides in theme-tokens.css. Shared chrome (Nav/Footer) uses the dark teal/green even on the Profile page; only Profile's own content sections stay blue.
- Must avoid feeling like Blogger/WordPress/generic SaaS/generic portfolio.
- Geometric visual motif behind content (subtle, low-opacity).
- Distinctive typography (no Inter/Roboto/Arial/generic).
- This is a DESIGN deliverable (Design Components, static/interactive HTML) — not a real backend. Schemas/API/admin dashboards described in the brief should be represented as UI/IA design, not implemented as working systems.

This file should be updated as scope/decisions are locked in with the user.
