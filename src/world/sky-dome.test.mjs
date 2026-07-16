import assert from 'node:assert/strict';
import test from 'node:test';

import {
  skyBakeFaceStride,
  skyBakeSpreadRequestedFromParams,
} from './sky-dome.js';

test('sky bake spread flag defaults on and accepts explicit URL overrides', () => {
  assert.equal(skyBakeSpreadRequestedFromParams(new URLSearchParams(''), true), true);
  assert.equal(skyBakeSpreadRequestedFromParams(new URLSearchParams('skyBakeSpread=1'), false), true);
  assert.equal(skyBakeSpreadRequestedFromParams(new URLSearchParams('skyBakeSpread=0'), true), false);
  assert.equal(skyBakeSpreadRequestedFromParams(new URLSearchParams('skyBakeSpread=nope'), true), true);
});

test('sky bake spreads a full cube rebake across the original stride window', () => {
  assert.equal(skyBakeFaceStride(12), 2);
  assert.equal(skyBakeFaceStride(6), 1);
  assert.equal(skyBakeFaceStride(1), 1);
});
