import * as THREE from 'three';

import {
  TRON_RUNNER_DYNAMIC_REFLECTION_BODY_RENDER_ORDER,
  TRON_RUNNER_DYNAMIC_REFLECTION_LED_RENDER_ORDER,
  TRON_RUNNER_DYNAMIC_REFLECTION_Y,
  TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE,
} from './characters.js';
import {
  makeTronRunnerCrowdActionSet,
} from './runner-animation.js';

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

export function buildTronRunnerCrowdReflection({
  sourceModel,
  animations,
  index,
  colorPreset = null,
  dynamicReflectionEnabled,
  cloneRunnerSkeleton,
  reflectionRig,
  effectiveAnimationSpeed,
}) {
  if (!dynamicReflectionEnabled || !sourceModel || !cloneRunnerSkeleton) {
    return emptyTronRunnerCrowdReflection();
  }
  const group = new THREE.Group();
  group.name = `tron-runner-crowd-reflection-${index + 1}`;
  group.position.y = TRON_RUNNER_DYNAMIC_REFLECTION_Y;
  group.scale.set(1, -TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE, 1);
  group.userData.tronRunnerReflectionMode = 'mesh-clone';
  group.visible = false;

  const model = cloneRunnerSkeleton(sourceModel);
  model.name = `soldier-rigged-runner-crowd-reflection-${index + 1}`;
  const ledModel = cloneRunnerSkeleton(sourceModel);
  ledModel.name = `soldier-rigged-runner-crowd-reflection-led-${index + 1}`;
  const bodyMaterials = [];
  const ledMaterials = [];
  let meshCount = 0;
  let ledMeshCount = 0;
  model.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.frustumCulled = false;
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.renderOrder = TRON_RUNNER_DYNAMIC_REFLECTION_BODY_RENDER_ORDER;
    obj.layers.set(0);
    obj.material = reflectionRig.makeBodyMaterial();
    bodyMaterials.push(obj.material);
    meshCount += 1;
  });
  ledModel.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.frustumCulled = false;
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.renderOrder = TRON_RUNNER_DYNAMIC_REFLECTION_LED_RENDER_ORDER;
    obj.layers.set(0);
    obj.material = reflectionRig.makeLedMaterial(colorPreset);
    ledMaterials.push(obj.material);
    ledMeshCount += 1;
  });
  group.add(model);
  group.add(ledModel);
  const { mixer, action } = makeTronRunnerCrowdActionSet({
    model,
    animations,
    offset: index,
    effectiveAnimationSpeed,
  });
  const { mixer: ledMixer, action: ledAction } = makeTronRunnerCrowdActionSet({
    model: ledModel,
    animations,
    offset: index,
    effectiveAnimationSpeed,
  });
  return {
    group,
    model,
    ledModel,
    mixer,
    ledMixer,
    action,
    ledAction,
    materials: [...bodyMaterials, ...ledMaterials],
    bodyMaterials,
    ledMaterials,
    meshCount,
    ledMeshCount,
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

function tronRunnerSegmentHitsBoxXZ(ax, az, bx, bz, cx, cz, hw, hd) {
  const dx = bx - ax;
  const dz = bz - az;
  let tmin = 0;
  let tmax = 1;
  if (Math.abs(dx) < 1e-6) {
    if (ax < cx - hw || ax > cx + hw) return false;
  } else {
    let t1 = (cx - hw - ax) / dx;
    let t2 = (cx + hw - ax) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dz) < 1e-6) {
    if (az < cz - hd || az > cz + hd) return false;
  } else {
    let t1 = (cz - hd - az) / dz;
    let t2 = (cz + hd - az) / dz;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

export function tronRunnerCrowdReflectionOccludedByBuilding(member, cameraPosition, colliderRecords) {
  const px = member.group.position.x;
  const pz = member.group.position.z;
  const camX = cameraPosition.x;
  const camZ = cameraPosition.z;
  for (const record of colliderRecords) {
    const c = record.collider;
    if (!c) continue;
    if (tronRunnerSegmentHitsBoxXZ(camX, camZ, px, pz, c.x, c.z, c.hw, c.hd)) return true;
  }
  return false;
}
