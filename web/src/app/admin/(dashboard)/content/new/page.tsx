import { css } from "@/lib/css";
import ContentForm from "@/components/admin/ContentForm";

export const metadata = { title: "New content — Admin", robots: { index: false, follow: false } };

export default function NewContentPage() {
  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>New content</h1>
      <ContentForm />
    </div>
  );
}
