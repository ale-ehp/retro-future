// La copertina e i pezzi fissi della pagina, misurati nel browser.
//
// Sostituisce main-boot.test.mjs, contact-terminal-integration.test.mjs (la parte HTML/CSS)
// e settings-controls.test.mjs (2026-09-19): quelle prove cercavano `min-height: 62px` e
// `z-index: 120` nel CSS con espressioni regolari. Qui si guarda cosa il browser ha
// calcolato: se il bottone e' raggiungibile, se le quattro schede stanno su una riga, se
// la scheda dei contatti ha bersagli abbastanza grandi. Un margine cambiato apposta non
// rompe niente; un elemento che copre il bottone si'.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { apriBrowser, apriPagina, chiudiBrowser, rettangolo, stile } from '../test/pagina.mjs';

before(() => apriBrowser());
after(() => chiudiBrowser());

test('la copertina si dipinge subito, nera, davanti a tutto, e senza aspettare la scena', async () => {
  const { page, errori, chiudi } = await apriPagina();
  try {
    // nessun <script src=main.js> statico: la citta' parte da scheduleRetroFutureCityBoot()
    assert.equal(await page.$('script[src*="main.js"]'), null, 'main.js e\' caricato da un tag statico: la copertina aspetterebbe la scena');
    // Chromium riporta il colore nello spazio in cui e' scritto: oklch(0 0 0) e' nero come rgb(0, 0, 0)
    const nero = /^(rgb\(0, 0, 0\)|oklch\(0 0 0\))$/;
    const overlay = await stile(page, '#welcome-window-overlay', ['position', 'background-color', 'opacity', 'visibility']);
    assert.equal(overlay.position, 'fixed');
    assert.match(overlay['background-color'], nero);
    assert.equal(overlay.opacity, '1');
    assert.equal(overlay.visibility, 'visible');
    const corpo = await stile(page, 'body', ['background-color']);
    assert.match(corpo['background-color'], nero, 'il body dietro la copertina non e\' nero: si vedrebbe un lampo');
    // la copertina sta prima dell'HUD nel documento, cosi' si dipinge per prima
    const prima = await page.evaluate(() => {
      const overlay = document.getElementById('welcome-window-overlay');
      const hud = document.getElementById('hud-tl');
      return Boolean(overlay && hud && (overlay.compareDocumentPosition(hud) & Node.DOCUMENT_POSITION_FOLLOWING));
    });
    assert.equal(prima, true);
    assert.deepEqual(errori, []);
  } finally { await chiudi(); }
});

test('il bottone di avvio e\' l\'unico invito, e nessuno lo copre', async () => {
  const { page, chiudi } = await apriPagina();
  try {
    const bottoni = await page.$$eval('#welcome-window-overlay button', (els) => els.map((b) => b.id));
    assert.deepEqual(bottoni, ['welcome-start-button']);
    assert.ok((await page.textContent('#welcome-window-title'))?.trim(), 'manca il titolo');
    assert.ok((await page.textContent('#welcome-start-button'))?.trim(), 'il bottone non ha testo');
    // elementFromPoint al centro: se un overlay o una scheda lo coprisse, tornerebbe quello
    const r = await rettangolo(page, '#welcome-start-button');
    assert.ok(r.w >= 44 && r.h >= 44, `bottone ${r.w}x${r.h}: troppo piccolo da toccare`);
    const sopra = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('button')?.id ?? document.elementFromPoint(x, y)?.tagName, [r.x + r.w / 2, r.y + r.h / 2]);
    assert.equal(sopra, 'welcome-start-button', `al centro del bottone c'e' ${sopra}`);
    // il link alla home sta sotto il bottone, dentro l'area d'azione
    const link = await rettangolo(page, '#welcome-window-overlay a.welcome-home-link');
    assert.ok(link.y >= r.sotto, 'il link alla home non sta sotto il bottone');
    assert.equal(await page.getAttribute('#welcome-window-overlay a.welcome-home-link', 'href'), '/');
  } finally { await chiudi(); }
});

test('le quattro schede dei reparti stanno su una riga, intere, sopra il bottone', async () => {
  const { page, chiudi } = await apriPagina();
  try {
    const schede = await page.$$eval('.welcome-department-card', (els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, destra: r.right, sotto: r.bottom, w: r.width, h: r.height };
    }));
    assert.equal(schede.length, 4);
    const larghezzaPagina = await page.evaluate(() => document.documentElement.clientWidth);
    for (const s of schede) {
      assert.ok(s.x >= 0 && s.destra <= larghezzaPagina, `scheda tagliata: ${s.x}..${s.destra} su ${larghezzaPagina}`);
      assert.ok(Math.abs(s.y - schede[0].y) < 1, 'le schede non sono allineate sulla stessa riga');
      assert.ok(s.w > 100 && s.h > 100, `scheda ${s.w}x${s.h}: schiacciata`);
    }
    for (let i = 1; i < 4; i += 1) assert.ok(schede[i].x >= schede[i - 1].destra, 'due schede si sovrappongono');
    const bottone = await rettangolo(page, '#welcome-start-button');
    assert.ok(bottone.y >= schede[0].sotto, 'il bottone non sta sotto le schede');
    const etichette = await page.$$eval('.welcome-department-label', (els) => els.map((e) => e.textContent?.trim()));
    assert.equal(etichette.length, 4);
    assert.ok(etichette.every(Boolean));
  } finally { await chiudi(); }
});

test('le quattro teste si caricano davvero quando il mouse si avvicina, e le facce si accendono', async () => {
  const { page, errori, chiudi } = await apriPagina();
  try {
    const facce = await page.$$('canvas.welcome-department-face[data-head-model]');
    assert.equal(facce.length, 4);
    // le teste GLB partono solo quando il puntatore si avvicina a una scheda (risparmio per
    // chi non le guarda): a riposo restano le foto statiche
    assert.equal((await page.evaluate(() => /** @type {any} */ (window).__welcomeDepartmentHeadsInspect().status)), 'idle');
    const r = await rettangolo(page, '.welcome-department-card');
    await page.mouse.move(r.x + r.w / 2, r.y + r.h / 2);
    await page.waitForFunction(() => document.querySelectorAll('.welcome-department-face.is-head-ready').length === 4, null, { timeout: 30_000 });
    const opacita = await page.$$eval('.welcome-department-face', (els) => els.map((el) => getComputedStyle(el).opacity));
    assert.deepEqual(opacita, ['1', '1', '1', '1']);
    assert.deepEqual(errori, [], `errori di pagina: ${errori.join(' | ')}`);
  } finally { await chiudi(); }
});

test('finche\' la copertina e\' su, l\'HUD e i controlli non si vedono; dopo si\'', async () => {
  const { page, chiudi } = await apriPagina({ query: '?osd' });   // ?osd accende l'HUD dei valori
  try {
    const nascosto = async () => {
      const [hud, tasto] = await Promise.all([
        stile(page, '#hud-tl', ['visibility', 'opacity', 'pointer-events']),
        stile(page, '#settings-toggle', ['visibility', 'opacity', 'pointer-events']),
      ]);
      return { hud, tasto };
    };
    let s = await nascosto();
    assert.equal(s.hud.visibility, 'hidden', 'HUD visibile sopra la copertina');
    assert.equal(s.tasto.visibility, 'hidden', 'tasto Settaggi visibile sopra la copertina');
    assert.equal(s.tasto['pointer-events'], 'none');
    // e' main.js a togliere la classe quando la copertina se ne va: qui si fa a mano
    await page.evaluate(() => document.body.classList.remove('welcome-cover-visible'));
    s = await nascosto();
    assert.equal(s.hud.visibility, 'visible');
    assert.equal(s.tasto.visibility, 'visible');
  } finally { await chiudi(); }
});

test('sul telefono l\'HUD dei valori non compare mai, nemmeno con ?osd', async () => {
  const { page, chiudi } = await apriPagina({ query: '?osd', mobile: true });
  try {
    assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true, 'il contesto mobile non emula il puntatore grossolano');
    await page.evaluate(() => document.body.classList.remove('welcome-cover-visible'));
    const hud = await stile(page, '#hud-tl', ['display']);
    assert.equal(hud.display, 'none');
  } finally { await chiudi(); }
});

test('la scheda contatti: comandi semantici e bersagli abbastanza grandi', async () => {
  const { page, chiudi } = await apriPagina();
  try {
    assert.equal(await page.getAttribute('#contact-terminal-action', 'type'), 'button');
    assert.equal(await page.getAttribute('#contact-terminal-back', 'type'), 'button');
    assert.ok(await page.getAttribute('#contact-terminal-back', 'aria-label'), 'il bottone indietro non ha nome');
    assert.ok(await page.getAttribute('#contact-terminal-action', 'aria-label'));
    assert.equal(await page.getAttribute('#contact-terminal-surface', 'role'), 'group');
    assert.equal(await page.getAttribute('#contact-terminal-surface', 'tabindex'), '-1');
    assert.equal(await page.getAttribute('#contact-terminal-live', 'aria-live'), 'polite');
    // nascosti finche' non ci si avvicina: qui si mostrano per misurarli
    await page.evaluate(() => { for (const id of ['contact-terminal-action', 'contact-terminal-back']) document.getElementById(id).hidden = false; });
    const azione = await rettangolo(page, '#contact-terminal-action');
    const indietro = await rettangolo(page, '#contact-terminal-back');
    assert.ok(azione.h >= 44, `bersaglio INTERAGISCI alto ${azione.h}px`);
    assert.ok(indietro.w >= 44 && indietro.h >= 44, `bersaglio indietro ${indietro.w}x${indietro.h}`);
    const vp = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
    assert.ok(azione.destra <= vp.w && azione.sotto <= vp.h && azione.x >= 0, 'INTERAGISCI esce dallo schermo');
    assert.ok(indietro.x >= 0 && indietro.y >= 0, 'indietro esce dallo schermo');
  } finally { await chiudi(); }
});

test('sul telefono i bersagli dei contatti crescono, e nessun cursore a disco', async () => {
  const { page, chiudi } = await apriPagina({ mobile: true });
  try {
    await page.evaluate(() => { for (const id of ['contact-terminal-action', 'contact-terminal-back']) document.getElementById(id).hidden = false; });
    const azione = await rettangolo(page, '#contact-terminal-action');
    const indietro = await rettangolo(page, '#contact-terminal-back');
    assert.ok(azione.h >= 48, `bersaglio INTERAGISCI alto ${azione.h}px sul telefono`);
    assert.ok(indietro.w >= 48 && indietro.h >= 48, `bersaglio indietro ${indietro.w}x${indietro.h} sul telefono`);
    const disco = await stile(page, '#tron-disc-cursor', ['display']);
    assert.equal(disco.display, 'none');
  } finally { await chiudi(); }
});

test('il cursore a disco non intercetta il mouse e l\'attesa sta in basso a destra, ferma finche\' non serve', async () => {
  const { page, chiudi } = await apriPagina();
  try {
    const disco = await stile(page, '#tron-disc-cursor', ['pointer-events', 'position']);
    assert.equal(disco['pointer-events'], 'none', 'il disco ruberebbe i click al canvas');
    assert.equal(disco.position, 'fixed');
    assert.equal(await page.$$eval('#tron-disc-cursor .disc-wait-notch', (els) => els.length), 3);

    const attesa = await stile(page, '#tron-reveal-wait-label', ['position', 'opacity', 'pointer-events', 'animation-name']);
    assert.equal(attesa.position, 'fixed');
    assert.equal(attesa.opacity, '0', 'l\'etichetta Attendi si vede anche a riposo');
    assert.equal(attesa['pointer-events'], 'none');
    assert.equal(attesa['animation-name'], 'none');
    await page.evaluate(() => document.getElementById('tron-reveal-wait-label').classList.add('is-active'));
    const attiva = await stile(page, '#tron-reveal-wait-label', ['opacity', 'animation-name']);
    assert.ok(Number(attiva.opacity) > 0, `attiva ma con opacita' ${attiva.opacity}`);   // pulsa: non e' fissa a 1
    assert.notEqual(attiva['animation-name'], 'none', 'attiva, l\'etichetta deve pulsare');
    const r = await rettangolo(page, '#tron-reveal-wait-label');
    const vp = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
    assert.ok(r.x > vp.w / 2 && r.y > vp.h / 2, `l'etichetta sta a ${r.x},${r.y}: non in basso a destra`);
    assert.ok(r.destra <= vp.w && r.sotto <= vp.h, 'l\'etichetta esce dallo schermo');
  } finally { await chiudi(); }
});

test('con la preferenza di movimento ridotto il bottone non pulsa', async () => {
  const { page, chiudi } = await apriPagina({ reducedMotion: 'reduce' });
  try {
    const b = await stile(page, '#welcome-start-button', ['animation-name']);
    assert.equal(b['animation-name'], 'none');
  } finally { await chiudi(); }
});

test('ogni canvas rifiuta i gesti del browser (touch-action none)', async () => {
  const { page, chiudi } = await apriPagina({ mobile: true });
  try {
    // il canvas della scena lo crea main.js, qui sostituito: se ne aggiunge uno nudo e si
    // guarda cosa gli tocca dalla regola generale
    const azione = await page.evaluate(() => {
      const c = document.createElement('canvas');
      document.body.appendChild(c);
      return getComputedStyle(c).touchAction;
    });
    assert.equal(azione, 'none', 'un pinch sul canvas farebbe zoom alla pagina invece di girare la camera');
  } finally { await chiudi(); }
});

test('senza JavaScript la copertina dice perche\' la demo non parte, e il bottone morto sparisce', async () => {
  // Prima (fino al 2026-09-19) senza JavaScript la copertina si vedeva intera con un bottone
  // che non faceva niente: nessun messaggio. Qui la pagina si apre con JavaScript spento.
  const { page, chiudi } = await apriPagina({ javascript: false });
  try {
    assert.equal(await page.isVisible('#welcome-start-button'), false, 'il bottone morto resta visibile');
    assert.equal(await page.isVisible('.welcome-noscript'), true, 'manca l\'avviso');
    const testo = (await page.textContent('.welcome-noscript'))?.trim() ?? '';
    assert.match(testo, /JavaScript/);
    assert.equal(await page.isVisible('a.welcome-home-link'), true, 'senza JavaScript deve restare una via d\'uscita');
  } finally { await chiudi(); }
});
