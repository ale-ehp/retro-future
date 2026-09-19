// Lo stato del giocatore: dove guarda, dove nasce, quanto corre, su cosa cammina.
//
// Spostato qui da main.js senza cambiare la logica (tappa 5, 2026-09-19). Sono i 33
// numeri che il pannello dei controlli scrive e che il ciclo dei frame legge a ogni
// fotogramma: stavano sparsi in main in tre punti diversi (posa e spawn, parametri
// del movimento, superficie di cammino).
//
// Stanno tutti nell'oggetto mutabile `player`, perche' tutti attraversano il confine:
// `yaw` si scrive `player.yaw`. I due blocchi di appoggio riusati a ogni fotogramma
// (l'Euler della camera, lo scarto del passo) restano privati.
//
// camera e isCameraCollisionDisabled arrivano da initPlayerState(), chiamata in
// main.js dove stava `let yaw, pitch`.
import * as THREE from 'three';
import { PLAYER_SPAWN_DEFAULT_Z, WALK_SURFACE_SNAP_TOLERANCE } from '../config/costanti.js';
import { headBobOffset, sideSwayOffset, movementVelocity } from '../controls/movement.js';
import { basePadAtPoint } from '../world/base-pads.js';
import { roadTileTopY } from '../world/hex-tiles.js';

/** @type {import('three').PerspectiveCamera} */ let camera = null;
let isCameraCollisionDisabled = () => false;

/** Le dipendenze da main.js, nello stesso punto in cui stava `let yaw, pitch`. */
export function initPlayerState(deps) {
  ({ camera, isCameraCollisionDisabled } = deps);
}

export const DEFAULT_PLAYER_SPAWN = Object.freeze({
  x: 1021.9157138958009,
  y: 591.0351224586902,
  z: PLAYER_SPAWN_DEFAULT_Z,
  spawnYaw: 0.6598680604188623,
  spawnPitch: -0.4052322239066757,
});
export const DEFAULT_DRONE_LANDING_POSE = Object.freeze({
  x: 0,
  y: 4.1,
  z: 828.8697008214727,
  spawnYaw: 0,
  spawnPitch: 0.24349025257385304,
  savedAt: '2026-06-09T13:01:07.101Z',
});

/** I 33 numeri del giocatore: fuori di qui si scrivono \`player.<nome>\`. */
export const player = {
  yaw: 0,
  pitch: 0,
  // il tipo esplicito serve: DEFAULT_* sono congelati, quindi tsc ne deduce i numeri
  // esatti come tipo e ogni scrittura diventerebbe un errore
  /** @type {{ x: number, y: number, z: number, spawnYaw: number, spawnPitch: number, savedAt?: string }} */
  playerSpawn: { ...DEFAULT_PLAYER_SPAWN },
  /** @type {{ x: number, y: number, z: number, spawnYaw: number, spawnPitch: number, savedAt?: string }} */
  droneLandingPose: { ...DEFAULT_DRONE_LANDING_POSE },
  backspaceIntroTriggered: false,
  sceneBootComplete: false,
  cameraCollisionUnlockedByBackspace: false,
  mouseSensitivityScale: 1,
  cameraMinHeight: 1.8,
  viewRoll: 0,
  tronDiscRevealWaitingActive: false,
  speedBase: 28,  // units / sec,
  speedSprint: 90,
  backwardSpeedScale: 0.72,
  strafeSpeedScale: 0.86,
  diagonalSpeedScale: 1.0,
  verticalSpeed: 34,
  movementAcceleration: 12,
  movementDeceleration: 10,
  walkBobAmount: 0.16,
  runBobAmount: 0.34,
  strafeBobScale: 0.72,
  backwardBobScale: 0.55,
  walkStepRate: 1.75,
  runStepRate: 3.0,
  stepSnapAmount: 0.35,
  movementSwayAmount: 0.08,
  movementRollAmount: 0.018,
  strafeLeanAmount: 0.035,
  headMotionSmoothing: 18,
  walkSurfaceLift: 0,
  walkSurfaceKind: 'road',
  activeWalkSurfacePad: null,
};

// reused scratch (order 'YXZ') to avoid allocating a THREE.Euler on every applyCameraLook call
// (runs once per frame plus once per mousemove/touchmove)
const applyCameraLookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
export function applyCameraLook() {
  applyCameraLookEuler.set(player.pitch, player.yaw, player.viewRoll);
  camera.quaternion.setFromEuler(applyCameraLookEuler);
}
export function lerpAngle(from, to, t) {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * t;
}
// lo scarto applicato alla camera dal passo e dall'ondeggiamento, riusato a ogni fotogramma
const appliedHeadMotion = new THREE.Vector3();

export function removeViewMotionOffset() {
  if (appliedHeadMotion.lengthSq() <= 0) return;
  camera.position.sub(appliedHeadMotion);
  appliedHeadMotion.set(0, 0, 0);
}

export function applyViewMotionOffset() {
  appliedHeadMotion.set(
    Math.cos(player.yaw) * sideSwayOffset,
    headBobOffset,
    -Math.sin(player.yaw) * sideSwayOffset
  );
  camera.position.add(appliedHeadMotion);
}

function walkSurfaceLiftAt(x, z) {
  const padHit = basePadAtPoint(x, z);
  player.activeWalkSurfacePad = padHit?.pad || null;
  player.walkSurfaceKind = padHit ? 'sidewalk' : 'road';
  if (!padHit) return 0;
  return Math.max(0, (padHit.topY ?? roadTileTopY()) - roadTileTopY());
}

export function cameraGroundHeightAt(x, z) {
  return player.cameraMinHeight + walkSurfaceLiftAt(x, z);
}

export function resolveCameraWalkSurface(hasVerticalInput) {
  if (isCameraCollisionDisabled()) return;
  const previousGroundY = player.cameraMinHeight + player.walkSurfaceLift;
  const targetGroundY = cameraGroundHeightAt(camera.position.x, camera.position.z);
  const closeToWalkSurface = camera.position.y <= Math.max(previousGroundY, targetGroundY) + WALK_SURFACE_SNAP_TOLERANCE;

  if (camera.position.y < targetGroundY || (!hasVerticalInput && closeToWalkSurface)) {
    camera.position.y = targetGroundY;
    if (movementVelocity.y < 0 || !hasVerticalInput) movementVelocity.y = 0;
  }

  player.walkSurfaceLift = Math.max(0, targetGroundY - player.cameraMinHeight);
}
