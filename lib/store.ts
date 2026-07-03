import { create } from "zustand";

// Scroll progress is written by the DOM scroll listener and read by both the
// R3F frame loop (camera, build uniforms) and the DOM HUD. Single source of truth.
type WorldState = {
  progress: number; // raw scroll 0..1
  setProgress: (p: number) => void;
};

export const useWorld = create<WorldState>((set) => ({
  progress: 0,
  setProgress: (progress) => set({ progress }),
}));
