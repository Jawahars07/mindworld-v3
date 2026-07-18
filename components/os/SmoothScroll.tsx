"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { setLenis } from "@/lib/nav";

// Lenis smooth scroll over the native scrollbar. The page still scrolls the
// real document (Lenis animates scrollTop and fires native scroll events), so
// ScrollDriver and every store consumer stay untouched — this only shapes the
// FEEL of the wheel. Skipped entirely under prefers-reduced-motion.

export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      lerp: 0.09, // weighty, cinematic catch-up
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });
    setLenis(lenis);
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      setLenis(null);
      lenis.destroy();
    };
  }, []);
  return null;
}
