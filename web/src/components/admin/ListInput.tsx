"use client";

import { useState } from "react";

/** "a, b;  c\nd" -> ["a","b","c","d"] (trimmed, no blanks, no duplicates) */
export function parseList(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of text.split(/[,;\n]/)) {
    const v = part.trim();
    const key = v.toLowerCase();
    if (v && !seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}

/**
 * A comma-separated list field. It keeps what you are typing exactly as you
 * type it (so a trailing comma or space isn't swallowed mid-word) and only
 * tidies the text into "a, b, c" when you leave the field.
 */
export default function ListInput({ value, onChange, placeholder }: { value: string[]; onChange: (list: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState(value.join(", "));
  return (
    <input
      className="input"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseList(e.target.value));
      }}
      onBlur={() => setText(parseList(text).join(", "))}
    />
  );
}
