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
  action.time = phase * duration;
  action.setEffectiveTimeScale(1);
  mixer.update(0);
  return true;
}

export function tronRunnerCrowdGridCoord(value, cellSize) {
  return Math.floor(value / cellSize);
}

export function tronRunnerCrowdGridKey(cx, cz) {
  return `${cx}:${cz}`;
}
