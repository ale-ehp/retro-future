// Come nasce un membro della folla: la coda di costruzione e il montaggio del singolo.
//
// Perche' sta in un file suo (2026-09-21): costruire e far camminare sono due mestieri
// diversi che stavano nello stesso file da 1.353 righe. Qui c'e' solo il primo, e non
// tocca niente del secondo: misurato prima di staccarlo, zero funzioni condivise nelle
// due direzioni.
//
// La coda esiste perche' costruire cinquanta personaggi in un frame lo fa durare mezzo
// secondo. Si accodano i lavori, se ne fa qualcuno per frame, e `drain` li finisce tutti
// insieme quando si puo' permettere la pausa (prima del rivelo della citta').
//
// Nessuno stato di modulo: tutto arriva dall'oggetto `state` che runner-wiring.js compone.
import * as THREE from 'three';
import { fxEnabled } from '../engine/fx-debug-toggles.js';

import {
  createTronRunnerCrowdMemberRecord,
} from './character-build.js';
import {
  tronRunnerCrowdWalkCycleOffset,
} from './character-crowd.js';
import {
  buildTronRunnerCrowdReflection,
} from './character-reflections.js';
import {
  makeTronRunnerCrowdActionSet,
} from './runner-animation.js';
import {
  pickTronRunnerCrowdLines,
} from './runner-crowd-lines.js';
import {
  tronRunnerGreeterStartPosition,
} from './runner-greeter.js';

function collectTronRunnerCrowdSourceMeshes(sourceModel) {
  const sourceMeshes = [];
  sourceModel.traverse((obj) => {
    if (obj.isMesh) sourceMeshes.push(obj);
  });
  return sourceMeshes;
}

export function enqueueTronRunnerCrowdBuildJobRuntime(state, sourceModel, animations, options = {}) {
  if (!state.crowdEnabled || !sourceModel || !state.getCloneRunnerSkeleton()) return false;
  const count = Math.max(0, Math.floor(options.count ?? state.requestedCount));
  if (!count) return false;
  if (!Array.isArray(state.queue)) state.queue = [];
  const startedAt = state.now();
  const job = {
    sourceModel,
    sourceMeshes: collectTronRunnerCrowdSourceMeshes(sourceModel),
    animations,
    count,
    nextIndex: 0,
    indexOffset: options.indexOffset ?? (state.crowd?.length ?? 0),
    kind: options.kind || 'runner',
    source: options.source || 'soldier',
    groupNamePrefix: options.groupNamePrefix || 'tron-runner-crowd',
    modelNamePrefix: options.modelNamePrefix || 'soldier-rigged-runner-crowd',
    colorPresetForIndex: options.colorPresetForIndex || null,
    walkCycleDistanceMode: options.walkCycleDistanceMode || '',
    startedAt,
  };
  state.queue.push(job);
  state.buildStats.status = state.job ? 'building' : 'queued';
  state.buildStats.built = state.crowd?.length ?? state.buildStats.built ?? 0;
  state.buildStats.requested = (state.buildStats.requested || 0) + count;
  if (!state.buildStats.startedAt) state.buildStats.startedAt = startedAt;
  return true;
}

export function startTronRunnerCrowdBuildQueueRuntime(state, sourceModel, animations) {
  state.job = null;
  state.queue = [];
  state.clearState();
  state.buildStats.built = 0;
  state.buildStats.requested = 0;
  state.buildStats.startedAt = 0;
  state.buildStats.durationMs = 0;
  enqueueTronRunnerCrowdBuildJobRuntime(state, sourceModel, animations, {
    count: state.requestedCount,
    indexOffset: 0,
    kind: 'runner',
    source: 'soldier',
    groupNamePrefix: 'tron-runner-crowd',
    modelNamePrefix: 'soldier-rigged-runner-crowd',
  });
}

export function processTronRunnerCrowdBuildQueueRuntime(state) {
  if (!state.job) state.job = state.queue?.shift() || null;
  if (!state.job) return;
  const job = state.job;
  const started = state.now();
  state.buildStats.status = 'building';
  state.buildMember(job, job.nextIndex);
  job.nextIndex += 1;
  state.buildStats.built = state.crowd?.length ?? state.buildStats.built + 1;
  state.buildStats.lastChunkMs = state.now() - started;
  if (job.nextIndex < job.count) return;
  state.job = null;
  if (state.queue?.length) return;
  state.syncScaleAndGround();
  state.syncVisibility();
  state.buildStats.status = 'done';
  state.buildStats.durationMs = state.now() - (state.buildStats.startedAt || job.startedAt);
}

export async function drainTronRunnerCrowdBuildQueueRuntime(state) {
  while (state.job || state.queue?.length) {
    state.processBuildQueue();
    await state.waitForNextFrame();
  }
}


export function buildTronRunnerCrowdMemberRuntime({
  crowd,
  crowdGroup,
  walker,
  runnerState,
  cloneRunnerSkeleton,
  materials,
  routes,
  dynamicReflectionEnabled,
  reflectionRig,
  getWalkSpeed,
  crowdSpeedScale,
  groundOffset,
  greeterIndex,
  getDroneLandingPose,
  crowdLines,
  talkLinesPerMember,
}, job, index) {
  const globalIndex = (job.indexOffset ?? 0) + index;
  const group = new THREE.Group();
  group.name = `${job.groupNamePrefix || 'tron-runner-crowd'}-${globalIndex + 1}`;
  group.visible = false;
  group.scale.copy(walker.scale);
  const colorPreset = job.colorPresetForIndex?.(index, globalIndex) || materials.colorPresetForIndex(globalIndex);

  const cloneModel = cloneRunnerSkeleton(job.sourceModel);
  cloneModel.name = `${job.modelNamePrefix || 'soldier-rigged-runner-crowd'}-${globalIndex + 1}`;
  const cloneMeshes = [];
  cloneModel.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.frustumCulled = false;
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.layers.set(0);
    cloneMeshes.push(obj);
  });
  const crowdMaterial = materials.makeSuitMaterial(colorPreset);
  cloneMeshes.forEach((mesh) => {
    mesh.material = crowdMaterial;
  });
  group.add(cloneModel);
  // fx.crowd=0 hides every crowd body; fx.greeter=0 hides only the greeter member.
  // cloneModel.visible is never rewritten by culling/reveal (they touch group.visible
  // / material.opacity), so this persists and skips only the body draw.
  cloneModel.visible = fxEnabled('crowd') && (globalIndex !== greeterIndex || fxEnabled('greeter'));

  const animationScaleOffset = 0.92 + (globalIndex % 5) * 0.035;
  const speedScaleOffset = 0.86 + (globalIndex % 5) * 0.035;
  const { mixer, action } = makeTronRunnerCrowdActionSet({
    model: cloneModel,
    animations: job.animations,
    offset: globalIndex,
    effectiveAnimationSpeed: runnerState.effectiveAnimationSpeed,
  });
  // The rig is two more skeleton clones and two more AnimationMixers per member.
  // It is only ever parented below when the effect is on, and the toggle does not
  // rebuild the crowd, so building it with the effect off produced ~60 skinned
  // rigs that could never render — paid for in build-chunk time, scene-graph size
  // and memory. Ask for it only when it can actually be used.
  const crowdReflectionsVisible = fxEnabled('crowdReflections');
  const reflection = buildTronRunnerCrowdReflection({
    sourceModel: job.sourceModel,
    animations: job.animations,
    index: globalIndex,
    colorPreset,
    dynamicReflectionEnabled: dynamicReflectionEnabled && crowdReflectionsVisible,
    cloneRunnerSkeleton,
    reflectionRig,
    effectiveAnimationSpeed: runnerState.effectiveAnimationSpeed,
  });
  if (crowdReflectionsVisible && reflection.group) group.add(reflection.group);
  const route = routes.buildRoute(globalIndex);
  const fallback = routes.fallbackPlacement(globalIndex);
  const startInfo = routes.roadFacingStart(route, globalIndex, fallback);
  const start = startInfo.placement;
  group.position.set(start.x, start.y, start.z);
  group.rotation.y = start.yaw ?? 0;
  if (globalIndex === greeterIndex) {
    // The green companion starts far enough out to show a visible approach before greeting.
    const droneLandingPose = getDroneLandingPose();
    const greeterStart = tronRunnerGreeterStartPosition({ droneLandingPose, routeStart: start });
    group.position.set(greeterStart.x, greeterStart.y, greeterStart.z);
  }
  const speed = getWalkSpeed() * crowdSpeedScale * speedScaleOffset;
  const actionClipDuration = action?.getClip?.()?.duration ?? 0;
  const walkCycleDistance = job.walkCycleDistanceMode === 'clip-duration'
    && Number.isFinite(actionClipDuration)
    && actionClipDuration > 0
      ? Math.max(0.001, speed * actionClipDuration)
      : null;
  const member = createTronRunnerCrowdMemberRecord({
    index: globalIndex,
    group,
    model: cloneModel,
    material: crowdMaterial,
    mixer,
    action,
    colorPreset,
    reflection,
    route,
    startInfo,
    speed,
    speedScaleOffset,
    animationScaleOffset,
    walkCycleOffset: tronRunnerCrowdWalkCycleOffset(globalIndex),
    groundOffset,
  });
  member.localIndex = index;
  member.kind = job.kind || 'runner';
  member.source = job.source || 'soldier';
  member.idleClip = job.animations?.find((clip) => /idle/i.test(clip.name)) || null;
  member.runClip = job.animations?.find((clip) => /run/i.test(clip.name)) || null;
  member.walkCycleDistance = walkCycleDistance;
  member.walkCycleDistanceMode = job.walkCycleDistanceMode || '';
  member.walkClipDuration = actionClipDuration;
  member.talkLines = pickTronRunnerCrowdLines(globalIndex, crowdLines, talkLinesPerMember);
  member.talkCycle = 0;
  member.talkArmed = true;
  member.talkUntil = 0;
  member.talkStart = 0;
  member.talkText = '';
  crowd.push(member);
  crowdGroup.add(group);
}

