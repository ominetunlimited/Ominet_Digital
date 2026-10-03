import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import NewsletterComposer from "@/components/admin/NewsletterComposer";
import { mailgunConfigured } from "@/lib/mailgun";

export const metadata = { title: "Newsletter — Admin", robots: { index: false, follow: false } };

export default async function AdminNewsletterPage() {
  const supabase = await createClient();
  const [{ data: subscriberData }, { data: campaignData }] = supabase
    ? await Promise.all([
        supabase.from("newsletter_subscribers").select("email,status,subscribed_at").order("subscribed_at", { ascending: false }),
        supabase.from("newsletter_campaigns").select("id,subject,status,recipient_count,error,created_at,sent_at").order("created_at", { ascending: false }).limit(20),
      ])
    : [{ data: [] }, { data: [] }];
  const subscribers = subscriberData ?? [];
  const campaigns = campaignData ?? [];
  const activeCount = subscribers.filter((s) => s.status === "subscribed").length;

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Newsletter</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-6);")}>
        {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"} ({activeCount} active). Sent via Mailgun as info@ominetdigital.com.ng.
      </p>

      {!mailgunConfigured && (
        <p style={css("font-size:13px;background:rgba(255,111,97,0.1);color:var(--om-coral);padding:var(--space-3);border-radius:var(--radius-md);margin-bottom:var(--space-6);max-width:720px;")}>
          Mailgun isn&apos;t configured yet — set MAILGUN_API_KEY and MAILGUN_DOMAIN (Vercel environment variables, then redeploy) before sending.
        </p>
      )}

      <NewsletterComposer subscriberCount={activeCount} />

      {campaigns.length > 0 && (
        <>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>SENT CAMPAIGNS</div>
          <table className="table table-responsive" style={css("width:100%;max-width:720px;margin-bottom:var(--space-8);")}>
            <thead><tr><th>Subject</th><th>Status</th><th>Recipients</th><th>Sent</th></tr></thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td data-label="Subject">{c.subject}</td>
                  <td data-label="Status">
                    {c.status}
                    {c.status === "failed" && c.error && <div style={css("font-size:11px;color:var(--om-coral);")}>{c.error}</div>}
                  </td>
                  <td data-label="Recipients">{c.recipient_count}</td>
                  <td data-label="Sent">{c.sent_at ? new Date(c.sent_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>SUBSCRIBERS</div>
      {subscribers.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>No subscribers yet.</p>
      ) : (
        <table className="table table-responsive" style={css("width:100%;max-width:480px;")}>
          <thead><tr><th>Email</th><th>Status</th><th>Subscribed</th></tr></thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.email}>
                <td data-label="Email">{s.email}</td>
                <td data-label="Status">{s.status}</td>
                <td data-label="Subscribed">{new Date(s.subscribed_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
