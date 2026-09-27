"use client";

import { useRef, useState } from "react";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/client";
import {
  requestContentFileUpload,
  confirmContentFile,
  removeContentFile,
  getContentFileTestUrl,
} from "@/lib/admin/content-file-actions";

const MAX = 25 * 1024 * 1024;

export type ContentAttachment = { format: "pdf" | "docx"; originalName: string; sizeBytes: number };

function fmtSize(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

export default function ContentFilePanel({
  contentId,
  ensureContent,
  initialAttachment,
}: {
  contentId: string | null;
  /** Called when a file is chosen before the article exists: saves a private draft and returns its id. */
  ensureContent: () => Promise<string | null>;
  initialAttachment: ContentAttachment | null;
}) {
  const [attachment, setAttachment] = useState(initialAttachment);
  const [stage, setStage] = useState<"" | "preparing" | "uploading" | "checking">("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError("");
    setNote("");
    if (file.size > MAX) return setError("That file is larger than the 25 MB limit.");
    try {
      setStage("preparing");
      const id = contentId ?? (await ensureContent());
      if (!id) return setError("Add the article's title first — the file is attached to it, so choosing a file saves it as a private draft.");
      const ticket = await requestContentFileUpload(id, file.name, file.size);
      if (!ticket.ok) return setError(ticket.error);

      setStage("uploading");
      const supabase = createClient();
      if (!supabase) return setError("Storage isn't configured.");
      const { error: upErr } = await supabase.storage.from("content-files").uploadToSignedUrl(ticket.path, ticket.token, file);
      if (upErr) return setError(`Upload failed: ${upErr.message}`);

      setStage("checking");
      const res = await confirmContentFile(id, ticket.path, file.name);
      if (!res.ok) return setError(res.error);
      setAttachment({ format: res.format, originalName: res.originalName, sizeBytes: res.sizeBytes });
      setNote(`${res.format.toUpperCase()} uploaded and checked.`);
    } catch {
      setError("The upload didn't finish. Check your connection and try again.");
    } finally {
      setStage("");
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    if (!contentId || !attachment) return;
    if (!confirm(`Remove the ${attachment.format.toUpperCase()} file "${attachment.originalName}"? Readers will no longer be able to download it.`)) return;
    const res = await removeContentFile(contentId);
    if (!res.ok) return setError(res.error);
    setAttachment(null);
  }

  async function testDownload() {
    if (!contentId) return;
    const res = await getContentFileTestUrl(contentId);
    if (!res.ok) return setError(res.error);
    window.location.assign(res.url);
  }

  const busy = stage !== "";
  const label = { preparing: "Preparing…", uploading: "Uploading…", checking: "Checking the file…", "": "" }[stage];

  return (
    <div style={css("margin-bottom:var(--space-6);")}>
      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>DOWNLOADABLE FILE</div>
      <p style={css("font-size:13px;opacity:0.7;margin:0 0 var(--space-3);")}>
        Optional. Attach a PDF or DOCX (up to 25 MB) so readers can download the piece instead of — or alongside — reading it on the page.
        The file is stored privately and is never reachable by a public link. Readers get it through a link that expires after 60 seconds,
        free if the article is set to Free, or after unlocking it if it&rsquo;s paid. Nothing is offered while the article is a draft.
      </p>

      {attachment ? (
        <div className="card" style={css("gap:var(--space-2);margin-bottom:var(--space-3);")}>
          <div style={css("display:flex;justify-content:space-between;gap:var(--space-2);flex-wrap:wrap;")}>
            <strong>{attachment.format.toUpperCase()}</strong>
            <span style={css("font-size:13px;opacity:0.7;")}>{attachment.originalName} · {fmtSize(attachment.sizeBytes)}</span>
          </div>
          <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
            <button type="button" className="btn btn-secondary" onClick={() => void testDownload()}>Test download</button>
            <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} onClick={() => void remove()}>Remove</button>
          </div>
        </div>
      ) : (
        <div style={css("font-size:13px;opacity:0.6;margin-bottom:var(--space-3);")}>
          No file attached yet.{contentId ? "" : " You can choose one now — the article is saved as a private draft so the file can be attached to it."}
        </div>
      )}

      <input
        ref={input}
        type="file"
        accept=".pdf,.docx"
        disabled={busy}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }}
      />
      {busy && <p style={css("font-size:13px;margin-top:var(--space-2);")}>{label}</p>}
      {note && <p style={css("font-size:13px;margin-top:var(--space-2);")}>{note}</p>}
      {error && <p style={css("font-size:13px;color:var(--om-coral);margin-top:var(--space-2);")}>{error}</p>}
    </div>
  );
}
