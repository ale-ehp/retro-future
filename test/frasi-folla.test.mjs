// runner-crowd-lines.js e' un modulo puro: nessun three, nessun DOM. Il pescaggio
// e' deterministico per costruzione (LCG seminato dall'indice del personaggio) ed
// e' proprio quella proprieta' che va protetta: se diventasse casuale, lo stesso
// personaggio direbbe frasi diverse a ogni giro e la scena perderebbe coerenza.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TRON_RUNNER_CROWD_LINES,
  TRON_RUNNER_CROWD_TALK_DURATION_MS,
  TRON_RUNNER_CROWD_TALK_LINES_PER_MEMBER,
  TRON_RUNNER_CROWD_TALK_REARM_RANGE,
  TRON_RUNNER_CROWD_TALK_RANGE,
  pickTronRunnerCrowdLines,
} from '../src/character/runner-crowd-lines.js';

test('il pescaggio e deterministico: stesso indice, stesse frasi', () => {
  for (const index of [0, 1, 7, 42, 199]) {
    const first = pickTronRunnerCrowdLines(index, TRON_RUNNER_CROWD_LINES, 3);
    const second = pickTronRunnerCrowdLines(index, TRON_RUNNER_CROWD_LINES, 3);
    assert.deepEqual(first, second);
  }
});

test('personaggi diversi non ricevono tutti lo stesso terzetto', () => {
  const seen = new Set();
  for (let index = 0; index < 40; index += 1) {
    seen.add(pickTronRunnerCrowdLines(index, TRON_RUNNER_CROWD_LINES, 3).join('|'));
  }
  assert.ok(seen.size > 30, `troppa poca varieta': ${seen.size} terzetti distinti su 40`);
});

test('un personaggio non ripete due volte la stessa frase', () => {
  for (let index = 0; index < 40; index += 1) {
    const lines = pickTronRunnerCrowdLines(index, TRON_RUNNER_CROWD_LINES, 3);
    assert.equal(new Set(lines).size, lines.length);
  }
});

test('ogni frase pescata viene dal pool', () => {
  const pool = new Set(TRON_RUNNER_CROWD_LINES);
  for (let index = 0; index < 40; index += 1) {
    for (const line of pickTronRunnerCrowdLines(index, TRON_RUNNER_CROWD_LINES, 3)) {
      assert.ok(pool.has(line), `frase fuori dal pool: ${line}`);
    }
  }
});

test('chiedere piu frasi del pool termina invece di ciclare a vuoto', () => {
  // Il loop esce su used.size === pool.length: senza quella condizione il ciclo
  // non finirebbe mai. Vale la pena bloccarlo, e' un blocco totale della pagina.
  const lines = pickTronRunnerCrowdLines(3, TRON_RUNNER_CROWD_LINES, TRON_RUNNER_CROWD_LINES.length + 5);
  assert.equal(lines.length, TRON_RUNNER_CROWD_LINES.length);
});

test('pool vuoto non manda in loop infinito', () => {
  assert.deepEqual(pickTronRunnerCrowdLines(1, [], 3), []);
});

test('le soglie di parlato hanno isteresi', () => {
  // Senza rearm > range il fumetto ripartirebbe a ogni frame stando sulla soglia.
  assert.ok(TRON_RUNNER_CROWD_TALK_REARM_RANGE > TRON_RUNNER_CROWD_TALK_RANGE);
  assert.ok(TRON_RUNNER_CROWD_TALK_DURATION_MS > 0);
  assert.ok(TRON_RUNNER_CROWD_TALK_LINES_PER_MEMBER >= 1);
  assert.ok(TRON_RUNNER_CROWD_TALK_LINES_PER_MEMBER <= TRON_RUNNER_CROWD_LINES.length);
});

test('il copy rispetta le regole documentate in docs/frasi-folla.md', () => {
  for (const line of TRON_RUNNER_CROWD_LINES) {
    assert.doesNotMatch(line, /[–—]/, `trattino lungo o corto in: ${line}`);
    assert.doesNotMatch(line, /AVstudio|AVSTUDIO|Avstudio/, `brand non minuscolo in: ${line}`);
    assert.ok(line.length <= 60, `frase troppo lunga per il fumetto: ${line}`);
    assert.equal(line, line.trim(), `spazi ai bordi in: ${line}`);
  }
});

test('non ci sono frasi duplicate nel pool', () => {
  assert.equal(new Set(TRON_RUNNER_CROWD_LINES).size, TRON_RUNNER_CROWD_LINES.length);
});
