import assert from 'node:assert/strict';
import test from 'node:test';

// window e document finti: quanto basta ai moduli di input per registrare i listener
// e ricevere eventi. Prima di importarli, perche' li leggono all'import.
globalThis.window = /** @type {any} */ (Object.assign(new EventTarget(), {
  matchMedia: () => ({ matches: false }),
}));
globalThis.document = /** @type {any} */ (Object.assign(new EventTarget(), { hidden: false }));

const keyboard = await import(`./keyboard.js?contact-input=${Date.now()}`);
const mouseLook = await import(`../camera/mouse-look.js?contact-input=${Date.now()}`);
const mobileMovement = await import(`./mobile-movement.js?contact-input=${Date.now()}`);

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

test('il terminale vede il tasto prima di tutti, e se lo prende non arriva al movimento', () => {
  // Prima (fino al 2026-09-19) si controllava l'ORDINE DELLE RIGHE nel sorgente di keyboard.js.
  // Qui si preme davvero un tasto: quando il terminale lo gestisce, `keys` non deve
  // registrarlo, altrimenti il personaggio cammina mentre scorri i contatti.
  let gestisce = true;
  const visti = [];
  keyboard.initKeyboard({
    DEMO_START_KEY: 'Space',
    welcomeWindowVisible: () => false,
    ensureFootstepAudioReady: () => {},
    triggerBackspaceDroneIntro: () => {},
    resetCameraHeightToDefault: () => {},
    captureLivePlayerSpawn: () => {},
    getBackspaceIntroTriggered: () => true,
    handleContactTerminalKeyDown: (e) => {
      // il terminale deve vedere il tasto PRIMA che venga scritto in keys
      visti.push({ code: e.code, giaScritto: Boolean(keyboard.keys[e.code]) });
      return gestisce;
    },
  });
  const premi = (code) => window.dispatchEvent(Object.assign(new Event('keydown'), { code, repeat: false }));

  premi('KeyW');
  assert.deepEqual(visti, [{ code: 'KeyW', giaScritto: false }]);
  assert.ok(!keyboard.keys.KeyW, 'il tasto preso dal terminale e\' arrivato al movimento');

  gestisce = false;   // terminale chiuso: il tasto va dove andava prima
  premi('KeyW');
  assert.equal(keyboard.keys.KeyW, true);
  assert.equal(visti.length, 2, 'il terminale deve essere interpellato comunque, per primo');
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
