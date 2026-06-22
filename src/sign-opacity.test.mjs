import assert from 'node:assert/strict';
import test from 'node:test';

import {
  RETRO_FUTURE_SIGN_OPACITY_MULTIPLIER,
  RETRO_FUTURE_SIGN_SIZE_MULTIPLIER,
  RETRO_FUTURE_SIGN_TEXT_BRIGHTNESS_MULTIPLIER,
  retroFutureSignScale,
  retroFutureSignTextOpacity,
  retroFutureSignOpacity,
} from './sign-opacity.js';

function assertNear(actual, expected) {
  assert.ok(
    Math.abs(actual - expected) < 1e-12,
    `expected ${actual} to be near ${expected}`
  );
}

test('retro future signs are 30 percent more transparent', () => {
  assert.equal(RETRO_FUTURE_SIGN_OPACITY_MULTIPLIER, 0.7);
  assert.equal(retroFutureSignOpacity(1), 0.7);
  assertNear(retroFutureSignOpacity(0.4), 0.28);
});

test('retroFutureSignOpacity clamps to valid material opacity range', () => {
  assert.equal(retroFutureSignOpacity(2), 1);
  assert.equal(retroFutureSignOpacity(-0.4), 0);
});

test('retro future signs are 50 percent larger', () => {
  assert.equal(RETRO_FUTURE_SIGN_SIZE_MULTIPLIER, 1.5);
  assert.equal(retroFutureSignScale(1), 1.5);
  assert.equal(retroFutureSignScale(12), 18);
});

test('retro future sign text is 25 percent brighter', () => {
  assert.equal(RETRO_FUTURE_SIGN_TEXT_BRIGHTNESS_MULTIPLIER, 1.25);
  assertNear(retroFutureSignTextOpacity(0.96), 0.96 * 1.25 * 0.7);
  assert.equal(retroFutureSignTextOpacity(2), 1);
});
