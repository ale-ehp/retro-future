import * as THREE from 'three';
import { retroFutureSignScale } from '../sign-opacity.js';

let overlayGroup = null;
let renderer = null;
let reflectionEnvMap = null;
let PAL = null;
let sideBuildingRecords = [];
let laneZ = [];
let refreshCullingBounds = () => {};
let tunedColor = null;
let createWetAsphaltFacadeMaterial = null;

export const sideBuildingDoorGroups = [];
export const sideBuildingDoorLedMeshes = [];
export const sideBuildingCivicNumberGroups = [];
export const sideBuildingCivicNumberMaterials = [];
export const SIDE_BUILDING_CIVIC_NUMBER_DEPTH_TEST = false;
const sideBuildingCivicNumberTextureCache = new Map();
const sideBuildingCivicNumberPlaneGeometry = new THREE.PlaneGeometry(1, 1);
export const sideDoorCount = () => sideBuildingDoorGroups.length;
const sideDoorUnitBoxGeometry = new THREE.BoxGeometry(1, 1, 1);

export const SIDE_DOOR_FIXED = Object.freeze({
  enabled: true,
  scale: 0.666,
  width: 16,
  height: 26,
  depth: 7.66,
  y: -2.35,
  faceOffset: 12.7,
});

const SIDE_DOOR_BATCH_PARTS = Object.freeze([
  { key: 'housing', name: 'door-03-back-plate', geometry: 'box', material: 'housing', x: 0, y: 0.03, z: -0.02, w: 1.14, h: 0.94, d: 0.18, renderOrder: 10 },
  { key: 'panel', name: 'door-03-left-leaf', geometry: 'box', material: 'panel', x: -0.22, y: 0.17, z: 0.04, w: 0.32, h: 0.68, d: 0.12, renderOrder: 10 },
  { key: 'panel', name: 'door-03-right-leaf', geometry: 'box', material: 'panel', x: 0.22, y: 0.17, z: 0.04, w: 0.32, h: 0.68, d: 0.12, renderOrder: 10 },
  { key: 'glass', name: 'door-03-energy-seam', geometry: 'box', material: 'glass', x: 0, y: 0.14, z: 0.08, w: 0.035, h: 0.72, d: 0.16, renderOrder: 10 },
  { key: 'glass', name: 'door-03-energy-field', geometry: 'box', material: 'glass', x: 0, y: 0.20, z: 0.105, w: 0.48, h: 0.52, d: 0.08, renderOrder: 10 },
  { key: 'ledAtlas', name: 'door-03-led-atlas', geometry: 'led-plane', material: 'led', x: 0, y: 0.51, z: 0.24, w: 1, h: 1, d: 1, renderOrder: 13 },
]);

export const sideDoorBatchState = {
  records: [],
  batches: new Map(),
  built: false,
  instances: 0,
  visibleInstances: 0,
};

const sideDoorWorldMatrix = new THREE.Matrix4();
const sideDoorLocalPosition = new THREE.Vector3();
const sideDoorLocalQuaternion = new THREE.Quaternion();
const sideDoorLocalScale = new THREE.Vector3();

export const SIDE_BUILDING_CIVIC_NUMBER_FIXED = Object.freeze({
  singleWidth: retroFutureSignScale(59),
  doubleWidth: retroFutureSignScale(91),
  height: retroFutureSignScale(47),
  faceOffset: 2.1,
  verticalLift: 1.05,
  renderOrder: 18,
  depthLayers: [
    { x: 0, y: 0, z: -0.24, opacity: 0.34, color: 0x05283a },
    { x: 0, y: 0, z: -0.16, opacity: 0.42, color: 0x0a5267 },
    { x: 0, y: 0, z: -0.08, opacity: 0.52, color: 0x1393aa },
  ],
});

export let sideDoorEnabled = SIDE_DOOR_FIXED.enabled;
export let sideDoorScale = SIDE_DOOR_FIXED.scale;
export let sideDoorWidth = SIDE_DOOR_FIXED.width;
export let sideDoorHeight = SIDE_DOOR_FIXED.height;
export let sideDoorDepth = SIDE_DOOR_FIXED.depth;
export let sideDoorY = SIDE_DOOR_FIXED.y;
export let sideDoorFaceOffset = SIDE_DOOR_FIXED.faceOffset;

let sideDoorHousingMat = null;
let sideDoorPanelMat = null;
let sideDoorGlassMat = null;
let sideDoorLedMat = null;
let sideDoorLedTexture = null;
let sideDoorLedPlaneGeometry = null;

export function initBuildingDoors(deps) {
  overlayGroup = deps.overlayGroup;
  renderer = deps.renderer;
  reflectionEnvMap = deps.reflectionEnvMap;
  PAL = deps.PAL;
  sideBuildingRecords = deps.sideBuildingRecords;
  laneZ = deps.laneZ;
  refreshCullingBounds = deps.refreshCullingBounds;
  tunedColor = deps.tunedColor;
  createWetAsphaltFacadeMaterial = deps.createWetAsphaltFacadeMaterial;
}

export function getSideDoorEnabled() {
  return sideDoorEnabled;
}

function ensureSideDoorMaterials() {
  if (sideDoorHousingMat) return;
  sideDoorLedTexture = createSideDoorLedTexture();
  sideDoorLedPlaneGeometry = new THREE.PlaneGeometry(1.28, 1.02);
  sideDoorHousingMat = createWetAsphaltFacadeMaterial(0x020b0e, 1.24);
  sideDoorHousingMat.roughness = 0.16;
  sideDoorHousingMat.emissive.set(0x00191d);
  sideDoorHousingMat.emissiveIntensity = 0.11;
  sideDoorPanelMat = new THREE.MeshStandardMaterial({
    color: 0x000607,
    metalness: 0.82,
    roughness: 0.18,
    envMap: reflectionEnvMap,
    envMapIntensity: 1.45,
    emissive: 0x001014,
    emissiveIntensity: 0.16,
  });
  sideDoorGlassMat = new THREE.MeshBasicMaterial({
    color: 0x58ecff,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    toneMapped: false,
  });
  sideDoorLedMat = new THREE.MeshBasicMaterial({
    map: sideDoorLedTexture,
    color: PAL.tealLight,
    transparent: true,
    opacity: 1,
    alphaTest: 0.018,
    depthWrite: false,
    depthTest: SIDE_BUILDING_CIVIC_NUMBER_DEPTH_TEST,
    toneMapped: false,
  });
}

function createSideDoorLedTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 448;
  const ctx = canvas.getContext('2d');
  const sx = (x) => (x + 0.64) / 1.28 * canvas.width;
  const sy = (y) => canvas.height - y / 1.02 * canvas.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.98)';
  ctx.fillStyle = 'rgba(255,255,255,0.98)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(255,255,255,0.42)';
  ctx.shadowBlur = 10;

  function stroke(points, width) {
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(sx(points[0][0]), sy(points[0][1]));
    for (const point of points.slice(1)) ctx.lineTo(sx(point[0]), sy(point[1]));
    ctx.stroke();
  }

  const outer = [
    [-0.47, 0.07], [0.47, 0.07], [0.56, 0.18], [0.56, 0.82],
    [0.38, 0.96], [-0.38, 0.96], [-0.56, 0.82], [-0.56, 0.18], [-0.47, 0.07],
  ];
  const inner = [
    [-0.35, 0.16], [0.35, 0.16], [0.43, 0.25], [0.43, 0.73],
    [0.29, 0.84], [-0.29, 0.84], [-0.43, 0.73], [-0.43, 0.25], [-0.35, 0.16],
  ];
  stroke(outer, 16);
  stroke(inner, 8);
  stroke([[-0.31, 0.10], [0.31, 0.10]], 10);
  stroke([[-0.24, 0.90], [0.24, 0.90]], 10);

  for (const side of [-1, 1]) {
    stroke([[side * 0.12, 0.34], [side * 0.24, 0.43], [side * 0.24, 0.59], [side * 0.10, 0.67]], 8);
    stroke([[side * 0.60, 0.28], [side * 0.60, 0.76]], 10);
    for (let i = 0; i < 5; i++) {
      const x = sx(side * 0.62);
      const y = sy(0.32 + i * 0.075);
      ctx.fillRect(x - 7, y - 4, 14, 8);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.anisotropy = 1;
  if ('colorSpace' in texture) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSelectedSideBuildingDoorModel() {
  ensureSideDoorMaterials();
  const group = new THREE.Group();
  group.name = 'side-building-door-03';
  group.userData.sideDoorAnchor = true;
  return group;
}

function sideDoorBatchMaterial(part) {
  if (part.material === 'housing') return sideDoorHousingMat;
  if (part.material === 'panel') return sideDoorPanelMat;
  if (part.material === 'glass') return sideDoorGlassMat;
  if (part.material === 'led') return sideDoorLedMat;
  return sideDoorHousingMat;
}

function sideDoorBatchGeometry(part) {
  return part.geometry === 'led-plane' ? sideDoorLedPlaneGeometry : sideDoorUnitBoxGeometry;
}

function sideDoorPartLocalMatrix(part) {
  if (part.localMatrix) return part.localMatrix;
  const isBox = part.geometry === 'box';
  sideDoorLocalPosition.set(part.x, part.y + (isBox ? part.h * 0.5 : 0), part.z);
  sideDoorLocalScale.set(part.w, part.h, part.d);
  const matrix = new THREE.Matrix4();
  matrix.compose(sideDoorLocalPosition, sideDoorLocalQuaternion, sideDoorLocalScale);
  part.localMatrix = matrix;
  return matrix;
}

function ensureSideDoorBatchMeshes() {
  ensureSideDoorMaterials();
  const partGroups = new Map();
  for (const part of SIDE_DOOR_BATCH_PARTS) {
    if (!partGroups.has(part.key)) partGroups.set(part.key, []);
    partGroups.get(part.key).push(part);
  }
  for (const [key, parts] of partGroups.entries()) {
    const needed = Math.max(1, sideDoorBatchState.records.length * parts.length);
    const existing = sideDoorBatchState.batches.get(key);
    if (existing?.mesh && existing.capacity >= needed) continue;
    if (existing?.mesh) overlayGroup.remove(existing.mesh);
    const firstPart = parts[0];
    const mesh = new THREE.InstancedMesh(sideDoorBatchGeometry(firstPart), sideDoorBatchMaterial(firstPart), needed);
    mesh.name = `side-building-door-batch-${key}`;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = true;
    mesh.renderOrder = firstPart.renderOrder;
    mesh.count = 0;
    overlayGroup.add(mesh);
    sideDoorBatchState.batches.set(key, {
      key,
      mesh,
      parts,
      capacity: needed,
      count: 0,
    });
    if (key === 'ledAtlas' && !sideBuildingDoorLedMeshes.includes(mesh)) {
      sideBuildingDoorLedMeshes.push(mesh);
    }
  }
  sideDoorBatchState.built = true;
}

export function updateSideBuildingDoorBatchMeshes() {
  ensureSideDoorBatchMeshes();
  for (const batch of sideDoorBatchState.batches.values()) batch.count = 0;
  let visibleInstances = 0;
  for (const record of sideDoorBatchState.records) {
    const door = record.sideDoor;
    if (!door?.visible) continue;
    door.updateWorldMatrix(true, false);
    for (const part of SIDE_DOOR_BATCH_PARTS) {
      const batch = sideDoorBatchState.batches.get(part.key);
      if (!batch?.mesh) continue;
      sideDoorWorldMatrix.multiplyMatrices(door.matrixWorld, sideDoorPartLocalMatrix(part));
      batch.mesh.setMatrixAt(batch.count, sideDoorWorldMatrix);
      batch.count += 1;
      visibleInstances += 1;
    }
  }
  let totalInstances = 0;
  for (const batch of sideDoorBatchState.batches.values()) {
    batch.mesh.count = batch.count;
    batch.mesh.visible = batch.count > 0;
    batch.mesh.instanceMatrix.needsUpdate = true;
    refreshCullingBounds(batch.mesh);
    totalInstances += batch.count;
  }
  sideDoorBatchState.instances = totalInstances;
  sideDoorBatchState.visibleInstances = visibleInstances;
}

export function buildSideBuildingDoorBatches() {
  ensureSideDoorBatchMeshes();
  updateSideBuildingDoorBatchMeshes();
}

function createSideBuildingCivicNumberTexture(value) {
  const key = String(value);
  if (sideBuildingCivicNumberTextureCache.has(key)) return sideBuildingCivicNumberTextureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  const text = String(value);
  const fontSize = text.length > 1 ? 386 : 436;
  const x = canvas.width * 0.5 - 20;
  const y = canvas.height * 0.56;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${fontSize}px Impact, Haettenschweiler, "Arial Narrow", sans-serif`;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(5, 30, 43, 0.98)';
  ctx.lineWidth = 76;
  ctx.strokeText(text, x, y);
  ctx.strokeStyle = 'rgba(12, 89, 110, 0.94)';
  ctx.lineWidth = 58;
  ctx.strokeText(text, x, y);
  ctx.strokeStyle = 'rgba(28, 165, 184, 0.88)';
  ctx.lineWidth = 44;
  ctx.strokeText(text, x, y);
  ctx.shadowColor = 'rgba(98, 247, 255, 0.72)';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = 'rgba(143, 252, 255, 1)';
  ctx.lineWidth = 34;
  ctx.strokeText(text, x, y);
  ctx.shadowBlur = 8;
  ctx.strokeStyle = 'rgba(231, 253, 255, 0.94)';
  ctx.lineWidth = 12;
  ctx.strokeText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(143, 252, 255, 0.08)';
  ctx.fillText(text, x, y);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy?.() || 1);
  texture.needsUpdate = true;
  sideBuildingCivicNumberTextureCache.set(key, texture);
  return texture;
}

function createSideBuildingCivicNumberMaterial(record, color = 0xffffff, opacity = 1) {
  const material = new THREE.MeshBasicMaterial({
    map: createSideBuildingCivicNumberTexture(record.civicNumberValue),
    color,
    transparent: true,
    opacity,
    alphaTest: 0.018,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  sideBuildingCivicNumberMaterials.push(material);
  return material;
}

function addSideBuildingCivicNumberPlane(group, record, material, name, layer = null) {
  const mesh = new THREE.Mesh(sideBuildingCivicNumberPlaneGeometry, material);
  mesh.name = `side-building-civic-number-${name}-${record.civicNumberValue}`;
  mesh.renderOrder = SIDE_BUILDING_CIVIC_NUMBER_FIXED.renderOrder;
  if (layer) {
    mesh.position.set(layer.x, layer.y, layer.z);
    mesh.renderOrder -= 1;
  }
  mesh.frustumCulled = true;
  group.add(mesh);
  return mesh;
}

export function buildSideBuildingCivicNumber(record) {
  const group = new THREE.Group();
  group.name = `side-building-civic-number-${record.civicNumberValue}`;
  group.userData.civicNumberValue = record.civicNumberValue;
  for (const layer of SIDE_BUILDING_CIVIC_NUMBER_FIXED.depthLayers) {
    addSideBuildingCivicNumberPlane(
      group,
      record,
      createSideBuildingCivicNumberMaterial(record, layer.color, layer.opacity),
      'depth',
      layer
    );
  }
  addSideBuildingCivicNumberPlane(
    group,
    record,
    createSideBuildingCivicNumberMaterial(record),
    'front'
  );
  record.civicNumberGroup = group;
  sideBuildingCivicNumberGroups.push(group);
  overlayGroup.add(group);
  return group;
}

export function buildSideBuildingDoor(record) {
  const group = createSelectedSideBuildingDoorModel();
  record.sideDoor = group;
  sideDoorBatchState.records.push(record);
  sideBuildingDoorGroups.push(group);
  overlayGroup.add(group);
  return group;
}

function updateSideBuildingCivicNumberTransform(record, faceSign) {
  const group = record.civicNumberGroup;
  if (!group) return;
  const text = String(record.civicNumberValue);
  const doorScaleRatio = Math.max(0.35, sideDoorScale / SIDE_DOOR_FIXED.scale);
  const numberWidth = (text.length > 1
    ? SIDE_BUILDING_CIVIC_NUMBER_FIXED.doubleWidth
    : SIDE_BUILDING_CIVIC_NUMBER_FIXED.singleWidth) * doorScaleRatio;
  const numberHeight = SIDE_BUILDING_CIVIC_NUMBER_FIXED.height * doorScaleRatio;
  const doorTopY = sideDoorY + sideDoorHeight * sideDoorScale;
  group.visible = record.mesh.visible;
  group.position.set(
    record.mesh.position.x + faceSign * (record.collider.hw + sideDoorFaceOffset + SIDE_BUILDING_CIVIC_NUMBER_FIXED.faceOffset),
    doorTopY + numberHeight * SIDE_BUILDING_CIVIC_NUMBER_FIXED.verticalLift,
    record.mesh.position.z
  );
  group.rotation.set(0, faceSign > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
  group.scale.set(Math.max(0.01, numberWidth), Math.max(0.01, numberHeight), 1);
}

export function updateSideBuildingDoorTransforms() {
  for (const record of sideBuildingRecords) {
    const faceSign = record.sign < 0 ? 1 : -1;
    if (record.sideDoor) {
      record.sideDoor.visible = sideDoorEnabled && record.mesh.visible;
      record.sideDoor.position.set(
        record.mesh.position.x + faceSign * (record.collider.hw + sideDoorFaceOffset),
        sideDoorY,
        record.mesh.position.z
      );
      record.sideDoor.rotation.set(0, faceSign > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      record.sideDoor.scale.set(
        Math.max(0.01, sideDoorWidth * sideDoorScale),
        Math.max(0.01, sideDoorHeight * sideDoorScale),
        Math.max(0.01, sideDoorDepth * sideDoorScale)
      );
    }
    updateSideBuildingCivicNumberTransform(record, faceSign);
  }
  updateSideBuildingDoorBatchMeshes();
}

export function updateSideBuildingDoorMaterials(brightness, hueDeg) {
  ensureSideDoorMaterials();
  const ledColor = tunedColor(new THREE.Color(PAL.tealLight), hueDeg, 1, Math.max(0, brightness));
  sideDoorLedMat.color.copy(ledColor);
  sideDoorLedMat.needsUpdate = true;
  sideDoorGlassMat.color.copy(ledColor);
  sideDoorGlassMat.opacity = THREE.MathUtils.clamp(0.10 + brightness * 0.10, 0.05, 0.34);
  for (const material of [sideDoorHousingMat, sideDoorPanelMat]) {
    material.envMap = reflectionEnvMap;
    material.envMapIntensity = material === sideDoorPanelMat ? 1.45 : 1.24;
  }
}

export function sideBuildingCivicNumberForBuildIndex(buildIndex) {
  const laneIndex = Math.floor(buildIndex / 2);
  const sideIndex = buildIndex % 2;
  return (laneZ.length - 1 - laneIndex) * 2 + sideIndex + 1;
}

export function inspectSideBuildingCivicNumberCulling() {
  let totalPlanes = 0;
  let visiblePlanes = 0;
  let frustumCulledPlanes = 0;
  const groups = sideBuildingCivicNumberGroups.map((group) => {
    let groupPlanes = 0;
    let groupVisiblePlanes = 0;
    let groupFrustumCulledPlanes = 0;
    for (const child of group.children) {
      if (!child.isMesh) continue;
      groupPlanes++;
      if (child.visible) groupVisiblePlanes++;
      if (child.frustumCulled) groupFrustumCulledPlanes++;
    }
    totalPlanes += groupPlanes;
    visiblePlanes += groupVisiblePlanes;
    frustumCulledPlanes += groupFrustumCulledPlanes;
    return {
      value: group.userData.civicNumberValue,
      planes: groupPlanes,
      visiblePlanes: groupVisiblePlanes,
      frustumCulledPlanes: groupFrustumCulledPlanes,
      cullDisabledPlanes: groupPlanes - groupFrustumCulledPlanes,
      visible: Boolean(group.visible),
    };
  });
  return {
    groups: groups.length,
    totalPlanes,
    visiblePlanes,
    frustumCulledPlanes,
    cullDisabledPlanes: totalPlanes - frustumCulledPlanes,
    groupsDetail: groups,
  };
}

export function inspectSideBuildingDoorBatching() {
  const batches = [...sideDoorBatchState.batches.values()].map((batch) => ({
    key: batch.key,
    count: batch.mesh?.count ?? 0,
    capacity: batch.capacity,
    visible: Boolean(batch.mesh?.visible),
    frustumCulled: Boolean(batch.mesh?.frustumCulled),
    renderOrder: batch.mesh?.renderOrder ?? null,
    parts: batch.parts.map((part) => part.name),
  }));
  const drawObjects = batches.filter((batch) => batch.capacity > 0).length;
  const previousDrawObjects = sideDoorBatchState.records.length * SIDE_DOOR_BATCH_PARTS.length;
  const instances = batches.reduce((sum, batch) => sum + batch.count, 0);
  const frustumCulledCount = batches.filter((batch) => batch.frustumCulled).length;
  return {
    batched: sideDoorBatchState.built,
    doors: sideBuildingDoorGroups.length,
    anchors: sideDoorBatchState.records.length,
    drawObjects,
    previousDrawObjects,
    savedDrawObjects: Math.max(0, previousDrawObjects - drawObjects),
    instances,
    visibleInstances: sideDoorBatchState.visibleInstances,
    frustumCulledCount,
    cullDisabledBatches: drawObjects - frustumCulledCount,
    batches,
  };
}
