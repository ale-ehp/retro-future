import * as THREE from 'three';
import { fxEnabled } from '../engine/fx-debug-toggles.js';
import { MAIN_ROAD_Z } from './boulevard-constants.js';

const CINEMATIC_ATMOSPHERE_TRUEY = new Set(['1', 'true', 'on', 'yes']);
const CINEMATIC_ATMOSPHERE_DESKTOP_PROFILE = Object.freeze({
  enabled: true,
  profile: 'desktop',
  fogColor: 0x0a2730,
  fogDensity: 0.00075,
  hazeColor: 0x72dce8,
  hazeOpacity: 0.24,
  shaftsEnabled: true,
  shaftColor: 0xc8fbff,
  shaftOpacity: 0.34,
  drawCallBudget: 3,
});
const CINEMATIC_ATMOSPHERE_MOBILE_PROFILE = Object.freeze({
  enabled: true,
  profile: 'mobile',
  fogColor: 0x0a2730,
  fogDensity: 0.00032,
  hazeColor: 0x72dce8,
  hazeOpacity: 0.12,
  shaftsEnabled: false,
  shaftColor: 0xc8fbff,
  shaftOpacity: 0,
  drawCallBudget: 1,
});

export function cinematicAtmosphereSettingsFromParams(params, { mobile = false } = {}) {
  const profile = mobile
    ? CINEMATIC_ATMOSPHERE_MOBILE_PROFILE
    : CINEMATIC_ATMOSPHERE_DESKTOP_PROFILE;
  const explicit = params?.get?.('cinematicAtmosphere') ?? params?.get?.('atmosphere.cinematic');
  const atmosphere = String(params?.get?.('atmosphere') || '').trim().toLowerCase();
  const enabled = explicit != null
    ? CINEMATIC_ATMOSPHERE_TRUEY.has(String(explicit).trim().toLowerCase())
    : atmosphere === 'cinematic';
  return { ...profile, enabled };
}

const CINEMATIC_HAZE_WIDTH = 1800;
const CINEMATIC_HAZE_DEPTH = 1500;
const CINEMATIC_HAZE_Y = 2.25;
const CINEMATIC_SHAFT_LAYOUT = Object.freeze([
  Object.freeze({ x: -55, y: 110, z: 280, width: 130, height: 280 }),
  Object.freeze({ x: 68, y: 126, z: 190, width: 98, height: 318 }),
]);

function createCinematicHazeMaterial(settings) {
  return new THREE.ShaderMaterial({
    name: 'cinematic-atmosphere-haze-material',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(settings.hazeColor) },
      uOpacity: { value: settings.hazeOpacity },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;

      void main() {
        vec2 centered = abs(vUv - 0.5) * 2.0;
        float edge = (1.0 - smoothstep(0.68, 1.0, centered.x))
          * (1.0 - smoothstep(0.62, 1.0, centered.y));
        float driftA = sin(vUv.x * 20.0 + uTime * 0.16 + sin(vUv.y * 9.0));
        float driftB = sin(vUv.y * 15.0 - uTime * 0.11 + sin(vUv.x * 7.0));
        float veil = 0.72 + 0.14 * driftA + 0.14 * driftB;
        float alpha = uOpacity * edge * clamp(veil, 0.42, 1.0);
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
}

function createCinematicShaftMaterial(settings) {
  return new THREE.ShaderMaterial({
    name: 'cinematic-atmosphere-shaft-material',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(settings.shaftColor) },
      uOpacity: { value: settings.shaftOpacity },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;

      void main() {
        float horizontal = abs(vUv.x - 0.5) * 2.0;
        float coneWidth = mix(0.22, 0.92, vUv.y);
        float cone = 1.0 - smoothstep(coneWidth * 0.34, coneWidth, horizontal);
        float vertical = smoothstep(0.0, 0.12, vUv.y)
          * (1.0 - smoothstep(0.70, 1.0, vUv.y));
        float breathe = 0.90 + 0.10 * sin(uTime * 0.24 + vUv.y * 8.0);
        float alpha = uOpacity * cone * vertical * breathe;
        gl_FragColor = vec4(uColor * (0.72 + cone * 0.28), alpha);
      }
    `,
  });
}

export function createCinematicAtmosphere({ scene, camera, settings }) {
  if (!scene || !camera) throw new Error('Cinematic atmosphere requires scene and camera');
  const resolved = settings || { ...CINEMATIC_ATMOSPHERE_DESKTOP_PROFILE, enabled: false };
  const priorFog = scene.fog;
  let active = false;
  let disposed = false;

  if (!resolved.enabled) {
    return {
      update() {},
      inspect: () => ({
        ...resolved,
        active: false,
        fogApplied: false,
        hazeVisible: false,
        shaftCount: 0,
        drawCalls: 0,
      }),
      dispose() {},
    };
  }

  const fog = new THREE.FogExp2(resolved.fogColor, resolved.fogDensity);
  const group = new THREE.Group();
  group.name = 'cinematic-atmosphere';
  group.visible = false;

  const hazeGeometry = new THREE.PlaneGeometry(CINEMATIC_HAZE_WIDTH, CINEMATIC_HAZE_DEPTH);
  const hazeMaterial = createCinematicHazeMaterial(resolved);
  const haze = new THREE.Mesh(hazeGeometry, hazeMaterial);
  haze.name = 'cinematic-atmosphere-road-haze';
  haze.rotation.x = -Math.PI / 2;
  haze.position.set(0, CINEMATIC_HAZE_Y, MAIN_ROAD_Z);
  haze.frustumCulled = false;
  haze.renderOrder = 16;
  group.add(haze);

  let shaftGeometry = null;
  let shaftMaterial = null;
  const shafts = [];
  if (resolved.shaftsEnabled) {
    shaftGeometry = new THREE.PlaneGeometry(1, 1);
    shaftMaterial = createCinematicShaftMaterial(resolved);
    CINEMATIC_SHAFT_LAYOUT.forEach((layout, index) => {
      const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
      shaft.name = `cinematic-atmosphere-shaft-${index + 1}`;
      shaft.position.set(layout.x, layout.y, layout.z);
      shaft.scale.set(layout.width, layout.height, 1);
      shaft.frustumCulled = false;
      shaft.renderOrder = 17;
      shafts.push(shaft);
      group.add(shaft);
    });
  }
  scene.add(group);

  function inspect() {
    return {
      ...resolved,
      active,
      fogApplied: scene.fog === fog,
      hazeVisible: Boolean(active && haze.visible),
      shaftCount: shafts.length,
      drawCalls: active ? 1 + shafts.length : 0,
    };
  }

  function update(visible, timeSeconds = 0) {
    if (disposed) return;
    const nextActive = Boolean(visible && resolved.enabled);
    active = nextActive;
    group.visible = nextActive;
    if (!nextActive) {
      if (scene.fog === fog) scene.fog = priorFog;
      return;
    }

    scene.fog = fog;
    hazeMaterial.uniforms.uTime.value = timeSeconds;
    if (shaftMaterial) shaftMaterial.uniforms.uTime.value = timeSeconds;
    for (const shaft of shafts) {
      shaft.rotation.y = Math.atan2(
        camera.position.x - shaft.position.x,
        camera.position.z - shaft.position.z,
      );
    }
  }

  function dispose() {
    if (disposed) return;
    if (scene.fog === fog) scene.fog = priorFog;
    scene.remove(group);
    hazeGeometry.dispose();
    hazeMaterial.dispose();
    shaftGeometry?.dispose();
    shaftMaterial?.dispose();
    disposed = true;
    active = false;
  }

  return { update, inspect, dispose };
}

// ---------- Atmospheric particles: dust/embers drifting in the boulevard fog ----------
// A camera-anchored additive point cloud that drifts and wraps inside a box around the camera, fading
// at the box edges so the wrap is invisible. Built once (init), then the tick loop toggles visibility
// (post city-reveal) and advances the time uniform via updateAtmosphereParticles(). Injected deps:
// getScene() for parenting and the cyan palette color (scalar).

let deps = null;
const ATMOSPHERE_PARTICLE_COUNT = 400;
const ATMOSPHERE_PARTICLE_BOX = new THREE.Vector3(240, 95, 240);
let atmosphereParticles = null;
let atmosphereParticleTimeUniform = null;

function buildAtmosphereParticles() {
  if (atmosphereParticles) return;
  const positions = new Float32Array(ATMOSPHERE_PARTICLE_COUNT * 3);
  const seeds = new Float32Array(ATMOSPHERE_PARTICLE_COUNT);
  for (let i = 0; i < ATMOSPHERE_PARTICLE_COUNT; i += 1) {
    positions[i * 3] = Math.random() * ATMOSPHERE_PARTICLE_BOX.x;
    positions[i * 3 + 1] = Math.random() * ATMOSPHERE_PARTICLE_BOX.y;
    positions[i * 3 + 2] = Math.random() * ATMOSPHERE_PARTICLE_BOX.z;
    seeds[i] = Math.random() * 6.2831853;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9); // never frustum-culled (camera-anchored)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uBox: { value: ATMOSPHERE_PARTICLE_BOX },
      uColor: { value: new THREE.Color(deps.cyan) },
      uSize: { value: 2.4 },
      uOpacity: { value: 0.35 },
    },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      uniform vec3 uBox;
      uniform float uSize;
      varying float vFade;
      void main() {
        vec3 drift = vec3(sin(uTime * 0.12 + aSeed) * 4.0, uTime * 2.2, cos(uTime * 0.1 + aSeed * 1.7) * 4.0);
        vec3 cell = cameraPosition - uBox * 0.5;
        vec3 p = cell + mod(position + drift - cell, uBox);
        // fade toward the edges of the camera box so wrapping isn't visible, and with height
        vec3 d = abs(p - cameraPosition) / (uBox * 0.5);
        float edge = (1.0 - smoothstep(0.7, 1.0, d.x)) * (1.0 - smoothstep(0.7, 1.0, d.z)) * (1.0 - smoothstep(0.6, 1.0, d.y));
        vFade = edge;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (220.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vFade;
      void main() {
        float dist = length(gl_PointCoord - 0.5);
        if (dist > 0.5) discard;
        float a = smoothstep(0.5, 0.0, dist) * vFade * uOpacity;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  });
  atmosphereParticles = new THREE.Points(geometry, material);
  atmosphereParticles.name = 'atmosphere-fog-particles';
  atmosphereParticles.frustumCulled = false;
  atmosphereParticles.renderOrder = 22;
  atmosphereParticles.visible = false;
  atmosphereParticleTimeUniform = material.uniforms.uTime;
  deps.getScene().add(atmosphereParticles);
}

export function initAtmosphereParticles(injected) {
  deps = injected;
  buildAtmosphereParticles();
}

export function updateAtmosphereParticles(visible, timeSeconds) {
  if (!atmosphereParticles) return;
  atmosphereParticles.visible = visible && fxEnabled('particles');
  if (atmosphereParticleTimeUniform) atmosphereParticleTimeUniform.value = timeSeconds;
}
