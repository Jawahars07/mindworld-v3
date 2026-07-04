import * as THREE from "three";

// Camera track as explicit keyframes on scroll progress — precise sheet framing
// beats constant-speed spline traversal here.
type Key = { t: number; pos: [number, number, number]; look: [number, number, number] };

const KEYS: Key[] = [
  // Sheet 00: dead-overhead plan view — reads as a flat blueprint sheet;
  // the third dimension is the first surprise of the scroll
  { t: 0.0, pos: [0, 125, -58.8], look: [0, 0, -61.2] },
  { t: 0.1, pos: [14, 10, -18], look: [0, 6, -70] }, // descend to avenue
  { t: 0.18, pos: [-10, 7, -50], look: [6, 9, -84] }, // inside Bengaluru quarter
  { t: 0.26, pos: [16, 18, -80], look: [0, 34, -112] }, // leaving BLR, catching the arc
  { t: 0.32, pos: [30, 50, -104], look: [-6, 45, -144] }, // cruise: arc + plane from the side
  { t: 0.38, pos: [12, 32, -172], look: [-6, 12, -204] }, // descent toward CDG
  { t: 0.46, pos: [13, 8, -194], look: [-5, 10, -218] }, // Paris quarter
  { t: 0.52, pos: [0, 9, -212], look: [0, 24, -270] }, // full tower from the avenue
  { t: 0.6, pos: [26, 20, -228], look: [0, 22, -270] }, // three-quarter hero, whole silhouette
  { t: 0.68, pos: [3, 21, -245], look: [0, 21, -270] }, // facade panel medium shot
  { t: 0.74, pos: [-9, 8, -280], look: [-16, 6, -316] }, // turn into workshop lane
  { t: 0.82, pos: [-22, 13, -306], look: [-8, 2, -330] },
  { t: 0.88, pos: [-4, 9, -338], look: [0, 6, -370] },
  { t: 1.0, pos: [0, 17, -354], look: [0, 9, -382] }, // the open plot
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

// District build windows: progress range over which each district erects itself.
export const BUILD_RANGES = {
  bengaluru: [0.06, 0.2] as const,
  paris: [0.36, 0.48] as const,
  adopt: [0.5, 0.56] as const, // fast — it reads as "already done" vs neighbours
  workshops: [0.68, 0.82] as const,
  openPlot: [0.86, 0.96] as const,
};

export function buildOf(progress: number, range: readonly [number, number], delay = 0) {
  const span = range[1] - range[0];
  const t0 = range[0] + delay * span * 0.6;
  return Math.min(Math.max((progress - t0) / (span * 0.4), 0), 1);
}
