// Shared GLSL for the "compile" material: blueprint wireframe → sun-lit facade.
// Both Building.tsx (per-mesh, uBuild uniform) and the instanced district system
// (aBuild attribute forwarded as vBuild) assemble their shaders from these chunks,
// so the whole city shares one lighting + window + fog model driven by lib/daycycle.

// ---- vertex: common varyings. The including shader must set vBuild itself
// (from uniform or instance attribute) and may offset position first.
export const compileVaryings = /* glsl */ `
  varying vec3 vLocal;      // object-space position, base at y=0
  varying vec3 vNormal2;    // WORLD-space normal — for sun/hemisphere lighting
  varying vec3 vObjN;       // OBJECT-space normal — for face classification
  varying float vViewDist;  // for exp2 fog
  varying float vBuild;     // 0 wireframe … 1 fully compiled
  varying vec3 vSize;       // building dimensions (w,h,d)
`;

// ---- fragment: declarations shared by all compile materials
export const compileFragPars = /* glsl */ `
  uniform float uSeed;
  uniform vec3 uCyan;       // blueprint / construction-front color
  uniform vec3 uAmber;      // lit-window color
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;   // premultiplied by intensity
  uniform vec3 uSkyCol;
  uniform vec3 uGroundCol;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uNight;     // 1 night … 0 day
  uniform float uWindowScale;
  uniform float uLitRatio;  // base lit-window ratio at full night
  varying vec3 vLocal;
  varying vec3 vNormal2;
  varying vec3 vObjN;
  varying float vViewDist;
  varying float vBuild;
  varying vec3 vSize;

  float mwHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed * 17.31) * 43758.5453);
  }

  // Sun + hemisphere lighting for a facade of the given albedo.
  vec3 mwLight(vec3 albedo, vec3 n) {
    float sunDot = max(dot(n, normalize(uSunDir)), 0.0);
    vec3 hemi = mix(uGroundCol, uSkyCol, n.y * 0.5 + 0.5);
    return albedo * (uSunColor * sunDot * 0.85 + hemi * 1.15 + vec3(0.03));
  }

  // Full compile-material shading: albedo in, final unfogged color out.
  vec3 mwShade(vec3 albedo) {
    vec3 nW = normalize(vNormal2); // lighting
    vec3 n = normalize(vObjN);     // face classification
    float vgrad = 0.62 + 0.38 * (vLocal.y / max(vSize.y, 0.001));
    vec3 col = mwLight(albedo, nW) * vgrad;

    // procedural windows on vertical faces
    float vertFace = step(abs(n.y), 0.5);
    vec2 uv = mix(vec2(vLocal.x, vLocal.y), vec2(vLocal.z, vLocal.y), step(0.5, abs(n.x)));
    vec2 cellSize = vec2(1.5, 2.1) * uWindowScale;
    vec2 cell = floor(uv / cellSize);
    vec2 f = fract(uv / cellSize);
    float inWin = step(0.22, f.x) * step(f.x, 0.78) * step(0.28, f.y) * step(f.y, 0.8);
    float margin = step(1.0, vLocal.y) * step(vLocal.y, vSize.y - 0.8);
    float win = inWin * vertFace * margin;
    // by day: dark sky-tinted glass; by night: amber, ratio scales with uNight
    float litRatio = uLitRatio * (0.12 + 0.88 * uNight);
    // +0.5 = round(): raw floor() flickers per-fragment on axis-aligned faces
    // (normal interpolation noise around 0) and speckles the windows
    float lit = step(1.0 - litRatio, mwHash(cell + floor(n.xz * 3.0 + 0.5)));
    vec3 dayGlass = mix(uSkyCol * 0.55, uSkyCol, mwHash(cell + 2.7) * 0.5);
    vec3 nightGlass = uAmber * (1.1 + 0.7 * mwHash(cell + 4.2)) * lit;
    vec3 glass = mix(dayGlass * (1.0 - lit * 0.4), dayGlass * 0.35 + nightGlass, uNight * 0.85 + lit * 0.15);
    col = mix(col, glass, win);

    // cyan construction front where the compile sweep currently is
    float front = vBuild * vSize.y;
    float building = step(0.001, vBuild) * (1.0 - step(0.999, vBuild));
    float band = smoothstep(1.4, 0.0, front - vLocal.y) * building;
    col += uCyan * band * 1.6;
    // fresh geometry keeps a cyan tint that fades as the compile completes
    col += uCyan * 0.12 * (1.0 - vBuild);
    return col;
  }

  vec3 mwFog(vec3 col) {
    float fog = 1.0 - exp(-pow(vViewDist * uFogDensity, 2.0));
    return mix(col, uFogColor, fog);
  }
`;

// ---- fragment main body for a single-albedo building. The including shader
// declares `uniform vec3 uWarm;` (albedo) and calls this.
export const compileFragMainBody = /* glsl */ `
  float front = vBuild * vSize.y;
  if (vLocal.y > front + 0.001) discard;
  vec3 col = mwFog(mwShade(uWarm));
  gl_FragColor = vec4(col, 1.0);
`;
