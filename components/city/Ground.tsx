"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { DAY } from "@/lib/daycycle";

// The ground compiles with the sun: full night = blueprint drafting sheet (cyan
// grid on navy), full day = earthen/asphalt ground lit by the day cycle, with the
// grid surviving as a faint drafting residue. uNight drives the cross-fade.

const vert = /* glsl */ `
  varying vec3 vWorld;
  varying float vViewDist;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    vec4 mv = viewMatrix * w;
    vViewDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  uniform vec3 uNightCol;
  uniform vec3 uCyan;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uSkyCol;
  uniform vec3 uGroundCol;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uNight;
  varying vec3 vWorld;
  varying float vViewDist;

  float gridLine(vec2 p, float step, float width) {
    vec2 g = abs(fract(p / step - 0.5) - 0.5) * step;
    float d = min(g.x, g.y);
    return 1.0 - smoothstep(0.0, width, d);
  }
  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    // ---- night layer: the blueprint sheet
    vec3 night = uNightCol * 0.85;
    float minor = gridLine(vWorld.xz, 4.0, 0.05);
    float major = gridLine(vWorld.xz, 20.0, 0.09);
    night += uCyan * minor * 0.075;
    night += uCyan * major * 0.16;

    // avenue spine along z, gently drifting west after the flagship
    float axis = vWorld.z > -280.0 ? 0.0 : (vWorld.z + 280.0) * 0.18;
    float avenue = 1.0 - smoothstep(4.5, 6.5, abs(vWorld.x - axis));
    night += uCyan * avenue * 0.035;
    float curb = 1.0 - smoothstep(0.0, 0.35, abs(abs(vWorld.x - axis) - 5.5));
    night += uCyan * curb * 0.22;

    // ---- day layer: earth blocks + asphalt avenue, sun + hemisphere lit
    // Bengaluru = warm laterite earth, Paris = cool pavement; blend along z
    float parisMix = smoothstep(-150.0, -195.0, vWorld.z);
    vec3 earth = mix(vec3(0.52, 0.38, 0.27), vec3(0.55, 0.53, 0.49), parisMix);
    earth *= 0.9 + 0.2 * hash21(floor(vWorld.xz / 4.0)); // block variation
    vec3 asphalt = vec3(0.21, 0.21, 0.23);
    vec3 albedo = mix(earth, asphalt, max(avenue, curb * 0.8));
    float sunDot = max(uSunDir.y, 0.0); // flat ground: N = +Y
    vec3 hemi = mix(uGroundCol, uSkyCol, 1.0);
    vec3 day = albedo * (uSunColor * sunDot * 0.85 + hemi * 1.15 + vec3(0.03));
    // drafting residue stays visible by day
    day += uCyan * (minor * 0.012 + major * 0.03 + curb * 0.05);

    vec3 col = mix(day, night, uNight);
    float fog = 1.0 - exp(-pow(vViewDist * uFogDensity, 2.0));
    col = mix(col, uFogColor, fog);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Ground() {
  const uniforms = useMemo(
    () => ({
      uNightCol: { value: new THREE.Color("#0A1128") },
      uCyan: { value: new THREE.Color("#5FD4F5") },
      uSunDir: DAY.uSunDir,
      uSunColor: DAY.uSunColor,
      uSkyCol: DAY.uSkyCol,
      uGroundCol: DAY.uGroundCol,
      uFogColor: DAY.uFogColor,
      uFogDensity: DAY.uFogDensity,
      uNight: DAY.uNight,
    }),
    []
  );
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, -180]}>
      <planeGeometry args={[900, 900]} />
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} />
    </mesh>
  );
}
