import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatTechBreakdownRows,
  techBreakdownRequestedFromParams,
} from './tech-breakdown-overlay.js';

test('tech breakdown flag is opt-in only', () => {
  assert.equal(techBreakdownRequestedFromParams(new URLSearchParams('')), false);
  assert.equal(techBreakdownRequestedFromParams(new URLSearchParams('techBreakdown=1')), true);
  assert.equal(techBreakdownRequestedFromParams(new URLSearchParams('techBreakdown=on')), true);
  assert.equal(techBreakdownRequestedFromParams(new URLSearchParams('tech=1')), true);
  assert.equal(techBreakdownRequestedFromParams(new URLSearchParams('techBreakdown=0')), false);
});

test('tech breakdown rows summarize pipeline, frame, scene, lod and bake state', () => {
  const rows = formatTechBreakdownRows({
    fps: 59.7,
    bottleneck: 'present',
    rollingFrameMs: 16.8,
    rollingUpdateMs: 1.2,
    rollingRenderMs: 4.4,
    composerActivePasses: ['realCity', 'bloom', 'fxaa'],
    drawCalls: 248,
    triangles: 287919,
    textures: 240,
    skyBake: { active: true, spread: true, faceStride: 2, lastRenderedFace: 3, cycles: 4 },
    temporalAa: { enabled: true, profile: 'lite', historyBlend: 0.62, validHistory: true },
    webgpu: { roadmap: 'compute TAA + motion vectors' },
    hexRoad: { lodVisibleBatches: 9, lodHiddenBatches: 4, lodSavedTriangles: 12744 },
    fxDisabled: ['bloom', 'particles'],
  });

  assert.deepEqual(rows.map((row) => row.label), ['FPS', 'Frame', 'Pipeline', 'Scene', 'Sky bake', 'TAA', 'WebGPU', 'LOD', 'FX off']);
  assert.match(rows.find((row) => row.label === 'Pipeline')?.value || '', /realCity -> bloom -> fxaa/);
  assert.match(rows.find((row) => row.label === 'Sky bake')?.value || '', /spread 1f\/2/);
  assert.match(rows.find((row) => row.label === 'TAA')?.value || '', /lite/);
  assert.match(rows.find((row) => row.label === 'WebGPU')?.value || '', /motion vectors/);
  assert.match(rows.find((row) => row.label === 'LOD')?.value || '', /9\/13 batches/);
});
