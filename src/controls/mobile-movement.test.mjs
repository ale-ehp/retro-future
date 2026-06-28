import assert from 'node:assert/strict';
import test from 'node:test';

function createClassList() {
  return {
    values: new Map(),
    add(name) {
      this.values.set(name, true);
    },
    remove(name) {
      this.values.set(name, false);
    },
    toggle(name, value) {
      this.values.set(name, Boolean(value));
    },
    contains(name) {
      return Boolean(this.values.get(name));
    },
  };
}

async function loadMobileMovementWithEnvironment({ mobileActive = true, fullscreenSupported = true } = {}) {
  const fullscreenCalls = [];
  const orientationLocks = [];
  const documentElement = {
    classList: createClassList(),
  };
  if (fullscreenSupported) {
    documentElement.requestFullscreen = function requestFullscreen(...args) {
      fullscreenCalls.push(args);
      globalThis.document.fullscreenElement = documentElement;
      return Promise.resolve();
    };
  }

  globalThis.performance = { now: () => 1234 };
  globalThis.screen = {
    orientation: {
      lock(type) {
        orientationLocks.push(type);
        return Promise.resolve();
      },
    },
  };
  globalThis.window = {
    innerWidth: 390,
    innerHeight: 844,
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
    addEventListener() {},
  };
  globalThis.document = {
    documentElement,
    fullscreenElement: null,
    webkitFullscreenElement: null,
    body: { classList: createClassList() },
    addEventListener() {},
  };

  const module = await import(`./mobile-movement.js?test=${Date.now()}-${Math.random()}`);
  module.initMobileMovement({
    mobilePerformanceProfileActive: () => mobileActive,
    performanceDiagnosticsCanvasSummary: () => ({ ok: true }),
    applyViewportResize() {},
    mobileMovementPadEl: null,
    mobileMovementKnobEl: null,
  });

  return { module, fullscreenCalls, orientationLocks };
}

test('welcome immersive request enters fullscreen and locks landscape from portrait mobile', async () => {
  const { module, fullscreenCalls, orientationLocks } = await loadMobileMovementWithEnvironment();

  const result = await module.requestLandscapeImmersive('welcome-button');

  assert.equal(result, true);
  assert.equal(fullscreenCalls.length, 1);
  assert.deepEqual(orientationLocks, ['landscape']);
  assert.equal(module.mobileTouchControlsState.fullscreen.lastAttemptSource, 'welcome-button');
  assert.equal(module.mobileTouchControlsState.fullscreen.lastResult, 'entered');
  assert.equal(module.mobileTouchControlsState.fullscreen.orientationLastResult, 'locked');
});

test('welcome immersive request still asks fullscreen outside the mobile profile', async () => {
  const { module, fullscreenCalls, orientationLocks } = await loadMobileMovementWithEnvironment({ mobileActive: false });

  const result = await module.requestLandscapeImmersive('welcome-button');

  assert.equal(result, true);
  assert.equal(fullscreenCalls.length, 1);
  assert.deepEqual(orientationLocks, []);
  assert.equal(module.mobileTouchControlsState.fullscreen.lastResult, 'entered');
  assert.equal(module.mobileTouchControlsState.fullscreen.orientationLastResult, 'skipped-not-mobile');
});

test('welcome immersive request enables mobile immersive fallback when native fullscreen is unsupported', async () => {
  const { module, fullscreenCalls, orientationLocks } = await loadMobileMovementWithEnvironment({ fullscreenSupported: false });

  const result = await module.requestLandscapeImmersive('welcome-button');

  assert.equal(result, true);
  assert.equal(fullscreenCalls.length, 0);
  assert.deepEqual(orientationLocks, ['landscape']);
  assert.equal(module.mobileTouchControlsState.fullscreen.lastResult, 'unsupported');
  assert.equal(module.mobileTouchControlsState.fullscreen.mobileImmersiveActive, true);
  assert.equal(globalThis.document.documentElement.classList.contains('mobile-immersive-active'), true);
  assert.equal(globalThis.document.body.classList.contains('mobile-immersive-active'), true);
});
