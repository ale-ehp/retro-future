import * as THREE from 'three';
import { createCtx } from './ctx.js';
import {
  GRID_BLOCK, MAIN_ROAD_WIDTH, SIDE_ROAD_LENGTH, SIDE_ROAD_X, SIDE_BUILDING_X, SIDE_ROAD_WIDTH,
  SIDE_BUILDING_BASE, SIDE_BUILDING_GAP, SIDE_BUILDING_SPACING,
  SIDE_BUILDING_MIN_CLEARANCE, BRIDGE_BUILDING_CLEARANCE, BRIDGE_INNER_BUILDING_FACE_X, BRIDGE_HALF_SPAN,
  MAIN_ROAD_BASE_LENGTH, START_SIDE_EXTENSION, MAIN_ROAD_LENGTH, MAIN_ROAD_Z, MAIN_BUILDING_BASE,
  MAIN_BUILDING_Z, laneZ, crossStreetZ, STREET_EDGE_WIDTH_DEFAULT, STREET_EDGE_WIDTH_MAX,
  MAX_BUILDING_AXIS_SCALE, MAX_BOULEVARD_WIDTH_SCALE, MAX_DYNAMIC_ROAD_MARGIN,
  MAIN_BUILDING_SIDE_HEX_EXTENSION_ROWS, CROSS_STREET_EDGE_WIDTH_MAX, DEFAULT_BASE_PAD_Y,
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
  TRON_MAIN_PLAYER_BODY_BLACK_COLOR,
  TRON_MAIN_PLAYER_BODY_CAMERA_OFFSET,
  TRON_MAIN_PLAYER_BODY_ENABLED,
  TRON_MAIN_PLAYER_BODY_LED_COLOR,
  TRON_MAIN_PLAYER_BODY_REVEAL_WITH_CHARACTERS,
  TRON_MAIN_PLAYER_BODY_SCALE,
  TRON_RUNNER_BEAT_PULSE_AUDIO_KICK_ENABLED,
  TRON_RUNNER_BEAT_PULSE_AUDIO_SAMPLE_MAX_AGE_MS,
  TRON_RUNNER_BEAT_PULSE_BASS_BODY_GAIN,
  TRON_RUNNER_BEAT_PULSE_BASS_BODY_THRESHOLD,
  TRON_RUNNER_BEAT_PULSE_BPM,
  TRON_RUNNER_BEAT_PULSE_DECAY,
  TRON_RUNNER_BEAT_PULSE_DIVISION,
  TRON_RUNNER_BEAT_PULSE_ENABLED,
  TRON_RUNNER_BEAT_PULSE_INTENSITY,
  TRON_RUNNER_BEAT_PULSE_LOW_BAND_ENABLED,
  TRON_RUNNER_BEAT_PULSE_MATERIAL_EPS,
  TRON_RUNNER_BEAT_PULSE_MATERIAL_SKIP_ENABLED,
  TRON_RUNNER_BEAT_PULSE_MAX_MULTIPLIER,
  TRON_RUNNER_BEAT_PULSE_OFFSET_SECONDS,
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
  TRON_RUNNER_CROWD_COLLISION_RADIUS,
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
  TRON_RUNNER_CROWD_EXCLUDED_CIVICS,
  TRON_RUNNER_CROWD_GROUND_OFFSET,
  TRON_RUNNER_CROWD_INTELLIGENCE_ENABLED,
  TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY,
  TRON_RUNNER_CROWD_LOD_MID_DISTANCE,
  TRON_RUNNER_CROWD_LOD_NEAR_DISTANCE,
  TRON_RUNNER_CROWD_LOOP_FRONT_ONLY,
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
  TRON_RUNNER_CROWD_ROUTE_RECORD_SPREAD,
  TRON_RUNNER_CROWD_SCALE_LOCK,
  TRON_RUNNER_CROWD_SIDEWALK_LANE_EDGE_INSET,
  TRON_RUNNER_CROWD_SIDEWALK_ROUTE_END_INSET,
  TRON_RUNNER_CROWD_SIDE_STREET_GROUP_EXTRA_COUNT,
  TRON_RUNNER_CROWD_SPATIAL_CELL,
  TRON_RUNNER_CROWD_SPEED_SCALE,
  TRON_RUNNER_CROWD_START_CLUSTER_COUNT,
  TRON_RUNNER_CROWD_TARGET_FPS,
  TRON_RUNNER_CROWD_TURN_DURATION_MS,
  TRON_RUNNER_CROWD_UPDATE_INTERVAL,
  TRON_RUNNER_CROWD_YIELD_DURATION_MS,
  TRON_RUNNER_DEFAULT_SPEED,
  TRON_RUNNER_DISTANCE_DRIVEN_WALK_ENABLED,
  TRON_RUNNER_DYNAMIC_REFLECTION_BODY_MAX_OPACITY,
  TRON_RUNNER_DYNAMIC_REFLECTION_BODY_OPACITY_MULTIPLIER,
  TRON_RUNNER_DYNAMIC_REFLECTION_BODY_RENDER_ORDER,
  TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
  TRON_RUNNER_DYNAMIC_REFLECTION_LED_MAX_OPACITY,
  TRON_RUNNER_DYNAMIC_REFLECTION_LED_OPACITY_MULTIPLIER,
  TRON_RUNNER_DYNAMIC_REFLECTION_LED_RENDER_ORDER,
  TRON_RUNNER_DYNAMIC_REFLECTION_MAX_OPACITY,
  TRON_RUNNER_DYNAMIC_REFLECTION_OPACITY_SCALE,
  TRON_RUNNER_DYNAMIC_REFLECTION_Y,
  TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE,
  TRON_RUNNER_ENABLED,
  TRON_RUNNER_FOOTSTEP_CONTACTS,
  TRON_RUNNER_FOOTSTEP_MAX_DISTANCE,
  TRON_RUNNER_FOOTSTEP_REF_DISTANCE,
  TRON_RUNNER_FOOTSTEP_ROLLOFF,
  TRON_RUNNER_FOOTSTEP_VOLUME_SCALE,
  TRON_RUNNER_FREE_ROAM_COLLISIONS_ENABLED,
  TRON_RUNNER_FREE_ROAM_COLLISION_RADIUS,
  TRON_RUNNER_FREE_ROAM_ENABLED,
  TRON_RUNNER_FREE_ROAM_FOOTSTEPS_ENABLED,
  TRON_RUNNER_FREE_ROAM_REACH_RADIUS,
  TRON_RUNNER_FREE_ROAM_SIDEWALK_INSET,
  TRON_RUNNER_FREE_ROAM_STRIDE_LENGTH,
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
  TRON_RUNNER_REAL_SHADOW_BASE_OPACITY,
  TRON_RUNNER_REAL_SHADOW_CAMERA_SIZE,
  TRON_RUNNER_REAL_SHADOW_COLOR,
  TRON_RUNNER_REAL_SHADOW_ENABLED,
  TRON_RUNNER_REAL_SHADOW_LAYER,
  TRON_RUNNER_REAL_SHADOW_MAP_SIZE,
  TRON_RUNNER_REAL_SHADOW_RECEIVER_RADIUS,
  TRON_RUNNER_REVEAL_DURATION_MS,
  TRON_RUNNER_REVEAL_EMISSIVE_BOOST,
  TRON_RUNNER_REVEAL_ENABLED,
  TRON_RUNNER_REVEAL_SCAN_CORE_OPACITY,
  TRON_RUNNER_REVEAL_SCAN_OUTER_OPACITY,
  TRON_RUNNER_REVEAL_SCAN_RADIUS,
  TRON_RUNNER_REVEAL_SCAN_TUBE,
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
  TRON_RUNNER_CROWD_COLOR_PLAN,
  TRON_RUNNER_CROWD_COLOR_PRESETS,
} from './character/character-colors.js';
import {
  createTronRunnerCrowdMemberRecord,
  fitTronRunnerModel as fitTronRunnerModelCore,
  makeTronRunnerActionSet,
  poseTronRunnerIdleCharacterArmsCrossed as poseTronRunnerIdleCharacterArmsCrossedCore,
} from './character/character-build.js';
import {
  resolveTronRunnerCrowdCollision as resolveTronRunnerCrowdCollisionCore,
  resolveTronRunnerRoundedCollider,
  tronRunnerCrowdBuildingCollisionDiagnostic as tronRunnerCrowdBuildingCollisionDiagnosticCore,
  tronRunnerCrowdColliderLabel,
  tronRunnerCrowdPointInsideRoute as tronRunnerCrowdPointInsideRouteCore,
} from './character/character-collision.js';
import {
  nearbyTronRunnerCrowdMembers as nearbyTronRunnerCrowdMembersCore,
  prepareTronRunnerCrowdSpatialGrid as prepareTronRunnerCrowdSpatialGridCore,
  setTronRunnerCrowdFrameDistance as setTronRunnerCrowdFrameDistanceCore,
  tronRunnerCrowdAvoidance as tronRunnerCrowdAvoidanceCore,
  tronRunnerCrowdDistanceToCamera as tronRunnerCrowdDistanceToCameraCore,
  tronRunnerCrowdLodStride as tronRunnerCrowdLodStrideCore,
  tronRunnerCrowdTryDeadlockNudge as tronRunnerCrowdTryDeadlockNudgeCore,
  tronRunnerCrowdWalkCycleOffset,
  updateTronRunnerCrowdCullingState,
} from './character/character-crowd.js';
import {
  makeTronMainPlayerBodyLedMaterial,
  makeTronMainPlayerBodySuitMaterial,
  makeTronRunnerCrowdSuitMaterial as createTronRunnerCrowdSuitMaterial,
  makeTronRunnerReflectionBodyMaterial as createTronRunnerReflectionBodyMaterial,
  makeTronRunnerReflectionLedMaterial as createTronRunnerReflectionLedMaterial,
  makeTronRunnerReflectionMaterial as createTronRunnerReflectionMaterial,
} from './character/character-materials.js';
import {
  applyTronRunnerCrowdReflectionState,
  emptyTronRunnerCrowdReflection,
  tronRunnerCrowdPostRevealReflectionRampLimit as tronRunnerCrowdPostRevealReflectionRampLimitCore,
  updateTronRunnerCrowdReflectionBudget as updateTronRunnerCrowdReflectionBudgetCore,
} from './character/character-reflections.js';
import {
  countBy,
  inspectTronRunnerMaterials,
  maxBy,
  minBy,
  sideStreetCoverage as buildSideStreetCoverage,
  sideStreetGroupedSegments as buildSideStreetGroupedSegments,
  sumBy,
  tronRunnerIdleCharacterInspect as tronRunnerIdleCharacterInspectCore,
} from './character/character-inspect.js';
import {
  tronRunnerWalkCycleFootstep as tronRunnerWalkCycleFootstepCore,
} from './character/character-footsteps.js';
import {
  computeTronRunnerEffectiveAnimationSpeed,
  syncTronRunnerWalkCycleToDistance as syncTronRunnerWalkCycleToDistanceCore,
  tronRunnerCrowdGridCoord as tronRunnerCrowdGridCoordCore,
  tronRunnerCrowdGridKey,
} from './character/character-movement.js';
import {
  tronRunnerCrowdCandidateRecords as tronRunnerCrowdCandidateRecordsCore,
  tronRunnerCrowdBuildRoute as tronRunnerCrowdBuildRouteCore,
  tronRunnerCrowdDetectedSideStreetLanes as tronRunnerCrowdDetectedSideStreetLanesCore,
  tronRunnerCrowdFallbackPlacement as tronRunnerCrowdFallbackPlacementCore,
  tronRunnerCrowdLoopRouteForRecord as tronRunnerCrowdLoopRouteForRecordCore,
  tronRunnerCrowdRecordRoadDir,
  tronRunnerCrowdRoadFacingRoutePoint as tronRunnerCrowdRoadFacingRoutePointCore,
  tronRunnerCrowdRoadFacingStart as tronRunnerCrowdRoadFacingStartCore,
  tronRunnerCrowdRouteForRecord as tronRunnerCrowdRouteForRecordCore,
  tronRunnerCrowdRouteStyleForIndex as tronRunnerCrowdRouteStyleForIndexCore,
  tronRunnerCrowdRouteStyleOrdinal as tronRunnerCrowdRouteStyleOrdinalCore,
  tronRunnerCrowdSecondaryStreetSummary as tronRunnerCrowdSecondaryStreetSummaryCore,
  tronRunnerCrowdSideStreetLaneAssignment,
  tronRunnerCrowdSideStreetLateralRoute as tronRunnerCrowdSideStreetLateralRouteCore,
  tronRunnerCrowdSideStreetPairs as tronRunnerCrowdSideStreetPairsCore,
  tronRunnerCrowdSideStreetRouteForPair as tronRunnerCrowdSideStreetRouteForPairCore,
  tronRunnerCrowdStartPlayerRoute as tronRunnerCrowdStartPlayerRouteCore,
} from './character/character-routes.js';
import {
  makeTronRunnerShadowTexture,
  makeTronRunnerSuitEmissiveTexture,
  makeTronRunnerSuitLedMaskTexture,
  makeTronRunnerSuitTexture,
} from './character/character-textures.js';
import {
  createTronMainPlayerBodyState,
  createTronRunnerAutonomy,
  createTronRunnerBeatPulseRuntimeStats,
  createTronRunnerBeatPulseState,
  createTronRunnerCrowdBuildStats,
  createTronRunnerCrowdRuntimeStats,
  createTronRunnerIdleCharacter,
  createTronRunnerParts,
  createTronRunnerRevealVisualCache,
  createTronRunnerState,
} from './character/runner-state.js';
import {
  resetTronRunnerAutonomy,
  switchTronRunnerAction as switchTronRunnerActionCore,
} from './character/runner-controller.js';
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
import {
  effectiveBloomScaleForDevice as effectiveBloomScaleForDeviceCore,
  effectivePixelRatioForDevice as effectivePixelRatioForDeviceCore,
  effectiveRenderScaleForDevice as effectiveRenderScaleForDeviceCore,
  mobilePerformanceProfileActive as mobilePerformanceProfileActiveCore,
  mobilePerformanceProfileState as mobilePerformanceProfileStateCore,
} from './engine/performance-mobile.js';
import { createCityRevealProfiler } from './engine/city-reveal-profiler.js';
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
  buildSideBuildingEdgeBatch,
  buildSideHorizontalLedRingBatches,
  edgeStripSpecs,
  elStrip,
  horizontalBuildingLedRings,
  initBuildingLeds,
  setStripInstanceTransform,
  sideBuildingEdgeBatch,
  sideHorizontalLedRingBatches,
  updateEdgeStrips,
} from './world/building-leds.js';
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
import { createCityRevealScanGlow } from './world/city-reveal-scan-glow.js';
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

const CITY_REVEAL_SWEEP_NORMAL = new THREE.Vector3(0, -1, 1).normalize();
let cityRevealDelayMs = CITY_REVEAL_DEFAULT_DELAY_MS;
let cityRevealFadeMs = CITY_REVEAL_DEFAULT_FADE_MS;
let cityRevealWireframeEnabled = true;
let cityRevealWireframeDensity = 2;
let cityRevealWireOpacityScale = 1;
let cityRevealBackplateOpacityScale = 0;
let cityRevealStartedAt = 0;
let cityRevealArmedAt = 0;
let cityRevealWireAlpha = 1;
let cityRevealBackplateRevealFactor = 1;
let cityRevealFrontZ = 1e9;
let cityRevealSweepStartZ = 0;
let cityRevealSweepEndZ = 0;
let cityRevealSweepProgress = 0;
let cityRevealComplete = false;
let cityRevealCompletedAt = 0;
let cityRevealWaitingForVisibleFrame = false;
// Postprocessing (optional bloom + FXAA). Best-effort — fallback to plain renderer if any module fails.
let composer = null, bloomPass = null, fxaaPass = null, fsrUpscalePass = null;
let postEnabled = true;
let usePost = false;
const mobilePerformanceQuery = window.matchMedia(MOBILE_PERFORMANCE_QUERY);
let activePixelRatio = Math.min(window.devicePixelRatio || 1, MAX_RENDER_PIXEL_RATIO);
let requestedPixelRatio = MAX_RENDER_PIXEL_RATIO;
let manualRenderScale = 0.65;
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
try {
  const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { FXAAPass }, { ShaderPass }] = await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/FXAAPass.js'),
    import('three/addons/postprocessing/ShaderPass.js'),
  ]);
  window.__POST = { EffectComposer, RenderPass, UnrealBloomPass, FXAAPass, ShaderPass };
  usePost = true;
} catch (e) {
  console.warn('Postprocessing unavailable, falling back to plain renderer:', e.message);
}

let RunnerGLTFLoader = null;
let cloneRunnerSkeleton = null;
try {
  const [{ GLTFLoader }, { clone }] = await Promise.all([
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/utils/SkeletonUtils.js'),
  ]);
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

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
const performanceDiagnosticsDrawingBufferSize = new THREE.Vector2();
const performanceDiagnosticsTiming = {
  frameMs: 0,
  updateMs: 0,
  renderMs: 0,
};
const PERFORMANCE_LIVE_METRIC_ALPHA = 0.12;
const PERFORMANCE_LIVE_MIN_FRAME_MS = 0.001;
const PERFORMANCE_SPIKE_FPS_THRESHOLD = 50;
const PERFORMANCE_SPIKE_FRAME_MS_THRESHOLD = 22;
const PERFORMANCE_SPIKE_RAF_MS_THRESHOLD = 1000 / PERFORMANCE_SPIKE_FPS_THRESHOLD;
const PERFORMANCE_SPIKE_MIN_INTERVAL_MS = 320;
const PERFORMANCE_SPIKE_MAX_RECORDS = 12;
const performanceLiveMetrics = {
  frameMsAvg: 0,
  updateMsAvg: 0,
  renderMsAvg: 0,
  rafDtMsAvg: 0,
  targetHz: 60,
  targetMs: 1000 / 60,
};
const performanceSpikeState = {
  count: 0,
  lastLoggedAt: -Infinity,
  lastTextureCount: 0,
  last: null,
  worst: null,
  records: [],
};
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

const gpuTimerGl = renderer.getContext();
const gpuTimerExtWebgl2 = gpuTimerGl?.getExtension?.('EXT_disjoint_timer_query_webgl2') || null;
const gpuTimerExtWebgl1 = gpuTimerExtWebgl2 ? null : (gpuTimerGl?.getExtension?.('EXT_disjoint_timer_query') || null);
const gpuTimerState = {
  gl: gpuTimerGl,
  ext: gpuTimerExtWebgl2 || gpuTimerExtWebgl1,
  webgl2: Boolean(gpuTimerExtWebgl2),
  supported: Boolean(gpuTimerExtWebgl2 || gpuTimerExtWebgl1),
  activeQuery: null,
  pending: [],
  latestMs: 0,
  latestAt: 0,
  latestPhase: '',
  sampleCount: 0,
  disjointCount: 0,
};
const GPU_TIMER_SAMPLE_STRIDE = 180;
const GPU_TIMER_SAMPLE_MAX_AGE_MS = 4500;
let gpuTimerFrameIndex = 0;

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
const welcomeWindowOverlay = document.getElementById('welcome-window-overlay');
const welcomeWindowPanel = welcomeWindowOverlay?.querySelector('.welcome-window');
const welcomeWindowAction = welcomeWindowOverlay?.querySelector('.welcome-action');
const welcomeWindowActionPrefix = welcomeWindowOverlay?.querySelector('.welcome-action-prefix');
const welcomeWindowKeyLabel = welcomeWindowOverlay?.querySelector('.welcome-key');
const tronDiscCursor = document.getElementById('tron-disc-cursor');
const welcomeWindowTouchQuery = window.matchMedia('(hover: none), (pointer: coarse)');
const welcomeWindowMobileQuery = window.matchMedia('(max-width: 760px)');
const welcomeWindowMotionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
setupWelcomeWindowMotion(welcomeWindowMotion, welcomeMotionDeps);
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

function applyCameraLook() {
  camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, viewRoll, 'YXZ'));
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

function triggerBackspaceDroneIntro(source = 'backspace') {
  dismissWelcomeWindow();
  ensureFootstepAudioReady();
  startTronProceduralMusic(source);
  if (!backspaceIntroTriggered) {
    backspaceIntroTriggered = true;
    cameraCollisionUnlockedByBackspace = true;
  }
  startCityRevealWireTimer();
  startDroneIntroFlight(source);
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
  performanceDiagnosticsCanvasSummary,
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
// Derived/runtime extents stay here: they read the controlEls DOM bag and depend on the pure imports.
const MAIN_BUILDING_Z_MIN = Number(controlEls.mainBuildingZ?.min ?? -1800);
const MAIN_BUILDING_Z_MAX = Number(controlEls.mainBuildingZ?.max ?? 900);
const MAX_MAIN_BUILDING_Z_EXTENT = Math.max(Math.abs(MAIN_BUILDING_Z_MIN), Math.abs(MAIN_BUILDING_Z_MAX)) +
  MAIN_BUILDING_BASE * MAX_BUILDING_AXIS_SCALE / 2;
const MAX_DYNAMIC_ROAD_HALF = Math.max(
  MAIN_ROAD_LENGTH / 2,
  MAX_MAIN_BUILDING_Z_EXTENT,
  Math.max(...laneZ.map((z) => Math.abs(z))) * 8 + SIDE_BUILDING_BASE * MAX_BUILDING_AXIS_SCALE / 2
) + MAX_DYNAMIC_ROAD_MARGIN;
const DYNAMIC_ROAD_MAX_LENGTH = Math.ceil(MAX_DYNAMIC_ROAD_HALF * 2);
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

function sideRoadVisualLength() {
  return SIDE_ROAD_LENGTH;
}

function sideRoadX(sign) {
  return sign * (roadHalf() + sideRoadVisualLength() / 2);
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
const MAIN_ROAD_TILE_SEED_WIDTH = roadSurfaceWidthForBuildings(
  sideBuildingWidthScale,
  mainBuildingWidthScale,
  streetEdgeWidth,
  MAX_BOULEVARD_WIDTH_SCALE
);
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

const mainRoadTiles = addHexRoadTiles(MAIN_ROAD_TILE_SEED_WIDTH, DYNAMIC_ROAD_MAX_LENGTH, 0, MAIN_ROAD_Z);
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

const intersectionTraceMat = new THREE.MeshBasicMaterial({
  color: PAL.cyan,
  transparent: true,
  opacity: 0.34,
  toneMapped: false,
  depthWrite: false,
});
groundLedMaterials.push({ material: intersectionTraceMat, baseColor: new THREE.Color(PAL.cyan), role: 'roadEdge' });
const streetEdgeBlockLedMat = new THREE.LineBasicMaterial({
  color: PAL.cyan,
  transparent: true,
  opacity: 0.72,
  toneMapped: false,
  depthWrite: false,
});
groundLedMaterials.push({ material: streetEdgeBlockLedMat, baseColor: new THREE.Color(PAL.cyan), role: 'roadEdge' });
const intersectionRecords = [];
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

function addBuildingStreetEdgeBlock(sign, z) {
  const depth = streetEdgeBlockVisualDepth();
  const mesh = new THREE.Mesh(groundShapeGeometry(streetEdgeBlockPoints(sign, z, streetEdgeWidth, depth)), streetEdgeMat);
  mesh.position.y = 0.14;
  mesh.renderOrder = 2;
  scene.add(mesh);

  const perimeter = addGroundLineLoop(streetEdgeBlockPoints(sign, z, streetEdgeWidth, depth), streetEdgeBlockLedMat, 0.54);
  perimeter.renderOrder = 7;

  buildingStreetEdgeRecords.push({
    sign,
    zFactor: z / SIDE_BUILDING_SPACING,
    mesh,
    perimeter,
  });
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

function addMainBuildingStreetEdgeBlock() {
  const points = mainBuildingStreetEdgePoints();
  const mesh = new THREE.Mesh(groundShapeGeometry(points), streetEdgeMat);
  mesh.position.y = 0.14;
  mesh.renderOrder = 2;
  scene.add(mesh);

  const perimeter = addGroundLineLoop(points, streetEdgeBlockLedMat, 0.54);
  perimeter.renderOrder = 7;
  mainBuildingStreetEdgeRecord = { mesh, perimeter };
}

function addIntersectionNode(z, blockLength = streetEdgeWidth) {
  const record = {
    zFactor: z / SIDE_BUILDING_SPACING,
    cornerPads: [],
    cornerCuts: [],
    roadMasks: [],
    diagonalLines: [],
    perimeterLines: [],
    traceLines: [],
  };

  [-1, 1].forEach((sideSign) => {
    const mask = new THREE.Mesh(groundShapeGeometry(mainStreetEdgeRoadMaskPoints(sideSign, z, streetEdgeWidth)), roadMat);
    mask.position.y = 0.34;
    mask.renderOrder = 5;
    scene.add(mask);
    record.roadMasks.push({ mesh: mask, sideSign });
  });

  [-1, 1].forEach((sideSign) => {
    [-1, 1].forEach((zSign) => {
      const pad = new THREE.Mesh(groundShapeGeometry(cornerPadPoints(sideSign, zSign, z, blockLength)), streetEdgeMat);
      pad.position.y = 0.18;
      pad.renderOrder = 3;
      scene.add(pad);
      record.cornerPads.push({ mesh: pad, sideSign, zSign });

      const cut = new THREE.Mesh(groundShapeGeometry(cornerCutPoints(sideSign, zSign, z, blockLength)), roadMat);
      cut.position.y = 0.26;
      cut.renderOrder = 4;
      cut.visible = false;
      scene.add(cut);
      record.cornerCuts.push({ mesh: cut, sideSign, zSign });

      const diagPts = cornerDiagonalPoints(sideSign, zSign, z, blockLength);
      const line = addGroundSegment(diagPts[0], diagPts[1], intersectionTraceMat, 0.52, 0.20, 0.055);
      record.diagonalLines.push({ mesh: line, sideSign, zSign });

      const perimeterSegments = cornerRoadPerimeterSegments(sideSign, zSign, z, blockLength);
      perimeterSegments.forEach(([a, b]) => {
        const perimeterLine = addGroundSegment(a, b, intersectionTraceMat, 0.51, 0.14, 0.045);
        record.perimeterLines.push({ mesh: perimeterLine, sideSign, zSign });
      });
    });
  });

  const tracePts = intersectionTracePoints(z);
  for (let i = 0; i < tracePts.length; i++) {
    const line = addGroundSegment(tracePts[i], tracePts[(i + 1) % tracePts.length], intersectionTraceMat, 0.42, 0.12, 0.035);
    record.traceLines.push(line);
  }

  intersectionRecords.push(record);
  return record;
}

// Cross streets — true intersections in the gaps between the building rows.
const sideRoadRecords = [];
const CROSS_STREET_MAX_LENGTH = 2 * (MAIN_ROAD_WIDTH * MAX_BOULEVARD_WIDTH_SCALE / 2 + STREET_EDGE_WIDTH_MAX + SIDE_BUILDING_BASE * MAX_BUILDING_AXIS_SCALE);
function addSideRoad(_x, z) {
  const roadLength = crossStreetVisualLength();
  const sideSegmentLength = crossStreetSideSegmentLength();
  const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(CROSS_STREET_MAX_LENGTH, 1), roadMat);
  crossRoad.rotation.x = -Math.PI / 2;
  crossRoad.position.set(0, roadBaseY + 0.02, z);
  crossRoad.scale.set(roadLength / CROSS_STREET_MAX_LENGTH, crossRoadWidth, 1);
  scene.add(crossRoad);
  const roadTiles = addHexRoadTiles(80, CROSS_STREET_MAX_LENGTH, 0, z, "x", hexTileMat, true, 0.03);

  const crossStreetEdges = [];
  const streetEdgeTiles = [];
  [-1, 1].forEach((zSign) => {
    [-1, 1].forEach((xSign) => {
      const x = xSign * (roadHalf() + sideSegmentLength / 2);
      const zSide = z + zSign * (crossRoadWidth / 2 + crossStreetEdgeWidth / 2);
      const streetEdge = new THREE.Mesh(new THREE.PlaneGeometry(CROSS_STREET_MAX_LENGTH, 1), streetEdgeMat);
      streetEdge.rotation.x = -Math.PI / 2;
      streetEdge.position.set(x, 0.11, zSide);
      streetEdge.scale.set(sideSegmentLength / CROSS_STREET_MAX_LENGTH, Math.max(0.001, crossStreetEdgeWidth), 1);
      streetEdge.visible = false;
      scene.add(streetEdge);
      crossStreetEdges.push({ mesh: streetEdge, zSign, xSign });
      streetEdgeTiles.push({
        zSign,
        xSign,
        tiles: [],
      });
    });
  });

  const roadEdgeMat = new THREE.MeshBasicMaterial({ color: PAL.cyan, toneMapped: false });
  groundLedMaterials.push({ material: roadEdgeMat, baseColor: new THREE.Color(PAL.cyan), role: 'roadEdge' });
  const roadEdgeLines = [];
  [-1, 1].forEach((zSign) => {
    [crossRoadWidth / 2, crossRoadWidth / 2 + crossStreetEdgeWidth].forEach((offset, idx) => {
      [-1, 1].forEach((xSign) => {
        const roadEdge = new THREE.Mesh(new THREE.BoxGeometry(CROSS_STREET_MAX_LENGTH, idx === 0 ? 0.11 : 0.09, 0.22), roadEdgeMat);
        roadEdge.position.set(xSign * (roadHalf() + sideSegmentLength / 2), idx === 0 ? 0.37 : 0.35, z + zSign * offset);
        roadEdge.scale.x = sideSegmentLength / CROSS_STREET_MAX_LENGTH;
        roadEdge.visible = idx === 0 || crossStreetEdgeWidth > 0.1;
        scene.add(roadEdge);
        roadEdgeLines.push({ mesh: roadEdge, zSign, xSign, edge: idx === 0 ? 'road' : 'outer' });
      });
    });
  });

  const intersection = addIntersectionNode(z, streetEdgeWidth);

  sideRoadRecords.push({
    zFactor: z / SIDE_BUILDING_SPACING,
    road: crossRoad,
    roadTiles,
    crossStreetEdges,
    streetEdgeTiles,
    roadEdgeLines,
    intersection,
  });
}

crossStreetZ.forEach((z) => {
  addSideRoad(0, z);
});

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
const buildingColliders = [];
let collisionPadding = 3;
const sideBuildingMeshes = [];
const mainBuildingMeshes = [];
const sideBuildingRecords = [];
const mainBuildingRecords = [];
const sideBuildingColliders = [];
const mainBuildingColliders = [];
let tronRunnerCrowdColliderRecordCache = null;
let tronRunnerCrowdColliderRecordCacheSourceLength = -1;
const sideBuildingMaterials = [];
const mainBuildingMaterials = [];
const bridgeMaterials = [];
const sideBuildingBasePadRecords = [];
const mainBuildingBasePadRecords = [];
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
  getBridgeRecords: () => bridgeRecords,
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
const BRIDGE_PAIR_5_6_INDEX = 2;
const BRIDGE_PAIR_5_6_Y_OFFSET = 66;
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
initBuildingLeds({
  PAL,
  roadHalf,
  getMainBuildingY: () => mainBuildingY,
  getMainBuildingZ: () => mainBuildingZ,
  getBridgeXOffset: () => bridgeXOffset,
  getBridgeZOffset: () => bridgeZOffset,
  getBridgeYOffset: () => bridgeYOffset,
  getBridgeSpanScale: () => bridgeSpanScale,
  getBridgeHeightScale: () => bridgeHeightScale,
  getBridgeDepthScale: () => bridgeDepthScale,
  bridgeSpanLength,
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
const bridgeRecords = [];
let bridgeXOffset = 0;
let bridgeZOffset = 0;
let bridgeYOffset = 0;
let bridgeSpanScale = 1;
let bridgeHeightScale = 1;
let bridgeDepthScale = 1;
// ---------- Bridge control panel (extracted -> bridge-controls.js) ----------
initBridgeControls({
  controlEls,
  scheduleLiveControls,
  bridgeRecords,
  BRIDGE_PAIR_5_6_INDEX,
  BRIDGE_PAIR_5_6_Y_OFFSET,
});

function addBuildingCollider(x, z, w, d, h = Infinity, y = 0, role = 'side-building', chamfer = 0) {
  const collider = { x, y, z, hw: w / 2, hd: d / 2, baseH: h, h, role, baseChamfer: chamfer, chamfer };
  buildingColliders.push(collider);
  return collider;
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
  if (isCameraCollisionDisabled()) return;
  if (!tronRunnerCrowdGroup.visible || !tronRunnerCrowd.length) return;
  const minDist = TRON_RUNNER_CROWD_PLAYER_COLLISION_DISTANCE;
  const minDistSq = minDist * minDist;
  const px = camera.position.x;
  const pz = camera.position.z;
  for (const member of tronRunnerCrowd) {
    const pos = member.group.position;
    const dx = px - pos.x;
    const dz = pz - pos.z;
    const distSq = dx * dx + dz * dz;
    if (distSq >= minDistSq) continue;
    if (distSq < 1e-6) {
      camera.position.x += minDist;
      continue;
    }
    const dist = Math.sqrt(distSq);
    const push = (minDist - dist) / dist;
    camera.position.x += dx * push;
    camera.position.z += dz * push;
  }
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

function makeChamferedBox(w, h, d, chamfer = 1.5) {
  const c = Math.min(chamfer, w * 0.4, d * 0.4);
  const hw = w / 2, hd = d / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + c, -hd);
  shape.lineTo( hw - c, -hd);
  shape.quadraticCurveTo( hw, -hd,  hw, -hd + c);
  shape.lineTo( hw,  hd - c);
  shape.quadraticCurveTo( hw,  hd,  hw - c,  hd);
  shape.lineTo(-hw + c,  hd);
  shape.quadraticCurveTo(-hw,  hd, -hw,  hd - c);
  shape.lineTo(-hw, -hd + c);
  shape.quadraticCurveTo(-hw, -hd, -hw + c, -hd);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    curveSegments: 18,
    bevelEnabled: true,
    bevelThickness: c * 0.6,
    bevelSize: c * 0.6,
    bevelSegments: 5,
    steps: 1,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
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

// 6 + 6 side buildings + main hero — same layout as baseline tron-boulevard-map-walk.html
// GRID_BLOCK 12, SIDE_BUILDING_BASE 72, SIDE_BUILDING_X 96
// laneZ slots [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5] × 96 = [-240, -144, -48, 48, 144, 240]
// heights = [220, 190, 172, 158, 145, 132]
const SIDE_X = SIDE_BUILDING_X;
const SIDE_BASE = SIDE_BUILDING_BASE;
const sideHeights = [220, 190, 172, 158, 145, 132];

function addRingStrip(group, w, d, x, y, z, color = PAL.cyan, thickness = 0.22) {
  const hw = w / 2, hd = d / 2;
  group.add(elStrip([x - hw, y, z - hd], [x + hw, y, z - hd], color, thickness));
  group.add(elStrip([x + hw, y, z - hd], [x + hw, y, z + hd], color, thickness));
  group.add(elStrip([x + hw, y, z + hd], [x - hw, y, z + hd], color, thickness));
  group.add(elStrip([x - hw, y, z + hd], [x - hw, y, z - hd], color, thickness));
}

function addUndersideEdgeLine(group, w, d, x, y, z, color = PAL.tealLight, bevelPadding = 0) {
  const thickness = 0.275;
  const offset = Math.max(0, bevelPadding + thickness * 0.18);
  const hw = w / 2 + offset;
  const hd = d / 2 + offset;
  const yu = y - offset;
  const matOptions = { toneMapped: false, depthWrite: true };

  group.add(elStrip([x - hw, yu, z - hd], [x + hw, yu, z - hd], color, thickness, matOptions));
  group.add(elStrip([x + hw, yu, z - hd], [x + hw, yu, z + hd], color, thickness, matOptions));
  group.add(elStrip([x + hw, yu, z + hd], [x - hw, yu, z + hd], color, thickness, matOptions));
  group.add(elStrip([x - hw, yu, z + hd], [x - hw, yu, z - hd], color, thickness, matOptions));
}

function createWetAsphaltFacadeMaterial(color = PAL.buildingSkin, envMapIntensity = 1.3) {
  return new THREE.MeshStandardMaterial({
    map: asphalt,
    color,
    metalness: 0.94,
    roughness: 0.10,
    envMap: reflectionEnvMap,
    envMapIntensity,
    emissive: 0x000202,
    emissiveIntensity: 0.035,
  });
}

function buildSideBuilding(x, z, h) {
  const chamfer = 11.5;
  const geo = makeChamferedBox(SIDE_BASE, h, SIDE_BASE, chamfer);
  const mat = createWetAsphaltFacadeMaterial(PAL.buildingSkin, 1.3);
  const m = new THREE.Mesh(geo, mat);
  addTronFacadeTreatment(m, SIDE_BASE, h, SIDE_BASE, {
    face: 'x',
    sign: x < 0 ? 1 : -1,
    edgeRole: 'side-building',
  });
  m.position.set(x, 0, z);
  overlayGroup.add(m);
  sideBuildingMeshes.push(m);
  sideBuildingMaterials.push(mat);
  const collider = addBuildingCollider(x, z, SIDE_BASE, SIDE_BASE, h, 0, 'side-building', chamfer);
  sideBuildingColliders.push(collider);
  const basePad = createBuildingBasePad(overlayGroup, x, z);
  const record = {
    mesh: m,
    collider,
    basePad,
    civicNumberValue: sideBuildingCivicNumberForBuildIndex(sideBuildingRecords.length),
    sign: x < 0 ? -1 : 1,
    zFactor: z / SIDE_BUILDING_SPACING,
    baseW: SIDE_BASE,
    baseD: SIDE_BASE,
    footprintChamfer: chamfer,
  };
  sideBuildingRecords.push(record);
  invalidateTronRunnerCrowdColliderRecords();
  sideBuildingBasePadRecords.push(basePad);
  buildSideBuildingDoor(record);
  buildSideBuildingCivicNumber(record);
  addBuildingEdges(overlayGroup, SIDE_BASE, h, SIDE_BASE, x, 0, z, PAL.tealLight, chamfer * 0.82, 'side-building', { footprintChamfer: chamfer });
}

laneZ.forEach((z, idx) => {
  const h = sideHeights[idx];
  buildSideBuilding(-SIDE_X, z, h);
  buildSideBuilding( SIDE_X, z, h);
});
buildSideBuildingDoorBatches();
updateSideBuildingDoorTransforms();
buildSideBuildingEdgeBatch(overlayGroup);
buildSideHorizontalLedRingBatches(overlayGroup);

// Main hero — z=-301, base 100, h=230
{
  const w = MAIN_BUILDING_BASE, d = MAIN_BUILDING_BASE, h = 230;
  const chamfer = 16.0;
  const geo = makeChamferedBox(w, h, d, chamfer);
  const mat = createWetAsphaltFacadeMaterial(PAL.mainSkin, 1.36);
  const m = new THREE.Mesh(geo, mat);
  addTronFacadeTreatment(m, w, h, d, {
    face: 'z',
    sign: 1,
    edgeRole: 'main-building',
  });
  m.position.set(0, 0, MAIN_BUILDING_Z);
  overlayGroup.add(m);
  mainBuildingMeshes.push(m);
  mainBuildingMaterials.push(mat);
  const collider = addBuildingCollider(0, MAIN_BUILDING_Z, w, d, h, 0, 'main-building', chamfer);
  mainBuildingColliders.push(collider);
  const basePad = createBuildingBasePad(overlayGroup, 0, MAIN_BUILDING_Z);
  mainBuildingRecords.push({ mesh: m, collider, basePad, baseW: w, baseD: d, footprintChamfer: chamfer });
  invalidateTronRunnerCrowdColliderRecords();
  mainBuildingBasePadRecords.push(basePad);
  addBuildingEdges(overlayGroup, w, h, d, 0, 0, MAIN_BUILDING_Z, PAL.tealLight, chamfer * 0.82, 'main-building', { footprintChamfer: chamfer });
}

buildStaticFacadeStripBatches();

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
  getRevealComplete: () => tronRunnerRevealComplete,
  getRevealStartedAt: () => tronRunnerRevealStartedAt,
  getRevealActive: () => tronRunnerRevealActive,
  getRevealProgress: () => tronRunnerRevealProgress,
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
  performanceLiveMetrics,
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
const tronRunnerIdleCharacterGroup = new THREE.Group();
tronRunnerIdleCharacterGroup.name = 'tron-runner-idle-character';
tronRunnerIdleCharacterGroup.visible = false;
scene.add(tronRunnerIdleCharacterGroup);
const tronMainPlayerBodyGroup = new THREE.Group();
tronMainPlayerBodyGroup.name = 'tron-main-player-body';
tronMainPlayerBodyGroup.visible = false;
scene.add(tronMainPlayerBodyGroup);

let tronRunnerShadowTexture = makeTronRunnerShadowTexture(renderer);
let tronRunnerShadowTextureSoftness = 0.9;
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

function tronRunnerCrowdColorPresetForIndex(index) {
  // The two start-cluster companions on the road by the landing point are colour-locked:
  // index 0 = cyan ('current'), index 1 = green. Everyone else follows the colour plan.
  if (index === 0) return TRON_RUNNER_CROWD_COLOR_PRESETS.current;
  if (index === 1) return TRON_RUNNER_CROWD_COLOR_PRESETS.green || TRON_RUNNER_CROWD_COLOR_PRESETS.current;
  const key = TRON_RUNNER_CROWD_COLOR_PLAN[index % TRON_RUNNER_CROWD_COLOR_PLAN.length] || 'current';
  return TRON_RUNNER_CROWD_COLOR_PRESETS[key] || TRON_RUNNER_CROWD_COLOR_PRESETS.current;
}

function makeTronRunnerCrowdSuitMaterial(colorPreset) {
  return createTronRunnerCrowdSuitMaterial({
    baseMaterial: tronRunnerSuitMat,
    colorPreset,
    emissiveIntensity: tronRunnerCrowdLedEmissiveIntensity(),
    ledBloom: tronRunnerLedBloom,
  });
}

function createTronMainPlayerBodySuitMaterial() {
  return makeTronMainPlayerBodySuitMaterial({
    baseMaterial: tronRunnerSuitMat,
    blackColor: TRON_MAIN_PLAYER_BODY_BLACK_COLOR,
  });
}

function makeTronMainPlayerLimbGeometry(radius, length) {
  if (THREE.CapsuleGeometry) {
    return new THREE.CapsuleGeometry(radius, length, 4, 10);
  }
  return new THREE.CylinderGeometry(radius, radius, length + radius * 2, 10, 1);
}

function registerTronMainPlayerBodyObject(object) {
  object.renderOrder = 8;
  object.frustumCulled = false;
  if (object.children?.length) object.children.forEach(registerTronMainPlayerBodyObject);
}

function addTronMainPlayerLedStrip(parent, length, width, zOffset, xOffset = 0) {
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(width, length, 0.014),
    tronMainPlayerBodyLedMaterial
  );
  led.name = `${parent.name}-led`;
  led.position.set(xOffset, 0, zOffset);
  registerTronMainPlayerBodyObject(led);
  parent.add(led);
  tronMainPlayerBodyLedMaterials.push(tronMainPlayerBodyLedMaterial);
  return led;
}

function addTronMainPlayerLimb({
  name,
  type,
  side = 0,
  x = 0,
  y = 0,
  z = 0,
  radius = 0.045,
  length = 0.36,
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
  ledWidth = 0.018,
  ledLengthScale = 0.76,
}) {
  const limb = new THREE.Group();
  limb.name = name;
  limb.position.set(x, y, z);
  limb.rotation.set(rotationX, rotationY, rotationZ);
  limb.userData.restPosition = limb.position.clone();
  limb.userData.restRotation = limb.rotation.clone();
  limb.userData.type = type;
  limb.userData.side = side;

  const mesh = new THREE.Mesh(makeTronMainPlayerLimbGeometry(radius, length), tronMainPlayerBodySuitMaterial);
  mesh.name = `${name}-suit`;
  registerTronMainPlayerBodyObject(mesh);
  limb.add(mesh);
  addTronMainPlayerLedStrip(limb, length * ledLengthScale, ledWidth, radius + 0.011);
  registerTronMainPlayerBodyObject(limb);
  tronMainPlayerBodyGroup.add(limb);
  tronMainPlayerBodyParts.push(limb);
  return limb;
}

function addTronMainPlayerFoot({ name, side, x, y, z }) {
  const foot = new THREE.Group();
  foot.name = name;
  foot.position.set(x, y, z);
  foot.rotation.set(THREE.MathUtils.degToRad(82), 0, side * THREE.MathUtils.degToRad(3));
  foot.userData.restPosition = foot.position.clone();
  foot.userData.restRotation = foot.rotation.clone();
  foot.userData.type = 'foot';
  foot.userData.side = side;

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.34), tronMainPlayerBodySuitMaterial);
  mesh.name = `${name}-suit`;
  registerTronMainPlayerBodyObject(mesh);
  foot.add(mesh);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.011, 0.24), tronMainPlayerBodyLedMaterial);
  led.name = `${name}-led`;
  led.position.set(0, 0.045, -0.02);
  registerTronMainPlayerBodyObject(led);
  foot.add(led);
  tronMainPlayerBodyLedMaterials.push(tronMainPlayerBodyLedMaterial);
  registerTronMainPlayerBodyObject(foot);
  tronMainPlayerBodyGroup.add(foot);
  tronMainPlayerBodyParts.push(foot);
  return foot;
}

function buildTronMainPlayerBody() {
  if (tronMainPlayerBodyState.ready || !TRON_MAIN_PLAYER_BODY_ENABLED) return;
  tronMainPlayerBodyGroup.clear();
  tronMainPlayerBodyParts.length = 0;
  tronMainPlayerBodyLedMaterials.length = 0;
  tronMainPlayerBodySuitMaterial = createTronMainPlayerBodySuitMaterial();
  tronMainPlayerBodyLedMaterial = makeTronMainPlayerBodyLedMaterial(TRON_MAIN_PLAYER_BODY_LED_COLOR);

  addTronMainPlayerLimb({
    name: 'main-player-left-upper-arm',
    type: 'arm',
    side: -1,
    x: -0.34,
    y: -0.33,
    z: -0.78,
    radius: 0.044,
    length: 0.34,
    rotationX: THREE.MathUtils.degToRad(-18),
    rotationZ: THREE.MathUtils.degToRad(-12),
  });
  addTronMainPlayerLimb({
    name: 'main-player-right-upper-arm',
    type: 'arm',
    side: 1,
    x: 0.34,
    y: -0.33,
    z: -0.78,
    radius: 0.044,
    length: 0.34,
    rotationX: THREE.MathUtils.degToRad(-18),
    rotationZ: THREE.MathUtils.degToRad(12),
  });
  addTronMainPlayerLimb({
    name: 'main-player-left-forearm',
    type: 'forearm',
    side: -1,
    x: -0.31,
    y: -0.58,
    z: -0.88,
    radius: 0.039,
    length: 0.36,
    rotationX: THREE.MathUtils.degToRad(-38),
    rotationZ: THREE.MathUtils.degToRad(-8),
  });
  addTronMainPlayerLimb({
    name: 'main-player-right-forearm',
    type: 'forearm',
    side: 1,
    x: 0.31,
    y: -0.58,
    z: -0.88,
    radius: 0.039,
    length: 0.36,
    rotationX: THREE.MathUtils.degToRad(-38),
    rotationZ: THREE.MathUtils.degToRad(8),
  });
  addTronMainPlayerLimb({
    name: 'main-player-left-thigh',
    type: 'leg',
    side: -1,
    x: -0.16,
    y: -0.67,
    z: -1.08,
    radius: 0.052,
    length: 0.38,
    rotationX: THREE.MathUtils.degToRad(10),
    rotationZ: THREE.MathUtils.degToRad(-3),
  });
  addTronMainPlayerLimb({
    name: 'main-player-right-thigh',
    type: 'leg',
    side: 1,
    x: 0.16,
    y: -0.67,
    z: -1.08,
    radius: 0.052,
    length: 0.38,
    rotationX: THREE.MathUtils.degToRad(10),
    rotationZ: THREE.MathUtils.degToRad(3),
  });
  addTronMainPlayerLimb({
    name: 'main-player-left-shin',
    type: 'shin',
    side: -1,
    x: -0.16,
    y: -0.93,
    z: -1.0,
    radius: 0.046,
    length: 0.34,
    rotationX: THREE.MathUtils.degToRad(-2),
    rotationZ: THREE.MathUtils.degToRad(-2),
  });
  addTronMainPlayerLimb({
    name: 'main-player-right-shin',
    type: 'shin',
    side: 1,
    x: 0.16,
    y: -0.93,
    z: -1.0,
    radius: 0.046,
    length: 0.34,
    rotationX: THREE.MathUtils.degToRad(-2),
    rotationZ: THREE.MathUtils.degToRad(2),
  });
  addTronMainPlayerFoot({
    name: 'main-player-left-foot',
    side: -1,
    x: -0.16,
    y: -1.11,
    z: -1.1,
  });
  addTronMainPlayerFoot({
    name: 'main-player-right-foot',
    side: 1,
    x: 0.16,
    y: -1.11,
    z: -1.1,
  });

  tronMainPlayerBodyGroup.scale.setScalar(TRON_MAIN_PLAYER_BODY_SCALE);
  tronMainPlayerBodyState.ready = true;
  tronMainPlayerBodyState.limbCount = tronMainPlayerBodyParts.length;
  tronMainPlayerBodyState.ledCount = tronMainPlayerBodyLedMaterials.length;
}

function shouldShowTronMainPlayerBody() {
  if (!TRON_MAIN_PLAYER_BODY_ENABLED || !tronMainPlayerBodyState.ready) return false;
  if (!TRON_MAIN_PLAYER_BODY_REVEAL_WITH_CHARACTERS) return true;
  const characterRevealDone = !TRON_RUNNER_REVEAL_ENABLED || tronRunnerState.reveal.complete;
  return cityRevealComplete && characterRevealDone;
}

function updateTronMainPlayerBody(dt) {
  if (!tronMainPlayerBodyState.ready) return;
  const visible = shouldShowTronMainPlayerBody();
  tronMainPlayerBodyGroup.visible = visible;
  tronMainPlayerBodyState.visible = visible;
  if (!visible) return;

  tronMainPlayerBodyOffsetWorld.copy(TRON_MAIN_PLAYER_BODY_CAMERA_OFFSET).applyQuaternion(camera.quaternion);
  tronMainPlayerBodyGroup.position.copy(camera.position).add(tronMainPlayerBodyOffsetWorld);
  tronMainPlayerBodyGroup.quaternion.copy(camera.quaternion);

  const speedFactor = THREE.MathUtils.clamp(movementHorizontalSpeed / Math.max(1, speedBase), 0, 1.65);
  const targetWalkAmount = speedFactor > 0.025 ? speedFactor : 0;
  tronMainPlayerBodyState.walkAmount = THREE.MathUtils.lerp(
    tronMainPlayerBodyState.walkAmount,
    targetWalkAmount,
    Math.min(1, dt * 10)
  );
  tronMainPlayerBodyState.speed = Number(movementHorizontalSpeed.toFixed(3));
  if (tronMainPlayerBodyState.walkAmount > 0.015) {
    const cadence = THREE.MathUtils.lerp(walkStepRate, runStepRate, movementRunMix);
    const pace = THREE.MathUtils.clamp(speedFactor, 0.5, 1.85);
    tronMainPlayerBodyState.phase += dt * cadence * Math.PI * 2 * pace;
  }

  const walkAmount = tronMainPlayerBodyState.walkAmount;
  const phase = tronMainPlayerBodyState.phase;
  const bodyBob = Math.abs(Math.sin(phase)) * 0.024 * walkAmount;
  const strafeBias = movementStrafeDirection * movementStrafeMix * 0.035 * walkAmount;
  for (const part of tronMainPlayerBodyParts) {
    const restPosition = part.userData.restPosition;
    const restRotation = part.userData.restRotation;
    const side = part.userData.side || 0;
    const partPhase = phase + (side > 0 ? Math.PI : 0);
    const swing = Math.sin(partPhase) * walkAmount;
    const lift = Math.max(0, Math.sin(partPhase)) * walkAmount;
    part.position.copy(restPosition);
    part.rotation.copy(restRotation);

    if (part.userData.type === 'arm' || part.userData.type === 'forearm') {
      const armScale = part.userData.type === 'forearm' ? 0.46 : 0.34;
      part.rotation.x += swing * armScale;
      part.rotation.z += side * 0.035 * walkAmount + strafeBias;
      part.position.y += bodyBob * 0.6;
      part.position.z += Math.abs(swing) * 0.025;
    } else if (part.userData.type === 'leg' || part.userData.type === 'shin') {
      const legScale = part.userData.type === 'shin' ? 0.38 : 0.3;
      part.rotation.x += swing * legScale;
      part.position.y += lift * 0.035 - bodyBob * 0.35;
      part.position.z += swing * 0.035;
    } else if (part.userData.type === 'foot') {
      part.rotation.x += swing * 0.24;
      part.position.y += lift * 0.03 - bodyBob * 0.25;
      part.position.z += swing * 0.045;
    }
  }

  const beatMultiplier = tronRunnerState.beatPulse?.multiplier || 1;
  const ledOpacity = THREE.MathUtils.clamp(0.72 + walkAmount * 0.12 + (beatMultiplier - 1) * 0.07, 0.62, 1);
  for (const material of tronMainPlayerBodyLedMaterials) {
    material.opacity = ledOpacity;
  }
  if (tronMainPlayerBodySuitMaterial) {
    tronMainPlayerBodySuitMaterial.emissiveIntensity = THREE.MathUtils.clamp(0.18 + walkAmount * 0.08, 0.16, 0.34);
  }
}

function tronMainPlayerBodyInspect() {
  return {
    ...tronMainPlayerBodyState,
    groupVisible: tronMainPlayerBodyGroup.visible,
    position: {
      x: Number(tronMainPlayerBodyGroup.position.x.toFixed(3)),
      y: Number(tronMainPlayerBodyGroup.position.y.toFixed(3)),
      z: Number(tronMainPlayerBodyGroup.position.z.toFixed(3)),
    },
    scale: Number(tronMainPlayerBodyGroup.scale.x.toFixed(3)),
  };
}

function makeTronRunnerReflectionMaterial() {
  return createTronRunnerReflectionMaterial({ suitTexture: tronRunnerSuitTexture });
}

function makeTronRunnerReflectionBodyMaterial() {
  return createTronRunnerReflectionBodyMaterial({ suitTexture: tronRunnerSuitTexture });
}

function makeTronRunnerReflectionLedMaterial(colorPreset = null) {
  return createTronRunnerReflectionLedMaterial({
    colorPreset,
    ledMaskTexture: tronRunnerSuitLedMaskTexture,
  });
}

const tronRunnerShadowMat = new THREE.MeshBasicMaterial({
  color: TRON_RUNNER_SHADOW_COLOR,
  alphaMap: tronRunnerShadowTexture,
  blending: THREE.NormalBlending,
  depthWrite: false,
  opacity: 0.16,
  toneMapped: false,
  transparent: true,
});
const tronRunnerRealShadowMat = new THREE.ShadowMaterial({
  color: TRON_RUNNER_REAL_SHADOW_COLOR,
  opacity: TRON_RUNNER_REAL_SHADOW_BASE_OPACITY,
  depthWrite: false,
  transparent: true,
});
const tronRunnerRevealScanMat = new THREE.MeshBasicMaterial({
  color: 0x62f7ff,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  opacity: 0,
  toneMapped: false,
  transparent: true,
});
const tronRunnerRealShadowLight = new THREE.DirectionalLight(0xc7fbff, 0.16);
tronRunnerRealShadowLight.name = 'tron-runner-real-shadow-light';
tronRunnerRealShadowLight.castShadow = TRON_RUNNER_REAL_SHADOW_ENABLED;
tronRunnerRealShadowLight.visible = TRON_RUNNER_REAL_SHADOW_ENABLED;
tronRunnerRealShadowLight.layers.set(TRON_RUNNER_REAL_SHADOW_LAYER);
tronRunnerRealShadowLight.shadow.mapSize.set(TRON_RUNNER_REAL_SHADOW_MAP_SIZE, TRON_RUNNER_REAL_SHADOW_MAP_SIZE);
tronRunnerRealShadowLight.shadow.bias = -0.00018;
tronRunnerRealShadowLight.shadow.normalBias = 0.035;
tronRunnerRealShadowLight.shadow.radius = 3;
tronRunnerRealShadowLight.shadow.camera.near = 1;
tronRunnerRealShadowLight.shadow.camera.far = 46;
tronRunnerRealShadowLight.shadow.camera.left = -TRON_RUNNER_REAL_SHADOW_CAMERA_SIZE;
tronRunnerRealShadowLight.shadow.camera.right = TRON_RUNNER_REAL_SHADOW_CAMERA_SIZE;
tronRunnerRealShadowLight.shadow.camera.top = TRON_RUNNER_REAL_SHADOW_CAMERA_SIZE;
tronRunnerRealShadowLight.shadow.camera.bottom = -TRON_RUNNER_REAL_SHADOW_CAMERA_SIZE;
tronRunnerRealShadowLight.shadow.camera.updateProjectionMatrix();
const tronRunnerRealShadowTarget = new THREE.Object3D();
tronRunnerRealShadowTarget.name = 'tron-runner-real-shadow-target';
tronRunnerRealShadowLight.target = tronRunnerRealShadowTarget;
scene.add(tronRunnerRealShadowLight);
scene.add(tronRunnerRealShadowTarget);
const tronRunnerParts = createTronRunnerParts({
  realShadowLight: tronRunnerRealShadowLight,
  realShadowTarget: tronRunnerRealShadowTarget,
});
const tronRunnerState = createTronRunnerState({
  footstepBus: FOOTSTEP_NPC_SPATIAL_BUS,
});
const tronRunnerBox = new THREE.Box3();
const tronRunnerSize = new THREE.Vector3();
let tronRunnerElapsed = 0;
let tronRunnerVisualDistanceWalked = 0;
let tronRunnerYaw = 0;
let tronRunnerTargetYaw = 0;
let tronRunnerBodyLight = 1;
let tronRunnerLineLight = 1;
let tronRunnerKeyLight = 1;
let tronRunnerRimLight = 1;
let tronRunnerFillLight = 1;
let tronRunnerLedBrightness = TRON_RUNNER_CHARACTER_LED_BRIGHTNESS_MULTIPLIER;
let tronRunnerLedBloom = TRON_RUNNER_CHARACTER_LED_BLOOM_BOOST;
let tronRunnerBeatPulseEnabled = TRON_RUNNER_BEAT_PULSE_ENABLED;
let tronRunnerBeatPulseBpm = TRON_RUNNER_BEAT_PULSE_BPM;
let tronRunnerBeatPulseOffset = TRON_RUNNER_BEAT_PULSE_OFFSET_SECONDS;
let tronRunnerBeatPulseIntensity = TRON_RUNNER_BEAT_PULSE_INTENSITY;
let tronRunnerBeatPulseDecay = TRON_RUNNER_BEAT_PULSE_DECAY;
let tronRunnerBeatPulseDivision = TRON_RUNNER_BEAT_PULSE_DIVISION;
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
const tronMainPlayerBodyState = createTronMainPlayerBodyState();
const tronMainPlayerBodyParts = [];
const tronMainPlayerBodyLedMaterials = [];
const tronMainPlayerBodyOffsetWorld = new THREE.Vector3();
let tronMainPlayerBodySuitMaterial = null;
let tronMainPlayerBodyLedMaterial = null;
let tronRunnerWalkSpeed = TRON_RUNNER_DEFAULT_SPEED;
let tronRunnerAnimationSpeed = 1;
let tronRunnerStrideSync = 1;
let tronRunnerRevealStartedAt = 0;
let tronRunnerRevealProgress = TRON_RUNNER_REVEAL_ENABLED ? 0 : 1;
let tronRunnerRevealRawProgress = TRON_RUNNER_REVEAL_ENABLED ? 0 : 1;
let tronRunnerRevealActive = false;
let tronRunnerRevealComplete = !TRON_RUNNER_REVEAL_ENABLED;
const tronRunnerRevealVisualCache = createTronRunnerRevealVisualCache();
let tronRunnerCrowdAccumulatedDt = 0;
const tronRunnerCrowd = [];
const tronRunnerIdleCharacter = createTronRunnerIdleCharacter({
  group: tronRunnerIdleCharacterGroup,
});
// The stationary idle character (parked at civic 2) gets one ambient line on approach,
// reusing the crowd speech-bubble pool. Shaped like a crowd talker (group + talk* fields).
const tronRunnerIdleTalk = {
  group: tronRunnerIdleCharacterGroup,
  talkLines: ['Mi godo la pausa'],
  talkCycle: 0,
  talkArmed: true,
  talkUntil: 0,
  talkStart: 0,
  talkText: '',
};
const tronRunnerCrowdBox = new THREE.Box3();
const tronRunnerIdleCharacterBoundsCenter = new THREE.Vector3();
const tronRunnerCrowdSize = new THREE.Vector3();
const tronRunnerCrowdCullMatrix = new THREE.Matrix4();
const tronRunnerCrowdCullFrustum = new THREE.Frustum();
const tronRunnerCrowdCullSphere = new THREE.Sphere(new THREE.Vector3(), TRON_RUNNER_CROWD_CULL_RADIUS);
const tronRunnerCrowdSpatialGrid = new Map();
let tronRunnerCrowdBuildJob = null;
const tronRunnerCrowdBuildStats = createTronRunnerCrowdBuildStats();
const tronRunnerCrowdRuntimeStats = createTronRunnerCrowdRuntimeStats();
const tronRunnerCrowdReflectionCandidates = [];
const tronRunnerBeatPulseState = createTronRunnerBeatPulseState();
const tronRunnerBeatPulseRuntimeStats = createTronRunnerBeatPulseRuntimeStats();

function tronRunnerCharacterLedDefaultScale() {
  return TRON_RUNNER_CHARACTER_LED_BRIGHTNESS_MULTIPLIER * TRON_RUNNER_CHARACTER_LED_BLOOM_BOOST;
}

function tronRunnerCharacterLedScale() {
  return Math.max(0, tronRunnerLedBrightness) * Math.max(0, tronRunnerLedBloom);
}

function tronRunnerCrowdLedEmissiveIntensity() {
  const defaultScale = tronRunnerCharacterLedDefaultScale();
  const scale = defaultScale > 0 ? tronRunnerCharacterLedScale() / defaultScale : 1;
  return THREE.MathUtils.clamp(TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY * scale, 0, 12);
}

function tronRunnerSetBeatPulseState(nextState) {
  Object.assign(tronRunnerBeatPulseState, nextState);
  // Mutate the existing beatPulse object in place (allocated once in createTronRunnerState)
  // instead of reassigning a fresh literal every frame; values stay byte-identical.
  const beat = tronRunnerState.beatPulse || (tronRunnerState.beatPulse = {});
  beat.enabled = tronRunnerBeatPulseEnabled;
  beat.bpm = tronRunnerBeatPulseBpm;
  beat.offsetSeconds = tronRunnerBeatPulseOffset;
  beat.intensity = tronRunnerBeatPulseIntensity;
  beat.decay = tronRunnerBeatPulseDecay;
  beat.division = tronRunnerBeatPulseDivision;
  beat.value = Number(tronRunnerBeatPulseState.value.toFixed(3));
  beat.multiplier = Number(tronRunnerBeatPulseState.multiplier.toFixed(3));
  beat.phase = Number(tronRunnerBeatPulseState.phase.toFixed(3));
  beat.beatIndex = tronRunnerBeatPulseState.beatIndex;
  beat.audioTime = Number(tronRunnerBeatPulseState.audioTime.toFixed(3));
  beat.active = tronRunnerBeatPulseState.active;
  beat.source = tronRunnerBeatPulseState.source || 'bpm';
  beat.kickPulse = Number((tronRunnerBeatPulseState.kickPulse || 0).toFixed(3));
  beat.bassPulse = Number((tronRunnerBeatPulseState.bassPulse || 0).toFixed(3));
  beat.bassEnergy = Number((tronRunnerBeatPulseState.bassEnergy || 0).toFixed(3));
  beat.lowBandDriven = Boolean(tronRunnerBeatPulseState.lowBandDriven);
  beat.analyserReady = Boolean(tronRunnerBeatPulseState.analyserReady);
  beat.sampleAgeMs = Number.isFinite(tronRunnerBeatPulseState.sampleAgeMs)
    ? Number(tronRunnerBeatPulseState.sampleAgeMs.toFixed(1))
    : null;
  beat.materialUpdateOptimized = tronRunnerBeatPulseRuntimeStats.materialUpdateOptimized;
  beat.materialPasses = tronRunnerBeatPulseRuntimeStats.materialPasses;
  beat.materialSkips = tronRunnerBeatPulseRuntimeStats.materialSkips;
  beat.materialCount = tronRunnerBeatPulseRuntimeStats.materialCount;
  beat.baseRevision = tronRunnerBeatPulseRuntimeStats.baseRevision;
}

function tronRunnerSoundtrackTimeSeconds() {
  const active = tronSoundtrack.elements?.[tronSoundtrack.activeIndex];
  const time = Number(active?.currentTime);
  return Number.isFinite(time) ? time : 0;
}

const tronRunnerBeatPulseValueScratch = {
  value: 0,
  multiplier: 1,
  phase: 0,
  beatIndex: 0,
  audioTime: 0,
  active: false,
  source: 'inactive',
  kickPulse: 0,
  bassPulse: 0,
  bassEnergy: 0,
  lowBandDriven: false,
  analyserReady: false,
  sampleAgeMs: Infinity,
};

function tronRunnerBeatPulseValue(audioTime = tronRunnerSoundtrackTimeSeconds()) {
  // Reused scratch: consumed synchronously by updateTronRunnerBeatPulse (Object.assign + reads).
  const out = tronRunnerBeatPulseValueScratch;
  if (!tronRunnerBeatPulseEnabled || !tronSoundtrack.playing || !tronRunnerRevealComplete) {
    out.value = 0;
    out.multiplier = 1;
    out.phase = 0;
    out.beatIndex = 0;
    out.audioTime = audioTime;
    out.active = false;
    out.source = 'inactive';
    out.kickPulse = 0;
    out.bassPulse = 0;
    out.bassEnergy = 0;
    out.lowBandDriven = false;
    out.analyserReady = labEqualizerAnalyserPresent();
    out.sampleAgeMs = Infinity;
    return out;
  }
  const now = performance.now();
  const sampleAgeMs = Number.isFinite(labEqualizerLastSampleTime()) ? now - labEqualizerLastSampleTime() : Infinity;
  const analyserReady = Boolean(labEqualizerAnalyserSampleReady() && labEqualizerState.sampleCount > 0);
  const kickAvailable = Boolean(
    TRON_RUNNER_BEAT_PULSE_AUDIO_KICK_ENABLED
    && analyserReady
    && labEqualizerState.playing
    && sampleAgeMs <= TRON_RUNNER_BEAT_PULSE_AUDIO_SAMPLE_MAX_AGE_MS
  );
  if (kickAvailable) {
    const kickPulse = THREE.MathUtils.clamp(labEqualizerState.beatPulse, 0, 1);
    const bassEnergy = THREE.MathUtils.clamp(labEqualizerState.bassEnergy, 0, 1);
    const bassBody = TRON_RUNNER_BEAT_PULSE_LOW_BAND_ENABLED
      ? Math.max(0, bassEnergy - TRON_RUNNER_BEAT_PULSE_BASS_BODY_THRESHOLD) * TRON_RUNNER_BEAT_PULSE_BASS_BODY_GAIN
      : 0;
    const value = THREE.MathUtils.clamp(kickPulse * 1.08 + bassBody, 0, 1);
    const multiplier = THREE.MathUtils.clamp(
      1 + value * Math.max(0, tronRunnerBeatPulseIntensity),
      1,
      TRON_RUNNER_BEAT_PULSE_MAX_MULTIPLIER
    );
    out.value = value;
    out.multiplier = multiplier;
    out.phase = 0;
    out.beatIndex = labEqualizerState.sampleCount;
    out.audioTime = audioTime;
    out.active = true;
    out.source = 'audio-bass-kick';
    out.kickPulse = kickPulse;
    out.bassPulse = value;
    out.bassEnergy = bassEnergy;
    out.lowBandDriven = TRON_RUNNER_BEAT_PULSE_LOW_BAND_ENABLED;
    out.analyserReady = analyserReady;
    out.sampleAgeMs = sampleAgeMs;
    return out;
  }
  const bpm = Math.max(1, tronRunnerBeatPulseBpm);
  const division = Math.max(0.05, tronRunnerBeatPulseDivision);
  const elapsedBeats = Math.max(0, (audioTime - tronRunnerBeatPulseOffset) * bpm / 60 * division);
  const beatIndex = Math.floor(elapsedBeats);
  const phase = elapsedBeats - beatIndex;
  const value = THREE.MathUtils.clamp(Math.exp(-phase * Math.max(0.1, tronRunnerBeatPulseDecay)), 0, 1);
  const multiplier = THREE.MathUtils.clamp(
    1 + value * Math.max(0, tronRunnerBeatPulseIntensity),
    1,
    TRON_RUNNER_BEAT_PULSE_MAX_MULTIPLIER
  );
  out.value = value;
  out.multiplier = multiplier;
  out.phase = phase;
  out.beatIndex = beatIndex;
  out.audioTime = audioTime;
  out.active = true;
  out.source = analyserReady ? 'bpm-clock' : 'bpm-fallback';
  out.kickPulse = 0;
  out.bassPulse = 0;
  out.bassEnergy = THREE.MathUtils.clamp(labEqualizerState.bassEnergy || 0, 0, 1);
  out.lowBandDriven = false;
  out.analyserReady = analyserReady;
  out.sampleAgeMs = sampleAgeMs;
  return out;
}

function applyTronRunnerBeatPulseToMaterial(material, multiplier) {
  if (!material || !Number.isFinite(material.emissiveIntensity)) return;
  const base = Number.isFinite(material.userData?.tronRunnerBaseEmissiveIntensity)
    ? material.userData.tronRunnerBaseEmissiveIntensity
    : material.emissiveIntensity;
  const next = THREE.MathUtils.clamp(base * multiplier, 0, 24);
  if (Math.abs(material.emissiveIntensity - next) < 0.0005) return;
  material.emissiveIntensity = next;
}

function tronRunnerBeatPulseMaterialCount() {
  let crowdMaterialCount = 0;
  for (const member of tronRunnerCrowd) {
    crowdMaterialCount += member.materials?.length || 0;
  }
  tronRunnerBeatPulseRuntimeStats.mainMaterialCount = tronRunnerParts.materials.length;
  tronRunnerBeatPulseRuntimeStats.crowdMaterialCount = crowdMaterialCount;
  tronRunnerBeatPulseRuntimeStats.materialCount = tronRunnerParts.materials.length + crowdMaterialCount;
  return tronRunnerBeatPulseRuntimeStats.materialCount;
}

function shouldSkipTronRunnerBeatPulseMaterialUpdate(nextState, materialCount) {
  if (!TRON_RUNNER_BEAT_PULSE_MATERIAL_SKIP_ENABLED) return false;
  const stats = tronRunnerBeatPulseRuntimeStats;
  if (materialCount !== stats.lastAppliedMaterialCount) return false;
  if (stats.baseRevision !== stats.lastAppliedBaseRevision) return false;
  if (nextState.active !== stats.lastAppliedActive) return false;
  if ((nextState.source || '') !== stats.lastAppliedSource) return false;
  if (nextState.beatIndex !== stats.lastAppliedBeatIndex) return false;
  return Math.abs(nextState.multiplier - stats.lastAppliedMultiplier) < TRON_RUNNER_BEAT_PULSE_MATERIAL_EPS;
}

function recordTronRunnerBeatPulseMaterialPass(nextState, materialCount) {
  const stats = tronRunnerBeatPulseRuntimeStats;
  stats.materialPasses += 1;
  stats.lastAppliedMultiplier = nextState.multiplier;
  stats.lastAppliedBeatIndex = nextState.beatIndex;
  stats.lastAppliedActive = nextState.active;
  stats.lastAppliedSource = nextState.source || '';
  stats.lastAppliedMaterialCount = materialCount;
  stats.lastAppliedBaseRevision = stats.baseRevision;
}

function updateTronRunnerBeatPulse() {
  const nextState = tronRunnerBeatPulseValue();
  const materialCount = tronRunnerBeatPulseMaterialCount();
  if (shouldSkipTronRunnerBeatPulseMaterialUpdate(nextState, materialCount)) {
    tronRunnerBeatPulseRuntimeStats.materialSkips += 1;
    tronRunnerSetBeatPulseState(nextState);
    return;
  }
  recordTronRunnerBeatPulseMaterialPass(nextState, materialCount);
  const multiplier = nextState.multiplier;
  for (const material of tronRunnerParts.materials) {
    applyTronRunnerBeatPulseToMaterial(material, multiplier);
  }
  for (const member of tronRunnerCrowd) {
    const materials = member.materials?.length ? member.materials : [];
    for (const material of materials) {
      applyTronRunnerBeatPulseToMaterial(material, multiplier);
    }
  }
  tronRunnerSetBeatPulseState(nextState);
}

function applyTronRunnerCrowdLedControls() {
  tronRunnerBeatPulseRuntimeStats.baseRevision += 1;
  const emissiveIntensity = tronRunnerCrowdLedEmissiveIntensity();
  for (const member of tronRunnerCrowd) {
    const materials = member.materials?.length ? member.materials : [];
    if (!materials.length) {
      member.model?.traverse((object) => {
        const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
        objectMaterials.forEach((material) => {
          if (!material || !Number.isFinite(material.emissiveIntensity)) return;
          materials.push(material);
        });
      });
      member.materials = [...new Set(materials)];
    }
    for (const material of member.materials || []) {
      if (!material || !Number.isFinite(material.emissiveIntensity)) continue;
      material.emissiveIntensity = emissiveIntensity;
      material.userData.tronRunnerBaseEmissiveIntensity = emissiveIntensity;
      material.needsUpdate = true;
    }
  }
  updateTronRunnerBeatPulse();
}

const tronRunnerAutonomy = createTronRunnerAutonomy({
  footstepBus: FOOTSTEP_NPC_SPATIAL_BUS,
});

function tronRunnerDoorHalfHeight() {
  return sideDoorHeight * sideDoorScale * 0.5;
}

function tronRunnerEffectiveAnimationSpeed() {
  return computeTronRunnerEffectiveAnimationSpeed({
    walkSpeed: tronRunnerWalkSpeed,
    defaultSpeed: TRON_RUNNER_DEFAULT_SPEED,
    animationSpeed: tronRunnerAnimationSpeed,
    strideSync: tronRunnerStrideSync,
  });
}

function syncTronRunnerWalkCycleToDistance(mixer, action, distance, phaseOffset = 0, cycleDistance = TRON_RUNNER_WALK_CYCLE_DISTANCE) {
  return syncTronRunnerWalkCycleToDistanceCore({
    mixer,
    action,
    distance,
    phaseOffset,
    cycleDistance,
  });
}

function syncTronRunnerActionSetToDistance(distance, phaseOffset = 0) {
  const synced = syncTronRunnerWalkCycleToDistance(
    tronRunnerParts.mixer,
    tronRunnerParts.activeAction,
    distance,
    phaseOffset
  );
  syncTronRunnerWalkCycleToDistance(
    tronRunnerParts.reflectionMixer,
    tronRunnerParts.reflectionActiveAction,
    distance,
    phaseOffset
  );
  syncTronRunnerWalkCycleToDistance(
    tronRunnerParts.reflectionLedMixer,
    tronRunnerParts.reflectionLedActiveAction,
    distance,
    phaseOffset
  );
  return synced;
}

function syncTronRunnerCrowdWalkCycleToDistance(member) {
  if (!member) return false;
  const offset = member.walkCycleOffset || 0;
  const distance = member.distanceWalked || 0;
  const synced = syncTronRunnerWalkCycleToDistance(member.mixer, member.action, distance, offset);
  if (member.dynamicReflectionBudgetActive) {
    syncTronRunnerWalkCycleToDistance(member.reflectionMixer, member.reflectionAction, distance, offset);
    syncTronRunnerWalkCycleToDistance(member.reflectionLedMixer, member.reflectionLedAction, distance, offset);
  }
  return synced;
}

// Same as the walk version but for the greeter's run clip: drive the run cycle by ground
// distance (no foot-slide / moonwalk) using the run-specific cycle distance.
function syncTronRunnerCrowdRunCycleToDistance(member) {
  if (!member) return false;
  const offset = member.walkCycleOffset || 0;
  const distance = member.distanceWalked || 0;
  const cycle = GREETER_RUN_CYCLE_DISTANCE;
  const synced = syncTronRunnerWalkCycleToDistance(member.mixer, member.action, distance, offset, cycle);
  if (member.dynamicReflectionBudgetActive) {
    syncTronRunnerWalkCycleToDistance(member.reflectionMixer, member.reflectionAction, distance, offset, cycle);
    syncTronRunnerWalkCycleToDistance(member.reflectionLedMixer, member.reflectionLedAction, distance, offset, cycle);
  }
  return synced;
}

function tronRunnerSuitLightIntensity(bodyAmount, fillAmount, materialDepth = 0.5) {
  return THREE.MathUtils.clamp(
    0.035 + bodyAmount * 0.025 + fillAmount * 0.006 + materialDepth * 0.018,
    0.025,
    0.16
  );
}

function tronRunnerModelLineIntensity(lineAmount, keyAmount, rimAmount, keyShape = 1, rimShape = 1) {
  if (lineAmount <= 0.001) return 0;
  return THREE.MathUtils.clamp(
    0.08 + lineAmount * 0.09 + keyAmount * 0.025 * keyShape + rimAmount * 0.018 * rimShape,
    0,
    0.62
  );
}

function tronRunnerRevealEase(t) {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function makeTronRunnerRevealScan() {
  const scan = new THREE.Group();
  scan.name = 'tron-runner-reveal-scan';
  scan.visible = false;
  const outer = new THREE.Mesh(
    new THREE.TorusGeometry(TRON_RUNNER_REVEAL_SCAN_RADIUS, TRON_RUNNER_REVEAL_SCAN_TUBE, 8, 96),
    tronRunnerRevealScanMat
  );
  outer.name = 'tron-runner-reveal-scan-ring';
  outer.rotation.x = Math.PI / 2;
  outer.scale.set(1, 0.58, 1);
  scan.add(outer);
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(TRON_RUNNER_REVEAL_SCAN_RADIUS * 0.72, TRON_RUNNER_REVEAL_SCAN_TUBE * 0.55, 8, 72),
    tronRunnerRevealScanMat.clone()
  );
  inner.name = 'tron-runner-reveal-scan-core';
  inner.rotation.x = Math.PI / 2;
  inner.scale.set(1, 0.52, 1);
  scan.add(inner);
  return scan;
}

function setTronRunnerRevealState(progress, rawProgress, phase, active, complete) {
  tronRunnerRevealProgress = THREE.MathUtils.clamp(progress, 0, 1);
  tronRunnerRevealRawProgress = THREE.MathUtils.clamp(rawProgress, 0, 1);
  tronRunnerRevealActive = Boolean(active);
  tronRunnerRevealComplete = Boolean(complete);
  tronRunnerState.reveal = {
    enabled: TRON_RUNNER_REVEAL_ENABLED,
    mode: 'post-city-scan-pulse',
    durationMs: TRON_RUNNER_REVEAL_DURATION_MS,
    phase,
    progress: Number(tronRunnerRevealProgress.toFixed(3)),
    rawProgress: Number(tronRunnerRevealRawProgress.toFixed(3)),
    active: tronRunnerRevealActive,
    complete: tronRunnerRevealComplete,
    visibleFactor: Number(tronRunnerRevealProgress.toFixed(3)),
    scanVisible: Boolean(tronRunnerParts.revealScan?.visible),
    scanY: Number((tronRunnerParts.revealScan?.position.y ?? 0).toFixed(3)),
    emissiveBoost: TRON_RUNNER_REVEAL_EMISSIVE_BOOST,
    scanOuterOpacity: TRON_RUNNER_REVEAL_SCAN_OUTER_OPACITY,
    scanCoreOpacity: TRON_RUNNER_REVEAL_SCAN_CORE_OPACITY,
  };
}

function resetTronRunnerRevealState() {
  tronRunnerRevealStartedAt = 0;
  const complete = !TRON_RUNNER_REVEAL_ENABLED;
  setTronRunnerRevealState(complete ? 1 : 0, complete ? 1 : 0, complete ? 'complete' : 'waiting-city', false, complete);
  applyTronRunnerRevealVisuals();
}

function startTronRunnerReveal(now) {
  if (!TRON_RUNNER_REVEAL_ENABLED) {
    setTronRunnerRevealState(1, 1, 'complete', false, true);
    applyTronRunnerRevealVisuals();
    return;
  }
  tronRunnerRevealStartedAt = now;
  setTronRunnerRevealState(0, 0, 'active', true, false);
  applyTronRunnerRevealVisuals();
}

function baseMaterialOpacity(material, fallback = 1) {
  return Number.isFinite(material?.userData?.tronRunnerBaseOpacity)
    ? material.userData.tronRunnerBaseOpacity
    : fallback;
}

function applyTronRunnerCrowdRevealVisuals(visibleFactor, complete, activePulse) {
  const revealOpacity = complete ? 1 : visibleFactor;
  for (const member of tronRunnerCrowd) {
    for (const material of member.materials || []) {
      const baseOpacity = baseMaterialOpacity(material, material.opacity);
      const baseEmissive = Number.isFinite(material.userData?.tronRunnerBaseEmissiveIntensity)
        ? material.userData.tronRunnerBaseEmissiveIntensity
        : material.emissiveIntensity;
      material.transparent = !complete;
      material.opacity = baseOpacity * revealOpacity;
      material.depthWrite = complete;
      if (Number.isFinite(material.emissiveIntensity)) {
        material.emissiveIntensity = complete
          ? baseEmissive
          : baseEmissive * (0.2 + visibleFactor * 0.8) + activePulse * TRON_RUNNER_REVEAL_EMISSIVE_BOOST;
      }
      material.needsUpdate = true;
    }
  }
  tronRunnerState.crowdRevealMaterialOpacity = revealOpacity;
}

function syncTronRunnerIdleCharacterVisibility(visibleFactor = THREE.MathUtils.clamp(TRON_RUNNER_REVEAL_ENABLED ? tronRunnerRevealProgress : 1, 0, 1)) {
  const revealVisible = (visibleFactor > 0.002 || tronRunnerRevealActive || tronRunnerRevealComplete);
  const visible = Boolean(
    TRON_RUNNER_IDLE_CHARACTER_ENABLED &&
    tronRunnerIdleCharacter.built &&
    tronRunnerState.ready &&
    revealVisible
  );
  tronRunnerIdleCharacterGroup.visible = visible;
  tronRunnerIdleCharacter.visible = visible;
}

function applyTronRunnerIdleCharacterRevealVisuals(visibleFactor, complete, activePulse) {
  syncTronRunnerIdleCharacterVisibility(visibleFactor);
  if (!tronRunnerIdleCharacter.built) return;
  const revealOpacity = complete ? 1 : visibleFactor;
  for (const material of tronRunnerIdleCharacter.materials || []) {
    const baseOpacity = baseMaterialOpacity(material, material.opacity);
    const baseEmissive = Number.isFinite(material.userData?.tronRunnerBaseEmissiveIntensity)
      ? material.userData.tronRunnerBaseEmissiveIntensity
      : material.emissiveIntensity;
    material.transparent = !complete;
    material.opacity = baseOpacity * revealOpacity;
    material.depthWrite = complete;
    if (Number.isFinite(material.emissiveIntensity)) {
      material.emissiveIntensity = complete
        ? baseEmissive
        : baseEmissive * (0.2 + visibleFactor * 0.8) + activePulse * TRON_RUNNER_REVEAL_EMISSIVE_BOOST;
    }
    material.needsUpdate = true;
  }
}

function applyTronRunnerRevealVisuals() {
  const factor = TRON_RUNNER_REVEAL_ENABLED ? tronRunnerRevealProgress : 1;
  const visibleFactor = THREE.MathUtils.clamp(factor, 0, 1);
  const complete = visibleFactor >= 0.995 || !TRON_RUNNER_REVEAL_ENABLED;
  const activePulse = tronRunnerRevealActive ? Math.sin(Math.PI * tronRunnerRevealRawProgress) : 0;
  const cacheProgress = Number(visibleFactor.toFixed(4));
  const cacheRawProgress = Number(tronRunnerRevealRawProgress.toFixed(4));
  if (
    tronRunnerRevealVisualCache.ready === tronRunnerState.ready &&
    tronRunnerRevealVisualCache.progress === cacheProgress &&
    tronRunnerRevealVisualCache.rawProgress === cacheRawProgress &&
    tronRunnerRevealVisualCache.active === tronRunnerRevealActive &&
    tronRunnerRevealVisualCache.complete === complete &&
    tronRunnerRevealVisualCache.crowdCount === tronRunnerCrowd.length &&
    tronRunnerRevealVisualCache.idleBuilt === tronRunnerIdleCharacter.built &&
    tronRunnerRevealVisualCache.sourceVisible === TRON_RUNNER_SOURCE_CHARACTER_VISIBLE
  ) {
    return;
  }
  tronRunnerRevealVisualCache.ready = tronRunnerState.ready;
  tronRunnerRevealVisualCache.progress = cacheProgress;
  tronRunnerRevealVisualCache.rawProgress = cacheRawProgress;
  tronRunnerRevealVisualCache.active = tronRunnerRevealActive;
  tronRunnerRevealVisualCache.complete = complete;
  tronRunnerRevealVisualCache.crowdCount = tronRunnerCrowd.length;
  tronRunnerRevealVisualCache.idleBuilt = tronRunnerIdleCharacter.built;
  tronRunnerRevealVisualCache.sourceVisible = TRON_RUNNER_SOURCE_CHARACTER_VISIBLE;
  const shouldRenderRunner = Boolean(
    TRON_RUNNER_SOURCE_CHARACTER_VISIBLE &&
    tronRunnerState.ready &&
    (visibleFactor > 0.002 || tronRunnerRevealActive || complete)
  );
  tronRunnerWalker.visible = shouldRenderRunner;
  syncTronRunnerCrowdVisibility();

  for (const material of tronRunnerParts.materials) {
    const baseEmissive = Number.isFinite(material.userData.tronRunnerBaseEmissiveIntensity)
      ? material.userData.tronRunnerBaseEmissiveIntensity
      : material.emissiveIntensity;
    material.transparent = !complete;
    material.opacity = complete ? 1 : visibleFactor;
    material.depthWrite = complete;
    material.emissiveIntensity = complete
      ? baseEmissive
      : baseEmissive * (0.2 + visibleFactor * 0.8) + activePulse * TRON_RUNNER_REVEAL_EMISSIVE_BOOST;
    material.needsUpdate = true;
  }
  applyTronRunnerCrowdRevealVisuals(visibleFactor, complete, activePulse);
  applyTronRunnerIdleCharacterRevealVisuals(visibleFactor, complete, activePulse);

  const groundShadow = tronRunnerParts.groundShadow;
  if (groundShadow?.material) {
    const baseOpacity = baseMaterialOpacity(groundShadow.material, groundShadow.material.opacity);
    groundShadow.visible = shouldRenderRunner && TRON_RUNNER_GROUND_SHADOW_ENABLED && baseOpacity * visibleFactor > 0.002;
    groundShadow.material.opacity = baseOpacity * visibleFactor;
    groundShadow.material.needsUpdate = true;
  }

  const realShadowReceiver = tronRunnerParts.realShadowReceiver;
  if (realShadowReceiver?.material) {
    const baseOpacity = baseMaterialOpacity(realShadowReceiver.material, realShadowReceiver.material.opacity);
    realShadowReceiver.visible = shouldRenderRunner && baseOpacity * visibleFactor > 0.002;
    realShadowReceiver.material.opacity = baseOpacity * visibleFactor;
    realShadowReceiver.material.needsUpdate = true;
    tronRunnerState.realShadowOpacity = baseOpacity * visibleFactor;
  }

  if (tronRunnerParts.realShadowLight) {
    tronRunnerParts.realShadowLight.visible = shouldRenderRunner && TRON_RUNNER_REAL_SHADOW_ENABLED && visibleFactor > 0.01;
    tronRunnerParts.realShadowLight.intensity = shouldRenderRunner && TRON_RUNNER_REAL_SHADOW_ENABLED ? 0.16 * visibleFactor : 0;
  }

  const reflectionGroup = tronRunnerParts.reflectionGroup;
  const reflectionFactor = complete ? 1 : visibleFactor;
  if (reflectionGroup) reflectionGroup.visible = shouldRenderRunner && reflectionGroup.visible && reflectionFactor > 0.01;
  for (const material of tronRunnerParts.reflectionMaterials || []) {
    const baseOpacity = baseMaterialOpacity(material, material.opacity);
    material.opacity = baseOpacity * reflectionFactor;
    material.needsUpdate = true;
  }
  tronRunnerState.dynamicReflectionOpacity *= reflectionFactor;
  tronRunnerState.dynamicReflectionBodyOpacity *= reflectionFactor;
  tronRunnerState.dynamicReflectionLedOpacity *= reflectionFactor;

  const scan = tronRunnerParts.revealScan;
  if (scan) {
    const scanPulse = tronRunnerRevealActive ? Math.sin(Math.PI * tronRunnerRevealRawProgress) : 0;
    const scanY = TRON_RUNNER_TARGET_HEIGHT * THREE.MathUtils.lerp(0.06, 0.98, tronRunnerRevealProgress);
    scan.position.y = scanY;
    scan.visible = tronRunnerRevealActive && scanPulse > 0.02;
    scan.scale.setScalar(1 + scanPulse * 0.08);
    scan.traverse((object) => {
      if (!object.material) return;
      object.material.opacity = scanPulse * (object.name.includes('core')
        ? TRON_RUNNER_REVEAL_SCAN_CORE_OPACITY
        : TRON_RUNNER_REVEAL_SCAN_OUTER_OPACITY);
      object.material.needsUpdate = true;
    });
  }

  const phase = tronRunnerRevealComplete ? 'complete' : tronRunnerRevealActive ? 'active' : 'waiting-city';
  setTronRunnerRevealState(visibleFactor, tronRunnerRevealRawProgress, phase, tronRunnerRevealActive, tronRunnerRevealComplete);
}

function updateTronRunnerReveal(now) {
  if (!tronRunnerState.ready) {
    resetTronRunnerRevealState();
    return;
  }
  if (!TRON_RUNNER_REVEAL_ENABLED) {
    setTronRunnerRevealState(1, 1, 'complete', false, true);
    applyTronRunnerRevealVisuals();
    return;
  }
  if (!cityRevealComplete) {
    if (tronRunnerRevealStartedAt || tronRunnerRevealProgress > 0 || tronRunnerRevealComplete) resetTronRunnerRevealState();
    else applyTronRunnerRevealVisuals();
    return;
  }
  if (!tronRunnerRevealStartedAt && !tronRunnerRevealComplete) {
    startTronRunnerReveal(now);
    return;
  }
  if (tronRunnerRevealComplete) {
    applyTronRunnerRevealVisuals();
    return;
  }
  const raw = THREE.MathUtils.clamp((now - tronRunnerRevealStartedAt) / TRON_RUNNER_REVEAL_DURATION_MS, 0, 1);
  const progress = tronRunnerRevealEase(raw);
  if (raw >= 1) {
    setTronRunnerRevealState(1, 1, 'complete', false, true);
  } else {
    setTronRunnerRevealState(progress, raw, 'active', true, false);
  }
  applyTronRunnerRevealVisuals();
}

function applyTronRunnerVisualControls() {
  const bodyAmount = THREE.MathUtils.clamp(tronRunnerBodyLight, 0, 3);
  const keyAmount = THREE.MathUtils.clamp(tronRunnerKeyLight, 0, 3);
  const rimAmount = THREE.MathUtils.clamp(tronRunnerRimLight, 0, 3);
  const fillAmount = THREE.MathUtils.clamp(tronRunnerFillLight, 0, 3);
  const keyShape = THREE.MathUtils.clamp(tronRunnerKeyLightY / 3.1, 0, 1.8);
  const rimShape = THREE.MathUtils.clamp(tronRunnerRimLightX / 1.9, 0.1, 1.8);
  const fillShape = THREE.MathUtils.clamp(tronRunnerFillLightY / 0.9, 0, 1.8);
  const materialDepth = THREE.MathUtils.clamp((tronRunnerKeyLightZ + 4) / 10, 0, 1);
  const selfLightIntensity = tronRunnerSuitLightIntensity(bodyAmount, fillAmount, materialDepth);
  const modelLineIntensity = tronRunnerModelLineIntensity(tronRunnerLineLight, keyAmount, rimAmount, keyShape, rimShape);
  const floorAmount = TRON_RUNNER_GROUND_SHADOW_ENABLED
    ? THREE.MathUtils.clamp(tronRunnerFloorReflection, 0, 1.2)
    : 0;
  const materialReflect = THREE.MathUtils.clamp(tronRunnerMaterialReflect, 0, 2);
  const materialMetalness = THREE.MathUtils.clamp(tronRunnerMaterialMetalness, 0, 1);
  const materialRoughness = THREE.MathUtils.clamp(tronRunnerMaterialRoughness, 0.02, 1);
  const shadowSoftness = THREE.MathUtils.clamp(tronRunnerShadowSoftness, 0.2, 1.6);
  const shadowCyan = THREE.MathUtils.clamp(tronRunnerShadowCyan, 0, 1);
  const ledScale = tronRunnerCharacterLedScale();
  const ledDefaultScale = tronRunnerCharacterLedDefaultScale();
  const ledMax = THREE.MathUtils.clamp(
    TRON_RUNNER_CHARACTER_LED_EMISSIVE_MAX * Math.max(1, ledDefaultScale > 0 ? ledScale / ledDefaultScale : 1),
    0.5,
    12
  );
  tronRunnerWalker.scale.setScalar(Math.max(0.01, tronRunnerScale));
  tronRunnerState.scale = tronRunnerScale;
  tronRunnerState.targetHeight = TRON_RUNNER_TARGET_HEIGHT * tronRunnerScale;
  tronRunnerState.walkSpeed = tronRunnerWalkSpeed;
  tronRunnerState.animationSpeed = tronRunnerAnimationSpeed;
  tronRunnerState.effectiveAnimationSpeed = tronRunnerEffectiveAnimationSpeed();
  tronRunnerState.strideSync = tronRunnerStrideSync;
  tronRunnerState.distanceDrivenWalk = {
    enabled: TRON_RUNNER_DISTANCE_DRIVEN_WALK_ENABLED,
    crowdEnabled: TRON_RUNNER_CROWD_DISTANCE_DRIVEN_WALK_ENABLED,
    cycleDistance: TRON_RUNNER_WALK_CYCLE_DISTANCE,
    visualDistance: Number(tronRunnerVisualDistanceWalked.toFixed(3)),
  };
  tronRunnerState.materialReflect = materialReflect;
  tronRunnerState.materialMetalness = materialMetalness;
  tronRunnerState.materialRoughness = materialRoughness;
  tronRunnerState.shadowSoftness = shadowSoftness;
  tronRunnerState.shadowPulse = tronRunnerShadowPulse;
  tronRunnerState.shadowCyan = shadowCyan;
  tronRunnerState.shadowOffsetX = tronRunnerShadowOffsetX;
  tronRunnerState.shadowOffsetZ = tronRunnerShadowOffsetZ;
  tronRunnerState.groundShadowEnabled = TRON_RUNNER_GROUND_SHADOW_ENABLED;
  tronRunnerState.contactShadowMaxOpacity = TRON_RUNNER_CONTACT_SHADOW_MAX_OPACITY;
  tronRunnerState.runnerLightingMode = TRON_RUNNER_LIGHTING_MODE;
  tronRunnerState.suitTextureMode = TRON_RUNNER_SUIT_TEXTURE_MODE;
  tronRunnerState.ledBrightness = tronRunnerLedBrightness;
  tronRunnerState.ledBloom = tronRunnerLedBloom;
  tronRunnerState.ledScale = ledScale;
  tronRunnerState.ledEmissiveMax = ledMax;
  tronRunnerState.realShadowEnabled = TRON_RUNNER_REAL_SHADOW_ENABLED;
  tronRunnerState.realShadowCasterCount = tronRunnerParts.realShadowCasterCount;
  tronRunnerState.realShadowReceiverType = 'shadow-material';
  tronRunnerState.selfLightIntensity = selfLightIntensity;
  tronRunnerState.modelLineIntensity = modelLineIntensity;
  tronRunnerState.pointLightCount = 0;
  tronRunnerState.keyLightY = tronRunnerKeyLightY;
  tronRunnerState.keyLightZ = tronRunnerKeyLightZ;
  tronRunnerState.rimLightX = tronRunnerRimLightX;
  tronRunnerState.fillLightY = tronRunnerFillLightY;

  for (const material of tronRunnerParts.materials) {
    material.map = tronRunnerSuitTexture;
    material.emissiveMap = tronRunnerSuitEmissiveTexture;
    material.color.copy(TRON_RUNNER_SUIT_COLOR).multiplyScalar(0.82 + bodyAmount * 0.035 + materialDepth * 0.035);
    material.emissive.copy(TRON_RUNNER_SUIT_EMISSIVE);
    material.emissiveIntensity = THREE.MathUtils.clamp(
      (0.34 + selfLightIntensity * 1.05 + modelLineIntensity * 0.78) * ledScale,
      0.18,
      ledMax
    );
    material.envMapIntensity = materialReflect * 0.12;
    material.metalness = materialMetalness;
    material.roughness = materialRoughness;
    material.userData.tronRunnerBaseOpacity = 1;
    material.userData.tronRunnerBaseEmissiveIntensity = material.emissiveIntensity;
    material.needsUpdate = true;
  }
  applyTronRunnerCrowdLedControls();
  if (tronRunnerParts.activeAction) {
    tronRunnerParts.activeAction.setEffectiveTimeScale(tronRunnerState.effectiveAnimationSpeed);
  }
  if (tronRunnerParts.reflectionActiveAction) {
    tronRunnerParts.reflectionActiveAction.setEffectiveTimeScale(tronRunnerState.effectiveAnimationSpeed);
  }
  if (tronRunnerParts.reflectionLedActiveAction) {
    tronRunnerParts.reflectionLedActiveAction.setEffectiveTimeScale(tronRunnerState.effectiveAnimationSpeed);
  }
  if (tronRunnerParts.groundShadow) {
    tronRunnerParts.groundShadow.visible = TRON_RUNNER_GROUND_SHADOW_ENABLED && floorAmount > 0.001;
    if (Math.abs(shadowSoftness - tronRunnerShadowTextureSoftness) > 0.001) {
      const oldTexture = tronRunnerShadowTexture;
      tronRunnerShadowTexture = makeTronRunnerShadowTexture(renderer, shadowSoftness);
      tronRunnerShadowTextureSoftness = shadowSoftness;
      tronRunnerParts.groundShadow.material.alphaMap = tronRunnerShadowTexture;
      oldTexture?.dispose?.();
    }
    tronRunnerParts.groundShadow.material.color
      .copy(TRON_RUNNER_SHADOW_COLOR)
      .lerp(TRON_RUNNER_SHADOW_CYAN_COLOR, shadowCyan);
    tronRunnerParts.groundShadow.position.set(tronRunnerShadowOffsetX, 0.025, tronRunnerShadowOffsetZ);
    tronRunnerParts.groundShadow.scale.set(
      tronRunnerFloorReflectionScale,
      TRON_RUNNER_CONTACT_SHADOW_ROUNDNESS * tronRunnerFloorReflectionScale,
      tronRunnerFloorReflectionScale
    );
    const groundShadowOpacity = THREE.MathUtils.clamp(
      floorAmount * 0.78,
      0,
      TRON_RUNNER_CONTACT_SHADOW_MAX_OPACITY
    );
    tronRunnerParts.groundShadow.material.userData.tronRunnerBaseOpacity = groundShadowOpacity;
    tronRunnerParts.groundShadow.material.opacity = groundShadowOpacity;
    tronRunnerParts.groundShadow.material.needsUpdate = true;
  }
  if (tronRunnerParts.realShadowReceiver) {
    const realShadowOpacity = TRON_RUNNER_REAL_SHADOW_ENABLED
      ? THREE.MathUtils.clamp(TRON_RUNNER_REAL_SHADOW_BASE_OPACITY + floorAmount * 0.34, 0, 0.36)
      : 0;
    tronRunnerParts.realShadowReceiver.visible = realShadowOpacity > 0.001;
    tronRunnerParts.realShadowReceiver.material.userData.tronRunnerBaseOpacity = realShadowOpacity;
    tronRunnerParts.realShadowReceiver.material.opacity = realShadowOpacity;
    tronRunnerParts.realShadowReceiver.material.needsUpdate = true;
    tronRunnerState.realShadowOpacity = realShadowOpacity;
  }
  if (tronRunnerParts.realShadowLight) {
    tronRunnerParts.realShadowLight.visible = TRON_RUNNER_REAL_SHADOW_ENABLED;
    tronRunnerParts.realShadowLight.castShadow = TRON_RUNNER_REAL_SHADOW_ENABLED;
    tronRunnerParts.realShadowLight.intensity = TRON_RUNNER_REAL_SHADOW_ENABLED ? 0.16 : 0;
  }
  tronRunnerParts.keyLight = null;
  tronRunnerParts.leftRim = null;
  tronRunnerParts.rightRim = null;
  tronRunnerParts.lowFill = null;
  syncTronRunnerCrowdScaleAndGround();
  applyTronRunnerRevealVisuals();
}

function tronRunnerDynamicReflectionOpacity() {
  return tronRunnerDynamicReflectionBodyOpacityForSurface(tronRunnerState.surface);
}

function tronRunnerDynamicReflectionOpacityForSurface(surface) {
  if (!TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED) return 0;
  const isSidewalk = surface === 'sidewalk';
  const basePadMaterial = getBasePadMaterialResponse();
  const reflect = isSidewalk ? basePadMaterial.reflect : Number(controlEls.roadReflect?.value ?? 0);
  const roughness = isSidewalk ? basePadMaterial.roughness : Number(controlEls.roadRoughness?.value ?? 1);
  const metalness = isSidewalk ? basePadMaterial.metalness : Number(controlEls.roadMetalness?.value ?? 0);
  const reflectLimit = isSidewalk ? 3.5 : 2.5;
  const reflectAmount = THREE.MathUtils.clamp(reflect / Math.max(0.001, reflectLimit), 0, 1);
  const smoothness = THREE.MathUtils.clamp(1 - roughness, 0, 1);
  const materialResponse = THREE.MathUtils.lerp(0.86, 1.04, THREE.MathUtils.clamp(metalness, 0, 1));
  const opacity = reflectAmount * smoothness * materialResponse * TRON_RUNNER_DYNAMIC_REFLECTION_MAX_OPACITY;
  return THREE.MathUtils.clamp(opacity, 0, TRON_RUNNER_DYNAMIC_REFLECTION_MAX_OPACITY);
}

function tronRunnerDynamicReflectionBodyOpacityForSurface(surface) {
  return Math.min(
    TRON_RUNNER_DYNAMIC_REFLECTION_BODY_MAX_OPACITY,
    tronRunnerDynamicReflectionOpacityForSurface(surface) * TRON_RUNNER_DYNAMIC_REFLECTION_BODY_OPACITY_MULTIPLIER
  ) * TRON_RUNNER_DYNAMIC_REFLECTION_OPACITY_SCALE;
}

function tronRunnerDynamicReflectionLedOpacityForSurface(surface) {
  return Math.min(
    TRON_RUNNER_DYNAMIC_REFLECTION_LED_MAX_OPACITY,
    tronRunnerDynamicReflectionOpacityForSurface(surface) * TRON_RUNNER_DYNAMIC_REFLECTION_LED_OPACITY_MULTIPLIER
  ) * TRON_RUNNER_DYNAMIC_REFLECTION_OPACITY_SCALE;
}

function updateTronRunnerDynamicReflection() {
  const group = tronRunnerParts.reflectionGroup;
  const bodyMaterials = tronRunnerParts.reflectionBodyMaterials || [];
  const ledMaterials = tronRunnerParts.reflectionLedMaterials || [];
  const bodyOpacity = tronRunnerDynamicReflectionBodyOpacityForSurface(tronRunnerState.surface);
  const ledOpacity = tronRunnerDynamicReflectionLedOpacityForSurface(tronRunnerState.surface);
  const visible = Boolean(
    TRON_RUNNER_SOURCE_CHARACTER_VISIBLE &&
    TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED &&
    group &&
    tronRunnerParts.reflectionModel &&
    bodyOpacity > 0.005
  );
  if (group) {
    group.visible = visible;
    group.position.y = TRON_RUNNER_DYNAMIC_REFLECTION_Y;
    group.scale.set(1, -TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE, 1);
  }
  for (const material of bodyMaterials) {
    material.userData.tronRunnerBaseOpacity = bodyOpacity;
    material.opacity = bodyOpacity;
    material.needsUpdate = true;
  }
  for (const material of ledMaterials) {
    material.userData.tronRunnerBaseOpacity = ledOpacity;
    material.opacity = ledOpacity;
    material.needsUpdate = true;
  }
  tronRunnerState.dynamicReflectionVisible = visible;
  tronRunnerState.dynamicReflectionOpacity = bodyOpacity;
  tronRunnerState.dynamicReflectionBodyOpacity = bodyOpacity;
  tronRunnerState.dynamicReflectionLedOpacity = ledOpacity;
  tronRunnerState.dynamicReflectionSurface = tronRunnerState.surface;
  tronRunnerState.dynamicReflectionMeshCount = tronRunnerParts.dynamicReflectionMeshCount;
  tronRunnerState.dynamicReflectionLedMeshCount = tronRunnerParts.dynamicReflectionLedMeshCount;
  tronRunnerState.dynamicReflectionAnimated = Boolean(tronRunnerParts.reflectionMixer && tronRunnerParts.reflectionLedMixer);
}

function updateTronRunnerRealShadowRig() {
  if (!TRON_RUNNER_REAL_SHADOW_ENABLED || !tronRunnerParts.realShadowLight || !tronRunnerParts.realShadowTarget) return;
  const light = tronRunnerParts.realShadowLight;
  const target = tronRunnerParts.realShadowTarget;
  const runnerX = tronRunnerWalker.position.x;
  const runnerY = tronRunnerWalker.position.y;
  const runnerZ = tronRunnerWalker.position.z;
  light.position.set(runnerX - 7.5, runnerY + 18, runnerZ - 9.5);
  target.position.set(runnerX + 0.5, runnerY + 1.4, runnerZ + 2.2);
  light.target.updateMatrixWorld();
  light.updateMatrixWorld();
  if (tronRunnerParts.realShadowReceiver) {
    tronRunnerParts.realShadowReceiver.position.y = 0.012;
  }
}

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

function tronRunnerCrowdFallbackPlacement(index) {
  return tronRunnerCrowdFallbackPlacementCore({
    index,
    limits: roadHexBoundaryLimits(),
    dynamicRoadCenter,
    dynamicRoadLength,
    gridBlock: GRID_BLOCK,
    roadHalf: roadHalf(),
    roadTopY: roadTileTopY(),
    groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
  });
}

function tronRunnerCrowdCandidateRecords() {
  return tronRunnerCrowdCandidateRecordsCore({
    records: sideBuildingRecords,
    excludedCivics: TRON_RUNNER_CROWD_EXCLUDED_CIVICS,
    gridBlock: GRID_BLOCK,
  });
}

function tronRunnerCrowdLoopRouteForRecord(record, index) {
  return tronRunnerCrowdLoopRouteForRecordCore({
    record,
    index,
    buildingGuard: TRON_RUNNER_CROWD_BUILDING_GUARD,
    collisionRadius: TRON_RUNNER_CROWD_COLLISION_RADIUS,
    roadTopY: roadTileTopY(),
    groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
    frontOnly: TRON_RUNNER_CROWD_LOOP_FRONT_ONLY,
  });
}

function tronRunnerCrowdSideStreetPairs(records) {
  return tronRunnerCrowdSideStreetPairsCore(records, GRID_BLOCK);
}

function tronRunnerCrowdRoadFacingRoutePoint(record, offsetZ = 0) {
  return tronRunnerCrowdRoadFacingRoutePointCore({
    record,
    offsetZ,
    edgeInsetBase: TRON_RUNNER_CROWD_SIDEWALK_LANE_EDGE_INSET,
    buildingGuard: TRON_RUNNER_CROWD_BUILDING_GUARD,
    roadTopY: roadTileTopY(),
    groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
    pointInPolygon: pointInBasePadPolygon,
    resolveRoundedCollider: resolveTronRunnerRoundedCollider,
  });
}

function tronRunnerCrowdSideStreetRouteForPair(pair, index) {
  return tronRunnerCrowdSideStreetRouteForPairCore({
    pair,
    index,
    gridBlock: GRID_BLOCK,
    sideBase: SIDE_BASE,
    roadHalf: roadHalf(),
    roadTopY: roadTileTopY(),
    groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
    roadFacingRoutePoint: tronRunnerCrowdRoadFacingRoutePoint,
  });
}

function tronRunnerCrowdDetectedSideStreetLanes(records) {
  return tronRunnerCrowdDetectedSideStreetLanesCore({
    records,
    collisionRadius: TRON_RUNNER_CROWD_COLLISION_RADIUS,
    gridBlock: GRID_BLOCK,
    roadHalf: roadHalf(),
    streetEdgeWidth,
    sideBuildingWidth: sideBuildingVisualWidth(),
  });
}

function tronRunnerCrowdSecondaryStreetSummary(records) {
  const lanes = tronRunnerCrowdDetectedSideStreetLanes(records);
  return tronRunnerCrowdSecondaryStreetSummaryCore(lanes);
}

function tronRunnerCrowdRouteStyleOrdinal(routeIndex, style) {
  return tronRunnerCrowdRouteStyleOrdinalCore({
    routeIndex,
    style,
    routeStyleForIndex: tronRunnerCrowdRouteStyleForIndex,
  });
}

function tronRunnerCrowdSideStreetLateralRoute(lane, index, ordinal = 0, assignment = null) {
  return tronRunnerCrowdSideStreetLateralRouteCore({
    lane,
    ordinal,
    assignment,
    y: roadTileTopY() + TRON_RUNNER_CROWD_GROUND_OFFSET,
    gridBlock: GRID_BLOCK,
  });
}

function tronRunnerCrowdRouteStyleForIndex(routeIndex) {
  const records = tronRunnerCrowdCandidateRecords();
  const laneCount = tronRunnerCrowdDetectedSideStreetLanes(records).length;
  return tronRunnerCrowdRouteStyleForIndexCore({
    routeIndex,
    laneCount,
    sideStreetGroupExtraCount: TRON_RUNNER_CROWD_SIDE_STREET_GROUP_EXTRA_COUNT,
    pathMode: TRON_RUNNER_CROWD_PATH_MODE,
  });
}

function tronRunnerCrowdStartPlayerRoute(index) {
  return tronRunnerCrowdStartPlayerRouteCore({
    index,
    anchor: tronRunnerDroneAnchor(),
    limits: roadHexBoundaryLimits(),
    roadHalf: roadHalf(),
    gridBlock: GRID_BLOCK,
    startClusterCount: TRON_RUNNER_CROWD_START_CLUSTER_COUNT,
    roadTopY: roadTileTopY(),
    groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
  });
}

function tronRunnerCrowdRouteForRecord(record, index) {
  return tronRunnerCrowdRouteForRecordCore({
    record,
    index,
    pathMode: TRON_RUNNER_CROWD_PATH_MODE,
    routeEndInset: TRON_RUNNER_CROWD_SIDEWALK_ROUTE_END_INSET,
    reachRadius: TRON_RUNNER_CROWD_REACH_RADIUS,
    laneEdgeInset: TRON_RUNNER_CROWD_SIDEWALK_LANE_EDGE_INSET,
    buildingGuard: TRON_RUNNER_CROWD_BUILDING_GUARD,
    roadTopY: roadTileTopY(),
    groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
    pointInPolygon: pointInBasePadPolygon,
  });
}

function tronRunnerCrowdBuildRoute(index) {
  const records = tronRunnerCrowdCandidateRecords();
  return tronRunnerCrowdBuildRouteCore({
    index,
    records,
    startClusterCount: TRON_RUNNER_CROWD_START_CLUSTER_COUNT,
    routeRecordSpread: TRON_RUNNER_CROWD_ROUTE_RECORD_SPREAD,
    startPlayerRoute: tronRunnerCrowdStartPlayerRoute,
    routeStyleForIndex: tronRunnerCrowdRouteStyleForIndex,
    sideStreetPairs: tronRunnerCrowdSideStreetPairs,
    detectedSideStreetLanes: tronRunnerCrowdDetectedSideStreetLanes,
    routeStyleOrdinal: tronRunnerCrowdRouteStyleOrdinal,
    sideStreetLaneAssignment: tronRunnerCrowdSideStreetLaneAssignment,
    loopRouteForRecord: tronRunnerCrowdLoopRouteForRecord,
    sideStreetLateralRoute: tronRunnerCrowdSideStreetLateralRoute,
    sideStreetRouteForPair: tronRunnerCrowdSideStreetRouteForPair,
    routeForRecord: tronRunnerCrowdRouteForRecord,
  });
}

function tronRunnerCrowdGridCoord(value) {
  return tronRunnerCrowdGridCoordCore(value, TRON_RUNNER_CROWD_SPATIAL_CELL);
}

function setTronRunnerCrowdFrameDistance(member, distance) {
  setTronRunnerCrowdFrameDistanceCore(member, distance, tronRunnerCrowdRuntimeStats.frame);
}

function tronRunnerCrowdDistanceToCamera(member) {
  return tronRunnerCrowdDistanceToCameraCore({
    member,
    cameraPosition: camera.position,
    stats: tronRunnerCrowdRuntimeStats,
    frame: tronRunnerCrowdRuntimeStats.frame,
    distanceCacheEnabled: TRON_RUNNER_CROWD_DISTANCE_CACHE_ENABLED,
  });
}

function prepareTronRunnerCrowdSpatialGrid() {
  prepareTronRunnerCrowdSpatialGridCore(
    tronRunnerCrowdSpatialGrid,
    tronRunnerCrowd,
    tronRunnerCrowdRuntimeStats,
    TRON_RUNNER_CROWD_CULLING_ENABLED,
    TRON_RUNNER_CROWD_LOD_NEAR_DISTANCE,
    tronRunnerCrowdGridCoord,
    tronRunnerCrowdGridKey,
  );
}

function nearbyTronRunnerCrowdMembers(x, z) {
  return nearbyTronRunnerCrowdMembersCore(
    x,
    z,
    tronRunnerCrowdSpatialGrid,
    tronRunnerCrowdGridCoord,
    tronRunnerCrowdGridKey,
  );
}

function tronRunnerCrowdLodStride(member) {
  const distance = tronRunnerCrowdDistanceToCamera(member);
  member.lodDistance = distance;
  return tronRunnerCrowdLodStrideCore(
    distance,
    TRON_RUNNER_CROWD_LOD_NEAR_DISTANCE,
    TRON_RUNNER_CROWD_LOD_MID_DISTANCE
  );
}

function cityRevealPostRevealElapsedMs(now = performance.now()) {
  if (!cityRevealComplete || !cityRevealCompletedAt) return 0;
  return Math.max(0, now - cityRevealCompletedAt);
}

function tronRunnerCrowdPostRevealReflectionRampLimit(maxLimit, now = performance.now()) {
  return tronRunnerCrowdPostRevealReflectionRampLimitCore({
    maxLimit,
    now,
    stats: tronRunnerCrowdRuntimeStats,
    rampEnabled: TRON_RUNNER_CROWD_REFLECTION_POST_REVEAL_RAMP_ENABLED,
    rampMs: TRON_RUNNER_CROWD_REFLECTION_POST_REVEAL_RAMP_MS,
    cityRevealWireframeEnabled,
    cityRevealComplete,
    cityRevealCompletedAt,
    postRevealElapsedMs: cityRevealPostRevealElapsedMs,
  });
}

function updateTronRunnerCrowdReflectionBudget() {
  updateTronRunnerCrowdReflectionBudgetCore({
    stats: tronRunnerCrowdRuntimeStats,
    crowd: tronRunnerCrowd,
    crowdGroup: tronRunnerCrowdGroup,
    reflectionCandidates: tronRunnerCrowdReflectionCandidates,
    dynamicReflectionEnabled: TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
    crowdReflectionsIsolation: postRevealPerfIsolationState.crowdReflections,
    reflectionRevealEnabled: TRON_RUNNER_CROWD_REFLECTION_REVEAL_ENABLED,
    reflectionMaxActive: TRON_RUNNER_CROWD_REFLECTION_MAX_ACTIVE,
    reflectionMinFps: TRON_RUNNER_CROWD_REFLECTION_MIN_FPS,
    reflectionNearDistance: TRON_RUNNER_CROWD_REFLECTION_NEAR_DISTANCE,
    latestMeasuredFps,
    cityRevealComplete,
    postRevealElapsedMs: cityRevealPostRevealElapsedMs,
    isCityRevealPerformanceCritical,
    distanceToCamera: tronRunnerCrowdDistanceToCamera,
    rampLimit: tronRunnerCrowdPostRevealReflectionRampLimit,
  });
}

function setTronRunnerCrowdState(member, state, now, durationMs = 0) {
  member.state = state;
  member.stateUntil = durationMs > 0 ? now + durationMs : 0;
}

function normalizeTronRunnerCrowdState(member, now) {
  if (!TRON_RUNNER_CROWD_INTELLIGENCE_ENABLED) {
    member.state = 'walk';
    member.stateUntil = 0;
    return;
  }
  if (!member.state) member.state = 'walk';
  if (member.stateUntil && now >= member.stateUntil) {
    member.state = 'walk';
    member.stateUntil = 0;
  }
}

function clearTronRunnerCrowd() {
  tronRunnerCrowdBuildJob = null;
  tronRunnerCrowdSpatialGrid.clear();
  tronRunnerCrowd.length = 0;
  while (tronRunnerCrowdGroup.children.length) {
    tronRunnerCrowdGroup.remove(tronRunnerCrowdGroup.children[0]);
  }
  tronRunnerCrowdGroup.visible = false;
  tronRunnerCrowdBuildStats.status = 'idle';
  tronRunnerCrowdBuildStats.built = 0;
  tronRunnerCrowdBuildStats.requested = TRON_RUNNER_CROWD_COUNT;
  tronRunnerCrowdBuildStats.startedAt = 0;
  tronRunnerCrowdBuildStats.durationMs = 0;
  tronRunnerCrowdBuildStats.lastChunkMs = 0;
  tronRunnerCrowdRuntimeStats.performanceFreezeFrameCount = 0;
}

function clearTronRunnerIdleCharacter() {
  while (tronRunnerIdleCharacterGroup.children.length) {
    tronRunnerIdleCharacterGroup.remove(tronRunnerIdleCharacterGroup.children[0]);
  }
  Object.assign(tronRunnerIdleCharacter, {
    built: false,
    visible: false,
    locked: false,
    lockedPlacement: null,
    recordCivic: null,
    error: '',
    poseApplied: false,
    poseBoneCount: 0,
    poseBoneNames: [],
    upperArmPoseApplied: false,
    model: null,
    materials: [],
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    startSideSign: 1,
    anchor: '',
    perimeterClearance: TRON_RUNNER_IDLE_CHARACTER_BODY_CLEARANCE,
    cornerFaceInset: 0,
    roundedColliderResolved: false,
    roundedRadius: 0,
    cornerFlatInset: TRON_RUNNER_IDLE_CHARACTER_CORNER_FLAT_INSET,
    frontWallClearance: TRON_RUNNER_IDLE_CHARACTER_FRONT_WALL_CLEARANCE,
    wallContactEps: TRON_RUNNER_IDLE_CHARACTER_WALL_CONTACT_EPS,
    roadDir: 0,
    placementSource: '',
    corner: '',
  });
  tronRunnerIdleCharacterGroup.visible = false;
}

function syncTronRunnerCrowdScaleAndGround() {
  for (const member of tronRunnerCrowd) {
    member.group.scale.copy(tronRunnerWalker.scale);
    const surface = member.route
      ? tronRunnerSurfaceYForPoint(member.group.position.x, member.group.position.z)
      : null;
    if (surface) {
      member.group.position.y = surface.y;
      member.surface = surface.surface;
      member.groundOffset = member.group.position.y - surface.groundY;
    } else {
      const placement = tronRunnerCrowdFallbackPlacement(member.index);
      member.group.position.set(placement.x, placement.y, placement.z);
      member.group.rotation.y = placement.yaw;
      member.surface = placement.surface;
      member.groundOffset = TRON_RUNNER_CROWD_GROUND_OFFSET;
    }
    updateTronRunnerCrowdReflection(member);
  }
  syncTronRunnerIdleCharacterPose();
}

function tronRunnerIdleTargetRecord() {
  return sideBuildingRecords.find((record) => record.civicNumberValue === TRON_RUNNER_IDLE_CHARACTER_CIVIC) || null;
}

function tronRunnerIdleCharacterResolveStartWallPoint(record, faceSign, playerSideSign) {
  const collider = record?.collider;
  if (!collider) return null;
  const padding = TRON_RUNNER_IDLE_CHARACTER_BODY_CLEARANCE;
  const halfX = collider.hw;
  const halfZ = collider.hd;
  const roundedRadius = Math.max(0, collider.chamfer || 0);
  const safeInset = THREE.MathUtils.clamp(
    roundedRadius + TRON_RUNNER_IDLE_CHARACTER_CORNER_FLAT_INSET,
    padding * 2,
    Math.max(padding * 2, halfX - padding)
  );
  const point = {
    x: collider.x + faceSign * (halfX + sideDoorFaceOffset + TRON_RUNNER_IDLE_CHARACTER_FRONT_WALL_CLEARANCE),
    z: collider.z + playerSideSign * (halfZ - safeInset),
  };
  const beforeX = point.x;
  const beforeZ = point.z;
  const roundedColliderResolved = resolveTronRunnerRoundedCollider(point, collider, padding);
  return {
    x: point.x,
    z: point.z,
    roundedColliderResolved,
    roundedCorrection: Math.hypot(point.x - beforeX, point.z - beforeZ),
    roundedRadius,
    cornerFlatInset: safeInset,
    frontWallClearance: TRON_RUNNER_IDLE_CHARACTER_FRONT_WALL_CLEARANCE,
    wallContactEps: TRON_RUNNER_IDLE_CHARACTER_WALL_CONTACT_EPS,
    roadDir: faceSign,
    source: 'buildingFacade',
  };
}

function tronRunnerIdleCharacterPlacement(record = tronRunnerIdleTargetRecord()) {
  const pad = record?.basePad;
  const polygon = pad?.hitPolygon;
  if (!record || !pad?.border || !polygon?.length || !record.collider) return null;
  const isLeftBuilding = (record.mesh?.position?.x ?? 0) < 0;
  const spawnReferenceZ = Number.isFinite(playerSpawn?.z)
    ? playerSpawn.z
    : ((record.mesh?.position?.z ?? 0) + SIDE_BUILDING_SPACING);
  const playerSideSign = spawnReferenceZ >= record.mesh.position.z ? 1 : -1;
  const faceSign = tronRunnerCrowdRecordRoadDir(record);
  const wallPoint = tronRunnerIdleCharacterResolveStartWallPoint(record, faceSign, playerSideSign);
  if (!wallPoint) return null;
  const worldX = wallPoint.x;
  const worldZ = wallPoint.z;
  const surface = tronRunnerSurfaceYForPoint(worldX, worldZ);
  const lookX = worldX + faceSign * GRID_BLOCK * 1.5;
  const lookZ = worldZ;
  return {
    x: worldX,
    y: surface.y + TRON_RUNNER_IDLE_CHARACTER_Y_LIFT,
    z: worldZ,
    yaw: Math.atan2(lookX - worldX, lookZ - worldZ),
    surface: surface.surface,
    startSideSign: playerSideSign,
    anchor: 'building-facade-road-wall-start-corner',
    perimeterClearance: TRON_RUNNER_IDLE_CHARACTER_BODY_CLEARANCE,
    cornerFaceInset: wallPoint.cornerFlatInset,
    roundedColliderResolved: wallPoint.roundedColliderResolved,
    roundedCorrection: wallPoint.roundedCorrection,
    roundedRadius: wallPoint.roundedRadius,
    cornerFlatInset: wallPoint.cornerFlatInset,
    frontWallClearance: wallPoint.frontWallClearance,
    wallContactEps: wallPoint.wallContactEps,
    roadDir: wallPoint.roadDir,
    placementSource: wallPoint.source,
    corner: `${isLeftBuilding ? 'left' : 'right'}-${playerSideSign > 0 ? 'start-max-z' : 'start-min-z'}-road-wall-building-facade`,
  };
}

function syncTronRunnerIdleCharacterPose() {
  if (!tronRunnerIdleCharacter.built) return;
  const record = tronRunnerIdleTargetRecord();
  let placement = TRON_RUNNER_IDLE_CHARACTER_STATIC ? tronRunnerIdleCharacter.lockedPlacement : null;
  if (!placement) {
    placement = tronRunnerIdleCharacterPlacement(record);
    if (placement && TRON_RUNNER_IDLE_CHARACTER_STATIC) {
      tronRunnerIdleCharacter.lockedPlacement = { ...placement };
      tronRunnerIdleCharacter.locked = true;
    }
  }
  if (!placement) {
    tronRunnerIdleCharacter.error = `building-${TRON_RUNNER_IDLE_CHARACTER_CIVIC}-placement-missing`;
    tronRunnerIdleCharacterGroup.visible = false;
    tronRunnerIdleCharacter.visible = false;
    return;
  }
  tronRunnerIdleCharacterGroup.scale.copy(tronRunnerWalker.scale);
  tronRunnerIdleCharacterGroup.position.set(placement.x, placement.y, placement.z);
  tronRunnerIdleCharacterGroup.rotation.set(0, placement.yaw, 0);
  Object.assign(tronRunnerIdleCharacter, {
    locked: Boolean(TRON_RUNNER_IDLE_CHARACTER_STATIC && tronRunnerIdleCharacter.lockedPlacement),
    recordCivic: record?.civicNumberValue ?? TRON_RUNNER_IDLE_CHARACTER_CIVIC,
    error: '',
    x: Number(placement.x.toFixed(3)),
    y: Number(placement.y.toFixed(3)),
    z: Number(placement.z.toFixed(3)),
    yaw: Number(placement.yaw.toFixed(3)),
    surface: placement.surface,
    startSideSign: placement.startSideSign,
    anchor: placement.anchor,
    perimeterClearance: placement.perimeterClearance,
    cornerFaceInset: placement.cornerFaceInset,
    roundedColliderResolved: placement.roundedColliderResolved,
    roundedCorrection: placement.roundedCorrection,
    roundedRadius: placement.roundedRadius,
    cornerFlatInset: placement.cornerFlatInset,
    frontWallClearance: placement.frontWallClearance,
    wallContactEps: placement.wallContactEps,
    roadDir: placement.roadDir,
    placementSource: placement.placementSource,
    corner: placement.corner,
  });
}

function poseTronRunnerIdleCharacterArmsCrossed(model) {
  return poseTronRunnerIdleCharacterArmsCrossedCore(model, tronRunnerIdleCharacter);
}

function buildTronRunnerIdleCharacter(sourceModel) {
  clearTronRunnerIdleCharacter();
  if (!TRON_RUNNER_IDLE_CHARACTER_ENABLED) return;
  if (!sourceModel || !cloneRunnerSkeleton) {
    tronRunnerIdleCharacter.error = 'source-model-missing';
    return;
  }
  const record = tronRunnerIdleTargetRecord();
  if (!record) {
    tronRunnerIdleCharacter.error = `building-${TRON_RUNNER_IDLE_CHARACTER_CIVIC}-not-found`;
    return;
  }
  const model = cloneRunnerSkeleton(sourceModel);
  model.name = `soldier-rigged-runner-idle-building-${TRON_RUNNER_IDLE_CHARACTER_CIVIC}`;
  model.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.frustumCulled = false;
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.layers.set(0);
  });
  const idleColorPreset = TRON_RUNNER_CROWD_COLOR_PRESETS[TRON_RUNNER_IDLE_CHARACTER_COLOR_PRESET] || tronRunnerCrowdColorPresetForIndex(0);
  const material = makeTronRunnerCrowdSuitMaterial(idleColorPreset);
  model.traverse((obj) => {
    if (obj.isMesh) obj.material = material;
  });
  model.rotation.z += record.sign * tronRunnerIdleCharacter.leanRad;
  tronRunnerIdleCharacterGroup.add(model);
  tronRunnerIdleCharacter.model = model;
  tronRunnerIdleCharacter.materials = [material];
  tronRunnerIdleCharacter.built = true;
  poseTronRunnerIdleCharacterArmsCrossed(model);
  syncTronRunnerIdleCharacterPose();
  syncTronRunnerIdleCharacterVisibility();
}

const TRON_RUNNER_CROWD_APPEAR_DELAY_MS = 1000;
let tronRunnerCrowdAppearArmedAt = 0;
function syncTronRunnerCrowdVisibility() {
  const visibleFactor = THREE.MathUtils.clamp(TRON_RUNNER_REVEAL_ENABLED ? tronRunnerRevealProgress : 1, 0, 1);
  const revealVisible = (visibleFactor > 0.002 || tronRunnerRevealActive || tronRunnerRevealComplete);
  const wouldShow = Boolean(TRON_RUNNER_CROWD_ENABLED && revealVisible && tronRunnerState.ready);
  // Hold the crowd back an extra second after it would normally appear.
  if (!wouldShow) tronRunnerCrowdAppearArmedAt = 0;
  else if (!tronRunnerCrowdAppearArmedAt) tronRunnerCrowdAppearArmedAt = performance.now();
  const visible = wouldShow && (performance.now() - tronRunnerCrowdAppearArmedAt >= TRON_RUNNER_CROWD_APPEAR_DELAY_MS);
  const changed = tronRunnerCrowdGroup.visible !== visible;
  tronRunnerCrowdGroup.visible = visible;
  for (const member of tronRunnerCrowd) {
    member.baseVisible = visible;
    if (!visible) {
      const memberChanged = member.group.visible !== false;
      member.group.visible = false;
      member.cullingVisible = false;
      member.cullingReason = 'group-hidden';
      if (changed || memberChanged) updateTronRunnerCrowdReflection(member);
      continue;
    }
    if (!TRON_RUNNER_CROWD_CULLING_ENABLED) {
      const memberChanged = member.group.visible !== true;
      member.group.visible = true;
      member.cullingVisible = true;
      member.cullingReason = 'visible';
      if (changed || memberChanged) updateTronRunnerCrowdReflection(member);
    }
  }
}

function updateTronRunnerCrowdCulling() {
  updateTronRunnerCrowdCullingState({
    crowd: tronRunnerCrowd,
    groupVisible: tronRunnerCrowdGroup.visible,
    cullingEnabled: TRON_RUNNER_CROWD_CULLING_ENABLED,
    camera,
    stats: tronRunnerCrowdRuntimeStats,
    cullMatrix: tronRunnerCrowdCullMatrix,
    cullFrustum: tronRunnerCrowdCullFrustum,
    cullSphere: tronRunnerCrowdCullSphere,
    targetHeight: TRON_RUNNER_TARGET_HEIGHT,
    cullRadius: TRON_RUNNER_CROWD_CULL_RADIUS,
    cullDistance: TRON_RUNNER_CROWD_CULL_DISTANCE,
    updateReflection: updateTronRunnerCrowdReflection,
  });
}

function makeTronRunnerCrowdActionSet(model, animations, offset) {
  const mixer = new THREE.AnimationMixer(model);
  const walkClip = animations.find((clip) => /walk/i.test(clip.name)) || animations[0];
  if (!walkClip) return { mixer, action: null };
  const action = mixer.clipAction(walkClip);
  action.enabled = true;
  action.setEffectiveTimeScale(tronRunnerState.effectiveAnimationSpeed * (0.92 + (offset % 5) * 0.035));
  action.setEffectiveWeight(1);
  action.play();
  action.time = (walkClip.duration || 1) * tronRunnerCrowdWalkCycleOffset(offset);
  return { mixer, action };
}

function buildTronRunnerCrowdReflection(sourceModel, animations, index, colorPreset = null) {
  if (!TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED || !sourceModel || !cloneRunnerSkeleton) {
    return emptyTronRunnerCrowdReflection();
  }
  const group = new THREE.Group();
  group.name = `tron-runner-crowd-reflection-${index + 1}`;
  group.position.y = TRON_RUNNER_DYNAMIC_REFLECTION_Y;
  group.scale.set(1, -TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE, 1);
  group.userData.tronRunnerReflectionMode = 'mesh-clone';
  group.visible = false;

  const model = cloneRunnerSkeleton(sourceModel);
  model.name = `soldier-rigged-runner-crowd-reflection-${index + 1}`;
  const ledModel = cloneRunnerSkeleton(sourceModel);
  ledModel.name = `soldier-rigged-runner-crowd-reflection-led-${index + 1}`;
  const bodyMaterials = [];
  const ledMaterials = [];
  let meshCount = 0;
  let ledMeshCount = 0;
  model.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.frustumCulled = false;
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.renderOrder = TRON_RUNNER_DYNAMIC_REFLECTION_BODY_RENDER_ORDER;
    obj.layers.set(0);
    obj.material = makeTronRunnerReflectionBodyMaterial();
    bodyMaterials.push(obj.material);
    meshCount += 1;
  });
  ledModel.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.frustumCulled = false;
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.renderOrder = TRON_RUNNER_DYNAMIC_REFLECTION_LED_RENDER_ORDER;
    obj.layers.set(0);
    obj.material = makeTronRunnerReflectionLedMaterial(colorPreset);
    ledMaterials.push(obj.material);
    ledMeshCount += 1;
  });
  group.add(model);
  group.add(ledModel);
  const { mixer, action } = makeTronRunnerCrowdActionSet(model, animations, index);
  const { mixer: ledMixer, action: ledAction } = makeTronRunnerCrowdActionSet(ledModel, animations, index);
  return {
    group,
    model,
    ledModel,
    mixer,
    ledMixer,
    action,
    ledAction,
    materials: [...bodyMaterials, ...ledMaterials],
    bodyMaterials,
    ledMaterials,
    meshCount,
    ledMeshCount,
  };
}

// 2D (XZ) segment-vs-AABB slab test: does the camera->member line pass through this box?
function tronRunnerSegmentHitsBoxXZ(ax, az, bx, bz, cx, cz, hw, hd) {
  const dx = bx - ax;
  const dz = bz - az;
  let tmin = 0;
  let tmax = 1;
  if (Math.abs(dx) < 1e-6) {
    if (ax < cx - hw || ax > cx + hw) return false;
  } else {
    let t1 = (cx - hw - ax) / dx;
    let t2 = (cx + hw - ax) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dz) < 1e-6) {
    if (az < cz - hd || az > cz + hd) return false;
  } else {
    let t1 = (cz - hd - az) / dz;
    let t2 = (cz + hd - az) / dz;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// A crowd member whose floor reflection is drawn with depthTest:false bleeds THROUGH any
// building standing between it and the camera (a ghost "inside the palazzo"). Detect that the
// member is occluded by a building from the camera and drop its reflection.
function tronRunnerCrowdReflectionOccludedByBuilding(member) {
  const px = member.group.position.x;
  const pz = member.group.position.z;
  const camX = camera.position.x;
  const camZ = camera.position.z;
  for (const record of tronRunnerCrowdColliderRecords()) {
    const c = record.collider;
    if (!c) continue;
    if (tronRunnerSegmentHitsBoxXZ(camX, camZ, px, pz, c.x, c.z, c.hw, c.hd)) return true;
  }
  return false;
}

function updateTronRunnerCrowdReflection(member) {
  const budgetActive = postRevealPerfIsolationState.crowdReflections && member.dynamicReflectionBudgetActive === true;
  // Most crowd members are outside the reflection budget (max 3 active). Once cleared, the
  // applyTronRunnerCrowdReflectionState writes are idempotent (group hidden, opacities 0); skip them.
  if (!budgetActive && member.dynamicReflectionVisible === false) return;
  const group = member.reflectionGroup;
  const bodyMaterials = member.reflectionBodyMaterials || [];
  const ledMaterials = member.reflectionLedMaterials || [];
  // Kill the reflection when a building occludes the member: depthTest:false would otherwise
  // paint the reflection straight through the building face.
  const occluded = budgetActive && tronRunnerCrowdReflectionOccludedByBuilding(member);
  const bodyOpacity = budgetActive && !occluded ? tronRunnerDynamicReflectionBodyOpacityForSurface(member.surface) : 0;
  const ledOpacity = budgetActive && !occluded ? tronRunnerDynamicReflectionLedOpacityForSurface(member.surface) : 0;
  const visible = Boolean(
    TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED &&
    postRevealPerfIsolationState.crowdReflections &&
    tronRunnerCrowdGroup.visible &&
    member.group.visible &&
    group &&
    budgetActive &&
    bodyOpacity > 0.005
  );
  applyTronRunnerCrowdReflectionState({
    member,
    group,
    bodyMaterials,
    ledMaterials,
    visible,
    bodyOpacity,
    ledOpacity,
    reflectionY: TRON_RUNNER_DYNAMIC_REFLECTION_Y,
    reflectionYScale: TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE,
  });
}

function tronRunnerCrowdRoadFacingStart(route, index, fallback) {
  return tronRunnerCrowdRoadFacingStartCore({
    route,
    index,
    fallback,
    collisionRadius: TRON_RUNNER_CROWD_COLLISION_RADIUS,
    pointInPolygon: pointInBasePadPolygon,
  });
}

// Ambient one-liners the crowd says when the player comes near. Mix of warm greetings,
// slice-of-life, light avstudio worldbuilding and Tron flavour. No dashes, brand lowercase.
// Mirror of public/tecnologie/retro-future/CROWD_LINES.md (edit there, then re-sync here).
const TRON_RUNNER_CROWD_LINES = [
  // Saluti caldi
  'Hei, un viso nuovo!',
  'Felice di incontrarti.',
  'Benvenuto sulla griglia.',
  'Ehi, ti aspettavamo.',
  'Ciao, nuovo arrivato.',
  'Bella serata, vero?',
  'Buona passeggiata!',
  'Che piacere vederti.',
  'Salve, viaggiatore.',
  'Ti sei perso? Resta pure.',
  'Sorridi, sei in città.',
  // Quotidiano
  'Oggi ho dimenticato il pranzo.',
  'Che giornata lunga.',
  'Adoro queste luci di notte.',
  'Stavo giusto tornando a casa.',
  'Hai visto che traffico di dati?',
  'Mi servirebbe un caffè.',
  'Domani riposo, finalmente.',
  'Ho i piedi a pezzi.',
  'Sto cercando un amico.',
  'Le notti qui non finiscono mai.',
  'Tu non dormi mai?',
  // Mondo avstudio
  'Qui costruiamo cose che funzionano.',
  'Ogni luce è un processo che gira.',
  'Lo ha disegnato lo studio.',
  'Niente magia, solo lavoro fatto bene.',
  'Automatizziamo la parte noiosa.',
  "Dietro ogni schermo c'è una persona.",
  'Misuriamo tutto, poi miglioriamo.',
  'Le idee qui diventano sistemi.',
  'Funziona prima, stupisce dopo.',
  // Tron / sci-fi
  'Il flusso è stabile stanotte.',
  'Segui le linee.',
  'La griglia ti riconosce.',
  'Resta sul tracciato.',
  'Energia al massimo.',
  'I dati scorrono come fiumi.',
  'Nessun errore stanotte.',
  'Sento il ronzio della rete.',
  'Le torri non dormono mai.',
  'Sei dentro il sistema adesso.',
];
const TRON_RUNNER_CROWD_TALK_RANGE = 15;     // say something within this distance
const TRON_RUNNER_CROWD_TALK_REARM_RANGE = 18; // re-arm once you step past this (hysteresis)
const TRON_RUNNER_CROWD_TALK_DURATION_MS = 4000;
const TRON_RUNNER_CROWD_TALK_LINES_PER_MEMBER = 3;
// Deterministic per-index pick of N distinct lines (stable across reloads).
function pickTronRunnerCrowdLines(index, pool, count) {
  const out = [];
  const used = new Set();
  let s = (Math.imul(index + 1, 2654435761) >>> 0) || 1;
  while (out.length < count && used.size < pool.length) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const k = s % pool.length;
    if (!used.has(k)) { used.add(k); out.push(pool[k]); }
  }
  return out;
}

function buildTronRunnerCrowdMember(job, index) {
  const group = new THREE.Group();
  group.name = `tron-runner-crowd-${index + 1}`;
  group.visible = false;
  group.scale.copy(tronRunnerWalker.scale);
  const colorPreset = tronRunnerCrowdColorPresetForIndex(index);

  const cloneModel = cloneRunnerSkeleton(job.sourceModel);
  cloneModel.name = `soldier-rigged-runner-crowd-${index + 1}`;
  const cloneMeshes = [];
  cloneModel.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.frustumCulled = false;
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.layers.set(0);
    cloneMeshes.push(obj);
  });
  const crowdMaterial = makeTronRunnerCrowdSuitMaterial(colorPreset);
  cloneMeshes.forEach((mesh) => {
    mesh.material = crowdMaterial;
  });
  group.add(cloneModel);

  const animationScaleOffset = 0.92 + (index % 5) * 0.035;
  const speedScaleOffset = 0.86 + (index % 5) * 0.035;
  const { mixer, action } = makeTronRunnerCrowdActionSet(cloneModel, job.animations, index);
  const reflection = buildTronRunnerCrowdReflection(job.sourceModel, job.animations, index, colorPreset);
  if (reflection.group) group.add(reflection.group);
  const route = tronRunnerCrowdBuildRoute(index);
  const fallback = tronRunnerCrowdFallbackPlacement(index);
  const startInfo = tronRunnerCrowdRoadFacingStart(route, index, fallback);
  const start = startInfo.placement;
  group.position.set(start.x, start.y, start.z);
  group.rotation.y = start.yaw ?? 0;
  if (index === TRON_RUNNER_GREETER_INDEX) {
    // The green companion starts a few metres in front of the landing so it reaches the
    // player quickly to greet them.
    group.position.set((droneLandingPose?.x ?? 0) + 3.5, start.y, (droneLandingPose?.z ?? start.z) - 13);
  }
  const member = createTronRunnerCrowdMemberRecord({
    index,
    group,
    model: cloneModel,
    material: crowdMaterial,
    mixer,
    action,
    colorPreset,
    reflection,
    route,
    startInfo,
    speed: tronRunnerWalkSpeed * TRON_RUNNER_CROWD_SPEED_SCALE * speedScaleOffset,
    speedScaleOffset,
    animationScaleOffset,
    walkCycleOffset: tronRunnerCrowdWalkCycleOffset(index),
    groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
  });
  member.idleClip = job.animations?.find((clip) => /idle/i.test(clip.name)) || null;
  member.runClip = job.animations?.find((clip) => /run/i.test(clip.name)) || null;
  member.talkLines = pickTronRunnerCrowdLines(index, TRON_RUNNER_CROWD_LINES, TRON_RUNNER_CROWD_TALK_LINES_PER_MEMBER);
  member.talkCycle = 0;
  member.talkArmed = true;
  member.talkUntil = 0;
  member.talkStart = 0;
  member.talkText = '';
  tronRunnerCrowd.push(member);
  tronRunnerCrowdGroup.add(group);
}

function buildTronRunnerCrowd(sourceModel, animations) {
  clearTronRunnerCrowd();
  if (!TRON_RUNNER_CROWD_ENABLED || !sourceModel || !cloneRunnerSkeleton) return;
  const sourceMeshes = [];
  sourceModel.traverse((obj) => {
    if (obj.isMesh) sourceMeshes.push(obj);
  });
  tronRunnerCrowdBuildJob = {
    sourceModel,
    sourceMeshes,
    animations,
    nextIndex: 0,
    startedAt: performance.now(),
  };
  tronRunnerCrowdBuildStats.status = 'queued';
  tronRunnerCrowdBuildStats.startedAt = tronRunnerCrowdBuildJob.startedAt;
  tronRunnerCrowdBuildStats.built = 0;
  tronRunnerCrowdBuildStats.requested = TRON_RUNNER_CROWD_COUNT;
}

function processTronRunnerCrowdBuildQueue() {
  if (!tronRunnerCrowdBuildJob) return;
  const job = tronRunnerCrowdBuildJob;
  const started = performance.now();
  tronRunnerCrowdBuildStats.status = 'building';
  buildTronRunnerCrowdMember(job, job.nextIndex);
  job.nextIndex += 1;
  tronRunnerCrowdBuildStats.built = job.nextIndex;
  tronRunnerCrowdBuildStats.lastChunkMs = performance.now() - started;
  if (job.nextIndex < TRON_RUNNER_CROWD_COUNT) return;
  syncTronRunnerCrowdScaleAndGround();
  syncTronRunnerCrowdVisibility();
  tronRunnerCrowdBuildStats.status = 'done';
  tronRunnerCrowdBuildStats.durationMs = performance.now() - job.startedAt;
  tronRunnerCrowdBuildJob = null;
}

async function drainTronRunnerCrowdBuildQueue() {
  while (tronRunnerCrowdBuildJob) {
    processTronRunnerCrowdBuildQueue();
    await waitForNextFrame();
  }
}

function tronRunnerCrowdPointInsideRoute(member, x, z) {
  return tronRunnerCrowdPointInsideRouteCore({
    member,
    x,
    z,
    pointInPolygon: pointInBasePadPolygon,
  });
}

function invalidateTronRunnerCrowdColliderRecords() {
  tronRunnerCrowdColliderRecordCache = null;
  tronRunnerCrowdColliderRecordCacheSourceLength = -1;
}

function tronRunnerCrowdColliderRecords() {
  const sourceLength = sideBuildingRecords.length + mainBuildingRecords.length;
  if (!tronRunnerCrowdColliderRecordCache || tronRunnerCrowdColliderRecordCacheSourceLength !== sourceLength) {
    tronRunnerCrowdColliderRecordCache = [...sideBuildingRecords, ...mainBuildingRecords].filter((record) => record.collider);
    tronRunnerCrowdColliderRecordCacheSourceLength = sourceLength;
  }
  return tronRunnerCrowdColliderRecordCache;
}

function resolveTronRunnerCrowdCollision(member, point) {
  return resolveTronRunnerCrowdCollisionCore(
    member,
    point,
    TRON_RUNNER_CROWD_COLLISIONS_ENABLED,
    tronRunnerCrowdColliderRecords,
    TRON_RUNNER_CROWD_BUILDING_GUARD,
    tronRunnerCrowdPointInsideRoute,
  );
}

function tronRunnerCrowdBuildingCollisionDiagnostic(member) {
  return tronRunnerCrowdBuildingCollisionDiagnosticCore({
    member,
    records: tronRunnerCrowdColliderRecords(),
    padding: TRON_RUNNER_CROWD_BUILDING_GUARD,
    resolveRoundedCollider: resolveTronRunnerRoundedCollider,
    colliderLabel: tronRunnerCrowdColliderLabel,
  });
}

const tronRunnerCrowdAvoidanceDeps = {
  intelligenceEnabled: TRON_RUNNER_CROWD_INTELLIGENCE_ENABLED,
  avoidanceEnabled: TRON_RUNNER_CROWD_AVOIDANCE_ENABLED,
  radius: TRON_RUNNER_CROWD_AVOIDANCE_RADIUS,
  passingPush: TRON_RUNNER_CROWD_PASSING_PUSH,
  strength: TRON_RUNNER_CROWD_AVOIDANCE_STRENGTH,
  yieldDurationMs: TRON_RUNNER_CROWD_YIELD_DURATION_MS,
  stats: tronRunnerCrowdRuntimeStats,
  nearbyMembers: nearbyTronRunnerCrowdMembers,
  setState: setTronRunnerCrowdState,
  playerAvoidanceEnabled: TRON_RUNNER_CROWD_PLAYER_AVOIDANCE_ENABLED,
  playerRadius: TRON_RUNNER_CROWD_PLAYER_AVOIDANCE_RADIUS,
  playerStrength: TRON_RUNNER_CROWD_PLAYER_AVOIDANCE_STRENGTH,
  playerObject: tronRunnerWalker,
};

function tronRunnerCrowdAvoidance(member, current, nextPoint, dirX, dirZ, dt, now) {
  return tronRunnerCrowdAvoidanceCore(member, current, nextPoint, dirX, dirZ, dt, now, tronRunnerCrowdAvoidanceDeps);
}

const tronRunnerCrowdDeadlockDeps = {
  reachRadius: TRON_RUNNER_CROWD_REACH_RADIUS,
  deadlockMoveEps: TRON_RUNNER_CROWD_DEADLOCK_MOVE_EPS,
  deadlockMs: TRON_RUNNER_CROWD_DEADLOCK_MS,
  deadlockNudge: TRON_RUNNER_CROWD_DEADLOCK_NUDGE,
  yieldDurationMs: TRON_RUNNER_CROWD_YIELD_DURATION_MS,
  pointInsideRoute: tronRunnerCrowdPointInsideRoute,
  resolveCollision: resolveTronRunnerCrowdCollision,
  setState: setTronRunnerCrowdState,
};

function tronRunnerCrowdTryDeadlockNudge(member, current, nextPoint, dirX, dirZ, distance, collided, now) {
  return tronRunnerCrowdTryDeadlockNudgeCore(member, current, nextPoint, dirX, dirZ, distance, collided, now, tronRunnerCrowdDeadlockDeps);
}

// Occasional standstill at a waypoint so the crowd reads as people, not marchers.
// Distance-driven walk freezes the legs while paused (no moonwalk).
const TRON_RUNNER_CROWD_PAUSE_CHANCE = 0.28;
const TRON_RUNNER_CROWD_PAUSE_MIN_MS = 900;
const TRON_RUNNER_CROWD_PAUSE_MAX_MS = 2800;
// The green companion (member index 1) greets the player: it walks over at normal pace
// when the city is revealed, stops at a welcoming distance and turns to face the player,
// then stays put. The cyan member behaves like a normal crowd member.
const TRON_RUNNER_GREETER_INDEX = 1;
const TRON_RUNNER_GREET_DISTANCE = 4.0;
const GREETER_SPEED_MULTIPLIER = 1.65; // the greeter always moves 65% faster than the crowd
const GREETER_RUN_SPEED_BOOST = 1.65;  // extra 65% while running to the board (legs stay synced)
const GREETER_HEAD_MAX_YAW = 1.3963; // +/-80deg => 160deg total head turn, no neck over-rotation
const GREETER_HEAD_YAW_SIGN = 1;
const greeterTargetScratch = { x: 0, z: 0 };
// After the welcome bubble dissolves the greeter walks over to the departures board
// (the "12 reparti" tabellone) and posts up just past its right-hand edge, facing the player.
const GREETER_BOARD_SIDE_GAP = 2.4;  // clearance beyond the board's right edge (world units)
const GREETER_BOARD_FRONT_GAP = 1.4; // step toward the player off the board plane (no clipping)
const GREETER_BOARD_REACH = 0.8;     // arrival radius at the board anchor
const GREETER_FOLLOW_DELAY_MS = 1000; // show "Seguimi" first, then start moving 1s later
const GREETER_BOARD_BUBBLE_RANGE = 16.0; // "Questi sono i nostri reparti" shows within 16m of the greeter
const GREETER_BOARD_STANCE_DEG = 45; // at the board the body sits 45deg between player and board
const greeterBoardAnchorScratch = { x: 0, z: 0, cx: 0, cz: 0 };

// Right-hand edge of the primary departures board, in world space. The board is a plane
// rotated yaw about Y (yaw is 0 or PI), so its local +X (width axis) maps to
// (cos yaw, 0, -sin yaw) and its player-facing normal to (sin yaw, 0, cos yaw).
function resolveGreeterBoardAnchor() {
  const boards = typeof getCityDepartmentBoards === 'function' ? getCityDepartmentBoards() : null;
  if (!boards || !boards.length) return null;
  const board = boards.find((b) => b?.group?.visible && b?.boardPosition) || boards[0];
  if (!board || !board.boardPosition) return null;
  const yaw = board.yaw || 0;
  const halfWidth = (board.boardWidth || 21) * 0.5;
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);
  const normalX = Math.sin(yaw);
  const normalZ = Math.cos(yaw);
  greeterBoardAnchorScratch.x = board.boardPosition.x + rightX * (halfWidth + GREETER_BOARD_SIDE_GAP) + normalX * GREETER_BOARD_FRONT_GAP;
  greeterBoardAnchorScratch.z = board.boardPosition.z + rightZ * (halfWidth + GREETER_BOARD_SIDE_GAP) + normalZ * GREETER_BOARD_FRONT_GAP;
  greeterBoardAnchorScratch.cx = board.boardPosition.x; // board centre, for the 45deg stance
  greeterBoardAnchorScratch.cz = board.boardPosition.z;
  return greeterBoardAnchorScratch;
}

// Distance the greeter covers per full run cycle. The run clip is driven by ground distance
// (like the crowd walk) so the feet plant instead of sliding/moonwalking. Tune this up if the
// legs lag behind the motion (slide), down if they spin too fast. Run stride > walk stride.
const GREETER_RUN_CYCLE_DISTANCE = TRON_RUNNER_WALK_CYCLE_DISTANCE * 1.55;

// Hard-switch idle -> run action weights (no crossfade): the run is distance-driven and the
// distance sync only calls mixer.update(0), so a crossfade could not progress anyway. member's
// run/walk/idle action weights are set directly; member.action is repointed to the run clip so
// distance sync, arrival re-pose (run -> idle) and timescale logic all target it.
function switchGreeterActionToRun(mixer, fromAction, runActionKey, member) {
  if (!mixer || !member.runClip) return null;
  const run = member[runActionKey] || mixer.clipAction(member.runClip);
  member[runActionKey] = run;
  run.enabled = true;
  run.setEffectiveTimeScale(1);
  run.setEffectiveWeight(1);
  run.play();
  if (fromAction && fromAction !== run) { fromAction.stop(); fromAction.setEffectiveWeight(0); }
  return run;
}
function startGreeterWalkingToBoard(member) {
  member.greetPosed = false;
  if (member.runClip && member.mixer) {
    member.walkAction = member.walkAction || member.action;
    const run = switchGreeterActionToRun(member.mixer, member.idleAction || member.walkAction, 'runAction', member);
    if (run) member.action = run;
    const rRun = switchGreeterActionToRun(member.reflectionMixer, member.reflectionIdleAction || member.reflectionAction, 'reflectionRunAction', member);
    if (rRun) member.reflectionAction = rRun;
    const lRun = switchGreeterActionToRun(member.reflectionLedMixer, member.reflectionLedIdleAction || member.reflectionLedAction, 'reflectionLedRunAction', member);
    if (lRun) member.reflectionLedAction = lRun;
    return;
  }
  // Fallback (no run clip): hard-switch idle->walk weights.
  const walk = member.action;
  const idle = member.idleAction;
  if (walk) { walk.enabled = true; walk.setEffectiveTimeScale(1); walk.setEffectiveWeight(1); walk.play(); }
  if (idle) { idle.stop(); idle.setEffectiveWeight(0); }
  if (member.reflectionAction) { member.reflectionAction.enabled = true; member.reflectionAction.setEffectiveWeight(1); member.reflectionAction.play(); }
  if (member.reflectionIdleAction) { member.reflectionIdleAction.stop(); member.reflectionIdleAction.setEffectiveWeight(0); }
  if (member.reflectionLedAction) { member.reflectionLedAction.enabled = true; member.reflectionLedAction.setEffectiveWeight(1); member.reflectionLedAction.play(); }
  if (member.reflectionLedIdleAction) { member.reflectionLedIdleAction.stop(); member.reflectionLedIdleAction.setEffectiveWeight(0); }
}

// Head always tracks the player, clamped to the neck range, relative to the current body
// facing. Works while standing AND while walking (body yaw changes, head re-tracks).
function applyGreeterHeadLook(member, dt) {
  if (!member.headBone) {
    member.model?.traverse((o) => { if (!member.headBone && o.isBone && /head$/i.test(o.name)) member.headBone = o; });
  }
  if (!member.headBone) return;
  const lookYaw = Math.atan2(camera.position.x - member.group.position.x, camera.position.z - member.group.position.z);
  let rel = lookYaw - member.group.rotation.y;
  rel = Math.atan2(Math.sin(rel), Math.cos(rel));
  rel = THREE.MathUtils.clamp(rel, -GREETER_HEAD_MAX_YAW, GREETER_HEAD_MAX_YAW) * GREETER_HEAD_YAW_SIGN;
  member.headLookYaw = lerpAngle(member.headLookYaw ?? 0, rel, Math.min(1, dt * 4));
  member.headBone.rotation.y = member.headLookYaw;
  if (!member.reflectionHeadBone && member.reflectionModel) {
    member.reflectionModel.traverse((o) => { if (!member.reflectionHeadBone && o.isBone && /head$/i.test(o.name)) member.reflectionHeadBone = o; });
  }
  if (member.reflectionHeadBone) member.reflectionHeadBone.rotation.y = member.headLookYaw;
}

// Queue a timed speech bubble over the greeter's head (text + lifetime in ms).
function setGreeterBubble(member, html, durationMs, now, sizeScale = 1) {
  member.bubbleText = html;
  member.bubbleUntil = now + durationMs;
  member.bubbleSizeScale = sizeScale;
  member.bubbleProximity = false; // timed message (shows until bubbleUntil)
}

const tronRunnerCrowdNextPointScratch = { x: 0, z: 0 };
function advanceTronRunnerCrowdMember(member, dt, now = performance.now()) {
  normalizeTronRunnerCrowdState(member, now);
  const route = member.route;
  const isGreeter = member.index === TRON_RUNNER_GREETER_INDEX;
  // Once the welcome bubble has dissolved, raise the "Seguimi" prompt and stand for a beat...
  if (isGreeter && member.greetStage === 'welcome'
      && member.greetAt && (now - member.greetAt) > GREETER_BUBBLE_DURATION_MS) {
    member.greetStage = 'followPrompt';
    member.followPromptAt = now;
    setGreeterBubble(member, 'Seguimi', 8000, now);
  }
  // ...then 1s later set off for the departures board (retry until the anchor resolves).
  if (isGreeter && member.greetStage === 'followPrompt'
      && member.followPromptAt && (now - member.followPromptAt) >= GREETER_FOLLOW_DELAY_MS) {
    const anchor = resolveGreeterBoardAnchor();
    if (anchor) {
      member.greetBoardAnchorX = anchor.x;
      member.greetBoardAnchorZ = anchor.z;
      member.greetBoardCenterX = anchor.cx;
      member.greetBoardCenterZ = anchor.cz;
      member.greetStage = 'toBoard';
      startGreeterWalkingToBoard(member);
    }
  }
  if (isGreeter && (member.greetStage === 'welcome' || member.greetStage === 'followPrompt' || member.greetStage === 'atBoard')) {
    // Welcomed/parked: freeze into a neutral standing pose (bind pose = straight legs, then
    // arms crossed like the idle character) so we don't stop mid-stride with a leg raised.
    if (!member.greetPosed) {
      member.greetPosed = true;
      // Crossfade from walking into the soldier idle clip: a natural standing welcome
      // (alive, no mid-stride leg, no stiff pose). Mixer is driven per frame once greetPosed.
      if (member.idleClip && member.mixer) {
        member.idleAction = member.idleAction || member.mixer.clipAction(member.idleClip);
        member.idleAction.reset();
        member.idleAction.setEffectiveTimeScale(1);
        member.idleAction.setEffectiveWeight(1);
        member.idleAction.play();
        if (member.action) member.action.crossFadeTo(member.idleAction, 0.45, false);
        // Keep the floor reflection in sync with the body's idle (it was still walking).
        if (member.reflectionMixer && member.reflectionAction) {
          member.reflectionIdleAction = member.reflectionIdleAction || member.reflectionMixer.clipAction(member.idleClip);
          member.reflectionIdleAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
          member.reflectionAction.crossFadeTo(member.reflectionIdleAction, 0.45, false);
        }
        if (member.reflectionLedMixer && member.reflectionLedAction) {
          member.reflectionLedIdleAction = member.reflectionLedIdleAction || member.reflectionLedMixer.clipAction(member.idleClip);
          member.reflectionLedIdleAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
          member.reflectionLedAction.crossFadeTo(member.reflectionLedIdleAction, 0.45, false);
        }
      } else if (member.action) {
        member.action.stop();
        member.model?.traverse((object) => {
          if (object.isSkinnedMesh && object.skeleton) object.skeleton.pose();
        });
      }
    }
    member.lastMovedDistance = 0;
    const yawToPlayer = Math.atan2(camera.position.x - member.group.position.x, camera.position.z - member.group.position.z);
    let bodyYaw = yawToPlayer; // welcome/follow stance: face the player
    if (member.greetStage === 'atBoard') {
      // Parked: body sits 45deg off the player toward the board (presenting it); head tracks me.
      const yawToBoard = Math.atan2(
        (member.greetBoardCenterX ?? member.group.position.x) - member.group.position.x,
        (member.greetBoardCenterZ ?? member.group.position.z) - member.group.position.z
      );
      const rel = Math.atan2(Math.sin(yawToBoard - yawToPlayer), Math.cos(yawToBoard - yawToPlayer));
      const stance = THREE.MathUtils.degToRad(GREETER_BOARD_STANCE_DEG);
      bodyYaw = yawToPlayer + Math.sign(rel || 1) * Math.min(stance, Math.abs(rel));
      // Proximity-gated bubble: the renderer eases opacity in/out over 0.5s as bubbleInRange flips.
      const distToPlayer = Math.hypot(camera.position.x - member.group.position.x, camera.position.z - member.group.position.z);
      member.bubbleText = 'Questi sono i<br>nostri reparti';
      member.bubbleSizeScale = 2;
      member.bubbleProximity = true;
      member.bubbleInRange = distToPlayer <= GREETER_BOARD_BUBBLE_RANGE;
    }
    member.group.rotation.y = lerpAngle(member.group.rotation.y, bodyYaw, Math.min(1, dt * 4));
    applyGreeterHeadLook(member, dt);
    return;
  }
  if (!isGreeter && !route?.points?.length) {
    member.lastMovedDistance = 0;
    return;
  }
  const current = member.group.position;
  let target;
  if (isGreeter) {
    if (member.greetStage === 'toBoard') {
      greeterTargetScratch.x = member.greetBoardAnchorX;
      greeterTargetScratch.z = member.greetBoardAnchorZ;
    } else {
      greeterTargetScratch.x = camera.position.x;
      greeterTargetScratch.z = camera.position.z;
    }
    target = greeterTargetScratch;
  } else {
    target = route.points[member.waypointIndex % route.points.length];
  }
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const distance = Math.hypot(dx, dz);
  if (isGreeter) {
    if (member.greetStage === 'toBoard') {
      if (distance <= GREETER_BOARD_REACH) {
        member.greetStage = 'atBoard'; // re-pose to idle + 45deg stance next frame
        member.lastMovedDistance = 0;
        return;
      }
    } else if (distance <= TRON_RUNNER_GREET_DISTANCE) {
      member.greetDone = true;       // keeps the welcome bubble showing
      member.greetStage = 'welcome';
      member.greetAt = now;
      setGreeterBubble(member, 'Benvenuto in<br>avstudio.ai', GREETER_BUBBLE_DURATION_MS, now);
      member.lastMovedDistance = 0;
      return;
    }
  } else if (distance <= TRON_RUNNER_CROWD_REACH_RADIUS) {
    member.waypointIndex = (member.waypointIndex + 1) % route.points.length;
    if (Math.random() < TRON_RUNNER_CROWD_PAUSE_CHANCE) {
      const pauseMs = TRON_RUNNER_CROWD_PAUSE_MIN_MS + Math.random() * (TRON_RUNNER_CROWD_PAUSE_MAX_MS - TRON_RUNNER_CROWD_PAUSE_MIN_MS);
      setTronRunnerCrowdState(member, 'pause', now, pauseMs);
    } else {
      setTronRunnerCrowdState(member, 'turn', now, TRON_RUNNER_CROWD_TURN_DURATION_MS);
    }
    member.lastMovedDistance = 0;
    return;
  }
  const dirX = dx / Math.max(distance, 0.001);
  const dirZ = dz / Math.max(distance, 0.001);
  const stateSpeedScale = isGreeter ? 1 : (member.state === 'pause' ? 0 : member.state === 'turn' ? 0.56 : member.state === 'yield' ? 0.34 : 1);
  const baseStep = Math.max(0, member.speed * Math.min(dt, 0.08) * stateSpeedScale);
  const nextPoint = tronRunnerCrowdNextPointScratch;
  nextPoint.x = current.x + dirX * Math.min(distance, baseStep);
  nextPoint.z = current.z + dirZ * Math.min(distance, baseStep);
  let collided = false;
  if (!isGreeter) {
    // The greeter walks straight to the player at normal pace, ignoring crowd jostling.
    const avoidance = tronRunnerCrowdAvoidance(member, current, nextPoint, dirX, dirZ, dt, now);
    if (avoidance.speedScale < 1) {
      nextPoint.x = current.x + dirX * Math.min(distance, baseStep * avoidance.speedScale);
      nextPoint.z = current.z + dirZ * Math.min(distance, baseStep * avoidance.speedScale);
    }
    nextPoint.x += avoidance.x;
    nextPoint.z += avoidance.z;
    collided = resolveTronRunnerCrowdCollision(member, nextPoint);
    if (collided) {
      member.collisionCount += 1;
      member.waypointIndex = (member.waypointIndex + 1) % route.points.length;
      setTronRunnerCrowdState(member, 'avoid', now, TRON_RUNNER_CROWD_YIELD_DURATION_MS);
    }
    tronRunnerCrowdTryDeadlockNudge(member, current, nextPoint, dirX, dirZ, distance, collided, now);
  }
  const movedDistance = Math.hypot(nextPoint.x - current.x, nextPoint.z - current.z);
  const surface = tronRunnerSurfaceYForPoint(nextPoint.x, nextPoint.z);
  member.group.position.set(nextPoint.x, surface.y, nextPoint.z);
  member.group.rotation.y = lerpAngle(member.group.rotation.y, Math.atan2(dirX, dirZ), Math.min(1, dt * 8));
  if (isGreeter) applyGreeterHeadLook(member, dt); // head keeps tracking the player while walking
  member.surface = surface.surface;
  member.groundOffset = member.group.position.y - surface.groundY;
  member.distanceWalked += movedDistance;
  member.lastMovedDistance = movedDistance;
  if (movedDistance > 0.0005) member.lastMovedAt = now;
  member.lastCollision = collided;
}

function updateTronRunnerCrowd(dt) {
  if (!TRON_RUNNER_CROWD_ENABLED) return;
  processTronRunnerCrowdBuildQueue();
  if (!tronRunnerCrowd.length) return;
  syncTronRunnerCrowdVisibility();
  if (!tronRunnerCrowdGroup.visible) {
    tronRunnerCrowdAccumulatedDt = 0;
    return;
  }
  tronRunnerCrowdAccumulatedDt = Math.min(
    TRON_RUNNER_CROWD_MAX_ACCUMULATED_DT,
    tronRunnerCrowdAccumulatedDt + Math.min(dt, 0.05)
  );
  if (tronRunnerCrowdAccumulatedDt < TRON_RUNNER_CROWD_UPDATE_INTERVAL) {
    tronRunnerCrowdRuntimeStats.skippedFrameCount += 1;
    return;
  }
  const step = TRON_RUNNER_CROWD_UPDATE_INTERVAL;
  tronRunnerCrowdAccumulatedDt = Math.max(0, tronRunnerCrowdAccumulatedDt - TRON_RUNNER_CROWD_UPDATE_INTERVAL);
  const now = performance.now();
  const thinkStarted = now;
  tronRunnerCrowdRuntimeStats.frame += 1;
  tronRunnerCrowdRuntimeStats.updateCount += 1;
  tronRunnerCrowdRuntimeStats.lastStepDt = step;
  tronRunnerCrowdRuntimeStats.avoidancePairs = 0;
  tronRunnerCrowdRuntimeStats.maxAvoidanceOverlap = 0;
  updateTronRunnerCrowdCulling();
  updateTronRunnerCrowdReflectionBudget();
  prepareTronRunnerCrowdSpatialGrid();
  for (const member of tronRunnerCrowd) {
    // The greeter always updates (even when off-screen) so it reliably walks over to greet the player.
    const isGreeterMember = member.index === TRON_RUNNER_GREETER_INDEX;
    // Ambient chatter: each non-greeter says one of its lines when the player comes within range,
    // re-arming once the player steps away (hysteresis). Cycles through the member's lines.
    if (!isGreeterMember && member.talkLines?.length) {
      const talkDx = camera.position.x - member.group.position.x;
      const talkDz = camera.position.z - member.group.position.z;
      const talkDistSq = talkDx * talkDx + talkDz * talkDz;
      if (member.talkArmed && talkDistSq <= TRON_RUNNER_CROWD_TALK_RANGE * TRON_RUNNER_CROWD_TALK_RANGE) {
        member.talkText = member.talkLines[member.talkCycle % member.talkLines.length];
        member.talkCycle += 1;
        member.talkStart = now;
        member.talkUntil = now + TRON_RUNNER_CROWD_TALK_DURATION_MS;
        member.talkArmed = false;
      } else if (!member.talkArmed && talkDistSq > TRON_RUNNER_CROWD_TALK_REARM_RANGE * TRON_RUNNER_CROWD_TALK_REARM_RANGE) {
        member.talkArmed = true;
      }
    }
    // While running to the board the greeter's run clip is driven by its own fixed timescale,
    // so skip the crowd's walk-tuned timescale management and the distance-driven walk sync.
    const greeterRunning = isGreeterMember && member.greetStage === 'toBoard';
    const nextEffectiveAnimationSpeed = tronRunnerState.effectiveAnimationSpeed * (member.animationScaleOffset ?? 1);
    if (!greeterRunning && member.action && Math.abs((member.lastEffectiveAnimationSpeed ?? -1) - nextEffectiveAnimationSpeed) > 0.0001) {
      member.action.setEffectiveTimeScale(nextEffectiveAnimationSpeed);
      member.reflectionAction?.setEffectiveTimeScale(nextEffectiveAnimationSpeed);
      member.reflectionLedAction?.setEffectiveTimeScale(nextEffectiveAnimationSpeed);
      member.lastEffectiveAnimationSpeed = nextEffectiveAnimationSpeed;
    }
    member.speed = tronRunnerWalkSpeed * TRON_RUNNER_CROWD_SPEED_SCALE * (member.speedScaleOffset ?? 1)
      * (isGreeterMember ? GREETER_SPEED_MULTIPLIER : 1)
      * (greeterRunning ? GREETER_RUN_SPEED_BOOST : 1);
    const cullingHidden = TRON_RUNNER_CROWD_CULLING_ENABLED && member.cullingVisible === false && !isGreeterMember;
    member.lodStride = isGreeterMember
      ? 1
      : (cullingHidden
        ? TRON_RUNNER_CROWD_CULLED_LOD_STRIDE
        : (TRON_RUNNER_CROWD_INTELLIGENCE_ENABLED ? tronRunnerCrowdLodStride(member) : 1));
    member.lodDt = Math.min(cullingHidden ? 0.34 : 0.14, (member.lodDt || 0) + step);
    member.mixerDt = Math.min(0.14, (member.mixerDt || 0) + step);
    const shouldUpdate = member.lodStride <= 1 || ((tronRunnerCrowdRuntimeStats.frame + member.index) % member.lodStride === 0);
    if (!shouldUpdate) {
      member.lastMovedDistance = 0;
      if (!cullingHidden) updateTronRunnerCrowdReflection(member);
      continue;
    }
    const distanceDrivenWalk = TRON_RUNNER_CROWD_DISTANCE_DRIVEN_WALK_ENABLED && Boolean(member.action) && !member.greetPosed;
    if (!cullingHidden && !distanceDrivenWalk) member.mixer?.update(member.mixerDt);
    if (!cullingHidden && member.dynamicReflectionBudgetActive && !distanceDrivenWalk) {
      member.reflectionMixer?.update(member.mixerDt);
      member.reflectionLedMixer?.update(member.mixerDt);
    }
    const moveSubsteps = Math.max(1, Math.ceil(member.lodDt / TRON_RUNNER_CROWD_MAX_MOVE_SUBSTEP));
    const moveSubstepDt = member.lodDt / moveSubsteps;
    const distanceBefore = member.distanceWalked || 0;
    for (let stepIndex = 0; stepIndex < moveSubsteps; stepIndex += 1) {
      advanceTronRunnerCrowdMember(member, moveSubstepDt, now);
    }
    const movedThisUpdate = Math.max(0, (member.distanceWalked || 0) - distanceBefore);
    member.lastMovedDistance = movedThisUpdate;
    if (!cullingHidden && distanceDrivenWalk && !member.greetPosed) {
      if (greeterRunning) syncTronRunnerCrowdRunCycleToDistance(member);
      else syncTronRunnerCrowdWalkCycleToDistance(member);
    }
    if (!cullingHidden) updateTronRunnerCrowdReflection(member);
    member.mixerDt = 0;
    member.lodDt = 0;
  }
  tronRunnerCrowdRuntimeStats.lastThinkMs = performance.now() - thinkStarted;
  tronRunnerCrowdRuntimeStats.maxThinkMs = Math.max(
    tronRunnerCrowdRuntimeStats.maxThinkMs,
    tronRunnerCrowdRuntimeStats.lastThinkMs
  );
}

function tronRunnerCrowdInspect() {
  const runnerScale = Number(tronRunnerWalker.scale.x.toFixed(4));
  const runnerTargetHeight = TRON_RUNNER_TARGET_HEIGHT * tronRunnerWalker.scale.y;
  const runnerHeightFromRoad = tronRunnerWalker.position.y - roadTileTopY();
  const now = performance.now();
  const members = tronRunnerCrowd.map((member) => {
    tronRunnerCrowdBox.setFromObject(member.group);
    tronRunnerCrowdBox.getSize(tronRunnerCrowdSize);
    const buildingCollision = tronRunnerCrowdBuildingCollisionDiagnostic(member);
    const heightFromRoad = member.group.position.y - roadTileTopY();
    const targetHeight = TRON_RUNNER_TARGET_HEIGHT * member.group.scale.y;
    const materialInspect = inspectTronRunnerMaterials(member.model);
    return {
      index: member.index + 1,
      visible: Boolean(tronRunnerCrowdGroup.visible && member.group.visible),
      x: Number(member.group.position.x.toFixed(2)),
      y: Number(member.group.position.y.toFixed(2)),
      z: Number(member.group.position.z.toFixed(2)),
      scale: Number(member.group.scale.x.toFixed(4)),
      targetHeight: Number(targetHeight.toFixed(3)),
      heightFromRoad: Number(heightFromRoad.toFixed(3)),
      groundOffset: Number((member.groundOffset ?? TRON_RUNNER_CROWD_GROUND_OFFSET).toFixed(3)),
      surface: member.surface,
      routeMode: member.route?.mode ?? 'fallback-road',
      routeLabel: member.route?.label ?? 'fallback',
      routeCluster: member.route?.cluster ?? 'city',
      sideStreetId: member.route?.sideStreetId ?? '',
      sideStreetSide: member.route?.sideStreetSide ?? '',
      sideStreetLateralOrdinal: member.route?.sideStreetLateralOrdinal ?? null,
      sideStreetGroupIndex: member.route?.sideStreetGroupIndex ?? null,
      sideStreetGroupCount: member.route?.sideStreetGroupCount ?? null,
      startMode: member.startMode ?? 'unknown',
      colorPreset: member.colorPreset ?? 'current',
      colorName: member.colorName ?? 'current cyan',
      ...materialInspect,
      walkActionTime: Number((member.action?.time ?? 0).toFixed(3)),
      walkClipDuration: Number((member.action?.getClip?.()?.duration ?? 0).toFixed(3)),
      walkCycleOffset: Number((member.walkCycleOffset ?? 0).toFixed(3)),
      state: member.state ?? 'walk',
      lodStride: member.lodStride ?? 1,
      lodDistance: Number((member.lodDistance ?? 0).toFixed(1)),
      cullingVisible: Boolean(member.cullingVisible),
      cullingInFrustum: Boolean(member.cullingInFrustum),
      cullingReason: member.cullingReason ?? 'unknown',
      cullingDistance: Number((member.cullingDistance ?? 0).toFixed(1)),
      avoidanceNeighbors: member.avoidanceNeighbors ?? 0,
      avoidanceOverlap: Number((member.avoidanceOverlap ?? 0).toFixed(3)),
      stuckMs: member.stuckSince ? Number(Math.max(0, now - member.stuckSince).toFixed(0)) : 0,
      stuckEscapes: member.stuckEscapes ?? 0,
      buildingCollision: buildingCollision.colliding,
      buildingCollisionCorrection: Number(buildingCollision.correction.toFixed(3)),
      buildingCollisionLabel: buildingCollision.label,
      dynamicReflectionVisible: Boolean(member.dynamicReflectionVisible),
      dynamicReflectionMode: member.reflectionGroup?.userData?.tronRunnerReflectionMode ?? 'mesh-clone',
      dynamicReflectionBudgetActive: Boolean(member.dynamicReflectionBudgetActive),
      dynamicReflectionRank: member.dynamicReflectionRank ?? null,
      dynamicReflectionDistance: Number.isFinite(member.dynamicReflectionDistance)
        ? Number(member.dynamicReflectionDistance.toFixed(1))
        : null,
      dynamicReflectionOpacity: Number((member.dynamicReflectionOpacity ?? 0).toFixed(3)),
      dynamicReflectionBodyOpacity: Number((member.dynamicReflectionBodyOpacity ?? 0).toFixed(3)),
      dynamicReflectionLedOpacity: Number((member.dynamicReflectionLedOpacity ?? 0).toFixed(3)),
      dynamicReflectionMeshCount: member.dynamicReflectionMeshCount ?? 0,
      dynamicReflectionLedMeshCount: member.dynamicReflectionLedMeshCount ?? 0,
      waypointIndex: member.waypointIndex ?? 0,
      distanceWalked: Number((member.distanceWalked ?? 0).toFixed(2)),
      lastMovedDistance: Number((member.lastMovedDistance ?? 0).toFixed(4)),
      recentlyMoved: now - (member.lastMovedAt || 0) < 360,
      collisionCount: member.collisionCount ?? 0,
      lastCollision: Boolean(member.lastCollision),
      sizeY: Number(tronRunnerCrowdSize.y.toFixed(3)),
    };
  });
  const scaleDeltas = members.map((member) => Math.abs(member.scale - runnerScale));
  const targetHeightDeltas = members.map((member) => Math.abs(member.targetHeight - runnerTargetHeight));
  const heightFromRoadDeltas = members.map((member) => Math.abs(member.heightFromRoad - runnerHeightFromRoad));
  const groundOffsetDeltas = members.map((member) => Math.abs(member.groundOffset - TRON_RUNNER_CROWD_GROUND_OFFSET));
  const stateCounts = countBy(members, (member) => member.state);
  const routeDistribution = countBy(members, (member) => member.routeMode || 'fallback-road');
  const lodStrideCounts = countBy(members, (member) => String(member.lodStride || 1));
  const colorCounts = countBy(members, (member) => member.colorPreset || 'current');
  const sideStreetSummary = tronRunnerCrowdSecondaryStreetSummary(tronRunnerCrowdCandidateRecords());
  const sideStreetCoverage = buildSideStreetCoverage(sideStreetSummary.streets, members);
  const sideStreetGroupedSegments = buildSideStreetGroupedSegments(sideStreetCoverage);
  const materialMinOpacity = minBy(members, (member) => member.materialMinOpacity, 1);
  const materialMaxEmissiveIntensity = maxBy(members, (member) => member.materialMaxEmissiveIntensity, 0);
  const transparentMaterialCount = sumBy(members, (member) => member.transparentMaterialCount);
  return {
    enabled: TRON_RUNNER_CROWD_ENABLED,
    mode: TRON_RUNNER_CROWD_PATH_MODE,
    count: tronRunnerCrowd.length,
    visibleCount: members.filter((member) => member.visible).length,
    colorCounts,
    routeDistribution,
    sideStreetDetectedStreetCount: sideStreetSummary.streetCount,
    sideStreetDetectedLaneCount: sideStreetSummary.laneCount,
    sideStreetDetectedStreets: sideStreetSummary.streets,
    sideStreetCoverage,
    sideStreetGroupedSegments,
    materialMinOpacity: Number(materialMinOpacity.toFixed(3)),
    materialMaxEmissiveIntensity: Number(materialMaxEmissiveIntensity.toFixed(3)),
    crowdRevealMaterialOpacity: Number((tronRunnerState.crowdRevealMaterialOpacity ?? 0).toFixed(3)),
    characterLedBrightnessMultiplier: tronRunnerLedBrightness,
    characterLedBloomBoost: tronRunnerLedBloom,
    characterLedScale: Number(tronRunnerCharacterLedScale().toFixed(3)),
    characterLedDefaultScale: Number(tronRunnerCharacterLedDefaultScale().toFixed(3)),
    characterLedEmissiveMax: Number((tronRunnerState.ledEmissiveMax ?? TRON_RUNNER_CHARACTER_LED_EMISSIVE_MAX).toFixed(3)),
    transparentMaterialCount,
    sidewalkMembers: members.filter((member) => member.surface === 'sidewalk').length,
    routeLoopMembers: members.filter((member) => member.routeMode === TRON_RUNNER_CROWD_PATH_MODE).length,
    startClusterMembers: members.filter((member) => member.routeCluster === 'player-start').length,
    sideStreetLateralMembers: members.filter((member) => (
      member.routeMode === 'side-street-lateral' && Math.abs(member.x) > roadHalf()
    )).length,
    movingMembers: members.filter((member) => member.recentlyMoved).length,
    stuckMembers: members.filter((member) => member.stuckMs > TRON_RUNNER_CROWD_DEADLOCK_MS).length,
    stuckEscapes: sumBy(members, (member) => member.stuckEscapes),
    collisionEnabled: TRON_RUNNER_CROWD_COLLISIONS_ENABLED,
    collisionCount: sumBy(members, (member) => member.collisionCount),
    buildingCollisionMembers: members.filter((member) => member.buildingCollision).length,
    maxBuildingCollisionCorrection: Number(maxBy(members, (member) => member.buildingCollisionCorrection, 0).toFixed(3)),
    requestedCount: TRON_RUNNER_CROWD_COUNT,
    cloneSource: 'runner-post-fit-model',
    skeletonClone: Boolean(cloneRunnerSkeleton),
    sharedMaterial: true,
    realShadows: false,
    dynamicReflections: {
      enabled: TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
      mode: 'mesh-clone',
      maxActive: TRON_RUNNER_CROWD_REFLECTION_MAX_ACTIVE,
      budgetLimit: tronRunnerCrowdRuntimeStats.reflectionBudgetLimit,
      fpsBudgetLimit: tronRunnerCrowdRuntimeStats.reflectionFpsBudgetLimit,
      nearDistance: TRON_RUNNER_CROWD_REFLECTION_NEAR_DISTANCE,
      minFps: TRON_RUNNER_CROWD_REFLECTION_MIN_FPS,
      postRevealRamp: {
        enabled: TRON_RUNNER_CROWD_REFLECTION_POST_REVEAL_RAMP_ENABLED,
        active: tronRunnerCrowdRuntimeStats.reflectionPostRevealRampActive,
        durationMs: TRON_RUNNER_CROWD_REFLECTION_POST_REVEAL_RAMP_MS,
        elapsedMs: Number(tronRunnerCrowdRuntimeStats.reflectionPostRevealElapsedMs.toFixed(1)),
        progress: Number(tronRunnerCrowdRuntimeStats.reflectionPostRevealProgress.toFixed(3)),
        rampLimit: tronRunnerCrowdRuntimeStats.reflectionPostRevealRampLimit,
      },
      distanceSkippedCount: tronRunnerCrowdRuntimeStats.reflectionDistanceSkippedCount,
      budgetActiveCount: tronRunnerCrowdRuntimeStats.activeReflectionCount,
      candidateCount: tronRunnerCrowdRuntimeStats.reflectionCandidateCount,
      visibleCount: members.filter((member) => member.dynamicReflectionVisible).length,
      meshCount: sumBy(members, (member) => member.dynamicReflectionMeshCount || 0),
      ledMeshCount: sumBy(members, (member) => member.dynamicReflectionLedMeshCount || 0),
      maxOpacity: Number(maxBy(members, (member) => member.dynamicReflectionOpacity || 0, 0).toFixed(3)),
      bodyOpacity: Number(maxBy(members, (member) => member.dynamicReflectionBodyOpacity || 0, 0).toFixed(3)),
      ledOpacity: Number(maxBy(members, (member) => member.dynamicReflectionLedOpacity || 0, 0).toFixed(3)),
      yScale: TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE,
    },
    culling: {
      enabled: TRON_RUNNER_CROWD_CULLING_ENABLED,
      maxDistance: TRON_RUNNER_CROWD_CULL_DISTANCE,
      radius: TRON_RUNNER_CROWD_CULL_RADIUS,
      culledLodStride: TRON_RUNNER_CROWD_CULLED_LOD_STRIDE,
      visibleCount: tronRunnerCrowdRuntimeStats.cullingVisibleCount,
      hiddenCount: tronRunnerCrowdRuntimeStats.cullingHiddenCount,
      distanceHiddenCount: tronRunnerCrowdRuntimeStats.cullingDistanceHiddenCount,
      frustumHiddenCount: tronRunnerCrowdRuntimeStats.cullingFrustumHiddenCount,
      minDistance: Number(tronRunnerCrowdRuntimeStats.cullingMinDistance.toFixed(1)),
      maxObservedDistance: Number(tronRunnerCrowdRuntimeStats.cullingMaxDistance.toFixed(1)),
    },
    build: {
      status: tronRunnerCrowdBuildStats.status,
      built: tronRunnerCrowdBuildStats.built,
      requested: tronRunnerCrowdBuildStats.requested,
      progress: Number((tronRunnerCrowdBuildStats.built / Math.max(1, tronRunnerCrowdBuildStats.requested)).toFixed(3)),
      durationMs: Number(tronRunnerCrowdBuildStats.durationMs.toFixed(2)),
      lastChunkMs: Number(tronRunnerCrowdBuildStats.lastChunkMs.toFixed(2)),
      queued: Boolean(tronRunnerCrowdBuildJob),
    },
    intelligence: {
      enabled: TRON_RUNNER_CROWD_INTELLIGENCE_ENABLED,
      mode: 'waypoint-state-machine',
      avoidanceEnabled: TRON_RUNNER_CROWD_AVOIDANCE_ENABLED,
      avoidanceRadius: TRON_RUNNER_CROWD_AVOIDANCE_RADIUS,
      avoidancePairs: tronRunnerCrowdRuntimeStats.avoidancePairs,
      maxAvoidanceOverlap: Number(tronRunnerCrowdRuntimeStats.maxAvoidanceOverlap.toFixed(3)),
      spatialGridCell: TRON_RUNNER_CROWD_SPATIAL_CELL,
      gridCells: tronRunnerCrowdRuntimeStats.gridCells,
      lodEnabled: TRON_RUNNER_CROWD_INTELLIGENCE_ENABLED,
      distanceReuseEnabled: TRON_RUNNER_CROWD_DISTANCE_CACHE_ENABLED,
      distanceCalculations: tronRunnerCrowdRuntimeStats.distanceCalculations,
      distanceReuses: tronRunnerCrowdRuntimeStats.distanceReuses,
      lodNearDistance: TRON_RUNNER_CROWD_LOD_NEAR_DISTANCE,
      lodMidDistance: TRON_RUNNER_CROWD_LOD_MID_DISTANCE,
      lodStrideCounts,
      targetFps: TRON_RUNNER_CROWD_TARGET_FPS,
      updateIntervalMs: Number((TRON_RUNNER_CROWD_UPDATE_INTERVAL * 1000).toFixed(2)),
      updateCount: tronRunnerCrowdRuntimeStats.updateCount,
      skippedFrameCount: tronRunnerCrowdRuntimeStats.skippedFrameCount,
      performanceFreezeFrameCount: tronRunnerCrowdRuntimeStats.performanceFreezeFrameCount,
      lastStepMs: Number((tronRunnerCrowdRuntimeStats.lastStepDt * 1000).toFixed(2)),
      stateCounts,
      lastThinkMs: Number(tronRunnerCrowdRuntimeStats.lastThinkMs.toFixed(3)),
      maxThinkMs: Number(tronRunnerCrowdRuntimeStats.maxThinkMs.toFixed(3)),
    },
    scaleLock: TRON_RUNNER_CROWD_SCALE_LOCK,
    sourceScale: runnerScale,
    sourceTargetHeight: Number(runnerTargetHeight.toFixed(3)),
    sourceHeightFromRoad: Number(runnerHeightFromRoad.toFixed(3)),
    maxScaleDelta: Number((scaleDeltas.length ? Math.max(...scaleDeltas) : 0).toFixed(4)),
    maxTargetHeightDelta: Number((targetHeightDeltas.length ? Math.max(...targetHeightDeltas) : 0).toFixed(4)),
    maxHeightFromRoadDelta: Number((heightFromRoadDeltas.length ? Math.max(...heightFromRoadDeltas) : 0).toFixed(4)),
    maxGroundOffsetDelta: Number((groundOffsetDeltas.length ? Math.max(...groundOffsetDeltas) : 0).toFixed(4)),
    members,
  };
}

function tronRunnerIdleCharacterInspect() {
  return tronRunnerIdleCharacterInspectCore({
    idleCharacter: tronRunnerIdleCharacter,
    idleCharacterGroup: tronRunnerIdleCharacterGroup,
    crowdBox: tronRunnerCrowdBox,
    boundsCenter: tronRunnerIdleCharacterBoundsCenter,
    enabled: TRON_RUNNER_IDLE_CHARACTER_ENABLED,
    colorPreset: TRON_RUNNER_IDLE_CHARACTER_COLOR_PRESET,
    liftPx: TRON_RUNNER_IDLE_CHARACTER_LIFT_PX,
    yLift: TRON_RUNNER_IDLE_CHARACTER_Y_LIFT,
    leanDeg: TRON_RUNNER_IDLE_CHARACTER_LEAN_DEG,
  });
}

function tronRunnerFootstepSurface() {
  return tronRunnerState.surface === 'sidewalk' ? 'sidewalk' : 'road';
}

function tronRunnerFootstepAudioState() {
  return {
    bus: tronRunnerAutonomy.lastFootstepBus,
    spatialized: tronRunnerAutonomy.lastFootstepBus === FOOTSTEP_NPC_SPATIAL_BUS && tronRunnerAutonomy.lastFootstepPlayed,
    distanceModel: 'inverse',
    refDistance: TRON_RUNNER_FOOTSTEP_REF_DISTANCE,
    maxDistance: TRON_RUNNER_FOOTSTEP_MAX_DISTANCE,
    rolloffFactor: TRON_RUNNER_FOOTSTEP_ROLLOFF,
    volumeScale: TRON_RUNNER_FOOTSTEP_VOLUME_SCALE,
    syncSource: tronRunnerAutonomy.lastFootstepSyncSource,
    lastGain: Number(tronRunnerAutonomy.lastFootstepGain.toFixed(4)),
    lastDistance: Number(tronRunnerAutonomy.lastFootstepDistance.toFixed(2)),
    lastDistanceGain: Number(tronRunnerAutonomy.lastFootstepDistanceGain.toFixed(4)),
    lastPlaybackRate: Number(tronRunnerAutonomy.lastFootstepPlaybackRate.toFixed(3)),
    lastPan: Number(tronRunnerAutonomy.lastFootstepPan.toFixed(3)),
    lastSample: tronRunnerAutonomy.lastFootstepSample,
    lastSurface: tronRunnerAutonomy.lastFootstepSurface,
  };
}

function tronRunnerFootstepOrigin(side) {
  const sideSign = side === 'left' ? -1 : 1;
  const sideOffset = 0.28 * sideSign;
  return {
    x: tronRunnerWalker.position.x + Math.cos(tronRunnerYaw) * sideOffset,
    y: tronRunnerWalker.position.y + 0.16,
    z: tronRunnerWalker.position.z - Math.sin(tronRunnerYaw) * sideOffset,
  };
}

function tronRunnerWalkCyclePhase() {
  const action = tronRunnerParts.activeAction;
  const clip = action?.getClip?.() || action?._clip;
  const duration = clip?.duration;
  if (!action || !Number.isFinite(duration) || duration <= 0.001) return null;
  return ((action.time / duration) % 1 + 1) % 1;
}

function tronRunnerWalkCycleFootstep(movedDistance) {
  const phase = tronRunnerWalkCyclePhase();
  const next = tronRunnerWalkCycleFootstepCore({
    phase,
    movedDistance,
    previousPhase: tronRunnerAutonomy.lastWalkCyclePhase,
    footstepPhase: tronRunnerAutonomy.footstepPhase,
    lastFootstepIndex: tronRunnerAutonomy.lastFootstepIndex,
    footstepSide: tronRunnerAutonomy.footstepSide,
    contacts: TRON_RUNNER_FOOTSTEP_CONTACTS,
    strideLength: TRON_RUNNER_FREE_ROAM_STRIDE_LENGTH,
  });
  tronRunnerAutonomy.lastWalkCyclePhase = next.nextWalkCyclePhase;
  tronRunnerAutonomy.footstepPhase = next.nextFootstepPhase;
  tronRunnerAutonomy.lastFootstepIndex = next.nextFootstepIndex;
  tronRunnerAutonomy.footstepSide = next.nextFootstepSide;
  return next.contact;
}

function tronRunnerDroneAnchor() {
  const target = computeDroneIntroTargetPose?.();
  if (target && Number.isFinite(target.x) && Number.isFinite(target.z)) return { x: target.x, z: target.z };
  return {
    x: Number.isFinite(playerSpawn?.x) ? playerSpawn.x : 0,
    z: Number.isFinite(playerSpawn?.z) ? playerSpawn.z : dynamicRoadCenter,
  };
}

function tronRunnerWaypointForSideBuilding(record) {
  const pad = record?.basePad;
  const points = pad?.innerHitPolygon?.length ? pad.innerHitPolygon : pad?.hitPolygon;
  if (!record || !pad?.border || !points?.length) return null;
  const localXs = points.map(([x]) => x);
  const localZs = points.map(([, z]) => z);
  const roadFacingX = record.sign < 0 ? Math.max(...localXs) : Math.min(...localXs);
  const safeX = roadFacingX + record.sign * TRON_RUNNER_FREE_ROAM_SIDEWALK_INSET;
  const minZ = Math.min(...localZs) + 2;
  const maxZ = Math.max(...localZs) - 2;
  const localZ = THREE.MathUtils.clamp(0, minZ, maxZ);
  return {
    x: pad.border.position.x + safeX,
    z: pad.border.position.z + localZ,
    surface: 'sidewalk',
    label: `sidewalk-${record.civicNumberValue ?? 'building'}`,
  };
}

function tronRunnerRoadWaypoint(z, label = 'road') {
  const limits = roadHexBoundaryLimits();
  return {
    x: THREE.MathUtils.clamp(0, limits.minX + 2, limits.maxX - 2),
    z: THREE.MathUtils.clamp(z, limits.minZ + 2, limits.maxZ - 2),
    surface: 'road',
    label,
  };
}

function rotateTronRunnerWaypointsToAnchor(waypoints, anchor) {
  if (!waypoints.length) return waypoints;
  let bestIndex = 0;
  let bestDistance = Infinity;
  waypoints.forEach((point, index) => {
    const distance = Math.hypot(point.x - anchor.x, point.z - anchor.z);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return waypoints.slice(bestIndex).concat(waypoints.slice(0, bestIndex));
}

function tronRunnerFreeRoamRouteSpec() {
  const rows = [...new Set(sideBuildingRecords
    .filter((record) => record.mesh?.visible !== false && record.basePad?.hitPolygon?.length)
    .map((record) => Number(record.mesh.position.z.toFixed(3))))]
    .sort((a, b) => b - a);
  const waypoints = [];
  rows.forEach((z, index) => {
    const rowRecords = sideBuildingRecords
      .filter((record) => Math.abs(record.mesh.position.z - z) < GRID_BLOCK)
      .sort((a, b) => a.sign - b.sign);
    const left = rowRecords.find((record) => record.sign < 0);
    const right = rowRecords.find((record) => record.sign > 0);
    const firstSide = index % 2 === 0 ? left : right;
    const secondSide = index % 2 === 0 ? right : left;
    const first = tronRunnerWaypointForSideBuilding(firstSide);
    const second = tronRunnerWaypointForSideBuilding(secondSide);
    if (first) waypoints.push(first);
    waypoints.push(tronRunnerRoadWaypoint(z, `road-${z}`));
    if (second) waypoints.push(second);
    waypoints.push(tronRunnerRoadWaypoint(z, `road-return-${z}`));
  });
  if (mainBuildingRecords[0]?.basePad?.hitPolygon?.length) {
    const z = mainBuildingRecords[0].mesh.position.z + mainBuildingRecords[0].collider.hd + GRID_BLOCK * 1.5;
    waypoints.push(tronRunnerRoadWaypoint(z, 'main-road-front'));
  }
  const anchor = tronRunnerDroneAnchor();
  const rotated = rotateTronRunnerWaypointsToAnchor(waypoints.filter(Boolean), anchor);
  if (!rotated.length) return null;
  return {
    mode: 'free-roam',
    closed: true,
    waypoints: rotated,
    waypointCount: rotated.length,
    x: rotated[0].x,
    zA: rotated[0].z,
    zB: rotated[1]?.z ?? rotated[0].z,
    anchor,
  };
}

function resolveTronRunnerAutonomyCollision(point) {
  let collision = false;
  if (TRON_RUNNER_FREE_ROAM_COLLISIONS_ENABLED) {
    for (const collider of buildingColliders) {
      const basePadding = collider.role === 'main-building' ? mainBuildingCollisionPadding : collisionPadding;
      if (resolveTronRunnerRoundedCollider(point, collider, basePadding + TRON_RUNNER_FREE_ROAM_COLLISION_RADIUS)) {
        collision = true;
      }
    }
    const limits = roadHexBoundaryLimits();
    const nextX = THREE.MathUtils.clamp(point.x, limits.minX, limits.maxX);
    const nextZ = THREE.MathUtils.clamp(point.z, limits.minZ, limits.maxZ);
    if (Math.abs(nextX - point.x) > 0.001 || Math.abs(nextZ - point.z) > 0.001) collision = true;
    point.x = nextX;
    point.z = nextZ;
  }
  return collision;
}

function updateTronRunnerAutonomyState(route, movedDistance = 0, collision = false) {
  tronRunnerState.autonomy = {
    mode: route?.mode || 'free-roam',
    collisionEnabled: TRON_RUNNER_FREE_ROAM_COLLISIONS_ENABLED,
    footstepsEnabled: TRON_RUNNER_FREE_ROAM_FOOTSTEPS_ENABLED,
    waypointIndex: tronRunnerAutonomy.waypointIndex,
    waypointCount: route?.waypointCount ?? route?.waypoints?.length ?? 0,
    targetLabel: route?.waypoints?.[tronRunnerAutonomy.waypointIndex]?.label ?? '',
    distanceWalked: Number(tronRunnerAutonomy.distanceWalked.toFixed(2)),
    lastMoveDistance: Number(movedDistance.toFixed(3)),
    collisionCount: tronRunnerAutonomy.collisionCount,
    lastCollision: collision,
    lastFootstepSurface: tronRunnerAutonomy.lastFootstepSurface,
    lastFootstepSample: tronRunnerAutonomy.lastFootstepSample,
    lastFootstepPlayed: tronRunnerAutonomy.lastFootstepPlayed,
    audio: tronRunnerFootstepAudioState(),
  };
}

function updateTronRunnerAutonomyFootsteps(movedDistance, dt) {
  if (!TRON_RUNNER_FREE_ROAM_FOOTSTEPS_ENABLED) return;
  if (!TRON_RUNNER_SOURCE_CHARACTER_VISIBLE) return;
  if (TRON_RUNNER_REVEAL_ENABLED && !tronRunnerRevealComplete) return;
  const contact = tronRunnerWalkCycleFootstep(movedDistance);
  tronRunnerAutonomy.lastFootstepSyncSource = contact.syncSource || 'walk-cycle';
  if (!contact.triggered) return;
  const surface = tronRunnerFootstepSurface();
  const now = performance.now();
  if (now - tronRunnerAutonomy.lastFootstepPlayedAt < FOOTSTEP_MIN_INTERVAL_MS) return;
  tronRunnerAutonomy.lastFootstepPlayedAt = now;
  const side = contact.side || 'right';
  const moveRatio = movedDistance / Math.max(0.05, tronRunnerWalkSpeed * Math.max(dt, 0.001));
  const intensity = THREE.MathUtils.clamp(0.28 + moveRatio * 0.16, 0.18, 0.54);
  const details = playFootstepForSurface(surface, intensity, side, {
    bus: FOOTSTEP_NPC_SPATIAL_BUS,
    returnDetails: true,
    spatialOrigin: tronRunnerFootstepOrigin(side),
    volumeScale: TRON_RUNNER_FOOTSTEP_VOLUME_SCALE,
    minVolume: 0.002,
    maxVolume: 0.52,
    refDistance: TRON_RUNNER_FOOTSTEP_REF_DISTANCE,
    maxDistance: TRON_RUNNER_FOOTSTEP_MAX_DISTANCE,
    rolloffFactor: TRON_RUNNER_FOOTSTEP_ROLLOFF,
    distanceModel: 'inverse',
    panningModel: 'HRTF',
    rateMultiplier: surface === 'sidewalk' ? 1.08 : 0.90,
    runLift: 1,
    lowpassFrequency: surface === 'sidewalk' ? 1900 : 1550,
    fadeOutTime: 0.2,
    syncSource: contact.syncSource || 'walk-cycle',
  });
  tronRunnerAutonomy.lastFootstepPlayed = Boolean(details?.played);
  if (details?.played) {
    tronRunnerAutonomy.lastFootstepBus = details.bus;
    tronRunnerAutonomy.lastFootstepSurface = details.surface;
    tronRunnerAutonomy.lastFootstepSample = details.sampleKey;
    tronRunnerAutonomy.lastFootstepGain = details.gain;
    tronRunnerAutonomy.lastFootstepDistance = details.distance;
    tronRunnerAutonomy.lastFootstepDistanceGain = details.distanceGain;
    tronRunnerAutonomy.lastFootstepPlaybackRate = details.playbackRate;
    tronRunnerAutonomy.lastFootstepPan = details.pan;
    tronRunnerAutonomy.lastFootstepSyncSource = details.syncSource;
  }
}

function updateTronRunnerFreeRoam(dt, route) {
  const waypoints = route?.waypoints || [];
  if (!waypoints.length) return null;
  if (!tronRunnerAutonomy.initialized) {
    tronRunnerAutonomy.initialized = true;
    tronRunnerAutonomy.waypointIndex = 1 % waypoints.length;
    return {
      x: waypoints[0].x,
      z: waypoints[0].z,
      directionX: 0,
      directionZ: 1,
      movedDistance: 0,
      collision: false,
    };
  }

  let target = waypoints[tronRunnerAutonomy.waypointIndex % waypoints.length];
  let currentX = tronRunnerWalker.position.x;
  let currentZ = tronRunnerWalker.position.z;
  let dx = target.x - currentX;
  let dz = target.z - currentZ;
  let distance = Math.hypot(dx, dz);
  if (distance <= TRON_RUNNER_FREE_ROAM_REACH_RADIUS) {
    tronRunnerAutonomy.waypointIndex = (tronRunnerAutonomy.waypointIndex + 1) % waypoints.length;
    target = waypoints[tronRunnerAutonomy.waypointIndex];
    dx = target.x - currentX;
    dz = target.z - currentZ;
    distance = Math.hypot(dx, dz);
  }
  const directionX = distance > 0.001 ? dx / distance : Math.sin(tronRunnerYaw);
  const directionZ = distance > 0.001 ? dz / distance : Math.cos(tronRunnerYaw);
  const step = Math.min(distance, Math.max(0, tronRunnerWalkSpeed * dt));
  const point = {
    x: currentX + directionX * step,
    z: currentZ + directionZ * step,
  };
  const collision = resolveTronRunnerAutonomyCollision(point);
  const movedDistance = Math.hypot(point.x - currentX, point.z - currentZ);
  tronRunnerAutonomy.distanceWalked += movedDistance;
  if (collision) {
    tronRunnerAutonomy.collisionCount += 1;
    if (movedDistance < Math.max(0.02, step * 0.2)) {
      tronRunnerAutonomy.waypointIndex = (tronRunnerAutonomy.waypointIndex + 1) % waypoints.length;
    }
  }
  tronRunnerAutonomy.lastCollision = collision;
  return {
    x: point.x,
    z: point.z,
    directionX,
    directionZ,
    movedDistance,
    collision,
  };
}

function tronRunnerRouteSpec() {
  if (TRON_RUNNER_FREE_ROAM_ENABLED) {
    const freeRoamRoute = tronRunnerFreeRoamRouteSpec();
    if (freeRoamRoute) return freeRoamRoute;
  }
  const minZ = dynamicRoadCenter - dynamicRoadLength * 0.5 + GRID_BLOCK * 5;
  const maxZ = dynamicRoadCenter + dynamicRoadLength * 0.5 - GRID_BLOCK * 5;
  const anchorZ = THREE.MathUtils.clamp((playerSpawn?.z ?? maxZ) - GRID_BLOCK * 8, minZ + GRID_BLOCK * 12, maxZ - GRID_BLOCK * 4);
  const sidewalkRecords = sideBuildingRecords
    .filter((record) => record.sign === TRON_RUNNER_SIDEWALK_SIGN && record.basePad?.hitPolygon?.length)
    .sort((a, b) => Math.abs(a.mesh.position.z - anchorZ) - Math.abs(b.mesh.position.z - anchorZ));
  const sidewalkRecord = sidewalkRecords[0];
  const pad = sidewalkRecord?.basePad;
  const padLocalXs = pad?.innerHitPolygon?.length ? pad.innerHitPolygon.map(([x]) => x) : pad?.hitPolygon?.map(([x]) => x);
  const padLocalZs = pad?.innerHitPolygon?.length ? pad.innerHitPolygon.map(([, z]) => z) : pad?.hitPolygon?.map(([, z]) => z);
  const padMinZ = padLocalZs?.length ? Math.min(...padLocalZs) + pad.border.position.z : minZ;
  const padMaxZ = padLocalZs?.length ? Math.max(...padLocalZs) + pad.border.position.z : maxZ;
  const padInnerEdgeX = padLocalXs?.length
    ? (TRON_RUNNER_SIDEWALK_SIGN < 0 ? Math.max(...padLocalXs) : Math.min(...padLocalXs))
    : 0;
  const x = pad
    ? pad.border.position.x + padInnerEdgeX + TRON_RUNNER_SIDEWALK_SIGN * TRON_RUNNER_SIDEWALK_INSET
    : TRON_RUNNER_SIDEWALK_SIGN * Math.max(10, roadHalf() + streetEdgeWidth + TRON_RUNNER_SIDEWALK_INSET);
  const padStartZ = THREE.MathUtils.clamp(anchorZ - GRID_BLOCK * 1.6, padMinZ + 2, padMaxZ - 2);
  const padEndZ = THREE.MathUtils.clamp(anchorZ - GRID_BLOCK * 6.2, padMinZ + 2, padMaxZ - 2);
  const zA = Math.abs(padStartZ - padEndZ) > 4 ? padStartZ : THREE.MathUtils.clamp(padMaxZ - 3, minZ, maxZ);
  const zB = Math.abs(padStartZ - padEndZ) > 4 ? padEndZ : THREE.MathUtils.clamp(padMinZ + 3, minZ, maxZ);
  return {
    mode: 'sidewalk-line',
    x,
    zA,
    zB,
    padZ: sidewalkRecord?.mesh.position.z ?? null,
  };
}

function fitTronRunnerModel(model) {
  fitTronRunnerModelCore(model, TRON_RUNNER_TARGET_HEIGHT);
}

function loadTronRunnerGltf() {
  return new Promise((resolve, reject) => {
    new RunnerGLTFLoader().load(TRON_RUNNER_MODEL_URL, resolve, undefined, reject);
  });
}

function switchTronRunnerAction(next, previous) {
  return switchTronRunnerActionCore({
    next,
    previous,
    effectiveTimeScale: tronRunnerEffectiveAnimationSpeed(),
    fadeSeconds: 0.16,
  });
}

function playTronRunnerAction(kind = 'run') {
  const actionName = tronRunnerParts.actionNames?.[kind] || tronRunnerParts.actionNames?.idle;
  const next = actionName ? tronRunnerParts.actions?.[actionName] : null;
  tronRunnerParts.activeAction = switchTronRunnerAction(next, tronRunnerParts.activeAction);
  const reflectionActionName = tronRunnerParts.reflectionActionNames?.[kind] || tronRunnerParts.reflectionActionNames?.idle;
  const reflectionNext = reflectionActionName ? tronRunnerParts.reflectionActions?.[reflectionActionName] : null;
  tronRunnerParts.reflectionActiveAction = switchTronRunnerAction(reflectionNext, tronRunnerParts.reflectionActiveAction);
  const reflectionLedActionName = tronRunnerParts.reflectionLedActionNames?.[kind] || tronRunnerParts.reflectionLedActionNames?.idle;
  const reflectionLedNext = reflectionLedActionName ? tronRunnerParts.reflectionLedActions?.[reflectionLedActionName] : null;
  tronRunnerParts.reflectionLedActiveAction = switchTronRunnerAction(reflectionLedNext, tronRunnerParts.reflectionLedActiveAction);
  tronRunnerState.clip = actionName || reflectionActionName || '';
  tronRunnerState.action = kind === 'run' ? 'Run' : kind === 'walk' ? 'Walk' : 'Idle';
}

async function loadTronRunner() {
  if (!TRON_RUNNER_ENABLED || !RunnerGLTFLoader) {
    tronRunnerState.error = RunnerGLTFLoader ? '' : 'GLTF loader unavailable';
    return false;
  }
  const route = tronRunnerRouteSpec();
  tronRunnerState.route = route;
  tronRunnerState.doorHalfHeight = tronRunnerDoorHalfHeight();
  tronRunnerState.surfaceY = tronRunnerSurfaceYAt(route.x, route.zA);
  resetTronRunnerAutonomy({
    autonomy: tronRunnerAutonomy,
    footstepBus: FOOTSTEP_NPC_SPATIAL_BUS,
  });
  updateTronRunnerAutonomyState(route);
  try {
    const sourceReflectionNeeded = TRON_RUNNER_SOURCE_CHARACTER_VISIBLE && TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED;
    const [gltf, reflectionGltf] = await Promise.all([
      loadTronRunnerGltf(),
      sourceReflectionNeeded ? loadTronRunnerGltf() : Promise.resolve(null),
    ]);
    tronRunnerWalker.clear();
    const model = gltf.scene;
    model.name = 'soldier-rigged-runner-city';
    model.rotation.y = Math.PI;
    tronRunnerParts.materials = [];
    tronRunnerParts.reflectionMaterials = [];
    tronRunnerParts.reflectionBodyMaterials = [];
    tronRunnerParts.reflectionLedMaterials = [];
    tronRunnerParts.realShadowCasterCount = 0;
    tronRunnerParts.dynamicReflectionMeshCount = 0;
    tronRunnerParts.dynamicReflectionLedMeshCount = 0;
    tronRunnerParts.revealScan = null;
    model.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.frustumCulled = false;
      obj.castShadow = TRON_RUNNER_REAL_SHADOW_ENABLED;
      obj.receiveShadow = false;
      obj.layers.enable(TRON_RUNNER_REAL_SHADOW_LAYER);
      if (TRON_RUNNER_REAL_SHADOW_ENABLED) tronRunnerParts.realShadowCasterCount += 1;
      obj.material = tronRunnerSuitMat.clone();
      tronRunnerParts.materials.push(obj.material);
    });
    fitTronRunnerModel(model);
    tronRunnerWalker.add(model);
    const revealScan = makeTronRunnerRevealScan();
    tronRunnerWalker.add(revealScan);

    let reflectionGroup = null;
    let reflectionModel = null;
    let reflectionLedModel = null;
    let reflectionMixer = null;
    let reflectionLedMixer = null;
    let reflectionActionSet = { actions: {}, actionNames: null };
    let reflectionLedActionSet = { actions: {}, actionNames: null };
    if (reflectionGltf?.scene) {
      reflectionGroup = new THREE.Group();
      reflectionGroup.name = 'tron-runner-dynamic-reflection';
      reflectionGroup.position.y = TRON_RUNNER_DYNAMIC_REFLECTION_Y;
      reflectionGroup.scale.set(1, -TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE, 1);
      reflectionGroup.visible = false;
      reflectionModel = reflectionGltf.scene;
      reflectionModel.name = 'soldier-rigged-runner-city-reflection';
      reflectionModel.rotation.y = Math.PI;
      fitTronRunnerModel(reflectionModel);
      reflectionLedModel = cloneRunnerSkeleton
        ? cloneRunnerSkeleton(reflectionModel)
        : reflectionModel.clone(true);
      reflectionLedModel.name = 'soldier-rigged-runner-city-reflection-led';
      reflectionModel.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.frustumCulled = false;
        obj.castShadow = false;
        obj.receiveShadow = false;
        obj.renderOrder = TRON_RUNNER_DYNAMIC_REFLECTION_BODY_RENDER_ORDER;
        obj.material = makeTronRunnerReflectionBodyMaterial();
        tronRunnerParts.reflectionMaterials.push(obj.material);
        tronRunnerParts.reflectionBodyMaterials.push(obj.material);
        tronRunnerParts.dynamicReflectionMeshCount += 1;
      });
      reflectionLedModel.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.frustumCulled = false;
        obj.castShadow = false;
        obj.receiveShadow = false;
        obj.renderOrder = TRON_RUNNER_DYNAMIC_REFLECTION_LED_RENDER_ORDER;
        obj.material = makeTronRunnerReflectionLedMaterial();
        tronRunnerParts.reflectionMaterials.push(obj.material);
        tronRunnerParts.reflectionLedMaterials.push(obj.material);
        tronRunnerParts.dynamicReflectionLedMeshCount += 1;
      });
      reflectionGroup.add(reflectionModel);
      reflectionGroup.add(reflectionLedModel);
      tronRunnerWalker.add(reflectionGroup);
      reflectionMixer = new THREE.AnimationMixer(reflectionModel);
      reflectionLedMixer = new THREE.AnimationMixer(reflectionLedModel);
      reflectionActionSet = makeTronRunnerActionSet(reflectionGltf, reflectionMixer);
      reflectionLedActionSet = makeTronRunnerActionSet(reflectionGltf, reflectionLedMixer);
    }

    const groundShadow = new THREE.Mesh(new THREE.CircleGeometry(1.15, 48), tronRunnerShadowMat);
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.set(0, 0.025, 0.2);
    groundShadow.scale.set(1, TRON_RUNNER_CONTACT_SHADOW_ROUNDNESS, 1);
    tronRunnerWalker.add(groundShadow);

    const realShadowReceiver = new THREE.Mesh(
      new THREE.CircleGeometry(TRON_RUNNER_REAL_SHADOW_RECEIVER_RADIUS, 72),
      tronRunnerRealShadowMat.clone()
    );
    realShadowReceiver.name = 'tron-runner-real-shadow-receiver';
    realShadowReceiver.rotation.x = -Math.PI / 2;
    realShadowReceiver.position.set(0, 0.012, 0.2);
    realShadowReceiver.receiveShadow = TRON_RUNNER_REAL_SHADOW_ENABLED;
    realShadowReceiver.castShadow = false;
    realShadowReceiver.depthWrite = false;
    realShadowReceiver.renderOrder = 3;
    realShadowReceiver.layers.enable(TRON_RUNNER_REAL_SHADOW_LAYER);
    tronRunnerWalker.add(realShadowReceiver);

    const mixer = new THREE.AnimationMixer(model);
    const actionSet = makeTronRunnerActionSet(gltf, mixer);
    tronRunnerParts.actionNames = actionSet.actionNames;
    tronRunnerParts.model = model;
    tronRunnerParts.mixer = mixer;
    tronRunnerParts.actions = actionSet.actions;
    tronRunnerParts.skeletonGlow = null;
    tronRunnerParts.groundShadow = groundShadow;
    tronRunnerParts.realShadowReceiver = realShadowReceiver;
    tronRunnerParts.reflectionGroup = reflectionGroup;
    tronRunnerParts.reflectionModel = reflectionModel;
    tronRunnerParts.reflectionLedModel = reflectionLedModel;
    tronRunnerParts.reflectionMixer = reflectionMixer;
    tronRunnerParts.reflectionLedMixer = reflectionLedMixer;
    tronRunnerParts.reflectionActions = reflectionActionSet.actions;
    tronRunnerParts.reflectionLedActions = reflectionLedActionSet.actions;
    tronRunnerParts.reflectionActionNames = reflectionActionSet.actionNames;
    tronRunnerParts.reflectionLedActionNames = reflectionLedActionSet.actionNames;
    tronRunnerParts.reflectionActiveAction = null;
    tronRunnerParts.reflectionLedActiveAction = null;
    tronRunnerParts.realShadowLight = tronRunnerRealShadowLight;
    tronRunnerParts.realShadowTarget = tronRunnerRealShadowTarget;
    tronRunnerParts.revealScan = revealScan;
    tronRunnerParts.keyLight = null;
    tronRunnerParts.leftRim = null;
    tronRunnerParts.rightRim = null;
    tronRunnerParts.lowFill = null;
	    playTronRunnerAction('walk');
	    applyTronRunnerVisualControls();
	    buildTronRunnerCrowd(model, gltf.animations);
	    buildTronRunnerIdleCharacter(model);

		    tronRunnerElapsed = 0;
	    tronRunnerVisualDistanceWalked = 0;
	    tronRunnerYaw = 0;
    tronRunnerState.ready = true;
    tronRunnerState.loaded = 1;
    tronRunnerState.error = '';
    resetTronRunnerRevealState();
    updateTronRunner(0);
    return true;
  } catch (error) {
    tronRunnerWalker.visible = false;
    tronRunnerState.ready = false;
    tronRunnerState.error = error?.message || String(error);
    console.warn('[tron-runner]', tronRunnerState.error);
    return false;
  }
}

function updateTronRunner(dt) {
  if (!tronRunnerState.ready && !tronRunnerParts.model) return;
  tronRunnerElapsed += Math.min(dt, 0.05);
  const route = tronRunnerState.route || tronRunnerRouteSpec();
  let x = route.x;
  let z = route.zA;
  let directionX = 0;
  let directionZ = 1;
  let movedDistance = 0;
  let collision = false;
  if (route.mode === 'free-roam') {
    const next = updateTronRunnerFreeRoam(dt, route);
    if (next) {
      x = next.x;
      z = next.z;
      directionX = next.directionX;
      directionZ = next.directionZ;
      movedDistance = next.movedDistance;
      collision = next.collision;
    }
  } else {
    const span = Math.max(1, Math.abs(route.zA - route.zB));
    const loopDistance = span * 2;
    const phase = ((TRON_RUNNER_ROUTE_OFFSET + tronRunnerElapsed * tronRunnerWalkSpeed / loopDistance) % 1 + 1) % 1;
    const forwardLeg = phase < 0.5;
    const t = forwardLeg ? phase * 2 : (1 - phase) * 2;
    z = THREE.MathUtils.lerp(route.zA, route.zB, t);
    directionZ = route.zB >= route.zA
      ? (forwardLeg ? 1 : -1)
      : (forwardLeg ? -1 : 1);
    movedDistance = Math.hypot(x - tronRunnerWalker.position.x, z - tronRunnerWalker.position.z);
  }
  tronRunnerTargetYaw = Math.atan2(directionX, directionZ);
  tronRunnerYaw = lerpAngle(tronRunnerYaw, tronRunnerTargetYaw, Math.min(1, dt * 9));
  tronRunnerWalker.position.set(x, tronRunnerSurfaceYAt(x, z), z);
  tronRunnerWalker.rotation.set(0, tronRunnerYaw, 0);
  if (TRON_RUNNER_DISTANCE_DRIVEN_WALK_ENABLED && tronRunnerParts.activeAction) {
    tronRunnerVisualDistanceWalked += movedDistance;
    syncTronRunnerActionSetToDistance(tronRunnerVisualDistanceWalked);
  } else {
    tronRunnerParts.mixer?.update(dt);
    tronRunnerParts.reflectionMixer?.update(dt);
    tronRunnerParts.reflectionLedMixer?.update(dt);
  }
  if (tronRunnerState.distanceDrivenWalk) {
    tronRunnerState.distanceDrivenWalk.visualDistance = Number(tronRunnerVisualDistanceWalked.toFixed(3));
  }
  updateTronRunnerAutonomyFootsteps(movedDistance, dt);
  updateTronRunnerAutonomyState(route, movedDistance, collision);
  updateTronRunnerRealShadowRig();
  updateTronRunnerDynamicReflection();

  if (tronRunnerParts.groundShadow) {
    if (!TRON_RUNNER_GROUND_SHADOW_ENABLED) {
      tronRunnerParts.groundShadow.visible = false;
      tronRunnerParts.groundShadow.material.userData.tronRunnerBaseOpacity = 0;
      tronRunnerParts.groundShadow.material.opacity = 0;
      return;
    }
    const phasePulse = tronRunnerElapsed * 4.65;
    const c = Math.cos(phasePulse);
    const shadowPulse = 1 + (1 - Math.abs(c)) * THREE.MathUtils.clamp(tronRunnerShadowPulse, 0, 1.5);
    const groundShadowOpacity = THREE.MathUtils.clamp(
      tronRunnerFloorReflection * 0.78 * shadowPulse,
      0,
      TRON_RUNNER_CONTACT_SHADOW_MAX_OPACITY
    );
    tronRunnerParts.groundShadow.material.userData.tronRunnerBaseOpacity = groundShadowOpacity;
    tronRunnerParts.groundShadow.material.opacity = groundShadowOpacity;
  }
}

function tronRunnerInspect() {
  if (tronRunnerParts.model) {
    tronRunnerBox.setFromObject(tronRunnerWalker);
    tronRunnerBox.getSize(tronRunnerSize);
  } else {
    tronRunnerSize.set(0, 0, 0);
  }
  const runnerMaterial = tronRunnerParts.materials[0] || null;
  const realShadowMaterial = tronRunnerParts.realShadowReceiver?.material || null;
  const realShadowReceiverType = realShadowMaterial?.isShadowMaterial || realShadowMaterial?.type === 'ShadowMaterial'
    ? 'shadow-material'
    : null;
  const groundShadowScaleX = tronRunnerParts.groundShadow?.scale?.x ?? 0;
  const groundShadowScaleZ = tronRunnerParts.groundShadow?.scale?.y ?? 0;
  return {
    ...tronRunnerState,
    x: Number(tronRunnerWalker.position.x.toFixed(2)),
    y: Number(tronRunnerWalker.position.y.toFixed(2)),
    z: Number(tronRunnerWalker.position.z.toFixed(2)),
    yaw: Number(tronRunnerYaw.toFixed(3)),
    visible: tronRunnerWalker.visible,
    sourceCharacterVisible: TRON_RUNNER_SOURCE_CHARACTER_VISIBLE,
    groundShadowVisible: Boolean(tronRunnerParts.groundShadow?.visible),
    groundShadowOpacity: Number((tronRunnerParts.groundShadow?.material?.opacity ?? 0).toFixed(3)),
    groundShadowScaleX: Number(groundShadowScaleX.toFixed(3)),
    groundShadowScaleZ: Number(groundShadowScaleZ.toFixed(3)),
    contactShadowRoundness: groundShadowScaleX > 0
      ? Number((groundShadowScaleZ / groundShadowScaleX).toFixed(3))
      : 0,
    shadowMapEnabled: Boolean(renderer.shadowMap?.enabled),
    shadowMapType: renderer.shadowMap?.type ?? null,
    realShadowEnabled: TRON_RUNNER_REAL_SHADOW_ENABLED,
    realShadowReceiverType,
    realShadowReceiverGeometryType: tronRunnerParts.realShadowReceiver?.geometry?.type ?? null,
    realShadowReceiverRadius: TRON_RUNNER_REAL_SHADOW_RECEIVER_RADIUS,
    realShadowReceiverVisible: Boolean(tronRunnerParts.realShadowReceiver?.visible),
    realShadowReceiverOpacity: Number((tronRunnerParts.realShadowReceiver?.material?.opacity ?? 0).toFixed(3)),
    realShadowLightCastShadow: Boolean(tronRunnerParts.realShadowLight?.castShadow),
    realShadowLightVisible: Boolean(tronRunnerParts.realShadowLight?.visible),
    realShadowLightIntensity: Number((tronRunnerParts.realShadowLight?.intensity ?? 0).toFixed(3)),
    realShadowMapSize: tronRunnerParts.realShadowLight?.shadow?.mapSize?.x ?? 0,
    realShadowCasterCount: tronRunnerParts.realShadowCasterCount,
    dynamicReflection: {
      enabled: TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
      visible: Boolean(tronRunnerParts.reflectionGroup?.visible),
      opacity: Number((tronRunnerState.dynamicReflectionOpacity ?? 0).toFixed(3)),
      bodyOpacity: Number((tronRunnerState.dynamicReflectionBodyOpacity ?? 0).toFixed(3)),
      ledOpacity: Number((tronRunnerState.dynamicReflectionLedOpacity ?? 0).toFixed(3)),
      surface: tronRunnerState.dynamicReflectionSurface,
      meshCount: tronRunnerParts.dynamicReflectionMeshCount,
      ledMeshCount: tronRunnerParts.dynamicReflectionLedMeshCount,
      animated: Boolean(tronRunnerParts.reflectionMixer && tronRunnerParts.reflectionLedMixer),
      yScale: TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE,
    },
    suitColorHex: runnerMaterial?.color?.getHexString?.() ?? null,
    suitEmissiveHex: runnerMaterial?.emissive?.getHexString?.() ?? null,
    suitEmissiveIntensity: Number((runnerMaterial?.emissiveIntensity ?? 0).toFixed(3)),
    suitTextureMode: TRON_RUNNER_SUIT_TEXTURE_MODE,
    suitMapEnabled: Boolean(runnerMaterial?.map?.isTexture),
    suitEmissiveMapEnabled: Boolean(runnerMaterial?.emissiveMap?.isTexture),
    ledStripCount: 0,
    ledStripIntensity: 0,
    modelLineIntensity: Number((tronRunnerState.modelLineIntensity ?? 0).toFixed(3)),
    skeletonHelperPresent: Boolean(tronRunnerParts.skeletonGlow),
    skeletonHelperVisible: Boolean(tronRunnerParts.skeletonGlow?.visible),
    keyLightLayerMask: null,
    modelLightLayerEnabled: false,
    pointLightCount: [
      tronRunnerParts.keyLight,
      tronRunnerParts.leftRim,
      tronRunnerParts.rightRim,
      tronRunnerParts.lowFill,
    ].filter(Boolean).length,
    heightFromRoad: Number((tronRunnerWalker.position.y - roadTileTopY()).toFixed(2)),
    surface: tronRunnerState.surface,
    sizeX: Number(tronRunnerSize.x.toFixed(2)),
    sizeY: Number(tronRunnerSize.y.toFixed(2)),
    sizeZ: Number(tronRunnerSize.z.toFixed(2)),
  };
}

// ---------- Exact boulevard elevated links, rendered with demo-5 cubemap materials ----------
function bridgeSpanLength(nextSideWidthScale = sideBuildingWidthScale, width = streetEdgeWidth) {
  return 2 * (roadHalf() + width + SIDE_BUILDING_BASE * nextSideWidthScale / 2);
}

function updateBridgeLinks(nextSideWidthScale, nextSideSpacingScale, nextStreetEdgeWidth, nextXOffset, nextZOffset, nextYOffset, nextSpanScale, nextHeightScale, nextDepthScale) {
  bridgeXOffset = nextXOffset;
  bridgeZOffset = nextZOffset;
  bridgeYOffset = nextYOffset;
  bridgeSpanScale = nextSpanScale;
  bridgeHeightScale = nextHeightScale;
  bridgeDepthScale = nextDepthScale;
  const span = bridgeSpanLength(nextSideWidthScale, nextStreetEdgeWidth);
  for (const record of bridgeRecords) {
    const visible = readBridgeVisible(record);
    record.visible = visible;
    record.mesh.position.set(
      bridgeXOffset + readBridgeNumber(record, 'xOffset'),
      record.baseY + bridgeYOffset + readBridgeNumber(record, 'yOffset'),
      record.zFactor * SIDE_BUILDING_SPACING * nextSideSpacingScale + bridgeZOffset + readBridgeNumber(record, 'zOffset')
    );
    record.mesh.scale.set(
      (span / record.baseWidth) * bridgeSpanScale * readBridgeNumber(record, 'spanScale'),
      bridgeHeightScale * readBridgeNumber(record, 'heightScale'),
      bridgeDepthScale * readBridgeNumber(record, 'depthScale')
    );
    record.mesh.visible = visible;
  }
  updateBridgeControlOutputs();
}

function addPortalFrame(z) {
  const heroPortal = Math.abs(z - GRID_BLOCK * 4) < 0.1;
  const linkWidth = bridgeSpanLength();
  const linkBaseY = GRID_BLOCK * (heroPortal ? 7.4 : 6.2);
  const linkHeight = GRID_BLOCK * (heroPortal ? 1.18 : 0.92);
  const depth = GRID_BLOCK * (heroPortal ? 2.15 : 1.64);
  const linkMat = createWetAsphaltFacadeMaterial(PAL.buildingSkin, 1.3);

  const chamfer = 1.6;
  const link = new THREE.Mesh(makeChamferedBox(linkWidth, linkHeight, depth, chamfer), linkMat);
  link.position.set(0, linkBaseY, z);
  overlayGroup.add(link);
  bridgeMaterials.push(linkMat);
  const record = {
    index: bridgeRecords.length,
    mesh: link,
    visible: true,
    baseZ: z,
    zFactor: z / SIDE_BUILDING_SPACING,
    baseY: linkBaseY,
    baseWidth: linkWidth,
    baseHeight: linkHeight,
    baseDepth: depth,
  };
  bridgeRecords.push(record);
  addBuildingEdges(overlayGroup, linkWidth, linkHeight, depth, 0, linkBaseY, z, PAL.tealLight, chamfer * 0.6, 'bridge', { bridgeRecord: record });
}

[-144, -48, 48, 144].forEach((z) => addPortalFrame(z));

// (Ground rungs / spine strips removed — replaced by roadEdge tubes + clean median above)

initStaticCityCulling({
  camera,
  sideBuildingRecords,
  mainBuildingRecords,
  bridgeRecords,
  cityDepartmentBoards: getCityDepartmentBoards(),
  cityRoleBoards: getCityRoleBoards(),
  edgeStripSpecs,
  horizontalBuildingLedRings,
  basePadLedBatch,
  sideDoorBatchState,
  gridBlock: GRID_BLOCK,
  departmentBoardEnabled: CITY_DEPARTMENT_BOARD_ENABLED,
  roleBoardEnabled: CITY_ROLE_BOARD_ENABLED,
  getSideDoorEnabled,
  getBasePadCurbEnabled,
  getRevealActive: () => tronRunnerRevealActive,
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

const cityRevealOverlayScene = new THREE.Scene();
const cityRevealOverlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
cityRevealOverlayCamera.position.z = 1;
const cityRevealFadeDurationMs = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : cityRevealFadeMs;
const cityRevealEffectiveDelayMs = () => cityRevealDelayMs + CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS;
const cityRevealBackplateMat = new THREE.MeshBasicMaterial({
  color: 0x000709,
  transparent: true,
  opacity: 1,
  depthTest: false,
  depthWrite: false,
  toneMapped: false,
});
const cityRevealBackplate = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), cityRevealBackplateMat);
cityRevealBackplate.frustumCulled = false;
cityRevealOverlayScene.add(cityRevealBackplate);

const cityRevealWireScene = new THREE.Scene();
const cityRevealWireGroup = new THREE.Group();
cityRevealWireScene.add(cityRevealWireGroup);
const cityRevealRoadGridScene = new THREE.Scene();
const cityRevealRoadGridGroup = new THREE.Group();
cityRevealRoadGridScene.add(cityRevealRoadGridGroup);
const cityRevealWireMaterials = [];
const cityRevealWireObjects = [];
const cityRevealRoadGridObjects = [];
const cityRevealRoadFadeObjects = [];
const cityRevealSolidObjects = [];
const cityRevealWireCullObjects = [];
const cityRevealWireCullStats = {
  total: 0,
  visible: 0,
  hidden: 0,
  wireVisible: 0,
  solidVisible: 0,
  roadFadeVisible: 0,
};
let cityRevealWireCullRevision = 0;
const cityRevealWireCullCache = {
  revision: -1,
  count: -1,
  frontZ: NaN,
  alpha: NaN,
  groupVisible: null,
};
const cityRevealRealClipPlane = new THREE.Plane(CITY_REVEAL_SWEEP_NORMAL.clone(), -cityRevealFrontZ);
const CITY_REVEAL_REAL_PREWARM_TARGET_SIZE = 4;
let cityRevealRealPrewarmTarget = null;
let cityRevealRealPrewarmStatus = 'pending';
let cityRevealRealPrewarmMs = 0;
let cityRevealRealPrewarmError = '';
const cityRevealBoundsBox = new THREE.Box3();
const cityRevealStripLineStart = new THREE.Vector3();
const cityRevealStripLineEnd = new THREE.Vector3();
let cityRevealSkyPass = null;
let cityRevealOverlayPass = null;
let cityRevealWirePass = null;
let cityRevealRoadGridPass = null;
let cityRevealWireFxaaPass = null;
let cityRevealScenePass = null;
const cityRevealWireColor = 0x62f7ff;
const cityRevealWireCoreColor = 0xe8feff;
const CITY_REVEAL_ROAD_FADE_BANDS = 8;
const CITY_REVEAL_ROAD_FADE_MAX_OPACITY = 0.42;
const CITY_REVEAL_ROAD_GRID_BASE_OPACITY = 0.58;
const CITY_REVEAL_ROAD_GRID_RENDER_ORDER = 2;
const CITY_REVEAL_ROAD_SOLID_FADE_ENABLED = false;
const CITY_REVEAL_ROAD_GRID_EXTRA_BLOCKS = 64;
const CITY_REVEAL_ROAD_GRID_PROCEDURAL = true;
const CITY_REVEAL_ROAD_GRID_FADE_BANDS = 10;
const CITY_REVEAL_ROAD_PERIMETER_EPS = 0.05;
const CITY_REVEAL_SIDEWALK_WIRE_ROAD_CLEARANCE = 0.08;
const CITY_REVEAL_ROAD_SOLID_BACKING_ENABLED = false;
const CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED = false;
const CITY_REVEAL_MAIN_BUILDING_LED_WIREFRAME_ENABLED = false;
const CITY_REVEAL_MAIN_BUILDING_SLOW_SPEED = 0.5;
const cityRevealRoadFadeMaterials = [];
const cityRevealRoadGridFadeMaterials = new Map();
let cityRevealRoadGridAlphaFactor = 1;
let cityRevealRoadGridSkippedPerimeterSegments = 0;
const cityRevealSolidMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 1,
  depthWrite: true,
  depthTest: true,
  toneMapped: false,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});

function registerCityRevealWireMaterial(material, baseOpacity) {
  material.transparent = true;
  material.opacity = baseOpacity;
  material.depthWrite = false;
  material.depthTest = true;
  material.toneMapped = false;
  material.userData.baseOpacity = baseOpacity;
  material.userData.defaultBaseOpacity = baseOpacity;
  cityRevealWireMaterials.push(material);
  return material;
}

const cityRevealWireMat = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
  color: cityRevealWireColor,
  blending: THREE.AdditiveBlending,
}), 0.62);
const cityRevealWireDimMat = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
  color: cityRevealWireColor,
  blending: THREE.NormalBlending,
}), 0.30);
const cityRevealWireCoreMat = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
  color: cityRevealWireCoreColor,
  blending: THREE.AdditiveBlending,
}), 0.42);
const cityRevealRoadGridMat = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
  color: cityRevealWireColor,
  blending: THREE.AdditiveBlending,
}), CITY_REVEAL_ROAD_GRID_BASE_OPACITY);
cityRevealRoadGridMat.userData.cityRevealRoadGridMaterial = true;
cityRevealRoadGridMat.depthTest = true;
const cityRevealScanGlow = createCityRevealScanGlow({
  wireScene: cityRevealWireScene,
  color: cityRevealWireColor,
  gridBlock: GRID_BLOCK,
  getDynamicRoadSurfaceWidth: () => dynamicRoadSurfaceWidth,
  getSideBuildingRecords: () => sideBuildingRecords,
  getMainBuildingRecords: () => mainBuildingRecords,
  getBridgeRecords: () => bridgeRecords,
  getRoadTopY: roadTileTopY,
  getState: () => ({
    wireframeEnabled: cityRevealWireframeEnabled,
    startedAt: cityRevealStartedAt,
    complete: cityRevealComplete,
    wireAlpha: cityRevealWireAlpha,
    sweepProgress: cityRevealSweepProgress,
    frontZ: cityRevealFrontZ,
  }),
});
const cityRevealRoadGridShaderMat = registerCityRevealWireMaterial(new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color(cityRevealWireColor) },
    uOpacity: { value: CITY_REVEAL_ROAD_GRID_BASE_OPACITY },
    uXSpacing: { value: GRID_BLOCK },
    uZSpacing: { value: GRID_BLOCK },
    uRoadHalfW: { value: 1 },
    uRoadMinZ: { value: -1 },
    uRoadMaxZ: { value: 1 },
    uFadeWidth: { value: 1 },
    uPerimeterEps: { value: CITY_REVEAL_ROAD_PERIMETER_EPS },
  },
  vertexShader: `
    varying vec3 vWorldPosition;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uXSpacing;
    uniform float uZSpacing;
    uniform float uRoadHalfW;
    uniform float uRoadMinZ;
    uniform float uRoadMaxZ;
    uniform float uFadeWidth;
    uniform float uPerimeterEps;
    varying vec3 vWorldPosition;

    float gridLine(vec2 coord) {
      vec2 derivative = max(fwidth(coord), vec2(0.0001));
      vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
      return 1.0 - min(min(grid.x, grid.y), 1.0);
    }

    void main() {
      vec2 gridCoord = vec2(vWorldPosition.x / uXSpacing, vWorldPosition.z / uZSpacing);
      float line = gridLine(gridCoord);
      float xOverflow = max(0.0, abs(vWorldPosition.x) - uRoadHalfW) / max(uFadeWidth, 0.001);
      float zOverflow = max(0.0, max(uRoadMinZ - vWorldPosition.z, vWorldPosition.z - uRoadMaxZ)) / max(uFadeWidth, 0.001);
      float fade = clamp(1.0 - max(xOverflow, zOverflow), 0.0, 1.0);
      float roadEdgeX = abs(abs(vWorldPosition.x) - uRoadHalfW);
      float roadEdgeZ = min(abs(vWorldPosition.z - uRoadMinZ), abs(vWorldPosition.z - uRoadMaxZ));
      float perimeterMask = smoothstep(uPerimeterEps, uPerimeterEps * 3.0, min(roadEdgeX, roadEdgeZ));
      float alpha = line * fade * perimeterMask * uOpacity;
      if (alpha <= 0.002) discard;
      gl_FragColor = vec4(uColor, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  depthTest: true,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
  extensions: { derivatives: true },
}), CITY_REVEAL_ROAD_GRID_BASE_OPACITY);
cityRevealRoadGridShaderMat.userData.cityRevealRoadGridMaterial = true;
cityRevealRoadGridShaderMat.userData.cityRevealRoadGridShaderMaterial = true;
cityRevealRoadGridShaderMat.depthTest = true;

function cityRevealRoadGridMaterialForBand(band) {
  const safeBand = THREE.MathUtils.clamp(Math.round(band), 1, CITY_REVEAL_ROAD_GRID_FADE_BANDS);
  if (safeBand >= CITY_REVEAL_ROAD_GRID_FADE_BANDS) return cityRevealRoadGridMat;
  if (!cityRevealRoadGridFadeMaterials.has(safeBand)) {
    const opacityScale = safeBand / CITY_REVEAL_ROAD_GRID_FADE_BANDS;
    const material = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
      color: cityRevealWireColor,
      blending: THREE.AdditiveBlending,
    }), CITY_REVEAL_ROAD_GRID_BASE_OPACITY * opacityScale);
    material.userData.cityRevealRoadGridMaterial = true;
    material.depthTest = true;
    cityRevealRoadGridFadeMaterials.set(safeBand, material);
  }
  return cityRevealRoadGridFadeMaterials.get(safeBand);
}

function pointsToWireGeometry(points) {
  const vertices = [];
  points.forEach((point) => vertices.push(point.x, point.y, point.z));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
}

function cityRevealSweepValueAt(z, y = 0) {
  const safeZ = Number.isFinite(z) ? z : 0;
  const safeY = Number.isFinite(y) ? y : 0;
  return safeZ - safeY;
}

function cityRevealBoxSweepBounds(centerZ, halfDepth, centerY = 0, halfHeight = 0) {
  const safeZ = Number.isFinite(centerZ) ? centerZ : 0;
  const safeY = Number.isFinite(centerY) ? centerY : 0;
  const hd = Math.abs(Number.isFinite(halfDepth) ? halfDepth : 0);
  const hh = Math.abs(Number.isFinite(halfHeight) ? halfHeight : 0);
  const values = [
    cityRevealSweepValueAt(safeZ - hd, safeY - hh),
    cityRevealSweepValueAt(safeZ + hd, safeY - hh),
    cityRevealSweepValueAt(safeZ - hd, safeY + hh),
    cityRevealSweepValueAt(safeZ + hd, safeY + hh),
  ];
  return { min: Math.min(...values), max: Math.max(...values) };
}

function setCityRevealObjectBounds(object, minZ, maxZ, minSweep = null, maxSweep = null) {
  if (!object) return object;
  const safeMin = Number.isFinite(minZ) ? minZ : 0;
  const safeMax = Number.isFinite(maxZ) ? maxZ : safeMin;
  object.userData.cityRevealMinZ = Math.min(safeMin, safeMax);
  object.userData.cityRevealMaxZ = Math.max(safeMin, safeMax);
  object.userData.cityRevealZ = (object.userData.cityRevealMinZ + object.userData.cityRevealMaxZ) * 0.5;
  const fallbackY = Number.isFinite(object.position?.y) ? object.position.y : 0;
  const fallbackMinSweep = cityRevealSweepValueAt(object.userData.cityRevealMinZ, fallbackY);
  const fallbackMaxSweep = cityRevealSweepValueAt(object.userData.cityRevealMaxZ, fallbackY);
  const safeMinSweep = Number.isFinite(minSweep) ? minSweep : Math.min(fallbackMinSweep, fallbackMaxSweep);
  const safeMaxSweep = Number.isFinite(maxSweep) ? maxSweep : Math.max(fallbackMinSweep, fallbackMaxSweep);
  object.userData.cityRevealMinSweep = Math.min(safeMinSweep, safeMaxSweep);
  object.userData.cityRevealMaxSweep = Math.max(safeMinSweep, safeMaxSweep);
  object.userData.cityRevealSweep = (object.userData.cityRevealMinSweep + object.userData.cityRevealMaxSweep) * 0.5;
  return object;
}

function setCityRevealObjectBoundsFromPoints(object, points) {
  let minZ = Infinity;
  let maxZ = -Infinity;
  let minSweep = Infinity;
  let maxSweep = -Infinity;
  for (const point of points) {
    minZ = Math.min(minZ, point.z);
    maxZ = Math.max(maxZ, point.z);
    const sweep = cityRevealSweepValueAt(point.z, point.y);
    minSweep = Math.min(minSweep, sweep);
    maxSweep = Math.max(maxSweep, sweep);
  }
  return setCityRevealObjectBounds(object, minZ, maxZ, minSweep, maxSweep);
}

function setCityRevealObjectBoxBounds(object, height, depth, y, z) {
  const halfDepth = Math.abs(Number.isFinite(depth) ? depth : 0) * 0.5;
  const sweepBounds = cityRevealBoxSweepBounds(z, halfDepth, y, Math.abs(Number.isFinite(height) ? height : 0) * 0.5);
  return setCityRevealObjectBounds(object, z - halfDepth, z + halfDepth, sweepBounds.min, sweepBounds.max);
}

function setCityRevealObjectBoundsFromBox(object, box) {
  if (!box || box.isEmpty?.()) return setCityRevealObjectBounds(object, 0, 0);
  const centerZ = (box.min.z + box.max.z) * 0.5;
  const centerY = (box.min.y + box.max.y) * 0.5;
  const sweepBounds = cityRevealBoxSweepBounds(centerZ, (box.max.z - box.min.z) * 0.5, centerY, (box.max.y - box.min.y) * 0.5);
  return setCityRevealObjectBounds(object, box.min.z, box.max.z, sweepBounds.min, sweepBounds.max);
}

function translateCityRevealObjectBounds(object, zOffset, yOffset = 0) {
  if (!object || !Number.isFinite(zOffset)) return object;
  const minZ = object.userData.cityRevealMinZ;
  const maxZ = object.userData.cityRevealMaxZ;
  const minSweep = object.userData.cityRevealMinSweep;
  const maxSweep = object.userData.cityRevealMaxSweep;
  if (!Number.isFinite(minZ) || !Number.isFinite(maxZ)) return object;
  const sweepOffset = cityRevealSweepValueAt(zOffset, yOffset);
  return setCityRevealObjectBounds(
    object,
    minZ + zOffset,
    maxZ + zOffset,
    Number.isFinite(minSweep) ? minSweep + sweepOffset : null,
    Number.isFinite(maxSweep) ? maxSweep + sweepOffset : null
  );
}

function addCityWireLineSegments(points, material = cityRevealWireMat) {
  const line = new THREE.LineSegments(pointsToWireGeometry(points), material);
  line.frustumCulled = false;
  line.userData.cityRevealCullKind = 'wire';
  setCityRevealObjectBoundsFromPoints(line, points);
  cityRevealWireGroup.add(line);
  cityRevealWireObjects.push(line);
  cityRevealWireCullObjects.push(line);
  return line;
}

function addCityRevealRoadGridLineSegments(points, material = cityRevealRoadGridMat) {
  const line = new THREE.LineSegments(pointsToWireGeometry(points), material);
  line.frustumCulled = false;
  line.renderOrder = CITY_REVEAL_ROAD_GRID_RENDER_ORDER;
  setCityRevealObjectBoundsFromPoints(line, points);
  cityRevealRoadGridGroup.add(line);
  cityRevealRoadGridObjects.push(line);
  return line;
}

function addCityWireBox(width, height, depth, x, y, z, material = cityRevealWireMat) {
  const line = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth)),
    material
  );
  line.position.set(x, y, z);
  line.frustumCulled = false;
  line.userData.cityRevealCullKind = 'wire';
  setCityRevealObjectBoxBounds(line, height, depth, y, z);
  cityRevealWireGroup.add(line);
  cityRevealWireObjects.push(line);
  cityRevealWireCullObjects.push(line);
  return line;
}

function addCityWireSolidBox(width, height, depth, x, y, z, role = 'solid') {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), cityRevealSolidMat);
  mesh.position.set(x, y, z);
  mesh.frustumCulled = false;
  mesh.userData.cityRevealCullKind = 'solid';
  mesh.userData.cityRevealRole = role;
  setCityRevealObjectBoxBounds(mesh, height, depth, y, z);
  cityRevealWireGroup.add(mesh);
  cityRevealSolidObjects.push(mesh);
  cityRevealWireCullObjects.push(mesh);
  return mesh;
}

function cityRevealRoadFadeMaterial(index) {
  if (!cityRevealRoadFadeMaterials[index]) {
    const t = 1 - index / Math.max(1, CITY_REVEAL_ROAD_FADE_BANDS);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: CITY_REVEAL_ROAD_FADE_MAX_OPACITY * t * t,
      depthWrite: true,
      depthTest: true,
      toneMapped: false,
    });
    cityRevealRoadFadeMaterials[index] = material;
  }
  return cityRevealRoadFadeMaterials[index];
}

function addCityWireRoadFadeBox(width, height, depth, x, y, z, bandIndex) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), cityRevealRoadFadeMaterial(bandIndex));
  mesh.position.set(x, y, z);
  mesh.frustumCulled = false;
  mesh.userData.cityRevealCullKind = 'road-fade';
  mesh.userData.cityRevealRole = 'road-fade';
  setCityRevealObjectBoxBounds(mesh, height, depth, y, z);
  cityRevealWireGroup.add(mesh);
  cityRevealRoadFadeObjects.push(mesh);
  cityRevealWireCullObjects.push(mesh);
  return mesh;
}

function tagCityRevealWireObject(object, role) {
  if (object) object.userData.cityRevealRole = role;
  return object;
}

function addCityWireStripCenterline(spec, material = cityRevealWireDimMat) {
  if (!spec?.mesh?.visible || !spec.mesh.geometry) return null;
  const geometry = spec.mesh.geometry;
  let length = Number(geometry.parameters?.depth);
  if (!Number.isFinite(length) || length <= 0) {
    geometry.computeBoundingBox();
    length = Math.abs((geometry.boundingBox?.max.z ?? 0) - (geometry.boundingBox?.min.z ?? 0));
  }
  if (!Number.isFinite(length) || length <= 0) return null;

  spec.mesh.updateWorldMatrix(true, false);
  cityRevealStripLineStart.set(0, 0, -length * 0.5).applyMatrix4(spec.mesh.matrixWorld);
  cityRevealStripLineEnd.set(0, 0, length * 0.5).applyMatrix4(spec.mesh.matrixWorld);
  const line = addCityWireLineSegments([
    cityRevealStripLineStart.clone(),
    cityRevealStripLineEnd.clone(),
  ], material);
  return tagCityRevealWireObject(line, `${spec.edgeRole || 'edge'}-led-wire`);
}

function addCityWireBoxDensity(width, height, depth, x, y, z, material = cityRevealWireDimMat) {
  if (cityRevealWireframeDensity < 2) return null;
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;
  if (![hw, hh, hd].every((value) => Number.isFinite(value) && value > 0)) return null;
  const points = [];
  const push = (a, b) => {
    points.push(new THREE.Vector3(a[0], a[1], a[2]), new THREE.Vector3(b[0], b[1], b[2]));
  };
  for (let index = 1; index < cityRevealWireframeDensity; index += 1) {
    const x = -hw + width * (index / cityRevealWireframeDensity);
    const yMid = -hh + height * (index / cityRevealWireframeDensity);
    const z = -hd + depth * (index / cityRevealWireframeDensity);
    [-hd, hd].forEach((zSide) => {
      push([x, -hh, zSide], [x, hh, zSide]);
      push([-hw, yMid, zSide], [hw, yMid, zSide]);
    });
    [-hw, hw].forEach((xSide) => {
      push([xSide, -hh, z], [xSide, hh, z]);
      push([xSide, yMid, -hd], [xSide, yMid, hd]);
    });
    [-hh, hh].forEach((ySide) => {
      push([-hw, ySide, z], [hw, ySide, z]);
      push([x, ySide, -hd], [x, ySide, hd]);
    });
  }

  const line = addCityWireLineSegments(points, material);
  line.position.set(x, y, z);
  translateCityRevealObjectBounds(line, z, y);
  return tagCityRevealWireObject(line, 'wire-density');
}

function addCityWireLoop(points, y, xOffset = 0, zOffset = 0, material = cityRevealWireDimMat) {
  if (!points?.length) return null;
  const segments = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    segments.push(
      new THREE.Vector3(xOffset + a[0], y, zOffset + a[1]),
      new THREE.Vector3(xOffset + b[0], y, zOffset + b[1])
    );
  }
  return addCityWireLineSegments(segments, material);
}

function addCityWireLoopDensity(points, y, xOffset = 0, zOffset = 0, material = cityRevealWireDimMat) {
  if (cityRevealWireframeDensity < 2 || !points?.length) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point[0]);
    maxX = Math.max(maxX, point[0]);
    minZ = Math.min(minZ, point[1]);
    maxZ = Math.max(maxZ, point[1]);
  }
  if (![minX, maxX, minZ, maxZ].every(Number.isFinite)) return null;
  const segments = [];
  for (let index = 1; index < cityRevealWireframeDensity; index += 1) {
    const x = minX + (maxX - minX) * (index / cityRevealWireframeDensity);
    const z = minZ + (maxZ - minZ) * (index / cityRevealWireframeDensity);
    segments.push(
      new THREE.Vector3(xOffset + x, y, zOffset + minZ),
      new THREE.Vector3(xOffset + x, y, zOffset + maxZ),
      new THREE.Vector3(xOffset + minX, y, zOffset + z),
      new THREE.Vector3(xOffset + maxX, y, zOffset + z)
    );
  }
  const line = addCityWireLineSegments(segments, material);
  return tagCityRevealWireObject(line, 'wire-density');
}

function addCityWireGroundSegment(a, b, y, material = cityRevealRoadGridMat) {
  return addCityWireLineSegments([
    new THREE.Vector3(a[0], y, a[1]),
    new THREE.Vector3(b[0], y, b[1]),
  ], material);
}

function cityRevealRoadGridExtraWidth() {
  return GRID_BLOCK * CITY_REVEAL_ROAD_GRID_EXTRA_BLOCKS;
}

function cityRevealRoadGridHalfWidth() {
  return dynamicRoadSurfaceWidth / 2 + cityRevealRoadGridExtraWidth();
}

function cityRevealRoadGridBounds() {
  const roadHalfW = dynamicRoadSurfaceWidth / 2;
  const roadMinZ = dynamicRoadCenter - dynamicRoadLength / 2;
  const roadMaxZ = dynamicRoadCenter + dynamicRoadLength / 2;
  const extra = cityRevealRoadGridExtraWidth();
  return {
    roadHalfW,
    roadMinZ,
    roadMaxZ,
    gridHalfW: roadHalfW + extra,
    gridMinZ: roadMinZ - extra,
    gridMaxZ: roadMaxZ + extra,
    fadeWidth: Math.max(0.001, extra),
  };
}

function cityRevealRoadGridFadeAt(x, z, bounds) {
  const xOverflow = Math.max(0, Math.abs(x) - bounds.roadHalfW) / bounds.fadeWidth;
  const zOverflow = Math.max(0, bounds.roadMinZ - z, z - bounds.roadMaxZ) / bounds.fadeWidth;
  return THREE.MathUtils.clamp(1 - Math.max(xOverflow, zOverflow), 0, 1);
}

function cityRevealRoadGridSegmentTouchesRoadPerimeter(a, b, bounds) {
  const midX = (a[0] + b[0]) * 0.5;
  const midZ = (a[1] + b[1]) * 0.5;
  const verticalRoadEdge = Math.abs(Math.abs(midX) - bounds.roadHalfW) <= CITY_REVEAL_ROAD_PERIMETER_EPS;
  const horizontalRoadEdge = Math.abs(midZ - bounds.roadMinZ) <= CITY_REVEAL_ROAD_PERIMETER_EPS || Math.abs(midZ - bounds.roadMaxZ) <= CITY_REVEAL_ROAD_PERIMETER_EPS;
  return verticalRoadEdge || horizontalRoadEdge;
}

function cityRevealRoadGridStops(min, max, spacing) {
  const stops = [min];
  const first = Math.ceil(min / spacing) * spacing;
  for (let value = first; value < max - 0.001; value += spacing) {
    if (value > min + 0.001) stops.push(value);
  }
  stops.push(max);
  return stops;
}

function addCityRevealRoadGridSegment(buckets, a, b, y, bounds) {
  if (cityRevealRoadGridSegmentTouchesRoadPerimeter(a, b, bounds)) {
    cityRevealRoadGridSkippedPerimeterSegments += 1;
    return;
  }
  const midX = (a[0] + b[0]) * 0.5;
  const midZ = (a[1] + b[1]) * 0.5;
  const fade = cityRevealRoadGridFadeAt(midX, midZ, bounds);
  if (fade <= 0.02) return;
  const band = THREE.MathUtils.clamp(Math.ceil(fade * CITY_REVEAL_ROAD_GRID_FADE_BANDS), 1, CITY_REVEAL_ROAD_GRID_FADE_BANDS);
  if (!buckets.has(band)) buckets.set(band, []);
  buckets.get(band).push(
    new THREE.Vector3(a[0], y, a[1]),
    new THREE.Vector3(b[0], y, b[1])
  );
}

function addCityRevealRoadFade(y) {
  if (!CITY_REVEAL_ROAD_SOLID_FADE_ENABLED) return;
  if (cityRevealRoadGridExtraWidth() <= 0) return;
  const bounds = cityRevealRoadGridBounds();
  const fadeWidth = bounds.fadeWidth / CITY_REVEAL_ROAD_FADE_BANDS;
  const fadeY = y - 0.055;
  const fadeHeight = 0.08;

  for (let index = 0; index < CITY_REVEAL_ROAD_FADE_BANDS; index += 1) {
    const offset = fadeWidth * (index + 0.5);
    const sideWidth = fadeWidth;
    const sideDepth = dynamicRoadLength;
    const endWidth = dynamicRoadSurfaceWidth + fadeWidth * 2 * (index + 1);
    const endDepth = fadeWidth;
    addCityWireRoadFadeBox(sideWidth, fadeHeight, sideDepth, -(bounds.roadHalfW + offset), fadeY, dynamicRoadCenter, index);
    addCityWireRoadFadeBox(sideWidth, fadeHeight, sideDepth, bounds.roadHalfW + offset, fadeY, dynamicRoadCenter, index);
    addCityWireRoadFadeBox(endWidth, fadeHeight, endDepth, 0, fadeY, bounds.roadMinZ - offset, index);
    addCityWireRoadFadeBox(endWidth, fadeHeight, endDepth, 0, fadeY, bounds.roadMaxZ + offset, index);
  }
}

function updateCityRevealRoadGridShaderUniforms(bounds) {
  const density = Math.max(1, cityRevealWireframeDensity);
  cityRevealRoadGridShaderMat.uniforms.uOpacity.value = cityRevealRoadGridShaderMat.opacity;
  cityRevealRoadGridShaderMat.uniforms.uXSpacing.value = (GRID_BLOCK * 1.5) / density;
  cityRevealRoadGridShaderMat.uniforms.uZSpacing.value = (GRID_BLOCK * 3) / density;
  cityRevealRoadGridShaderMat.uniforms.uRoadHalfW.value = bounds.roadHalfW;
  cityRevealRoadGridShaderMat.uniforms.uRoadMinZ.value = bounds.roadMinZ;
  cityRevealRoadGridShaderMat.uniforms.uRoadMaxZ.value = bounds.roadMaxZ;
  cityRevealRoadGridShaderMat.uniforms.uFadeWidth.value = bounds.fadeWidth;
  cityRevealRoadGridShaderMat.uniforms.uPerimeterEps.value = CITY_REVEAL_ROAD_PERIMETER_EPS;
}

function addCityRevealRoadGridPlane(y) {
  const bounds = cityRevealRoadGridBounds();
  const width = bounds.gridHalfW * 2;
  const depth = bounds.gridMaxZ - bounds.gridMinZ;
  const gridY = y + 0.06;
  const gridZ = (bounds.gridMinZ + bounds.gridMaxZ) * 0.5;
  updateCityRevealRoadGridShaderUniforms(bounds);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, 1, 1), cityRevealRoadGridShaderMat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, gridY, gridZ);
  mesh.frustumCulled = false;
  mesh.renderOrder = CITY_REVEAL_ROAD_GRID_RENDER_ORDER;
  mesh.userData.cityRevealRole = 'road-grid';
  mesh.userData.cityRevealRoadGridProcedural = true;
  setCityRevealObjectBoxBounds(mesh, 0.01, depth, gridY, gridZ);
  cityRevealRoadGridGroup.add(mesh);
  cityRevealRoadGridObjects.push(mesh);
  return mesh;
}

function addCityRevealRoadGrid(y) {
  if (CITY_REVEAL_ROAD_GRID_PROCEDURAL) {
    addCityRevealRoadGridPlane(y);
    return;
  }
  const bounds = cityRevealRoadGridBounds();
  const gridY = y + 0.06;
  const density = Math.max(1, cityRevealWireframeDensity);
  const xSpacing = (GRID_BLOCK * 1.5) / density;
  const zSpacing = (GRID_BLOCK * 3) / density;
  const buckets = new Map();
  const xStops = cityRevealRoadGridStops(-bounds.gridHalfW, bounds.gridHalfW, xSpacing);
  const zStops = cityRevealRoadGridStops(bounds.gridMinZ, bounds.gridMaxZ, zSpacing);

  for (let xIndex = 1; xIndex < xStops.length - 1; xIndex += 1) {
    const x = xStops[xIndex];
    for (let zIndex = 0; zIndex < zStops.length - 1; zIndex += 1) {
      addCityRevealRoadGridSegment(buckets, [x, zStops[zIndex]], [x, zStops[zIndex + 1]], gridY, bounds);
    }
  }

  for (let zIndex = 1; zIndex < zStops.length - 1; zIndex += 1) {
    const z = zStops[zIndex];
    for (let xIndex = 0; xIndex < xStops.length - 1; xIndex += 1) {
      addCityRevealRoadGridSegment(buckets, [xStops[xIndex], z], [xStops[xIndex + 1], z], gridY, bounds);
    }
  }

  for (const [band, points] of buckets.entries()) {
    const line = addCityRevealRoadGridLineSegments(points, cityRevealRoadGridMaterialForBand(band));
    line.userData.cityRevealRoadGridFadeBand = band;
    tagCityRevealWireObject(line, 'road-grid');
  }
}

function clearCityRevealWire() {
  while (cityRevealWireGroup.children.length) {
    const object = cityRevealWireGroup.children.pop();
    object.geometry?.dispose?.();
  }
  while (cityRevealRoadGridGroup.children.length) {
    const object = cityRevealRoadGridGroup.children.pop();
    object.geometry?.dispose?.();
  }
  cityRevealWireObjects.length = 0;
  cityRevealRoadGridObjects.length = 0;
  cityRevealRoadFadeObjects.length = 0;
  cityRevealSolidObjects.length = 0;
  cityRevealWireCullObjects.length = 0;
  cityRevealWireCullStats.total = 0;
  cityRevealWireCullStats.visible = 0;
  cityRevealWireCullStats.hidden = 0;
  cityRevealWireCullStats.wireVisible = 0;
  cityRevealWireCullStats.solidVisible = 0;
  cityRevealWireCullStats.roadFadeVisible = 0;
  cityRevealRoadGridSkippedPerimeterSegments = 0;
  cityRevealWireCullRevision++;
}

function cityRevealRoadSolidTopY() {
  const roadY = roadTileTopY() + 0.18;
  return (roadY - 0.03) + 0.12 * 0.5;
}

function cityRevealSidewalkWireY(padTopY, roadY = roadTileTopY() + 0.18) {
  const surfaceY = Number.isFinite(padTopY) ? padTopY : DEFAULT_BASE_PAD_Y;
  return Math.max(surfaceY + 0.08, roadY + CITY_REVEAL_SIDEWALK_WIRE_ROAD_CLEARANCE);
}

function computeCityRevealSweepBounds() {
  const startBaseZ = Number.isFinite(playerSpawn?.z) ? playerSpawn.z : camera.position.z;
  const startZ = startBaseZ + CITY_REVEAL_SWEEP_MARGIN_Z;
  const cityMinZValues = [];

  for (const record of sideBuildingRecords) {
    cityMinZValues.push(record.collider.z - record.collider.hd);
  }
  for (const record of mainBuildingRecords) {
    cityMinZValues.push(record.collider.z - record.collider.hd);
  }
  for (const record of bridgeRecords) {
    if (!record.mesh.visible) continue;
    cityMinZValues.push(record.mesh.position.z - Math.abs(record.baseDepth * record.mesh.scale.z) * 0.5);
  }

  const finiteCityMinZ = cityMinZValues.filter(Number.isFinite);
  const fallbackEndZ = dynamicRoadCenter - dynamicRoadLength * 0.5;
  let endZ = (finiteCityMinZ.length ? Math.min(...finiteCityMinZ) : fallbackEndZ) - CITY_REVEAL_SWEEP_MARGIN_Z;
  if (!Number.isFinite(endZ) || endZ >= startZ) endZ = startZ - GRID_BLOCK;
  return { startZ, endZ };
}

function cityRevealFrontForProgress(progress) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  const warped = cityRevealWarpProgressForMainBuilding(t);
  return THREE.MathUtils.lerp(cityRevealSweepStartZ, cityRevealSweepEndZ, warped.progress);
}

function setCityRevealSweepFront(frontZ) {
  cityRevealFrontZ = Number.isFinite(frontZ) ? frontZ : cityRevealSweepEndZ;
  cityRevealRealClipPlane.normal.copy(CITY_REVEAL_SWEEP_NORMAL);
  cityRevealRealClipPlane.constant = -cityRevealFrontZ * CITY_REVEAL_SWEEP_NORMAL.z;
  cityRevealScanGlow.update();
  updateCityRevealWireObjectCulling();
}

function cityRevealMainBuildingSlowZone() {
  const record = mainBuildingRecords[0];
  const collider = record?.collider;
  if (!record?.mesh || !collider) return null;
  const boxDepth = Math.abs(Number.isFinite(collider.hd) ? collider.hd * 2 : record.baseD || MAIN_BUILDING_BASE);
  const boxHeight = Math.abs(Number.isFinite(collider.h) ? collider.h : 230);
  const centerY = (Number.isFinite(collider.y) ? collider.y : record.mesh.position.y || 0) + boxHeight * 0.5;
  const centerZ = Number.isFinite(collider.z) ? collider.z : record.mesh.position.z;
  if (![boxDepth, boxHeight, centerY, centerZ].every(Number.isFinite) || boxDepth <= 0 || boxHeight <= 0) return null;
  const bounds = cityRevealBoxSweepBounds(centerZ, boxDepth * 0.5, centerY, boxHeight * 0.5);
  return {
    low: bounds.min,
    high: bounds.max,
    centerZ,
    centerY,
    depth: boxDepth,
    height: boxHeight,
  };
}

function cityRevealWarpProgressForMainBuilding(progress) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  const total = cityRevealSweepStartZ - cityRevealSweepEndZ;
  const zone = cityRevealMainBuildingSlowZone();
  const speed = THREE.MathUtils.clamp(CITY_REVEAL_MAIN_BUILDING_SLOW_SPEED, 0.05, 1);
  if (!zone || speed >= 0.999 || !Number.isFinite(total) || total <= 0) {
    return { progress: t, active: false, zone: null };
  }

  const zoneStartDistance = THREE.MathUtils.clamp(cityRevealSweepStartZ - zone.high, 0, total);
  const zoneEndDistance = THREE.MathUtils.clamp(cityRevealSweepStartZ - zone.low, 0, total);
  const zoneDistance = zoneEndDistance - zoneStartDistance;
  if (!Number.isFinite(zoneDistance) || zoneDistance <= 0.001) {
    return { progress: t, active: false, zone: null };
  }

  const weight = 1 / speed;
  const weightedTotal = total + zoneDistance * (weight - 1);
  const weightedDistance = t * weightedTotal;
  let distance;
  if (weightedDistance <= zoneStartDistance) {
    distance = weightedDistance;
  } else if (weightedDistance <= zoneStartDistance + zoneDistance * weight) {
    distance = zoneStartDistance + (weightedDistance - zoneStartDistance) / weight;
  } else {
    distance = zoneStartDistance + zoneDistance + (weightedDistance - zoneStartDistance - zoneDistance * weight);
  }
  distance = THREE.MathUtils.clamp(distance, 0, total);
  const active = distance >= zoneStartDistance && distance <= zoneEndDistance;
  return {
    progress: distance / total,
    active,
    zone: {
      ...zone,
      startProgress: zoneStartDistance / total,
      endProgress: zoneEndDistance / total,
      speed,
      weight,
    },
  };
}

function cityRevealMainBuildingSlowDiagnostics() {
  const warped = cityRevealWarpProgressForMainBuilding(cityRevealSweepProgress);
  return {
    enabled: Boolean(warped.zone),
    active: Boolean(warped.active),
    speed: CITY_REVEAL_MAIN_BUILDING_SLOW_SPEED,
    timeScale: 1 / CITY_REVEAL_MAIN_BUILDING_SLOW_SPEED,
    zone: warped.zone,
  };
}

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

function refreshCityRevealSweepBounds() {
  const bounds = computeCityRevealSweepBounds();
  cityRevealSweepStartZ = bounds.startZ;
  cityRevealSweepEndZ = bounds.endZ;
  setCityRevealSweepFront(cityRevealFrontForProgress(cityRevealSweepProgress));
}

function cityRevealEstimatedVisibleObjects() {
  if (!cityRevealWireframeEnabled || cityRevealWireAlpha <= 0.002 || !cityRevealWireGroup.visible) return 0;
  return cityRevealWireCullStats.visible;
}

function cityRevealObjectStillWireVisible(object) {
  if (!object) return false;
  const minSweep = object.userData.cityRevealMinSweep
    ?? object.userData.cityRevealSweep
    ?? cityRevealSweepValueAt(object.userData.cityRevealMinZ ?? object.position.z, object.position.y);
  if (!Number.isFinite(minSweep)) return true;
  return minSweep < cityRevealFrontZ;
}

function updateCityRevealWireObjectCulling() {
  const count = cityRevealWireCullObjects.length;
  const groupVisible = cityRevealWireAlpha > 0.002 && cityRevealWireGroup.visible;
  const roundedFrontZ = Number(cityRevealFrontZ.toFixed(3));
  const roundedAlpha = Number(cityRevealWireAlpha.toFixed(4));
  if (
    cityRevealWireCullCache.revision === cityRevealWireCullRevision &&
    cityRevealWireCullCache.count === count &&
    cityRevealWireCullCache.frontZ === roundedFrontZ &&
    cityRevealWireCullCache.alpha === roundedAlpha &&
    cityRevealWireCullCache.groupVisible === groupVisible
  ) {
    return;
  }
  cityRevealWireCullCache.revision = cityRevealWireCullRevision;
  cityRevealWireCullCache.count = count;
  cityRevealWireCullCache.frontZ = roundedFrontZ;
  cityRevealWireCullCache.alpha = roundedAlpha;
  cityRevealWireCullCache.groupVisible = groupVisible;
  const stats = cityRevealWireCullStats;
  stats.total = count;
  stats.visible = 0;
  stats.hidden = 0;
  stats.wireVisible = 0;
  stats.solidVisible = 0;
  stats.roadFadeVisible = 0;
  for (const object of cityRevealWireCullObjects) {
    const visible = groupVisible && cityRevealObjectStillWireVisible(object);
    object.visible = visible;
    if (visible) {
      stats.visible++;
      if (object.userData.cityRevealCullKind === 'solid') stats.solidVisible++;
      else if (object.userData.cityRevealCullKind === 'road-fade') stats.roadFadeVisible++;
      else stats.wireVisible++;
    } else {
      stats.hidden++;
    }
  }
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
  getCityRevealSkyPass: () => cityRevealSkyPass,
  getCityRevealOverlayPass: () => cityRevealOverlayPass,
  getCityRevealWirePass: () => cityRevealWirePass,
  getCityRevealRoadGridPass: () => cityRevealRoadGridPass,
  getCityRevealWireFxaaPass: () => cityRevealWireFxaaPass,
  getCityRevealScenePass: () => cityRevealScenePass,
  getCityRevealMainLedRevealPass: cityRevealMainLedReveal.getPass,
  cityRevealPostRevealElapsedMs,
  cityRevealEffectiveDelayMs,
  cityRevealFadeDurationMs,
  isCityRevealRealRevealActive,
  isCityRevealMainLedRevealOverlayActive: cityRevealMainLedReveal.isOverlayActive,
  cityRevealEstimatedVisibleObjects,
  shouldUseComposer,
});

function buildCityRevealWireframe() {
  clearCityRevealWire();
  const roadY = roadTileTopY() + 0.18;
  if (CITY_REVEAL_ROAD_SOLID_BACKING_ENABLED) {
    addCityWireSolidBox(dynamicRoadSurfaceWidth, 0.12, dynamicRoadLength, 0, roadY - 0.03, dynamicRoadCenter, 'road-solid');
  }
  addCityRevealRoadFade(roadY);
  addCityWireBox(dynamicRoadSurfaceWidth, 0.08, dynamicRoadLength, 0, roadY, dynamicRoadCenter, cityRevealWireDimMat);
  addCityRevealRoadGrid(roadY);
  for (const record of sideBuildingRecords) {
    const h = record.collider.h;
    const boxWidth = record.collider.hw * 2;
    const boxDepth = record.collider.hd * 2;
    const boxY = record.collider.y + h * 0.5;
    addCityWireSolidBox(boxWidth, h, boxDepth, record.collider.x, boxY, record.collider.z);
    addCityWireBox(boxWidth, h, boxDepth, record.collider.x, boxY, record.collider.z, cityRevealWireMat);
    addCityWireBoxDensity(boxWidth, h, boxDepth, record.collider.x, boxY, record.collider.z, cityRevealWireDimMat);
    const pad = record.basePad;
    const padX = pad?.border?.position?.x ?? record.collider.x;
    const padZ = pad?.border?.position?.z ?? record.collider.z;
    const padY = cityRevealSidewalkWireY(pad?.topY, roadY);
    addCityWireLoop(pad?.hitPolygon, padY, padX, padZ, cityRevealWireCoreMat);
    if (CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED) {
      addCityWireLoopDensity(pad?.hitPolygon, padY, padX, padZ, cityRevealWireDimMat);
    }
    if (CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED && pad?.innerHitPolygon?.length) {
      const innerY = cityRevealSidewalkWireY(pad.innerTopY ?? pad.topY, roadY);
      addCityWireLoop(pad.innerHitPolygon, innerY, pad.border.position.x, pad.border.position.z, cityRevealWireDimMat);
      addCityWireLoopDensity(pad.innerHitPolygon, innerY, pad.border.position.x, pad.border.position.z, cityRevealWireDimMat);
    }
  }
  for (const record of mainBuildingRecords) {
    const h = record.collider.h;
    const boxWidth = record.collider.hw * 2;
    const boxDepth = record.collider.hd * 2;
    const boxY = record.collider.y + h * 0.5;
    addCityWireSolidBox(boxWidth, h, boxDepth, record.mesh.position.x, boxY, record.collider.z);
    addCityWireBox(boxWidth, h, boxDepth, record.mesh.position.x, boxY, record.collider.z, cityRevealWireCoreMat);
    addCityWireBoxDensity(boxWidth, h, boxDepth, record.mesh.position.x, boxY, record.collider.z, cityRevealWireDimMat);
    const pad = record.basePad;
    const padX = pad?.border?.position?.x ?? record.mesh.position.x;
    const padZ = pad?.border?.position?.z ?? record.collider.z;
    const padY = cityRevealSidewalkWireY(pad?.topY, roadY);
    addCityWireLoop(pad?.hitPolygon, padY, padX, padZ, cityRevealWireCoreMat);
    if (CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED) {
      addCityWireLoopDensity(pad?.hitPolygon, padY, padX, padZ, cityRevealWireDimMat);
    }
    if (CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED && pad?.innerHitPolygon?.length) {
      const innerY = cityRevealSidewalkWireY(pad.innerTopY ?? pad.topY, roadY);
      addCityWireLoop(pad.innerHitPolygon, innerY, pad.border.position.x, pad.border.position.z, cityRevealWireDimMat);
      addCityWireLoopDensity(pad.innerHitPolygon, innerY, pad.border.position.x, pad.border.position.z, cityRevealWireDimMat);
    }
  }
  for (const record of bridgeRecords) {
    if (!record.mesh.visible) continue;
    const boxWidth = record.baseWidth * record.mesh.scale.x;
    const boxHeight = record.baseHeight * record.mesh.scale.y;
    const boxDepth = record.baseDepth * record.mesh.scale.z;
    const boxY = record.mesh.position.y + boxHeight * 0.5;
    addCityWireSolidBox(boxWidth, boxHeight, boxDepth, record.mesh.position.x, boxY, record.mesh.position.z, 'bridge-solid');
  }
  for (const spec of edgeStripSpecs) {
    if (spec.edgeRole === 'main-building' && !CITY_REVEAL_MAIN_BUILDING_LED_WIREFRAME_ENABLED) {
      continue;
    }
    if (spec.edgeRole === 'bridge') {
      addCityWireStripCenterline(spec, cityRevealWireDimMat);
      continue;
    }
    if (!spec.mesh?.visible || !spec.mesh.geometry) continue;
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(spec.mesh.geometry), spec.edgeRole === 'main-building' ? cityRevealWireCoreMat : cityRevealWireDimMat);
    spec.mesh.updateWorldMatrix(true, false);
    edge.matrix.copy(spec.mesh.matrixWorld);
    edge.matrixAutoUpdate = false;
    edge.frustumCulled = false;
    cityRevealBoundsBox.setFromObject(spec.mesh);
    setCityRevealObjectBoundsFromBox(edge, cityRevealBoundsBox);
    edge.userData.cityRevealCullKind = 'wire';
    edge.userData.cityRevealRole = spec.edgeRole === 'main-building' ? 'main-led-wire' : `${spec.edgeRole || 'edge'}-led-wire`;
    cityRevealWireGroup.add(edge);
    cityRevealWireObjects.push(edge);
    cityRevealWireCullObjects.push(edge);
  }
  refreshCityRevealSweepBounds();
}

function setCityRevealWireAlpha(alpha) {
  cityRevealWireAlpha = cityRevealWireframeEnabled ? alpha : 0;
  cityRevealBackplateMat.opacity = cityRevealWireAlpha * cityRevealBackplateOpacityScale * cityRevealBackplateRevealFactor * CITY_REVEAL_MAX_SKY_BACKPLATE_OPACITY;
  cityRevealBackplate.visible = cityRevealBackplateMat.opacity > 0.002;
  cityRevealSolidMat.opacity = cityRevealWireAlpha;
  cityRevealSolidMat.visible = cityRevealWireAlpha > 0.002;
  for (const material of cityRevealWireMaterials) {
    const roadGridFactor = material.userData.cityRevealRoadGridMaterial ? cityRevealRoadGridAlphaFactor : 1;
    material.opacity = material.userData.baseOpacity * cityRevealWireOpacityScale * cityRevealWireAlpha * roadGridFactor;
    material.visible = material.opacity > 0.002;
    if (material.userData.cityRevealRoadGridShaderMaterial && material.uniforms?.uOpacity) {
      material.uniforms.uOpacity.value = material.opacity;
    }
  }
  cityRevealWireGroup.visible = cityRevealWireAlpha > 0.002;
  cityRevealRoadGridGroup.visible = cityRevealWireAlpha > 0.002;
  updateCityRevealWireObjectCulling();
}

function setCityRevealRoadGridAlphaFactor(factor) {
  cityRevealRoadGridAlphaFactor = THREE.MathUtils.clamp(Number(factor) || 0, 0, 1);
}

function isCityRevealBackplateActive() {
  return cityRevealBackplate.visible && cityRevealBackplateMat.opacity > 0.002;
}

function markCityRevealComplete(now = performance.now()) {
  if (!cityRevealComplete || !cityRevealCompletedAt) {
    cityRevealCompletedAt = Number.isFinite(now) && now > 0 ? now : performance.now();
  }
  cityRevealComplete = true;
  syncCityRevealSkyMaterial();
}

function startCityRevealWireframe() {
  if (!cityRevealWireframeEnabled) {
    clearCityRevealWire();
    markCityRevealComplete();
    cityRevealSweepProgress = 1;
    cityRevealBackplateRevealFactor = 0;
    setCityRevealRoadGridAlphaFactor(0);
    setCityRevealWireAlpha(0);
    updatePointerLockHint();
    return;
  }
  cityRevealSweepProgress = 0;
  cityRevealBackplateRevealFactor = 1;
  setCityRevealRoadGridAlphaFactor(1);
  buildCityRevealWireframe();
  setCityRevealSweepFront(cityRevealSweepStartZ);
  cityRevealStartedAt = 0;
  cityRevealArmedAt = 0;
  cityRevealComplete = false;
  cityRevealCompletedAt = 0;
  cityRevealWaitingForVisibleFrame = false;
  setCityRevealWireAlpha(1);
  stopMouseLookInput();
}

function startCityRevealWireTimer() {
  if (!cityRevealWireframeEnabled) return;
  if (cityRevealComplete || cityRevealStartedAt || cityRevealArmedAt || cityRevealWaitingForVisibleFrame) return;
  cityRevealWaitingForVisibleFrame = true;
}

function updateCityRevealWireframe(now) {
  if (!cityRevealWireframeEnabled) {
    markCityRevealComplete(now);
    cityRevealSweepProgress = 1;
    cityRevealBackplateRevealFactor = 0;
    setCityRevealRoadGridAlphaFactor(0);
    setCityRevealWireAlpha(0);
    updatePointerLockHint();
    return;
  }
  if (cityRevealComplete) return;
  if (cityRevealWaitingForVisibleFrame) {
    cityRevealArmedAt = Number.isFinite(now) && now > 0 ? now : performance.now() || 1;
    cityRevealWaitingForVisibleFrame = false;
    cityRevealSweepProgress = 0;
    cityRevealBackplateRevealFactor = 1;
    setCityRevealRoadGridAlphaFactor(1);
    setCityRevealSweepFront(cityRevealSweepStartZ);
    setCityRevealWireAlpha(1);
    return;
  }
  if (cityRevealArmedAt && !cityRevealStartedAt) {
    const armedElapsed = now - cityRevealArmedAt;
    if (armedElapsed < cityRevealEffectiveDelayMs()) return;
    cityRevealStartedAt = now - cityRevealEffectiveDelayMs();
    cityRevealSweepProgress = 0;
    cityRevealBackplateRevealFactor = 1;
    setCityRevealRoadGridAlphaFactor(1);
    setCityRevealSweepFront(cityRevealSweepStartZ);
    setCityRevealWireAlpha(1);
  }
  if (!cityRevealStartedAt) return;
  const elapsed = now - cityRevealStartedAt;
  const fadeDuration = cityRevealFadeDurationMs();
  const t = THREE.MathUtils.clamp((elapsed - cityRevealEffectiveDelayMs()) / fadeDuration, 0, 1);
  if (t > 0) scheduleTronSoundtrackIntroLofiStopForReveal();
  const eased = t * t * (3 - 2 * t);
  cityRevealSweepProgress = eased;
  cityRevealBackplateRevealFactor = 1 - THREE.MathUtils.clamp(t / CITY_REVEAL_BACKPLATE_SWEEP_PORTION, 0, 1);
  setCityRevealRoadGridAlphaFactor(1);
  setCityRevealSweepFront(cityRevealFrontForProgress(eased));
  setCityRevealWireAlpha(1);
  if (t >= 1) {
    cityRevealSweepProgress = 1;
    cityRevealBackplateRevealFactor = 0;
    setCityRevealRoadGridAlphaFactor(0);
    setCityRevealSweepFront(cityRevealSweepEndZ);
    setCityRevealWireAlpha(0);
    markCityRevealComplete(now);
    updatePointerLockHint();
  }
}

function renderCityRevealWireframe() {
  if (!cityRevealWireframeEnabled || cityRevealWireAlpha <= 0.002) return;
  const previousAutoClear = renderer.autoClear;
  renderer.autoClear = false;
  renderer.clearDepth();
  if (isCityRevealBackplateActive()) {
    renderer.render(cityRevealOverlayScene, cityRevealOverlayCamera);
    renderer.clearDepth();
  }
  renderer.render(cityRevealRoadGridScene, camera);
  renderer.render(cityRevealWireScene, camera);
  renderer.autoClear = previousAutoClear;
}

function isCityRevealCompositeActive() {
  return cityRevealWireframeEnabled && cityRevealWireAlpha > 0.002;
}

function isCityRevealRealRevealActive() {
  return isCityRevealCompositeActive()
    && cityRevealStartedAt > 0
    && cityRevealSweepProgress > 0.002
    && !cityRevealComplete;
}

function isCityRevealPerformanceCritical() {
  return Boolean(
    cityRevealWireframeEnabled &&
    !cityRevealComplete &&
    (cityRevealWaitingForVisibleFrame || cityRevealArmedAt > 0 || cityRevealStartedAt > 0)
  );
}

function shouldUpdateTronRunnerSourceCharacter() {
  return Boolean(TRON_RUNNER_SOURCE_CHARACTER_VISIBLE || TRON_MAIN_PLAYER_BODY_ENABLED);
}

function createCityRevealScenePass() {
  return {
    enabled: true,
    needsSwap: false,
    clear: true,
    clearDepth: false,
    clipReveal: false,
    renderToScreen: false,
    setSize() {},
    render(rendererInstance, writeBuffer, readBuffer) {
      const previousAutoClear = rendererInstance.autoClear;
      const previousClippingPlanes = rendererInstance.clippingPlanes;
      const previousSceneBackground = scene.background;
      const previousDomeVisible = domeMesh.visible;
      rendererInstance.autoClear = false;
      rendererInstance.setRenderTarget(this.renderToScreen ? null : readBuffer);
      if (this.clearDepth) rendererInstance.clearDepth();
      if (this.clear) {
        rendererInstance.clear(
          rendererInstance.autoClearColor,
          rendererInstance.autoClearDepth,
          rendererInstance.autoClearStencil
        );
      }
      rendererInstance.clippingPlanes = this.clipReveal ? [cityRevealRealClipPlane] : [];
      if (this.clipReveal) {
        scene.background = null;
        domeMesh.visible = false;
      }
      rendererInstance.render(scene, camera);
      scene.background = previousSceneBackground;
      domeMesh.visible = previousDomeVisible;
      rendererInstance.clippingPlanes = previousClippingPlanes;
      rendererInstance.autoClear = previousAutoClear;
    },
  };
}

function syncCityRevealComposerPasses() {
  if (!cityRevealScenePass) return;
  const wireActive = isCityRevealCompositeActive();
  const realRevealActive = isCityRevealRealRevealActive();
  const mainLedRevealActive = cityRevealMainLedReveal.isOverlayActive();
  cityRevealMainLedReveal.syncOverlayLayers();
  syncGlobalFxaaPass();
  if (cityRevealSkyPass) cityRevealSkyPass.enabled = wireActive;
  if (cityRevealOverlayPass) cityRevealOverlayPass.enabled = wireActive && isCityRevealBackplateActive();
  if (cityRevealWirePass) cityRevealWirePass.enabled = wireActive;
  if (cityRevealRoadGridPass) cityRevealRoadGridPass.enabled = wireActive;
  if (cityRevealWireFxaaPass) cityRevealWireFxaaPass.enabled = false;
  cityRevealScenePass.enabled = !wireActive || realRevealActive;
  cityRevealScenePass.clear = !wireActive;
  cityRevealScenePass.clearDepth = realRevealActive;
  cityRevealScenePass.clipReveal = realRevealActive;
  cityRevealMainLedReveal.setPassEnabled(mainLedRevealActive);
  if (!mainLedRevealActive) cityRevealMainLedReveal.resetScissorState();
}

function renderSceneWithCityRevealClip() {
  const previousClippingPlanes = renderer.clippingPlanes;
  const previousSceneBackground = scene.background;
  const previousDomeVisible = domeMesh.visible;
  renderer.clippingPlanes = [cityRevealRealClipPlane];
  scene.background = null;
  domeMesh.visible = false;
  renderer.render(scene, camera);
  scene.background = previousSceneBackground;
  domeMesh.visible = previousDomeVisible;
  renderer.clippingPlanes = previousClippingPlanes;
}

function prewarmCityRevealRealPass() {
  if (cityRevealRealPrewarmStatus === 'done' || cityRevealRealPrewarmStatus === 'running') return;
  cityRevealRealPrewarmStatus = 'running';
  cityRevealRealPrewarmError = '';
  const started = performance.now();
  const previousTarget = renderer.getRenderTarget();
  const previousAutoClear = renderer.autoClear;
  const previousClippingPlanes = renderer.clippingPlanes;
  const previousSceneBackground = scene.background;
  const previousDomeVisible = domeMesh.visible;
  const previousCameraLayerMask = camera.layers.mask;
  try {
    refreshCityRevealSweepBounds();
    setCityRevealSweepFront(cityRevealFrontForProgress(0.04));
    if (!cityRevealRealPrewarmTarget) {
      cityRevealRealPrewarmTarget = new THREE.WebGLRenderTarget(
        CITY_REVEAL_REAL_PREWARM_TARGET_SIZE,
        CITY_REVEAL_REAL_PREWARM_TARGET_SIZE,
        { depthBuffer: true, stencilBuffer: false }
      );
      cityRevealRealPrewarmTarget.texture.name = 'city-reveal-real-prewarm-target';
    }
    renderer.setRenderTarget(cityRevealRealPrewarmTarget);
    renderer.autoClear = true;
    renderer.clippingPlanes = [cityRevealRealClipPlane];
    scene.background = null;
    domeMesh.visible = false;
    camera.layers.set(0);
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
    cityRevealRealPrewarmStatus = 'done';
  } catch (error) {
    cityRevealRealPrewarmStatus = 'error';
    cityRevealRealPrewarmError = error?.message || String(error);
    console.warn('[city-reveal-prewarm]', cityRevealRealPrewarmError);
  } finally {
    camera.layers.mask = previousCameraLayerMask;
    scene.background = previousSceneBackground;
    domeMesh.visible = previousDomeVisible;
    renderer.clippingPlanes = previousClippingPlanes;
    renderer.autoClear = previousAutoClear;
    renderer.setRenderTarget(previousTarget);
    cityRevealRealPrewarmMs = performance.now() - started;
  }
}

function renderCityRevealCompositeFrame() {
  const active = isCityRevealCompositeActive();
  cityRevealMainLedReveal.syncOverlayLayers();
  if (shouldUseComposer()) {
    syncCityRevealComposerPasses();
    if (active) syncCityRevealSkyDome();
    composer.render();
    return;
  }

  const previousAutoClear = renderer.autoClear;
  if (!active) {
    renderer.render(scene, camera);
    renderer.autoClear = previousAutoClear;
    return;
  }

  renderCityRevealSkyBase();
  renderer.autoClear = false;
  if (isCityRevealBackplateActive()) renderer.render(cityRevealOverlayScene, cityRevealOverlayCamera);
  renderer.render(cityRevealRoadGridScene, camera);
  renderer.render(cityRevealWireScene, camera);
  const realRevealActive = isCityRevealRealRevealActive();
  if (realRevealActive) {
    renderer.clearDepth();
    renderSceneWithCityRevealClip();
    cityRevealMainLedReveal.renderOverlay(renderer);
  }
  renderer.autoClear = previousAutoClear;
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
  if (!fxaaPass && !cityRevealWireFxaaPass) return;
  const composerPixelRatio = effectiveComposerPixelRatio();
  const width = Math.max(1, Math.round(window.innerWidth * composerPixelRatio));
  const height = Math.max(1, Math.round(window.innerHeight * composerPixelRatio));
  const key = `${width}x${height}`;
  if (key === lastFxaaTargetKey) return;
  lastFxaaTargetKey = key;
  fxaaPass?.setSize(width, height);
  cityRevealWireFxaaPass?.setSize(width, height);
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
  cityRevealSkyPass = null;
  cityRevealOverlayPass = null;
  cityRevealWirePass = null;
  cityRevealRoadGridPass = null;
  cityRevealWireFxaaPass = null;
  cityRevealScenePass = null;
  cityRevealMainLedReveal.clearPass();
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
  cityRevealSkyPass = new RenderPass(cityRevealSkyScene, camera);
  cityRevealSkyPass.clear = true;
  cityRevealOverlayPass = new RenderPass(cityRevealOverlayScene, cityRevealOverlayCamera);
  cityRevealOverlayPass.clear = false;
  cityRevealWirePass = new RenderPass(cityRevealWireScene, camera);
  cityRevealWirePass.clear = false;
  cityRevealRoadGridPass = new RenderPass(cityRevealRoadGridScene, camera);
  cityRevealRoadGridPass.clear = false;
  cityRevealWireFxaaPass = new FXAAPass();
  cityRevealWireFxaaPass.enabled = false;
  cityRevealScenePass = createCityRevealScenePass();
  cityRevealMainLedReveal.createPass();
  syncCityRevealComposerPasses();
  composer.addPass(cityRevealSkyPass);
  composer.addPass(cityRevealOverlayPass);
  composer.addPass(cityRevealRoadGridPass);
  composer.addPass(cityRevealWirePass);
  composer.addPass(cityRevealWireFxaaPass);
  composer.addPass(cityRevealScenePass);
  composer.addPass(cityRevealMainLedReveal.getPass());
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
  return Boolean(isCityRevealPerformanceCritical() && !hasDroneIntroLanded());
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
    revealPixelRatioCap
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

function updateBuildingMaterials(materials, baseColor, brightness, hueDeg, metalness, roughness, reflect, emissive, lightResponse, saturation = 1.2) {
  const color = tunedColor(new THREE.Color(baseColor), hueDeg, saturation, brightness * lightResponse.surface);
  const glow = new THREE.Color(0x09363d).multiplyScalar(Math.max(0.5, brightness));
  for (const material of materials) {
    material.color.copy(color);
    material.envMap = reflectionEnvMap;
    material.metalness = metalness;
    material.roughness = roughness;
    material.envMapIntensity = reflect * lightResponse.reflection;
    material.emissive.copy(glow);
    material.emissiveIntensity = emissive * lightResponse.emissive + lightResponse.facadeFill;
  }
}

function updateGroundLedMaterials(roadEdgeBrightness, medianBrightness, hueDeg) {
  for (const item of groundLedMaterials) {
    const amount = item.role === 'median' ? medianBrightness : roadEdgeBrightness;
    item.material.color.copy(tunedColor(item.baseColor, hueDeg, 1, amount));
  }
}

function updateBuildingScale(meshes, colliders, scaleY) {
  for (const mesh of meshes) mesh.scale.y = scaleY;
  for (const collider of colliders) collider.h = collider.baseH * scaleY;
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

function updateBuildingFootprints(nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale, nextSideSpacingScale, width, nextMainZ, nextMainY) {
  const sideWidth = SIDE_BUILDING_BASE * nextSideWidthScale;
  for (const record of sideBuildingRecords) {
    const x = record.sign * (roadHalf() + width + sideWidth / 2);
    const z = record.zFactor * SIDE_BUILDING_SPACING * nextSideSpacingScale;
    record.mesh.scale.x = nextSideWidthScale;
    record.mesh.scale.z = nextSideDepthScale;
    record.mesh.position.x = x;
    record.mesh.position.z = z;
    record.collider.x = x;
    record.collider.z = z;
    record.collider.hw = record.baseW * nextSideWidthScale / 2;
    record.collider.hd = record.baseD * nextSideDepthScale / 2;
    record.collider.chamfer = (record.footprintChamfer || record.collider.baseChamfer || 0) * Math.min(nextSideWidthScale, nextSideDepthScale);
    updateBuildingBasePad(record, x, z, nextSideWidthScale, nextSideDepthScale, sideBuildingBasePadScale, sideBuildingBasePadXScale, sideBuildingBasePadXScale, sideBuildingBasePadY, sideBuildingBasePadThickness, sideBuildingBasePadCut, sideBuildingBasePadRadius);
  }
  for (const record of mainBuildingRecords) {
    record.mesh.scale.x = nextMainWidthScale;
    record.mesh.scale.z = nextMainDepthScale;
    record.mesh.position.y = nextMainY;
    record.mesh.position.z = nextMainZ;
    record.collider.y = nextMainY;
    record.collider.z = nextMainZ;
    record.collider.hw = record.baseW * nextMainWidthScale / 2;
    record.collider.hd = record.baseD * nextMainDepthScale / 2;
    record.collider.chamfer = (record.footprintChamfer || record.collider.baseChamfer || 0) * Math.min(nextMainWidthScale, nextMainDepthScale);
    updateBuildingBasePad(record, 0, nextMainZ, nextMainWidthScale, nextMainDepthScale, mainBuildingBasePadScale, mainBuildingBasePadXScale, mainBuildingBasePadZScale, mainBuildingBasePadY, mainBuildingBasePadThickness, mainBuildingBasePadCut, mainBuildingBasePadRadius);
  }
  updateSideBuildingDoorTransforms();
  const roleBoards = getCityRoleBoards();
  if (roleBoards?.length) {
    for (const board of roleBoards) syncCityRoleBoardDoorPose(board);
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

const CONTROLS_VISIBILITY_KEY = 'tron-boulevard-controls-hidden';
function setupSettingsToggle() {
  const button = document.getElementById('settings-toggle');
  const controls = document.getElementById('hud-controls');
  if (!button || !controls) return;

  function setHidden(hidden, persist = true) {
    document.body.classList.toggle('controls-hidden', hidden);
    if (!hidden) updateStartPositionLiveLabel();
    button.textContent = hidden ? 'Settaggi' : 'Nascondi';
    button.setAttribute('aria-expanded', hidden ? 'false' : 'true');
    controls.setAttribute('aria-hidden', hidden ? 'true' : 'false');
    if (!persist) return;
    try {
      localStorage.setItem(CONTROLS_VISIBILITY_KEY, hidden ? 'true' : 'false');
    } catch {}
  }

  setHidden(true, false);
  button.addEventListener('click', () => {
    setHidden(!document.body.classList.contains('controls-hidden'));
  });
}

async function persistSettingsToProject(scope, settings, extra = {}) {
  try {
    const payload = {
      demo: 'demo-5-boulevard-map',
      source: location.pathname,
      savedAt: new Date().toISOString(),
      scope,
      settings,
      ...extra,
    };
    const response = await fetch(PROJECT_SETTINGS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok === false) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    return result;
  } catch (error) {
    console.warn('TRON boulevard project JSON save failed', error);
    return null;
  }
}

const TAB_STORAGE_PREFIX = 'tron-boulevard-tab:';
const DEFAULT_SETTINGS_KEY = 'tron-boulevard-default-settings';
const PROJECT_SETTINGS_ENDPOINT = `${location.protocol}//${location.hostname || '127.0.0.1'}:60093/save-settings`;
const PROJECT_CANONICAL_SETTINGS_URL = new URL('demo-5-boulevard-canonical-settings.json', location.href).href;
const LOCKED_LED_POSITION_VALUES = Object.freeze({
  'main-led-vertical-distance-ui': 6.1,
  'main-led-thickness-ui': 2.28,
  'main-led-vertical-length-ui': 1.03,
  'main-led-vertical-y-ui': -43,
  'main-led-horizontal-distance-ui': 9.95,
  'main-led-horizontal-thickness-ui': 2.04,
  'main-led-horizontal-radius-ui': 1.15,
  'main-led-low-offset-ui': 0.1,
  'main-led-low-y-ui': -2,
  'main-led-high-offset-ui': 0.15,
  'main-led-high-y-ui': -33,
  'main-facade-led-normal-ui': 3.8,
  'main-facade-led-thickness-ui': 3,
  'main-facade-led-seg-1-u-ui': -3.7,
  'main-facade-led-seg-1-y-ui': 3.6,
  'main-facade-led-seg-1-normal-ui': -1,
  'main-facade-led-seg-2-u-ui': 0,
  'main-facade-led-seg-2-y-ui': 0,
  'main-facade-led-seg-2-normal-ui': -1.2,
  'main-facade-led-seg-3-u-ui': -1.3,
  'main-facade-led-seg-3-y-ui': -3.4,
  'main-facade-led-seg-3-normal-ui': -1,
  'main-facade-led-seg-4-u-ui': -4.9,
  'main-facade-led-seg-4-y-ui': -5.1,
  'main-facade-led-seg-4-normal-ui': -1,
  'main-facade-led-seg-5-u-ui': 4.7,
  'main-facade-led-seg-5-y-ui': 26.1,
  'main-facade-led-seg-5-normal-ui': -1.2,
  'main-facade-led-seg-6-u-ui': 5.2,
  'main-facade-led-seg-6-y-ui': 23.9,
  'main-facade-led-seg-6-normal-ui': -1.2,
});

function collectPanelSettings(panel) {
  const settings = {};
  panel.querySelectorAll('input[type="range"], input[type="checkbox"], select').forEach((input) => {
    settings[input.id] = input.type === 'checkbox' ? input.checked : (input.tagName === 'SELECT' ? input.value : Number(input.value));
  });
  return settings;
}

function collectAllControlSettings() {
  const settings = {};
  document.querySelectorAll('#hud-controls input[type="range"], #hud-controls input[type="checkbox"], #hud-controls select').forEach((input) => {
    settings[input.id] = input.type === 'checkbox' ? input.checked : (input.tagName === 'SELECT' ? input.value : Number(input.value));
  });
  return settings;
}

function setButtonFeedback(button, label = 'Salvato') {
  if (!button) return;
  const defaultText = button.dataset.defaultText || button.textContent;
  button.dataset.defaultText = defaultText;
  button.textContent = label;
  button.classList.add('saved');
  window.setTimeout(() => {
    button.textContent = defaultText;
    button.classList.remove('saved');
  }, 1200);
}

function applyLockedLedPositionControls() {
  for (const [id, value] of Object.entries(LOCKED_LED_POSITION_VALUES)) {
    const input = document.getElementById(id);
    if (!input) continue;
    input.value = String(value);
    input.defaultValue = String(value);
    input.disabled = true;
    input.closest('.control-row')?.classList.add('is-locked');
  }
}

function applyControlSettings(settings, asDefault = false) {
  for (const [id, rawValue] of Object.entries(settings)) {
    const input = document.getElementById(id);
    if (!input) continue;
    if (input.tagName === 'SELECT') {
      const value = String(rawValue);
      const optionExists = Array.from(input.options).some((option) => option.value === value);
      if (!optionExists) continue;
      input.value = value;
      if (asDefault) input.dataset.defaultValue = value;
      continue;
    }
    if (input.type === 'checkbox') {
      input.checked = Boolean(rawValue);
      if (asDefault) input.defaultChecked = input.checked;
      const output = document.getElementById(`${input.id}-val`);
      if (output) output.textContent = input.checked ? 'on' : 'off';
      continue;
    }
    if (input.type !== 'range') continue;
    const min = Number(input.min);
    const max = Number(input.max);
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) continue;
    const value = THREE.MathUtils.clamp(numeric, min, max);
    input.value = String(value);
    if (asDefault) input.defaultValue = String(value);
  }
  applyLockedLedPositionControls();
}

function loadStoredControlDefaults() {
  const settings = {};
  try {
    const globalPayload = JSON.parse(localStorage.getItem(DEFAULT_SETTINGS_KEY) || 'null');
    if (globalPayload?.settings) Object.assign(settings, globalPayload.settings);
  } catch (error) {
    console.warn('Invalid TRON boulevard global defaults', error);
  }

  document.querySelectorAll('#hud-controls .control-panel').forEach((panel) => {
    try {
      const payload = JSON.parse(localStorage.getItem(`${TAB_STORAGE_PREFIX}${panel.dataset.panel}`) || 'null');
      if (payload?.settings) Object.assign(settings, payload.settings);
    } catch (error) {
      console.warn(`Invalid TRON boulevard defaults for ${panel.dataset.panel}`, error);
    }
  });

  applyControlSettings(settings, true);
}

async function loadProjectCanonicalDefaults() {
  try {
    const response = await fetch(PROJECT_CANONICAL_SETTINGS_URL, { cache: 'no-store' });
    if (!response.ok) return false;
    const payload = await response.json();
    if (!payload?.settings || typeof payload.settings !== 'object') return false;
    applyControlSettings(payload.settings, true);
    const nextSpawn = sanitizePlayerSpawn(payload.spawn);
    if (nextSpawn) {
      playerSpawn = nextSpawn;
      updatePlayerSpawnLabel();
      applyPlayerSpawn(playerSpawn, false);
    }
    const nextLanding = sanitizeDroneLandingPose(payload.landing);
    if (nextLanding) droneLandingPose = nextLanding;
    return true;
  } catch (error) {
    console.warn('TRON boulevard canonical settings load failed', error);
    return false;
  }
}

function formatRevealDelaySeconds(seconds) {
  const roundedTenths = Math.round(seconds * 10) / 10;
  return Math.abs(seconds - roundedTenths) < 0.0001 ? seconds.toFixed(1) : seconds.toFixed(2);
}

function applyRetroFutureRevealTimingDefaults() {
  if (!controlEls.wireframeDelay) return;
  const delaySeconds = CITY_REVEAL_DEFAULT_DELAY_MS / 1000;
  controlEls.wireframeDelay.value = String(delaySeconds);
  controlEls.wireframeDelay.defaultValue = String(delaySeconds);
  if (controlEls.wireframeDelayVal) {
    controlEls.wireframeDelayVal.textContent = `${formatRevealDelaySeconds(delaySeconds)} s`;
  }
  if (controlEls.wireframeFade) {
    const fadeSeconds = CITY_REVEAL_DEFAULT_FADE_MS / 1000;
    controlEls.wireframeFade.value = String(fadeSeconds);
    controlEls.wireframeFade.defaultValue = String(fadeSeconds);
    if (controlEls.wireframeFadeVal) {
      controlEls.wireframeFadeVal.textContent = `${fadeSeconds.toFixed(1)} s`;
    }
  }
}

function applyFullResolutionFsrDefaults() {
  if (controlEls.fsrPreset) {
    controlEls.fsrPreset.value = 'off';
    controlEls.fsrPreset.dataset.defaultValue = 'off';
  }
  if (controlEls.fsrUpscaleEnabled) {
    controlEls.fsrUpscaleEnabled.value = 'off';
    controlEls.fsrUpscaleEnabled.dataset.defaultValue = 'off';
  }
  if (controlEls.fsrInternalScale) {
    controlEls.fsrInternalScale.value = '1';
    controlEls.fsrInternalScale.defaultValue = '1';
  }
  if (controlEls.fsrInternalScaleVal) controlEls.fsrInternalScaleVal.textContent = '100%';
}

function saveTabSettings(tabName, button) {
  const panel = document.querySelector(`#hud-controls .control-panel[data-panel="${tabName}"]`);
  if (!panel) return;
  const payload = {
    tab: tabName,
    savedAt: new Date().toISOString(),
    settings: collectPanelSettings(panel),
  };
  const text = JSON.stringify(payload, null, 2);
  localStorage.setItem(`${TAB_STORAGE_PREFIX}${tabName}`, text);
  navigator.clipboard?.writeText(text).catch(() => {});
  applyControlSettings(payload.settings, true);
  setButtonFeedback(button, 'Scheda salvata');
  const canonicalSettings = collectAllControlSettings();
  persistSettingsToProject('tab', payload.settings, { tab: tabName, savedAt: payload.savedAt }).then((result) => {
    if (result) setButtonFeedback(button, 'Scheda JSON salvata');
  });
  persistSettingsToProject('all-defaults', canonicalSettings, { tab: tabName, savedAt: payload.savedAt, sourceScope: 'tab-save' }).then((result) => {
    if (result) setButtonFeedback(button, 'Scheda + default JSON');
  });
}

function bindSaveButtons() {
  document.querySelectorAll('#hud-controls .save-tab-settings').forEach((button) => {
    button.dataset.defaultText = button.textContent;
    button.addEventListener('click', () => saveTabSettings(button.dataset.saveTab, button));
  });
}

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
  const stats = performanceDiagnosticsSummary(latestMeasuredFps);
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
      updatePerformanceDiagnostics(latestMeasuredFps);
      await waitFsrBenchmarkFrames(18);
      await fsrBenchmarkDelay(180);
      updatePerformanceDiagnostics(latestMeasuredFps);
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
  cityRevealWireframeEnabled = controlEls.wireframeEnabled.value === 'on';
  cityRevealDelayMs = Number(controlEls.wireframeDelay.value) * 1000;
  cityRevealFadeMs = Number(controlEls.wireframeFade.value) * 1000;
  cityRevealWireframeDensity = Math.max(1, Math.round(Number(controlEls.wireframeDensity.value)));
  cityRevealWireOpacityScale = Number(controlEls.wireframeOpacity.value);
  cityRevealBackplateOpacityScale = Number(controlEls.wireframeBackplate.value);

  controlEls.wireframeEnabledVal.textContent = cityRevealWireframeEnabled ? 'on' : 'off';
  controlEls.wireframeDelayVal.textContent = `${formatRevealDelaySeconds(cityRevealDelayMs / 1000)} s`;
  controlEls.wireframeFadeVal.textContent = `${(cityRevealFadeMs / 1000).toFixed(1)} s`;
  controlEls.wireframeDensityVal.textContent = `${cityRevealWireframeDensity}x`;
  controlEls.wireframeOpacityVal.textContent = cityRevealWireOpacityScale.toFixed(2);
  controlEls.wireframeBackplateVal.textContent = cityRevealBackplateOpacityScale.toFixed(2);

  if (!cityRevealWireframeEnabled) {
    markCityRevealComplete();
    cityRevealSweepProgress = 1;
    cityRevealBackplateRevealFactor = 0;
    setCityRevealWireAlpha(0);
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
  tronRunnerBeatPulseEnabled = controlEls.runnerBeatPulseEnabled.value === 'on';
  tronRunnerBeatPulseBpm = Number(controlEls.runnerBeatPulseBpm.value);
  tronRunnerBeatPulseOffset = Number(controlEls.runnerBeatPulseOffset.value);
  tronRunnerBeatPulseIntensity = Number(controlEls.runnerBeatPulseIntensity.value);
  tronRunnerBeatPulseDecay = Number(controlEls.runnerBeatPulseDecay.value);
  tronRunnerBeatPulseDivision = Number(controlEls.runnerBeatPulseDivision.value);
  tronRunnerMaterialReflect = Number(controlEls.runnerMaterialReflect.value);
  tronRunnerMaterialMetalness = Number(controlEls.runnerMaterialMetalness.value);
  tronRunnerMaterialRoughness = Number(controlEls.runnerMaterialRoughness.value);
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
  controlEls.runnerBodyLightVal.textContent = tronRunnerBodyLight.toFixed(2);
  controlEls.runnerLineLightVal.textContent = tronRunnerLineLight.toFixed(2);
  controlEls.runnerKeyLightVal.textContent = tronRunnerKeyLight.toFixed(2);
  controlEls.runnerRimLightVal.textContent = tronRunnerRimLight.toFixed(2);
  controlEls.runnerFillLightVal.textContent = tronRunnerFillLight.toFixed(2);
  controlEls.runnerLedBrightnessVal.textContent = `${tronRunnerLedBrightness.toFixed(2)}x`;
  controlEls.runnerLedBloomVal.textContent = `${tronRunnerLedBloom.toFixed(2)}x`;
  controlEls.runnerBeatPulseEnabledVal.textContent = tronRunnerBeatPulseEnabled ? 'on' : 'off';
  controlEls.runnerBeatPulseBpmVal.textContent = tronRunnerBeatPulseBpm.toFixed(0);
  controlEls.runnerBeatPulseOffsetVal.textContent = `${tronRunnerBeatPulseOffset.toFixed(2)} s`;
  controlEls.runnerBeatPulseIntensityVal.textContent = `${tronRunnerBeatPulseIntensity.toFixed(2)}x`;
  controlEls.runnerBeatPulseDecayVal.textContent = tronRunnerBeatPulseDecay.toFixed(1);
  controlEls.runnerBeatPulseDivisionVal.textContent = `${tronRunnerBeatPulseDivision.toFixed(2)}x`;
  controlEls.runnerMaterialReflectVal.textContent = tronRunnerMaterialReflect.toFixed(2);
  controlEls.runnerMaterialMetalnessVal.textContent = tronRunnerMaterialMetalness.toFixed(2);
  controlEls.runnerMaterialRoughnessVal.textContent = tronRunnerMaterialRoughness.toFixed(2);
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
  const ambient = Number(controlEls.ambientLight.value);
  const key = Number(controlEls.keyLight.value);
  const lightResponse = sceneLightResponse(ambient, key);
  const sideBuildingBrightness = Number(controlEls.sideBuildingBrightness.value);
  const sideBuildingHue = Number(controlEls.sideBuildingHue.value);
  const sideBuildingMetalness = Number(controlEls.sideBuildingMetalness.value);
  const sideBuildingRoughness = Number(controlEls.sideBuildingRoughness.value);
  const sideBuildingReflect = Number(controlEls.sideBuildingReflect.value);
  const sideBuildingEmissive = Number(controlEls.sideBuildingEmissive.value);
  const mainBuildingBrightness = Number(controlEls.mainBuildingBrightness.value);
  const mainBuildingHue = Number(controlEls.mainBuildingHue.value);
  mainBuildingSaturation = Number(controlEls.mainBuildingSaturation.value);
  const mainBuildingMetalness = Number(controlEls.mainBuildingMetalness.value);
  const mainBuildingRoughness = Number(controlEls.mainBuildingRoughness.value);
  const mainBuildingReflect = Number(controlEls.mainBuildingReflect.value);
  const mainBuildingEmissive = Number(controlEls.mainBuildingEmissive.value);
  updateBuildingMaterials(sideBuildingMaterials, PAL.buildingSkin, sideBuildingBrightness, sideBuildingHue, sideBuildingMetalness, sideBuildingRoughness, sideBuildingReflect, sideBuildingEmissive, lightResponse);
  updateBuildingMaterials(bridgeMaterials, PAL.buildingSkin, sideBuildingBrightness, sideBuildingHue, sideBuildingMetalness, sideBuildingRoughness, sideBuildingReflect, sideBuildingEmissive, lightResponse);
  updateBuildingMaterials(mainBuildingMaterials, PAL.mainSkin, mainBuildingBrightness, mainBuildingHue, mainBuildingMetalness, mainBuildingRoughness, mainBuildingReflect, mainBuildingEmissive, lightResponse, mainBuildingSaturation);
  controlEls.sideBuildingBrightnessVal.textContent = sideBuildingBrightness.toFixed(2);
  controlEls.sideBuildingHueVal.textContent = sideBuildingHue.toFixed(0);
  controlEls.sideBuildingMetalnessVal.textContent = sideBuildingMetalness.toFixed(2);
  controlEls.sideBuildingRoughnessVal.textContent = sideBuildingRoughness.toFixed(2);
  controlEls.sideBuildingReflectVal.textContent = sideBuildingReflect.toFixed(2);
  controlEls.sideBuildingEmissiveVal.textContent = sideBuildingEmissive.toFixed(2);
  controlEls.mainBuildingBrightnessVal.textContent = mainBuildingBrightness.toFixed(2);
  controlEls.mainBuildingHueVal.textContent = mainBuildingHue.toFixed(0);
  controlEls.mainBuildingSaturationVal.textContent = mainBuildingSaturation.toFixed(2);
  controlEls.mainBuildingMetalnessVal.textContent = mainBuildingMetalness.toFixed(2);
  controlEls.mainBuildingRoughnessVal.textContent = mainBuildingRoughness.toFixed(2);
  controlEls.mainBuildingReflectVal.textContent = mainBuildingReflect.toFixed(2);
  controlEls.mainBuildingEmissiveVal.textContent = mainBuildingEmissive.toFixed(2);
}

function applyBasePadMaterialControlsFromUI() {
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
  const nextBasePadFlatShading = controlEls.basePadFlatShading.value === 'on';
  const nextBasePadBorderOpacity = Number(controlEls.basePadBorderOpacity.value);
  const nextBasePadBorderBrightness = Number(controlEls.basePadBorderBright.value);
  applyBasePadMaterialRuntimeSettings({
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
    flatShading: nextBasePadFlatShading,
    borderOpacity: nextBasePadBorderOpacity,
    borderBrightness: nextBasePadBorderBrightness,
  });
  const lightResponse = sceneLightResponse(Number(controlEls.ambientLight.value), Number(controlEls.keyLight.value));
  applyBasePadMaterialSettings(lightResponse);
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
  controlEls.basePadFlatShadingVal.textContent = nextBasePadFlatShading ? 'on' : 'off';
  controlEls.basePadBorderOpacityVal.textContent = nextBasePadBorderOpacity.toFixed(2);
  controlEls.basePadBorderBrightVal.textContent = nextBasePadBorderBrightness.toFixed(2);
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

  updateBridgeLinks(nextSideBuildingWidthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth, nextBridgeXOffset, nextBridgeZOffset, nextBridgeYOffset, nextBridgeSpanScale, nextBridgeHeightScale, nextBridgeDepthScale);
  updateEdgeStrips(ledBrightness, ledThickness, nextLedDistance, ledHue, mainBuildingLedBrightness, mainBuildingLedThickness, mainBuildingLedDistance, mainBuildingLedHue, nextBuildingHorizontalLedDistance, nextMainBuildingHorizontalLedDistance, nextBuildingHorizontalLedThickness, nextMainBuildingHorizontalLedThickness, nextBuildingHorizontalLedRadius, nextMainBuildingHorizontalLedRadius, buildingLowLedOffset, buildingHighLedOffset, bridgeLowLedOffset, bridgeHighLedOffset, mainBuildingLowLedOffset, mainBuildingHighLedOffset, nextBuildingVerticalLedLength, nextMainBuildingVerticalLedLength, nextBuildingVerticalLedY, nextBuildingLowLedY, nextBuildingHighLedY, nextMainBuildingVerticalLedY, nextMainBuildingLowLedY, nextMainBuildingHighLedY, sideBuildingScale, mainBuildingScale, nextSideBuildingWidthScale, nextSideBuildingDepthScale, nextMainBuildingWidthScale, nextMainBuildingDepthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth, tunedColor);
  updateSideBuildingDoorMaterials(ledBrightness, ledHue);
  updateGroundLedMaterials(roadEdgeBrightness, medianBrightness, ledHue);
  updateBuildingMaterials(sideBuildingMaterials, PAL.buildingSkin, sideBuildingBrightness, sideBuildingHue, sideBuildingMetalness, sideBuildingRoughness, sideBuildingReflect, sideBuildingEmissive, lightResponse);
  updateBuildingMaterials(bridgeMaterials, PAL.buildingSkin, sideBuildingBrightness, sideBuildingHue, sideBuildingMetalness, sideBuildingRoughness, sideBuildingReflect, sideBuildingEmissive, lightResponse);
  updateBuildingMaterials(mainBuildingMaterials, PAL.mainSkin, mainBuildingBrightness, mainBuildingHue, mainBuildingMetalness, mainBuildingRoughness, mainBuildingReflect, mainBuildingEmissive, lightResponse, nextMainBuildingSaturation);
  updateBuildingFootprints(nextSideBuildingWidthScale, nextSideBuildingDepthScale, nextMainBuildingWidthScale, nextMainBuildingDepthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth, nextMainBuildingZ, nextMainBuildingY);
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
bindSaveButtons();

updateControlTabs();
setupSettingsToggle();

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
  const previousRevealComplete = cityRevealComplete;
  const previousRevealCompletedAt = cityRevealCompletedAt;
  const previousRevealStartedAt = cityRevealStartedAt;
  const previousRevealWaitingForVisibleFrame = cityRevealWaitingForVisibleFrame;
  const previousRevealSweepProgress = cityRevealSweepProgress;
  const previousBackplateRevealFactor = cityRevealBackplateRevealFactor;
  const previousRoadGridAlphaFactor = cityRevealRoadGridAlphaFactor;
  const previousWireAlpha = cityRevealWireAlpha;
  try {
    postEnabled = true;
    if (bloomPass) bloomPass.enabled = true;
    if (fxaaPass) fxaaPass.enabled = antialiasMode === 'fxaa';
    syncCityRevealComposerPasses();
    composer.render();
    postProcessingPrewarmStats.rendered = true;
    cityRevealComplete = true;
    cityRevealCompletedAt = performance.now();
    cityRevealStartedAt = 1;
    cityRevealWaitingForVisibleFrame = false;
    cityRevealSweepProgress = 1;
    cityRevealBackplateRevealFactor = 0;
    setCityRevealRoadGridAlphaFactor(0);
    setCityRevealWireAlpha(0);
    syncCityRevealComposerPasses();
    composer.render();
    postProcessingPrewarmStats.postRevealRendered = true;
  } catch {
    postProcessingPrewarmStats.errors += 1;
  } finally {
    cityRevealComplete = previousRevealComplete;
    cityRevealCompletedAt = previousRevealCompletedAt;
    cityRevealStartedAt = previousRevealStartedAt;
    cityRevealWaitingForVisibleFrame = previousRevealWaitingForVisibleFrame;
    cityRevealSweepProgress = previousRevealSweepProgress;
    cityRevealBackplateRevealFactor = previousBackplateRevealFactor;
    setCityRevealRoadGridAlphaFactor(previousRoadGridAlphaFactor);
    setCityRevealWireAlpha(previousWireAlpha);
    postEnabled = previousPostEnabled;
    if (bloomPass) bloomPass.enabled = previousBloomEnabled;
    if (fxaaPass) fxaaPass.enabled = previousFxaaEnabled;
    syncCityRevealComposerPasses();
    postProcessingPrewarmStats.durationMs = Number((performance.now() - started).toFixed(2));
    postProcessingPrewarmStats.texturesAfter = renderer.info.memory?.textures ?? 0;
    performanceSpikeState.lastTextureCount = postProcessingPrewarmStats.texturesAfter;
  }
  return postProcessingPrewarmStats;
}

async function bootSceneWithFinalDefaults() {
  await loadProjectCanonicalDefaults();
  loadStoredControlDefaults();
  applyRetroFutureRevealTimingDefaults();
  applyFullResolutionFsrDefaults();
  applyBridgeFixedDefaults();
  loadStoredPlayerSpawn();
  applyLiveControls();
  buildLabEqualizer({ visible: false });
  setTronNoclip(false, { silent: true });
  applyPlayerSpawn(playerSpawn, false);
  await loadTronRunner();
  buildTronMainPlayerBody();
  await drainTronRunnerCrowdBuildQueue();
  prewarmSkinnedMeshBoneTextures(scene);
  prewarmSceneTextureUploads(scene);
  prewarmPostProcessingPasses();
  await ensureFootstepAudioReady();
  prewarmCityRevealRealPass();
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
  bridgeLinks: bridgeRecords.map((record) => ({
    index: record.index,
    baseZ: record.baseZ,
    visible: Boolean(record.mesh.visible),
    yOffset: readBridgeNumber(record, 'yOffset'),
    x: record.mesh.position.x,
    y: record.mesh.position.y,
    z: record.mesh.position.z,
  })),
  tronRunner: tronRunnerInspect(),
  tronRunnerCrowd: tronRunnerCrowdInspect(),
  tronRunnerIdleCharacter: tronRunnerIdleCharacterInspect(),
  mainPlayerBody: tronMainPlayerBodyInspect(),
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
  cityRevealSkyPassActive: Boolean(cityRevealSkyPass?.enabled),
  ...skyDome.inspectRevealSky(),
  cityRevealSweepMode: CITY_REVEAL_SWEEP_MODE,
  cityRevealFrontZ,
  cityRevealSweepStartZ,
  cityRevealSweepEndZ,
  cityRevealSweepProgress,
  cityRevealArmed: cityRevealArmedAt > 0,
  cityRevealArmedElapsedMs: cityRevealArmedAt > 0 ? Number((performance.now() - cityRevealArmedAt).toFixed(1)) : 0,
  cityRevealMainBuildingSlow: cityRevealMainBuildingSlowDiagnostics(),
  cityRevealRealPrewarm: {
    status: cityRevealRealPrewarmStatus,
    durationMs: Number(cityRevealRealPrewarmMs.toFixed(2)),
    error: cityRevealRealPrewarmError,
    targetSize: CITY_REVEAL_REAL_PREWARM_TARGET_SIZE,
  },
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
  cityRevealRealClipActive: Boolean(cityRevealScenePass?.clipReveal || isCityRevealRealRevealActive()),
  cityRevealComposerPasses: {
    overlay: Boolean(cityRevealOverlayPass?.enabled),
    wireframe: Boolean(cityRevealWirePass?.enabled),
    roadGrid: Boolean(cityRevealRoadGridPass?.enabled),
    wireAa: Boolean(cityRevealWireFxaaPass?.enabled),
    realCity: Boolean(cityRevealScenePass?.enabled),
    mainLedReveal: Boolean(cityRevealMainLedReveal.getPass()?.enabled),
  },
  cityRevealScanGlow: cityRevealScanGlow.inspect(),
  ...cityRevealMainLedReveal.inspect(),
  cityRevealWireAaMode: 'global-fxaa-only',
  cityRevealWireAaActive: Boolean(cityRevealWireFxaaPass?.enabled),
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
window.__tronRunnerInspect = tronRunnerInspect;
window.__tronRevealProfile = cityRevealProfiler.inspect;
window.__tronSpikeInspect = performanceSpikeSummary;
window.__tronCaptureLiveSpawn = captureLivePlayerSpawn;
window.__tronApplyPlayerSpawn = applyPlayerSpawn;
window.__tronPerfInspect = () => ({
  fps: fpsEl.textContent,
  pixelRatio: renderer.getPixelRatio(),
  activePixelRatio,
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
  liveDiagnostics: performanceDiagnosticsSummary(),
  skinnedMeshPrewarm: { ...skinnedMeshPrewarmStats },
  texturePrewarm: { ...sceneTexturePrewarmStats },
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

function performanceLiveEma(previous, next, alpha = PERFORMANCE_LIVE_METRIC_ALPHA) {
  const value = Number(next);
  if (!Number.isFinite(value) || value <= 0) return previous;
  return previous > 0 ? previous + (value - previous) * alpha : value;
}

const PERFORMANCE_LIVE_COMMON_REFRESH_HZ = [30, 60, 75, 90, 120, 144, 165, 240];

function performanceLiveRefreshRateFromRaf(rafDtMs) {
  if (!Number.isFinite(rafDtMs) || rafDtMs <= 0) return 60;
  const hz = 1000 / rafDtMs;
  const common = PERFORMANCE_LIVE_COMMON_REFRESH_HZ;
  let best = common[0];
  let bestDelta = Infinity;
  for (const rate of common) {
    const delta = Math.abs(rate - hz);
    if (delta < bestDelta) {
      best = rate;
      bestDelta = delta;
    }
  }
  return bestDelta <= best * 0.18 ? best : Math.max(1, Math.round(hz));
}

function updatePerformanceLiveRollingMetrics(dt, frameMs, updateMs, renderMs) {
  performanceLiveMetrics.rafDtMsAvg = performanceLiveEma(performanceLiveMetrics.rafDtMsAvg, dt * 1000, 0.08);
  performanceLiveMetrics.frameMsAvg = performanceLiveEma(performanceLiveMetrics.frameMsAvg, frameMs);
  performanceLiveMetrics.updateMsAvg = performanceLiveEma(performanceLiveMetrics.updateMsAvg, updateMs);
  performanceLiveMetrics.renderMsAvg = performanceLiveEma(performanceLiveMetrics.renderMsAvg, renderMs);
  const observedTargetHz = performanceLiveRefreshRateFromRaf(performanceLiveMetrics.rafDtMsAvg);
  performanceLiveMetrics.targetHz = Math.max(performanceLiveMetrics.targetHz || 60, observedTargetHz);
  performanceLiveMetrics.targetMs = 1000 / Math.max(1, performanceLiveMetrics.targetHz);
}

function beginGpuTimerSample() {
  const state = gpuTimerState;
  gpuTimerFrameIndex++;
  if (
    gpuTimerFrameIndex % GPU_TIMER_SAMPLE_STRIDE !== 0 ||
    !state.supported ||
    state.activeQuery ||
    state.pending.length > 8
  ) return;
  try {
    const query = state.webgl2 ? state.gl.createQuery() : state.ext.createQueryEXT();
    if (!query) return;
    if (state.webgl2) state.gl.beginQuery(state.ext.TIME_ELAPSED_EXT, query);
    else state.ext.beginQueryEXT(state.ext.TIME_ELAPSED_EXT, query);
    state.activeQuery = {
      query,
      phase: performanceSpikePhaseLabel(),
      startedAt: performance.now(),
    };
  } catch {
    state.supported = false;
    state.activeQuery = null;
  }
}

function endGpuTimerSample() {
  const state = gpuTimerState;
  if (!state.supported || !state.activeQuery) return;
  try {
    if (state.webgl2) state.gl.endQuery(state.ext.TIME_ELAPSED_EXT);
    else state.ext.endQueryEXT(state.ext.TIME_ELAPSED_EXT);
    state.pending.push(state.activeQuery);
  } catch {
    state.supported = false;
  } finally {
    state.activeQuery = null;
  }
}

function pollGpuTimerSamples() {
  const state = gpuTimerState;
  if (!state.supported || !state.pending.length) return;
  try {
    const disjoint = Boolean(state.gl.getParameter(state.ext.GPU_DISJOINT_EXT));
    while (state.pending.length) {
      const sample = state.pending[0];
      const query = sample?.query || sample;
      const available = state.webgl2
        ? state.gl.getQueryParameter(query, state.gl.QUERY_RESULT_AVAILABLE)
        : state.ext.getQueryObjectEXT(query, state.ext.QUERY_RESULT_AVAILABLE_EXT);
      if (!available) break;
      state.pending.shift();
      const elapsedNs = state.webgl2
        ? state.gl.getQueryParameter(query, state.gl.QUERY_RESULT)
        : state.ext.getQueryObjectEXT(query, state.ext.QUERY_RESULT_EXT);
      if (state.webgl2) state.gl.deleteQuery(query);
      else state.ext.deleteQueryEXT(query);
      if (disjoint || !Number.isFinite(elapsedNs)) {
        state.disjointCount += 1;
        continue;
      }
      state.latestMs = Math.max(0, elapsedNs / 1000000);
      state.latestAt = performance.now();
      state.latestPhase = sample?.phase || '';
      state.sampleCount += 1;
    }
  } catch {
    state.supported = false;
    state.pending.length = 0;
    state.activeQuery = null;
  }
}

function performanceLiveMetricsSummary() {
  const frameMs = Math.max(PERFORMANCE_LIVE_MIN_FRAME_MS, performanceLiveMetrics.frameMsAvg || performanceDiagnosticsTiming.frameMs || 0);
  const updateMs = performanceLiveMetrics.updateMsAvg || performanceDiagnosticsTiming.updateMs || 0;
  const renderMs = performanceLiveMetrics.renderMsAvg || performanceDiagnosticsTiming.renderMs || 0;
  const currentPhase = performanceSpikePhaseLabel();
  const gpuSampleAgeMs = gpuTimerState.latestAt > 0 ? performance.now() - gpuTimerState.latestAt : Infinity;
  const gpuSampleFresh = Boolean(
    gpuTimerState.supported &&
    gpuTimerState.sampleCount > 0 &&
    gpuSampleAgeMs <= GPU_TIMER_SAMPLE_MAX_AGE_MS &&
    (!gpuTimerState.latestPhase || gpuTimerState.latestPhase === currentPhase)
  );
  const gpuMs = gpuSampleFresh ? gpuTimerState.latestMs : 0;
  const targetHz = Math.max(1, performanceLiveMetrics.targetHz || 60);
  const targetMs = performanceLiveMetrics.targetMs || (1000 / targetHz);
  const measuredFps = Number.isFinite(latestMeasuredFps) && latestMeasuredFps > 0 ? latestMeasuredFps : 0;
  const measuredFrameMs = measuredFps > 0 ? 1000 / measuredFps : 0;
  const rafFrameMs = performanceLiveMetrics.rafDtMsAvg > 0 ? performanceLiveMetrics.rafDtMsAvg : 0;
  const presentFrameMs = Math.max(measuredFrameMs, rafFrameMs);
  const presentationDropActive = measuredFps > 0 && measuredFps < targetHz * 0.92;
  const gpuFrameMs = gpuMs > PERFORMANCE_LIVE_MIN_FRAME_MS ? gpuMs : 0;
  const workBottleneckMs = Math.max(frameMs, gpuFrameMs);
  const effectiveFrameMs = Math.max(workBottleneckMs, presentationDropActive ? presentFrameMs : 0);
  const theoreticalFps = 1000 / effectiveFrameMs;
  const workFps = 1000 / workBottleneckMs;
  const gpuTheoreticalFps = gpuMs > PERFORMANCE_LIVE_MIN_FRAME_MS ? 1000 / gpuMs : 0;
  const headroomMs = targetMs - effectiveFrameMs;
  const headroomMultiplier = theoreticalFps / Math.max(1, targetHz);
  const bottleneck = presentationDropActive && presentFrameMs > workBottleneckMs * 1.05
    ? 'present'
    : (gpuFrameMs > frameMs * 1.15 ? 'gpu' : (updateMs > renderMs ? 'cpu' : 'render'));
  return {
    frameMs: Number(frameMs.toFixed(3)),
    updateMs: Number(updateMs.toFixed(3)),
    renderMs: Number(renderMs.toFixed(3)),
    effectiveFrameMs: Number(effectiveFrameMs.toFixed(3)),
    presentFrameMs: presentFrameMs > 0 ? Number(presentFrameMs.toFixed(3)) : 0,
    theoreticalFps: Number(theoreticalFps.toFixed(1)),
    workFps: Number(workFps.toFixed(1)),
    targetHz,
    targetMs: Number(targetMs.toFixed(3)),
    headroomMs: Number(headroomMs.toFixed(3)),
    headroomPct: Number(((headroomMs / Math.max(PERFORMANCE_LIVE_MIN_FRAME_MS, targetMs)) * 100).toFixed(1)),
    headroomMultiplier: Number(headroomMultiplier.toFixed(2)),
    gpuTimerSupported: gpuTimerState.supported,
    gpuMs: gpuMs > 0 ? Number(gpuMs.toFixed(3)) : 0,
    gpuFpsTheoretical: gpuTheoreticalFps > 0 ? Number(gpuTheoreticalFps.toFixed(1)) : 0,
    gpuSamples: gpuTimerState.sampleCount,
    gpuSampleStride: GPU_TIMER_SAMPLE_STRIDE,
    gpuSampleFresh,
    gpuSampleAgeMs: Number.isFinite(gpuSampleAgeMs) ? Number(gpuSampleAgeMs.toFixed(1)) : 0,
    gpuSamplePhase: gpuTimerState.latestPhase,
    phase: currentPhase,
    gpuPending: gpuTimerState.pending.length,
    gpuDisjointCount: gpuTimerState.disjointCount,
    presentationDropActive,
    bottleneck,
  };
}

function performanceSpikePhaseLabel() {
  if (cityRevealWaitingForVisibleFrame) return 'wire-wait';
  if (cityRevealComplete) return 'post';
  if (cityRevealArmedAt > 0 && !cityRevealStartedAt) return 'pre-reveal';
  if (isCityRevealPerformanceCritical()) return 'reveal';
  if (cityRevealStartedAt > 0) return 'reveal-delay';
  return 'pre';
}

function performanceSpikeBottleneckLabel({ rawRafDtMs, frameMs, updateMs, renderMs, liveMetrics }) {
  if (liveMetrics?.presentationDropActive && rawRafDtMs > Math.max(frameMs, 1) * 1.25) return 'present';
  if ((liveMetrics?.gpuMs || 0) > Math.max(frameMs, updateMs, renderMs) * 1.15) return 'gpu';
  if (renderMs > updateMs * 1.2 && renderMs > 8) return 'render';
  if (updateMs > renderMs * 1.2 && updateMs > 8) return 'update';
  if (frameMs > rawRafDtMs * 0.8) return 'main';
  return liveMetrics?.bottleneck || 'mixed';
}

function performanceSpikePrimaryContext() {
  if (isCityRevealPerformanceCritical()) return 'reveal';
  if (isBloomPassActive()) return 'bloom';
  if ((labEqualizerState?.textureFps || 0) > 0) return 'eq';
  if ((tronRunnerCrowdRuntimeStats.cullingVisibleCount || 0) > 0) return 'crowd';
  return 'scene';
}

function formatPerformanceSpikeLabel(spike) {
  if (!spike) return 'none';
  return `${spike.fps}fps ${spike.bottleneck}/${spike.context} ${spike.rafMs}ms`;
}

function performanceSpikeSummary() {
  const recent = performanceSpikeState.records.map((spike) => ({
    index: spike.index,
    ageMs: Math.max(0, Math.round(performance.now() - spike.now)),
    label: formatPerformanceSpikeLabel(spike),
    ...spike,
  }));
  return {
    count: performanceSpikeState.count,
    last: performanceSpikeState.last,
    worst: performanceSpikeState.worst,
    lastLabel: formatPerformanceSpikeLabel(performanceSpikeState.last),
    worstLabel: formatPerformanceSpikeLabel(performanceSpikeState.worst),
    recent,
  };
}

function recordPerformanceSpike({ now, rawRafDtMs, updateMs, renderMs, frameMs }) {
  const workSpike = frameMs >= PERFORMANCE_SPIKE_FRAME_MS_THRESHOLD;
  const rafCouldSpike = rawRafDtMs >= PERFORMANCE_SPIKE_RAF_MS_THRESHOLD;
  const measuredDrop = latestMeasuredFps > 0 && latestMeasuredFps < PERFORMANCE_SPIKE_FPS_THRESHOLD;
  // Cheap guards before the per-frame summary alloc: when no spike is possible, bail without building liveMetrics.
  if (!rafCouldSpike && !measuredDrop) return;
  if (now - performanceSpikeState.lastLoggedAt < PERFORMANCE_SPIKE_MIN_INTERVAL_MS) return;
  const instantaneousFps = rawRafDtMs > 0 ? 1000 / rawRafDtMs : 0;
  const liveMetrics = performanceLiveMetricsSummary();
  const rafDrop = rafCouldSpike && (workSpike || liveMetrics.presentationDropActive);
  if (!rafDrop && !measuredDrop) return;

  const renderInfo = renderer.info.render || {};
  const memoryInfo = renderer.info.memory || {};
  const textureCount = memoryInfo.textures ?? 0;
  const previousTextureCount = performanceSpikeState.lastTextureCount || textureCount;
  const textureDelta = Math.max(0, textureCount - previousTextureCount);
  const context = textureDelta >= 4 ? 'texture-upload' : performanceSpikePrimaryContext();
  const spike = {
    index: performanceSpikeState.count + 1,
    now: performance.now(),
    timelineMs: Math.round(now),
    fps: Number((instantaneousFps || latestMeasuredFps || 0).toFixed(1)),
    measuredFps: Number((latestMeasuredFps || 0).toFixed(1)),
    rafMs: Number(rawRafDtMs.toFixed(1)),
    frameMs: Number(frameMs.toFixed(1)),
    updateMs: Number(updateMs.toFixed(1)),
    renderMs: Number(renderMs.toFixed(1)),
    workSpike,
    gpuMs: liveMetrics.gpuMs > 0 ? Number(liveMetrics.gpuMs.toFixed(1)) : 0,
    bottleneck: performanceSpikeBottleneckLabel({ rawRafDtMs, frameMs, updateMs, renderMs, liveMetrics }),
    context,
    phase: performanceSpikePhaseLabel(),
    composerPasses: cityRevealProfiler.composerPassProfile().estimatedPasses,
    drawCalls: renderInfo.calls ?? 0,
    trianglesK: Math.round((renderInfo.triangles ?? 0) / 1000),
    lines: renderInfo.lines ?? 0,
    textures: textureCount,
    textureDelta,
    bloom: Boolean(isBloomPassActive()),
    bloomTarget: lastBloomTargetKey || '',
    fxaa: Boolean(fxaaPass?.enabled),
    fsr: fsrUpscaleEnabled ? `${Math.round(fsrInternalScale * 100)}%` : 'off',
    revealProgress: Number(cityRevealSweepProgress.toFixed(3)),
    wireAlpha: Number(cityRevealWireAlpha.toFixed(3)),
    crowdVisible: tronRunnerCrowdRuntimeStats.cullingVisibleCount,
    crowdHidden: tronRunnerCrowdRuntimeStats.cullingHiddenCount,
    reflections: tronRunnerCrowdRuntimeStats.activeReflectionCount,
    eq: `${labEqualizerState?.analyserFps || 0}/${labEqualizerState?.textureFps || 0}`,
  };

  performanceSpikeState.count = spike.index;
  performanceSpikeState.lastLoggedAt = now;
  performanceSpikeState.lastTextureCount = textureCount;
  performanceSpikeState.last = spike;
  if (!performanceSpikeState.worst || spike.rafMs > performanceSpikeState.worst.rafMs) {
    performanceSpikeState.worst = spike;
  }
  performanceSpikeState.records.unshift(spike);
  if (performanceSpikeState.records.length > PERFORMANCE_SPIKE_MAX_RECORDS) {
    performanceSpikeState.records.length = PERFORMANCE_SPIKE_MAX_RECORDS;
  }
}

function performanceDiagnosticsTargetSizeFromKey(key) {
  const match = String(key || '').match(/^(\d+)x(\d+)$/);
  const width = match ? Number(match[1]) : 0;
  const height = match ? Number(match[2]) : 0;
  return {
    width,
    height,
    pixels: width * height,
    key: key || '',
  };
}

function performanceDiagnosticsCanvasSummary() {
  renderer.getDrawingBufferSize(performanceDiagnosticsDrawingBufferSize);
  const canvas = renderer.domElement;
  const width = performanceDiagnosticsDrawingBufferSize.x;
  const height = performanceDiagnosticsDrawingBufferSize.y;
  return {
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    canvasCssWidth: canvas.clientWidth || window.innerWidth,
    canvasCssHeight: canvas.clientHeight || window.innerHeight,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    drawingBufferWidth: width,
    drawingBufferHeight: height,
    canvasPixels: Math.round(width * height),
  };
}

function performanceDiagnosticsPixelPipeline() {
  const effectivePixelRatioRequest = effectivePixelRatioForDevice(requestedPixelRatio);
  const effectiveRenderScale = effectiveRenderScaleForDevice(manualRenderScale);
  const dynamicPixelRatioBeforeClamp = Math.max(
    MIN_DYNAMIC_PIXEL_RATIO,
    effectivePixelRatioRequest * effectiveRenderScale * dynamicQualityScale
  );
  const revealPixelRatioCap = cityRevealPerformanceProfileActive
    ? CITY_REVEAL_PERFORMANCE_PIXEL_RATIO_CAP
    : MAX_RENDER_PIXEL_RATIO;
  return {
    requestedPixelRatioRaw: Number(requestedPixelRatio.toFixed(2)),
    effectivePixelRatioRequest: Number(effectivePixelRatioRequest.toFixed(2)),
    manualRenderScaleRaw: Number(manualRenderScale.toFixed(2)),
    effectiveRenderScale: Number(effectiveRenderScale.toFixed(2)),
    dynamicPixelRatioBeforeClamp: Number(dynamicPixelRatioBeforeClamp.toFixed(3)),
    dynamicPixelRatioAfterPreRevealCap: Number(Math.min(dynamicPixelRatioBeforeClamp, revealPixelRatioCap).toFixed(3)),
    dynamicPixelRatioAfterRevealCap: Number(Math.min(dynamicPixelRatioBeforeClamp, revealPixelRatioCap).toFixed(3)),
    activePixelRatio: Number(activePixelRatio.toFixed(3)),
    composerPixelRatio: Number(effectiveComposerPixelRatio().toFixed(3)),
    fsrUpscaleEnabled,
    fsrInternalScale: Number(fsrInternalScale.toFixed(2)),
    fsrSharpness: Number(fsrSharpness.toFixed(2)),
    minDynamicPixelRatio: MIN_DYNAMIC_PIXEL_RATIO,
    maxRenderPixelRatio: MAX_RENDER_PIXEL_RATIO,
    preRevealPerformanceActive: cityRevealPerformanceProfileActive,
    preRevealPixelRatioCap: revealPixelRatioCap,
    revealPerformanceActive: cityRevealPerformanceProfileActive,
    revealPixelRatioCap,
  };
}

function performanceDiagnosticsComposerSummary() {
  const profile = cityRevealProfiler.composerPassProfile();
  const activePasses = Object.entries(profile.passes)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);
  return {
    active: profile.composer,
    passCount: activePasses.length,
    activePasses,
    estimatedPasses: profile.estimatedPasses,
    composerPixelRatio: Number(effectiveComposerPixelRatio().toFixed(3)),
    fsrPreset: controlEls.fsrPreset?.value || 'custom',
    fsrUpscaleEnabled,
    fsrInternalScale: Number(fsrInternalScale.toFixed(2)),
    fsrSharpness: Number(fsrSharpness.toFixed(2)),
    fsrSharpenMode: 'rcas-like-adaptive',
    fsrUpscaleShaderEnabled: Boolean(fsrUpscalePass?.enabled),
  };
}

function performanceDiagnosticsSummary(measuredFps = latestMeasuredFps) {
  const eq = labEqualizerState || {};
  const mobileProfile = mobilePerformanceProfileInspect();
  const canvas = performanceDiagnosticsCanvasSummary();
  const pixelPipeline = performanceDiagnosticsPixelPipeline();
  const composerSummary = performanceDiagnosticsComposerSummary();
  const liveMetrics = performanceLiveMetricsSummary();
  const renderInfo = renderer.info.render || {};
  const memoryInfo = renderer.info.memory || {};
  const bloomTarget = performanceDiagnosticsTargetSizeFromKey(lastBloomTargetKey);
  const fxaaTarget = performanceDiagnosticsTargetSizeFromKey(lastFxaaTargetKey);
  const fsrTarget = performanceDiagnosticsTargetSizeFromKey(lastFsrTargetKey);
  const spikes = performanceSpikeSummary();
  return {
    fps: Number.isFinite(measuredFps) ? Number(measuredFps.toFixed(1)) : 0,
    renderScale: Number(activePixelRatio.toFixed(2)),
    qualityScale: Number(dynamicQualityScale.toFixed(2)),
    viewport: canvas.viewport,
    viewportWidth: canvas.viewportWidth,
    viewportHeight: canvas.viewportHeight,
    devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
    requestedPixelRatio: Number(requestedPixelRatio.toFixed(2)),
    manualRenderScale: Number(manualRenderScale.toFixed(2)),
    mobileProfileActive: mobileProfile.active,
    mobileProfileMode: mobileProfile.mode,
    mobileActivationReasons: mobileProfile.activationReasons,
    mobileMediaQueryMatches: mobileProfile.mediaQueryMatches,
    mobileTouchPoints: mobileProfile.touchPoints,
    mobileWidthActive: mobileProfile.widthActive,
    canvasCssWidth: canvas.canvasCssWidth,
    canvasCssHeight: canvas.canvasCssHeight,
    canvasWidth: canvas.canvasWidth,
    canvasHeight: canvas.canvasHeight,
    drawingBufferWidth: canvas.drawingBufferWidth,
    drawingBufferHeight: canvas.drawingBufferHeight,
    canvasPixels: canvas.canvasPixels,
    pixelPipeline,
    composerActive: composerSummary.active,
    composerPassCount: composerSummary.passCount,
    composerActivePasses: composerSummary.activePasses,
    composerEstimatedPasses: composerSummary.estimatedPasses,
    composerPixelRatio: composerSummary.composerPixelRatio,
    fsrPreset: composerSummary.fsrPreset,
    fsrUpscaleEnabled: composerSummary.fsrUpscaleEnabled,
    fsrInternalScale: composerSummary.fsrInternalScale,
    fsrSharpness: composerSummary.fsrSharpness,
    fsrSharpenMode: composerSummary.fsrSharpenMode,
    fsrUpscaleShaderEnabled: composerSummary.fsrUpscaleShaderEnabled,
    fsrTarget,
    bloomEnabled,
    bloomPassEnabled: Boolean(bloomPass?.enabled),
    bloomRevealBypassed: isBloomRevealBypassed(),
    bloomRevealBypassActive: shouldBypassBloomForRevealPerformance(),
    bloomActive: isBloomPassActive(),
    bloomResolutionScale: Number(bloomResolutionScale.toFixed(3)),
    bloomTarget,
    fxaaEnabled: Boolean(fxaaPass?.enabled),
    fxaaTarget,
    drawCalls: renderInfo.calls ?? 0,
    triangles: renderInfo.triangles ?? 0,
    lines: renderInfo.lines ?? 0,
    points: renderInfo.points ?? 0,
    geometries: memoryInfo.geometries ?? 0,
    textures: memoryInfo.textures ?? 0,
    programs: renderer.info.programs?.length ?? 0,
    staticCityCullEnabled: staticCityCullStats.enabled,
    staticCityCullTotal: staticCityCullStats.total,
    staticCityCullVisible: staticCityCullStats.visible,
    staticCityCullHidden: staticCityCullStats.hidden,
    staticCityCullBuildingsVisible: staticCityCullStats.buildingsVisible,
    staticCityCullBuildingsTotal: staticCityCullStats.buildingsTotal,
    staticCityCullBridgesVisible: staticCityCullStats.bridgesVisible,
    staticCityCullBridgesTotal: staticCityCullStats.bridgesTotal,
    staticCityCullBoardsVisible: staticCityCullStats.boardsVisible,
    staticCityCullBoardsTotal: staticCityCullStats.boardsTotal,
    staticCityCullLedVisible: staticCityCullStats.ledInstancesVisible,
    staticCityCullLedTotal: staticCityCullStats.ledInstancesTotal,
    staticCityCullDoorInstancesVisible: staticCityCullStats.doorInstancesVisible,
    frameMs: Number(performanceDiagnosticsTiming.frameMs.toFixed(2)),
    updateMs: Number(performanceDiagnosticsTiming.updateMs.toFixed(2)),
    renderMs: Number(performanceDiagnosticsTiming.renderMs.toFixed(2)),
    theoreticalFps: liveMetrics.theoreticalFps,
    workFps: liveMetrics.workFps,
    targetHz: liveMetrics.targetHz,
    targetMs: liveMetrics.targetMs,
    headroomMs: liveMetrics.headroomMs,
    headroomPct: liveMetrics.headroomPct,
    headroomMultiplier: liveMetrics.headroomMultiplier,
    rollingFrameMs: liveMetrics.frameMs,
    rollingUpdateMs: liveMetrics.updateMs,
    rollingRenderMs: liveMetrics.renderMs,
    effectiveFrameMs: liveMetrics.effectiveFrameMs,
    presentFrameMs: liveMetrics.presentFrameMs,
    gpuTimerSupported: liveMetrics.gpuTimerSupported,
    gpuMs: liveMetrics.gpuMs,
    gpuFpsTheoretical: liveMetrics.gpuFpsTheoretical,
    gpuSamples: liveMetrics.gpuSamples,
    gpuSampleStride: liveMetrics.gpuSampleStride,
    gpuSampleFresh: liveMetrics.gpuSampleFresh,
    gpuSampleAgeMs: liveMetrics.gpuSampleAgeMs,
    gpuSamplePhase: liveMetrics.gpuSamplePhase,
    phase: liveMetrics.phase,
    gpuPending: liveMetrics.gpuPending,
    gpuDisjointCount: liveMetrics.gpuDisjointCount,
    presentationDropActive: liveMetrics.presentationDropActive,
    bottleneck: liveMetrics.bottleneck,
    crowdVisible: tronRunnerCrowdRuntimeStats.cullingVisibleCount,
    crowdHidden: tronRunnerCrowdRuntimeStats.cullingHiddenCount,
    crowdThinkMs: Number(tronRunnerCrowdRuntimeStats.lastThinkMs.toFixed(2)),
    reflections: tronRunnerCrowdRuntimeStats.activeReflectionCount,
    reflectionBudget: tronRunnerCrowdRuntimeStats.reflectionBudgetLimit,
    eqAnalyserFps: eq.analyserFps || 0,
    eqTextureFps: eq.textureFps || 0,
    revealFreezeFrames: tronRunnerCrowdRuntimeStats.performanceFreezeFrameCount,
    spikeCount: spikes.count,
    spikeLast: spikes.last,
    spikeWorst: spikes.worst,
    spikeLastLabel: spikes.lastLabel,
    spikeWorstLabel: spikes.worstLabel,
    spikeRecent: spikes.recent,
  };
}

function setPerfLiveText(el, value, stateClass = '') {
  if (!el) return;
  el.textContent = value;
  const row = el.closest?.('.perf-live-row');
  if (!row) return;
  row.classList.toggle('perf-live-warn', stateClass === 'warn');
  row.classList.toggle('perf-live-bad', stateClass === 'bad');
  row.classList.toggle('perf-live-muted', stateClass === 'muted');
}

function updatePerformanceLiveOverlay(stats) {
  const headroomState = stats.headroomMultiplier < 1.05
    ? 'bad'
    : (stats.headroomMultiplier < 1.35 ? 'warn' : '');
  const theoreticalState = stats.presentationDropActive ? 'bad' : '';
  const gpuText = stats.gpuTimerSupported
    ? (stats.gpuMs > 0 ? `${stats.gpuMs.toFixed(1)}ms ${stats.gpuFpsTheoretical.toFixed(0)}fps` : 'waiting')
    : 'n/a';
  setPerfLiveText(perfTheoreticalFpsEl, `${stats.theoreticalFps.toFixed(0)} fps`, theoreticalState);
  setPerfLiveText(perfHeadroomEl, `${stats.headroomMultiplier.toFixed(2)}x @${stats.targetHz} ${stats.bottleneck}`, headroomState);
  setPerfLiveText(
    perfFrameMsEl,
    stats.presentationDropActive
      ? `${stats.rollingFrameMs.toFixed(1)} / ${stats.presentFrameMs.toFixed(1)} ms`
      : `${stats.rollingFrameMs.toFixed(1)} ms`,
  );
  setPerfLiveText(perfCpuRenderMsEl, `${stats.rollingUpdateMs.toFixed(1)} / ${stats.rollingRenderMs.toFixed(1)} ms`);
  setPerfLiveText(perfGpuMsEl, gpuText, stats.gpuTimerSupported ? '' : 'muted');
  const lastSpikeAge = stats.spikeLast ? Math.max(0, performance.now() - stats.spikeLast.now) : Infinity;
  const spikeState = !stats.spikeLast
    ? 'muted'
    : (lastSpikeAge < 2500 ? (stats.spikeLast.fps < 45 ? 'bad' : 'warn') : 'muted');
  setPerfLiveText(perfSpikeEl, stats.spikeLastLabel || 'none', spikeState);
  setPerfLiveText(
    perfResolutionEl,
    `${stats.drawingBufferWidth}x${stats.drawingBufferHeight} ${stats.renderScale.toFixed(2)}x / post ${stats.composerPixelRatio.toFixed(2)}x`
  );
  setPerfLiveText(perfPassDrawEl, `${stats.composerActive ? stats.composerPassCount : 0} / ${stats.drawCalls}`);
  setPerfLiveText(perfTriFxEl, `${Math.round(stats.triangles / 1000)}k ${stats.bloomActive ? 'B' : '-'}${stats.fxaaEnabled ? 'A' : '-'}`);
}

function updatePerformanceDiagnostics(measuredFps = latestMeasuredFps) {
  const stats = performanceDiagnosticsSummary(measuredFps);
  updatePerformanceLiveOverlay(stats);
  if (performanceDiagnosticsEl) {
    performanceDiagnosticsEl.textContent = [
      `FPS ${stats.fps.toFixed(1)}`,
      `teo ${stats.theoreticalFps.toFixed(0)}`,
      `work ${stats.workFps.toFixed(0)}`,
      `head ${stats.headroomMultiplier.toFixed(2)}x`,
      `bneck ${stats.bottleneck}`,
      `gpu ${stats.gpuTimerSupported ? `${stats.gpuMs.toFixed(1)}ms` : 'n/a'}`,
      `render ${stats.renderScale.toFixed(2)}x`,
      `fsr ${stats.fsrUpscaleEnabled ? `${Math.round(stats.fsrInternalScale * 100)}%` : 'off'}`,
      `qualita ${stats.qualityScale.toFixed(2)}`,
      `px ${Math.round(stats.canvasPixels / 1000)}k`,
      `draw ${stats.drawCalls}`,
      `tri ${Math.round(stats.triangles / 1000)}k`,
      `cityCull ${stats.staticCityCullVisible}/${stats.staticCityCullTotal}`,
      `ledCull ${stats.staticCityCullLedVisible}/${stats.staticCityCullLedTotal}`,
      `frame ${stats.frameMs.toFixed(1)}ms`,
      `render ${stats.renderMs.toFixed(1)}ms`,
      `revealCap ${stats.pixelPipeline.revealPerformanceActive ? 'on' : 'off'}`,
      `crowd ${stats.crowdVisible}/${tronRunnerCrowd.length}`,
      `hidden ${stats.crowdHidden}`,
      `think ${stats.crowdThinkMs.toFixed(2)}ms`,
      `riflessi ${stats.reflections}/${stats.reflectionBudget}`,
      `fx ${stats.composerActive ? stats.composerPassCount : 0}`,
      `bloom ${stats.bloomActive ? stats.bloomTarget.key || 'on' : 'off'}`,
      `eq ${stats.eqAnalyserFps}Hz/${stats.eqTextureFps}Hz`,
      `spike ${stats.spikeLastLabel}`,
      `worst ${stats.spikeWorstLabel}`,
    ].join(' | ');
  }
  if (mobilePerformanceDiagnosticsEl) {
    mobilePerformanceDiagnosticsEl.hidden = !stats.mobileProfileActive;
    if (stats.mobileProfileActive) {
      mobilePerformanceDiagnosticsEl.textContent = [
        `FPS ${stats.fps.toFixed(1)} | q ${stats.qualityScale.toFixed(2)} | pr ${stats.renderScale.toFixed(2)}`,
        `${stats.viewport} dpr ${stats.devicePixelRatio} req ${stats.requestedPixelRatio} px ${Math.round(stats.canvasPixels / 1000)}k`,
        `draw ${stats.drawCalls} tri ${Math.round(stats.triangles / 1000)}k tex ${stats.textures}`,
        `cityCull ${stats.staticCityCullVisible}/${stats.staticCityCullTotal} buildings ${stats.staticCityCullBuildingsVisible}/${stats.staticCityCullBuildingsTotal}`,
        `ledCull ${stats.staticCityCullLedVisible}/${stats.staticCityCullLedTotal} doors ${stats.staticCityCullDoorInstancesVisible}`,
        `fx ${stats.composerActive ? stats.composerPassCount : 0} bloom ${stats.bloomActive ? stats.bloomTarget.key || 'on' : 'off'} aa ${stats.fxaaEnabled ? 'on' : 'off'}`,
        `crowd ${stats.crowdVisible}/${tronRunnerCrowd.length} refl ${stats.reflections}/${stats.reflectionBudget} freeze ${stats.revealFreezeFrames}`,
        `frame ${stats.frameMs.toFixed(1)} update ${stats.updateMs.toFixed(1)} render ${stats.renderMs.toFixed(1)}ms`,
        `teo ${stats.theoreticalFps.toFixed(0)} work ${stats.workFps.toFixed(0)} head ${stats.headroomMultiplier.toFixed(2)}x gpu ${stats.gpuTimerSupported ? `${stats.gpuMs.toFixed(1)}ms` : 'n/a'} ${stats.bottleneck}`,
        `spike ${stats.spikeLastLabel} worst ${stats.spikeWorstLabel}`,
      ].join('\n');
    }
  }
}

// ---------- Atmospheric particles (extracted -> atmosphere-particles.js) ----------
initAtmosphereParticles({ getScene: () => scene, cyan: PAL.cyan });

// GREETER_BUBBLE_DURATION_MS stays here, not in ./speech-bubbles.js: it is consumed by the greeter
// talk-trigger state machine (setGreeterBubble) that lives in main.js. The speech-bubble RENDERING
// (greeter welcome sprite + crowd ambient sprite pool) moved to ./speech-bubbles.js.
const GREETER_BUBBLE_DURATION_MS = 3000;   // welcome message dissolves after this

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
    updatePerformanceDiagnostics(measuredFps);
    tunePerformanceBudget(measuredFps);
    fpsAccum = 0; fpsFrames = 0; fpsLast = now;
  }
  removeViewMotionOffset();
  const droneIntroWasActive = updateDroneIntroFlight(now);
  if (!droneIntroWasActive) applyMovement(dt);
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
    if (shouldUpdateTronRunnerSourceCharacter()) updateTronRunner(dt);
    if (postRevealPerfIsolationState.crowd) {
      updateTronRunnerCrowd(dt);
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
  syncCityRevealPerformanceProfile();
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
    updateTronRunnerReveal(now);
    updateTronRunnerBeatPulse();
    updateTronMainPlayerBody(dt);
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
  pollGpuTimerSamples();
  beginGpuTimerSample();
  try {
    renderCityRevealCompositeFrame();
  } finally {
    endGpuTimerSample();
  }
  const frameRenderInfo = captureRevealRenderInfo ? { ...renderer.info.render } : null;
  if (captureRevealRenderInfo) renderer.info.autoReset = previousRendererInfoAutoReset;
  const frameEndedAt = performance.now();
  performanceDiagnosticsTiming.updateMs = renderStartedAt - frameStartedAt;
  performanceDiagnosticsTiming.renderMs = frameEndedAt - renderStartedAt;
  performanceDiagnosticsTiming.frameMs = frameEndedAt - frameStartedAt;
  updatePerformanceLiveRollingMetrics(dt, performanceDiagnosticsTiming.frameMs, performanceDiagnosticsTiming.updateMs, performanceDiagnosticsTiming.renderMs);
  recordPerformanceSpike({
    now,
    rawRafDtMs,
    updateMs: performanceDiagnosticsTiming.updateMs,
    renderMs: performanceDiagnosticsTiming.renderMs,
    frameMs: performanceDiagnosticsTiming.frameMs,
  });
  cityRevealProfiler.recordFrame({
    now,
    dt,
    updateMs: performanceDiagnosticsTiming.updateMs,
    renderMs: performanceDiagnosticsTiming.renderMs,
    frameMs: performanceDiagnosticsTiming.frameMs,
    renderInfo: frameRenderInfo,
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
