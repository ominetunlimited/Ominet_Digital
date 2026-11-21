import { notFound } from "next/navigation";
import BlogIndex, { type BlogSP } from "@/components/blog/BlogIndex";
import { pageMetadata } from "@/lib/seo";
import { getCategoryBySlug } from "@/lib/blog";

export const revalidate = 60;

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<BlogSP> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const found = await getCategoryBySlug(slug);
  if (!found) return { title: "Category not found", robots: { index: false, follow: false } };
  const { node, parent } = found;
  const base = await pageMetadata(
    node.seoTitle || `${node.name}${parent ? ` (${parent.name})` : ""} | Ominet Digital Blog`,
    node.seoDescription || node.description || `Blog posts about ${node.name.toLowerCase()} from Ominet Digital.`,
    `/blog/category/${slug}`
  );
  // Each post has one canonical URL under /blog; archives are indexable only on their first, unfiltered page.
  return sp.q || sp.month || (sp.page && sp.page !== "1") ? { ...base, robots: { index: false, follow: true } } : base;
}

export default async function BlogCategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<BlogSP> }) {
  const { slug } = await params;
  if (!(await getCategoryBySlug(slug))) notFound();
  return <BlogIndex sp={await searchParams} categorySlug={slug} />;
}
