import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";

export default function NotFound() {
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <Nav />
      <svg width="280" height="280" viewBox="0 0 280 280" style={css("position:absolute;right:-90px;top:10px;pointer-events:none;")} aria-hidden="true">
        <circle cx="140" cy="140" r="139" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.16" />
      </svg>

      <section style={css("padding:var(--space-8) var(--space-6);text-align:center;")}>
        <div style={css("font-family:var(--font-heading);font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>404</div>
        <h1 style={css("font-family:var(--font-heading);font-size:48px;margin:0 0 var(--space-3);")}>This page doesn&rsquo;t exist.</h1>
        <p style={css("font-size:16px;opacity:0.65;margin:0 0 var(--space-4);")}>It may have moved during the migration from the old site, or never existed at this address.</p>
        <Link href="/"><button type="button" className="btn btn-primary">Back to home</button></Link>
      </section>

      <div className="hr" />
      <Footer />
    </div>
  );
}
