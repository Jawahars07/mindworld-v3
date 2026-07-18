"use client";

import { SHEETS } from "@/lib/sheets";
import { ROOMS } from "@/lib/rooms";
import { REGISTRY } from "@/lib/registry";

// No-WebGL fallback: the same sheets as a flat drawing set, plus the project
// index and the live skill-registry line. Content parity, zero canvas.
export default function StaticFallback() {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-night">
      <div className="max-w-2xl mx-auto px-5 py-14 space-y-6">
        <p className="font-plot text-accent text-xs tracking-[0.4em]">MINDWORLD OS · FLAT DRAWING SET</p>
        <h1 className="text-limestone text-4xl font-bold tracking-tight">JAWAHAR NAIDU</h1>
        <p className="text-inkline">I get AI adopted inside real businesses — strategy first, then the build.</p>
        <p className="font-plot text-[11px] text-blueprint/80">
          {REGISTRY.total} Claude Code skills installed locally · {REGISTRY.authored} authored — a working
          agentic system, not a metaphor.
        </p>
        {SHEETS.map((s) => (
          <section key={s.no} className="titleblock p-5">
            <div className="flex items-baseline justify-between font-plot text-[10px] tracking-[0.28em] text-blueprint/90">
              <span>SHEET {s.no} / 06</span>
              <span>BLUEPRINT CITY</span>
            </div>
            <h2 className="text-limestone text-xl font-semibold mt-2">{s.title}</h2>
            <p className="text-inkline text-sm leading-relaxed mt-2">{s.body}</p>
            {s.links && (
              <div className="flex flex-wrap gap-2 mt-3">
                {s.links.map((l) => (
                  <a key={l.href} href={l.href} className="font-plot text-[10px] tracking-[0.2em] border border-blueprint/50 text-blueprint px-3 py-1.5">
                    {l.label}
                  </a>
                ))}
              </div>
            )}
            <div className="rule mt-3 pt-2 font-plot text-[9px] tracking-[0.18em] text-blueprint/60">{s.meta}</div>
          </section>
        ))}
        <section className="titleblock p-5">
          <h2 className="text-limestone text-xl font-semibold">PROJECT INDEX</h2>
          {ROOMS.map((r) => (
            <div key={r.slug} className="mt-4">
              <p className="text-limestone/90 text-sm font-semibold">
                {r.name} {r.flagship ? "· FLAGSHIP" : ""}
              </p>
              <p className="text-inkline text-sm leading-relaxed mt-1">{r.tagline}</p>
              <p className="font-plot text-[10px] text-accent/90 mt-1">{r.metric}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {r.links.map((l) => (
                  <a key={l.href} href={l.href} className="font-plot text-[10px] tracking-[0.2em] border border-blueprint/50 text-blueprint px-3 py-1.5">
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
