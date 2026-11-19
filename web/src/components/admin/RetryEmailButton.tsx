"use client";

import { useAdminAction } from "@/lib/admin/useAdminAction";
import { retryEmail } from "@/lib/admin/workflow-actions";
import { useRouter } from "next/navigation";

export default function RetryEmailButton({ logId }: { logId: string }) {
  const act = useAdminAction();
  const router = useRouter();
  return (
    <span>
      <button type="button" className="btn btn-secondary" style={{ fontSize: 11, padding: "3px 8px" }} disabled={act.busy}
        onClick={async () => { const r = await act.run(() => retryEmail(logId)); if (r?.ok) router.refresh(); }}>
        {act.busy ? "Retrying…" : "Retry"}
      </button>
      {act.error && <span role="alert" style={{ fontSize: 11, marginLeft: 6 }}>{act.error}</span>}
    </span>
  );
}
