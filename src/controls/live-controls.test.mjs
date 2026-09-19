// I cursori del pannello arrivano davvero alla scena.
//
// Perche' esiste (2026-09-19): applyLiveControls e' 691 righe e scrive una cinquantina
// di campi in sei domini diversi, e fino a qui non la guardava nessuna prova. Il gate
// visivo fotografa la scena con i valori di default, quindi un cursore scollegato
// passava inosservato: la scena di default resta identica.
//
// Due prove, che coprono due strade diverse, misurate e non indovinate:
//
//  1. quattro coppie cursore/effetto. ATTENZIONE: questi quattro cursori stanno nelle
//     liste *_FAST_CONTROL_IDS, quindi fastScopeForControl li manda alla funzione del
//     loro gruppo e NON ad applyLiveControls. Verificato: commentando la riga che
//     applyLiveControls usa per la risoluzione, la prova resta verde. Coprono la via
//     veloce, che prima non copriva nessuno. Le coppie sono queste perche' il loro
//     effetto si legge da __tronInspect o __tronPerfInspect ed e' stabile fra un
//     fotogramma e l'altro: la folla si muove da sola e quasi tutti gli altri campi
//     cambiano comunque.
//
//  2. una passata su TUTTI i cursori, al minimo e al massimo. Un cursore fuori da ogni
//     lista veloce fa tornare 'all' a fastScopeForControl, quindi questa passata fa
//     girare applyLiveControls intera. Verificato con la controprova: mettendo un
//     throw in cima ad applyLiveControls tre prove diventano rosse, questa compresa.
//     Il pannello permette qualunque combinazione di estremi, quindi un errore qui
//     sarebbe un errore vero.
//
// scheduleLiveControls raggruppa le modifiche a una per fotogramma: si aspettano due
// fotogrammi dopo ogni passata, non un timeout.
import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { apriPagina, chiudiBrowser } from '../../test/pagina.mjs';

after(async () => { await chiudiBrowser(); });

/** id del cursore, percorso dell'effetto, valore di partenza, valore atteso all'estremo. */
const COPPIE = [
  ['render-resolution', 'perf.manualRenderScale', 1, 0.25],
  ['bloom-quality', 'perf.bloomResolutionScale', 0.28, 0.25],
  ['runner-scale', 'tronRunner.scale', 0.55, 2],
  ['runner-led-bloom', 'tronRunner.ledBloom', 6, 12],
];

/** Apre la pagina, fa partire la scena e aspetta che main.js abbia finito. */
async function scenaPronta() {
  const sessione = await apriPagina({ bloccaMain: false });
  await sessione.page.click('#welcome-start-button');
  await sessione.page.waitForFunction(
    () => typeof (/** @type {any} */ (window)).__tronInspect === 'function',
    null,
    { timeout: 120_000 },
  );
  return sessione;
}

test('quattro cursori arrivano alla scena, e tornando indietro la riportano dov\'era', async () => {
  const { page, errori, chiudi } = await scenaPronta();
  try {
    const esiti = await page.evaluate(async (coppie) => {
      const finestra = /** @type {Record<string, any>} */ (/** @type {unknown} */ (window));
      const valore = (percorso) => (percorso.startsWith('perf.')
        ? percorso.slice(5).split('.').reduce((o, k) => o?.[k], finestra.__tronPerfInspect())
        : percorso.split('.').reduce((o, k) => o?.[k], finestra.__tronInspect()));
      const dueFotogrammi = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const muovi = async (id, v) => {
        const el = document.getElementById(id);
        if (!el) return false;
        /** @type {any} */ (el).value = String(v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        await dueFotogrammi();
        return true;
      };
      /** @type {Record<string, any>} */
      const out = {};
      for (const [id, percorso, partenza, estremo] of coppie) {
        const el = /** @type {any} */ (document.getElementById(id));
        if (!el) { out[id] = { errore: 'cursore assente' }; continue; }
        const prima = valore(percorso);
        await muovi(id, estremo);
        const dopo = valore(percorso);
        await muovi(id, partenza);
        const tornato = valore(percorso);
        out[id] = { valoreCursore: Number(el.value), prima, dopo, tornato };
      }
      return out;
    }, COPPIE);

    for (const [id, percorso, partenza, estremo] of COPPIE) {
      const e = esiti[id];
      assert.ok(!e.errore, `${id}: ${e.errore}`);
      assert.equal(e.prima, partenza, `${id}: ${percorso} non parte da ${partenza}`);
      assert.equal(e.dopo, estremo, `${id}: portato a ${estremo}, ${percorso} e' rimasto ${e.dopo}`);
      assert.equal(e.tornato, partenza, `${id}: tornato indietro, ${percorso} e' rimasto ${e.tornato}`);
    }
    assert.deepEqual(errori, [], 'la pagina non deve alzare errori');
  } finally {
    await chiudi();
  }
});

test('tutti i cursori al minimo e al massimo non rompono niente', async () => {
  const { page, errori, chiudi } = await scenaPronta();
  try {
    const esito = await page.evaluate(async () => {
      const finestra = /** @type {Record<string, any>} */ (/** @type {unknown} */ (window));
      const dueFotogrammi = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const cursori = /** @type {any[]} */ (Array.from(document.querySelectorAll('input[type=range]')));
      const originali = cursori.map((e) => e.value);
      const passata = (scegli) => {
        for (const e of cursori) {
          e.value = scegli(e);
          e.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };
      /** @type {Record<string, number>} */
      const chiavi = {};
      passata((e) => e.min); await dueFotogrammi();
      chiavi.minimo = Object.keys(finestra.__tronInspect()).length;
      passata((e) => e.max); await dueFotogrammi();
      chiavi.massimo = Object.keys(finestra.__tronInspect()).length;
      cursori.forEach((e, i) => {
        e.value = originali[i];
        e.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await dueFotogrammi();
      chiavi.rimessi = Object.keys(finestra.__tronInspect()).length;
      return { quanti: cursori.length, chiavi };
    });

    assert.ok(esito.quanti > 200, `cursori trovati: ${esito.quanti}, ne servono piu' di 200`);
    assert.equal(esito.chiavi.minimo, esito.chiavi.rimessi, 'al minimo __tronInspect cambia forma');
    assert.equal(esito.chiavi.massimo, esito.chiavi.rimessi, 'al massimo __tronInspect cambia forma');
    assert.deepEqual(errori, [], 'nessuna combinazione di cursori deve alzare errori');
  } finally {
    await chiudi();
  }
});
