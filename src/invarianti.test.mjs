// Le relazioni fra valori che si annullano in silenzio.
//
// Tutti i bug trovati sulla demo fino al 2026-09-19 sono della stessa famiglia: un valore
// che ne annulla un altro senza che nessuno se ne accorga. Un cursore che sovrascrive una
// costante appena parte la scena, un tetto che taglia ogni aumento, un ritardo che si mangia
// un'animazione, un renderOrder che non viene nemmeno confrontato. Queste prove non fissano
// numeri: verificano che i valori stiano nella relazione giusta fra loro. Sono le uniche,
// insieme a audio-contesto-unico e importmap, a cui e' concesso leggere il sorgente: cio' che
// controllano lo puo' dire solo il sorgente, perche' vale per TUTTI i moduli insieme.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
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
  // restare i piu' alti, cupola del cielo compresa (2026-09-18). Chi domani aggiunge un
  // pannello con un numero grosso se ne accorge qui invece che dal sito.
  const altri = renderOrderDelProgetto().filter((x) => x.valore !== CHARACTER_BUBBLE_RENDER_ORDER);
  assert.ok(altri.length > 5, 'la scansione non ha trovato i renderOrder del progetto');
  const massimo = altri.reduce((a, b) => (b.valore > a.valore ? b : a));
  assert.ok(
    CHARACTER_BUBBLE_RENDER_ORDER > massimo.valore,
    `${massimo.file} disegna a ${massimo.valore}, sopra i cartelli a ${CHARACTER_BUBBLE_RENDER_ORDER}`
  );
});

const alpha = (stile) => Number(stile.match(/rgba\([^)]*,\s*([\d.]+)\)/)[1]);

test('il cursore "Sfondo cartelli" parte dove dicono le costanti', () => {
  // Il 2026-09-18 non bastava mettere a 1 le costanti di speech-bubbles.js: il pannello dei
  // controlli chiama setCharacterBubbleBackgroundOpacity() con il valore del cursore appena
  // parte la scena, e quell'override vince su tutto. Il cursore partiva da 2.88 su 3, cioe'
  // 0.96: lo sfondo restava trasparente e la costante non arrivava mai a schermo.
  const main = leggi('./main.js');
  const pagina = leggi('../index.html');
  const divisore = Number(main.match(/CHARACTER_BUBBLE_BG_OPACITY_RANGE_MULTIPLIER = (\d+)/)[1]);
  const cursore = pagina.match(/id="character-bubble-bg-opacity"[^>]*value="([\d.]+)"/);
  assert.ok(cursore, 'cursore "Sfondo cartelli" non trovato in index.html');
  const applicato = Number(cursore[1]) / divisore;
  assert.equal(applicato, alpha(GREETER_BUBBLE_PANEL_FILL_STYLE));
  // e il numero mostrato accanto al cursore dice la stessa cosa
  const mostrato = Number(pagina.match(/id="character-bubble-bg-opacity-val">([\d.]+)</)[1]);
  assert.equal(mostrato, Number(cursore[1]));
});
