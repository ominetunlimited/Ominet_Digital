"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";

export type PurchaseLinkInput = { label: string; platform: string; url: string };

export type BookInput = {
  id?: string;
  title: string;
  slug: string;
  kind: string;
  year: string;
  author: string;
  publisher: string;
  isbn: string;
  category: string;
  tags: string[];
  publication_date: string; // yyyy-mm-dd or ""
  page_count: number | null;
  page_count_source: string; // pdf | docx | epub | manual | ""
  excerpt: string;
  description: string;
  author_note: string;
  cover_image_url: string;
  og_image_url: string;
  seo_title: string;
  seo_description: string;
  formats: string[];
  sales_mode: string; // external_only | free_download | direct_sale
  price_cents: number | null;
  status: string;
  featured: boolean;
  purchaseLinks: PurchaseLinkInput[];
};

// Columns added after the original schema. If their migration hasn't been
// applied yet, the save retries without them so the rest still goes through.
const LATER_COLUMNS = [
  "author_note", "author", "publication_date", "category", "tags", "price_cents", "currency",
  "sales_mode", "page_count", "page_count_source", "og_image_url",
];

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function saveBook(input: BookInput): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };

  const slug = slugify(input.slug || input.title);
  if (!slug) return { ok: false, error: "Slug can't be empty once normalized — add some letters or numbers." };

  let previousSlug: string | null = null;
  if (input.id) {
    const { data: existing } = await supabase.from("books").select("slug").eq("id", input.id).maybeSingle();
    previousSlug = existing?.slug ?? null;
  }

  // Price rules: PRICE 0 = free download; PRICE >= 1 = paid. A price only
  // means something for the mode that uses it, so the other modes clear it.
  const salesMode = ["external_only", "free_download", "direct_sale"].includes(input.sales_mode) ? input.sales_mode : "external_only";
  if (salesMode === "direct_sale" && !(input.price_cents && input.price_cents >= 100)) {
    return { ok: false, error: "A book sold here needs a price of at least 1.00. For a free book choose 'Free download'." };
  }
  const priceCents = salesMode === "direct_sale" ? input.price_cents : salesMode === "free_download" ? 0 : null;

  // A free/paid book with nothing to deliver would take money (or promise a
  // download) for nothing — so it can't go live without at least one file.
  if (input.id && input.status === "published" && salesMode !== "external_only") {
    const { count } = await supabase.from("book_files").select("id", { count: "exact", head: true }).eq("book_id", input.id);
    if (!count) return { ok: false, error: "Attach at least one book file before publishing a free or paid book — or switch it to 'External links only'." };
  }

  const row: Record<string, unknown> = {
    title: input.title,
    slug,
    kind: input.kind,
    year: input.year || null,
    author: input.author.trim() || null,
    publisher: input.publisher.trim() || null,
    isbn: input.isbn.trim() || null,
    category: input.category.trim() || null,
    tags: input.tags,
    publication_date: input.publication_date || null,
    page_count: input.page_count && input.page_count > 0 ? Math.round(input.page_count) : null,
    page_count_source: input.page_count ? input.page_count_source || "manual" : null,
    // The public book page reads this text field; keep it in step with the number.
    pages: input.page_count && input.page_count > 0 ? `${Math.round(input.page_count)} pages` : null,
    excerpt: input.excerpt || null,
    description: input.description || null,
    author_note: input.author_note || null,
    cover_image_url: input.cover_image_url || null,
    og_image_url: input.og_image_url || null,
    seo_title: input.seo_title.trim() || null,
    seo_description: input.seo_description.trim() || null,
    formats: input.formats,
    sales_mode: salesMode,
    price_cents: priceCents,
    currency: "NGN",
    status: input.status,
    featured: input.featured,
  };

  const write = () =>
    input.id
      ? supabase.from("books").update(row).eq("id", input.id).select("id,slug").single()
      : supabase.from("books").insert(row).select("id,slug").single();

  let { data, error } = await write();

  // A migration for one of the newer columns may not be applied yet — retry
  // without them so the rest of the save still goes through (same pattern as
  // content-actions.ts).
  if (error?.code === "42703" || error?.code === "PGRST204") {
    for (const col of LATER_COLUMNS) delete row[col];
    ({ data, error } = await write());
  }
  if (error || !data) return { ok: false, error: error?.message ?? "Save failed unexpectedly." };

  const bookId = data.id as string;

  await supabase.from("book_purchase_links").delete().eq("book_id", bookId);
  if (input.purchaseLinks.length > 0) {
    const { error: linkError } = await supabase.from("book_purchase_links").insert(
      input.purchaseLinks.map((l, i) => ({
        book_id: bookId,
        platform: l.platform,
        label: l.label,
        url: l.url,
        display_order: i,
      }))
    );
    if (linkError) return { ok: false, error: linkError.message };
  }

  revalidatePath("/admin/books");
  revalidatePath("/books");
  revalidatePath(`/books/${data.slug}`);
  if (previousSlug && previousSlug !== data.slug) revalidatePath(`/books/${previousSlug}`);
  revalidatePath("/");
  return { ok: true, id: bookId };
}

export async function deleteBook(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  // Remove the stored files too — the rows cascade, the storage objects don't.
  const { data: files } = await supabase.from("book_files").select("storage_path").eq("book_id", id);
  if (files?.length) {
    const admin = createAdminClient();
    if (admin) await admin.storage.from("book-files").remove(files.map((f) => f.storage_path));
  }
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/books");
  revalidatePath("/books");
  redirect("/admin/books");
}
