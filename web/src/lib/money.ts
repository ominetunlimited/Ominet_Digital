// Prices are stored in minor units (kobo/cents) because that's what
// Paystack takes — but people think and type in whole currency (₦4,500),
// so nothing user-facing should ever show or ask for the raw minor number.

const SYMBOLS: Record<string, string> = { NGN: "₦", USD: "$", GBP: "£", EUR: "€" };

export function currencySymbol(currency: string | null | undefined): string {
  const code = (currency || "NGN").toUpperCase();
  return SYMBOLS[code] ?? `${code} `;
}

/** 450000 (kobo) -> "₦4,500.00" */
export function formatMoney(minor: number | null | undefined, currency: string | null | undefined): string {
  if (minor == null) return "—";
  const major = minor / 100;
  return `${currencySymbol(currency)}${major.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 450000 -> "4500.00" (for an editable input's value) */
export function minorToMajorString(minor: number | null | undefined): string {
  if (minor == null) return "";
  return (minor / 100).toFixed(2);
}

/** "4,500.50" or "4500" -> 450050 ; empty/invalid -> null */
export function majorStringToMinor(input: string): number | null {
  const cleaned = input.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
