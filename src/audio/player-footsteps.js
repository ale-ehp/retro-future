// I passi del giocatore: banchi di campioni, contesto audio, decodifica e riproduzione.
//
// Spostato qui da main.js senza cambiare la logica (tappa 5, 2026-09-19). Le
// dipendenze da main (camera, altezza minima della camera, superficie su cui si
// cammina, noclip) arrivano da initPlayerFootsteps(); movementRunMix e stepPhase
// sono i binding vivi di controls/movement.js, come prima.
//
// ATTENZIONE, storia vera (2026-09-18): il contesto audio NON va fotografato
// all'import. Quando main.js viene importato prima del click (precaricamento)
// window.__retroAudio.context e' ancora nullo, main se ne fabbricava uno suo e al
// gesto ne nasceva un secondo: collegare nodi di contesti diversi alza
// InvalidAccessError a ogni frame e porta giu' la scena. Si risolve al momento
// dell'uso, e chi arriva primo pubblica il suo per l'altro (createFootstepAudioContext).
// src/audio-contesto-unico.test.mjs legge questo file per impedire che torni.
import * as THREE from 'three';
import { movementRunMix, stepPhase } from '../controls/movement.js';
import {
  footstepInverseDistanceGain,
  pickFootstepSample as pickFootstepSampleCore,
  setFootstepAudioParam,
  setFootstepPannerPosition,
} from './footstep-audio.js';
import {
  FOOTSTEP_MIN_INTERVAL_MS,
  FOOTSTEP_PLAYER_BUS,
  FOOTSTEP_PLAYER_VOLUME_SCALE,
  WALK_SURFACE_SNAP_TOLERANCE,
} from '../config/costanti.js';

let deps = null;
/** @param {{ camera: THREE.Camera, getCameraMinHeight: () => number, getWalkSurfaceLift: () => number, getWalkSurfaceKind: () => string, isCameraCollisionDisabled: () => boolean }} injected */
export function initPlayerFootsteps(injected) {
  deps = injected;
}

/** Il contesto audio della pagina, se e quando e' stato creato: lo chiede la colonna sonora. */
export function getFootstepAudioContext() {
  return footstepAudioContext;
}

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
const footstepBuffers = { road: [], sidewalk: [] };
const footstepSampleData = { road: [], sidewalk: [] };
const footstepVariantCursor = {
  road: { left: 0, right: 0 },
  sidewalk: { left: 0, right: 0 },
};
const footstepRequestedSampleCount = Object.values(TRON_FOOTSTEP_BANKS).reduce((sum, samples) => sum + samples.length, 0);
const footstepAudioForward = new THREE.Vector3();
const footstepAudioUp = new THREE.Vector3();
// NON fotografare qui il contesto della pagina: quando main.js viene importato prima del
// click (precaricamento) window.__retroAudio.context e' ancora nullo, main.js se ne
// fabbricava uno suo e al gesto ne nasceva un secondo. Collegare nodi di contesti diversi
// alza InvalidAccessError a ogni frame e porta giu' la scena (2026-09-18). Si risolve al
// momento dell'uso, e chi arriva primo pubblica il suo per l'altro.
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
  // Uno solo per pagina, chiunque lo crei per primo.
  const gianoto = window.__retroAudio?.context;
  if (gianoto) return gianoto;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  try {
    const nuovo = new AudioContextCtor();
    if (window.__retroAudio) window.__retroAudio.context = nuovo;
    return nuovo;
  } catch { return null; }
}

export function waitForNextFrame() {
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

export function ensureFootstepAudioReady() {
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

export function ensureTronAudioContext() {
  if (!footstepAudioContext) footstepAudioContext = createFootstepAudioContext();
  if (!footstepAudioContext) return null;
  if (footstepAudioContext.state === 'suspended') footstepAudioContext.resume().catch(() => {});
  return footstepAudioContext;
}


function pickFootstepSample(surfaceKind, side) {
  return pickFootstepSampleCore(footstepBuffers, footstepVariantCursor, surfaceKind, side);
}

function syncFootstepAudioListener(now = footstepAudioContext?.currentTime ?? 0) {
  if (!footstepAudioContext?.listener) return;
  const listener = footstepAudioContext.listener;
  const pos = deps.camera.position;
  footstepAudioForward.set(0, 0, -1).applyQuaternion(deps.camera.quaternion);
  footstepAudioUp.set(0, 1, 0).applyQuaternion(deps.camera.quaternion);
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

export function playFootstepForSurface(surfaceKind = deps.getWalkSurfaceKind(), intensity = 1, side = 'right', options = {}) {
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
  const listenerPosition = deps.camera.position;
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

export function resetFootstepCadence() {
  lastFootstepIndex = Math.floor(stepPhase / Math.PI);
}

export function updateFootstepAudioFromWalk(moveFactor) {
  const nextStepIndex = Math.floor(stepPhase / Math.PI);
  if (
    moveFactor < 0.08 ||
    deps.isCameraCollisionDisabled() ||
    Math.abs(deps.camera.position.y - (deps.getCameraMinHeight() + deps.getWalkSurfaceLift())) > WALK_SURFACE_SNAP_TOLERANCE + 0.35
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
  playFootstepForSurface(deps.getWalkSurfaceKind(), intensity, side);
}

export function inspectPlayerFootsteps() {
  return {
    contextState: footstepAudioContext?.state || 'not-created',
    ready: Boolean(footstepBuffers.road.length && footstepBuffers.sidewalk.length),
    preloadStarted: Boolean(footstepAudioPreloadPromise),
    decodeStatus: footstepAudioDecodeStatus,
    decodedCount: footstepAudioDecodedCount,
    requestedCount: footstepRequestedSampleCount,
    preloadedCount: Object.values(footstepSampleData).reduce((sum, samples) => sum + samples.length, 0),
    error: footstepAudioError,
    surface: deps.getWalkSurfaceKind(),
    lastSurface: lastFootstepSurface,
    lastSample: lastFootstepSample,
    banks: Object.fromEntries(Object.entries(TRON_FOOTSTEP_BANKS).map(([surface, samples]) => [
      surface,
      samples.map((sample) => sample.key),
    ])),
  };
}
