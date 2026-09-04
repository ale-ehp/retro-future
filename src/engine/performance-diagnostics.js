import * as THREE from 'three';
import {
  CITY_REVEAL_PERFORMANCE_PIXEL_RATIO_CAP,
  MAX_RENDER_PIXEL_RATIO,
  MIN_DYNAMIC_PIXEL_RATIO,
} from '../world/config.js';

export function createPerformanceDiagnostics(deps) {
  const {
    renderer,
    controlEls,
    elements,
    getLatestMeasuredFps,
    getActivePixelRatio,
    getRequestedPixelRatio,
    getManualRenderScale,
    getDynamicQualityScale,
    getPerformanceMode,
    getBloomEnabled,
    getBloomPass,
    getFxaaPass,
    getFsrUpscalePass,
    getAntialiasMode,
    getBloomResolutionScale,
    getLastBloomTargetKey,
    getLastFxaaTargetKey,
    getLastFsrTargetKey,
    getFsrUpscaleEnabled,
    getFsrInternalScale,
    getFsrSharpness,
    getStaticCityCullStats,
    getTronRunnerCrowd,
    getTronRunnerCrowdRuntimeStats,
    getLabEqualizerState,
    getCityRevealSweepProgress,
    getCityRevealWireAlpha,
    getCityRevealProfiler,
    getCityRevealWaitingForVisibleFrame,
    getCityRevealComplete,
    getCityRevealArmedAt,
    getCityRevealStartedAt,
    getCityRevealPerformanceProfileActive,
    effectivePixelRatioForDevice,
    effectiveRenderScaleForDevice,
    effectiveComposerPixelRatio,
    mobilePerformanceProfileInspect,
    isBloomPassActive,
    isBloomRevealBypassed,
    shouldBypassBloomForRevealPerformance,
    isCityRevealPerformanceCritical,
  } = deps;

  const performanceDiagnosticsDrawingBufferSize = new THREE.Vector2();
  const performanceDiagnosticsTiming = {
    frameMs: 0,
    updateMs: 0,
    renderMs: 0,
  };
  const PERFORMANCE_LIVE_METRIC_ALPHA = 0.12;
  const PERFORMANCE_LIVE_MIN_FRAME_MS = 0.001;
  const PERFORMANCE_SPIKE_FPS_THRESHOLD = 50;
  const PERFORMANCE_SPIKE_FRAME_MS_THRESHOLD = 22;
  const PERFORMANCE_SPIKE_RAF_MS_THRESHOLD = 1000 / PERFORMANCE_SPIKE_FPS_THRESHOLD;
  const PERFORMANCE_SPIKE_MIN_INTERVAL_MS = 320;
  const PERFORMANCE_SPIKE_MAX_RECORDS = 12;
  const performanceLiveMetrics = {
    frameMsAvg: 0,
    updateMsAvg: 0,
    renderMsAvg: 0,
    rafDtMsAvg: 0,
    targetHz: 60,
    targetMs: 1000 / 60,
  };
  const performanceSpikeState = {
    count: 0,
    lastLoggedAt: -Infinity,
    lastTextureCount: 0,
    last: null,
    worst: null,
    records: [],
  };

  const gpuTimerGl = renderer.getContext();
  const gpuTimerExtWebgl2 = gpuTimerGl?.getExtension?.('EXT_disjoint_timer_query_webgl2') || null;
  const gpuTimerExtWebgl1 = gpuTimerExtWebgl2 ? null : (gpuTimerGl?.getExtension?.('EXT_disjoint_timer_query') || null);
  const gpuTimerState = {
    gl: gpuTimerGl,
    ext: gpuTimerExtWebgl2 || gpuTimerExtWebgl1,
    webgl2: Boolean(gpuTimerExtWebgl2),
    supported: Boolean(gpuTimerExtWebgl2 || gpuTimerExtWebgl1),
    activeQuery: null,
    pending: [],
    latestMs: 0,
    latestAt: 0,
    latestPhase: '',
    sampleCount: 0,
    disjointCount: 0,
  };
  const GPU_TIMER_SAMPLE_STRIDE = 180;
  const GPU_TIMER_SAMPLE_MAX_AGE_MS = 4500;
  let gpuTimerFrameIndex = 0;

  function performanceLiveEma(previous, next, alpha = PERFORMANCE_LIVE_METRIC_ALPHA) {
    const value = Number(next);
    if (!Number.isFinite(value) || value <= 0) return previous;
    return previous > 0 ? previous + (value - previous) * alpha : value;
  }

  const PERFORMANCE_LIVE_COMMON_REFRESH_HZ = [30, 60, 75, 90, 120, 144, 165, 240];

  function performanceLiveRefreshRateFromRaf(rafDtMs) {
    if (!Number.isFinite(rafDtMs) || rafDtMs <= 0) return 60;
    const hz = 1000 / rafDtMs;
    const common = PERFORMANCE_LIVE_COMMON_REFRESH_HZ;
    let best = common[0];
    let bestDelta = Infinity;
    for (const rate of common) {
      const delta = Math.abs(rate - hz);
      if (delta < bestDelta) {
        best = rate;
        bestDelta = delta;
      }
    }
    return bestDelta <= best * 0.18 ? best : Math.max(1, Math.round(hz));
  }

  function updatePerformanceLiveRollingMetrics(dt, frameMs, updateMs, renderMs) {
    performanceLiveMetrics.rafDtMsAvg = performanceLiveEma(performanceLiveMetrics.rafDtMsAvg, dt * 1000, 0.08);
    performanceLiveMetrics.frameMsAvg = performanceLiveEma(performanceLiveMetrics.frameMsAvg, frameMs);
    performanceLiveMetrics.updateMsAvg = performanceLiveEma(performanceLiveMetrics.updateMsAvg, updateMs);
    performanceLiveMetrics.renderMsAvg = performanceLiveEma(performanceLiveMetrics.renderMsAvg, renderMs);
    const observedTargetHz = performanceLiveRefreshRateFromRaf(performanceLiveMetrics.rafDtMsAvg);
    performanceLiveMetrics.targetHz = Math.max(performanceLiveMetrics.targetHz || 60, observedTargetHz);
    performanceLiveMetrics.targetMs = 1000 / Math.max(1, performanceLiveMetrics.targetHz);
  }

  function beginGpuTimerSample() {
    const state = gpuTimerState;
    gpuTimerFrameIndex++;
    if (
      gpuTimerFrameIndex % GPU_TIMER_SAMPLE_STRIDE !== 0 ||
      !state.supported ||
      state.activeQuery ||
      state.pending.length > 8
    ) return;
    try {
      const query = state.webgl2 ? state.gl.createQuery() : state.ext.createQueryEXT();
      if (!query) return;
      if (state.webgl2) state.gl.beginQuery(state.ext.TIME_ELAPSED_EXT, query);
      else state.ext.beginQueryEXT(state.ext.TIME_ELAPSED_EXT, query);
      state.activeQuery = {
        query,
        phase: performanceSpikePhaseLabel(),
        startedAt: performance.now(),
      };
    } catch {
      state.supported = false;
      state.activeQuery = null;
    }
  }

  function endGpuTimerSample() {
    const state = gpuTimerState;
    if (!state.supported || !state.activeQuery) return;
    try {
      if (state.webgl2) state.gl.endQuery(state.ext.TIME_ELAPSED_EXT);
      else state.ext.endQueryEXT(state.ext.TIME_ELAPSED_EXT);
      state.pending.push(state.activeQuery);
    } catch {
      state.supported = false;
    } finally {
      state.activeQuery = null;
    }
  }

  function pollGpuTimerSamples() {
    const state = gpuTimerState;
    if (!state.supported || !state.pending.length) return;
    try {
      const disjoint = Boolean(state.gl.getParameter(state.ext.GPU_DISJOINT_EXT));
      while (state.pending.length) {
        const sample = state.pending[0];
        const query = sample?.query || sample;
        const available = state.webgl2
          ? state.gl.getQueryParameter(query, state.gl.QUERY_RESULT_AVAILABLE)
          : state.ext.getQueryObjectEXT(query, state.ext.QUERY_RESULT_AVAILABLE_EXT);
        if (!available) break;
        state.pending.shift();
        const elapsedNs = state.webgl2
          ? state.gl.getQueryParameter(query, state.gl.QUERY_RESULT)
          : state.ext.getQueryObjectEXT(query, state.ext.QUERY_RESULT_EXT);
        if (state.webgl2) state.gl.deleteQuery(query);
        else state.ext.deleteQueryEXT(query);
        if (disjoint || !Number.isFinite(elapsedNs)) {
          state.disjointCount += 1;
          continue;
        }
        state.latestMs = Math.max(0, elapsedNs / 1000000);
        state.latestAt = performance.now();
        state.latestPhase = sample?.phase || '';
        state.sampleCount += 1;
      }
    } catch {
      state.supported = false;
      state.pending.length = 0;
      state.activeQuery = null;
    }
  }

  function performanceLiveMetricsSummary() {
    const frameMs = Math.max(PERFORMANCE_LIVE_MIN_FRAME_MS, performanceLiveMetrics.frameMsAvg || performanceDiagnosticsTiming.frameMs || 0);
    const updateMs = performanceLiveMetrics.updateMsAvg || performanceDiagnosticsTiming.updateMs || 0;
    const renderMs = performanceLiveMetrics.renderMsAvg || performanceDiagnosticsTiming.renderMs || 0;
    const currentPhase = performanceSpikePhaseLabel();
    const gpuSampleAgeMs = gpuTimerState.latestAt > 0 ? performance.now() - gpuTimerState.latestAt : Infinity;
    const gpuSampleFresh = Boolean(
      gpuTimerState.supported &&
      gpuTimerState.sampleCount > 0 &&
      gpuSampleAgeMs <= GPU_TIMER_SAMPLE_MAX_AGE_MS &&
      (!gpuTimerState.latestPhase || gpuTimerState.latestPhase === currentPhase)
    );
    const gpuMs = gpuSampleFresh ? gpuTimerState.latestMs : 0;
    const targetHz = Math.max(1, performanceLiveMetrics.targetHz || 60);
    const targetMs = performanceLiveMetrics.targetMs || (1000 / targetHz);
    const measuredFps = Number.isFinite(getLatestMeasuredFps()) && getLatestMeasuredFps() > 0 ? getLatestMeasuredFps() : 0;
    const measuredFrameMs = measuredFps > 0 ? 1000 / measuredFps : 0;
    const rafFrameMs = performanceLiveMetrics.rafDtMsAvg > 0 ? performanceLiveMetrics.rafDtMsAvg : 0;
    const presentFrameMs = Math.max(measuredFrameMs, rafFrameMs);
    const presentationDropActive = measuredFps > 0 && measuredFps < targetHz * 0.92;
    const gpuFrameMs = gpuMs > PERFORMANCE_LIVE_MIN_FRAME_MS ? gpuMs : 0;
    const workBottleneckMs = Math.max(frameMs, gpuFrameMs);
    const effectiveFrameMs = Math.max(workBottleneckMs, presentationDropActive ? presentFrameMs : 0);
    const theoreticalFps = 1000 / effectiveFrameMs;
    const workFps = 1000 / workBottleneckMs;
    const gpuTheoreticalFps = gpuMs > PERFORMANCE_LIVE_MIN_FRAME_MS ? 1000 / gpuMs : 0;
    const headroomMs = targetMs - effectiveFrameMs;
    const headroomMultiplier = theoreticalFps / Math.max(1, targetHz);
    const bottleneck = presentationDropActive && presentFrameMs > workBottleneckMs * 1.05
      ? 'present'
      : (gpuFrameMs > frameMs * 1.15 ? 'gpu' : (updateMs > renderMs ? 'cpu' : 'render'));
    return {
      frameMs: Number(frameMs.toFixed(3)),
      updateMs: Number(updateMs.toFixed(3)),
      renderMs: Number(renderMs.toFixed(3)),
      effectiveFrameMs: Number(effectiveFrameMs.toFixed(3)),
      presentFrameMs: presentFrameMs > 0 ? Number(presentFrameMs.toFixed(3)) : 0,
      theoreticalFps: Number(theoreticalFps.toFixed(1)),
      workFps: Number(workFps.toFixed(1)),
      targetHz,
      targetMs: Number(targetMs.toFixed(3)),
      headroomMs: Number(headroomMs.toFixed(3)),
      headroomPct: Number(((headroomMs / Math.max(PERFORMANCE_LIVE_MIN_FRAME_MS, targetMs)) * 100).toFixed(1)),
      headroomMultiplier: Number(headroomMultiplier.toFixed(2)),
      gpuTimerSupported: gpuTimerState.supported,
      gpuMs: gpuMs > 0 ? Number(gpuMs.toFixed(3)) : 0,
      gpuFpsTheoretical: gpuTheoreticalFps > 0 ? Number(gpuTheoreticalFps.toFixed(1)) : 0,
      gpuSamples: gpuTimerState.sampleCount,
      gpuSampleStride: GPU_TIMER_SAMPLE_STRIDE,
      gpuSampleFresh,
      gpuSampleAgeMs: Number.isFinite(gpuSampleAgeMs) ? Number(gpuSampleAgeMs.toFixed(1)) : 0,
      gpuSamplePhase: gpuTimerState.latestPhase,
      phase: currentPhase,
      gpuPending: gpuTimerState.pending.length,
      gpuDisjointCount: gpuTimerState.disjointCount,
      presentationDropActive,
      bottleneck,
    };
  }

  function performanceSpikePhaseLabel() {
    if (getCityRevealWaitingForVisibleFrame()) return 'wire-wait';
    if (getCityRevealComplete()) return 'post';
    if (getCityRevealArmedAt() > 0 && !getCityRevealStartedAt()) return 'pre-reveal';
    if (isCityRevealPerformanceCritical()) return 'reveal';
    if (getCityRevealStartedAt() > 0) return 'reveal-delay';
    return 'pre';
  }

  function performanceSpikeBottleneckLabel({ rawRafDtMs, frameMs, updateMs, renderMs, liveMetrics }) {
    if (liveMetrics?.presentationDropActive && rawRafDtMs > Math.max(frameMs, 1) * 1.25) return 'present';
    if ((liveMetrics?.gpuMs || 0) > Math.max(frameMs, updateMs, renderMs) * 1.15) return 'gpu';
    if (renderMs > updateMs * 1.2 && renderMs > 8) return 'render';
    if (updateMs > renderMs * 1.2 && updateMs > 8) return 'update';
    if (frameMs > rawRafDtMs * 0.8) return 'main';
    return liveMetrics?.bottleneck || 'mixed';
  }

  function performanceSpikePrimaryContext() {
    if (isCityRevealPerformanceCritical()) return 'reveal';
    if (isBloomPassActive()) return 'bloom';
    if ((getLabEqualizerState()?.textureFps || 0) > 0) return 'eq';
    if ((getTronRunnerCrowdRuntimeStats().cullingVisibleCount || 0) > 0) return 'crowd';
    return 'scene';
  }

  function formatPerformanceSpikeLabel(spike) {
    if (!spike) return 'none';
    return `${spike.fps}fps ${spike.bottleneck}/${spike.context} ${spike.rafMs}ms`;
  }

  function performanceSpikeSummary() {
    const recent = performanceSpikeState.records.map((spike) => ({
      index: spike.index,
      ageMs: Math.max(0, Math.round(performance.now() - spike.now)),
      label: formatPerformanceSpikeLabel(spike),
      ...spike,
    }));
    return {
      count: performanceSpikeState.count,
      last: performanceSpikeState.last,
      worst: performanceSpikeState.worst,
      lastLabel: formatPerformanceSpikeLabel(performanceSpikeState.last),
      worstLabel: formatPerformanceSpikeLabel(performanceSpikeState.worst),
      recent,
    };
  }

  function recordPerformanceSpike({ now, rawRafDtMs, updateMs, renderMs, frameMs }) {
    const workSpike = frameMs >= PERFORMANCE_SPIKE_FRAME_MS_THRESHOLD;
    const rafCouldSpike = rawRafDtMs >= PERFORMANCE_SPIKE_RAF_MS_THRESHOLD;
    const measuredDrop = getLatestMeasuredFps() > 0 && getLatestMeasuredFps() < PERFORMANCE_SPIKE_FPS_THRESHOLD;
    // Cheap guards before the per-frame summary alloc: when no spike is possible, bail without building liveMetrics.
    if (!rafCouldSpike && !measuredDrop) return;
    if (now - performanceSpikeState.lastLoggedAt < PERFORMANCE_SPIKE_MIN_INTERVAL_MS) return;
    const instantaneousFps = rawRafDtMs > 0 ? 1000 / rawRafDtMs : 0;
    const liveMetrics = performanceLiveMetricsSummary();
    const rafDrop = rafCouldSpike && (workSpike || liveMetrics.presentationDropActive);
    if (!rafDrop && !measuredDrop) return;

    const renderInfo = renderer.info.render || {};
    const memoryInfo = renderer.info.memory || {};
    const textureCount = memoryInfo.textures ?? 0;
    const previousTextureCount = performanceSpikeState.lastTextureCount || textureCount;
    const textureDelta = Math.max(0, textureCount - previousTextureCount);
    const context = textureDelta >= 4 ? 'texture-upload' : performanceSpikePrimaryContext();
    const spike = {
      index: performanceSpikeState.count + 1,
      now: performance.now(),
      timelineMs: Math.round(now),
      fps: Number((instantaneousFps || getLatestMeasuredFps() || 0).toFixed(1)),
      measuredFps: Number((getLatestMeasuredFps() || 0).toFixed(1)),
      rafMs: Number(rawRafDtMs.toFixed(1)),
      frameMs: Number(frameMs.toFixed(1)),
      updateMs: Number(updateMs.toFixed(1)),
      renderMs: Number(renderMs.toFixed(1)),
      workSpike,
      gpuMs: liveMetrics.gpuMs > 0 ? Number(liveMetrics.gpuMs.toFixed(1)) : 0,
      bottleneck: performanceSpikeBottleneckLabel({ rawRafDtMs, frameMs, updateMs, renderMs, liveMetrics }),
      context,
      phase: performanceSpikePhaseLabel(),
      composerPasses: getCityRevealProfiler().composerPassProfile().estimatedPasses,
      drawCalls: renderInfo.calls ?? 0,
      trianglesK: Math.round((renderInfo.triangles ?? 0) / 1000),
      lines: renderInfo.lines ?? 0,
      textures: textureCount,
      textureDelta,
      bloom: Boolean(isBloomPassActive()),
      bloomTarget: getLastBloomTargetKey() || '',
      fxaa: Boolean(getFxaaPass()?.enabled),
      fsr: getFsrUpscaleEnabled() ? `${Math.round(getFsrInternalScale() * 100)}%` : 'off',
      revealProgress: Number(getCityRevealSweepProgress().toFixed(3)),
      wireAlpha: Number(getCityRevealWireAlpha().toFixed(3)),
      crowdVisible: getTronRunnerCrowdRuntimeStats().cullingVisibleCount,
      crowdHidden: getTronRunnerCrowdRuntimeStats().cullingHiddenCount,
      reflections: getTronRunnerCrowdRuntimeStats().activeReflectionCount,
      eq: `${getLabEqualizerState()?.analyserFps || 0}/${getLabEqualizerState()?.textureFps || 0}`,
    };

    performanceSpikeState.count = spike.index;
    performanceSpikeState.lastLoggedAt = now;
    performanceSpikeState.lastTextureCount = textureCount;
    performanceSpikeState.last = spike;
    if (!performanceSpikeState.worst || spike.rafMs > performanceSpikeState.worst.rafMs) {
      performanceSpikeState.worst = spike;
    }
    performanceSpikeState.records.unshift(spike);
    if (performanceSpikeState.records.length > PERFORMANCE_SPIKE_MAX_RECORDS) {
      performanceSpikeState.records.length = PERFORMANCE_SPIKE_MAX_RECORDS;
    }
  }

  function performanceDiagnosticsTargetSizeFromKey(key) {
    const match = String(key || '').match(/^(\d+)x(\d+)$/);
    const width = match ? Number(match[1]) : 0;
    const height = match ? Number(match[2]) : 0;
    return {
      width,
      height,
      pixels: width * height,
      key: key || '',
    };
  }

  function performanceDiagnosticsCanvasSummary() {
    renderer.getDrawingBufferSize(performanceDiagnosticsDrawingBufferSize);
    const canvas = renderer.domElement;
    const width = performanceDiagnosticsDrawingBufferSize.x;
    const height = performanceDiagnosticsDrawingBufferSize.y;
    return {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      canvasCssWidth: canvas.clientWidth || window.innerWidth,
      canvasCssHeight: canvas.clientHeight || window.innerHeight,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      drawingBufferWidth: width,
      drawingBufferHeight: height,
      canvasPixels: Math.round(width * height),
    };
  }

  function performanceDiagnosticsPixelPipeline() {
    const effectivePixelRatioRequest = effectivePixelRatioForDevice(getRequestedPixelRatio());
    const effectiveRenderScale = effectiveRenderScaleForDevice(getManualRenderScale());
    const dynamicPixelRatioBeforeClamp = Math.max(
      MIN_DYNAMIC_PIXEL_RATIO,
      effectivePixelRatioRequest * effectiveRenderScale * getDynamicQualityScale()
    );
    const revealPixelRatioCap = getCityRevealPerformanceProfileActive()
      ? CITY_REVEAL_PERFORMANCE_PIXEL_RATIO_CAP
      : MAX_RENDER_PIXEL_RATIO;
    return {
      requestedPixelRatioRaw: Number(getRequestedPixelRatio().toFixed(2)),
      effectivePixelRatioRequest: Number(effectivePixelRatioRequest.toFixed(2)),
      manualRenderScaleRaw: Number(getManualRenderScale().toFixed(2)),
      effectiveRenderScale: Number(effectiveRenderScale.toFixed(2)),
      dynamicPixelRatioBeforeClamp: Number(dynamicPixelRatioBeforeClamp.toFixed(3)),
      dynamicPixelRatioAfterPreRevealCap: Number(Math.min(dynamicPixelRatioBeforeClamp, revealPixelRatioCap).toFixed(3)),
      dynamicPixelRatioAfterRevealCap: Number(Math.min(dynamicPixelRatioBeforeClamp, revealPixelRatioCap).toFixed(3)),
      activePixelRatio: Number(getActivePixelRatio().toFixed(3)),
      composerPixelRatio: Number(effectiveComposerPixelRatio().toFixed(3)),
      fsrUpscaleEnabled: getFsrUpscaleEnabled(),
      fsrInternalScale: Number(getFsrInternalScale().toFixed(2)),
      fsrSharpness: Number(getFsrSharpness().toFixed(2)),
      minDynamicPixelRatio: MIN_DYNAMIC_PIXEL_RATIO,
      maxRenderPixelRatio: MAX_RENDER_PIXEL_RATIO,
      preRevealPerformanceActive: getCityRevealPerformanceProfileActive(),
      preRevealPixelRatioCap: revealPixelRatioCap,
      revealPerformanceActive: getCityRevealPerformanceProfileActive(),
      revealPixelRatioCap,
    };
  }

  function performanceDiagnosticsComposerSummary() {
    const profile = getCityRevealProfiler().composerPassProfile();
    const activePasses = Object.entries(profile.passes)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);
    return {
      active: profile.composer,
      passCount: activePasses.length,
      activePasses,
      estimatedPasses: profile.estimatedPasses,
      composerPixelRatio: Number(effectiveComposerPixelRatio().toFixed(3)),
      fsrPreset: controlEls.fsrPreset?.value || 'custom',
      fsrUpscaleEnabled: getFsrUpscaleEnabled(),
      fsrInternalScale: Number(getFsrInternalScale().toFixed(2)),
      fsrSharpness: Number(getFsrSharpness().toFixed(2)),
      fsrSharpenMode: 'rcas-like-adaptive',
      fsrUpscaleShaderEnabled: Boolean(getFsrUpscalePass()?.enabled),
      // true when the bloom is being added inside the cinematic look pass instead
      // of by its own full-screen additive draw (see syncBloomLookMerge in main.js).
      bloomLookMerged: getBloomPass()?.compositeToInput === false,
    };
  }

  function performanceDiagnosticsSummary(measuredFps = getLatestMeasuredFps()) {
    const eq = getLabEqualizerState() || {};
    const mobileProfile = mobilePerformanceProfileInspect();
    const canvas = performanceDiagnosticsCanvasSummary();
    const pixelPipeline = performanceDiagnosticsPixelPipeline();
    const composerSummary = performanceDiagnosticsComposerSummary();
    const liveMetrics = performanceLiveMetricsSummary();
    const renderInfo = renderer.info.render || {};
    const memoryInfo = renderer.info.memory || {};
    const bloomTarget = performanceDiagnosticsTargetSizeFromKey(getLastBloomTargetKey());
    const fxaaTarget = performanceDiagnosticsTargetSizeFromKey(getLastFxaaTargetKey());
    const fsrTarget = performanceDiagnosticsTargetSizeFromKey(getLastFsrTargetKey());
    const spikes = performanceSpikeSummary();
    return {
      fps: Number.isFinite(measuredFps) ? Number(measuredFps.toFixed(1)) : 0,
      renderScale: Number(getActivePixelRatio().toFixed(2)),
      qualityScale: Number(getDynamicQualityScale().toFixed(2)),
      viewport: canvas.viewport,
      viewportWidth: canvas.viewportWidth,
      viewportHeight: canvas.viewportHeight,
      devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
      requestedPixelRatio: Number(getRequestedPixelRatio().toFixed(2)),
      manualRenderScale: Number(getManualRenderScale().toFixed(2)),
      mobileProfileActive: mobileProfile.active,
      mobileProfileMode: mobileProfile.mode,
      mobileActivationReasons: mobileProfile.activationReasons,
      mobileMediaQueryMatches: mobileProfile.mediaQueryMatches,
      mobileTouchPoints: mobileProfile.touchPoints,
      mobileWidthActive: mobileProfile.widthActive,
      canvasCssWidth: canvas.canvasCssWidth,
      canvasCssHeight: canvas.canvasCssHeight,
      canvasWidth: canvas.canvasWidth,
      canvasHeight: canvas.canvasHeight,
      drawingBufferWidth: canvas.drawingBufferWidth,
      drawingBufferHeight: canvas.drawingBufferHeight,
      canvasPixels: canvas.canvasPixels,
      pixelPipeline,
      composerActive: composerSummary.active,
      composerPassCount: composerSummary.passCount,
      composerActivePasses: composerSummary.activePasses,
      composerEstimatedPasses: composerSummary.estimatedPasses,
      composerPixelRatio: composerSummary.composerPixelRatio,
      fsrPreset: composerSummary.fsrPreset,
      fsrUpscaleEnabled: composerSummary.fsrUpscaleEnabled,
      fsrInternalScale: composerSummary.fsrInternalScale,
      fsrSharpness: composerSummary.fsrSharpness,
      fsrSharpenMode: composerSummary.fsrSharpenMode,
      fsrUpscaleShaderEnabled: composerSummary.fsrUpscaleShaderEnabled,
      bloomLookMerged: composerSummary.bloomLookMerged,
      fsrTarget,
      bloomEnabled: getBloomEnabled(),
      bloomPassEnabled: Boolean(getBloomPass()?.enabled),
      bloomRevealBypassed: isBloomRevealBypassed(),
      bloomRevealBypassActive: shouldBypassBloomForRevealPerformance(),
      bloomActive: isBloomPassActive(),
      bloomResolutionScale: Number(getBloomResolutionScale().toFixed(3)),
      bloomTarget,
      fxaaEnabled: Boolean(getFxaaPass()?.enabled),
      fxaaTarget,
      drawCalls: renderInfo.calls ?? 0,
      triangles: renderInfo.triangles ?? 0,
      lines: renderInfo.lines ?? 0,
      points: renderInfo.points ?? 0,
      geometries: memoryInfo.geometries ?? 0,
      textures: memoryInfo.textures ?? 0,
      programs: renderer.info.programs?.length ?? 0,
      staticCityCullEnabled: getStaticCityCullStats().enabled,
      staticCityCullTotal: getStaticCityCullStats().total,
      staticCityCullVisible: getStaticCityCullStats().visible,
      staticCityCullHidden: getStaticCityCullStats().hidden,
      staticCityCullBuildingsVisible: getStaticCityCullStats().buildingsVisible,
      staticCityCullBuildingsTotal: getStaticCityCullStats().buildingsTotal,
      staticCityCullBridgesVisible: getStaticCityCullStats().bridgesVisible,
      staticCityCullBridgesTotal: getStaticCityCullStats().bridgesTotal,
      staticCityCullBoardsVisible: getStaticCityCullStats().boardsVisible,
      staticCityCullBoardsTotal: getStaticCityCullStats().boardsTotal,
      staticCityCullLedVisible: getStaticCityCullStats().ledInstancesVisible,
      staticCityCullLedTotal: getStaticCityCullStats().ledInstancesTotal,
      staticCityCullDoorInstancesVisible: getStaticCityCullStats().doorInstancesVisible,
      frameMs: Number(performanceDiagnosticsTiming.frameMs.toFixed(2)),
      updateMs: Number(performanceDiagnosticsTiming.updateMs.toFixed(2)),
      renderMs: Number(performanceDiagnosticsTiming.renderMs.toFixed(2)),
      theoreticalFps: liveMetrics.theoreticalFps,
      workFps: liveMetrics.workFps,
      targetHz: liveMetrics.targetHz,
      targetMs: liveMetrics.targetMs,
      headroomMs: liveMetrics.headroomMs,
      headroomPct: liveMetrics.headroomPct,
      headroomMultiplier: liveMetrics.headroomMultiplier,
      rollingFrameMs: liveMetrics.frameMs,
      rollingUpdateMs: liveMetrics.updateMs,
      rollingRenderMs: liveMetrics.renderMs,
      effectiveFrameMs: liveMetrics.effectiveFrameMs,
      presentFrameMs: liveMetrics.presentFrameMs,
      gpuTimerSupported: liveMetrics.gpuTimerSupported,
      gpuMs: liveMetrics.gpuMs,
      gpuFpsTheoretical: liveMetrics.gpuFpsTheoretical,
      gpuSamples: liveMetrics.gpuSamples,
      gpuSampleStride: liveMetrics.gpuSampleStride,
      gpuSampleFresh: liveMetrics.gpuSampleFresh,
      gpuSampleAgeMs: liveMetrics.gpuSampleAgeMs,
      gpuSamplePhase: liveMetrics.gpuSamplePhase,
      phase: liveMetrics.phase,
      gpuPending: liveMetrics.gpuPending,
      gpuDisjointCount: liveMetrics.gpuDisjointCount,
      presentationDropActive: liveMetrics.presentationDropActive,
      bottleneck: liveMetrics.bottleneck,
      crowdVisible: getTronRunnerCrowdRuntimeStats().cullingVisibleCount,
      crowdHidden: getTronRunnerCrowdRuntimeStats().cullingHiddenCount,
      crowdThinkMs: Number(getTronRunnerCrowdRuntimeStats().lastThinkMs.toFixed(2)),
      reflections: getTronRunnerCrowdRuntimeStats().activeReflectionCount,
      reflectionBudget: getTronRunnerCrowdRuntimeStats().reflectionBudgetLimit,
      eqAnalyserFps: eq.analyserFps || 0,
      eqTextureFps: eq.textureFps || 0,
      revealFreezeFrames: getTronRunnerCrowdRuntimeStats().performanceFreezeFrameCount,
      spikeCount: spikes.count,
      spikeLast: spikes.last,
      spikeWorst: spikes.worst,
      spikeLastLabel: spikes.lastLabel,
      spikeWorstLabel: spikes.worstLabel,
      spikeRecent: spikes.recent,
    };
  }

  function setPerfLiveText(el, value, stateClass = '') {
    if (!el) return;
    el.textContent = value;
    const row = el.closest?.('.perf-live-row');
    if (!row) return;
    row.classList.toggle('perf-live-warn', stateClass === 'warn');
    row.classList.toggle('perf-live-bad', stateClass === 'bad');
    row.classList.toggle('perf-live-muted', stateClass === 'muted');
  }

  function updatePerformanceLiveOverlay(stats) {
    const headroomState = stats.headroomMultiplier < 1.05
      ? 'bad'
      : (stats.headroomMultiplier < 1.35 ? 'warn' : '');
    const theoreticalState = stats.presentationDropActive ? 'bad' : '';
    const gpuText = stats.gpuTimerSupported
      ? (stats.gpuMs > 0 ? `${stats.gpuMs.toFixed(1)}ms ${stats.gpuFpsTheoretical.toFixed(0)}fps` : 'waiting')
      : 'n/a';
    setPerfLiveText(elements.theoreticalFps, `${stats.theoreticalFps.toFixed(0)} fps`, theoreticalState);
    setPerfLiveText(elements.headroom, `${stats.headroomMultiplier.toFixed(2)}x @${stats.targetHz} ${stats.bottleneck}`, headroomState);
    setPerfLiveText(
      elements.frameMs,
      stats.presentationDropActive
        ? `${stats.rollingFrameMs.toFixed(1)} / ${stats.presentFrameMs.toFixed(1)} ms`
        : `${stats.rollingFrameMs.toFixed(1)} ms`,
    );
    setPerfLiveText(elements.cpuRenderMs, `${stats.rollingUpdateMs.toFixed(1)} / ${stats.rollingRenderMs.toFixed(1)} ms`);
    setPerfLiveText(elements.gpuMs, gpuText, stats.gpuTimerSupported ? '' : 'muted');
    const lastSpikeAge = stats.spikeLast ? Math.max(0, performance.now() - stats.spikeLast.now) : Infinity;
    const spikeState = !stats.spikeLast
      ? 'muted'
      : (lastSpikeAge < 2500 ? (stats.spikeLast.fps < 45 ? 'bad' : 'warn') : 'muted');
    setPerfLiveText(elements.spike, stats.spikeLastLabel || 'none', spikeState);
    setPerfLiveText(
      elements.resolution,
      `${stats.drawingBufferWidth}x${stats.drawingBufferHeight} ${stats.renderScale.toFixed(2)}x / post ${stats.composerPixelRatio.toFixed(2)}x`
    );
    setPerfLiveText(elements.passDraw, `${stats.composerActive ? stats.composerPassCount : 0} / ${stats.drawCalls}`);
    setPerfLiveText(elements.triFx, `${Math.round(stats.triangles / 1000)}k ${stats.bloomActive ? 'B' : '-'}${stats.fxaaEnabled ? 'A' : '-'}`);
  }

  function updatePerformanceDiagnostics(measuredFps = getLatestMeasuredFps()) {
    const stats = performanceDiagnosticsSummary(measuredFps);
    updatePerformanceLiveOverlay(stats);
    if (elements.desktopText()) {
      elements.desktopText().textContent = [
        `FPS ${stats.fps.toFixed(1)}`,
        `teo ${stats.theoreticalFps.toFixed(0)}`,
        `work ${stats.workFps.toFixed(0)}`,
        `head ${stats.headroomMultiplier.toFixed(2)}x`,
        `bneck ${stats.bottleneck}`,
        `gpu ${stats.gpuTimerSupported ? `${stats.gpuMs.toFixed(1)}ms` : 'n/a'}`,
        `render ${stats.renderScale.toFixed(2)}x`,
        `fsr ${stats.fsrUpscaleEnabled ? `${Math.round(stats.fsrInternalScale * 100)}%` : 'off'}`,
        `qualita ${stats.qualityScale.toFixed(2)}`,
        `px ${Math.round(stats.canvasPixels / 1000)}k`,
        `draw ${stats.drawCalls}`,
        `tri ${Math.round(stats.triangles / 1000)}k`,
        `cityCull ${stats.staticCityCullVisible}/${stats.staticCityCullTotal}`,
        `ledCull ${stats.staticCityCullLedVisible}/${stats.staticCityCullLedTotal}`,
        `frame ${stats.frameMs.toFixed(1)}ms`,
        `render ${stats.renderMs.toFixed(1)}ms`,
        `revealCap ${stats.pixelPipeline.revealPerformanceActive ? 'on' : 'off'}`,
        `crowd ${stats.crowdVisible}/${getTronRunnerCrowd().length}`,
        `hidden ${stats.crowdHidden}`,
        `think ${stats.crowdThinkMs.toFixed(2)}ms`,
        `riflessi ${stats.reflections}/${stats.reflectionBudget}`,
        `fx ${stats.composerActive ? stats.composerPassCount : 0}`,
        `bloom ${stats.bloomActive ? stats.bloomTarget.key || 'on' : 'off'}`,
        `eq ${stats.eqAnalyserFps}Hz/${stats.eqTextureFps}Hz`,
        `spike ${stats.spikeLastLabel}`,
        `worst ${stats.spikeWorstLabel}`,
      ].join(' | ');
    }
    if (elements.mobileText) {
      elements.mobileText.hidden = !stats.mobileProfileActive;
      if (stats.mobileProfileActive) {
        elements.mobileText.textContent = [
          `FPS ${stats.fps.toFixed(1)} | q ${stats.qualityScale.toFixed(2)} | pr ${stats.renderScale.toFixed(2)}`,
          `${stats.viewport} dpr ${stats.devicePixelRatio} req ${stats.requestedPixelRatio} px ${Math.round(stats.canvasPixels / 1000)}k`,
          `draw ${stats.drawCalls} tri ${Math.round(stats.triangles / 1000)}k tex ${stats.textures}`,
          `cityCull ${stats.staticCityCullVisible}/${stats.staticCityCullTotal} buildings ${stats.staticCityCullBuildingsVisible}/${stats.staticCityCullBuildingsTotal}`,
          `ledCull ${stats.staticCityCullLedVisible}/${stats.staticCityCullLedTotal} doors ${stats.staticCityCullDoorInstancesVisible}`,
          `fx ${stats.composerActive ? stats.composerPassCount : 0} bloom ${stats.bloomActive ? stats.bloomTarget.key || 'on' : 'off'} aa ${stats.fxaaEnabled ? 'on' : 'off'}`,
          `crowd ${stats.crowdVisible}/${getTronRunnerCrowd().length} refl ${stats.reflections}/${stats.reflectionBudget} freeze ${stats.revealFreezeFrames}`,
          `frame ${stats.frameMs.toFixed(1)} update ${stats.updateMs.toFixed(1)} render ${stats.renderMs.toFixed(1)}ms`,
          `teo ${stats.theoreticalFps.toFixed(0)} work ${stats.workFps.toFixed(0)} head ${stats.headroomMultiplier.toFixed(2)}x gpu ${stats.gpuTimerSupported ? `${stats.gpuMs.toFixed(1)}ms` : 'n/a'} ${stats.bottleneck}`,
          `spike ${stats.spikeLastLabel} worst ${stats.spikeWorstLabel}`,
        ].join('\n');
      }
    }
  }

  return {
    timing: performanceDiagnosticsTiming,
    liveMetrics: performanceLiveMetrics,
    summary: performanceDiagnosticsSummary,
    canvasSummary: performanceDiagnosticsCanvasSummary,
    update: updatePerformanceDiagnostics,
    updateRollingMetrics: updatePerformanceLiveRollingMetrics,
    beginGpuTimerSample,
    endGpuTimerSample,
    pollGpuTimerSamples,
    recordSpike: recordPerformanceSpike,
    spikeSummary: performanceSpikeSummary,
    setLastTextureCount(textureCount) {
      performanceSpikeState.lastTextureCount = textureCount;
    },
  };
}
