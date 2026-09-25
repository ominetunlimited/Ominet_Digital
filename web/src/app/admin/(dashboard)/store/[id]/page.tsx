import { notFound } from "next/navigation";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "Edit product — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("products").select("*").eq("id", id).maybeSingle()
    : { data: null };
  if (!data) notFound();

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>Edit product</h1>
      <ProductForm initial={data} />
    </div>
  );
}
