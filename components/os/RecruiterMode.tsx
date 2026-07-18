"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorld } from "@/lib/store";
import { travelTo, cancelTravel } from "@/lib/nav";
import { trackClick } from "@/lib/analytics";

// The 90-second tour: who → the flagship → the skill galaxy → the ask.
// Drives the page scroll (ScrollDriver stays the source of truth); any real
// user input hands control straight back. Default entry on mobile after boot.

type Beat = { label: string; p?: number; dwell: number; galaxy?: boolean };

const BEATS: Beat[] = [
  { label: "WHO — the blueprint", p: 0.02, dwell: 4500 },
  { label: "WHERE IT STARTED — Bengaluru", p: 0.2, dwell: 5000 },
  { label: "THE FLAGSHIP — Adopt, live", p: 0.6, dwell: 6500 },
  { label: "THE FLAGSHIP — up close", p: 0.66, dwell: 5000 },
  { label: "THE SKILL GALAXY — live registry", dwell: 12000, galaxy: true },
  { label: "THE ASK — 12–24 months, Sept 2026", p: 0.97, dwell: 6000 },
];

export default function RecruiterMode() {
  const mode = useWorld((s) => s.mode);
  const setMode = useWorld((s) => s.setMode);
  const booted = useWorld((s) => s.booted);
  const setGalaxyOpen = useWorld((s) => s.setGalaxyOpen);
  const [beat, setBeat] = useState(-1);
  const [finished, setFinished] = useState(false);
  const runToken = useRef(0);
  const autoPrompted = useRef(false);

  // Mobile default: once booted, offer the tour by starting it (spec: default on
  // mobile). A visible ✕ hands control back instantly.
  useEffect(() => {
    if (!booted || autoPrompted.current) return;
    autoPrompted.current = true;
    const isMobile = window.innerWidth < 760;
    const alreadyToured = sessionStorage.getItem("mw:toured");
    if (isMobile && !alreadyToured) setMode("recruiter");
  }, [booted, setMode]);

  // The runner. Token guards against stale async steps after cancel.
  useEffect(() => {
    if (mode !== "recruiter") {
      runToken.current++;
      cancelTravel();
      setGalaxyOpen(false);
      setBeat(-1);
      return;
    }
    const token = ++runToken.current;
    setFinished(false);
    sessionStorage.setItem("mw:toured", "1");
    trackClick("recruiter:start", "");

    const exit = () => {
      if (runToken.current === token) setMode("explore");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);

    (async () => {
      for (let i = 0; i < BEATS.length; i++) {
        if (runToken.current !== token) return;
        const b = BEATS[i];
        setBeat(i);
        if (b.galaxy) {
          setGalaxyOpen(true);
          await new Promise((r) => setTimeout(r, b.dwell));
          if (runToken.current !== token) return;
          setGalaxyOpen(false);
        } else if (b.p !== undefined) {
          const arrived = await travelTo(b.p, { onCancel: exit });
          if (!arrived || runToken.current !== token) return;
          await new Promise((r) => setTimeout(r, b.dwell));
        }
      }
      if (runToken.current !== token) return;
      setFinished(true);
      trackClick("recruiter:finished", "");
    })();

    return () => window.removeEventListener("keydown", onKey);
  }, [mode, setMode, setGalaxyOpen]);

  if (mode !== "recruiter") return null;

  return (
    <>
      {/* status chip */}
      <div className="fixed z-[60] top-14 left-1/2 -translate-x-1/2 flex items-center gap-3 border border-accent/50 bg-night/80 backdrop-blur-sm px-3 py-2">
        <span className="w-1.5 h-1.5 bg-accent animate-pulse motion-reduce:animate-none" />
        <span className="font-plot text-[10px] tracking-[0.2em] text-limestone">
          RECRUITER MODE{beat >= 0 && !finished ? ` · ${beat + 1}/${BEATS.length} — ${BEATS[beat].label}` : ""}
        </span>
        <button
          onClick={() => setMode("explore")}
          aria-label="Exit recruiter mode and explore freely"
          className="font-plot text-[10px] tracking-[0.15em] text-inkline hover:text-accent transition-colors"
        >
          ✕ EXPLORE
        </button>
      </div>

      {/* the close: ask + one-click proof */}
      <AnimatePresence>
        {finished && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed z-[60] bottom-16 left-1/2 -translate-x-1/2 w-[min(92vw,26rem)] border border-accent/50 bg-[#0B1330]/95 p-5"
          >
            <p className="font-plot text-[10px] tracking-[0.25em] text-accent mb-2">TOUR COMPLETE · 90S</p>
            <p className="text-limestone text-sm leading-relaxed mb-4">
              That&apos;s the system — real projects, real skills, running every day. It needs one
              thing it can&apos;t build itself: a team. 12–24 month apprenticeship, France, from
              September 2026.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/Jawahar_Naidu_CV.pdf"
                onClick={() => trackClick("recruiter:cv", "/Jawahar_Naidu_CV.pdf")}
                className="font-plot text-[10px] tracking-[0.2em] bg-accent text-night px-3 py-2 hover:bg-limestone transition-colors"
              >
                DOWNLOAD CV
              </a>
              <a
                href="mailto:jawaharnaidu07@gmail.com?subject=Apprenticeship%20—%20let%27s%20talk"
                onClick={() => trackClick("recruiter:email", "mailto")}
                className="font-plot text-[10px] tracking-[0.2em] border border-blueprint/60 text-blueprint px-3 py-2 hover:bg-blueprint hover:text-night transition-colors"
              >
                EMAIL JAWAHAR
              </a>
              <button
                onClick={() => setMode("explore")}
                className="font-plot text-[10px] tracking-[0.15em] text-inkline hover:text-limestone px-2 py-2 transition-colors"
              >
                EXPLORE THE CITY
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
