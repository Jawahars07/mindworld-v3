"use client";

import { SHEETS } from "@/lib/sheets";

// No-WebGL fallback: the same seven sheets as a flat drawing set.
// Content parity, zero canvas.
export default function StaticFallback() {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-night">
      <div className="max-w-2xl mx-auto px-5 py-14 space-y-6">
        <p className="font-plot text-blueprint/80 text-xs tracking-[0.4em]">BLUEPRINT CITY · FLAT DRAWING SET</p>
        <h1 className="text-limestone text-4xl font-bold tracking-tight">JAWAHAR NAIDU</h1>
        <p className="text-inkline">I get AI adopted inside real businesses — strategy first, then the build.</p>
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
      </div>
    </div>
  );
}
