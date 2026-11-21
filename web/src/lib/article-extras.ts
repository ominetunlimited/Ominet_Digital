import { createClient } from "@/lib/supabase/server";

export type ArticleExtras = {
  abstract: string | null; referencesHtml: string | null; showToc: boolean; imageCredit: string | null; contributors: string | null;
  editorialLabel: string | null; disclosure: string | null; correctionNote: string | null; featuredImageAlt: string | null; updatedAt: string | null; publishedAt: string | null;
};

/** Long-form fields added in Phase 4. Read separately so older databases without the columns still render the article. */
export async function getArticleExtras(slug: string): Promise<ArticleExtras | null> {
  const db = await createClient();
  if (!db) return null;
  const { data, error } = await db.from("content")
    .select("abstract,references_html,show_toc,image_credit,contributors,editorial_label,disclosure,correction_note,featured_image_alt,updated_at,published_at")
    .eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return {
    abstract: data.abstract ?? null, referencesHtml: data.references_html ?? null, showToc: data.show_toc ?? true, imageCredit: data.image_credit ?? null,
    contributors: data.contributors ?? null, editorialLabel: data.editorial_label ?? null, disclosure: data.disclosure ?? null,
    correctionNote: data.correction_note ?? null, featuredImageAlt: data.featured_image_alt ?? null, updatedAt: data.updated_at ?? null, publishedAt: data.published_at ?? null,
  };
}

export const EDITORIAL_LABELS: Record<string, string> = { news: "News report", analysis: "Analysis", opinion: "Opinion", review: "Review", sponsored: "Sponsored content", fiction: "Fiction", explainer: "Explainer" };
