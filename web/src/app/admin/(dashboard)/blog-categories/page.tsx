import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import BlogCategoryRow from "@/components/admin/BlogCategoryRow";

export const metadata = { title: "Blog categories — Admin", robots: { index: false, follow: false } };

export default async function BlogCategoriesPage() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("categories").select("id,name,slug,description,display_order,blog_enabled").order("display_order").order("name") : { data: [] };
  return (
    <div style={css("max-width:960px;")}>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Blog categories</h1>
      <p style={css("font-size:13px;opacity:0.65;margin:0 0 var(--space-4);")}>These are the categories shown on the Blog page. Untick “Shown” to hide one without deleting it.</p>
      {(data ?? []).map((c) => <BlogCategoryRow key={c.id} initial={{ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", order: c.display_order ?? 0, enabled: !!c.blog_enabled }} />)}
      <h2 style={css("font-family:var(--font-heading);font-size:18px;margin:var(--space-6) 0 0;")}>Add a category</h2>
      <BlogCategoryRow />
    </div>
  );
}
