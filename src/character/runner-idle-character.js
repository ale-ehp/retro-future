import * as THREE from 'three';
import {
  TRON_RUNNER_CROWD_COLOR_PRESETS,
} from './character-colors.js';
import {
  poseTronRunnerIdleCharacterArmsCrossed,
} from './character-build.js';
import {
  tronRunnerIdleCharacterInspect,
} from './character-inspect.js';
import {
  TRON_RUNNER_IDLE_CHARACTER_BODY_CLEARANCE,
  TRON_RUNNER_IDLE_CHARACTER_CIVIC,
  TRON_RUNNER_IDLE_CHARACTER_COLOR_PRESET,
  TRON_RUNNER_IDLE_CHARACTER_CORNER_FLAT_INSET,
  TRON_RUNNER_IDLE_CHARACTER_ENABLED,
  TRON_RUNNER_IDLE_CHARACTER_FRONT_WALL_CLEARANCE,
  TRON_RUNNER_IDLE_CHARACTER_LEAN_DEG,
  TRON_RUNNER_IDLE_CHARACTER_LIFT_PX,
  TRON_RUNNER_IDLE_CHARACTER_STATIC,
  TRON_RUNNER_IDLE_CHARACTER_WALL_CONTACT_EPS,
  TRON_RUNNER_IDLE_CHARACTER_Y_LIFT,
} from './characters.js';
import {
  createTronRunnerIdleCharacter,
} from './runner-state.js';

export function createTronRunnerIdleCharacterRuntime({
  scene,
  runnerWalker,
  crowdBox,
  cloneRunnerSkeleton,
  resolveRoundedCollider,
  crowdRecordRoadDir,
  crowdColorPresetForIndex,
  makeCrowdSuitMaterial,
  surfaceYForPoint,
  syncRevealIdleVisibility,
  getSideBuildingRecords,
  getPlayerSpawn,
  sideBuildingSpacing,
  sideDoorFaceOffset,
  gridBlock,
}) {
  const group = new THREE.Group();
  group.name = 'tron-runner-idle-character';
  group.visible = false;
  scene.add(group);
  const idleCharacter = createTronRunnerIdleCharacter({ group });
  const idleTalk = {
    group,
    talkLines: ['Mi godo la pausa'],
    talkCycle: 0,
    talkArmed: true,
    talkUntil: 0,
    talkStart: 0,
    talkText: '',
  };
  const boundsCenter = new THREE.Vector3();

  function targetRecord() {
    return getSideBuildingRecords().find((record) => record.civicNumberValue === TRON_RUNNER_IDLE_CHARACTER_CIVIC) || null;
  }

  function clear() {
    while (group.children.length) {
      group.remove(group.children[0]);
    }
    Object.assign(idleCharacter, {
      built: false,
      visible: false,
      locked: false,
      lockedPlacement: null,
      recordCivic: null,
      error: '',
      poseApplied: false,
      poseBoneCount: 0,
      poseBoneNames: [],
      upperArmPoseApplied: false,
      model: null,
      materials: [],
      x: 0,
      y: 0,
      z: 0,
      yaw: 0,
      startSideSign: 1,
      anchor: '',
      perimeterClearance: TRON_RUNNER_IDLE_CHARACTER_BODY_CLEARANCE,
      cornerFaceInset: 0,
      roundedColliderResolved: false,
      roundedRadius: 0,
      cornerFlatInset: TRON_RUNNER_IDLE_CHARACTER_CORNER_FLAT_INSET,
      frontWallClearance: TRON_RUNNER_IDLE_CHARACTER_FRONT_WALL_CLEARANCE,
      wallContactEps: TRON_RUNNER_IDLE_CHARACTER_WALL_CONTACT_EPS,
      roadDir: 0,
      placementSource: '',
      corner: '',
    });
    group.visible = false;
  }

  function resolveStartWallPoint(record, faceSign, playerSideSign) {
    const collider = record?.collider;
    if (!collider) return null;
    const padding = TRON_RUNNER_IDLE_CHARACTER_BODY_CLEARANCE;
    const halfX = collider.hw;
    const halfZ = collider.hd;
    const roundedRadius = Math.max(0, collider.chamfer || 0);
    const safeInset = THREE.MathUtils.clamp(
      roundedRadius + TRON_RUNNER_IDLE_CHARACTER_CORNER_FLAT_INSET,
      padding * 2,
      Math.max(padding * 2, halfX - padding)
    );
    const point = {
      x: collider.x + faceSign * (halfX + sideDoorFaceOffset + TRON_RUNNER_IDLE_CHARACTER_FRONT_WALL_CLEARANCE),
      z: collider.z + playerSideSign * (halfZ - safeInset),
    };
    const beforeX = point.x;
    const beforeZ = point.z;
    const roundedColliderResolved = resolveRoundedCollider(point, collider, padding);
    return {
      x: point.x,
      z: point.z,
      roundedColliderResolved,
      roundedCorrection: Math.hypot(point.x - beforeX, point.z - beforeZ),
      roundedRadius,
      cornerFlatInset: safeInset,
      frontWallClearance: TRON_RUNNER_IDLE_CHARACTER_FRONT_WALL_CLEARANCE,
      wallContactEps: TRON_RUNNER_IDLE_CHARACTER_WALL_CONTACT_EPS,
      roadDir: faceSign,
      source: 'buildingFacade',
    };
  }

  function placement(record = targetRecord()) {
    const pad = record?.basePad;
    const polygon = pad?.hitPolygon;
    if (!record || !pad?.border || !polygon?.length || !record.collider) return null;
    const isLeftBuilding = (record.mesh?.position?.x ?? 0) < 0;
    const playerSpawn = getPlayerSpawn();
    const spawnReferenceZ = Number.isFinite(playerSpawn?.z)
      ? playerSpawn.z
      : ((record.mesh?.position?.z ?? 0) + sideBuildingSpacing);
    const playerSideSign = spawnReferenceZ >= record.mesh.position.z ? 1 : -1;
    const faceSign = crowdRecordRoadDir(record);
    const wallPoint = resolveStartWallPoint(record, faceSign, playerSideSign);
    if (!wallPoint) return null;
    const worldX = wallPoint.x;
    const worldZ = wallPoint.z;
    const surface = surfaceYForPoint(worldX, worldZ);
    const lookX = worldX + faceSign * gridBlock * 1.5;
    const lookZ = worldZ;
    return {
      x: worldX,
      y: surface.y + TRON_RUNNER_IDLE_CHARACTER_Y_LIFT,
      z: worldZ,
      yaw: Math.atan2(lookX - worldX, lookZ - worldZ),
      surface: surface.surface,
      startSideSign: playerSideSign,
      anchor: 'building-facade-road-wall-start-corner',
      perimeterClearance: TRON_RUNNER_IDLE_CHARACTER_BODY_CLEARANCE,
      cornerFaceInset: wallPoint.cornerFlatInset,
      roundedColliderResolved: wallPoint.roundedColliderResolved,
      roundedCorrection: wallPoint.roundedCorrection,
      roundedRadius: wallPoint.roundedRadius,
      cornerFlatInset: wallPoint.cornerFlatInset,
      frontWallClearance: wallPoint.frontWallClearance,
      wallContactEps: wallPoint.wallContactEps,
      roadDir: wallPoint.roadDir,
      placementSource: wallPoint.source,
      corner: `${isLeftBuilding ? 'left' : 'right'}-${playerSideSign > 0 ? 'start-max-z' : 'start-min-z'}-road-wall-building-facade`,
    };
  }

  function syncPose() {
    if (!idleCharacter.built) return;
    const record = targetRecord();
    let nextPlacement = TRON_RUNNER_IDLE_CHARACTER_STATIC ? idleCharacter.lockedPlacement : null;
    if (!nextPlacement) {
      nextPlacement = placement(record);
      if (nextPlacement && TRON_RUNNER_IDLE_CHARACTER_STATIC) {
        idleCharacter.lockedPlacement = { ...nextPlacement };
        idleCharacter.locked = true;
      }
    }
    if (!nextPlacement) {
      idleCharacter.error = `building-${TRON_RUNNER_IDLE_CHARACTER_CIVIC}-placement-missing`;
      group.visible = false;
      idleCharacter.visible = false;
      return;
    }
    group.scale.copy(runnerWalker.scale);
    group.position.set(nextPlacement.x, nextPlacement.y, nextPlacement.z);
    group.rotation.set(0, nextPlacement.yaw, 0);
    Object.assign(idleCharacter, {
      locked: Boolean(TRON_RUNNER_IDLE_CHARACTER_STATIC && idleCharacter.lockedPlacement),
      recordCivic: record?.civicNumberValue ?? TRON_RUNNER_IDLE_CHARACTER_CIVIC,
      error: '',
      x: Number(nextPlacement.x.toFixed(3)),
      y: Number(nextPlacement.y.toFixed(3)),
      z: Number(nextPlacement.z.toFixed(3)),
      yaw: Number(nextPlacement.yaw.toFixed(3)),
      surface: nextPlacement.surface,
      startSideSign: nextPlacement.startSideSign,
      anchor: nextPlacement.anchor,
      perimeterClearance: nextPlacement.perimeterClearance,
      cornerFaceInset: nextPlacement.cornerFaceInset,
      roundedColliderResolved: nextPlacement.roundedColliderResolved,
      roundedCorrection: nextPlacement.roundedCorrection,
      roundedRadius: nextPlacement.roundedRadius,
      cornerFlatInset: nextPlacement.cornerFlatInset,
      frontWallClearance: nextPlacement.frontWallClearance,
      wallContactEps: nextPlacement.wallContactEps,
      roadDir: nextPlacement.roadDir,
      placementSource: nextPlacement.placementSource,
      corner: nextPlacement.corner,
    });
  }

  function build(sourceModel) {
    clear();
    if (!TRON_RUNNER_IDLE_CHARACTER_ENABLED) return;
    const cloneSkeleton = cloneRunnerSkeleton();
    if (!sourceModel || !cloneSkeleton) {
      idleCharacter.error = 'source-model-missing';
      return;
    }
    const record = targetRecord();
    if (!record) {
      idleCharacter.error = `building-${TRON_RUNNER_IDLE_CHARACTER_CIVIC}-not-found`;
      return;
    }
    const model = cloneSkeleton(sourceModel);
    model.name = `soldier-rigged-runner-idle-building-${TRON_RUNNER_IDLE_CHARACTER_CIVIC}`;
    model.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.frustumCulled = false;
      obj.castShadow = false;
      obj.receiveShadow = false;
      obj.layers.set(0);
    });
    const idleColorPreset = TRON_RUNNER_CROWD_COLOR_PRESETS[TRON_RUNNER_IDLE_CHARACTER_COLOR_PRESET] || crowdColorPresetForIndex(0);
    const material = makeCrowdSuitMaterial(idleColorPreset);
    model.traverse((obj) => {
      if (obj.isMesh) obj.material = material;
    });
    model.rotation.z += record.sign * idleCharacter.leanRad;
    group.add(model);
    idleCharacter.model = model;
    idleCharacter.materials = [material];
    idleCharacter.built = true;
    poseTronRunnerIdleCharacterArmsCrossed(model, idleCharacter);
    syncPose();
    syncRevealIdleVisibility();
  }

  function inspect() {
    return tronRunnerIdleCharacterInspect({
      idleCharacter,
      idleCharacterGroup: group,
      crowdBox,
      boundsCenter,
      enabled: TRON_RUNNER_IDLE_CHARACTER_ENABLED,
      colorPreset: TRON_RUNNER_IDLE_CHARACTER_COLOR_PRESET,
      liftPx: TRON_RUNNER_IDLE_CHARACTER_LIFT_PX,
      yLift: TRON_RUNNER_IDLE_CHARACTER_Y_LIFT,
      leanDeg: TRON_RUNNER_IDLE_CHARACTER_LEAN_DEG,
    });
  }

  return {
    group,
    character: idleCharacter,
    talk: idleTalk,
    clear,
    syncPose,
    build,
    inspect,
  };
}
