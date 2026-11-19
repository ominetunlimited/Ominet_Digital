import Link from "next/link";
import { notFound } from "next/navigation";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import DocumentEditor from "@/components/admin/DocumentEditor";
import { DOC_LABEL, type DocData, type DocKind } from "@/lib/documents";

export const metadata = { title: "Document — Admin", robots: { index: false, follow: false } };

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: d } = (await supabase?.from("documents").select("*").eq("id", id).maybeSingle()) ?? { data: null };
  if (!d) notFound();
  const { data: b } = (await supabase?.from("bookings").select("name,email").eq("id", d.booking_id).maybeSingle()) ?? { data: null };
  return (
    <div>
      <p style={css("margin:0 0 var(--space-2);font-size:13px;")}><Link href="/admin/documents">&larr; All documents</Link></p>
      <h1 style={css("margin:0 0 var(--space-4);")}>{DOC_LABEL[d.kind as DocKind]}{b?.name ? `: ${b.name}` : ""}</h1>
      <DocumentEditor id={d.id} number={d.number} kindLabel={DOC_LABEL[d.kind as DocKind]} status={d.status} title={d.title} introHtml={d.intro_html} bodyHtml={d.body_html} footerHtml={d.footer_html} data={d.data as DocData} clientEmail={b?.email ?? ""} />
    </div>
  );
}
