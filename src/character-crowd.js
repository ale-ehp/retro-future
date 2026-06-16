export function setTronRunnerCrowdFrameDistance(member, distance, frame) {
  member.cullingDistance = distance;
  member.lodDistance = distance;
  member.cullingDistanceFrame = frame;
}

export function tronRunnerCrowdDistanceToCamera({
  member,
  cameraPosition,
  stats,
  frame,
  distanceCacheEnabled,
}) {
  if (
    distanceCacheEnabled &&
    member.cullingDistanceFrame === frame &&
    Number.isFinite(member.cullingDistance)
  ) {
    stats.distanceReuses += 1;
    return member.cullingDistance;
  }
  const distance = cameraPosition.distanceTo(member.group.position);
  stats.distanceCalculations += 1;
  setTronRunnerCrowdFrameDistance(member, distance, frame);
  return distance;
}

export function tronRunnerCrowdLodStride(distance, nearDistance, midDistance) {
  if (distance <= nearDistance) return 1;
  if (distance <= midDistance) return 2;
  return 4;
}

export function tronRunnerCrowdWalkCycleOffset(index) {
  return ((index * 0.173) % 1 + 1) % 1;
}

export function resetTronRunnerCrowdCullingStats(stats) {
  stats.cullingVisibleCount = 0;
  stats.cullingHiddenCount = 0;
  stats.cullingDistanceHiddenCount = 0;
  stats.cullingFrustumHiddenCount = 0;
  stats.cullingMinDistance = 0;
  stats.cullingMaxDistance = 0;
  stats.distanceCalculations = 0;
  stats.distanceReuses = 0;
}

export function updateTronRunnerCrowdCullingState({
  crowd,
  groupVisible,
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
  resetTronRunnerCrowdCullingStats(stats);
  if (!groupVisible || !crowd.length) return;

  if (!cullingEnabled) {
    stats.cullingVisibleCount = crowd.length;
    for (const member of crowd) {
      const distance = camera.position.distanceTo(member.group.position);
      stats.distanceCalculations += 1;
      setTronRunnerCrowdFrameDistance(member, distance, stats.frame);
      member.cullingInFrustum = true;
      member.cullingVisible = true;
      member.cullingReason = 'visible';
      if (!member.group.visible) {
        member.group.visible = true;
        updateReflection(member);
      }
    }
    return;
  }

  camera.updateMatrixWorld();
  cullMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  cullFrustum.setFromProjectionMatrix(cullMatrix);

  let minDistance = Number.POSITIVE_INFINITY;
  let maxDistance = 0;
  for (const member of crowd) {
    const distance = camera.position.distanceTo(member.group.position);
    stats.distanceCalculations += 1;
    minDistance = Math.min(minDistance, distance);
    maxDistance = Math.max(maxDistance, distance);
    cullSphere.center.copy(member.group.position);
    cullSphere.center.y += targetHeight * member.group.scale.y * 0.5;
    cullSphere.radius = cullRadius;
    const inDistance = distance <= cullDistance;
    const inFrustum = cullFrustum.intersectsSphere(cullSphere);
    const visible = Boolean(member.baseVisible && inDistance && inFrustum);
    setTronRunnerCrowdFrameDistance(member, distance, stats.frame);
    member.cullingInFrustum = inFrustum;
    member.cullingVisible = visible;
    member.cullingReason = visible ? 'visible' : (!inDistance ? 'distance' : 'frustum');
    if (visible) {
      stats.cullingVisibleCount += 1;
    } else {
      stats.cullingHiddenCount += 1;
      if (!inDistance) stats.cullingDistanceHiddenCount += 1;
      if (inDistance && !inFrustum) stats.cullingFrustumHiddenCount += 1;
    }
    if (member.group.visible !== visible) {
      member.group.visible = visible;
      updateReflection(member);
    }
  }
  stats.cullingMinDistance = Number.isFinite(minDistance) ? minDistance : 0;
  stats.cullingMaxDistance = maxDistance;
}
