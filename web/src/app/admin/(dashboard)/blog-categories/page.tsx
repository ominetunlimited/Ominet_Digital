import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import BlogCategoryRow from "@/components/admin/BlogCategoryRow";

export const metadata = { title: "Blog categories — Admin", robots: { index: false, follow: false } };

type Cat = { id: string; name: string; slug: string; description: string | null; display_order: number | null; blog_enabled: boolean | null; parent_id: string | null; seo_title: string | null; seo_description: string | null; image_url: string | null; show_when_empty: boolean | null };

export default async function BlogCategoriesPage() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("categories").select("id,name,slug,description,display_order,blog_enabled,parent_id,seo_title,seo_description,image_url,show_when_empty").order("display_order").order("name") : { data: [] };
  const { data: links } = supabase ? await supabase.from("content_categories").select("category_id").limit(10000) : { data: [] };
  const counts = new Map<string, number>();
  for (const l of links ?? []) counts.set(l.category_id as string, (counts.get(l.category_id as string) ?? 0) + 1);
  const cats = (data ?? []) as Cat[];
  const mains = cats.filter((c) => !c.parent_id);
  const mainOpts = mains.map((c) => ({ id: c.id, name: c.name }));
  const toInput = (c: Cat) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", order: c.display_order ?? 0, enabled: !!c.blog_enabled, parentId: c.parent_id ?? "", seoTitle: c.seo_title ?? "", seoDescription: c.seo_description ?? "", imageUrl: c.image_url ?? "", showWhenEmpty: !!c.show_when_empty });
  return (
    <div style={css("max-width:1000px;")}>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Blog categories and subcategories</h1>
      <p style={css("font-size:13px;opacity:0.65;margin:0 0 var(--space-4);")}>Main categories appear in the blog navigation; subcategories sit one level beneath them. A category that has no published posts stays hidden from the public site unless you tick the “show even when empty” option. Untick “Active” to retire one without deleting it. Posts can belong to several categories. Delete works only for unused categories; use Merge to move posts first.</p>
      {mains.map((m) => (
        <div key={m.id}>
          <BlogCategoryRow initial={toInput(m)} parents={[]} mergeTargets={mainOpts} postCount={counts.get(m.id) ?? 0} />
          {cats.filter((c) => c.parent_id === m.id).map((c) => (
            <BlogCategoryRow key={c.id} indent initial={toInput(c)} parents={mainOpts} mergeTargets={cats.filter((x) => x.parent_id === m.id).map((x) => ({ id: x.id, name: x.name }))} postCount={counts.get(c.id) ?? 0} />
          ))}
        </div>
      ))}
      <h2 style={css("font-family:var(--font-heading);font-size:18px;margin:var(--space-6) 0 0;")}>Add a category or subcategory</h2>
      <BlogCategoryRow parents={mainOpts} />
    </div>
  );
}
