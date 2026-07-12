import * as THREE from "three";

// Camera track as explicit keyframes on scroll progress — precise sheet framing
// beats constant-speed spline traversal here.
type Key = { t: number; pos: [number, number, number]; look: [number, number, number] };

// v4 "The City Compiles" — one continuous take, Bengaluru to Paris.
// Act map lives in ACTS below; district compile windows in BUILD_RANGES.
const KEYS: Key[] = [
  // Act 0: dead-overhead plan view — the blueprint sheet at night
  { t: 0.0, pos: [0, 125, -58.8], look: [0, 0, -61.2] },
  { t: 0.06, pos: [10, 42, -22], look: [0, 6, -62] }, // begin the descent as dawn nears
  // Act 1 — sunrise sweeps Bengaluru
  { t: 0.1, pos: [14, 10, -18], look: [0, 6, -70] }, // avenue entry, first light
  { t: 0.15, pos: [-6, 7, -32], look: [-18, 5, -46] }, // ACADEMIC: REVA campus
  { t: 0.2, pos: [-1, 10, -52], look: [13, 9, -71] }, // CAREER: PandaECE + PocketLite from the avenue
  { t: 0.26, pos: [-3, 8, -82], look: [-15, 7, -98] }, // CULTURAL: ISKCON quarter
  // Act 2 — takeoff and the crossing
  { t: 0.32, pos: [10, 6, -102], look: [-1, 7, -128] }, // runway, wheels up — close on the aircraft
  { t: 0.38, pos: [22, 36, -132], look: [-4, 34, -168] }, // climbing beside the aircraft
  { t: 0.43, pos: [24, 54, -154], look: [-10, 47, -196] }, // cruise above the clouds
  { t: 0.48, pos: [12, 30, -180], look: [-4, 12, -206] }, // descent toward Paris
  // Act 3 — Paris, afternoon into golden hour
  { t: 0.53, pos: [13, 8, -196], look: [-6, 9, -216] }, // ACADEMIC: ESSEC quarter
  { t: 0.58, pos: [0, 9, -214], look: [0, 24, -270] }, // the avenue opens to the tower
  { t: 0.64, pos: [26, 20, -230], look: [0, 22, -270] }, // Adopt, three-quarter hero
  { t: 0.7, pos: [3, 21, -246], look: [0, 21, -270] }, // facade panel, medium shot
  { t: 0.76, pos: [-9, 8, -281], look: [-16, 6, -316] }, // turn into the workshop lane
  { t: 0.82, pos: [-22, 13, -307], look: [-8, 2, -331] },
  { t: 0.875, pos: [-6, 8, -334], look: [2, 4, -364] }, // CULTURAL: the integration street
  // Act 4 — sunset at the open plot
  { t: 0.94, pos: [0, 12, -350], look: [0, 8, -380] },
  { t: 1.0, pos: [0, 17, -356], look: [0, 10, -384] },
];

// Cubic Hermite through the keys with finite-difference tangents (respecting
// non-uniform t spacing). Per-segment smoothstep braked to zero velocity at
// every key — that read as surging/uneven scroll. This glides continuously.
const TS = KEYS.map((k) => k.t);
const P = KEYS.map((k) => new THREE.Vector3(...k.pos));
const L = KEYS.map((k) => new THREE.Vector3(...k.look));
const TENSION = 0.72; // <1 damps overshoot on sharp turns

function tangentsOf(pts: THREE.Vector3[]) {
  return pts.map((_, i) => {
    const v = new THREE.Vector3();
    if (i === 0) v.subVectors(pts[1], pts[0]).divideScalar(TS[1] - TS[0]);
    else if (i === pts.length - 1)
      v.subVectors(pts[i], pts[i - 1]).divideScalar(TS[i] - TS[i - 1]);
    else {
      const fwd = new THREE.Vector3().subVectors(pts[i + 1], pts[i]).divideScalar(TS[i + 1] - TS[i]);
      const back = new THREE.Vector3().subVectors(pts[i], pts[i - 1]).divideScalar(TS[i] - TS[i - 1]);
      v.addVectors(fwd, back).multiplyScalar(0.5);
    }
    return v.multiplyScalar(TENSION);
  });
}
const PM = tangentsOf(P);
const LM = tangentsOf(L);

function hermite(pts: THREE.Vector3[], ms: THREE.Vector3[], i: number, s: number, dt: number, out: THREE.Vector3) {
  const s2 = s * s;
  const s3 = s2 * s;
  out
    .copy(pts[i])
    .multiplyScalar(2 * s3 - 3 * s2 + 1)
    .addScaledVector(ms[i], (s3 - 2 * s2 + s) * dt)
    .addScaledVector(pts[i + 1], -2 * s3 + 3 * s2)
    .addScaledVector(ms[i + 1], (s3 - s2) * dt);
}

export function cameraAt(progress: number, outPos: THREE.Vector3, outLook: THREE.Vector3) {
  const t = Math.min(Math.max(progress, 0), 1);
  let i = 0;
  while (i < TS.length - 2 && t > TS[i + 1]) i++;
  const dt = TS[i + 1] - TS[i];
  const s = (t - TS[i]) / dt;
  hermite(P, PM, i, s, dt, outPos);
  hermite(L, LM, i, s, dt, outLook);
}

// Camera keys that leave the avenue (|x| > 7) — districts must keep an exclusion
// bubble around each or a filler block spawns on the lens. See CONVENTIONS.md.
export const CAMERA_BUBBLES: [number, number][] = KEYS.filter((k) => Math.abs(k.pos[0]) > 7).map(
  (k) => [k.pos[0], k.pos[2]]
);

// The five acts. HUD act label + shoot.mjs boundaries read from here.
export const ACTS = [
  { no: 0, name: "BLUEPRINT NIGHT", range: [0.0, 0.08] as const },
  { no: 1, name: "SUNRISE — BENGALURU", range: [0.08, 0.31] as const },
  { no: 2, name: "THE CROSSING", range: [0.31, 0.48] as const },
  { no: 3, name: "PARIS — GOLDEN HOUR", range: [0.48, 0.88] as const },
  { no: 4, name: "SUNSET — THE OPEN PLOT", range: [0.88, 1.0] as const },
];

export function actAt(progress: number) {
  for (const a of ACTS) if (progress >= a.range[0] && progress < a.range[1]) return a;
  return ACTS[ACTS.length - 1];
}

// District build windows: progress range over which each district compiles.
export const BUILD_RANGES = {
  blrAcademic: [0.09, 0.17] as const,
  blrCareer: [0.15, 0.23] as const,
  blrCultural: [0.21, 0.29] as const,
  bengaluru: [0.09, 0.28] as const, // filler fabric across the whole quarter
  paris: [0.47, 0.56] as const,
  adopt: [0.56, 0.62] as const, // fast — it reads as "already done" vs neighbours
  workshops: [0.68, 0.82] as const,
  parisCultural: [0.8, 0.875] as const,
  openPlot: [0.88, 0.96] as const,
};

export function buildOf(progress: number, range: readonly [number, number], delay = 0) {
  const span = range[1] - range[0];
  const t0 = range[0] + delay * span * 0.6;
  return Math.min(Math.max((progress - t0) / (span * 0.4), 0), 1);
}
