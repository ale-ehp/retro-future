import {
  nearbyTronRunnerCrowdMembers,
  prepareTronRunnerCrowdSpatialGrid,
  tronRunnerCrowdLodStride as tronRunnerCrowdLodStrideCore,
  updateTronRunnerCrowdCullingState,
} from './character-crowd.js';

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

export function createTronRunnerCrowdRuntime({
  crowd,
  group,
  camera,
  playerCollisionDistance,
  isCameraCollisionDisabled,
  buildImpl,
  updateImpl,
  inspectImpl,
  syncScaleAndGroundImpl,
  syncVisibilityImpl,
  updateCullingImpl,
  prepareSpatialGridImpl,
  nearbyMembersImpl,
  lodStrideImpl,
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
    syncScaleAndGround: syncScaleAndGroundImpl,
    syncVisibility: syncVisibilityImpl,
    updateCulling: updateCullingImpl,
    prepareSpatialGrid: prepareSpatialGridImpl,
    nearbyMembers: nearbyMembersImpl,
    lodStride: lodStrideImpl,
    resolveCameraCollision,
  };
}
