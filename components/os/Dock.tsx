"use client";

import { useWorld } from "@/lib/store";
import { travelTo } from "@/lib/nav";
import { trackClick } from "@/lib/analytics";

// Minimal dock, bottom-center: the four destinations of the world.
// Galaxy is an overlay destination; the rest are points on the camera route.

export default function Dock() {
  const booted = useWorld((s) => s.booted);
  const setGalaxyOpen = useWorld((s) => s.setGalaxyOpen);
  const setMode = useWorld((s) => s.setMode);

  const items: { label: string; go: () => void }[] = [
    { label: "STORY", go: () => travelTo(0.09) },
    { label: "PROJECTS", go: () => travelTo(0.6) },
    { label: "GALAXY", go: () => setGalaxyOpen(true) },
    { label: "CONTACT", go: () => travelTo(0.97) },
  ];

  return (
    <nav
      aria-label="World destinations"
      className={`fixed z-40 bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 border border-blueprint/25 bg-night/60 backdrop-blur-sm px-1.5 py-1 transition-opacity duration-700 ${
        booted ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <button
        onClick={() => {
          trackClick("dock:TOUR", "");
          setMode("recruiter");
        }}
        className="font-plot text-[9px] md:text-[10px] tracking-[0.2em] text-accent px-2.5 md:px-3 py-1.5 border-r border-blueprint/20 hover:bg-accent hover:text-night transition-colors"
      >
        ▶ 90S TOUR
      </button>
      {items.map((it) => (
        <button
          key={it.label}
          onClick={() => {
            setMode("explore");
            trackClick(`dock:${it.label}`, "");
            it.go();
          }}
          className="font-plot text-[9px] md:text-[10px] tracking-[0.2em] text-blueprint/80 px-2.5 md:px-3 py-1.5 hover:text-night hover:bg-blueprint transition-colors"
        >
          {it.label}
        </button>
      ))}
    </nav>
  );
}
