import * as THREE from 'three';

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
  enabled: false,
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

export function createTronSynthNoiseBuffer(ctx) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * 0.45));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    last = last * 0.72 + (Math.random() * 2 - 1) * 0.28;
    channel[i] = last;
  }
  return buffer;
}

export function createTronIntroNoiseBuffer(ctx) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * 1.5));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    last = last * 0.56 + (Math.random() * 2 - 1) * 0.44;
    channel[i] = last;
  }
  return buffer;
}

export function createTronIntroBitcrushCurve(bitDepth, crusher, soundtrack) {
  const safeBits = THREE.MathUtils.clamp(Math.round(bitDepth), 2, 16);
  const safeCrusher = THREE.MathUtils.clamp(Number(crusher) || 0, 0, 1);
  const key = `${safeBits}:${safeCrusher.toFixed(3)}`;
  if (soundtrack.introBitcrushCurveKey === key && soundtrack.introBitcrushCurve) return soundtrack.introBitcrushCurve;
  const levels = Math.max(2, 2 ** safeBits);
  const curve = new Float32Array(TRON_SOUNDTRACK_INTRO_FX_CURVE_SIZE);
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    const crushed = Math.round(x * levels) / levels;
    curve[i] = THREE.MathUtils.lerp(x, crushed, safeCrusher);
  }
  soundtrack.introBitcrushCurve = curve;
  soundtrack.introBitcrushCurveKey = key;
  return curve;
}

export function createTronIntroDistortionCurve(amount, soundtrack) {
  const safeAmount = THREE.MathUtils.clamp(Number(amount) || 0, 0, 1);
  const key = safeAmount.toFixed(3);
  if (soundtrack.introDistortionCurveKey === key && soundtrack.introDistortionCurve) return soundtrack.introDistortionCurve;
  const drive = 1 + safeAmount * 44;
  const curve = new Float32Array(TRON_SOUNDTRACK_INTRO_FX_CURVE_SIZE);
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    const shaped = (Math.atan(x * drive) / Math.atan(drive));
    curve[i] = THREE.MathUtils.lerp(x, shaped, safeAmount);
  }
  soundtrack.introDistortionCurve = curve;
  soundtrack.introDistortionCurveKey = key;
  return curve;
}

export function setAudioParamSmooth(ctx, param, value, seconds = 0.04) {
  if (!ctx || !param) return;
  const now = ctx.currentTime;
  const safeValue = Math.max(0.0001, Number(value) || 0.0001);
  param.cancelScheduledValues(now);
  param.setValueAtTime(Math.max(0.0001, param.value || safeValue), now);
  param.linearRampToValueAtTime(safeValue, now + Math.max(0.01, seconds));
}

export function setAudioCurrentTime(audio, value) {
  try {
    audio.currentTime = Math.max(0, value);
  } catch {}
}

export function rampGain(ctx, gainNode, value, seconds, fromValue = null) {
  if (!ctx || !gainNode) return;
  const now = ctx.currentTime;
  const startValue = fromValue === null
    ? Math.max(0.0001, gainNode.gain.value || 0.0001)
    : Math.max(0.0001, Number(fromValue) || 0.0001);
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(startValue, now);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, value), now + Math.max(0.01, seconds));
}

export function tronIntroFxEffectiveFilters(soundtrack) {
  const fx = soundtrack.introFx;
  const telephone = THREE.MathUtils.clamp(fx.telephone, 0, 1);
  const telephoneHighpass = THREE.MathUtils.lerp(20, 520, telephone);
  const telephoneLowpass = THREE.MathUtils.lerp(20000, 3300, telephone);
  const highpassHz = Math.max(20, fx.highpassHz, telephoneHighpass);
  const lowpassHz = Math.max(highpassHz + 100, Math.min(20000, fx.lowpassHz, telephoneLowpass));
  return {
    highpassHz,
    lowpassHz,
    q: 0.72 + telephone * 1.5,
  };
}

export function syncTronIntroFxNodeSettings(soundtrack, ctx, fadeSeconds = 0.04) {
  const fx = soundtrack.introFx;
  const filters = tronIntroFxEffectiveFilters(soundtrack);
  soundtrack.introLofiShapers.forEach((shaper) => {
    shaper.curve = createTronIntroBitcrushCurve(fx.bitDepth, fx.crusher, soundtrack);
  });
  soundtrack.introDistortionShapers.forEach((shaper) => {
    shaper.curve = createTronIntroDistortionCurve(fx.distortion, soundtrack);
  });
  soundtrack.introHighpassFilters.forEach((filter) => {
    filter.Q.setValueAtTime(filters.q, ctx.currentTime);
    setAudioParamSmooth(ctx, filter.frequency, filters.highpassHz, fadeSeconds);
  });
  soundtrack.introLowpassFilters.forEach((filter) => {
    filter.Q.setValueAtTime(filters.q, ctx.currentTime);
    setAudioParamSmooth(ctx, filter.frequency, filters.lowpassHz, fadeSeconds);
  });
  if (soundtrack.introNoiseFilter) {
    setAudioParamSmooth(ctx, soundtrack.introNoiseFilter.frequency, Math.min(9000, filters.lowpassHz), fadeSeconds);
  }
}

export function applyTronSoundtrackIntroLofiMix(soundtrack, ctx, active, fadeSeconds = TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS) {
  const fx = soundtrack.introFx;
  const fxActive = Boolean(active && fx.enabled);
  const mix = fxActive ? THREE.MathUtils.clamp(fx.mix, 0, 1) : 0;
  const dry = 1 - mix;
  const wet = mix;
  const lfoDepth = fxActive ? fx.wobble * TRON_SOUNDTRACK_INTRO_FX_MAX_WOBBLE_DEPTH_HZ : 0.0001;
  const noiseGain = fxActive ? fx.noise * TRON_SOUNDTRACK_INTRO_FX_MAX_NOISE_GAIN : 0.0001;
  const mutedStart = fxActive ? null : 0.0001;
  soundtrack.dryGains.forEach((gain) => rampGain(ctx, gain, dry, fadeSeconds));
  soundtrack.introLofiGains.forEach((gain) => rampGain(ctx, gain, wet, fadeSeconds, mutedStart));
  soundtrack.introLofiLfoGains.forEach((gain) => rampGain(ctx, gain, lfoDepth, fadeSeconds, mutedStart));
  if (soundtrack.introNoiseGain) rampGain(ctx, soundtrack.introNoiseGain, noiseGain, fadeSeconds, mutedStart);
  if (soundtrack.ready) syncTronIntroFxNodeSettings(soundtrack, ctx, fadeSeconds);
}

export function setTronSoundtrackIntroLofi(soundtrack, ctx, active, fadeSeconds = TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS, stoppedByReveal = false) {
  const next = Boolean(active);
  if (next && soundtrack.introLofiRevealStopTimer) {
    window.clearTimeout(soundtrack.introLofiRevealStopTimer);
    soundtrack.introLofiRevealStopTimer = 0;
  }
  soundtrack.introLofiActive = next;
  if (next) {
    soundtrack.introLofiStoppedByReveal = false;
    soundtrack.introLofiStartedAt = performance.now();
  } else {
    soundtrack.introLofiStoppedByReveal = Boolean(stoppedByReveal);
    soundtrack.introLofiStoppedAt = performance.now();
  }
  if (!soundtrack.ready) return false;
  applyTronSoundtrackIntroLofiMix(soundtrack, ctx, next, fadeSeconds);
  return true;
}

export function scheduleTronSoundtrackIntroLofiStopForReveal(soundtrack, getCtx, delayMs = TRON_SOUNDTRACK_INTRO_FX_REVEAL_STOP_DELAY_MS) {
  if (!soundtrack.introLofiActive || soundtrack.introLofiStoppedByReveal || soundtrack.introLofiRevealStopTimer) return false;
  const safeDelay = Math.max(0, Math.round(Number(delayMs) || 0));
  soundtrack.introLofiRevealStopTimer = window.setTimeout(() => {
    soundtrack.introLofiRevealStopTimer = 0;
    stopTronSoundtrackIntroLofiForReveal(soundtrack, getCtx());
  }, safeDelay);
  return true;
}

export function stopTronSoundtrackIntroLofiForReveal(soundtrack, ctx) {
  if (soundtrack.introLofiRevealStopTimer) {
    window.clearTimeout(soundtrack.introLofiRevealStopTimer);
    soundtrack.introLofiRevealStopTimer = 0;
  }
  if (!soundtrack.introLofiActive) return false;
  return setTronSoundtrackIntroLofi(soundtrack, ctx, false, TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS, true);
}
