"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { sendNewsletterTest, sendNewsletterCampaign } from "@/lib/admin/newsletter-actions";
import { useAdminAction } from "@/lib/admin/useAdminAction";

export default function NewsletterComposer({ subscriberCount }: { subscriberCount: number }) {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const test = useAdminAction();
  const send = useAdminAction();
  const [confirmSend, setConfirmSend] = useState(false);

  async function doSend() {
    const result = await send.run(() => sendNewsletterCampaign(subject, html));
    if (result?.ok) {
      setConfirmSend(false);
      setSubject("");
      setHtml("");
      window.location.reload(); // picks up the new row in campaign history below
    }
  }

  return (
    <div style={css("max-width:720px;margin-bottom:var(--space-8);")}>
      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>COMPOSE</div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Subject</label>
        <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's new at Ominet Digital" />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Body</label>
        <RichTextEditor value={html} onChange={setHtml} placeholder="Write the newsletter…" />
      </div>

      {(test.error || send.error) && <p style={css("font-size:13px;color:var(--om-coral);margin-bottom:var(--space-3);")}>{test.error || send.error}</p>}
      {test.saved && <p style={css("font-size:13px;opacity:0.7;margin-bottom:var(--space-3);")}>Test sent — check your inbox.</p>}

      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;align-items:center;")}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={test.busy || !subject.trim() || !html.trim()}
          onClick={() => void test.run(() => sendNewsletterTest(subject, html))}
        >
          {test.busy ? "Sending…" : "Send test to me"}
        </button>

        {!confirmSend ? (
          <button type="button" className="btn btn-primary" disabled={!subject.trim() || !html.trim() || subscriberCount === 0} onClick={() => setConfirmSend(true)}>
            Send to {subscriberCount} subscriber{subscriberCount === 1 ? "" : "s"}
          </button>
        ) : (
          <>
            <span style={css("font-size:13px;opacity:0.75;")}>Send to all {subscriberCount} subscribers now?</span>
            <button type="button" className="btn btn-primary" disabled={send.busy} onClick={doSend}>
              {send.busy ? "Sending…" : "Yes, send"}
            </button>
            <button type="button" className="btn btn-ghost" disabled={send.busy} onClick={() => setConfirmSend(false)}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
