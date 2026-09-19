import * as THREE from 'three';
import { createCtx } from './ctx.js';
import {
  GRID_BLOCK,
  MAIN_ROAD_WIDTH,
  SIDE_ROAD_LENGTH,
  SIDE_ROAD_X,
  SIDE_BUILDING_X,
  SIDE_BUILDING_BASE,
  SIDE_BUILDING_GAP,
  SIDE_BUILDING_SPACING,
  BRIDGE_BUILDING_CLEARANCE,
  BRIDGE_INNER_BUILDING_FACE_X,
  BRIDGE_HALF_SPAN,
  MAIN_ROAD_BASE_LENGTH,
  START_SIDE_EXTENSION,
  MAIN_ROAD_LENGTH,
  MAIN_ROAD_Z,
  MAIN_BUILDING_BASE,
  laneZ,
  STREET_EDGE_WIDTH_MAX,
  MAX_BUILDING_AXIS_SCALE,
  MAX_BOULEVARD_WIDTH_SCALE,
  MAX_DYNAMIC_ROAD_MARGIN,
  MAIN_BUILDING_SIDE_HEX_EXTENSION_ROWS,
} from './world/boulevard-constants.js';
import {
  CITY_REVEAL_BACKPLATE_SWEEP_PORTION,
  CITY_REVEAL_MAX_SKY_BACKPLATE_OPACITY,
  CITY_REVEAL_SWEEP_MARGIN_Z,
  FIXED_CAMERA_FOV,
  HEX_ROAD_UPDATE_FRAME_STRIDE,
  MAX_HEX_ROAD_ACCUMULATED_DT,
  SECONDARY_EFFECT_UPDATE_STRIDE,
} from './world/config.js';
import {
  createControlEls,
} from './controls/controls.js';
import { mountFixedControlDefaults } from './controls/fixed-control-defaults.js';
import {
  TRON_RUNNER_BEAT_PULSE_AUDIO_KICK_ENABLED,
  TRON_RUNNER_CONTACT_SHADOW_MAX_OPACITY,
  TRON_RUNNER_CONTACT_SHADOW_ROUNDNESS,
  TRON_RUNNER_DISTANCE_DRIVEN_WALK_ENABLED,
  TRON_RUNNER_ENABLED,
  TRON_RUNNER_FREE_ROAM_COLLISIONS_ENABLED,
  TRON_RUNNER_FREE_ROAM_COLLISION_RADIUS,
  TRON_RUNNER_FREE_ROAM_ENABLED,
  TRON_RUNNER_FREE_ROAM_FOOTSTEPS_ENABLED,
  TRON_RUNNER_FREE_ROAM_REACH_RADIUS,
  TRON_RUNNER_FREE_ROAM_SIDEWALK_INSET,
  TRON_RUNNER_GROUND_SHADOW_ENABLED,
  TRON_RUNNER_IDLE_CHARACTER_BODY_CLEARANCE,
  TRON_RUNNER_IDLE_CHARACTER_CIVIC,
  TRON_RUNNER_IDLE_CHARACTER_COLOR_PRESET,
  TRON_RUNNER_IDLE_CHARACTER_CORNER_FLAT_INSET,
  TRON_RUNNER_IDLE_CHARACTER_ENABLED,
  TRON_RUNNER_IDLE_CHARACTER_FRONT_WALL_CLEARANCE,
  TRON_RUNNER_IDLE_CHARACTER_LEAN_DEG,
  TRON_RUNNER_IDLE_CHARACTER_LIFT_PX,
  TRON_RUNNER_IDLE_CHARACTER_STATIC,
  TRON_RUNNER_IDLE_CHARACTER_WALL_CONTACT_EPS,
  TRON_RUNNER_IDLE_CHARACTER_Y_LIFT,
  TRON_RUNNER_LIGHTING_MODE,
  TRON_RUNNER_MODEL_URL,
  TRON_RUNNER_REVEAL_ENABLED,
  TRON_RUNNER_ROUTE_OFFSET,
  TRON_RUNNER_SHADOW_CYAN_COLOR,
  TRON_RUNNER_SIDEWALK_INSET,
  TRON_RUNNER_SIDEWALK_SIGN,
  TRON_RUNNER_SOURCE_CHARACTER_VISIBLE,
  TRON_RUNNER_SUIT_TEXTURE_MODE,
  TRON_RUNNER_TARGET_HEIGHT,
} from './character/characters.js';
import {
  fitTronRunnerModel as fitTronRunnerModelCore,
  makeTronRunnerActionSet,
} from './character/character-build.js';
import {
  cinematicGroundingSettingsFromParams,
} from './character/runner-visual-controls.js';
import {
  tronRunnerCrowdLedEmissiveIntensity,
} from './character/runner-crowd-leds.js';
import {
  tronRunnerFootstepAudioState as tronRunnerFootstepAudioStateCore,
  updateTronRunnerAutonomyFootsteps as updateTronRunnerAutonomyFootstepsCore,
} from './character/runner-footsteps.js';
import {
  enqueueTronRunnerCrowdBuildJobRuntime,
  invalidateTronRunnerCrowdColliderRecordsRuntime,
} from './character/runner-crowd-runtime.js';
import {
  TRON_RUNNER_CROWD_COLOR_PRESETS,
} from './character/character-colors.js';
import {
  TRON_RUNNER_CROWD_TALK_DURATION_MS,
  TRON_RUNNER_CROWD_TALK_RANGE,
  TRON_RUNNER_CROWD_TALK_REARM_RANGE,
} from './character/runner-crowd-lines.js';
import {
  resetTronRunnerAutonomy,
} from './character/runner-controller.js';
import {
  playTronRunnerAction,
  syncTronRunnerActionSetToDistance,
} from './character/runner-animation.js';
import {
  TRON_SOUNDTRACK_BEAT_DROP_SECONDS,
  TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS,
  TRON_SOUNDTRACK_URL,
} from './audio/audio.js';
import { createTronSoundtrackRuntime } from './audio/soundtrack-runtime.js';
import {
  ensureFootstepAudioReady,
  ensureTronAudioContext,
  getFootstepAudioContext,
  initPlayerFootsteps,
  inspectPlayerFootsteps,
  resetFootstepCadence,
  updateFootstepAudioFromWalk,
} from './audio/player-footsteps.js';
import { setButtonFeedback } from './controls/control-settings-runtime.js';
import { fxEnabled, fxToggleInspect } from './engine/fx-debug-toggles.js';
import {
  post,
  initPostPipeline,
  effectiveComposerPixelRatio,
  syncCinematicLookPass,
  syncTemporalAaPass,
  applyTemporalAaJitterForRender,
  clearTemporalAaJitterForRender,
  syncGlobalFxaaPass,
  syncBloomLookMerge,
  syncComposerBufferRoles,
  isBloomPassActive,
  shouldBypassBloomForRevealPerformance,
  isBloomRevealBypassed,
  syncBloomTemporalBudget,
  mobilePerformanceProfileActive,
  mobilePerformanceProfileInspect,
  effectiveRenderScaleForDevice,
  effectivePixelRatioForDevice,
  syncCityRevealPerformanceProfile,
  shouldUseComposer,
  applyRenderResolution,
  tunePerformanceBudget,
  setupPost,
} from './engine/post-pipeline.js';
import { createCityRevealProfiler, revealProfileDetailRequestedFromParams } from './engine/city-reveal-profiler.js';
import { createPerformanceDiagnostics } from './engine/performance-diagnostics.js';
import {
  createTechBreakdownOverlay,
  techBreakdownRequestedFromParams,
} from './engine/tech-breakdown-overlay.js';
import {
  retroBenchmarkSearchParams,
  retroBenchmarkRuntime,
  maybeStartRetroBenchmarkAuto,
  initRetroBenchmarkRuntime,
} from './engine/retro-benchmark-runtime.js';
import {
  CITY_DEPARTMENT_BOARD_ENABLED,
  addCityDepartmentFrame,
  cityDepartmentBoardBottomY,
  cityDepartmentBoardRevealFactor,
  getCityDepartmentBoards,
  initCityDepartmentBoards,
  updateCityDepartmentBoards,
  CITY_ROLE_BOARD_ENABLED,
  getCityRoleBoards,
  initCityRoleBoards,
  syncCityRoleBoardDoorPose,
  updateCityRoleBoard,
} from './world/city-boards.js';
import {
  contactTerminalOwnsCamera,
  handleContactTerminalKeyDown,
  initContactTerminal,
  updateContactTerminal,
} from './world/contact-terminal.js';
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
} from './world/building-doors.js';
import {
  addBuildingEdges,
  buildBridgeEdgeBatch,
  buildSideBuildingEdgeBatch,
  buildSideHorizontalLedRingBatches,
  addElStripRectFrame,
  edgeStripSpecs,
  elStrip,
  horizontalBuildingLedRings,
  initBuildingLeds,
  setBridgeEdgeSpecCullVisible,
  setStripInstanceTransform,
  sideBuildingEdgeBatch,
  sideHorizontalLedRingBatches,
} from './world/building-leds.js';
import {
  bridgeMaterials,
  buildBuildingShells,
  createWetAsphaltFacadeMaterial,
  initBuildings,
  mainBuildingRecords,
  makeChamferedBox,
  sideBuildingRecords,
} from './world/buildings.js';
import {
  BRIDGE_PAIR_5_6_INDEX,
  BRIDGE_PAIR_5_6_Y_OFFSET,
  createBridgeRuntime,
} from './world/bridges.js';
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
} from './world/facade-led-treatment.js';
import { createSkyDome } from './world/sky-dome.js';
import { initInspectHooks } from './engine/inspect-hooks.js';
import {
  initBootPrewarm,
  bootSceneWithFinalDefaults,
} from './engine/boot-prewarm.js';
import {
  initControlPanel,
  captureLivePlayerSpawn,
  performanceDiagnosticsEl,
  resetCameraHeightToDefault,
  trimProductionControls,
  tunedColor,
  updateStartPositionLiveLabel,
} from './controls/control-panel.js';
import {
  initLiveControls,
  applyLiveControls,
  scheduleLiveControls,
} from './controls/live-controls.js';
import {
  collisioni,
  initCameraCollision,
  isCameraCollisionDisabled,
  resolveCameraBuildingCollision,
  resolveCameraCrowdCollision,
  resolveCameraRoadHexBoundaryCollision,
} from './camera/camera-collision.js';
import {
  player,
  initPlayerState,
  DEFAULT_DRONE_LANDING_POSE,
  applyCameraLook,
  lerpAngle,
  removeViewMotionOffset,
  applyViewMotionOffset,
  cameraGroundHeightAt,
  resolveCameraWalkSurface,
} from './camera/player-state.js';
import {
  initRunnerWiring,
  tronRunnerBeatPulse,
  tronRunnerCrowd,
  tronRunnerCrowdGroup,
  tronRunnerCrowdRuntime,
  tronRunnerCrowdRuntimeStats,
  tronRunnerIdleCharacterGroup,
  tronRunnerIdleTalk,
  tronRunnerOrchestration,
  tronRunnerReveal,
  tronRunnerRevealIsActive,
  tronRunnerRevealIsComplete,
  tronRunnerRevealProgressValue,
  tronRunnerRevealStartedAtTime,
  tronRunnerState,
} from './character/runner-wiring.js';
import {
  boulevard,
  initBoulevardLayout,
  roadHalf,
  boulevardRoadWidth,
  roadSurfaceWidthForBuildings,
} from './world/boulevard-layout.js';
import { createCityRevealMainLed } from './world/city-reveal-main-led.js';
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
  cityRevealWaitingForVisibleFrame,
  cityRevealWireAlpha,
  cityRevealWireCullStats,
  cityRevealWireObjects,
  cityRevealWireScene,
  cityRevealWireframeEnabled,
  initCityRevealWireframe,
  isCityRevealBackplateActive,
  isCityRevealCompositeActive,
  isCityRevealPerformanceCritical,
  isCityRevealRealRevealActive,
  markCityRevealComplete,
  refreshCityRevealSweepBounds,
  renderCityRevealWireframe,
  setCityRevealRoadGridAlphaFactor,
  setCityRevealSweepFront,
  startCityRevealWireTimer,
  startCityRevealWireframe,
  updateCityRevealWireframe,
} from './world/city-reveal-wireframe.js';
import { createCityRevealRenderRuntime } from './world/city-reveal-render-runtime.js';
import {
  basePadLedBatch,
  createBuildingBasePad,
  getBasePadCurbEnabled,
  initBasePads,
  updateBuildingBasePad,
} from './world/base-pads.js';
import {
  initStaticCityCulling,
  staticCityCullStats,
  updateStaticCityCulling,
} from './engine/static-city-culling.js';
import {
  initBridgeControls,
  readBridgeNumber,
  readBridgeVisible,
  updateBridgeControlOutputs,
} from './controls/bridge-controls.js';
import {
  applyWelcomeWindowInputMode as applyWelcomeWindowInputModeCore,
  dismissWelcomeWindow as dismissWelcomeWindowCore,
  resetWelcomeWindowMotion as resetWelcomeWindowMotionCore,
  setupWelcomeWindowMotion,
  triggerWelcomeWindowTouch as triggerWelcomeWindowTouchCore,
  welcomeWindowUsesTouchPrompt as welcomeWindowUsesTouchPromptCore,
  welcomeWindowVisible as welcomeWindowVisibleCore,
} from './controls/welcome-ui.js';
import {
  initSpeechBubbles,
  updateGreeterSpeechBubble,
  updateTronRunnerCrowdSpeechBubbles,
} from './character/speech-bubbles.js';
import {
  initAtmosphereParticles,
  updateAtmosphereParticles,
} from './world/atmosphere-particles.js';
import {
  applyEdgePulseShader,
  updateEdgePulse,
} from './world/energy-pulse.js';
import {
  initMaterialTextures,
  makeBasePadSurfaceTexture,
  makeWetAsphaltFacadeTexture,
} from './world/material-textures.js';
import {
  groundShapeGeometry,
  setGroundLineLoop,
  setGroundSegment,
} from './world/ground-geometry.js';
import {
  boundaryErrorInspect,
  boundaryErrorNeedsUpdate,
  getRoadBoundaryHexStats,
  initBoundaryError,
  setTronNoclip,
  updateBoundaryError,
  updateRoadBoundaryPulse,
} from './world/boundary-error.js';
import {
  droneIntroHeroShotRequestedFromParams,
  droneIntroInspect,
  getDroneIntroActive,
  initDroneIntro,
  startDroneIntroFlight,
  updateDroneIntroFlight,
} from './camera/drone-intro.js';
import {
  getPointerLocked,
  getUnlockedMouseLookActive,
  initMouseLook,
  resumeMouseLookInput,
  stopMouseLookInput,
  updatePointerLockHint,
} from './camera/mouse-look.js';
import {
  handleTronDiscCursorMove,
  initDiscCursor,
  setTronDiscCursorRevealWaiting,
  setTronDiscCursorVisible,
  tronDiscCursorState,
  updateTronDiscCursor,
} from './camera/disc-cursor.js';
import {
  initMobileMovement,
  isMobileMovementControlTarget,
  resetMobileMovementInput,
  requestLandscapeFullscreen,
} from './controls/mobile-movement.js';
import {
  applyMovement,
  clearMovementKeys,
  clearVerticalMovementState,
  initMovement,
  movementHorizontalSpeed,
  movementRunMix,
  movementStrafeDirection,
  movementStrafeMix,
  movementVelocity,
  setHeadBobOffset,
  setMovementHorizontalSpeed,
  setMovementRunMix,
  setSideSwayOffset,
  stepPhase,
  updateWalkSimulation,
} from './controls/movement.js';
import { initKeyboard, keys } from './controls/keyboard.js';
import {
  HEX_ROAD_EMPTY_BATCH_CULLING_ENABLED,
  HEX_ROAD_UPLOAD_BATCH_LIMIT,
  addHexRoadTiles,
  ensureHexRoadTileCoverage,
  flushHexTileBatchUploads,
  getDirtyHexTileBatchCount,
  getHexTileHeightScale,
  getHexTileScale,
  hexRoadTileBatches,
  hexRoadTileBuckets,
  hexTileGeo,
  hexTileHeight,
  hexTileRadius,
  hexTileRowStep,
  hexRoadBatchStats,
  hexRoadRuntimeStats,
  initHexTileMaterials,
  initHexTileLayout,
  initHexTileSync,
  recoveringHexTiles,
  roadTileTopY,
  setHexRoadLodProfile,
  sidewalkMinSurfaceY,
  stepHexRoadTiles,
  streetEdgeHexTileBatches,
  streetEdgeHexTiles,
  updateHexRoadBatchLod,
  updateZTileBand,
} from './world/hex-tiles.js';
import {
  getReflectionEnvMap,
  initReflectionEnv,
} from './engine/reflection-env.js';
import {
  LAB_EQUALIZER_ANALYSER_MAX_DB,
  LAB_EQUALIZER_ANALYSER_MIN_DB,
  LAB_EQUALIZER_ANALYSER_SMOOTHING,
  LAB_EQUALIZER_AUDIO_KICK_SAMPLE_INTERVAL_MS,
  LAB_EQUALIZER_AUDIO_SAMPLE_INTERVAL_MS,
  LAB_EQUALIZER_BAR_COUNT,
  LAB_EQUALIZER_BASS_BAND_COUNT,
  LAB_EQUALIZER_BOARD_HEIGHT,
  LAB_EQUALIZER_BOARD_WIDTH,
  LAB_EQUALIZER_CANVAS_HEIGHT,
  LAB_EQUALIZER_CANVAS_WIDTH,
  LAB_EQUALIZER_DISPLAY_RENDER_ORDER,
  LAB_EQUALIZER_ENABLED,
  LAB_EQUALIZER_FFT_SIZE,
  LAB_EQUALIZER_GRAPH_INTERVAL_MS,
  LAB_EQUALIZER_GROUP_RENDER_ORDER,
  LAB_EQUALIZER_IDLE_SAMPLE_INTERVAL_MS,
  LAB_EQUALIZER_LEVEL_DB_CEILING,
  LAB_EQUALIZER_LEVEL_DB_FLOOR,
  LAB_EQUALIZER_LEVEL_GAMMA,
  LAB_EQUALIZER_MAX_HZ,
  LAB_EQUALIZER_MIN_HZ,
  LAB_EQUALIZER_OFFSCREEN_SAMPLE_INTERVAL_MS,
  LAB_EQUALIZER_OFFSCREEN_TEXTURE_INTERVAL_MS,
  LAB_EQUALIZER_PANEL_RENDER_ORDER,
  LAB_EQUALIZER_PEAK_HOLD_SECONDS,
  LAB_EQUALIZER_PEAK_MAX_FALL_ROWS_PER_SEC,
  LAB_EQUALIZER_PEAK_MIN_FALL_ROWS_PER_SEC,
  LAB_EQUALIZER_POSE_INTERVAL_MS,
  LAB_EQUALIZER_PULSE_CONTROLS,
  LAB_EQUALIZER_RELATIVE_DB_RANGE,
  LAB_EQUALIZER_SCENE_SCALE,
  LAB_EQUALIZER_SEGMENT_ROWS,
  LAB_EQUALIZER_START_WALL_INSET_Y,
  LAB_EQUALIZER_STATIC_TEXTURE_REFRESH_MS,
  LAB_EQUALIZER_TEXTURE_ADAPTIVE_HARD_INTERVAL_MS,
  LAB_EQUALIZER_TEXTURE_ADAPTIVE_SOFT_INTERVAL_MS,
  LAB_EQUALIZER_TEXTURE_INTERVAL_MS,
  LAB_EQUALIZER_VERTICAL_OFFSET,
  LAB_EQUALIZER_VISIBILITY_INTERVAL_MS,
  LAB_EQUALIZER_VISIBILITY_RADIUS,
  LAB_EQUALIZER_WORLD_HEIGHT,
  LAB_EQUALIZER_WORLD_WIDTH,
  labEqualizerGroup,
  initLabEqualizer,
  updateLabEqualizer,
  labEqualizerState,
} from './controls/equalizer.js';
import {
  PITCH_LIMIT,
  DEMO_START_KEY,
  welcomeWindowMotionAllowed,
  DRAG_ACTIVATE_PX,
  POINTER_LOCK_SETTLE_MS,
  POINTER_CLICK_SUPPRESS_MS,
  FOOTSTEP_PLAYER_BUS,
  FOOTSTEP_PLAYER_VOLUME_SCALE,
  roadBaseY,
  ROAD_BOUNDARY_ROW_MAX,
  TRON_RUNNER_GREETER_INDEX,
} from './config/costanti.js';

const droneIntroHeroShotEnabled = droneIntroHeroShotRequestedFromParams(new URLSearchParams(window.location.search));
const cinematicGroundingSettings = cinematicGroundingSettingsFromParams(new URLSearchParams(window.location.search));
let secondaryEffectFrame = 0;
let boundaryErrorAccumulatedDt = 0;
// Kick off both module groups before awaiting either, so their network
// fetches overlap instead of serializing across the two top-level awaits.
const postModulesPromise = Promise.all([
  import('three/addons/postprocessing/EffectComposer.js'),
  import('three/addons/postprocessing/RenderPass.js'),
  import('three/addons/postprocessing/UnrealBloomPass.js'),
  import('three/addons/postprocessing/FXAAPass.js'),
  import('three/addons/postprocessing/ShaderPass.js'),
]);
const runnerModulesPromise = Promise.all([
  import('three/addons/loaders/GLTFLoader.js'),
  import('three/addons/utils/SkeletonUtils.js'),
]);
// The rejection is consumed by the awaits below; this no-op handler only
// keeps a rejection that lands while the other group is still pending from
// surfacing as an unhandledrejection in that window.
runnerModulesPromise.catch(() => {});
try {
  const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { FXAAPass }, { ShaderPass }] = await postModulesPromise;
  window.__POST = { EffectComposer, RenderPass, UnrealBloomPass, FXAAPass, ShaderPass };
  post.usePost = true;
} catch (e) {
  console.warn('Postprocessing unavailable, falling back to plain renderer:', e.message);
}

let RunnerGLTFLoader = null;
let cloneRunnerSkeleton = null;
try {
  const [{ GLTFLoader }, { clone }] = await runnerModulesPromise;
  RunnerGLTFLoader = GLTFLoader;
  cloneRunnerSkeleton = clone;
} catch (e) {
  console.warn('Runner GLB support unavailable:', e.message);
}

// ---------- palette ----------
const PAL = {
  cyan: 0x62f7ff,
  edgeLine: 0x78d7de,
  buildingSkin: 0x02090b,
  mainSkin: 0x031116,
  tealLight: 0xccffff,
};

// ---------- core setup ----------
const app = document.getElementById('app');
const loader = document.getElementById('loader');
const fpsEl = document.getElementById('fps');
const fovEl = document.getElementById('fov');
// The HUD FOV never changes (FIXED_CAMERA_FOV is a constant), so write it once
// here instead of re-assigning textContent — a DOM mutation — on every frame.
if (fovEl) fovEl.textContent = FIXED_CAMERA_FOV.toFixed(0);
const perfTheoreticalFpsEl = document.getElementById('perf-theoretical-fps');
const perfHeadroomEl = document.getElementById('perf-headroom');
const perfFrameMsEl = document.getElementById('perf-frame-ms');
const perfCpuRenderMsEl = document.getElementById('perf-cpu-render-ms');
const perfGpuMsEl = document.getElementById('perf-gpu-ms');
const perfSpikeEl = document.getElementById('perf-spike');
const perfResolutionEl = document.getElementById('perf-resolution');
const perfPassDrawEl = document.getElementById('perf-pass-draw');
const perfTriFxEl = document.getElementById('perf-tri-fx');
const mobilePerformanceDiagnosticsEl = document.getElementById('mobile-performance-diagnostics');
const mobileMovementPadEl = document.getElementById('mobile-movement-pad');
const mobileMovementKnobEl = document.getElementById('mobile-movement-knob');
const contactTerminalActionEl = document.getElementById('contact-terminal-action');
const contactTerminalBackEl = document.getElementById('contact-terminal-back');
const contactTerminalSurfaceEl = document.getElementById('contact-terminal-surface');
const contactTerminalLiveEl = document.getElementById('contact-terminal-live');
// I valori fissi della scena (LED, ponti) tornano nel DOM prima che
// createControlEls() li cerchi per id: vivono in controls/fixed-control-defaults.js,
// non piu' come 8 KB di input nascosti dentro index.html.
mountFixedControlDefaults();
const controlEls = createControlEls();

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
const postRevealPerfIsolationState = {
  bloom: true,
  equalizer: true,
  crowd: true,
  crowdReflections: true,
};

function postRevealPerfIsolationInspect() {
  return { ...postRevealPerfIsolationState };
}

function applyPostRevealPerfIsolation(next = {}) {
  for (const [key, value] of Object.entries(next || {})) {
    if (Object.prototype.hasOwnProperty.call(postRevealPerfIsolationState, key)) {
      postRevealPerfIsolationState[key] = value !== false && value !== 'off';
    }
  }
  if (!postRevealPerfIsolationState.crowd) {
    try { tronRunnerCrowdGroup.visible = false; } catch {}
  }
  if (!postRevealPerfIsolationState.equalizer) {
    try { labEqualizerGroup.visible = false; } catch {}
  }
  return postRevealPerfIsolationInspect();
}

window.__tronPerfIsolation = applyPostRevealPerfIsolation;
window.__tronPerfIsolationInspect = postRevealPerfIsolationInspect;
window.__fxToggles = fxToggleInspect;
// Debug-only scene accessor for viewpoint-independent toggle verification
// (walk the graph and confirm a subsystem's objects are hidden). No render effect.
window.__fxScene = () => scene;
// La catena dei pass del composer, per l'impronta del gate visivo (2026-09-19): l'ordine
// bloom -> look -> TAA -> FSR e chi e' acceso sono logica, e prima si verificavano cercando
// `composer.addPass(...)` nel sorgente con espressioni regolari.
/** @type {any} */ (window).__tronComposerInspect = () => (post.composer
  ? post.composer.passes.map((pass) => ({ name: pass.constructor?.name ?? 'Pass', enabled: Boolean(pass.enabled) }))
  : null);
renderer.setPixelRatio(post.activePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.localClippingEnabled = true;
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const performanceDiagnostics = createPerformanceDiagnostics({
  renderer,
  controlEls,
  elements: {
    theoreticalFps: perfTheoreticalFpsEl,
    headroom: perfHeadroomEl,
    frameMs: perfFrameMsEl,
    cpuRenderMs: perfCpuRenderMsEl,
    gpuMs: perfGpuMsEl,
    spike: perfSpikeEl,
    resolution: perfResolutionEl,
    passDraw: perfPassDrawEl,
    triFx: perfTriFxEl,
    desktopText: () => performanceDiagnosticsEl,
    mobileText: mobilePerformanceDiagnosticsEl,
  },
  getLatestMeasuredFps: () => latestMeasuredFps,
  getActivePixelRatio: () => post.activePixelRatio,
  getRequestedPixelRatio: () => post.requestedPixelRatio,
  getManualRenderScale: () => post.manualRenderScale,
  getDynamicQualityScale: () => post.dynamicQualityScale,
  getPerformanceMode: () => post.performanceMode,
  getBloomEnabled: () => post.bloomEnabled,
  getBloomPass: () => post.bloomPass,
  getFxaaPass: () => post.fxaaPass,
  getFsrUpscalePass: () => post.fsrUpscalePass,
  getAntialiasMode: () => post.antialiasMode,
  getBloomResolutionScale: () => post.bloomResolutionScale,
  getLastBloomTargetKey: () => post.lastBloomTargetKey,
  getLastFxaaTargetKey: () => post.lastFxaaTargetKey,
  getLastFsrTargetKey: () => post.lastFsrTargetKey,
  getFsrUpscaleEnabled: () => post.fsrUpscaleEnabled,
  getFsrInternalScale: () => post.fsrInternalScale,
  getFsrSharpness: () => post.fsrSharpness,
  getStaticCityCullStats: () => staticCityCullStats,
  getTronRunnerCrowd: () => tronRunnerCrowd,
  getTronRunnerCrowdRuntimeStats: () => tronRunnerCrowdRuntimeStats,
  getLabEqualizerState: () => labEqualizerState,
  getCityRevealSweepProgress: () => cityRevealSweepProgress,
  getCityRevealWireAlpha: () => cityRevealWireAlpha,
  getCityRevealProfiler: () => cityRevealProfiler,
  getCityRevealWaitingForVisibleFrame: () => cityRevealWaitingForVisibleFrame,
  getCityRevealComplete: () => cityRevealComplete,
  getCityRevealArmedAt: () => cityRevealArmedAt,
  getCityRevealStartedAt: () => cityRevealStartedAt,
  getCityRevealPerformanceProfileActive: () => post.cityRevealPerformanceProfileActive,
  effectivePixelRatioForDevice,
  effectiveRenderScaleForDevice,
  effectiveComposerPixelRatio,
  mobilePerformanceProfileInspect,
  isBloomPassActive,
  isBloomRevealBypassed,
  shouldBypassBloomForRevealPerformance,
  isCityRevealPerformanceCritical,
});

// ---------- benchmark: il cablaggio sta in engine/retro-benchmark-runtime.js ----------
initRetroBenchmarkRuntime({
  renderer,
  performanceDiagnostics,
  cinematicGroundingSettings,
  hexRoadInspect,
  getSkyDome: () => skyDome,
  getFloorLiteActive: () => floorLiteActive,
  getFloorReflectLite: () => floorReflectLite,
  getBuildingReflectLite: () => buildingReflectLite,
  getDirLightActive: () => dirLightActive,
  getCityRevealMainLedReveal: () => cityRevealMainLedReveal,
  getLatestMeasuredFps: () => latestMeasuredFps,
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FIXED_CAMERA_FOV, window.innerWidth / window.innerHeight, 0.1, 10000);
// World/context object (design §4). composer is created later in the deferred postprocessing setup,
// so it is read through a late-bound getter. Subsystems are migrated onto ctx phase by phase.
const ctx = createCtx({ scene, camera, renderer, getComposer: () => post.composer });
camera.position.set(701.4907301468677, 591.0351224586902, 1110.9745792178219);
camera.lookAt(0, 80, -300);

function setFixedCameraFov() {
  if (camera.fov !== FIXED_CAMERA_FOV) {
    camera.fov = FIXED_CAMERA_FOV;
    camera.updateProjectionMatrix();
  }
}

// ---------- free fly controls (WASD + mouse look pointer-lock + Q/E vertical + Shift sprint) ----------
// ---------- lo stato del giocatore sta in camera/player-state.js ----------
initPlayerState({ camera, isCameraCollisionDisabled });
{
  const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
  player.yaw = e.y;
  player.pitch = e.x;
}

const welcomeWindowOverlay = document.getElementById('welcome-window-overlay');
const welcomeWindowPanel = welcomeWindowOverlay?.querySelector('.welcome-window');
const welcomeWindowAction = welcomeWindowOverlay?.querySelector('.welcome-action');
const welcomeWindowActionPrefix = welcomeWindowOverlay?.querySelector('.welcome-action-prefix');
const welcomeWindowKeyLabel = welcomeWindowOverlay?.querySelector('.welcome-key');
const welcomeStartButton = document.getElementById('welcome-start-button');
const tronDiscCursor = document.getElementById('tron-disc-cursor');
const tronRevealWaitLabel = document.getElementById('tron-reveal-wait-label');
const welcomeWindowTouchQuery = window.matchMedia('(hover: none), (pointer: coarse)');
const welcomeWindowMobileQuery = window.matchMedia('(max-width: 760px)');
const welcomeWindowMotion = {
  frame: 0,
  next: null,
  state: {
    active: false,
    moveX: '0.00',
    moveY: '0.00',
    bendY: '0.000',
    tiltX: '0.000',
    originX: '50.00',
    cursorX: '50.00',
    cursorY: '50.00',
  },
};
const welcomeMotionDeps = {
  panel: welcomeWindowPanel,
  overlay: welcomeWindowOverlay,
  motionAllowed: welcomeWindowMotionAllowed,
  isVisible: welcomeWindowVisible,
};
const welcomeWindowState = { dismissed: false };
const welcomeDeps = {
  overlay: welcomeWindowOverlay,
  keyLabel: welcomeWindowKeyLabel,
  action: welcomeWindowAction,
  actionPrefix: welcomeWindowActionPrefix,
  touchQuery: welcomeWindowTouchQuery,
  mobileQuery: welcomeWindowMobileQuery,
  resetMotion: resetWelcomeWindowMotion,
  updatePointerLockHint: updatePointerLockHint,
  ensureFootstepAudioReady: ensureFootstepAudioReady,
  triggerBackspaceDroneIntro: triggerBackspaceDroneIntro,
};

function dismissWelcomeWindow() {
  dismissWelcomeWindowCore(welcomeWindowState, welcomeDeps);
  document.body.classList.remove('welcome-cover-visible');
}

function welcomeWindowVisible() {
  return welcomeWindowVisibleCore(welcomeWindowState, welcomeDeps);
}

function welcomeWindowUsesTouchPrompt() {
  return welcomeWindowUsesTouchPromptCore(welcomeDeps);
}


function applyWelcomeWindowInputMode() {
  applyWelcomeWindowInputModeCore(welcomeDeps);
}

function triggerWelcomeWindowTouch(event) {
  triggerWelcomeWindowTouchCore(event, welcomeWindowState, welcomeDeps);
}

function resetWelcomeWindowMotion() {
  resetWelcomeWindowMotionCore(welcomeWindowMotion, welcomeMotionDeps);
}
applyWelcomeWindowInputMode();
if (typeof welcomeWindowTouchQuery.addEventListener === 'function') {
  welcomeWindowTouchQuery.addEventListener('change', applyWelcomeWindowInputMode);
  welcomeWindowMobileQuery.addEventListener('change', applyWelcomeWindowInputMode);
} else {
  welcomeWindowTouchQuery.addListener?.(applyWelcomeWindowInputMode);
  welcomeWindowMobileQuery.addListener?.(applyWelcomeWindowInputMode);
}
welcomeWindowOverlay?.addEventListener('pointerdown', triggerWelcomeWindowTouch, { passive: false });
welcomeWindowOverlay?.addEventListener('touchstart', triggerWelcomeWindowTouch, { passive: false });

function beginDemoReveal(event) {
  player.tronDiscRevealWaitingActive = true;
  setTronDiscCursorRevealWaiting(true, event || null);
  tronRevealWaitLabel?.classList.toggle('is-active', player.tronDiscRevealWaitingActive);
  triggerBackspaceDroneIntro('welcome-button');
}

function isDeviceInLandscape() {
  return window.matchMedia('(orientation: landscape)').matches || window.innerWidth > window.innerHeight;
}

// On a phone the demo needs landscape (matches the on-screen joystick + forced
// fullscreen). If the user taps start in portrait, hold the demo and show a
// rotate prompt until the device turns landscape, then begin the reveal.
let awaitingLandscapeStart = false;
function triggerWelcomeButtonStart(event) {
  event.preventDefault();
  if (!player.sceneBootComplete) return;
  if (awaitingLandscapeStart) return;
  // Unlock audio inside THIS tap gesture, always. On mobile the real start can
  // be deferred to the post-rotation orientationchange handler, which carries
  // no user activation — iOS would then reject play(). Resuming the context and
  // blessing the soundtrack elements here keeps the deferred start allowed.
  ensureFootstepAudioReady();
  primeTronSoundtrackForGesture();
  if (mobilePerformanceProfileActive() && !isDeviceInLandscape()) {
    awaitingLandscapeStart = true;
    document.body.classList.add('rf-awaiting-landscape');
    requestLandscapeFullscreen('welcome-start');
    const landscapeQuery = window.matchMedia('(orientation: landscape)');
    const onOrientation = () => {
      if (!isDeviceInLandscape()) return;
      landscapeQuery.removeEventListener?.('change', onOrientation);
      landscapeQuery.removeListener?.(onOrientation);
      window.removeEventListener('resize', onOrientation);
      awaitingLandscapeStart = false;
      document.body.classList.remove('rf-awaiting-landscape');
      beginDemoReveal(event);
    };
    if (typeof landscapeQuery.addEventListener === 'function') landscapeQuery.addEventListener('change', onOrientation);
    else landscapeQuery.addListener?.(onOrientation);
    window.addEventListener('resize', onOrientation);
    return;
  }
  beginDemoReveal(event);
}

function isEventInsideWelcomeStartButton(event) {
  const rect = welcomeStartButton?.getBoundingClientRect();
  if (!rect || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return false;
  return event.clientX >= rect.left
    && event.clientX <= rect.right
    && event.clientY >= rect.top
    && event.clientY <= rect.bottom;
}

welcomeStartButton?.addEventListener('click', triggerWelcomeButtonStart);
welcomeWindowOverlay?.addEventListener('click', (event) => {
  if (!welcomeWindowVisible()) return;
  if (event.target === welcomeStartButton || welcomeStartButton?.contains?.(event.target)) return;
  if (!isEventInsideWelcomeStartButton(event)) return;
  triggerWelcomeButtonStart(event);
});

const lockEl = renderer.domElement;
initDiscCursor({
  tronDiscCursor,
  lockEl,
  getPointerLocked,
  getUnlockedMouseLookActive,
});

function triggerBackspaceDroneIntro(source = 'backspace') {
  if (!player.sceneBootComplete) return;
  dismissWelcomeWindow();
  ensureFootstepAudioReady();
  // The soundtrack is the reveal's master clock: start it immediately, muffled
  // by the intro lofi. The sweep fires when the track reaches its beat drop
  // (see getSoundtrackSyncState + updateCityRevealWireframe), so audio and
  // reveal can never drift apart.
  startTronProceduralMusic(source, { introLofi: true });
  if (!player.backspaceIntroTriggered) {
    player.backspaceIntroTriggered = true;
    player.cameraCollisionUnlockedByBackspace = true;
  }
  startCityRevealWireTimer();
  startDroneIntroFlight(source);
}

function syncTronDiscRevealWaiting() {
  const next = Boolean(player.tronDiscRevealWaitingActive && !cityRevealComplete);
  if (next === tronDiscCursorState.revealWaiting) return;
  player.tronDiscRevealWaitingActive = next;
  setTronDiscCursorRevealWaiting(player.tronDiscRevealWaitingActive);
  tronRevealWaitLabel?.classList.toggle('is-active', player.tronDiscRevealWaitingActive);
}

initMouseLook(ctx, {
  getYaw: () => player.yaw,
  setYaw: (v) => { player.yaw = v; },
  getPitch: () => player.pitch,
  setPitch: (v) => { player.pitch = v; },
  applyCameraLook,
  PITCH_LIMIT,
  lockEl,
  DRAG_ACTIVATE_PX,
  POINTER_LOCK_SETTLE_MS,
  POINTER_CLICK_SUPPRESS_MS,
  clearVerticalMovementState,
  setTronDiscCursorVisible,
  handleTronDiscCursorMove,
  tronDiscCursorState,
  welcomeWindowUsesTouchPrompt,
  requestLandscapeFullscreen,
  isMobileMovementControlTarget,
  getCityRevealComplete: () => cityRevealComplete,
  getMouseSensitivityScale: () => player.mouseSensitivityScale,
  contactTerminalOwnsCamera: contactTerminalOwnsCamera,
});

initMobileMovement({
  mobilePerformanceProfileActive,
  performanceDiagnosticsCanvasSummary: performanceDiagnostics.canvasSummary,
  applyViewportResize,
  mobileMovementPadEl,
  mobileMovementKnobEl,
});

// I passi del giocatore vivono in audio/player-footsteps.js (tappa 5, 2026-09-19): qui
// solo le dipendenze che quel modulo prende da main.
initPlayerFootsteps({
  camera,
  getCameraMinHeight: () => player.cameraMinHeight,
  getWalkSurfaceLift: () => player.walkSurfaceLift,
  getWalkSurfaceKind: () => player.walkSurfaceKind,
  isCameraCollisionDisabled,
});

const tronSoundtrackRuntime = window.__retroAudio?.runtime || createTronSoundtrackRuntime({
  getAudioContext: getFootstepAudioContext,
  ensureAudioContext: ensureTronAudioContext,
});

// Lo stato e i venti wrapper vivono ora in audio/soundtrack-runtime.js. Qui
// restano solo i nomi, destrutturati, cosi' i call site nel resto del file
// non cambiano.
const tronSoundtrack = tronSoundtrackRuntime.soundtrack;
const {
  applyTronSoundtrackIntroLofiMix,
  crossfadeTronSoundtrack,
  monitorTronSoundtrackLoop,
  primeTronSoundtrackForGesture,
  scheduleTronSoundtrackIntroLofiStopForReveal,
  setTronFileSoundtrackVolume,
  setTronProceduralMusicVolume,
  setTronSoundtrackIntroLofi,
  setupTronSoundtrackGraph,
  startTronFileSoundtrack,
  startTronProceduralMusic,
  stopTronFileSoundtrack,
  stopTronProceduralMusic,
  stopTronSoundtrackIntroLofiForReveal,
  syncTronIntroFxNodeSettings,
  tronIntroFxEffectiveFilters,
  tronSoundtrackLoopStart,
} = tronSoundtrackRuntime;

window.__tronFootstepInspect = inspectPlayerFootsteps;

window.__tronMusicStart = startTronProceduralMusic;
window.__tronMusicStop = stopTronProceduralMusic;
window.__tronMusicSetVolume = setTronProceduralMusicVolume;
window.__tronMusicForceCrossfade = crossfadeTronSoundtrack;
window.__tronMusicInspect = () => tronSoundtrackRuntime.inspect();

// ---------- reflection environment + solid visible sky ----------
// bakeTronReflectionMap moved to ./reflection-env.js (see initReflectionEnv below).

const skyDome = createSkyDome({
  scene,
  camera,
  renderer,
  controlEls,
  tunedColor,
  getRevealBudgetActive: () => cityRevealWireframeEnabled && !cityRevealComplete,
  getMobileProfileActive: () => mobilePerformanceProfileActive(),
});
const {
  domeGeo,
  domeMat,
  domeMesh,
  skyDisplayColor,
  revealScene: cityRevealSkyScene,
  revealMat: cityRevealSkyMat,
  revealDome: cityRevealSkyDome,
  applySkyPreset,
  applySkyControlsFromUI,
  applyStormControlsFromUI,
  cityRevealSkyUsesBudgetQuality,
  syncCityRevealSkyMaterial,
  syncCityRevealSkyDome,
  renderCityRevealSkyBase,
} = skyDome;
// ---------- Reflection environment maps (extracted -> reflection-env.js) ----------
initReflectionEnv(ctx);
// Mobile is fill-bound: buildings + base pads now DROP their per-pixel envMap
// reflection by default (the road floor is already lite). Measured +1.7fps on a
// real iPhone, cost = a subtle wet sheen on facades/sidewalks (the wet FLOOR, the
// signature look, is kept via its own lite fresnel). ?buildingReflect=full re-adds
// it for A/B; fx.envReflections=0 still forces it off anywhere. The PMREM bake at
// initReflectionEnv still runs (VRAM only) so desktop is unchanged.
const buildingReflectParam = (() => { try { return new URLSearchParams(location.search).get('buildingReflect'); } catch { return null; } })();
const buildingReflectLite = buildingReflectParam != null ? buildingReflectParam === 'lite' : mobilePerformanceProfileActive();
const reflectionEnvMap = (fxEnabled('envReflections') && !buildingReflectLite) ? getReflectionEnvMap() : null;
scene.environment = null;
scene.environmentIntensity = 1;

// ---------- material texture helpers (extracted -> material-textures.js) ----------
// Mobile is fill-bound: trim per-pixel floor cost with no visual change — cap
// floor anisotropy (16->4) and drop the no-op road normalMap. ?floorLite=1|0
// overrides the mobile default for on-device A/B against the benchmark overlay.
const floorLiteParam = (() => { try { return new URLSearchParams(location.search).get('floorLite'); } catch { return null; } })();
const floorLiteActive = floorLiteParam != null ? floorLiteParam === '1' : mobilePerformanceProfileActive();
// Bigger fill lever: swap the floor's per-pixel envMap reflection for a cheap
// fresnel sheen on mobile. ?floorReflect=full|lite overrides for on-device A/B.
const floorReflectParam = (() => { try { return new URLSearchParams(location.search).get('floorReflect'); } catch { return null; } })();
const floorReflectLite = floorReflectParam != null ? floorReflectParam === 'lite' : mobilePerformanceProfileActive();
initMaterialTextures(ctx, { anisotropyCap: floorLiteActive ? 4 : Infinity });
const asphalt = makeWetAsphaltFacadeTexture();
initHexTileMaterials({ dropNormalMap: floorLiteActive, liteReflect: floorReflectLite });
const basePadSurfaceTex = makeBasePadSurfaceTexture();

// ---------- Floor: streetEdges (hex tile) + road (metal mirror) + outer floor ----------
const ROAD_HALF = MAIN_ROAD_WIDTH / 2;     // road x range -44..+44
const STREET_EDGE_OUTER = BRIDGE_INNER_BUILDING_FACE_X; // streetEdge x range 44..60
const Z_FLOOR_LEN = MAIN_ROAD_LENGTH;
const Z_FLOOR_CENTER = MAIN_ROAD_Z;
let dynamicRoadSurfaceWidth = roadSurfaceWidthForBuildings();
// Road backing — pure unlit black under the hex tiles.
const roadMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  fog: false,
  toneMapped: false,
  side: THREE.DoubleSide,
});
const ROAD_BACKING_EDGE_INSET = GRID_BLOCK;
function roadBackingWidth(width = dynamicRoadSurfaceWidth) {
  return Math.max(MAIN_ROAD_WIDTH * 0.25, width - ROAD_BACKING_EDGE_INSET * 2);
}
function roadBackingLength(length = boulevard.dynamicRoadLength) {
  return Math.max(GRID_BLOCK * 4, length - ROAD_BACKING_EDGE_INSET * 2);
}
function syncRoadBacking() {
  road.scale.x = roadBackingWidth() / MAIN_ROAD_WIDTH;
  road.scale.y = roadBackingLength() / Z_FLOOR_LEN;
}
const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_HALF * 2, Z_FLOOR_LEN), roadMat);
road.rotation.x = -Math.PI / 2;
road.position.set(0, roadBaseY, Z_FLOOR_CENTER);
syncRoadBacking();
scene.add(road);
// fx.roadBacking=0: hide the large unlit black under-floor plane (pure overdraw
// beneath the hex tiles). syncRoadBacking only touches scale, so this persists.
road.visible = fxEnabled('roadBacking');
const floorPlaneLengthMeshes = [road];
const floorBoxLengthMeshes = [];

// Main road hex tiles: same design/function as mockup-hex-road-tiles.html.
function mainBuildingSideBoulevardExtension() {
  return MAIN_BUILDING_SIDE_HEX_EXTENSION_ROWS * Math.max(0.001, hexTileRowStep());
}
const hexTileDisplayBaseEmissive = new THREE.Color(0x061419);
const hexTileDisplayHitEmissive = new THREE.Color(0x7df6ff);
initHexTileSync({
  refreshCullingBounds,
});
initHexTileLayout(ctx);

function refreshCullingBounds(object) {
  if (!object) return;
  if (object.isInstancedMesh && object.count <= 0) return;
  const geometry = object.geometry;
  if (geometry) {
    geometry.computeBoundingSphere?.();
    geometry.computeBoundingBox?.();
  }
  if (object.isInstancedMesh) {
    object.boundingSphere = null;
    object.boundingBox = null;
    object.computeBoundingSphere?.();
    object.computeBoundingBox?.();
  }
}

function refreshCullingBoundsWithMargin(object, margin = 0) {
  refreshCullingBounds(object);
  if (!object?.geometry || margin <= 0) return;
  if (object.geometry.boundingSphere) object.geometry.boundingSphere.radius += margin;
  if (object.geometry.boundingBox) object.geometry.boundingBox.expandByScalar(margin);
}

function hexRoadInspect() {
  return {
    emptyBatchCulling: HEX_ROAD_EMPTY_BATCH_CULLING_ENABLED,
    uploadBatchLimit: HEX_ROAD_UPLOAD_BATCH_LIMIT,
    buckets: hexRoadTileBuckets.size,
    recoveringTiles: recoveringHexTiles.size,
    candidatesLastStep: hexRoadRuntimeStats.lastCandidateCount,
    uploadsLastFrame: hexRoadRuntimeStats.lastDirtyUploadCount,
    pendingDirtyBatches: getDirtyHexTileBatchCount(),
    uploadDeferredFrames: hexRoadRuntimeStats.uploadDeferredFrames,
    interactive: hexRoadBatchStats(hexRoadTileBatches),
    streetEdge: hexRoadBatchStats(streetEdgeHexTileBatches),
    boundary: getRoadBoundaryHexStats(),
  };
}

function computeDynamicRoadBounds(nextSideSpacingScale, nextSideDepthScale, nextMainDepthScale) {
  let minZ = MAIN_ROAD_Z - MAIN_ROAD_LENGTH / 2;
  let maxZ = MAIN_ROAD_Z + MAIN_ROAD_LENGTH / 2;
  const sideHalfD = SIDE_BUILDING_BASE * nextSideDepthScale / 2;
  for (const baseZ of laneZ) {
    const z = (baseZ / SIDE_BUILDING_SPACING) * SIDE_BUILDING_SPACING * nextSideSpacingScale;
    const sideMin = z - sideHalfD;
    const sideMax = z + sideHalfD;
    if (sideMin < minZ) minZ = sideMin - MAX_DYNAMIC_ROAD_MARGIN;
    if (sideMax > maxZ) maxZ = sideMax + MAX_DYNAMIC_ROAD_MARGIN;
  }
  const mainHalfD = MAIN_BUILDING_BASE * nextMainDepthScale / 2;
  const mainMin = boulevard.mainBuildingZ - mainHalfD - MAX_DYNAMIC_ROAD_MARGIN;
  const mainMax = boulevard.mainBuildingZ + mainHalfD + MAX_DYNAMIC_ROAD_MARGIN;
  if (boulevard.mainBuildingZ <= MAIN_ROAD_Z) {
    minZ = Math.min(minZ, mainMin - mainBuildingSideBoulevardExtension());
    maxZ = Math.max(maxZ, mainMax);
  } else {
    minZ = Math.min(minZ, mainMin);
    maxZ = Math.max(maxZ, mainMax + mainBuildingSideBoulevardExtension());
  }
  return { center: (minZ + maxZ) / 2, length: maxZ - minZ };
}

function updateMainRoadLength(centerZ, length) {
  boulevard.dynamicRoadCenter = centerZ;
  boulevard.dynamicRoadLength = length;
  const planeScale = length / Z_FLOOR_LEN;
  for (const mesh of floorPlaneLengthMeshes) {
    mesh.position.z = centerZ;
    mesh.scale.y = planeScale;
  }
  const boxScale = length / Z_FLOOR_LEN;
  for (const mesh of floorBoxLengthMeshes) {
    mesh.position.z = centerZ;
    mesh.scale.z = boxScale;
  }
  syncRoadBacking();
  ensureHexRoadTileCoverage(mainRoadTiles, 0, centerZ, dynamicRoadSurfaceWidth, length);
  updateZTileBand(mainRoadTiles, 0, centerZ, dynamicRoadSurfaceWidth, length);
}

const roadBoundaryHexRowOffsets = Array.from({ length: ROAD_BOUNDARY_ROW_MAX }, () => 0);
// ---------- le collisioni della camera stanno in camera/camera-collision.js ----------
initCameraCollision({ camera, roadHexBoundaryLimits });

function roadHexBoundaryLimits() {
  const halfW = dynamicRoadSurfaceWidth / 2;
  const halfL = boulevard.dynamicRoadLength / 2;
  const centerZ = boulevard.dynamicRoadCenter;
  const margin = Math.max(collisioni.roadBoundaryCollisionMargin, hexTileRadius * getHexTileScale() * 0.22);
  return {
    minX: -halfW + margin,
    maxX: halfW - margin,
    minZ: centerZ - halfL + margin,
    maxZ: centerZ + halfL - margin,
    visualMinX: -halfW,
    visualMaxX: halfW,
    visualMinZ: centerZ - halfL,
    visualMaxZ: centerZ + halfL,
  };
}

// Seed the real boot-time band (not the slider worst case): with default
// controls the first applyControls pass then needs zero extra tiles, so every
// z-strip keeps a single batch exactly like the old full seeding.
{
  const initialRoadBounds = computeDynamicRoadBounds(boulevard.sideBuildingSpacingScale, boulevard.sideBuildingDepthScale, boulevard.mainBuildingDepthScale);
  boulevard.dynamicRoadCenter = initialRoadBounds.center;
  boulevard.dynamicRoadLength = initialRoadBounds.length;
}
const mainRoadTiles = addHexRoadTiles(dynamicRoadSurfaceWidth, boulevard.dynamicRoadLength, 0, boulevard.dynamicRoadCenter);
initBoundaryError(ctx, {
  roadHexBoundaryLimits,
  roadBoundaryHexRowOffsets,
  tunedColor,
  refreshCullingBounds,
  movementVelocity,
  controlEls,
  cyan: PAL.cyan,
  reflectionEnvMap,
  getDynamicRoadSurfaceWidth: () => dynamicRoadSurfaceWidth,
  getDynamicRoadLength: () => boulevard.dynamicRoadLength,
  getDynamicRoadCenter: () => boulevard.dynamicRoadCenter,
});
initDroneIntro(ctx, {
  controlEls,
  PITCH_LIMIT,
  demoStartKey: DEMO_START_KEY,
  lerpAngle,
  applyCameraLook,
  clearMovementKeys,
  removeViewMotionOffset,
  cameraGroundHeightAt,
  setButtonFeedback,
  updateStartPositionLiveLabel,
  setTronNoclip,
  getYaw: () => player.yaw,
  setYaw: (v) => { player.yaw = v; },
  getPitch: () => player.pitch,
  setPitch: (v) => { player.pitch = v; },
  getViewRoll: () => player.viewRoll,
  setViewRoll: (v) => { player.viewRoll = v; },
  setHeadBobOffset,
  setSideSwayOffset,
  setMovementHorizontalSpeed,
  setMovementRunMix,
  getLast: () => last,
  getDroneLandingPose: () => player.droneLandingPose,
  getDefaultDroneLandingPose: () => DEFAULT_DRONE_LANDING_POSE,
  getSideBuildingRecords: () => sideBuildingRecords,
  getMainBuildingRecords: () => mainBuildingRecords,
  getSideBuildingDepthScale: () => boulevard.sideBuildingDepthScale,
  getDynamicRoadCenter: () => boulevard.dynamicRoadCenter,
  getDynamicRoadLength: () => boulevard.dynamicRoadLength,
  heroShotEnabled: droneIntroHeroShotEnabled,
});

initMovement(ctx, {
  keys,
  getSpeedBase: () => player.speedBase,
  getSpeedSprint: () => player.speedSprint,
  getBackwardSpeedScale: () => player.backwardSpeedScale,
  getStrafeSpeedScale: () => player.strafeSpeedScale,
  getDiagonalSpeedScale: () => player.diagonalSpeedScale,
  getMovementAcceleration: () => player.movementAcceleration,
  getMovementDeceleration: () => player.movementDeceleration,
  resolveCameraBuildingCollision,
  resolveCameraCrowdCollision,
  resolveCameraRoadHexBoundaryCollision,
  resolveCameraWalkSurface,
  getHeadMotionSmoothing: () => player.headMotionSmoothing,
  getWalkBobAmount: () => player.walkBobAmount,
  getRunBobAmount: () => player.runBobAmount,
  getStrafeBobScale: () => player.strafeBobScale,
  getBackwardBobScale: () => player.backwardBobScale,
  getWalkStepRate: () => player.walkStepRate,
  getRunStepRate: () => player.runStepRate,
  getStepSnapAmount: () => player.stepSnapAmount,
  getMovementSwayAmount: () => player.movementSwayAmount,
  getMovementRollAmount: () => player.movementRollAmount,
  getStrafeLeanAmount: () => player.strafeLeanAmount,
  getViewRoll: () => player.viewRoll,
  setViewRoll: (v) => { player.viewRoll = v; },
  resetFootstepCadence,
  updateFootstepAudioFromWalk,
  setFixedCameraFov,
  applyCameraLook,
});

initKeyboard({
  DEMO_START_KEY,
  welcomeWindowVisible,
  ensureFootstepAudioReady,
  triggerBackspaceDroneIntro,
  resetCameraHeightToDefault,
  captureLivePlayerSpawn,
  getBackspaceIntroTriggered: () => player.backspaceIntroTriggered,
  handleContactTerminalKeyDown: handleContactTerminalKeyDown,
});

// StreetEdges: same hex mesh system, but with muted blue-green Tron material.
const streetEdgeMat = new THREE.MeshStandardMaterial({
  color: 0x235b69,
  metalness: 0.52,
  roughness: 0.28,
  emissive: 0x05161b,
  emissiveIntensity: 0.12,
  envMap: reflectionEnvMap,
  envMapIntensity: 0.86,
  side: THREE.DoubleSide,
});
const streetEdgeLPlane = new THREE.PlaneGeometry(boulevard.streetEdgeWidth, Z_FLOOR_LEN);
const streetEdgeLeft  = new THREE.Mesh(streetEdgeLPlane, streetEdgeMat);
const streetEdgeRight = new THREE.Mesh(streetEdgeLPlane, streetEdgeMat);
streetEdgeLeft.rotation.x  = -Math.PI / 2;
streetEdgeRight.rotation.x = -Math.PI / 2;
streetEdgeLeft.position.set( -(roadHalf() + boulevard.streetEdgeWidth / 2), 0.10, Z_FLOOR_CENTER);
streetEdgeRight.position.set( roadHalf() + boulevard.streetEdgeWidth / 2,   0.10, Z_FLOOR_CENTER);
streetEdgeLeft.visible = false;
streetEdgeRight.visible = false;
scene.add(streetEdgeLeft, streetEdgeRight);
const streetEdgeLeftTiles = [];
const streetEdgeRightTiles = [];

function updateRoadSurfaceWidth(width) {
  dynamicRoadSurfaceWidth = Math.max(boulevardRoadWidth(), width);
  syncRoadBacking();
}

// ---------- Ground LEDs are declared before road edge materials so all road-edge materials stay tunable. ----------
const groundLedMaterials = [];
const outerStreetEdgeRoadEdges = [];

// ---------- Ground geometry helpers (extracted -> ground-geometry.js) ----------

function addGroundLineLoop(points, mat, y = 0.54) {
  const line = new THREE.LineLoop(new THREE.BufferGeometry(), mat);
  setGroundLineLoop(line, points, y);
  scene.add(line);
  return line;
}

function addGroundSegment(p1, p2, mat, y = 0.46, thickness = 0.22, height = 0.08) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, 1), mat);
  mesh.position.y = y;
  setGroundSegment(mesh, p1, p2, thickness, height);
  scene.add(mesh);
  return mesh;
}

// Cross streets — true intersections in the gaps between the building rows.
const sideRoadRecords = [];
const CROSS_STREET_MAX_LENGTH = 2 * (MAIN_ROAD_WIDTH * MAX_BOULEVARD_WIDTH_SCALE / 2 + STREET_EDGE_WIDTH_MAX + SIDE_BUILDING_BASE * MAX_BUILDING_AXIS_SCALE);
// ---------- Tron energy pulses (extracted -> energy-pulse.js) ----------

// ---------- RoadEdge EL strips (cyan tube borders between road and streetEdge) ----------
const longitudinalRoadEdgeRecords = [];

// ---------- la mappa del boulevard sta in world/boulevard-layout.js ----------
initBoulevardLayout({
  streetEdgeLeft,
  streetEdgeRight,
  streetEdgeLeftTiles,
  streetEdgeRightTiles,
  sideRoadRecords,
  longitudinalRoadEdgeRecords,
  controlEls,
  CROSS_STREET_MAX_LENGTH,
});
{
  function addLongitudinalRoadEdgeSegments(sign, kind, mat, width, height) {
    for (let i = 0; i <= sideRoadRecords.length; i++) {
      const segment = new THREE.Mesh(new THREE.BoxGeometry(width, height, 1), mat);
      segment.position.set(sign * (kind === 'inner' ? roadHalf() : roadHalf() + boulevard.streetEdgeWidth), kind === 'inner' ? 0.38 : 0.36, Z_FLOOR_CENTER);
      segment.visible = false;
      scene.add(segment);
      longitudinalRoadEdgeRecords.push({ mesh: segment, sign, kind, index: i });
      if (kind === 'outer') outerStreetEdgeRoadEdges.push(segment);
    }
  }

  const roadEdgeMat = new THREE.MeshBasicMaterial({ color: PAL.tealLight, toneMapped: false });
  groundLedMaterials.push({ material: roadEdgeMat, baseColor: new THREE.Color(PAL.tealLight), role: 'roadEdge' });
  [-1, 1].forEach((sign) => addLongitudinalRoadEdgeSegments(sign, 'inner', roadEdgeMat, 0.40, 0.18));
  // outer streetEdge edge
  const outerRoadEdgeMat = new THREE.MeshBasicMaterial({ color: PAL.cyan, toneMapped: false });
  groundLedMaterials.push({ material: outerRoadEdgeMat, baseColor: new THREE.Color(PAL.cyan), role: 'roadEdge' });
  [-1, 1].forEach((sign) => addLongitudinalRoadEdgeSegments(sign, 'outer', outerRoadEdgeMat, 0.30, 0.15));
}

// Crosswalk / racetrack markings intentionally removed: this variant keeps only
// the exact boulevard road network.

// soft fills (low — let env + emissives carry mood)
const ambientLight = new THREE.HemisphereLight(0x182a32, 0x02050a, 0.10);
scene.add(ambientLight);
// fx.hemiLight=0 / fx.dirLight=0: drop a light from the render list so lit
// shaders recompile without its per-fragment term (visible=false is how three
// omits a light). Intensity writes elsewhere stay harmless.
ambientLight.visible = fxEnabled('hemiLight');
const dirKey = new THREE.DirectionalLight(0x6ec8e6, 0.18);
dirKey.position.set(40, 220, 120);
scene.add(dirKey);
// Mobile: drop the directional key light by default. Measured +3.7fps on a real
// iPhone (it runs a per-fragment BRDF on every lit pixel of the huge floor +
// facades). At intensity 0.18 the mood is carried by the hemisphere fill + the
// emissive LEDs, so the look barely changes. ?dirLight=on re-adds it for A/B;
// fx.dirLight=0 still forces it off anywhere; desktop keeps it.
const dirLightParam = (() => { try { return new URLSearchParams(location.search).get('dirLight'); } catch { return null; } })();
const dirLightActive = dirLightParam != null ? dirLightParam !== 'off' : !mobilePerformanceProfileActive();
dirKey.visible = fxEnabled('dirLight') && dirLightActive;

// ---------- Tron overlay buildings ----------
const overlayGroup = new THREE.Group();
scene.add(overlayGroup);
const tronRunnerCrowdColliderRecordCache = {
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
const cityRevealMainLedReveal = createCityRevealMainLed({
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

const mainFacadeVerticalRevealState = {
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
const bridges = createBridgeRuntime({
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

function buildingLedBatchInspect() {
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
  elStrip,
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
  getLatestMeasuredFps: () => latestMeasuredFps,
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
  getLatestMeasuredFps: () => latestMeasuredFps,
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
  getDynamicRoadSurfaceWidth: () => dynamicRoadSurfaceWidth,
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

const cityRevealRender = createCityRevealRenderRuntime({
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

function mainFacadeVerticalRevealProgress() {
  if (cityRevealComplete) return 1;
  const revealElapsed = cityRevealMainLedReveal.revealElapsedMs();
  const revealDuration = Math.max(1, cityRevealFadeDurationMs() - cityRevealMainLedReveal.visibleDelayMs);
  const t = THREE.MathUtils.clamp(revealElapsed / revealDuration, 0, 1);
  return t * t * (3 - 2 * t);
}

function updateMainFacadeVerticalReveal() {
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


const cityRevealProfiler = createCityRevealProfiler({
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


function shouldUpdateTronRunnerSourceCharacter() {
  return Boolean(TRON_RUNNER_SOURCE_CHARACTER_VISIBLE);
}

// ---------- post (bloom): il dominio sta in engine/post-pipeline.js ----------
initPostPipeline({ renderer, camera, cityRevealRender, postRevealPerfIsolationState, retroBenchmarkSearchParams });

function syncHexRoadLodForFrame() {
  setHexRoadLodProfile({ mobile: mobilePerformanceProfileActive() });
  updateHexRoadBatchLod();
}

setupPost();

// ---------- il pannello dei controlli sta in controls/control-panel.js ----------
// ---------- applyLiveControls sta in controls/live-controls.js ----------
initLiveControls({
  ambientLight,
  applySkyControlsFromUI,
  applySkyPreset,
  applyStormControlsFromUI,
  bridges,
  controlEls,
  dirKey,
  domeMat,
  hexTileDisplayBaseEmissive,
  hexTileDisplayHitEmissive,
  PAL,
  renderer,
  roadBoundaryHexRowOffsets,
  roadMat,
  setFixedCameraFov,
  updateRoadSurfaceWidth,
  computeDynamicRoadBounds,
  updateMainRoadLength,
});
initControlPanel({
  ambientLight,
  applyTronSoundtrackIntroLofiMix,
  camera,
  controlEls,
  dirKey,
  groundLedMaterials,
  hexTileDisplayBaseEmissive,
  hexTileDisplayHitEmissive,
  PAL,
  performanceDiagnostics,
  renderer,
  roadMat,
  setTronSoundtrackIntroLofi,
  syncTronIntroFxNodeSettings,
  tronSoundtrack,
  setFixedCameraFov,
  getLatestMeasuredFps: () => latestMeasuredFps,
  scheduleLiveControls,
});

// ---------- il prewarm e il boot stanno in engine/boot-prewarm.js ----------
initBootPrewarm({ scene, camera, renderer, performanceDiagnostics, cityRevealRender });

// ---------- le scorciatoie di ispezione stanno in engine/inspect-hooks.js ----------
initInspectHooks({
  camera,
  renderer,
  controlEls,
  fpsEl,
  bridges,
  skyDome,
  performanceDiagnostics,
  cityRevealProfiler,
  cityRevealRender,
  cityRevealMainLedReveal,
  mainFacadeVerticalRevealState,
  welcomeWindowMotion,
  cinematicGroundingSettings,
  droneIntroHeroShotEnabled,
  hexRoadInspect,
  buildingLedBatchInspect,
  postRevealPerfIsolationInspect,
  getDynamicRoadSurfaceWidth: () => dynamicRoadSurfaceWidth,
});

let viewportResizeFrame = 0;
function applyViewportResize() {
  viewportResizeFrame = 0;
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  if (post.composer) post.composer.setSize(w, h);
  applyRenderResolution(Number(controlEls.pixelRatio.value));
}
window.addEventListener('resize', () => {
  if (viewportResizeFrame) return;
  viewportResizeFrame = requestAnimationFrame(applyViewportResize);
});

let last = performance.now();
let fpsAccum = 0, fpsFrames = 0, fpsLast = last;
let startPositionLabelLast = 0;
let latestMeasuredFps = 0;

function collectTechBreakdownStats() {
  const fxInspect = fxToggleInspect();
  const fxDisabled = Object.entries(fxInspect.toggles || {})
    .filter(([, entry]) => entry.applied === false)
    .map(([name]) => name);
  return {
    ...performanceDiagnostics.summary(latestMeasuredFps),
    skyBake: skyDome.inspectSkyBake(),
    temporalAa: post.temporalAaPass?.inspect() || { enabled: false, profile: post.temporalAaSettings.profile },
    webgpu: { roadmap: 'compute TAA + motion vectors' },
    hexRoad: hexRoadInspect(),
    fxDisabled,
  };
}

const techBreakdownOverlay = techBreakdownRequestedFromParams(retroBenchmarkSearchParams)
  ? createTechBreakdownOverlay({ getStats: collectTechBreakdownStats })
  : null;


// ---------- Atmospheric particles (extracted -> atmosphere-particles.js) ----------
initAtmosphereParticles({ getScene: () => scene, cyan: PAL.cyan });

function tick(now) {
  requestAnimationFrame(tick);
  const frameStartedAt = performance.now();
  const rawRafDtMs = Math.max(0, now - last);
  const dt = Math.min(0.05, rawRafDtMs / 1000); last = now;
  updateTronDiscCursor(dt);
  fpsAccum += dt; fpsFrames++;
  if (now - fpsLast > 500) {
    const measuredFps = fpsFrames / fpsAccum;
    latestMeasuredFps = measuredFps;
    fpsEl.textContent = measuredFps.toFixed(0);
    performanceDiagnostics.update(measuredFps);
    tunePerformanceBudget(measuredFps);
    fpsAccum = 0; fpsFrames = 0; fpsLast = now;
  }
  removeViewMotionOffset();
  const droneIntroWasActive = updateDroneIntroFlight(now);
  updateContactTerminal(now);
  const contactTerminalCameraOwned = contactTerminalOwnsCamera();
  if (!droneIntroWasActive && !contactTerminalCameraOwned) applyMovement(dt);
  syncHexRoadLodForFrame();
  const revealPerformanceCritical = isCityRevealPerformanceCritical();
  if (!revealPerformanceCritical) {
    stepHexRoadTiles(dt);
    updateRoadBoundaryPulse(dt);
    secondaryEffectFrame++;
    const updateSecondaryEffects = secondaryEffectFrame % SECONDARY_EFFECT_UPDATE_STRIDE === 0;
    boundaryErrorAccumulatedDt = Math.min(0.12, boundaryErrorAccumulatedDt + dt);
    if (updateSecondaryEffects || boundaryErrorNeedsUpdate()) {
      updateBoundaryError(boundaryErrorAccumulatedDt);
      boundaryErrorAccumulatedDt = 0;
    }
    if (!contactTerminalCameraOwned) updateWalkSimulation(dt);
    if (shouldUpdateTronRunnerSourceCharacter()) tronRunnerOrchestration.update(dt);
    if (postRevealPerfIsolationState.crowd) {
      tronRunnerCrowdRuntime.update(dt);
    } else {
      tronRunnerCrowdGroup.visible = false;
      tronRunnerCrowdRuntimeStats.cullingVisibleCount = 0;
      tronRunnerCrowdRuntimeStats.cullingHiddenCount = tronRunnerCrowd.length;
      tronRunnerCrowdRuntimeStats.activeReflectionCount = 0;
    }
  } else {
    tronRunnerCrowdRuntimeStats.performanceFreezeFrameCount += 1;
  }
  if (now - startPositionLabelLast > 180) {
    updateStartPositionLiveLabel();
    startPositionLabelLast = now;
  }
  if (!contactTerminalCameraOwned) applyViewMotionOffset();
  skyDome.update(now);
  // Sky background bake (on by default, desktop and mobile; ?skyBake=0 turns it
  // off, ?skyBake=1 forces it): only in steady state — post-reveal with no reveal
  // compositing active — so the reveal's own sky is untouched.
  skyDome.syncSkyBackgroundBake(now, cityRevealComplete && !isCityRevealCompositeActive());
  if (!revealPerformanceCritical) {
    updateCityDepartmentBoards(now);
    updateCityRoleBoard();
    flushHexTileBatchUploads();
    const edgePulseSeconds = now * 0.001;
    updateEdgePulse(edgePulseSeconds);
    updateAtmosphereParticles(cityRevealComplete, edgePulseSeconds);
    if (fxEnabled('speechBubbles')) {
      updateGreeterSpeechBubble();
      updateTronRunnerCrowdSpeechBubbles();
    }
  }
  updateCityRevealWireframe(now);
  syncTronDiscRevealWaiting();
  syncCityRevealPerformanceProfile();
  maybeStartRetroBenchmarkAuto(now);
  const postRevealPerformanceCritical = isCityRevealPerformanceCritical();
  const bypassBloomForReveal = shouldBypassBloomForRevealPerformance();
  if (post.bloomPass) post.bloomPass.enabled = post.bloomEnabled && postRevealPerfIsolationState.bloom && !bypassBloomForReveal && fxEnabled('bloom');
  syncBloomTemporalBudget();
  syncCinematicLookPass(now);
  syncTemporalAaPass();
  syncBloomLookMerge();
  if (!postRevealPerformanceCritical) {
    if (postRevealPerfIsolationState.equalizer) {
      updateLabEqualizer(now, dt);
    } else if (labEqualizerGroup.visible) {
      labEqualizerGroup.visible = false;
    }
    tronRunnerReveal.update(now);
    tronRunnerBeatPulse.update();
    updateMainFacadeVerticalReveal();
  }
  updateStaticCityCulling();
  const renderStartedAt = performance.now();
  const captureRevealRenderInfo = cityRevealProfiler.shouldRun() || cityRevealProfiler.isCapturing();
  const previousRendererInfoAutoReset = renderer.info.autoReset;
  if (captureRevealRenderInfo) {
    renderer.info.autoReset = false;
    renderer.info.reset();
  }
  performanceDiagnostics.pollGpuTimerSamples();
  performanceDiagnostics.beginGpuTimerSample();
  const temporalAaJittered = applyTemporalAaJitterForRender();
  syncComposerBufferRoles();
  try {
    cityRevealRender.renderCompositeFrame();
  } finally {
    clearTemporalAaJitterForRender(temporalAaJittered);
    performanceDiagnostics.endGpuTimerSample();
  }
  // Handed over by reference: the profiler copies the four counters it needs on
  // the spot, and info.render is only reset by the next render call.
  const frameRenderInfo = captureRevealRenderInfo ? renderer.info.render : null;
  if (captureRevealRenderInfo) renderer.info.autoReset = previousRendererInfoAutoReset;
  const frameEndedAt = performance.now();
  performanceDiagnostics.timing.updateMs = renderStartedAt - frameStartedAt;
  performanceDiagnostics.timing.renderMs = frameEndedAt - renderStartedAt;
  performanceDiagnostics.timing.frameMs = frameEndedAt - frameStartedAt;
  performanceDiagnostics.updateRollingMetrics(dt, performanceDiagnostics.timing.frameMs, performanceDiagnostics.timing.updateMs, performanceDiagnostics.timing.renderMs);
  performanceDiagnostics.recordSpike({
    now,
    rawRafDtMs,
    updateMs: performanceDiagnostics.timing.updateMs,
    renderMs: performanceDiagnostics.timing.renderMs,
    frameMs: performanceDiagnostics.timing.frameMs,
  });
  cityRevealProfiler.recordFrame({
    now,
    dt,
    updateMs: performanceDiagnostics.timing.updateMs,
    renderMs: performanceDiagnostics.timing.renderMs,
    frameMs: performanceDiagnostics.timing.frameMs,
    renderInfo: frameRenderInfo,
  });
  retroBenchmarkRuntime.recordFrame({
    now,
    rafDtMs: rawRafDtMs,
    updateMs: performanceDiagnostics.timing.updateMs,
    renderMs: performanceDiagnostics.timing.renderMs,
    frameMs: performanceDiagnostics.timing.frameMs,
    // recordFrame reads these fields synchronously (and early-returns when idle),
    // so pass the live info objects instead of allocating a copy every frame
    renderInfo: renderer.info.render,
    memoryInfo: renderer.info.memory,
  });
  techBreakdownOverlay?.update(now);
}
export const retroSceneReady = bootSceneWithFinalDefaults().then(() => {
  trimProductionControls();
  return new Promise((resolve) => requestAnimationFrame((now) => {
    last = now;
    fpsLast = now;
    fpsAccum = 0;
    fpsFrames = 0;
    startCityRevealWireframe();
    if (player.backspaceIntroTriggered) startCityRevealWireTimer();
    tick(now);
    loader.classList.add('hidden');
    player.sceneBootComplete = true;
    resolve();
  }));
}).catch((error) => {
  // Senza questo catch un boot che fallisce diventa una unhandled rejection:
  // il loader resta appeso per sempre e in console non compare niente di
  // riconducibile alla demo. Stesso tag di scheduleRetroFutureCityBoot in
  // index.html, che gia' fa lo stesso per il fallimento dell'import.
  console.error('[retro-future]', error);
  throw error;
});

export { triggerWelcomeButtonStart as startRetroFuture };
