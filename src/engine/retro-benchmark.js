export const RETRO_BENCHMARK_DEFAULT_DURATION_MS = 60000;

const RETRO_BENCHMARK_SCHEMA_VERSION = 1;

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value, digits = 2) {
  const number = finiteNumber(value, 0);
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxValue(values) {
  return values.length ? Math.max(...values) : 0;
}

function minValue(values) {
  return values.length ? Math.min(...values) : 0;
}

export function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const clamped = Math.min(1, Math.max(0, finiteNumber(ratio, 0)));
  const index = Math.max(0, Math.ceil(sorted.length * clamped) - 1);
  return sorted[index];
}

function safeDateIso(dateLike) {
  try {
    const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
    return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

function safeEnvironment(getEnvironment) {
  try {
    return getEnvironment?.() || {};
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function filenameTimestamp(iso) {
  return String(iso || new Date(0).toISOString())
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/:/g, '');
}

function frameFps(payload) {
  const explicitFps = finiteNumber(payload.fps, 0);
  if (explicitFps > 0) return explicitFps;
  const rafDtMs = finiteNumber(payload.rafDtMs, 0);
  if (rafDtMs > 0) return 1000 / rafDtMs;
  const frameMs = finiteNumber(payload.frameMs, 0);
  return frameMs > 0 ? 1000 / frameMs : 0;
}

function frameMetric(payload, name) {
  return Math.max(0, finiteNumber(payload?.[name], 0));
}

function buildMetricSet(values, lowPercentiles = false) {
  return lowPercentiles
    ? {
        avg: round(average(values), 1),
        p1: round(percentile(values, 0.01), 1),
        p5: round(percentile(values, 0.05), 1),
        min: round(minValue(values), 1),
        max: round(maxValue(values), 1),
      }
    : {
        avg: round(average(values), 2),
        p95: round(percentile(values, 0.95), 2),
        p99: round(percentile(values, 0.99), 2),
        max: round(maxValue(values), 2),
        worst: round(maxValue(values), 2),
      };
}

function summarizeSamples(state) {
  const samples = state.samples;
  const fpsValues = samples.map((sample) => sample.fps);
  const frameMsValues = samples.map((sample) => sample.frameMs);
  const updateMsValues = samples.map((sample) => sample.updateMs);
  const renderMsValues = samples.map((sample) => sample.renderMs);
  const completedAt = state.completedAt || null;
  const elapsedMs = state.completedAtMs > 0
    ? Math.max(0, state.completedAtMs - state.startedAtMs)
    : Math.max(0, state.lastElapsedMs);

  return {
    schemaVersion: RETRO_BENCHMARK_SCHEMA_VERSION,
    status: state.status,
    source: state.source,
    startedAt: state.startedAt,
    completedAt,
    durationMs: round(state.durationMs, 0),
    elapsedMs: round(elapsedMs, 0),
    frames: samples.length,
    fps: buildMetricSet(fpsValues, true),
    frameMs: buildMetricSet(frameMsValues),
    timing: {
      updateAvgMs: round(average(updateMsValues), 2),
      updateMaxMs: round(maxValue(updateMsValues), 2),
      renderAvgMs: round(average(renderMsValues), 2),
      renderMaxMs: round(maxValue(renderMsValues), 2),
    },
    render: {
      maxCalls: maxValue(samples.map((sample) => sample.calls)),
      maxTriangles: maxValue(samples.map((sample) => sample.triangles)),
      maxLines: maxValue(samples.map((sample) => sample.lines)),
      maxPoints: maxValue(samples.map((sample) => sample.points)),
    },
    memory: {
      maxGeometries: maxValue(samples.map((sample) => sample.geometries)),
      maxTextures: maxValue(samples.map((sample) => sample.textures)),
    },
    environment: state.environment,
  };
}

export function createRetroBenchmarkRuntime(deps = {}) {
  const now = typeof deps.now === 'function' ? deps.now : () => performance.now();
  const dateNow = typeof deps.dateNow === 'function' ? deps.dateNow : () => new Date();
  const getEnvironment = typeof deps.getEnvironment === 'function' ? deps.getEnvironment : () => ({});
  const onUpdate = typeof deps.onUpdate === 'function' ? deps.onUpdate : () => {};
  const onComplete = typeof deps.onComplete === 'function' ? deps.onComplete : () => {};

  const state = {
    status: 'idle',
    source: 'manual',
    startedAtMs: 0,
    completedAtMs: 0,
    lastElapsedMs: 0,
    durationMs: RETRO_BENCHMARK_DEFAULT_DURATION_MS,
    startedAt: null,
    completedAt: null,
    environment: {},
    samples: [],
    summary: null,
  };

  function notifyUpdate() {
    onUpdate(inspect());
  }

  function start(options = {}) {
    const startDate = dateNow();
    state.status = 'running';
    state.source = String(options.source || 'manual');
    state.startedAtMs = finiteNumber(options.now, finiteNumber(now(), 0));
    state.completedAtMs = 0;
    state.lastElapsedMs = 0;
    state.durationMs = Math.max(1, finiteNumber(options.durationMs, RETRO_BENCHMARK_DEFAULT_DURATION_MS));
    state.startedAt = safeDateIso(startDate);
    state.completedAt = null;
    state.environment = safeEnvironment(getEnvironment);
    state.samples = [];
    state.summary = null;
    notifyUpdate();
    return inspect();
  }

  function complete(completedNow = now()) {
    if (state.status === 'complete' && state.summary) return state.summary;
    if (state.status === 'idle') return null;
    state.status = 'complete';
    state.completedAtMs = finiteNumber(completedNow, state.startedAtMs + state.lastElapsedMs);
    state.lastElapsedMs = Math.max(0, state.completedAtMs - state.startedAtMs);
    state.completedAt = safeDateIso(dateNow());
    state.summary = summarizeSamples(state);
    onComplete(state.summary);
    notifyUpdate();
    return state.summary;
  }

  function cancel() {
    if (state.status !== 'running') return inspect();
    state.status = 'cancelled';
    state.completedAtMs = finiteNumber(now(), state.startedAtMs + state.lastElapsedMs);
    state.completedAt = safeDateIso(dateNow());
    state.summary = summarizeSamples(state);
    notifyUpdate();
    return inspect();
  }

  function recordFrame(payload = {}) {
    if (state.status !== 'running') return inspect();
    const sampleNow = finiteNumber(payload.now, finiteNumber(now(), state.startedAtMs));
    const elapsedMs = Math.max(0, sampleNow - state.startedAtMs);
    const renderInfo = payload.renderInfo || {};
    const memoryInfo = payload.memoryInfo || {};

    state.lastElapsedMs = elapsedMs;
    state.samples.push({
      fps: frameFps(payload),
      frameMs: frameMetric(payload, 'frameMs'),
      updateMs: frameMetric(payload, 'updateMs'),
      renderMs: frameMetric(payload, 'renderMs'),
      calls: frameMetric(renderInfo, 'calls'),
      triangles: frameMetric(renderInfo, 'triangles'),
      lines: frameMetric(renderInfo, 'lines'),
      points: frameMetric(renderInfo, 'points'),
      geometries: frameMetric(memoryInfo, 'geometries'),
      textures: frameMetric(memoryInfo, 'textures'),
    });

    if (elapsedMs >= state.durationMs) return complete(sampleNow);
    notifyUpdate();
    return inspect();
  }

  function summary() {
    if (state.summary) return state.summary;
    if (state.status === 'idle') return null;
    return summarizeSamples(state);
  }

  function exportJson() {
    const payload = summary();
    const text = JSON.stringify(payload, null, 2);
    return {
      filename: `retro-benchmark-${filenameTimestamp(payload?.startedAt)}.json`,
      text,
      summary: payload,
    };
  }

  function inspect() {
    return {
      status: state.status,
      active: state.status === 'running',
      durationMs: state.durationMs,
      elapsedMs: round(state.lastElapsedMs, 0),
      frames: state.samples.length,
      summary: summary(),
    };
  }

  return {
    start,
    complete,
    cancel,
    recordFrame,
    summary,
    exportJson,
    inspect,
  };
}
