import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BOUNDARY_ERROR_SIGN_HEIGHT,
  BOUNDARY_ERROR_SIGN_MAX_OPACITY,
  BOUNDARY_ERROR_SIGN_WIDTH,
} from './boundary-error.js';

function assertNear(actual, expected) {
  assert.ok(
    Math.abs(actual - expected) < 1e-12,
    `expected ${actual} to be near ${expected}`
  );
}

test('boundary error sign uses the shared 30 percent opacity reduction', () => {
  assert.equal(BOUNDARY_ERROR_SIGN_MAX_OPACITY, 0.7);
});

test('boundary error sign is 50 percent larger in world space', () => {
  assert.equal(BOUNDARY_ERROR_SIGN_WIDTH, 17.25);
  assertNear(BOUNDARY_ERROR_SIGN_HEIGHT, 8.1);
});
