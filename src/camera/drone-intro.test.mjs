// L'inquadratura iniziale "da eroe" e' un'opzione da URL: senza parametri l'ingresso resta
// quello di sempre. Da main-boot.test.mjs (2026-09-19), che cercava nel sorgente il nome
// della funzione: qui la si chiama.
import assert from 'node:assert/strict';
import test from 'node:test';
import { droneIntroHeroShotRequestedFromParams } from './drone-intro.js';

test('senza parametri l\'ingresso e\' quello di default', () => {
  assert.equal(droneIntroHeroShotRequestedFromParams(new URLSearchParams('')), false);
  assert.equal(droneIntroHeroShotRequestedFromParams(new URLSearchParams('heroShot=0')), false);
  assert.equal(droneIntroHeroShotRequestedFromParams(new URLSearchParams('intro=classic')), false);
});

test('si accende solo chiedendolo', () => {
  assert.equal(droneIntroHeroShotRequestedFromParams(new URLSearchParams('heroShot=1')), true);
  assert.equal(droneIntroHeroShotRequestedFromParams(new URLSearchParams('hero=on')), true);
  assert.equal(droneIntroHeroShotRequestedFromParams(new URLSearchParams('intro=hero')), true);
});
