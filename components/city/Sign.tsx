"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useWorld } from "@/lib/store";
import { cssFamily, makeCanvasTexture } from "@/lib/canvasTexture";

// Small illuminated nameplate — every named place in the city is labeled the
// same way a drawing labels a room. Appears once its district has compiled.

export function Sign({
  text,
  position,
  rotationY = 0,
  width = 6,
  color = "#FFB454",
  visibleAfter = 0,
}: {
  text: string;
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  color?: string;
  visibleAfter?: number;
}) {
  const tex = useMemo(
    () =>
      makeCanvasTexture(512, 96, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = color;
        ctx.font = `600 54px ${cssFamily("--font-plot", '"IBM Plex Mono"')}, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, w / 2, h / 2 + 2);
      }),
    [text, color]
  );
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = useWorld.getState().progress > visibleAfter;
  });
  return (
    <mesh ref={ref} position={position} rotation-y={rotationY}>
      <planeGeometry args={[width, width * (96 / 512)]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
