"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWorld } from "@/lib/store";
import { REGISTRY } from "@/lib/registry";

// Cold boot: MINDWORLD OS types its real state before the city fades up.
// Every number here is read from live data (lib/registry.ts) — never hardcoded.
// Skippable (any key / click), runs once per session (sessionStorage).

const SESSION_KEY = "mw:booted";

type Line = { text: string; ok?: boolean; pause?: number };

export default function Boot() {
  const setBooted = useWorld((s) => s.setBooted);
  const reducedStore = useWorld((s) => s.reduced);
  const [reducedMq, setReducedMq] = useState(false);
  // Scene sets the store flag late (dynamic import) — read the media query
  // directly so a reduced-motion boot is instant from the first frame.
  useEffect(() => {
    setReducedMq(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  const reduced = reducedStore || reducedMq;
  const [phase, setPhase] = useState<"pending" | "running" | "leaving" | "done">("pending");
  const [lineCount, setLineCount] = useState(0); // lines fully shown
  const [chars, setChars] = useState(0); // chars of the current line
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lines = useMemo<Line[]>(
    () => [
      { text: "MINDWORLD OS v1.0 — booting…", pause: 500 },
      {
        text: `mounting skills registry … ${REGISTRY.total} skills · ${REGISTRY.authored} authored`,
        ok: true,
        pause: 380,
      },
      { text: "loading districts … BENGALURU → PARIS", ok: true, pause: 380 },
      { text: "day-cycle engine … sunrise queued", ok: true, pause: 380 },
      { text: "agentic core … online", ok: true, pause: 500 },
      { text: "boot complete. the sun is coming up on it.", pause: 700 },
    ],
    []
  );

  // Decide once, client-side: skip if already booted this session.
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      setBooted(true);
      setPhase("done");
    } else {
      setPhase("running");
    }
  }, [setBooted]);

  const finish = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setBooted(true);
    setPhase("leaving");
    setTimeout(() => setPhase("done"), 700);
  };

  // Type the lines. Reduced motion: show everything at once, short hold.
  useEffect(() => {
    if (phase !== "running") return;
    if (reduced) {
      setLineCount(lines.length);
      timer.current = setTimeout(finish, 1400);
      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }
    if (lineCount >= lines.length) {
      timer.current = setTimeout(finish, 350);
      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }
    const line = lines[lineCount];
    if (chars < line.text.length) {
      timer.current = setTimeout(() => setChars((c) => c + 2), 14);
    } else {
      timer.current = setTimeout(() => {
        setLineCount((n) => n + 1);
        setChars(0);
      }, line.pause ?? 300);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lineCount, chars, reduced, lines]);

  // Skip on any key or click; lock body scroll while the boot screen owns the viewport.
  useEffect(() => {
    if (phase !== "running") return;
    const skip = () => finish();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      document.documentElement.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      role="status"
      aria-label="MINDWORLD OS is booting. Press any key to skip."
      className={`fixed inset-0 z-[100] bg-[#05070F] flex items-center justify-center transition-opacity duration-700 ${
        phase === "leaving" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="w-[min(92vw,34rem)] font-plot text-[13px] md:text-sm leading-7">
        <p className="text-accent tracking-[0.3em] text-[10px] mb-4">
          MINDWORLD OS <span className="text-blueprint/60">· PERSONAL SYSTEM OF JAWAHAR NAIDU</span>
        </p>
        {lines.slice(0, Math.min(lineCount + 1, lines.length)).map((l, i) => {
          const complete = i < lineCount;
          const text = complete ? l.text : l.text.slice(0, chars);
          const showOk = l.ok && complete;
          return (
            <p key={i} className="text-blueprint/90">
              <span className="text-blueprint/40 mr-2">&gt;</span>
              {text}
              {showOk && <span className="text-accent ml-2">✓</span>}
              {!complete && phase === "running" && (
                <span className="inline-block w-2 h-4 bg-blueprint/80 align-middle ml-1 animate-pulse motion-reduce:animate-none" />
              )}
            </p>
          );
        })}
        {phase === "running" && (
          <button
            onClick={finish}
            className="mt-6 text-[10px] tracking-[0.25em] text-inkline/60 hover:text-blueprint border border-blueprint/20 hover:border-blueprint/60 px-3 py-1.5 transition-colors"
          >
            SKIP INTRO — ANY KEY
          </button>
        )}
      </div>
    </div>
  );
}
