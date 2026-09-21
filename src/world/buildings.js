import * as THREE from 'three';
import {
  MAIN_BUILDING_BASE,
  MAIN_BUILDING_Z,
  SIDE_BUILDING_BASE,
  SIDE_BUILDING_SPACING,
  SIDE_BUILDING_X,
  laneZ,
} from './boulevard-constants.js';

export const buildingColliders = [];
export const sideBuildingMeshes = [];
export const mainBuildingMeshes = [];
export const sideBuildingRecords = [];
export const mainBuildingRecords = [];
export const sideBuildingColliders = [];
export const mainBuildingColliders = [];
export const sideBuildingMaterials = [];
export const mainBuildingMaterials = [];
export const bridgeMaterials = [];
export const sideBuildingBasePadRecords = [];
export const mainBuildingBasePadRecords = [];

const buildingRuntime = {
  asphalt: null,
  reflectionEnvMap: null,
  defaultBuildingColor: 0xffffff,
  tunedColor: null,
  getRoadHalf: () => 0,
  // Firma della funzione vera, altrimenti la chiamata a 12 argomenti e' un TS2554 (2026-09-20).
  updateBuildingBasePad: /** @type {typeof import('./base-pads.js').updateBuildingBasePad} */ (() => {}),
  updateSideBuildingDoorTransforms: () => {},
  getCityRoleBoards: () => [],
  syncCityRoleBoardDoorPose: /** @type {typeof import('./city-role-boards.js').syncCityRoleBoardDoorPose} */ (() => {}),
};

export function initBuildings({
  asphalt,
  reflectionEnvMap,
  defaultBuildingColor,
  tunedColor,
  getRoadHalf,
  updateBuildingBasePad,
  updateSideBuildingDoorTransforms,
  getCityRoleBoards,
  syncCityRoleBoardDoorPose,
}) {
  buildingRuntime.asphalt = asphalt;
  buildingRuntime.reflectionEnvMap = reflectionEnvMap;
  buildingRuntime.defaultBuildingColor = defaultBuildingColor;
  buildingRuntime.tunedColor = tunedColor;
  buildingRuntime.getRoadHalf = getRoadHalf;
  buildingRuntime.updateBuildingBasePad = updateBuildingBasePad;
  buildingRuntime.updateSideBuildingDoorTransforms = updateSideBuildingDoorTransforms;
  buildingRuntime.getCityRoleBoards = getCityRoleBoards;
  buildingRuntime.syncCityRoleBoardDoorPose = syncCityRoleBoardDoorPose;
}

export function addBuildingCollider(x, z, w, d, h = Infinity, y = 0, role = 'side-building', chamfer = 0) {
  const collider = { x, y, z, hw: w / 2, hd: d / 2, baseH: h, h, role, baseChamfer: chamfer, chamfer };
  buildingColliders.push(collider);
  return collider;
}

// Identical (w,h,d,chamfer) boxes share one geometry (building pairs, repeated
// bridge frames). Callers must not mutate or dispose the returned instance.
const chamferedBoxGeometryCache = new Map();

export function makeChamferedBox(w, h, d, chamfer = 1.5) {
  const cacheKey = `${w}|${h}|${d}|${chamfer}`;
  const cached = chamferedBoxGeometryCache.get(cacheKey);
  if (cached) return cached;
  const c = Math.min(chamfer, w * 0.4, d * 0.4);
  const hw = w / 2, hd = d / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + c, -hd);
  shape.lineTo( hw - c, -hd);
  shape.quadraticCurveTo( hw, -hd,  hw, -hd + c);
  shape.lineTo( hw,  hd - c);
  shape.quadraticCurveTo( hw,  hd,  hw - c,  hd);
  shape.lineTo(-hw + c,  hd);
  shape.quadraticCurveTo(-hw,  hd, -hw,  hd - c);
  shape.lineTo(-hw, -hd + c);
  shape.quadraticCurveTo(-hw, -hd, -hw + c, -hd);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    curveSegments: 18,
    bevelEnabled: true,
    bevelThickness: c * 0.6,
    bevelSize: c * 0.6,
    bevelSegments: 5,
    steps: 1,
  });
  geo.rotateX(-Math.PI / 2);
  chamferedBoxGeometryCache.set(cacheKey, geo);
  return geo;
}

export function createWetAsphaltFacadeMaterial(color = buildingRuntime.defaultBuildingColor, envMapIntensity = 1.3) {
  return new THREE.MeshStandardMaterial({
    map: buildingRuntime.asphalt,
    color,
    metalness: 0.94,
    roughness: 0.10,
    envMap: buildingRuntime.reflectionEnvMap,
    envMapIntensity,
    emissive: 0x000202,
    emissiveIntensity: 0.035,
  });
}

export function buildBuildingShells({
  overlayGroup,
  PAL,
  addTronFacadeTreatment,
  createBuildingBasePad,
  buildSideBuildingDoor,
  buildSideBuildingCivicNumber,
  buildSideBuildingDoorBatches,
  updateSideBuildingDoorTransforms,
  sideBuildingCivicNumberForBuildIndex,
  addBuildingEdges,
  buildSideBuildingEdgeBatch,
  buildSideHorizontalLedRingBatches,
  buildStaticFacadeStripBatches,
  invalidateTronRunnerCrowdColliderRecords,
}) {
  const SIDE_X = SIDE_BUILDING_X;
  const SIDE_BASE = SIDE_BUILDING_BASE;
  const sideHeights = [220, 190, 172, 158, 145, 132];
  // All side shells are tuned in lockstep (updateBuildingMaterials writes the
  // same values to every entry), so one material instance serves all twelve.
  const sideFacadeMaterial = createWetAsphaltFacadeMaterial(PAL.buildingSkin, 1.3);

  function buildSideBuilding(x, z, h) {
    const chamfer = 11.5;
    const geo = makeChamferedBox(SIDE_BASE, h, SIDE_BASE, chamfer);
    const mat = sideFacadeMaterial;
    const m = new THREE.Mesh(geo, mat);
    addTronFacadeTreatment(m, SIDE_BASE, h, SIDE_BASE, {
      face: 'x',
      sign: x < 0 ? 1 : -1,
      edgeRole: 'side-building',
    });
    m.position.set(x, 0, z);
    overlayGroup.add(m);
    sideBuildingMeshes.push(m);
    sideBuildingMaterials.push(mat);
    const collider = addBuildingCollider(x, z, SIDE_BASE, SIDE_BASE, h, 0, 'side-building', chamfer);
    sideBuildingColliders.push(collider);
    const basePad = createBuildingBasePad(overlayGroup, x, z);
    const record = {
      mesh: m,
      collider,
      basePad,
      civicNumberValue: sideBuildingCivicNumberForBuildIndex(sideBuildingRecords.length),
      sign: x < 0 ? -1 : 1,
      zFactor: z / SIDE_BUILDING_SPACING,
      baseW: SIDE_BASE,
      baseD: SIDE_BASE,
      footprintChamfer: chamfer,
    };
    sideBuildingRecords.push(record);
    invalidateTronRunnerCrowdColliderRecords();
    sideBuildingBasePadRecords.push(basePad);
    buildSideBuildingDoor(record);
    buildSideBuildingCivicNumber(record);
    addBuildingEdges(overlayGroup, SIDE_BASE, h, SIDE_BASE, x, 0, z, PAL.tealLight, chamfer * 0.82, 'side-building', { footprintChamfer: chamfer });
  }

  laneZ.forEach((z, idx) => {
    const h = sideHeights[idx];
    buildSideBuilding(-SIDE_X, z, h);
    buildSideBuilding( SIDE_X, z, h);
  });
  buildSideBuildingDoorBatches();
  updateSideBuildingDoorTransforms();
  buildSideBuildingEdgeBatch(overlayGroup);
  buildSideHorizontalLedRingBatches(overlayGroup);

  {
    const w = MAIN_BUILDING_BASE, d = MAIN_BUILDING_BASE, h = 230;
    const chamfer = 16.0;
    const geo = makeChamferedBox(w, h, d, chamfer);
    const mat = createWetAsphaltFacadeMaterial(PAL.mainSkin, 1.36);
    const m = new THREE.Mesh(geo, mat);
    addTronFacadeTreatment(m, w, h, d, {
      face: 'z',
      sign: 1,
      edgeRole: 'main-building',
    });
    m.position.set(0, 0, MAIN_BUILDING_Z);
    overlayGroup.add(m);
    mainBuildingMeshes.push(m);
    mainBuildingMaterials.push(mat);
    const collider = addBuildingCollider(0, MAIN_BUILDING_Z, w, d, h, 0, 'main-building', chamfer);
    mainBuildingColliders.push(collider);
    const basePad = createBuildingBasePad(overlayGroup, 0, MAIN_BUILDING_Z);
    mainBuildingRecords.push({ mesh: m, collider, basePad, baseW: w, baseD: d, footprintChamfer: chamfer });
    invalidateTronRunnerCrowdColliderRecords();
    mainBuildingBasePadRecords.push(basePad);
    addBuildingEdges(overlayGroup, w, h, d, 0, 0, MAIN_BUILDING_Z, PAL.tealLight, chamfer * 0.82, 'main-building', { footprintChamfer: chamfer });
  }

  buildStaticFacadeStripBatches();
}

export function updateBuildingMaterials(materials, baseColor, brightness, hueDeg, metalness, roughness, reflect, emissive, lightResponse, saturation = 1.2) {
  const color = buildingRuntime.tunedColor(new THREE.Color(baseColor), hueDeg, saturation, brightness * lightResponse.surface);
  const glow = new THREE.Color(0x09363d).multiplyScalar(Math.max(0.5, brightness));
  for (const material of materials) {
    material.color.copy(color);
    material.envMap = buildingRuntime.reflectionEnvMap;
    material.metalness = metalness;
    material.roughness = roughness;
    material.envMapIntensity = reflect * lightResponse.reflection;
    material.emissive.copy(glow);
    material.emissiveIntensity = emissive * lightResponse.emissive + lightResponse.facadeFill;
  }
}

export function updateBuildingScale(meshes, colliders, scaleY) {
  for (const mesh of meshes) mesh.scale.y = scaleY;
  for (const collider of colliders) collider.h = collider.baseH * scaleY;
}

export function updateBuildingFootprints(nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale, nextSideSpacingScale, width, nextMainZ, nextMainY, basePadSettings) {
  const {
    sideBuildingBasePadScale,
    sideBuildingBasePadXScale,
    sideBuildingBasePadY,
    sideBuildingBasePadThickness,
    sideBuildingBasePadCut,
    sideBuildingBasePadRadius,
    mainBuildingBasePadScale,
    mainBuildingBasePadXScale,
    mainBuildingBasePadZScale,
    mainBuildingBasePadY,
    mainBuildingBasePadThickness,
    mainBuildingBasePadCut,
    mainBuildingBasePadRadius,
  } = basePadSettings;
  const sideWidth = SIDE_BUILDING_BASE * nextSideWidthScale;
  for (const record of sideBuildingRecords) {
    const x = record.sign * (buildingRuntime.getRoadHalf() + width + sideWidth / 2);
    const z = record.zFactor * SIDE_BUILDING_SPACING * nextSideSpacingScale;
    record.mesh.scale.x = nextSideWidthScale;
    record.mesh.scale.z = nextSideDepthScale;
    record.mesh.position.x = x;
    record.mesh.position.z = z;
    record.collider.x = x;
    record.collider.z = z;
    record.collider.hw = record.baseW * nextSideWidthScale / 2;
    record.collider.hd = record.baseD * nextSideDepthScale / 2;
    record.collider.chamfer = (record.footprintChamfer || record.collider.baseChamfer || 0) * Math.min(nextSideWidthScale, nextSideDepthScale);
    buildingRuntime.updateBuildingBasePad(record, x, z, nextSideWidthScale, nextSideDepthScale, sideBuildingBasePadScale, sideBuildingBasePadXScale, sideBuildingBasePadXScale, sideBuildingBasePadY, sideBuildingBasePadThickness, sideBuildingBasePadCut, sideBuildingBasePadRadius);
  }
  for (const record of mainBuildingRecords) {
    record.mesh.scale.x = nextMainWidthScale;
    record.mesh.scale.z = nextMainDepthScale;
    record.mesh.position.y = nextMainY;
    record.mesh.position.z = nextMainZ;
    record.collider.y = nextMainY;
    record.collider.z = nextMainZ;
    record.collider.hw = record.baseW * nextMainWidthScale / 2;
    record.collider.hd = record.baseD * nextMainDepthScale / 2;
    record.collider.chamfer = (record.footprintChamfer || record.collider.baseChamfer || 0) * Math.min(nextMainWidthScale, nextMainDepthScale);
    buildingRuntime.updateBuildingBasePad(record, 0, nextMainZ, nextMainWidthScale, nextMainDepthScale, mainBuildingBasePadScale, mainBuildingBasePadXScale, mainBuildingBasePadZScale, mainBuildingBasePadY, mainBuildingBasePadThickness, mainBuildingBasePadCut, mainBuildingBasePadRadius);
  }
  buildingRuntime.updateSideBuildingDoorTransforms();
  const roleBoards = buildingRuntime.getCityRoleBoards();
  if (roleBoards?.length) {
    for (const board of roleBoards) buildingRuntime.syncCityRoleBoardDoorPose(board);
  }
}
