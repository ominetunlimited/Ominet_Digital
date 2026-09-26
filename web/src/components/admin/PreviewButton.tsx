"use client";

import { css } from "@/lib/css";

/**
 * Opens the real public page in a new tab. Drafts and unpublished items show
 * there too — with a PREVIEW banner — but only for signed-in staff; everyone
 * else gets a normal 404.
 *
 * - Saved item: opens its last saved version (save first to see recent edits).
 * - Brand-new item: saves it as a private DRAFT first, then opens it — it is
 *   never published by previewing.
 */
export default function PreviewButton({
  href,
  saved,
  onSaveDraft,
  disabled,
}: {
  href: string | null;
  saved: boolean;
  onSaveDraft?: () => Promise<string | null>;
  disabled?: boolean;
}) {
  if (saved && href) {
    return (
      <a href={href} target="_blank" rel="noopener" className="btn btn-secondary" style={css("text-decoration:none;")} title="Opens the last saved version in a new tab">
        Preview ↗
      </a>
    );
  }
  if (!saved && onSaveDraft) {
    return (
      <button
        type="button"
        className="btn btn-secondary"
        disabled={disabled}
        title="Saves it as a private draft, then opens the preview"
        onClick={async () => {
          // The tab must be opened inside the click, or the browser blocks it as a pop-up.
          const tab = window.open("about:blank", "_blank");
          const target = await onSaveDraft();
          if (target && tab) tab.location.href = target;
          else tab?.close();
        }}
      >
        Preview
      </button>
    );
  }
  return (
    <button type="button" className="btn btn-secondary" disabled title="Not available yet">
      Preview
    </button>
  );
}
