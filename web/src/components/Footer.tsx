import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";

export default function Footer() {
  return (
    <footer style={{ borderTop: "none", padding: "var(--space-8) var(--space-6) var(--space-6)", background: "var(--om-navy)", color: "#eafaf0" }}>
      <style>{`
        .omd-footer a{color:#cfe9d5;text-decoration:none;}
        .omd-footer a:hover{color:var(--om-orange);}
      `}</style>
      <div className="omd-footer" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "var(--space-6)", maxWidth: 1200, margin: "0 auto" }}>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, marginBottom: "var(--space-2)", color: "#fff" }}>OMINET DIGITAL</div>
          <p style={{ fontSize: 13, opacity: 0.75, maxWidth: "36ch", margin: "0 0 var(--space-4)" }}>A digital ecosystem for publishing, creativity, professional identity and technology, founded by Omini Nfawa.</p>
          <SocialLinks />
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", opacity: 0.6, marginBottom: "var(--space-3)" }}>OMINI NFAWA</div>
          <div style={{ display: "grid", gap: "var(--space-2)", fontSize: 13 }}>
            <Link href="/omini-nfawa">Overview</Link>
            <Link href="/writing">Writing</Link>
            <Link href="/books">Books</Link>
            <Link href="/media">Media</Link>
            <Link href="/about">About</Link>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", opacity: 0.6, marginBottom: "var(--space-3)" }}>ECOSYSTEM</div>
          <div style={{ display: "grid", gap: "var(--space-2)", fontSize: 13 }}>
            <Link href="/profile">PROFILE</Link>
            <Link href="/cortexa-office">Cortexa Office</Link>
            <Link href="/store">Store</Link>
            <Link href="/ominet-digital">Studio &amp; services</Link>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", opacity: 0.6, marginBottom: "var(--space-3)" }}>MORE</div>
          <div style={{ display: "grid", gap: "var(--space-2)", fontSize: 13 }}>
            <Link href="/search">Search</Link>
            <a href="#">Newsletter</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </div>
      <div className="hr" style={{ maxWidth: 1200, margin: "var(--space-6) auto", background: "rgba(255,255,255,0.15)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)", maxWidth: 1200, margin: "0 auto", fontSize: 12, opacity: 0.6 }}>
        <span>&copy; 2026 Ominet Digital. All rights reserved.</span>
        <span>Omini Nfawa &middot; PROFILE &middot; Cortexa Office</span>
      </div>
    </footer>
  );
}
