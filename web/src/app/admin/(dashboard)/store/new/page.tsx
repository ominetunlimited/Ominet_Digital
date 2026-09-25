import { css } from "@/lib/css";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "New product — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default function NewProductPage() {
  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>New product</h1>
      <ProductForm />
    </div>
  );
}
