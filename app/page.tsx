import dynamic from "next/dynamic";
import Hud from "@/components/hud/Hud";
import Boot from "@/components/os/Boot";
import TopBar from "@/components/os/TopBar";
import Dock from "@/components/os/Dock";
import CommandPalette from "@/components/os/CommandPalette";
import RecruiterMode from "@/components/os/RecruiterMode";
import GalaxyGate from "@/components/galaxy/GalaxyGate";
import Room from "@/components/project/Room";
import Terminal from "@/components/os/Terminal";
import SmoothScroll from "@/components/os/SmoothScroll";
import { SHEETS } from "@/lib/sheets";
import { ROOMS } from "@/lib/rooms";
import { REGISTRY } from "@/lib/registry";

const Scene = dynamic(() => import("@/components/Scene"));

export default function Page() {
  return (
    <main>
      <Scene />
      <Hud />
      <TopBar />
      <Dock />
      <CommandPalette />
      <RecruiterMode />
      <GalaxyGate />
      <Room />
      <Terminal />
      <SmoothScroll />
      <Boot />
      {/* scroll runway: 11 sheets / 5 acts ≈ 13 viewport-heights of travel */}
      <div aria-hidden className="h-[1300vh]" />
      {/* real text for crawlers and screen readers — full content parity */}
      <article className="sr-only">
        <h1>Jawahar Naidu — MINDWORLD OS: a personal operating system, Bengaluru to Paris</h1>
        <p>
          This site is built as an operating system: it boots on real system data, then travels one
          continuous camera route through a 3D city of real work. A 90-second recruiter tour, a
          skill galaxy rendered from the live local Claude Code skill registry ({REGISTRY.total}{" "}
          skills installed, {REGISTRY.authored} authored), project rooms with honest metrics, and a
          hidden terminal. Keyboard: Cmd+K opens the command palette; the backtick key opens the
          terminal.
        </p>
        {SHEETS.map((s) => (
          <section key={s.no}>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
            {s.links?.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </section>
        ))}
        <section>
          <h2>Project rooms</h2>
          {ROOMS.map((r) => (
            <div key={r.slug}>
              <h3>
                {r.name}
                {r.flagship ? " — flagship" : ""}
              </h3>
              <p>{r.tagline}</p>
              <p>{r.role}</p>
              <p>Stack: {r.stack.join(", ")}</p>
              <p>{r.metric}</p>
              <p>{r.body}</p>
              {r.links.map((l) => (
                <a key={l.href} href={l.href}>
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </section>
      </article>
    </main>
  );
}
