// L'ordine delle chiamate nel boot e nel ciclo dei frame di main.js.
//
// Queste prove leggono il sorgente di proposito, e sono fra le poche a cui e' concesso:
// l'ordine in cui il boot scalda le texture e in cui un frame aggiorna i sottosistemi E'
// logica, non stile, e finche' il ciclo vive dentro main.js non c'e' altro modo di
// osservarlo senza far girare la scena intera. Se il ciclo dei frame viene estratto in un
// modulo iniettabile (tappa 5), queste vanno riscritte come prove di comportamento.
//
// Vengono da main-boot.test.mjs e contact-terminal-integration.test.mjs (2026-09-19); il
// resto di quei file cercava nomi di funzioni e valori CSS ed e' stato sostituito da
// src/pagina-cover.test.mjs.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
const boot = readFileSync(new URL('./engine/boot-prewarm.js', import.meta.url), 'utf8');

/** Il corpo di una funzione, per nome, nel file dove vive; fallisce se non c'e'. */
function corpo(firma, sorgente = main, dove = 'main.js') {
  const inizio = sorgente.indexOf(firma);
  assert.notEqual(inizio, -1, `${firma} non trovata in ${dove}`);
  const fine = sorgente.indexOf('\n}\n', inizio);
  return sorgente.slice(inizio, fine);
}

/** Pretende che le stringhe compaiano nel testo in quest'ordine. */
function inOrdine(testo, passi) {
  let da = 0;
  for (const passo of passi) {
    const posizione = testo.indexOf(passo, da);
    assert.notEqual(posizione, -1, `manca "${passo}" (o sta prima del passo precedente)`);
    da = posizione + passo.length;
  }
}

test('il boot svuota la coda della folla prima di scaldare le texture, e scalda i post-processing per ultimi', () => {
  inOrdine(corpo('async function bootSceneWithFinalDefaults() {', boot, 'engine/boot-prewarm.js'), [
    'await tronRunnerOrchestration.load();',
    'await tronRunnerCrowdRuntime.drainBuildQueue();',
    'prewarmSkinnedMeshBoneTextures(scene);',
    'prewarmSceneTextureUploads(scene);',
    'prewarmHiddenSkinnedMeshRender(scene);',
    'prewarmPostProcessingPasses();',
  ]);
});

test('nel frame il LOD della strada si aggiorna prima che il rivelo critico salti del lavoro', () => {
  inOrdine(corpo('function tick(now) {'), [
    'syncHexRoadLodForFrame();',
    'const revealPerformanceCritical = isCityRevealPerformanceCritical();',
    'if (!revealPerformanceCritical) {',
  ]);
});

test('nel frame il terminale contatti decide se possiede la camera prima di camminata e dondolio', () => {
  const tick = corpo('function tick(now) {');
  inOrdine(tick, [
    'const contactTerminalCameraOwned = contactTerminalOwnsCamera()',
    'if (!contactTerminalCameraOwned) updateWalkSimulation(dt)',
    'if (!contactTerminalCameraOwned) applyViewMotionOffset()',
  ]);
  assert.match(tick, /!droneIntroWasActive && !contactTerminalCameraOwned/);
});
