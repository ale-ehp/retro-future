// La mappa di three esiste in tre copie che devono dire la stessa cosa:
//   - la importmap di index.html, che il browser legge;
//   - THREE_IMPORT_MAP in test/resolve-three.mjs, che node legge nei test;
//   - i `paths` di jsconfig.json, che tsc legge nel typecheck (solo gli addon, vedi sotto).
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

test('importmap di index.html e resolve-three.mjs mappano three sugli stessi file', () => {
  assert.deepEqual(THREE_IMPORT_MAP, importmapDiIndexHtml(), 'test/resolve-three.mjs diverge dalla importmap');
});

test('jsconfig.json mappa gli addon sugli stessi file, e three sui tipi veri', () => {
  // `three` non sta nei paths di proposito: tsc lo risolve su @types/three (stessa r184
  // del vendor), perche' inferire i tipi dal file minificato dava centinaia di falsi
  // errori (position "non esiste" su PerspectiveCamera: Object3D la dichiara con
  // defineProperty) e il cricchetto puniva ogni prova nuova (2026-09-19). Gli addon invece
  // restano sul vendor: UnrealBloomPass e' un fork con campi in piu' che @types non conosce.
  const browser = importmapDiIndexHtml();
  const { three, ...addon } = browser;
  assert.ok(three, 'la importmap deve mappare three');
  assert.deepEqual(pathsDiJsconfig(), addon, 'jsconfig.json diverge dalla importmap sugli addon');
});
