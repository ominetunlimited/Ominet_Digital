"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { setBookingStatus, updateBooking, deleteBooking, type BookingStatus } from "@/lib/admin/booking-actions";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import SaveButton from "@/components/admin/SaveButton";
import WorkflowPanel, { type QuotationItem, type EventItem, type PaymentItem, type DocItem } from "@/components/admin/WorkflowPanel";
import { STAGE_LABEL, type Stage } from "@/lib/workflow";

export type BookingItem = {
  id: string;
  serviceTitle: string;
  name: string;
  email: string;
  phone: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  message: string | null;
  status: BookingStatus;
  confirmedDate: string | null;
  confirmedTime: string | null;
  internalNotes: string | null;
  createdAt: string;
  reference?: string | null;
  enquiryKind?: string;
  details?: Record<string, unknown>;
  emailStatus?: Record<string, unknown>;
  stage?: Stage;
  bookingRef?: string | null;
  quotations?: QuotationItem[];
  events?: EventItem[];
  payments?: PaymentItem[];
  documents?: DocItem[];
};

const DETAIL_LABELS: Record<string, string> = {
  projectTitle: "Project", organisation: "Organisation", country: "Country", city: "City / state", requirements: "Requirements",
  deliverables: "Deliverables", deliveryTimeline: "Delivery timeline", startDate: "Start date", budget: "Budget",
  contactMethod: "Preferred contact", heardFrom: "Heard about us via", comments: "Comments",
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

export default function BookingRow({ item }: { item: BookingItem }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(item.confirmedDate ?? item.preferredDate ?? "");
  const [time, setTime] = useState(item.confirmedTime ?? item.preferredTime ?? "");
  const [notes, setNotes] = useState(item.internalNotes ?? "");
  const status = useAdminAction();
  const reschedule = useAdminAction();
  const noteSave = useAdminAction();
  const del = useAdminAction();
  // Enquiries that go through quotations use the workflow below; the quick Confirm buttons would bypass it.
  const workflow = item.enquiryKind === "project_enquiry" || (item.quotations?.length ?? 0) > 0;
  const busy = status.busy || reschedule.busy || noteSave.busy || del.busy;
  const error = status.error || reschedule.error || noteSave.error || del.error;

  function move(next: BookingStatus) {
    return status.run(() => setBookingStatus(item.id, next));
  }

  async function remove() {
    if (!confirm(`Permanently delete the booking from ${item.name}? This can't be undone.`)) return;
    await del.run(() => deleteBooking(item.id));
  }

  const btn = (label: string, next: BookingStatus, cls = "btn btn-secondary") => (
    <button type="button" className={cls} style={css("font-size:11px;padding:3px 8px;")} disabled={busy} onClick={() => move(next)}>
      {label}
    </button>
  );

  return (
    <>
      <tr>
        <td data-label="Customer" style={css("max-width:260px;")}>
          <div style={css("font-weight:700;font-size:13px;")}>{item.name}</div>
          {item.reference && <div style={css("font-size:11px;opacity:0.6;letter-spacing:0.04em;")}>{item.reference}</div>}
          <div style={css("font-size:12px;opacity:0.7;word-break:break-all;")}><a href={`mailto:${item.email}`}>{item.email}</a></div>
          {item.phone && <div style={css("font-size:12px;opacity:0.7;")}>{item.phone}</div>}
        </td>
        <td data-label="Service" style={css("font-size:13px;")}>{item.serviceTitle}</td>
        <td data-label="When" style={css("font-size:12px;")}>
          {item.confirmedDate || item.preferredDate ? (
            <div>
              {item.confirmedDate ? "Confirmed: " : "Wants: "}
              {item.confirmedDate ?? item.preferredDate} {item.confirmedTime ?? item.preferredTime ?? ""}
            </div>
          ) : (
            <span style={css("opacity:0.5;")}>No date given</span>
          )}
          <div style={css("opacity:0.5;")}>Sent {new Date(item.createdAt).toLocaleString()}</div>
        </td>
        <td data-label="Status" style={css("font-size:12px;font-weight:700;")}>{workflow && item.stage ? STAGE_LABEL[item.stage] : STATUS_LABEL[item.status]}</td>
        <td data-label="Actions">
          <div style={css("display:flex;gap:6px;flex-wrap:wrap;")}>
            {!workflow && item.status !== "confirmed" && btn("Confirm", "confirmed", "btn btn-primary")}
            {!workflow && item.status === "pending" && btn("Decline", "declined")}
            {!workflow && (item.status === "pending" || item.status === "confirmed") && btn("Cancel", "cancelled")}
            {!workflow && item.status === "confirmed" && btn("Mark completed", "completed")}
            {!workflow && item.status !== "pending" && btn("Back to pending", "pending", "btn btn-ghost")}
            <button type="button" className="btn btn-ghost" style={css("font-size:11px;padding:3px 8px;")} onClick={() => setOpen((o) => !o)}>
              {open ? "Close" : "Details"}
            </button>
          </div>
          {error && <div style={css("font-size:11px;color:var(--om-coral);margin-top:4px;")}>{error}</div>}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={5} style={css("background:var(--color-surface);")}>
            <div style={css("display:grid;gap:var(--space-3);max-width:860px;padding:var(--space-2) 0;")}>
              {item.message && (
                <div>
                  <div style={css("font-size:11px;opacity:0.5;letter-spacing:0.08em;margin-bottom:2px;")}>THEIR MESSAGE</div>
                  <div style={css("font-size:13px;line-height:1.6;white-space:pre-wrap;")}>{item.message}</div>
                </div>
              )}
              {item.details && Object.keys(item.details).length > 0 && (
                <div>
                  <div style={css("font-size:11px;opacity:0.5;letter-spacing:0.08em;margin-bottom:4px;")}>PROJECT ENQUIRY DETAILS</div>
                  <dl style={css("margin:0;display:grid;grid-template-columns:minmax(120px,32%) 1fr;gap:4px 12px;font-size:13px;")}>
                    {Object.entries(DETAIL_LABELS).map(([k, label]) => {
                      const v = item.details?.[k];
                      return v ? (<div key={k} style={{ display: "contents" }}><dt style={{ opacity: 0.6 }}>{label}</dt><dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{String(v)}</dd></div>) : null;
                    })}
                    {Object.entries((item.details.serviceDetails ?? {}) as Record<string, string>).map(([k, v]) => (
                      <div key={k} style={{ display: "contents" }}><dt style={{ opacity: 0.6 }}>{k}</dt><dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{String(v)}</dd></div>
                    ))}
                  </dl>
                  {item.emailStatus && Object.keys(item.emailStatus).length > 0 && (
                    <div style={css("font-size:12px;opacity:0.7;margin-top:6px;")}>
                      Emails: team notification {String(item.emailStatus.internal ?? "?")}, client acknowledgement {String(item.emailStatus.acknowledgement ?? "?")}
                      {" "}(accepted means Mailgun took it, not that it reached the inbox).
                    </div>
                  )}
                </div>
              )}
              {workflow && item.stage && (
                <WorkflowPanel bookingId={item.id} stage={item.stage} bookingRef={item.bookingRef ?? null} details={item.details ?? {}} quotations={item.quotations ?? []} events={item.events ?? []} payments={item.payments ?? []} documents={item.documents ?? []} />
              )}
              {!workflow && (<div>
                <div style={css("font-size:11px;opacity:0.5;letter-spacing:0.08em;margin-bottom:4px;")}>RESCHEDULE / CONFIRM A SLOT</div>
                <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;align-items:center;")}>
                  <input type="date" className="input" style={css("width:170px;")} value={date} onChange={(e) => setDate(e.target.value)} />
                  <input className="input" style={css("width:170px;")} placeholder="Time, e.g. 2pm" value={time} onChange={(e) => setTime(e.target.value)} />
                  <SaveButton
                    busy={reschedule.busy}
                    saved={reschedule.saved}
                    idleLabel="Save & confirm"
                    onClick={() => reschedule.run(() => updateBooking(item.id, { confirmedDate: date, confirmedTime: time, confirm: true }))}
                  />
                </div>
              </div>)}
              <div>
                <div style={css("font-size:11px;opacity:0.5;letter-spacing:0.08em;margin-bottom:4px;")}>INTERNAL NOTES (never shown to the customer)</div>
                <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                <div style={css("margin-top:var(--space-2);")}>
                  <SaveButton busy={noteSave.busy} saved={noteSave.saved} idleLabel="Save notes" onClick={() => noteSave.run(() => updateBooking(item.id, { internalNotes: notes }))} />
                </div>
              </div>
              <div>
                <button type="button" className="btn btn-ghost" style={css("font-size:12px;color:var(--om-coral);")} disabled={busy} onClick={remove}>
                  Delete booking permanently
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
