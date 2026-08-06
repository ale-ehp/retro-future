import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

globalThis.window = {
  matchMedia: () => ({ matches: false }),
};

const keyboard = await import(`./keyboard.js?contact-input=${Date.now()}`);
const mouseLook = await import(`../camera/mouse-look.js?contact-input=${Date.now()}`);
const mobileMovement = await import(`./mobile-movement.js?contact-input=${Date.now()}`);
const keyboardSource = readFileSync(new URL('./keyboard.js', import.meta.url), 'utf8');

test('contact key routing ignores repeats and reports handled keys', () => {
  let calls = 0;
  const handler = () => {
    calls += 1;
    return true;
  };

  assert.equal(keyboard.routeContactTerminalKeyDown({ code: 'KeyE', repeat: true }, handler), false);
  assert.equal(calls, 0);
  assert.equal(keyboard.routeContactTerminalKeyDown({ code: 'ArrowDown', repeat: false }, handler), true);
  assert.equal(calls, 1);
});

test('contact key routing runs before escape release and movement key writes', () => {
  const routeIndex = keyboardSource.indexOf('routeContactTerminalKeyDown(e, handleContactTerminalKeyDown)');
  const escapeIndex = keyboardSource.indexOf("if (e.code === 'Escape')");
  const movementIndex = keyboardSource.indexOf('keys[e.code] = true');

  assert.notEqual(routeIndex, -1);
  assert.ok(routeIndex < escapeIndex);
  assert.ok(routeIndex < movementIndex);
});

test('mouse look is disabled while the contact camera owns input', () => {
  assert.equal(mouseLook.mouseLookAllowed({ revealComplete: true, contactCameraOwned: false }), true);
  assert.equal(mouseLook.mouseLookAllowed({ revealComplete: true, contactCameraOwned: true }), false);
  assert.equal(mouseLook.mouseLookAllowed({ revealComplete: false, contactCameraOwned: false }), false);
});

test('mobile movement reset clears the active pointer and analog vector', () => {
  Object.assign(mobileMovement.mobileTouchControlsState.movement, {
    enabled: true,
    active: true,
    pointerId: 9,
    x: 0.75,
    z: -0.5,
    magnitude: 0.9,
  });

  mobileMovement.resetMobileMovementInput();

  assert.deepEqual(mobileMovement.mobileTouchControlsState.movement, {
    enabled: true,
    active: false,
    pointerId: null,
    x: 0,
    z: 0,
    magnitude: 0,
  });
});
