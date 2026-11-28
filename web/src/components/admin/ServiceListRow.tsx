"use client";

import Link from "next/link";
import { useState } from "react";
import { css } from "@/lib/css";
import { setServiceFields } from "@/lib/admin/service-actions";
import { formatMoney } from "@/lib/money";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import RowActions from "@/components/admin/RowActions";

export type ServiceListItem = {
  id: string;
  slug?: string | null;
  title: string;
  status: string;
  featured: boolean;
  display_order: number;
  price_cents: number | null;
  currency: string;
  pricing_mode: string;
};

export default function ServiceListRow({ item, views }: { item: ServiceListItem; views?: number }) {
  const [featured, setFeatured] = useState(item.featured);
  const [order, setOrder] = useState(item.display_order);
  const { busy, error, run } = useAdminAction();

  async function toggleFeatured() {
    const next = !featured;
    setFeatured(next);
    await run(() => setServiceFields(item.id, { featured: next }));
  }

  async function updateOrder() {
    await run(() => setServiceFields(item.id, { display_order: order }));
  }

  return (
    <tr>
      <td data-label="Title"><Link href={`/admin/services/${item.id}`}>{item.title}</Link></td>
      <td data-label="Price">{item.pricing_mode === "quote" ? "Quote" : formatMoney(item.price_cents, item.currency)}</td>
      <td data-label="Status">{item.status}</td>
      <td data-label="Featured">
        <input type="checkbox" checked={featured} onChange={toggleFeatured} disabled={busy} />
      </td>
      <td data-label="Order">
        <input
          type="number"
          className="input"
          style={css("width:64px;font-size:12px;padding:2px 6px;")}
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          onBlur={updateOrder}
          disabled={busy}
        />
      </td>
      <td data-label="Actions">
        <RowActions kind="services" id={item.id} title={item.title} status={item.status} previewHref={item.slug ? `/services/${item.slug}` : null} editHref={`/admin/services/${item.id}`} views={views} />
        {error && <span style={css("font-size:11px;color:var(--om-coral);display:block;")}>{error}</span>}
      </td>
    </tr>
  );
}
