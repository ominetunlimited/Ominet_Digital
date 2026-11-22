/**
 * Turns whatever was typed into the admin ("09026057899", "+234 902 605 7899", "2349026057899")
 * into the digits-only international form wa.me requires. A Nigerian local number with a
 * leading 0 gets the 234 country code. Anything else is returned as digits unchanged.
 */
export function normaliseWhatsApp(raw: string | null | undefined): string {
  let d = (raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (/^0\d{10}$/.test(d)) d = "234" + d.slice(1);
  return d;
}
