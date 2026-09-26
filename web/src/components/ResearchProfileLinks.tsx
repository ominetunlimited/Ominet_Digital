import { css } from "@/lib/css";
import { getResearchProfiles, type ResearchProfile } from "@/lib/research";

const REL = "me noopener noreferrer";

/** Renders nothing at all when no links are set for that placement. */
export async function ResearchProfileSection({ placement, title = "RESEARCH PROFILES", padded = true }: { placement: "profile" | "research"; title?: string; padded?: boolean }) {
  const links = await getResearchProfiles(placement);
  if (links.length === 0) return null;
  return (
    <section style={css(padded ? "padding:var(--space-8) var(--space-6);" : "margin:var(--space-6) 0;")}>
      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>{title}</div>
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        {links.map((l) => (
          <a key={l.id} href={l.url} target="_blank" rel={REL} className="btn btn-secondary">
            {l.label} &#8599;
          </a>
        ))}
      </div>
    </section>
  );
}

/** Link list for the dark footer column; renders nothing when empty. */
export async function ResearchFooterLinks() {
  const links = await getResearchProfiles("footer");
  if (links.length === 0) return null;
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: "0.1em", opacity: 0.6, marginBottom: "var(--space-3)" }}>RESEARCH</div>
      <div style={{ display: "grid", gap: "var(--space-2)", fontSize: 13 }}>
        {links.map((l) => (
          <a key={l.id} href={l.url} target="_blank" rel={REL}>{l.label}</a>
        ))}
      </div>
    </div>
  );
}

export type { ResearchProfile };
