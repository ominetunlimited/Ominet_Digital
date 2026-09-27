"use client";

import { useEffect, useRef, useState } from "react";
import { css } from "@/lib/css";
import { searchLinkable, listRelated, addRelated, removeRelated, type SearchResult, type AdminRelatedRow } from "@/lib/admin/related-actions";
import type { LinkableType } from "@/lib/related";

const NOUN: Record<LinkableType, string> = { content: "Article", book: "Book", service: "Service" };

/**
 * "This relates to that": a type-ahead search across content/books/services
 * to link this item to others, plus the list of what's already linked. One
 * relation covers both sides — adding it here also makes this item show up
 * in the other item's own Related section.
 */
export default function RelatedItemsPanel({ sourceType, sourceId }: { sourceType: LinkableType; sourceId: string | null }) {
  const [items, setItems] = useState<AdminRelatedRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sourceId) return;
    let cancelled = false;
    listRelated(sourceType, sourceId).then((rows) => {
      if (!cancelled) {
        setItems(rows);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sourceType, sourceId]);

  function onQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) setResults([]);
  }

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!sourceId || query.trim().length < 2) return;
    debounce.current = setTimeout(async () => {
      const found = await searchLinkable(query, sourceType, sourceId);
      setResults(found.filter((r) => !items.some((i) => i.type === r.type && i.id === r.id)));
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sourceId, sourceType]);

  async function add(result: SearchResult) {
    if (!sourceId) return;
    setError("");
    setBusy(true);
    const res = await addRelated(sourceType, sourceId, result.type, result.id);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setItems((list) => [...list, { relationId: "", type: result.type, id: result.id, title: result.title }]);
    setQuery("");
    setResults([]);
    // Refresh once to pick up the real relation id (needed to remove it again).
    const rows = await listRelated(sourceType, sourceId);
    setItems(rows);
  }

  async function remove(row: AdminRelatedRow) {
    if (!confirm(`Remove the link to "${row.title}"?`)) return;
    setError("");
    const res = await removeRelated(row.relationId);
    if (!res.ok) return setError(res.error);
    setItems((list) => list.filter((r) => r.relationId !== row.relationId));
  }

  return (
    <div style={css("margin-bottom:var(--space-6);")}>
      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>RELATED</div>
      <p style={css("font-size:13px;opacity:0.7;margin:0 0 var(--space-3);")}>
        Link this to other articles, books or services. Shown as a &ldquo;Related&rdquo; section on both pages &mdash; adding it here also adds this item to
        the other one&apos;s Related list.
      </p>

      {!sourceId ? (
        <p style={css("font-size:13px;opacity:0.6;")}>Save this item first, then you can relate it to others.</p>
      ) : (
        <>
          {loaded && items.length > 0 && (
            <div style={css("display:grid;gap:var(--space-2);margin-bottom:var(--space-3);")}>
              {items.map((row) => (
                <div key={row.relationId || `${row.type}:${row.id}`} style={css("display:flex;justify-content:space-between;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);border:1px solid var(--color-divider);border-radius:var(--radius-md);")}>
                  <span style={css("font-size:13px;")}>
                    <span style={css("opacity:0.5;")}>{NOUN[row.type]}</span> &middot; {row.title}
                  </span>
                  <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} disabled={!row.relationId} onClick={() => remove(row)}>Remove</button>
                </div>
              ))}
            </div>
          )}
          {loaded && items.length === 0 && <p style={css("font-size:13px;opacity:0.6;margin-bottom:var(--space-3);")}>Nothing related yet.</p>}

          <input
            className="input"
            placeholder="Search articles, books, services by title…"
            value={query}
            disabled={busy}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          {results.length > 0 && (
            <div style={css("display:grid;gap:var(--space-2);margin-top:var(--space-2);")}>
              {results.map((r) => (
                <button
                  key={`${r.type}:${r.id}`}
                  type="button"
                  className="btn btn-secondary"
                  style={css("justify-content:space-between;text-align:left;")}
                  disabled={busy}
                  onClick={() => add(r)}
                >
                  <span>{r.title}</span>
                  <span style={css("opacity:0.6;font-size:12px;")}>{r.subtitle} &middot; Add</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {error && <p style={css("font-size:13px;color:var(--om-coral);margin-top:var(--space-2);")}>{error}</p>}
    </div>
  );
}
