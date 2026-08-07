// Contratto sulla configurazione di boot della demo.
//
// La scena non nasce dal codice ma da due sorgenti di dati che si sovrappongono:
//   1. il markup di index.html, che porta i valori di default degli input
//   2. demo-5-boulevard-canonical-settings.json, applicato sopra al boot da
//      loadProjectCanonicalDefaults
//
// Nessuna delle due e' verificata da niente, e la seconda vince sulla prima solo
// se il valore sta dentro il min/max dello slider: applyControlSettings fa
// THREE.MathUtils.clamp. Quindi abbassare un `max` nel markup puo' silenziosamente
// cambiare la scena, perche' il valore canonico viene clampato e nessuno se ne
// accorge. Questo file blocca quella classe di errore.
//
// Serve anche come mappa per estrarre un giorno i default dal markup: dice
// esattamente quali valori vivono SOLO li' e non nel JSON.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const htmlSource = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const canonicalSettings = JSON.parse(
  readFileSync(new URL('../../demo-5-boulevard-canonical-settings.json', import.meta.url), 'utf8'),
).settings;

/** Tutti gli input/select con un id, esclusi gli <output> di lettura. */
function controlElements() {
  const out = new Map();
  for (const m of htmlSource.matchAll(/<(input|select)\b([^>]*)>/g)) {
    const attrs = m[2];
    const id = /\bid="([^"]+)"/.exec(attrs)?.[1];
    if (!id || id.endsWith('-val')) continue;
    const num = (name) => {
      const raw = new RegExp(`\\b${name}="([^"]+)"`).exec(attrs)?.[1];
      return raw == null ? null : Number(raw);
    };
    out.set(id, {
      tag: m[1],
      type: /\btype="([^"]+)"/.exec(attrs)?.[1] || null,
      min: num('min'),
      max: num('max'),
      value: num('value'),
      hasValueAttr: /\bvalue="/.test(attrs),
    });
  }
  return out;
}

const controls = controlElements();
const ranges = [...controls].filter(([, c]) => c.type === 'range');

test('il markup dichiara i controlli attesi', () => {
  assert.ok(controls.size > 300, `troppi pochi controlli: ${controls.size}`);
  assert.ok(ranges.length > 200, `troppi pochi slider: ${ranges.length}`);
});

test('ogni slider ha min, max e un valore di default', () => {
  for (const [id, c] of ranges) {
    assert.ok(Number.isFinite(c.min), `${id} senza min`);
    assert.ok(Number.isFinite(c.max), `${id} senza max`);
    assert.ok(c.hasValueAttr, `${id} senza value: il default sarebbe il centro del range`);
    assert.ok(Number.isFinite(c.value), `${id} con value non numerico`);
    assert.ok(c.min < c.max, `${id} ha min >= max`);
  }
});

test('nessun default del markup cade fuori dal proprio min/max', () => {
  // Un default fuori range viene clampato dal browser senza dire niente, e la
  // scena parte da un valore diverso da quello scritto nel markup.
  for (const [id, c] of ranges) {
    assert.ok(c.value >= c.min && c.value <= c.max, `${id}: value ${c.value} fuori da [${c.min}, ${c.max}]`);
  }
});

test('nessun valore del JSON canonico viene clampato dallo slider che lo riceve', () => {
  // applyControlSettings fa clamp(numeric, min, max): se il JSON chiede 5 e lo
  // slider arriva a 4.8, la scena usa 4.8 e il JSON mente.
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

test('ogni output di lettura ha un controllo oppure e' + "' un display noto", () => {
  const orfani = [];
  for (const m of htmlSource.matchAll(/<output\b[^>]*\bid="([^"]+)-val"/g)) {
    if (!controls.has(m[1]) && !OUTPUT_SENZA_CONTROLLO.has(m[1])) orfani.push(m[1]);
  }
  assert.deepEqual(orfani, [], 'output senza slider e senza codice che lo scriva');
});

test('i default che vivono solo nel markup restano quelli noti', () => {
  // Questi 52 non sono nel JSON canonico: se il markup sparisse, sparirebbero
  // con lui. Sono tutti dentro il div nascosto #fixed-led-values, non nel
  // pannello slider. E' la lista da portarsi dietro per estrarli in dati.
  const soloMarkup = [...controls.keys()].filter((id) => !(id in canonicalSettings)).sort();
  const famiglie = new Set(soloMarkup.map((id) => id.replace(/\d+/g, 'N')));
  assert.equal(soloMarkup.length, 52, `cambiati i controlli senza copertura nel JSON: ${soloMarkup.length}`);
  for (const id of soloMarkup) {
    assert.match(id, /^(bridge-|main-building-|character-bubble-bg-opacity)/,
      `${id} non appartiene alle famiglie note dei default solo-markup`);
  }
  assert.equal(famiglie.size, 25);
});

test('le uniche chiavi del JSON senza controllo sono i segmenti LED di facciata', () => {
  // applyControlSettings fa getElementById(id) e salta se non trova niente:
  // una chiave senza controllo nel markup e' inerte, non fa nulla. Restano
  // solo i 18 segmenti LED di facciata, che sembrano voluti. Da qui e' gia'
  // stato tolto il gruppo placement-*, tredici chiavi di uno strumento di
  // authoring rimosso di cui era sopravvissuta solo la configurazione.
  const senzaControllo = Object.keys(canonicalSettings).filter((id) => !controls.has(id)).sort();
  assert.equal(senzaControllo.length, 18);
  for (const id of senzaControllo) {
    assert.match(id, /^building-facade-led-seg-\d+-(u|y|normal)$/, `${id} e' una chiave inerte non prevista`);
  }
});
