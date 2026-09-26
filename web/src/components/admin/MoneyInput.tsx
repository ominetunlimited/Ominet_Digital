"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { currencySymbol, majorStringToMinor, minorToMajorString } from "@/lib/money";

/**
 * Price field that works in whole currency (4500.00), not kobo/cents
 * (450000) — the value it reports upward is still minor units, since that's
 * what's stored and what Paystack expects. Shows the currency symbol inline
 * and re-formats to two decimals on blur.
 */
export default function MoneyInput({
  valueMinor,
  currency,
  onChange,
}: {
  valueMinor: number | null;
  currency: string;
  onChange: (minor: number | null) => void;
}) {
  const [text, setText] = useState(minorToMajorString(valueMinor));

  return (
    <div style={css("display:flex;align-items:center;gap:var(--space-2);")}>
      <span style={css("font-size:15px;opacity:0.7;min-width:1.2em;")}>{currencySymbol(currency)}</span>
      <input
        className="input"
        inputMode="decimal"
        placeholder="0.00"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(majorStringToMinor(e.target.value));
        }}
        onBlur={() => setText(minorToMajorString(majorStringToMinor(text)))}
      />
    </div>
  );
}
