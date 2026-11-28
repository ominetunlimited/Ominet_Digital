"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { css } from "@/lib/css";
import { useAsyncAction } from "@/lib/useAsyncAction";
import { track } from "@/lib/analytics/track-client";
import { submitOptionEnquiry } from "@/lib/option-enquiries";
import { fieldsFor, FLAVOUR_COPY, SECURITY_NOTICE } from "@/lib/service-option-forms";
import type { Flavour } from "@/lib/service-options";
import { ACCEPT, ACCEPT_LABEL, MAX_FILES, MAX_FILE_BYTES, prettySize } from "@/lib/enquiry-upload";

export type FormOption = { key: string; label: string; group: string | null; duration: string | null; priceLabel: string; description: string | null };
type Attached = { key: string; name: string; size: number; state: "uploading" | "done" | "error"; id?: string; error?: string };

export default function ServiceOptionForm({ serviceSlug, flavour, options, preselect }: { serviceSlug: string; flavour: Flavour; options: FormOption[]; preselect?: string }) {
  const copy = FLAVOUR_COPY[flavour];
  const [picked, setPicked] = useState<string[]>(() => (preselect && options.some((o) => o.key === preselect) ? [preselect] : []));
  const [c, setC] = useState({ name: "", email: "", phone: "", whatsapp: "", location: "", contactMethod: "Email", newsletterOptIn: false, consent: false, website: "" });
  const [vals, setVals] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Attached[]>([]);
  const [done, setDone] = useState<{ reference: string; ack: boolean } | null>(null);
  const { busy, error, run } = useAsyncAction();
  const uploading = files.some((f) => f.state === "uploading");
  const fields = useMemo(() => fieldsFor(flavour, picked), [flavour, picked]);
  const chosen = options.filter((o) => picked.includes(o.key));
  const groups = useMemo(() => Array.from(new Set(options.map((o) => o.group ?? ""))), [options]);

  function toggle(key: string) {
    setPicked((p) => (copy.multi ? (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]) : [key]));
  }
  async function addFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_FILES - files.filter((f) => f.state !== "error").length;
    for (const file of Array.from(list).slice(0, Math.max(0, room))) {
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
      if (file.size > MAX_FILE_BYTES) { setFiles((x) => [...x, { key, name: file.name, size: file.size, state: "error", error: "Larger than 4 MB. Please email this one to us." }]); continue; }
      setFiles((x) => [...x, { key, name: file.name, size: file.size, state: "uploading" }]);
      try {
        const body = new FormData(); body.append("file", file);
        const res = await fetch("/api/enquiry-upload", { method: "POST", body });
        const json = (await res.json().catch(() => null)) as { ok: boolean; id?: string; error?: string } | null;
        setFiles((x) => x.map((f) => (f.key === key ? (json?.ok ? { ...f, state: "done", id: json.id } : { ...f, state: "error", error: json?.error ?? "Upload failed. Please try again." }) : f)));
      } catch {
        setFiles((x) => x.map((f) => (f.key === key ? { ...f, state: "error", error: "Upload failed. Check your connection and try again." } : f)));
      }
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await run(() => submitOptionEnquiry({ serviceSlug, optionKeys: picked, ...c, values: vals, uploadIds: files.filter((f) => f.state === "done" && f.id).map((f) => f.id as string) }));
    if (res?.ok) {
      setDone({ reference: res.reference, ack: res.acknowledgementSent });
      track("enquiry_submitted", { kind: "service_request" }); // only after the server confirmed it; nothing the visitor typed is sent
    }
  }

  if (done) {
    return (
      <div role="status" style={css("padding:var(--space-6);border:2px solid var(--om-cyan);border-radius:var(--radius-md);max-width:640px;")}>
        <h2 style={css("font-family:var(--font-heading);font-size:26px;margin:0 0 var(--space-3);")}>Request received</h2>
        <p style={css("font-size:15px;line-height:1.7;margin:0 0 var(--space-3);")}>Thank you. We will review your request and contact you with next steps and a quotation. No payment is due until you have received and accepted a quotation.</p>
        <p style={css("font-size:15px;margin:0 0 var(--space-2);")}>Your reference: <strong>{done.reference}</strong></p>
        <p style={css("font-size:13px;opacity:0.7;margin:0;")}>{done.ack ? "A confirmation email is on its way. Please check your spam folder if you don't see it." : "Keep this reference for any follow-up. If you don't hear from us, message us on WhatsApp or email."}</p>
      </div>
    );
  }

  const set = (k: keyof typeof c, v: string | boolean) => setC((x) => ({ ...x, [k]: v }));
  return (
    <form onSubmit={submit} noValidate style={css("display:grid;gap:var(--space-6);max-width:760px;")}>
      <p style={css("font-size:13px;line-height:1.6;opacity:0.8;margin:0;padding:var(--space-3);border-left:3px solid var(--om-cyan);background:var(--color-surface);")}>{copy.notice}</p>

      <fieldset style={css("border:0;padding:0;margin:0;display:grid;gap:var(--space-3);")}>
        <legend style={css("font-family:var(--font-heading);font-size:20px;margin-bottom:var(--space-3);")}>{copy.question} *</legend>
        {groups.map((g) => (
          <div key={g || "all"} style={css("display:grid;gap:var(--space-2);")}>
            {copy.multi && g && <div style={css("font-size:12px;letter-spacing:0.08em;opacity:0.6;margin-top:var(--space-2);")}>{g.toUpperCase()}</div>}
            {options.filter((o) => (o.group ?? "") === g).map((o) => {
              const on = picked.includes(o.key);
              return (
                <label key={o.key} style={css(`display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid ${on ? "var(--om-cyan)" : "var(--color-border,#d9d3f0)"};border-radius:var(--radius-md);cursor:pointer;min-height:44px;font-size:14px;background:${on ? "var(--om-mist)" : "transparent"};`)}>
                  <input type={copy.multi ? "checkbox" : "radio"} name="option" checked={on} onChange={() => toggle(o.key)} style={css("margin-top:3px;")} />
                  <span style={css("flex:1;")}>
                    <strong style={css("display:block;")}>{o.label}</strong>
                    {o.description && <span style={css("display:block;font-size:13px;opacity:0.75;")}>{o.description}</span>}
                    <span style={css("display:block;font-size:12px;opacity:0.7;margin-top:2px;")}>{o.duration ? `Estimated time: ${o.duration}. ` : ""}Professional fee: {o.priceLabel}</span>
                  </span>
                </label>
              );
            })}
          </div>
        ))}
        {chosen.some((o) => o.duration) && (
          <p role="status" style={css("font-size:13px;margin:0;")}><strong>Estimated processing/effect time:</strong> {chosen.filter((o) => o.duration).map((o) => (chosen.length > 1 ? `${o.label}, ${o.duration}` : o.duration)).join("; ")}. This is an estimate, not a guarantee.</p>
        )}
      </fieldset>

      {picked.length > 0 && (
        <>
          <fieldset style={css("border:0;padding:0;margin:0;display:grid;gap:var(--space-3);")}>
            <legend style={css("font-family:var(--font-heading);font-size:20px;margin-bottom:var(--space-3);")}>About you</legend>
            <div className="field"><label htmlFor="so-name">Full name *</label><input id="so-name" className="input" autoComplete="name" value={c.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="field"><label htmlFor="so-email">Email address *</label><input id="so-email" className="input" type="email" inputMode="email" autoComplete="email" value={c.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
              <div className="field" style={css("flex:1 1 200px;")}><label htmlFor="so-phone">Phone number *</label><input id="so-phone" className="input" type="tel" autoComplete="tel" value={c.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div className="field" style={css("flex:1 1 200px;")}><label htmlFor="so-wa">WhatsApp number</label><input id="so-wa" className="input" type="tel" value={c.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
            </div>
            <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
              <div className="field" style={css("flex:1 1 200px;")}><label htmlFor="so-loc">Your location (city and state)</label><input id="so-loc" className="input" autoComplete="address-level2" value={c.location} onChange={(e) => set("location", e.target.value)} /></div>
              <div className="field" style={css("flex:1 1 200px;")}><label htmlFor="so-cm">Preferred contact method</label>
                <select id="so-cm" className="input" value={c.contactMethod} onChange={(e) => set("contactMethod", e.target.value)}><option>Email</option><option>WhatsApp</option><option>Phone call</option></select></div>
            </div>
          </fieldset>

          <fieldset style={css("border:0;padding:0;margin:0;display:grid;gap:var(--space-3);")}>
            <legend style={css("font-family:var(--font-heading);font-size:20px;margin-bottom:var(--space-3);")}>Details for your request</legend>
            {fields.map((f) => (
              <div className="field" key={f.key}>
                <label htmlFor={`so-${f.key}`}>{f.label}{f.required ? " *" : ""}</label>
                {f.type === "textarea" ? (
                  <textarea id={`so-${f.key}`} className="input" rows={3} value={vals[f.key] ?? ""} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))} />
                ) : f.type === "select" ? (
                  <select id={`so-${f.key}`} className="input" value={vals[f.key] ?? ""} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}><option value="">Choose…</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
                ) : (
                  <input id={`so-${f.key}`} className="input" value={vals[f.key] ?? ""} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))} />
                )}
                {f.help && <span style={css("font-size:12px;opacity:0.65;")}>{f.help}</span>}
              </div>
            ))}
            <div className="field">
              <label htmlFor="so-files">Supporting documents (optional)</label>
              <input id="so-files" className="input" type="file" multiple accept={ACCEPT} disabled={files.filter((f) => f.state !== "error").length >= MAX_FILES} onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} aria-describedby="so-files-help" />
              <span id="so-files-help" style={css("font-size:12px;opacity:0.65;")}>{ACCEPT_LABEL}. Only upload documents relevant to your request.</span>
              {files.length > 0 && (
                <ul style={css("list-style:none;margin:8px 0 0;padding:0;display:grid;gap:6px;font-size:13px;")} aria-live="polite">
                  {files.map((f) => (
                    <li key={f.key} style={css("display:flex;gap:8px;flex-wrap:wrap;align-items:center;")}>
                      <span>{f.name} <span style={css("opacity:0.6;")}>({prettySize(f.size)})</span></span>
                      <span style={css(f.state === "error" ? "color:var(--om-coral);" : "opacity:0.7;")}>{f.state === "uploading" ? "Uploading…" : f.state === "done" ? "Attached" : f.error}</span>
                      <button type="button" className="btn btn-ghost" style={css("font-size:12px;padding:2px 8px;")} onClick={() => setFiles((x) => x.filter((y) => y.key !== f.key))}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p style={css("font-size:13px;font-weight:600;margin:0;color:var(--om-coral);")}>{SECURITY_NOTICE}</p>
            <label style={css("display:flex;gap:10px;align-items:flex-start;font-size:14px;min-height:44px;")}>
              <input type="checkbox" checked={c.consent} onChange={(e) => set("consent", e.target.checked)} style={css("margin-top:3px;")} />
              <span>I agree that Ominet Digital may process the information I submit to handle this request and contact me about it, as described in the <Link href="/privacy">privacy policy</Link>. *</span>
            </label>
        <label style={css("display:flex;gap:10px;align-items:flex-start;font-size:14px;min-height:44px;")}>
          <input type="checkbox" checked={c.newsletterOptIn} onChange={(e) => set("newsletterOptIn", e.target.checked)} style={css("margin-top:3px;")} />
          <span>Also send me occasional news and updates from Ominet Digital (optional). You can unsubscribe at any time.</span>
        </label>
          </fieldset>

          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
            <label>Website<input tabIndex={-1} autoComplete="off" value={c.website} onChange={(e) => set("website", e.target.value)} /></label>
          </div>
          {error && <p role="alert" style={css("font-size:14px;color:var(--om-coral);margin:0;")}>{error}</p>}
          <div><button type="submit" className="btn btn-primary" disabled={busy || uploading} style={css("min-height:48px;")}>{busy ? "Sending…" : uploading ? "Uploading files…" : "Send my request"}</button></div>
        </>
      )}
    </form>
  );
}
