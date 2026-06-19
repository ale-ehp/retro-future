import * as THREE from 'three';
import {
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
} from './characters.js';
import {
  createTronRunnerBeatPulseRuntimeStats,
  createTronRunnerBeatPulseState,
} from './runner-state.js';

export function createTronRunnerBeatPulseRuntime({
  runnerState,
  runnerParts,
  getCrowd,
  getSoundtrack,
  getRevealComplete,
  labEqualizerAnalyserPresent,
  labEqualizerLastSampleTime,
  labEqualizerAnalyserSampleReady,
  getLabEqualizerState,
}) {
  const state = createTronRunnerBeatPulseState();
  const stats = createTronRunnerBeatPulseRuntimeStats();
  const controls = {
    enabled: TRON_RUNNER_BEAT_PULSE_ENABLED,
    bpm: TRON_RUNNER_BEAT_PULSE_BPM,
    offset: TRON_RUNNER_BEAT_PULSE_OFFSET_SECONDS,
    intensity: TRON_RUNNER_BEAT_PULSE_INTENSITY,
    decay: TRON_RUNNER_BEAT_PULSE_DECAY,
    division: TRON_RUNNER_BEAT_PULSE_DIVISION,
  };
  const valueScratch = {
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

  function soundtrackTimeSeconds() {
    const soundtrack = getSoundtrack();
    const active = soundtrack.elements?.[soundtrack.activeIndex];
    const time = Number(active?.currentTime);
    return Number.isFinite(time) ? time : 0;
  }

  function setState(nextState) {
    Object.assign(state, nextState);
    // Mutate the existing beatPulse object in place (allocated once in createTronRunnerState)
    // instead of reassigning a fresh literal every frame; values stay byte-identical.
    const beat = runnerState.beatPulse || (runnerState.beatPulse = {});
    beat.enabled = controls.enabled;
    beat.bpm = controls.bpm;
    beat.offsetSeconds = controls.offset;
    beat.intensity = controls.intensity;
    beat.decay = controls.decay;
    beat.division = controls.division;
    beat.value = Number(state.value.toFixed(3));
    beat.multiplier = Number(state.multiplier.toFixed(3));
    beat.phase = Number(state.phase.toFixed(3));
    beat.beatIndex = state.beatIndex;
    beat.audioTime = Number(state.audioTime.toFixed(3));
    beat.active = state.active;
    beat.source = state.source || 'bpm';
    beat.kickPulse = Number((state.kickPulse || 0).toFixed(3));
    beat.bassPulse = Number((state.bassPulse || 0).toFixed(3));
    beat.bassEnergy = Number((state.bassEnergy || 0).toFixed(3));
    beat.lowBandDriven = Boolean(state.lowBandDriven);
    beat.analyserReady = Boolean(state.analyserReady);
    beat.sampleAgeMs = Number.isFinite(state.sampleAgeMs)
      ? Number(state.sampleAgeMs.toFixed(1))
      : null;
    beat.materialUpdateOptimized = stats.materialUpdateOptimized;
    beat.materialPasses = stats.materialPasses;
    beat.materialSkips = stats.materialSkips;
    beat.materialCount = stats.materialCount;
    beat.baseRevision = stats.baseRevision;
  }

  function value(audioTime = soundtrackTimeSeconds()) {
    // Reused scratch: consumed synchronously by update (Object.assign + reads).
    const out = valueScratch;
    const soundtrack = getSoundtrack();
    const labEqualizerState = getLabEqualizerState();
    if (!controls.enabled || !soundtrack.playing || !getRevealComplete()) {
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
    const lastSampleTime = labEqualizerLastSampleTime();
    const sampleAgeMs = Number.isFinite(lastSampleTime) ? now - lastSampleTime : Infinity;
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
      const beatValue = THREE.MathUtils.clamp(kickPulse * 1.08 + bassBody, 0, 1);
      const multiplier = THREE.MathUtils.clamp(
        1 + beatValue * Math.max(0, controls.intensity),
        1,
        TRON_RUNNER_BEAT_PULSE_MAX_MULTIPLIER
      );
      out.value = beatValue;
      out.multiplier = multiplier;
      out.phase = 0;
      out.beatIndex = labEqualizerState.sampleCount;
      out.audioTime = audioTime;
      out.active = true;
      out.source = 'audio-bass-kick';
      out.kickPulse = kickPulse;
      out.bassPulse = beatValue;
      out.bassEnergy = bassEnergy;
      out.lowBandDriven = TRON_RUNNER_BEAT_PULSE_LOW_BAND_ENABLED;
      out.analyserReady = analyserReady;
      out.sampleAgeMs = sampleAgeMs;
      return out;
    }
    const bpm = Math.max(1, controls.bpm);
    const division = Math.max(0.05, controls.division);
    const elapsedBeats = Math.max(0, (audioTime - controls.offset) * bpm / 60 * division);
    const beatIndex = Math.floor(elapsedBeats);
    const phase = elapsedBeats - beatIndex;
    const beatValue = THREE.MathUtils.clamp(Math.exp(-phase * Math.max(0.1, controls.decay)), 0, 1);
    const multiplier = THREE.MathUtils.clamp(
      1 + beatValue * Math.max(0, controls.intensity),
      1,
      TRON_RUNNER_BEAT_PULSE_MAX_MULTIPLIER
    );
    out.value = beatValue;
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

  function applyToMaterial(material, multiplier) {
    if (!material || !Number.isFinite(material.emissiveIntensity)) return;
    const base = Number.isFinite(material.userData?.tronRunnerBaseEmissiveIntensity)
      ? material.userData.tronRunnerBaseEmissiveIntensity
      : material.emissiveIntensity;
    const next = THREE.MathUtils.clamp(base * multiplier, 0, 24);
    if (Math.abs(material.emissiveIntensity - next) < 0.0005) return;
    material.emissiveIntensity = next;
  }

  function materialCount() {
    let crowdMaterialCount = 0;
    for (const member of getCrowd()) {
      crowdMaterialCount += member.materials?.length || 0;
    }
    stats.mainMaterialCount = runnerParts.materials.length;
    stats.crowdMaterialCount = crowdMaterialCount;
    stats.materialCount = runnerParts.materials.length + crowdMaterialCount;
    return stats.materialCount;
  }

  function shouldSkipMaterialUpdate(nextState, count) {
    if (!TRON_RUNNER_BEAT_PULSE_MATERIAL_SKIP_ENABLED) return false;
    if (count !== stats.lastAppliedMaterialCount) return false;
    if (stats.baseRevision !== stats.lastAppliedBaseRevision) return false;
    if (nextState.active !== stats.lastAppliedActive) return false;
    if ((nextState.source || '') !== stats.lastAppliedSource) return false;
    if (nextState.beatIndex !== stats.lastAppliedBeatIndex) return false;
    return Math.abs(nextState.multiplier - stats.lastAppliedMultiplier) < TRON_RUNNER_BEAT_PULSE_MATERIAL_EPS;
  }

  function recordMaterialPass(nextState, count) {
    stats.materialPasses += 1;
    stats.lastAppliedMultiplier = nextState.multiplier;
    stats.lastAppliedBeatIndex = nextState.beatIndex;
    stats.lastAppliedActive = nextState.active;
    stats.lastAppliedSource = nextState.source || '';
    stats.lastAppliedMaterialCount = count;
    stats.lastAppliedBaseRevision = stats.baseRevision;
  }

  function update() {
    const nextState = value();
    const count = materialCount();
    if (shouldSkipMaterialUpdate(nextState, count)) {
      stats.materialSkips += 1;
      setState(nextState);
      return;
    }
    recordMaterialPass(nextState, count);
    const multiplier = nextState.multiplier;
    for (const material of runnerParts.materials) {
      applyToMaterial(material, multiplier);
    }
    for (const member of getCrowd()) {
      const materials = member.materials?.length ? member.materials : [];
      for (const material of materials) {
        applyToMaterial(material, multiplier);
      }
    }
    setState(nextState);
  }

  function setControls(nextControls) {
    if (Object.prototype.hasOwnProperty.call(nextControls, 'enabled')) controls.enabled = Boolean(nextControls.enabled);
    if (Number.isFinite(nextControls.bpm)) controls.bpm = nextControls.bpm;
    if (Number.isFinite(nextControls.offset)) controls.offset = nextControls.offset;
    if (Number.isFinite(nextControls.intensity)) controls.intensity = nextControls.intensity;
    if (Number.isFinite(nextControls.decay)) controls.decay = nextControls.decay;
    if (Number.isFinite(nextControls.division)) controls.division = nextControls.division;
  }

  function controlValues() {
    return { ...controls };
  }

  function markBaseChanged() {
    stats.baseRevision += 1;
  }

  return {
    state,
    stats,
    setControls,
    controlValues,
    update,
    markBaseChanged,
  };
}
