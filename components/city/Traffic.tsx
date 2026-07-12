"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useWorld } from "@/lib/store";
import { DAY } from "@/lib/daycycle";

// Street traffic: two vehicle kinds ("rickshaw", "car"), each its own instanced
// mesh built from a merged low-poly BufferGeometry (a handful of boxes composed
// at module init — no external geometry, no textures). Vehicles loop along z
// within a zone, on discrete lane x-offsets, seeded speed/phase. Visible/moving
// only inside appearRange; frozen (visible, static) when reduced-motion.

function lcg(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- geometry builders (merge a few boxes into one BufferGeometry each) ----

function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // Manual merge (positions + normals only, single group) to avoid pulling in
  // BufferGeometryUtils just for this — keeps the module dependency-free.
  let vertCount = 0;
  for (const g of geos) vertCount += g.attributes.position.count;
  const positions = new Float32Array(vertCount * 3);
  const normals = new Float32Array(vertCount * 3);
  let offset = 0;
  for (const g of geos) {
    const p = g.attributes.position.array as Float32Array;
    const n = g.attributes.normal.array as Float32Array;
    positions.set(p, offset * 3);
    normals.set(n, offset * 3);
    offset += g.attributes.position.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  return merged;
}

// body-only geometry (no lights) + separate light geometry, so we can tint
// the lights sub-mesh emissive by night factor without touching body color.
function buildRickshaw() {
  const cabin = new THREE.BoxGeometry(1.1, 1.1, 1.5);
  cabin.translate(0, 0.75, 0);
  const canopy = new THREE.BoxGeometry(1.2, 0.5, 1.7);
  canopy.translate(0, 1.55, -0.05);
  const wheelHint = new THREE.BoxGeometry(1.2, 0.35, 0.25);
  wheelHint.translate(0, 0.2, 0.55);
  const body = mergeGeometries([cabin, canopy, wheelHint]);

  const headlight = new THREE.BoxGeometry(0.9, 0.2, 0.06);
  headlight.translate(0, 0.55, 0.78);
  const taillight = new THREE.BoxGeometry(0.9, 0.15, 0.06);
  taillight.translate(0, 0.55, -0.78);
  const lights = mergeGeometries([headlight, taillight]);

  return { body, lights };
}

function buildCar() {
  const lower = new THREE.BoxGeometry(1.7, 0.6, 3.6);
  lower.translate(0, 0.4, 0);
  const cabin = new THREE.BoxGeometry(1.5, 0.55, 2.0);
  cabin.translate(0, 0.95, -0.1);
  const nose = new THREE.BoxGeometry(1.6, 0.5, 0.5);
  nose.translate(0, 0.4, 1.85);
  const body = mergeGeometries([lower, cabin, nose]);

  const headlight = new THREE.BoxGeometry(1.4, 0.18, 0.06);
  headlight.translate(0, 0.42, 2.12);
  const taillight = new THREE.BoxGeometry(1.4, 0.16, 0.06);
  taillight.translate(0, 0.42, -1.82);
  const lights = mergeGeometries([headlight, taillight]);

  return { body, lights };
}

const RICKSHAW_PALETTE = ["#D8C24A", "#4A7A4E", "#C9B23E"]; // yellow-green two-tone-ish
const CAR_PALETTE = ["#1E2A4A", "#EDE3CE", "#5A2430"]; // navy, cream, burgundy

export type TrafficProps = {
  zone: [number, number]; // [zMin, zMax]
  kind: "rickshaw" | "car";
  count: number;
  lanes?: number[]; // x offsets; default +-2.2, +-4.5
  appearRange: readonly [number, number];
};

export function Traffic({ zone, kind, count, lanes, appearRange }: TrafficProps) {
  const tier = useWorld.getState().tier;
  const n = tier === "low" ? Math.max(1, Math.round(count * 0.5)) : count;
  const laneXs = lanes ?? [-4.5, -2.2, 2.2, 4.5];

  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { bodyGeo, lightGeo, bodyMat, lightMat, insts } = useMemo(() => {
    const built = kind === "rickshaw" ? buildRickshaw() : buildCar();
    const palette = kind === "rickshaw" ? RICKSHAW_PALETTE : CAR_PALETTE;
    const r = lcg(kind === "rickshaw" ? 4001 : 4002 + zone[0]);

    type Inst = {
      lane: number;
      dir: 1 | -1;
      speed: number;
      phase: number;
      color: string;
    };
    const insts: Inst[] = [];
    for (let i = 0; i < n; i++) {
      const lane = laneXs[Math.floor(r() * laneXs.length)];
      const dir: 1 | -1 = lane < 0 ? 1 : -1; // simple two-way convention by side
      const speed = kind === "rickshaw" ? 3.2 + r() * 1.6 : 5.5 + r() * 2.5;
      const phase = r();
      const color = palette[Math.floor(r() * palette.length)];
      insts.push({ lane, dir, speed, phase, color });
    }

    const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: false, roughness: 0.6, metalness: 0.15 });
    const lightMat = new THREE.MeshStandardMaterial({
      color: "#111111",
      emissive: new THREE.Color("#FFDCA0"),
      emissiveIntensity: 0,
      roughness: 0.4,
    });

    return { bodyGeo: built.body, lightGeo: built.lights, bodyMat, lightMat, insts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, n, zone[0], zone[1], laneXs.join(",")]);

  // per-instance color buffer for the body mesh (instanceColor)
  const bodyColorAttr = useMemo(() => {
    const arr = new Float32Array(insts.length * 3);
    const c = new THREE.Color();
    insts.forEach((it, i) => {
      c.set(it.color);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    });
    return new THREE.InstancedBufferAttribute(arr, 3);
  }, [insts]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.instanceColor = bodyColorAttr;
      bodyRef.current.instanceColor.needsUpdate = true;
    }
  }, [bodyColorAttr]);

  useEffect(() => {
    return () => {
      bodyGeo.dispose();
      lightGeo.dispose();
      bodyMat.dispose();
      lightMat.dispose();
    };
  }, [bodyGeo, lightGeo, bodyMat, lightMat]);

  const zLen = zone[1] - zone[0];

  useFrame((_, delta) => {
    const { progress, reduced } = useWorld.getState();
    const visible = progress >= appearRange[0] && progress <= appearRange[1];
    if (bodyRef.current) bodyRef.current.visible = visible;
    if (lightRef.current) lightRef.current.visible = visible;
    if (!visible) return;

    const dt = reduced ? 0 : delta;
    lightMat.emissiveIntensity = 0.15 + DAY.uNight.value * 1.6;

    for (let i = 0; i < insts.length; i++) {
      const it = insts[i];
      if (!reduced) it.phase += (dt * it.speed) / zLen;
      const s = it.phase - Math.floor(it.phase); // 0..1 loop
      const z = it.dir === 1 ? zone[0] + s * zLen : zone[1] - s * zLen;
      const rotY = it.dir === 1 ? 0 : Math.PI;

      dummy.position.set(it.lane, 0, z);
      dummy.rotation.set(0, rotY, 0);
      dummy.updateMatrix();
      bodyRef.current?.setMatrixAt(i, dummy.matrix);
      lightRef.current?.setMatrixAt(i, dummy.matrix);
    }
    if (bodyRef.current) bodyRef.current.instanceMatrix.needsUpdate = true;
    if (lightRef.current) lightRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={bodyRef}
        args={[bodyGeo, bodyMat, insts.length]}
        frustumCulled={false}
        instanceMatrix-usage={THREE.DynamicDrawUsage}
      />
      <instancedMesh
        ref={lightRef}
        args={[lightGeo, lightMat, insts.length]}
        frustumCulled={false}
        instanceMatrix-usage={THREE.DynamicDrawUsage}
      />
    </group>
  );
}
