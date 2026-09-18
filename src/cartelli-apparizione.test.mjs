// I cartelli si aprono dal basso verso l'alto invece di comparire gia' fatti (chiesto il
// 2026-09-18: "adesso sono popup"). Il pezzo che conta e' montaCartello(), che per ogni
// istante dell'apparizione decide altezza e centro del pannello. Qui si prova quello, senza
// browser: e' una funzione pura.
import assert from 'node:assert/strict';
import test from 'node:test';
import { montaCartello } from './character/speech-bubbles.js';

/** Un finto pannello che registra cosa gli viene fatto. */
function finto() {
  return {
    scale: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } },
    position: { y: 0 },
    material: { opacity: 0 },
  };
}

const BASE_Y = 10;      // altezza a cui sta il cartello quando e' tutto aperto
const ALTEZZA = 2;
const LARGHEZZA = 6;
const bordoDiSotto = (s) => s.position.y - s.scale.y / 2;

test('a inizio apparizione il cartello e\' praticamente chiuso', () => {
  const s = finto();
  montaCartello(s, BASE_Y, LARGHEZZA, ALTEZZA, 0, 1);
  assert.ok(s.scale.y < ALTEZZA * 0.02, `altezza iniziale ${s.scale.y}`);
  assert.equal(s.material.opacity, 0);
});

test('a fine apparizione e\' alto quanto deve e centrato dove deve', () => {
  const s = finto();
  montaCartello(s, BASE_Y, LARGHEZZA, ALTEZZA, 1, 1);
  assert.equal(s.scale.y, ALTEZZA);
  assert.equal(s.scale.x, LARGHEZZA);
  assert.equal(s.position.y, BASE_Y);
  assert.equal(s.material.opacity, 1);
});

test('il bordo di sotto non si muove: cresce solo verso l\'alto', () => {
  const atteso = BASE_Y - ALTEZZA / 2;
  for (const t of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
    const s = finto();
    montaCartello(s, BASE_Y, LARGHEZZA, ALTEZZA, t, 1);
    assert.ok(Math.abs(bordoDiSotto(s) - atteso) < 1e-9, `a t=${t} il bordo sta a ${bordoDiSotto(s)}`);
  }
});

test('l\'altezza cresce sempre, senza tornare indietro', () => {
  let precedente = -1;
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const s = finto();
    montaCartello(s, BASE_Y, LARGHEZZA, ALTEZZA, t, 1);
    assert.ok(s.scale.y >= precedente, `a t=${t.toFixed(2)} l'altezza cala`);
    precedente = s.scale.y;
  }
});

test('diventa opaco prima di finire di aprirsi, altrimenti sembra una dissolvenza', () => {
  const meta = finto();
  montaCartello(meta, BASE_Y, LARGHEZZA, ALTEZZA, 0.5, 1);
  assert.equal(meta.material.opacity, 1, 'a meta\' apertura deve essere gia\' pieno');
  const presto = finto();
  montaCartello(presto, BASE_Y, LARGHEZZA, ALTEZZA, 0.5, 1);
  assert.ok(presto.scale.y < ALTEZZA, 'ma non ancora tutto aperto');
});

test('valori fuori scala non rompono il pannello', () => {
  const sotto = finto(); montaCartello(sotto, BASE_Y, LARGHEZZA, ALTEZZA, -3, 1);
  assert.ok(sotto.scale.y > 0 && sotto.scale.y < ALTEZZA * 0.02);
  const sopra = finto(); montaCartello(sopra, BASE_Y, LARGHEZZA, ALTEZZA, 9, 1);
  assert.equal(sopra.scale.y, ALTEZZA);
});
