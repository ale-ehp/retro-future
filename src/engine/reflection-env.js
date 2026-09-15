import * as THREE from 'three';

// ---------- Reflection environment maps ----------
// Procedural equirectangular reflection maps baked once (sky gradient + building silhouettes drawn on a
// 2D canvas), then PMREM-prefiltered into env targets at several "building reflection" levels. main.js
// calls initReflectionEnv(ctx) once, reads the base map via getReflectionEnvMap(), and picks a
// road-level map via getRoadReflectionEnvMap(). The mutable road reflection level is owned here and
// updated from the live controls via setRoadBuildingReflection(). bakeTronReflectionMap is pure/private.

let renderer = null;
let reflectionEnvMap = null;
let roadReflectionEnvTargets = null; // Map<level, WebGLRenderTarget>, filled lazily
const ROAD_BUILDING_REFLECTION_LEVELS = [0, 0.2, 0.35, 0.5, 0.7, 1];
let roadBuildingReflection = 0.35;

function bakeTronReflectionMap(width = 512, height = 256, buildingReflection = 1) {
  const buildingAlpha = THREE.MathUtils.clamp(buildingReflection, 0, 1);
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#01070a');
  sky.addColorStop(0.43, '#03161c');
  sky.addColorStop(0.50, '#03181d');
  sky.addColorStop(0.56, '#03161c');
  sky.addColorStop(1, '#01070a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const horizonY = Math.round(height * 0.5);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 42; i++) {
    const x = Math.round((i / 42) * width);
    const w = 8 + ((i * 37) % 24);
    const h = 28 + ((i * 53) % 96);
    if (buildingAlpha > 0.001) {
      ctx.fillStyle = `rgba(0, 8, 12, ${0.92 * buildingAlpha})`;
      ctx.fillRect(x, horizonY - h, w, h);
    }
    ctx.fillStyle = 'rgba(90, 245, 255, 0.42)';
    ctx.fillRect(x + w * 0.18, horizonY - h + 6, 2, h - 10);
    ctx.fillRect(x + w * 0.72, horizonY - h + 14, 2, h - 22);
  }
  ctx.fillStyle = 'rgba(50, 210, 230, 0.16)';
  for (let y = horizonY + 8; y < height * 0.88; y += 18) {
    ctx.fillRect(0, y, width, 1);
  }
  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// One PMREM prefilter per level used to run at boot for all six road variants,
// even though only one is bound at a time (the level comes from a control that
// defaults to 0.35). That is six canvas rasterizations plus six GPU prefilter
// chains added to the boot path, and six cube maps resident for the session.
// Bake on demand instead and keep what has been asked for: switching level costs
// a few ms once, on a slider move, instead of every start-up paying for all six.
function makeReflectionEnvTarget(width, height, buildingReflection) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const reflectionTex = bakeTronReflectionMap(width, height, buildingReflection);
  const target = pmrem.fromEquirectangular(reflectionTex);
  reflectionTex.dispose();
  pmrem.dispose();
  return target;
}

export function initReflectionEnv(ctx) {
  renderer = ctx.renderer;
  const envTarget = makeReflectionEnvTarget(512, 256, 1);
  reflectionEnvMap = envTarget.texture;
  roadReflectionEnvTargets = new Map();
}

export function getReflectionEnvMap() {
  return reflectionEnvMap;
}

function closestRoadReflectionLevel(buildingReflection) {
  let closest = ROAD_BUILDING_REFLECTION_LEVELS[0];
  let closestDistance = Math.abs(buildingReflection - closest);
  for (const level of ROAD_BUILDING_REFLECTION_LEVELS) {
    const distance = Math.abs(buildingReflection - level);
    if (distance < closestDistance) {
      closest = level;
      closestDistance = distance;
    }
  }
  return closest;
}

function getRoadReflectionEnvEntry(buildingReflection = roadBuildingReflection) {
  const level = closestRoadReflectionLevel(buildingReflection);
  let target = roadReflectionEnvTargets.get(level);
  if (!target) {
    target = makeReflectionEnvTarget(256, 128, level);
    roadReflectionEnvTargets.set(level, target);
  }
  return { level, target };
}

export function getRoadReflectionEnvMap(buildingReflection = roadBuildingReflection) {
  return getRoadReflectionEnvEntry(buildingReflection).target.texture;
}

export function setRoadBuildingReflection(value) {
  roadBuildingReflection = value;
}
