"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, type StaffSupabase } from "@/lib/auth/guard";
import { AD_KINDS, AD_STATUSES, CAMPAIGN_STATUSES, checkDates, validateDestination, validateImageUrl } from "@/lib/ad-validate";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };
export type PlainResult = { ok: true } | { ok: false; error: string };

type Db = StaffSupabase;

async function staffClient(): Promise<{ ok: true; supabase: Db } | { ok: false; error: string }> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  return { ok: true, supabase: auth.supabase };
}

function refresh() {
  revalidatePath("/admin/advertising", "layout");
  // Ads sit on many public pages (including the footer everywhere).
  revalidatePath("/", "layout");
}

const friendly = (message: string) =>
  /(ad_advertisers|ad_campaigns|ad_events|"ads"|relation "ads")/.test(message) && /(does not exist|schema cache)/i.test(message)
    ? "The advertising tables don't exist yet — run migration 0017_advertising.sql in the Supabase SQL Editor."
    : message;

const trimTo = (s: string, n: number) => s.trim().slice(0, n);

// ── Advertisers ──────────────────────────────────────────────────────────

export type AdvertiserInput = { id?: string; name: string; website: string; contactName: string; contactEmail: string; notes: string; status: "active" | "archived" };

export async function saveAdvertiser(input: AdvertiserInput): Promise<SaveResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const name = trimTo(input.name, 160);
  if (!name) return { ok: false, error: "Enter the advertiser's name." };

  let website: string | null = null;
  if (input.website.trim()) {
    const checked = validateDestination(input.website);
    if (!checked.ok || checked.url.startsWith("/")) return { ok: false, error: "The advertiser's website must be a full https:// address." };
    website = checked.url;
  }
  const email = trimTo(input.contactEmail, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "That contact email doesn't look right." };

  const row = {
    name,
    website,
    contact_name: trimTo(input.contactName, 160) || null,
    contact_email: email || null,
    notes: trimTo(input.notes, 2000) || null,
    status: input.status === "archived" ? "archived" : "active",
    updated_at: new Date().toISOString(),
  };
  if (input.id) {
    const { error } = await auth.supabase.from("ad_advertisers").update(row).eq("id", input.id);
    if (error) return { ok: false, error: friendly(error.message) };
    refresh();
    return { ok: true, id: input.id };
  }
  const { data, error } = await auth.supabase.from("ad_advertisers").insert(row).select("id").single();
  if (error || !data) return { ok: false, error: friendly(error?.message ?? "Couldn't save.") };
  refresh();
  return { ok: true, id: data.id };
}

export async function deleteAdvertiser(id: string): Promise<PlainResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("ad_advertisers").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh();
  return { ok: true };
}

// ── Campaigns ────────────────────────────────────────────────────────────

export type CampaignInput = {
  id?: string;
  advertiserId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  feeCents: number | null;
  feeNote: string;
  status: string;
};

export async function saveCampaign(input: CampaignInput): Promise<SaveResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const name = trimTo(input.name, 160);
  if (!input.advertiserId) return { ok: false, error: "Choose the advertiser this campaign is for." };
  if (!name) return { ok: false, error: "Give the campaign a name." };
  if (!(CAMPAIGN_STATUSES as readonly string[]).includes(input.status)) return { ok: false, error: "Choose a valid status." };
  const dateProblem = checkDates(input.startsOn, input.endsOn);
  if (dateProblem) return { ok: false, error: dateProblem };
  if (input.feeCents !== null && (!Number.isInteger(input.feeCents) || input.feeCents < 0)) return { ok: false, error: "The fee can't be negative." };

  const row = {
    advertiser_id: input.advertiserId,
    name,
    starts_on: input.startsOn || null,
    ends_on: input.endsOn || null,
    fee_cents: input.feeCents,
    currency: "NGN",
    fee_note: trimTo(input.feeNote, 500) || null,
    status: input.status,
    updated_at: new Date().toISOString(),
  };
  if (input.id) {
    const { error } = await auth.supabase.from("ad_campaigns").update(row).eq("id", input.id);
    if (error) return { ok: false, error: friendly(error.message) };
    refresh();
    return { ok: true, id: input.id };
  }
  const { data, error } = await auth.supabase.from("ad_campaigns").insert(row).select("id").single();
  if (error || !data) return { ok: false, error: friendly(error?.message ?? "Couldn't save.") };
  refresh();
  return { ok: true, id: data.id };
}

export async function setCampaignStatus(id: string, status: string): Promise<PlainResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  if (!(CAMPAIGN_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Choose a valid status." };
  const { error } = await auth.supabase.from("ad_campaigns").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh();
  return { ok: true };
}

export async function deleteCampaign(id: string): Promise<PlainResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("ad_campaigns").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh();
  return { ok: true };
}

// ── Ads ──────────────────────────────────────────────────────────────────

export type AdInput = {
  id?: string;
  campaignId: string;
  slotKey: string;
  kind: string;
  title: string;
  headline: string;
  imageUrl: string;
  imageAlt: string;
  portrait: boolean;
  destinationUrl: string;
  ctaLabel: string;
  status: string;
  featured: boolean;
};

export async function saveAd(input: AdInput): Promise<SaveResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;

  const title = trimTo(input.title, 160);
  if (!title) return { ok: false, error: "Give the ad a name (only you see this)." };
  if (!input.campaignId) return { ok: false, error: "Choose the campaign this ad belongs to." };
  if (!input.slotKey) return { ok: false, error: "Choose where the ad should appear." };
  if (!AD_KINDS.some((k) => k.value === input.kind)) return { ok: false, error: "Choose what kind of ad this is." };
  if (!(AD_STATUSES as readonly string[]).includes(input.status)) return { ok: false, error: "Choose a valid status." };

  const dest = validateDestination(input.destinationUrl);
  if (!dest.ok) return dest;
  const image = validateImageUrl(input.imageUrl);
  if (!image.ok) return image;
  const headline = trimTo(input.headline, 200);
  if (!image.url && !headline) return { ok: false, error: "Add an image or a headline — an ad needs something to show." };

  const row = {
    campaign_id: input.campaignId,
    slot_key: input.slotKey,
    kind: input.kind,
    title,
    headline: headline || null,
    image_url: image.url,
    image_alt: trimTo(input.imageAlt, 200) || null,
    portrait: input.portrait,
    destination_url: dest.url,
    cta_label: trimTo(input.ctaLabel, 40) || null,
    status: input.status,
    featured: input.featured,
    updated_at: new Date().toISOString(),
  };
  if (input.id) {
    const { error } = await auth.supabase.from("ads").update(row).eq("id", input.id);
    if (error) return { ok: false, error: friendly(error.message) };
    refresh();
    return { ok: true, id: input.id };
  }
  const { data, error } = await auth.supabase.from("ads").insert(row).select("id").single();
  if (error || !data) return { ok: false, error: friendly(error?.message ?? "Couldn't save.") };
  refresh();
  return { ok: true, id: data.id };
}

export async function setAdStatus(id: string, status: string): Promise<PlainResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  if (!(AD_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Choose a valid status." };
  const { error } = await auth.supabase.from("ads").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh();
  return { ok: true };
}

export async function setAdFeatured(id: string, featured: boolean): Promise<PlainResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("ads").update({ featured, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh();
  return { ok: true };
}

export async function deleteAd(id: string): Promise<PlainResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("ads").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh();
  return { ok: true };
}
