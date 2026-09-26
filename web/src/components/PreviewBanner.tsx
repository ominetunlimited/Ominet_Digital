import Link from "next/link";

/**
 * Shown on a public page only when the item isn't published. That can only
 * happen for signed-in staff — the database hides unpublished items from
 * everyone else — so this never appears to visitors.
 */
export default function PreviewBanner({ status, editHref }: { status?: string; editHref?: string }) {
  if (!status || status === "published") return null;
  return (
    <div
      role="status"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "#b3261e",
        color: "#fff",
        padding: "10px var(--space-6)",
        fontSize: 13,
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <strong style={{ letterSpacing: "0.08em" }}>PREVIEW</strong>
      <span>This is {status === "draft" ? "a draft" : `“${status}”`} — visitors can&apos;t see it. Only signed-in staff can.</span>
      {editHref && <Link href={editHref} style={{ color: "#fff", textDecoration: "underline" }}>Back to editor</Link>}
    </div>
  );
}
