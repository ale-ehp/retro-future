// ---------- player movement physics ----------
// applyMovement is the per-frame player locomotion step (keyboard + mobile pad -> camera position),
// extracted in A3c. It owns the movement velocity and the derived movement-mix state; the four
// collision resolvers (building / crowd / road-hex boundary / walk-surface) still live in main and
// are injected here, and they mutate the shared movementVelocity in place.
//
// movementVelocity is an exported shared Vector3 (mutated in place by applyMovement AND by main's
// collision resolvers + reset handlers + the boundary-error module that receives it by reference) —
// §4 shared-mutable-object pattern, like mobileTouchControlsState. The six movement-mix values are
// exported `let`s that main's walk-sim / footstep / player-body read via ES-module live bindings;
// drone-intro writes horizontalSpeed/runMix through the exported setters. Tuning params (speedBase,
// ...) stay main-owned (UI-tunable) and are injected as live getters; `keys` is injected by
// reference (the keyboard listeners + their slice promotion move out of main in a later commit).
// mobileTouchControlsState is imported directly (already its own extracted module).

import * as THREE from 'three';
import { mobileTouchControlsState } from './mobile-movement.js';

// ---------- exported shared state ----------
export const movementVelocity = new THREE.Vector3();
export let movementRunMix = 0;
export let movementHorizontalSpeed = 0;
// forwardMix/backMix are read only inside this module (applyMovement + updateWalkSimulation), so
// they stay module-private; strafeMix/strafeDirection are also read by main's player-body, so export.
let movementForwardMix = 0;
let movementBackMix = 0;
export let movementStrafeMix = 0;
export let movementStrafeDirection = 0;

// Setters for the two mix values drone-intro drives (importers can't write a live binding).
export function setMovementHorizontalSpeed(v) { movementHorizontalSpeed = v; }
export function setMovementRunMix(v) { movementRunMix = v; }

// Head-bob / walk-simulation state (A3c-3): walk-sim owns these. main's view-motion bracket
// (applyViewMotionOffset) and footstep cadence read them via live bindings; drone-intro + spawn /
// reset write headBobOffset/sideSwayOffset through the exported setters. viewRoll stays main-owned
// (camera), reached here via injected get/setViewRoll.
export let stepPhase = 0;
export let headBobOffset = 0;
export let sideSwayOffset = 0;
export function setHeadBobOffset(v) { headBobOffset = v; }
export function setSideSwayOffset(v) { sideSwayOffset = v; }

// ---------- module-private scratch ----------
const moveVec = new THREE.Vector3();
const desiredVelocity = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

// ---------- injected deps (assigned in initMovement) ----------
let camera = null;
let keys = null;
let getSpeedBase = null;
let getSpeedSprint = null;
let getBackwardSpeedScale = null;
let getStrafeSpeedScale = null;
let getDiagonalSpeedScale = null;
let getVerticalSpeed = null;
let getMovementAcceleration = null;
let getMovementDeceleration = null;
let resolveCameraBuildingCollision = null;
let resolveCameraCrowdCollision = null;
let resolveCameraRoadHexBoundaryCollision = null;
let resolveCameraWalkSurface = null;
let getHeadMotionSmoothing = null;
let getWalkBobAmount = null;
let getRunBobAmount = null;
let getStrafeBobScale = null;
let getBackwardBobScale = null;
let getWalkStepRate = null;
let getRunStepRate = null;
let getStepSnapAmount = null;
let getMovementSwayAmount = null;
let getMovementRollAmount = null;
let getStrafeLeanAmount = null;
let getViewRoll = null;
let setViewRoll = null;
let resetFootstepCadence = null;
let updateFootstepAudioFromWalk = null;
let setFixedCameraFov = null;
let applyCameraLook = null;

export function initMovement(ctx, deps) {
  camera = ctx.camera;
  keys = deps.keys;
  getSpeedBase = deps.getSpeedBase;
  getSpeedSprint = deps.getSpeedSprint;
  getBackwardSpeedScale = deps.getBackwardSpeedScale;
  getStrafeSpeedScale = deps.getStrafeSpeedScale;
  getDiagonalSpeedScale = deps.getDiagonalSpeedScale;
  getVerticalSpeed = deps.getVerticalSpeed;
  getMovementAcceleration = deps.getMovementAcceleration;
  getMovementDeceleration = deps.getMovementDeceleration;
  resolveCameraBuildingCollision = deps.resolveCameraBuildingCollision;
  resolveCameraCrowdCollision = deps.resolveCameraCrowdCollision;
  resolveCameraRoadHexBoundaryCollision = deps.resolveCameraRoadHexBoundaryCollision;
  resolveCameraWalkSurface = deps.resolveCameraWalkSurface;
  getHeadMotionSmoothing = deps.getHeadMotionSmoothing;
  getWalkBobAmount = deps.getWalkBobAmount;
  getRunBobAmount = deps.getRunBobAmount;
  getStrafeBobScale = deps.getStrafeBobScale;
  getBackwardBobScale = deps.getBackwardBobScale;
  getWalkStepRate = deps.getWalkStepRate;
  getRunStepRate = deps.getRunStepRate;
  getStepSnapAmount = deps.getStepSnapAmount;
  getMovementSwayAmount = deps.getMovementSwayAmount;
  getMovementRollAmount = deps.getMovementRollAmount;
  getStrafeLeanAmount = deps.getStrafeLeanAmount;
  getViewRoll = deps.getViewRoll;
  setViewRoll = deps.setViewRoll;
  resetFootstepCadence = deps.resetFootstepCadence;
  updateFootstepAudioFromWalk = deps.updateFootstepAudioFromWalk;
  setFixedCameraFov = deps.setFixedCameraFov;
  applyCameraLook = deps.applyCameraLook;
}

export function clearVerticalMovementState() {
  keys.KeyE = false;
  keys.Space = false;
  keys.KeyQ = false;
  keys.KeyC = false;
  movementVelocity.y = 0;
  desiredVelocity.y = 0;
}

export function clearMovementKeys() {
  for (const key in keys) keys[key] = false;
  movementVelocity.set(0, 0, 0);
  desiredVelocity.set(0, 0, 0);
}

export function applyMovement(dt) {
  const speedBase = getSpeedBase();
  const speedSprint = getSpeedSprint();
  const backwardSpeedScale = getBackwardSpeedScale();
  const strafeSpeedScale = getStrafeSpeedScale();
  const diagonalSpeedScale = getDiagonalSpeedScale();
  const verticalSpeed = getVerticalSpeed();
  const movementAcceleration = getMovementAcceleration();
  const movementDeceleration = getMovementDeceleration();
  desiredVelocity.set(0, 0, 0);
  moveVec.set(0, 0, 0);
  let mx = 0, mz = 0, my = 0;
  if (keys['KeyW'] || keys['ArrowUp'])    mz -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  mz += 1;
  if (keys['KeyA'] || keys['ArrowLeft'])  mx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
  if (mobileTouchControlsState.movement.enabled && mobileTouchControlsState.movement.magnitude > 0) {
    mx += mobileTouchControlsState.movement.x;
    mz += mobileTouchControlsState.movement.z;
  }
  if (keys['KeyE'] || keys['Space'])      my += 1;
  if (keys['KeyQ'] || keys['KeyC'])       my -= 1;

  const hasHorizontalInput = mx !== 0 || mz !== 0;
  const hasVerticalInput = my !== 0;
  const hasInput = hasHorizontalInput || hasVerticalInput;
  const speed = (keys['ShiftLeft'] || keys['ShiftRight']) ? speedSprint : speedBase;

  if (hasHorizontalInput) {
    const forwardIntent = mz < 0 ? Math.abs(mz) : 0;
    const backIntent = mz > 0 ? Math.abs(mz) : 0;
    const strafeIntent = Math.abs(mx);
    const intentTotal = Math.max(0.0001, forwardIntent + backIntent + strafeIntent);
    movementForwardMix = forwardIntent / intentTotal;
    movementBackMix = backIntent / intentTotal;
    movementStrafeMix = strafeIntent / intentTotal;
    movementStrafeDirection = mx === 0 ? 0 : Math.sign(mx);

    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();
    right.crossVectors(forward, UP).normalize();

    moveVec.addScaledVector(forward, -mz);
    moveVec.addScaledVector(right, mx);
    moveVec.normalize();
    const directionSpeedScale =
      movementForwardMix +
      movementBackMix * backwardSpeedScale +
      movementStrafeMix * strafeSpeedScale;
    const diagonalScale = mx !== 0 && mz !== 0 ? diagonalSpeedScale : 1;
    const analogScale = THREE.MathUtils.clamp(Math.hypot(mx, mz), 0, 1);
    desiredVelocity.addScaledVector(moveVec, speed * directionSpeedScale * diagonalScale * analogScale);
  } else if (movementVelocity.lengthSq() < 0.0004) {
    movementForwardMix = 0;
    movementBackMix = 0;
    movementStrafeMix = 0;
    movementStrafeDirection = 0;
  }

  if (hasVerticalInput) desiredVelocity.y = my * verticalSpeed;

  const response = hasInput ? movementAcceleration : movementDeceleration;
  movementVelocity.lerp(desiredVelocity, Math.min(1, response * dt));
  if (!hasInput && movementVelocity.lengthSq() < 0.0004) movementVelocity.set(0, 0, 0);

  movementHorizontalSpeed = Math.hypot(movementVelocity.x, movementVelocity.z);
  movementRunMix = THREE.MathUtils.clamp(
    (movementHorizontalSpeed - speedBase * 0.65) / Math.max(1, speedSprint - speedBase * 0.65),
    0,
    1
  );

  if (movementVelocity.lengthSq() <= 0.000001) {
    resolveCameraBuildingCollision();
    resolveCameraRoadHexBoundaryCollision();
    resolveCameraCrowdCollision();
    resolveCameraWalkSurface(hasVerticalInput);
    return;
  }

  camera.position.addScaledVector(movementVelocity, dt);
  resolveCameraBuildingCollision();
  resolveCameraRoadHexBoundaryCollision();
  resolveCameraCrowdCollision();

  resolveCameraWalkSurface(hasVerticalInput);
}

export function updateWalkSimulation(dt) {
  const speedBase = getSpeedBase();
  const speedSprint = getSpeedSprint();
  const movementDeceleration = getMovementDeceleration();
  const headMotionSmoothing = getHeadMotionSmoothing();
  const walkBobAmount = getWalkBobAmount();
  const runBobAmount = getRunBobAmount();
  const strafeBobScale = getStrafeBobScale();
  const backwardBobScale = getBackwardBobScale();
  const walkStepRate = getWalkStepRate();
  const runStepRate = getRunStepRate();
  const stepSnapAmount = getStepSnapAmount();
  const movementSwayAmount = getMovementSwayAmount();
  const movementRollAmount = getMovementRollAmount();
  const strafeLeanAmount = getStrafeLeanAmount();
  const moveFactor = THREE.MathUtils.clamp(movementHorizontalSpeed / Math.max(1, speedBase), 0, 1);
  const smoothing = Math.min(1, headMotionSmoothing * dt);
  if (moveFactor < 0.01) {
    const settle = Math.min(1, movementDeceleration * dt);
    headBobOffset = THREE.MathUtils.lerp(headBobOffset, 0, settle);
    sideSwayOffset = THREE.MathUtils.lerp(sideSwayOffset, 0, settle);
    setViewRoll(THREE.MathUtils.lerp(getViewRoll(), 0, settle));
    resetFootstepCadence();
    setFixedCameraFov();
    applyCameraLook();
    return;
  }

  const targetSpeed = THREE.MathUtils.lerp(speedBase, speedSprint, movementRunMix);
  const cadence = THREE.MathUtils.lerp(walkStepRate, runStepRate, movementRunMix);
  const pace = THREE.MathUtils.clamp(movementHorizontalSpeed / Math.max(1, targetSpeed), 0.35, 1.8);
  stepPhase += dt * cadence * Math.PI * 2 * pace;
  updateFootstepAudioFromWalk(moveFactor);

  const directionBobScale = movementForwardMix +
    movementStrafeMix * strafeBobScale +
    movementBackMix * backwardBobScale;
  const amount = THREE.MathUtils.lerp(walkBobAmount, runBobAmount, movementRunMix) * moveFactor * directionBobScale;
  const snapPower = THREE.MathUtils.lerp(1.2, 4.2, stepSnapAmount);
  const footPulse = Math.pow(Math.abs(Math.sin(stepPhase)), snapPower);
  const targetHeadBob = footPulse * amount;

  const swayStrength = movementSwayAmount * moveFactor * (0.85 + movementRunMix * 0.45);
  const targetSideSway = Math.sin(stepPhase) * swayStrength;
  const stepRoll = Math.sin(stepPhase) * movementRollAmount * moveFactor * (0.85 + movementRunMix * 0.65);
  const targetRoll = stepRoll - movementStrafeDirection * strafeLeanAmount * moveFactor;

  headBobOffset = THREE.MathUtils.lerp(headBobOffset, targetHeadBob, smoothing);
  sideSwayOffset = THREE.MathUtils.lerp(sideSwayOffset, targetSideSway, smoothing);
  setViewRoll(THREE.MathUtils.lerp(getViewRoll(), targetRoll, smoothing));
  setFixedCameraFov();
  applyCameraLook();
}
