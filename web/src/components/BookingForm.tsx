"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { submitBooking } from "@/lib/bookings";
import { useAsyncAction } from "@/lib/useAsyncAction";

export default function BookingForm({ serviceId, serviceTitle, ctaLabel, supportEmail }: { serviceId: string; serviceTitle: string; ctaLabel: string; supportEmail: string }) {
  const SUPPORT_EMAIL = supportEmail;
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ name: "", email: "", phone: "", preferredDate: "", preferredTime: "", message: "", website: "" });
  const [reference, setReference] = useState<string | null>(null);
  const { busy, error, run } = useAsyncAction();

  function set(key: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit() {
    const result = await run(() => submitBooking({ serviceId, ...values }));
    if (result?.ok) setReference(result.reference);
  }

  if (reference) {
    return (
      <div style={css("padding:var(--space-5);border:2px solid var(--color-accent);border-radius:var(--radius-md);max-width:520px;")}>
        <div style={css("font-family:var(--font-heading);font-size:20px;margin-bottom:var(--space-2);")}>Request received</div>
        <p style={css("font-size:14px;line-height:1.6;opacity:0.8;margin:0 0 var(--space-2);")}>
          Thanks — we&apos;ll get back to you about <strong>{serviceTitle}</strong> at the email you gave.
        </p>
        <p style={css("font-size:12px;opacity:0.6;margin:0;")}>Reference: {reference}. Questions? {SUPPORT_EMAIL}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <div>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>{ctaLabel}</button>
        <div style={css("font-size:12px;opacity:0.55;margin-top:var(--space-2);")}>
          No account needed. Prefer email?{" "}
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Enquiry: ${serviceTitle}`)}`}>{SUPPORT_EMAIL}</a>
        </div>
      </div>
    );
  }

  const canSubmit = values.name.trim() && values.email.trim();

  return (
    <div style={css("max-width:520px;display:grid;gap:var(--space-3);")}>
      <div className="field">
        <label htmlFor="bk-name">Your name</label>
        <input id="bk-name" className="input" autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="bk-email">Email</label>
        <input id="bk-email" className="input" type="email" autoComplete="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="bk-phone">Phone (optional)</label>
        <input id="bk-phone" className="input" type="tel" autoComplete="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:1 1 160px;")}>
          <label htmlFor="bk-date">Preferred date (optional)</label>
          <input id="bk-date" className="input" type="date" value={values.preferredDate} onChange={(e) => set("preferredDate", e.target.value)} />
        </div>
        <div className="field" style={css("flex:1 1 160px;")}>
          <label htmlFor="bk-time">Preferred time (optional)</label>
          <input id="bk-time" className="input" placeholder="e.g. morning, 2pm" value={values.preferredTime} onChange={(e) => set("preferredTime", e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="bk-msg">Tell us about your project (optional)</label>
        <textarea id="bk-msg" className="input" rows={4} value={values.message} onChange={(e) => set("message", e.target.value)} />
      </div>

      {/* Honeypot: hidden from people and screen readers, irresistible to bots. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label>Website<input tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} /></label>
      </div>

      {error && <p role="alert" style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{error}</p>}

      <div style={css("display:flex;gap:var(--space-3);align-items:center;")}>
        <button type="button" className="btn btn-primary" onClick={submit} disabled={busy || !canSubmit}>
          {busy ? "Sending…" : "Send request"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
      </div>
    </div>
  );
}
