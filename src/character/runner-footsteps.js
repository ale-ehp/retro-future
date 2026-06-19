import * as THREE from 'three';
import {
  TRON_RUNNER_FOOTSTEP_CONTACTS,
  TRON_RUNNER_FOOTSTEP_MAX_DISTANCE,
  TRON_RUNNER_FOOTSTEP_REF_DISTANCE,
  TRON_RUNNER_FOOTSTEP_ROLLOFF,
  TRON_RUNNER_FOOTSTEP_VOLUME_SCALE,
  TRON_RUNNER_FREE_ROAM_FOOTSTEPS_ENABLED,
  TRON_RUNNER_FREE_ROAM_STRIDE_LENGTH,
  TRON_RUNNER_SOURCE_CHARACTER_VISIBLE,
} from './characters.js';
import {
  tronRunnerWalkCycleFootstep as resolveTronRunnerWalkCycleFootstep,
} from './character-footsteps.js';

function tronRunnerFootstepSurface(runnerState) {
  return runnerState.surface === 'sidewalk' ? 'sidewalk' : 'road';
}

export function tronRunnerFootstepAudioState(autonomy, npcSpatialBus) {
  return {
    bus: autonomy.lastFootstepBus,
    spatialized: autonomy.lastFootstepBus === npcSpatialBus && autonomy.lastFootstepPlayed,
    distanceModel: 'inverse',
    refDistance: TRON_RUNNER_FOOTSTEP_REF_DISTANCE,
    maxDistance: TRON_RUNNER_FOOTSTEP_MAX_DISTANCE,
    rolloffFactor: TRON_RUNNER_FOOTSTEP_ROLLOFF,
    volumeScale: TRON_RUNNER_FOOTSTEP_VOLUME_SCALE,
    syncSource: autonomy.lastFootstepSyncSource,
    lastGain: Number(autonomy.lastFootstepGain.toFixed(4)),
    lastDistance: Number(autonomy.lastFootstepDistance.toFixed(2)),
    lastDistanceGain: Number(autonomy.lastFootstepDistanceGain.toFixed(4)),
    lastPlaybackRate: Number(autonomy.lastFootstepPlaybackRate.toFixed(3)),
    lastPan: Number(autonomy.lastFootstepPan.toFixed(3)),
    lastSample: autonomy.lastFootstepSample,
    lastSurface: autonomy.lastFootstepSurface,
  };
}

function tronRunnerFootstepOrigin(walker, yaw, side) {
  const sideSign = side === 'left' ? -1 : 1;
  const sideOffset = 0.28 * sideSign;
  return {
    x: walker.position.x + Math.cos(yaw) * sideOffset,
    y: walker.position.y + 0.16,
    z: walker.position.z - Math.sin(yaw) * sideOffset,
  };
}

function tronRunnerWalkCyclePhase(runnerParts) {
  const action = runnerParts.activeAction;
  const clip = action?.getClip?.() || action?._clip;
  const duration = clip?.duration;
  if (!action || !Number.isFinite(duration) || duration <= 0.001) return null;
  return ((action.time / duration) % 1 + 1) % 1;
}

function tronRunnerWalkCycleFootstep(runnerParts, autonomy, movedDistance) {
  const phase = tronRunnerWalkCyclePhase(runnerParts);
  const next = resolveTronRunnerWalkCycleFootstep({
    phase,
    movedDistance,
    previousPhase: autonomy.lastWalkCyclePhase,
    footstepPhase: autonomy.footstepPhase,
    lastFootstepIndex: autonomy.lastFootstepIndex,
    footstepSide: autonomy.footstepSide,
    contacts: TRON_RUNNER_FOOTSTEP_CONTACTS,
    strideLength: TRON_RUNNER_FREE_ROAM_STRIDE_LENGTH,
  });
  autonomy.lastWalkCyclePhase = next.nextWalkCyclePhase;
  autonomy.footstepPhase = next.nextFootstepPhase;
  autonomy.lastFootstepIndex = next.nextFootstepIndex;
  autonomy.footstepSide = next.nextFootstepSide;
  return next.contact;
}

export function updateTronRunnerAutonomyFootsteps(runtime) {
  const {
    autonomy,
    runnerState,
    runnerParts,
    walker,
    playFootstepForSurface,
    revealIsComplete,
    npcSpatialBus,
    minIntervalMs,
    movedDistance,
    dt,
    yaw,
    walkSpeed,
  } = runtime;
  if (!TRON_RUNNER_FREE_ROAM_FOOTSTEPS_ENABLED) return;
  if (!TRON_RUNNER_SOURCE_CHARACTER_VISIBLE) return;
  if (!revealIsComplete()) return;
  const contact = tronRunnerWalkCycleFootstep(runnerParts, autonomy, movedDistance);
  autonomy.lastFootstepSyncSource = contact.syncSource || 'walk-cycle';
  if (!contact.triggered) return;
  const surface = tronRunnerFootstepSurface(runnerState);
  const now = performance.now();
  if (now - autonomy.lastFootstepPlayedAt < minIntervalMs) return;
  autonomy.lastFootstepPlayedAt = now;
  const side = contact.side || 'right';
  const moveRatio = movedDistance / Math.max(0.05, walkSpeed * Math.max(dt, 0.001));
  const intensity = THREE.MathUtils.clamp(0.28 + moveRatio * 0.16, 0.18, 0.54);
  const details = playFootstepForSurface(surface, intensity, side, {
    bus: npcSpatialBus,
    returnDetails: true,
    spatialOrigin: tronRunnerFootstepOrigin(walker, yaw, side),
    volumeScale: TRON_RUNNER_FOOTSTEP_VOLUME_SCALE,
    minVolume: 0.002,
    maxVolume: 0.52,
    refDistance: TRON_RUNNER_FOOTSTEP_REF_DISTANCE,
    maxDistance: TRON_RUNNER_FOOTSTEP_MAX_DISTANCE,
    rolloffFactor: TRON_RUNNER_FOOTSTEP_ROLLOFF,
    distanceModel: 'inverse',
    panningModel: 'HRTF',
    rateMultiplier: surface === 'sidewalk' ? 1.08 : 0.90,
    runLift: 1,
    lowpassFrequency: surface === 'sidewalk' ? 1900 : 1550,
    fadeOutTime: 0.2,
    syncSource: contact.syncSource || 'walk-cycle',
  });
  autonomy.lastFootstepPlayed = Boolean(details?.played);
  if (details?.played) {
    autonomy.lastFootstepBus = details.bus;
    autonomy.lastFootstepSurface = details.surface;
    autonomy.lastFootstepSample = details.sampleKey;
    autonomy.lastFootstepGain = details.gain;
    autonomy.lastFootstepDistance = details.distance;
    autonomy.lastFootstepDistanceGain = details.distanceGain;
    autonomy.lastFootstepPlaybackRate = details.playbackRate;
    autonomy.lastFootstepPan = details.pan;
    autonomy.lastFootstepSyncSource = details.syncSource;
  }
}
