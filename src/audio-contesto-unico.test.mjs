// Il 2026-09-18 il precaricamento della citta' ha rotto la demo in produzione: main.js
// fotografava il contesto audio della pagina al momento dell'import, quando ancora non
// esiste, e se ne fabbricava uno suo; al click ne nasceva un secondo e collegare nodi di
// contesti diversi alzava InvalidAccessError a ogni frame, lasciando la scena senza
// personaggi ne' cartelli e i comandi morti. Le prove non l'avevano visto perche'
// cliccavano subito: il difetto compare solo se fra apertura e click passa tempo.
//
// Queste prove guardano il sorgente, non il comportamento: servono a impedire che il
// contesto torni a essere deciso all'ora dell'import.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

// Dal 2026-09-19 (tappa 5) i passi del giocatore, e con loro il contesto audio, stanno in
// audio/player-footsteps.js: e' quel file che non deve fotografare il contesto all'import.
const main = readFileSync(new URL('./audio/player-footsteps.js', import.meta.url), 'utf8');
const pagina = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('player-footsteps.js non fotografa il contesto audio della pagina quando viene importato', () => {
  assert.doesNotMatch(main, /let footstepAudioContext = window\.__retroAudio/);
  assert.match(main, /let footstepAudioContext = null;/);
});

test('chi crea il contesto per primo lo pubblica, cosi\' ne resta uno solo per pagina', () => {
  const corpo = main.slice(main.indexOf('function createFootstepAudioContext()'));
  const fine = corpo.indexOf('\n}\n');
  const funzione = corpo.slice(0, fine);
  // prima guarda se la pagina ne ha gia' uno
  assert.match(funzione, /window\.__retroAudio\?\.context/);
  // e se lo crea lui, lo lascia dove l'altro lo cerchera'
  assert.match(funzione, /window\.__retroAudio\.context = /);
});

test('la pagina riusa il contesto gia\' presente invece di crearne un altro', () => {
  assert.match(pagina, /if \(!earlyAudio\.context\)/);
});
