// Il cablaggio del personaggio e della folla: materiali e texture della tuta, luci e
// ombre, la folla con le sue rotte, collisioni, LOD e riflessi, il saluto del greeter,
// l'orchestrazione e i cursori del pannello che regolano tutto questo.
//
// Spostato qui da main.js senza cambiare la logica (tappa 5, 2026-09-19). I pezzi che
// FANNO il lavoro stanno gia' in character/: qui c'e' quello che li lega alla scena.
//
// Perche' c'e' initRunnerWiring() e non solo codice di modulo: questo dominio COSTRUISCE
// (scene.add, materiali dal renderer, runtime con dentro camera e controlli). Quel codice
// non puo' girare all'import, perche' main.js importa questo file prima di creare scena,
// camera e renderer. Quindi i binding sono dichiarati qui in cima e l'assegnazione sta
// dentro initRunnerWiring(), nello stesso ordine di prima; le funzioni restano a livello
// di modulo. main.js chiama initRunnerWiring() esattamente dove stava il codice.
//
// Nessun oggetto di stato condiviso: i 25 cursori (luci, materiali, ombre, scala,
// velocita') li legge e li scrive solo applyCharacterControlsFromUI, che e' venuta
// qui dentro con loro. Fuori si leggono solo oggetti gia' costruiti.
import { playFootstepForSurface, waitForNextFrame } from '../audio/player-footsteps.js';
import { computeDroneIntroTargetPose } from '../camera/drone-intro.js';
import { resolveTronRunnerRoundedCollider } from './character-collision.js';
import { computeTronRunnerEffectiveAnimationSpeed, tronRunnerCrowdGridKey } from './character-movement.js';
import { tronRunnerCrowdRecordRoadDir } from './character-routes.js';
import {
  makeTronRunnerSuitEmissiveTexture,
  makeTronRunnerSuitLedMaskTexture,
  makeTronRunnerSuitTexture,
} from './character-textures.js';
import {
  TRON_RUNNER_CHARACTER_LED_BLOOM_BOOST,
  TRON_RUNNER_CHARACTER_LED_BRIGHTNESS_MULTIPLIER,
  TRON_RUNNER_CHARACTER_LED_EMISSIVE_MAX,
  TRON_RUNNER_CROWD_AVOIDANCE_ENABLED,
  TRON_RUNNER_CROWD_AVOIDANCE_RADIUS,
  TRON_RUNNER_CROWD_AVOIDANCE_STRENGTH,
  TRON_RUNNER_CROWD_BUILDING_GUARD,
  TRON_RUNNER_CROWD_COLLISIONS_ENABLED,
  TRON_RUNNER_CROWD_COUNT,
  TRON_RUNNER_CROWD_CULLED_LOD_STRIDE,
  TRON_RUNNER_CROWD_CULLING_ENABLED,
  TRON_RUNNER_CROWD_CULL_DISTANCE,
  TRON_RUNNER_CROWD_CULL_RADIUS,
  TRON_RUNNER_CROWD_DEADLOCK_MOVE_EPS,
  TRON_RUNNER_CROWD_DEADLOCK_MS,
  TRON_RUNNER_CROWD_DEADLOCK_NUDGE,
  TRON_RUNNER_CROWD_DISTANCE_CACHE_ENABLED,
  TRON_RUNNER_CROWD_DISTANCE_DRIVEN_WALK_ENABLED,
  TRON_RUNNER_CROWD_ENABLED,
  TRON_RUNNER_CROWD_GROUND_OFFSET,
  TRON_RUNNER_CROWD_INTELLIGENCE_ENABLED,
  TRON_RUNNER_CROWD_LOD_MID_DISTANCE,
  TRON_RUNNER_CROWD_LOD_NEAR_DISTANCE,
  TRON_RUNNER_CROWD_MAX_ACCUMULATED_DT,
  TRON_RUNNER_CROWD_MAX_MOVE_SUBSTEP,
  TRON_RUNNER_CROWD_PASSING_PUSH,
  TRON_RUNNER_CROWD_PATH_MODE,
  TRON_RUNNER_CROWD_PLAYER_AVOIDANCE_ENABLED,
  TRON_RUNNER_CROWD_PLAYER_AVOIDANCE_RADIUS,
  TRON_RUNNER_CROWD_PLAYER_AVOIDANCE_STRENGTH,
  TRON_RUNNER_CROWD_REACH_RADIUS,
  TRON_RUNNER_CROWD_REFLECTION_MAX_ACTIVE,
  TRON_RUNNER_CROWD_REFLECTION_MIN_FPS,
  TRON_RUNNER_CROWD_REFLECTION_NEAR_DISTANCE,
  TRON_RUNNER_CROWD_REFLECTION_POST_REVEAL_RAMP_ENABLED,
  TRON_RUNNER_CROWD_REFLECTION_POST_REVEAL_RAMP_MS,
  TRON_RUNNER_CROWD_REFLECTION_REVEAL_ENABLED,
  TRON_RUNNER_CROWD_SCALE_LOCK,
  TRON_RUNNER_CROWD_SPATIAL_CELL,
  TRON_RUNNER_CROWD_SPEED_SCALE,
  TRON_RUNNER_CROWD_TARGET_FPS,
  TRON_RUNNER_CROWD_TURN_DURATION_MS,
  TRON_RUNNER_CROWD_UPDATE_INTERVAL,
  TRON_RUNNER_CROWD_YIELD_DURATION_MS,
  TRON_RUNNER_DEFAULT_SPEED,
  TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
  TRON_RUNNER_DYNAMIC_REFLECTION_Y,
  TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE,
  TRON_RUNNER_GROUND_OFFSET,
  TRON_RUNNER_REVEAL_ENABLED,
  TRON_RUNNER_SHADOW_COLOR,
  TRON_RUNNER_SUIT_COLOR,
  TRON_RUNNER_SUIT_EMISSIVE,
  TRON_RUNNER_TARGET_HEIGHT,
  TRON_RUNNER_WALK_CYCLE_DISTANCE,
} from './characters.js';
import { createTronRunnerBeatPulseRuntime } from './runner-beat-pulse.js';
import {
  applyTronRunnerCrowdLedControls as applyTronRunnerCrowdLedControlsCore,
  tronRunnerCharacterLedDefaultScale,
  tronRunnerCharacterLedScale,
} from './runner-crowd-leds.js';
import {
  TRON_RUNNER_CROWD_LINES,
  TRON_RUNNER_CROWD_TALK_DURATION_MS,
  TRON_RUNNER_CROWD_TALK_LINES_PER_MEMBER,
  TRON_RUNNER_CROWD_TALK_RANGE,
  TRON_RUNNER_CROWD_TALK_REARM_RANGE,
} from './runner-crowd-lines.js';
import { createTronRunnerCrowdMaterialsRuntime } from './runner-crowd-materials.js';
import { createTronRunnerCrowdRoutesRuntime } from './runner-crowd-routes.js';
import {
  buildTronRunnerCrowdMemberRuntime,
  cityRevealPostRevealElapsedMsRuntime,
  clearTronRunnerCrowdState,
  createTronRunnerCrowdRuntime,
  drainTronRunnerCrowdBuildQueueRuntime,
  inspectTronRunnerCrowdRuntime,
  invalidateTronRunnerCrowdColliderRecordsRuntime,
  nearbyTronRunnerCrowdMembersRuntime,
  normalizeTronRunnerCrowdStateRuntime,
  prepareTronRunnerCrowdSpatialGridRuntime,
  processTronRunnerCrowdBuildQueueRuntime,
  resolveTronRunnerCrowdCollisionRuntime,
  setTronRunnerCrowdStateRuntime,
  startTronRunnerCrowdBuildQueueRuntime,
  syncTronRunnerCrowdScaleAndGround,
  syncTronRunnerCrowdVisibilityState,
  tronRunnerCrowdAvoidanceRuntime,
  tronRunnerCrowdBuildingCollisionDiagnosticRuntime,
  tronRunnerCrowdColliderRecordsRuntime,
  tronRunnerCrowdDistanceToCameraRuntime,
  tronRunnerCrowdGridCoordRuntime,
  tronRunnerCrowdLodStrideRuntime,
  tronRunnerCrowdPointInsideRouteRuntime,
  tronRunnerCrowdPostRevealReflectionRampLimitRuntime,
  tronRunnerCrowdTryDeadlockNudgeRuntime,
  updateTronRunnerCrowdCullingRuntime,
  updateTronRunnerCrowdReflectionBudgetRuntime,
  updateTronRunnerCrowdReflectionRuntime,
  updateTronRunnerCrowdRuntime,
} from './runner-crowd-runtime.js';
import {
  TRON_RUNNER_FOLLOW_PROMPT_DELAY_MS,
  TRON_RUNNER_GREETER_GREET_DISTANCE,
  TRON_RUNNER_WELCOME_BUBBLE_DURATION_MS,
  applyGreeterHeadLookRuntime,
  resolveGreeterBoardAnchorRuntime,
  setGreeterBubbleRuntime,
  startGreeterWalkingToBoardRuntime,
} from './runner-greeter.js';
import { createTronRunnerIdleCharacterRuntime } from './runner-idle-character.js';
import { createTronRunnerOrchestrationRuntime } from './runner-orchestration.js';
import { createTronRunnerReflectionRigRuntime } from './runner-reflection-rig.js';
import { createTronRunnerRevealRuntime } from './runner-reveal.js';
import {
  createTronRunnerAutonomy,
  createTronRunnerCrowdBuildStats,
  createTronRunnerCrowdRuntimeStats,
  createTronRunnerParts,
  createTronRunnerState,
} from './runner-state.js';
import {
  applyTronRunnerVisualControls as applyTronRunnerVisualControlsCore,
  createTronRunnerShadowTextureState,
} from './runner-visual-controls.js';
import { setCharacterBubbleBackgroundOpacity } from './speech-bubbles.js';
import {
  CHARACTER_BUBBLE_BG_OPACITY_RANGE_MULTIPLIER,
  FOOTSTEP_MIN_INTERVAL_MS,
  FOOTSTEP_NPC_SPATIAL_BUS,
  GREETER_BOARD_BUBBLE_RANGE,
  GREETER_BOARD_FRONT_GAP,
  GREETER_BOARD_REACH,
  GREETER_BOARD_SIDE_GAP,
  GREETER_BOARD_STANCE_DEG,
  GREETER_HEAD_MAX_YAW,
  GREETER_HEAD_YAW_SIGN,
  GREETER_RUN_SPEED_BOOST,
  GREETER_SPEED_MULTIPLIER,
  TRON_RUNNER_CROWD_PAUSE_CHANCE,
  TRON_RUNNER_CROWD_PAUSE_MAX_MS,
  TRON_RUNNER_CROWD_PAUSE_MIN_MS,
  TRON_RUNNER_CROWD_PLAYER_COLLISION_DISTANCE,
  TRON_RUNNER_GREETER_INDEX,
} from '../config/costanti.js';
import {
  labEqualizerAnalyserPresent,
  labEqualizerAnalyserSampleReady,
  labEqualizerLastSampleTime,
  labEqualizerState,
} from '../controls/equalizer.js';
import { basePadAtPoint, getBasePadMaterialResponse, pointInBasePadPolygon } from '../world/base-pads.js';
import { GRID_BLOCK, SIDE_BUILDING_BASE, SIDE_BUILDING_SPACING } from '../world/boulevard-constants.js';
import { boulevard, roadHalf, sideBuildingVisualWidth } from '../world/boulevard-layout.js';
import { sideDoorFaceOffset, sideDoorHeight, sideDoorScale } from '../world/building-doors.js';
import { buildingColliders, mainBuildingRecords, sideBuildingRecords } from '../world/buildings.js';
import { getCityDepartmentBoards } from '../world/city-boards.js';
import {
  cityRevealComplete,
  cityRevealCompletedAt,
  cityRevealWireframeEnabled,
  isCityRevealPerformanceCritical,
} from '../world/city-reveal-wireframe.js';
import { roadTileTopY } from '../world/hex-tiles.js';
import * as THREE from 'three';

/** @type {import('three').Scene} */ let scene = null;
/** @type {import('three').PerspectiveCamera} */ let camera = null;
/** @type {import('three').WebGLRenderer} */ let renderer = null;
/** @type {any} */ let controlEls = null;
/** @type {any} */ let reflectionEnvMap = null;
/** @type {any} */ let cinematicGroundingSettings = null;
/** @type {any} */ let tronSoundtrack = null;
/** @type {any} */ let postRevealPerfIsolationState = null;
/** @type {any} */ let tronRunnerCrowdColliderRecordCache = null;
/** @type {any} */ let RunnerGLTFLoader = null;
/** @type {any} */ let cloneRunnerSkeleton = null;
/** @type {any} */ let lerpAngle = null;
/** @type {any} */ let isCameraCollisionDisabled = null;
/** @type {any} */ let roadHexBoundaryLimits = null;
let getPlayerSpawn = () => /** @type {any} */ (null);
let getDroneLandingPose = () => /** @type {any} */ (null);
let getCollisionPadding = () => 0;
let getMainBuildingCollisionPadding = () => 0;
let getLatestMeasuredFps = () => 0;

// I binding del dominio: dichiarati qui, assegnati dentro initRunnerWiring().
export let tronRunnerReveal;
let tronRunnerWalker;
export let tronRunnerCrowdGroup;
let tronRunnerShadowTextureState;
let tronRunnerSuitTexture;
let tronRunnerSuitEmissiveTexture;
let tronRunnerSuitLedMaskTexture;
let tronRunnerSuitMat;
let tronRunnerShadowMat;
let tronRunnerParts;
export let tronRunnerState;
let tronRunnerReflectionRig;
let tronRunnerMotion;
let tronRunnerBodyLight;
let tronRunnerLineLight;
let tronRunnerKeyLight;
let tronRunnerRimLight;
let tronRunnerFillLight;
let tronRunnerLedBrightness;
let tronRunnerLedBloom;
let tronRunnerCrowdMaterials;
let tronRunnerMaterialReflect;
let tronRunnerMaterialMetalness;
let tronRunnerMaterialRoughness;
let tronRunnerFloorReflection;
let tronRunnerFloorReflectionScale;
let tronRunnerShadowSoftness;
let tronRunnerShadowPulse;
let tronRunnerShadowCyan;
let tronRunnerShadowOffsetX;
let tronRunnerShadowOffsetZ;
let tronRunnerKeyLightY;
let tronRunnerKeyLightZ;
let tronRunnerRimLightX;
let tronRunnerFillLightY;
let tronRunnerScale;
let tronRunnerWalkSpeed;
let tronRunnerAnimationSpeed;
let tronRunnerStrideSync;
let cinematicGroundingInitialControlsApplied;
export let tronRunnerCrowd;
let tronRunnerCrowdBox;
export let tronRunnerIdleCharacterRuntime;
export let tronRunnerIdleCharacterGroup;
export let tronRunnerIdleCharacter;
export let tronRunnerIdleTalk;
let tronRunnerCrowdSize;
let tronRunnerCrowdCullMatrix;
let tronRunnerCrowdCullFrustum;
let tronRunnerCrowdCullSphere;
let tronRunnerCrowdSpatialGrid;
let tronRunnerCrowdBuildStats;
export let tronRunnerCrowdRuntimeStats;
let tronRunnerCrowdReflectionCandidates;
let tronRunnerCrowdClearState;
let tronRunnerCrowdBuildQueueState;
let tronRunnerCrowdRoutes;
let tronRunnerCrowdScaleGroundState;
let tronRunnerCrowdVisibilityState;
let tronRunnerCrowdCullingState;
let tronRunnerCrowdSpatialGridState;
let tronRunnerCrowdDistanceState;
let tronRunnerCrowdLodStrideState;
let tronRunnerCrowdStateMachineState;
let tronRunnerCrowdPointInsideRouteState;
let tronRunnerCrowdGridCoordState;
let cityRevealPostRevealElapsedMsState;
let tronRunnerCrowdColliderRecordsState;
let tronRunnerCrowdCollisionState;
let tronRunnerCrowdBuildingCollisionDiagnosticState;
let tronRunnerCrowdReflectionRampState;
let tronRunnerCrowdReflectionBudgetState;
let tronRunnerCrowdReflectionUpdateState;
export let tronRunnerCrowdRuntime;
export let tronRunnerBeatPulse;
export let applyTronRunnerCrowdLedControls;
let tronRunnerAutonomy;
let tronRunnerFootstepRuntime;
export let applyTronRunnerVisualControls;
export let tronRunnerOrchestration;
let tronRunnerSurfaceScratch;
let tronRunnerCrowdAvoidanceDeps;
let tronRunnerCrowdDeadlockDeps;
let TRON_RUNNER_GREET_DISTANCE;
let tronRunnerGreeterHeadLookState;
let GREETER_FOLLOW_DELAY_MS;
let tronRunnerGreeterBoardAnchorState;
let GREETER_RUN_CYCLE_DISTANCE;
let GREETER_BUBBLE_DURATION_MS;
let tronRunnerCrowdBuildMemberState;
let tronRunnerCrowdAdvanceState;
let tronRunnerCrowdUpdateState;
let tronRunnerCrowdInspectState;

/** Costruisce personaggio e folla, nello stesso ordine in cui stavano in main.js. */
export function initRunnerWiring(deps) {
  ({
    scene, camera, renderer, controlEls, reflectionEnvMap, cinematicGroundingSettings,
    tronSoundtrack, postRevealPerfIsolationState, tronRunnerCrowdColliderRecordCache,
    RunnerGLTFLoader, cloneRunnerSkeleton, lerpAngle, isCameraCollisionDisabled,
    roadHexBoundaryLimits, getPlayerSpawn, getDroneLandingPose, getCollisionPadding,
    getMainBuildingCollisionPadding, getLatestMeasuredFps,
  } = deps);

  tronRunnerReveal = null;
  // ---------- Runner character from character-mockups/walk-rigged-runner.html ----------
  tronRunnerWalker = new THREE.Group();
  tronRunnerWalker.name = 'tron-runner-walker';
  tronRunnerWalker.visible = false;
  scene.add(tronRunnerWalker);
  tronRunnerCrowdGroup = new THREE.Group();
  tronRunnerCrowdGroup.name = 'tron-runner-crowd';
  tronRunnerCrowdGroup.visible = false;
  scene.add(tronRunnerCrowdGroup);

  tronRunnerShadowTextureState = createTronRunnerShadowTextureState(renderer);
  tronRunnerSuitTexture = makeTronRunnerSuitTexture(renderer);
  tronRunnerSuitEmissiveTexture = makeTronRunnerSuitEmissiveTexture(renderer);
  tronRunnerSuitLedMaskTexture = makeTronRunnerSuitLedMaskTexture(renderer);

  tronRunnerSuitMat = new THREE.MeshStandardMaterial({
    color: TRON_RUNNER_SUIT_COLOR,
    map: tronRunnerSuitTexture,
    emissive: TRON_RUNNER_SUIT_EMISSIVE,
    emissiveMap: tronRunnerSuitEmissiveTexture,
    emissiveIntensity: 0.44,
    roughness: 0.72,
    metalness: 0.48,
    envMap: reflectionEnvMap,
    envMapIntensity: 0.02,
    toneMapped: false,
  });

  tronRunnerShadowMat = new THREE.MeshBasicMaterial({
    color: TRON_RUNNER_SHADOW_COLOR,
    alphaMap: tronRunnerShadowTextureState.texture,
    blending: THREE.NormalBlending,
    depthWrite: false,
    opacity: 0.16,
    toneMapped: false,
    transparent: true,
  });
  // createTronRunnerParts() non prende argomenti: l'oggetto vuoto che riceveva era un
  // residuo che nessuno leggeva (2026-09-20). Tolto l'argomento, non cambiato altro.
  tronRunnerParts = createTronRunnerParts();
  tronRunnerState = createTronRunnerState({
    footstepBus: FOOTSTEP_NPC_SPATIAL_BUS,
  });
  tronRunnerReflectionRig = createTronRunnerReflectionRigRuntime({
    runnerWalker: tronRunnerWalker,
    runnerParts: tronRunnerParts,
    runnerState: tronRunnerState,
    suitTexture: tronRunnerSuitTexture,
    ledMaskTexture: tronRunnerSuitLedMaskTexture,
    getBasePadMaterialResponse,
    getRoadReflect: () => controlEls.roadReflect?.value,
    getRoadRoughness: () => controlEls.roadRoughness?.value,
    getRoadMetalness: () => controlEls.roadMetalness?.value,
  });
  tronRunnerMotion = {
    elapsed: 0,
    visualDistanceWalked: 0,
    yaw: 0,
    targetYaw: 0,
  };
  tronRunnerBodyLight = 1;
  tronRunnerLineLight = 1;
  tronRunnerKeyLight = 1;
  tronRunnerRimLight = 1;
  tronRunnerFillLight = 1;
  tronRunnerLedBrightness = TRON_RUNNER_CHARACTER_LED_BRIGHTNESS_MULTIPLIER;
  tronRunnerLedBloom = TRON_RUNNER_CHARACTER_LED_BLOOM_BOOST;
  tronRunnerCrowdMaterials = createTronRunnerCrowdMaterialsRuntime({
    baseMaterial: tronRunnerSuitMat,
    getLedBrightness: () => tronRunnerLedBrightness,
    getLedBloom: () => tronRunnerLedBloom,
  });

  tronRunnerMaterialReflect = 0.06;
  tronRunnerMaterialMetalness = 0.12;
  tronRunnerMaterialRoughness = 0.92;
  tronRunnerFloorReflection = cinematicGroundingSettings.floorReflection;
  tronRunnerFloorReflectionScale = cinematicGroundingSettings.floorReflectionScale;
  tronRunnerShadowSoftness = cinematicGroundingSettings.shadowSoftness;
  tronRunnerShadowPulse = cinematicGroundingSettings.shadowPulse;
  tronRunnerShadowCyan = cinematicGroundingSettings.shadowCyan;
  tronRunnerShadowOffsetX = 0;
  tronRunnerShadowOffsetZ = cinematicGroundingSettings.shadowOffsetZ;
  tronRunnerKeyLightY = 3.1;
  tronRunnerKeyLightZ = 1.9;
  tronRunnerRimLightX = 1.9;
  tronRunnerFillLightY = 0.9;
  tronRunnerScale = 1;
  tronRunnerWalkSpeed = TRON_RUNNER_DEFAULT_SPEED;
  tronRunnerAnimationSpeed = 1;
  tronRunnerStrideSync = 1;
  cinematicGroundingInitialControlsApplied = false;
  tronRunnerCrowd = [];
  tronRunnerCrowdBox = new THREE.Box3();
  tronRunnerIdleCharacterRuntime = createTronRunnerIdleCharacterRuntime({
    scene,
    runnerWalker: tronRunnerWalker,
    crowdBox: tronRunnerCrowdBox,
    cloneRunnerSkeleton: () => cloneRunnerSkeleton,
    resolveRoundedCollider: resolveTronRunnerRoundedCollider,
    crowdRecordRoadDir: tronRunnerCrowdRecordRoadDir,
    crowdColorPresetForIndex: tronRunnerCrowdMaterials.colorPresetForIndex,
    makeCrowdSuitMaterial: tronRunnerCrowdMaterials.makeSuitMaterial,
    surfaceYForPoint: tronRunnerSurfaceYForPoint,
    syncRevealIdleVisibility: () => tronRunnerReveal?.syncIdleVisibility(),
    getSideBuildingRecords: () => sideBuildingRecords,
    getPlayerSpawn: () => getPlayerSpawn(),
    sideBuildingSpacing: SIDE_BUILDING_SPACING,
    sideDoorFaceOffset,
    gridBlock: GRID_BLOCK,
  });
  tronRunnerIdleCharacterGroup = tronRunnerIdleCharacterRuntime.group;
  tronRunnerIdleCharacter = tronRunnerIdleCharacterRuntime.character;
  tronRunnerIdleTalk = tronRunnerIdleCharacterRuntime.talk;
  tronRunnerCrowdSize = new THREE.Vector3();
  tronRunnerCrowdCullMatrix = new THREE.Matrix4();
  tronRunnerCrowdCullFrustum = new THREE.Frustum();
  tronRunnerCrowdCullSphere = new THREE.Sphere(new THREE.Vector3(), TRON_RUNNER_CROWD_CULL_RADIUS);
  tronRunnerCrowdSpatialGrid = new Map();
  tronRunnerCrowdBuildStats = createTronRunnerCrowdBuildStats();
  tronRunnerCrowdRuntimeStats = createTronRunnerCrowdRuntimeStats();
  tronRunnerCrowdReflectionCandidates = [];
  tronRunnerCrowdClearState = {
    crowd: tronRunnerCrowd,
    group: tronRunnerCrowdGroup,
    spatialGrid: tronRunnerCrowdSpatialGrid,
    buildStats: tronRunnerCrowdBuildStats,
    runtimeStats: tronRunnerCrowdRuntimeStats,
    requestedCount: TRON_RUNNER_CROWD_COUNT,
  };
  tronRunnerCrowdBuildQueueState = {
    job: null,
    queue: [],
    crowd: tronRunnerCrowd,
    buildStats: tronRunnerCrowdBuildStats,
    requestedCount: TRON_RUNNER_CROWD_COUNT,
    crowdEnabled: TRON_RUNNER_CROWD_ENABLED,
    getCloneRunnerSkeleton: () => cloneRunnerSkeleton,
    clearState: () => clearTronRunnerCrowdState(tronRunnerCrowdClearState),
    buildMember: (job, index) => buildTronRunnerCrowdMemberRuntime(tronRunnerCrowdBuildMemberState, job, index),
    syncScaleAndGround: () => tronRunnerCrowdRuntime.syncScaleAndGround(),
    syncVisibility: () => tronRunnerCrowdRuntime.syncVisibility(),
    processBuildQueue: () => tronRunnerCrowdRuntime.processBuildQueue(),
    waitForNextFrame,
    now: () => performance.now(),
  };
  tronRunnerCrowdRoutes = createTronRunnerCrowdRoutesRuntime({
    getSideBuildingRecords: () => sideBuildingRecords,
    getDynamicRoadCenter: () => boulevard.dynamicRoadCenter,
    getDynamicRoadLength: () => boulevard.dynamicRoadLength,
    roadHexBoundaryLimits,
    getRoadHalf: roadHalf,
    getRoadTopY: roadTileTopY,
    getStreetEdgeWidth: () => boulevard.streetEdgeWidth,
    getSideBuildingVisualWidth: sideBuildingVisualWidth,
    getDroneAnchor: tronRunnerDroneAnchor,
    pointInPolygon: pointInBasePadPolygon,
    resolveRoundedCollider: resolveTronRunnerRoundedCollider,
    gridBlock: GRID_BLOCK,
    sideBase: SIDE_BUILDING_BASE,
  });
  tronRunnerCrowdScaleGroundState = {
    crowd: tronRunnerCrowd,
    sourceScale: tronRunnerWalker.scale,
    surfaceYForPoint: tronRunnerSurfaceYForPoint,
    fallbackPlacement: tronRunnerCrowdRoutes.fallbackPlacement,
    groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
    updateReflection: (member) => tronRunnerCrowdRuntime.updateReflection(member),
    syncMemberMatrixUpdates: syncTronRunnerCrowdMemberMatrixUpdates,
    syncIdlePose: () => tronRunnerIdleCharacterRuntime.syncPose(),
  };
  tronRunnerCrowdVisibilityState = {
    crowd: tronRunnerCrowd,
    group: tronRunnerCrowdGroup,
    state: { appearArmedAt: 0 },
    crowdEnabled: TRON_RUNNER_CROWD_ENABLED,
    cullingEnabled: TRON_RUNNER_CROWD_CULLING_ENABLED,
    getVisibleFactor: () => tronRunnerReveal?.visibleFactor() ?? (TRON_RUNNER_REVEAL_ENABLED ? 0 : 1),
    revealVisible: (visibleFactor) => tronRunnerReveal?.revealVisible(visibleFactor) ?? !TRON_RUNNER_REVEAL_ENABLED,
    isRunnerReady: () => tronRunnerState.ready,
    now: () => performance.now(),
    updateReflection: (member) => tronRunnerCrowdRuntime.updateReflection(member),
    syncMemberMatrixUpdates: syncTronRunnerCrowdMemberMatrixUpdates,
  };
  tronRunnerCrowdCullingState = {
    crowd: tronRunnerCrowd,
    group: tronRunnerCrowdGroup,
    cullingEnabled: TRON_RUNNER_CROWD_CULLING_ENABLED,
    camera,
    stats: tronRunnerCrowdRuntimeStats,
    cullMatrix: tronRunnerCrowdCullMatrix,
    cullFrustum: tronRunnerCrowdCullFrustum,
    cullSphere: tronRunnerCrowdCullSphere,
    targetHeight: TRON_RUNNER_TARGET_HEIGHT,
    cullRadius: TRON_RUNNER_CROWD_CULL_RADIUS,
    cullDistance: TRON_RUNNER_CROWD_CULL_DISTANCE,
    updateReflection: (member) => tronRunnerCrowdRuntime.updateReflection(member),
  };
  tronRunnerCrowdSpatialGridState = {
    spatialGrid: tronRunnerCrowdSpatialGrid,
    crowd: tronRunnerCrowd,
    stats: tronRunnerCrowdRuntimeStats,
    cullingEnabled: TRON_RUNNER_CROWD_CULLING_ENABLED,
    lodNearDistance: TRON_RUNNER_CROWD_LOD_NEAR_DISTANCE,
    gridCoord: (value) => tronRunnerCrowdRuntime.gridCoord(value),
    gridKey: tronRunnerCrowdGridKey,
  };
  tronRunnerCrowdDistanceState = {
    camera,
    stats: tronRunnerCrowdRuntimeStats,
    distanceCacheEnabled: TRON_RUNNER_CROWD_DISTANCE_CACHE_ENABLED,
  };
  tronRunnerCrowdLodStrideState = {
    distanceToCamera: (member) => tronRunnerCrowdDistanceToCameraRuntime(tronRunnerCrowdDistanceState, member),
    nearDistance: TRON_RUNNER_CROWD_LOD_NEAR_DISTANCE,
    midDistance: TRON_RUNNER_CROWD_LOD_MID_DISTANCE,
  };
  tronRunnerCrowdStateMachineState = {
    intelligenceEnabled: TRON_RUNNER_CROWD_INTELLIGENCE_ENABLED,
  };
  tronRunnerCrowdPointInsideRouteState = {
    pointInPolygon: pointInBasePadPolygon,
  };
  tronRunnerCrowdGridCoordState = {
    cellSize: TRON_RUNNER_CROWD_SPATIAL_CELL,
  };
  cityRevealPostRevealElapsedMsState = {
    getCityRevealComplete: () => cityRevealComplete,
    getCityRevealCompletedAt: () => cityRevealCompletedAt,
  };
  tronRunnerCrowdColliderRecordsState = {
    cache: tronRunnerCrowdColliderRecordCache,
    getSideBuildingRecords: () => sideBuildingRecords,
    getMainBuildingRecords: () => mainBuildingRecords,
  };
  tronRunnerCrowdCollisionState = {
    collisionsEnabled: TRON_RUNNER_CROWD_COLLISIONS_ENABLED,
    getColliderRecords: () => tronRunnerCrowdRuntime.colliderRecords(),
    buildingGuard: TRON_RUNNER_CROWD_BUILDING_GUARD,
    pointInsideRoute: (member, x, z) => tronRunnerCrowdRuntime.pointInsideRoute(member, x, z),
  };
  tronRunnerCrowdBuildingCollisionDiagnosticState = {
    getColliderRecords: () => tronRunnerCrowdRuntime.colliderRecords(),
    padding: TRON_RUNNER_CROWD_BUILDING_GUARD,
  };
  tronRunnerCrowdReflectionRampState = {
    stats: tronRunnerCrowdRuntimeStats,
    rampEnabled: TRON_RUNNER_CROWD_REFLECTION_POST_REVEAL_RAMP_ENABLED,
    rampMs: TRON_RUNNER_CROWD_REFLECTION_POST_REVEAL_RAMP_MS,
    cityRevealWireframeEnabled,
    getCityRevealComplete: () => cityRevealComplete,
    getCityRevealCompletedAt: () => cityRevealCompletedAt,
    postRevealElapsedMs: (now) => tronRunnerCrowdRuntime.postRevealElapsedMs(now),
  };
  tronRunnerCrowdReflectionBudgetState = {
    stats: tronRunnerCrowdRuntimeStats,
    crowd: tronRunnerCrowd,
    crowdGroup: tronRunnerCrowdGroup,
    reflectionCandidates: tronRunnerCrowdReflectionCandidates,
    dynamicReflectionEnabled: TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
    getCrowdReflectionsIsolation: () => postRevealPerfIsolationState.crowdReflections,
    reflectionRevealEnabled: TRON_RUNNER_CROWD_REFLECTION_REVEAL_ENABLED,
    reflectionMaxActive: TRON_RUNNER_CROWD_REFLECTION_MAX_ACTIVE,
    reflectionMinFps: TRON_RUNNER_CROWD_REFLECTION_MIN_FPS,
    reflectionNearDistance: TRON_RUNNER_CROWD_REFLECTION_NEAR_DISTANCE,
    getLatestMeasuredFps: () => getLatestMeasuredFps(),
    getCityRevealComplete: () => cityRevealComplete,
    postRevealElapsedMs: (now) => tronRunnerCrowdRuntime.postRevealElapsedMs(now),
    isCityRevealPerformanceCritical,
    distanceToCamera: (member) => tronRunnerCrowdRuntime.distanceToCamera(member),
    rampLimit: (maxLimit, now) => tronRunnerCrowdRuntime.reflectionRampLimit(maxLimit, now),
  };
  tronRunnerCrowdReflectionUpdateState = {
    getCrowdReflectionsIsolation: () => postRevealPerfIsolationState.crowdReflections,
    camera,
    getColliderRecords: () => tronRunnerCrowdRuntime.colliderRecords(),
    reflectionRig: tronRunnerReflectionRig,
    dynamicReflectionEnabled: TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
    crowdGroup: tronRunnerCrowdGroup,
    reflectionY: TRON_RUNNER_DYNAMIC_REFLECTION_Y,
    reflectionYScale: TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE,
  };
  tronRunnerCrowdRuntime = createTronRunnerCrowdRuntime({
    crowd: tronRunnerCrowd,
    group: tronRunnerCrowdGroup,
    camera,
    playerCollisionDistance: TRON_RUNNER_CROWD_PLAYER_COLLISION_DISTANCE,
    isCameraCollisionDisabled,
    buildImpl: (sourceModel, animations) => (
      startTronRunnerCrowdBuildQueueRuntime(tronRunnerCrowdBuildQueueState, sourceModel, animations)
    ),
    updateImpl: (dt) => updateTronRunnerCrowdRuntime(tronRunnerCrowdUpdateState, dt),
    inspectImpl: () => inspectTronRunnerCrowdRuntime(tronRunnerCrowdInspectState),
    processBuildQueueImpl: () => processTronRunnerCrowdBuildQueueRuntime(tronRunnerCrowdBuildQueueState),
    drainBuildQueueImpl: () => drainTronRunnerCrowdBuildQueueRuntime(tronRunnerCrowdBuildQueueState),
    resolveGreeterBoardAnchorImpl: () => resolveGreeterBoardAnchorRuntime(tronRunnerGreeterBoardAnchorState),
    startGreeterWalkingToBoardImpl: startGreeterWalkingToBoardRuntime,
    applyGreeterHeadLookImpl: (member, dt) => applyGreeterHeadLookRuntime(tronRunnerGreeterHeadLookState, member, dt),
    setGreeterBubbleImpl: setGreeterBubbleRuntime,
    updateReflectionImpl: (member) => updateTronRunnerCrowdReflectionRuntime(tronRunnerCrowdReflectionUpdateState, member),
    syncScaleAndGroundImpl: () => syncTronRunnerCrowdScaleAndGround(tronRunnerCrowdScaleGroundState),
    syncVisibilityImpl: () => syncTronRunnerCrowdVisibilityState(tronRunnerCrowdVisibilityState),
    updateCullingImpl: () => updateTronRunnerCrowdCullingRuntime(tronRunnerCrowdCullingState),
    gridCoordImpl: (value) => tronRunnerCrowdGridCoordRuntime(tronRunnerCrowdGridCoordState, value),
    postRevealElapsedMsImpl: (now) => cityRevealPostRevealElapsedMsRuntime(cityRevealPostRevealElapsedMsState, now),
    colliderRecordsImpl: () => tronRunnerCrowdColliderRecordsRuntime(tronRunnerCrowdColliderRecordsState),
    invalidateColliderRecordsImpl: () => (
      invalidateTronRunnerCrowdColliderRecordsRuntime(tronRunnerCrowdColliderRecordCache)
    ),
    prepareSpatialGridImpl: () => prepareTronRunnerCrowdSpatialGridRuntime(tronRunnerCrowdSpatialGridState),
    nearbyMembersImpl: (x, z) => nearbyTronRunnerCrowdMembersRuntime(tronRunnerCrowdSpatialGridState, x, z),
    lodStrideImpl: (member) => tronRunnerCrowdLodStrideRuntime(tronRunnerCrowdLodStrideState, member),
    distanceToCameraImpl: tronRunnerCrowdLodStrideState.distanceToCamera,
    setStateImpl: setTronRunnerCrowdStateRuntime,
    normalizeStateImpl: (member, now) => normalizeTronRunnerCrowdStateRuntime(tronRunnerCrowdStateMachineState, member, now),
    pointInsideRouteImpl: (member, x, z) => tronRunnerCrowdPointInsideRouteRuntime(tronRunnerCrowdPointInsideRouteState, member, x, z),
    resolveCollisionImpl: (member, point) => resolveTronRunnerCrowdCollisionRuntime(tronRunnerCrowdCollisionState, member, point),
    buildingCollisionDiagnosticImpl: (member) => tronRunnerCrowdBuildingCollisionDiagnosticRuntime(tronRunnerCrowdBuildingCollisionDiagnosticState, member),
    avoidanceImpl: (member, current, nextPoint, dirX, dirZ, dt, now) => (
      tronRunnerCrowdAvoidanceRuntime(tronRunnerCrowdAvoidanceDeps, member, current, nextPoint, dirX, dirZ, dt, now)
    ),
    tryDeadlockNudgeImpl: (member, current, nextPoint, dirX, dirZ, distance, collided, now) => (
      tronRunnerCrowdTryDeadlockNudgeRuntime(tronRunnerCrowdDeadlockDeps, member, current, nextPoint, dirX, dirZ, distance, collided, now)
    ),
    reflectionRampLimitImpl: (maxLimit, now) => (
      tronRunnerCrowdPostRevealReflectionRampLimitRuntime(tronRunnerCrowdReflectionRampState, maxLimit, now)
    ),
    updateReflectionBudgetImpl: () => updateTronRunnerCrowdReflectionBudgetRuntime(tronRunnerCrowdReflectionBudgetState),
  });

  tronRunnerBeatPulse = createTronRunnerBeatPulseRuntime({
    runnerState: tronRunnerState,
    runnerParts: tronRunnerParts,
    getCrowd: () => tronRunnerCrowd,
    getSoundtrack: () => tronSoundtrack,
    getRevealComplete: tronRunnerRevealIsComplete,
    labEqualizerAnalyserPresent,
    labEqualizerLastSampleTime,
    labEqualizerAnalyserSampleReady,
    getLabEqualizerState: () => labEqualizerState,
  });

  tronRunnerReveal = createTronRunnerRevealRuntime({
    runnerState: tronRunnerState,
    runnerParts: tronRunnerParts,
    runnerWalker: tronRunnerWalker,
    crowd: tronRunnerCrowd,
    idleCharacter: tronRunnerIdleCharacter,
    idleCharacterGroup: tronRunnerIdleCharacterGroup,
    syncCrowdVisibility: () => tronRunnerCrowdRuntime.syncVisibility(),
    getCityRevealComplete: () => cityRevealComplete,
  });

  applyTronRunnerCrowdLedControls = () => applyTronRunnerCrowdLedControlsCore({
    crowd: tronRunnerCrowd,
    ledBrightness: tronRunnerLedBrightness,
    ledBloom: tronRunnerLedBloom,
    beatPulse: tronRunnerBeatPulse,
  });

  tronRunnerAutonomy = createTronRunnerAutonomy({
    footstepBus: FOOTSTEP_NPC_SPATIAL_BUS,
  });
  tronRunnerFootstepRuntime = {
    autonomy: tronRunnerAutonomy,
    runnerState: tronRunnerState,
    runnerParts: tronRunnerParts,
    walker: tronRunnerWalker,
    playFootstepForSurface,
    revealIsComplete: tronRunnerRevealIsComplete,
    npcSpatialBus: FOOTSTEP_NPC_SPATIAL_BUS,
    minIntervalMs: FOOTSTEP_MIN_INTERVAL_MS,
    movedDistance: 0,
    dt: 0,
    yaw: 0,
    walkSpeed: TRON_RUNNER_DEFAULT_SPEED,
  };

  applyTronRunnerVisualControls = () => applyTronRunnerVisualControlsCore({
    renderer,
    runnerWalker: tronRunnerWalker,
    runnerState: tronRunnerState,
    runnerParts: tronRunnerParts,
    suitTexture: tronRunnerSuitTexture,
    suitEmissiveTexture: tronRunnerSuitEmissiveTexture,
    shadowTextureState: tronRunnerShadowTextureState,
    controls: {
      bodyLight: tronRunnerBodyLight,
      lineLight: tronRunnerLineLight,
      keyLight: tronRunnerKeyLight,
      rimLight: tronRunnerRimLight,
      fillLight: tronRunnerFillLight,
      ledBrightness: tronRunnerLedBrightness,
      ledBloom: tronRunnerLedBloom,
      materialReflect: tronRunnerMaterialReflect,
      materialMetalness: tronRunnerMaterialMetalness,
      materialRoughness: tronRunnerMaterialRoughness,
      floorReflection: tronRunnerFloorReflection,
      floorReflectionScale: tronRunnerFloorReflectionScale,
      shadowSoftness: tronRunnerShadowSoftness,
      shadowPulse: tronRunnerShadowPulse,
      shadowCyan: tronRunnerShadowCyan,
      shadowOffsetX: tronRunnerShadowOffsetX,
      shadowOffsetZ: tronRunnerShadowOffsetZ,
      cinematicGrounding: cinematicGroundingSettings,
      keyLightY: tronRunnerKeyLightY,
      keyLightZ: tronRunnerKeyLightZ,
      rimLightX: tronRunnerRimLightX,
      fillLightY: tronRunnerFillLightY,
      scale: tronRunnerScale,
      walkSpeed: tronRunnerWalkSpeed,
      animationSpeed: tronRunnerAnimationSpeed,
      strideSync: tronRunnerStrideSync,
    },
    visualDistanceWalked: tronRunnerMotion.visualDistanceWalked,
    effectiveAnimationSpeed: tronRunnerEffectiveAnimationSpeed(),
    ledScale: tronRunnerCharacterLedScale({
      ledBrightness: tronRunnerLedBrightness,
      ledBloom: tronRunnerLedBloom,
    }),
    ledDefaultScale: tronRunnerCharacterLedDefaultScale(),
    applyCrowdLedControls: applyTronRunnerCrowdLedControls,
    syncCrowdScaleAndGround: () => tronRunnerCrowdRuntime.syncScaleAndGround(),
    applyRevealVisuals: () => tronRunnerReveal?.applyVisuals(),
  });

  tronRunnerOrchestration = createTronRunnerOrchestrationRuntime({
    runnerWalker: tronRunnerWalker,
    runnerParts: tronRunnerParts,
    runnerState: tronRunnerState,
    runnerMotion: tronRunnerMotion,
    autonomy: tronRunnerAutonomy,
    footstepRuntime: tronRunnerFootstepRuntime,
    npcSpatialBus: FOOTSTEP_NPC_SPATIAL_BUS,
    renderer,
    runnerSuitMaterial: tronRunnerSuitMat,
    runnerShadowMaterial: tronRunnerShadowMat,
    reveal: tronRunnerReveal,
    loadGltfClass: () => RunnerGLTFLoader,
    cloneRunnerSkeleton: () => cloneRunnerSkeleton,
    effectiveAnimationSpeed: tronRunnerEffectiveAnimationSpeed,
    applyVisualControls: applyTronRunnerVisualControls,
    buildCrowd: (model, animations) => {
      tronRunnerCrowdRuntime.build(model, animations);
    },
    buildIdleCharacter: (model) => tronRunnerIdleCharacterRuntime.build(model),
    updateDynamicReflection: () => tronRunnerReflectionRig.updateDynamicReflection(),
    surfaceYAt: tronRunnerSurfaceYAt,
    roadTileTopY,
    roadHexBoundaryLimits,
    resolveRoundedCollider: resolveTronRunnerRoundedCollider,
    lerpAngle,
    getWalkSpeed: () => tronRunnerWalkSpeed,
    getFloorReflection: () => tronRunnerFloorReflection,
    getShadowPulse: () => tronRunnerShadowPulse,
    getDynamicRoadCenter: () => boulevard.dynamicRoadCenter,
    getDynamicRoadLength: () => boulevard.dynamicRoadLength,
    getGridBlock: () => GRID_BLOCK,
    getRoadHalf: roadHalf,
    getStreetEdgeWidth: () => boulevard.streetEdgeWidth,
    getSideBuildingRecords: () => sideBuildingRecords,
    getMainBuildingRecords: () => mainBuildingRecords,
    getBuildingColliders: () => buildingColliders,
    getMainBuildingCollisionPadding: () => getMainBuildingCollisionPadding(),
    getCollisionPadding: () => getCollisionPadding(),
    getPlayerSpawn: () => getPlayerSpawn(),
    sideBuildingSpacing: SIDE_BUILDING_SPACING,
    // sideDoorFaceOffset lo riceveva anche l'orchestrazione, che non lo legge (2026-09-20): tolto.
    doorHalfHeight: () => sideDoorHeight * sideDoorScale * 0.5,
    makeReflectionBodyMaterial: () => tronRunnerReflectionRig.makeBodyMaterial(),
    makeReflectionLedMaterial: (colorPreset) => tronRunnerReflectionRig.makeLedMaterial(colorPreset),
  });

  tronRunnerSurfaceScratch = { y: 0, groundY: 0, surface: '' };

  tronRunnerCrowdAvoidanceDeps = {
    intelligenceEnabled: TRON_RUNNER_CROWD_INTELLIGENCE_ENABLED,
    avoidanceEnabled: TRON_RUNNER_CROWD_AVOIDANCE_ENABLED,
    radius: TRON_RUNNER_CROWD_AVOIDANCE_RADIUS,
    passingPush: TRON_RUNNER_CROWD_PASSING_PUSH,
    strength: TRON_RUNNER_CROWD_AVOIDANCE_STRENGTH,
    yieldDurationMs: TRON_RUNNER_CROWD_YIELD_DURATION_MS,
    stats: tronRunnerCrowdRuntimeStats,
    nearbyMembers: tronRunnerCrowdRuntime.nearbyMembers,
    setState: tronRunnerCrowdRuntime.setState,
    playerAvoidanceEnabled: TRON_RUNNER_CROWD_PLAYER_AVOIDANCE_ENABLED,
    playerRadius: TRON_RUNNER_CROWD_PLAYER_AVOIDANCE_RADIUS,
    playerStrength: TRON_RUNNER_CROWD_PLAYER_AVOIDANCE_STRENGTH,
    playerObject: tronRunnerWalker,
  };

  tronRunnerCrowdDeadlockDeps = {
    reachRadius: TRON_RUNNER_CROWD_REACH_RADIUS,
    deadlockMoveEps: TRON_RUNNER_CROWD_DEADLOCK_MOVE_EPS,
    deadlockMs: TRON_RUNNER_CROWD_DEADLOCK_MS,
    deadlockNudge: TRON_RUNNER_CROWD_DEADLOCK_NUDGE,
    yieldDurationMs: TRON_RUNNER_CROWD_YIELD_DURATION_MS,
    pointInsideRoute: tronRunnerCrowdRuntime.pointInsideRoute,
    resolveCollision: tronRunnerCrowdRuntime.resolveCollision,
    setState: tronRunnerCrowdRuntime.setState,
  };

  TRON_RUNNER_GREET_DISTANCE = TRON_RUNNER_GREETER_GREET_DISTANCE;
  tronRunnerGreeterHeadLookState = {
    camera,
    maxYaw: GREETER_HEAD_MAX_YAW,
    yawSign: GREETER_HEAD_YAW_SIGN,
    lerpAngle,
  };
  GREETER_FOLLOW_DELAY_MS = TRON_RUNNER_FOLLOW_PROMPT_DELAY_MS; // show "Seguimi" first, then start moving 1.5s later
  tronRunnerGreeterBoardAnchorState = {
    getCityDepartmentBoards: () => (typeof getCityDepartmentBoards === 'function' ? getCityDepartmentBoards() : null),
    sideGap: GREETER_BOARD_SIDE_GAP,
    frontGap: GREETER_BOARD_FRONT_GAP,
  };

  // Distance the greeter covers per full run cycle. The run clip is driven by ground distance
  // (like the crowd walk) so the feet plant instead of sliding/moonwalking. Tune this up if the
  // legs lag behind the motion (slide), down if they spin too fast. Run stride > walk stride.
  GREETER_RUN_CYCLE_DISTANCE = TRON_RUNNER_WALK_CYCLE_DISTANCE * 1.55;
  GREETER_BUBBLE_DURATION_MS = TRON_RUNNER_WELCOME_BUBBLE_DURATION_MS; // welcome + stop duration

  tronRunnerCrowdBuildMemberState = {
    crowd: tronRunnerCrowd,
    crowdGroup: tronRunnerCrowdGroup,
    walker: tronRunnerWalker,
    runnerState: tronRunnerState,
    cloneRunnerSkeleton: (model) => cloneRunnerSkeleton(model),
    materials: tronRunnerCrowdMaterials,
    routes: tronRunnerCrowdRoutes,
    dynamicReflectionEnabled: TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
    reflectionRig: tronRunnerReflectionRig,
    getWalkSpeed: () => tronRunnerWalkSpeed,
    crowdSpeedScale: TRON_RUNNER_CROWD_SPEED_SCALE,
    groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
    greeterIndex: TRON_RUNNER_GREETER_INDEX,
    getDroneLandingPose: () => getDroneLandingPose(),
    crowdLines: TRON_RUNNER_CROWD_LINES,
    talkLinesPerMember: TRON_RUNNER_CROWD_TALK_LINES_PER_MEMBER,
  };

  tronRunnerCrowdAdvanceState = {
    runtime: () => tronRunnerCrowdRuntime,
    camera,
    surfaceYForPoint: tronRunnerSurfaceYForPoint,
    lerpAngle,
    greeterIndex: TRON_RUNNER_GREETER_INDEX,
    greeterBubbleDurationMs: GREETER_BUBBLE_DURATION_MS,
    greeterFollowDelayMs: GREETER_FOLLOW_DELAY_MS,
    greeterBoardReach: GREETER_BOARD_REACH,
    greetDistance: TRON_RUNNER_GREET_DISTANCE,
    greeterBoardBubbleRange: GREETER_BOARD_BUBBLE_RANGE,
    greeterBoardStanceDeg: GREETER_BOARD_STANCE_DEG,
    crowdReachRadius: TRON_RUNNER_CROWD_REACH_RADIUS,
    pauseChance: TRON_RUNNER_CROWD_PAUSE_CHANCE,
    pauseMinMs: TRON_RUNNER_CROWD_PAUSE_MIN_MS,
    pauseMaxMs: TRON_RUNNER_CROWD_PAUSE_MAX_MS,
    turnDurationMs: TRON_RUNNER_CROWD_TURN_DURATION_MS,
    yieldDurationMs: TRON_RUNNER_CROWD_YIELD_DURATION_MS,
  };

  tronRunnerCrowdUpdateState = {
    runtime: () => tronRunnerCrowdRuntime,
    crowd: tronRunnerCrowd,
    crowdGroup: tronRunnerCrowdGroup,
    stats: tronRunnerCrowdRuntimeStats,
    crowdEnabled: TRON_RUNNER_CROWD_ENABLED,
    maxAccumulatedDt: TRON_RUNNER_CROWD_MAX_ACCUMULATED_DT,
    updateInterval: TRON_RUNNER_CROWD_UPDATE_INTERVAL,
    now: () => performance.now(),
    syncMemberMatrixUpdates: syncTronRunnerCrowdMemberMatrixUpdates,
    advanceState: tronRunnerCrowdAdvanceState,
    camera,
    runnerState: tronRunnerState,
    getWalkSpeed: () => tronRunnerWalkSpeed,
    crowdSpeedScale: TRON_RUNNER_CROWD_SPEED_SCALE,
    greeterIndex: TRON_RUNNER_GREETER_INDEX,
    greeterSpeedMultiplier: GREETER_SPEED_MULTIPLIER,
    greeterRunSpeedBoost: GREETER_RUN_SPEED_BOOST,
    greeterRunCycleDistance: GREETER_RUN_CYCLE_DISTANCE,
    cullingEnabled: TRON_RUNNER_CROWD_CULLING_ENABLED,
    culledLodStride: TRON_RUNNER_CROWD_CULLED_LOD_STRIDE,
    intelligenceEnabled: TRON_RUNNER_CROWD_INTELLIGENCE_ENABLED,
    distanceDrivenWalkEnabled: TRON_RUNNER_CROWD_DISTANCE_DRIVEN_WALK_ENABLED,
    maxMoveSubstep: TRON_RUNNER_CROWD_MAX_MOVE_SUBSTEP,
    talkRange: TRON_RUNNER_CROWD_TALK_RANGE,
    talkRearmRange: TRON_RUNNER_CROWD_TALK_REARM_RANGE,
    talkDurationMs: TRON_RUNNER_CROWD_TALK_DURATION_MS,
    accumulatedDt: 0,
  };

  tronRunnerCrowdInspectState = {
    runtime: () => tronRunnerCrowdRuntime,
    runnerWalker: tronRunnerWalker,
    targetHeight: TRON_RUNNER_TARGET_HEIGHT,
    roadTopY: roadTileTopY,
    now: () => performance.now(),
    crowd: tronRunnerCrowd,
    crowdGroup: tronRunnerCrowdGroup,
    greeterFollowDelayMs: GREETER_FOLLOW_DELAY_MS,
    crowdBox: tronRunnerCrowdBox,
    crowdSize: tronRunnerCrowdSize,
    groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
    routes: tronRunnerCrowdRoutes,
    runnerState: tronRunnerState,
    getLedBrightness: () => tronRunnerLedBrightness,
    getLedBloom: () => tronRunnerLedBloom,
    characterLedEmissiveMax: TRON_RUNNER_CHARACTER_LED_EMISSIVE_MAX,
    pathMode: TRON_RUNNER_CROWD_PATH_MODE,
    roadHalf,
    deadlockMs: TRON_RUNNER_CROWD_DEADLOCK_MS,
    collisionEnabled: TRON_RUNNER_CROWD_COLLISIONS_ENABLED,
    requestedCount: TRON_RUNNER_CROWD_COUNT,
    getCloneRunnerSkeleton: () => cloneRunnerSkeleton,
    dynamicReflectionEnabled: TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
    reflectionMaxActive: TRON_RUNNER_CROWD_REFLECTION_MAX_ACTIVE,
    reflectionNearDistance: TRON_RUNNER_CROWD_REFLECTION_NEAR_DISTANCE,
    reflectionMinFps: TRON_RUNNER_CROWD_REFLECTION_MIN_FPS,
    reflectionPostRevealRampEnabled: TRON_RUNNER_CROWD_REFLECTION_POST_REVEAL_RAMP_ENABLED,
    reflectionPostRevealRampMs: TRON_RUNNER_CROWD_REFLECTION_POST_REVEAL_RAMP_MS,
    reflectionYScale: TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE,
    cullingEnabled: TRON_RUNNER_CROWD_CULLING_ENABLED,
    cullDistance: TRON_RUNNER_CROWD_CULL_DISTANCE,
    cullRadius: TRON_RUNNER_CROWD_CULL_RADIUS,
    culledLodStride: TRON_RUNNER_CROWD_CULLED_LOD_STRIDE,
    buildStats: tronRunnerCrowdBuildStats,
    buildQueueState: tronRunnerCrowdBuildQueueState,
    intelligenceEnabled: TRON_RUNNER_CROWD_INTELLIGENCE_ENABLED,
    avoidanceEnabled: TRON_RUNNER_CROWD_AVOIDANCE_ENABLED,
    avoidanceRadius: TRON_RUNNER_CROWD_AVOIDANCE_RADIUS,
    spatialCell: TRON_RUNNER_CROWD_SPATIAL_CELL,
    distanceCacheEnabled: TRON_RUNNER_CROWD_DISTANCE_CACHE_ENABLED,
    lodNearDistance: TRON_RUNNER_CROWD_LOD_NEAR_DISTANCE,
    lodMidDistance: TRON_RUNNER_CROWD_LOD_MID_DISTANCE,
    targetFps: TRON_RUNNER_CROWD_TARGET_FPS,
    updateInterval: TRON_RUNNER_CROWD_UPDATE_INTERVAL,
    scaleLock: TRON_RUNNER_CROWD_SCALE_LOCK,
    stats: tronRunnerCrowdRuntimeStats,
    crowdEnabled: TRON_RUNNER_CROWD_ENABLED,
  };
}


export function tronRunnerRevealIsComplete() {
  return tronRunnerReveal?.isComplete() ?? !TRON_RUNNER_REVEAL_ENABLED;
}

export function tronRunnerRevealStartedAtTime() {
  return tronRunnerReveal?.startedAt() ?? 0;
}

export function tronRunnerRevealIsActive() {
  return tronRunnerReveal?.isActive() ?? false;
}

export function tronRunnerRevealProgressValue() {
  return tronRunnerReveal?.progress() ?? (TRON_RUNNER_REVEAL_ENABLED ? 0 : 1);
}

function tronRunnerEffectiveAnimationSpeed() {
  return computeTronRunnerEffectiveAnimationSpeed({
    walkSpeed: tronRunnerWalkSpeed,
    defaultSpeed: TRON_RUNNER_DEFAULT_SPEED,
    animationSpeed: tronRunnerAnimationSpeed,
    strideSync: tronRunnerStrideSync,
  });
}

function tronRunnerSurfaceYAt(x = tronRunnerWalker.position.x, z = tronRunnerWalker.position.z) {
  const padHit = basePadAtPoint(x, z);
  const topY = padHit?.topY ?? roadTileTopY();
  tronRunnerState.surface = padHit ? 'sidewalk' : 'road-fallback';
  tronRunnerState.surfaceY = topY + TRON_RUNNER_GROUND_OFFSET;
  return tronRunnerState.surfaceY;
}
function tronRunnerSurfaceYForPoint(x, z) {
  // Reused scratch: all callers consume the result synchronously in sequential tick phases.
  const padHit = basePadAtPoint(x, z);
  const groundY = padHit?.topY ?? roadTileTopY();
  tronRunnerSurfaceScratch.y = groundY + TRON_RUNNER_CROWD_GROUND_OFFSET;
  tronRunnerSurfaceScratch.groundY = groundY;
  tronRunnerSurfaceScratch.surface = padHit ? 'sidewalk' : 'road-fallback';
  return tronRunnerSurfaceScratch;
}

function setTronRunnerSubtreeMatrixAutoUpdate(root, enabled) {
  if (!root || root.userData.tronRunnerMatrixAutoUpdateEnabled === enabled) return;
  if (!enabled) root.updateMatrixWorld(true);
  root.traverse((object) => {
    object.matrixAutoUpdate = enabled;
    object.matrixWorldAutoUpdate = enabled;
    if (!enabled) object.matrixWorldNeedsUpdate = false;
  });
  root.userData.tronRunnerMatrixAutoUpdateEnabled = enabled;
  if (enabled) root.updateMatrixWorld(true);
}

function refreshTronRunnerFrozenSubtreeMatrices(root) {
  if (!root || root.userData.tronRunnerMatrixAutoUpdateEnabled !== false) return;
  root.updateMatrix();
  root.updateMatrixWorld(true);
}

function syncTronRunnerCrowdMemberMatrixUpdates(member, refreshHidden = false) {
  const characterVisible = Boolean(tronRunnerCrowdGroup.visible && member.group.visible);
  const reflectionVisible = Boolean(member.reflectionGroup?.visible);
  setTronRunnerSubtreeMatrixAutoUpdate(member.group, characterVisible);
  setTronRunnerSubtreeMatrixAutoUpdate(member.reflectionGroup, reflectionVisible);
  if (refreshHidden) {
    if (!characterVisible) refreshTronRunnerFrozenSubtreeMatrices(member.group);
    if (!reflectionVisible) refreshTronRunnerFrozenSubtreeMatrices(member.reflectionGroup);
  }
}

function tronRunnerDroneAnchor() {
  const target = computeDroneIntroTargetPose?.();
  if (target && Number.isFinite(target.x) && Number.isFinite(target.z)) return { x: target.x, z: target.z };
  return {
    x: Number.isFinite(getPlayerSpawn()?.x) ? getPlayerSpawn().x : 0,
    z: Number.isFinite(getPlayerSpawn()?.z) ? getPlayerSpawn().z : boulevard.dynamicRoadCenter,
  };
}

export function applyCharacterControlsFromUI() {
  tronRunnerBodyLight = Number(controlEls.runnerBodyLight.value);
  tronRunnerLineLight = Number(controlEls.runnerLineLight.value);
  tronRunnerKeyLight = Number(controlEls.runnerKeyLight.value);
  tronRunnerRimLight = Number(controlEls.runnerRimLight.value);
  tronRunnerFillLight = Number(controlEls.runnerFillLight.value);
  tronRunnerLedBrightness = Number(controlEls.runnerLedBrightness.value);
  tronRunnerLedBloom = Number(controlEls.runnerLedBloom.value);
  tronRunnerBeatPulse.setControls({
    enabled: controlEls.runnerBeatPulseEnabled.value === 'on',
    bpm: Number(controlEls.runnerBeatPulseBpm.value),
    offset: Number(controlEls.runnerBeatPulseOffset.value),
    intensity: Number(controlEls.runnerBeatPulseIntensity.value),
    decay: Number(controlEls.runnerBeatPulseDecay.value),
    division: Number(controlEls.runnerBeatPulseDivision.value),
  });
  tronRunnerMaterialReflect = Number(controlEls.runnerMaterialReflect.value);
  tronRunnerMaterialMetalness = Number(controlEls.runnerMaterialMetalness.value);
  tronRunnerMaterialRoughness = Number(controlEls.runnerMaterialRoughness.value);
  const characterBubbleBgOpacity = Number(controlEls.characterBubbleBgOpacity.value);
  setCharacterBubbleBackgroundOpacity(
    characterBubbleBgOpacity / CHARACTER_BUBBLE_BG_OPACITY_RANGE_MULTIPLIER
  );
  tronRunnerFloorReflection = Number(controlEls.runnerFloorReflection.value);
  tronRunnerFloorReflectionScale = Number(controlEls.runnerFloorReflectionScale.value);
  tronRunnerShadowSoftness = Number(controlEls.runnerShadowSoftness.value);
  tronRunnerShadowPulse = Number(controlEls.runnerShadowPulse.value);
  tronRunnerShadowCyan = Number(controlEls.runnerShadowCyan.value);
  tronRunnerShadowOffsetX = Number(controlEls.runnerShadowOffsetX.value);
  tronRunnerShadowOffsetZ = Number(controlEls.runnerShadowOffsetZ.value);
  tronRunnerKeyLightY = Number(controlEls.runnerKeyLightY.value);
  tronRunnerKeyLightZ = Number(controlEls.runnerKeyLightZ.value);
  tronRunnerRimLightX = Number(controlEls.runnerRimLightX.value);
  tronRunnerFillLightY = Number(controlEls.runnerFillLightY.value);
  tronRunnerScale = Number(controlEls.runnerScale.value);
  tronRunnerAnimationSpeed = Number(controlEls.runnerAnimationSpeed.value);
  tronRunnerWalkSpeed = Number(controlEls.runnerWalkSpeed.value);
  tronRunnerStrideSync = Number(controlEls.runnerStrideSync.value);
  applyTronRunnerVisualControls();
  const beatPulseControls = tronRunnerBeatPulse.controlValues();
  controlEls.runnerBodyLightVal.textContent = tronRunnerBodyLight.toFixed(2);
  controlEls.runnerLineLightVal.textContent = tronRunnerLineLight.toFixed(2);
  controlEls.runnerKeyLightVal.textContent = tronRunnerKeyLight.toFixed(2);
  controlEls.runnerRimLightVal.textContent = tronRunnerRimLight.toFixed(2);
  controlEls.runnerFillLightVal.textContent = tronRunnerFillLight.toFixed(2);
  controlEls.runnerLedBrightnessVal.textContent = `${tronRunnerLedBrightness.toFixed(2)}x`;
  controlEls.runnerLedBloomVal.textContent = `${tronRunnerLedBloom.toFixed(2)}x`;
  controlEls.runnerBeatPulseEnabledVal.textContent = beatPulseControls.enabled ? 'on' : 'off';
  controlEls.runnerBeatPulseBpmVal.textContent = beatPulseControls.bpm.toFixed(0);
  controlEls.runnerBeatPulseOffsetVal.textContent = `${beatPulseControls.offset.toFixed(2)} s`;
  controlEls.runnerBeatPulseIntensityVal.textContent = `${beatPulseControls.intensity.toFixed(2)}x`;
  controlEls.runnerBeatPulseDecayVal.textContent = beatPulseControls.decay.toFixed(1);
  controlEls.runnerBeatPulseDivisionVal.textContent = `${beatPulseControls.division.toFixed(2)}x`;
  controlEls.runnerMaterialReflectVal.textContent = tronRunnerMaterialReflect.toFixed(2);
  controlEls.runnerMaterialMetalnessVal.textContent = tronRunnerMaterialMetalness.toFixed(2);
  controlEls.runnerMaterialRoughnessVal.textContent = tronRunnerMaterialRoughness.toFixed(2);
  controlEls.characterBubbleBgOpacityVal.textContent = characterBubbleBgOpacity.toFixed(2);
  controlEls.runnerFloorReflectionVal.textContent = tronRunnerFloorReflection.toFixed(2);
  controlEls.runnerFloorReflectionScaleVal.textContent = tronRunnerFloorReflectionScale.toFixed(2);
  controlEls.runnerShadowSoftnessVal.textContent = tronRunnerShadowSoftness.toFixed(2);
  controlEls.runnerShadowPulseVal.textContent = tronRunnerShadowPulse.toFixed(2);
  controlEls.runnerShadowCyanVal.textContent = tronRunnerShadowCyan.toFixed(2);
  controlEls.runnerShadowOffsetXVal.textContent = tronRunnerShadowOffsetX.toFixed(2);
  controlEls.runnerShadowOffsetZVal.textContent = tronRunnerShadowOffsetZ.toFixed(2);
  controlEls.runnerKeyLightYVal.textContent = tronRunnerKeyLightY.toFixed(2);
  controlEls.runnerKeyLightZVal.textContent = tronRunnerKeyLightZ.toFixed(2);
  controlEls.runnerRimLightXVal.textContent = tronRunnerRimLightX.toFixed(2);
  controlEls.runnerFillLightYVal.textContent = tronRunnerFillLightY.toFixed(2);
  controlEls.runnerScaleVal.textContent = tronRunnerScale.toFixed(2);
  controlEls.runnerAnimationSpeedVal.textContent = `${tronRunnerAnimationSpeed.toFixed(2)}x`;
  controlEls.runnerWalkSpeedVal.textContent = tronRunnerWalkSpeed.toFixed(2);
  controlEls.runnerStrideSyncVal.textContent = tronRunnerStrideSync.toFixed(2);
}

export function applyCinematicGroundingInitialControls() {
  if (!cinematicGroundingSettings.enabled || cinematicGroundingInitialControlsApplied) return;
  cinematicGroundingInitialControlsApplied = true;
  controlEls.runnerFloorReflection.value = cinematicGroundingSettings.floorReflection.toFixed(2);
  controlEls.runnerFloorReflectionScale.value = cinematicGroundingSettings.floorReflectionScale.toFixed(2);
  controlEls.runnerShadowSoftness.value = cinematicGroundingSettings.shadowSoftness.toFixed(2);
  controlEls.runnerShadowPulse.value = cinematicGroundingSettings.shadowPulse.toFixed(2);
  controlEls.runnerShadowCyan.value = cinematicGroundingSettings.shadowCyan.toFixed(2);
  controlEls.runnerShadowOffsetZ.value = cinematicGroundingSettings.shadowOffsetZ.toFixed(2);
}
