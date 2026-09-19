// Le collisioni della camera: palazzi, folla e il bordo della strada esagonale.
//
// Spostato qui da main.js senza cambiare la logica (tappa 5, 2026-09-19). Cinque numeri
// regolabili (i due margini dai palazzi, l'interruttore del bordo strada, il suo margine
// e l'anticipo della camera) li scrive il pannello dei controlli e li leggono la scena e
// il cablaggio del personaggio: stanno nell'oggetto mutabile `collisioni`. Il vettore di
// appoggio riusato a ogni sonda resta privato.
//
// camera e roadHexBoundaryLimits arrivano da initCameraCollision(), chiamata dove
// stavano i tre numeri del bordo strada.
import * as THREE from 'three';
import { getDroneIntroActive } from './drone-intro.js';
import { player } from './player-state.js';
import { tronRunnerCrowdRuntime } from '../character/runner-wiring.js';
import { keys } from '../controls/keyboard.js';
import { movementVelocity } from '../controls/movement.js';
import {
  getTronNoclipEnabled,
  triggerRoadBoundaryPulse,
  triggerBoundaryError,
  clearBoundaryError,
} from '../world/boundary-error.js';
import { buildingColliders } from '../world/buildings.js';

/** @type {import('three').PerspectiveCamera} */ let camera = null;
let roadHexBoundaryLimits = () => /** @type {any} */ (null);

/** Le dipendenze da main.js, nello stesso punto in cui stava il codice. */
export function initCameraCollision(deps) {
  ({ camera, roadHexBoundaryLimits } = deps);
}

/** I cinque numeri che il pannello regola: fuori di qui si scrivono `collisioni.<nome>`. */
export const collisioni = {
  roadBoundaryCollisionEnabled: true,
  roadBoundaryCollisionMargin: 1.2,
  roadBoundaryCameraLead: 8,
  collisionPadding: 3,
  mainBuildingCollisionPadding: 7.4,
};

const roadBoundaryProbeVelocity = new THREE.Vector3();

export function isCameraCollisionDisabled() {
  return !player.cameraCollisionUnlockedByBackspace || getTronNoclipEnabled() || getDroneIntroActive();
}

function resolveRoundedRectCollider(c, padding) {
  const dx = camera.position.x - c.x;
  const dz = camera.position.z - c.z;
  const sx = dx >= 0 ? 1 : -1;
  const sz = dz >= 0 ? 1 : -1;
  const ax = Math.abs(dx);
  const az = Math.abs(dz);
  const hx = c.hw + padding;
  const hz = c.hd + padding;
  const radius = THREE.MathUtils.clamp((c.chamfer || 0) + padding, 0, Math.min(hx, hz) * 0.98);
  if (radius <= 0.001) {
    if (ax >= hx || az >= hz) return false;
    const pushX = hx - ax;
    const pushZ = hz - az;
    if (pushX < pushZ) camera.position.x = c.x + sx * hx;
    else camera.position.z = c.z + sz * hz;
    return true;
  }

  const innerX = hx - radius;
  const innerZ = hz - radius;
  const qx = ax - innerX;
  const qz = az - innerZ;
  if (qx > 0 && qz > 0) {
    const dist = Math.hypot(qx, qz);
    if (dist >= radius) return false;
    const nx = dist > 1e-5 ? qx / dist : Math.SQRT1_2;
    const nz = dist > 1e-5 ? qz / dist : Math.SQRT1_2;
    camera.position.x = c.x + sx * (innerX + nx * radius);
    camera.position.z = c.z + sz * (innerZ + nz * radius);
    return true;
  }

  if (ax >= hx || az >= hz) return false;
  const pushX = hx - ax;
  const pushZ = hz - az;
  if (pushX < pushZ) camera.position.x = c.x + sx * hx;
  else camera.position.z = c.z + sz * hz;
  return true;
}

export function resolveCameraBuildingCollision() {
  if (isCameraCollisionDisabled()) return;
  if (!buildingColliders.length) return;
  for (const c of buildingColliders) {
    const padding = c.role === 'main-building' ? collisioni.mainBuildingCollisionPadding : collisioni.collisionPadding;
    if (padding < 0) continue;
    const bottomY = c.y ?? 0;
    if (camera.position.y < bottomY - 2 || camera.position.y > bottomY + c.h + 4) continue;
    resolveRoundedRectCollider(c, padding);
  }
}

export function resolveCameraCrowdCollision() {
  tronRunnerCrowdRuntime?.resolveCameraCollision();
}

function hasRoadBoundaryLeadInput() {
  return Boolean(
    keys['KeyW'] || keys['ArrowUp'] ||
    keys['KeyS'] || keys['ArrowDown'] ||
    keys['KeyA'] || keys['ArrowLeft'] ||
    keys['KeyD'] || keys['ArrowRight']
  );
}

function isMovingTowardRoadBoundary(edge) {
  if (!hasRoadBoundaryLeadInput()) return false;
  const threshold = 0.05;
  if (edge === 'minX') return movementVelocity.x < -threshold;
  if (edge === 'maxX') return movementVelocity.x > threshold;
  if (edge === 'minZ') return movementVelocity.z < -threshold;
  return movementVelocity.z > threshold;
}

function handleRoadBoundaryHit(edge, showFeedback = isMovingTowardRoadBoundary(edge)) {
  if (showFeedback) {
    triggerRoadBoundaryPulse(edge);
    triggerBoundaryError(edge);
    return;
  }
  clearBoundaryError();
}

export function resolveCameraRoadHexBoundaryCollision() {
  if (isCameraCollisionDisabled()) return;
  if (!collisioni.roadBoundaryCollisionEnabled) return;
  const limits = roadHexBoundaryLimits();
  let probeX = camera.position.x;
  let probeZ = camera.position.z;
  if (collisioni.roadBoundaryCameraLead > 0 && hasRoadBoundaryLeadInput()) {
    roadBoundaryProbeVelocity.set(movementVelocity.x, 0, movementVelocity.z);
    if (roadBoundaryProbeVelocity.lengthSq() > 1e-4) {
      roadBoundaryProbeVelocity.normalize();
      probeX += roadBoundaryProbeVelocity.x * collisioni.roadBoundaryCameraLead;
      probeZ += roadBoundaryProbeVelocity.z * collisioni.roadBoundaryCameraLead;
    }
  }
  const minProbeX = Math.min(camera.position.x, probeX);
  const maxProbeX = Math.max(camera.position.x, probeX);
  const minProbeZ = Math.min(camera.position.z, probeZ);
  const maxProbeZ = Math.max(camera.position.z, probeZ);
  if (minProbeX < limits.minX) {
    const showFeedback = isMovingTowardRoadBoundary('minX');
    camera.position.x += limits.minX - minProbeX;
    movementVelocity.x = Math.max(0, movementVelocity.x);
    handleRoadBoundaryHit('minX', showFeedback);
  } else if (maxProbeX > limits.maxX) {
    const showFeedback = isMovingTowardRoadBoundary('maxX');
    camera.position.x += limits.maxX - maxProbeX;
    movementVelocity.x = Math.min(0, movementVelocity.x);
    handleRoadBoundaryHit('maxX', showFeedback);
  }

  if (minProbeZ < limits.minZ) {
    const showFeedback = isMovingTowardRoadBoundary('minZ');
    camera.position.z += limits.minZ - minProbeZ;
    movementVelocity.z = Math.max(0, movementVelocity.z);
    handleRoadBoundaryHit('minZ', showFeedback);
  } else if (maxProbeZ > limits.maxZ) {
    const showFeedback = isMovingTowardRoadBoundary('maxZ');
    camera.position.z += limits.maxZ - maxProbeZ;
    movementVelocity.z = Math.min(0, movementVelocity.z);
    handleRoadBoundaryHit('maxZ', showFeedback);
  }
}
