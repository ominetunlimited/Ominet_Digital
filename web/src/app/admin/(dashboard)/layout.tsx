import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/admin/actions";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  let badges = { comments: 0, bookings: 0, reviews: 0 };
  if (supabase) {
    const [comments, bookings, reviews] = await Promise.all([
      supabase.from("comments").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    // reviews (0032) may not be applied to this project yet — a missing
    // table ("42P01") must never break every other admin page's layout.
    badges = { comments: comments.count ?? 0, bookings: bookings.count ?? 0, reviews: reviews.error ? 0 : (reviews.count ?? 0) };
  }

  return (
    <AdminShell
      userEmail={user?.email}
      badges={badges}
      footer={
        <form action={signOut}>
          <button type="submit" className="btn btn-secondary btn-block">Sign out</button>
        </form>
      }
    >
      {children}
    </AdminShell>
  );
}
