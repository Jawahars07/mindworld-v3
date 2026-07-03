import * as THREE from "three";

// Camera track as explicit keyframes on scroll progress — precise sheet framing
// beats constant-speed spline traversal here.
type Key = { t: number; pos: [number, number, number]; look: [number, number, number] };

const KEYS: Key[] = [
  { t: 0.0, pos: [36, 55, 40], look: [0, 8, -140] }, // Sheet 00 aerial
  { t: 0.1, pos: [14, 10, -18], look: [0, 6, -70] }, // descend to avenue
  { t: 0.18, pos: [-10, 7, -50], look: [6, 9, -84] }, // inside Bengaluru quarter
  { t: 0.26, pos: [0, 12, -92], look: [0, 26, -150] }, // leaving BLR, nose up
  { t: 0.32, pos: [0, 62, -132], look: [0, 48, -215] }, // above the clouds
  { t: 0.38, pos: [0, 28, -168], look: [0, 8, -208] }, // descend into Paris
  { t: 0.46, pos: [13, 8, -194], look: [-5, 10, -218] }, // Paris quarter
  { t: 0.52, pos: [0, 10, -226], look: [0, 18, -264] }, // avenue toward the tower
  { t: 0.6, pos: [17, 15, -243], look: [0, 20, -272] }, // Adopt three-quarter
  { t: 0.68, pos: [6, 11, -252], look: [0, 17, -272] }, // close on the facade
  { t: 0.74, pos: [-9, 8, -280], look: [-16, 6, -316] }, // turn into workshop lane
  { t: 0.82, pos: [-15, 7, -312], look: [-9, 5, -340] },
  { t: 0.88, pos: [-4, 9, -338], look: [0, 6, -370] },
  { t: 1.0, pos: [0, 17, -354], look: [0, 9, -382] }, // the open plot
];

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

function smooth(x: number) {
  return x * x * (3 - 2 * x);
}

export function cameraAt(progress: number, outPos: THREE.Vector3, outLook: THREE.Vector3) {
  const t = Math.min(Math.max(progress, 0), 1);
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
  const k0 = KEYS[i];
  const k1 = KEYS[i + 1];
  const f = smooth((t - k0.t) / (k1.t - k0.t));
  outPos.copy(_a.fromArray(k0.pos)).lerp(_b.fromArray(k1.pos), f);
  outLook.copy(_a.fromArray(k0.look)).lerp(_b.fromArray(k1.look), f);
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
