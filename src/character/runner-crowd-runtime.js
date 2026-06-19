import {
  nearbyTronRunnerCrowdMembers,
  prepareTronRunnerCrowdSpatialGrid,
  tronRunnerCrowdAvoidance as tronRunnerCrowdAvoidanceCore,
  tronRunnerCrowdDistanceToCamera as tronRunnerCrowdDistanceToCameraCore,
  tronRunnerCrowdLodStride as tronRunnerCrowdLodStrideCore,
  tronRunnerCrowdTryDeadlockNudge as tronRunnerCrowdTryDeadlockNudgeCore,
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
  applyTronRunnerCrowdReflectionState,
  tronRunnerCrowdPostRevealReflectionRampLimit as tronRunnerCrowdPostRevealReflectionRampLimitCore,
  tronRunnerCrowdReflectionOccludedByBuilding,
  updateTronRunnerCrowdReflectionBudget as updateTronRunnerCrowdReflectionBudgetCore,
} from './character-reflections.js';
import {
  tronRunnerCrowdGridCoord as tronRunnerCrowdGridCoordCore,
} from './character-movement.js';

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

export function startTronRunnerCrowdBuildQueueRuntime(state, sourceModel, animations) {
  state.job = null;
  state.clearState();
  if (!state.crowdEnabled || !sourceModel || !state.getCloneRunnerSkeleton()) return;
  const sourceMeshes = [];
  sourceModel.traverse((obj) => {
    if (obj.isMesh) sourceMeshes.push(obj);
  });
  state.job = {
    sourceModel,
    sourceMeshes,
    animations,
    nextIndex: 0,
    startedAt: state.now(),
  };
  state.buildStats.status = 'queued';
  state.buildStats.startedAt = state.job.startedAt;
  state.buildStats.built = 0;
  state.buildStats.requested = state.requestedCount;
}

export function processTronRunnerCrowdBuildQueueRuntime(state) {
  if (!state.job) return;
  const job = state.job;
  const started = state.now();
  state.buildStats.status = 'building';
  state.buildMember(job, job.nextIndex);
  job.nextIndex += 1;
  state.buildStats.built = job.nextIndex;
  state.buildStats.lastChunkMs = state.now() - started;
  if (job.nextIndex < state.requestedCount) return;
  state.syncScaleAndGround();
  state.syncVisibility();
  state.buildStats.status = 'done';
  state.buildStats.durationMs = state.now() - job.startedAt;
  state.job = null;
}

export async function drainTronRunnerCrowdBuildQueueRuntime(state) {
  while (state.job) {
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
  applyTronRunnerCrowdReflectionState({
    member,
    group,
    bodyMaterials,
    ledMaterials,
    visible,
    bodyOpacity,
    ledOpacity,
    reflectionY,
    reflectionYScale,
  });
}

const TRON_RUNNER_CROWD_APPEAR_DELAY_MS = 1000;

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

export function tronRunnerCrowdDistanceToCameraRuntime({
  camera,
  stats,
  distanceCacheEnabled,
}, member) {
  return tronRunnerCrowdDistanceToCameraCore({
    member,
    cameraPosition: camera.position,
    stats,
    frame: stats.frame,
    distanceCacheEnabled,
  });
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

export function tronRunnerCrowdPointInsideRouteRuntime({
  pointInPolygon,
}, member, x, z) {
  return tronRunnerCrowdPointInsideRouteCore({
    member,
    x,
    z,
    pointInPolygon,
  });
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
