import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";

export const generateMetadata = () => pageMetadata(
  "Privacy Policy",
  "How Ominet Digital collects, uses, stores, protects and shares personal information.",
  "/privacy"
);

const SECTIONS: { id: string; title: string }[] = [
  { id: "about", title: "1. About this Privacy Policy" },
  { id: "who-we-are", title: "2. Who We Are" },
  { id: "what-we-collect", title: "3. What Information We Collect" },
  { id: "how-we-use", title: "4. How We Use Personal Information" },
  { id: "lawful-bases", title: "5. Lawful Bases for Processing" },
  { id: "minimisation", title: "6. Data Minimisation" },
  { id: "not-collected", title: "7. Information We Do Not Intentionally Collect" },
  { id: "children", title: "8. Children's Privacy" },
  { id: "sharing", title: "9. How We Share Information" },
  { id: "third-party", title: "10. Third-Party Services" },
  { id: "payment", title: "11. Payment Information" },
  { id: "security", title: "12. Data Storage and Security" },
  { id: "retention", title: "13. Data Retention" },
  { id: "transfers", title: "14. International Data Transfers" },
  { id: "rights", title: "15. Your Data Protection Rights" },
  { id: "marketing", title: "16. Direct Marketing" },
  { id: "comments", title: "17. Comments, Reviews and Public Contributions" },
  { id: "social-media", title: "18. Social Media" },
  { id: "links", title: "19. Links to Other Websites" },
  { id: "affiliate", title: "20. Affiliate Links" },
  { id: "advertising", title: "21. Advertising" },
  { id: "analytics", title: "22. Search and Analytics" },
  { id: "by-design", title: "23. Data Protection by Design" },
  { id: "automated", title: "24. Automated Decision-Making" },
  { id: "changes", title: "25. Changes to This Privacy Policy" },
  { id: "contact", title: "26. Questions, Requests and Complaints" },
  { id: "acceptance", title: "27. Acceptance" },
];

const h2 = css("font-family:var(--font-heading);font-size:24px;margin:0 0 var(--space-3);scroll-margin-top:100px;");
const h3 = css("font-family:var(--font-heading);font-size:17px;margin:var(--space-4) 0 var(--space-2);");
const p = css("font-size:15px;line-height:1.75;opacity:0.82;margin:0 0 var(--space-3);max-width:70ch;");
const ul = css("font-size:15px;line-height:1.75;opacity:0.82;margin:0 0 var(--space-3);padding-left:1.3em;max-width:70ch;");
const section = css("padding:var(--space-6) 0;border-bottom:1px solid var(--color-divider);");

const EMAIL = "info@ominetdigital.com.ng";
const SITE = "https://www.ominetdigital.com.ng/";

function Email() {
  return <a href={`mailto:${EMAIL}`}>{EMAIL}</a>;
}
function Site() {
  return <a href={SITE}>www.ominetdigital.com.ng</a>;
}

export default async function PrivacyPage() {
  const { legal } = await getSiteSettings();
  const custom = legal.privacyHtml.trim();

  if (custom) {
    return (
      <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);")}>
        <Nav />
        <section style={css("padding:var(--space-8) var(--space-6) var(--space-4);")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>LEGAL</div>
          <h1 style={css("font-family:var(--font-heading);font-size:clamp(32px,4.5vw,44px);margin:0 0 var(--space-6);")}>Privacy Policy</h1>
          <div className="rte-body" style={css("max-width:70ch;font-size:15px;line-height:1.75;")} dangerouslySetInnerHTML={{ __html: custom }} />
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);")}>
      <Nav />

      <section style={css("padding:var(--space-8) var(--space-6) var(--space-4);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>LEGAL</div>
        <h1 style={css("font-family:var(--font-heading);font-size:clamp(32px,4.5vw,44px);margin:0 0 var(--space-3);")}>Privacy Policy</h1>
        <p style={css("font-size:16px;line-height:1.7;opacity:0.75;max-width:70ch;")}>
          Ominet Digital respects your privacy and is committed to handling personal information responsibly, transparently and securely. This
          Policy explains how we collect, use, store, protect and, where necessary, share personal information when you visit or interact with
          our website, products, services or communications.
        </p>
      </section>

      <div style={css("padding:0 var(--space-6) var(--space-6);display:flex;gap:var(--space-8);flex-wrap:wrap;align-items:flex-start;")}>
        <nav aria-label="Privacy Policy sections" style={css("flex:0 0 220px;position:sticky;top:90px;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-2);")}>ON THIS PAGE</div>
          <ol style={css("list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:13px;")}>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} style={css("opacity:0.75;")}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div style={css("flex:1 1 480px;min-width:0;")}>
          <section id="about" style={section}>
            <h2 style={h2}>1. About this Privacy Policy</h2>
            <p style={p}>
              This Privacy Policy explains how Ominet Digital collects, uses, stores, protects and, where necessary, shares personal information
              when you visit or interact with our website, purchase or access our products, subscribe to our communications, contact us, submit
              information through our forms, engage our services or otherwise interact with Ominet Digital online.
            </p>
            <p style={p}>
              <strong>Ominet Digital</strong> is the name used for the digital, creative, publishing and technology activities operated through:
            </p>
            <p style={p}>
              <strong>Website:</strong> <Site /><br />
              <strong>Email:</strong> <Email />
            </p>
            <p style={p}>
              Where a particular Ominet Digital product, service or platform has its own privacy notice, that notice may apply in addition to this
              Policy. This Policy should be read alongside our Terms of Use, Cookie Policy and any specific notices presented when you submit
              information to us.
            </p>
          </section>

          <section id="who-we-are" style={section}>
            <h2 style={h2}>2. Who We Are</h2>
            <p style={p}>
              For the purposes of applicable data protection law, Ominet Digital may act as a <strong>data controller</strong> where we determine
              why and how personal information is processed. In some circumstances, we may act as a <strong>data processor</strong> on behalf of
              another organisation.
            </p>
            <p style={p}>
              <strong>Data Controller:</strong> Ominet Digital<br />
              <strong>Website:</strong> <Site /><br />
              <strong>Privacy Email:</strong> <Email /><br />
              <strong>Business Address:</strong> Angwan Lemu Junction, Luvu Masaka
            </p>
            <p style={p}>
              Where required, details of our Data Protection Officer or designated privacy contact will be published here: <Email />. Ominet
              Digital will update this section if our legal structure, privacy contact or regulatory status changes.
            </p>
          </section>

          <section id="what-we-collect" style={section}>
            <h2 style={h2}>3. What Information We Collect</h2>
            <p style={p}>Depending on how you interact with Ominet Digital, we may collect different categories of information.</p>
            <h3 style={h3}>3.1 Information you provide directly</h3>
            <p style={p}>This may include:</p>
            <ul style={ul}>
              <li>your name;</li>
              <li>email address;</li>
              <li>telephone number;</li>
              <li>organisation or company name;</li>
              <li>professional role;</li>
              <li>billing or transaction information;</li>
              <li>information contained in messages or enquiries;</li>
              <li>information submitted through contact forms;</li>
              <li>booking or service-request information;</li>
              <li>newsletter subscription information;</li>
              <li>information provided when submitting comments, reviews or other contributions;</li>
              <li>information supplied when purchasing a product or service;</li>
              <li>information you voluntarily provide when communicating with us.</li>
            </ul>
            <p style={p}>
              You are generally free not to provide information requested through our forms. However, some information may be necessary for us to
              provide a particular service, process a transaction or respond to a request.
            </p>
            <h3 style={h3}>3.2 Information collected automatically</h3>
            <p style={p}>
              When you visit our website, certain technical information may be collected automatically, depending on the technologies and
              services active on the website. This may include:
            </p>
            <ul style={ul}>
              <li>IP address;</li>
              <li>browser type and version;</li>
              <li>device type;</li>
              <li>operating system;</li>
              <li>language and general location information;</li>
              <li>pages visited;</li>
              <li>links clicked;</li>
              <li>referring website;</li>
              <li>approximate time and duration of visits;</li>
              <li>interaction with website features;</li>
              <li>technical information relating to website performance and security.</li>
            </ul>
            <p style={p}>We use this information primarily to operate, secure, maintain and improve our website and services.</p>
            <h3 style={h3}>3.3 Cookies and similar technologies</h3>
            <p style={p}>Ominet Digital may use cookies, pixels, local storage and similar technologies for purposes such as:</p>
            <ul style={ul}>
              <li>keeping the website functioning properly;</li>
              <li>remembering preferences;</li>
              <li>understanding how visitors use the website;</li>
              <li>improving performance;</li>
              <li>measuring content engagement;</li>
              <li>supporting security;</li>
              <li>understanding advertising performance, where advertising is enabled.</li>
            </ul>
            <p style={p}>
              Where required by law, non-essential cookies will only be activated after the appropriate consent has been obtained. Our Cookie
              Policy should explain the specific cookies and similar technologies actually deployed on the website.
            </p>
          </section>

          <section id="how-we-use" style={section}>
            <h2 style={h2}>4. How We Use Personal Information</h2>
            <p style={p}>We may process personal information for the following purposes:</p>
            <h3 style={h3}>Website operation</h3>
            <p style={p}>To provide and maintain the website, deliver requested content, operate website features, remember relevant preferences, diagnose technical problems, and maintain website security.</p>
            <h3 style={h3}>Communication</h3>
            <p style={p}>To respond to enquiries, communicate about projects or services, respond to customer or reader questions, send administrative messages, and provide information you have requested.</p>
            <h3 style={h3}>Publishing and editorial activities</h3>
            <p style={p}>
              Where you voluntarily provide information for publication or editorial purposes, we may process that information to publish
              articles, interviews, reviews or other material; attribute contributions; communicate with contributors; manage editorial
              submissions; and maintain appropriate publication records. We will not publish personal information merely because it has been
              submitted to us. Where publication of personal information is contemplated, the relevant circumstances and lawful basis will be
              considered.
            </p>
            <h3 style={h3}>Products and purchases</h3>
            <p style={p}>
              Where Ominet Digital offers books, digital products, creative resources or other products, we may process information necessary to
              process orders, confirm purchases, deliver products, provide downloads, manage customer support, maintain transaction records, and
              prevent fraud or misuse. Where payment is processed by a third-party payment provider, payment credentials such as card numbers,
              CVV codes or PINs should be handled by the payment provider rather than stored directly by Ominet Digital.
            </p>
            <h3 style={h3}>Services and bookings</h3>
            <p style={p}>
              We may process information required to receive service enquiries, prepare proposals, schedule projects, communicate with clients,
              provide creative, digital, research, media or technology services, maintain project records, and manage bookings and appointments.
            </p>
            <h3 style={h3}>Newsletter and subscriptions</h3>
            <p style={p}>
              If you subscribe to an Ominet Digital newsletter, we may use your email address to send the communications you requested. You may
              unsubscribe at any time using the unsubscribe link in the communication or by contacting <Email />.
            </p>
            <h3 style={h3}>Analytics and improvement</h3>
            <p style={p}>We may use aggregated or appropriately protected information to understand which pages are useful, how visitors discover the website, which content receives engagement, how the website performs, and where improvements are needed.</p>
            <h3 style={h3}>Security and fraud prevention</h3>
            <p style={p}>We may process information to detect suspicious activity, prevent abuse, protect our systems, investigate security incidents, enforce our terms, and protect our users, organisation and services.</p>
            <h3 style={h3}>Legal and regulatory obligations</h3>
            <p style={p}>We may process personal information where necessary to comply with applicable laws, regulations, lawful requests, court orders or regulatory requirements.</p>
          </section>

          <section id="lawful-bases" style={section}>
            <h2 style={h2}>5. Lawful Bases for Processing</h2>
            <p style={p}>Where applicable, Ominet Digital will process personal information on a lawful basis recognised by applicable data protection law. Depending on the circumstances, this may include:</p>
            <ul style={ul}>
              <li><strong>Consent</strong>, where you have given consent for a specific purpose;</li>
              <li><strong>Contract</strong>, where processing is necessary to provide a product or service you have requested;</li>
              <li><strong>Legal obligation</strong>, where processing is required by law;</li>
              <li><strong>Legitimate interests</strong>, where processing is necessary for legitimate business, security, operational or editorial purposes and those interests are not overridden by applicable data protection rights;</li>
              <li><strong>Vital interests</strong>, where applicable;</li>
              <li>another lawful basis permitted under applicable law.</li>
            </ul>
            <p style={p}>
              Where we rely on consent, you may withdraw that consent, although withdrawal will not affect processing that was lawfully carried
              out before withdrawal. The Nigeria Data Protection Act requires processing to be founded on a recognised lawful basis and emphasises
              fair, lawful and transparent processing — see the{" "}
              <a href="https://ndpc.gov.ng/" target="_blank" rel="noopener noreferrer">Nigeria Data Protection Commission</a>.
            </p>
          </section>

          <section id="minimisation" style={section}>
            <h2 style={h2}>6. Data Minimisation</h2>
            <p style={p}>
              Ominet Digital aims to collect only information that is reasonably necessary for the purpose for which it is being processed. We do
              not ask visitors to provide personal information simply because it might be useful in the future. Where a form does not require a
              particular field, we will avoid making that field unnecessarily mandatory.
            </p>
          </section>

          <section id="not-collected" style={section}>
            <h2 style={h2}>7. Information We Do Not Intentionally Collect</h2>
            <p style={p}>
              Unless specifically required for a legitimate and lawful purpose, Ominet Digital does not intentionally request or seek highly
              sensitive personal information through ordinary website interactions. You should not submit passwords, payment-card details,
              government identification numbers, financial credentials, medical records or other highly sensitive information through ordinary
              contact forms unless we specifically instruct you to do so through a secure and appropriate channel.
            </p>
          </section>

          <section id="children" style={section}>
            <h2 style={h2}>8. Children&apos;s Privacy</h2>
            <p style={p}>
              Our website is primarily intended for a general audience and is not designed to knowingly collect personal information from children
              for purposes that require parental consent. Where a service specifically involves children, young people, schools, research
              participants or other vulnerable groups, additional privacy and safeguarding requirements may apply. If you believe that a child has
              provided personal information to us in circumstances where it should not have been collected, please contact <Email />.
            </p>
          </section>

          <section id="sharing" style={section}>
            <h2 style={h2}>9. How We Share Information</h2>
            <p style={p}>Ominet Digital does not sell personal information to third parties. We may share personal information where reasonably necessary with:</p>
            <h3 style={h3}>Service providers</h3>
            <p style={p}>We may use trusted third-party providers for services such as website hosting, cloud infrastructure, databases, file and media storage, payment processing, email delivery, newsletter management, analytics, security, communications, customer support, and booking management. These providers should only receive information reasonably necessary for the service they provide.</p>
            <h3 style={h3}>Professional advisers</h3>
            <p style={p}>Where necessary, information may be shared with professional advisers such as lawyers, accountants, auditors or other professional service providers.</p>
            <h3 style={h3}>Legal or regulatory authorities</h3>
            <p style={p}>Information may be disclosed where required or permitted by applicable law, court order, regulatory requirement or lawful governmental request.</p>
            <h3 style={h3}>Business changes</h3>
            <p style={p}>If Ominet Digital undergoes a merger, restructuring, acquisition, sale of assets or similar transaction, personal information may be transferred as part of that transaction, subject to applicable legal requirements and appropriate safeguards.</p>
          </section>

          <section id="third-party" style={section}>
            <h2 style={h2}>10. Third-Party Services</h2>
            <p style={p}>Ominet Digital may integrate third-party services into the website or its products. Depending on which services are actually active, these may include providers for:</p>
            <ul style={ul}>
              <li>hosting and deployment;</li>
              <li>database and storage infrastructure;</li>
              <li>payment processing;</li>
              <li>analytics;</li>
              <li>email;</li>
              <li>newsletters;</li>
              <li>social media;</li>
              <li>video;</li>
              <li>advertising;</li>
              <li>security;</li>
              <li>search;</li>
              <li>communication and notifications.</li>
            </ul>
            <p style={p}>
              Third-party services may process information according to their own privacy policies. The website should maintain an accurate list
              of material third-party services actually connected to production systems rather than listing services that are merely planned for
              future use.
            </p>
          </section>

          <section id="payment" style={section}>
            <h2 style={h2}>11. Payment Information</h2>
            <p style={p}>
              Where Ominet Digital accepts online payments, payments may be processed through a third-party payment provider. Ominet Digital does
              not intend to store full payment-card numbers, card security codes or payment PINs on its own servers. Payment information should be
              submitted through the payment provider&apos;s secure payment environment.
            </p>
            <p style={p}>Transaction information may nevertheless be retained for legitimate purposes such as confirming payment, fulfilling an order, accounting, refunds, customer support, fraud prevention, and legal and regulatory compliance.</p>
          </section>

          <section id="security" style={section}>
            <h2 style={h2}>12. Data Storage and Security</h2>
            <p style={p}>Ominet Digital takes reasonable technical and organisational measures to protect personal information against unauthorised access, unauthorised disclosure, loss, alteration, destruction, misuse, and accidental disclosure.</p>
            <p style={p}>Security measures may include access controls, authentication, encryption where appropriate, secure hosting, system monitoring, backups, restricted administrative access and audit records.</p>
            <p style={p}>No internet transmission or electronic storage system can be guaranteed to be completely secure. We therefore cannot promise absolute security. Where a security incident occurs, Ominet Digital will assess and respond to it in accordance with applicable law and its internal incident-response procedures.</p>
          </section>

          <section id="retention" style={section}>
            <h2 style={h2}>13. Data Retention</h2>
            <p style={p}>We retain personal information only for as long as reasonably necessary for the purpose for which it was collected, unless a longer retention period is required or permitted by law. Retention periods may depend on:</p>
            <ul style={ul}>
              <li>the nature of the information;</li>
              <li>the purpose for which it was collected;</li>
              <li>whether there is an ongoing relationship;</li>
              <li>contractual requirements;</li>
              <li>accounting or financial obligations;</li>
              <li>legal requirements;</li>
              <li>dispute resolution;</li>
              <li>security and fraud prevention.</li>
            </ul>
            <p style={p}>When information is no longer required, we may delete it, anonymise it or securely dispose of it.</p>
          </section>

          <section id="transfers" style={section}>
            <h2 style={h2}>14. International Data Transfers</h2>
            <p style={p}>
              Some service providers used by Ominet Digital may process or store information outside Nigeria. Where personal information is
              transferred across borders, Ominet Digital will take reasonable steps to ensure that the transfer is conducted in accordance with
              applicable data protection requirements and that appropriate safeguards are in place where required. The specific countries and
              safeguards may depend on the third-party services actually connected to the website.
            </p>
          </section>

          <section id="rights" style={section}>
            <h2 style={h2}>15. Your Data Protection Rights</h2>
            <p style={p}>Subject to applicable law and any relevant limitations, you may have rights including:</p>
            <ul style={ul}>
              <li>the right to be informed about how your personal information is processed;</li>
              <li>the right to request access to personal information we hold about you;</li>
              <li>the right to request correction of inaccurate or incomplete information;</li>
              <li>the right to request deletion of personal information in appropriate circumstances;</li>
              <li>the right to request restriction of processing in appropriate circumstances;</li>
              <li>the right to object to certain processing;</li>
              <li>the right to withdraw consent where processing is based on consent;</li>
              <li>the right to data portability where applicable;</li>
              <li>the right to object to direct marketing;</li>
              <li>the right to lodge a complaint with the relevant data protection authority.</li>
            </ul>
            <p style={p}>Not every right applies in every circumstance. Some requests may be subject to lawful exemptions or limitations. To exercise a privacy right, contact <Email />.</p>
            <p style={p}>We may need to verify your identity before fulfilling certain requests. This is intended to protect personal information from being disclosed to someone who is not authorised to receive it.</p>
          </section>

          <section id="marketing" style={section}>
            <h2 style={h2}>16. Direct Marketing</h2>
            <p style={p}>Where you have subscribed to receive newsletters or marketing communications, Ominet Digital may send you relevant information about new books, articles, publications, media, products, services, projects, events, announcements, and other Ominet Digital activities.</p>
            <p style={p}>You can opt out at any time. Every applicable marketing email contains a clear unsubscribe link.</p>
          </section>

          <section id="comments" style={section}>
            <h2 style={h2}>17. Comments, Reviews and Public Contributions</h2>
            <p style={p}>Some areas of the website may allow visitors to submit comments, reviews, feedback or other material. Where such features are available:</p>
            <ul style={ul}>
              <li>information required for moderation or verification may be collected;</li>
              <li>submitted material may be reviewed before publication;</li>
              <li>personal information should not be published unnecessarily;</li>
              <li>abusive, fraudulent or unlawful submissions may be removed;</li>
              <li>comments may be retained as part of the website&apos;s editorial record where appropriate.</li>
            </ul>
            <p style={p}>If a public contribution contains personal information that you believe should not have been published, contact <Email />.</p>
          </section>

          <section id="social-media" style={section}>
            <h2 style={h2}>18. Social Media</h2>
            <p style={p}>
              Ominet Digital may maintain accounts or pages on third-party social media platforms. Interactions with those platforms are governed
              by the privacy policies of the relevant platform providers. If you interact with Ominet Digital through social media, the platform
              may collect information about that interaction independently of Ominet Digital.
            </p>
          </section>

          <section id="links" style={section}>
            <h2 style={h2}>19. Links to Other Websites</h2>
            <p style={p}>The Ominet Digital website may contain links to external websites, including book retailers, publishing platforms, payment providers, research platforms, social media platforms, partner organisations, affiliate websites, and other third-party services.</p>
            <p style={p}>Ominet Digital is not responsible for the privacy practices, security or content of external websites. You should review the privacy policy of any external website before providing personal information.</p>
          </section>

          <section id="affiliate" style={section}>
            <h2 style={h2}>20. Affiliate Links</h2>
            <p style={p}>
              Ominet Digital may occasionally participate in affiliate programmes. Where an affiliate relationship exists, clicking a link may
              allow the relevant third party or affiliate network to identify that a visitor came through our website. Affiliate arrangements do
              not give Ominet Digital access to your private payment credentials held by the retailer or payment provider. Where appropriate,
              affiliate relationships will be disclosed alongside relevant content.
            </p>
          </section>

          <section id="advertising" style={section}>
            <h2 style={h2}>21. Advertising</h2>
            <p style={p}>
              Ominet Digital may display advertising from third-party advertising providers or direct commercial partners. Advertising
              technologies may use cookies or similar technologies to measure advertising performance or provide relevant advertising, subject to
              applicable law and the choices available to users. The website clearly distinguishes advertising from editorial content. Where
              advertising involves third-party tracking technologies, those technologies are documented in the Cookie Policy and managed through
              the website&apos;s consent mechanism where required.
            </p>
          </section>

          <section id="analytics" style={section}>
            <h2 style={h2}>22. Search and Analytics</h2>
            <p style={p}>
              Ominet Digital may use website analytics and search tools to understand how visitors use the website and to improve the discovery
              of content. Analytics information may include technical and behavioural information such as pages visited, approximate location,
              device type, traffic source and interactions. Where a third-party analytics provider is used, its processing is also subject to
              that provider&apos;s terms and privacy practices.
            </p>
          </section>

          <section id="by-design" style={section}>
            <h2 style={h2}>23. Data Protection by Design</h2>
            <p style={p}>Ominet Digital aims to incorporate privacy and data protection into the design of its systems and services rather than treating privacy as an afterthought. This includes:</p>
            <ul style={ul}>
              <li>collecting only necessary information;</li>
              <li>limiting access to personal information;</li>
              <li>protecting administrative systems;</li>
              <li>using appropriate security controls;</li>
              <li>separating public content from private administrative information;</li>
              <li>avoiding unnecessary storage of sensitive information;</li>
              <li>providing appropriate privacy information at the point of collection.</li>
            </ul>
            <p style={p}>
              The NDPC&apos;s current guidance specifically emphasises privacy by design and by default — see the{" "}
              <a href="https://ndpc.gov.ng/" target="_blank" rel="noopener noreferrer">Nigeria Data Protection Commission</a>.
            </p>
          </section>

          <section id="automated" style={section}>
            <h2 style={h2}>24. Automated Decision-Making</h2>
            <p style={p}>
              Ominet Digital does not intend to make decisions producing significant legal or similarly significant effects about individuals
              solely through automated processing unless appropriate safeguards and legal requirements are satisfied. Where automated tools are
              used for ordinary website functions, analytics, search, recommendations or content organisation, they are not represented as making
              significant decisions about users unless that functionality actually exists.
            </p>
          </section>

          <section id="changes" style={section}>
            <h2 style={h2}>25. Changes to This Privacy Policy</h2>
            <p style={p}>Ominet Digital may update this Privacy Policy from time to time to reflect changes to our services, technology, applicable law, third-party services, or data processing practices. When we make material changes, we will update the Last Updated date and, where appropriate, provide additional notice.</p>
            <p style={p}>The current version is always available at <Site />.</p>
          </section>

          <section id="contact" style={section}>
            <h2 style={h2}>26. Questions, Requests and Complaints</h2>
            <p style={p}>
              If you have a question, concern or request relating to your personal information or this Privacy Policy, contact:
            </p>
            <p style={p}>
              <strong>Ominet Digital</strong><br />
              <strong>Email:</strong> <Email /><br />
              <strong>Website:</strong> <Site /><br />
              <strong>Address:</strong> Angwan Lemu Junction, Luvu Masaka
            </p>
            <p style={p}>Please include enough information for us to understand your request and, where applicable, identify the information concerned.</p>
            <p style={p}>
              If you are dissatisfied with how your privacy concern has been handled, you may also have the right to contact the{" "}
              <a href="https://ndpc.gov.ng/" target="_blank" rel="noopener noreferrer">Nigeria Data Protection Commission (NDPC)</a> or another
              competent regulatory authority.
            </p>
          </section>

          <section id="acceptance" style={css("padding:var(--space-6) 0;")}>
            <h2 style={h2}>27. Acceptance</h2>
            <p style={p}>By using the Ominet Digital website, you acknowledge that you have had an opportunity to read this Privacy Policy. Where applicable law requires consent for a particular processing activity, we will seek that consent separately rather than treating mere use of the website as blanket consent.</p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
