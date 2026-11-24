"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import Image from "@tiptap/extension-image";
import { uploadMedia } from "@/lib/admin/media-actions";
import { compressImage } from "@/lib/compressImage";
import { css } from "@/lib/css";
import { sanitizeRichHtml, toRichHtml } from "@/lib/rich-text";

function Btn({ onClick, active, title, children, disabled }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep the selection while the command runs
      onClick={onClick}
      className={active ? "btn btn-primary" : "btn btn-secondary"}
      style={css("padding:4px 9px;font-size:13px;min-height:34px;min-width:34px;")}
    >
      {children}
    </button>
  );
}

function setLink(editor: Editor) {
  const prev = (editor.getAttributes("link").href as string | undefined) ?? "";
  const url = window.prompt("Link address (https://…, mailto: or tel:)", prev || "https://");
  if (url === null) return;
  const trimmed = url.trim();
  if (!trimmed) return void editor.chain().focus().extendMarkRange("link").unsetLink().run();
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return void window.alert("Links must start with https://, mailto: or tel:");
  editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
}

/**
 * Admin rich-text editor (TipTap). Pasting from Word, Google Docs or a web
 * page keeps headings, paragraphs, bold/italic/underline, lists, quotes,
 * links and alignment, and discards fonts, colours, classes and scripts:
 * ProseMirror only keeps what the schema below allows, and the value is
 * sanitised again on the way out. Older plain-text values load as
 * paragraphs and bullets. Props are unchanged from the previous editor.
 */
export default function RichTextEditor({ value, onChange, placeholder, minHeight = 260 }: { value: string; onChange: (html: string) => void; placeholder?: string; minHeight?: number }) {
  const [source, setSource] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [imgBusy, setImgBusy] = useState(false);
  const [imgError, setImgError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);

  async function insertImageFile(file: File) {
    const ed = editorRef.current;
    if (!ed) return;
    if (!file.type.startsWith("image/")) return void setImgError("That file is not a picture.");
    setImgError("");
    setImgBusy(true);
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.set("file", compressed);
      const res = await uploadMedia(fd);
      if (!res.ok || !res.url) return void setImgError(res.ok ? "Upload failed." : res.error);
      const alt = window.prompt("Describe this picture in a few words (for readers using screen readers and for search). Leave empty if it is purely decorative.", "") ?? "";
      ed.chain().focus().setImage({ src: res.url, alt: alt.trim() }).run();
    } catch {
      setImgError("Could not upload the picture. Try a smaller file.");
    } finally {
      setImgBusy(false);
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, code: false, codeBlock: false, link: { openOnClick: false, autolink: true, protocols: ["mailto", "tel"] } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      Image.configure({ inline: true, allowBase64: false }),
    ],
    content: toRichHtml(value),
    editorProps: {
      attributes: { role: "textbox", "aria-multiline": "true", "aria-label": "Content", class: "rte-body rte-editable", "data-placeholder": placeholder ?? "" },
      handlePaste: (_v, event) => {
        const f = Array.from(event.clipboardData?.files ?? []).find((x) => x.type.startsWith("image/"));
        if (!f) return false;
        void insertImageFile(f);
        return true;
      },
      handleDrop: (_v, event) => {
        const f = Array.from((event as DragEvent).dataTransfer?.files ?? []).find((x) => x.type.startsWith("image/"));
        if (!f) return false;
        event.preventDefault();
        void insertImageFile(f);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.isEmpty ? "" : sanitizeRichHtml(ed.getHTML())),
  });

  useEffect(() => { editorRef.current = editor; }, [editor]);

  // Keep the toolbar's active states in sync without re-rendering on every keystroke elsewhere.
  const [, force] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const tick = () => force((n) => n + 1);
    editor.on("selectionUpdate", tick);
    editor.on("transaction", tick);
    return () => { editor.off("selectionUpdate", tick); editor.off("transaction", tick); };
  }, [editor]);

  if (!editor) return <div style={css(`min-height:${minHeight}px;border:1px solid var(--color-divider);border-radius:var(--radius-md);`)} aria-busy="true" />;

  const align = (a: "left" | "center" | "right" | "justify") => editor.chain().focus().setTextAlign(a).run();

  function toggleSource() {
    if (!source) {
      setSourceText(sanitizeRichHtml(editor!.getHTML()));
      setSource(true);
    } else {
      const clean = sanitizeRichHtml(sourceText);
      editor!.commands.setContent(clean || "", { emitUpdate: true });
      onChange(clean);
      setSource(false);
    }
  }

  return (
    <div>
      <div role="toolbar" aria-label="Formatting" style={css("display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:var(--space-2);border:1px solid var(--color-divider);border-bottom:none;border-radius:var(--radius-md) var(--radius-md) 0 0;background:var(--color-surface);")}>
        <select
          className="input"
          aria-label="Text style"
          style={css("width:auto;min-height:34px;padding:4px 6px;font-size:13px;")}
          disabled={source}
          value={editor.isActive("heading", { level: 1 }) ? "h1" : editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p"}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
          }}
        >
          <option value="p">Normal paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <Btn title="Bold" active={editor.isActive("bold")} disabled={source} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></Btn>
        <Btn title="Italic" active={editor.isActive("italic")} disabled={source} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></Btn>
        <Btn title="Underline" active={editor.isActive("underline")} disabled={source} onClick={() => editor.chain().focus().toggleUnderline().run()}><span style={{ textDecoration: "underline" }}>U</span></Btn>
        <Btn title="Numbered list" active={editor.isActive("orderedList")} disabled={source} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</Btn>
        <Btn title="Bullet list" active={editor.isActive("bulletList")} disabled={source} onClick={() => editor.chain().focus().toggleBulletList().run()}>&bull; List</Btn>
        <Btn title="Blockquote" active={editor.isActive("blockquote")} disabled={source} onClick={() => editor.chain().focus().toggleBlockquote().run()}>&ldquo; Quote</Btn>
        <Btn title="Insert or edit link" active={editor.isActive("link")} disabled={source} onClick={() => setLink(editor)}>Link</Btn>
        <Btn title="Insert a picture at the cursor (you can also paste or drop one into the text)" disabled={source || imgBusy} onClick={() => fileRef.current?.click()}>{imgBusy ? "Uploading…" : "Picture"}</Btn>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void insertImageFile(f); e.target.value = ""; }} />
        <Btn title="Remove link" disabled={source || !editor.isActive("link")} onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}>Unlink</Btn>
        <Btn title="Align left" active={editor.isActive({ textAlign: "left" })} disabled={source} onClick={() => align("left")}>&#8676;</Btn>
        <Btn title="Align centre" active={editor.isActive({ textAlign: "center" })} disabled={source} onClick={() => align("center")}>&#8596;</Btn>
        <Btn title="Align right" active={editor.isActive({ textAlign: "right" })} disabled={source} onClick={() => align("right")}>&#8677;</Btn>
        <Btn title="Horizontal separator" disabled={source} onClick={() => editor.chain().focus().setHorizontalRule().run()}>&mdash;</Btn>
        <Btn title="Undo" disabled={source || !editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>Undo</Btn>
        <Btn title="Redo" disabled={source || !editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>Redo</Btn>
        <Btn title="Clear formatting" disabled={source} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>Clear</Btn>
        <Btn title={source ? "Back to the visual editor" : "Edit the HTML source"} active={source} onClick={toggleSource}>{source ? "Visual" : "HTML"}</Btn>
      </div>
      {imgError && <p role="alert" style={css("font-size:13px;color:var(--om-coral);margin:var(--space-2) 0;")}>{imgError}</p>}
      {source ? (
        <textarea
          aria-label="HTML source"
          className="input"
          spellCheck={false}
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          style={css(`min-height:${minHeight}px;font-family:ui-monospace,Menlo,monospace;font-size:13px;border-radius:0 0 var(--radius-md) var(--radius-md);`)}
        />
      ) : (
        <div style={css(`min-height:${minHeight}px;padding:var(--space-3);border:1px solid var(--color-divider);border-radius:0 0 var(--radius-md) var(--radius-md);font-size:16px;line-height:1.7;`)}>
          <EditorContent editor={editor} />
        </div>
      )}
      <style>{`
        .rte-editable{outline:none;min-height:${Math.max(120, minHeight - 40)}px;}
        .rte-editable p.is-editor-empty:first-child::before{content:attr(data-placeholder);opacity:0.4;float:left;height:0;pointer-events:none;}
        .rte-editable img{max-width:100%;height:auto;border-radius:6px;vertical-align:middle;}
        .rte-editable img.ProseMirror-selectednode{outline:2px solid var(--color-accent);}
        .rte-editable:focus-visible{outline:2px solid var(--color-accent);outline-offset:4px;}
      `}</style>
    </div>
  );
}
