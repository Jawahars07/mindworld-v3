"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useWorld } from "@/lib/store";
import { DAY } from "@/lib/daycycle";

// Crowds: street-level people as ONE instanced mesh of billboarded planes.
// The silhouette (head + body capsule) is drawn procedurally in the fragment
// shader — SDF shapes with feathered alpha, no textures. Billboarding is done
// in the vertex shader by placing the instance origin in view space and adding
// the plane's local x/y directly along the camera's right/up (i.e. rotation is
// stripped). Per-instance seed drives ±12% height/width jitter + sway phase.
// Colors: near-black silhouette by day, warm-lit at night (DAY uniforms).
// Manual exp2 fog per convention. Idle sway freezes under reduced-motion by
// simply not advancing uTime.

function lcg(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PERSON_W = 0.5;
const PERSON_H = 1.7;

const vert = /* glsl */ `
  uniform float uTime;

  attribute float aSeed;

  varying vec2 vP;        // 0..1 across the plane (x: 0 left, y: 0 feet)
  varying float vSeed;
  varying float vViewDist;

  float hash1(float x) { return fract(sin(x * 127.1) * 43758.5453); }

  void main() {
    vSeed = aSeed;

    // per-instance size jitter, +-12%
    float jw = 1.0 + (hash1(aSeed + 1.3) - 0.5) * 0.24;
    float jh = 1.0 + (hash1(aSeed + 4.7) - 0.5) * 0.24;

    // plane local coords: x in [-W/2, W/2], y in [0, H] (geometry pre-translated)
    vec2 local = vec2(position.x * jw, position.y * jh);
    vP = vec2(position.x / ${PERSON_W.toFixed(2)} + 0.5, position.y / ${PERSON_H.toFixed(2)});

    // gentle idle sway, stronger toward the head, per-instance phase/speed
    float swayPhase = aSeed * 6.2831;
    float swaySpeed = 0.7 + hash1(aSeed + 9.1) * 0.7;
    local.x += sin(uTime * swaySpeed + swayPhase) * 0.035 * vP.y;

    // cylindrical billboard: height stays WORLD-up (people stand vertical on the
    // ground no matter the camera pitch); only the width offset is view-space
    // camera-right, so the quad always faces the camera horizontally.
    vec4 origin = modelViewMatrix * (instanceMatrix * vec4(0.0, local.y, 0.0, 1.0));
    vec4 mv = vec4(origin.xyz + vec3(local.x, 0.0, 0.0), 1.0);
    vViewDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  uniform vec3 uSkyCol;
  uniform vec3 uGroundCol;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uNight;
  uniform vec3 uWarm; // night-time warm tint (streetlight amber)

  varying vec2 vP;
  varying float vSeed;
  varying float vViewDist;

  float hash1(float x) { return fract(sin(x * 127.1) * 43758.5453); }

  float sdCircle(vec2 p, vec2 c, float r) { return length(p - c) - r; }

  float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
  }

  void main() {
    // person silhouette in 0..1 plane space
    vec2 p = vP;
    // head
    float head = sdCircle(p, vec2(0.5, 0.86), 0.085);
    // torso: capsule shoulders -> hips
    float torso = sdCapsule(p, vec2(0.5, 0.72), vec2(0.5, 0.36), 0.125);
    // legs: two thin capsules, slight stance variation per person
    float stance = (hash1(vSeed + 2.9) - 0.5) * 0.08;
    float legL = sdCapsule(p, vec2(0.46, 0.38), vec2(0.44 + stance, 0.02), 0.05);
    float legR = sdCapsule(p, vec2(0.54, 0.38), vec2(0.56 - stance, 0.02), 0.05);
    float d = min(min(head, torso), min(legL, legR));

    // feathered edge; discard outside
    float alpha = 1.0 - smoothstep(-0.008, 0.012, d);
    if (alpha < 0.03) discard;

    // near-black at day (backlit silhouette), warm-lit at night
    vec3 dayCol = vec3(0.02, 0.022, 0.03) + uGroundCol * 0.08;
    vec3 nightCol = vec3(0.05, 0.05, 0.07) + uWarm * (0.04 + 0.04 * hash1(vSeed + 7.7));
    vec3 col = mix(dayCol, nightCol, uNight * 0.85);

    // manual exp2 fog (convention)
    float fog = 1.0 - exp(-pow(vViewDist * uFogDensity, 2.0));
    col = mix(col, uFogColor, fog);

    gl_FragColor = vec4(col, alpha);
  }
`;

export type CrowdsProps = {
  clusters: { x: number; z: number; count: number; radius: number }[];
  appearRange: readonly [number, number];
};

export function Crowds({ clusters, appearRange }: CrowdsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { mesh, material } = useMemo(() => {
    const tier = useWorld.getState().tier;
    const halve = tier === "low" ? 0.5 : 1;

    const geo = new THREE.PlaneGeometry(PERSON_W, PERSON_H);
    geo.translate(0, PERSON_H / 2, 0); // feet at y=0

    type P = { x: number; z: number; seed: number };
    const people: P[] = [];
    const r = lcg(7301 + clusters.length * 13);
    for (const c of clusters) {
      const cn = Math.max(1, Math.round(c.count * halve));
      for (let i = 0; i < cn; i++) {
        // seeded disc placement inside the cluster radius
        const ang = r() * Math.PI * 2;
        const rad = Math.sqrt(r()) * c.radius;
        people.push({ x: c.x + Math.cos(ang) * rad, z: c.z + Math.sin(ang) * rad, seed: r() * 100 });
      }
    }

    const aSeed = new Float32Array(people.length);
    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uWarm: { value: new THREE.Color("#FFB454") },
        // shared DAY value objects — never cloned, never written here
        uSkyCol: DAY.uSkyCol,
        uGroundCol: DAY.uGroundCol,
        uFogColor: DAY.uFogColor,
        uFogDensity: DAY.uFogDensity,
        uNight: DAY.uNight,
      },
    });

    const mesh = new THREE.InstancedMesh(geo, material, people.length);
    // Billboarding + sway happen in view space in the shader, so instance
    // matrices alone under-report bounds; people are scattered across clusters
    // anyway, so skip frustum culling for this one small mesh.
    mesh.frustumCulled = false;

    const m = new THREE.Matrix4();
    for (let i = 0; i < people.length; i++) {
      aSeed[i] = people[i].seed;
      m.makeTranslation(people[i].x, 0, people[i].z);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true; // static after this — default usage
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(aSeed, 1));

    return { mesh, material };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      mesh.geometry.dispose();
      material.dispose();
    };
  }, [mesh, material]);

  useFrame((_, delta) => {
    const { progress, reduced } = useWorld.getState();
    mesh.visible = progress >= appearRange[0] && progress <= appearRange[1];
    if (!mesh.visible) return;
    // idle sway: advance time only when motion is allowed (freeze = reduced)
    if (!reduced) material.uniforms.uTime.value += delta;
  });

  return <primitive object={mesh} ref={meshRef} />;
}
