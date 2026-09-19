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
  BLOOM_RESOLUTION_CAP,
  CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS,
  CITY_REVEAL_BACKPLATE_SWEEP_PORTION,
  CITY_REVEAL_DEFAULT_DELAY_MS,
  CITY_REVEAL_DEFAULT_FADE_MS,
  CITY_REVEAL_MAX_SKY_BACKPLATE_OPACITY,
  CITY_REVEAL_RENDER_ORDER,
  CITY_REVEAL_SWEEP_MARGIN_Z,
  CITY_REVEAL_SWEEP_MODE,
  FIXED_CAMERA_FOV,
  FSR_BENCHMARK_PRESET_KEYS,
  FSR_MANUAL_CONTROL_IDS,
  FSR_PRESETS,
  HEX_ROAD_UPDATE_FRAME_STRIDE,
  MAX_HEX_ROAD_ACCUMULATED_DT,
  MAX_RENDER_PIXEL_RATIO,
  SECONDARY_EFFECT_UPDATE_STRIDE,
} from './world/config.js';
import {
  AUDIO_FX_FAST_CONTROL_IDS,
  BASE_PAD_MATERIAL_FAST_CONTROL_IDS,
  BOUNDARY_ERROR_FAST_CONTROL_IDS,
  BUILDING_MATERIAL_FAST_CONTROL_IDS,
  CHARACTER_FAST_CONTROL_IDS,
  HEX_RUNTIME_FAST_CONTROL_IDS,
  LIGHT_FAST_CONTROL_IDS,
  MOVEMENT_FAST_CONTROL_IDS,
  POST_FAST_CONTROL_IDS,
  PRODUCTION_LIVE_CONTROL_SELECTOR,
  ROAD_MATERIAL_FAST_CONTROL_IDS,
  SKY_FAST_CONTROL_IDS,
  WIREFRAME_FAST_CONTROL_IDS,
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
  waitForNextFrame,
} from './audio/player-footsteps.js';
import {
  mountSideFacadeLedControls as mountSideFacadeLedControlsCore,
} from './controls/facade-led-controls.js';
import { createBuildingLiveControlsRuntime } from './controls/building-live-controls.js';
import { createControlSettingsRuntime, setButtonFeedback } from './controls/control-settings-runtime.js';
import { fxEnabled, fxToggleInspect } from './engine/fx-debug-toggles.js';
import {
  post,
  initPostPipeline,
  adaptiveRenderTargetInspect,
  effectiveComposerPixelRatio,
  syncFsrUpscalePass,
  syncCinematicLookPass,
  syncTemporalAaPass,
  applyTemporalAaJitterForRender,
  clearTemporalAaJitterForRender,
  syncGlobalFxaaPass,
  syncBloomLookMerge,
  syncComposerBufferRoles,
  applyAntialiasControls,
  applyBloomEnabled,
  isBloomPassActive,
  hasDroneIntroLanded,
  shouldBypassBloomForRevealPerformance,
  isBloomRevealBypassed,
  invalidateBloomTemporalCache,
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
  cityDepartmentBoardInspect,
  cityDepartmentBoardRevealFactor,
  getCityDepartmentBoards,
  initCityDepartmentBoards,
  updateCityDepartmentBoards,
  CITY_ROLE_BOARD_ENABLED,
  cityRoleBoardInspect,
  getCityRoleBoards,
  initCityRoleBoards,
  syncCityRoleBoardDoorPose,
  updateCityRoleBoard,
} from './world/city-boards.js';
import {
  contactTerminalInspect,
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
  inspectSideBuildingCivicNumberCulling,
  inspectSideBuildingDoorBatching,
  sideBuildingCivicNumberForBuildIndex,
  sideBuildingCivicNumberGroups,
  sideDoorBatchState,
  sideDoorFaceOffset,
  sideDoorHeight,
  sideDoorScale,
  sideDoorWidth,
  sideDoorY,
  updateSideBuildingDoorBatchMeshes,
  updateSideBuildingDoorMaterials,
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
  updateEdgeStrips,
} from './world/building-leds.js';
import {
  bridgeMaterials,
  buildBuildingShells,
  createWetAsphaltFacadeMaterial,
  initBuildings,
  mainBuildingColliders,
  mainBuildingMaterials,
  mainBuildingMeshes,
  mainBuildingRecords,
  makeChamferedBox,
  sideBuildingColliders,
  sideBuildingMaterials,
  sideBuildingMeshes,
  sideBuildingRecords,
  updateBuildingFootprints,
  updateBuildingMaterials,
  updateBuildingScale,
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
  facadeLedRuntimeInspect,
  hasMainFacadeVerticalRevealLedMaterials,
  initFacadeLedTreatment,
  invalidateMainFacadeVerticalRevealLedBounds,
  mainFacadeVerticalRevealLedBounds,
  setFacadeLedRuntimeSettings,
  setMainFacadeVerticalRevealUniforms,
  sideBuildingLedLayoutInspect,
  updateFacadeLedRibbons,
  updateFacadeStripOutsets,
} from './world/facade-led-treatment.js';
import { createSkyDome } from './world/sky-dome.js';
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
  DEFAULT_PLAYER_SPAWN,
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
  applyCharacterControlsFromUI,
  applyCinematicGroundingInitialControls,
  tronRunnerBeatPulse,
  tronRunnerCrowd,
  tronRunnerCrowdGroup,
  tronRunnerCrowdRuntime,
  tronRunnerCrowdRuntimeStats,
  tronRunnerIdleCharacter,
  tronRunnerIdleCharacterGroup,
  tronRunnerIdleCharacterRuntime,
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
  safeSideBuildingSpacingScale,
  roadSurfaceWidthForBuildings,
  updateStreetEdgeLayout,
  updateBuildingStreetEdgeBlocks,
  updateMainBuildingStreetEdgeBlock,
  updateLongitudinalRoadEdges,
  updateSideRoadLayout,
} from './world/boulevard-layout.js';
import { createCityRevealMainLed } from './world/city-reveal-main-led.js';
import {
  CITY_REVEAL_MAIN_BUILDING_LED_WIREFRAME_ENABLED,
  CITY_REVEAL_ROAD_FADE_BANDS,
  CITY_REVEAL_ROAD_FADE_MAX_OPACITY,
  CITY_REVEAL_ROAD_GRID_EXTRA_BLOCKS,
  CITY_REVEAL_ROAD_GRID_FADE_BANDS,
  CITY_REVEAL_ROAD_GRID_PROCEDURAL,
  CITY_REVEAL_ROAD_GRID_RENDER_ORDER,
  CITY_REVEAL_ROAD_SOLID_BACKING_ENABLED,
  CITY_REVEAL_ROAD_SOLID_FADE_ENABLED,
  CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED,
  applyCityRevealWireframeDisabledControlsState,
  buildCityRevealWireframe,
  cityRevealArmedAt,
  cityRevealBackplate,
  cityRevealBackplateMat,
  cityRevealBackplateOpacityScale,
  cityRevealComplete,
  cityRevealCompletedAt,
  cityRevealDelayMs,
  cityRevealEffectiveDelayMs,
  cityRevealEstimatedVisibleObjects,
  cityRevealFadeDurationMs,
  cityRevealFadeMs,
  cityRevealFrontForProgress,
  cityRevealFrontZ,
  cityRevealMainBuildingSlowDiagnostics,
  cityRevealOverlayCamera,
  cityRevealOverlayScene,
  cityRevealRealClipPlane,
  cityRevealRoadFadeMaterials,
  cityRevealRoadFadeObjects,
  cityRevealRoadGridAlphaFactor,
  cityRevealRoadGridBounds,
  cityRevealRoadGridFadeAt,
  cityRevealRoadGridGroup,
  cityRevealRoadGridHalfWidth,
  cityRevealRoadGridMat,
  cityRevealRoadGridObjects,
  cityRevealRoadGridScene,
  cityRevealRoadGridSkippedPerimeterSegments,
  cityRevealRoadGridExtraWidth,
  cityRevealRoadSolidTopY,
  cityRevealScanGlow,
  cityRevealSidewalkWireY,
  cityRevealSolidObjects,
  cityRevealStartedAt,
  cityRevealSweepEndZ,
  cityRevealSweepProgress,
  cityRevealSweepStartZ,
  cityRevealWaitingForVisibleFrame,
  cityRevealWireAlpha,
  cityRevealWireCullStats,
  cityRevealWireGroup,
  cityRevealWireObjects,
  cityRevealWireOpacityScale,
  cityRevealWireScene,
  cityRevealWireframeDensity,
  cityRevealWireframeEnabled,
  initCityRevealWireframe,
  isCityRevealBackplateActive,
  isCityRevealCompositeActive,
  isCityRevealPerformanceCritical,
  isCityRevealRealRevealActive,
  markCityRevealComplete,
  refreshCityRevealSweepBounds,
  renderCityRevealWireframe,
  restoreCityRevealWireframeState,
  setCityRevealPostProcessingPrewarmState,
  setCityRevealRoadGridAlphaFactor,
  setCityRevealSweepFront,
  setCityRevealWireAlpha,
  setCityRevealWireframeSettings,
  snapshotCityRevealWireframeState,
  startCityRevealWireTimer,
  startCityRevealWireframe,
  updateCityRevealWireframe,
} from './world/city-reveal-wireframe.js';
import { createCityRevealRenderRuntime } from './world/city-reveal-render-runtime.js';
import {
  BASE_PAD_CULLING_BOUNDS_MARGIN,
  BASE_PAD_FRUSTUM_CULLING_ENABLED,
  applyBasePadMaterialSettings,
  applyBasePadMaterialRuntimeSettings,
  applyBasePadRuntimeSettings,
  basePadHexClipMesh,
  basePadLedBatch,
  createBuildingBasePad,
  getBasePadCurbEnabled,
  initBasePads,
  updateBasePadHexInfluence,
  updateBasePadLedStrips,
  updateBuildingBasePad,
} from './world/base-pads.js';
import {
  initStaticCityCulling,
  staticCityCullStats,
  updateStaticCityCulling,
} from './engine/static-city-culling.js';
import {
  applyBridgeFixedDefaults,
  initBridgeControls,
  readBridgeNumber,
  readBridgeVisible,
  renderBridgeControls,
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
  applyBoundaryErrorVisualSettings,
  applyRoadBoundaryHexVisualSettings,
  boundaryErrorInspect,
  boundaryErrorNeedsUpdate,
  getRoadBoundaryHexStats,
  getTronNoclipEnabled,
  initBoundaryError,
  setTronNoclip,
  updateBoundaryError,
  updateRoadBoundaryHexMaterial,
  updateRoadBoundaryHexRows,
  updateRoadBoundaryPulse,
  updateRoadBoundaryPulseLayout,
} from './world/boundary-error.js';
import {
  droneIntroHeroShotRequestedFromParams,
  droneIntroInspect,
  getDroneIntroActive,
  initDroneIntro,
  scheduleDroneIntroAutoFlight,
  startDroneIntroFlight,
  updateDroneIntroFlight,
} from './camera/drone-intro.js';
import {
  getPointerLocked,
  getUnlockedMouseLookActive,
  initMouseLook,
  isMouseLookEnabled,
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
  mobileTouchControlsInspect,
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
  applyHexRuntimeSettings,
  flushHexTileBatchUploads,
  getDirtyHexTileBatchCount,
  getHexTileHeightScale,
  getHexTileScale,
  hexRoadTileBatches,
  hexRoadTileBuckets,
  hexRoadTiles,
  hexTileMat,
  hexTileActiveColor,
  hexTileBaseColor,
  hexTileDisplayActiveColor,
  hexTileDisplayBaseColor,
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
  setHexTileGap,
  setHexTileHeightScale,
  setHexRoadMaterialGlow,
  setHexRoadLodProfile,
  setHexTileScale,
  sidewalkMinSurfaceY,
  hexPlayerTileLight,
  hexTileHitLight,
  hexUpdateEnabled,
  stepHexRoadTiles,
  streetEdgeHexTileBatches,
  streetEdgeHexTiles,
  syncHexTileDisplayColor,
  streetEdgeHexMat,
  updateHexTileLayout,
  updateHexRoadBatchLod,
  updateStreetEdgeHexTileScale,
  updateZTileBand,
} from './world/hex-tiles.js';
import {
  getReflectionEnvMap,
  getRoadReflectionEnvMap,
  initReflectionEnv,
  setRoadBuildingReflection,
} from './engine/reflection-env.js';
import { mountFxCategoryPanels } from './controls/fx-panels.js';
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
  buildLabEqualizer,
  updateLabEqualizer,
  labEqualizerState,
} from './controls/equalizer.js';
import {
  PLAYER_SPAWN_KEY,
  PLAYER_SPAWN_LEGACY_Z,
  PLAYER_SPAWN_DEFAULT_Z,
  DRONE_LANDING_KEY,
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
  SCENE_TEXTURE_PREWARM_KEYS,
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
let hexTileBaseEmissiveIntensity = 0.18;
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

function formatOffsetLabel(value) {
  if (Math.abs(value) < 0.005) return '0.00';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)} ${value > 0 ? 'su' : 'giu'}`;
}

function tunedColor(baseColor, hueDeg, saturationScale, brightnessScale) {
  const hsl = {};
  baseColor.getHSL(hsl);
  const h = (hsl.h + hueDeg / 360 + 1) % 1;
  const s = THREE.MathUtils.clamp(hsl.s * saturationScale, 0, 1);
  const l = THREE.MathUtils.clamp(hsl.l * brightnessScale, 0, 1);
  return new THREE.Color().setHSL(h, s, l);
}

function sceneLightResponse(ambient, key) {
  const ambientDelta = ambient - 0.10;
  const keyDelta = key - 0.18;
  return {
    surface: THREE.MathUtils.clamp(1 + ambientDelta * 0.62 + keyDelta * 0.16, 0.34, 2.05),
    reflection: THREE.MathUtils.clamp(1 + ambientDelta * 0.82 + keyDelta * 0.22, 0.24, 2.35),
    emissive: THREE.MathUtils.clamp(1 + ambientDelta * 0.38 + keyDelta * 0.10, 0.38, 1.75),
    floorFill: THREE.MathUtils.clamp(ambient * 0.05 + key * 0.012, 0, 0.13),
    facadeFill: THREE.MathUtils.clamp(ambient * 0.035 + key * 0.008, 0, 0.10),
  };
}

function updateRoadTileMaterials(callback) {
  callback(hexTileMat);
  for (const batch of hexRoadTileBatches) {
    callback(batch.material);
    batch.material.color.set(0xffffff);
  }
}

function updateStreetEdgeTileMaterials(callback) {
  callback(streetEdgeHexMat);
  for (const batch of streetEdgeHexTileBatches) callback(batch.material);
}

function refreshRoadTileInstances() {
  for (const tile of hexRoadTiles) {
    const hitLight = tile.userData.hitLight || 0;
    const playerLight = tile.userData.playerLight || 0;
    const basePadLight = tile.userData.basePadLight || 0;
    syncHexTileDisplayColor(tile, hitLight, playerLight, basePadLight);
  }
}

function updateGroundLedMaterials(roadEdgeBrightness, medianBrightness, hueDeg) {
  for (const item of groundLedMaterials) {
    const amount = item.role === 'median' ? medianBrightness : roadEdgeBrightness;
    item.material.color.copy(tunedColor(item.baseColor, hueDeg, 1, amount));
  }
}

function updateControlTabs() {
  const tabs = document.querySelectorAll('#hud-controls .control-tab');
  const panels = document.querySelectorAll('#hud-controls .control-panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((button) => button.classList.toggle('active', button === tab));
      panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === target));
    });
  });
}



function trimProductionControls() {
  // The live-tuning UI is retired: control VALUES still come from the markup
  // defaults + canonical settings applied at boot (controlEls keeps reading
  // the detached elements), but no user-facing settings button or panel stays.
  document.getElementById('settings-toggle')?.remove();
  document.getElementById('hud-controls')?.remove();
}

// mountFxCategoryPanels moved to ./fx-panels.js (called once below, after performanceDiagnosticsEl).

const controlSettingsRuntime = createControlSettingsRuntime({
  controlEls,
  CITY_REVEAL_DEFAULT_DELAY_MS,
  CITY_REVEAL_DEFAULT_FADE_MS,
  updateStartPositionLiveLabel,
  sanitizePlayerSpawn,
  sanitizeDroneLandingPose,
  updatePlayerSpawnLabel,
  applyPlayerSpawn,
  setPlayerSpawn: (nextSpawn) => {
    player.playerSpawn = nextSpawn;
  },
  setDroneLandingPose: (nextLanding) => {
    player.droneLandingPose = nextLanding;
  },
});

const {
  formatRevealDelaySeconds,
  persistSettingsToProject,
} = controlSettingsRuntime;

function formatPlayerSpawn(spawn = player.playerSpawn) {
  return `${spawn.x.toFixed(1)}, ${spawn.y.toFixed(1)}, ${spawn.z.toFixed(1)} | yaw ${THREE.MathUtils.radToDeg(spawn.spawnYaw).toFixed(0)} pitch ${THREE.MathUtils.radToDeg(spawn.spawnPitch).toFixed(0)}`;
}

function formatCurrentPlayerPose() {
  return formatPlayerSpawn({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    spawnYaw: player.yaw,
    spawnPitch: player.pitch,
  });
}

function sanitizePlayerSpawn(value) {
  if (!value || typeof value !== 'object') return null;
  const spawn = {
    x: Number(value.x),
    y: Number(value.y),
    z: Number(value.z),
    spawnYaw: Number(value.spawnYaw ?? value.yaw),
    spawnPitch: Number(value.spawnPitch ?? value.pitch),
  };
  if (![spawn.x, spawn.y, spawn.z, spawn.spawnYaw, spawn.spawnPitch].every(Number.isFinite)) return null;
  if (Math.abs(spawn.x - DEFAULT_PLAYER_SPAWN.x) < 0.001 &&
      Math.abs(spawn.y - DEFAULT_PLAYER_SPAWN.y) < 0.001 &&
      Math.abs(spawn.z - PLAYER_SPAWN_LEGACY_Z) < 0.001) {
    spawn.z = PLAYER_SPAWN_DEFAULT_Z;
  }
  spawn.spawnPitch = THREE.MathUtils.clamp(spawn.spawnPitch, -PITCH_LIMIT, PITCH_LIMIT);
  return spawn;
}

function sanitizeDroneLandingPose(value) {
  const landing = sanitizePlayerSpawn(value);
  if (!landing) return null;
  if (typeof value.savedAt === 'string') landing.savedAt = value.savedAt;
  return landing;
}

function isDefaultDroneLandingPose(spawn) {
  if (!spawn) return false;
  return Math.abs(spawn.x - DEFAULT_DRONE_LANDING_POSE.x) < 0.001 &&
    Math.abs(spawn.y - DEFAULT_DRONE_LANDING_POSE.y) < 0.001 &&
    Math.abs(spawn.z - DEFAULT_DRONE_LANDING_POSE.z) < 0.001 &&
    Math.abs(spawn.spawnYaw - DEFAULT_DRONE_LANDING_POSE.spawnYaw) < 0.001;
}

function updatePlayerSpawnLabel() {
  if (controlEls.playerSpawnVal) controlEls.playerSpawnVal.textContent = formatPlayerSpawn(player.playerSpawn);
  if (controlEls.startPositionSavedVal) controlEls.startPositionSavedVal.textContent = formatPlayerSpawn(player.playerSpawn);
}

function updateStartPositionLiveLabel() {
  // The label lives in the controls panel, hidden by default; skip the pose-string build + DOM
  // write while hidden (refreshed on panel open via setHidden). Visual-neutral when not shown.
  if (document.body.classList.contains('controls-hidden')) return;
  if (controlEls.startPositionLiveVal) controlEls.startPositionLiveVal.textContent = formatCurrentPlayerPose();
}

function loadStoredPlayerSpawn() {
  try {
    const stored = JSON.parse(localStorage.getItem(PLAYER_SPAWN_KEY) || 'null');
    const nextSpawn = sanitizePlayerSpawn(stored?.spawn ?? stored);
    if (nextSpawn) {
      if (isDefaultDroneLandingPose(nextSpawn)) {
        player.droneLandingPose = sanitizeDroneLandingPose(stored?.spawn ?? stored) || nextSpawn;
        localStorage.setItem(DRONE_LANDING_KEY, JSON.stringify({ savedAt: player.droneLandingPose.savedAt || new Date().toISOString(), landing: player.droneLandingPose }, null, 2));
      } else {
        player.playerSpawn = nextSpawn;
      }
    }
    const storedLanding = JSON.parse(localStorage.getItem(DRONE_LANDING_KEY) || 'null');
    const nextLanding = sanitizeDroneLandingPose(storedLanding?.landing ?? storedLanding);
    if (nextLanding) player.droneLandingPose = nextLanding;
  } catch (error) {
    console.warn('Invalid TRON boulevard player spawn', error);
  }
  updatePlayerSpawnLabel();
}

function applyPlayerSpawn(spawn = player.playerSpawn, showFeedback = true) {
  const nextSpawn = sanitizePlayerSpawn(spawn) || DEFAULT_PLAYER_SPAWN;
  removeViewMotionOffset();
  movementVelocity.set(0, 0, 0);
  camera.position.set(nextSpawn.x, nextSpawn.y, nextSpawn.z);
  player.yaw = nextSpawn.spawnYaw;
  player.pitch = nextSpawn.spawnPitch;
  player.viewRoll = 0;
  setHeadBobOffset(0);
  setSideSwayOffset(0);
  applyCameraLook();
  resolveCameraBuildingCollision();
  resolveCameraRoadHexBoundaryCollision();
  player.walkSurfaceLift = Math.max(0, cameraGroundHeightAt(camera.position.x, camera.position.z) - player.cameraMinHeight);
  if (showFeedback) setButtonFeedback(controlEls.resetPlayerSpawn, 'Spawn ripristinato');
  if (showFeedback) setButtonFeedback(controlEls.goStartPosition, 'Posizione ripristinata');
  updateStartPositionLiveLabel();
  return window.__tronInspect?.();
}

function captureLivePlayerSpawn() {
  removeViewMotionOffset();
  player.playerSpawn = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    spawnYaw: player.yaw,
    spawnPitch: player.pitch,
    savedAt: new Date().toISOString(),
  };
  const payload = { savedAt: player.playerSpawn.savedAt, spawn: player.playerSpawn };
  localStorage.setItem(PLAYER_SPAWN_KEY, JSON.stringify(payload, null, 2));
  updatePlayerSpawnLabel();
  updateStartPositionLiveLabel();
  setButtonFeedback(controlEls.saveLiveSpawn, 'Spawn salvato');
  setButtonFeedback(controlEls.saveStartPosition, 'Inizio salvato');
  persistSettingsToProject('player-spawn', player.playerSpawn, { savedAt: player.playerSpawn.savedAt }).then((result) => {
    if (result) setButtonFeedback(controlEls.saveLiveSpawn, 'Spawn + JSON salvato');
    if (result) setButtonFeedback(controlEls.saveStartPosition, 'JSON salvato');
  });
  return player.playerSpawn;
}

function resetCameraHeightToDefault(showFeedback = true) {
  removeViewMotionOffset();
  camera.position.y = cameraGroundHeightAt(camera.position.x, camera.position.z);
  movementVelocity.y = 0;
  setHeadBobOffset(0);
  setSideSwayOffset(0);
  player.viewRoll = 0;
  applyCameraLook();
  keys.KeyE = false;
  keys.Space = false;
  keys.KeyQ = false;
  keys.KeyC = false;
  if (showFeedback) setButtonFeedback(controlEls.resetCameraHeight, 'Altezza ripristinata');
}


let liveControlsFrame = 0;
let liveControlsScope = null;
function fastScopeForControl(target) {
  if (!target?.id) return 'all';
  if (FSR_MANUAL_CONTROL_IDS.has(target.id) && controlEls.fsrPreset) {
    controlEls.fsrPreset.value = 'custom';
  }
  if (SKY_FAST_CONTROL_IDS.has(target.id)) return 'sky';
  if (POST_FAST_CONTROL_IDS.has(target.id)) return 'post';
  if (WIREFRAME_FAST_CONTROL_IDS.has(target.id)) return 'wireframe';
  if (AUDIO_FX_FAST_CONTROL_IDS.has(target.id)) return 'audio-fx';
  if (MOVEMENT_FAST_CONTROL_IDS.has(target.id)) return 'movement';
  if (CHARACTER_FAST_CONTROL_IDS.has(target.id)) return 'character';
  if (LIGHT_FAST_CONTROL_IDS.has(target.id)) return 'light';
  if (HEX_RUNTIME_FAST_CONTROL_IDS.has(target.id)) return 'hex-runtime';
  if (ROAD_MATERIAL_FAST_CONTROL_IDS.has(target.id)) return 'road-material';
  if (BUILDING_MATERIAL_FAST_CONTROL_IDS.has(target.id)) return 'building-material';
  if (BASE_PAD_MATERIAL_FAST_CONTROL_IDS.has(target.id)) return 'base-pad-material';
  if (BOUNDARY_ERROR_FAST_CONTROL_IDS.has(target.id)) return 'boundary-error';
  return 'all';
}

function mergeLiveControlScope(currentScope, nextScope) {
  if (!currentScope) return nextScope;
  if (currentScope === nextScope) return currentScope;
  if (currentScope === 'all' || nextScope === 'all') return 'all';
  return 'all';
}

function scheduleLiveControls(event) {
  const target = event?.currentTarget || event?.target;
  const nextScope = fastScopeForControl(target);
  liveControlsScope = mergeLiveControlScope(liveControlsScope, nextScope);
  if (liveControlsFrame) return;
  liveControlsFrame = requestAnimationFrame(() => {
    const scope = liveControlsScope || 'all';
    liveControlsFrame = 0;
    liveControlsScope = null;
    if (scope === 'sky') applySkyControlsFromUI();
    else if (scope === 'post') applyPostControlsFromUI();
    else if (scope === 'wireframe') applyWireframeFxControlsFromUI();
    else if (scope === 'audio-fx') applyTronSoundtrackIntroFxControlsFromUI();
    else if (scope === 'movement') applyMovementControlsFromUI();
    else if (scope === 'character') applyCharacterControlsFromUI();
    else if (scope === 'light') applyLightControlsFromUI();
    else if (scope === 'hex-runtime') applyHexRuntimeControlsFromUI();
    else if (scope === 'road-material') applyRoadMaterialControlsFromUI();
    else if (scope === 'building-material') applyBuildingMaterialControlsFromUI();
    else if (scope === 'base-pad-material') applyBasePadMaterialControlsFromUI();
    else if (scope === 'boundary-error') applyBoundaryErrorControlsFromUI();
    else applyLiveControls();
  });
}

function applyFsrPresetSelectionToControls() {
  if (!controlEls.fsrPreset || !controlEls.fsrUpscaleEnabled || !controlEls.fsrInternalScale) return;
  const presetKey = controlEls.fsrPreset.value || 'custom';
  const preset = FSR_PRESETS[presetKey];
  if (!preset || presetKey === 'custom') return;
  controlEls.fsrUpscaleEnabled.value = preset.enabled ? 'on' : 'off';
  controlEls.fsrInternalScale.value = preset.scale.toFixed(2);
}

function applyFsrPresetKey(presetKey) {
  if (!controlEls.fsrPreset || !FSR_PRESETS[presetKey]) return;
  controlEls.fsrPreset.value = presetKey;
  applyPostControlsFromUI();
}

function fsrBenchmarkDelay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitFsrBenchmarkFrames(frameCount = 12) {
  for (let index = 0; index < frameCount; index++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

function formatFsrBenchmarkNumber(value, decimals = 1) {
  return Number.isFinite(value) ? value.toFixed(decimals) : 'n/a';
}

function collectFsrBenchmarkSample(presetKey) {
  const stats = performanceDiagnostics.summary(latestMeasuredFps);
  const preset = FSR_PRESETS[presetKey] || FSR_PRESETS.custom;
  const passes = Array.isArray(stats.composerActivePasses) ? stats.composerActivePasses.join('+') : '';
  return {
    label: preset.label,
    fps: stats.fps,
    theoreticalFps: stats.theoreticalFps,
    gpuMs: stats.gpuMs,
    gpuSupported: stats.gpuTimerSupported,
    fsrEnabled: stats.fsrUpscaleEnabled,
    fsrScale: stats.fsrInternalScale,
    target: stats.fsrTarget?.key || `${stats.drawingBufferWidth}x${stats.drawingBufferHeight}`,
    passes,
  };
}

function formatFsrBenchmarkResults(results) {
  if (!results.length) return 'Benchmark FSR non eseguito';
  return results.map((result) => {
    const gpu = result.gpuSupported ? `${formatFsrBenchmarkNumber(result.gpuMs)}ms` : 'n/a';
    const fsr = result.fsrEnabled ? `${Math.round(result.fsrScale * 100)}%` : 'off';
    return `${result.label}: FPS ${formatFsrBenchmarkNumber(result.fps)} | teo ${formatFsrBenchmarkNumber(result.theoreticalFps, 0)} | GPU ${gpu} | FSR ${fsr} | ${result.target} | ${result.passes}`;
  }).join('\n');
}

async function runFsrBenchmark() {
  if (!controlEls.fsrBenchmarkResults) return;
  const previous = {
    preset: controlEls.fsrPreset?.value || 'custom',
    enabled: controlEls.fsrUpscaleEnabled?.value || 'on',
    scale: controlEls.fsrInternalScale?.value || '0.85',
    sharpness: controlEls.fsrSharpness?.value || '0',
  };
  controlEls.fsrBenchmarkResults.style.whiteSpace = 'pre-line';
  controlEls.fsrBenchmarkResults.textContent = 'Benchmark FSR in corso...';
  const results = [];
  try {
    for (const presetKey of FSR_BENCHMARK_PRESET_KEYS) {
      applyFsrPresetKey(presetKey);
      performanceDiagnostics.update(latestMeasuredFps);
      await waitFsrBenchmarkFrames(18);
      await fsrBenchmarkDelay(180);
      performanceDiagnostics.update(latestMeasuredFps);
      results.push(collectFsrBenchmarkSample(presetKey));
    }
    controlEls.fsrBenchmarkResults.textContent = formatFsrBenchmarkResults(results);
  } finally {
    if (controlEls.fsrPreset) controlEls.fsrPreset.value = previous.preset;
    if (controlEls.fsrUpscaleEnabled) controlEls.fsrUpscaleEnabled.value = previous.enabled;
    if (controlEls.fsrInternalScale) controlEls.fsrInternalScale.value = previous.scale;
    if (controlEls.fsrSharpness) controlEls.fsrSharpness.value = previous.sharpness;
    applyPostControlsFromUI();
  }
}

function applyFsrUpscaleControlsFromUI() {
  if (!controlEls.fsrUpscaleEnabled || !controlEls.fsrInternalScale || !controlEls.fsrSharpness) return;
  applyFsrPresetSelectionToControls();
  post.fsrUpscaleEnabled = controlEls.fsrUpscaleEnabled.value !== 'off';
  post.fsrInternalScale = THREE.MathUtils.clamp(Number(controlEls.fsrInternalScale.value) || 1, 0.65, 1);
  post.fsrSharpness = THREE.MathUtils.clamp(Number(controlEls.fsrSharpness.value) || 0, 0, 1.25);
  controlEls.fsrInternalScale.value = post.fsrInternalScale.toFixed(2);
  controlEls.fsrSharpness.value = post.fsrSharpness.toFixed(2);
  controlEls.fsrInternalScaleVal.textContent = `${Math.round(post.fsrInternalScale * 100)}%`;
  controlEls.fsrSharpnessVal.textContent = post.fsrSharpness.toFixed(2);
  syncFsrUpscalePass();
}

function applyPostControlsFromUI() {
  const nextPerformanceMode = controlEls.performanceMode.value;
  const nextRenderResolution = Number(controlEls.renderResolution.value);
  const nextAntialiasMode = controlEls.aaMode.value;
  const nextBloomEnabled = controlEls.bloomEnabled.value;
  const bloomStrength = Number(controlEls.bloomStrength.value);
  const bloomRadius = Number(controlEls.bloomRadius.value);
  const bloomThreshold = Number(controlEls.bloomThreshold.value);
  const bloomQuality = Number(controlEls.bloomQuality.value);
  const pixelRatio = Math.min(Number(controlEls.pixelRatio.value) || MAX_RENDER_PIXEL_RATIO, MAX_RENDER_PIXEL_RATIO);
  controlEls.pixelRatio.value = pixelRatio.toFixed(2);
  const previousPerformanceMode = post.performanceMode;
  post.performanceMode = nextPerformanceMode;
  post.manualRenderScale = nextRenderResolution;
  post.requestedBloomResolutionScale = bloomQuality;
  post.requestedPixelRatio = pixelRatio;
  applyFsrUpscaleControlsFromUI();
  applyAntialiasControls(nextAntialiasMode);
  applyBloomEnabled(nextBloomEnabled);
  if (post.performanceMode !== previousPerformanceMode || post.performanceMode === 'quality') {
    post.dynamicQualityScale = 1;
    post.performanceAdjustCooldown = 0;
  }
  applyRenderResolution(post.requestedPixelRatio);
  if (post.bloomPass) {
    post.bloomPass.enabled = post.bloomEnabled;
    post.bloomPass.strength = bloomStrength;
    post.bloomPass.radius = bloomRadius;
    post.bloomPass.threshold = bloomThreshold;
    invalidateBloomTemporalCache();
  }
  controlEls.renderResolutionVal.textContent = `${Math.round(nextRenderResolution * 100)}%`;
  controlEls.bloomVal.textContent = bloomStrength.toFixed(2);
  controlEls.bloomRadiusVal.textContent = bloomRadius.toFixed(2);
  controlEls.bloomThresholdVal.textContent = bloomThreshold.toFixed(2);
  controlEls.bloomQualityVal.textContent = bloomQuality.toFixed(2);
  controlEls.pixelRatioVal.textContent = pixelRatio.toFixed(2);
  applyWireframeFxControlsFromUI();
}

function applyWireframeFxControlsFromUI() {
  if (!controlEls.wireframeEnabled) return;
  const previousDensity = cityRevealWireframeDensity;
  setCityRevealWireframeSettings({
    enabled: controlEls.wireframeEnabled.value === 'on',
    delayMs: Number(controlEls.wireframeDelay.value) * 1000,
    fadeMs: Number(controlEls.wireframeFade.value) * 1000,
    density: Math.max(1, Math.round(Number(controlEls.wireframeDensity.value))),
    opacityScale: Number(controlEls.wireframeOpacity.value),
    backplateOpacityScale: Number(controlEls.wireframeBackplate.value),
  });

  controlEls.wireframeEnabledVal.textContent = cityRevealWireframeEnabled ? 'on' : 'off';
  controlEls.wireframeDelayVal.textContent = `${formatRevealDelaySeconds(cityRevealDelayMs / 1000)} s`;
  controlEls.wireframeFadeVal.textContent = `${(cityRevealFadeMs / 1000).toFixed(1)} s`;
  controlEls.wireframeDensityVal.textContent = `${cityRevealWireframeDensity}x`;
  controlEls.wireframeOpacityVal.textContent = cityRevealWireOpacityScale.toFixed(2);
  controlEls.wireframeBackplateVal.textContent = cityRevealBackplateOpacityScale.toFixed(2);

  if (!cityRevealWireframeEnabled) {
    applyCityRevealWireframeDisabledControlsState();
    updatePointerLockHint();
    return;
  }
  if (previousDensity !== cityRevealWireframeDensity && cityRevealWireObjects.length) {
    buildCityRevealWireframe();
  }
  setCityRevealWireAlpha(cityRevealWireAlpha);
}

function applyTronSoundtrackIntroFxControlsFromUI() {
  if (!controlEls.musicFxEnabled) return;
  const fx = {
    enabled: controlEls.musicFxEnabled.value === 'on',
    mix: THREE.MathUtils.clamp(Number(controlEls.musicFxMix.value), 0, 1),
    crusher: THREE.MathUtils.clamp(Number(controlEls.musicFxCrusher.value), 0, 1),
    bitDepth: THREE.MathUtils.clamp(Math.round(Number(controlEls.musicFxBitDepth.value)), 2, 16),
    highpassHz: THREE.MathUtils.clamp(Number(controlEls.musicFxHighpass.value), 20, 5000),
    lowpassHz: THREE.MathUtils.clamp(Number(controlEls.musicFxLowpass.value), 1000, 20000),
    distortion: THREE.MathUtils.clamp(Number(controlEls.musicFxDistortion.value), 0, 1),
    telephone: THREE.MathUtils.clamp(Number(controlEls.musicFxTelephone.value), 0, 1),
    wobble: THREE.MathUtils.clamp(Number(controlEls.musicFxWobble.value), 0, 1),
    noise: THREE.MathUtils.clamp(Number(controlEls.musicFxNoise.value), 0, 1),
  };
  tronSoundtrack.introFx = fx;
  controlEls.musicFxEnabledVal.textContent = fx.enabled ? 'on' : 'off';
  controlEls.musicFxMixVal.textContent = fx.mix.toFixed(2);
  controlEls.musicFxCrusherVal.textContent = fx.crusher.toFixed(2);
  controlEls.musicFxBitDepthVal.textContent = `${fx.bitDepth} bit`;
  controlEls.musicFxHighpassVal.textContent = `${Math.round(fx.highpassHz)} Hz`;
  controlEls.musicFxLowpassVal.textContent = `${Math.round(fx.lowpassHz)} Hz`;
  controlEls.musicFxDistortionVal.textContent = fx.distortion.toFixed(2);
  controlEls.musicFxTelephoneVal.textContent = fx.telephone.toFixed(2);
  controlEls.musicFxWobbleVal.textContent = fx.wobble.toFixed(2);
  controlEls.musicFxNoiseVal.textContent = fx.noise.toFixed(2);
  if (!tronSoundtrack.ready) return;
  if (tronSoundtrack.playing && fx.enabled && !tronSoundtrack.introLofiActive) {
    setTronSoundtrackIntroLofi(true, 0.03);
    return;
  }
  if (!fx.enabled && tronSoundtrack.introLofiActive) {
    setTronSoundtrackIntroLofi(false, 0.03);
    return;
  }
  syncTronIntroFxNodeSettings(0.03);
  applyTronSoundtrackIntroLofiMix(tronSoundtrack.introLofiActive, 0.03);
}

function applyMovementControlsFromUI() {
  if (controlEls.noclipEnabled) {
    setTronNoclip(controlEls.noclipEnabled.value === 'on', { silent: true });
  }
  collisioni.collisionPadding = Number(controlEls.collisionPadding.value);
  collisioni.mainBuildingCollisionPadding = Number(controlEls.mainBuildingCollisionPadding.value);
  player.cameraMinHeight = Number(controlEls.cameraMinHeight.value);
  player.speedBase = Number(controlEls.walkSpeed.value);
  player.speedSprint = Number(controlEls.sprintSpeed.value);
  player.backwardSpeedScale = Number(controlEls.backwardSpeedScale.value);
  player.strafeSpeedScale = Number(controlEls.strafeSpeedScale.value);
  player.diagonalSpeedScale = Number(controlEls.diagonalSpeedScale.value);
  player.verticalSpeed = Number(controlEls.verticalSpeed.value);
  player.movementAcceleration = Number(controlEls.movementAccel.value);
  player.movementDeceleration = Number(controlEls.movementDecel.value);
  player.walkBobAmount = Number(controlEls.walkBob.value);
  player.runBobAmount = Number(controlEls.runBob.value);
  player.strafeBobScale = Number(controlEls.strafeBobScale.value);
  player.backwardBobScale = Number(controlEls.backwardBobScale.value);
  player.walkStepRate = Number(controlEls.walkStepRate.value);
  player.runStepRate = Number(controlEls.runStepRate.value);
  player.stepSnapAmount = Number(controlEls.stepSnap.value);
  player.movementSwayAmount = Number(controlEls.movementSway.value);
  player.movementRollAmount = Number(controlEls.movementRoll.value);
  player.strafeLeanAmount = Number(controlEls.strafeLean.value);
  player.headMotionSmoothing = Number(controlEls.headMotionSmoothing.value);
  player.mouseSensitivityScale = Number(controlEls.mouseSensitivity.value);
  setFixedCameraFov();
  controlEls.collisionPaddingVal.textContent = collisioni.collisionPadding.toFixed(1);
  controlEls.mainBuildingCollisionPaddingVal.textContent = collisioni.mainBuildingCollisionPadding.toFixed(1);
  controlEls.cameraMinHeightVal.textContent = player.cameraMinHeight.toFixed(1);
  controlEls.walkSpeedVal.textContent = player.speedBase.toFixed(0);
  controlEls.sprintSpeedVal.textContent = player.speedSprint.toFixed(0);
  controlEls.backwardSpeedScaleVal.textContent = player.backwardSpeedScale.toFixed(2);
  controlEls.strafeSpeedScaleVal.textContent = player.strafeSpeedScale.toFixed(2);
  controlEls.diagonalSpeedScaleVal.textContent = player.diagonalSpeedScale.toFixed(2);
  controlEls.verticalSpeedVal.textContent = player.verticalSpeed.toFixed(0);
  controlEls.movementAccelVal.textContent = player.movementAcceleration.toFixed(1);
  controlEls.movementDecelVal.textContent = player.movementDeceleration.toFixed(1);
  controlEls.walkBobVal.textContent = player.walkBobAmount.toFixed(2);
  controlEls.runBobVal.textContent = player.runBobAmount.toFixed(2);
  controlEls.strafeBobScaleVal.textContent = player.strafeBobScale.toFixed(2);
  controlEls.backwardBobScaleVal.textContent = player.backwardBobScale.toFixed(2);
  controlEls.walkStepRateVal.textContent = player.walkStepRate.toFixed(2);
  controlEls.runStepRateVal.textContent = player.runStepRate.toFixed(2);
  controlEls.stepSnapVal.textContent = player.stepSnapAmount.toFixed(2);
  controlEls.movementSwayVal.textContent = player.movementSwayAmount.toFixed(2);
  controlEls.movementRollVal.textContent = player.movementRollAmount.toFixed(3);
  controlEls.strafeLeanVal.textContent = player.strafeLeanAmount.toFixed(3);
  controlEls.headMotionSmoothingVal.textContent = player.headMotionSmoothing.toFixed(1);
  controlEls.mouseSensitivityVal.textContent = player.mouseSensitivityScale.toFixed(2);
}

function applyLightControlsFromUI() {
  const ambient = Number(controlEls.ambientLight.value);
  const key = Number(controlEls.keyLight.value);
  const exposure = Number(controlEls.exposure.value);
  ambientLight.intensity = ambient;
  dirKey.intensity = key;
  renderer.toneMappingExposure = exposure;
  controlEls.ambientVal.textContent = ambient.toFixed(2);
  controlEls.keyVal.textContent = key.toFixed(2);
  controlEls.exposureVal.textContent = exposure.toFixed(2);
}

function applyHexRuntimeControlsFromUI() {
  const offset = Number(controlEls.hexOffset.value);
  const radius = Number(controlEls.hexRadius.value);
  const dropDelay = Number(controlEls.hexDropDelay.value);
  const dropSpeed = Number(controlEls.hexDropSpeed.value);
  const recovery = Number(controlEls.hexRecovery.value);
  const tileHitLight = Number(controlEls.tileHitLight.value);
  const playerTileLight = Number(controlEls.playerTileLight.value);
  applyHexRuntimeSettings({ offset, radius, dropDelay, dropSpeed, recovery, tileHitLight, playerTileLight });
  controlEls.hexOffsetVal.textContent = formatOffsetLabel(offset);
  controlEls.hexRadiusVal.textContent = radius.toFixed(1);
  controlEls.hexDropDelayVal.textContent = `${dropDelay.toFixed(0)} ms`;
  controlEls.hexDropSpeedVal.textContent = dropSpeed.toFixed(1);
  controlEls.hexRecoveryVal.textContent = recovery.toFixed(1);
  controlEls.tileHitLightVal.textContent = tileHitLight.toFixed(2);
  controlEls.playerTileLightVal.textContent = playerTileLight.toFixed(2);
}

const buildingLiveControls = createBuildingLiveControlsRuntime({
  controlEls,
  PAL,
  sceneLightResponse,
  updateBuildingMaterials,
  sideBuildingMaterials,
  bridgeMaterials,
  mainBuildingMaterials,
  getMainBuildingSaturation: () => boulevard.mainBuildingSaturation,
  setMainBuildingSaturation: (value) => {
    boulevard.mainBuildingSaturation = value;
  },
  applyBasePadMaterialRuntimeSettings,
  applyBasePadMaterialSettings,
});

function applyRoadMaterialControlsFromUI() {
  const roadNormal = Number(controlEls.roadNormal.value);
  const roadLight = Number(controlEls.roadLight.value);
  const roadReflect = Number(controlEls.roadReflect.value);
  const roadBuildingReflect = Number(controlEls.roadBuildingReflect.value);
  const roadMetalness = Number(controlEls.roadMetalness.value);
  const roadRoughness = Number(controlEls.roadRoughness.value);
  const roadHue = Number(controlEls.roadHue.value);
  const roadSat = Number(controlEls.roadSat.value);
  const roadBright = Number(controlEls.roadBright.value);
  const ambient = Number(controlEls.ambientLight.value);
  const key = Number(controlEls.keyLight.value);
  setRoadBuildingReflection(roadBuildingReflect);
  const lightResponse = sceneLightResponse(ambient, key);
  const roadLightFactor = 0.92 + roadLight * 0.95;
  hexTileDisplayBaseColor.copy(tunedColor(hexTileBaseColor, roadHue, roadSat, roadBright * roadLightFactor * lightResponse.surface));
  hexTileDisplayActiveColor.copy(tunedColor(hexTileActiveColor, roadHue, roadSat, roadBright * roadLightFactor * lightResponse.surface));
  const roadEmissive = new THREE.Color(0x061419).lerp(new THREE.Color(0x7df6ff), Math.min(1, roadLight / 1.5));
  hexTileDisplayBaseEmissive.copy(roadEmissive).multiplyScalar(lightResponse.emissive);
  hexTileDisplayHitEmissive.copy(tunedColor(new THREE.Color(0x7df6ff), roadHue, roadSat, Math.max(1, roadBright * 1.25)));
  hexTileBaseEmissiveIntensity = roadLight * 0.36 * lightResponse.emissive + lightResponse.floorFill;
  roadMat.color.set(0x000000);
  const hexInstanceGlow = 1.25 + hexTileHitLight * 1.1 + hexPlayerTileLight * 1.4 + roadLight * 0.25;
  updateRoadBoundaryHexMaterial(Number(controlEls.ledHue.value), roadLightFactor);
  updateRoadTileMaterials((material) => {
    material.color.copy(hexTileDisplayBaseColor);
    material.emissive.copy(roadEmissive);
    material.emissiveIntensity = roadLight * 0.36 * lightResponse.emissive + lightResponse.floorFill;
    material.envMap = getRoadReflectionEnvMap();
    material.envMapIntensity = roadReflect * lightResponse.reflection;
    material.metalness = roadMetalness;
    material.roughness = roadRoughness;
    material.normalScale.set(roadNormal, roadNormal);
    setHexRoadMaterialGlow(material, hexInstanceGlow, hexTileDisplayBaseColor);
  });
  controlEls.roadNormalVal.textContent = roadNormal.toFixed(2);
  controlEls.roadLightVal.textContent = roadLight.toFixed(2);
  controlEls.roadReflectVal.textContent = roadReflect.toFixed(2);
  controlEls.roadBuildingReflectVal.textContent = roadBuildingReflect.toFixed(2);
  controlEls.roadMetalnessVal.textContent = roadMetalness.toFixed(2);
  controlEls.roadRoughnessVal.textContent = roadRoughness.toFixed(2);
  controlEls.roadHueVal.textContent = roadHue.toFixed(0);
  controlEls.roadSatVal.textContent = roadSat.toFixed(2);
  controlEls.roadBrightVal.textContent = roadBright.toFixed(2);
}

function applyBuildingMaterialControlsFromUI() {
  buildingLiveControls.applyBuildingMaterialControlsFromUI();
}

function applyBasePadMaterialControlsFromUI() {
  buildingLiveControls.applyBasePadMaterialControlsFromUI();
}

function applyBoundaryErrorControlsFromUI() {
  collisioni.roadBoundaryCollisionEnabled = controlEls.roadBoundaryCollisionEnabled.value === 'on';
  collisioni.roadBoundaryCollisionMargin = Number(controlEls.roadBoundaryCollisionMargin.value);
  collisioni.roadBoundaryCameraLead = Number(controlEls.roadBoundaryCameraLead.value);
  const visualSettings = {
    roadBoundaryPulseStrength: Number(controlEls.roadBoundaryPulseStrength.value),
    boundaryErrorVisible: controlEls.boundaryErrorVisible.value === 'on',
    boundaryErrorSize: Number(controlEls.boundaryErrorSize.value),
    boundaryErrorAnchor: controlEls.boundaryErrorAnchor.value,
    boundaryErrorAnimation: Number(controlEls.boundaryErrorAnimation.value),
    boundaryErrorDuration: Number(controlEls.boundaryErrorDuration.value) / 1000,
    boundaryErrorGlitch: Number(controlEls.boundaryErrorGlitch.value),
    boundaryErrorRenderMode: controlEls.boundaryErrorRenderMode.value,
    boundaryErrorFloorLightEnabled: controlEls.boundaryErrorFloorLightEnabled.value === 'on',
    boundaryErrorFloorLightRadius: Number(controlEls.boundaryErrorFloorLightRadius.value),
    boundaryErrorFloorLightIntensity: Number(controlEls.boundaryErrorFloorLightIntensity.value),
    boundaryErrorFloorLightOpacity: Number(controlEls.boundaryErrorFloorLightOpacity.value),
    boundaryErrorFloorLightHue: Number(controlEls.boundaryErrorFloorLightHue.value),
    boundaryErrorFloorLightY: Number(controlEls.boundaryErrorFloorLightY.value),
    boundaryErrorFloorLightSoftness: Number(controlEls.boundaryErrorFloorLightSoftness.value),
  };
  applyBoundaryErrorVisualSettings(visualSettings);
  controlEls.roadBoundaryCollisionEnabledVal.textContent = collisioni.roadBoundaryCollisionEnabled ? 'on' : 'off';
  controlEls.roadBoundaryCollisionMarginVal.textContent = collisioni.roadBoundaryCollisionMargin.toFixed(1);
  controlEls.roadBoundaryCameraLeadVal.textContent = collisioni.roadBoundaryCameraLead.toFixed(1);
  controlEls.roadBoundaryPulseStrengthVal.textContent = visualSettings.roadBoundaryPulseStrength.toFixed(2);
  controlEls.boundaryErrorVisibleVal.textContent = visualSettings.boundaryErrorVisible ? 'on' : 'off';
  controlEls.boundaryErrorSizeVal.textContent = visualSettings.boundaryErrorSize.toFixed(2);
  controlEls.boundaryErrorAnchorVal.textContent = visualSettings.boundaryErrorAnchor === 'wall' ? 'muro' : 'camera';
  controlEls.boundaryErrorAnimationVal.textContent = visualSettings.boundaryErrorAnimation.toFixed(2);
  controlEls.boundaryErrorDurationVal.textContent = `${Math.round(visualSettings.boundaryErrorDuration * 1000)} ms`;
  controlEls.boundaryErrorGlitchVal.textContent = visualSettings.boundaryErrorGlitch.toFixed(2);
  controlEls.boundaryErrorRenderModeVal.textContent = visualSettings.boundaryErrorRenderMode;
  controlEls.boundaryErrorFloorLightEnabledVal.textContent = visualSettings.boundaryErrorFloorLightEnabled ? 'on' : 'off';
  controlEls.boundaryErrorFloorLightRadiusVal.textContent = visualSettings.boundaryErrorFloorLightRadius.toFixed(1);
  controlEls.boundaryErrorFloorLightIntensityVal.textContent = visualSettings.boundaryErrorFloorLightIntensity.toFixed(2);
  controlEls.boundaryErrorFloorLightOpacityVal.textContent = visualSettings.boundaryErrorFloorLightOpacity.toFixed(2);
  controlEls.boundaryErrorFloorLightHueVal.textContent = visualSettings.boundaryErrorFloorLightHue.toFixed(0);
  controlEls.boundaryErrorFloorLightYVal.textContent = visualSettings.boundaryErrorFloorLightY.toFixed(2);
  controlEls.boundaryErrorFloorLightSoftnessVal.textContent = visualSettings.boundaryErrorFloorLightSoftness.toFixed(2);
}

// Previous argument list of updateBuildingFootprints, compared field by field so
// a re-run with identical inputs costs nothing. Starts empty, so the first call
// through applyLiveControls always builds the footprints.
const lastBuildingFootprintInputs = [];

function buildingFootprintInputsChanged(...inputs) {
  if (lastBuildingFootprintInputs.length !== inputs.length) {
    lastBuildingFootprintInputs.length = 0;
    lastBuildingFootprintInputs.push(...inputs);
    return true;
  }
  let changed = false;
  for (let i = 0; i < inputs.length; i += 1) {
    if (lastBuildingFootprintInputs[i] !== inputs[i]) {
      lastBuildingFootprintInputs[i] = inputs[i];
      changed = true;
    }
  }
  return changed;
}

function applyLiveControls() {
  const offset = Number(controlEls.hexOffset.value);
  const radius = Number(controlEls.hexRadius.value);
  const dropDelay = Number(controlEls.hexDropDelay.value);
  const dropSpeed = Number(controlEls.hexDropSpeed.value);
  const recovery = Number(controlEls.hexRecovery.value);
  const tileHeight = Number(controlEls.tileHeight.value);
  const tileScale = Number(controlEls.tileScale.value);
  const hexGap = Number(controlEls.hexGap.value);
  const tileHitLight = Number(controlEls.tileHitLight.value);
  const playerTileLight = Number(controlEls.playerTileLight.value);
  const roadNormal = Number(controlEls.roadNormal.value);
  const ambient = Number(controlEls.ambientLight.value);
  const key = Number(controlEls.keyLight.value);
  const exposure = Number(controlEls.exposure.value);
  const skyChoice = controlEls.skyChoice.value;
  const skyQuality = controlEls.skyQuality.value;
  const skyBrightness = Number(controlEls.skyBrightness.value);
  const skyHue = Number(controlEls.skyHue.value);
  const skyCloudContrast = Number(controlEls.skyCloudContrast.value);
  const nextBoulevardWidthScale = Number(controlEls.boulevardWidthScale.value);
  const roadLight = Number(controlEls.roadLight.value);
  const roadReflect = Number(controlEls.roadReflect.value);
  const roadBuildingReflect = Number(controlEls.roadBuildingReflect.value);
  const roadMetalness = Number(controlEls.roadMetalness.value);
  const roadRoughness = Number(controlEls.roadRoughness.value);
  const roadHue = Number(controlEls.roadHue.value);
  const roadSat = Number(controlEls.roadSat.value);
  const roadBright = Number(controlEls.roadBright.value);
  const nextRoadBoundaryHexEnabled = controlEls.roadBoundaryHexEnabled.value === 'on';
  const nextRoadBoundaryHexRows = Number(controlEls.roadBoundaryHexRows.value);
  const nextRoadSideHexExtraRows = Number(controlEls.roadSideHexExtraRows.value);
  const nextRoadBoundaryHexBrightness = Number(controlEls.roadBoundaryHexBrightness.value);
  const nextRoadBoundaryHexOpacity = Number(controlEls.roadBoundaryHexOpacity.value);
  const nextRoadBoundaryHexY = Number(controlEls.roadBoundaryHexY.value);
  const nextRoadBoundaryHexRowOffsets = controlEls.roadBoundaryRowY.map((input) => Number(input?.value ?? 0));
  const nextRoadBoundaryHexOutset = Number(controlEls.roadBoundaryHexOutset.value);
  const nextRoadBoundaryCollisionEnabled = controlEls.roadBoundaryCollisionEnabled.value === 'on';
  const nextRoadBoundaryCollisionMargin = Number(controlEls.roadBoundaryCollisionMargin.value);
  const nextRoadBoundaryCameraLead = Number(controlEls.roadBoundaryCameraLead.value);
  const nextRoadBoundaryPulseStrength = Number(controlEls.roadBoundaryPulseStrength.value);
  const nextBoundaryErrorVisible = controlEls.boundaryErrorVisible.value === 'on';
  const nextBoundaryErrorSize = Number(controlEls.boundaryErrorSize.value);
  const nextBoundaryErrorAnchor = controlEls.boundaryErrorAnchor.value;
  const nextBoundaryErrorAnimation = Number(controlEls.boundaryErrorAnimation.value);
  const nextBoundaryErrorDuration = Number(controlEls.boundaryErrorDuration.value) / 1000;
  const nextBoundaryErrorGlitch = Number(controlEls.boundaryErrorGlitch.value);
  const nextBoundaryErrorRenderMode = controlEls.boundaryErrorRenderMode.value;
  const nextBoundaryErrorFloorLightEnabled = controlEls.boundaryErrorFloorLightEnabled.value === 'on';
  const nextBoundaryErrorFloorLightRadius = Number(controlEls.boundaryErrorFloorLightRadius.value);
  const nextBoundaryErrorFloorLightIntensity = Number(controlEls.boundaryErrorFloorLightIntensity.value);
  const nextBoundaryErrorFloorLightOpacity = Number(controlEls.boundaryErrorFloorLightOpacity.value);
  const nextBoundaryErrorFloorLightHue = Number(controlEls.boundaryErrorFloorLightHue.value);
  const nextBoundaryErrorFloorLightY = Number(controlEls.boundaryErrorFloorLightY.value);
  const nextBoundaryErrorFloorLightSoftness = Number(controlEls.boundaryErrorFloorLightSoftness.value);
  const nextStreetEdgeWidth = 0;
  const nextCrossRoadWidth = 0;
  const nextCrossStreetEdgeWidth = 0;
  const ledBrightness = Number(controlEls.ledBrightness.value);
  const ledThickness = Number(controlEls.ledThickness.value);
  const nextLedDistance = Number(controlEls.ledDistance.value);
  const nextBuildingHorizontalLedDistance = Number(controlEls.buildingHorizontalLedDistance.value);
  const nextBuildingHorizontalLedThickness = Number(controlEls.buildingHorizontalLedThickness.value);
  const nextBuildingHorizontalLedRadius = Number(controlEls.buildingHorizontalLedRadius.value);
  const ledHue = Number(controlEls.ledHue.value);
  const basePadLedBrightness = Number(controlEls.basePadLedBrightness.value);
  const basePadLedThickness = Number(controlEls.basePadLedThickness.value);
  const basePadLedOffset = Number(controlEls.basePadLedOffset.value);
  const basePadLedHue = Number(controlEls.basePadLedHue.value);
  const nextBasePadGlobalY = Number(controlEls.basePadGlobalY.value);
  const nextBasePadCurbEnabled = controlEls.basePadCurbEnabled.value === 'on';
  const nextBasePadCurbWidth = Number(controlEls.basePadCurbWidth.value);
  const nextBasePadInnerRaise = Number(controlEls.basePadInnerRaise.value);
  const nextBasePadCurbSlope = Number(controlEls.basePadCurbSlope.value);
  const nextBasePadCurbRadius = Number(controlEls.basePadCurbRadius.value);
  const nextBasePadTextureMode = controlEls.basePadTextureMode.value;
  const nextBasePadTextureRepeat = Number(controlEls.basePadTextureRepeat.value);
  const nextBasePadTextureRotation = Number(controlEls.basePadTextureRotation.value);
  const nextBasePadNormalStrength = Number(controlEls.basePadNormal.value);
  const nextBasePadHue = Number(controlEls.basePadHue.value);
  const nextBasePadSaturation = Number(controlEls.basePadSat.value);
  const nextBasePadBrightness = Number(controlEls.basePadBright.value);
  const nextBasePadMetalness = Number(controlEls.basePadMetalness.value);
  const nextBasePadRoughness = Number(controlEls.basePadRoughness.value);
  const nextBasePadReflect = Number(controlEls.basePadReflect.value);
  const nextBasePadEmissive = Number(controlEls.basePadEmissive.value);
  const nextBasePadBevelSize = Number(controlEls.basePadBevelSize.value);
  const nextBasePadBevelSegments = Number(controlEls.basePadBevelSegments.value);
  const nextBasePadFlatShading = controlEls.basePadFlatShading.value === 'on';
  const nextBasePadBorderOpacity = Number(controlEls.basePadBorderOpacity.value);
  const nextBasePadBorderBrightness = Number(controlEls.basePadBorderBright.value);
  const buildingLowLedOffset = Number(controlEls.buildingLowLedOffset.value);
  const buildingHighLedOffset = Number(controlEls.buildingHighLedOffset.value);
  const nextBuildingVerticalLedLength = Number(controlEls.buildingVerticalLedLength.value);
  const nextBuildingVerticalLedY = Number(controlEls.buildingVerticalLedY.value);
  const nextBuildingLowLedY = Number(controlEls.buildingLowLedY.value);
  const nextBuildingHighLedY = Number(controlEls.buildingHighLedY.value);
  const nextBuildingFacadeLedNormal = Number(controlEls.buildingFacadeLedNormal.value);
  const nextBuildingFacadeLedX = Number(controlEls.buildingFacadeLedX.value);
  const nextBuildingFacadeLedY = Number(controlEls.buildingFacadeLedY.value);
  const nextBuildingFacadeLedZ = Number(controlEls.buildingFacadeLedZ.value);
  const nextSideFacadeSegmentOffsets = (controlEls.buildingFacadeLedSegmentControls || []).map((controls) => ({
    u: Number(controls.u.value),
    y: Number(controls.y.value),
    normal: Number(controls.normal.value),
  }));
  const nextBridgeXOffset = Number(controlEls.bridgeXOffset.value);
  const nextBridgeZOffset = Number(controlEls.bridgeZOffset.value);
  const nextBridgeYOffset = Number(controlEls.bridgeYOffset.value);
  const nextBridgeSpanScale = Number(controlEls.bridgeSpanScale.value);
  const nextBridgeHeightScale = Number(controlEls.bridgeHeightScale.value);
  const nextBridgeDepthScale = Number(controlEls.bridgeDepthScale.value);
  const bridgeLowLedOffset = Number(controlEls.bridgeLowLedOffset.value);
  const bridgeHighLedOffset = Number(controlEls.bridgeHighLedOffset.value);
  const roadEdgeBrightness = 0;
  const medianBrightness = 0;
  const nextCollisionPadding = Number(controlEls.collisionPadding.value);
  const nextMainBuildingCollisionPadding = Number(controlEls.mainBuildingCollisionPadding.value);
  const nextCameraMinHeight = Number(controlEls.cameraMinHeight.value);
  const nextWalkSpeed = Number(controlEls.walkSpeed.value);
  const nextSprintSpeed = Number(controlEls.sprintSpeed.value);
  const nextBackwardSpeedScale = Number(controlEls.backwardSpeedScale.value);
  const nextStrafeSpeedScale = Number(controlEls.strafeSpeedScale.value);
  const nextDiagonalSpeedScale = Number(controlEls.diagonalSpeedScale.value);
  const nextVerticalSpeed = Number(controlEls.verticalSpeed.value);
  const nextMovementAccel = Number(controlEls.movementAccel.value);
  const nextMovementDecel = Number(controlEls.movementDecel.value);
  const nextWalkBob = Number(controlEls.walkBob.value);
  const nextRunBob = Number(controlEls.runBob.value);
  const nextStrafeBobScale = Number(controlEls.strafeBobScale.value);
  const nextBackwardBobScale = Number(controlEls.backwardBobScale.value);
  const nextWalkStepRate = Number(controlEls.walkStepRate.value);
  const nextRunStepRate = Number(controlEls.runStepRate.value);
  const nextStepSnap = Number(controlEls.stepSnap.value);
  const nextMovementSway = Number(controlEls.movementSway.value);
  const nextMovementRoll = Number(controlEls.movementRoll.value);
  const nextStrafeLean = Number(controlEls.strafeLean.value);
  const nextHeadMotionSmoothing = Number(controlEls.headMotionSmoothing.value);
  const nextMouseSensitivity = Number(controlEls.mouseSensitivity.value);
  const sideBuildingBrightness = Number(controlEls.sideBuildingBrightness.value);
  const sideBuildingHue = Number(controlEls.sideBuildingHue.value);
  const sideBuildingMetalness = Number(controlEls.sideBuildingMetalness.value);
  const sideBuildingRoughness = Number(controlEls.sideBuildingRoughness.value);
  const sideBuildingReflect = Number(controlEls.sideBuildingReflect.value);
  const sideBuildingEmissive = Number(controlEls.sideBuildingEmissive.value);
  const nextSideBuildingWidthScale = Number(controlEls.sideBuildingWidthScale.value);
  const nextSideBuildingDepthScale = Number(controlEls.sideBuildingDepthScale.value);
  const requestedSideBuildingSpacingScale = Number(controlEls.sideBuildingSpacingScale.value);
  const nextSideBuildingSpacingScale = safeSideBuildingSpacingScale(requestedSideBuildingSpacingScale, nextSideBuildingDepthScale);
  if (Math.abs(nextSideBuildingSpacingScale - requestedSideBuildingSpacingScale) > 0.001) {
    controlEls.sideBuildingSpacingScale.value = nextSideBuildingSpacingScale.toFixed(2);
  }
  const sideBuildingScale = Number(controlEls.sideBuildingScale.value);
  const nextSideBuildingBasePadScale = Number(controlEls.sideBuildingBasePadScale.value);
  const nextSideBuildingBasePadXScale = Number(controlEls.sideBuildingBasePadXScale.value);
  const nextSideBuildingBasePadY = Number(controlEls.sideBuildingBasePadY.value);
  const nextSideBuildingBasePadThickness = Number(controlEls.sideBuildingBasePadThickness.value);
  const nextSideBuildingBasePadCut = Number(controlEls.sideBuildingBasePadCut.value);
  const nextSideBuildingBasePadRadius = Number(controlEls.sideBuildingBasePadRadius.value);
  const mainBuildingBrightness = Number(controlEls.mainBuildingBrightness.value);
  const mainBuildingHue = Number(controlEls.mainBuildingHue.value);
  const nextMainBuildingSaturation = Number(controlEls.mainBuildingSaturation.value);
  const mainBuildingMetalness = Number(controlEls.mainBuildingMetalness.value);
  const mainBuildingRoughness = Number(controlEls.mainBuildingRoughness.value);
  const mainBuildingReflect = Number(controlEls.mainBuildingReflect.value);
  const mainBuildingEmissive = Number(controlEls.mainBuildingEmissive.value);
  const nextMainBuildingWidthScale = Number(controlEls.mainBuildingWidthScale.value);
  const nextMainBuildingDepthScale = Number(controlEls.mainBuildingDepthScale.value);
  const nextMainBuildingZ = Number(controlEls.mainBuildingZ.value);
  const nextMainBuildingY = Number(controlEls.mainBuildingY.value);
  const mainBuildingScale = Number(controlEls.mainBuildingScale.value);
  const nextMainBuildingBasePadScale = Number(controlEls.mainBuildingBasePadScale.value);
  const nextMainBuildingBasePadXScale = Number(controlEls.mainBuildingBasePadXScale.value);
  const nextMainBuildingBasePadZScale = Number(controlEls.mainBuildingBasePadZScale.value);
  const nextMainBuildingBasePadY = Number(controlEls.mainBuildingBasePadY.value);
  const nextMainBuildingBasePadThickness = Number(controlEls.mainBuildingBasePadThickness.value);
  const nextMainBuildingBasePadCut = Number(controlEls.mainBuildingBasePadCut.value);
  const nextMainBuildingBasePadRadius = Number(controlEls.mainBuildingBasePadRadius.value);
  const mainBuildingLedBrightness = Number(controlEls.mainLedBrightnessUi.value);
  const mainBuildingLedThickness = Number(controlEls.mainLedThicknessUi.value);
  const mainBuildingLedDistance = Number(controlEls.mainLedVerticalDistanceUi.value);
  const nextMainBuildingHorizontalLedDistance = Number(controlEls.mainLedHorizontalDistanceUi.value);
  const nextMainBuildingHorizontalLedThickness = Number(controlEls.mainLedHorizontalThicknessUi.value);
  const nextMainBuildingHorizontalLedRadius = Number(controlEls.mainLedHorizontalRadiusUi.value);
  const mainBuildingLedHue = Number(controlEls.mainLedHueUi.value);
  const mainBuildingLowLedOffset = Number(controlEls.mainLedLowOffsetUi.value);
  const mainBuildingHighLedOffset = Number(controlEls.mainLedHighOffsetUi.value);
  const nextMainBuildingVerticalLedLength = Number(controlEls.mainLedVerticalLengthUi.value);
  const nextMainBuildingVerticalLedY = Number(controlEls.mainLedVerticalYUi.value);
  const nextMainBuildingLowLedY = Number(controlEls.mainLedLowYUi.value);
  const nextMainBuildingHighLedY = Number(controlEls.mainLedHighYUi.value);
  const nextMainBuildingFacadeLedBrightness = Number(controlEls.mainFacadeLedBrightnessUi.value);
  const nextMainBuildingFacadeLedNormal = Number(controlEls.mainFacadeLedNormalUi.value);
  const nextMainBuildingFacadeLedX = Number(controlEls.mainFacadeLedXUi.value);
  const nextMainBuildingFacadeLedY = Number(controlEls.mainFacadeLedYUi.value);
  const nextMainBuildingFacadeLedZ = Number(controlEls.mainFacadeLedZUi.value);
  const nextMainBuildingFacadeLedThickness = Number(controlEls.mainFacadeLedThicknessUi.value);
  const nextMainFacadeSegmentOffsets = controlEls.mainFacadeLedSegmentControls.map((controls) => ({
    u: Number(controls.u.value),
    y: Number(controls.y.value),
    normal: Number(controls.normal.value),
  }));
  const nextPerformanceMode = controlEls.performanceMode.value;
  const nextRenderResolution = Number(controlEls.renderResolution.value);
  const nextAntialiasMode = controlEls.aaMode.value;
  const nextBloomEnabled = controlEls.bloomEnabled.value;
  const bloomStrength = Number(controlEls.bloomStrength.value);
  const bloomRadius = Number(controlEls.bloomRadius.value);
  const bloomThreshold = Number(controlEls.bloomThreshold.value);
  const bloomQuality = Number(controlEls.bloomQuality.value);
  const pixelRatio = Math.min(Number(controlEls.pixelRatio.value) || MAX_RENDER_PIXEL_RATIO, MAX_RENDER_PIXEL_RATIO);
  controlEls.pixelRatio.value = pixelRatio.toFixed(2);
  const previousPerformanceMode = post.performanceMode;

  applyHexRuntimeSettings({ offset, radius, dropDelay, dropSpeed, recovery, tileHitLight, playerTileLight });
  setHexTileHeightScale(tileHeight);
  setHexTileScale(tileScale);
  setHexTileGap(hexGap);
  setRoadBuildingReflection(roadBuildingReflect);
  boulevard.sideBuildingWidthScale = nextSideBuildingWidthScale;
  boulevard.sideBuildingDepthScale = nextSideBuildingDepthScale;
  boulevard.sideBuildingSpacingScale = nextSideBuildingSpacingScale;
  boulevard.mainBuildingWidthScale = nextMainBuildingWidthScale;
  boulevard.mainBuildingDepthScale = nextMainBuildingDepthScale;
  boulevard.mainBuildingZ = nextMainBuildingZ;
  boulevard.mainBuildingY = nextMainBuildingY;
  boulevard.mainBuildingSaturation = nextMainBuildingSaturation;
  setFacadeLedRuntimeSettings({
    side: {
      normal: nextBuildingFacadeLedNormal,
      x: nextBuildingFacadeLedX,
      y: nextBuildingFacadeLedY,
      z: nextBuildingFacadeLedZ,
      segments: nextSideFacadeSegmentOffsets,
    },
    main: {
      brightness: nextMainBuildingFacadeLedBrightness,
      normal: nextMainBuildingFacadeLedNormal,
      x: nextMainBuildingFacadeLedX,
      y: nextMainBuildingFacadeLedY,
      z: nextMainBuildingFacadeLedZ,
      thickness: nextMainBuildingFacadeLedThickness,
      segments: nextMainFacadeSegmentOffsets,
    },
  });
  applyBasePadRuntimeSettings({
    globalY: nextBasePadGlobalY,
    curbEnabled: nextBasePadCurbEnabled,
    curbWidth: nextBasePadCurbWidth,
    innerRaise: nextBasePadInnerRaise,
    curbSlope: nextBasePadCurbSlope,
    curbRadius: nextBasePadCurbRadius,
    textureMode: nextBasePadTextureMode,
    textureRepeat: nextBasePadTextureRepeat,
    textureRotation: nextBasePadTextureRotation,
    normalStrength: nextBasePadNormalStrength,
    hue: nextBasePadHue,
    saturation: nextBasePadSaturation,
    brightness: nextBasePadBrightness,
    metalness: nextBasePadMetalness,
    roughness: nextBasePadRoughness,
    reflect: nextBasePadReflect,
    emissive: nextBasePadEmissive,
    bevelSize: nextBasePadBevelSize,
    bevelSegments: nextBasePadBevelSegments,
    flatShading: nextBasePadFlatShading,
    borderOpacity: nextBasePadBorderOpacity,
    borderBrightness: nextBasePadBorderBrightness,
  });
  boulevard.sideBuildingBasePadScale = nextSideBuildingBasePadScale;
  boulevard.sideBuildingBasePadXScale = nextSideBuildingBasePadXScale;
  boulevard.sideBuildingBasePadY = nextSideBuildingBasePadY;
  boulevard.sideBuildingBasePadThickness = nextSideBuildingBasePadThickness;
  boulevard.sideBuildingBasePadCut = nextSideBuildingBasePadCut;
  boulevard.sideBuildingBasePadRadius = nextSideBuildingBasePadRadius;
  boulevard.mainBuildingBasePadScale = nextMainBuildingBasePadScale;
  boulevard.mainBuildingBasePadXScale = nextMainBuildingBasePadXScale;
  boulevard.mainBuildingBasePadZScale = nextMainBuildingBasePadZScale;
  boulevard.mainBuildingBasePadY = nextMainBuildingBasePadY;
  boulevard.mainBuildingBasePadThickness = nextMainBuildingBasePadThickness;
  boulevard.mainBuildingBasePadCut = nextMainBuildingBasePadCut;
  boulevard.mainBuildingBasePadRadius = nextMainBuildingBasePadRadius;
  applyRoadBoundaryHexVisualSettings({
    roadBoundaryHexEnabled: nextRoadBoundaryHexEnabled,
    roadBoundaryHexRows: nextRoadBoundaryHexRows,
    roadBoundaryHexFillBrightness: nextRoadBoundaryHexBrightness,
    roadBoundaryHexAlpha: nextRoadBoundaryHexOpacity,
    roadBoundaryHexY: nextRoadBoundaryHexY,
    roadBoundaryHexOutsetScale: nextRoadBoundaryHexOutset,
  });
  boulevard.roadSideHexExtraRows = nextRoadSideHexExtraRows;
  nextRoadBoundaryHexRowOffsets.forEach((value, index) => {
    roadBoundaryHexRowOffsets[index] = value;
  });
  collisioni.roadBoundaryCollisionEnabled = nextRoadBoundaryCollisionEnabled;
  collisioni.roadBoundaryCollisionMargin = nextRoadBoundaryCollisionMargin;
  collisioni.roadBoundaryCameraLead = nextRoadBoundaryCameraLead;
  applyBoundaryErrorVisualSettings({
    roadBoundaryPulseStrength: nextRoadBoundaryPulseStrength,
    boundaryErrorVisible: nextBoundaryErrorVisible,
    boundaryErrorSize: nextBoundaryErrorSize,
    boundaryErrorAnchor: nextBoundaryErrorAnchor,
    boundaryErrorAnimation: nextBoundaryErrorAnimation,
    boundaryErrorDuration: nextBoundaryErrorDuration,
    boundaryErrorGlitch: nextBoundaryErrorGlitch,
    boundaryErrorRenderMode: nextBoundaryErrorRenderMode,
    boundaryErrorFloorLightEnabled: nextBoundaryErrorFloorLightEnabled,
    boundaryErrorFloorLightRadius: nextBoundaryErrorFloorLightRadius,
    boundaryErrorFloorLightIntensity: nextBoundaryErrorFloorLightIntensity,
    boundaryErrorFloorLightOpacity: nextBoundaryErrorFloorLightOpacity,
    boundaryErrorFloorLightHue: nextBoundaryErrorFloorLightHue,
    boundaryErrorFloorLightY: nextBoundaryErrorFloorLightY,
    boundaryErrorFloorLightSoftness: nextBoundaryErrorFloorLightSoftness,
  });
  boulevard.boulevardWidthScale = nextBoulevardWidthScale;
  boulevard.crossRoadWidth = nextCrossRoadWidth;
  boulevard.crossStreetEdgeWidth = nextCrossStreetEdgeWidth;
  updateRoadSurfaceWidth(roadSurfaceWidthForBuildings(
    nextSideBuildingWidthScale,
    nextMainBuildingWidthScale,
    nextStreetEdgeWidth,
    nextBoulevardWidthScale,
    nextSideBuildingDepthScale,
    nextSideBuildingBasePadScale,
    nextSideBuildingBasePadXScale,
    nextMainBuildingDepthScale,
    nextMainBuildingBasePadScale,
    nextMainBuildingBasePadXScale,
    nextRoadSideHexExtraRows
  ));
  const roadBounds = computeDynamicRoadBounds(nextSideBuildingSpacingScale, nextSideBuildingDepthScale, nextMainBuildingDepthScale);
  updateMainRoadLength(roadBounds.center, roadBounds.length);
  updateHexTileLayout();
  updateRoadBoundaryHexRows();
  updateRoadBoundaryPulseLayout();
  updateStreetEdgeLayout(nextStreetEdgeWidth);
  updateBuildingStreetEdgeBlocks(nextSideBuildingSpacingScale, nextStreetEdgeWidth, nextSideBuildingDepthScale);
  updateMainBuildingStreetEdgeBlock(nextMainBuildingWidthScale, nextMainBuildingDepthScale, nextMainBuildingZ, nextStreetEdgeWidth);
  updateSideRoadLayout(nextSideBuildingSpacingScale, nextStreetEdgeWidth);
  updateLongitudinalRoadEdges(nextSideBuildingSpacingScale);
  updateStreetEdgeHexTileScale();
  collisioni.collisionPadding = nextCollisionPadding;
  collisioni.mainBuildingCollisionPadding = nextMainBuildingCollisionPadding;
  player.cameraMinHeight = nextCameraMinHeight;
  player.speedBase = nextWalkSpeed;
  player.speedSprint = nextSprintSpeed;
  player.backwardSpeedScale = nextBackwardSpeedScale;
  player.strafeSpeedScale = nextStrafeSpeedScale;
  player.diagonalSpeedScale = nextDiagonalSpeedScale;
  player.verticalSpeed = nextVerticalSpeed;
  player.movementAcceleration = nextMovementAccel;
  player.movementDeceleration = nextMovementDecel;
  player.walkBobAmount = nextWalkBob;
  player.runBobAmount = nextRunBob;
  player.strafeBobScale = nextStrafeBobScale;
  player.backwardBobScale = nextBackwardBobScale;
  player.walkStepRate = nextWalkStepRate;
  player.runStepRate = nextRunStepRate;
  player.stepSnapAmount = nextStepSnap;
  player.movementSwayAmount = nextMovementSway;
  player.movementRollAmount = nextMovementRoll;
  player.strafeLeanAmount = nextStrafeLean;
  player.headMotionSmoothing = nextHeadMotionSmoothing;
  player.mouseSensitivityScale = nextMouseSensitivity;

  ambientLight.intensity = ambient;
  dirKey.intensity = key;
  renderer.toneMappingExposure = exposure;
  applySkyPreset(skyChoice, skyBrightness, skyHue, skyQuality);
  applyStormControlsFromUI();
  domeMat.uniforms.uCloudContrast.value = skyCloudContrast;
  setFixedCameraFov();
  post.performanceMode = nextPerformanceMode;
  post.manualRenderScale = nextRenderResolution;
  post.requestedBloomResolutionScale = bloomQuality;
  post.requestedPixelRatio = pixelRatio;
  applyFsrUpscaleControlsFromUI();
  applyAntialiasControls(nextAntialiasMode);
  applyBloomEnabled(nextBloomEnabled);
  if (post.performanceMode !== previousPerformanceMode || post.performanceMode === 'quality') {
    post.dynamicQualityScale = 1;
    post.performanceAdjustCooldown = 0;
  }
  applyRenderResolution(post.requestedPixelRatio);

  const lightResponse = sceneLightResponse(ambient, key);
  const roadLightFactor = 0.92 + roadLight * 0.95;
  applyBasePadMaterialSettings(lightResponse);
  hexTileDisplayBaseColor.copy(tunedColor(hexTileBaseColor, roadHue, roadSat, roadBright * roadLightFactor * lightResponse.surface));
  hexTileDisplayActiveColor.copy(tunedColor(hexTileActiveColor, roadHue, roadSat, roadBright * roadLightFactor * lightResponse.surface));
  const roadEmissive = new THREE.Color(0x061419).lerp(new THREE.Color(0x7df6ff), Math.min(1, roadLight / 1.5));
  hexTileDisplayBaseEmissive.copy(roadEmissive).multiplyScalar(lightResponse.emissive);
  hexTileDisplayHitEmissive.copy(tunedColor(new THREE.Color(0x7df6ff), roadHue, roadSat, Math.max(1, roadBright * 1.25)));
  hexTileBaseEmissiveIntensity = roadLight * 0.36 * lightResponse.emissive + lightResponse.floorFill;

  roadMat.color.set(0x000000);

  const hexInstanceGlow = 1.25 + tileHitLight * 1.1 + playerTileLight * 1.4 + roadLight * 0.25;
  updateRoadBoundaryHexMaterial(ledHue, roadLightFactor);
  updateRoadTileMaterials((material) => {
    material.color.copy(hexTileDisplayBaseColor);
    material.emissive.copy(roadEmissive);
    material.emissiveIntensity = roadLight * 0.36 * lightResponse.emissive + lightResponse.floorFill;
    material.envMap = getRoadReflectionEnvMap();
    material.envMapIntensity = roadReflect * lightResponse.reflection;
    material.metalness = roadMetalness;
    material.roughness = roadRoughness;
    material.normalScale.set(roadNormal, roadNormal);
    setHexRoadMaterialGlow(material, hexInstanceGlow, hexTileDisplayBaseColor);
  });

  bridges.updateLinks(nextSideBuildingWidthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth, nextBridgeXOffset, nextBridgeZOffset, nextBridgeYOffset, nextBridgeSpanScale, nextBridgeHeightScale, nextBridgeDepthScale);
  updateEdgeStrips(ledBrightness, ledThickness, nextLedDistance, ledHue, mainBuildingLedBrightness, mainBuildingLedThickness, mainBuildingLedDistance, mainBuildingLedHue, nextBuildingHorizontalLedDistance, nextMainBuildingHorizontalLedDistance, nextBuildingHorizontalLedThickness, nextMainBuildingHorizontalLedThickness, nextBuildingHorizontalLedRadius, nextMainBuildingHorizontalLedRadius, buildingLowLedOffset, buildingHighLedOffset, bridgeLowLedOffset, bridgeHighLedOffset, mainBuildingLowLedOffset, mainBuildingHighLedOffset, nextBuildingVerticalLedLength, nextMainBuildingVerticalLedLength, nextBuildingVerticalLedY, nextBuildingLowLedY, nextBuildingHighLedY, nextMainBuildingVerticalLedY, nextMainBuildingLowLedY, nextMainBuildingHighLedY, sideBuildingScale, mainBuildingScale, nextSideBuildingWidthScale, nextSideBuildingDepthScale, nextMainBuildingWidthScale, nextMainBuildingDepthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth, tunedColor);
  updateSideBuildingDoorMaterials(ledBrightness, ledHue);
  updateGroundLedMaterials(roadEdgeBrightness, medianBrightness, ledHue);
  updateBuildingMaterials(sideBuildingMaterials, PAL.buildingSkin, sideBuildingBrightness, sideBuildingHue, sideBuildingMetalness, sideBuildingRoughness, sideBuildingReflect, sideBuildingEmissive, lightResponse);
  updateBuildingMaterials(bridgeMaterials, PAL.buildingSkin, sideBuildingBrightness, sideBuildingHue, sideBuildingMetalness, sideBuildingRoughness, sideBuildingReflect, sideBuildingEmissive, lightResponse);
  updateBuildingMaterials(mainBuildingMaterials, PAL.mainSkin, mainBuildingBrightness, mainBuildingHue, mainBuildingMetalness, mainBuildingRoughness, mainBuildingReflect, mainBuildingEmissive, lightResponse, nextMainBuildingSaturation);
  // updateBuildingFootprints rebuilds every base pad from scratch — a dispose +
  // new ExtrudeGeometry (bevelled, with recomputed normals) per pad, up to five
  // per building across 13 buildings. applyLiveControls re-runs once per animation
  // frame for as long as ANY unscoped slider is held down, so without this guard a
  // drag on, say, the ambient light rebuilt the whole city's base pad geometry 60
  // times a second. Skip the rebuild unless one of its own inputs actually moved.
  // Besides its arguments the rebuild also reads module state set earlier in this
  // function: roadHalf() (boulevard width), the base pad runtime settings (global
  // Y and the curb parameters) and the hex tile height/scale (road top Y, hit
  // half-size). Those go into the comparison too, or a drag on one of them
  // would leave the pads where they were.
  if (buildingFootprintInputsChanged(
    nextSideBuildingWidthScale, nextSideBuildingDepthScale, nextMainBuildingWidthScale,
    nextMainBuildingDepthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth,
    nextMainBuildingZ, nextMainBuildingY,
    boulevard.sideBuildingBasePadScale, boulevard.sideBuildingBasePadXScale, boulevard.sideBuildingBasePadY,
    boulevard.sideBuildingBasePadThickness, boulevard.sideBuildingBasePadCut, boulevard.sideBuildingBasePadRadius,
    boulevard.mainBuildingBasePadScale, boulevard.mainBuildingBasePadXScale, boulevard.mainBuildingBasePadZScale,
    boulevard.mainBuildingBasePadY, boulevard.mainBuildingBasePadThickness, boulevard.mainBuildingBasePadCut,
    boulevard.mainBuildingBasePadRadius,
    nextBoulevardWidthScale,
    nextBasePadGlobalY, nextBasePadCurbEnabled, nextBasePadCurbWidth,
    nextBasePadInnerRaise, nextBasePadCurbSlope, nextBasePadCurbRadius,
    tileHeight, tileScale,
  )) {
    updateBuildingFootprints(nextSideBuildingWidthScale, nextSideBuildingDepthScale, nextMainBuildingWidthScale, nextMainBuildingDepthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth, nextMainBuildingZ, nextMainBuildingY, {
      sideBuildingBasePadScale: boulevard.sideBuildingBasePadScale,
      sideBuildingBasePadXScale: boulevard.sideBuildingBasePadXScale,
      sideBuildingBasePadY: boulevard.sideBuildingBasePadY,
      sideBuildingBasePadThickness: boulevard.sideBuildingBasePadThickness,
      sideBuildingBasePadCut: boulevard.sideBuildingBasePadCut,
      sideBuildingBasePadRadius: boulevard.sideBuildingBasePadRadius,
      mainBuildingBasePadScale: boulevard.mainBuildingBasePadScale,
      mainBuildingBasePadXScale: boulevard.mainBuildingBasePadXScale,
      mainBuildingBasePadZScale: boulevard.mainBuildingBasePadZScale,
      mainBuildingBasePadY: boulevard.mainBuildingBasePadY,
      mainBuildingBasePadThickness: boulevard.mainBuildingBasePadThickness,
      mainBuildingBasePadCut: boulevard.mainBuildingBasePadCut,
      mainBuildingBasePadRadius: boulevard.mainBuildingBasePadRadius,
    });
    invalidateMainFacadeVerticalRevealLedBounds();
  }
  updateBasePadLedStrips(basePadLedBrightness, basePadLedThickness, basePadLedOffset, basePadLedHue);
  updateBuildingScale(sideBuildingMeshes, sideBuildingColliders, sideBuildingScale);
  updateBuildingScale(mainBuildingMeshes, mainBuildingColliders, mainBuildingScale);
  updateBasePadHexInfluence();
  refreshRoadTileInstances();

  if (post.bloomPass) {
    post.bloomPass.enabled = post.bloomEnabled;
    post.bloomPass.strength = bloomStrength;
    post.bloomPass.radius = bloomRadius;
    post.bloomPass.threshold = bloomThreshold;
    invalidateBloomTemporalCache();
  }

  controlEls.hexOffsetVal.textContent = formatOffsetLabel(offset);
  controlEls.hexRadiusVal.textContent = radius.toFixed(1);
  controlEls.hexDropDelayVal.textContent = `${dropDelay.toFixed(0)} ms`;
  controlEls.hexDropSpeedVal.textContent = dropSpeed.toFixed(1);
  controlEls.hexRecoveryVal.textContent = recovery.toFixed(1);
  controlEls.tileHeightVal.textContent = tileHeight.toFixed(2);
  controlEls.tileScaleVal.textContent = tileScale.toFixed(2);
  controlEls.hexGapVal.textContent = hexGap.toFixed(2);
  controlEls.tileHitLightVal.textContent = tileHitLight.toFixed(2);
  controlEls.playerTileLightVal.textContent = playerTileLight.toFixed(2);
  controlEls.roadNormalVal.textContent = roadNormal.toFixed(2);
  controlEls.ambientVal.textContent = ambient.toFixed(2);
  controlEls.keyVal.textContent = key.toFixed(2);
  controlEls.exposureVal.textContent = exposure.toFixed(2);
  controlEls.skyBrightnessVal.textContent = skyBrightness.toFixed(2);
  controlEls.skyHueVal.textContent = skyHue.toFixed(0);
  controlEls.skyCloudContrastVal.textContent = skyCloudContrast.toFixed(2);
  controlEls.boulevardWidthScaleVal.textContent = `${nextBoulevardWidthScale.toFixed(2)}x`;
  controlEls.roadLightVal.textContent = roadLight.toFixed(2);
  controlEls.roadReflectVal.textContent = roadReflect.toFixed(2);
  controlEls.roadBuildingReflectVal.textContent = roadBuildingReflect.toFixed(2);
  controlEls.roadMetalnessVal.textContent = roadMetalness.toFixed(2);
  controlEls.roadRoughnessVal.textContent = roadRoughness.toFixed(2);
  controlEls.roadHueVal.textContent = roadHue.toFixed(0);
  controlEls.roadSatVal.textContent = roadSat.toFixed(2);
  controlEls.roadBrightVal.textContent = roadBright.toFixed(2);
  controlEls.roadBoundaryHexEnabledVal.textContent = nextRoadBoundaryHexEnabled ? 'on' : 'off';
  controlEls.roadBoundaryHexRowsVal.textContent = nextRoadBoundaryHexRows.toFixed(0);
  controlEls.roadSideHexExtraRowsVal.textContent = `${nextRoadSideHexExtraRows.toFixed(0)} file`;
  controlEls.roadBoundaryHexBrightnessVal.textContent = nextRoadBoundaryHexBrightness.toFixed(2);
  controlEls.roadBoundaryHexOpacityVal.textContent = nextRoadBoundaryHexOpacity.toFixed(2);
  controlEls.roadBoundaryHexYVal.textContent = nextRoadBoundaryHexY.toFixed(2);
  controlEls.roadBoundaryRowYVal.forEach((output, index) => {
    if (output) output.textContent = nextRoadBoundaryHexRowOffsets[index].toFixed(2);
  });
  controlEls.roadBoundaryHexOutsetVal.textContent = nextRoadBoundaryHexOutset.toFixed(2);
  controlEls.roadBoundaryCollisionEnabledVal.textContent = nextRoadBoundaryCollisionEnabled ? 'on' : 'off';
  controlEls.roadBoundaryCollisionMarginVal.textContent = nextRoadBoundaryCollisionMargin.toFixed(1);
  controlEls.roadBoundaryCameraLeadVal.textContent = nextRoadBoundaryCameraLead.toFixed(1);
  controlEls.roadBoundaryPulseStrengthVal.textContent = nextRoadBoundaryPulseStrength.toFixed(2);
  controlEls.boundaryErrorVisibleVal.textContent = nextBoundaryErrorVisible ? 'on' : 'off';
  controlEls.boundaryErrorSizeVal.textContent = nextBoundaryErrorSize.toFixed(2);
  controlEls.boundaryErrorAnchorVal.textContent = nextBoundaryErrorAnchor === 'wall' ? 'muro' : 'camera';
  controlEls.boundaryErrorAnimationVal.textContent = nextBoundaryErrorAnimation.toFixed(2);
  controlEls.boundaryErrorDurationVal.textContent = `${Math.round(nextBoundaryErrorDuration * 1000)} ms`;
  controlEls.boundaryErrorGlitchVal.textContent = nextBoundaryErrorGlitch.toFixed(2);
  controlEls.boundaryErrorRenderModeVal.textContent = nextBoundaryErrorRenderMode;
  controlEls.boundaryErrorFloorLightEnabledVal.textContent = nextBoundaryErrorFloorLightEnabled ? 'on' : 'off';
  controlEls.boundaryErrorFloorLightRadiusVal.textContent = nextBoundaryErrorFloorLightRadius.toFixed(1);
  controlEls.boundaryErrorFloorLightIntensityVal.textContent = nextBoundaryErrorFloorLightIntensity.toFixed(2);
  controlEls.boundaryErrorFloorLightOpacityVal.textContent = nextBoundaryErrorFloorLightOpacity.toFixed(2);
  controlEls.boundaryErrorFloorLightHueVal.textContent = nextBoundaryErrorFloorLightHue.toFixed(0);
  controlEls.boundaryErrorFloorLightYVal.textContent = nextBoundaryErrorFloorLightY.toFixed(2);
  controlEls.boundaryErrorFloorLightSoftnessVal.textContent = nextBoundaryErrorFloorLightSoftness.toFixed(2);
  controlEls.ledBrightnessVal.textContent = ledBrightness.toFixed(2);
  controlEls.ledThicknessVal.textContent = ledThickness.toFixed(2);
  controlEls.ledDistanceVal.textContent = nextLedDistance.toFixed(2);
  controlEls.buildingHorizontalLedDistanceVal.textContent = nextBuildingHorizontalLedDistance.toFixed(2);
  controlEls.buildingHorizontalLedThicknessVal.textContent = nextBuildingHorizontalLedThickness.toFixed(2);
  controlEls.buildingHorizontalLedRadiusVal.textContent = nextBuildingHorizontalLedRadius.toFixed(2);
  controlEls.ledHueVal.textContent = ledHue.toFixed(0);
  controlEls.basePadLedBrightnessVal.textContent = basePadLedBrightness.toFixed(2);
  controlEls.basePadLedThicknessVal.textContent = basePadLedThickness.toFixed(2);
  controlEls.basePadLedOffsetVal.textContent = basePadLedOffset.toFixed(2);
  controlEls.basePadLedHueVal.textContent = basePadLedHue.toFixed(0);
  controlEls.basePadGlobalYVal.textContent = nextBasePadGlobalY.toFixed(2);
  controlEls.basePadCurbEnabledVal.textContent = nextBasePadCurbEnabled ? 'on' : 'off';
  controlEls.basePadCurbWidthVal.textContent = nextBasePadCurbWidth.toFixed(2);
  controlEls.basePadInnerRaiseVal.textContent = nextBasePadInnerRaise.toFixed(2);
  controlEls.basePadCurbSlopeVal.textContent = nextBasePadCurbSlope.toFixed(2);
  controlEls.basePadCurbRadiusVal.textContent = nextBasePadCurbRadius.toFixed(2);
  controlEls.basePadTextureModeVal.textContent = nextBasePadTextureMode;
  controlEls.basePadTextureRepeatVal.textContent = `${nextBasePadTextureRepeat.toFixed(2)}x`;
  controlEls.basePadTextureRotationVal.textContent = nextBasePadTextureRotation.toFixed(0);
  controlEls.basePadNormalVal.textContent = nextBasePadNormalStrength.toFixed(2);
  controlEls.basePadHueVal.textContent = nextBasePadHue.toFixed(0);
  controlEls.basePadSatVal.textContent = nextBasePadSaturation.toFixed(2);
  controlEls.basePadBrightVal.textContent = nextBasePadBrightness.toFixed(2);
  controlEls.basePadMetalnessVal.textContent = nextBasePadMetalness.toFixed(2);
  controlEls.basePadRoughnessVal.textContent = nextBasePadRoughness.toFixed(2);
  controlEls.basePadReflectVal.textContent = nextBasePadReflect.toFixed(2);
  controlEls.basePadEmissiveVal.textContent = nextBasePadEmissive.toFixed(3);
  controlEls.basePadBevelSizeVal.textContent = nextBasePadBevelSize.toFixed(2);
  controlEls.basePadBevelSegmentsVal.textContent = nextBasePadBevelSegments.toFixed(0);
  controlEls.basePadFlatShadingVal.textContent = nextBasePadFlatShading ? 'on' : 'off';
  controlEls.basePadBorderOpacityVal.textContent = nextBasePadBorderOpacity.toFixed(2);
  controlEls.basePadBorderBrightVal.textContent = nextBasePadBorderBrightness.toFixed(2);
  controlEls.buildingLowLedOffsetVal.textContent = buildingLowLedOffset.toFixed(2);
  controlEls.buildingHighLedOffsetVal.textContent = buildingHighLedOffset.toFixed(2);
  controlEls.buildingVerticalLedLengthVal.textContent = `${Math.round(nextBuildingVerticalLedLength * 100)}%`;
  controlEls.buildingVerticalLedYVal.textContent = nextBuildingVerticalLedY.toFixed(1);
  controlEls.buildingLowLedYVal.textContent = nextBuildingLowLedY.toFixed(1);
  controlEls.buildingHighLedYVal.textContent = nextBuildingHighLedY.toFixed(1);
  controlEls.buildingFacadeLedNormalVal.textContent = nextBuildingFacadeLedNormal.toFixed(2);
  controlEls.buildingFacadeLedXVal.textContent = nextBuildingFacadeLedX.toFixed(2);
  controlEls.buildingFacadeLedYVal.textContent = nextBuildingFacadeLedY.toFixed(2);
  controlEls.buildingFacadeLedZVal.textContent = nextBuildingFacadeLedZ.toFixed(2);
  (controlEls.buildingFacadeLedSegmentControls || []).forEach((controls, index) => {
    const offset = nextSideFacadeSegmentOffsets[index];
    controls.uVal.textContent = offset.u.toFixed(2);
    controls.yVal.textContent = offset.y.toFixed(2);
    controls.normalVal.textContent = offset.normal.toFixed(2);
  });
  controlEls.bridgeXOffsetVal.textContent = nextBridgeXOffset.toFixed(1);
  controlEls.bridgeZOffsetVal.textContent = nextBridgeZOffset.toFixed(1);
  controlEls.bridgeYOffsetVal.textContent = nextBridgeYOffset.toFixed(1);
  controlEls.bridgeSpanScaleVal.textContent = nextBridgeSpanScale.toFixed(2);
  controlEls.bridgeHeightScaleVal.textContent = nextBridgeHeightScale.toFixed(2);
  controlEls.bridgeDepthScaleVal.textContent = nextBridgeDepthScale.toFixed(2);
  controlEls.bridgeLowLedOffsetVal.textContent = bridgeLowLedOffset.toFixed(2);
  controlEls.bridgeHighLedOffsetVal.textContent = bridgeHighLedOffset.toFixed(2);
  controlEls.collisionPaddingVal.textContent = nextCollisionPadding.toFixed(1);
  controlEls.mainBuildingCollisionPaddingVal.textContent = nextMainBuildingCollisionPadding.toFixed(1);
  controlEls.cameraMinHeightVal.textContent = nextCameraMinHeight.toFixed(1);
  controlEls.walkSpeedVal.textContent = nextWalkSpeed.toFixed(0);
  controlEls.sprintSpeedVal.textContent = nextSprintSpeed.toFixed(0);
  controlEls.backwardSpeedScaleVal.textContent = nextBackwardSpeedScale.toFixed(2);
  controlEls.strafeSpeedScaleVal.textContent = nextStrafeSpeedScale.toFixed(2);
  controlEls.diagonalSpeedScaleVal.textContent = nextDiagonalSpeedScale.toFixed(2);
  controlEls.verticalSpeedVal.textContent = nextVerticalSpeed.toFixed(0);
  controlEls.movementAccelVal.textContent = nextMovementAccel.toFixed(1);
  controlEls.movementDecelVal.textContent = nextMovementDecel.toFixed(1);
  controlEls.walkBobVal.textContent = nextWalkBob.toFixed(2);
  controlEls.runBobVal.textContent = nextRunBob.toFixed(2);
  controlEls.strafeBobScaleVal.textContent = nextStrafeBobScale.toFixed(2);
  controlEls.backwardBobScaleVal.textContent = nextBackwardBobScale.toFixed(2);
  controlEls.walkStepRateVal.textContent = nextWalkStepRate.toFixed(2);
  controlEls.runStepRateVal.textContent = nextRunStepRate.toFixed(2);
  controlEls.stepSnapVal.textContent = nextStepSnap.toFixed(2);
  controlEls.movementSwayVal.textContent = nextMovementSway.toFixed(2);
  controlEls.movementRollVal.textContent = nextMovementRoll.toFixed(3);
  controlEls.strafeLeanVal.textContent = nextStrafeLean.toFixed(3);
  controlEls.headMotionSmoothingVal.textContent = nextHeadMotionSmoothing.toFixed(1);
  controlEls.mouseSensitivityVal.textContent = nextMouseSensitivity.toFixed(2);
  controlEls.sideBuildingBrightnessVal.textContent = sideBuildingBrightness.toFixed(2);
  controlEls.sideBuildingHueVal.textContent = sideBuildingHue.toFixed(0);
  controlEls.sideBuildingMetalnessVal.textContent = sideBuildingMetalness.toFixed(2);
  controlEls.sideBuildingRoughnessVal.textContent = sideBuildingRoughness.toFixed(2);
  controlEls.sideBuildingReflectVal.textContent = sideBuildingReflect.toFixed(2);
  controlEls.sideBuildingEmissiveVal.textContent = sideBuildingEmissive.toFixed(2);
  controlEls.sideBuildingWidthScaleVal.textContent = nextSideBuildingWidthScale.toFixed(2);
  controlEls.sideBuildingDepthScaleVal.textContent = nextSideBuildingDepthScale.toFixed(2);
  controlEls.sideBuildingSpacingScaleVal.textContent = nextSideBuildingSpacingScale.toFixed(2);
  controlEls.sideBuildingScaleVal.textContent = sideBuildingScale.toFixed(2);
  controlEls.sideBuildingBasePadScaleVal.textContent = `${nextSideBuildingBasePadScale.toFixed(2)}x`;
  controlEls.sideBuildingBasePadXScaleVal.textContent = nextSideBuildingBasePadXScale.toFixed(2);
  controlEls.sideBuildingBasePadYVal.textContent = nextSideBuildingBasePadY.toFixed(2);
  controlEls.sideBuildingBasePadThicknessVal.textContent = nextSideBuildingBasePadThickness.toFixed(2);
  controlEls.sideBuildingBasePadCutVal.textContent = nextSideBuildingBasePadCut.toFixed(1);
  controlEls.sideBuildingBasePadRadiusVal.textContent = nextSideBuildingBasePadRadius.toFixed(1);
  controlEls.mainBuildingBrightnessVal.textContent = mainBuildingBrightness.toFixed(2);
  controlEls.mainBuildingHueVal.textContent = mainBuildingHue.toFixed(0);
  controlEls.mainBuildingSaturationVal.textContent = nextMainBuildingSaturation.toFixed(2);
  controlEls.mainBuildingMetalnessVal.textContent = mainBuildingMetalness.toFixed(2);
  controlEls.mainBuildingRoughnessVal.textContent = mainBuildingRoughness.toFixed(2);
  controlEls.mainBuildingReflectVal.textContent = mainBuildingReflect.toFixed(2);
  controlEls.mainBuildingEmissiveVal.textContent = mainBuildingEmissive.toFixed(2);
  controlEls.mainBuildingWidthScaleVal.textContent = nextMainBuildingWidthScale.toFixed(2);
  controlEls.mainBuildingDepthScaleVal.textContent = nextMainBuildingDepthScale.toFixed(2);
  controlEls.mainBuildingZVal.textContent = nextMainBuildingZ.toFixed(0);
  controlEls.mainBuildingYVal.textContent = nextMainBuildingY.toFixed(0);
  controlEls.mainBuildingScaleVal.textContent = mainBuildingScale.toFixed(2);
  controlEls.mainBuildingBasePadScaleVal.textContent = `${nextMainBuildingBasePadScale.toFixed(2)}x`;
  controlEls.mainBuildingBasePadXScaleVal.textContent = nextMainBuildingBasePadXScale.toFixed(2);
  controlEls.mainBuildingBasePadZScaleVal.textContent = nextMainBuildingBasePadZScale.toFixed(2);
  controlEls.mainBuildingBasePadYVal.textContent = nextMainBuildingBasePadY.toFixed(2);
  controlEls.mainBuildingBasePadThicknessVal.textContent = nextMainBuildingBasePadThickness.toFixed(2);
  controlEls.mainBuildingBasePadCutVal.textContent = nextMainBuildingBasePadCut.toFixed(1);
  controlEls.mainBuildingBasePadRadiusVal.textContent = nextMainBuildingBasePadRadius.toFixed(1);
  controlEls.mainBuildingLedBrightnessVal.textContent = mainBuildingLedBrightness.toFixed(2);
  controlEls.mainBuildingLedThicknessVal.textContent = mainBuildingLedThickness.toFixed(2);
  controlEls.mainBuildingLedDistanceVal.textContent = mainBuildingLedDistance.toFixed(2);
  controlEls.mainBuildingHorizontalLedDistanceVal.textContent = nextMainBuildingHorizontalLedDistance.toFixed(2);
  controlEls.mainBuildingHorizontalLedThicknessVal.textContent = nextMainBuildingHorizontalLedThickness.toFixed(2);
  controlEls.mainBuildingHorizontalLedRadiusVal.textContent = nextMainBuildingHorizontalLedRadius.toFixed(2);
  controlEls.mainBuildingLedHueVal.textContent = mainBuildingLedHue.toFixed(0);
  controlEls.mainBuildingLowLedOffsetVal.textContent = mainBuildingLowLedOffset.toFixed(2);
  controlEls.mainBuildingHighLedOffsetVal.textContent = mainBuildingHighLedOffset.toFixed(2);
  controlEls.mainBuildingVerticalLedLengthVal.textContent = `${Math.round(nextMainBuildingVerticalLedLength * 100)}%`;
  controlEls.mainBuildingVerticalLedYVal.textContent = nextMainBuildingVerticalLedY.toFixed(1);
  controlEls.mainBuildingLowLedYVal.textContent = nextMainBuildingLowLedY.toFixed(1);
  controlEls.mainBuildingHighLedYVal.textContent = nextMainBuildingHighLedY.toFixed(1);
  controlEls.mainLedBrightnessUiVal.textContent = mainBuildingLedBrightness.toFixed(2);
  controlEls.mainLedHueUiVal.textContent = mainBuildingLedHue.toFixed(0);
  controlEls.mainLedVerticalDistanceUiVal.textContent = mainBuildingLedDistance.toFixed(2);
  controlEls.mainLedThicknessUiVal.textContent = mainBuildingLedThickness.toFixed(2);
  controlEls.mainLedVerticalLengthUiVal.textContent = `${Math.round(nextMainBuildingVerticalLedLength * 100)}%`;
  controlEls.mainLedVerticalYUiVal.textContent = nextMainBuildingVerticalLedY.toFixed(1);
  controlEls.mainLedHorizontalDistanceUiVal.textContent = nextMainBuildingHorizontalLedDistance.toFixed(2);
  controlEls.mainLedHorizontalThicknessUiVal.textContent = nextMainBuildingHorizontalLedThickness.toFixed(2);
  controlEls.mainLedHorizontalRadiusUiVal.textContent = nextMainBuildingHorizontalLedRadius.toFixed(2);
  controlEls.mainLedLowOffsetUiVal.textContent = mainBuildingLowLedOffset.toFixed(2);
  controlEls.mainLedLowYUiVal.textContent = nextMainBuildingLowLedY.toFixed(1);
  controlEls.mainLedHighOffsetUiVal.textContent = mainBuildingHighLedOffset.toFixed(2);
  controlEls.mainLedHighYUiVal.textContent = nextMainBuildingHighLedY.toFixed(1);
  controlEls.mainFacadeLedBrightnessUiVal.textContent = nextMainBuildingFacadeLedBrightness.toFixed(2);
  controlEls.mainFacadeLedNormalUiVal.textContent = nextMainBuildingFacadeLedNormal.toFixed(2);
  controlEls.mainFacadeLedXUiVal.textContent = nextMainBuildingFacadeLedX.toFixed(2);
  controlEls.mainFacadeLedYUiVal.textContent = nextMainBuildingFacadeLedY.toFixed(2);
  controlEls.mainFacadeLedZUiVal.textContent = nextMainBuildingFacadeLedZ.toFixed(2);
  controlEls.mainFacadeLedThicknessUiVal.textContent = `${nextMainBuildingFacadeLedThickness.toFixed(2)}x`;
  controlEls.mainFacadeLedSegmentControls.forEach((controls, index) => {
    const offset = nextMainFacadeSegmentOffsets[index];
    controls.uVal.textContent = offset.u.toFixed(2);
    controls.yVal.textContent = offset.y.toFixed(2);
    controls.normalVal.textContent = offset.normal.toFixed(2);
  });
  controlEls.renderResolutionVal.textContent = `${Math.round(nextRenderResolution * 100)}%`;
  controlEls.bloomVal.textContent = bloomStrength.toFixed(2);
  controlEls.bloomRadiusVal.textContent = bloomRadius.toFixed(2);
  controlEls.bloomThresholdVal.textContent = bloomThreshold.toFixed(2);
  controlEls.bloomQualityVal.textContent = bloomQuality.toFixed(2);
  controlEls.pixelRatioVal.textContent = pixelRatio.toFixed(2);
  applyTronSoundtrackIntroFxControlsFromUI();
  applyCinematicGroundingInitialControls();
  applyCharacterControlsFromUI();
}

renderBridgeControls();
let performanceDiagnosticsEl = null;
mountFxCategoryPanels({ setPerformanceDiagnosticsEl: (el) => { performanceDiagnosticsEl = el; } });
function mountSideFacadeLedControls() {
  return mountSideFacadeLedControlsCore(controlEls);
}
mountSideFacadeLedControls();
document.querySelectorAll(PRODUCTION_LIVE_CONTROL_SELECTOR).forEach((input) => {
  input.addEventListener(input.tagName === 'SELECT' || input.type === 'checkbox' ? 'change' : 'input', scheduleLiveControls);
});
controlEls.resetCameraHeight.addEventListener('click', resetCameraHeightToDefault);
controlEls.saveLiveSpawn.addEventListener('click', captureLivePlayerSpawn);
controlEls.resetPlayerSpawn.addEventListener('click', () => applyPlayerSpawn(player.playerSpawn, true));
controlEls.saveStartPosition.addEventListener('click', captureLivePlayerSpawn);
controlEls.goStartPosition.addEventListener('click', () => applyPlayerSpawn(player.playerSpawn, true));
controlEls.droneIntroFlight?.addEventListener('click', () => startDroneIntroFlight('manual'));
controlEls.runFsrBenchmark?.addEventListener('click', runFsrBenchmark);
controlSettingsRuntime.bindSaveButtons();

updateControlTabs();
controlSettingsRuntime.setupSettingsToggle();

const sceneTexturePrewarmStats = {
  supported: false,
  attempted: 0,
  uploaded: 0,
  errors: 0,
  durationMs: 0,
};
const postProcessingPrewarmStats = {
  attempted: false,
  rendered: false,
  postRevealRendered: false,
  errors: 0,
  durationMs: 0,
  texturesAfter: 0,
};
const skinnedMeshPrewarmStats = {
  attempted: 0,
  created: 0,
  uploaded: 0,
  errors: 0,
  durationMs: 0,
};
const hiddenSkinnedRenderPrewarmStats = {
  attempted: 0,
  forcedVisible: 0,
  forcedUnculled: 0,
  rendered: false,
  errors: 0,
  durationMs: 0,
  texturesBefore: 0,
  texturesAfter: 0,
};

function prewarmTextureUpload(texture, seen) {
  if (!texture?.isTexture || seen.has(texture)) return;
  seen.add(texture);
  sceneTexturePrewarmStats.attempted += 1;
  try {
    renderer.initTexture?.(texture);
    sceneTexturePrewarmStats.uploaded += 1;
  } catch {
    sceneTexturePrewarmStats.errors += 1;
  }
}

function prewarmMaterialTextureUploads(material, seen) {
  if (!material) return;
  for (const key of SCENE_TEXTURE_PREWARM_KEYS) {
    prewarmTextureUpload(material[key], seen);
  }
  for (const uniform of Object.values(material.uniforms || {})) {
    prewarmTextureUpload(uniform?.value, seen);
  }
}

function prewarmSceneTextureUploads(root = scene) {
  const started = performance.now();
  sceneTexturePrewarmStats.supported = typeof renderer.initTexture === 'function';
  sceneTexturePrewarmStats.attempted = 0;
  sceneTexturePrewarmStats.uploaded = 0;
  sceneTexturePrewarmStats.errors = 0;
  if (!sceneTexturePrewarmStats.supported) return sceneTexturePrewarmStats;
  const seen = new Set();
  root.traverse((object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) prewarmMaterialTextureUploads(material, seen);
  });
  sceneTexturePrewarmStats.durationMs = Number((performance.now() - started).toFixed(2));
  return sceneTexturePrewarmStats;
}

function prewarmSkinnedMeshBoneTextures(root = scene) {
  const started = performance.now();
  skinnedMeshPrewarmStats.attempted = 0;
  skinnedMeshPrewarmStats.created = 0;
  skinnedMeshPrewarmStats.uploaded = 0;
  skinnedMeshPrewarmStats.errors = 0;
  const seenSkeletons = new Set();
  root.traverse((object) => {
    if (!object?.isSkinnedMesh || !object.skeleton || seenSkeletons.has(object.skeleton)) return;
    seenSkeletons.add(object.skeleton);
    skinnedMeshPrewarmStats.attempted += 1;
    try {
      if (!object.skeleton.boneTexture && typeof object.skeleton.computeBoneTexture === 'function') {
        object.skeleton.computeBoneTexture();
        skinnedMeshPrewarmStats.created += 1;
      }
      if (object.skeleton.boneTexture) {
        renderer.initTexture?.(object.skeleton.boneTexture);
        skinnedMeshPrewarmStats.uploaded += 1;
      }
    } catch {
      skinnedMeshPrewarmStats.errors += 1;
    }
  });
  skinnedMeshPrewarmStats.durationMs = Number((performance.now() - started).toFixed(2));
  return skinnedMeshPrewarmStats;
}

async function prewarmHiddenSkinnedMeshRender(root = scene) {
  const started = performance.now();
  hiddenSkinnedRenderPrewarmStats.attempted = 0;
  hiddenSkinnedRenderPrewarmStats.forcedVisible = 0;
  hiddenSkinnedRenderPrewarmStats.forcedUnculled = 0;
  hiddenSkinnedRenderPrewarmStats.rendered = false;
  hiddenSkinnedRenderPrewarmStats.errors = 0;
  hiddenSkinnedRenderPrewarmStats.texturesBefore = renderer.info.memory?.textures ?? 0;
  hiddenSkinnedRenderPrewarmStats.texturesAfter = hiddenSkinnedRenderPrewarmStats.texturesBefore;
  if (typeof renderer.render !== 'function') return hiddenSkinnedRenderPrewarmStats;

  const visibilityState = [];
  const frustumState = [];
  const seenVisibility = new Set();
  try {
    root.traverse((object) => {
      if (!object?.isSkinnedMesh) return;
      hiddenSkinnedRenderPrewarmStats.attempted += 1;
      if (object.frustumCulled) {
        frustumState.push([object, object.frustumCulled]);
        object.frustumCulled = false;
        hiddenSkinnedRenderPrewarmStats.forcedUnculled += 1;
      }
      let current = object;
      while (current && current !== root.parent) {
        if (!seenVisibility.has(current) && current.visible === false) {
          seenVisibility.add(current);
          visibilityState.push([current, current.visible]);
          current.visible = true;
          hiddenSkinnedRenderPrewarmStats.forcedVisible += 1;
        }
        if (current === root) break;
        current = current.parent;
      }
    });

    if (hiddenSkinnedRenderPrewarmStats.attempted > 0) {
      const target = new THREE.WebGLRenderTarget(4, 4, {
        depthBuffer: true,
        stencilBuffer: false,
      });
      // The program variant depends on the bound render target (output colour
      // space and tone mapping are only applied when drawing to the screen), and
      // the real frames draw the scene into the composer's target, never to the
      // screen. So both the compile and the warm render below run with an
      // off-screen target bound, or the compile would link the on-screen variants
      // and the render would compile the whole set again, synchronously.
      const withPrewarmTarget = (run) => {
        const previousRenderTarget = renderer.getRenderTarget();
        const previousAutoClear = renderer.autoClear;
        renderer.setRenderTarget(target);
        renderer.autoClear = true;
        try {
          return run();
        } finally {
          renderer.setRenderTarget(previousRenderTarget);
          renderer.autoClear = previousAutoClear;
        }
      };
      try {
        // compileAsync lets the driver link the program set on its own threads
        // (KHR_parallel_shader_compile) instead of blocking this task on every
        // program in turn. Its program creation is synchronous — only the link
        // wait is deferred — so the target is bound just for the call, not
        // across the await, where a frame could otherwise render into it.
        if (typeof renderer.compileAsync === 'function') {
          try {
            await withPrewarmTarget(() => renderer.compileAsync(root, camera));
          } catch {
            hiddenSkinnedRenderPrewarmStats.errors += 1;
          }
        }
        withPrewarmTarget(() => {
          renderer.clear();
          renderer.render(root, camera);
        });
        hiddenSkinnedRenderPrewarmStats.rendered = true;
      } finally {
        target.dispose();
      }
    }
  } catch {
    hiddenSkinnedRenderPrewarmStats.errors += 1;
  } finally {
    for (let i = visibilityState.length - 1; i >= 0; i -= 1) {
      visibilityState[i][0].visible = visibilityState[i][1];
    }
    for (let i = frustumState.length - 1; i >= 0; i -= 1) {
      frustumState[i][0].frustumCulled = frustumState[i][1];
    }
    hiddenSkinnedRenderPrewarmStats.durationMs = Number((performance.now() - started).toFixed(2));
    hiddenSkinnedRenderPrewarmStats.texturesAfter = renderer.info.memory?.textures ?? 0;
    performanceDiagnostics.setLastTextureCount(hiddenSkinnedRenderPrewarmStats.texturesAfter);
  }
  return hiddenSkinnedRenderPrewarmStats;
}

function prewarmPostProcessingPasses() {
  postProcessingPrewarmStats.attempted = true;
  postProcessingPrewarmStats.rendered = false;
  postProcessingPrewarmStats.postRevealRendered = false;
  postProcessingPrewarmStats.errors = 0;
  const started = performance.now();
  if (!post.composer) return postProcessingPrewarmStats;
  const previousPostEnabled = post.postEnabled;
  const previousBloomEnabled = post.bloomPass?.enabled;
  const previousFxaaEnabled = post.fxaaPass?.enabled;
  const previousRevealState = snapshotCityRevealWireframeState();
  try {
    post.postEnabled = true;
    if (post.bloomPass) post.bloomPass.enabled = true;
    if (post.fxaaPass) post.fxaaPass.enabled = post.antialiasMode === 'fxaa';
    cityRevealRender.syncComposerPasses();
    post.composer.render();
    postProcessingPrewarmStats.rendered = true;
    setCityRevealPostProcessingPrewarmState();
    cityRevealRender.syncComposerPasses();
    post.composer.render();
    postProcessingPrewarmStats.postRevealRendered = true;
  } catch {
    postProcessingPrewarmStats.errors += 1;
  } finally {
    restoreCityRevealWireframeState(previousRevealState);
    post.postEnabled = previousPostEnabled;
    if (post.bloomPass) post.bloomPass.enabled = previousBloomEnabled;
    if (post.fxaaPass) post.fxaaPass.enabled = previousFxaaEnabled;
    cityRevealRender.syncComposerPasses();
    postProcessingPrewarmStats.durationMs = Number((performance.now() - started).toFixed(2));
    postProcessingPrewarmStats.texturesAfter = renderer.info.memory?.textures ?? 0;
    performanceDiagnostics.setLastTextureCount(postProcessingPrewarmStats.texturesAfter);
  }
  return postProcessingPrewarmStats;
}

async function bootSceneWithFinalDefaults() {
  await controlSettingsRuntime.loadProjectCanonicalDefaults();
  controlSettingsRuntime.loadStoredControlDefaults();
  controlSettingsRuntime.applyRetroFutureRevealTimingDefaults();
  controlSettingsRuntime.applyFullResolutionFsrDefaults();
  applyBridgeFixedDefaults();
  loadStoredPlayerSpawn();
  applyLiveControls();
  buildLabEqualizer({ visible: false });
  setTronNoclip(false, { silent: true });
  applyPlayerSpawn(player.playerSpawn, false);
  await tronRunnerOrchestration.load();
  await tronRunnerCrowdRuntime.drainBuildQueue();
  // Each of these is a heavy synchronous block (bone-texture uploads, a full
  // scene compile + render, two composer renders, then a compile with the reveal
  // clip planes). Chained without a break they form one long main-thread task —
  // hundreds of ms on mobile with input and paint frozen throughout. Yield to the
  // browser between them, and let the driver link programs in parallel where it
  // can (compileAsync, KHR_parallel_shader_compile) before the warm render.
  prewarmSkinnedMeshBoneTextures(scene);
  await waitForNextFrame();
  prewarmSceneTextureUploads(scene);
  await waitForNextFrame();
  await prewarmHiddenSkinnedMeshRender(scene);
  await waitForNextFrame();
  prewarmPostProcessingPasses();
  await waitForNextFrame();
  await ensureFootstepAudioReady();
  await cityRevealRender.prewarmRealPass();
  scheduleDroneIntroAutoFlight();
}

window.__tronInspect = () => ({
  cameraX: camera.position.x,
  cameraY: camera.position.y,
  cameraZ: camera.position.z,
  cameraPitch: player.pitch,
  cameraYaw: player.yaw,
  noclip: getTronNoclipEnabled(),
  cameraCollisionDisabled: isCameraCollisionDisabled(),
  mouseLookEnabled: isMouseLookEnabled(),
  cityRevealProfile: cityRevealProfiler.inspect(),
  sideBuildingCivicNumberCount: sideBuildingCivicNumberGroups.length,
  sideBuildingCivicNumberCulling: inspectSideBuildingCivicNumberCulling(),
  sideBuildingDoorBatching: inspectSideBuildingDoorBatching(),
  sideBuildingCivicNumbers: sideBuildingRecords.map((record) => ({
    value: record.civicNumberValue,
    visible: Boolean(record.civicNumberGroup?.visible),
    layers: record.civicNumberGroup?.children.length ?? 0,
    x: record.civicNumberGroup?.position.x ?? null,
    y: record.civicNumberGroup?.position.y ?? null,
    z: record.civicNumberGroup?.position.z ?? null,
    rotationY: record.civicNumberGroup?.rotation.y ?? null,
    scaleX: record.civicNumberGroup?.scale.x ?? null,
    scaleY: record.civicNumberGroup?.scale.y ?? null,
  })),
  sideBuildingLedLayouts: sideBuildingRecords.map((record) => sideBuildingLedLayoutInspect(record)),
  bridgeLinks: bridges.inspect(),
  tronRunner: tronRunnerOrchestration.inspect(),
  tronRunnerCrowd: tronRunnerCrowdRuntime.inspect(),
  tronRunnerIdleCharacter: tronRunnerIdleCharacterRuntime.inspect(),
  surfaceReflections: {
    roadReflect: Number(controlEls.roadReflect.value),
    roadBuildingReflect: Number(controlEls.roadBuildingReflect.value),
    roadMetalness: Number(controlEls.roadMetalness.value),
    roadRoughness: Number(controlEls.roadRoughness.value),
    roadNormal: Number(controlEls.roadNormal.value),
    basePadReflect: Number(controlEls.basePadReflect.value),
    basePadMetalness: Number(controlEls.basePadMetalness.value),
    basePadRoughness: Number(controlEls.basePadRoughness.value),
    basePadNormal: Number(controlEls.basePadNormal.value),
    basePadTextureRepeat: Number(controlEls.basePadTextureRepeat.value),
  },
  pointerLocked: getPointerLocked(),
  unlockedMouseLookActive: getUnlockedMouseLookActive(),
  tronDiscCursor: {
    visible: tronDiscCursorState.visible,
    pointerInside: tronDiscCursorState.pointerInside,
    x: Number(tronDiscCursorState.x.toFixed(1)),
    y: Number(tronDiscCursorState.y.toFixed(1)),
    speed: Number(tronDiscCursorState.speed.toFixed(1)),
    spinDegPerSec: Number(tronDiscCursorState.spinDegPerSec.toFixed(1)),
    targetSpinDegPerSec: Number(tronDiscCursorState.targetSpinDegPerSec.toFixed(1)),
  },
  mobileTouchControls: mobileTouchControlsInspect(),
  footsteps: window.__tronFootstepInspect?.(),
  music: window.__tronMusicInspect?.(),
  equalizer: window.__labEqualizerInspect?.(),
  welcomePanelMotion: { ...welcomeWindowMotion.state },
  cityDepartmentBoards: cityDepartmentBoardInspect(),
  contactTerminal: contactTerminalInspect(),
  cityRoleBoard: cityRoleBoardInspect(),
  backspaceIntroTriggered: player.backspaceIntroTriggered,
  cameraCollisionUnlockedByBackspace: player.cameraCollisionUnlockedByBackspace,
  droneIntro: {
    ...droneIntroInspect(),
    heroShot: droneIntroHeroShotEnabled,
    landed: hasDroneIntroLanded(),
    landingPose: { ...player.droneLandingPose },
  },
  playerSpawn: { ...player.playerSpawn },
  fps: fpsEl.textContent,
  pixelRatio: renderer.getPixelRatio(),
  antialiasMode: post.antialiasMode,
  bloomActive: isBloomPassActive(),
  hexUpdateEnabled,
  cityRevealWireAlpha,
  cityRevealBackplateAlpha: cityRevealBackplateMat.opacity,
  cityRevealBackplateVisible: cityRevealBackplate.visible,
  cityRevealSkyPassActive: Boolean(cityRevealRender.getSkyPass()?.enabled),
  ...skyDome.inspectRevealSky(),
  cityRevealSweepMode: CITY_REVEAL_SWEEP_MODE,
  cityRevealFrontZ,
  cityRevealSweepStartZ,
  cityRevealSweepEndZ,
  cityRevealSweepProgress,
  cityRevealArmed: cityRevealArmedAt > 0,
  cityRevealArmedElapsedMs: cityRevealArmedAt > 0 ? Number((performance.now() - cityRevealArmedAt).toFixed(1)) : 0,
  cityRevealMainBuildingSlow: cityRevealMainBuildingSlowDiagnostics(),
  cityRevealRealPrewarm: cityRevealRender.inspectRealPrewarm(),
  cityRevealMainFacadeVerticalLed: { ...mainFacadeVerticalRevealState },
  cityRevealStarted: cityRevealStartedAt > 0,
  cityRevealComplete,
  cityRevealWaitingForBackspace: cityRevealWireframeEnabled && !player.backspaceIntroTriggered && !cityRevealStartedAt && !cityRevealComplete,
  cityRevealWaitingForVisibleFrame,
  cityRevealClipPlaneNormal: {
    x: cityRevealRealClipPlane.normal.x,
    y: cityRevealRealClipPlane.normal.y,
    z: cityRevealRealClipPlane.normal.z,
  },
  cityRevealClipPlaneConstant: cityRevealRealClipPlane.constant,
  cityRevealClipPlaneGroundFrontZ: -cityRevealRealClipPlane.constant / cityRevealRealClipPlane.normal.z,
  cityRevealRenderOrder: CITY_REVEAL_RENDER_ORDER,
  cityRevealCompositeActive: isCityRevealCompositeActive(),
  cityRevealRealRevealActive: isCityRevealRealRevealActive(),
  cityRevealRealClipActive: Boolean(cityRevealRender.getScenePass()?.clipReveal || isCityRevealRealRevealActive()),
  cityRevealComposerPasses: {
    ...cityRevealRender.inspectPasses(),
    mainLedReveal: Boolean(cityRevealMainLedReveal.getPass()?.enabled),
  },
  cityRevealScanGlow: cityRevealScanGlow.inspect(),
  ...cityRevealMainLedReveal.inspect(),
  cityRevealWireAaMode: 'global-fxaa-only',
  cityRevealWireAaLocalized: false,
  cityRevealVisibleObjects: cityRevealEstimatedVisibleObjects(),
  cityRevealWireObjects: cityRevealWireObjects.length,
  cityRevealSolidObjects: cityRevealSolidObjects.length,
  cityRevealMainBuildingLedWireObjects: cityRevealWireObjects.filter((object) => object.userData.cityRevealRole === 'main-led-wire').length,
  cityRevealMainBuildingLedWireEnabled: CITY_REVEAL_MAIN_BUILDING_LED_WIREFRAME_ENABLED,
  cityRevealBridgeSolidObjects: cityRevealSolidObjects.filter((object) => object.userData.cityRevealRole === 'bridge-solid').length,
  cityRevealBridgeLedWireObjects: cityRevealWireObjects.filter((object) => object.userData.cityRevealRole === 'bridge-led-wire').length,
  cityRevealRoadSolidObjects: cityRevealSolidObjects.filter((object) => object.userData.cityRevealRole === 'road-solid').length,
  cityRevealSidewalkStats: (() => {
    const pads = [...sideBuildingRecords, ...mainBuildingRecords]
      .map((record) => record.basePad)
      .filter((pad) => pad?.hitPolygon?.length);
    const roadTopY = roadTileTopY();
    const roadSolidTopY = cityRevealRoadSolidTopY();
    const surfaceYs = pads.flatMap((pad) => [pad.topY, pad.innerTopY].filter(Number.isFinite));
    const wireYs = surfaceYs.map((topY) => cityRevealSidewalkWireY(topY));
    const minSurfaceY = surfaceYs.length ? Math.min(...surfaceYs) : null;
    const minWireY = wireYs.length ? Math.min(...wireYs) : null;
    const sidewalkObjects = pads.flatMap((pad) => [
      pad.mesh,
      pad.curbRamp,
      pad.innerMesh,
      pad.border,
      pad.innerBorder,
    ].filter(Boolean));
    const basePadLedRenderableBatches = basePadLedBatch.batches.filter((batch) => batch.mesh);
    const basePadLedCullingEnabledCount = basePadLedRenderableBatches.filter((batch) => batch.mesh.frustumCulled).length;
    const basePadLedVisibleBatchCount = basePadLedRenderableBatches.filter((batch) => batch.mesh.visible).length;
    const sidewalkCullingEnabledCount =
      sidewalkObjects.filter((object) => object.frustumCulled).length +
      basePadLedCullingEnabledCount +
      (basePadHexClipMesh.frustumCulled ? 1 : 0);
    return {
      pads: pads.length,
      roadTopY,
      roadSolidTopY,
      minSurfaceY,
      minWireY,
      realSurfaceMarginOverRoad: Number.isFinite(minSurfaceY) ? minSurfaceY - roadTopY : null,
      wireMarginOverRoadSolid: Number.isFinite(minWireY) ? minWireY - roadSolidTopY : null,
      realBelowRoadCount: surfaceYs.filter((topY) => topY <= roadTopY + 0.001).length,
      wireHiddenByRoadSolidCount: wireYs.filter((wireY) => wireY <= roadSolidTopY + 0.001).length,
      sidewalkRenderableObjects: sidewalkObjects.length,
      basePadObjectCullingEnabled: BASE_PAD_FRUSTUM_CULLING_ENABLED,
      basePadCullingBoundsMargin: BASE_PAD_CULLING_BOUNDS_MARGIN,
      sidewalkCullingDisabled: sidewalkCullingEnabledCount === 0,
      sidewalkCullingEnabledCount,
      basePadLedBatchFrustumCulled: basePadLedRenderableBatches.length > 0 && basePadLedCullingEnabledCount === basePadLedRenderableBatches.length,
      basePadLedBatchObjects: basePadLedRenderableBatches.length,
      basePadLedBatchVisibleObjects: basePadLedVisibleBatchCount,
      basePadLedBatchRenderOrder: basePadLedRenderableBatches[0]?.mesh?.renderOrder ?? null,
      basePadLedBatchTransparent: Boolean(basePadLedBatch.material?.transparent),
      basePadLedBatchDepthWrite: Boolean(basePadLedBatch.material?.depthWrite),
      basePadLedBatchDepthTest: Boolean(basePadLedBatch.material?.depthTest),
      basePadLedBatchCount: basePadLedBatch.count,
      basePadHexClipFrustumCulled: Boolean(basePadHexClipMesh.frustumCulled),
    };
  })(),
  cityRevealRoadFadeObjects: cityRevealRoadFadeObjects.length,
  cityRevealRoadFadeVisibleObjects: cityRevealRoadFadeObjects.filter((object) => cityRevealWireGroup.visible && object.visible !== false && object.material?.visible && object.material?.opacity > 0.002).length,
  cityRevealRoadFadeBands: CITY_REVEAL_ROAD_FADE_BANDS,
  cityRevealRoadFadeMaxOpacity: CITY_REVEAL_ROAD_FADE_MAX_OPACITY,
  cityRevealRoadFadeOuterOpacity: cityRevealRoadFadeMaterials.at(-1)?.opacity ?? 0,
  cityRevealRoadGridObjects: cityRevealRoadGridObjects.length,
  cityRevealRoadGridVisibleObjects: cityRevealRoadGridObjects.filter((object) => cityRevealRoadGridGroup.visible && object.visible !== false && object.material?.visible && object.material?.opacity > 0.002).length,
  cityRevealRoadGridSkippedPerimeterSegments,
  cityRevealRoadGridDepthTest: cityRevealRoadGridMat.depthTest,
  cityRevealRoadGridBaseOpacity: cityRevealRoadGridMat.userData.baseOpacity,
  cityRevealRoadGridRenderOrder: CITY_REVEAL_ROAD_GRID_RENDER_ORDER,
  cityRevealRoadGridLayerOrder: 'below-wire-buildings',
  cityRevealRoadGridMode: CITY_REVEAL_ROAD_GRID_PROCEDURAL ? 'procedural-extended-wire-grid' : 'extended-wire-grid',
  cityRevealRoadGridAlphaFactor,
  cityRevealRoadSolidFadeEnabled: CITY_REVEAL_ROAD_SOLID_FADE_ENABLED,
  cityRevealRoadGridProcedural: CITY_REVEAL_ROAD_GRID_PROCEDURAL,
  cityRevealRoadGridExtraBlocks: CITY_REVEAL_ROAD_GRID_EXTRA_BLOCKS,
  cityRevealRoadGridZExtraBlocks: CITY_REVEAL_ROAD_GRID_EXTRA_BLOCKS,
  cityRevealRoadGridFadeEnabled: CITY_REVEAL_ROAD_GRID_EXTRA_BLOCKS > 0,
  cityRevealRoadGridFadeBands: CITY_REVEAL_ROAD_GRID_FADE_BANDS,
  cityRevealRoadGridFadeWidth: cityRevealRoadGridExtraWidth(),
  cityRevealRoadHalfWidth: dynamicRoadSurfaceWidth / 2,
  cityRevealRoadGridLineHalfWidth: dynamicRoadSurfaceWidth / 2,
  cityRevealRoadGridHalfWidth: cityRevealRoadGridHalfWidth(),
  cityRevealRoadGridFadeSamples: (() => {
    const bounds = cityRevealRoadGridBounds();
    return {
      center: cityRevealRoadGridFadeAt(0, boulevard.dynamicRoadCenter, bounds),
      left: cityRevealRoadGridFadeAt(-bounds.gridHalfW, boulevard.dynamicRoadCenter, bounds),
      right: cityRevealRoadGridFadeAt(bounds.gridHalfW, boulevard.dynamicRoadCenter, bounds),
      near: cityRevealRoadGridFadeAt(0, bounds.gridMinZ, bounds),
      far: cityRevealRoadGridFadeAt(0, bounds.gridMaxZ, bounds),
      halfLeft: cityRevealRoadGridFadeAt(-(bounds.roadHalfW + bounds.fadeWidth * 0.5), boulevard.dynamicRoadCenter, bounds),
      halfFar: cityRevealRoadGridFadeAt(0, bounds.roadMaxZ + bounds.fadeWidth * 0.5, bounds),
    };
  })(),
  cityRevealRoadSolidBackingEnabled: CITY_REVEAL_ROAD_SOLID_BACKING_ENABLED,
  cityRevealSidewalkInternalLinesEnabled: CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED,
  cityRevealDensityObjects: cityRevealWireObjects.filter((object) => object.userData.cityRevealRole === 'wire-density').length,
  fx: {
    performanceMode: post.performanceMode,
    antialiasMode: post.antialiasMode,
    fxaaEnabled: Boolean(post.fxaaPass?.enabled),
    bloomEnabled: post.bloomEnabled,
    bloomPassEnabled: Boolean(post.bloomPass?.enabled),
    bloomRevealBypassed: isBloomRevealBypassed(),
    bloomRevealBypassActive: shouldBypassBloomForRevealPerformance(),
    bloomActive: isBloomPassActive(),
    cinematicLookEnabled: post.cinematicLookEnabled,
    cinematicLookPassEnabled: Boolean(post.cinematicLookPass?.enabled),
    temporalAaEnabled: post.temporalAaEnabled,
    temporalAaPassEnabled: Boolean(post.temporalAaPass?.enabled),
    cinematicGrounding: cinematicGroundingSettings,
    bloomStrength: post.bloomPass?.strength ?? 0,
    bloomRadius: post.bloomPass?.radius ?? 0,
    bloomThreshold: post.bloomPass?.threshold ?? 0,
    bloomResolutionScale: post.bloomResolutionScale,
    bloomActiveMips: post.bloomPass?.activeMips ?? 0,
    bloomUpdateStride: post.bloomPass?.updateStride ?? 0,
    bloomCacheReady: Boolean(post.bloomPass?._hasCachedBloom),
    bloomResolutionCap: BLOOM_RESOLUTION_CAP,
    manualRenderScale: post.manualRenderScale,
    requestedPixelRatio: post.requestedPixelRatio,
    activePixelRatio: post.activePixelRatio,
    adaptiveRenderTarget: adaptiveRenderTargetInspect(),
    mobileProfile: mobilePerformanceProfileInspect(),
  },
  wireframeFx: {
    enabled: cityRevealWireframeEnabled,
    delayMs: cityRevealDelayMs,
    extraDelayMs: CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS,
    effectiveDelayMs: cityRevealEffectiveDelayMs(),
    fadeMs: cityRevealFadeMs,
    density: cityRevealWireframeDensity,
    opacity: cityRevealWireOpacityScale,
    backplate: cityRevealBackplateOpacityScale,
  },
  hexRoad: hexRoadInspect(),
  buildingLedBatches: buildingLedBatchInspect(),
  fxLed: facadeLedRuntimeInspect(),
  render: { ...renderer.info.render },
  memory: { ...renderer.info.memory },
});
window.__tronRunnerInspect = () => tronRunnerOrchestration.inspect();
window.__tronRevealProfile = cityRevealProfiler.inspect;
window.__tronSpikeInspect = performanceDiagnostics.spikeSummary;
window.__tronCaptureLiveSpawn = captureLivePlayerSpawn;
window.__tronApplyPlayerSpawn = applyPlayerSpawn;
window.__tronPerfInspect = () => ({
  fps: fpsEl.textContent,
  pixelRatio: renderer.getPixelRatio(),
  activePixelRatio: post.activePixelRatio,
  adaptiveRenderTarget: adaptiveRenderTargetInspect(),
  manualRenderScale: post.manualRenderScale,
  dynamicQualityScale: post.dynamicQualityScale,
  performanceMode: post.performanceMode,
  composerActive: shouldUseComposer(),
  bloomEnabled: post.bloomEnabled,
  bloomPassEnabled: Boolean(post.bloomPass?.enabled),
  bloomRevealBypassed: isBloomRevealBypassed(),
  bloomRevealBypassActive: shouldBypassBloomForRevealPerformance(),
  bloomActive: isBloomPassActive(),
  fxaaEnabled: Boolean(post.fxaaPass?.enabled),
  antialiasMode: post.antialiasMode,
  cinematicLookEnabled: post.cinematicLookEnabled,
  cinematicLookPassEnabled: Boolean(post.cinematicLookPass?.enabled),
  temporalAaEnabled: post.temporalAaEnabled,
  temporalAaPassEnabled: Boolean(post.temporalAaPass?.enabled),
  cinematicGrounding: cinematicGroundingSettings,
  bloomResolutionScale: post.bloomResolutionScale,
  bloomResolutionCap: BLOOM_RESOLUTION_CAP,
  bloomActiveMips: post.bloomPass?.activeMips ?? 0,
  bloomUpdateStride: post.bloomPass?.updateStride ?? 0,
  bloomTemporalStride: post.bloomTemporalAppliedStride,
  bloomCacheReady: Boolean(post.bloomPass?._hasCachedBloom),
  mobileProfile: mobilePerformanceProfileInspect(),
  wireframeFx: {
    enabled: cityRevealWireframeEnabled,
    delayMs: cityRevealDelayMs,
    extraDelayMs: CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS,
    effectiveDelayMs: cityRevealEffectiveDelayMs(),
    fadeMs: cityRevealFadeMs,
    density: cityRevealWireframeDensity,
    opacity: cityRevealWireOpacityScale,
    backplate: cityRevealBackplateOpacityScale,
  },
  storm: skyDome.inspectStorm(),
  skyBake: skyDome.inspectSkyBake(),
  temporalAa: post.temporalAaPass?.inspect(),
  hexUpdateEnabled,
  hexTiles: hexRoadTiles.length,
  hexRoad: hexRoadInspect(),
  buildingLedBatches: buildingLedBatchInspect(),
  recoveringHexTiles: recoveringHexTiles.size,
  ...boundaryErrorInspect(),
  liveDiagnostics: performanceDiagnostics.summary(),
  skinnedMeshPrewarm: { ...skinnedMeshPrewarmStats },
  texturePrewarm: { ...sceneTexturePrewarmStats },
  hiddenSkinnedRenderPrewarm: { ...hiddenSkinnedRenderPrewarmStats },
  postProcessingPrewarm: { ...postProcessingPrewarmStats },
  postRevealIsolation: postRevealPerfIsolationInspect(),
  render: { ...renderer.info.render },
  memory: { ...renderer.info.memory },
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
