import { requireStaff } from "@/lib/auth/guard";
import { renderDocumentPdf } from "@/lib/document-pdf";
import type { DocData } from "@/lib/documents";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (!auth.ok) return new Response("Not allowed", { status: 401, headers: { "Cache-Control": "no-store" } });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const { data: d } = await auth.supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (!d) return new Response("Not found", { status: 404 });
  const bytes = await renderDocumentPdf({
    title: d.title, number: d.number, status: d.status, issuedAt: d.issued_at, createdAt: d.created_at,
    introHtml: d.intro_html, bodyHtml: d.body_html, footerHtml: d.footer_html, data: d.data as DocData,
  });
  return new Response(bytes as BodyInit, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${d.number}.pdf"`, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
