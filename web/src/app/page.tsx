import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import { css } from "@/lib/css";

export default function Home() {
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;")}>
      <Nav />

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-teal-light);")}>
        <div style={css("max-width:1280px;margin:0 auto;border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-lg);display:flex;flex-wrap:wrap;min-height:520px;")}>
          <div style={css("flex:1 1 380px;background:var(--om-navy);color:#eafaf0;padding:var(--space-8);display:flex;flex-direction:column;justify-content:center;gap:var(--space-4);")}>
            <div style={css("font-family:var(--font-heading);font-size:13px;letter-spacing:0.14em;color:var(--om-orange);font-weight:800;")}>OMINET DIGITAL</div>
            <h1 style={css("font-family:var(--font-heading);font-size:clamp(38px,5vw,56px);line-height:1.05;margin:0;color:#fff;")}>Ideas. Stories.<br />Creative Work.</h1>
            <p style={css("font-size:16px;line-height:1.6;opacity:0.85;max-width:40ch;margin:0;")}>A digital ecosystem for publishing, professional identity and technology &mdash; built by Omini Nfawa.</p>
            <div style={css("display:flex;gap:var(--space-2);margin-top:var(--space-2);")}>
              <input type="text" className="input" placeholder="Search the ecosystem" style={css("flex:1;border-radius:var(--radius-md);border:none;")} />
              <button type="button" className="btn btn-primary" style={css("border-radius:var(--radius-md);")} aria-label="Search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
            <div style={css("display:flex;gap:var(--space-3);margin-top:var(--space-2);opacity:0.8;")}>
              <span>Facebook</span><span>X</span><span>Instagram</span>
            </div>
          </div>
          <div style={css("flex:1 1 380px;position:relative;")}>
            <PlaceholderImage label="Hero photograph (color)" />
          </div>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>THE ECOSYSTEM</div>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-6);")}>
          <Link href="/omini-nfawa" style={css("grid-column:span 2;border:2px solid var(--color-divider);border-radius:var(--radius-md);padding:var(--space-6);display:block;background:var(--color-surface);box-shadow:var(--shadow-sm);")}>
            <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-2);")}>WRITER &middot; RESEARCHER &middot; CREATIVE</div>
            <div style={css("font-family:var(--font-heading);font-size:30px;margin-bottom:var(--space-2);")}>Omini Nfawa</div>
            <p style={css("font-size:15px;opacity:0.7;max-width:52ch;margin:0 0 var(--space-3);")}>Books, essays, fiction, research, film and photography from the ecosystem&apos;s founder.</p>
            <span style={css("text-decoration:underline;")}>Explore Omini Nfawa &rarr;</span>
          </Link>
          <Link href="/profile" style={css("border:2px solid var(--om-navy);border-radius:var(--radius-md);padding:var(--space-6);display:block;background:var(--color-surface);box-shadow:var(--shadow-sm);")}>
            <div style={css("font-family:var(--font-heading);font-size:22px;margin-bottom:var(--space-2);color:var(--om-navy);")}>PROFILE</div>
            <p style={css("font-size:14px;opacity:0.8;margin:0 0 var(--space-3);")}>A professional identity built from verified activity.</p>
            <span style={css("text-decoration:underline;")}>Explore Profile &rarr;</span>
          </Link>
          <Link href="/cortexa-office" style={css("border:2px solid var(--color-divider);border-radius:var(--radius-md);padding:var(--space-6);display:block;background:var(--color-surface);box-shadow:var(--shadow-sm);")}>
            <div style={css("font-family:var(--font-heading);font-size:22px;margin-bottom:var(--space-2);")}>Cortexa Office</div>
            <p style={css("font-size:14px;opacity:0.7;margin:0 0 var(--space-3);")}>An emerging Ominet Digital product and office.</p>
            <span style={css("text-decoration:underline;")}>Learn more &rarr;</span>
          </Link>
          <Link href="/media" style={css("border:2px solid var(--color-divider);border-radius:var(--radius-md);padding:var(--space-6);display:block;background:var(--color-surface);box-shadow:var(--shadow-sm);")}>
            <div style={css("font-family:var(--font-heading);font-size:22px;margin-bottom:var(--space-2);")}>Media</div>
            <p style={css("font-size:14px;opacity:0.7;margin:0 0 var(--space-3);")}>Video, photography and documentary work.</p>
            <span style={css("text-decoration:underline;")}>Watch &amp; view &rarr;</span>
          </Link>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);display:flex;flex-wrap:wrap;gap:var(--space-8);")}>
        <div style={css("aspect-ratio:2/3;flex:1 1 240px;max-width:320px;border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-md);")}>
          <PlaceholderImage label="Book cover" />
        </div>
        <div style={css("flex:2 1 380px;display:flex;flex-direction:column;justify-content:center;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>FEATURED BOOK &middot; OMINI NFAWA</div>
          <h2 style={css("font-family:var(--font-heading);font-size:36px;margin:0 0 var(--space-2);")}>The Long Return</h2>
          <p style={css("font-size:16px;line-height:1.7;opacity:0.75;max-width:52ch;margin:0 0 var(--space-4);")}>A family separated by three borders finds its way back to a single house, one letter at a time.</p>
          <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
            <Link href="/books/the-long-return"><button type="button" className="btn btn-primary">View book</button></Link>
            <Link href="/books/the-long-return">Where to buy &rarr;</Link>
          </div>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-6);")}>
        <div className="card">
          <div className="card-kicker">LATEST WRITING</div>
          <div className="card-title">On Writing as a Second Country</div>
          <p className="card-body">An essay on migration, memory and the languages we write in.</p>
          <div className="card-meta"><span>Sept 2026</span></div>
        </div>
        <div className="card">
          <div className="card-kicker">FEATURED MEDIA</div>
          <div className="card-title">The Long Return &mdash; Trailer</div>
          <p className="card-body">A short film introducing the novel, shot on location.</p>
          <div className="card-meta"><span>6 min</span></div>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-navy);color:#eafaf0;")}>
        <div style={css("max-width:640px;")}>
          <div style={css("font-family:var(--font-heading);font-size:14px;font-weight:800;letter-spacing:0.08em;color:var(--om-orange);margin-bottom:var(--space-3);")}>PROFILE</div>
          <h2 style={css("font-family:var(--font-heading);font-size:32px;margin:0 0 var(--space-3);color:#fff;")}>Your professional identity should be more than a CV.</h2>
          <p style={css("font-size:16px;line-height:1.7;opacity:0.85;margin:0 0 var(--space-4);")}>Activity, verification and attribution &mdash; built into one identity you carry between opportunities.</p>
          <Link href="/profile"><button type="button" className="btn btn-primary" style={css("border-radius:var(--radius-md);")}>Explore Profile</button></Link>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>CORTEXA OFFICE</div>
        <div style={css("display:flex;justify-content:space-between;align-items:center;gap:var(--space-6);flex-wrap:wrap;")}>
          <div style={css("font-family:var(--font-heading);font-size:26px;max-width:44ch;")}>An emerging office and product within Ominet Digital.</div>
          <Link href="/cortexa-office"><button type="button" className="btn btn-secondary">Learn more</button></Link>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);display:flex;justify-content:space-between;align-items:center;gap:var(--space-6);flex-wrap:wrap;")}>
        <div style={css("flex:1 1 260px;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-2);")}>NEWSLETTER</div>
          <div style={css("font-family:var(--font-heading);font-size:24px;")}>News from across the ecosystem, occasionally.</div>
        </div>
        <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;flex:1 1 260px;")}>
          <input type="email" className="input" placeholder="you@email.com" style={css("min-width:200px;flex:1;")} />
          <button type="button" className="btn btn-primary">Subscribe</button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
