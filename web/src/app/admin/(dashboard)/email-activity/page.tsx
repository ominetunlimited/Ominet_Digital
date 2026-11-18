import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import RetryEmailButton from "@/components/admin/RetryEmailButton";

export const metadata = { title: "Email activity — Admin", robots: { index: false, follow: false } };

const NOTE: Record<string, string> = {
  accepted: "Accepted by Mailgun (not a delivery confirmation)",
  failed: "Failed",
  not_configured: "Not sent: Mailgun is not configured",
};

export default async function EmailActivityPage() {
  const supabase = await createClient();
  const { data } = (await supabase?.from("email_log").select("id,kind,recipient,subject,status,error,created_at,booking_id").order("created_at", { ascending: false }).limit(200)) ?? { data: [] };
  const rows = data ?? [];
  return (
    <div>
      <h1 style={css("margin:0 0 var(--space-2);")}>Email activity</h1>
      <p style={css("opacity:0.7;max-width:60ch;")}>Every client email sent from the quotation and booking workflow. &ldquo;Accepted&rdquo; means Mailgun took the message; delivery events need the Mailgun webhook, which is not connected yet.</p>
      {rows.length === 0 ? <p>No emails recorded yet.</p> : (
        <div style={css("overflow-x:auto;")}>
          <table style={css("width:100%;border-collapse:collapse;font-size:13px;")}>
            <thead><tr style={css("text-align:left;")}><th>When</th><th>Type</th><th>To</th><th>Subject</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={css("border-top:1px solid var(--color-divider);vertical-align:top;")}>
                  <td style={css("padding:8px 6px;white-space:nowrap;")}>{new Date(r.created_at).toLocaleString()}</td>
                  <td>{String(r.kind).replace(/_/g, " ")}</td>
                  <td>{r.recipient}</td>
                  <td>{r.subject}</td>
                  <td>{NOTE[r.status] ?? r.status}{r.error ? `: ${r.error}` : ""}</td>
                  <td>{r.status !== "accepted" && <RetryEmailButton logId={r.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
