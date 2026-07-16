import {
  CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS,
  CITY_REVEAL_PROFILE_MAX_SAMPLES,
  CITY_REVEAL_PROFILE_SAMPLE_MS,
} from '../world/config.js';

const cityRevealProfileState = {
  running: false,
  completed: false,
  startedAt: 0,
  lastSampleAt: 0,
  frameCount: 0,
  samples: [],
  bucket: null,
  lastFrame: null,
};

export function createCityRevealProfiler(deps) {
  const {
    getCityRevealStartedAt,
    getCityRevealArmedAt,
    getCityRevealComplete,
    getCityRevealCompletedAt,
    getCityRevealDelayMs,
    getCityRevealSweepProgress,
    getCityRevealWireAlpha,
    getCityRevealWireCullStats,
    getCityRevealWireObjects,
    getCityRevealSolidObjects,
    getCityRevealMainLedDepthProxyVisibleCount,
    getCityRevealMainLedDepthProxyLastMode,
    getMainBuildingVerticalRevealOverlayObjectCount,
    getTronRunnerCrowd,
    getTronRunnerCrowdRuntimeStats,
    getRendererMemory,
    getScene,
    getCityRevealRoadGridGroup,
    getCityRevealMainLedDepthGroup,
    getComposer,
    getBloomPass,
    getFxaaPass,
    getFsrUpscalePass,
    getCinematicLookPass,
    getCityRevealSkyPass,
    getCityRevealOverlayPass,
    getCityRevealWirePass,
    getCityRevealRoadGridPass,
    getCityRevealScenePass,
    getCityRevealMainLedRevealPass,
    cityRevealPostRevealElapsedMs,
    cityRevealEffectiveDelayMs,
    cityRevealFadeDurationMs,
    isCityRevealRealRevealActive,
    isCityRevealMainLedRevealOverlayActive,
    cityRevealEstimatedVisibleObjects,
    shouldUseComposer,
  } = deps;

  function createCityRevealProfileBucket() {
    return {
      frames: 0,
      rafDtMsSum: 0,
      updateMsSum: 0,
      renderMsSum: 0,
      frameMsSum: 0,
      updateMsMax: 0,
      renderMsMax: 0,
      frameMsMax: 0,
      drawCallsSum: 0,
      drawCallsMax: 0,
      trianglesSum: 0,
      trianglesMax: 0,
      linesSum: 0,
      pointsSum: 0,
    };
  }

  function countVisibleRenderables(root) {
    const result = { total: 0, visible: 0, hidden: 0, mesh: 0, line: 0, points: 0, instanced: 0 };
    if (!root) return result;
    root.traverse((object) => {
      if (!object.isMesh && !object.isLine && !object.isPoints) return;
      result.total++;
      if (!object.visible) {
        result.hidden++;
        return;
      }
      result.visible++;
      if (object.isInstancedMesh) result.instanced++;
      else if (object.isMesh) result.mesh++;
      else if (object.isLine) result.line++;
      else if (object.isPoints) result.points++;
    });
    return result;
  }

  function cityRevealWireRenderablesSnapshot() {
    return {
      total: getCityRevealWireCullStats().total,
      visible: getCityRevealWireCullStats().visible,
      hidden: getCityRevealWireCullStats().hidden,
      mesh: getCityRevealWireCullStats().solidVisible + getCityRevealWireCullStats().roadFadeVisible,
      line: getCityRevealWireCullStats().wireVisible,
      points: 0,
      instanced: 0,
    };
  }

  function composerPassProfile() {
    const passes = {
      sky: Boolean(getCityRevealSkyPass()?.enabled),
      overlay: Boolean(getCityRevealOverlayPass()?.enabled),
      wireframe: Boolean(getCityRevealWirePass()?.enabled),
      roadGrid: Boolean(getCityRevealRoadGridPass()?.enabled),
      realCity: Boolean(getCityRevealScenePass()?.enabled),
      mainLedReveal: Boolean(getCityRevealMainLedRevealPass()?.enabled),
      bloom: Boolean(getBloomPass()?.enabled),
      fxaa: Boolean(getFxaaPass()?.enabled),
      fsrUpscale: Boolean(getFsrUpscalePass()?.enabled),
      cinematicLook: Boolean(getCinematicLookPass?.()?.enabled),
      output: Boolean(getComposer() && !getFsrUpscalePass()),
    };
    const mainLedSceneRenders = passes.mainLedReveal ? 2 : 0;
    const sceneRenderPasses = [
      passes.sky,
      passes.overlay,
      passes.wireframe,
      passes.roadGrid,
      passes.realCity,
    ].filter(Boolean).length + mainLedSceneRenders;
    const postPasses = [passes.bloom, passes.fxaa, passes.fsrUpscale, passes.cinematicLook, passes.output].filter(Boolean).length;
    return {
      composer: shouldUseComposer(),
      passes,
      sceneRenderPasses,
      postPasses,
      estimatedPasses: sceneRenderPasses + postPasses,
    };
  }

  function cityRevealProfileSceneSnapshot() {
    return {
      pipeline: composerPassProfile(),
      renderables: {
        scene: countVisibleRenderables(getScene()),
        wire: cityRevealWireRenderablesSnapshot(),
        roadGrid: countVisibleRenderables(getCityRevealRoadGridGroup()),
        mainLedDepth: countVisibleRenderables(getCityRevealMainLedDepthGroup()),
      },
      reveal: {
        started: getCityRevealStartedAt() > 0,
        armed: getCityRevealArmedAt() > 0,
        armedElapsedMs: getCityRevealArmedAt() > 0 ? Number((performance.now() - getCityRevealArmedAt()).toFixed(1)) : 0,
        complete: getCityRevealComplete(),
        completedAt: Number(getCityRevealCompletedAt().toFixed(1)),
        postRevealElapsedMs: Number(cityRevealPostRevealElapsedMs().toFixed(1)),
        delayMs: getCityRevealDelayMs(),
        extraDelayMs: CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS,
        effectiveDelayMs: cityRevealEffectiveDelayMs(),
        fadeMs: cityRevealFadeDurationMs(),
        progress: Number(getCityRevealSweepProgress().toFixed(4)),
        wireAlpha: Number(getCityRevealWireAlpha().toFixed(4)),
        realRevealActive: isCityRevealRealRevealActive(),
        mainLedRevealActive: isCityRevealMainLedRevealOverlayActive(),
        visibleWireObjects: cityRevealEstimatedVisibleObjects(),
        renderedWireObjects: getCityRevealWireCullStats().visible,
        hiddenWireObjects: getCityRevealWireCullStats().hidden,
        wireCull: { ...getCityRevealWireCullStats() },
        totalWireObjects: getCityRevealWireObjects().length,
        solidObjects: getCityRevealSolidObjects().length,
        mainLedOverlayObjects: getMainBuildingVerticalRevealOverlayObjectCount(),
        mainLedDepthProxyVisible: getCityRevealMainLedDepthProxyVisibleCount(),
        mainLedDepthProxyMode: getCityRevealMainLedDepthProxyLastMode(),
      },
      crowd: {
        count: getTronRunnerCrowd().length,
        visible: getTronRunnerCrowdRuntimeStats().cullingVisibleCount,
        hidden: getTronRunnerCrowdRuntimeStats().cullingHiddenCount,
        reflections: getTronRunnerCrowdRuntimeStats().activeReflectionCount,
        lastThinkMs: Number(getTronRunnerCrowdRuntimeStats().lastThinkMs.toFixed(3)),
      },
      memory: { ...getRendererMemory() },
    };
  }

  function resetCityRevealProfile(now = performance.now()) {
    cityRevealProfileState.running = true;
    cityRevealProfileState.completed = false;
    cityRevealProfileState.startedAt = now;
    cityRevealProfileState.lastSampleAt = now;
    cityRevealProfileState.frameCount = 0;
    cityRevealProfileState.samples = [];
    cityRevealProfileState.bucket = createCityRevealProfileBucket();
    cityRevealProfileState.lastFrame = null;
  }

  function shouldRun() {
    return getCityRevealStartedAt() > 0 && !getCityRevealComplete();
  }

  function pushCityRevealProfileSample(now, force = false) {
    const bucket = cityRevealProfileState.bucket;
    if (!bucket || bucket.frames <= 0) return;
    if (!force && now - cityRevealProfileState.lastSampleAt < CITY_REVEAL_PROFILE_SAMPLE_MS) return;
    const avg = (value) => Number((value / Math.max(1, bucket.frames)).toFixed(3));
    const sample = {
      elapsedMs: Number((now - cityRevealProfileState.startedAt).toFixed(1)),
      frames: bucket.frames,
      fps: Number((1000 / Math.max(0.001, avg(bucket.rafDtMsSum))).toFixed(1)),
      updateMsAvg: avg(bucket.updateMsSum),
      updateMsMax: Number(bucket.updateMsMax.toFixed(3)),
      renderMsAvg: avg(bucket.renderMsSum),
      renderMsMax: Number(bucket.renderMsMax.toFixed(3)),
      frameMsAvg: avg(bucket.frameMsSum),
      frameMsMax: Number(bucket.frameMsMax.toFixed(3)),
      drawCallsAvg: avg(bucket.drawCallsSum),
      drawCallsMax: bucket.drawCallsMax,
      trianglesAvg: Math.round(bucket.trianglesSum / Math.max(1, bucket.frames)),
      trianglesMax: bucket.trianglesMax,
      linesAvg: Math.round(bucket.linesSum / Math.max(1, bucket.frames)),
      pointsAvg: Math.round(bucket.pointsSum / Math.max(1, bucket.frames)),
      ...cityRevealProfileSceneSnapshot(),
    };
    cityRevealProfileState.samples.push(sample);
    if (cityRevealProfileState.samples.length > CITY_REVEAL_PROFILE_MAX_SAMPLES) {
      cityRevealProfileState.samples.shift();
    }
    cityRevealProfileState.lastSampleAt = now;
    cityRevealProfileState.bucket = createCityRevealProfileBucket();
  }

  function recordFrame({ now, dt, updateMs, renderMs, frameMs, renderInfo }) {
    if (!shouldRun()) {
      if (cityRevealProfileState.running) {
        pushCityRevealProfileSample(performance.now(), true);
        cityRevealProfileState.running = false;
        cityRevealProfileState.completed = true;
      }
      return;
    }
    const profileNow = performance.now();
    if (!cityRevealProfileState.running) resetCityRevealProfile(profileNow);
    const bucket = cityRevealProfileState.bucket || createCityRevealProfileBucket();
    cityRevealProfileState.bucket = bucket;
    const rafDtMs = Math.max(0.001, dt * 1000);
    const calls = renderInfo?.calls ?? 0;
    const triangles = renderInfo?.triangles ?? 0;
    bucket.frames++;
    bucket.rafDtMsSum += rafDtMs;
    bucket.updateMsSum += updateMs;
    bucket.renderMsSum += renderMs;
    bucket.frameMsSum += frameMs;
    bucket.updateMsMax = Math.max(bucket.updateMsMax, updateMs);
    bucket.renderMsMax = Math.max(bucket.renderMsMax, renderMs);
    bucket.frameMsMax = Math.max(bucket.frameMsMax, frameMs);
    bucket.drawCallsSum += calls;
    bucket.drawCallsMax = Math.max(bucket.drawCallsMax, calls);
    bucket.trianglesSum += triangles;
    bucket.trianglesMax = Math.max(bucket.trianglesMax, triangles);
    bucket.linesSum += renderInfo?.lines ?? 0;
    bucket.pointsSum += renderInfo?.points ?? 0;
    cityRevealProfileState.frameCount++;
    cityRevealProfileState.lastFrame = {
      now: Number(now.toFixed(1)),
      updateMs: Number(updateMs.toFixed(3)),
      renderMs: Number(renderMs.toFixed(3)),
      frameMs: Number(frameMs.toFixed(3)),
      renderInfo: { ...renderInfo },
    };
    pushCityRevealProfileSample(profileNow, getCityRevealComplete());
  }

  function inspect() {
    const samples = cityRevealProfileState.samples.map((sample) => ({ ...sample }));
    const slowestRender = samples.reduce((best, sample) => (
      !best || sample.renderMsMax > best.renderMsMax ? sample : best
    ), null);
    const slowestFrame = samples.reduce((best, sample) => (
      !best || sample.frameMsMax > best.frameMsMax ? sample : best
    ), null);
    return {
      running: cityRevealProfileState.running,
      completed: cityRevealProfileState.completed,
      sampleMs: CITY_REVEAL_PROFILE_SAMPLE_MS,
      frameCount: cityRevealProfileState.frameCount,
      sampleCount: samples.length,
      lastFrame: cityRevealProfileState.lastFrame ? { ...cityRevealProfileState.lastFrame } : null,
      latest: samples.at(-1) || cityRevealProfileSceneSnapshot(),
      slowestRender,
      slowestFrame,
      samples,
    };
  }

  return {
    shouldRun,
    isCapturing: () => cityRevealProfileState.running,
    recordFrame,
    inspect,
    composerPassProfile,
  };
}
