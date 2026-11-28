import Image from "next/image";

/** Every platform icon available in /public/images/social (colour) and /public/images/social/black. */
export const SOCIAL_LOGOS = [
  "facebook", "x", "instagram", "tiktok", "discord",
  "snapchat", "youtube", "whatsapp", "behance", "threads",
  "linkedin", "dribbble", "pinterest", "twitch", "telegram",
] as const;
export type SocialLogoName = (typeof SOCIAL_LOGOS)[number];

/**
 * A platform icon, decorative by default (alt is empty), so put it inside a link or button that carries the label.
 * `variant="black"` gives the single-colour set, which suits footers and print.
 * Usage: <SocialLogo name="youtube" size={32} />
 */
export default function SocialLogo({
  name,
  size = 32,
  variant = "colour",
  alt = "",
  priority = false,
}: {
  name: SocialLogoName;
  size?: number;
  variant?: "colour" | "black";
  alt?: string;
  priority?: boolean;
}) {
  const src = variant === "black" ? `/images/social/black/${name}.png` : `/images/social/${name}.png`;
  return <Image src={src} width={size} height={size} alt={alt} unoptimized priority={priority} loading={priority ? undefined : "lazy"} style={{ display: "block", width: size, height: size }} />;
}
