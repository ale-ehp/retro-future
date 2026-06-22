import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SIDE_BUILDING_CIVIC_NUMBER_DEPTH_TEST,
  SIDE_BUILDING_CIVIC_NUMBER_FIXED,
} from './building-doors.js';

test('building civic number signs are 50 percent larger in world space', () => {
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_FIXED.singleWidth, 88.5);
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_FIXED.doubleWidth, 136.5);
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_FIXED.height, 70.5);
});

test('building civic number signs render above background geometry', () => {
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_DEPTH_TEST, false);
});
