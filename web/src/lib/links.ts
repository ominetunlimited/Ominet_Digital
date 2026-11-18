// Official external destinations used in more than one place.
export const AMAZON_AUTHOR_URL = "https://amazon.com/author/ominet";
export const OFFICIAL_EMAIL = "info@ominetdigital.com.ng";
export const OFFICIAL_WHATSAPP_NUMBER = "2349026057899";
export const OFFICIAL_WHATSAPP_DISPLAY = "+234 902 605 7899";

export function whatsappLink(text?: string): string {
  const base = `https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
