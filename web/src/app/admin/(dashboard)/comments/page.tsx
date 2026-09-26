import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import CommentModerationRow, { type ModerationRow } from "@/components/admin/CommentModerationRow";
import type { CommentStatus } from "@/lib/admin/comment-actions";

export const metadata = { title: "Comments — Admin", robots: { index: false, follow: false } };

const TABS: { key: CommentStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "hidden", label: "Hidden" },
  { key: "all", label: "All" },
];

type Row = {
  id: string;
  body: string;
  created_at: string;
  status: CommentStatus;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
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

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status as CommentStatus | "all") || "pending";
  const q = params.q?.trim() ?? "";

  const supabase = await createClient();
  let query = supabase
    ?.from("comments")
    .select("id,body,created_at,status,profiles(display_name),content(slug,title),books(slug,title)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status !== "all") query = query?.eq("status", status);
  if (q) query = query?.ilike("body", `%${q}%`);

  const { data } = query ? await query : { data: [] };
  const rows = (data ?? []) as unknown as Row[];

  const moderationRows: ModerationRow[] = rows.map((r) => {
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
      body: r.body,
      createdAt: r.created_at,
      status: r.status,
      authorName: displayName(profile?.display_name),
      targetLabel: target.label,
      targetHref: target.href,
    };
  });

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Comments</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-4);")}>
        Every comment is held as <strong>Pending</strong> until approved — nobody but its own author can see it before then.
      </p>

      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-4);")}>
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/comments?status=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={t.key === status ? "btn btn-primary" : "btn btn-secondary"}
            style={css("font-size:12px;padding:6px 10px;")}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <form action="/admin/comments" method="get" style={css("display:flex;gap:var(--space-2);margin-bottom:var(--space-4);max-width:360px;")}>
        <input type="hidden" name="status" value={status} />
        <input className="input" name="q" defaultValue={q} placeholder="Search comment text…" />
        <button type="submit" className="btn btn-secondary">Search</button>
      </form>

      {moderationRows.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>No comments in this view.</p>
      ) : (
        <table className="table" style={css("width:100%;")}>
          <thead>
            <tr>
              <th>Comment</th>
              <th>On</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {moderationRows.map((row) => (
              <CommentModerationRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
