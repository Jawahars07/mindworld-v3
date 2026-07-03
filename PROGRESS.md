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
- [ ] It4: District character — BLR (water tanks, low-rise, auto) vs Paris (mansard profile,
      uniform heights) vs Workshops (small sheds w/ signs) — silhouettes must differ
- [ ] It5: Open plot — crane + ghost blueprint building + contact framing; favicon (404 now)
- [ ] It6: Mobile 390px pass · reduced-motion + no-WebGL fallback · Lighthouse
- [ ] It7: Full-path QA sweep, perf, polish (Sheet00 hero/wireframe overlap, scroll hint collides
      with subtitle) → then STOP, report ready for review. NO deploy before approval.

## Iteration log
- It1 (2026-07-03): all core systems in. Dev: port 3033. Shots: node scripts/shoot.mjs.
  Watch: shader uses discard sweep + additive edge lines; window cells hash-lit; fog manual
  exp2 in both shaders (no scene.fog). Damped camera needs ~2s settle before screenshots.
