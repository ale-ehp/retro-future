import * as THREE from 'three';
import { inLingua } from '../lingua.js';

import {
  nearbyTronRunnerCrowdMembers,
  prepareTronRunnerCrowdSpatialGrid,
  tronRunnerCrowdAvoidance as tronRunnerCrowdAvoidanceCore,
  tronRunnerCrowdDistanceToCamera as tronRunnerCrowdDistanceToCameraCore,
  tronRunnerCrowdLodStride as tronRunnerCrowdLodStrideCore,
  tronRunnerCrowdTryDeadlockNudge as tronRunnerCrowdTryDeadlockNudgeCore,
  updateTronRunnerCrowdCullingState,
} from './character-crowd.js';
import {
  resolveTronRunnerCrowdCollision as resolveTronRunnerCrowdCollisionCore,
  resolveTronRunnerRoundedCollider,
  tronRunnerCrowdBuildingCollisionDiagnostic as tronRunnerCrowdBuildingCollisionDiagnosticCore,
  tronRunnerCrowdColliderLabel,
  tronRunnerCrowdPointInsideRoute as tronRunnerCrowdPointInsideRouteCore,
} from './character-collision.js';
import {
  applyTronRunnerCrowdReflectionState,
  tronRunnerCrowdPostRevealReflectionRampLimit as tronRunnerCrowdPostRevealReflectionRampLimitCore,
  tronRunnerCrowdReflectionOccludedByBuilding,
  updateTronRunnerCrowdReflectionBudget as updateTronRunnerCrowdReflectionBudgetCore,
} from './character-reflections.js';
import {
  tronRunnerCrowdGridCoord as tronRunnerCrowdGridCoordCore,
} from './character-movement.js';
import {
  syncTronRunnerCrowdRunCycleToDistance,
  syncTronRunnerCrowdWalkCycleToDistance,
} from './runner-animation.js';
import {
  GREETER_BOARD_BUBBLE_TEXT,
  GREETER_FOLLOW_BUBBLE_TEXT,
  TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE,
  TRON_RUNNER_WELCOME_BUBBLE_TEXT,
} from './runner-greeter.js';

export function clearTronRunnerCrowdState({
  crowd,
  group,
  spatialGrid,
  buildStats,
  runtimeStats,
  requestedCount,
}) {
  spatialGrid.clear();
  crowd.length = 0;
  while (group.children.length) {
    group.remove(group.children[0]);
  }
  group.visible = false;
  buildStats.status = 'idle';
  buildStats.built = 0;
  buildStats.requested = requestedCount;
  buildStats.startedAt = 0;
  buildStats.durationMs = 0;
  buildStats.lastChunkMs = 0;
  runtimeStats.performanceFreezeFrameCount = 0;
}

export function syncTronRunnerCrowdScaleAndGround({
  crowd,
  sourceScale,
  surfaceYForPoint,
  fallbackPlacement,
  groundOffset,
  updateReflection,
  syncMemberMatrixUpdates,
  syncIdlePose,
}) {
  for (const member of crowd) {
    member.group.scale.copy(sourceScale);
    const surface = member.route
      ? surfaceYForPoint(member.group.position.x, member.group.position.z)
      : null;
    if (surface) {
      member.group.position.y = surface.y;
      member.surface = surface.surface;
      member.groundOffset = member.group.position.y - surface.groundY;
    } else {
      const placement = fallbackPlacement(member.index);
      member.group.position.set(placement.x, placement.y, placement.z);
      member.group.rotation.y = placement.yaw;
      member.surface = placement.surface;
      member.groundOffset = groundOffset;
    }
    updateReflection(member);
    syncMemberMatrixUpdates(member, true);
  }
  syncIdlePose();
}

export function tronRunnerCrowdGridCoordRuntime({ cellSize }, value) {
  return tronRunnerCrowdGridCoordCore(value, cellSize);
}

export function cityRevealPostRevealElapsedMsRuntime({
  getCityRevealComplete,
  getCityRevealCompletedAt,
}, now = performance.now()) {
  if (!getCityRevealComplete() || !getCityRevealCompletedAt()) return 0;
  return Math.max(0, now - getCityRevealCompletedAt());
}

export function invalidateTronRunnerCrowdColliderRecordsRuntime(cache) {
  cache.records = null;
  cache.sourceLength = -1;
}

export function tronRunnerCrowdColliderRecordsRuntime({
  cache,
  getSideBuildingRecords,
  getMainBuildingRecords,
}) {
  const sideRecords = getSideBuildingRecords();
  const mainRecords = getMainBuildingRecords();
  const sourceLength = sideRecords.length + mainRecords.length;
  if (!cache.records || cache.sourceLength !== sourceLength) {
    cache.records = [...sideRecords, ...mainRecords].filter((record) => record.collider);
    cache.sourceLength = sourceLength;
  }
  return cache.records;
}

const tronRunnerCrowdReflectionStateArgs = {
  member: null,
  group: null,
  bodyMaterials: null,
  ledMaterials: null,
  visible: false,
  bodyOpacity: 0,
  ledOpacity: 0,
  reflectionY: 0,
  reflectionYScale: 1,
};

export function updateTronRunnerCrowdReflectionRuntime({
  getCrowdReflectionsIsolation,
  camera,
  getColliderRecords,
  reflectionRig,
  dynamicReflectionEnabled,
  crowdGroup,
  reflectionY,
  reflectionYScale,
}, member) {
  const budgetActive = getCrowdReflectionsIsolation() && member.dynamicReflectionBudgetActive === true;
  if (!budgetActive && member.dynamicReflectionVisible === false) return;
  const group = member.reflectionGroup;
  const bodyMaterials = member.reflectionBodyMaterials || [];
  const ledMaterials = member.reflectionLedMaterials || [];
  const occluded = budgetActive && tronRunnerCrowdReflectionOccludedByBuilding(
    member,
    camera.position,
    getColliderRecords()
  );
  const bodyOpacity = budgetActive && !occluded ? reflectionRig.bodyOpacityForSurface(member.surface) : 0;
  const ledOpacity = budgetActive && !occluded ? reflectionRig.ledOpacityForSurface(member.surface) : 0;
  const visible = Boolean(
    dynamicReflectionEnabled &&
    getCrowdReflectionsIsolation() &&
    crowdGroup.visible &&
    member.group.visible &&
    group &&
    budgetActive &&
    bodyOpacity > 0.005
  );
  const reflectionArgs = tronRunnerCrowdReflectionStateArgs;
  reflectionArgs.member = member;
  reflectionArgs.group = group;
  reflectionArgs.bodyMaterials = bodyMaterials;
  reflectionArgs.ledMaterials = ledMaterials;
  reflectionArgs.visible = visible;
  reflectionArgs.bodyOpacity = bodyOpacity;
  reflectionArgs.ledOpacity = ledOpacity;
  reflectionArgs.reflectionY = reflectionY;
  reflectionArgs.reflectionYScale = reflectionYScale;
  applyTronRunnerCrowdReflectionState(reflectionArgs);
}

const tronRunnerCrowdNextPointScratch = { x: 0, z: 0 };

export function advanceTronRunnerCrowdMemberRuntime({
  runtime,
  camera,
  surfaceYForPoint,
  lerpAngle,
  greeterIndex,
  greeterBubbleDurationMs,
  greeterFollowDelayMs,
  greeterBoardReach,
  greetDistance,
  greeterBoardBubbleRange,
  greeterBoardStanceDeg,
  crowdReachRadius,
  pauseChance,
  pauseMinMs,
  pauseMaxMs,
  turnDurationMs,
  yieldDurationMs,
}, member, dt, now = performance.now()) {
  const crowdRuntime = runtime();
  crowdRuntime.normalizeState(member, now);
  const route = member.route;
  const isGreeter = member.index === greeterIndex;
  // Once the welcome bubble has dissolved, raise the "Seguimi" prompt and stand for a beat...
  if (isGreeter && member.greetStage === 'welcome'
      && member.greetAt && (now - member.greetAt) > greeterBubbleDurationMs) {
    member.greetStage = 'followPrompt';
    member.followPromptAt = now;
    crowdRuntime.setGreeterBubble(member, inLingua(GREETER_FOLLOW_BUBBLE_TEXT), 8000, now);
  }
  // ...then 1s later set off for the departures board (retry until the anchor resolves).
  if (isGreeter && member.greetStage === 'followPrompt'
      && member.followPromptAt && (now - member.followPromptAt) >= greeterFollowDelayMs) {
    const anchor = crowdRuntime.resolveGreeterBoardAnchor();
    if (anchor) {
      member.greetBoardAnchorX = anchor.x;
      member.greetBoardAnchorZ = anchor.z;
      member.greetBoardCenterX = anchor.cx;
      member.greetBoardCenterZ = anchor.cz;
      member.greetStage = 'toBoard';
      crowdRuntime.startGreeterWalkingToBoard(member);
    }
  }
  if (isGreeter && (member.greetStage === 'welcome' || member.greetStage === 'followPrompt' || member.greetStage === 'atBoard')) {
    // Welcomed/parked: freeze into a neutral standing pose (bind pose = straight legs, then
    // arms crossed like the idle character) so we don't stop mid-stride with a leg raised.
    if (!member.greetPosed) {
      member.greetPosed = true;
      // Crossfade from walking into the soldier idle clip: a natural standing welcome
      // (alive, no mid-stride leg, no stiff pose). Mixer is driven per frame once greetPosed.
      if (member.idleClip && member.mixer) {
        member.idleAction = member.idleAction || member.mixer.clipAction(member.idleClip);
        member.idleAction.reset();
        member.idleAction.setEffectiveTimeScale(1);
        member.idleAction.setEffectiveWeight(1);
        member.idleAction.play();
        if (member.action) member.action.crossFadeTo(member.idleAction, 0.45, false);
        // Keep the floor reflection in sync with the body's idle (it was still walking).
        if (member.reflectionMixer && member.reflectionAction) {
          member.reflectionIdleAction = member.reflectionIdleAction || member.reflectionMixer.clipAction(member.idleClip);
          member.reflectionIdleAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
          member.reflectionAction.crossFadeTo(member.reflectionIdleAction, 0.45, false);
        }
        if (member.reflectionLedMixer && member.reflectionLedAction) {
          member.reflectionLedIdleAction = member.reflectionLedIdleAction || member.reflectionLedMixer.clipAction(member.idleClip);
          member.reflectionLedIdleAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
          member.reflectionLedAction.crossFadeTo(member.reflectionLedIdleAction, 0.45, false);
        }
      } else if (member.action) {
        member.action.stop();
        member.model?.traverse((object) => {
          if (object.isSkinnedMesh && object.skeleton) object.skeleton.pose();
        });
      }
    }
    member.lastMovedDistance = 0;
    const yawToPlayer = Math.atan2(camera.position.x - member.group.position.x, camera.position.z - member.group.position.z);
    let bodyYaw = yawToPlayer; // welcome/follow stance: face the player
    if (member.greetStage === 'atBoard') {
      // Parked: body sits 45deg off the player toward the board (presenting it); head tracks me.
      const yawToBoard = Math.atan2(
        (member.greetBoardCenterX ?? member.group.position.x) - member.group.position.x,
        (member.greetBoardCenterZ ?? member.group.position.z) - member.group.position.z
      );
      const rel = Math.atan2(Math.sin(yawToBoard - yawToPlayer), Math.cos(yawToBoard - yawToPlayer));
      const stance = THREE.MathUtils.degToRad(greeterBoardStanceDeg);
      bodyYaw = yawToPlayer + Math.sign(rel || 1) * Math.min(stance, Math.abs(rel));
      // Proximity-gated bubble: the renderer eases opacity in/out over 0.5s as bubbleInRange flips.
      const distToPlayer = Math.hypot(camera.position.x - member.group.position.x, camera.position.z - member.group.position.z);
      member.bubbleText = inLingua(GREETER_BOARD_BUBBLE_TEXT);
      // Meta' di quanto era (2026-09-19): a 2 il cartello arrivava a sfiorare il terminale.
      member.bubbleSizeScale = 1;
      member.bubbleProximity = true;
      member.bubbleInRange = distToPlayer <= greeterBoardBubbleRange;
    }
    member.group.rotation.y = lerpAngle(member.group.rotation.y, bodyYaw, Math.min(1, dt * 4));
    crowdRuntime.applyGreeterHeadLook(member, dt);
    return;
  }
  if (!isGreeter && !route?.points?.length) {
    member.lastMovedDistance = 0;
    return;
  }
  const current = member.group.position;
  let target;
  if (isGreeter) {
    if (member.greetStage === 'toBoard') {
      tronRunnerCrowdNextPointScratch.x = member.greetBoardAnchorX;
      tronRunnerCrowdNextPointScratch.z = member.greetBoardAnchorZ;
    } else {
      tronRunnerCrowdNextPointScratch.x = camera.position.x;
      tronRunnerCrowdNextPointScratch.z = camera.position.z;
    }
    target = tronRunnerCrowdNextPointScratch;
  } else {
    target = route.points[member.waypointIndex % route.points.length];
  }
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const distance = Math.hypot(dx, dz);
  if (isGreeter) {
    if (member.greetStage === 'toBoard') {
      if (distance <= greeterBoardReach) {
        member.greetStage = 'atBoard'; // re-pose to idle + 45deg stance next frame
        member.lastMovedDistance = 0;
        return;
      }
    } else if (distance <= greetDistance) {
      member.greetDone = true;       // keeps the welcome bubble showing
      member.greetStage = 'welcome';
      member.greetAt = now;
      crowdRuntime.setGreeterBubble(
        member,
        inLingua(TRON_RUNNER_WELCOME_BUBBLE_TEXT),
        greeterBubbleDurationMs,
        now,
        TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE
      );
      member.lastMovedDistance = 0;
      return;
    }
  } else if (distance <= crowdReachRadius) {
    member.waypointIndex = (member.waypointIndex + 1) % route.points.length;
    if (Math.random() < pauseChance) {
      const pauseMs = pauseMinMs + Math.random() * (pauseMaxMs - pauseMinMs);
      crowdRuntime.setState(member, 'pause', now, pauseMs);
    } else {
      crowdRuntime.setState(member, 'turn', now, turnDurationMs);
    }
    member.lastMovedDistance = 0;
    return;
  }
  const dirX = dx / Math.max(distance, 0.001);
  const dirZ = dz / Math.max(distance, 0.001);
  const stateSpeedScale = isGreeter ? 1 : (member.state === 'pause' ? 0 : member.state === 'turn' ? 0.56 : member.state === 'yield' ? 0.34 : 1);
  const baseStep = Math.max(0, member.speed * Math.min(dt, 0.08) * stateSpeedScale);
  const nextPoint = tronRunnerCrowdNextPointScratch;
  nextPoint.x = current.x + dirX * Math.min(distance, baseStep);
  nextPoint.z = current.z + dirZ * Math.min(distance, baseStep);
  let collided = false;
  if (!isGreeter) {
    // The greeter walks straight to the player at normal pace, ignoring crowd jostling.
    const avoidance = crowdRuntime.avoidance(member, current, nextPoint, dirX, dirZ, dt, now);
    if (avoidance.speedScale < 1) {
      nextPoint.x = current.x + dirX * Math.min(distance, baseStep * avoidance.speedScale);
      nextPoint.z = current.z + dirZ * Math.min(distance, baseStep * avoidance.speedScale);
    }
    nextPoint.x += avoidance.x;
    nextPoint.z += avoidance.z;
    collided = crowdRuntime.resolveCollision(member, nextPoint);
    if (collided) {
      member.collisionCount += 1;
      member.waypointIndex = (member.waypointIndex + 1) % route.points.length;
      crowdRuntime.setState(member, 'avoid', now, yieldDurationMs);
    }
    crowdRuntime.tryDeadlockNudge(member, current, nextPoint, dirX, dirZ, distance, collided, now);
  }
  const movedDistance = Math.hypot(nextPoint.x - current.x, nextPoint.z - current.z);
  const surface = surfaceYForPoint(nextPoint.x, nextPoint.z);
  member.group.position.set(nextPoint.x, surface.y, nextPoint.z);
  member.group.rotation.y = lerpAngle(member.group.rotation.y, Math.atan2(dirX, dirZ), Math.min(1, dt * 8));
  if (isGreeter) crowdRuntime.applyGreeterHeadLook(member, dt); // head keeps tracking the player while walking
  member.surface = surface.surface;
  member.groundOffset = member.group.position.y - surface.groundY;
  member.distanceWalked += movedDistance;
  member.lastMovedDistance = movedDistance;
  if (movedDistance > 0.0005) member.lastMovedAt = now;
  member.lastCollision = collided;
}

export function updateTronRunnerCrowdRuntime(state, dt) {
  if (!state.crowdEnabled) return;
  const crowdRuntime = state.runtime();
  const { crowd, crowdGroup, stats } = state;
  crowdRuntime.processBuildQueue();
  if (!crowd.length) return;
  crowdRuntime.syncVisibility();
  if (!crowdGroup.visible) {
    state.accumulatedDt = 0;
    return;
  }
  state.accumulatedDt = Math.min(
    state.maxAccumulatedDt,
    state.accumulatedDt + Math.min(dt, 0.05)
  );
  if (state.accumulatedDt < state.updateInterval) {
    stats.skippedFrameCount += 1;
    return;
  }
  const step = state.updateInterval;
  state.accumulatedDt = Math.max(0, state.accumulatedDt - state.updateInterval);
  const now = state.now();
  const thinkStarted = now;
  stats.frame += 1;
  stats.updateCount += 1;
  stats.lastStepDt = step;
  stats.avoidancePairs = 0;
  stats.maxAvoidanceOverlap = 0;
  crowdRuntime.updateCulling();
  crowdRuntime.updateReflectionBudget();
  for (const member of crowd) state.syncMemberMatrixUpdates(member);
  crowdRuntime.prepareSpatialGrid();
  const talkRangeSq = state.talkRange * state.talkRange;
  const talkRearmRangeSq = state.talkRearmRange * state.talkRearmRange;
  for (const member of crowd) {
    // The greeter always updates (even when off-screen) so it reliably walks over to greet the player.
    const isGreeterMember = member.index === state.greeterIndex;
    // Ambient chatter: each non-greeter says one of its lines when the player comes within range,
    // re-arming once the player steps away (hysteresis). Cycles through the member's lines.
    if (!isGreeterMember && member.talkLines?.length) {
      const talkDx = state.camera.position.x - member.group.position.x;
      const talkDz = state.camera.position.z - member.group.position.z;
      const talkDistSq = talkDx * talkDx + talkDz * talkDz;
      if (member.talkArmed && talkDistSq <= talkRangeSq) {
        member.talkText = member.talkLines[member.talkCycle % member.talkLines.length];
        member.talkCycle += 1;
        member.talkStart = now;
        member.talkUntil = now + state.talkDurationMs;
        member.talkArmed = false;
      } else if (!member.talkArmed && talkDistSq > talkRearmRangeSq) {
        member.talkArmed = true;
      }
    }
    // While running to the board the greeter's run clip is driven by its own fixed timescale,
    // so skip the crowd's walk-tuned timescale management and the distance-driven walk sync.
    const greeterRunning = isGreeterMember && member.greetStage === 'toBoard';
    const nextEffectiveAnimationSpeed = state.runnerState.effectiveAnimationSpeed * (member.animationScaleOffset ?? 1);
    if (!greeterRunning && member.action && Math.abs((member.lastEffectiveAnimationSpeed ?? -1) - nextEffectiveAnimationSpeed) > 0.0001) {
      member.action.setEffectiveTimeScale(nextEffectiveAnimationSpeed);
      member.reflectionAction?.setEffectiveTimeScale(nextEffectiveAnimationSpeed);
      member.reflectionLedAction?.setEffectiveTimeScale(nextEffectiveAnimationSpeed);
      member.lastEffectiveAnimationSpeed = nextEffectiveAnimationSpeed;
    }
    member.speed = state.getWalkSpeed() * state.crowdSpeedScale * (member.speedScaleOffset ?? 1)
      * (isGreeterMember ? state.greeterSpeedMultiplier : 1)
      * (greeterRunning ? state.greeterRunSpeedBoost : 1);
    const cullingHidden = state.cullingEnabled && member.cullingVisible === false && !isGreeterMember;
    member.lodStride = isGreeterMember
      ? 1
      : (cullingHidden
        ? state.culledLodStride
        : (state.intelligenceEnabled ? crowdRuntime.lodStride(member) : 1));
    member.lodDt = Math.min(cullingHidden ? 0.34 : 0.14, (member.lodDt || 0) + step);
    member.mixerDt = Math.min(0.14, (member.mixerDt || 0) + step);
    const shouldUpdate = member.lodStride <= 1 || ((stats.frame + member.index) % member.lodStride === 0);
    if (!shouldUpdate) {
      member.lastMovedDistance = 0;
      if (!cullingHidden) {
        crowdRuntime.updateReflection(member);
        state.syncMemberMatrixUpdates(member, true);
      }
      continue;
    }
    const distanceDrivenWalk = state.distanceDrivenWalkEnabled && Boolean(member.action) && !member.greetPosed;
    if (!cullingHidden && !distanceDrivenWalk) member.mixer?.update(member.mixerDt);
    if (!cullingHidden && member.dynamicReflectionBudgetActive && !distanceDrivenWalk) {
      member.reflectionMixer?.update(member.mixerDt);
      member.reflectionLedMixer?.update(member.mixerDt);
    }
    const moveSubsteps = Math.max(1, Math.ceil(member.lodDt / state.maxMoveSubstep));
    const moveSubstepDt = member.lodDt / moveSubsteps;
    const distanceBefore = member.distanceWalked || 0;
    for (let stepIndex = 0; stepIndex < moveSubsteps; stepIndex += 1) {
      advanceTronRunnerCrowdMemberRuntime(state.advanceState, member, moveSubstepDt, now);
    }
    const movedThisUpdate = Math.max(0, (member.distanceWalked || 0) - distanceBefore);
    member.lastMovedDistance = movedThisUpdate;
    if (cullingHidden) state.syncMemberMatrixUpdates(member, true);
    if (!cullingHidden && distanceDrivenWalk && !member.greetPosed) {
      if (greeterRunning) syncTronRunnerCrowdRunCycleToDistance(member, state.greeterRunCycleDistance);
      else syncTronRunnerCrowdWalkCycleToDistance(member, member.walkCycleDistance ?? undefined);
    }
    if (!cullingHidden) {
      crowdRuntime.updateReflection(member);
      state.syncMemberMatrixUpdates(member, true);
    }
    member.mixerDt = 0;
    member.lodDt = 0;
  }
  stats.lastThinkMs = state.now() - thinkStarted;
  stats.maxThinkMs = Math.max(
    stats.maxThinkMs,
    stats.lastThinkMs
  );
}


// Era 1000: la folla restava nascosta un secondo dopo la fine della rivelazione della
// citta'. Ma il rez dei personaggi parte proprio li', dura 1400ms, e cosi' i primi mille
// erano invisibili: comparivano gia' formati per tre quarti, cioe' un popup (2026-09-18).
// L'attesa non e' sparita, si e' spostata in runner-reveal.js: il gruppo si accende quando
// il rez comincia, non un secondo dopo.
const TRON_RUNNER_CROWD_APPEAR_DELAY_MS = 0;

export function syncTronRunnerCrowdVisibilityState({
  crowd,
  group,
  state,
  crowdEnabled,
  cullingEnabled,
  getVisibleFactor,
  revealVisible,
  isRunnerReady,
  now,
  updateReflection,
  syncMemberMatrixUpdates,
}) {
  const visibleFactor = getVisibleFactor();
  const revealIsVisible = revealVisible(visibleFactor);
  const wouldShow = Boolean(crowdEnabled && revealIsVisible && isRunnerReady());
  if (!wouldShow) state.appearArmedAt = 0;
  else if (!state.appearArmedAt) state.appearArmedAt = now();
  const visible = wouldShow && (now() - state.appearArmedAt >= TRON_RUNNER_CROWD_APPEAR_DELAY_MS);
  const changed = group.visible !== visible;
  group.visible = visible;
  for (const member of crowd) {
    member.baseVisible = visible;
    if (!visible) {
      const memberChanged = member.group.visible !== false;
      member.group.visible = false;
      member.cullingVisible = false;
      member.cullingReason = 'group-hidden';
      if (changed || memberChanged) updateReflection(member);
      syncMemberMatrixUpdates(member, true);
      continue;
    }
    if (!cullingEnabled) {
      const memberChanged = member.group.visible !== true;
      member.group.visible = true;
      member.cullingVisible = true;
      member.cullingReason = 'visible';
      if (changed || memberChanged) updateReflection(member);
      syncMemberMatrixUpdates(member, true);
    }
  }
}

export function updateTronRunnerCrowdCullingRuntime({
  crowd,
  group,
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
  updateTronRunnerCrowdCullingState({
    crowd,
    groupVisible: group.visible,
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
  });
}

export function prepareTronRunnerCrowdSpatialGridRuntime({
  spatialGrid,
  crowd,
  stats,
  cullingEnabled,
  lodNearDistance,
  gridCoord,
  gridKey,
}) {
  prepareTronRunnerCrowdSpatialGrid(
    spatialGrid,
    crowd,
    stats,
    cullingEnabled,
    lodNearDistance,
    gridCoord,
    gridKey,
  );
}

export function nearbyTronRunnerCrowdMembersRuntime({
  spatialGrid,
  gridCoord,
  gridKey,
}, x, z) {
  return nearbyTronRunnerCrowdMembers(x, z, spatialGrid, gridCoord, gridKey);
}

export function tronRunnerCrowdLodStrideRuntime({
  distanceToCamera,
  nearDistance,
  midDistance,
}, member) {
  const distance = distanceToCamera(member);
  member.lodDistance = distance;
  return tronRunnerCrowdLodStrideCore(distance, nearDistance, midDistance);
}

// Reused argument objects: these wrappers run once (or more) per member per
// crowd tick at 45Hz, so a fresh options literal per call was thousands of
// short-lived objects a second in the nursery. Both cores read the object
// synchronously and keep no reference to it.
const tronRunnerCrowdDistanceArgs = {
  member: null,
  cameraPosition: null,
  stats: null,
  frame: 0,
  distanceCacheEnabled: false,
};

export function tronRunnerCrowdDistanceToCameraRuntime({
  camera,
  stats,
  distanceCacheEnabled,
}, member) {
  const args = tronRunnerCrowdDistanceArgs;
  args.member = member;
  args.cameraPosition = camera.position;
  args.stats = stats;
  args.frame = stats.frame;
  args.distanceCacheEnabled = distanceCacheEnabled;
  return tronRunnerCrowdDistanceToCameraCore(args);
}

export function setTronRunnerCrowdStateRuntime(member, state, now, durationMs = 0) {
  member.state = state;
  member.stateUntil = durationMs > 0 ? now + durationMs : 0;
}

export function normalizeTronRunnerCrowdStateRuntime({
  intelligenceEnabled,
}, member, now) {
  if (!intelligenceEnabled) {
    member.state = 'walk';
    member.stateUntil = 0;
    return;
  }
  if (!member.state) member.state = 'walk';
  if (member.stateUntil && now >= member.stateUntil) {
    member.state = 'walk';
    member.stateUntil = 0;
  }
}

const tronRunnerCrowdPointInsideRouteArgs = {
  member: null,
  x: 0,
  z: 0,
  pointInPolygon: null,
};

export function tronRunnerCrowdPointInsideRouteRuntime({
  pointInPolygon,
}, member, x, z) {
  const args = tronRunnerCrowdPointInsideRouteArgs;
  args.member = member;
  args.x = x;
  args.z = z;
  args.pointInPolygon = pointInPolygon;
  return tronRunnerCrowdPointInsideRouteCore(args);
}

export function resolveTronRunnerCrowdCollisionRuntime({
  collisionsEnabled,
  getColliderRecords,
  buildingGuard,
  pointInsideRoute,
}, member, point) {
  return resolveTronRunnerCrowdCollisionCore(
    member,
    point,
    collisionsEnabled,
    getColliderRecords,
    buildingGuard,
    pointInsideRoute,
  );
}

export function tronRunnerCrowdBuildingCollisionDiagnosticRuntime({
  getColliderRecords,
  padding,
}, member) {
  return tronRunnerCrowdBuildingCollisionDiagnosticCore({
    member,
    records: getColliderRecords(),
    padding,
    resolveRoundedCollider: resolveTronRunnerRoundedCollider,
    colliderLabel: tronRunnerCrowdColliderLabel,
  });
}

export function tronRunnerCrowdAvoidanceRuntime(
  deps,
  member,
  current,
  nextPoint,
  dirX,
  dirZ,
  dt,
  now,
) {
  return tronRunnerCrowdAvoidanceCore(member, current, nextPoint, dirX, dirZ, dt, now, deps);
}

export function tronRunnerCrowdTryDeadlockNudgeRuntime(
  deps,
  member,
  current,
  nextPoint,
  dirX,
  dirZ,
  distance,
  collided,
  now,
) {
  return tronRunnerCrowdTryDeadlockNudgeCore(member, current, nextPoint, dirX, dirZ, distance, collided, now, deps);
}

export function tronRunnerCrowdPostRevealReflectionRampLimitRuntime({
  stats,
  rampEnabled,
  rampMs,
  cityRevealWireframeEnabled,
  getCityRevealComplete,
  getCityRevealCompletedAt,
  postRevealElapsedMs,
}, maxLimit, now = performance.now()) {
  return tronRunnerCrowdPostRevealReflectionRampLimitCore({
    maxLimit,
    now,
    stats,
    rampEnabled,
    rampMs,
    cityRevealWireframeEnabled,
    cityRevealComplete: getCityRevealComplete(),
    cityRevealCompletedAt: getCityRevealCompletedAt(),
    postRevealElapsedMs,
  });
}

export function updateTronRunnerCrowdReflectionBudgetRuntime({
  stats,
  crowd,
  crowdGroup,
  reflectionCandidates,
  dynamicReflectionEnabled,
  getCrowdReflectionsIsolation,
  reflectionRevealEnabled,
  reflectionMaxActive,
  reflectionMinFps,
  reflectionNearDistance,
  getLatestMeasuredFps,
  getCityRevealComplete,
  postRevealElapsedMs,
  isCityRevealPerformanceCritical,
  distanceToCamera,
  rampLimit,
}) {
  updateTronRunnerCrowdReflectionBudgetCore({
    stats,
    crowd,
    crowdGroup,
    reflectionCandidates,
    dynamicReflectionEnabled,
    crowdReflectionsIsolation: getCrowdReflectionsIsolation(),
    reflectionRevealEnabled,
    reflectionMaxActive,
    reflectionMinFps,
    reflectionNearDistance,
    latestMeasuredFps: getLatestMeasuredFps(),
    cityRevealComplete: getCityRevealComplete(),
    postRevealElapsedMs,
    isCityRevealPerformanceCritical,
    distanceToCamera,
    rampLimit,
  });
}

export function createTronRunnerCrowdRuntime({
  crowd,
  group,
  camera,
  playerCollisionDistance,
  isCameraCollisionDisabled,
  buildImpl,
  updateImpl,
  inspectImpl,
  processBuildQueueImpl,
  drainBuildQueueImpl,
  resolveGreeterBoardAnchorImpl,
  startGreeterWalkingToBoardImpl,
  applyGreeterHeadLookImpl,
  setGreeterBubbleImpl,
  updateReflectionImpl,
  syncScaleAndGroundImpl,
  syncVisibilityImpl,
  updateCullingImpl,
  gridCoordImpl,
  postRevealElapsedMsImpl,
  colliderRecordsImpl,
  invalidateColliderRecordsImpl,
  prepareSpatialGridImpl,
  nearbyMembersImpl,
  lodStrideImpl,
  distanceToCameraImpl,
  setStateImpl,
  normalizeStateImpl,
  pointInsideRouteImpl,
  resolveCollisionImpl,
  buildingCollisionDiagnosticImpl,
  avoidanceImpl,
  tryDeadlockNudgeImpl,
  reflectionRampLimitImpl,
  updateReflectionBudgetImpl,
}) {
  function resolveCameraCollision() {
    if (isCameraCollisionDisabled()) return;
    if (!group.visible || !crowd.length) return;
    const minDist = playerCollisionDistance;
    const minDistSq = minDist * minDist;
    const px = camera.position.x;
    const pz = camera.position.z;
    for (const member of crowd) {
      const pos = member.group.position;
      const dx = px - pos.x;
      const dz = pz - pos.z;
      const distSq = dx * dx + dz * dz;
      if (distSq >= minDistSq) continue;
      if (distSq < 1e-6) {
        camera.position.x += minDist;
        continue;
      }
      const dist = Math.sqrt(distSq);
      const push = (minDist - dist) / dist;
      camera.position.x += dx * push;
      camera.position.z += dz * push;
    }
  }

  return {
    crowd,
    group,
    build: buildImpl,
    update: updateImpl,
    inspect: inspectImpl,
    processBuildQueue: processBuildQueueImpl,
    drainBuildQueue: drainBuildQueueImpl,
    resolveGreeterBoardAnchor: resolveGreeterBoardAnchorImpl,
    startGreeterWalkingToBoard: startGreeterWalkingToBoardImpl,
    applyGreeterHeadLook: applyGreeterHeadLookImpl,
    setGreeterBubble: setGreeterBubbleImpl,
    updateReflection: updateReflectionImpl,
    syncScaleAndGround: syncScaleAndGroundImpl,
    syncVisibility: syncVisibilityImpl,
    updateCulling: updateCullingImpl,
    gridCoord: gridCoordImpl,
    postRevealElapsedMs: postRevealElapsedMsImpl,
    colliderRecords: colliderRecordsImpl,
    invalidateColliderRecords: invalidateColliderRecordsImpl,
    prepareSpatialGrid: prepareSpatialGridImpl,
    nearbyMembers: nearbyMembersImpl,
    lodStride: lodStrideImpl,
    distanceToCamera: distanceToCameraImpl,
    setState: setStateImpl,
    normalizeState: normalizeStateImpl,
    pointInsideRoute: pointInsideRouteImpl,
    resolveCollision: resolveCollisionImpl,
    buildingCollisionDiagnostic: buildingCollisionDiagnosticImpl,
    avoidance: avoidanceImpl,
    tryDeadlockNudge: tryDeadlockNudgeImpl,
    reflectionRampLimit: reflectionRampLimitImpl,
    updateReflectionBudget: updateReflectionBudgetImpl,
    resolveCameraCollision,
  };
}
