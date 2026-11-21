import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import ContentForm from "@/components/admin/ContentForm";

export const metadata = { title: "New content — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function NewContentPage({ searchParams }: { searchParams: Promise<{ blog?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: cats } = supabase ? await supabase.from("categories").select("id,name,parent_id").eq("blog_enabled", true).order("display_order") : { data: [] };
  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>{sp.blog ? "New blog article" : "New content"}</h1>
      <ContentForm initial={sp.blog ? { in_blog: true } : undefined} categories={(cats ?? []) as { id: string; name: string; parent_id: string | null }[]} />
    </div>
  );
}
