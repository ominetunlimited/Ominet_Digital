import { notFound } from "next/navigation";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import ContentForm from "@/components/admin/ContentForm";

export const metadata = { title: "Edit content — Admin", robots: { index: false, follow: false } };
// Safety net for the cover/thumbnail upload actions this form calls —
// client-side compression makes this rarely necessary, but a slow network
// on a large original shouldn't get killed by the platform's default limit.
export const maxDuration = 60;

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("content").select("*").eq("id", id).maybeSingle() : { data: null };
  if (!data) notFound();

  const { data: cats } = supabase ? await supabase.from("categories").select("id,name,parent_id").eq("blog_enabled", true).order("display_order") : { data: [] };
  const { data: tagRows } = supabase ? await supabase.from("content_tags").select("tags(name)").eq("content_id", id) : { data: [] };
  const tags = ((tagRows ?? []) as unknown as { tags: { name: string } | null }[]).map((t) => t.tags?.name).filter(Boolean).join(", ");
  const { data: ccRows } = supabase ? await supabase.from("content_categories").select("category_id,is_primary").eq("content_id", id) : { data: [] };
  const catParent = new Map(((cats ?? []) as { id: string; parent_id: string | null }[]).map((c) => [c.id, c.parent_id]));
  const links = (ccRows ?? []) as { category_id: string; is_primary: boolean }[];
  const category_ids = links.filter((l) => !catParent.get(l.category_id)).map((l) => l.category_id);
  const subcategory_ids = links.filter((l) => catParent.get(l.category_id)).map((l) => l.category_id);
  const primary_category_id = links.find((l) => l.is_primary)?.category_id ?? "";
  const attachment =
    data.attachment_format && data.attachment_original_name && data.attachment_size_bytes != null
      ? { format: data.attachment_format, originalName: data.attachment_original_name, sizeBytes: Number(data.attachment_size_bytes) }
      : null;

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>Edit content</h1>
      <ContentForm initial={{ ...data, tags, category_ids, subcategory_ids, primary_category_id }} attachment={attachment} categories={(cats ?? []) as { id: string; name: string; parent_id: string | null }[]} />
    </div>
  );
}
