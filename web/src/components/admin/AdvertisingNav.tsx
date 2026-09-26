import Link from "next/link";
import { css } from "@/lib/css";

const TABS = [
  { href: "/admin/advertising", label: "Placements", key: "placements" },
  { href: "/admin/advertising/ads", label: "Ads", key: "ads" },
  { href: "/admin/advertising/campaigns", label: "Campaigns", key: "campaigns" },
  { href: "/admin/advertising/advertisers", label: "Advertisers", key: "advertisers" },
];

export default function AdvertisingNav({ active }: { active: string }) {
  return (
    <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-5);")}>
      {TABS.map((t) => (
        <Link key={t.key} href={t.href} className={t.key === active ? "btn btn-primary" : "btn btn-secondary"} style={css("font-size:13px;padding:6px 12px;")}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
