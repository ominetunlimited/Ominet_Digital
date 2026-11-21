import Link from "next/link";
import Image from "next/image";
import SocialLinks from "@/components/SocialLinks";
import WhatsAppButton from "@/components/WhatsAppButton";
import { ResearchFooterLinks } from "@/components/ResearchProfileLinks";
import { getSiteSettings } from "@/lib/site-settings";
import { AMAZON_AUTHOR_URL } from "@/lib/links";
import { isPageOn } from "@/lib/site-pages";

export default async function Footer() {
  const { footer, contact, identity, pages } = await getSiteSettings();
  const on = (k: string) => isPageOn(pages, k);
  const custom = pages.custom.filter((c) => c.enabled);
  const logoUrl = identity.logoUrl;
  return (
    <footer style={{ borderTop: "none", padding: "var(--space-8) var(--space-6) var(--space-6)", background: "var(--om-navy)", color: "#f1eefb" }}>
      <style>{`
        .omd-footer a{color:#d9d3f0;text-decoration:none;}
        .omd-footer a:hover{color:var(--om-cyan);}
      `}</style>
      <div className="omd-footer" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "var(--space-6)", maxWidth: 1200, margin: "0 auto" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--space-3)" }}>
            <Image src={logoUrl || "/images/ominet-digital-logo.svg"} alt="" width={40} height={39} style={{ display: "block", height: 39, width: "auto" }} />
            <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1, letterSpacing: "0.22em", color: "#fff" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>OMINET</span>
              <span style={{ fontSize: 9, letterSpacing: "0.5em", marginTop: 4, color: "#c9c2e6" }}>DIGITAL</span>
            </span>
          </div>
          {footer.blurb && <p style={{ fontSize: 13, opacity: 0.75, maxWidth: "36ch", margin: "0 0 var(--space-4)" }}>{footer.blurb}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <SocialLinks />
            <WhatsAppButton />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", opacity: 0.6, marginBottom: "var(--space-3)" }}>OMINET DIGITAL</div>
          <div style={{ display: "grid", gap: "var(--space-2)", fontSize: 13 }}>
            {on("omini-nfawa") && <Link href="/omini-nfawa">Overview</Link>}
            {on("blog") && <Link href="/blog">Blog</Link>}
            {on("writing") && <Link href="/articles">Articles</Link>}
            {on("books") && <Link href="/books">Books</Link>}
            <a href={AMAZON_AUTHOR_URL} target="_blank" rel="noopener noreferrer">Amazon author page</a>
            {on("media") && <Link href="/media">Media</Link>}
            {on("services") && <Link href="/services">Services</Link>}
            <Link href="/discuss-a-project">Discuss a project</Link>
            {on("about") && <Link href="/about">About</Link>}
          </div>
        </div>
        <ResearchFooterLinks />
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", opacity: 0.6, marginBottom: "var(--space-3)" }}>ECOSYSTEM</div>
          <div style={{ display: "grid", gap: "var(--space-2)", fontSize: 13 }}>
            {on("profile") && <Link href="/profile">PROFILE</Link>}
            {on("cortexa-office") && <Link href="/cortexa-office">Cortexa Office</Link>}
            {on("store") && <Link href="/store">Store</Link>}
            {on("ominet-digital") && <Link href="/ominet-digital">Studio &amp; services</Link>}
            {custom.map((c) => (
              <Link key={c.id} href={c.href} {...(c.href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{c.label}</Link>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", opacity: 0.6, marginBottom: "var(--space-3)" }}>MORE</div>
          <div style={{ display: "grid", gap: "var(--space-2)", fontSize: 13 }}>
            {on("search") && <Link href="/search">Search</Link>}
            <Link href="/omini-nfawa#newsletter">Newsletter</Link>
            <Link href="/contact">Contact</Link>
            <WhatsAppButton label="WhatsApp" />
            <a href="https://selar.com/showlove/ominet" target="_blank" rel="noopener noreferrer">Support on Selar</a>
            {footer.privacyUrl && <a href={footer.privacyUrl}>Privacy policy</a>}
            {footer.termsUrl && <a href={footer.termsUrl}>Terms</a>}
            <Link href="/cookies">Cookies and ads</Link>
          </div>
        </div>
      </div>
      <div className="hr" style={{ maxWidth: 1200, margin: "var(--space-6) auto", background: "rgba(255,255,255,0.15)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)", maxWidth: 1200, margin: "0 auto", fontSize: 12, opacity: 0.6 }}>
        <span>&copy; {new Date().getFullYear()} {footer.copyrightName}. All rights reserved.</span>
        <span>Creative Solutions. Professional Excellence.</span>
      </div>
    </footer>
  );
}
