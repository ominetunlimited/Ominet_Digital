"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QUICK_ADD } from "@/lib/admin/nav";

/** The "+ New" shortcut menu — every target is an existing route. */
export default function QuickAddMenu({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="admin-quickadd" ref={ref}>
      <button
        type="button"
        className={compact ? "btn btn-icon btn-secondary" : "btn btn-primary btn-block"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Create new"
        onClick={() => setOpen((v) => !v)}
      >
        {compact ? "+" : "+ New"}
      </button>
      {open && (
        <div className="admin-quickadd-panel" role="menu">
          {QUICK_ADD.map((item) => (
            <Link key={item.href} href={item.href} role="menuitem" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
