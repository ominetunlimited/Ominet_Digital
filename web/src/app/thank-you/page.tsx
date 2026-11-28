import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ThankYouContent from "@/components/ThankYouContent";
import { css } from "@/lib/css";

// A confirmation screen, not content: kept out of search results and out of the sitemap.
export const metadata: Metadata = {
  title: "Enquiry received",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);")}>
      <Nav />
      <main>
        <ThankYouContent />
      </main>
      <Footer />
    </div>
  );
}
