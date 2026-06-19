import * as THREE from 'three';

import {
  TRON_RUNNER_WALK_CYCLE_DISTANCE,
} from './characters.js';
import {
  tronRunnerCrowdWalkCycleOffset,
} from './character-crowd.js';
import {
  syncTronRunnerWalkCycleToDistance,
} from './character-movement.js';
import {
  switchTronRunnerAction,
} from './runner-controller.js';

export function syncTronRunnerActionSetToDistance({
  runnerParts,
  distance,
  phaseOffset = 0,
  cycleDistance = TRON_RUNNER_WALK_CYCLE_DISTANCE,
}) {
  const synced = syncTronRunnerWalkCycleToDistance({
    mixer: runnerParts.mixer,
    action: runnerParts.activeAction,
    distance,
    phaseOffset,
    cycleDistance,
  });
  syncTronRunnerWalkCycleToDistance({
    mixer: runnerParts.reflectionMixer,
    action: runnerParts.reflectionActiveAction,
    distance,
    phaseOffset,
    cycleDistance,
  });
  syncTronRunnerWalkCycleToDistance({
    mixer: runnerParts.reflectionLedMixer,
    action: runnerParts.reflectionLedActiveAction,
    distance,
    phaseOffset,
    cycleDistance,
  });
  return synced;
}

export function syncTronRunnerCrowdWalkCycleToDistance(member, cycleDistance = TRON_RUNNER_WALK_CYCLE_DISTANCE) {
  if (!member) return false;
  const phaseOffset = member.walkCycleOffset || 0;
  const distance = member.distanceWalked || 0;
  const synced = syncTronRunnerWalkCycleToDistance({
    mixer: member.mixer,
    action: member.action,
    distance,
    phaseOffset,
    cycleDistance,
  });
  if (member.dynamicReflectionBudgetActive) {
    syncTronRunnerWalkCycleToDistance({
      mixer: member.reflectionMixer,
      action: member.reflectionAction,
      distance,
      phaseOffset,
      cycleDistance,
    });
    syncTronRunnerWalkCycleToDistance({
      mixer: member.reflectionLedMixer,
      action: member.reflectionLedAction,
      distance,
      phaseOffset,
      cycleDistance,
    });
  }
  return synced;
}

export function syncTronRunnerCrowdRunCycleToDistance(member, cycleDistance) {
  return syncTronRunnerCrowdWalkCycleToDistance(member, cycleDistance);
}

export function makeTronRunnerCrowdActionSet({
  model,
  animations,
  offset,
  effectiveAnimationSpeed,
}) {
  const mixer = new THREE.AnimationMixer(model);
  const walkClip = animations.find((clip) => /walk/i.test(clip.name)) || animations[0];
  if (!walkClip) return { mixer, action: null };
  const action = mixer.clipAction(walkClip);
  action.enabled = true;
  action.setEffectiveTimeScale(effectiveAnimationSpeed * (0.92 + (offset % 5) * 0.035));
  action.setEffectiveWeight(1);
  action.play();
  action.time = (walkClip.duration || 1) * tronRunnerCrowdWalkCycleOffset(offset);
  return { mixer, action };
}

export function playTronRunnerAction({
  runnerParts,
  runnerState,
  effectiveTimeScale,
  kind = 'run',
}) {
  const actionName = runnerParts.actionNames?.[kind] || runnerParts.actionNames?.idle;
  const next = actionName ? runnerParts.actions?.[actionName] : null;
  runnerParts.activeAction = switchTronRunnerAction({
    next,
    previous: runnerParts.activeAction,
    effectiveTimeScale,
  });
  const reflectionActionName = runnerParts.reflectionActionNames?.[kind] || runnerParts.reflectionActionNames?.idle;
  const reflectionNext = reflectionActionName ? runnerParts.reflectionActions?.[reflectionActionName] : null;
  runnerParts.reflectionActiveAction = switchTronRunnerAction({
    next: reflectionNext,
    previous: runnerParts.reflectionActiveAction,
    effectiveTimeScale,
  });
  const reflectionLedActionName = runnerParts.reflectionLedActionNames?.[kind] || runnerParts.reflectionLedActionNames?.idle;
  const reflectionLedNext = reflectionLedActionName ? runnerParts.reflectionLedActions?.[reflectionLedActionName] : null;
  runnerParts.reflectionLedActiveAction = switchTronRunnerAction({
    next: reflectionLedNext,
    previous: runnerParts.reflectionLedActiveAction,
    effectiveTimeScale,
  });
  runnerState.clip = actionName || reflectionActionName || '';
  runnerState.action = kind === 'run' ? 'Run' : kind === 'walk' ? 'Walk' : 'Idle';
}
