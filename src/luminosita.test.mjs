// La luminosita' dei personaggi ha un tetto, ed e' una trappola.
//
// Il 2026-09-19, alzando TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY da 2.4 a 3 non cambiava
// nulla: tronRunnerCrowdLedEmissiveIntensity() taglia il risultato con un clamp, e i
// personaggi ci sbattevano gia' contro. La misura a scena viva lo diceva chiaro, la base
// restava 12 prima e dopo. Chi domani alza l'intensita' senza toccare il tetto si ritrova
// nella stessa situazione: qui il tetto viene confrontato con quello che serve davvero.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY,
  TRON_RUNNER_IDLE_CHARACTER_BRIGHTNESS,
} from './character/characters.js';
import { tronRunnerCrowdLedEmissiveIntensity, tronRunnerCharacterLedDefaultScale } from './character/runner-crowd-leds.js';

const sorgenteLed = readFileSync(new URL('./character/runner-crowd-leds.js', import.meta.url), 'utf8');
const tetto = Number(sorgenteLed.match(/clamp\(TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY \* scale, 0, (\d+)\)/)[1]);

test('il tetto lascia spazio all\'intensita\' dichiarata', () => {
  // con i valori di riposo il risultato non deve gia' toccare il tetto, altrimenti ogni
  // futura modifica all'intensita' e' silenziosamente inutile
  const aRiposo = tronRunnerCrowdLedEmissiveIntensity({
    ledBrightness: tronRunnerCharacterLedDefaultScale(),
    ledBloom: 1,
  });
  assert.ok(aRiposo <= tetto, `a riposo ${aRiposo} supera il tetto ${tetto}`);
  assert.ok(tetto >= TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY * 4,
    `il tetto ${tetto} e' troppo vicino all'intensita' ${TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY}`);
});

test('chi sta fermo e\' piu\' luminoso degli altri', () => {
  assert.ok(TRON_RUNNER_IDLE_CHARACTER_BRIGHTNESS > 1, 'il fermo deve staccarsi dagli altri');
  const idle = readFileSync(new URL('./character/runner-idle-character.js', import.meta.url), 'utf8');
  assert.match(idle, /emissiveIntensity \*= TRON_RUNNER_IDLE_CHARACTER_BRIGHTNESS/);
  // e la base memorizzata deve seguire, altrimenti il battito della musica lo riallinea agli altri
  assert.match(idle, /tronRunnerBaseEmissiveIntensity = material\.emissiveIntensity/);
});
