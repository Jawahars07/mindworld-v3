"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useWorld } from "@/lib/store";
import { CAMERA_BUBBLES } from "@/lib/path";
import { DAY } from "@/lib/daycycle";

// InstancedDistrict: hundreds of filler buildings in ONE draw call. Same compile
// language as Building.tsx/District.tsx (bottom-up build sweep, cyan construction
// front, procedural windows, shared DAY lighting, exp2 fog) but driven entirely
// per-instance so the whole block is a single THREE.InstancedMesh.
//
// Wireframe-before-fill: instanced edge lines (a second LineSegments-per-building)
// would defeat the point of instancing (back to N draw calls), so the blueprint
// state is synthesized IN-SHADER instead: above the compile front, we don't
// discard — we compute the fragment's distance to the two nearest box-edge lines
// (in local/vSize space) and, inside a thin band, output additive cyan "wireframe"
// pixels; everything else above the front is discarded (transparent). Below the
// front, normal compileFragMainBody-style shading runs. One draw call gets both
// looks.

const CYAN = new THREE.Color("#5FD4F5");
const AMBER = new THREE.Color("#FFB454");

function lcg(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const vert = /* glsl */ `
  uniform float uProgress;
  uniform float uRangeStart;
  uniform float uRangeSpan; // range[1]-range[0]

  attribute vec3 aSize;   // building dims (w,h,d)
  attribute float aSeed;
  attribute float aDelay; // 0..1 stagger inside the district window
  attribute vec3 aWarm;   // per-instance albedo

  varying vec3 vLocal;
  varying vec3 vNormal2; // WORLD space — for sun/hemisphere lighting
  varying vec3 vObjN;    // OBJECT space — for face classification (windows, edges)
  varying float vViewDist;
  varying float vBuild;
  varying vec3 vSize;
  varying vec3 vWarm;
  varying float vSeed;

  void main() {
    // unit box (-0.5..0.5 xz, 0..1 y) scaled by aSize -> base sits at y=0
    vec3 local = position * aSize;
    vLocal = local;
    vSize = aSize;
    vWarm = aWarm;
    vSeed = aSeed;

    // port of buildOf() in lib/path.ts, per-instance delay
    float t0 = uRangeStart + aDelay * uRangeSpan * 0.6;
    vBuild = clamp((uProgress - t0) / (uRangeSpan * 0.4), 0.0, 1.0);

    vec4 worldPos = instanceMatrix * vec4(local, 1.0);
    vec4 mv = modelViewMatrix * worldPos;
    // mesh sits at origin: world normal = instance rotation only (no scale in matrix)
    mat3 instNormal = mat3(instanceMatrix);
    vNormal2 = normalize(instNormal * normal);
    vObjN = normal;
    vViewDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

// Fragment: same lighting/window/fog helpers as compileFragPars but reading
// per-instance vWarm instead of a uniform uWarm, plus the in-shader wireframe
// band used above the compile front.
const frag = /* glsl */ `
  uniform float uSeed;
  uniform vec3 uCyan;
  uniform vec3 uAmber;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uSkyCol;
  uniform vec3 uGroundCol;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uNight;
  uniform float uWindowScale;
  uniform float uLitRatio;

  varying vec3 vLocal;
  varying vec3 vNormal2;
  varying vec3 vObjN;
  varying float vViewDist;
  varying float vBuild;
  varying vec3 vSize;
  varying vec3 vWarm;
  varying float vSeed;

  float mwHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7)) + vSeed * 17.31) * 43758.5453);
  }

  vec3 mwLight(vec3 albedo, vec3 n) {
    float sunDot = max(dot(n, normalize(uSunDir)), 0.0);
    vec3 hemi = mix(uGroundCol, uSkyCol, n.y * 0.5 + 0.5);
    return albedo * (uSunColor * sunDot * 0.85 + hemi * 1.15 + vec3(0.03));
  }

  vec3 mwShade(vec3 albedo) {
    vec3 nW = normalize(vNormal2); // lighting
    vec3 n = normalize(vObjN);     // face classification
    float vgrad = 0.62 + 0.38 * (vLocal.y / max(vSize.y, 0.001));
    vec3 col = mwLight(albedo, nW) * vgrad;

    float vertFace = step(abs(n.y), 0.5);
    vec2 uv = mix(vec2(vLocal.x, vLocal.y), vec2(vLocal.z, vLocal.y), step(0.5, abs(n.x)));
    vec2 cellSize = vec2(1.5, 2.1) * uWindowScale;
    vec2 cell = floor(uv / cellSize);
    vec2 f = fract(uv / cellSize);
    float inWin = step(0.22, f.x) * step(f.x, 0.78) * step(0.28, f.y) * step(f.y, 0.8);
    float margin = step(1.0, vLocal.y) * step(vLocal.y, vSize.y - 0.8);
    float win = inWin * vertFace * margin;
    float litRatio = uLitRatio * (0.12 + 0.88 * uNight);
    float lit = step(1.0 - litRatio, mwHash(cell + floor(n.xz * 3.0 + 0.5)));
    vec3 dayGlass = mix(uSkyCol * 0.55, uSkyCol, mwHash(cell + 2.7) * 0.5);
    vec3 nightGlass = uAmber * (1.1 + 0.7 * mwHash(cell + 4.2)) * lit;
    vec3 glass = mix(dayGlass * (1.0 - lit * 0.4), dayGlass * 0.35 + nightGlass, uNight * 0.85 + lit * 0.15);
    col = mix(col, glass, win);

    float front = vBuild * vSize.y;
    float building = step(0.001, vBuild) * (1.0 - step(0.999, vBuild));
    float band = smoothstep(1.4, 0.0, front - vLocal.y) * building;
    col += uCyan * band * 1.6;
    col += uCyan * 0.12 * (1.0 - vBuild);
    return col;
  }

  vec3 mwFog(vec3 col) {
    float fog = 1.0 - exp(-pow(vViewDist * uFogDensity, 2.0));
    return mix(col, uFogColor, fog);
  }

  // Distance (world units) from a local-space point on a box face to the nearest
  // of the box's vertical/horizontal edge lines, for a fake-wireframe look.
  float edgeDist(vec3 n) {
    // work in the face's local 2D coords (already have uv-ish vLocal per-axis)
    vec2 p;
    vec2 half2;
    if (abs(n.y) > 0.5) {
      p = vLocal.xz;
      half2 = vSize.xz * 0.5;
    } else if (abs(n.x) > 0.5) {
      p = vec2(vLocal.z, vLocal.y - vSize.y * 0.5); // y 0..h -> recenter about h/2
      half2 = vec2(vSize.z * 0.5, vSize.y * 0.5);
    } else {
      p = vec2(vLocal.x, vLocal.y - vSize.y * 0.5);
      half2 = vec2(vSize.x * 0.5, vSize.y * 0.5);
    }
    vec2 d = half2 - abs(p);
    return min(d.x, d.y);
  }

  void main() {
    float front = vBuild * vSize.y;
    if (vLocal.y > front + 0.001) {
      // blueprint zone: thin cyan wireframe lines only, else discard (transparent)
      vec3 n = normalize(vObjN);
      float ed = edgeDist(n);
      float lineW = 0.06;
      float alpha = 1.0 - smoothstep(0.0, lineW, ed);
      if (alpha < 0.02) discard;
      vec3 col = mwFog(uCyan * alpha * 1.4);
      gl_FragColor = vec4(col, alpha * 0.85);
      return;
    }
    vec3 col = mwFog(mwShade(vWarm));
    gl_FragColor = vec4(col, 1.0);
  }
`;

export type InstancedDistrictProps = {
  centerZ: number;
  depth: number;
  seed: number;
  range: readonly [number, number];
  count: number;
  heights: [number, number];
  warmPalette: string[];
  litRatio?: number;
  avenueX?: number;
  flavor?: "blr" | "paris" | "generic";
  exclude?: (x: number, z: number) => boolean;
};

const unitBox = new THREE.BoxGeometry(1, 1, 1);
unitBox.translate(0, 0.5, 0); // base sits at y=0 in unit space (0..1)

export function InstancedDistrict({
  centerZ,
  depth,
  seed,
  range,
  count,
  heights,
  warmPalette,
  litRatio = 0.4,
  avenueX = 0,
  flavor = "generic",
  exclude,
}: InstancedDistrictProps) {
  const tier = useWorld.getState().tier;
  const n = tier === "low" ? Math.max(1, Math.round(count * 0.5)) : count;

  const { mesh, material } = useMemo(() => {
    const r = lcg(seed);
    type Plot = { x: number; z: number; w: number; h: number; d: number; warm: string; instSeed: number; delay: number };
    const plots: Plot[] = [];
    let guard = 0;
    while (plots.length < n && guard++ < n * 10) {
      const side = r() > 0.5 ? 1 : -1;
      const x = avenueX + side * (8 + r() * 22);
      const z = centerZ + (r() - 0.5) * depth;
      if (exclude && exclude(x, z)) continue;
      // auto-exclude camera bubbles (|x|>7 keys) within radius 11
      let inBubble = false;
      for (const [bx, bz] of CAMERA_BUBBLES) {
        if (Math.hypot(x - bx, z - bz) < 11) {
          inBubble = true;
          break;
        }
      }
      if (inBubble) continue;

      const w = flavor === "blr" ? 3 + r() * 6 : 4.5 + r() * 2.5;
      const d = flavor === "blr" ? 3 + r() * 6 : 4.5 + r() * 2.5;
      if (
        plots.some(
          (b) => Math.abs(b.x - x) < (b.w + w) * 0.6 && Math.abs(b.z - z) < (b.d + d) * 0.6
        )
      )
        continue;

      const h =
        flavor === "paris" ? 8.5 + r() * 1.5 : heights[0] + r() * (heights[1] - heights[0]);
      plots.push({
        x,
        z,
        w,
        h,
        d,
        warm: warmPalette[Math.floor(r() * warmPalette.length)],
        instSeed: r() * 100,
        delay: r(),
      });
    }

    const geo = unitBox.clone();
    const count2 = plots.length;
    const aSize = new Float32Array(count2 * 3);
    const aSeed = new Float32Array(count2);
    const aDelay = new Float32Array(count2);
    const aWarm = new Float32Array(count2 * 3);
    const tmpColor = new THREE.Color();
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scale1 = new THREE.Vector3(1, 1, 1);
    const posV = new THREE.Vector3();
    const upY = new THREE.Vector3(0, 1, 0);

    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: true,
      uniforms: {
        uProgress: { value: 0 },
        uRangeStart: { value: range[0] },
        uRangeSpan: { value: range[1] - range[0] },
        uSeed: { value: seed },
        uCyan: { value: CYAN.clone() },
        uAmber: { value: AMBER.clone() },
        uWindowScale: { value: 1 },
        uLitRatio: { value: litRatio },
        uSunDir: DAY.uSunDir,
        uSunColor: DAY.uSunColor,
        uSkyCol: DAY.uSkyCol,
        uGroundCol: DAY.uGroundCol,
        uFogColor: DAY.uFogColor,
        uFogDensity: DAY.uFogDensity,
        uNight: DAY.uNight,
      },
    });

    const mesh = new THREE.InstancedMesh(geo, material, count2);
    mesh.frustumCulled = false;

    for (let i = 0; i < count2; i++) {
      const p = plots[i];
      aSize[i * 3] = p.w;
      aSize[i * 3 + 1] = p.h;
      aSize[i * 3 + 2] = p.d;
      aSeed[i] = p.instSeed;
      aDelay[i] = p.delay;
      tmpColor.set(p.warm);
      aWarm[i * 3] = tmpColor.r;
      aWarm[i * 3 + 1] = tmpColor.g;
      aWarm[i * 3 + 2] = tmpColor.b;

      // deterministic rotation from the same stream (kept simple: axis-aligned
      // or quarter-turn) so footprints stay grid-plausible without extra draws
      const rotY = plots[i].instSeed % 1 > 0.5 ? Math.PI * 0.5 : 0;
      posV.set(p.x, 0, p.z);
      q.setFromAxisAngle(upY, rotY);
      m.compose(posV, q, scale1);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;

    geo.setAttribute("aSize", new THREE.InstancedBufferAttribute(aSize, 3));
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(aSeed, 1));
    geo.setAttribute("aDelay", new THREE.InstancedBufferAttribute(aDelay, 1));
    geo.setAttribute("aWarm", new THREE.InstancedBufferAttribute(aWarm, 3));

    // Manually computed bounding sphere: shader only ever displaces within the
    // unit-box * aSize footprint (no extra world-space displacement beyond the
    // instance matrix + per-instance size, which BoxGeometry.translate already
    // bakes into local space) — so the InstancedMesh default bounding sphere
    // (computed from geometry + instance matrices) is already correct EXCEPT it
    // doesn't know about aSize scaling the local geometry per-instance (instance
    // matrices here carry no scale). We compute a generous manual sphere instead
    // of relying on frustum culling, and disable frustumCulled on the mesh so a
    // partially-visible district edge never pops.
    const maxHalfFootprint = Math.max(depth, 60) * 0.5 + 30;
    const sphere = new THREE.Sphere(new THREE.Vector3(avenueX, heights[1] * 0.5, centerZ), maxHalfFootprint);
    mesh.geometry.boundingSphere = sphere;

    return { mesh, material };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, count, depth, centerZ, avenueX, flavor, n]);

  useFrame(() => {
    material.uniforms.uProgress.value = useWorld.getState().progress;
  });

  // mesh/material/geometry are built imperatively with `new` above (not
  // declared in JSX), so R3F's auto-dispose doesn't cover them — dispose
  // explicitly on unmount or seed/prop change.
  useEffect(() => {
    return () => {
      mesh.geometry.dispose();
      material.dispose();
    };
  }, [mesh, material]);

  return <primitive object={mesh} />;
}
