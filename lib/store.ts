import { create } from "zustand";

// Scroll progress is written by the DOM scroll listener and read by both the
// R3F frame loop (camera, build uniforms) and the DOM HUD. Single source of truth.
type WorldState = {
  progress: number; // raw scroll 0..1
  reduced: boolean; // prefers-reduced-motion: idle pulses freeze, scroll still works
  tier: "high" | "low"; // quality tier, set once at mount (see Scene.tsx heuristic)
  setProgress: (p: number) => void;
  setReduced: (r: boolean) => void;
  setTier: (t: "high" | "low") => void;
};

export const useWorld = create<WorldState>((set) => ({
  progress: 0,
  reduced: false,
  tier: "high",
  setProgress: (progress) => set({ progress }),
  setReduced: (reduced) => set({ reduced }),
  setTier: (tier) => set({ tier }),
}));
