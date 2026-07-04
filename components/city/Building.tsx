"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useWorld } from "@/lib/store";
import { buildOf } from "@/lib/path";

// One building = solid mesh with a construction-sweep shader (facade fills bottom-up,
// cyan glow at the construction front, procedural lit windows) + cyan blueprint edges
// that persist faintly after the build.

export const NIGHT = new THREE.Color("#0A1128");
const CYAN = new THREE.Color("#5FD4F5");
const AMBER = new THREE.Color("#FFB454");

const vert = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormal2;
  varying float vViewDist;
  void main() {
    vLocal = position;
    vNormal2 = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  uniform float uBuild;
  uniform vec3 uSize;
  uniform float uSeed;
  uniform vec3 uWarm;
  uniform vec3 uCyan;
  uniform vec3 uAmber;
  uniform vec3 uNight;
  uniform float uWindowScale;
  uniform float uLitRatio;
  uniform float uEmissive;
  varying vec3 vLocal;
  varying vec3 vNormal2;
  varying float vViewDist;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed * 17.31) * 43758.5453);
  }

  void main() {
    float front = uBuild * uSize.y;
    if (vLocal.y > front + 0.001) discard;

    // simple two-light night facade
    vec3 n = normalize(vNormal2);
    float diff = max(dot(n, normalize(vec3(0.4, 0.8, 0.45))), 0.0);
    float rim = max(dot(n, normalize(vec3(-0.5, 0.2, -0.6))), 0.0);
    float vgrad = 0.55 + 0.45 * (vLocal.y / max(uSize.y, 0.001));
    vec3 col = uWarm * (0.24 + 0.34 * diff + 0.14 * rim) * vgrad;

    // procedural windows on vertical faces
    float vertFace = step(abs(n.y), 0.5);
    vec2 uv = mix(vec2(vLocal.x, vLocal.y), vec2(vLocal.z, vLocal.y), step(0.5, abs(n.x)));
    vec2 cellSize = vec2(1.5, 2.1) * uWindowScale;
    vec2 cell = floor(uv / cellSize);
    vec2 f = fract(uv / cellSize);
    float inWin = step(0.22, f.x) * step(f.x, 0.78) * step(0.28, f.y) * step(f.y, 0.8);
    // keep a margin from building edges so windows don't bleed off corners
    float margin = step(1.0, vLocal.y) * step(vLocal.y, uSize.y - 0.8);
    float lit = step(1.0 - uLitRatio, hash(cell + floor(n.xz * 3.0)));
    float win = inWin * vertFace * margin;
    vec3 glass = mix(uNight * 1.6, uAmber * (1.1 + 0.7 * hash(cell + 4.2)), lit * uEmissive);
    col = mix(col, glass, win);

    // cyan construction front: bright band where the building is being extruded
    float building = step(0.001, uBuild) * (1.0 - step(0.999, uBuild));
    float band = smoothstep(1.4, 0.0, front - vLocal.y) * building;
    col += uCyan * band * 1.6;
    // freshly-built cyan tint fading to warm
    col = mix(col, col + uCyan * 0.12, 1.0 - uBuild);

    // manual exp2 fog into the night
    float fog = 1.0 - exp(-pow(vViewDist * 0.0053, 2.0));
    col = mix(col, uNight * 1.25, fog);

    gl_FragColor = vec4(col, 1.0);
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
  emissive?: number;
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
  emissive = 1,
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
      uNight: { value: NIGHT.clone() },
      uWindowScale: { value: windowScale },
      uLitRatio: { value: litRatio },
      uEmissive: { value: emissive },
    };
    return { geo: g, edges: e, uniforms: u };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const p = useWorld.getState().progress;
    const b = alwaysBuilt
      ? buildOf(p, range, 0) > 0
        ? 1
        : 0
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
