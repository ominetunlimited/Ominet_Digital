import { assertPageEnabled } from "@/lib/page-guard";

// Admin → Pages can switch this section off; it then answers 404.
export default async function Layout({ children }: { children: React.ReactNode }) {
  await assertPageEnabled("media");
  return children;
}
