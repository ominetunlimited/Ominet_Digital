import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";
import { createClient } from "@/lib/supabase/server";

type StudioItem = { id: string; url: string; kind: string; title: string | null; caption: string | null; attribution: string | null; allow_download: boolean };

async function getStudioGallery(): Promise<StudioItem[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("media_assets")
    .select("id,url,kind,title,caption,attribution,allow_download")
    .eq("show_on_studio", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export const generateMetadata = () => pageMetadata(
  "Studio & Services",
  "Video, photography, graphic design and digital publishing — the studio behind the work.",
  "/ominet-digital"
);

const services = [
  { title: "Video Production", body: "Documentary and short-form." },
  { title: "Photography", body: "Editorial and location work." },
  { title: "Graphic Design", body: "Print and identity systems." },
  { title: "Digital Publishing", body: "Platforms for writers and archives." },
  { title: "Website Development", body: "Editorial and commerce builds." },
  { title: "Creative Direction", body: "Concept through execution." },
];

export default async function OminetDigitalPage() {
  const [{ contact }, gallery] = await Promise.all([getSiteSettings(), getStudioGallery()]);
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);")}>
      <Nav />

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-blue);color:var(--om-mist);position:relative;overflow:hidden;")}>
        <svg width="420" height="420" viewBox="0 0 420 420" style={css("position:absolute;right:-100px;top:-100px;pointer-events:none;")} aria-hidden="true">
          <rect x="1" y="1" width="418" height="418" fill="none" stroke="var(--om-mist)" strokeWidth="1" opacity="0.2" />
          <rect x="60" y="60" width="298" height="298" fill="none" stroke="var(--om-mist)" strokeWidth="1" opacity="0.15" />
        </svg>
        <div style={css("position:relative;max-width:760px;")}>
          <div style={css("font-size:12px;letter-spacing:0.14em;opacity:0.75;margin-bottom:var(--space-3);")}>OMINET DIGITAL</div>
          <h1 style={css("font-family:var(--font-heading);font-size:clamp(36px,5vw,56px);margin:0 0 var(--space-4);")}>The studio behind the work.</h1>
          <p style={css("font-size:18px;line-height:1.6;opacity:0.9;max-width:56ch;margin:0;")}>Video, photography, graphic design and digital publishing &mdash; for Omini&apos;s own projects, and for a small number of clients.</p>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>SERVICES</div>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-4);")}>
          {services.map((s) => (
            <div key={s.title}>
              <div style={css("font-family:var(--font-heading);font-size:18px;margin-bottom:var(--space-1);")}>{s.title}</div>
              <p style={css("font-size:13px;opacity:0.65;margin:0;")}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {gallery.length > 0 && (
        <>
          <div className="hr" />
          <section style={css("padding:var(--space-8) var(--space-6);")}>
            <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>GALLERY</div>
            <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:var(--space-6);")}>
              {gallery.map((g) => (
                <div key={g.id}>
                  <div style={css("aspect-ratio:4/3;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-3);background:var(--color-neutral-100);")}>
                    {g.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.url} alt={g.title ?? ""} loading="lazy" decoding="async" style={css("width:100%;height:100%;object-fit:cover;display:block;")} />
                    ) : g.kind === "video" ? (
                      <video src={g.url} controls controlsList={g.allow_download ? undefined : "nodownload"} style={css("width:100%;height:100%;object-fit:cover;display:block;")} />
                    ) : (
                      <div style={css("width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:var(--space-4);")}>
                        <audio src={g.url} controls controlsList={g.allow_download ? undefined : "nodownload"} style={css("width:100%;")} />
                      </div>
                    )}
                  </div>
                  {g.title && <div style={css("font-family:var(--font-heading);font-size:18px;")}>{g.title}</div>}
                  {g.caption && <p style={css("font-size:13px;opacity:0.7;margin:var(--space-1) 0 0;")}>{g.caption}</p>}
                  <div style={css("display:flex;justify-content:space-between;align-items:center;gap:var(--space-2);margin-top:var(--space-1);")}>
                    {g.attribution && <span style={css("font-size:12px;opacity:0.55;")}>{g.attribution}</span>}
                    {g.allow_download && (
                      <a href={g.url} download className="btn btn-ghost" style={css("font-size:12px;padding:2px 6px;margin-left:auto;")}>Download</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);display:flex;justify-content:space-between;align-items:center;gap:var(--space-6);flex-wrap:wrap;")}>
        <div style={css("flex:1 1 260px;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-2);")}>CONTACT</div>
          <div style={css("font-family:var(--font-heading);font-size:26px;")}>Start a project.</div>
        </div>
        <div style={css("display:flex;gap:var(--space-3);align-items:center;")}>
          <WhatsAppButton color="var(--om-blue)" label="WhatsApp" />
          <a href={`mailto:${contact.supportEmail}?subject=${encodeURIComponent("Starting a project")}`}>
            <button type="button" className="btn btn-secondary" style={css("border-color:var(--om-blue);color:var(--om-blue);")}>Get in touch</button>
          </a>
        </div>
      </section>

      <div className="hr" />
      <Footer />
    </div>
  );
}
