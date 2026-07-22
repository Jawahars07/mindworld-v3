"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useWorld } from "@/lib/store";
import { DAY } from "@/lib/daycycle";

// Birds: silhouette flocks wheeling over the districts — sunrise life above
// Bengaluru, golden-hour life above Paris. Built on the proven Crowds pattern:
// a manually-constructed InstancedMesh (instanceMatrix = orbit centre, set
// once), per-instance aSeed hashed in-shader into phase/radius/speed/scale,
// spherical billboarding in view space, single uTime uniform for orbit + flap.
// One draw call per flock; reduced-motion freezes uTime; low tier halves count.

function lcg(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A bird = a flat chevron ("M") in the XY plane, billboarded to the camera.
// aSide marks wing-tip verts so the shader can flap them.
function birdGeometry() {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array([
    // left wing (tip, root-top, root-bottom)
    -1, 0.16, 0, 0, 0.1, 0, 0, -0.04, 0,
    // right wing
    1, 0.16, 0, 0, -0.04, 0, 0, 0.1, 0,
  ]);
  const side = new Float32Array([1, 0, 0, 1, 0, 0]);
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
  return geo;
}

const vert = /* glsl */ `
  uniform float uTime;
  attribute float aSeed;
  attribute float aSide;
  varying float vFade;

  float hash1(float x) { return fract(sin(x * 127.1) * 43758.5453); }

  void main() {
    float phase = aSeed * 6.2831;
    float radius = 4.0 + hash1(aSeed + 1.7) * 9.0;
    float speed = 0.12 + hash1(aSeed + 3.3) * 0.1;
    float scale = 1.1 + hash1(aSeed + 5.9) * 0.9;

    float t = uTime * speed + phase;
    // orbit around the instance's centre, with a gentle vertical bob
    vec3 orbit = vec3(cos(t) * radius, sin(t * 0.7 + phase) * 1.2, sin(t) * radius * 0.7);

    // flap: wing tips arc about the body
    vec3 p = position;
    float flap = sin(uTime * 9.0 + phase * 7.0);
    p.y += aSide * (0.28 * flap - 0.16);
    p *= scale;

    // spherical billboard: orbit origin to view space, local shape stays in the
    // view plane (Crowds lesson: flat geometry viewed edge-on vanishes)
    vec4 origin = modelViewMatrix * (instanceMatrix * vec4(orbit, 1.0));
    vec4 mv = vec4(origin.xyz + vec3(p.xy, 0.0), 1.0);
    vFade = clamp(1.0 - length(mv.xyz) / 220.0, 0.15, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;
  void main() {
    if (uOpacity < 0.01) discard;
    gl_FragColor = vec4(uColor, uOpacity * vFade);
  }
`;

type FlockProps = {
  seed: number;
  count: number;
  center: [number, number, number]; // sky anchor of the flock
  spread: number; // how far orbit centres scatter
  appearRange: [number, number]; // scroll window with soft edges
};

function Flock({ seed, count, center, spread, appearRange }: FlockProps) {
  const { mesh, material } = useMemo(() => {
    const tier = useWorld.getState().tier;
    const n = tier === "low" ? Math.ceil(count / 2) : count;

    const geo = birdGeometry();
    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#141B2B") },
        uOpacity: { value: 0 },
      },
    });

    const mesh = new THREE.InstancedMesh(geo, material, n);
    mesh.frustumCulled = false; // orbits + billboarding happen in-shader

    const rnd = lcg(seed);
    const aSeed = new Float32Array(n);
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      m.makeTranslation(
        center[0] + (rnd() - 0.5) * spread,
        center[1] + (rnd() - 0.5) * spread * 0.3,
        center[2] + (rnd() - 0.5) * spread
      );
      mesh.setMatrixAt(i, m);
      aSeed[i] = rnd() * 100;
    }
    mesh.instanceMatrix.needsUpdate = true; // static after this
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(aSeed, 1));

    return { mesh, material };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  useEffect(() => {
    return () => {
      mesh.geometry.dispose();
      material.dispose();
    };
  }, [mesh, material]);

  useFrame((_, delta) => {
    const st = useWorld.getState();
    const p = st.progress;
    const [a, b] = appearRange;
    const edge = Math.min(
      THREE.MathUtils.clamp((p - a) / 0.03, 0, 1),
      THREE.MathUtils.clamp((b - p) / 0.03, 0, 1)
    );
    mesh.visible = edge > 0.001;
    if (!mesh.visible) return;
    if (!st.reduced) material.uniforms.uTime.value += delta;
    // silhouettes read at day; melt away only in deep night
    material.uniforms.uOpacity.value = edge * (1 - DAY.uNight.value * 0.55) * 0.95;
  });

  return <primitive object={mesh} />;
}

export function Birds() {
  return (
    <>
      {/* sunrise wheeling over Bengaluru — placed inside the camera look-cones.
          Thinned to a sparse, elegant few (was 14/9) — birds read as accent, not swarm. */}
      <Flock seed={101} count={6} center={[-16, 15, -54]} spread={26} appearRange={[0.1, 0.3]} />
      <Flock seed={137} count={4} center={[10, 16, -80]} spread={18} appearRange={[0.14, 0.31]} />
      {/* golden hour over Paris — sky above the flagship, then the workshop lane (was 12/10). */}
      <Flock seed={211} count={6} center={[4, 27, -256]} spread={26} appearRange={[0.5, 0.72]} />
      <Flock seed={251} count={4} center={[-6, 13, -318]} spread={20} appearRange={[0.72, 0.87]} />
    </>
  );
}
