import * as THREE from 'three';
import { fxEnabled } from '../engine/fx-debug-toggles.js';

export function skyBakeSpreadRequestedFromParams(params, fallback = true) {
  const raw = params?.get?.('skyBakeSpread');
  if (raw === '0') return false;
  if (raw === '1') return true;
  return Boolean(fallback);
}

export function skyBakeFaceStride(frameStride, faceCount = 6) {
  const stride = Number.isFinite(frameStride) ? Math.max(1, Math.round(frameStride)) : 1;
  const faces = Number.isFinite(faceCount) ? Math.max(1, Math.round(faceCount)) : 1;
  return Math.max(1, Math.round(stride / faces));
}

const SKY_BRIGHTNESS_SHADER_MAX = 2.4;

export function createSkyDome(deps) {
  const { scene, camera, renderer, controlEls, tunedColor, getRevealBudgetActive, getMobileProfileActive = () => false } = deps;

  // The procedural sky "full" branch is ~3.5x the per-pixel cost of "balanced"
  // and covers the upper half of the frame — a top fill cost on mobile. Mobile
  // is forced to "balanced"; ?skyQuality=full|balanced overrides it (for on-
  // device A/B against the benchmark overlay).
  let skyQualityUrlOverride = null;
  try {
    const q = new URLSearchParams(location.search).get('skyQuality');
    if (q === 'full' || q === 'balanced') skyQualityUrlOverride = q;
  } catch {}
  // Cheaper cloud tiers for the mobile ("balanced") sky: 0 = full clouds (4-oct
  // fbm + 3-oct ridge), 1 = conservative (2-oct + 2-oct, coarser detail),
  // 2 = aggressive (2-oct broad, ridge dropped). The sky is the top mobile fill
  // cost (+5.4fps measured). ?skyCheap=0|1|2 previews each; SKY_CHEAP_MOBILE_DEFAULT
  // is the shipped mobile default (set after a before/after look review).
  const SKY_CHEAP_MOBILE_DEFAULT = 0;
  let skyCheapUrlOverride = null;
  try {
    const c = new URLSearchParams(location.search).get('skyCheap');
    if (c === '0' || c === '1' || c === '2') skyCheapUrlOverride = Number(c);
  } catch {}
  // Sky BACKGROUND BAKE: instead of running the procedural noise for every sky
  // pixel every frame, bake the sky into a low-res cube every few frames and
  // reuse it as scene.background (a cheap cube sample). The sky is a smooth
  // backdrop at infinity, so the cube stays valid across camera moves; only slow
  // drift/lightning re-steps on re-bake. Steady-state only (the reveal keeps its
  // own procedural sky). ?skyBake=1|0 overrides.
  //
  // Now on by default on desktop too: the 'full' sky branch is the shipped
  // desktop default and evaluates ~11 multi-octave 3D noise fields per sky pixel,
  // which is roughly half the frame at street level, every frame, forever. The
  // desktop bake uses a larger cube so the extra resolution keeps the detail the
  // procedural branch is there for.
  const SKY_BAKE_MOBILE_DEFAULT = true;
  const SKY_BAKE_DESKTOP_DEFAULT = true;
  const SKY_BAKE_CUBE_SIZE_MOBILE = 128;
  const SKY_BAKE_CUBE_SIZE_DESKTOP = 512;
  const SKY_BAKE_STRIDE = 12;
  const SKY_BAKE_FACE_COUNT = 6;
  const SKY_BAKE_FACE_STRIDE = skyBakeFaceStride(SKY_BAKE_STRIDE, SKY_BAKE_FACE_COUNT);
  const SKY_BAKE_SPREAD_DEFAULT = true;
  let skyBakeRequestedOverride = null;
  let skyBakeSpreadEnabled = SKY_BAKE_SPREAD_DEFAULT;
  try {
    const skyBakeParams = new URLSearchParams(location.search);
    const b = skyBakeParams.get('skyBake');
    if (b === '0' || b === '1') skyBakeRequestedOverride = b === '1';
    skyBakeSpreadEnabled = skyBakeSpreadRequestedFromParams(skyBakeParams, SKY_BAKE_SPREAD_DEFAULT);
  } catch {}

  const skyPalette = {
    storm: new THREE.Color(0x041a20),
    void: new THREE.Color(0x01070a),
    grid: new THREE.Color(0x061c24),
    teal: new THREE.Color(0x082f36),
    steel: new THREE.Color(0x111820),
    'tron-lighting': new THREE.Color(0x041d24),
  };
  const skyDisplayColor = new THREE.Color();

  const SKY_DOME_RADIUS = 8500;
  const domeGeo = new THREE.SphereGeometry(SKY_DOME_RADIUS, 32, 18);
  const SKY_ANIMATION_SPEED = 0.3;
  const domeMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBrightness: { value: 1 },
      uHue: { value: 0 },
      uCloudAmount: { value: 1 },
      uCloudContrast: { value: 1 },
      uLightningMode: { value: 0 },
      uLightningHue: { value: 0 },
      uSkyQuality: { value: 0 },
      uSkyCheap: { value: 0 },
      uSkyTint: { value: new THREE.Color(0x041a20) },
      uSkyTintStrength: { value: 0.38 },
      uStormFrequency: { value: 1 },
      uStormIntensity: { value: 1 },
      uStormSize: { value: 1 },
      uStormCloudThreshold: { value: 0.64 },
      uStormBand: { value: 1 },
      uStormVeil: { value: 1 },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec3 vDir;
      uniform float uTime;
      uniform float uBrightness;
      uniform float uHue;
      uniform float uCloudAmount;
      uniform float uCloudContrast;
      uniform float uLightningMode;
      uniform float uLightningHue;
      uniform float uSkyQuality;
      uniform float uSkyCheap;
      uniform vec3 uSkyTint;
      uniform float uSkyTintStrength;
      uniform float uStormFrequency;
      uniform float uStormIntensity;
      uniform float uStormSize;
      uniform float uStormCloudThreshold;
      uniform float uStormBand;
      uniform float uStormVeil;

      float hash21(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float hash31(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);
        float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
        float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
        float nx00 = mix(n000, n100, u.x);
        float nx10 = mix(n010, n110, u.x);
        float nx01 = mix(n001, n101, u.x);
        float nx11 = mix(n011, n111, u.x);
        float nxy0 = mix(nx00, nx10, u.y);
        float nxy1 = mix(nx01, nx11, u.y);
        return mix(nxy0, nxy1, u.z);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.5;
        mat2 rot = mat2(0.82, -0.57, 0.57, 0.82);
        for (int i = 0; i < 4; i++) {
          value += amp * noise(p);
          p = rot * p * 2.05 + 12.73;
          amp *= 0.52;
        }
        return value;
      }

      float ridge(vec2 p) {
        float v = 0.0;
        float a = 0.55;
        for (int i = 0; i < 3; i++) {
          float n = noise(p);
          v += a * (1.0 - abs(n * 2.0 - 1.0));
          p = p * 2.2 + 9.41;
          a *= 0.48;
        }
        return v;
      }

      float fbm3(vec3 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 4; i++) {
          value += amp * noise3(p);
          p = p * 2.03 + vec3(12.73, 4.17, 9.31);
          amp *= 0.52;
        }
        return value;
      }

      float ridge3(vec3 p) {
        float value = 0.0;
        float amp = 0.55;
        for (int i = 0; i < 3; i++) {
          float n = noise3(p);
          value += amp * (1.0 - abs(n * 2.0 - 1.0));
          p = p * 2.18 + vec3(9.41, 17.2, 6.8);
          amp *= 0.48;
        }
        return value;
      }

      // Cheaper 2-octave variants for the mobile "balanced" sky tiers.
      float fbm3lo(vec3 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 2; i++) {
          value += amp * noise3(p);
          p = p * 2.03 + vec3(12.73, 4.17, 9.31);
          amp *= 0.52;
        }
        return value;
      }

      float ridge3lo(vec3 p) {
        float value = 0.0;
        float amp = 0.55;
        for (int i = 0; i < 2; i++) {
          float n = noise3(p);
          value += amp * (1.0 - abs(n * 2.0 - 1.0));
          p = p * 2.18 + vec3(9.41, 17.2, 6.8);
          amp *= 0.48;
        }
        return value;
      }

      vec3 hueShift(vec3 color, float hueDeg) {
        float a = radians(hueDeg);
        const vec3 k = vec3(0.57735026919);
        return color * cos(a) + cross(k, color) * sin(a) + k * dot(k, color) * (1.0 - cos(a));
      }

      float pulseCurve(float value, float center, float width) {
        float pulse = smoothstep(1.0, 0.0, abs(value - center) / max(width, 0.0001));
        return pulse * pulse;
      }

      float glitchBurst(float t) {
        float cell = floor(t * 1.86);
        float local = fract(t * 1.86);
        float chance = step(0.64, hash21(vec2(cell, 41.7)));
        float center = 0.18 + 0.64 * hash21(vec2(cell, 9.2));
        float width = mix(0.028, 0.074, hash21(vec2(cell, 73.4)));
        float strike = pulseCurve(local, center, width);
        float stutter = step(0.64, hash21(vec2(cell, floor(local * 48.0) + 5.0)));
        float afterT = max(1.0 - max(local - center, 0.0) * mix(3.2, 6.4, hash21(vec2(cell, 18.1))), 0.0);
        float after = afterT * afterT * afterT;
        return chance * max(strike, after * 0.10) * mix(0.18, 0.36, stutter);
      }

      void main() {
        vec3 dir = vDir;
        float y = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
        float skyDepth = smoothstep(0.12, 1.0, y);

        float seed = 36.93;
        float flow = uTime;
        float morphA = 0.34;
        float morphB = 0.62;
        float breath = 0.55;
        vec3 cloudDrift = vec3(0.027, 0.009, -0.018) * flow;
        vec3 cloudPulse = vec3(0.0825, -0.027, 0.0525) * flow;
        vec3 cloudP = dir * 1.45 + vec3(0.0, dir.y * 0.18, 0.0) + cloudDrift + seed;
        float warpX = 0.0;
        float warpY = 0.0;
        if (uSkyQuality > 0.5) {
          warpX = fbm3(cloudP * 1.55 + vec3(uTime * 0.0825, 18.4, 3.1));
          warpY = fbm3(cloudP * 1.42 + vec3(27.1 - uTime * 0.069, 9.7, 21.3));
        } else {
          warpX = noise3(cloudP * 1.65 + vec3(uTime * 0.0525, 18.4, 3.1));
          warpY = noise3(cloudP * 1.48 + vec3(27.1 - uTime * 0.045, 9.7, 21.3));
        }
        float warpZ = warpX * 0.63 + warpY * 0.37;
        if (uSkyQuality > 0.5) {
          warpZ = fbm3(cloudP * 1.34 + vec3(8.6, 14.2 + uTime * 0.057, 31.5));
        }
        vec3 warp = vec3(warpX, warpY, warpZ) - 0.5;
        vec3 warpedP = cloudP + warp * (0.14 + breath * 0.08);

        float broad = 0.0;
        float detail = 0.0;
        float rolling = 0.0;
        float under = 0.0;
        if (uSkyQuality > 0.5) {
          float broadA = fbm3(warpedP * 1.08 + cloudPulse * 0.62);
          float broadB = fbm3(warpedP * 1.16 + vec3(31.7, 12.4, 7.2) - cloudPulse * 0.45);
          float detailA = ridge3(warpedP * 2.65 + vec3(flow * 0.045, flow * 0.015, flow * 0.027));
          float detailB = ridge3(warpedP * 2.95 + vec3(19.4, 27.8, 11.1) + vec3(flow * 0.036, flow * 0.018, -flow * 0.024));
          float rollingA = fbm3(dir * 1.75 + warp * 0.22 + vec3(flow * 0.030, flow * 0.015, flow * 0.021));
          float rollingB = fbm3(dir * 1.90 + vec3(11.2, 8.4, 5.5) - warp * 0.18 + vec3(flow * 0.024, flow * 0.018, flow * 0.015));
          float underA = fbm3(dir * 1.42 + warp * 0.18 + vec3(flow * 0.024, flow * 0.012, flow * 0.0165));
          float underB = fbm3(dir * 1.34 + vec3(7.8, 22.1, 13.4) - warp * 0.16 + vec3(flow * 0.018, flow * 0.0135, flow * 0.012));
          broad = mix(broadA, broadB, smoothstep(0.0, 1.0, morphA));
          detail = mix(detailA, detailB, smoothstep(0.0, 1.0, morphB));
          rolling = mix(rollingA, rollingB, morphA);
          under = mix(underA, underB, morphB);
        } else if (uSkyCheap > 1.5) {
          // aggressive: 2-octave broad, ridge detail dropped to one cheap sample
          broad = fbm3lo(warpedP * 1.12 + cloudPulse * 0.48);
          detail = noise3(warpedP * 2.54 + vec3(flow * 0.039, flow * 0.015, flow * 0.021));
          rolling = noise3(dir * 1.78 + warp * 0.18 + vec3(flow * 0.027, flow * 0.0135, flow * 0.018));
          under = noise3(dir * 1.36 + warp * 0.12 + vec3(flow * 0.018, flow * 0.012, flow * 0.015));
        } else if (uSkyCheap > 0.5) {
          // conservative: 2-octave broad + 2-octave ridge detail
          broad = fbm3lo(warpedP * 1.12 + cloudPulse * 0.48);
          detail = ridge3lo(warpedP * 2.54 + vec3(flow * 0.039, flow * 0.015, flow * 0.021));
          rolling = noise3(dir * 1.78 + warp * 0.18 + vec3(flow * 0.027, flow * 0.0135, flow * 0.018));
          under = noise3(dir * 1.36 + warp * 0.12 + vec3(flow * 0.018, flow * 0.012, flow * 0.015));
        } else {
          broad = fbm3(warpedP * 1.12 + cloudPulse * 0.48);
          detail = ridge3(warpedP * 2.54 + vec3(flow * 0.039, flow * 0.015, flow * 0.021));
          rolling = noise3(dir * 1.78 + warp * 0.18 + vec3(flow * 0.027, flow * 0.0135, flow * 0.018));
          under = noise3(dir * 1.36 + warp * 0.12 + vec3(flow * 0.018, flow * 0.012, flow * 0.015));
        }

        float ceiling = smoothstep(0.32, 0.96, y);
        float lowShelf = smoothstep(-0.42, 0.18, dir.y) * smoothstep(0.72, -0.10, dir.y);
        float cloudRaw = broad * 0.68 + detail * 0.18 + rolling * 0.24;
        float cloudContrast = clamp(uCloudContrast, 0.0, 5.0);
        float cloudField = clamp((cloudRaw - 0.5) * max(cloudContrast, 0.001) + 0.5, 0.0, 1.0);
        float cloudMask = smoothstep(0.36 - breath * 0.035, 0.72 + breath * 0.025, cloudField) * uCloudAmount;
        float lowerCloud = smoothstep(0.37 - breath * 0.025, 0.72 + breath * 0.020, under) * lowShelf * uCloudAmount;
        float cloudBody = cloudMask * ceiling;
        float cloudBreaks = smoothstep(0.30, 0.70, noise3(cloudP * 7.5 + cloudPulse * 0.7));
        vec3 low = vec3(0.001, 0.004, 0.006);
        vec3 top = vec3(0.002, 0.008, 0.012);
        vec3 col = mix(low, top, smoothstep(0.16, 1.0, y));

        float distanceFade = mix(0.34, 0.68, skyDepth);
        float contrastBoost = max(cloudContrast - 1.0, 0.0);
        float contrastSoften = clamp(1.0 - cloudContrast, 0.0, 1.0);
        vec3 cloudDark = mix(vec3(0.008, 0.020, 0.025), vec3(0.035, 0.085, 0.098), detail);
        vec3 cloudLit = vec3(0.042, 0.126, 0.145) * (0.50 + detail * 0.46);
        cloudDark *= max(0.32, 1.0 - contrastBoost * 0.16);
        cloudLit *= 1.0 + contrastBoost * 0.22;
        cloudDark = mix(cloudDark, vec3(0.018, 0.042, 0.048), contrastSoften * 0.45);
        cloudLit *= mix(1.0, 0.68, contrastSoften);
        col = mix(col, cloudDark, cloudBody * 0.54 * distanceFade);
        col += cloudLit * cloudBody * (0.10 + cloudBreaks * 0.18) * distanceFade;
        col = mix(col, vec3(0.004, 0.012, 0.016), lowerCloud * 0.30);
        col = mix(col, vec3(0.006, 0.030, 0.036), (1.0 - skyDepth) * 0.18);
        vec3 tintLift = uSkyTint * (0.20 + cloudBody * 0.64 + lowerCloud * 0.32 + (1.0 - skyDepth) * 0.18);
        col = mix(col, max(col, tintLift), uSkyTintStrength);
        float lightning = 0.0;
        if (uLightningMode > 0.5) {
          float lightningThread = uSkyQuality > 0.5
            ? ridge3(warpedP * 7.8 + warp * 2.2 + vec3(uTime * 0.18, -uTime * 0.11, uTime * 0.07))
            : noise3(warpedP * 7.1 + warp * 1.4 + vec3(uTime * 0.12, -uTime * 0.07, uTime * 0.05));
          float bandExpand = (clamp(uStormBand, 0.05, 5.0) - 1.0) * 0.08;
          float upperStormBand = smoothstep(0.50 - bandExpand, 0.62 - bandExpand, y) * (1.0 - smoothstep(0.86 + bandExpand, 0.96 + bandExpand, y));
          float cloudEdge = smoothstep(0.40, 0.56, cloudRaw) * (1.0 - smoothstep(0.69, 0.86, cloudRaw));
          float frequency = max(uStormFrequency, 0.0001);
          float stormEnabled = step(0.001, uStormFrequency);
          float veil = clamp(uStormVeil, 0.0, 5.0);
          float veilMix = clamp(veil * 0.5, 0.0, 1.0);
          float cloudGate = smoothstep(uStormCloudThreshold - 0.16, uStormCloudThreshold + 0.14, cloudRaw);
          float glitch = glitchBurst(uTime * 2.890625 * frequency + seed * 0.31) * upperStormBand * 0.42;
          float cloudVeil = cloudGate * cloudBody * upperStormBand;
          float hiddenThread = smoothstep(min(0.96, uStormCloudThreshold + 0.18), 1.0, lightningThread) * cloudVeil * mix(0.08, 0.24, veilMix);
          vec2 stormUv = vec2(atan(dir.x, dir.z) * 0.159154943 + 0.5, y);
          float sparkClock = uTime * 5.234375 * frequency + seed * 0.17;
          float sparkCell = floor(sparkClock);
          float sparkLocal = fract(sparkClock);
          vec2 sparkCenter = vec2(
            hash21(vec2(sparkCell, 2.7)),
            mix(0.58, 0.84, hash21(vec2(sparkCell, 8.4)))
          );
          float sparkDx = abs(stormUv.x - sparkCenter.x);
          sparkDx = min(sparkDx, 1.0 - sparkDx);
          vec2 sparkDelta = vec2(sparkDx * 3.8, (stormUv.y - sparkCenter.y) * 5.6);
          float sparkPulse = pulseCurve(sparkLocal, mix(0.18, 0.82, hash21(vec2(sparkCell, 14.9))), 0.16);
          float cloudTrace = max(cloudEdge * cloudBody * mix(0.38, 0.14, veilMix), hiddenThread) * upperStormBand;
          float sparkFalloff = max(1.0 - dot(sparkDelta, sparkDelta) / (0.01171875 * max(uStormSize, 0.01)), 0.0);
          float stormSpark = sparkFalloff * sparkFalloff * sparkFalloff * sparkPulse * cloudTrace * 0.75 * mix(1.35, 0.62, veilMix);
          float localizedSpark = max(hiddenThread * mix(0.08, 0.26, veilMix), stormSpark);
          float microGlare = localizedSpark * mix(0.08, 0.22, skyDepth);
          float stormVisibility = mix(0.20, 0.42, skyDepth) * (0.35 + cloudBreaks * 0.22);
          lightning = (glitch * microGlare + stormSpark * stormVisibility) * uStormIntensity * stormEnabled;
          vec3 lightningColor = hueShift(vec3(0.38, 0.92, 1.0), uLightningHue);
          col += lightningColor * lightning * (0.125 + cloudBreaks * 0.1875);
        }

        float scan = sin(y * 420.0 + uTime * 2.2) * 0.5 + 0.5;
        col *= 0.982 + scan * 0.008;
        col += (hash21(gl_FragCoord.xy * 0.35 + uTime) - 0.5) * 0.0015;
        col = hueShift(max(col, 0.0), uHue) * uBrightness;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: true,
    fog: false,
    toneMapped: true,
  });
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  domeMesh.frustumCulled = false;
  domeMesh.renderOrder = 1000;
  scene.add(domeMesh);
  skyDisplayColor.copy(skyPalette.storm);
  scene.background = skyDisplayColor;
  const cityRevealSkyScene = new THREE.Scene();
  cityRevealSkyScene.background = skyDisplayColor;
  const cityRevealSkyMat = domeMat.clone();
  cityRevealSkyMat.name = 'city-reveal-sky-material';
  const cityRevealSkyDome = new THREE.Mesh(domeGeo, cityRevealSkyMat);
  cityRevealSkyDome.frustumCulled = false;
  cityRevealSkyDome.renderOrder = domeMesh.renderOrder;
  cityRevealSkyScene.add(cityRevealSkyDome);
  function cityRevealSkyUsesBudgetQuality() {
    return Boolean(getRevealBudgetActive());
  }
  function syncCityRevealSkyMaterial() {
    for (const [key, sourceUniform] of Object.entries(domeMat.uniforms || {})) {
      const targetUniform = cityRevealSkyMat.uniforms?.[key];
      if (!targetUniform) continue;
      const value = sourceUniform.value;
      if (value?.isColor && targetUniform.value?.isColor) targetUniform.value.copy(value);
      else targetUniform.value = value;
    }
    if (cityRevealSkyUsesBudgetQuality() && cityRevealSkyMat.uniforms?.uSkyQuality) {
      cityRevealSkyMat.uniforms.uSkyQuality.value = 0;
    }
  }
  function syncCityRevealSkyDome() {
    cityRevealSkyScene.background = scene.background || skyDisplayColor;
    cityRevealSkyDome.visible = domeMesh.visible;
    cityRevealSkyDome.position.copy(camera.position);
    syncCityRevealSkyMaterial();
  }

  function renderCityRevealSkyBase() {
    const previousAutoClear = renderer.autoClear;
    const previousClippingPlanes = renderer.clippingPlanes;
    syncCityRevealSkyDome();
    renderer.autoClear = true;
    renderer.clippingPlanes = [];
    renderer.render(cityRevealSkyScene, camera);
    renderer.clippingPlanes = previousClippingPlanes;
    renderer.autoClear = previousAutoClear;
  }

  function applySkyPreset(choice, brightness, hueDeg, quality = controlEls.skyQuality?.value || 'balanced') {
    const base = skyPalette[choice] || skyPalette.grid;
    const lightingEnabled = choice === 'tron-lighting';
    skyDisplayColor.copy(tunedColor(base, hueDeg, 1, brightness));
    domeMat.uniforms.uBrightness.value = THREE.MathUtils.clamp(brightness, 0.05, SKY_BRIGHTNESS_SHADER_MAX);
    domeMat.uniforms.uHue.value = hueDeg;
    domeMat.uniforms.uCloudAmount.value = 1;
    domeMat.uniforms.uLightningMode.value = lightingEnabled ? 1 : 0;
    domeMat.uniforms.uLightningHue.value = hueDeg;
    const effectiveQuality = skyQualityUrlOverride || (getMobileProfileActive() ? 'balanced' : quality);
    domeMat.uniforms.uSkyQuality.value = effectiveQuality === 'full' ? 1 : 0;
    domeMat.uniforms.uSkyCheap.value = skyCheapUrlOverride != null
      ? skyCheapUrlOverride
      : (getMobileProfileActive() ? SKY_CHEAP_MOBILE_DEFAULT : 0);
    domeMat.uniforms.uSkyTint.value.copy(skyDisplayColor);
    domeMat.uniforms.uSkyTintStrength.value = choice === 'void' ? 0.08 : (choice === 'steel' ? 0.26 : 0.42);
    domeMesh.visible = fxEnabled('sky');
    scene.background = skyDisplayColor;
  }

  function applySkyControlsFromUI() {
    const skyChoice = controlEls.skyChoice.value;
    const skyBrightness = Number(controlEls.skyBrightness.value);
    const skyHue = Number(controlEls.skyHue.value);
    const skyCloudContrast = Number(controlEls.skyCloudContrast.value);
    const skyQuality = controlEls.skyQuality.value;
    applySkyPreset(skyChoice, skyBrightness, skyHue, skyQuality);
    applyStormControlsFromUI();
    domeMat.uniforms.uCloudContrast.value = skyCloudContrast;
    controlEls.skyBrightnessVal.textContent = skyBrightness.toFixed(2);
    controlEls.skyHueVal.textContent = skyHue.toFixed(0);
    controlEls.skyCloudContrastVal.textContent = skyCloudContrast.toFixed(2);
  }

  function applyStormControlsFromUI() {
    const frequency = Number(controlEls.skyStormFrequency.value);
    const intensity = Number(controlEls.skyStormIntensity.value);
    const size = Number(controlEls.skyStormSize.value);
    const cloudThreshold = Number(controlEls.skyStormCloudThreshold.value);
    const band = Number(controlEls.skyStormBand.value);
    const veil = Number(controlEls.skyStormVeil.value);
    domeMat.uniforms.uStormFrequency.value = frequency;
    domeMat.uniforms.uStormIntensity.value = intensity;
    domeMat.uniforms.uStormSize.value = size;
    domeMat.uniforms.uStormCloudThreshold.value = cloudThreshold;
    domeMat.uniforms.uStormBand.value = band;
    domeMat.uniforms.uStormVeil.value = veil;
    controlEls.skyStormFrequencyVal.textContent = frequency.toFixed(2);
    controlEls.skyStormIntensityVal.textContent = intensity.toFixed(2);
    controlEls.skyStormSizeVal.textContent = size.toFixed(2);
    controlEls.skyStormCloudThresholdVal.textContent = cloudThreshold.toFixed(2);
    controlEls.skyStormBandVal.textContent = band.toFixed(2);
    controlEls.skyStormVeilVal.textContent = veil.toFixed(2);
  }

  function update(now) {
    domeMesh.position.copy(camera.position);
    if (domeMesh.visible) domeMat.uniforms.uTime.value = now * 0.001 * SKY_ANIMATION_SPEED;
  }

  function inspectRevealSky() {
    return {
      cityRevealSkyDomeVisible: cityRevealSkyDome.visible,
      cityRevealSkyBudgetQuality: cityRevealSkyUsesBudgetQuality(),
      cityRevealSkyQualityMain: domeMat.uniforms.uSkyQuality.value,
      cityRevealSkyQualityReveal: cityRevealSkyMat.uniforms.uSkyQuality.value,
    };
  }

  function inspectStorm() {
    return {
      brightness: Number(controlEls.skyBrightness.value),
      brightnessUniform: domeMat.uniforms.uBrightness.value,
      brightnessMax: SKY_BRIGHTNESS_SHADER_MAX,
      frequency: domeMat.uniforms.uStormFrequency.value,
      cloudContrast: domeMat.uniforms.uCloudContrast.value,
      intensity: domeMat.uniforms.uStormIntensity.value,
      size: domeMat.uniforms.uStormSize.value,
      cloudThreshold: domeMat.uniforms.uStormCloudThreshold.value,
      band: domeMat.uniforms.uStormBand.value,
      veil: domeMat.uniforms.uStormVeil.value,
      mainQuality: domeMat.uniforms.uSkyQuality.value,
      revealQuality: cityRevealSkyMat.uniforms.uSkyQuality.value,
      revealBudgetQuality: cityRevealSkyUsesBudgetQuality(),
    };
  }

  const skyBakeState = {
    active: false,
    ready: false,
    cubeRT: null,
    cubeCam: null,
    frames: 0,
    nextFace: 0,
    lastRenderedFace: -1,
    cycles: 0,
    spread: skyBakeSpreadEnabled,
    // Animation time the current spread cycle is rendered at. Captured on face 0
    // and reused for faces 1-5, so the six faces share one sky state instead of
    // each being a couple of frames further along than the last, which showed as
    // seams along the cube edges.
    cycleNow: 0,
  };
  function skyBakeCubeSize() {
    return getMobileProfileActive() ? SKY_BAKE_CUBE_SIZE_MOBILE : SKY_BAKE_CUBE_SIZE_DESKTOP;
  }
  function skyBakeRequested() {
    if (skyBakeRequestedOverride != null) return skyBakeRequestedOverride;
    return getMobileProfileActive() ? SKY_BAKE_MOBILE_DEFAULT : SKY_BAKE_DESKTOP_DEFAULT;
  }
  function ensureSkyBakeTarget() {
    const size = skyBakeCubeSize();
    // The device profile can flip mid-session (a resize into the mobile profile),
    // and the two profiles bake at different resolutions: rebuild on a mismatch.
    if (skyBakeState.cubeRT && skyBakeState.cubeRT.width !== size) {
      skyBakeState.cubeRT.dispose();
      skyBakeState.cubeRT = null;
      skyBakeState.cubeCam = null;
      skyBakeState.ready = false;
      skyBakeState.nextFace = 0;
      skyBakeState.lastRenderedFace = -1;
    }
    if (skyBakeState.cubeRT && skyBakeState.cubeCam) return;
    skyBakeState.cubeRT = new THREE.WebGLCubeRenderTarget(size);
    skyBakeState.cubeCam = new THREE.CubeCamera(1, 20000, skyBakeState.cubeRT);
  }
  function withSkyBakeScene(now, render) {
    domeMat.uniforms.uTime.value = now * 0.001 * SKY_ANIMATION_SPEED;
    const prevRevealVis = cityRevealSkyDome.visible;
    const prevRevealBg = cityRevealSkyScene.background;
    cityRevealSkyDome.visible = true;
    cityRevealSkyDome.position.copy(camera.position);
    cityRevealSkyScene.background = null; // dome covers all directions; avoid a flat clear tint
    syncCityRevealSkyMaterial();
    try {
      render();
    } finally {
      cityRevealSkyDome.visible = prevRevealVis;
      cityRevealSkyScene.background = prevRevealBg;
    }
  }
  function renderSkyBakeFull(now) {
    withSkyBakeScene(now, () => {
      skyBakeState.cubeCam.position.copy(camera.position);
      skyBakeState.cubeCam.update(renderer, cityRevealSkyScene);
    });
    skyBakeState.ready = true;
    skyBakeState.cycles += 1;
    skyBakeState.nextFace = 0;
    skyBakeState.lastRenderedFace = SKY_BAKE_FACE_COUNT - 1;
    scene.background = skyBakeState.cubeRT.texture;
  }
  function renderSkyBakeFace(now, faceIndex) {
    withSkyBakeScene(now, () => {
      const cubeCam = skyBakeState.cubeCam;
      const cubeRT = skyBakeState.cubeRT;
      if (!cubeCam || !cubeRT) return;
      if (cubeCam.parent === null) cubeCam.updateMatrixWorld();
      if (cubeCam.coordinateSystem !== renderer.coordinateSystem) {
        cubeCam.coordinateSystem = renderer.coordinateSystem;
        cubeCam.updateCoordinateSystem();
      }
      cubeCam.position.copy(camera.position);
      cubeCam.updateMatrixWorld(true);
      const faceCamera = cubeCam.children[faceIndex];
      if (!faceCamera) return;

      const currentRenderTarget = renderer.getRenderTarget();
      const currentActiveCubeFace = renderer.getActiveCubeFace?.() ?? 0;
      const currentActiveMipmapLevel = renderer.getActiveMipmapLevel?.() ?? 0;
      const currentXrEnabled = renderer.xr.enabled;
      const generateMipmaps = cubeRT.texture.generateMipmaps;
      const isLastFace = faceIndex === SKY_BAKE_FACE_COUNT - 1;

      renderer.xr.enabled = false;
      cubeRT.texture.generateMipmaps = isLastFace ? generateMipmaps : false;
      try {
        renderer.setRenderTarget(cubeRT, faceIndex, 0);
        renderer.render(cityRevealSkyScene, faceCamera);
      } finally {
        cubeRT.texture.generateMipmaps = generateMipmaps;
        renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);
        renderer.xr.enabled = currentXrEnabled;
      }
      cubeRT.texture.needsPMREMUpdate = true;
    });
    skyBakeState.lastRenderedFace = faceIndex;
    skyBakeState.nextFace = (faceIndex + 1) % SKY_BAKE_FACE_COUNT;
    if (faceIndex === SKY_BAKE_FACE_COUNT - 1) {
      skyBakeState.ready = true;
      skyBakeState.cycles += 1;
      scene.background = skyBakeState.cubeRT.texture;
    }
  }
  function syncSkyBakePresentation() {
    if (skyBakeState.ready) {
      domeMesh.visible = false;
      scene.background = skyBakeState.cubeRT.texture;
    } else {
      domeMesh.visible = fxEnabled('sky');
      scene.background = skyDisplayColor;
    }
  }
  // Called once per frame from the tick. steadyState = post-reveal & no reveal
  // compositing (so the reveal's own sky path is untouched).
  function syncSkyBackgroundBake(now, steadyState) {
    const enabled = Boolean(skyBakeRequested() && steadyState);
    if (enabled) {
      ensureSkyBakeTarget();
      skyBakeState.active = true;
      skyBakeState.spread = skyBakeSpreadEnabled;
      if (skyBakeSpreadEnabled) {
        const shouldRenderFace = !skyBakeState.ready || skyBakeState.frames % SKY_BAKE_FACE_STRIDE === 0;
        if (shouldRenderFace) {
          if (skyBakeState.nextFace === 0) skyBakeState.cycleNow = now;
          renderSkyBakeFace(skyBakeState.cycleNow, skyBakeState.nextFace);
        }
      } else if (skyBakeState.frames % SKY_BAKE_STRIDE === 0) {
        renderSkyBakeFull(now);
      }
      syncSkyBakePresentation();
      skyBakeState.frames += 1;
    } else if (skyBakeState.active) {
      skyBakeState.active = false;
      skyBakeState.ready = false;
      skyBakeState.frames = 0;
      skyBakeState.nextFace = 0;
      skyBakeState.lastRenderedFace = -1;
      domeMesh.visible = fxEnabled('sky');
      scene.background = skyDisplayColor;
    }
  }
  function inspectSkyBake() {
    return {
      requested: skyBakeRequested(),
      active: skyBakeState.active,
      ready: skyBakeState.ready,
      spread: skyBakeState.spread,
      cubeSize: skyBakeState.cubeRT?.width ?? skyBakeCubeSize(),
      frameStride: SKY_BAKE_STRIDE,
      faceStride: SKY_BAKE_FACE_STRIDE,
      nextFace: skyBakeState.nextFace,
      lastRenderedFace: skyBakeState.lastRenderedFace,
      frames: skyBakeState.frames,
      cycles: skyBakeState.cycles,
    };
  }

  return {
    domeGeo,
    domeMat,
    domeMesh,
    skyDisplayColor,
    syncSkyBackgroundBake,
    revealScene: cityRevealSkyScene,
    revealMat: cityRevealSkyMat,
    revealDome: cityRevealSkyDome,
    applySkyPreset,
    applySkyControlsFromUI,
    applyStormControlsFromUI,
    cityRevealSkyUsesBudgetQuality,
    syncCityRevealSkyMaterial,
    syncCityRevealSkyDome,
    renderCityRevealSkyBase,
    update,
    inspectRevealSky,
    inspectStorm,
    inspectSkyBake,
  };
}
