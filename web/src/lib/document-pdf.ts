import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";
import { Parser } from "htmlparser2";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sanitizeRichHtml } from "@/lib/rich-text";
import type { DocData } from "@/lib/documents";

const INDIGO = rgb(0x16 / 255, 0x0e / 255, 0x3d / 255);
const CYAN = rgb(0x02 / 255, 0xc8 / 255, 0xed / 255);
const AZURE = rgb(0x0b / 255, 0x8f / 255, 0xd6 / 255);
const INK = rgb(0.17, 0.15, 0.31);
const MUTED = rgb(0.42, 0.4, 0.52);
const RULE = rgb(0.9, 0.89, 0.95);
const W = 595.28, H = 841.89, M = 48;
const CW = W - M * 2;

type Run = { text: string; bold?: boolean; italic?: boolean; link?: boolean };
type Block =
  | { t: "p" | "h"; level?: number; runs: Run[]; align?: "left" | "center" | "right" }
  | { t: "li"; runs: Run[]; marker: string; depth: number }
  | { t: "quote"; runs: Run[] };

/** Turns the sanitised editor HTML into simple blocks the PDF can lay out. */
export function htmlToBlocks(html: string): Block[] {
  const clean = sanitizeRichHtml(html);
  const blocks: Block[] = [];
  let runs: Run[] = [];
  let bold = 0, italic = 0, link = 0, quote = 0;
  const lists: { ordered: boolean; n: number }[] = [];
  let cur: { kind: "p" | "h" | "li" | "quote"; level?: number; align?: "left" | "center" | "right" } | null = null;

  const flush = () => {
    if (!cur) return;
    const text = runs.map((r) => r.text).join("").trim();
    if (text) {
      const trimmed = runs.slice();
      if (cur.kind === "li") {
        const top = lists[lists.length - 1];
        const marker = top?.ordered ? `${top.n}.` : "•";
        blocks.push({ t: "li", runs: trimmed, marker, depth: Math.max(0, lists.length - 1) });
      } else if (cur.kind === "h") blocks.push({ t: "h", level: cur.level, runs: trimmed });
      else if (quote) blocks.push({ t: "quote", runs: trimmed });
      else blocks.push({ t: "p", runs: trimmed, align: cur.align });
    }
    runs = []; cur = null;
  };

  const parser = new Parser({
    onopentag(name, attrs) {
      if (name === "ul" || name === "ol") { flush(); lists.push({ ordered: name === "ol", n: 0 }); }
      else if (name === "li") { flush(); const l = lists[lists.length - 1]; if (l) l.n++; cur = { kind: "li" }; }
      else if (/^h[1-4]$/.test(name)) { flush(); cur = { kind: "h", level: Number(name[1]) }; }
      else if (name === "blockquote") { flush(); quote++; }
      else if (name === "p") {
        flush();
        const m = /text-align:\s*(left|center|right)/.exec(attrs.style ?? "");
        cur = { kind: quote ? "quote" : "p", align: (m?.[1] as "left" | "center" | "right") ?? "left" };
      }
      else if (name === "strong" || name === "b") bold++;
      else if (name === "em" || name === "i") italic++;
      else if (name === "a") link++;
      else if (name === "br") runs.push({ text: "\n" });
    },
    ontext(text) {
      if (!cur) { if (!text.trim()) return; cur = { kind: "p" }; }
      runs.push({ text, bold: bold > 0 || cur.kind === "h", italic: italic > 0, link: link > 0 });
    },
    onclosetag(name) {
      if (name === "p" || name === "li" || /^h[1-4]$/.test(name)) flush();
      else if (name === "ul" || name === "ol") { flush(); lists.pop(); }
      else if (name === "blockquote") { flush(); quote = Math.max(0, quote - 1); }
      else if (name === "strong" || name === "b") bold = Math.max(0, bold - 1);
      else if (name === "em" || name === "i") italic = Math.max(0, italic - 1);
      else if (name === "a") link = Math.max(0, link - 1);
    },
  }, { decodeEntities: true });
  parser.write(clean); parser.end(); flush();
  return blocks;
}

export type PdfInput = {
  title: string; number: string; status: "draft" | "issued" | "void";
  issuedAt: string | null; createdAt: string;
  introHtml: string; bodyHtml: string; footerHtml: string; data: DocData;
};

export async function renderDocumentPdf(d: PdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${d.title} ${d.number}`);
  pdf.setAuthor("Ominet Digital");
  pdf.setCreator("Ominet Digital");
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ital = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const boldItal = await pdf.embedFont(StandardFonts.HelveticaBoldOblique);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const chars = new Set(reg.getCharacterSet());

  let logo: PDFImage | null = null;
  try { logo = await pdf.embedPng(await readFile(path.join(process.cwd(), "public/images/ominet-digital-logo.png"))); } catch { logo = null; }

  /** Replaces anything the built-in fonts cannot draw, so a stray symbol can never break the file. */
  const safe = (s: string) => Array.from(s.replace(/\u20A6/g, "NGN ").replace(/[\u00a0\u2028\u2029]/g, " ")).map((ch) => (ch === "\n" || chars.has(ch.codePointAt(0)!) ? ch : "?")).join("");
  const fontFor = (r: Run): PDFFont => (r.bold && r.italic ? boldItal : r.bold ? bold : r.italic ? ital : reg);

  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;
  const pages: PDFPage[] = [page];

  const header = () => {
    page.drawRectangle({ x: 0, y: H - 78, width: W, height: 78, color: INDIGO });
    page.drawRectangle({ x: 0, y: H - 82, width: W, height: 4, color: CYAN });
    let x = M;
    if (logo) { const h = 40; const w = (logo.width / logo.height) * h; page.drawImage(logo, { x, y: H - 59, width: w, height: h }); x += w + 12; }
    page.drawText("OMINET DIGITAL", { x, y: H - 46, size: 15, font: serif, color: rgb(1, 1, 1) });
    page.drawText("ominetdigital.com.ng", { x, y: H - 62, size: 8.5, font: reg, color: rgb(0.8, 0.85, 0.95) });
    y = H - 82 - 30;
  };
  const newPage = () => { page = pdf.addPage([W, H]); pages.push(page); y = H - M; };
  const ensure = (h: number) => { if (y - h < M + 28) newPage(); };

  /** Word-wraps runs into lines of {run, text} pieces for a given width. */
  const layout = (runs: Run[], size: number, width: number): { r: Run; text: string; w: number; gap: number }[][] => {
    const lines: { r: Run; text: string; w: number; gap: number }[][] = [[]];
    let lineW = 0;
    const space = (r: Run) => fontFor(r).widthOfTextAtSize(" ", size);
    for (const r of runs) {
      const text = safe(r.text);
      const parts = text.split(/(\n)/);
      for (const part of parts) {
        if (part === "\n") { lines.push([]); lineW = 0; continue; }
        for (const word of part.split(/\s+/).filter(Boolean)) {
          const f = fontFor(r);
          const ww = f.widthOfTextAtSize(word, size);
          const cur = lines[lines.length - 1];
          const need = (cur.length ? space(r) : 0) + ww;
          if (lineW + need > width && cur.length) { lines.push([]); lineW = 0; }
          const line = lines[lines.length - 1];
          const gap = line.length ? space(r) : 0;
          line.push({ r, text: word, w: ww, gap });
          lineW += gap + ww;
        }
      }
    }
    return lines;
  };

  const drawRuns = (runs: Run[], o: { x: number; width: number; size: number; lead: number; color?: ReturnType<typeof rgb>; align?: "left" | "center" | "right" }) => {
    for (const line of layout(runs, o.size, o.width)) {
      ensure(o.lead);
      const total = line.reduce((s, p) => s + p.gap + p.w, 0);
      let x = o.x + (o.align === "right" ? o.width - total : o.align === "center" ? (o.width - total) / 2 : 0);
      for (const p of line) {
        x += p.gap;
        page.drawText(p.text, { x, y: y - o.size, size: o.size, font: fontFor(p.r), color: p.r.link ? AZURE : o.color ?? INK });
        x += p.w;
      }
      y -= o.lead;
    }
  };

  const text = (s: string, o: { x?: number; width?: number; size?: number; lead?: number; font?: "b" | "r"; color?: ReturnType<typeof rgb>; align?: "left" | "center" | "right" }) =>
    drawRuns([{ text: s, bold: o.font === "b" }], { x: o.x ?? M, width: o.width ?? CW, size: o.size ?? 10, lead: o.lead ?? (o.size ?? 10) * 1.45, color: o.color, align: o.align });

  const blocks = (html: string) => {
    for (const b of htmlToBlocks(html)) {
      if (b.t === "h") {
        y -= 6; ensure(30);
        drawRuns(b.runs, { x: M, width: CW, size: b.level && b.level <= 2 ? 13 : 11, lead: 17, color: INDIGO });
        y -= 2;
      } else if (b.t === "li") {
        const indent = 16 + b.depth * 16;
        ensure(15);
        page.drawText(safe(b.marker), { x: M + indent - 14, y: y - 10, size: 10, font: reg, color: AZURE });
        drawRuns(b.runs, { x: M + indent, width: CW - indent, size: 10, lead: 14.5 });
        y -= 2;
      } else if (b.t === "quote") {
        const start = y; ensure(16);
        drawRuns(b.runs.map((r) => ({ ...r, italic: true })), { x: M + 14, width: CW - 14, size: 10, lead: 14.5, color: MUTED });
        page.drawRectangle({ x: M + 2, y, width: 2, height: Math.max(4, start - y), color: CYAN });
        y -= 4;
      } else {
        drawRuns(b.runs, { x: M, width: CW, size: 10, lead: 14.5, align: b.align });
        y -= 6;
      }
    }
  };

  // ---- first page
  header();
  text(d.title.toUpperCase(), { size: 20, font: "b", color: INDIGO, lead: 26 });
  const issued = d.issuedAt ? new Date(d.issuedAt) : new Date(d.createdAt);
  const meta: [string, string][] = [["Number", d.number], [d.status === "issued" ? "Date issued" : "Date", issued.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" })], ...d.data.refs];
  for (const [k, v] of meta) {
    ensure(14);
    page.drawText(safe(k), { x: M, y: y - 9, size: 8.5, font: reg, color: MUTED });
    page.drawText(safe(v), { x: M + 120, y: y - 9, size: 9.5, font: bold, color: INK });
    y -= 14;
  }
  y -= 8;

  // client block
  ensure(60);
  page.drawRectangle({ x: M, y: y - 56, width: CW, height: 56, color: rgb(0.965, 0.957, 0.98) });
  page.drawText("PREPARED FOR", { x: M + 12, y: y - 15, size: 7.5, font: bold, color: MUTED });
  page.drawText(safe(d.data.client.name), { x: M + 12, y: y - 31, size: 12, font: bold, color: INDIGO });
  page.drawText(safe([d.data.client.email, d.data.client.phone].filter(Boolean).join("  |  ")), { x: M + 12, y: y - 45, size: 9, font: reg, color: INK });
  y -= 56 + 6;
  text(d.data.project, { size: 10, font: "b", color: INK });
  y -= 6;

  blocks(d.introHtml);

  // key facts
  if (d.data.rows.length) {
    y -= 4;
    for (const [k, v] of d.data.rows) {
      const lines = layout([{ text: v, bold: true }], 9.5, CW - 140);
      const h = Math.max(1, lines.length) * 13 + 7;
      ensure(h);
      page.drawLine({ start: { x: M, y: y - h + 2 }, end: { x: M + CW, y: y - h + 2 }, thickness: 0.5, color: RULE });
      page.drawText(safe(k), { x: M, y: y - 11, size: 9, font: reg, color: MUTED });
      const save = y;
      drawRuns([{ text: v, bold: true }], { x: M + 140, width: CW - 140, size: 9.5, lead: 13 });
      y = save - h;
    }
    y -= 8;
  }

  // milestones
  if (d.data.milestones.length) {
    ensure(40);
    text("Milestones", { size: 11, font: "b", color: INDIGO, lead: 18 });
    for (const m of d.data.milestones) {
      const lines = layout([{ text: m.title }], 9.5, CW - 200).length;
      const h = Math.max(1, lines) * 13 + 6;
      ensure(h);
      const save = y;
      drawRuns([{ text: m.title }], { x: M, width: CW - 200, size: 9.5, lead: 13 });
      if (m.due) page.drawText(safe(m.due), { x: M + CW - 190, y: save - 10, size: 9.5, font: reg, color: MUTED });
      if (m.amount) { const a = safe(m.amount); page.drawText(a, { x: M + CW - bold.widthOfTextAtSize(a, 9.5), y: save - 10, size: 9.5, font: bold, color: INK }); }
      y = save - h;
      page.drawLine({ start: { x: M, y: y + 3 }, end: { x: M + CW, y: y + 3 }, thickness: 0.5, color: RULE });
    }
    y -= 8;
  }

  // payments received
  if (d.data.payments.length) {
    ensure(40);
    text("Payments received", { size: 11, font: "b", color: INDIGO, lead: 18 });
    for (const p of d.data.payments) {
      ensure(18);
      page.drawText(safe(p.date), { x: M, y: y - 10, size: 9.5, font: reg, color: MUTED });
      page.drawText(safe(p.description), { x: M + 110, y: y - 10, size: 9.5, font: bold, color: INK });
      if (p.method) page.drawText(safe(p.method.slice(0, 40)), { x: M + 200, y: y - 10, size: 9, font: reg, color: MUTED });
      const a = safe(p.amount); page.drawText(a, { x: M + CW - bold.widthOfTextAtSize(a, 9.5), y: y - 10, size: 9.5, font: bold, color: INK });
      y -= 16;
      page.drawLine({ start: { x: M, y: y + 3 }, end: { x: M + CW, y: y + 3 }, thickness: 0.5, color: RULE });
    }
    y -= 8;
  }

  // totals
  if (d.data.totals.length) {
    ensure(d.data.totals.length * 20 + 10);
    for (const [k, v, strong] of d.data.totals) {
      const size = strong ? 12 : 10;
      const f = strong ? bold : reg;
      if (strong) page.drawRectangle({ x: M + CW / 2 - 6, y: y - 19, width: CW / 2 + 6, height: 21, color: rgb(0.93, 0.97, 1) });
      page.drawText(safe(k), { x: M + CW / 2, y: y - 13, size, font: f, color: strong ? INDIGO : INK });
      const val = safe(v); page.drawText(val, { x: M + CW - f.widthOfTextAtSize(val, size) - 6, y: y - 13, size, font: f, color: strong ? INDIGO : INK });
      y -= strong ? 24 : 18;
    }
    y -= 8;
  }

  blocks(d.bodyHtml);
  if (d.footerHtml) { y -= 4; blocks(d.footerHtml); }

  if (d.data.signatures) {
    ensure(110);
    y -= 24;
    const colW = (CW - 40) / 2;
    for (let i = 0; i < 2; i++) {
      const x = M + i * (colW + 40);
      page.drawLine({ start: { x, y: y - 40 }, end: { x: x + colW, y: y - 40 }, thickness: 0.8, color: INK });
      page.drawText(i === 0 ? "For Ominet Digital" : `For the client: ${safe(d.data.client.name)}`.slice(0, 48), { x, y: y - 54, size: 9, font: bold, color: INDIGO });
      page.drawText("Name, signature and date", { x, y: y - 66, size: 8, font: reg, color: MUTED });
    }
    y -= 80;
  }

  // footer on every page, and a clear mark on drafts and voided documents
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: M - 6 }, end: { x: W - M, y: M - 6 }, thickness: 0.5, color: RULE });
    p.drawText(safe(`Ominet Digital  |  ominetdigital.com.ng  |  info@ominetdigital.com.ng`), { x: M, y: M - 20, size: 8, font: reg, color: MUTED });
    const right = safe(`${d.number}  |  Page ${i + 1} of ${pages.length}`);
    p.drawText(right, { x: W - M - reg.widthOfTextAtSize(right, 8), y: M - 20, size: 8, font: reg, color: MUTED });
    if (d.status !== "issued") {
      const mark = d.status === "void" ? "VOID" : "DRAFT";
      p.drawText(mark, { x: W / 2 - bold.widthOfTextAtSize(mark, 90) / 2, y: H / 2 - 30, size: 90, font: bold, color: d.status === "void" ? rgb(0.9, 0.3, 0.3) : rgb(0.88, 0.88, 0.92), opacity: 0.35 });
    }
  });

  return pdf.save();
}
