import { css } from "@/lib/css";
import ServiceForm from "@/components/admin/ServiceForm";

export const metadata = { title: "New service — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default function NewServicePage() {
  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>New service</h1>
      <ServiceForm />
    </div>
  );
}
