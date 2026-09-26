"use client";

import type { ReactNode } from "react";
import { css } from "@/lib/css";
import SaveButton from "@/components/admin/SaveButton";
import PreviewButton from "@/components/admin/PreviewButton";

/**
 * The button row under every editor.
 *  - New item:      Publish (goes live now) · Save as draft (private) · Preview
 *  - Existing item: Save changes · Preview · Delete
 */
export default function FormActions({
  isNew,
  busy,
  saved,
  disabled,
  onSave,
  onPublish,
  onDraft,
  previewHref,
  onPreviewNew,
  previewSlot,
  onDelete,
}: {
  isNew: boolean;
  busy: boolean;
  saved: boolean;
  disabled: boolean;
  onSave: () => void;
  onPublish: () => void;
  onDraft: () => void;
  previewHref: string | null;
  onPreviewNew?: () => Promise<string | null>;
  previewSlot?: ReactNode;
  onDelete?: () => void;
}) {
  return (
    <div>
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        {isNew ? (
          <>
            <SaveButton busy={busy} saved={saved} disabled={disabled} idleLabel="Publish" onClick={onPublish} />
            <button type="button" className="btn btn-secondary" onClick={onDraft} disabled={busy || disabled}>
              Save as draft
            </button>
          </>
        ) : (
          <SaveButton busy={busy} saved={saved} disabled={disabled} idleLabel="Save changes" onClick={onSave} />
        )}
        {previewSlot ?? <PreviewButton href={previewHref} saved={!isNew} onSaveDraft={onPreviewNew} disabled={busy || disabled} />}
        {!isNew && onDelete && (
          <button type="button" className="btn btn-secondary" onClick={onDelete} disabled={busy} style={css("color:var(--om-coral);border-color:var(--om-coral);")}>
            Delete
          </button>
        )}
      </div>
      {isNew && (
        <p style={css("font-size:12px;opacity:0.6;margin:var(--space-2) 0 0;max-width:60ch;")}>
          <strong>Publish</strong> puts it on the site straight away. <strong>Save as draft</strong> keeps it private, and <strong>Preview</strong> saves a private draft and opens it so you can check it first.
        </p>
      )}
    </div>
  );
}
