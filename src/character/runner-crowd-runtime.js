import * as THREE from 'three';
import { fxEnabled } from '../engine/fx-debug-toggles.js';
import { inLingua } from '../lingua.js';

import {
  createTronRunnerCrowdMemberRecord,
} from './character-build.js';
import {
  nearbyTronRunnerCrowdMembers,
  prepareTronRunnerCrowdSpatialGrid,
  tronRunnerCrowdAvoidance as tronRunnerCrowdAvoidanceCore,
  tronRunnerCrowdDistanceToCamera as tronRunnerCrowdDistanceToCameraCore,
  tronRunnerCrowdLodStride as tronRunnerCrowdLodStrideCore,
  tronRunnerCrowdTryDeadlockNudge as tronRunnerCrowdTryDeadlockNudgeCore,
  tronRunnerCrowdWalkCycleOffset,
  updateTronRunnerCrowdCullingState,
} from './character-crowd.js';
import {
  resolveTronRunnerCrowdCollision as resolveTronRunnerCrowdCollisionCore,
  resolveTronRunnerRoundedCollider,
  tronRunnerCrowdBuildingCollisionDiagnostic as tronRunnerCrowdBuildingCollisionDiagnosticCore,
  tronRunnerCrowdColliderLabel,
  tronRunnerCrowdPointInsideRoute as tronRunnerCrowdPointInsideRouteCore,
} from './character-collision.js';
import {
  countBy,
  inspectTronRunnerMaterials,
  maxBy,
  minBy,
  sideStreetCoverage as buildSideStreetCoverage,
  sideStreetGroupedSegments as buildSideStreetGroupedSegments,
  sumBy,
} from './character-inspect.js';
import {
  applyTronRunnerCrowdReflectionState,
  buildTronRunnerCrowdReflection,
  tronRunnerCrowdPostRevealReflectionRampLimit as tronRunnerCrowdPostRevealReflectionRampLimitCore,
  tronRunnerCrowdReflectionOccludedByBuilding,
  updateTronRunnerCrowdReflectionBudget as updateTronRunnerCrowdReflectionBudgetCore,
} from './character-reflections.js';
import {
  tronRunnerCrowdGridCoord as tronRunnerCrowdGridCoordCore,
} from './character-movement.js';
import {
  syncTronRunnerCrowdRunCycleToDistance,
  syncTronRunnerCrowdWalkCycleToDistance,
  makeTronRunnerCrowdActionSet,
} from './runner-animation.js';
import {
  tronRunnerCharacterLedDefaultScale,
  tronRunnerCharacterLedScale,
} from './runner-crowd-leds.js';
import {
  pickTronRunnerCrowdLines,
} from './runner-crowd-lines.js';

// Quello che dice chi ti accoglie quando ti porta davanti al tabellone. Il <br> e' la riga
// in cui spezzare il cartello, non decorazione: senza, il testo esce dal pannello.
export const GREETER_FOLLOW_BUBBLE_TEXT = { it: 'Seguimi', en: 'Follow me' };

export const GREETER_BOARD_BUBBLE_TEXT = {
  it: 'Qui puoi vedere<br>i nostri reparti',
  en: 'Here you can see<br>our departments',
};

export function clearTronRunnerCrowdState({
  crowd,
  group,
  spatialGrid,
  buildStats,
  runtimeStats,
  requestedCount,
}) {
  spatialGrid.clear();
  crowd.length = 0;
  while (group.children.length) {
    group.remove(group.children[0]);
  }
  group.visible = false;
  buildStats.status = 'idle';
  buildStats.built = 0;
  buildStats.requested = requestedCount;
  buildStats.startedAt = 0;
  buildStats.durationMs = 0;
  buildStats.lastChunkMs = 0;
  runtimeStats.performanceFreezeFrameCount = 0;
}

export function syncTronRunnerCrowdScaleAndGround({
  crowd,
  sourceScale,
  surfaceYForPoint,
  fallbackPlacement,
  groundOffset,
  updateReflection,
  syncMemberMatrixUpdates,
  syncIdlePose,
}) {
  for (const member of crowd) {
    member.group.scale.copy(sourceScale);
    const surface = member.route
      ? surfaceYForPoint(member.group.position.x, member.group.position.z)
      : null;
    if (surface) {
      member.group.position.y = surface.y;
      member.surface = surface.surface;
      member.groundOffset = member.group.position.y - surface.groundY;
    } else {
      const placement = fallbackPlacement(member.index);
      member.group.position.set(placement.x, placement.y, placement.z);
      member.group.rotation.y = placement.yaw;
      member.surface = placement.surface;
      member.groundOffset = groundOffset;
    }
    updateReflection(member);
    syncMemberMatrixUpdates(member, true);
  }
  syncIdlePose();
}

export function tronRunnerCrowdGridCoordRuntime({ cellSize }, value) {
  return tronRunnerCrowdGridCoordCore(value, cellSize);
}

export function cityRevealPostRevealElapsedMsRuntime({
  getCityRevealComplete,
  getCityRevealCompletedAt,
}, now = performance.now()) {
  if (!getCityRevealComplete() || !getCityRevealCompletedAt()) return 0;
  return Math.max(0, now - getCityRevealCompletedAt());
}

export const TRON_RUNNER_GREETER_START_SIDE_OFFSET = 2.8;
export const TRON_RUNNER_GREETER_START_BACK_OFFSET = 16;
export const TRON_RUNNER_GREETER_GREET_DISTANCE = 7.4;
// La seconda riga resta 'avstudio.ai' in entrambe le lingue: e' quella che
// speech-bubbles.js riconosce per disegnarci il logo al posto del testo.
export const TRON_RUNNER_WELCOME_BUBBLE_TEXT = {
  it: 'Benvenuto in<br>avstudio.ai',
  en: 'Welcome to<br>avstudio.ai',
};
export const TRON_RUNNER_WELCOME_BUBBLE_DURATION_MS = 3600;
// Meta' di quanto era (2026-09-19): 1.55 riempiva mezzo schermo da vicino.
export const TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE = 0.775;
export const TRON_RUNNER_FOLLOW_PROMPT_DELAY_MS = 1500;

export function tronRunnerGreeterStartPosition({
  droneLandingPose,
  routeStart,
  sideOffset = TRON_RUNNER_GREETER_START_SIDE_OFFSET,
  backOffset = TRON_RUNNER_GREETER_START_BACK_OFFSET,
} = {}) {
  const landingX = Number.isFinite(droneLandingPose?.x) ? droneLandingPose.x : 0;
  const baseZ = Number.isFinite(droneLandingPose?.z)
    ? droneLandingPose.z
    : (Number.isFinite(routeStart?.z) ? routeStart.z : 0);
  const y = Number.isFinite(routeStart?.y) ? routeStart.y : 0;
  return {
    x: landingX + sideOffset,
    y,
    z: baseZ - backOffset,
  };
}

export function invalidateTronRunnerCrowdColliderRecordsRuntime(cache) {
  cache.records = null;
  cache.sourceLength = -1;
}

export function tronRunnerCrowdColliderRecordsRuntime({
  cache,
  getSideBuildingRecords,
  getMainBuildingRecords,
}) {
  const sideRecords = getSideBuildingRecords();
  const mainRecords = getMainBuildingRecords();
  const sourceLength = sideRecords.length + mainRecords.length;
  if (!cache.records || cache.sourceLength !== sourceLength) {
    cache.records = [...sideRecords, ...mainRecords].filter((record) => record.collider);
    cache.sourceLength = sourceLength;
  }
  return cache.records;
}

function collectTronRunnerCrowdSourceMeshes(sourceModel) {
  const sourceMeshes = [];
  sourceModel.traverse((obj) => {
    if (obj.isMesh) sourceMeshes.push(obj);
  });
  return sourceMeshes;
}

export function enqueueTronRunnerCrowdBuildJobRuntime(state, sourceModel, animations, options = {}) {
  if (!state.crowdEnabled || !sourceModel || !state.getCloneRunnerSkeleton()) return false;
  const count = Math.max(0, Math.floor(options.count ?? state.requestedCount));
  if (!count) return false;
  if (!Array.isArray(state.queue)) state.queue = [];
  const startedAt = state.now();
  const job = {
    sourceModel,
    sourceMeshes: collectTronRunnerCrowdSourceMeshes(sourceModel),
    animations,
    count,
    nextIndex: 0,
    indexOffset: options.indexOffset ?? (state.crowd?.length ?? 0),
    kind: options.kind || 'runner',
    source: options.source || 'soldier',
    groupNamePrefix: options.groupNamePrefix || 'tron-runner-crowd',
    modelNamePrefix: options.modelNamePrefix || 'soldier-rigged-runner-crowd',
    colorPresetForIndex: options.colorPresetForIndex || null,
    walkCycleDistanceMode: options.walkCycleDistanceMode || '',
    startedAt,
  };
  state.queue.push(job);
  state.buildStats.status = state.job ? 'building' : 'queued';
  state.buildStats.built = state.crowd?.length ?? state.buildStats.built ?? 0;
  state.buildStats.requested = (state.buildStats.requested || 0) + count;
  if (!state.buildStats.startedAt) state.buildStats.startedAt = startedAt;
  return true;
}

export function startTronRunnerCrowdBuildQueueRuntime(state, sourceModel, animations) {
  state.job = null;
  state.queue = [];
  state.clearState();
  state.buildStats.built = 0;
  state.buildStats.requested = 0;
  state.buildStats.startedAt = 0;
  state.buildStats.durationMs = 0;
  enqueueTronRunnerCrowdBuildJobRuntime(state, sourceModel, animations, {
    count: state.requestedCount,
    indexOffset: 0,
    kind: 'runner',
    source: 'soldier',
    groupNamePrefix: 'tron-runner-crowd',
    modelNamePrefix: 'soldier-rigged-runner-crowd',
  });
}

export function processTronRunnerCrowdBuildQueueRuntime(state) {
  if (!state.job) state.job = state.queue?.shift() || null;
  if (!state.job) return;
  const job = state.job;
  const started = state.now();
  state.buildStats.status = 'building';
  state.buildMember(job, job.nextIndex);
  job.nextIndex += 1;
  state.buildStats.built = state.crowd?.length ?? state.buildStats.built + 1;
  state.buildStats.lastChunkMs = state.now() - started;
  if (job.nextIndex < job.count) return;
  state.job = null;
  if (state.queue?.length) return;
  state.syncScaleAndGround();
  state.syncVisibility();
  state.buildStats.status = 'done';
  state.buildStats.durationMs = state.now() - (state.buildStats.startedAt || job.startedAt);
}

export async function drainTronRunnerCrowdBuildQueueRuntime(state) {
  while (state.job || state.queue?.length) {
    state.processBuildQueue();
    await state.waitForNextFrame();
  }
}

const greeterBoardAnchorScratch = { x: 0, z: 0, cx: 0, cz: 0 };

export function resolveGreeterBoardAnchorRuntime({
  getCityDepartmentBoards,
  sideGap,
  frontGap,
}) {
  const boards = getCityDepartmentBoards();
  if (!boards || !boards.length) return null;
  const board = boards.find((b) => b?.group?.visible && b?.boardPosition) || boards[0];
  if (!board || !board.boardPosition) return null;
  const yaw = board.yaw || 0;
  const halfWidth = (board.boardWidth || 21) * 0.5;
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);
  const normalX = Math.sin(yaw);
  const normalZ = Math.cos(yaw);
  greeterBoardAnchorScratch.x = board.boardPosition.x + rightX * (halfWidth + sideGap) + normalX * frontGap;
  greeterBoardAnchorScratch.z = board.boardPosition.z + rightZ * (halfWidth + sideGap) + normalZ * frontGap;
  greeterBoardAnchorScratch.cx = board.boardPosition.x;
  greeterBoardAnchorScratch.cz = board.boardPosition.z;
  return greeterBoardAnchorScratch;
}

export function switchGreeterActionToRunRuntime(mixer, fromAction, runActionKey, member) {
  if (!mixer || !member.runClip) return null;
  const run = member[runActionKey] || mixer.clipAction(member.runClip);
  member[runActionKey] = run;
  run.enabled = true;
  run.setEffectiveTimeScale(1);
  run.setEffectiveWeight(1);
  run.play();
  if (fromAction && fromAction !== run) {
    fromAction.stop();
    fromAction.setEffectiveWeight(0);
  }
  return run;
}

// Hard-switch idle -> run weights: the run clip is driven by ground distance,
// so a crossfade would not progress when mixer.update(0) is used for sync.
export function startGreeterWalkingToBoardRuntime(member) {
  member.greetPosed = false;
  if (member.runClip && member.mixer) {
    member.walkAction = member.walkAction || member.action;
    const run = switchGreeterActionToRunRuntime(member.mixer, member.idleAction || member.walkAction, 'runAction', member);
    if (run) member.action = run;
    const rRun = switchGreeterActionToRunRuntime(member.reflectionMixer, member.reflectionIdleAction || member.reflectionAction, 'reflectionRunAction', member);
    if (rRun) member.reflectionAction = rRun;
    const lRun = switchGreeterActionToRunRuntime(member.reflectionLedMixer, member.reflectionLedIdleAction || member.reflectionLedAction, 'reflectionLedRunAction', member);
    if (lRun) member.reflectionLedAction = lRun;
    return;
  }
  const walk = member.action;
  const idle = member.idleAction;
  if (walk) {
    walk.enabled = true;
    walk.setEffectiveTimeScale(1);
    walk.setEffectiveWeight(1);
    walk.play();
  }
  if (idle) {
    idle.stop();
    idle.setEffectiveWeight(0);
  }
  if (member.reflectionAction) {
    member.reflectionAction.enabled = true;
    member.reflectionAction.setEffectiveWeight(1);
    member.reflectionAction.play();
  }
  if (member.reflectionIdleAction) {
    member.reflectionIdleAction.stop();
    member.reflectionIdleAction.setEffectiveWeight(0);
  }
  if (member.reflectionLedAction) {
    member.reflectionLedAction.enabled = true;
    member.reflectionLedAction.setEffectiveWeight(1);
    member.reflectionLedAction.play();
  }
  if (member.reflectionLedIdleAction) {
    member.reflectionLedIdleAction.stop();
    member.reflectionLedIdleAction.setEffectiveWeight(0);
  }
}

export function applyGreeterHeadLookRuntime({
  camera,
  maxYaw,
  yawSign,
  lerpAngle,
}, member, dt) {
  if (!member.headBone) {
    member.model?.traverse((object) => {
      if (!member.headBone && object.isBone && /head$/i.test(object.name)) member.headBone = object;
    });
  }
  if (!member.headBone) return;
  const lookYaw = Math.atan2(camera.position.x - member.group.position.x, camera.position.z - member.group.position.z);
  let rel = lookYaw - member.group.rotation.y;
  rel = Math.atan2(Math.sin(rel), Math.cos(rel));
  rel = Math.min(maxYaw, Math.max(-maxYaw, rel)) * yawSign;
  member.headLookYaw = lerpAngle(member.headLookYaw ?? 0, rel, Math.min(1, dt * 4));
  member.headBone.rotation.y = member.headLookYaw;
  if (!member.reflectionHeadBone && member.reflectionModel) {
    member.reflectionModel.traverse((object) => {
      if (!member.reflectionHeadBone && object.isBone && /head$/i.test(object.name)) {
        member.reflectionHeadBone = object;
      }
    });
  }
  if (member.reflectionHeadBone) member.reflectionHeadBone.rotation.y = member.headLookYaw;
}

export function setGreeterBubbleRuntime(member, html, durationMs, now, sizeScale = 1) {
  member.bubbleText = html;
  member.bubbleUntil = now + durationMs;
  member.bubbleSizeScale = sizeScale;
  member.bubbleProximity = false;
}

const tronRunnerCrowdReflectionStateArgs = {
  member: null,
  group: null,
  bodyMaterials: null,
  ledMaterials: null,
  visible: false,
  bodyOpacity: 0,
  ledOpacity: 0,
  reflectionY: 0,
  reflectionYScale: 1,
};

export function updateTronRunnerCrowdReflectionRuntime({
  getCrowdReflectionsIsolation,
  camera,
  getColliderRecords,
  reflectionRig,
  dynamicReflectionEnabled,
  crowdGroup,
  reflectionY,
  reflectionYScale,
}, member) {
  const budgetActive = getCrowdReflectionsIsolation() && member.dynamicReflectionBudgetActive === true;
  if (!budgetActive && member.dynamicReflectionVisible === false) return;
  const group = member.reflectionGroup;
  const bodyMaterials = member.reflectionBodyMaterials || [];
  const ledMaterials = member.reflectionLedMaterials || [];
  const occluded = budgetActive && tronRunnerCrowdReflectionOccludedByBuilding(
    member,
    camera.position,
    getColliderRecords()
  );
  const bodyOpacity = budgetActive && !occluded ? reflectionRig.bodyOpacityForSurface(member.surface) : 0;
  const ledOpacity = budgetActive && !occluded ? reflectionRig.ledOpacityForSurface(member.surface) : 0;
  const visible = Boolean(
    dynamicReflectionEnabled &&
    getCrowdReflectionsIsolation() &&
    crowdGroup.visible &&
    member.group.visible &&
    group &&
    budgetActive &&
    bodyOpacity > 0.005
  );
  const reflectionArgs = tronRunnerCrowdReflectionStateArgs;
  reflectionArgs.member = member;
  reflectionArgs.group = group;
  reflectionArgs.bodyMaterials = bodyMaterials;
  reflectionArgs.ledMaterials = ledMaterials;
  reflectionArgs.visible = visible;
  reflectionArgs.bodyOpacity = bodyOpacity;
  reflectionArgs.ledOpacity = ledOpacity;
  reflectionArgs.reflectionY = reflectionY;
  reflectionArgs.reflectionYScale = reflectionYScale;
  applyTronRunnerCrowdReflectionState(reflectionArgs);
}

export function buildTronRunnerCrowdMemberRuntime({
  crowd,
  crowdGroup,
  walker,
  runnerState,
  cloneRunnerSkeleton,
  materials,
  routes,
  dynamicReflectionEnabled,
  reflectionRig,
  getWalkSpeed,
  crowdSpeedScale,
  groundOffset,
  greeterIndex,
  getDroneLandingPose,
  crowdLines,
  talkLinesPerMember,
}, job, index) {
  const globalIndex = (job.indexOffset ?? 0) + index;
  const group = new THREE.Group();
  group.name = `${job.groupNamePrefix || 'tron-runner-crowd'}-${globalIndex + 1}`;
  group.visible = false;
  group.scale.copy(walker.scale);
  const colorPreset = job.colorPresetForIndex?.(index, globalIndex) || materials.colorPresetForIndex(globalIndex);

  const cloneModel = cloneRunnerSkeleton(job.sourceModel);
  cloneModel.name = `${job.modelNamePrefix || 'soldier-rigged-runner-crowd'}-${globalIndex + 1}`;
  const cloneMeshes = [];
  cloneModel.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.frustumCulled = false;
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.layers.set(0);
    cloneMeshes.push(obj);
  });
  const crowdMaterial = materials.makeSuitMaterial(colorPreset);
  cloneMeshes.forEach((mesh) => {
    mesh.material = crowdMaterial;
  });
  group.add(cloneModel);
  // fx.crowd=0 hides every crowd body; fx.greeter=0 hides only the greeter member.
  // cloneModel.visible is never rewritten by culling/reveal (they touch group.visible
  // / material.opacity), so this persists and skips only the body draw.
  cloneModel.visible = fxEnabled('crowd') && (globalIndex !== greeterIndex || fxEnabled('greeter'));

  const animationScaleOffset = 0.92 + (globalIndex % 5) * 0.035;
  const speedScaleOffset = 0.86 + (globalIndex % 5) * 0.035;
  const { mixer, action } = makeTronRunnerCrowdActionSet({
    model: cloneModel,
    animations: job.animations,
    offset: globalIndex,
    effectiveAnimationSpeed: runnerState.effectiveAnimationSpeed,
  });
  // The rig is two more skeleton clones and two more AnimationMixers per member.
  // It is only ever parented below when the effect is on, and the toggle does not
  // rebuild the crowd, so building it with the effect off produced ~60 skinned
  // rigs that could never render — paid for in build-chunk time, scene-graph size
  // and memory. Ask for it only when it can actually be used.
  const crowdReflectionsVisible = fxEnabled('crowdReflections');
  const reflection = buildTronRunnerCrowdReflection({
    sourceModel: job.sourceModel,
    animations: job.animations,
    index: globalIndex,
    colorPreset,
    dynamicReflectionEnabled: dynamicReflectionEnabled && crowdReflectionsVisible,
    cloneRunnerSkeleton,
    reflectionRig,
    effectiveAnimationSpeed: runnerState.effectiveAnimationSpeed,
  });
  if (crowdReflectionsVisible && reflection.group) group.add(reflection.group);
  const route = routes.buildRoute(globalIndex);
  const fallback = routes.fallbackPlacement(globalIndex);
  const startInfo = routes.roadFacingStart(route, globalIndex, fallback);
  const start = startInfo.placement;
  group.position.set(start.x, start.y, start.z);
  group.rotation.y = start.yaw ?? 0;
  if (globalIndex === greeterIndex) {
    // The green companion starts far enough out to show a visible approach before greeting.
    const droneLandingPose = getDroneLandingPose();
    const greeterStart = tronRunnerGreeterStartPosition({ droneLandingPose, routeStart: start });
    group.position.set(greeterStart.x, greeterStart.y, greeterStart.z);
  }
  const speed = getWalkSpeed() * crowdSpeedScale * speedScaleOffset;
  const actionClipDuration = action?.getClip?.()?.duration ?? 0;
  const walkCycleDistance = job.walkCycleDistanceMode === 'clip-duration'
    && Number.isFinite(actionClipDuration)
    && actionClipDuration > 0
      ? Math.max(0.001, speed * actionClipDuration)
      : null;
  const member = createTronRunnerCrowdMemberRecord({
    index: globalIndex,
    group,
    model: cloneModel,
    material: crowdMaterial,
    mixer,
    action,
    colorPreset,
    reflection,
    route,
    startInfo,
    speed,
    speedScaleOffset,
    animationScaleOffset,
    walkCycleOffset: tronRunnerCrowdWalkCycleOffset(globalIndex),
    groundOffset,
  });
  member.localIndex = index;
  member.kind = job.kind || 'runner';
  member.source = job.source || 'soldier';
  member.idleClip = job.animations?.find((clip) => /idle/i.test(clip.name)) || null;
  member.runClip = job.animations?.find((clip) => /run/i.test(clip.name)) || null;
  member.walkCycleDistance = walkCycleDistance;
  member.walkCycleDistanceMode = job.walkCycleDistanceMode || '';
  member.walkClipDuration = actionClipDuration;
  member.talkLines = pickTronRunnerCrowdLines(globalIndex, crowdLines, talkLinesPerMember);
  member.talkCycle = 0;
  member.talkArmed = true;
  member.talkUntil = 0;
  member.talkStart = 0;
  member.talkText = '';
  crowd.push(member);
  crowdGroup.add(group);
}

const tronRunnerCrowdNextPointScratch = { x: 0, z: 0 };

export function advanceTronRunnerCrowdMemberRuntime({
  runtime,
  camera,
  surfaceYForPoint,
  lerpAngle,
  greeterIndex,
  greeterBubbleDurationMs,
  greeterFollowDelayMs,
  greeterBoardReach,
  greetDistance,
  greeterBoardBubbleRange,
  greeterBoardStanceDeg,
  crowdReachRadius,
  pauseChance,
  pauseMinMs,
  pauseMaxMs,
  turnDurationMs,
  yieldDurationMs,
}, member, dt, now = performance.now()) {
  const crowdRuntime = runtime();
  crowdRuntime.normalizeState(member, now);
  const route = member.route;
  const isGreeter = member.index === greeterIndex;
  // Once the welcome bubble has dissolved, raise the "Seguimi" prompt and stand for a beat...
  if (isGreeter && member.greetStage === 'welcome'
      && member.greetAt && (now - member.greetAt) > greeterBubbleDurationMs) {
    member.greetStage = 'followPrompt';
    member.followPromptAt = now;
    crowdRuntime.setGreeterBubble(member, inLingua(GREETER_FOLLOW_BUBBLE_TEXT), 8000, now);
  }
  // ...then 1s later set off for the departures board (retry until the anchor resolves).
  if (isGreeter && member.greetStage === 'followPrompt'
      && member.followPromptAt && (now - member.followPromptAt) >= greeterFollowDelayMs) {
    const anchor = crowdRuntime.resolveGreeterBoardAnchor();
    if (anchor) {
      member.greetBoardAnchorX = anchor.x;
      member.greetBoardAnchorZ = anchor.z;
      member.greetBoardCenterX = anchor.cx;
      member.greetBoardCenterZ = anchor.cz;
      member.greetStage = 'toBoard';
      crowdRuntime.startGreeterWalkingToBoard(member);
    }
  }
  if (isGreeter && (member.greetStage === 'welcome' || member.greetStage === 'followPrompt' || member.greetStage === 'atBoard')) {
    // Welcomed/parked: freeze into a neutral standing pose (bind pose = straight legs, then
    // arms crossed like the idle character) so we don't stop mid-stride with a leg raised.
    if (!member.greetPosed) {
      member.greetPosed = true;
      // Crossfade from walking into the soldier idle clip: a natural standing welcome
      // (alive, no mid-stride leg, no stiff pose). Mixer is driven per frame once greetPosed.
      if (member.idleClip && member.mixer) {
        member.idleAction = member.idleAction || member.mixer.clipAction(member.idleClip);
        member.idleAction.reset();
        member.idleAction.setEffectiveTimeScale(1);
        member.idleAction.setEffectiveWeight(1);
        member.idleAction.play();
        if (member.action) member.action.crossFadeTo(member.idleAction, 0.45, false);
        // Keep the floor reflection in sync with the body's idle (it was still walking).
        if (member.reflectionMixer && member.reflectionAction) {
          member.reflectionIdleAction = member.reflectionIdleAction || member.reflectionMixer.clipAction(member.idleClip);
          member.reflectionIdleAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
          member.reflectionAction.crossFadeTo(member.reflectionIdleAction, 0.45, false);
        }
        if (member.reflectionLedMixer && member.reflectionLedAction) {
          member.reflectionLedIdleAction = member.reflectionLedIdleAction || member.reflectionLedMixer.clipAction(member.idleClip);
          member.reflectionLedIdleAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
          member.reflectionLedAction.crossFadeTo(member.reflectionLedIdleAction, 0.45, false);
        }
      } else if (member.action) {
        member.action.stop();
        member.model?.traverse((object) => {
          if (object.isSkinnedMesh && object.skeleton) object.skeleton.pose();
        });
      }
    }
    member.lastMovedDistance = 0;
    const yawToPlayer = Math.atan2(camera.position.x - member.group.position.x, camera.position.z - member.group.position.z);
    let bodyYaw = yawToPlayer; // welcome/follow stance: face the player
    if (member.greetStage === 'atBoard') {
      // Parked: body sits 45deg off the player toward the board (presenting it); head tracks me.
      const yawToBoard = Math.atan2(
        (member.greetBoardCenterX ?? member.group.position.x) - member.group.position.x,
        (member.greetBoardCenterZ ?? member.group.position.z) - member.group.position.z
      );
      const rel = Math.atan2(Math.sin(yawToBoard - yawToPlayer), Math.cos(yawToBoard - yawToPlayer));
      const stance = THREE.MathUtils.degToRad(greeterBoardStanceDeg);
      bodyYaw = yawToPlayer + Math.sign(rel || 1) * Math.min(stance, Math.abs(rel));
      // Proximity-gated bubble: the renderer eases opacity in/out over 0.5s as bubbleInRange flips.
      const distToPlayer = Math.hypot(camera.position.x - member.group.position.x, camera.position.z - member.group.position.z);
      member.bubbleText = inLingua(GREETER_BOARD_BUBBLE_TEXT);
      member.bubbleSizeScale = 2;
      member.bubbleProximity = true;
      member.bubbleInRange = distToPlayer <= greeterBoardBubbleRange;
    }
    member.group.rotation.y = lerpAngle(member.group.rotation.y, bodyYaw, Math.min(1, dt * 4));
    crowdRuntime.applyGreeterHeadLook(member, dt);
    return;
  }
  if (!isGreeter && !route?.points?.length) {
    member.lastMovedDistance = 0;
    return;
  }
  const current = member.group.position;
  let target;
  if (isGreeter) {
    if (member.greetStage === 'toBoard') {
      tronRunnerCrowdNextPointScratch.x = member.greetBoardAnchorX;
      tronRunnerCrowdNextPointScratch.z = member.greetBoardAnchorZ;
    } else {
      tronRunnerCrowdNextPointScratch.x = camera.position.x;
      tronRunnerCrowdNextPointScratch.z = camera.position.z;
    }
    target = tronRunnerCrowdNextPointScratch;
  } else {
    target = route.points[member.waypointIndex % route.points.length];
  }
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const distance = Math.hypot(dx, dz);
  if (isGreeter) {
    if (member.greetStage === 'toBoard') {
      if (distance <= greeterBoardReach) {
        member.greetStage = 'atBoard'; // re-pose to idle + 45deg stance next frame
        member.lastMovedDistance = 0;
        return;
      }
    } else if (distance <= greetDistance) {
      member.greetDone = true;       // keeps the welcome bubble showing
      member.greetStage = 'welcome';
      member.greetAt = now;
      crowdRuntime.setGreeterBubble(
        member,
        inLingua(TRON_RUNNER_WELCOME_BUBBLE_TEXT),
        greeterBubbleDurationMs,
        now,
        TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE
      );
      member.lastMovedDistance = 0;
      return;
    }
  } else if (distance <= crowdReachRadius) {
    member.waypointIndex = (member.waypointIndex + 1) % route.points.length;
    if (Math.random() < pauseChance) {
      const pauseMs = pauseMinMs + Math.random() * (pauseMaxMs - pauseMinMs);
      crowdRuntime.setState(member, 'pause', now, pauseMs);
    } else {
      crowdRuntime.setState(member, 'turn', now, turnDurationMs);
    }
    member.lastMovedDistance = 0;
    return;
  }
  const dirX = dx / Math.max(distance, 0.001);
  const dirZ = dz / Math.max(distance, 0.001);
  const stateSpeedScale = isGreeter ? 1 : (member.state === 'pause' ? 0 : member.state === 'turn' ? 0.56 : member.state === 'yield' ? 0.34 : 1);
  const baseStep = Math.max(0, member.speed * Math.min(dt, 0.08) * stateSpeedScale);
  const nextPoint = tronRunnerCrowdNextPointScratch;
  nextPoint.x = current.x + dirX * Math.min(distance, baseStep);
  nextPoint.z = current.z + dirZ * Math.min(distance, baseStep);
  let collided = false;
  if (!isGreeter) {
    // The greeter walks straight to the player at normal pace, ignoring crowd jostling.
    const avoidance = crowdRuntime.avoidance(member, current, nextPoint, dirX, dirZ, dt, now);
    if (avoidance.speedScale < 1) {
      nextPoint.x = current.x + dirX * Math.min(distance, baseStep * avoidance.speedScale);
      nextPoint.z = current.z + dirZ * Math.min(distance, baseStep * avoidance.speedScale);
    }
    nextPoint.x += avoidance.x;
    nextPoint.z += avoidance.z;
    collided = crowdRuntime.resolveCollision(member, nextPoint);
    if (collided) {
      member.collisionCount += 1;
      member.waypointIndex = (member.waypointIndex + 1) % route.points.length;
      crowdRuntime.setState(member, 'avoid', now, yieldDurationMs);
    }
    crowdRuntime.tryDeadlockNudge(member, current, nextPoint, dirX, dirZ, distance, collided, now);
  }
  const movedDistance = Math.hypot(nextPoint.x - current.x, nextPoint.z - current.z);
  const surface = surfaceYForPoint(nextPoint.x, nextPoint.z);
  member.group.position.set(nextPoint.x, surface.y, nextPoint.z);
  member.group.rotation.y = lerpAngle(member.group.rotation.y, Math.atan2(dirX, dirZ), Math.min(1, dt * 8));
  if (isGreeter) crowdRuntime.applyGreeterHeadLook(member, dt); // head keeps tracking the player while walking
  member.surface = surface.surface;
  member.groundOffset = member.group.position.y - surface.groundY;
  member.distanceWalked += movedDistance;
  member.lastMovedDistance = movedDistance;
  if (movedDistance > 0.0005) member.lastMovedAt = now;
  member.lastCollision = collided;
}

export function updateTronRunnerCrowdRuntime(state, dt) {
  if (!state.crowdEnabled) return;
  const crowdRuntime = state.runtime();
  const { crowd, crowdGroup, stats } = state;
  crowdRuntime.processBuildQueue();
  if (!crowd.length) return;
  crowdRuntime.syncVisibility();
  if (!crowdGroup.visible) {
    state.accumulatedDt = 0;
    return;
  }
  state.accumulatedDt = Math.min(
    state.maxAccumulatedDt,
    state.accumulatedDt + Math.min(dt, 0.05)
  );
  if (state.accumulatedDt < state.updateInterval) {
    stats.skippedFrameCount += 1;
    return;
  }
  const step = state.updateInterval;
  state.accumulatedDt = Math.max(0, state.accumulatedDt - state.updateInterval);
  const now = state.now();
  const thinkStarted = now;
  stats.frame += 1;
  stats.updateCount += 1;
  stats.lastStepDt = step;
  stats.avoidancePairs = 0;
  stats.maxAvoidanceOverlap = 0;
  crowdRuntime.updateCulling();
  crowdRuntime.updateReflectionBudget();
  for (const member of crowd) state.syncMemberMatrixUpdates(member);
  crowdRuntime.prepareSpatialGrid();
  const talkRangeSq = state.talkRange * state.talkRange;
  const talkRearmRangeSq = state.talkRearmRange * state.talkRearmRange;
  for (const member of crowd) {
    // The greeter always updates (even when off-screen) so it reliably walks over to greet the player.
    const isGreeterMember = member.index === state.greeterIndex;
    // Ambient chatter: each non-greeter says one of its lines when the player comes within range,
    // re-arming once the player steps away (hysteresis). Cycles through the member's lines.
    if (!isGreeterMember && member.talkLines?.length) {
      const talkDx = state.camera.position.x - member.group.position.x;
      const talkDz = state.camera.position.z - member.group.position.z;
      const talkDistSq = talkDx * talkDx + talkDz * talkDz;
      if (member.talkArmed && talkDistSq <= talkRangeSq) {
        member.talkText = member.talkLines[member.talkCycle % member.talkLines.length];
        member.talkCycle += 1;
        member.talkStart = now;
        member.talkUntil = now + state.talkDurationMs;
        member.talkArmed = false;
      } else if (!member.talkArmed && talkDistSq > talkRearmRangeSq) {
        member.talkArmed = true;
      }
    }
    // While running to the board the greeter's run clip is driven by its own fixed timescale,
    // so skip the crowd's walk-tuned timescale management and the distance-driven walk sync.
    const greeterRunning = isGreeterMember && member.greetStage === 'toBoard';
    const nextEffectiveAnimationSpeed = state.runnerState.effectiveAnimationSpeed * (member.animationScaleOffset ?? 1);
    if (!greeterRunning && member.action && Math.abs((member.lastEffectiveAnimationSpeed ?? -1) - nextEffectiveAnimationSpeed) > 0.0001) {
      member.action.setEffectiveTimeScale(nextEffectiveAnimationSpeed);
      member.reflectionAction?.setEffectiveTimeScale(nextEffectiveAnimationSpeed);
      member.reflectionLedAction?.setEffectiveTimeScale(nextEffectiveAnimationSpeed);
      member.lastEffectiveAnimationSpeed = nextEffectiveAnimationSpeed;
    }
    member.speed = state.getWalkSpeed() * state.crowdSpeedScale * (member.speedScaleOffset ?? 1)
      * (isGreeterMember ? state.greeterSpeedMultiplier : 1)
      * (greeterRunning ? state.greeterRunSpeedBoost : 1);
    const cullingHidden = state.cullingEnabled && member.cullingVisible === false && !isGreeterMember;
    member.lodStride = isGreeterMember
      ? 1
      : (cullingHidden
        ? state.culledLodStride
        : (state.intelligenceEnabled ? crowdRuntime.lodStride(member) : 1));
    member.lodDt = Math.min(cullingHidden ? 0.34 : 0.14, (member.lodDt || 0) + step);
    member.mixerDt = Math.min(0.14, (member.mixerDt || 0) + step);
    const shouldUpdate = member.lodStride <= 1 || ((stats.frame + member.index) % member.lodStride === 0);
    if (!shouldUpdate) {
      member.lastMovedDistance = 0;
      if (!cullingHidden) {
        crowdRuntime.updateReflection(member);
        state.syncMemberMatrixUpdates(member, true);
      }
      continue;
    }
    const distanceDrivenWalk = state.distanceDrivenWalkEnabled && Boolean(member.action) && !member.greetPosed;
    if (!cullingHidden && !distanceDrivenWalk) member.mixer?.update(member.mixerDt);
    if (!cullingHidden && member.dynamicReflectionBudgetActive && !distanceDrivenWalk) {
      member.reflectionMixer?.update(member.mixerDt);
      member.reflectionLedMixer?.update(member.mixerDt);
    }
    const moveSubsteps = Math.max(1, Math.ceil(member.lodDt / state.maxMoveSubstep));
    const moveSubstepDt = member.lodDt / moveSubsteps;
    const distanceBefore = member.distanceWalked || 0;
    for (let stepIndex = 0; stepIndex < moveSubsteps; stepIndex += 1) {
      advanceTronRunnerCrowdMemberRuntime(state.advanceState, member, moveSubstepDt, now);
    }
    const movedThisUpdate = Math.max(0, (member.distanceWalked || 0) - distanceBefore);
    member.lastMovedDistance = movedThisUpdate;
    if (cullingHidden) state.syncMemberMatrixUpdates(member, true);
    if (!cullingHidden && distanceDrivenWalk && !member.greetPosed) {
      if (greeterRunning) syncTronRunnerCrowdRunCycleToDistance(member, state.greeterRunCycleDistance);
      else syncTronRunnerCrowdWalkCycleToDistance(member, member.walkCycleDistance ?? undefined);
    }
    if (!cullingHidden) {
      crowdRuntime.updateReflection(member);
      state.syncMemberMatrixUpdates(member, true);
    }
    member.mixerDt = 0;
    member.lodDt = 0;
  }
  stats.lastThinkMs = state.now() - thinkStarted;
  stats.maxThinkMs = Math.max(
    stats.maxThinkMs,
    stats.lastThinkMs
  );
}

export function inspectTronRunnerCrowdRuntime(state) {
  const crowdRuntime = state.runtime();
  const runnerScale = Number(state.runnerWalker.scale.x.toFixed(4));
  const runnerTargetHeight = state.targetHeight * state.runnerWalker.scale.y;
  const runnerHeightFromRoad = state.runnerWalker.position.y - state.roadTopY();
  const now = state.now();
  const members = state.crowd.map((member) => {
    state.crowdBox.setFromObject(member.group);
    state.crowdBox.getSize(state.crowdSize);
    const buildingCollision = crowdRuntime.buildingCollisionDiagnostic(member);
    const heightFromRoad = member.group.position.y - state.roadTopY();
    const targetHeight = state.targetHeight * member.group.scale.y;
    const materialInspect = inspectTronRunnerMaterials(member.model);
    return {
      index: member.index + 1,
      localIndex: (member.localIndex ?? member.index) + 1,
      kind: member.kind ?? 'runner',
      source: member.source ?? 'soldier',
      visible: Boolean(state.crowdGroup.visible && member.group.visible),
      x: Number(member.group.position.x.toFixed(2)),
      y: Number(member.group.position.y.toFixed(2)),
      z: Number(member.group.position.z.toFixed(2)),
      scale: Number(member.group.scale.x.toFixed(4)),
      targetHeight: Number(targetHeight.toFixed(3)),
      heightFromRoad: Number(heightFromRoad.toFixed(3)),
      groundOffset: Number((member.groundOffset ?? state.groundOffset).toFixed(3)),
      surface: member.surface,
      routeMode: member.route?.mode ?? 'fallback-road',
      routeLabel: member.route?.label ?? 'fallback',
      routeCluster: member.route?.cluster ?? 'city',
      sideStreetId: member.route?.sideStreetId ?? '',
      sideStreetSide: member.route?.sideStreetSide ?? '',
      sideStreetLateralOrdinal: member.route?.sideStreetLateralOrdinal ?? null,
      sideStreetGroupIndex: member.route?.sideStreetGroupIndex ?? null,
      sideStreetGroupCount: member.route?.sideStreetGroupCount ?? null,
      startMode: member.startMode ?? 'unknown',
      colorPreset: member.colorPreset ?? 'current',
      colorName: member.colorName ?? 'current cyan',
      ...materialInspect,
      walkActionTime: Number((member.action?.time ?? 0).toFixed(3)),
      walkClipDuration: Number((member.action?.getClip?.()?.duration ?? 0).toFixed(3)),
      walkCycleOffset: Number((member.walkCycleOffset ?? 0).toFixed(3)),
      state: member.state ?? 'walk',
      greetStage: member.greetStage ?? '',
      bubbleText: member.bubbleText ?? '',
      lodStride: member.lodStride ?? 1,
      lodDistance: Number((member.lodDistance ?? 0).toFixed(1)),
      cullingVisible: Boolean(member.cullingVisible),
      cullingInFrustum: Boolean(member.cullingInFrustum),
      cullingReason: member.cullingReason ?? 'unknown',
      cullingDistance: Number((member.cullingDistance ?? 0).toFixed(1)),
      avoidanceNeighbors: member.avoidanceNeighbors ?? 0,
      avoidanceOverlap: Number((member.avoidanceOverlap ?? 0).toFixed(3)),
      stuckMs: member.stuckSince ? Number(Math.max(0, now - member.stuckSince).toFixed(0)) : 0,
      stuckEscapes: member.stuckEscapes ?? 0,
      buildingCollision: buildingCollision.colliding,
      buildingCollisionCorrection: Number(buildingCollision.correction.toFixed(3)),
      buildingCollisionLabel: buildingCollision.label,
      dynamicReflectionVisible: Boolean(member.dynamicReflectionVisible),
      dynamicReflectionMode: member.reflectionGroup?.userData?.tronRunnerReflectionMode ?? 'mesh-clone',
      dynamicReflectionBudgetActive: Boolean(member.dynamicReflectionBudgetActive),
      dynamicReflectionRank: member.dynamicReflectionRank ?? null,
      dynamicReflectionDistance: Number.isFinite(member.dynamicReflectionDistance)
        ? Number(member.dynamicReflectionDistance.toFixed(1))
        : null,
      dynamicReflectionOpacity: Number((member.dynamicReflectionOpacity ?? 0).toFixed(3)),
      dynamicReflectionBodyOpacity: Number((member.dynamicReflectionBodyOpacity ?? 0).toFixed(3)),
      dynamicReflectionLedOpacity: Number((member.dynamicReflectionLedOpacity ?? 0).toFixed(3)),
      dynamicReflectionMeshCount: member.dynamicReflectionMeshCount ?? 0,
      dynamicReflectionLedMeshCount: member.dynamicReflectionLedMeshCount ?? 0,
      waypointIndex: member.waypointIndex ?? 0,
      distanceWalked: Number((member.distanceWalked ?? 0).toFixed(2)),
      lastMovedDistance: Number((member.lastMovedDistance ?? 0).toFixed(4)),
      recentlyMoved: now - (member.lastMovedAt || 0) < 360,
      collisionCount: member.collisionCount ?? 0,
      lastCollision: Boolean(member.lastCollision),
      sizeY: Number(state.crowdSize.y.toFixed(3)),
    };
  });
  const scaleDeltas = members.map((member) => Math.abs(member.scale - runnerScale));
  const targetHeightDeltas = members.map((member) => Math.abs(member.targetHeight - runnerTargetHeight));
  const heightFromRoadDeltas = members.map((member) => Math.abs(member.heightFromRoad - runnerHeightFromRoad));
  const groundOffsetDeltas = members.map((member) => Math.abs(member.groundOffset - state.groundOffset));
  const stateCounts = countBy(members, (member) => member.state);
  const routeDistribution = countBy(members, (member) => member.routeMode || 'fallback-road');
  const lodStrideCounts = countBy(members, (member) => String(member.lodStride || 1));
  const colorCounts = countBy(members, (member) => member.colorPreset || 'current');
  const femaleMembers = members.filter((member) => member.kind === 'female');
  const femaleWhiteCount = femaleMembers.filter((member) => member.colorPreset === 'white').length;
  const sideStreetSummary = state.routes.secondaryStreetSummary(state.routes.candidateRecords());
  const sideStreetCoverage = buildSideStreetCoverage(sideStreetSummary.streets, members);
  const sideStreetGroupedSegments = buildSideStreetGroupedSegments(sideStreetCoverage);
  const materialMinOpacity = minBy(members, (member) => member.materialMinOpacity, 1);
  const materialMaxEmissiveIntensity = maxBy(members, (member) => member.materialMaxEmissiveIntensity, 0);
  const transparentMaterialCount = sumBy(members, (member) => member.transparentMaterialCount);
  return {
    enabled: state.crowdEnabled,
    mode: state.pathMode,
    count: state.crowd.length,
    visibleCount: members.filter((member) => member.visible).length,
    greeterFollowDelayMs: state.greeterFollowDelayMs,
    colorCounts,
    female: {
      enabled: Boolean(state.female?.enabled),
      modelUrl: state.female?.modelUrl ?? '',
      requestedCount: state.female?.requestedCount ?? 0,
      whiteRequestedCount: state.female?.whiteRequestedCount ?? 0,
      colorPlan: state.female?.colorPlan ?? [],
      loaded: Boolean(state.female?.loaded),
      queued: Boolean(state.female?.queued),
      count: femaleMembers.length,
      whiteCount: femaleWhiteCount,
      visibleCount: femaleMembers.filter((member) => member.visible).length,
      error: state.female?.error ?? '',
    },
    routeDistribution,
    sideStreetDetectedStreetCount: sideStreetSummary.streetCount,
    sideStreetDetectedLaneCount: sideStreetSummary.laneCount,
    sideStreetDetectedStreets: sideStreetSummary.streets,
    sideStreetCoverage,
    sideStreetGroupedSegments,
    materialMinOpacity: Number(materialMinOpacity.toFixed(3)),
    materialMaxEmissiveIntensity: Number(materialMaxEmissiveIntensity.toFixed(3)),
    crowdRevealMaterialOpacity: Number((state.runnerState.crowdRevealMaterialOpacity ?? 0).toFixed(3)),
    characterLedBrightnessMultiplier: state.getLedBrightness(),
    characterLedBloomBoost: state.getLedBloom(),
    characterLedScale: Number(tronRunnerCharacterLedScale({
      ledBrightness: state.getLedBrightness(),
      ledBloom: state.getLedBloom(),
    }).toFixed(3)),
    characterLedDefaultScale: Number(tronRunnerCharacterLedDefaultScale().toFixed(3)),
    characterLedEmissiveMax: Number((state.runnerState.ledEmissiveMax ?? state.characterLedEmissiveMax).toFixed(3)),
    transparentMaterialCount,
    sidewalkMembers: members.filter((member) => member.surface === 'sidewalk').length,
    routeLoopMembers: members.filter((member) => member.routeMode === state.pathMode).length,
    startClusterMembers: members.filter((member) => member.routeCluster === 'player-start').length,
    sideStreetLateralMembers: members.filter((member) => (
      member.routeMode === 'side-street-lateral' && Math.abs(member.x) > state.roadHalf()
    )).length,
    movingMembers: members.filter((member) => member.recentlyMoved).length,
    stuckMembers: members.filter((member) => member.stuckMs > state.deadlockMs).length,
    stuckEscapes: sumBy(members, (member) => member.stuckEscapes),
    collisionEnabled: state.collisionEnabled,
    collisionCount: sumBy(members, (member) => member.collisionCount),
    buildingCollisionMembers: members.filter((member) => member.buildingCollision).length,
    maxBuildingCollisionCorrection: Number(maxBy(members, (member) => member.buildingCollisionCorrection, 0).toFixed(3)),
    requestedCount: state.requestedCount,
    cloneSource: 'runner-post-fit-model',
    skeletonClone: Boolean(state.getCloneRunnerSkeleton()),
    sharedMaterial: true,
    dynamicReflections: {
      enabled: state.dynamicReflectionEnabled,
      mode: 'mesh-clone',
      maxActive: state.reflectionMaxActive,
      budgetLimit: state.stats.reflectionBudgetLimit,
      fpsBudgetLimit: state.stats.reflectionFpsBudgetLimit,
      nearDistance: state.reflectionNearDistance,
      minFps: state.reflectionMinFps,
      postRevealRamp: {
        enabled: state.reflectionPostRevealRampEnabled,
        active: state.stats.reflectionPostRevealRampActive,
        durationMs: state.reflectionPostRevealRampMs,
        elapsedMs: Number(state.stats.reflectionPostRevealElapsedMs.toFixed(1)),
        progress: Number(state.stats.reflectionPostRevealProgress.toFixed(3)),
        rampLimit: state.stats.reflectionPostRevealRampLimit,
      },
      distanceSkippedCount: state.stats.reflectionDistanceSkippedCount,
      budgetActiveCount: state.stats.activeReflectionCount,
      candidateCount: state.stats.reflectionCandidateCount,
      visibleCount: members.filter((member) => member.dynamicReflectionVisible).length,
      meshCount: sumBy(members, (member) => member.dynamicReflectionMeshCount || 0),
      ledMeshCount: sumBy(members, (member) => member.dynamicReflectionLedMeshCount || 0),
      maxOpacity: Number(maxBy(members, (member) => member.dynamicReflectionOpacity || 0, 0).toFixed(3)),
      bodyOpacity: Number(maxBy(members, (member) => member.dynamicReflectionBodyOpacity || 0, 0).toFixed(3)),
      ledOpacity: Number(maxBy(members, (member) => member.dynamicReflectionLedOpacity || 0, 0).toFixed(3)),
      yScale: state.reflectionYScale,
    },
    culling: {
      enabled: state.cullingEnabled,
      maxDistance: state.cullDistance,
      radius: state.cullRadius,
      culledLodStride: state.culledLodStride,
      visibleCount: state.stats.cullingVisibleCount,
      hiddenCount: state.stats.cullingHiddenCount,
      distanceHiddenCount: state.stats.cullingDistanceHiddenCount,
      frustumHiddenCount: state.stats.cullingFrustumHiddenCount,
      minDistance: Number(state.stats.cullingMinDistance.toFixed(1)),
      maxObservedDistance: Number(state.stats.cullingMaxDistance.toFixed(1)),
    },
    build: {
      status: state.buildStats.status,
      built: state.buildStats.built,
      requested: state.buildStats.requested,
      progress: Number((state.buildStats.built / Math.max(1, state.buildStats.requested)).toFixed(3)),
      durationMs: Number(state.buildStats.durationMs.toFixed(2)),
      lastChunkMs: Number(state.buildStats.lastChunkMs.toFixed(2)),
      queued: Boolean(state.buildQueueState.job || state.buildQueueState.queue?.length),
      queueLength: state.buildQueueState.queue?.length ?? 0,
    },
    intelligence: {
      enabled: state.intelligenceEnabled,
      mode: 'waypoint-state-machine',
      avoidanceEnabled: state.avoidanceEnabled,
      avoidanceRadius: state.avoidanceRadius,
      avoidancePairs: state.stats.avoidancePairs,
      maxAvoidanceOverlap: Number(state.stats.maxAvoidanceOverlap.toFixed(3)),
      spatialGridCell: state.spatialCell,
      gridCells: state.stats.gridCells,
      lodEnabled: state.intelligenceEnabled,
      distanceReuseEnabled: state.distanceCacheEnabled,
      distanceCalculations: state.stats.distanceCalculations,
      distanceReuses: state.stats.distanceReuses,
      lodNearDistance: state.lodNearDistance,
      lodMidDistance: state.lodMidDistance,
      lodStrideCounts,
      targetFps: state.targetFps,
      updateIntervalMs: Number((state.updateInterval * 1000).toFixed(2)),
      updateCount: state.stats.updateCount,
      skippedFrameCount: state.stats.skippedFrameCount,
      performanceFreezeFrameCount: state.stats.performanceFreezeFrameCount,
      lastStepMs: Number((state.stats.lastStepDt * 1000).toFixed(2)),
      stateCounts,
      lastThinkMs: Number(state.stats.lastThinkMs.toFixed(3)),
      maxThinkMs: Number(state.stats.maxThinkMs.toFixed(3)),
    },
    scaleLock: state.scaleLock,
    sourceScale: runnerScale,
    sourceTargetHeight: Number(runnerTargetHeight.toFixed(3)),
    sourceHeightFromRoad: Number(runnerHeightFromRoad.toFixed(3)),
    maxScaleDelta: Number((scaleDeltas.length ? Math.max(...scaleDeltas) : 0).toFixed(4)),
    maxTargetHeightDelta: Number((targetHeightDeltas.length ? Math.max(...targetHeightDeltas) : 0).toFixed(4)),
    maxHeightFromRoadDelta: Number((heightFromRoadDeltas.length ? Math.max(...heightFromRoadDeltas) : 0).toFixed(4)),
    maxGroundOffsetDelta: Number((groundOffsetDeltas.length ? Math.max(...groundOffsetDeltas) : 0).toFixed(4)),
    members,
  };
}

// Era 1000: la folla restava nascosta un secondo dopo la fine della rivelazione della
// citta'. Ma il rez dei personaggi parte proprio li', dura 1400ms, e cosi' i primi mille
// erano invisibili: comparivano gia' formati per tre quarti, cioe' un popup (2026-09-18).
// L'attesa non e' sparita, si e' spostata in runner-reveal.js: il gruppo si accende quando
// il rez comincia, non un secondo dopo.
const TRON_RUNNER_CROWD_APPEAR_DELAY_MS = 0;

export function syncTronRunnerCrowdVisibilityState({
  crowd,
  group,
  state,
  crowdEnabled,
  cullingEnabled,
  getVisibleFactor,
  revealVisible,
  isRunnerReady,
  now,
  updateReflection,
  syncMemberMatrixUpdates,
}) {
  const visibleFactor = getVisibleFactor();
  const revealIsVisible = revealVisible(visibleFactor);
  const wouldShow = Boolean(crowdEnabled && revealIsVisible && isRunnerReady());
  if (!wouldShow) state.appearArmedAt = 0;
  else if (!state.appearArmedAt) state.appearArmedAt = now();
  const visible = wouldShow && (now() - state.appearArmedAt >= TRON_RUNNER_CROWD_APPEAR_DELAY_MS);
  const changed = group.visible !== visible;
  group.visible = visible;
  for (const member of crowd) {
    member.baseVisible = visible;
    if (!visible) {
      const memberChanged = member.group.visible !== false;
      member.group.visible = false;
      member.cullingVisible = false;
      member.cullingReason = 'group-hidden';
      if (changed || memberChanged) updateReflection(member);
      syncMemberMatrixUpdates(member, true);
      continue;
    }
    if (!cullingEnabled) {
      const memberChanged = member.group.visible !== true;
      member.group.visible = true;
      member.cullingVisible = true;
      member.cullingReason = 'visible';
      if (changed || memberChanged) updateReflection(member);
      syncMemberMatrixUpdates(member, true);
    }
  }
}

export function updateTronRunnerCrowdCullingRuntime({
  crowd,
  group,
  cullingEnabled,
  camera,
  stats,
  cullMatrix,
  cullFrustum,
  cullSphere,
  targetHeight,
  cullRadius,
  cullDistance,
  updateReflection,
}) {
  updateTronRunnerCrowdCullingState({
    crowd,
    groupVisible: group.visible,
    cullingEnabled,
    camera,
    stats,
    cullMatrix,
    cullFrustum,
    cullSphere,
    targetHeight,
    cullRadius,
    cullDistance,
    updateReflection,
  });
}

export function prepareTronRunnerCrowdSpatialGridRuntime({
  spatialGrid,
  crowd,
  stats,
  cullingEnabled,
  lodNearDistance,
  gridCoord,
  gridKey,
}) {
  prepareTronRunnerCrowdSpatialGrid(
    spatialGrid,
    crowd,
    stats,
    cullingEnabled,
    lodNearDistance,
    gridCoord,
    gridKey,
  );
}

export function nearbyTronRunnerCrowdMembersRuntime({
  spatialGrid,
  gridCoord,
  gridKey,
}, x, z) {
  return nearbyTronRunnerCrowdMembers(x, z, spatialGrid, gridCoord, gridKey);
}

export function tronRunnerCrowdLodStrideRuntime({
  distanceToCamera,
  nearDistance,
  midDistance,
}, member) {
  const distance = distanceToCamera(member);
  member.lodDistance = distance;
  return tronRunnerCrowdLodStrideCore(distance, nearDistance, midDistance);
}

// Reused argument objects: these wrappers run once (or more) per member per
// crowd tick at 45Hz, so a fresh options literal per call was thousands of
// short-lived objects a second in the nursery. Both cores read the object
// synchronously and keep no reference to it.
const tronRunnerCrowdDistanceArgs = {
  member: null,
  cameraPosition: null,
  stats: null,
  frame: 0,
  distanceCacheEnabled: false,
};

export function tronRunnerCrowdDistanceToCameraRuntime({
  camera,
  stats,
  distanceCacheEnabled,
}, member) {
  const args = tronRunnerCrowdDistanceArgs;
  args.member = member;
  args.cameraPosition = camera.position;
  args.stats = stats;
  args.frame = stats.frame;
  args.distanceCacheEnabled = distanceCacheEnabled;
  return tronRunnerCrowdDistanceToCameraCore(args);
}

export function setTronRunnerCrowdStateRuntime(member, state, now, durationMs = 0) {
  member.state = state;
  member.stateUntil = durationMs > 0 ? now + durationMs : 0;
}

export function normalizeTronRunnerCrowdStateRuntime({
  intelligenceEnabled,
}, member, now) {
  if (!intelligenceEnabled) {
    member.state = 'walk';
    member.stateUntil = 0;
    return;
  }
  if (!member.state) member.state = 'walk';
  if (member.stateUntil && now >= member.stateUntil) {
    member.state = 'walk';
    member.stateUntil = 0;
  }
}

const tronRunnerCrowdPointInsideRouteArgs = {
  member: null,
  x: 0,
  z: 0,
  pointInPolygon: null,
};

export function tronRunnerCrowdPointInsideRouteRuntime({
  pointInPolygon,
}, member, x, z) {
  const args = tronRunnerCrowdPointInsideRouteArgs;
  args.member = member;
  args.x = x;
  args.z = z;
  args.pointInPolygon = pointInPolygon;
  return tronRunnerCrowdPointInsideRouteCore(args);
}

export function resolveTronRunnerCrowdCollisionRuntime({
  collisionsEnabled,
  getColliderRecords,
  buildingGuard,
  pointInsideRoute,
}, member, point) {
  return resolveTronRunnerCrowdCollisionCore(
    member,
    point,
    collisionsEnabled,
    getColliderRecords,
    buildingGuard,
    pointInsideRoute,
  );
}

export function tronRunnerCrowdBuildingCollisionDiagnosticRuntime({
  getColliderRecords,
  padding,
}, member) {
  return tronRunnerCrowdBuildingCollisionDiagnosticCore({
    member,
    records: getColliderRecords(),
    padding,
    resolveRoundedCollider: resolveTronRunnerRoundedCollider,
    colliderLabel: tronRunnerCrowdColliderLabel,
  });
}

export function tronRunnerCrowdAvoidanceRuntime(
  deps,
  member,
  current,
  nextPoint,
  dirX,
  dirZ,
  dt,
  now,
) {
  return tronRunnerCrowdAvoidanceCore(member, current, nextPoint, dirX, dirZ, dt, now, deps);
}

export function tronRunnerCrowdTryDeadlockNudgeRuntime(
  deps,
  member,
  current,
  nextPoint,
  dirX,
  dirZ,
  distance,
  collided,
  now,
) {
  return tronRunnerCrowdTryDeadlockNudgeCore(member, current, nextPoint, dirX, dirZ, distance, collided, now, deps);
}

export function tronRunnerCrowdPostRevealReflectionRampLimitRuntime({
  stats,
  rampEnabled,
  rampMs,
  cityRevealWireframeEnabled,
  getCityRevealComplete,
  getCityRevealCompletedAt,
  postRevealElapsedMs,
}, maxLimit, now = performance.now()) {
  return tronRunnerCrowdPostRevealReflectionRampLimitCore({
    maxLimit,
    now,
    stats,
    rampEnabled,
    rampMs,
    cityRevealWireframeEnabled,
    cityRevealComplete: getCityRevealComplete(),
    cityRevealCompletedAt: getCityRevealCompletedAt(),
    postRevealElapsedMs,
  });
}

export function updateTronRunnerCrowdReflectionBudgetRuntime({
  stats,
  crowd,
  crowdGroup,
  reflectionCandidates,
  dynamicReflectionEnabled,
  getCrowdReflectionsIsolation,
  reflectionRevealEnabled,
  reflectionMaxActive,
  reflectionMinFps,
  reflectionNearDistance,
  getLatestMeasuredFps,
  getCityRevealComplete,
  postRevealElapsedMs,
  isCityRevealPerformanceCritical,
  distanceToCamera,
  rampLimit,
}) {
  updateTronRunnerCrowdReflectionBudgetCore({
    stats,
    crowd,
    crowdGroup,
    reflectionCandidates,
    dynamicReflectionEnabled,
    crowdReflectionsIsolation: getCrowdReflectionsIsolation(),
    reflectionRevealEnabled,
    reflectionMaxActive,
    reflectionMinFps,
    reflectionNearDistance,
    latestMeasuredFps: getLatestMeasuredFps(),
    cityRevealComplete: getCityRevealComplete(),
    postRevealElapsedMs,
    isCityRevealPerformanceCritical,
    distanceToCamera,
    rampLimit,
  });
}

export function createTronRunnerCrowdRuntime({
  crowd,
  group,
  camera,
  playerCollisionDistance,
  isCameraCollisionDisabled,
  buildImpl,
  updateImpl,
  inspectImpl,
  processBuildQueueImpl,
  drainBuildQueueImpl,
  resolveGreeterBoardAnchorImpl,
  startGreeterWalkingToBoardImpl,
  applyGreeterHeadLookImpl,
  setGreeterBubbleImpl,
  updateReflectionImpl,
  syncScaleAndGroundImpl,
  syncVisibilityImpl,
  updateCullingImpl,
  gridCoordImpl,
  postRevealElapsedMsImpl,
  colliderRecordsImpl,
  invalidateColliderRecordsImpl,
  prepareSpatialGridImpl,
  nearbyMembersImpl,
  lodStrideImpl,
  distanceToCameraImpl,
  setStateImpl,
  normalizeStateImpl,
  pointInsideRouteImpl,
  resolveCollisionImpl,
  buildingCollisionDiagnosticImpl,
  avoidanceImpl,
  tryDeadlockNudgeImpl,
  reflectionRampLimitImpl,
  updateReflectionBudgetImpl,
}) {
  function resolveCameraCollision() {
    if (isCameraCollisionDisabled()) return;
    if (!group.visible || !crowd.length) return;
    const minDist = playerCollisionDistance;
    const minDistSq = minDist * minDist;
    const px = camera.position.x;
    const pz = camera.position.z;
    for (const member of crowd) {
      const pos = member.group.position;
      const dx = px - pos.x;
      const dz = pz - pos.z;
      const distSq = dx * dx + dz * dz;
      if (distSq >= minDistSq) continue;
      if (distSq < 1e-6) {
        camera.position.x += minDist;
        continue;
      }
      const dist = Math.sqrt(distSq);
      const push = (minDist - dist) / dist;
      camera.position.x += dx * push;
      camera.position.z += dz * push;
    }
  }

  return {
    crowd,
    group,
    build: buildImpl,
    update: updateImpl,
    inspect: inspectImpl,
    processBuildQueue: processBuildQueueImpl,
    drainBuildQueue: drainBuildQueueImpl,
    resolveGreeterBoardAnchor: resolveGreeterBoardAnchorImpl,
    startGreeterWalkingToBoard: startGreeterWalkingToBoardImpl,
    applyGreeterHeadLook: applyGreeterHeadLookImpl,
    setGreeterBubble: setGreeterBubbleImpl,
    updateReflection: updateReflectionImpl,
    syncScaleAndGround: syncScaleAndGroundImpl,
    syncVisibility: syncVisibilityImpl,
    updateCulling: updateCullingImpl,
    gridCoord: gridCoordImpl,
    postRevealElapsedMs: postRevealElapsedMsImpl,
    colliderRecords: colliderRecordsImpl,
    invalidateColliderRecords: invalidateColliderRecordsImpl,
    prepareSpatialGrid: prepareSpatialGridImpl,
    nearbyMembers: nearbyMembersImpl,
    lodStride: lodStrideImpl,
    distanceToCamera: distanceToCameraImpl,
    setState: setStateImpl,
    normalizeState: normalizeStateImpl,
    pointInsideRoute: pointInsideRouteImpl,
    resolveCollision: resolveCollisionImpl,
    buildingCollisionDiagnostic: buildingCollisionDiagnosticImpl,
    avoidance: avoidanceImpl,
    tryDeadlockNudge: tryDeadlockNudgeImpl,
    reflectionRampLimit: reflectionRampLimitImpl,
    updateReflectionBudget: updateReflectionBudgetImpl,
    resolveCameraCollision,
  };
}
