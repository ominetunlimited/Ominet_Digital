"use client";

import { useRef, useState } from "react";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/client";
import {
  requestBookFileUpload,
  confirmBookFile,
  removeBookFile,
  getBookFileTestUrl,
  extractBookFileCover,
  type BookFileRecord,
} from "@/lib/admin/book-file-actions";

const MAX = 70 * 1024 * 1024;

function fmtSize(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

export default function BookFilesPanel({
  bookId,
  initialFiles,
  onUsePageCount,
  onUseCover,
}: {
  bookId: string;
  initialFiles: BookFileRecord[];
  onUsePageCount: (pages: number, source: string) => void;
  onUseCover: (url: string) => void;
}) {
  const [extracting, setExtracting] = useState<string | null>(null);
  const [files, setFiles] = useState(initialFiles);
  const [stage, setStage] = useState<"" | "preparing" | "uploading" | "checking">("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError("");
    setNote("");
    if (file.size > MAX) return setError("That file is larger than the 70 MB limit.");
    try {
      setStage("preparing");
      const ticket = await requestBookFileUpload(bookId, file.name, file.size);
      if (!ticket.ok) return setError(ticket.error);

      setStage("uploading");
      const supabase = createClient();
      if (!supabase) return setError("Storage isn't configured.");
      const { error: upErr } = await supabase.storage.from("book-files").uploadToSignedUrl(ticket.path, ticket.token, file);
      if (upErr) return setError(`Upload failed: ${upErr.message}`);

      setStage("checking");
      const res = await confirmBookFile(bookId, ticket.path, file.name);
      if (!res.ok) return setError(res.error);
      setFiles((f) => [...f.filter((x) => x.format !== res.file.format), res.file]);
      setNote(`${res.file.format.toUpperCase()} uploaded and checked.`);
    } catch {
      setError("The upload didn't finish. Check your connection and try again.");
    } finally {
      setStage("");
      if (input.current) input.current.value = "";
    }
  }

  async function remove(f: BookFileRecord) {
    if (!confirm(`Remove the ${f.format.toUpperCase()} file "${f.originalName}"? Buyers will no longer be able to get it.`)) return;
    const res = await removeBookFile(f.id);
    if (!res.ok) return setError(res.error);
    setFiles((list) => list.filter((x) => x.id !== f.id));
  }

  async function extractCover(f: BookFileRecord) {
    setError("");
    setNote("");
    setExtracting(f.id);
    try {
      const res = await Promise.race([
        extractBookFileCover(f.id),
        new Promise<{ ok: false; error: string }>((r) => setTimeout(() => r({ ok: false, error: "That took too long. Try again." }), 55000)),
      ]);
      if (!res.ok) return setError(`No cover taken: ${res.error}`);
      onUseCover(res.url);
      setNote("Cover extracted and placed in the Cover image field above. Press Save to keep it; you can replace it any time.");
    } catch {
      setError("The cover couldn't be extracted. Try again.");
    } finally {
      setExtracting(null);
    }
  }

  async function testDownload(f: BookFileRecord) {
    const res = await getBookFileTestUrl(f.id);
    if (!res.ok) return setError(res.error);
    window.location.assign(res.url);
  }

  const busy = stage !== "";
  const label = { preparing: "Preparing…", uploading: "Uploading…", checking: "Checking the file…", "": "" }[stage];

  return (
    <div style={css("margin-bottom:var(--space-6);")}>
      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>BOOK FILES</div>
      <p style={css("font-size:13px;opacity:0.7;margin:0 0 var(--space-3);")}>
        PDF, EPUB, MOBI or DOCX, up to 70 MB each. One file per format; uploading again replaces it. Files are stored privately and are never
        reachable by a public link. Readers get them from the book page — free if the book is set to Free download, or after a verified
        Paystack payment if it is sold here — through links that expire after 60 seconds. Nothing is offered while the book is a draft.
      </p>

      <div style={css("display:grid;gap:var(--space-3);margin-bottom:var(--space-3);")}>
        {files.length === 0 && <div style={css("font-size:13px;opacity:0.6;")}>No files attached yet.</div>}
        {files.map((f) => {
          const d = f.detected;
          return (
            <div key={f.id} className="card" style={css("gap:var(--space-2);")}>
              <div style={css("display:flex;justify-content:space-between;gap:var(--space-2);flex-wrap:wrap;")}>
                <strong>{f.format.toUpperCase()}</strong>
                <span style={css("font-size:13px;opacity:0.7;")}>{f.originalName} · {fmtSize(f.sizeBytes)}</span>
              </div>
              <div style={css("font-size:13px;opacity:0.85;display:grid;gap:2px;")}>
                {d.title && <div>Title in file: {d.title}</div>}
                {d.author && <div>Author in file: {d.author}</div>}
                {d.publisher && <div>Publisher: {d.publisher}</div>}
                {d.isbn && <div>ISBN: {d.isbn}</div>}
                <div>
                  Pages: {d.pageCount !== null ? `${d.pageCount} (${d.pageSource})` : "not determined"} — {d.pageNote}
                </div>
                <div>Embedded cover: {d.hasEmbeddedCover === null ? "unknown" : d.hasEmbeddedCover ? "yes" : "no"}</div>
                {d.notes.map((n, i) => <div key={i} style={css("opacity:0.7;")}>{n}</div>)}
              </div>
              <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
                {d.pageCount !== null && d.pageSource && (
                  <button type="button" className="btn btn-secondary" onClick={() => onUsePageCount(d.pageCount!, d.pageSource!)}>
                    Use {d.pageCount} as page count
                  </button>
                )}
                <button type="button" className="btn btn-secondary" disabled={extracting !== null} onClick={() => extractCover(f)}>
                  {extracting === f.id ? "Extracting…" : f.format === "pdf" ? "Use first page as cover" : "Extract cover"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => testDownload(f)}>Test download</button>
                <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} onClick={() => remove(f)}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>

      <input
        ref={input}
        type="file"
        accept=".pdf,.epub,.mobi,.docx"
        disabled={busy}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }}
      />
      {busy && <p style={css("font-size:13px;margin-top:var(--space-2);")}>{label}</p>}
      {note && <p style={css("font-size:13px;margin-top:var(--space-2);")}>{note}</p>}
      {error && <p style={css("font-size:13px;color:var(--om-coral);margin-top:var(--space-2);")}>{error}</p>}
    </div>
  );
}
