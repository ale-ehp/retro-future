import * as THREE from 'three';
import { createCtx } from './ctx.js';
import {
  GRID_BLOCK, MAIN_ROAD_WIDTH, SIDE_ROAD_LENGTH, SIDE_ROAD_X, SIDE_BUILDING_X, SIDE_ROAD_WIDTH,
  SIDE_BUILDING_BASE, SIDE_BUILDING_GAP, SIDE_BUILDING_SPACING,
  SIDE_BUILDING_MIN_CLEARANCE, BRIDGE_BUILDING_CLEARANCE, BRIDGE_INNER_BUILDING_FACE_X, BRIDGE_HALF_SPAN,
  MAIN_ROAD_BASE_LENGTH, START_SIDE_EXTENSION, MAIN_ROAD_LENGTH, MAIN_ROAD_Z, MAIN_BUILDING_BASE,
  MAIN_BUILDING_Z, laneZ, STREET_EDGE_WIDTH_DEFAULT, STREET_EDGE_WIDTH_MAX,
  MAX_BUILDING_AXIS_SCALE, MAX_BOULEVARD_WIDTH_SCALE, MAX_DYNAMIC_ROAD_MARGIN,
  MAIN_BUILDING_SIDE_HEX_EXTENSION_ROWS, DEFAULT_BASE_PAD_Y,
  DEFAULT_BASE_PAD_THICKNESS,
} from './world/boulevard-constants.js';
import {
  BLOOM_BYPASS_STRENGTH,
  BLOOM_OPTIMIZED_ACTIVE_MIPS,
  BLOOM_OPTIMIZED_UPDATE_STRIDE,
  BLOOM_RESOLUTION_CAP,
  BLOOM_TEMPORAL_MOVE_EPS_SQ,
  BLOOM_TEMPORAL_ROTATE_EPS,
  CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS,
  CITY_REVEAL_BACKPLATE_SWEEP_PORTION,
  CITY_REVEAL_DEFAULT_DELAY_MS,
  CITY_REVEAL_DEFAULT_FADE_MS,
  CITY_REVEAL_MAX_SKY_BACKPLATE_OPACITY,
  CITY_REVEAL_PERFORMANCE_PIXEL_RATIO_CAP,
  CITY_REVEAL_RENDER_ORDER,
  CITY_REVEAL_SWEEP_MARGIN_Z,
  CITY_REVEAL_SWEEP_MODE,
  FIXED_CAMERA_FOV,
  FSR_BENCHMARK_PRESET_KEYS,
  FSR_MANUAL_CONTROL_IDS,
  FSR_PRESETS,
  FULL_HD_RENDER_HEIGHT,
  FULL_HD_RENDER_WIDTH,
  HD_READY_RENDER_HEIGHT,
  HD_READY_RENDER_WIDTH,
  HEX_ROAD_UPDATE_FRAME_STRIDE,
  MAX_HEX_ROAD_ACCUMULATED_DT,
  MAX_RENDER_PIXEL_RATIO,
  MIN_BLOOM_TARGET_SIZE,
  MIN_DYNAMIC_BLOOM_SCALE,
  MIN_DYNAMIC_PIXEL_RATIO,
  MIN_DYNAMIC_QUALITY_SCALE,
  MOBILE_PERFORMANCE_BLOOM_SCALE_CAP,
  MOBILE_PERFORMANCE_PIXEL_RATIO_CAP,
  MOBILE_PERFORMANCE_QUERY,
  MOBILE_PERFORMANCE_RENDER_SCALE_CAP,
  SECONDARY_EFFECT_UPDATE_STRIDE,
} from './world/config.js';
import { TRON_FSR_UPSCALE_SHADER } from './engine/shaders.js';
import {
  AUDIO_FX_FAST_CONTROL_IDS,
  BASE_PAD_MATERIAL_FAST_CONTROL_IDS,
  BOUNDARY_ERROR_FAST_CONTROL_IDS,
  BUILDING_MATERIAL_FAST_CONTROL_IDS,
  CHARACTER_FAST_CONTROL_IDS,
  DEFAULT_PRODUCTION_PANEL,
  HEX_RUNTIME_FAST_CONTROL_IDS,
  LIGHT_FAST_CONTROL_IDS,
  MOVEMENT_FAST_CONTROL_IDS,
  POST_FAST_CONTROL_IDS,
  PRODUCTION_CONTROL_PANELS,
  PRODUCTION_LIVE_CONTROL_SELECTOR,
  ROAD_MATERIAL_FAST_CONTROL_IDS,
  SKY_FAST_CONTROL_IDS,
  WIREFRAME_FAST_CONTROL_IDS,
  createControlEls,
} from './controls/controls.js';
import {
  TRON_RUNNER_BEAT_PULSE_AUDIO_KICK_ENABLED,
  TRON_RUNNER_CHARACTER_LED_BLOOM_BOOST,
  TRON_RUNNER_CHARACTER_LED_BRIGHTNESS_MULTIPLIER,
  TRON_RUNNER_CHARACTER_LED_EMISSIVE_MAX,
  TRON_RUNNER_CONTACT_SHADOW_MAX_OPACITY,
  TRON_RUNNER_CONTACT_SHADOW_ROUNDNESS,
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
  TRON_RUNNER_CROWD_PATH_MODE,
  TRON_RUNNER_CROWD_PASSING_PUSH,
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
  TRON_RUNNER_DISTANCE_DRIVEN_WALK_ENABLED,
  TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
  TRON_RUNNER_DYNAMIC_REFLECTION_Y,
  TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE,
  TRON_RUNNER_ENABLED,
  TRON_RUNNER_FREE_ROAM_COLLISIONS_ENABLED,
  TRON_RUNNER_FREE_ROAM_COLLISION_RADIUS,
  TRON_RUNNER_FREE_ROAM_ENABLED,
  TRON_RUNNER_FREE_ROAM_FOOTSTEPS_ENABLED,
  TRON_RUNNER_FREE_ROAM_REACH_RADIUS,
  TRON_RUNNER_FREE_ROAM_SIDEWALK_INSET,
  TRON_RUNNER_GROUND_OFFSET,
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
  TRON_RUNNER_SHADOW_COLOR,
  TRON_RUNNER_SHADOW_CYAN_COLOR,
  TRON_RUNNER_SIDEWALK_INSET,
  TRON_RUNNER_SIDEWALK_SIGN,
  TRON_RUNNER_SOURCE_CHARACTER_VISIBLE,
  TRON_RUNNER_SUIT_COLOR,
  TRON_RUNNER_SUIT_EMISSIVE,
  TRON_RUNNER_SUIT_TEXTURE_MODE,
  TRON_RUNNER_TARGET_HEIGHT,
  TRON_RUNNER_WALK_CYCLE_DISTANCE,
} from './character/characters.js';
import {
  fitTronRunnerModel as fitTronRunnerModelCore,
  makeTronRunnerActionSet,
} from './character/character-build.js';
import {
  resolveTronRunnerRoundedCollider,
} from './character/character-collision.js';
import {
  createTronRunnerBeatPulseRuntime,
} from './character/runner-beat-pulse.js';
import {
  createTronRunnerRevealRuntime,
} from './character/runner-reveal.js';
import {
  applyTronRunnerVisualControls as applyTronRunnerVisualControlsCore,
  createTronRunnerShadowTextureState,
} from './character/runner-visual-controls.js';
import {
  applyTronRunnerCrowdLedControls as applyTronRunnerCrowdLedControlsCore,
  tronRunnerCharacterLedDefaultScale,
  tronRunnerCharacterLedScale,
  tronRunnerCrowdLedEmissiveIntensity,
} from './character/runner-crowd-leds.js';
import {
  tronRunnerFootstepAudioState as tronRunnerFootstepAudioStateCore,
  updateTronRunnerAutonomyFootsteps as updateTronRunnerAutonomyFootstepsCore,
} from './character/runner-footsteps.js';
import {
  computeTronRunnerEffectiveAnimationSpeed,
  tronRunnerCrowdGridKey,
} from './character/character-movement.js';
import {
  tronRunnerCrowdRecordRoadDir,
} from './character/character-routes.js';
import {
  makeTronRunnerSuitEmissiveTexture,
  makeTronRunnerSuitLedMaskTexture,
  makeTronRunnerSuitTexture,
} from './character/character-textures.js';
import {
  createTronRunnerAutonomy,
  createTronRunnerCrowdBuildStats,
  createTronRunnerCrowdRuntimeStats,
  createTronRunnerParts,
  createTronRunnerState,
} from './character/runner-state.js';
import {
  createTronRunnerIdleCharacterRuntime,
} from './character/runner-idle-character.js';
import {
  createTronRunnerOrchestrationRuntime,
} from './character/runner-orchestration.js';
import {
  buildTronRunnerCrowdMemberRuntime,
  clearTronRunnerCrowdState,
  createTronRunnerCrowdRuntime,
  applyGreeterHeadLookRuntime,
  cityRevealPostRevealElapsedMsRuntime,
  drainTronRunnerCrowdBuildQueueRuntime,
  enqueueTronRunnerCrowdBuildJobRuntime,
  TRON_RUNNER_FOLLOW_PROMPT_DELAY_MS,
  TRON_RUNNER_GREETER_GREET_DISTANCE,
  TRON_RUNNER_WELCOME_BUBBLE_DURATION_MS,
  invalidateTronRunnerCrowdColliderRecordsRuntime,
  nearbyTronRunnerCrowdMembersRuntime,
  normalizeTronRunnerCrowdStateRuntime,
  prepareTronRunnerCrowdSpatialGridRuntime,
  processTronRunnerCrowdBuildQueueRuntime,
  resolveGreeterBoardAnchorRuntime,
  resolveTronRunnerCrowdCollisionRuntime,
  setTronRunnerCrowdStateRuntime,
  startGreeterWalkingToBoardRuntime,
  startTronRunnerCrowdBuildQueueRuntime,
  syncTronRunnerCrowdScaleAndGround,
  syncTronRunnerCrowdVisibilityState,
  setGreeterBubbleRuntime,
  inspectTronRunnerCrowdRuntime,
  tronRunnerCrowdAvoidanceRuntime,
  tronRunnerCrowdBuildingCollisionDiagnosticRuntime,
  tronRunnerCrowdColliderRecordsRuntime,
  tronRunnerCrowdDistanceToCameraRuntime,
  tronRunnerCrowdGridCoordRuntime,
  tronRunnerCrowdLodStrideRuntime,
  tronRunnerCrowdPointInsideRouteRuntime,
  tronRunnerCrowdPostRevealReflectionRampLimitRuntime,
  tronRunnerCrowdTryDeadlockNudgeRuntime,
  updateTronRunnerCrowdRuntime,
  updateTronRunnerCrowdReflectionBudgetRuntime,
  updateTronRunnerCrowdCullingRuntime,
  updateTronRunnerCrowdReflectionRuntime,
} from './character/runner-crowd-runtime.js';
import {
  createTronRunnerCrowdRoutesRuntime,
} from './character/runner-crowd-routes.js';
import {
  createTronRunnerCrowdMaterialsRuntime,
} from './character/runner-crowd-materials.js';
import {
  TRON_RUNNER_CROWD_COLOR_PRESETS,
} from './character/character-colors.js';
import {
  TRON_RUNNER_CROWD_LINES,
  TRON_RUNNER_CROWD_TALK_DURATION_MS,
  TRON_RUNNER_CROWD_TALK_LINES_PER_MEMBER,
  TRON_RUNNER_CROWD_TALK_RANGE,
  TRON_RUNNER_CROWD_TALK_REARM_RANGE,
} from './character/runner-crowd-lines.js';
import {
  createTronRunnerReflectionRigRuntime,
} from './character/runner-reflection-rig.js';
import {
  resetTronRunnerAutonomy,
} from './character/runner-controller.js';
import {
  playTronRunnerAction,
  syncTronRunnerActionSetToDistance,
} from './character/runner-animation.js';
import {
  TRON_SOUNDTRACK_CROSSFADE_SECONDS,
  TRON_SOUNDTRACK_ENABLED,
  TRON_SOUNDTRACK_FADE_IN_SECONDS,
  TRON_SOUNDTRACK_INITIAL_START_SECONDS,
  TRON_SOUNDTRACK_INTRO_FX_CURVE_SIZE,
  TRON_SOUNDTRACK_INTRO_FX_DEFAULTS,
  TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS,
  TRON_SOUNDTRACK_INTRO_FX_MAX_NOISE_GAIN,
  TRON_SOUNDTRACK_INTRO_FX_MAX_WOBBLE_DEPTH_HZ,
  TRON_SOUNDTRACK_INTRO_FX_REVEAL_STOP_DELAY_MS,
  TRON_SOUNDTRACK_INTRO_FX_WOBBLE_RATE_HZ,
  TRON_SOUNDTRACK_LOOP_START_SECONDS,
  TRON_SOUNDTRACK_STOP_FADE_SECONDS,
  TRON_SOUNDTRACK_URL,
  TRON_SOUNDTRACK_VOLUME,
  TRON_SYNTH_MUSIC_BPM,
  TRON_SYNTH_MUSIC_ENABLED,
  TRON_SYNTH_MUSIC_LOOKAHEAD_MS,
  TRON_SYNTH_MUSIC_MASTER_GAIN,
  TRON_SYNTH_MUSIC_PATTERN_STEPS,
  TRON_SYNTH_MUSIC_SCHEDULE_AHEAD,
  TRON_SYNTH_MUSIC_STEP_SEC,
  applyTronSoundtrackIntroLofiMix as applyTronSoundtrackIntroLofiMixCore,
  createTronIntroBitcrushCurve as createTronIntroBitcrushCurveCore,
  createTronIntroDistortionCurve as createTronIntroDistortionCurveCore,
  createTronIntroNoiseBuffer,
  rampGain as rampGainCore,
  scheduleTronSoundtrackIntroLofiStopForReveal as scheduleTronSoundtrackIntroLofiStopForRevealCore,
  setAudioCurrentTime,
  setAudioParamSmooth as setAudioParamSmoothCore,
  setTronSoundtrackIntroLofi as setTronSoundtrackIntroLofiCore,
  stopTronSoundtrackIntroLofiForReveal as stopTronSoundtrackIntroLofiForRevealCore,
  syncTronIntroFxNodeSettings as syncTronIntroFxNodeSettingsCore,
  tronIntroFxEffectiveFilters as tronIntroFxEffectiveFiltersCore,
  createTronSoundtrackElement as createTronSoundtrackElementCore,
  setupTronSoundtrackGraph as setupTronSoundtrackGraphCore,
  tronSoundtrackLoopStart as tronSoundtrackLoopStartCore,
  pauseTronSoundtrackElement as pauseTronSoundtrackElementCore,
  startTronSoundtrackElement as startTronSoundtrackElementCore,
  crossfadeTronSoundtrack as crossfadeTronSoundtrackCore,
  monitorTronSoundtrackLoop as monitorTronSoundtrackLoopCore,
  startTronFileSoundtrack as startTronFileSoundtrackCore,
  stopTronFileSoundtrack as stopTronFileSoundtrackCore,
  setTronFileSoundtrackVolume as setTronFileSoundtrackVolumeCore,
} from './audio/audio.js';
import {
  footstepInverseDistanceGain,
  pickFootstepSample as pickFootstepSampleCore,
  setFootstepAudioParam,
  setFootstepPannerPosition,
} from './audio/footstep-audio.js';
import {
  mountSideFacadeLedControls as mountSideFacadeLedControlsCore,
} from './controls/facade-led-controls.js';
import { createBuildingLiveControlsRuntime } from './controls/building-live-controls.js';
import { createControlSettingsRuntime, setButtonFeedback } from './controls/control-settings-runtime.js';
import {
  effectiveBloomScaleForDevice as effectiveBloomScaleForDeviceCore,
  effectivePixelRatioForDevice as effectivePixelRatioForDeviceCore,
  effectiveRenderScaleForDevice as effectiveRenderScaleForDeviceCore,
  mobilePerformanceProfileActive as mobilePerformanceProfileActiveCore,
  mobilePerformanceProfileState as mobilePerformanceProfileStateCore,
} from './engine/performance-mobile.js';
import { createCityRevealProfiler } from './engine/city-reveal-profiler.js';
import { createPerformanceDiagnostics } from './engine/performance-diagnostics.js';
import {
  RETRO_BENCHMARK_DEFAULT_DURATION_MS,
  createRetroBenchmarkRuntime,
} from './engine/retro-benchmark.js';
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
  buildingColliders,
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
  mainFacadeVerticalRevealLedBounds,
  setFacadeLedRuntimeSettings,
  setMainFacadeVerticalRevealUniforms,
  sideBuildingLedLayoutInspect,
  updateFacadeLedRibbons,
  updateFacadeStripOutsets,
} from './world/facade-led-treatment.js';
import { createSkyDome } from './world/sky-dome.js';
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
  basePadAtPoint,
  basePadHexClipMesh,
  basePadLedBatch,
  createBuildingBasePad,
  getBasePadCurbEnabled,
  getBasePadHexOverlay,
  getBasePadMaterialResponse,
  initBasePads,
  pointInBasePadPolygon,
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
  setCharacterBubbleBackgroundOpacity,
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
  setGroundShape,
} from './world/ground-geometry.js';
import {
  applyBoundaryErrorVisualSettings,
  applyRoadBoundaryHexVisualSettings,
  boundaryErrorInspect,
  boundaryErrorNeedsUpdate,
  clearBoundaryError,
  getRoadBoundaryHexStats,
  getTronNoclipEnabled,
  initBoundaryError,
  setTronNoclip,
  triggerBoundaryError,
  triggerRoadBoundaryPulse,
  updateBoundaryError,
  updateRoadBoundaryHexMaterial,
  updateRoadBoundaryHexRows,
  updateRoadBoundaryPulse,
  updateRoadBoundaryPulseLayout,
} from './world/boundary-error.js';
import {
  computeDroneIntroTargetPose,
  droneIntroInspect,
  getDroneIntroActive,
  getDroneIntroProgress,
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
  mobileTouchControlsState,
  requestLandscapeFullscreen,
} from './controls/mobile-movement.js';
import {
  applyMovement,
  clearMovementKeys,
  clearVerticalMovementState,
  headBobOffset,
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
  sideSwayOffset,
  stepPhase,
  updateWalkSimulation,
} from './controls/movement.js';
import { initKeyboard, keys } from './controls/keyboard.js';
import {
  HEX_ROAD_EMPTY_BATCH_CULLING_ENABLED,
  HEX_ROAD_UPLOAD_BATCH_LIMIT,
  compactHexTileBatchesForTiles,
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
  setHexTileLayoutPosition,
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
  labEqualizerAnalyserPresent,
  labEqualizerAnalyserSampleReady,
  labEqualizerLastSampleTime,
} from './controls/equalizer.js';

// Postprocessing (optional bloom + FXAA). Best-effort — fallback to plain renderer if any module fails.
let composer = null, bloomPass = null, fxaaPass = null, fsrUpscalePass = null;
let postEnabled = true;
let usePost = false;
const mobilePerformanceQuery = window.matchMedia(MOBILE_PERFORMANCE_QUERY);

function physicalScreenSize() {
  const dpr = window.devicePixelRatio || 1;
  const screenWidth = Math.max(window.innerWidth, window.screen?.width || 0) * dpr;
  const screenHeight = Math.max(window.innerHeight, window.screen?.height || 0) * dpr;
  return {
    width: Math.round(screenWidth),
    height: Math.round(screenHeight),
  };
}

function adaptiveRenderTarget() {
  const screenSize = physicalScreenSize();
  const longEdge = Math.max(screenSize.width, screenSize.height);
  const shortEdge = Math.min(screenSize.width, screenSize.height);
  const fullHd = longEdge >= FULL_HD_RENDER_WIDTH && shortEdge >= FULL_HD_RENDER_HEIGHT;
  return fullHd
    ? { key: 'full-hd', width: FULL_HD_RENDER_WIDTH, height: FULL_HD_RENDER_HEIGHT }
    : { key: 'hd-ready', width: HD_READY_RENDER_WIDTH, height: HD_READY_RENDER_HEIGHT };
}

function adaptiveRenderTargetPixelRatio() {
  const target = adaptiveRenderTarget();
  const viewportWidth = Math.max(1, window.innerWidth || target.width);
  const viewportHeight = Math.max(1, window.innerHeight || target.height);
  return Math.max(
    MIN_DYNAMIC_PIXEL_RATIO,
    Math.min(
      window.devicePixelRatio || 1,
      target.width / viewportWidth,
      target.height / viewportHeight
    )
  );
}

function adaptiveRenderTargetInspect() {
  const target = adaptiveRenderTarget();
  return {
    ...target,
    screen: physicalScreenSize(),
    pixelRatioCap: Number(adaptiveRenderTargetPixelRatio().toFixed(3)),
  };
}

let activePixelRatio = Math.min(window.devicePixelRatio || 1, MAX_RENDER_PIXEL_RATIO, adaptiveRenderTargetPixelRatio());
let requestedPixelRatio = MAX_RENDER_PIXEL_RATIO;
let manualRenderScale = 1;
let requestedBloomResolutionScale = 0.32;
let bloomResolutionScale = 0.32;
let bloomEnabled = true;
let antialiasMode = 'fxaa';
let fsrUpscaleEnabled = false;
let fsrInternalScale = 1;
let fsrSharpness = 0;
let dynamicQualityScale = 1;
let performanceMode = 'auto';
let performanceAdjustCooldown = 0;
let lastAppliedRendererPixelRatio = -1;
let lastAppliedComposerPixelRatio = -1;
let lastBloomTargetKey = '';
let lastFxaaTargetKey = '';
let lastFsrTargetKey = '';
let cityRevealPerformanceProfileActive = false;
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
  usePost = true;
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
const controlEls = createControlEls();
const CHARACTER_BUBBLE_BG_OPACITY_RANGE_MULTIPLIER = 3;

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
renderer.setPixelRatio(activePixelRatio);
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
  getActivePixelRatio: () => activePixelRatio,
  getRequestedPixelRatio: () => requestedPixelRatio,
  getManualRenderScale: () => manualRenderScale,
  getDynamicQualityScale: () => dynamicQualityScale,
  getPerformanceMode: () => performanceMode,
  getBloomEnabled: () => bloomEnabled,
  getBloomPass: () => bloomPass,
  getFxaaPass: () => fxaaPass,
  getFsrUpscalePass: () => fsrUpscalePass,
  getAntialiasMode: () => antialiasMode,
  getBloomResolutionScale: () => bloomResolutionScale,
  getLastBloomTargetKey: () => lastBloomTargetKey,
  getLastFxaaTargetKey: () => lastFxaaTargetKey,
  getLastFsrTargetKey: () => lastFsrTargetKey,
  getFsrUpscaleEnabled: () => fsrUpscaleEnabled,
  getFsrInternalScale: () => fsrInternalScale,
  getFsrSharpness: () => fsrSharpness,
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
  getCityRevealPerformanceProfileActive: () => cityRevealPerformanceProfileActive,
  effectivePixelRatioForDevice,
  effectiveRenderScaleForDevice,
  effectiveComposerPixelRatio,
  mobilePerformanceProfileInspect,
  isBloomPassActive,
  isBloomRevealBypassed,
  shouldBypassBloomForRevealPerformance,
  isCityRevealPerformanceCritical,
});

const retroBenchmarkSearchParams = new URLSearchParams(window.location.search);
const retroBenchmarkQuerySeconds = Number(retroBenchmarkSearchParams.get('benchmarkSeconds'));
const retroBenchmarkDurationMs = Number.isFinite(retroBenchmarkQuerySeconds) && retroBenchmarkQuerySeconds > 0
  ? retroBenchmarkQuerySeconds * 1000
  : RETRO_BENCHMARK_DEFAULT_DURATION_MS;
let retroBenchmarkAutoStartPending = retroBenchmarkSearchParams.get('benchmark') === '1';
let retroBenchmarkPanelEl = null;
let retroBenchmarkCopyButton = null;
let retroBenchmarkDownloadButton = null;

function getRetroBenchmarkGpuInfo() {
  try {
    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      webglVersion: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function retroBenchmarkEnvironment() {
  return {
    browser: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency ?? null,
      deviceMemory: navigator.deviceMemory ?? null,
    },
    screen: {
      width: window.screen?.width ?? null,
      height: window.screen?.height ?? null,
      availWidth: window.screen?.availWidth ?? null,
      availHeight: window.screen?.availHeight ?? null,
      orientation: window.screen?.orientation?.type ?? null,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    },
    canvas: performanceDiagnostics.canvasSummary(),
    gpu: getRetroBenchmarkGpuInfo(),
    quality: {
      performanceMode,
      activePixelRatio,
      requestedPixelRatio,
      manualRenderScale,
      dynamicQualityScale,
      antialiasMode,
      bloomEnabled,
      bloomActive: isBloomPassActive(),
      bloomPassEnabled: Boolean(bloomPass?.enabled),
      bloomResolutionScale,
      composerActive: shouldUseComposer(),
      fsrUpscaleEnabled,
      fsrInternalScale,
      fsrSharpness,
      mobileProfile: mobilePerformanceProfileInspect(),
    },
    diagnostics: performanceDiagnostics.summary(latestMeasuredFps),
    hexRoad: hexRoadInspect(),
  };
}

function ensureRetroBenchmarkPanel() {
  if (retroBenchmarkPanelEl) return retroBenchmarkPanelEl;
  retroBenchmarkPanelEl = document.createElement('section');
  retroBenchmarkPanelEl.id = 'retro-benchmark-panel';
  retroBenchmarkPanelEl.className = 'retro-benchmark-panel';
  retroBenchmarkPanelEl.hidden = true;
  retroBenchmarkPanelEl.setAttribute('aria-live', 'polite');
  retroBenchmarkPanelEl.innerHTML = `
    <div class="retro-benchmark-head">
      <strong>Benchmark</strong>
      <span data-retro-benchmark-status>idle</span>
    </div>
    <div class="retro-benchmark-progress" aria-hidden="true"><span data-retro-benchmark-progress></span></div>
    <dl class="retro-benchmark-grid">
      <div><dt>FPS avg</dt><dd data-retro-benchmark-fps-avg>--</dd></div>
      <div><dt>FPS p5</dt><dd data-retro-benchmark-fps-p5>--</dd></div>
      <div><dt>Worst</dt><dd data-retro-benchmark-worst>--</dd></div>
      <div><dt>Draws</dt><dd data-retro-benchmark-draws>--</dd></div>
      <div><dt>Tris</dt><dd data-retro-benchmark-tris>--</dd></div>
      <div><dt>Frames</dt><dd data-retro-benchmark-frames>--</dd></div>
    </dl>
    <div class="retro-benchmark-actions">
      <button type="button" data-retro-benchmark-copy>Copia JSON</button>
      <button type="button" data-retro-benchmark-download>Scarica JSON</button>
      <button type="button" data-retro-benchmark-close>Chiudi</button>
    </div>
  `;
  retroBenchmarkCopyButton = retroBenchmarkPanelEl.querySelector('[data-retro-benchmark-copy]');
  retroBenchmarkDownloadButton = retroBenchmarkPanelEl.querySelector('[data-retro-benchmark-download]');
  retroBenchmarkCopyButton?.addEventListener('click', copyRetroBenchmarkJson);
  retroBenchmarkDownloadButton?.addEventListener('click', downloadRetroBenchmarkJson);
  retroBenchmarkPanelEl.querySelector('[data-retro-benchmark-close]')?.addEventListener('click', () => {
    retroBenchmarkPanelEl.hidden = true;
  });
  document.body.appendChild(retroBenchmarkPanelEl);
  return retroBenchmarkPanelEl;
}

function setRetroBenchmarkPanelText(selector, value) {
  const target = retroBenchmarkPanelEl?.querySelector(selector);
  if (target) target.textContent = value;
}

function formatRetroBenchmarkNumber(value, digits = 1) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : '--';
}

function renderRetroBenchmarkPanel(view) {
  const panel = ensureRetroBenchmarkPanel();
  const summary = view?.summary;
  const fps = summary?.fps || {};
  const frameMs = summary?.frameMs || {};
  const render = summary?.render || {};
  const elapsedSeconds = Math.round((view?.elapsedMs || 0) / 1000);
  const durationSeconds = Math.round((view?.durationMs || retroBenchmarkDurationMs) / 1000);
  const progress = durationSeconds > 0 ? Math.min(100, (elapsedSeconds / durationSeconds) * 100) : 0;

  panel.hidden = false;
  setRetroBenchmarkPanelText('[data-retro-benchmark-status]', `${view?.status || 'idle'} ${elapsedSeconds}s/${durationSeconds}s`);
  setRetroBenchmarkPanelText('[data-retro-benchmark-fps-avg]', formatRetroBenchmarkNumber(fps.avg));
  setRetroBenchmarkPanelText('[data-retro-benchmark-fps-p5]', formatRetroBenchmarkNumber(fps.p5));
  setRetroBenchmarkPanelText('[data-retro-benchmark-worst]', `${formatRetroBenchmarkNumber(frameMs.worst)}ms`);
  setRetroBenchmarkPanelText('[data-retro-benchmark-draws]', String(render.maxCalls ?? '--'));
  setRetroBenchmarkPanelText('[data-retro-benchmark-tris]', String(render.maxTriangles ?? '--'));
  setRetroBenchmarkPanelText('[data-retro-benchmark-frames]', String(summary?.frames ?? view?.frames ?? '--'));
  const progressEl = panel.querySelector('[data-retro-benchmark-progress]');
  if (progressEl) progressEl.style.width = `${progress}%`;
  const hasFrames = Boolean(summary?.frames);
  if (retroBenchmarkCopyButton) retroBenchmarkCopyButton.disabled = !hasFrames;
  if (retroBenchmarkDownloadButton) retroBenchmarkDownloadButton.disabled = !hasFrames;
}

async function writeRetroBenchmarkText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

async function copyRetroBenchmarkJson() {
  const exported = retroBenchmarkRuntime.exportJson();
  if (!exported?.text) return;
  await writeRetroBenchmarkText(exported.text);
  if (!retroBenchmarkCopyButton) return;
  retroBenchmarkCopyButton.textContent = 'Copiato';
  setTimeout(() => {
    if (retroBenchmarkCopyButton) retroBenchmarkCopyButton.textContent = 'Copia JSON';
  }, 1200);
}

function downloadRetroBenchmarkJson() {
  const exported = retroBenchmarkRuntime.exportJson();
  if (!exported?.text) return null;
  const blob = new Blob([exported.text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exported.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return exported;
}

const retroBenchmarkRuntime = createRetroBenchmarkRuntime({
  getEnvironment: retroBenchmarkEnvironment,
  onUpdate: renderRetroBenchmarkPanel,
  onComplete: (summary) => {
    renderRetroBenchmarkPanel(retroBenchmarkRuntime.inspect());
    console.info('[retro-benchmark]', summary);
  },
});

window.__retroBenchmarkStart = (options = {}) => {
  const requestedDurationMs = Number(options.durationMs);
  retroBenchmarkAutoStartPending = false;
  return retroBenchmarkRuntime.start({
    ...options,
    source: options.source || 'console',
    durationMs: Number.isFinite(requestedDurationMs) && requestedDurationMs > 0
      ? requestedDurationMs
      : retroBenchmarkDurationMs,
  });
};
window.__retroBenchmarkInspect = () => retroBenchmarkRuntime.inspect();
window.__retroBenchmarkDownload = () => downloadRetroBenchmarkJson();

function maybeStartRetroBenchmarkAuto() {
  if (!retroBenchmarkAutoStartPending || !cityRevealComplete) return;
  retroBenchmarkAutoStartPending = false;
  window.__retroBenchmarkStart({ source: 'query-param', durationMs: retroBenchmarkDurationMs });
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FIXED_CAMERA_FOV, window.innerWidth / window.innerHeight, 0.1, 10000);
// World/context object (design §4). composer is created later in the deferred postprocessing setup,
// so it is read through a late-bound getter. Subsystems are migrated onto ctx phase by phase.
const ctx = createCtx({ scene, camera, renderer, getComposer: () => composer });
camera.position.set(701.4907301468677, 591.0351224586902, 1110.9745792178219);
camera.lookAt(0, 80, -300);

function setFixedCameraFov() {
  if (camera.fov !== FIXED_CAMERA_FOV) {
    camera.fov = FIXED_CAMERA_FOV;
    camera.updateProjectionMatrix();
  }
  fovEl.textContent = FIXED_CAMERA_FOV.toFixed(0);
}

// ---------- free fly controls (WASD + mouse look pointer-lock + Q/E vertical + Shift sprint) ----------
let yaw, pitch;
{
  const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
  yaw = e.y;
  pitch = e.x;
}
const PLAYER_SPAWN_KEY = 'tron-boulevard-player-spawn';
const PLAYER_SPAWN_LEGACY_Z = 842.7866151854931;
const PLAYER_SPAWN_DEFAULT_Z = 866.7866151854931;
const DEFAULT_PLAYER_SPAWN = Object.freeze({
  x: 1021.9157138958009,
  y: 591.0351224586902,
  z: PLAYER_SPAWN_DEFAULT_Z,
  spawnYaw: 0.6598680604188623,
  spawnPitch: -0.4052322239066757,
});
const DRONE_LANDING_KEY = 'tron-boulevard-drone-landing';
const DEFAULT_DRONE_LANDING_POSE = Object.freeze({
  x: 0,
  y: 4.1,
  z: 828.8697008214727,
  spawnYaw: 0,
  spawnPitch: 0.24349025257385304,
  savedAt: '2026-06-09T13:01:07.101Z',
});
let playerSpawn = { ...DEFAULT_PLAYER_SPAWN };
let droneLandingPose = { ...DEFAULT_DRONE_LANDING_POSE };
const PITCH_LIMIT = Math.PI * 0.49;
const DEMO_START_KEY = 'Space';
let backspaceIntroTriggered = false;
let cameraCollisionUnlockedByBackspace = false;
let mouseSensitivityScale = 1;
let cameraMinHeight = 1.8;
let viewRoll = 0;
let tronDiscRevealWaitingActive = false;
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
const welcomeWindowMotionAllowed = false;
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

function triggerWelcomeButtonStart(event) {
  event.preventDefault();
  tronDiscRevealWaitingActive = true;
  setTronDiscCursorRevealWaiting(true, event);
  tronRevealWaitLabel?.classList.toggle('is-active', tronDiscRevealWaitingActive);
  triggerBackspaceDroneIntro('welcome-button');
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

// reused scratch (order 'YXZ') to avoid allocating a THREE.Euler on every applyCameraLook call
// (runs once per frame plus once per mousemove/touchmove)
const applyCameraLookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
function applyCameraLook() {
  applyCameraLookEuler.set(pitch, yaw, viewRoll);
  camera.quaternion.setFromEuler(applyCameraLookEuler);
}

const lockEl = renderer.domElement;
const DRAG_ACTIVATE_PX = 4;
const POINTER_LOCK_SETTLE_MS = 220;
const POINTER_CLICK_SUPPRESS_MS = 420;
initDiscCursor({
  tronDiscCursor,
  lockEl,
  getPointerLocked,
  getUnlockedMouseLookActive,
});

function lerpAngle(from, to, t) {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * t;
}

const TRON_MUSIC_START_DELAY_MS = 400;
function triggerBackspaceDroneIntro(source = 'backspace') {
  dismissWelcomeWindow();
  ensureFootstepAudioReady();
  // start the soundtrack 400ms after the reveal begins so the drop lands on the sweep.
  // ensureFootstepAudioReady() above unlocks the audio context on this gesture; sticky activation
  // keeps play() allowed for the delayed start.
  setTimeout(() => startTronProceduralMusic(source), TRON_MUSIC_START_DELAY_MS);
  if (!backspaceIntroTriggered) {
    backspaceIntroTriggered = true;
    cameraCollisionUnlockedByBackspace = true;
  }
  startCityRevealWireTimer();
  startDroneIntroFlight(source);
}

function syncTronDiscRevealWaiting() {
  const next = Boolean(tronDiscRevealWaitingActive && !cityRevealComplete);
  if (next === tronDiscCursorState.revealWaiting) return;
  tronDiscRevealWaitingActive = next;
  setTronDiscCursorRevealWaiting(tronDiscRevealWaitingActive);
  tronRevealWaitLabel?.classList.toggle('is-active', tronDiscRevealWaitingActive);
}

initMouseLook(ctx, {
  getYaw: () => yaw,
  setYaw: (v) => { yaw = v; },
  getPitch: () => pitch,
  setPitch: (v) => { pitch = v; },
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
  getMouseSensitivityScale: () => mouseSensitivityScale,
});

initMobileMovement({
  mobilePerformanceProfileActive,
  performanceDiagnosticsCanvasSummary: performanceDiagnostics.canvasSummary,
  applyViewportResize,
  mobileMovementPadEl,
  mobileMovementKnobEl,
});

// movement step in tick
let speedBase = 28;       // units / sec
let speedSprint = 90;
let backwardSpeedScale = 0.72;
let strafeSpeedScale = 0.86;
let diagonalSpeedScale = 1.0;
let verticalSpeed = 34;
let movementAcceleration = 12;
let movementDeceleration = 10;
let walkBobAmount = 0.16;
let runBobAmount = 0.34;
let strafeBobScale = 0.72;
let backwardBobScale = 0.55;
let walkStepRate = 1.75;
let runStepRate = 3.0;
let stepSnapAmount = 0.35;
let movementSwayAmount = 0.08;
let movementRollAmount = 0.018;
let strafeLeanAmount = 0.035;
let headMotionSmoothing = 18;
const appliedHeadMotion = new THREE.Vector3();
let walkSurfaceLift = 0;
let walkSurfaceKind = 'road';
let activeWalkSurfacePad = null;
const WALK_SURFACE_SNAP_TOLERANCE = 0.45;
const TRON_FOOTSTEP_BANKS = Object.freeze({
  road: [
    { side: 'right', key: 'ROUTER1A', url: 'audio/footsteps/road/ROUTER1A.wav' },
    { side: 'left', key: 'ROUTER1B', url: 'audio/footsteps/road/ROUTER1B.wav' },
    { side: 'right', key: 'ROUTER2A', url: 'audio/footsteps/road/ROUTER2A.wav' },
    { side: 'left', key: 'ROUTER2B', url: 'audio/footsteps/road/ROUTER2B.wav' },
  ],
  sidewalk: [
    { side: 'right', key: 'GLASS1A', url: 'audio/footsteps/sidewalk/GLASS1A.wav' },
    { side: 'left', key: 'GLASS1B', url: 'audio/footsteps/sidewalk/GLASS1B.wav' },
    { side: 'right', key: 'GLASS2A', url: 'audio/footsteps/sidewalk/GLASS2A.wav' },
    { side: 'left', key: 'GLASS2B', url: 'audio/footsteps/sidewalk/GLASS2B.wav' },
  ],
});
const FOOTSTEP_MIN_INTERVAL_MS = 105;
const FOOTSTEP_PLAYER_BUS = 'player-local';
const FOOTSTEP_NPC_SPATIAL_BUS = 'npc-spatial';
const FOOTSTEP_PLAYER_VOLUME_SCALE = 1.2;
const footstepBuffers = { road: [], sidewalk: [] };
const footstepSampleData = { road: [], sidewalk: [] };
const footstepVariantCursor = {
  road: { left: 0, right: 0 },
  sidewalk: { left: 0, right: 0 },
};
const footstepRequestedSampleCount = Object.values(TRON_FOOTSTEP_BANKS).reduce((sum, samples) => sum + samples.length, 0);
const footstepAudioForward = new THREE.Vector3();
const footstepAudioUp = new THREE.Vector3();
let footstepAudioContext = null;
let footstepAudioReadyPromise = null;
let footstepAudioPreloadPromise = null;
let footstepAudioError = '';
let footstepAudioDecodeStatus = 'idle';
let footstepAudioDecodedCount = 0;
let lastFootstepIndex = -1;
let lastFootstepPlayedAt = 0;
let footstepSideToggle = 0;
let lastFootstepSurface = 'road';
let lastFootstepSample = '';

function createFootstepAudioContext() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  return new AudioContextCtor();
}

function waitForNextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

async function preloadFootstepSampleData(surface, sample) {
  const response = await fetch(sample.url);
  if (!response.ok) throw new Error(`Footstep fetch failed: ${sample.url}`);
  const data = await response.arrayBuffer();
  return { ...sample, surface, data };
}

function preloadFootstepAudioData() {
  if (footstepAudioPreloadPromise) return footstepAudioPreloadPromise;
  footstepAudioDecodeStatus = 'preloading';
  footstepAudioPreloadPromise = Promise.all(
    Object.entries(TRON_FOOTSTEP_BANKS).map(async ([surface, samples]) => {
      footstepSampleData[surface] = await Promise.all(samples.map((sample) => preloadFootstepSampleData(surface, sample)));
    })
  ).then(() => {
    if (footstepAudioDecodeStatus === 'preloading') footstepAudioDecodeStatus = 'preloaded';
    return true;
  }).catch((error) => {
    footstepAudioError = error?.message || String(error);
    footstepAudioDecodeStatus = 'error';
    console.warn('[tron-footsteps]', footstepAudioError);
    return false;
  });
  return footstepAudioPreloadPromise;
}

async function decodeFootstepSample(sample) {
  const data = sample.data?.slice ? sample.data.slice(0) : sample.data;
  const buffer = await footstepAudioContext.decodeAudioData(data);
  return { side: sample.side, key: sample.key, url: sample.url, buffer };
}

async function decodeFootstepSamplesIncremental() {
  const preloaded = await preloadFootstepAudioData();
  if (!preloaded || !footstepAudioContext) return false;
  footstepAudioDecodeStatus = 'decoding';
  footstepAudioDecodedCount = 0;
  footstepBuffers.road = [];
  footstepBuffers.sidewalk = [];
  for (const surface of Object.keys(TRON_FOOTSTEP_BANKS)) {
    for (const sample of footstepSampleData[surface] || []) {
      footstepBuffers[surface].push(await decodeFootstepSample(sample));
      footstepAudioDecodedCount += 1;
      await waitForNextFrame();
    }
  }
  footstepAudioDecodeStatus = 'ready';
  return true;
}

function ensureFootstepAudioReady() {
  if (!footstepAudioContext) footstepAudioContext = createFootstepAudioContext();
  if (!footstepAudioContext) return Promise.resolve(false);
  if (footstepAudioContext.state === 'suspended') footstepAudioContext.resume().catch(() => {});
  if (!footstepAudioReadyPromise) {
    footstepAudioReadyPromise = decodeFootstepSamplesIncremental().catch((error) => {
      footstepAudioError = error?.message || String(error);
      footstepAudioDecodeStatus = 'error';
      console.warn('[tron-footsteps]', footstepAudioError);
      return false;
    });
  }
  return footstepAudioReadyPromise;
}

const tronSoundtrack = {
  playing: false,
  ready: false,
  activeIndex: 0,
  crossfading: false,
  startedAt: 0,
  startSource: '',
  duration: 0,
  targetVolume: TRON_SOUNDTRACK_VOLUME,
  timer: 0,
  loopCount: 0,
  lastLoopAt: 0,
  lastStartAt: 0,
  introLofiActive: false,
  introLofiStoppedByReveal: false,
  introLofiStartedAt: 0,
  introLofiStoppedAt: 0,
  introLofiRevealStopTimer: 0,
  introFx: { ...TRON_SOUNDTRACK_INTRO_FX_DEFAULTS },
  elements: [],
  sources: [],
  gains: [],
  dryGains: [],
  introLofiGains: [],
  introHighpassFilters: [],
  introLowpassFilters: [],
  introLofiShapers: [],
  introDistortionShapers: [],
  introLofiLfos: [],
  introLofiLfoGains: [],
  introNoiseSource: null,
  introNoiseGain: null,
  introNoiseFilter: null,
  introBitcrushCurveKey: '',
  introDistortionCurveKey: '',
  error: '',
};

function ensureTronAudioContext() {
  if (!footstepAudioContext) footstepAudioContext = createFootstepAudioContext();
  if (!footstepAudioContext) return null;
  if (footstepAudioContext.state === 'suspended') footstepAudioContext.resume().catch(() => {});
  return footstepAudioContext;
}

const tronSoundtrackDeps = {
  soundtrack: tronSoundtrack,
  getCtx: () => footstepAudioContext,
  ensureCtx: ensureTronAudioContext,
};

function createTronSoundtrackElement() {
  return createTronSoundtrackElementCore(tronSoundtrack);
}

function createTronIntroBitcrushCurve(bitDepth, crusher) {
  return createTronIntroBitcrushCurveCore(bitDepth, crusher, tronSoundtrack);
}

function createTronIntroDistortionCurve(amount) {
  return createTronIntroDistortionCurveCore(amount, tronSoundtrack);
}

function setAudioParamSmooth(param, value, seconds = 0.04) {
  setAudioParamSmoothCore(footstepAudioContext, param, value, seconds);
}

function tronIntroFxEffectiveFilters() {
  return tronIntroFxEffectiveFiltersCore(tronSoundtrack);
}

function syncTronIntroFxNodeSettings(fadeSeconds = 0.04) {
  return syncTronIntroFxNodeSettingsCore(tronSoundtrack, footstepAudioContext, fadeSeconds);
}

function applyTronSoundtrackIntroLofiMix(active, fadeSeconds = TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS) {
  return applyTronSoundtrackIntroLofiMixCore(tronSoundtrack, footstepAudioContext, active, fadeSeconds);
}

function setTronSoundtrackIntroLofi(active, fadeSeconds = TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS, stoppedByReveal = false) {
  return setTronSoundtrackIntroLofiCore(tronSoundtrack, footstepAudioContext, active, fadeSeconds, stoppedByReveal);
}

function scheduleTronSoundtrackIntroLofiStopForReveal(delayMs = TRON_SOUNDTRACK_INTRO_FX_REVEAL_STOP_DELAY_MS) {
  return scheduleTronSoundtrackIntroLofiStopForRevealCore(tronSoundtrack, () => footstepAudioContext, delayMs);
}

function stopTronSoundtrackIntroLofiForReveal() {
  return stopTronSoundtrackIntroLofiForRevealCore(tronSoundtrack, footstepAudioContext);
}

function setupTronSoundtrackGraph(ctx) {
  return setupTronSoundtrackGraphCore(tronSoundtrackDeps, ctx);
}

function tronSoundtrackLoopStart() {
  return tronSoundtrackLoopStartCore(tronSoundtrack);
}

function rampGain(gainNode, value, seconds, fromValue = null) {
  rampGainCore(footstepAudioContext, gainNode, value, seconds, fromValue);
}

function pauseTronSoundtrackElement(index) {
  return pauseTronSoundtrackElementCore(tronSoundtrack, index);
}

function startTronSoundtrackElement(index, startAt, fadeSeconds, volume = tronSoundtrack.targetVolume) {
  return startTronSoundtrackElementCore(tronSoundtrackDeps, footstepAudioContext, index, startAt, fadeSeconds, volume);
}

function crossfadeTronSoundtrack() {
  return crossfadeTronSoundtrackCore(tronSoundtrackDeps);
}

function monitorTronSoundtrackLoop() {
  return monitorTronSoundtrackLoopCore(tronSoundtrackDeps);
}

function startTronFileSoundtrack(source = 'manual') {
  return startTronFileSoundtrackCore(tronSoundtrackDeps, source);
}

function stopTronFileSoundtrack(fadeSeconds = TRON_SOUNDTRACK_STOP_FADE_SECONDS) {
  return stopTronFileSoundtrackCore(tronSoundtrackDeps, fadeSeconds);
}

function setTronFileSoundtrackVolume(value = TRON_SOUNDTRACK_VOLUME) {
  return setTronFileSoundtrackVolumeCore(tronSoundtrackDeps, value);
}

function startTronProceduralMusic(source = 'manual') {
  return startTronFileSoundtrack(source);
}

function stopTronProceduralMusic(fadeSeconds = 0.75) {
  return stopTronFileSoundtrack(fadeSeconds);
}

function setTronProceduralMusicVolume(value = TRON_SOUNDTRACK_VOLUME) {
  return setTronFileSoundtrackVolume(value);
}

function pickFootstepSample(surfaceKind, side) {
  return pickFootstepSampleCore(footstepBuffers, footstepVariantCursor, surfaceKind, side);
}

function syncFootstepAudioListener(now = footstepAudioContext?.currentTime ?? 0) {
  if (!footstepAudioContext?.listener) return;
  const listener = footstepAudioContext.listener;
  const pos = camera.position;
  footstepAudioForward.set(0, 0, -1).applyQuaternion(camera.quaternion);
  footstepAudioUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
  if ('positionX' in listener) {
    setFootstepAudioParam(listener.positionX, pos.x, now);
    setFootstepAudioParam(listener.positionY, pos.y, now);
    setFootstepAudioParam(listener.positionZ, pos.z, now);
    setFootstepAudioParam(listener.forwardX, footstepAudioForward.x, now);
    setFootstepAudioParam(listener.forwardY, footstepAudioForward.y, now);
    setFootstepAudioParam(listener.forwardZ, footstepAudioForward.z, now);
    setFootstepAudioParam(listener.upX, footstepAudioUp.x, now);
    setFootstepAudioParam(listener.upY, footstepAudioUp.y, now);
    setFootstepAudioParam(listener.upZ, footstepAudioUp.z, now);
  } else {
    listener.setPosition?.(pos.x, pos.y, pos.z);
    listener.setOrientation?.(
      footstepAudioForward.x,
      footstepAudioForward.y,
      footstepAudioForward.z,
      footstepAudioUp.x,
      footstepAudioUp.y,
      footstepAudioUp.z
    );
  }
}

function playFootstepForSurface(surfaceKind = walkSurfaceKind, intensity = 1, side = 'right', options = {}) {
  ensureFootstepAudioReady();
  if (!footstepAudioContext || !footstepBuffers.road.length) return false;
  const picked = pickFootstepSample(surfaceKind, side);
  if (!picked?.sample?.buffer) return false;

  const now = footstepAudioContext.currentTime;
  const source = footstepAudioContext.createBufferSource();
  const gain = footstepAudioContext.createGain();
  const tone = footstepAudioContext.createBiquadFilter();
  const bus = options.bus || FOOTSTEP_PLAYER_BUS;
  const spatialOrigin = options.spatialOrigin || null;
  const spatialized = Boolean(spatialOrigin && footstepAudioContext.createPanner);
  const panner = spatialized ? footstepAudioContext.createPanner() : null;
  const listenerPosition = camera.position;
  const distance = spatialOrigin
    ? Math.hypot(
      spatialOrigin.x - listenerPosition.x,
      spatialOrigin.y - listenerPosition.y,
      spatialOrigin.z - listenerPosition.z
    )
    : 0;
  const refDistance = Number(options.refDistance ?? 1);
  const maxDistance = Number(options.maxDistance ?? 10000);
  const rolloffFactor = Number(options.rolloffFactor ?? 1);
  const distanceModel = options.distanceModel || 'inverse';
  const distanceGain = distanceModel === 'inverse'
    ? footstepInverseDistanceGain(distance, refDistance, maxDistance, rolloffFactor)
    : 1;
  const surfaceVolume = picked.surface === 'sidewalk' ? 0.28 : 0.34;
  const surfaceRate = picked.surface === 'sidewalk' ? 1.03 : 0.96;
  const runLift = Number(options.runLift ?? THREE.MathUtils.lerp(1, 1.08, movementRunMix));
  const rateMultiplier = Number(options.rateMultiplier ?? 1);
  const minVolume = Number(options.minVolume ?? 0.03);
  const maxVolume = Number(options.maxVolume ?? 0.46);
  const volumeScale = Number(options.volumeScale ?? (bus === FOOTSTEP_PLAYER_BUS ? FOOTSTEP_PLAYER_VOLUME_SCALE : 1));
  const playbackRate = surfaceRate * runLift * rateMultiplier;
  const volume = THREE.MathUtils.clamp(surfaceVolume * intensity * volumeScale, minVolume, maxVolume);
  const lowpassFrequency = Number(options.lowpassFrequency ?? (picked.surface === 'sidewalk' ? 2650 : 2200));
  const fadeOutTime = Number(options.fadeOutTime ?? 0.24);

  if (panner) {
    syncFootstepAudioListener(now);
    panner.panningModel = options.panningModel || 'HRTF';
    panner.distanceModel = distanceModel;
    panner.refDistance = refDistance;
    panner.maxDistance = maxDistance;
    panner.rolloffFactor = rolloffFactor;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 1;
    setFootstepPannerPosition(panner, spatialOrigin, now);
  }

  source.buffer = picked.sample.buffer;
  source.playbackRate.setValueAtTime(playbackRate, now);
  tone.type = 'lowpass';
  tone.frequency.setValueAtTime(lowpassFrequency, now);
  tone.Q.setValueAtTime(0.55, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeOutTime);
  if (panner) {
    source.connect(tone).connect(panner).connect(gain).connect(footstepAudioContext.destination);
  } else {
    source.connect(tone).connect(gain).connect(footstepAudioContext.destination);
  }
  source.start(now);

  lastFootstepSurface = picked.surface;
  lastFootstepSample = picked.sample.key;
  if (options.returnDetails) {
    return {
      played: true,
      bus,
      spatialized,
      surface: picked.surface,
      sampleKey: picked.sample.key,
      gain: volume,
      distance,
      distanceGain,
      distanceModel: panner?.distanceModel || 'none',
      refDistance,
      maxDistance,
      rolloffFactor,
      playbackRate,
      lowpassFrequency,
      pan: distance > 0.001 ? THREE.MathUtils.clamp((spatialOrigin.x - listenerPosition.x) / distance, -1, 1) : 0,
      syncSource: options.syncSource || 'player-cadence',
    };
  }
  return true;
}

function resetFootstepCadence() {
  lastFootstepIndex = Math.floor(stepPhase / Math.PI);
}

function updateFootstepAudioFromWalk(moveFactor) {
  const nextStepIndex = Math.floor(stepPhase / Math.PI);
  if (
    moveFactor < 0.08 ||
    isCameraCollisionDisabled() ||
    Math.abs(camera.position.y - (cameraMinHeight + walkSurfaceLift)) > WALK_SURFACE_SNAP_TOLERANCE + 0.35
  ) {
    lastFootstepIndex = nextStepIndex;
    return;
  }
  if (nextStepIndex === lastFootstepIndex) return;
  lastFootstepIndex = nextStepIndex;
  const now = performance.now();
  if (now - lastFootstepPlayedAt < FOOTSTEP_MIN_INTERVAL_MS) return;
  lastFootstepPlayedAt = now;
  footstepSideToggle = 1 - footstepSideToggle;
  const side = footstepSideToggle ? 'right' : 'left';
  const intensity = THREE.MathUtils.clamp(0.42 + moveFactor * 0.58 + movementRunMix * 0.18, 0.2, 1.1);
  playFootstepForSurface(walkSurfaceKind, intensity, side);
}

window.__tronFootstepInspect = () => ({
  contextState: footstepAudioContext?.state || 'not-created',
  ready: Boolean(footstepBuffers.road.length && footstepBuffers.sidewalk.length),
  preloadStarted: Boolean(footstepAudioPreloadPromise),
  decodeStatus: footstepAudioDecodeStatus,
  decodedCount: footstepAudioDecodedCount,
  requestedCount: footstepRequestedSampleCount,
  preloadedCount: Object.values(footstepSampleData).reduce((sum, samples) => sum + samples.length, 0),
  error: footstepAudioError,
  surface: walkSurfaceKind,
  lastSurface: lastFootstepSurface,
  lastSample: lastFootstepSample,
  banks: Object.fromEntries(Object.entries(TRON_FOOTSTEP_BANKS).map(([surface, samples]) => [
    surface,
    samples.map((sample) => sample.key),
  ])),
});

window.__tronMusicStart = startTronProceduralMusic;
window.__tronMusicStop = stopTronProceduralMusic;
window.__tronMusicSetVolume = setTronProceduralMusicVolume;
window.__tronMusicForceCrossfade = crossfadeTronSoundtrack;
window.__tronMusicInspect = () => ({
  enabled: TRON_SOUNDTRACK_ENABLED,
  mode: 'file-crossfade',
  url: TRON_SOUNDTRACK_URL,
  contextState: footstepAudioContext?.state || 'not-created',
  ready: tronSoundtrack.ready,
  playing: tronSoundtrack.playing,
  activeIndex: tronSoundtrack.activeIndex,
  crossfading: tronSoundtrack.crossfading,
  duration: Number((tronSoundtrack.duration || 0).toFixed(3)),
  currentTime: Number((tronSoundtrack.elements[tronSoundtrack.activeIndex]?.currentTime || 0).toFixed(3)),
  targetVolume: tronSoundtrack.targetVolume,
  activeGain: Number((tronSoundtrack.gains[tronSoundtrack.activeIndex]?.gain?.value || 0).toFixed(4)),
  introFx: {
    ...tronSoundtrack.introFx,
    active: tronSoundtrack.introLofiActive,
    stoppedByReveal: tronSoundtrack.introLofiStoppedByReveal,
    revealStopDelayMs: TRON_SOUNDTRACK_INTRO_FX_REVEAL_STOP_DELAY_MS,
    revealStopPending: Boolean(tronSoundtrack.introLofiRevealStopTimer),
    dryGain: Number((tronSoundtrack.dryGains[tronSoundtrack.activeIndex]?.gain?.value || 0).toFixed(4)),
    wetGain: Number((tronSoundtrack.introLofiGains[tronSoundtrack.activeIndex]?.gain?.value || 0).toFixed(4)),
    lfoGain: Number((tronSoundtrack.introLofiLfoGains[tronSoundtrack.activeIndex]?.gain?.value || 0).toFixed(2)),
    noiseGain: Number((tronSoundtrack.introNoiseGain?.gain?.value || 0).toFixed(4)),
    effectiveFilters: tronIntroFxEffectiveFilters(),
    wobbleRateHz: TRON_SOUNDTRACK_INTRO_FX_WOBBLE_RATE_HZ,
    maxWobbleDepthHz: TRON_SOUNDTRACK_INTRO_FX_MAX_WOBBLE_DEPTH_HZ,
    fadeSeconds: TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS,
  },
  loopStartSeconds: tronSoundtrackLoopStart(),
  initialStartSeconds: TRON_SOUNDTRACK_INITIAL_START_SECONDS,
  requestedLoopStartSeconds: TRON_SOUNDTRACK_LOOP_START_SECONDS,
  crossfadeSeconds: TRON_SOUNDTRACK_CROSSFADE_SECONDS,
  loopCount: tronSoundtrack.loopCount,
  timerActive: Boolean(tronSoundtrack.timer),
  startSource: tronSoundtrack.startSource,
  lastStartAt: Number(tronSoundtrack.lastStartAt.toFixed(3)),
  error: tronSoundtrack.error,
});

function removeViewMotionOffset() {
  if (appliedHeadMotion.lengthSq() <= 0) return;
  camera.position.sub(appliedHeadMotion);
  appliedHeadMotion.set(0, 0, 0);
}

function applyViewMotionOffset() {
  appliedHeadMotion.set(
    Math.cos(yaw) * sideSwayOffset,
    headBobOffset,
    -Math.sin(yaw) * sideSwayOffset
  );
  camera.position.add(appliedHeadMotion);
}

function walkSurfaceLiftAt(x, z) {
  const padHit = basePadAtPoint(x, z);
  activeWalkSurfacePad = padHit?.pad || null;
  walkSurfaceKind = padHit ? 'sidewalk' : 'road';
  if (!padHit) return 0;
  return Math.max(0, (padHit.topY ?? roadTileTopY()) - roadTileTopY());
}

function cameraGroundHeightAt(x, z) {
  return cameraMinHeight + walkSurfaceLiftAt(x, z);
}

function resolveCameraWalkSurface(hasVerticalInput) {
  if (isCameraCollisionDisabled()) return;
  const previousGroundY = cameraMinHeight + walkSurfaceLift;
  const targetGroundY = cameraGroundHeightAt(camera.position.x, camera.position.z);
  const closeToWalkSurface = camera.position.y <= Math.max(previousGroundY, targetGroundY) + WALK_SURFACE_SNAP_TOLERANCE;

  if (camera.position.y < targetGroundY || (!hasVerticalInput && closeToWalkSurface)) {
    camera.position.y = targetGroundY;
    if (movementVelocity.y < 0 || !hasVerticalInput) movementVelocity.y = 0;
  }

  walkSurfaceLift = Math.max(0, targetGroundY - cameraMinHeight);
}

// ---------- reflection environment + solid visible sky ----------
// bakeTronReflectionMap moved to ./reflection-env.js (see initReflectionEnv below).

const skyDome = createSkyDome({
  scene,
  camera,
  renderer,
  controlEls,
  tunedColor,
  getRevealBudgetActive: () => cityRevealWireframeEnabled && !cityRevealComplete,
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
const reflectionEnvMap = getReflectionEnvMap();
scene.environment = null;
scene.environmentIntensity = 1;

// ---------- material texture helpers (extracted -> material-textures.js) ----------
initMaterialTextures(ctx);
const asphalt = makeWetAsphaltFacadeTexture();
initHexTileMaterials();
const basePadSurfaceTex = makeBasePadSurfaceTexture();

// ---------- Exact boulevard map constants (pure values -> world/boulevard-constants.js) ----------
// The road band is seeded for the CURRENT control values; ensureHexRoadTileCoverage
// (called from updateMainRoadLength) tops it up when sliders grow the requirement,
// so the old slider-extreme constants (DYNAMIC_ROAD_MAX_LENGTH & co.) are gone.
let streetEdgeWidth = 0;
let sideBuildingWidthScale = 2;
let sideBuildingDepthScale = 1;
let sideBuildingSpacingScale = 1;
let mainBuildingWidthScale = 2;
let mainBuildingDepthScale = 1;
let mainBuildingZ = MAIN_BUILDING_Z;
let mainBuildingY = 0;
let mainBuildingSaturation = 1.2;
let boulevardWidthScale = 1;
let sideBuildingBasePadScale = 1.12;
let sideBuildingBasePadXScale = 1;
let sideBuildingBasePadY = DEFAULT_BASE_PAD_Y;
let sideBuildingBasePadThickness = DEFAULT_BASE_PAD_THICKNESS;
let sideBuildingBasePadCut = 10;
let sideBuildingBasePadRadius = 1.2;
let mainBuildingBasePadScale = 1.12;
let mainBuildingBasePadXScale = 1;
let mainBuildingBasePadZScale = 1;
let mainBuildingBasePadY = DEFAULT_BASE_PAD_Y;
let mainBuildingBasePadThickness = DEFAULT_BASE_PAD_THICKNESS;
let mainBuildingBasePadCut = 12;
let mainBuildingBasePadRadius = 1.5;
let crossRoadWidth = SIDE_ROAD_WIDTH;
let crossStreetEdgeWidth = 0;
let dynamicRoadLength = MAIN_ROAD_LENGTH;
let dynamicRoadCenter = MAIN_ROAD_Z;
let roadSideHexExtraRows = 3;

function sideBuildingVisualWidth() {
  return SIDE_BUILDING_BASE * sideBuildingWidthScale;
}

function sideBuildingZSpacing() {
  return SIDE_BUILDING_SPACING * sideBuildingSpacingScale;
}

function safeSideBuildingSpacingScale(requestedScale, depthScale) {
  const input = controlEls?.sideBuildingSpacingScale;
  const min = Number(input?.min ?? 1);
  const max = Number(input?.max ?? 8);
  const requested = Number.isFinite(requestedScale) ? requestedScale : min;
  const depth = Number.isFinite(depthScale) ? Math.max(0.01, depthScale) : 1;
  const noOverlapScale = (SIDE_BUILDING_BASE * depth + SIDE_BUILDING_MIN_CLEARANCE) / SIDE_BUILDING_SPACING;
  return THREE.MathUtils.clamp(Math.max(requested, noOverlapScale), min, max);
}

function sideBuildingVisualDepth() {
  return SIDE_BUILDING_BASE * sideBuildingDepthScale;
}

function boulevardRoadWidth(scale = boulevardWidthScale) {
  return MAIN_ROAD_WIDTH * scale;
}

function roadHalf(scale = boulevardWidthScale) {
  return boulevardRoadWidth(scale) / 2;
}

function sideBuildingX(sign) {
  return sign * (roadHalf() + streetEdgeWidth + sideBuildingVisualWidth() / 2);
}

function crossStreetVisualLength(width = streetEdgeWidth, sideWidth = sideBuildingVisualWidth(), roadWidthScale = boulevardWidthScale) {
  return 2 * (roadHalf(roadWidthScale) + width + sideWidth);
}

function crossStreetSideSegmentLength(width = streetEdgeWidth, sideWidth = sideBuildingVisualWidth()) {
  return Math.max(0.01, width + sideWidth);
}

function roadSideHexExtraWidth(rows = roadSideHexExtraRows) {
  return Math.max(0, rows) * GRID_BLOCK;
}

function sideBuildingBasePadWidthForRoad(nextSideWidthScale = sideBuildingWidthScale, nextSideDepthScale = sideBuildingDepthScale, padScale = sideBuildingBasePadScale, padXScale = sideBuildingBasePadXScale) {
  const footprintWidth = SIDE_BUILDING_BASE * nextSideWidthScale;
  const footprintDepth = SIDE_BUILDING_BASE * nextSideDepthScale;
  return Math.max(footprintWidth, footprintDepth) * padScale * padXScale;
}

function mainBuildingBasePadWidthForRoad(nextMainWidthScale = mainBuildingWidthScale, nextMainDepthScale = mainBuildingDepthScale, padScale = mainBuildingBasePadScale, padXScale = mainBuildingBasePadXScale) {
  const footprintWidth = MAIN_BUILDING_BASE * nextMainWidthScale;
  const footprintDepth = MAIN_BUILDING_BASE * nextMainDepthScale;
  return Math.max(footprintWidth, footprintDepth) * padScale * padXScale;
}

function roadSurfaceWidthForBuildings(
  nextSideWidthScale = sideBuildingWidthScale,
  nextMainWidthScale = mainBuildingWidthScale,
  width = streetEdgeWidth,
  roadWidthScale = boulevardWidthScale,
  nextSideDepthScale = sideBuildingDepthScale,
  nextSidePadScale = sideBuildingBasePadScale,
  nextSidePadXScale = sideBuildingBasePadXScale,
  nextMainDepthScale = mainBuildingDepthScale,
  nextMainPadScale = mainBuildingBasePadScale,
  nextMainPadXScale = mainBuildingBasePadXScale,
  nextSideHexExtraRows = roadSideHexExtraRows
) {
  const baseRoadWidth = boulevardRoadWidth(roadWidthScale);
  const sideFootprintWidth = SIDE_BUILDING_BASE * nextSideWidthScale;
  const sidePadWidth = sideBuildingBasePadWidthForRoad(nextSideWidthScale, nextSideDepthScale, nextSidePadScale, nextSidePadXScale);
  const mainFootprintWidth = MAIN_BUILDING_BASE * nextMainWidthScale;
  const mainPadWidth = mainBuildingBasePadWidthForRoad(nextMainWidthScale, nextMainDepthScale, nextMainPadScale, nextMainPadXScale);
  const extraWidth = roadSideHexExtraWidth(nextSideHexExtraRows);
  const sideSpan = baseRoadWidth + 2 * (width + sideFootprintWidth / 2 + sidePadWidth / 2 + extraWidth);
  const mainSpan = Math.max(mainFootprintWidth, mainPadWidth) + extraWidth * 2;
  return Math.max(baseRoadWidth, sideSpan, mainSpan);
}

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
const roadBaseY = -1.55;
const ROAD_BACKING_EDGE_INSET = GRID_BLOCK;
function roadBackingWidth(width = dynamicRoadSurfaceWidth) {
  return Math.max(MAIN_ROAD_WIDTH * 0.25, width - ROAD_BACKING_EDGE_INSET * 2);
}
function roadBackingLength(length = dynamicRoadLength) {
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
  getBasePadHexOverlay,
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
  const mainMin = mainBuildingZ - mainHalfD - MAX_DYNAMIC_ROAD_MARGIN;
  const mainMax = mainBuildingZ + mainHalfD + MAX_DYNAMIC_ROAD_MARGIN;
  if (mainBuildingZ <= MAIN_ROAD_Z) {
    minZ = Math.min(minZ, mainMin - mainBuildingSideBoulevardExtension());
    maxZ = Math.max(maxZ, mainMax);
  } else {
    minZ = Math.min(minZ, mainMin);
    maxZ = Math.max(maxZ, mainMax + mainBuildingSideBoulevardExtension());
  }
  return { center: (minZ + maxZ) / 2, length: maxZ - minZ };
}

function updateMainRoadLength(centerZ, length) {
  dynamicRoadCenter = centerZ;
  dynamicRoadLength = length;
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

const ROAD_BOUNDARY_ROW_MAX = 10;
const roadBoundaryHexRowOffsets = Array.from({ length: ROAD_BOUNDARY_ROW_MAX }, () => 0);
let roadBoundaryCollisionEnabled = true;
let roadBoundaryCollisionMargin = 1.2;
let roadBoundaryCameraLead = 8;
const roadBoundaryProbeVelocity = new THREE.Vector3();

function isCameraCollisionDisabled() {
  return !cameraCollisionUnlockedByBackspace || getTronNoclipEnabled() || getDroneIntroActive();
}

function roadHexBoundaryLimits() {
  const halfW = dynamicRoadSurfaceWidth / 2;
  const halfL = dynamicRoadLength / 2;
  const centerZ = dynamicRoadCenter;
  const margin = Math.max(roadBoundaryCollisionMargin, hexTileRadius * getHexTileScale() * 0.22);
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
  const initialRoadBounds = computeDynamicRoadBounds(sideBuildingSpacingScale, sideBuildingDepthScale, mainBuildingDepthScale);
  dynamicRoadCenter = initialRoadBounds.center;
  dynamicRoadLength = initialRoadBounds.length;
}
const mainRoadTiles = addHexRoadTiles(dynamicRoadSurfaceWidth, dynamicRoadLength, 0, dynamicRoadCenter);
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
  getDynamicRoadLength: () => dynamicRoadLength,
  getDynamicRoadCenter: () => dynamicRoadCenter,
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
  getYaw: () => yaw,
  setYaw: (v) => { yaw = v; },
  getPitch: () => pitch,
  setPitch: (v) => { pitch = v; },
  getViewRoll: () => viewRoll,
  setViewRoll: (v) => { viewRoll = v; },
  setHeadBobOffset,
  setSideSwayOffset,
  setMovementHorizontalSpeed,
  setMovementRunMix,
  getLast: () => last,
  getDroneLandingPose: () => droneLandingPose,
  getSideBuildingRecords: () => sideBuildingRecords,
  getSideBuildingDepthScale: () => sideBuildingDepthScale,
  getDynamicRoadCenter: () => dynamicRoadCenter,
  getDynamicRoadLength: () => dynamicRoadLength,
});

initMovement(ctx, {
  keys,
  getSpeedBase: () => speedBase,
  getSpeedSprint: () => speedSprint,
  getBackwardSpeedScale: () => backwardSpeedScale,
  getStrafeSpeedScale: () => strafeSpeedScale,
  getDiagonalSpeedScale: () => diagonalSpeedScale,
  getVerticalSpeed: () => verticalSpeed,
  getMovementAcceleration: () => movementAcceleration,
  getMovementDeceleration: () => movementDeceleration,
  resolveCameraBuildingCollision,
  resolveCameraCrowdCollision,
  resolveCameraRoadHexBoundaryCollision,
  resolveCameraWalkSurface,
  getHeadMotionSmoothing: () => headMotionSmoothing,
  getWalkBobAmount: () => walkBobAmount,
  getRunBobAmount: () => runBobAmount,
  getStrafeBobScale: () => strafeBobScale,
  getBackwardBobScale: () => backwardBobScale,
  getWalkStepRate: () => walkStepRate,
  getRunStepRate: () => runStepRate,
  getStepSnapAmount: () => stepSnapAmount,
  getMovementSwayAmount: () => movementSwayAmount,
  getMovementRollAmount: () => movementRollAmount,
  getStrafeLeanAmount: () => strafeLeanAmount,
  getViewRoll: () => viewRoll,
  setViewRoll: (v) => { viewRoll = v; },
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
  getBackspaceIntroTriggered: () => backspaceIntroTriggered,
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
const streetEdgeLPlane = new THREE.PlaneGeometry(streetEdgeWidth, Z_FLOOR_LEN);
const streetEdgeLeft  = new THREE.Mesh(streetEdgeLPlane, streetEdgeMat);
const streetEdgeRight = new THREE.Mesh(streetEdgeLPlane, streetEdgeMat);
streetEdgeLeft.rotation.x  = -Math.PI / 2;
streetEdgeRight.rotation.x = -Math.PI / 2;
streetEdgeLeft.position.set( -(roadHalf() + streetEdgeWidth / 2), 0.10, Z_FLOOR_CENTER);
streetEdgeRight.position.set( roadHalf() + streetEdgeWidth / 2,   0.10, Z_FLOOR_CENTER);
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

function cornerBevelLength(width) {
  return Math.max(0.01, Math.min(width, crossStreetEdgeWidth));
}

function cornerPadPoints(sideSign, zSign, z, width) {
  const half = roadHalf();
  const base = [
    [half, crossRoadWidth / 2],
    [half + width, crossRoadWidth / 2],
    [half + width, crossRoadWidth / 2 + crossStreetEdgeWidth],
    [half, crossRoadWidth / 2 + crossStreetEdgeWidth],
  ];
  return base.map(([x, dz]) => [sideSign * x, z + zSign * dz]);
}

function cornerDiagonalPoints(sideSign, zSign, z, width) {
  const half = roadHalf();
  const miter = cornerBevelLength(width);
  return [
    [sideSign * half, z + zSign * (crossRoadWidth / 2)],
    [sideSign * (half + miter), z + zSign * (crossRoadWidth / 2 + miter)],
  ];
}

function cornerRoadPerimeterSegments(sideSign, zSign, z, width) {
  const half = roadHalf();
  const roadEdge = crossRoadWidth / 2;
  const streetEdgeEdge = crossRoadWidth / 2 + crossStreetEdgeWidth;
  const localSegments = [
    [[half, roadEdge], [half + width, roadEdge]],
    [[half, roadEdge], [half, streetEdgeEdge]],
  ];
  return localSegments.map(([a, b]) => [
    [sideSign * a[0], z + zSign * a[1]],
    [sideSign * b[0], z + zSign * b[1]],
  ]);
}

function cornerCutPoints(sideSign, zSign, z, width) {
  const half = roadHalf();
  const cutX = Math.min(Math.max(width * 0.62, 6), 16);
  const cutZ = Math.min(Math.max(crossStreetEdgeWidth * 0.72, 6), 14);
  const base = [
    [half, crossRoadWidth / 2],
    [half + cutX, crossRoadWidth / 2],
    [half, crossRoadWidth / 2 + cutZ],
  ];
  return base.map(([x, dz]) => [sideSign * x, z + zSign * dz]);
}

function mainStreetEdgeRoadMaskPoints(sideSign, z, width) {
  const half = roadHalf();
  const base = [
    [half, -crossRoadWidth / 2],
    [half + width, -crossRoadWidth / 2],
    [half + width, crossRoadWidth / 2],
    [half, crossRoadWidth / 2],
  ];
  return base.map(([x, dz]) => [sideSign * x, z + dz]);
}

function pointInPolygon2D(x, z, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], zi = polygon[i][1];
    const xj = polygon[j][0], zj = polygon[j][1];
    const crosses = (zi > z) !== (zj > z);
    if (crosses) {
      const xAtZ = ((xj - xi) * (z - zi)) / ((zj - zi) || 1e-6) + xi;
      if (x < xAtZ) inside = !inside;
    }
  }
  return inside;
}

function applyTilePolygonClip(tiles, polygon, isVisible = true) {
  for (const tile of tiles) {
    tile.visible = tile.visible && isVisible && pointInPolygon2D(tile.userData.x, tile.userData.z, polygon);
  }
}

function intersectionTracePoints(z) {
  const rx = roadHalf() * 0.62;
  const rz = Math.max(12, crossRoadWidth * 0.48);
  const cut = Math.min(10, rz * 0.45);
  return [
    [-rx, z - rz + cut],
    [-rx + cut, z - rz],
    [rx - cut, z - rz],
    [rx, z - rz + cut],
    [rx, z + rz - cut],
    [rx - cut, z + rz],
    [-rx + cut, z + rz],
    [-rx, z + rz - cut],
  ];
}

const buildingStreetEdgeRecords = [];
let mainBuildingStreetEdgeRecord = null;
const STREET_EDGE_BLOCK_MAX_DEPTH = SIDE_BUILDING_BASE * MAX_BUILDING_AXIS_SCALE;

function streetEdgeBlockVisualDepth(nextSideDepthScale = sideBuildingDepthScale, nextSideSpacingScale = sideBuildingSpacingScale) {
  const targetDepth = SIDE_BUILDING_BASE * nextSideDepthScale;
  const streetGap = crossRoadWidth + crossStreetEdgeWidth * 2;
  const maxWithoutOverlap = SIDE_BUILDING_SPACING * nextSideSpacingScale - streetGap - GRID_BLOCK * 0.5;
  return Math.max(GRID_BLOCK, Math.min(targetDepth, maxWithoutOverlap));
}

function streetEdgeBlockPoints(sign, z, width, depth) {
  const half = roadHalf();
  const innerX = sign * half;
  const outerX = sign * (half + width);
  const z0 = z - depth / 2;
  const z1 = z + depth / 2;
  return [
    [innerX, z0],
    [outerX, z0],
    [outerX, z1],
    [innerX, z1],
  ];
}

function mainBuildingStreetEdgePoints(z = mainBuildingZ, width = streetEdgeWidth, nextMainWidthScale = mainBuildingWidthScale, nextMainDepthScale = mainBuildingDepthScale) {
  const buildingWidth = MAIN_BUILDING_BASE * nextMainWidthScale;
  const buildingDepth = MAIN_BUILDING_BASE * nextMainDepthScale;
  const frontZ = z + buildingDepth / 2;
  const outerZ = frontZ + Math.max(0.01, width);
  const halfW = buildingWidth / 2;
  return [
    [-halfW, frontZ],
    [halfW, frontZ],
    [halfW, outerZ],
    [-halfW, outerZ],
  ];
}

// Cross streets — true intersections in the gaps between the building rows.
const sideRoadRecords = [];
const CROSS_STREET_MAX_LENGTH = 2 * (MAIN_ROAD_WIDTH * MAX_BOULEVARD_WIDTH_SCALE / 2 + STREET_EDGE_WIDTH_MAX + SIDE_BUILDING_BASE * MAX_BUILDING_AXIS_SCALE);
// ---------- Tron energy pulses (extracted -> energy-pulse.js) ----------

// ---------- RoadEdge EL strips (cyan tube borders between road and streetEdge) ----------
const longitudinalRoadEdgeRecords = [];
{
  function addLongitudinalRoadEdgeSegments(sign, kind, mat, width, height) {
    for (let i = 0; i <= sideRoadRecords.length; i++) {
      const segment = new THREE.Mesh(new THREE.BoxGeometry(width, height, 1), mat);
      segment.position.set(sign * (kind === 'inner' ? roadHalf() : roadHalf() + streetEdgeWidth), kind === 'inner' ? 0.38 : 0.36, Z_FLOOR_CENTER);
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

// Crosswalk/racetrack markings from demo-5 intentionally removed: this variant
// keeps only the exact boulevard road network.

// soft fills (low — let env + emissives carry mood)
const ambientLight = new THREE.HemisphereLight(0x182a32, 0x02050a, 0.10);
scene.add(ambientLight);
const dirKey = new THREE.DirectionalLight(0x6ec8e6, 0.18);
dirKey.position.set(40, 220, 120);
scene.add(dirKey);

// ---------- Tron overlay buildings ----------
const overlayGroup = new THREE.Group();
scene.add(overlayGroup);
let collisionPadding = 3;
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
let mainBuildingCollisionPadding = 7.4;
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
  getSideBuildingWidthScale: () => sideBuildingWidthScale,
  getSideBuildingDepthScale: () => sideBuildingDepthScale,
  getMainBuildingWidthScale: () => mainBuildingWidthScale,
  getMainBuildingDepthScale: () => mainBuildingDepthScale,
});
const bridges = createBridgeRuntime({
  overlayGroup,
  PAL,
  bridgeMaterials,
  getRoadHalf: roadHalf,
  getSideBuildingWidthScale: () => sideBuildingWidthScale,
  getStreetEdgeWidth: () => streetEdgeWidth,
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
  getMainBuildingY: () => mainBuildingY,
  getMainBuildingZ: () => mainBuildingZ,
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

function resolveCameraBuildingCollision() {
  if (isCameraCollisionDisabled()) return;
  if (!buildingColliders.length) return;
  for (const c of buildingColliders) {
    const padding = c.role === 'main-building' ? mainBuildingCollisionPadding : collisionPadding;
    if (padding < 0) continue;
    const bottomY = c.y ?? 0;
    if (camera.position.y < bottomY - 2 || camera.position.y > bottomY + c.h + 4) continue;
    resolveRoundedRectCollider(c, padding);
  }
}

// Player-vs-person stop distance (centre to centre). Tight so you can get nearly
// shoulder-to-shoulder before being blocked, unlike the wall collision padding.
const TRON_RUNNER_CROWD_PLAYER_COLLISION_DISTANCE = 1.6;
function resolveCameraCrowdCollision() {
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

function resolveCameraRoadHexBoundaryCollision() {
  if (isCameraCollisionDisabled()) return;
  if (!roadBoundaryCollisionEnabled) return;
  const limits = roadHexBoundaryLimits();
  let probeX = camera.position.x;
  let probeZ = camera.position.z;
  if (roadBoundaryCameraLead > 0 && hasRoadBoundaryLeadInput()) {
    roadBoundaryProbeVelocity.set(movementVelocity.x, 0, movementVelocity.z);
    if (roadBoundaryProbeVelocity.lengthSq() > 1e-4) {
      roadBoundaryProbeVelocity.normalize();
      probeX += roadBoundaryProbeVelocity.x * roadBoundaryCameraLead;
      probeZ += roadBoundaryProbeVelocity.z * roadBoundaryCameraLead;
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

let tronRunnerReveal = null;

function tronRunnerRevealIsComplete() {
  return tronRunnerReveal?.isComplete() ?? !TRON_RUNNER_REVEAL_ENABLED;
}

function tronRunnerRevealStartedAtTime() {
  return tronRunnerReveal?.startedAt() ?? 0;
}

function tronRunnerRevealIsActive() {
  return tronRunnerReveal?.isActive() ?? false;
}

function tronRunnerRevealProgressValue() {
  return tronRunnerReveal?.progress() ?? (TRON_RUNNER_REVEAL_ENABLED ? 0 : 1);
}

// ---------- City department departures boards (extracted -> city-boards.js) ----------
initCityDepartmentBoards({
  scene,
  camera,
  renderer,
  reflectionEnvMap,
  PAL,
  elStrip,
  sideBuildingRecords,
  DEFAULT_DRONE_LANDING_POSE,
  TRON_RUNNER_REVEAL_ENABLED,
  getDroneLandingPose: () => droneLandingPose,
  getPlayerSpawn: () => playerSpawn,
  getCityRevealComplete: () => cityRevealComplete,
  getRunnerReady: () => tronRunnerState.ready,
  getRevealComplete: tronRunnerRevealIsComplete,
  getRevealStartedAt: tronRunnerRevealStartedAtTime,
  getRevealActive: tronRunnerRevealIsActive,
  getRevealProgress: tronRunnerRevealProgressValue,
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
  ensureTronAudioContext,
  setupTronSoundtrackGraph,
  GRID_BLOCK,
  TRON_SOUNDTRACK_URL,
  TRON_RUNNER_BEAT_PULSE_AUDIO_KICK_ENABLED,
  getCityRevealComplete: () => cityRevealComplete,
  getDroneLandingPose: () => droneLandingPose,
  getPlayerSpawn: () => playerSpawn,
  getDynamicRoadCenter: () => dynamicRoadCenter,
  getDynamicRoadLength: () => dynamicRoadLength,
  getLatestMeasuredFps: () => latestMeasuredFps,
});

// ---------- Runner character from character-mockups/walk-rigged-runner.html ----------
const tronRunnerWalker = new THREE.Group();
tronRunnerWalker.name = 'tron-runner-walker';
tronRunnerWalker.visible = false;
scene.add(tronRunnerWalker);
const tronRunnerCrowdGroup = new THREE.Group();
tronRunnerCrowdGroup.name = 'tron-runner-crowd';
tronRunnerCrowdGroup.visible = false;
scene.add(tronRunnerCrowdGroup);

const tronRunnerShadowTextureState = createTronRunnerShadowTextureState(renderer);
const tronRunnerSuitTexture = makeTronRunnerSuitTexture(renderer);
const tronRunnerSuitEmissiveTexture = makeTronRunnerSuitEmissiveTexture(renderer);
const tronRunnerSuitLedMaskTexture = makeTronRunnerSuitLedMaskTexture(renderer);

const tronRunnerSuitMat = new THREE.MeshStandardMaterial({
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

const tronRunnerShadowMat = new THREE.MeshBasicMaterial({
  color: TRON_RUNNER_SHADOW_COLOR,
  alphaMap: tronRunnerShadowTextureState.texture,
  blending: THREE.NormalBlending,
  depthWrite: false,
  opacity: 0.16,
  toneMapped: false,
  transparent: true,
});
const tronRunnerParts = createTronRunnerParts({});
const tronRunnerState = createTronRunnerState({
  footstepBus: FOOTSTEP_NPC_SPATIAL_BUS,
});
const tronRunnerReflectionRig = createTronRunnerReflectionRigRuntime({
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
const tronRunnerMotion = {
  elapsed: 0,
  visualDistanceWalked: 0,
  yaw: 0,
  targetYaw: 0,
};
let tronRunnerBodyLight = 1;
let tronRunnerLineLight = 1;
let tronRunnerKeyLight = 1;
let tronRunnerRimLight = 1;
let tronRunnerFillLight = 1;
let tronRunnerLedBrightness = TRON_RUNNER_CHARACTER_LED_BRIGHTNESS_MULTIPLIER;
let tronRunnerLedBloom = TRON_RUNNER_CHARACTER_LED_BLOOM_BOOST;
const tronRunnerCrowdMaterials = createTronRunnerCrowdMaterialsRuntime({
  baseMaterial: tronRunnerSuitMat,
  getLedBrightness: () => tronRunnerLedBrightness,
  getLedBloom: () => tronRunnerLedBloom,
});

let tronRunnerMaterialReflect = 0.06;
let tronRunnerMaterialMetalness = 0.12;
let tronRunnerMaterialRoughness = 0.92;
let tronRunnerFloorReflection = 0.16;
let tronRunnerFloorReflectionScale = 0.55;
let tronRunnerShadowSoftness = 1.15;
let tronRunnerShadowPulse = 0.08;
let tronRunnerShadowCyan = 0;
let tronRunnerShadowOffsetX = 0;
let tronRunnerShadowOffsetZ = 0.2;
let tronRunnerKeyLightY = 3.1;
let tronRunnerKeyLightZ = 1.9;
let tronRunnerRimLightX = 1.9;
let tronRunnerFillLightY = 0.9;
let tronRunnerScale = 1;
let tronRunnerWalkSpeed = TRON_RUNNER_DEFAULT_SPEED;
let tronRunnerAnimationSpeed = 1;
let tronRunnerStrideSync = 1;
const tronRunnerCrowd = [];
const tronRunnerCrowdBox = new THREE.Box3();
const tronRunnerIdleCharacterRuntime = createTronRunnerIdleCharacterRuntime({
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
  getPlayerSpawn: () => playerSpawn,
  sideBuildingSpacing: SIDE_BUILDING_SPACING,
  sideDoorFaceOffset,
  gridBlock: GRID_BLOCK,
});
const tronRunnerIdleCharacterGroup = tronRunnerIdleCharacterRuntime.group;
const tronRunnerIdleCharacter = tronRunnerIdleCharacterRuntime.character;
const tronRunnerIdleTalk = tronRunnerIdleCharacterRuntime.talk;
const tronRunnerCrowdSize = new THREE.Vector3();
const tronRunnerCrowdCullMatrix = new THREE.Matrix4();
const tronRunnerCrowdCullFrustum = new THREE.Frustum();
const tronRunnerCrowdCullSphere = new THREE.Sphere(new THREE.Vector3(), TRON_RUNNER_CROWD_CULL_RADIUS);
const tronRunnerCrowdSpatialGrid = new Map();
const tronRunnerCrowdBuildStats = createTronRunnerCrowdBuildStats();
const tronRunnerCrowdRuntimeStats = createTronRunnerCrowdRuntimeStats();
const tronRunnerCrowdReflectionCandidates = [];
const tronRunnerCrowdClearState = {
  crowd: tronRunnerCrowd,
  group: tronRunnerCrowdGroup,
  spatialGrid: tronRunnerCrowdSpatialGrid,
  buildStats: tronRunnerCrowdBuildStats,
  runtimeStats: tronRunnerCrowdRuntimeStats,
  requestedCount: TRON_RUNNER_CROWD_COUNT,
};
const tronRunnerCrowdBuildQueueState = {
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
const tronRunnerCrowdRoutes = createTronRunnerCrowdRoutesRuntime({
  getSideBuildingRecords: () => sideBuildingRecords,
  getDynamicRoadCenter: () => dynamicRoadCenter,
  getDynamicRoadLength: () => dynamicRoadLength,
  roadHexBoundaryLimits,
  getRoadHalf: roadHalf,
  getRoadTopY: roadTileTopY,
  getStreetEdgeWidth: () => streetEdgeWidth,
  getSideBuildingVisualWidth: sideBuildingVisualWidth,
  getDroneAnchor: tronRunnerDroneAnchor,
  pointInPolygon: pointInBasePadPolygon,
  resolveRoundedCollider: resolveTronRunnerRoundedCollider,
  gridBlock: GRID_BLOCK,
  sideBase: SIDE_BUILDING_BASE,
});
const tronRunnerCrowdScaleGroundState = {
  crowd: tronRunnerCrowd,
  sourceScale: tronRunnerWalker.scale,
  surfaceYForPoint: tronRunnerSurfaceYForPoint,
  fallbackPlacement: tronRunnerCrowdRoutes.fallbackPlacement,
  groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
  updateReflection: (member) => tronRunnerCrowdRuntime.updateReflection(member),
  syncMemberMatrixUpdates: syncTronRunnerCrowdMemberMatrixUpdates,
  syncIdlePose: () => tronRunnerIdleCharacterRuntime.syncPose(),
};
const tronRunnerCrowdVisibilityState = {
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
const tronRunnerCrowdCullingState = {
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
const tronRunnerCrowdSpatialGridState = {
  spatialGrid: tronRunnerCrowdSpatialGrid,
  crowd: tronRunnerCrowd,
  stats: tronRunnerCrowdRuntimeStats,
  cullingEnabled: TRON_RUNNER_CROWD_CULLING_ENABLED,
  lodNearDistance: TRON_RUNNER_CROWD_LOD_NEAR_DISTANCE,
  gridCoord: (value) => tronRunnerCrowdRuntime.gridCoord(value),
  gridKey: tronRunnerCrowdGridKey,
};
const tronRunnerCrowdDistanceState = {
  camera,
  stats: tronRunnerCrowdRuntimeStats,
  distanceCacheEnabled: TRON_RUNNER_CROWD_DISTANCE_CACHE_ENABLED,
};
const tronRunnerCrowdLodStrideState = {
  distanceToCamera: (member) => tronRunnerCrowdDistanceToCameraRuntime(tronRunnerCrowdDistanceState, member),
  nearDistance: TRON_RUNNER_CROWD_LOD_NEAR_DISTANCE,
  midDistance: TRON_RUNNER_CROWD_LOD_MID_DISTANCE,
};
const tronRunnerCrowdStateMachineState = {
  intelligenceEnabled: TRON_RUNNER_CROWD_INTELLIGENCE_ENABLED,
};
const tronRunnerCrowdPointInsideRouteState = {
  pointInPolygon: pointInBasePadPolygon,
};
const tronRunnerCrowdGridCoordState = {
  cellSize: TRON_RUNNER_CROWD_SPATIAL_CELL,
};
const cityRevealPostRevealElapsedMsState = {
  getCityRevealComplete: () => cityRevealComplete,
  getCityRevealCompletedAt: () => cityRevealCompletedAt,
};
const tronRunnerCrowdColliderRecordsState = {
  cache: tronRunnerCrowdColliderRecordCache,
  getSideBuildingRecords: () => sideBuildingRecords,
  getMainBuildingRecords: () => mainBuildingRecords,
};
const tronRunnerCrowdCollisionState = {
  collisionsEnabled: TRON_RUNNER_CROWD_COLLISIONS_ENABLED,
  getColliderRecords: () => tronRunnerCrowdRuntime.colliderRecords(),
  buildingGuard: TRON_RUNNER_CROWD_BUILDING_GUARD,
  pointInsideRoute: (member, x, z) => tronRunnerCrowdRuntime.pointInsideRoute(member, x, z),
};
const tronRunnerCrowdBuildingCollisionDiagnosticState = {
  getColliderRecords: () => tronRunnerCrowdRuntime.colliderRecords(),
  padding: TRON_RUNNER_CROWD_BUILDING_GUARD,
};
const tronRunnerCrowdReflectionRampState = {
  stats: tronRunnerCrowdRuntimeStats,
  rampEnabled: TRON_RUNNER_CROWD_REFLECTION_POST_REVEAL_RAMP_ENABLED,
  rampMs: TRON_RUNNER_CROWD_REFLECTION_POST_REVEAL_RAMP_MS,
  cityRevealWireframeEnabled,
  getCityRevealComplete: () => cityRevealComplete,
  getCityRevealCompletedAt: () => cityRevealCompletedAt,
  postRevealElapsedMs: (now) => tronRunnerCrowdRuntime.postRevealElapsedMs(now),
};
const tronRunnerCrowdReflectionBudgetState = {
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
  getLatestMeasuredFps: () => latestMeasuredFps,
  getCityRevealComplete: () => cityRevealComplete,
  postRevealElapsedMs: (now) => tronRunnerCrowdRuntime.postRevealElapsedMs(now),
  isCityRevealPerformanceCritical,
  distanceToCamera: (member) => tronRunnerCrowdRuntime.distanceToCamera(member),
  rampLimit: (maxLimit, now) => tronRunnerCrowdRuntime.reflectionRampLimit(maxLimit, now),
};
const tronRunnerCrowdReflectionUpdateState = {
  getCrowdReflectionsIsolation: () => postRevealPerfIsolationState.crowdReflections,
  camera,
  getColliderRecords: () => tronRunnerCrowdRuntime.colliderRecords(),
  reflectionRig: tronRunnerReflectionRig,
  dynamicReflectionEnabled: TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
  crowdGroup: tronRunnerCrowdGroup,
  reflectionY: TRON_RUNNER_DYNAMIC_REFLECTION_Y,
  reflectionYScale: TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE,
};
const tronRunnerCrowdRuntime = createTronRunnerCrowdRuntime({
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

const tronRunnerBeatPulse = createTronRunnerBeatPulseRuntime({
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

const applyTronRunnerCrowdLedControls = () => applyTronRunnerCrowdLedControlsCore({
  crowd: tronRunnerCrowd,
  ledBrightness: tronRunnerLedBrightness,
  ledBloom: tronRunnerLedBloom,
  beatPulse: tronRunnerBeatPulse,
});

const tronRunnerAutonomy = createTronRunnerAutonomy({
  footstepBus: FOOTSTEP_NPC_SPATIAL_BUS,
});
const tronRunnerFootstepRuntime = {
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

function tronRunnerEffectiveAnimationSpeed() {
  return computeTronRunnerEffectiveAnimationSpeed({
    walkSpeed: tronRunnerWalkSpeed,
    defaultSpeed: TRON_RUNNER_DEFAULT_SPEED,
    animationSpeed: tronRunnerAnimationSpeed,
    strideSync: tronRunnerStrideSync,
  });
}

const applyTronRunnerVisualControls = () => applyTronRunnerVisualControlsCore({
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

const tronRunnerOrchestration = createTronRunnerOrchestrationRuntime({
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
  getDynamicRoadCenter: () => dynamicRoadCenter,
  getDynamicRoadLength: () => dynamicRoadLength,
  getGridBlock: () => GRID_BLOCK,
  getRoadHalf: roadHalf,
  getStreetEdgeWidth: () => streetEdgeWidth,
  getSideBuildingRecords: () => sideBuildingRecords,
  getMainBuildingRecords: () => mainBuildingRecords,
  getBuildingColliders: () => buildingColliders,
  getMainBuildingCollisionPadding: () => mainBuildingCollisionPadding,
  getCollisionPadding: () => collisionPadding,
  getPlayerSpawn: () => playerSpawn,
  sideBuildingSpacing: SIDE_BUILDING_SPACING,
  sideDoorFaceOffset,
  doorHalfHeight: () => sideDoorHeight * sideDoorScale * 0.5,
  makeReflectionBodyMaterial: () => tronRunnerReflectionRig.makeBodyMaterial(),
  makeReflectionLedMaterial: (colorPreset) => tronRunnerReflectionRig.makeLedMaterial(colorPreset),
});

function tronRunnerSurfaceYAt(x = tronRunnerWalker.position.x, z = tronRunnerWalker.position.z) {
  const padHit = basePadAtPoint(x, z);
  const topY = padHit?.topY ?? roadTileTopY();
  tronRunnerState.surface = padHit ? 'sidewalk' : 'road-fallback';
  tronRunnerState.surfaceY = topY + TRON_RUNNER_GROUND_OFFSET;
  return tronRunnerState.surfaceY;
}

const tronRunnerSurfaceScratch = { y: 0, groundY: 0, surface: '' };
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

const tronRunnerCrowdAvoidanceDeps = {
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

const tronRunnerCrowdDeadlockDeps = {
  reachRadius: TRON_RUNNER_CROWD_REACH_RADIUS,
  deadlockMoveEps: TRON_RUNNER_CROWD_DEADLOCK_MOVE_EPS,
  deadlockMs: TRON_RUNNER_CROWD_DEADLOCK_MS,
  deadlockNudge: TRON_RUNNER_CROWD_DEADLOCK_NUDGE,
  yieldDurationMs: TRON_RUNNER_CROWD_YIELD_DURATION_MS,
  pointInsideRoute: tronRunnerCrowdRuntime.pointInsideRoute,
  resolveCollision: tronRunnerCrowdRuntime.resolveCollision,
  setState: tronRunnerCrowdRuntime.setState,
};

// Occasional standstill at a waypoint so the crowd reads as people, not marchers.
// Distance-driven walk freezes the legs while paused (no moonwalk).
const TRON_RUNNER_CROWD_PAUSE_CHANCE = 0.28;
const TRON_RUNNER_CROWD_PAUSE_MIN_MS = 900;
const TRON_RUNNER_CROWD_PAUSE_MAX_MS = 2800;
// The green companion (member index 1) greets the player: it walks over deliberately
// when the city is revealed, stops at a welcoming distance and turns to face the player,
// then stays put. The cyan member behaves like a normal crowd member.
const TRON_RUNNER_GREETER_INDEX = 1;
const TRON_RUNNER_GREET_DISTANCE = TRON_RUNNER_GREETER_GREET_DISTANCE;
const GREETER_SPEED_MULTIPLIER = 1.155; // 30% slower than the previous 1.65 approach pace
const GREETER_RUN_SPEED_BOOST = 3.064;  // keeps board run 30% faster overall after slower approach
const GREETER_HEAD_MAX_YAW = 1.3963; // +/-80deg => 160deg total head turn, no neck over-rotation
const GREETER_HEAD_YAW_SIGN = 1;
const tronRunnerGreeterHeadLookState = {
  camera,
  maxYaw: GREETER_HEAD_MAX_YAW,
  yawSign: GREETER_HEAD_YAW_SIGN,
  lerpAngle,
};
// After the welcome bubble dissolves the greeter walks over to the departures board
// (the "12 reparti" tabellone) and posts up just past its right-hand edge, facing the player.
const GREETER_BOARD_SIDE_GAP = 2.4;  // clearance beyond the board's right edge (world units)
const GREETER_BOARD_FRONT_GAP = 1.4; // step toward the player off the board plane (no clipping)
const GREETER_BOARD_REACH = 0.8;     // arrival radius at the board anchor
const GREETER_FOLLOW_DELAY_MS = TRON_RUNNER_FOLLOW_PROMPT_DELAY_MS; // show "Seguimi" first, then start moving 1.5s later
const GREETER_BOARD_BUBBLE_RANGE = 32.0; // "Qui vedi i nostri reparti" shows within 32m of the greeter
const GREETER_BOARD_STANCE_DEG = 45; // at the board the body sits 45deg between player and board
const tronRunnerGreeterBoardAnchorState = {
  getCityDepartmentBoards: () => (typeof getCityDepartmentBoards === 'function' ? getCityDepartmentBoards() : null),
  sideGap: GREETER_BOARD_SIDE_GAP,
  frontGap: GREETER_BOARD_FRONT_GAP,
};

// Distance the greeter covers per full run cycle. The run clip is driven by ground distance
// (like the crowd walk) so the feet plant instead of sliding/moonwalking. Tune this up if the
// legs lag behind the motion (slide), down if they spin too fast. Run stride > walk stride.
const GREETER_RUN_CYCLE_DISTANCE = TRON_RUNNER_WALK_CYCLE_DISTANCE * 1.55;
const GREETER_BUBBLE_DURATION_MS = TRON_RUNNER_WELCOME_BUBBLE_DURATION_MS; // welcome + stop duration

const tronRunnerCrowdBuildMemberState = {
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
  getDroneLandingPose: () => droneLandingPose,
  crowdLines: TRON_RUNNER_CROWD_LINES,
  talkLinesPerMember: TRON_RUNNER_CROWD_TALK_LINES_PER_MEMBER,
};

const tronRunnerCrowdAdvanceState = {
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

const tronRunnerCrowdUpdateState = {
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

const tronRunnerCrowdInspectState = {
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

function tronRunnerDroneAnchor() {
  const target = computeDroneIntroTargetPose?.();
  if (target && Number.isFinite(target.x) && Number.isFinite(target.z)) return { x: target.x, z: target.z };
  return {
    x: Number.isFinite(playerSpawn?.x) ? playerSpawn.x : 0,
    z: Number.isFinite(playerSpawn?.z) ? playerSpawn.z : dynamicRoadCenter,
  };
}

// ---------- Exact boulevard elevated links, rendered with demo-5 cubemap materials ----------
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
});

initCityRevealWireframe({
  camera,
  renderer,
  getPlayerSpawn: () => playerSpawn,
  getDynamicRoadSurfaceWidth: () => dynamicRoadSurfaceWidth,
  getDynamicRoadLength: () => dynamicRoadLength,
  getDynamicRoadCenter: () => dynamicRoadCenter,
  getRoadTopY: roadTileTopY,
  getSideBuildingRecords: () => sideBuildingRecords,
  getMainBuildingRecords: () => mainBuildingRecords,
  getBridgeRecords: () => bridges.records,
  getEdgeStripSpecs: () => edgeStripSpecs,
  stopMouseLookInput,
  updatePointerLockHint,
  syncCityRevealSkyMaterial,
  scheduleTronSoundtrackIntroLofiStopForReveal,
});

const cityRevealRender = createCityRevealRenderRuntime({
  renderer,
  scene,
  camera,
  domeMesh,
  getComposer: () => composer,
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
  getComposer: () => composer,
  getBloomPass: () => bloomPass,
  getFxaaPass: () => fxaaPass,
  getFsrUpscalePass: () => fsrUpscalePass,
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

// ---------- post (bloom) ----------
function effectiveComposerPixelRatio() {
  const internalScale = fsrUpscaleEnabled
    ? THREE.MathUtils.clamp(fsrInternalScale, 0.65, 1)
    : 1;
  return Math.max(MIN_DYNAMIC_PIXEL_RATIO, activePixelRatio * internalScale);
}

function isFsrUpscaleActive() {
  return Boolean(fsrUpscaleEnabled && fsrInternalScale < 0.999);
}

function syncFsrUpscalePass() {
  if (!fsrUpscalePass) return;
  fsrUpscalePass.enabled = true;
  const upscaleActive = isFsrUpscaleActive() ? 1 : 0;
  if (fsrUpscalePass.uniforms?.upscaleActive) {
    fsrUpscalePass.uniforms.upscaleActive.value = upscaleActive;
  }
  if (fsrUpscalePass.uniforms?.sharpness) {
    fsrUpscalePass.uniforms.sharpness.value = THREE.MathUtils.clamp(fsrSharpness, 0, 1.25);
  }
}

function resizeFsrUpscaleTarget() {
  if (!fsrUpscalePass) return;
  const composerPixelRatio = effectiveComposerPixelRatio();
  const width = Math.max(1, Math.round(window.innerWidth * composerPixelRatio));
  const height = Math.max(1, Math.round(window.innerHeight * composerPixelRatio));
  const key = `${width}x${height}`;
  if (key === lastFsrTargetKey) return;
  lastFsrTargetKey = key;
  fsrUpscalePass.uniforms?.sourceResolution?.value?.set(width, height);
}

function resizeBloomTargets() {
  if (!bloomPass) return;
  const requestedScale = Math.min(effectiveBloomScaleForDevice(requestedBloomResolutionScale), BLOOM_RESOLUTION_CAP);
  bloomResolutionScale = Math.max(MIN_DYNAMIC_BLOOM_SCALE, requestedScale * dynamicQualityScale);
  const composerPixelRatio = effectiveComposerPixelRatio();
  const width = Math.max(MIN_BLOOM_TARGET_SIZE, Math.round(window.innerWidth * composerPixelRatio * bloomResolutionScale));
  const height = Math.max(MIN_BLOOM_TARGET_SIZE, Math.round(window.innerHeight * composerPixelRatio * bloomResolutionScale));
  const key = `${width}x${height}`;
  if (key === lastBloomTargetKey) return;
  lastBloomTargetKey = key;
  bloomPass.setSize(width, height);
}

function resizeFxaaTargets() {
  if (!fxaaPass) return;
  const composerPixelRatio = effectiveComposerPixelRatio();
  const width = Math.max(1, Math.round(window.innerWidth * composerPixelRatio));
  const height = Math.max(1, Math.round(window.innerHeight * composerPixelRatio));
  const key = `${width}x${height}`;
  if (key === lastFxaaTargetKey) return;
  lastFxaaTargetKey = key;
  fxaaPass?.setSize(width, height);
  resizeFsrUpscaleTarget();
}

function normalizedAntialiasMode(mode) {
  return mode === 'off' ? 'off' : 'fxaa';
}

function syncGlobalFxaaPass() {
  if (!fxaaPass) return;
  fxaaPass.enabled = antialiasMode === 'fxaa';
}

function disposeComposerTargets() {
  if (!composer) return;
  bloomPass?.dispose?.();
  fxaaPass?.dispose?.();
  fsrUpscalePass?.material?.dispose?.();
  fsrUpscalePass?.dispose?.();
  composer.dispose?.();
  bloomPass = null;
  fxaaPass = null;
  fsrUpscalePass = null;
  cityRevealRender.clearComposerPasses();
  composer = null;
}

function rebuildComposer() {
  if (!usePost) return;
  const { EffectComposer, RenderPass, UnrealBloomPass, FXAAPass, ShaderPass } = window.__POST;
  disposeComposerTargets();
  composer = new EffectComposer(renderer);
  lastAppliedComposerPixelRatio = -1;
  lastBloomTargetKey = '';
  lastFxaaTargetKey = '';
  lastFsrTargetKey = '';
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(effectiveComposerPixelRatio());
  cityRevealRender.addComposerPasses(composer, { RenderPass, FXAAPass });
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.58,
    0.56,
    0.68
  );
  bloomPass.activeMips = BLOOM_OPTIMIZED_ACTIVE_MIPS;
  bloomPass.updateStride = BLOOM_OPTIMIZED_UPDATE_STRIDE;
  composer.addPass(bloomPass);
  fxaaPass = new FXAAPass();
  composer.addPass(fxaaPass);
  fsrUpscalePass = new ShaderPass(TRON_FSR_UPSCALE_SHADER);
  fsrUpscalePass.setSize = (width, height) => {
    fsrUpscalePass.uniforms?.sourceResolution?.value?.set(Math.max(1, width), Math.max(1, height));
  };
  syncFsrUpscalePass();
  composer.addPass(fsrUpscalePass);
  resizeBloomTargets();
  resizeFxaaTargets();
  resizeFsrUpscaleTarget();
  applyBloomEnabled(bloomEnabled);
}

function applyAntialiasControls(mode = antialiasMode) {
  antialiasMode = normalizedAntialiasMode(mode);
  syncGlobalFxaaPass();
  resizeFxaaTargets();
}

function applyBloomEnabled(value = bloomEnabled) {
  bloomEnabled = value !== false && value !== 'off';
  if (bloomPass) {
    bloomPass.enabled = bloomEnabled;
    bloomPass._hasCachedBloom = false;
  }
}

function isBloomPassActive() {
  return Boolean(bloomPass?.enabled && (bloomPass.strength ?? 0) > BLOOM_BYPASS_STRENGTH);
}

function hasDroneIntroLanded() {
  return Boolean(!getDroneIntroActive() && getDroneIntroProgress() >= 0.999);
}

function shouldBypassBloomForRevealPerformance() {
  return Boolean(isCityRevealPerformanceCritical() && (mobilePerformanceProfileActive() || !hasDroneIntroLanded()));
}

function isBloomRevealBypassed() {
  return Boolean(bloomEnabled && bloomPass && !bloomPass.enabled && shouldBypassBloomForRevealPerformance());
}

const bloomTemporalCameraPosition = new THREE.Vector3();
const bloomTemporalCameraQuaternion = new THREE.Quaternion();
let bloomTemporalPrimed = false;
let bloomTemporalAppliedStride = 1;

function invalidateBloomTemporalCache() {
  if (bloomPass) bloomPass._hasCachedBloom = false;
  bloomTemporalPrimed = false;
  bloomTemporalAppliedStride = 1;
}

function syncBloomTemporalBudget() {
  if (!bloomPass) return;
  const active = Boolean(
    bloomEnabled &&
    postRevealPerfIsolationState.bloom &&
    bloomPass.enabled &&
    !isCityRevealPerformanceCritical()
  );
  if (!active) {
    bloomPass.updateStride = 1;
    bloomTemporalAppliedStride = 1;
    bloomTemporalPrimed = false;
    return;
  }
  let cameraMoving = true;
  if (bloomTemporalPrimed) {
    const moved = camera.position.distanceToSquared(bloomTemporalCameraPosition) > BLOOM_TEMPORAL_MOVE_EPS_SQ;
    const rotated = 1 - Math.abs(camera.quaternion.dot(bloomTemporalCameraQuaternion)) > BLOOM_TEMPORAL_ROTATE_EPS;
    const revealSweeping = cityRevealStartedAt > 0 && !cityRevealComplete;
    cameraMoving = moved || rotated || getDroneIntroActive() || revealSweeping;
  }
  const nextStride = cameraMoving ? 1 : BLOOM_OPTIMIZED_UPDATE_STRIDE;
  if (bloomPass.updateStride !== nextStride) {
    bloomPass.updateStride = nextStride;
    if (nextStride === 1) bloomPass._hasCachedBloom = false;
  }
  bloomTemporalAppliedStride = nextStride;
  bloomTemporalCameraPosition.copy(camera.position);
  bloomTemporalCameraQuaternion.copy(camera.quaternion);
  bloomTemporalPrimed = true;
}

function mobilePerformanceProfileState() {
  return mobilePerformanceProfileStateCore(mobilePerformanceQuery);
}

function mobilePerformanceProfileActive() {
  return mobilePerformanceProfileActiveCore(mobilePerformanceQuery);
}

function effectiveRenderScaleForDevice(baseScale = manualRenderScale) {
  return effectiveRenderScaleForDeviceCore(mobilePerformanceProfileActive(), baseScale, MOBILE_PERFORMANCE_RENDER_SCALE_CAP);
}

function cityRevealPerformanceWindowActive() {
  return Boolean(
    cityRevealWireframeEnabled &&
    cityRevealWireAlpha > 0.002 &&
    !cityRevealComplete
  );
}

function shouldUseCityRevealPerformanceProfile() {
  return cityRevealPerformanceWindowActive() && !mobilePerformanceProfileActive();
}

function syncCityRevealPerformanceProfile() {
  const next = shouldUseCityRevealPerformanceProfile();
  if (next === cityRevealPerformanceProfileActive) return;
  cityRevealPerformanceProfileActive = next;
  applyRenderResolution(requestedPixelRatio);
}

function effectivePixelRatioForDevice(basePixelRatio = requestedPixelRatio) {
  return effectivePixelRatioForDeviceCore(mobilePerformanceProfileActive(), basePixelRatio, MOBILE_PERFORMANCE_PIXEL_RATIO_CAP);
}

function effectiveBloomScaleForDevice(baseScale = requestedBloomResolutionScale) {
  return effectiveBloomScaleForDeviceCore(mobilePerformanceProfileActive(), baseScale, MOBILE_PERFORMANCE_BLOOM_SCALE_CAP);
}

function mobilePerformanceProfileInspect() {
  const state = mobilePerformanceProfileState();
  return {
    active: state.active,
    mode: state.active ? 'mobile-touch' : 'desktop',
    query: MOBILE_PERFORMANCE_QUERY,
    mediaQueryMatches: state.mediaQueryMatches,
    touchPoints: state.touchPoints,
    widthActive: state.widthActive,
    activationReasons: state.reasons,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    renderScaleCap: MOBILE_PERFORMANCE_RENDER_SCALE_CAP,
    pixelRatioCap: MOBILE_PERFORMANCE_PIXEL_RATIO_CAP,
    bloomScaleCap: MOBILE_PERFORMANCE_BLOOM_SCALE_CAP,
    preRevealPixelRatioCap: CITY_REVEAL_PERFORMANCE_PIXEL_RATIO_CAP,
    preRevealPerformanceActive: cityRevealPerformanceProfileActive,
    revealPixelRatioCap: CITY_REVEAL_PERFORMANCE_PIXEL_RATIO_CAP,
    revealPerformanceActive: cityRevealPerformanceProfileActive,
    effectiveRenderScale: effectiveRenderScaleForDevice(manualRenderScale),
    effectivePixelRatioRequest: effectivePixelRatioForDevice(requestedPixelRatio),
    effectiveBloomScaleRequest: effectiveBloomScaleForDevice(requestedBloomResolutionScale),
  };
}

function syncHexRoadLodForFrame() {
  setHexRoadLodProfile({ mobile: mobilePerformanceProfileActive() });
  updateHexRoadBatchLod();
}

function shouldUseComposer() {
  if (!composer || !postEnabled) return false;
  return Boolean(
    isBloomPassActive() ||
    fxaaPass?.enabled ||
    isFsrUpscaleActive() ||
    (cityRevealWireframeEnabled && cityRevealWireAlpha > 0.002)
  );
}

function applyRenderResolution(requestedPixelRatio) {
  const requestedBase = Number.isFinite(requestedPixelRatio) ? requestedPixelRatio : MAX_RENDER_PIXEL_RATIO;
  const requested = effectivePixelRatioForDevice(requestedBase);
  const renderScale = effectiveRenderScaleForDevice(manualRenderScale);
  const dynamicPixelRatio = Math.max(MIN_DYNAMIC_PIXEL_RATIO, requested * renderScale * dynamicQualityScale);
  const revealPixelRatioCap = cityRevealPerformanceProfileActive
    ? CITY_REVEAL_PERFORMANCE_PIXEL_RATIO_CAP
    : MAX_RENDER_PIXEL_RATIO;
  activePixelRatio = Math.min(
    window.devicePixelRatio || 1,
    dynamicPixelRatio,
    MAX_RENDER_PIXEL_RATIO,
    revealPixelRatioCap,
    adaptiveRenderTargetPixelRatio()
  );
  if (Math.abs(activePixelRatio - lastAppliedRendererPixelRatio) > 0.0001) {
    renderer.setPixelRatio(activePixelRatio);
    lastAppliedRendererPixelRatio = activePixelRatio;
  }
  if (composer) {
    const composerPixelRatio = effectiveComposerPixelRatio();
    if (Math.abs(composerPixelRatio - lastAppliedComposerPixelRatio) > 0.0001) {
      composer.setPixelRatio(composerPixelRatio);
      lastAppliedComposerPixelRatio = composerPixelRatio;
      lastBloomTargetKey = '';
      lastFxaaTargetKey = '';
      lastFsrTargetKey = '';
    }
    resizeBloomTargets();
    resizeFxaaTargets();
    syncFsrUpscalePass();
  }
}

function tunePerformanceBudget(measuredFps) {
  if (performanceMode !== 'auto' || !Number.isFinite(measuredFps)) return;
  if (performanceAdjustCooldown > 0) {
    performanceAdjustCooldown--;
    return;
  }
  const previousScale = dynamicQualityScale;
  if (measuredFps < 45) {
    dynamicQualityScale = Math.max(MIN_DYNAMIC_QUALITY_SCALE, dynamicQualityScale - 0.15);
    performanceAdjustCooldown = 6;
  } else if (measuredFps < 54) {
    dynamicQualityScale = Math.max(MIN_DYNAMIC_QUALITY_SCALE, dynamicQualityScale - 0.10);
    performanceAdjustCooldown = 7;
  } else if (measuredFps < 58) {
    dynamicQualityScale = Math.max(MIN_DYNAMIC_QUALITY_SCALE, dynamicQualityScale - 0.05);
    performanceAdjustCooldown = 6;
  } else if (measuredFps > 59.7 && dynamicQualityScale < 1) {
    dynamicQualityScale = Math.min(1, dynamicQualityScale + 0.025);
    performanceAdjustCooldown = 8;
  }
  if (Math.abs(dynamicQualityScale - previousScale) > 0.0001) applyRenderResolution(requestedPixelRatio);
}

function setupPost() {
  if (!usePost) return;
  rebuildComposer();
  applyAntialiasControls(antialiasMode);
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

function updateStreetEdgeTileBand(tiles, sign, width) {
  const centerX = sign * (roadHalf() + width / 2);
  updateZTileBand(tiles, centerX, dynamicRoadCenter, width, dynamicRoadLength);
}

function updateStreetEdgeLayout(width) {
  streetEdgeWidth = width;
  const visible = width > 0.1 && STREET_EDGE_WIDTH_DEFAULT > 0;
  streetEdgeLeft.visible = visible;
  streetEdgeRight.visible = visible;
  streetEdgeLeft.scale.x = visible ? width / STREET_EDGE_WIDTH_DEFAULT : 0.001;
  streetEdgeRight.scale.x = visible ? width / STREET_EDGE_WIDTH_DEFAULT : 0.001;
  streetEdgeLeft.position.x = -(roadHalf() + width / 2);
  streetEdgeRight.position.x = roadHalf() + width / 2;
  updateStreetEdgeTileBand(streetEdgeLeftTiles, -1, width);
  updateStreetEdgeTileBand(streetEdgeRightTiles, 1, width);
}

function updateBuildingStreetEdgeBlocks(nextSideSpacingScale, width, nextSideDepthScale) {
  const depth = streetEdgeBlockVisualDepth(nextSideDepthScale, nextSideSpacingScale);
  for (const record of buildingStreetEdgeRecords) {
    const z = record.zFactor * SIDE_BUILDING_SPACING * nextSideSpacingScale;
    const blockPoints = streetEdgeBlockPoints(record.sign, z, width, depth);

    setGroundShape(record.mesh, blockPoints);
    record.mesh.position.y = 0.14;
    record.mesh.visible = width > 0.1 && depth > 0.1;
    setGroundLineLoop(record.perimeter, blockPoints, 0.54);
    record.perimeter.visible = record.mesh.visible;
  }
}

function updateMainBuildingStreetEdgeBlock(nextMainWidthScale, nextMainDepthScale, nextMainZ, width) {
  if (!mainBuildingStreetEdgeRecord) return;
  const points = mainBuildingStreetEdgePoints(nextMainZ, width, nextMainWidthScale, nextMainDepthScale);
  setGroundShape(mainBuildingStreetEdgeRecord.mesh, points);
  mainBuildingStreetEdgeRecord.mesh.position.y = 0.14;
  mainBuildingStreetEdgeRecord.mesh.visible = width > 0.1;
  setGroundLineLoop(mainBuildingStreetEdgeRecord.perimeter, points, 0.54);
  mainBuildingStreetEdgeRecord.perimeter.visible = mainBuildingStreetEdgeRecord.mesh.visible;
}

function getLongitudinalRoadEdgeIntervals(nextSideSpacingScale) {
  const minZ = dynamicRoadCenter - dynamicRoadLength / 2;
  const maxZ = dynamicRoadCenter + dynamicRoadLength / 2;
  const halfGap = crossRoadWidth / 2 + crossStreetEdgeWidth + 1.5;
  const gaps = sideRoadRecords
    .map((record) => {
      const z = record.zFactor * SIDE_BUILDING_SPACING * nextSideSpacingScale;
      return {
        min: Math.max(minZ, z - halfGap),
        max: Math.min(maxZ, z + halfGap),
      };
    })
    .filter((gap) => gap.max > minZ && gap.min < maxZ)
    .sort((a, b) => a.min - b.min);

  const intervals = [];
  let cursor = minZ;
  for (const gap of gaps) {
    if (gap.min > cursor + 1) intervals.push([cursor, gap.min]);
    cursor = Math.max(cursor, gap.max);
  }
  if (cursor < maxZ - 1) intervals.push([cursor, maxZ]);
  return intervals;
}

function updateLongitudinalRoadEdges(nextSideSpacingScale) {
  for (const record of longitudinalRoadEdgeRecords) {
    record.mesh.visible = false;
  }
}

function updateIntersectionNode(record, z, blockLength, streetEdgeW) {
  const showCornerStreetEdges = false;
  for (const item of record.roadMasks) {
    setGroundShape(item.mesh, mainStreetEdgeRoadMaskPoints(item.sideSign, z, streetEdgeW));
    item.mesh.visible = false;
  }
  for (const item of record.cornerPads) {
    setGroundShape(item.mesh, cornerPadPoints(item.sideSign, item.zSign, z, blockLength));
    item.mesh.visible = showCornerStreetEdges;
  }
  for (const item of record.cornerCuts) {
    setGroundShape(item.mesh, cornerCutPoints(item.sideSign, item.zSign, z, blockLength));
    item.mesh.visible = false;
  }
  for (const item of record.diagonalLines) {
    const diagPts = cornerDiagonalPoints(item.sideSign, item.zSign, z, blockLength);
    setGroundSegment(item.mesh, diagPts[0], diagPts[1], 0.20, 0.055);
    item.mesh.visible = showCornerStreetEdges;
  }
  let perimeterIndex = 0;
  [-1, 1].forEach((sideSign) => {
    [-1, 1].forEach((zSign) => {
      const segments = cornerRoadPerimeterSegments(sideSign, zSign, z, blockLength);
      segments.forEach(([a, b]) => {
        const item = record.perimeterLines[perimeterIndex++];
        if (!item) return;
        setGroundSegment(item.mesh, a, b, 0.14, 0.045);
        item.mesh.visible = showCornerStreetEdges;
      });
    });
  });

  const tracePts = intersectionTracePoints(z);
  record.traceLines.forEach((line, index) => {
    setGroundSegment(line, tracePts[index], tracePts[(index + 1) % tracePts.length], 0.12, 0.035);
  });
}

function applyMainStreetEdgeIntersectionClips(nextSideSpacingScale) {
  const cutHalfZ = crossRoadWidth / 2 + crossStreetEdgeWidth + hexTileRadius * 0.22;
  for (const tiles of [streetEdgeLeftTiles, streetEdgeRightTiles]) {
    for (const tile of tiles) {
      if (!tile.visible) continue;
      for (const record of sideRoadRecords) {
        const z = record.zFactor * SIDE_BUILDING_SPACING * nextSideSpacingScale;
        if (Math.abs(tile.userData.z - z) <= cutHalfZ) {
          tile.visible = false;
          break;
        }
      }
    }
  }
}

function updateSideRoadLayout(nextSideSpacingScale, width) {
  const roadLength = crossStreetVisualLength(width, SIDE_BUILDING_BASE * sideBuildingWidthScale);
  const sideSegmentLength = crossStreetSideSegmentLength(width, SIDE_BUILDING_BASE * sideBuildingWidthScale);
  for (const record of sideRoadRecords) {
    const z = record.zFactor * SIDE_BUILDING_SPACING * nextSideSpacingScale;
    record.road.position.set(0, roadBaseY + 0.02, z);
    record.road.scale.set(roadLength / CROSS_STREET_MAX_LENGTH, crossRoadWidth, 1);
    for (const tile of record.roadTiles) {
      tile.userData.centerX = 0;
      tile.userData.centerZ = z;
      tile.userData.halfW = crossRoadWidth / 2;
      tile.userData.halfL = roadLength / 2;
      setHexTileLayoutPosition(tile, false);
    }
    compactHexTileBatchesForTiles(record.roadTiles);

    for (const streetEdge of record.crossStreetEdges) {
      const x = streetEdge.xSign * (roadHalf() + sideSegmentLength / 2);
      streetEdge.mesh.position.set(x, 0.11, z + streetEdge.zSign * (crossRoadWidth / 2 + crossStreetEdgeWidth / 2));
      streetEdge.mesh.scale.set(sideSegmentLength / CROSS_STREET_MAX_LENGTH, Math.max(0.001, crossStreetEdgeWidth), 1);
      streetEdge.mesh.visible = false;
    }
    for (const band of record.streetEdgeTiles) {
      const x = band.xSign * (roadHalf() + sideSegmentLength / 2);
      updateZTileBand(
        band.tiles,
        x,
        z + band.zSign * (crossRoadWidth / 2 + crossStreetEdgeWidth / 2),
        crossStreetEdgeWidth,
        sideSegmentLength
      );
      for (const tile of band.tiles) tile.visible = false;
      compactHexTileBatchesForTiles(band.tiles);
    }

    for (const line of record.roadEdgeLines) {
      const offset = line.edge === 'road' ? crossRoadWidth / 2 : crossRoadWidth / 2 + crossStreetEdgeWidth;
      const visibleLength = Math.max(0.01, sideSegmentLength);
      line.mesh.position.set(line.xSign * (roadHalf() + visibleLength / 2), line.edge === 'road' ? 0.37 : 0.35, z + line.zSign * offset);
      line.mesh.scale.x = visibleLength / CROSS_STREET_MAX_LENGTH;
      line.mesh.visible = line.edge === 'road' || crossStreetEdgeWidth > 0.1;
    }

    updateIntersectionNode(record.intersection, z, width, width);
  }
  applyMainStreetEdgeIntersectionClips(nextSideSpacingScale);
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
  document.querySelectorAll('#hud-controls .control-tab').forEach((tab) => {
    const keep = PRODUCTION_CONTROL_PANELS.has(tab.dataset.tab);
    if (!keep) {
      tab.remove();
      return;
    }
    tab.classList.toggle('active', tab.dataset.tab === DEFAULT_PRODUCTION_PANEL);
  });
  document.querySelectorAll('#hud-controls .control-panel').forEach((panel) => {
    const keep = PRODUCTION_CONTROL_PANELS.has(panel.dataset.panel);
    if (!keep) {
      panel.remove();
      return;
    }
    panel.classList.toggle('active', panel.dataset.panel === DEFAULT_PRODUCTION_PANEL);
  });
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
    playerSpawn = nextSpawn;
  },
  setDroneLandingPose: (nextLanding) => {
    droneLandingPose = nextLanding;
  },
});

const {
  formatRevealDelaySeconds,
  persistSettingsToProject,
} = controlSettingsRuntime;

function formatPlayerSpawn(spawn = playerSpawn) {
  return `${spawn.x.toFixed(1)}, ${spawn.y.toFixed(1)}, ${spawn.z.toFixed(1)} | yaw ${THREE.MathUtils.radToDeg(spawn.spawnYaw).toFixed(0)} pitch ${THREE.MathUtils.radToDeg(spawn.spawnPitch).toFixed(0)}`;
}

function formatCurrentPlayerPose() {
  return formatPlayerSpawn({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    spawnYaw: yaw,
    spawnPitch: pitch,
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
  if (controlEls.playerSpawnVal) controlEls.playerSpawnVal.textContent = formatPlayerSpawn(playerSpawn);
  if (controlEls.startPositionSavedVal) controlEls.startPositionSavedVal.textContent = formatPlayerSpawn(playerSpawn);
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
        droneLandingPose = sanitizeDroneLandingPose(stored?.spawn ?? stored) || nextSpawn;
        localStorage.setItem(DRONE_LANDING_KEY, JSON.stringify({ savedAt: droneLandingPose.savedAt || new Date().toISOString(), landing: droneLandingPose }, null, 2));
      } else {
        playerSpawn = nextSpawn;
      }
    }
    const storedLanding = JSON.parse(localStorage.getItem(DRONE_LANDING_KEY) || 'null');
    const nextLanding = sanitizeDroneLandingPose(storedLanding?.landing ?? storedLanding);
    if (nextLanding) droneLandingPose = nextLanding;
  } catch (error) {
    console.warn('Invalid TRON boulevard player spawn', error);
  }
  updatePlayerSpawnLabel();
}

function applyPlayerSpawn(spawn = playerSpawn, showFeedback = true) {
  const nextSpawn = sanitizePlayerSpawn(spawn) || DEFAULT_PLAYER_SPAWN;
  removeViewMotionOffset();
  movementVelocity.set(0, 0, 0);
  camera.position.set(nextSpawn.x, nextSpawn.y, nextSpawn.z);
  yaw = nextSpawn.spawnYaw;
  pitch = nextSpawn.spawnPitch;
  viewRoll = 0;
  setHeadBobOffset(0);
  setSideSwayOffset(0);
  applyCameraLook();
  resolveCameraBuildingCollision();
  resolveCameraRoadHexBoundaryCollision();
  walkSurfaceLift = Math.max(0, cameraGroundHeightAt(camera.position.x, camera.position.z) - cameraMinHeight);
  if (showFeedback) setButtonFeedback(controlEls.resetPlayerSpawn, 'Spawn ripristinato');
  if (showFeedback) setButtonFeedback(controlEls.goStartPosition, 'Posizione ripristinata');
  updateStartPositionLiveLabel();
  return window.__tronInspect?.();
}

function captureLivePlayerSpawn() {
  removeViewMotionOffset();
  playerSpawn = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    spawnYaw: yaw,
    spawnPitch: pitch,
    savedAt: new Date().toISOString(),
  };
  const payload = { savedAt: playerSpawn.savedAt, spawn: playerSpawn };
  localStorage.setItem(PLAYER_SPAWN_KEY, JSON.stringify(payload, null, 2));
  updatePlayerSpawnLabel();
  updateStartPositionLiveLabel();
  setButtonFeedback(controlEls.saveLiveSpawn, 'Spawn salvato');
  setButtonFeedback(controlEls.saveStartPosition, 'Inizio salvato');
  persistSettingsToProject('player-spawn', playerSpawn, { savedAt: playerSpawn.savedAt }).then((result) => {
    if (result) setButtonFeedback(controlEls.saveLiveSpawn, 'Spawn + JSON salvato');
    if (result) setButtonFeedback(controlEls.saveStartPosition, 'JSON salvato');
  });
  return playerSpawn;
}

function resetCameraHeightToDefault(showFeedback = true) {
  removeViewMotionOffset();
  camera.position.y = cameraGroundHeightAt(camera.position.x, camera.position.z);
  movementVelocity.y = 0;
  setHeadBobOffset(0);
  setSideSwayOffset(0);
  viewRoll = 0;
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
  fsrUpscaleEnabled = controlEls.fsrUpscaleEnabled.value !== 'off';
  fsrInternalScale = THREE.MathUtils.clamp(Number(controlEls.fsrInternalScale.value) || 1, 0.65, 1);
  fsrSharpness = THREE.MathUtils.clamp(Number(controlEls.fsrSharpness.value) || 0, 0, 1.25);
  controlEls.fsrInternalScale.value = fsrInternalScale.toFixed(2);
  controlEls.fsrSharpness.value = fsrSharpness.toFixed(2);
  controlEls.fsrInternalScaleVal.textContent = `${Math.round(fsrInternalScale * 100)}%`;
  controlEls.fsrSharpnessVal.textContent = fsrSharpness.toFixed(2);
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
  const previousPerformanceMode = performanceMode;
  performanceMode = nextPerformanceMode;
  manualRenderScale = nextRenderResolution;
  requestedBloomResolutionScale = bloomQuality;
  requestedPixelRatio = pixelRatio;
  applyFsrUpscaleControlsFromUI();
  applyAntialiasControls(nextAntialiasMode);
  applyBloomEnabled(nextBloomEnabled);
  if (performanceMode !== previousPerformanceMode || performanceMode === 'quality') {
    dynamicQualityScale = 1;
    performanceAdjustCooldown = 0;
  }
  applyRenderResolution(requestedPixelRatio);
  if (bloomPass) {
    bloomPass.enabled = bloomEnabled;
    bloomPass.strength = bloomStrength;
    bloomPass.radius = bloomRadius;
    bloomPass.threshold = bloomThreshold;
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
  collisionPadding = Number(controlEls.collisionPadding.value);
  mainBuildingCollisionPadding = Number(controlEls.mainBuildingCollisionPadding.value);
  cameraMinHeight = Number(controlEls.cameraMinHeight.value);
  speedBase = Number(controlEls.walkSpeed.value);
  speedSprint = Number(controlEls.sprintSpeed.value);
  backwardSpeedScale = Number(controlEls.backwardSpeedScale.value);
  strafeSpeedScale = Number(controlEls.strafeSpeedScale.value);
  diagonalSpeedScale = Number(controlEls.diagonalSpeedScale.value);
  verticalSpeed = Number(controlEls.verticalSpeed.value);
  movementAcceleration = Number(controlEls.movementAccel.value);
  movementDeceleration = Number(controlEls.movementDecel.value);
  walkBobAmount = Number(controlEls.walkBob.value);
  runBobAmount = Number(controlEls.runBob.value);
  strafeBobScale = Number(controlEls.strafeBobScale.value);
  backwardBobScale = Number(controlEls.backwardBobScale.value);
  walkStepRate = Number(controlEls.walkStepRate.value);
  runStepRate = Number(controlEls.runStepRate.value);
  stepSnapAmount = Number(controlEls.stepSnap.value);
  movementSwayAmount = Number(controlEls.movementSway.value);
  movementRollAmount = Number(controlEls.movementRoll.value);
  strafeLeanAmount = Number(controlEls.strafeLean.value);
  headMotionSmoothing = Number(controlEls.headMotionSmoothing.value);
  mouseSensitivityScale = Number(controlEls.mouseSensitivity.value);
  setFixedCameraFov();
  controlEls.collisionPaddingVal.textContent = collisionPadding.toFixed(1);
  controlEls.mainBuildingCollisionPaddingVal.textContent = mainBuildingCollisionPadding.toFixed(1);
  controlEls.cameraMinHeightVal.textContent = cameraMinHeight.toFixed(1);
  controlEls.walkSpeedVal.textContent = speedBase.toFixed(0);
  controlEls.sprintSpeedVal.textContent = speedSprint.toFixed(0);
  controlEls.backwardSpeedScaleVal.textContent = backwardSpeedScale.toFixed(2);
  controlEls.strafeSpeedScaleVal.textContent = strafeSpeedScale.toFixed(2);
  controlEls.diagonalSpeedScaleVal.textContent = diagonalSpeedScale.toFixed(2);
  controlEls.verticalSpeedVal.textContent = verticalSpeed.toFixed(0);
  controlEls.movementAccelVal.textContent = movementAcceleration.toFixed(1);
  controlEls.movementDecelVal.textContent = movementDeceleration.toFixed(1);
  controlEls.walkBobVal.textContent = walkBobAmount.toFixed(2);
  controlEls.runBobVal.textContent = runBobAmount.toFixed(2);
  controlEls.strafeBobScaleVal.textContent = strafeBobScale.toFixed(2);
  controlEls.backwardBobScaleVal.textContent = backwardBobScale.toFixed(2);
  controlEls.walkStepRateVal.textContent = walkStepRate.toFixed(2);
  controlEls.runStepRateVal.textContent = runStepRate.toFixed(2);
  controlEls.stepSnapVal.textContent = stepSnapAmount.toFixed(2);
  controlEls.movementSwayVal.textContent = movementSwayAmount.toFixed(2);
  controlEls.movementRollVal.textContent = movementRollAmount.toFixed(3);
  controlEls.strafeLeanVal.textContent = strafeLeanAmount.toFixed(3);
  controlEls.headMotionSmoothingVal.textContent = headMotionSmoothing.toFixed(1);
  controlEls.mouseSensitivityVal.textContent = mouseSensitivityScale.toFixed(2);
}

function applyCharacterControlsFromUI() {
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
  getMainBuildingSaturation: () => mainBuildingSaturation,
  setMainBuildingSaturation: (value) => {
    mainBuildingSaturation = value;
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
  roadBoundaryCollisionEnabled = controlEls.roadBoundaryCollisionEnabled.value === 'on';
  roadBoundaryCollisionMargin = Number(controlEls.roadBoundaryCollisionMargin.value);
  roadBoundaryCameraLead = Number(controlEls.roadBoundaryCameraLead.value);
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
  controlEls.roadBoundaryCollisionEnabledVal.textContent = roadBoundaryCollisionEnabled ? 'on' : 'off';
  controlEls.roadBoundaryCollisionMarginVal.textContent = roadBoundaryCollisionMargin.toFixed(1);
  controlEls.roadBoundaryCameraLeadVal.textContent = roadBoundaryCameraLead.toFixed(1);
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
  const previousPerformanceMode = performanceMode;

  applyHexRuntimeSettings({ offset, radius, dropDelay, dropSpeed, recovery, tileHitLight, playerTileLight });
  setHexTileHeightScale(tileHeight);
  setHexTileScale(tileScale);
  setHexTileGap(hexGap);
  setRoadBuildingReflection(roadBuildingReflect);
  sideBuildingWidthScale = nextSideBuildingWidthScale;
  sideBuildingDepthScale = nextSideBuildingDepthScale;
  sideBuildingSpacingScale = nextSideBuildingSpacingScale;
  mainBuildingWidthScale = nextMainBuildingWidthScale;
  mainBuildingDepthScale = nextMainBuildingDepthScale;
  mainBuildingZ = nextMainBuildingZ;
  mainBuildingY = nextMainBuildingY;
  mainBuildingSaturation = nextMainBuildingSaturation;
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
  sideBuildingBasePadScale = nextSideBuildingBasePadScale;
  sideBuildingBasePadXScale = nextSideBuildingBasePadXScale;
  sideBuildingBasePadY = nextSideBuildingBasePadY;
  sideBuildingBasePadThickness = nextSideBuildingBasePadThickness;
  sideBuildingBasePadCut = nextSideBuildingBasePadCut;
  sideBuildingBasePadRadius = nextSideBuildingBasePadRadius;
  mainBuildingBasePadScale = nextMainBuildingBasePadScale;
  mainBuildingBasePadXScale = nextMainBuildingBasePadXScale;
  mainBuildingBasePadZScale = nextMainBuildingBasePadZScale;
  mainBuildingBasePadY = nextMainBuildingBasePadY;
  mainBuildingBasePadThickness = nextMainBuildingBasePadThickness;
  mainBuildingBasePadCut = nextMainBuildingBasePadCut;
  mainBuildingBasePadRadius = nextMainBuildingBasePadRadius;
  applyRoadBoundaryHexVisualSettings({
    roadBoundaryHexEnabled: nextRoadBoundaryHexEnabled,
    roadBoundaryHexRows: nextRoadBoundaryHexRows,
    roadBoundaryHexFillBrightness: nextRoadBoundaryHexBrightness,
    roadBoundaryHexAlpha: nextRoadBoundaryHexOpacity,
    roadBoundaryHexY: nextRoadBoundaryHexY,
    roadBoundaryHexOutsetScale: nextRoadBoundaryHexOutset,
  });
  roadSideHexExtraRows = nextRoadSideHexExtraRows;
  nextRoadBoundaryHexRowOffsets.forEach((value, index) => {
    roadBoundaryHexRowOffsets[index] = value;
  });
  roadBoundaryCollisionEnabled = nextRoadBoundaryCollisionEnabled;
  roadBoundaryCollisionMargin = nextRoadBoundaryCollisionMargin;
  roadBoundaryCameraLead = nextRoadBoundaryCameraLead;
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
  boulevardWidthScale = nextBoulevardWidthScale;
  crossRoadWidth = nextCrossRoadWidth;
  crossStreetEdgeWidth = nextCrossStreetEdgeWidth;
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
  collisionPadding = nextCollisionPadding;
  mainBuildingCollisionPadding = nextMainBuildingCollisionPadding;
  cameraMinHeight = nextCameraMinHeight;
  speedBase = nextWalkSpeed;
  speedSprint = nextSprintSpeed;
  backwardSpeedScale = nextBackwardSpeedScale;
  strafeSpeedScale = nextStrafeSpeedScale;
  diagonalSpeedScale = nextDiagonalSpeedScale;
  verticalSpeed = nextVerticalSpeed;
  movementAcceleration = nextMovementAccel;
  movementDeceleration = nextMovementDecel;
  walkBobAmount = nextWalkBob;
  runBobAmount = nextRunBob;
  strafeBobScale = nextStrafeBobScale;
  backwardBobScale = nextBackwardBobScale;
  walkStepRate = nextWalkStepRate;
  runStepRate = nextRunStepRate;
  stepSnapAmount = nextStepSnap;
  movementSwayAmount = nextMovementSway;
  movementRollAmount = nextMovementRoll;
  strafeLeanAmount = nextStrafeLean;
  headMotionSmoothing = nextHeadMotionSmoothing;
  mouseSensitivityScale = nextMouseSensitivity;

  ambientLight.intensity = ambient;
  dirKey.intensity = key;
  renderer.toneMappingExposure = exposure;
  applySkyPreset(skyChoice, skyBrightness, skyHue, skyQuality);
  applyStormControlsFromUI();
  domeMat.uniforms.uCloudContrast.value = skyCloudContrast;
  setFixedCameraFov();
  performanceMode = nextPerformanceMode;
  manualRenderScale = nextRenderResolution;
  requestedBloomResolutionScale = bloomQuality;
  requestedPixelRatio = pixelRatio;
  applyFsrUpscaleControlsFromUI();
  applyAntialiasControls(nextAntialiasMode);
  applyBloomEnabled(nextBloomEnabled);
  if (performanceMode !== previousPerformanceMode || performanceMode === 'quality') {
    dynamicQualityScale = 1;
    performanceAdjustCooldown = 0;
  }
  applyRenderResolution(requestedPixelRatio);

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
  updateBuildingFootprints(nextSideBuildingWidthScale, nextSideBuildingDepthScale, nextMainBuildingWidthScale, nextMainBuildingDepthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth, nextMainBuildingZ, nextMainBuildingY, {
    sideBuildingBasePadScale,
    sideBuildingBasePadXScale,
    sideBuildingBasePadY,
    sideBuildingBasePadThickness,
    sideBuildingBasePadCut,
    sideBuildingBasePadRadius,
    mainBuildingBasePadScale,
    mainBuildingBasePadXScale,
    mainBuildingBasePadZScale,
    mainBuildingBasePadY,
    mainBuildingBasePadThickness,
    mainBuildingBasePadCut,
    mainBuildingBasePadRadius,
  });
  updateBasePadLedStrips(basePadLedBrightness, basePadLedThickness, basePadLedOffset, basePadLedHue);
  updateBuildingScale(sideBuildingMeshes, sideBuildingColliders, sideBuildingScale);
  updateBuildingScale(mainBuildingMeshes, mainBuildingColliders, mainBuildingScale);
  updateBasePadHexInfluence();
  refreshRoadTileInstances();

  if (bloomPass) {
    bloomPass.enabled = bloomEnabled;
    bloomPass.strength = bloomStrength;
    bloomPass.radius = bloomRadius;
    bloomPass.threshold = bloomThreshold;
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
controlEls.resetPlayerSpawn.addEventListener('click', () => applyPlayerSpawn(playerSpawn, true));
controlEls.saveStartPosition.addEventListener('click', captureLivePlayerSpawn);
controlEls.goStartPosition.addEventListener('click', () => applyPlayerSpawn(playerSpawn, true));
controlEls.droneIntroFlight?.addEventListener('click', () => startDroneIntroFlight('manual'));
controlEls.runFsrBenchmark?.addEventListener('click', runFsrBenchmark);
controlSettingsRuntime.bindSaveButtons();

updateControlTabs();
controlSettingsRuntime.setupSettingsToggle();

const SCENE_TEXTURE_PREWARM_KEYS = Object.freeze([
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
  'alphaMap',
  'aoMap',
  'bumpMap',
  'displacementMap',
  'lightMap',
  'specularMap',
  'envMap',
]);
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

function prewarmHiddenSkinnedMeshRender(root = scene) {
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
      const previousRenderTarget = renderer.getRenderTarget();
      const previousAutoClear = renderer.autoClear;
      const target = new THREE.WebGLRenderTarget(4, 4, {
        depthBuffer: true,
        stencilBuffer: false,
      });
      try {
        renderer.setRenderTarget(target);
        renderer.autoClear = true;
        renderer.clear();
        renderer.compile?.(root, camera);
        renderer.render(root, camera);
        hiddenSkinnedRenderPrewarmStats.rendered = true;
      } finally {
        renderer.setRenderTarget(previousRenderTarget);
        renderer.autoClear = previousAutoClear;
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
  if (!composer) return postProcessingPrewarmStats;
  const previousPostEnabled = postEnabled;
  const previousBloomEnabled = bloomPass?.enabled;
  const previousFxaaEnabled = fxaaPass?.enabled;
  const previousRevealState = snapshotCityRevealWireframeState();
  try {
    postEnabled = true;
    if (bloomPass) bloomPass.enabled = true;
    if (fxaaPass) fxaaPass.enabled = antialiasMode === 'fxaa';
    cityRevealRender.syncComposerPasses();
    composer.render();
    postProcessingPrewarmStats.rendered = true;
    setCityRevealPostProcessingPrewarmState();
    cityRevealRender.syncComposerPasses();
    composer.render();
    postProcessingPrewarmStats.postRevealRendered = true;
  } catch {
    postProcessingPrewarmStats.errors += 1;
  } finally {
    restoreCityRevealWireframeState(previousRevealState);
    postEnabled = previousPostEnabled;
    if (bloomPass) bloomPass.enabled = previousBloomEnabled;
    if (fxaaPass) fxaaPass.enabled = previousFxaaEnabled;
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
  applyPlayerSpawn(playerSpawn, false);
  await tronRunnerOrchestration.load();
  await tronRunnerCrowdRuntime.drainBuildQueue();
  prewarmSkinnedMeshBoneTextures(scene);
  prewarmSceneTextureUploads(scene);
  prewarmHiddenSkinnedMeshRender(scene);
  prewarmPostProcessingPasses();
  await ensureFootstepAudioReady();
  cityRevealRender.prewarmRealPass();
  scheduleDroneIntroAutoFlight();
}

window.__tronInspect = () => ({
  cameraX: camera.position.x,
  cameraY: camera.position.y,
  cameraZ: camera.position.z,
  cameraPitch: pitch,
  cameraYaw: yaw,
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
  cityRoleBoard: cityRoleBoardInspect(),
  backspaceIntroTriggered,
  cameraCollisionUnlockedByBackspace,
  droneIntro: {
    ...droneIntroInspect(),
    landed: hasDroneIntroLanded(),
    landingPose: { ...droneLandingPose },
  },
  playerSpawn: { ...playerSpawn },
  fps: fpsEl.textContent,
  pixelRatio: renderer.getPixelRatio(),
  antialiasMode,
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
  cityRevealWaitingForBackspace: cityRevealWireframeEnabled && !backspaceIntroTriggered && !cityRevealStartedAt && !cityRevealComplete,
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
      center: cityRevealRoadGridFadeAt(0, dynamicRoadCenter, bounds),
      left: cityRevealRoadGridFadeAt(-bounds.gridHalfW, dynamicRoadCenter, bounds),
      right: cityRevealRoadGridFadeAt(bounds.gridHalfW, dynamicRoadCenter, bounds),
      near: cityRevealRoadGridFadeAt(0, bounds.gridMinZ, bounds),
      far: cityRevealRoadGridFadeAt(0, bounds.gridMaxZ, bounds),
      halfLeft: cityRevealRoadGridFadeAt(-(bounds.roadHalfW + bounds.fadeWidth * 0.5), dynamicRoadCenter, bounds),
      halfFar: cityRevealRoadGridFadeAt(0, bounds.roadMaxZ + bounds.fadeWidth * 0.5, bounds),
    };
  })(),
  cityRevealRoadSolidBackingEnabled: CITY_REVEAL_ROAD_SOLID_BACKING_ENABLED,
  cityRevealSidewalkInternalLinesEnabled: CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED,
  cityRevealDensityObjects: cityRevealWireObjects.filter((object) => object.userData.cityRevealRole === 'wire-density').length,
  fx: {
    performanceMode,
    antialiasMode,
    fxaaEnabled: Boolean(fxaaPass?.enabled),
    bloomEnabled,
    bloomPassEnabled: Boolean(bloomPass?.enabled),
    bloomRevealBypassed: isBloomRevealBypassed(),
    bloomRevealBypassActive: shouldBypassBloomForRevealPerformance(),
    bloomActive: isBloomPassActive(),
    bloomStrength: bloomPass?.strength ?? 0,
    bloomRadius: bloomPass?.radius ?? 0,
    bloomThreshold: bloomPass?.threshold ?? 0,
    bloomResolutionScale,
    bloomActiveMips: bloomPass?.activeMips ?? 0,
    bloomUpdateStride: bloomPass?.updateStride ?? 0,
    bloomCacheReady: Boolean(bloomPass?._hasCachedBloom),
    bloomResolutionCap: BLOOM_RESOLUTION_CAP,
    manualRenderScale,
    requestedPixelRatio,
    activePixelRatio,
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
  activePixelRatio,
  adaptiveRenderTarget: adaptiveRenderTargetInspect(),
  manualRenderScale,
  dynamicQualityScale,
  performanceMode,
  composerActive: shouldUseComposer(),
  bloomEnabled,
  bloomPassEnabled: Boolean(bloomPass?.enabled),
  bloomRevealBypassed: isBloomRevealBypassed(),
  bloomRevealBypassActive: shouldBypassBloomForRevealPerformance(),
  bloomActive: isBloomPassActive(),
  fxaaEnabled: Boolean(fxaaPass?.enabled),
  antialiasMode,
  bloomResolutionScale,
  bloomResolutionCap: BLOOM_RESOLUTION_CAP,
  bloomActiveMips: bloomPass?.activeMips ?? 0,
  bloomUpdateStride: bloomPass?.updateStride ?? 0,
  bloomTemporalStride: bloomTemporalAppliedStride,
  bloomCacheReady: Boolean(bloomPass?._hasCachedBloom),
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
  if (composer) composer.setSize(w, h);
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
  if (!droneIntroWasActive) applyMovement(dt);
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
    updateWalkSimulation(dt);
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
  applyViewMotionOffset();
  skyDome.update(now);
  if (!revealPerformanceCritical) {
    updateCityDepartmentBoards(now);
    updateCityRoleBoard();
    flushHexTileBatchUploads();
    const edgePulseSeconds = now * 0.001;
    updateEdgePulse(edgePulseSeconds);
    updateAtmosphereParticles(cityRevealComplete, edgePulseSeconds);
    updateGreeterSpeechBubble();
    updateTronRunnerCrowdSpeechBubbles();
  }
  updateCityRevealWireframe(now);
  syncTronDiscRevealWaiting();
  syncCityRevealPerformanceProfile();
  maybeStartRetroBenchmarkAuto();
  const postRevealPerformanceCritical = isCityRevealPerformanceCritical();
  const bypassBloomForReveal = shouldBypassBloomForRevealPerformance();
  if (bloomPass) bloomPass.enabled = bloomEnabled && postRevealPerfIsolationState.bloom && !bypassBloomForReveal;
  syncBloomTemporalBudget();
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
  try {
    cityRevealRender.renderCompositeFrame();
  } finally {
    performanceDiagnostics.endGpuTimerSample();
  }
  const frameRenderInfo = captureRevealRenderInfo ? { ...renderer.info.render } : null;
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
}
bootSceneWithFinalDefaults().then(() => {
  trimProductionControls();
  requestAnimationFrame((now) => {
    last = now;
    fpsLast = now;
    fpsAccum = 0;
    fpsFrames = 0;
    startCityRevealWireframe();
    if (backspaceIntroTriggered) startCityRevealWireTimer();
    tick(now);
    loader.classList.add('hidden');
  });
});
