"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { useAsyncAction } from "@/lib/useAsyncAction";
import { track } from "@/lib/analytics/track-client";

export default function NewsletterForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const { busy, run } = useAsyncAction();

  async function submit() {
    if (!email) return;
    const result = await run(() => subscribeToNewsletter(email));
    if (!result) return;
    setMessage(result.ok ? result.message : result.error);
    if (result.ok) { setEmail(""); track("newsletter_signup"); onSuccess?.(); } // the email address is never sent
  }

  return (
    <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;flex:1 1 260px;")}>
      {message ? (
        <span style={css("font-size:13px;opacity:0.7;align-self:center;")}>{message}</span>
      ) : (
        <>
          <input
            type="email"
            className="input"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={css("min-width:200px;flex:1;")}
          />
          <button type="button" className="btn btn-primary" onClick={submit} disabled={busy || !email}>
            {busy ? "…" : "Subscribe"}
          </button>
        </>
      )}
    </div>
  );
}
