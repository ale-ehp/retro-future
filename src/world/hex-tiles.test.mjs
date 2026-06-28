import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyHexRoadBatchLodVisibility,
  hexRoadLodSettingsForProfile,
  hexRoadBatchDistanceSqToPoint,
  resolveHexRoadBatchLodVisible,
} from './hex-tiles.js';

test('hex road LOD distance uses the batch rectangle, not the center', () => {
  const batch = {
    bounds: {
      minX: -10,
      maxX: 10,
      minZ: 100,
      maxZ: 120,
    },
  };

  assert.equal(hexRoadBatchDistanceSqToPoint(batch, 0, 110), 0);
  assert.equal(hexRoadBatchDistanceSqToPoint(batch, 0, 80), 400);
  assert.equal(hexRoadBatchDistanceSqToPoint(batch, 25, 140), 625);
});

test('hex road LOD visibility uses hysteresis around the near distance', () => {
  assert.equal(resolveHexRoadBatchLodVisible(99 * 99, true, 100, 10), true);
  assert.equal(resolveHexRoadBatchLodVisible(105 * 105, true, 100, 10), true);
  assert.equal(resolveHexRoadBatchLodVisible(111 * 111, true, 100, 10), false);

  assert.equal(resolveHexRoadBatchLodVisible(105 * 105, false, 100, 10), false);
  assert.equal(resolveHexRoadBatchLodVisible(95 * 95, false, 100, 10), true);
});

test('hex road LOD uses tighter thresholds on mobile', () => {
  const desktop = hexRoadLodSettingsForProfile({ mobile: false });
  const mobile = hexRoadLodSettingsForProfile({ mobile: true });

  assert.ok(mobile.nearDistance < desktop.nearDistance);
  assert.ok(mobile.hysteresis < desktop.hysteresis);
  assert.equal(resolveHexRoadBatchLodVisible(450 * 450, true, desktop.nearDistance, desktop.hysteresis), true);
  assert.equal(resolveHexRoadBatchLodVisible(450 * 450, true, mobile.nearDistance, mobile.hysteresis), false);
});

test('hex road LOD hides far batches and reports saved triangles', () => {
  const records = [
    {
      mesh: { visible: true, count: 10 },
      renderVisible: true,
      lodVisible: true,
      bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
    },
    {
      mesh: { visible: true, count: 12 },
      renderVisible: true,
      lodVisible: true,
      bounds: { minX: 220, maxX: 240, minZ: -10, maxZ: 10 },
    },
  ];

  const stats = applyHexRoadBatchLodVisibility(records, {
    x: 0,
    z: 0,
    nearDistance: 100,
    hysteresis: 10,
    trianglesPerInstance: 18,
  });

  assert.equal(records[0].mesh.visible, true);
  assert.equal(records[1].mesh.visible, false);
  assert.equal(stats.visibleBatches, 1);
  assert.equal(stats.hiddenBatches, 1);
  assert.equal(stats.savedTriangles, 216);
});
