// Le scorciatoie di console rispondono, tutte, con la scena vera dentro.
//
// Perche' esiste (2026-09-19, tappa 5): durante lo spostamento dei domini fuori da
// main.js un import mancante ha lasciato quattro nomi non definiti dentro
// __tronPerfInspect. Prove, build e gate visivo erano tutti verdi: il gate chiama
// __tronInspect e basta, quindi chiamare quell'altra avrebbe alzato un ReferenceError
// che nessuno guardava. L'ha beccato il typecheck, ma il typecheck non c'era prima
// della tappa 2 e non vede le closure sbagliate: serviva una prova che le chiami.
//
// Qui la pagina si apre davvero, si clicca "Esplora i reparti" (main.js viene caricato
// solo li') e si chiamano tutte le scorciatoie. Non aspetta il rivelo della citta':
// basta che main.js abbia finito di costruire, cioe' che __tronInspect esista.
import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { apriPagina, chiudiBrowser } from '../test/pagina.mjs';

after(async () => { await chiudiBrowser(); });

/** Ogni scorciatoia e quante chiavi ci si aspetta almeno nella risposta. */
const SCORCIATOIE = [
  ['__tronInspect', 80],
  ['__tronPerfInspect', 30],
  ['__tronRunnerInspect', 40],
  ['__tronRevealProfile', 5],
  ['__tronSpikeInspect', 3],
  ['__tronFootstepInspect', 5],
  ['__tronMusicInspect', 10],
  ['__retroBenchmarkInspect', 3],
  ['__tronPerfIsolationInspect', 3],
  ['__fxToggles', 2],
  ['__tronComposerInspect', 5],
];

test('tutte le scorciatoie di console rispondono con la scena costruita', async () => {
  const { page, errori, chiudi } = await apriPagina({ bloccaMain: false, query: '?benchmark=0' });
  try {
    await page.click('#welcome-start-button');
    await page.waitForFunction(() => typeof (/** @type {any} */ (window)).__tronInspect === 'function', null, { timeout: 120_000 });
    const esito = await page.evaluate((nomi) => {
      const finestra = /** @type {Record<string, any>} */ (/** @type {unknown} */ (window));
      /** @type {Record<string, number|string>} */
      const out = {};
      for (const nome of nomi) {
        try {
          const v = typeof finestra[nome] === 'function' ? finestra[nome]() : undefined;
          out[nome] = v === undefined ? 'assente'
            : (v && typeof v === 'object' ? Object.keys(v).length : `non e' un oggetto: ${typeof v}`);
        } catch (e) {
          out[nome] = `errore: ${String(e)}`;
        }
      }
      return out;
    }, SCORCIATOIE.map(([nome]) => nome));
    for (const [nome, minimo] of SCORCIATOIE) {
      assert.equal(typeof esito[nome], 'number', `${nome} -> ${esito[nome]}`);
      assert.ok(esito[nome] >= minimo, `${nome} ha ${esito[nome]} chiavi, ne servono almeno ${minimo}`);
    }
    assert.deepEqual(errori, [], 'la pagina non deve alzare errori');
  } finally {
    await chiudi();
  }
});
