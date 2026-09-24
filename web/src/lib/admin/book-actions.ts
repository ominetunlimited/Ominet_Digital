"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  formats: string[];
  status: string;
  featured: boolean;
  purchaseLinks: PurchaseLinkInput[];
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveBook(input: BookInput): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };

  const row = {
    title: input.title,
    slug: input.slug,
    kind: input.kind,
    year: input.year || null,
    pages: input.pages || null,
    excerpt: input.excerpt || null,
    description: input.description || null,
    formats: input.formats,
    status: input.status,
    featured: input.featured,
  };

  const { data, error } = input.id
    ? await supabase.from("books").update(row).eq("id", input.id).select("id").single()
    : await supabase.from("books").insert(row).select("id").single();
  if (error) return { ok: false, error: error.message };

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
  redirect(`/admin/books/${bookId}`);
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
