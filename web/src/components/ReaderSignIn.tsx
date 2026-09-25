"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { sendLoginLink } from "@/lib/auth-actions";

/** Compact inline "sign in to react" prompt shared by likes and comments. */
export default function ReaderSignIn({ currentPath, prompt }: { currentPath: string; prompt: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
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

  if (status === "sent") {
    return <span style={css("font-size:12px;opacity:0.7;")}>{message}</span>;
  }

  return (
    <div style={css("display:flex;gap:var(--space-2);align-items:center;flex-wrap:wrap;")}>
      <span style={css("font-size:12px;opacity:0.6;")}>{prompt}</span>
      <input
        type="email"
        className="input"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={css("font-size:12px;padding:4px 8px;min-height:0;width:180px;")}
      />
      <button type="button" className="btn btn-secondary" style={css("font-size:12px;padding:4px 10px;")} onClick={submit} disabled={status === "busy" || !email}>
        Send link
      </button>
      {status === "error" && <span style={css("font-size:12px;color:var(--om-coral);")}>{message}</span>}
    </div>
  );
}
