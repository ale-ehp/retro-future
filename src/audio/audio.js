import * as THREE from 'three';

export const TRON_SYNTH_MUSIC_ENABLED = true;
export const TRON_SYNTH_MUSIC_BPM = 96;
export const TRON_SYNTH_MUSIC_MASTER_GAIN = 0.14;
export const TRON_SYNTH_MUSIC_LOOKAHEAD_MS = 45;
export const TRON_SYNTH_MUSIC_SCHEDULE_AHEAD = 0.32;
export const TRON_SYNTH_MUSIC_STEP_SEC = 60 / TRON_SYNTH_MUSIC_BPM / 4;
export const TRON_SYNTH_MUSIC_PATTERN_STEPS = 64;

export const TRON_SOUNDTRACK_ENABLED = true;
// Safari/iOS does not support the Ogg container, so the .opus soundtrack never
// loads there — the <audio> element stays silent and the equalizer's analyser
// reads nothing. Pick Opus (smaller) only where the browser can actually play
// Ogg/Opus, otherwise fall back to AAC/M4A (universally supported).
function pickTronSoundtrackUrl() {
  try {
    const probe = document.createElement('audio');
    if (probe.canPlayType && probe.canPlayType('audio/ogg; codecs="opus"')) {
      return 'audio/music/retro-future.opus';
    }
  } catch {}
  return 'audio/music/retro-future.m4a';
}
export const TRON_SOUNDTRACK_URL = pickTronSoundtrackUrl();
export const TRON_SOUNDTRACK_VOLUME = 0.09;
export const TRON_SOUNDTRACK_FADE_IN_SECONDS = 3;
export const TRON_SOUNDTRACK_STOP_FADE_SECONDS = 0.75;
export const TRON_SOUNDTRACK_CROSSFADE_SECONDS = 8;
export const TRON_SOUNDTRACK_INITIAL_START_SECONDS = 0;
export const TRON_SOUNDTRACK_LOOP_START_SECONDS = 30;
export const TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS = 0.12;
export const TRON_SOUNDTRACK_INTRO_FX_REVEAL_STOP_DELAY_MS = 350;
// Measured bass-onset of the beat drop in retro-future.opus (rms lowpass 150Hz,
// 50ms windows: jump -17.8 -> -10.5 dB at 9.35s). The reveal sweep anchors to
// the track clock hitting this position. Re-measure if the track changes.
export const TRON_SOUNDTRACK_BEAT_DROP_SECONDS = 9.35;
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

export function createTronSoundtrackElement(soundtrack) {
  const audio = new Audio(TRON_SOUNDTRACK_URL);
  audio.preload = 'auto';
  audio.loop = false;
  audio.playsInline = true;
  audio.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audio.duration)) soundtrack.duration = audio.duration;
  });
  audio.addEventListener('error', () => {
    const code = audio.error?.code || 0;
    soundtrack.error = `Soundtrack load error ${code}`;
    console.warn('[tron-soundtrack]', soundtrack.error);
  });
  return audio;
}

export function setupTronSoundtrackGraph(deps, ctx) {
  const { soundtrack } = deps;
  if (soundtrack.ready) return true;
  soundtrack.elements = [createTronSoundtrackElement(soundtrack), createTronSoundtrackElement(soundtrack)];
  soundtrack.sources = [];
  soundtrack.gains = [];
  soundtrack.dryGains = [];
  soundtrack.introLofiGains = [];
  soundtrack.introHighpassFilters = [];
  soundtrack.introLowpassFilters = [];
  soundtrack.introLofiShapers = [];
  soundtrack.introDistortionShapers = [];
  soundtrack.introLofiLfos = [];
  soundtrack.introLofiLfoGains = [];
  soundtrack.elements.forEach((audio) => {
    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    const dryGain = ctx.createGain();
    const introLofiGain = ctx.createGain();
    const introHighpassFilter = ctx.createBiquadFilter();
    const introLowpassFilter = ctx.createBiquadFilter();
    const introLofiShaper = ctx.createWaveShaper();
    const introDistortionShaper = ctx.createWaveShaper();
    const introLofiLfo = ctx.createOscillator();
    const introLofiLfoGain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    dryGain.gain.setValueAtTime(1, ctx.currentTime);
    introLofiGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    introHighpassFilter.type = 'highpass';
    introHighpassFilter.frequency.setValueAtTime(TRON_SOUNDTRACK_INTRO_FX_DEFAULTS.highpassHz, ctx.currentTime);
    introHighpassFilter.Q.setValueAtTime(0.72, ctx.currentTime);
    introLowpassFilter.type = 'lowpass';
    introLowpassFilter.frequency.setValueAtTime(TRON_SOUNDTRACK_INTRO_FX_DEFAULTS.lowpassHz, ctx.currentTime);
    introLowpassFilter.Q.setValueAtTime(0.72, ctx.currentTime);
    introLofiShaper.curve = createTronIntroBitcrushCurve(soundtrack.introFx.bitDepth, soundtrack.introFx.crusher, soundtrack);
    introLofiShaper.oversample = 'none';
    introDistortionShaper.curve = createTronIntroDistortionCurve(soundtrack.introFx.distortion, soundtrack);
    introDistortionShaper.oversample = 'none';
    introLofiLfo.type = 'sine';
    introLofiLfo.frequency.setValueAtTime(TRON_SOUNDTRACK_INTRO_FX_WOBBLE_RATE_HZ, ctx.currentTime);
    introLofiLfoGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    introLofiLfo.connect(introLofiLfoGain).connect(introLowpassFilter.frequency);
    introLofiLfo.start();
    source.connect(dryGain).connect(gain);
    source.connect(introLofiShaper).connect(introHighpassFilter).connect(introLowpassFilter).connect(introDistortionShaper).connect(introLofiGain).connect(gain);
    gain.connect(ctx.destination);
    soundtrack.sources.push(source);
    soundtrack.gains.push(gain);
    soundtrack.dryGains.push(dryGain);
    soundtrack.introLofiGains.push(introLofiGain);
    soundtrack.introHighpassFilters.push(introHighpassFilter);
    soundtrack.introLowpassFilters.push(introLowpassFilter);
    soundtrack.introLofiShapers.push(introLofiShaper);
    soundtrack.introDistortionShapers.push(introDistortionShaper);
    soundtrack.introLofiLfos.push(introLofiLfo);
    soundtrack.introLofiLfoGains.push(introLofiLfoGain);
    audio.load();
  });
  const noiseSource = ctx.createBufferSource();
  const noiseFilter = ctx.createBiquadFilter();
  const noiseGain = ctx.createGain();
  noiseSource.buffer = createTronIntroNoiseBuffer(ctx);
  noiseSource.loop = true;
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(3200, ctx.currentTime);
  noiseFilter.Q.setValueAtTime(0.8, ctx.currentTime);
  noiseGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  noiseSource.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
  noiseSource.start();
  soundtrack.introNoiseSource = noiseSource;
  soundtrack.introNoiseFilter = noiseFilter;
  soundtrack.introNoiseGain = noiseGain;
  soundtrack.ready = true;
  applyTronSoundtrackIntroLofiMix(soundtrack, ctx, soundtrack.introLofiActive, 0.01);
  return true;
}

export function tronSoundtrackLoopStart(soundtrack) {
  const duration = soundtrack.duration || soundtrack.elements[soundtrack.activeIndex]?.duration || 0;
  const safeMax = Math.max(0, duration - TRON_SOUNDTRACK_CROSSFADE_SECONDS - 1);
  return Math.min(TRON_SOUNDTRACK_LOOP_START_SECONDS, safeMax);
}

export function pauseTronSoundtrackElement(soundtrack, index) {
  const audio = soundtrack.elements[index];
  if (!audio) return;
  audio.pause();
  setAudioCurrentTime(audio, tronSoundtrackLoopStart(soundtrack));
}

export function startTronSoundtrackElement(deps, ctx, index, startAt, fadeSeconds, volume) {
  const { soundtrack } = deps;
  const audio = soundtrack.elements[index];
  const gain = soundtrack.gains[index];
  if (!audio || !gain) return false;
  const duration = Number.isFinite(audio.duration) ? audio.duration : soundtrack.duration;
  const safeStart = Number.isFinite(duration) && duration > 0
    ? Math.min(Math.max(0, startAt), Math.max(0, duration - 0.25))
    : Math.max(0, startAt);
  setAudioCurrentTime(audio, safeStart);
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  const playPromise = audio.play();
  if (playPromise?.catch) {
    playPromise.catch((error) => {
      soundtrack.error = error?.message || String(error);
      console.warn('[tron-soundtrack]', soundtrack.error);
    });
  }
  rampGain(ctx, gain, volume, fadeSeconds, 0.0001);
  soundtrack.lastStartAt = safeStart;
  return true;
}

export function crossfadeTronSoundtrack(deps) {
  const { soundtrack, getCtx } = deps;
  const ctx = getCtx();
  if (!soundtrack.playing || soundtrack.crossfading || !ctx) return false;
  const activeIndex = soundtrack.activeIndex;
  const nextIndex = activeIndex === 0 ? 1 : 0;
  const activeGain = soundtrack.gains[activeIndex];
  const loopStart = tronSoundtrackLoopStart(soundtrack);
  soundtrack.crossfading = true;
  startTronSoundtrackElement(deps, ctx, nextIndex, loopStart, TRON_SOUNDTRACK_CROSSFADE_SECONDS, soundtrack.targetVolume);
  rampGain(ctx, activeGain, 0.0001, TRON_SOUNDTRACK_CROSSFADE_SECONDS);
  window.setTimeout(() => {
    pauseTronSoundtrackElement(soundtrack, activeIndex);
    soundtrack.activeIndex = nextIndex;
    soundtrack.crossfading = false;
    soundtrack.loopCount += 1;
    soundtrack.lastLoopAt = performance.now();
  }, Math.ceil(TRON_SOUNDTRACK_CROSSFADE_SECONDS * 1000) + 80);
  return true;
}

export function monitorTronSoundtrackLoop(deps) {
  const { soundtrack } = deps;
  if (!soundtrack.playing || soundtrack.crossfading) return;
  const active = soundtrack.elements[soundtrack.activeIndex];
  const duration = Number.isFinite(active?.duration) ? active.duration : soundtrack.duration;
  if (!active || !Number.isFinite(duration) || duration <= TRON_SOUNDTRACK_CROSSFADE_SECONDS + 2) return;
  soundtrack.duration = duration;
  if (active.currentTime >= duration - TRON_SOUNDTRACK_CROSSFADE_SECONDS) {
    crossfadeTronSoundtrack(deps);
  }
}

// iOS/Safari autoplay: play() and the AudioContext must be unlocked inside a
// user gesture. When the real start is deferred (mobile rotate gate starts the
// soundtrack from an orientationchange handler, which carries no activation),
// call this from the tap so the context is resumed and both media elements are
// blessed with a muted play/pause while activation is still valid.
export function primeTronSoundtrackForGesture(deps) {
  const { soundtrack, ensureCtx } = deps;
  if (!TRON_SOUNDTRACK_ENABLED) return false;
  const ctx = ensureCtx();
  if (!ctx) return false;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  setupTronSoundtrackGraph(deps, ctx);
  if (soundtrack.primed) return true;
  soundtrack.primed = true;
  // Gain nodes sit at 0.0001 until the real start ramps them, so this prime
  // play is silent — no mute juggling needed. settle() re-pauses only if the
  // real start hasn't taken over yet (guards a fast rotate-then-start race).
  soundtrack.elements.forEach((audio) => {
    if (!audio) return;
    try {
      const settle = () => {
        if (soundtrack.playing) return;
        try { audio.pause(); setAudioCurrentTime(audio, 0); } catch {}
      };
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === 'function') playPromise.then(settle, () => {});
      else settle();
    } catch {}
  });
  return true;
}

export function startTronFileSoundtrack(deps, source = 'manual', options = {}) {
  const { soundtrack, ensureCtx } = deps;
  if (!TRON_SOUNDTRACK_ENABLED || soundtrack.playing) return Boolean(soundtrack.playing);
  const ctx = ensureCtx();
  if (!ctx) {
    soundtrack.error = 'AudioContext unavailable';
    return false;
  }
  setupTronSoundtrackGraph(deps, ctx);
  soundtrack.playing = true;
  soundtrack.startedAt = performance.now();
  soundtrack.startSource = source;
  soundtrack.activeIndex = 0;
  soundtrack.crossfading = false;
  soundtrack.loopCount = 0;
  soundtrack.error = '';
  soundtrack.gains.forEach((gain) => gain.gain.setValueAtTime(0.0001, ctx.currentTime));
  // introLofi option overrides the legacy source-prefix heuristic: the welcome
  // flow now asks for the muffled intro explicitly (released on the beat drop).
  const wantIntroLofi = options.introLofi ?? !String(source).startsWith('welcome-');
  if (soundtrack.introFx.enabled && wantIntroLofi) setTronSoundtrackIntroLofi(soundtrack, ctx, true, 0.01);
  startTronSoundtrackElement(deps, ctx, 0, TRON_SOUNDTRACK_INITIAL_START_SECONDS, TRON_SOUNDTRACK_FADE_IN_SECONDS, soundtrack.targetVolume);
  if (soundtrack.timer) window.clearInterval(soundtrack.timer);
  soundtrack.timer = window.setInterval(() => monitorTronSoundtrackLoop(deps), 250);
  return true;
}

export function stopTronFileSoundtrack(deps, fadeSeconds = TRON_SOUNDTRACK_STOP_FADE_SECONDS) {
  const { soundtrack, getCtx } = deps;
  const ctx = getCtx();
  if (!soundtrack.playing) return false;
  if (soundtrack.timer) {
    window.clearInterval(soundtrack.timer);
    soundtrack.timer = 0;
  }
  soundtrack.playing = false;
  soundtrack.crossfading = false;
  setTronSoundtrackIntroLofi(soundtrack, ctx, false, fadeSeconds);
  soundtrack.gains.forEach((gain) => rampGain(ctx, gain, 0.0001, fadeSeconds));
  window.setTimeout(() => {
    soundtrack.elements.forEach((audio) => {
      audio.pause();
      setAudioCurrentTime(audio, 0);
    });
  }, Math.ceil(fadeSeconds * 1000) + 80);
  return true;
}

export function setTronFileSoundtrackVolume(deps, value = TRON_SOUNDTRACK_VOLUME) {
  const { soundtrack, getCtx } = deps;
  const ctx = getCtx();
  const next = THREE.MathUtils.clamp(Number(value), 0, 1.2);
  if (!Number.isFinite(next)) return false;
  soundtrack.targetVolume = next;
  if (!soundtrack.playing) return true;
  const activeGain = soundtrack.gains[soundtrack.activeIndex];
  const inactiveGain = soundtrack.gains[soundtrack.activeIndex === 0 ? 1 : 0];
  rampGain(ctx, activeGain, next, 0.08);
  if (!soundtrack.crossfading) rampGain(ctx, inactiveGain, 0.0001, 0.08);
  return true;
}
