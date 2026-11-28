// Carries the confirmation of a submitted project enquiry from the form to /thank-you.
// It lives in sessionStorage (this tab only, gone when the tab closes), so the reference never
// appears in a URL, a server log or browser history. A direct visit has no receipt, and the
// thank-you page then shows a neutral message instead of pretending something was sent.

const KEY = "omd-enquiry-receipt";

export type EnquiryReceipt = { reference: string; ack: boolean };

let memory: string | null = null; // used if sessionStorage is blocked

export function saveEnquiryReceipt(r: EnquiryReceipt) {
  const raw = JSON.stringify({ reference: r.reference.slice(0, 40), ack: r.ack === true });
  memory = raw;
  try {
    sessionStorage.setItem(KEY, raw);
  } catch {}
}

export function readRawEnquiryReceipt(): string | null {
  try {
    return sessionStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

export function parseEnquiryReceipt(raw: string | null): EnquiryReceipt | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<EnquiryReceipt>;
    if (typeof v.reference !== "string" || !v.reference.trim()) return null;
    return { reference: v.reference.slice(0, 40), ack: v.ack === true };
  } catch {
    return null;
  }
}
