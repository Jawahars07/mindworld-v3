"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useWorld } from "@/lib/store";
import { DAY } from "@/lib/daycycle";

// Clouds: the deck for the Act 2 flight corridor, plus a few scattered puffs
// elsewhere for atmosphere. One InstancedMesh of camera-facing billboard
// planes; camera-facing is done entirely in the vertex shader (the local plane
// offset is added directly in view space, after the instance's translation is
// projected into view space — so no per-frame CPU billboard math is needed).
// No textures: alpha is a procedural radial falloff. Puffs are grouped into
// small seeded clusters so they read as clouds rather than a spray of discs.

function lcg(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CORRIDOR_Z: [number, number] = [-100, -200];
const CORRIDOR_Y: [number, number] = [26, 48];

type Puff = { x: number; y: number; z: number; r: number; seed: number; driftSpeed: number };

function buildPuffs(seed: number, total: number): Puff[] {
  const rnd = lcg(seed);
  const puffs: Puff[] = [];
  const corridorTarget = Math.round(total * 0.8);

  const addCluster = (cx: number, cy: number, cz: number, spread: number, budget: number) => {
    const n = Math.min(budget, 3 + Math.floor(rnd() * 5)); // 3..7 puffs per cluster
    for (let i = 0; i < n; i++) {
      puffs.push({
        x: cx + (rnd() - 0.5) * spread,
        y: cy + (rnd() - 0.5) * spread * 0.45,
        z: cz + (rnd() - 0.5) * spread,
        r: 3.2 + rnd() * 3.6,
        seed: rnd() * 1000,
        driftSpeed: 0.15 + rnd() * 0.25,
      });
    }
    return n;
  };

  // dense clusters filling the flight corridor
  while (puffs.length < corridorTarget) {
    const cx = (rnd() - 0.5) * 70;
    const cz = CORRIDOR_Z[0] - rnd() * (CORRIDOR_Z[0] - CORRIDOR_Z[1]);
    const cy = CORRIDOR_Y[0] + rnd() * (CORRIDOR_Y[1] - CORRIDOR_Y[0]);
    addCluster(cx, cy, cz, 11 + rnd() * 6, corridorTarget - puffs.length);
  }

  // sparse scattered clusters along the rest of the journey (background flavor)
  while (puffs.length < total) {
    const cx = (rnd() - 0.5) * 90;
    const cz = -20 - rnd() * 340;
    const cy = 20 + rnd() * 34;
    addCluster(cx, cy, cz, 9 + rnd() * 6, total - puffs.length);
  }

  return puffs;
}

const vert = /* glsl */ `
  attribute float aRadius;
  attribute float aSeed;
  varying vec2 vUv;
  varying float vSeed;
  varying float vViewDist;
  varying vec3 vViewPos;

  void main() {
    vUv = uv;
    vSeed = aSeed;
    vec4 instCenter = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 mvCenter = modelViewMatrix * instCenter;
    // billboard: offset in view space so the quad always faces the camera
    mvCenter.xyz += position * aRadius;
    vViewPos = mvCenter.xyz;
    vViewDist = -mvCenter.z;
    gl_Position = projectionMatrix * mvCenter;
  }
`;

const frag = /* glsl */ `
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uSkyCol;
  uniform vec3 uGroundCol;
  uniform vec3 uHorizonCol;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uNight;
  varying vec2 vUv;
  varying float vSeed;
  varying float vViewDist;
  varying vec3 vViewPos;

  float mwHash(float x) {
    return fract(sin(x * 12.9898 + vSeed * 3.7) * 43758.5453);
  }

  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c) * 2.0;
    float alpha = smoothstep(1.0, 0.1, d);
    alpha *= 0.55 + 0.35 * mwHash(floor(vSeed));
    // clouds belong to the day: nearly gone on the night blueprint sheet
    alpha *= 1.0 - uNight * 0.8;
    if (alpha < 0.02) discard;

    // pseudo-normal bulging toward the viewer/up, used only to tint the puff
    // toward the sun on its lit side (billboard, so this is an approximation)
    vec3 n = normalize(vec3(c.x, 0.55, 0.35));
    float sunFactor = clamp(dot(n, normalize(uSunDir)) * 0.5 + 0.5, 0.0, 1.0);

    vec3 base = mix(uGroundCol, uSkyCol, 0.65);
    // whiten toward day so the deck reads as cloud, not smoke
    base = mix(base, vec3(0.88, 0.9, 0.94), 0.5 * (1.0 - uNight));
    vec3 lit = mix(base * 0.8, base * 0.55 + uSunColor * 0.7, sunFactor);
    vec3 col = mix(lit, uHorizonCol, 0.12);
    col = mix(col, col * 0.35 + vec3(0.02, 0.02, 0.05), uNight * 0.85);

    float fog = 1.0 - exp(-pow(vViewDist * uFogDensity, 2.0));
    col = mix(col, uFogColor, fog);

    gl_FragColor = vec4(col, alpha);
  }
`;

export function Clouds({ seed = 42 }: { seed?: number }) {
  const tier = useWorld.getState().tier;
  const count = tier === "low" ? 90 : 220;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { geo, puffs } = useMemo(() => {
    const puffs = buildPuffs(seed, count);
    const geo = new THREE.PlaneGeometry(2, 2);
    const aRadius = new Float32Array(puffs.length);
    const aSeed = new Float32Array(puffs.length);
    for (let i = 0; i < puffs.length; i++) {
      aRadius[i] = puffs[i].r;
      aSeed[i] = puffs[i].seed;
    }
    geo.setAttribute("aRadius", new THREE.InstancedBufferAttribute(aRadius, 1));
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(aSeed, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 34, -150), 260);
    return { geo, puffs };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, count]);

  const uniforms = useMemo(
    () => ({
      uSunDir: DAY.uSunDir,
      uSunColor: DAY.uSunColor,
      uSkyCol: DAY.uSkyCol,
      uGroundCol: DAY.uGroundCol,
      uHorizonCol: DAY.uHorizonCol,
      uFogColor: DAY.uFogColor,
      uFogDensity: DAY.uFogDensity,
      uNight: DAY.uNight,
    }),
    []
  );

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const s = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const posV = useMemo(() => new THREE.Vector3(), []);
  const initialized = useRef(false);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const reduced = useWorld.getState().reduced;
    const t = reduced ? 0 : clock.elapsedTime;
    for (let i = 0; i < puffs.length; i++) {
      if (!reduced || !initialized.current) {
        const p = puffs[i];
        const drift = t * p.driftSpeed;
        posV.set(p.x + Math.sin(drift * 0.3 + p.seed) * 4 + drift * 0.6, p.y + Math.sin(drift * 0.5 + p.seed) * 0.6, p.z);
        m.compose(posV, q, s);
        mesh.setMatrixAt(i, m);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    initialized.current = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geo, undefined, puffs.length]} frustumCulled={false}>
      <shaderMaterial
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
