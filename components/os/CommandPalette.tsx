"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorld } from "@/lib/store";
import { travelTo } from "@/lib/nav";
import { trackClick } from "@/lib/analytics";

// ⌘K command palette — every destination and action, keyboard-first.
// Typing "sudo" or "~" drops into the hidden terminal.

type Action = { id: string; group: "GO" | "DO" | "LINK"; label: string; hint?: string; run: () => void };

export default function CommandPalette() {
  const open = useWorld((s) => s.paletteOpen);
  const setOpen = useWorld((s) => s.setPaletteOpen);
  const setGalaxyOpen = useWorld((s) => s.setGalaxyOpen);
  const setTerminalOpen = useWorld((s) => s.setTerminalOpen);
  const setMode = useWorld((s) => s.setMode);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = useMemo<Action[]>(
    () => [
      { id: "story", group: "GO", label: "Act 1 — Sunrise, Bengaluru", run: () => travelTo(0.1) },
      { id: "crossing", group: "GO", label: "Act 2 — The Crossing", run: () => travelTo(0.38) },
      { id: "paris", group: "GO", label: "Act 3 — Paris, ESSEC", run: () => travelTo(0.53) },
      { id: "adopt", group: "GO", label: "The Flagship — Adopt", run: () => travelTo(0.6) },
      { id: "workshops", group: "GO", label: "The Workshops", run: () => travelTo(0.76) },
      { id: "plot", group: "GO", label: "The Open Plot — the ask", run: () => travelTo(0.97) },
      {
        id: "recruiter",
        group: "DO",
        label: "▶ Recruiter mode — 90-second tour",
        hint: "autopilot",
        run: () => setMode("recruiter"),
      },
      { id: "galaxy", group: "DO", label: "Open the Skill Galaxy", hint: "live registry", run: () => setGalaxyOpen(true) },
      { id: "terminal", group: "DO", label: "Open terminal", hint: "~ or sudo", run: () => setTerminalOpen(true) },
      { id: "cv", group: "LINK", label: "Download CV", run: () => window.open("/Jawahar_Naidu_CV.pdf", "_blank") },
      { id: "email", group: "LINK", label: "Email Jawahar", run: () => (window.location.href = "mailto:jawaharnaidu07@gmail.com") },
      { id: "github", group: "LINK", label: "GitHub — Jawahars07", run: () => window.open("https://github.com/Jawahars07", "_blank") },
      { id: "adopt-live", group: "LINK", label: "Adopt — open the live app", run: () => window.open("https://adopt-eight.vercel.app", "_blank") },
    ],
    [setGalaxyOpen, setTerminalOpen, setMode]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(s) || a.id.includes(s));
  }, [q, actions]);

  // Global shortcut: ⌘K / Ctrl+K toggles; ~ opens the terminal directly.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useWorld.getState().paletteOpen);
      } else if (
        (e.key === "`" || e.key === "~") &&
        !useWorld.getState().paletteOpen &&
        !useWorld.getState().terminalOpen &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setTerminalOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen, setTerminalOpen]);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const runAction = (a: Action) => {
    setOpen(false);
    trackClick(`palette:${a.id}`, "");
    a.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      const s = q.trim().toLowerCase();
      if (s === "sudo" || s === "~") {
        setOpen(false);
        setTerminalOpen(true);
      } else if (filtered[sel]) runAction(filtered[sel]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[80] bg-night/70 backdrop-blur-sm flex items-start justify-center pt-[18vh] px-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-label="Command palette"
            className="w-[min(94vw,36rem)] border border-blueprint/30 bg-[#0B1330]/95 shadow-[0_0_60px_rgba(95,212,245,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-blueprint/20 px-4">
              <span className="font-plot text-accent text-xs">&gt;</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="where to? (try: adopt · galaxy · sudo)"
                aria-label="Search commands"
                className="w-full bg-transparent font-plot text-sm text-limestone placeholder:text-inkline/40 py-3.5 outline-none"
              />
              <kbd className="font-plot text-[9px] text-inkline/50 border border-blueprint/20 px-1.5 py-0.5">ESC</kbd>
            </div>
            <ul className="max-h-[46vh] overflow-y-auto py-2" role="listbox">
              {filtered.length === 0 && (
                <li className="px-4 py-3 font-plot text-xs text-inkline/60">
                  nothing here — but try <span className="text-accent">sudo</span>
                </li>
              )}
              {filtered.map((a, i) => (
                <li key={a.id} role="option" aria-selected={i === sel}>
                  <button
                    onMouseEnter={() => setSel(i)}
                    onClick={() => runAction(a)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left font-plot text-[13px] transition-colors ${
                      i === sel ? "bg-blueprint/15 text-limestone" : "text-inkline"
                    }`}
                  >
                    <span>
                      <span className="text-blueprint/50 text-[9px] tracking-[0.2em] mr-3">{a.group}</span>
                      {a.label}
                    </span>
                    {a.hint && <span className="text-[9px] text-accent/70 tracking-[0.15em]">{a.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
