import dynamic from "next/dynamic";
import Hud from "@/components/hud/Hud";
import { SHEETS } from "@/lib/sheets";

const Scene = dynamic(() => import("@/components/Scene"));

export default function Page() {
  return (
    <main>
      <Scene />
      <Hud />
      {/* scroll runway: 7 sheets ≈ 8 viewport-heights of travel */}
      <div aria-hidden className="h-[800vh]" />
      {/* real text for crawlers and screen readers */}
      <article className="sr-only">
        <h1>Jawahar Naidu — AI builder, Bengaluru to Paris</h1>
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
      </article>
    </main>
  );
}
