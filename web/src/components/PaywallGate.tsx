"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { sendLoginLink } from "@/lib/auth-actions";
import { startContentCheckout } from "@/lib/payments/actions";
import { useAsyncAction } from "@/lib/useAsyncAction";

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
  const [showRestore, setShowRestore] = useState(false);
  const [restoreSent, setRestoreSent] = useState<string | null>(null);
  const buy = useAsyncAction();
  const restore = useAsyncAction();

  async function handleBuy() {
    // No account required — a signed-in reader's order is tied to their
    // session automatically; anyone else checks out as a guest with just
    // the email typed below. useAsyncAction guarantees this can never hang
    // on "Redirecting…" forever, even if Paystack itself fails or stalls.
    await buy.run(() => startContentCheckout(contentId, email));
  }

  async function handleSendLink() {
    if (!email) return;
    const result = await restore.run(() => sendLoginLink(email, currentPath));
    if (result?.ok) setRestoreSent(result.message ?? "Check your email for a sign-in link.");
  }

  return (
    <div style={css("margin:var(--space-8) 0;padding:var(--space-6);border:2px solid var(--color-divider);text-align:center;")}>
      <div style={css("font-size:13px;opacity:0.6;margin-bottom:var(--space-2);")}>This essay continues for paid readers.</div>
      {price && <div style={css("font-family:var(--font-heading);font-size:24px;margin-bottom:var(--space-4);")}>{price}</div>}

      {userEmail ? (
        <button type="button" className="btn btn-primary" onClick={handleBuy} disabled={buy.busy}>
          {buy.busy ? "Redirecting…" : "Get full access"}
        </button>
      ) : showRestore ? (
        restoreSent ? (
          <p style={css("font-size:13px;opacity:0.7;")}>{restoreSent}</p>
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
            <button type="button" className="btn btn-primary" onClick={handleSendLink} disabled={restore.busy || !email}>
              {restore.busy ? "Sending…" : "Send link"}
            </button>
          </div>
        )
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
          <button type="button" className="btn btn-primary" onClick={handleBuy} disabled={buy.busy || !email}>
            {buy.busy ? "Redirecting…" : "Buy now"}
          </button>
        </div>
      )}

      {(buy.error || restore.error) && (
        <div style={css("font-size:12px;color:var(--om-coral);margin-top:var(--space-3);")}>{buy.error || restore.error}</div>
      )}

      {!userEmail && (
        <div style={css("font-size:12px;opacity:0.5;margin-top:var(--space-3);")}>
          {showRestore ? (
            <button type="button" className="btn btn-ghost" style={css("font-size:12px;padding:0;")} onClick={() => { setShowRestore(false); setRestoreSent(null); }}>
              Back to buy
            </button>
          ) : (
            <>
              Bought this on another device?{" "}
              <button type="button" className="btn btn-ghost" style={css("font-size:12px;padding:0;text-decoration:underline;")} onClick={() => setShowRestore(true)}>
                Restore access by email
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
