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
export let movementForwardMix = 0;
export let movementBackMix = 0;
export let movementStrafeMix = 0;
export let movementStrafeDirection = 0;

// Setters for the two mix values drone-intro drives (importers can't write a live binding).
export function setMovementHorizontalSpeed(v) { movementHorizontalSpeed = v; }
export function setMovementRunMix(v) { movementRunMix = v; }

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
