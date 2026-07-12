"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useWorld } from "@/lib/store";
import { buildOf } from "@/lib/path";
import { DAY } from "@/lib/daycycle";
import { compileVaryings, compileFragPars, compileFragMainBody } from "@/lib/compile";

// One building = solid mesh with the shared compile material (blueprint → sun-lit
// facade, cyan construction front, procedural windows, day-cycle lighting) + cyan
// blueprint edges that persist faintly after the build.

export const NIGHT = new THREE.Color("#0A1128");
const CYAN = new THREE.Color("#5FD4F5");
const AMBER = new THREE.Color("#FFB454");

const vert = /* glsl */ `
  uniform float uBuild;
  uniform vec3 uSize;
  ${compileVaryings}
  void main() {
    vLocal = position;
    vNormal2 = normalize(normalMatrix * normal);
    vBuild = uBuild;
    vSize = uSize;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  uniform vec3 uWarm;
  ${compileFragPars}
  void main() {
    ${compileFragMainBody}
  }
`;

export type BuildingProps = {
  position: [number, number, number];
  size: [number, number, number];
  seed?: number;
  range: readonly [number, number];
  delay?: number; // 0..1 stagger inside the district window
  warm?: string;
  windowScale?: number;
  litRatio?: number;
  rotationY?: number;
  alwaysBuilt?: boolean; // flagship: stands complete from the start of its range
};

export function Building({
  position,
  size,
  seed = 1,
  range,
  delay = 0,
  warm = "#E8DCC8",
  windowScale = 1,
  litRatio = 0.45,
  rotationY = 0,
  alwaysBuilt = false,
}: BuildingProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);

  const { geo, edges, uniforms } = useMemo(() => {
    const g = new THREE.BoxGeometry(size[0], size[1], size[2]);
    g.translate(0, size[1] / 2, 0); // base sits on the ground
    const e = new THREE.EdgesGeometry(g, 12);
    const u = {
      uBuild: { value: 0 },
      uSize: { value: new THREE.Vector3(...size) },
      uSeed: { value: seed },
      uWarm: { value: new THREE.Color(warm) },
      uCyan: { value: CYAN.clone() },
      uAmber: { value: AMBER.clone() },
      uWindowScale: { value: windowScale },
      uLitRatio: { value: litRatio },
      // shared day-cycle light state — same value objects across the whole city
      uSunDir: DAY.uSunDir,
      uSunColor: DAY.uSunColor,
      uSkyCol: DAY.uSkyCol,
      uGroundCol: DAY.uGroundCol,
      uFogColor: DAY.uFogColor,
      uFogDensity: DAY.uFogDensity,
      uNight: DAY.uNight,
    };
    return { geo: g, edges: e, uniforms: u };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const p = useWorld.getState().progress;
    // flagship: one fast uniform sweep instead of a binary pop (no colour jump)
    const b = alwaysBuilt
      ? Math.min(Math.max((p - range[0]) / 0.03, 0), 1)
      : buildOf(p, range, delay);
    if (matRef.current) matRef.current.uniforms.uBuild.value = b;
    if (lineMatRef.current) {
      // blueprint state: bright lines; built: faint residue
      lineMatRef.current.opacity = 0.85 - b * 0.72;
    }
  });

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh geometry={geo}>
        <shaderMaterial ref={matRef} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial
          ref={lineMatRef}
          color={CYAN}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}
