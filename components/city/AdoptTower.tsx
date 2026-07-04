"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Building } from "./Building";
import { Sign } from "./Sign";
import { BUILD_RANGES } from "@/lib/path";
import { useWorld } from "@/lib/store";
import { cssFamily, makeCanvasTexture } from "@/lib/canvasTexture";

// The flagship. Three setback tiers, a beacon spire, and a facade panel that
// shows the actual product flow: task in → fit score → prompt → adoption guide.
// It stands complete while the district around it is still compiling — that
// contrast IS the message.

const CYAN = "#5FD4F5";
const AMBER = "#FFB454";

function drawFacadeUI(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#0B1530";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(95,212,245,0.9)";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  const monoFam = cssFamily("--font-plot", '"IBM Plex Mono"');
  const grotFam = cssFamily("--font-display", "Archivo");
  const mono = (px: number) => `${px}px ${monoFam}, monospace`;
  const grot = (px: number, weight = 700) => `${weight} ${px}px ${grotFam}, sans-serif`;

  // header
  ctx.fillStyle = CYAN;
  ctx.font = mono(26);
  ctx.fillText("ADOPT — GENAI ADOPTION COMPANION", 42, 74);
  ctx.strokeStyle = "rgba(95,212,245,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(42, 96);
  ctx.lineTo(w - 42, 96);
  ctx.stroke();

  // task input
  ctx.fillStyle = "rgba(232,220,200,0.55)";
  ctx.font = mono(24);
  ctx.fillText("task:", 42, 152);
  ctx.fillStyle = "#E8DCC8";
  ctx.font = grot(30, 500);
  ctx.fillText("“summarize weekly client reports”", 42, 196);

  // fit score arc
  const cx = 130,
    cy = 330,
    r = 74;
  ctx.strokeStyle = "rgba(95,212,245,0.25)";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.strokeStyle = AMBER;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * 0.87);
  ctx.stroke();
  ctx.fillStyle = "#E8DCC8";
  ctx.font = grot(56);
  ctx.fillText("87", cx - 32, cy + 20);
  ctx.fillStyle = AMBER;
  ctx.font = mono(22);
  ctx.fillText("FIT SCORE — COPILOT-READY", 240, 316);
  ctx.fillStyle = "rgba(232,220,200,0.6)";
  ctx.fillText("high repetition · text-heavy · low risk", 240, 356);

  // prompt block
  ctx.fillStyle = "rgba(95,212,245,0.08)";
  ctx.fillRect(42, 430, w - 84, 180);
  ctx.strokeStyle = "rgba(95,212,245,0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 430, w - 84, 180);
  ctx.fillStyle = CYAN;
  ctx.font = mono(20);
  ctx.fillText("READY-TO-PASTE PROMPT", 60, 464);
  ctx.fillStyle = "rgba(232,220,200,0.5)";
  for (let i = 0; i < 4; i++) {
    const lw = [0.86, 0.92, 0.7, 0.48][i];
    ctx.fillRect(60, 488 + i * 30, (w - 120) * lw, 12);
  }

  // adoption guide rows
  ctx.fillStyle = CYAN;
  ctx.font = mono(20);
  ctx.fillText("ADOPTION GUIDE", 42, 668);
  const rows = ["pilot with one team", "measure time saved", "roll out + train"];
  rows.forEach((t, i) => {
    const y = 704 + i * 44;
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 3;
    ctx.strokeRect(46, y - 20, 22, 22);
    ctx.beginPath();
    ctx.moveTo(50, y - 9);
    ctx.lineTo(56, y - 3);
    ctx.lineTo(66, y - 16);
    ctx.stroke();
    ctx.fillStyle = "#E8DCC8";
    ctx.font = grot(26, 500);
    ctx.fillText(t, 84, y);
  });
}

function FacadePanel() {
  const tex = useMemo(() => makeCanvasTexture(768, 960, drawFacadeUI), []);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  // portrait phones: the screen must stay readable, so it outgrows the facade
  const { size } = useThree();
  const panelScale = size.width / size.height < 0.75 ? 1.38 : 1;
  useFrame(({ clock }) => {
    if (!mat.current) return;
    // faint screen breathing so it reads as a live display, not a poster
    if (useWorld.getState().reduced) {
      mat.current.color.setScalar(0.95);
      return;
    }
    mat.current.color.setScalar(0.92 + Math.sin(clock.elapsedTime * 1.7) * 0.06);
  });
  return (
    <mesh position={[0, 21.5, -263.9]} scale={panelScale}>
      <planeGeometry args={[8.4, 10.5]} />
      <meshBasicMaterial ref={mat} map={tex} toneMapped={false} />
    </mesh>
  );
}

export function Crane({
  position,
  rotationY = 0,
  height = 22,
  jib = 14,
}: {
  position: [number, number, number];
  rotationY?: number;
  height?: number;
  jib?: number;
}) {
  // blueprint-state crane: cyan lines only — the construction that's wrapping up
  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(CYAN),
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const geo = useMemo(() => {
    const pts: number[] = [];
    const add = (a: [number, number, number], b: [number, number, number]) =>
      pts.push(...a, ...b);
    // mast with cross-bracing
    for (let y = 0; y < height; y += 2.2) {
      add([-0.6, y, -0.6], [0.6, y, -0.6]);
      add([0.6, y, -0.6], [0.6, y, 0.6]);
      add([0.6, y, 0.6], [-0.6, y, 0.6]);
      add([-0.6, y, 0.6], [-0.6, y, -0.6]);
      add([-0.6, y, -0.6], [0.6, y + 2.2, -0.6]);
      add([0.6, y, 0.6], [-0.6, y + 2.2, 0.6]);
    }
    add([-0.6, 0, -0.6], [-0.6, height, -0.6]);
    add([0.6, 0, -0.6], [0.6, height, -0.6]);
    add([0.6, 0, 0.6], [0.6, height, 0.6]);
    add([-0.6, 0, 0.6], [-0.6, height, 0.6]);
    // jib + counter-jib + tie lines
    add([0, height, 0], [jib, height - 0.6, 0]);
    add([0, height, 0], [-jib * 0.4, height - 0.6, 0]);
    add([0, height + 2.4, 0], [jib * 0.55, height - 0.55, 0]);
    add([0, height + 2.4, 0], [-jib * 0.4, height - 0.6, 0]);
    add([0, height, 0], [0, height + 2.4, 0]);
    // hook cable
    add([jib * 0.8, height - 0.6, 0], [jib * 0.8, height * 0.45, 0]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <group position={position} rotation-y={rotationY}>
      <lineSegments geometry={geo} material={mat} />
    </group>
  );
}

function Beacon() {
  const ref = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.opacity = useWorld.getState().reduced
      ? 0.85
      : 0.55 + Math.abs(Math.sin(clock.elapsedTime * 1.4)) * 0.45;
  });
  return (
    <group position={[0, 48.5, -270]}>
      <mesh>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshBasicMaterial ref={ref} color="#FF6B5E" transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

function FlagshipExtras({ children }: { children: React.ReactNode }) {
  // signage/beacon/plaza only exist once the flagship's chapter is near —
  // from afar the tower must read as blueprint like everything else
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = useWorld.getState().progress > 0.5;
  });
  return <group ref={ref}>{children}</group>;
}

export function AdoptTower() {
  const R = BUILD_RANGES.adopt;
  return (
    <group>
      {/* three setback tiers — all stand complete the moment the district range opens */}
      <Building position={[0, 0, -270]} size={[17, 15, 15]} seed={7.1} range={R} warm="#F0E6D2" litRatio={0.8} windowScale={1.1} alwaysBuilt />
      <group position={[0, 15, 0]}>
        <Building position={[0, 0, -270]} size={[13, 15, 12]} seed={7.2} range={R} warm="#F0E6D2" litRatio={0.85} windowScale={1.05} alwaysBuilt />
      </group>
      <group position={[0, 30, 0]}>
        <Building position={[0, 0, -270]} size={[9, 12, 9]} seed={7.3} range={R} warm="#F0E6D2" litRatio={0.9} alwaysBuilt />
      </group>
      <FlagshipExtras>
        {/* spire + beacon */}
        <mesh position={[0, 45, -270]}>
          <boxGeometry args={[0.5, 6.5, 0.5]} />
          <meshBasicMaterial color="#c9bda6" />
        </mesh>
        <Beacon />
        <FacadePanel />
        <Sign text="ADOPT" position={[0, 46.8, -269]} width={8} color="#FFB454" visibleAfter={0.5} />
        {/* plaza apron: a lit ring the avenue feeds into */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, -270]}>
          <ringGeometry args={[11.5, 12.1, 64]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.35} toneMapped={false} />
        </mesh>
        {/* the cranes that built it, pulling back */}
        <Crane position={[14, 0, -258]} rotationY={-0.7} />
        <Crane position={[-15, 0, -280]} rotationY={2.2} height={18} jib={11} />
      </FlagshipExtras>
    </group>
  );
}
