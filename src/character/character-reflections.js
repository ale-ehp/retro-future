import * as THREE from 'three';

export function emptyTronRunnerCrowdReflection() {
  return {
    group: null,
    model: null,
    ledModel: null,
    mixer: null,
    ledMixer: null,
    action: null,
    ledAction: null,
    materials: [],
    bodyMaterials: [],
    ledMaterials: [],
    meshCount: 0,
    ledMeshCount: 0,
  };
}

export function applyTronRunnerCrowdReflectionState({
  member,
  group,
  bodyMaterials,
  ledMaterials,
  visible,
  bodyOpacity,
  ledOpacity,
  reflectionY,
  reflectionYScale,
}) {
  if (group) {
    group.visible = visible;
    group.position.y = reflectionY;
    group.scale.set(1, -reflectionYScale, 1);
  }
  for (const material of bodyMaterials) {
    material.userData.tronRunnerBaseOpacity = bodyOpacity;
    if (Math.abs((material.opacity ?? 0) - bodyOpacity) > 0.002) {
      material.opacity = bodyOpacity;
      material.needsUpdate = true;
    }
  }
  for (const material of ledMaterials) {
    material.userData.tronRunnerBaseOpacity = ledOpacity;
    if (Math.abs((material.opacity ?? 0) - ledOpacity) > 0.002) {
      material.opacity = ledOpacity;
      material.needsUpdate = true;
    }
  }
  member.dynamicReflectionVisible = visible;
  member.dynamicReflectionOpacity = bodyOpacity;
  member.dynamicReflectionBodyOpacity = bodyOpacity;
  member.dynamicReflectionLedOpacity = ledOpacity;
}

export function tronRunnerCrowdPostRevealReflectionRampLimit({
  maxLimit,
  now,
  stats,
  rampEnabled,
  rampMs,
  cityRevealWireframeEnabled,
  cityRevealComplete,
  cityRevealCompletedAt,
  postRevealElapsedMs,
}) {
  const safeMax = Math.max(0, Math.round(maxLimit));
  stats.reflectionPostRevealRampLimit = safeMax;
  stats.reflectionPostRevealRampActive = false;
  stats.reflectionPostRevealElapsedMs = postRevealElapsedMs(now);
  stats.reflectionPostRevealProgress = 1;
  if (
    !rampEnabled ||
    !cityRevealWireframeEnabled ||
    !cityRevealComplete ||
    !cityRevealCompletedAt ||
    safeMax <= 0
  ) {
    return safeMax;
  }
  const duration = Math.max(1, rampMs);
  const elapsed = stats.reflectionPostRevealElapsedMs;
  const progress = THREE.MathUtils.clamp(elapsed / duration, 0, 1);
  const rampLimit = Math.min(safeMax, Math.floor(progress * (safeMax + 1)));
  stats.reflectionPostRevealRampLimit = rampLimit;
  stats.reflectionPostRevealRampActive = progress < 1;
  stats.reflectionPostRevealProgress = progress;
  return rampLimit;
}

export function updateTronRunnerCrowdReflectionBudget({
  stats,
  crowd,
  crowdGroup,
  reflectionCandidates,
  dynamicReflectionEnabled,
  crowdReflectionsIsolation,
  reflectionRevealEnabled,
  reflectionMaxActive,
  reflectionMinFps,
  reflectionNearDistance,
  latestMeasuredFps,
  cityRevealComplete,
  postRevealElapsedMs,
  isCityRevealPerformanceCritical,
  distanceToCamera,
  rampLimit,
}) {
  stats.activeReflectionCount = 0;
  stats.reflectionCandidateCount = 0;
  stats.reflectionBudgetLimit = 0;
  stats.reflectionFpsBudgetLimit = 0;
  stats.reflectionPostRevealRampLimit = 0;
  stats.reflectionPostRevealRampActive = false;
  stats.reflectionPostRevealElapsedMs = postRevealElapsedMs();
  stats.reflectionPostRevealProgress = cityRevealComplete ? 1 : 0;
  stats.reflectionDistanceSkippedCount = 0;
  for (const member of crowd) {
    member.dynamicReflectionBudgetActive = false;
    member.dynamicReflectionRank = null;
    member.dynamicReflectionDistance = Number.POSITIVE_INFINITY;
  }
  if (!dynamicReflectionEnabled || !crowdReflectionsIsolation || !crowdGroup.visible) return;
  if (!reflectionRevealEnabled && isCityRevealPerformanceCritical()) return;
  let budgetLimit = reflectionMaxActive;
  if (latestMeasuredFps > 0 && latestMeasuredFps < 42) budgetLimit = 0;
  else if (latestMeasuredFps > 0 && latestMeasuredFps < reflectionMinFps) budgetLimit = Math.max(1, budgetLimit - 1);
  stats.reflectionFpsBudgetLimit = budgetLimit;
  const ramp = rampLimit(reflectionMaxActive);
  budgetLimit = Math.min(budgetLimit, ramp);
  stats.reflectionBudgetLimit = budgetLimit;
  if (budgetLimit <= 0) return;
  reflectionCandidates.length = 0;
  for (const member of crowd) {
    if (!member.group.visible || !member.reflectionGroup) continue;
    const distance = distanceToCamera(member);
    member.dynamicReflectionDistance = distance;
    if (distance > reflectionNearDistance) {
      stats.reflectionDistanceSkippedCount += 1;
      continue;
    }
    stats.reflectionCandidateCount += 1;
    let insertAt = reflectionCandidates.length;
    while (insertAt > 0 && distance < reflectionCandidates[insertAt - 1].distance) insertAt--;
    if (insertAt < budgetLimit) {
      reflectionCandidates.splice(insertAt, 0, { member, distance });
      if (reflectionCandidates.length > budgetLimit) {
        reflectionCandidates.length = budgetLimit;
      }
    }
  }
  reflectionCandidates.forEach(({ member }, rank) => {
    member.dynamicReflectionBudgetActive = true;
    member.dynamicReflectionRank = rank + 1;
  });
  stats.activeReflectionCount = Math.min(
    budgetLimit,
    stats.reflectionCandidateCount
  );
}
