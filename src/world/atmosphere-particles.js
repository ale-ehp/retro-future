import * as THREE from 'three';
import { fxEnabled } from '../engine/fx-debug-toggles.js';

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
