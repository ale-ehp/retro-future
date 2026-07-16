import assert from 'node:assert/strict';
import test from 'node:test';

import {
  temporalAaHistoryBlend,
  temporalAaJitterForFrame,
  temporalAaRequestedFromParams,
  temporalAaSettingsFromParams,
} from './temporal-aa-pass.js';

test('temporal AA is opt-in through explicit URLs', () => {
  assert.equal(temporalAaRequestedFromParams(new URLSearchParams('')), false);
  assert.equal(temporalAaRequestedFromParams(new URLSearchParams('taa=1')), true);
  assert.equal(temporalAaRequestedFromParams(new URLSearchParams('taa=on')), true);
  assert.equal(temporalAaRequestedFromParams(new URLSearchParams('aa=taa')), true);
  assert.equal(temporalAaRequestedFromParams(new URLSearchParams('taa=0')), false);
  assert.equal(temporalAaRequestedFromParams(new URLSearchParams('taa=off')), false);
  assert.equal(temporalAaRequestedFromParams(new URLSearchParams('aa=fxaa')), false);
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

test('temporal AA keeps desktop and mobile profiles for explicit opt-in URLs', () => {
  assert.deepEqual(temporalAaSettingsFromParams(new URLSearchParams(''), { mobile: false }), {
    enabled: false,
    profile: 'quality',
    stillHistoryBlend: 0.78,
    movingHistoryBlend: 0.42,
    clampStrength: 0.045,
  });
  assert.deepEqual(temporalAaSettingsFromParams(new URLSearchParams(''), { mobile: true }), {
    enabled: false,
    profile: 'lite',
    stillHistoryBlend: 0.62,
    movingHistoryBlend: 0.28,
    clampStrength: 0.035,
  });
  assert.equal(temporalAaSettingsFromParams(new URLSearchParams('taa=1'), { mobile: false }).enabled, true);
  assert.equal(temporalAaSettingsFromParams(new URLSearchParams('aa=taa'), { mobile: true }).enabled, true);
  assert.equal(temporalAaSettingsFromParams(new URLSearchParams('taa.profile=quality'), { mobile: true }).profile, 'quality');
  assert.equal(temporalAaSettingsFromParams(new URLSearchParams('taa.profile=lite'), { mobile: false }).profile, 'lite');
  assert.equal(temporalAaSettingsFromParams(new URLSearchParams('taa=0'), { mobile: true }).enabled, false);
});

test('temporal AA history blend is profile-tunable for motion-aware accumulation', () => {
  assert.equal(temporalAaHistoryBlend({
    stable: true,
    motionAmount: 0,
    stillBlend: 0.62,
    movingBlend: 0.28,
  }), 0.62);
  assert.equal(temporalAaHistoryBlend({
    stable: true,
    motionAmount: 1,
    stillBlend: 0.62,
    movingBlend: 0.28,
  }), 0.28);
});
