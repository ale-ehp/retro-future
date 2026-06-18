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
