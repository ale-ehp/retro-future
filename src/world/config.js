export const CITY_REVEAL_DEFAULT_DELAY_MS = 8800;
export const CITY_REVEAL_DEFAULT_FADE_MS = 1500;
export const CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS = 0;
export const CITY_REVEAL_SWEEP_MARGIN_Z = 36;
export const CITY_REVEAL_SWEEP_MODE = 'vertical-45';
export const CITY_REVEAL_BACKPLATE_SWEEP_PORTION = 0.08;
export const CITY_REVEAL_MAX_SKY_BACKPLATE_OPACITY = 0.28;
export const CITY_REVEAL_RENDER_ORDER = 'wireframe-under-real-city';
export const FIXED_CAMERA_FOV = 70;
export const CITY_REVEAL_PROFILE_SAMPLE_MS = 500;
export const CITY_REVEAL_PROFILE_MAX_SAMPLES = 80;

export const HEX_ROAD_UPDATE_FRAME_STRIDE = 2;
export const MAX_HEX_ROAD_ACCUMULATED_DT = 0.1;
export const MAX_RENDER_PIXEL_RATIO = 2;
export const HD_READY_RENDER_WIDTH = 1280;
export const HD_READY_RENDER_HEIGHT = 720;
export const FULL_HD_RENDER_WIDTH = 1920;
export const FULL_HD_RENDER_HEIGHT = 1080;
export const MIN_DYNAMIC_PIXEL_RATIO = 0.25;
export const MIN_DYNAMIC_BLOOM_SCALE = 0.10;
export const MIN_DYNAMIC_QUALITY_SCALE = 0.25;
export const BLOOM_RESOLUTION_CAP = 0.28;
export const BLOOM_OPTIMIZED_ACTIVE_MIPS = 3;
export const BLOOM_OPTIMIZED_UPDATE_STRIDE = 2;
export const BLOOM_TEMPORAL_MOVE_EPS_SQ = 0.0025;
export const BLOOM_TEMPORAL_ROTATE_EPS = 0.000003;
export const BLOOM_BYPASS_STRENGTH = 0.015;
export const MIN_BLOOM_TARGET_SIZE = 96;
export const CITY_REVEAL_PERFORMANCE_PIXEL_RATIO_CAP = 1.5;
export const MOBILE_PERFORMANCE_QUERY = '(max-width: 760px), (hover: none), (pointer: coarse)';
export const MOBILE_PERFORMANCE_RENDER_SCALE_CAP = 1;
export const MOBILE_PERFORMANCE_PIXEL_RATIO_CAP = 1;
export const MOBILE_PERFORMANCE_BLOOM_SCALE_CAP = 0.14;
export const FSR_PRESETS = Object.freeze({
  custom: { label: 'Custom', enabled: false, scale: 1 },
  quality: { label: 'Quality 85%', enabled: true, scale: 0.85 },
  balanced: { label: 'Balanced 75%', enabled: true, scale: 0.75 },
  performance: { label: 'Performance 65%', enabled: true, scale: 0.65 },
  off: { label: 'Off / full-res', enabled: false, scale: 1 },
});
export const FSR_BENCHMARK_PRESET_KEYS = Object.freeze(['off', 'quality', 'balanced', 'performance']);
export const FSR_MANUAL_CONTROL_IDS = new Set(['fsr-upscale-enabled', 'fsr-internal-scale']);
export const SECONDARY_EFFECT_UPDATE_STRIDE = 2;
