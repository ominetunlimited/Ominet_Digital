"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { startProductCheckout } from "@/lib/payments/actions";
import { useAsyncAction } from "@/lib/useAsyncAction";

export default function ProductBuyButton({
  productId,
  label,
  variant,
  signedIn,
}: {
  productId: string;
  label: string;
  variant: "primary" | "secondary";
  signedIn: boolean;
}) {
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const { busy, error, run } = useAsyncAction();

  async function handleClick() {
    // Signed-in readers check out immediately; guests get one extra tap to
    // supply an email first — no account required either way.
    if (!signedIn && !showEmail) {
      setShowEmail(true);
      return;
    }
    if (!signedIn && !email) return;
    await run(() => startProductCheckout(productId, email || undefined));
  }

  return (
    <div>
      {showEmail && !signedIn && (
        <input
          type="email"
          className="input"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={css("margin-bottom:var(--space-2);width:100%;")}
        />
      )}
      <button type="button" className={`btn btn-${variant} btn-block`} onClick={handleClick} disabled={busy || (showEmail && !signedIn && !email)}>
        {busy ? "Redirecting…" : showEmail && !signedIn ? "Continue to payment" : label}
      </button>
      {error && <div style={css("font-size:11px;color:var(--om-coral);margin-top:4px;")}>{error}</div>}
    </div>
  );
}
