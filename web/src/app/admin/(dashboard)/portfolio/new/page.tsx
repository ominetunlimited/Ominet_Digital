import { css } from "@/lib/css";
import PortfolioForm from "@/components/admin/PortfolioForm";

export const metadata = { title: "New project — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default function NewPortfolioPage() {
  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>New project</h1>
      <PortfolioForm />
    </div>
  );
}
