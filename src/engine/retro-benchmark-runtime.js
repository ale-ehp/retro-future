// Il cablaggio del benchmark: pannello in pagina, fotografia dell'ambiente,
// copia/scarica del JSON e partenza automatica da ?benchmark=1.
//
// Spostato qui da main.js senza cambiare la logica (tappa 5, 2026-09-19). Il motore
// che misura sta gia' in engine/retro-benchmark.js: qui c'e' solo cio' che lo lega
// alla pagina e alla scena. Nessuno dei suoi `let` viene letto da fuori, quindi
// restano `let` normali: non serve un oggetto di stato.
//
// Le dipendenze da main arrivano da initRetroBenchmarkRuntime(), chiamata dove stava
// il codice. Sette di esse (il cielo, le leve del pavimento e delle luci, il rivelo
// dei LED principali, gli FPS misurati) nascono DOPO quel punto in main.js: arrivano
// come getter, perche' vengono lette solo mentre un benchmark gira.
import { fxLevers } from './fx-debug-toggles.js';
import {
  post,
  msaaSampleCount,
  isBloomPassActive,
  shouldUseComposer,
  mobilePerformanceProfileInspect,
  forcedRenderPixelRatio,
  hasDroneIntroLanded,
} from './post-pipeline.js';
import {
  RETRO_BENCHMARK_DEFAULT_DURATION_MS,
  createRetroBenchmarkRuntime,
} from './retro-benchmark.js';
import { cityRevealComplete, isCityRevealCompositeActive } from '../world/city-reveal-wireframe.js';

/** @type {any} */ let renderer = null;
/** @type {any} */ let performanceDiagnostics = null;
/** @type {any} */ let cinematicGroundingSettings = null;
let hexRoadInspect = () => /** @type {any} */ (null);
let getSkyDome = () => /** @type {any} */ (null);
let getFloorLiteActive = () => false;
let getFloorReflectLite = () => false;
let getBuildingReflectLite = () => false;
let getDirLightActive = () => false;
let getCityRevealMainLedReveal = () => /** @type {any} */ (null);
let getLatestMeasuredFps = () => 0;

/** Le dipendenze da main.js, nello stesso punto in cui il codice stava prima. */
export function initRetroBenchmarkRuntime(deps) {
  ({
    renderer, performanceDiagnostics, cinematicGroundingSettings, hexRoadInspect,
    getSkyDome, getFloorLiteActive, getFloorReflectLite, getBuildingReflectLite,
    getDirLightActive, getCityRevealMainLedReveal, getLatestMeasuredFps,
  } = deps);
}

export const retroBenchmarkSearchParams = new URLSearchParams(window.location.search);
const retroBenchmarkQuerySeconds = Number(retroBenchmarkSearchParams.get('benchmarkSeconds'));
const retroBenchmarkDurationMs = Number.isFinite(retroBenchmarkQuerySeconds) && retroBenchmarkQuerySeconds > 0
  ? retroBenchmarkQuerySeconds * 1000
  : RETRO_BENCHMARK_DEFAULT_DURATION_MS;
let retroBenchmarkAutoStartPending = retroBenchmarkSearchParams.get('benchmark') === '1';
// Auto-download the JSON when the benchmark auto-ran from ?benchmark=1 (zero taps
// for a phone capture). Opt out with ?benchmarkDownload=0 (headless tooling reads
// the result programmatically and passes this).
const retroBenchmarkAutoDownload = retroBenchmarkSearchParams.get('benchmarkDownload') !== '0';
let retroBenchmarkPanelEl = null;
let retroBenchmarkCopyButton = null;
let retroBenchmarkDownloadButton = null;

function getRetroBenchmarkGpuInfo() {
  try {
    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      webglVersion: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function retroBenchmarkEnvironment() {
  return {
    browser: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency ?? null,
      deviceMemory: navigator.deviceMemory ?? null,
    },
    screen: {
      width: window.screen?.width ?? null,
      height: window.screen?.height ?? null,
      availWidth: window.screen?.availWidth ?? null,
      availHeight: window.screen?.availHeight ?? null,
      orientation: window.screen?.orientation?.type ?? null,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    },
    canvas: performanceDiagnostics.canvasSummary(),
    gpu: getRetroBenchmarkGpuInfo(),
    quality: {
      performanceMode: post.performanceMode,
      activePixelRatio: post.activePixelRatio,
      requestedPixelRatio: post.requestedPixelRatio,
      manualRenderScale: post.manualRenderScale,
      dynamicQualityScale: post.dynamicQualityScale,
      antialiasMode: post.antialiasMode,
      composerMsaaActive: post.composerMsaaActive,
      msaaSamples: post.composerMsaaActive ? msaaSampleCount() : 0,
      bloomEnabled: post.bloomEnabled,
      bloomActive: isBloomPassActive(),
      bloomPassEnabled: Boolean(post.bloomPass?.enabled),
      bloomResolutionScale: post.bloomResolutionScale,
      composerActive: shouldUseComposer(),
      fsrUpscaleEnabled: post.fsrUpscaleEnabled,
      fsrInternalScale: post.fsrInternalScale,
      fsrSharpness: post.fsrSharpness,
      cinematicLookEnabled: post.cinematicLookEnabled,
      cinematicLookPassEnabled: Boolean(post.cinematicLookPass?.enabled),
      temporalAaEnabled: post.temporalAaEnabled,
      temporalAaPassEnabled: Boolean(post.temporalAaPass?.enabled),
      temporalAaProfile: post.temporalAaSettings.profile,
      cinematicGrounding: cinematicGroundingSettings,
      mobileProfile: mobilePerformanceProfileInspect(),
    },
    // Self-documenting FPS-lever state so each benchmark JSON records exactly
    // which optimizations were active — without this an A/B is untrustworthy.
    levers: {
      skyQuality: getSkyDome().inspectStorm().mainQuality === 0 ? 'balanced' : 'full',
      floorLite: getFloorLiteActive(),
      floorReflect: getFloorReflectLite() ? 'lite' : 'full',
      buildingReflect: getBuildingReflectLite() ? 'lite' : 'full',
      dirLight: getDirLightActive() ? 'on' : 'off',
      antialias: post.antialiasMode,
      msaaActive: post.composerMsaaActive,
      activePixelRatio: post.activePixelRatio,
      forcedPixelRatio: forcedRenderPixelRatio(),
      skyBakeSpread: getSkyDome().inspectSkyBake().spread,
      skyBakeFaceStride: getSkyDome().inspectSkyBake().faceStride,
      cinematicLook: post.cinematicLookEnabled ? 'on' : 'off',
      temporalAa: post.temporalAaEnabled ? 'on' : 'off',
      temporalAaProfile: post.temporalAaSettings.profile,
      // Applied state of every per-subsystem debug toggle (see fx-debug-toggles.js)
      // so each capture self-documents which subsystems were disabled.
      fx: fxLevers(),
      benchmarkSettleMs: RETRO_BENCHMARK_AUTO_SETTLE_MS,
      urlParams: window.location.search || '(none)',
    },
    diagnostics: performanceDiagnostics.summary(getLatestMeasuredFps()),
    hexRoad: hexRoadInspect(),
  };
}

function ensureRetroBenchmarkPanel() {
  if (retroBenchmarkPanelEl) return retroBenchmarkPanelEl;
  retroBenchmarkPanelEl = document.createElement('section');
  retroBenchmarkPanelEl.id = 'retro-benchmark-panel';
  retroBenchmarkPanelEl.className = 'retro-benchmark-panel';
  retroBenchmarkPanelEl.hidden = true;
  retroBenchmarkPanelEl.setAttribute('aria-live', 'polite');
  retroBenchmarkPanelEl.innerHTML = `
    <div class="retro-benchmark-head">
      <strong>Benchmark</strong>
      <span data-retro-benchmark-status>idle</span>
    </div>
    <div class="retro-benchmark-progress" aria-hidden="true"><span data-retro-benchmark-progress></span></div>
    <dl class="retro-benchmark-grid">
      <div><dt>FPS avg</dt><dd data-retro-benchmark-fps-avg>--</dd></div>
      <div><dt>FPS p5</dt><dd data-retro-benchmark-fps-p5>--</dd></div>
      <div><dt>Worst</dt><dd data-retro-benchmark-worst>--</dd></div>
      <div><dt>Draws</dt><dd data-retro-benchmark-draws>--</dd></div>
      <div><dt>Tris</dt><dd data-retro-benchmark-tris>--</dd></div>
      <div><dt>Frames</dt><dd data-retro-benchmark-frames>--</dd></div>
    </dl>
    <div class="retro-benchmark-actions">
      <button type="button" data-retro-benchmark-copy>Copia JSON</button>
      <button type="button" data-retro-benchmark-download>Scarica JSON</button>
      <button type="button" data-retro-benchmark-close>Chiudi</button>
    </div>
  `;
  retroBenchmarkCopyButton = retroBenchmarkPanelEl.querySelector('[data-retro-benchmark-copy]');
  retroBenchmarkDownloadButton = retroBenchmarkPanelEl.querySelector('[data-retro-benchmark-download]');
  retroBenchmarkCopyButton?.addEventListener('click', copyRetroBenchmarkJson);
  retroBenchmarkDownloadButton?.addEventListener('click', downloadRetroBenchmarkJson);
  retroBenchmarkPanelEl.querySelector('[data-retro-benchmark-close]')?.addEventListener('click', () => {
    retroBenchmarkPanelEl.hidden = true;
  });
  document.body.appendChild(retroBenchmarkPanelEl);
  return retroBenchmarkPanelEl;
}

function setRetroBenchmarkPanelText(selector, value) {
  const target = retroBenchmarkPanelEl?.querySelector(selector);
  if (target) target.textContent = value;
}

function formatRetroBenchmarkNumber(value, digits = 1) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : '--';
}

function renderRetroBenchmarkPanel(view) {
  const panel = ensureRetroBenchmarkPanel();
  const summary = view?.summary;
  const fps = summary?.fps || {};
  const frameMs = summary?.frameMs || {};
  const render = summary?.render || {};
  const elapsedSeconds = Math.round((view?.elapsedMs || 0) / 1000);
  const durationSeconds = Math.round((view?.durationMs || retroBenchmarkDurationMs) / 1000);
  const progress = durationSeconds > 0 ? Math.min(100, (elapsedSeconds / durationSeconds) * 100) : 0;

  panel.hidden = false;
  setRetroBenchmarkPanelText('[data-retro-benchmark-status]', `${view?.status || 'idle'} ${elapsedSeconds}s/${durationSeconds}s`);
  setRetroBenchmarkPanelText('[data-retro-benchmark-fps-avg]', formatRetroBenchmarkNumber(fps.avg));
  setRetroBenchmarkPanelText('[data-retro-benchmark-fps-p5]', formatRetroBenchmarkNumber(fps.p5));
  setRetroBenchmarkPanelText('[data-retro-benchmark-worst]', `${formatRetroBenchmarkNumber(frameMs.worst)}ms`);
  setRetroBenchmarkPanelText('[data-retro-benchmark-draws]', String(render.maxCalls ?? '--'));
  setRetroBenchmarkPanelText('[data-retro-benchmark-tris]', String(render.maxTriangles ?? '--'));
  setRetroBenchmarkPanelText('[data-retro-benchmark-frames]', String(summary?.frames ?? view?.frames ?? '--'));
  const progressEl = panel.querySelector('[data-retro-benchmark-progress]');
  if (progressEl) progressEl.style.width = `${progress}%`;
  const hasFrames = Boolean(summary?.frames);
  if (retroBenchmarkCopyButton) retroBenchmarkCopyButton.disabled = !hasFrames;
  if (retroBenchmarkDownloadButton) retroBenchmarkDownloadButton.disabled = !hasFrames;
}

async function writeRetroBenchmarkText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

async function copyRetroBenchmarkJson() {
  const exported = retroBenchmarkRuntime.exportJson();
  if (!exported?.text) return;
  await writeRetroBenchmarkText(exported.text);
  if (!retroBenchmarkCopyButton) return;
  retroBenchmarkCopyButton.textContent = 'Copiato';
  setTimeout(() => {
    if (retroBenchmarkCopyButton) retroBenchmarkCopyButton.textContent = 'Copia JSON';
  }, 1200);
}

function downloadRetroBenchmarkJson() {
  const exported = retroBenchmarkRuntime.exportJson();
  if (!exported?.text) return null;
  const blob = new Blob([exported.text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exported.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return exported;
}

export const retroBenchmarkRuntime = createRetroBenchmarkRuntime({
  getEnvironment: retroBenchmarkEnvironment,
  onUpdate: renderRetroBenchmarkPanel,
  onComplete: (summary) => {
    renderRetroBenchmarkPanel(retroBenchmarkRuntime.inspect());
    console.info('[retro-benchmark]', summary);
    // Zero-tap capture on the phone: when the run auto-started from ?benchmark=1,
    // save the JSON automatically. Best effort — iOS Safari may surface it via the
    // preview/share sheet instead of a silent save; the panel's "Scarica JSON"
    // button stays as the fallback.
    if (retroBenchmarkAutoDownload && summary?.source === 'query-param') {
      try {
        downloadRetroBenchmarkJson();
      } catch (error) {
        console.warn('[retro-benchmark] auto-download failed', error);
      }
    }
  },
});

window.__retroBenchmarkStart = (options = {}) => {
  const requestedDurationMs = Number(options.durationMs);
  retroBenchmarkAutoStartPending = false;
  return retroBenchmarkRuntime.start({
    ...options,
    source: options.source || 'console',
    durationMs: Number.isFinite(requestedDurationMs) && requestedDurationMs > 0
      ? requestedDurationMs
      : retroBenchmarkDurationMs,
  });
};
window.__retroBenchmarkInspect = () => retroBenchmarkRuntime.inspect();
window.__retroBenchmarkDownload = () => downloadRetroBenchmarkJson();

// The auto-run must measure STEADY STATE, not the intro. cityRevealComplete alone
// is too early: the wireframe/roadGrid/reveal-sky composer passes and the main-LED
// facade reveal keep running for ~1-2s after it, so a benchmark started there
// captures the 6-pass reveal compositor (down to ~20fps p1) instead of the 3-pass
// steady city. Wait until the scene is fully settled AND has held that state for a
// short buffer (material/opacity fades + crowd appear). ?benchmarkSettleMs=N tunes
// it (0 = old behaviour, start at reveal-complete).
const RETRO_BENCHMARK_AUTO_SETTLE_MS = (() => {
  const raw = retroBenchmarkSearchParams.get('benchmarkSettleMs');
  if (raw == null) return 1500; // Number(null) === 0, so guard the absent param
  const v = Number(raw);
  return Number.isFinite(v) && v >= 0 ? v : 1500;
})();
let retroBenchmarkSettleSinceMs = 0;
function retroBenchmarkSceneSettled() {
  return Boolean(
    cityRevealComplete
    && hasDroneIntroLanded()
    && !isCityRevealCompositeActive()
    && !getCityRevealMainLedReveal().isOverlayActive()
  );
}
export function maybeStartRetroBenchmarkAuto(now = performance.now()) {
  if (!retroBenchmarkAutoStartPending) return;
  if (!retroBenchmarkSceneSettled()) { retroBenchmarkSettleSinceMs = 0; return; }
  if (retroBenchmarkSettleSinceMs === 0) retroBenchmarkSettleSinceMs = now;
  if (now - retroBenchmarkSettleSinceMs < RETRO_BENCHMARK_AUTO_SETTLE_MS) return;
  retroBenchmarkAutoStartPending = false;
  window.__retroBenchmarkStart({ source: 'query-param', durationMs: retroBenchmarkDurationMs });
}
