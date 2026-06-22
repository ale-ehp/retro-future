import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TRON_RUNNER_FREE_ROAM_STRIDE_LENGTH,
  TRON_RUNNER_WALK_CYCLE_DISTANCE,
} from './characters.js';
import {
  TRON_RUNNER_GREETER_GREET_DISTANCE,
  TRON_RUNNER_GREETER_START_BACK_OFFSET,
  TRON_RUNNER_GREETER_START_SIDE_OFFSET,
  TRON_RUNNER_FOLLOW_PROMPT_DELAY_MS,
  TRON_RUNNER_WELCOME_BUBBLE_DURATION_MS,
  TRON_RUNNER_WELCOME_BUBBLE_HTML,
  TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE,
  tronRunnerGreeterStartPosition,
} from './runner-crowd-runtime.js';

const EXPECTED_VISIBLE_FOOTFALLS_BEFORE_GREETING = 6;

test('greeter starts 16m back, stops at the same welcome point, and shows about six footfalls', () => {
  const landing = { x: 0, z: 828.87 };
  const routeStart = { x: 10, y: 4.1, z: 700 };
  const position = tronRunnerGreeterStartPosition({ droneLandingPose: landing, routeStart });
  const startDistance = Math.hypot(position.x - landing.x, position.z - landing.z);
  const visibleApproachDistance = startDistance - TRON_RUNNER_GREETER_GREET_DISTANCE;
  const visibleFootfalls = visibleApproachDistance / (TRON_RUNNER_WALK_CYCLE_DISTANCE / 2);

  assert.equal(TRON_RUNNER_GREETER_START_BACK_OFFSET, 16);
  assert.equal(TRON_RUNNER_GREETER_START_SIDE_OFFSET, 2.8);
  assert.equal(TRON_RUNNER_GREETER_GREET_DISTANCE, 7.4);
  assert.equal(position.x, landing.x + TRON_RUNNER_GREETER_START_SIDE_OFFSET);
  assert.equal(position.y, routeStart.y);
  assert.equal(position.z, landing.z - TRON_RUNNER_GREETER_START_BACK_OFFSET);
  assert.equal(TRON_RUNNER_FREE_ROAM_STRIDE_LENGTH, 2.15);
  assert.ok(
    Math.abs(visibleFootfalls - EXPECTED_VISIBLE_FOOTFALLS_BEFORE_GREETING) <= 0.6,
    `expected about ${EXPECTED_VISIBLE_FOOTFALLS_BEFORE_GREETING} visible footfalls, got ${visibleFootfalls.toFixed(2)}`
  );
});

test('greeter start falls back to route z when landing pose is unavailable', () => {
  const routeStart = { x: 10, y: 4.1, z: 700 };
  const position = tronRunnerGreeterStartPosition({ droneLandingPose: null, routeStart });

  assert.equal(position.x, TRON_RUNNER_GREETER_START_SIDE_OFFSET);
  assert.equal(position.y, routeStart.y);
  assert.equal(position.z, routeStart.z - TRON_RUNNER_GREETER_START_BACK_OFFSET);
});

test('welcome bubble uses the larger branded avstudio.ai lockup', () => {
  assert.equal(TRON_RUNNER_WELCOME_BUBBLE_HTML, 'Benvenuto in<br>avstudio.ai');
  assert.equal(TRON_RUNNER_WELCOME_BUBBLE_DURATION_MS, 3600);
  assert.ok(TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE > 1.35);
});

test('greeter keeps the Seguimi state half a second longer before moving', () => {
  assert.equal(TRON_RUNNER_FOLLOW_PROMPT_DELAY_MS, 1500);
});
