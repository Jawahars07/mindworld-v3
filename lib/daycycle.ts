import * as THREE from "three";

// The film's light, keyframed on scroll progress. Night blueprint → sunrise over
// Bengaluru → noon above the clouds → Paris golden hour → sunset at the open plot.
// Everything that lights the world reads from the shared DAY uniforms; updateDay()
// is called exactly once per frame by the Scene driver.

export type DayStop = {
  t: number;
  sunAzimuth: number; // radians around Y (0 = +X east of the avenue)
  sunElevation: number; // radians above horizon (negative = below)
  sun: string; // sun light color (intensity baked in via lerped scalar)
  sunIntensity: number;
  sky: string; // hemispheric ambient from above / sky zenith
  horizon: string; // sky at the horizon (SkyDome interpolates zenith→horizon)
  ground: string; // hemispheric bounce from below
  fog: string;
  fogDensity: number;
  night: number; // 1 full night … 0 full day (drives lit windows, stars logic)
  stars: number;
};

// Art direction in one table. t values line up with ACTS in path.ts.
export const DAY_STOPS: DayStop[] = [
  // Act 0 — blueprint night
  { t: 0.0,  sunAzimuth: 0.6, sunElevation: -0.35, sun: "#000000", sunIntensity: 0.0, sky: "#0A1128", horizon: "#0C1530", ground: "#060B1C", fog: "#0A1128", fogDensity: 0.0053, night: 1.0, stars: 1.0 },
  { t: 0.07, sunAzimuth: 0.6, sunElevation: -0.12, sun: "#2E1E3E", sunIntensity: 0.1, sky: "#101736", horizon: "#2A2440", ground: "#080D20", fog: "#131A38", fogDensity: 0.0053, night: 0.96, stars: 0.85 },
  // Act 1 — sunrise hits Bengaluru, the compile front sweeps in
  { t: 0.11, sunAzimuth: 0.55, sunElevation: 0.06, sun: "#FF8E4D", sunIntensity: 1.35, sky: "#3D3560", horizon: "#FF7E4D", ground: "#2A1E28", fog: "#77507A", fogDensity: 0.0047, night: 0.55, stars: 0.12 },
  { t: 0.16, sunAzimuth: 0.62, sunElevation: 0.22, sun: "#FFB876", sunIntensity: 1.6, sky: "#5E7FB0", horizon: "#FFB08A", ground: "#4A3B34", fog: "#B08A8C", fogDensity: 0.0042, night: 0.28, stars: 0.0 },
  { t: 0.24, sunAzimuth: 0.75, sunElevation: 0.42, sun: "#FFDCAC", sunIntensity: 1.8, sky: "#7FB0DC", horizon: "#D8E2E8", ground: "#5E5448", fog: "#C2CCD4", fogDensity: 0.0038, night: 0.1, stars: 0.0 },
  { t: 0.31, sunAzimuth: 0.9, sunElevation: 0.62, sun: "#FFF0D4", sunIntensity: 1.9, sky: "#6FAEE0", horizon: "#C9D8E2", ground: "#6A6052", fog: "#BCCBD6", fogDensity: 0.0034, night: 0.04, stars: 0.0 },
  // Act 2 — noon above the clouds, thin bright air
  { t: 0.4,  sunAzimuth: 1.35, sunElevation: 0.98, sun: "#FFF8EA", sunIntensity: 2.1, sky: "#4E9CE0", horizon: "#C6DCEE", ground: "#8E9AA6", fog: "#BFD4E6", fogDensity: 0.0026, night: 0.0, stars: 0.0 },
  // Act 3 — descent into Paris, afternoon sliding to golden hour
  { t: 0.5,  sunAzimuth: 2.0, sunElevation: 0.55, sun: "#FFE9C2", sunIntensity: 2.0, sky: "#7FB0D8", horizon: "#F0E4D0", ground: "#6E6252", fog: "#D3D6D2", fogDensity: 0.0038, night: 0.03, stars: 0.0 },
  { t: 0.62, sunAzimuth: 2.35, sunElevation: 0.34, sun: "#FFCE8E", sunIntensity: 1.9, sky: "#8FA8C8", horizon: "#F2D6AC", ground: "#66584A", fog: "#D6C6AC", fogDensity: 0.0041, night: 0.07, stars: 0.0 },
  { t: 0.74, sunAzimuth: 2.6, sunElevation: 0.19, sun: "#FFAE5E", sunIntensity: 1.75, sky: "#8898B8", horizon: "#F4BE7E", ground: "#5C4E42", fog: "#D0AE86", fogDensity: 0.0044, night: 0.14, stars: 0.0 },
  { t: 0.85, sunAzimuth: 2.8, sunElevation: 0.1, sun: "#FF8E48", sunIntensity: 1.6, sky: "#7A80A8", horizon: "#F09858", ground: "#4E4038", fog: "#BE8E6A", fogDensity: 0.0047, night: 0.24, stars: 0.02 },
  // Act 4 — sunset at the open plot, then first stars of dusk
  { t: 0.92, sunAzimuth: 2.95, sunElevation: 0.03, sun: "#FF6B3D", sunIntensity: 1.35, sky: "#5A5488", horizon: "#E86E42", ground: "#3A3034", fog: "#8E5E58", fogDensity: 0.005, night: 0.42, stars: 0.2 },
  { t: 1.0,  sunAzimuth: 3.1, sunElevation: -0.07, sun: "#B4486E", sunIntensity: 0.55, sky: "#221E4A", horizon: "#6E3E62", ground: "#141224", fog: "#31284A", fogDensity: 0.0053, night: 0.78, stars: 0.7 },
];

export type DayState = {
  sunDir: THREE.Vector3;
  sun: THREE.Color;
  sunIntensity: number;
  sky: THREE.Color;
  horizon: THREE.Color;
  ground: THREE.Color;
  fog: THREE.Color;
  fogDensity: number;
  night: number;
  stars: number;
};

const COLS = DAY_STOPS.map((s) => ({
  sun: new THREE.Color(s.sun),
  sky: new THREE.Color(s.sky),
  horizon: new THREE.Color(s.horizon),
  ground: new THREE.Color(s.ground),
  fog: new THREE.Color(s.fog),
}));

function smooth(x: number) {
  return x * x * (3 - 2 * x);
}

export function dayAt(progress: number, out?: DayState): DayState {
  const t = Math.min(Math.max(progress, 0), 1);
  let i = 0;
  while (i < DAY_STOPS.length - 2 && t > DAY_STOPS[i + 1].t) i++;
  const a = DAY_STOPS[i];
  const b = DAY_STOPS[i + 1];
  const s = smooth((t - a.t) / (b.t - a.t));
  const o: DayState =
    out ?? {
      sunDir: new THREE.Vector3(),
      sun: new THREE.Color(),
      sunIntensity: 0,
      sky: new THREE.Color(),
      horizon: new THREE.Color(),
      ground: new THREE.Color(),
      fog: new THREE.Color(),
      fogDensity: 0,
      night: 0,
      stars: 0,
    };
  const az = a.sunAzimuth + (b.sunAzimuth - a.sunAzimuth) * s;
  const el = a.sunElevation + (b.sunElevation - a.sunElevation) * s;
  o.sunDir.set(Math.cos(az) * Math.cos(el), Math.sin(el), -Math.sin(az) * Math.cos(el)).normalize();
  o.sun.copy(COLS[i].sun).lerp(COLS[i + 1].sun, s);
  o.sunIntensity = a.sunIntensity + (b.sunIntensity - a.sunIntensity) * s;
  o.sky.copy(COLS[i].sky).lerp(COLS[i + 1].sky, s);
  o.horizon.copy(COLS[i].horizon).lerp(COLS[i + 1].horizon, s);
  o.ground.copy(COLS[i].ground).lerp(COLS[i + 1].ground, s);
  o.fog.copy(COLS[i].fog).lerp(COLS[i + 1].fog, s);
  o.fogDensity = a.fogDensity + (b.fogDensity - a.fogDensity) * s;
  o.night = a.night + (b.night - a.night) * s;
  o.stars = a.stars + (b.stars - a.stars) * s;
  return o;
}

// Shared uniform objects — every lighting-aware ShaderMaterial spreads THESE value
// objects into its own uniforms dict, so one updateDay() call per frame lights the
// whole city. See CONVENTIONS.md.
export const DAY = {
  uSunDir: { value: new THREE.Vector3(0, -1, 0) },
  uSunColor: { value: new THREE.Color("#000000") }, // premultiplied by intensity
  uSkyCol: { value: new THREE.Color("#0A1128") },
  uHorizonCol: { value: new THREE.Color("#0C1530") },
  uGroundCol: { value: new THREE.Color("#060B1C") },
  uFogColor: { value: new THREE.Color("#0A1128") },
  uFogDensity: { value: 0.0053 },
  uNight: { value: 1 },
  uStars: { value: 1 },
};

const scratch: DayState = {
  sunDir: new THREE.Vector3(),
  sun: new THREE.Color(),
  sunIntensity: 0,
  sky: new THREE.Color(),
  horizon: new THREE.Color(),
  ground: new THREE.Color(),
  fog: new THREE.Color(),
  fogDensity: 0,
  night: 0,
  stars: 0,
};

export function updateDay(progress: number): DayState {
  const d = dayAt(progress, scratch);
  DAY.uSunDir.value.copy(d.sunDir);
  DAY.uSunColor.value.copy(d.sun).multiplyScalar(d.sunIntensity);
  DAY.uSkyCol.value.copy(d.sky);
  DAY.uHorizonCol.value.copy(d.horizon);
  DAY.uGroundCol.value.copy(d.ground);
  DAY.uFogColor.value.copy(d.fog);
  DAY.uFogDensity.value = d.fogDensity;
  DAY.uNight.value = d.night;
  DAY.uStars.value = d.stars;
  return d;
}
