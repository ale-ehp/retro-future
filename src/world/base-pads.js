import * as THREE from 'three';
import { fxEnabled } from '../engine/fx-debug-toggles.js';
import {
  DEFAULT_BASE_PAD_THICKNESS,
  DEFAULT_BASE_PAD_Y,
  GRID_BLOCK,
} from './boulevard-constants.js';
import {
  getHexTileHeightScale,
  getHexTileScale,
  hexRoadTiles,
  hexTileGeo,
  hexTileHeight,
  hexTileRadius,
  roadMicroNormalTex,
  syncHexTileDisplayColor,
} from './hex-tiles.js';
import { applyEdgePulseShader } from './energy-pulse.js';
import { setStripInstanceTransform } from './building-leds.js';

let scene = null;
let overlayGroup = null;
let PAL = null;
let reflectionEnvMap = null;
let basePadSurfaceTex = null;
let sideBuildingRecords = [];
let mainBuildingRecords = [];
let refreshCullingBounds = () => {};
let refreshCullingBoundsWithMargin = () => {};
let roadTileTopY = () => 0;
let sidewalkMinSurfaceY = () => 0;
let tunedColor = null;

const SIDEWALK_CURB_OVERLAP = 0.035;
export const BASE_PAD_FRUSTUM_CULLING_ENABLED = true;
export const BASE_PAD_CULLING_BOUNDS_MARGIN = GRID_BLOCK * 3;

const basePadScanRecords = [];
let basePadScanRecordsKey = -1;

let basePadGlobalY = 0;
let basePadCurbEnabled = true;
let basePadCurbWidth = 4;
let basePadInnerRaise = 0;
let basePadCurbSlope = 1;
let basePadCurbRadius = 0;
let basePadTextureMode = 'on';
let basePadTextureRepeat = 1;
let basePadTextureRotation = 0;
let basePadNormalStrength = 0;
let basePadHue = 0;
let basePadSaturation = 1;
let basePadBrightness = 1;
let basePadMetalness = 0.08;
let basePadRoughness = 0.18;
let basePadReflect = 0.88;
let basePadEmissive = 0.035;
let basePadBevelSize = 0;
let basePadBevelSegments = 1;
let basePadFlatShading = false;
let basePadBorderOpacity = 0.64;
let basePadBorderBrightness = 1;

const basePadHexMat = new THREE.MeshBasicMaterial({
  color: 0x6f8187,
  transparent: false,
  opacity: 1,
  depthWrite: true,
  depthTest: true,
  polygonOffset: true,
  polygonOffsetFactor: -8,
  polygonOffsetUnits: -8,
  toneMapped: false,
});
let basePadHexOverlay = null;
let basePadHexOverlayCapacity = 0;
const basePadHexClipMat = new THREE.MeshBasicMaterial({
  color: 0x6f8187,
  transparent: false,
  opacity: 1,
  depthWrite: true,
  depthTest: true,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -10,
  polygonOffsetUnits: -10,
  toneMapped: false,
});
export const basePadHexClipMesh = new THREE.Mesh(new THREE.BufferGeometry(), basePadHexClipMat);
let basePadClippedHexPolygons = 0;
let basePadFullHexOverlays = 0;

export const basePadLedBatch = {
  mesh: null,
  material: null,
  capacity: 0,
  count: 0,
  sceneVisible: fxEnabled('basePadLeds'),
  batches: [],
};
const BASE_PAD_LED_RENDER_ORDER = 12;
const basePadLedUnitGeometry = new THREE.BoxGeometry(1, 1, 1);

const basePadSurfaceBaseColor = new THREE.Color(0xa5b7bb);
const basePadSurfaceEmissiveColor = new THREE.Color(0x031014);
const basePadBorderBaseColor = new THREE.Color(0x8aa8b0);
const buildingBasePadBorderMat = new THREE.LineBasicMaterial({
  color: basePadBorderBaseColor,
  transparent: true,
  opacity: 0.64,
});
let basePadSurfaceMat = null;

export function initBasePads(deps) {
  scene = deps.scene;
  overlayGroup = deps.overlayGroup;
  PAL = deps.PAL;
  reflectionEnvMap = deps.reflectionEnvMap;
  basePadSurfaceTex = deps.basePadSurfaceTex;
  sideBuildingRecords = deps.sideBuildingRecords;
  mainBuildingRecords = deps.mainBuildingRecords;
  refreshCullingBounds = deps.refreshCullingBounds;
  refreshCullingBoundsWithMargin = deps.refreshCullingBoundsWithMargin;
  roadTileTopY = deps.roadTileTopY;
  sidewalkMinSurfaceY = deps.sidewalkMinSurfaceY;
  tunedColor = deps.tunedColor;
  basePadSurfaceMat = new THREE.MeshStandardMaterial({
    map: basePadSurfaceTex,
    color: basePadSurfaceBaseColor,
    metalness: 0.08,
    roughness: 0.18,
    envMap: reflectionEnvMap,
    envMapIntensity: 0.88,
    emissive: basePadSurfaceEmissiveColor,
    emissiveIntensity: 0.035,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    depthTest: true,
    polygonOffset: false,
  });
  basePadHexClipMesh.frustumCulled = false;
  basePadHexClipMesh.renderOrder = 4;
  scene.add(basePadHexClipMesh);
}

export function getBasePadCurbEnabled() {
  return basePadCurbEnabled;
}

export function getBasePadMaterialResponse() {
  return {
    reflect: basePadReflect,
    roughness: basePadRoughness,
    metalness: basePadMetalness,
  };
}

export function getBasePadHexOverlay() {
  return basePadHexOverlay;
}

export function applyBasePadRuntimeSettings(settings) {
  basePadGlobalY = settings.globalY;
  basePadCurbEnabled = settings.curbEnabled;
  basePadCurbWidth = settings.curbWidth;
  basePadInnerRaise = settings.innerRaise;
  basePadCurbSlope = settings.curbSlope;
  basePadCurbRadius = settings.curbRadius;
  basePadTextureMode = settings.textureMode;
  basePadTextureRepeat = settings.textureRepeat;
  basePadTextureRotation = settings.textureRotation;
  basePadNormalStrength = settings.normalStrength;
  basePadHue = settings.hue;
  basePadSaturation = settings.saturation;
  basePadBrightness = settings.brightness;
  basePadMetalness = settings.metalness;
  basePadRoughness = settings.roughness;
  basePadReflect = settings.reflect;
  basePadEmissive = settings.emissive;
  basePadBevelSize = settings.bevelSize;
  basePadBevelSegments = settings.bevelSegments;
  basePadFlatShading = settings.flatShading;
  basePadBorderOpacity = settings.borderOpacity;
  basePadBorderBrightness = settings.borderBrightness;
}

export function applyBasePadMaterialRuntimeSettings(settings) {
  basePadTextureMode = settings.textureMode;
  basePadTextureRepeat = settings.textureRepeat;
  basePadTextureRotation = settings.textureRotation;
  basePadNormalStrength = settings.normalStrength;
  basePadHue = settings.hue;
  basePadSaturation = settings.saturation;
  basePadBrightness = settings.brightness;
  basePadMetalness = settings.metalness;
  basePadRoughness = settings.roughness;
  basePadReflect = settings.reflect;
  basePadEmissive = settings.emissive;
  basePadFlatShading = settings.flatShading;
  basePadBorderOpacity = settings.borderOpacity;
  basePadBorderBrightness = settings.borderBrightness;
}

export function applyBasePadMaterialSettings(lightResponse) {
  basePadSurfaceTex.repeat.set(basePadTextureRepeat, basePadTextureRepeat);
  basePadSurfaceTex.center.set(0.5, 0.5);
  basePadSurfaceTex.rotation = THREE.MathUtils.degToRad(basePadTextureRotation);
  basePadSurfaceMat.map = basePadTextureMode === 'on' ? basePadSurfaceTex : null;
  basePadSurfaceMat.normalMap = basePadNormalStrength > 0.001 ? roadMicroNormalTex : null;
  basePadSurfaceMat.normalScale.set(basePadNormalStrength, basePadNormalStrength);
  basePadSurfaceMat.color.copy(tunedColor(basePadSurfaceBaseColor, basePadHue, basePadSaturation, basePadBrightness * lightResponse.surface));
  basePadSurfaceMat.metalness = basePadMetalness;
  basePadSurfaceMat.roughness = basePadRoughness;
  basePadSurfaceMat.envMapIntensity = basePadReflect * lightResponse.reflection;
  basePadSurfaceMat.emissive.copy(tunedColor(basePadSurfaceEmissiveColor, basePadHue, Math.max(0.4, basePadSaturation), 1));
  basePadSurfaceMat.emissiveIntensity = basePadEmissive * lightResponse.emissive + lightResponse.floorFill * 0.35;
  basePadSurfaceMat.flatShading = basePadFlatShading;
  basePadSurfaceMat.needsUpdate = true;
  buildingBasePadBorderMat.opacity = basePadBorderOpacity;
  buildingBasePadBorderMat.color.copy(tunedColor(basePadBorderBaseColor, basePadHue, Math.max(0.4, basePadSaturation), basePadBorderBrightness));
}

function basePadCombinedRecords() {
  // sideBuildingRecords/mainBuildingRecords are append-only after city build; rebuild the
  // combined scan list only when membership changes instead of spreading a fresh array per frame.
  const key = sideBuildingRecords.length * 100000 + mainBuildingRecords.length;
  if (key !== basePadScanRecordsKey) {
    basePadScanRecords.length = 0;
    for (const record of sideBuildingRecords) basePadScanRecords.push(record);
    for (const record of mainBuildingRecords) basePadScanRecords.push(record);
    basePadScanRecordsKey = key;
  }
  return basePadScanRecords;
}

export function basePadAtPoint(x, z) {
  const records = basePadCombinedRecords();
  let bestPad = null;
  let bestTopY = -Infinity;
  for (const record of records) {
    const pad = record.basePad;
    if (!pad?.hitPolygon?.length) continue;
    const dx = x - pad.border.position.x;
    const dz = z - pad.border.position.z;
    if (Math.abs(dx) > (pad.hitHalfSize || 0) || Math.abs(dz) > (pad.hitHalfSize || 0)) continue;
    if (!pointInBasePadPolygon(dx, dz, pad.hitPolygon)) continue;
    const onInner = pad.innerHitPolygon?.length && pointInBasePadPolygon(dx, dz, pad.innerHitPolygon);
    const topY = onInner ? (pad.innerTopY ?? pad.topY ?? roadTileTopY()) : (pad.topY ?? roadTileTopY());
    if (topY > bestTopY) {
      bestTopY = topY;
      bestPad = pad;
    }
  }
  return bestPad ? { pad: bestPad, topY: bestTopY } : null;
}

function ensureBasePadHexOverlayCapacity(count) {
  const needed = Math.max(1, count);
  if (basePadHexOverlay && basePadHexOverlayCapacity >= needed) return;
  if (basePadHexOverlay) scene.remove(basePadHexOverlay);
  basePadHexOverlayCapacity = needed;
  basePadHexOverlay = new THREE.InstancedMesh(hexTileGeo, basePadHexMat, basePadHexOverlayCapacity);
  basePadHexOverlay.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  basePadHexOverlay.count = 0;
  basePadHexOverlay.frustumCulled = false;
  basePadHexOverlay.renderOrder = 3;
  scene.add(basePadHexOverlay);
}

function basePadPoints(width, depth, cornerCut) {
  const halfX = width / 2;
  const halfZ = depth / 2;
  const cut = THREE.MathUtils.clamp(cornerCut, 0, Math.max(0, Math.min(halfX, halfZ) - 0.02));
  if (cut <= 0.001) {
    return [
      new THREE.Vector2(-halfX, -halfZ),
      new THREE.Vector2( halfX, -halfZ),
      new THREE.Vector2( halfX,  halfZ),
      new THREE.Vector2(-halfX,  halfZ),
    ];
  }
  return [
    new THREE.Vector2(-halfX + cut, -halfZ),
    new THREE.Vector2( halfX - cut, -halfZ),
    new THREE.Vector2( halfX, -halfZ + cut),
    new THREE.Vector2( halfX,  halfZ - cut),
    new THREE.Vector2( halfX - cut,  halfZ),
    new THREE.Vector2(-halfX + cut,  halfZ),
    new THREE.Vector2(-halfX,  halfZ - cut),
    new THREE.Vector2(-halfX, -halfZ + cut),
  ];
}

function basePadCornerData(points, index, radius) {
  const prev = points[(index - 1 + points.length) % points.length];
  const current = points[index];
  const next = points[(index + 1) % points.length];
  const prevLength = current.distanceTo(prev);
  const nextLength = current.distanceTo(next);
  const amount = THREE.MathUtils.clamp(radius, 0, Math.min(prevLength, nextLength) * 0.45);
  if (amount <= 0.001) {
    return { start: current.clone(), control: current.clone(), end: current.clone(), rounded: false };
  }
  return {
    start: current.clone().add(prev.clone().sub(current).normalize().multiplyScalar(amount)),
    control: current.clone(),
    end: current.clone().add(next.clone().sub(current).normalize().multiplyScalar(amount)),
    rounded: true,
  };
}

function basePadBorderPoints(width, depth, cornerCut, radius) {
  const points = basePadPoints(width, depth, cornerCut);
  const border = [];
  const curveSteps = 8;
  points.forEach((point, index) => {
    const corner = basePadCornerData(points, index, radius);
    border.push(new THREE.Vector3(corner.start.x, 0, corner.start.y));
    if (!corner.rounded) return;
    for (let step = 1; step <= curveSteps; step++) {
      const t = step / curveSteps;
      const inv = 1 - t;
      const x = inv * inv * corner.start.x + 2 * inv * t * corner.control.x + t * t * corner.end.x;
      const z = inv * inv * corner.start.y + 2 * inv * t * corner.control.y + t * t * corner.end.y;
      border.push(new THREE.Vector3(x, 0, z));
    }
  });
  return border;
}

function makeBasePadShape(width, depth, cornerCut, radius) {
  const shapePoints = basePadBorderPoints(width, depth, cornerCut, radius).map((point) => new THREE.Vector2(point.x, point.z));
  return new THREE.Shape(shapePoints);
}

function applyBasePadUv(geometry, width, depth) {
  const position = geometry.getAttribute('position');
  const uv = [];
  for (let i = 0; i < position.count; i++) {
    uv.push(position.getX(i) / width + 0.5, -position.getZ(i) / depth + 0.5);
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  return geometry;
}

function makeBasePadSurfaceGeometry(width, depth, cornerCut, radius, thickness) {
  const bevelSize = Math.min(
    Math.max(0, basePadBevelSize),
    Math.max(0, thickness * 0.45),
    Math.max(0, Math.min(width, depth) * 0.045)
  );
  const geometry = new THREE.ExtrudeGeometry(makeBasePadShape(width, depth, cornerCut, radius), {
    depth: thickness,
    bevelEnabled: bevelSize > 0.001,
    bevelSize,
    bevelThickness: bevelSize,
    bevelSegments: Math.max(1, Math.round(basePadBevelSegments)),
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  return applyBasePadUv(geometry, width, depth);
}

function innerBasePadPointsFromOuter(borderPoints, width, depth, inset) {
  const halfX = Math.max(0.001, width / 2);
  const halfZ = Math.max(0.001, depth / 2);
  const ix = Math.max(0.05, (halfX - inset) / halfX);
  const iz = Math.max(0.05, (halfZ - inset) / halfZ);
  return borderPoints.map((point) => new THREE.Vector3(point.x * ix, 0, point.z * iz));
}

function makeBasePadTopGeometry(points, y) {
  if (!points?.length) return new THREE.BufferGeometry();
  const shape = new THREE.Shape(points.map((point) => new THREE.Vector2(point.x, point.z)));
  const geometry = new THREE.ShapeGeometry(shape);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getY(i);
    position.setXYZ(i, x, y, z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function curbRampProfile(t, radiusAmount) {
  const radius = THREE.MathUtils.clamp(radiusAmount, 0, 2);
  const smooth = t * t * (3 - 2 * t);
  return THREE.MathUtils.lerp(t, smooth, Math.min(1, radius));
}

function makeBasePadCurbRampGeometry(outerPoints, innerPoints, outerY, innerY, radiusAmount = 0) {
  if (!outerPoints?.length || outerPoints.length !== innerPoints?.length) return new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];
  const radialSegments = Math.max(1, Math.round(1 + THREE.MathUtils.clamp(radiusAmount, 0, 2) * 8));
  const rings = radialSegments + 1;
  outerPoints.forEach((outer, index) => {
    const inner = innerPoints[index];
    for (let ring = 0; ring < rings; ring++) {
      const t = ring / radialSegments;
      const yT = curbRampProfile(t, radiusAmount);
      positions.push(
        THREE.MathUtils.lerp(outer.x, inner.x, t),
        THREE.MathUtils.lerp(outerY, innerY, yT),
        THREE.MathUtils.lerp(outer.z, inner.z, t)
      );
      uvs.push(index / outerPoints.length, t);
    }
  });
  for (let i = 0; i < outerPoints.length; i++) {
    const next = (i + 1) % outerPoints.length;
    for (let ring = 0; ring < radialSegments; ring++) {
      const a = i * rings + ring;
      const b = next * rings + ring;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, d, a, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createBuildingBasePad(group, x, z) {
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), basePadSurfaceMat);
  mesh.position.set(x, DEFAULT_BASE_PAD_Y - DEFAULT_BASE_PAD_THICKNESS, z);
  mesh.renderOrder = 1;
  mesh.frustumCulled = BASE_PAD_FRUSTUM_CULLING_ENABLED;
  group.add(mesh);
  // fx.basePad=0: hide the large opaque sidewalk-pad top surface (envMap PBR, the
  // second-largest floor fill after the hex tiles). No per-frame writer touches
  // the outer surface mesh, so this one-shot persists.
  mesh.visible = fxEnabled('basePad');

  const curbRamp = new THREE.Mesh(new THREE.BufferGeometry(), basePadSurfaceMat);
  curbRamp.position.set(x, 0, z);
  curbRamp.renderOrder = 2;
  curbRamp.frustumCulled = BASE_PAD_FRUSTUM_CULLING_ENABLED;
  curbRamp.visible = false;
  group.add(curbRamp);

  const innerMesh = new THREE.Mesh(new THREE.BufferGeometry(), basePadSurfaceMat);
  innerMesh.position.set(x, 0, z);
  innerMesh.renderOrder = 3;
  innerMesh.frustumCulled = BASE_PAD_FRUSTUM_CULLING_ENABLED;
  innerMesh.visible = false;
  group.add(innerMesh);

  const border = new THREE.LineLoop(new THREE.BufferGeometry(), buildingBasePadBorderMat);
  border.position.set(x, DEFAULT_BASE_PAD_Y + 0.035, z);
  border.renderOrder = 4;
  border.frustumCulled = BASE_PAD_FRUSTUM_CULLING_ENABLED;
  group.add(border);

  const innerBorder = new THREE.LineLoop(new THREE.BufferGeometry(), buildingBasePadBorderMat);
  innerBorder.position.set(x, DEFAULT_BASE_PAD_Y + 0.035, z);
  innerBorder.renderOrder = 5;
  innerBorder.frustumCulled = BASE_PAD_FRUSTUM_CULLING_ENABLED;
  innerBorder.visible = false;
  group.add(innerBorder);
  return { mesh, curbRamp, innerMesh, border, innerBorder, hitPolygon: [], innerHitPolygon: [], hitHalfSize: 0 };
}

export function updateBuildingBasePad(record, x, z, widthScale, depthScale, sizeScale, padXScale, padZScale, padY, padThickness, cornerCut, radius) {
  if (!record.basePad) return;
  const footprintWidth = record.baseW * widthScale;
  const footprintDepth = record.baseD * depthScale;
  const squareSide = Math.max(footprintWidth, footprintDepth) * sizeScale;
  const width = squareSide * padXScale;
  const depth = squareSide * padZScale;
  const requestedPadY = padY + basePadGlobalY;
  const roadTopY = roadTileTopY();
  const contactY = roadTopY - SIDEWALK_CURB_OVERLAP;
  const effectivePadY = Math.max(requestedPadY, sidewalkMinSurfaceY());
  const bottomY = Math.min(effectivePadY - Math.max(0.01, padThickness), contactY);
  const thickness = Math.max(0.01, effectivePadY - bottomY);
  const borderPoints = basePadBorderPoints(width, depth, cornerCut, radius);
  record.basePad.mesh.geometry.dispose();
  record.basePad.mesh.geometry = makeBasePadSurfaceGeometry(width, depth, cornerCut, radius, thickness);
  refreshCullingBoundsWithMargin(record.basePad.mesh, BASE_PAD_CULLING_BOUNDS_MARGIN);
  record.basePad.mesh.position.y = bottomY;
  record.basePad.mesh.position.x = x;
  record.basePad.mesh.position.z = z;
  record.basePad.border.geometry.dispose();
  record.basePad.border.geometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
  refreshCullingBoundsWithMargin(record.basePad.border, BASE_PAD_CULLING_BOUNDS_MARGIN);
  record.basePad.border.position.x = x;
  record.basePad.border.position.y = effectivePadY + 0.035;
  record.basePad.border.position.z = z;
  const curbInset = THREE.MathUtils.clamp(basePadCurbWidth, 0, Math.min(width, depth) * 0.49);
  const hasDoubleCurb = basePadCurbEnabled && curbInset > 0.05;
  if (hasDoubleCurb) {
    const curbOuterPoints = borderPoints.map((point) => point.clone());
    const innerPoints = innerBasePadPointsFromOuter(curbOuterPoints, width, depth, curbInset);
    const innerRaise = Math.max(0, basePadInnerRaise);
    const slopeRaise = innerRaise * THREE.MathUtils.clamp(basePadCurbSlope, 0, 3);
    const curbOuterY = effectivePadY + 0.002;
    const curbInnerY = effectivePadY + Math.max(0.012, slopeRaise + 0.012);
    const innerTopY = effectivePadY + innerRaise + 0.018;
    record.basePad.curbRamp.geometry.dispose();
    record.basePad.curbRamp.geometry = makeBasePadCurbRampGeometry(curbOuterPoints, innerPoints, curbOuterY, curbInnerY, basePadCurbRadius);
    refreshCullingBoundsWithMargin(record.basePad.curbRamp, BASE_PAD_CULLING_BOUNDS_MARGIN);
    record.basePad.curbRamp.position.x = x;
    record.basePad.curbRamp.position.y = 0;
    record.basePad.curbRamp.position.z = z;
    record.basePad.curbRamp.visible = true;
    record.basePad.innerMesh.geometry.dispose();
    record.basePad.innerMesh.geometry = makeBasePadTopGeometry(innerPoints, innerTopY);
    refreshCullingBoundsWithMargin(record.basePad.innerMesh, BASE_PAD_CULLING_BOUNDS_MARGIN);
    record.basePad.innerMesh.position.x = x;
    record.basePad.innerMesh.position.y = 0;
    record.basePad.innerMesh.position.z = z;
    record.basePad.innerMesh.visible = true;
    record.basePad.innerBorder.geometry.dispose();
    record.basePad.innerBorder.geometry = new THREE.BufferGeometry().setFromPoints(innerPoints);
    refreshCullingBoundsWithMargin(record.basePad.innerBorder, BASE_PAD_CULLING_BOUNDS_MARGIN);
    record.basePad.innerBorder.position.x = x;
    record.basePad.innerBorder.position.y = innerTopY + 0.035;
    record.basePad.innerBorder.position.z = z;
    record.basePad.innerBorder.visible = true;
    record.basePad.innerHitPolygon = innerPoints.map((point) => [point.x, point.z]);
    record.basePad.innerTopY = innerTopY;
    record.basePad.curbInset = curbInset;
    record.basePad.curbOuterY = curbOuterY;
    record.basePad.curbSlope = basePadCurbSlope;
    record.basePad.curbRadius = basePadCurbRadius;
  } else {
    record.basePad.curbRamp.visible = false;
    record.basePad.innerMesh.visible = false;
    record.basePad.innerBorder.visible = false;
    record.basePad.innerHitPolygon = [];
    record.basePad.innerTopY = null;
    record.basePad.curbInset = 0;
    record.basePad.curbOuterY = null;
    record.basePad.curbSlope = basePadCurbSlope;
    record.basePad.curbRadius = basePadCurbRadius;
  }
  record.basePad.hitPolygon = borderPoints.map((point) => [point.x, point.z]);
  record.basePad.hitHalfSize = Math.max(width, depth) / 2 + hexTileRadius * Math.max(0.35, getHexTileScale() * 0.5);
  record.basePad.width = width;
  record.basePad.depth = depth;
  record.basePad.cornerCut = cornerCut;
  record.basePad.radius = radius;
  record.basePad.localY = padY;
  record.basePad.globalY = basePadGlobalY;
  record.basePad.requestedTopY = requestedPadY;
  record.basePad.roadTopY = roadTopY;
  record.basePad.contactY = contactY;
  record.basePad.bottomY = bottomY;
  record.basePad.curbReveal = effectivePadY - roadTopY;
  record.basePad.topY = effectivePadY;
  record.basePad.thickness = thickness;
}

export function pointInBasePadPolygon(x, z, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], zi = polygon[i][1];
    const xj = polygon[j][0], zj = polygon[j][1];
    const crosses = (zi > z) !== (zj > z);
    if (crosses && x < ((xj - xi) * (z - zi)) / ((zj - zi) || 1e-6) + xi) inside = !inside;
  }
  return inside;
}

function polygonSignedArea(points) {
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    area += points[j][0] * points[i][1] - points[i][0] * points[j][1];
  }
  return area / 2;
}

function segmentIntersection(a, b, c, d) {
  const bax = b[0] - a[0];
  const baz = b[1] - a[1];
  const dcx = d[0] - c[0];
  const dcz = d[1] - c[1];
  const denominator = bax * dcz - baz * dcx;
  if (Math.abs(denominator) < 1e-6) return b;
  const t = ((c[0] - a[0]) * dcz - (c[1] - a[1]) * dcx) / denominator;
  return [a[0] + bax * t, a[1] + baz * t];
}

function clipPolygonToConvex(subject, clip) {
  let output = subject.slice();
  if (output.length < 3 || clip.length < 3) return [];
  const orientation = polygonSignedArea(clip) >= 0 ? 1 : -1;
  const inside = (point, a, b) => {
    const cross = (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
    return orientation * cross >= -0.001;
  };

  for (let i = 0; i < clip.length; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const input = output;
    output = [];
    if (!input.length) break;
    let previous = input[input.length - 1];
    let previousInside = inside(previous, a, b);
    for (const current of input) {
      const currentInside = inside(current, a, b);
      if (currentInside) {
        if (!previousInside) output.push(segmentIntersection(previous, current, a, b));
        output.push(current);
      } else if (previousInside) {
        output.push(segmentIntersection(previous, current, a, b));
      }
      previous = current;
      previousInside = currentInside;
    }
  }
  return output;
}

function hexTilePolygonLocalToPad(tile, pad) {
  const localX = tile.userData.x - pad.border.position.x;
  const localZ = tile.userData.z - pad.border.position.z;
  const radius = hexTileRadius * getHexTileScale();
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 6 + i * Math.PI / 3;
    points.push([
      localX + Math.cos(angle) * radius,
      localZ + Math.sin(angle) * radius,
    ]);
  }
  return points;
}

function appendClippedHexSurface(positions, tile, pad, clippedPolygon) {
  if (clippedPolygon.length < 3) return false;
  const y = tile.userData.baseY + tile.userData.depression + (hexTileHeight * getHexTileHeightScale() * 0.5) + 0.16;
  const originX = pad.border.position.x;
  const originZ = pad.border.position.z;
  for (let i = 1; i < clippedPolygon.length - 1; i++) {
    const a = clippedPolygon[0];
    const b = clippedPolygon[i];
    const c = clippedPolygon[i + 1];
    positions.push(
      originX + a[0], y, originZ + a[1],
      originX + b[0], y, originZ + b[1],
      originX + c[0], y, originZ + c[1],
    );
  }
  return true;
}

export function updateBasePadHexInfluence() {
  for (const tile of hexRoadTiles) {
    if ((tile.userData.basePadLight || 0) > 0 || tile.userData.basePadOverlayId >= 0) {
      tile.userData.basePadLight = 0;
      tile.userData.basePadOverlayId = -1;
      syncHexTileDisplayColor(
        tile,
        tile.userData.hitLight || 0,
        tile.userData.playerLight || 0,
        0
      );
    }
  }
  if (basePadHexOverlay) {
    basePadHexOverlay.count = 0;
    basePadHexOverlay.visible = false;
    basePadHexOverlay.instanceMatrix.needsUpdate = true;
  }
  basePadHexClipMesh.geometry.dispose();
  basePadHexClipMesh.geometry = new THREE.BufferGeometry();
  basePadHexClipMesh.visible = false;
  basePadClippedHexPolygons = 0;
  basePadFullHexOverlays = 0;
}

function ensureBasePadLedMaterial() {
  if (basePadLedBatch.material) return basePadLedBatch.material;
  basePadLedBatch.material = new THREE.MeshBasicMaterial({
    color: PAL.tealLight,
    toneMapped: false,
    depthWrite: true,
    // Draw sidewalk LEDs after the fake runner reflection so the reflection
    // cannot visually sit on top of the LED strips.
    transparent: true,
    opacity: 1,
  });
  // Same travelling energy flow as the building edges (instanced strips, local Z = length).
  applyEdgePulseShader(basePadLedBatch.material);
  return basePadLedBatch.material;
}

function basePadLedSegmentCountForRecord(record) {
  let count = 0;
  const points = record.basePad?.hitPolygon;
  if (points?.length > 1) count += points.length;
  const innerPoints = record.basePad?.innerHitPolygon;
  if (basePadCurbEnabled && innerPoints?.length > 1) count += innerPoints.length;
  return count;
}

function ensureBasePadLedBatchForRecord(record, count) {
  const needed = Math.max(1, count);
  let batch = record.basePadLedBatch || null;
  if (batch?.mesh && batch.capacity >= needed) return batch;

  if (batch?.mesh) {
    overlayGroup.remove(batch.mesh);
    // free the retired mesh's instanceMatrix buffer; basePadLedUnitGeometry is shared and must stay
    batch.mesh.dispose();
    const index = basePadLedBatch.batches.indexOf(batch);
    if (index >= 0) basePadLedBatch.batches.splice(index, 1);
  }

  const capacity = Math.max(needed, Math.ceil(needed * 1.25));
  const mesh = new THREE.InstancedMesh(basePadLedUnitGeometry, ensureBasePadLedMaterial(), capacity);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = true;
  mesh.renderOrder = BASE_PAD_LED_RENDER_ORDER;
  batch = { mesh, capacity, count: 0, record };
  record.basePadLedBatch = batch;
  basePadLedBatch.batches.push(batch);
  overlayGroup.add(mesh);
  return batch;
}

function syncBasePadLedBatchAggregate() {
  basePadLedBatch.count = basePadLedBatch.batches.reduce((sum, batch) => sum + batch.count, 0);
  basePadLedBatch.capacity = basePadLedBatch.batches.reduce((sum, batch) => sum + batch.capacity, 0);
  basePadLedBatch.mesh = basePadLedBatch.batches.length === 1 ? basePadLedBatch.batches[0].mesh : null;
}

export function basePadLedSegmentCount() {
  let count = 0;
  for (const record of [...sideBuildingRecords, ...mainBuildingRecords]) {
    count += basePadLedSegmentCountForRecord(record);
  }
  return count;
}

export function updateBasePadLedStrips(brightness, thickness, offset, hueDeg) {
  const material = ensureBasePadLedMaterial();
  material.color.copy(tunedColor(new THREE.Color(PAL.tealLight), hueDeg, 1, brightness));

  for (const record of [...sideBuildingRecords, ...mainBuildingRecords]) {
    const pad = record.basePad;
    const points = pad?.hitPolygon;
    const batch = ensureBasePadLedBatchForRecord(record, basePadLedSegmentCountForRecord(record));
    const mesh = batch.mesh;
    if (!points?.length) {
      batch.count = 0;
      mesh.count = 0;
      mesh.visible = false;
      continue;
    }
    const baseX = pad.border.position.x;
    const baseZ = pad.border.position.z;
    let index = 0;
    // Right-side buildings (even civic numbers 2, 4, 6, ...) flow the opposite way:
    // swapping the strip endpoints reverses the local-Z the energy travels along.
    const flipFlow = Number.isFinite(record.civicNumberValue) && record.civicNumberValue % 2 === 0;
    const addPadLoop = (loopPoints, loopTopY) => {
      const stripY = loopTopY + Math.max(0.01, thickness * 0.5) + 0.006;
      const orientation = polygonSignedArea(loopPoints) >= 0 ? 1 : -1;
      for (let i = 0; i < loopPoints.length; i++) {
        const a = loopPoints[i];
        const b = loopPoints[(i + 1) % loopPoints.length];
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const len = Math.hypot(dx, dz) || 1;
        const normalX = orientation * dz / len;
        const normalZ = -orientation * dx / len;
        const p1 = [baseX + a[0] + normalX * offset, stripY, baseZ + a[1] + normalZ * offset];
        const p2 = [baseX + b[0] + normalX * offset, stripY, baseZ + b[1] + normalZ * offset];
        if (flipFlow) setStripInstanceTransform(mesh, index, p2, p1, thickness);
        else setStripInstanceTransform(mesh, index, p1, p2, thickness);
        index++;
      }
    };
    addPadLoop(points, pad.topY ?? DEFAULT_BASE_PAD_Y);
    if (basePadCurbEnabled && pad.innerHitPolygon?.length) {
      addPadLoop(pad.innerHitPolygon, pad.innerTopY ?? pad.topY ?? DEFAULT_BASE_PAD_Y);
    }

    batch.count = index;
    mesh.count = index;
    mesh.visible = basePadLedBatch.sceneVisible && record.mesh.visible !== false && index > 0 && brightness > 0.001;
    mesh.instanceMatrix.needsUpdate = true;
    refreshCullingBounds(mesh);
  }
  syncBasePadLedBatchAggregate();
}
