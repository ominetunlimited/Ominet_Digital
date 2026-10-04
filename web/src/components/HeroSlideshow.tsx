"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { HeroSlide } from "@/lib/data";

const INTERVAL_MS = 6000;

/**
 * Admin-controlled hero slideshow (Admin -> Media Library -> edit an image
 * -> "Show in the homepage hero slideshow"). Falls back to a single static
 * image — unchanged from before this component existed — when no slides
 * are configured, so a site that hasn't set this up looks exactly as it did.
 */
export default function HeroSlideshow({ slides, fallbackImageUrl }: { slides: HeroSlide[]; fallbackImageUrl: string }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (count < 2 || paused || reducedMotion.current) return;
    const id = setInterval(() => setCurrent((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(id);
  }, [count, paused]);

  if (count === 0) {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <Image src={fallbackImageUrl || "/images/hero-home.jpg"} alt="" fill sizes="(max-width: 900px) 100vw, 640px" style={{ objectFit: "cover" }} priority />
      </div>
    );
  }

  const active = slides[current];

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          aria-hidden={i !== current}
          style={{
            position: "absolute",
            inset: 0,
            opacity: i === current ? 1 : 0,
            transition: "opacity 1100ms ease",
            pointerEvents: i === current ? "auto" : "none",
          }}
        >
          <Image src={s.url} alt={s.altText ?? ""} fill sizes="(max-width: 900px) 100vw, 640px" style={{ objectFit: "cover" }} priority={i === 0} />
        </div>
      ))}

      {active.attribution && (
        <a
          href={active.attributionUrl ?? undefined}
          target={active.attributionUrl ? "_blank" : undefined}
          rel={active.attributionUrl ? "noopener noreferrer" : undefined}
          style={{
            position: "absolute",
            right: 10,
            bottom: count > 1 ? 36 : 10,
            fontSize: 11,
            color: "rgba(255,255,255,0.85)",
            background: "rgba(0,0,0,0.35)",
            padding: "3px 8px",
            borderRadius: 999,
            textDecoration: "none",
            pointerEvents: active.attributionUrl ? "auto" : "none",
          }}
        >
          {active.attribution}
        </a>
      )}

      {count > 1 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 10, display: "flex", justifyContent: "center", gap: 6 }}>
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Show slide ${i + 1} of ${count}`}
              aria-current={i === current}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 18 : 7,
                height: 7,
                borderRadius: 999,
                border: "none",
                background: i === current ? "#fff" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                padding: 0,
                transition: "width 200ms ease, background 200ms ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
