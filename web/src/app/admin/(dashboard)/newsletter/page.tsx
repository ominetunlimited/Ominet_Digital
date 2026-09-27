import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Newsletter — Admin", robots: { index: false, follow: false } };

export default async function AdminNewsletterPage() {
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("newsletter_subscribers").select("email,status,subscribed_at").order("subscribed_at", { ascending: false })
    : { data: [] };
  const subscribers = data ?? [];

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Newsletter</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-6);")}>
        {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"}. Sending campaigns needs an email
        provider (Resend, Mailgun, etc.) wired up next — this list is ready to export or connect once you pick one.
      </p>

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
