import assert from 'node:assert/strict';
import test from 'node:test';

function assertNear(actual, expected) {
  assert.ok(
    Math.abs(actual - expected) < 1e-12,
    `expected ${actual} to be near ${expected}`
  );
}

test('city board signs use the shared 30 percent opacity reduction', async () => {
  globalThis.window = {};
  globalThis.location = { search: '' };
  const cityBoards = await import(`./city-boards.js?opacity-test=${Date.now()}`);

  assertNear(cityBoards.CITY_DEPARTMENT_BOARD_PANEL_BASE_OPACITY, 0.46 * 0.7);
  assertNear(cityBoards.CITY_DEPARTMENT_BOARD_TEXT_BASE_OPACITY, 0.96 * 1.25 * 0.7);
  assertNear(cityBoards.CITY_ROLE_BOARD_PANEL_BASE_OPACITY, 0.4 * 0.7);
  assertNear(cityBoards.CITY_ROLE_BOARD_TEXT_BASE_OPACITY, 0.96 * 1.25 * 0.7);
});

test('city board signs are 50 percent larger in world space', async () => {
  globalThis.window = {};
  globalThis.location = { search: '' };
  const cityBoards = await import(`./city-boards.js?size-test=${Date.now()}`);

  assert.equal(cityBoards.CITY_DEPARTMENT_BOARD_WIDTH, 31.5);
  assert.equal(cityBoards.CITY_DEPARTMENT_BOARD_HEIGHT, 15.75);
  assert.equal(cityBoards.CITY_ROLE_BOARD_WIDTH, 18);
  assert.equal(cityBoards.CITY_ROLE_BOARD_HEIGHT, 9);
});

test('city board signs respect foreground character depth', async () => {
  globalThis.window = {};
  globalThis.location = { search: '' };
  const cityBoards = await import(`./city-boards.js?depth-test=${Date.now()}`);

  assert.equal(cityBoards.CITY_DEPARTMENT_BOARD_DEPTH_TEST, true);
  assert.equal(cityBoards.CITY_ROLE_BOARD_DEPTH_TEST, true);
});
