// Dove si ferma chi accoglie, davanti al tabellone dei reparti.
//
// Il 2026-09-19 si fermava troppo vicino al terminale contatti e il suo cartello ci finiva
// sopra. resolveGreeterBoardAnchorRuntime() e' una funzione pura: si puo' provare qui che
// lo scostamento laterale fa davvero quello che dice, invece di rincorrere il personaggio
// dentro la scena.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolveGreeterBoardAnchorRuntime } from './character/runner-crowd-runtime.js';
import { TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE } from './character/runner-crowd-runtime.js';

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

test('lo scostamento in uso e\' quello aumentato', () => {
  // Il valore vive in main.js accanto a dove viene passato: qui si controlla che non sia
  // tornato al 2.4 di prima, che rimetteva il cartello addosso al terminale.
  const main = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
  const valore = Number(main.match(/const GREETER_BOARD_SIDE_GAP = ([\d.]+);/)[1]);
  assert.ok(valore >= 5, `lo scostamento e' tornato a ${valore}`);
});

test('il cartello dei reparti e\' la meta\' di prima', () => {
  const runtime = readFileSync(new URL('./character/runner-crowd-runtime.js', import.meta.url), 'utf8');
  const blocco = runtime.slice(runtime.indexOf("greetStage === 'atBoard'"));
  const scala = Number(blocco.match(/bubbleSizeScale = ([\d.]+);/)[1]);
  assert.equal(scala, 1);
  // e resta comunque piu' grande del cartello di benvenuto, che e' stato dimezzato prima
  assert.ok(scala > TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE);
});
