import { notFound } from "next/navigation";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import ServiceForm from "@/components/admin/ServiceForm";

export const metadata = { title: "Edit service — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("services").select("*").eq("id", id).maybeSingle() : { data: null };
  if (!data) notFound();

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>Edit service</h1>
      <ServiceForm initial={data} />
    </div>
  );
}
