import { createClient } from "@/lib/supabase/server";

// Real aggregation over the analytics_events table (+ orders/payments/
// likes/comments, which are already the source of truth for those counts
// and don't need a duplicate event). Nothing here is fabricated: a metric
// with no underlying data source renders as "Not connected" / "No data
// available" rather than a manufactured number — see notConnected below.

export type RangeKey = "today" | "7d" | "30d" | "month" | "prevmonth" | "quarter" | "year" | "prevyear" | "custom";

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "prevmonth", label: "Previous month" },
  { key: "quarter", label: "This quarter" },
  { key: "year", label: "This year" },
  { key: "prevyear", label: "Previous year" },
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function resolveRange(key: RangeKey, fromParam?: string, toParam?: string): { since: Date; until: Date; label: string } {
  const now = new Date();
  const today0 = startOfDay(now);

  if (key === "custom" && fromParam && toParam) {
    const since = startOfDay(new Date(fromParam));
    const until = new Date(toParam);
    until.setHours(23, 59, 59, 999);
    return { since, until, label: `${fromParam} → ${toParam}` };
  }

  switch (key) {
    case "today":
      return { since: today0, until: now, label: "Today" };
    case "7d": {
      const since = new Date(today0);
      since.setDate(since.getDate() - 6);
      return { since, until: now, label: "Last 7 days" };
    }
    case "month": {
      const since = new Date(now.getFullYear(), now.getMonth(), 1);
      return { since, until: now, label: "This month" };
    }
    case "prevmonth": {
      const since = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const until = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { since, until, label: "Previous month" };
    }
    case "quarter": {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const since = new Date(now.getFullYear(), qStartMonth, 1);
      return { since, until: now, label: "This quarter" };
    }
    case "year": {
      const since = new Date(now.getFullYear(), 0, 1);
      return { since, until: now, label: "This year" };
    }
    case "prevyear": {
      const since = new Date(now.getFullYear() - 1, 0, 1);
      const until = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { since, until, label: "Previous year" };
    }
    case "30d":
    default: {
      const since = new Date(today0);
      since.setDate(since.getDate() - 29);
      return { since, until: now, label: "Last 30 days" };
    }
  }
}

type EventRow = {
  event_type: string;
  path: string | null;
  content_id: string | null;
  product_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const EVENT_ROW_LIMIT = 10000;
const SECTION_PREFIXES = ["/writing", "/books", "/media", "/store", "/profile", "/cortexa-office", "/omini-nfawa", "/ominet-digital"];

function sectionFor(path: string | null): string | null {
  if (!path) return null;
  if (path === "/") return "Home";
  const match = SECTION_PREFIXES.find((p) => path === p || path.startsWith(p + "/"));
  return match ? match.replace("/", "") : null;
}

function hostFromReferrer(referrer: unknown): string | null {
  if (typeof referrer !== "string" || !referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function topN<T extends string>(counts: Map<T, number>, n: number): { key: T; count: number }[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

export type AnalyticsSummary = {
  range: { since: string; until: string; label: string };
  siteActivity: { pageViews: number; uniqueVisitors: number; topPages: { path: string; views: number }[] };
  referrers: { host: string; count: number }[];
  contentViews: { section: string; views: number }[];
  engagement: { likes: number; comments: number; shares: number; sharesByPlatform: { platform: string; count: number }[] };
  purchases: { orderCount: number; downloads: number };
  purchaseLinkClicks: { platform: string; clicks: number }[];
  commerce: { statusCounts: Record<string, number>; revenueCents: number; orderCount: number; averageOrderValueCents: number; currency: string };
  search: { topTerms: { term: string; count: number }[]; zeroResultCount: number; totalSearches: number };
  signups: number;
  eventRowsSampled: number;
  notConnected: string[];
};

export async function getAnalyticsSummary(since: Date, until: Date): Promise<AnalyticsSummary> {
  const supabase = await createClient();
  const empty: AnalyticsSummary = {
    range: { since: since.toISOString(), until: until.toISOString(), label: "" },
    siteActivity: { pageViews: 0, uniqueVisitors: 0, topPages: [] },
    referrers: [],
    contentViews: [],
    engagement: { likes: 0, comments: 0, shares: 0, sharesByPlatform: [] },
    purchases: { orderCount: 0, downloads: 0 },
    purchaseLinkClicks: [],
    commerce: { statusCounts: {}, revenueCents: 0, orderCount: 0, averageOrderValueCents: 0, currency: "NGN" },
    search: { topTerms: [], zeroResultCount: 0, totalSearches: 0 },
    signups: 0,
    eventRowsSampled: 0,
    notConnected: ["Google Search Console", "Telegram", "Advertising impressions/CTR", "Core Web Vitals / technical errors"],
  };
  if (!supabase) return empty;

  const sinceIso = since.toISOString();
  const untilIso = until.toISOString();

  const [eventsRes, likesRes, commentsRes, ordersRes] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("event_type,path,content_id,product_id,metadata,created_at")
      .gte("created_at", sinceIso)
      .lte("created_at", untilIso)
      .order("created_at", { ascending: false })
      .limit(EVENT_ROW_LIMIT),
    supabase.from("likes").select("id", { count: "exact", head: true }).gte("created_at", sinceIso).lte("created_at", untilIso),
    supabase.from("comments").select("id", { count: "exact", head: true }).gte("created_at", sinceIso).lte("created_at", untilIso),
    supabase.from("orders").select("status,amount_cents,currency").gte("created_at", sinceIso).lte("created_at", untilIso),
  ]);

  const events = ((eventsRes.data ?? []) as EventRow[]).filter((e) => !e.path || !e.path.startsWith("/admin"));

  const pageViews = events.filter((e) => e.event_type === "page_view");
  const visitorKeys = new Set(events.map((e) => e.metadata?.visitor_key).filter(Boolean));
  const pathCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();
  const sectionCounts = new Map<string, number>();
  for (const e of pageViews) {
    if (e.path) pathCounts.set(e.path, (pathCounts.get(e.path) ?? 0) + 1);
    const host = hostFromReferrer(e.metadata?.referrer);
    if (host) referrerCounts.set(host, (referrerCounts.get(host) ?? 0) + 1);
    const section = sectionFor(e.path);
    if (section) sectionCounts.set(section, (sectionCounts.get(section) ?? 0) + 1);
  }

  const shares = events.filter((e) => e.event_type === "share");
  const sharePlatformCounts = new Map<string, number>();
  for (const e of shares) {
    const platform = typeof e.metadata?.platform === "string" ? e.metadata.platform : "unknown";
    sharePlatformCounts.set(platform, (sharePlatformCounts.get(platform) ?? 0) + 1);
  }

  const outboundClicks = events.filter((e) => e.event_type === "outbound_click");
  const purchaseLinkCounts = new Map<string, number>();
  for (const e of outboundClicks) {
    if (e.metadata?.kind !== "purchase_link") continue;
    const platform = typeof e.metadata?.platform === "string" ? e.metadata.platform : "unknown";
    purchaseLinkCounts.set(platform, (purchaseLinkCounts.get(platform) ?? 0) + 1);
  }

  const downloads = events.filter((e) => e.event_type === "download");
  const downloadCount = downloads.length;

  const searchEvents = events.filter((e) => e.event_type === "search");
  const termCounts = new Map<string, number>();
  let zeroResultCount = 0;
  for (const e of searchEvents) {
    const term = typeof e.metadata?.term === "string" ? e.metadata.term : null;
    if (term) termCounts.set(term, (termCounts.get(term) ?? 0) + 1);
    if (e.metadata?.result_count === 0) zeroResultCount += 1;
  }

  const signups = events.filter((e) => e.event_type === "signup").length;

  const orders = ordersRes.data ?? [];
  const statusCounts: Record<string, number> = {};
  let revenueCents = 0;
  let currency = "NGN";
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
    if (o.status === "paid") {
      revenueCents += o.amount_cents ?? 0;
      currency = o.currency || currency;
    }
  }
  const paidCount = statusCounts["paid"] ?? 0;

  return {
    range: { since: sinceIso, until: untilIso, label: "" },
    siteActivity: {
      pageViews: pageViews.length,
      uniqueVisitors: visitorKeys.size,
      topPages: topN(pathCounts, 10).map((r) => ({ path: r.key, views: r.count })),
    },
    referrers: topN(referrerCounts, 10).map((r) => ({ host: r.key, count: r.count })),
    contentViews: topN(sectionCounts, 10).map((r) => ({ section: r.key, views: r.count })),
    engagement: {
      likes: likesRes.count ?? 0,
      comments: commentsRes.count ?? 0,
      shares: shares.length,
      sharesByPlatform: topN(sharePlatformCounts, 10).map((r) => ({ platform: r.key, count: r.count })),
    },
    purchases: {
      orderCount: orders.length,
      downloads: downloadCount,
    },
    purchaseLinkClicks: topN(purchaseLinkCounts, 10).map((r) => ({ platform: r.key, clicks: r.count })),
    commerce: {
      statusCounts,
      revenueCents,
      orderCount: orders.length,
      averageOrderValueCents: paidCount > 0 ? Math.round(revenueCents / paidCount) : 0,
      currency,
    },
    search: {
      topTerms: topN(termCounts, 10).map((r) => ({ term: r.key, count: r.count })),
      zeroResultCount,
      totalSearches: searchEvents.length,
    },
    signups,
    eventRowsSampled: events.length,
    notConnected: empty.notConnected,
  };
}
