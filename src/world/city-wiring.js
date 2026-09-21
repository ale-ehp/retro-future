// Il cablaggio della citta': palazzi, porte, LED di facciata, piazzole, ponti,
// tabelloni dei reparti, terminale dei contatti, equalizer, folla, e il rivelo che
// accende tutto quanto.
//
// Spostato qui da main.js senza cambiare la logica (tappa 5, 2026-09-19). Ogni pezzo
// ha gia' il suo modulo sotto world/ e character/: qui c'e' solo l'ordine in cui si
// montano e con quali argomenti. Misurato prima di tagliare: il dominio non scrive
// niente fuori; chiama tre funzioni di main (le due che ricalcolano i volumi di culling
// e i limiti del bordo strada) che arrivano come dipendenze.
//
// Il pezzo COSTRUISCE, quindi sta dentro initCityWiring(): main.js importa questo file
// prima di creare scena, camera e renderer. I binding sono dichiarati in cima e
// assegnati dentro la funzione, nello stesso ordine di prima; le quattro funzioni
// restano a livello di modulo. L'ORDINE dei montaggi e' logica: non e' stato toccato.

import {
  TRON_SOUNDTRACK_BEAT_DROP_SECONDS,
  TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS,
  TRON_SOUNDTRACK_URL,
} from '../audio/audio.js';
import { ensureTronAudioContext, resetFootstepCadence } from '../audio/player-footsteps.js';
import { collisioni, isCameraCollisionDisabled } from '../camera/camera-collision.js';
import { getDroneIntroActive } from '../camera/drone-intro.js';
import {
  getPointerLocked,
  resumeMouseLookInput,
  stopMouseLookInput,
  updatePointerLockHint,
} from '../camera/mouse-look.js';
import {
  DEFAULT_DRONE_LANDING_POSE,
  applyCameraLook,
  lerpAngle,
  player,
  removeViewMotionOffset,
} from '../camera/player-state.js';
import {
  TRON_RUNNER_BEAT_PULSE_AUDIO_KICK_ENABLED,
  TRON_RUNNER_REVEAL_ENABLED,
  TRON_RUNNER_SOURCE_CHARACTER_VISIBLE,
  TRON_RUNNER_TARGET_HEIGHT,
} from '../character/characters.js';
import {
  TRON_RUNNER_CROWD_TALK_DURATION_MS,
  TRON_RUNNER_CROWD_TALK_RANGE,
  TRON_RUNNER_CROWD_TALK_REARM_RANGE,
} from '../character/runner-crowd-lines.js';
import { invalidateTronRunnerCrowdColliderRecordsRuntime } from '../character/runner-crowd-runtime.js';
import {
  initRunnerWiring,
  tronRunnerCrowd,
  tronRunnerCrowdGroup,
  tronRunnerCrowdRuntime,
  tronRunnerCrowdRuntimeStats,
  tronRunnerIdleCharacterGroup,
  tronRunnerIdleTalk,
  tronRunnerRevealIsActive,
  tronRunnerRevealIsComplete,
  tronRunnerRevealProgressValue,
  tronRunnerRevealStartedAtTime,
  tronRunnerState,
} from '../character/runner-wiring.js';
import { initSpeechBubbles } from '../character/speech-bubbles.js';
import { TRON_RUNNER_GREETER_INDEX } from '../config/costanti.js';
import {
  initBridgeControls,
  readBridgeNumber,
  readBridgeVisible,
  updateBridgeControlOutputs,
} from '../controls/bridge-controls.js';
import { tunedColor } from '../controls/control-panel.js';
import { initLabEqualizer } from '../controls/equalizer.js';
import { scheduleLiveControls } from '../controls/live-controls.js';
import { resetMobileMovementInput } from '../controls/mobile-movement.js';
import {
  clearMovementKeys,
  setHeadBobOffset,
  setMovementHorizontalSpeed,
  setMovementRunMix,
  setSideSwayOffset,
} from '../controls/movement.js';
import { createCityRevealProfiler, revealProfileDetailRequestedFromParams } from '../engine/city-reveal-profiler.js';
import { fxEnabled } from '../engine/fx-debug-toggles.js';
import {
  mobilePerformanceProfileActive,
  post,
  shouldUseComposer,
  syncGlobalFxaaPass,
} from '../engine/post-pipeline.js';
import { retroBenchmarkSearchParams } from '../engine/retro-benchmark-runtime.js';
import { initStaticCityCulling } from '../engine/static-city-culling.js';
import {
  basePadLedBatch,
  createBuildingBasePad,
  getBasePadCurbEnabled,
  initBasePads,
  updateBuildingBasePad,
} from './base-pads.js';
import { GRID_BLOCK, laneZ } from './boulevard-constants.js';
import { boulevard, roadHalf } from './boulevard-layout.js';
import { BRIDGE_PAIR_5_6_INDEX, BRIDGE_PAIR_5_6_Y_OFFSET, createBridgeRuntime } from './bridges.js';
import {
  SIDE_BUILDING_CIVIC_NUMBER_FIXED,
  buildSideBuildingCivicNumber,
  buildSideBuildingDoor,
  buildSideBuildingDoorBatches,
  getSideDoorEnabled,
  initBuildingDoors,
  sideBuildingCivicNumberForBuildIndex,
  sideDoorBatchState,
  sideDoorFaceOffset,
  sideDoorHeight,
  sideDoorScale,
  sideDoorWidth,
  sideDoorY,
  updateSideBuildingDoorBatchMeshes,
  updateSideBuildingDoorTransforms,
} from './building-doors.js';
import {
  addBuildingEdges,
  addElStripRectFrame,
  buildBridgeEdgeBatch,
  buildSideBuildingEdgeBatch,
  buildSideHorizontalLedRingBatches,
  edgeStripSpecs,
  elStrip,
  horizontalBuildingLedRings,
  initBuildingLeds,
  setBridgeEdgeSpecCullVisible,
  sideBuildingEdgeBatch,
  sideHorizontalLedRingBatches,
} from './building-leds.js';
import {
  bridgeMaterials,
  buildBuildingShells,
  createWetAsphaltFacadeMaterial,
  initBuildings,
  mainBuildingRecords,
  makeChamferedBox,
  sideBuildingRecords,
} from './buildings.js';
import {
  CITY_DEPARTMENT_BOARD_ENABLED,
  cityDepartmentBoardBottomY,
  cityDepartmentBoardRevealFactor,
  getCityDepartmentBoards,
  initCityDepartmentBoards,
} from './city-boards.js';
import {
  CITY_ROLE_BOARD_ENABLED,
  getCityRoleBoards,
  initCityRoleBoards,
  syncCityRoleBoardDoorPose,
} from './city-role-boards.js';
import { createCityRevealMainLed } from './city-reveal-main-led.js';
import { createCityRevealRenderRuntime } from './city-reveal-render-runtime.js';
import {
  cityRevealArmedAt,
  cityRevealComplete,
  cityRevealCompletedAt,
  cityRevealDelayMs,
  cityRevealEffectiveDelayMs,
  cityRevealEstimatedVisibleObjects,
  cityRevealFadeDurationMs,
  cityRevealFrontForProgress,
  cityRevealOverlayCamera,
  cityRevealOverlayScene,
  cityRevealRealClipPlane,
  cityRevealRoadGridGroup,
  cityRevealRoadGridScene,
  cityRevealSolidObjects,
  cityRevealStartedAt,
  cityRevealSweepProgress,
  cityRevealWireAlpha,
  cityRevealWireCullStats,
  cityRevealWireObjects,
  cityRevealWireScene,
  cityRevealWireframeEnabled,
  initCityRevealWireframe,
  isCityRevealBackplateActive,
  isCityRevealCompositeActive,
  isCityRevealRealRevealActive,
  refreshCityRevealSweepBounds,
  setCityRevealSweepFront,
} from './city-reveal-wireframe.js';
import { initContactTerminal } from './contact-terminal.js';
import {
  MAIN_FACADE_VERTICAL_REVEAL_FEATHER,
  addTronFacadeTreatment,
  buildStaticFacadeStripBatches,
  createFacadeLedMaterial,
  facadeLedBatchInspect,
  hasMainFacadeVerticalRevealLedMaterials,
  initFacadeLedTreatment,
  mainFacadeVerticalRevealLedBounds,
  setMainFacadeVerticalRevealUniforms,
  updateFacadeLedRibbons,
  updateFacadeStripOutsets,
} from './facade-led-treatment.js';
import { roadTileTopY, sidewalkMinSurfaceY } from './hex-tiles.js';
import * as THREE from 'three';

/** @type {any} */ let scene = null;
/** @type {any} */ let camera = null;
/** @type {any} */ let renderer = null;
/** @type {any} */ let controlEls = null;
/** @type {any} */ let PAL = null;
/** @type {any} */ let reflectionEnvMap = null;
/** @type {any} */ let asphalt = null;
/** @type {any} */ let basePadSurfaceTex = null;
/** @type {any} */ let cinematicGroundingSettings = null;
/** @type {any} */ let RunnerGLTFLoader = null;
/** @type {any} */ let cloneRunnerSkeleton = null;
/** @type {any} */ let contactTerminalActionEl = null;
/** @type {any} */ let contactTerminalBackEl = null;
/** @type {any} */ let contactTerminalSurfaceEl = null;
/** @type {any} */ let contactTerminalLiveEl = null;
/** @type {any} */ let postRevealPerfIsolationState = null;
/** @type {any} */ let performanceDiagnostics = null;
/** @type {any} */ let tronSoundtrack = null;
/** @type {any} */ let scheduleTronSoundtrackIntroLofiStopForReveal = null;
/** @type {any} */ let setupTronSoundtrackGraph = null;
/** @type {any} */ let cityRevealSkyScene = null;
/** @type {any} */ let domeMesh = null;
/** @type {any} */ let renderCityRevealSkyBase = null;
/** @type {any} */ let syncCityRevealSkyDome = null;
/** @type {any} */ let syncCityRevealSkyMaterial = null;
/** @type {any} */ let refreshCullingBounds = null;
/** @type {any} */ let refreshCullingBoundsWithMargin = null;
/** @type {any} */ let roadHexBoundaryLimits = null;
let getDynamicRoadSurfaceWidth = () => 0;
let getLatestMeasuredFps = () => 0;

// I binding costruiti da initCityWiring().
let overlayGroup = null;
let tronRunnerCrowdColliderRecordCache = null;
export let cityRevealMainLedReveal = null;
export let mainFacadeVerticalRevealState = null;
export let bridges = null;
export let cityRevealRender = null;
export let cityRevealProfiler = null;

/** Monta la citta', nello stesso ordine in cui stava in main.js. */
export function initCityWiring(deps) {
  ({
    scene, camera, renderer, controlEls, PAL, reflectionEnvMap, asphalt, basePadSurfaceTex,
    cinematicGroundingSettings, RunnerGLTFLoader, cloneRunnerSkeleton, contactTerminalActionEl,
    contactTerminalBackEl, contactTerminalSurfaceEl, contactTerminalLiveEl,
    postRevealPerfIsolationState, performanceDiagnostics, tronSoundtrack,
    scheduleTronSoundtrackIntroLofiStopForReveal, setupTronSoundtrackGraph, cityRevealSkyScene,
    domeMesh, renderCityRevealSkyBase, syncCityRevealSkyDome, syncCityRevealSkyMaterial,
    refreshCullingBounds, refreshCullingBoundsWithMargin, roadHexBoundaryLimits,
    getDynamicRoadSurfaceWidth, getLatestMeasuredFps,
  } = deps);

  // ---------- Tron overlay buildings ----------
  overlayGroup = new THREE.Group();
  scene.add(overlayGroup);
  tronRunnerCrowdColliderRecordCache = {
    records: null,
    sourceLength: -1,
  };
  initBuildings({
    asphalt,
    reflectionEnvMap,
    defaultBuildingColor: PAL.buildingSkin,
    tunedColor,
    getRoadHalf: roadHalf,
    updateBuildingBasePad,
    updateSideBuildingDoorTransforms,
    getCityRoleBoards,
    syncCityRoleBoardDoorPose,
  });
  cityRevealMainLedReveal = createCityRevealMainLed({
    scene,
    camera,
    domeMesh,
    getCityRevealStartedAt: () => cityRevealStartedAt,
    getCityRevealEffectiveDelayMs: () => cityRevealEffectiveDelayMs(),
    isCityRevealRealRevealActive,
    getMainFacadeVerticalRevealProgress: () => mainFacadeVerticalRevealProgress(),
    getSideBuildingRecords: () => sideBuildingRecords,
    getMainBuildingRecords: () => mainBuildingRecords,
    getBridgeRecords: () => bridges.records,
  });

  mainFacadeVerticalRevealState = {
    enabled: false,
    active: false,
    progress: 0,
    revealY: -1e9,
    minY: null,
    maxY: null,
    feather: MAIN_FACADE_VERTICAL_REVEAL_FEATHER,
  };
  initBuildingDoors({
    overlayGroup,
    renderer,
    reflectionEnvMap,
    PAL,
    sideBuildingRecords,
    laneZ,
    refreshCullingBounds,
    tunedColor,
    createWetAsphaltFacadeMaterial,
  });
  initFacadeLedTreatment({
    PAL,
    reflectionEnvMap,
    refreshCullingBounds,
    tunedColor,
    registerMainBuildingVerticalRevealOverlayObject: cityRevealMainLedReveal.registerOverlayObject,
    getSideBuildingWidthScale: () => boulevard.sideBuildingWidthScale,
    getSideBuildingDepthScale: () => boulevard.sideBuildingDepthScale,
    getMainBuildingWidthScale: () => boulevard.mainBuildingWidthScale,
    getMainBuildingDepthScale: () => boulevard.mainBuildingDepthScale,
  });
  bridges = createBridgeRuntime({
    overlayGroup,
    PAL,
    bridgeMaterials,
    getRoadHalf: roadHalf,
    getSideBuildingWidthScale: () => boulevard.sideBuildingWidthScale,
    getStreetEdgeWidth: () => boulevard.streetEdgeWidth,
    makeChamferedBox,
    createWetAsphaltFacadeMaterial,
    addBuildingEdges,
    readBridgeNumber,
    readBridgeVisible,
    updateBridgeControlOutputs,
  });

  initBuildingLeds({
    PAL,
    roadHalf,
    getMainBuildingY: () => boulevard.mainBuildingY,
    getMainBuildingZ: () => boulevard.mainBuildingZ,
    getBridgeXOffset: bridges.getXOffset,
    getBridgeZOffset: bridges.getZOffset,
    getBridgeYOffset: bridges.getYOffset,
    getBridgeSpanScale: bridges.getSpanScale,
    getBridgeHeightScale: bridges.getHeightScale,
    getBridgeDepthScale: bridges.getDepthScale,
    bridgeSpanLength: bridges.spanLength,
    readBridgeNumber,
    readBridgeVisible,
    refreshCullingBounds,
    createFacadeLedMaterial,
    updateFacadeStripOutsets,
    updateFacadeLedRibbons,
  });
  initBasePads({
    scene,
    overlayGroup,
    PAL,
    reflectionEnvMap,
    basePadSurfaceTex,
    sideBuildingRecords,
    mainBuildingRecords,
    refreshCullingBounds,
    refreshCullingBoundsWithMargin,
    roadTileTopY,
    sidewalkMinSurfaceY,
    tunedColor,
  });
  // ---------- Bridge control panel (extracted -> bridge-controls.js) ----------
  initBridgeControls({
    controlEls,
    scheduleLiveControls,
    bridgeRecords: bridges.records,
    BRIDGE_PAIR_5_6_INDEX,
    BRIDGE_PAIR_5_6_Y_OFFSET,
  });

  buildBuildingShells({
    overlayGroup,
    PAL,
    addTronFacadeTreatment,
    createBuildingBasePad,
    buildSideBuildingDoor,
    buildSideBuildingCivicNumber,
    buildSideBuildingDoorBatches,
    updateSideBuildingDoorTransforms,
    sideBuildingCivicNumberForBuildIndex,
    addBuildingEdges,
    buildSideBuildingEdgeBatch,
    buildSideHorizontalLedRingBatches,
    buildStaticFacadeStripBatches,
    invalidateTronRunnerCrowdColliderRecords: () => (
      invalidateTronRunnerCrowdColliderRecordsRuntime(tronRunnerCrowdColliderRecordCache)
    ),
  });

  // ---------- City department departures boards (extracted -> city-boards.js) ----------
  initCityDepartmentBoards({
    scene,
    camera,
    renderer,
    reflectionEnvMap,
    PAL,
    elStrip,
    addElStripRectFrame,
    sideBuildingRecords,
    DEFAULT_DRONE_LANDING_POSE,
    TRON_RUNNER_REVEAL_ENABLED,
    getDroneLandingPose: () => player.droneLandingPose,
    getPlayerSpawn: () => player.playerSpawn,
    getCityRevealComplete: () => cityRevealComplete,
    getRunnerReady: () => tronRunnerState.ready,
    getRevealComplete: tronRunnerRevealIsComplete,
    getRevealStartedAt: tronRunnerRevealStartedAtTime,
    getRevealActive: tronRunnerRevealIsActive,
    getRevealProgress: tronRunnerRevealProgressValue,
  });

  initContactTerminal({
    scene,
    camera,
    renderer,
    reflectionEnvMap,
    PAL,
    addElStripRectFrame,
    sideBuildingRecords,
    getBottomY: cityDepartmentBoardBottomY,
    getPlayerSpawn: () => player.playerSpawn,
    getRevealComplete: () => cityRevealComplete && tronRunnerRevealIsComplete(),
    getRevealFactor: cityDepartmentBoardRevealFactor,
    getEffectEnabled: () => fxEnabled('deptBoards'),
    getOtherCameraActive: () => getDroneIntroActive() || isCityRevealCompositeActive(),
    getYaw: () => player.yaw,
    setYaw: (value) => { player.yaw = value; },
    getPitch: () => player.pitch,
    setPitch: (value) => { player.pitch = value; },
    getViewRoll: () => player.viewRoll,
    setViewRoll: (value) => { player.viewRoll = value; },
    applyCameraLook,
    clearMovement: clearMovementKeys,
    clearViewMotion: () => {
      removeViewMotionOffset();
      setHeadBobOffset(0);
      setSideSwayOffset(0);
      setMovementHorizontalSpeed(0);
      setMovementRunMix(0);
      player.viewRoll = 0;
      resetFootstepCadence();
    },
    stopMouseLook: stopMouseLookInput,
    resumeMouseLook: resumeMouseLookInput,
    resetMobileMovement: resetMobileMovementInput,
    getPointerLocked,
    prefersReducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    isMobile: mobilePerformanceProfileActive,
    actionButton: contactTerminalActionEl,
    backButton: contactTerminalBackEl,
    interactionSurface: contactTerminalSurfaceEl,
    liveRegion: contactTerminalLiveEl,
    body: document.body,
    eventTarget: window,
    history: window.history,
    locationHref: window.location.href,
  });

  // ---------- City role boards: fixed sector boards beside civic doors (extracted -> city-boards.js) ----------
  initCityRoleBoards({
    renderer,
    scene,
    sideBuildingRecords,
    sideDoorWidth,
    sideDoorHeight,
    sideDoorScale,
    sideDoorY,
    sideDoorFaceOffset,
    SIDE_BUILDING_CIVIC_NUMBER_FIXED,
  });

  // ---------- Real demo: phosphor audio equalizer on the start-side wall (extracted -> equalizer.js) ----------
  initLabEqualizer({
    scene,
    camera,
    renderer,
    controlEls,
    tronSoundtrack,
    performanceLiveMetrics: performanceDiagnostics.liveMetrics,
    postRevealPerfIsolationState,
    elStrip,
    addElStripRectFrame,
    ensureTronAudioContext,
    setupTronSoundtrackGraph,
    GRID_BLOCK,
    TRON_SOUNDTRACK_URL,
    TRON_RUNNER_BEAT_PULSE_AUDIO_KICK_ENABLED,
    getCityRevealComplete: () => cityRevealComplete,
    getDroneLandingPose: () => player.droneLandingPose,
    getPlayerSpawn: () => player.playerSpawn,
    getDynamicRoadCenter: () => boulevard.dynamicRoadCenter,
    getDynamicRoadLength: () => boulevard.dynamicRoadLength,
    getLatestMeasuredFps: () => getLatestMeasuredFps(),
  });

  // ---------- il personaggio e la folla stanno in character/runner-wiring.js ----------
  initRunnerWiring({
    scene,
    camera,
    renderer,
    controlEls,
    reflectionEnvMap,
    cinematicGroundingSettings,
    tronSoundtrack,
    postRevealPerfIsolationState,
    tronRunnerCrowdColliderRecordCache,
    RunnerGLTFLoader,
    cloneRunnerSkeleton,
    lerpAngle,
    isCameraCollisionDisabled,
    roadHexBoundaryLimits,
    getPlayerSpawn: () => player.playerSpawn,
    getDroneLandingPose: () => player.droneLandingPose,
    getCollisionPadding: () => collisioni.collisionPadding,
    getMainBuildingCollisionPadding: () => collisioni.mainBuildingCollisionPadding,
    getLatestMeasuredFps: () => getLatestMeasuredFps(),
  });

  // ---------- Exact boulevard elevated links, rendered with cubemap materials ----------
  bridges.buildLinks([-144, -48, 48, 144]);
  buildBridgeEdgeBatch(overlayGroup);

  // (Ground rungs / spine strips removed — replaced by roadEdge tubes + clean median above)

  initStaticCityCulling({
    camera,
    sideBuildingRecords,
    mainBuildingRecords,
    bridgeRecords: bridges.records,
    cityDepartmentBoards: getCityDepartmentBoards(),
    cityRoleBoards: getCityRoleBoards(),
    edgeStripSpecs,
    horizontalBuildingLedRings,
    setBridgeEdgeSpecCullVisible,
    basePadLedBatch,
    sideDoorBatchState,
    gridBlock: GRID_BLOCK,
    departmentBoardEnabled: CITY_DEPARTMENT_BOARD_ENABLED,
    roleBoardEnabled: CITY_ROLE_BOARD_ENABLED,
    getSideDoorEnabled,
    getBasePadCurbEnabled,
    getRevealActive: tronRunnerRevealIsActive,
    updateDoorBatchMeshes: updateSideBuildingDoorBatchMeshes,
    departmentBoardRevealFactor: cityDepartmentBoardRevealFactor,
  });

  initSpeechBubbles({
    THREE,
    getScene: () => scene,
    getCamera: () => camera,
    getRenderer: () => renderer,
    getCrowd: () => tronRunnerCrowd,
    getCrowdGroup: () => tronRunnerCrowdGroup,
    getIdleGroup: () => tronRunnerIdleCharacterGroup,
    getIdleTalk: () => tronRunnerIdleTalk,
    isReady: () => cityRevealComplete,
    TARGET_HEIGHT: TRON_RUNNER_TARGET_HEIGHT,
    GREETER_INDEX: TRON_RUNNER_GREETER_INDEX,
    CROWD_TALK_RANGE: TRON_RUNNER_CROWD_TALK_RANGE,
    CROWD_TALK_REARM_RANGE: TRON_RUNNER_CROWD_TALK_REARM_RANGE,
    CROWD_TALK_DURATION_MS: TRON_RUNNER_CROWD_TALK_DURATION_MS,
    // gli stessi collisori che i personaggi usano per non attraversare i muri: cosi' i
    // cartelli non finiscono dentro i palazzi (2026-09-19)
    getColliderRecords: () => tronRunnerCrowdRuntime.colliderRecords(),
  });

  initCityRevealWireframe({
    camera,
    renderer,
    getPlayerSpawn: () => player.playerSpawn,
    getDynamicRoadSurfaceWidth: () => getDynamicRoadSurfaceWidth(),
    getDynamicRoadLength: () => boulevard.dynamicRoadLength,
    getDynamicRoadCenter: () => boulevard.dynamicRoadCenter,
    getRoadTopY: roadTileTopY,
    getSideBuildingRecords: () => sideBuildingRecords,
    getMainBuildingRecords: () => mainBuildingRecords,
    getBridgeRecords: () => bridges.records,
    getEdgeStripSpecs: () => edgeStripSpecs,
    stopMouseLookInput,
    updatePointerLockHint,
    syncCityRevealSkyMaterial,
    scheduleTronSoundtrackIntroLofiStopForReveal,
    // Master-clock feed for the beat-drop-anchored sweep: track position plus
    // where the drop sits in the track and how long the lofi release fade takes.
    getSoundtrackSyncState: () => ({
      playing: Boolean(tronSoundtrack.playing),
      currentTime: tronSoundtrack.elements[tronSoundtrack.activeIndex]?.currentTime ?? 0,
      dropAtSeconds: TRON_SOUNDTRACK_BEAT_DROP_SECONDS,
      lofiReleaseFadeSeconds: TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS,
    }),
  });

  cityRevealRender = createCityRevealRenderRuntime({
    renderer,
    scene,
    camera,
    domeMesh,
    getComposer: () => post.composer,
    cityRevealSkyScene,
    cityRevealOverlayScene,
    cityRevealOverlayCamera,
    cityRevealWireScene,
    cityRevealRoadGridScene,
    cityRevealMainLedReveal,
    cityRevealRealClipPlane,
    refreshCityRevealSweepBounds,
    setCityRevealSweepFront,
    cityRevealFrontForProgress,
    isCityRevealCompositeActive,
    isCityRevealRealRevealActive,
    isCityRevealBackplateActive,
    syncCityRevealSkyDome,
    renderCityRevealSkyBase,
    syncGlobalFxaaPass,
    shouldUseComposer,
  });


  cityRevealProfiler = createCityRevealProfiler({
    detailedProfile: revealProfileDetailRequestedFromParams(retroBenchmarkSearchParams),
    getCityRevealStartedAt: () => cityRevealStartedAt,
    getCityRevealArmedAt: () => cityRevealArmedAt,
    getCityRevealComplete: () => cityRevealComplete,
    getCityRevealCompletedAt: () => cityRevealCompletedAt,
    getCityRevealDelayMs: () => cityRevealDelayMs,
    getCityRevealSweepProgress: () => cityRevealSweepProgress,
    getCityRevealWireAlpha: () => cityRevealWireAlpha,
    getCityRevealWireCullStats: () => cityRevealWireCullStats,
    getCityRevealWireObjects: () => cityRevealWireObjects,
    getCityRevealSolidObjects: () => cityRevealSolidObjects,
    getCityRevealMainLedDepthProxyVisibleCount: cityRevealMainLedReveal.getDepthProxyVisibleCount,
    getCityRevealMainLedDepthProxyLastMode: cityRevealMainLedReveal.getDepthProxyLastMode,
    getMainBuildingVerticalRevealOverlayObjectCount: cityRevealMainLedReveal.getOverlayObjectCount,
    getTronRunnerCrowd: () => tronRunnerCrowd,
    getTronRunnerCrowdRuntimeStats: () => tronRunnerCrowdRuntimeStats,
    getRendererMemory: () => renderer.info.memory,
    getScene: () => scene,
    getCityRevealRoadGridGroup: () => cityRevealRoadGridGroup,
    getCityRevealMainLedDepthGroup: cityRevealMainLedReveal.getDepthGroup,
    getComposer: () => post.composer,
    getBloomPass: () => post.bloomPass,
    getFxaaPass: () => post.fxaaPass,
    getFsrUpscalePass: () => post.fsrUpscalePass,
    getCinematicLookPass: () => post.cinematicLookPass,
    getTemporalAaPass: () => post.temporalAaPass,
    getCityRevealSkyPass: () => cityRevealRender.getSkyPass(),
    getCityRevealOverlayPass: () => cityRevealRender.getOverlayPass(),
    getCityRevealWirePass: () => cityRevealRender.getWirePass(),
    getCityRevealRoadGridPass: () => cityRevealRender.getRoadGridPass(),
    getCityRevealScenePass: () => cityRevealRender.getScenePass(),
    getCityRevealMainLedRevealPass: cityRevealMainLedReveal.getPass,
    cityRevealPostRevealElapsedMs: (now) => tronRunnerCrowdRuntime.postRevealElapsedMs(now),
    cityRevealEffectiveDelayMs,
    cityRevealFadeDurationMs,
    isCityRevealRealRevealActive,
    isCityRevealMainLedRevealOverlayActive: cityRevealMainLedReveal.isOverlayActive,
    cityRevealEstimatedVisibleObjects,
    shouldUseComposer,
  });
}


export function buildingLedBatchInspect() {
  const sideRingBatches = Object.entries(sideHorizontalLedRingBatches).map(([band, batch]) => ({
    band,
    specs: batch.specs.length,
    meshReady: Boolean(batch.mesh),
    visible: Boolean(batch.mesh?.visible),
    count: batch.mesh?.count ?? 0,
    frustumCulled: Boolean(batch.mesh?.frustumCulled),
    geometryKey: batch.geometryKey,
  }));
  const sideRingSpecCount = sideRingBatches.reduce((sum, batch) => sum + batch.specs, 0);
  const sideRingDrawObjects = sideRingBatches.filter((batch) => batch.meshReady).length;
  const basePadBatches = basePadLedBatch.batches.map((batch, index) => ({
    index,
    count: batch.mesh?.count ?? 0,
    capacity: batch.capacity,
    visible: Boolean(batch.mesh?.visible),
    frustumCulled: Boolean(batch.mesh?.frustumCulled),
    x: batch.record?.mesh?.position.x ?? null,
    z: batch.record?.mesh?.position.z ?? null,
  }));
  const basePadBatchCount = basePadBatches.length;
  const basePadVisibleCount = basePadBatches.filter((batch) => batch.visible).length;
  const basePadFrustumCulledCount = basePadBatches.filter((batch) => batch.frustumCulled).length;
  const facadeInspect = facadeLedBatchInspect();
  return {
    sideEdgeBatch: {
      count: sideBuildingEdgeBatch.mesh?.count ?? 0,
      visible: Boolean(sideBuildingEdgeBatch.mesh?.visible),
      frustumCulled: Boolean(sideBuildingEdgeBatch.mesh?.frustumCulled),
    },
    sideHorizontalRings: {
      batched: true,
      specCount: sideRingSpecCount,
      drawObjects: sideRingDrawObjects,
      previousDrawObjects: sideRingSpecCount,
      savedDrawObjects: Math.max(0, sideRingSpecCount - sideRingDrawObjects),
      batches: sideRingBatches,
    },
    facade: facadeInspect,
    basePadLedBatch: {
      count: basePadLedBatch.count,
      visible: Boolean(basePadLedBatch.mesh?.visible),
      frustumCulled: basePadBatchCount > 0 && basePadFrustumCulledCount === basePadBatchCount,
    },
    basePadLedBatches: {
      splitByPad: true,
      batchCount: basePadBatchCount,
      visibleBatchCount: basePadVisibleCount,
      frustumCulledCount: basePadFrustumCulledCount,
      totalSegments: basePadLedBatch.count,
      previousDrawObjects: basePadBatchCount > 0 ? 1 : 0,
      batches: basePadBatches,
    },
  };
}



function mainFacadeVerticalRevealProgress() {
  if (cityRevealComplete) return 1;
  const revealElapsed = cityRevealMainLedReveal.revealElapsedMs();
  const revealDuration = Math.max(1, cityRevealFadeDurationMs() - cityRevealMainLedReveal.visibleDelayMs);
  const t = THREE.MathUtils.clamp(revealElapsed / revealDuration, 0, 1);
  return t * t * (3 - 2 * t);
}



export function updateMainFacadeVerticalReveal() {
  if (!hasMainFacadeVerticalRevealLedMaterials()) return;
  // Once the city reveal is complete the facade reveal is disabled (shader ignores revealY),
  // so skip the per-frame bounds recompute (filter + transform/world-position alloc chain).
  // Re-engages automatically if cityRevealComplete is toggled back off (debug re-run).
  if (cityRevealComplete) {
    if (mainFacadeVerticalRevealState.enabled || mainFacadeVerticalRevealState.revealY !== 1e9) {
      mainFacadeVerticalRevealState.enabled = false;
      mainFacadeVerticalRevealState.active = false;
      mainFacadeVerticalRevealState.progress = 1;
      mainFacadeVerticalRevealState.revealY = 1e9;
      mainFacadeVerticalRevealState.minY = null;
      mainFacadeVerticalRevealState.maxY = null;
      setMainFacadeVerticalRevealUniforms(1e9, MAIN_FACADE_VERTICAL_REVEAL_FEATHER, false);
    }
    return;
  }
  const bounds = mainFacadeVerticalRevealLedBounds();
  if (!bounds) {
    mainFacadeVerticalRevealState.enabled = false;
    mainFacadeVerticalRevealState.active = false;
    mainFacadeVerticalRevealState.progress = 1;
    mainFacadeVerticalRevealState.revealY = 1e9;
    mainFacadeVerticalRevealState.minY = null;
    mainFacadeVerticalRevealState.maxY = null;
    setMainFacadeVerticalRevealUniforms(1e9, MAIN_FACADE_VERTICAL_REVEAL_FEATHER, false);
    return;
  }
  const progress = mainFacadeVerticalRevealProgress();
  const feather = MAIN_FACADE_VERTICAL_REVEAL_FEATHER;
  const revealY = THREE.MathUtils.lerp(bounds.minY - feather, bounds.maxY + feather, progress);
  const enabled = cityRevealWireframeEnabled && !cityRevealComplete;
  mainFacadeVerticalRevealState.enabled = enabled;
  mainFacadeVerticalRevealState.active = enabled && progress > 0.001 && progress < 0.999;
  mainFacadeVerticalRevealState.progress = progress;
  mainFacadeVerticalRevealState.revealY = revealY;
  mainFacadeVerticalRevealState.minY = bounds.minY;
  mainFacadeVerticalRevealState.maxY = bounds.maxY;
  mainFacadeVerticalRevealState.count = bounds.count;
  mainFacadeVerticalRevealState.feather = feather;
  setMainFacadeVerticalRevealUniforms(revealY, feather, enabled);
}




export function shouldUpdateTronRunnerSourceCharacter() {
  return Boolean(TRON_RUNNER_SOURCE_CHARACTER_VISIBLE);
}
