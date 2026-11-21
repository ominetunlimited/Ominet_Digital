// ads.txt is served only when an AdSense publisher ID is configured. Without one the file does not exist (404),
// rather than publishing a placeholder that could be mistaken for an authorisation.
export const dynamic = "force-static";

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";
  const m = /^ca-(pub-\d{8,20})$/.exec(client.trim());
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(`google.com, ${m[1]}, DIRECT, f08c47fec0942fa0\n`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
