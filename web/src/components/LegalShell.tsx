import type { ReactNode } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";

/** Shared frame for plain trust pages (Terms, Cookies, Contact). */
export default function LegalShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:clip;")}>
      <Nav />
      <main id="main" style={css("padding:var(--space-8) var(--space-6);max-width:820px;")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>{eyebrow}</div>
        <h1 style={css("font-family:var(--font-heading);font-size:clamp(34px,5vw,48px);margin:0 0 var(--space-3);")}>{title}</h1>
        {intro && <p style={css("font-size:17px;line-height:1.7;opacity:0.8;margin:0 0 var(--space-6);")}>{intro}</p>}
        <div className="legal-body" style={css("font-size:16px;line-height:1.75;opacity:0.9;")}>{children}</div>
      </main>
      <Footer />
    </div>
  );
}
