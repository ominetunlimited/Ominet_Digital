"use client";

import { useEffect, useRef } from "react";
import { css } from "@/lib/css";

const FONTS = ["Default", "Georgia", "Arial", "Times New Roman", "Courier New", "Verdana"];
const SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "Huge", value: "7" },
];

function Btn({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()} // keep the editor's text selection from collapsing before the command runs
      onClick={onClick}
      className={active ? "btn btn-primary" : "btn btn-secondary"}
      style={css("padding:4px 9px;font-size:13px;min-height:0;")}
    >
      {children}
    </button>
  );
}

/**
 * A very simple post editor — bold, italic, underline, font, size, colour —
 * built on the browser's own contentEditable + execCommand rather than a
 * new dependency. Spell-checking is the browser's native underline (the
 * spellcheck attribute below), not something this needs to implement.
 * Stores and returns real HTML; the public article page renders that HTML
 * directly (see src/app/writing/[slug]/page.tsx).
 */
export default function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // Uncontrolled on purpose: setting innerHTML from `value` on every render
  // (e.g. via dangerouslySetInnerHTML tied to the prop) fights the browser's
  // own cursor position — each keystroke's React re-render would reset the
  // caret to the start, so typed text comes out reversed. Set it once on
  // mount and let the DOM own it from then on; onInput is the only way data
  // flows back out.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value;
    // Mount only — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  return (
    <div>
      <div style={css("display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:var(--space-2);border:1px solid var(--color-divider);border-bottom:none;border-radius:var(--radius-md) var(--radius-md) 0 0;background:var(--color-surface);")}>
        <Btn title="Bold" onClick={() => exec("bold")}><strong>B</strong></Btn>
        <Btn title="Italic" onClick={() => exec("italic")}><em>I</em></Btn>
        <Btn title="Underline" onClick={() => exec("underline")}><span style={css("text-decoration:underline;")}>U</span></Btn>
        <select
          className="input"
          style={css("width:auto;min-height:0;padding:4px 6px;font-size:13px;")}
          defaultValue="Default"
          title="Font"
          aria-label="Font"
          onChange={(e) => exec("fontName", e.target.value === "Default" ? "inherit" : e.target.value)}
        >
          {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          className="input"
          style={css("width:auto;min-height:0;padding:4px 6px;font-size:13px;")}
          defaultValue="3"
          title="Size"
          aria-label="Font size"
          onChange={(e) => exec("fontSize", e.target.value)}
        >
          {SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input
          type="color"
          title="Text colour"
          aria-label="Text colour"
          defaultValue="#160E3D"
          style={css("width:28px;height:28px;padding:0;border:1px solid var(--color-divider);border-radius:var(--radius-sm);cursor:pointer;")}
          onChange={(e) => exec("foreColor", e.target.value)}
        />
        <Btn title="Bulleted list" onClick={() => exec("insertUnorderedList")}>&bull; List</Btn>
        <Btn title="Clear formatting" onClick={() => exec("removeFormat")}>Clear</Btn>
      </div>
      <div
        ref={ref}
        contentEditable
        spellCheck
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Body"
        data-placeholder={placeholder}
        className="rte-body rte-editable"
        style={css("min-height:260px;padding:var(--space-3);border:1px solid var(--color-divider);border-radius:0 0 var(--radius-md) var(--radius-md);font-size:16px;line-height:1.7;")}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
      />
      <style>{`
        .rte-body:empty:before{content:attr(data-placeholder);opacity:0.4;}
        .rte-editable{outline:none;}
        .rte-editable:focus-visible{outline:2px solid var(--color-accent);outline-offset:-2px;}
      `}</style>
    </div>
  );
}
