import assert from 'node:assert/strict';
import test from 'node:test';

import {
  temporalAaHistoryBlend,
  temporalAaJitterForFrame,
  temporalAaRequestedFromParams,
} from './temporal-aa-pass.js';

test('temporal AA is URL-gated and off by default', () => {
  assert.equal(temporalAaRequestedFromParams(new URLSearchParams('')), false);
  assert.equal(temporalAaRequestedFromParams(new URLSearchParams('taa=1')), true);
  assert.equal(temporalAaRequestedFromParams(new URLSearchParams('taa=on')), true);
  assert.equal(temporalAaRequestedFromParams(new URLSearchParams('aa=taa')), true);
  assert.equal(temporalAaRequestedFromParams(new URLSearchParams('taa=0')), false);
});

test('temporal AA jitter is deterministic and subpixel', () => {
  const first = temporalAaJitterForFrame(0, 1280, 720);
  const second = temporalAaJitterForFrame(1, 1280, 720);

  assert.equal(first.x, 0);
  assert.ok(Math.abs(first.y + 1 / 6) < 1e-12);
  assert.equal(first.ndcX, 0);
  assert.ok(Math.abs(first.ndcY) > 0);
  assert.notDeepEqual(first, second);
  assert.ok(Math.abs(second.x) <= 0.5);
  assert.ok(Math.abs(second.y) <= 0.5);
});

test('temporal AA lowers history weight while moving or during reveal', () => {
  assert.equal(temporalAaHistoryBlend({ stable: false, motionAmount: 0 }), 0);
  assert.equal(temporalAaHistoryBlend({ stable: true, motionAmount: 0 }), 0.78);
  assert.equal(temporalAaHistoryBlend({ stable: true, motionAmount: 1 }), 0.42);
});
