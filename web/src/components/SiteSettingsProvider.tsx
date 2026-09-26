"use client";

import { createContext, useContext } from "react";
import { DEFAULT_SETTINGS, type SocialLink } from "@/lib/site-settings-validate";

type ClientSettings = { social: SocialLink[]; siteName: string };
const Ctx = createContext<ClientSettings>({ social: DEFAULT_SETTINGS.social, siteName: DEFAULT_SETTINGS.identity.siteName });

/** Hands the few settings that client components (the nav bar) need down from the server layout. */
export function SiteSettingsProvider({ value, children }: { value: ClientSettings; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteSettings() {
  return useContext(Ctx);
}
