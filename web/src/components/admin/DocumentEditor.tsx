"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { css } from "@/lib/css";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import { saveDocument, refreshDocumentFigures, issueDocument, voidDocument, emailDocument } from "@/lib/admin/document-actions";
import type { DocData } from "@/lib/documents";

type Props = { id: string; number: string; kindLabel: string; status: "draft" | "issued" | "void"; title: string; introHtml: string; bodyHtml: string; footerHtml: string; data: DocData; clientEmail: string };

export default function DocumentEditor(p: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(p.title);
  const [intro, setIntro] = useState(p.introHtml);
  const [body, setBody] = useState(p.bodyHtml);
  const [footer, setFooter] = useState(p.footerHtml);
  const [flash, setFlash] = useState<string | null>(null);
  const act = useAdminAction();
  const draft = p.status === "draft";

  async function go(fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, after?: () => void) {
    setFlash(null);
    const r = await act.run(fn as never);
    if (r && (r as { ok: boolean }).ok) { setFlash((r as { message?: string }).message ?? "Done."); router.refresh(); after?.(); }
  }
  const lab = css("display:block;font-size:12px;font-weight:600;margin-bottom:4px;");

  return (
    <div style={css("display:grid;gap:var(--space-4);max-width:860px;")}>
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center;")}>
        <strong>{p.number}</strong>
        <span style={css("text-transform:uppercase;font-size:11px;letter-spacing:0.06em;")}>{p.status}</span>
        <a className="btn btn-secondary" href={`/api/admin/documents/${p.id}/pdf`} target="_blank" rel="noopener noreferrer">Preview / download PDF</a>
      </div>

      {!draft && <p role="note" style={css("margin:0;font-size:13px;opacity:0.75;")}>{p.status === "issued" ? "This document is issued and locked. To change it, void it and create a new one from the booking." : "This document is void. It is kept for the record."}</p>}

      <div><label style={lab} htmlFor="d-title">Title</label><input id="d-title" className="input" disabled={!draft} value={title} onChange={(e) => setTitle(e.target.value)} /></div>

      <div style={css("border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:var(--space-3);font-size:13px;")}>
        <div style={css("font-size:11px;opacity:0.5;letter-spacing:0.08em;margin-bottom:6px;")}>FIGURES (from the quotation and recorded payments)</div>
        {p.data.rows.map(([k, v]) => <div key={k}><span style={css("opacity:0.6;")}>{k}:</span> {v}</div>)}
        {p.data.totals.map(([k, v, s]) => <div key={k} style={css(s ? "font-weight:700;" : "")}>{k}: {v}</div>)}
        {p.data.rows.length + p.data.totals.length === 0 && <div style={css("opacity:0.6;")}>No figures for this document.</div>}
        {draft && <button type="button" className="btn btn-ghost" style={css("margin-top:8px;font-size:12px;")} disabled={act.busy} onClick={() => go(() => refreshDocumentFigures(p.id))}>Refresh figures</button>}
      </div>

      <div><span style={lab}>Opening text</span>{draft ? <RichTextEditor value={intro} onChange={setIntro} minHeight={110} /> : <div className="rich" dangerouslySetInnerHTML={{ __html: p.introHtml }} />}</div>
      <div><span style={lab}>Main text</span>{draft ? <RichTextEditor value={body} onChange={setBody} minHeight={240} /> : <div className="rich" dangerouslySetInnerHTML={{ __html: p.bodyHtml }} />}</div>
      <div><span style={lab}>Closing text</span>{draft ? <RichTextEditor value={footer} onChange={setFooter} minHeight={90} /> : <div className="rich" dangerouslySetInnerHTML={{ __html: p.footerHtml }} />}</div>

      {act.error && <div role="alert" style={css("font-size:13px;color:var(--om-coral);")}>{act.error}</div>}
      {flash && !act.error && <div role="status" style={css("font-size:13px;color:var(--om-azure);")}>{flash}</div>}

      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
        {draft && <>
          <button type="button" className="btn btn-secondary" disabled={act.busy} onClick={() => go(() => saveDocument(p.id, { title, introHtml: intro, bodyHtml: body, footerHtml: footer }))}>{act.busy ? "Working…" : "Save draft"}</button>
          <button type="button" className="btn btn-primary" disabled={act.busy} onClick={() => { if (!window.confirm("Issue this document? It will be locked and can no longer be edited.")) return; go(async () => { const s = await saveDocument(p.id, { title, introHtml: intro, bodyHtml: body, footerHtml: footer }); if (!s.ok) return s; return issueDocument(p.id); }); }}>Save and issue</button>
        </>}
        {p.status === "issued" && <button type="button" className="btn btn-primary" disabled={act.busy} onClick={() => { if (!window.confirm(`Email this PDF to ${p.clientEmail}?`)) return; go(() => emailDocument(p.id)); }}>Email PDF to client</button>}
        {p.status !== "void" && <button type="button" className="btn btn-ghost" disabled={act.busy} onClick={() => { const why = window.prompt("Why is this document being voided?"); if (why) go(() => voidDocument(p.id, why)); }}>Void</button>}
      </div>
    </div>
  );
}
