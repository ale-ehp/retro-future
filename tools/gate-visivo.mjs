// Cattura di riferimento per il gate visivo di Retro Future.
//
// Perche' esiste: la demo non ha test che guardino il risultato. La suite node
// verifica quasi solo che certe righe siano scritte in un certo modo, quindi un
// refactoring puo' passarla tutta e cambiare la scena. Questo script fotografa lo
// stato reale in Chrome e lo salva; tools/confronto-visivo.py confronta due
// cattura contro un pavimento di rumore misurato.
//
//   node tools/gate-visivo.mjs <dirDiOutput> [--port 8781]
//   python3 tools/confronto-visivo.py <dirBase> <dirNuova>
//
// Serve direttamente la radice del repository: il build di pubblicazione e' una
// copia pura (cpSync senza trasformazioni) dentro dist-retro/chi-siamo/retro-future,
// quindi sorgente e artefatto sono byte-identici e catturare il sorgente basta.
//
// Cosa produce in <dirDiOutput>:
//   welcome.png        cover di ingresso, deterministica: 0.0000% di diff fra run
//   scene-A.png        scena libera. NON e' un gate, vedi il comparatore
//   scene-static.png   stessa scena con folla, equalizer e cicli delle board fermi
//   scene-static-burst/  la stessa inquadratura fotografata a raffica per qualche secondo
//                      (NN.png + tempi.json): il comparatore prende il fotogramma piu'
//                      vicino alla baseline, vedi sotto
//   fingerprint.json   impronta strutturale, console, richieste di rete
//
// Perche' la raffica (2026-09-19): "statica" non vuol dire ferma. Con folla ed equalizer
// spenti restano le luci che pulsano a tempo (LED di strada e facciate, nuvole): fra due
// fotogrammi a 3 secondi di distanza nella STESSA sessione c'era il 2.3% di pixel diversi,
// concentrato sulla fascia dei LED all'orizzonte, e a 11 secondi lo 0.4%: e' una fase,
// non una deriva. La baseline della mattina batteva le catture del pomeriggio del 3.7%
// a codice identico, sopra il gate dell'1.5%, e fra loro le catture del pomeriggio
// concordavano allo 0.2%. Bloccare l'orologio non si puo' senza toccare mezza scena
// (performance.now() sta in quindici moduli), quindi si fotografa a raffica e si
// confronta la baseline con il fotogramma in fase: una regressione vera sposta TUTTI
// i fotogrammi, una fase diversa solo alcuni.
import { chromium } from '@playwright/test';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const demoRoot = root;

const args = process.argv.slice(2);
const outDir = args.find((a) => !a.startsWith('--'));
const port = Number(args[args.indexOf('--port') + 1]) || 8781;
if (!outDir) {
  console.error('uso: node tools/gate-visivo.mjs <dirDiOutput> [--port N]');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const VIEWPORT = { width: 1280, height: 800 };
// Su una macchina lenta (container Linux in una VM da 2 CPU, rendering software) il boot
// della citta' supera i 2 minuti: RF_GATE_SLOW=4 moltiplica tutte le attese (2026-09-19).
const SLOW = Math.max(1, Number(process.env.RF_GATE_SLOW) || 1);
const REVEAL_SETTLE_MS = 2_500;   // assestamento DOPO che il reveal si e' dichiarato completo
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Regioni con rumore intrinseco: l'HUD mostra timing GPU reali, il bottone di
// avvio ha un pulse CSS, l'equalizer segue l'audio. Vengono mascherate nel diff.
const NOISE_SELECTORS = [
  '#hud-tl', '#welcome-start-button', '#tron-reveal-wait-label', '#tron-disc-cursor',
  '#lab-equalizer-canvas', '.perf-live-overlay', '#mobile-performance-diagnostics',
  '#retro-benchmark-panel',
];

const CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.glb', 'model/gltf-binary'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.m4a', 'audio/mp4'],
  ['.opus', 'audio/ogg'],
  ['.wav', 'audio/wav'],
  ['.webp', 'image/webp'],
]);

function staticServer() {
  return createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = normalize(join(demoRoot, pathname));
    if (!file.startsWith(demoRoot) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': CONTENT_TYPES.get(extname(file)) || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
}

// Aspettare a tempo fisso non basta: il reveal parte quando ha finito di caricare,
// e quanto ci mette dipende da rete, cache e carico della macchina. Con un'attesa a
// tempo la cattura finisce sulla cover di benvenuto e il confronto dice che tutta la
// scena e' cambiata, che e' un falso allarme molto convincente. Si aspetta lo stato.
async function startAndAwaitReveal(page) {
  await page.waitForSelector('#welcome-start-button', { timeout: 30_000 });
  // __tronInspect vive in src/main.js, che la cover importa solo dentro
  // scheduleRetroFutureCityBoot(): prima del click non esiste e l'attesa non puo'
  // che scadere. Si clicca, poi si aspetta l'hook.
  await page.click('#welcome-start-button');
  // Il secondo argomento di waitForFunction e' l'ARG passato alla funzione, le opzioni sono
  // il terzo: con `{ timeout }` al secondo posto il timeout restava quello di default, 30s.
  // Su macOS con GPU nessuno se n'e' accorto; in un container Linux lento il boot della
  // citta' supera i 30s e il gate moriva li' (2026-09-19).
  await page.waitForFunction(() => typeof window.__tronInspect === 'function', null, { timeout: 120_000 * SLOW });
  await page.waitForFunction(() => !document.body.classList.contains('welcome-cover-visible'), null, { timeout: 120_000 * SLOW });
  await page.waitForFunction(() => window.__tronInspect?.()?.cityRevealComplete === true, null, { timeout: 180_000 * SLOW });
  await sleep(REVEAL_SETTLE_MS);
  await page.mouse.move(640, 780);   // il puntatore fuori dal bottone, ha uno stato hover
}

const readNoiseBoxes = (page) => page.evaluate((sels) => {
  const out = [];
  for (const sel of sels) {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        out.push({ sel, x: Math.floor(r.x), y: Math.floor(r.y), w: Math.ceil(r.width), h: Math.ceil(r.height) });
      }
    }
  }
  return out;
}, NOISE_SELECTORS);

const server = staticServer();
await new Promise((r) => server.listen(port, '127.0.0.1', r));
const baseUrl = `http://127.0.0.1:${port}/`;

// Il server e il browser vanno chiusi anche quando la cattura fallisce a meta':
// senza questo un timeout lasciava il processo vivo con la porta ancora in ascolto,
// e il tentativo successivo moriva con EADDRINUSE su una porta apparentemente libera
// (2026-09-18).
let browser = null;
async function chiudiTutto() {
  try { await browser?.close(); } catch { /* il browser puo' essere gia' andato giu' */ }
  server.closeAllConnections?.();   // le keep-alive tengono aperta la porta
  server.close();
}
for (const segnale of ['uncaughtException', 'unhandledRejection']) {
  process.on(segnale, async (errore) => {
    console.error(errore);
    // quello che la pagina ha detto prima di morire: e' la prima cosa da leggere in CI
    if (pageErrors.length) console.error('errori di pagina:', pageErrors.slice(-5));
    if (consoleLog.length) console.error('console (ultime 8):', consoleLog.slice(-8));
    await chiudiTutto();
    process.exit(1);
  });
}

// Chrome di sistema dove c'e' (macOS: GPU vera), altrimenti il Chromium di Playwright
// (in CI e nei container Linux, dove Chrome non e' installato). Quale dei due ha
// fotografato finisce in fingerprint.json fuori dall'impronta confrontata, come
// informazione: e' la prima cosa da guardare se due catture divergono (2026-09-19).
let browserName = 'chrome';
try {
  browser = await chromium.launch({ channel: 'chrome' });
} catch (errore) {
  console.warn(`Chrome di sistema non disponibile (${String(errore).split('\n')[0]}): uso il Chromium di Playwright`);
  browserName = 'chromium';
  browser = await chromium.launch();
}
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });

const consoleLog = [];
const pageErrors = [];
const requestFailures = [];
const requests = [];

const page = await context.newPage();
page.on('console', (m) => consoleLog.push({ type: m.type(), text: m.text().slice(0, 400) }));
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 600)));
page.on('requestfailed', (r) => requestFailures.push({ url: r.url().replace(baseUrl, ''), err: r.failure()?.errorText }));
page.on('request', (r) => requests.push(r.url().replace(baseUrl, '')));

await page.goto(baseUrl, { waitUntil: 'load', timeout: 60_000 * SLOW });
await page.waitForSelector('#welcome-start-button', { timeout: 30_000 * SLOW });
await sleep(2500); // le quattro teste GLB della cover
const noiseBoxesWelcome = await readNoiseBoxes(page);
await page.screenshot({ path: join(outDir, 'welcome.png'), timeout: 30_000 * SLOW });

await startAndAwaitReveal(page);
const noiseBoxesScene = await readNoiseBoxes(page);
await page.screenshot({ path: join(outDir, 'scene-A.png'), timeout: 30_000 * SLOW });

// Impronta strutturale: piu' robusta dei pixel, e' lei a beccare i cambi veri.
const fingerprint = await page.evaluate(() => {
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(3)) : v);
  const t = window.__tronInspect ? window.__tronInspect() : null;
  const scene = window.__fxScene ? window.__fxScene() : null;
  const counts = {};
  const names = [];
  if (scene) {
    scene.traverse((o) => {
      counts[o.type] = (counts[o.type] || 0) + 1;
      if (o.name) names.push(o.name);
    });
  }
  return {
    sceneTypeCounts: counts,
    sceneObjectTotal: Object.values(counts).reduce((a, b) => a + b, 0),
    sceneNamesSorted: names.slice().sort(),
    camera: t ? { x: num(t.cameraX), y: num(t.cameraY), z: num(t.cameraZ), pitch: num(t.cameraPitch), yaw: num(t.cameraYaw) } : null,
    civicNumberCount: t?.sideBuildingCivicNumberCount ?? null,
    civicNumbers: t?.sideBuildingCivicNumbers ?? null,
    bridgeLinks: t?.bridgeLinks ?? null,
    surfaceReflections: t?.surfaceReflections ?? null,
    cityDepartmentBoards: t?.cityDepartmentBoards ?? null,
    cityRoleBoard: t?.cityRoleBoard ?? null,
    contactTerminal: t?.contactTerminal ?? null,
    runnerCrowdKeys: t?.tronRunnerCrowd ? Object.keys(t.tronRunnerCrowd).sort() : null,
    revealProfileKeys: t?.cityRevealProfile ? Object.keys(t.cityRevealProfile).sort() : null,
    domIds: Array.from(document.querySelectorAll('[id]')).map((e) => e.id).sort(),
    bodyClass: document.body.className,
    styleSheetRuleCounts: Array.from(document.styleSheets).map((s) => { try { return s.cssRules.length; } catch { return -1; } }),
    // I valori che contano davvero a runtime (2026-09-19): sono quelli che le cinque
    // trappole annullavano in silenzio. Qui una regressione diventa uno scostamento
    // strutturale, leggibile per nome, invece di un'immagine leggermente diversa.
    runtime: (() => {
      const cartelli = scene?.getObjectByName('character-bubbles') ?? null;
      const materiali = (radice) => {
        const out = [];
        radice?.traverse((o) => { if (o.material && !Array.isArray(o.material)) out.push(o.material); });
        return out;
      };
      const baseEmissive = (radice) => {
        const valori = materiali(radice)
          .map((m) => m.userData?.tronRunnerBaseEmissiveIntensity)
          .filter((v) => Number.isFinite(v));
        return valori.length ? { count: valori.length, min: num(Math.min(...valori)), max: num(Math.max(...valori)) } : null;
      };
      return {
        cartelli: cartelli ? {
          groupRenderOrder: cartelli.renderOrder,
          sprites: cartelli.children.map((c) => ({
            renderOrder: c.renderOrder,
            depthTest: c.material?.depthTest ?? null,
            depthWrite: c.material?.depthWrite ?? null,
            transparent: c.material?.transparent ?? null,
          })),
          sfondo: window.characterBubbleBackgroundOpacityInspect?.() ?? null,
        } : null,
        personaggi: {
          folla: baseEmissive(scene?.getObjectByName('tron-runner-crowd')),
          fermo: baseEmissive(scene?.getObjectByName('tron-runner-idle-character')),
        },
        rez: t?.tronRunner?.reveal ? {
          enabled: t.tronRunner.reveal.enabled,
          mode: t.tronRunner.reveal.mode,
          durationMs: t.tronRunner.reveal.durationMs,
          phase: t.tronRunner.reveal.phase,
          complete: t.tronRunner.reveal.complete,
          progress: t.tronRunner.reveal.progress,
          emissiveBoost: t.tronRunner.reveal.emissiveBoost,
        } : null,
        composer: window.__tronComposerInspect?.() ?? null,
        anelliRez: (() => { const a = scene?.getObjectByName('tron-runner-rez-rings'); return a ? { parentIsScene: a.parent === scene, renderOrder: a.renderOrder } : null; })(),
      };
    })(),
  };
});

// Scena deterministica. La scena libera non e' confrontabile pixel a pixel: la
// folla cammina e le board ciclano il testo su un timer, e la cattura non e'
// agganciata alla fase dell'animazione. Qui si spengono le due sorgenti di rumore
// con le leve che la demo espone gia'. Restano architettura, pavimento, luci,
// cielo e postprocessing, cioe' cio' che una regressione di render tocca.
const staticPage = await context.newPage();
const staticErrors = [];
staticPage.on('pageerror', (e) => staticErrors.push(String(e).slice(0, 300)));
await staticPage.goto(`${baseUrl}?boardUpload=0`, { waitUntil: 'load', timeout: 60_000 * SLOW });
await startAndAwaitReveal(staticPage);
const isolation = await staticPage.evaluate(() =>
  window.__tronPerfIsolation?.({ crowd: false, equalizer: false }) ?? null);
await sleep(1200);
// Le luci che pulsano e le nuvole vanno a tempo di performance.now(), cioe' dall'apertura
// della pagina: fotografare sempre allo stesso istante di quell'orologio allinea le fasi
// fra sessioni diverse, anche quando il rivelo ha impiegato piu' o meno tempo. Il rivelo
// finisce di solito entro 40 secondi; se sfora, si fotografa subito e l'istante vero
// finisce nell'impronta (staticCaptureAtMs) per spiegare un eventuale scostamento.
// 60 secondi bastano dove il boot dura una ventina di secondi. Sul runner di GitHub,
// senza GPU, il boot ne dura oltre 140: l'istante era gia' passato all'arrivo qui, ogni
// run fotografava a un momento diverso e le nuvole si trovavano altrove. Risultato
// misurato (run 35451006335, 2026-09-19): 2.11% sul fotogramma migliore di 41 contro un
// gate dell'1.5%, senza che fosse cambiato niente. Da li' RF_GATE_STATIC_AT_MS: si alza
// dove il boot e' lento, cosi' l'istante torna fisso davvero.
const STATIC_CAPTURE_AT_MS = Math.max(1, Number(process.env.RF_GATE_STATIC_AT_MS) || 60_000);
// Se il boot ha gia' superato l'istante, l'attesa non aspetta niente e la foto esce a un
// momento qualunque: meglio fermarsi e dirlo, che confrontare fasi diverse in silenzio.
const primaDellAttesa = await staticPage.evaluate(() => performance.now());
if (primaDellAttesa > STATIC_CAPTURE_AT_MS) {
  throw new Error(
    `il boot ha superato l'istante fisso della foto statica: ${Math.round(primaDellAttesa)}ms > `
    + `${STATIC_CAPTURE_AT_MS}ms. Alza RF_GATE_STATIC_AT_MS oltre quel valore, altrimenti ogni run `
    + 'fotografa a una fase diversa e il confronto non vuol dire niente.',
  );
}
await staticPage.waitForFunction((t) => performance.now() >= t, STATIC_CAPTURE_AT_MS, { timeout: (STATIC_CAPTURE_AT_MS + 30_000) * SLOW, polling: 16 });
const noiseBoxesStatic = await readNoiseBoxes(staticPage);
const staticCaptureAtMs = await staticPage.evaluate(() => performance.now());
// anche lo screenshot ha un timeout (30s): in rendering software su una macchina lenta
// un solo fotogramma puo' superarlo, quindi scala con RF_GATE_SLOW come le attese
await staticPage.screenshot({ path: join(outDir, 'scene-static.png'), timeout: 30_000 * SLOW });

// La raffica: piu' fotogrammi possibile per qualche secondi, ciascuno con il suo istante.
// Uno screenshot dura ~120ms e il pulsare dei LED all'orizzonte ha un periodo di ~1.45s
// (misurato 2026-09-19: minimi di differenza a 0, 1.4, 2.9 e 4.3 secondi), quindi i
// fotogrammi cadono su fasi diverse e nell'insieme le coprono tutte: e' la rete di
// sicurezza se l'istante fisso qui sopra non basta ad allineare le fasi.
// Quanti fotogrammi: 40 su una macchina con GPU costano ~4,8 secondi. Sul runner di
// GitHub, senza GPU, il job e' durato 42 minuti (run 35447762926, 2026-09-19) e la
// raffica ne e' la parte grossa, quindi li' si abbassa con RF_GATE_BURST. Meno
// fotogrammi = meno fasi coperte: il comparatore stampa sempre anche il singolo e il
// peggiore, quindi se il numero scelto e' troppo basso si vede dal "in fase" che balla.
const BURST_FRAMES = Math.max(1, Number(process.env.RF_GATE_BURST) || 40);
const burstDir = join(outDir, 'scene-static-burst');
mkdirSync(burstDir, { recursive: true });
const burstTimes = [];
const burstStart = Date.now();
for (let i = 0; i < BURST_FRAMES; i += 1) {
  const png = await staticPage.screenshot({ timeout: 30_000 * SLOW });
  writeFileSync(join(burstDir, `${String(i).padStart(2, '0')}.png`), png);
  burstTimes.push(Date.now() - burstStart);
}
writeFileSync(join(burstDir, 'tempi.json'), JSON.stringify({ frames: BURST_FRAMES, msFromStart: burstTimes }, null, 2));

writeFileSync(join(outDir, 'fingerprint.json'), JSON.stringify({
  fingerprint, noiseBoxesWelcome, noiseBoxesScene, noiseBoxesStatic,
  isolation, staticCaptureAtMs: Number(staticCaptureAtMs.toFixed(1)), browser: browserName, platform: process.platform, staticErrors, consoleLog, pageErrors, requestFailures,
  requests: Array.from(new Set(requests)).sort(),
}, null, 2));

await chiudiTutto();
console.log(`ok ${outDir} | console=${consoleLog.length} pageErrors=${pageErrors.length} sceneObjects=${fingerprint.sceneObjectTotal}`);
