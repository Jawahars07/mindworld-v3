"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useWorld } from "@/lib/store";
import { buildOf } from "@/lib/path";
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

// Roof furniture appears only once its building has finished compiling.
function RoofKit({
  b,
  children,
}: {
  b: BuildingProps;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current)
      ref.current.visible = buildOf(useWorld.getState().progress, b.range, b.delay ?? 0) > 0.96;
  });
  return (
    <group ref={ref} position={[b.position[0], b.size[1], b.position[2]]}>
      {children}
    </group>
  );
}

// Bengaluru rooftop: water tank on legs + stair headroom — the skyline texture
// of every Indian low-rise.
function BlrRoof({ b, r1, r2 }: { b: BuildingProps; r1: number; r2: number }) {
  const w = b.size[0];
  const d = b.size[2];
  return (
    <RoofKit b={b}>
      {r1 > 0.35 && (
        <group position={[w * 0.28, 0, d * 0.22]}>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.75, 0.75, 1.1, 12]} />
            <meshStandardMaterial color="#1C2436" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[1.1, 0.3, 1.1]} />
            <meshStandardMaterial color="#2A3247" roughness={0.9} />
          </mesh>
        </group>
      )}
      {r2 > 0.4 && (
        <mesh position={[-w * 0.24, 0.8, -d * 0.18]}>
          <boxGeometry args={[1.6, 1.6, 1.9]} />
          <meshStandardMaterial color={b.warm ?? "#D9B98C"} roughness={0.95} />
        </mesh>
      )}
      {/* parapet lip */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[w + 0.25, 0.36, d + 0.25]} />
        <meshStandardMaterial color="#3A3325" roughness={1} />
      </mesh>
    </RoofKit>
  );
}

// Paris rooftop: zinc mansard frustum + chimney stack.
function MansardRoof({ b, r1 }: { b: BuildingProps; r1: number }) {
  const w = b.size[0];
  const d = b.size[2];
  return (
    <RoofKit b={b}>
      <mesh position={[0, 1.1, 0]} rotation-y={Math.PI / 4} scale={[w, 2.2, d]}>
        <cylinderGeometry args={[Math.SQRT1_2 * 0.45, Math.SQRT1_2 * 1.02, 1, 4, 1]} />
        <meshStandardMaterial color="#39435C" roughness={0.6} metalness={0.35} flatShading />
      </mesh>
      <mesh position={[w * (r1 > 0.5 ? 0.2 : -0.22), 2.6, d * 0.1]}>
        <boxGeometry args={[0.5, 1.1, 0.5]} />
        <meshStandardMaterial color="#2E3850" roughness={0.9} />
      </mesh>
    </RoofKit>
  );
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
  flavor?: "blr" | "paris" | "generic";
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
  flavor = "generic",
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
      {buildings.map((b, i) => {
        // deterministic per-building roof dice from its seed
        const r1 = ((b.seed! * 7.13) % 1 + 1) % 1;
        const r2 = ((b.seed! * 3.71) % 1 + 1) % 1;
        return (
          <group key={i}>
            <Building {...b} />
            {flavor === "blr" && <BlrRoof b={b} r1={r1} r2={r2} />}
            {flavor === "paris" && <MansardRoof b={b} r1={r1} />}
          </group>
        );
      })}
    </group>
  );
}
