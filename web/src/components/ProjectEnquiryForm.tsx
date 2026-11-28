"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { css } from "@/lib/css";
import { submitEnquiry, type EnquiryInput } from "@/lib/enquiries";
import { groupForService } from "@/lib/enquiry-fields";
import { useAsyncAction } from "@/lib/useAsyncAction";
import { track } from "@/lib/analytics/track-client";
import { saveEnquiryReceipt } from "@/lib/enquiry-receipt";
import { ACCEPT, ACCEPT_LABEL, MAX_FILES, MAX_FILE_BYTES, prettySize } from "@/lib/enquiry-upload";

type Attached = { key: string; name: string; size: number; state: "uploading" | "done" | "error"; id?: string; error?: string };

type Svc = { id: string; slug: string; title: string };

const EMPTY: Omit<EnquiryInput, "serviceIds" | "serviceDetails"> = {
  name: "", email: "", phone: "", organisation: "", country: "", city: "", projectTitle: "", summary: "", requirements: "",
  deliverables: "", deliveryDate: "", startDate: "", budget: "", contactMethod: "Email", heardFrom: "", comments: "", newsletterOptIn: false, consent: false, website: "",
};

export default function ProjectEnquiryForm({ services, preselect }: { services: Svc[]; preselect?: string }) {
  const router = useRouter();
  const [v, setV] = useState(EMPTY);
  const [picked, setPicked] = useState<string[]>(() => {
    const s = services.find((x) => x.slug === preselect);
    return s ? [s.id] : [];
  });
  const [details, setDetails] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ reference: string; ack: boolean } | null>(null);
  const { busy, error, run } = useAsyncAction();
  const [files, setFiles] = useState<Attached[]>([]);
  const uploading = files.some((f) => f.state === "uploading");

  async function addFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_FILES - files.filter((f) => f.state !== "error").length;
    const picked = Array.from(list).slice(0, Math.max(0, room));
    for (const file of picked) {
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

  const set = (k: keyof typeof EMPTY, val: string | boolean) => setV((x) => ({ ...x, [k]: val }));
  const groups = useMemo(
    () => services.filter((s) => picked.includes(s.id)).map((s) => ({ svc: s, group: groupForService(s) })).filter((x) => x.group),
    [services, picked]
  );
  // Several selected services can share a group; show each group once.
  const uniqueGroups = groups.filter((g, i) => groups.findIndex((o) => o.group!.id === g.group!.id) === i);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await run(() => submitEnquiry({ ...v, serviceIds: picked, serviceDetails: details, uploadIds: files.filter((f) => f.state === "done" && f.id).map((f) => f.id as string) }));
    if (res?.ok) {
      setDone({ reference: res.reference, ack: res.acknowledgementSent }); // stays on screen if the move to /thank-you fails
      track("enquiry_submitted", { kind: "project" }); // only after the server confirmed it; nothing the visitor typed is sent
      saveEnquiryReceipt({ reference: res.reference, ack: res.acknowledgementSent });
      router.push("/thank-you");
    }
  }

  if (done) {
    return (
      <div role="status" style={css("padding:var(--space-6);border:2px solid var(--om-cyan);border-radius:var(--radius-md);max-width:640px;")}>
        <h2 style={css("font-family:var(--font-heading);font-size:26px;margin:0 0 var(--space-3);")}>Enquiry received</h2>
        <p style={css("font-size:15px;line-height:1.7;margin:0 0 var(--space-3);")}>
          Your project enquiry has been received. Thank you for considering Ominet Digital. Our team will review your requirements and contact you using the details provided.
        </p>
        <p style={css("font-size:15px;margin:0 0 var(--space-2);")}>Your reference: <strong>{done.reference}</strong></p>
        <p style={css("font-size:13px;opacity:0.7;margin:0;")}>
          {done.ack ? "A confirmation email is on its way. Please check your spam folder if you don't see it." : "Keep this reference for any follow-up. If you don't hear from us, message us on WhatsApp or email."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate style={css("display:grid;gap:var(--space-6);max-width:760px;")}>
      <fieldset style={css("border:0;padding:0;margin:0;display:grid;gap:var(--space-3);")}>
        <legend style={css("font-family:var(--font-heading);font-size:20px;margin-bottom:var(--space-3);")}>About you</legend>
        <div className="field"><label htmlFor="pe-name">Full name *</label><input id="pe-name" className="input" required autoComplete="name" value={v.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="field"><label htmlFor="pe-email">Email address *</label><input id="pe-email" className="input" type="email" required autoComplete="email" inputMode="email" value={v.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div className="field"><label htmlFor="pe-phone">WhatsApp / phone</label><input id="pe-phone" className="input" type="tel" autoComplete="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div className="field"><label htmlFor="pe-org">Organisation or company (optional)</label><input id="pe-org" className="input" autoComplete="organization" value={v.organisation} onChange={(e) => set("organisation", e.target.value)} /></div>
        <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
          <div className="field" style={css("flex:1 1 200px;")}><label htmlFor="pe-country">Country</label><input id="pe-country" className="input" autoComplete="country-name" value={v.country} onChange={(e) => set("country", e.target.value)} /></div>
          <div className="field" style={css("flex:1 1 200px;")}><label htmlFor="pe-city">State or city</label><input id="pe-city" className="input" autoComplete="address-level2" value={v.city} onChange={(e) => set("city", e.target.value)} /></div>
        </div>
      </fieldset>

      <fieldset style={css("border:0;padding:0;margin:0;display:grid;gap:var(--space-3);")}>
        <legend style={css("font-family:var(--font-heading);font-size:20px;margin-bottom:var(--space-3);")}>Your project</legend>
        <div className="field"><label htmlFor="pe-title">Project title or subject *</label><input id="pe-title" className="input" required value={v.projectTitle} onChange={(e) => set("projectTitle", e.target.value)} /></div>
        <div role="group" aria-labelledby="pe-svc-label">
          <div id="pe-svc-label" style={css("font-size:14px;font-weight:600;margin-bottom:var(--space-2);")}>Services required * <span style={css("font-weight:400;opacity:0.6;")}>(choose one or more)</span></div>
          <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:var(--space-2);")}>
            {services.map((s) => {
              const on = picked.includes(s.id);
              return (
                <label key={s.id} style={css(`display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid ${on ? "var(--om-cyan)" : "var(--color-border, #d9d3f0)"};border-radius:var(--radius-md);cursor:pointer;min-height:44px;font-size:14px;background:${on ? "var(--om-mist)" : "transparent"};`)}>
                  <input type="checkbox" checked={on} onChange={() => setPicked((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))} style={css("margin-top:3px;")} />
                  <span>{s.title}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="field"><label htmlFor="pe-summary">Brief project description *</label><textarea id="pe-summary" className="input" rows={4} required value={v.summary} onChange={(e) => set("summary", e.target.value)} /></div>
        <div className="field"><label htmlFor="pe-req">Detailed requirements</label><textarea id="pe-req" className="input" rows={4} value={v.requirements} onChange={(e) => set("requirements", e.target.value)} /></div>
        <div className="field"><label htmlFor="pe-del">Expected deliverables *</label><textarea id="pe-del" className="input" rows={3} required value={v.deliverables} onChange={(e) => set("deliverables", e.target.value)} /></div>
        <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
          <div className="field" style={css("flex:1 1 200px;")}><label htmlFor="pe-when">Preferred delivery date or timeline *</label><input id="pe-when" className="input" required placeholder="e.g. 2026-12-15 or within 6 weeks" value={v.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} /></div>
          <div className="field" style={css("flex:1 1 200px;")}><label htmlFor="pe-start">Project start date (if known)</label><input id="pe-start" className="input" type="date" value={v.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
        </div>
        <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
          <div className="field" style={css("flex:1 1 200px;")}><label htmlFor="pe-budget">Budget range (optional)</label><input id="pe-budget" className="input" value={v.budget} onChange={(e) => set("budget", e.target.value)} /></div>
          <div className="field" style={css("flex:1 1 200px;")}>
            <label htmlFor="pe-contact">Preferred way to be contacted</label>
            <select id="pe-contact" className="input" value={v.contactMethod} onChange={(e) => set("contactMethod", e.target.value)}>
              <option>Email</option><option>WhatsApp</option><option>Phone call</option>
            </select>
          </div>
        </div>
      </fieldset>

      {uniqueGroups.map(({ group }) => (
        <fieldset key={group!.id} style={css("border:1px solid var(--color-border,#d9d3f0);border-radius:var(--radius-md);padding:var(--space-4);margin:0;display:grid;gap:var(--space-3);")}>
          <legend style={css("font-family:var(--font-heading);font-size:17px;padding:0 8px;")}>{group!.title}: a few more details</legend>
          {group!.fields.map((f) => (
            <div className="field" key={f.key}>
              <label htmlFor={`pe-${f.key}`}>{f.label}</label>
              {f.type === "textarea" ? (
                <textarea id={`pe-${f.key}`} className="input" rows={3} value={details[f.key] ?? ""} onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))} />
              ) : (
                <input id={`pe-${f.key}`} className="input" type={f.type === "date" ? "date" : "text"} value={details[f.key] ?? ""} onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))} />
              )}
            </div>
          ))}
        </fieldset>
      ))}

      <fieldset style={css("border:0;padding:0;margin:0;display:grid;gap:var(--space-3);")}>
        <legend style={css("font-family:var(--font-heading);font-size:20px;margin-bottom:var(--space-3);")}>A little more</legend>
        <div className="field"><label htmlFor="pe-heard">How did you hear about Ominet Digital?</label><input id="pe-heard" className="input" value={v.heardFrom} onChange={(e) => set("heardFrom", e.target.value)} /></div>
        <div className="field"><label htmlFor="pe-comments">Additional comments</label><textarea id="pe-comments" className="input" rows={3} value={v.comments} onChange={(e) => set("comments", e.target.value)} /></div>
        <div className="field">
          <label htmlFor="pe-files">Reference files (optional)</label>
          <input id="pe-files" className="input" type="file" multiple accept={ACCEPT} disabled={files.filter((f) => f.state !== "error").length >= MAX_FILES} onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} aria-describedby="pe-files-help" />
          <span id="pe-files-help" style={css("font-size:12px;opacity:0.65;")}>{ACCEPT_LABEL}. Larger files can be emailed to us after you submit.</span>
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
        <label style={css("display:flex;gap:10px;align-items:flex-start;font-size:14px;min-height:44px;")}>
          <input type="checkbox" checked={v.consent} onChange={(e) => set("consent", e.target.checked)} style={css("margin-top:3px;")} />
          <span>I agree that Ominet Digital may contact me about this enquiry. *</span>
        </label>
        <label style={css("display:flex;gap:10px;align-items:flex-start;font-size:14px;min-height:44px;")}>
          <input type="checkbox" checked={v.newsletterOptIn} onChange={(e) => set("newsletterOptIn", e.target.checked)} style={css("margin-top:3px;")} />
          <span>Also send me occasional news and updates from Ominet Digital (optional). You can unsubscribe at any time.</span>
        </label>
      </fieldset>

      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label>Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set("website", e.target.value)} /></label>
      </div>

      {error && <p role="alert" style={css("font-size:14px;color:var(--om-coral);margin:0;")}>{error}</p>}
      <div>
        <button type="submit" className="btn btn-primary" disabled={busy || uploading} style={css("min-height:48px;")}>{busy ? "Sending…" : uploading ? "Uploading files…" : "Send my enquiry"}</button>
      </div>
    </form>
  );
}
