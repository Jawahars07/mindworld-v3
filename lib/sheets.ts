// The screenplay: 11 sheets across 5 acts. `range` is scroll progress [start, end).
// HUD shows a sheet's title block while progress is inside its range.
// Every fact here traces to ohara/wiki + career-ops/cv.md. Nothing invented.

export type Sheet = {
  no: string;
  act: number; // index into ACTS (lib/path.ts)
  title: string;
  sub?: string;
  body: string;
  meta: string; // bottom line of the title block: place · date · scale
  range: [number, number];
  links?: { label: string; href: string }[];
};

export const SHEETS: Sheet[] = [
  {
    no: "00",
    act: 0,
    title: "THE CITY COMPILES",
    sub: "Jawahar Naidu",
    body: "Every district below is something real — places I studied, teams I worked with, products I shipped. Right now it's a blueprint. Scroll, and the sun comes up on it.",
    meta: "NIGHT PLAN · 2019—2026 · SCALE 1:CAREER",
    range: [0.0, 0.08],
  },
  {
    no: "01",
    act: 1,
    title: "SUNRISE — BENGALURU",
    body: "First light, 12°58′N. The city that built me: an engineering degree, a first job with real clients, and a community that taught me to run things at scale.",
    meta: "BENGALURU · 2019—2025 · COMPILE FRONT MOVING",
    range: [0.08, 0.13],
  },
  {
    no: "01·A",
    act: 1,
    title: "ACADEMIC QUARTER",
    body: "B.Tech in Computer Science, REVA University, 2021–2025 — honours. First ML models, first deployed apps, first users. The CO₂ prediction project from those years is still public: a model that beat three others on a real dataset, wrapped in an app anyone can run.",
    meta: "REVA CAMPUS · 2021—2025 · PLOT 12°58′N 77°35′E",
    range: [0.13, 0.18],
    links: [
      { label: "CO₂ ML PROJECT", href: "https://github.com/Jawahars07/vehicle-co2-emission-prediction" },
    ],
  },
  {
    no: "01·B",
    act: 1,
    title: "CAREER QUARTER",
    body: "Two working buildings. PocketLite — my first production code: PHP backends and CRM systems. Then PandaECE, where I ran digital strategy for 30+ SME clients and put GenAI into their production workflows: production time down 40%, with a human reviewing everything before it shipped.",
    meta: "PANDAECE · POCKETLITE · 2023—2025 · IN OPERATION",
    range: [0.18, 0.24],
  },
  {
    no: "01·C",
    act: 1,
    title: "CULTURAL QUARTER",
    body: "Four years volunteering at ISKCON Bengaluru. I led a team of 50+ across events hosting 5,000+ people — zero critical incidents in four years. It's where the Vedic thread in my work starts, and where I learned to stay calm when thousands of things can go wrong at once.",
    meta: "ISKCON BENGALURU · 2019—2023 · 5,000+ ATTENDEES",
    range: [0.24, 0.31],
  },
  {
    no: "02",
    act: 2,
    title: "THE CROSSING",
    body: "2025. One flight, 7,800 km. The city falls away, the day passes below. Everything I'd built fit in two suitcases and a GitHub account.",
    meta: "BLR → CDG · 2025 · CRUISE FL350",
    range: [0.31, 0.48],
  },
  {
    no: "03",
    act: 3,
    title: "NEW GROUND — PARIS",
    body: "Golden light, 49°N. ESSEC Business School, Master in Management — apprenticeship track. Paris added the layer engineering doesn't teach: strategy, financial modeling, and how organisations actually adopt what gets built.",
    meta: "ESSEC · 2025— · PLOT 49°02′N 2°04′E",
    range: [0.48, 0.56],
  },
  {
    no: "04",
    act: 3,
    title: "THE FLAGSHIP — ADOPT",
    body: "The tallest tower, lit like a beacon. Adopt turns any work task into a qualified GenAI use case — fit score, ready-to-paste prompt, adoption guide. Built and shipped as sole product owner, made to mirror a real GenAI-adoption apprenticeship description: the tool that role needs, already working.",
    meta: "CITY CENTRE · SHIPPED 2026 · STATUS: LIVE",
    range: [0.56, 0.72],
    links: [
      { label: "OPEN THE LIVE APP", href: "https://adopt-eight.vercel.app" },
      { label: "HOW IT WORKS", href: "https://github.com/Jawahars07/adopt" },
    ],
  },
  {
    no: "05",
    act: 3,
    title: "THE WORKSHOPS",
    body: "Smaller builds, all real. WebForge — an AI agent that generates and deploys websites from a one-line brief, over Telegram. Tara — a voice assistant that listens locally and thinks with Claude. Rta Living — a smart-home platform, in development. And a drafting office where this city itself was drawn, in code.",
    meta: "WORKSHOP LANE · 2025—2026 · MIXED USE",
    range: [0.72, 0.8],
    links: [
      { label: "WEBFORGE", href: "https://github.com/Jawahars07/webforge" },
      { label: "TARA", href: "https://github.com/Jawahars07/tara" },
      { label: "RTA LIVING", href: "https://github.com/Jawahars07/rta-living" },
    ],
  },
  {
    no: "05·B",
    act: 3,
    title: "THE INTEGRATION STREET",
    body: "New city, same method: learn the rules, then build. I work across four languages, and French is the newest — being learned the slow way, in classrooms and cafés. Integration is a build too. It doesn't compile overnight. It's compiling.",
    meta: "PARIS · 2025— · WORK IN PROGRESS, HONESTLY MARKED",
    range: [0.8, 0.88],
  },
  {
    no: "06",
    act: 4,
    title: "THE OPEN PLOT",
    body: "Dusk. One empty lot, one crane. The next building here is yours — a 12–24 month apprenticeship in France, from September 2026. I ship from week one.",
    meta: "CITY EDGE · SEPT 2026 · PERMIT: PENDING YOUR CALL",
    range: [0.88, 1.001],
    links: [
      { label: "EMAIL ME", href: "mailto:jawaharnaidu07@gmail.com" },
      { label: "DOWNLOAD CV", href: "/Jawahar_Naidu_CV.pdf" },
      { label: "GITHUB", href: "https://github.com/Jawahars07" },
      { label: "ADOPT — LIVE", href: "https://adopt-eight.vercel.app" },
    ],
  },
];

export function sheetAt(progress: number): Sheet {
  for (const s of SHEETS) if (progress >= s.range[0] && progress < s.range[1]) return s;
  return SHEETS[SHEETS.length - 1];
}
