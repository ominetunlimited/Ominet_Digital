import { css } from "@/lib/css";

export default function EmptyState({
  title = "Nothing published here yet.",
  body = "New content appears here as soon as it's live.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section style={css("padding:var(--space-8) var(--space-6);text-align:center;")}>
      <div style={css("font-family:var(--font-heading);font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>EMPTY</div>
      <div style={css("font-family:var(--font-heading);font-size:22px;margin:0 0 var(--space-3);")}>{title}</div>
      <p style={css("font-size:14px;opacity:0.6;margin:0;")}>{body}</p>
    </section>
  );
}
