import { notFound } from "next/navigation";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import ContentForm from "@/components/admin/ContentForm";

export const metadata = { title: "Edit content — Admin", robots: { index: false, follow: false } };

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("content").select("*").eq("id", id).maybeSingle() : { data: null };
  if (!data) notFound();

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>Edit content</h1>
      <ContentForm initial={data} />
    </div>
  );
}
