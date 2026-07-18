# Mindworld v3 — "Blueprint City" · PROGRESS

Session memory. Read this first every iteration. Keep it current, keep it short.

## Concept (approved by Jawahar 2026-07-03)
Scroll-driven 3D night city that **compiles as you scroll**: districts start as cyan
blueprint wireframes, buildings rise floor-by-floor (construction-sweep shader) into warm
built structures as the camera approaches. Scrollbar = build progress. Positioning: AI
builder who ships working tools. **Banned words: founder, venture, entrepreneurship, startup.**
Quality bar: awwwards-level. Deploy target (AFTER approval only): jawaharnaidu.com.

## Script — 7 sheets (HUD styled as blueprint title blocks)
- 00 SKYLINE — aerial night city, name + "I build AI tools people actually use"
- 01 FOUNDATIONS — Bengaluru 2021–25, B.Tech CS REVA. Small building: CO₂ ML project (XGBoost, Flask)
- 02 THE CROSSING — camera above clouds, dotted flight arc BLR→PAR
- 03 NEW GROUND — Paris, ESSEC MIM, apprenticeship track (mansard roofs, plaza)
- 04 THE FLAGSHIP — **Adopt tower**, city center, ONLY fully-built+lit building, facade shows
  product UI (task→fit score→prompt→guide). Doors: live app https://adopt-eight.vercel.app ·
  repo https://github.com/Jawahars07/adopt. "Built to mirror a real Digital Workplace & GenAI
  Adoption apprentice JD."
- 05 THE WORKSHOPS — WebForge (Telegram AI site generator, Haiku→Sonnet), Tara (voice AI,
  Whisper+Claude, notch orb), Rta Living (small smart house, "in development", project-only),
  tiny drafting office = this site itself (recursive)
- 06 THE OPEN PLOT — empty lot + crane + blueprint "Your team's next tool". Ask: GenAI/digital-
  workplace apprenticeship in France. Contact: jawaharnaidu07@gmail.com, github.com/Jawahars07,
  LinkedIn?, CV link? (roster was my call per user; contact extras TBD)

## Visual language
Palette: night #0A1128 family · blueprint cyan lines · built = warm limestone + amber windows.
Construction-front cyan glow line where the sweep is. Bloom + fog + faint paper grain.
Fonts (next/font, self-hosted): Archivo (display) + IBM Plex Mono (title blocks).
Zero image/3D assets — all geometry procedural.

## Tech
Next 16.2.9 / React 19 / R3F 9 / drei 10 / three 0.184 / zustand / Tailwind 3 (mirrors v2 known-good).
Native body scroll (spacer ~700vh) → zustand store → camera spline (CatmullRom) + DOM HUD.
NO drei <Html> at depth (v2 lesson). Buildings: custom ShaderMaterial, build-sweep by worldY
(discard above front), procedural window grid by normal axis, EdgesGeometry cyan lines.

## Verification protocol (every iteration)
1. `lsof -ti:3033 | xargs kill -9` (kill stale servers; dev port = 3033)
2. `npm run dev -- -p 3033` in background
3. Headless Playwright + system Chrome: channel="chrome", args --use-gl=angle
   --use-angle=swiftshader --enable-unsafe-swiftshader; scroll to several progress points,
   screenshot to shots/, READ the PNGs before claiming done. Script: scripts/shoot.mjs
4. Commit locally with clear message. NEVER push/deploy before Jawahar's approval.

## Status
- [x] Concept approved; roster chosen (Adopt flagship · WebForge · Tara · Rta Living · CO₂ in BLR · drafting office)
- [x] Iteration 1: scaffold + scroll rig + build-sweep shader + generic districts + HUD title blocks
      + progress rail + SEO text mirror + shots verified (shots/p*.png). Mechanic reads GREAT.
- [x] It2: Adopt landmark done + camera reframed (t=0.52 full tower · 0.60 hero 3/4 · 0.68 facade
      panel legible). Facade UI + roof sign are canvas textures (cssFamily() resolves next/font
      vars). Cranes = reusable <Crane> in AdoptTower.tsx. favicon fixed (app/icon.svg).
      ⚠ polish: roof sign renders as faint strip at t=0.52 — canvas likely drawn before webfont
      loaded; await document.fonts.ready before drawing text textures.
- [x] It3: Crossing done — revision clouds (drafting symbol, on-language), dashed arc + paper
      plane rides it, BLR/CDG labels. Flagship extras gated >0.46. fonts.ready redraw fix.
      Camera: cruise key needed look-at y≈45 (quadratic arc apex ~46, NOT control-point 78).
- [x] It4: District character done — BLR (tanks/headrooms/parapets, REVA + CO₂ ML LAB signs) vs
      Paris (uniform 8.5–10h, zinc mansard frustums, chimneys, ESSEC sign). Sign.tsx = reusable
      canvas nameplate w/ visibleAfter gate. Lights added for meshStandardMaterial props.
      RULE learned: any camera key off the avenue (|x|>7) needs a District exclude bubble
      (Math.hypot vs key pos < 11) or a block spawns on the lens.
- [x] It5: Workshops (WebForge antenna · Tara orb · Rta breathing windows · drafting office w/
      mini wireframe city) + Open Plot (ghost bldg, crane, 24 MONTHS dimension line, plot dashes).
      FIX: Sign now shrink-to-fit — fixed 512px canvas was clipping long labels (looked like 3D
      occlusion, was texture overflow). Lane cam lifted to y=13 (fillers blocked lens at y=6).
- [x] It6: Mobile 390px verified (hero + flagship strong) · StaticFallback (no-WebGL flat drawing
      set) · reduced-motion freezes all idle pulses · portrait FOV 68 · hero scroll cue at bottom
- [x] It7 (FINAL): prod build green · full-path sweep (9 desktop + 4 mobile keyframes) · ADOPT
      roof sign fixed (was occluded by own roofline from low cameras — moved to spire y=46.8,
      now shared Sign component) · hero text shadows. CITY COMPLETE — awaiting Jawahar's review.

## STATUS: LIVE ON jawaharnaidu.com (2026-07-04). Loop complete.
Approved with refinements ("looks fantastic"): clarity pass (fog 0.0053, brighter facades/grid,
tighter bloom, dpr 2), persistent GITHUB/CV/EMAIL rail, CV pdf in public/ (from career-ops
output/cv-master.pdf — re-copy when CV updates!), hero chip + Sheet 06 say "24-month" explicitly.
Shipped: repo github.com/Jawahars07/mindworld-v3 (main) · Vercel project mindworld-v3 ·
jawaharnaidu.com moved from old "portfolio" project via API (DELETE v9/projects/portfolio/
domains + POST v10/projects/mindworld-v3/domains; `vercel domains rm` would have nuked the
account-level domain — never use it for moves). www → apex 308. Verified live: title +
flagship sheet screenshot against https://jawaharnaidu.com.
Future ideas (unprompted, not committed): rickshaw/2CV easter eggs, Lighthouse pass, OG image.

## Iteration log
- It1 (2026-07-03): all core systems in. Dev: port 3033. Shots: node scripts/shoot.mjs.
  Watch: shader uses discard sweep + additive edge lines; window cells hash-lit; fog manual
  exp2 in both shaders (no scene.fog). Damped camera needs ~2s settle before screenshots.

## Refine 2 — phone feedback (2026-07-04, shipped)
Plan-view opening (dead-overhead key t=0, reveal-on-scroll) · Hermite camera spline (even
pacing — smoothstep-per-segment was the "odd scroll" cause) · flagship fast uniform sweep +
single tier colour (was popping/banded) · facade panel 1.38x on portrait (fits 390px fully) ·
copy neutralised to "12–24 MONTH APPRENTICESHIP · FRANCE" (hero chip, Sheet 06, dimension sign).
REMINDER that bit us: npm start serves the LAST BUILD — rebuild before re-shooting.

## Content update — PandaECE + adoption positioning (2026-07-04, shipped)
Council brief resolved: keep Blueprint City (Awwwards scan: mechanic-embodies-story already
matches winners; Control Room rebuild rejected). Added PandaECE landmark (tallest BLR bldg,
[13,0,-70], camera bubble at [-10,-50]) + real story in Sheet 01 (GenAI for 30+ SMEs, -40%
prod time, human review). Positioning widened: "I build AI tools — and get teams to actually
use them." Meta/JSON-LD/keywords now AI transformation & adoption. Rule locked: real shipped
work only, never coursework cases (Domino RH/Zipcar/AwareLiving out).

---

# v4 — "THE CITY COMPILES" (branch v4-city-compiles, 2026-07-12/13) — AT GATE, awaiting Jawahar

Film: 5 acts / 11 sheets. Act0 night blueprint plan → Act1 sunrise Bengaluru (ACADEMIC REVA+CO₂ ·
CAREER PandaECE+PocketLite · CULTURAL ISKCON temple hero) → Act2 takeoff/crossing (airliner GLB,
clouds, contrail) → Act3 Paris afternoon→golden hour (ESSEC · ADOPT flagship · workshops ·
integration street) → Act4 sunset open plot (ask: 12–24mo apprenticeship, Sept 2026).

New systems: lib/daycycle.ts (keyframed sun/sky/fog, shared DAY uniforms — ONE update/frame lights
everything) · lib/compile.ts (shared shader chunks) · InstancedDistrict (1 draw call/district,
in-shader wireframe→fill) · Traffic (rickshaws BLR / cars Paris, day-cycle headlights) · Crowds
(cylindrical-billboard SDF silhouettes) · SkyDome+Clouds · Flight · Heroes.tsx (4 Blender GLBs,
draco, 52KB total: airliner/rickshaw/citroen/temple; decoders in public/draco). Tier system in
store (low = halved counts). CONVENTIONS.md = module contracts. CONTENT-PARKING.md = positioning
decisions + fact-safety flags (cv.md French B1 vs wiki A1 conflict flagged).

LESSONS (bugs that cost time): (1) normalMatrix = VIEW space — face classification/sun lighting
need world (mat3(modelMatrix)) + object (raw normal) instead; solid-cyan-slab + camera-relative
lighting bug. (2) floor(n.xz*3.0) flickers per-fragment on axis faces → +0.5 (round) fixes window
speckle. (3) Billboard height must be WORLD-up, only width view-space (cylindrical) or people
become stalks under a pitched camera. (4) Blender scale = FULL extent (size×scale), not half.
(5) shoot.mjs first run after big shader changes can hit 30s screenshot timeout (compile stall) —
rerun, don't debug ghosts.

Verified: build clean (Next 16.2.9, 6/6 static) · tsc clean · 16-pt desktop + 7-pt mobile sweeps
on prod build, zero console errors after favicon.ico fix · 60fps @ 1440x900 AND 390x844 (Metal GPU,
heaviest scenes 0.21/0.60/0.76; swiftshader numbers are meaningless — use --use-angle=metal) ·
assets 52KB models + 752KB draco decoders, budget ≤8MB.

Preview: https://mindworld-v3-git-v4-city-compiles-jawaharnaidu07-5427s-projects.vercel.app
(SSO-protected — Jawahar opens it logged into Vercel; token couldn't mint bypass link, so E2E ran
on the identical local prod build instead). GATE: no merge to main / no production until approval.

---

# MINDWORLD OS (on top of v4, branch v4-city-compiles, 2026-07-17/18) — AT GATE

The OS shell over the City Compiles film. New systems, all DOM layers over the Canvas:
- Boot.tsx — cold boot typing REAL system data (skill counts from live registry), skippable,
  once/session (mw:booted). Reduced-motion: instant lines (reads media query directly — the
  store flag arrives late via dynamic Scene import).
- TopBar/Dock/CommandPalette — persistent OS chrome; ⌘K palette (GO/DO/LINK actions);
  backtick/~ opens the terminal. TopBar absorbed the old Hud link rail.
- RecruiterMode.tsx — 90s autopilot: 6 beats (who → BLR → Adopt ×2 → galaxy 12s → ask) driving
  window scroll via lib/nav.ts travelTo (ScrollDriver stays the single source of truth; any
  wheel/touch/Esc hands control back). AUTO-STARTS on mobile (<760px) once per session (mw:toured).
  Ends on a close card: CV + email.
- Constellation.tsx (+GalaxyGate lazy) — Canvas2D port of the agentic-os galaxy fed by
  lib/registry.json, synced at prebuild from ../agentic-os/registry.json with realpath dedupe
  (scripts/sync-registry.mjs). 261 skills · 13 authored at last sync — ALL counts render from
  data, never hardcoded. Search dims, click picks a star, drag/wheel pan-zoom, seeded layout.
- Room.tsx + lib/rooms.ts — 6 project rooms (adopt flagship · webforge · tara · rta · co2 ·
  mindworld). Facts traced to sheets.ts/wiki; NO invented metrics; Adopt seed stats never cited.
  Photos pending → pinned-print placeholder via build-time lib/photos.json manifest (no 404s).
- Terminal.tsx — whoami, ls projects, ls skills, run adopt, sudo hire (mailto), mindworld
  (sun toggle via scroll), help/clear/exit. Voice: short, honest.
- StaticFallback + sr-only article extended with OS/registry/rooms parity. Metadata renamed
  MINDWORLD OS.

LESSONS: (1) shoot/fps scripts must pre-seed mw:booted AND mw:toured or the mobile auto-tour
fights the scripted scroll (caught as desynced mobile sweep). (2) /_vercel/insights/script.js
404s on local prod ALWAYS — not a defect, filter it. (3) Missing images: manifest at build time
beats onError fallbacks (zero console 404s). (4) label-content-name-mismatch: aria-label must
contain the visible text (⌘K button).

VERIFIED (2026-07-18): tsc clean · build clean 6/6 static · 16-pt desktop + 7-pt mobile prod
sweeps read, zero console errors (excl. known insights 404) · boot/palette/tour/galaxy/rooms/
terminal each screenshot-verified · reduced-motion boot instant + galaxy static · 60fps flat at
1440x900 AND 390x844 (metal, p=0.21/0.6/0.76) · assets 1.7MB ≤ 8MB · Lighthouse A11y 100 /
SEO 100 / BP 96 / Agentic 100.
PENDING INPUTS: public/refs (reels), public/photos (prints), public/audio (sound pass skipped —
no dead code shipped). og.png still shows Blueprint City art.
GATE: preview deploy only. No merge to main / no production without Jawahar's yes.

---

# MINDWORLD OS — Iteration 2 "masterpiece pass" (2026-07-18, per Jawahar's feedback)

Asks: airliner reversed + weak · headline bland · add sun + birds · integrate lenis/gsap/
vanta/reactbits · premium bar.

- AIRLINER ROOT FIX: Matrix4.lookAt(eye,target) sets +Z = eye−target; both aircraft models
  carry the nose along −Z, so lookAt args must be (posA, posB) — was (posB, posA) = tail-first
  flight. Fixed in Flight.tsx orientation block; verified nose-first at p=0.36/0.40/0.44.
- SUN: SkyDome disc enlarged + corona layer that swells near the horizon (lowSun factor).
- BIRDS (components/sky/Birds.tsx): instanced chevron flocks, orbit+flap fully in-shader,
  4 flocks (BLR sunrise ×2, Paris golden ×2). LESSONS: (1) flat geometry viewed edge-on is
  invisible — billboard in view space (Crowds lesson, relearned); (2) R3F JSX <instancedMesh>
  + custom InstancedBufferAttributes failed silently — manual THREE.InstancedMesh via
  <primitive> (exact Crowds pattern) renders fine. Don't fight it, mirror Crowds.
- HERO (components/os/Hero.tsx): new statement stack ("I build AI systems people actually
  use." + boots/runs/real line + shiny SEEKING chip), CSS-stagger reveal keyed off .hero-on
  (booted). LESSON: a GSAP timeline effect here silently never ran in dev (suspected
  HMR/store duplication); CSS transitions keyed off a class cannot misfire. Also:
  .hero-stage owns `transform`, so Tailwind translate utilities on the same node are
  overridden — center with inset-x-0 instead.
- BOOT: skip handler now preventDefaults (space was scrolling the runway). Hud initializes
  progress from the store (scroll-before-hydration left the hero stuck — real user impact
  with browser scroll restoration).
- LIBS (security-vetted, pinned, skills-lock.json): lenis 1.3.25 (SmoothScroll.tsx; travelTo
  routes through lenis.scrollTo — one smoothing engine), gsap 3.15.0 (galaxy zoom-in intro),
  vanta 0.5.24 (installed; NOT integrated — would fight the R3F scene; candidate: boot bg),
  react-bits npm = NAME COLLISION (different project) → ReactBits ShinyText vendored as CSS.
- TEST HARNESS LESSON: headless keyboard events don't reach the window keydown listener —
  scripts click the SKIP button instead of pressing keys.
