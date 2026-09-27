import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import { telegramConfigured } from "@/lib/notify/telegram";
import TestAlertButton from "@/components/admin/TestAlertButton";

export const metadata = { title: "Notifications — Admin", robots: { index: false, follow: false } };

const EVENTS = [
  ["New service booking", "Service, name and preferred date (no email/phone)"],
  ["New comment awaiting moderation", "Which page it's on (not the comment text)"],
  ["New purchase", "Amount and last 8 characters of the reference"],
  ["Payment failed / checkout could not start", "Amount or item, and the reason"],
  ["New newsletter subscriber", "Just that someone subscribed"],
  ["Rejected Paystack webhook", "At most one alert per 10 minutes"],
];

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("notification_log").select("id,event_type,status,error,created_at").order("created_at", { ascending: false }).limit(40)
    : { data: [] };
  const rows = data ?? [];

  return (
    <div style={css("max-width:760px;")}>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Notifications</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-6);")}>
        Instant Telegram alerts. They never include emails, phone numbers, message text, card details or any secret — just enough to know what to open.
        A failed alert never affects the booking, purchase or comment that triggered it.
      </p>

      <div className="card" style={css("padding:var(--space-4);margin-bottom:var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.08em;opacity:0.55;margin-bottom:var(--space-2);")}>TELEGRAM</div>
        <div style={css(`font-family:var(--font-heading);font-size:22px;margin-bottom:var(--space-3);color:${telegramConfigured ? "var(--color-accent)" : "var(--om-coral)"};`)}>
          {telegramConfigured ? "CONNECTED" : "NOT CONNECTED"}
        </div>
        <TestAlertButton configured={telegramConfigured} />
      </div>

      {!telegramConfigured && (
        <div style={css("margin-bottom:var(--space-6);font-size:14px;line-height:1.7;")}>
          <div style={css("font-size:11px;letter-spacing:0.08em;opacity:0.55;margin-bottom:var(--space-2);")}>HOW TO CONNECT</div>
          <ol style={css("margin:0;padding-left:20px;")}>
            <li>In Telegram, message <strong>@BotFather</strong>, send <code>/newbot</code>, and copy the bot token it gives you.</li>
            <li>Open a chat with your new bot and send it any message (a bot can&apos;t message you first).</li>
            <li>Get your chat id (message <strong>@userinfobot</strong>, or open <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> and read <code>chat.id</code>).</li>
            <li>In Vercel → Project → Settings → Environment Variables, add <code>TELEGRAM_BOT_TOKEN</code> and <code>TELEGRAM_CHAT_ID</code> for Production, then redeploy.</li>
          </ol>
          <p style={css("font-size:12px;opacity:0.6;margin:var(--space-2) 0 0;")}>
            The token is a secret: it lives only in server environment variables — never paste it into this site, a page, or a chat.
          </p>
        </div>
      )}

      <div style={css("font-size:11px;letter-spacing:0.08em;opacity:0.55;margin-bottom:var(--space-2);")}>WHAT TRIGGERS AN ALERT</div>
      <table className="table" style={css("width:100%;margin-bottom:var(--space-6);")}>
        <tbody>
          {EVENTS.map(([name, detail]) => (
            <tr key={name}><td style={css("font-size:13px;")}>{name}</td><td style={css("font-size:12px;opacity:0.65;")}>{detail}</td></tr>
          ))}
        </tbody>
      </table>

      <div style={css("font-size:11px;letter-spacing:0.08em;opacity:0.55;margin-bottom:var(--space-2);")}>RECENT ACTIVITY</div>
      {rows.length === 0 ? (
        <p style={css("font-size:13px;opacity:0.6;")}>Nothing logged yet.</p>
      ) : (
        <table className="table table-responsive" style={css("width:100%;")}>
          <thead><tr><th>When</th><th>Event</th><th>Result</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td data-label="When" style={css("font-size:12px;white-space:nowrap;")}>{new Date(r.created_at).toLocaleString()}</td>
                <td data-label="Event" style={css("font-size:12px;")}>{r.event_type}</td>
                <td data-label="Result" style={css("font-size:12px;")}>
                  {r.status.replace("_", " ")}
                  {r.status === "failed" && r.error ? <div style={css("color:var(--om-coral);")}>{r.error}</div> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
