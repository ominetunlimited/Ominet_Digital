import { createAdminClient } from "@/lib/supabase/admin";

export type SalesMode = "external_only" | "free_download" | "direct_sale";

export type BookDelivery = {
  salesMode: SalesMode;
  priceCents: number | null;
  currency: string;
  /** Formats that exist as real files — never the storage paths. */
  files: { format: string; sizeBytes: number }[];
};

/**
 * What a visitor may be offered for a book. Reads with the service role
 * because book_files is staff-only, but only ever returns format + size —
 * storage paths never leave the server.
 */
export async function getBookDelivery(bookId: string): Promise<BookDelivery | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: book, error } = await admin.from("books").select("sales_mode,price_cents,currency,status").eq("id", bookId).maybeSingle();
  // Before migration 0012 the columns don't exist: behave as external-only.
  if (error || !book || book.status !== "published") return null;
  if (book.sales_mode !== "free_download" && book.sales_mode !== "direct_sale") return null;

  const { data: files } = await admin.from("book_files").select("format,size_bytes").eq("book_id", bookId).order("format");
  if (!files?.length) return null;
  return {
    salesMode: book.sales_mode,
    priceCents: book.price_cents,
    currency: book.currency || "NGN",
    files: files.map((f) => ({ format: f.format as string, sizeBytes: Number(f.size_bytes) })),
  };
}
