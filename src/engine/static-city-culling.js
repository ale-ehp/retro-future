import * as THREE from 'three';
import { fxEnabled } from './fx-debug-toggles.js';

const STATIC_CITY_CULLING_ENABLED = true;
const staticCityCullMatrix = new THREE.Matrix4();
const staticCityCullFrustum = new THREE.Frustum();
const staticCityCullSphere = new THREE.Sphere();

export const staticCityCullStats = {
  enabled: STATIC_CITY_CULLING_ENABLED,
  total: 0,
  visible: 0,
  hidden: 0,
  buildingsTotal: 0,
  buildingsVisible: 0,
  bridgesTotal: 0,
  bridgesVisible: 0,
  boardsTotal: 0,
  boardsVisible: 0,
  ledInstancesTotal: 0,
  ledInstancesVisible: 0,
  ledInstancesHidden: 0,
  doorInstancesVisible: 0,
};

let staticCityDoorCullDirty = false;
let deps = null;
let cullMargin = 0;
let boardCullMargin = 0;

export function initStaticCityCulling(d) {
  deps = d;
  cullMargin = d.gridBlock * 6;
  boardCullMargin = d.gridBlock * 3;
}

function setStaticCityObjectVisible(object, visible) {
  if (!object) return;
  object.visible = Boolean(visible);
}

function setStaticCityEdgeSpecVisible(spec, visible) {
  if (spec?.mesh) setStaticCityObjectVisible(spec.mesh, visible);
  if (spec?.segmentGroup) setStaticCityObjectVisible(spec.segmentGroup, visible);
  if (spec?.segmentMesh) setStaticCityObjectVisible(spec.segmentMesh, visible);
  // Batched bridge strips have no mesh of their own: cull via their instance.
  if (spec && !spec.mesh && spec.edgeRole === 'bridge' && deps.setBridgeEdgeSpecCullVisible) {
    deps.setBridgeEdgeSpecCullVisible(spec, visible);
  }
}

function staticCityRecordSphere(record, target = staticCityCullSphere) {
  const collider = record?.collider;
  const mesh = record?.mesh;
  const hw = Math.abs(Number.isFinite(collider?.hw) ? collider.hw : (record?.baseW || deps.gridBlock) * 0.5);
  const hd = Math.abs(Number.isFinite(collider?.hd) ? collider.hd : (record?.baseD || deps.gridBlock) * 0.5);
  const height = Math.abs(Number.isFinite(collider?.h) ? collider.h : deps.gridBlock * 10);
  const x = Number.isFinite(collider?.x) ? collider.x : (mesh?.position.x || 0);
  const y = (Number.isFinite(collider?.y) ? collider.y : (mesh?.position.y || 0)) + height * 0.5;
  const z = Number.isFinite(collider?.z) ? collider.z : (mesh?.position.z || 0);
  target.center.set(x, y, z);
  target.radius = Math.hypot(hw, hd, height * 0.5) + cullMargin;
  return target;
}

function staticCityBridgeSphere(record, target = staticCityCullSphere) {
  const mesh = record?.mesh;
  const width = Math.abs((record?.baseWidth || deps.gridBlock) * (mesh?.scale.x || 1));
  const height = Math.abs((record?.baseHeight || deps.gridBlock) * (mesh?.scale.y || 1));
  const depth = Math.abs((record?.baseDepth || deps.gridBlock) * (mesh?.scale.z || 1));
  target.center.set(mesh?.position.x || 0, (mesh?.position.y || 0) + height * 0.5, mesh?.position.z || 0);
  target.radius = Math.hypot(width * 0.5, depth * 0.5, height * 0.5) + cullMargin;
  return target;
}

function staticCityBoardSphere(board, target = staticCityCullSphere) {
  const width = Math.abs(board?.boardWidth || deps.gridBlock * 8);
  const height = Math.abs(board?.boardHeight || deps.gridBlock * 5);
  if (board?.group) target.center.copy(board.group.position);
  else target.center.set(0, 0, 0);
  target.radius = Math.hypot(width * 0.5, height * 0.5) + boardCullMargin;
  return target;
}

function setStaticCityBasePadVisible(basePad, visible) {
  if (!basePad) return;
  const hasInnerPad = Boolean(deps.getBasePadCurbEnabled() && basePad.innerHitPolygon?.length);
  setStaticCityObjectVisible(basePad.mesh, visible);
  setStaticCityObjectVisible(basePad.border, visible);
  setStaticCityObjectVisible(basePad.curbRamp, visible && hasInnerPad);
  setStaticCityObjectVisible(basePad.innerMesh, visible && hasInnerPad);
  setStaticCityObjectVisible(basePad.innerBorder, visible && hasInnerPad);
}

function setStaticCityBuildingClusterVisible(record, visible) {
  setStaticCityObjectVisible(record.mesh, visible && fxEnabled('buildingShells'));
  setStaticCityBasePadVisible(record.basePad, visible && fxEnabled('basePad'));
  setStaticCityObjectVisible(record.civicNumberGroup, visible && fxEnabled('civicNumbers'));
  if (record.sideDoor) {
    const nextDoorVisible = Boolean(visible && deps.getSideDoorEnabled() && fxEnabled('doors'));
    if (record.sideDoor.visible !== nextDoorVisible) staticCityDoorCullDirty = true;
    setStaticCityObjectVisible(record.sideDoor, nextDoorVisible);
  }
  if (record.basePadLedBatch?.mesh) {
    setStaticCityObjectVisible(
      record.basePadLedBatch.mesh,
      visible && deps.basePadLedBatch.sceneVisible && record.basePadLedBatch.count > 0
    );
  }
}

function setStaticCityMainLedClusterVisible(visible) {
  for (const spec of deps.edgeStripSpecs) {
    if (spec.edgeRole === 'main-building') setStaticCityEdgeSpecVisible(spec, visible);
  }
  for (const spec of deps.horizontalBuildingLedRings) {
    if (spec.edgeRole === 'main-building') setStaticCityEdgeSpecVisible(spec, visible && fxEnabled('ledRings'));
  }
}

function setStaticCityBridgeClusterVisible(record, visible) {
  const effectiveVisible = Boolean(record.visible && visible);
  setStaticCityObjectVisible(record.mesh, effectiveVisible && fxEnabled('bridges'));
  for (const spec of deps.edgeStripSpecs) {
    if (spec.edgeRole === 'bridge' && spec.bridgeRecord === record) setStaticCityEdgeSpecVisible(spec, effectiveVisible);
  }
  // Qui c'era un secondo loop identico su deps.horizontalBuildingLedRings che
  // cercava spec.edgeRole === 'bridge' && spec.bridgeRecord === record. Non
  // poteva mai trovare niente: quell'array e' popolato solo da
  // addHorizontalBuildingLedRing (world/building-leds.js:275), chiamata solo
  // dal ramo side-building/main-building di addBuildingEdges, e lo spec che
  // costruisce non ha nemmeno un campo bridgeRecord. Girava a ogni frame per
  // ogni ponte senza produrre un solo match.
}

function setStaticCityBoardVisible(board, baseVisible) {
  if (!board?.group || !baseVisible) {
    if (board?.group) board.group.visible = false;
    return false;
  }
  const visible = staticCityCullFrustum.intersectsSphere(staticCityBoardSphere(board));
  board.group.visible = visible;
  return visible;
}

export function updateStaticCityCulling() {
  const {
    camera,
    sideBuildingRecords,
    mainBuildingRecords,
    bridgeRecords,
    cityDepartmentBoards,
    cityRoleBoards,
    sideDoorBatchState,
    departmentBoardEnabled,
    roleBoardEnabled,
  } = deps;
  staticCityCullStats.total = 0;
  staticCityCullStats.visible = 0;
  staticCityCullStats.hidden = 0;
  staticCityCullStats.buildingsTotal = sideBuildingRecords.length + mainBuildingRecords.length;
  staticCityCullStats.buildingsVisible = 0;
  staticCityCullStats.bridgesTotal = bridgeRecords.length;
  staticCityCullStats.bridgesVisible = 0;
  staticCityCullStats.boardsTotal = cityDepartmentBoards.length + cityRoleBoards.length;
  staticCityCullStats.boardsVisible = 0;
  staticCityCullStats.ledInstancesTotal = 0;
  staticCityCullStats.ledInstancesVisible = 0;
  staticCityCullStats.ledInstancesHidden = 0;
  staticCityCullStats.doorInstancesVisible = sideDoorBatchState.visibleInstances;
  if (!STATIC_CITY_CULLING_ENABLED) {
    for (const record of [...sideBuildingRecords, ...mainBuildingRecords]) setStaticCityBuildingClusterVisible(record, true);
    for (const record of bridgeRecords) setStaticCityBridgeClusterVisible(record, true);
    return;
  }

  camera.updateMatrixWorld();
  staticCityCullMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  staticCityCullFrustum.setFromProjectionMatrix(staticCityCullMatrix);

  let mainBuildingVisible = true;
  for (const record of sideBuildingRecords) {
    const visible = staticCityCullFrustum.intersectsSphere(staticCityRecordSphere(record));
    setStaticCityBuildingClusterVisible(record, visible);
    staticCityCullStats.total++;
    if (visible) {
      staticCityCullStats.visible++;
      staticCityCullStats.buildingsVisible++;
    } else {
      staticCityCullStats.hidden++;
    }
  }
  if (staticCityDoorCullDirty) {
    deps.updateDoorBatchMeshes();
    staticCityDoorCullDirty = false;
  }
  for (const record of mainBuildingRecords) {
    const visible = staticCityCullFrustum.intersectsSphere(staticCityRecordSphere(record));
    setStaticCityBuildingClusterVisible(record, visible);
    mainBuildingVisible = mainBuildingVisible && visible;
    staticCityCullStats.total++;
    if (visible) {
      staticCityCullStats.visible++;
      staticCityCullStats.buildingsVisible++;
    } else {
      staticCityCullStats.hidden++;
    }
  }
  setStaticCityMainLedClusterVisible(mainBuildingVisible);

  for (const record of bridgeRecords) {
    const visible = record.visible && staticCityCullFrustum.intersectsSphere(staticCityBridgeSphere(record));
    setStaticCityBridgeClusterVisible(record, visible);
    staticCityCullStats.total++;
    if (visible) {
      staticCityCullStats.visible++;
      staticCityCullStats.bridgesVisible++;
    } else {
      staticCityCullStats.hidden++;
    }
  }

  const departmentBoardBaseVisible = Boolean(
    departmentBoardEnabled &&
    (deps.departmentBoardRevealFactor() > 0.002 || deps.getRevealActive()) &&
    fxEnabled('deptBoards')
  );
  for (const board of cityDepartmentBoards) {
    const visible = setStaticCityBoardVisible(board, departmentBoardBaseVisible);
    staticCityCullStats.total++;
    if (visible) {
      staticCityCullStats.visible++;
      staticCityCullStats.boardsVisible++;
    } else {
      staticCityCullStats.hidden++;
    }
  }

  const roleBoardRevealFactor = deps.departmentBoardRevealFactor();
  for (const board of cityRoleBoards) {
    const baseVisible = Boolean(roleBoardEnabled && board.enabled && roleBoardRevealFactor > 0.002 && fxEnabled('roleBoards'));
    const visible = setStaticCityBoardVisible(board, baseVisible);
    staticCityCullStats.total++;
    if (visible) {
      staticCityCullStats.visible++;
      staticCityCullStats.boardsVisible++;
    } else {
      staticCityCullStats.hidden++;
    }
  }
}
