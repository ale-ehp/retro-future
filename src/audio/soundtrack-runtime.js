// Runtime della colonna sonora: possiede lo stato del player e lo tiene legato
// alle funzioni pure di audio.js.
//
// Perche' esiste: audio.js era gia' stato estratto, ma senza portarsi dietro lo
// stato. Il risultato erano venti funzioni in main.js che non facevano altro che
// ripassare `tronSoundtrack` e l'AudioContext a una funzione omonima di audio.js,
// piu' l'oggetto di stato e la sua inspect. Qui quello strato sparisce: lo stato
// vive accanto alle funzioni che lo leggono.
//
// L'AudioContext resta di main.js, che lo condivide con i passi: arriva da fuori
// come getter e come funzione di creazione pigra, non viene posseduto da qui.
import {
  TRON_SOUNDTRACK_CROSSFADE_SECONDS,
  TRON_SOUNDTRACK_ENABLED,
  TRON_SOUNDTRACK_INITIAL_START_SECONDS,
  TRON_SOUNDTRACK_INTRO_FX_DEFAULTS,
  TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS,
  TRON_SOUNDTRACK_INTRO_FX_MAX_WOBBLE_DEPTH_HZ,
  TRON_SOUNDTRACK_INTRO_FX_REVEAL_STOP_DELAY_MS,
  TRON_SOUNDTRACK_INTRO_FX_WOBBLE_RATE_HZ,
  TRON_SOUNDTRACK_LOOP_START_SECONDS,
  TRON_SOUNDTRACK_STOP_FADE_SECONDS,
  TRON_SOUNDTRACK_URL,
  TRON_SOUNDTRACK_VOLUME,
  applyTronSoundtrackIntroLofiMix as applyTronSoundtrackIntroLofiMixCore,
  createTronIntroBitcrushCurve as createTronIntroBitcrushCurveCore,
  createTronIntroDistortionCurve as createTronIntroDistortionCurveCore,
  createTronSoundtrackElement as createTronSoundtrackElementCore,
  crossfadeTronSoundtrack as crossfadeTronSoundtrackCore,
  monitorTronSoundtrackLoop as monitorTronSoundtrackLoopCore,
  pauseTronSoundtrackElement as pauseTronSoundtrackElementCore,
  primeTronSoundtrackForGesture as primeTronSoundtrackForGestureCore,
  rampGain as rampGainCore,
  scheduleTronSoundtrackIntroLofiStopForReveal as scheduleTronSoundtrackIntroLofiStopForRevealCore,
  setAudioParamSmooth as setAudioParamSmoothCore,
  setTronFileSoundtrackVolume as setTronFileSoundtrackVolumeCore,
  setTronSoundtrackIntroLofi as setTronSoundtrackIntroLofiCore,
  setupTronSoundtrackGraph as setupTronSoundtrackGraphCore,
  startTronFileSoundtrack as startTronFileSoundtrackCore,
  startTronSoundtrackElement as startTronSoundtrackElementCore,
  stopTronFileSoundtrack as stopTronFileSoundtrackCore,
  stopTronSoundtrackIntroLofiForReveal as stopTronSoundtrackIntroLofiForRevealCore,
  syncTronIntroFxNodeSettings as syncTronIntroFxNodeSettingsCore,
  tronIntroFxEffectiveFilters as tronIntroFxEffectiveFiltersCore,
  tronSoundtrackLoopStart as tronSoundtrackLoopStartCore,
} from './audio.js';

/**
 * @param {object} deps
 * @param {() => (AudioContext|null)} deps.getAudioContext  contesto corrente, puo' essere null prima del primo gesto
 * @param {() => (AudioContext|null)} deps.ensureAudioContext  lo crea o lo risveglia
 */
export function createTronSoundtrackRuntime({ getAudioContext, ensureAudioContext }) {
  const soundtrack = {
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

  // Forma attesa dalle funzioni di audio.js che hanno bisogno sia dello stato
  // sia del contesto: lo ricevono di qui invece che come argomenti sciolti.
  const coreDeps = {
    soundtrack,
    getCtx: getAudioContext,
    ensureCtx: ensureAudioContext,
  };

  const createTronSoundtrackElement = () => createTronSoundtrackElementCore(soundtrack);
  const createTronIntroBitcrushCurve = (bitDepth, crusher) =>
    createTronIntroBitcrushCurveCore(bitDepth, crusher, soundtrack);
  const createTronIntroDistortionCurve = (amount) =>
    createTronIntroDistortionCurveCore(amount, soundtrack);
  const setAudioParamSmooth = (param, value, seconds = 0.04) =>
    setAudioParamSmoothCore(getAudioContext(), param, value, seconds);
  const tronIntroFxEffectiveFilters = () => tronIntroFxEffectiveFiltersCore(soundtrack);
  const syncTronIntroFxNodeSettings = (fadeSeconds = 0.04) =>
    syncTronIntroFxNodeSettingsCore(soundtrack, getAudioContext(), fadeSeconds);
  const applyTronSoundtrackIntroLofiMix = (active, fadeSeconds = TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS) =>
    applyTronSoundtrackIntroLofiMixCore(soundtrack, getAudioContext(), active, fadeSeconds);
  const setTronSoundtrackIntroLofi = (active, fadeSeconds = TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS, stoppedByReveal = false) =>
    setTronSoundtrackIntroLofiCore(soundtrack, getAudioContext(), active, fadeSeconds, stoppedByReveal);
  const scheduleTronSoundtrackIntroLofiStopForReveal = (delayMs = TRON_SOUNDTRACK_INTRO_FX_REVEAL_STOP_DELAY_MS) =>
    scheduleTronSoundtrackIntroLofiStopForRevealCore(soundtrack, getAudioContext, delayMs);
  const stopTronSoundtrackIntroLofiForReveal = () =>
    stopTronSoundtrackIntroLofiForRevealCore(soundtrack, getAudioContext());
  const setupTronSoundtrackGraph = (ctx) => setupTronSoundtrackGraphCore(coreDeps, ctx);
  const tronSoundtrackLoopStart = () => tronSoundtrackLoopStartCore(soundtrack);
  const rampGain = (gainNode, value, seconds, fromValue = null) =>
    rampGainCore(getAudioContext(), gainNode, value, seconds, fromValue);
  const pauseTronSoundtrackElement = (index) => pauseTronSoundtrackElementCore(soundtrack, index);
  const startTronSoundtrackElement = (index, startAt, fadeSeconds, volume = soundtrack.targetVolume) =>
    startTronSoundtrackElementCore(coreDeps, getAudioContext(), index, startAt, fadeSeconds, volume);
  const crossfadeTronSoundtrack = () => crossfadeTronSoundtrackCore(coreDeps);
  const monitorTronSoundtrackLoop = () => monitorTronSoundtrackLoopCore(coreDeps);
  const startTronFileSoundtrack = (source = 'manual', options = {}) =>
    startTronFileSoundtrackCore(coreDeps, source, options);
  const primeTronSoundtrackForGesture = () => primeTronSoundtrackForGestureCore(coreDeps);
  const stopTronFileSoundtrack = (fadeSeconds = TRON_SOUNDTRACK_STOP_FADE_SECONDS) =>
    stopTronFileSoundtrackCore(coreDeps, fadeSeconds);
  const setTronFileSoundtrackVolume = (value = TRON_SOUNDTRACK_VOLUME) =>
    setTronFileSoundtrackVolumeCore(coreDeps, value);

  // I tre nomi "procedural" sono rimasti da quando la musica era sintetizzata a
  // runtime: oggi la traccia e' un file, e sono alias tenuti per le API su window.
  const startTronProceduralMusic = (source = 'manual', options = {}) =>
    startTronFileSoundtrack(source, options);
  const stopTronProceduralMusic = (fadeSeconds = 0.75) => stopTronFileSoundtrack(fadeSeconds);
  const setTronProceduralMusicVolume = (value = TRON_SOUNDTRACK_VOLUME) =>
    setTronFileSoundtrackVolume(value);

  const round = (value, digits) => Number((value || 0).toFixed(digits));

  function inspect() {
    const ctx = getAudioContext();
    const i = soundtrack.activeIndex;
    return {
      enabled: TRON_SOUNDTRACK_ENABLED,
      mode: 'file-crossfade',
      url: TRON_SOUNDTRACK_URL,
      contextState: ctx?.state || 'not-created',
      ready: soundtrack.ready,
      playing: soundtrack.playing,
      activeIndex: soundtrack.activeIndex,
      crossfading: soundtrack.crossfading,
      duration: round(soundtrack.duration, 3),
      currentTime: round(soundtrack.elements[i]?.currentTime, 3),
      targetVolume: soundtrack.targetVolume,
      activeGain: round(soundtrack.gains[i]?.gain?.value, 4),
      introFx: {
        ...soundtrack.introFx,
        active: soundtrack.introLofiActive,
        stoppedByReveal: soundtrack.introLofiStoppedByReveal,
        revealStopDelayMs: TRON_SOUNDTRACK_INTRO_FX_REVEAL_STOP_DELAY_MS,
        revealStopPending: Boolean(soundtrack.introLofiRevealStopTimer),
        dryGain: round(soundtrack.dryGains[i]?.gain?.value, 4),
        wetGain: round(soundtrack.introLofiGains[i]?.gain?.value, 4),
        lfoGain: round(soundtrack.introLofiLfoGains[i]?.gain?.value, 2),
        noiseGain: round(soundtrack.introNoiseGain?.gain?.value, 4),
        effectiveFilters: tronIntroFxEffectiveFilters(),
        wobbleRateHz: TRON_SOUNDTRACK_INTRO_FX_WOBBLE_RATE_HZ,
        maxWobbleDepthHz: TRON_SOUNDTRACK_INTRO_FX_MAX_WOBBLE_DEPTH_HZ,
        fadeSeconds: TRON_SOUNDTRACK_INTRO_FX_FADE_SECONDS,
      },
      loopStartSeconds: tronSoundtrackLoopStart(),
      initialStartSeconds: TRON_SOUNDTRACK_INITIAL_START_SECONDS,
      requestedLoopStartSeconds: TRON_SOUNDTRACK_LOOP_START_SECONDS,
      crossfadeSeconds: TRON_SOUNDTRACK_CROSSFADE_SECONDS,
      loopCount: soundtrack.loopCount,
      timerActive: Boolean(soundtrack.timer),
      startSource: soundtrack.startSource,
      lastStartAt: round(soundtrack.lastStartAt, 3),
      error: soundtrack.error,
    };
  }

  return {
    soundtrack,
    inspect,
    createTronSoundtrackElement,
    createTronIntroBitcrushCurve,
    createTronIntroDistortionCurve,
    setAudioParamSmooth,
    tronIntroFxEffectiveFilters,
    syncTronIntroFxNodeSettings,
    applyTronSoundtrackIntroLofiMix,
    setTronSoundtrackIntroLofi,
    scheduleTronSoundtrackIntroLofiStopForReveal,
    stopTronSoundtrackIntroLofiForReveal,
    setupTronSoundtrackGraph,
    tronSoundtrackLoopStart,
    rampGain,
    pauseTronSoundtrackElement,
    startTronSoundtrackElement,
    crossfadeTronSoundtrack,
    monitorTronSoundtrackLoop,
    startTronFileSoundtrack,
    primeTronSoundtrackForGesture,
    stopTronFileSoundtrack,
    setTronFileSoundtrackVolume,
    startTronProceduralMusic,
    stopTronProceduralMusic,
    setTronProceduralMusicVolume,
  };
}
