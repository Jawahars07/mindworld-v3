// Project rooms — one per building on the route. Every fact traces to
// lib/sheets.ts / PROGRESS.md / the wiki. Metrics are honest or absent:
// Adopt's playbook seed stats are illustrative and are NEVER cited here.

export type Room = {
  slug: string;
  name: string;
  tagline: string;
  role: string;
  stack: string[];
  metric: string; // one honest line — status or a verified number, no inventions
  body: string;
  links: { label: string; href: string }[];
  photo: string; // public path; a pinned-print placeholder renders if missing
  flagship?: boolean;
};

export const ROOMS: Room[] = [
  {
    slug: "adopt",
    name: "ADOPT",
    tagline: "The GenAI adoption companion — task in, working practice out.",
    role: "Sole product owner · designed, built, shipped",
    stack: ["Next.js", "React", "Claude API", "Tailwind", "Vercel"],
    metric: "SHIPPED 2026 · LIVE · built to mirror a real GenAI-adoption apprenticeship JD",
    body: "Type a work task. Adopt qualifies it — a fit score for GenAI, a ready-to-paste prompt, and an adoption guide for rolling it into the team's week. The hard part of enterprise AI isn't the model, it's the adoption curve — this is a tool aimed exactly there.",
    links: [
      { label: "OPEN THE LIVE APP", href: "https://adopt-eight.vercel.app" },
      { label: "HOW IT WORKS", href: "https://github.com/Jawahars07/adopt" },
    ],
    photo: "/photos/adopt.png",
    flagship: true,
  },
  {
    slug: "webforge",
    name: "WEBFORGE",
    tagline: "A one-line brief in Telegram becomes a deployed website.",
    role: "Built end-to-end",
    stack: ["Telegram Bot API", "Claude (Haiku → Sonnet)", "Node.js", "Vercel"],
    metric: "AGENT PIPELINE · brief → generated site → live deploy",
    body: "Send the bot one line about your business. A cheap model drafts, a stronger model refines, and the result deploys itself. Built to prove an agent can own a full delivery loop — not just a chat window.",
    links: [{ label: "WEBFORGE — REPO", href: "https://github.com/Jawahars07/webforge" }],
    photo: "/photos/webforge.png",
  },
  {
    slug: "tara",
    name: "TARA",
    tagline: "A voice assistant that listens locally and thinks with Claude.",
    role: "Built end-to-end",
    stack: ["Whisper (local)", "Claude API", "Python", "macOS"],
    metric: "LOCAL-FIRST · audio is transcribed on-device before anything leaves the Mac",
    body: "Tara sits in the Mac's notch as a quiet orb. Speech is transcribed locally with Whisper; only text goes to the model. Voice UI with the privacy default the enterprise actually wants.",
    links: [{ label: "TARA — REPO", href: "https://github.com/Jawahars07/tara" }],
    photo: "/photos/tara.png",
  },
  {
    slug: "rta",
    name: "RTA LIVING",
    tagline: "A smart-home platform for a real house.",
    role: "Project — in development",
    stack: ["IoT", "Next.js", "Home automation"],
    metric: "STATUS: IN DEVELOPMENT · honestly marked",
    body: "A small smart house being wired for real daily use. It's not finished, and it's listed as exactly that — a project in progress, not a claim.",
    links: [{ label: "RTA LIVING — REPO", href: "https://github.com/Jawahars07/rta-living" }],
    photo: "/photos/rta.png",
  },
  {
    slug: "co2",
    name: "CO₂ ML LAB",
    tagline: "Vehicle CO₂ prediction — the first deployed model.",
    role: "B.Tech project, REVA University",
    stack: ["Python", "XGBoost", "Flask", "scikit-learn"],
    metric: "4 MODELS COMPARED on a real dataset · public repo · runnable app",
    body: "An XGBoost model that outperformed three others on a real vehicle-emissions dataset, wrapped in a Flask app anyone can run. Where shipping-over-slides started.",
    links: [
      { label: "CO₂ PROJECT — REPO", href: "https://github.com/Jawahars07/vehicle-co2-emission-prediction" },
    ],
    photo: "/photos/co2.png",
  },
  {
    slug: "mindworld",
    name: "THE DRAFTING OFFICE",
    tagline: "The room where this city was drawn — in code.",
    role: "This site. Designed and built from scratch",
    stack: ["Next.js 16", "React Three Fiber", "Three.js", "zustand", "Tailwind"],
    metric: "VERIFIED 60FPS at 1440×900 and 390×844 · procedural city, one draw call per district",
    body: "MINDWORLD OS is itself the résumé line: a continuous camera route, a day-cycle lighting engine shared by every shader, an instanced city, and the skill galaxy running on the live local registry. You're inside the proof.",
    links: [{ label: "GITHUB — Jawahars07", href: "https://github.com/Jawahars07" }],
    photo: "/photos/mindworld.png",
  },
];

export const roomBySlug = (slug: string | null) => ROOMS.find((r) => r.slug === slug) ?? null;

// Which sheets offer which rooms (Hud "ENTER" buttons).
export const SHEET_ROOMS: Record<string, string[]> = {
  "01·A": ["co2"],
  "04": ["adopt"],
  "05": ["webforge", "tara", "rta", "mindworld"],
};
