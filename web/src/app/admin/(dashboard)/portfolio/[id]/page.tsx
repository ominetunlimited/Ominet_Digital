import { notFound } from "next/navigation";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import PortfolioForm from "@/components/admin/PortfolioForm";

export const metadata = { title: "Edit project — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function EditPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();
  const { data } = await supabase.from("portfolio_items").select("*, portfolio_media(kind,url,title,caption,display_order)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const media = [...(data.portfolio_media ?? [])].sort((a, b) => a.display_order - b.display_order).map((m) => ({ kind: m.kind, url: m.url, title: m.title ?? "", caption: m.caption ?? "" }));
  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>Edit project</h1>
      <PortfolioForm initial={{
        id: data.id, title: data.title, slug: data.slug, summary: data.summary ?? "", label: data.label, client_name: data.client_name ?? "", role: data.role ?? "",
        year_label: data.year_label ?? "", services: data.services ?? "", body_html: data.body_html ?? "", cover_image_url: data.cover_image_url ?? "", status: data.status,
        featured: data.featured, display_order: data.display_order, permission_confirmed: data.permission_confirmed, seo_title: data.seo_title ?? "", seo_description: data.seo_description ?? "", media,
      }} />
    </div>
  );
}
