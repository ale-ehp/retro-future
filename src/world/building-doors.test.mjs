import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { DEFAULT_BASE_PAD_Y } from './boulevard-constants.js';
import {
  SIDE_BUILDING_CIVIC_NUMBER_BRIGHT_STROKE_STYLE,
  SIDE_BUILDING_CIVIC_NUMBER_DEPTH_TEST,
  SIDE_BUILDING_CIVIC_NUMBER_FIXED,
  SIDE_BUILDING_CIVIC_NUMBER_HIGHLIGHT_STROKE_STYLE,
  SIDE_DOOR_FIXED,
} from './building-doors.js';

const buildingDoorsSource = readFileSync(new URL('./building-doors.js', import.meta.url), 'utf8');

test('building civic number signs are 50 percent larger in world space', () => {
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_FIXED.singleWidth, 88.5);
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_FIXED.doubleWidth, 136.5);
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_FIXED.height, 70.5);
});

test('building civic number signs render above background geometry', () => {
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_DEPTH_TEST, false);
});

test('building civic number text is 25 percent brighter', () => {
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_BRIGHT_STROKE_STYLE, 'rgba(179,255,255,1)');
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_HIGHLIGHT_STROKE_STYLE, 'rgba(255,255,255,1)');
});

test('side building doors start above the base pad surface', () => {
  assert.ok(
    SIDE_DOOR_FIXED.y >= DEFAULT_BASE_PAD_Y,
    `expected side door y ${SIDE_DOOR_FIXED.y} to be at or above base pad ${DEFAULT_BASE_PAD_Y}`
  );
});

test('side building door LEDs keep depth testing enabled', () => {
  assert.match(buildingDoorsSource, /SIDE_BUILDING_DOOR_LED_DEPTH_TEST\s*=\s*true/);
  assert.match(buildingDoorsSource, /depthTest:\s*SIDE_BUILDING_DOOR_LED_DEPTH_TEST/);
});
