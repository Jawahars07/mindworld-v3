"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useWorld } from "@/lib/store";
import { cameraAt, BUILD_RANGES } from "@/lib/path";
import { Ground } from "./city/Ground";
import { District } from "./city/District";
import { AdoptTower } from "./city/AdoptTower";

function ScrollDriver() {
  const setProgress = useWorld((s) => s.setProgress);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [setProgress]);
  return null;
}

function CameraRig() {
  const { camera } = useThree();
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const smoothed = useRef(-1);
  useFrame((_, dt) => {
    const target = useWorld.getState().progress;
    // critically-damped-ish chase so scroll feels weighty, not glued
    if (smoothed.current < 0) smoothed.current = target;
    const k = 1 - Math.exp(-dt * 5.5);
    smoothed.current += (target - smoothed.current) * k;
    cameraAt(smoothed.current, pos.current, look.current);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });
  return null;
}

function Stars() {
  // sparse hand-placed starfield: cheap points, no texture
  const ref = useRef<THREE.Points>(null);
  useEffect(() => {
    if (!ref.current) return;
    const n = 500;
    const arr = new Float32Array(n * 3);
    let s = 12;
    const r = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (r() - 0.5) * 1200;
      arr[i * 3 + 1] = 60 + r() * 380;
      arr[i * 3 + 2] = -r() * 900 + 100;
    }
    ref.current.geometry.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  }, []);
  return (
    <points ref={ref}>
      <bufferGeometry />
      <pointsMaterial color="#B9D8E8" size={0.9} sizeAttenuation transparent opacity={0.75} />
    </points>
  );
}

export default function Scene() {
  return (
    <div className="fixed inset-0">
      <Canvas
        camera={{ fov: 52, near: 0.5, far: 900 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 1.75]}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(new THREE.Color("#0A1128"));
          scene.background = new THREE.Color("#0A1128");
        }}
      >
        <ScrollDriver />
        <CameraRig />
        <Stars />
        <Ground />

        {/* Sheet 01 — Bengaluru quarter */}
        <District centerZ={-60} depth={70} seed={41} range={BUILD_RANGES.bengaluru} count={30} heights={[4, 13]} warmPalette={["#E3C9A0", "#D9B98C", "#CFAE84", "#E8DCC8"]} litRatio={0.5} />

        {/* Sheet 03 — Paris quarter */}
        <District centerZ={-200} depth={60} seed={77} range={BUILD_RANGES.paris} count={26} heights={[7, 12]} warmPalette={["#E8DCC8", "#DCD2BE", "#D4C8B0"]} litRatio={0.35} />

        {/* Sheet 04 — the flagship */}
        <AdoptTower />
        <District centerZ={-260} depth={48} seed={91} range={BUILD_RANGES.adopt} count={14} heights={[6, 16]} exclude={(x, z) => Math.abs(x) < 14 && Math.abs(z + 270) < 15} />

        {/* Sheet 05 — Workshops lane */}
        <District centerZ={-318} depth={44} seed={55} range={BUILD_RANGES.workshops} count={16} heights={[3, 7]} avenueX={-8} litRatio={0.55} />

        <EffectComposer>
          <Bloom intensity={0.9} luminanceThreshold={0.32} luminanceSmoothing={0.25} mipmapBlur />
          <Noise opacity={0.045} />
          <Vignette eskil={false} offset={0.18} darkness={0.72} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
