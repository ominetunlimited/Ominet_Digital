// Human-readable labels for audit_log rows (see migration 0016). Shared by the
// full Audit log page and the dashboard's "Recent activity" panel so the two
// never drift apart.

export const AREAS: Record<string, string> = {
  auth: "Sign-in",
  content: "Content",
  books: "Books",
  book_files: "Book files",
  products: "Store products",
  services: "Services",
  bookings: "Bookings",
  comments: "Comments",
  ad_placements: "Ad placements",
  ads: "Ads",
  ad_campaigns: "Ad campaigns",
  ad_advertisers: "Advertisers",
  social_accounts: "Social",
  research_profiles: "Research profiles",
  selected_work: "About page",
  site_settings: "Site settings",
  redirects: "Redirects",
  media_assets: "Media",
  profiles: "Roles & permissions",
};

const VERBS: Record<string, string> = {
  insert: "created",
  update: "updated",
  delete: "deleted",
  publish: "published",
  unpublish: "unpublished",
  archive: "archived",
  status_change: "changed status of",
  role_change: "changed the role of",
  login: "signed in",
  login_failed: "failed to sign in",
  login_blocked: "was blocked from signing in",
  logout: "signed out",
};

export type AuditRow = {
  id: number;
  created_at: string;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_label: string | null;
  metadata: Record<string, unknown> | null;
};

export function describeAuditEntry(row: AuditRow): { who: string; what: string; details: string; warn: boolean } {
  const verb = VERBS[row.action.split(".").pop() ?? ""] ?? row.action;
  const meta = (row.metadata ?? {}) as Record<string, unknown> & { changed?: string[]; ip?: string; via?: string };
  const isAuth = row.entity_type === "auth";
  const who = row.actor_email || (isAuth ? row.entity_label || "unknown" : meta.via === "service_role" ? "The server" : "System");
  const area = (AREAS[row.entity_type] ?? row.entity_type).toLowerCase();
  const what = isAuth ? verb : `${verb} ${area}${row.entity_label ? ` “${row.entity_label}”` : ""}`;

  const parts: string[] = [];
  for (const [k, v] of Object.entries(meta)) {
    if (v && typeof v === "object" && !Array.isArray(v) && "to" in v) {
      const { from, to } = v as { from: unknown; to: unknown };
      parts.push(`${k}: ${from === null || from === undefined ? "—" : String(from)} → ${to === null || to === undefined ? "—" : String(to)}`);
    }
  }
  if (Array.isArray(meta.changed)) parts.push(`fields: ${meta.changed.join(", ")}`);
  if (isAuth && meta.ip) parts.push(`from ${meta.ip}`);
  return { who, what, details: parts.join(" · "), warn: row.action === "auth.login_failed" || row.action === "auth.login_blocked" };
}
