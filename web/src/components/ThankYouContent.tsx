"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { css } from "@/lib/css";
import { OFFICIAL_EMAIL, OFFICIAL_WHATSAPP_DISPLAY, whatsappLink } from "@/lib/links";
import { parseEnquiryReceipt, readRawEnquiryReceipt } from "@/lib/enquiry-receipt";

const noop = () => () => {};

/** Shows the enquiry reference only when this tab just submitted one. No analytics event is sent from here. */
export default function ThankYouContent() {
  // "__server__" marks the server render and the first client render, so both match.
  const raw = useSyncExternalStore(noop, readRawEnquiryReceipt, () => "__server__");
  const receipt = raw === "__server__" ? null : parseEnquiryReceipt(raw);

  return (
    <section style={css("padding:var(--space-8) var(--space-6);max-width:720px;margin:0 auto;")}>
      {receipt ? (
        <div role="status">
          <h1 style={css("font-family:var(--font-heading);font-size:clamp(30px,5vw,44px);line-height:1.1;margin:0 0 var(--space-4);")}>Enquiry received</h1>
          <p style={css("font-size:16px;line-height:1.7;margin:0 0 var(--space-3);")}>
            Thank you for considering Ominet Digital. Our team will review your requirements and contact you using the details you provided.
          </p>
          <p style={css("font-size:16px;margin:0 0 var(--space-2);")}>Your reference: <strong>{receipt.reference}</strong></p>
          <p style={css("font-size:14px;opacity:0.7;line-height:1.6;margin:0 0 var(--space-5);")}>
            {receipt.ack
              ? "A confirmation email is on its way. Please check your spam folder if you don't see it."
              : "Keep this reference for any follow-up. If you don't hear from us, message us on WhatsApp or email."}
          </p>
        </div>
      ) : (
        <div>
          <h1 style={css("font-family:var(--font-heading);font-size:clamp(30px,5vw,44px);line-height:1.1;margin:0 0 var(--space-4);")}>Nothing to show here</h1>
          <p style={css("font-size:16px;line-height:1.7;margin:0 0 var(--space-5);")}>
            This page confirms an enquiry once you have sent one from this browser. If you meant to contact us, you can start a project enquiry or reach us directly.
          </p>
        </div>
      )}
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        {!receipt && <Link href="/discuss-a-project" className="btn btn-primary">Discuss a project</Link>}
        <Link href="/" className="btn btn-secondary">Back to home</Link>
        <a className="btn btn-secondary" href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>
        <a className="btn btn-secondary" href={whatsappLink("Hello Ominet Digital.")} target="_blank" rel="noopener noreferrer">WhatsApp: {OFFICIAL_WHATSAPP_DISPLAY}</a>
      </div>
    </section>
  );
}
