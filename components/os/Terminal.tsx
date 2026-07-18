"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorld } from "@/lib/store";
import { ROOMS } from "@/lib/rooms";
import { REGISTRY } from "@/lib/registry";
import { travelTo } from "@/lib/nav";
import { trackClick } from "@/lib/analytics";

// The hidden terminal (` / ~, or "sudo" in the palette). Real commands over
// real data. Copy is Jawahar's voice: short, honest, no clichés.

type Entry = { cmd?: string; out: string[] };

const HELP = [
  "commands:",
  "  whoami          — who runs this system",
  "  ls projects     — everything built, with status",
  "  ls skills       — the registry, by the numbers",
  "  run adopt       — open the flagship, live",
  "  sudo hire       — the only command that needs you",
  "  mindworld       — toggle the sun",
  "  clear · exit",
];

export default function Terminal() {
  const open = useWorld((s) => s.terminalOpen);
  const setOpen = useWorld((s) => s.setTerminalOpen);
  const [history, setHistory] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [sun, setSun] = useState<"night" | "day">("night");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      trackClick("terminal:open", "");
      setHistory([
        {
          out: [
            "MINDWORLD OS — restricted shell. you found it.",
            "type `help` if you want the map, or guess. both work.",
          ],
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [history]);

  const runCmd = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    const push = (out: string[]) => setHistory((h) => [...h, { cmd: raw, out }]);
    trackClick("terminal:cmd", cmd);

    switch (cmd) {
      case "":
        setHistory((h) => [...h, { cmd: raw, out: [] }]);
        break;
      case "help":
        push(HELP);
        break;
      case "whoami":
        push([
          "jawahar naidu — builder.",
          "b.tech cs (reva, honours) → essec mim, paris.",
          "two real jobs on the record: pandaece (digital strategy, 30+ SME clients),",
          "pocketlite (first production code, php).",
          "ships things: adopt (live), webforge, tara, this city.",
          "looking for: a 12–24 month apprenticeship in france, from sept 2026.",
        ]);
        break;
      case "ls projects":
      case "ls":
        push(
          ROOMS.map(
            (r) =>
              `  ${r.slug.padEnd(10)} ${r.flagship ? "★ " : "  "}${r.tagline}`
          )
        );
        break;
      case "ls skills":
        push([
          `${REGISTRY.total} skills mounted · ${REGISTRY.authored} authored here`,
          ...Object.entries(REGISTRY.byCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([c, n]) => `  ${String(n).padStart(3)}  ${c}`),
          "  …open the galaxy for the whole sky.",
        ]);
        break;
      case "run adopt":
        push(["launching the flagship…"]);
        window.open("https://adopt-eight.vercel.app", "_blank");
        break;
      case "sudo hire":
        push([
          "permission granted. drafting the email…",
          "(12–24 months · france · sept 2026 · ships from week one)",
        ]);
        setTimeout(() => {
          window.location.href =
            "mailto:jawaharnaidu07@gmail.com?subject=sudo%20hire%20—%20apprenticeship&body=Saw%20the%20system.%20Let%27s%20talk.";
        }, 900);
        break;
      case "mindworld": {
        const next = sun === "night" ? "day" : "night";
        setSun(next);
        push([next === "day" ? "raising the sun…" : "putting the city back to sleep…"]);
        setOpen(false);
        travelTo(next === "day" ? 0.6 : 0.01);
        break;
      }
      case "clear":
        setHistory([]);
        break;
      case "exit":
        setOpen(false);
        break;
      case "sudo":
        push(["sudo what? try `sudo hire`. it's the only one that matters."]);
        break;
      default:
        push([`command not found: ${cmd}`, "honest system, limited surface. try `help`."]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-label="MINDWORLD OS terminal"
          className="fixed z-[85] inset-x-0 bottom-0 h-[46vh] md:h-[40vh] border-t border-accent/40 bg-[#05070F]/97 backdrop-blur-sm flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-blueprint/15">
            <p className="font-plot text-[9px] tracking-[0.3em] text-accent">
              MINDWORLD SHELL <span className="text-blueprint/50">· restricted · found via ~</span>
            </p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close terminal"
              className="font-plot text-[10px] text-inkline hover:text-accent transition-colors"
            >
              ✕ ESC
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 font-plot text-[12px] leading-6">
            {history.map((e, i) => (
              <div key={i}>
                {e.cmd !== undefined && (
                  <p className="text-limestone">
                    <span className="text-accent mr-2">$</span>
                    {e.cmd}
                  </p>
                )}
                {e.out.map((l, j) => (
                  <p key={j} className="text-blueprint/85 whitespace-pre-wrap">
                    {l}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runCmd(input);
              setInput("");
            }}
            className="flex items-center gap-2 px-4 py-3 border-t border-blueprint/15"
          >
            <span className="font-plot text-accent text-sm">$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
              aria-label="Terminal command input"
              placeholder="whoami · ls projects · sudo hire"
              className="flex-1 bg-transparent font-plot text-[13px] text-limestone placeholder:text-inkline/30 outline-none"
              autoComplete="off"
              spellCheck={false}
            />
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
