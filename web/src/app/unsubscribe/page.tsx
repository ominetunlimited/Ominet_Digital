import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export const generateMetadata = () => pageMetadata("Unsubscribe", "Unsubscribe from the Ominet Digital newsletter.", "/unsubscribe");

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  let message = "That link isn't valid.";
  if (token) {
    const supabase = await createClient();
    if (supabase) {
      // A malformed (non-UUID) token errors out rather than matching
      // anything; a well-formed but unknown or already-used one just
      // returns null — either way, the same message below. Not treated as
      // distinct cases so this page can't be used to probe which
      // addresses are subscribed.
      const { data } = await supabase.rpc("unsubscribe_newsletter", { token });
      message = data ? "You've been unsubscribed. Sorry to see you go." : "You're not currently subscribed (or already unsubscribed).";
    }
  }

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);")}>
      <Nav />
      <section style={css("padding:var(--space-8) var(--space-6);min-height:40vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;")}>
        <h1 style={css("font-family:var(--font-heading);font-size:clamp(28px,4vw,36px);margin:0 0 var(--space-3);")}>{message}</h1>
        <p style={css("font-size:15px;opacity:0.65;")}>You can resubscribe any time from the homepage.</p>
      </section>
      <Footer />
    </div>
  );
}
