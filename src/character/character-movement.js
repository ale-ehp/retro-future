import * as THREE from 'three';

export function computeTronRunnerEffectiveAnimationSpeed({
  walkSpeed,
  defaultSpeed,
  animationSpeed,
  strideSync,
}) {
  const speedRatio = THREE.MathUtils.clamp(walkSpeed / Math.max(0.001, defaultSpeed), 0.05, 8);
  return animationSpeed * THREE.MathUtils.lerp(1, speedRatio, strideSync);
}

export function syncTronRunnerWalkCycleToDistance({
  mixer,
  action,
  distance,
  phaseOffset = 0,
  cycleDistance,
}) {
  const clip = action?.getClip?.() || action?._clip;
  const duration = clip?.duration;
  if (!mixer || !action || !Number.isFinite(duration) || duration <= 0.001) return false;
  const safeCycleDistance = Math.max(0.001, cycleDistance);
  const phase = ((distance / safeCycleDistance + phaseOffset) % 1 + 1) % 1;
  const time = phase * duration;
  // mixer.update(0) resamples every interpolant of the clip and rewrites all the
  // bone transforms. Members that are paused (or simply have not covered enough
  // ground since the last tick) land on the exact same pose, so skip the resample
  // instead of paying full skeletal sampling for an identical result. The memo
  // lives on the mixer and records which action produced the pose, so switching
  // action (walk <-> run) always resamples even at an identical clip time.
  if (mixer.__walkCycleSyncedAction === action
    && Math.abs(mixer.__walkCycleSyncedTime - time) < 1e-4) return true;
  mixer.__walkCycleSyncedAction = action;
  mixer.__walkCycleSyncedTime = time;
  action.time = time;
  action.setEffectiveTimeScale(1);
  mixer.update(0);
  return true;
}

export function tronRunnerCrowdGridCoord(value, cellSize) {
  return Math.floor(value / cellSize);
}

export function tronRunnerCrowdGridKey(cx, cz) {
  // numeric key (mirrors hexTileBucketKey): collision-free for |cx|,|cz| < 100000, which the
  // boulevard-bounded crowd cells never approach. Avoids ~5-13k string allocations/sec vs `${cx}:${cz}`.
  return (cx + 100000) * 1000000 + (cz + 100000);
}
