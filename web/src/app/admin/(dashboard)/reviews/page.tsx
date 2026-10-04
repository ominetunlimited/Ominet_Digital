import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import ReviewModerationRow, { type ReviewModerationRow as Row } from "@/components/admin/ReviewModerationRow";
import type { ReviewStatus } from "@/lib/admin/review-actions";

export const metadata = { title: "Reviews — Admin", robots: { index: false, follow: false } };

const TABS: { key: ReviewStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "hidden", label: "Hidden" },
  { key: "all", label: "All" },
];

type DbRow = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  status: ReviewStatus;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
  guest_name: string | null;
  content: { slug: string; title: string } | { slug: string; title: string }[] | null;
  books: { slug: string; title: string } | { slug: string; title: string }[] | null;
};

function displayName(name: string | null | undefined): string {
  if (!name) return "Reader";
  const at = name.indexOf("@");
  return at > 0 ? name.slice(0, at) : name;
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const status = (params.status as ReviewStatus | "all") || "pending";

  const supabase = await createClient();
  let query = supabase
    ?.from("reviews")
    .select("id,rating,body,created_at,status,guest_name,profiles!reviews_user_id_fkey(display_name),content(slug,title),books(slug,title)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") query = query?.eq("status", status);

  const { data, error: loadError } = query ? await query : { data: [], error: null };
  const rows = (data ?? []) as unknown as DbRow[];

  const moderationRows: Row[] = rows.map((r) => {
    const profile = one(r.profiles);
    const content = one(r.content);
    const book = one(r.books);
    const target = content
      ? { label: `Writing: ${content.title}`, href: `/writing/${content.slug}` }
      : book
        ? { label: `Book: ${book.title}`, href: `/books/${book.slug}` }
        : { label: "(deleted target)", href: null };
    return {
      id: r.id,
      rating: r.rating,
      body: r.body,
      createdAt: r.created_at,
      status: r.status,
      authorName: r.guest_name?.trim() || displayName(profile?.display_name),
      targetLabel: target.label,
      targetHref: target.href,
    };
  });

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Reviews</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-4);")}>
        Star ratings and written reviews on books and articles. Every review is held as <strong>Pending</strong> until approved.
      </p>

      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-4);")}>
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/reviews?status=${t.key}`} className={t.key === status ? "btn btn-primary" : "btn btn-secondary"} style={css("font-size:12px;padding:6px 10px;")}>
            {t.label}
          </Link>
        ))}
      </div>

      {loadError ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>Couldn&apos;t load reviews: {loadError.message}</p>
      ) : moderationRows.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>No reviews in this view.</p>
      ) : (
        <table className="table table-responsive" style={css("width:100%;")}>
          <thead>
            <tr>
              <th>Review</th>
              <th>On</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {moderationRows.map((row) => (
              <ReviewModerationRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
