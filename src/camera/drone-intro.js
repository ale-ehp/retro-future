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
const DRONE_INTRO_HERO_DURATION_MS = 15200;
const DRONE_INTRO_AUTO_DELAY_MS = 3000;
const DRONE_INTRO_AUTO_ENABLED = false;
const DRONE_INTRO_APPROACH_GAP = 18;
const DRONE_INTRO_LOOK_HEIGHT = 22;
const DRONE_INTRO_HERO_EXPECTED_BUILDINGS = 13;
const DRONE_INTRO_HERO_ORBIT_TURNS = 1;
const DRONE_INTRO_HERO_ORBIT_PORTION = 0.68;
const DRONE_INTRO_HERO_MIN_ORBIT_RADIUS = GRID_BLOCK * 34;
const DRONE_INTRO_HERO_ORBIT_LIFT = 0;
const DRONE_INTRO_HERO_LANDING_LIFT = GRID_BLOCK * 7;
const DRONE_INTRO_HERO_ROLL = 0.052;

// ---------- module-private flight state ----------
const droneIntroStart = new THREE.Vector3();
const droneIntroTarget = new THREE.Vector3();
const droneIntroLookAt = new THREE.Vector3();
const droneIntroControlA = new THREE.Vector3();
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
let getDefaultDroneLandingPose = null;
let getSideBuildingRecords = null;
let getMainBuildingRecords = null;
let getSideBuildingDepthScale = null;
let getDynamicRoadCenter = null;
let getDynamicRoadLength = null;
let heroShotEnabled = false;
let droneIntroHeroOrbitRadius = 0;
let droneIntroHeroBuildingCount = 0;

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

function heroShotBuildingRecords() {
  return [
    ...(getSideBuildingRecords?.() || []),
    ...(getMainBuildingRecords?.() || []),
  ].filter((record) => record?.mesh?.visible !== false && record?.collider);
}

function configureHeroShotOrbit(target) {
  const records = heroShotBuildingRecords();
  droneIntroHeroBuildingCount = records.length;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let maxY = target.lookAtY + DRONE_INTRO_LOOK_HEIGHT;
  for (const record of records) {
    const collider = record.collider;
    const x = Number(collider.x);
    const z = Number(collider.z);
    const hw = Math.max(1, Number(collider.hw) || Number(record.baseW) * 0.5 || SIDE_BUILDING_BASE * 0.5);
    const hd = Math.max(1, Number(collider.hd) || Number(record.baseD) * 0.5 || SIDE_BUILDING_BASE * 0.5);
    const h = Number(collider.h);
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
    minX = Math.min(minX, x - hw);
    maxX = Math.max(maxX, x + hw);
    minZ = Math.min(minZ, z - hd);
    maxZ = Math.max(maxZ, z + hd);
    if (Number.isFinite(h)) maxY = Math.max(maxY, h);
  }
  const hasFullCityBounds = records.length >= DRONE_INTRO_HERO_EXPECTED_BUILDINGS
    && [minX, maxX, minZ, maxZ].every(Number.isFinite);
  const centerX = hasFullCityBounds ? (minX + maxX) * 0.5 : target.lookAtX;
  const centerZ = hasFullCityBounds ? (minZ + maxZ) * 0.5 : target.lookAtZ;
  const startRadius = Math.max(
    DRONE_INTRO_HERO_MIN_ORBIT_RADIUS,
    Math.hypot(droneIntroStart.x - centerX, droneIntroStart.z - centerZ)
  );
  droneIntroHeroOrbitRadius = startRadius;
  droneIntroControlA.set(
    centerX,
    droneIntroStart.y,
    centerZ
  );
  droneIntroHeroLookAt.set(
    centerX,
    Math.max(target.lookAtY + 84, maxY * 0.5),
    centerZ
  );
}

function computeHeroShotOrbitCamera(out, orbitProgress) {
  const startDx = droneIntroStart.x - droneIntroControlA.x;
  const startDz = droneIntroStart.z - droneIntroControlA.z;
  const startRadius = droneIntroHeroOrbitRadius || Math.max(DRONE_INTRO_HERO_MIN_ORBIT_RADIUS, Math.hypot(startDx, startDz));
  const startAngle = Math.atan2(startDz, startDx);
  const angle = startAngle + Math.PI * 2 * DRONE_INTRO_HERO_ORBIT_TURNS * orbitProgress;
  return out.set(
    droneIntroControlA.x + Math.cos(angle) * startRadius,
    droneIntroStart.y + Math.sin(Math.PI * orbitProgress) * DRONE_INTRO_HERO_ORBIT_LIFT,
    droneIntroControlA.z + Math.sin(angle) * startRadius
  );
}

function applyHeroShotCamera(raw, eased) {
  const orbitProgress = droneIntroSmoothstep(0, DRONE_INTRO_HERO_ORBIT_PORTION, raw);
  const landingProgress = droneIntroSmoothstep(DRONE_INTRO_HERO_ORBIT_PORTION, 1, raw);
  computeHeroShotOrbitCamera(droneIntroHeroScratchA, orbitProgress);
  camera.position.copy(droneIntroHeroScratchA);
  if (landingProgress > 0) {
    camera.position.lerp(droneIntroTarget, landingProgress);
    camera.position.y += Math.sin(Math.PI * landingProgress) * DRONE_INTRO_HERO_LANDING_LIFT;
  }
  const lookSettle = droneIntroSmoothstep(0.82, 1, raw);
  const lookTarget = droneIntroHeroScratchC.copy(droneIntroHeroLookAt).lerp(droneIntroLookAt, lookSettle);
  const heroLook = computeYawPitchForLookAt(camera.position, lookTarget);
  const openingLookBlend = droneIntroSmoothstep(0.04, 0.18, raw);
  const cinematicYaw = lerpAngle(droneIntroFlight.startYaw, heroLook.yaw, openingLookBlend);
  const cinematicPitch = THREE.MathUtils.lerp(droneIntroFlight.startPitch, heroLook.pitch, openingLookBlend);
  setYaw(lerpAngle(cinematicYaw, droneIntroFlight.targetYaw, lookSettle));
  setPitch(THREE.MathUtils.lerp(cinematicPitch, droneIntroFlight.targetPitch, lookSettle));
  const roll = Math.sin(Math.PI * eased) * DRONE_INTRO_HERO_ROLL * (1 - droneIntroSmoothstep(0.78, 1, raw));
  setViewRoll(roll);
}

export function computeDroneIntroTargetPose() {
  const heroShotDefaultLandingPose = heroShotEnabled && getDefaultDroneLandingPose
    ? getDefaultDroneLandingPose()
    : null;
  const droneLandingPose = heroShotDefaultLandingPose || getDroneLandingPose();
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
  droneIntroStart.copy(camera.position);
  if (heroShotEnabled) configureHeroShotOrbit(target);
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
    applyHeroShotCamera(t, eased);
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
    heroOrbitBuildingCount: droneIntroHeroBuildingCount,
    heroOrbitRadius: droneIntroHeroOrbitRadius,
    heroOrbitCenterX: droneIntroControlA.x,
    heroOrbitCenterY: droneIntroControlA.y,
    heroOrbitCenterZ: droneIntroControlA.z,
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
    getDefaultDroneLandingPose,
    getSideBuildingRecords,
    getMainBuildingRecords,
    getSideBuildingDepthScale,
    getDynamicRoadCenter,
    getDynamicRoadLength,
    heroShotEnabled = false,
  } = injected);

  window.startDroneIntroFlight = startDroneIntroFlight;
}
