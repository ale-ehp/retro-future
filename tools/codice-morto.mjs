// Codice morto in src/: nomi dichiarati che nessuno usa e
// import che nessuno legge.
//
// Perche' esiste: durante la tappa 5 (2026-09-19) spostare i domini fuori da main.js ha
// fatto emergere 26 nomi mai usati e 122 import inutili, e i commit lo affermano. Senza
// questo script quelle affermazioni non sono verificabili da nessuno: qui si rifanno gli
// stessi conti in due secondi.
//
//   node tools/codice-morto.mjs           elenco, esce 1 se trova qualcosa
//   node tools/codice-morto.mjs --zitto   solo il conteggio
//
// Due controlli distinti:
//
//  - NOMI MORTI: un binding top-level (const, let, function, class, anche esportato) che
//    in TUTTO src/ compare una volta sola, cioe' la sua dichiarazione. In una demo senza
//    bundler un export che nessuno importa viaggia comunque sulla rete, quindi vale anche
//    per gli esportati. Va rilanciato finche' non trova piu' niente: togliendo un nome
//    ne muoiono altri a catena.
//  - IMPORT INUTILI: un nome importato che nel corpo del file (dopo l'ultimo import) non
//    compare mai.
//
// ATTENZIONE alla forma `...nome` (spread): ha un punto davanti e a una regex ingenua
// sembra un accesso a proprieta'. Il rilevatore che lo sbagliava dava per morti nomi vivi
// e ha fatto passare per buono un main.js che non partiva (2026-09-19). La regex qui
// sotto ha l'alternativa apposta.
//
// Non guarda index.html, tools/ e test/ fuori da src/: prima di togliere un export,
// cercarlo anche li'.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';

const require = createRequire(import.meta.url);
// acorn e' dichiarato in devDependencies apposta (2026-09-19): arrivava gia' come
// dipendenza indiretta e in locale funzionava, ma la CI installa da package.json e il
// primo run con questo controllo e' morto con "Cannot find module 'acorn'".
const acorn = require('acorn');

const radice = resolve(new URL('..', import.meta.url).pathname, 'src');
const zitto = process.argv.includes('--zitto');

/** Tutti i .js e .mjs sotto src/, vendor escluso. */
function file(dir, out = []) {
  for (const voce of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, voce.name);
    if (voce.isDirectory()) { if (voce.name !== 'vendor' && voce.name !== 'node_modules') file(p, out); }
    else if (/\.(js|mjs)$/.test(voce.name)) out.push(p);
  }
  return out;
}

function nomiDelPattern(nodo, out) {
  if (!nodo) return;
  if (nodo.type === 'Identifier') out.push(nodo.name);
  else if (nodo.type === 'ObjectPattern') nodo.properties.forEach((p) => nomiDelPattern(p.type === 'RestElement' ? p.argument : p.value, out));
  else if (nodo.type === 'ArrayPattern') nodo.elements.forEach((e) => e && nomiDelPattern(e, out));
  else if (nodo.type === 'AssignmentPattern') nomiDelPattern(nodo.left, out);
  else if (nodo.type === 'RestElement') nomiDelPattern(nodo.argument, out);
}

/** L'alternativa `(?<=\.\.\.)` e' quella che salva lo spread dal falso positivo. */
function riferimenti(nome, testo) {
  const re = new RegExp(`(?:(?<=\\.\\.\\.)|(?<![\\w$.]))${nome.replace(/\$/g, '\\$')}(?![\\w$])`, 'g');
  return (testo.match(re) || []).length;
}

const files = file(radice);
const sorgenti = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));
const alberi = new Map();
for (const [f, src] of sorgenti) {
  try { alberi.set(f, acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module', allowAwaitOutsideFunction: true })); }
  catch (errore) { console.error(`NON SI LEGGE ${relative(radice, f)}: ${errore.message}`); process.exit(2); }
}

const morti = [];
for (const [f, ast] of alberi) {
  for (const nodo of ast.body) {
    let n = nodo;
    let esportato = false;
    if (n.type === 'ExportNamedDeclaration' && n.declaration) { n = n.declaration; esportato = true; }
    const nomi = [];
    if (n.type === 'VariableDeclaration') for (const d of n.declarations) nomiDelPattern(d.id, nomi);
    else if ((n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration') && n.id) nomi.push(n.id.name);
    for (const nome of nomi) {
      let usi = 0;
      for (const testo of sorgenti.values()) usi += riferimenti(nome, testo);
      if (usi <= 1) morti.push({ file: relative(radice, f), nome, esportato });
    }
  }
}

const inutili = [];
for (const [f, ast] of alberi) {
  let fineImport = 0;
  const importati = new Map();
  for (const n of ast.body) {
    if (n.type !== 'ImportDeclaration') continue;
    fineImport = Math.max(fineImport, n.end);
    for (const s of n.specifiers) importati.set(s.local.name, n.source.value);
  }
  const corpo = sorgenti.get(f).slice(fineImport);
  for (const [nome, da] of importati) {
    if (riferimenti(nome, corpo) === 0) inutili.push({ file: relative(radice, f), nome, da });
  }
}

if (!zitto) {
  for (const m of morti) console.log(`NOME MORTO    ${m.file}\t${m.nome}${m.esportato ? ' (esportato)' : ''}`);
  for (const i of inutili) console.log(`IMPORT INUTILE ${i.file}\t${i.nome}  <- ${i.da}`);
}
console.log(`${morti.length} nomi morti, ${inutili.length} import inutili in ${files.length} file di src/`);
if (morti.length) console.log('Togli i nomi morti e RILANCIA: cadono a catena.');
process.exit(morti.length + inutili.length ? 1 : 0);
