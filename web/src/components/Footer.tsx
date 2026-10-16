import Link from "next/link";
import Image from "next/image";
import SocialLinks from "@/components/SocialLinks";
import WhatsAppButton from "@/components/WhatsAppButton";
import { ResearchFooterLinks } from "@/components/ResearchProfileLinks";
import { getSiteSettings } from "@/lib/site-settings";

export default async function Footer() {
  const { footer, contact, identity } = await getSiteSettings();
  return (
    <footer style={{ borderTop: "none", padding: "var(--space-8) var(--space-6) var(--space-6)", background: "var(--om-navy)", color: "#eafaf0" }}>
      <style>{`
        .omd-footer a{color:#cfe9d5;text-decoration:none;}
        .omd-footer a:hover{color:var(--om-orange);}
      `}</style>
      <div className="omd-footer" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "var(--space-6)", maxWidth: 1200, margin: "0 auto" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, marginBottom: "var(--space-2)", color: "#fff" }}>
            <Image src="/images/ominet-digital-logo-new.svg" alt={identity.siteName} width={30} height={23} style={{ display: "block" }} />
            {identity.siteName.toUpperCase()}
          </div>
          {footer.blurb && <p style={{ fontSize: 13, opacity: 0.75, maxWidth: "36ch", margin: "0 0 var(--space-4)" }}>{footer.blurb}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <SocialLinks />
            <WhatsAppButton />
          </div>
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
        <ResearchFooterLinks />
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
