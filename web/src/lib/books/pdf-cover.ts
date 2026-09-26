import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import type { CoverResult } from "./cover";

const TARGET_WIDTH = 900;
/** Renders the real first page of a PDF as a JPEG. */
export async function renderPdfFirstPage(bytes: Uint8Array): Promise<CoverResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    standardFontDataUrl: `${path.join(process.cwd(), "node_modules", "pdfjs-dist", "standard_fonts").replace(/\\/g, "/")}/`,
    useSystemFonts: false,
    disableFontFace: true,
    verbosity: 0,
  });
  try {
    const doc = await task.promise;
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: TARGET_WIDTH / base.width });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas: canvas as unknown as HTMLCanvasElement, canvasContext: context as unknown as CanvasRenderingContext2D, viewport }).promise;
    const jpeg = canvas.toBuffer("image/jpeg", 85);
    return { ok: true, bytes: new Uint8Array(jpeg), mime: "image/jpeg", source: "First page of the PDF" };
  } finally {
    await task.destroy();
  }
}
