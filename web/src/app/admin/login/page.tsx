"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { css } from "@/lib/css";
import { signInWithPassword } from "@/lib/admin/actions";
import { supabaseConfigured } from "@/lib/supabase/env";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const notStaff = searchParams.get("error") === "not_staff";

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await signInWithPassword(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(searchParams.get("next") || "/admin");
    router.refresh();
  }

  return (
    <div style={css("min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--om-navy);padding:var(--space-6);")}>
      <div className="card" style={css("max-width:360px;width:100%;padding:var(--space-8);background:var(--color-surface);")}>
        <div style={css("font-family:var(--font-heading);font-size:22px;margin-bottom:var(--space-1);")}>OMINET DIGITAL</div>
        <div style={css("font-size:13px;opacity:0.6;margin-bottom:var(--space-6);")}>Admin sign in</div>

        {!supabaseConfigured && (
          <p style={css("font-size:13px;color:var(--om-coral);margin-bottom:var(--space-4);")}>
            Supabase isn&apos;t configured yet — set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </p>
        )}
        {notStaff && (
          <p style={css("font-size:13px;color:var(--om-coral);margin-bottom:var(--space-4);")}>
            That account isn&apos;t set up as an admin. Ask a super admin to grant access.
          </p>
        )}

        <div className="field" style={css("margin-bottom:var(--space-4);")}>
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field" style={css("margin-bottom:var(--space-4);")}>
          <label>Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        {error && <p style={css("font-size:13px;color:var(--om-coral);margin-bottom:var(--space-3);")}>{error}</p>}
        <button type="button" className="btn btn-primary btn-block" onClick={submit} disabled={busy || !email || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
