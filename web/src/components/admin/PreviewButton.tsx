"use client";

import { css } from "@/lib/css";

/**
 * Opens the real public page in a new tab. Drafts and unpublished items show
 * there too — with a PREVIEW banner — but only for signed-in staff; everyone
 * else gets a normal 404. It shows the last SAVED version, so save first.
 */
export default function PreviewButton({ href, saved }: { href: string | null; saved: boolean }) {
  if (!href || !saved) {
    return (
      <button type="button" className="btn btn-secondary" disabled title="Save it first, then you can preview it">
        Preview
      </button>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener" className="btn btn-secondary" style={css("text-decoration:none;")} title="Opens the last saved version in a new tab">
      Preview ↗
    </a>
  );
}
