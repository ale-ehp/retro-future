export function resetTronRunnerAutonomy({
  autonomy,
  footstepBus,
}) {
  autonomy.initialized = false;
  autonomy.waypointIndex = 0;
  autonomy.distanceWalked = 0;
  autonomy.collisionCount = 0;
  autonomy.lastCollision = false;
  autonomy.footstepPhase = 0;
  autonomy.lastFootstepIndex = -1;
  autonomy.lastFootstepPlayedAt = 0;
  autonomy.lastWalkCyclePhase = null;
  autonomy.lastFootstepSurface = '';
  autonomy.lastFootstepSample = '';
  autonomy.lastFootstepPlayed = false;
  autonomy.lastFootstepBus = footstepBus;
  autonomy.lastFootstepGain = 0;
  autonomy.lastFootstepDistance = 0;
  autonomy.lastFootstepDistanceGain = 1;
  autonomy.lastFootstepPlaybackRate = 0;
  autonomy.lastFootstepPan = 0;
  autonomy.lastFootstepSyncSource = 'walk-cycle';
}

export function switchTronRunnerAction({
  next,
  previous,
  effectiveTimeScale,
  fadeSeconds = 0.16,
}) {
  if (!next || previous === next) return previous;
  next.reset();
  next.enabled = true;
  next.setEffectiveTimeScale(effectiveTimeScale);
  next.setEffectiveWeight(1);
  next.fadeIn(fadeSeconds);
  next.play();
  if (previous) previous.fadeOut(fadeSeconds);
  return next;
}
