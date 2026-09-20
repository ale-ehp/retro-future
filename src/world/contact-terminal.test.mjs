import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';

import {
  CONTACT_TERMINAL_CONTACTS,
  CONTACT_TERMINAL_STATES,
  contactTerminalAvailability,
  contactTerminalKeyCommand,
  contactTerminalUri,
  createContactTerminalRuntime,
  createContactTerminalStateController,
  horizontalContactMetrics,
  nextContactSelection,
} from './contact-terminal.js';

function createClassList() {
  const values = new Set();
  return {
    add: (...names) => names.forEach((name) => values.add(name)),
    remove: (...names) => names.forEach((name) => values.delete(name)),
    toggle(name, force) {
      const active = force === undefined ? !values.has(name) : Boolean(force);
      if (active) values.add(name);
      else values.delete(name);
      return active;
    },
    contains: (name) => values.has(name),
  };
}

function createElementStub() {
  const element = new EventTarget();
  element.hidden = true;
  element.classList = createClassList();
  element.focused = false;
  element.focus = () => { element.focused = true; };
  element.setAttribute = () => {};
  return element;
}

// Un canvas finto: il contesto e' un Proxy che risponde a qualunque metodo con un no-op,
// quindi per costruzione finge di essere un CanvasRenderingContext2D intero. Il cast
// dice questo a tsc; il runtime chiede un HTMLCanvasElement vero perche' lo passa a
// CanvasTexture (2026-09-20).
/** @returns {HTMLCanvasElement} */
function createCanvasStub() {
  const context = new Proxy({}, {
    get(target, key) {
      if (!(key in target)) target[key] = () => {};
      return target[key];
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    },
  });
  return /** @type {HTMLCanvasElement} */ (/** @type {unknown} */ ({ width: 0, height: 0, getContext: () => context }));
}

function createRuntimeFixture({
  reducedMotion = true,
  mobile = false,
  pointerLocked = false,
  viewMotionOffset = 0,
} = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 2000);
  camera.position.set(53.6, 11.975 + viewMotionOffset, 807.35);
  const canvasTarget = createElementStub();
  canvasTarget.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 500 });
  const actionButton = createElementStub();
  const backButton = createElementStub();
  const interactionSurface = createElementStub();
  const liveRegion = createElementStub();
  liveRegion.textContent = '';
  const body = { classList: createClassList() };
  const activated = [];
  const historyCalls = { pushes: 0, backs: 0 };
  const resumeMouseLookCalls = [];
  const history = {
    pushState: () => { historyCalls.pushes += 1; },
    back: () => { historyCalls.backs += 1; },
  };
  const eventTarget = new EventTarget();
  let clock = 10;
  let appliedViewMotion = viewMotionOffset;
  const records = [
    { civicNumberValue: 1, mesh: { position: { x: -80, z: 760 } } },
    {
      civicNumberValue: 2,
      mesh: { position: { x: 80, z: 760 } },
      basePad: {
        border: { position: { x: 4, z: 7 } },
        hitPolygon: [[40, 740], [100, 740], [100, 770], [40, 770]],
      },
    },
  ];
  let yaw = 0;
  let pitch = 0;
  let roll = 0;
  const runtime = createContactTerminalRuntime({
    scene,
    camera,
    renderer: {
      capabilities: { getMaxAnisotropy: () => 1 },
      domElement: canvasTarget,
    },
    sideBuildingRecords: records,
    PAL: { tealLight: 0x8ffcff },
    addElStripRectFrame: (group) => {
      const frame = new THREE.Object3D();
      group.add(frame);
      return frame;
    },
    getBottomY: () => 4.1,
    getPlayerSpawn: () => ({ z: 800 }),
    getRevealComplete: () => true,
    getRevealFactor: () => 1,
    getEffectEnabled: () => true,
    getOtherCameraActive: () => false,
    getYaw: () => yaw,
    setYaw: (value) => { yaw = value; },
    getPitch: () => pitch,
    setPitch: (value) => { pitch = value; },
    getViewRoll: () => roll,
    setViewRoll: (value) => { roll = value; },
    applyCameraLook: () => {},
    clearMovement: () => {},
    clearViewMotion: () => {
      camera.position.y -= appliedViewMotion;
      appliedViewMotion = 0;
    },
    stopMouseLook: () => {},
    resumeMouseLook: (options) => { resumeMouseLookCalls.push(options); },
    resetMobileMovement: () => {},
    getPointerLocked: () => pointerLocked,
    prefersReducedMotion: () => reducedMotion,
    isMobile: () => mobile,
    createCanvas: createCanvasStub,
    actionButton,
    backButton,
    interactionSurface,
    liveRegion,
    body,
    eventTarget,
    history,
    locationHref: 'https://avstudio.ai/chi-siamo/retro-future/',
    activateUri: (uri) => activated.push(uri),
    now: () => clock,
  });
  return {
    runtime,
    scene,
    camera,
    actionButton,
    backButton,
    interactionSurface,
    liveRegion,
    body,
    activated,
    eventTarget,
    historyCalls,
    resumeMouseLookCalls,
    setClock(value) { clock = value; },
  };
}

test('contact terminal availability includes the exact distance and alignment thresholds', () => {
  const base = { revealComplete: true, enabled: true, cameraFree: true };

  assert.equal(contactTerminalAvailability({ ...base, distance: 42, alignment: 0.45 }), true);
  assert.equal(contactTerminalAvailability({ ...base, distance: 42.001, alignment: 0.45 }), false);
  assert.equal(contactTerminalAvailability({ ...base, distance: 42, alignment: 0.449 }), false);
  assert.equal(contactTerminalAvailability({ ...base, distance: 2, alignment: 1, revealComplete: false }), false);
  assert.equal(contactTerminalAvailability({ ...base, distance: 2, alignment: 1, cameraFree: false }), false);
});

test('horizontal contact metrics ignore camera height and return forward alignment', () => {
  const metrics = horizontalContactMetrics(
    { x: 0, y: 200, z: 0 },
    { x: 0, y: -0.8, z: 0.6 },
    { x: 0, y: 10, z: 30 },
  );

  assert.equal(metrics.distance, 30);
  assert.equal(metrics.alignment, 1);
});

test('contact selection wraps across the two fixed contacts', () => {
  assert.equal(CONTACT_TERMINAL_CONTACTS.length, 2);
  assert.equal(nextContactSelection(0, -1), 1);
  assert.equal(nextContactSelection(1, 1), 0);
  assert.equal(nextContactSelection(0, 1), 1);
});

test('contact actions expose normalized mail and phone URIs', () => {
  assert.equal(CONTACT_TERMINAL_CONTACTS[0].value, 'info@avstudio.ai');
  assert.equal(CONTACT_TERMINAL_CONTACTS[1].value, '+39 351 7436 007');
  assert.equal(contactTerminalUri(0), 'mailto:info@avstudio.ai');
  assert.equal(contactTerminalUri(1), 'tel:+393517436007');
});

test('contact state controller follows focus and return states', () => {
  const controller = createContactTerminalStateController();

  assert.equal(controller.snapshot().state, CONTACT_TERMINAL_STATES.HIDDEN);
  controller.setAvailable(true);
  assert.equal(controller.snapshot().state, CONTACT_TERMINAL_STATES.AVAILABLE);
  assert.equal(controller.beginFocus(), true);
  assert.deepEqual(controller.snapshot(), {
    state: CONTACT_TERMINAL_STATES.FOCUSING,
    available: true,
    selection: 0,
    savedPose: true,
    lastRequestedAction: null,
    lastInputSource: null,
  });
  assert.equal(controller.completeFocus(), true);
  assert.equal(controller.snapshot().state, CONTACT_TERMINAL_STATES.ACTIVE);
  assert.equal(controller.select(1), 1);
  controller.recordAction(contactTerminalUri(1), 'keyboard');
  assert.equal(controller.beginReturn(), true);
  assert.equal(controller.snapshot().state, CONTACT_TERMINAL_STATES.RETURNING);
  assert.equal(controller.completeReturn(false), true);
  assert.deepEqual(controller.snapshot(), {
    state: CONTACT_TERMINAL_STATES.HIDDEN,
    available: false,
    selection: 1,
    savedPose: false,
    lastRequestedAction: 'tel:+393517436007',
    lastInputSource: 'keyboard',
  });
});

test('contact key routing owns only relevant keys in relevant states', () => {
  assert.deepEqual(contactTerminalKeyCommand({ code: 'KeyE' }, {
    state: CONTACT_TERMINAL_STATES.AVAILABLE,
  }), { handled: true, command: 'enter' });
  assert.deepEqual(contactTerminalKeyCommand({ code: 'KeyE' }, {
    state: CONTACT_TERMINAL_STATES.ACTIVE,
  }), { handled: true, command: 'return' });
  assert.deepEqual(contactTerminalKeyCommand({ code: 'Escape' }, {
    state: CONTACT_TERMINAL_STATES.FOCUSING,
  }), { handled: true, command: 'return' });
  assert.deepEqual(contactTerminalKeyCommand({ code: 'ArrowUp' }, {
    state: CONTACT_TERMINAL_STATES.ACTIVE,
  }), { handled: true, command: 'select', delta: -1 });
  assert.deepEqual(contactTerminalKeyCommand({ code: 'ArrowRight' }, {
    state: CONTACT_TERMINAL_STATES.ACTIVE,
  }), { handled: true, command: 'select', delta: 1 });
  assert.deepEqual(contactTerminalKeyCommand({ code: 'Enter' }, {
    state: CONTACT_TERMINAL_STATES.ACTIVE,
  }), { handled: true, command: 'activate' });
  assert.deepEqual(contactTerminalKeyCommand({ code: 'ArrowDown' }, {
    state: CONTACT_TERMINAL_STATES.AVAILABLE,
  }), { handled: false, command: null });
  assert.deepEqual(contactTerminalKeyCommand({ code: 'KeyE', repeat: true }, {
    state: CONTACT_TERMINAL_STATES.AVAILABLE,
  }), { handled: false, command: null });
});

test('contact runtime builds civic 2, focuses, activates, and restores the camera', () => {
  const fixture = createRuntimeFixture();
  const { runtime, camera, actionButton, backButton, body, activated } = fixture;
  const initialPosition = camera.position.clone();
  const initialQuaternion = camera.quaternion.clone();

  runtime.update(0);
  let inspect = runtime.inspect();
  assert.equal(inspect.civicNumberValue, 2);
  assert.equal(inspect.perimeterSide, 'start-player');
  assert.ok(Math.abs(inspect.worldPosition.x - 53.6) < 1e-12);
  assert.ok(Math.abs(inspect.worldPosition.y - 11.975) < 1e-12);
  assert.ok(Math.abs(inspect.worldPosition.z - 777.35) < 1e-12);
  assert.equal(inspect.textureWidth, 1024);
  assert.equal(inspect.textureHeight, 512);
  assert.equal(inspect.hitTargetCount, 2);
  assert.equal(inspect.state, CONTACT_TERMINAL_STATES.AVAILABLE);
  assert.equal(actionButton.hidden, false);

  assert.equal(runtime.handleKeyDown({ code: 'KeyE', repeat: false, preventDefault() {} }), true);
  inspect = runtime.inspect();
  assert.equal(inspect.state, CONTACT_TERMINAL_STATES.ACTIVE);
  assert.equal(body.classList.contains('contact-terminal-focus'), true);
  assert.equal(backButton.hidden, false);
  assert.equal(camera.position.z, 801.35);

  assert.equal(runtime.handleKeyDown({ code: 'ArrowUp', repeat: false, preventDefault() {} }), true);
  assert.equal(runtime.inspect().selection, 1);
  assert.equal(runtime.handleKeyDown({ code: 'Enter', repeat: false, preventDefault() {} }), true);
  assert.deepEqual(activated, ['tel:+393517436007']);
  assert.equal(runtime.inspect().lastInputSource, 'keyboard');

  assert.equal(runtime.handleKeyDown({ code: 'KeyE', repeat: false, preventDefault() {} }), true);
  assert.equal(runtime.inspect().state, CONTACT_TERMINAL_STATES.AVAILABLE);
  assert.equal(body.classList.contains('contact-terminal-focus'), false);
  assert.ok(camera.position.distanceTo(initialPosition) < 1e-12);
  assert.ok(1 - Math.abs(camera.quaternion.dot(initialQuaternion)) < 1e-12);

  const stableTextureUpdates = runtime.inspect().textureUpdates;
  runtime.update(1000);
  runtime.update(2000);
  assert.equal(runtime.inspect().textureUpdates, stableTextureUpdates);
});

test('contact runtime raycasts both rows for hover and direct pointer activation', () => {
  const { runtime, activated } = createRuntimeFixture();
  runtime.update(0);
  runtime.handleKeyDown({ code: 'KeyE', repeat: false, preventDefault() {} });

  assert.equal(runtime.handlePointerMove({ clientX: 500, clientY: 318 }), true);
  assert.equal(runtime.inspect().selection, 1);
  assert.equal(runtime.handlePointerClick({ clientX: 500, clientY: 318, pointerType: 'mouse', preventDefault() {} }), true);
  assert.deepEqual(activated, ['tel:+393517436007']);
  assert.equal(runtime.inspect().lastInputSource, 'pointer');

  assert.equal(runtime.handlePointerMove({ clientX: 500, clientY: 220 }), true);
  assert.equal(runtime.inspect().selection, 0);
  assert.equal(runtime.handlePointerClick({ clientX: 500, clientY: 220, pointerType: 'touch', preventDefault() {} }), true);
  assert.deepEqual(activated, ['tel:+393517436007', 'mailto:info@avstudio.ai']);
  assert.equal(runtime.inspect().lastInputSource, 'touch');
});

test('mobile history back exits focus before page navigation', () => {
  const fixture = createRuntimeFixture({ mobile: true });
  const { runtime, eventTarget, historyCalls } = fixture;
  runtime.update(0);
  runtime.handleKeyDown({ code: 'KeyE', repeat: false, preventDefault() {} });

  assert.equal(historyCalls.pushes, 1);
  assert.equal(runtime.inspect().historyEntryActive, true);
  eventTarget.dispatchEvent(new Event('popstate'));
  assert.equal(runtime.inspect().state, CONTACT_TERMINAL_STATES.AVAILABLE);
  assert.equal(runtime.inspect().historyEntryActive, false);
  assert.equal(historyCalls.backs, 0);

  runtime.handleKeyDown({ code: 'KeyE', repeat: false, preventDefault() {} });
  runtime.beginReturn('back-button');
  assert.equal(historyCalls.pushes, 2);
  assert.equal(historyCalls.backs, 1);
  assert.equal(runtime.inspect().state, CONTACT_TERMINAL_STATES.AVAILABLE);
});

test('contact runtime eases focus and return when reduced motion is off', () => {
  const fixture = createRuntimeFixture({ reducedMotion: false });
  const { runtime, camera, setClock } = fixture;
  const initialZ = camera.position.z;
  runtime.update(0);
  runtime.handleKeyDown({ code: 'KeyE', repeat: false, preventDefault() {} });

  setClock(350);
  runtime.update(350);
  assert.equal(runtime.inspect().state, CONTACT_TERMINAL_STATES.FOCUSING);
  assert.ok(camera.position.z < initialZ && camera.position.z > 801.35);

  setClock(700);
  runtime.update(700);
  assert.equal(runtime.inspect().state, CONTACT_TERMINAL_STATES.ACTIVE);
  runtime.handleKeyDown({ code: 'Escape', repeat: false, preventDefault() {} });
  setClock(1240);
  runtime.update(1240);
  assert.equal(runtime.inspect().state, CONTACT_TERMINAL_STATES.AVAILABLE);
  assert.ok(Math.abs(camera.position.z - initialZ) < 1e-12);
});

test('contact runtime saves the camera after removing transient walk motion', () => {
  const { runtime, camera } = createRuntimeFixture({ viewMotionOffset: 0.5 });
  runtime.update(0);
  runtime.handleKeyDown({ code: 'KeyE', repeat: false, preventDefault() {} });
  runtime.handleKeyDown({ code: 'Escape', repeat: false, preventDefault() {} });

  assert.ok(Math.abs(camera.position.y - 11.975) < 1e-12);
});

test('desktop return re-engages mouse look without another canvas click', () => {
  const { runtime, resumeMouseLookCalls } = createRuntimeFixture({ pointerLocked: true });
  runtime.update(0);
  runtime.handleKeyDown({ code: 'KeyE', repeat: false, preventDefault() {} });
  runtime.handleKeyDown({ code: 'Escape', repeat: false, preventDefault() {} });

  assert.deepEqual(resumeMouseLookCalls, [{ requestPointerLock: true }]);
});

test('mobile return keeps touch look gesture-driven', () => {
  const { runtime, resumeMouseLookCalls } = createRuntimeFixture({ mobile: true, pointerLocked: true });
  runtime.update(0);
  runtime.handleKeyDown({ code: 'KeyE', repeat: false, preventDefault() {} });
  runtime.handleKeyDown({ code: 'Escape', repeat: false, preventDefault() {} });

  assert.deepEqual(resumeMouseLookCalls, []);
});

// Stesso patto dei tabelloni (vedi city-boards.test.mjs): il terminale non scrive profondita'
// e il suo gruppo sta sotto i cartelli dei personaggi, altrimenti li coprirebbe (2026-09-19).
test('il terminale costruito non scrive profondita\' e sta sotto i cartelli', async () => {
  const { CHARACTER_BUBBLE_RENDER_ORDER } = await import('../character/speech-bubbles.js');
  const fixture = createRuntimeFixture();
  fixture.runtime.update(0);
  const gruppo = fixture.scene.getObjectByName('contact-terminal-2');
  assert.ok(gruppo instanceof THREE.Group, 'manca il gruppo contact-terminal-2 nella scena');
  assert.ok(gruppo.renderOrder < CHARACTER_BUBBLE_RENDER_ORDER, `il terminale disegna a ${gruppo.renderOrder}, sopra i cartelli`);
  let mesh = 0;
  gruppo.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return;
    mesh += 1;
    assert.equal(o.material.depthWrite, false, `${o.name} scrive profondita'`);
  });
  assert.ok(mesh >= 2, `solo ${mesh} mesh nel terminale`);
});
