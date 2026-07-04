"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { useEffect, useRef, useState } from "react";
import StaticFallback from "./StaticFallback";
import * as THREE from "three";
import { useWorld } from "@/lib/store";
import { cameraAt, BUILD_RANGES } from "@/lib/path";
import { Ground } from "./city/Ground";
import { District } from "./city/District";
import { AdoptTower } from "./city/AdoptTower";
import { Crossing } from "./city/Crossing";
import { Sign } from "./city/Sign";
import { Building } from "./city/Building";
import { Workshops } from "./city/Workshops";
import { OpenPlot } from "./city/OpenPlot";

function ScrollDriver() {
  const setProgress = useWorld((s) => s.setProgress);
  const setReduced = useWorld((s) => s.setReduced);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduced(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onMq);
    };
  }, [setProgress, setReduced]);
  return null;
}

function CameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    // portrait phones need a wider cone or the avenue crops to a slit
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = size.width / size.height < 0.75 ? 68 : 52;
    cam.updateProjectionMatrix();
  }, [camera, size]);
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
  const [glOk, setGlOk] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setGlOk(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setGlOk(false);
    }
  }, []);
  if (glOk === null) return <div className="fixed inset-0 bg-night" />;
  if (!glOk) return <StaticFallback />;
  return (
    <div className="fixed inset-0">
      <Canvas
        camera={{ fov: 52, near: 0.5, far: 900 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(new THREE.Color("#0A1128"));
          scene.background = new THREE.Color("#0A1128");
        }}
      >
        <ScrollDriver />
        <CameraRig />
        <Stars />
        <Ground />

        {/* soft night lighting for standard-material props (roof furniture etc.) */}
        <ambientLight intensity={0.55} color="#8FA8C8" />
        <directionalLight position={[40, 80, 20]} intensity={1.1} color="#CFE0F0" />

        {/* Sheet 01 — Bengaluru quarter: chaotic low-rise, water tanks, headrooms */}
        <District centerZ={-60} depth={70} seed={41} range={BUILD_RANGES.bengaluru} count={30} heights={[4, 11]} warmPalette={["#E3C9A0", "#D9B98C", "#CFAE84", "#E8DCC8"]} litRatio={0.5} flavor="blr" exclude={(x, z) => (Math.abs(x + 16) < 7 && Math.abs(z + 46) < 8) || Math.hypot(x - 13, z + 70) < 9 || Math.hypot(x + 10, z + 50) < 9} />
        {/* landmarks: campus + the CO2 ML lab (B.Tech project) + PandaECE (first real job) */}
        <Building position={[13, 0, -70]} size={[10, 13, 8]} seed={6.6} range={BUILD_RANGES.bengaluru} delay={0.1} warm="#E8D5B0" litRatio={0.75} windowScale={1.05} />
        <Sign text="PANDAECE" position={[13, 14, -65.8]} width={6.5} visibleAfter={0.1} />
        <Building position={[-16, 0, -46]} size={[9, 5.5, 7]} seed={3.3} range={BUILD_RANGES.bengaluru} delay={0.15} warm="#E8DCC8" litRatio={0.7} />
        <Sign text="REVA UNIVERSITY" position={[-16, 6.8, -42.4]} width={7.5} visibleAfter={0.1} />
        <Building position={[13, 0, -38]} size={[5, 3.6, 5]} seed={9.9} range={BUILD_RANGES.bengaluru} delay={0.3} warm="#D9C6A8" litRatio={0.8} />
        <Sign text="CO₂ ML LAB" position={[13, 4.6, -35.4]} width={4.4} color="#5FD4F5" visibleAfter={0.12} />

        {/* Sheet 02 — the crossing */}
        <Crossing />

        {/* Sheet 03 — Paris quarter: uniform Haussmann heights, zinc mansards */}
        <District centerZ={-200} depth={60} seed={77} range={BUILD_RANGES.paris} count={24} heights={[8.5, 10]} warmPalette={["#E8DCC8", "#DCD2BE", "#D4C8B0"]} litRatio={0.35} flavor="paris" exclude={(x, z) => (Math.abs(x + 11) < 8 && Math.abs(z + 213) < 7) || Math.hypot(x - 13, z + 194) < 11} />
        <Building position={[-11, 0, -213]} size={[10, 6, 8]} seed={5.5} range={BUILD_RANGES.paris} delay={0.2} warm="#EFE6D4" litRatio={0.65} />
        <Sign text="ESSEC" position={[-11, 7.3, -208.9]} width={5} visibleAfter={0.38} />

        {/* Sheet 04 — the flagship */}
        <AdoptTower />
        <District centerZ={-260} depth={48} seed={91} range={BUILD_RANGES.adopt} count={14} heights={[6, 16]} exclude={(x, z) => Math.abs(x) < 14 && Math.abs(z + 270) < 15} />

        {/* Sheet 05 — Workshops lane: named sheds + filler, camera-path clearance */}
        <Workshops />
        <District
          centerZ={-318}
          depth={44}
          seed={55}
          range={BUILD_RANGES.workshops}
          count={12}
          heights={[3, 6]}
          avenueX={-8}
          litRatio={0.55}
          exclude={(x, z) =>
            [
              [-20, -302],
              [-2, -312],
              [-22, -326],
              [-5, -330],
              [-9, -280],
              [-26, -314],
              [-4, -338],
            ].some(([px, pz]) => Math.hypot(x - px, z - pz) < 8)
          }
        />

        {/* Sheet 06 — the open plot */}
        <OpenPlot />

        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.42} luminanceSmoothing={0.2} mipmapBlur />
          <Noise opacity={0.025} />
          <Vignette eskil={false} offset={0.16} darkness={0.55} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
