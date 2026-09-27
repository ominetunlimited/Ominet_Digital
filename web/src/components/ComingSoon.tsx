import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";

/**
 * What an ecosystem page (PROFILE, Cortexa Office) shows while its
 * Admin -> Site settings -> Ecosystem pages toggle is off — no real content,
 * just an honest placeholder. The page still resolves at its URL (nothing
 * here is access-controlled); it's kept out of the nav/footer and out of
 * search engines by the caller instead (see generateMetadata + Nav/Footer).
 */
export default function ComingSoon({ label, message }: { label: string; message: string }) {
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);")}>
      <Nav />
      <section style={css("padding:var(--space-8) var(--space-6);min-height:50vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>{label}</div>
        <h1 style={css("font-family:var(--font-heading);font-size:clamp(28px,4vw,40px);margin:0 0 var(--space-3);")}>Coming soon.</h1>
        <p style={css("font-size:16px;opacity:0.7;max-width:48ch;margin:0;")}>{message}</p>
      </section>
      <Footer />
    </div>
  );
}
