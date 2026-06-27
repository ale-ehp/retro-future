import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  acceptsSingleCameraTouch,
  getCameraTouchCandidates,
} from './mouse-look.js';

const cssSource = readFileSync(new URL('../../retro-future.css', import.meta.url), 'utf8');
const mouseLookSource = readFileSync(new URL('./mouse-look.js', import.meta.url), 'utf8');

const movementTarget = { dataset: { control: 'movement' } };
const cameraTarget = { dataset: { control: 'camera' } };
const isMovementTarget = (target) => target?.dataset?.control === 'movement';

test('mobile touch look accepts one camera finger alongside one movement finger', () => {
  const touches = [
    { identifier: 1, target: movementTarget },
    { identifier: 2, target: cameraTarget },
  ];

  assert.equal(acceptsSingleCameraTouch(touches, isMovementTarget), true);
  assert.deepEqual(getCameraTouchCandidates(touches, isMovementTarget).map((touch) => touch.identifier), [2]);
});

test('mobile touch look rejects camera pinch gestures', () => {
  const touches = [
    { identifier: 1, target: cameraTarget },
    { identifier: 2, target: cameraTarget },
  ];

  assert.equal(acceptsSingleCameraTouch(touches, isMovementTarget), false);
});

test('mobile canvas blocks browser pinch defaults', () => {
  assert.match(cssSource, /canvas\s*\{[^}]*touch-action:\s*none/);
  assert.match(mouseLookSource, /touchstart'[\s\S]*\{ passive:\s*false \}/);
  assert.match(mouseLookSource, /touchmove'[\s\S]*\{ passive:\s*false \}/);
  assert.match(mouseLookSource, /e\.preventDefault\(\)/);
});
