import * as THREE from 'three';
import {
  DEFAULT_BASE_PAD_Y,
  GRID_BLOCK,
  MAIN_BUILDING_BASE,
} from './boulevard-constants.js';
import {
  CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS,
  CITY_REVEAL_BEAT_DROP_LEAD_MS,
  CITY_REVEAL_MUSIC_WAIT_CAP_MS,
  CITY_REVEAL_BACKPLATE_SWEEP_PORTION,
  CITY_REVEAL_DEFAULT_DELAY_MS,
  CITY_REVEAL_DEFAULT_FADE_MS,
  CITY_REVEAL_MAX_SKY_BACKPLATE_OPACITY,
  CITY_REVEAL_SWEEP_MARGIN_Z,
} from './config.js';
import { createCityRevealScanGlow } from './city-reveal-scan-glow.js';
import { bridgeEdgeBatch } from './building-leds.js';

const noop = () => {};
const runtime = {
  camera: null,
  renderer: null,
  getPlayerSpawn: () => null,
  getDynamicRoadSurfaceWidth: () => 1,
  getDynamicRoadLength: () => 1,
  getDynamicRoadCenter: () => 0,
  getRoadTopY: () => 0,
  getSideBuildingRecords: () => [],
  getMainBuildingRecords: () => [],
  getBridgeRecords: () => [],
  getEdgeStripSpecs: () => [],
  stopMouseLookInput: noop,
  updatePointerLockHint: noop,
  syncCityRevealSkyMaterial: noop,
  // Firma di soundtrack-runtime: (delayMs = default) => boolean. Da `noop` tsc deduceva
  // `() => void` e la chiamata con il ritardo era un TS2554 (2026-09-20). Tipi, non bug.
  scheduleTronSoundtrackIntroLofiStopForReveal: /** @type {(ritardoMs?: number) => boolean} */ (noop),
};

export let cityRevealScanGlow = null;

export function initCityRevealWireframe(deps) {
  Object.assign(runtime, deps);
  cityRevealScanGlow = createCityRevealScanGlow({
    wireScene: cityRevealWireScene,
    color: cityRevealWireColor,
    gridBlock: GRID_BLOCK,
    getDynamicRoadSurfaceWidth: runtime.getDynamicRoadSurfaceWidth,
    getSideBuildingRecords: runtime.getSideBuildingRecords,
    getMainBuildingRecords: runtime.getMainBuildingRecords,
    getBridgeRecords: runtime.getBridgeRecords,
    getRoadTopY: runtime.getRoadTopY,
    getState: () => ({
      wireframeEnabled: cityRevealWireframeEnabled,
      startedAt: cityRevealStartedAt,
      complete: cityRevealComplete,
      wireAlpha: cityRevealWireAlpha,
      sweepProgress: cityRevealSweepProgress,
      frontZ: cityRevealFrontZ,
    }),
  });
  return cityRevealScanGlow;
}

export const CITY_REVEAL_SWEEP_NORMAL = new THREE.Vector3(0, -1, 1).normalize();
export let cityRevealDelayMs = CITY_REVEAL_DEFAULT_DELAY_MS;
export let cityRevealFadeMs = CITY_REVEAL_DEFAULT_FADE_MS;
export let cityRevealWireframeEnabled = true;
export let cityRevealWireframeDensity = 2;
export let cityRevealWireOpacityScale = 1;
export let cityRevealBackplateOpacityScale = 0;
export let cityRevealStartedAt = 0;
export let cityRevealArmedAt = 0;
export let cityRevealWireAlpha = 1;
export let cityRevealBackplateRevealFactor = 1;
export let cityRevealFrontZ = 1e9;
export let cityRevealSweepStartZ = 0;
export let cityRevealSweepEndZ = 0;
export let cityRevealSweepProgress = 0;
export let cityRevealComplete = false;
export let cityRevealCompletedAt = 0;
export let cityRevealWaitingForVisibleFrame = false;

export const cityRevealOverlayScene = new THREE.Scene();
export const cityRevealOverlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
cityRevealOverlayCamera.position.z = 1;
// Built once: matchMedia() parses the query and allocates a MediaQueryList on
// every call, and this runs per frame during the sweep. The list stays live, so
// a preference change mid-session is still picked up by reading .matches.
const reducedMotionQuery = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;
export const cityRevealFadeDurationMs = () => (reducedMotionQuery?.matches ? 1 : cityRevealFadeMs);
export const cityRevealEffectiveDelayMs = () => cityRevealDelayMs + CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS;
export const cityRevealBackplateMat = new THREE.MeshBasicMaterial({
  color: 0x000709,
  transparent: true,
  opacity: 1,
  depthTest: false,
  depthWrite: false,
  toneMapped: false,
});
export const cityRevealBackplate = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), cityRevealBackplateMat);
cityRevealBackplate.frustumCulled = false;
cityRevealOverlayScene.add(cityRevealBackplate);

export const cityRevealWireScene = new THREE.Scene();
export const cityRevealWireGroup = new THREE.Group();
cityRevealWireScene.add(cityRevealWireGroup);
export const cityRevealRoadGridScene = new THREE.Scene();
export const cityRevealRoadGridGroup = new THREE.Group();
cityRevealRoadGridScene.add(cityRevealRoadGridGroup);
export const cityRevealWireMaterials = [];
export const cityRevealWireObjects = [];
export const cityRevealRoadGridObjects = [];
export const cityRevealRoadFadeObjects = [];
export const cityRevealSolidObjects = [];
const cityRevealWireCullObjects = [];
export const cityRevealWireCullStats = {
  total: 0,
  visible: 0,
  hidden: 0,
  wireVisible: 0,
  solidVisible: 0,
  roadFadeVisible: 0,
};
let cityRevealWireCullRevision = 0;
const cityRevealWireCullCache = {
  revision: -1,
  count: -1,
  frontZ: NaN,
  alpha: NaN,
  groupVisible: null,
};
export const cityRevealRealClipPlane = new THREE.Plane(CITY_REVEAL_SWEEP_NORMAL.clone(), -cityRevealFrontZ);

export const cityRevealBoundsBox = new THREE.Box3();
const cityRevealStripLineStart = new THREE.Vector3();
const cityRevealStripLineEnd = new THREE.Vector3();
const cityRevealWireColor = 0x62f7ff;
const cityRevealWireCoreColor = 0xe8feff;
export const CITY_REVEAL_ROAD_FADE_BANDS = 8;
export const CITY_REVEAL_ROAD_FADE_MAX_OPACITY = 0.42;
export const CITY_REVEAL_ROAD_GRID_BASE_OPACITY = 0.58;
export const CITY_REVEAL_ROAD_GRID_RENDER_ORDER = 2;
export const CITY_REVEAL_ROAD_SOLID_FADE_ENABLED = false;
export const CITY_REVEAL_ROAD_GRID_EXTRA_BLOCKS = 64;
export const CITY_REVEAL_ROAD_GRID_PROCEDURAL = true;
export const CITY_REVEAL_ROAD_GRID_FADE_BANDS = 10;
export const CITY_REVEAL_ROAD_PERIMETER_EPS = 0.05;
export const CITY_REVEAL_SIDEWALK_WIRE_ROAD_CLEARANCE = 0.08;
export const CITY_REVEAL_ROAD_SOLID_BACKING_ENABLED = false;
export const CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED = false;
export const CITY_REVEAL_MAIN_BUILDING_LED_WIREFRAME_ENABLED = false;
export const CITY_REVEAL_MAIN_BUILDING_SLOW_SPEED = 0.5;
export const cityRevealRoadFadeMaterials = [];
const cityRevealRoadGridFadeMaterials = new Map();
export let cityRevealRoadGridAlphaFactor = 1;
export let cityRevealRoadGridSkippedPerimeterSegments = 0;
export const cityRevealSolidMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 1,
  depthWrite: true,
  depthTest: true,
  toneMapped: false,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});

function registerCityRevealWireMaterial(material, baseOpacity) {
  material.transparent = true;
  material.opacity = baseOpacity;
  material.depthWrite = false;
  material.depthTest = true;
  material.toneMapped = false;
  material.userData.baseOpacity = baseOpacity;
  material.userData.defaultBaseOpacity = baseOpacity;
  cityRevealWireMaterials.push(material);
  return material;
}

export const cityRevealWireMat = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
  color: cityRevealWireColor,
  blending: THREE.AdditiveBlending,
}), 0.62);
export const cityRevealWireDimMat = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
  color: cityRevealWireColor,
  blending: THREE.NormalBlending,
}), 0.30);
export const cityRevealWireCoreMat = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
  color: cityRevealWireCoreColor,
  blending: THREE.AdditiveBlending,
}), 0.42);
export const cityRevealRoadGridMat = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
  color: cityRevealWireColor,
  blending: THREE.AdditiveBlending,
}), CITY_REVEAL_ROAD_GRID_BASE_OPACITY);
cityRevealRoadGridMat.userData.cityRevealRoadGridMaterial = true;
cityRevealRoadGridMat.depthTest = true;
export const cityRevealRoadGridShaderMat = registerCityRevealWireMaterial(new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color(cityRevealWireColor) },
    uOpacity: { value: CITY_REVEAL_ROAD_GRID_BASE_OPACITY },
    uXSpacing: { value: GRID_BLOCK },
    uZSpacing: { value: GRID_BLOCK },
    uRoadHalfW: { value: 1 },
    uRoadMinZ: { value: -1 },
    uRoadMaxZ: { value: 1 },
    uFadeWidth: { value: 1 },
    uPerimeterEps: { value: CITY_REVEAL_ROAD_PERIMETER_EPS },
  },
  vertexShader: `
    varying vec3 vWorldPosition;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uXSpacing;
    uniform float uZSpacing;
    uniform float uRoadHalfW;
    uniform float uRoadMinZ;
    uniform float uRoadMaxZ;
    uniform float uFadeWidth;
    uniform float uPerimeterEps;
    varying vec3 vWorldPosition;

    float gridLine(vec2 coord) {
      vec2 derivative = max(fwidth(coord), vec2(0.0001));
      vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
      return 1.0 - min(min(grid.x, grid.y), 1.0);
    }

    void main() {
      vec2 gridCoord = vec2(vWorldPosition.x / uXSpacing, vWorldPosition.z / uZSpacing);
      float line = gridLine(gridCoord);
      float xOverflow = max(0.0, abs(vWorldPosition.x) - uRoadHalfW) / max(uFadeWidth, 0.001);
      float zOverflow = max(0.0, max(uRoadMinZ - vWorldPosition.z, vWorldPosition.z - uRoadMaxZ)) / max(uFadeWidth, 0.001);
      float fade = clamp(1.0 - max(xOverflow, zOverflow), 0.0, 1.0);
      float roadEdgeX = abs(abs(vWorldPosition.x) - uRoadHalfW);
      float roadEdgeZ = min(abs(vWorldPosition.z - uRoadMinZ), abs(vWorldPosition.z - uRoadMaxZ));
      float perimeterMask = smoothstep(uPerimeterEps, uPerimeterEps * 3.0, min(roadEdgeX, roadEdgeZ));
      float alpha = line * fade * perimeterMask * uOpacity;
      if (alpha <= 0.002) discard;
      gl_FragColor = vec4(uColor, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  depthTest: true,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
  extensions: { derivatives: true },
}), CITY_REVEAL_ROAD_GRID_BASE_OPACITY);
cityRevealRoadGridShaderMat.userData.cityRevealRoadGridMaterial = true;
cityRevealRoadGridShaderMat.userData.cityRevealRoadGridShaderMaterial = true;
cityRevealRoadGridShaderMat.depthTest = true;

function cityRevealRoadGridMaterialForBand(band) {
  const safeBand = THREE.MathUtils.clamp(Math.round(band), 1, CITY_REVEAL_ROAD_GRID_FADE_BANDS);
  if (safeBand >= CITY_REVEAL_ROAD_GRID_FADE_BANDS) return cityRevealRoadGridMat;
  if (!cityRevealRoadGridFadeMaterials.has(safeBand)) {
    const opacityScale = safeBand / CITY_REVEAL_ROAD_GRID_FADE_BANDS;
    const material = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
      color: cityRevealWireColor,
      blending: THREE.AdditiveBlending,
    }), CITY_REVEAL_ROAD_GRID_BASE_OPACITY * opacityScale);
    material.userData.cityRevealRoadGridMaterial = true;
    material.depthTest = true;
    cityRevealRoadGridFadeMaterials.set(safeBand, material);
  }
  return cityRevealRoadGridFadeMaterials.get(safeBand);
}

function pointsToWireGeometry(points) {
  const vertices = [];
  points.forEach((point) => vertices.push(point.x, point.y, point.z));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
}

function cityRevealSweepValueAt(z, y = 0) {
  const safeZ = Number.isFinite(z) ? z : 0;
  const safeY = Number.isFinite(y) ? y : 0;
  return safeZ - safeY;
}

function cityRevealBoxSweepBounds(centerZ, halfDepth, centerY = 0, halfHeight = 0) {
  const safeZ = Number.isFinite(centerZ) ? centerZ : 0;
  const safeY = Number.isFinite(centerY) ? centerY : 0;
  const hd = Math.abs(Number.isFinite(halfDepth) ? halfDepth : 0);
  const hh = Math.abs(Number.isFinite(halfHeight) ? halfHeight : 0);
  const values = [
    cityRevealSweepValueAt(safeZ - hd, safeY - hh),
    cityRevealSweepValueAt(safeZ + hd, safeY - hh),
    cityRevealSweepValueAt(safeZ - hd, safeY + hh),
    cityRevealSweepValueAt(safeZ + hd, safeY + hh),
  ];
  return { min: Math.min(...values), max: Math.max(...values) };
}

function setCityRevealObjectBounds(object, minZ, maxZ, minSweep = null, maxSweep = null) {
  if (!object) return object;
  const safeMin = Number.isFinite(minZ) ? minZ : 0;
  const safeMax = Number.isFinite(maxZ) ? maxZ : safeMin;
  object.userData.cityRevealMinZ = Math.min(safeMin, safeMax);
  object.userData.cityRevealMaxZ = Math.max(safeMin, safeMax);
  object.userData.cityRevealZ = (object.userData.cityRevealMinZ + object.userData.cityRevealMaxZ) * 0.5;
  const fallbackY = Number.isFinite(object.position?.y) ? object.position.y : 0;
  const fallbackMinSweep = cityRevealSweepValueAt(object.userData.cityRevealMinZ, fallbackY);
  const fallbackMaxSweep = cityRevealSweepValueAt(object.userData.cityRevealMaxZ, fallbackY);
  const safeMinSweep = Number.isFinite(minSweep) ? minSweep : Math.min(fallbackMinSweep, fallbackMaxSweep);
  const safeMaxSweep = Number.isFinite(maxSweep) ? maxSweep : Math.max(fallbackMinSweep, fallbackMaxSweep);
  object.userData.cityRevealMinSweep = Math.min(safeMinSweep, safeMaxSweep);
  object.userData.cityRevealMaxSweep = Math.max(safeMinSweep, safeMaxSweep);
  object.userData.cityRevealSweep = (object.userData.cityRevealMinSweep + object.userData.cityRevealMaxSweep) * 0.5;
  return object;
}

function setCityRevealObjectBoundsFromPoints(object, points) {
  let minZ = Infinity;
  let maxZ = -Infinity;
  let minSweep = Infinity;
  let maxSweep = -Infinity;
  for (const point of points) {
    minZ = Math.min(minZ, point.z);
    maxZ = Math.max(maxZ, point.z);
    const sweep = cityRevealSweepValueAt(point.z, point.y);
    minSweep = Math.min(minSweep, sweep);
    maxSweep = Math.max(maxSweep, sweep);
  }
  return setCityRevealObjectBounds(object, minZ, maxZ, minSweep, maxSweep);
}

function setCityRevealObjectBoxBounds(object, height, depth, y, z) {
  const halfDepth = Math.abs(Number.isFinite(depth) ? depth : 0) * 0.5;
  const sweepBounds = cityRevealBoxSweepBounds(z, halfDepth, y, Math.abs(Number.isFinite(height) ? height : 0) * 0.5);
  return setCityRevealObjectBounds(object, z - halfDepth, z + halfDepth, sweepBounds.min, sweepBounds.max);
}

function setCityRevealObjectBoundsFromBox(object, box) {
  if (!box || box.isEmpty?.()) return setCityRevealObjectBounds(object, 0, 0);
  const centerZ = (box.min.z + box.max.z) * 0.5;
  const centerY = (box.min.y + box.max.y) * 0.5;
  const sweepBounds = cityRevealBoxSweepBounds(centerZ, (box.max.z - box.min.z) * 0.5, centerY, (box.max.y - box.min.y) * 0.5);
  return setCityRevealObjectBounds(object, box.min.z, box.max.z, sweepBounds.min, sweepBounds.max);
}

function translateCityRevealObjectBounds(object, zOffset, yOffset = 0) {
  if (!object || !Number.isFinite(zOffset)) return object;
  const minZ = object.userData.cityRevealMinZ;
  const maxZ = object.userData.cityRevealMaxZ;
  const minSweep = object.userData.cityRevealMinSweep;
  const maxSweep = object.userData.cityRevealMaxSweep;
  if (!Number.isFinite(minZ) || !Number.isFinite(maxZ)) return object;
  const sweepOffset = cityRevealSweepValueAt(zOffset, yOffset);
  return setCityRevealObjectBounds(
    object,
    minZ + zOffset,
    maxZ + zOffset,
    Number.isFinite(minSweep) ? minSweep + sweepOffset : null,
    Number.isFinite(maxSweep) ? maxSweep + sweepOffset : null
  );
}

function addCityWireLineSegments(points, material = cityRevealWireMat) {
  const line = new THREE.LineSegments(pointsToWireGeometry(points), material);
  line.frustumCulled = false;
  line.userData.cityRevealCullKind = 'wire';
  setCityRevealObjectBoundsFromPoints(line, points);
  cityRevealWireGroup.add(line);
  cityRevealWireObjects.push(line);
  cityRevealWireCullObjects.push(line);
  return line;
}

function addCityRevealRoadGridLineSegments(points, material = cityRevealRoadGridMat) {
  const line = new THREE.LineSegments(pointsToWireGeometry(points), material);
  line.frustumCulled = false;
  line.renderOrder = CITY_REVEAL_ROAD_GRID_RENDER_ORDER;
  setCityRevealObjectBoundsFromPoints(line, points);
  cityRevealRoadGridGroup.add(line);
  cityRevealRoadGridObjects.push(line);
  return line;
}

function addCityWireBox(width, height, depth, x, y, z, material = cityRevealWireMat) {
  const line = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth)),
    material
  );
  line.position.set(x, y, z);
  line.frustumCulled = false;
  line.userData.cityRevealCullKind = 'wire';
  setCityRevealObjectBoxBounds(line, height, depth, y, z);
  cityRevealWireGroup.add(line);
  cityRevealWireObjects.push(line);
  cityRevealWireCullObjects.push(line);
  return line;
}

function addCityWireSolidBox(width, height, depth, x, y, z, role = 'solid') {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), cityRevealSolidMat);
  mesh.position.set(x, y, z);
  mesh.frustumCulled = false;
  mesh.userData.cityRevealCullKind = 'solid';
  mesh.userData.cityRevealRole = role;
  setCityRevealObjectBoxBounds(mesh, height, depth, y, z);
  cityRevealWireGroup.add(mesh);
  cityRevealSolidObjects.push(mesh);
  cityRevealWireCullObjects.push(mesh);
  return mesh;
}

function cityRevealRoadFadeMaterial(index) {
  if (!cityRevealRoadFadeMaterials[index]) {
    const t = 1 - index / Math.max(1, CITY_REVEAL_ROAD_FADE_BANDS);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: CITY_REVEAL_ROAD_FADE_MAX_OPACITY * t * t,
      depthWrite: true,
      depthTest: true,
      toneMapped: false,
    });
    cityRevealRoadFadeMaterials[index] = material;
  }
  return cityRevealRoadFadeMaterials[index];
}

function addCityWireRoadFadeBox(width, height, depth, x, y, z, bandIndex) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), cityRevealRoadFadeMaterial(bandIndex));
  mesh.position.set(x, y, z);
  mesh.frustumCulled = false;
  mesh.userData.cityRevealCullKind = 'road-fade';
  mesh.userData.cityRevealRole = 'road-fade';
  setCityRevealObjectBoxBounds(mesh, height, depth, y, z);
  cityRevealWireGroup.add(mesh);
  cityRevealRoadFadeObjects.push(mesh);
  cityRevealWireCullObjects.push(mesh);
  return mesh;
}

function tagCityRevealWireObject(object, role) {
  if (object) object.userData.cityRevealRole = role;
  return object;
}

function addCityWireStripCenterline(spec, material = cityRevealWireDimMat) {
  if (spec && !spec.mesh && spec.instanceMatrix) {
    // Batched bridge strip: endpoints are the unit box's local (0,0,±0.5)
    // through the stored instance matrix (scaled to thickness×thickness×len).
    if (!spec.lastVisible || !bridgeEdgeBatch.mesh) return null;
    bridgeEdgeBatch.mesh.updateWorldMatrix(true, false);
    cityRevealStripLineStart.set(0, 0, -0.5).applyMatrix4(spec.instanceMatrix).applyMatrix4(bridgeEdgeBatch.mesh.matrixWorld);
    cityRevealStripLineEnd.set(0, 0, 0.5).applyMatrix4(spec.instanceMatrix).applyMatrix4(bridgeEdgeBatch.mesh.matrixWorld);
    const line = addCityWireLineSegments([
      cityRevealStripLineStart.clone(),
      cityRevealStripLineEnd.clone(),
    ], material);
    return tagCityRevealWireObject(line, `${spec.edgeRole || 'edge'}-led-wire`);
  }
  if (!spec?.mesh?.visible || !spec.mesh.geometry) return null;
  const geometry = spec.mesh.geometry;
  let length = Number(geometry.parameters?.depth);
  if (!Number.isFinite(length) || length <= 0) {
    geometry.computeBoundingBox();
    length = Math.abs((geometry.boundingBox?.max.z ?? 0) - (geometry.boundingBox?.min.z ?? 0));
  }
  if (!Number.isFinite(length) || length <= 0) return null;

  spec.mesh.updateWorldMatrix(true, false);
  cityRevealStripLineStart.set(0, 0, -length * 0.5).applyMatrix4(spec.mesh.matrixWorld);
  cityRevealStripLineEnd.set(0, 0, length * 0.5).applyMatrix4(spec.mesh.matrixWorld);
  const line = addCityWireLineSegments([
    cityRevealStripLineStart.clone(),
    cityRevealStripLineEnd.clone(),
  ], material);
  return tagCityRevealWireObject(line, `${spec.edgeRole || 'edge'}-led-wire`);
}

function addCityWireBoxDensity(width, height, depth, x, y, z, material = cityRevealWireDimMat) {
  if (cityRevealWireframeDensity < 2) return null;
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;
  if (![hw, hh, hd].every((value) => Number.isFinite(value) && value > 0)) return null;
  const points = [];
  const push = (a, b) => {
    points.push(new THREE.Vector3(a[0], a[1], a[2]), new THREE.Vector3(b[0], b[1], b[2]));
  };
  for (let index = 1; index < cityRevealWireframeDensity; index += 1) {
    const x = -hw + width * (index / cityRevealWireframeDensity);
    const yMid = -hh + height * (index / cityRevealWireframeDensity);
    const z = -hd + depth * (index / cityRevealWireframeDensity);
    [-hd, hd].forEach((zSide) => {
      push([x, -hh, zSide], [x, hh, zSide]);
      push([-hw, yMid, zSide], [hw, yMid, zSide]);
    });
    [-hw, hw].forEach((xSide) => {
      push([xSide, -hh, z], [xSide, hh, z]);
      push([xSide, yMid, -hd], [xSide, yMid, hd]);
    });
    [-hh, hh].forEach((ySide) => {
      push([-hw, ySide, z], [hw, ySide, z]);
      push([x, ySide, -hd], [x, ySide, hd]);
    });
  }

  const line = addCityWireLineSegments(points, material);
  line.position.set(x, y, z);
  translateCityRevealObjectBounds(line, z, y);
  return tagCityRevealWireObject(line, 'wire-density');
}

function addCityWireLoop(points, y, xOffset = 0, zOffset = 0, material = cityRevealWireDimMat) {
  if (!points?.length) return null;
  const segments = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    segments.push(
      new THREE.Vector3(xOffset + a[0], y, zOffset + a[1]),
      new THREE.Vector3(xOffset + b[0], y, zOffset + b[1])
    );
  }
  return addCityWireLineSegments(segments, material);
}

function addCityWireLoopDensity(points, y, xOffset = 0, zOffset = 0, material = cityRevealWireDimMat) {
  if (cityRevealWireframeDensity < 2 || !points?.length) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point[0]);
    maxX = Math.max(maxX, point[0]);
    minZ = Math.min(minZ, point[1]);
    maxZ = Math.max(maxZ, point[1]);
  }
  if (![minX, maxX, minZ, maxZ].every(Number.isFinite)) return null;
  const segments = [];
  for (let index = 1; index < cityRevealWireframeDensity; index += 1) {
    const x = minX + (maxX - minX) * (index / cityRevealWireframeDensity);
    const z = minZ + (maxZ - minZ) * (index / cityRevealWireframeDensity);
    segments.push(
      new THREE.Vector3(xOffset + x, y, zOffset + minZ),
      new THREE.Vector3(xOffset + x, y, zOffset + maxZ),
      new THREE.Vector3(xOffset + minX, y, zOffset + z),
      new THREE.Vector3(xOffset + maxX, y, zOffset + z)
    );
  }
  const line = addCityWireLineSegments(segments, material);
  return tagCityRevealWireObject(line, 'wire-density');
}

export function cityRevealRoadGridExtraWidth() {
  return GRID_BLOCK * CITY_REVEAL_ROAD_GRID_EXTRA_BLOCKS;
}

export function cityRevealRoadGridHalfWidth() {
  return runtime.getDynamicRoadSurfaceWidth() / 2 + cityRevealRoadGridExtraWidth();
}

export function cityRevealRoadGridBounds() {
  const roadHalfW = runtime.getDynamicRoadSurfaceWidth() / 2;
  const roadMinZ = runtime.getDynamicRoadCenter() - runtime.getDynamicRoadLength() / 2;
  const roadMaxZ = runtime.getDynamicRoadCenter() + runtime.getDynamicRoadLength() / 2;
  const extra = cityRevealRoadGridExtraWidth();
  return {
    roadHalfW,
    roadMinZ,
    roadMaxZ,
    gridHalfW: roadHalfW + extra,
    gridMinZ: roadMinZ - extra,
    gridMaxZ: roadMaxZ + extra,
    fadeWidth: Math.max(0.001, extra),
  };
}

export function cityRevealRoadGridFadeAt(x, z, bounds) {
  const xOverflow = Math.max(0, Math.abs(x) - bounds.roadHalfW) / bounds.fadeWidth;
  const zOverflow = Math.max(0, bounds.roadMinZ - z, z - bounds.roadMaxZ) / bounds.fadeWidth;
  return THREE.MathUtils.clamp(1 - Math.max(xOverflow, zOverflow), 0, 1);
}

function cityRevealRoadGridSegmentTouchesRoadPerimeter(a, b, bounds) {
  const midX = (a[0] + b[0]) * 0.5;
  const midZ = (a[1] + b[1]) * 0.5;
  const verticalRoadEdge = Math.abs(Math.abs(midX) - bounds.roadHalfW) <= CITY_REVEAL_ROAD_PERIMETER_EPS;
  const horizontalRoadEdge = Math.abs(midZ - bounds.roadMinZ) <= CITY_REVEAL_ROAD_PERIMETER_EPS || Math.abs(midZ - bounds.roadMaxZ) <= CITY_REVEAL_ROAD_PERIMETER_EPS;
  return verticalRoadEdge || horizontalRoadEdge;
}

function cityRevealRoadGridStops(min, max, spacing) {
  const stops = [min];
  const first = Math.ceil(min / spacing) * spacing;
  for (let value = first; value < max - 0.001; value += spacing) {
    if (value > min + 0.001) stops.push(value);
  }
  stops.push(max);
  return stops;
}

function addCityRevealRoadGridSegment(buckets, a, b, y, bounds) {
  if (cityRevealRoadGridSegmentTouchesRoadPerimeter(a, b, bounds)) {
    cityRevealRoadGridSkippedPerimeterSegments += 1;
    return;
  }
  const midX = (a[0] + b[0]) * 0.5;
  const midZ = (a[1] + b[1]) * 0.5;
  const fade = cityRevealRoadGridFadeAt(midX, midZ, bounds);
  if (fade <= 0.02) return;
  const band = THREE.MathUtils.clamp(Math.ceil(fade * CITY_REVEAL_ROAD_GRID_FADE_BANDS), 1, CITY_REVEAL_ROAD_GRID_FADE_BANDS);
  if (!buckets.has(band)) buckets.set(band, []);
  buckets.get(band).push(
    new THREE.Vector3(a[0], y, a[1]),
    new THREE.Vector3(b[0], y, b[1])
  );
}

function addCityRevealRoadFade(y) {
  if (!CITY_REVEAL_ROAD_SOLID_FADE_ENABLED) return;
  if (cityRevealRoadGridExtraWidth() <= 0) return;
  const bounds = cityRevealRoadGridBounds();
  const fadeWidth = bounds.fadeWidth / CITY_REVEAL_ROAD_FADE_BANDS;
  const fadeY = y - 0.055;
  const fadeHeight = 0.08;

  for (let index = 0; index < CITY_REVEAL_ROAD_FADE_BANDS; index += 1) {
    const offset = fadeWidth * (index + 0.5);
    const sideWidth = fadeWidth;
    const sideDepth = runtime.getDynamicRoadLength();
    const endWidth = runtime.getDynamicRoadSurfaceWidth() + fadeWidth * 2 * (index + 1);
    const endDepth = fadeWidth;
    addCityWireRoadFadeBox(sideWidth, fadeHeight, sideDepth, -(bounds.roadHalfW + offset), fadeY, runtime.getDynamicRoadCenter(), index);
    addCityWireRoadFadeBox(sideWidth, fadeHeight, sideDepth, bounds.roadHalfW + offset, fadeY, runtime.getDynamicRoadCenter(), index);
    addCityWireRoadFadeBox(endWidth, fadeHeight, endDepth, 0, fadeY, bounds.roadMinZ - offset, index);
    addCityWireRoadFadeBox(endWidth, fadeHeight, endDepth, 0, fadeY, bounds.roadMaxZ + offset, index);
  }
}

function updateCityRevealRoadGridShaderUniforms(bounds) {
  const density = Math.max(1, cityRevealWireframeDensity);
  cityRevealRoadGridShaderMat.uniforms.uOpacity.value = cityRevealRoadGridShaderMat.opacity;
  cityRevealRoadGridShaderMat.uniforms.uXSpacing.value = (GRID_BLOCK * 1.5) / density;
  cityRevealRoadGridShaderMat.uniforms.uZSpacing.value = (GRID_BLOCK * 3) / density;
  cityRevealRoadGridShaderMat.uniforms.uRoadHalfW.value = bounds.roadHalfW;
  cityRevealRoadGridShaderMat.uniforms.uRoadMinZ.value = bounds.roadMinZ;
  cityRevealRoadGridShaderMat.uniforms.uRoadMaxZ.value = bounds.roadMaxZ;
  cityRevealRoadGridShaderMat.uniforms.uFadeWidth.value = bounds.fadeWidth;
  cityRevealRoadGridShaderMat.uniforms.uPerimeterEps.value = CITY_REVEAL_ROAD_PERIMETER_EPS;
}

function addCityRevealRoadGridPlane(y) {
  const bounds = cityRevealRoadGridBounds();
  const width = bounds.gridHalfW * 2;
  const depth = bounds.gridMaxZ - bounds.gridMinZ;
  const gridY = y + 0.06;
  const gridZ = (bounds.gridMinZ + bounds.gridMaxZ) * 0.5;
  updateCityRevealRoadGridShaderUniforms(bounds);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, 1, 1), cityRevealRoadGridShaderMat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, gridY, gridZ);
  mesh.frustumCulled = false;
  mesh.renderOrder = CITY_REVEAL_ROAD_GRID_RENDER_ORDER;
  mesh.userData.cityRevealRole = 'road-grid';
  mesh.userData.cityRevealRoadGridProcedural = true;
  setCityRevealObjectBoxBounds(mesh, 0.01, depth, gridY, gridZ);
  cityRevealRoadGridGroup.add(mesh);
  cityRevealRoadGridObjects.push(mesh);
  return mesh;
}

function addCityRevealRoadGrid(y) {
  if (CITY_REVEAL_ROAD_GRID_PROCEDURAL) {
    addCityRevealRoadGridPlane(y);
    return;
  }
  const bounds = cityRevealRoadGridBounds();
  const gridY = y + 0.06;
  const density = Math.max(1, cityRevealWireframeDensity);
  const xSpacing = (GRID_BLOCK * 1.5) / density;
  const zSpacing = (GRID_BLOCK * 3) / density;
  const buckets = new Map();
  const xStops = cityRevealRoadGridStops(-bounds.gridHalfW, bounds.gridHalfW, xSpacing);
  const zStops = cityRevealRoadGridStops(bounds.gridMinZ, bounds.gridMaxZ, zSpacing);

  for (let xIndex = 1; xIndex < xStops.length - 1; xIndex += 1) {
    const x = xStops[xIndex];
    for (let zIndex = 0; zIndex < zStops.length - 1; zIndex += 1) {
      addCityRevealRoadGridSegment(buckets, [x, zStops[zIndex]], [x, zStops[zIndex + 1]], gridY, bounds);
    }
  }

  for (let zIndex = 1; zIndex < zStops.length - 1; zIndex += 1) {
    const z = zStops[zIndex];
    for (let xIndex = 0; xIndex < xStops.length - 1; xIndex += 1) {
      addCityRevealRoadGridSegment(buckets, [xStops[xIndex], z], [xStops[xIndex + 1], z], gridY, bounds);
    }
  }

  for (const [band, points] of buckets.entries()) {
    const line = addCityRevealRoadGridLineSegments(points, cityRevealRoadGridMaterialForBand(band));
    line.userData.cityRevealRoadGridFadeBand = band;
    tagCityRevealWireObject(line, 'road-grid');
  }
}

function clearCityRevealWire() {
  // children.pop() torna Object3D; la geometria c'e' solo se e' un mesh, e il `?.` lo sa (2026-09-20).
  while (cityRevealWireGroup.children.length) {
    const object = /** @type {THREE.Object3D & Partial<THREE.Mesh>} */ (cityRevealWireGroup.children.pop());
    object.geometry?.dispose?.();
  }
  while (cityRevealRoadGridGroup.children.length) {
    const object = /** @type {THREE.Object3D & Partial<THREE.Mesh>} */ (cityRevealRoadGridGroup.children.pop());
    object.geometry?.dispose?.();
  }
  cityRevealWireObjects.length = 0;
  cityRevealRoadGridObjects.length = 0;
  cityRevealRoadFadeObjects.length = 0;
  cityRevealSolidObjects.length = 0;
  cityRevealWireCullObjects.length = 0;
  cityRevealWireCullStats.total = 0;
  cityRevealWireCullStats.visible = 0;
  cityRevealWireCullStats.hidden = 0;
  cityRevealWireCullStats.wireVisible = 0;
  cityRevealWireCullStats.solidVisible = 0;
  cityRevealWireCullStats.roadFadeVisible = 0;
  cityRevealRoadGridSkippedPerimeterSegments = 0;
  cityRevealWireCullRevision++;
}

export function cityRevealRoadSolidTopY() {
  const roadY = runtime.getRoadTopY() + 0.18;
  return (roadY - 0.03) + 0.12 * 0.5;
}

export function cityRevealSidewalkWireY(padTopY, roadY = runtime.getRoadTopY() + 0.18) {
  const surfaceY = Number.isFinite(padTopY) ? padTopY : DEFAULT_BASE_PAD_Y;
  return Math.max(surfaceY + 0.08, roadY + CITY_REVEAL_SIDEWALK_WIRE_ROAD_CLEARANCE);
}

function computeCityRevealSweepBounds() {
  const startBaseZ = Number.isFinite(runtime.getPlayerSpawn()?.z) ? runtime.getPlayerSpawn().z : runtime.camera.position.z;
  const startZ = startBaseZ + CITY_REVEAL_SWEEP_MARGIN_Z;
  const cityMinZValues = [];

  for (const record of runtime.getSideBuildingRecords()) {
    cityMinZValues.push(record.collider.z - record.collider.hd);
  }
  for (const record of runtime.getMainBuildingRecords()) {
    cityMinZValues.push(record.collider.z - record.collider.hd);
  }
  for (const record of runtime.getBridgeRecords()) {
    if (!record.mesh.visible) continue;
    cityMinZValues.push(record.mesh.position.z - Math.abs(record.baseDepth * record.mesh.scale.z) * 0.5);
  }

  const finiteCityMinZ = cityMinZValues.filter(Number.isFinite);
  const fallbackEndZ = runtime.getDynamicRoadCenter() - runtime.getDynamicRoadLength() * 0.5;
  let endZ = (finiteCityMinZ.length ? Math.min(...finiteCityMinZ) : fallbackEndZ) - CITY_REVEAL_SWEEP_MARGIN_Z;
  if (!Number.isFinite(endZ) || endZ >= startZ) endZ = startZ - GRID_BLOCK;
  return { startZ, endZ };
}

export function cityRevealFrontForProgress(progress) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  const warped = cityRevealWarpProgressForMainBuilding(t);
  return THREE.MathUtils.lerp(cityRevealSweepStartZ, cityRevealSweepEndZ, warped.progress);
}

export function setCityRevealSweepFront(frontZ) {
  cityRevealFrontZ = Number.isFinite(frontZ) ? frontZ : cityRevealSweepEndZ;
  cityRevealRealClipPlane.normal.copy(CITY_REVEAL_SWEEP_NORMAL);
  cityRevealRealClipPlane.constant = -cityRevealFrontZ * CITY_REVEAL_SWEEP_NORMAL.z;
  cityRevealScanGlow.update();
  updateCityRevealWireObjectCulling();
}

function cityRevealMainBuildingSlowZone() {
  const record = runtime.getMainBuildingRecords()[0];
  const collider = record?.collider;
  if (!record?.mesh || !collider) return null;
  const boxDepth = Math.abs(Number.isFinite(collider.hd) ? collider.hd * 2 : record.baseD || MAIN_BUILDING_BASE);
  const boxHeight = Math.abs(Number.isFinite(collider.h) ? collider.h : 230);
  const centerY = (Number.isFinite(collider.y) ? collider.y : record.mesh.position.y || 0) + boxHeight * 0.5;
  const centerZ = Number.isFinite(collider.z) ? collider.z : record.mesh.position.z;
  if (![boxDepth, boxHeight, centerY, centerZ].every(Number.isFinite) || boxDepth <= 0 || boxHeight <= 0) return null;
  const bounds = cityRevealBoxSweepBounds(centerZ, boxDepth * 0.5, centerY, boxHeight * 0.5);
  return {
    low: bounds.min,
    high: bounds.max,
    centerZ,
    centerY,
    depth: boxDepth,
    height: boxHeight,
  };
}

function cityRevealWarpProgressForMainBuilding(progress) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  const total = cityRevealSweepStartZ - cityRevealSweepEndZ;
  const zone = cityRevealMainBuildingSlowZone();
  const speed = THREE.MathUtils.clamp(CITY_REVEAL_MAIN_BUILDING_SLOW_SPEED, 0.05, 1);
  if (!zone || speed >= 0.999 || !Number.isFinite(total) || total <= 0) {
    return { progress: t, active: false, zone: null };
  }

  const zoneStartDistance = THREE.MathUtils.clamp(cityRevealSweepStartZ - zone.high, 0, total);
  const zoneEndDistance = THREE.MathUtils.clamp(cityRevealSweepStartZ - zone.low, 0, total);
  const zoneDistance = zoneEndDistance - zoneStartDistance;
  if (!Number.isFinite(zoneDistance) || zoneDistance <= 0.001) {
    return { progress: t, active: false, zone: null };
  }

  const weight = 1 / speed;
  const weightedTotal = total + zoneDistance * (weight - 1);
  const weightedDistance = t * weightedTotal;
  let distance;
  if (weightedDistance <= zoneStartDistance) {
    distance = weightedDistance;
  } else if (weightedDistance <= zoneStartDistance + zoneDistance * weight) {
    distance = zoneStartDistance + (weightedDistance - zoneStartDistance) / weight;
  } else {
    distance = zoneStartDistance + zoneDistance + (weightedDistance - zoneStartDistance - zoneDistance * weight);
  }
  distance = THREE.MathUtils.clamp(distance, 0, total);
  const active = distance >= zoneStartDistance && distance <= zoneEndDistance;
  return {
    progress: distance / total,
    active,
    zone: {
      ...zone,
      startProgress: zoneStartDistance / total,
      endProgress: zoneEndDistance / total,
      speed,
      weight,
    },
  };
}

export function cityRevealMainBuildingSlowDiagnostics() {
  const warped = cityRevealWarpProgressForMainBuilding(cityRevealSweepProgress);
  return {
    enabled: Boolean(warped.zone),
    active: Boolean(warped.active),
    speed: CITY_REVEAL_MAIN_BUILDING_SLOW_SPEED,
    timeScale: 1 / CITY_REVEAL_MAIN_BUILDING_SLOW_SPEED,
    zone: warped.zone,
  };
}

export function refreshCityRevealSweepBounds() {
  const bounds = computeCityRevealSweepBounds();
  cityRevealSweepStartZ = bounds.startZ;
  cityRevealSweepEndZ = bounds.endZ;
  setCityRevealSweepFront(cityRevealFrontForProgress(cityRevealSweepProgress));
}

export function cityRevealEstimatedVisibleObjects() {
  if (!cityRevealWireframeEnabled || cityRevealWireAlpha <= 0.002 || !cityRevealWireGroup.visible) return 0;
  return cityRevealWireCullStats.visible;
}

function cityRevealObjectStillWireVisible(object) {
  if (!object) return false;
  const minSweep = object.userData.cityRevealMinSweep
    ?? object.userData.cityRevealSweep
    ?? cityRevealSweepValueAt(object.userData.cityRevealMinZ ?? object.position.z, object.position.y);
  if (!Number.isFinite(minSweep)) return true;
  return minSweep < cityRevealFrontZ;
}

function updateCityRevealWireObjectCulling() {
  const count = cityRevealWireCullObjects.length;
  const groupVisible = cityRevealWireAlpha > 0.002 && cityRevealWireGroup.visible;
  const roundedFrontZ = Number(cityRevealFrontZ.toFixed(3));
  const roundedAlpha = Number(cityRevealWireAlpha.toFixed(4));
  if (
    cityRevealWireCullCache.revision === cityRevealWireCullRevision &&
    cityRevealWireCullCache.count === count &&
    cityRevealWireCullCache.frontZ === roundedFrontZ &&
    cityRevealWireCullCache.alpha === roundedAlpha &&
    cityRevealWireCullCache.groupVisible === groupVisible
  ) {
    return;
  }
  cityRevealWireCullCache.revision = cityRevealWireCullRevision;
  cityRevealWireCullCache.count = count;
  cityRevealWireCullCache.frontZ = roundedFrontZ;
  cityRevealWireCullCache.alpha = roundedAlpha;
  cityRevealWireCullCache.groupVisible = groupVisible;
  const stats = cityRevealWireCullStats;
  stats.total = count;
  stats.visible = 0;
  stats.hidden = 0;
  stats.wireVisible = 0;
  stats.solidVisible = 0;
  stats.roadFadeVisible = 0;
  for (const object of cityRevealWireCullObjects) {
    const visible = groupVisible && cityRevealObjectStillWireVisible(object);
    object.visible = visible;
    if (visible) {
      stats.visible++;
      if (object.userData.cityRevealCullKind === 'solid') stats.solidVisible++;
      else if (object.userData.cityRevealCullKind === 'road-fade') stats.roadFadeVisible++;
      else stats.wireVisible++;
    } else {
      stats.hidden++;
    }
  }
}

export function buildCityRevealWireframe() {
  clearCityRevealWire();
  const roadY = runtime.getRoadTopY() + 0.18;
  if (CITY_REVEAL_ROAD_SOLID_BACKING_ENABLED) {
    addCityWireSolidBox(runtime.getDynamicRoadSurfaceWidth(), 0.12, runtime.getDynamicRoadLength(), 0, roadY - 0.03, runtime.getDynamicRoadCenter(), 'road-solid');
  }
  addCityRevealRoadFade(roadY);
  addCityWireBox(runtime.getDynamicRoadSurfaceWidth(), 0.08, runtime.getDynamicRoadLength(), 0, roadY, runtime.getDynamicRoadCenter(), cityRevealWireDimMat);
  addCityRevealRoadGrid(roadY);
  for (const record of runtime.getSideBuildingRecords()) {
    const h = record.collider.h;
    const boxWidth = record.collider.hw * 2;
    const boxDepth = record.collider.hd * 2;
    const boxY = record.collider.y + h * 0.5;
    addCityWireSolidBox(boxWidth, h, boxDepth, record.collider.x, boxY, record.collider.z);
    addCityWireBox(boxWidth, h, boxDepth, record.collider.x, boxY, record.collider.z, cityRevealWireMat);
    addCityWireBoxDensity(boxWidth, h, boxDepth, record.collider.x, boxY, record.collider.z, cityRevealWireDimMat);
    const pad = record.basePad;
    const padX = pad?.border?.position?.x ?? record.collider.x;
    const padZ = pad?.border?.position?.z ?? record.collider.z;
    const padY = cityRevealSidewalkWireY(pad?.topY, roadY);
    addCityWireLoop(pad?.hitPolygon, padY, padX, padZ, cityRevealWireCoreMat);
    if (CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED) {
      addCityWireLoopDensity(pad?.hitPolygon, padY, padX, padZ, cityRevealWireDimMat);
    }
    if (CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED && pad?.innerHitPolygon?.length) {
      const innerY = cityRevealSidewalkWireY(pad.innerTopY ?? pad.topY, roadY);
      addCityWireLoop(pad.innerHitPolygon, innerY, pad.border.position.x, pad.border.position.z, cityRevealWireDimMat);
      addCityWireLoopDensity(pad.innerHitPolygon, innerY, pad.border.position.x, pad.border.position.z, cityRevealWireDimMat);
    }
  }
  for (const record of runtime.getMainBuildingRecords()) {
    const h = record.collider.h;
    const boxWidth = record.collider.hw * 2;
    const boxDepth = record.collider.hd * 2;
    const boxY = record.collider.y + h * 0.5;
    addCityWireSolidBox(boxWidth, h, boxDepth, record.mesh.position.x, boxY, record.collider.z);
    addCityWireBox(boxWidth, h, boxDepth, record.mesh.position.x, boxY, record.collider.z, cityRevealWireCoreMat);
    addCityWireBoxDensity(boxWidth, h, boxDepth, record.mesh.position.x, boxY, record.collider.z, cityRevealWireDimMat);
    const pad = record.basePad;
    const padX = pad?.border?.position?.x ?? record.mesh.position.x;
    const padZ = pad?.border?.position?.z ?? record.collider.z;
    const padY = cityRevealSidewalkWireY(pad?.topY, roadY);
    addCityWireLoop(pad?.hitPolygon, padY, padX, padZ, cityRevealWireCoreMat);
    if (CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED) {
      addCityWireLoopDensity(pad?.hitPolygon, padY, padX, padZ, cityRevealWireDimMat);
    }
    if (CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED && pad?.innerHitPolygon?.length) {
      const innerY = cityRevealSidewalkWireY(pad.innerTopY ?? pad.topY, roadY);
      addCityWireLoop(pad.innerHitPolygon, innerY, pad.border.position.x, pad.border.position.z, cityRevealWireDimMat);
      addCityWireLoopDensity(pad.innerHitPolygon, innerY, pad.border.position.x, pad.border.position.z, cityRevealWireDimMat);
    }
  }
  for (const record of runtime.getBridgeRecords()) {
    if (!record.mesh.visible) continue;
    const boxWidth = record.baseWidth * record.mesh.scale.x;
    const boxHeight = record.baseHeight * record.mesh.scale.y;
    const boxDepth = record.baseDepth * record.mesh.scale.z;
    const boxY = record.mesh.position.y + boxHeight * 0.5;
    addCityWireSolidBox(boxWidth, boxHeight, boxDepth, record.mesh.position.x, boxY, record.mesh.position.z, 'bridge-solid');
  }
  for (const spec of runtime.getEdgeStripSpecs()) {
    if (spec.edgeRole === 'main-building' && !CITY_REVEAL_MAIN_BUILDING_LED_WIREFRAME_ENABLED) {
      continue;
    }
    if (spec.edgeRole === 'bridge') {
      addCityWireStripCenterline(spec, cityRevealWireDimMat);
      continue;
    }
    if (!spec.mesh?.visible || !spec.mesh.geometry) continue;
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(spec.mesh.geometry), spec.edgeRole === 'main-building' ? cityRevealWireCoreMat : cityRevealWireDimMat);
    spec.mesh.updateWorldMatrix(true, false);
    edge.matrix.copy(spec.mesh.matrixWorld);
    edge.matrixAutoUpdate = false;
    edge.frustumCulled = false;
    cityRevealBoundsBox.setFromObject(spec.mesh);
    setCityRevealObjectBoundsFromBox(edge, cityRevealBoundsBox);
    edge.userData.cityRevealCullKind = 'wire';
    edge.userData.cityRevealRole = spec.edgeRole === 'main-building' ? 'main-led-wire' : `${spec.edgeRole || 'edge'}-led-wire`;
    cityRevealWireGroup.add(edge);
    cityRevealWireObjects.push(edge);
    cityRevealWireCullObjects.push(edge);
  }
  refreshCityRevealSweepBounds();
}

export function setCityRevealWireAlpha(alpha) {
  cityRevealWireAlpha = cityRevealWireframeEnabled ? alpha : 0;
  cityRevealBackplateMat.opacity = cityRevealWireAlpha * cityRevealBackplateOpacityScale * cityRevealBackplateRevealFactor * CITY_REVEAL_MAX_SKY_BACKPLATE_OPACITY;
  cityRevealBackplate.visible = cityRevealBackplateMat.opacity > 0.002;
  cityRevealSolidMat.opacity = cityRevealWireAlpha;
  cityRevealSolidMat.visible = cityRevealWireAlpha > 0.002;
  for (const material of cityRevealWireMaterials) {
    const roadGridFactor = material.userData.cityRevealRoadGridMaterial ? cityRevealRoadGridAlphaFactor : 1;
    material.opacity = material.userData.baseOpacity * cityRevealWireOpacityScale * cityRevealWireAlpha * roadGridFactor;
    material.visible = material.opacity > 0.002;
    if (material.userData.cityRevealRoadGridShaderMaterial && material.uniforms?.uOpacity) {
      material.uniforms.uOpacity.value = material.opacity;
    }
  }
  cityRevealWireGroup.visible = cityRevealWireAlpha > 0.002;
  cityRevealRoadGridGroup.visible = cityRevealWireAlpha > 0.002;
  updateCityRevealWireObjectCulling();
}

export function setCityRevealRoadGridAlphaFactor(factor) {
  cityRevealRoadGridAlphaFactor = THREE.MathUtils.clamp(Number(factor) || 0, 0, 1);
}

export function isCityRevealBackplateActive() {
  return cityRevealBackplate.visible && cityRevealBackplateMat.opacity > 0.002;
}

// Cheap public signal of "the reveal is over" for the page chrome in index.html.
// It used to poll __tronInspect() every 400ms just to read this one boolean,
// rebuilding the whole diagnostic dump each time — inside the very window the
// rest of the code protects by freezing the secondary effects.
function publishCityRevealCompleteFlag(complete) {
  if (typeof window === 'undefined') return;
  window.__tronRevealComplete = complete;
  if (complete) window.dispatchEvent(new CustomEvent('tron-reveal-complete'));
}

export function markCityRevealComplete(now = performance.now()) {
  const wasComplete = cityRevealComplete;
  if (!cityRevealComplete || !cityRevealCompletedAt) {
    cityRevealCompletedAt = Number.isFinite(now) && now > 0 ? now : performance.now();
  }
  cityRevealComplete = true;
  runtime.syncCityRevealSkyMaterial();
  if (!wasComplete) publishCityRevealCompleteFlag(true);
}

export function startCityRevealWireframe() {
  if (!cityRevealWireframeEnabled) {
    clearCityRevealWire();
    markCityRevealComplete();
    cityRevealSweepProgress = 1;
    cityRevealBackplateRevealFactor = 0;
    setCityRevealRoadGridAlphaFactor(0);
    setCityRevealWireAlpha(0);
    runtime.updatePointerLockHint();
    return;
  }
  cityRevealSweepProgress = 0;
  cityRevealBackplateRevealFactor = 1;
  setCityRevealRoadGridAlphaFactor(1);
  buildCityRevealWireframe();
  setCityRevealSweepFront(cityRevealSweepStartZ);
  cityRevealStartedAt = 0;
  cityRevealArmedAt = 0;
  cityRevealComplete = false;
  cityRevealCompletedAt = 0;
  cityRevealWaitingForVisibleFrame = false;
  publishCityRevealCompleteFlag(false);
  setCityRevealWireAlpha(1);
  runtime.stopMouseLookInput();
}

export function startCityRevealWireTimer() {
  if (!cityRevealWireframeEnabled) return;
  if (cityRevealComplete || cityRevealStartedAt || cityRevealArmedAt || cityRevealWaitingForVisibleFrame) return;
  cityRevealWaitingForVisibleFrame = true;
}

export function updateCityRevealWireframe(now) {
  if (!cityRevealWireframeEnabled) {
    markCityRevealComplete(now);
    cityRevealSweepProgress = 1;
    cityRevealBackplateRevealFactor = 0;
    setCityRevealRoadGridAlphaFactor(0);
    setCityRevealWireAlpha(0);
    runtime.updatePointerLockHint();
    return;
  }
  if (cityRevealComplete) return;
  if (cityRevealWaitingForVisibleFrame) {
    cityRevealArmedAt = Number.isFinite(now) && now > 0 ? now : performance.now() || 1;
    cityRevealWaitingForVisibleFrame = false;
    cityRevealSweepProgress = 0;
    cityRevealBackplateRevealFactor = 1;
    setCityRevealRoadGridAlphaFactor(1);
    setCityRevealSweepFront(cityRevealSweepStartZ);
    setCityRevealWireAlpha(1);
    return;
  }
  if (cityRevealArmedAt && !cityRevealStartedAt) {
    const armedElapsed = now - cityRevealArmedAt;
    const sync = runtime.getSoundtrackSyncState ? runtime.getSoundtrackSyncState() : null;
    const musicClockUsable = Boolean(sync?.playing)
      && Number.isFinite(sync.currentTime) && sync.currentTime > 0
      && Number.isFinite(sync.dropAtSeconds) && sync.dropAtSeconds > 0;
    let shouldStart;
    if (musicClockUsable) {
      // The track is the master clock: the sweep fires when the music reaches
      // its beat drop, so audio and reveal cannot drift. Release the intro
      // lofi one fade ahead so the sound is fully open ON the drop.
      const dropStartSeconds = sync.dropAtSeconds - CITY_REVEAL_BEAT_DROP_LEAD_MS / 1000;
      const releaseFade = Number.isFinite(sync.lofiReleaseFadeSeconds) ? sync.lofiReleaseFadeSeconds : 0;
      if (sync.currentTime >= dropStartSeconds - releaseFade) {
        runtime.scheduleTronSoundtrackIntroLofiStopForReveal(0);
      }
      shouldStart = sync.currentTime >= dropStartSeconds
        || armedElapsed >= cityRevealEffectiveDelayMs() + CITY_REVEAL_MUSIC_WAIT_CAP_MS;
    } else {
      shouldStart = armedElapsed >= cityRevealEffectiveDelayMs();
    }
    if (!shouldStart) return;
    cityRevealStartedAt = now - cityRevealEffectiveDelayMs();
    cityRevealSweepProgress = 0;
    cityRevealBackplateRevealFactor = 1;
    setCityRevealRoadGridAlphaFactor(1);
    setCityRevealSweepFront(cityRevealSweepStartZ);
    setCityRevealWireAlpha(1);
  }
  if (!cityRevealStartedAt) return;
  const elapsed = now - cityRevealStartedAt;
  const fadeDuration = cityRevealFadeDurationMs();
  const t = THREE.MathUtils.clamp((elapsed - cityRevealEffectiveDelayMs()) / fadeDuration, 0, 1);
  if (t > 0) runtime.scheduleTronSoundtrackIntroLofiStopForReveal();
  const eased = t * t * (3 - 2 * t);
  cityRevealSweepProgress = eased;
  cityRevealBackplateRevealFactor = 1 - THREE.MathUtils.clamp(t / CITY_REVEAL_BACKPLATE_SWEEP_PORTION, 0, 1);
  setCityRevealRoadGridAlphaFactor(1);
  setCityRevealSweepFront(cityRevealFrontForProgress(eased));
  setCityRevealWireAlpha(1);
  if (t >= 1) {
    cityRevealSweepProgress = 1;
    cityRevealBackplateRevealFactor = 0;
    setCityRevealRoadGridAlphaFactor(0);
    setCityRevealSweepFront(cityRevealSweepEndZ);
    setCityRevealWireAlpha(0);
    markCityRevealComplete(now);
    runtime.updatePointerLockHint();
    // one-shot reveal finished: the render/update paths now early-return on cityRevealComplete,
    // so free the wireframe geometries (they are never drawn again this session)
    clearCityRevealWire();
  }
}

export function isCityRevealCompositeActive() {
  return cityRevealWireframeEnabled && cityRevealWireAlpha > 0.002;
}

export function isCityRevealRealRevealActive() {
  return isCityRevealCompositeActive()
    && cityRevealStartedAt > 0
    && cityRevealSweepProgress > 0.002
    && !cityRevealComplete;
}

export function isCityRevealPerformanceCritical() {
  return Boolean(
    cityRevealWireframeEnabled &&
    !cityRevealComplete &&
    (cityRevealWaitingForVisibleFrame || cityRevealArmedAt > 0 || cityRevealStartedAt > 0)
  );
}

export function setCityRevealWireframeSettings({ enabled, delayMs, fadeMs, density, opacityScale, backplateOpacityScale }) {
  cityRevealWireframeEnabled = enabled;
  cityRevealDelayMs = delayMs;
  cityRevealFadeMs = fadeMs;
  cityRevealWireframeDensity = density;
  cityRevealWireOpacityScale = opacityScale;
  cityRevealBackplateOpacityScale = backplateOpacityScale;
}

export function applyCityRevealWireframeDisabledControlsState() {
  markCityRevealComplete();
  cityRevealSweepProgress = 1;
  cityRevealBackplateRevealFactor = 0;
  setCityRevealWireAlpha(0);
}

export function snapshotCityRevealWireframeState() {
  return {
    complete: cityRevealComplete,
    completedAt: cityRevealCompletedAt,
    startedAt: cityRevealStartedAt,
    waitingForVisibleFrame: cityRevealWaitingForVisibleFrame,
    sweepProgress: cityRevealSweepProgress,
    backplateRevealFactor: cityRevealBackplateRevealFactor,
    roadGridAlphaFactor: cityRevealRoadGridAlphaFactor,
    wireAlpha: cityRevealWireAlpha,
  };
}

export function setCityRevealPostProcessingPrewarmState(now = performance.now()) {
  cityRevealComplete = true;
  cityRevealCompletedAt = now;
  cityRevealStartedAt = 1;
  cityRevealWaitingForVisibleFrame = false;
  cityRevealSweepProgress = 1;
  cityRevealBackplateRevealFactor = 0;
  setCityRevealRoadGridAlphaFactor(0);
  setCityRevealWireAlpha(0);
}

export function restoreCityRevealWireframeState(snapshot) {
  cityRevealComplete = snapshot.complete;
  cityRevealCompletedAt = snapshot.completedAt;
  cityRevealStartedAt = snapshot.startedAt;
  cityRevealWaitingForVisibleFrame = snapshot.waitingForVisibleFrame;
  cityRevealSweepProgress = snapshot.sweepProgress;
  cityRevealBackplateRevealFactor = snapshot.backplateRevealFactor;
  setCityRevealRoadGridAlphaFactor(snapshot.roadGridAlphaFactor);
  setCityRevealWireAlpha(snapshot.wireAlpha);
}

