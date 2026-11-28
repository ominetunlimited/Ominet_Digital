// Shown while a page is being prepared. The Ominet Digital mark has no background, so it sits cleanly
// on whichever theme is active. A very gentle pulse; it stops entirely for people who prefer reduced motion.
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      style={{ minHeight: "70vh", display: "grid", placeItems: "center", background: "var(--color-bg)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="omd-loading-logo" src="/images/ominet-digital-logo.svg" alt="" width={88} height={85} decoding="async" fetchPriority="high" />
      <style>{`
        .omd-loading-logo{display:block;width:88px;height:auto;animation:omd-pulse 1.6s ease-in-out infinite;}
        @keyframes omd-pulse{0%,100%{opacity:.45;transform:scale(.96);}50%{opacity:1;transform:scale(1);}}
        @media (prefers-reduced-motion: reduce){.omd-loading-logo{animation:none;opacity:1;}}
      `}</style>
    </div>
  );
}
