import { redirect } from "next/navigation";
import BlogIndex, { type BlogSP } from "@/components/blog/BlogIndex";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({ searchParams }: { searchParams: Promise<BlogSP> }) {
  const sp = await searchParams;
  const base = await pageMetadata("Blog: News, Opinion, Reviews and More", "Timely posts on sport, technology, news, reviews, opinion, science, AI, business and culture from Ominet Digital.", "/blog");
  // Filtered and paged views are useful to visitors but are not separate pages for search engines.
  return sp.q || sp.month || (sp.page && sp.page !== "1") ? { ...base, robots: { index: false, follow: true } } : base;
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<BlogSP> }) {
  const sp = await searchParams;
  // Old ?category= links now point at the category archive, which has one stable URL.
  if (sp.category && /^[a-z0-9-]+$/.test(sp.category)) {
    const rest = new URLSearchParams(Object.entries({ q: sp.q, month: sp.month, page: sp.page }).filter(([, v]) => v) as [string, string][]).toString();
    redirect(`/blog/category/${sp.category}${rest ? `?${rest}` : ""}`);
  }
  return <BlogIndex sp={sp} />;
}
