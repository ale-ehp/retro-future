// Le tre funzioni di cap sono pure e decidono a quale risoluzione la demo
// disegna su mobile: sono il punto in cui un errore di segno o un Math.max al
// posto di un Math.min non si vede sul desktop dello sviluppatore e si vede
// solo sul telefono, dove il budget e' gia' finito.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  effectiveBloomScaleForDevice,
  effectivePixelRatioForDevice,
  effectiveRenderScaleForDevice,
} from './performance-mobile.js';

// Senza il tipo tsc vede una lista di `string | funzione` e non sa chiamare il secondo elemento (2026-09-20).
/** @type {Array<[string, (attivo: boolean, base: number, tetto: number) => number]>} */
const CAPS = [
  ['render scale', effectiveRenderScaleForDevice],
  ['pixel ratio', effectivePixelRatioForDevice],
  ['bloom scale', effectiveBloomScaleForDevice],
];

for (const [nome, cap] of CAPS) {
  test(`${nome}: sul profilo mobile il cap vince quando e' piu' basso`, () => {
    assert.equal(cap(true, 3, 2), 2);
  });

  test(`${nome}: sul profilo mobile un valore gia' sotto il cap resta intatto`, () => {
    assert.equal(cap(true, 1.5, 2), 1.5);
  });

  test(`${nome}: fuori dal profilo mobile il cap non si applica mai`, () => {
    assert.equal(cap(false, 3, 2), 3);
    assert.equal(cap(false, 1.5, 2), 1.5);
  });

  test(`${nome}: il cap abbassa e non alza mai`, () => {
    for (const base of [0.5, 1, 1.5, 2, 3, 4]) {
      for (const limite of [0.5, 1, 2, 3]) {
        assert.ok(cap(true, base, limite) <= base, `${base}/${limite} ha alzato il valore`);
      }
    }
  });
}
