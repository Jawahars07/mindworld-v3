"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { useEffect, useRef, useState } from "react";
import StaticFallback from "./StaticFallback";
import * as THREE from "three";
import { useWorld } from "@/lib/store";
import { cameraAt, BUILD_RANGES } from "@/lib/path";
import { DAY, updateDay } from "@/lib/daycycle";
import { Ground } from "./city/Ground";
import { InstancedDistrict } from "./city/InstancedDistrict";
import { AdoptTower } from "./city/AdoptTower";
import { Sign } from "./city/Sign";
import { Building } from "./city/Building";
import { Workshops } from "./city/Workshops";
import { OpenPlot } from "./city/OpenPlot";
import { SkyDome } from "./sky/SkyDome";
import { Clouds } from "./sky/Clouds";
import { Birds } from "./sky/Birds";
import { Flight } from "./city/Flight";
import { Traffic } from "./city/Traffic";
import { Crowds } from "./city/Crowds";
import { Airliner, Rickshaw, CitroenCar, Temple } from "./city/Heroes";

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

// Advances the shared day-cycle uniforms once per frame (before anything renders)
// and keeps the THREE lights (for MeshStandardMaterial props: aircraft, vehicles,
// roof furniture) tracking the same sun near the camera's focus.
function DayDriver() {
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const focus = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3());
  useFrame(() => {
    const p = useWorld.getState().progress;
    const d = updateDay(p);
    cameraAt(p, pos.current, focus.current);
    if (dirRef.current) {
      dirRef.current.color.copy(d.sun);
      dirRef.current.intensity = Math.max(d.sunIntensity, 0.02);
      dirRef.current.position.copy(focus.current).addScaledVector(d.sunDir, 180);
      dirRef.current.target.position.copy(focus.current);
      dirRef.current.target.updateMatrixWorld();
    }
    if (hemiRef.current) {
      hemiRef.current.color.copy(d.sky);
      hemiRef.current.groundColor.copy(d.ground);
      hemiRef.current.intensity = 1.05;
    }
  }, -2);
  return (
    <>
      <directionalLight ref={dirRef} intensity={0} />
      <hemisphereLight ref={hemiRef} intensity={1.05} />
    </>
  );
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

// ---- Bengaluru quarter exclusion: landmarks, temple court, runway ground track
function blrExclude(x: number, z: number) {
  return (
    Math.hypot(x + 16, z + 46) < 9 || // REVA
    Math.hypot(x - 13, z + 70) < 9 || // PandaECE
    Math.hypot(x - 21, z + 62) < 7 || // PocketLite
    Math.hypot(x - 13, z + 38) < 7 || // CO₂ lab
    Math.hypot(x + 14, z + 93) < 11 || // ISKCON temple + courtyard
    (Math.abs(x - 2) < 8 && z < -100 && z > -132) // runway
  );
}

export default function Scene() {
  const [glOk, setGlOk] = useState<boolean | null>(null);
  const setTier = useWorld((s) => s.setTier);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setGlOk(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setGlOk(false);
    }
    // quality tier, once: small screens / few cores / low memory → low
    const nav = navigator as Navigator & { deviceMemory?: number };
    const low =
      window.innerWidth < 760 ||
      (nav.hardwareConcurrency ?? 8) < 6 ||
      (nav.deviceMemory ?? 8) <= 4;
    if (low) setTier("low");
  }, [setTier]);
  if (glOk === null) return <div className="fixed inset-0 bg-night" />;
  if (!glOk) return <StaticFallback />;
  return (
    <div className="fixed inset-0">
      <Canvas
        camera={{ fov: 52, near: 0.5, far: 900 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#0A1128"));
        }}
      >
        <ScrollDriver />
        <DayDriver />
        <CameraRig />
        <SkyDome />
        <Clouds />
        <Birds />
        <Ground />

        {/* ============ ACT 1 — BENGALURU (three sub-quarters) ============ */}
        {/* academic */}
        <InstancedDistrict centerZ={-42} depth={26} seed={41} range={BUILD_RANGES.blrAcademic} count={34} heights={[3.5, 8]} warmPalette={["#C98A5E", "#D9B98C", "#B56A4A", "#E3C9A0"]} litRatio={0.5} flavor="blr" exclude={blrExclude} />
        <Building position={[-16, 0, -46]} size={[9, 5.5, 7]} seed={3.3} range={BUILD_RANGES.blrAcademic} delay={0.15} warm="#E8DCC8" litRatio={0.7} />
        <Sign text="REVA UNIVERSITY" position={[-16, 6.8, -42.4]} width={7.5} visibleAfter={0.11} />
        <Building position={[13, 0, -38]} size={[5, 3.6, 5]} seed={9.9} range={BUILD_RANGES.blrAcademic} delay={0.3} warm="#D9C6A8" litRatio={0.8} />
        <Sign text="CO₂ ML LAB" position={[13, 4.6, -35.4]} width={4.4} color="#5FD4F5" visibleAfter={0.13} />
        {/* career */}
        <InstancedDistrict centerZ={-68} depth={26} seed={67} range={BUILD_RANGES.blrCareer} count={38} heights={[4, 11]} warmPalette={["#D9B98C", "#CFAE84", "#B56A4A", "#E8DCC8"]} litRatio={0.55} flavor="blr" exclude={blrExclude} />
        <Building position={[13, 0, -70]} size={[10, 13, 8]} seed={6.6} range={BUILD_RANGES.blrCareer} delay={0.1} warm="#E8D5B0" litRatio={0.75} windowScale={1.05} />
        <Sign text="PANDAECE" position={[13, 14, -65.8]} width={6.5} visibleAfter={0.17} />
        <Building position={[21, 0, -62]} size={[6, 7, 5]} seed={4.4} range={BUILD_RANGES.blrCareer} delay={0.25} warm="#D9C6A8" litRatio={0.65} />
        <Sign text="POCKETLITE" position={[21, 8.2, -59.4]} width={5} visibleAfter={0.18} />
        {/* cultural */}
        <InstancedDistrict centerZ={-94} depth={24} seed={83} range={BUILD_RANGES.blrCultural} count={30} heights={[3, 6.5]} warmPalette={["#E3C9A0", "#C98A5E", "#E8DCC8"]} litRatio={0.6} flavor="blr" exclude={blrExclude} />
        <Temple position={[-14, 0, -93]} />
        <Sign text="ISKCON BENGALURU" position={[-14, 11.2, -88.5]} width={8} visibleAfter={0.23} />
        {/* street life */}
        <Traffic zone={[-100, -32]} kind="rickshaw" count={9} appearRange={[0.12, 0.33]} />
        <Crowds
          clusters={[
            { x: -12, z: -44, count: 12, radius: 4 },
            { x: 9, z: -66, count: 14, radius: 5 },
            { x: -13, z: -96, count: 16, radius: 5 },
          ]}
          appearRange={[0.12, 0.33]}
        />

        {/* ============ ACT 2 — THE CROSSING ============ */}
        <Flight>
          <Airliner />
        </Flight>

        {/* ============ ACT 3 — PARIS ============ */}
        <InstancedDistrict centerZ={-205} depth={56} seed={77} range={BUILD_RANGES.paris} count={54} heights={[8.5, 10]} warmPalette={["#E3D9C2", "#DCD2BE", "#D4C8B0"]} litRatio={0.35} flavor="paris" exclude={(x, z) => (Math.abs(x + 11) < 8 && Math.abs(z + 213) < 7) || Math.hypot(x - 13, z + 196) < 11} />
        <Building position={[-11, 0, -213]} size={[10, 6, 8]} seed={5.5} range={BUILD_RANGES.paris} delay={0.2} warm="#EFE6D4" litRatio={0.65} />
        <Sign text="ESSEC" position={[-11, 7.3, -208.9]} width={5} visibleAfter={0.5} />

        {/* flagship */}
        <AdoptTower />
        <InstancedDistrict centerZ={-260} depth={44} seed={91} range={BUILD_RANGES.adopt} count={22} heights={[6, 16]} warmPalette={["#E3D9C2", "#DCD2BE", "#D4C8B0"]} flavor="paris" exclude={(x, z) => Math.abs(x) < 14 && Math.abs(z + 270) < 15} />

        {/* workshops + cultural street */}
        <Workshops />
        <InstancedDistrict
          centerZ={-318}
          depth={44}
          seed={55}
          range={BUILD_RANGES.workshops}
          count={20}
          heights={[3, 6]}
          avenueX={-8}
          litRatio={0.55}
          warmPalette={["#E3D9C2", "#D4C8B0", "#DCD2BE"]}
          flavor="paris"
          exclude={(x, z) =>
            [
              [-20, -302],
              [-2, -312],
              [-22, -326],
              [-5, -330],
              [-9, -280],
              [-26, -314],
              [-4, -338],
              [-3, -348],
            ].some(([px, pz]) => Math.hypot(x - px, z - pz) < 9)
          }
        />
        <Traffic zone={[-256, -196]} kind="car" count={7} appearRange={[0.5, 0.9]} />
        <Crowds
          clusters={[
            { x: -12, z: -218, count: 10, radius: 4 },
            { x: 8, z: -234, count: 8, radius: 4 },
            { x: -14, z: -330, count: 12, radius: 4 },
            { x: 3, z: -344, count: 10, radius: 3.5 },
          ]}
          appearRange={[0.5, 0.93]}
        />
        {/* parked hero Citroën on the café street */}
        <CitroenCar position={[-11, 0, -341]} rotation-y={0.35} />
        <Rickshaw position={[8.5, 0, -74]} rotation-y={-0.5} />

        {/* ============ ACT 4 — THE OPEN PLOT ============ */}
        <OpenPlot />

        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.72} luminanceSmoothing={0.25} mipmapBlur />
          <Noise opacity={0.025} />
          <Vignette eskil={false} offset={0.16} darkness={0.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
