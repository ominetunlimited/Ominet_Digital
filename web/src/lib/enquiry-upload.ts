// Shared rules for files attached to project enquiries. The browser only helps; the server enforces everything.
export const MAX_FILE_BYTES = 4 * 1024 * 1024; // stays under the serverless request body limit
export const MAX_FILES = 5;

type Kind = { ext: string[]; mime: string; magic: (b: Uint8Array) => boolean };
const starts = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);
const ZIP = (b: Uint8Array) => starts(b, [0x50, 0x4b, 0x03, 0x04]);

const OOXML = "application/vnd.openxmlformats-officedocument";
export const KINDS: Kind[] = [
  { ext: ["pdf"], mime: "application/pdf", magic: (b) => starts(b, [0x25, 0x50, 0x44, 0x46]) },
  { ext: ["png"], mime: "image/png", magic: (b) => starts(b, [0x89, 0x50, 0x4e, 0x47]) },
  { ext: ["jpg", "jpeg"], mime: "image/jpeg", magic: (b) => starts(b, [0xff, 0xd8, 0xff]) },
  { ext: ["webp"], mime: "image/webp", magic: (b) => starts(b, [0x52, 0x49, 0x46, 0x46]) && starts(b, [0x57, 0x45, 0x42, 0x50], 8) },
  { ext: ["docx"], mime: `${OOXML}.wordprocessingml.document`, magic: ZIP },
  { ext: ["xlsx"], mime: `${OOXML}.spreadsheetml.sheet`, magic: ZIP },
  { ext: ["pptx"], mime: `${OOXML}.presentationml.presentation`, magic: ZIP },
];
export const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.pptx";
export const ACCEPT_LABEL = "PDF, PNG, JPG, WebP, Word, Excel or PowerPoint, up to 4 MB each, 5 files";

export const extOf = (name: string) => (name.split(".").pop() ?? "").toLowerCase();

/** Returns the trusted MIME type, or null when the name and the file's real bytes do not agree. */
export function detectKind(name: string, head: Uint8Array): string | null {
  const k = KINDS.find((x) => x.ext.includes(extOf(name)));
  return k && k.magic(head) ? k.mime : null;
}

/** Keeps only safe characters so the stored path cannot be steered by a crafted file name. */
export function safeName(name: string): string {
  const base = name.replace(/^.*[\\/]/, "").normalize("NFKD").replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "_").replace(/^\.+/, "");
  return base.slice(-80) || "file";
}
export const prettySize = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
