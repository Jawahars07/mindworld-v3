"use client";

import { useEffect, useState } from "react";
import { useWorld } from "@/lib/store";
import { trackClick } from "@/lib/analytics";

// Persistent OS chrome, top edge. Replaces the old Hud link rail:
// wordmark · live clock · CV / EMAIL / GITHUB · ⌘K.

const LINKS = [
  { label: "CV ↓", href: "/Jawahar_Naidu_CV.pdf" },
  { label: "EMAIL", href: "mailto:jawaharnaidu07@gmail.com" },
  { label: "GITHUB", href: "https://github.com/Jawahars07" },
];

export default function TopBar() {
  const booted = useWorld((s) => s.booted);
  const setPaletteOpen = useWorld((s) => s.setPaletteOpen);
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className={`fixed z-40 top-0 inset-x-0 flex items-center justify-between px-3 md:px-5 h-11 border-b border-blueprint/15 bg-night/55 backdrop-blur-sm transition-opacity duration-700 ${
        booted ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 font-plot text-[10px] tracking-[0.25em]">
        <span className="text-accent">MINDWORLD OS</span>
        <span className="hidden md:inline text-blueprint/40">v1.0</span>
        <span suppressHydrationWarning className="hidden md:inline text-blueprint/60 tabular-nums">{time}</span>
      </div>
      <nav className="flex items-center gap-1.5 md:gap-2">
        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target={l.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            onClick={() => trackClick(l.label, l.href)}
            className="font-plot text-[10px] tracking-[0.2em] border border-blueprint/50 text-blueprint px-2.5 py-1 hover:bg-blueprint hover:text-night transition-colors"
          >
            {l.label}
          </a>
        ))}
        <button
          onClick={() => setPaletteOpen(true)}
          aria-label="⌘K — open the command palette"
          className="font-plot text-[10px] tracking-[0.15em] border border-accent/60 text-accent px-2.5 py-1 hover:bg-accent hover:text-night transition-colors"
        >
          ⌘K
        </button>
      </nav>
    </header>
  );
}
