import { css } from "@/lib/css";
import BookForm from "@/components/admin/BookForm";

export const metadata = { title: "New book — Admin", robots: { index: false, follow: false } };

export default function NewBookPage() {
  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>New book</h1>
      <BookForm />
    </div>
  );
}
