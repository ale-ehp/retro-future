// Dove si ferma chi accoglie, davanti al tabellone dei reparti, e quanto e' grande il
// cartello che tiene li'.
//
// Il 2026-09-19 si fermava troppo vicino al terminale contatti e il suo cartello ci finiva
// sopra. resolveGreeterBoardAnchorRuntime() e' una funzione pura: si puo' provare qui che
// lo scostamento laterale fa davvero quello che dice, invece di rincorrere il personaggio
// dentro la scena. Il cartello al tabellone si prova facendo avanzare un membro finto
// nello stato `atBoard`: prima si leggeva il numero nel sorgente.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceTronRunnerCrowdMemberRuntime,
  resolveGreeterBoardAnchorRuntime,
  TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE,
} from './character/runner-crowd-runtime.js';

/** Un tabellone finto, allineato agli assi: yaw 0 significa "destra" lungo le x. */
const tabellone = (extra = {}) => ({
  group: { visible: true },
  boardPosition: { x: 0, z: 0 },
  boardWidth: 20,
  yaw: 0,
  ...extra,
});

const ancora = (sideGap, frontGap = 1.4, board = tabellone()) => {
  const a = resolveGreeterBoardAnchorRuntime({
    getCityDepartmentBoards: () => [board],
    sideGap,
    frontGap,
  });
  return { x: a.x, z: a.z };
};

test('lo scostamento laterale sposta davvero il personaggio di lato', () => {
  const stretto = ancora(2.4);
  const largo = ancora(5.2);
  assert.ok(largo.x > stretto.x, `${largo.x} non e' piu' a destra di ${stretto.x}`);
  assert.equal(+(largo.x - stretto.x).toFixed(3), 2.8);
});

test('parte sempre dal bordo del tabellone, non dal suo centro', () => {
  const a = ancora(5.2);
  assert.equal(a.x, 10 + 5.2);   // mezza larghezza piu' lo scostamento
});

test('al tabellone il cartello e\' piu\' grande di quello di benvenuto, ma non doppio', () => {
  // Il benvenuto e' stato dimezzato prima, il cartello dei reparti dopo (2026-09-19): a 2
  // arrivava a sfiorare il terminale. Il rapporto fra i due e' cio' che conta, non i numeri.
  const membro = {
    index: 0,
    greetStage: 'atBoard',
    greetPosed: true,
    group: { position: { x: 15, z: 0 }, rotation: { y: 0 } },
    greetBoardCenterX: 0,
    greetBoardCenterZ: 0,
  };
  const chiamate = { bubble: 0 };
  advanceTronRunnerCrowdMemberRuntime({
    runtime: () => ({
      normalizeState() {},
      applyGreeterHeadLook() {},
      setGreeterBubble() { chiamate.bubble += 1; },
      resolveGreeterBoardAnchor: () => null,
      startGreeterWalkingToBoard() {},
    }),
    camera: { position: { x: 15, y: 6, z: 20 } },
    surfaceYForPoint: () => ({ y: 0 }),
    lerpAngle: (a, b) => b,
    greeterIndex: 0,
    greeterBubbleDurationMs: 3600,
    greeterFollowDelayMs: 1500,
    greeterBoardReach: 1,
    greetDistance: 7.4,
    greeterBoardBubbleRange: 60,
    greeterBoardStanceDeg: 45,
    crowdReachRadius: 4.2,
    pauseChance: 0,
    pauseMinMs: 0,
    pauseMaxMs: 0,
    turnDurationMs: 0,
    yieldDurationMs: 0,
  }, membro, 0.016, 10_000);
  assert.ok(membro.bubbleText, 'al tabellone deve parlare');
  assert.equal(membro.bubbleProximity, true);
  assert.equal(membro.bubbleInRange, true, 'a 20 unita\' il cartello deve essere in portata');
  assert.ok(membro.bubbleSizeScale > TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE, `${membro.bubbleSizeScale} non supera il benvenuto (${TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE})`);
  assert.ok(membro.bubbleSizeScale < TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE * 2, `${membro.bubbleSizeScale}: a quella misura sfiorava il terminale`);
});
