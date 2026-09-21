// Typecheck della demo, con soglia a cricchetto.
//
// Perche' esiste: la demo non ha bundler di proposito (index.html usa una importmap)
// e fino al 2026-09-19 non aveva ne' typecheck ne' lint. Firme sbagliate, refusi nei
// nomi e import di export inesistenti si scoprivano solo aprendo la pagina. Qui tsc
// legge i .js con `checkJs` dal jsconfig.json, senza emettere niente.
//
// Il debito di partenza e' misurato, non nascosto: la SOGLIA qui sotto e' il numero di
// errori del giorno in cui il controllo e' nato. Il comando fallisce se il numero SALE
// e chiede di abbassare la soglia se SCENDE, cosi' il conteggio puo' solo migliorare.
// Non fallisce quando scende: rendere rossa una correzione insegnerebbe a non correggere.
//
// Si contano solo i file nostri: src/ e test/. vendor/ e' three.js copiato da upstream
// e tsc ne inferisce i tipi male (146 errori li' dentro). Per questo `three` NON passa
// dal vendor ma da @types/three, pinnato alla stessa r184 in package.json: inferirlo dal
// file minificato dava in src/ centinaia di falsi errori. Gli addon restano mappati sul
// vendor come nella importmap: UnrealBloomPass e' un fork con campi in piu'.
//
//   npm run typecheck              riepilogo per file e per codice
//   npm run typecheck -- --tutti   ogni diagnostica, una per riga
import { createRequire } from 'node:module';
import { relative, resolve, sep } from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');

/**
 * Errori presenti quando il controllo e' nato (2026-09-19, 788 col vendor; 640 con
 * @types/three; 524 con globali.d.ts). Azzerati il 2026-09-20 in quindici commit, un
 * dominio per commit e senza `any`. Puo' solo scendere, e da qui non ha piu' dove
 * andare: resta 0.
 */
const SOGLIA = 0;

const root = resolve(new URL('..', import.meta.url).pathname);
const configPath = resolve(root, 'jsconfig.json');
const mostraTutti = process.argv.includes('--tutti');

const host = ts.sys;
const parsed = ts.getParsedCommandLineOfConfigFile(configPath, { noEmit: true }, {
  ...host,
  onUnRecoverableConfigFileDiagnostic(d) {
    console.error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    process.exit(2);
  },
});
if (!parsed) process.exit(2);
if (parsed.errors.length) {
  for (const d of parsed.errors) console.error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  process.exit(2);
}

const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options });
const tutte = ts.getPreEmitDiagnostics(program);

/** Solo src/ e test/: vendor/ e node_modules/ non sono codice nostro. */
function nostro(file) {
  if (!file) return false;
  const rel = relative(root, file.fileName);
  if (rel.startsWith('..')) return false;
  const primo = rel.split(sep)[0];
  return primo === 'src' || primo === 'test';
}

const errori = tutte.filter((d) => d.category === ts.DiagnosticCategory.Error && nostro(d.file));

function posizione(d) {
  const { line, character } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
  return `${relative(root, d.file.fileName)}(${line + 1},${character + 1})`;
}

if (mostraTutti) {
  for (const d of errori) {
    console.log(`${posizione(d)}: TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
  }
  console.log('');
}

const perFile = new Map();
const perCodice = new Map();
for (const d of errori) {
  const f = relative(root, d.file.fileName);
  perFile.set(f, (perFile.get(f) ?? 0) + 1);
  perCodice.set(`TS${d.code}`, (perCodice.get(`TS${d.code}`) ?? 0) + 1);
}
const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

console.log(`typecheck: ${errori.length} errori in src/ e test/ (soglia ${SOGLIA}; vendor/ escluso)`);
if (perFile.size) {
  console.log('  per file:');
  for (const [f, n] of top(perFile, 12)) console.log(`    ${String(n).padStart(5)}  ${f}`);
  console.log('  per codice:');
  for (const [c, n] of top(perCodice, 8)) console.log(`    ${String(n).padStart(5)}  ${c}`);
}

if (errori.length > SOGLIA) {
  console.error(`\nROSSO: ${errori.length} errori, la soglia e' ${SOGLIA}. Hai aggiunto ${errori.length - SOGLIA} errori: correggili, la soglia non sale.`);
  console.error('Per vederli tutti: npm run typecheck -- --tutti');
  process.exit(1);
}
if (errori.length < SOGLIA) {
  console.log(`\nSei sotto la soglia di ${SOGLIA - errori.length}: abbassa SOGLIA a ${errori.length} in tools/typecheck.mjs nello stesso commit.`);
}
console.log('\nVERDE: la soglia regge.');
