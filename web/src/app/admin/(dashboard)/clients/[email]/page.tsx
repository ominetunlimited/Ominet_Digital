import Link from "next/link";
import { notFound } from "next/navigation";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import { loadProjectRows, totalsByCurrency, STAGE_LABEL } from "@/lib/admin/projects-data";
import { DOC_LABEL, type DocKind } from "@/lib/documents";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Client — Admin", robots: { index: false, follow: false } };

export default async function ClientPage({ params }: { params: Promise<{ email: string }> }) {
  const email = decodeURIComponent((await params).email).toLowerCase();
  const { rows, phones } = await loadProjectRows();
  const mine = rows.filter((r) => r.email === email);
  if (!mine.length) notFound();
  const supabase = await createClient();
  const ids = mine.map((r) => r.id);
  const [{ data: docs }, { data: pays }, { data: mails }] = await Promise.all([
    supabase!.from("documents").select("id,number,kind,status,created_at").in("booking_id", ids).order("created_at", { ascending: false }),
    supabase!.from("booking_payments").select("id,amount_cents,currency,kind,paid_on,status").in("booking_id", ids).order("paid_on", { ascending: false }),
    supabase!.from("email_log").select("id,kind,subject,status,delivery_status,created_at").in("booking_id", ids).order("created_at", { ascending: false }).limit(15),
  ]);
  const h = css("font-size:11px;opacity:0.5;letter-spacing:0.08em;margin:var(--space-4) 0 var(--space-2);");
  return (
    <div style={css("max-width:900px;")}>
      <p style={css("margin:0 0 var(--space-2);font-size:13px;")}><Link href="/admin/clients">&larr; All clients</Link></p>
      <h1 style={css("margin:0;")}>{mine[0].client}</h1>
      <p style={css("opacity:0.7;margin:4px 0 0;")}>{email}{phones.get(email) ? ` · ${phones.get(email)}` : ""}</p>
      <p style={css("margin:var(--space-3) 0 0;font-size:14px;")}>Agreed: {totalsByCurrency(mine, (r) => r.agreedCents)} · Received: {totalsByCurrency(mine, (r) => r.paidCents)}</p>

      <div style={h}>ENQUIRIES AND PROJECTS</div>
      {mine.map((r) => (
        <div key={r.id} style={css("padding:6px 0;border-top:1px solid var(--color-divider);font-size:13px;")}>
          <Link href={`/admin/bookings?status=all&q=${encodeURIComponent(email)}`}>{r.title}</Link> · {STAGE_LABEL[r.stage]} · {r.bookingRef ?? r.enquiryRef}
          {r.currency ? ` · ${formatMoney(r.agreedCents, r.currency)} agreed, ${formatMoney(r.paidCents, r.currency)} received` : ""}
        </div>
      ))}

      <div style={h}>DOCUMENTS</div>
      {(docs ?? []).length === 0 ? <p style={css("font-size:13px;opacity:0.6;")}>None yet.</p> : (docs ?? []).map((d) => (
        <div key={d.id} style={css("font-size:13px;padding:3px 0;")}><Link href={`/admin/documents/${d.id}`}>{d.number}</Link> · {DOC_LABEL[d.kind as DocKind]} · {d.status}</div>
      ))}

      <div style={h}>PAYMENTS</div>
      {(pays ?? []).length === 0 ? <p style={css("font-size:13px;opacity:0.6;")}>None recorded.</p> : (pays ?? []).map((p) => (
        <div key={p.id} style={css("font-size:13px;padding:3px 0;" + (p.status === "voided" ? "opacity:0.5;text-decoration:line-through;" : ""))}>{p.paid_on} · {formatMoney(Number(p.amount_cents), p.currency)} · {p.kind}</div>
      ))}

      <div style={h}>RECENT EMAILS</div>
      {(mails ?? []).length === 0 ? <p style={css("font-size:13px;opacity:0.6;")}>None logged.</p> : (mails ?? []).map((m) => (
        <div key={m.id} style={css("font-size:13px;padding:3px 0;")}>{new Date(m.created_at).toLocaleDateString()} · {m.subject} · {m.delivery_status ?? m.status}</div>
      ))}
    </div>
  );
}
