"use client";

import { useWorld } from "@/lib/store";

// The opening statement. Staged reveal once the OS has booted — pure CSS
// transitions with per-element delays (a GSAP timeline here proved fragile
// across dev/HMR; CSS keyed off a class cannot misfire). Under
// prefers-reduced-motion the transitions collapse to instant (globals.css).
// The chip's shine is the ReactBits "Shiny Text" pattern (MIT,
// DavidHDev/react-bits), vendored as CSS per the security-vet verdict.

const NAME = "JAWAHAR NAIDU";

export default function Hero({ visible }: { visible: boolean }) {
  const booted = useWorld((s) => s.booted);

  return (
    <div
      className={`hud-fade pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-center text-center px-6 ${
        visible ? "opacity-100" : "opacity-0"
      } ${booted ? "hero-on" : ""}`}
    >
      <p
        className="hero-stage font-plot text-blueprint/80 text-xs tracking-[0.5em] mb-5"
        style={{ transitionDelay: "0.15s" }}
      >
        MINDWORLD OS · ACT 0 · BLUEPRINT NIGHT
      </p>
      <h1
        aria-label={NAME}
        className="text-limestone text-5xl md:text-7xl font-bold tracking-tight leading-none [text-shadow:0_2px_24px_rgba(10,17,40,0.9),0_0_60px_rgba(10,17,40,0.7)]"
      >
        {NAME.split("").map((ch, i) => (
          <span
            key={i}
            aria-hidden
            className="hero-stage inline-block"
            style={{ transitionDelay: `${0.35 + i * 0.045}s` }}
          >
            {ch === " " ? " " : ch}
          </span>
        ))}
      </h1>
      <p
        className="hero-stage text-limestone/95 mt-6 max-w-xl text-lg md:text-2xl font-semibold leading-snug [text-shadow:0_1px_14px_rgba(10,17,40,0.95)]"
        style={{ transitionDelay: "1.15s" }}
      >
        I build AI systems people actually use.
      </p>
      <p
        className="hero-stage text-inkline mt-3 max-w-md text-sm md:text-base leading-relaxed [text-shadow:0_1px_14px_rgba(10,17,40,0.95)]"
        style={{ transitionDelay: "1.35s" }}
      >
        This site is one of them — it boots, it runs, and everything below is real. Built,
        shipped, or lived.
      </p>
      <p
        className="hero-stage shiny-text font-plot text-[10px] md:text-xs tracking-[0.3em] mt-7 border border-accent/50 px-4 py-2"
        style={{ transitionDelay: "1.6s" }}
      >
        SEEKING: 12–24 MONTH APPRENTICESHIP · FRANCE
      </p>
      {/* inset-x-0 centering — .hero-stage owns the transform, so translate-x
          utilities would be overridden here */}
      <p
        className="hero-stage absolute bottom-16 inset-x-0 text-center font-plot text-blueprint text-xs tracking-[0.35em] animate-pulse motion-reduce:animate-none"
        style={{ transitionDelay: "2.0s" }}
      >
        ▼ SCROLL — THE SUN IS COMING UP
      </p>
    </div>
  );
}
