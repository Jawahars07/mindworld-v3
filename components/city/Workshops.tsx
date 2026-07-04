"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Building } from "./Building";
import { Sign } from "./Sign";
import { BUILD_RANGES } from "@/lib/path";
import { useWorld } from "@/lib/store";

// Sheet 05 — the lane of smaller real builds. Each shed gets one telling detail
// instead of a plaque of adjectives.

const R = BUILD_RANGES.workshops;
const GATE = 0.7; // extras appear once the lane is mostly compiled

function Gated({ children, at = GATE }: { children: React.ReactNode; at?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = useWorld.getState().progress > at;
  });
  return <group ref={ref}>{children}</group>;
}

// Tara: the notch orb, hovering and breathing above the roof.
function TaraOrb({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (useWorld.getState().reduced) {
      ref.current.position.y = position[1];
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.85;
      return;
    }
    const t = clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 1.3) * 0.3;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.75 + Math.sin(t * 2.1) * 0.2;
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.55, 16, 16]} />
      <meshBasicMaterial color="#FFB454" transparent toneMapped={false} />
    </mesh>
  );
}

// Rta Living: windows that breathe in sequence — the house running its own automations.
function SmartWindows({ position }: { position: [number, number, number] }) {
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  useFrame(({ clock }) => {
    const reduced = useWorld.getState().reduced;
    mats.current.forEach((m, i) => {
      if (m)
        m.opacity = reduced
          ? 0.7
          : 0.35 + 0.6 * Math.max(0, Math.sin(clock.elapsedTime * 0.9 + i * 1.9));
    });
  });
  return (
    <group position={position}>
      {[-1.1, 0.1, 1.3].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <planeGeometry args={[0.7, 0.9]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) mats.current[i] = m;
            }}
            color="#FFB454"
            transparent
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// The drafting office roof carries a miniature wireframe city — this site, drawing itself.
function MiniCity({ position }: { position: [number, number, number] }) {
  const geo = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];
    let s = 5;
    const r = () => ((s = (s * 16807) % 2147483647), s / 2147483647);
    const pts: number[] = [];
    for (let i = 0; i < 14; i++) {
      const w = 0.25 + r() * 0.3;
      const h = 0.3 + r() * 0.9;
      const x = (r() - 0.5) * 3.4;
      const z = (r() - 0.5) * 2.2;
      // 4 vertical edges + top square per mini building (cheap hand-rolled edges)
      const c = [
        [x - w, 0, z - w], [x + w, 0, z - w], [x + w, 0, z + w], [x - w, 0, z + w],
      ] as const;
      c.forEach(([cx, , cz], k) => {
        pts.push(cx, 0, cz, cx, h, cz);
        const [nx, , nz] = c[(k + 1) % 4];
        pts.push(cx, h, cz, nx, h, nz);
      });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    boxes.forEach((b) => b.dispose());
    return g;
  }, []);
  return (
    <group position={position}>
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[4.2, 0.12, 3]} />
        <meshBasicMaterial color="#12203E" />
      </mesh>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color="#5FD4F5" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

export function Workshops() {
  return (
    <group>
      {/* WebForge — the site generator, antenna up, always transmitting */}
      <Building position={[-20, 0, -302]} size={[6, 4.5, 5]} seed={21} range={R} delay={0.1} warm="#DCCDB2" litRatio={0.7} />
      <Sign text="WEBFORGE" position={[-20, 5.6, -299.4]} width={5} color="#5FD4F5" visibleAfter={GATE} />
      <Gated>
        <mesh position={[-18.4, 5.6, -303.2]}>
          <cylinderGeometry args={[0.05, 0.05, 2.2, 6]} />
          <meshBasicMaterial color="#9FB4C8" />
        </mesh>
        <mesh position={[-18.4, 6.9, -303.2]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#5FD4F5" toneMapped={false} />
        </mesh>
      </Gated>

      {/* Tara — voice assistant, the orb above the house */}
      <Building position={[-2, 0, -312]} size={[5, 3.8, 5]} seed={22} range={R} delay={0.3} warm="#E3C9A0" litRatio={0.6} />
      <Sign text="TARA" position={[-2, 4.8, -309.4]} width={3} color="#FFB454" visibleAfter={GATE} />
      <Gated>
        <TaraOrb position={[-2, 5.9, -312]} />
      </Gated>

      {/* Rta Living — the smart house, still in development (kept deliberately small) */}
      <Building position={[-22, 0, -326]} size={[6, 3.2, 6]} seed={23} range={R} delay={0.5} warm="#E8DCC8" litRatio={0.2} />
      <Sign text="RTA LIVING · IN DEV" position={[-22, 4.2, -322.9]} width={6.5} visibleAfter={GATE} />
      <Gated>
        <SmartWindows position={[-22, 1.6, -322.94]} />
      </Gated>

      {/* The drafting office — where this city draws itself */}
      <Building position={[-5, 0, -330]} size={[5.5, 3, 4.5]} seed={24} range={R} delay={0.7} warm="#D4C8B0" litRatio={0.75} />
      <Sign text="DRAFTING OFFICE" position={[-5, 3.9, -327.6]} width={5.5} color="#5FD4F5" visibleAfter={GATE} />
      <Gated at={0.74}>
        <MiniCity position={[-5, 3.1, -330]} />
      </Gated>
    </group>
  );
}
