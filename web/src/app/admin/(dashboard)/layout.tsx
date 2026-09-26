import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/admin/actions";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/books", label: "Books" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/store", label: "Store" },
  { href: "/admin/about-work", label: "About page" },
  { href: "/admin/research-profiles", label: "Research profiles" },
  { href: "/admin/social", label: "Social" },
  { href: "/admin/advertising", label: "Advertising" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/audit-log", label: "Audit log" },
];

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  return (
    <div style={css("display:flex;min-height:100vh;background:var(--color-bg);")}>
      <aside style={css("width:220px;flex-shrink:0;border-right:2px solid var(--color-divider);padding:var(--space-6) var(--space-4);display:flex;flex-direction:column;")}>
        <div style={css("font-weight:700;letter-spacing:0.02em;margin-bottom:var(--space-6);")}>OMINI NFAWA</div>
        <div style={css("display:grid;gap:var(--space-1);font-size:14px;flex:1;")}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} style={css("padding:var(--space-2) var(--space-2);")}>
              {item.label}
            </Link>
          ))}
        </div>
        <div style={css("font-size:12px;opacity:0.6;margin-bottom:var(--space-2);word-break:break-all;")}>{user?.email}</div>
        <form action={signOut}>
          <button type="submit" className="btn btn-secondary btn-block">Sign out</button>
        </form>
      </aside>
      <main style={css("flex:1;min-width:0;padding:var(--space-6) var(--space-8);")}>{children}</main>
    </div>
  );
}
