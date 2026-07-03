"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useWorld } from "@/lib/store";
import { cssFamily, makeCanvasTexture } from "@/lib/canvasTexture";

// Sheet 02. The move to Paris drawn in drafting language: the sky holds
// "revision clouds" (the scalloped symbol for a changed area on a drawing),
// and a dashed flight arc BLR → CDG with a paper-plane marker that rides the
// arc as you scroll. One life revision, properly annotated.

const CYAN = new THREE.Color("#5FD4F5");
const RANGE: [number, number] = [0.24, 0.4]; // slightly wider than the sheet for lead-in/out

function revisionCloudGeometry(rx: number, rz: number, scallops: number, seed: number) {
  // closed loop of outward-bulging arcs in the XZ plane
  const pts: THREE.Vector3[] = [];
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (s * 16807) % 2147483647), s / 2147483647);
  const jitter = Array.from({ length: scallops }, () => 0.85 + rnd() * 0.3);
  for (let i = 0; i < scallops; i++) {
    const a0 = (i / scallops) * Math.PI * 2;
    const a1 = ((i + 1) / scallops) * Math.PI * 2;
    const p0 = new THREE.Vector2(Math.cos(a0) * rx * jitter[i], Math.sin(a0) * rz * jitter[i]);
    const p1 = new THREE.Vector2(
      Math.cos(a1) * rx * jitter[(i + 1) % scallops],
      Math.sin(a1) * rz * jitter[(i + 1) % scallops]
    );
    const mid = p0.clone().add(p1).multiplyScalar(0.5);
    const out = mid.clone().normalize().multiplyScalar(p0.distanceTo(p1) * 0.42);
    const ctrl = mid.add(out);
    const curve = new THREE.QuadraticBezierCurve(p0, ctrl, p1);
    for (let k = 0; k <= 8; k++) {
      const p = curve.getPoint(k / 8);
      pts.push(new THREE.Vector3(p.x, 0, p.y));
    }
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

function RevisionCloud({
  position,
  rx,
  rz,
  seed,
  drift = 1,
}: {
  position: [number, number, number];
  rx: number;
  rz: number;
  seed: number;
  drift?: number;
}) {
  const geo = useMemo(() => revisionCloudGeometry(rx, rz, 14, seed), [rx, rz, seed]);
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current)
      group.current.position.x = position[0] + Math.sin(clock.elapsedTime * 0.1 * drift + seed) * 3;
  });
  return (
    <group ref={group} position={position}>
      <lineLoop geometry={geo}>
        <lineBasicMaterial color={CYAN} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineLoop>
      {/* soft body under the outline so it occludes like a cloud, not a wire */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.6, 0]}>
        <circleGeometry args={[Math.min(rx, rz) * 0.92, 24]} />
        <meshBasicMaterial color="#16244A" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}

function endpointLabel(text: string) {
  return makeCanvasTexture(256, 96, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(95,212,245,0.9)";
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = "#5FD4F5";
    ctx.font = `600 52px ${cssFamily("--font-plot", '"IBM Plex Mono"')}, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + 2);
  });
}

export function Crossing() {
  const arc = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(4, 16, -72),
        new THREE.Vector3(0, 78, -136),
        new THREE.Vector3(-4, 14, -198)
      ),
    []
  );

  const dashGeo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(arc.getPoints(120));
    return g;
  }, [arc]);

  const plane = useRef<THREE.Group>(null);
  const trail = useRef<THREE.Line>(null);

  const labels = useMemo(() => ({ blr: endpointLabel("BLR"), cdg: endpointLabel("CDG") }), []);

  useFrame(() => {
    const p = useWorld.getState().progress;
    const t = Math.min(Math.max((p - RANGE[0]) / (RANGE[1] - RANGE[0]), 0.001), 0.999);
    if (plane.current) {
      const pos = arc.getPoint(t);
      const tan = arc.getTangent(t);
      plane.current.position.copy(pos);
      plane.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), tan.normalize());
    }
    // reveal the dashed arc progressively behind the plane
    if (trail.current) {
      const total = 120;
      const upto = Math.max(2, Math.floor(total * t));
      trail.current.geometry.setDrawRange(0, upto);
    }
  });

  return (
    <group>
      {/* dashed flight path */}
      <primitive
        object={useMemo(() => {
          const mat = new THREE.LineDashedMaterial({
            color: CYAN,
            dashSize: 1.6,
            gapSize: 1.1,
            transparent: true,
            opacity: 0.85,
          });
          const line = new THREE.Line(dashGeo, mat);
          line.computeLineDistances();
          return line;
        }, [dashGeo])}
        ref={trail}
      />

      {/* paper plane marker: two folded triangles */}
      <group ref={plane}>
        <mesh rotation-x={-Math.PI / 2}>
          <coneGeometry args={[0.7, 2.6, 3]} />
          <meshBasicMaterial color="#E8DCC8" />
        </mesh>
        <pointLight color="#5FD4F5" intensity={6} distance={14} />
      </group>

      {/* endpoint markers */}
      <group position={[4, 17.5, -72]}>
        <mesh>
          <planeGeometry args={[5, 1.9]} />
          <meshBasicMaterial map={labels.blr} transparent toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group position={[-4, 15.5, -198]}>
        <mesh>
          <planeGeometry args={[5, 1.9]} />
          <meshBasicMaterial map={labels.cdg} transparent toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* revision clouds at cruise altitude */}
      <RevisionCloud position={[-34, 46, -128]} rx={16} rz={9} seed={11} />
      <RevisionCloud position={[30, 42, -148]} rx={13} rz={8} seed={23} drift={1.6} />
      <RevisionCloud position={[8, 50, -112]} rx={10} rz={6} seed={37} drift={0.7} />
      <RevisionCloud position={[-14, 44, -166]} rx={12} rz={7} seed={51} drift={1.2} />
      <RevisionCloud position={[44, 52, -120]} rx={9} rz={5.5} seed={67} drift={0.9} />
    </group>
  );
}
