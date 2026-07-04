"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Crane } from "./AdoptTower";
import { Sign } from "./Sign";
import { useWorld } from "@/lib/store";

// Sheet 06 — the ending is an invitation drawn in the city's own language:
// an empty lot, a crane already on site, and the ghost of the next building —
// annotated with a drafting dimension line that reads 24 MONTHS.

const CYAN = new THREE.Color("#5FD4F5");
const GATE = 0.86;

function Gated({ children, at = GATE }: { children: React.ReactNode; at?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = useWorld.getState().progress > at;
  });
  return <group ref={ref}>{children}</group>;
}

// Ghost building: edges only, breathing — planned, not yet real.
function GhostBuilding() {
  const mat = useRef<THREE.LineBasicMaterial>(null);
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(10, 14, 8);
    g.translate(0, 7, 0);
    return new THREE.EdgesGeometry(g);
  }, []);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    mat.current.opacity = useWorld.getState().reduced
      ? 0.5
      : 0.35 + Math.sin(clock.elapsedTime * 1.1) * 0.2;
  });
  return (
    <lineSegments geometry={geo} position={[0, 0, -374]}>
      <lineBasicMaterial ref={mat} color={CYAN} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

// Plot boundary: dashed cyan rectangle, like a site plan.
function PlotOutline() {
  const line = useMemo(() => {
    const pts = [
      new THREE.Vector3(-7, 0.05, -369),
      new THREE.Vector3(7, 0.05, -369),
      new THREE.Vector3(7, 0.05, -379),
      new THREE.Vector3(-7, 0.05, -379),
      new THREE.Vector3(-7, 0.05, -369),
    ];
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineDashedMaterial({ color: CYAN, dashSize: 0.9, gapSize: 0.55, transparent: true, opacity: 0.9 });
    const l = new THREE.Line(g, m);
    l.computeLineDistances();
    return l;
  }, []);
  return <primitive object={line} />;
}

// Drafting dimension line along the plot's front edge: |◄── 24 MONTHS ──►|
function DimensionLine() {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const y = 0.05;
    const z = -366.5;
    // extension ticks
    pts.push(-7, y, -369, -7, y, z - 0.6);
    pts.push(7, y, -369, 7, y, z - 0.6);
    // main line
    pts.push(-7, y, z, 7, y, z);
    // arrowheads
    pts.push(-7, y, z, -6.2, y, z - 0.35);
    pts.push(-7, y, z, -6.2, y, z + 0.35);
    pts.push(7, y, z, 6.2, y, z - 0.35);
    pts.push(7, y, z, 6.2, y, z + 0.35);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color={CYAN} transparent opacity={0.8} />
    </lineSegments>
  );
}

export function OpenPlot() {
  return (
    <Gated>
      <PlotOutline />
      <GhostBuilding />
      <DimensionLine />
      <Crane position={[11, 0, -371]} rotationY={2.4} height={19} jib={13} />
      <Sign text="YOUR TEAM'S NEXT TOOL" position={[0, 12, -377.5]} width={8} color="#5FD4F5" visibleAfter={GATE} />
      <Sign text="12–24 MONTHS" position={[0, 0.9, -365.6]} width={5} color="#5FD4F5" visibleAfter={GATE} />
    </Gated>
  );
}
