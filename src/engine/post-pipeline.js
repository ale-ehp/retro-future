// La post-produzione: composer, bloom, FXAA/MSAA, FSR, TAA, look cinematografico,
// risoluzione adattiva e budget delle prestazioni.
//
// Spostato qui da main.js senza cambiare la logica (tappa 5, 2026-09-19). Era il
// dominio piu' intrecciato del file: 35 `let` di modulo letti o scritti anche da
// controlli, boot, ispezione e ciclo dei frame.
//
// Lo stato condiviso sta nell'oggetto `post`, mutabile: fuori di qui `bloomEnabled`
// si scrive `post.bloomEnabled`, e resta una cosa sola invece di trenta coppie di
// getter e setter. Ci finisce un nome SOLO se qualcuno fuori da questo file lo legge
// o lo scrive; quello che serve solo qui dentro resta un `let` o un `const` normale.
//
// Le cose che il dominio prende da main.js (il renderer, la camera, il runtime del
// rivelo, l'isolamento delle prestazioni, i parametri dell'URL) arrivano da
// initPostPipeline(), chiamata in main.js dove stava l'intestazione "post (bloom)":
// nessuna di queste funzioni gira prima di quel punto.
import * as THREE from 'three';
import { getDroneIntroActive, getDroneIntroProgress } from '../camera/drone-intro.js';
import { MOBILE_TARGET_PIXEL_RATIO } from '../config/costanti.js';
import { keys } from '../controls/keyboard.js';
import { mobileTouchControlsState } from '../controls/mobile-movement.js';
import { movementVelocity } from '../controls/movement.js';
import { fxEnabled } from './fx-debug-toggles.js';
import {
  mobilePerformanceProfileState as mobilePerformanceProfileStateCore,
  mobilePerformanceProfileActive as mobilePerformanceProfileActiveCore,
  effectiveRenderScaleForDevice as effectiveRenderScaleForDeviceCore,
  effectivePixelRatioForDevice as effectivePixelRatioForDeviceCore,
  effectiveBloomScaleForDevice as effectiveBloomScaleForDeviceCore,
} from './performance-mobile.js';
import {
  withOutputEncode,
  TRON_FSR_UPSCALE_SHADER,
  TRON_CINEMATIC_LOOK_SHADER,
  cinematicLookRequestedFromParams,
  linearPipelineRequestedFromParams,
} from './shaders.js';
import { TemporalAaPass, temporalAaSettingsFromParams } from './temporal-aa-pass.js';
import {
  cityRevealComplete,
  cityRevealStartedAt,
  cityRevealWireframeEnabled,
  cityRevealWireAlpha,
  isCityRevealPerformanceCritical,
  isCityRevealCompositeActive,
} from '../world/city-reveal-wireframe.js';
import {
  MAX_RENDER_PIXEL_RATIO,
  MIN_DYNAMIC_PIXEL_RATIO,
  MIN_DYNAMIC_QUALITY_SCALE,
  MOBILE_PERFORMANCE_QUERY,
  FULL_HD_RENDER_WIDTH,
  FULL_HD_RENDER_HEIGHT,
  HD_READY_RENDER_WIDTH,
  HD_READY_RENDER_HEIGHT,
  MIN_BLOOM_TARGET_SIZE,
  BLOOM_RESOLUTION_CAP,
  MIN_DYNAMIC_BLOOM_SCALE,
  BLOOM_OPTIMIZED_ACTIVE_MIPS,
  BLOOM_OPTIMIZED_UPDATE_STRIDE,
  BLOOM_BYPASS_STRENGTH,
  BLOOM_TEMPORAL_MOVE_EPS_SQ,
  BLOOM_TEMPORAL_ROTATE_EPS,
  CITY_REVEAL_PERFORMANCE_PIXEL_RATIO_CAP,
  MOBILE_PERFORMANCE_RENDER_SCALE_CAP,
  MOBILE_PERFORMANCE_PIXEL_RATIO_CAP,
  MOBILE_PERFORMANCE_BLOOM_SCALE_CAP,
} from '../world/config.js';

/** @type {any} */ let renderer = null;
/** @type {any} */ let camera = null;
/** @type {any} */ let cityRevealRender = null;
/** @type {any} */ let postRevealPerfIsolationState = null;
/** @type {URLSearchParams} */ let retroBenchmarkSearchParams = new URLSearchParams('');

/** Le dipendenze da main.js, nello stesso punto in cui il codice stava prima. */
export function initPostPipeline(deps) {
  ({ renderer, camera, cityRevealRender, postRevealPerfIsolationState, retroBenchmarkSearchParams } = deps);
}

export const post = {
  // Postprocessing (optional bloom + FXAA). Best-effort — fallback to plain renderer if any module fails.
  composer: null,
  bloomPass: null,
  fxaaPass: null,
  fsrUpscalePass: null,
  cinematicLookPass: null,
  temporalAaPass: null,
  postEnabled: true,
  usePost: false,

  activePixelRatio: 0,
  requestedPixelRatio: MAX_RENDER_PIXEL_RATIO,
  manualRenderScale: 1,
  requestedBloomResolutionScale: 0.32,
  bloomResolutionScale: 0.32,
  bloomEnabled: true,

  antialiasMode: '',
  composerMsaaActive: false,
  fsrUpscaleEnabled: false,
  fsrInternalScale: 1,
  fsrSharpness: 0,
  cinematicLookEnabled: cinematicLookRequestedFromParams(new URLSearchParams(window.location.search)),
  /** @type {any} */ temporalAaSettings: null,
  temporalAaEnabled: false,

  dynamicQualityScale: 1,
  performanceMode: 'auto',
  performanceAdjustCooldown: 0,
  lastBloomTargetKey: '',
  lastFxaaTargetKey: '',
  lastFsrTargetKey: '',
  cityRevealPerformanceProfileActive: false,
  bloomTemporalAppliedStride: 1,
};

// Stato che vive solo qui dentro: nessuno fuori lo legge, quindi resta com'era.
// True when the FSR pass is the one carrying the output encode (?look=classic
// or ?pipeline=0): then it has to stay enabled even with upscale and sharpen off.
let fsrPassCarriesOutputEncode = true;
const mobilePerformanceQuery = window.matchMedia(MOBILE_PERFORMANCE_QUERY);
let lastAppliedRendererPixelRatio = -1;
let lastAppliedComposerPixelRatio = -1;
let lastCinematicLookTargetKey = '';
let temporalAaMotionPrimed = false;
const temporalAaCameraPosition = new THREE.Vector3();
const temporalAaCameraQuaternion = new THREE.Quaternion();

function physicalScreenSize() {
  const dpr = window.devicePixelRatio || 1;
  const screenWidth = Math.max(window.innerWidth, window.screen?.width || 0) * dpr;
  const screenHeight = Math.max(window.innerHeight, window.screen?.height || 0) * dpr;
  return {
    width: Math.round(screenWidth),
    height: Math.round(screenHeight),
  };
}

function adaptiveRenderTarget() {
  const screenSize = physicalScreenSize();
  const longEdge = Math.max(screenSize.width, screenSize.height);
  const shortEdge = Math.min(screenSize.width, screenSize.height);
  const fullHd = longEdge >= FULL_HD_RENDER_WIDTH && shortEdge >= FULL_HD_RENDER_HEIGHT;
  return fullHd
    ? { key: 'full-hd', width: FULL_HD_RENDER_WIDTH, height: FULL_HD_RENDER_HEIGHT }
    : { key: 'hd-ready', width: HD_READY_RENDER_WIDTH, height: HD_READY_RENDER_HEIGHT };
}

function adaptiveRenderTargetPixelRatio() {
  const target = adaptiveRenderTarget();
  const viewportWidth = Math.max(1, window.innerWidth || target.width);
  const viewportHeight = Math.max(1, window.innerHeight || target.height);
  return Math.max(
    MIN_DYNAMIC_PIXEL_RATIO,
    Math.min(
      window.devicePixelRatio || 1,
      target.width / viewportWidth,
      target.height / viewportHeight
    )
  );
}

export function adaptiveRenderTargetInspect() {
  const target = adaptiveRenderTarget();
  return {
    ...target,
    screen: physicalScreenSize(),
    pixelRatioCap: Number(adaptiveRenderTargetPixelRatio().toFixed(3)),
  };
}
// AA mode: fxaa (post pass) | msaa (hardware multisample — cheaper on tile GPUs:
// iOS + Android Adreno/Mali/PowerVR, and Apple-Silicon Macs) | off. ?aa=msaa|fxaa|off
// is authoritative (wins over the control default). msaa falls back to fxaa when
// the WebGL2 context can't provide >=2 samples.
const antialiasUrlOverride = (() => {
  try {
    const p = new URLSearchParams(location.search).get('aa');
    return (p === 'msaa' || p === 'fxaa' || p === 'off') ? p : null;
  } catch { return null; }
})();
// Valori che dipendono dalle funzioni qui sopra: si calcolano dopo l'oggetto,
// nello stesso ordine in cui stavano in main.js.
post.activePixelRatio = Math.min(window.devicePixelRatio || 1, MAX_RENDER_PIXEL_RATIO, adaptiveRenderTargetPixelRatio());
// Default: MSAA on DESKTOP (sharper, higher res hides the lack of temporal AA);
// FXAA on MOBILE. MSAA is spatial-only, so at mobile's lower pixel ratio the
// edges crawl/shimmer during camera motion ("tremble"); FXAA's blur hides it.
// ?aa=msaa|fxaa|off overrides.
post.antialiasMode = antialiasUrlOverride || (mobilePerformanceProfileActive() ? 'fxaa' : 'msaa');
post.temporalAaSettings = temporalAaSettingsFromParams(new URLSearchParams(window.location.search), { mobile: mobilePerformanceProfileActive() });
post.temporalAaEnabled = post.temporalAaSettings.enabled;

// ---------- post (bloom) ----------
export function effectiveComposerPixelRatio() {
  const internalScale = post.fsrUpscaleEnabled
    ? THREE.MathUtils.clamp(post.fsrInternalScale, 0.65, 1)
    : 1;
  return Math.max(MIN_DYNAMIC_PIXEL_RATIO, post.activePixelRatio * internalScale);
}

function isFsrUpscaleActive() {
  return Boolean(post.fsrUpscaleEnabled && post.fsrInternalScale < 0.999);
}

export function syncFsrUpscalePass() {
  if (!post.fsrUpscalePass) return;
  // With upscale off, sharpness 0 and the cinematic look carrying the output
  // encode, the shader collapses to `color = center.rgb`: a full-res copy that
  // costs a whole pass of fill for nothing. Skip it unless it does real work.
  post.fsrUpscalePass.enabled = fsrPassCarriesOutputEncode || isFsrUpscaleActive() || post.fsrSharpness > 0;
  const upscaleActive = isFsrUpscaleActive() ? 1 : 0;
  if (post.fsrUpscalePass.uniforms?.upscaleActive) {
    post.fsrUpscalePass.uniforms.upscaleActive.value = upscaleActive;
  }
  if (post.fsrUpscalePass.uniforms?.sharpness) {
    post.fsrUpscalePass.uniforms.sharpness.value = THREE.MathUtils.clamp(post.fsrSharpness, 0, 1.25);
  }
}

function resizeFsrUpscaleTarget() {
  if (!post.fsrUpscalePass) return;
  const composerPixelRatio = effectiveComposerPixelRatio();
  const width = Math.max(1, Math.round(window.innerWidth * composerPixelRatio));
  const height = Math.max(1, Math.round(window.innerHeight * composerPixelRatio));
  const key = `${width}x${height}`;
  if (key === post.lastFsrTargetKey) return;
  post.lastFsrTargetKey = key;
  post.fsrUpscalePass.uniforms?.sourceResolution?.value?.set(width, height);
}

function resizeCinematicLookTarget() {
  if (!post.cinematicLookPass) return;
  const composerPixelRatio = effectiveComposerPixelRatio();
  const width = Math.max(1, Math.round(window.innerWidth * composerPixelRatio));
  const height = Math.max(1, Math.round(window.innerHeight * composerPixelRatio));
  const key = `${width}x${height}`;
  if (key === lastCinematicLookTargetKey) return;
  lastCinematicLookTargetKey = key;
  post.cinematicLookPass.uniforms?.resolution?.value?.set(width, height);
}

export function syncCinematicLookPass(now = performance.now()) {
  if (!post.cinematicLookPass) return;
  post.cinematicLookPass.enabled = post.cinematicLookEnabled;
  post.cinematicLookPass.uniforms.time.value = now * 0.001;
}

function temporalAaMotionAmount() {
  if (!temporalAaMotionPrimed) {
    temporalAaCameraPosition.copy(camera.position);
    temporalAaCameraQuaternion.copy(camera.quaternion);
    temporalAaMotionPrimed = true;
    return 1;
  }
  const moved = Math.min(1, camera.position.distanceTo(temporalAaCameraPosition) * 2.5);
  const rotated = Math.min(1, (1 - Math.abs(camera.quaternion.dot(temporalAaCameraQuaternion))) * 64);
  temporalAaCameraPosition.copy(camera.position);
  temporalAaCameraQuaternion.copy(camera.quaternion);
  return Math.max(moved, rotated);
}

function temporalAaInteractionMotionAmount() {
  const keyMotion = (
    keys['KeyW'] || keys['ArrowUp'] ||
    keys['KeyS'] || keys['ArrowDown'] ||
    keys['KeyA'] || keys['ArrowLeft'] ||
    keys['KeyD'] || keys['ArrowRight'] ||
    keys['ShiftLeft'] || keys['ShiftRight']
  ) ? 0.72 : 0;
  const mobileMotion = mobileTouchControlsState.movement?.active
    ? Math.min(1, mobileTouchControlsState.movement.magnitude || 0)
    : 0;
  const velocityMotion = Math.min(1, movementVelocity.length() / 24);
  return Math.max(keyMotion, mobileMotion, velocityMotion);
}

export function syncTemporalAaPass() {
  if (!post.temporalAaPass) return;
  const stable = post.temporalAaEnabled && cityRevealComplete && !isCityRevealCompositeActive();
  post.temporalAaPass.enabled = stable;
  if (!stable) {
    post.temporalAaPass.sync({ stable: false, motionAmount: 1 });
    temporalAaMotionPrimed = false;
    return;
  }
  post.temporalAaPass.sync({ stable: true, motionAmount: Math.max(temporalAaMotionAmount(), temporalAaInteractionMotionAmount()) });
}

export function applyTemporalAaJitterForRender() {
  if (!post.temporalAaPass?.enabled) return false;
  const jitter = post.temporalAaPass.nextJitter();
  camera.setViewOffset(
    post.temporalAaPass.width,
    post.temporalAaPass.height,
    jitter.x,
    jitter.y,
    post.temporalAaPass.width,
    post.temporalAaPass.height
  );
  camera.updateProjectionMatrix();
  return true;
}

export function clearTemporalAaJitterForRender(active) {
  if (!active) return;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
}

function resizeBloomTargets() {
  if (!post.bloomPass) return;
  const requestedScale = Math.min(effectiveBloomScaleForDevice(post.requestedBloomResolutionScale), BLOOM_RESOLUTION_CAP);
  post.bloomResolutionScale = Math.max(MIN_DYNAMIC_BLOOM_SCALE, requestedScale * post.dynamicQualityScale);
  const composerPixelRatio = effectiveComposerPixelRatio();
  const width = Math.max(MIN_BLOOM_TARGET_SIZE, Math.round(window.innerWidth * composerPixelRatio * post.bloomResolutionScale));
  const height = Math.max(MIN_BLOOM_TARGET_SIZE, Math.round(window.innerHeight * composerPixelRatio * post.bloomResolutionScale));
  const key = `${width}x${height}`;
  if (key === post.lastBloomTargetKey) return;
  post.lastBloomTargetKey = key;
  post.bloomPass.setSize(width, height);
}

function resizeFxaaTargets() {
  if (!post.fxaaPass) return;
  const composerPixelRatio = effectiveComposerPixelRatio();
  const width = Math.max(1, Math.round(window.innerWidth * composerPixelRatio));
  const height = Math.max(1, Math.round(window.innerHeight * composerPixelRatio));
  const key = `${width}x${height}`;
  if (key === post.lastFxaaTargetKey) return;
  post.lastFxaaTargetKey = key;
  post.fxaaPass?.setSize(width, height);
  resizeFsrUpscaleTarget();
  resizeCinematicLookTarget();
}

function normalizedAntialiasMode(mode) {
  if (mode === 'off') return 'off';
  if (mode === 'msaa') return 'msaa';
  return 'fxaa';
}

// Hardware MSAA sample count the context can give (WebGL2 only). 0 = unsupported.
// Default 2x: 2 samples is far cheaper than 4x (half the MSAA bandwidth/tile) and
// still resolves most edge jaggies. ?aaSamples=N overrides for A/B.
const msaaSamplesParam = (() => {
  try {
    const v = Number(new URLSearchParams(location.search).get('aaSamples'));
    return Number.isFinite(v) && v >= 2 ? Math.round(v) : null;
  } catch { return null; }
})();
export function msaaSampleCount() {
  try {
    if (!renderer.capabilities?.isWebGL2) return 0;
    const max = renderer.getContext().getParameter(renderer.getContext().MAX_SAMPLES) || 0;
    if (max < 2) return 0;
    return Math.min(msaaSamplesParam || 2, max);
  } catch {
    return 0;
  }
}

export function syncGlobalFxaaPass() {
  if (!post.fxaaPass) return;
  // FXAA runs in 'fxaa' mode, OR as the fallback when 'msaa' was requested but the
  // device gave no usable multisampling. fx.fxaa=0 still drops it (composer may
  // then be bypassed to a direct render via shouldUseComposer).
  const fxaaFallback = post.antialiasMode === 'msaa' && !post.composerMsaaActive;
  post.fxaaPass.enabled = (post.antialiasMode === 'fxaa' || fxaaFallback) && fxEnabled('fxaa');
}

function disposeComposerTargets() {
  if (!post.composer) return;
  post.bloomPass?.dispose?.();
  post.fxaaPass?.dispose?.();
  post.fsrUpscalePass?.material?.dispose?.();
  post.fsrUpscalePass?.dispose?.();
  post.cinematicLookPass?.material?.dispose?.();
  post.cinematicLookPass?.dispose?.();
  post.temporalAaPass?.dispose?.();
  post.composer.dispose?.();
  post.bloomPass = null;
  post.fxaaPass = null;
  post.fsrUpscalePass = null;
  post.cinematicLookPass = null;
  post.temporalAaPass = null;
  temporalAaMotionPrimed = false;
  cityRevealRender.clearComposerPasses();
  post.composer = null;
}

function rebuildComposer() {
  if (!post.usePost) return;
  const { EffectComposer, RenderPass, UnrealBloomPass, FXAAPass, ShaderPass } = window.__POST;
  disposeComposerTargets();
  // MSAA mode: give the composer a multisampled render target so the scene pass
  // is antialiased by hardware (tile-resolved, cheap on mobile) instead of the
  // FXAA post pass. Falls back to a plain composer + FXAA if unsupported.
  const msaaSamples = post.antialiasMode === 'msaa' ? msaaSampleCount() : 0;
  post.composerMsaaActive = msaaSamples >= 2;
  if (post.composerMsaaActive) {
    const dpr = effectiveComposerPixelRatio();
    const msaaTarget = new THREE.WebGLRenderTarget(
      Math.max(1, Math.round(window.innerWidth * dpr)),
      Math.max(1, Math.round(window.innerHeight * dpr)),
      { samples: msaaSamples }
    );
    post.composer = new EffectComposer(renderer, msaaTarget);
    // OPTIMIZED: multisample ONLY the scene target (rt1). EffectComposer clones
    // rt1 for rt2, which would make the fullscreen ping-pong passes (bloom/fsr)
    // render at Nx samples for zero AA benefit — pure bandwidth. Swap rt2 for a
    // single-sample target so the scene resolves ONCE and the post passes are 1x.
    try {
      const singleTarget = new THREE.WebGLRenderTarget(msaaTarget.width, msaaTarget.height);
      singleTarget.texture.name = 'EffectComposer.rt2';
      post.composer.renderTarget2?.dispose?.();
      post.composer.renderTarget2 = singleTarget;
    } catch {}
  } else {
    post.composer = new EffectComposer(renderer);
  }
  lastAppliedComposerPixelRatio = -1;
  post.lastBloomTargetKey = '';
  post.lastFxaaTargetKey = '';
  post.lastFsrTargetKey = '';
  lastCinematicLookTargetKey = '';
  post.composer.setSize(window.innerWidth, window.innerHeight);
  post.composer.setPixelRatio(effectiveComposerPixelRatio());
  cityRevealRender.addComposerPasses(post.composer, { RenderPass, FXAAPass });
  post.bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.58,
    0.56,
    0.68
  );
  post.bloomPass.activeMips = BLOOM_OPTIMIZED_ACTIVE_MIPS;
  post.bloomPass.updateStride = BLOOM_OPTIMIZED_UPDATE_STRIDE;
  post.composer.addPass(post.bloomPass);
  post.fxaaPass = new FXAAPass();
  post.composer.addPass(post.fxaaPass);
  // Ordine della catena. Di default il TAA sta prima del grade, cosi' accumula su
  // dati lineari e la grana per-frame non finisce dentro la history, e l'encode di
  // output sta nell'ultimo pass, l'unico che presenta a schermo.
  //
  // ?pipeline=0 rimette la catena storica: encode dentro il pass FSR, con look e
  // TAA che lavorano su valori gia' tonemappati e gia' in sRGB. Serve a confrontare.
  const linearPipeline = linearPipelineRequestedFromParams(retroBenchmarkSearchParams);
  const lastPassIsLook = linearPipeline && post.cinematicLookEnabled;

  function createFsrUpscalePass(encodesOutput) {
    const pass = new ShaderPass(withOutputEncode(TRON_FSR_UPSCALE_SHADER, encodesOutput));
    pass.setSize = (width, height) => {
      pass.uniforms?.sourceResolution?.value?.set(Math.max(1, width), Math.max(1, height));
    };
    return pass;
  }

  function createCinematicLookPass(encodesOutput) {
    const pass = new ShaderPass(withOutputEncode(TRON_CINEMATIC_LOOK_SHADER, encodesOutput));
    pass.setSize = (width, height) => {
      pass.uniforms?.resolution?.value?.set(Math.max(1, width), Math.max(1, height));
    };
    return pass;
  }

  if (linearPipeline && post.temporalAaEnabled) {
    post.temporalAaPass = new TemporalAaPass({ ...post.temporalAaSettings, hdrHistory: true });
    post.temporalAaPass.enabled = false;
    post.composer.addPass(post.temporalAaPass);
  }

  fsrPassCarriesOutputEncode = !lastPassIsLook;
  post.fsrUpscalePass = createFsrUpscalePass(fsrPassCarriesOutputEncode);
  syncFsrUpscalePass();
  post.composer.addPass(post.fsrUpscalePass);

  if (post.cinematicLookEnabled) {
    post.cinematicLookPass = createCinematicLookPass(lastPassIsLook);
    syncCinematicLookPass();
    post.composer.addPass(post.cinematicLookPass);
  }

  if (!linearPipeline && post.temporalAaEnabled) {
    post.temporalAaPass = new TemporalAaPass(post.temporalAaSettings);
    post.temporalAaPass.enabled = false;
    post.composer.addPass(post.temporalAaPass);
  }
  resizeBloomTargets();
  resizeFxaaTargets();
  resizeFsrUpscaleTarget();
  resizeCinematicLookTarget();
  applyBloomEnabled(post.bloomEnabled);
  syncComposerBufferRoles();
}

// EffectComposer captures readBuffer/writeBuffer in its constructor, so swapping
// renderTarget2 for the single-sample target above leaves readBuffer pointing at
// the discarded MSAA clone: the scene pass (which writes into readBuffer) would
// render into a buffer that setSize/setPixelRatio never resize, so the adaptive
// resolution scaler could not shrink the scene at all. Pin the roles instead:
// readBuffer is the multisampled scene target, writeBuffer the 1x ping-pong one.
// Re-asserted every frame because swapBuffers() flips them on each needsSwap pass
// and an odd number of them would leave the scene rendering at 1 sample.
// The bloom pass normally ends by drawing itself additively back into the scene
// buffer — a full-screen draw that, with MSAA on, rasterizes at the scene target's
// sample rate for no antialiasing benefit. The cinematic look pass reads that same
// buffer immediately afterwards, so when nothing sits between the two the addition
// can happen inside the look shader instead: one full-res pass disappears.
//
// Only when the chain really is bloom -> look with nothing in between. FXAA, TAA
// and FSR all process the combined image, so if any of them is enabled the bloom
// has to be in the buffer before they run and the merge is off. Re-evaluated every
// frame because those passes are toggled at runtime.
export function syncBloomLookMerge() {
  if (!post.bloomPass) return;
  const merged = Boolean(
    post.cinematicLookPass?.enabled
    && post.bloomPass.enabled
    && !post.fxaaPass?.enabled
    && !post.temporalAaPass?.enabled
    && !post.fsrUpscalePass?.enabled
  );
  post.bloomPass.compositeToInput = !merged;
  const uniforms = post.cinematicLookPass?.uniforms;
  if (!uniforms) return;
  uniforms.bloomMix.value = merged ? 1 : 0;
  // The clamp reproduces the clipping the old in-place blend got for free from an
  // 8-bit scene target. With MSAA off the composer runs on a HalfFloat target,
  // where the old blend never clipped — clamping there would change the look.
  if (uniforms.bloomClamp) uniforms.bloomClamp.value = post.composerMsaaActive ? 1 : 0;
  // Bound even when unused: the sampler must stay valid, the shader gates on the mix.
  if (uniforms.tBloom) uniforms.tBloom.value = post.bloomPass.bloomTexture?.() || null;
}

export function syncComposerBufferRoles() {
  if (!post.composer || !post.composerMsaaActive) return;
  post.composer.readBuffer = post.composer.renderTarget1;
  post.composer.writeBuffer = post.composer.renderTarget2;
}

export function applyAntialiasControls(mode = post.antialiasMode) {
  // ?aa URL override wins. Otherwise desktop defaults to msaa (control default is
  // fxaa); mobile keeps fxaa (msaa crawls in motion at low res). 'off' honored.
  const effective = antialiasUrlOverride
    || (mobilePerformanceProfileActive() ? mode : (mode === 'off' ? 'off' : 'msaa'));
  post.antialiasMode = normalizedAntialiasMode(effective);
  syncGlobalFxaaPass();
  resizeFxaaTargets();
}

/**
 * Accende o spegne il bloom. Il pannello passa la stringa del <select> ('on'/'off'),
 * il boot passa il booleano di post.bloomEnabled: la funzione accettava entrambi da
 * sempre, ma la firma dedotta dal default diceva solo boolean (2026-09-20: era uno
 * dei tre errori usciti allo scoperto tipizzando createControlEls). Tipi, non un bug.
 * @param {boolean | string} [value] true/false dal boot, 'on'/'off' dal select: conta solo 'off'
 */
export function applyBloomEnabled(value = post.bloomEnabled) {
  post.bloomEnabled = value !== false && value !== 'off';
  if (post.bloomPass) {
    post.bloomPass.enabled = post.bloomEnabled;
    post.bloomPass._hasCachedBloom = false;
  }
}

export function isBloomPassActive() {
  return Boolean(post.bloomPass?.enabled && (post.bloomPass.strength ?? 0) > BLOOM_BYPASS_STRENGTH);
}

export function hasDroneIntroLanded() {
  return Boolean(!getDroneIntroActive() && getDroneIntroProgress() >= 0.999);
}

export function shouldBypassBloomForRevealPerformance() {
  return Boolean(isCityRevealPerformanceCritical() && (mobilePerformanceProfileActive() || !hasDroneIntroLanded()));
}

export function isBloomRevealBypassed() {
  return Boolean(post.bloomEnabled && post.bloomPass && !post.bloomPass.enabled && shouldBypassBloomForRevealPerformance());
}

const bloomTemporalCameraPosition = new THREE.Vector3();
const bloomTemporalCameraQuaternion = new THREE.Quaternion();
let bloomTemporalPrimed = false;

export function invalidateBloomTemporalCache() {
  if (post.bloomPass) post.bloomPass._hasCachedBloom = false;
  bloomTemporalPrimed = false;
  post.bloomTemporalAppliedStride = 1;
}

export function syncBloomTemporalBudget() {
  if (!post.bloomPass) return;
  const active = Boolean(
    post.bloomEnabled &&
    postRevealPerfIsolationState.bloom &&
    post.bloomPass.enabled &&
    !isCityRevealPerformanceCritical()
  );
  if (!active) {
    post.bloomPass.updateStride = 1;
    post.bloomTemporalAppliedStride = 1;
    bloomTemporalPrimed = false;
    return;
  }
  let cameraMoving = true;
  if (bloomTemporalPrimed) {
    const moved = camera.position.distanceToSquared(bloomTemporalCameraPosition) > BLOOM_TEMPORAL_MOVE_EPS_SQ;
    const rotated = 1 - Math.abs(camera.quaternion.dot(bloomTemporalCameraQuaternion)) > BLOOM_TEMPORAL_ROTATE_EPS;
    const revealSweeping = cityRevealStartedAt > 0 && !cityRevealComplete;
    cameraMoving = moved || rotated || getDroneIntroActive() || revealSweeping;
  }
  const nextStride = cameraMoving ? 1 : BLOOM_OPTIMIZED_UPDATE_STRIDE;
  if (post.bloomPass.updateStride !== nextStride) {
    post.bloomPass.updateStride = nextStride;
    if (nextStride === 1) post.bloomPass._hasCachedBloom = false;
  }
  post.bloomTemporalAppliedStride = nextStride;
  bloomTemporalCameraPosition.copy(camera.position);
  bloomTemporalCameraQuaternion.copy(camera.quaternion);
  bloomTemporalPrimed = true;
}

function mobilePerformanceProfileState() {
  return mobilePerformanceProfileStateCore(mobilePerformanceQuery);
}

export function mobilePerformanceProfileActive() {
  return mobilePerformanceProfileActiveCore(mobilePerformanceQuery);
}

export function effectiveRenderScaleForDevice(baseScale = post.manualRenderScale) {
  return effectiveRenderScaleForDeviceCore(mobilePerformanceProfileActive(), baseScale, MOBILE_PERFORMANCE_RENDER_SCALE_CAP);
}

function cityRevealPerformanceWindowActive() {
  return Boolean(
    cityRevealWireframeEnabled &&
    cityRevealWireAlpha > 0.002 &&
    !cityRevealComplete
  );
}

function shouldUseCityRevealPerformanceProfile() {
  return cityRevealPerformanceWindowActive() && !mobilePerformanceProfileActive();
}

export function syncCityRevealPerformanceProfile() {
  const next = shouldUseCityRevealPerformanceProfile();
  if (next === post.cityRevealPerformanceProfileActive) return;
  post.cityRevealPerformanceProfileActive = next;
  applyRenderResolution(post.requestedPixelRatio);
}

export function effectivePixelRatioForDevice(basePixelRatio = post.requestedPixelRatio) {
  return effectivePixelRatioForDeviceCore(mobilePerformanceProfileActive(), basePixelRatio, MOBILE_PERFORMANCE_PIXEL_RATIO_CAP);
}

export function effectiveBloomScaleForDevice(baseScale = post.requestedBloomResolutionScale) {
  return effectiveBloomScaleForDeviceCore(mobilePerformanceProfileActive(), baseScale, MOBILE_PERFORMANCE_BLOOM_SCALE_CAP);
}

export function mobilePerformanceProfileInspect() {
  const state = mobilePerformanceProfileState();
  return {
    active: state.active,
    mode: state.active ? 'mobile-touch' : 'desktop',
    query: MOBILE_PERFORMANCE_QUERY,
    mediaQueryMatches: state.mediaQueryMatches,
    touchPoints: state.touchPoints,
    widthActive: state.widthActive,
    activationReasons: state.reasons,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    renderScaleCap: MOBILE_PERFORMANCE_RENDER_SCALE_CAP,
    pixelRatioCap: MOBILE_PERFORMANCE_PIXEL_RATIO_CAP,
    bloomScaleCap: MOBILE_PERFORMANCE_BLOOM_SCALE_CAP,
    preRevealPixelRatioCap: CITY_REVEAL_PERFORMANCE_PIXEL_RATIO_CAP,
    preRevealPerformanceActive: post.cityRevealPerformanceProfileActive,
    revealPixelRatioCap: CITY_REVEAL_PERFORMANCE_PIXEL_RATIO_CAP,
    revealPerformanceActive: post.cityRevealPerformanceProfileActive,
    effectiveRenderScale: effectiveRenderScaleForDevice(post.manualRenderScale),
    effectivePixelRatioRequest: effectivePixelRatioForDevice(post.requestedPixelRatio),
    effectiveBloomScaleRequest: effectiveBloomScaleForDevice(post.requestedBloomResolutionScale),
  };
}

export function shouldUseComposer() {
  // fx.post=0 master switch: skip the whole composer (RenderPass-to-target +
  // FXAA + FSR output) and fall to a single direct renderer.render(scene,camera)
  // — the cleanest aggregate measure of post-processing fill.
  if (!post.composer || !post.postEnabled || !fxEnabled('post')) return false;
  return Boolean(
    isBloomPassActive() ||
    post.fxaaPass?.enabled ||
    isFsrUpscaleActive() ||
    post.cinematicLookPass?.enabled ||
    post.temporalAaPass?.enabled ||
    (post.antialiasMode === 'msaa' && post.composerMsaaActive) ||
    (cityRevealWireframeEnabled && cityRevealWireAlpha > 0.002)
  );
}

const forcedPixelRatioParam = (() => {
  try {
    const v = Number(new URLSearchParams(window.location.search).get('pixelRatio'));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch { return null; }
})();
export function forcedRenderPixelRatio() {
  if (forcedPixelRatioParam != null) return forcedPixelRatioParam;
  if (mobilePerformanceProfileActive()) return MOBILE_TARGET_PIXEL_RATIO;
  return null;
}

export function applyRenderResolution(requestedPixelRatio) {
  const revealPixelRatioCap = post.cityRevealPerformanceProfileActive
    ? CITY_REVEAL_PERFORMANCE_PIXEL_RATIO_CAP
    : MAX_RENDER_PIXEL_RATIO;
  const forced = forcedRenderPixelRatio();
  if (forced != null) {
    post.activePixelRatio = Math.min(window.devicePixelRatio || 1, forced, revealPixelRatioCap);
  } else {
    const requestedBase = Number.isFinite(requestedPixelRatio) ? requestedPixelRatio : MAX_RENDER_PIXEL_RATIO;
    const requested = effectivePixelRatioForDevice(requestedBase);
    const renderScale = effectiveRenderScaleForDevice(post.manualRenderScale);
    const dynamicPixelRatio = Math.max(MIN_DYNAMIC_PIXEL_RATIO, requested * renderScale * post.dynamicQualityScale);
    post.activePixelRatio = Math.min(
      window.devicePixelRatio || 1,
      dynamicPixelRatio,
      MAX_RENDER_PIXEL_RATIO,
      revealPixelRatioCap,
      adaptiveRenderTargetPixelRatio()
    );
  }
  if (Math.abs(post.activePixelRatio - lastAppliedRendererPixelRatio) > 0.0001) {
    renderer.setPixelRatio(post.activePixelRatio);
    lastAppliedRendererPixelRatio = post.activePixelRatio;
  }
  if (post.composer) {
    const composerPixelRatio = effectiveComposerPixelRatio();
    if (Math.abs(composerPixelRatio - lastAppliedComposerPixelRatio) > 0.0001) {
      post.composer.setPixelRatio(composerPixelRatio);
      lastAppliedComposerPixelRatio = composerPixelRatio;
      post.lastBloomTargetKey = '';
      post.lastFxaaTargetKey = '';
      post.lastFsrTargetKey = '';
      lastCinematicLookTargetKey = '';
    }
    resizeBloomTargets();
    resizeFxaaTargets();
    syncFsrUpscalePass();
    syncCinematicLookPass();
    syncTemporalAaPass();
  }
}

export function tunePerformanceBudget(measuredFps) {
  // A forced/pinned render resolution must stay fixed (benchmark intent) — never
  // let the auto budget claw the quality scale down underneath it.
  if (forcedRenderPixelRatio() != null) return;
  if (post.performanceMode !== 'auto' || !Number.isFinite(measuredFps)) return;
  if (post.performanceAdjustCooldown > 0) {
    post.performanceAdjustCooldown--;
    return;
  }
  const previousScale = post.dynamicQualityScale;
  if (measuredFps < 45) {
    post.dynamicQualityScale = Math.max(MIN_DYNAMIC_QUALITY_SCALE, post.dynamicQualityScale - 0.15);
    post.performanceAdjustCooldown = 6;
  } else if (measuredFps < 54) {
    post.dynamicQualityScale = Math.max(MIN_DYNAMIC_QUALITY_SCALE, post.dynamicQualityScale - 0.10);
    post.performanceAdjustCooldown = 7;
  } else if (measuredFps < 58) {
    post.dynamicQualityScale = Math.max(MIN_DYNAMIC_QUALITY_SCALE, post.dynamicQualityScale - 0.05);
    post.performanceAdjustCooldown = 6;
  } else if (measuredFps > 59.7 && post.dynamicQualityScale < 1) {
    post.dynamicQualityScale = Math.min(1, post.dynamicQualityScale + 0.025);
    post.performanceAdjustCooldown = 8;
  }
  if (Math.abs(post.dynamicQualityScale - previousScale) > 0.0001) applyRenderResolution(post.requestedPixelRatio);
}

export function setupPost() {
  if (!post.usePost) return;
  rebuildComposer();
  applyAntialiasControls(post.antialiasMode);
}
