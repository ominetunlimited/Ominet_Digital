"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <Nav />
      <section style={css("padding:var(--space-8) var(--space-6);text-align:center;")}>
        <div style={css("font-family:var(--font-heading);font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>ERROR</div>
        <h1 style={css("font-family:var(--font-heading);font-size:32px;margin:0 0 var(--space-3);")}>Something went wrong.</h1>
        <p style={css("font-size:15px;opacity:0.65;margin:0 0 var(--space-4);")}>The page could not be loaded. No changes were made.</p>
        <button type="button" className="btn btn-secondary" onClick={() => reset()}>Try again</button>
      </section>
      <div className="hr" />
      <Footer />
    </div>
  );
}
