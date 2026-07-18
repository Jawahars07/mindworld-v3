"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { REGISTRY, CATEGORIES, type Skill } from "@/lib/registry";
import { useWorld } from "@/lib/store";
import { trackClick } from "@/lib/analytics";

// The Agentic OS Constellation — the skill registry as a night sky.
// Ported from agentic-os/render.mjs grammar: pulsing orange SYSTEM CORE,
// category constellations on tethers, skills as stars (authored = larger,
// orange), radar sweep, search dims non-matches, click a star for detail.
// All data is the live synced registry — counts are never hardcoded.

type Star = { skill: Skill; x: number; y: number; r: number; catIndex: number };
type Hub = { name: string; x: number; y: number; count: number };

// Deterministic LCG so the sky is identical on every visit (CONVENTIONS rule 4).
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
}
function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function buildSky() {
  const hubs: Hub[] = [];
  const stars: Star[] = [];
  const n = CATEGORIES.length;
  CATEGORIES.forEach((cat, i) => {
    // golden-angle ring keeps neighbours visually separated
    const angle = i * 2.399963 + 0.6;
    const ringR = 300 + (i % 3) * 130;
    const hx = Math.cos(angle) * ringR;
    const hy = Math.sin(angle) * ringR * 0.72; // gentle vertical squash
    const count = REGISTRY.byCategory[cat];
    hubs.push({ name: cat, x: hx, y: hy, count });
    const members = REGISTRY.skills.filter((s) => s.category === cat);
    const rand = lcg(hash(cat));
    const clusterR = 40 + Math.sqrt(members.length) * 22;
    for (const skill of members) {
      const a = rand() * Math.PI * 2;
      const d = 26 + Math.sqrt(rand()) * clusterR;
      stars.push({
        skill,
        x: hx + Math.cos(a) * d,
        y: hy + Math.sin(a) * d * 0.8,
        r: skill.authored ? 5 : 2.2,
        catIndex: i,
      });
    }
  });
  return { hubs, stars };
}

export default function Constellation() {
  const setGalaxyOpen = useWorld((s) => s.setGalaxyOpen);
  const reduced = useWorld((s) => s.reduced);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<Skill | null>(null);
  const [query, setQuery] = useState("");
  const view = useRef({ x: 0, y: 0, zoom: 1 });
  const queryRef = useRef("");
  queryRef.current = query.trim().toLowerCase();

  const { hubs, stars } = useMemo(buildSky, []);

  // Esc closes; focus the search on open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGalaxyOpen(false);
    };
    window.addEventListener("keydown", onKey);
    trackClick("galaxy:open", "");
    return () => window.removeEventListener("keydown", onKey);
  }, [setGalaxyOpen]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let dragging = false;
    let moved = 0;
    let px = 0;
    let py = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    // arrival: fall into the sky from far out (GSAP on the plain view object)
    if (!reduced) {
      view.current.zoom = 0.45;
      gsap.to(view.current, { zoom: 1, duration: 1.5, ease: "power3.out" });
    }

    const toScreen = (wx: number, wy: number) => {
      const v = view.current;
      return [
        canvas.width / 2 + (wx + v.x) * v.zoom * dpr,
        canvas.height / 2 + (wy + v.y) * v.zoom * dpr,
      ] as const;
    };

    const matches = (s: Skill, q: string) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q);

    const draw = (t: number) => {
      const q = queryRef.current;
      const v = view.current;
      const time = reduced ? 0 : t / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#05070F";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const [cx, cy] = toScreen(0, 0);

      // radar sweep from the core
      if (!reduced) {
        const sweep = time * 0.35;
        const grad = ctx.createConicGradient(sweep, cx, cy);
        grad.addColorStop(0, "rgba(255,106,61,0.10)");
        grad.addColorStop(0.08, "rgba(255,106,61,0)");
        grad.addColorStop(1, "rgba(255,106,61,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // tethers + data pulses
      for (let i = 0; i < hubs.length; i++) {
        const h = hubs[i];
        const [hx, hy] = toScreen(h.x, h.y);
        ctx.strokeStyle = "rgba(95,212,245,0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        if (!reduced) {
          const p = (time * 0.22 + i * 0.13) % 1;
          const pxp = cx + (hx - cx) * p;
          const pyp = cy + (hy - cy) * p;
          ctx.fillStyle = "rgba(255,106,61,0.85)";
          ctx.beginPath();
          ctx.arc(pxp, pyp, 1.6 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // stars
      for (const s of stars) {
        const [sx, sy] = toScreen(s.x, s.y);
        if (sx < -20 || sy < -20 || sx > canvas.width + 20 || sy > canvas.height + 20) continue;
        const hit = matches(s.skill, q);
        const alpha = q ? (hit ? 1 : 0.12) : 1;
        const twinkle = reduced ? 1 : 0.75 + 0.25 * Math.sin(time * 1.7 + s.x * 0.05);
        if (s.skill.authored) {
          ctx.fillStyle = `rgba(255,106,61,${alpha})`;
          ctx.shadowColor = "rgba(255,106,61,0.9)";
          ctx.shadowBlur = 12 * twinkle;
        } else {
          ctx.fillStyle = `rgba(180,225,240,${0.85 * alpha * twinkle})`;
          ctx.shadowColor = "rgba(95,212,245,0.6)";
          ctx.shadowBlur = 4;
        }
        ctx.beginPath();
        ctx.arc(sx, sy, s.r * dpr * (s.skill.authored ? twinkle : 1) * Math.min(view.current.zoom, 1.6), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // category labels
      ctx.font = `${9 * dpr}px var(--font-plot), monospace`;
      ctx.textAlign = "center";
      for (const h of hubs) {
        const [hx, hy] = toScreen(h.x, h.y);
        ctx.fillStyle = "rgba(95,212,245,0.7)";
        ctx.fillText(`${h.name.toUpperCase()} · ${h.count}`, hx, hy - 14 * dpr);
      }

      // the core
      const pulse = reduced ? 1 : 1 + 0.12 * Math.sin(time * 2.2);
      ctx.fillStyle = "rgba(255,106,61,0.95)";
      ctx.shadowColor = "rgba(255,106,61,1)";
      ctx.shadowBlur = 30 * pulse;
      ctx.beginPath();
      ctx.arc(cx, cy, 7 * dpr * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(227,217,194,0.9)";
      ctx.fillText("SYSTEM CORE", cx, cy + 24 * dpr);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    // pan / zoom / pick
    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      px = e.clientX;
      py = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const v = view.current;
      v.x += (e.clientX - px) / v.zoom;
      v.y += (e.clientY - py) / v.zoom;
      moved += Math.abs(e.clientX - px) + Math.abs(e.clientY - py);
      px = e.clientX;
      py = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      if (moved > 6) return; // it was a drag, not a pick
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * dpr;
      const my = (e.clientY - rect.top) * dpr;
      let best: Star | null = null;
      let bestD = 18 * dpr;
      for (const s of stars) {
        const [sx, sy] = toScreen(s.x, s.y);
        const d = Math.hypot(sx - mx, sy - my);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      setSelected(best ? best.skill : null);
      if (best) trackClick("galaxy:star", best.skill.name);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = view.current;
      v.zoom = Math.min(3.2, Math.max(0.35, v.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
    };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [hubs, stars, reduced]);

  const zoomBy = (f: number) => {
    view.current.zoom = Math.min(3.2, Math.max(0.35, view.current.zoom * f));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      role="dialog"
      aria-label="Skill galaxy — every Claude Code skill installed on this system"
      className="fixed inset-0 z-[70] bg-[#05070F]"
    >
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* header: the honest claim, from live data */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 text-center pointer-events-none px-4">
        <p className="font-plot text-[10px] tracking-[0.3em] text-accent">THE AGENTIC OS — SKILL GALAXY</p>
        <p className="font-plot text-[11px] md:text-xs text-inkline mt-1.5">
          {REGISTRY.total} skills installed locally · {REGISTRY.authored} authored by me · this runs every day
        </p>
      </div>

      {/* search */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[min(92vw,24rem)]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search the sky… (agents · security · career)"
          aria-label="Search skills"
          className="w-full bg-night/80 backdrop-blur-sm border border-blueprint/30 font-plot text-xs text-limestone placeholder:text-inkline/40 px-3 py-2.5 outline-none focus:border-blueprint/70"
        />
      </div>

      {/* controls */}
      <div className="absolute bottom-16 right-4 flex flex-col gap-1">
        <button onClick={() => zoomBy(1.25)} aria-label="Zoom in" className="w-8 h-8 border border-blueprint/40 text-blueprint font-plot hover:bg-blueprint hover:text-night transition-colors">+</button>
        <button onClick={() => zoomBy(0.8)} aria-label="Zoom out" className="w-8 h-8 border border-blueprint/40 text-blueprint font-plot hover:bg-blueprint hover:text-night transition-colors">−</button>
      </div>
      <button
        onClick={() => setGalaxyOpen(false)}
        aria-label="Close the skill galaxy"
        className="absolute top-14 right-4 font-plot text-[10px] tracking-[0.2em] border border-blueprint/40 text-blueprint px-3 py-1.5 hover:bg-blueprint hover:text-night transition-colors"
      >
        ✕ CLOSE
      </button>

      {/* star detail */}
      {selected && (
        <div className="absolute left-4 bottom-28 md:left-6 md:bottom-24 w-[min(88vw,22rem)] border border-blueprint/30 bg-[#0B1330]/95 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-plot text-sm text-limestone">{selected.name}</p>
            {selected.authored && (
              <span className="font-plot text-[9px] tracking-[0.2em] text-accent border border-accent/50 px-1.5 py-0.5 shrink-0">AUTHORED</span>
            )}
          </div>
          <p className="font-plot text-[9px] tracking-[0.2em] text-blueprint/70 mt-1">
            {selected.category.toUpperCase()}
            {selected.source ? ` · ${selected.source}` : ""}
          </p>
          <p className="text-inkline text-xs leading-relaxed mt-2 line-clamp-5">{selected.description}</p>
          <button
            onClick={() => setSelected(null)}
            className="font-plot text-[9px] tracking-[0.2em] text-inkline/60 hover:text-limestone mt-3 transition-colors"
          >
            DISMISS
          </button>
        </div>
      )}
    </motion.div>
  );
}
