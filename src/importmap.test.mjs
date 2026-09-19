// La mappa di three esiste in tre copie che devono dire la stessa cosa:
//   - la importmap di index.html, che il browser legge;
//   - THREE_IMPORT_MAP in test/resolve-three.mjs, che node legge nei test;
//   - i `paths` di jsconfig.json, che tsc legge nel typecheck.
// Se una diverge, quel consumatore risolve `three` su un file diverso dagli altri e
// lo scopri solo quando si rompe proprio li'. Il commento di resolve-three.mjs
// prometteva questa prova dal 2026-09-18 ma il file non esisteva (2026-09-19).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { THREE_IMPORT_MAP } from '../test/resolve-three.mjs';

const leggi = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');

function importmapDiIndexHtml() {
  const html = leggi('../index.html');
  const blocco = html.match(/<script type="importmap">\s*([\s\S]*?)\s*<\/script>/);
  assert.ok(blocco, 'index.html deve dichiarare una importmap');
  const { imports } = JSON.parse(blocco[1]);
  // La importmap usa './vendor/x.js', le altre due copie 'vendor/x.js'.
  return Object.fromEntries(Object.entries(imports).map(([k, v]) => [k, v.replace(/^\.\//, '')]));
}

function pathsDiJsconfig() {
  const { compilerOptions } = JSON.parse(leggi('../jsconfig.json'));
  return Object.fromEntries(
    Object.entries(compilerOptions.paths).map(([k, v]) => {
      assert.equal(v.length, 1, `jsconfig paths[${k}] deve avere una sola destinazione`);
      return [k, v[0].replace(/^\.\//, '')];
    }),
  );
}

test('importmap di index.html, resolve-three.mjs e jsconfig.json mappano three sugli stessi file', () => {
  const browser = importmapDiIndexHtml();
  assert.deepEqual(THREE_IMPORT_MAP, browser, 'test/resolve-three.mjs diverge dalla importmap');
  assert.deepEqual(pathsDiJsconfig(), browser, 'jsconfig.json diverge dalla importmap');
});
