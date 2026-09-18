// I cartelli dei personaggi devono stare davanti a tutto il resto della scena: chi parla si
// legge sempre, anche passando davanti al terminale contatti o ai cartelloni dei dipartimenti
// (chiesto il 2026-09-18). In three.js decide renderOrder: piu' alto = disegnato dopo = sopra.
//
// Questa prova conta tutti i renderOrder del progetto e pretende che quello dei cartelli resti
// il piu' alto. Cosi' chi domani aggiunge un pannello con un numero grosso se ne accorge qui
// invece che dal sito.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CHARACTER_BUBBLE_RENDER_ORDER } from './character/speech-bubbles.js';

const radice = new URL('.', import.meta.url).pathname;

function tuttiIModuli(dir, out = []) {
  for (const voce of readdirSync(dir)) {
    const percorso = join(dir, voce);
    if (statSync(percorso).isDirectory()) tuttiIModuli(percorso, out);
    else if (voce.endsWith('.js') && !voce.endsWith('.test.mjs')) out.push(percorso);
  }
  return out;
}

/** Ogni renderOrder scritto come numero nel progetto, con il file in cui sta. */
function renderOrderDelProgetto() {
  const trovati = [];
  for (const file of tuttiIModuli(radice)) {
    const testo = readFileSync(file, 'utf8');
    for (const m of testo.matchAll(/renderOrder\s*=\s*(\d+)/g)) {
      trovati.push({ file: file.slice(radice.length), valore: Number(m[1]) });
    }
    for (const m of testo.matchAll(/_RENDER_ORDER\s*=\s*(\d+)/g)) {
      trovati.push({ file: file.slice(radice.length), valore: Number(m[1]) });
    }
  }
  return trovati;
}

test('nessuno sta davanti ai cartelli dei personaggi', () => {
  const altri = renderOrderDelProgetto().filter((x) => x.valore !== CHARACTER_BUBBLE_RENDER_ORDER);
  assert.ok(altri.length > 5, 'la scansione non ha trovato i renderOrder del progetto');
  const massimo = altri.reduce((a, b) => (b.valore > a.valore ? b : a));
  assert.ok(
    CHARACTER_BUBBLE_RENDER_ORDER > massimo.valore,
    `${massimo.file} disegna a ${massimo.valore}, sopra i cartelli a ${CHARACTER_BUBBLE_RENDER_ORDER}`
  );
});

test('i cartelli rispettano la profondita\', cosi\' chi parla ci sta davanti', () => {
  // depthTest acceso (2026-09-18): i personaggi sono opachi e scrivono nel depth buffer,
  // quindi coprono il cartello di chi lo tiene. I pannelli della citta' hanno depthWrite
  // false, non lasciano profondita', e percio' continuano a non poterlo nascondere: e' il
  // groupOrder a tenerli dietro. Spegnere depthTest rimetterebbe il cartello davanti al
  // personaggio, che e' proprio quello che non si vuole.
  const sorgente = readFileSync(new URL('./character/speech-bubbles.js', import.meta.url), 'utf8');
  // via i commenti: qui sotto se ne parla a parole, e senza questo il test leggerebbe se stesso
  const codice = sorgente.replace(/\/\/[^\n]*/g, '');
  const occorrenze = [...codice.matchAll(/depthTest:\s*(\w+)/g)].map((m) => m[1]);
  assert.ok(occorrenze.length >= 2, 'materiali dei cartelli non trovati');
  for (const valore of occorrenze) assert.equal(valore, 'true');

  // e i pannelli devono continuare a non scrivere profondita', altrimenti tornano a coprirlo
  for (const file of ['./world/city-boards.js', './world/contact-terminal.js']) {
    const testo = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.match(testo, /depthWrite:\s*false/, file);
  }
});

test('i cartelli stanno in un Group loro, ed e\' il gruppo a portare il renderOrder', () => {
  // Il punto vero: three.js confronta prima il groupOrder (il renderOrder del Group che
  // contiene l'oggetto) e solo dopo quello dell'oggetto. Con i cartelli appesi alla scena
  // il loro numero non veniva mai messo a confronto e i pannelli, che stanno dentro Group
  // con renderOrder 30 e 34, ci passavano sopra.
  const sorgente = readFileSync(new URL('./character/speech-bubbles.js', import.meta.url), 'utf8');
  assert.match(sorgente, /new THREE\.Group\(\)/);
  assert.match(sorgente, /\.renderOrder = CHARACTER_BUBBLE_RENDER_ORDER/);
  // e nessuno li attacca piu' direttamente alla scena
  assert.doesNotMatch(sorgente, /getScene\(\)\.add\((?:greeterBubbleSprite|sprite)\)/);
});
