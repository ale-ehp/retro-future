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
    resolveCameraCollision,
  };
}
