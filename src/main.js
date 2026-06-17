import * as THREE from 'three';
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
  CITY_REVEAL_PROFILE_MAX_SAMPLES,
  CITY_REVEAL_PROFILE_SAMPLE_MS,
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
} from './config.js';
import { TRON_FSR_UPSCALE_SHADER } from './shaders.js';
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
} from './controls.js';
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
} from './characters.js';
import {
  TRON_RUNNER_CROWD_COLOR_PLAN,
  TRON_RUNNER_CROWD_COLOR_PRESETS,
} from './character-colors.js';
import {
  createTronRunnerCrowdMemberRecord,
  fitTronRunnerModel as fitTronRunnerModelCore,
  makeTronRunnerActionSet,
  poseTronRunnerIdleCharacterArmsCrossed as poseTronRunnerIdleCharacterArmsCrossedCore,
} from './character-build.js';
import {
  resolveTronRunnerCrowdCollision as resolveTronRunnerCrowdCollisionCore,
  resolveTronRunnerRoundedCollider,
  tronRunnerCrowdBuildingCollisionDiagnostic as tronRunnerCrowdBuildingCollisionDiagnosticCore,
  tronRunnerCrowdColliderLabel,
  tronRunnerCrowdPointInsideRoute as tronRunnerCrowdPointInsideRouteCore,
} from './character-collision.js';
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
} from './character-crowd.js';
import {
  makeTronMainPlayerBodyLedMaterial,
  makeTronMainPlayerBodySuitMaterial,
  makeTronRunnerCrowdSuitMaterial as createTronRunnerCrowdSuitMaterial,
  makeTronRunnerReflectionBodyMaterial as createTronRunnerReflectionBodyMaterial,
  makeTronRunnerReflectionLedMaterial as createTronRunnerReflectionLedMaterial,
  makeTronRunnerReflectionMaterial as createTronRunnerReflectionMaterial,
} from './character-materials.js';
import {
  applyTronRunnerCrowdReflectionState,
  emptyTronRunnerCrowdReflection,
  tronRunnerCrowdPostRevealReflectionRampLimit as tronRunnerCrowdPostRevealReflectionRampLimitCore,
  updateTronRunnerCrowdReflectionBudget as updateTronRunnerCrowdReflectionBudgetCore,
} from './character-reflections.js';
import {
  countBy,
  inspectTronRunnerMaterials,
  maxBy,
  minBy,
  sideStreetCoverage as buildSideStreetCoverage,
  sideStreetGroupedSegments as buildSideStreetGroupedSegments,
  sumBy,
  tronRunnerIdleCharacterInspect as tronRunnerIdleCharacterInspectCore,
} from './character-inspect.js';
import {
  tronRunnerWalkCycleFootstep as tronRunnerWalkCycleFootstepCore,
} from './character-footsteps.js';
import {
  computeTronRunnerEffectiveAnimationSpeed,
  syncTronRunnerWalkCycleToDistance as syncTronRunnerWalkCycleToDistanceCore,
  tronRunnerCrowdGridCoord as tronRunnerCrowdGridCoordCore,
  tronRunnerCrowdGridKey,
} from './character-movement.js';
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
} from './character-routes.js';
import {
  makeTronRunnerShadowTexture,
  makeTronRunnerSuitEmissiveTexture,
  makeTronRunnerSuitLedMaskTexture,
  makeTronRunnerSuitTexture,
} from './character-textures.js';
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
} from './runner-state.js';
import {
  resetTronRunnerAutonomy,
  switchTronRunnerAction as switchTronRunnerActionCore,
} from './runner-controller.js';
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
  createTronSynthNoiseBuffer,
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
} from './audio.js';
import {
  footstepInverseDistanceGain,
  pickFootstepSample as pickFootstepSampleCore,
  setFootstepAudioParam,
  setFootstepPannerPosition,
} from './footstep-audio.js';
import {
  mountSideFacadeLedControls as mountSideFacadeLedControlsCore,
} from './facade-led-controls.js';
import {
  effectiveBloomScaleForDevice as effectiveBloomScaleForDeviceCore,
  effectivePixelRatioForDevice as effectivePixelRatioForDeviceCore,
  effectiveRenderScaleForDevice as effectiveRenderScaleForDeviceCore,
  mobilePerformanceProfileActive as mobilePerformanceProfileActiveCore,
  mobilePerformanceProfileState as mobilePerformanceProfileStateCore,
} from './performance-mobile.js';
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
} from './city-boards.js';
import {
  initStaticCityCulling,
  staticCityCullStats,
  updateStaticCityCulling,
} from './static-city-culling.js';
import {
  applyBridgeFixedDefaults,
  initBridgeControls,
  readBridgeNumber,
  readBridgeVisible,
  renderBridgeControls,
  updateBridgeControlOutputs,
} from './bridge-controls.js';
import {
  applyWelcomeWindowInputMode as applyWelcomeWindowInputModeCore,
  dismissWelcomeWindow as dismissWelcomeWindowCore,
  resetWelcomeWindowMotion as resetWelcomeWindowMotionCore,
  setupWelcomeWindowMotion,
  triggerWelcomeWindowTouch as triggerWelcomeWindowTouchCore,
  welcomeWindowUsesTouchPrompt as welcomeWindowUsesTouchPromptCore,
  welcomeWindowVisible as welcomeWindowVisibleCore,
} from './welcome-ui.js';
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
} from './equalizer.js';

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
const cityRevealProfileState = {
  running: false,
  completed: false,
  startedAt: 0,
  lastSampleAt: 0,
  frameCount: 0,
  samples: [],
  bucket: null,
  lastFrame: null,
};

// Postprocessing (optional bloom + FXAA). Best-effort — fallback to plain renderer if any module fails.
let composer = null, bloomPass = null, fxaaPass = null, fsrUpscalePass = null;
let postEnabled = true;
let hexUpdateEnabled = true;
let hexRoadUpdateFrame = 0;
let hexRoadAccumulatedDt = 0;
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
const boundaryErrorOverlay = document.getElementById('boundary-error-overlay');
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
let tronNoclipEnabled = false;
const PITCH_LIMIT = Math.PI * 0.49;
const keys = Object.create(null);
const DRONE_INTRO_DURATION_MS = 5600;
const DRONE_INTRO_AUTO_DELAY_MS = 3000;
const DRONE_INTRO_AUTO_ENABLED = false;
const DEMO_START_KEY = 'Space';
const DRONE_INTRO_TRIGGER_KEY = DEMO_START_KEY;
const DRONE_INTRO_APPROACH_GAP = 18;
const DRONE_INTRO_LOOK_HEIGHT = 22;
const droneIntroStart = new THREE.Vector3();
const droneIntroTarget = new THREE.Vector3();
const droneIntroLookAt = new THREE.Vector3();
let droneIntroAutoTimer = 0;
let droneIntroAutoTriggered = false;
let backspaceIntroTriggered = false;
let cameraCollisionUnlockedByBackspace = false;
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
};
let pointerLocked = false;
let dragging = false;
let dragCandidate = false;
let unlockedMouseLookActive = false;
let lastX = 0, lastY = 0;
let lookTouchIdentifier = null;
let dragStartX = 0, dragStartY = 0;
let suppressNextPointerLockMove = false;
let pointerLockLookEnabledAt = 0;
let pointerClickLookSuppressedUntil = 0;
let ignoredPointerLookMoves = 0;
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
const mobileLandscapeQuery = window.matchMedia('(orientation: landscape)');
const MOBILE_MOVEMENT_PAD_RADIUS = 58;
const MOBILE_MOVEMENT_PAD_DEADZONE = 0.12;
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
const mobileTouchControlsState = {
  landscape: false,
  fullscreen: {
    supported: false,
    active: false,
    landscape: false,
    lastAttemptSource: '',
    lastAttemptAt: 0,
    attemptId: 0,
    lastResult: 'idle',
    lastError: '',
  },
  movement: {
    enabled: false,
    active: false,
    pointerId: null,
    x: 0,
    z: 0,
    magnitude: 0,
  },
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

function isMobileLandscapeMode() {
  return Boolean(mobilePerformanceProfileActive() && (mobileLandscapeQuery.matches || window.innerWidth > window.innerHeight));
}

function currentFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function requestFullscreenSupported() {
  const target = document.documentElement;
  return Boolean(target.requestFullscreen || target.webkitRequestFullscreen);
}

function updateMobileTouchControlsState() {
  const landscape = isMobileLandscapeMode();
  mobileTouchControlsState.landscape = landscape;
  mobileTouchControlsState.fullscreen.supported = requestFullscreenSupported();
  mobileTouchControlsState.fullscreen.active = Boolean(currentFullscreenElement());
  mobileTouchControlsState.fullscreen.landscape = landscape;
  mobileTouchControlsState.movement.enabled = Boolean(landscape && mobileMovementPadEl);
  document.body.classList.toggle('mobile-landscape', mobileTouchControlsState.movement.enabled);
  if (!mobileTouchControlsState.movement.enabled) resetMobileMovementPad();
  return mobileTouchControlsState;
}

function requestLandscapeFullscreen(source = 'auto') {
  updateMobileTouchControlsState();
  const fs = mobileTouchControlsState.fullscreen;
  const attemptId = fs.attemptId + 1;
  fs.attemptId = attemptId;
  fs.lastAttemptSource = source;
  fs.lastAttemptAt = performance.now();
  fs.lastError = '';
  if (!fs.landscape) {
    fs.lastResult = 'skipped-not-landscape';
    return Promise.resolve(false);
  }
  if (fs.active) {
    fs.lastResult = 'already-fullscreen';
    return Promise.resolve(true);
  }
  const target = document.documentElement;
  const request = target.requestFullscreen || target.webkitRequestFullscreen;
  if (!request) {
    fs.lastResult = 'unsupported';
    return Promise.resolve(false);
  }
  try {
    const requestArgs = target.requestFullscreen ? [{ navigationUI: 'hide' }] : [];
    const result = request.call(target, ...requestArgs);
    if (result?.then) {
      return result.then(() => {
        if (fs.attemptId !== attemptId) return Boolean(currentFullscreenElement());
        fs.lastResult = 'entered';
        fs.lastError = '';
        updateMobileTouchControlsState();
        return true;
      }).catch((error) => {
        if (fs.attemptId !== attemptId) return Boolean(currentFullscreenElement());
        fs.lastResult = 'blocked';
        fs.lastError = error?.message || String(error);
        updateMobileTouchControlsState();
        return false;
      });
    }
    fs.lastResult = 'requested';
    updateMobileTouchControlsState();
    return Promise.resolve(true);
  } catch (error) {
    fs.lastResult = 'blocked';
    fs.lastError = error?.message || String(error);
    updateMobileTouchControlsState();
    return Promise.resolve(false);
  }
}

function resetMobileMovementPad() {
  mobileTouchControlsState.movement.active = false;
  mobileTouchControlsState.movement.pointerId = null;
  mobileTouchControlsState.movement.x = 0;
  mobileTouchControlsState.movement.z = 0;
  mobileTouchControlsState.movement.magnitude = 0;
  if (mobileMovementKnobEl) {
    mobileMovementKnobEl.style.transform = 'translate3d(-50%, -50%, 0)';
  }
}

function updateMobileMovementPadFromPoint(clientX, clientY) {
  if (!mobileMovementPadEl || !mobileMovementKnobEl) return;
  const rect = mobileMovementPadEl.getBoundingClientRect();
  const centerX = rect.left + rect.width * 0.5;
  const centerY = rect.top + rect.height * 0.5;
  const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.5);
  const rawX = (clientX - centerX) / radius;
  const rawY = (clientY - centerY) / radius;
  const length = Math.min(1, Math.hypot(rawX, rawY));
  const deadzone = MOBILE_MOVEMENT_PAD_DEADZONE;
  const normalized = length <= deadzone ? 0 : (length - deadzone) / (1 - deadzone);
  const unitX = length > 0 ? rawX / length : 0;
  const unitY = length > 0 ? rawY / length : 0;
  const x = unitX * normalized;
  const y = unitY * normalized;
  mobileTouchControlsState.movement.x = x;
  mobileTouchControlsState.movement.z = y;
  mobileTouchControlsState.movement.magnitude = normalized;
  const knobX = x * MOBILE_MOVEMENT_PAD_RADIUS * 0.54;
  const knobY = y * MOBILE_MOVEMENT_PAD_RADIUS * 0.54;
  mobileMovementKnobEl.style.transform = `translate3d(calc(-50% + ${knobX.toFixed(1)}px), calc(-50% + ${knobY.toFixed(1)}px), 0)`;
}

function mobileTouchControlsInspect() {
  updateMobileTouchControlsState();
  return {
    landscape: mobileTouchControlsState.landscape,
    fullscreen: { ...mobileTouchControlsState.fullscreen },
    movement: {
      ...mobileTouchControlsState.movement,
      pointerId: mobileTouchControlsState.movement.pointerId,
      x: Number(mobileTouchControlsState.movement.x.toFixed(3)),
      z: Number(mobileTouchControlsState.movement.z.toFixed(3)),
      magnitude: Number(mobileTouchControlsState.movement.magnitude.toFixed(3)),
    },
    resolution: performanceDiagnosticsCanvasSummary(),
  };
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
const TRON_DISC_CURSOR_IDLE_SPIN = 78;
const TRON_DISC_CURSOR_MAX_SPIN = 28500;
const TRON_DISC_CURSOR_SPEED_GAIN = 12.8;
const tronDiscCursorState = {
  x: -100,
  y: -100,
  lastX: Number.NaN,
  lastY: Number.NaN,
  lastAt: 0,
  pointerInside: false,
  visible: false,
  speed: 0,
  rotationDeg: 0,
  spinDegPerSec: TRON_DISC_CURSOR_IDLE_SPIN,
  targetSpinDegPerSec: TRON_DISC_CURSOR_IDLE_SPIN,
};

function isTronDiscCursorSurfaceEvent(event) {
  if (!tronDiscCursor || !event || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return false;
  const target = event.target;
  if (target?.closest?.('#hud-controls, #settings-toggle')) return false;
  const rect = lockEl.getBoundingClientRect();
  return event.clientX >= rect.left
    && event.clientX <= rect.right
    && event.clientY >= rect.top
    && event.clientY <= rect.bottom;
}

function setTronDiscCursorVisible(visible) {
  const shouldShow = Boolean(visible && !pointerLocked && !unlockedMouseLookActive);
  tronDiscCursorState.visible = shouldShow;
  document.body.classList.toggle('tron-disc-cursor-visible', shouldShow);
  tronDiscCursor?.classList.toggle('is-hidden', !shouldShow);
  if (tronDiscCursor) {
    tronDiscCursor.style.opacity = shouldShow ? '1' : '0';
    tronDiscCursor.style.visibility = shouldShow ? 'visible' : 'hidden';
  }
}

function handleTronDiscCursorMove(event) {
  if (!tronDiscCursor) return;
  const inside = isTronDiscCursorSurfaceEvent(event);
  tronDiscCursorState.pointerInside = inside;
  if (!inside) {
    setTronDiscCursorVisible(false);
    return;
  }
  const now = performance.now();
  const dtMs = Math.max(1, now - (tronDiscCursorState.lastAt || now));
  const hasLast = Number.isFinite(tronDiscCursorState.lastX) && Number.isFinite(tronDiscCursorState.lastY);
  const dx = hasLast ? event.clientX - tronDiscCursorState.lastX : 0;
  const dy = hasLast ? event.clientY - tronDiscCursorState.lastY : 0;
  const speed = Math.hypot(dx, dy) / dtMs * 1000;
  tronDiscCursorState.x = event.clientX;
  tronDiscCursorState.y = event.clientY;
  tronDiscCursorState.lastX = event.clientX;
  tronDiscCursorState.lastY = event.clientY;
  tronDiscCursorState.lastAt = now;
  tronDiscCursorState.speed = speed;
  tronDiscCursorState.targetSpinDegPerSec = THREE.MathUtils.clamp(
    TRON_DISC_CURSOR_IDLE_SPIN + speed * TRON_DISC_CURSOR_SPEED_GAIN,
    TRON_DISC_CURSOR_IDLE_SPIN,
    TRON_DISC_CURSOR_MAX_SPIN
  );
  setTronDiscCursorVisible(true);
}

function updateTronDiscCursor(dt) {
  if (!tronDiscCursor) return;
  // When hidden (pointer-locked / walking — the steady state) the element is visibility:hidden,
  // so the per-frame transform write is invisible; skip it (re-show resets via handleTronDiscCursorMove).
  if (!tronDiscCursorState.visible) return;
  const spinDecay = Math.min(1, dt * 2.8);
  const spinEase = Math.min(1, dt * 12);
  const restingTarget = tronDiscCursorState.visible ? TRON_DISC_CURSOR_IDLE_SPIN : 0;
  tronDiscCursorState.targetSpinDegPerSec = THREE.MathUtils.lerp(
    tronDiscCursorState.targetSpinDegPerSec,
    restingTarget,
    spinDecay
  );
  tronDiscCursorState.spinDegPerSec = THREE.MathUtils.lerp(
    tronDiscCursorState.spinDegPerSec,
    tronDiscCursorState.targetSpinDegPerSec,
    spinEase
  );
  tronDiscCursorState.rotationDeg = (tronDiscCursorState.rotationDeg + tronDiscCursorState.spinDegPerSec * dt) % 360;
  tronDiscCursor.style.transform = `translate3d(${tronDiscCursorState.x}px, ${tronDiscCursorState.y}px, 0) translate(-50%, -50%) rotate(${tronDiscCursorState.rotationDeg.toFixed(2)}deg)`;
}

function clearVerticalMovementState() {
  keys.KeyE = false;
  keys.Space = false;
  keys.KeyQ = false;
  keys.KeyC = false;
  movementVelocity.y = 0;
  desiredVelocity.y = 0;
}

function clearMovementKeys() {
  for (const key in keys) keys[key] = false;
  movementVelocity.set(0, 0, 0);
  desiredVelocity.set(0, 0, 0);
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

function lerpAngle(from, to, t) {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * t;
}

function droneIntroEase(t) {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

function computeDroneIntroTargetPose() {
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
  const visibleRecords = sideBuildingRecords.filter((record) => record.mesh?.visible !== false);
  const roadMaxZ = dynamicRoadCenter + dynamicRoadLength / 2 - GRID_BLOCK;
  let pairZ = MAIN_ROAD_Z + MAIN_ROAD_LENGTH / 2 - START_SIDE_EXTENSION;
  let pairHalfDepth = SIDE_BUILDING_BASE * sideBuildingDepthScale / 2;
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

function startDroneIntroFlight(options = {}) {
  const source = typeof options === 'string' ? options : 'manual';
  if (source === 'auto') droneIntroAutoTriggered = true;
  removeViewMotionOffset();
  clearMovementKeys();
  setTronNoclip(true, { silent: true });
  const target = computeDroneIntroTargetPose();
  droneIntroStart.copy(camera.position);
  droneIntroTarget.set(target.x, target.y, target.z);
  droneIntroLookAt.set(target.lookAtX, target.lookAtY, target.lookAtZ);
  const look = computeYawPitchForLookAt(droneIntroTarget, droneIntroLookAt);
  droneIntroFlight.active = true;
  droneIntroFlight.startedAt = performance.now();
  droneIntroFlight.durationMs = DRONE_INTRO_DURATION_MS;
  droneIntroFlight.source = source;
  droneIntroFlight.startYaw = yaw;
  droneIntroFlight.startPitch = pitch;
  droneIntroFlight.targetYaw = Number.isFinite(target.targetYaw) ? target.targetYaw : look.yaw;
  droneIntroFlight.targetPitch = Number.isFinite(target.targetPitch) ? target.targetPitch : look.pitch;
  droneIntroFlight.arcLift = Math.min(90, Math.max(24, droneIntroStart.distanceTo(droneIntroTarget) * 0.08));
  droneIntroFlight.progress = 0;
  if (controlEls.droneIntroFlight) setButtonFeedback(controlEls.droneIntroFlight, 'Drone in volo');
  return window.__tronInspect?.();
}

function scheduleDroneIntroAutoFlight() {
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

function updateDroneIntroFlight(now) {
  if (!droneIntroFlight.active) return false;
  const raw = (now - droneIntroFlight.startedAt) / Math.max(1, droneIntroFlight.durationMs);
  const t = THREE.MathUtils.clamp(raw, 0, 1);
  const eased = droneIntroEase(t);
  droneIntroFlight.progress = eased;
  camera.position.lerpVectors(droneIntroStart, droneIntroTarget, eased);
  camera.position.y += Math.sin(Math.PI * eased) * droneIntroFlight.arcLift;
  yaw = lerpAngle(droneIntroFlight.startYaw, droneIntroFlight.targetYaw, eased);
  pitch = THREE.MathUtils.lerp(droneIntroFlight.startPitch, droneIntroFlight.targetPitch, eased);
  viewRoll = THREE.MathUtils.lerp(viewRoll, 0, Math.min(1, 8 * Math.min(0.05, (now - last) / 1000)));
  headBobOffset = 0;
  sideSwayOffset = 0;
  movementHorizontalSpeed = 0;
  movementRunMix = 0;
  clearMovementKeys();
  applyCameraLook();
  if (t >= 1) {
    droneIntroFlight.active = false;
    droneIntroFlight.progress = 1;
    camera.position.copy(droneIntroTarget);
    yaw = droneIntroFlight.targetYaw;
    pitch = droneIntroFlight.targetPitch;
    viewRoll = 0;
    setTronNoclip(false, { silent: true });
    applyCameraLook();
    updateStartPositionLiveLabel();
  }
  return true;
}

window.startDroneIntroFlight = startDroneIntroFlight;

function suppressPointerLook(ms = POINTER_CLICK_SUPPRESS_MS, moveCount = 8) {
  suppressNextPointerLockMove = true;
  pointerClickLookSuppressedUntil = Math.max(pointerClickLookSuppressedUntil, performance.now() + ms);
  ignoredPointerLookMoves = Math.max(ignoredPointerLookMoves, moveCount);
}

function isMouseLookEnabled() {
  return cityRevealComplete;
}

function updatePointerLockHint() {
  const lockHint = document.getElementById('lock-hint');
  if (!lockHint) return;
  if (welcomeWindowUsesTouchPrompt()) {
    lockHint.textContent = isMouseLookEnabled()
      ? 'trascina per guardare'
      : 'touch attivo dopo il reveal';
    return;
  }
  lockHint.textContent = isMouseLookEnabled()
    ? (pointerLocked || unlockedMouseLookActive ? 'mouse look active · ESC to release' : 'click canvas to lock')
    : 'mouse disabled until reveal complete';
}

function syncMouseLookCursorState() {
  document.body.classList.toggle('mouse-look-engaged', pointerLocked || unlockedMouseLookActive);
  lockEl.classList.toggle('dragging', pointerLocked || unlockedMouseLookActive);
  setTronDiscCursorVisible(tronDiscCursorState.pointerInside);
}

function stopMouseLookInput() {
  dragging = false;
  dragCandidate = false;
  lookTouchIdentifier = null;
  unlockedMouseLookActive = false;
  suppressNextPointerLockMove = false;
  ignoredPointerLookMoves = 0;
  if (document.pointerLockElement === lockEl) {
    try { document.exitPointerLock?.(); } catch (_) {}
  }
  pointerLocked = false;
  syncMouseLookCursorState();
  updatePointerLockHint();
}

lockEl.addEventListener('click', (e) => {
  if (!isMouseLookEnabled()) {
    e.preventDefault();
    stopMouseLookInput();
    return;
  }
  suppressPointerLook();
  clearVerticalMovementState();
  if (!pointerLocked) {
    dragging = false;
    dragCandidate = false;
    unlockedMouseLookActive = true;
    lastX = e.clientX;
    lastY = e.clientY;
    pointerLockLookEnabledAt = performance.now() + POINTER_LOCK_SETTLE_MS;
    syncMouseLookCursorState();
    updatePointerLockHint();
    try {
      const lockRequest = lockEl.requestPointerLock?.();
      lockRequest?.catch?.(() => {});
    } catch (_) {}
  }
});
document.addEventListener('pointerlockchange', () => {
  pointerLocked = (document.pointerLockElement === lockEl);
  clearVerticalMovementState();
  if (pointerLocked) {
    dragging = false;
    dragCandidate = false;
    unlockedMouseLookActive = false;
    suppressPointerLook(POINTER_LOCK_SETTLE_MS, 8);
    pointerLockLookEnabledAt = performance.now() + POINTER_LOCK_SETTLE_MS;
  }
  syncMouseLookCursorState();
  updatePointerLockHint();
});

window.addEventListener('mousemove', (e) => {
  handleTronDiscCursorMove(e);
  if (!isMouseLookEnabled()) {
    stopMouseLookInput();
    return;
  }
  if (pointerLocked) {
    if (
      suppressNextPointerLockMove ||
      ignoredPointerLookMoves > 0 ||
      performance.now() < pointerLockLookEnabledAt ||
      performance.now() < pointerClickLookSuppressedUntil
    ) {
      suppressNextPointerLockMove = false;
      ignoredPointerLookMoves = Math.max(0, ignoredPointerLookMoves - 1);
      return;
    }
    yaw   -= e.movementX * 0.0022 * mouseSensitivityScale;
    pitch -= e.movementY * 0.0022 * mouseSensitivityScale;
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
    applyCameraLook();
  } else if (unlockedMouseLookActive) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    if (Math.abs(dx) <= 0.001 && Math.abs(dy) <= 0.001) return;
    yaw   -= dx * 0.0035 * mouseSensitivityScale;
    pitch -= dy * 0.0035 * mouseSensitivityScale;
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
    applyCameraLook();
  } else if (dragCandidate || dragging) {
    if (!dragging) {
      const totalDx = e.clientX - dragStartX;
      const totalDy = e.clientY - dragStartY;
      if (Math.hypot(totalDx, totalDy) < DRAG_ACTIVATE_PX) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      return;
    }
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    yaw   -= dx * 0.0035 * mouseSensitivityScale;
    pitch -= dy * 0.0035 * mouseSensitivityScale;
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
    applyCameraLook();
  }
});
document.addEventListener('pointerleave', () => setTronDiscCursorVisible(false), { passive: true });
window.addEventListener('blur', () => setTronDiscCursorVisible(false));
// fallback drag-rotate when pointer lock unavailable / declined
lockEl.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  if (!isMouseLookEnabled()) {
    stopMouseLookInput();
    return;
  }
  clearVerticalMovementState();
  suppressPointerLook();
  if (pointerLocked) return;
  unlockedMouseLookActive = false;
  // A tiny drag activates rotate-fallback when browser pointer lock is unavailable,
  // declined, or not yet engaged after the click gesture.
  dragCandidate = true;
  dragging = false;
  dragStartX = lastX = e.clientX;
  dragStartY = lastY = e.clientY;
});
window.addEventListener('mouseup', () => {
  if (pointerLocked) suppressPointerLook(180, 3);
  dragging = false;
  dragCandidate = false;
});
document.addEventListener('mousedown', (e) => {
  if (e.target === lockEl) return;
  unlockedMouseLookActive = false;
  syncMouseLookCursorState();
  updatePointerLockHint();
});

function isMobileMovementControlTarget(target) {
  return Boolean(target?.closest?.('#mobile-movement-pad'));
}

mobileMovementPadEl?.addEventListener('pointerdown', (event) => {
  updateMobileTouchControlsState();
  if (!mobileTouchControlsState.movement.enabled) return;
  event.preventDefault();
  requestLandscapeFullscreen('movement-pad');
  mobileTouchControlsState.movement.active = true;
  mobileTouchControlsState.movement.pointerId = event.pointerId;
  mobileMovementPadEl.setPointerCapture?.(event.pointerId);
  updateMobileMovementPadFromPoint(event.clientX, event.clientY);
}, { passive: false });

mobileMovementPadEl?.addEventListener('pointermove', (event) => {
  if (!mobileTouchControlsState.movement.active || mobileTouchControlsState.movement.pointerId !== event.pointerId) return;
  event.preventDefault();
  updateMobileMovementPadFromPoint(event.clientX, event.clientY);
}, { passive: false });

function releaseMobileMovementPointer(event) {
  if (mobileTouchControlsState.movement.pointerId !== null && event?.pointerId !== mobileTouchControlsState.movement.pointerId) return;
  resetMobileMovementPad();
}

mobileMovementPadEl?.addEventListener('pointerup', releaseMobileMovementPointer);
mobileMovementPadEl?.addEventListener('pointercancel', releaseMobileMovementPointer);
window.addEventListener('blur', resetMobileMovementPad);

function scheduleMobileLandscapeRefresh(source = 'resize') {
  window.requestAnimationFrame(() => {
    updateMobileTouchControlsState();
    requestLandscapeFullscreen(source);
    applyViewportResize();
  });
}

window.addEventListener('orientationchange', () => scheduleMobileLandscapeRefresh('orientationchange'));
window.addEventListener('resize', () => updateMobileTouchControlsState());
document.addEventListener('fullscreenchange', updateMobileTouchControlsState);
document.addEventListener('webkitfullscreenchange', updateMobileTouchControlsState);
window.addEventListener('pointerdown', (event) => {
  if (isMobileMovementControlTarget(event.target)) return;
  if (isMobileLandscapeMode()) requestLandscapeFullscreen('page-pointerdown');
}, { passive: true });
window.addEventListener('touchstart', (event) => {
  if (isMobileMovementControlTarget(event.target)) return;
  if (isMobileLandscapeMode()) {
    requestLandscapeFullscreen('page-touchstart');
  }
}, { passive: true, capture: true });
updateMobileTouchControlsState();

// touch fallback (mobile)
lockEl.addEventListener('touchstart', (e) => {
  if (!isMouseLookEnabled()) {
    stopMouseLookInput();
    return;
  }
  if (lookTouchIdentifier !== null) return;
  const touch = Array.from(e.changedTouches).find((item) => !isMobileMovementControlTarget(item.target)) || e.changedTouches[0];
  if (!touch) return;
  requestLandscapeFullscreen('look-touch');
  lookTouchIdentifier = touch.identifier;
  dragging = true;
  lastX = touch.clientX;
  lastY = touch.clientY;
}, { passive: true });
window.addEventListener('touchend', (e) => {
  if (lookTouchIdentifier === null) {
    dragging = false;
    return;
  }
  const ended = Array.from(e.changedTouches).some((touch) => touch.identifier === lookTouchIdentifier);
  if (ended) {
    dragging = false;
    lookTouchIdentifier = null;
  }
});
window.addEventListener('touchcancel', (e) => {
  if (lookTouchIdentifier === null) {
    dragging = false;
    return;
  }
  const cancelled = Array.from(e.changedTouches).some((touch) => touch.identifier === lookTouchIdentifier);
  if (cancelled) {
    dragging = false;
    lookTouchIdentifier = null;
  }
});
window.addEventListener('touchmove', (e) => {
  if (!isMouseLookEnabled()) {
    stopMouseLookInput();
    return;
  }
  if (!dragging || lookTouchIdentifier === null) return;
  const t = Array.from(e.touches).find((touch) => touch.identifier === lookTouchIdentifier);
  if (!t) return;
  const dx = t.clientX - lastX, dy = t.clientY - lastY;
  lastX = t.clientX; lastY = t.clientY;
  yaw   -= dx * 0.0035 * mouseSensitivityScale;
  pitch -= dy * 0.0035 * mouseSensitivityScale;
  pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
  applyCameraLook();
}, { passive: true });

function isTextEditingTarget(target) {
  if (!target) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'TEXTAREA') return true;
  if (tag !== 'INPUT') return false;
  const type = (target.type || 'text').toLowerCase();
  return ['text', 'search', 'url', 'email', 'password', 'number', 'tel'].includes(type);
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'Escape') {
    stopMouseLookInput();
    return;
  }
  if (e.code === DEMO_START_KEY && welcomeWindowVisible() && !isTextEditingTarget(e.target)) {
    e.preventDefault();
    ensureFootstepAudioReady();
    triggerBackspaceDroneIntro('welcome-space');
    return;
  }
  if (e.code === 'Backspace' && !isTextEditingTarget(e.target)) {
    e.preventDefault();
    return;
  }
  if (e.code === 'KeyH') {
    e.preventDefault();
    resetCameraHeightToDefault();
    return;
  }
  if (e.code === 'KeyP') {
    e.preventDefault();
    captureLivePlayerSpawn();
    return;
  }
  if (backspaceIntroTriggered && !isTextEditingTarget(e.target) && FOOTSTEP_AUDIO_USER_KEYS.has(e.code)) {
    ensureFootstepAudioReady();
  }
  keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    for (const k in keys) keys[k] = false;
    movementVelocity.y = 0;
  }
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
let stepPhase = 0;
let headBobOffset = 0;
let sideSwayOffset = 0;
let movementRunMix = 0;
let movementHorizontalSpeed = 0;
let movementForwardMix = 0;
let movementBackMix = 0;
let movementStrafeMix = 0;
let movementStrafeDirection = 0;
const moveVec = new THREE.Vector3();
const desiredVelocity = new THREE.Vector3();
const movementVelocity = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
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
const FOOTSTEP_AUDIO_USER_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight',
]);
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

const tronSynthMusic = {
  playing: false,
  timer: 0,
  startedAt: 0,
  startSource: '',
  stepIndex: 0,
  nextStepTime: 0,
  scheduledEvents: 0,
  lastStep: -1,
  lastEvent: '',
  masterGain: null,
  toneFilter: null,
  delay: null,
  delayFeedback: null,
  delayReturn: null,
  noiseBuffer: null,
  error: '',
};
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

function setupTronSynthMusicGraph(ctx) {
  if (tronSynthMusic.masterGain) return true;
  const masterGain = ctx.createGain();
  const toneFilter = ctx.createBiquadFilter();
  const delay = ctx.createDelay(1.4);
  const delayFeedback = ctx.createGain();
  const delayReturn = ctx.createGain();

  masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  toneFilter.type = 'lowpass';
  toneFilter.frequency.setValueAtTime(7800, ctx.currentTime);
  toneFilter.Q.setValueAtTime(0.18, ctx.currentTime);
  delay.delayTime.setValueAtTime(TRON_SYNTH_MUSIC_STEP_SEC * 6, ctx.currentTime);
  delayFeedback.gain.setValueAtTime(0.20, ctx.currentTime);
  delayReturn.gain.setValueAtTime(0.15, ctx.currentTime);

  masterGain.connect(toneFilter).connect(ctx.destination);
  delay.connect(delayFeedback).connect(delay);
  delay.connect(delayReturn).connect(toneFilter);

  tronSynthMusic.masterGain = masterGain;
  tronSynthMusic.toneFilter = toneFilter;
  tronSynthMusic.delay = delay;
  tronSynthMusic.delayFeedback = delayFeedback;
  tronSynthMusic.delayReturn = delayReturn;
  tronSynthMusic.noiseBuffer = createTronSynthNoiseBuffer(ctx);
  return true;
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

function disconnectTronSynthNode(node) {
  try { node?.disconnect?.(); } catch {}
}

function playTronSynthTone({
  start,
  duration,
  frequency,
  endFrequency = null,
  type = 'sine',
  gain = 0.03,
  attack = 0.008,
  release = 0.05,
  delaySend = 0,
  detune = 0,
  filterType = '',
  filterFrequency = 0,
  filterQ = 0.7,
}) {
  const ctx = footstepAudioContext;
  if (!ctx || !tronSynthMusic.masterGain) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const filter = filterType ? ctx.createBiquadFilter() : null;
  const send = delaySend > 0 && tronSynthMusic.delay ? ctx.createGain() : null;
  const stopAt = start + duration + release + 0.02;

  osc.type = type;
  osc.detune?.setValueAtTime?.(detune, start);
  osc.frequency.setValueAtTime(Math.max(1, frequency), start);
  if (Number.isFinite(endFrequency) && endFrequency > 0) {
    osc.frequency.exponentialRampToValueAtTime(endFrequency, Math.max(start + 0.02, start + duration));
  }
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), start + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration + release);
  if (filter) {
    filter.type = filterType;
    filter.frequency.setValueAtTime(Math.max(1, filterFrequency || frequency * 2), start);
    filter.Q.setValueAtTime(Math.max(0.001, filterQ), start);
    osc.connect(amp).connect(filter).connect(tronSynthMusic.masterGain);
  } else {
    osc.connect(amp).connect(tronSynthMusic.masterGain);
  }
  if (send) {
    send.gain.setValueAtTime(delaySend, start);
    (filter || amp).connect(send).connect(tronSynthMusic.delay);
  }
  osc.onended = () => {
    disconnectTronSynthNode(osc);
    disconnectTronSynthNode(amp);
    disconnectTronSynthNode(filter);
    disconnectTronSynthNode(send);
  };
  osc.start(start);
  osc.stop(stopAt);
  tronSynthMusic.scheduledEvents += 1;
}

function playTronSynthNoise({
  start,
  duration,
  gain = 0.018,
  frequency = 5400,
  q = 0.75,
}) {
  const ctx = footstepAudioContext;
  if (!ctx || !tronSynthMusic.masterGain || !tronSynthMusic.noiseBuffer) return;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  const stopAt = start + duration + 0.04;

  source.buffer = tronSynthMusic.noiseBuffer;
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(frequency, start);
  filter.Q.setValueAtTime(q, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), start + 0.004);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(amp).connect(tronSynthMusic.masterGain);
  source.onended = () => {
    disconnectTronSynthNode(source);
    disconnectTronSynthNode(filter);
    disconnectTronSynthNode(amp);
  };
  source.start(start);
  source.stop(stopAt);
  tronSynthMusic.scheduledEvents += 1;
}

function scheduleTronSynthMusicStep(stepIndex, time) {
  const step = stepIndex % TRON_SYNTH_MUSIC_PATTERN_STEPS;
  const barStep = step % 16;
  const phrase = Math.floor(step / 16) % 4;
  const rootPattern = [41.20, 36.71, 48.99, 32.70];
  const root = rootPattern[phrase];
  const chordRatios = [
    [1, 1.189, 1.498, 2.378],
    [1, 1.122, 1.414, 2.245],
    [1, 1.259, 1.587, 2.520],
    [1, 1.189, 1.498, 2.000],
  ][phrase];
  const ostinato = [1, 1, 1.498, 1, 1.189, 1, 1.498, 1.189, 1, 1.498, 2, 1.498, 1.189, 1, 1.498, 2.378];

  if (barStep === 0 || barStep === 8) {
    playTronSynthTone({
      start: time,
      duration: TRON_SYNTH_MUSIC_STEP_SEC * 4.6,
      frequency: root * 0.5,
      endFrequency: root * 0.49,
      type: 'sine',
      gain: barStep === 0 ? 0.13 : 0.095,
      attack: 0.012,
      release: 0.45,
    });
    playTronSynthTone({
      start: time + 0.012,
      duration: TRON_SYNTH_MUSIC_STEP_SEC * 2.4,
      frequency: root,
      endFrequency: root * 0.96,
      type: 'triangle',
      gain: barStep === 0 ? 0.055 : 0.040,
      attack: 0.012,
      release: 0.30,
      filterType: 'lowpass',
      filterFrequency: 180,
      filterQ: 0.35,
    });
    playTronSynthNoise({
      start: time + 0.018,
      duration: 0.22,
      gain: barStep === 0 ? 0.038 : 0.026,
      frequency: 115,
      q: 0.35,
    });
    tronSynthMusic.lastEvent = `orchestral-hit-${root.toFixed(1)}`;
  }

  if (barStep === 0) {
    chordRatios.forEach((ratio, index) => {
      const freq = root * ratio * 5;
      playTronSynthTone({
        start: time + index * 0.025,
        duration: TRON_SYNTH_MUSIC_STEP_SEC * 14,
        frequency: freq,
        endFrequency: freq * (1 + (index - 1.5) * 0.0008),
        type: 'sawtooth',
        gain: 0.012,
        attack: 0.65 + index * 0.12,
        release: 1.8,
        delaySend: 0.10,
        detune: (index - 1.5) * 5,
        filterType: 'lowpass',
        filterFrequency: 950 + index * 260,
        filterQ: 0.5,
      });
      playTronSynthTone({
        start: time + 0.05 + index * 0.018,
        duration: TRON_SYNTH_MUSIC_STEP_SEC * 9,
        frequency: freq * 0.5,
        type: 'triangle',
        gain: 0.006,
        attack: 0.85 + index * 0.10,
        release: 1.4,
        delaySend: 0.07,
        detune: (index - 1.5) * -3,
        filterType: 'lowpass',
        filterFrequency: 620 + index * 180,
        filterQ: 0.35,
      });
    });
    tronSynthMusic.lastEvent = `orchestral-chord-${phrase + 1}`;
  }

  if (barStep % 2 === 0) {
    const pulseFreq = root * ostinato[barStep] * 6;
    playTronSynthTone({
      start: time + TRON_SYNTH_MUSIC_STEP_SEC * 0.05,
      duration: TRON_SYNTH_MUSIC_STEP_SEC * 1.45,
      frequency: pulseFreq,
      endFrequency: pulseFreq * 0.995,
      type: 'sawtooth',
      gain: barStep === 0 || barStep === 8 ? 0.011 : 0.016,
      attack: 0.018,
      release: 0.20,
      delaySend: 0.045,
      detune: barStep % 4 === 0 ? -4 : 4,
      filterType: 'lowpass',
      filterFrequency: 1450,
      filterQ: 0.8,
    });
    playTronSynthTone({
      start: time + TRON_SYNTH_MUSIC_STEP_SEC * 0.11,
      duration: TRON_SYNTH_MUSIC_STEP_SEC * 1.2,
      frequency: pulseFreq * 0.5,
      type: 'triangle',
      gain: 0.007,
      attack: 0.016,
      release: 0.18,
      filterType: 'lowpass',
      filterFrequency: 760,
      filterQ: 0.5,
    });
  }

  if (barStep === 4 || barStep === 12 || barStep === 14) {
    playTronSynthTone({
      start: time + TRON_SYNTH_MUSIC_STEP_SEC * 0.20,
      duration: TRON_SYNTH_MUSIC_STEP_SEC * (barStep === 14 ? 5 : 3.8),
      frequency: root * (barStep === 4 ? 7.5 : 9),
      endFrequency: root * (barStep === 14 ? 12 : 10.5),
      type: 'sine',
      gain: barStep === 14 ? 0.018 : 0.012,
      attack: 0.22,
      release: 0.85,
      delaySend: 0.28,
    });
  }

  if (barStep === 6 || barStep === 10 || barStep === 14) {
    playTronSynthNoise({
      start: time + TRON_SYNTH_MUSIC_STEP_SEC * 0.35,
      duration: 0.08,
      gain: barStep === 14 ? 0.020 : 0.010,
      frequency: barStep === 14 ? 5200 : 2600,
      q: 0.65,
    });
  }

  if (step === 0 || step === 32) {
    playTronSynthNoise({
      start: time + TRON_SYNTH_MUSIC_STEP_SEC * 0.5,
      duration: TRON_SYNTH_MUSIC_STEP_SEC * 10,
      gain: 0.010,
      frequency: step === 0 ? 820 : 1180,
      q: 0.18,
    });
    tronSynthMusic.lastEvent = step === 0 ? 'cinematic-air-a' : 'cinematic-air-b';
  }

  tronSynthMusic.lastStep = step;
}

function scheduleTronProceduralMusic() {
  const ctx = footstepAudioContext;
  if (!ctx || !tronSynthMusic.playing) return;
  while (tronSynthMusic.nextStepTime < ctx.currentTime + TRON_SYNTH_MUSIC_SCHEDULE_AHEAD) {
    scheduleTronSynthMusicStep(tronSynthMusic.stepIndex, tronSynthMusic.nextStepTime);
    tronSynthMusic.stepIndex += 1;
    tronSynthMusic.nextStepTime += TRON_SYNTH_MUSIC_STEP_SEC;
  }
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

const basePadScanRecords = [];
let basePadScanRecordsKey = -1;
function basePadCombinedRecords() {
  // sideBuildingRecords/mainBuildingRecords are append-only after city build; rebuild the
  // combined scan list only when membership changes instead of spreading a fresh array per frame.
  const key = sideBuildingRecords.length * 100000 + mainBuildingRecords.length;
  if (key !== basePadScanRecordsKey) {
    basePadScanRecords.length = 0;
    for (const record of sideBuildingRecords) basePadScanRecords.push(record);
    for (const record of mainBuildingRecords) basePadScanRecords.push(record);
    basePadScanRecordsKey = key;
  }
  return basePadScanRecords;
}

function basePadAtPoint(x, z) {
  const records = basePadCombinedRecords();
  let bestPad = null;
  let bestTopY = -Infinity;
  for (const record of records) {
    const pad = record.basePad;
    if (!pad?.hitPolygon?.length) continue;
    const dx = x - pad.border.position.x;
    const dz = z - pad.border.position.z;
    if (Math.abs(dx) > (pad.hitHalfSize || 0) || Math.abs(dz) > (pad.hitHalfSize || 0)) continue;
    if (!pointInBasePadPolygon(dx, dz, pad.hitPolygon)) continue;
    const onInner = pad.innerHitPolygon?.length && pointInBasePadPolygon(dx, dz, pad.innerHitPolygon);
    const topY = onInner ? (pad.innerTopY ?? pad.topY ?? roadTileTopY()) : (pad.topY ?? roadTileTopY());
    if (topY > bestTopY) {
      bestTopY = topY;
      bestPad = pad;
    }
  }
  return bestPad ? { pad: bestPad, topY: bestTopY } : null;
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

function updateWalkSimulation(dt) {
  const moveFactor = THREE.MathUtils.clamp(movementHorizontalSpeed / Math.max(1, speedBase), 0, 1);
  const smoothing = Math.min(1, headMotionSmoothing * dt);
  if (moveFactor < 0.01) {
    const settle = Math.min(1, movementDeceleration * dt);
    headBobOffset = THREE.MathUtils.lerp(headBobOffset, 0, settle);
    sideSwayOffset = THREE.MathUtils.lerp(sideSwayOffset, 0, settle);
    viewRoll = THREE.MathUtils.lerp(viewRoll, 0, settle);
    resetFootstepCadence();
    setFixedCameraFov();
    applyCameraLook();
    return;
  }

  const targetSpeed = THREE.MathUtils.lerp(speedBase, speedSprint, movementRunMix);
  const cadence = THREE.MathUtils.lerp(walkStepRate, runStepRate, movementRunMix);
  const pace = THREE.MathUtils.clamp(movementHorizontalSpeed / Math.max(1, targetSpeed), 0.35, 1.8);
  stepPhase += dt * cadence * Math.PI * 2 * pace;
  updateFootstepAudioFromWalk(moveFactor);

  const directionBobScale = movementForwardMix +
    movementStrafeMix * strafeBobScale +
    movementBackMix * backwardBobScale;
  const amount = THREE.MathUtils.lerp(walkBobAmount, runBobAmount, movementRunMix) * moveFactor * directionBobScale;
  const snapPower = THREE.MathUtils.lerp(1.2, 4.2, stepSnapAmount);
  const footPulse = Math.pow(Math.abs(Math.sin(stepPhase)), snapPower);
  const targetHeadBob = footPulse * amount;

  const swayStrength = movementSwayAmount * moveFactor * (0.85 + movementRunMix * 0.45);
  const targetSideSway = Math.sin(stepPhase) * swayStrength;
  const stepRoll = Math.sin(stepPhase) * movementRollAmount * moveFactor * (0.85 + movementRunMix * 0.65);
  const targetRoll = stepRoll - movementStrafeDirection * strafeLeanAmount * moveFactor;

  headBobOffset = THREE.MathUtils.lerp(headBobOffset, targetHeadBob, smoothing);
  sideSwayOffset = THREE.MathUtils.lerp(sideSwayOffset, targetSideSway, smoothing);
  viewRoll = THREE.MathUtils.lerp(viewRoll, targetRoll, smoothing);
  setFixedCameraFov();
  applyCameraLook();
}

function applyMovement(dt) {
  desiredVelocity.set(0, 0, 0);
  moveVec.set(0, 0, 0);
  let mx = 0, mz = 0, my = 0;
  if (keys['KeyW'] || keys['ArrowUp'])    mz -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  mz += 1;
  if (keys['KeyA'] || keys['ArrowLeft'])  mx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
  if (mobileTouchControlsState.movement.enabled && mobileTouchControlsState.movement.magnitude > 0) {
    mx += mobileTouchControlsState.movement.x;
    mz += mobileTouchControlsState.movement.z;
  }
  if (keys['KeyE'] || keys['Space'])      my += 1;
  if (keys['KeyQ'] || keys['KeyC'])       my -= 1;

  const hasHorizontalInput = mx !== 0 || mz !== 0;
  const hasVerticalInput = my !== 0;
  const hasInput = hasHorizontalInput || hasVerticalInput;
  const speed = (keys['ShiftLeft'] || keys['ShiftRight']) ? speedSprint : speedBase;

  if (hasHorizontalInput) {
    const forwardIntent = mz < 0 ? Math.abs(mz) : 0;
    const backIntent = mz > 0 ? Math.abs(mz) : 0;
    const strafeIntent = Math.abs(mx);
    const intentTotal = Math.max(0.0001, forwardIntent + backIntent + strafeIntent);
    movementForwardMix = forwardIntent / intentTotal;
    movementBackMix = backIntent / intentTotal;
    movementStrafeMix = strafeIntent / intentTotal;
    movementStrafeDirection = mx === 0 ? 0 : Math.sign(mx);

    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();
    right.crossVectors(forward, UP).normalize();

    moveVec.addScaledVector(forward, -mz);
    moveVec.addScaledVector(right, mx);
    moveVec.normalize();
    const directionSpeedScale =
      movementForwardMix +
      movementBackMix * backwardSpeedScale +
      movementStrafeMix * strafeSpeedScale;
    const diagonalScale = mx !== 0 && mz !== 0 ? diagonalSpeedScale : 1;
    const analogScale = THREE.MathUtils.clamp(Math.hypot(mx, mz), 0, 1);
    desiredVelocity.addScaledVector(moveVec, speed * directionSpeedScale * diagonalScale * analogScale);
  } else if (movementVelocity.lengthSq() < 0.0004) {
    movementForwardMix = 0;
    movementBackMix = 0;
    movementStrafeMix = 0;
    movementStrafeDirection = 0;
  }

  if (hasVerticalInput) desiredVelocity.y = my * verticalSpeed;

  const response = hasInput ? movementAcceleration : movementDeceleration;
  movementVelocity.lerp(desiredVelocity, Math.min(1, response * dt));
  if (!hasInput && movementVelocity.lengthSq() < 0.0004) movementVelocity.set(0, 0, 0);

  movementHorizontalSpeed = Math.hypot(movementVelocity.x, movementVelocity.z);
  movementRunMix = THREE.MathUtils.clamp(
    (movementHorizontalSpeed - speedBase * 0.65) / Math.max(1, speedSprint - speedBase * 0.65),
    0,
    1
  );

  if (movementVelocity.lengthSq() <= 0.000001) {
    resolveCameraBuildingCollision();
    resolveCameraRoadHexBoundaryCollision();
    resolveCameraCrowdCollision();
    resolveCameraWalkSurface(hasVerticalInput);
    return;
  }

  camera.position.addScaledVector(movementVelocity, dt);
  resolveCameraBuildingCollision();
  resolveCameraRoadHexBoundaryCollision();
  resolveCameraCrowdCollision();

  resolveCameraWalkSurface(hasVerticalInput);
}

function updateHexRoadTiles(dt) {
  if (!hexRoadTiles.length) return;
  const playerX = camera.position.x;
  const playerZ = camera.position.z;
  const dropDelaySeconds = hexDropDelay / 1000;
  const dropStep = Math.min(1, hexDropSpeed * dt);
  const recoveryStep = Math.min(1, hexRecovery * dt);
  const updateRadius = hexDepressRadius + Math.abs(hexPassOffset) + hexTileRadius * 2;
  const updateRadiusSq = updateRadius * updateRadius;
  hexTileCandidates.length = 0;
  hexTileFrameId++;
  const bucketRadius = Math.ceil(updateRadius / HEX_TILE_BUCKET_SIZE) + 1;
  const centerIx = Math.floor(playerX / HEX_TILE_BUCKET_SIZE);
  const centerIz = Math.floor(playerZ / HEX_TILE_BUCKET_SIZE);
  for (let ix = centerIx - bucketRadius; ix <= centerIx + bucketRadius; ix++) {
    for (let iz = centerIz - bucketRadius; iz <= centerIz + bucketRadius; iz++) {
      const bucket = hexRoadTileBuckets.get(hexTileBucketKey(ix, iz));
      if (!bucket) continue;
      for (const tile of bucket) queueHexTileCandidate(tile);
    }
  }
  for (const tile of recoveringHexTiles) queueHexTileCandidate(tile);
  hexRoadRuntimeStats.lastCandidateCount = hexTileCandidates.length;

  for (const tile of hexTileCandidates) {
    if (!tile.visible || tile.userData.visible === false) {
      recoveringHexTiles.delete(tile);
      continue;
    }
    const dx = tile.userData.x - playerX;
    const dz = tile.userData.z - playerZ;
    const distSq = dx * dx + dz * dz;
    const recovering = Math.abs(tile.userData.depression) > 0.001 || tile.userData.wasInfluenced;
    if (distSq > updateRadiusSq && !recovering) continue;

    const dist = distSq <= updateRadiusSq ? Math.sqrt(distSq) : hexDepressRadius + 1;
    const influence = dist <= hexDepressRadius ? THREE.MathUtils.smoothstep(hexDepressRadius - dist, 0, hexDepressRadius) : 0;
    const isInfluenced = influence > 0.001;
    if (isInfluenced) {
      tile.userData.hitTime = tile.userData.wasInfluenced ? tile.userData.hitTime + dt : 0;
    } else {
      tile.userData.hitTime = 0;
    }
    tile.userData.wasInfluenced = isInfluenced;

    const previousDepression = tile.userData.depression;
    const previousHitLight = tile.userData.hitLight;
    const previousPlayerLight = tile.userData.playerLight || 0;
    const targetDepth = isInfluenced && tile.userData.hitTime >= dropDelaySeconds ? hexPassOffset * influence : 0;
    const step = targetDepth < tile.userData.depression ? dropStep : recoveryStep;
    tile.userData.depression += (targetDepth - tile.userData.depression) * step;
    const hitLight = THREE.MathUtils.clamp(influence * hexTileHitLight, 0, 1);
    const playerLight = THREE.MathUtils.clamp(influence * hexPlayerTileLight, 0, 1);
    tile.userData.hitLight = hitLight;
    tile.userData.playerLight = playerLight;
    if (Math.abs(tile.userData.depression - previousDepression) > 0.0005 ||
      Math.abs(hitLight - previousHitLight) > 0.003 ||
      Math.abs(playerLight - previousPlayerLight) > 0.003) {
      setHexTileDisplayColor(hexTileInstanceColor, hitLight, playerLight, tile.userData.basePadLight || 0);
      syncHexTileInstance(tile, hexTileInstanceColor);
    }
    if (Math.abs(tile.userData.depression) > 0.001 || isInfluenced) {
      recoveringHexTiles.add(tile);
    } else {
      recoveringHexTiles.delete(tile);
    }
  }
}

function stepHexRoadTiles(dt) {
  if (!hexUpdateEnabled) {
    hexRoadUpdateFrame = 0;
    hexRoadAccumulatedDt = 0;
    return;
  }
  hexRoadAccumulatedDt = Math.min(MAX_HEX_ROAD_ACCUMULATED_DT, hexRoadAccumulatedDt + dt);
  hexRoadUpdateFrame = (hexRoadUpdateFrame + 1) % HEX_ROAD_UPDATE_FRAME_STRIDE;
  if (hexRoadUpdateFrame !== 0) return;
  updateHexRoadTiles(hexRoadAccumulatedDt);
  hexRoadAccumulatedDt = 0;
}

// ---------- reflection environment + solid visible sky ----------
function bakeTronReflectionMap(width = 512, height = 256, buildingReflection = 1) {
  const buildingAlpha = THREE.MathUtils.clamp(buildingReflection, 0, 1);
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#01070a');
  sky.addColorStop(0.43, '#03161c');
  sky.addColorStop(0.50, '#03181d');
  sky.addColorStop(0.56, '#03161c');
  sky.addColorStop(1, '#01070a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const horizonY = Math.round(height * 0.5);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 42; i++) {
    const x = Math.round((i / 42) * width);
    const w = 8 + ((i * 37) % 24);
    const h = 28 + ((i * 53) % 96);
    if (buildingAlpha > 0.001) {
      ctx.fillStyle = `rgba(0, 8, 12, ${0.92 * buildingAlpha})`;
      ctx.fillRect(x, horizonY - h, w, h);
    }
    ctx.fillStyle = 'rgba(90, 245, 255, 0.42)';
    ctx.fillRect(x + w * 0.18, horizonY - h + 6, 2, h - 10);
    ctx.fillRect(x + w * 0.72, horizonY - h + 14, 2, h - 22);
  }
  ctx.fillStyle = 'rgba(50, 210, 230, 0.16)';
  for (let y = horizonY + 8; y < height * 0.88; y += 18) {
    ctx.fillRect(0, y, width, 1);
  }
  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const skyPalette = {
  storm: new THREE.Color(0x041a20),
  void: new THREE.Color(0x01070a),
  grid: new THREE.Color(0x061c24),
  teal: new THREE.Color(0x082f36),
  steel: new THREE.Color(0x111820),
  'tron-lighting': new THREE.Color(0x041d24),
};
const skyDisplayColor = new THREE.Color();

const SKY_DOME_RADIUS = 8500;
const domeGeo = new THREE.SphereGeometry(SKY_DOME_RADIUS, 32, 18);
const SKY_ANIMATION_SPEED = 0.3;
const domeMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uBrightness: { value: 1 },
    uHue: { value: 0 },
    uCloudAmount: { value: 1 },
    uCloudContrast: { value: 1 },
    uLightningMode: { value: 0 },
    uLightningHue: { value: 0 },
    uSkyQuality: { value: 0 },
    uSkyTint: { value: new THREE.Color(0x041a20) },
    uSkyTintStrength: { value: 0.38 },
    uStormFrequency: { value: 1 },
    uStormIntensity: { value: 1 },
    uStormSize: { value: 1 },
    uStormCloudThreshold: { value: 0.64 },
    uStormBand: { value: 1 },
    uStormVeil: { value: 1 },
  },
  vertexShader: /* glsl */`
    varying vec3 vDir;
    void main() {
      vDir = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    varying vec3 vDir;
    uniform float uTime;
    uniform float uBrightness;
    uniform float uHue;
    uniform float uCloudAmount;
    uniform float uCloudContrast;
    uniform float uLightningMode;
    uniform float uLightningHue;
    uniform float uSkyQuality;
    uniform vec3 uSkyTint;
    uniform float uSkyTintStrength;
    uniform float uStormFrequency;
    uniform float uStormIntensity;
    uniform float uStormSize;
    uniform float uStormCloudThreshold;
    uniform float uStormBand;
    uniform float uStormVeil;

    float hash21(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float hash31(vec3 p) {
      return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float noise3(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      vec3 u = f * f * (3.0 - 2.0 * f);
      float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
      float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
      float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
      float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
      float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
      float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
      float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
      float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
      float nx00 = mix(n000, n100, u.x);
      float nx10 = mix(n010, n110, u.x);
      float nx01 = mix(n001, n101, u.x);
      float nx11 = mix(n011, n111, u.x);
      float nxy0 = mix(nx00, nx10, u.y);
      float nxy1 = mix(nx01, nx11, u.y);
      return mix(nxy0, nxy1, u.z);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 0.5;
      mat2 rot = mat2(0.82, -0.57, 0.57, 0.82);
      for (int i = 0; i < 4; i++) {
        value += amp * noise(p);
        p = rot * p * 2.05 + 12.73;
        amp *= 0.52;
      }
      return value;
    }

    float ridge(vec2 p) {
      float v = 0.0;
      float a = 0.55;
      for (int i = 0; i < 3; i++) {
        float n = noise(p);
        v += a * (1.0 - abs(n * 2.0 - 1.0));
        p = p * 2.2 + 9.41;
        a *= 0.48;
      }
      return v;
    }

    float fbm3(vec3 p) {
      float value = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 4; i++) {
        value += amp * noise3(p);
        p = p * 2.03 + vec3(12.73, 4.17, 9.31);
        amp *= 0.52;
      }
      return value;
    }

    float ridge3(vec3 p) {
      float value = 0.0;
      float amp = 0.55;
      for (int i = 0; i < 3; i++) {
        float n = noise3(p);
        value += amp * (1.0 - abs(n * 2.0 - 1.0));
        p = p * 2.18 + vec3(9.41, 17.2, 6.8);
        amp *= 0.48;
      }
      return value;
    }

    vec3 hueShift(vec3 color, float hueDeg) {
      float a = radians(hueDeg);
      const vec3 k = vec3(0.57735026919);
      return color * cos(a) + cross(k, color) * sin(a) + k * dot(k, color) * (1.0 - cos(a));
    }

    float pulseCurve(float value, float center, float width) {
      float pulse = smoothstep(1.0, 0.0, abs(value - center) / max(width, 0.0001));
      return pulse * pulse;
    }

    float glitchBurst(float t) {
      float cell = floor(t * 1.86);
      float local = fract(t * 1.86);
      float chance = step(0.64, hash21(vec2(cell, 41.7)));
      float center = 0.18 + 0.64 * hash21(vec2(cell, 9.2));
      float width = mix(0.028, 0.074, hash21(vec2(cell, 73.4)));
      float strike = pulseCurve(local, center, width);
      float stutter = step(0.64, hash21(vec2(cell, floor(local * 48.0) + 5.0)));
      float afterT = max(1.0 - max(local - center, 0.0) * mix(3.2, 6.4, hash21(vec2(cell, 18.1))), 0.0);
      float after = afterT * afterT * afterT;
      return chance * max(strike, after * 0.10) * mix(0.18, 0.36, stutter);
    }

    void main() {
      vec3 dir = vDir;
      float y = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
      float skyDepth = smoothstep(0.12, 1.0, y);

      float seed = 36.93;
      float flow = uTime;
      float morphA = 0.34;
      float morphB = 0.62;
      float breath = 0.55;
      vec3 cloudDrift = vec3(0.027, 0.009, -0.018) * flow;
      vec3 cloudPulse = vec3(0.0825, -0.027, 0.0525) * flow;
      vec3 cloudP = dir * 1.45 + vec3(0.0, dir.y * 0.18, 0.0) + cloudDrift + seed;
      float warpX = 0.0;
      float warpY = 0.0;
      if (uSkyQuality > 0.5) {
        warpX = fbm3(cloudP * 1.55 + vec3(uTime * 0.0825, 18.4, 3.1));
        warpY = fbm3(cloudP * 1.42 + vec3(27.1 - uTime * 0.069, 9.7, 21.3));
      } else {
        warpX = noise3(cloudP * 1.65 + vec3(uTime * 0.0525, 18.4, 3.1));
        warpY = noise3(cloudP * 1.48 + vec3(27.1 - uTime * 0.045, 9.7, 21.3));
      }
      float warpZ = warpX * 0.63 + warpY * 0.37;
      if (uSkyQuality > 0.5) {
        warpZ = fbm3(cloudP * 1.34 + vec3(8.6, 14.2 + uTime * 0.057, 31.5));
      }
      vec3 warp = vec3(warpX, warpY, warpZ) - 0.5;
      vec3 warpedP = cloudP + warp * (0.14 + breath * 0.08);

      float broad = 0.0;
      float detail = 0.0;
      float rolling = 0.0;
      float under = 0.0;
      if (uSkyQuality > 0.5) {
        float broadA = fbm3(warpedP * 1.08 + cloudPulse * 0.62);
        float broadB = fbm3(warpedP * 1.16 + vec3(31.7, 12.4, 7.2) - cloudPulse * 0.45);
        float detailA = ridge3(warpedP * 2.65 + vec3(flow * 0.045, flow * 0.015, flow * 0.027));
        float detailB = ridge3(warpedP * 2.95 + vec3(19.4, 27.8, 11.1) + vec3(flow * 0.036, flow * 0.018, -flow * 0.024));
        float rollingA = fbm3(dir * 1.75 + warp * 0.22 + vec3(flow * 0.030, flow * 0.015, flow * 0.021));
        float rollingB = fbm3(dir * 1.90 + vec3(11.2, 8.4, 5.5) - warp * 0.18 + vec3(flow * 0.024, flow * 0.018, flow * 0.015));
        float underA = fbm3(dir * 1.42 + warp * 0.18 + vec3(flow * 0.024, flow * 0.012, flow * 0.0165));
        float underB = fbm3(dir * 1.34 + vec3(7.8, 22.1, 13.4) - warp * 0.16 + vec3(flow * 0.018, flow * 0.0135, flow * 0.012));
        broad = mix(broadA, broadB, smoothstep(0.0, 1.0, morphA));
        detail = mix(detailA, detailB, smoothstep(0.0, 1.0, morphB));
        rolling = mix(rollingA, rollingB, morphA);
        under = mix(underA, underB, morphB);
      } else {
        broad = fbm3(warpedP * 1.12 + cloudPulse * 0.48);
        detail = ridge3(warpedP * 2.54 + vec3(flow * 0.039, flow * 0.015, flow * 0.021));
        rolling = noise3(dir * 1.78 + warp * 0.18 + vec3(flow * 0.027, flow * 0.0135, flow * 0.018));
        under = noise3(dir * 1.36 + warp * 0.12 + vec3(flow * 0.018, flow * 0.012, flow * 0.015));
      }

      float ceiling = smoothstep(0.32, 0.96, y);
      float lowShelf = smoothstep(-0.42, 0.18, dir.y) * smoothstep(0.72, -0.10, dir.y);
      float cloudRaw = broad * 0.68 + detail * 0.18 + rolling * 0.24;
      float cloudContrast = clamp(uCloudContrast, 0.0, 5.0);
      float cloudField = clamp((cloudRaw - 0.5) * max(cloudContrast, 0.001) + 0.5, 0.0, 1.0);
      float cloudMask = smoothstep(0.36 - breath * 0.035, 0.72 + breath * 0.025, cloudField) * uCloudAmount;
      float lowerCloud = smoothstep(0.37 - breath * 0.025, 0.72 + breath * 0.020, under) * lowShelf * uCloudAmount;
      float cloudBody = cloudMask * ceiling;
      float cloudBreaks = smoothstep(0.30, 0.70, noise3(cloudP * 7.5 + cloudPulse * 0.7));
      vec3 low = vec3(0.001, 0.004, 0.006);
      vec3 top = vec3(0.002, 0.008, 0.012);
      vec3 col = mix(low, top, smoothstep(0.16, 1.0, y));

      float distanceFade = mix(0.34, 0.68, skyDepth);
      float contrastBoost = max(cloudContrast - 1.0, 0.0);
      float contrastSoften = clamp(1.0 - cloudContrast, 0.0, 1.0);
      vec3 cloudDark = mix(vec3(0.008, 0.020, 0.025), vec3(0.035, 0.085, 0.098), detail);
      vec3 cloudLit = vec3(0.042, 0.126, 0.145) * (0.50 + detail * 0.46);
      cloudDark *= max(0.32, 1.0 - contrastBoost * 0.16);
      cloudLit *= 1.0 + contrastBoost * 0.22;
      cloudDark = mix(cloudDark, vec3(0.018, 0.042, 0.048), contrastSoften * 0.45);
      cloudLit *= mix(1.0, 0.68, contrastSoften);
      col = mix(col, cloudDark, cloudBody * 0.54 * distanceFade);
      col += cloudLit * cloudBody * (0.10 + cloudBreaks * 0.18) * distanceFade;
      col = mix(col, vec3(0.004, 0.012, 0.016), lowerCloud * 0.30);
      col = mix(col, vec3(0.006, 0.030, 0.036), (1.0 - skyDepth) * 0.18);
      vec3 tintLift = uSkyTint * (0.20 + cloudBody * 0.64 + lowerCloud * 0.32 + (1.0 - skyDepth) * 0.18);
      col = mix(col, max(col, tintLift), uSkyTintStrength);
      float lightning = 0.0;
      if (uLightningMode > 0.5) {
        float lightningThread = uSkyQuality > 0.5
          ? ridge3(warpedP * 7.8 + warp * 2.2 + vec3(uTime * 0.18, -uTime * 0.11, uTime * 0.07))
          : noise3(warpedP * 7.1 + warp * 1.4 + vec3(uTime * 0.12, -uTime * 0.07, uTime * 0.05));
        float bandExpand = (clamp(uStormBand, 0.05, 5.0) - 1.0) * 0.08;
        float upperStormBand = smoothstep(0.50 - bandExpand, 0.62 - bandExpand, y) * (1.0 - smoothstep(0.86 + bandExpand, 0.96 + bandExpand, y));
        float cloudEdge = smoothstep(0.40, 0.56, cloudRaw) * (1.0 - smoothstep(0.69, 0.86, cloudRaw));
        float frequency = max(uStormFrequency, 0.0001);
        float stormEnabled = step(0.001, uStormFrequency);
        float veil = clamp(uStormVeil, 0.0, 5.0);
        float veilMix = clamp(veil * 0.5, 0.0, 1.0);
        float cloudGate = smoothstep(uStormCloudThreshold - 0.16, uStormCloudThreshold + 0.14, cloudRaw);
        float glitch = glitchBurst(uTime * 2.890625 * frequency + seed * 0.31) * upperStormBand * 0.42;
        float cloudVeil = cloudGate * cloudBody * upperStormBand;
        float hiddenThread = smoothstep(min(0.96, uStormCloudThreshold + 0.18), 1.0, lightningThread) * cloudVeil * mix(0.08, 0.24, veilMix);
        vec2 stormUv = vec2(atan(dir.x, dir.z) * 0.159154943 + 0.5, y);
        float sparkClock = uTime * 5.234375 * frequency + seed * 0.17;
        float sparkCell = floor(sparkClock);
        float sparkLocal = fract(sparkClock);
        vec2 sparkCenter = vec2(
          hash21(vec2(sparkCell, 2.7)),
          mix(0.58, 0.84, hash21(vec2(sparkCell, 8.4)))
        );
        float sparkDx = abs(stormUv.x - sparkCenter.x);
        sparkDx = min(sparkDx, 1.0 - sparkDx);
        vec2 sparkDelta = vec2(sparkDx * 3.8, (stormUv.y - sparkCenter.y) * 5.6);
        float sparkPulse = pulseCurve(sparkLocal, mix(0.18, 0.82, hash21(vec2(sparkCell, 14.9))), 0.16);
        float cloudTrace = max(cloudEdge * cloudBody * mix(0.38, 0.14, veilMix), hiddenThread) * upperStormBand;
        float sparkFalloff = max(1.0 - dot(sparkDelta, sparkDelta) / (0.01171875 * max(uStormSize, 0.01)), 0.0);
        float stormSpark = sparkFalloff * sparkFalloff * sparkFalloff * sparkPulse * cloudTrace * 0.75 * mix(1.35, 0.62, veilMix);
        float localizedSpark = max(hiddenThread * mix(0.08, 0.26, veilMix), stormSpark);
        float microGlare = localizedSpark * mix(0.08, 0.22, skyDepth);
        float stormVisibility = mix(0.20, 0.42, skyDepth) * (0.35 + cloudBreaks * 0.22);
        lightning = (glitch * microGlare + stormSpark * stormVisibility) * uStormIntensity * stormEnabled;
        vec3 lightningColor = hueShift(vec3(0.38, 0.92, 1.0), uLightningHue);
        col += lightningColor * lightning * (0.125 + cloudBreaks * 0.1875);
      }

      float scan = sin(y * 420.0 + uTime * 2.2) * 0.5 + 0.5;
      col *= 0.982 + scan * 0.008;
      col += (hash21(gl_FragCoord.xy * 0.35 + uTime) - 0.5) * 0.0015;
      col = hueShift(max(col, 0.0), uHue) * uBrightness;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  side: THREE.BackSide,
  depthWrite: false,
  depthTest: true,
  fog: false,
  toneMapped: true,
});
const domeMesh = new THREE.Mesh(domeGeo, domeMat);
domeMesh.frustumCulled = false;
domeMesh.renderOrder = 1000;
scene.add(domeMesh);
skyDisplayColor.copy(skyPalette.storm);
scene.background = skyDisplayColor;
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

function makeReflectionEnvTarget(width, height, buildingReflection) {
  const reflectionTex = bakeTronReflectionMap(width, height, buildingReflection);
  const target = pmrem.fromEquirectangular(reflectionTex);
  reflectionTex.dispose();
  return target;
}

const envTarget = makeReflectionEnvTarget(512, 256, 1);
const reflectionEnvMap = envTarget.texture;
const ROAD_BUILDING_REFLECTION_LEVELS = [0, 0.2, 0.35, 0.5, 0.7, 1];
const roadReflectionEnvTargets = ROAD_BUILDING_REFLECTION_LEVELS.map((level) => ({
  level,
  target: makeReflectionEnvTarget(256, 128, level),
}));
let roadBuildingReflection = 0.35;
function getRoadReflectionEnvMap(buildingReflection = roadBuildingReflection) {
  return getRoadReflectionEnvEntry(buildingReflection).target.texture;
}
function getRoadReflectionEnvEntry(buildingReflection = roadBuildingReflection) {
  let closest = roadReflectionEnvTargets[0];
  let closestDistance = Math.abs(buildingReflection - closest.level);
  for (const entry of roadReflectionEnvTargets) {
    const distance = Math.abs(buildingReflection - entry.level);
    if (distance < closestDistance) {
      closest = entry;
      closestDistance = distance;
    }
  }
  return closest;
}
scene.environment = null;
scene.environmentIntensity = 1;
pmrem.dispose();

function applySkyPreset(choice, brightness, hueDeg, quality = controlEls.skyQuality?.value || 'balanced') {
  const base = skyPalette[choice] || skyPalette.grid;
  const lightingEnabled = choice === 'tron-lighting';
  skyDisplayColor.copy(tunedColor(base, hueDeg, 1, brightness));
  domeMat.uniforms.uBrightness.value = THREE.MathUtils.clamp(brightness, 0.05, 2);
  domeMat.uniforms.uHue.value = hueDeg;
  domeMat.uniforms.uCloudAmount.value = 1;
  domeMat.uniforms.uLightningMode.value = lightingEnabled ? 1 : 0;
  domeMat.uniforms.uLightningHue.value = hueDeg;
  domeMat.uniforms.uSkyQuality.value = quality === 'full' ? 1 : 0;
  domeMat.uniforms.uSkyTint.value.copy(skyDisplayColor);
  domeMat.uniforms.uSkyTintStrength.value = choice === 'void' ? 0.08 : (choice === 'steel' ? 0.26 : 0.42);
  domeMesh.visible = true;
  scene.background = skyDisplayColor;
}

function applySkyControlsFromUI() {
  const skyChoice = controlEls.skyChoice.value;
  const skyBrightness = Number(controlEls.skyBrightness.value);
  const skyHue = Number(controlEls.skyHue.value);
  const skyCloudContrast = Number(controlEls.skyCloudContrast.value);
  const skyQuality = controlEls.skyQuality.value;
  applySkyPreset(skyChoice, skyBrightness, skyHue, skyQuality);
  applyStormControlsFromUI();
  domeMat.uniforms.uCloudContrast.value = skyCloudContrast;
  controlEls.skyBrightnessVal.textContent = skyBrightness.toFixed(2);
  controlEls.skyHueVal.textContent = skyHue.toFixed(0);
  controlEls.skyCloudContrastVal.textContent = skyCloudContrast.toFixed(2);
}

function applyStormControlsFromUI() {
  const frequency = Number(controlEls.skyStormFrequency.value);
  const intensity = Number(controlEls.skyStormIntensity.value);
  const size = Number(controlEls.skyStormSize.value);
  const cloudThreshold = Number(controlEls.skyStormCloudThreshold.value);
  const band = Number(controlEls.skyStormBand.value);
  const veil = Number(controlEls.skyStormVeil.value);
  domeMat.uniforms.uStormFrequency.value = frequency;
  domeMat.uniforms.uStormIntensity.value = intensity;
  domeMat.uniforms.uStormSize.value = size;
  domeMat.uniforms.uStormCloudThreshold.value = cloudThreshold;
  domeMat.uniforms.uStormBand.value = band;
  domeMat.uniforms.uStormVeil.value = veil;
  controlEls.skyStormFrequencyVal.textContent = frequency.toFixed(2);
  controlEls.skyStormIntensityVal.textContent = intensity.toFixed(2);
  controlEls.skyStormSizeVal.textContent = size.toFixed(2);
  controlEls.skyStormCloudThresholdVal.textContent = cloudThreshold.toFixed(2);
  controlEls.skyStormBandVal.textContent = band.toFixed(2);
  controlEls.skyStormVeilVal.textContent = veil.toFixed(2);
}

// ---------- material texture helpers ----------
function setupRepeatingTexture(texture, repeatX, repeatY, color = false) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function makeWetAsphaltFacadeTexture(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const grain = ((x * 73 + y * 151 + ((x * y) % 127)) % 97) / 97;
      const wave = Math.sin(x * 0.075 + y * 0.021) * 0.5 + 0.5;
      const streak = Math.pow(Math.sin(x * 0.035 + Math.sin(y * 0.017) * 1.7) * 0.5 + 0.5, 6);
      const scuff = Math.sin((x + y) * 0.045) * Math.sin(y * 0.19);
      const v = 6 + grain * 18 + wave * 10 + streak * 16 + Math.max(0, scuff) * 9;
      image.data[i] = Math.max(0, Math.min(255, v * 0.38));
      image.data[i + 1] = Math.max(0, Math.min(255, v * 0.78));
      image.data[i + 2] = Math.max(0, Math.min(255, v * 0.86 + 3));
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  return setupRepeatingTexture(tex, 8, 24, true);
}
const asphalt = makeWetAsphaltFacadeTexture();

function makeRoadMicroNormalTexture(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n1 = Math.sin(x * 0.31 + y * 0.17) * 0.5 + 0.5;
      const n2 = Math.sin((x + y) * 0.071) * 0.5 + 0.5;
      const n3 = (((x * 73 + y * 151) % 97) / 97) * 0.5;
      const dx = (n1 - 0.5) * 34 + (n3 - 0.25) * 18;
      const dy = (n2 - 0.5) * 34 - (n3 - 0.25) * 18;
      image.data[i] = THREE.MathUtils.clamp(128 + dx, 0, 255);
      image.data[i + 1] = THREE.MathUtils.clamp(128 + dy, 0, 255);
      image.data[i + 2] = 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(18, 42);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}
const roadMicroNormalTex = makeRoadMicroNormalTexture();

function makeBasePadSurfaceTexture(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      const waveA = Math.sin((nx + ny) * Math.PI * 2) * 0.5 + 0.5;
      const waveB = Math.sin((nx * 2 + 0.17) * Math.PI * 2) * Math.cos((ny * 2 + 0.31) * Math.PI * 2) * 0.5 + 0.5;
      const waveC = Math.sin((nx * 5 + ny * 4) * Math.PI * 2) * 0.5 + 0.5;
      const grain = (((x * 73 + y * 151) % 97) / 97 - 0.5) * 5;
      const sheen = Math.pow(waveA, 5) * 26;
      const value = (waveB - 0.5) * 14 + (waveC - 0.5) * 5 + grain + sheen;
      const i = (y * size + x) * 4;
      image.data[i] = THREE.MathUtils.clamp(64 + value * 0.52, 20, 142);
      image.data[i + 1] = THREE.MathUtils.clamp(86 + value * 0.76, 26, 162);
      image.data[i + 2] = THREE.MathUtils.clamp(92 + value * 0.86, 30, 176);
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  return tex;
}
const basePadSurfaceTex = makeBasePadSurfaceTexture();

// ---------- Exact boulevard map constants from tron-boulevard-map-walk.html ----------
const GRID_BLOCK = 12;
const MAIN_ROAD_WIDTH = 88;
const SIDE_ROAD_LENGTH = 40;
const SIDE_ROAD_X = 64;
const SIDE_BUILDING_X = 96;
const SIDE_ROAD_WIDTH = GRID_BLOCK * 2;
const SIDE_BUILDING_BASE = GRID_BLOCK * 6;
const SIDE_BUILDING_GAP = GRID_BLOCK * 2;
const SIDE_BUILDING_SPACING = SIDE_BUILDING_BASE + SIDE_BUILDING_GAP;
const SIDE_FACADE_LED_REFERENCE_HEIGHT = GRID_BLOCK * 11;
const SIDE_BUILDING_MIN_CLEARANCE = SIDE_BUILDING_GAP;
const BRIDGE_BUILDING_CLEARANCE = 6;
const BRIDGE_INNER_BUILDING_FACE_X = SIDE_BUILDING_X - SIDE_BUILDING_BASE / 2;
const BRIDGE_HALF_SPAN = BRIDGE_INNER_BUILDING_FACE_X - BRIDGE_BUILDING_CLEARANCE;
const MAIN_ROAD_BASE_LENGTH = 560;
const START_SIDE_EXTENSION = GRID_BLOCK * 10;
const MAIN_ROAD_LENGTH = MAIN_ROAD_BASE_LENGTH + START_SIDE_EXTENSION;
const MAIN_ROAD_Z = START_SIDE_EXTENSION / 2;
const MAIN_BUILDING_BASE = 100;
const MAIN_BUILDING_Z = -301;
const laneZ = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map(s => s * SIDE_BUILDING_SPACING);
const crossStreetZ = [];
const STREET_EDGE_WIDTH_DEFAULT = 0;
const STREET_EDGE_WIDTH_MAX = 0;
const MAX_BUILDING_AXIS_SCALE = 8;
const MAX_BOULEVARD_WIDTH_SCALE = 3;
const MAX_DYNAMIC_ROAD_MARGIN = GRID_BLOCK * 8;
const MAIN_BUILDING_SIDE_HEX_EXTENSION_ROWS = 8;
const MAIN_BUILDING_Z_MIN = Number(controlEls.mainBuildingZ?.min ?? -1800);
const MAIN_BUILDING_Z_MAX = Number(controlEls.mainBuildingZ?.max ?? 900);
const MAX_MAIN_BUILDING_Z_EXTENT = Math.max(Math.abs(MAIN_BUILDING_Z_MIN), Math.abs(MAIN_BUILDING_Z_MAX)) +
  MAIN_BUILDING_BASE * MAX_BUILDING_AXIS_SCALE / 2;
const CROSS_STREET_EDGE_WIDTH_MAX = 0;
const MAX_DYNAMIC_ROAD_HALF = Math.max(
  MAIN_ROAD_LENGTH / 2,
  MAX_MAIN_BUILDING_Z_EXTENT,
  Math.max(...laneZ.map((z) => Math.abs(z))) * 8 + SIDE_BUILDING_BASE * MAX_BUILDING_AXIS_SCALE / 2
) + MAX_DYNAMIC_ROAD_MARGIN;
const DYNAMIC_ROAD_MAX_LENGTH = Math.ceil(MAX_DYNAMIC_ROAD_HALF * 2);
const DEFAULT_BASE_PAD_Y = 0.76;
const DEFAULT_BASE_PAD_THICKNESS = 0.28;
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
let basePadGlobalY = 0;
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
let basePadCurbEnabled = true;
let basePadCurbWidth = 4;
let basePadInnerRaise = 0;
let basePadCurbSlope = 1;
let basePadCurbRadius = 0;
let basePadTextureMode = 'on';
let basePadTextureRepeat = 1;
let basePadTextureRotation = 0;
let basePadNormalStrength = 0;
let basePadHue = 0;
let basePadSaturation = 1;
let basePadBrightness = 1;
let basePadMetalness = 0.08;
let basePadRoughness = 0.18;
let basePadReflect = 0.88;
let basePadEmissive = 0.035;
let basePadBevelSize = 0;
let basePadBevelSegments = 1;
let basePadFlatShading = false;
let basePadBorderOpacity = 0.64;
let basePadBorderBrightness = 1;
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
const hexRoadTiles = [];
const hexRoadTileBatches = [];
const streetEdgeHexTiles = [];
const streetEdgeHexTileBatches = [];
const HEX_ROAD_CHUNK_LENGTH = GRID_BLOCK * 20;
let roadBoundaryHexBatch = null;
let roadBoundaryHexCapacity = 0;
let roadBoundaryHexCount = 0;
const roadBoundaryPulseMeshes = {};
const ROAD_BOUNDARY_PULSE_EDGES = ['minX', 'maxX', 'minZ', 'maxZ'];
let lastRoadBoundaryPulseEdge = null;
let lastRoadBoundaryPulseAt = 0;
const hexTileRadius = 1.18 * 3 * 2;
const hexTileHeight = 0.18 * 3;
const HEX_GAP_MIN = -8;
let hexTileGap = 0;
function hexTileRowStep(gap = hexTileGap) {
  return Math.sqrt(3) * hexTileRadius + gap;
}
function hexTileColumnStep(gap = hexTileGap) {
  return hexTileRowStep(gap) * Math.sqrt(3) / 2;
}
function mainBuildingSideBoulevardExtension() {
  return MAIN_BUILDING_SIDE_HEX_EXTENSION_ROWS * Math.max(0.001, hexTileRowStep());
}
const hexTileSeedXStep = hexTileColumnStep(HEX_GAP_MIN);
const hexTileSeedZStep = hexTileRowStep(HEX_GAP_MIN);
let hexPassOffset = -0.22 * 3 * 2 * 2;
let hexDepressRadius = 4.2 * 3 * 2 * 2;
let hexDropDelay = 0;
let hexDropSpeed = 18;
let hexRecovery = 8.5;
let hexTileHeightScale = 1;
let hexTileScale = 1;
let hexTileHitLight = 0.18;
let hexPlayerTileLight = 0.45;
const hexTileBaseColor = new THREE.Color(0x071116);
const hexTileActiveColor = new THREE.Color(0x15343b);
const hexTilePlayerLightColor = new THREE.Color(0x4bdde6);
const hexTileBasePadColor = new THREE.Color(0x6d7e84);
const hexTileDisplayBaseColor = hexTileBaseColor.clone();
const hexTileDisplayActiveColor = hexTileActiveColor.clone();
const hexTileDisplayBaseEmissive = new THREE.Color(0x061419);
const hexTileDisplayHitEmissive = new THREE.Color(0x7df6ff);
const streetEdgeHexInstanceColor = new THREE.Color(0x2a6371);
let hexTileBaseEmissiveIntensity = 0.18;
const hexTileGeo = new THREE.CylinderGeometry(hexTileRadius, hexTileRadius, hexTileHeight, 6, 1, false);
hexTileGeo.rotateY(Math.PI / 6);
function removeIndexedMaterialGroup(geometry, materialIndexToRemove) {
  if (!geometry?.index || !geometry.groups?.length) return geometry;
  const source = geometry.index.array;
  const groups = geometry.groups.slice();
  const nextIndex = [];
  let nextStart = 0;
  geometry.clearGroups();
  for (const group of groups) {
    if (group.materialIndex === materialIndexToRemove) continue;
    for (let i = group.start; i < group.start + group.count; i += 1) {
      nextIndex.push(source[i]);
    }
    geometry.addGroup(nextStart, group.count, group.materialIndex);
    nextStart += group.count;
  }
  geometry.setIndex(new THREE.BufferAttribute(new source.constructor(nextIndex), 1));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
removeIndexedMaterialGroup(hexTileGeo, 2);
const hexTileInstanceMatrix = new THREE.Matrix4();
const hexTileInstancePosition = new THREE.Vector3();
const hexTileInstanceQuaternion = new THREE.Quaternion();
const hexTileInstanceScale = new THREE.Vector3();
const hexTileInstanceColor = new THREE.Color();
const basePadHexInstanceMatrix = new THREE.Matrix4();
const basePadHexInstancePosition = new THREE.Vector3();
const basePadHexInstanceScale = new THREE.Vector3();
const SIDEWALK_CURB_REVEAL = 0.14;
const SIDEWALK_CURB_OVERLAP = 0.035;
const BASE_PAD_FRUSTUM_CULLING_ENABLED = true;
const BASE_PAD_CULLING_BOUNDS_MARGIN = GRID_BLOCK * 3;
const HEX_TILE_BUCKET_SIZE = 64;
const HEX_ROAD_EMPTY_BATCH_CULLING_ENABLED = true;
const HEX_ROAD_UPLOAD_BATCH_LIMIT = 10;
const hexRoadTileBuckets = new Map();
const recoveringHexTiles = new Set();
const hexTileCandidates = [];
let hexTileFrameId = 0;
const dirtyHexTileBatches = new Map();
const hexRoadRuntimeStats = {
  lastCandidateCount: 0,
  lastDirtyUploadCount: 0,
  pendingDirtyBatches: 0,
  uploadDeferredFrames: 0,
};

function roadTileTopY() {
  const maxRoadTileBaseY = 0.03;
  return maxRoadTileBaseY + (hexTileHeight * hexTileHeightScale * 0.5);
}

function sidewalkMinSurfaceY() {
  return roadTileTopY() + SIDEWALK_CURB_REVEAL;
}

const hexTileMat = new THREE.MeshStandardMaterial({
  color: hexTileBaseColor,
  metalness: 0.88,
  roughness: 0.16,
  envMap: getRoadReflectionEnvMap(),
  envMapIntensity: 1.15,
  normalMap: roadMicroNormalTex,
  normalScale: new THREE.Vector2(0, 0),
  emissive: 0x061419,
  emissiveIntensity: 0.18,
});
configureHexRoadMaterial(hexTileMat);
const streetEdgeHexMat = new THREE.MeshStandardMaterial({
  color: 0x2a6371,
  metalness: 0.58,
  roughness: 0.28,
  envMap: reflectionEnvMap,
  envMapIntensity: 0.88,
  emissive: 0x061a20,
  emissiveIntensity: 0.12,
});
const roadBoundaryHexMat = new THREE.MeshStandardMaterial({
  color: 0x5ddfed,
  metalness: 0.42,
  roughness: 0.32,
  envMap: reflectionEnvMap,
  envMapIntensity: 0.55,
  emissive: 0x0b6f7d,
  emissiveIntensity: 0.16,
  transparent: true,
  opacity: 0.38,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const roadBoundaryHexFillMat = new THREE.MeshStandardMaterial({
  color: 0x5ddfed,
  metalness: 0.36,
  roughness: 0.34,
  envMap: reflectionEnvMap,
  envMapIntensity: 0.48,
  emissive: 0x0b6f7d,
  emissiveIntensity: 0.24,
  transparent: true,
  opacity: 0.32,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const roadBoundaryHexBottomMat = roadBoundaryHexFillMat.clone();
roadBoundaryHexBottomMat.opacity = 0;
roadBoundaryHexBottomMat.depthWrite = false;
const roadBoundaryPulseMat = new THREE.MeshBasicMaterial({
  color: 0x7df6ff,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});
const basePadHexMat = new THREE.MeshBasicMaterial({
  color: 0x6f8187,
  transparent: false,
  opacity: 1,
  depthWrite: true,
  depthTest: true,
  polygonOffset: true,
  polygonOffsetFactor: -8,
  polygonOffsetUnits: -8,
  toneMapped: false,
});
let basePadHexOverlay = null;
let basePadHexOverlayCapacity = 0;
const basePadHexClipMat = new THREE.MeshBasicMaterial({
  color: 0x6f8187,
  transparent: false,
  opacity: 1,
  depthWrite: true,
  depthTest: true,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -10,
  polygonOffsetUnits: -10,
  toneMapped: false,
});
const basePadHexClipMesh = new THREE.Mesh(new THREE.BufferGeometry(), basePadHexClipMat);
basePadHexClipMesh.frustumCulled = false;
basePadHexClipMesh.renderOrder = 4;
scene.add(basePadHexClipMesh);
let basePadClippedHexPolygons = 0;
let basePadFullHexOverlays = 0;

function ensureBasePadHexOverlayCapacity(count) {
  const needed = Math.max(1, count);
  if (basePadHexOverlay && basePadHexOverlayCapacity >= needed) return;
  if (basePadHexOverlay) scene.remove(basePadHexOverlay);
  basePadHexOverlayCapacity = needed;
  basePadHexOverlay = new THREE.InstancedMesh(hexTileGeo, basePadHexMat, basePadHexOverlayCapacity);
  basePadHexOverlay.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  basePadHexOverlay.count = 0;
  basePadHexOverlay.frustumCulled = false;
  basePadHexOverlay.renderOrder = 3;
  scene.add(basePadHexOverlay);
}

function hexTileBucketKey(ix, iz) {
  // Numeric key (no per-lookup string alloc); ix/iz are small floored bucket indices.
  return (ix + 100000) * 1000000 + (iz + 100000);
}

function rebuildHexRoadTileBuckets() {
  hexRoadTileBuckets.clear();
  for (const tile of hexRoadTiles) {
    if (!tile.visible || tile.userData.visible === false) continue;
    const ix = Math.floor(tile.userData.x / HEX_TILE_BUCKET_SIZE);
    const iz = Math.floor(tile.userData.z / HEX_TILE_BUCKET_SIZE);
    const key = hexTileBucketKey(ix, iz);
    let bucket = hexRoadTileBuckets.get(key);
    if (!bucket) {
      bucket = [];
      hexRoadTileBuckets.set(key, bucket);
    }
    bucket.push(tile);
  }
}

function queueHexTileCandidate(tile) {
  if (!tile || tile.userData.frameId === hexTileFrameId) return;
  tile.userData.frameId = hexTileFrameId;
  hexTileCandidates.push(tile);
}

function markHexTileBatchDirty(batch, colorChanged = false) {
  dirtyHexTileBatches.set(batch, Boolean(dirtyHexTileBatches.get(batch) || colorChanged));
}

function setHexTileDisplayColor(target, hitLight = 0, playerLight = 0, basePadLight = 0) {
  const padAmount = THREE.MathUtils.clamp(basePadLight, 0, 1);
  if (padAmount > 0.001) {
    target.copy(hexTileBasePadColor);
  } else {
    target.copy(hexTileDisplayBaseColor);
  }
  target
    .lerp(hexTileDisplayActiveColor, THREE.MathUtils.clamp(hitLight, 0, 1))
    .lerp(hexTilePlayerLightColor, THREE.MathUtils.clamp(playerLight, 0, 1));
  target.multiplyScalar(
    1 +
    padAmount * 0.34 +
    THREE.MathUtils.clamp(hitLight, 0, 1) * 0.65 +
    THREE.MathUtils.clamp(playerLight, 0, 1) * 0.9
  );
  return target;
}

function configureHexRoadMaterial(material) {
  if (material.userData.hexRoadConfigured) return material;
  material.userData.hexRoadConfigured = true;
  material.userData.hexInstanceGlow = material.userData.hexInstanceGlow ?? 2.2;
  material.userData.hexGlowBaseColor = material.userData.hexGlowBaseColor?.isColor
    ? material.userData.hexGlowBaseColor
    : hexTileDisplayBaseColor.clone();
  material.onBeforeCompile = (shader) => {
    shader.uniforms.hexInstanceGlow = { value: material.userData.hexInstanceGlow };
    shader.uniforms.hexGlowBaseColor = { value: material.userData.hexGlowBaseColor };
    material.userData.hexInstanceGlowUniform = shader.uniforms.hexInstanceGlow;
    material.userData.hexGlowBaseColorUniform = shader.uniforms.hexGlowBaseColor;
    shader.fragmentShader = `uniform float hexInstanceGlow;\nuniform vec3 hexGlowBaseColor;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
#ifdef USE_COLOR
  vec3 hexInstanceGlowColor = max(vColor.rgb - hexGlowBaseColor, vec3(0.0));
  totalEmissiveRadiance += hexInstanceGlowColor * hexInstanceGlow;
#endif`
    );
  };
  material.customProgramCacheKey = () => 'hex-road-instance-glow-v1';
  material.needsUpdate = true;
  return material;
}

function setHexRoadMaterialGlow(material, glowStrength, baseColor) {
  configureHexRoadMaterial(material);
  material.userData.hexInstanceGlow = glowStrength;
  if (!material.userData.hexGlowBaseColor?.isColor) material.userData.hexGlowBaseColor = new THREE.Color();
  material.userData.hexGlowBaseColor.copy(baseColor);
  if (material.userData.hexInstanceGlowUniform) material.userData.hexInstanceGlowUniform.value = glowStrength;
  if (material.userData.hexGlowBaseColorUniform) material.userData.hexGlowBaseColorUniform.value.copy(baseColor);
}

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

function flushHexTileBatchUploads() {
  if (!dirtyHexTileBatches.size) return;
  let uploaded = 0;
  for (const [batch, colorChanged] of dirtyHexTileBatches) {
    batch.instanceMatrix.needsUpdate = true;
    if (colorChanged && batch.instanceColor) batch.instanceColor.needsUpdate = true;
    dirtyHexTileBatches.delete(batch);
    uploaded += 1;
    if (uploaded >= HEX_ROAD_UPLOAD_BATCH_LIMIT) break;
  }
  hexRoadRuntimeStats.lastDirtyUploadCount = uploaded;
  hexRoadRuntimeStats.pendingDirtyBatches = dirtyHexTileBatches.size;
  if (dirtyHexTileBatches.size) hexRoadRuntimeStats.uploadDeferredFrames += 1;
}

function hexRoadBatchStats(batchRecords) {
  const stats = {
    totalBatches: batchRecords.length,
    activeBatches: 0,
    emptyBatches: 0,
    hiddenBatches: 0,
    activeInstances: 0,
    capacityInstances: 0,
    dirtyBatches: 0,
  };
  for (const record of batchRecords) {
    const count = record.mesh?.count ?? 0;
    stats.capacityInstances += record.tiles.length;
    stats.activeInstances += count;
    if (count > 0) stats.activeBatches += 1;
    else stats.emptyBatches += 1;
    if (record.mesh?.visible === false) stats.hiddenBatches += 1;
    if (dirtyHexTileBatches.has(record.mesh)) stats.dirtyBatches += 1;
  }
  return stats;
}

function hexRoadInspect() {
  return {
    emptyBatchCulling: HEX_ROAD_EMPTY_BATCH_CULLING_ENABLED,
    uploadBatchLimit: HEX_ROAD_UPLOAD_BATCH_LIMIT,
    buckets: hexRoadTileBuckets.size,
    recoveringTiles: recoveringHexTiles.size,
    candidatesLastStep: hexRoadRuntimeStats.lastCandidateCount,
    uploadsLastFrame: hexRoadRuntimeStats.lastDirtyUploadCount,
    pendingDirtyBatches: dirtyHexTileBatches.size,
    uploadDeferredFrames: hexRoadRuntimeStats.uploadDeferredFrames,
    interactive: hexRoadBatchStats(hexRoadTileBatches),
    streetEdge: hexRoadBatchStats(streetEdgeHexTileBatches),
    boundary: {
      count: roadBoundaryHexCount,
      capacity: roadBoundaryHexCapacity,
      visible: Boolean(roadBoundaryHexBatch?.visible),
    },
  };
}

function setHexTileLayoutPosition(tile, sync = true) {
  const xStep = hexTileColumnStep();
  const zStep = hexTileRowStep();
  const localX = tile.userData.col * xStep;
  const zOffset = (tile.userData.col & 1) ? zStep * 0.5 : 0;
  const localZ = tile.userData.row * zStep + zOffset;
  const x = tile.userData.axis === "x" ? tile.userData.centerX + localZ : tile.userData.centerX + localX;
  const z = tile.userData.axis === "x" ? tile.userData.centerZ + localX : tile.userData.centerZ + localZ;
  const withinBounds = Math.abs(localX) <= tile.userData.halfW + tile.userData.edgeBleed &&
    Math.abs(localZ) <= tile.userData.halfL + tile.userData.edgeBleed;
  tile.userData.x = x;
  tile.userData.z = z;
  tile.visible = withinBounds;
  tile.userData.visible = withinBounds;
  if (!withinBounds) {
    tile.userData.depression = 0;
    tile.userData.hitLight = 0;
    tile.userData.playerLight = 0;
    tile.userData.basePadLight = 0;
    tile.userData.wasInfluenced = false;
    recoveringHexTiles.delete(tile);
  }
  if (sync) syncHexTileInstance(tile);
}

function syncHexTileInstance(tile, color = null) {
  if (tile.instanceId < 0) return;
  const visible = tile.visible !== false && tile.userData.visible !== false;
  const scaleXZ = visible ? hexTileScale : 0.0001;
  const scaleY = visible ? (tile.userData.interactive ? hexTileHeightScale : 1) : 0.0001;
  const y = visible ? tile.userData.baseY + tile.userData.depression : -10000;
  hexTileInstancePosition.set(tile.userData.x, y, tile.userData.z);
  hexTileInstanceScale.set(scaleXZ, scaleY, scaleXZ);
  hexTileInstanceMatrix.compose(hexTileInstancePosition, hexTileInstanceQuaternion, hexTileInstanceScale);
  tile.batch.setMatrixAt(tile.instanceId, hexTileInstanceMatrix);
  if (color && tile.batch.setColorAt) {
    tile.batch.setColorAt(tile.instanceId, color);
  }
  if (tile.userData.basePadOverlayId >= 0 && basePadHexOverlay) {
    const overlayVisible = visible && (tile.userData.basePadLight || 0) > 0;
    const overlayScaleXZ = overlayVisible ? hexTileScale : 0.0001;
    const overlayScaleY = overlayVisible ? hexTileHeightScale : 0.0001;
    const overlayY = overlayVisible ? y + 0.12 : -10000;
    basePadHexInstancePosition.set(tile.userData.x, overlayY, tile.userData.z);
    basePadHexInstanceScale.set(overlayScaleXZ, overlayScaleY, overlayScaleXZ);
    basePadHexInstanceMatrix.compose(basePadHexInstancePosition, hexTileInstanceQuaternion, basePadHexInstanceScale);
    basePadHexOverlay.setMatrixAt(tile.userData.basePadOverlayId, basePadHexInstanceMatrix);
    basePadHexOverlay.instanceMatrix.needsUpdate = true;
  }
  markHexTileBatchDirty(tile.batch, Boolean(color));
}

function compactHexTileBatch(batchRecord) {
  let writeIndex = 0;
  for (const tile of batchRecord.tiles) {
    const visible = tile.visible !== false && tile.userData.visible !== false;
    tile.instanceId = visible ? writeIndex++ : -1;
    if (!visible) continue;
    if (batchRecord.interactive) {
      setHexTileDisplayColor(
        hexTileInstanceColor,
        tile.userData.hitLight || 0,
        tile.userData.playerLight || 0,
        tile.userData.basePadLight || 0
      );
      syncHexTileInstance(tile, hexTileInstanceColor);
    } else {
      syncHexTileInstance(tile, streetEdgeHexInstanceColor);
    }
  }
  batchRecord.mesh.count = writeIndex;
  if (HEX_ROAD_EMPTY_BATCH_CULLING_ENABLED) {
    batchRecord.mesh.visible = writeIndex > 0;
  }
  refreshCullingBounds(batchRecord.mesh);
  if (writeIndex > 0) {
    markHexTileBatchDirty(batchRecord.mesh, true);
  } else {
    dirtyHexTileBatches.delete(batchRecord.mesh);
  }
}

function compactHexTileBatchesForTiles(tiles) {
  const batches = new Set();
  for (const tile of tiles) batches.add(tile.batchRecord);
  for (const batchRecord of batches) compactHexTileBatch(batchRecord);
}

function updateHexTileLayout() {
  for (const tile of hexRoadTiles) setHexTileLayoutPosition(tile, false);
  for (const tile of streetEdgeHexTiles) setHexTileLayoutPosition(tile, false);
  for (const batch of hexRoadTileBatches) compactHexTileBatch(batch);
  for (const batch of streetEdgeHexTileBatches) compactHexTileBatch(batch);
  rebuildHexRoadTileBuckets();
}

function updateStreetEdgeHexTileScale() {
  for (const tile of streetEdgeHexTiles) syncHexTileInstance(tile);
}

function updateZTileBand(tiles, centerX, centerZ, width, length) {
  for (const tile of tiles) {
    tile.userData.centerX = centerX;
    tile.userData.centerZ = centerZ;
    tile.userData.halfW = width / 2;
    tile.userData.halfL = length / 2;
    setHexTileLayoutPosition(tile, false);
  }
  compactHexTileBatchesForTiles(tiles);
  rebuildHexRoadTileBuckets();
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

function addHexRoadTileBatch(batchSeeds, material, interactive, createdTiles) {
  const batchMaterial = material.clone();
  batchMaterial.vertexColors = true;
  if (interactive) {
    batchMaterial.userData.hexRoadConfigured = false;
    configureHexRoadMaterial(batchMaterial);
  }
  const batch = new THREE.InstancedMesh(hexTileGeo, batchMaterial, Math.max(1, batchSeeds.length));
  batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  batch.frustumCulled = true;
  scene.add(batch);

  const batchRecord = { mesh: batch, material: batchMaterial, tiles: [], interactive };
  if (interactive) hexRoadTileBatches.push(batchRecord);
  else streetEdgeHexTileBatches.push(batchRecord);

  batchSeeds.forEach((seed, instanceId) => {
    const tile = {
      batch,
      batchRecord,
      instanceId,
      visible: true,
      material: batchMaterial,
      userData: seed,
    };
    batchRecord.tiles.push(tile);
    createdTiles.push(tile);
    if (interactive) hexRoadTiles.push(tile);
    else streetEdgeHexTiles.push(tile);
    setHexTileLayoutPosition(tile, false);
  });

  compactHexTileBatch(batchRecord);
  batch.instanceMatrix.needsUpdate = true;
  if (batch.instanceColor) batch.instanceColor.needsUpdate = true;
  return batchRecord;
}

function addHexRoadTiles(width, length, centerX, centerZ, axis = "z", material = hexTileMat, interactive = true, y = 0) {
  const createdTiles = [];
  const chunkCount = Math.max(1, Math.ceil(length / HEX_ROAD_CHUNK_LENGTH));
  const chunkLength = length / chunkCount;
  const tileSeedChunks = Array.from({ length: chunkCount }, () => []);
  const halfW = width / 2;
  const halfL = length / 2;
  const maxCols = Math.ceil(halfW / hexTileSeedXStep) + 2;
  const maxRows = Math.ceil(halfL / hexTileSeedZStep) + 2;
  const edgeBleed = hexTileRadius * 0.08;
  for (let col = -maxCols; col <= maxCols; col++) {
    const localX = col * hexTileSeedXStep;
    if (Math.abs(localX) > halfW + edgeBleed) continue;
    const zOffset = (col & 1) ? hexTileSeedZStep * 0.5 : 0;
    for (let row = -maxRows; row <= maxRows; row++) {
      const localZ = row * hexTileSeedZStep + zOffset;
      if (Math.abs(localZ) > halfL + edgeBleed) continue;
      const x = axis === "x" ? centerX + localZ : centerX + localX;
      const z = axis === "x" ? centerZ + localX : centerZ + localZ;
      const chunkIndex = THREE.MathUtils.clamp(Math.floor((localZ + halfL) / chunkLength), 0, chunkCount - 1);
      tileSeedChunks[chunkIndex].push({
        x,
        z,
        col,
        row,
        axis,
        centerX,
        centerZ,
        halfW,
        halfL,
        edgeBleed,
        baseY: y,
        depression: 0,
        hitTime: 0,
        wasInfluenced: false,
        hitLight: 0,
        playerLight: 0,
        basePadLight: 0,
        basePadOverlayId: -1,
        interactive,
        visible: true,
      });
    }
  }

  for (const chunkSeeds of tileSeedChunks) {
    if (!chunkSeeds.length) continue;
    addHexRoadTileBatch(chunkSeeds, material, interactive, createdTiles);
  }
  if (interactive) {
    rebuildHexRoadTileBuckets();
  }
  return createdTiles;
}

const ROAD_BOUNDARY_PULSE_HEIGHT = 8;
let roadBoundaryHexEnabled = true;
let roadBoundaryHexRows = 2;
let roadBoundaryHexY = -0.18;
const ROAD_BOUNDARY_ROW_MAX = 10;
const roadBoundaryHexRowOffsets = Array.from({ length: ROAD_BOUNDARY_ROW_MAX }, () => 0);
let roadBoundaryHexAlpha = 0.32;
let roadBoundaryHexFillBrightness = 1;
let roadBoundaryHexOutsetScale = 1;
let roadBoundaryCollisionEnabled = true;
let roadBoundaryCollisionMargin = 1.2;
let roadBoundaryCameraLead = 8;
let roadBoundaryPulseStrength = 0.46;
const roadBoundaryProbeVelocity = new THREE.Vector3();
let boundaryErrorVisible = true;
let boundaryErrorSize = 1;
let boundaryErrorAnchor = 'wall';
let boundaryErrorAnimation = 0.7;
let boundaryErrorDuration = 3;
let boundaryErrorGlitch = 0.65;
let boundaryErrorRenderMode = '3d';
let boundaryErrorFloorLightEnabled = true;
let boundaryErrorFloorLightRadius = 12;
let boundaryErrorFloorLightIntensity = 1;
let boundaryErrorFloorLightOpacity = 0.42;
let boundaryErrorFloorLightHue = 0;
let boundaryErrorFloorLightY = 0.18;
let boundaryErrorFloorLightSoftness = 0.85;
let boundaryErrorFloorLightTextureSoftness = -1;
let boundaryErrorPulse = 0;
let boundaryErrorAge = 0;
let boundaryErrorEdge = 'maxX';
const boundaryErrorHalfFovRad = THREE.MathUtils.degToRad(100); // 200 degree total visibility cone.
const boundaryErrorRenderHalfFovRad = THREE.MathUtils.degToRad(58); // keep the panel out of side/back view.
const boundaryErrorWorldPosition = new THREE.Vector3();
const boundaryErrorPinnedWallPosition = new THREE.Vector3();
const boundaryErrorNextWallPosition = new THREE.Vector3();
const boundaryErrorWallCheckPosition = new THREE.Vector3();
const boundaryErrorScreenPosition = new THREE.Vector3();
const boundaryErrorCameraForward = new THREE.Vector3();
const boundaryErrorViewVector = new THREE.Vector3();
const boundaryErrorPlaneNormal = new THREE.Vector3(0, 0, 1);
const boundaryErrorWallNormal = new THREE.Vector3(0, 0, 1);

function makeBoundaryErrorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const panelX = 72;
  const panelY = 58;
  const panelW = 624;
  const panelH = 214;
  const headerH = 42;

  ctx.save();
  ctx.shadowColor = 'rgba(98,247,255,0.62)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = 'rgba(4,17,21,0.76)';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.restore();

  ctx.fillStyle = 'rgba(101,242,255,0.12)';
  ctx.fillRect(panelX, panelY, panelW, headerH);
  ctx.fillStyle = 'rgba(2,9,12,0.72)';
  ctx.fillRect(panelX + 20, panelY + headerH + 18, panelW - 40, panelH - headerH - 38);

  ctx.strokeStyle = 'rgba(214,253,255,0.94)';
  ctx.lineWidth = 3.2;
  ctx.shadowColor = 'rgba(98,247,255,0.86)';
  ctx.shadowBlur = 16;
  ctx.strokeRect(panelX, panelY, panelW, panelH);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(98,247,255,0.34)';
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX + 18, panelY + headerH + 16, panelW - 36, panelH - headerH - 34);

  ctx.font = '900 34px Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(232,254,255,0.96)';
  ctx.shadowColor = 'rgba(98,247,255,0.88)';
  ctx.shadowBlur = 10;
  ctx.fillText('x', panelX + panelW - 31, panelY + headerH * 0.52);

  ctx.font = '900 84px Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(98,247,255,0.92)';
  ctx.shadowBlur = 24;
  ctx.fillStyle = 'rgba(18,94,104,0.38)';
  ctx.fillText('//error', 394, 187);
  ctx.fillStyle = 'rgba(232,254,255,0.96)';
  ctx.fillText('//error', 384, 176);
  ctx.shadowBlur = 6;
  ctx.strokeStyle = 'rgba(98,247,255,0.86)';
  ctx.lineWidth = 2.4;
  ctx.strokeText('//error', 384, 176);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = 'rgba(98,247,255,0.9)';
  for (let y = panelY + headerH + 24; y < panelY + panelH - 18; y += 8) {
    ctx.fillRect(panelX + 24, y, panelW - 48, 1);
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const boundaryErrorTexture = makeBoundaryErrorTexture();
const boundaryErrorSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: boundaryErrorTexture,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  depthTest: false,
  toneMapped: false,
}));
boundaryErrorSprite.visible = false;
boundaryErrorSprite.renderOrder = 24;
scene.add(boundaryErrorSprite);

const boundaryErrorWallMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({
    map: boundaryErrorTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  })
);
boundaryErrorWallMesh.visible = false;
boundaryErrorWallMesh.frustumCulled = false;
boundaryErrorWallMesh.renderOrder = 24;
scene.add(boundaryErrorWallMesh);

const BOUNDARY_ERROR_WALL_RELOCATE_THRESHOLD = 3.5;
const BOUNDARY_ERROR_OLD_FADE_SECONDS = 1;
const boundaryErrorOldWallMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({
    map: boundaryErrorTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  })
);
boundaryErrorOldWallMesh.visible = false;
boundaryErrorOldWallMesh.frustumCulled = false;
boundaryErrorOldWallMesh.renderOrder = 23;
scene.add(boundaryErrorOldWallMesh);
let boundaryErrorOldWallFade = 0;
let boundaryErrorOldWallFadeStartedAt = 0;

const boundaryErrorBaseImage = boundaryErrorTexture.image;
const boundaryErrorGlitchCanvas = document.createElement('canvas');
boundaryErrorGlitchCanvas.width = 768;
boundaryErrorGlitchCanvas.height = 360;
let boundaryErrorTextureLastAge = -Infinity;
let boundaryErrorTextureLastStrength = -1;

function makeBoundaryErrorGlitchTexture(phase = 0, strength = 0.65) {
  const canvas = boundaryErrorGlitchCanvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(boundaryErrorBaseImage, 0, 0);
  const amount = THREE.MathUtils.clamp(strength, 0, 2);
  if (amount <= 0.001) return canvas;
  const seed = Math.floor(phase * 1000) % 997;
  const slices = 3 + Math.floor(amount * 5);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < slices; i++) {
    const y = 118 + ((seed * 17 + i * 31) % 118);
    const h = 3 + ((seed + i * 13) % 14) * amount;
    const shift = (((seed + i * 7) % 2) ? 1 : -1) * (4 + ((seed + i * 19) % 22)) * amount;
    ctx.globalAlpha = 0.22 + amount * 0.12;
    ctx.drawImage(canvas, 130, y, 500, h, 130 + shift, y, 500, h);
  }
  ctx.globalAlpha = Math.min(0.46, amount * 0.24);
  ctx.fillStyle = 'rgba(98,247,255,0.85)';
  for (let i = 0; i < 5; i++) {
    const y = 112 + ((seed * 11 + i * 41) % 132);
    const x = 146 + ((seed * 23 + i * 37) % 430);
    ctx.fillRect(x, y, 60 + ((seed + i * 5) % 160), 2 + amount * 1.4);
  }
  ctx.restore();
  return canvas;
}

function updateBoundaryErrorGlitchTexture(glitchSnap) {
  if (boundaryErrorGlitch <= 0.001) {
    if (boundaryErrorTexture.image !== boundaryErrorBaseImage) {
      boundaryErrorTexture.image = boundaryErrorBaseImage;
      boundaryErrorTexture.source.data = boundaryErrorBaseImage;
      boundaryErrorTexture.needsUpdate = true;
    }
    boundaryErrorTextureLastAge = -Infinity;
    boundaryErrorTextureLastStrength = -1;
    return;
  }
  const nextStrength = boundaryErrorGlitch * (0.45 + boundaryErrorPulse * 0.55);
  const textureAgeDelta = boundaryErrorAge - boundaryErrorTextureLastAge;
  if (
    textureAgeDelta < 0.08 &&
    Math.abs(nextStrength - boundaryErrorTextureLastStrength) < 0.08
  ) {
    return;
  }
  const nextImage = makeBoundaryErrorGlitchTexture(
    boundaryErrorAge + glitchSnap,
    nextStrength
  );
  boundaryErrorTexture.image = nextImage;
  boundaryErrorTexture.source.data = nextImage;
  boundaryErrorTexture.needsUpdate = true;
  boundaryErrorTextureLastAge = boundaryErrorAge;
  boundaryErrorTextureLastStrength = nextStrength;
}

function makeBoundaryErrorFloorLightTexture(softness = 0.85) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const center = canvas.width / 2;
  const falloff = THREE.MathUtils.clamp(softness, 0.2, 1.8);
  const gradient = ctx.createRadialGradient(center, center, 2, center, center, center);
  gradient.addColorStop(0, 'rgba(255,255,255,0.88)');
  gradient.addColorStop(Math.min(0.82, 0.16 * falloff), 'rgba(255,255,255,0.34)');
  gradient.addColorStop(Math.min(0.94, 0.46 * falloff), 'rgba(255,255,255,0.11)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const boundaryErrorFloorLightMat = new THREE.MeshBasicMaterial({
  color: PAL.cyan,
  map: makeBoundaryErrorFloorLightTexture(boundaryErrorFloorLightSoftness),
  transparent: true,
  opacity: 0,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});
const boundaryErrorFloorLightMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), boundaryErrorFloorLightMat);
boundaryErrorFloorLightMesh.rotation.x = -Math.PI / 2;
boundaryErrorFloorLightMesh.visible = false;
boundaryErrorFloorLightMesh.frustumCulled = false;
boundaryErrorFloorLightMesh.renderOrder = 7;
scene.add(boundaryErrorFloorLightMesh);

function refreshBoundaryErrorFloorLightTexture() {
  const nextSoftness = Number(boundaryErrorFloorLightSoftness.toFixed(3));
  if (Math.abs(boundaryErrorFloorLightTextureSoftness - nextSoftness) < 0.001) return;
  boundaryErrorFloorLightTextureSoftness = nextSoftness;
  boundaryErrorFloorLightMat.map?.dispose?.();
  boundaryErrorFloorLightMat.map = makeBoundaryErrorFloorLightTexture(nextSoftness);
  boundaryErrorFloorLightMat.needsUpdate = true;
}

function hideBoundaryErrorOldWall() {
  boundaryErrorOldWallMesh.visible = false;
  boundaryErrorOldWallFade = 0;
  boundaryErrorOldWallMesh.material.opacity = 0;
}

function hideBoundaryErrorVisuals(keepOldWall = true) {
  boundaryErrorSprite.visible = false;
  boundaryErrorWallMesh.visible = false;
  if (!keepOldWall) hideBoundaryErrorOldWall();
  boundaryErrorOverlay.style.opacity = '0';
  boundaryErrorOverlay.style.setProperty('--error-glitch-opacity', '0');
  boundaryErrorOverlay.style.setProperty('--error-glitch-x', '0');
  boundaryErrorFloorLightMesh.visible = false;
}

function syncTronNoclipControl() {
  if (!controlEls.noclipEnabled) return;
  const value = tronNoclipEnabled ? 'on' : 'off';
  controlEls.noclipEnabled.value = value;
  controlEls.noclipEnabledVal.textContent = value;
}

function isCameraCollisionDisabled() {
  return !cameraCollisionUnlockedByBackspace || tronNoclipEnabled || Boolean(droneIntroFlight?.active);
}

function setTronNoclip(enabled = !tronNoclipEnabled, options = {}) {
  tronNoclipEnabled = Boolean(enabled);
  if (tronNoclipEnabled) {
    boundaryErrorPulse = 0;
    hideBoundaryErrorVisuals(false);
    movementVelocity.set(0, 0, 0);
  }
  syncTronNoclipControl();
  const status = {
    noclip: tronNoclipEnabled,
    command: 'tronNoclip() toggles, tronNoclip(true) enables, tronNoclip(false) disables',
  };
  if (!options.silent) console.log(`TRON noclip ${tronNoclipEnabled ? 'on' : 'off'}`, status);
  return status;
}

window.tronNoclip = setTronNoclip;
window.noclip = setTronNoclip;

function roadHexBoundaryLimits() {
  const halfW = dynamicRoadSurfaceWidth / 2;
  const halfL = dynamicRoadLength / 2;
  const centerZ = dynamicRoadCenter;
  const margin = Math.max(roadBoundaryCollisionMargin, hexTileRadius * hexTileScale * 0.22);
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

function roadBoundaryAlignedGridPosition(col, row) {
  const xStep = hexTileColumnStep();
  const zStep = hexTileRowStep();
  const localX = col * xStep;
  const zOffset = (col & 1) ? zStep * 0.5 : 0;
  const localZ = row * zStep + zOffset;
  return [localX, dynamicRoadCenter + localZ];
}

function roadBoundaryHexPositions() {
  if (!roadBoundaryHexEnabled || roadBoundaryHexRows <= 0) return [];
  const limits = roadHexBoundaryLimits();
  const positions = [];
  // same-grid-as-road-hexes: perimeter tiles are sampled from the boulevard hex lattice.
  const xStep = hexTileColumnStep();
  const zStep = hexTileRowStep();
  const halfW = dynamicRoadSurfaceWidth / 2;
  const halfL = dynamicRoadLength / 2;
  const rowStep = Math.max(xStep, zStep) * Math.max(0.2, roadBoundaryHexOutsetScale);
  const band = rowStep * roadBoundaryHexRows;
  const edgeBleed = hexTileRadius * 0.08;
  const minCol = Math.floor((limits.visualMinX - band) / xStep) - 1;
  const maxCol = Math.ceil((limits.visualMaxX + band) / xStep) + 1;
  const minRow = Math.floor((-halfL - band) / zStep) - 2;
  const maxRow = Math.ceil((halfL + band) / zStep) + 2;
  for (let col = minCol; col <= maxCol; col++) {
    for (let row = minRow; row <= maxRow; row++) {
      const [x, z] = roadBoundaryAlignedGridPosition(col, row);
      const localZ = z - dynamicRoadCenter;
      const insideRoad =
        Math.abs(x) <= halfW + edgeBleed &&
        Math.abs(localZ) <= halfL + edgeBleed;
      if (insideRoad) continue;
      const nearRoad =
        Math.abs(x) <= halfW + band &&
        Math.abs(localZ) <= halfL + band;
      if (!nearRoad) continue;
      const outsideX = Math.max(0, Math.abs(x) - halfW);
      const outsideZ = Math.max(0, Math.abs(localZ) - halfL);
      const rowIndex = THREE.MathUtils.clamp(
        Math.floor(Math.max(outsideX, outsideZ) / Math.max(0.001, rowStep)),
        0,
        Math.min(ROAD_BOUNDARY_ROW_MAX - 1, Math.max(0, roadBoundaryHexRows - 1))
      );
      positions.push({
        x,
        y: roadBoundaryHexY + (roadBoundaryHexRowOffsets[rowIndex] || 0),
        z,
        row: rowIndex,
      });
    }
  }
  return positions;
}

function ensureRoadBoundaryHexCapacity(count) {
  if (roadBoundaryHexBatch && roadBoundaryHexCapacity >= count) return;
  if (roadBoundaryHexBatch) {
    scene.remove(roadBoundaryHexBatch);
    roadBoundaryHexBatch.geometry.dispose();
  }
  roadBoundaryHexCapacity = Math.max(1, Math.ceil(count * 1.2));
  roadBoundaryHexBatch = new THREE.InstancedMesh(hexTileGeo, [roadBoundaryHexMat, roadBoundaryHexFillMat, roadBoundaryHexBottomMat], roadBoundaryHexCapacity);
  roadBoundaryHexBatch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  roadBoundaryHexBatch.frustumCulled = true;
  roadBoundaryHexBatch.renderOrder = 2;
  scene.add(roadBoundaryHexBatch);
}

function updateRoadBoundaryHexRows() {
  const positions = roadBoundaryHexPositions();
  ensureRoadBoundaryHexCapacity(positions.length);
  const boundaryScaleY = Math.max(0.22, hexTileHeightScale * 0.58);
  hexTileInstanceScale.set(hexTileScale, boundaryScaleY, hexTileScale);
  positions.forEach((point, index) => {
    hexTileInstancePosition.set(point.x, point.y, point.z);
    hexTileInstanceMatrix.compose(hexTileInstancePosition, hexTileInstanceQuaternion, hexTileInstanceScale);
    roadBoundaryHexBatch.setMatrixAt(index, hexTileInstanceMatrix);
  });
  roadBoundaryHexCount = positions.length;
  roadBoundaryHexBatch.count = roadBoundaryHexCount;
  roadBoundaryHexBatch.visible = roadBoundaryHexCount > 0;
  roadBoundaryHexBatch.instanceMatrix.needsUpdate = true;
  refreshCullingBounds(roadBoundaryHexBatch);
}

function updateRoadBoundaryHexMaterial(hueDeg, brightness = 1) {
  const sideColor = tunedColor(new THREE.Color(0x5ddfed), hueDeg, 1, Math.max(0.2, brightness));
  const fillBrightness = Math.max(0.02, brightness * roadBoundaryHexFillBrightness);
  const fillColor = tunedColor(new THREE.Color(0x5ddfed), hueDeg, 1, fillBrightness);
  const fillEmissive = tunedColor(new THREE.Color(0x0b6f7d), hueDeg, 1, Math.max(0.2, fillBrightness));
  roadBoundaryHexMat.color.copy(sideColor);
  roadBoundaryHexMat.emissive.copy(tunedColor(new THREE.Color(0x0b6f7d), hueDeg, 1, Math.max(0.32, brightness)));
  roadBoundaryHexMat.opacity = 0.38;
  roadBoundaryHexFillMat.color.copy(fillColor);
  roadBoundaryHexFillMat.emissive.copy(fillEmissive);
  roadBoundaryHexFillMat.emissiveIntensity = 0.1 + roadBoundaryHexFillBrightness * 0.26;
  roadBoundaryHexFillMat.opacity = roadBoundaryHexAlpha;
  roadBoundaryHexBottomMat.color.copy(fillColor);
  roadBoundaryHexBottomMat.emissive.copy(fillEmissive);
  roadBoundaryHexBottomMat.emissiveIntensity = roadBoundaryHexFillMat.emissiveIntensity;
  roadBoundaryHexBottomMat.opacity = 0;
}

function ensureRoadBoundaryPulseMeshes() {
  if (roadBoundaryPulseMeshes.minX) return;
  ROAD_BOUNDARY_PULSE_EDGES.forEach((edge) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), roadBoundaryPulseMat.clone());
    mesh.visible = false;
    mesh.userData.edge = edge;
    mesh.userData.pulse = 0;
    mesh.frustumCulled = true;
    mesh.renderOrder = 8;
    scene.add(mesh);
    roadBoundaryPulseMeshes[edge] = mesh;
  });
}

function setRoadBoundaryPulseGeometry(mesh, width, height) {
  mesh.geometry.dispose();
  mesh.geometry = new THREE.PlaneGeometry(Math.max(0.01, width), Math.max(0.01, height));
  refreshCullingBounds(mesh);
}

function updateRoadBoundaryPulseLayout() {
  ensureRoadBoundaryPulseMeshes();
  const limits = roadHexBoundaryLimits();
  const centerZ = (limits.minZ + limits.maxZ) * 0.5;
  const centerY = roadTileTopY() + ROAD_BOUNDARY_PULSE_HEIGHT * 0.5;
  const width = limits.maxX - limits.minX;
  const length = limits.maxZ - limits.minZ;

  setRoadBoundaryPulseGeometry(roadBoundaryPulseMeshes.minZ, width, ROAD_BOUNDARY_PULSE_HEIGHT);
  roadBoundaryPulseMeshes.minZ.rotation.set(0, 0, 0);
  roadBoundaryPulseMeshes.minZ.position.set(0, centerY, limits.minZ);

  setRoadBoundaryPulseGeometry(roadBoundaryPulseMeshes.maxZ, width, ROAD_BOUNDARY_PULSE_HEIGHT);
  roadBoundaryPulseMeshes.maxZ.rotation.set(0, Math.PI, 0);
  roadBoundaryPulseMeshes.maxZ.position.set(0, centerY, limits.maxZ);

  setRoadBoundaryPulseGeometry(roadBoundaryPulseMeshes.minX, length, ROAD_BOUNDARY_PULSE_HEIGHT);
  roadBoundaryPulseMeshes.minX.rotation.set(0, Math.PI / 2, 0);
  roadBoundaryPulseMeshes.minX.position.set(limits.minX, centerY, centerZ);

  setRoadBoundaryPulseGeometry(roadBoundaryPulseMeshes.maxX, length, ROAD_BOUNDARY_PULSE_HEIGHT);
  roadBoundaryPulseMeshes.maxX.rotation.set(0, -Math.PI / 2, 0);
  roadBoundaryPulseMeshes.maxX.position.set(limits.maxX, centerY, centerZ);
}

function triggerRoadBoundaryPulse(edge) {
  const now = performance.now();
  if (edge === lastRoadBoundaryPulseEdge && now - lastRoadBoundaryPulseAt < 120) return;
  lastRoadBoundaryPulseEdge = edge;
  lastRoadBoundaryPulseAt = now;
  updateRoadBoundaryPulseLayout();
  const mesh = roadBoundaryPulseMeshes[edge];
  if (!mesh) return;
  mesh.userData.pulse = 1;
  mesh.visible = true;
}

function updateRoadBoundaryPulse(dt) {
  ensureRoadBoundaryPulseMeshes();
  for (const edge of ROAD_BOUNDARY_PULSE_EDGES) {
    const mesh = roadBoundaryPulseMeshes[edge];
    if (!mesh) continue;
    const pulse = Math.max(0, (mesh.userData.pulse || 0) - dt * 1.8);
    mesh.userData.pulse = pulse;
    mesh.visible = pulse > 0.01;
    mesh.material.opacity = Math.pow(pulse, 1.35) * roadBoundaryPulseStrength;
    mesh.scale.setScalar(1 + (1 - pulse) * 0.045);
    mesh.scale.y = 1 + (1 - pulse) * 0.72;
  }
}

function boundaryErrorPointForEdge(edge, target = boundaryErrorWorldPosition) {
  const limits = roadHexBoundaryLimits();
  const inset = 1.45;
  const x = THREE.MathUtils.clamp(camera.position.x, limits.minX, limits.maxX);
  const z = THREE.MathUtils.clamp(camera.position.z, limits.minZ, limits.maxZ);
  const y = Math.max(camera.position.y - 0.18, roadTileTopY() + 2.2);
  if (edge === 'minX') return target.set(limits.minX + inset, y, z);
  if (edge === 'maxX') return target.set(limits.maxX - inset, y, z);
  if (edge === 'minZ') return target.set(x, y, limits.minZ + inset);
  return target.set(x, y, limits.maxZ - inset);
}

function boundaryErrorViewDotTo(point = boundaryErrorWorldPosition) {
  camera.getWorldDirection(boundaryErrorCameraForward);
  boundaryErrorViewVector.subVectors(point, camera.position);
  boundaryErrorCameraForward.y = 0;
  boundaryErrorViewVector.y = 0;
  if (boundaryErrorViewVector.lengthSq() < 1e-6 || boundaryErrorCameraForward.lengthSq() < 1e-6) return 1;
  boundaryErrorCameraForward.normalize();
  boundaryErrorViewVector.normalize();
  return boundaryErrorCameraForward.dot(boundaryErrorViewVector);
}

function isBoundaryErrorInView(point = boundaryErrorWorldPosition, halfFovRad = boundaryErrorHalfFovRad) {
  return boundaryErrorViewDotTo(point) >= Math.cos(halfFovRad);
}

function isBoundaryErrorRenderable(point = boundaryErrorWorldPosition) {
  if (!isBoundaryErrorInView(point, boundaryErrorRenderHalfFovRad)) return false;
  boundaryErrorScreenPosition.copy(point).project(camera);
  if (boundaryErrorScreenPosition.z < -1 || boundaryErrorScreenPosition.z > 1) return false;
  return Math.abs(boundaryErrorScreenPosition.x) <= 1.08 && Math.abs(boundaryErrorScreenPosition.y) <= 1.08;
}

function boundaryErrorNormalForEdge(edge, target = boundaryErrorWallNormal) {
  if (edge === 'minX') return target.set(1, 0, 0);
  if (edge === 'maxX') return target.set(-1, 0, 0);
  if (edge === 'minZ') return target.set(0, 0, 1);
  return target.set(0, 0, -1);
}

function orientBoundaryErrorWallMesh(edge) {
  boundaryErrorNormalForEdge(edge, boundaryErrorWallNormal);
  boundaryErrorWallMesh.quaternion.setFromUnitVectors(boundaryErrorPlaneNormal, boundaryErrorWallNormal);
}

function stashCurrentBoundaryErrorWallMesh() {
  if (!boundaryErrorWallMesh.visible || boundaryErrorWallMesh.material.opacity <= 0.01) return;
  boundaryErrorOldWallMesh.position.copy(boundaryErrorWallMesh.position);
  boundaryErrorOldWallMesh.quaternion.copy(boundaryErrorWallMesh.quaternion);
  boundaryErrorOldWallMesh.scale.copy(boundaryErrorWallMesh.scale);
  boundaryErrorOldWallMesh.material.opacity = boundaryErrorWallMesh.material.opacity;
  boundaryErrorOldWallMesh.visible = true;
  boundaryErrorOldWallFade = 1;
  boundaryErrorOldWallFadeStartedAt = performance.now();
}

function updateOldBoundaryErrorWallMesh(dt) {
  if (!boundaryErrorOldWallMesh.visible) return;
  const elapsed = Math.max(0, (performance.now() - boundaryErrorOldWallFadeStartedAt) / 1000);
  boundaryErrorOldWallFade = Math.max(0, 1 - elapsed / BOUNDARY_ERROR_OLD_FADE_SECONDS);
  boundaryErrorOldWallMesh.material.opacity = Math.pow(boundaryErrorOldWallFade, 1.35);
  if (boundaryErrorOldWallFade <= 0.001) {
    boundaryErrorOldWallMesh.visible = false;
    boundaryErrorOldWallMesh.material.opacity = 0;
  }
}

function updateBoundaryErrorFloorLight(alpha) {
  if (!boundaryErrorFloorLightEnabled || alpha <= 0.01) {
    boundaryErrorFloorLightMesh.visible = false;
    return;
  }
  refreshBoundaryErrorFloorLightTexture();
  boundaryErrorFloorLightMesh.visible = true;
  boundaryErrorFloorLightMesh.position.set(
    boundaryErrorWorldPosition.x,
    roadTileTopY() + boundaryErrorFloorLightY,
    boundaryErrorWorldPosition.z
  );
  const diameter = Math.max(0.5, boundaryErrorFloorLightRadius * 2);
  boundaryErrorFloorLightMesh.scale.set(diameter, diameter, 1);
  boundaryErrorFloorLightMat.color.copy(tunedColor(new THREE.Color(PAL.cyan), boundaryErrorFloorLightHue, 1, 0.72 + boundaryErrorFloorLightIntensity * 0.34));
  boundaryErrorFloorLightMat.opacity = THREE.MathUtils.clamp(alpha * boundaryErrorFloorLightOpacity * boundaryErrorFloorLightIntensity, 0, 1.25);
}

function triggerBoundaryError(edge = 'maxX') {
  if (!boundaryErrorVisible) return;
  boundaryErrorPointForEdge(edge, boundaryErrorNextWallPosition);
  if (boundaryErrorAnchor === 'wall' && boundaryErrorPulse > 0.05) {
    const moved = boundaryErrorEdge !== edge ||
      boundaryErrorPinnedWallPosition.distanceToSquared(boundaryErrorNextWallPosition) >
        BOUNDARY_ERROR_WALL_RELOCATE_THRESHOLD * BOUNDARY_ERROR_WALL_RELOCATE_THRESHOLD;
    if (!moved) {
      boundaryErrorPulse = Math.max(boundaryErrorPulse, 0.98);
      return;
    }
    stashCurrentBoundaryErrorWallMesh();
  }
  boundaryErrorEdge = edge;
  boundaryErrorWorldPosition.copy(boundaryErrorNextWallPosition);
  boundaryErrorPinnedWallPosition.copy(boundaryErrorNextWallPosition);
  if (!isBoundaryErrorInView(boundaryErrorWorldPosition)) {
    boundaryErrorPulse = 0;
    updateBoundaryError(0);
    return;
  }
  boundaryErrorPulse = 1;
  boundaryErrorAge = 0;
  updateBoundaryError(0);
}

function updateBoundaryError(dt) {
  updateOldBoundaryErrorWallMesh(dt);
  boundaryErrorAge += dt;
  boundaryErrorPulse = Math.max(0, boundaryErrorPulse - dt / Math.max(0.4, boundaryErrorDuration));
  const visible = boundaryErrorVisible && boundaryErrorPulse > 0.01;
  if (!visible) {
    hideBoundaryErrorVisuals();
    return;
  }

  const alpha = Math.pow(boundaryErrorPulse, 1.9);
  const glitchPulse = boundaryErrorGlitch * boundaryErrorPulse;
  const flicker = boundaryErrorAnimation * glitchPulse * (
    Math.sin(boundaryErrorAge * 74) * 0.5 +
    Math.sin(boundaryErrorAge * 131) * 0.32
  );
  const glitchSnap = Math.max(0, Math.sin(boundaryErrorAge * 39.0) * Math.sin(boundaryErrorAge * 91.0));
  const scalePulse = 1 + boundaryErrorAnimation * boundaryErrorPulse * 0.035;

  if (boundaryErrorAnchor === 'wall') {
    boundaryErrorWallCheckPosition.copy(boundaryErrorPinnedWallPosition);
  } else {
    boundaryErrorPointForEdge(boundaryErrorEdge, boundaryErrorWallCheckPosition);
  }
  if (!isBoundaryErrorRenderable(boundaryErrorWallCheckPosition)) {
    boundaryErrorPulse = 0;
    hideBoundaryErrorVisuals();
    return;
  }

  if (boundaryErrorAnchor === 'camera') {
    camera.getWorldDirection(boundaryErrorCameraForward);
    boundaryErrorWorldPosition
      .copy(camera.position)
      .addScaledVector(boundaryErrorCameraForward, 8 + boundaryErrorSize * 2.2);
    boundaryErrorWorldPosition.y += 0.15;
  } else {
    boundaryErrorWorldPosition.copy(boundaryErrorPinnedWallPosition);
  }
  updateBoundaryErrorFloorLight(alpha);
  updateBoundaryErrorGlitchTexture(glitchSnap);

  if (boundaryErrorAnchor === 'wall') {
    boundaryErrorSprite.visible = false;
    boundaryErrorWallMesh.visible = true;
    boundaryErrorWallMesh.position.copy(boundaryErrorWorldPosition);
    boundaryErrorWallMesh.position.addScaledVector(boundaryErrorNormalForEdge(boundaryErrorEdge, boundaryErrorWallNormal), 0.12);
    orientBoundaryErrorWallMesh(boundaryErrorEdge);
    boundaryErrorWallMesh.scale.set(boundaryErrorSize * 11.5, boundaryErrorSize * 5.4, 1);
    boundaryErrorWallMesh.material.opacity = alpha;
    boundaryErrorOverlay.style.opacity = '0';
    return;
  }

  if (boundaryErrorRenderMode === '3d') {
    boundaryErrorWallMesh.visible = false;
    boundaryErrorSprite.visible = true;
    boundaryErrorSprite.position.copy(boundaryErrorWorldPosition);
    boundaryErrorSprite.position.x += glitchSnap * boundaryErrorGlitch * 0.035;
    boundaryErrorSprite.position.y += flicker * 0.08;
    boundaryErrorSprite.scale.set(boundaryErrorSize * 11.5 * scalePulse, boundaryErrorSize * 5.4 * scalePulse, 1);
    boundaryErrorSprite.material.opacity = alpha;
    boundaryErrorSprite.material.rotation = flicker * 0.009;
    boundaryErrorOverlay.style.opacity = '0';
    return;
  }

  boundaryErrorWallMesh.visible = false;
  boundaryErrorSprite.visible = false;
  boundaryErrorOverlay.style.opacity = String(alpha);
  boundaryErrorOverlay.style.fontSize = `${Math.round(18 + boundaryErrorSize * 28)}px`;
  boundaryErrorOverlay.style.filter = `brightness(${1 + boundaryErrorAnimation * boundaryErrorPulse * 0.35})`;
  if (boundaryErrorAnchor === 'wall') {
    boundaryErrorScreenPosition.copy(boundaryErrorWorldPosition).project(camera);
    const behindCamera = boundaryErrorScreenPosition.z < -1 || boundaryErrorScreenPosition.z > 1;
    const screenX = behindCamera ? 50 : (boundaryErrorScreenPosition.x * 0.5 + 0.5) * 100;
    const screenY = behindCamera ? 46 : (-boundaryErrorScreenPosition.y * 0.5 + 0.5) * 100;
    boundaryErrorOverlay.style.left = `${THREE.MathUtils.clamp(screenX, 8, 92)}%`;
    boundaryErrorOverlay.style.top = `${THREE.MathUtils.clamp(screenY, 12, 88)}%`;
  } else {
    boundaryErrorOverlay.style.left = '50%';
    boundaryErrorOverlay.style.top = '46%';
  }
  const jitterX = flicker * 5 + glitchSnap * boundaryErrorGlitch * 9;
  const jitterY = Math.sin(boundaryErrorAge * 93) * boundaryErrorAnimation * boundaryErrorPulse * 1.8;
  boundaryErrorOverlay.style.setProperty('--error-glitch-opacity', String(THREE.MathUtils.clamp(boundaryErrorGlitch * boundaryErrorPulse * 0.34, 0, 0.7)));
  boundaryErrorOverlay.style.setProperty('--error-glitch-x', `${(glitchSnap * boundaryErrorGlitch * 0.22).toFixed(3)}em`);
  boundaryErrorOverlay.style.transform = `translate(calc(-50% + ${jitterX.toFixed(2)}px), calc(-50% + ${jitterY.toFixed(2)}px)) scale(${scalePulse.toFixed(3)})`;
}

const mainRoadTiles = addHexRoadTiles(MAIN_ROAD_TILE_SEED_WIDTH, DYNAMIC_ROAD_MAX_LENGTH, 0, MAIN_ROAD_Z);
updateRoadBoundaryHexRows();
updateRoadBoundaryPulseLayout();

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

function orderedGroundPolygon(points) {
  const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length;
  const cz = points.reduce((sum, p) => sum + p[1], 0) / points.length;
  return points.slice().sort((a, b) =>
    Math.atan2(a[1] - cz, a[0] - cx) - Math.atan2(b[1] - cz, b[0] - cx)
  );
}

function groundShapeGeometry(points) {
  const ordered = orderedGroundPolygon(points);
  const shape = new THREE.Shape();
  shape.moveTo(ordered[0][0], -ordered[0][1]);
  for (let i = 1; i < ordered.length; i++) shape.lineTo(ordered[i][0], -ordered[i][1]);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function setGroundShape(mesh, points) {
  mesh.geometry.dispose();
  mesh.geometry = groundShapeGeometry(points);
}

function setGroundSegment(mesh, p1, p2, thickness = 0.22, height = 0.08) {
  const v1 = new THREE.Vector3(p1[0], 0, p1[1]);
  const v2 = new THREE.Vector3(p2[0], 0, p2[1]);
  const len = v1.distanceTo(v2);
  mesh.geometry.dispose();
  mesh.geometry = new THREE.BoxGeometry(thickness, height, Math.max(0.01, len));
  mesh.position.set((p1[0] + p2[0]) / 2, mesh.position.y, (p1[1] + p2[1]) / 2);
  const dir = new THREE.Vector3().subVectors(v2, v1).normalize();
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
}

function setGroundLineLoop(line, points, y = 0.54) {
  const vertices = [];
  for (const [x, z] of points) vertices.push(x, y, z);
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry();
  line.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  line.computeLineDistances?.();
}

function addGroundLineLoop(points, mat, y = 0.54) {
  const line = new THREE.LineLoop(new THREE.BufferGeometry(), mat);
  setGroundLineLoop(line, points, y);
  scene.add(line);
  return line;
}

function basePadPoints(width, depth, cornerCut) {
  const halfX = width / 2;
  const halfZ = depth / 2;
  const cut = THREE.MathUtils.clamp(cornerCut, 0, Math.max(0, Math.min(halfX, halfZ) - 0.02));
  if (cut <= 0.001) {
    return [
      new THREE.Vector2(-halfX, -halfZ),
      new THREE.Vector2( halfX, -halfZ),
      new THREE.Vector2( halfX,  halfZ),
      new THREE.Vector2(-halfX,  halfZ),
    ];
  }
  return [
    new THREE.Vector2(-halfX + cut, -halfZ),
    new THREE.Vector2( halfX - cut, -halfZ),
    new THREE.Vector2( halfX, -halfZ + cut),
    new THREE.Vector2( halfX,  halfZ - cut),
    new THREE.Vector2( halfX - cut,  halfZ),
    new THREE.Vector2(-halfX + cut,  halfZ),
    new THREE.Vector2(-halfX,  halfZ - cut),
    new THREE.Vector2(-halfX, -halfZ + cut),
  ];
}

function basePadCornerData(points, index, radius) {
  const prev = points[(index - 1 + points.length) % points.length];
  const current = points[index];
  const next = points[(index + 1) % points.length];
  const prevLength = current.distanceTo(prev);
  const nextLength = current.distanceTo(next);
  const amount = THREE.MathUtils.clamp(radius, 0, Math.min(prevLength, nextLength) * 0.45);
  if (amount <= 0.001) {
    return { start: current.clone(), control: current.clone(), end: current.clone(), rounded: false };
  }
  return {
    start: current.clone().add(prev.clone().sub(current).normalize().multiplyScalar(amount)),
    control: current.clone(),
    end: current.clone().add(next.clone().sub(current).normalize().multiplyScalar(amount)),
    rounded: true,
  };
}

function basePadBorderPoints(width, depth, cornerCut, radius) {
  const points = basePadPoints(width, depth, cornerCut);
  const border = [];
  const curveSteps = 8;
  points.forEach((point, index) => {
    const corner = basePadCornerData(points, index, radius);
    border.push(new THREE.Vector3(corner.start.x, 0, corner.start.y));
    if (!corner.rounded) return;
    for (let step = 1; step <= curveSteps; step++) {
      const t = step / curveSteps;
      const inv = 1 - t;
      const x = inv * inv * corner.start.x + 2 * inv * t * point.x + t * t * corner.end.x;
      const z = inv * inv * corner.start.y + 2 * inv * t * point.y + t * t * corner.end.y;
      border.push(new THREE.Vector3(x, 0, z));
    }
  });
  return border;
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

// ---------- Tron energy pulses: bright bands travelling along the boulevard edge lines ----------
const edgePulseState = {
  speed: -30,
  period: 42,
  intensity: 2.0,
};
const edgePulseMaterials = [];
function applyEdgePulseShader(material) {
  // Inject a Z-axis travelling pulse into a MeshBasic edge material (same onBeforeCompile
  // pattern as the facade vertical reveal). The pulse brightens the cyan as it passes so the
  // bloom pass turns it into flowing energy. Tunable via edgePulseState.
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uEdgePulseTime = { value: 0 };
    shader.uniforms.uEdgePulseSpeed = { value: edgePulseState.speed };
    shader.uniforms.uEdgePulsePeriod = { value: edgePulseState.period };
    shader.uniforms.uEdgePulseIntensity = { value: edgePulseState.intensity };
    material.userData.edgePulseTimeUniform = shader.uniforms.uEdgePulseTime;
    // vEdgeAlong = signed distance along the strip's own length (world units, from its centre).
    // The instance's local Z axis is the strip direction, scaled by the strip length.
    shader.vertexShader = `varying float vEdgeAlong;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
#ifdef USE_INSTANCING
vEdgeAlong = position.z * length(instanceMatrix[2].xyz);
#else
vEdgeAlong = position.z;
#endif`
    );
    shader.fragmentShader = `uniform float uEdgePulseTime;
uniform float uEdgePulseSpeed;
uniform float uEdgePulsePeriod;
uniform float uEdgePulseIntensity;
varying float vEdgeAlong;
${shader.fragmentShader}`.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
{
  // Energy scrolls ALONG each strip's length (current flowing through the wire).
  float edgeFlow = fract((vEdgeAlong - uEdgePulseTime * uEdgePulseSpeed) / max(uEdgePulsePeriod, 0.001));
  // sawtooth ramp -> a bright head with a trailing fade travelling along the strip.
  float edgeHead = smoothstep(0.0, 0.12, edgeFlow) * (1.0 - smoothstep(0.12, 1.0, edgeFlow));
  diffuseColor.rgb += diffuseColor.rgb * edgeHead * uEdgePulseIntensity;
}`
    );
  };
  material.customProgramCacheKey = () => 'tron-edge-energy-flow-v4';
  material.needsUpdate = true;
  edgePulseMaterials.push(material);
}

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
const edgeStripSpecs = [];
const sideBuildingEdgeSpecs = [];
const horizontalBuildingLedRings = [];
const facadeLedSpecs = [];
const facadeStripPositionSpecs = [];
const facadeStripBatchParents = new Set();
const mainFacadeVerticalRevealLedSpecs = [];
const facadeStripUnitGeometry = new THREE.BoxGeometry(1, 1, 1);
const facadeRevealWorldPoint = new THREE.Vector3();
let mainFacadeVerticalRevealLedMaterial = null;
let mainBuildingEdgeVerticalRevealLedMaterial = null;
const CITY_REVEAL_MAIN_LED_LAYER = 2;
const mainBuildingVerticalRevealOverlayObjects = new Set();
let mainBuildingVerticalRevealOverlayLayerActive = false;
const CITY_REVEAL_MAIN_LED_VISIBLE_DELAY_MS = 1500;
const CITY_REVEAL_MAIN_LED_OVERLAY_COMPLETE_PROGRESS = 0.999;
const CITY_REVEAL_MAIN_LED_SCISSOR_ENABLED = true;
const CITY_REVEAL_MAIN_LED_SCISSOR_PADDING_PX = 96;
const CITY_REVEAL_MAIN_LED_SCISSOR_MIN_WIDTH_RATIO = 0.16;
const CITY_REVEAL_MAIN_LED_SCISSOR_MIN_HEIGHT_RATIO = 0.34;
const cityRevealMainLedDepthMat = new THREE.MeshBasicMaterial({
  colorWrite: false,
  depthWrite: true,
  depthTest: true,
  side: THREE.DoubleSide,
});
const cityRevealMainLedDepthScene = new THREE.Scene();
const cityRevealMainLedDepthGroup = new THREE.Group();
const cityRevealMainLedDepthProxyGeometry = new THREE.BoxGeometry(1, 1, 1);
const cityRevealMainLedDepthProxyObjects = [];
let cityRevealMainLedDepthProxyVisibleCount = 0;
let cityRevealMainLedDepthProxyLastMode = 'idle';
cityRevealMainLedDepthScene.add(cityRevealMainLedDepthGroup);
const cityRevealMainLedScissorBox = new THREE.Box3();
const cityRevealMainLedScissorObjectBox = new THREE.Box3();
const cityRevealMainLedScissorCorner = new THREE.Vector3();
const cityRevealMainLedScissorBufferSize = new THREE.Vector2();
const cityRevealMainLedPreviousScissor = new THREE.Vector4();
const cityRevealMainLedScissorState = {
  enabled: CITY_REVEAL_MAIN_LED_SCISSOR_ENABLED,
  active: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  targetWidth: 0,
  targetHeight: 0,
  paddingPx: CITY_REVEAL_MAIN_LED_SCISSOR_PADDING_PX,
};
const MAIN_FACADE_VERTICAL_REVEAL_FEATHER = 18;
const mainFacadeVerticalRevealState = {
  enabled: false,
  active: false,
  progress: 0,
  revealY: -1e9,
  minY: null,
  maxY: null,
  feather: MAIN_FACADE_VERTICAL_REVEAL_FEATHER,
};
let facadeHousingSourceSegmentCount = 0;
let facadeLedSourceSegmentCount = 0;
let sharedFacadeHousingMaterial = null;
const sharedFacadeLedMaterials = new Map();
const sideBuildingDoorGroups = [];
const sideBuildingDoorLedMeshes = [];
const sideBuildingCivicNumberGroups = [];
const sideBuildingCivicNumberMaterials = [];
const sideBuildingCivicNumberTextureCache = new Map();
const sideBuildingCivicNumberPlaneGeometry = new THREE.PlaneGeometry(1, 1);
const sideDoorCount = () => sideBuildingDoorGroups.length;
const sideDoorUnitBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
const SIDE_DOOR_FIXED = Object.freeze({
  enabled: true,
  scale: 0.666,
  width: 16,
  height: 26,
  depth: 7.66,
  y: -2.35,
  faceOffset: 12.7,
});
const SIDE_DOOR_BATCH_PARTS = Object.freeze([
  { key: 'housing', name: 'door-03-back-plate', geometry: 'box', material: 'housing', x: 0, y: 0.03, z: -0.02, w: 1.14, h: 0.94, d: 0.18, renderOrder: 10 },
  { key: 'panel', name: 'door-03-left-leaf', geometry: 'box', material: 'panel', x: -0.22, y: 0.17, z: 0.04, w: 0.32, h: 0.68, d: 0.12, renderOrder: 10 },
  { key: 'panel', name: 'door-03-right-leaf', geometry: 'box', material: 'panel', x: 0.22, y: 0.17, z: 0.04, w: 0.32, h: 0.68, d: 0.12, renderOrder: 10 },
  { key: 'glass', name: 'door-03-energy-seam', geometry: 'box', material: 'glass', x: 0, y: 0.14, z: 0.08, w: 0.035, h: 0.72, d: 0.16, renderOrder: 10 },
  { key: 'glass', name: 'door-03-energy-field', geometry: 'box', material: 'glass', x: 0, y: 0.20, z: 0.105, w: 0.48, h: 0.52, d: 0.08, renderOrder: 10 },
  { key: 'ledAtlas', name: 'door-03-led-atlas', geometry: 'led-plane', material: 'led', x: 0, y: 0.51, z: 0.24, w: 1, h: 1, d: 1, renderOrder: 13 },
]);
const sideDoorBatchState = {
  records: [],
  batches: new Map(),
  built: false,
  instances: 0,
  visibleInstances: 0,
};
const sideDoorWorldMatrix = new THREE.Matrix4();
const sideDoorLocalPosition = new THREE.Vector3();
const sideDoorLocalQuaternion = new THREE.Quaternion();
const sideDoorLocalScale = new THREE.Vector3();
const SIDE_BUILDING_CIVIC_NUMBER_FIXED = Object.freeze({
  singleWidth: 59,
  doubleWidth: 91,
  height: 47,
  faceOffset: 2.1,
  verticalLift: 1.05,
  renderOrder: 18,
  depthLayers: [
    { x: 0, y: 0, z: -0.24, opacity: 0.34, color: 0x05283a },
    { x: 0, y: 0, z: -0.16, opacity: 0.42, color: 0x0a5267 },
    { x: 0, y: 0, z: -0.08, opacity: 0.52, color: 0x1393aa },
  ],
});
const BRIDGE_PAIR_5_6_INDEX = 2;
const BRIDGE_PAIR_5_6_Y_OFFSET = 66;
const sideBuildingEdgeBatch = {
  mesh: null,
  material: null,
  enabled: true,
};
const sideHorizontalLedRingBatches = {
  low: { mesh: null, material: null, specs: [], geometryKey: '', count: 0 },
  high: { mesh: null, material: null, specs: [], geometryKey: '', count: 0 },
};
const basePadLedBatch = {
  mesh: null,
  material: null,
  capacity: 0,
  count: 0,
  sceneVisible: true,
  batches: [],
};
const BASE_PAD_LED_RENDER_ORDER = 12;
const basePadLedUnitGeometry = new THREE.BoxGeometry(1, 1, 1);
let ledDistance = 0;
let mainBuildingCollisionPadding = 7.4;
let buildingHorizontalLedDistance = 0;
let mainBuildingVerticalLedDistance = 0;
let mainBuildingHorizontalLedDistance = 0;
let edgeStripThickness = 0.275;
let buildingHorizontalLedThickness = 0.275;
let mainBuildingHorizontalLedThickness = 0.275;
let buildingHorizontalLedRadius = 1;
let mainBuildingHorizontalLedRadius = 1;
let buildingVerticalLedLength = 1;
let mainBuildingVerticalLedLength = 1;
let buildingVerticalLedY = 0;
let buildingLowLedY = 0;
let buildingHighLedY = 0;
let buildingFacadeLedNormal = 12;
let buildingFacadeLedX = 0;
let buildingFacadeLedY = 0;
let buildingFacadeLedZ = 0;
const sideBuildingFacadeLedSegmentOffsets = Array.from({ length: 6 }, () => ({ u: 0, y: 0, normal: 0 }));
let mainBuildingFacadeLedBrightness = 0.56;
let mainBuildingFacadeLedNormal = 3.8;
let mainBuildingFacadeLedX = 0;
let mainBuildingFacadeLedY = 0;
let mainBuildingFacadeLedZ = 0;
let mainBuildingFacadeLedThickness = 1;
const mainBuildingFacadeLedSegmentOffsets = Array.from({ length: 6 }, () => ({ u: 0, y: 0, normal: 0 }));
let mainBuildingVerticalLedY = 0;
let mainBuildingLowLedY = 0;
let mainBuildingHighLedY = 0;
let sideDoorEnabled = SIDE_DOOR_FIXED.enabled;
let sideDoorScale = SIDE_DOOR_FIXED.scale;
let sideDoorWidth = SIDE_DOOR_FIXED.width;
let sideDoorHeight = SIDE_DOOR_FIXED.height;
let sideDoorDepth = SIDE_DOOR_FIXED.depth;
let sideDoorY = SIDE_DOOR_FIXED.y;
let sideDoorFaceOffset = SIDE_DOOR_FIXED.faceOffset;
let sideDoorHousingMat = null;
let sideDoorPanelMat = null;
let sideDoorGlassMat = null;
let sideDoorLedMat = null;
let sideDoorLedTexture = null;
let sideDoorLedPlaneGeometry = null;
const sideHorizontalLedRingMatrix = new THREE.Matrix4();
const sideHorizontalLedRingPosition = new THREE.Vector3();
const sideHorizontalLedRingQuaternion = new THREE.Quaternion();
const sideHorizontalLedRingScale = new THREE.Vector3(1, 1, 1);
const FACADE_LED_WORLD_OUTSET = SIDE_DOOR_FIXED.faceOffset;
const FACADE_LED_SURFACE_EPS = 0.04;
const MAIN_BUILDING_LED_SURFACE_EPS = 0.16;
const MAIN_FACADE_LED_EXTRA_OUTSET = 3.6;
const basePadSurfaceBaseColor = new THREE.Color(0xa5b7bb);
const basePadSurfaceEmissiveColor = new THREE.Color(0x031014);
const basePadBorderBaseColor = new THREE.Color(0x8aa8b0);
const buildingBasePadBorderMat = new THREE.LineBasicMaterial({
  color: basePadBorderBaseColor,
  transparent: true,
  opacity: 0.64,
});
const basePadSurfaceMat = new THREE.MeshStandardMaterial({
  map: basePadSurfaceTex,
  color: basePadSurfaceBaseColor,
  metalness: 0.08,
  roughness: 0.18,
  envMap: reflectionEnvMap,
  envMapIntensity: 0.88,
  emissive: basePadSurfaceEmissiveColor,
  emissiveIntensity: 0.035,
  side: THREE.DoubleSide,
  transparent: false,
  opacity: 1,
  depthWrite: true,
  depthTest: true,
  polygonOffset: false,
});

function makeBasePadShape(width, depth, cornerCut, radius) {
  const shapePoints = basePadBorderPoints(width, depth, cornerCut, radius).map((point) => new THREE.Vector2(point.x, point.z));
  return new THREE.Shape(shapePoints);
}

function applyBasePadUv(geometry, width, depth) {
  const position = geometry.getAttribute('position');
  const uv = [];
  for (let i = 0; i < position.count; i++) {
    uv.push(position.getX(i) / width + 0.5, -position.getZ(i) / depth + 0.5);
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  return geometry;
}

function makeBasePadSurfaceGeometry(width, depth, cornerCut, radius, thickness) {
  const bevelSize = Math.min(
    Math.max(0, basePadBevelSize),
    Math.max(0, thickness * 0.45),
    Math.max(0, Math.min(width, depth) * 0.045)
  );
  const geometry = new THREE.ExtrudeGeometry(makeBasePadShape(width, depth, cornerCut, radius), {
    depth: thickness,
    bevelEnabled: bevelSize > 0.001,
    bevelSize,
    bevelThickness: bevelSize,
    bevelSegments: Math.max(1, Math.round(basePadBevelSegments)),
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  return applyBasePadUv(geometry, width, depth);
}

function innerBasePadPointsFromOuter(borderPoints, width, depth, inset) {
  const halfX = Math.max(0.001, width / 2);
  const halfZ = Math.max(0.001, depth / 2);
  const ix = Math.max(0.05, (halfX - inset) / halfX);
  const iz = Math.max(0.05, (halfZ - inset) / halfZ);
  return borderPoints.map((point) => new THREE.Vector3(point.x * ix, 0, point.z * iz));
}

function makeBasePadTopGeometry(points, y) {
  if (!points?.length) return new THREE.BufferGeometry();
  const shape = new THREE.Shape(points.map((point) => new THREE.Vector2(point.x, point.z)));
  const geometry = new THREE.ShapeGeometry(shape);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getY(i);
    position.setXYZ(i, x, y, z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function curbRampProfile(t, radiusAmount) {
  const radius = THREE.MathUtils.clamp(radiusAmount, 0, 2);
  const smooth = t * t * (3 - 2 * t);
  return THREE.MathUtils.lerp(t, smooth, Math.min(1, radius));
}

function makeBasePadCurbRampGeometry(outerPoints, innerPoints, outerY, innerY, radiusAmount = 0) {
  if (!outerPoints?.length || outerPoints.length !== innerPoints?.length) return new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];
  const radialSegments = Math.max(1, Math.round(1 + THREE.MathUtils.clamp(radiusAmount, 0, 2) * 8));
  const rings = radialSegments + 1;
  outerPoints.forEach((outer, index) => {
    const inner = innerPoints[index];
    for (let ring = 0; ring < rings; ring++) {
      const t = ring / radialSegments;
      const yT = curbRampProfile(t, radiusAmount);
      positions.push(
        THREE.MathUtils.lerp(outer.x, inner.x, t),
        THREE.MathUtils.lerp(outerY, innerY, yT),
        THREE.MathUtils.lerp(outer.z, inner.z, t)
      );
      uvs.push(index / outerPoints.length, t);
    }
  });
  for (let i = 0; i < outerPoints.length; i++) {
    const next = (i + 1) % outerPoints.length;
    for (let ring = 0; ring < radialSegments; ring++) {
      const a = i * rings + ring;
      const b = next * rings + ring;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, d, a, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createBuildingBasePad(group, x, z) {
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), basePadSurfaceMat);
  mesh.position.set(x, DEFAULT_BASE_PAD_Y - DEFAULT_BASE_PAD_THICKNESS, z);
  mesh.renderOrder = 1;
  mesh.frustumCulled = BASE_PAD_FRUSTUM_CULLING_ENABLED;
  group.add(mesh);

  const curbRamp = new THREE.Mesh(new THREE.BufferGeometry(), basePadSurfaceMat);
  curbRamp.position.set(x, 0, z);
  curbRamp.renderOrder = 2;
  curbRamp.frustumCulled = BASE_PAD_FRUSTUM_CULLING_ENABLED;
  curbRamp.visible = false;
  group.add(curbRamp);

  const innerMesh = new THREE.Mesh(new THREE.BufferGeometry(), basePadSurfaceMat);
  innerMesh.position.set(x, 0, z);
  innerMesh.renderOrder = 3;
  innerMesh.frustumCulled = BASE_PAD_FRUSTUM_CULLING_ENABLED;
  innerMesh.visible = false;
  group.add(innerMesh);

  const border = new THREE.LineLoop(new THREE.BufferGeometry(), buildingBasePadBorderMat);
  border.position.set(x, DEFAULT_BASE_PAD_Y + 0.035, z);
  border.renderOrder = 4;
  border.frustumCulled = BASE_PAD_FRUSTUM_CULLING_ENABLED;
  group.add(border);

  const innerBorder = new THREE.LineLoop(new THREE.BufferGeometry(), buildingBasePadBorderMat);
  innerBorder.position.set(x, DEFAULT_BASE_PAD_Y + 0.035, z);
  innerBorder.renderOrder = 5;
  innerBorder.frustumCulled = BASE_PAD_FRUSTUM_CULLING_ENABLED;
  innerBorder.visible = false;
  group.add(innerBorder);
  return { mesh, curbRamp, innerMesh, border, innerBorder, hitPolygon: [], innerHitPolygon: [], hitHalfSize: 0 };
}

function updateBuildingBasePad(record, x, z, widthScale, depthScale, sizeScale, padXScale, padZScale, padY, padThickness, cornerCut, radius) {
  if (!record.basePad) return;
  const footprintWidth = record.baseW * widthScale;
  const footprintDepth = record.baseD * depthScale;
  const squareSide = Math.max(footprintWidth, footprintDepth) * sizeScale;
  const width = squareSide * padXScale;
  const depth = squareSide * padZScale;
  const requestedPadY = padY + basePadGlobalY;
  const roadTopY = roadTileTopY();
  const contactY = roadTopY - SIDEWALK_CURB_OVERLAP;
  const effectivePadY = Math.max(requestedPadY, sidewalkMinSurfaceY());
  const bottomY = Math.min(effectivePadY - Math.max(0.01, padThickness), contactY);
  const thickness = Math.max(0.01, effectivePadY - bottomY);
  const borderPoints = basePadBorderPoints(width, depth, cornerCut, radius);
  record.basePad.mesh.geometry.dispose();
  record.basePad.mesh.geometry = makeBasePadSurfaceGeometry(width, depth, cornerCut, radius, thickness);
  refreshCullingBoundsWithMargin(record.basePad.mesh, BASE_PAD_CULLING_BOUNDS_MARGIN);
  record.basePad.mesh.position.y = bottomY;
  record.basePad.mesh.position.x = x;
  record.basePad.mesh.position.z = z;
  record.basePad.border.geometry.dispose();
  record.basePad.border.geometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
  refreshCullingBoundsWithMargin(record.basePad.border, BASE_PAD_CULLING_BOUNDS_MARGIN);
  record.basePad.border.position.x = x;
  record.basePad.border.position.y = effectivePadY + 0.035;
  record.basePad.border.position.z = z;
  const curbInset = THREE.MathUtils.clamp(basePadCurbWidth, 0, Math.min(width, depth) * 0.49);
  const hasDoubleCurb = basePadCurbEnabled && curbInset > 0.05;
  if (hasDoubleCurb) {
    const curbOuterPoints = borderPoints.map((point) => point.clone());
    const innerPoints = innerBasePadPointsFromOuter(curbOuterPoints, width, depth, curbInset);
    const innerRaise = Math.max(0, basePadInnerRaise);
    const slopeRaise = innerRaise * THREE.MathUtils.clamp(basePadCurbSlope, 0, 3);
    const curbOuterY = effectivePadY + 0.002;
    const curbInnerY = effectivePadY + Math.max(0.012, slopeRaise + 0.012);
    const innerTopY = effectivePadY + innerRaise + 0.018;
    record.basePad.curbRamp.geometry.dispose();
    record.basePad.curbRamp.geometry = makeBasePadCurbRampGeometry(curbOuterPoints, innerPoints, curbOuterY, curbInnerY, basePadCurbRadius);
    refreshCullingBoundsWithMargin(record.basePad.curbRamp, BASE_PAD_CULLING_BOUNDS_MARGIN);
    record.basePad.curbRamp.position.x = x;
    record.basePad.curbRamp.position.y = 0;
    record.basePad.curbRamp.position.z = z;
    record.basePad.curbRamp.visible = true;
    record.basePad.innerMesh.geometry.dispose();
    record.basePad.innerMesh.geometry = makeBasePadTopGeometry(innerPoints, innerTopY);
    refreshCullingBoundsWithMargin(record.basePad.innerMesh, BASE_PAD_CULLING_BOUNDS_MARGIN);
    record.basePad.innerMesh.position.x = x;
    record.basePad.innerMesh.position.y = 0;
    record.basePad.innerMesh.position.z = z;
    record.basePad.innerMesh.visible = true;
    record.basePad.innerBorder.geometry.dispose();
    record.basePad.innerBorder.geometry = new THREE.BufferGeometry().setFromPoints(innerPoints);
    refreshCullingBoundsWithMargin(record.basePad.innerBorder, BASE_PAD_CULLING_BOUNDS_MARGIN);
    record.basePad.innerBorder.position.x = x;
    record.basePad.innerBorder.position.y = innerTopY + 0.035;
    record.basePad.innerBorder.position.z = z;
    record.basePad.innerBorder.visible = true;
    record.basePad.innerHitPolygon = innerPoints.map((point) => [point.x, point.z]);
    record.basePad.innerTopY = innerTopY;
    record.basePad.curbInset = curbInset;
    record.basePad.curbOuterY = curbOuterY;
    record.basePad.curbSlope = basePadCurbSlope;
    record.basePad.curbRadius = basePadCurbRadius;
  } else {
    record.basePad.curbRamp.visible = false;
    record.basePad.innerMesh.visible = false;
    record.basePad.innerBorder.visible = false;
    record.basePad.innerHitPolygon = [];
    record.basePad.innerTopY = null;
    record.basePad.curbInset = 0;
    record.basePad.curbOuterY = null;
    record.basePad.curbSlope = basePadCurbSlope;
    record.basePad.curbRadius = basePadCurbRadius;
  }
  record.basePad.hitPolygon = borderPoints.map((point) => [point.x, point.z]);
  record.basePad.hitHalfSize = Math.max(width, depth) / 2 + hexTileRadius * Math.max(0.35, hexTileScale * 0.5);
  record.basePad.width = width;
  record.basePad.depth = depth;
  record.basePad.cornerCut = cornerCut;
  record.basePad.radius = radius;
  record.basePad.localY = padY;
  record.basePad.globalY = basePadGlobalY;
  record.basePad.requestedTopY = requestedPadY;
  record.basePad.roadTopY = roadTopY;
  record.basePad.contactY = contactY;
  record.basePad.bottomY = bottomY;
  record.basePad.curbReveal = effectivePadY - roadTopY;
  record.basePad.topY = effectivePadY;
  record.basePad.thickness = thickness;
}

function pointInBasePadPolygon(x, z, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], zi = polygon[i][1];
    const xj = polygon[j][0], zj = polygon[j][1];
    const crosses = (zi > z) !== (zj > z);
    if (crosses && x < ((xj - xi) * (z - zi)) / ((zj - zi) || 1e-6) + xi) inside = !inside;
  }
  return inside;
}

function polygonSignedArea(points) {
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    area += points[j][0] * points[i][1] - points[i][0] * points[j][1];
  }
  return area / 2;
}

function segmentIntersection(a, b, c, d) {
  const bax = b[0] - a[0];
  const baz = b[1] - a[1];
  const dcx = d[0] - c[0];
  const dcz = d[1] - c[1];
  const denominator = bax * dcz - baz * dcx;
  if (Math.abs(denominator) < 1e-6) return b;
  const t = ((c[0] - a[0]) * dcz - (c[1] - a[1]) * dcx) / denominator;
  return [a[0] + bax * t, a[1] + baz * t];
}

function clipPolygonToConvex(subject, clip) {
  let output = subject.slice();
  if (output.length < 3 || clip.length < 3) return [];
  const orientation = polygonSignedArea(clip) >= 0 ? 1 : -1;
  const inside = (point, a, b) => {
    const cross = (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
    return orientation * cross >= -0.001;
  };

  for (let i = 0; i < clip.length; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const input = output;
    output = [];
    if (!input.length) break;
    let previous = input[input.length - 1];
    let previousInside = inside(previous, a, b);
    for (const current of input) {
      const currentInside = inside(current, a, b);
      if (currentInside) {
        if (!previousInside) output.push(segmentIntersection(previous, current, a, b));
        output.push(current);
      } else if (previousInside) {
        output.push(segmentIntersection(previous, current, a, b));
      }
      previous = current;
      previousInside = currentInside;
    }
  }
  return output;
}

function hexTilePolygonLocalToPad(tile, pad) {
  const localX = tile.userData.x - pad.border.position.x;
  const localZ = tile.userData.z - pad.border.position.z;
  const radius = hexTileRadius * hexTileScale;
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 6 + i * Math.PI / 3;
    points.push([
      localX + Math.cos(angle) * radius,
      localZ + Math.sin(angle) * radius,
    ]);
  }
  return points;
}

function appendClippedHexSurface(positions, tile, pad, clippedPolygon) {
  if (clippedPolygon.length < 3) return false;
  const y = tile.userData.baseY + tile.userData.depression + (hexTileHeight * hexTileHeightScale * 0.5) + 0.16;
  const originX = pad.border.position.x;
  const originZ = pad.border.position.z;
  for (let i = 1; i < clippedPolygon.length - 1; i++) {
    const a = clippedPolygon[0];
    const b = clippedPolygon[i];
    const c = clippedPolygon[i + 1];
    positions.push(
      originX + a[0], y, originZ + a[1],
      originX + b[0], y, originZ + b[1],
      originX + c[0], y, originZ + c[1],
    );
  }
  return true;
}

function updateBasePadHexInfluence() {
  for (const tile of hexRoadTiles) {
    if ((tile.userData.basePadLight || 0) > 0 || tile.userData.basePadOverlayId >= 0) {
      tile.userData.basePadLight = 0;
      tile.userData.basePadOverlayId = -1;
      setHexTileDisplayColor(
        hexTileInstanceColor,
        tile.userData.hitLight || 0,
        tile.userData.playerLight || 0,
        0
      );
      syncHexTileInstance(tile, hexTileInstanceColor);
    }
  }
  if (basePadHexOverlay) {
    basePadHexOverlay.count = 0;
    basePadHexOverlay.visible = false;
    basePadHexOverlay.instanceMatrix.needsUpdate = true;
  }
  basePadHexClipMesh.geometry.dispose();
  basePadHexClipMesh.geometry = new THREE.BufferGeometry();
  basePadHexClipMesh.visible = false;
  basePadClippedHexPolygons = 0;
  basePadFullHexOverlays = 0;
}
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
  boundaryErrorPulse = 0;
  hideBoundaryErrorVisuals();
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

function buildingEdgeLoopPoints(w, d, chamfer = 1.5, outset = 0, samples = 72) {
  const hw = w / 2 + outset;
  const hd = d / 2 + outset;
  const c = Math.min(chamfer + outset, hw * 0.8, hd * 0.8);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + c, -hd);
  shape.lineTo(hw - c, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + c);
  shape.lineTo(hw, hd - c);
  shape.quadraticCurveTo(hw, hd, hw - c, hd);
  shape.lineTo(-hw + c, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - c);
  shape.lineTo(-hw, -hd + c);
  shape.quadraticCurveTo(-hw, -hd, -hw + c, -hd);
  const points = shape.getSpacedPoints(Math.max(12, Math.round(samples))).map((point) => [point.x, point.y]);
  const last = points[points.length - 1];
  if (last && Math.hypot(last[0] - points[0][0], last[1] - points[0][1]) < 0.001) points.pop();
  return points;
}

function makeHorizontalLedRingPath(points) {
  const path = new THREE.Path();
  if (!points.length) return path;
  path.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) path.lineTo(points[i][0], points[i][1]);
  path.closePath();
  return path;
}

function makeHorizontalLedRingGeometry(w, d, chamfer, distance, stripWidth, radiusScale = 1) {
  const width = Math.max(0.04, stripWidth);
  const height = Math.max(0.03, width * 0.34);
  const radius = Math.max(0.01, chamfer * radiusScale);
  const outerPoints = buildingEdgeLoopPoints(w, d, radius, distance + width * 0.5, 96);
  const innerLimit = -Math.min(w, d) * 0.48;
  const innerOutset = Math.max(innerLimit, distance - width * 0.5);
  const innerPoints = buildingEdgeLoopPoints(w, d, radius, innerOutset, 96).reverse();
  const shape = new THREE.Shape();
  if (outerPoints.length) {
    shape.moveTo(outerPoints[0][0], outerPoints[0][1]);
    for (let i = 1; i < outerPoints.length; i++) shape.lineTo(outerPoints[i][0], outerPoints[i][1]);
    shape.closePath();
  }
  shape.holes.push(makeHorizontalLedRingPath(innerPoints));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    steps: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.userData.ledHeight = height;
  return geo;
}

function ensureHorizontalLedLoopSegments(spec, count) {
  if (!spec.segmentGroup || !spec.material) return;
  const needed = Math.max(1, count);
  if (spec.segmentMesh && spec.segmentCapacity >= needed) {
    spec.segmentMesh.count = count;
    return;
  }
  if (spec.segmentMesh) {
    spec.segmentGroup.remove(spec.segmentMesh);
    spec.segmentMesh.geometry.dispose();
  }
  const capacity = Math.max(needed, Math.ceil(needed * 1.2));
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), spec.material, capacity);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = true;
  mesh.renderOrder = 8;
  mesh.count = count;
  spec.segmentMesh = mesh;
  spec.segmentCapacity = capacity;
  spec.segmentGroup.add(mesh);
}

function updateHorizontalLedLoopSegments(spec, width, depth, chamfer, distance, stripWidth, radiusScale, centerX, centerY, centerZ, widthScale = 1, depthScale = 1) {
  const radius = Math.max(0.01, chamfer * radiusScale);
  const points = buildingEdgeLoopPoints(width, depth, radius, distance, 128);
  ensureHorizontalLedLoopSegments(spec, points.length);
  if (!points.length) return;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const p1 = [centerX + a[0] * widthScale, centerY, centerZ + a[1] * depthScale];
    const p2 = [centerX + b[0] * widthScale, centerY, centerZ + b[1] * depthScale];
    setStripInstanceTransform(spec.segmentMesh, i, p1, p2, stripWidth);
  }
  spec.segmentMesh.instanceMatrix.needsUpdate = true;
  refreshCullingBounds(spec.segmentMesh);
  spec.segmentCount = points.length;
}

function sideHorizontalLedRingBatchForBand(edgeBand = 'low') {
  return edgeBand === 'high' ? sideHorizontalLedRingBatches.high : sideHorizontalLedRingBatches.low;
}

function getSideHorizontalLedRingMaterial(batch, color = PAL.tealLight) {
  if (batch.material) return batch.material;
  batch.material = new THREE.MeshBasicMaterial({
    color,
    toneMapped: false,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
  return batch.material;
}

function sideHorizontalLedRingGeometryKey(width, depth, chamfer, distance, stripWidth, radiusScale) {
  return [
    width,
    depth,
    chamfer,
    distance,
    stripWidth,
    radiusScale,
  ].map((value) => Number(value).toFixed(3)).join(':');
}

function updateSideHorizontalLedRingBatchGeometry(batch, width, depth, chamfer, distance, stripWidth, radiusScale) {
  if (!batch.mesh) return;
  const key = sideHorizontalLedRingGeometryKey(width, depth, chamfer, distance, stripWidth, radiusScale);
  if (batch.geometryKey === key) return;
  const nextGeometry = makeHorizontalLedRingGeometry(width, depth, chamfer, distance, stripWidth, radiusScale);
  batch.mesh.geometry.dispose();
  batch.mesh.geometry = nextGeometry;
  batch.geometryKey = key;
}

function buildSideHorizontalLedRingBatches(group) {
  for (const batch of Object.values(sideHorizontalLedRingBatches)) {
    if (!batch.specs.length || batch.mesh) continue;
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), getSideHorizontalLedRingMaterial(batch), batch.specs.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = true;
    mesh.renderOrder = 8;
    mesh.count = batch.specs.length;
    batch.mesh = mesh;
    batch.count = batch.specs.length;
    group.add(mesh);
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
  const facadeStripBatches = [];
  for (const parent of facadeStripBatchParents) {
    const parentBatch = parent.userData.facadeStripBatch;
    if (!parentBatch) continue;
    for (const kind of ['housing', 'led']) {
      const meshes = new Set(parentBatch[kind].map((spec) => spec.batchMesh).filter(Boolean));
      for (const mesh of meshes) {
        const specs = parentBatch[kind].filter((spec) => spec.batchMesh === mesh);
        facadeStripBatches.push({
          kind,
          edgeRole: specs[0]?.edgeRole || 'unknown',
          count: mesh.count ?? specs.length,
          visible: Boolean(mesh.visible),
          frustumCulled: Boolean(mesh.frustumCulled),
          x: parent.position?.x ?? null,
          z: parent.position?.z ?? null,
        });
      }
    }
  }
  const facadeStripBatchCount = facadeStripBatches.length;
  const facadeStripVisibleCount = facadeStripBatches.filter((batch) => batch.visible).length;
  const facadeStripFrustumCulledCount = facadeStripBatches.filter((batch) => batch.frustumCulled).length;
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
    facade: {
      ledSpecs: facadeLedSourceSegmentCount,
      housingSpecs: facadeHousingSourceSegmentCount,
      batches: facadeLedSpecs.filter((spec) => spec.batch).length,
      stripBatchCount: facadeStripBatchCount,
      visibleStripBatchCount: facadeStripVisibleCount,
      frustumCulledStripBatchCount: facadeStripFrustumCulledCount,
      stripBatches: facadeStripBatches,
    },
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

function addHorizontalBuildingLedRing(group, w, d, x, y, z, color, options, chamfer, distance = 0) {
  const segmentMode = options.edgeRole === 'main-building';
  const sideBatchMode = options.edgeRole === 'side-building';
  const sideBatch = sideBatchMode ? sideHorizontalLedRingBatchForBand(options.edgeBand) : null;
  const material = segmentMode
    ? createFacadeLedMaterial(color)
    : sideBatchMode
      ? getSideHorizontalLedRingMaterial(sideBatch, color)
    : new THREE.MeshBasicMaterial({
      color,
      toneMapped: false,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
  const mesh = segmentMode || sideBatchMode ? null : new THREE.Mesh(makeHorizontalLedRingGeometry(w, d, chamfer, distance, edgeStripThickness, 1), material);
  const segmentGroup = segmentMode ? new THREE.Group() : null;
  if (mesh) {
    const height = mesh.geometry.userData.ledHeight || Math.max(0.03, edgeStripThickness * 0.34);
    mesh.position.set(x, y - height * 0.5, z);
  }
  const spec = {
    mesh,
    segmentGroup,
    segmentMesh: null,
    segmentCapacity: 0,
    segmentCount: 0,
    segmentMode,
    material,
    w,
    d,
    chamfer,
    distance,
    baseY: y,
    center: options.center ? [...options.center] : [x, z],
    edgeRole: options.edgeRole || 'global',
    edgeBand: options.edgeBand || 'low',
    baseColor: new THREE.Color(color),
  };
  horizontalBuildingLedRings.push(spec);
  if (sideBatchMode && sideBatch) {
    spec.batchRecord = sideBatch;
    spec.batchInstanceId = sideBatch.specs.length;
    sideBatch.specs.push(spec);
    return new THREE.Object3D();
  }
  if (segmentMode) {
    group.add(segmentGroup);
    updateHorizontalLedLoopSegments(spec, w, d, chamfer, distance, edgeStripThickness, 1, x, y, z);
    return segmentGroup;
  }
  group.add(mesh);
  return mesh;
}

function setCityRevealMainLedObjectLayer(object, layer) {
  if (!object?.layers) return;
  object.layers.disableAll();
  object.layers.enable(layer);
}

function registerMainBuildingVerticalRevealOverlayObject(object) {
  if (!object) return;
  mainBuildingVerticalRevealOverlayObjects.add(object);
  if (mainBuildingVerticalRevealOverlayLayerActive) {
    setCityRevealMainLedObjectLayer(object, CITY_REVEAL_MAIN_LED_LAYER);
  }
}

function cityRevealMainLedRevealElapsedMs(now = performance.now()) {
  if (!cityRevealStartedAt) return 0;
  return Math.max(0, now - cityRevealStartedAt - cityRevealEffectiveDelayMs() - CITY_REVEAL_MAIN_LED_VISIBLE_DELAY_MS);
}

function isCityRevealMainLedRevealOverlayActive(now = performance.now()) {
  return isCityRevealRealRevealActive()
    && cityRevealMainLedRevealElapsedMs(now) > 0
    && mainFacadeVerticalRevealProgress() < CITY_REVEAL_MAIN_LED_OVERLAY_COMPLETE_PROGRESS
    && mainBuildingVerticalRevealOverlayObjects.size > 0;
}

function syncMainBuildingVerticalRevealOverlayLayers() {
  const active = isCityRevealMainLedRevealOverlayActive();
  if (active === mainBuildingVerticalRevealOverlayLayerActive) return;
  mainBuildingVerticalRevealOverlayLayerActive = active;
  const layer = active ? CITY_REVEAL_MAIN_LED_LAYER : 0;
  for (const object of mainBuildingVerticalRevealOverlayObjects) {
    setCityRevealMainLedObjectLayer(object, layer);
  }
}

function ensureCityRevealMainLedDepthProxyCount(count) {
  while (cityRevealMainLedDepthProxyObjects.length < count) {
    const proxy = new THREE.Mesh(cityRevealMainLedDepthProxyGeometry, cityRevealMainLedDepthMat);
    proxy.name = 'city-reveal-main-led-depth-proxy';
    proxy.frustumCulled = false;
    proxy.visible = false;
    cityRevealMainLedDepthProxyObjects.push(proxy);
    cityRevealMainLedDepthGroup.add(proxy);
  }
}

function cityRevealMainLedDepthSources() {
  const sources = [];
  for (const record of [...sideBuildingRecords, ...mainBuildingRecords]) {
    const collider = record.collider;
    if (!record.mesh || !collider) continue;
    const width = Math.abs(collider.hw * 2);
    const height = Math.abs(collider.h);
    const depth = Math.abs(collider.hd * 2);
    if (![width, height, depth].every(Number.isFinite) || width <= 0.001 || height <= 0.001 || depth <= 0.001) continue;
    sources.push({
      visible: record.mesh.visible !== false,
      x: Number.isFinite(collider.x) ? collider.x : record.mesh.position.x,
      y: (Number.isFinite(collider.y) ? collider.y : record.mesh.position.y) + height * 0.5,
      z: Number.isFinite(collider.z) ? collider.z : record.mesh.position.z,
      width,
      height,
      depth,
    });
  }
  for (const record of bridgeRecords) {
    if (!record.mesh) continue;
    const width = Math.abs(record.baseWidth * record.mesh.scale.x);
    const height = Math.abs(record.baseHeight * record.mesh.scale.y);
    const depth = Math.abs(record.baseDepth * record.mesh.scale.z);
    if (![width, height, depth].every(Number.isFinite) || width <= 0.001 || height <= 0.001 || depth <= 0.001) continue;
    sources.push({
      visible: record.mesh.visible !== false,
      x: record.mesh.position.x,
      y: record.mesh.position.y + height * 0.5,
      z: record.mesh.position.z,
      width,
      height,
      depth,
    });
  }
  return sources;
}

function syncCityRevealMainLedDepthProxies() {
  const sources = cityRevealMainLedDepthSources();
  ensureCityRevealMainLedDepthProxyCount(sources.length);
  cityRevealMainLedDepthProxyVisibleCount = 0;
  for (let i = 0; i < cityRevealMainLedDepthProxyObjects.length; i++) {
    const proxy = cityRevealMainLedDepthProxyObjects[i];
    const source = sources[i];
    if (!source || !source.visible) {
      proxy.visible = false;
      continue;
    }
    proxy.position.set(source.x, source.y, source.z);
    proxy.scale.set(source.width, source.height, source.depth);
    proxy.visible = true;
    cityRevealMainLedDepthProxyVisibleCount++;
  }
  cityRevealMainLedDepthGroup.visible = cityRevealMainLedDepthProxyVisibleCount > 0;
  return cityRevealMainLedDepthProxyVisibleCount;
}

function resetCityRevealMainLedScissorState() {
  cityRevealMainLedScissorState.active = false;
  cityRevealMainLedScissorState.x = 0;
  cityRevealMainLedScissorState.y = 0;
  cityRevealMainLedScissorState.width = 0;
  cityRevealMainLedScissorState.height = 0;
  cityRevealMainLedScissorState.targetWidth = 0;
  cityRevealMainLedScissorState.targetHeight = 0;
}

function cityRevealMainLedTargetSize(rendererInstance, target) {
  if (target?.width && target?.height) {
    return { width: target.width, height: target.height };
  }
  rendererInstance.getDrawingBufferSize(cityRevealMainLedScissorBufferSize);
  return {
    width: cityRevealMainLedScissorBufferSize.x,
    height: cityRevealMainLedScissorBufferSize.y,
  };
}

function cityRevealMainLedOverlayScissorRect(rendererInstance, target = null) {
  if (!CITY_REVEAL_MAIN_LED_SCISSOR_ENABLED) {
    resetCityRevealMainLedScissorState();
    return null;
  }
  cityRevealMainLedScissorBox.makeEmpty();
  let hasBounds = false;
  for (const object of mainBuildingVerticalRevealOverlayObjects) {
    if (!object?.visible) continue;
    cityRevealMainLedScissorObjectBox.setFromObject(object);
    if (cityRevealMainLedScissorObjectBox.isEmpty()) continue;
    cityRevealMainLedScissorBox.union(cityRevealMainLedScissorObjectBox);
    hasBounds = true;
  }
  const { width: targetWidth, height: targetHeight } = cityRevealMainLedTargetSize(rendererInstance, target);
  if (!hasBounds || targetWidth <= 0 || targetHeight <= 0) {
    resetCityRevealMainLedScissorState();
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const min = cityRevealMainLedScissorBox.min;
  const max = cityRevealMainLedScissorBox.max;
  for (let ix = 0; ix < 2; ix++) {
    for (let iy = 0; iy < 2; iy++) {
      for (let iz = 0; iz < 2; iz++) {
        cityRevealMainLedScissorCorner.set(
          ix ? max.x : min.x,
          iy ? max.y : min.y,
          iz ? max.z : min.z
        );
        cityRevealMainLedScissorCorner.project(camera);
        if (![
          cityRevealMainLedScissorCorner.x,
          cityRevealMainLedScissorCorner.y,
          cityRevealMainLedScissorCorner.z,
        ].every(Number.isFinite)) continue;
        const x = (cityRevealMainLedScissorCorner.x * 0.5 + 0.5) * targetWidth;
        const y = (-cityRevealMainLedScissorCorner.y * 0.5 + 0.5) * targetHeight;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (![minX, minY, maxX, maxY].every(Number.isFinite) || maxX <= minX || maxY <= minY) {
    resetCityRevealMainLedScissorState();
    return null;
  }

  const pixelScale = targetWidth / Math.max(1, window.innerWidth || targetWidth);
  const padding = CITY_REVEAL_MAIN_LED_SCISSOR_PADDING_PX * Math.max(1, pixelScale);
  const minWidth = targetWidth * CITY_REVEAL_MAIN_LED_SCISSOR_MIN_WIDTH_RATIO;
  const minHeight = targetHeight * CITY_REVEAL_MAIN_LED_SCISSOR_MIN_HEIGHT_RATIO;
  const unclampedWidth = Math.max(maxX - minX + padding * 2, minWidth);
  const unclampedHeight = Math.max(maxY - minY + padding * 2, minHeight);
  const rectWidth = Math.min(targetWidth, Math.ceil(unclampedWidth));
  const rectHeight = Math.min(targetHeight, Math.ceil(unclampedHeight));
  const centerX = (minX + maxX) * 0.5;
  const centerY = (minY + maxY) * 0.5;
  const left = Math.floor(THREE.MathUtils.clamp(centerX - rectWidth * 0.5, 0, Math.max(0, targetWidth - rectWidth)));
  const top = Math.floor(THREE.MathUtils.clamp(centerY - rectHeight * 0.5, 0, Math.max(0, targetHeight - rectHeight)));
  const rect = {
    x: left,
    y: Math.max(0, targetHeight - top - rectHeight),
    width: rectWidth,
    height: rectHeight,
    targetWidth,
    targetHeight,
  };
  cityRevealMainLedScissorState.active = rect.width < targetWidth || rect.height < targetHeight;
  cityRevealMainLedScissorState.x = rect.x;
  cityRevealMainLedScissorState.y = rect.y;
  cityRevealMainLedScissorState.width = rect.width;
  cityRevealMainLedScissorState.height = rect.height;
  cityRevealMainLedScissorState.targetWidth = targetWidth;
  cityRevealMainLedScissorState.targetHeight = targetHeight;
  return cityRevealMainLedScissorState.active ? rect : null;
}

function elStrip(p1, p2, color = PAL.tealLight, thickness = 0.04, options = {}) {
  if (options.edge && options.edgeRole === 'side-building') {
    const spec = {
      mesh: null,
      p1: [...p1],
      p2: [...p2],
      center: options.center ? [...options.center] : [0, 0],
      centerY: options.centerY ?? 0,
      baseColor: new THREE.Color(color),
      edgeRole: options.edgeRole || 'global',
      edgeBand: options.edgeBand || 'body',
      roundedLoopOffsetMode: Boolean(options.roundedLoopOffsetMode),
      bridgeRecord: null,
      instanceId: sideBuildingEdgeSpecs.length,
    };
    sideBuildingEdgeSpecs.push(spec);
    edgeStripSpecs.push(spec);
    return new THREE.Object3D();
  }

  const v1 = new THREE.Vector3(...p1);
  const v2 = new THREE.Vector3(...p2);
  const len = v1.distanceTo(v2);
  const geo = new THREE.BoxGeometry(thickness, thickness, len);
  const mat = options.edge && options.edgeRole === 'main-building'
    ? createFacadeLedMaterial(color)
    : new THREE.MeshBasicMaterial({
      color,
      transparent: options.opacity !== undefined && options.opacity < 1,
      opacity: options.opacity ?? 1,
      toneMapped: options.toneMapped ?? false,
      depthWrite: options.depthWrite ?? true,
    });
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(v1).add(v2).multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(v2, v1).normalize();
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  if (options.edge) {
    edgeStripSpecs.push({
      mesh: m,
      p1: [...p1],
      p2: [...p2],
      center: options.center ? [...options.center] : [0, 0],
      centerY: options.centerY ?? 0,
      baseColor: new THREE.Color(color),
      edgeRole: options.edgeRole || 'global',
      edgeBand: options.edgeBand || 'body',
      roundedLoopOffsetMode: Boolean(options.roundedLoopOffsetMode),
      bridgeRecord: options.bridgeRecord || null,
    });
  }
  return m;
}

function addHorizontalBuildingEdgeLoop(group, w, d, x, y, z, color, thickness, options, chamfer, outset) {
  const points = buildingEdgeLoopPoints(w, d, chamfer, outset);
  const loopOptions = { ...options, roundedLoopOffsetMode: true };
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    group.add(elStrip([x + a[0], y, z + a[1]], [x + b[0], y, z + b[1]], color, thickness, loopOptions));
  }
}

function createFacadeHousingMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x011014,
    metalness: 0.78,
    roughness: 0.24,
    envMap: reflectionEnvMap,
    envMapIntensity: 0.9,
    emissive: 0x001e24,
    emissiveIntensity: 0.32,
  });
}

function createFacadeLedMaterial(color = PAL.tealLight) {
  return new THREE.MeshBasicMaterial({
    color,
    toneMapped: false,
    depthWrite: true,
    depthTest: true,
  });
}

function createMainFacadeVerticalRevealLedMaterial(color = PAL.tealLight) {
  const material = createFacadeLedMaterial(color);
  material.transparent = true;
  material.userData.mainFacadeRevealY = -1e9;
  material.userData.mainFacadeRevealFeather = MAIN_FACADE_VERTICAL_REVEAL_FEATHER;
  material.userData.mainFacadeRevealEnabled = 1;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.mainFacadeRevealY = { value: material.userData.mainFacadeRevealY };
    shader.uniforms.mainFacadeRevealFeather = { value: material.userData.mainFacadeRevealFeather };
    shader.uniforms.mainFacadeRevealEnabled = { value: material.userData.mainFacadeRevealEnabled };
    material.userData.mainFacadeRevealYUniform = shader.uniforms.mainFacadeRevealY;
    material.userData.mainFacadeRevealFeatherUniform = shader.uniforms.mainFacadeRevealFeather;
    material.userData.mainFacadeRevealEnabledUniform = shader.uniforms.mainFacadeRevealEnabled;
    shader.vertexShader = `varying float vMainFacadeRevealWorldY;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `vec4 mainFacadeRevealWorldPosition = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
mainFacadeRevealWorldPosition = instanceMatrix * mainFacadeRevealWorldPosition;
#endif
mainFacadeRevealWorldPosition = modelMatrix * mainFacadeRevealWorldPosition;
vMainFacadeRevealWorldY = mainFacadeRevealWorldPosition.y;
#include <worldpos_vertex>`
    );
    shader.fragmentShader = `uniform float mainFacadeRevealY;\nuniform float mainFacadeRevealFeather;\nuniform float mainFacadeRevealEnabled;\nvarying float vMainFacadeRevealWorldY;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <alphatest_fragment>',
      `if (mainFacadeRevealEnabled > 0.5) {
  float revealFeather = max(mainFacadeRevealFeather, 0.001);
  float revealAlpha = 1.0 - smoothstep(mainFacadeRevealY - revealFeather, mainFacadeRevealY, vMainFacadeRevealWorldY);
  if (revealAlpha <= 0.001) discard;
  diffuseColor.a *= revealAlpha;
}
#include <alphatest_fragment>`
    );
  };
  material.customProgramCacheKey = () => 'main-facade-vertical-led-reveal-v1';
  material.needsUpdate = true;
  return material;
}

function getSharedFacadeHousingMaterial() {
  if (!sharedFacadeHousingMaterial) sharedFacadeHousingMaterial = createFacadeHousingMaterial();
  return sharedFacadeHousingMaterial;
}

function getSharedFacadeLedMaterial(edgeRole = 'side-building') {
  const key = edgeRole === 'main-building' ? 'main-building' : 'side-building';
  if (!sharedFacadeLedMaterials.has(key)) sharedFacadeLedMaterials.set(key, createFacadeLedMaterial(PAL.tealLight));
  return sharedFacadeLedMaterials.get(key);
}

function getMainFacadeVerticalRevealLedMaterial() {
  if (!mainFacadeVerticalRevealLedMaterial) {
    mainFacadeVerticalRevealLedMaterial = createMainFacadeVerticalRevealLedMaterial(PAL.tealLight);
  }
  return mainFacadeVerticalRevealLedMaterial;
}

function getMainBuildingEdgeVerticalRevealLedMaterial(color = PAL.tealLight) {
  if (!mainBuildingEdgeVerticalRevealLedMaterial) {
    mainBuildingEdgeVerticalRevealLedMaterial = createMainFacadeVerticalRevealLedMaterial(color);
    mainBuildingEdgeVerticalRevealLedMaterial.customProgramCacheKey = () => 'main-building-edge-vertical-led-reveal-v1';
  }
  return mainBuildingEdgeVerticalRevealLedMaterial;
}

function applyMainFacadeVerticalRevealUniformsTo(material, revealY, feather, enabled) {
  if (!material) return;
  material.userData.mainFacadeRevealY = revealY;
  material.userData.mainFacadeRevealFeather = feather;
  material.userData.mainFacadeRevealEnabled = enabled ? 1 : 0;
  if (material.userData.mainFacadeRevealYUniform) material.userData.mainFacadeRevealYUniform.value = revealY;
  if (material.userData.mainFacadeRevealFeatherUniform) material.userData.mainFacadeRevealFeatherUniform.value = feather;
  if (material.userData.mainFacadeRevealEnabledUniform) material.userData.mainFacadeRevealEnabledUniform.value = enabled ? 1 : 0;
}

function setMainFacadeVerticalRevealUniforms(revealY, feather, enabled) {
  // Apply to both reveal materials without allocating a per-frame array/closure.
  applyMainFacadeVerticalRevealUniformsTo(mainFacadeVerticalRevealLedMaterial, revealY, feather, enabled);
  applyMainFacadeVerticalRevealUniformsTo(mainBuildingEdgeVerticalRevealLedMaterial, revealY, feather, enabled);
}

function facadeAxisScale(edgeRole, face, sideWidthScale = sideBuildingWidthScale, sideDepthScale = sideBuildingDepthScale, mainWidthScale = mainBuildingWidthScale, mainDepthScale = mainBuildingDepthScale) {
  const isMain = edgeRole === 'main-building';
  if (face === 'x') return Math.max(0.001, isMain ? mainWidthScale : sideWidthScale);
  return Math.max(0.001, isMain ? mainDepthScale : sideDepthScale);
}

function facadeLedWorldNormalOffset(edgeRole) {
  if (edgeRole === 'main-building') return mainBuildingFacadeLedNormal;
  if (edgeRole === 'side-building') return buildingFacadeLedNormal;
  return 0;
}

function facadeLedLocalOutset(edgeRole, face, sideWidthScale = sideBuildingWidthScale, sideDepthScale = sideBuildingDepthScale, mainWidthScale = mainBuildingWidthScale, mainDepthScale = mainBuildingDepthScale) {
  return (FACADE_LED_WORLD_OUTSET + facadeLedWorldNormalOffset(edgeRole)) / facadeAxisScale(edgeRole, face, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale);
}

function facadeLedWorldAxisOffset(edgeRole, face, sign) {
  if (edgeRole === 'side-building') {
    if (face === 'x') {
      return { x: buildingFacadeLedX * sign, y: buildingFacadeLedY, z: buildingFacadeLedZ };
    }
    if (face === 'z') {
      return { x: buildingFacadeLedX, y: buildingFacadeLedY, z: buildingFacadeLedZ * sign };
    }
    return { x: buildingFacadeLedX, y: buildingFacadeLedY, z: buildingFacadeLedZ };
  }
  if (edgeRole === 'main-building') {
    return { x: mainBuildingFacadeLedX, y: mainBuildingFacadeLedY, z: mainBuildingFacadeLedZ };
  }
  return { x: 0, y: 0, z: 0 };
}

function facadeStripWorldPosition(basePosition, w, d, face, sign, depth, edgeRole, sideWidthScale = sideBuildingWidthScale, sideDepthScale = sideBuildingDepthScale, mainWidthScale = mainBuildingWidthScale, mainDepthScale = mainBuildingDepthScale, segmentNormalOffset = 0) {
  const position = basePosition.clone();
  const axisScale = facadeAxisScale(edgeRole, face, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale);
  const localOutset = facadeLedLocalOutset(edgeRole, face, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale) + segmentNormalOffset / axisScale;
  if (face === 'x') {
    position.x = sign * (w / 2 + localOutset + depth * 0.5 + FACADE_LED_SURFACE_EPS);
  } else {
    position.z = sign * (d / 2 + localOutset + depth * 0.5 + FACADE_LED_SURFACE_EPS);
  }
  const offset = facadeLedWorldAxisOffset(edgeRole, face, sign);
  position.x += offset.x;
  position.y += offset.y;
  position.z += offset.z;
  return position;
}

function positionFacadeStripMesh(mesh, basePosition, w, d, face, sign, depth, edgeRole, sideWidthScale = sideBuildingWidthScale, sideDepthScale = sideBuildingDepthScale, mainWidthScale = mainBuildingWidthScale, mainDepthScale = mainBuildingDepthScale) {
  mesh.position.copy(facadeStripWorldPosition(basePosition, w, d, face, sign, depth, edgeRole, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale));
}

function setFacadeStripInstanceTransform(spec, sideWidthScale = sideBuildingWidthScale, sideDepthScale = sideBuildingDepthScale, mainWidthScale = mainBuildingWidthScale, mainDepthScale = mainBuildingDepthScale) {
  if (!spec.batchMesh || spec.instanceId < 0) return false;
  const transform = facadeStripDynamicTransform(spec);
  const position = facadeStripWorldPosition(transform.basePosition, spec.w, spec.d, spec.face, spec.sign, transform.depth, spec.edgeRole, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale, facadeSegmentNormalOffset(spec));
  facadeStripMatrix.compose(position, transform.quaternion, transform.scale);
  spec.batchMesh.setMatrixAt(spec.instanceId, facadeStripMatrix);
  spec.lastPosition.copy(position);
  return true;
}

function updateFacadeStripOutsets(sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale) {
  const changedBatches = new Set();
  for (const spec of facadeStripPositionSpecs) {
    if (spec.batchMesh) {
      if (setFacadeStripInstanceTransform(spec, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale)) changedBatches.add(spec.batchMesh);
    } else if (spec.mesh) {
      positionFacadeStripMesh(spec.mesh, spec.basePosition, spec.w, spec.d, spec.face, spec.sign, spec.depth, spec.edgeRole, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale);
    }
  }
  for (const mesh of changedBatches) {
    mesh.instanceMatrix.needsUpdate = true;
    refreshCullingBounds(mesh);
  }
}

const facadeStripMatrix = new THREE.Matrix4();

function facadeBatchState(parent) {
  if (!parent.userData.facadeStripBatch) {
    parent.userData.facadeStripBatch = { housing: [], led: [] };
    facadeStripBatchParents.add(parent);
  }
  return parent.userData.facadeStripBatch;
}

function facadeSegmentOffset(spec) {
  if (spec.edgeRole === 'main-building') {
    const index = spec.mainFacadeSegmentIndex;
    if (index < 0 || index >= mainBuildingFacadeLedSegmentOffsets.length) return null;
    return mainBuildingFacadeLedSegmentOffsets[index];
  }
  if (spec.edgeRole === 'side-building') {
    const index = spec.sideFacadeSegmentIndex;
    if (index < 0 || index >= sideBuildingFacadeLedSegmentOffsets.length) return null;
    return sideBuildingFacadeLedSegmentOffsets[index];
  }
  return null;
}

function facadeSegmentNormalOffset(spec) {
  return facadeSegmentOffset(spec)?.normal || 0;
}

function facadeStripLocalTransform(face, p1, p2, stripWidth, depth) {
  const du = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const length = Math.max(0.001, Math.hypot(du, dy));
  let scale;
  let basePosition;
  const quaternion = new THREE.Quaternion();
  if (face === 'x') {
    scale = new THREE.Vector3(depth, stripWidth, length);
    basePosition = new THREE.Vector3(0, (p1[1] + p2[1]) * 0.5, (p1[0] + p2[0]) * 0.5);
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, dy / length, du / length));
  } else {
    scale = new THREE.Vector3(length, stripWidth, depth);
    basePosition = new THREE.Vector3((p1[0] + p2[0]) * 0.5, (p1[1] + p2[1]) * 0.5, 0);
    quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(du / length, dy / length, 0));
  }
  return { basePosition, quaternion, scale, depth };
}

function facadeStripDynamicTransform(spec) {
  const segmentOffset = facadeSegmentOffset(spec);
  const usesMainFacadeScale = spec.edgeRole === 'main-building' && spec.mainFacadeUsesGlobalControls;
  if (!segmentOffset && !usesMainFacadeScale) return spec;
  const p1 = [...spec.baseP1];
  const p2 = [...spec.baseP2];
  if (segmentOffset) {
    p1[0] += segmentOffset.u;
    p2[0] += segmentOffset.u;
    p1[1] += segmentOffset.y;
    p2[1] += segmentOffset.y;
  }
  const widthScale = usesMainFacadeScale || (segmentOffset && spec.edgeRole === 'main-building') ? Math.max(0.2, mainBuildingFacadeLedThickness) : 1;
  return facadeStripLocalTransform(spec.face, p1, p2, spec.baseStripWidth * widthScale, spec.baseDepth);
}

function addFacadeStrip(parent, w, d, face, sign, p1, p2, stripWidth, depth, material, edgeRole = 'side-building', batchKind = 'housing', options = {}) {
  const transform = facadeStripLocalTransform(face, p1, p2, stripWidth, depth);
  const spec = {
    mesh: null,
    batchMesh: null,
    instanceId: -1,
    material,
    batchKind,
    parent,
    basePosition: transform.basePosition,
    lastPosition: facadeStripWorldPosition(transform.basePosition, w, d, face, sign, depth, edgeRole),
    quaternion: transform.quaternion,
    scale: transform.scale,
    baseP1: [...p1],
    baseP2: [...p2],
    baseStripWidth: stripWidth,
    baseDepth: depth,
    mainFacadeSegmentIndex: Number.isInteger(options.mainFacadeSegmentIndex) ? options.mainFacadeSegmentIndex : -1,
    sideFacadeSegmentIndex: Number.isInteger(options.sideFacadeSegmentIndex) ? options.sideFacadeSegmentIndex : -1,
    mainFacadeUsesGlobalControls: options.mainFacadeUsesGlobalControls === true,
    mainFacadeVerticalReveal: options.mainFacadeVerticalReveal === true,
    w,
    d,
    face,
    sign,
    depth,
    edgeRole,
  };
  facadeStripPositionSpecs.push(spec);
  if (batchKind === 'led' && spec.mainFacadeVerticalReveal) mainFacadeVerticalRevealLedSpecs.push(spec);
  facadeBatchState(parent)[batchKind].push(spec);
  if (batchKind === 'led') facadeLedSourceSegmentCount++;
  else facadeHousingSourceSegmentCount++;
  return new THREE.Object3D();
}

function buildFacadeStripBatch(parent, kind, specs, material, renderOrder) {
  if (!specs.length) return null;
  const edgeRole = specs[0]?.edgeRole || 'side-building';
  const mesh = new THREE.InstancedMesh(facadeStripUnitGeometry, material, specs.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = true;
  mesh.renderOrder = renderOrder;
  mesh.count = specs.length;
  parent.add(mesh);
  specs.forEach((spec, index) => {
    spec.batchMesh = mesh;
    spec.instanceId = index;
    setFacadeStripInstanceTransform(spec);
  });
  mesh.instanceMatrix.needsUpdate = true;
  refreshCullingBounds(mesh);
  if (kind === 'led') {
    const mainFacadeVerticalReveal = specs.some((spec) => spec.mainFacadeVerticalReveal);
    if (mainFacadeVerticalReveal) registerMainBuildingVerticalRevealOverlayObject(mesh);
    facadeLedSpecs.push({
      mesh,
      material,
      edgeRole,
      batch: true,
      segmentCount: specs.length,
      mainFacadeVerticalReveal,
      baseColor: new THREE.Color(PAL.tealLight),
    });
  }
  return mesh;
}

function buildStaticFacadeStripBatches() {
  for (const parent of facadeStripBatchParents) {
    const batch = parent.userData.facadeStripBatch;
    if (!batch || batch.built) continue;
    buildFacadeStripBatch(parent, 'housing', batch.housing, getSharedFacadeHousingMaterial(), 7);
    const revealLedSpecs = batch.led.filter((spec) => spec.mainFacadeVerticalReveal);
    const normalLedSpecs = batch.led.filter((spec) => !spec.mainFacadeVerticalReveal);
    buildFacadeStripBatch(parent, 'led', normalLedSpecs, getSharedFacadeLedMaterial(normalLedSpecs[0]?.edgeRole), 8);
    buildFacadeStripBatch(parent, 'led', revealLedSpecs, getMainFacadeVerticalRevealLedMaterial(), 8);
    batch.built = true;
  }
}

function addFacadeLedSegment(parent, w, d, face, sign, p1, p2, width, role, options = {}) {
  const housingWidth = width * 2.55;
  const stripOptions = {};
  if (options.mainFacadeUsesGlobalControls) stripOptions.mainFacadeUsesGlobalControls = true;
  if (options.mainFacadeVerticalReveal) stripOptions.mainFacadeVerticalReveal = true;
  if (Number.isInteger(options.sideFacadeSegmentIndex)) stripOptions.sideFacadeSegmentIndex = options.sideFacadeSegmentIndex;
  if (options.withHousing !== false) {
    const housing = addFacadeStrip(parent, w, d, face, sign, p1, p2, housingWidth, 0.16, getSharedFacadeHousingMaterial(), role, 'housing', stripOptions);
    housing.renderOrder = 7;
  }
  const light = addFacadeStrip(parent, w, d, face, sign, p1, p2, width, 0.28, getSharedFacadeLedMaterial(role), role, 'led', stripOptions);
  return light;
}

function trimmedFacadeSegment(points, index, width) {
  const a = points[index];
  const b = points[index + 1];
  const du = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.max(0.001, Math.hypot(du, dy));
  const ux = du / len;
  const uy = dy / len;
  const trim = Math.min(width * 0.55, len * 0.32);
  const startTrim = index > 0 ? trim : 0;
  const endTrim = index < points.length - 2 ? trim : 0;
  return [
    [a[0] + ux * startTrim, a[1] + uy * startTrim],
    [b[0] - ux * endTrim, b[1] - uy * endTrim],
  ];
}

function addFacadeLedPolyline(parent, w, d, face, sign, points, width, role, options = {}) {
  if (points.length < 2) return;
  const housingWidth = width * 2.55;
  const hasSegmentControls = Number.isInteger(options.segmentOffset);
  const withHousing = options.withHousing !== false;
  for (let i = 0; i < points.length - 1; i++) {
    const stripOptions = hasSegmentControls ? { mainFacadeSegmentIndex: options.segmentOffset + i } : {};
    if (options.mainFacadeVerticalReveal) stripOptions.mainFacadeVerticalReveal = true;
    const [housingP1, housingP2] = trimmedFacadeSegment(points, i, housingWidth);
    const [ledP1, ledP2] = trimmedFacadeSegment(points, i, width);
    if (withHousing) addFacadeStrip(parent, w, d, face, sign, housingP1, housingP2, housingWidth, 0.16, getSharedFacadeHousingMaterial(), role, 'housing', stripOptions);
    addFacadeStrip(parent, w, d, face, sign, ledP1, ledP2, width, 0.28, getSharedFacadeLedMaterial(role), role, 'led', stripOptions);
  }
}

function addFacadeSlotStack(parent, w, d, h, face, sign, u, yStart, count, role, width, options = {}) {
  const slotH = Math.max(0.72, h * 0.012);
  const slotW = Math.max(width * 2.4, Math.min(w, d) * 0.058);
  const gap = Math.max(slotH * 1.35, h * 0.022);
  const yOffset = options.yOffset || 0;
  for (let i = 0; i < count; i++) {
    const y = yStart + i * gap + yOffset;
    addFacadeLedSegment(parent, w, d, face, sign, [u - slotW * 0.5, y], [u + slotW * 0.5, y], Math.max(width * 0.72, 0.38), role, {
      withHousing: options.withHousing,
      mainFacadeUsesGlobalControls: options.mainFacadeUsesGlobalControls,
      mainFacadeVerticalReveal: options.mainFacadeVerticalReveal,
    });
  }
}

function addTronFacadeTreatment(buildingMesh, w, h, d, options = {}) {
  const face = options.face || 'x';
  const sign = options.sign || 1;
  const role = options.edgeRole || 'side-building';
  const scale = Math.min(w, d);
  const ribbon = Math.max(0.72, scale * 0.018);
  const layoutH = role === 'side-building' ? SIDE_FACADE_LED_REFERENCE_HEIGHT : h;
  const low = layoutH * 0.12;
  const mid = layoutH * 0.48;
  const high = layoutH * 0.88;
  const uA = -scale * 0.30;
  const uB = scale * 0.02;
  const uC = scale * 0.28;

  // Broad inset energy paths: main-building uses clean polylines so corners do not overlap.
  if (role === 'main-building') {
    addFacadeLedPolyline(buildingMesh, w, d, face, sign, [
      [uB, low],
      [uA, low],
      [uA, high * 0.82],
      [uB, high],
      [uC, high],
    ], ribbon, role, { segmentOffset: 0, withHousing: false });
    addFacadeLedPolyline(buildingMesh, w, d, face, sign, [
      [uC, layoutH * 0.22],
      [uC, layoutH * 0.54],
      [uC - scale * 0.13, layoutH * 0.64],
    ], ribbon * 0.72, role, { segmentOffset: 4, withHousing: false });
  } else {
    addFacadeLedSegment(buildingMesh, w, d, face, sign, [uA, low], [uA, high * 0.82], ribbon, role, { sideFacadeSegmentIndex: 0, withHousing: false });
    addFacadeLedSegment(buildingMesh, w, d, face, sign, [uA, high * 0.82], [uB, high], ribbon, role, { sideFacadeSegmentIndex: 1, withHousing: false });
    addFacadeLedSegment(buildingMesh, w, d, face, sign, [uB, high], [uC, high], ribbon * 0.82, role, { sideFacadeSegmentIndex: 2, withHousing: false });
    addFacadeLedSegment(buildingMesh, w, d, face, sign, [uA, low], [uB, low], ribbon * 0.82, role, { sideFacadeSegmentIndex: 3, withHousing: false });

    addFacadeLedSegment(buildingMesh, w, d, face, sign, [uC, layoutH * 0.22], [uC, layoutH * 0.54], ribbon * 0.72, role, { sideFacadeSegmentIndex: 4, withHousing: false });
    addFacadeLedSegment(buildingMesh, w, d, face, sign, [uC, layoutH * 0.54], [uC - scale * 0.13, layoutH * 0.64], ribbon * 0.72, role, { sideFacadeSegmentIndex: 5, withHousing: false });
  }

  addFacadeSlotStack(buildingMesh, w, d, layoutH, face, sign, scale * 0.16, mid, role === 'main-building' ? 8 : 6, role, ribbon, role === 'main-building' ? {
    withHousing: false,
    yOffset: -GRID_BLOCK,
    mainFacadeUsesGlobalControls: true,
    mainFacadeVerticalReveal: true,
  } : { withHousing: false });
}

function shiftedEdgePoint(point, center, distance) {
  const shifted = [...point];
  const dx = point[0] - center[0];
  const dz = point[2] - center[1];
  if (Math.abs(dx) > 0.001) shifted[0] += Math.sign(dx) * distance;
  if (Math.abs(dz) > 0.001) shifted[2] += Math.sign(dz) * distance;
  return shifted;
}

function shiftedHorizontalLoopPoint(point, normalX, normalZ, distance) {
  const shifted = [...point];
  shifted[0] += normalX * distance;
  shifted[2] += normalZ * distance;
  return shifted;
}

function shiftedHorizontalLoopSegment(p1, p2, center, distance) {
  if (Math.abs(distance) <= 0.001) return [[...p1], [...p2]];
  const dx = p2[0] - p1[0];
  const dz = p2[2] - p1[2];
  const length = Math.hypot(dx, dz);
  if (length <= 0.001) return [[...p1], [...p2]];
  let nx = dz / length;
  let nz = -dx / length;
  const mx = (p1[0] + p2[0]) * 0.5 - center[0];
  const mz = (p1[2] + p2[2]) * 0.5 - center[1];
  if (nx * mx + nz * mz < 0) {
    nx *= -1;
    nz *= -1;
  }
  return [
    shiftedHorizontalLoopPoint(p1, nx, nz, distance),
    shiftedHorizontalLoopPoint(p2, nx, nz, distance),
  ];
}

function overlappedHorizontalLoopSegment(p1, p2, thickness) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  const length = Math.hypot(dx, dy, dz);
  if (length <= 0.001) return [[...p1], [...p2]];
  const overlap = Math.min(thickness * 0.72, length * 0.32);
  const ux = dx / length;
  const uy = dy / length;
  const uz = dz / length;
  return [
    [p1[0] - ux * overlap, p1[1] - uy * overlap, p1[2] - uz * overlap],
    [p2[0] + ux * overlap, p2[1] + uy * overlap, p2[2] + uz * overlap],
  ];
}

function edgeCurrentCenter(spec, sideSpacing, streetEdgeW, sideWidthScale, mainWidthScale) {
  if (spec.edgeRole === 'side-building') {
    const sign = spec.center[0] < 0 ? -1 : 1;
    const sideWidth = SIDE_BUILDING_BASE * sideWidthScale;
    return [
      sign * (roadHalf() + streetEdgeW + sideWidth / 2),
      (spec.center[1] / SIDE_BUILDING_SPACING) * SIDE_BUILDING_SPACING * sideSpacing,
    ];
  }
  if (spec.edgeRole === 'main-building') return [0, mainBuildingZ];
  if (spec.edgeRole === 'bridge' && spec.bridgeRecord) {
    return [
      bridgeXOffset + readBridgeNumber(spec.bridgeRecord, 'xOffset'),
      spec.bridgeRecord.zFactor * SIDE_BUILDING_SPACING * sideSpacing + bridgeZOffset + readBridgeNumber(spec.bridgeRecord, 'zOffset'),
    ];
  }
  return spec.center;
}

function scaledEdgePoint(spec, point, sideScale, mainScale, sideWidthScale, sideDepthScale, mainWidthScale, mainDepthScale, sideSpacing, streetEdgeW) {
  const currentCenter = edgeCurrentCenter(spec, sideSpacing, streetEdgeW, sideWidthScale, mainWidthScale);
  const scaled = [...point];
  if (spec.edgeRole === 'side-building') {
    scaled[0] = currentCenter[0] + (point[0] - spec.center[0]) * sideWidthScale;
    scaled[1] *= sideScale;
    scaled[2] = currentCenter[1] + (point[2] - spec.center[1]) * sideDepthScale;
  }
  if (spec.edgeRole === 'main-building') {
    scaled[0] = currentCenter[0] + (point[0] - spec.center[0]) * mainWidthScale;
    scaled[1] = mainBuildingY + scaled[1] * mainScale;
    scaled[2] = currentCenter[1] + (point[2] - spec.center[1]) * mainDepthScale;
  }
  if (spec.edgeRole === 'bridge' && spec.bridgeRecord) {
    const localSpanScale = readBridgeNumber(spec.bridgeRecord, 'spanScale');
    const localHeightScale = readBridgeNumber(spec.bridgeRecord, 'heightScale');
    const localDepthScale = readBridgeNumber(spec.bridgeRecord, 'depthScale');
    const localYOffset = readBridgeNumber(spec.bridgeRecord, 'yOffset');
    const bridgeSpan = bridgeSpanLength(sideWidthScale, streetEdgeW) * bridgeSpanScale * localSpanScale;
    scaled[0] = currentCenter[0] + (point[0] - spec.center[0]) * (bridgeSpan / spec.bridgeRecord.baseWidth);
    scaled[1] = spec.bridgeRecord.baseY + bridgeYOffset + localYOffset + (point[1] - spec.centerY) * bridgeHeightScale * localHeightScale;
    scaled[2] = currentCenter[1] + (point[2] - spec.center[1]) * bridgeDepthScale * localDepthScale;
  }
  return scaled;
}

function setStripTransform(mesh, p1, p2, thickness) {
  const v1 = new THREE.Vector3(...p1);
  const v2 = new THREE.Vector3(...p2);
  const len = v1.distanceTo(v2);
  mesh.geometry.dispose();
  mesh.geometry = new THREE.BoxGeometry(thickness, thickness, len);
  mesh.position.copy(v1).add(v2).multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(v2, v1).normalize();
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
}

function setStripInstanceTransform(mesh, index, p1, p2, thickness) {
  const v1 = new THREE.Vector3(...p1);
  const v2 = new THREE.Vector3(...p2);
  const len = v1.distanceTo(v2);
  const position = v1.clone().add(v2).multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(v2, v1).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  const scale = new THREE.Vector3(thickness, thickness, len);
  const matrix = new THREE.Matrix4().compose(position, quaternion, scale);
  mesh.setMatrixAt(index, matrix);
  return matrix;
}

function buildSideBuildingEdgeBatch(group) {
  if (!sideBuildingEdgeSpecs.length || sideBuildingEdgeBatch.mesh) return;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({
    color: PAL.tealLight,
    toneMapped: false,
    depthWrite: true,
  });
  applyEdgePulseShader(material);
  const mesh = new THREE.InstancedMesh(geometry, material, sideBuildingEdgeSpecs.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = true;
  mesh.count = sideBuildingEdgeSpecs.length;
  sideBuildingEdgeBatch.mesh = mesh;
  sideBuildingEdgeBatch.material = material;
  group.add(mesh);
}

function ensureBasePadLedMaterial() {
  if (basePadLedBatch.material) return basePadLedBatch.material;
  basePadLedBatch.material = new THREE.MeshBasicMaterial({
    color: PAL.tealLight,
    toneMapped: false,
    depthWrite: true,
    // Draw sidewalk LEDs after the fake runner reflection so the reflection
    // cannot visually sit on top of the LED strips.
    transparent: true,
    opacity: 1,
  });
  // Same travelling energy flow as the building edges (instanced strips, local Z = length).
  applyEdgePulseShader(basePadLedBatch.material);
  return basePadLedBatch.material;
}

function basePadLedSegmentCountForRecord(record) {
  let count = 0;
  const points = record.basePad?.hitPolygon;
  if (points?.length > 1) count += points.length;
  const innerPoints = record.basePad?.innerHitPolygon;
  if (basePadCurbEnabled && innerPoints?.length > 1) count += innerPoints.length;
  return count;
}

function ensureBasePadLedBatchForRecord(record, count) {
  const needed = Math.max(1, count);
  let batch = record.basePadLedBatch || null;
  if (batch?.mesh && batch.capacity >= needed) return batch;

  if (batch?.mesh) {
    overlayGroup.remove(batch.mesh);
    const index = basePadLedBatch.batches.indexOf(batch);
    if (index >= 0) basePadLedBatch.batches.splice(index, 1);
  }

  const capacity = Math.max(needed, Math.ceil(needed * 1.25));
  const mesh = new THREE.InstancedMesh(basePadLedUnitGeometry, ensureBasePadLedMaterial(), capacity);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = true;
  mesh.renderOrder = BASE_PAD_LED_RENDER_ORDER;
  batch = { mesh, capacity, count: 0, record };
  record.basePadLedBatch = batch;
  basePadLedBatch.batches.push(batch);
  overlayGroup.add(mesh);
  return batch;
}

function syncBasePadLedBatchAggregate() {
  basePadLedBatch.count = basePadLedBatch.batches.reduce((sum, batch) => sum + batch.count, 0);
  basePadLedBatch.capacity = basePadLedBatch.batches.reduce((sum, batch) => sum + batch.capacity, 0);
  basePadLedBatch.mesh = basePadLedBatch.batches.length === 1 ? basePadLedBatch.batches[0].mesh : null;
}

function basePadLedSegmentCount() {
  let count = 0;
  for (const record of [...sideBuildingRecords, ...mainBuildingRecords]) {
    count += basePadLedSegmentCountForRecord(record);
  }
  return count;
}

function updateBasePadLedStrips(brightness, thickness, offset, hueDeg) {
  const material = ensureBasePadLedMaterial();
  material.color.copy(tunedColor(new THREE.Color(PAL.tealLight), hueDeg, 1, brightness));

  for (const record of [...sideBuildingRecords, ...mainBuildingRecords]) {
    const pad = record.basePad;
    const points = pad?.hitPolygon;
    const batch = ensureBasePadLedBatchForRecord(record, basePadLedSegmentCountForRecord(record));
    const mesh = batch.mesh;
    if (!points?.length) {
      batch.count = 0;
      mesh.count = 0;
      mesh.visible = false;
      continue;
    }
    const baseX = pad.border.position.x;
    const baseZ = pad.border.position.z;
    let index = 0;
    // Right-side buildings (even civic numbers 2, 4, 6, ...) flow the opposite way:
    // swapping the strip endpoints reverses the local-Z the energy travels along.
    const flipFlow = Number.isFinite(record.civicNumberValue) && record.civicNumberValue % 2 === 0;
    const addPadLoop = (loopPoints, loopTopY) => {
      const stripY = loopTopY + Math.max(0.01, thickness * 0.5) + 0.006;
      const orientation = polygonSignedArea(loopPoints) >= 0 ? 1 : -1;
      for (let i = 0; i < loopPoints.length; i++) {
        const a = loopPoints[i];
        const b = loopPoints[(i + 1) % loopPoints.length];
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const len = Math.hypot(dx, dz) || 1;
        const normalX = orientation * dz / len;
        const normalZ = -orientation * dx / len;
        const p1 = [baseX + a[0] + normalX * offset, stripY, baseZ + a[1] + normalZ * offset];
        const p2 = [baseX + b[0] + normalX * offset, stripY, baseZ + b[1] + normalZ * offset];
        if (flipFlow) setStripInstanceTransform(mesh, index, p2, p1, thickness);
        else setStripInstanceTransform(mesh, index, p1, p2, thickness);
        index++;
      }
    };
    addPadLoop(points, pad.topY ?? DEFAULT_BASE_PAD_Y);
    if (basePadCurbEnabled && pad.innerHitPolygon?.length) {
      addPadLoop(pad.innerHitPolygon, pad.innerTopY ?? pad.topY ?? DEFAULT_BASE_PAD_Y);
    }

    batch.count = index;
    mesh.count = index;
    mesh.visible = basePadLedBatch.sceneVisible && record.mesh.visible !== false && index > 0 && brightness > 0.001;
    mesh.instanceMatrix.needsUpdate = true;
    refreshCullingBounds(mesh);
  }
  syncBasePadLedBatchAggregate();
}

function addBuildingEdges(group, w, h, d, x, y, z, color = PAL.tealLight, bevelPadding = 0, edgeRole = 'global', edgeMeta = {}) {
  const thickness = edgeStripThickness;
  const offset = Math.max(0, bevelPadding + thickness * 0.18);
  const hw = w / 2 + offset;
  const hd = d / 2 + offset;
  const yb = y + Math.max(0.08, thickness * 0.52);
  const yt = y + h + offset;
  const footprintChamfer = edgeMeta.footprintChamfer ?? (bevelPadding > 0 ? bevelPadding / 0.6 : 0);
  const commonOptions = { ...edgeMeta, toneMapped: false, depthWrite: true, edge: true, center: [x, z], centerY: y, edgeRole };
  const bodyOptions = { ...commonOptions, edgeBand: 'body' };
  const highOptions = { ...commonOptions, edgeBand: 'high' };
  const lowOptions = { ...commonOptions, edgeBand: 'low' };

  // Attached "04 Linea" perimeter: physical strips on the outer corners, no halo.
  group.add(elStrip([x - hw, yb, z - hd], [x - hw, yt, z - hd], color, thickness, bodyOptions));
  group.add(elStrip([x + hw, yb, z - hd], [x + hw, yt, z - hd], color, thickness, bodyOptions));
  group.add(elStrip([x - hw, yb, z + hd], [x - hw, yt, z + hd], color, thickness, bodyOptions));
  group.add(elStrip([x + hw, yb, z + hd], [x + hw, yt, z + hd], color, thickness, bodyOptions));

  if (edgeRole === 'side-building' || edgeRole === 'main-building') {
    addHorizontalBuildingLedRing(group, w, d, x, yt, z, color, highOptions, footprintChamfer, offset);
    addHorizontalBuildingLedRing(group, w, d, x, yb, z, color, lowOptions, footprintChamfer, offset);
  } else {
    group.add(elStrip([x - hw, yt, z - hd], [x + hw, yt, z - hd], color, thickness, highOptions));
    group.add(elStrip([x + hw, yt, z - hd], [x + hw, yt, z + hd], color, thickness, highOptions));
    group.add(elStrip([x + hw, yt, z + hd], [x - hw, yt, z + hd], color, thickness, highOptions));
    group.add(elStrip([x - hw, yt, z + hd], [x - hw, yt, z - hd], color, thickness, highOptions));

    group.add(elStrip([x - hw, yb, z - hd], [x + hw, yb, z - hd], color, thickness, lowOptions));
    group.add(elStrip([x + hw, yb, z - hd], [x + hw, yb, z + hd], color, thickness, lowOptions));
    group.add(elStrip([x + hw, yb, z + hd], [x - hw, yb, z + hd], color, thickness, lowOptions));
    group.add(elStrip([x - hw, yb, z + hd], [x - hw, yb, z - hd], color, thickness, lowOptions));
  }
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

function ensureSideDoorMaterials() {
  if (sideDoorHousingMat) return;
  sideDoorLedTexture = createSideDoorLedTexture();
  sideDoorLedPlaneGeometry = new THREE.PlaneGeometry(1.28, 1.02);
  sideDoorHousingMat = createWetAsphaltFacadeMaterial(0x020b0e, 1.24);
  sideDoorHousingMat.roughness = 0.16;
  sideDoorHousingMat.emissive.set(0x00191d);
  sideDoorHousingMat.emissiveIntensity = 0.11;
  sideDoorPanelMat = new THREE.MeshStandardMaterial({
    color: 0x000607,
    metalness: 0.82,
    roughness: 0.18,
    envMap: reflectionEnvMap,
    envMapIntensity: 1.45,
    emissive: 0x001014,
    emissiveIntensity: 0.16,
  });
  sideDoorGlassMat = new THREE.MeshBasicMaterial({
    color: 0x58ecff,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    toneMapped: false,
  });
  sideDoorLedMat = new THREE.MeshBasicMaterial({
    map: sideDoorLedTexture,
    color: PAL.tealLight,
    transparent: true,
    opacity: 1,
    alphaTest: 0.018,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
}

function createSideDoorLedTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 448;
  const ctx = canvas.getContext('2d');
  const sx = (x) => (x + 0.64) / 1.28 * canvas.width;
  const sy = (y) => canvas.height - y / 1.02 * canvas.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.98)';
  ctx.fillStyle = 'rgba(255,255,255,0.98)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(255,255,255,0.42)';
  ctx.shadowBlur = 10;

  function stroke(points, width) {
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(sx(points[0][0]), sy(points[0][1]));
    for (const point of points.slice(1)) ctx.lineTo(sx(point[0]), sy(point[1]));
    ctx.stroke();
  }

  const outer = [
    [-0.47, 0.07], [0.47, 0.07], [0.56, 0.18], [0.56, 0.82],
    [0.38, 0.96], [-0.38, 0.96], [-0.56, 0.82], [-0.56, 0.18], [-0.47, 0.07],
  ];
  const inner = [
    [-0.35, 0.16], [0.35, 0.16], [0.43, 0.25], [0.43, 0.73],
    [0.29, 0.84], [-0.29, 0.84], [-0.43, 0.73], [-0.43, 0.25], [-0.35, 0.16],
  ];
  stroke(outer, 16);
  stroke(inner, 8);
  stroke([[-0.31, 0.10], [0.31, 0.10]], 10);
  stroke([[-0.24, 0.90], [0.24, 0.90]], 10);

  for (const side of [-1, 1]) {
    stroke([[side * 0.12, 0.34], [side * 0.24, 0.43], [side * 0.24, 0.59], [side * 0.10, 0.67]], 8);
    stroke([[side * 0.60, 0.28], [side * 0.60, 0.76]], 10);
    for (let i = 0; i < 5; i++) {
      const x = sx(side * 0.62);
      const y = sy(0.32 + i * 0.075);
      ctx.fillRect(x - 7, y - 4, 14, 8);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.anisotropy = 1;
  if ('colorSpace' in texture) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSelectedSideBuildingDoorModel() {
  ensureSideDoorMaterials();
  const group = new THREE.Group();
  group.name = 'side-building-door-03';
  group.userData.sideDoorAnchor = true;
  return group;
}

function sideDoorBatchMaterial(part) {
  if (part.material === 'housing') return sideDoorHousingMat;
  if (part.material === 'panel') return sideDoorPanelMat;
  if (part.material === 'glass') return sideDoorGlassMat;
  if (part.material === 'led') return sideDoorLedMat;
  return sideDoorHousingMat;
}

function sideDoorBatchGeometry(part) {
  return part.geometry === 'led-plane' ? sideDoorLedPlaneGeometry : sideDoorUnitBoxGeometry;
}

function sideDoorPartLocalMatrix(part) {
  if (part.localMatrix) return part.localMatrix;
  const isBox = part.geometry === 'box';
  sideDoorLocalPosition.set(part.x, part.y + (isBox ? part.h * 0.5 : 0), part.z);
  sideDoorLocalScale.set(part.w, part.h, part.d);
  const matrix = new THREE.Matrix4();
  matrix.compose(sideDoorLocalPosition, sideDoorLocalQuaternion, sideDoorLocalScale);
  part.localMatrix = matrix;
  return matrix;
}

function ensureSideDoorBatchMeshes() {
  ensureSideDoorMaterials();
  const partGroups = new Map();
  for (const part of SIDE_DOOR_BATCH_PARTS) {
    if (!partGroups.has(part.key)) partGroups.set(part.key, []);
    partGroups.get(part.key).push(part);
  }
  for (const [key, parts] of partGroups.entries()) {
    const needed = Math.max(1, sideDoorBatchState.records.length * parts.length);
    const existing = sideDoorBatchState.batches.get(key);
    if (existing?.mesh && existing.capacity >= needed) continue;
    if (existing?.mesh) overlayGroup.remove(existing.mesh);
    const firstPart = parts[0];
    const mesh = new THREE.InstancedMesh(sideDoorBatchGeometry(firstPart), sideDoorBatchMaterial(firstPart), needed);
    mesh.name = `side-building-door-batch-${key}`;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = true;
    mesh.renderOrder = firstPart.renderOrder;
    mesh.count = 0;
    overlayGroup.add(mesh);
    sideDoorBatchState.batches.set(key, {
      key,
      mesh,
      parts,
      capacity: needed,
      count: 0,
    });
    if (key === 'ledAtlas' && !sideBuildingDoorLedMeshes.includes(mesh)) {
      sideBuildingDoorLedMeshes.push(mesh);
    }
  }
  sideDoorBatchState.built = true;
}

function updateSideBuildingDoorBatchMeshes() {
  ensureSideDoorBatchMeshes();
  for (const batch of sideDoorBatchState.batches.values()) batch.count = 0;
  let visibleInstances = 0;
  for (const record of sideDoorBatchState.records) {
    const door = record.sideDoor;
    if (!door?.visible) continue;
    door.updateWorldMatrix(true, false);
    for (const part of SIDE_DOOR_BATCH_PARTS) {
      const batch = sideDoorBatchState.batches.get(part.key);
      if (!batch?.mesh) continue;
      sideDoorWorldMatrix.multiplyMatrices(door.matrixWorld, sideDoorPartLocalMatrix(part));
      batch.mesh.setMatrixAt(batch.count, sideDoorWorldMatrix);
      batch.count += 1;
      visibleInstances += 1;
    }
  }
  let totalInstances = 0;
  for (const batch of sideDoorBatchState.batches.values()) {
    batch.mesh.count = batch.count;
    batch.mesh.visible = batch.count > 0;
    batch.mesh.instanceMatrix.needsUpdate = true;
    refreshCullingBounds(batch.mesh);
    totalInstances += batch.count;
  }
  sideDoorBatchState.instances = totalInstances;
  sideDoorBatchState.visibleInstances = visibleInstances;
}

function buildSideBuildingDoorBatches() {
  ensureSideDoorBatchMeshes();
  updateSideBuildingDoorBatchMeshes();
}

function createSideBuildingCivicNumberTexture(value) {
  const key = String(value);
  if (sideBuildingCivicNumberTextureCache.has(key)) return sideBuildingCivicNumberTextureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  const text = String(value);
  const fontSize = text.length > 1 ? 386 : 436;
  const x = canvas.width * 0.5 - 20;
  const y = canvas.height * 0.56;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${fontSize}px Impact, Haettenschweiler, "Arial Narrow", sans-serif`;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(5, 30, 43, 0.98)';
  ctx.lineWidth = 76;
  ctx.strokeText(text, x, y);
  ctx.strokeStyle = 'rgba(12, 89, 110, 0.94)';
  ctx.lineWidth = 58;
  ctx.strokeText(text, x, y);
  ctx.strokeStyle = 'rgba(28, 165, 184, 0.88)';
  ctx.lineWidth = 44;
  ctx.strokeText(text, x, y);
  ctx.shadowColor = 'rgba(98, 247, 255, 0.72)';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = 'rgba(143, 252, 255, 1)';
  ctx.lineWidth = 34;
  ctx.strokeText(text, x, y);
  ctx.shadowBlur = 8;
  ctx.strokeStyle = 'rgba(231, 253, 255, 0.94)';
  ctx.lineWidth = 12;
  ctx.strokeText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(143, 252, 255, 0.08)';
  ctx.fillText(text, x, y);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy?.() || 1);
  texture.needsUpdate = true;
  sideBuildingCivicNumberTextureCache.set(key, texture);
  return texture;
}

function createSideBuildingCivicNumberMaterial(record, color = 0xffffff, opacity = 1) {
  const material = new THREE.MeshBasicMaterial({
    map: createSideBuildingCivicNumberTexture(record.civicNumberValue),
    color,
    transparent: true,
    opacity,
    alphaTest: 0.018,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  sideBuildingCivicNumberMaterials.push(material);
  return material;
}

function addSideBuildingCivicNumberPlane(group, record, material, name, layer = null) {
  const mesh = new THREE.Mesh(sideBuildingCivicNumberPlaneGeometry, material);
  mesh.name = `side-building-civic-number-${name}-${record.civicNumberValue}`;
  mesh.renderOrder = SIDE_BUILDING_CIVIC_NUMBER_FIXED.renderOrder;
  if (layer) {
    mesh.position.set(layer.x, layer.y, layer.z);
    mesh.renderOrder -= 1;
  }
  mesh.frustumCulled = true;
  group.add(mesh);
  return mesh;
}

function buildSideBuildingCivicNumber(record) {
  const group = new THREE.Group();
  group.name = `side-building-civic-number-${record.civicNumberValue}`;
  group.userData.civicNumberValue = record.civicNumberValue;
  for (const layer of SIDE_BUILDING_CIVIC_NUMBER_FIXED.depthLayers) {
    addSideBuildingCivicNumberPlane(
      group,
      record,
      createSideBuildingCivicNumberMaterial(record, layer.color, layer.opacity),
      'depth',
      layer
    );
  }
  addSideBuildingCivicNumberPlane(
    group,
    record,
    createSideBuildingCivicNumberMaterial(record),
    'front'
  );
  record.civicNumberGroup = group;
  sideBuildingCivicNumberGroups.push(group);
  overlayGroup.add(group);
  return group;
}

function buildSideBuildingDoor(record) {
  const group = createSelectedSideBuildingDoorModel();
  record.sideDoor = group;
  sideDoorBatchState.records.push(record);
  sideBuildingDoorGroups.push(group);
  overlayGroup.add(group);
  return group;
}

function updateSideBuildingCivicNumberTransform(record, faceSign) {
  const group = record.civicNumberGroup;
  if (!group) return;
  const text = String(record.civicNumberValue);
  const doorScaleRatio = Math.max(0.35, sideDoorScale / SIDE_DOOR_FIXED.scale);
  const numberWidth = (text.length > 1
    ? SIDE_BUILDING_CIVIC_NUMBER_FIXED.doubleWidth
    : SIDE_BUILDING_CIVIC_NUMBER_FIXED.singleWidth) * doorScaleRatio;
  const numberHeight = SIDE_BUILDING_CIVIC_NUMBER_FIXED.height * doorScaleRatio;
  const doorTopY = sideDoorY + sideDoorHeight * sideDoorScale;
  group.visible = record.mesh.visible;
  group.position.set(
    record.mesh.position.x + faceSign * (record.collider.hw + sideDoorFaceOffset + SIDE_BUILDING_CIVIC_NUMBER_FIXED.faceOffset),
    doorTopY + numberHeight * SIDE_BUILDING_CIVIC_NUMBER_FIXED.verticalLift,
    record.mesh.position.z
  );
  group.rotation.set(0, faceSign > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
  group.scale.set(Math.max(0.01, numberWidth), Math.max(0.01, numberHeight), 1);
}

function updateSideBuildingDoorTransforms() {
  for (const record of sideBuildingRecords) {
    const faceSign = record.sign < 0 ? 1 : -1;
    if (record.sideDoor) {
      record.sideDoor.visible = sideDoorEnabled && record.mesh.visible;
      record.sideDoor.position.set(
        record.mesh.position.x + faceSign * (record.collider.hw + sideDoorFaceOffset),
        sideDoorY,
        record.mesh.position.z
      );
      record.sideDoor.rotation.set(0, faceSign > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      record.sideDoor.scale.set(
        Math.max(0.01, sideDoorWidth * sideDoorScale),
        Math.max(0.01, sideDoorHeight * sideDoorScale),
        Math.max(0.01, sideDoorDepth * sideDoorScale)
      );
    }
    updateSideBuildingCivicNumberTransform(record, faceSign);
  }
  updateSideBuildingDoorBatchMeshes();
}

function updateSideBuildingDoorMaterials(brightness, hueDeg) {
  ensureSideDoorMaterials();
  const ledColor = tunedColor(new THREE.Color(PAL.tealLight), hueDeg, 1, Math.max(0, brightness));
  sideDoorLedMat.color.copy(ledColor);
  sideDoorLedMat.needsUpdate = true;
  sideDoorGlassMat.color.copy(ledColor);
  sideDoorGlassMat.opacity = THREE.MathUtils.clamp(0.10 + brightness * 0.10, 0.05, 0.34);
  for (const material of [sideDoorHousingMat, sideDoorPanelMat]) {
    material.envMap = reflectionEnvMap;
    material.envMapIntensity = material === sideDoorPanelMat ? 1.45 : 1.24;
  }
}

function sideBuildingCivicNumberForBuildIndex(buildIndex) {
  const laneIndex = Math.floor(buildIndex / 2);
  const sideIndex = buildIndex % 2;
  return (laneZ.length - 1 - laneIndex) * 2 + sideIndex + 1;
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
  const reflect = isSidewalk ? basePadReflect : Number(controlEls.roadReflect?.value ?? 0);
  const roughness = isSidewalk ? basePadRoughness : Number(controlEls.roadRoughness?.value ?? 1);
  const metalness = isSidewalk ? basePadMetalness : Number(controlEls.roadMetalness?.value ?? 0);
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

function updateTronRunnerCrowdReflection(member) {
  const budgetActive = postRevealPerfIsolationState.crowdReflections && member.dynamicReflectionBudgetActive === true;
  // Most crowd members are outside the reflection budget (max 3 active). Once cleared, the
  // applyTronRunnerCrowdReflectionState writes are idempotent (group hidden, opacities 0); skip them.
  if (!budgetActive && member.dynamicReflectionVisible === false) return;
  const group = member.reflectionGroup;
  const bodyMaterials = member.reflectionBodyMaterials || [];
  const ledMaterials = member.reflectionLedMaterials || [];
  const bodyOpacity = budgetActive ? tronRunnerDynamicReflectionBodyOpacityForSurface(member.surface) : 0;
  const ledOpacity = budgetActive ? tronRunnerDynamicReflectionLedOpacityForSurface(member.surface) : 0;
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
const GREETER_RUN_SPEED_BOOST = 1.5;   // extra 50% while running to the board (legs stay synced)
const GREETER_HEAD_MAX_YAW = 1.3963; // +/-80deg => 160deg total head turn, no neck over-rotation
const GREETER_HEAD_YAW_SIGN = 1;
const greeterTargetScratch = { x: 0, z: 0 };
// After the welcome bubble dissolves the greeter walks over to the departures board
// (the "12 reparti" tabellone) and posts up just past its right-hand edge, facing the player.
const GREETER_BOARD_SIDE_GAP = 2.4;  // clearance beyond the board's right edge (world units)
const GREETER_BOARD_FRONT_GAP = 1.4; // step toward the player off the board plane (no clipping)
const GREETER_BOARD_REACH = 0.8;     // arrival radius at the board anchor
const greeterBoardAnchorScratch = { x: 0, z: 0 };

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
}

const tronRunnerCrowdNextPointScratch = { x: 0, z: 0 };
function advanceTronRunnerCrowdMember(member, dt, now = performance.now()) {
  normalizeTronRunnerCrowdState(member, now);
  const route = member.route;
  const isGreeter = member.index === TRON_RUNNER_GREETER_INDEX;
  // Once the welcome bubble has dissolved, leave the welcome stance and head for the
  // departures board. Retries each frame until the board anchor resolves.
  if (isGreeter && member.greetStage === 'welcome'
      && member.greetAt && (now - member.greetAt) > GREETER_BUBBLE_DURATION_MS) {
    const anchor = resolveGreeterBoardAnchor();
    if (anchor) {
      member.greetBoardAnchorX = anchor.x;
      member.greetBoardAnchorZ = anchor.z;
      member.greetStage = 'toBoard';
      setGreeterBubble(member, 'Seguimi', 5000, now);
      startGreeterWalkingToBoard(member);
    }
  }
  if (isGreeter && (member.greetStage === 'welcome' || member.greetStage === 'atBoard')) {
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
    // Turn the body to face the player (welcoming host), then the head tracks within +/-80deg.
    const bodyFaceYaw = Math.atan2(camera.position.x - member.group.position.x, camera.position.z - member.group.position.z);
    member.group.rotation.y = lerpAngle(member.group.rotation.y, bodyFaceYaw, Math.min(1, dt * 4));
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
        member.greetStage = 'atBoard'; // re-pose to idle + face player next frame
        setGreeterBubble(member, 'Questi sono i<br>nostri dipartimenti', 4000, now, 2);
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
  getSideDoorEnabled: () => sideDoorEnabled,
  getBasePadCurbEnabled: () => basePadCurbEnabled,
  getRevealActive: () => tronRunnerRevealActive,
  updateDoorBatchMeshes: updateSideBuildingDoorBatchMeshes,
  departmentBoardRevealFactor: cityDepartmentBoardRevealFactor,
});

const cityRevealOverlayScene = new THREE.Scene();
const cityRevealOverlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
cityRevealOverlayCamera.position.z = 1;
const cityRevealSkyScene = new THREE.Scene();
cityRevealSkyScene.background = skyDisplayColor;
const cityRevealSkyMat = domeMat.clone();
cityRevealSkyMat.name = 'city-reveal-sky-material';
const cityRevealSkyDome = new THREE.Mesh(domeGeo, cityRevealSkyMat);
cityRevealSkyDome.frustumCulled = false;
cityRevealSkyDome.renderOrder = domeMesh.renderOrder;
cityRevealSkyScene.add(cityRevealSkyDome);
function cityRevealSkyUsesBudgetQuality() {
  return Boolean(cityRevealWireframeEnabled && !cityRevealComplete);
}
function syncCityRevealSkyMaterial() {
  for (const [key, sourceUniform] of Object.entries(domeMat.uniforms || {})) {
    const targetUniform = cityRevealSkyMat.uniforms?.[key];
    if (!targetUniform) continue;
    const value = sourceUniform.value;
    if (value?.isColor && targetUniform.value?.isColor) targetUniform.value.copy(value);
    else targetUniform.value = value;
  }
  if (cityRevealSkyUsesBudgetQuality() && cityRevealSkyMat.uniforms?.uSkyQuality) {
    cityRevealSkyMat.uniforms.uSkyQuality.value = 0;
  }
}
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
let cityRevealMainLedRevealPass = null;
const cityRevealWireColor = 0x62f7ff;
const cityRevealWireCoreColor = 0xe8feff;
const CITY_REVEAL_SCAN_GLOW_ENABLED = true;
const CITY_REVEAL_SCAN_GLOW_OPACITY = 0.18;
const CITY_REVEAL_SCAN_GLOW_RENDER_ORDER = 9;
const CITY_REVEAL_SCAN_GLOW_EDGE_PADDING = GRID_BLOCK * 5;
const CITY_REVEAL_SCAN_GLOW_HEIGHT_PADDING = GRID_BLOCK * 2;
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
const cityRevealScanGlowGeometry = new THREE.BufferGeometry();
cityRevealScanGlowGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
  -0.5, 0, 0,
  0.5, 0, 0,
  -0.5, 1, 1,
  0.5, 1, 1,
], 3));
cityRevealScanGlowGeometry.setAttribute('uv', new THREE.Float32BufferAttribute([
  0, 0,
  1, 0,
  0, 1,
  1, 1,
], 2));
cityRevealScanGlowGeometry.setIndex([0, 1, 2, 2, 1, 3]);
const cityRevealScanGlowMat = new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color(cityRevealWireColor) },
    uOpacity: { value: 0 },
    uTime: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      float sideFade = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));
      float verticalFade = smoothstep(0.0, 0.10, vUv.y) * (1.0 - smoothstep(0.88, 1.0, vUv.y));
      float scan = 0.84 + 0.16 * sin(vUv.y * 34.0 - uTime * 5.5);
      float alpha = uOpacity * sideFade * verticalFade * scan;
      gl_FragColor = vec4(uColor * (1.35 + scan * 0.45), alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
  toneMapped: false,
});
const cityRevealScanGlowMesh = new THREE.Mesh(cityRevealScanGlowGeometry, cityRevealScanGlowMat);
cityRevealScanGlowMesh.name = 'city-reveal-scan-glow';
cityRevealScanGlowMesh.frustumCulled = false;
cityRevealScanGlowMesh.visible = false;
cityRevealScanGlowMesh.renderOrder = CITY_REVEAL_SCAN_GLOW_RENDER_ORDER;
cityRevealWireScene.add(cityRevealScanGlowMesh);
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

function cityRevealScanGlowDimensions() {
  let minX = -dynamicRoadSurfaceWidth * 0.5;
  let maxX = dynamicRoadSurfaceWidth * 0.5;
  let maxY = 230;
  const records = [...sideBuildingRecords, ...mainBuildingRecords];
  for (const record of records) {
    const collider = record?.collider;
    if (!collider) continue;
    const halfWidth = Math.abs(Number.isFinite(collider.hw) ? collider.hw : record.baseW * 0.5 || 0);
    minX = Math.min(minX, collider.x - halfWidth);
    maxX = Math.max(maxX, collider.x + halfWidth);
    maxY = Math.max(maxY, (Number.isFinite(collider.y) ? collider.y : 0) + (Number.isFinite(collider.h) ? collider.h : 0));
  }
  for (const bridge of bridgeRecords) {
    if (!bridge?.mesh?.visible) continue;
    const halfWidth = Math.abs((bridge.baseWidth || 0) * bridge.mesh.scale.x) * 0.5;
    minX = Math.min(minX, bridge.mesh.position.x - halfWidth);
    maxX = Math.max(maxX, bridge.mesh.position.x + halfWidth);
    maxY = Math.max(maxY, bridge.mesh.position.y + Math.abs((bridge.baseHeight || 0) * bridge.mesh.scale.y) * 0.5);
  }
  const width = Math.max(dynamicRoadSurfaceWidth + CITY_REVEAL_SCAN_GLOW_EDGE_PADDING * 2, (maxX - minX) + CITY_REVEAL_SCAN_GLOW_EDGE_PADDING * 2);
  const height = Math.max(GRID_BLOCK * 8, maxY + CITY_REVEAL_SCAN_GLOW_HEIGHT_PADDING);
  return {
    width,
    height,
    centerX: (minX + maxX) * 0.5,
    baseY: roadTileTopY() + 0.22,
  };
}

function updateCityRevealScanGlow(now = performance.now()) {
  const active = Boolean(
    CITY_REVEAL_SCAN_GLOW_ENABLED &&
    cityRevealWireframeEnabled &&
    cityRevealStartedAt > 0 &&
    !cityRevealComplete &&
    cityRevealWireAlpha > 0.002 &&
    cityRevealSweepProgress > 0.002 &&
    cityRevealSweepProgress < 0.998
  );
  const pulse = Math.sin(Math.PI * THREE.MathUtils.clamp(cityRevealSweepProgress, 0, 1));
  const opacity = active ? CITY_REVEAL_SCAN_GLOW_OPACITY * cityRevealWireAlpha * THREE.MathUtils.clamp(0.35 + pulse * 0.65, 0, 1) : 0;
  cityRevealScanGlowMesh.visible = opacity > 0.003;
  cityRevealScanGlowMat.uniforms.uOpacity.value = opacity;
  cityRevealScanGlowMat.uniforms.uTime.value = (Number.isFinite(now) ? now : performance.now()) * 0.001;
  if (!cityRevealScanGlowMesh.visible) return;
  const dimensions = cityRevealScanGlowDimensions();
  cityRevealScanGlowMesh.position.set(dimensions.centerX, dimensions.baseY, cityRevealFrontZ + dimensions.baseY);
  cityRevealScanGlowMesh.scale.set(dimensions.width, dimensions.height, dimensions.height);
}

function setCityRevealSweepFront(frontZ) {
  cityRevealFrontZ = Number.isFinite(frontZ) ? frontZ : cityRevealSweepEndZ;
  cityRevealRealClipPlane.normal.copy(CITY_REVEAL_SWEEP_NORMAL);
  cityRevealRealClipPlane.constant = -cityRevealFrontZ * CITY_REVEAL_SWEEP_NORMAL.z;
  updateCityRevealScanGlow();
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

function mainFacadeVerticalRevealLedBounds() {
  const specs = mainFacadeVerticalRevealLedSpecs.filter((spec) => spec.batchMesh && spec.edgeRole === 'main-building');
  if (!specs.length) return null;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const spec of specs) {
    const transform = facadeStripDynamicTransform(spec);
    const position = facadeStripWorldPosition(
      transform.basePosition,
      spec.w,
      spec.d,
      spec.face,
      spec.sign,
      transform.depth,
      spec.edgeRole,
      sideBuildingWidthScale,
      sideBuildingDepthScale,
      mainBuildingWidthScale,
      mainBuildingDepthScale,
      facadeSegmentNormalOffset(spec)
    );
    const halfY = Math.max(0.01, Math.abs(transform.scale.y) * 0.5);
    spec.parent.updateWorldMatrix(true, false);
    facadeRevealWorldPoint.set(position.x, position.y - halfY, position.z).applyMatrix4(spec.parent.matrixWorld);
    minY = Math.min(minY, facadeRevealWorldPoint.y);
    maxY = Math.max(maxY, facadeRevealWorldPoint.y);
    facadeRevealWorldPoint.set(position.x, position.y + halfY, position.z).applyMatrix4(spec.parent.matrixWorld);
    minY = Math.min(minY, facadeRevealWorldPoint.y);
    maxY = Math.max(maxY, facadeRevealWorldPoint.y);
  }
  if (!Number.isFinite(minY) || !Number.isFinite(maxY) || maxY <= minY) return null;
  return { minY, maxY, count: specs.length };
}

function mainFacadeVerticalRevealProgress() {
  if (cityRevealComplete) return 1;
  const revealElapsed = cityRevealMainLedRevealElapsedMs();
  const revealDuration = Math.max(1, cityRevealFadeDurationMs() - CITY_REVEAL_MAIN_LED_VISIBLE_DELAY_MS);
  const t = THREE.MathUtils.clamp(revealElapsed / revealDuration, 0, 1);
  return t * t * (3 - 2 * t);
}

function updateMainFacadeVerticalReveal() {
  if (!mainFacadeVerticalRevealLedMaterial && !mainBuildingEdgeVerticalRevealLedMaterial) return;
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

function createCityRevealProfileBucket() {
  return {
    frames: 0,
    rafDtMsSum: 0,
    updateMsSum: 0,
    renderMsSum: 0,
    frameMsSum: 0,
    updateMsMax: 0,
    renderMsMax: 0,
    frameMsMax: 0,
    drawCallsSum: 0,
    drawCallsMax: 0,
    trianglesSum: 0,
    trianglesMax: 0,
    linesSum: 0,
    pointsSum: 0,
  };
}

function countVisibleRenderables(root) {
  const result = { total: 0, visible: 0, hidden: 0, mesh: 0, line: 0, points: 0, instanced: 0 };
  if (!root) return result;
  root.traverse((object) => {
    if (!object.isMesh && !object.isLine && !object.isPoints) return;
    result.total++;
    if (!object.visible) {
      result.hidden++;
      return;
    }
    result.visible++;
    if (object.isInstancedMesh) result.instanced++;
    else if (object.isMesh) result.mesh++;
    else if (object.isLine) result.line++;
    else if (object.isPoints) result.points++;
  });
  return result;
}

function cityRevealWireRenderablesSnapshot() {
  return {
    total: cityRevealWireCullStats.total,
    visible: cityRevealWireCullStats.visible,
    hidden: cityRevealWireCullStats.hidden,
    mesh: cityRevealWireCullStats.solidVisible + cityRevealWireCullStats.roadFadeVisible,
    line: cityRevealWireCullStats.wireVisible,
    points: 0,
    instanced: 0,
  };
}

function cityRevealComposerPassProfile() {
  const passes = {
    sky: Boolean(cityRevealSkyPass?.enabled),
    overlay: Boolean(cityRevealOverlayPass?.enabled),
    wireframe: Boolean(cityRevealWirePass?.enabled),
    roadGrid: Boolean(cityRevealRoadGridPass?.enabled),
    wireAa: Boolean(cityRevealWireFxaaPass?.enabled),
    realCity: Boolean(cityRevealScenePass?.enabled),
    mainLedReveal: Boolean(cityRevealMainLedRevealPass?.enabled),
    bloom: Boolean(bloomPass?.enabled),
    fxaa: Boolean(fxaaPass?.enabled),
    fsrUpscale: Boolean(fsrUpscalePass?.enabled),
    output: Boolean(composer && !fsrUpscalePass),
  };
  const mainLedSceneRenders = passes.mainLedReveal ? 2 : 0;
  const sceneRenderPasses = [
    passes.sky,
    passes.overlay,
    passes.wireframe,
    passes.roadGrid,
    passes.realCity,
  ].filter(Boolean).length + mainLedSceneRenders;
  const postPasses = [passes.bloom, passes.fxaa, passes.fsrUpscale, passes.output].filter(Boolean).length;
  return {
    composer: shouldUseComposer(),
    passes,
    sceneRenderPasses,
    postPasses,
    estimatedPasses: sceneRenderPasses + postPasses,
  };
}

function cityRevealProfileSceneSnapshot() {
  return {
    pipeline: cityRevealComposerPassProfile(),
    renderables: {
      scene: countVisibleRenderables(scene),
      wire: cityRevealWireRenderablesSnapshot(),
      roadGrid: countVisibleRenderables(cityRevealRoadGridGroup),
      mainLedDepth: countVisibleRenderables(cityRevealMainLedDepthGroup),
    },
    reveal: {
      started: cityRevealStartedAt > 0,
      armed: cityRevealArmedAt > 0,
      armedElapsedMs: cityRevealArmedAt > 0 ? Number((performance.now() - cityRevealArmedAt).toFixed(1)) : 0,
      complete: cityRevealComplete,
      completedAt: Number(cityRevealCompletedAt.toFixed(1)),
      postRevealElapsedMs: Number(cityRevealPostRevealElapsedMs().toFixed(1)),
      delayMs: cityRevealDelayMs,
      extraDelayMs: CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS,
      effectiveDelayMs: cityRevealEffectiveDelayMs(),
      fadeMs: cityRevealFadeDurationMs(),
      progress: Number(cityRevealSweepProgress.toFixed(4)),
      wireAlpha: Number(cityRevealWireAlpha.toFixed(4)),
      realRevealActive: isCityRevealRealRevealActive(),
      mainLedRevealActive: isCityRevealMainLedRevealOverlayActive(),
      visibleWireObjects: cityRevealEstimatedVisibleObjects(),
      renderedWireObjects: cityRevealWireCullStats.visible,
      hiddenWireObjects: cityRevealWireCullStats.hidden,
      wireCull: { ...cityRevealWireCullStats },
      totalWireObjects: cityRevealWireObjects.length,
      solidObjects: cityRevealSolidObjects.length,
      mainLedOverlayObjects: mainBuildingVerticalRevealOverlayObjects.size,
      mainLedDepthProxyVisible: cityRevealMainLedDepthProxyVisibleCount,
      mainLedDepthProxyMode: cityRevealMainLedDepthProxyLastMode,
    },
    crowd: {
      count: tronRunnerCrowd.length,
      visible: tronRunnerCrowdRuntimeStats.cullingVisibleCount,
      hidden: tronRunnerCrowdRuntimeStats.cullingHiddenCount,
      reflections: tronRunnerCrowdRuntimeStats.activeReflectionCount,
      lastThinkMs: Number(tronRunnerCrowdRuntimeStats.lastThinkMs.toFixed(3)),
    },
    memory: { ...renderer.info.memory },
  };
}

function resetCityRevealProfile(now = performance.now()) {
  cityRevealProfileState.running = true;
  cityRevealProfileState.completed = false;
  cityRevealProfileState.startedAt = now;
  cityRevealProfileState.lastSampleAt = now;
  cityRevealProfileState.frameCount = 0;
  cityRevealProfileState.samples = [];
  cityRevealProfileState.bucket = createCityRevealProfileBucket();
  cityRevealProfileState.lastFrame = null;
}

function cityRevealProfileShouldRun() {
  return cityRevealStartedAt > 0 && !cityRevealComplete;
}

function pushCityRevealProfileSample(now, force = false) {
  const bucket = cityRevealProfileState.bucket;
  if (!bucket || bucket.frames <= 0) return;
  if (!force && now - cityRevealProfileState.lastSampleAt < CITY_REVEAL_PROFILE_SAMPLE_MS) return;
  const avg = (value) => Number((value / Math.max(1, bucket.frames)).toFixed(3));
  const sample = {
    elapsedMs: Number((now - cityRevealProfileState.startedAt).toFixed(1)),
    frames: bucket.frames,
    fps: Number((1000 / Math.max(0.001, avg(bucket.rafDtMsSum))).toFixed(1)),
    updateMsAvg: avg(bucket.updateMsSum),
    updateMsMax: Number(bucket.updateMsMax.toFixed(3)),
    renderMsAvg: avg(bucket.renderMsSum),
    renderMsMax: Number(bucket.renderMsMax.toFixed(3)),
    frameMsAvg: avg(bucket.frameMsSum),
    frameMsMax: Number(bucket.frameMsMax.toFixed(3)),
    drawCallsAvg: avg(bucket.drawCallsSum),
    drawCallsMax: bucket.drawCallsMax,
    trianglesAvg: Math.round(bucket.trianglesSum / Math.max(1, bucket.frames)),
    trianglesMax: bucket.trianglesMax,
    linesAvg: Math.round(bucket.linesSum / Math.max(1, bucket.frames)),
    pointsAvg: Math.round(bucket.pointsSum / Math.max(1, bucket.frames)),
    ...cityRevealProfileSceneSnapshot(),
  };
  cityRevealProfileState.samples.push(sample);
  if (cityRevealProfileState.samples.length > CITY_REVEAL_PROFILE_MAX_SAMPLES) {
    cityRevealProfileState.samples.shift();
  }
  cityRevealProfileState.lastSampleAt = now;
  cityRevealProfileState.bucket = createCityRevealProfileBucket();
}

function recordCityRevealProfileFrame({ now, dt, updateMs, renderMs, frameMs, renderInfo }) {
  if (!cityRevealProfileShouldRun()) {
    if (cityRevealProfileState.running) {
      pushCityRevealProfileSample(performance.now(), true);
      cityRevealProfileState.running = false;
      cityRevealProfileState.completed = true;
    }
    return;
  }
  const profileNow = performance.now();
  if (!cityRevealProfileState.running) resetCityRevealProfile(profileNow);
  const bucket = cityRevealProfileState.bucket || createCityRevealProfileBucket();
  cityRevealProfileState.bucket = bucket;
  const rafDtMs = Math.max(0.001, dt * 1000);
  const calls = renderInfo?.calls ?? 0;
  const triangles = renderInfo?.triangles ?? 0;
  bucket.frames++;
  bucket.rafDtMsSum += rafDtMs;
  bucket.updateMsSum += updateMs;
  bucket.renderMsSum += renderMs;
  bucket.frameMsSum += frameMs;
  bucket.updateMsMax = Math.max(bucket.updateMsMax, updateMs);
  bucket.renderMsMax = Math.max(bucket.renderMsMax, renderMs);
  bucket.frameMsMax = Math.max(bucket.frameMsMax, frameMs);
  bucket.drawCallsSum += calls;
  bucket.drawCallsMax = Math.max(bucket.drawCallsMax, calls);
  bucket.trianglesSum += triangles;
  bucket.trianglesMax = Math.max(bucket.trianglesMax, triangles);
  bucket.linesSum += renderInfo?.lines ?? 0;
  bucket.pointsSum += renderInfo?.points ?? 0;
  cityRevealProfileState.frameCount++;
  cityRevealProfileState.lastFrame = {
    now: Number(now.toFixed(1)),
    updateMs: Number(updateMs.toFixed(3)),
    renderMs: Number(renderMs.toFixed(3)),
    frameMs: Number(frameMs.toFixed(3)),
    renderInfo: { ...renderInfo },
  };
  pushCityRevealProfileSample(profileNow, cityRevealComplete);
}

function cityRevealProfileInspect() {
  const samples = cityRevealProfileState.samples.map((sample) => ({ ...sample }));
  const slowestRender = samples.reduce((best, sample) => (
    !best || sample.renderMsMax > best.renderMsMax ? sample : best
  ), null);
  const slowestFrame = samples.reduce((best, sample) => (
    !best || sample.frameMsMax > best.frameMsMax ? sample : best
  ), null);
  return {
    running: cityRevealProfileState.running,
    completed: cityRevealProfileState.completed,
    sampleMs: CITY_REVEAL_PROFILE_SAMPLE_MS,
    frameCount: cityRevealProfileState.frameCount,
    sampleCount: samples.length,
    lastFrame: cityRevealProfileState.lastFrame ? { ...cityRevealProfileState.lastFrame } : null,
    latest: samples.at(-1) || cityRevealProfileSceneSnapshot(),
    slowestRender,
    slowestFrame,
    samples,
  };
}

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

function syncCityRevealSkyDome() {
  cityRevealSkyScene.background = scene.background || skyDisplayColor;
  cityRevealSkyDome.visible = domeMesh.visible;
  cityRevealSkyDome.position.copy(camera.position);
  syncCityRevealSkyMaterial();
}

function renderCityRevealSkyBase() {
  const previousAutoClear = renderer.autoClear;
  const previousClippingPlanes = renderer.clippingPlanes;
  syncCityRevealSkyDome();
  renderer.autoClear = true;
  renderer.clippingPlanes = [];
  renderer.render(cityRevealSkyScene, camera);
  renderer.clippingPlanes = previousClippingPlanes;
  renderer.autoClear = previousAutoClear;
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

function renderCityRevealMainLedRevealOverlay(rendererInstance, target = null) {
  if (!isCityRevealMainLedRevealOverlayActive()) {
    resetCityRevealMainLedScissorState();
    return;
  }
  syncMainBuildingVerticalRevealOverlayLayers();
  const previousAutoClear = rendererInstance.autoClear;
  const previousClippingPlanes = rendererInstance.clippingPlanes;
  const previousSceneBackground = scene.background;
  const previousDomeVisible = domeMesh.visible;
  const previousCameraLayerMask = camera.layers.mask;
  const previousOverrideMaterial = scene.overrideMaterial;
  const previousScissorTest = rendererInstance.getScissorTest();
  rendererInstance.getScissor(cityRevealMainLedPreviousScissor);
  const scissorRect = cityRevealMainLedOverlayScissorRect(rendererInstance, target);
  rendererInstance.autoClear = false;
  rendererInstance.setRenderTarget(target);
  rendererInstance.clippingPlanes = [];
  scene.background = null;
  domeMesh.visible = false;
  if (scissorRect) {
    rendererInstance.setScissorTest(true);
    rendererInstance.setScissor(scissorRect.x, scissorRect.y, scissorRect.width, scissorRect.height);
  }
  rendererInstance.clearDepth();
  camera.layers.set(0);
  const depthProxyCount = syncCityRevealMainLedDepthProxies();
  if (depthProxyCount > 0) {
    cityRevealMainLedDepthProxyLastMode = 'proxy-depth-mask';
    rendererInstance.render(cityRevealMainLedDepthScene, camera);
  } else {
    cityRevealMainLedDepthProxyLastMode = 'scene-depth-mask-fallback';
    scene.overrideMaterial = cityRevealMainLedDepthMat;
    rendererInstance.render(scene, camera);
    scene.overrideMaterial = previousOverrideMaterial;
  }
  camera.layers.set(CITY_REVEAL_MAIN_LED_LAYER);
  rendererInstance.render(scene, camera);
  camera.layers.mask = previousCameraLayerMask;
  scene.overrideMaterial = previousOverrideMaterial;
  scene.background = previousSceneBackground;
  domeMesh.visible = previousDomeVisible;
  rendererInstance.clippingPlanes = previousClippingPlanes;
  rendererInstance.autoClear = previousAutoClear;
  rendererInstance.setScissor(
    cityRevealMainLedPreviousScissor.x,
    cityRevealMainLedPreviousScissor.y,
    cityRevealMainLedPreviousScissor.z,
    cityRevealMainLedPreviousScissor.w
  );
  rendererInstance.setScissorTest(previousScissorTest);
}

function createCityRevealMainLedRevealPass() {
  return {
    enabled: false,
    needsSwap: false,
    clear: false,
    renderToScreen: false,
    setSize() {},
    render(rendererInstance, writeBuffer, readBuffer) {
      if (!this.enabled) return;
      renderCityRevealMainLedRevealOverlay(rendererInstance, this.renderToScreen ? null : readBuffer);
    },
  };
}

function syncCityRevealComposerPasses() {
  if (!cityRevealScenePass) return;
  const wireActive = isCityRevealCompositeActive();
  const realRevealActive = isCityRevealRealRevealActive();
  const mainLedRevealActive = isCityRevealMainLedRevealOverlayActive();
  syncMainBuildingVerticalRevealOverlayLayers();
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
  if (cityRevealMainLedRevealPass) cityRevealMainLedRevealPass.enabled = mainLedRevealActive;
  if (!mainLedRevealActive) resetCityRevealMainLedScissorState();
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
  syncMainBuildingVerticalRevealOverlayLayers();
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
    renderCityRevealMainLedRevealOverlay(renderer);
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
  cityRevealMainLedRevealPass = null;
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
  cityRevealMainLedRevealPass = createCityRevealMainLedRevealPass();
  syncCityRevealComposerPasses();
  composer.addPass(cityRevealSkyPass);
  composer.addPass(cityRevealOverlayPass);
  composer.addPass(cityRevealRoadGridPass);
  composer.addPass(cityRevealWirePass);
  composer.addPass(cityRevealWireFxaaPass);
  composer.addPass(cityRevealScenePass);
  composer.addPass(cityRevealMainLedRevealPass);
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
  return Boolean(!droneIntroFlight.active && droneIntroFlight.progress >= 0.999);
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
    cameraMoving = moved || rotated || droneIntroFlight.active || revealSweeping;
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
    setHexTileDisplayColor(hexTileInstanceColor, hitLight, playerLight, basePadLight);
    syncHexTileInstance(tile, hexTileInstanceColor);
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

function edgeStripBandOffset(spec, buildingLowOffset, buildingHighOffset, bridgeLowOffset, bridgeHighOffset, mainLowOffset, mainHighOffset) {
  if (spec.edgeRole === 'main-building' && spec.edgeBand === 'low') return mainLowOffset;
  if (spec.edgeRole === 'main-building' && spec.edgeBand === 'high') return mainHighOffset;
  if (spec.edgeRole === 'side-building' && spec.edgeBand === 'low') return buildingLowOffset;
  if (spec.edgeRole === 'side-building' && spec.edgeBand === 'high') return buildingHighOffset;
  if (spec.edgeRole === 'bridge' && spec.edgeBand === 'low') return bridgeLowOffset + readBridgeNumber(spec.bridgeRecord, 'lowLedOffset');
  if (spec.edgeRole === 'bridge' && spec.edgeBand === 'high') return bridgeHighOffset + readBridgeNumber(spec.bridgeRecord, 'highLedOffset');
  return 0;
}

function edgeStripBaseDistance(spec, sideVerticalDistance, sideHorizontalDistance, mainVerticalDistance, mainHorizontalDistance) {
  if (spec.edgeRole === 'main-building') {
    return spec.edgeBand === 'body' ? mainVerticalDistance : mainHorizontalDistance;
  }
  if (spec.edgeRole === 'side-building') {
    return spec.edgeBand === 'body' ? sideVerticalDistance : sideHorizontalDistance;
  }
  return sideVerticalDistance;
}

function edgeVerticalLengthScale(spec, buildingLength, mainLength) {
  if (spec.edgeBand !== 'body') return 1;
  if (spec.edgeRole === 'main-building') return mainLength;
  if (spec.edgeRole === 'side-building') return buildingLength;
  return 1;
}

function edgeStripYOffset(spec, buildingVerticalY, buildingLowY, buildingHighY, mainVerticalY, mainLowY, mainHighY) {
  if (spec.edgeRole === 'main-building' && spec.edgeBand === 'body') return mainVerticalY;
  if (spec.edgeRole === 'main-building' && spec.edgeBand === 'low') return mainLowY;
  if (spec.edgeRole === 'main-building' && spec.edgeBand === 'high') return mainHighY;
  if (spec.edgeRole === 'side-building' && spec.edgeBand === 'body') return buildingVerticalY;
  if (spec.edgeRole === 'side-building' && spec.edgeBand === 'low') return buildingLowY;
  if (spec.edgeRole === 'side-building' && spec.edgeBand === 'high') return buildingHighY;
  return 0;
}

function applyVerticalLedLength(p1, p2, lengthScale) {
  const scale = THREE.MathUtils.clamp(lengthScale, 0.05, 1.3);
  if (Math.abs(p1[1] - p2[1]) <= 0.001 || Math.abs(scale - 1) <= 0.0001) return [p1, p2];
  const centerY = (p1[1] + p2[1]) * 0.5;
  const halfY = Math.abs(p2[1] - p1[1]) * scale * 0.5;
  const nextP1 = [...p1];
  const nextP2 = [...p2];
  if (p1[1] <= p2[1]) {
    nextP1[1] = centerY - halfY;
    nextP2[1] = centerY + halfY;
  } else {
    nextP1[1] = centerY + halfY;
    nextP2[1] = centerY - halfY;
  }
  return [nextP1, nextP2];
}

function applyLedYOffset(p1, p2, yOffset) {
  if (Math.abs(yOffset) <= 0.001) return [p1, p2];
  const nextP1 = [...p1];
  const nextP2 = [...p2];
  nextP1[1] += yOffset;
  nextP2[1] += yOffset;
  return [nextP1, nextP2];
}

function updateFacadeLedRibbons(brightness, hueDeg, mainBrightness, mainHueDeg) {
  const sideColor = tunedColor(new THREE.Color(PAL.tealLight), hueDeg, 1, Math.max(0, brightness));
  const mainFacadeAmount = Math.max(0, mainBuildingFacadeLedBrightness);
  const mainColor = tunedColor(new THREE.Color(PAL.tealLight), mainHueDeg, 1, mainFacadeAmount);
  for (const spec of facadeLedSpecs) {
    const isMain = spec.edgeRole === 'main-building';
    const amount = isMain ? mainFacadeAmount : brightness;
    spec.material.color.copy(isMain ? mainColor : sideColor);
    spec.mesh.visible = amount > 0.001;
  }
}

function updateHorizontalBuildingLedRings(brightness, hueDeg, mainBrightness, mainHueDeg, horizontalDistance, mainHorizontalDistance, horizontalThickness, mainHorizontalThickness, horizontalRadius, mainHorizontalRadius, buildingLowOffset, buildingHighOffset, mainLowOffset, mainHighOffset, buildingLowY, buildingHighY, mainLowY, mainHighY, sideScale, mainScale, nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale, nextSideSpacingScale, nextStreetEdgeWidth) {
  const ledColor = tunedColor(new THREE.Color(PAL.tealLight), hueDeg, 1, brightness);
  const mainLedColor = tunedColor(new THREE.Color(PAL.tealLight), mainHueDeg, 1, mainBrightness);
  const changedSideRingBatches = new Set();
  for (const spec of horizontalBuildingLedRings) {
    const isMainBuilding = spec.edgeRole === 'main-building';
    const widthScale = isMainBuilding ? nextMainWidthScale : nextSideWidthScale;
    const depthScale = isMainBuilding ? nextMainDepthScale : nextSideDepthScale;
    const heightScale = isMainBuilding ? mainScale : sideScale;
    const stripWidth = Math.max(0.04, isMainBuilding ? mainHorizontalThickness : horizontalThickness);
    const radiusScale = Math.max(0.1, isMainBuilding ? mainHorizontalRadius : horizontalRadius);
    const baseDistance = isMainBuilding ? mainHorizontalDistance : horizontalDistance;
    const bandDistance = isMainBuilding
      ? MAIN_BUILDING_LED_SURFACE_EPS + baseDistance + edgeStripBandOffset(spec, buildingLowOffset, buildingHighOffset, 0, 0, mainLowOffset, mainHighOffset)
      : spec.distance + baseDistance + edgeStripBandOffset(spec, buildingLowOffset, buildingHighOffset, 0, 0, mainLowOffset, mainHighOffset);
    const currentCenter = edgeCurrentCenter(spec, nextSideSpacingScale, nextStreetEdgeWidth, nextSideWidthScale, nextMainWidthScale);
    const width = spec.w * widthScale;
    const depth = spec.d * depthScale;
    const chamfer = spec.chamfer * Math.min(widthScale, depthScale);
    const yOffset = edgeStripYOffset(spec, 0, buildingLowY, buildingHighY, 0, mainLowY, mainHighY);
    const buildingYOffset = isMainBuilding ? mainBuildingY : 0;
    if (spec.segmentMode) {
      const centerY = buildingYOffset + spec.baseY * heightScale + yOffset;
      updateHorizontalLedLoopSegments(spec, spec.w, spec.d, spec.chamfer, bandDistance, stripWidth, radiusScale, currentCenter[0], centerY, currentCenter[1], widthScale, depthScale);
      spec.material.color.copy(isMainBuilding ? mainLedColor : ledColor);
      const visible = (isMainBuilding ? mainBrightness : brightness) > 0.001 && stripWidth > 0.01;
      spec.segmentGroup.visible = visible;
      if (spec.segmentMesh) spec.segmentMesh.visible = visible;
      continue;
    }
    if (spec.batchRecord?.mesh) {
      const batch = spec.batchRecord;
      updateSideHorizontalLedRingBatchGeometry(batch, width, depth, chamfer, bandDistance, stripWidth, radiusScale);
      const ledHeight = batch.mesh.geometry.userData.ledHeight || Math.max(0.03, stripWidth * 0.34);
      sideHorizontalLedRingPosition.set(
        currentCenter[0],
        buildingYOffset + spec.baseY * heightScale + yOffset - ledHeight * 0.5,
        currentCenter[1]
      );
      sideHorizontalLedRingMatrix.compose(sideHorizontalLedRingPosition, sideHorizontalLedRingQuaternion, sideHorizontalLedRingScale);
      batch.mesh.setMatrixAt(spec.batchInstanceId, sideHorizontalLedRingMatrix);
      batch.material.color.copy(ledColor);
      batch.mesh.count = batch.count;
      const batchBaseVisible = brightness > 0.001 && stripWidth > 0.01 && batch.count > 0;
      batch.mesh.userData.staticCullBaseVisible = batchBaseVisible;
      batch.mesh.visible = batchBaseVisible;
      changedSideRingBatches.add(batch);
      continue;
    }
    const nextGeometry = makeHorizontalLedRingGeometry(width, depth, chamfer, bandDistance, stripWidth, radiusScale);
    const ledHeight = nextGeometry.userData.ledHeight || Math.max(0.03, stripWidth * 0.34);
    spec.mesh.geometry.dispose();
    spec.mesh.geometry = nextGeometry;
    spec.mesh.position.set(currentCenter[0], buildingYOffset + spec.baseY * heightScale + yOffset - ledHeight * 0.5, currentCenter[1]);
    spec.material.color.copy(isMainBuilding ? mainLedColor : ledColor);
    spec.mesh.visible = (isMainBuilding ? mainBrightness : brightness) > 0.001 && stripWidth > 0.01;
  }
  for (const batch of changedSideRingBatches) {
    batch.mesh.instanceMatrix.needsUpdate = true;
    refreshCullingBounds(batch.mesh);
  }
}

function updateEdgeStrips(brightness, thickness, verticalDistance, hueDeg, mainBrightness, mainThickness, mainVerticalDistance, mainHueDeg, horizontalDistance, mainHorizontalDistance, horizontalThickness, mainHorizontalThickness, horizontalRadius, mainHorizontalRadius, buildingLowOffset, buildingHighOffset, bridgeLowOffset, bridgeHighOffset, mainLowOffset, mainHighOffset, buildingVerticalLength, mainVerticalLength, buildingVerticalY, buildingLowY, buildingHighY, mainVerticalY, mainLowY, mainHighY, sideScale, mainScale, nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale, nextSideSpacingScale, nextStreetEdgeWidth) {
  ledDistance = verticalDistance;
  buildingHorizontalLedDistance = horizontalDistance;
  mainBuildingVerticalLedDistance = mainVerticalDistance;
  mainBuildingHorizontalLedDistance = mainHorizontalDistance;
  edgeStripThickness = thickness;
  buildingHorizontalLedThickness = horizontalThickness;
  mainBuildingHorizontalLedThickness = mainHorizontalThickness;
  buildingHorizontalLedRadius = horizontalRadius;
  mainBuildingHorizontalLedRadius = mainHorizontalRadius;
  buildingVerticalLedLength = buildingVerticalLength;
  mainBuildingVerticalLedLength = mainVerticalLength;
  buildingVerticalLedY = buildingVerticalY;
  buildingLowLedY = buildingLowY;
  buildingHighLedY = buildingHighY;
  mainBuildingVerticalLedY = mainVerticalY;
  mainBuildingLowLedY = mainLowY;
  mainBuildingHighLedY = mainHighY;
  const ledColor = tunedColor(new THREE.Color(PAL.tealLight), hueDeg, 1, brightness);
  const mainLedColor = tunedColor(new THREE.Color(PAL.tealLight), mainHueDeg, 1, mainBrightness);
  let sideBatchChanged = false;
  if (sideBuildingEdgeBatch.material) {
    sideBuildingEdgeBatch.material.color.copy(ledColor);
  }
  for (const spec of edgeStripSpecs) {
    const isMainBuilding = spec.edgeRole === 'main-building';
    const stripDistance = edgeStripBaseDistance(spec, ledDistance, buildingHorizontalLedDistance, mainBuildingVerticalLedDistance, mainBuildingHorizontalLedDistance);
    const stripThickness = isMainBuilding ? mainThickness : edgeStripThickness;
    const bandDistance = stripDistance + edgeStripBandOffset(spec, buildingLowOffset, buildingHighOffset, bridgeLowOffset, bridgeHighOffset, mainLowOffset, mainHighOffset);
    const currentCenter = edgeCurrentCenter(spec, nextSideSpacingScale, nextStreetEdgeWidth, nextSideWidthScale, nextMainWidthScale);
    const scaledP1 = scaledEdgePoint(spec, spec.p1, sideScale, mainScale, nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale, nextSideSpacingScale, nextStreetEdgeWidth);
    const scaledP2 = scaledEdgePoint(spec, spec.p2, sideScale, mainScale, nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale, nextSideSpacingScale, nextStreetEdgeWidth);
    if (isMainBuilding && spec.edgeBand === 'body') {
      const attachMainPoint = (point) => {
        const next = [...point];
        const halfW = MAIN_BUILDING_BASE * nextMainWidthScale * 0.5 + MAIN_BUILDING_LED_SURFACE_EPS + mainVerticalDistance;
        const halfD = MAIN_BUILDING_BASE * nextMainDepthScale * 0.5 + MAIN_BUILDING_LED_SURFACE_EPS + mainVerticalDistance;
        if (Math.abs(next[0] - currentCenter[0]) > 0.001) next[0] = currentCenter[0] + Math.sign(next[0] - currentCenter[0]) * halfW;
        if (Math.abs(next[2] - currentCenter[1]) > 0.001) next[2] = currentCenter[1] + Math.sign(next[2] - currentCenter[1]) * halfD;
        return next;
      };
      const [joinedP1, joinedP2] = overlappedHorizontalLoopSegment(attachMainPoint(scaledP1), attachMainPoint(scaledP2), stripThickness);
      const [lengthP1, lengthP2] = applyVerticalLedLength(joinedP1, joinedP2, edgeVerticalLengthScale(spec, buildingVerticalLength, mainVerticalLength));
      const [p1, p2] = applyLedYOffset(lengthP1, lengthP2, edgeStripYOffset(spec, buildingVerticalY, buildingLowY, buildingHighY, mainVerticalY, mainLowY, mainHighY));
      setStripTransform(spec.mesh, p1, p2, stripThickness);
      spec.mesh.material.color.copy(mainLedColor);
      spec.mesh.visible = true;
      continue;
    }
    const [rawP1, rawP2] = spec.roundedLoopOffsetMode
      ? shiftedHorizontalLoopSegment(scaledP1, scaledP2, currentCenter, bandDistance)
      : [shiftedEdgePoint(scaledP1, currentCenter, bandDistance), shiftedEdgePoint(scaledP2, currentCenter, bandDistance)];
    const [joinedP1, joinedP2] = spec.roundedLoopOffsetMode
      ? overlappedHorizontalLoopSegment(rawP1, rawP2, stripThickness)
      : [rawP1, rawP2];
    const [lengthP1, lengthP2] = applyVerticalLedLength(joinedP1, joinedP2, edgeVerticalLengthScale(spec, buildingVerticalLength, mainVerticalLength));
    const [p1, p2] = applyLedYOffset(lengthP1, lengthP2, edgeStripYOffset(spec, buildingVerticalY, buildingLowY, buildingHighY, mainVerticalY, mainLowY, mainHighY));
    if (spec.edgeRole === 'side-building' && sideBuildingEdgeBatch.mesh) {
      setStripInstanceTransform(sideBuildingEdgeBatch.mesh, spec.instanceId, p1, p2, stripThickness);
      sideBatchChanged = true;
      continue;
    }
    setStripTransform(spec.mesh, p1, p2, stripThickness);
    spec.mesh.material.color.copy(isMainBuilding ? mainLedColor : ledColor);
    spec.mesh.visible = spec.edgeRole !== 'bridge' || readBridgeVisible(spec.bridgeRecord);
  }
  if (sideBatchChanged && sideBuildingEdgeBatch.mesh) {
    sideBuildingEdgeBatch.mesh.instanceMatrix.needsUpdate = true;
    sideBuildingEdgeBatch.mesh.userData.staticCullBaseVisible = sideBuildingEdgeBatch.enabled;
    sideBuildingEdgeBatch.mesh.visible = sideBuildingEdgeBatch.enabled;
    refreshCullingBounds(sideBuildingEdgeBatch.mesh);
  }
  updateFacadeStripOutsets(nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale);
  updateHorizontalBuildingLedRings(brightness, hueDeg, mainBrightness, mainHueDeg, horizontalDistance, mainHorizontalDistance, horizontalThickness, mainHorizontalThickness, horizontalRadius, mainHorizontalRadius, buildingLowOffset, buildingHighOffset, mainLowOffset, mainHighOffset, buildingLowY, buildingHighY, mainLowY, mainHighY, sideScale, mainScale, nextSideWidthScale, nextSideDepthScale, nextMainWidthScale, nextMainDepthScale, nextSideSpacingScale, nextStreetEdgeWidth);
  updateFacadeLedRibbons(brightness, hueDeg, mainBrightness, mainHueDeg);
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

function mountFxCategoryPanels() {
  const appendRow = (targetId, inputId) => {
    const target = document.getElementById(targetId);
    const input = document.getElementById(inputId);
    const row = input?.closest('.control-row');
    if (!target || !row) return;
    target.appendChild(row);
  };

  const appendRows = (targetId, inputIds) => {
    inputIds.forEach((inputId) => appendRow(targetId, inputId));
  };

  const appendElement = (targetId, elementId) => {
    const target = document.getElementById(targetId);
    const element = document.getElementById(elementId);
    if (target && element) target.appendChild(element);
  };

  const mountHiddenRange = (targetId, inputId, outputId, label, min, max, step, formatter = (value) => value.toFixed(2)) => {
    const target = document.getElementById(targetId);
    const input = document.getElementById(inputId);
    const output = document.getElementById(outputId);
    if (!target || !input || !output) return;
    const storedValue = input.value;
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.type = 'range';
    input.value = storedValue;
    input.removeAttribute('hidden');
    output.removeAttribute('hidden');
    output.classList.add('control-value');
    output.textContent = formatter(Number(input.value));
    const row = document.createElement('label');
    row.className = 'control-row';
    const head = document.createElement('span');
    head.className = 'control-head';
    const text = document.createElement('span');
    text.textContent = label;
    head.appendChild(text);
    head.appendChild(output);
    row.appendChild(head);
    row.appendChild(input);
    target.appendChild(row);
  };

  appendRows('bloom-fx-controls', [
    'bloom-enabled',
    'bloom-strength',
    'bloom-radius',
    'bloom-threshold',
    'bloom-quality',
  ]);

  appendRows('performance-fx-controls', [
    'performance-mode',
    'render-resolution',
    'aa-mode',
    'pixel-ratio',
    'fsr-preset',
    'fsr-upscale-enabled',
    'fsr-internal-scale',
    'fsr-sharpness',
  ]);
  appendElement('performance-fx-controls', 'run-fsr-benchmark');
  appendElement('performance-fx-controls', 'fsr-benchmark-results');
  const performanceTarget = document.getElementById('performance-fx-controls');
  if (performanceTarget && !document.getElementById('performance-diagnostics')) {
    const section = document.createElement('div');
    section.className = 'control-section';
    section.textContent = 'Diagnostica live';
    performanceTarget.appendChild(section);
    performanceDiagnosticsEl = document.createElement('div');
    performanceDiagnosticsEl.id = 'performance-diagnostics';
    performanceDiagnosticsEl.className = 'control-value';
    performanceDiagnosticsEl.style.whiteSpace = 'normal';
    performanceDiagnosticsEl.style.lineHeight = '1.45';
    performanceDiagnosticsEl.textContent = 'FPS --';
    performanceTarget.appendChild(performanceDiagnosticsEl);
  }

  appendRows('atmosphere-fx-controls', [
    'ambient-light',
    'key-light',
    'exposure',
    'sky-choice',
    'sky-quality',
    'sky-brightness',
    'sky-hue',
    'sky-cloud-contrast',
    'sky-storm-frequency',
    'sky-storm-intensity',
    'sky-storm-size',
    'sky-storm-cloud-threshold',
    'sky-storm-band',
    'sky-storm-veil',
  ]);

  [
    ['led-brightness', 'led-brightness-val', 'LED palazzi brightness', 0, 3, 0.01],
    ['led-thickness', 'led-thickness-val', 'LED palazzi spessore', 0.05, 3, 0.01],
    ['led-distance', 'led-distance-val', 'LED palazzi distanza', -40, 20, 0.05],
    ['led-hue', 'led-hue-val', 'LED palazzi hue', -180, 180, 1, (value) => value.toFixed(0)],
    ['building-horizontal-led-distance', 'building-horizontal-led-distance-val', 'Orizzontali distanza', -20, 20, 0.05],
    ['building-horizontal-led-thickness', 'building-horizontal-led-thickness-val', 'Orizzontali spessore', 0.04, 5, 0.01],
    ['building-horizontal-led-radius', 'building-horizontal-led-radius-val', 'Orizzontali radius', 0.1, 3.5, 0.01],
    ['building-low-led-offset', 'building-low-led-offset-val', 'Sotto distanza', -20, 20, 0.05],
    ['building-high-led-offset', 'building-high-led-offset-val', 'Sopra distanza', -20, 20, 0.05],
    ['building-vertical-led-length', 'building-vertical-led-length-val', 'Verticali lunghezza', 0.1, 2, 0.01],
    ['building-vertical-led-y', 'building-vertical-led-y-val', 'Verticali Y', -80, 80, 0.5, (value) => value.toFixed(1)],
    ['building-low-led-y', 'building-low-led-y-val', 'Sotto Y', -80, 80, 0.5, (value) => value.toFixed(1)],
    ['building-high-led-y', 'building-high-led-y-val', 'Sopra Y', -80, 80, 0.5, (value) => value.toFixed(1)],
    ['base-pad-led-brightness', 'base-pad-led-brightness-val', 'Marciapiedi brightness', 0, 3, 0.01],
    ['base-pad-led-thickness', 'base-pad-led-thickness-val', 'Marciapiedi spessore', 0.04, 3, 0.01],
    ['base-pad-led-offset', 'base-pad-led-offset-val', 'Marciapiedi offset', -6, 6, 0.01],
    ['base-pad-led-hue', 'base-pad-led-hue-val', 'Marciapiedi hue', -180, 180, 1, (value) => value.toFixed(0)],
  ].forEach((spec) => mountHiddenRange('led-glow-fx-city-controls', ...spec));

  appendRows('led-glow-fx-main-controls', [
    'main-led-brightness-ui',
    'main-led-hue-ui',
    'main-led-vertical-distance-ui',
    'main-led-thickness-ui',
    'main-led-vertical-length-ui',
    'main-led-vertical-y-ui',
    'main-led-horizontal-distance-ui',
    'main-led-horizontal-thickness-ui',
    'main-led-horizontal-radius-ui',
    'main-led-low-offset-ui',
    'main-led-low-y-ui',
    'main-led-high-offset-ui',
    'main-led-high-y-ui',
    'main-facade-led-brightness-ui',
    'main-facade-led-normal-ui',
    'main-facade-led-x-ui',
    'main-facade-led-y-ui',
    'main-facade-led-thickness-ui',
  ]);
  for (let index = 1; index <= 6; index += 1) {
    appendRows('led-glow-fx-main-controls', [
      `main-facade-led-seg-${index}-u-ui`,
      `main-facade-led-seg-${index}-y-ui`,
      `main-facade-led-seg-${index}-normal-ui`,
    ]);
  }
  appendElement('led-glow-fx-main-controls', 'main-facade-led-controls');
}

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
  headBobOffset = 0;
  sideSwayOffset = 0;
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
  headBobOffset = 0;
  sideSwayOffset = 0;
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
  hexPassOffset = Number(controlEls.hexOffset.value);
  hexDepressRadius = Number(controlEls.hexRadius.value);
  hexDropDelay = Number(controlEls.hexDropDelay.value);
  hexDropSpeed = Number(controlEls.hexDropSpeed.value);
  hexRecovery = Number(controlEls.hexRecovery.value);
  hexTileHitLight = Number(controlEls.tileHitLight.value);
  hexPlayerTileLight = Number(controlEls.playerTileLight.value);
  controlEls.hexOffsetVal.textContent = formatOffsetLabel(hexPassOffset);
  controlEls.hexRadiusVal.textContent = hexDepressRadius.toFixed(1);
  controlEls.hexDropDelayVal.textContent = `${hexDropDelay.toFixed(0)} ms`;
  controlEls.hexDropSpeedVal.textContent = hexDropSpeed.toFixed(1);
  controlEls.hexRecoveryVal.textContent = hexRecovery.toFixed(1);
  controlEls.tileHitLightVal.textContent = hexTileHitLight.toFixed(2);
  controlEls.playerTileLightVal.textContent = hexPlayerTileLight.toFixed(2);
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
  roadBuildingReflection = roadBuildingReflect;
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
    material.envMap = getRoadReflectionEnvMap(roadBuildingReflection);
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
  basePadTextureMode = controlEls.basePadTextureMode.value;
  basePadTextureRepeat = Number(controlEls.basePadTextureRepeat.value);
  basePadTextureRotation = Number(controlEls.basePadTextureRotation.value);
  basePadNormalStrength = Number(controlEls.basePadNormal.value);
  basePadHue = Number(controlEls.basePadHue.value);
  basePadSaturation = Number(controlEls.basePadSat.value);
  basePadBrightness = Number(controlEls.basePadBright.value);
  basePadMetalness = Number(controlEls.basePadMetalness.value);
  basePadRoughness = Number(controlEls.basePadRoughness.value);
  basePadReflect = Number(controlEls.basePadReflect.value);
  basePadEmissive = Number(controlEls.basePadEmissive.value);
  basePadFlatShading = controlEls.basePadFlatShading.value === 'on';
  basePadBorderOpacity = Number(controlEls.basePadBorderOpacity.value);
  basePadBorderBrightness = Number(controlEls.basePadBorderBright.value);
  const lightResponse = sceneLightResponse(Number(controlEls.ambientLight.value), Number(controlEls.keyLight.value));
  basePadSurfaceTex.repeat.set(basePadTextureRepeat, basePadTextureRepeat);
  basePadSurfaceTex.center.set(0.5, 0.5);
  basePadSurfaceTex.rotation = THREE.MathUtils.degToRad(basePadTextureRotation);
  basePadSurfaceMat.map = basePadTextureMode === 'on' ? basePadSurfaceTex : null;
  basePadSurfaceMat.normalMap = basePadNormalStrength > 0.001 ? roadMicroNormalTex : null;
  basePadSurfaceMat.normalScale.set(basePadNormalStrength, basePadNormalStrength);
  basePadSurfaceMat.color.copy(tunedColor(basePadSurfaceBaseColor, basePadHue, basePadSaturation, basePadBrightness * lightResponse.surface));
  basePadSurfaceMat.metalness = basePadMetalness;
  basePadSurfaceMat.roughness = basePadRoughness;
  basePadSurfaceMat.envMapIntensity = basePadReflect * lightResponse.reflection;
  basePadSurfaceMat.emissive.copy(tunedColor(basePadSurfaceEmissiveColor, basePadHue, Math.max(0.4, basePadSaturation), 1));
  basePadSurfaceMat.emissiveIntensity = basePadEmissive * lightResponse.emissive + lightResponse.floorFill * 0.35;
  basePadSurfaceMat.flatShading = basePadFlatShading;
  basePadSurfaceMat.needsUpdate = true;
  buildingBasePadBorderMat.opacity = basePadBorderOpacity;
  buildingBasePadBorderMat.color.copy(tunedColor(basePadBorderBaseColor, basePadHue, Math.max(0.4, basePadSaturation), basePadBorderBrightness));
  controlEls.basePadTextureModeVal.textContent = basePadTextureMode;
  controlEls.basePadTextureRepeatVal.textContent = `${basePadTextureRepeat.toFixed(2)}x`;
  controlEls.basePadTextureRotationVal.textContent = basePadTextureRotation.toFixed(0);
  controlEls.basePadNormalVal.textContent = basePadNormalStrength.toFixed(2);
  controlEls.basePadHueVal.textContent = basePadHue.toFixed(0);
  controlEls.basePadSatVal.textContent = basePadSaturation.toFixed(2);
  controlEls.basePadBrightVal.textContent = basePadBrightness.toFixed(2);
  controlEls.basePadMetalnessVal.textContent = basePadMetalness.toFixed(2);
  controlEls.basePadRoughnessVal.textContent = basePadRoughness.toFixed(2);
  controlEls.basePadReflectVal.textContent = basePadReflect.toFixed(2);
  controlEls.basePadEmissiveVal.textContent = basePadEmissive.toFixed(3);
  controlEls.basePadFlatShadingVal.textContent = basePadFlatShading ? 'on' : 'off';
  controlEls.basePadBorderOpacityVal.textContent = basePadBorderOpacity.toFixed(2);
  controlEls.basePadBorderBrightVal.textContent = basePadBorderBrightness.toFixed(2);
}

function applyBoundaryErrorControlsFromUI() {
  roadBoundaryCollisionEnabled = controlEls.roadBoundaryCollisionEnabled.value === 'on';
  roadBoundaryCollisionMargin = Number(controlEls.roadBoundaryCollisionMargin.value);
  roadBoundaryCameraLead = Number(controlEls.roadBoundaryCameraLead.value);
  roadBoundaryPulseStrength = Number(controlEls.roadBoundaryPulseStrength.value);
  boundaryErrorVisible = controlEls.boundaryErrorVisible.value === 'on';
  boundaryErrorSize = Number(controlEls.boundaryErrorSize.value);
  boundaryErrorAnchor = controlEls.boundaryErrorAnchor.value;
  boundaryErrorAnimation = Number(controlEls.boundaryErrorAnimation.value);
  boundaryErrorDuration = Number(controlEls.boundaryErrorDuration.value) / 1000;
  boundaryErrorGlitch = Number(controlEls.boundaryErrorGlitch.value);
  boundaryErrorRenderMode = controlEls.boundaryErrorRenderMode.value;
  boundaryErrorFloorLightEnabled = controlEls.boundaryErrorFloorLightEnabled.value === 'on';
  boundaryErrorFloorLightRadius = Number(controlEls.boundaryErrorFloorLightRadius.value);
  boundaryErrorFloorLightIntensity = Number(controlEls.boundaryErrorFloorLightIntensity.value);
  boundaryErrorFloorLightOpacity = Number(controlEls.boundaryErrorFloorLightOpacity.value);
  boundaryErrorFloorLightHue = Number(controlEls.boundaryErrorFloorLightHue.value);
  boundaryErrorFloorLightY = Number(controlEls.boundaryErrorFloorLightY.value);
  boundaryErrorFloorLightSoftness = Number(controlEls.boundaryErrorFloorLightSoftness.value);
  refreshBoundaryErrorFloorLightTexture();
  if (!boundaryErrorVisible) {
    boundaryErrorPulse = 0;
    hideBoundaryErrorVisuals(false);
  }
  if (!boundaryErrorFloorLightEnabled) boundaryErrorFloorLightMesh.visible = false;
  controlEls.roadBoundaryCollisionEnabledVal.textContent = roadBoundaryCollisionEnabled ? 'on' : 'off';
  controlEls.roadBoundaryCollisionMarginVal.textContent = roadBoundaryCollisionMargin.toFixed(1);
  controlEls.roadBoundaryCameraLeadVal.textContent = roadBoundaryCameraLead.toFixed(1);
  controlEls.roadBoundaryPulseStrengthVal.textContent = roadBoundaryPulseStrength.toFixed(2);
  controlEls.boundaryErrorVisibleVal.textContent = boundaryErrorVisible ? 'on' : 'off';
  controlEls.boundaryErrorSizeVal.textContent = boundaryErrorSize.toFixed(2);
  controlEls.boundaryErrorAnchorVal.textContent = boundaryErrorAnchor === 'wall' ? 'muro' : 'camera';
  controlEls.boundaryErrorAnimationVal.textContent = boundaryErrorAnimation.toFixed(2);
  controlEls.boundaryErrorDurationVal.textContent = `${Math.round(boundaryErrorDuration * 1000)} ms`;
  controlEls.boundaryErrorGlitchVal.textContent = boundaryErrorGlitch.toFixed(2);
  controlEls.boundaryErrorRenderModeVal.textContent = boundaryErrorRenderMode;
  controlEls.boundaryErrorFloorLightEnabledVal.textContent = boundaryErrorFloorLightEnabled ? 'on' : 'off';
  controlEls.boundaryErrorFloorLightRadiusVal.textContent = boundaryErrorFloorLightRadius.toFixed(1);
  controlEls.boundaryErrorFloorLightIntensityVal.textContent = boundaryErrorFloorLightIntensity.toFixed(2);
  controlEls.boundaryErrorFloorLightOpacityVal.textContent = boundaryErrorFloorLightOpacity.toFixed(2);
  controlEls.boundaryErrorFloorLightHueVal.textContent = boundaryErrorFloorLightHue.toFixed(0);
  controlEls.boundaryErrorFloorLightYVal.textContent = boundaryErrorFloorLightY.toFixed(2);
  controlEls.boundaryErrorFloorLightSoftnessVal.textContent = boundaryErrorFloorLightSoftness.toFixed(2);
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

  hexPassOffset = offset;
  hexDepressRadius = radius;
  hexDropDelay = dropDelay;
  hexDropSpeed = dropSpeed;
  hexRecovery = recovery;
  hexTileHeightScale = tileHeight;
  hexTileScale = tileScale;
  hexTileGap = hexGap;
  hexTileHitLight = tileHitLight;
  hexPlayerTileLight = playerTileLight;
  roadBuildingReflection = roadBuildingReflect;
  sideBuildingWidthScale = nextSideBuildingWidthScale;
  sideBuildingDepthScale = nextSideBuildingDepthScale;
  sideBuildingSpacingScale = nextSideBuildingSpacingScale;
  mainBuildingWidthScale = nextMainBuildingWidthScale;
  mainBuildingDepthScale = nextMainBuildingDepthScale;
  mainBuildingZ = nextMainBuildingZ;
  mainBuildingY = nextMainBuildingY;
  mainBuildingSaturation = nextMainBuildingSaturation;
  buildingFacadeLedNormal = nextBuildingFacadeLedNormal;
  buildingFacadeLedX = nextBuildingFacadeLedX;
  buildingFacadeLedY = nextBuildingFacadeLedY;
  buildingFacadeLedZ = nextBuildingFacadeLedZ;
  nextSideFacadeSegmentOffsets.forEach((offset, index) => {
    sideBuildingFacadeLedSegmentOffsets[index].u = offset.u;
    sideBuildingFacadeLedSegmentOffsets[index].y = offset.y;
    sideBuildingFacadeLedSegmentOffsets[index].normal = offset.normal;
  });
  mainBuildingFacadeLedBrightness = nextMainBuildingFacadeLedBrightness;
  mainBuildingFacadeLedNormal = nextMainBuildingFacadeLedNormal;
  mainBuildingFacadeLedX = nextMainBuildingFacadeLedX;
  mainBuildingFacadeLedY = nextMainBuildingFacadeLedY;
  mainBuildingFacadeLedZ = nextMainBuildingFacadeLedZ;
  mainBuildingFacadeLedThickness = nextMainBuildingFacadeLedThickness;
  nextMainFacadeSegmentOffsets.forEach((offset, index) => {
    mainBuildingFacadeLedSegmentOffsets[index].u = offset.u;
    mainBuildingFacadeLedSegmentOffsets[index].y = offset.y;
    mainBuildingFacadeLedSegmentOffsets[index].normal = offset.normal;
  });
  basePadGlobalY = nextBasePadGlobalY;
  basePadCurbEnabled = nextBasePadCurbEnabled;
  basePadCurbWidth = nextBasePadCurbWidth;
  basePadInnerRaise = nextBasePadInnerRaise;
  basePadCurbSlope = nextBasePadCurbSlope;
  basePadCurbRadius = nextBasePadCurbRadius;
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
  basePadTextureMode = nextBasePadTextureMode;
  basePadTextureRepeat = nextBasePadTextureRepeat;
  basePadTextureRotation = nextBasePadTextureRotation;
  basePadNormalStrength = nextBasePadNormalStrength;
  basePadHue = nextBasePadHue;
  basePadSaturation = nextBasePadSaturation;
  basePadBrightness = nextBasePadBrightness;
  basePadMetalness = nextBasePadMetalness;
  basePadRoughness = nextBasePadRoughness;
  basePadReflect = nextBasePadReflect;
  basePadEmissive = nextBasePadEmissive;
  basePadBevelSize = nextBasePadBevelSize;
  basePadBevelSegments = nextBasePadBevelSegments;
  basePadFlatShading = nextBasePadFlatShading;
  basePadBorderOpacity = nextBasePadBorderOpacity;
  basePadBorderBrightness = nextBasePadBorderBrightness;
  roadBoundaryHexEnabled = nextRoadBoundaryHexEnabled;
  roadBoundaryHexRows = nextRoadBoundaryHexRows;
  roadSideHexExtraRows = nextRoadSideHexExtraRows;
  roadBoundaryHexFillBrightness = nextRoadBoundaryHexBrightness;
  roadBoundaryHexAlpha = nextRoadBoundaryHexOpacity;
  roadBoundaryHexY = nextRoadBoundaryHexY;
  nextRoadBoundaryHexRowOffsets.forEach((value, index) => {
    roadBoundaryHexRowOffsets[index] = value;
  });
  roadBoundaryHexOutsetScale = nextRoadBoundaryHexOutset;
  roadBoundaryCollisionEnabled = nextRoadBoundaryCollisionEnabled;
  roadBoundaryCollisionMargin = nextRoadBoundaryCollisionMargin;
  roadBoundaryCameraLead = nextRoadBoundaryCameraLead;
  roadBoundaryPulseStrength = nextRoadBoundaryPulseStrength;
  boundaryErrorVisible = nextBoundaryErrorVisible;
  boundaryErrorSize = nextBoundaryErrorSize;
  boundaryErrorAnchor = nextBoundaryErrorAnchor;
  boundaryErrorAnimation = nextBoundaryErrorAnimation;
  boundaryErrorDuration = nextBoundaryErrorDuration;
  boundaryErrorGlitch = nextBoundaryErrorGlitch;
  boundaryErrorRenderMode = nextBoundaryErrorRenderMode;
  boundaryErrorFloorLightEnabled = nextBoundaryErrorFloorLightEnabled;
  boundaryErrorFloorLightRadius = nextBoundaryErrorFloorLightRadius;
  boundaryErrorFloorLightIntensity = nextBoundaryErrorFloorLightIntensity;
  boundaryErrorFloorLightOpacity = nextBoundaryErrorFloorLightOpacity;
  boundaryErrorFloorLightHue = nextBoundaryErrorFloorLightHue;
  boundaryErrorFloorLightY = nextBoundaryErrorFloorLightY;
  boundaryErrorFloorLightSoftness = nextBoundaryErrorFloorLightSoftness;
  refreshBoundaryErrorFloorLightTexture();
  if (!boundaryErrorVisible) {
    boundaryErrorPulse = 0;
    hideBoundaryErrorVisuals(false);
  }
  if (!boundaryErrorFloorLightEnabled) {
    boundaryErrorFloorLightMesh.visible = false;
  }
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
  basePadSurfaceTex.repeat.set(basePadTextureRepeat, basePadTextureRepeat);
  basePadSurfaceTex.center.set(0.5, 0.5);
  basePadSurfaceTex.rotation = THREE.MathUtils.degToRad(basePadTextureRotation);
  basePadSurfaceMat.map = basePadTextureMode === 'on' ? basePadSurfaceTex : null;
  basePadSurfaceMat.normalMap = basePadNormalStrength > 0.001 ? roadMicroNormalTex : null;
  basePadSurfaceMat.normalScale.set(basePadNormalStrength, basePadNormalStrength);
  basePadSurfaceMat.color.copy(tunedColor(basePadSurfaceBaseColor, basePadHue, basePadSaturation, basePadBrightness * lightResponse.surface));
  basePadSurfaceMat.metalness = basePadMetalness;
  basePadSurfaceMat.roughness = basePadRoughness;
  basePadSurfaceMat.envMapIntensity = basePadReflect * lightResponse.reflection;
  basePadSurfaceMat.emissive.copy(tunedColor(basePadSurfaceEmissiveColor, basePadHue, Math.max(0.4, basePadSaturation), 1));
  basePadSurfaceMat.emissiveIntensity = basePadEmissive * lightResponse.emissive + lightResponse.floorFill * 0.35;
  basePadSurfaceMat.flatShading = basePadFlatShading;
  basePadSurfaceMat.needsUpdate = true;
  buildingBasePadBorderMat.opacity = basePadBorderOpacity;
  buildingBasePadBorderMat.color.copy(tunedColor(basePadBorderBaseColor, basePadHue, Math.max(0.4, basePadSaturation), basePadBorderBrightness));
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
    material.envMap = getRoadReflectionEnvMap(roadBuildingReflection);
    material.envMapIntensity = roadReflect * lightResponse.reflection;
    material.metalness = roadMetalness;
    material.roughness = roadRoughness;
    material.normalScale.set(roadNormal, roadNormal);
    setHexRoadMaterialGlow(material, hexInstanceGlow, hexTileDisplayBaseColor);
  });

  updateBridgeLinks(nextSideBuildingWidthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth, nextBridgeXOffset, nextBridgeZOffset, nextBridgeYOffset, nextBridgeSpanScale, nextBridgeHeightScale, nextBridgeDepthScale);
  updateEdgeStrips(ledBrightness, ledThickness, nextLedDistance, ledHue, mainBuildingLedBrightness, mainBuildingLedThickness, mainBuildingLedDistance, mainBuildingLedHue, nextBuildingHorizontalLedDistance, nextMainBuildingHorizontalLedDistance, nextBuildingHorizontalLedThickness, nextMainBuildingHorizontalLedThickness, nextBuildingHorizontalLedRadius, nextMainBuildingHorizontalLedRadius, buildingLowLedOffset, buildingHighLedOffset, bridgeLowLedOffset, bridgeHighLedOffset, mainBuildingLowLedOffset, mainBuildingHighLedOffset, nextBuildingVerticalLedLength, nextMainBuildingVerticalLedLength, nextBuildingVerticalLedY, nextBuildingLowLedY, nextBuildingHighLedY, nextMainBuildingVerticalLedY, nextMainBuildingLowLedY, nextMainBuildingHighLedY, sideBuildingScale, mainBuildingScale, nextSideBuildingWidthScale, nextSideBuildingDepthScale, nextMainBuildingWidthScale, nextMainBuildingDepthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth);
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
mountFxCategoryPanels();
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

function inspectSideBuildingCivicNumberCulling() {
  let totalPlanes = 0;
  let visiblePlanes = 0;
  let frustumCulledPlanes = 0;
  const groups = sideBuildingCivicNumberGroups.map((group) => {
    let groupPlanes = 0;
    let groupVisiblePlanes = 0;
    let groupFrustumCulledPlanes = 0;
    for (const child of group.children) {
      if (!child.isMesh) continue;
      groupPlanes++;
      if (child.visible) groupVisiblePlanes++;
      if (child.frustumCulled) groupFrustumCulledPlanes++;
    }
    totalPlanes += groupPlanes;
    visiblePlanes += groupVisiblePlanes;
    frustumCulledPlanes += groupFrustumCulledPlanes;
    return {
      value: group.userData.civicNumberValue,
      planes: groupPlanes,
      visiblePlanes: groupVisiblePlanes,
      frustumCulledPlanes: groupFrustumCulledPlanes,
      cullDisabledPlanes: groupPlanes - groupFrustumCulledPlanes,
      visible: Boolean(group.visible),
    };
  });
  return {
    groups: groups.length,
    totalPlanes,
    visiblePlanes,
    frustumCulledPlanes,
    cullDisabledPlanes: totalPlanes - frustumCulledPlanes,
    groupsDetail: groups,
  };
}

function inspectSideBuildingDoorBatching() {
  const batches = [...sideDoorBatchState.batches.values()].map((batch) => ({
    key: batch.key,
    count: batch.mesh?.count ?? 0,
    capacity: batch.capacity,
    visible: Boolean(batch.mesh?.visible),
    frustumCulled: Boolean(batch.mesh?.frustumCulled),
    renderOrder: batch.mesh?.renderOrder ?? null,
    parts: batch.parts.map((part) => part.name),
  }));
  const drawObjects = batches.filter((batch) => batch.capacity > 0).length;
  const previousDrawObjects = sideDoorBatchState.records.length * SIDE_DOOR_BATCH_PARTS.length;
  const instances = batches.reduce((sum, batch) => sum + batch.count, 0);
  const frustumCulledCount = batches.filter((batch) => batch.frustumCulled).length;
  return {
    batched: sideDoorBatchState.built,
    doors: sideBuildingDoorGroups.length,
    anchors: sideDoorBatchState.records.length,
    drawObjects,
    previousDrawObjects,
    savedDrawObjects: Math.max(0, previousDrawObjects - drawObjects),
    instances,
    visibleInstances: sideDoorBatchState.visibleInstances,
    frustumCulledCount,
    cullDisabledBatches: drawObjects - frustumCulledCount,
    batches,
  };
}

window.__tronInspect = () => ({
  cameraX: camera.position.x,
  cameraY: camera.position.y,
  cameraZ: camera.position.z,
  cameraPitch: pitch,
  cameraYaw: yaw,
  noclip: tronNoclipEnabled,
  cameraCollisionDisabled: isCameraCollisionDisabled(),
  mouseLookEnabled: isMouseLookEnabled(),
  cityRevealProfile: cityRevealProfileInspect(),
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
  sideBuildingLedLayouts: sideBuildingRecords.map((record) => {
    const centers = facadeStripPositionSpecs
      .filter((spec) => spec.parent === record.mesh && spec.edgeRole === 'side-building' && spec.batchKind === 'led')
      .map((spec) => facadeStripDynamicTransform(spec).basePosition.y)
      .sort((a, b) => a - b);
    return {
      value: record.civicNumberValue,
      baseH: record.collider?.baseH ?? null,
      z: record.mesh.position.z,
      yMin: centers[0] ?? null,
      yMax: centers[centers.length - 1] ?? null,
      yCenters: centers,
    };
  }),
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
  pointerLocked,
  unlockedMouseLookActive,
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
    active: droneIntroFlight.active,
    landed: hasDroneIntroLanded(),
    progress: droneIntroFlight.progress,
    durationMs: droneIntroFlight.durationMs,
    triggerKey: DRONE_INTRO_TRIGGER_KEY,
    autoEnabled: DRONE_INTRO_AUTO_ENABLED,
    autoDelayMs: DRONE_INTRO_AUTO_DELAY_MS,
    autoTriggered: droneIntroAutoTriggered,
    autoPending: Boolean(droneIntroAutoTimer),
    source: droneIntroFlight.source,
    targetX: droneIntroTarget.x,
    targetY: droneIntroTarget.y,
    targetZ: droneIntroTarget.z,
    targetYaw: droneIntroFlight.targetYaw,
    targetPitch: droneIntroFlight.targetPitch,
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
  cityRevealSkyDomeVisible: cityRevealSkyDome.visible,
  cityRevealSkyBudgetQuality: cityRevealSkyUsesBudgetQuality(),
  cityRevealSkyQualityMain: domeMat.uniforms.uSkyQuality.value,
  cityRevealSkyQualityReveal: cityRevealSkyMat.uniforms.uSkyQuality.value,
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
    mainLedReveal: Boolean(cityRevealMainLedRevealPass?.enabled),
  },
  cityRevealScanGlow: {
    enabled: CITY_REVEAL_SCAN_GLOW_ENABLED,
    objectCount: 1,
    visible: Boolean(cityRevealScanGlowMesh.visible),
    opacity: Number(cityRevealScanGlowMat.uniforms.uOpacity.value.toFixed(4)),
    frontZ: Number(cityRevealFrontZ.toFixed(3)),
    width: Number(cityRevealScanGlowMesh.scale.x.toFixed(2)),
    height: Number(cityRevealScanGlowMesh.scale.y.toFixed(2)),
    renderOrder: cityRevealScanGlowMesh.renderOrder,
    attachedTo: 'cityRevealFrontZ',
  },
  cityRevealMainLedRevealOverlayObjects: mainBuildingVerticalRevealOverlayObjects.size,
  cityRevealMainLedRevealLayerActive: mainBuildingVerticalRevealOverlayLayerActive,
  cityRevealMainLedRevealDelayMs: CITY_REVEAL_MAIN_LED_VISIBLE_DELAY_MS,
  cityRevealMainLedRevealElapsedMs: cityRevealMainLedRevealElapsedMs(),
  cityRevealMainLedRevealReady: isCityRevealMainLedRevealOverlayActive(),
  cityRevealMainLedRevealOptimization: {
    skipCompletedOverlay: true,
    completeProgress: CITY_REVEAL_MAIN_LED_OVERLAY_COMPLETE_PROGRESS,
    currentProgress: Number(mainFacadeVerticalRevealProgress().toFixed(4)),
    scissorEnabled: CITY_REVEAL_MAIN_LED_SCISSOR_ENABLED,
    scissorActive: cityRevealMainLedScissorState.active,
    scissor: {
      x: cityRevealMainLedScissorState.x,
      y: cityRevealMainLedScissorState.y,
      width: cityRevealMainLedScissorState.width,
      height: cityRevealMainLedScissorState.height,
      targetWidth: cityRevealMainLedScissorState.targetWidth,
      targetHeight: cityRevealMainLedScissorState.targetHeight,
      paddingPx: cityRevealMainLedScissorState.paddingPx,
    },
  },
  cityRevealMainLedOverlayMode: cityRevealMainLedDepthProxyLastMode,
  cityRevealMainLedDepthProxyObjects: cityRevealMainLedDepthProxyObjects.length,
  cityRevealMainLedDepthProxyVisibleObjects: cityRevealMainLedDepthProxyVisibleCount,
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
  fxLed: {
    mainFacade: {
      brightness: mainBuildingFacadeLedBrightness,
      normal: mainBuildingFacadeLedNormal,
      x: mainBuildingFacadeLedX,
      y: mainBuildingFacadeLedY,
      z: mainBuildingFacadeLedZ,
      thickness: mainBuildingFacadeLedThickness,
      segments: mainBuildingFacadeLedSegmentOffsets.map((offset) => ({ ...offset })),
    },
    sideFacade: {
      normal: buildingFacadeLedNormal,
      x: buildingFacadeLedX,
      y: buildingFacadeLedY,
      z: buildingFacadeLedZ,
      segments: sideBuildingFacadeLedSegmentOffsets.map((offset) => ({ ...offset })),
    },
  },
  render: { ...renderer.info.render },
  memory: { ...renderer.info.memory },
});
window.__tronRunnerInspect = tronRunnerInspect;
window.__tronRevealProfile = cityRevealProfileInspect;
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
  storm: {
    frequency: domeMat.uniforms.uStormFrequency.value,
    cloudContrast: domeMat.uniforms.uCloudContrast.value,
    intensity: domeMat.uniforms.uStormIntensity.value,
    size: domeMat.uniforms.uStormSize.value,
    cloudThreshold: domeMat.uniforms.uStormCloudThreshold.value,
    band: domeMat.uniforms.uStormBand.value,
    veil: domeMat.uniforms.uStormVeil.value,
    mainQuality: domeMat.uniforms.uSkyQuality.value,
    revealQuality: cityRevealSkyMat.uniforms.uSkyQuality.value,
    revealBudgetQuality: cityRevealSkyUsesBudgetQuality(),
  },
  hexUpdateEnabled,
  hexTiles: hexRoadTiles.length,
  hexRoad: hexRoadInspect(),
  buildingLedBatches: buildingLedBatchInspect(),
  recoveringHexTiles: recoveringHexTiles.size,
  boundaryErrorPulse,
  boundaryErrorTextureAge: boundaryErrorTextureLastAge,
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
    composerPasses: cityRevealComposerPassProfile().estimatedPasses,
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
  const profile = cityRevealComposerPassProfile();
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

// ---------- Atmospheric particles: dust/embers drifting in the boulevard fog ----------
const ATMOSPHERE_PARTICLE_COUNT = 400;
const ATMOSPHERE_PARTICLE_BOX = new THREE.Vector3(240, 95, 240);
let atmosphereParticles = null;
let atmosphereParticleTimeUniform = null;
function buildAtmosphereParticles() {
  if (atmosphereParticles) return;
  const positions = new Float32Array(ATMOSPHERE_PARTICLE_COUNT * 3);
  const seeds = new Float32Array(ATMOSPHERE_PARTICLE_COUNT);
  for (let i = 0; i < ATMOSPHERE_PARTICLE_COUNT; i += 1) {
    positions[i * 3] = Math.random() * ATMOSPHERE_PARTICLE_BOX.x;
    positions[i * 3 + 1] = Math.random() * ATMOSPHERE_PARTICLE_BOX.y;
    positions[i * 3 + 2] = Math.random() * ATMOSPHERE_PARTICLE_BOX.z;
    seeds[i] = Math.random() * 6.2831853;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9); // never frustum-culled (camera-anchored)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uBox: { value: ATMOSPHERE_PARTICLE_BOX },
      uColor: { value: new THREE.Color(PAL.cyan) },
      uSize: { value: 2.4 },
      uOpacity: { value: 0.35 },
    },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      uniform vec3 uBox;
      uniform float uSize;
      varying float vFade;
      void main() {
        vec3 drift = vec3(sin(uTime * 0.12 + aSeed) * 4.0, uTime * 2.2, cos(uTime * 0.1 + aSeed * 1.7) * 4.0);
        vec3 cell = cameraPosition - uBox * 0.5;
        vec3 p = cell + mod(position + drift - cell, uBox);
        // fade toward the edges of the camera box so wrapping isn't visible, and with height
        vec3 d = abs(p - cameraPosition) / (uBox * 0.5);
        float edge = (1.0 - smoothstep(0.7, 1.0, d.x)) * (1.0 - smoothstep(0.7, 1.0, d.z)) * (1.0 - smoothstep(0.6, 1.0, d.y));
        vFade = edge;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (220.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vFade;
      void main() {
        float dist = length(gl_PointCoord - 0.5);
        if (dist > 0.5) discard;
        float a = smoothstep(0.5, 0.0, dist) * vFade * uOpacity;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  });
  atmosphereParticles = new THREE.Points(geometry, material);
  atmosphereParticles.name = 'atmosphere-fog-particles';
  atmosphereParticles.frustumCulled = false;
  atmosphereParticles.renderOrder = 22;
  atmosphereParticles.visible = false;
  atmosphereParticleTimeUniform = material.uniforms.uTime;
  scene.add(atmosphereParticles);
}
buildAtmosphereParticles();

// ---------- Greeter welcome speech bubble ----------
let greeterSpeechBubble = null;
const greeterBubbleWorldScratch = new THREE.Vector3();
const greeterBubbleViewScratch = new THREE.Vector3();
const GREETER_BUBBLE_HEAD_Y = 5.0;
const GREETER_BUBBLE_HEAD_GAP = 1.6;
const GREETER_BUBBLE_REF_DIST = 7.0; // distance at which the bubble is shown at 1x
const GREETER_BUBBLE_DURATION_MS = 3000; // welcome message dissolves after this
function ensureGreeterSpeechBubble() {
  if (greeterSpeechBubble) return greeterSpeechBubble;
  const el = document.createElement('div');
  el.innerHTML = 'Benvenuto in<br>avstudio.ai';
  el.style.cssText = [
    'position:fixed', 'left:0', 'top:0', 'transform-origin:50% 100%', 'transform:translate(-50%, -100%)',
    'padding:7px 13px', 'border:1px solid rgba(143,252,255,0.85)', 'border-radius:9px',
    'background:rgba(0,16,20,0.72)', 'color:#cdfcff', 'text-align:center', 'line-height:1.25',
    "font:600 14px 'Menlo', Consolas, monospace", 'letter-spacing:0.02em', 'white-space:nowrap',
    'pointer-events:none', 'z-index:40', 'box-shadow:0 0 14px rgba(98,247,255,0.45)',
    'text-shadow:0 0 6px rgba(98,247,255,0.6)', 'opacity:0', 'transition:opacity 0.45s ease',
  ].join(';');
  document.body.appendChild(el);
  greeterSpeechBubble = el;
  return el;
}
function updateGreeterSpeechBubble() {
  const greeter = tronRunnerCrowd[TRON_RUNNER_GREETER_INDEX];
  const el = ensureGreeterSpeechBubble();
  if (!greeter || !tronRunnerCrowdGroup.visible || !cityRevealComplete
      || !greeter.bubbleText || !greeter.bubbleUntil || performance.now() > greeter.bubbleUntil) {
    el.style.opacity = '0'; // no active message
    return;
  }
  if (el.__bubbleText !== greeter.bubbleText) {
    el.innerHTML = greeter.bubbleText;
    el.__bubbleText = greeter.bubbleText;
  }
  if (!greeter.headBone) {
    greeter.model?.traverse((object) => {
      if (!greeter.headBone && object.isBone && /head$/i.test(object.name)) greeter.headBone = object;
    });
  }
  if (greeter.headBone) {
    greeter.headBone.getWorldPosition(greeterBubbleWorldScratch);
    greeterBubbleWorldScratch.y += GREETER_BUBBLE_HEAD_GAP;
  } else {
    const pos = greeter.group.position;
    greeterBubbleWorldScratch.set(pos.x, pos.y + GREETER_BUBBLE_HEAD_Y, pos.z);
  }
  greeterBubbleViewScratch.copy(greeterBubbleWorldScratch).applyMatrix4(camera.matrixWorldInverse);
  if (greeterBubbleViewScratch.z > -0.5) { el.style.opacity = '0'; return; } // behind/at camera
  const dist = Math.max(0.5, -greeterBubbleViewScratch.z);
  const scale = THREE.MathUtils.clamp(GREETER_BUBBLE_REF_DIST / dist, 0.45, 1.5) * (greeter.bubbleSizeScale || 1);
  greeterBubbleWorldScratch.project(camera);
  const x = (greeterBubbleWorldScratch.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-greeterBubbleWorldScratch.y * 0.5 + 0.5) * window.innerHeight;
  el.style.left = `${x.toFixed(1)}px`;
  el.style.top = `${y.toFixed(1)}px`;
  el.style.transform = `translate(-50%, -100%) scale(${scale.toFixed(3)})`;
  el.style.opacity = '1';
}

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
    if (updateSecondaryEffects || boundaryErrorPulse > 0.98 || boundaryErrorOldWallMesh.visible) {
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
  domeMesh.position.copy(camera.position);
  if (domeMesh.visible) domeMat.uniforms.uTime.value = now * 0.001 * SKY_ANIMATION_SPEED;
  if (!revealPerformanceCritical) {
    updateCityDepartmentBoards(now);
    updateCityRoleBoard();
    flushHexTileBatchUploads();
    const edgePulseSeconds = now * 0.001;
    for (const material of edgePulseMaterials) {
      if (material.userData.edgePulseTimeUniform) material.userData.edgePulseTimeUniform.value = edgePulseSeconds;
    }
    if (atmosphereParticles) {
      atmosphereParticles.visible = cityRevealComplete;
      if (atmosphereParticleTimeUniform) atmosphereParticleTimeUniform.value = edgePulseSeconds;
    }
    updateGreeterSpeechBubble();
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
  const captureRevealRenderInfo = cityRevealProfileShouldRun() || cityRevealProfileState.running;
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
  recordCityRevealProfileFrame({
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
