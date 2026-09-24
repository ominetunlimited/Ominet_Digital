import { css } from "@/lib/css";

export const metadata = { title: "Admin — Ominet Digital" };

const navItems = [
  "Overview", "Content", "Books", "Media", "Work", "Store", "Social",
  "Newsletter", "Advertising", "Analytics", "Media Library", "Users", "Settings",
];

const stats = [
  { label: "DRAFTS", value: "4" },
  { label: "SCHEDULED", value: "2" },
  { label: "PUBLISHED", value: "86" },
  { label: "VIEWS (30D)", value: "12.4K" },
  { label: "OUTBOUND CLICKS", value: "318" },
  { label: "SUBSCRIBERS", value: "2,051" },
];

const rows = [
  { title: "On Writing as a Second Country", type: "Essay", access: "Free", accessVariant: "outline", status: "Published", views: "4,210" },
  { title: "Coastal Erosion and the Politics of Retreat", type: "Research", access: "Paid", accessVariant: "accent", status: "Published", views: "1,904" },
  { title: "A Small Country of Rain", type: "Book", access: "—", accessVariant: "outline", status: "Draft", views: "—" },
  { title: "Notes from the Archive", type: "Note", access: "Free", accessVariant: "outline", status: "Scheduled", views: "—" },
];

export default function AdminPage() {
  return (
    <div style={css("display:flex;min-height:600px;background:var(--color-bg);")}>
      <aside style={css("width:220px;flex-shrink:0;border-right:2px solid var(--color-divider);padding:var(--space-6) var(--space-4);")}>
        <div style={css("font-weight:700;letter-spacing:0.02em;margin-bottom:var(--space-6);")}>OMINI NFAWA</div>
        <div style={css("display:grid;gap:var(--space-1);font-size:14px;")}>
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              style={item === "Overview" ? css("padding:var(--space-2) var(--space-2);background:var(--color-surface);font-weight:700;") : css("padding:var(--space-2) var(--space-2);")}
            >
              {item}
            </a>
          ))}
        </div>
      </aside>

      <main style={css("flex:1;min-width:0;padding:var(--space-6) var(--space-8);position:relative;overflow:hidden;")}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={css("position:absolute;right:-30px;top:-10px;pointer-events:none;")} aria-hidden="true">
          <circle cx="80" cy="80" r="79" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.1" />
        </svg>
        <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);flex-wrap:wrap;gap:var(--space-3);")}>
          <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0;")}>Overview</h1>
          <button type="button" className="btn btn-primary">New article</button>
        </div>

        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--space-4);margin-bottom:var(--space-8);")}>
          {stats.map((s) => (
            <div className="card" key={s.label}>
              <div className="card-kicker">{s.label}</div>
              <div style={css("font-family:var(--font-heading);font-size:32px;")}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>RECENT CONTENT</div>
        <table className="table" style={css("width:100%;margin-bottom:var(--space-8);")}>
          <thead><tr><th>Title</th><th>Type</th><th>Access</th><th>Status</th><th>Views</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.title}>
                <td>{r.title}</td>
                <td>{r.type}</td>
                <td><span className={`tag tag-${r.accessVariant}`}>{r.access}</span></td>
                <td>{r.status}</td>
                <td>{r.views}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>CONTENT EDITOR &mdash; PUBLISH SETTINGS</div>
        <div className="card" style={css("max-width:520px;")}>
          <div className="field" style={css("margin-bottom:var(--space-4);")}>
            <label>Access</label>
            <div className="seg">
              <span className="seg-opt">Free</span><span className="seg-opt">Paid</span><span className="seg-opt">Members</span><span className="seg-opt">Preview</span>
            </div>
          </div>
          <div className="field" style={css("margin-bottom:var(--space-4);")}><label>Category</label><input className="input" defaultValue="Essay" /></div>
          <div className="field" style={css("margin-bottom:var(--space-4);")}><label>Publish date</label><input className="input" defaultValue="Sept 30, 2026" /></div>
          <div style={css("display:flex;gap:var(--space-3);")}>
            <button type="button" className="btn btn-secondary">Save draft</button>
            <button type="button" className="btn btn-primary">Publish</button>
          </div>
        </div>
      </main>
    </div>
  );
}
