// Contratto sulla configurazione di boot della demo, letto dal browser.
//
// La scena non nasce dal codice ma da tre sorgenti di dati che si sovrappongono:
//   1. gli slider del pannello in index.html, col loro attributo value
//   2. controls/fixed-control-defaults.js, i valori fissi di LED e ponti
//   3. boulevard-canonical-settings.json, applicato sopra al boot da
//      loadProjectCanonicalDefaults
//
// La seconda vince sulla prima solo se il valore sta dentro il min/max dello slider:
// applyControlSettings fa THREE.MathUtils.clamp. Quindi abbassare un `max` nel markup
// puo' silenziosamente cambiare la scena, perche' il valore canonico viene clampato e
// nessuno se ne accorge. E il browser stesso clampa un `value` fuori range senza dire
// niente. Fino al 2026-09-19 il markup si leggeva con espressioni regolari; qui lo legge
// Chromium, che e' chi decide davvero il valore di partenza di ogni cursore.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { BRIDGE_DEFAULTS, FIXED_LED_DEFAULTS } from './fixed-control-defaults.js';
import { apriBrowser, apriPagina, chiudiBrowser } from '../../test/pagina.mjs';

let pagina = null;
let markupControls = null;
let canonicalSettings = null;

before(async () => {
  await apriBrowser();
  pagina = await apriPagina();
  // Tutti gli input/select con un id, esclusi gli <output> di lettura, come li vede il browser.
  markupControls = new Map(await pagina.page.$$eval('input[id], select[id]', (els) => els
    .filter((el) => !el.id.endsWith('-val'))
    .map((el) => {
      const num = (name) => (el.hasAttribute(name) ? Number(el.getAttribute(name)) : null);
      return [el.id, {
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type'),
        min: num('min'),
        max: num('max'),
        value: num('value'),
        hasValueAttr: el.hasAttribute('value'),
        // cio' che il browser ha deciso dopo aver letto min, max e value
        valoreVivo: el.value,
      }];
    })));
  canonicalSettings = (await pagina.page.evaluate(() => fetch('boulevard-canonical-settings.json').then((r) => r.json()))).settings;
});
after(async () => { await pagina?.chiudi(); await chiudiBrowser(); });

/** I controlli che mountFixedControlDefaults() crea a runtime dai dati. */
function fixedControlElements() {
  const out = new Map();
  const entry = (value) => ({
    tag: 'input',
    type: typeof value === 'boolean' ? 'checkbox' : 'hidden',
    min: null, max: null,
    value: typeof value === 'boolean' ? null : value,
    hasValueAttr: typeof value !== 'boolean',
    valoreVivo: String(value),
  });
  for (const [id, value] of Object.entries(FIXED_LED_DEFAULTS)) out.set(id, entry(value));
  BRIDGE_DEFAULTS.forEach((bridge, index) => {
    for (const [key, value] of Object.entries(bridge)) out.set(`bridge-${index}-${key}`, entry(value));
  });
  return out;
}

const fixedControls = fixedControlElements();
const tutti = () => new Map([...markupControls, ...fixedControls]);
const cursori = () => [...tutti()].filter(([, c]) => c.type === 'range');

test('le due sorgenti di controlli coprono insieme la configurazione attesa', () => {
  const controls = tutti();
  assert.ok(controls.size > 300, `troppi pochi controlli in totale: ${controls.size}`);
  assert.ok(cursori().length > 200, `troppi pochi slider nel markup: ${cursori().length}`);
  assert.equal(fixedControls.size, 72, 'cambiati i controlli fissi di LED e ponti');
  // Nessun id deve esistere in tutte e due: sarebbero due default in conflitto
  // e vincerebbe quello creato per ultimo, cioe' un caso difficile da vedere.
  const doppi = [...fixedControls.keys()].filter((id) => markupControls.has(id));
  assert.deepEqual(doppi, [], 'stesso controllo dichiarato sia nel markup sia nei dati');
});

test('ogni slider ha min, max e un valore di default', () => {
  for (const [id, c] of cursori()) {
    assert.ok(Number.isFinite(c.min), `${id} senza min`);
    assert.ok(Number.isFinite(c.max), `${id} senza max`);
    assert.ok(c.hasValueAttr, `${id} senza value: il default sarebbe il centro del range`);
    assert.ok(Number.isFinite(c.value), `${id} con value non numerico`);
    assert.ok(c.min < c.max, `${id} ha min >= max`);
  }
});

test('il browser parte da ogni slider esattamente dove dice il markup', () => {
  // Un default fuori range viene clampato dal browser senza dire niente, e la scena
  // parte da un valore diverso da quello scritto. Qui lo dice il browser stesso.
  const diversi = [];
  for (const [id, c] of cursori()) {
    if (fixedControls.has(id)) continue;
    if (Number(c.valoreVivo) !== c.value) diversi.push(`${id}: il markup dice ${c.value}, il browser parte da ${c.valoreVivo} (min ${c.min}, max ${c.max})`);
  }
  assert.deepEqual(diversi, [], 'valori fuori dal passo (step) o dal min/max: il browser li corregge in silenzio');
});

test('nessun valore del JSON canonico viene clampato dallo slider che lo riceve', () => {
  // applyControlSettings fa clamp(numeric, min, max): se il JSON chiede 5 e lo
  // slider arriva a 4.8, la scena usa 4.8 e il JSON mente.
  const controls = tutti();
  const clamped = [];
  for (const [id, value] of Object.entries(canonicalSettings)) {
    const c = controls.get(id);
    if (!c || c.type !== 'range' || typeof value !== 'number') continue;
    if (value < c.min || value > c.max) clamped.push(`${id}: json ${value} fuori da [${c.min}, ${c.max}]`);
  }
  assert.deepEqual(clamped, []);
});

// Output scritti dal codice invece che da uno slider: non sono orfani, sono
// display di sola lettura. Verificati uno per uno: ognuno ha un getElementById
// e tre riferimenti in src/.
const OUTPUT_SENZA_CONTROLLO = new Set([
  'ambient', 'key', 'bloom',
  'player-spawn', 'start-position-live', 'start-position-saved',
]);

test('ogni output di lettura ha un controllo oppure e\' un display noto', async () => {
  const output = await pagina.page.$$eval('output[id$="-val"]', (els) => els.map((el) => el.id.slice(0, -4)));
  const controls = tutti();
  const orfani = output.filter((id) => !controls.has(id) && !OUTPUT_SENZA_CONTROLLO.has(id));
  assert.deepEqual(orfani, [], 'output senza slider e senza codice che lo scriva');
});

test('i valori che esistono solo fuori dal JSON canonico restano quelli noti', () => {
  // Non sono coperti da boulevard-canonical-settings.json: il loro unico
  // default e' quello dichiarato nella sorgente che li crea.
  const soloDefault = [...tutti().keys()].filter((id) => !(id in canonicalSettings)).sort();
  assert.equal(soloDefault.length, 52, `cambiati i controlli senza copertura nel JSON: ${soloDefault.length}`);
  for (const id of soloDefault) {
    assert.match(id, /^(bridge-|main-building-|character-bubble-bg-opacity)/,
      `${id} non appartiene alle famiglie note`);
  }
  // Tranne character-bubble-bg-opacity, che e' uno slider del pannello, tutti
  // gli altri vivono ora in fixed-control-defaults.js.
  const fuoriDaiDati = soloDefault.filter((id) => !fixedControls.has(id));
  assert.deepEqual(fuoriDaiDati, ['character-bubble-bg-opacity']);
});

test('le uniche chiavi del JSON senza controllo sono i segmenti LED di facciata', () => {
  // applyControlSettings fa getElementById(id) e salta se non trova niente:
  // una chiave senza controllo nel markup e' inerte, non fa nulla. Restano
  // solo i 18 segmenti LED di facciata, che sembrano voluti.
  const controls = tutti();
  const senzaControllo = Object.keys(canonicalSettings).filter((id) => !controls.has(id)).sort();
  assert.equal(senzaControllo.length, 18);
  for (const id of senzaControllo) {
    assert.match(id, /^building-facade-led-seg-\d+-(u|y|normal)$/, `${id} e' una chiave inerte non prevista`);
  }
});

test('il cursore "Sfondo cartelli" sta nel pannello dei personaggi e controls.js lo trova', async () => {
  // Era settings-controls.test.mjs, che cercava nel sorgente di controls.js la riga
  // `characterBubbleBgOpacity: document.getElementById(...)`. Qui createControlEls()
  // gira nella pagina vera e deve tornare proprio quell'elemento. Il rapporto fra il
  // valore del cursore e le costanti dei cartelli sta in src/invarianti.test.mjs.
  const { page } = pagina;
  assert.ok(await page.$('section.control-panel[data-panel="character"] #character-bubble-bg-opacity'), 'il cursore non sta nel pannello dei personaggi');
  assert.ok(await page.$('#character-bubble-bg-opacity-val'), 'manca il numero accanto al cursore');
  const modulo = './src/controls/controls.js';   // risolto dal browser, non da tsc
  const trovato = await page.evaluate(async (modulo) => {
    const { createControlEls } = await import(modulo);
    const els = createControlEls();
    return { cursore: els.characterBubbleBgOpacity?.id ?? null, valore: els.characterBubbleBgOpacityVal?.id ?? null };
  }, modulo);
  assert.deepEqual(trovato, { cursore: 'character-bubble-bg-opacity', valore: 'character-bubble-bg-opacity-val' });
});
