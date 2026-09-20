import * as THREE from 'three';
import { fxEnabled } from '../engine/fx-debug-toggles.js';
import {
  MAIN_BUILDING_BASE,
  SIDE_BUILDING_BASE,
  SIDE_BUILDING_SPACING,
} from './boulevard-constants.js';
import { applyEdgePulseShader } from './energy-pulse.js';

let PAL = null;
let roadHalf = () => 0;
let getMainBuildingY = () => 0;
let getMainBuildingZ = () => 0;
let getBridgeXOffset = () => 0;
let getBridgeZOffset = () => 0;
let getBridgeYOffset = () => 0;
let getBridgeSpanScale = () => 1;
let getBridgeHeightScale = () => 1;
let getBridgeDepthScale = () => 1;
// I segnaposto delle dipendenze portano la firma della funzione vera (2026-09-20):
// da `() => {}` tsc deduceva `() => void` e ogni chiamata con argomenti era un
// TS2554. Firme confrontate con l'originale: combaciano, erano tipi e non bug.
/** @type {(scalaLarghezzaLaterale?: number, larghezzaBordoStrada?: number) => number} bridges.spanLength */ let bridgeSpanLength = () => 1;
/** @type {typeof import('../controls/bridge-controls.js').readBridgeNumber} */ let readBridgeNumber = () => 0;
/** @type {typeof import('../controls/bridge-controls.js').readBridgeVisible} */ let readBridgeVisible = () => true;
/** @type {(oggetto: THREE.Object3D | null) => void} */ let refreshCullingBounds = () => {};
let createFacadeLedMaterial = null;
/** @type {typeof import('./facade-led-treatment.js').updateFacadeStripOutsets} */ let updateFacadeStripOutsets = () => {};
/** @type {typeof import('./facade-led-treatment.js').updateFacadeLedRibbons} */ let updateFacadeLedRibbons = () => {};

export const edgeStripSpecs = [];
const sideBuildingEdgeSpecs = [];
const bridgeEdgeSpecs = [];
export const horizontalBuildingLedRings = [];

export const sideBuildingEdgeBatch = {
  mesh: null,
  material: null,
  enabled: true,
};

export const bridgeEdgeBatch = {
  mesh: null,
  material: null,
};

export const sideHorizontalLedRingBatches = {
  low: { mesh: null, material: null, specs: [], geometryKey: '', count: 0 },
  high: { mesh: null, material: null, specs: [], geometryKey: '', count: 0 },
};

let ledDistance = 0;
let buildingHorizontalLedDistance = 0;
let mainBuildingVerticalLedDistance = 0;
let mainBuildingHorizontalLedDistance = 0;
let edgeStripThickness = 0.275;
let buildingHorizontalLedThickness = 0.275;
let mainBuildingHorizontalLedThickness = 0.275;
let buildingHorizontalLedRadius = 1;
let mainBuildingHorizontalLedRadius = 1;
let buildingVerticalLedLength = 1;
let mainBuildingVerticalLedLength = 1;
let buildingVerticalLedY = 0;
let buildingLowLedY = 0;
let buildingHighLedY = 0;
let mainBuildingVerticalLedY = 0;
let mainBuildingLowLedY = 0;
let mainBuildingHighLedY = 0;

const sideHorizontalLedRingMatrix = new THREE.Matrix4();
const sideHorizontalLedRingPosition = new THREE.Vector3();
const sideHorizontalLedRingQuaternion = new THREE.Quaternion();
const sideHorizontalLedRingScale = new THREE.Vector3(1, 1, 1);

export function initBuildingLeds(deps) {
  PAL = deps.PAL;
  roadHalf = deps.roadHalf;
  getMainBuildingY = deps.getMainBuildingY;
  getMainBuildingZ = deps.getMainBuildingZ;
  getBridgeXOffset = deps.getBridgeXOffset;
  getBridgeZOffset = deps.getBridgeZOffset;
  getBridgeYOffset = deps.getBridgeYOffset;
  getBridgeSpanScale = deps.getBridgeSpanScale;
  getBridgeHeightScale = deps.getBridgeHeightScale;
  getBridgeDepthScale = deps.getBridgeDepthScale;
  bridgeSpanLength = deps.bridgeSpanLength;
  readBridgeNumber = deps.readBridgeNumber;
  readBridgeVisible = deps.readBridgeVisible;
  refreshCullingBounds = deps.refreshCullingBounds;
  createFacadeLedMaterial = deps.createFacadeLedMaterial;
  updateFacadeStripOutsets = deps.updateFacadeStripOutsets;
  updateFacadeLedRibbons = deps.updateFacadeLedRibbons;
}

// getSpacedPoints() arc-length samples the whole rounded rectangle, and the ring
// updates ask for the same shape over and over (a live-control drag re-runs them
// once per frame). The result depends only on the arguments, so memoize it.
const buildingEdgeLoopPointsCache = new Map();
const BUILDING_EDGE_LOOP_POINTS_CACHE_MAX = 64;

function buildingEdgeLoopPoints(w, d, chamfer = 1.5, outset = 0, samples = 72) {
  const cacheKey = `${w}|${d}|${chamfer}|${outset}|${samples}`;
  const cached = buildingEdgeLoopPointsCache.get(cacheKey);
  if (cached) return cached;
  const points = computeBuildingEdgeLoopPoints(w, d, chamfer, outset, samples);
  if (buildingEdgeLoopPointsCache.size >= BUILDING_EDGE_LOOP_POINTS_CACHE_MAX) {
    buildingEdgeLoopPointsCache.delete(buildingEdgeLoopPointsCache.keys().next().value);
  }
  buildingEdgeLoopPointsCache.set(cacheKey, points);
  return points;
}

function computeBuildingEdgeLoopPoints(w, d, chamfer = 1.5, outset = 0, samples = 72) {
  const hw = w / 2 + outset;
  const hd = d / 2 + outset;
  const c = Math.min(chamfer + outset, hw * 0.8, hd * 0.8);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + c, -hd);
  shape.lineTo(hw - c, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + c);
  shape.lineTo(hw, hd - c);
  shape.quadraticCurveTo(hw, hd, hw - c, hd);
  shape.lineTo(-hw + c, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - c);
  shape.lineTo(-hw, -hd + c);
  shape.quadraticCurveTo(-hw, -hd, -hw + c, -hd);
  const points = shape.getSpacedPoints(Math.max(12, Math.round(samples))).map((point) => [point.x, point.y]);
  const last = points[points.length - 1];
  if (last && Math.hypot(last[0] - points[0][0], last[1] - points[0][1]) < 0.001) points.pop();
  return points;
}

function makeHorizontalLedRingPath(points) {
  const path = new THREE.Path();
  if (!points.length) return path;
  path.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) path.lineTo(points[i][0], points[i][1]);
  path.closePath();
  return path;
}

function makeHorizontalLedRingGeometry(w, d, chamfer, distance, stripWidth, radiusScale = 1) {
  const width = Math.max(0.04, stripWidth);
  const height = Math.max(0.03, width * 0.34);
  const radius = Math.max(0.01, chamfer * radiusScale);
  const outerPoints = buildingEdgeLoopPoints(w, d, radius, distance + width * 0.5, 96);
  const innerLimit = -Math.min(w, d) * 0.48;
  const innerOutset = Math.max(innerLimit, distance - width * 0.5);
  // slice() first: buildingEdgeLoopPoints hands back a memoized array now, so
  // reversing it in place would corrupt the cached entry for every other caller.
  const innerPoints = buildingEdgeLoopPoints(w, d, radius, innerOutset, 96).slice().reverse();
  const shape = new THREE.Shape();
  if (outerPoints.length) {
    shape.moveTo(outerPoints[0][0], outerPoints[0][1]);
    for (let i = 1; i < outerPoints.length; i++) shape.lineTo(outerPoints[i][0], outerPoints[i][1]);
    shape.closePath();
  }
  shape.holes.push(makeHorizontalLedRingPath(innerPoints));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    steps: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.userData.ledHeight = height;
  return geo;
}

function ensureHorizontalLedLoopSegments(spec, count) {
  if (!spec.segmentGroup || !spec.material) return;
  const needed = Math.max(1, count);
  if (spec.segmentMesh && spec.segmentCapacity >= needed) {
    spec.segmentMesh.count = count;
    return;
  }
  if (spec.segmentMesh) {
    spec.segmentGroup.remove(spec.segmentMesh);
    spec.segmentMesh.geometry.dispose();
    // also free the retired InstancedMesh's instanceMatrix GL buffer
    spec.segmentMesh.dispose();
  }
  const capacity = Math.max(needed, Math.ceil(needed * 1.2));
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), spec.material, capacity);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = true;
  mesh.renderOrder = 8;
  mesh.count = count;
  spec.segmentMesh = mesh;
  spec.segmentCapacity = capacity;
  spec.segmentGroup.add(mesh);
}

// Reused per segment: the ring is up to 128 segments and is rebuilt whenever the
// controls move, so a pair of fresh 3-element arrays per segment added up.
const horizontalLedLoopP1Scratch = [0, 0, 0];
const horizontalLedLoopP2Scratch = [0, 0, 0];

function updateHorizontalLedLoopSegments(spec, width, depth, chamfer, distance, stripWidth, radiusScale, centerX, centerY, centerZ, widthScale = 1, depthScale = 1) {
  const radius = Math.max(0.01, chamfer * radiusScale);
  const points = buildingEdgeLoopPoints(width, depth, radius, distance, 128);
  ensureHorizontalLedLoopSegments(spec, points.length);
  if (!points.length) return;
  const p1 = horizontalLedLoopP1Scratch;
  const p2 = horizontalLedLoopP2Scratch;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    p1[0] = centerX + a[0] * widthScale;
    p1[1] = centerY;
    p1[2] = centerZ + a[1] * depthScale;
    p2[0] = centerX + b[0] * widthScale;
    p2[1] = centerY;
    p2[2] = centerZ + b[1] * depthScale;
    setStripInstanceTransform(spec.segmentMesh, i, p1, p2, stripWidth);
  }
  spec.segmentMesh.instanceMatrix.needsUpdate = true;
  refreshCullingBounds(spec.segmentMesh);
  spec.segmentCount = points.length;
}

function sideHorizontalLedRingBatchForBand(edgeBand = 'low') {
  return edgeBand === 'high' ? sideHorizontalLedRingBatches.high : sideHorizontalLedRingBatches.low;
}

function getSideHorizontalLedRingMaterial(batch, color = PAL.tealLight) {
  if (batch.material) return batch.material;
  batch.material = new THREE.MeshBasicMaterial({
    color,
    toneMapped: false,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
  return batch.material;
}

function sideHorizontalLedRingGeometryKey(width, depth, chamfer, distance, stripWidth, radiusScale) {
  return [
    width,
    depth,
    chamfer,
    distance,
    stripWidth,
    radiusScale,
  ].map((value) => Number(value).toFixed(3)).join(':');
}

function updateSideHorizontalLedRingBatchGeometry(batch, width, depth, chamfer, distance, stripWidth, radiusScale) {
  if (!batch.mesh) return;
  const key = sideHorizontalLedRingGeometryKey(width, depth, chamfer, distance, stripWidth, radiusScale);
  if (batch.geometryKey === key) return;
  const nextGeometry = makeHorizontalLedRingGeometry(width, depth, chamfer, distance, stripWidth, radiusScale);
  batch.mesh.geometry.dispose();
  batch.mesh.geometry = nextGeometry;
  batch.geometryKey = key;
}

export function buildSideHorizontalLedRingBatches(group) {
  for (const batch of Object.values(sideHorizontalLedRingBatches)) {
    if (!batch.specs.length || batch.mesh) continue;
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), getSideHorizontalLedRingMaterial(batch), batch.specs.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = true;
    mesh.renderOrder = 8;
    mesh.count = batch.specs.length;
    batch.mesh = mesh;
    batch.count = batch.specs.length;
    group.add(mesh);
  }
}

export function addHorizontalBuildingLedRing(group, w, d, x, y, z, color, options, chamfer, distance = 0) {
  const segmentMode = options.edgeRole === 'main-building';
  const sideBatchMode = options.edgeRole === 'side-building';
  const sideBatch = sideBatchMode ? sideHorizontalLedRingBatchForBand(options.edgeBand) : null;
  const material = segmentMode
    ? createFacadeLedMaterial(color)
    : sideBatchMode
      ? getSideHorizontalLedRingMaterial(sideBatch, color)
    : new THREE.MeshBasicMaterial({
      color,
      toneMapped: false,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
  const mesh = segmentMode || sideBatchMode ? null : new THREE.Mesh(makeHorizontalLedRingGeometry(w, d, chamfer, distance, edgeStripThickness, 1), material);
  const segmentGroup = segmentMode ? new THREE.Group() : null;
  if (mesh) {
    const height = mesh.geometry.userData.ledHeight || Math.max(0.03, edgeStripThickness * 0.34);
    mesh.position.set(x, y - height * 0.5, z);
  }
  const spec = {
    mesh,
    segmentGroup,
    segmentMesh: null,
    segmentCapacity: 0,
    segmentCount: 0,
    segmentMode,
    material,
    w,
    d,
    chamfer,
    distance,
    baseY: y,
    center: options.center ? [...options.center] : [x, z],
    edgeRole: options.edgeRole || 'global',
    edgeBand: options.edgeBand || 'low',
    baseColor: new THREE.Color(color),
  };
  horizontalBuildingLedRings.push(spec);
  if (sideBatchMode && sideBatch) {
    spec.batchRecord = sideBatch;
    spec.batchInstanceId = sideBatch.specs.length;
    sideBatch.specs.push(spec);
    return new THREE.Object3D();
  }
  if (segmentMode) {
    group.add(segmentGroup);
    updateHorizontalLedLoopSegments(spec, w, d, chamfer, distance, edgeStripThickness, 1, x, y, z);
    return segmentGroup;
  }
  group.add(mesh);
  return mesh;
}

export function elStrip(p1, p2, color = PAL.tealLight, thickness = 0.04, options = {}) {
  if (options.edge && options.edgeRole === 'side-building') {
    const spec = {
      mesh: null,
      p1: [...p1],
      p2: [...p2],
      center: options.center ? [...options.center] : [0, 0],
      centerY: options.centerY ?? 0,
      baseColor: new THREE.Color(color),
      edgeRole: options.edgeRole || 'global',
      edgeBand: options.edgeBand || 'body',
      roundedLoopOffsetMode: Boolean(options.roundedLoopOffsetMode),
      bridgeRecord: null,
      instanceId: sideBuildingEdgeSpecs.length,
    };
    sideBuildingEdgeSpecs.push(spec);
    edgeStripSpecs.push(spec);
    return new THREE.Object3D();
  }
  if (options.edge && options.edgeRole === 'bridge') {
    const spec = {
      mesh: null,
      p1: [...p1],
      p2: [...p2],
      center: options.center ? [...options.center] : [0, 0],
      centerY: options.centerY ?? 0,
      baseColor: new THREE.Color(color),
      edgeRole: 'bridge',
      edgeBand: options.edgeBand || 'body',
      roundedLoopOffsetMode: Boolean(options.roundedLoopOffsetMode),
      bridgeRecord: options.bridgeRecord || null,
      instanceId: bridgeEdgeSpecs.length,
      instanceMatrix: new THREE.Matrix4(),
      hasTransform: false,
      cullHidden: false,
      lastVisible: true,
    };
    bridgeEdgeSpecs.push(spec);
    edgeStripSpecs.push(spec);
    return new THREE.Object3D();
  }

  const v1 = new THREE.Vector3(...p1);
  const v2 = new THREE.Vector3(...p2);
  const len = v1.distanceTo(v2);
  const geo = new THREE.BoxGeometry(thickness, thickness, len);
  const mat = options.edge && options.edgeRole === 'main-building'
    ? createFacadeLedMaterial(color)
    : new THREE.MeshBasicMaterial({
      color,
      transparent: options.opacity !== undefined && options.opacity < 1,
      opacity: options.opacity ?? 1,
      toneMapped: options.toneMapped ?? false,
      depthWrite: options.depthWrite ?? true,
    });
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(v1).add(v2).multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(v2, v1).normalize();
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  if (options.edge) {
    edgeStripSpecs.push({
      mesh: m,
      p1: [...p1],
      p2: [...p2],
      center: options.center ? [...options.center] : [0, 0],
      centerY: options.centerY ?? 0,
      baseColor: new THREE.Color(color),
      edgeRole: options.edgeRole || 'global',
      edgeBand: options.edgeBand || 'body',
      roundedLoopOffsetMode: Boolean(options.roundedLoopOffsetMode),
      bridgeRecord: options.bridgeRecord || null,
    });
  }
  return m;
}

function shiftedEdgePoint(point, center, distance) {
  const shifted = [...point];
  const dx = point[0] - center[0];
  const dz = point[2] - center[1];
  if (Math.abs(dx) > 0.001) shifted[0] += Math.sign(dx) * distance;
  if (Math.abs(dz) > 0.001) shifted[2] += Math.sign(dz) * distance;
  return shifted;
}

function shiftedHorizontalLoopPoint(point, normalX, normalZ, distance) {
  const shifted = [...point];
  shifted[0] += normalX * distance;
  shifted[2] += normalZ * distance;
  return shifted;
}

function shiftedHorizontalLoopSegment(p1, p2, center, distance) {
  if (Math.abs(distance) <= 0.001) return [[...p1], [...p2]];
  const dx = p2[0] - p1[0];
  const dz = p2[2] - p1[2];
  const length = Math.hypot(dx, dz);
  if (length <= 0.001) return [[...p1], [...p2]];
  let nx = dz / length;
  let nz = -dx / length;
  const mx = (p1[0] + p2[0]) * 0.5 - center[0];
  const mz = (p1[2] + p2[2]) * 0.5 - center[1];
  if (nx * mx + nz * mz < 0) {
    nx *= -1;
    nz *= -1;
  }
  return [
    shiftedHorizontalLoopPoint(p1, nx, nz, distance),
    shiftedHorizontalLoopPoint(p2, nx, nz, distance),
  ];
}

function overlappedHorizontalLoopSegment(p1, p2, thickness) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  const length = Math.hypot(dx, dy, dz);
  if (length <= 0.001) return [[...p1], [...p2]];
  const overlap = Math.min(thickness * 0.72, length * 0.32);
  const ux = dx / length;
  const uy = dy / length;
  const uz = dz / length;
  return [
    [p1[0] - ux * overlap, p1[1] - uy * overlap, p1[2] - uz * overlap],
    [p2[0] + ux * overlap, p2[1] + uy * overlap, p2[2] + uz * overlap],
  ];
}

function edgeCurrentCenter(spec, sideSpacing, streetEdgeW, sideWidthScale, mainWidthScale) {
  if (spec.edgeRole === 'side-building') {
    const sign = spec.center[0] < 0 ? -1 : 1;
    const sideWidth = SIDE_BUILDING_BASE * sideWidthScale;
    return [
      sign * (roadHalf() + streetEdgeW + sideWidth / 2),
      (spec.center[1] / SIDE_BUILDING_SPACING) * SIDE_BUILDING_SPACING * sideSpacing,
    ];
  }
  if (spec.edgeRole === 'main-building') return [0, getMainBuildingZ()];
  if (spec.edgeRole === 'bridge' && spec.bridgeRecord) {
    return [
      getBridgeXOffset() + readBridgeNumber(spec.bridgeRecord, 'xOffset'),
      spec.bridgeRecord.zFactor * SIDE_BUILDING_SPACING * sideSpacing + getBridgeZOffset() + readBridgeNumber(spec.bridgeRecord, 'zOffset'),
    ];
  }
  return spec.center;
}

function scaledEdgePoint(spec, point, sideScale, mainScale, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale, sideSpacing, streetEdgeW) {
  const currentCenter = edgeCurrentCenter(spec, sideSpacing, streetEdgeW, sideWidthScale, mainWidthScale);
  const scaled = [...point];
  if (spec.edgeRole === 'side-building') {
    scaled[0] = currentCenter[0] + (point[0] - spec.center[0]) * sideWidthScale;
    scaled[1] *= sideScale;
    scaled[2] = currentCenter[1] + (point[2] - spec.center[1]) * sideDepthScale;
  }
  if (spec.edgeRole === 'main-building') {
    scaled[0] = currentCenter[0] + (point[0] - spec.center[0]) * mainWidthScale;
    scaled[1] = getMainBuildingY() + scaled[1] * mainScale;
    scaled[2] = currentCenter[1] + (point[2] - spec.center[1]) * mainDepthScale;
  }
  if (spec.edgeRole === 'bridge' && spec.bridgeRecord) {
    const localSpanScale = readBridgeNumber(spec.bridgeRecord, 'spanScale');
    const localHeightScale = readBridgeNumber(spec.bridgeRecord, 'heightScale');
    const localDepthScale = readBridgeNumber(spec.bridgeRecord, 'depthScale');
    const localYOffset = readBridgeNumber(spec.bridgeRecord, 'yOffset');
    const bridgeSpan = bridgeSpanLength(sideWidthScale, streetEdgeW) * getBridgeSpanScale() * localSpanScale;
    scaled[0] = currentCenter[0] + (point[0] - spec.center[0]) * (bridgeSpan / spec.bridgeRecord.baseWidth);
    scaled[1] = spec.bridgeRecord.baseY + getBridgeYOffset() + localYOffset + (point[1] - spec.centerY) * getBridgeHeightScale() * localHeightScale;
    scaled[2] = currentCenter[1] + (point[2] - spec.center[1]) * getBridgeDepthScale() * localDepthScale;
  }
  return scaled;
}

// Shared scratch for the strip transforms below: both run over every strip spec
// (hundreds) on every applyLiveControls, which is once per frame while a slider
// is held down.
const STRIP_FORWARD_AXIS = new THREE.Vector3(0, 0, 1);
const stripTransformStart = new THREE.Vector3();
const stripTransformEnd = new THREE.Vector3();
const stripTransformDir = new THREE.Vector3();
const stripInstancePosition = new THREE.Vector3();
const stripInstanceScale = new THREE.Vector3();
const stripInstanceQuaternion = new THREE.Quaternion();
const stripInstanceMatrix = new THREE.Matrix4();

// A rectangular LED frame used to be four separate meshes, each with its own box
// geometry AND its own identical material: four transparent draw calls, four
// material binds and four entries in the transparent sort list, per board. The
// city has 13 of them plus the contact terminal and the equalizer. The four sides
// are static relative to each other, so bake them into one geometry with one
// material: same pixels, a quarter of the submissions.
function mergeStripGeometries(geometries) {
  const merged = new THREE.BufferGeometry();
  const parts = geometries.map((geometry) => (geometry.index ? geometry.toNonIndexed() : geometry));
  for (const name of ['position', 'normal', 'uv']) {
    if (!parts.every((part) => part.getAttribute(name))) continue;
    const itemSize = parts[0].getAttribute(name).itemSize;
    let total = 0;
    for (const part of parts) total += part.getAttribute(name).array.length;
    const array = new Float32Array(total);
    let offset = 0;
    for (const part of parts) {
      const source = part.getAttribute(name).array;
      array.set(source, offset);
      offset += source.length;
    }
    merged.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
  }
  for (let i = 0; i < parts.length; i += 1) {
    if (parts[i] !== geometries[i]) parts[i].dispose();
  }
  return merged;
}

export function addElStripRectFrame(group, halfWidth, halfHeight, z, color, thickness, options = {}) {
  const corners = [
    [[-halfWidth, -halfHeight, z], [halfWidth, -halfHeight, z]],
    [[halfWidth, -halfHeight, z], [halfWidth, halfHeight, z]],
    [[halfWidth, halfHeight, z], [-halfWidth, halfHeight, z]],
    [[-halfWidth, halfHeight, z], [-halfWidth, -halfHeight, z]],
  ];
  const sides = corners.map(([p1, p2]) => {
    const v1 = stripTransformStart.set(p1[0], p1[1], p1[2]);
    const v2 = stripTransformEnd.set(p2[0], p2[1], p2[2]);
    const len = v1.distanceTo(v2);
    const geometry = new THREE.BoxGeometry(thickness, thickness, len);
    const position = stripInstancePosition.copy(v1).add(v2).multiplyScalar(0.5);
    const dir = stripTransformDir.subVectors(v2, v1).normalize();
    const quaternion = stripInstanceQuaternion.setFromUnitVectors(STRIP_FORWARD_AXIS, dir);
    geometry.applyMatrix4(stripInstanceMatrix.compose(position, quaternion, stripInstanceScale.set(1, 1, 1)));
    return geometry;
  });
  const geometry = mergeStripGeometries(sides);
  for (const side of sides) side.dispose();
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: options.opacity !== undefined && options.opacity < 1,
    opacity: options.opacity ?? 1,
    toneMapped: options.toneMapped ?? false,
    depthWrite: options.depthWrite ?? true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  return mesh;
}

function setStripTransform(mesh, p1, p2, thickness) {
  const v1 = stripTransformStart.set(p1[0], p1[1], p1[2]);
  const v2 = stripTransformEnd.set(p2[0], p2[1], p2[2]);
  const len = v1.distanceTo(v2);
  // Disposing the box and building a new one means a new VBO upload: only worth
  // it when its dimensions actually changed, which during a drag they rarely do.
  if (mesh.userData.stripThickness !== thickness || mesh.userData.stripLength !== len) {
    mesh.userData.stripThickness = thickness;
    mesh.userData.stripLength = len;
    mesh.geometry.dispose();
    mesh.geometry = new THREE.BoxGeometry(thickness, thickness, len);
  }
  mesh.position.copy(v1).add(v2).multiplyScalar(0.5);
  const dir = stripTransformDir.subVectors(v2, v1).normalize();
  mesh.quaternion.setFromUnitVectors(STRIP_FORWARD_AXIS, dir);
}

// The returned matrix is shared scratch: the single caller that keeps it
// (the bridge edge batch) copies it straight into its own Matrix4.
export function setStripInstanceTransform(mesh, index, p1, p2, thickness) {
  const v1 = stripTransformStart.set(p1[0], p1[1], p1[2]);
  const v2 = stripTransformEnd.set(p2[0], p2[1], p2[2]);
  const len = v1.distanceTo(v2);
  const position = stripInstancePosition.copy(v1).add(v2).multiplyScalar(0.5);
  const dir = stripTransformDir.subVectors(v2, v1).normalize();
  const quaternion = stripInstanceQuaternion.setFromUnitVectors(STRIP_FORWARD_AXIS, dir);
  const scale = stripInstanceScale.set(thickness, thickness, len);
  const matrix = stripInstanceMatrix.compose(position, quaternion, scale);
  mesh.setMatrixAt(index, matrix);
  return matrix;
}

export function buildSideBuildingEdgeBatch(group) {
  if (!sideBuildingEdgeSpecs.length || sideBuildingEdgeBatch.mesh) return;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({
    color: PAL.tealLight,
    toneMapped: false,
    depthWrite: true,
  });
  applyEdgePulseShader(material);
  const mesh = new THREE.InstancedMesh(geometry, material, sideBuildingEdgeSpecs.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = true;
  mesh.count = sideBuildingEdgeSpecs.length;
  sideBuildingEdgeBatch.mesh = mesh;
  sideBuildingEdgeBatch.material = material;
  group.add(mesh);
}

export function buildBridgeEdgeBatch(group) {
  if (!bridgeEdgeSpecs.length || bridgeEdgeBatch.mesh) return;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  // Plain material on purpose: bridge strips never had the travelling
  // edge-pulse shader the side-building batch carries.
  const material = new THREE.MeshBasicMaterial({
    color: PAL.tealLight,
    toneMapped: false,
    depthWrite: true,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, bridgeEdgeSpecs.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = true;
  mesh.count = bridgeEdgeSpecs.length;
  bridgeEdgeBatch.mesh = mesh;
  bridgeEdgeBatch.material = material;
  group.add(mesh);
  // fx.bridgeEdges=0: nothing re-asserts this batch's mesh-level visibility.
  mesh.visible = fxEnabled('bridgeEdges');
}

// Hidden instances collapse to zero scale (no fragments); a bridge strip is
// hidden by the per-bridge static cull or by its bridge's visible toggle.
const bridgeEdgeHiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);

function syncBridgeEdgeInstance(spec) {
  if (!bridgeEdgeBatch.mesh) return;
  const visible = !spec.cullHidden && spec.hasTransform && readBridgeVisible(spec.bridgeRecord);
  spec.lastVisible = visible;
  bridgeEdgeBatch.mesh.setMatrixAt(spec.instanceId, visible ? spec.instanceMatrix : bridgeEdgeHiddenMatrix);
  bridgeEdgeBatch.mesh.instanceMatrix.needsUpdate = true;
}

export function setBridgeEdgeSpecCullVisible(spec, visible) {
  if (spec.cullHidden === !visible) return;
  spec.cullHidden = !visible;
  syncBridgeEdgeInstance(spec);
}

export function addBuildingEdges(group, w, h, d, x, y, z, color = PAL.tealLight, bevelPadding = 0, edgeRole = 'global', edgeMeta = {}) {
  const thickness = edgeStripThickness;
  const offset = Math.max(0, bevelPadding + thickness * 0.18);
  const hw = w / 2 + offset;
  const hd = d / 2 + offset;
  const yb = y + Math.max(0.08, thickness * 0.52);
  const yt = y + h + offset;
  const footprintChamfer = edgeMeta.footprintChamfer ?? (bevelPadding > 0 ? bevelPadding / 0.6 : 0);
  const commonOptions = { ...edgeMeta, toneMapped: false, depthWrite: true, edge: true, center: [x, z], centerY: y, edgeRole };
  const bodyOptions = { ...commonOptions, edgeBand: 'body' };
  const highOptions = { ...commonOptions, edgeBand: 'high' };
  const lowOptions = { ...commonOptions, edgeBand: 'low' };

  // Attached "04 Linea" perimeter: physical strips on the outer corners, no halo.
  group.add(elStrip([x - hw, yb, z - hd], [x - hw, yt, z - hd], color, thickness, bodyOptions));
  group.add(elStrip([x + hw, yb, z - hd], [x + hw, yt, z - hd], color, thickness, bodyOptions));
  group.add(elStrip([x - hw, yb, z + hd], [x - hw, yt, z + hd], color, thickness, bodyOptions));
  group.add(elStrip([x + hw, yb, z + hd], [x + hw, yt, z + hd], color, thickness, bodyOptions));

  if (edgeRole === 'side-building' || edgeRole === 'main-building') {
    addHorizontalBuildingLedRing(group, w, d, x, yt, z, color, highOptions, footprintChamfer, offset);
    addHorizontalBuildingLedRing(group, w, d, x, yb, z, color, lowOptions, footprintChamfer, offset);
  } else {
    group.add(elStrip([x - hw, yt, z - hd], [x + hw, yt, z - hd], color, thickness, highOptions));
    group.add(elStrip([x + hw, yt, z - hd], [x + hw, yt, z + hd], color, thickness, highOptions));
    group.add(elStrip([x + hw, yt, z + hd], [x - hw, yt, z + hd], color, thickness, highOptions));
    group.add(elStrip([x - hw, yt, z + hd], [x - hw, yt, z - hd], color, thickness, highOptions));

    group.add(elStrip([x - hw, yb, z - hd], [x + hw, yb, z - hd], color, thickness, lowOptions));
    group.add(elStrip([x + hw, yb, z - hd], [x + hw, yb, z + hd], color, thickness, lowOptions));
    group.add(elStrip([x + hw, yb, z + hd], [x - hw, yb, z + hd], color, thickness, lowOptions));
    group.add(elStrip([x - hw, yb, z + hd], [x - hw, yb, z - hd], color, thickness, lowOptions));
  }
}

function edgeStripBandOffset(spec, buildingLowOffset, buildingHighOffset, bridgeLowOffset, bridgeHighOffset, mainLowOffset, mainHighOffset) {
  if (spec.edgeRole === 'main-building' && spec.edgeBand === 'low') return mainLowOffset;
  if (spec.edgeRole === 'main-building' && spec.edgeBand === 'high') return mainHighOffset;
  if (spec.edgeRole === 'side-building' && spec.edgeBand === 'low') return buildingLowOffset;
  if (spec.edgeRole === 'side-building' && spec.edgeBand === 'high') return buildingHighOffset;
  if (spec.edgeRole === 'bridge' && spec.edgeBand === 'low') return bridgeLowOffset + readBridgeNumber(spec.bridgeRecord, 'lowLedOffset');
  if (spec.edgeRole === 'bridge' && spec.edgeBand === 'high') return bridgeHighOffset + readBridgeNumber(spec.bridgeRecord, 'highLedOffset');
  return 0;
}

function edgeStripBaseDistance(spec, sideVerticalDistance, sideHorizontalDistance, mainVerticalDistance, mainHorizontalDistance) {
  if (spec.edgeRole === 'main-building') {
    return spec.edgeBand === 'body' ? mainVerticalDistance : mainHorizontalDistance;
  }
  if (spec.edgeRole === 'side-building') {
    return spec.edgeBand === 'body' ? sideVerticalDistance : sideHorizontalDistance;
  }
  return sideVerticalDistance;
}

function edgeVerticalLengthScale(spec, buildingLength, mainLength) {
  if (spec.edgeBand !== 'body') return 1;
  if (spec.edgeRole === 'main-building') return mainLength;
  if (spec.edgeRole === 'side-building') return buildingLength;
  return 1;
}

function edgeStripYOffset(spec, buildingVerticalY, buildingLowY, buildingHighY, mainVerticalY, mainLowY, mainHighY) {
  if (spec.edgeRole === 'main-building' && spec.edgeBand === 'body') return mainVerticalY;
  if (spec.edgeRole === 'main-building' && spec.edgeBand === 'low') return mainLowY;
  if (spec.edgeRole === 'main-building' && spec.edgeBand === 'high') return mainHighY;
  if (spec.edgeRole === 'side-building' && spec.edgeBand === 'body') return buildingVerticalY;
  if (spec.edgeRole === 'side-building' && spec.edgeBand === 'low') return buildingLowY;
  if (spec.edgeRole === 'side-building' && spec.edgeBand === 'high') return buildingHighY;
  return 0;
}

function applyVerticalLedLength(p1, p2, lengthScale) {
  const scale = THREE.MathUtils.clamp(lengthScale, 0.05, 1.3);
  if (Math.abs(p1[1] - p2[1]) <= 0.001 || Math.abs(scale - 1) <= 0.0001) return [p1, p2];
  const centerY = (p1[1] + p2[1]) * 0.5;
  const halfY = Math.abs(p2[1] - p1[1]) * scale * 0.5;
  const nextP1 = [...p1];
  const nextP2 = [...p2];
  if (p1[1] <= p2[1]) {
    nextP1[1] = centerY - halfY;
    nextP2[1] = centerY + halfY;
  } else {
    nextP1[1] = centerY + halfY;
    nextP2[1] = centerY - halfY;
  }
  return [nextP1, nextP2];
}

function applyLedYOffset(p1, p2, yOffset) {
  if (Math.abs(yOffset) <= 0.001) return [p1, p2];
  const nextP1 = [...p1];
  const nextP2 = [...p2];
  nextP1[1] += yOffset;
  nextP2[1] += yOffset;
  return [nextP1, nextP2];
}

function updateHorizontalBuildingLedRings(brightness, hueDeg, mainBrightness, mainHueDeg, horizontalDistance, mainHorizontalDistance, horizontalThickness, mainHorizontalThickness, horizontalRadius, mainHorizontalRadius, buildingLowOffset, buildingHighOffset, mainLowOffset, mainHighOffset, buildingLowY, buildingHighY, mainLowY, mainHighY, sideScale, mainScale, nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale, nextSideSpacingScale, nextStreetEdgeWidth, tunedColor) {
  const ledColor = tunedColor(new THREE.Color(PAL.tealLight), hueDeg, 1, brightness);
  const mainLedColor = tunedColor(new THREE.Color(PAL.tealLight), mainHueDeg, 1, mainBrightness);
  const changedSideRingBatches = new Set();
  for (const spec of horizontalBuildingLedRings) {
    const isMainBuilding = spec.edgeRole === 'main-building';
    const widthScale = isMainBuilding ? nextMainWidthScale : nextSideWidthScale;
    const depthScale = isMainBuilding ? nextMainDepthScale : nextSideDepthScale;
    const heightScale = isMainBuilding ? mainScale : sideScale;
    const stripWidth = Math.max(0.04, isMainBuilding ? mainHorizontalThickness : horizontalThickness);
    const radiusScale = Math.max(0.1, isMainBuilding ? mainHorizontalRadius : horizontalRadius);
    const baseDistance = isMainBuilding ? mainHorizontalDistance : horizontalDistance;
    const bandDistance = isMainBuilding
      ? 0.16 + baseDistance + edgeStripBandOffset(spec, buildingLowOffset, buildingHighOffset, 0, 0, mainLowOffset, mainHighOffset)
      : spec.distance + baseDistance + edgeStripBandOffset(spec, buildingLowOffset, buildingHighOffset, 0, 0, mainLowOffset, mainHighOffset);
    const currentCenter = edgeCurrentCenter(spec, nextSideSpacingScale, nextStreetEdgeWidth, nextSideWidthScale, nextMainWidthScale);
    const width = spec.w * widthScale;
    const depth = spec.d * depthScale;
    const chamfer = spec.chamfer * Math.min(widthScale, depthScale);
    const yOffset = edgeStripYOffset(spec, 0, buildingLowY, buildingHighY, 0, mainLowY, mainHighY);
    const buildingYOffset = isMainBuilding ? getMainBuildingY() : 0;
    if (spec.segmentMode) {
      const centerY = buildingYOffset + spec.baseY * heightScale + yOffset;
      updateHorizontalLedLoopSegments(spec, spec.w, spec.d, spec.chamfer, bandDistance, stripWidth, radiusScale, currentCenter[0], centerY, currentCenter[1], widthScale, depthScale);
      spec.material.color.copy(isMainBuilding ? mainLedColor : ledColor);
      const visible = (isMainBuilding ? mainBrightness : brightness) > 0.001 && stripWidth > 0.01;
      spec.segmentGroup.visible = visible;
      if (spec.segmentMesh) spec.segmentMesh.visible = visible;
      continue;
    }
    if (spec.batchRecord?.mesh) {
      const batch = spec.batchRecord;
      updateSideHorizontalLedRingBatchGeometry(batch, width, depth, chamfer, bandDistance, stripWidth, radiusScale);
      const ledHeight = batch.mesh.geometry.userData.ledHeight || Math.max(0.03, stripWidth * 0.34);
      sideHorizontalLedRingPosition.set(
        currentCenter[0],
        buildingYOffset + spec.baseY * heightScale + yOffset - ledHeight * 0.5,
        currentCenter[1]
      );
      sideHorizontalLedRingMatrix.compose(sideHorizontalLedRingPosition, sideHorizontalLedRingQuaternion, sideHorizontalLedRingScale);
      batch.mesh.setMatrixAt(spec.batchInstanceId, sideHorizontalLedRingMatrix);
      batch.material.color.copy(ledColor);
      batch.mesh.count = batch.count;
      const batchBaseVisible = brightness > 0.001 && stripWidth > 0.01 && batch.count > 0;
      batch.mesh.userData.staticCullBaseVisible = batchBaseVisible && fxEnabled('ledRings');
      batch.mesh.visible = batchBaseVisible && fxEnabled('ledRings');
      changedSideRingBatches.add(batch);
      continue;
    }
    const nextGeometry = makeHorizontalLedRingGeometry(width, depth, chamfer, bandDistance, stripWidth, radiusScale);
    const ledHeight = nextGeometry.userData.ledHeight || Math.max(0.03, stripWidth * 0.34);
    spec.mesh.geometry.dispose();
    spec.mesh.geometry = nextGeometry;
    spec.mesh.position.set(currentCenter[0], buildingYOffset + spec.baseY * heightScale + yOffset - ledHeight * 0.5, currentCenter[1]);
    spec.material.color.copy(isMainBuilding ? mainLedColor : ledColor);
    spec.mesh.visible = (isMainBuilding ? mainBrightness : brightness) > 0.001 && stripWidth > 0.01;
  }
  for (const batch of changedSideRingBatches) {
    batch.mesh.instanceMatrix.needsUpdate = true;
    refreshCullingBounds(batch.mesh);
  }
}

export function updateEdgeStrips(brightness, thickness, verticalDistance, hueDeg, mainBrightness, mainThickness, mainVerticalDistance, mainHueDeg, horizontalDistance, mainHorizontalDistance, horizontalThickness, mainHorizontalThickness, horizontalRadius, mainHorizontalRadius, buildingLowOffset, buildingHighOffset, bridgeLowOffset, bridgeHighOffset, mainLowOffset, mainHighOffset, buildingVerticalLength, mainVerticalLength, buildingVerticalY, buildingLowY, buildingHighY, mainVerticalY, mainLowY, mainHighY, sideScale, mainScale, nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale, nextSideSpacingScale, nextStreetEdgeWidth, tunedColor) {
  ledDistance = verticalDistance;
  buildingHorizontalLedDistance = horizontalDistance;
  mainBuildingVerticalLedDistance = mainVerticalDistance;
  mainBuildingHorizontalLedDistance = mainHorizontalDistance;
  edgeStripThickness = thickness;
  buildingHorizontalLedThickness = horizontalThickness;
  mainBuildingHorizontalLedThickness = mainHorizontalThickness;
  buildingHorizontalLedRadius = horizontalRadius;
  mainBuildingHorizontalLedRadius = mainHorizontalRadius;
  buildingVerticalLedLength = buildingVerticalLength;
  mainBuildingVerticalLedLength = mainVerticalLength;
  buildingVerticalLedY = buildingVerticalY;
  buildingLowLedY = buildingLowY;
  buildingHighLedY = buildingHighY;
  mainBuildingVerticalLedY = mainVerticalY;
  mainBuildingLowLedY = mainLowY;
  mainBuildingHighLedY = mainHighY;
  const ledColor = tunedColor(new THREE.Color(PAL.tealLight), hueDeg, 1, brightness);
  const mainLedColor = tunedColor(new THREE.Color(PAL.tealLight), mainHueDeg, 1, mainBrightness);
  let sideBatchChanged = false;
  let bridgeBatchChanged = false;
  if (sideBuildingEdgeBatch.material) {
    sideBuildingEdgeBatch.material.color.copy(ledColor);
  }
  if (bridgeEdgeBatch.material) {
    bridgeEdgeBatch.material.color.copy(ledColor);
  }
  for (const spec of edgeStripSpecs) {
    const isMainBuilding = spec.edgeRole === 'main-building';
    const stripDistance = edgeStripBaseDistance(spec, ledDistance, buildingHorizontalLedDistance, mainBuildingVerticalLedDistance, mainBuildingHorizontalLedDistance);
    const stripThickness = isMainBuilding ? mainThickness : edgeStripThickness;
    const bandDistance = stripDistance + edgeStripBandOffset(spec, buildingLowOffset, buildingHighOffset, bridgeLowOffset, bridgeHighOffset, mainLowOffset, mainHighOffset);
    const currentCenter = edgeCurrentCenter(spec, nextSideSpacingScale, nextStreetEdgeWidth, nextSideWidthScale, nextMainWidthScale);
    const scaledP1 = scaledEdgePoint(spec, spec.p1, sideScale, mainScale, nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale, nextSideSpacingScale, nextStreetEdgeWidth);
    const scaledP2 = scaledEdgePoint(spec, spec.p2, sideScale, mainScale, nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale, nextSideSpacingScale, nextStreetEdgeWidth);
    if (isMainBuilding && spec.edgeBand === 'body') {
      const attachMainPoint = (point) => {
        const next = [...point];
        const halfW = MAIN_BUILDING_BASE * nextMainWidthScale * 0.5 + 0.16 + mainVerticalDistance;
        const halfD = MAIN_BUILDING_BASE * nextMainDepthScale * 0.5 + 0.16 + mainVerticalDistance;
        if (Math.abs(next[0] - currentCenter[0]) > 0.001) next[0] = currentCenter[0] + Math.sign(next[0] - currentCenter[0]) * halfW;
        if (Math.abs(next[2] - currentCenter[1]) > 0.001) next[2] = currentCenter[1] + Math.sign(next[2] - currentCenter[1]) * halfD;
        return next;
      };
      const [joinedP1, joinedP2] = overlappedHorizontalLoopSegment(attachMainPoint(scaledP1), attachMainPoint(scaledP2), stripThickness);
      const [lengthP1, lengthP2] = applyVerticalLedLength(joinedP1, joinedP2, edgeVerticalLengthScale(spec, buildingVerticalLength, mainVerticalLength));
      const [p1, p2] = applyLedYOffset(lengthP1, lengthP2, edgeStripYOffset(spec, buildingVerticalY, buildingLowY, buildingHighY, mainVerticalY, mainLowY, mainHighY));
      setStripTransform(spec.mesh, p1, p2, stripThickness);
      spec.mesh.material.color.copy(mainLedColor);
      spec.mesh.visible = true;
      continue;
    }
    const [rawP1, rawP2] = spec.roundedLoopOffsetMode
      ? shiftedHorizontalLoopSegment(scaledP1, scaledP2, currentCenter, bandDistance)
      : [shiftedEdgePoint(scaledP1, currentCenter, bandDistance), shiftedEdgePoint(scaledP2, currentCenter, bandDistance)];
    const [joinedP1, joinedP2] = spec.roundedLoopOffsetMode
      ? overlappedHorizontalLoopSegment(rawP1, rawP2, stripThickness)
      : [rawP1, rawP2];
    const [lengthP1, lengthP2] = applyVerticalLedLength(joinedP1, joinedP2, edgeVerticalLengthScale(spec, buildingVerticalLength, mainVerticalLength));
    const [p1, p2] = applyLedYOffset(lengthP1, lengthP2, edgeStripYOffset(spec, buildingVerticalY, buildingLowY, buildingHighY, mainVerticalY, mainLowY, mainHighY));
    if (spec.edgeRole === 'side-building' && sideBuildingEdgeBatch.mesh) {
      setStripInstanceTransform(sideBuildingEdgeBatch.mesh, spec.instanceId, p1, p2, stripThickness);
      sideBatchChanged = true;
      continue;
    }
    if (spec.edgeRole === 'bridge') {
      if (bridgeEdgeBatch.mesh) {
        spec.instanceMatrix.copy(setStripInstanceTransform(bridgeEdgeBatch.mesh, spec.instanceId, p1, p2, stripThickness));
        spec.hasTransform = true;
        syncBridgeEdgeInstance(spec);
        bridgeBatchChanged = true;
      }
      continue;
    }
    setStripTransform(spec.mesh, p1, p2, stripThickness);
    spec.mesh.material.color.copy(isMainBuilding ? mainLedColor : ledColor);
    spec.mesh.visible = true;
  }
  if (sideBatchChanged && sideBuildingEdgeBatch.mesh) {
    sideBuildingEdgeBatch.mesh.instanceMatrix.needsUpdate = true;
    sideBuildingEdgeBatch.mesh.userData.staticCullBaseVisible = sideBuildingEdgeBatch.enabled && fxEnabled('sideEdges');
    sideBuildingEdgeBatch.mesh.visible = sideBuildingEdgeBatch.enabled && fxEnabled('sideEdges');
    refreshCullingBounds(sideBuildingEdgeBatch.mesh);
  }
  if (bridgeBatchChanged && bridgeEdgeBatch.mesh) {
    bridgeEdgeBatch.mesh.instanceMatrix.needsUpdate = true;
    refreshCullingBounds(bridgeEdgeBatch.mesh);
  }
  updateFacadeStripOutsets(nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale);
  updateHorizontalBuildingLedRings(brightness, hueDeg, mainBrightness, mainHueDeg, horizontalDistance, mainHorizontalDistance, horizontalThickness, mainHorizontalThickness, horizontalRadius, mainHorizontalRadius, buildingLowOffset, buildingHighOffset, mainLowOffset, mainHighOffset, buildingLowY, buildingHighY, mainLowY, mainHighY, sideScale, mainScale, nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale, nextSideSpacingScale, nextStreetEdgeWidth, tunedColor);
  updateFacadeLedRibbons(brightness, hueDeg, mainBrightness, mainHueDeg);
}
