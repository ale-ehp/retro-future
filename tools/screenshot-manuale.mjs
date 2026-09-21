// Le inquadrature del manuale tecnico (doc/).
//
// Perche' esiste (2026-09-20): il manuale mostra la demo vera, non mockup. Riusa il
// harness del gate visivo (retro-future-visual-gate.mjs): server statico sulla cartella
// della demo, Chrome di sistema, attesa dello stato (rivelo concluso) invece che a tempo.
// Poi sposta la camera con le scorciatoie che la demo espone (window.__tronApplyPlayerSpawn)
// e fotografa un soggetto per capitolo. Le immagini finiscono in doc/static/img/ come
// webp; i PNG restano nella cartella di lavoro per guardarli.
//
//   node scripts/retro-future-doc-screenshots.mjs <dirDiLavoro> [--port 8830] [--solo nome,nome]
//
// Il pannello di regia in produzione viene tolto dal DOM (trimProductionControls): qui
// si tiene, intercettando la remove() dei due elementi, perche' un capitolo lo mostra.
// E' l'unico punto in cui l'harness cambia il comportamento della pagina, ed e' detto
// nel manuale.
import { chromium } from '@playwright/test';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const demoRoot = root;
const imgDir = join(demoRoot, 'doc/static/img');
const args = process.argv.slice(2);
const workDir = args.find((a) => !a.startsWith('--'));
const port = Number(args[args.indexOf('--port') + 1]) || 8830;
const solo = args.includes('--solo') ? new Set(args[args.indexOf('--solo') + 1].split(',')) : null;
if (!workDir) { console.error('uso: node scripts/retro-future-doc-screenshots.mjs <dirDiLavoro> [--port N] [--solo a,b]'); process.exit(1); }
mkdirSync(workDir, { recursive: true });
mkdirSync(imgDir, { recursive: true });

const VIEWPORT = { width: 1280, height: 800 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'], ['.glb', 'model/gltf-binary'], ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.json', 'application/json; charset=utf-8'], ['.m4a', 'audio/mp4'],
  ['.opus', 'audio/ogg'], ['.wav', 'audio/wav'], ['.webp', 'image/webp'],
]);
const server = createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = normalize(join(demoRoot, pathname));
  if (!file.startsWith(demoRoot) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': CONTENT_TYPES.get(extname(file)) || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(port, '127.0.0.1', r));
const baseUrl = `http://127.0.0.1:${port}/`;

let browser = null;
async function chiudiTutto() { try { await browser?.close(); } catch {} server.closeAllConnections?.(); server.close(); }
for (const s of ['uncaughtException', 'unhandledRejection']) process.on(s, async (e) => { console.error(e); await chiudiTutto(); process.exit(1); });
try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
const page = await context.newPage();
const errori = [];
page.on('pageerror', (e) => errori.push(String(e).slice(0, 300)));
// Il pannello di regia resta nel DOM (vedi in testa).
await page.addInitScript(() => {
  const remove = Element.prototype.remove;
  Element.prototype.remove = function () {
    if (this.id === 'hud-controls' || this.id === 'settings-toggle') return;
    return remove.call(this);
  };
});

const scatti = [];
async function scatta(nome, opzioni = {}) {
  if (solo && !solo.has(nome)) return;
  const png = join(workDir, `${nome}.png`);
  await page.screenshot({ path: png, timeout: 30_000, ...opzioni });
  const webp = join(imgDir, `${nome}.webp`);
  execFileSync('cwebp', ['-quiet', '-q', '84', png, '-o', webp]);
  scatti.push({ nome, png, webp, kb: Math.round(statSync(webp).size / 1024) });
  console.log(`scatto ${nome}: ${scatti.at(-1).kb} KB`);
}
const spawn = (s, feedback = false) => page.evaluate(([spawn, f]) => window.__tronApplyPlayerSpawn?.(spawn, f), [s, feedback]);
const ispeziona = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__tronInspect?.() ?? null)));
const nascondiHud = () => page.evaluate(() => { for (const id of ['hud-tl', 'tron-disc-cursor', 'settings-toggle']) { const el = document.getElementById(id); if (el) el.style.visibility = 'hidden'; } document.body.classList.add('controls-hidden'); });
const mostraPannello = () => page.evaluate(() => { document.body.classList.remove('controls-hidden'); const st = document.getElementById('settings-toggle'); if (st) st.style.visibility = 'visible'; const p = document.getElementById('hud-controls'); if (p) { p.setAttribute('aria-hidden', 'false'); p.style.opacity = '1'; p.style.visibility = 'visible'; p.style.transform = 'none'; } });

await page.goto(baseUrl, { waitUntil: 'load', timeout: 60_000 });
await page.waitForSelector('#welcome-start-button', { timeout: 30_000 });
await sleep(2500);
await scatta('copertina');

await page.click('#welcome-start-button');
await page.waitForFunction(() => typeof window.__tronInspect === 'function', null, { timeout: 120_000 });
await page.waitForFunction(() => !document.body.classList.contains('welcome-cover-visible'), null, { timeout: 120_000 });
// Il rivelo: una raffica di fotogrammi mentre la citta' appare, se ne sceglie uno guardandoli.
mkdirSync(join(workDir, 'rivelo'), { recursive: true });
await page.evaluate(() => { const st = document.getElementById('settings-toggle'); if (st) st.style.visibility = 'hidden'; });
for (let i = 0; i < 14; i += 1) {
  await page.screenshot({ path: join(workDir, 'rivelo', `${String(i).padStart(2, '0')}.png`), timeout: 30_000 });
  await sleep(1200);
}
// Scelti guardando la raffica (2026-09-20): il 06 e' la citta' in fil di ferro con il cursore
// del drone, il 12 e' chi accoglie con il fumetto di benvenuto appena arrivato.
for (const [nome, indice] of Object.entries({ 'rivelo-in-corso': 6, 'accoglienza-benvenuto': 12 })) {
  const png = join(workDir, 'rivelo', `${String(indice).padStart(2, '0')}.png`);
  const webp = join(imgDir, `${nome}.webp`);
  execFileSync('cwebp', ['-quiet', '-q', '84', png, '-o', webp]);
  scatti.push({ nome, png, webp, kb: Math.round(statSync(webp).size / 1024) });
  console.log(`scatto ${nome} (raffica ${indice}): ${scatti.at(-1).kb} KB`);
}
await page.waitForFunction(() => window.__tronInspect?.()?.cityRevealComplete === true, null, { timeout: 180_000 });
await sleep(2500);
await page.mouse.move(640, 780);
const t0 = await ispeziona();
writeFileSync(join(workDir, 'inspect-dopo-rivelo.json'), JSON.stringify(t0, null, 2));
await nascondiHud();
await scatta('panoramica');

// Chi accoglie arriva a piedi: qualche secondo di attesa.
await sleep(6000);
await scatta('folla-e-accoglienza');

// Il cielo: stessa posizione, sguardo in alto.
const base = { x: t0.cameraX, y: t0.cameraY, z: t0.cameraZ, spawnYaw: t0.cameraYaw, spawnPitch: t0.cameraPitch };
await spawn({ ...base, spawnPitch: 0.7 });
await sleep(800);
await scatta('cielo');

// Il pavimento: sguardo in basso mentre si cammina, le tessere reagiscono ai passi.
await spawn({ ...base, spawnPitch: -0.55 });
await page.keyboard.down('KeyW');
await sleep(1600);
await scatta('pavimento-esagoni');
await page.keyboard.up('KeyW');
await sleep(300);

// Il terminale dei contatti: davanti al tabellone del civico 2, poi il tasto E lo mette a fuoco.
const term = t0.contactTerminal?.worldPosition;
if (term) {
  await spawn({ x: term.x, y: 4.1, z: term.z + 34, spawnYaw: 0, spawnPitch: 0.06 });
  await sleep(1200);
  await scatta('terminale-contatti');
  await page.keyboard.press('KeyE');
  await sleep(2200);
  await scatta('terminale-attivo');
  await page.keyboard.press('Escape');
  await sleep(2200);
}

// Il tabellone dei ruoli davanti al palazzo 1, e i LED di facciata del palazzo 2.
const civici = t0.sideBuildingCivicNumbers ?? [];
const c1 = civici.find((c) => c.value === 1);
const c2 = civici.find((c) => c.value === 2);
// Provati due orientamenti (2026-09-20): con yaw +1.25 si vede solo la porta, con -1.25 il
// tabellone dei ruoli accanto alla porta e il pavimento. Si tiene il secondo.
if (c1) {
  await spawn({ x: c1.x * 0.35, y: 4.1, z: c1.z + 6, spawnYaw: -1.25, spawnPitch: 0.1 });
  await sleep(1000);
  await scatta('tabellone-ruoli');
}
if (c2) {
  await spawn({ x: c2.x * 0.55, y: 4.1, z: c2.z + 40, spawnYaw: -0.55, spawnPitch: 0.35 });
  await sleep(1000);
  await scatta('led-facciata');
}

// Palazzi e LED: mezzo giro e uno sguardo laterale.
await spawn({ ...base, spawnYaw: base.spawnYaw + 0.9, spawnPitch: 0.12 });
await sleep(800);
await scatta('palazzi-e-led');

// Il pannello di regia (tenuto nel DOM dall'harness).
await spawn(base);
await mostraPannello();
await sleep(500);
await scatta('pannello-di-regia');
await page.evaluate(() => document.body.classList.add('controls-hidden'));

const t1 = await ispeziona();
writeFileSync(join(workDir, 'inspect-fine.json'), JSON.stringify(t1, null, 2));
writeFileSync(join(workDir, 'scatti.json'), JSON.stringify({ scatti, errori }, null, 2));
console.log(`${scatti.length} scatti in ${imgDir}; errori di pagina: ${errori.length}`);
await chiudiTutto();
