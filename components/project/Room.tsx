"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useWorld } from "@/lib/store";
import { roomBySlug } from "@/lib/rooms";
import { trackClick } from "@/lib/analytics";
import photoManifest from "@/lib/photos.json";

// A project room: full-bleed panel that opens off a building on the route.
// Left = drafting-sheet facts (role, stack, one honest metric, live links).
// Right = a pinned reference print; photos not yet in public/photos (per the
// build-time manifest) render a labelled placeholder — no 404s, ever.

function PinnedPrint({ src, alt }: { src: string; alt: string }) {
  const missing = !(photoManifest as string[]).includes(src);
  return (
    <div className="relative rotate-[1.2deg] border border-blueprint/25 bg-[#0E1734] p-2 pb-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
      {/* pin */}
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent shadow-[0_0_10px_rgba(255,106,61,0.8)]" />
      {missing ? (
        <div className="aspect-video w-full flex flex-col items-center justify-center border border-dashed border-blueprint/30 bg-night/60">
          <p className="font-plot text-[10px] tracking-[0.25em] text-blueprint/60">REFERENCE PRINT — SLOT</p>
          <p className="font-plot text-[9px] tracking-[0.15em] text-inkline/40 mt-1.5">photo pending · placeholder, honestly marked</p>
        </div>
      ) : (
        <Image src={src} alt={alt} width={960} height={540} unoptimized className="w-full h-auto" />
      )}
      <p className="absolute bottom-2 left-3 font-plot text-[9px] tracking-[0.2em] text-inkline/60">{alt.toUpperCase()}</p>
    </div>
  );
}

export default function Room() {
  const slug = useWorld((s) => s.roomOpen);
  const setRoomOpen = useWorld((s) => s.setRoomOpen);
  const room = roomBySlug(slug);

  useEffect(() => {
    if (!slug) return;
    trackClick("room:open", slug);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRoomOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slug, setRoomOpen]);

  return (
    <AnimatePresence>
      {room && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-label={`${room.name} — project room`}
          className="fixed inset-0 z-[75] bg-night/80 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
          onClick={() => setRoomOpen(null)}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-[min(96vw,64rem)] max-h-[88vh] overflow-y-auto border border-blueprint/30 bg-[#0B1330]/97"
            onClick={(e) => e.stopPropagation()}
          >
            {room.flagship && (
              <div className="absolute top-0 left-0 font-plot text-[9px] tracking-[0.3em] bg-accent text-night px-3 py-1">
                FLAGSHIP
              </div>
            )}
            <button
              onClick={() => setRoomOpen(null)}
              aria-label="Close project room"
              className="absolute top-3 right-3 font-plot text-[10px] tracking-[0.2em] border border-blueprint/40 text-blueprint px-3 py-1.5 hover:bg-blueprint hover:text-night transition-colors z-10"
            >
              ✕ ESC
            </button>

            <div className="grid md:grid-cols-2 gap-6 md:gap-10 p-6 md:p-10 pt-12 md:pt-12">
              {/* the drafting sheet */}
              <div>
                <p className="font-plot text-[10px] tracking-[0.3em] text-blueprint/70">PROJECT ROOM</p>
                <h2 className="text-limestone text-3xl md:text-4xl font-bold tracking-tight mt-2">{room.name}</h2>
                <p className="text-inkline text-sm md:text-base leading-relaxed mt-2">{room.tagline}</p>

                <div className="rule mt-5 pt-4">
                  <p className="font-plot text-[9px] tracking-[0.25em] text-blueprint/60">ROLE</p>
                  <p className="text-limestone/90 text-sm mt-1">{room.role}</p>
                </div>

                <div className="mt-4">
                  <p className="font-plot text-[9px] tracking-[0.25em] text-blueprint/60">STACK</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {room.stack.map((t) => (
                      <span key={t} className="font-plot text-[10px] tracking-[0.1em] border border-blueprint/30 text-blueprint/90 px-2 py-1">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="font-plot text-[9px] tracking-[0.25em] text-blueprint/60">ONE HONEST LINE</p>
                  <p className="font-plot text-[11px] text-accent mt-1.5 leading-relaxed">{room.metric}</p>
                </div>

                <p className="text-inkline text-[13px] md:text-sm leading-relaxed mt-5">{room.body}</p>

                <div className="flex flex-wrap gap-2 mt-6">
                  {room.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackClick(`room:${room.slug}:link`, l.href)}
                      className={`font-plot text-[10px] tracking-[0.2em] px-3 py-2 transition-colors ${
                        room.flagship
                          ? "bg-accent text-night hover:bg-limestone"
                          : "border border-blueprint/50 text-blueprint hover:bg-blueprint hover:text-night"
                      }`}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* the pinned print */}
              <div className="self-center">
                <PinnedPrint src={room.photo} alt={`${room.name} — reference print`} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
