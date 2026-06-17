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

export function prepareTronRunnerCrowdSpatialGrid(spatialGrid, crowd, stats, cullingEnabled, lodNearDistance, gridCoord, gridKey) {
  spatialGrid.clear();
  for (const member of crowd) {
    if (cullingEnabled && member.cullingVisible === false && member.cullingDistance > lodNearDistance) {
      continue;
    }
    const cx = gridCoord(member.group.position.x);
    const cz = gridCoord(member.group.position.z);
    const key = gridKey(cx, cz);
    let bucket = spatialGrid.get(key);
    if (!bucket) {
      bucket = [];
      spatialGrid.set(key, bucket);
    }
    bucket.push(member);
  }
  stats.gridCells = spatialGrid.size;
}

const nearbyTronRunnerCrowdMembersScratch = [];
export function nearbyTronRunnerCrowdMembers(x, z, spatialGrid, gridCoord, gridKey) {
  const cx = gridCoord(x);
  const cz = gridCoord(z);
  // Reused scratch: the single caller (tronRunnerCrowdAvoidance) iterates the result
  // fully before the next call, and the scan is not reentrant.
  const members = nearbyTronRunnerCrowdMembersScratch;
  members.length = 0;
  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const bucket = spatialGrid.get(gridKey(cx + dx, cz + dz));
      if (bucket) {
        for (const member of bucket) members.push(member);
      }
    }
  }
  return members;
}

const tronRunnerCrowdAvoidanceResult = { x: 0, z: 0, speedScale: 1 };
export function tronRunnerCrowdAvoidance(member, current, nextPoint, dirX, dirZ, dt, now, deps) {
  const {
    intelligenceEnabled,
    avoidanceEnabled,
    radius,
    passingPush,
    strength,
    yieldDurationMs,
    stats,
    nearbyMembers,
    setState,
    playerAvoidanceEnabled,
    playerRadius,
    playerStrength,
    playerObject,
  } = deps;
  member.avoidanceNeighbors = 0;
  member.avoidanceOverlap = 0;
  const result = tronRunnerCrowdAvoidanceResult;
  if (!intelligenceEnabled || !avoidanceEnabled) {
    result.x = 0;
    result.z = 0;
    result.speedScale = 1;
    return result;
  }
  let pushX = 0;
  let pushZ = 0;
  let speedScale = 1;
  const radiusSq = radius * radius;
  const nearby = nearbyMembers(nextPoint.x, nextPoint.z);
  for (const other of nearby) {
    if (other === member) continue;
    const dx = nextPoint.x - other.group.position.x;
    const dz = nextPoint.z - other.group.position.z;
    const distSq = dx * dx + dz * dz;
    if (distSq <= 0.0001 || distSq >= radiusSq) continue;
    const dist = Math.sqrt(distSq);
    const overlap = radius - dist;
    const weight = overlap / radius;
    pushX += dx / dist * weight;
    pushZ += dz / dist * weight;
    member.avoidanceNeighbors += 1;
    member.avoidanceOverlap = Math.max(member.avoidanceOverlap, overlap);
    stats.avoidancePairs += 1;
    stats.maxAvoidanceOverlap = Math.max(stats.maxAvoidanceOverlap, overlap);

    const otherDx = other.group.position.x - current.x;
    const otherDz = other.group.position.z - current.z;
    const ahead = otherDx * dirX + otherDz * dirZ;
    const side = Math.abs(otherDx * -dirZ + otherDz * dirX);
    if (ahead > 0 && ahead < radius * 1.25 && side < radius * 0.7) {
      const memberHasPriority = (member.index ?? 0) <= (other.index ?? 0);
      const passSign = (member.index ?? 0) % 2 === 0 ? 1 : -1;
      const passWeight = 1 - side / Math.max(0.001, radius * 0.7);
      if (memberHasPriority) {
        speedScale = Math.min(speedScale, 0.82);
        pushX += -dirZ * passSign * passWeight * passingPush;
        pushZ += dirX * passSign * passWeight * passingPush;
      } else {
        speedScale = Math.min(speedScale, 0.18);
        pushX += dirZ * passSign * passWeight * passingPush * 0.45;
        pushZ += -dirX * passSign * passWeight * passingPush * 0.45;
        setState(member, 'yield', now, yieldDurationMs);
      }
    }
  }
  result.x = pushX * strength * dt;
  result.z = pushZ * strength * dt;
  // The player is a single repulsor: when they invade a member's personal space the
  // member steps aside (radial push away) and hesitates, so it reads as giving way
  // rather than moonwalking through the player. Collision clamp keeps it on-route.
  if (playerAvoidanceEnabled && playerObject) {
    const pdx = nextPoint.x - playerObject.position.x;
    const pdz = nextPoint.z - playerObject.position.z;
    const pDistSq = pdx * pdx + pdz * pdz;
    const pRadiusSq = playerRadius * playerRadius;
    if (pDistSq > 0.0001 && pDistSq < pRadiusSq) {
      const pDist = Math.sqrt(pDistSq);
      const pWeight = (playerRadius - pDist) / playerRadius;
      result.x += pdx / pDist * pWeight * playerStrength * dt;
      result.z += pdz / pDist * pWeight * playerStrength * dt;
      speedScale = Math.min(speedScale, 0.6);
      member.avoidanceOverlap = Math.max(member.avoidanceOverlap, playerRadius - pDist);
    }
  }
  result.speedScale = speedScale;
  return result;
}

export function tronRunnerCrowdTryDeadlockNudge(member, current, nextPoint, dirX, dirZ, distance, collided, now, deps) {
  const {
    reachRadius,
    deadlockMoveEps,
    deadlockMs,
    deadlockNudge,
    yieldDurationMs,
    pointInsideRoute,
    resolveCollision,
    setState,
  } = deps;
  const movedDistance = Math.hypot(nextPoint.x - current.x, nextPoint.z - current.z);
  const blocked = distance > reachRadius * 2.5
    && movedDistance < deadlockMoveEps
    && (collided || member.avoidanceNeighbors > 0 || member.state === 'yield' || member.state === 'avoid');
  if (!blocked) {
    member.stuckSince = 0;
    return false;
  }
  if (!member.stuckSince) {
    member.stuckSince = now;
    return false;
  }
  if (now - member.stuckSince < deadlockMs) return false;

  const preferredSide = (member.index ?? 0) % 2 === 0 ? 1 : -1;
  const sideOptions = [preferredSide, -preferredSide];
  for (const sideSign of sideOptions) {
    const candidate = {
      x: current.x - dirZ * sideSign * deadlockNudge,
      z: current.z + dirX * sideSign * deadlockNudge,
    };
    if (!pointInsideRoute(member, candidate.x, candidate.z)) continue;
    resolveCollision(member, candidate);
    const nudgeDistance = Math.hypot(candidate.x - current.x, candidate.z - current.z);
    if (nudgeDistance <= deadlockMoveEps) continue;
    nextPoint.x = candidate.x;
    nextPoint.z = candidate.z;
    member.stuckSince = 0;
    member.stuckEscapes = (member.stuckEscapes || 0) + 1;
    member.waypointIndex = (member.waypointIndex + 1) % member.route.points.length;
    setState(member, 'avoid', now, yieldDurationMs);
    return true;
  }

  member.stuckSince = 0;
  member.stuckEscapes = (member.stuckEscapes || 0) + 1;
  member.waypointIndex = (member.waypointIndex + 1) % member.route.points.length;
  setState(member, 'avoid', now, yieldDurationMs);
  return false;
}
