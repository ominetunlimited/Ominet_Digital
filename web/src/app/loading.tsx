import { css } from "@/lib/css";

export default function Loading() {
  return (
    <section style={css("padding:var(--space-8) var(--space-6);text-align:center;")}>
      <div style={css("font-family:var(--font-heading);font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>LOADING</div>
      <div
        style={{
          width: 28,
          height: 28,
          border: "2px solid var(--color-divider)",
          borderTopColor: "var(--color-accent)",
          borderRadius: "50%",
          margin: "0 auto",
          animation: "omd-spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes omd-spin{to{transform:rotate(360deg);}}`}</style>
    </section>
  );
}
