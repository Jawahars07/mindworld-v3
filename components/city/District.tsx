"use client";

import { useMemo } from "react";
import { Building, BuildingProps } from "./Building";

// Procedural district: blocks flanking the avenue, deterministic per seed.
// Landmark buildings are placed individually by their sheets, not here.

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type DistrictProps = {
  centerZ: number;
  depth: number; // extent along z
  seed: number;
  range: readonly [number, number];
  count?: number;
  warmPalette?: string[];
  heights?: [number, number];
  avenueX?: number;
  litRatio?: number;
  exclude?: (x: number, z: number) => boolean;
};

export function District({
  centerZ,
  depth,
  seed,
  range,
  count = 26,
  warmPalette = ["#E8DCC8", "#DCCDB2", "#D9C6A8", "#CBB894"],
  heights = [5, 16],
  avenueX = 0,
  litRatio = 0.4,
  exclude,
}: DistrictProps) {
  const buildings = useMemo(() => {
    const r = rng(seed);
    const out: BuildingProps[] = [];
    let guard = 0;
    while (out.length < count && guard++ < count * 8) {
      const side = r() > 0.5 ? 1 : -1;
      const x = avenueX + side * (8 + r() * 22);
      const z = centerZ + (r() - 0.5) * depth;
      if (exclude && exclude(x, z)) continue;
      // avoid overlaps: keep a coarse spacing test against accepted plots
      const w = 3.5 + r() * 5;
      const d = 3.5 + r() * 5;
      if (out.some((b) => Math.abs(b.position[0] - x) < (b.size[0] + w) * 0.62 && Math.abs(b.position[2] - z) < (b.size[2] + d) * 0.62)) continue;
      const h = heights[0] + r() * (heights[1] - heights[0]);
      out.push({
        position: [x, 0, z],
        size: [w, h, d],
        seed: r() * 100,
        range,
        delay: r(),
        warm: warmPalette[Math.floor(r() * warmPalette.length)],
        litRatio,
        windowScale: 0.9 + r() * 0.35,
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group>
      {buildings.map((b, i) => (
        <Building key={i} {...b} />
      ))}
    </group>
  );
}
