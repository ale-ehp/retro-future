export const LAB_EQUALIZER_ENABLED = true;
export const LAB_EQUALIZER_BAR_COUNT = 16;
export const LAB_EQUALIZER_SEGMENT_ROWS = 22;
export const LAB_EQUALIZER_BOARD_WIDTH = 122;
export const LAB_EQUALIZER_BOARD_HEIGHT = 58;
export const LAB_EQUALIZER_SCENE_SCALE = 1;
export const LAB_EQUALIZER_WORLD_WIDTH = LAB_EQUALIZER_BOARD_WIDTH * LAB_EQUALIZER_SCENE_SCALE;
export const LAB_EQUALIZER_WORLD_HEIGHT = LAB_EQUALIZER_BOARD_HEIGHT * LAB_EQUALIZER_SCENE_SCALE;
export const LAB_EQUALIZER_CANVAS_WIDTH = 768;
export const LAB_EQUALIZER_CANVAS_HEIGHT = 384;
export const LAB_EQUALIZER_GROUP_RENDER_ORDER = 18;
export const LAB_EQUALIZER_PANEL_RENDER_ORDER = 18;
export const LAB_EQUALIZER_DISPLAY_RENDER_ORDER = 19;
export const LAB_EQUALIZER_TEXTURE_INTERVAL_MS = 1000 / 20;
export const LAB_EQUALIZER_TEXTURE_ADAPTIVE_SOFT_INTERVAL_MS = 1000 / 5;
export const LAB_EQUALIZER_TEXTURE_ADAPTIVE_HARD_INTERVAL_MS = 1000 / 4;
export const LAB_EQUALIZER_AUDIO_SAMPLE_INTERVAL_MS = 1000 / 30;
export const LAB_EQUALIZER_OFFSCREEN_SAMPLE_INTERVAL_MS = 1000;
export const LAB_EQUALIZER_AUDIO_KICK_SAMPLE_INTERVAL_MS = 1000 / 8;
export const LAB_EQUALIZER_IDLE_SAMPLE_INTERVAL_MS = 250;
export const LAB_EQUALIZER_OFFSCREEN_TEXTURE_INTERVAL_MS = 1000 / 4;
export const LAB_EQUALIZER_VISIBILITY_INTERVAL_MS = 1000 / 12;
export const LAB_EQUALIZER_POSE_INTERVAL_MS = 250;
export const LAB_EQUALIZER_GRAPH_INTERVAL_MS = 500;
export const LAB_EQUALIZER_STATIC_TEXTURE_REFRESH_MS = 500;
export const LAB_EQUALIZER_START_WALL_INSET_Y = 6;
export const LAB_EQUALIZER_VERTICAL_OFFSET = 0;
export const LAB_EQUALIZER_MIN_HZ = 35;
export const LAB_EQUALIZER_MAX_HZ = 15500;
export const LAB_EQUALIZER_FFT_SIZE = 4096;
export const LAB_EQUALIZER_ANALYSER_MIN_DB = -96;
export const LAB_EQUALIZER_ANALYSER_MAX_DB = -6;
export const LAB_EQUALIZER_ANALYSER_SMOOTHING = 0.28;
export const LAB_EQUALIZER_LEVEL_DB_FLOOR = -88;
export const LAB_EQUALIZER_LEVEL_DB_CEILING = -18;
export const LAB_EQUALIZER_RELATIVE_DB_RANGE = 42;
export const LAB_EQUALIZER_LEVEL_GAMMA = 1.55;
export const LAB_EQUALIZER_PEAK_HOLD_SECONDS = 0.14;
export const LAB_EQUALIZER_PEAK_MIN_FALL_ROWS_PER_SEC = 1.8;
export const LAB_EQUALIZER_PEAK_MAX_FALL_ROWS_PER_SEC = 52;
export const LAB_EQUALIZER_BASS_BAND_COUNT = 4;
export const LAB_EQUALIZER_VISIBILITY_RADIUS = Math.hypot(LAB_EQUALIZER_WORLD_WIDTH, LAB_EQUALIZER_WORLD_HEIGHT) * 0.55;

export const LAB_EQUALIZER_PULSE_CONTROLS = Object.freeze([
  { stateKey: 'pulseMaster', inputKey: 'labEqPulseMaster', outputKey: 'labEqPulseMasterVal', fallback: 1.44 },
  { stateKey: 'pulseBlue', inputKey: 'labEqPulseBlue', outputKey: 'labEqPulseBlueVal', fallback: 2.89 },
  { stateKey: 'pulseCyan', inputKey: 'labEqPulseCyan', outputKey: 'labEqPulseCyanVal', fallback: 1.51 },
  { stateKey: 'pulseMagenta', inputKey: 'labEqPulseMagenta', outputKey: 'labEqPulseMagentaVal', fallback: 2.46 },
  { stateKey: 'pulseRed', inputKey: 'labEqPulseRed', outputKey: 'labEqPulseRedVal', fallback: 1.74 },
  { stateKey: 'pulseYellow', inputKey: 'labEqPulseYellow', outputKey: 'labEqPulseYellowVal', fallback: 0 },
  { stateKey: 'pulseGreen', inputKey: 'labEqPulseGreen', outputKey: 'labEqPulseGreenVal', fallback: 1.49 },
]);
