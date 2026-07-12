"use client";

import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

// Hero GLBs modeled in Blender (Draco-compressed, ~47 KB total). Each hero wraps
// its loader in Suspense with a simple procedural stand-in so the film never
// hard-depends on an asset fetch. Decoders served locally from /draco/.

const DRACO = "/draco/";

function Glb({ url, ...props }: { url: string } & ThreeElements["group"]) {
  const { scene } = useGLTF(url, DRACO);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return (
    <group {...props}>
      <primitive object={cloned} />
    </group>
  );
}

function FallbackBox({
  size,
  color,
  ...props
}: { size: [number, number, number]; color: string } & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

// Blender exports: nose along glTF +Z for vehicles/aircraft (modeled +Y in
// Blender, exporter converts). Consumers rotate as needed.
export function Airliner(props: ThreeElements["group"]) {
  return (
    <Suspense fallback={<FallbackBox size={[8, 1.2, 9]} color="#F2F4F6" {...props} />}>
      <Glb url="/models/airliner.glb" {...props} />
    </Suspense>
  );
}

export function Rickshaw(props: ThreeElements["group"]) {
  return (
    <Suspense fallback={<FallbackBox size={[1.2, 1.3, 2.6]} color="#1E7A46" {...props} />}>
      <Glb url="/models/rickshaw.glb" {...props} />
    </Suspense>
  );
}

export function CitroenCar(props: ThreeElements["group"]) {
  return (
    <Suspense fallback={<FallbackBox size={[1.5, 1.4, 3.9]} color="#B8BDC4" {...props} />}>
      <Glb url="/models/citroen.glb" {...props} />
    </Suspense>
  );
}

export function Temple(props: ThreeElements["group"]) {
  return (
    <Suspense fallback={<FallbackBox size={[6, 9.5, 8]} color="#E8DCC0" {...props} />}>
      <Glb url="/models/temple.glb" {...props} />
    </Suspense>
  );
}

useGLTF.preload("/models/airliner.glb", DRACO);
useGLTF.preload("/models/rickshaw.glb", DRACO);
useGLTF.preload("/models/citroen.glb", DRACO);
useGLTF.preload("/models/temple.glb", DRACO);
