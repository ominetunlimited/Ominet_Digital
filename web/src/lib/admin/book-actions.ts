"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type PurchaseLinkInput = { label: string; platform: string; url: string };

export type BookInput = {
  id?: string;
  title: string;
  slug: string;
  kind: string;
  year: string;
  pages: string;
  excerpt: string;
  description: string;
  author_note: string;
  cover_image_url: string;
  formats: string[];
  status: string;
  featured: boolean;
  purchaseLinks: PurchaseLinkInput[];
};

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

  const row: Record<string, unknown> = {
    title: input.title,
    slug,
    kind: input.kind,
    year: input.year || null,
    pages: input.pages || null,
    excerpt: input.excerpt || null,
    description: input.description || null,
    author_note: input.author_note || null,
    cover_image_url: input.cover_image_url || null,
    formats: input.formats,
    status: input.status,
    featured: input.featured,
  };

  let { data, error } = input.id
    ? await supabase.from("books").update(row).eq("id", input.id).select("id,slug").single()
    : await supabase.from("books").insert(row).select("id,slug").single();

  // 0009_author_note.sql may not be applied yet — retry without it so the
  // rest of the save still goes through (same pattern as content-actions.ts).
  if (error?.code === "42703" || error?.code === "PGRST204") {
    delete row.author_note;
    ({ data, error } = input.id
      ? await supabase.from("books").update(row).eq("id", input.id).select("id,slug").single()
      : await supabase.from("books").insert(row).select("id,slug").single());
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
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/books");
  revalidatePath("/books");
  redirect("/admin/books");
}
