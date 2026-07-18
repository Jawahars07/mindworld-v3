"use client";

import { ReactNode, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useWorld } from "@/lib/store";
import { DAY } from "@/lib/daycycle";

// Flight: the Act 2 crossing (scroll 0.31-0.48). A runway at the edge of
// Bengaluru, an airliner that rolls, rotates, climbs through the cloud deck to
// cruise at y~50 heading -z, then flies ahead into the fog. Everything is a
// pure function of scroll progress computed in useFrame - no physics, no state.
// Supersedes the v3 Crossing.tsx paper-plane sheet.
//
// The aircraft mount accepts optional `children` (a hero GLB, integrator-wired);
// when absent the procedural airliner built from primitives renders instead.

const CYAN = new THREE.Color("#5FD4F5");
const AMBER = new THREE.Color("#FFB454");

// --- flight phase boundaries on scroll progress ---
const P_START = 0.31; // brakes off
const P_LIFT = 0.335; // rotation / wheels up
const P_CLIMB_END = 0.42; // reaches cruise altitude
const P_CRUISE_END = 0.46; // begins flying ahead into the distance
const P_GONE = 0.48; // hidden from here to 1

// --- runway geometry ---
const RWY_X = 2;
const RWY_Z0 = -106; // threshold (aircraft start)
const RWY_Z1 = -126; // far end
const RWY_W = 7;
const GROUND_Y = 0.85; // fuselage centreline height while on wheels

const CRUISE_Y = 50;
const CLIMB_END_Z = -168;
const CRUISE_END_Z = -196;
const GONE_Z = -260;

function clamp01(x: number) {
  return Math.min(Math.max(x, 0), 1);
}
function smooth(x: number) {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
}

// Aircraft position as a pure function of progress. Piecewise smoothstep chain:
// roll (ease-in along the runway) -> climb (smooth y ramp, continuing -z) ->
// cruise -> fly-ahead (fog swallows it; no scaling tricks needed).
function flightPos(p: number, out: THREE.Vector3): THREE.Vector3 {
  if (p <= P_START) {
    return out.set(RWY_X, GROUND_Y, RWY_Z0 - 1);
  }
  if (p <= P_LIFT) {
    // ground roll, accelerating: quadratic ease-in along the strip
    const u = (p - P_START) / (P_LIFT - P_START);
    const roll = u * u;
    return out.set(RWY_X, GROUND_Y, RWY_Z0 - 1 + (RWY_Z1 - RWY_Z0 + 2.5) * roll);
  }
  if (p <= P_CLIMB_END) {
    const u = (p - P_LIFT) / (P_CLIMB_END - P_LIFT);
    const z = RWY_Z1 + 1.5 + (CLIMB_END_Z - RWY_Z1 - 1.5) * u;
    // ease-in-out altitude gain: slow rotate, strong mid-climb, level-off
    const y = GROUND_Y + (CRUISE_Y - GROUND_Y) * smooth(u);
    // drift gently off the runway centreline toward the avenue axis
    const x = RWY_X + (0 - RWY_X) * smooth(u);
    return out.set(x, y, z);
  }
  if (p <= P_CRUISE_END) {
    const u = (p - P_CLIMB_END) / (P_CRUISE_END - P_CLIMB_END);
    return out.set(0, CRUISE_Y, CLIMB_END_Z + (CRUISE_END_Z - CLIMB_END_Z) * u);
  }
  // fly ahead and let the exp2 fog erase it
  const u = clamp01((p - P_CRUISE_END) / (P_GONE - P_CRUISE_END));
  const uu = u * u * 0.5 + u * 0.5; // accelerate away
  return out.set(0, CRUISE_Y + u * 2, CRUISE_END_Z + (GONE_Z - CRUISE_END_Z) * uu);
}

// --- procedural airliner (fallback model) ---
const FUSELAGE = "#F2F4F6";
const WING = "#DDE2E8";
const BAND_BLUE = "#1E3F8F";
const BAND_RED = "#C8102E";

function ProceduralAirliner() {
  return (
    <group>
      {/* fuselage: capsule along z, ~9 long */}
      <mesh rotation-x={Math.PI / 2}>
        <capsuleGeometry args={[0.55, 7.9, 6, 12]} />
        <meshStandardMaterial color={FUSELAGE} roughness={0.45} metalness={0.15} />
      </mesh>
      {/* cockpit hint: slightly darker nose cap */}
      <mesh position={[0, 0.12, -4.05]}>
        <sphereGeometry args={[0.42, 10, 8]} />
        <meshStandardMaterial color="#2A3442" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* main wings: single swept slab through the fuselage */}
      <mesh position={[0, -0.18, 0.4]} rotation-y={0}>
        <boxGeometry args={[10.5, 0.12, 1.7]} />
        <meshStandardMaterial color={WING} roughness={0.5} metalness={0.15} />
      </mesh>
      {/* engine nacelles under the wings */}
      <mesh position={[-2.4, -0.55, 0.1]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.34, 0.38, 1.3, 10]} />
        <meshStandardMaterial color="#B8C0CA" roughness={0.4} metalness={0.35} />
      </mesh>
      <mesh position={[2.4, -0.55, 0.1]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.34, 0.38, 1.3, 10]} />
        <meshStandardMaterial color="#B8C0CA" roughness={0.4} metalness={0.35} />
      </mesh>
      {/* tailplane */}
      <mesh position={[0, 0.15, 4.05]}>
        <boxGeometry args={[3.4, 0.09, 0.9]} />
        <meshStandardMaterial color={WING} roughness={0.5} metalness={0.15} />
      </mesh>
      {/* vertical stabilizer with blue-white-red accent band (no text/logos) */}
      <group position={[0, 1.1, 4.15]}>
        <mesh>
          <boxGeometry args={[0.09, 1.9, 1.1]} />
          <meshStandardMaterial color={FUSELAGE} roughness={0.45} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.1, 0.3, 1.12]} />
          <meshStandardMaterial color={BAND_BLUE} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[0.1, 0.24, 1.12]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.38, 0]}>
          <boxGeometry args={[0.1, 0.3, 1.12]} />
          <meshStandardMaterial color={BAND_RED} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

// --- runway ---
function Runway() {
  const lightsMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const { lightsGeo, lightPositions, stripeItems } = useMemo(() => {
    // edge lights: paired rows along both sides, every ~2.2 units
    const positions: [number, number, number][] = [];
    const n = Math.floor(Math.abs(RWY_Z1 - RWY_Z0) / 2.2);
    for (let i = 0; i <= n; i++) {
      const z = RWY_Z0 - (i / n) * (RWY_Z0 - RWY_Z1);
      positions.push([RWY_X - RWY_W / 2 - 0.3, 0.12, z]);
      positions.push([RWY_X + RWY_W / 2 + 0.3, 0.12, z]);
    }
    const lightsGeo = new THREE.SphereGeometry(0.14, 6, 5);
    // threshold stripes ("piano keys") at the start of the strip
    const stripeItems: { x: number; z: number }[] = [];
    for (let i = 0; i < 6; i++) {
      stripeItems.push({ x: RWY_X - RWY_W / 2 + 0.9 + i * ((RWY_W - 1.8) / 5), z: RWY_Z0 - 1.4 });
    }
    return { lightsGeo, lightPositions: positions, stripeItems };
  }, []);

  const instRef = useRef<THREE.InstancedMesh>(null);
  const placed = useRef(false);

  useFrame(() => {
    // amber glow scales with the shared night factor
    if (lightsMatRef.current) {
      lightsMatRef.current.opacity = 0.2 + 0.8 * DAY.uNight.value;
    }
    if (instRef.current && !placed.current) {
      const m = new THREE.Matrix4();
      for (let i = 0; i < lightPositions.length; i++) {
        m.setPosition(lightPositions[i][0], lightPositions[i][1], lightPositions[i][2]);
        instRef.current.setMatrixAt(i, m);
      }
      instRef.current.instanceMatrix.needsUpdate = true;
      placed.current = true;
    }
  });

  return (
    <group>
      {/* dark slab */}
      <mesh position={[RWY_X, 0.04, (RWY_Z0 + RWY_Z1) / 2]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[RWY_W, Math.abs(RWY_Z1 - RWY_Z0) + 4]} />
        <meshStandardMaterial color="#20242B" roughness={0.95} metalness={0} />
      </mesh>
      {/* threshold stripes */}
      {stripeItems.map((s, i) => (
        <mesh key={i} position={[s.x, 0.06, s.z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.45, 2.6]} />
          <meshStandardMaterial color="#C9CDD2" roughness={0.9} />
        </mesh>
      ))}
      {/* centreline dashes */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh
          key={`c${i}`}
          position={[RWY_X, 0.06, RWY_Z0 - 3.5 - i * 2.6]}
          rotation-x={-Math.PI / 2}
        >
          <planeGeometry args={[0.3, 1.4]} />
          <meshStandardMaterial color="#8E939A" roughness={0.9} />
        </mesh>
      ))}
      {/* amber edge lights */}
      <instancedMesh ref={instRef} args={[lightsGeo, undefined, lightPositions.length]} frustumCulled={false}>
        <meshBasicMaterial ref={lightsMatRef} color={AMBER} transparent opacity={1} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

// --- contrail: fixed pool of billboard-ish puffs sampled along the recent path.
// Deterministic from progress (scroll-driven, so it stays under reduced motion;
// the only frozen part is the subtle per-puff jitter).
const TRAIL_N = 32;
const TRAIL_STEP = 0.0018; // progress gap between successive puffs

function Contrail() {
  const instRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 6, 5), []);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const scl = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const inst = instRef.current;
    if (!inst) return;
    const p = useWorld.getState().progress;
    const reduced = useWorld.getState().reduced;
    const night = DAY.uNight.value;
    const airborne = p > P_LIFT + 0.004 && p < P_GONE;
    const show = airborne && night < 0.5;
    inst.visible = show;
    if (!show) return;
    if (matRef.current) matRef.current.opacity = 0.32 * (1 - night * 2) * clamp01((p - P_LIFT) / 0.01);
    const jt = reduced ? 0 : clock.elapsedTime;
    for (let i = 0; i < TRAIL_N; i++) {
      const pp = p - (i + 1) * TRAIL_STEP;
      if (pp <= P_LIFT + 0.002) {
        // not emitted yet: park at zero scale
        scl.setScalar(0.0001);
        m.compose(pos.set(0, -100, 0), q, scl);
        inst.setMatrixAt(i, m);
        continue;
      }
      flightPos(pp, pos);
      pos.y -= 0.35; // trail sits just under the engines
      pos.x += Math.sin(jt * 0.7 + i * 1.7) * 0.06 * (reduced ? 0 : 1);
      const age = (i + 1) / TRAIL_N;
      scl.setScalar(0.22 + age * 0.85); // puffs expand as they age
      m.compose(pos, q, scl);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instRef} args={[geo, undefined, TRAIL_N]} frustumCulled={false}>
      <meshBasicMaterial ref={matRef} color="#FFFFFF" transparent opacity={0.3} depthWrite={false} />
    </instancedMesh>
  );
}

// --- blueprint residue: faint dashed great-circle arc high above the corridor,
// the drafting memory of the BLR -> Paris route (idea carried over from v3
// Crossing.tsx, reduced to a quiet background element).
function BlueprintArc() {
  const line = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(4, 16, -100),
      new THREE.Vector3(0, 46, -150),
      new THREE.Vector3(-4, 14, -200)
    );
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(96));
    const mat = new THREE.LineDashedMaterial({
      color: CYAN,
      dashSize: 1.5,
      gapSize: 1.2,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    const l = new THREE.Line(geo, mat);
    l.computeLineDistances();
    return l;
  }, []);
  return <primitive object={line} />;
}

// --- main component ---
export type FlightProps = {
  /** Optional hero aircraft model; replaces the procedural airliner. */
  children?: ReactNode;
};

export function Flight({ children }: FlightProps) {
  const aircraftRef = useRef<THREE.Group>(null);
  const rootRef = useRef<THREE.Group>(null);
  const posA = useMemo(() => new THREE.Vector3(), []);
  const posB = useMemo(() => new THREE.Vector3(), []);
  const lookM = useMemo(() => new THREE.Matrix4(), []);
  const lookQ = useMemo(() => new THREE.Quaternion(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame(() => {
    const p = useWorld.getState().progress;
    const root = rootRef.current;
    const ac = aircraftRef.current;
    if (root) {
      // the whole flight scene only matters around Act 2; runway shows a bit early
      root.visible = p > 0.2 && p < P_GONE;
    }
    if (!ac) return;

    if (p >= P_GONE) {
      ac.visible = false;
      return;
    }
    ac.visible = true;

    flightPos(p, posA);
    ac.position.copy(posA);

    // orientation from a finite-difference tangent along the same path
    const dp = 0.0015;
    flightPos(Math.min(p + dp, P_GONE), posB);
    // real airliners climb at ~15°, not the path's geometric slope — damp pitch
    posB.y = posA.y + (posB.y - posA.y) * 0.4;
    if (posB.distanceToSquared(posA) > 1e-8) {
      // Matrix4.lookAt(eye, target) sets +Z = eye - target. The aircraft models
      // (procedural and GLB) carry their nose along -Z, so eye must be the
      // CURRENT position and target the point ahead — +Z points backwards,
      // nose flies first. (Reversed args here once had it flying tail-first.)
      lookM.lookAt(posA, posB, up);
      lookQ.setFromRotationMatrix(lookM);
      ac.quaternion.slerp(lookQ, 0.5);
    }

    // gentle bank during the climb, easing off into cruise
    const climbT = clamp01((p - P_LIFT) / (P_CLIMB_END - P_LIFT));
    const bank = Math.sin(climbT * Math.PI) * 0.16;
    ac.rotation.z += bank; // applied after quaternion — small additive roll
  });

  return (
    <group ref={rootRef}>
      <Runway />
      <BlueprintArc />
      <group ref={aircraftRef} position={[RWY_X, GROUND_Y, RWY_Z0 - 1]}>
        {children ?? <ProceduralAirliner />}
      </group>
      <Contrail />
    </group>
  );
}
