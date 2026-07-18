"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { useWorld } from "@/lib/store";

// Lazy gate: the Constellation (and its registry payload) only loads the first
// time someone actually opens the galaxy — it never weighs down the film.
const Constellation = dynamic(() => import("./Constellation"), { ssr: false });

export default function GalaxyGate() {
  const open = useWorld((s) => s.galaxyOpen);
  return <AnimatePresence>{open && <Constellation />}</AnimatePresence>;
}
