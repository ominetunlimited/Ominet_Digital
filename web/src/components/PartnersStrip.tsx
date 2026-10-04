import { css } from "@/lib/css";
import type { PartnerApp } from "@/lib/data";

/**
 * Public ecosystem apps (Admin -> Ecosystem apps, "Public" switch) with a
 * logo/image — the admin-manageable "add a link/logo, no code" pattern
 * requested for partner businesses, services and future ecosystem entries.
 * Renders nothing when there's nothing to show, so pages look exactly as
 * before until an admin adds something here.
 */
export default function PartnersStrip({ apps }: { apps: PartnerApp[] }) {
  if (apps.length === 0) return null;
  return (
    <section style={css("padding:var(--space-6) var(--space-6);")}>
      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>PARTNERS &amp; SERVICES</div>
      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-4);")}>
        {apps.map((a) => (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            style={css(
              "display:flex;align-items:center;gap:var(--space-3);border:2px solid var(--color-divider);border-radius:var(--radius-md);padding:var(--space-4);background:var(--color-surface);box-shadow:var(--shadow-sm);text-decoration:none;color:var(--color-text);"
            )}
          >
            {a.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.imageUrl} alt="" style={css("width:48px;height:48px;object-fit:contain;flex:none;")} />
            ) : (
              <div
                style={css(
                  "width:48px;height:48px;border-radius:var(--radius-sm);background:var(--om-teal-light);display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-size:18px;flex:none;"
                )}
                aria-hidden="true"
              >
                {a.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={css("min-width:0;")}>
              <div style={css("font-family:var(--font-heading);font-size:16px;overflow-wrap:anywhere;")}>{a.title}</div>
              {a.description && <p style={css("font-size:12px;opacity:0.65;margin:2px 0 0;")}>{a.description}</p>}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
