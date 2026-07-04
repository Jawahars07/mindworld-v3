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
      makeCanvasTexture(1024, 192, (ctx, w, h) => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = color;
        ctx.font = `600 104px ${cssFamily("--font-plot", '"IBM Plex Mono"')}, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // shrink-to-fit so long labels never clip at the canvas edge
        const m = ctx.measureText(text).width;
        const s = Math.min(1, (w - 64) / m);
        ctx.setTransform(s, 0, 0, s, w / 2, h / 2);
        ctx.fillText(text, 0, 4);
      }),
    [text, color]
  );
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = useWorld.getState().progress > visibleAfter;
  });
  return (
    <mesh ref={ref} position={position} rotation-y={rotationY}>
      <planeGeometry args={[width, width * (192 / 1024)]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
