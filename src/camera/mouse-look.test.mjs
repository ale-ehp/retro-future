import assert from 'node:assert/strict';
import test from 'node:test';

// window e document finti: il modulo registra i suoi listener su di loro
globalThis.window = /** @type {any} */ (Object.assign(new EventTarget(), {
  matchMedia: () => ({ matches: false }),
}));
globalThis.document = /** @type {any} */ (Object.assign(new EventTarget(), { pointerLockElement: null }));

const {
  acceptsSingleCameraTouch,
  getCameraTouchCandidates,
  initMouseLook,
} = await import('./mouse-look.js');

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

test('un dito sul canvas gira la camera e ferma il gesto del browser', () => {
  // Prima (fino al 2026-09-19) si cercava nel sorgente `{ passive: false }` e
  // `e.preventDefault()`. Qui si tocca davvero un canvas finto: il listener deve essere
  // registrato non-passivo (altrimenti preventDefault e' ignorato dal browser) e il tocco
  // deve chiamare preventDefault e muovere la camera. Il touch-action del canvas si misura
  // nel browser, in src/pagina-cover.test.mjs.
  const registrazioni = [];
  const canvas = new EventTarget();
  const registraOriginale = canvas.addEventListener.bind(canvas);
  canvas.addEventListener = (tipo, fn, opzioni) => { registrazioni.push({ tipo, opzioni }); registraOriginale(tipo, fn, opzioni); };
  let yaw = 0;
  let pitch = 0;
  initMouseLook({}, {
    getYaw: () => yaw,
    setYaw: (v) => { yaw = v; },
    getPitch: () => pitch,
    setPitch: (v) => { pitch = v; },
    applyCameraLook: () => {},
    PITCH_LIMIT: Math.PI * 0.49,
    lockEl: canvas,
    DRAG_ACTIVATE_PX: 4,
    POINTER_LOCK_SETTLE_MS: 220,
    POINTER_CLICK_SUPPRESS_MS: 420,
    clearVerticalMovementState: () => {},
    setTronDiscCursorVisible: () => {},
    handleTronDiscCursorMove: () => {},
    tronDiscCursorState: {},
    welcomeWindowUsesTouchPrompt: () => false,
    requestLandscapeFullscreen: () => {},
    isMobileMovementControlTarget: isMovementTarget,
    getCityRevealComplete: () => true,
    getMouseSensitivityScale: () => 1,
    contactTerminalOwnsCamera: () => false,
  });
  const nonPassivi = registrazioni.filter((r) => r.tipo === 'touchstart' && r.opzioni?.passive === false);
  assert.equal(nonPassivi.length, 1, 'touchstart deve essere registrato con passive: false, altrimenti preventDefault non conta');

  const tocco = (tipo, touches) => {
    const e = /** @type {any} */ (new Event(tipo, { cancelable: true }));
    e.touches = touches;
    e.changedTouches = touches;
    return e;
  };
  const dito = { identifier: 7, target: cameraTarget, clientX: 100, clientY: 100 };
  const inizio = tocco('touchstart', [dito]);
  canvas.dispatchEvent(inizio);
  assert.equal(inizio.defaultPrevented, true, 'senza preventDefault il browser fa scroll o zoom');

  const mossa = tocco('touchmove', [{ ...dito, clientX: 140, clientY: 100 }]);
  window.dispatchEvent(mossa);
  assert.equal(mossa.defaultPrevented, true);
  assert.notEqual(yaw, 0, 'il dito che scorre deve girare la camera');
});
