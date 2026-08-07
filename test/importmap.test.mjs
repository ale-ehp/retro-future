// La demo risolve `three` in due modi diversi: nel browser con la importmap
// dichiarata in index.html, nei test con il resolve hook di test/resolve-three.mjs.
// Se le due tabelle divergono, i test girano su un three diverso da quello che
// gira in produzione e non se ne accorge nessuno. Questo file le tiene agganciate.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { THREE_IMPORT_MAP } from './resolve-three.mjs';

const htmlSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function importMapFromHtml() {
  const block = htmlSource.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  assert.ok(block, 'index.html deve dichiarare una importmap');
  return JSON.parse(block[1]).imports;
}

test('importmap del browser e resolver dei test mappano gli stessi specifier', () => {
  const browserMap = importMapFromHtml();
  const normalized = Object.fromEntries(
    Object.entries(browserMap).map(([specifier, target]) => [specifier, target.replace(/^\.\//, '')]),
  );
  assert.deepEqual(normalized, THREE_IMPORT_MAP);
});

test('ogni destinazione della importmap esiste su disco', () => {
  for (const target of Object.values(THREE_IMPORT_MAP)) {
    assert.ok(existsSync(new URL(`../${target}`, import.meta.url)), `manca ${target}`);
  }
});

test('i file di terze parti stanno tutti sotto vendor/', () => {
  for (const [specifier, target] of Object.entries(THREE_IMPORT_MAP)) {
    assert.ok(target.startsWith('vendor/'), `${specifier} punta fuori da vendor/: ${target}`);
  }
  // Nessun modulo del progetto deve risalire alla root per pescare un addon:
  // e' il difetto che aveva src/engine/temporal-aa-pass.js prima dello spostamento.
  assert.doesNotMatch(htmlSource, /"three[^"]*":\s*"\.\/(?!vendor\/)[A-Za-z]/);
});

test('la lista modulepreload copre i vendor e i moduli di src usati al boot', () => {
  const preloads = htmlSource.match(/const RETRO_MODULE_PRELOADS = \[([\s\S]*?)\];/);
  assert.ok(preloads, 'index.html deve dichiarare RETRO_MODULE_PRELOADS');
  const listed = Array.from(preloads[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
  assert.ok(listed.length > 80, `lista modulepreload troppo corta: ${listed.length}`);
  for (const href of listed) {
    assert.ok(existsSync(new URL(`../${href.replace(/^\.\//, '')}`, import.meta.url)), `preload inesistente: ${href}`);
  }
  for (const target of Object.values(THREE_IMPORT_MAP)) {
    assert.ok(listed.includes(`./${target}`), `vendor non precaricato: ${target}`);
  }
});
