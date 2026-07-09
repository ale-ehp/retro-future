import * as THREE from 'three';

// ---------- material texture helpers ----------
// Procedural canvas-texture factories for the road/facade/base-pad surfaces. Pure apart from one
// dep: the renderer (read for getMaxAnisotropy), taken from the world ctx. main.js calls
// initMaterialTextures(ctx) once, then builds the texture singletons (asphalt / roadMicroNormalTex /
// basePadSurfaceTex) from these.

let renderer = null;
let anisotropyCap = Infinity;
export function initMaterialTextures(ctx, { anisotropyCap: cap = Infinity } = {}) {
  renderer = ctx.renderer;
  anisotropyCap = cap;
}

// The reflective road/asphalt/base-pad textures sample at up to 16 anisotropic
// taps/pixel at grazing angle — a bandwidth cost on the fill-bound mobile floor.
// Capping to ~4 on mobile is imperceptible (sharp underfoot, slightly softer far).
function resolveAnisotropy() {
  return Math.min(anisotropyCap, renderer.capabilities.getMaxAnisotropy());
}

function setupRepeatingTexture(texture, repeatX, repeatY, color = false) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = resolveAnisotropy();
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeWetAsphaltFacadeTexture(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const grain = ((x * 73 + y * 151 + ((x * y) % 127)) % 97) / 97;
      const wave = Math.sin(x * 0.075 + y * 0.021) * 0.5 + 0.5;
      const streak = Math.pow(Math.sin(x * 0.035 + Math.sin(y * 0.017) * 1.7) * 0.5 + 0.5, 6);
      const scuff = Math.sin((x + y) * 0.045) * Math.sin(y * 0.19);
      const v = 6 + grain * 18 + wave * 10 + streak * 16 + Math.max(0, scuff) * 9;
      image.data[i] = Math.max(0, Math.min(255, v * 0.38));
      image.data[i + 1] = Math.max(0, Math.min(255, v * 0.78));
      image.data[i + 2] = Math.max(0, Math.min(255, v * 0.86 + 3));
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  return setupRepeatingTexture(tex, 8, 24, true);
}

export function makeRoadMicroNormalTexture(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n1 = Math.sin(x * 0.31 + y * 0.17) * 0.5 + 0.5;
      const n2 = Math.sin((x + y) * 0.071) * 0.5 + 0.5;
      const n3 = (((x * 73 + y * 151) % 97) / 97) * 0.5;
      const dx = (n1 - 0.5) * 34 + (n3 - 0.25) * 18;
      const dy = (n2 - 0.5) * 34 - (n3 - 0.25) * 18;
      image.data[i] = THREE.MathUtils.clamp(128 + dx, 0, 255);
      image.data[i + 1] = THREE.MathUtils.clamp(128 + dy, 0, 255);
      image.data[i + 2] = 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(18, 42);
  tex.anisotropy = resolveAnisotropy();
  return tex;
}

export function makeBasePadSurfaceTexture(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      const waveA = Math.sin((nx + ny) * Math.PI * 2) * 0.5 + 0.5;
      const waveB = Math.sin((nx * 2 + 0.17) * Math.PI * 2) * Math.cos((ny * 2 + 0.31) * Math.PI * 2) * 0.5 + 0.5;
      const waveC = Math.sin((nx * 5 + ny * 4) * Math.PI * 2) * 0.5 + 0.5;
      const grain = (((x * 73 + y * 151) % 97) / 97 - 0.5) * 5;
      const sheen = Math.pow(waveA, 5) * 26;
      const value = (waveB - 0.5) * 14 + (waveC - 0.5) * 5 + grain + sheen;
      const i = (y * size + x) * 4;
      image.data[i] = THREE.MathUtils.clamp(64 + value * 0.52, 20, 142);
      image.data[i + 1] = THREE.MathUtils.clamp(86 + value * 0.76, 26, 162);
      image.data[i + 2] = THREE.MathUtils.clamp(92 + value * 0.86, 30, 176);
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = resolveAnisotropy();
  tex.needsUpdate = true;
  return tex;
}
