import { sanitizeRichHtml } from "@/lib/rich-text";

/**
 * Renders stored rich text safely. The HTML is sanitised again here (not only
 * at save time) so content written before sanitising existed, or edited
 * directly in the database, can never inject script into a public page.
 * Plain-text records from before the rich editor are shown as paragraphs.
 */
export default function RichText({ html, className = "", style }: { html: string | null | undefined; className?: string; style?: React.CSSProperties }) {
  const clean = sanitizeRichHtml(html);
  if (!clean) return null;
  return <div className={`rte-body ${className}`.trim()} style={style} dangerouslySetInnerHTML={{ __html: clean }} />;
}
