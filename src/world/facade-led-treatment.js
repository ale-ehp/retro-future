import * as THREE from 'three';
import { fxEnabled } from '../engine/fx-debug-toggles.js';
import { GRID_BLOCK, SIDE_FACADE_LED_REFERENCE_HEIGHT } from './boulevard-constants.js';
import { SIDE_DOOR_FIXED } from './building-doors.js';

export const MAIN_FACADE_VERTICAL_REVEAL_FEATHER = 18;

let PAL = null;
let reflectionEnvMap = null;
let refreshCullingBounds = () => {};
let tunedColor = (color) => color;
let registerMainBuildingVerticalRevealOverlayObject = () => {};
let getSideBuildingWidthScale = () => 1;
let getSideBuildingDepthScale = () => 1;
let getMainBuildingWidthScale = () => 1;
let getMainBuildingDepthScale = () => 1;

const facadeLedSpecs = [];
const facadeStripPositionSpecs = [];
const facadeStripBatchParents = new Set();
const mainFacadeVerticalRevealLedSpecs = [];
const facadeStripUnitGeometry = new THREE.BoxGeometry(1, 1, 1);
const facadeRevealWorldPoint = new THREE.Vector3();
let mainFacadeVerticalRevealLedMaterial = null;
let mainBuildingEdgeVerticalRevealLedMaterial = null;
let facadeHousingSourceSegmentCount = 0;
let facadeLedSourceSegmentCount = 0;
let sharedFacadeHousingMaterial = null;
const sharedFacadeLedMaterials = new Map();
let buildingFacadeLedNormal = 12;
let buildingFacadeLedX = 0;
let buildingFacadeLedY = 0;
let buildingFacadeLedZ = 0;
const sideBuildingFacadeLedSegmentOffsets = Array.from({ length: 6 }, () => ({ u: 0, y: 0, normal: 0 }));
let mainBuildingFacadeLedBrightness = 0.56;
let mainBuildingFacadeLedNormal = 3.8;
let mainBuildingFacadeLedX = 0;
let mainBuildingFacadeLedY = 0;
let mainBuildingFacadeLedZ = 0;
let mainBuildingFacadeLedThickness = 1;
const mainBuildingFacadeLedSegmentOffsets = Array.from({ length: 6 }, () => ({ u: 0, y: 0, normal: 0 }));
const FACADE_LED_WORLD_OUTSET = SIDE_DOOR_FIXED.faceOffset;
const FACADE_LED_SURFACE_EPS = 0.04;

export function initFacadeLedTreatment(deps) {
  PAL = deps.PAL;
  reflectionEnvMap = deps.reflectionEnvMap;
  refreshCullingBounds = deps.refreshCullingBounds;
  tunedColor = deps.tunedColor;
  registerMainBuildingVerticalRevealOverlayObject = deps.registerMainBuildingVerticalRevealOverlayObject;
  getSideBuildingWidthScale = deps.getSideBuildingWidthScale;
  getSideBuildingDepthScale = deps.getSideBuildingDepthScale;
  getMainBuildingWidthScale = deps.getMainBuildingWidthScale;
  getMainBuildingDepthScale = deps.getMainBuildingDepthScale;
}

function applySegmentOffsets(target, offsets = []) {
  offsets.forEach((offset, index) => {
    if (!target[index]) return;
    target[index].u = offset.u;
    target[index].y = offset.y;
    target[index].normal = offset.normal;
  });
}

export function setFacadeLedRuntimeSettings(settings) {
  buildingFacadeLedNormal = settings.side.normal;
  buildingFacadeLedX = settings.side.x;
  buildingFacadeLedY = settings.side.y;
  buildingFacadeLedZ = settings.side.z;
  applySegmentOffsets(sideBuildingFacadeLedSegmentOffsets, settings.side.segments);
  mainBuildingFacadeLedBrightness = settings.main.brightness;
  mainBuildingFacadeLedNormal = settings.main.normal;
  mainBuildingFacadeLedX = settings.main.x;
  mainBuildingFacadeLedY = settings.main.y;
  mainBuildingFacadeLedZ = settings.main.z;
  mainBuildingFacadeLedThickness = settings.main.thickness;
  applySegmentOffsets(mainBuildingFacadeLedSegmentOffsets, settings.main.segments);
}

export function facadeLedRuntimeInspect() {
  return {
    mainFacade: {
      brightness: mainBuildingFacadeLedBrightness,
      normal: mainBuildingFacadeLedNormal,
      x: mainBuildingFacadeLedX,
      y: mainBuildingFacadeLedY,
      z: mainBuildingFacadeLedZ,
      thickness: mainBuildingFacadeLedThickness,
      segments: mainBuildingFacadeLedSegmentOffsets.map((offset) => ({ ...offset })),
    },
    sideFacade: {
      normal: buildingFacadeLedNormal,
      x: buildingFacadeLedX,
      y: buildingFacadeLedY,
      z: buildingFacadeLedZ,
      segments: sideBuildingFacadeLedSegmentOffsets.map((offset) => ({ ...offset })),
    },
  };
}

export function hasMainFacadeVerticalRevealLedMaterials() {
  return Boolean(mainFacadeVerticalRevealLedMaterial || mainBuildingEdgeVerticalRevealLedMaterial);
}

export function facadeLedBatchInspect() {
  const facadeStripBatches = [];
  for (const parent of facadeStripBatchParents) {
    const parentBatch = parent.userData.facadeStripBatch;
    if (!parentBatch) continue;
    for (const kind of ['housing', 'led']) {
      const meshes = new Set(parentBatch[kind].map((spec) => spec.batchMesh).filter(Boolean));
      for (const mesh of meshes) {
        const specs = parentBatch[kind].filter((spec) => spec.batchMesh === mesh);
        facadeStripBatches.push({
          kind,
          edgeRole: specs[0]?.edgeRole || 'unknown',
          count: mesh.count ?? specs.length,
          visible: Boolean(mesh.visible),
          frustumCulled: Boolean(mesh.frustumCulled),
          x: parent.position?.x ?? null,
          z: parent.position?.z ?? null,
        });
      }
    }
  }
  const facadeStripBatchCount = facadeStripBatches.length;
  const facadeStripVisibleCount = facadeStripBatches.filter((batch) => batch.visible).length;
  const facadeStripFrustumCulledCount = facadeStripBatches.filter((batch) => batch.frustumCulled).length;
  return {
    ledSpecs: facadeLedSourceSegmentCount,
    housingSpecs: facadeHousingSourceSegmentCount,
    batches: facadeLedSpecs.filter((spec) => spec.batch).length,
    stripBatchCount: facadeStripBatchCount,
    visibleStripBatchCount: facadeStripVisibleCount,
    frustumCulledStripBatchCount: facadeStripFrustumCulledCount,
    stripBatches: facadeStripBatches,
  };
}

export function sideBuildingLedLayoutInspect(record) {
  const centers = facadeStripPositionSpecs
    .filter((spec) => spec.parent === record.mesh && spec.edgeRole === 'side-building' && spec.batchKind === 'led')
    .map((spec) => facadeStripDynamicTransform(spec).basePosition.y)
    .sort((a, b) => a - b);
  return {
    value: record.civicNumberValue,
    baseH: record.collider?.baseH ?? null,
    z: record.mesh.position.z,
    yMin: centers[0] ?? null,
    yMax: centers[centers.length - 1] ?? null,
    yCenters: centers,
  };
}

function createFacadeHousingMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x011014,
    metalness: 0.78,
    roughness: 0.24,
    envMap: reflectionEnvMap,
    envMapIntensity: 0.9,
    emissive: 0x001e24,
    emissiveIntensity: 0.32,
  });
}

export function createFacadeLedMaterial(color = PAL.tealLight) {
  return new THREE.MeshBasicMaterial({
    color,
    toneMapped: false,
    depthWrite: true,
    depthTest: true,
  });
}

function createMainFacadeVerticalRevealLedMaterial(color = PAL.tealLight) {
  const material = createFacadeLedMaterial(color);
  material.transparent = true;
  material.userData.mainFacadeRevealY = -1e9;
  material.userData.mainFacadeRevealFeather = MAIN_FACADE_VERTICAL_REVEAL_FEATHER;
  material.userData.mainFacadeRevealEnabled = 1;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.mainFacadeRevealY = { value: material.userData.mainFacadeRevealY };
    shader.uniforms.mainFacadeRevealFeather = { value: material.userData.mainFacadeRevealFeather };
    shader.uniforms.mainFacadeRevealEnabled = { value: material.userData.mainFacadeRevealEnabled };
    material.userData.mainFacadeRevealYUniform = shader.uniforms.mainFacadeRevealY;
    material.userData.mainFacadeRevealFeatherUniform = shader.uniforms.mainFacadeRevealFeather;
    material.userData.mainFacadeRevealEnabledUniform = shader.uniforms.mainFacadeRevealEnabled;
    shader.vertexShader = `varying float vMainFacadeRevealWorldY;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `vec4 mainFacadeRevealWorldPosition = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
mainFacadeRevealWorldPosition = instanceMatrix * mainFacadeRevealWorldPosition;
#endif
mainFacadeRevealWorldPosition = modelMatrix * mainFacadeRevealWorldPosition;
vMainFacadeRevealWorldY = mainFacadeRevealWorldPosition.y;
#include <worldpos_vertex>`
    );
    shader.fragmentShader = `uniform float mainFacadeRevealY;\nuniform float mainFacadeRevealFeather;\nuniform float mainFacadeRevealEnabled;\nvarying float vMainFacadeRevealWorldY;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <alphatest_fragment>',
      `if (mainFacadeRevealEnabled > 0.5) {
  float revealFeather = max(mainFacadeRevealFeather, 0.001);
  float revealAlpha = 1.0 - smoothstep(mainFacadeRevealY - revealFeather, mainFacadeRevealY, vMainFacadeRevealWorldY);
  if (revealAlpha <= 0.001) discard;
  diffuseColor.a *= revealAlpha;
}
#include <alphatest_fragment>`
    );
  };
  material.customProgramCacheKey = () => 'main-facade-vertical-led-reveal-v1';
  material.needsUpdate = true;
  return material;
}

function getSharedFacadeHousingMaterial() {
  if (!sharedFacadeHousingMaterial) sharedFacadeHousingMaterial = createFacadeHousingMaterial();
  return sharedFacadeHousingMaterial;
}

function getSharedFacadeLedMaterial(edgeRole = 'side-building') {
  const key = edgeRole === 'main-building' ? 'main-building' : 'side-building';
  if (!sharedFacadeLedMaterials.has(key)) sharedFacadeLedMaterials.set(key, createFacadeLedMaterial(PAL.tealLight));
  return sharedFacadeLedMaterials.get(key);
}

function getMainFacadeVerticalRevealLedMaterial() {
  if (!mainFacadeVerticalRevealLedMaterial) {
    mainFacadeVerticalRevealLedMaterial = createMainFacadeVerticalRevealLedMaterial(PAL.tealLight);
  }
  return mainFacadeVerticalRevealLedMaterial;
}

function getMainBuildingEdgeVerticalRevealLedMaterial(color = PAL.tealLight) {
  if (!mainBuildingEdgeVerticalRevealLedMaterial) {
    mainBuildingEdgeVerticalRevealLedMaterial = createMainFacadeVerticalRevealLedMaterial(color);
    mainBuildingEdgeVerticalRevealLedMaterial.customProgramCacheKey = () => 'main-building-edge-vertical-led-reveal-v1';
  }
  return mainBuildingEdgeVerticalRevealLedMaterial;
}

function applyMainFacadeVerticalRevealUniformsTo(material, revealY, feather, enabled) {
  if (!material) return;
  material.userData.mainFacadeRevealY = revealY;
  material.userData.mainFacadeRevealFeather = feather;
  material.userData.mainFacadeRevealEnabled = enabled ? 1 : 0;
  if (material.userData.mainFacadeRevealYUniform) material.userData.mainFacadeRevealYUniform.value = revealY;
  if (material.userData.mainFacadeRevealFeatherUniform) material.userData.mainFacadeRevealFeatherUniform.value = feather;
  if (material.userData.mainFacadeRevealEnabledUniform) material.userData.mainFacadeRevealEnabledUniform.value = enabled ? 1 : 0;
}

export function setMainFacadeVerticalRevealUniforms(revealY, feather, enabled) {
  // Apply to both reveal materials without allocating a per-frame array/closure.
  applyMainFacadeVerticalRevealUniformsTo(mainFacadeVerticalRevealLedMaterial, revealY, feather, enabled);
  applyMainFacadeVerticalRevealUniformsTo(mainBuildingEdgeVerticalRevealLedMaterial, revealY, feather, enabled);
}

function facadeAxisScale(edgeRole, face, sideWidthScale = getSideBuildingWidthScale(), sideDepthScale = getSideBuildingDepthScale(), mainWidthScale = getMainBuildingWidthScale(), mainDepthScale = getMainBuildingDepthScale()) {
  const isMain = edgeRole === 'main-building';
  if (face === 'x') return Math.max(0.001, isMain ? mainWidthScale : sideWidthScale);
  return Math.max(0.001, isMain ? mainDepthScale : sideDepthScale);
}

function facadeLedWorldNormalOffset(edgeRole) {
  if (edgeRole === 'main-building') return mainBuildingFacadeLedNormal;
  if (edgeRole === 'side-building') return buildingFacadeLedNormal;
  return 0;
}

function facadeLedLocalOutset(edgeRole, face, sideWidthScale = getSideBuildingWidthScale(), sideDepthScale = getSideBuildingDepthScale(), mainWidthScale = getMainBuildingWidthScale(), mainDepthScale = getMainBuildingDepthScale()) {
  return (FACADE_LED_WORLD_OUTSET + facadeLedWorldNormalOffset(edgeRole)) / facadeAxisScale(edgeRole, face, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale);
}

function facadeLedWorldAxisOffset(edgeRole, face, sign) {
  if (edgeRole === 'side-building') {
    if (face === 'x') {
      return { x: buildingFacadeLedX * sign, y: buildingFacadeLedY, z: buildingFacadeLedZ };
    }
    if (face === 'z') {
      return { x: buildingFacadeLedX, y: buildingFacadeLedY, z: buildingFacadeLedZ * sign };
    }
    return { x: buildingFacadeLedX, y: buildingFacadeLedY, z: buildingFacadeLedZ };
  }
  if (edgeRole === 'main-building') {
    return { x: mainBuildingFacadeLedX, y: mainBuildingFacadeLedY, z: mainBuildingFacadeLedZ };
  }
  return { x: 0, y: 0, z: 0 };
}

function facadeStripWorldPosition(basePosition, w, d, face, sign, depth, edgeRole, sideWidthScale = getSideBuildingWidthScale(), sideDepthScale = getSideBuildingDepthScale(), mainWidthScale = getMainBuildingWidthScale(), mainDepthScale = getMainBuildingDepthScale(), segmentNormalOffset = 0) {
  const position = basePosition.clone();
  const axisScale = facadeAxisScale(edgeRole, face, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale);
  const localOutset = facadeLedLocalOutset(edgeRole, face, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale) + segmentNormalOffset / axisScale;
  if (face === 'x') {
    position.x = sign * (w / 2 + localOutset + depth * 0.5 + FACADE_LED_SURFACE_EPS);
  } else {
    position.z = sign * (d / 2 + localOutset + depth * 0.5 + FACADE_LED_SURFACE_EPS);
  }
  const offset = facadeLedWorldAxisOffset(edgeRole, face, sign);
  position.x += offset.x;
  position.y += offset.y;
  position.z += offset.z;
  return position;
}

function positionFacadeStripMesh(mesh, basePosition, w, d, face, sign, depth, edgeRole, sideWidthScale = getSideBuildingWidthScale(), sideDepthScale = getSideBuildingDepthScale(), mainWidthScale = getMainBuildingWidthScale(), mainDepthScale = getMainBuildingDepthScale()) {
  mesh.position.copy(facadeStripWorldPosition(basePosition, w, d, face, sign, depth, edgeRole, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale));
}

function setFacadeStripInstanceTransform(spec, sideWidthScale = getSideBuildingWidthScale(), sideDepthScale = getSideBuildingDepthScale(), mainWidthScale = getMainBuildingWidthScale(), mainDepthScale = getMainBuildingDepthScale()) {
  if (!spec.batchMesh || spec.instanceId < 0) return false;
  const transform = facadeStripDynamicTransform(spec);
  const position = facadeStripWorldPosition(transform.basePosition, spec.w, spec.d, spec.face, spec.sign, transform.depth, spec.edgeRole, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale, facadeSegmentNormalOffset(spec));
  facadeStripMatrix.compose(position, transform.quaternion, transform.scale);
  spec.batchMesh.setMatrixAt(spec.instanceId, facadeStripMatrix);
  spec.lastPosition.copy(position);
  return true;
}

export function updateFacadeStripOutsets(sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale) {
  const changedBatches = new Set();
  for (const spec of facadeStripPositionSpecs) {
    if (spec.batchMesh) {
      if (setFacadeStripInstanceTransform(spec, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale)) changedBatches.add(spec.batchMesh);
    } else if (spec.mesh) {
      positionFacadeStripMesh(spec.mesh, spec.basePosition, spec.w, spec.d, spec.face, spec.sign, spec.depth, spec.edgeRole, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale);
    }
  }
  for (const mesh of changedBatches) {
    mesh.instanceMatrix.needsUpdate = true;
    refreshCullingBounds(mesh);
  }
}

const facadeStripMatrix = new THREE.Matrix4();

function facadeBatchState(parent) {
  if (!parent.userData.facadeStripBatch) {
    parent.userData.facadeStripBatch = { housing: [], led: [] };
    facadeStripBatchParents.add(parent);
  }
  return parent.userData.facadeStripBatch;
}

function facadeSegmentOffset(spec) {
  if (spec.edgeRole === 'main-building') {
    const index = spec.mainFacadeSegmentIndex;
    if (index < 0 || index >= mainBuildingFacadeLedSegmentOffsets.length) return null;
    return mainBuildingFacadeLedSegmentOffsets[index];
  }
  if (spec.edgeRole === 'side-building') {
    const index = spec.sideFacadeSegmentIndex;
    if (index < 0 || index >= sideBuildingFacadeLedSegmentOffsets.length) return null;
    return sideBuildingFacadeLedSegmentOffsets[index];
  }
  return null;
}

function facadeSegmentNormalOffset(spec) {
  return facadeSegmentOffset(spec)?.normal || 0;
}

function facadeStripLocalTransform(face, p1, p2, stripWidth, depth) {
  const du = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const length = Math.max(0.001, Math.hypot(du, dy));
  let scale;
  let basePosition;
  const quaternion = new THREE.Quaternion();
  if (face === 'x') {
    scale = new THREE.Vector3(depth, stripWidth, length);
    basePosition = new THREE.Vector3(0, (p1[1] + p2[1]) * 0.5, (p1[0] + p2[0]) * 0.5);
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, dy / length, du / length));
  } else {
    scale = new THREE.Vector3(length, stripWidth, depth);
    basePosition = new THREE.Vector3((p1[0] + p2[0]) * 0.5, (p1[1] + p2[1]) * 0.5, 0);
    quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(du / length, dy / length, 0));
  }
  return { basePosition, quaternion, scale, depth };
}

function facadeStripDynamicTransform(spec) {
  const segmentOffset = facadeSegmentOffset(spec);
  const usesMainFacadeScale = spec.edgeRole === 'main-building' && spec.mainFacadeUsesGlobalControls;
  if (!segmentOffset && !usesMainFacadeScale) return spec;
  const p1 = [...spec.baseP1];
  const p2 = [...spec.baseP2];
  if (segmentOffset) {
    p1[0] += segmentOffset.u;
    p2[0] += segmentOffset.u;
    p1[1] += segmentOffset.y;
    p2[1] += segmentOffset.y;
  }
  const widthScale = usesMainFacadeScale || (segmentOffset && spec.edgeRole === 'main-building') ? Math.max(0.2, mainBuildingFacadeLedThickness) : 1;
  return facadeStripLocalTransform(spec.face, p1, p2, spec.baseStripWidth * widthScale, spec.baseDepth);
}

function addFacadeStrip(parent, w, d, face, sign, p1, p2, stripWidth, depth, material, edgeRole = 'side-building', batchKind = 'housing', options = {}) {
  const transform = facadeStripLocalTransform(face, p1, p2, stripWidth, depth);
  const spec = {
    mesh: null,
    batchMesh: null,
    instanceId: -1,
    material,
    batchKind,
    parent,
    basePosition: transform.basePosition,
    lastPosition: facadeStripWorldPosition(transform.basePosition, w, d, face, sign, depth, edgeRole),
    quaternion: transform.quaternion,
    scale: transform.scale,
    baseP1: [...p1],
    baseP2: [...p2],
    baseStripWidth: stripWidth,
    baseDepth: depth,
    mainFacadeSegmentIndex: Number.isInteger(options.mainFacadeSegmentIndex) ? options.mainFacadeSegmentIndex : -1,
    sideFacadeSegmentIndex: Number.isInteger(options.sideFacadeSegmentIndex) ? options.sideFacadeSegmentIndex : -1,
    mainFacadeUsesGlobalControls: options.mainFacadeUsesGlobalControls === true,
    mainFacadeVerticalReveal: options.mainFacadeVerticalReveal === true,
    w,
    d,
    face,
    sign,
    depth,
    edgeRole,
  };
  facadeStripPositionSpecs.push(spec);
  if (batchKind === 'led' && spec.mainFacadeVerticalReveal) mainFacadeVerticalRevealLedSpecs.push(spec);
  facadeBatchState(parent)[batchKind].push(spec);
  if (batchKind === 'led') facadeLedSourceSegmentCount++;
  else facadeHousingSourceSegmentCount++;
  return new THREE.Object3D();
}

function buildFacadeStripBatch(parent, kind, specs, material, renderOrder) {
  if (!specs.length) return null;
  const edgeRole = specs[0]?.edgeRole || 'side-building';
  const mesh = new THREE.InstancedMesh(facadeStripUnitGeometry, material, specs.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = true;
  mesh.renderOrder = renderOrder;
  mesh.count = specs.length;
  parent.add(mesh);
  specs.forEach((spec, index) => {
    spec.batchMesh = mesh;
    spec.instanceId = index;
    setFacadeStripInstanceTransform(spec);
  });
  mesh.instanceMatrix.needsUpdate = true;
  refreshCullingBounds(mesh);
  if (kind === 'led') {
    const mainFacadeVerticalReveal = specs.some((spec) => spec.mainFacadeVerticalReveal);
    if (mainFacadeVerticalReveal) registerMainBuildingVerticalRevealOverlayObject(mesh);
    facadeLedSpecs.push({
      mesh,
      material,
      edgeRole,
      batch: true,
      segmentCount: specs.length,
      mainFacadeVerticalReveal,
      baseColor: new THREE.Color(PAL.tealLight),
    });
  }
  return mesh;
}

export function buildStaticFacadeStripBatches() {
  for (const parent of facadeStripBatchParents) {
    const batch = parent.userData.facadeStripBatch;
    if (!batch || batch.built) continue;
    buildFacadeStripBatch(parent, 'housing', batch.housing, getSharedFacadeHousingMaterial(), 7);
    const revealLedSpecs = batch.led.filter((spec) => spec.mainFacadeVerticalReveal);
    const normalLedSpecs = batch.led.filter((spec) => !spec.mainFacadeVerticalReveal);
    buildFacadeStripBatch(parent, 'led', normalLedSpecs, getSharedFacadeLedMaterial(normalLedSpecs[0]?.edgeRole), 8);
    buildFacadeStripBatch(parent, 'led', revealLedSpecs, getMainFacadeVerticalRevealLedMaterial(), 8);
    batch.built = true;
  }
}

function addFacadeLedSegment(parent, w, d, face, sign, p1, p2, width, role, options = {}) {
  const housingWidth = width * 2.55;
  const stripOptions = {};
  if (options.mainFacadeUsesGlobalControls) stripOptions.mainFacadeUsesGlobalControls = true;
  if (options.mainFacadeVerticalReveal) stripOptions.mainFacadeVerticalReveal = true;
  if (Number.isInteger(options.sideFacadeSegmentIndex)) stripOptions.sideFacadeSegmentIndex = options.sideFacadeSegmentIndex;
  if (options.withHousing !== false) {
    const housing = addFacadeStrip(parent, w, d, face, sign, p1, p2, housingWidth, 0.16, getSharedFacadeHousingMaterial(), role, 'housing', stripOptions);
    housing.renderOrder = 7;
  }
  const light = addFacadeStrip(parent, w, d, face, sign, p1, p2, width, 0.28, getSharedFacadeLedMaterial(role), role, 'led', stripOptions);
  return light;
}

function trimmedFacadeSegment(points, index, width) {
  const a = points[index];
  const b = points[index + 1];
  const du = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.max(0.001, Math.hypot(du, dy));
  const ux = du / len;
  const uy = dy / len;
  const trim = Math.min(width * 0.55, len * 0.32);
  const startTrim = index > 0 ? trim : 0;
  const endTrim = index < points.length - 2 ? trim : 0;
  return [
    [a[0] + ux * startTrim, a[1] + uy * startTrim],
    [b[0] - ux * endTrim, b[1] - uy * endTrim],
  ];
}

function addFacadeLedPolyline(parent, w, d, face, sign, points, width, role, options = {}) {
  if (points.length < 2) return;
  const housingWidth = width * 2.55;
  const hasSegmentControls = Number.isInteger(options.segmentOffset);
  const withHousing = options.withHousing !== false;
  for (let i = 0; i < points.length - 1; i++) {
    const stripOptions = hasSegmentControls ? { mainFacadeSegmentIndex: options.segmentOffset + i } : {};
    if (options.mainFacadeVerticalReveal) stripOptions.mainFacadeVerticalReveal = true;
    const [housingP1, housingP2] = trimmedFacadeSegment(points, i, housingWidth);
    const [ledP1, ledP2] = trimmedFacadeSegment(points, i, width);
    if (withHousing) addFacadeStrip(parent, w, d, face, sign, housingP1, housingP2, housingWidth, 0.16, getSharedFacadeHousingMaterial(), role, 'housing', stripOptions);
    addFacadeStrip(parent, w, d, face, sign, ledP1, ledP2, width, 0.28, getSharedFacadeLedMaterial(role), role, 'led', stripOptions);
  }
}

function addFacadeSlotStack(parent, w, d, h, face, sign, u, yStart, count, role, width, options = {}) {
  const slotH = Math.max(0.72, h * 0.012);
  const slotW = Math.max(width * 2.4, Math.min(w, d) * 0.058);
  const gap = Math.max(slotH * 1.35, h * 0.022);
  const yOffset = options.yOffset || 0;
  for (let i = 0; i < count; i++) {
    const y = yStart + i * gap + yOffset;
    addFacadeLedSegment(parent, w, d, face, sign, [u - slotW * 0.5, y], [u + slotW * 0.5, y], Math.max(width * 0.72, 0.38), role, {
      withHousing: options.withHousing,
      mainFacadeUsesGlobalControls: options.mainFacadeUsesGlobalControls,
      mainFacadeVerticalReveal: options.mainFacadeVerticalReveal,
    });
  }
}

export function addTronFacadeTreatment(buildingMesh, w, h, d, options = {}) {
  const face = options.face || 'x';
  const sign = options.sign || 1;
  const role = options.edgeRole || 'side-building';
  const scale = Math.min(w, d);
  const ribbon = Math.max(0.72, scale * 0.018);
  const layoutH = role === 'side-building' ? SIDE_FACADE_LED_REFERENCE_HEIGHT : h;
  const low = layoutH * 0.12;
  const mid = layoutH * 0.48;
  const high = layoutH * 0.88;
  const uA = -scale * 0.30;
  const uB = scale * 0.02;
  const uC = scale * 0.28;

  // Broad inset energy paths: main-building uses clean polylines so corners do not overlap.
  if (role === 'main-building') {
    addFacadeLedPolyline(buildingMesh, w, d, face, sign, [
      [uB, low],
      [uA, low],
      [uA, high * 0.82],
      [uB, high],
      [uC, high],
    ], ribbon, role, { segmentOffset: 0, withHousing: false });
    addFacadeLedPolyline(buildingMesh, w, d, face, sign, [
      [uC, layoutH * 0.22],
      [uC, layoutH * 0.54],
      [uC - scale * 0.13, layoutH * 0.64],
    ], ribbon * 0.72, role, { segmentOffset: 4, withHousing: false });
  } else {
    addFacadeLedSegment(buildingMesh, w, d, face, sign, [uA, low], [uA, high * 0.82], ribbon, role, { sideFacadeSegmentIndex: 0, withHousing: false });
    addFacadeLedSegment(buildingMesh, w, d, face, sign, [uA, high * 0.82], [uB, high], ribbon, role, { sideFacadeSegmentIndex: 1, withHousing: false });
    addFacadeLedSegment(buildingMesh, w, d, face, sign, [uB, high], [uC, high], ribbon * 0.82, role, { sideFacadeSegmentIndex: 2, withHousing: false });
    addFacadeLedSegment(buildingMesh, w, d, face, sign, [uA, low], [uB, low], ribbon * 0.82, role, { sideFacadeSegmentIndex: 3, withHousing: false });

    addFacadeLedSegment(buildingMesh, w, d, face, sign, [uC, layoutH * 0.22], [uC, layoutH * 0.54], ribbon * 0.72, role, { sideFacadeSegmentIndex: 4, withHousing: false });
    addFacadeLedSegment(buildingMesh, w, d, face, sign, [uC, layoutH * 0.54], [uC - scale * 0.13, layoutH * 0.64], ribbon * 0.72, role, { sideFacadeSegmentIndex: 5, withHousing: false });
  }

  addFacadeSlotStack(buildingMesh, w, d, layoutH, face, sign, scale * 0.16, mid, role === 'main-building' ? 8 : 6, role, ribbon, role === 'main-building' ? {
    withHousing: false,
    yOffset: -GRID_BLOCK,
    mainFacadeUsesGlobalControls: true,
    mainFacadeVerticalReveal: true,
  } : { withHousing: false });
}


export function mainFacadeVerticalRevealLedBounds() {
  const specs = mainFacadeVerticalRevealLedSpecs.filter((spec) => spec.batchMesh && spec.edgeRole === 'main-building');
  if (!specs.length) return null;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const spec of specs) {
    const transform = facadeStripDynamicTransform(spec);
    const position = facadeStripWorldPosition(
      transform.basePosition,
      spec.w,
      spec.d,
      spec.face,
      spec.sign,
      transform.depth,
      spec.edgeRole,
      getSideBuildingWidthScale(),
      getSideBuildingDepthScale(),
      getMainBuildingWidthScale(),
      getMainBuildingDepthScale(),
      facadeSegmentNormalOffset(spec)
    );
    const halfY = Math.max(0.01, Math.abs(transform.scale.y) * 0.5);
    spec.parent.updateWorldMatrix(true, false);
    facadeRevealWorldPoint.set(position.x, position.y - halfY, position.z).applyMatrix4(spec.parent.matrixWorld);
    minY = Math.min(minY, facadeRevealWorldPoint.y);
    maxY = Math.max(maxY, facadeRevealWorldPoint.y);
    facadeRevealWorldPoint.set(position.x, position.y + halfY, position.z).applyMatrix4(spec.parent.matrixWorld);
    minY = Math.min(minY, facadeRevealWorldPoint.y);
    maxY = Math.max(maxY, facadeRevealWorldPoint.y);
  }
  if (!Number.isFinite(minY) || !Number.isFinite(maxY) || maxY <= minY) return null;
  return { minY, maxY, count: specs.length };
}


export function updateFacadeLedRibbons(brightness, hueDeg, mainBrightness, mainHueDeg) {
  const sideColor = tunedColor(new THREE.Color(PAL.tealLight), hueDeg, 1, Math.max(0, brightness));
  const mainFacadeAmount = Math.max(0, mainBuildingFacadeLedBrightness);
  const mainColor = tunedColor(new THREE.Color(PAL.tealLight), mainHueDeg, 1, mainFacadeAmount);
  for (const spec of facadeLedSpecs) {
    const isMain = spec.edgeRole === 'main-building';
    const amount = isMain ? mainFacadeAmount : brightness;
    spec.material.color.copy(isMain ? mainColor : sideColor);
    spec.mesh.visible = amount > 0.001 && fxEnabled('facadeLeds');
  }
}

