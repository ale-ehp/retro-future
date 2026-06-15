export const TRON_SYNTH_MUSIC_ENABLED = true;
export const TRON_SYNTH_MUSIC_BPM = 96;
export const TRON_SYNTH_MUSIC_MASTER_GAIN = 0.14;
export const TRON_SYNTH_MUSIC_LOOKAHEAD_MS = 45;
export const TRON_SYNTH_MUSIC_SCHEDULE_AHEAD = 0.32;
export const TRON_SYNTH_MUSIC_STEP_SEC = 60 / TRON_SYNTH_MUSIC_BPM / 4;
export const TRON_SYNTH_MUSIC_PATTERN_STEPS = 64;

export const TRON_SOUNDTRACK_ENABLED = true;
export const TRON_SOUNDTRACK_URL = 'audio/music/retro-future.opus';
export const TRON_SOUNDTRACK_VOLUME = 0.09;
export const TRON_SOUNDTRACK_FADE_IN_SECONDS = 3;
export const TRON_SOUNDTRACK_STOP_FADE_SECONDS = 0.75;
export const TRON_SOUNDTRACK_CROSSFADE_SECONDS = 8;
export const TRON_SOUNDTRACK_INITIAL_START_SECONDS = 0;
export const TRON_SOUNDTRACK_LOOP_START_SECONDS = 30;
export const TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS = 0.12;
export const TRON_SOUNDTRACK_INTRO_FX_REVEAL_STOP_DELAY_MS = 350;
export const TRON_SOUNDTRACK_INTRO_FX_CURVE_SIZE = 4096;
export const TRON_SOUNDTRACK_INTRO_FX_WOBBLE_RATE_HZ = 7.5;
export const TRON_SOUNDTRACK_INTRO_FX_MAX_WOBBLE_DEPTH_HZ = 1600;
export const TRON_SOUNDTRACK_INTRO_FX_MAX_NOISE_GAIN = 0.055;
export const TRON_SOUNDTRACK_INTRO_FX_DEFAULTS = Object.freeze({
  enabled: true,
  mix: 1,
  crusher: 0,
  bitDepth: 8,
  highpassHz: 4000,
  lowpassHz: 20000,
  distortion: 0,
  telephone: 0,
  wobble: 0,
  noise: 0,
});
