// Le relazioni fra valori che si annullano in silenzio.
//
// Tutti i bug trovati sulla demo fino al 2026-09-19 sono della stessa famiglia: un valore
// che ne annulla un altro senza che nessuno se ne accorga. Un cursore che sovrascrive una
// costante appena parte la scena, un tetto che taglia ogni aumento, un ritardo che si mangia
// un'animazione, un renderOrder che non viene nemmeno confrontato, un valore fuori dal passo
// che il browser corregge da solo. Queste prove non fissano numeri: verificano che i valori
// stiano nella relazione giusta fra loro. Sono le uniche, insieme a audio-contesto-unico,
// importmap e ordine-boot-frame, a cui e' concesso leggere il sorgente: cio' che controllano
// lo puo' dire solo il sorgente, perche' vale per TUTTI i moduli insieme.
//
// Ogni relazione ha accanto il bug che l'ha resa necessaria, con la data.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import * as personaggi from './character/characters.js';
import { CHARACTER_BUBBLE_BG_OPACITY_RANGE_MULTIPLIER } from './config/costanti.js';
import { tronRunnerCrowdLedEmissiveIntensity } from './character/runner-crowd-leds.js';
import {
  CHARACTER_BUBBLE_RENDER_ORDER,
  GREETER_BUBBLE_PANEL_FILL_STYLE,
} from './character/speech-bubbles.js';

const radice = new URL('.', import.meta.url).pathname;
const leggi = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');

function tuttiIModuli(dir, out = []) {
  for (const voce of readdirSync(dir)) {
    const percorso = join(dir, voce);
    if (statSync(percorso).isDirectory()) tuttiIModuli(percorso, out);
    else if (voce.endsWith('.js') && !voce.endsWith('.test.mjs')) out.push(percorso);
  }
  return out;
}

/** Il numero assegnato a `nome` in un sorgente (`const NOME = 12;`), o fallisce. */
function numero(testo, nome, dove) {
  const m = testo.match(new RegExp(`${nome}\\s*=\\s*(-?\\d+(?:\\.\\d+)?)`));
  assert.ok(m, `${nome} non trovato in ${dove}`);
  return Number(m[1]);
}

/** Un attributo numerico di un elemento del markup, per id. */
function attributoCursore(pagina, id, attributo) {
  const m = pagina.match(new RegExp(`id="${id}"[^>]*\\b${attributo}="([-\\d.]+)"`));
  assert.ok(m, `cursore ${id} senza ${attributo} in index.html`);
  return Number(m[1]);
}

// ---------- 1. Nessun renderOrder sopra i cartelli dei personaggi (2026-09-18) ----------

/** Ogni renderOrder scritto come numero nel progetto, con il file in cui sta. */
function renderOrderDelProgetto() {
  const trovati = [];
  for (const file of tuttiIModuli(radice)) {
    const testo = readFileSync(file, 'utf8');
    for (const m of testo.matchAll(/renderOrder\s*=\s*(\d+)/g)) {
      trovati.push({ file: file.slice(radice.length), valore: Number(m[1]) });
    }
    for (const m of testo.matchAll(/_RENDER_ORDER\s*=\s*(\d+)/g)) {
      trovati.push({ file: file.slice(radice.length), valore: Number(m[1]) });
    }
  }
  return trovati;
}

test('nessun renderOrder del progetto sta davanti ai cartelli dei personaggi', () => {
  // In three.js decide renderOrder: piu' alto = disegnato dopo = sopra. I cartelli devono
  // restare i piu' alti, cupola del cielo compresa. Chi domani aggiunge un pannello con un
  // numero grosso se ne accorge qui invece che dal sito. (Che il numero stia sul GRUPPO e
  // non solo sull'oggetto lo verifica character/cartelli-scena.test.mjs nella scena.)
  const altri = renderOrderDelProgetto().filter((x) => x.valore !== CHARACTER_BUBBLE_RENDER_ORDER);
  assert.ok(altri.length > 5, 'la scansione non ha trovato i renderOrder del progetto');
  const massimo = altri.reduce((a, b) => (b.valore > a.valore ? b : a));
  assert.ok(
    CHARACTER_BUBBLE_RENDER_ORDER > massimo.valore,
    `${massimo.file} disegna a ${massimo.valore}, sopra i cartelli a ${CHARACTER_BUBBLE_RENDER_ORDER}`
  );
});

// ---------- 2. I cursori che scrivono su una costante partono dalla costante (2026-09-18) ----------

const alpha = (stile) => Number(stile.match(/rgba\([^)]*,\s*([\d.]+)\)/)[1]);

test('il cursore "Sfondo cartelli" parte dove dicono le costanti', () => {
  // Non bastava mettere a 1 le costanti di speech-bubbles.js: il pannello dei controlli
  // chiama setCharacterBubbleBackgroundOpacity() con il valore del cursore appena parte la
  // scena, e quell'override vince su tutto. Il cursore partiva da 2.88 su 3, cioe' 0.96: lo
  // sfondo restava trasparente e la costante non arrivava mai a schermo.
  const pagina = leggi('../index.html');
  const applicato = attributoCursore(pagina, 'character-bubble-bg-opacity', 'value') / CHARACTER_BUBBLE_BG_OPACITY_RANGE_MULTIPLIER;
  assert.equal(applicato, alpha(GREETER_BUBBLE_PANEL_FILL_STYLE));
  // e il numero mostrato accanto al cursore dice la stessa cosa
  const mostrato = Number(pagina.match(/id="character-bubble-bg-opacity-val">([\d.]+)</)[1]);
  assert.equal(mostrato, attributoCursore(pagina, 'character-bubble-bg-opacity', 'value'));
});

// ---------- 3. Nessun tetto sotto il valore che deve lasciar passare (2026-09-19) ----------

// Il cursore della luminosita' del cielo arriva a 4.8 e il JSON canonico chiede 4.8, ma lo
// shader della cupola si ferma a SKY_BRIGHTNESS_SHADER_MAX = 2.4: la meta' alta del cursore
// cambia solo il colore di riferimento (skyDisplayColor), non la cupola. Trovato il
// 2026-09-19 scrivendo questa prova. Non e' stato corretto perche' correggerlo cambia la
// scena (o il cielo si fa piu' chiaro, o il colore di riferimento si abbassa) e la scelta
// spetta all'autore. Resta qui come eccezione nota: se i numeri cambiano, la prova lo dice.
// E la folla: con i cursori canonici (runner-led-brightness 3.5, runner-led-bloom 6, in
// boulevard-canonical-settings.json) tronRunnerCrowdLedEmissiveIntensity() darebbe 31 e
// viene tagliata a 15, il tetto del clamp. L'impronta del gate lo conferma a scena viva:
// base emissiva 15 su tutti i 60 materiali della folla, 24 sul fermo (15 x 1.6). Vuol dire
// che TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY oggi non conta: quando il 2026-09-19 il tetto
// e' passato da 12 a 15 "insieme all'intensita'", a far luce e' stato il tetto, non
// l'intensita'. Anche questa non si corregge qui (alzare il tetto o abbassare i cursori
// cambia quanto brillano i personaggi): eccezione nota, con i numeri.
const ECCEZIONI_NOTE = {
  'sky-brightness': { cursoreMax: 4.8, tettoShader: 2.4 },
  'runner-led': { brightness: 3.5, bloom: 6, tetto: 15 },
};

test('la luminosita\' del cielo: il tetto dello shader sta sotto il cursore, ed e\' un\'eccezione nota', () => {
  const pagina = leggi('../index.html');
  const cielo = leggi('./world/sky-dome.js');
  const cursoreMax = attributoCursore(pagina, 'sky-brightness', 'max');
  const tetto = numero(cielo, 'SKY_BRIGHTNESS_SHADER_MAX', 'sky-dome.js');
  const nota = ECCEZIONI_NOTE['sky-brightness'];
  if (tetto >= cursoreMax) {
    assert.fail(`la relazione e' rientrata (cursore ${cursoreMax}, tetto ${tetto}): togli l'eccezione nota qui sopra`);
  }
  assert.deepEqual({ cursoreMax, tettoShader: tetto }, nota,
    'cambiati i numeri dell\'eccezione: decidi se e\' ancora voluta e aggiorna ECCEZIONI_NOTE');
});

test('i LED della folla, con i cursori canonici, stanno contro il tetto: eccezione nota', () => {
  const canonico = JSON.parse(leggi('../boulevard-canonical-settings.json')).settings;
  const leds = leggi('./character/runner-crowd-leds.js');
  const tetto = Number(leds.match(/clamp\(TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY \* scale, 0, (\d+(?:\.\d+)?)\)/)?.[1]);
  assert.ok(Number.isFinite(tetto), 'il clamp dei LED non e\' piu\' dove stava: aggiorna la prova');
  const brightness = canonico['runner-led-brightness'];
  const bloom = canonico['runner-led-bloom'];
  const aRiposo = tronRunnerCrowdLedEmissiveIntensity({ ledBrightness: brightness, ledBloom: bloom });
  const nota = ECCEZIONI_NOTE['runner-led'];
  if (aRiposo < tetto) {
    assert.fail(`la relazione e' rientrata (a riposo ${aRiposo}, tetto ${tetto}): togli l'eccezione nota qui sopra`);
  }
  assert.deepEqual({ brightness, bloom, tetto }, nota,
    'cambiati i numeri dell\'eccezione: decidi se e\' ancora voluta e aggiorna ECCEZIONI_NOTE');
});

test('ogni tetto scritto come numero lascia spazio alla costante che taglia', () => {
  // Il caso del 2026-09-19: alzando TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY da 2.4 a 3 non
  // cambiava nulla, perche' clamp(INTENSITY * scale, 0, 12) ci sbatteva gia' contro. Qui si
  // cercano tutti i clamp della forma clamp(COSTANTE * x, 0, N) con COSTANTE esportata da
  // characters.js e si pretende che N lasci almeno il doppio della costante: alzarla del
  // 25% deve arrivare a schermo. (Che ci arrivi davvero lo prova luminosita.test.mjs.)
  const controllati = [];
  for (const file of tuttiIModuli(radice)) {
    const testo = readFileSync(file, 'utf8');
    for (const m of testo.matchAll(/clamp\(\s*([A-Z][A-Z0-9_]+)\s*\*\s*\w+\s*,\s*0\s*,\s*(\d+(?:\.\d+)?)\s*\)/g)) {
      const [, costante, tetto] = m;
      const valore = personaggi[costante];
      if (typeof valore !== 'number') continue;
      controllati.push(costante);
      assert.ok(Number(tetto) >= valore * 2,
        `${file.slice(radice.length)}: il tetto ${tetto} e' troppo vicino a ${costante} = ${valore}`);
    }
  }
  assert.ok(controllati.includes('TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY'), 'il clamp dei LED della folla non e\' stato trovato: la scansione e\' cieca');
});

test('il battito della musica ha spazio fino al suo moltiplicatore massimo', () => {
  // runner-beat-pulse.js fa clamp(base * multiplier, 0, N): la base piu' alta e' quella di
  // chi sta fermo (intensita' della folla per la sua maggiorazione) e il moltiplicatore
  // arriva a TRON_RUNNER_BEAT_PULSE_MAX_MULTIPLIER. Se N sta sotto il prodotto, il battito
  // si appiattisce sui personaggi piu' luminosi e non si vede.
  const battito = leggi('./character/runner-beat-pulse.js');
  const m = battito.match(/clamp\(base \* multiplier, 0, (\d+(?:\.\d+)?)\)/);
  assert.ok(m, 'il clamp del battito non e\' piu\' dove stava: aggiorna la prova');
  const tetto = Number(m[1]);
  const baseMassima = personaggi.TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY * personaggi.TRON_RUNNER_IDLE_CHARACTER_BRIGHTNESS;
  const serve = baseMassima * personaggi.TRON_RUNNER_BEAT_PULSE_MAX_MULTIPLIER;
  assert.ok(tetto >= serve, `il tetto ${tetto} sta sotto ${serve} (base ${baseMassima} x moltiplicatore ${personaggi.TRON_RUNNER_BEAT_PULSE_MAX_MULTIPLIER})`);
});

// ---------- 4. Nessun ritardo di comparsa si mangia l'animazione che nasconde (2026-09-18) ----------

test('il gruppo della folla non aspetta piu\' di un decimo del rez', () => {
  // Era 1000ms su un rez di 1400: la folla compariva gia' formata per tre quarti. L'attesa e'
  // passata a runner-reveal.js, che ritarda l'INIZIO invece di nascondere. Il comportamento
  // lo prova character/runner-reveal.test.mjs; qui la relazione fra i due numeri.
  const folla = leggi('./character/runner-crowd-runtime.js');
  const ritardo = numero(folla, 'TRON_RUNNER_CROWD_APPEAR_DELAY_MS', 'runner-crowd-runtime.js');
  const durata = personaggi.TRON_RUNNER_REVEAL_DURATION_MS;
  assert.ok(ritardo <= durata * 0.1, `il gruppo aspetta ${ritardo}ms su un rez di ${durata}ms: se ne mangia l'inizio`);
});

// ---------- 5. Nessun default di cursore fuori dal proprio passo (2026-09-19) ----------

test('ogni cursore del markup ha il default sul proprio passo', () => {
  // hex-offset valeva -2.64 con step 0.05 e hex-radius 50.4 con step 0.5 dalla v1.0: il
  // browser li correggeva a -2.65 e 50.5 senza dirlo. Lo vede anche controls/
  // control-defaults.test.mjs chiedendolo a Chromium; qui la stessa cosa senza browser,
  // cosi' si legge il nome del colpevole prima ancora di aprire la pagina.
  const pagina = leggi('../index.html');
  const fuoriPasso = [];
  for (const m of pagina.matchAll(/<input\b([^>]*\btype="range"[^>]*)>/g)) {
    const attrs = m[1];
    const id = /\bid="([^"]+)"/.exec(attrs)?.[1];
    const num = (n) => { const r = new RegExp(`\\b${n}="([^"]+)"`).exec(attrs)?.[1]; return r == null ? null : Number(r); };
    const min = num('min'); const step = num('step'); const value = num('value');
    if (!id || !Number.isFinite(step) || step <= 0 || !Number.isFinite(value) || !Number.isFinite(min)) continue;
    const passi = (value - min) / step;
    if (Math.abs(passi - Math.round(passi)) > 1e-6) fuoriPasso.push(`${id}: value ${value} non sta su min ${min} + k*${step}`);
  }
  assert.deepEqual(fuoriPasso, []);
});
