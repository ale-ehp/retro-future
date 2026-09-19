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
  TRON_RUNNER_WELCOME_BUBBLE_TEXT,
  GREETER_FOLLOW_BUBBLE_TEXT,
  GREETER_BOARD_BUBBLE_TEXT,
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
  assert.equal(TRON_RUNNER_WELCOME_BUBBLE_TEXT.it, 'Benvenuto in<br>avstudio.ai');
  assert.equal(TRON_RUNNER_WELCOME_BUBBLE_TEXT.en, 'Welcome to<br>avstudio.ai');
  // La riga del logo non si traduce: e' quella che speech-bubbles.js riconosce.
  for (const testo of Object.values(TRON_RUNNER_WELCOME_BUBBLE_TEXT)) {
    assert.ok(testo.endsWith('<br>avstudio.ai'), testo);
  }
  assert.equal(TRON_RUNNER_WELCOME_BUBBLE_DURATION_MS, 3600);
  // 2026-09-19: dimezzato da 1.55 a 0.775 su richiesta, riempiva mezzo schermo da vicino.
  // Ora e' piu' piccolo anche di quelli della folla (CROWD_BUBBLE_SIZE_SCALE, 1.5): e' voluto.
  assert.equal(TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE, 0.775);
});

test('greeter keeps the Seguimi state half a second longer before moving', () => {
  assert.equal(TRON_RUNNER_FOLLOW_PROMPT_DELAY_MS, 1500);
});

test('ogni cartello del greeter ha entrambe le lingue e va a capo dove deve', () => {
  for (const [nome, testo] of Object.entries({
    benvenuto: TRON_RUNNER_WELCOME_BUBBLE_TEXT,
    seguimi: GREETER_FOLLOW_BUBBLE_TEXT,
    reparti: GREETER_BOARD_BUBBLE_TEXT,
  })) {
    assert.ok(testo.it?.length, `manca l'italiano di ${nome}`);
    assert.ok(testo.en?.length, `manca l'inglese di ${nome}`);
    // Se una lingua spezza la riga e l'altra no, il cartello cambia forma fra le due pagine.
    assert.equal(testo.it.includes('<br>'), testo.en.includes('<br>'), nome);
  }
});
