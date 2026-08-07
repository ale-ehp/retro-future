import * as THREE from 'three';

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

// ---------- Real demo: phosphor audio equalizer runtime (extracted from main.js, init-deps) ----------
let deps = null;
let scene = null;
let camera = null;
let renderer = null;
let controlEls = null;
let tronSoundtrack = null;
let performanceLiveMetrics = null;
let postRevealPerfIsolationState = null;
let elStrip = null;
let ensureTronAudioContext = null;
let setupTronSoundtrackGraph = null;
let GRID_BLOCK = 0;
let TRON_SOUNDTRACK_URL = '';
let TRON_RUNNER_BEAT_PULSE_AUDIO_KICK_ENABLED = false;
let LAB_EQUALIZER_AUDIO_URL = '';
let LAB_EQUALIZER_START_WALL_OFFSET_Z = 0;

export const labEqualizerGroup = new THREE.Group();
labEqualizerGroup.name = 'real-demo-phosphor-audio-equalizer';
const labEqualizerLevels = Array.from({ length: LAB_EQUALIZER_BAR_COUNT }, () => 0);
const labEqualizerPeaks = Array.from({ length: LAB_EQUALIZER_BAR_COUNT }, () => 0);
const labEqualizerPeakHoldTimers = Array.from({ length: LAB_EQUALIZER_BAR_COUNT }, () => 0);
const labEqualizerTargetLevels = Array.from({ length: LAB_EQUALIZER_BAR_COUNT }, () => 0);
const labEqualizerBandDbValues = Array.from({ length: LAB_EQUALIZER_BAR_COUNT }, () => LAB_EQUALIZER_LEVEL_DB_FLOOR);
const labEqualizerConnectedSources = new WeakSet();
const labEqualizerFrustumMatrix = new THREE.Matrix4();
const labEqualizerFrustum = new THREE.Frustum();
const labEqualizerVisibilitySphere = new THREE.Sphere(new THREE.Vector3(), LAB_EQUALIZER_VISIBILITY_RADIUS);
const labEqualizerWorldPosition = new THREE.Vector3();
let labEqualizerCanvas = null;
let labEqualizerCtx = null;
let labEqualizerStaticCanvas = null;
let labEqualizerStaticCtx = null;
let labEqualizerTexture = null;
let labEqualizerPanelMat = null;
let labEqualizerDisplayMat = null;
let labEqualizerDisplayMesh = null;
let labEqualizerAudioContext = null;
let labEqualizerGain = null;
let labEqualizerAnalyser = null;
let labEqualizerFrequencyData = null;
let labEqualizerStartedAt = 0;
let labEqualizerLastTextureAt = -Infinity;
let labEqualizerLastGraphEnsureAt = -Infinity;
let labEqualizerLastPoseAt = -Infinity;
let labEqualizerLastVisibilityAt = -Infinity;
let labEqualizerLastSampleAt = -Infinity;
let labEqualizerLastSampleIntervalRaw = -1;
let labEqualizerLastTextureDrawAt = -Infinity;
let labEqualizerAccumulatedDt = 0;
let labEqualizerBassEnvelope = 0;
let labEqualizerBassPulse = 0;
let labEqualizerActivatedAfterReveal = false;
let labEqualizerPrewarmed = false;
let labEqualizerForceTextureDraw = true;
let labEqualizerBandMetadataSignature = '';
let labEqualizerLastTextureSignature = '';
let labEqualizerStaticTextureSignature = '';
const labEqualizerBandMetadata = Array.from({ length: LAB_EQUALIZER_BAR_COUNT }, () => null);
export const labEqualizerState = {
  enabled: false,
  ready: false,
  playing: false,
  error: '',
  audioSynced: false,
  sourceMode: 'tron-soundtrack',
  volume: 0.55,
  sensitivity: 0.84,
  peakFall: 0.8,
  reflectionStrength: 1.46,
  pulseMaster: 1.44,
  pulseBlue: 2.89,
  pulseCyan: 1.51,
  pulseMagenta: 2.46,
  pulseRed: 1.74,
  pulseYellow: 0,
  pulseGreen: 1.49,
  averageLevel: 0,
  peakLevel: 0,
  bassEnergy: 0,
  beatPulse: 0,
  textureFree: false,
  visibleInCamera: false,
  renderVisible: false,
  sampleIntervalMs: 0,
  textureIntervalMs: 0,
  analyserFps: 0,
  textureFps: 0,
  adaptiveTextureFps: 12,
  sampleCount: 0,
  textureUpdateCount: 0,
  textureSkippedCount: 0,
  staticTextureDrawCount: 0,
  skippedFrames: 0,
  bars: LAB_EQUALIZER_BAR_COUNT,
  segmentRows: LAB_EQUALIZER_SEGMENT_ROWS,
  canvasWidth: LAB_EQUALIZER_CANVAS_WIDTH,
  canvasHeight: LAB_EQUALIZER_CANVAS_HEIGHT,
  fftSize: LAB_EQUALIZER_FFT_SIZE,
  sceneScale: LAB_EQUALIZER_SCENE_SCALE,
  boardWidth: LAB_EQUALIZER_WORLD_WIDTH,
  boardHeight: LAB_EQUALIZER_WORLD_HEIGHT,
  boardChildren: 0,
  boardPosition: { x: 0, y: 0, z: 0 },
  yaw: 0,
};

function ensureLabEqualizerVisualResources() {
  if (labEqualizerCanvas && labEqualizerTexture && labEqualizerPanelMat && labEqualizerDisplayMat) return true;
  labEqualizerCanvas = document.createElement('canvas');
  labEqualizerCanvas.width = LAB_EQUALIZER_CANVAS_WIDTH;
  labEqualizerCanvas.height = LAB_EQUALIZER_CANVAS_HEIGHT;
  labEqualizerCtx = labEqualizerCanvas.getContext('2d');
  labEqualizerStaticCanvas = document.createElement('canvas');
  labEqualizerStaticCanvas.width = LAB_EQUALIZER_CANVAS_WIDTH;
  labEqualizerStaticCanvas.height = LAB_EQUALIZER_CANVAS_HEIGHT;
  labEqualizerStaticCtx = labEqualizerStaticCanvas.getContext('2d');
  labEqualizerTexture = new THREE.CanvasTexture(labEqualizerCanvas);
  labEqualizerTexture.colorSpace = THREE.SRGBColorSpace;
  labEqualizerTexture.generateMipmaps = false;
  labEqualizerTexture.minFilter = THREE.LinearFilter;
  labEqualizerTexture.magFilter = THREE.LinearFilter;
  labEqualizerPanelMat = new THREE.MeshBasicMaterial({
    color: 0x000101,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  labEqualizerDisplayMat = new THREE.MeshBasicMaterial({
    map: labEqualizerTexture,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
  });
  return Boolean(labEqualizerCtx && labEqualizerStaticCtx);
}

function updateLabEqualizerButton() {
  if (!controlEls.labEqStart) return;
  controlEls.labEqStart.textContent = labEqualizerState.playing ? 'Musica demo sincronizzata' : 'Equalizer in attesa';
}

function applyLabEqualizerControlsFromUI() {
  labEqualizerState.volume = THREE.MathUtils.clamp(Number(controlEls.labEqVolume?.value ?? 0.55), 0, 1);
  labEqualizerState.sensitivity = THREE.MathUtils.clamp(Number(controlEls.labEqSensitivity?.value ?? 0.84), 0.35, 3);
  labEqualizerState.peakFall = THREE.MathUtils.clamp(Number(controlEls.labEqPeakFall?.value ?? 0.8), -6, 6);
  labEqualizerState.reflectionStrength = THREE.MathUtils.clamp(Number(controlEls.labEqReflection?.value ?? 1.46), 0, 3);
  LAB_EQUALIZER_PULSE_CONTROLS.forEach((control) => {
    const value = THREE.MathUtils.clamp(Number(controlEls[control.inputKey]?.value ?? control.fallback), 0, 3);
    labEqualizerState[control.stateKey] = value;
    if (controlEls[control.outputKey]) controlEls[control.outputKey].textContent = `${value.toFixed(2)}x`;
  });
  if (controlEls.labEqVolumeVal) controlEls.labEqVolumeVal.textContent = labEqualizerState.volume.toFixed(2);
  if (controlEls.labEqSensitivityVal) controlEls.labEqSensitivityVal.textContent = labEqualizerState.sensitivity.toFixed(2);
  if (controlEls.labEqPeakFallVal) controlEls.labEqPeakFallVal.textContent = labEqualizerState.peakFall.toFixed(1);
  if (controlEls.labEqReflectionVal) controlEls.labEqReflectionVal.textContent = `${labEqualizerState.reflectionStrength.toFixed(2)}x`;
  if (labEqualizerGain && labEqualizerAudioContext) {
    labEqualizerGain.gain.setValueAtTime(0, labEqualizerAudioContext.currentTime);
  }
}

function ensureLabEqualizerAudioGraph() {
  if (!LAB_EQUALIZER_ENABLED) return false;
  const ctx = ensureTronAudioContext();
  if (!ctx) {
    labEqualizerState.error = 'Web Audio non disponibile';
    return false;
  }
  setupTronSoundtrackGraph(ctx);
  if (!labEqualizerAnalyser || labEqualizerAudioContext !== ctx) {
    labEqualizerAudioContext = ctx;
    labEqualizerAnalyser = ctx.createAnalyser();
    labEqualizerAnalyser.fftSize = LAB_EQUALIZER_FFT_SIZE;
    labEqualizerAnalyser.minDecibels = LAB_EQUALIZER_ANALYSER_MIN_DB;
    labEqualizerAnalyser.maxDecibels = LAB_EQUALIZER_ANALYSER_MAX_DB;
    labEqualizerAnalyser.smoothingTimeConstant = LAB_EQUALIZER_ANALYSER_SMOOTHING;
    labEqualizerFrequencyData = new Float32Array(labEqualizerAnalyser.frequencyBinCount);
    labEqualizerGain = ctx.createGain();
    labEqualizerGain.gain.setValueAtTime(0, ctx.currentTime);
    labEqualizerAnalyser.connect(labEqualizerGain).connect(ctx.destination);
  }
  let connected = 0;
  for (const source of tronSoundtrack.sources) {
    if (!source || labEqualizerConnectedSources.has(source)) continue;
    source.connect(labEqualizerAnalyser);
    labEqualizerConnectedSources.add(source);
    connected += 1;
  }
  labEqualizerState.ready = Boolean(labEqualizerAnalyser && labEqualizerFrequencyData);
  labEqualizerState.audioSynced = labEqualizerState.ready && tronSoundtrack.ready && tronSoundtrack.sources.length > 0;
  labEqualizerState.playing = Boolean(tronSoundtrack.playing);
  if (connected > 0 || labEqualizerState.ready) labEqualizerState.error = '';
  applyLabEqualizerControlsFromUI();
  return labEqualizerState.ready;
}

function ensureLabEqualizerAudioGraphIfNeeded(now, force = false) {
  if (!force && now - labEqualizerLastGraphEnsureAt < LAB_EQUALIZER_GRAPH_INTERVAL_MS) {
    return Boolean(labEqualizerAnalyser && labEqualizerFrequencyData);
  }
  labEqualizerLastGraphEnsureAt = now;
  return ensureLabEqualizerAudioGraph();
}

async function startLabEqualizerAudio() {
  if (!ensureLabEqualizerAudioGraph()) return false;
  try {
    await labEqualizerAudioContext.resume();
    labEqualizerState.playing = Boolean(tronSoundtrack.playing);
    labEqualizerState.audioSynced = true;
    labEqualizerStartedAt = performance.now();
    updateLabEqualizerButton();
    return true;
  } catch (error) {
    labEqualizerState.error = error?.message || String(error);
    updateLabEqualizerButton();
    return false;
  }
}

async function toggleLabEqualizerAudio() {
  return startLabEqualizerAudio();
}

function computeLabEqualizerBandResponse(_centerHz) {
  return 1;
}

function labEqualizerPulseColorGroupFromHue(hue) {
  if (hue >= 260 && hue < 330) return 'Magenta';
  if (hue >= 330 || hue < 52) return 'Red';
  if (hue >= 52 && hue < 88) return 'Yellow';
  if (hue >= 88 && hue < 165) return 'Green';
  if (hue >= 165 && hue < 205) return 'Cyan';
  return 'Blue';
}

function ensureLabEqualizerBandMetadata() {
  const binCount = labEqualizerFrequencyData?.length || 0;
  const sampleRate = labEqualizerAudioContext?.sampleRate || 48000;
  const signature = `${sampleRate}:${binCount}`;
  if (signature === labEqualizerBandMetadataSignature && labEqualizerBandMetadata[0]) {
    return labEqualizerBandMetadata;
  }
  labEqualizerBandMetadataSignature = signature;
  const nyquist = sampleRate * 0.5;
  const frequencyRatio = LAB_EQUALIZER_MAX_HZ / LAB_EQUALIZER_MIN_HZ;
  for (let index = 0; index < LAB_EQUALIZER_BAR_COUNT; index += 1) {
    const bandStart = index / LAB_EQUALIZER_BAR_COUNT;
    const bandEnd = (index + 1) / LAB_EQUALIZER_BAR_COUNT;
    const center = (index + 0.5) / LAB_EQUALIZER_BAR_COUNT;
    const lowHz = LAB_EQUALIZER_MIN_HZ * Math.pow(frequencyRatio, bandStart);
    const highHz = LAB_EQUALIZER_MIN_HZ * Math.pow(frequencyRatio, bandEnd);
    const centerHz = LAB_EQUALIZER_MIN_HZ * Math.pow(frequencyRatio, center);
    const startBin = binCount > 0
      ? THREE.MathUtils.clamp(Math.floor(lowHz / nyquist * binCount), 0, binCount - 1)
      : 0;
    const endBin = binCount > 0
      ? THREE.MathUtils.clamp(Math.ceil(highHz / nyquist * binCount), startBin + 1, binCount)
      : 0;
    const hue = labEqualizerColumnHue(index);
    labEqualizerBandMetadata[index] = {
      lowHz,
      highHz,
      centerHz,
      startBin,
      endBin,
      response: computeLabEqualizerBandResponse(centerHz),
      label: labEqualizerFormatHz(centerHz),
      hue,
      pulseGroup: labEqualizerPulseColorGroupFromHue(hue),
    };
  }
  return labEqualizerBandMetadata;
}

function labEqualizerBandMetadataFor(index) {
  return ensureLabEqualizerBandMetadata()[index] || null;
}

function labEqualizerBandWeightedDb(index) {
  if (!labEqualizerAnalyser || !labEqualizerFrequencyData || !labEqualizerState.playing) {
    labEqualizerBandDbValues[index] = LAB_EQUALIZER_LEVEL_DB_FLOOR;
    return LAB_EQUALIZER_LEVEL_DB_FLOOR;
  }
  const band = labEqualizerBandMetadataFor(index);
  if (!band || band.endBin <= band.startBin) {
    labEqualizerBandDbValues[index] = LAB_EQUALIZER_LEVEL_DB_FLOOR;
    return LAB_EQUALIZER_LEVEL_DB_FLOOR;
  }
  let sumDb = 0;
  let peakDb = -Infinity;
  let count = 0;
  for (let bin = band.startBin; bin < band.endBin; bin += 1) {
    const value = labEqualizerFrequencyData[bin];
    if (!Number.isFinite(value)) continue;
    const db = THREE.MathUtils.clamp(value, LAB_EQUALIZER_ANALYSER_MIN_DB, LAB_EQUALIZER_ANALYSER_MAX_DB);
    sumDb += db;
    peakDb = Math.max(peakDb, db);
    count += 1;
  }
  if (count <= 0) {
    labEqualizerBandDbValues[index] = LAB_EQUALIZER_LEVEL_DB_FLOOR;
    return LAB_EQUALIZER_LEVEL_DB_FLOOR;
  }
  const averageDb = sumDb / count;
  const weightedDb = averageDb * 0.74 + peakDb * 0.26;
  labEqualizerBandDbValues[index] = weightedDb;
  return weightedDb;
}

function labEqualizerBandLevel(index, framePeakDb) {
  const weightedDb = labEqualizerBandDbValues[index] ?? LAB_EQUALIZER_LEVEL_DB_FLOOR;
  if (!Number.isFinite(weightedDb) || !Number.isFinite(framePeakDb)) return 0;
  const relativeFloorDb = Math.max(LAB_EQUALIZER_LEVEL_DB_FLOOR, framePeakDb - LAB_EQUALIZER_RELATIVE_DB_RANGE);
  const relativeCeilingDb = Math.max(relativeFloorDb + 1, framePeakDb);
  const normalized = THREE.MathUtils.clamp(
    (weightedDb - relativeFloorDb) / (relativeCeilingDb - relativeFloorDb),
    0,
    1,
  );
  return THREE.MathUtils.clamp(Math.pow(normalized, LAB_EQUALIZER_LEVEL_GAMMA) * labEqualizerState.sensitivity * labEqualizerBandResponse(index), 0, 1);
}

function labEqualizerBandCenterHz(index) {
  return labEqualizerBandMetadataFor(index)?.centerHz || LAB_EQUALIZER_MIN_HZ;
}

function labEqualizerBandResponse(index) {
  return labEqualizerBandMetadataFor(index)?.response || 1;
}

function labEqualizerLevelToRows(level) {
  const clamped = THREE.MathUtils.clamp(level, 0, 1);
  if (clamped < 0.008) return 0;
  const floor = clamped > 0.03 ? 0.012 : 0;
  const visibleLevel = THREE.MathUtils.clamp(floor + Math.pow(clamped, 1.48) * (1 - floor), 0, 1);
  return THREE.MathUtils.clamp(visibleLevel * LAB_EQUALIZER_SEGMENT_ROWS, 0, LAB_EQUALIZER_SEGMENT_ROWS);
}

function labEqualizerTextureSignature(averageLevel, peakLevel, beatPulse) {
  const parts = [
    Math.round(averageLevel * 64),
    Math.round(peakLevel * 64),
    Math.round(beatPulse * 32),
    Math.round(labEqualizerState.reflectionStrength * 32),
    Math.round(labEqualizerState.pulseMaster * 16),
    Math.round(labEqualizerState.pulseBlue * 16),
    Math.round(labEqualizerState.pulseCyan * 16),
    Math.round(labEqualizerState.pulseMagenta * 16),
    Math.round(labEqualizerState.pulseRed * 16),
    Math.round(labEqualizerState.pulseYellow * 16),
    Math.round(labEqualizerState.pulseGreen * 16),
  ];
  for (let index = 0; index < LAB_EQUALIZER_BAR_COUNT; index += 1) {
    parts.push(Math.round(labEqualizerLevelToRows(labEqualizerLevels[index] || 0)));
    parts.push(Math.ceil(THREE.MathUtils.clamp(labEqualizerPeaks[index] || 0, 0, LAB_EQUALIZER_SEGMENT_ROWS)));
  }
  return parts.join(':');
}

function shouldDrawLabEqualizerTexture(now, averageLevel, peakLevel, beatPulse) {
  if (labEqualizerForceTextureDraw) return true;
  const signature = labEqualizerTextureSignature(averageLevel, peakLevel, beatPulse);
  const staticRefreshDue = now - labEqualizerLastTextureDrawAt >= LAB_EQUALIZER_STATIC_TEXTURE_REFRESH_MS;
  if (signature !== labEqualizerLastTextureSignature || staticRefreshDue) return true;
  labEqualizerState.textureSkippedCount += 1;
  return false;
}

function labEqualizerPeakFallRowsPerSecond() {
  const t = THREE.MathUtils.clamp((labEqualizerState.peakFall + 6) / 12, 0, 1);
  return Math.exp(
    Math.log(LAB_EQUALIZER_PEAK_MIN_FALL_ROWS_PER_SEC) +
    Math.log(LAB_EQUALIZER_PEAK_MAX_FALL_ROWS_PER_SEC / LAB_EQUALIZER_PEAK_MIN_FALL_ROWS_PER_SEC) * t,
  );
}

function labEqualizerFormatHz(hz) {
  if (hz < 1000) return `${Math.round(hz)}Hz`;
  if (hz < 10000) return `${(hz / 1000).toFixed(1)}kHz`;
  return `${Math.round(hz / 1000)}kHz`;
}

function syncLabEqualizerPose() {
  const roadMaxZ = deps.getDynamicRoadCenter() + deps.getDynamicRoadLength() * 0.5;
  const startReferenceZ = Math.max(
    Number.isFinite(roadMaxZ) ? roadMaxZ : -Infinity,
    Number.isFinite(deps.getPlayerSpawn()?.z) ? deps.getPlayerSpawn().z : -Infinity,
    Number.isFinite(deps.getDroneLandingPose()?.z) ? deps.getDroneLandingPose().z : -Infinity,
  );
  const z = (Number.isFinite(startReferenceZ) ? startReferenceZ : roadMaxZ) + LAB_EQUALIZER_START_WALL_OFFSET_Z;
  labEqualizerGroup.position.set(0, LAB_EQUALIZER_WORLD_HEIGHT * 0.5 + LAB_EQUALIZER_START_WALL_INSET_Y + LAB_EQUALIZER_VERTICAL_OFFSET, z);
  labEqualizerGroup.rotation.y = Math.PI;
  labEqualizerState.boardPosition = {
    x: labEqualizerGroup.position.x,
    y: labEqualizerGroup.position.y,
    z: labEqualizerGroup.position.z,
  };
  labEqualizerState.yaw = labEqualizerGroup.rotation.y;
}

function syncLabEqualizerPoseIfNeeded(now, force = false) {
  if (!force && now - labEqualizerLastPoseAt < LAB_EQUALIZER_POSE_INTERVAL_MS) return;
  labEqualizerLastPoseAt = now;
  syncLabEqualizerPose();
}

function setLabEqualizerRenderVisible(visible) {
  const renderVisible = Boolean(visible);
  if (labEqualizerState.renderVisible !== renderVisible) {
    if (!labEqualizerState.renderVisible && renderVisible) {
      labEqualizerForceTextureDraw = true;
    }
    labEqualizerState.renderVisible = renderVisible;
  }
  if (labEqualizerGroup.visible !== renderVisible) {
    labEqualizerGroup.visible = renderVisible;
  }
  labEqualizerState.textureFree = !renderVisible;
  if (!renderVisible) {
    labEqualizerState.textureIntervalMs = 0;
    labEqualizerState.textureFps = 0;
  }
}

function updateLabEqualizerVisibility(now, force = false) {
  if (!labEqualizerState.enabled) {
    labEqualizerState.visibleInCamera = false;
    setLabEqualizerRenderVisible(false);
    return false;
  }
  if (!force && now - labEqualizerLastVisibilityAt < LAB_EQUALIZER_VISIBILITY_INTERVAL_MS) {
    return labEqualizerState.visibleInCamera;
  }
  labEqualizerLastVisibilityAt = now;
  camera.updateMatrixWorld();
  labEqualizerGroup.updateMatrixWorld();
  labEqualizerFrustumMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  labEqualizerFrustum.setFromProjectionMatrix(labEqualizerFrustumMatrix);
  labEqualizerGroup.getWorldPosition(labEqualizerWorldPosition);
  labEqualizerVisibilitySphere.center.copy(labEqualizerWorldPosition);
  labEqualizerState.visibleInCamera = labEqualizerFrustum.intersectsSphere(labEqualizerVisibilitySphere);
  setLabEqualizerRenderVisible(postRevealPerfIsolationState.equalizer && labEqualizerState.visibleInCamera);
  return labEqualizerState.visibleInCamera;
}

function labEqualizerSampleIntervalMs() {
  if (!labEqualizerState.playing) return LAB_EQUALIZER_IDLE_SAMPLE_INTERVAL_MS;
  if (labEqualizerState.renderVisible) return LAB_EQUALIZER_AUDIO_SAMPLE_INTERVAL_MS;
  return TRON_RUNNER_BEAT_PULSE_AUDIO_KICK_ENABLED
    ? LAB_EQUALIZER_AUDIO_KICK_SAMPLE_INTERVAL_MS
    : LAB_EQUALIZER_OFFSCREEN_SAMPLE_INTERVAL_MS;
}

function labEqualizerTextureIntervalMs() {
  if (!labEqualizerState.renderVisible) return 0;
  if (!labEqualizerState.playing) return 1000;
  const baseInterval = labEqualizerState.visibleInCamera ? LAB_EQUALIZER_TEXTURE_INTERVAL_MS : LAB_EQUALIZER_OFFSCREEN_TEXTURE_INTERVAL_MS;
  if (!labEqualizerState.visibleInCamera) {
    labEqualizerState.adaptiveTextureFps = Number((1000 / Math.max(1, baseInterval)).toFixed(1));
    return baseInterval;
  }
  const targetHz = Math.max(1, performanceLiveMetrics?.targetHz || 60);
  const measuredFps = Number.isFinite(deps.getLatestMeasuredFps()) ? deps.getLatestMeasuredFps() : 0;
  let interval = baseInterval;
  if (measuredFps > 0 && measuredFps < targetHz * 0.76) interval = LAB_EQUALIZER_TEXTURE_ADAPTIVE_HARD_INTERVAL_MS;
  else if (measuredFps > 0 && measuredFps < targetHz * 0.92) interval = LAB_EQUALIZER_TEXTURE_ADAPTIVE_SOFT_INTERVAL_MS;
  labEqualizerState.adaptiveTextureFps = Number((1000 / Math.max(1, interval)).toFixed(1));
  return interval;
}

function addLabEqualizerFrame(group, width, height, z = 0.48) {
  const hw = width / 2;
  const hh = height / 2;
  group.add(elStrip([-hw, -hh, z], [ hw, -hh, z], 0x123b36, 0.08, { depthWrite: false }));
  group.add(elStrip([ hw, -hh, z], [ hw,  hh, z], 0x123b36, 0.08, { depthWrite: false }));
  group.add(elStrip([ hw,  hh, z], [-hw,  hh, z], 0x123b36, 0.08, { depthWrite: false }));
  group.add(elStrip([-hw,  hh, z], [-hw, -hh, z], 0x123b36, 0.08, { depthWrite: false }));
}

function labEqualizerMixHue(from, to, t) {
  let delta = to - from;
  if (Math.abs(delta) > 180) delta += delta > 0 ? -360 : 360;
  return (from + delta * THREE.MathUtils.clamp(t, 0, 1) + 360) % 360;
}

function labEqualizerColumnHue(column) {
  const cachedHue = labEqualizerBandMetadata[column]?.hue;
  if (Number.isFinite(cachedHue)) return cachedHue;
  const t = LAB_EQUALIZER_BAR_COUNT <= 1 ? 0 : column / (LAB_EQUALIZER_BAR_COUNT - 1);
  const stops = [
    [0.00, 222],
    [0.16, 198],
    [0.30, 186],
    [0.40, 292],
    [0.48, 348],
    [0.58, 30],
    [0.68, 62],
    [0.78, 124],
    [1.00, 198],
  ];
  for (let index = 0; index < stops.length - 1; index += 1) {
    const [startT, startHue] = stops[index];
    const [endT, endHue] = stops[index + 1];
    if (t <= endT) {
      return labEqualizerMixHue(startHue, endHue, (t - startT) / Math.max(0.001, endT - startT));
    }
  }
  return stops[stops.length - 1][1];
}

function labEqualizerPulseColorGroup(column) {
  return labEqualizerBandMetadata[column]?.pulseGroup || labEqualizerPulseColorGroupFromHue(labEqualizerColumnHue(column));
}

function labEqualizerPulsePowerForColumn(column) {
  const group = labEqualizerPulseColorGroup(column);
  const groupPower = Number(labEqualizerState[`pulse${group}`] ?? 1);
  return THREE.MathUtils.clamp(labEqualizerState.pulseMaster * groupPower, 0, 9);
}

function labEqualizerCrtBlockColor(column, row, rows, now, peakLevel, alphaScale = 1, beatPulse = 0) {
  const rowT = rows <= 1 ? 0 : row / (rows - 1);
  const centerBand = 0.47 + Math.sin(now * 0.0014 + column * 0.51) * 0.018;
  const bandMix = Math.exp(-Math.pow((rowT - centerBand) / 0.13, 2));
  const edgeGlow = 1 - Math.abs((column / Math.max(1, LAB_EQUALIZER_BAR_COUNT - 1)) * 2 - 1);
  const cellPulse = beatPulse * labEqualizerPulsePowerForColumn(column);
  const hue = labEqualizerMixHue(labEqualizerColumnHue(column), 184, bandMix * 0.20);
  const saturation = THREE.MathUtils.clamp(100 - bandMix * 10 + cellPulse * 5, 88, 100);
  const light = THREE.MathUtils.clamp(38 + rowT * 15 + bandMix * 16 + edgeGlow * 4 + peakLevel * 5 + cellPulse * 10, 32, 82);
  const alpha = THREE.MathUtils.clamp((0.88 + bandMix * 0.06 + cellPulse * 0.05) * alphaScale, 0, 1);
  return `hsla(${hue.toFixed(1)}, ${saturation.toFixed(1)}%, ${light.toFixed(1)}%, ${alpha.toFixed(3)})`;
}

function labEqualizerPeakBlockColor(column, row, rows, now, beatPulse = 0) {
  const rowT = rows <= 1 ? 0 : row / (rows - 1);
  const bandMix = Math.exp(-Math.pow((rowT - 0.52) / 0.16, 2));
  const cellPulse = beatPulse * labEqualizerPulsePowerForColumn(column);
  const hue = labEqualizerMixHue(labEqualizerColumnHue(column), 184, bandMix * 0.14);
  const saturation = THREE.MathUtils.clamp(98 + cellPulse * 2, 94, 100);
  const light = THREE.MathUtils.clamp(54 + rowT * 17 + bandMix * 8 + cellPulse * 12, 48, 82);
  return `hsla(${hue.toFixed(1)}, ${saturation.toFixed(1)}%, ${light.toFixed(1)}%, 0.98)`;
}

function labEqualizerBeatPulse(bassEnergy, dt) {
  if (!labEqualizerState.playing) {
    labEqualizerBassEnvelope = 0;
    labEqualizerBassPulse = 0;
    return 0;
  }
  const attack = 1 - Math.exp(-dt * 14);
  const release = 1 - Math.exp(-dt * 2.2);
  const envelopeLerp = bassEnergy > labEqualizerBassEnvelope ? attack : release;
  labEqualizerBassEnvelope += (bassEnergy - labEqualizerBassEnvelope) * envelopeLerp;
  const transient = Math.max(0, bassEnergy - labEqualizerBassEnvelope * 1.04) * 4.6;
  labEqualizerBassPulse = Math.max(transient, labEqualizerBassPulse - dt * 3.4);
  const bassBody = Math.max(0, bassEnergy - 0.34) * 0.34;
  return THREE.MathUtils.clamp(labEqualizerBassPulse + bassBody, 0, 1);
}

function labEqualizerCanvasLayout() {
  const width = LAB_EQUALIZER_CANVAS_WIDTH;
  const height = LAB_EQUALIZER_CANVAS_HEIGHT;
  const marginX = 28;
  const marginY = 38;
  const areaW = width - marginX * 2;
  const areaH = 296;
  const columnGap = 5;
  const rowGap = 1;
  const columnW = (areaW - columnGap * (LAB_EQUALIZER_BAR_COUNT - 1)) / LAB_EQUALIZER_BAR_COUNT;
  const rowH = (areaH - rowGap * (LAB_EQUALIZER_SEGMENT_ROWS - 1)) / LAB_EQUALIZER_SEGMENT_ROWS;
  return {
    width,
    height,
    marginX,
    marginY,
    areaW,
    areaH,
    reflectionTop: marginY + areaH + 10,
    reflectionH: 62,
    labelY: height - 12,
    columnGap,
    rowGap,
    columnW,
    rowH,
    bottomY: marginY + areaH,
  };
}

function drawLabEqualizerStaticCrtOverlay(ctx, width, height) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  for (let y = 0; y < height; y += 4) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, y, width, 1.5);
  }
  for (let x = 0; x < width; x += 6) {
    ctx.fillStyle = 'rgba(255, 60, 60, 0.018)';
    ctx.fillRect(x, 0, 1, height);
    ctx.fillStyle = 'rgba(80, 255, 120, 0.014)';
    ctx.fillRect(x + 2, 0, 1, height);
    ctx.fillStyle = 'rgba(80, 180, 255, 0.018)';
    ctx.fillRect(x + 4, 0, 1, height);
  }
  ctx.restore();

  ctx.save();
  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.50, width * 0.12, width * 0.5, height * 0.50, width * 0.68);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.62, 'rgba(0, 0, 0, 0.06)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.30)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawLabEqualizerDynamicCrtRoll(ctx, width, height, now, peakLevel) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const rollY = (now * 0.038) % (height + 120) - 60;
  const roll = ctx.createLinearGradient(0, rollY - 34, 0, rollY + 34);
  roll.addColorStop(0, 'rgba(0, 0, 0, 0)');
  roll.addColorStop(0.5, `rgba(170, 255, 230, ${(0.035 + peakLevel * 0.030).toFixed(3)})`);
  roll.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = roll;
  ctx.fillRect(0, rollY - 34, width, 68);
  ctx.restore();
}

function drawLabEqualizerStaticCanvas() {
  ensureLabEqualizerBandMetadata();
  const signature = [
    LAB_EQUALIZER_CANVAS_WIDTH,
    LAB_EQUALIZER_CANVAS_HEIGHT,
    LAB_EQUALIZER_BAR_COUNT,
    LAB_EQUALIZER_SEGMENT_ROWS,
    labEqualizerBandMetadataSignature,
  ].join(':');
  if (signature === labEqualizerStaticTextureSignature && labEqualizerStaticCanvas) return;
  const ctx = labEqualizerStaticCtx;
  if (!ctx) return;
  const {
    width,
    height,
    marginX,
    areaW,
    areaH,
    columnGap,
    rowGap,
    columnW,
    rowH,
    bottomY,
    labelY,
  } = labEqualizerCanvasLayout();

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgb(1 3 4)';
  ctx.fillRect(0, 0, width, height);

  const tubeGlow = ctx.createRadialGradient(width * 0.50, height * 0.45, width * 0.06, width * 0.50, height * 0.45, width * 0.62);
  tubeGlow.addColorStop(0, 'rgba(0, 250, 210, 0.020)');
  tubeGlow.addColorStop(0.46, 'rgba(0, 34, 36, 0.22)');
  tubeGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = tubeGlow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0, 1, 2, 0.98)';
  for (let column = 0; column < LAB_EQUALIZER_BAR_COUNT; column += 1) {
    const x = marginX + column * (columnW + columnGap);
    for (let row = 0; row < LAB_EQUALIZER_SEGMENT_ROWS; row += 1) {
      const y = bottomY - (row + 1) * rowH - row * rowGap;
      ctx.fillRect(x, y, columnW, rowH);
    }
  }
  ctx.restore();

  ctx.save();
  ctx.font = "700 8px 'JetBrains Mono', ui-monospace, monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(174, 255, 238, 0.68)';
  for (let column = 0; column < LAB_EQUALIZER_BAR_COUNT; column += 1) {
    const x = marginX + column * (columnW + columnGap) + columnW * 0.52;
    const label = labEqualizerBandMetadataFor(column)?.label || labEqualizerFormatHz(labEqualizerBandCenterHz(column));
    ctx.fillText(label, x, labelY);
  }
  ctx.restore();

  drawLabEqualizerStaticCrtOverlay(ctx, width, height);
  labEqualizerStaticTextureSignature = signature;
  labEqualizerState.staticTextureDrawCount += 1;
}

function drawLabEqualizerCanvas(now, averageLevel, peakLevel, beatPulse = 0) {
  ensureLabEqualizerVisualResources();
  const ctx = labEqualizerCtx;
  if (!ctx) return;

  drawLabEqualizerStaticCanvas();
  const {
    width,
    height,
    marginX,
    areaW,
    reflectionTop,
    reflectionH,
    columnGap,
    rowGap,
    columnW,
    rowH,
    bottomY,
  } = labEqualizerCanvasLayout();
  const reflectionStrength = labEqualizerState.reflectionStrength;

  if (labEqualizerStaticCanvas) ctx.drawImage(labEqualizerStaticCanvas, 0, 0);
  else ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const liveGlow = ctx.createRadialGradient(width * 0.50, height * 0.45, width * 0.08, width * 0.50, height * 0.45, width * 0.58);
  liveGlow.addColorStop(0, `rgba(0, 250, 210, ${(averageLevel * 0.018).toFixed(3)})`);
  liveGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = liveGlow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  for (let column = 0; column < LAB_EQUALIZER_BAR_COUNT; column += 1) {
    const x = marginX + column * (columnW + columnGap);
    const level = THREE.MathUtils.clamp(labEqualizerLevels[column] ?? 0, 0, 1);
    const activeRows = THREE.MathUtils.clamp(Math.round(labEqualizerLevelToRows(level)), 0, LAB_EQUALIZER_SEGMENT_ROWS);
    for (let row = 0; row < activeRows; row += 1) {
      const y = bottomY - (row + 1) * rowH - row * rowGap;
      ctx.fillStyle = labEqualizerCrtBlockColor(column, row, LAB_EQUALIZER_SEGMENT_ROWS, now, peakLevel, 1, beatPulse);
      ctx.fillRect(x, y, columnW, rowH);
      ctx.fillStyle = labEqualizerCrtBlockColor(column, row, LAB_EQUALIZER_SEGMENT_ROWS, now, 1, 0.78, beatPulse);
      ctx.fillRect(x + 0.4, y + 0.35, Math.max(1, columnW - 0.8), Math.max(1, rowH - 0.7));
      const leftLine = x + Math.sin(now * 0.003 + column) * 0.8;
      ctx.fillStyle = labEqualizerCrtBlockColor(column, row, LAB_EQUALIZER_SEGMENT_ROWS, now, 1, 0.14, beatPulse);
      ctx.fillRect(leftLine, y + 0.35, Math.max(1, columnW * 0.035), Math.max(1, rowH - 0.7));
    }
  }
  ctx.restore();

  if (reflectionStrength > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const reflectionGradient = ctx.createLinearGradient(0, reflectionTop, 0, reflectionTop + reflectionH);
    reflectionGradient.addColorStop(0, `rgba(0, 0, 0, ${THREE.MathUtils.clamp(0.42 * reflectionStrength, 0, 0.88).toFixed(3)})`);
    reflectionGradient.addColorStop(0.52, `rgba(0, 0, 0, ${THREE.MathUtils.clamp(0.16 * reflectionStrength, 0, 0.55).toFixed(3)})`);
    reflectionGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.rect(marginX, reflectionTop, areaW, reflectionH);
    ctx.clip();
    for (let column = 0; column < LAB_EQUALIZER_BAR_COUNT; column += 1) {
      const x = marginX + column * (columnW + columnGap);
      const level = THREE.MathUtils.clamp(labEqualizerLevels[column] ?? 0, 0, 1);
      const activeRows = THREE.MathUtils.clamp(Math.round(labEqualizerLevelToRows(level)), 0, LAB_EQUALIZER_SEGMENT_ROWS);
      for (let row = 0; row < activeRows; row += 1) {
        const y = bottomY - (row + 1) * rowH - row * rowGap;
        const distance = bottomY - (y + rowH * 0.5);
        const reflectedY = reflectionTop + distance * 0.33;
        const fade = THREE.MathUtils.clamp(1 - ((reflectedY - reflectionTop) / reflectionH), 0, 1);
        ctx.globalAlpha = THREE.MathUtils.clamp(0.32 * reflectionStrength, 0, 0.95) * fade;
        ctx.fillStyle = labEqualizerCrtBlockColor(column, row, LAB_EQUALIZER_SEGMENT_ROWS, now, peakLevel, 0.88, beatPulse);
        ctx.fillRect(x, reflectedY, columnW, Math.max(1, rowH * 0.55));
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = reflectionGradient;
    ctx.fillRect(marginX, reflectionTop, areaW, reflectionH);
    ctx.restore();
  }

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  for (let column = 0; column < LAB_EQUALIZER_BAR_COUNT; column += 1) {
    const x = marginX + column * (columnW + columnGap);
    const level = THREE.MathUtils.clamp(labEqualizerLevels[column] ?? 0, 0, 1);
    const activeRowsFloat = labEqualizerLevelToRows(level);
    const peakRows = THREE.MathUtils.clamp(labEqualizerPeaks[column] ?? 0, 0, LAB_EQUALIZER_SEGMENT_ROWS);
    const peakRow = THREE.MathUtils.clamp(Math.ceil(peakRows) - 1, 0, LAB_EQUALIZER_SEGMENT_ROWS - 1);
    if (peakRows >= activeRowsFloat - 0.25 && peakRows > 1.2) {
      const y = bottomY - (peakRow + 1) * rowH - peakRow * rowGap;
      ctx.fillStyle = labEqualizerPeakBlockColor(column, peakRow, LAB_EQUALIZER_SEGMENT_ROWS, now, beatPulse);
      ctx.fillRect(x, y, columnW, rowH);
    }
  }
  ctx.restore();

  drawLabEqualizerDynamicCrtRoll(ctx, width, height, now, peakLevel);

  labEqualizerTexture.needsUpdate = true;
}

function prewarmLabEqualizerTexture() {
  if (!labEqualizerTexture || labEqualizerPrewarmed) return;
  try {
    renderer.initTexture?.(labEqualizerTexture);
    labEqualizerPrewarmed = true;
  } catch {
    labEqualizerPrewarmed = false;
  }
}

export function buildLabEqualizer({ visible = deps.getCityRevealComplete() } = {}) {
  if (!LAB_EQUALIZER_ENABLED || labEqualizerState.enabled) return;
  ensureLabEqualizerVisualResources();
  if (!labEqualizerPanelMat || !labEqualizerDisplayMat) return;
  labEqualizerState.enabled = true;
  labEqualizerGroup.visible = Boolean(visible);
  labEqualizerGroup.scale.setScalar(LAB_EQUALIZER_SCENE_SCALE);
  syncLabEqualizerPose();
  labEqualizerGroup.renderOrder = LAB_EQUALIZER_GROUP_RENDER_ORDER;

  const panel = new THREE.Mesh(new THREE.PlaneGeometry(LAB_EQUALIZER_BOARD_WIDTH, LAB_EQUALIZER_BOARD_HEIGHT), labEqualizerPanelMat);
  panel.name = 'real-demo-phosphor-equalizer-panel';
  panel.renderOrder = LAB_EQUALIZER_PANEL_RENDER_ORDER;
  panel.frustumCulled = true;
  labEqualizerGroup.add(panel);
  addLabEqualizerFrame(labEqualizerGroup, LAB_EQUALIZER_BOARD_WIDTH, LAB_EQUALIZER_BOARD_HEIGHT, 0.48);
  labEqualizerDisplayMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LAB_EQUALIZER_BOARD_WIDTH * 0.96, LAB_EQUALIZER_BOARD_HEIGHT * 0.92),
    labEqualizerDisplayMat,
  );
  labEqualizerDisplayMesh.name = 'real-demo-equalizer-canvas';
  labEqualizerDisplayMesh.position.z = 0.54;
  labEqualizerDisplayMesh.renderOrder = LAB_EQUALIZER_DISPLAY_RENDER_ORDER;
  labEqualizerDisplayMesh.frustumCulled = true;
  labEqualizerGroup.add(labEqualizerDisplayMesh);
  scene.add(labEqualizerGroup);
  labEqualizerState.boardChildren = labEqualizerGroup.children.length;
  drawLabEqualizerCanvas(performance.now(), 0, 0);
  prewarmLabEqualizerTexture();
  applyLabEqualizerControlsFromUI();
  updateLabEqualizerButton();
}

function activateLabEqualizerAfterReveal() {
  if (!LAB_EQUALIZER_ENABLED || labEqualizerActivatedAfterReveal || !deps.getCityRevealComplete()) return false;
  buildLabEqualizer();
  labEqualizerGroup.visible = true;
  ensureLabEqualizerAudioGraphIfNeeded(performance.now(), true);
  labEqualizerActivatedAfterReveal = true;
  labEqualizerStartedAt = performance.now();
  return true;
}

export function updateLabEqualizer(now, dt) {
  if (!deps.getCityRevealComplete()) return;
  activateLabEqualizerAfterReveal();
  if (!labEqualizerState.enabled) return;
  syncLabEqualizerPoseIfNeeded(now);
  updateLabEqualizerVisibility(now);
  setLabEqualizerRenderVisible(postRevealPerfIsolationState.equalizer && labEqualizerState.visibleInCamera);
  ensureLabEqualizerAudioGraphIfNeeded(now);
  labEqualizerState.playing = Boolean(tronSoundtrack.playing);

  const sampleInterval = labEqualizerSampleIntervalMs();
  if (sampleInterval !== labEqualizerLastSampleIntervalRaw) {
    labEqualizerLastSampleIntervalRaw = sampleInterval;
    labEqualizerState.sampleIntervalMs = Number(sampleInterval.toFixed(1));
  }
  labEqualizerAccumulatedDt += dt;
  if (now - labEqualizerLastSampleAt < sampleInterval) {
    labEqualizerState.skippedFrames += 1;
    return;
  }
  const sampleElapsedMs = Number.isFinite(labEqualizerLastSampleAt) ? now - labEqualizerLastSampleAt : sampleInterval;
  const sampleDt = THREE.MathUtils.clamp(labEqualizerAccumulatedDt || dt, 0.001, 0.18);
  labEqualizerLastSampleAt = now;
  labEqualizerAccumulatedDt = 0;
  labEqualizerState.sampleCount += 1;
  labEqualizerState.analyserFps = Number((1000 / Math.max(1, sampleElapsedMs)).toFixed(1));

  if (labEqualizerAnalyser && labEqualizerFrequencyData && labEqualizerState.playing) {
    labEqualizerAnalyser.getFloatFrequencyData(labEqualizerFrequencyData);
    ensureLabEqualizerBandMetadata();
  }
  let levelSum = 0;
  let peakLevel = 0;
  let bassEnergySum = 0;
  let bassEnergyWeight = 0;
  const peakFallRowsPerSecond = labEqualizerPeakFallRowsPerSecond();
  let framePeakDb = LAB_EQUALIZER_LEVEL_DB_FLOOR;
  for (let index = 0; index < LAB_EQUALIZER_BAR_COUNT; index += 1) {
    framePeakDb = Math.max(framePeakDb, labEqualizerBandWeightedDb(index));
  }
  for (let index = 0; index < LAB_EQUALIZER_BAR_COUNT; index += 1) {
    const target = labEqualizerBandLevel(index, framePeakDb);
    labEqualizerTargetLevels[index] = target;
    const attack = 1 - Math.exp(-sampleDt * 30);
    const release = 1 - Math.exp(-sampleDt * 10);
    const smooth = target > labEqualizerLevels[index] ? attack : release;
    labEqualizerLevels[index] += (target - labEqualizerLevels[index]) * smooth;
    const level = THREE.MathUtils.clamp(labEqualizerLevels[index], 0, 1);
    const activeRows = labEqualizerLevelToRows(level);
    const targetRows = labEqualizerLevelToRows(target);
    const incomingPeakRows = Math.max(activeRows, targetRows);
    const currentPeakRows = labEqualizerPeaks[index] || activeRows;
    if (incomingPeakRows >= currentPeakRows - 0.05) {
      labEqualizerPeaks[index] = incomingPeakRows;
      labEqualizerPeakHoldTimers[index] = LAB_EQUALIZER_PEAK_HOLD_SECONDS;
    } else if (labEqualizerPeakHoldTimers[index] > 0) {
      labEqualizerPeakHoldTimers[index] = Math.max(0, labEqualizerPeakHoldTimers[index] - sampleDt);
      labEqualizerPeaks[index] = currentPeakRows;
    } else {
      labEqualizerPeaks[index] = Math.max(activeRows, currentPeakRows - peakFallRowsPerSecond * sampleDt);
    }
    levelSum += level;
    peakLevel = Math.max(peakLevel, level);
    if (index < LAB_EQUALIZER_BASS_BAND_COUNT) {
      const weight = 1 - index * 0.16;
      bassEnergySum += target * weight;
      bassEnergyWeight += weight;
    }
  }
  const bassEnergy = bassEnergyWeight > 0 ? bassEnergySum / bassEnergyWeight : 0;
  labEqualizerState.averageLevel = levelSum / LAB_EQUALIZER_BAR_COUNT;
  labEqualizerState.peakLevel = peakLevel;
  labEqualizerState.bassEnergy = bassEnergy;
  labEqualizerState.beatPulse = labEqualizerBeatPulse(bassEnergy, sampleDt);
  const textureInterval = labEqualizerTextureIntervalMs();
  labEqualizerState.textureIntervalMs = Number(textureInterval.toFixed(1));
  if (!labEqualizerState.renderVisible) {
    labEqualizerState.textureFps = 0;
    return;
  }
  if (labEqualizerForceTextureDraw || now - labEqualizerLastTextureAt >= textureInterval) {
    if (!shouldDrawLabEqualizerTexture(now, labEqualizerState.averageLevel, peakLevel, labEqualizerState.beatPulse)) {
      labEqualizerLastTextureAt = now;
      labEqualizerState.textureFps = 0;
      return;
    }
    drawLabEqualizerCanvas(now, labEqualizerState.averageLevel, peakLevel, labEqualizerState.beatPulse);
    const textureElapsedMs = Number.isFinite(labEqualizerLastTextureAt) ? now - labEqualizerLastTextureAt : textureInterval;
    labEqualizerLastTextureAt = now;
    labEqualizerLastTextureDrawAt = now;
    labEqualizerLastTextureSignature = labEqualizerTextureSignature(labEqualizerState.averageLevel, peakLevel, labEqualizerState.beatPulse);
    labEqualizerForceTextureDraw = false;
    labEqualizerState.textureUpdateCount += 1;
    labEqualizerState.textureFps = Number((1000 / Math.max(1, textureElapsedMs)).toFixed(1));
  }
}

function labEqualizerCanvasColorProbe() {
  if (!labEqualizerCtx) return null;
  const width = LAB_EQUALIZER_CANVAS_WIDTH;
  const height = LAB_EQUALIZER_CANVAS_HEIGHT;
  const sampleRects = [
    [Math.round(width * 0.18), Math.round(height * 0.25), 24, 24],
    [Math.round(width * 0.42), Math.round(height * 0.34), 24, 24],
    [Math.round(width * 0.58), Math.round(height * 0.34), 24, 24],
    [Math.round(width * 0.72), Math.round(height * 0.30), 24, 24],
  ];
  const samples = sampleRects.map(([x, y, w, h]) => {
    const data = labEqualizerCtx.getImageData(x, y, w, h).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let index = 0; index < data.length; index += 4) {
      const max = Math.max(data[index], data[index + 1], data[index + 2]);
      if (max < 24) continue;
      r += data[index];
      g += data[index + 1];
      b += data[index + 2];
      count += 1;
    }
    if (!count) return { x, y, count: 0, rgb: [0, 0, 0] };
    return {
      x,
      y,
      count,
      rgb: [Math.round(r / count), Math.round(g / count), Math.round(b / count)],
    };
  });
  return samples;
}

function labEqualizerInspect() {
  return {
    ...labEqualizerState,
    averageLevel: Number(labEqualizerState.averageLevel.toFixed(3)),
    peakLevel: Number(labEqualizerState.peakLevel.toFixed(3)),
    bassEnergy: Number(labEqualizerState.bassEnergy.toFixed(3)),
    beatPulse: Number(labEqualizerState.beatPulse.toFixed(3)),
    volume: Number(labEqualizerState.volume.toFixed(2)),
    sensitivity: Number(labEqualizerState.sensitivity.toFixed(2)),
    peakFall: Number(labEqualizerState.peakFall.toFixed(1)),
    reflectionStrength: Number(labEqualizerState.reflectionStrength.toFixed(2)),
    pulse: {
      master: Number(labEqualizerState.pulseMaster.toFixed(2)),
      blue: Number(labEqualizerState.pulseBlue.toFixed(2)),
      cyan: Number(labEqualizerState.pulseCyan.toFixed(2)),
      magenta: Number(labEqualizerState.pulseMagenta.toFixed(2)),
      red: Number(labEqualizerState.pulseRed.toFixed(2)),
      yellow: Number(labEqualizerState.pulseYellow.toFixed(2)),
      green: Number(labEqualizerState.pulseGreen.toFixed(2)),
    },
    audioUrl: LAB_EQUALIZER_AUDIO_URL,
    beatPulseSource: 'bass-transient',
    peakFallRowsPerSecond: Number(labEqualizerPeakFallRowsPerSecond().toFixed(2)),
    analyserReady: Boolean(labEqualizerAnalyser),
    visualReady: Boolean(labEqualizerCanvas && labEqualizerTexture),
    renderVisible: Boolean(labEqualizerState.renderVisible),
    bandMetadataSignature: labEqualizerBandMetadataSignature,
    activatedAfterReveal: labEqualizerActivatedAfterReveal,
    cityRevealComplete: deps.getCityRevealComplete(),
    boardChildren: labEqualizerGroup.children.length,
    renderOrder: {
      group: labEqualizerGroup.renderOrder,
      panel: labEqualizerGroup.children.find((child) => child.name === 'real-demo-phosphor-equalizer-panel')?.renderOrder ?? null,
      display: labEqualizerDisplayMesh?.renderOrder ?? null,
      displayDepthTest: Boolean(labEqualizerDisplayMat?.depthTest),
      displayDepthWrite: Boolean(labEqualizerDisplayMat?.depthWrite),
    },
    activeBands: labEqualizerLevels.filter((level) => level > 0.01).length,
    spectrumMode: 'float-db-neutral',
    analyserConfig: {
      fftSize: labEqualizerAnalyser?.fftSize || LAB_EQUALIZER_FFT_SIZE,
      minDecibels: labEqualizerAnalyser?.minDecibels ?? LAB_EQUALIZER_ANALYSER_MIN_DB,
      maxDecibels: labEqualizerAnalyser?.maxDecibels ?? LAB_EQUALIZER_ANALYSER_MAX_DB,
      smoothingTimeConstant: labEqualizerAnalyser?.smoothingTimeConstant ?? LAB_EQUALIZER_ANALYSER_SMOOTHING,
      levelFloorDb: LAB_EQUALIZER_LEVEL_DB_FLOOR,
      levelCeilingDb: LAB_EQUALIZER_LEVEL_DB_CEILING,
      relativeRangeDb: LAB_EQUALIZER_RELATIVE_DB_RANGE,
      levelGamma: LAB_EQUALIZER_LEVEL_GAMMA,
      visibleSampleMs: LAB_EQUALIZER_AUDIO_SAMPLE_INTERVAL_MS,
      offscreenSampleMs: LAB_EQUALIZER_OFFSCREEN_SAMPLE_INTERVAL_MS,
      audioKickSampleMs: LAB_EQUALIZER_AUDIO_KICK_SAMPLE_INTERVAL_MS,
      staticTextureRefreshMs: LAB_EQUALIZER_STATIC_TEXTURE_REFRESH_MS,
      visibleTextureMs: LAB_EQUALIZER_TEXTURE_INTERVAL_MS,
      adaptiveSoftTextureMs: LAB_EQUALIZER_TEXTURE_ADAPTIVE_SOFT_INTERVAL_MS,
      adaptiveHardTextureMs: LAB_EQUALIZER_TEXTURE_ADAPTIVE_HARD_INTERVAL_MS,
    },
    bandLevels: labEqualizerLevels.map((level) => Number(level.toFixed(3))),
    bandTargetLevels: labEqualizerTargetLevels.map((level) => Number(level.toFixed(3))),
    bandDb: labEqualizerBandDbValues.map((db) => Number(db.toFixed(1))),
    peakRows: labEqualizerPeaks.map((row) => Number(row.toFixed(2))),
    bandLabels: labEqualizerLevels.map((_, index) => labEqualizerFormatHz(labEqualizerBandCenterHz(index))),
    bandCentersHz: labEqualizerLevels.map((_, index) => Math.round(labEqualizerBandCenterHz(index))),
    canvasColorProbe: null,
    canvasColorProbeManual: 'window.__labEqualizerCanvasColorProbe()',
  };
}
if (typeof window !== 'undefined') {
  window.__labEqualizerInspect = labEqualizerInspect;
  window.__labEqualizerStart = startLabEqualizerAudio;
  window.__labEqualizerToggle = toggleLabEqualizerAudio;
  window.__labEqualizerCanvasColorProbe = labEqualizerCanvasColorProbe;
}

export function initLabEqualizer(d) {
  deps = d;
  ({
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
  } = d);
  LAB_EQUALIZER_AUDIO_URL = TRON_SOUNDTRACK_URL;
  LAB_EQUALIZER_START_WALL_OFFSET_Z = GRID_BLOCK * 3;
}

export function labEqualizerAnalyserPresent() {
  return Boolean(labEqualizerAnalyser);
}

export function labEqualizerAnalyserSampleReady() {
  return Boolean(labEqualizerAnalyser && labEqualizerFrequencyData);
}

export function labEqualizerLastSampleTime() {
  return labEqualizerLastSampleAt;
}
