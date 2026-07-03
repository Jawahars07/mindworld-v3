// The script: 7 blueprint "sheets". `range` is scroll progress [start, end).
// HUD shows a sheet's title block while progress is inside its range.

export type Sheet = {
  no: string;
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
    title: "SKYLINE",
    sub: "Jawahar Naidu",
    body: "I build AI tools people actually use. This city is my work — every district a real, working thing. Scroll to compile it.",
    meta: "NIGHT ELEVATION · 2021—2026 · SCALE 1:CAREER",
    range: [0.0, 0.1],
  },
  {
    no: "01",
    title: "FOUNDATIONS",
    body: "Bengaluru. B.Tech in Computer Science, REVA University, 2021–2025. Where I learned that code only counts when it runs — first ML models, first deployed apps, first users.",
    meta: "BENGALURU QUARTER · 2021—2025 · PLOT 12°58′N 77°35′E",
    range: [0.1, 0.26],
    links: [
      { label: "CO₂ ML PROJECT", href: "https://github.com/Jawahars07/vehicle-co2-emission-prediction" },
    ],
  },
  {
    no: "02",
    title: "THE CROSSING",
    body: "2025. One flight, 7,800 km. The build moves to Europe.",
    meta: "BLR → CDG · 2025 · CRUISE FL350",
    range: [0.26, 0.38],
  },
  {
    no: "03",
    title: "NEW GROUND",
    body: "Paris. ESSEC Business School, Master in Management — apprenticeship track. Adding the business layer to the builder: strategy, financial modeling, how organisations actually adopt technology.",
    meta: "PARIS QUARTER · 2025— · PLOT 49°02′N 2°04′E",
    range: [0.38, 0.52],
  },
  {
    no: "04",
    title: "THE FLAGSHIP — ADOPT",
    body: "The one tower already built. Adopt turns any work task into a qualified GenAI / Copilot use case — fit score, ready-to-paste prompt, adoption guide. Built to mirror a real Digital Workplace & GenAI Adoption apprentice job description: the tool that role needs, already working. Next.js 16 · React 19 · Claude.",
    meta: "CITY CENTRE · SHIPPED 2026 · STATUS: LIVE",
    range: [0.52, 0.72],
    links: [
      { label: "OPEN THE LIVE APP", href: "https://adopt-eight.vercel.app" },
      { label: "READ THE CODE", href: "https://github.com/Jawahars07/adopt" },
    ],
  },
  {
    no: "05",
    title: "THE WORKSHOPS",
    body: "Smaller builds, all real. WebForge — an AI agent that generates and deploys websites from a one-line brief, over Telegram. Tara — a voice assistant with local Whisper ears and a Claude brain. Rta Living — a smart-home platform, in development. And a drafting office where this city itself was drawn, in code, with zero image assets.",
    meta: "WORKSHOP LANE · 2025—2026 · MIXED USE",
    range: [0.72, 0.88],
    links: [
      { label: "WEBFORGE", href: "https://github.com/Jawahars07/webforge" },
      { label: "TARA", href: "https://github.com/Jawahars07/tara" },
      { label: "RTA LIVING", href: "https://github.com/Jawahars07/rta-living" },
    ],
  },
  {
    no: "06",
    title: "THE OPEN PLOT",
    body: "One empty lot, one crane, one fresh blueprint: your team's next tool. I'm looking for a GenAI / digital-workplace apprenticeship in France — two years, ESSEC rhythm, shipping from week one.",
    meta: "CITY EDGE · 2026— · PERMIT: PENDING YOUR CALL",
    range: [0.88, 1.001],
    links: [
      { label: "EMAIL ME", href: "mailto:jawaharnaidu07@gmail.com" },
      { label: "GITHUB", href: "https://github.com/Jawahars07" },
    ],
  },
];

export function sheetAt(progress: number): Sheet {
  for (const s of SHEETS) if (progress >= s.range[0] && progress < s.range[1]) return s;
  return SHEETS[SHEETS.length - 1];
}
