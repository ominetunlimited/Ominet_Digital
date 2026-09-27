import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/admin/actions";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  let badges = { comments: 0, bookings: 0 };
  if (supabase) {
    const [comments, bookings] = await Promise.all([
      supabase.from("comments").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    badges = { comments: comments.count ?? 0, bookings: bookings.count ?? 0 };
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
