import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RETRO_BENCHMARK_DEFAULT_DURATION_MS,
  createRetroBenchmarkRuntime,
} from './retro-benchmark.js';

test('retro benchmark summarizes fps, worst frames, render load, memory and environment', () => {
  let clock = 0;
  let completedSummary = null;
  const runtime = createRetroBenchmarkRuntime({
    now: () => clock,
    dateNow: () => new Date('2026-06-28T10:00:00.000Z'),
    getEnvironment: () => ({
      browser: { userAgent: 'UnitTest/1.0', platform: 'test-os' },
      canvas: { drawingBufferWidth: 1920, drawingBufferHeight: 1080 },
      gpu: { renderer: 'Fake GPU' },
      quality: { performanceMode: 'auto', activePixelRatio: 1 },
    }),
    onComplete: (summary) => {
      completedSummary = summary;
    },
  });

  runtime.start({ durationMs: 1000, source: 'unit-test' });
  const fpsSamples = [60, 60, 60, 55, 50, 45, 40, 30, 20, 10];

  fpsSamples.forEach((fps, index) => {
    clock += 100;
    runtime.recordFrame({
      now: clock,
      rafDtMs: 1000 / fps,
      frameMs: 1000 / fps,
      updateMs: 2 + index,
      renderMs: 4 + index,
      renderInfo: {
        calls: 100 + index,
        triangles: 1000 + index * 10,
        lines: index,
        points: index * 2,
      },
      memoryInfo: {
        geometries: 10 + index,
        textures: 5 + index,
      },
    });
  });

  const summary = runtime.summary();

  assert.equal(summary.status, 'complete');
  assert.equal(summary.schemaVersion, 1);
  assert.equal(summary.source, 'unit-test');
  assert.equal(summary.frames, 10);
  assert.equal(summary.elapsedMs, 1000);
  assert.equal(summary.durationMs, 1000);
  assert.equal(summary.startedAt, '2026-06-28T10:00:00.000Z');
  assert.equal(summary.completedAt, '2026-06-28T10:00:00.000Z');
  assert.equal(summary.fps.avg, 43);
  assert.equal(summary.fps.p5, 10);
  assert.equal(summary.fps.p1, 10);
  assert.equal(summary.fps.min, 10);
  assert.equal(summary.fps.max, 60);
  assert.equal(summary.frameMs.max, 100);
  assert.equal(summary.frameMs.worst, 100);
  assert.equal(summary.render.maxCalls, 109);
  assert.equal(summary.render.maxTriangles, 1090);
  assert.equal(summary.render.maxLines, 9);
  assert.equal(summary.render.maxPoints, 18);
  assert.equal(summary.memory.maxGeometries, 19);
  assert.equal(summary.memory.maxTextures, 14);
  assert.deepEqual(summary.environment.gpu, { renderer: 'Fake GPU' });
  assert.equal(completedSummary, summary);
  assert.equal(runtime.inspect().status, 'complete');
});

test('retro benchmark can export copy-safe json with a stable file name', () => {
  let clock = 0;
  const runtime = createRetroBenchmarkRuntime({
    now: () => clock,
    dateNow: () => new Date('2026-06-28T10:00:00.000Z'),
    getEnvironment: () => ({ browser: { userAgent: 'UnitTest/1.0' } }),
  });

  assert.equal(RETRO_BENCHMARK_DEFAULT_DURATION_MS, 60000);

  runtime.start({ durationMs: 16 });
  clock = 16;
  runtime.recordFrame({
    now: clock,
    rafDtMs: 16,
    frameMs: 12,
    updateMs: 5,
    renderMs: 7,
    renderInfo: { calls: 12, triangles: 3400 },
    memoryInfo: { geometries: 3, textures: 4 },
  });

  const exported = runtime.exportJson();
  const parsed = JSON.parse(exported.text);

  assert.equal(exported.filename, 'retro-benchmark-2026-06-28T100000Z.json');
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.frames, 1);
  assert.equal(parsed.render.maxTriangles, 3400);
});
