import { notFound } from "next/navigation";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import BookForm from "@/components/admin/BookForm";
import type { BookFileRecord } from "@/lib/admin/book-file-actions";

export const metadata = { title: "Edit book — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase
        .from("books")
        .select("*,book_purchase_links(label,platform,url,display_order)")
        .eq("id", id)
        .maybeSingle()
    : { data: null };
  if (!data) notFound();

  const { data: fileRows } = supabase
    ? await supabase.from("book_files").select("id,format,original_name,size_bytes,detected,created_at").eq("book_id", id)
    : { data: null };
  const files: BookFileRecord[] = (fileRows ?? []).map((r) => ({
    id: r.id,
    format: r.format,
    originalName: r.original_name,
    sizeBytes: Number(r.size_bytes),
    detected: r.detected,
    createdAt: r.created_at,
  }));

  const { book_purchase_links, ...book } = data;
  const initial = {
    ...book,
    publication_date: book.publication_date ?? "",
    tags: book.tags ?? [],
    purchaseLinks: (book_purchase_links ?? [])
      .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)
      .map((l: { label: string; platform: string; url: string }) => ({ label: l.label, platform: l.platform, url: l.url })),
  };

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>Edit book</h1>
      <BookForm initial={initial} files={files} />
    </div>
  );
}
