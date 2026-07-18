"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { DAY } from "@/lib/daycycle";

// SkyDome: the far backdrop for the whole film. A large BackSide sphere with a
// zenith->horizon gradient sourced from the shared DAY uniforms, a sun disc +
// soft glow that tracks uSunDir (and fades below the horizon into just a warm
// horizon glow), plus a seeded star field whose opacity tracks uStars. The dome
// itself needs no fog term — it IS the fog's destination color at the limit.

const RADIUS = 800;
const STAR_COUNT = 500;

function lcg(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFrag = /* glsl */ `
  uniform vec3 uSkyCol;
  uniform vec3 uHorizonCol;
  uniform vec3 uGroundCol;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  varying vec3 vDir;

  void main() {
    vec3 dir = normalize(vDir);

    // zenith -> horizon -> below-horizon (ground haze), blended by direction.y
    float upMix = smoothstep(0.0, 0.55, dir.y);
    vec3 col = mix(uHorizonCol, uSkyCol, upMix);
    float downMix = smoothstep(0.0, -0.35, dir.y);
    col = mix(col, mix(uHorizonCol, uGroundCol, 0.5), downMix);

    // sun disc + layered glow, tracks uSunDir. A slightly larger disc with a
    // soft corona ring reads as a real sun instead of a white dot; low sun
    // (dawn/dusk) swells the corona for the golden-hour hero frames.
    vec3 sunDir = normalize(uSunDir);
    float sunDot = dot(dir, sunDir);
    float disc = smoothstep(0.9994, 0.9998, sunDot);
    float glow = pow(max(sunDot, 0.0), 12.0) * 0.5 + pow(max(sunDot, 0.0), 3.0) * 0.08;
    float sunVisible = smoothstep(-0.02, 0.03, sunDir.y);
    col += uSunColor * (disc * 2.2 + glow) * sunVisible; // BISECT: corona reverted

    // soft horizon glow that survives when the sun itself has dipped below —
    // dawn/dusk residue near the skyline even once the disc is hidden.
    float nearHorizon = exp(-abs(dir.y) * 7.0);
    float duskWindow = smoothstep(-0.28, -0.02, sunDir.y) * (1.0 - smoothstep(0.0, 0.14, sunDir.y));
    // only bloom the glow toward the sun's azimuth side of the sky, not all around
    float azimuthFalloff = smoothstep(-0.3, 0.85, dot(normalize(vec3(dir.x, 0.0, dir.z)), normalize(vec3(sunDir.x, 0.0, sunDir.z))));
    col += uHorizonCol * nearHorizon * duskWindow * azimuthFalloff * 1.4;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function makeStarGeometry(seed: number) {
  const rnd = lcg(seed);
  const positions = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);
  for (let i = 0; i < STAR_COUNT; i++) {
    // uniform points on the upper ~85% of a sphere shell (skip deep-below-horizon)
    const u = rnd();
    const v = rnd();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(1 - v * 1.7); // bias toward upper hemisphere
    const r = RADIUS * 0.94;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3] = x;
    positions[i * 3 + 1] = Math.abs(y) * 0.9 + r * 0.08; // keep stars up and away from the streets
    positions[i * 3 + 2] = z;
    sizes[i] = 1.2 + rnd() * 2.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), RADIUS);
  return geo;
}

const starVert = /* glsl */ `
  attribute float aSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize;
    gl_Position = projectionMatrix * mv;
  }
`;

const starFrag = /* glsl */ `
  uniform float uOpacity;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    float a = smoothstep(1.0, 0.0, d);
    gl_FragColor = vec4(vec3(1.0, 0.98, 0.92), a * uOpacity);
  }
`;

export function SkyDome({ seed = 7 }: { seed?: number }) {
  const skyMatRef = useRef<THREE.ShaderMaterial>(null);
  const starMatRef = useRef<THREE.ShaderMaterial>(null);

  const { domeGeo, domeUniforms, starGeo, starUniforms } = useMemo(() => {
    const domeGeo = new THREE.SphereGeometry(RADIUS, 32, 20);
    const domeUniforms = {
      uSkyCol: DAY.uSkyCol,
      uHorizonCol: DAY.uHorizonCol,
      uGroundCol: DAY.uGroundCol,
      uSunDir: DAY.uSunDir,
      uSunColor: DAY.uSunColor,
    };
    const starGeo = makeStarGeometry(seed);
    const starUniforms = { uOpacity: { value: 1 } };
    return { domeGeo, domeUniforms, starGeo, starUniforms };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  useFrame(() => {
    if (starMatRef.current) starMatRef.current.uniforms.uOpacity.value = DAY.uStars.value;
  });

  return (
    <group renderOrder={-100}>
      <mesh geometry={domeGeo} renderOrder={-100}>
        <shaderMaterial
          ref={skyMatRef}
          vertexShader={skyVert}
          fragmentShader={skyFrag}
          uniforms={domeUniforms}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      <points geometry={starGeo} renderOrder={-99}>
        <shaderMaterial
          ref={starMatRef}
          vertexShader={starVert}
          fragmentShader={starFrag}
          uniforms={starUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
