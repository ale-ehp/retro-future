// I cartelli dei personaggi devono uscire opachi appena si apre la demo.
//
// Il 2026-09-18 non bastava mettere a 1 le costanti di speech-bubbles.js: il pannello dei
// controlli chiama setCharacterBubbleBackgroundOpacity() con il valore del cursore "Sfondo
// cartelli" appena parte la scena, e quell'override vince su tutto
// (characterBubblePanelFillStyle guarda prima l'override). Il cursore partiva da 2.88 su 3,
// cioe' 0.96: lo sfondo restava trasparente e la modifica alle costanti non arrivava mai a
// schermo. Qui si controlla che i due valori dicano la stessa cosa.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  CROWD_BUBBLE_PANEL_FILL_STYLE,
  GREETER_BUBBLE_PANEL_FILL_STYLE,
  CROWD_BUBBLE_MAX_OPACITY,
  GREETER_BUBBLE_MAX_OPACITY,
} from './character/speech-bubbles.js';

const pagina = readFileSync(new URL('./../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('./main.js', import.meta.url), 'utf8');

const alpha = (stile) => Number(stile.match(/rgba\([^)]*,\s*([\d.]+)\)/)[1]);

test('le costanti dei cartelli dicono opaco', () => {
  assert.equal(alpha(CROWD_BUBBLE_PANEL_FILL_STYLE), 1);
  assert.equal(alpha(GREETER_BUBBLE_PANEL_FILL_STYLE), 1);
  assert.equal(CROWD_BUBBLE_MAX_OPACITY, 1);
  assert.equal(GREETER_BUBBLE_MAX_OPACITY, 1);
});

test('il cursore "Sfondo cartelli" parte dove dicono le costanti', () => {
  const divisore = Number(main.match(/CHARACTER_BUBBLE_BG_OPACITY_RANGE_MULTIPLIER = (\d+)/)[1]);
  const cursore = pagina.match(/id="character-bubble-bg-opacity"[^>]*value="([\d.]+)"/);
  assert.ok(cursore, 'cursore "Sfondo cartelli" non trovato in index.html');
  const applicato = Number(cursore[1]) / divisore;
  // e' questo il valore che il pannello passa a setCharacterBubbleBackgroundOpacity()
  assert.equal(applicato, alpha(GREETER_BUBBLE_PANEL_FILL_STYLE));
});

test('anche il numero mostrato accanto al cursore segue', () => {
  const mostrato = Number(pagina.match(/id="character-bubble-bg-opacity-val">([\d.]+)</)[1]);
  const cursore = Number(pagina.match(/id="character-bubble-bg-opacity"[^>]*value="([\d.]+)"/)[1]);
  assert.equal(mostrato, cursore);
});
