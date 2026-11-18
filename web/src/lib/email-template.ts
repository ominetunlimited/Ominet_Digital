// Branded, table-based HTML email (works in Gmail, Outlook and mobile clients).
// Every dynamic value goes through esc() before it is placed in the markup.

const INDIGO = "#160E3D";
const IVORY = "#F6F4FA";
const CYAN = "#02C8ED";
const AZURE = "#0B8FD6";

export function esc(v: unknown): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export type EmailRow = [label: string, value: string | null | undefined];

export function brandedEmail(opts: {
  siteUrl: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  rows?: EmailRow[];
  button?: { label: string; href: string };
}): { html: string; text: string } {
  const rows = (opts.rows ?? []).filter(([, v]) => v && String(v).trim());
  const rowHtml = rows
    .map(([k, v]) => `<tr><td style="padding:8px 12px;font-size:13px;color:#6b6585;width:38%;vertical-align:top;border-bottom:1px solid #e7e3f2;">${esc(k)}</td><td style="padding:8px 12px;font-size:14px;color:${INDIGO};border-bottom:1px solid #e7e3f2;white-space:pre-wrap;">${esc(v)}</td></tr>`)
    .join("");
  const html = `<!doctype html><html><body style="margin:0;background:${IVORY};font-family:Helvetica,Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${IVORY};padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;">
<tr><td style="background:${INDIGO};padding:20px 24px;">
<img src="${esc(opts.siteUrl)}/images/ominet-digital-logo.png" alt="Ominet Digital" height="36" style="display:inline-block;vertical-align:middle;height:36px;border:0;">
<span style="display:inline-block;vertical-align:middle;margin-left:10px;color:#ffffff;font-family:Georgia,serif;font-size:18px;letter-spacing:3px;">OMINET DIGITAL</span>
</td></tr>
<tr><td style="height:4px;background:${CYAN};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:28px 24px 8px;">
<h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:24px;line-height:1.25;color:${INDIGO};">${esc(opts.heading)}</h1>
${opts.paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#2d2750;">${esc(p)}</p>`).join("")}
</td></tr>
${rowHtml ? `<tr><td style="padding:4px 24px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e7e3f2;border-radius:8px;">${rowHtml}</table></td></tr>` : ""}
${opts.button ? `<tr><td style="padding:4px 24px 24px;"><a href="${esc(opts.button.href)}" style="display:inline-block;background:${CYAN};color:${INDIGO};font-weight:700;font-size:14px;text-decoration:none;padding:12px 22px;border-radius:8px;">${esc(opts.button.label)}</a></td></tr>` : ""}
<tr><td style="background:${IVORY};padding:18px 24px;font-size:12px;line-height:1.7;color:#6b6585;">
<strong style="color:${INDIGO};">Ominet Digital</strong><br>Creative Solutions. Professional Excellence.<br>
<a href="${esc(opts.siteUrl)}" style="color:${AZURE};">${esc(opts.siteUrl.replace(/^https?:\/\//, ""))}</a> &middot; <a href="mailto:info@ominetdigital.com.ng" style="color:${AZURE};">info@ominetdigital.com.ng</a> &middot; WhatsApp +234 902 605 7899
</td></tr>
</table></td></tr></table></body></html>`;
  const text = [opts.heading, "", ...opts.paragraphs, "", ...rows.map(([k, v]) => `${k}: ${v}`), opts.button ? `\n${opts.button.label}: ${opts.button.href}` : "", "\nOminet Digital | Creative Solutions. Professional Excellence.\nhttps://www.ominetdigital.com.ng | info@ominetdigital.com.ng | WhatsApp +234 902 605 7899"].join("\n");
  return { html, text };
}
