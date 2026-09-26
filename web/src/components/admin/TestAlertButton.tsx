"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { sendTestAlert } from "@/lib/admin/notification-actions";
import { useAdminAction } from "@/lib/admin/useAdminAction";

export default function TestAlertButton({ configured }: { configured: boolean }) {
  const { busy, run } = useAdminAction();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    setMessage(null);
    const result = await run(() => sendTestAlert());
    if (!result) {
      setMessage({ ok: false, text: "That took too long — try again." });
      return;
    }
    setMessage(result.ok ? { ok: true, text: result.message } : { ok: false, text: result.error });
  }

  return (
    <div>
      <button type="button" className="btn btn-secondary" onClick={send} disabled={busy || !configured}>
        {busy ? "Sending…" : "Send a test alert"}
      </button>
      {message && (
        <p role="status" style={css(`font-size:13px;margin:var(--space-2) 0 0;color:${message.ok ? "var(--color-accent)" : "var(--om-coral)"};`)}>
          {message.text}
        </p>
      )}
    </div>
  );
}
