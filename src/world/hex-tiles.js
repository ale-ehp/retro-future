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
import { fxEnabled } from '../engine/fx-debug-toggles.js';
import { HEX_ROAD_UPDATE_FRAME_STRIDE, MAX_HEX_ROAD_ACCUMULATED_DT } from './config.js';
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

// Lite-reflection floor (mobile fill lever): drops the per-pixel envMap sample
// and fakes the wet sheen with a cheap Schlick grazing-angle fresnel toward a
// dark cyan — added alongside the existing per-tile glow.
const HEX_FLOOR_SHEEN_COLOR = new THREE.Color(0x123f49);
const HEX_FLOOR_SHEEN_STRENGTH = 0.9;
let hexFloorReflectLite = false;

export function configureHexRoadMaterial(material) {
  if (material.userData.hexRoadConfigured) return material;
  material.userData.hexRoadConfigured = true;
  material.userData.hexInstanceGlow = material.userData.hexInstanceGlow ?? 2.2;
  material.userData.hexGlowBaseColor = material.userData.hexGlowBaseColor?.isColor
    ? material.userData.hexGlowBaseColor
    : hexTileDisplayBaseColor.clone();
  const lite = hexFloorReflectLite;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.hexInstanceGlow = { value: material.userData.hexInstanceGlow };
    shader.uniforms.hexGlowBaseColor = { value: material.userData.hexGlowBaseColor };
    material.userData.hexInstanceGlowUniform = shader.uniforms.hexInstanceGlow;
    material.userData.hexGlowBaseColorUniform = shader.uniforms.hexGlowBaseColor;
    let prelude = 'uniform float hexInstanceGlow;\nuniform vec3 hexGlowBaseColor;\n';
    let inject = `#include <emissivemap_fragment>
#ifdef USE_COLOR
  vec3 hexInstanceGlowColor = max(vColor.rgb - hexGlowBaseColor, vec3(0.0));
  totalEmissiveRadiance += hexInstanceGlowColor * hexInstanceGlow;
#endif`;
    if (lite && fxEnabled('floorSheen')) {
      shader.uniforms.hexFloorSheenColor = { value: HEX_FLOOR_SHEEN_COLOR };
      shader.uniforms.hexFloorSheenStrength = { value: HEX_FLOOR_SHEEN_STRENGTH };
      prelude += 'uniform vec3 hexFloorSheenColor;\nuniform float hexFloorSheenStrength;\n';
      inject += `
  float hexFloorFres = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 5.0);
  totalEmissiveRadiance += hexFloorSheenColor * hexFloorFres * hexFloorSheenStrength;`;
    }
    shader.fragmentShader = prelude + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', inject);
  };
  material.customProgramCacheKey = () => (lite ? 'hex-road-instance-glow-lite-v1' : 'hex-road-instance-glow-v1');
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

export function initHexTileMaterials({ dropNormalMap = false, liteReflect = false } = {}) {
  if (hexTileMat) return;
  hexFloorReflectLite = liteReflect;
  roadMicroNormalTex = makeRoadMicroNormalTexture();
  const hexProps = {
    color: hexTileBaseColor,
    // Without the envMap the floor loses its metal reflection, so drop metalness
    // and raise roughness (mobile lite) to keep it lit by the scene instead of
    // going black; the fresnel sheen + per-tile glow carry the wet Tron look.
    metalness: liteReflect ? 0.32 : 0.88,
    roughness: liteReflect ? 0.5 : 0.16,
    normalMap: roadMicroNormalTex,
    normalScale: new THREE.Vector2(0, 0),
    emissive: 0x061419,
    emissiveIntensity: 0.18,
  };
  if (!liteReflect) {
    hexProps.envMap = getRoadReflectionEnvMap();
    hexProps.envMapIntensity = 1.15;
  }
  hexTileMat = new THREE.MeshStandardMaterial(hexProps);
  // The road normalMap is sampled + perturbed per floor pixel for ZERO visual
  // effect (normalScale is (0,0), road-normal control defaults to 0 with no UI).
  // Dropping it removes a per-pixel fetch on the largest surface, pixel-identically.
  if (dropNormalMap || liteReflect) {
    hexTileMat.normalMap = null;
    hexTileMat.needsUpdate = true;
  }
  configureHexRoadMaterial(hexTileMat);
  streetEdgeHexMat = new THREE.MeshStandardMaterial({
    color: 0x2a6371,
    metalness: liteReflect ? 0.3 : 0.58,
    roughness: liteReflect ? 0.5 : 0.28,
    envMap: liteReflect ? null : getReflectionEnvMap(),
    envMapIntensity: 0.88,
    emissive: 0x061a20,
    emissiveIntensity: 0.12,
  });
}

// ---------- hex-tile sync + dirty batch uploads (A3e-2c) ----------
// Instance-matrix/color upload batching owns its scratch objects and dirty-map here. The base-pad overlay
// remains in main/buildings for now, so syncHexTileInstance reads it through a getter until A2/A3e-3 move
// that ownership boundary.
export const HEX_ROAD_EMPTY_BATCH_CULLING_ENABLED = true;
export const HEX_ROAD_UPLOAD_BATCH_LIMIT = 10;
export const HEX_ROAD_LOD_ENABLED = true;
export const HEX_ROAD_LOD_DESKTOP_NEAR_DISTANCE = 520;
export const HEX_ROAD_LOD_DESKTOP_HYSTERESIS = 120;
export const HEX_ROAD_LOD_MOBILE_NEAR_DISTANCE = 320;
export const HEX_ROAD_LOD_MOBILE_HYSTERESIS = 80;
export const HEX_ROAD_LOD_NEAR_DISTANCE = HEX_ROAD_LOD_DESKTOP_NEAR_DISTANCE;
export const HEX_ROAD_LOD_HYSTERESIS = HEX_ROAD_LOD_DESKTOP_HYSTERESIS;
export const HEX_ROAD_TRIANGLES_PER_INSTANCE = Math.round(
  (hexTileGeo.index?.count ?? hexTileGeo.attributes.position.count) / 3
);
const streetEdgeHexInstanceColor = new THREE.Color(0x2a6371);
const hexTileInstanceMatrix = new THREE.Matrix4();
const hexTileInstancePosition = new THREE.Vector3();
const hexTileInstanceQuaternion = new THREE.Quaternion();
const hexTileInstanceScale = new THREE.Vector3();
const hexTileInstanceColor = new THREE.Color();
const dirtyHexTileBatches = new Map();
export const hexRoadRuntimeStats = {
  lastCandidateCount: 0,
  lastDirtyUploadCount: 0,
  pendingDirtyBatches: 0,
  uploadDeferredFrames: 0,
  lodEnabled: HEX_ROAD_LOD_ENABLED,
  lodNearDistance: HEX_ROAD_LOD_NEAR_DISTANCE,
  lodHysteresis: HEX_ROAD_LOD_HYSTERESIS,
  lodMobileProfile: false,
  lodVisibleBatches: 0,
  lodHiddenBatches: 0,
  lodVisibleInstances: 0,
  lodHiddenInstances: 0,
  lodSavedTriangles: 0,
};

const hexTileSyncDeps = {
  refreshCullingBounds: () => {},
};

const hexRoadLodSettings = {
  enabled: HEX_ROAD_LOD_ENABLED,
  nearDistance: HEX_ROAD_LOD_NEAR_DISTANCE,
  hysteresis: HEX_ROAD_LOD_HYSTERESIS,
  mobile: false,
};

export function hexRoadLodSettingsForProfile({ mobile = false } = {}) {
  return {
    enabled: HEX_ROAD_LOD_ENABLED,
    nearDistance: mobile ? HEX_ROAD_LOD_MOBILE_NEAR_DISTANCE : HEX_ROAD_LOD_DESKTOP_NEAR_DISTANCE,
    hysteresis: mobile ? HEX_ROAD_LOD_MOBILE_HYSTERESIS : HEX_ROAD_LOD_DESKTOP_HYSTERESIS,
    mobile,
  };
}

export function setHexRoadLodProfile(profile = {}) {
  // Called once per frame with the live mobile flag, which changes only when the
  // device profile flips: bail out before allocating the settings object and the
  // returned copy (the per-frame caller ignores it anyway).
  const mobile = Boolean(profile.mobile);
  if (hexRoadLodSettings.enabled === HEX_ROAD_LOD_ENABLED && hexRoadLodSettings.mobile === mobile) {
    return hexRoadLodSettings;
  }
  const next = hexRoadLodSettingsForProfile(profile);
  hexRoadLodSettings.enabled = next.enabled;
  hexRoadLodSettings.nearDistance = next.nearDistance;
  hexRoadLodSettings.hysteresis = next.hysteresis;
  hexRoadLodSettings.mobile = next.mobile;
  return hexRoadLodSettings;
}

export function initHexTileSync(deps) {
  hexTileSyncDeps.refreshCullingBounds = deps.refreshCullingBounds;
}

function markHexTileBatchDirty(batch, colorChanged = false) {
  dirtyHexTileBatches.set(batch, Boolean(dirtyHexTileBatches.get(batch) || colorChanged));
}

// Past this many pending ranges a merged partial upload stops paying for itself:
// collapse to one whole-buffer range (mass passes like compaction/layout hit this
// immediately, keeping their upload identical to the pre-range behaviour).
const HEX_TILE_MAX_UPDATE_RANGES = 512;

function addHexInstanceUpdateRange(attribute, start, count) {
  const ranges = attribute.updateRanges;
  const total = attribute.array.length;
  if (ranges.length === 1 && ranges[0].start === 0 && ranges[0].count >= total) return;
  if (ranges.length >= HEX_TILE_MAX_UPDATE_RANGES) {
    attribute.clearUpdateRanges();
    attribute.addUpdateRange(0, total);
    return;
  }
  attribute.addUpdateRange(start, count);
}

export function getDirtyHexTileBatchCount() {
  return dirtyHexTileBatches.size;
}

function syncHexTileBatchVisibility(batchRecord) {
  if (!batchRecord?.mesh) return;
  const renderVisible = batchRecord.renderVisible !== false;
  const lodVisible = batchRecord.lodVisible !== false;
  batchRecord.mesh.visible = renderVisible && lodVisible && fxEnabled('hexFloor');
}

export function refreshHexRoadBatchBounds(batchRecord) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const tile of batchRecord.tiles) {
    if (tile.visible === false || tile.userData.visible === false) continue;
    minX = Math.min(minX, tile.userData.x - hexTileRadius);
    maxX = Math.max(maxX, tile.userData.x + hexTileRadius);
    minZ = Math.min(minZ, tile.userData.z - hexTileRadius);
    maxZ = Math.max(maxZ, tile.userData.z + hexTileRadius);
  }
  if (minX === Infinity) {
    batchRecord.bounds = null;
    return null;
  }
  batchRecord.bounds = {
    minX,
    maxX,
    minZ,
    maxZ,
    centerX: (minX + maxX) * 0.5,
    centerZ: (minZ + maxZ) * 0.5,
  };
  return batchRecord.bounds;
}

export function hexRoadBatchDistanceSqToPoint(batchRecord, x, z) {
  const bounds = batchRecord?.bounds;
  if (!bounds) return Number.POSITIVE_INFINITY;
  const dx = x < bounds.minX ? bounds.minX - x : x > bounds.maxX ? x - bounds.maxX : 0;
  const dz = z < bounds.minZ ? bounds.minZ - z : z > bounds.maxZ ? z - bounds.maxZ : 0;
  return dx * dx + dz * dz;
}

export function resolveHexRoadBatchLodVisible(
  distanceSq,
  currentlyVisible,
  nearDistance = HEX_ROAD_LOD_NEAR_DISTANCE,
  hysteresis = HEX_ROAD_LOD_HYSTERESIS
) {
  const distance = Number.isFinite(distanceSq) ? distanceSq : Number.POSITIVE_INFINITY;
  const threshold = (currentlyVisible ? nearDistance + hysteresis : nearDistance);
  return distance <= threshold * threshold;
}

const hexRoadBatchLodStatsScratch = {
  enabled: false,
  nearDistance: 0,
  hysteresis: 0,
  visibleBatches: 0,
  hiddenBatches: 0,
  visibleInstances: 0,
  hiddenInstances: 0,
  savedTriangles: 0,
};

export function applyHexRoadBatchLodVisibility(batchRecords, {
  x,
  z,
  enabled = hexRoadLodSettings.enabled,
  nearDistance = hexRoadLodSettings.nearDistance,
  hysteresis = hexRoadLodSettings.hysteresis,
  trianglesPerInstance = HEX_ROAD_TRIANGLES_PER_INSTANCE,
} = {}) {
  // Reused across frames: the values are copied into hexRoadRuntimeStats by the
  // caller, so a fresh object per frame was pure garbage in the render loop.
  const stats = hexRoadBatchLodStatsScratch;
  stats.enabled = enabled;
  stats.nearDistance = nearDistance;
  stats.hysteresis = hysteresis;
  stats.visibleBatches = 0;
  stats.hiddenBatches = 0;
  stats.visibleInstances = 0;
  stats.hiddenInstances = 0;
  stats.savedTriangles = 0;
  for (const record of batchRecords) {
    const count = record.mesh?.count ?? 0;
    if (!enabled) {
      record.lodVisible = true;
    } else {
      const distanceSq = hexRoadBatchDistanceSqToPoint(record, x, z);
      record.lodVisible = resolveHexRoadBatchLodVisible(distanceSq, record.lodVisible !== false, nearDistance, hysteresis);
    }
    syncHexTileBatchVisibility(record);

    if (record.renderVisible === false || count <= 0) continue;
    if (record.lodVisible === false) {
      stats.hiddenBatches += 1;
      stats.hiddenInstances += count;
      stats.savedTriangles += count * trianglesPerInstance;
    } else {
      stats.visibleBatches += 1;
      stats.visibleInstances += count;
    }
  }
  return stats;
}

export function updateHexRoadBatchLod(camera = hexTileCamera) {
  if (!camera?.position || !hexRoadTileBatches.length) {
    hexRoadRuntimeStats.lodVisibleBatches = 0;
    hexRoadRuntimeStats.lodHiddenBatches = 0;
    hexRoadRuntimeStats.lodVisibleInstances = 0;
    hexRoadRuntimeStats.lodHiddenInstances = 0;
    hexRoadRuntimeStats.lodSavedTriangles = 0;
    return null;
  }
  const stats = applyHexRoadBatchLodVisibility(hexRoadTileBatches, {
    x: camera.position.x,
    z: camera.position.z,
  });
  hexRoadRuntimeStats.lodEnabled = stats.enabled;
  hexRoadRuntimeStats.lodNearDistance = stats.nearDistance;
  hexRoadRuntimeStats.lodHysteresis = stats.hysteresis;
  hexRoadRuntimeStats.lodMobileProfile = hexRoadLodSettings.mobile;
  hexRoadRuntimeStats.lodVisibleBatches = stats.visibleBatches;
  hexRoadRuntimeStats.lodHiddenBatches = stats.hiddenBatches;
  hexRoadRuntimeStats.lodVisibleInstances = stats.visibleInstances;
  hexRoadRuntimeStats.lodHiddenInstances = stats.hiddenInstances;
  hexRoadRuntimeStats.lodSavedTriangles = stats.savedTriangles;
  return stats;
}

export function flushHexTileBatchUploads() {
  if (!dirtyHexTileBatches.size) return;
  let uploaded = 0;
  for (const [batch, colorChanged] of dirtyHexTileBatches) {
    batch.instanceMatrix.needsUpdate = true;
    if (colorChanged && batch.instanceColor) batch.instanceColor.needsUpdate = true;
    dirtyHexTileBatches.delete(batch);
    uploaded += 1;
    if (uploaded >= HEX_ROAD_UPLOAD_BATCH_LIMIT) break;
  }
  hexRoadRuntimeStats.lastDirtyUploadCount = uploaded;
  hexRoadRuntimeStats.pendingDirtyBatches = dirtyHexTileBatches.size;
  if (dirtyHexTileBatches.size) hexRoadRuntimeStats.uploadDeferredFrames += 1;
}

export function hexRoadBatchStats(batchRecords) {
  const stats = {
    totalBatches: batchRecords.length,
    activeBatches: 0,
    emptyBatches: 0,
    hiddenBatches: 0,
    activeInstances: 0,
    capacityInstances: 0,
    dirtyBatches: 0,
    lodVisibleBatches: 0,
    lodHiddenBatches: 0,
    lodHiddenInstances: 0,
    lodSavedTriangles: 0,
  };
  for (const record of batchRecords) {
    const count = record.mesh?.count ?? 0;
    stats.capacityInstances += record.tiles.length;
    stats.activeInstances += count;
    if (count > 0) stats.activeBatches += 1;
    else stats.emptyBatches += 1;
    if (record.mesh?.visible === false) stats.hiddenBatches += 1;
    if (dirtyHexTileBatches.has(record.mesh)) stats.dirtyBatches += 1;
    if (count > 0 && record.renderVisible !== false) {
      if (record.lodVisible === false) {
        stats.lodHiddenBatches += 1;
        stats.lodHiddenInstances += count;
        stats.lodSavedTriangles += count * HEX_ROAD_TRIANGLES_PER_INSTANCE;
      } else {
        stats.lodVisibleBatches += 1;
      }
    }
  }
  return stats;
}

export function syncHexTileInstance(tile, color = null) {
  if (tile.instanceId < 0) return;
  const visible = tile.visible !== false && tile.userData.visible !== false;
  const scaleXZ = visible ? getHexTileScale() : 0.0001;
  const scaleY = visible ? (tile.userData.interactive ? getHexTileHeightScale() : 1) : 0.0001;
  const y = visible ? tile.userData.baseY + tile.userData.depression : -10000;
  hexTileInstancePosition.set(tile.userData.x, y, tile.userData.z);
  hexTileInstanceScale.set(scaleXZ, scaleY, scaleXZ);
  hexTileInstanceMatrix.compose(hexTileInstancePosition, hexTileInstanceQuaternion, hexTileInstanceScale);
  tile.batch.setMatrixAt(tile.instanceId, hexTileInstanceMatrix);
  addHexInstanceUpdateRange(tile.batch.instanceMatrix, tile.instanceId * 16, 16);
  if (color && tile.batch.setColorAt) {
    tile.batch.setColorAt(tile.instanceId, color);
    addHexInstanceUpdateRange(tile.batch.instanceColor, tile.instanceId * 3, 3);
  }
  markHexTileBatchDirty(tile.batch, Boolean(color));
}

export function syncHexTileDisplayColor(tile, hitLight = 0, playerLight = 0, basePadLight = 0) {
  setHexTileDisplayColor(hexTileInstanceColor, hitLight, playerLight, basePadLight);
  syncHexTileInstance(tile, hexTileInstanceColor);
}

export function compactHexTileBatch(batchRecord) {
  let writeIndex = 0;
  for (const tile of batchRecord.tiles) {
    const visible = tile.visible !== false && tile.userData.visible !== false;
    tile.instanceId = visible ? writeIndex++ : -1;
    if (!visible) continue;
    if (batchRecord.interactive) {
      syncHexTileDisplayColor(
        tile,
        tile.userData.hitLight || 0,
        tile.userData.playerLight || 0,
        tile.userData.basePadLight || 0
      );
    } else {
      syncHexTileInstance(tile, streetEdgeHexInstanceColor);
    }
  }
  batchRecord.mesh.count = writeIndex;
  batchRecord.renderVisible = HEX_ROAD_EMPTY_BATCH_CULLING_ENABLED ? writeIndex > 0 : true;
  refreshHexRoadBatchBounds(batchRecord);
  syncHexTileBatchVisibility(batchRecord);
  hexTileSyncDeps.refreshCullingBounds(batchRecord.mesh);
  if (writeIndex > 0) {
    markHexTileBatchDirty(batchRecord.mesh, true);
  } else {
    dirtyHexTileBatches.delete(batchRecord.mesh);
  }
}

export function compactHexTileBatchesForTiles(tiles) {
  const batches = new Set();
  for (const tile of tiles) batches.add(tile.batchRecord);
  for (const batchRecord of batches) compactHexTileBatch(batchRecord);
}

// ---------- hex-tile creation + layout (A3e-3) ----------
export const hexRoadTiles = [];
export const hexRoadTileBatches = [];
export const streetEdgeHexTiles = [];
export const streetEdgeHexTileBatches = [];
export const HEX_TILE_BUCKET_SIZE = 64;
export const hexRoadTileBuckets = new Map();
export const recoveringHexTiles = new Set();
export const hexTileCandidates = [];
let hexTileFrameId = 0;
let hexTileScene = null;
let hexTileCamera = null;

export function initHexTileLayout(ctx) {
  hexTileScene = ctx.scene;
  hexTileCamera = ctx.camera;
}

export function beginHexTileCandidateFrame() {
  hexTileCandidates.length = 0;
  hexTileFrameId++;
}

export function hexTileBucketKey(ix, iz) {
  // Numeric key (no per-lookup string alloc); ix/iz are small floored bucket indices.
  return (ix + 100000) * 1000000 + (iz + 100000);
}

export function rebuildHexRoadTileBuckets() {
  hexRoadTileBuckets.clear();
  for (const tile of hexRoadTiles) {
    if (!tile.visible || tile.userData.visible === false) continue;
    const ix = Math.floor(tile.userData.x / HEX_TILE_BUCKET_SIZE);
    const iz = Math.floor(tile.userData.z / HEX_TILE_BUCKET_SIZE);
    const key = hexTileBucketKey(ix, iz);
    let bucket = hexRoadTileBuckets.get(key);
    if (!bucket) {
      bucket = [];
      hexRoadTileBuckets.set(key, bucket);
    }
    bucket.push(tile);
  }
}

export function queueHexTileCandidate(tile) {
  if (!tile || tile.userData.frameId === hexTileFrameId) return;
  tile.userData.frameId = hexTileFrameId;
  hexTileCandidates.push(tile);
}

export function setHexTileLayoutPosition(tile, sync = true) {
  const xStep = hexTileColumnStep();
  const zStep = hexTileRowStep();
  const localX = tile.userData.col * xStep;
  const zOffset = (tile.userData.col & 1) ? zStep * 0.5 : 0;
  const localZ = tile.userData.row * zStep + zOffset;
  const x = tile.userData.axis === "x" ? tile.userData.centerX + localZ : tile.userData.centerX + localX;
  const z = tile.userData.axis === "x" ? tile.userData.centerZ + localX : tile.userData.centerZ + localZ;
  const withinBounds = Math.abs(localX) <= tile.userData.halfW + tile.userData.edgeBleed &&
    Math.abs(localZ) <= tile.userData.halfL + tile.userData.edgeBleed;
  tile.userData.x = x;
  tile.userData.z = z;
  tile.visible = withinBounds;
  tile.userData.visible = withinBounds;
  if (!withinBounds) {
    tile.userData.depression = 0;
    tile.userData.hitLight = 0;
    tile.userData.playerLight = 0;
    tile.userData.basePadLight = 0;
    tile.userData.wasInfluenced = false;
    recoveringHexTiles.delete(tile);
  }
  if (sync) syncHexTileInstance(tile);
}

export function updateHexTileLayout() {
  for (const tile of hexRoadTiles) setHexTileLayoutPosition(tile, false);
  for (const tile of streetEdgeHexTiles) setHexTileLayoutPosition(tile, false);
  for (const batch of hexRoadTileBatches) compactHexTileBatch(batch);
  for (const batch of streetEdgeHexTileBatches) compactHexTileBatch(batch);
  rebuildHexRoadTileBuckets();
}

export function updateStreetEdgeHexTileScale() {
  for (const tile of streetEdgeHexTiles) syncHexTileInstance(tile);
}

export function updateZTileBand(tiles, centerX, centerZ, width, length) {
  for (const tile of tiles) {
    tile.userData.centerX = centerX;
    tile.userData.centerZ = centerZ;
    tile.userData.halfW = width / 2;
    tile.userData.halfL = length / 2;
    setHexTileLayoutPosition(tile, false);
  }
  compactHexTileBatchesForTiles(tiles);
  rebuildHexRoadTileBuckets();
}

function addHexRoadTileBatch(batchSeeds, material, interactive, createdTiles, stripIndex = null) {
  const batchMaterial = material.clone();
  batchMaterial.vertexColors = true;
  if (interactive) {
    batchMaterial.userData.hexRoadConfigured = false;
    configureHexRoadMaterial(batchMaterial);
  }
  const batch = new THREE.InstancedMesh(hexTileGeo, batchMaterial, Math.max(1, batchSeeds.length));
  batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  batch.frustumCulled = true;
  hexTileScene.add(batch);

  const batchRecord = {
    mesh: batch,
    material: batchMaterial,
    tiles: [],
    interactive,
    renderVisible: true,
    lodVisible: true,
    bounds: null,
    stripIndex,
  };
  if (interactive) hexRoadTileBatches.push(batchRecord);
  else streetEdgeHexTileBatches.push(batchRecord);

  batchSeeds.forEach((seed, instanceId) => {
    const tile = {
      batch,
      batchRecord,
      instanceId,
      visible: true,
      material: batchMaterial,
      userData: seed,
    };
    batchRecord.tiles.push(tile);
    createdTiles.push(tile);
    if (interactive) hexRoadTiles.push(tile);
    else streetEdgeHexTiles.push(tile);
    setHexTileLayoutPosition(tile, false);
  });

  compactHexTileBatch(batchRecord);
  batch.instanceMatrix.needsUpdate = true;
  if (batch.instanceColor) batch.instanceColor.needsUpdate = true;
  return batchRecord;
}

// Batches partition tiles into fixed strips of SEED-pitch local z (the
// min-gap row grid): 230.4 units = the historical worst-case partition
// (length 4608 / 20 chunks, and 2304 is an exact strip multiple, so this is
// the same grid shifted by a constant). Binning on seed-pitch local z — not
// on world/current-gap positions — keeps batch membership, batch bounds and
// therefore LOD/cull decisions identical to the old full-extent seeding, no
// matter when a strip's tiles were created or where the band is centered.
const HEX_ROAD_BATCH_STRIP_LENGTH = 230.4;

function hexRoadBatchStripIndex(seedLocalZ) {
  return Math.floor(seedLocalZ / HEX_ROAD_BATCH_STRIP_LENGTH);
}

export function addHexRoadTiles(width, length, centerX, centerZ, axis = "z", material = hexTileMat, interactive = true, y = 0) {
  const createdTiles = [];
  const tileSeedChunks = new Map();
  const halfW = width / 2;
  const halfL = length / 2;
  const maxCols = Math.ceil(halfW / hexTileSeedXStep) + 2;
  const maxRows = Math.ceil(halfL / hexTileSeedZStep) + 2;
  const edgeBleed = hexTileRadius * 0.08;
  for (let col = -maxCols; col <= maxCols; col++) {
    const localX = col * hexTileSeedXStep;
    if (Math.abs(localX) > halfW + edgeBleed) continue;
    const zOffset = (col & 1) ? hexTileSeedZStep * 0.5 : 0;
    for (let row = -maxRows; row <= maxRows; row++) {
      const localZ = row * hexTileSeedZStep + zOffset;
      if (Math.abs(localZ) > halfL + edgeBleed) continue;
      const x = axis === "x" ? centerX + localZ : centerX + localX;
      const z = axis === "x" ? centerZ + localX : centerZ + localZ;
      const chunkIndex = hexRoadBatchStripIndex(localZ);
      let chunkSeeds = tileSeedChunks.get(chunkIndex);
      if (!chunkSeeds) {
        chunkSeeds = [];
        tileSeedChunks.set(chunkIndex, chunkSeeds);
      }
      chunkSeeds.push({
        x,
        z,
        col,
        row,
        axis,
        centerX,
        centerZ,
        halfW,
        halfL,
        edgeBleed,
        baseY: y,
        depression: 0,
        hitTime: 0,
        wasInfluenced: false,
        hitLight: 0,
        playerLight: 0,
        basePadLight: 0,
        interactive,
        visible: true,
      });
    }
  }

  for (const [stripIndex, chunkSeeds] of tileSeedChunks) {
    if (!chunkSeeds.length) continue;
    addHexRoadTileBatch(chunkSeeds, material, interactive, createdTiles, stripIndex);
  }
  if (interactive) {
    rebuildHexRoadTileBuckets();
  }
  return createdTiles;
}

// Grow an existing strip batch in place: InstancedMesh capacity is fixed, so
// replace the mesh with a larger one (same record identity, same material
// object) and free the retired mesh's instance buffers. One batch per strip,
// always — so the partition (and LOD/cull behaviour) never depends on WHEN a
// strip's tiles were created.
function growHexRoadTileBatch(record, newSeeds, createdTiles) {
  const oldMesh = record.mesh;
  const newTiles = [];
  for (const seed of newSeeds) {
    const tile = {
      batch: null,
      batchRecord: record,
      instanceId: -1,
      visible: true,
      material: record.material,
      userData: seed,
    };
    record.tiles.push(tile);
    newTiles.push(tile);
    createdTiles.push(tile);
    if (record.interactive) hexRoadTiles.push(tile);
    else streetEdgeHexTiles.push(tile);
  }
  const nextMesh = new THREE.InstancedMesh(hexTileGeo, record.material, record.tiles.length);
  nextMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  nextMesh.frustumCulled = true;
  hexTileScene.add(nextMesh);
  record.mesh = nextMesh;
  for (const tile of record.tiles) tile.batch = nextMesh;
  dirtyHexTileBatches.delete(oldMesh);
  hexTileScene.remove(oldMesh);
  oldMesh.dispose();
  for (const tile of newTiles) setHexTileLayoutPosition(tile, false);
  compactHexTileBatch(record);
  nextMesh.instanceMatrix.needsUpdate = true;
  if (nextMesh.instanceColor) nextMesh.instanceColor.needsUpdate = true;
}

// Bands are seeded for the CURRENT control values, not the slider extremes.
// When a control change (band width/length or a denser hex gap) needs cells
// beyond what a band already has, this tops the band up in place. Cheap
// watermark check per call; the exact cell diff runs only when it trips.
const hexRoadBandSeedExtents = new WeakMap();

export function ensureHexRoadTileCoverage(tiles, centerX, centerZ, width, length, axis = "z", material = hexTileMat, interactive = true, y = 0) {
  const xStep = hexTileColumnStep();
  const zStep = hexTileRowStep();
  const halfW = width / 2;
  const halfL = length / 2;
  const edgeBleed = hexTileRadius * 0.08;
  const neededCols = Math.ceil((halfW + edgeBleed) / xStep);
  const neededRows = Math.ceil((halfL + edgeBleed) / zStep) + 1;
  let extent = hexRoadBandSeedExtents.get(tiles);
  if (!extent) {
    extent = { maxCol: 0, maxRow: 0 };
    for (const tile of tiles) {
      const c = Math.abs(tile.userData.col);
      const r = Math.abs(tile.userData.row);
      if (c > extent.maxCol) extent.maxCol = c;
      if (r > extent.maxRow) extent.maxRow = r;
    }
    hexRoadBandSeedExtents.set(tiles, extent);
  }
  if (neededCols <= extent.maxCol && neededRows <= extent.maxRow) return 0;

  const existing = new Set();
  for (const tile of tiles) {
    existing.add((tile.userData.col + 100000) * 1000000 + (tile.userData.row + 100000));
  }
  const tileSeedChunks = new Map();
  for (let col = -neededCols; col <= neededCols; col++) {
    const localX = col * xStep;
    if (Math.abs(localX) > halfW + edgeBleed) continue;
    const zOffset = (col & 1) ? zStep * 0.5 : 0;
    const seedZOffset = (col & 1) ? hexTileSeedZStep * 0.5 : 0;
    for (let row = -neededRows; row <= neededRows; row++) {
      const localZ = row * zStep + zOffset;
      if (Math.abs(localZ) > halfL + edgeBleed) continue;
      if (existing.has((col + 100000) * 1000000 + (row + 100000))) continue;
      const x = axis === "x" ? centerX + localZ : centerX + localX;
      const z = axis === "x" ? centerZ + localX : centerZ + localZ;
      const chunkIndex = hexRoadBatchStripIndex(row * hexTileSeedZStep + seedZOffset);
      let chunkSeeds = tileSeedChunks.get(chunkIndex);
      if (!chunkSeeds) {
        chunkSeeds = [];
        tileSeedChunks.set(chunkIndex, chunkSeeds);
      }
      chunkSeeds.push({
        x,
        z,
        col,
        row,
        axis,
        centerX,
        centerZ,
        halfW,
        halfL,
        edgeBleed,
        baseY: y,
        depression: 0,
        hitTime: 0,
        wasInfluenced: false,
        hitLight: 0,
        playerLight: 0,
        basePadLight: 0,
        interactive,
        visible: true,
      });
    }
  }
  extent.maxCol = Math.max(extent.maxCol, neededCols);
  extent.maxRow = Math.max(extent.maxRow, neededRows);
  const createdTiles = [];
  const batchList = interactive ? hexRoadTileBatches : streetEdgeHexTileBatches;
  for (const [stripIndex, chunkSeeds] of tileSeedChunks) {
    if (!chunkSeeds.length) continue;
    const existingRecord = batchList.find((r) => r.stripIndex === stripIndex);
    if (existingRecord) growHexRoadTileBatch(existingRecord, chunkSeeds, createdTiles);
    else addHexRoadTileBatch(chunkSeeds, material, interactive, createdTiles, stripIndex);
  }
  if (!createdTiles.length) return 0;
  for (const tile of createdTiles) tiles.push(tile);
  if (interactive) rebuildHexRoadTileBuckets();
  return createdTiles.length;
}

// ---------- hex-tile per-frame depression (A3e-4) ----------
export let hexUpdateEnabled = true;
let hexRoadUpdateFrame = 0;
let hexRoadAccumulatedDt = 0;
let hexPassOffset = -0.22 * 3 * 2 * 2;
let hexDepressRadius = 4.2 * 3 * 2 * 2;
let hexDropDelay = 0;
let hexDropSpeed = 18;
let hexRecovery = 8.5;
export let hexTileHitLight = 0.18;
export let hexPlayerTileLight = 0.45;

export function applyHexRuntimeSettings({
  offset = hexPassOffset,
  radius = hexDepressRadius,
  dropDelay = hexDropDelay,
  dropSpeed = hexDropSpeed,
  recovery = hexRecovery,
  tileHitLight = hexTileHitLight,
  playerTileLight = hexPlayerTileLight,
} = {}) {
  hexPassOffset = offset;
  hexDepressRadius = radius;
  hexDropDelay = dropDelay;
  hexDropSpeed = dropSpeed;
  hexRecovery = recovery;
  hexTileHitLight = tileHitLight;
  hexPlayerTileLight = playerTileLight;
}

function updateHexRoadTiles(dt) {
  if (!hexRoadTiles.length) return;
  const playerX = hexTileCamera.position.x;
  const playerZ = hexTileCamera.position.z;
  const dropDelaySeconds = hexDropDelay / 1000;
  const dropStep = Math.min(1, hexDropSpeed * dt);
  const recoveryStep = Math.min(1, hexRecovery * dt);
  const updateRadius = hexDepressRadius + Math.abs(hexPassOffset) + hexTileRadius * 2;
  const updateRadiusSq = updateRadius * updateRadius;
  beginHexTileCandidateFrame();
  const bucketRadius = Math.ceil(updateRadius / HEX_TILE_BUCKET_SIZE) + 1;
  const centerIx = Math.floor(playerX / HEX_TILE_BUCKET_SIZE);
  const centerIz = Math.floor(playerZ / HEX_TILE_BUCKET_SIZE);
  for (let ix = centerIx - bucketRadius; ix <= centerIx + bucketRadius; ix++) {
    for (let iz = centerIz - bucketRadius; iz <= centerIz + bucketRadius; iz++) {
      const bucket = hexRoadTileBuckets.get(hexTileBucketKey(ix, iz));
      if (!bucket) continue;
      for (const tile of bucket) queueHexTileCandidate(tile);
    }
  }
  for (const tile of recoveringHexTiles) queueHexTileCandidate(tile);
  hexRoadRuntimeStats.lastCandidateCount = hexTileCandidates.length;

  for (const tile of hexTileCandidates) {
    if (!tile.visible || tile.userData.visible === false) {
      recoveringHexTiles.delete(tile);
      continue;
    }
    const dx = tile.userData.x - playerX;
    const dz = tile.userData.z - playerZ;
    const distSq = dx * dx + dz * dz;
    const recovering = Math.abs(tile.userData.depression) > 0.001 || tile.userData.wasInfluenced;
    if (distSq > updateRadiusSq && !recovering) continue;

    const dist = distSq <= updateRadiusSq ? Math.sqrt(distSq) : hexDepressRadius + 1;
    const influence = dist <= hexDepressRadius ? THREE.MathUtils.smoothstep(hexDepressRadius - dist, 0, hexDepressRadius) : 0;
    const isInfluenced = influence > 0.001;
    if (isInfluenced) {
      tile.userData.hitTime = tile.userData.wasInfluenced ? tile.userData.hitTime + dt : 0;
    } else {
      tile.userData.hitTime = 0;
    }
    tile.userData.wasInfluenced = isInfluenced;

    const previousDepression = tile.userData.depression;
    const previousHitLight = tile.userData.hitLight;
    const previousPlayerLight = tile.userData.playerLight || 0;
    const targetDepth = isInfluenced && tile.userData.hitTime >= dropDelaySeconds ? hexPassOffset * influence : 0;
    const step = targetDepth < tile.userData.depression ? dropStep : recoveryStep;
    tile.userData.depression += (targetDepth - tile.userData.depression) * step;
    const hitLight = THREE.MathUtils.clamp(influence * hexTileHitLight, 0, 1);
    const playerLight = THREE.MathUtils.clamp(influence * hexPlayerTileLight, 0, 1);
    tile.userData.hitLight = hitLight;
    tile.userData.playerLight = playerLight;
    if (Math.abs(tile.userData.depression - previousDepression) > 0.0005 ||
      Math.abs(hitLight - previousHitLight) > 0.003 ||
      Math.abs(playerLight - previousPlayerLight) > 0.003) {
      syncHexTileDisplayColor(tile, hitLight, playerLight, tile.userData.basePadLight || 0);
    }
    if (Math.abs(tile.userData.depression) > 0.001 || isInfluenced) {
      recoveringHexTiles.add(tile);
    } else {
      recoveringHexTiles.delete(tile);
    }
  }
}

export function stepHexRoadTiles(dt) {
  // LOD already refreshed this frame by syncHexRoadLodForFrame() in the tick (runs immediately before
  // stepHexRoadTiles with the same camera); a second updateHexRoadBatchLod() here was redundant.
  if (!hexUpdateEnabled) {
    hexRoadUpdateFrame = 0;
    hexRoadAccumulatedDt = 0;
    return;
  }
  hexRoadAccumulatedDt = Math.min(MAX_HEX_ROAD_ACCUMULATED_DT, hexRoadAccumulatedDt + dt);
  hexRoadUpdateFrame = (hexRoadUpdateFrame + 1) % HEX_ROAD_UPDATE_FRAME_STRIDE;
  if (hexRoadUpdateFrame !== 0) return;
  updateHexRoadTiles(hexRoadAccumulatedDt);
  hexRoadAccumulatedDt = 0;
}
