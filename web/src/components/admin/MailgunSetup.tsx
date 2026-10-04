"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import { saveMailgunConfig, clearMailgunConfig, type MailgunStatus } from "@/lib/admin/integration-settings-actions";

/** Admin-only (gated by the server page — this component is just the form). */
export default function MailgunSetup({ initial }: { initial: MailgunStatus }) {
  const [status, setStatus] = useState(initial);
  const [apiKey, setApiKey] = useState("");
  const [domain, setDomain] = useState(initial.domain);
  const [region, setRegion] = useState<"us" | "eu">(initial.region);
  const save = useAdminAction();
  const clear = useAdminAction();

  async function doSave() {
    const result = await save.run(() => saveMailgunConfig({ apiKey, domain, region }));
    if (result?.ok) {
      setStatus({ configured: true, domain, region, apiKeyHint: apiKey ? `•••• ${apiKey.slice(-4)}` : status.apiKeyHint });
      setApiKey("");
    }
  }

  async function doClear() {
    if (!confirm("Disconnect Mailgun? Sending will stop working until it's set up again.")) return;
    const result = await clear.run(() => clearMailgunConfig());
    if (result?.ok) {
      setStatus({ configured: false, domain: "", region: "us", apiKeyHint: "" });
      setDomain("");
      setRegion("us");
    }
  }

  return (
    <div className="card" style={css("gap:var(--space-3);max-width:560px;margin-bottom:var(--space-6);")}>
      <div style={css("display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;")}>
        <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: status.configured ? "#1f9d55" : "#8a8f98", display: "inline-block" }} />
        <strong style={css("font-size:14px;")}>Mailgun setup</strong>
        <span style={css("font-size:12px;opacity:0.6;")}>{status.configured ? `Connected — ${status.domain}` : "Not connected"}</span>
      </div>
      <p style={css("font-size:12px;opacity:0.6;margin:0;")}>
        From Mailgun: verify a sending domain, add the DNS records it gives you, then paste your private API key and that domain here. No Vercel access needed.
      </p>

      <div className="field">
        <label>Mailgun private API key{status.apiKeyHint ? ` (current: ${status.apiKeyHint})` : ""}</label>
        <input className="input" type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={status.configured ? "Leave blank to keep the current key" : "key-…"} />
      </div>
      <div className="field">
        <label>Sending domain</label>
        <input className="input" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mg.ominetdigital.com.ng" />
      </div>
      <div className="field" style={css("max-width:200px;")}>
        <label>Region</label>
        <select className="input" value={region} onChange={(e) => setRegion(e.target.value === "eu" ? "eu" : "us")}>
          <option value="us">US (default)</option>
          <option value="eu">EU</option>
        </select>
      </div>

      {save.error && <p style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{save.error}</p>}
      {clear.error && <p style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{clear.error}</p>}

      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
        <button type="button" className="btn btn-primary" disabled={save.busy || !domain.trim()} onClick={doSave}>
          {save.busy ? "Saving…" : save.saved ? "Saved ✓" : "Save"}
        </button>
        {status.configured && (
          <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} disabled={clear.busy} onClick={doClear}>
            {clear.busy ? "Disconnecting…" : "Disconnect"}
          </button>
        )}
      </div>
    </div>
  );
}
