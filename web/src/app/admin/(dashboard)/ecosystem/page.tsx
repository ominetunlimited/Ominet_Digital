import { css } from "@/lib/css";
import { listEcosystemApps } from "@/lib/admin/ecosystem-apps-actions";
import EcosystemAppsManager from "@/components/admin/EcosystemAppsManager";

export const metadata = { title: "Ecosystem apps — Admin", robots: { index: false, follow: false } };

export default async function EcosystemAppsPage() {
  const apps = await listEcosystemApps();
  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Ecosystem apps</h1>
      <p style={css("font-size:14px;opacity:0.7;margin:0 0 var(--space-6);")}>
        PROFILE and Cortexa Office each have their own dedicated page on this site (their private/public switch is in Site settings). Anything else you
        build — a new app, a partner business, a client site — goes here. Public entries with a logo appear in the Partners &amp; Services strip on the
        homepage, Profile and Cortexa Office.
      </p>
      <EcosystemAppsManager initial={apps} />
    </div>
  );
}
