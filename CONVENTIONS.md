# mindworld v4 "The City Compiles" — build conventions

Binding for every module (subagent or integrator). Violations get rejected at integration.
Read PROGRESS.md for history; read this for contracts. Never invent an API — if it isn't
listed here or already in the repo, ask the integrator.

## The film (act map — single source: `lib/path.ts` ACTS)

| Act | Scroll range | World z | Light |
|---|---|---|---|
| 0 BLUEPRINT NIGHT | 0.00–0.08 | overhead | night, stars |
| 1 SUNRISE / BENGALURU | 0.08–0.31 | -30…-110 | sunrise → morning |
| 2 THE CROSSING | 0.31–0.48 | -110…-185, high | noon above clouds |
| 3 PARIS | 0.48–0.88 | -190…-345 | afternoon → golden hour |
| 4 SUNSET / OPEN PLOT | 0.88–1.00 | -354…-382 | sunset → dusk |

Coordinates: city laid along −Z. Avenue = x ∈ [−7, 7]. Ground y = 0.
RULE (learned v3): any camera key with |x| > 7 needs an exclusion bubble in nearby
districts (`Math.hypot(x−kx, z−kz) < 11`) or a building spawns on the lens.

## Hard rules

1. **No `drei <Html>` at depth** — all UI is the DOM HUD (v2 lesson).
2. **Never setState in useFrame.** Read scroll via `useWorld.getState().progress`; mutate refs/uniforms.
3. **No new npm deps** without integrator approval. Current allowed set = package.json.
4. **Seeded randomness only** in geometry/layout (mulberry/LCG per component, seed prop). No `Math.random()` — screenshots must be reproducible.
5. **Zero facts in copy from your own head.** All text content lives in `lib/sheets.ts` (integrator-owned).
6. **Dispose:** memoized geometries/materials created outside JSX must be disposed on unmount (or rely on R3F auto-dispose by declaring them in JSX).
7. **reduced-motion:** all idle/ambient animation (traffic, crowds, clouds drifting, blinking) must freeze when `useWorld.getState().reduced` is true. Scroll-driven motion stays.
8. **Quality tier:** read `useWorld.getState().tier` (`"high" | "low"`). Low tier: halve instance counts, skip shadows, skip non-essential animation. Never branch on UA yourself.

## Shared day-cycle uniforms (single source of truth for ALL lighting)

`lib/daycycle.ts` exports:

```ts
export const DAY: {
  uSunDir:    { value: THREE.Vector3 };  // normalized, world space
  uSunColor:  { value: THREE.Color };    // includes intensity (can exceed 1)
  uSkyCol:    { value: THREE.Color };    // hemispheric ambient from sky
  uGroundCol: { value: THREE.Color };    // hemispheric ambient from ground
  uFogColor:  { value: THREE.Color };
  uFogDensity:{ value: number };         // exp2 fog, applied IN SHADER (no scene.fog)
  uNight:     { value: number };         // 1 = full night … 0 = full day
  uStars:     { value: number };         // star opacity 0..1
};
export function updateDay(progress: number): void; // integrator calls once per frame
export function dayAt(progress: number): DayState; // pure, for non-shader consumers
```

Custom ShaderMaterials share light state by **spreading the same value objects**:
`uniforms: { ...myUniforms, uSunDir: DAY.uSunDir, uSunColor: DAY.uSunColor, ... }`.
Never clone these; never write to them outside `updateDay`.

Standard fog line for every fragment shader:
```glsl
float fog = 1.0 - exp(-pow(vViewDist * uFogDensity, 2.0));
col = mix(col, uFogColor, fog);
```

## Compile shader chunks

`lib/compile.ts` exports GLSL strings `compileVert`, `compileFragPars`, `compileFragMain`
implementing: bottom-up build sweep by `uBuild`/`aBuild` (discard above front), cyan
construction front band, sun+hemisphere lighting, procedural windows (lit ratio scales
with `uNight`), fog. `Building.tsx` and the instanced district system must both use these
chunks — one lighting model everywhere.

Palette anchors: night `#0A1128` · blueprint cyan `#5FD4F5` · window amber `#FFB454`.
Materials by district (albedo families): BLR brick `#B56A4A`/render `#D9B98C`/concrete;
Paris limestone `#E3D9C2` + zinc roofs `#8A93A0`. Banyan/market greens for BLR props.

## Store (`lib/store.ts`)

`useWorld`: `{ progress, reduced, tier, setProgress, setReduced, setTier }`. Do not add
fields without integrator sign-off.

## Assets

Hero GLBs in `public/models/*.glb`, Draco or meshopt compressed, loaded with
`useGLTF` + `useGLTF.preload`, wrapped in `<Suspense>` with a **procedural placeholder
fallback** so the film never hard-depends on an asset. Total asset budget ≤ 8 MB;
each hero ≤ 1.5 MB. Everything non-hero stays procedural/instanced.

## Verification (every module, before handing back)

1. `npx tsc --noEmit` clean.
2. Module renders inside `components/Scene.tsx` with `npm run dev -- -p 3033`,
   `node scripts/shoot.mjs` — zero console errors, screenshot READ, not inferred.
3. State any check you could not run. Never report unverified work as done.
