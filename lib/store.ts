import { create } from "zustand";

// Scroll progress is written by the DOM scroll listener and read by both the
// R3F frame loop (camera, build uniforms) and the DOM HUD. Single source of truth.
// OS-shell state (boot, mode, overlays) lives here too so HUD, Scene and the
// autopilot never disagree about what the user is doing.
type WorldState = {
  progress: number; // raw scroll 0..1
  reduced: boolean; // prefers-reduced-motion: idle pulses freeze, scroll still works
  tier: "high" | "low"; // quality tier, set once at mount (see Scene.tsx heuristic)
  booted: boolean; // cold-boot sequence finished (or skipped) this session
  mode: "explore" | "recruiter"; // recruiter = 90s scripted autopilot
  galaxyOpen: boolean; // skill constellation destination
  terminalOpen: boolean; // hidden terminal (~ / palette "sudo")
  paletteOpen: boolean; // ⌘K command palette
  roomOpen: string | null; // project room slug, null = closed
  setProgress: (p: number) => void;
  setReduced: (r: boolean) => void;
  setTier: (t: "high" | "low") => void;
  setBooted: (b: boolean) => void;
  setMode: (m: "explore" | "recruiter") => void;
  setGalaxyOpen: (o: boolean) => void;
  setTerminalOpen: (o: boolean) => void;
  setPaletteOpen: (o: boolean) => void;
  setRoomOpen: (slug: string | null) => void;
};

export const useWorld = create<WorldState>((set) => ({
  progress: 0,
  reduced: false,
  tier: "high",
  booted: false,
  mode: "explore",
  galaxyOpen: false,
  terminalOpen: false,
  paletteOpen: false,
  roomOpen: null,
  setProgress: (progress) => set({ progress }),
  setReduced: (reduced) => set({ reduced }),
  setTier: (tier) => set({ tier }),
  setBooted: (booted) => set({ booted }),
  setMode: (mode) => set({ mode }),
  setGalaxyOpen: (galaxyOpen) => set({ galaxyOpen }),
  setTerminalOpen: (terminalOpen) => set({ terminalOpen }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setRoomOpen: (roomOpen) => set({ roomOpen }),
}));
