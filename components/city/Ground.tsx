"use client";

import { useMemo } from "react";
import * as THREE from "three";

// Blueprint drafting sheet as the ground: minor/major grid, a brighter avenue spine,
// everything fading into night fog with distance.

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
  uniform vec3 uNight;
  uniform vec3 uCyan;
  varying vec3 vWorld;
  varying float vViewDist;

  float gridLine(vec2 p, float step, float width) {
    vec2 g = abs(fract(p / step - 0.5) - 0.5) * step;
    float d = min(g.x, g.y);
    return 1.0 - smoothstep(0.0, width, d);
  }

  void main() {
    vec3 col = uNight * 0.85;
    float minor = gridLine(vWorld.xz, 4.0, 0.05);
    float major = gridLine(vWorld.xz, 20.0, 0.09);
    col += uCyan * minor * 0.05;
    col += uCyan * major * 0.11;

    // avenue spine along z, gently drifting west after the flagship
    float axis = vWorld.z > -280.0 ? 0.0 : (vWorld.z + 280.0) * 0.18;
    float avenue = 1.0 - smoothstep(4.5, 6.5, abs(vWorld.x - axis));
    col += uCyan * avenue * 0.035;
    float curb = (1.0 - smoothstep(0.0, 0.35, abs(abs(vWorld.x - axis) - 5.5))) ;
    col += uCyan * curb * 0.22;

    float fog = 1.0 - exp(-pow(vViewDist * 0.0075, 2.0));
    col = mix(col, uNight * 1.25, fog);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Ground() {
  const uniforms = useMemo(
    () => ({
      uNight: { value: new THREE.Color("#0A1128") },
      uCyan: { value: new THREE.Color("#5FD4F5") },
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
