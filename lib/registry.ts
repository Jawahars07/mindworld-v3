// Typed access to the synced agentic-os skill registry (lib/registry.json,
// written by scripts/sync-registry.mjs at build time). All counts shown in the
// UI come from here — never hardcode them.
import data from "./registry.json";

export type Skill = {
  name: string;
  description: string;
  scope: string;
  category: string;
  authored: boolean;
  source: string | null;
};

export type Registry = {
  syncedAt: string;
  scannedAt: string;
  total: number;
  authored: number;
  byCategory: Record<string, number>;
  skills: Skill[];
};

export const REGISTRY = data as Registry;

export const CATEGORIES = Object.keys(REGISTRY.byCategory).sort(
  (a, b) => REGISTRY.byCategory[b] - REGISTRY.byCategory[a]
);
