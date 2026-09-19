// La pagina costruita aperta in un browser vero, per le prove che misurano il risultato.
//
// Fino al 2026-09-19 la struttura della pagina si verificava con espressioni regolari
// sull'HTML e sul CSS (main-boot.test.mjs, 27 prove): ogni margine cambiato apposta le
// rompeva e nessuna avrebbe visto un bottone coperto da un altro elemento. Qui la pagina
// si apre in Chromium e si misura quello che il browser ha calcolato davvero.
//
// Niente server HTTP: ogni richiesta viene servita da disco con page.route, sotto un
// origine finto, cosi' non c'e' una porta da liberare. src/main.js viene sostituito da un
// modulo vuoto (salvo richiesta contraria): la scena 3D non serve a queste prove e senza
// di essa ognuna dura meno di un secondo. Le teste della copertina si caricano lo stesso.
//
// Il browser e' quello di Playwright (`npx playwright install chromium`, in CI lo fa il
// workflow). Se manca, la prova FALLISCE con l'errore di Playwright: non si salta, un
// salto sarebbe un timbro.
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from '@playwright/test';

const demoRoot = new URL('../', import.meta.url).pathname;
export const ORIGINE = 'http://retro-future.test';

const CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.glb', 'model/gltf-binary'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.m4a', 'audio/mp4'],
  ['.opus', 'audio/ogg'],
  ['.wav', 'audio/wav'],
  ['.webp', 'image/webp'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
]);

let browser = null;

export async function apriBrowser() {
  if (!browser) browser = await chromium.launch();
  return browser;
}

export async function chiudiBrowser() {
  const b = browser;
  browser = null;
  await b?.close();
}

/**
 * Apre index.html e aspetta la copertina.
 * @param {{ query?: string, mobile?: boolean, bloccaMain?: boolean, reducedMotion?: 'reduce'|'no-preference', viewport?: {width:number,height:number} }} [opzioni]
 */
export async function apriPagina({ query = '', mobile = false, bloccaMain = true, reducedMotion, viewport } = {}) {
  const b = await apriBrowser();
  const context = await b.newContext({
    viewport: viewport ?? (mobile ? { width: 812, height: 375 } : { width: 1280, height: 800 }),
    deviceScaleFactor: 1,
    hasTouch: mobile,
    isMobile: mobile,
    reducedMotion,
  });
  const page = await context.newPage();
  const errori = [];
  page.on('pageerror', (e) => errori.push(String(e)));
  await page.route(`${ORIGINE}/**`, async (route) => {
    let pathname = decodeURIComponent(new URL(route.request().url()).pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = normalize(join(demoRoot, pathname));
    if (!file.startsWith(demoRoot) || !existsSync(file) || !statSync(file).isFile()) {
      await route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' });
      return;
    }
    await route.fulfill({ status: 200, contentType: CONTENT_TYPES.get(extname(file)) || 'application/octet-stream', body: readFileSync(file) });
  });
  if (bloccaMain) {
    await page.route(`${ORIGINE}/src/main.js`, (route) => route.fulfill({
      status: 200, contentType: 'text/javascript; charset=utf-8', body: '// src/main.js sostituito dalla prova: la scena 3D qui non serve\n',
    }));
  }
  await page.goto(`${ORIGINE}/index.html${query}`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForSelector('#welcome-start-button', { timeout: 30_000 });
  return {
    page,
    errori,
    async chiudi() { await context.close(); },
  };
}

/** Lo stile calcolato di un selettore, per le proprieta' chieste. */
export function stile(page, selettore, proprieta) {
  return page.$eval(selettore, (el, props) => {
    const cs = getComputedStyle(el);
    return Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
  }, proprieta);
}

export const rettangolo = (page, selettore) => page.$eval(selettore, (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height, destra: r.right, sotto: r.bottom };
});
