"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { sendLoginLink } from "@/lib/auth-actions";
import { startContentCheckout } from "@/lib/payments/actions";

export default function PaywallGate({
  contentId,
  price,
  userEmail,
  currentPath,
}: {
  contentId: string;
  price?: string;
  userEmail: string | null;
  currentPath: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSendLink() {
    if (!email) return;
    setStatus("busy");
    const result = await sendLoginLink(email, currentPath);
    if (result.ok) {
      setStatus("sent");
      setMessage(result.message ?? "Check your email for a sign-in link.");
    } else {
      setStatus("error");
      setMessage(result.error);
    }
  }

  async function handleBuy() {
    setStatus("busy");
    const result = await startContentCheckout(contentId);
    // On success startContentCheckout redirects server-side and this line
    // never runs; on failure it returns an error instead of throwing.
    if (result && !result.ok) {
      setStatus("error");
      setMessage(result.error);
    }
  }

  return (
    <div style={css("margin:var(--space-8) 0;padding:var(--space-6);border:2px solid var(--color-divider);text-align:center;")}>
      <div style={css("font-size:13px;opacity:0.6;margin-bottom:var(--space-2);")}>This essay continues for paid readers.</div>
      {price && <div style={css("font-family:var(--font-heading);font-size:24px;margin-bottom:var(--space-4);")}>{price}</div>}

      {userEmail ? (
        <button type="button" className="btn btn-primary" onClick={handleBuy} disabled={status === "busy"}>
          {status === "busy" ? "Redirecting…" : "Get full access"}
        </button>
      ) : status === "sent" ? (
        <p style={css("font-size:13px;opacity:0.7;")}>{message}</p>
      ) : (
        <div style={css("display:flex;gap:var(--space-2);justify-content:center;flex-wrap:wrap;max-width:360px;margin:0 auto;")}>
          <input
            type="email"
            className="input"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={css("flex:1;min-width:180px;")}
          />
          <button type="button" className="btn btn-primary" onClick={handleSendLink} disabled={status === "busy" || !email}>
            Get full access
          </button>
        </div>
      )}

      {status === "error" && <div style={css("font-size:12px;color:var(--om-coral);margin-top:var(--space-3);")}>{message}</div>}

      <div style={css("font-size:12px;opacity:0.5;margin-top:var(--space-3);")}>
        Already purchased? Enter the email you used above and we&apos;ll send you a sign-in link.
      </div>
    </div>
  );
}
