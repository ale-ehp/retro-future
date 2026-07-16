import * as THREE from 'three';
import {
  GRID_BLOCK, MAIN_ROAD_Z, MAIN_ROAD_LENGTH, START_SIDE_EXTENSION, SIDE_BUILDING_BASE,
} from '../world/boulevard-constants.js';

// ---------- drone-intro cinematic ----------
// The opening "drone flight": an eased camera arc from its current position to the saved/auto landing
// pose, locking look + zeroing movement during the flight and toggling noclip on/off around it. This is
// a self-contained camera-cinematic leaf (A3a). Its private flight state lives here as module-level
// state; main.js drives it via updateDroneIntroFlight(now) each frame and starts it via
// startDroneIntroFlight()/scheduleDroneIntroAutoFlight(). The 4 external readers of the flight state read
// through getDroneIntroActive()/getDroneIntroProgress()/droneIntroInspect().
//
// Shared canonical camera orientation (yaw/pitch/viewRoll) and the movement-anim accumulators stay in
// main for now and are injected as getter+setter closures (their proper ctx.state home is the later
// camera-controls / movement phases). roadLandingPose / side-building geometry / dynamic-road dims are
// injected read-only. setTronNoclip is the already-extracted world/boundary-error.js binding.

const DRONE_INTRO_DURATION_MS = 5600;
const DRONE_INTRO_HERO_DURATION_MS = 7600;
const DRONE_INTRO_AUTO_DELAY_MS = 3000;
const DRONE_INTRO_AUTO_ENABLED = false;
const DRONE_INTRO_APPROACH_GAP = 18;
const DRONE_INTRO_LOOK_HEIGHT = 22;
const DRONE_INTRO_HERO_START_SIDE_OFFSET = GRID_BLOCK * 14;
const DRONE_INTRO_HERO_START_FORWARD_OFFSET = GRID_BLOCK * 18;
const DRONE_INTRO_HERO_START_HEIGHT = 56;
const DRONE_INTRO_HERO_ROLL = 0.075;

// ---------- module-private flight state ----------
const droneIntroStart = new THREE.Vector3();
const droneIntroTarget = new THREE.Vector3();
const droneIntroLookAt = new THREE.Vector3();
const droneIntroControlA = new THREE.Vector3();
const droneIntroControlB = new THREE.Vector3();
const droneIntroHeroLookAt = new THREE.Vector3();
const droneIntroHeroScratchA = new THREE.Vector3();
const droneIntroHeroScratchB = new THREE.Vector3();
const droneIntroHeroScratchC = new THREE.Vector3();
let droneIntroAutoTimer = 0;
let droneIntroAutoTriggered = false;
const droneIntroFlight = {
  active: false,
  startedAt: 0,
  durationMs: DRONE_INTRO_DURATION_MS,
  source: 'manual',
  startYaw: 0,
  startPitch: 0,
  targetYaw: 0,
  targetPitch: 0,
  arcLift: 0,
  progress: 0,
  heroShot: false,
};

// ---------- injected deps (assigned in initDroneIntro) ----------
let camera = null;
let controlEls = null;
let PITCH_LIMIT = Math.PI * 0.49;
let demoStartKey = 'Space';
// injected functions (same-name refs → bodies stay verbatim)
let lerpAngle = null;
let applyCameraLook = null;
let clearMovementKeys = null;
let removeViewMotionOffset = null;
let cameraGroundHeightAt = null;
let setButtonFeedback = null;
let updateStartPositionLiveLabel = null;
let setTronNoclip = null;
// getter/setter closures for reassignable main lets
let getYaw = null;
let setYaw = null;
let getPitch = null;
let setPitch = null;
let getViewRoll = null;
let setViewRoll = null;
let setHeadBobOffset = null;
let setSideSwayOffset = null;
let setMovementHorizontalSpeed = null;
let setMovementRunMix = null;
let getLast = null;
let getDroneLandingPose = null;
let getSideBuildingRecords = null;
let getSideBuildingDepthScale = null;
let getDynamicRoadCenter = null;
let getDynamicRoadLength = null;
let heroShotEnabled = false;

export function droneIntroHeroShotRequestedFromParams(params) {
  const raw = params?.get?.('heroShot') ?? params?.get?.('hero') ?? params?.get?.('intro');
  const normalized = String(raw || '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'hero';
}

function computeYawPitchForLookAt(position, target) {
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const dz = target.z - position.z;
  const horizontal = Math.max(0.0001, Math.hypot(dx, dz));
  return {
    yaw: Math.atan2(-dx, -dz),
    pitch: THREE.MathUtils.clamp(Math.atan2(dy, horizontal), -PITCH_LIMIT, PITCH_LIMIT),
  };
}

function droneIntroEase(t) {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

function droneIntroSmoothstep(edge0, edge1, value) {
  const x = THREE.MathUtils.clamp((value - edge0) / Math.max(0.00001, edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function cubicBezierVector(out, p0, p1, p2, p3, t) {
  droneIntroHeroScratchA.lerpVectors(p0, p1, t);
  droneIntroHeroScratchB.lerpVectors(p1, p2, t);
  droneIntroHeroScratchC.lerpVectors(p2, p3, t);
  droneIntroHeroScratchA.lerp(droneIntroHeroScratchB, t);
  droneIntroHeroScratchB.lerp(droneIntroHeroScratchC, t);
  return out.copy(droneIntroHeroScratchA).lerp(droneIntroHeroScratchB, t);
}

function applyHeroShotStartPose(target) {
  const side = target.x >= 0 ? -1 : 1;
  droneIntroStart.set(
    target.x + side * DRONE_INTRO_HERO_START_SIDE_OFFSET,
    Math.max(target.y + DRONE_INTRO_HERO_START_HEIGHT, DRONE_INTRO_HERO_START_HEIGHT),
    target.z + DRONE_INTRO_HERO_START_FORWARD_OFFSET
  );
  const openingLookAt = droneIntroHeroScratchC.set(
    target.lookAtX,
    Math.max(target.lookAtY + 36, droneIntroStart.y + 12),
    target.lookAtZ - GRID_BLOCK * 7
  );
  const openingLook = computeYawPitchForLookAt(droneIntroStart, openingLookAt);
  camera.position.copy(droneIntroStart);
  setYaw(openingLook.yaw);
  setPitch(openingLook.pitch);
  setViewRoll(-side * 0.045);
  applyCameraLook();
}

function configureHeroShotControls(target) {
  const side = droneIntroStart.x >= droneIntroTarget.x ? 1 : -1;
  const startAltitude = Math.max(droneIntroStart.y, droneIntroTarget.y + 120);
  droneIntroControlA.set(
    THREE.MathUtils.lerp(droneIntroStart.x, droneIntroTarget.x, 0.34),
    startAltitude + 74,
    THREE.MathUtils.lerp(droneIntroStart.z, droneIntroTarget.z, 0.22) - GRID_BLOCK * 7
  );
  droneIntroControlB.set(
    droneIntroTarget.x + side * GRID_BLOCK * 8,
    Math.max(droneIntroTarget.y + 92, startAltitude * 0.42),
    droneIntroTarget.z + GRID_BLOCK * 7
  );
  droneIntroHeroLookAt.set(
    target.lookAtX,
    Math.max(target.lookAtY + 28, droneIntroTarget.y + 62),
    target.lookAtZ - GRID_BLOCK * 4
  );
}

function applyHeroShotCamera(eased) {
  cubicBezierVector(camera.position, droneIntroStart, droneIntroControlA, droneIntroControlB, droneIntroTarget, eased);
  const lookTarget = droneIntroHeroScratchC.copy(droneIntroHeroLookAt).lerp(droneIntroLookAt, droneIntroSmoothstep(0.68, 1, eased));
  const heroLook = computeYawPitchForLookAt(camera.position, lookTarget);
  const settle = droneIntroSmoothstep(0.78, 1, eased);
  setYaw(lerpAngle(heroLook.yaw, droneIntroFlight.targetYaw, settle));
  setPitch(THREE.MathUtils.lerp(heroLook.pitch, droneIntroFlight.targetPitch, settle));
  const roll = Math.sin(Math.PI * eased) * DRONE_INTRO_HERO_ROLL * (1 - droneIntroSmoothstep(0.74, 1, eased));
  setViewRoll(roll);
}

export function computeDroneIntroTargetPose() {
  const droneLandingPose = getDroneLandingPose();
  if (droneLandingPose &&
      Number.isFinite(droneLandingPose.x) &&
      Number.isFinite(droneLandingPose.y) &&
      Number.isFinite(droneLandingPose.z)) {
    return {
      x: droneLandingPose.x,
      y: droneLandingPose.y,
      z: droneLandingPose.z,
      lookAtX: droneLandingPose.x,
      lookAtY: droneLandingPose.y + DRONE_INTRO_LOOK_HEIGHT,
      lookAtZ: droneLandingPose.z - GRID_BLOCK * 4,
      targetYaw: Number.isFinite(droneLandingPose.spawnYaw) ? droneLandingPose.spawnYaw : null,
      targetPitch: Number.isFinite(droneLandingPose.spawnPitch) ? droneLandingPose.spawnPitch : null,
      pairZ: droneLandingPose.z - GRID_BLOCK * 4,
      source: 'saved-landing',
    };
  }
  const visibleRecords = getSideBuildingRecords().filter((record) => record.mesh?.visible !== false);
  const roadMaxZ = getDynamicRoadCenter() + getDynamicRoadLength() / 2 - GRID_BLOCK;
  let pairZ = MAIN_ROAD_Z + MAIN_ROAD_LENGTH / 2 - START_SIDE_EXTENSION;
  let pairHalfDepth = SIDE_BUILDING_BASE * getSideBuildingDepthScale() / 2;
  if (visibleRecords.length) {
    pairZ = Math.max(...visibleRecords.map((record) => record.collider.z));
    const pairRecords = visibleRecords.filter((record) => Math.abs(record.collider.z - pairZ) < GRID_BLOCK);
    pairHalfDepth = Math.max(...pairRecords.map((record) => record.collider.hd || pairHalfDepth));
  }
  const z = Math.min(pairZ + pairHalfDepth + DRONE_INTRO_APPROACH_GAP, roadMaxZ);
  const y = cameraGroundHeightAt(0, z);
  return {
    x: 0,
    y,
    z,
    lookAtX: 0,
    lookAtY: y + DRONE_INTRO_LOOK_HEIGHT,
    lookAtZ: pairZ,
    targetYaw: null,
    targetPitch: null,
    pairZ,
    source: 'auto-pair',
  };
}

export function startDroneIntroFlight(options = {}) {
  const source = typeof options === 'string' ? options : 'manual';
  if (source === 'auto') droneIntroAutoTriggered = true;
  removeViewMotionOffset();
  clearMovementKeys();
  setTronNoclip(true, { silent: true });
  const target = computeDroneIntroTargetPose();
  droneIntroTarget.set(target.x, target.y, target.z);
  droneIntroLookAt.set(target.lookAtX, target.lookAtY, target.lookAtZ);
  if (heroShotEnabled) {
    applyHeroShotStartPose(target);
  } else {
    droneIntroStart.copy(camera.position);
  }
  configureHeroShotControls(target);
  const look = computeYawPitchForLookAt(droneIntroTarget, droneIntroLookAt);
  droneIntroFlight.active = true;
  droneIntroFlight.startedAt = performance.now();
  droneIntroFlight.heroShot = Boolean(heroShotEnabled);
  droneIntroFlight.durationMs = droneIntroFlight.heroShot ? DRONE_INTRO_HERO_DURATION_MS : DRONE_INTRO_DURATION_MS;
  droneIntroFlight.source = source;
  droneIntroFlight.startYaw = getYaw();
  droneIntroFlight.startPitch = getPitch();
  droneIntroFlight.targetYaw = Number.isFinite(target.targetYaw) ? target.targetYaw : look.yaw;
  droneIntroFlight.targetPitch = Number.isFinite(target.targetPitch) ? target.targetPitch : look.pitch;
  droneIntroFlight.arcLift = Math.min(90, Math.max(24, droneIntroStart.distanceTo(droneIntroTarget) * 0.08));
  droneIntroFlight.progress = 0;
  if (controlEls.droneIntroFlight) setButtonFeedback(controlEls.droneIntroFlight, 'Drone in volo');
  return window.__tronInspect?.();
}

export function scheduleDroneIntroAutoFlight() {
  if (droneIntroAutoTimer) window.clearTimeout(droneIntroAutoTimer);
  droneIntroAutoTriggered = false;
  if (!DRONE_INTRO_AUTO_ENABLED) return;
  droneIntroAutoTimer = window.setTimeout(() => {
    droneIntroAutoTimer = 0;
    if (!droneIntroFlight.active && droneIntroFlight.progress < 1) {
      startDroneIntroFlight('auto');
    }
  }, DRONE_INTRO_AUTO_DELAY_MS);
}

export function updateDroneIntroFlight(now) {
  if (!droneIntroFlight.active) return false;
  const raw = (now - droneIntroFlight.startedAt) / Math.max(1, droneIntroFlight.durationMs);
  const t = THREE.MathUtils.clamp(raw, 0, 1);
  const eased = droneIntroEase(t);
  droneIntroFlight.progress = eased;
  if (droneIntroFlight.heroShot) {
    applyHeroShotCamera(eased);
  } else {
    camera.position.lerpVectors(droneIntroStart, droneIntroTarget, eased);
    camera.position.y += Math.sin(Math.PI * eased) * droneIntroFlight.arcLift;
    setYaw(lerpAngle(droneIntroFlight.startYaw, droneIntroFlight.targetYaw, eased));
    setPitch(THREE.MathUtils.lerp(droneIntroFlight.startPitch, droneIntroFlight.targetPitch, eased));
    setViewRoll(THREE.MathUtils.lerp(getViewRoll(), 0, Math.min(1, 8 * Math.min(0.05, (now - getLast()) / 1000))));
  }
  setHeadBobOffset(0);
  setSideSwayOffset(0);
  setMovementHorizontalSpeed(0);
  setMovementRunMix(0);
  clearMovementKeys();
  applyCameraLook();
  if (t >= 1) {
    droneIntroFlight.active = false;
    droneIntroFlight.progress = 1;
    camera.position.copy(droneIntroTarget);
    setYaw(droneIntroFlight.targetYaw);
    setPitch(droneIntroFlight.targetPitch);
    setViewRoll(0);
    setTronNoclip(false, { silent: true });
    applyCameraLook();
    updateStartPositionLiveLabel();
  }
  return true;
}

// ---------- accessors for external readers (collision / reveal-gate / bloom / inspect) ----------
export function getDroneIntroActive() {
  return droneIntroFlight.active;
}

export function getDroneIntroProgress() {
  return droneIntroFlight.progress;
}

export function droneIntroInspect() {
  return {
    active: droneIntroFlight.active,
    progress: droneIntroFlight.progress,
    durationMs: droneIntroFlight.durationMs,
    triggerKey: demoStartKey,
    autoEnabled: DRONE_INTRO_AUTO_ENABLED,
    autoDelayMs: DRONE_INTRO_AUTO_DELAY_MS,
    autoTriggered: droneIntroAutoTriggered,
    autoPending: Boolean(droneIntroAutoTimer),
    source: droneIntroFlight.source,
    heroShotEnabled,
    heroShot: droneIntroFlight.heroShot,
    targetX: droneIntroTarget.x,
    targetY: droneIntroTarget.y,
    targetZ: droneIntroTarget.z,
    targetYaw: droneIntroFlight.targetYaw,
    targetPitch: droneIntroFlight.targetPitch,
  };
}

// ---------- init: wire deps + expose the manual window hook ----------
export function initDroneIntro(ctx, injected) {
  camera = ctx.camera;
  ({
    controlEls,
    PITCH_LIMIT,
    demoStartKey,
    lerpAngle,
    applyCameraLook,
    clearMovementKeys,
    removeViewMotionOffset,
    cameraGroundHeightAt,
    setButtonFeedback,
    updateStartPositionLiveLabel,
    setTronNoclip,
    getYaw,
    setYaw,
    getPitch,
    setPitch,
    getViewRoll,
    setViewRoll,
    setHeadBobOffset,
    setSideSwayOffset,
    setMovementHorizontalSpeed,
    setMovementRunMix,
    getLast,
    getDroneLandingPose,
    getSideBuildingRecords,
    getSideBuildingDepthScale,
    getDynamicRoadCenter,
    getDynamicRoadLength,
    heroShotEnabled = false,
  } = injected);

  window.startDroneIntroFlight = startDroneIntroFlight;
}
