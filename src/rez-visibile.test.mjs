// Il rez dei personaggi deve vedersi tutto.
//
// Il 2026-09-18 non si vedeva affatto, pur essendo implementato: il gruppo della folla
// restava nascosto per 1000ms dopo la fine della rivelazione della citta', mentre il rez
// partiva subito e durava 1400ms. Quando i personaggi comparivano, la materializzazione
// era gia' al 71 percento: si vedeva un corpo quasi finito spuntare dal nulla, cioe' il
// popup che era stato segnalato.
//
// L'attesa ora ritarda l'INIZIO del rez invece di nascondere il gruppo. Queste prove
// tengono ferma quella scelta: se qualcuno rimette un ritardo sul gruppo, il rez torna
// invisibile e nessuno se ne accorge guardando il codice.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const folla = readFileSync(new URL('./character/runner-crowd-runtime.js', import.meta.url), 'utf8');
const rivelazione = readFileSync(new URL('./character/runner-reveal.js', import.meta.url), 'utf8');

const numero = (testo, nome) => {
  const m = testo.match(new RegExp(`${nome}\\s*=\\s*(\\d+)`));
  assert.ok(m, `${nome} non trovato`);
  return Number(m[1]);
};

test('il gruppo della folla non ritarda piu\': si accende quando il rez comincia', () => {
  assert.equal(numero(folla, 'TRON_RUNNER_CROWD_APPEAR_DELAY_MS'), 0);
});

test('l\'attesa dopo la citta\' e\' passata alla rivelazione', () => {
  assert.match(rivelazione, /ATTESA_PRIMA_DEL_REZ_MS/);
  assert.ok(numero(rivelazione, 'ATTESA_PRIMA_DEL_REZ_MS') > 0, 'l\'attesa e\' sparita del tutto');
});

test('la materializzazione dura piu\' dell\'attesa, altrimenti si vedrebbe a meta\'', () => {
  const personaggi = readFileSync(new URL('./character/characters.js', import.meta.url), 'utf8');
  const durataRez = numero(personaggi, 'TRON_RUNNER_REVEAL_DURATION_MS');
  const ritardoGruppo = numero(folla, 'TRON_RUNNER_CROWD_APPEAR_DELAY_MS');
  assert.ok(
    ritardoGruppo < durataRez * 0.1,
    `il gruppo aspetta ${ritardoGruppo}ms su un rez di ${durataRez}ms: se ne mangia l'inizio`
  );
});

test('ogni personaggio ha il suo anello, non quello del sorgente invisibile', () => {
  // L'anello di makeScan() e' appeso a runnerWalker, cioe' al personaggio sorgente, che e'
  // invisibile per scelta (TRON_RUNNER_SOURCE_CHARACTER_VISIBLE = false): nessuno l'ha mai
  // visto, e la folla non ne aveva affatto. Gli anelli veri sono un InstancedMesh a parte.
  assert.match(rivelazione, /tron-runner-rez-rings/);
  assert.match(rivelazione, /new THREE\.InstancedMesh\(/);
  // e stanno appesi alla scena, non al sorgente
  assert.match(rivelazione, /radiceScena\(\)\?\.add\(anelliRez\)/);
  const personaggi = readFileSync(new URL('./character/characters.js', import.meta.url), 'utf8');
  assert.match(personaggi, /TRON_RUNNER_SOURCE_CHARACTER_VISIBLE = false/);
});

test('gli anelli si accendono solo mentre la materializzazione e\' in corso', () => {
  assert.match(rivelazione, /if \(!attivo \|\| pulsazione <= 0\.02\)/);
});

test('l\'anello sale sull\'altezza di chi si materializza, non su quella del giocante', () => {
  // TRON_RUNNER_TARGET_HEIGHT e' l'altezza del personaggio giocante (~8.66). Usarla per
  // tutti faceva salire l'anello fino a 8.11 mentre le teste della folla stanno a 5.2-5.9:
  // superava la testa e continuava nel vuoto (2026-09-18). Ora ognuno ha la sua misura.
  assert.match(rivelazione, /function altezzaPersonaggio\(/);
  assert.match(rivelazione, /function quotaRez\(/);
  assert.match(rivelazione, /posizioneAnello\.y = quotaRez\(/);
  // e la quota non puo' andare oltre la testa: il fattore e' limitato a 1
  const corpo = rivelazione.slice(rivelazione.indexOf('function quotaRez('));
  assert.match(corpo.slice(0, 400), /clamp\(/);
});

test('anche il taglio del corpo segue l\'altezza del singolo', () => {
  assert.match(rivelazione, /tagliaPersonaggio\(member\.group\)/);
  assert.match(rivelazione, /quotaRez\(member\.group, factorTaglio\)/);
});
