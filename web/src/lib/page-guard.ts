import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/site-settings";
import { isPageOn } from "@/lib/site-pages";

/** Call from a section layout: a page switched off in Admin → Pages answers 404 everywhere under its path. */
export async function assertPageEnabled(key: string) {
  const { pages } = await getSiteSettings();
  if (!isPageOn(pages, key)) notFound();
}
