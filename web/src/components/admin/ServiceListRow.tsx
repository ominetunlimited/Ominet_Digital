"use client";

import Link from "next/link";
import { useState } from "react";
import { css } from "@/lib/css";
import { setServiceFields } from "@/lib/admin/service-actions";
import { useAdminAction } from "@/lib/admin/useAdminAction";

export type ServiceListItem = {
  id: string;
  title: string;
  status: string;
  featured: boolean;
  display_order: number;
  price_cents: number | null;
  currency: string;
  pricing_mode: string;
};

export default function ServiceListRow({ item }: { item: ServiceListItem }) {
  const [status, setStatus] = useState(item.status);
  const [featured, setFeatured] = useState(item.featured);
  const [order, setOrder] = useState(item.display_order);
  const { busy, error, run } = useAdminAction();

  async function updateStatus(next: string) {
    setStatus(next);
    await run(() => setServiceFields(item.id, { status: next }));
  }

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
      <td><Link href={`/admin/services/${item.id}`}>{item.title}</Link></td>
      <td>{item.pricing_mode === "quote" ? "Quote" : item.price_cents != null ? `${item.currency} ${(item.price_cents / 100).toFixed(2)}` : "—"}</td>
      <td>
        <select className="input" style={css("font-size:12px;padding:2px 6px;")} value={status} onChange={(e) => updateStatus(e.target.value)} disabled={busy}>
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>
      </td>
      <td>
        <input type="checkbox" checked={featured} onChange={toggleFeatured} disabled={busy} />
      </td>
      <td>
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
      <td>{error && <span style={css("font-size:11px;color:var(--om-coral);")}>{error}</span>}</td>
    </tr>
  );
}
