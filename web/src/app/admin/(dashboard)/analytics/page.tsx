import Link from "next/link";
import { css } from "@/lib/css";
import { resolveRange, getAnalyticsSummary, RANGE_OPTIONS, type RangeKey } from "@/lib/admin/analytics";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Analytics — Admin", robots: { index: false, follow: false } };

const fmtMoney = formatMoney;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card" style={css("padding:var(--space-4);")}>
      <div style={css("font-size:11px;letter-spacing:0.08em;opacity:0.55;margin-bottom:var(--space-2);")}>{label.toUpperCase()}</div>
      <div style={css("font-family:var(--font-heading);font-size:28px;")}>{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={css("padding:var(--space-4);")}>
      <div style={css("font-size:11px;letter-spacing:0.08em;opacity:0.55;margin-bottom:var(--space-3);")}>{title.toUpperCase()}</div>
      {children}
    </div>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div style={css("margin-bottom:var(--space-2);")}>
      <div style={css("display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px;")}>
        <span style={css("overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:70%;")}>{label}</span>
        <span style={css("opacity:0.6;")}>{count}</span>
      </div>
      <div style={css("height:6px;border-radius:3px;background:var(--color-divider);overflow:hidden;")}>
        <div style={css(`height:100%;width:${pct}%;background:var(--om-coral);`)} />
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const rangeKey = (params.range as RangeKey) || "30d";
  const { since, until, label } = resolveRange(rangeKey, params.from, params.to);
  const summary = await getAnalyticsSummary(since, until);

  const maxPage = Math.max(1, ...summary.siteActivity.topPages.map((p) => p.views));
  const maxSection = Math.max(1, ...summary.contentViews.map((s) => s.views));
  const maxReferrer = Math.max(1, ...summary.referrers.map((r) => r.count));
  const maxTerm = Math.max(1, ...summary.search.topTerms.map((t) => t.count));
  const maxDownload = Math.max(1, ...summary.downloads.topFiles.map((d) => d.count));

  return (
    <div>
      <div style={css("display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-3);margin-bottom:var(--space-2);")}>
        <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0;")}>Analytics</h1>
        <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
          {RANGE_OPTIONS.map((r) => (
            <Link
              key={r.key}
              href={`/admin/analytics?range=${r.key}`}
              className={r.key === rangeKey ? "btn btn-primary" : "btn btn-secondary"}
              style={css("font-size:12px;padding:6px 10px;")}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-6);")}>
        {label} &middot; {new Date(since).toLocaleDateString()} – {new Date(until).toLocaleDateString()} &middot; based on {summary.eventRowsSampled.toLocaleString()} logged events. First-party [...]
      </p>

      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--space-4);margin-bottom:var(--space-6);")}>
        <Stat label="Page views" value={summary.siteActivity.pageViews.toLocaleString()} />
        <Stat label="Unique visitors" value={summary.siteActivity.uniqueVisitors.toLocaleString()} />
        <Stat label="Downloads" value={summary.downloads.totalDownloads.toLocaleString()} />
        <Stat label="Likes" value={summary.engagement.likes.toLocaleString()} />
        <Stat label="Comments" value={summary.engagement.comments.toLocaleString()} />
        <Stat label="Shares" value={summary.engagement.shares.toLocaleString()} />
        <Stat label="Newsletter signups" value={summary.signups.toLocaleString()} />
      </div>

      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-4);margin-bottom:var(--space-4);")}>
        <Panel title="Top pages">
          {summary.siteActivity.topPages.length === 0 ? (
            <p style={css("font-size:13px;opacity:0.5;")}>No page views logged in this range.</p>
          ) : (
            summary.siteActivity.topPages.map((p) => <BarRow key={p.path} label={p.path} count={p.views} max={maxPage} />)
          )}
        </Panel>

        <Panel title="Views by section">
          {summary.contentViews.length === 0 ? (
            <p style={css("font-size:13px;opacity:0.5;")}>No data yet.</p>
          ) : (
            summary.contentViews.map((s) => <BarRow key={s.section} label={s.section} count={s.views} max={maxSection} />)
          )}
        </Panel>

        <Panel title="Referrers">
          {summary.referrers.length === 0 ? (
            <p style={css("font-size:13px;opacity:0.5;")}>No external referrers captured — mostly direct traffic, or none yet.</p>
          ) : (
            summary.referrers.map((r) => <BarRow key={r.host} label={r.host} count={r.count} max={maxReferrer} />)
          )}
        </Panel>

        <Panel title="Search">
          <div style={css("font-size:13px;margin-bottom:var(--space-3);")}>
            {summary.search.totalSearches} searches &middot; {summary.search.zeroResultCount} returned nothing
          </div>
          {summary.search.topTerms.length === 0 ? (
            <p style={css("font-size:13px;opacity:0.5;")}>No searches logged in this range.</p>
          ) : (
            summary.search.topTerms.map((t) => <BarRow key={t.term} label={t.term} count={t.count} max={maxTerm} />)
          )}
        </Panel>

        <Panel title="Top downloads">
          {summary.downloads.topFiles.length === 0 ? (
            <p style={css("font-size:13px;opacity:0.5;")}>No file downloads logged in this range.</p>
          ) : (
            summary.downloads.topFiles.map((d) => <BarRow key={d.fileName} label={d.fileName} count={d.count} max={maxDownload} />)
          )}
        </Panel>

        <Panel title="Purchase-link clicks">
          {summary.purchaseLinkClicks.length === 0 ? (
            <p style={css("font-size:13px;opacity:0.5;")}>No Selar/Amazon/Google Books/affiliate clicks logged yet.</p>
          ) : (
            <table className="table" style={css("width:100%;")}>
              <thead><tr><th>Platform</th><th>Clicks</th></tr></thead>
              <tbody>
                {summary.purchaseLinkClicks.map((p) => (
                  <tr key={p.platform}><td style={css("text-transform:capitalize;")}>{p.platform}</td><td>{p.clicks}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Shares by platform">
          {summary.engagement.sharesByPlatform.length === 0 ? (
            <p style={css("font-size:13px;opacity:0.5;")}>No shares logged in this range.</p>
          ) : (
            <table className="table" style={css("width:100%;")}>
              <thead><tr><th>Platform</th><th>Shares</th></tr></thead>
              <tbody>
                {summary.engagement.sharesByPlatform.map((s) => (
                  <tr key={s.platform}><td style={css("text-transform:capitalize;")}>{s.platform.replace("_", " ")}</td><td>{s.count}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Commerce (Paystack orders)">
          <div style={css("font-size:13px;margin-bottom:var(--space-3);")}>
            {summary.commerce.orderCount} orders &middot; revenue {fmtMoney(summary.commerce.revenueCents, summary.commerce.currency)}
            {" "}&middot; avg order {fmtMoney(summary.commerce.averageOrderValueCents, summary.commerce.currency)}
          </div>
          {Object.keys(summary.commerce.statusCounts).length === 0 ? (
            <p style={css("font-size:13px;opacity:0.5;")}>No orders in this range.</p>
          ) : (
            <table className="table" style={css("width:100%;")}>
              <thead><tr><th>Status</th><th>Count</th></tr></thead>
              <tbody>
                {Object.entries(summary.commerce.statusCounts).map(([status, count]) => (
                  <tr key={status}><td style={css("text-transform:capitalize;")}>{status}</td><td>{count}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <Panel title="Not connected">
        <ul style={css("font-size:13px;opacity:0.7;margin:0;padding-left:18px;")}>
          {summary.notConnected.map((label) => <li key={label}>{label}</li>)}
        </ul>
      </Panel>
    </div>
  );
}
