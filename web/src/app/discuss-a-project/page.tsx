import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProjectEnquiryForm from "@/components/ProjectEnquiryForm";
import { css } from "@/lib/css";
import { getServices } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { OFFICIAL_EMAIL, OFFICIAL_WHATSAPP_DISPLAY, whatsappLink } from "@/lib/links";

export const generateMetadata = () =>
  pageMetadata(
    "Discuss a Project | Request a Quote",
    "Have a writing, research, publishing, graphic design or multimedia project? Contact Ominet Digital to discuss your requirements and request a professional quotation.",
    "/discuss-a-project"
  );
export const revalidate = 60;

export default async function DiscussProjectPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const [{ service }, services] = await Promise.all([searchParams, getServices()]);
  const list = services.map((s) => ({ id: s.id, slug: s.slug, title: s.title }));
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);")}>
      <Nav />
      <main style={css("padding:var(--space-8) var(--space-6);display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:var(--space-8);align-items:start;")}>
        <div style={css("grid-column:1/-1;max-width:760px;")}>
          <div style={css("font-size:11px;letter-spacing:0.12em;color:var(--om-azure);font-weight:600;margin-bottom:var(--space-3);")}>CREATIVE SOLUTIONS. PROFESSIONAL EXCELLENCE.</div>
          <h1 style={css("font-family:var(--font-heading);font-size:clamp(32px,5vw,52px);line-height:1.1;margin:0 0 var(--space-4);")}>Let&apos;s Discuss Your Project</h1>
          <p style={css("font-size:18px;margin:0 0 var(--space-3);font-family:var(--font-heading);")}>Every worthwhile project begins with a conversation.</p>
          <p style={css("font-size:16px;line-height:1.7;opacity:0.8;margin:0 0 var(--space-3);")}>
            Whether you need professional writing, research support, book production, graphic design, photography, video editing or a complete creative solution, tell us what you are working on.
          </p>
          <p style={css("font-size:16px;line-height:1.7;opacity:0.8;margin:0;")}>
            Share the details of your project below. We will review your request and get back to you with the next steps, including the proposed scope, quotation and delivery arrangements.
          </p>
        </div>
        <div style={css("grid-column:1/-1;display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
          <a className="btn btn-secondary" href={`mailto:${OFFICIAL_EMAIL}`}>Email us: {OFFICIAL_EMAIL}</a>
          <a className="btn btn-secondary" href={whatsappLink("Hello Ominet Digital, I would like to discuss a project.")} target="_blank" rel="noopener noreferrer">Chat on WhatsApp: {OFFICIAL_WHATSAPP_DISPLAY}</a>
        </div>
        <div style={css("grid-column:1/-1;")}>
          <ProjectEnquiryForm services={list} preselect={service} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
