"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import { changeStage, saveQuotation, sendQuotation, recordQuotationResponse, confirmBooking, type QuotationInput } from "@/lib/admin/workflow-actions";
import { STAGE_LABEL, TRANSITIONS, CONFIRMABLE, CLIENT_NOTIFY_STAGES, type Stage, type Milestone } from "@/lib/workflow";
import { formatMoney } from "@/lib/money";
import Link from "next/link";
import { recordPayment, voidPayment, createDocument } from "@/lib/admin/document-actions";
import { DOC_LABEL, type DocKind } from "@/lib/documents";

export type QuotationItem = {
  id: string; reference: string; version: number; status: string; scope: string | null; priceCents: number; discountCents: number; currency: string;
  duration: string | null; startDate: string | null; completionDate: string | null; location: string | null; eventDate: string | null;
  deliverables: string | null; milestones: Milestone[]; paymentTerms: string | null; revisionTerms: string | null; conditions: string | null;
  expiryDate: string | null; sentAt: string | null;
};
export type PaymentItem = { id: string; kind: string; amountCents: number; currency: string; method: string | null; reference: string | null; paidOn: string; status: string };
export type DocItem = { id: string; kind: DocKind; number: string; status: string; paymentId: string | null };
export type EventItem = { id: string; kind: string; fromStage: string | null; toStage: string | null; note: string | null; createdAt: string };

const LOCKED: Stage[] = ["booking_confirmed", "in_progress", "awaiting_review", "completed", "cancelled", "archived"];
const label = (t: string) => css("display:block;font-size:12px;font-weight:600;margin-bottom:3px;" + (t ? "" : ""));
const sec = css("font-size:11px;opacity:0.5;letter-spacing:0.08em;margin:0 0 6px;");
const major = (cents: number) => (cents / 100).toFixed(2);

function blank(latest: QuotationItem | undefined, details: Record<string, unknown>): QuotationInput {
  if (latest) {
    return {
      scope: latest.scope ?? "", price: major(latest.priceCents), discount: latest.discountCents ? major(latest.discountCents) : "", currency: latest.currency,
      duration: latest.duration ?? "", startDate: latest.startDate ?? "", completionDate: latest.completionDate ?? "", location: latest.location ?? "",
      eventDate: latest.eventDate ?? "", deliverables: latest.deliverables ?? "", milestones: latest.milestones ?? [], paymentTerms: latest.paymentTerms ?? "",
      revisionTerms: latest.revisionTerms ?? "", conditions: latest.conditions ?? "", expiryDate: latest.expiryDate ?? "",
    };
  }
  // Starting points come from what the client wrote. The price is never pre-filled.
  return {
    scope: "", price: "", discount: "", currency: "NGN", duration: "", startDate: typeof details.startDate === "string" ? details.startDate : "", completionDate: "",
    location: [details.city, details.country].filter(Boolean).join(", "), eventDate: "", deliverables: typeof details.deliverables === "string" ? details.deliverables : "",
    milestones: [], paymentTerms: "", revisionTerms: "", conditions: "", expiryDate: "",
  };
}

export default function WorkflowPanel({ bookingId, stage, bookingRef, details, quotations, events, payments = [], documents = [] }: {
  bookingId: string; stage: Stage; bookingRef: string | null; details: Record<string, unknown>; quotations: QuotationItem[]; events: EventItem[]; payments?: PaymentItem[]; documents?: DocItem[];
}) {
  const latest = quotations[0];
  const locked = LOCKED.includes(stage);
  const [form, setForm] = useState<QuotationInput>(() => blank(latest, details));
  const [next, setNext] = useState<Stage | "">("");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [payment, setPayment] = useState("No payment recorded yet");
  const [flash, setFlash] = useState<string | null>(null);
  const stageAct = useAdminAction();
  const saveAct = useAdminAction();
  const sendAct = useAdminAction();
  const respAct = useAdminAction();
  const confirmAct = useAdminAction();
  const payAct = useAdminAction();
  const docAct = useAdminAction();
  const [pay, setPay] = useState({ kind: "deposit" as "deposit" | "instalment" | "balance" | "full", amount: "", method: "", reference: "", paidOn: new Date().toISOString().slice(0, 10), note: "" });
  const anyBusy = stageAct.busy || saveAct.busy || sendAct.busy || respAct.busy || confirmAct.busy || payAct.busy || docAct.busy;
  const err = stageAct.error || saveAct.error || sendAct.error || respAct.error || confirmAct.error || payAct.error || docAct.error;

  const set = <K extends keyof QuotationInput>(k: K, v: QuotationInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const options = (TRANSITIONS[stage] ?? []).filter((s) => s !== "booking_confirmed" && s !== "quotation_sent");
  const accepted = quotations.find((q) => q.status === "accepted");
  const canConfirm = CONFIRMABLE.includes(stage) && !!accepted;
  const total = (q: QuotationItem) => formatMoney(Math.max(0, q.priceCents - q.discountCents), q.currency);
  const fieldBox = css("display:grid;gap:var(--space-2);");

  async function doStage() {
    if (!next) return;
    const r = await stageAct.run(() => changeStage(bookingId, next, { note, notifyClient: notify && !!CLIENT_NOTIFY_STAGES[next] }));
    if (r?.ok) { setFlash(r.message ?? "Stage updated."); setNext(""); setNote(""); }
  }
  async function doSave() {
    const r = await saveAct.run(() => saveQuotation(bookingId, form));
    if (r?.ok) setFlash(r.message ?? "Saved.");
    return r;
  }
  async function doSend() {
    if (!window.confirm("Send this quotation to the client by email now?")) return;
    const saved = await doSave();
    if (!saved?.ok || !("id" in saved) || !saved.id) return;
    const r = await sendAct.run(() => sendQuotation(saved.id as string));
    if (r?.ok) setFlash(r.message ?? "Sent.");
  }

  return (
    <div style={css("display:grid;gap:var(--space-4);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:var(--space-4);background:var(--color-bg);")} aria-label="Quotation and booking workflow">
      <div>
        <div style={sec}>WORKFLOW STAGE</div>
        <div style={css("font-size:15px;font-weight:700;margin-bottom:var(--space-2);")}>{STAGE_LABEL[stage]}{bookingRef ? <span style={css("font-weight:400;opacity:0.6;")}> · {bookingRef}</span> : null}</div>
        {options.length > 0 && (
          <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;align-items:center;")}>
            <select className="input" aria-label="Move to stage" style={css("width:auto;min-width:220px;")} value={next} onChange={(e) => setNext(e.target.value as Stage)}>
              <option value="">Move to…</option>
              {options.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </select>
            <input className="input" aria-label="Note for the record" style={css("flex:1 1 180px;")} placeholder="Note for the record (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            {next && CLIENT_NOTIFY_STAGES[next] && (
              <label style={css("font-size:12px;display:flex;gap:6px;align-items:center;")}><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Email the client</label>
            )}
            <button type="button" className="btn btn-secondary" disabled={!next || anyBusy} onClick={doStage}>{stageAct.busy ? "Moving…" : "Move"}</button>
          </div>
        )}
        <p style={css("font-size:12px;opacity:0.55;margin:var(--space-2) 0 0;")}>Sending a quotation and confirming a booking are done with their own buttons below, so nothing is marked confirmed by accident.</p>
      </div>

      {quotations.length > 0 && (
        <div>
          <div style={sec}>QUOTATION VERSIONS (earlier versions are kept)</div>
          <div style={css("display:grid;gap:var(--space-2);")}>
            {quotations.map((q) => (
              <div key={q.id} style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center;font-size:13px;padding:8px 10px;border:1px solid var(--color-divider);border-radius:var(--radius-sm);")}>
                <strong>{q.reference} v{q.version}</strong>
                <span style={css("text-transform:uppercase;font-size:11px;letter-spacing:0.06em;")}>{q.status}</span>
                <span>{total(q)}</span>
                {q.sentAt && <span style={css("opacity:0.6;")}>sent {new Date(q.sentAt).toLocaleDateString()}</span>}
                {q.status === "sent" && (
                  <span style={css("display:flex;gap:6px;margin-left:auto;")}>
                    <button type="button" className="btn btn-secondary" style={css("font-size:11px;padding:3px 8px;")} disabled={anyBusy} onClick={async () => { const r = await respAct.run(() => recordQuotationResponse(q.id, "accepted")); if (r?.ok) setFlash(r.message ?? ""); }}>Client accepted</button>
                    <button type="button" className="btn btn-ghost" style={css("font-size:11px;padding:3px 8px;")} disabled={anyBusy} onClick={async () => { const r = await respAct.run(() => recordQuotationResponse(q.id, "declined")); if (r?.ok) setFlash(r.message ?? ""); }}>Client declined</button>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {canConfirm && (
        <div>
          <div style={sec}>CONFIRM BOOKING</div>
          <p style={css("font-size:13px;margin:0 0 var(--space-2);")}>Accepted: {accepted!.reference} v{accepted!.version}, {total(accepted!)}. Confirming records these as the agreed terms and emails the client a booking confirmation.</p>
          <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
            <input className="input" aria-label="Payment status shown to the client" style={css("flex:1 1 240px;")} value={payment} onChange={(e) => setPayment(e.target.value)} placeholder="Payment status, e.g. Deposit received" />
            <button type="button" className="btn btn-primary" disabled={anyBusy} onClick={async () => { if (!window.confirm("Confirm this booking and email the client?")) return; const r = await confirmAct.run(() => confirmBooking(bookingId, payment)); if (r?.ok) setFlash(r.message ?? "Confirmed."); }}>{confirmAct.busy ? "Confirming…" : "Confirm booking"}</button>
          </div>
        </div>
      )}

      {accepted && (
        <div>
          <div style={sec}>PAYMENTS</div>
          {(() => {
            const live = payments.filter((x) => x.status === "recorded");
            const agreed = Math.max(0, accepted.priceCents - accepted.discountCents);
            const received = live.reduce((a, x) => a + x.amountCents, 0);
            const left = agreed - received;
            return (
              <>
                <p style={css("font-size:13px;margin:0 0 var(--space-2);")}>Agreed {formatMoney(agreed, accepted.currency)} · received {formatMoney(received, accepted.currency)} · <strong>outstanding {formatMoney(left, accepted.currency)}</strong></p>
                {payments.map((x) => {
                  const rc = documents.find((d) => d.kind === "receipt" && d.paymentId === x.id && d.status !== "void");
                  return (
                    <div key={x.id} style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center;font-size:12px;padding:6px 0;border-top:1px solid var(--color-divider);" + (x.status === "voided" ? "opacity:0.5;text-decoration:line-through;" : ""))}>
                      <span>{x.paidOn}</span><strong>{formatMoney(x.amountCents, x.currency)}</strong><span>{x.kind}</span><span style={css("opacity:0.7;")}>{[x.method, x.reference].filter(Boolean).join(" · ")}</span>
                      {x.status === "recorded" && (
                        <span style={css("margin-left:auto;display:flex;gap:6px;")}>
                          {rc ? <Link href={`/admin/documents/${rc.id}`}>Receipt {rc.number}</Link> : <button type="button" className="btn btn-secondary" style={css("font-size:11px;padding:3px 8px;")} disabled={anyBusy} onClick={async () => { const r = await docAct.run(() => createDocument(bookingId, "receipt", { paymentId: x.id })); if (r?.ok) setFlash(r.message ?? ""); }}>Create receipt</button>}
                          <button type="button" className="btn btn-ghost" style={css("font-size:11px;padding:3px 8px;")} disabled={anyBusy} onClick={async () => { const why = window.prompt("Why is this payment being voided?"); if (!why) return; const r = await payAct.run(() => voidPayment(x.id, why)); if (r?.ok) setFlash(r.message ?? ""); }}>Void</button>
                        </span>
                      )}
                    </div>
                  );
                })}
                {left > 0 && (
                  <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--space-2);margin-top:var(--space-2);")}>
                    <select className="input" aria-label="Payment type" value={pay.kind} onChange={(e) => setPay({ ...pay, kind: e.target.value as typeof pay.kind })}>
                      <option value="deposit">Deposit</option><option value="instalment">Instalment</option><option value="balance">Balance</option><option value="full">Full payment</option>
                    </select>
                    <input className="input" aria-label="Amount received" inputMode="decimal" placeholder="Amount received" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
                    <input className="input" aria-label="Date received" type="date" value={pay.paidOn} onChange={(e) => setPay({ ...pay, paidOn: e.target.value })} />
                    <input className="input" aria-label="Payment method" placeholder="Method, e.g. Bank transfer" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} />
                    <input className="input" aria-label="Payment reference" placeholder="Reference" value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} />
                    <button type="button" className="btn btn-primary" disabled={anyBusy || !pay.amount} onClick={async () => { const r = await payAct.run(() => recordPayment(bookingId, pay)); if (r?.ok) { setFlash(r.message ?? "Recorded."); setPay({ ...pay, amount: "", reference: "", note: "" }); } }}>{payAct.busy ? "Recording…" : "Record payment"}</button>
                  </div>
                )}
                <p style={css("font-size:12px;opacity:0.55;margin:var(--space-2) 0 0;")}>Only record money that has actually arrived. A draft receipt is created for each recorded payment.</p>
              </>
            );
          })()}
        </div>
      )}

      {(quotations.length > 0 || documents.length > 0) && (
        <div>
          <div style={sec}>DOCUMENTS</div>
          {documents.map((d) => (
            <div key={d.id} style={css("display:flex;gap:var(--space-3);font-size:13px;padding:4px 0;")}>
              <Link href={`/admin/documents/${d.id}`}>{d.number}</Link><span>{DOC_LABEL[d.kind]}</span><span style={css("text-transform:uppercase;font-size:11px;letter-spacing:0.06em;")}>{d.status}</span>
            </div>
          ))}
          <div style={css("display:flex;gap:6px;flex-wrap:wrap;margin-top:var(--space-2);")}>
            {([["quotation", !!latest], ["booking_confirmation", !!accepted], ["agreement", !!accepted], ["invoice", !!accepted], ["completion_note", !!accepted && (stage === "awaiting_review" || stage === "completed")]] as [DocKind, boolean][]).filter(([, ok]) => ok).map(([k]) => (
              <button key={k} type="button" className="btn btn-secondary" style={css("font-size:12px;")} disabled={anyBusy} onClick={async () => { const r = await docAct.run(() => createDocument(bookingId, k, k === "quotation" ? { quotationId: latest?.id } : {})); if (r?.ok) setFlash(r.message ?? "Created."); }}>New {DOC_LABEL[k].toLowerCase()}</button>
            ))}
          </div>
        </div>
      )}

      {!locked && (
        <div>
          <div style={sec}>{latest && latest.status !== "draft" ? `REVISE QUOTATION (saves as version ${latest.version + 1})` : "PREPARE QUOTATION"}</div>
          <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-3);")}>
            <div><label style={label("")} htmlFor="q-price">Professional fee *</label><input id="q-price" className="input" inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="e.g. 150000" /></div>
            <div><label style={label("")} htmlFor="q-cur">Currency</label><input id="q-cur" className="input" maxLength={3} value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} /></div>
            <div><label style={label("")} htmlFor="q-disc">Approved discount</label><input id="q-disc" className="input" inputMode="decimal" value={form.discount} onChange={(e) => set("discount", e.target.value)} /></div>
            <div><label style={label("")} htmlFor="q-dur">Estimated duration *</label><input id="q-dur" className="input" value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 6 weeks" /></div>
            <div><label style={label("")} htmlFor="q-start">Proposed start</label><input id="q-start" className="input" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
            <div><label style={label("")} htmlFor="q-end">Proposed completion</label><input id="q-end" className="input" type="date" value={form.completionDate} onChange={(e) => set("completionDate", e.target.value)} /></div>
            <div><label style={label("")} htmlFor="q-loc">Location</label><input id="q-loc" className="input" value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
            <div><label style={label("")} htmlFor="q-ev">Event date (if any)</label><input id="q-ev" className="input" type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} /></div>
            <div><label style={label("")} htmlFor="q-exp">Valid until</label><input id="q-exp" className="input" type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} /></div>
          </div>
          <div style={{ ...fieldBox, marginTop: "var(--space-3)" }}>
            <div><label style={label("")} htmlFor="q-scope">Agreed scope</label><textarea id="q-scope" className="input" rows={3} value={form.scope} onChange={(e) => set("scope", e.target.value)} /></div>
            <div><label style={label("")} htmlFor="q-del">Deliverables *</label><textarea id="q-del" className="input" rows={3} value={form.deliverables} onChange={(e) => set("deliverables", e.target.value)} /></div>
            <div>
              <div style={label("")}>Milestones</div>
              {form.milestones.map((m, i) => (
                <div key={i} style={css("display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;")}>
                  <input className="input" aria-label={`Milestone ${i + 1} title`} style={css("flex:2 1 180px;")} placeholder="Milestone" value={m.title} onChange={(e) => set("milestones", form.milestones.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <input className="input" aria-label={`Milestone ${i + 1} due`} style={css("flex:1 1 110px;")} placeholder="Due" value={m.due ?? ""} onChange={(e) => set("milestones", form.milestones.map((x, j) => (j === i ? { ...x, due: e.target.value } : x)))} />
                  <input className="input" aria-label={`Milestone ${i + 1} amount`} style={css("flex:1 1 110px;")} placeholder="Amount" value={m.amount ?? ""} onChange={(e) => set("milestones", form.milestones.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
                  <button type="button" className="btn btn-ghost" aria-label={`Remove milestone ${i + 1}`} onClick={() => set("milestones", form.milestones.filter((_, j) => j !== i))}>Remove</button>
                </div>
              ))}
              {form.milestones.length < 12 && <button type="button" className="btn btn-secondary" style={css("font-size:12px;")} onClick={() => set("milestones", [...form.milestones, { title: "", due: "", amount: "" }])}>Add milestone</button>}
            </div>
            <div><label style={label("")} htmlFor="q-pay">Payment schedule</label><textarea id="q-pay" className="input" rows={2} value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} /></div>
            <div><label style={label("")} htmlFor="q-rev">Revision arrangements</label><textarea id="q-rev" className="input" rows={2} value={form.revisionTerms} onChange={(e) => set("revisionTerms", e.target.value)} /></div>
            <div><label style={label("")} htmlFor="q-cond">Additional conditions</label><textarea id="q-cond" className="input" rows={2} value={form.conditions} onChange={(e) => set("conditions", e.target.value)} /></div>
          </div>
          <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;margin-top:var(--space-3);")}>
            <button type="button" className="btn btn-secondary" disabled={anyBusy} onClick={doSave}>{saveAct.busy ? "Saving…" : "Save draft"}</button>
            <button type="button" className="btn btn-primary" disabled={anyBusy} onClick={doSend}>{sendAct.busy ? "Sending…" : "Save and send to client"}</button>
          </div>
        </div>
      )}

      {err && <div role="alert" style={css("font-size:13px;color:var(--om-coral);")}>{err}</div>}
      {flash && !err && <div role="status" style={css("font-size:13px;color:var(--om-azure);")}>{flash}</div>}

      {events.length > 0 && (
        <div>
          <div style={sec}>HISTORY</div>
          <ul style={css("list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:12px;")}>
            {events.map((e) => (
              <li key={e.id} style={css("opacity:0.8;")}>
                {new Date(e.createdAt).toLocaleString()} · {e.kind.replace(/_/g, " ")}
                {e.toStage ? `, ${STAGE_LABEL[e.toStage as Stage] ?? e.toStage}` : ""}{e.note ? `: ${e.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
