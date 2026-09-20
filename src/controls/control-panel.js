// Il pannello dei controlli: le schede, i cursori che applicano ogni gruppo di
// impostazioni, il salvataggio dello spawn del giocatore, il benchmark dell'FSR e il
// montaggio dei pannelli in pagina.
//
// Spostato qui da main.js senza cambiare la logica (tappa 5, 2026-09-19). Sta insieme
// a controls/live-controls.js, che tiene applyLiveControls: quella funzione da sola e'
// 691 righe, e le due insieme avrebbero sfondato il limite di 1.500 righe per file.
//
// La dipendenza fra i due file va in una direzione sola, di proposito: live-controls
// importa da qui le funzioni che applica, e `scheduleLiveControls` arriva qui come
// dipendenza da main invece che con un import. Con l'import sarebbe stato un ciclo:
// ESM lo reggerebbe, ma un ciclo si legge male e non serviva.
//
// Costruisce (runtime dei controlli, pannelli montati in pagina, ascoltatori), quindi
// il codice sta dentro initControlPanel(): main.js importa questo file prima di creare
// controlli, scena e renderer. I binding sono dichiarati qui in cima e assegnati dentro
// initControlPanel(), nello stesso ordine di prima.

import {
  collisioni,
  resolveCameraBuildingCollision,
  resolveCameraRoadHexBoundaryCollision,
} from '../camera/camera-collision.js';
import { startDroneIntroFlight } from '../camera/drone-intro.js';
import { updatePointerLockHint } from '../camera/mouse-look.js';
import {
  DEFAULT_DRONE_LANDING_POSE,
  DEFAULT_PLAYER_SPAWN,
  applyCameraLook,
  cameraGroundHeightAt,
  player,
  removeViewMotionOffset,
} from '../camera/player-state.js';
import {
  DRONE_LANDING_KEY,
  PITCH_LIMIT,
  PLAYER_SPAWN_DEFAULT_Z,
  PLAYER_SPAWN_KEY,
  PLAYER_SPAWN_LEGACY_Z,
} from '../config/costanti.js';
import {
  applyAntialiasControls,
  applyBloomEnabled,
  applyRenderResolution,
  invalidateBloomTemporalCache,
  post,
  syncFsrUpscalePass,
} from '../engine/post-pipeline.js';
import { getRoadReflectionEnvMap, setRoadBuildingReflection } from '../engine/reflection-env.js';
import { applyBasePadMaterialRuntimeSettings, applyBasePadMaterialSettings } from '../world/base-pads.js';
import { boulevard } from '../world/boulevard-layout.js';
import {
  applyBoundaryErrorVisualSettings,
  setTronNoclip,
  updateRoadBoundaryHexMaterial,
} from '../world/boundary-error.js';
import {
  bridgeMaterials,
  mainBuildingMaterials,
  sideBuildingMaterials,
  updateBuildingMaterials,
} from '../world/buildings.js';
import {
  applyCityRevealWireframeDisabledControlsState,
  buildCityRevealWireframe,
  cityRevealBackplateOpacityScale,
  cityRevealDelayMs,
  cityRevealFadeMs,
  cityRevealWireAlpha,
  cityRevealWireObjects,
  cityRevealWireOpacityScale,
  cityRevealWireframeDensity,
  cityRevealWireframeEnabled,
  setCityRevealWireAlpha,
  setCityRevealWireframeSettings,
} from '../world/city-reveal-wireframe.js';
import {
  CITY_REVEAL_DEFAULT_DELAY_MS,
  CITY_REVEAL_DEFAULT_FADE_MS,
  FSR_BENCHMARK_PRESET_KEYS,
  FSR_PRESETS,
  MAX_RENDER_PIXEL_RATIO,
} from '../world/config.js';
import {
  applyHexRuntimeSettings,
  hexPlayerTileLight,
  hexRoadTileBatches,
  hexRoadTiles,
  hexTileActiveColor,
  hexTileBaseColor,
  hexTileDisplayActiveColor,
  hexTileDisplayBaseColor,
  hexTileHitLight,
  hexTileMat,
  setHexRoadMaterialGlow,
  syncHexTileDisplayColor,
} from '../world/hex-tiles.js';
import { renderBridgeControls } from './bridge-controls.js';
import { createBuildingLiveControlsRuntime } from './building-live-controls.js';
import { createControlSettingsRuntime, setButtonFeedback } from './control-settings-runtime.js';
import { PRODUCTION_LIVE_CONTROL_SELECTOR } from './controls.js';
import { mountSideFacadeLedControls as mountSideFacadeLedControlsCore } from './facade-led-controls.js';
import { mountFxCategoryPanels } from './fx-panels.js';
import { keys } from './keyboard.js';
import { movementVelocity, setHeadBobOffset, setSideSwayOffset } from './movement.js';
import * as THREE from 'three';

/** @type {any} */ let ambientLight = null;
/** @type {any} */ let applyTronSoundtrackIntroLofiMix = null;
/** @type {any} */ let camera = null;
/** @type {ReturnType<typeof import('./controls.js').createControlEls>} */ let controlEls = null;
/** @type {any} */ let dirKey = null;
/** @type {any} */ let groundLedMaterials = null;
/** @type {any} */ let hexTileDisplayBaseEmissive = null;
/** @type {any} */ let hexTileDisplayHitEmissive = null;
/** @type {any} */ let PAL = null;
/** @type {any} */ let performanceDiagnostics = null;
/** @type {any} */ let renderer = null;
/** @type {any} */ let roadMat = null;
/** @type {any} */ let setTronSoundtrackIntroLofi = null;
/** @type {any} */ let syncTronIntroFxNodeSettings = null;
/** @type {any} */ let tronSoundtrack = null;
/** @type {any} */ let setFixedCameraFov = null;
let getLatestMeasuredFps = () => 0;
/** @type {any} */ let scheduleLiveControls = null;

// I binding costruiti da initControlPanel().
export let controlSettingsRuntime = null;
let formatRevealDelaySeconds = null;
let persistSettingsToProject = null;
let buildingLiveControls = null;
export let performanceDiagnosticsEl = null;

/** Le dipendenze da main.js e la costruzione del pannello, dove stava il codice. */
export function initControlPanel(deps) {
  ({
  ambientLight, applyTronSoundtrackIntroLofiMix, camera, controlEls, dirKey,
  groundLedMaterials, hexTileDisplayBaseEmissive, hexTileDisplayHitEmissive, PAL,
  performanceDiagnostics, renderer, roadMat, setTronSoundtrackIntroLofi,
  syncTronIntroFxNodeSettings, tronSoundtrack, setFixedCameraFov, getLatestMeasuredFps,
  scheduleLiveControls,
  } = deps);



  // mountFxCategoryPanels moved to ./fx-panels.js (called once below, after performanceDiagnosticsEl).

  controlSettingsRuntime = createControlSettingsRuntime({
    controlEls,
    CITY_REVEAL_DEFAULT_DELAY_MS,
    CITY_REVEAL_DEFAULT_FADE_MS,
    updateStartPositionLiveLabel,
    sanitizePlayerSpawn,
    sanitizeDroneLandingPose,
    updatePlayerSpawnLabel,
    applyPlayerSpawn,
    setPlayerSpawn: (nextSpawn) => {
      player.playerSpawn = nextSpawn;
    },
    setDroneLandingPose: (nextLanding) => {
      player.droneLandingPose = nextLanding;
    },
  });

  // le parentesi servono: senza `const` davanti, un { } a inizio istruzione e' un blocco
  ({
    formatRevealDelaySeconds,
    persistSettingsToProject,
  } = controlSettingsRuntime);


  buildingLiveControls = createBuildingLiveControlsRuntime({
    controlEls,
    PAL,
    sceneLightResponse,
    updateBuildingMaterials,
    sideBuildingMaterials,
    bridgeMaterials,
    mainBuildingMaterials,
    getMainBuildingSaturation: () => boulevard.mainBuildingSaturation,
    setMainBuildingSaturation: (value) => {
      boulevard.mainBuildingSaturation = value;
    },
    applyBasePadMaterialRuntimeSettings,
    applyBasePadMaterialSettings,
  });
  renderBridgeControls();
  performanceDiagnosticsEl = null;
  mountFxCategoryPanels({ setPerformanceDiagnosticsEl: (el) => { performanceDiagnosticsEl = el; } });
  mountSideFacadeLedControls();
  // querySelectorAll dichiara Element, che non ha ne' .type ne' .dataset: il cast dice che
  // cosa seleziona davvero il selettore (2026-09-20).
  /** @type {NodeListOf<HTMLInputElement | HTMLSelectElement>} */ (document.querySelectorAll(PRODUCTION_LIVE_CONTROL_SELECTOR)).forEach((input) => {
    input.addEventListener(input.tagName === 'SELECT' || input.type === 'checkbox' ? 'change' : 'input', scheduleLiveControls);
  });
  // Agganciata nuda al click, resetCameraHeightToDefault riceveva il PointerEvent al
  // posto di showFeedback: funzionava solo perche' un evento e' truthy (2026-09-20).
  controlEls.resetCameraHeight.addEventListener('click', () => resetCameraHeightToDefault(true));
  controlEls.saveLiveSpawn.addEventListener('click', captureLivePlayerSpawn);
  controlEls.resetPlayerSpawn.addEventListener('click', () => applyPlayerSpawn(player.playerSpawn, true));
  controlEls.saveStartPosition.addEventListener('click', captureLivePlayerSpawn);
  controlEls.goStartPosition.addEventListener('click', () => applyPlayerSpawn(player.playerSpawn, true));
  controlEls.droneIntroFlight?.addEventListener('click', () => startDroneIntroFlight('manual'));
  controlEls.runFsrBenchmark?.addEventListener('click', runFsrBenchmark);
  controlSettingsRuntime.bindSaveButtons();

  updateControlTabs();
  controlSettingsRuntime.setupSettingsToggle();
}
export function formatOffsetLabel(value) {
  if (Math.abs(value) < 0.005) return '0.00';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)} ${value > 0 ? 'su' : 'giu'}`;
}



export function tunedColor(baseColor, hueDeg, saturationScale, brightnessScale) {
  const hsl = {};
  baseColor.getHSL(hsl);
  const h = (hsl.h + hueDeg / 360 + 1) % 1;
  const s = THREE.MathUtils.clamp(hsl.s * saturationScale, 0, 1);
  const l = THREE.MathUtils.clamp(hsl.l * brightnessScale, 0, 1);
  return new THREE.Color().setHSL(h, s, l);
}



export function sceneLightResponse(ambient, key) {
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



export function updateRoadTileMaterials(callback) {
  callback(hexTileMat);
  for (const batch of hexRoadTileBatches) {
    callback(batch.material);
    batch.material.color.set(0xffffff);
  }
}



export function refreshRoadTileInstances() {
  for (const tile of hexRoadTiles) {
    const hitLight = tile.userData.hitLight || 0;
    const playerLight = tile.userData.playerLight || 0;
    const basePadLight = tile.userData.basePadLight || 0;
    syncHexTileDisplayColor(tile, hitLight, playerLight, basePadLight);
  }
}



export function updateGroundLedMaterials(roadEdgeBrightness, medianBrightness, hueDeg) {
  for (const item of groundLedMaterials) {
    const amount = item.role === 'median' ? medianBrightness : roadEdgeBrightness;
    item.material.color.copy(tunedColor(item.baseColor, hueDeg, 1, amount));
  }
}



function updateControlTabs() {
  /** @type {NodeListOf<HTMLElement>} */ const tabs = document.querySelectorAll('#hud-controls .control-tab');
  /** @type {NodeListOf<HTMLElement>} */ const panels = document.querySelectorAll('#hud-controls .control-panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((button) => button.classList.toggle('active', button === tab));
      panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === target));
    });
  });
}





export function trimProductionControls() {
  // The live-tuning UI is retired: control VALUES still come from the markup
  // defaults + canonical settings applied at boot (controlEls keeps reading
  // the detached elements), but no user-facing settings button or panel stays.
  document.getElementById('settings-toggle')?.remove();
  document.getElementById('hud-controls')?.remove();
}



function formatPlayerSpawn(spawn = player.playerSpawn) {
  return `${spawn.x.toFixed(1)}, ${spawn.y.toFixed(1)}, ${spawn.z.toFixed(1)} | yaw ${THREE.MathUtils.radToDeg(spawn.spawnYaw).toFixed(0)} pitch ${THREE.MathUtils.radToDeg(spawn.spawnPitch).toFixed(0)}`;
}



function formatCurrentPlayerPose() {
  return formatPlayerSpawn({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    spawnYaw: player.yaw,
    spawnPitch: player.pitch,
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
  if (controlEls.playerSpawnVal) controlEls.playerSpawnVal.textContent = formatPlayerSpawn(player.playerSpawn);
  if (controlEls.startPositionSavedVal) controlEls.startPositionSavedVal.textContent = formatPlayerSpawn(player.playerSpawn);
}



export function updateStartPositionLiveLabel() {
  // The label lives in the controls panel, hidden by default; skip the pose-string build + DOM
  // write while hidden (refreshed on panel open via setHidden). Visual-neutral when not shown.
  if (document.body.classList.contains('controls-hidden')) return;
  if (controlEls.startPositionLiveVal) controlEls.startPositionLiveVal.textContent = formatCurrentPlayerPose();
}



export function loadStoredPlayerSpawn() {
  try {
    const stored = JSON.parse(localStorage.getItem(PLAYER_SPAWN_KEY) || 'null');
    const nextSpawn = sanitizePlayerSpawn(stored?.spawn ?? stored);
    if (nextSpawn) {
      if (isDefaultDroneLandingPose(nextSpawn)) {
        player.droneLandingPose = sanitizeDroneLandingPose(stored?.spawn ?? stored) || nextSpawn;
        localStorage.setItem(DRONE_LANDING_KEY, JSON.stringify({ savedAt: player.droneLandingPose.savedAt || new Date().toISOString(), landing: player.droneLandingPose }, null, 2));
      } else {
        player.playerSpawn = nextSpawn;
      }
    }
    const storedLanding = JSON.parse(localStorage.getItem(DRONE_LANDING_KEY) || 'null');
    const nextLanding = sanitizeDroneLandingPose(storedLanding?.landing ?? storedLanding);
    if (nextLanding) player.droneLandingPose = nextLanding;
  } catch (error) {
    console.warn('Invalid TRON boulevard player spawn', error);
  }
  updatePlayerSpawnLabel();
}



export function applyPlayerSpawn(spawn = player.playerSpawn, showFeedback = true) {
  const nextSpawn = sanitizePlayerSpawn(spawn) || DEFAULT_PLAYER_SPAWN;
  removeViewMotionOffset();
  movementVelocity.set(0, 0, 0);
  camera.position.set(nextSpawn.x, nextSpawn.y, nextSpawn.z);
  player.yaw = nextSpawn.spawnYaw;
  player.pitch = nextSpawn.spawnPitch;
  player.viewRoll = 0;
  setHeadBobOffset(0);
  setSideSwayOffset(0);
  applyCameraLook();
  resolveCameraBuildingCollision();
  resolveCameraRoadHexBoundaryCollision();
  player.walkSurfaceLift = Math.max(0, cameraGroundHeightAt(camera.position.x, camera.position.z) - player.cameraMinHeight);
  if (showFeedback) setButtonFeedback(controlEls.resetPlayerSpawn, 'Spawn ripristinato');
  if (showFeedback) setButtonFeedback(controlEls.goStartPosition, 'Posizione ripristinata');
  updateStartPositionLiveLabel();
  return window.__tronInspect?.();
}



export function captureLivePlayerSpawn() {
  removeViewMotionOffset();
  player.playerSpawn = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    spawnYaw: player.yaw,
    spawnPitch: player.pitch,
    savedAt: new Date().toISOString(),
  };
  const payload = { savedAt: player.playerSpawn.savedAt, spawn: player.playerSpawn };
  localStorage.setItem(PLAYER_SPAWN_KEY, JSON.stringify(payload, null, 2));
  updatePlayerSpawnLabel();
  updateStartPositionLiveLabel();
  setButtonFeedback(controlEls.saveLiveSpawn, 'Spawn salvato');
  setButtonFeedback(controlEls.saveStartPosition, 'Inizio salvato');
  persistSettingsToProject('player-spawn', player.playerSpawn, { savedAt: player.playerSpawn.savedAt }).then((result) => {
    if (result) setButtonFeedback(controlEls.saveLiveSpawn, 'Spawn + JSON salvato');
    if (result) setButtonFeedback(controlEls.saveStartPosition, 'JSON salvato');
  });
  return player.playerSpawn;
}



export function resetCameraHeightToDefault(showFeedback = true) {
  removeViewMotionOffset();
  camera.position.y = cameraGroundHeightAt(camera.position.x, camera.position.z);
  movementVelocity.y = 0;
  setHeadBobOffset(0);
  setSideSwayOffset(0);
  player.viewRoll = 0;
  applyCameraLook();
  keys.KeyE = false;
  keys.Space = false;
  keys.KeyQ = false;
  keys.KeyC = false;
  if (showFeedback) setButtonFeedback(controlEls.resetCameraHeight, 'Altezza ripristinata');
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
  const stats = performanceDiagnostics.summary(getLatestMeasuredFps());
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
      performanceDiagnostics.update(getLatestMeasuredFps());
      await waitFsrBenchmarkFrames(18);
      await fsrBenchmarkDelay(180);
      performanceDiagnostics.update(getLatestMeasuredFps());
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



export function applyFsrUpscaleControlsFromUI() {
  if (!controlEls.fsrUpscaleEnabled || !controlEls.fsrInternalScale || !controlEls.fsrSharpness) return;
  applyFsrPresetSelectionToControls();
  post.fsrUpscaleEnabled = controlEls.fsrUpscaleEnabled.value !== 'off';
  post.fsrInternalScale = THREE.MathUtils.clamp(Number(controlEls.fsrInternalScale.value) || 1, 0.65, 1);
  post.fsrSharpness = THREE.MathUtils.clamp(Number(controlEls.fsrSharpness.value) || 0, 0, 1.25);
  controlEls.fsrInternalScale.value = post.fsrInternalScale.toFixed(2);
  controlEls.fsrSharpness.value = post.fsrSharpness.toFixed(2);
  controlEls.fsrInternalScaleVal.textContent = `${Math.round(post.fsrInternalScale * 100)}%`;
  controlEls.fsrSharpnessVal.textContent = post.fsrSharpness.toFixed(2);
  syncFsrUpscalePass();
}



export function applyPostControlsFromUI() {
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
  const previousPerformanceMode = post.performanceMode;
  post.performanceMode = nextPerformanceMode;
  post.manualRenderScale = nextRenderResolution;
  post.requestedBloomResolutionScale = bloomQuality;
  post.requestedPixelRatio = pixelRatio;
  applyFsrUpscaleControlsFromUI();
  applyAntialiasControls(nextAntialiasMode);
  applyBloomEnabled(nextBloomEnabled);
  if (post.performanceMode !== previousPerformanceMode || post.performanceMode === 'quality') {
    post.dynamicQualityScale = 1;
    post.performanceAdjustCooldown = 0;
  }
  applyRenderResolution(post.requestedPixelRatio);
  if (post.bloomPass) {
    post.bloomPass.enabled = post.bloomEnabled;
    post.bloomPass.strength = bloomStrength;
    post.bloomPass.radius = bloomRadius;
    post.bloomPass.threshold = bloomThreshold;
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



export function applyWireframeFxControlsFromUI() {
  if (!controlEls.wireframeEnabled) return;
  const previousDensity = cityRevealWireframeDensity;
  setCityRevealWireframeSettings({
    enabled: controlEls.wireframeEnabled.value === 'on',
    delayMs: Number(controlEls.wireframeDelay.value) * 1000,
    fadeMs: Number(controlEls.wireframeFade.value) * 1000,
    density: Math.max(1, Math.round(Number(controlEls.wireframeDensity.value))),
    opacityScale: Number(controlEls.wireframeOpacity.value),
    backplateOpacityScale: Number(controlEls.wireframeBackplate.value),
  });

  controlEls.wireframeEnabledVal.textContent = cityRevealWireframeEnabled ? 'on' : 'off';
  controlEls.wireframeDelayVal.textContent = `${formatRevealDelaySeconds(cityRevealDelayMs / 1000)} s`;
  controlEls.wireframeFadeVal.textContent = `${(cityRevealFadeMs / 1000).toFixed(1)} s`;
  controlEls.wireframeDensityVal.textContent = `${cityRevealWireframeDensity}x`;
  controlEls.wireframeOpacityVal.textContent = cityRevealWireOpacityScale.toFixed(2);
  controlEls.wireframeBackplateVal.textContent = cityRevealBackplateOpacityScale.toFixed(2);

  if (!cityRevealWireframeEnabled) {
    applyCityRevealWireframeDisabledControlsState();
    updatePointerLockHint();
    return;
  }
  if (previousDensity !== cityRevealWireframeDensity && cityRevealWireObjects.length) {
    buildCityRevealWireframe();
  }
  setCityRevealWireAlpha(cityRevealWireAlpha);
}



export function applyTronSoundtrackIntroFxControlsFromUI() {
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



export function applyMovementControlsFromUI() {
  if (controlEls.noclipEnabled) {
    setTronNoclip(controlEls.noclipEnabled.value === 'on', { silent: true });
  }
  collisioni.collisionPadding = Number(controlEls.collisionPadding.value);
  collisioni.mainBuildingCollisionPadding = Number(controlEls.mainBuildingCollisionPadding.value);
  player.cameraMinHeight = Number(controlEls.cameraMinHeight.value);
  player.speedBase = Number(controlEls.walkSpeed.value);
  player.speedSprint = Number(controlEls.sprintSpeed.value);
  player.backwardSpeedScale = Number(controlEls.backwardSpeedScale.value);
  player.strafeSpeedScale = Number(controlEls.strafeSpeedScale.value);
  player.diagonalSpeedScale = Number(controlEls.diagonalSpeedScale.value);
  player.verticalSpeed = Number(controlEls.verticalSpeed.value);
  player.movementAcceleration = Number(controlEls.movementAccel.value);
  player.movementDeceleration = Number(controlEls.movementDecel.value);
  player.walkBobAmount = Number(controlEls.walkBob.value);
  player.runBobAmount = Number(controlEls.runBob.value);
  player.strafeBobScale = Number(controlEls.strafeBobScale.value);
  player.backwardBobScale = Number(controlEls.backwardBobScale.value);
  player.walkStepRate = Number(controlEls.walkStepRate.value);
  player.runStepRate = Number(controlEls.runStepRate.value);
  player.stepSnapAmount = Number(controlEls.stepSnap.value);
  player.movementSwayAmount = Number(controlEls.movementSway.value);
  player.movementRollAmount = Number(controlEls.movementRoll.value);
  player.strafeLeanAmount = Number(controlEls.strafeLean.value);
  player.headMotionSmoothing = Number(controlEls.headMotionSmoothing.value);
  player.mouseSensitivityScale = Number(controlEls.mouseSensitivity.value);
  setFixedCameraFov();
  controlEls.collisionPaddingVal.textContent = collisioni.collisionPadding.toFixed(1);
  controlEls.mainBuildingCollisionPaddingVal.textContent = collisioni.mainBuildingCollisionPadding.toFixed(1);
  controlEls.cameraMinHeightVal.textContent = player.cameraMinHeight.toFixed(1);
  controlEls.walkSpeedVal.textContent = player.speedBase.toFixed(0);
  controlEls.sprintSpeedVal.textContent = player.speedSprint.toFixed(0);
  controlEls.backwardSpeedScaleVal.textContent = player.backwardSpeedScale.toFixed(2);
  controlEls.strafeSpeedScaleVal.textContent = player.strafeSpeedScale.toFixed(2);
  controlEls.diagonalSpeedScaleVal.textContent = player.diagonalSpeedScale.toFixed(2);
  controlEls.verticalSpeedVal.textContent = player.verticalSpeed.toFixed(0);
  controlEls.movementAccelVal.textContent = player.movementAcceleration.toFixed(1);
  controlEls.movementDecelVal.textContent = player.movementDeceleration.toFixed(1);
  controlEls.walkBobVal.textContent = player.walkBobAmount.toFixed(2);
  controlEls.runBobVal.textContent = player.runBobAmount.toFixed(2);
  controlEls.strafeBobScaleVal.textContent = player.strafeBobScale.toFixed(2);
  controlEls.backwardBobScaleVal.textContent = player.backwardBobScale.toFixed(2);
  controlEls.walkStepRateVal.textContent = player.walkStepRate.toFixed(2);
  controlEls.runStepRateVal.textContent = player.runStepRate.toFixed(2);
  controlEls.stepSnapVal.textContent = player.stepSnapAmount.toFixed(2);
  controlEls.movementSwayVal.textContent = player.movementSwayAmount.toFixed(2);
  controlEls.movementRollVal.textContent = player.movementRollAmount.toFixed(3);
  controlEls.strafeLeanVal.textContent = player.strafeLeanAmount.toFixed(3);
  controlEls.headMotionSmoothingVal.textContent = player.headMotionSmoothing.toFixed(1);
  controlEls.mouseSensitivityVal.textContent = player.mouseSensitivityScale.toFixed(2);
}



export function applyLightControlsFromUI() {
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



export function applyHexRuntimeControlsFromUI() {
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



export function applyRoadMaterialControlsFromUI() {
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



export function applyBuildingMaterialControlsFromUI() {
  buildingLiveControls.applyBuildingMaterialControlsFromUI();
}



export function applyBasePadMaterialControlsFromUI() {
  buildingLiveControls.applyBasePadMaterialControlsFromUI();
}



export function applyBoundaryErrorControlsFromUI() {
  collisioni.roadBoundaryCollisionEnabled = controlEls.roadBoundaryCollisionEnabled.value === 'on';
  collisioni.roadBoundaryCollisionMargin = Number(controlEls.roadBoundaryCollisionMargin.value);
  collisioni.roadBoundaryCameraLead = Number(controlEls.roadBoundaryCameraLead.value);
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
  controlEls.roadBoundaryCollisionEnabledVal.textContent = collisioni.roadBoundaryCollisionEnabled ? 'on' : 'off';
  controlEls.roadBoundaryCollisionMarginVal.textContent = collisioni.roadBoundaryCollisionMargin.toFixed(1);
  controlEls.roadBoundaryCameraLeadVal.textContent = collisioni.roadBoundaryCameraLead.toFixed(1);
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


export function mountSideFacadeLedControls() {
  return mountSideFacadeLedControlsCore(controlEls);
}
