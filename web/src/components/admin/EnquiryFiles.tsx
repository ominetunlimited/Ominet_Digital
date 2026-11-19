"use client";

import { useAdminAction } from "@/lib/admin/useAdminAction";
import { getEnquiryFileUrl } from "@/lib/admin/enquiry-file-actions";
import { prettySize } from "@/lib/enquiry-upload";

export type EnquiryFile = { id: string; name: string; size: number };

export default function EnquiryFiles({ files }: { files: EnquiryFile[] }) {
  const act = useAdminAction();
  if (!files.length) return null;
  return (
    <div>
      <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: "0.08em", marginBottom: 4 }}>FILES FROM THE CLIENT</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4, fontSize: 13 }}>
        {files.map((f) => (
          <li key={f.id}>
            <button type="button" className="btn btn-ghost" style={{ fontSize: 13, padding: "2px 8px" }} disabled={act.busy}
              onClick={async () => { const r = await act.run(() => getEnquiryFileUrl(f.id) as never) as unknown as { ok: boolean; url?: string } | undefined; if (r?.ok && r.url) window.open(r.url, "_blank", "noopener,noreferrer"); }}>
              {f.name} <span style={{ opacity: 0.6 }}>({prettySize(f.size)})</span>
            </button>
          </li>
        ))}
      </ul>
      {act.error && <div role="alert" style={{ fontSize: 12, color: "var(--om-coral)" }}>{act.error}</div>}
    </div>
  );
}
