// ---------- hex-tile geometry foundation ----------
// The hexagonal road-tile primitives: dimensions, the shared cylinder geometry, the row/column pitch
// helpers, and roadTileTopY/sidewalkMinSurfaceY — the road/sidewalk surface heights that ~23
// call-sites across movement, walk-surface, collision, the runner crowd, city-reveal, base-pad and
// the boundary-error module all read. Extracted in A3e-1 as the import surface the rest of the
// hex-tile system (render/sync, creation, per-frame depression) will be carved onto next.
// Self-contained (THREE only). hexTileScale/hexTileHeightScale/hexTileGap are UI-tunable: kept
// module-private behind get*/set* (main's applyLiveControls calls the setters; external readers call
// the getters); roadTileTopY reads hexTileHeightScale directly since it lives here.

import * as THREE from 'three';
import { getReflectionEnvMap, getRoadReflectionEnvMap } from '../engine/reflection-env.js';
import { makeRoadMicroNormalTexture } from './material-textures.js';

export const hexTileRadius = 1.18 * 3 * 2;
export const hexTileHeight = 0.18 * 3;
const HEX_GAP_MIN = -8;
let hexTileGap = 0;
let hexTileHeightScale = 1;
let hexTileScale = 1;
const SIDEWALK_CURB_REVEAL = 0.14;

export function hexTileRowStep(gap = hexTileGap) {
  return Math.sqrt(3) * hexTileRadius + gap;
}
export function hexTileColumnStep(gap = hexTileGap) {
  return hexTileRowStep(gap) * Math.sqrt(3) / 2;
}
export const hexTileSeedXStep = hexTileColumnStep(HEX_GAP_MIN);
export const hexTileSeedZStep = hexTileRowStep(HEX_GAP_MIN);

function removeIndexedMaterialGroup(geometry, materialIndexToRemove) {
  if (!geometry?.index || !geometry.groups?.length) return geometry;
  const source = geometry.index.array;
  const groups = geometry.groups.slice();
  const nextIndex = [];
  let nextStart = 0;
  geometry.clearGroups();
  for (const group of groups) {
    if (group.materialIndex === materialIndexToRemove) continue;
    for (let i = group.start; i < group.start + group.count; i += 1) {
      nextIndex.push(source[i]);
    }
    geometry.addGroup(nextStart, group.count, group.materialIndex);
    nextStart += group.count;
  }
  geometry.setIndex(new THREE.BufferAttribute(new source.constructor(nextIndex), 1));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export const hexTileGeo = new THREE.CylinderGeometry(hexTileRadius, hexTileRadius, hexTileHeight, 6, 1, false);
hexTileGeo.rotateY(Math.PI / 6);
removeIndexedMaterialGroup(hexTileGeo, 2);

export function roadTileTopY() {
  const maxRoadTileBaseY = 0.03;
  return maxRoadTileBaseY + (hexTileHeight * hexTileHeightScale * 0.5);
}

export function sidewalkMinSurfaceY() {
  return roadTileTopY() + SIDEWALK_CURB_REVEAL;
}

export function getHexTileScale() { return hexTileScale; }
export function getHexTileHeightScale() { return hexTileHeightScale; }
export function setHexTileScale(v) { hexTileScale = v; }
export function setHexTileHeightScale(v) { hexTileHeightScale = v; }
export function setHexTileGap(v) { hexTileGap = v; }

// ---------- hex-tile display colors (A3e-2a) ----------
// hexTileBaseColor/hexTileActiveColor are immutable tuning seeds (read by main's scene-control
// tunedColor + the hex material ctor). hexTileDisplayBaseColor/hexTileDisplayActiveColor are the LIVE
// tuning targets: main's lighting applier .copy()s into them every frame and reads them back the same
// frame, so they are exported BY REFERENCE (one shared mutable Color each — a clone would silently
// freeze road tuning). player/basePad colors are read only by setHexTileDisplayColor (module-private).
export const hexTileBaseColor = new THREE.Color(0x071116);
export const hexTileActiveColor = new THREE.Color(0x15343b);
const hexTilePlayerLightColor = new THREE.Color(0x4bdde6);
const hexTileBasePadColor = new THREE.Color(0x6d7e84);
export const hexTileDisplayBaseColor = hexTileBaseColor.clone();
export const hexTileDisplayActiveColor = hexTileActiveColor.clone();

// Pure color compositor: writes the resolved tile colour into the caller-provided target (the caller
// owns the scratch); reads only the hex colours above.
export function setHexTileDisplayColor(target, hitLight = 0, playerLight = 0, basePadLight = 0) {
  const padAmount = THREE.MathUtils.clamp(basePadLight, 0, 1);
  if (padAmount > 0.001) {
    target.copy(hexTileBasePadColor);
  } else {
    target.copy(hexTileDisplayBaseColor);
  }
  target
    .lerp(hexTileDisplayActiveColor, THREE.MathUtils.clamp(hitLight, 0, 1))
    .lerp(hexTilePlayerLightColor, THREE.MathUtils.clamp(playerLight, 0, 1));
  target.multiplyScalar(
    1 +
    padAmount * 0.34 +
    THREE.MathUtils.clamp(hitLight, 0, 1) * 0.65 +
    THREE.MathUtils.clamp(playerLight, 0, 1) * 0.9
  );
  return target;
}

// ---------- hex-tile materials (A3e-2b) ----------
// Material objects are live exported bindings: main and batch builders read the same objects after
// initHexTileMaterials() runs during main's original material setup phase. roadMicroNormalTex is shared
// with base-pad material controls, so it is exported as the exact texture instance created here.
export let roadMicroNormalTex = null;
export let hexTileMat = null;
export let streetEdgeHexMat = null;

export function configureHexRoadMaterial(material) {
  if (material.userData.hexRoadConfigured) return material;
  material.userData.hexRoadConfigured = true;
  material.userData.hexInstanceGlow = material.userData.hexInstanceGlow ?? 2.2;
  material.userData.hexGlowBaseColor = material.userData.hexGlowBaseColor?.isColor
    ? material.userData.hexGlowBaseColor
    : hexTileDisplayBaseColor.clone();
  material.onBeforeCompile = (shader) => {
    shader.uniforms.hexInstanceGlow = { value: material.userData.hexInstanceGlow };
    shader.uniforms.hexGlowBaseColor = { value: material.userData.hexGlowBaseColor };
    material.userData.hexInstanceGlowUniform = shader.uniforms.hexInstanceGlow;
    material.userData.hexGlowBaseColorUniform = shader.uniforms.hexGlowBaseColor;
    shader.fragmentShader = `uniform float hexInstanceGlow;\nuniform vec3 hexGlowBaseColor;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
#ifdef USE_COLOR
  vec3 hexInstanceGlowColor = max(vColor.rgb - hexGlowBaseColor, vec3(0.0));
  totalEmissiveRadiance += hexInstanceGlowColor * hexInstanceGlow;
#endif`
    );
  };
  material.customProgramCacheKey = () => 'hex-road-instance-glow-v1';
  material.needsUpdate = true;
  return material;
}

export function setHexRoadMaterialGlow(material, glowStrength, baseColor) {
  configureHexRoadMaterial(material);
  material.userData.hexInstanceGlow = glowStrength;
  if (!material.userData.hexGlowBaseColor?.isColor) material.userData.hexGlowBaseColor = new THREE.Color();
  material.userData.hexGlowBaseColor.copy(baseColor);
  if (material.userData.hexInstanceGlowUniform) material.userData.hexInstanceGlowUniform.value = glowStrength;
  if (material.userData.hexGlowBaseColorUniform) material.userData.hexGlowBaseColorUniform.value.copy(baseColor);
}

export function initHexTileMaterials() {
  if (hexTileMat) return;
  roadMicroNormalTex = makeRoadMicroNormalTexture();
  hexTileMat = new THREE.MeshStandardMaterial({
    color: hexTileBaseColor,
    metalness: 0.88,
    roughness: 0.16,
    envMap: getRoadReflectionEnvMap(),
    envMapIntensity: 1.15,
    normalMap: roadMicroNormalTex,
    normalScale: new THREE.Vector2(0, 0),
    emissive: 0x061419,
    emissiveIntensity: 0.18,
  });
  configureHexRoadMaterial(hexTileMat);
  streetEdgeHexMat = new THREE.MeshStandardMaterial({
    color: 0x2a6371,
    metalness: 0.58,
    roughness: 0.28,
    envMap: getReflectionEnvMap(),
    envMapIntensity: 0.88,
    emissive: 0x061a20,
    emissiveIntensity: 0.12,
  });
}
