"use client";

import { useEffect, useState } from "react";
import { useWorld } from "@/lib/store";
import { SHEETS, sheetAt } from "@/lib/sheets";
import { trackClick } from "@/lib/analytics";

// All narration lives in the DOM (v2 lesson: no drei <Html> at depth).
// Identity: architectural drawing title blocks, bottom-left; progress rail, right edge.

export default function Hud() {
  const [progress, setProgress] = useState(0);
  useEffect(() => useWorld.subscribe((s) => setProgress(s.progress)), []);
  const sheet = sheetAt(progress);
  const isTitle = sheet.no === "00";

  return (
    <>
      {/* Sheet 00 hero — centered */}
      <div
        className={`hud-fade pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-center text-center px-6 ${
          isTitle ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="font-plot text-blueprint/80 text-xs tracking-[0.5em] mb-5">SHEET 00 · NIGHT ELEVATION</p>
        <h1 className="text-limestone text-5xl md:text-7xl font-bold tracking-tight leading-none [text-shadow:0_2px_24px_rgba(10,17,40,0.9),0_0_60px_rgba(10,17,40,0.7)]">
          JAWAHAR NAIDU
        </h1>
        <p className="text-inkline mt-5 max-w-md text-base md:text-lg leading-relaxed [text-shadow:0_1px_14px_rgba(10,17,40,0.95)]">
          I build AI tools — and get teams to actually use them.
          <br />
          This city is my work. Scroll to compile it.
        </p>
        <p className="font-plot text-blueprint/90 text-[10px] md:text-xs tracking-[0.3em] mt-6 border border-blueprint/40 px-4 py-2 [text-shadow:0_1px_10px_rgba(10,17,40,0.9)]">
          SEEKING: 12–24 MONTH APPRENTICESHIP · FRANCE
        </p>
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 font-plot text-blueprint text-xs tracking-[0.35em] animate-pulse motion-reduce:animate-none">
          ▼ SCROLL
        </p>
      </div>

      {/* persistent link rail — always one click from proof */}
      <div className="fixed z-30 top-4 right-4 md:top-6 md:right-6 flex gap-2">
        {[
          { label: "GITHUB", href: "https://github.com/Jawahars07" },
          { label: "CV ↓", href: "/Jawahar_Naidu_CV.pdf" },
          { label: "EMAIL", href: "mailto:jawaharnaidu07@gmail.com" },
        ].map((l) => (
          <a
            key={l.label}
            href={l.href}
            target={l.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            onClick={() => trackClick(l.label, l.href)}
            className="font-plot text-[10px] tracking-[0.2em] border border-blueprint/50 bg-night/60 backdrop-blur-sm text-blueprint px-3 py-1.5 hover:bg-blueprint hover:text-night transition-colors"
          >
            {l.label}
          </a>
        ))}
      </div>

      {/* Title block — all other sheets */}
      <div
        className={`hud-fade fixed z-20 left-4 bottom-4 md:left-8 md:bottom-8 w-[min(92vw,26rem)] ${
          isTitle ? "opacity-0 translate-y-3 pointer-events-none" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="titleblock p-4 md:p-5">
          <div className="flex items-baseline justify-between font-plot text-[10px] tracking-[0.28em] text-blueprint/90">
            <span>SHEET {sheet.no} / 06</span>
            <span>BLUEPRINT CITY</span>
          </div>
          <h2 className="text-limestone text-xl md:text-2xl font-semibold tracking-tight mt-2">{sheet.title}</h2>
          <p className="text-inkline text-[13px] md:text-sm leading-relaxed mt-2">{sheet.body}</p>
          {sheet.links && (
            <div className="flex flex-wrap gap-2 mt-3">
              {sheet.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target={l.href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noreferrer"
                  onClick={() => trackClick(l.label, l.href)}
                  className="font-plot text-[10px] tracking-[0.2em] border border-blueprint/50 text-blueprint px-3 py-1.5 hover:bg-blueprint hover:text-night transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
          <div className="rule mt-3 pt-2 font-plot text-[9px] tracking-[0.18em] text-blueprint/60">{sheet.meta}</div>
        </div>
      </div>

      {/* Progress rail */}
      <div className="fixed z-20 right-3 md:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        {SHEETS.map((s) => {
          const active = s.no === sheet.no;
          return (
            <div key={s.no} className="flex items-center gap-2">
              <div
                className={`transition-all duration-300 ${
                  active ? "w-5 h-[2px] bg-blueprint" : "w-2.5 h-[2px] bg-blueprint/30"
                }`}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
