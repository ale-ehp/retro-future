import * as THREE from 'three';
import { retroFutureSignOpacity, retroFutureSignScale } from '../sign-opacity.js';
import { resolveTronRunnerRoundedCollider } from './character-collision.js';
import { TRON_RUNNER_CROWD_LINES } from './runner-crowd-lines.js';

// ---------- Speech-bubble rendering subsystem ----------
// World-space billboarded sprites that float above characters. Two updaters share one texture
// cache and one canvas-texture builder: the greeter welcome bubble (single sprite) and the crowd
// ambient bubbles (small pool of nearest talkers). The talk-trigger state machine lives in main.js;
// this module only RENDERS, reading member.talk* / greeter.bubble* and injected scene-graph state.
//
// Sprites are anchored to the character (body X/Z + head height), stay upright, and Y-axis billboard
// (yaw to face the camera) the same way the boundary //error panel does. They are NOT screen-space
// DOM overlays.

let deps = null;
export function initSpeechBubbles(injected) {
  deps = injected;
  installSpeechBubbleRuntimeCommands();
  scheduleCrowdBubbleTexturePrewarm();
}

// ---------- Greeter welcome speech bubble (3D world sprite, like the //error sign) ----------
const greeterBubbleWorldScratch = new THREE.Vector3();
const GREETER_BUBBLE_HEAD_GAP = 1.1;       // world units above the head
export const GREETER_BUBBLE_WORLD_HEIGHT = retroFutureSignScale(1.5); // sprite height in world units at sizeScale 1
const GREETER_BUBBLE_FADE_SEC = 0.5;       // quanto ci mette a sparire
// Comparire e' un'altra cosa: il cartello si monta dal basso (montaCartello) e deve diventare
// pieno mentre si apre, non insieme all'apertura. Con la stessa lentezza della sparizione
// l'effetto tornava a leggersi come dissolvenza (2026-09-18).
const GREETER_BUBBLE_ACCENSIONE_SEC = 0.12;
// Opachi per scelta (2026-09-18): il moltiplicatore globale di sign-opacity.js taglia al 70%
// e li faceva sembrare adesivi appiccicati sulla scena. Quello resta per i cartelloni della
// citta', le porte e l'avviso di confine: qui, sui cartelli dei personaggi, si legge e basta.
export const GREETER_BUBBLE_MAX_OPACITY = 1;
export const CROWD_BUBBLE_MAX_OPACITY = 1;
export const CROWD_BUBBLE_PANEL_FILL_STYLE = 'rgba(0,3,4,1)';
export const CROWD_BUBBLE_TEXT_FILL_STYLE = 'rgba(255,255,255,1)';
const CROWD_BUBBLE_TEXT_SHADOW_STYLE = 'rgba(123,255,255,0.88)';
export const GREETER_BUBBLE_PANEL_FILL_STYLE = 'rgba(0,3,4,1)';
const CHARACTER_BUBBLE_PANEL_RGB = Object.freeze([0, 3, 4]);
let greeterBubbleSprite = null;
let greeterBubbleLastMs = 0;
const greeterBubbleTextureCache = new Map();
let characterBubbleBackgroundOpacityOverride = null;
export const GREETER_BUBBLE_LOGO_EFFECT_ID = 'tron-orange';
export const GREETER_BUBBLE_LOGO_AI_ANIMATION_ENABLED = true;
export const GREETER_BUBBLE_LOGO_AV_FILL_ALPHA = 1;
export const GREETER_BUBBLE_LOGO_STUDIO_FILL_ALPHA = 1;
export const GREETER_BUBBLE_LOGO_AI_MAIN_MIN_OPACITY = 1;
export const GREETER_BUBBLE_LOGO_WORDMARK_FILL_STYLE = 'rgba(255,255,255,1)';
export const GREETER_BUBBLE_LOGO_WORDMARK_FONT_WEIGHT = 400;
export const GREETER_BUBBLE_LOGO_WORDMARK_OUTLINE_STYLE = 'rgba(0,16,20,0.82)';
export const GREETER_BUBBLE_LOGO_WORDMARK_OUTLINE_WIDTH_RATIO = 0.052;
export const GREETER_BUBBLE_LOGO_AI_IDLE_OFFSET_PX = 1.3;
export const GREETER_BUBBLE_LOGO_AI_GLITCH_SLICE_OPACITY = 1;
// Sopra qualunque altra cosa della scena, come uno z-index alto: chi parla si legge sempre,
// anche quando passa davanti al terminale contatti o ai cartelloni dei dipartimenti
// (2026-09-18). Deve restare piu' alto di OGNI altro renderOrder del progetto, cupola del
// cielo compresa (1000): src/cartelli-davanti.test.mjs li conta e fallisce se qualcuno
// aggiunge un pannello piu' in alto.
export const CHARACTER_BUBBLE_RENDER_ORDER = 2000;

export function isGreeterBubbleLogoLine(line) {
  return String(line ?? '').trim().toLowerCase().replace('/', '') === 'avstudio.ai';
}

function formatCharacterBubblePanelFill(alpha) {
  const safeAlpha = THREE.MathUtils.clamp(Number.isFinite(alpha) ? alpha : 1, 0, 1);
  return `rgba(${CHARACTER_BUBBLE_PANEL_RGB[0]},${CHARACTER_BUBBLE_PANEL_RGB[1]},${CHARACTER_BUBBLE_PANEL_RGB[2]},${Number(safeAlpha.toFixed(3))})`;
}

export function characterBubblePanelFillStyle(kind = 'crowd') {
  if (characterBubbleBackgroundOpacityOverride !== null) {
    return formatCharacterBubblePanelFill(characterBubbleBackgroundOpacityOverride);
  }
  return kind === 'greeter' ? GREETER_BUBBLE_PANEL_FILL_STYLE : CROWD_BUBBLE_PANEL_FILL_STYLE;
}

function clearGreeterBubbleTextureCache() {
  for (const texture of greeterBubbleTextureCache.values()) texture?.dispose?.();
  greeterBubbleTextureCache.clear();
}

export function characterBubbleBackgroundOpacityInspect() {
  return {
    command: 'setCartelliSfondoOpacity(0..1)',
    aliases: ['setCharacterBubbleBackgroundOpacity(0..1)', 'tronBubbleBackgroundOpacity(0..1)'],
    opacity: characterBubbleBackgroundOpacityOverride,
    crowdStyle: characterBubblePanelFillStyle('crowd'),
    greeterStyle: characterBubblePanelFillStyle('greeter'),
  };
}

export function setCharacterBubbleBackgroundOpacity(opacity) {
  const next = Number(opacity);
  if (!Number.isFinite(next)) {
    throw new TypeError('setCharacterBubbleBackgroundOpacity expects a number from 0 to 1');
  }
  characterBubbleBackgroundOpacityOverride = THREE.MathUtils.clamp(next, 0, 1);
  clearGreeterBubbleTextureCache();
  return characterBubbleBackgroundOpacityInspect();
}

export function resetCharacterBubbleBackgroundOpacity() {
  characterBubbleBackgroundOpacityOverride = null;
  clearGreeterBubbleTextureCache();
  return characterBubbleBackgroundOpacityInspect();
}

function installSpeechBubbleRuntimeCommands() {
  if (typeof window === 'undefined') return;
  window.setCharacterBubbleBackgroundOpacity = setCharacterBubbleBackgroundOpacity;
  window.setCartelliSfondoOpacity = setCharacterBubbleBackgroundOpacity;
  window.tronBubbleBackgroundOpacity = setCharacterBubbleBackgroundOpacity;
  window.resetCharacterBubbleBackgroundOpacity = resetCharacterBubbleBackgroundOpacity;
  window.characterBubbleBackgroundOpacityInspect = characterBubbleBackgroundOpacityInspect;
}

export function greeterBubbleLogoAnimationState(nowMs = 0) {
  const t = Math.max(0, nowMs) / 1000;
  const dashPhase = (t / 2.4) % 1;
  const sweepPhase = (t / 2.4) % 1;
  const burst = (Math.max(0, nowMs) % 2200) < 360 ? 1 : 0;
  const jitter = burst ? Math.sin(t * 91) : 0;
  const decay = burst ? 1 - ((Math.max(0, nowMs) % 2200) / 360) : 0;
  return {
    dashOffset: -98 * dashPhase,
    sweepPhase,
    aiCyanDx: -GREETER_BUBBLE_LOGO_AI_IDLE_OFFSET_PX + burst * (-5.2 + jitter * 1.6) * decay,
    aiRedDx: GREETER_BUBBLE_LOGO_AI_IDLE_OFFSET_PX + burst * (5.2 - jitter * 1.6) * decay,
    aiDy: burst ? Math.sin(t * 53) * 1.8 * decay : 0,
    aiOpacity: burst ? 0.92 : 0.78,
    aiMainOpacity: GREETER_BUBBLE_LOGO_AI_MAIN_MIN_OPACITY,
    aiSliceOpacity: burst ? GREETER_BUBBLE_LOGO_AI_GLITCH_SLICE_OPACITY : 0,
    aiSliceDx: burst ? Math.sin(t * 47) * 8 * decay : 0,
  };
}

function greeterBubbleTextFont(fontPx) {
  return `700 ${fontPx}px Menlo, Consolas, monospace`;
}

function greeterBubbleLogoFont(fontPx) {
  return `350 ${fontPx}px "Space Grotesk", "DM Sans", "Avenir Next", "Segoe UI", sans-serif`;
}

function greeterBubbleLogoWordmarkFont(fontPx) {
  return `${GREETER_BUBBLE_LOGO_WORDMARK_FONT_WEIGHT} ${fontPx}px "Space Grotesk", "DM Sans", "Avenir Next", "Segoe UI", sans-serif`;
}

function setGreeterBubbleLineFont(ctx, line, fontPx) {
  ctx.font = isGreeterBubbleLogoLine(line)
    ? greeterBubbleLogoFont(fontPx * 1.08)
    : greeterBubbleTextFont(fontPx);
}

function measureGreeterBubbleLogoLine(ctx, fontPx) {
  const logoFontPx = fontPx * 1.08;
  ctx.font = greeterBubbleLogoFont(logoFontPx);
  const avW = ctx.measureText('av').width;
  ctx.font = greeterBubbleLogoWordmarkFont(logoFontPx);
  return avW + ctx.measureText('/studio').width + ctx.measureText('.ai').width;
}

function measureGreeterBubbleLine(ctx, line, fontPx) {
  setGreeterBubbleLineFont(ctx, line, fontPx);
  if (isGreeterBubbleLogoLine(line)) {
    return measureGreeterBubbleLogoLine(ctx, fontPx);
  }
  return ctx.measureText(line).width;
}

function drawGreeterBubbleLogoLine(ctx, line, centerX, y, fontPx, nowMs = 0) {
  const logoFontPx = fontPx * 1.08;
  ctx.font = greeterBubbleLogoFont(logoFontPx);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const av = 'av';
  const studio = '/studio';
  const ai = '.ai';
  ctx.font = greeterBubbleLogoFont(logoFontPx);
  const avW = ctx.measureText(av).width;
  ctx.font = greeterBubbleLogoWordmarkFont(logoFontPx);
  const studioW = ctx.measureText(studio).width;
  const aiW = ctx.measureText(ai).width;
  const startX = centerX - (avW + studioW + aiW) / 2;
  const studioX = startX + avW;
  const aiX = studioX + studioW;
  const state = greeterBubbleLogoAnimationState(nowMs);

  ctx.font = greeterBubbleLogoFont(logoFontPx);

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#25F4EE';
  ctx.fillText(av, startX, y);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#ff7a18';
  ctx.fillText(av, startX, y);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = GREETER_BUBBLE_LOGO_AV_FILL_ALPHA;
  ctx.fillStyle = '#ff7a18';
  ctx.shadowColor = 'rgba(255,122,24,0.78)';
  ctx.shadowBlur = 12;
  ctx.fillText(av, startX, y);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,214,178,0.96)';
  ctx.lineWidth = Math.max(1.8, logoFontPx * 0.042);
  ctx.shadowColor = 'rgba(255,122,24,0.78)';
  ctx.shadowBlur = 14;
  ctx.strokeText(av, startX, y);
  ctx.restore();

  ctx.save();
  ctx.setLineDash([logoFontPx * 0.22, logoFontPx * 3.3]);
  ctx.lineDashOffset = state.dashOffset * (logoFontPx / 28);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ff7a18';
  ctx.lineWidth = Math.max(2.6, logoFontPx * 0.082);
  ctx.shadowColor = 'rgba(255,122,24,0.9)';
  ctx.shadowBlur = 18;
  ctx.strokeText(av, startX, y);
  ctx.restore();

  ctx.save();
  const sweepW = Math.max(5, logoFontPx * 0.16);
  const sweepX = startX - sweepW + state.sweepPhase * (avW + sweepW * 2);
  ctx.beginPath();
  ctx.rect(sweepX, y - logoFontPx * 0.82, sweepW, logoFontPx * 1.08);
  ctx.clip();
  ctx.strokeStyle = '#ffd2a3';
  ctx.lineWidth = Math.max(2.4, logoFontPx * 0.084);
  ctx.shadowColor = 'rgba(255,194,122,0.95)';
  ctx.shadowBlur = 20;
  ctx.strokeText(av, startX, y);
  ctx.restore();

  ctx.font = greeterBubbleLogoWordmarkFont(logoFontPx);

  ctx.save();
  ctx.strokeStyle = GREETER_BUBBLE_LOGO_WORDMARK_OUTLINE_STYLE;
  ctx.lineWidth = Math.max(2.2, logoFontPx * GREETER_BUBBLE_LOGO_WORDMARK_OUTLINE_WIDTH_RATIO);
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,16,20,0.64)';
  ctx.shadowBlur = 10;
  ctx.strokeText(studio, studioX, y);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = GREETER_BUBBLE_LOGO_STUDIO_FILL_ALPHA;
  ctx.fillStyle = GREETER_BUBBLE_LOGO_WORDMARK_FILL_STYLE;
  ctx.shadowColor = 'rgba(255,255,255,0.34)';
  ctx.shadowBlur = 8;
  ctx.fillText(studio, studioX, y);
  ctx.restore();

  // Same .ai logic as the site logo: cyan/red anaglyph under a readable white base,
  // with clipped slices that jump during the glitch burst.
  ctx.save();
  ctx.globalAlpha = state.aiOpacity;
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#25F4EE';
  ctx.fillText(ai, aiX + state.aiCyanDx, y + state.aiDy);
  ctx.fillStyle = '#FE2C55';
  ctx.fillText(ai, aiX + state.aiRedDx, y - state.aiDy);
  ctx.restore();

  if (state.aiSliceOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = state.aiSliceOpacity;
    ctx.beginPath();
    ctx.rect(aiX - 7, y - logoFontPx * 0.78, aiW + 16, logoFontPx * 0.32);
    ctx.clip();
    ctx.fillStyle = '#25F4EE';
    ctx.fillText(ai, aiX + state.aiSliceDx, y);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = state.aiSliceOpacity;
    ctx.beginPath();
    ctx.rect(aiX - 7, y - logoFontPx * 0.22, aiW + 16, logoFontPx * 0.42);
    ctx.clip();
    ctx.fillStyle = '#FE2C55';
    ctx.fillText(ai, aiX - state.aiSliceDx * 0.82, y);
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = GREETER_BUBBLE_LOGO_WORDMARK_OUTLINE_STYLE;
  ctx.lineWidth = Math.max(2.2, logoFontPx * GREETER_BUBBLE_LOGO_WORDMARK_OUTLINE_WIDTH_RATIO);
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,16,20,0.68)';
  ctx.shadowBlur = 10;
  ctx.strokeText(ai, aiX, y);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = state.aiMainOpacity;
  ctx.fillStyle = GREETER_BUBBLE_LOGO_WORDMARK_FILL_STYLE;
  ctx.shadowColor = 'rgba(255,255,255,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(ai, aiX, y);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.3 + Math.abs(Math.sin(Math.max(0, nowMs) / 180)) * 0.14;
  ctx.strokeStyle = 'rgba(255,122,24,0.5)';
  ctx.lineWidth = Math.max(0.8, logoFontPx * 0.014);
  ctx.font = greeterBubbleLogoFont(logoFontPx);
  ctx.strokeText(av, startX, y);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.16 + Math.abs(Math.sin(Math.max(0, nowMs) / 180)) * 0.05;
  ctx.strokeStyle = 'rgba(255,255,255,0.62)';
  ctx.lineWidth = Math.max(0.55, logoFontPx * 0.008);
  ctx.font = greeterBubbleLogoWordmarkFont(logoFontPx);
  ctx.strokeText(ai, aiX, y);
  ctx.restore();

  ctx.textAlign = 'center';
}

function drawGreeterBubbleCanvas(canvas, ctx, lines, nowMs = 0, panelFillStyle = CROWD_BUBBLE_PANEL_FILL_STYLE, metrics = null) {
  // Every absolute size is expressed against the full-size canvas, so a smaller
  // canvas (crowd bubbles) draws the exact same layout at a lower resolution.
  const s = canvas.width / GREETER_BUBBLE_CANVAS_WIDTH;
  const pad = 30 * s;
  const maxTextW = canvas.width - pad * 2 - 120 * s;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // The font fit is a measureText loop (up to ~28 passes over every line) and the
  // panel width another measure pass: both depend only on the text and the canvas,
  // so solve them once per texture instead of on every animated redraw.
  let fontPx = metrics?.fontPx || 0;
  let textW = metrics?.textW || 0;
  if (!fontPx) {
    fontPx = 84 * s;
    const widest = () => {
      return Math.max(...lines.map((line) => measureGreeterBubbleLine(ctx, line, fontPx)));
    };
    while (fontPx > 28 * s && widest() > maxTextW) fontPx -= 2 * s;
    textW = Math.max(...lines.map((line) => measureGreeterBubbleLine(ctx, line, fontPx)));
    if (metrics) {
      metrics.fontPx = fontPx;
      metrics.textW = textW;
    }
  }
  const lineH = fontPx * 1.24;
  const blockH = lineH * lines.length;
  const panelH = blockH + 70 * s;
  const panelW = Math.min(canvas.width - pad, textW + 170 * s);
  const px = (canvas.width - panelW) / 2;
  const py = (canvas.height - panelH) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Pannello in stile terminale, sul modello dei cartelloni che delimitano il boulevard
  // (src/world/city-boards.js): angoli squadrati e doppio bordo netto invece di un
  // rettangolo stondato con l'alone largo, che faceva fumetto da cartone (2026-09-18).
  ctx.save();
  ctx.shadowColor = 'rgba(98,247,255,0.35)';
  ctx.shadowBlur = 10 * s;
  ctx.fillStyle = panelFillStyle;
  ctx.fillRect(px, py, panelW, panelH);
  ctx.restore();
  ctx.strokeStyle = 'rgba(143,252,255,0.92)';
  ctx.lineWidth = 4 * s;
  ctx.strokeRect(px, py, panelW, panelH);
  ctx.strokeStyle = 'rgba(98,247,255,0.34)';
  ctx.lineWidth = 2 * s;
  ctx.strokeRect(px + 7 * s, py + 7 * s, panelW - 14 * s, panelH - 14 * s);
  ctx.shadowBlur = 0;
  // text
  ctx.fillStyle = CROWD_BUBBLE_TEXT_FILL_STYLE;
  ctx.shadowColor = CROWD_BUBBLE_TEXT_SHADOW_STYLE;
  ctx.shadowBlur = 10 * s;
  const cy = canvas.height / 2 - blockH / 2 + lineH / 2;
  lines.forEach((line, i) => {
    const y = cy + i * lineH;
    if (isGreeterBubbleLogoLine(line)) {
      drawGreeterBubbleLogoLine(ctx, line, canvas.width / 2, y, fontPx, nowMs);
      return;
    }
    ctx.font = greeterBubbleTextFont(fontPx);
    ctx.fillText(line, canvas.width / 2, y);
  });
}

const GREETER_BUBBLE_CANVAS_WIDTH = 896;
const GREETER_BUBBLE_CANVAS_HEIGHT = 360;
// Crowd lines are short, logo-free and read from a few metres away: half the
// canvas is indistinguishable there and cuts raster + upload to a quarter, which
// is what makes a cache large enough to hold every line affordable (below).
const CROWD_BUBBLE_CANVAS_SCALE = 0.5;
// The logo line animates, so its texture is re-uploaded continuously: redrawing
// it at the display refresh rate re-rasterized a 896x360 canvas with three
// shadowBlur passes 60 times a second. 15Hz is plenty for a shimmer and a glitch.
const GREETER_BUBBLE_ANIMATION_INTERVAL_MS = 1000 / 15;

function makeGreeterBubbleTexture(html, options = {}) {
  const lines = String(html).split(/<br\s*\/?>/i).map((s) => s.trim());
  const animated = lines.some(isGreeterBubbleLogoLine);
  // The logo path draws with its own absolute offsets, so it always gets the
  // full-size canvas; only plain text lines are rendered at the reduced scale.
  const scale = animated || options.greeter ? 1 : CROWD_BUBBLE_CANVAS_SCALE;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(GREETER_BUBBLE_CANVAS_WIDTH * scale);
  canvas.height = Math.round(GREETER_BUBBLE_CANVAS_HEIGHT * scale);
  const ctx = canvas.getContext('2d');
  const panelFillStyle = characterBubblePanelFillStyle(options.greeter ? 'greeter' : 'crowd');
  const metrics = { fontPx: 0, textW: 0 };
  drawGreeterBubbleCanvas(canvas, ctx, lines, performance.now(), panelFillStyle, metrics);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, deps.getRenderer().capabilities.getMaxAnisotropy?.() || 1);
  if (animated) {
    // Re-uploaded on every redraw: regenerating the mip chain each time is pure
    // driver work for a bubble that is only ever seen large and up close.
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
  }
  texture.__aspect = canvas.width / canvas.height;
  texture.__animated = animated;
  texture.__lastDrawMs = -Infinity;
  texture.__draw = animated
    ? (nowMs) => drawGreeterBubbleCanvas(canvas, ctx, lines, nowMs, panelFillStyle, metrics)
    : null;
  return texture;
}

// LRU cap: visible bubbles re-fetch their texture every frame, so the (up to
// ~6) on-screen entries are always most-recently-used and never evicted. The cap
// now sits above the whole crowd line pool: at the reduced crowd canvas a
// resident texture is ~0.32MB, so holding every line costs a handful of MB and
// no line is ever re-rasterized mid-session (a cap of 12 against ~40 lines meant
// constant eviction, and each eviction bought back a synchronous raster+upload
// in the frame the next talker started speaking).
const GREETER_BUBBLE_TEXTURE_CACHE_MAX = 48;
let greeterBubbleTextureCacheNewestKey = '';

function getGreeterBubbleTexture(html, options = {}) {
  const cacheKey = `${options.greeter ? 'greeter' : 'crowd'}:${html}`;
  let tex = greeterBubbleTextureCache.get(cacheKey);
  if (tex) {
    // Skip the delete/set re-insert when this entry is already the newest one:
    // an on-screen bubble asks for the same texture on every single frame.
    if (cacheKey !== greeterBubbleTextureCacheNewestKey) {
      greeterBubbleTextureCache.delete(cacheKey);
      greeterBubbleTextureCache.set(cacheKey, tex);
      greeterBubbleTextureCacheNewestKey = cacheKey;
    }
    return tex;
  }
  tex = makeGreeterBubbleTexture(html, options);
  greeterBubbleTextureCache.set(cacheKey, tex);
  greeterBubbleTextureCacheNewestKey = cacheKey;
  while (greeterBubbleTextureCache.size > GREETER_BUBBLE_TEXTURE_CACHE_MAX) {
    const oldest = greeterBubbleTextureCache.entries().next().value;
    greeterBubbleTextureCache.delete(oldest[0]);
    oldest[1]?.dispose?.();
  }
  return tex;
}

// Rasterizing a line the first time a member says it lands a canvas draw plus a
// texture upload inside that frame, and walking through the city several members
// can trigger in the same frame. The pool is known up front, so build the
// textures one per idle slot instead and let every first bubble be a cache hit.
let crowdBubbleTexturePrewarmIndex = 0;
function scheduleCrowdBubbleTexturePrewarm() {
  if (typeof window === 'undefined') return;
  const idle = window.requestIdleCallback
    ? (fn) => window.requestIdleCallback(fn, { timeout: 2000 })
    : (fn) => window.setTimeout(fn, 200);
  const step = () => {
    if (crowdBubbleTexturePrewarmIndex >= TRON_RUNNER_CROWD_LINES.length) return;
    const line = TRON_RUNNER_CROWD_LINES[crowdBubbleTexturePrewarmIndex];
    crowdBubbleTexturePrewarmIndex += 1;
    try {
      // Rasterizing the canvas is only half of it: the first frame that shows
      // the bubble would still pay the GPU upload. initTexture does it now.
      const texture = getGreeterBubbleTexture(line);
      deps.getRenderer()?.initTexture?.(texture);
    } catch {
      // A prewarm is best effort: a failure here must never break the scene.
    }
    idle(step);
  };
  idle(step);
}

function ensureGreeterBubbleSprite() {
  if (greeterBubbleSprite) return greeterBubbleSprite;
  // Plane mesh (not a Sprite): a Sprite is a spherical billboard that pitches to face the
  // camera, so looking up/down tilted it. This Y-axis billboards (yaw to face the camera) and
  // stays perfectly vertical no matter the camera pitch.
  greeterBubbleSprite = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      // depthTest acceso di proposito (2026-09-18): chi parla deve stare DAVANTI al proprio
      // cartello. I personaggi sono opachi e scrivono nel depth buffer, quindi lo coprono;
      // i pannelli della citta' hanno depthWrite: false, non lasciano profondita' e percio'
      // continuano a non poterlo nascondere. Con depthTest: false il cartello passava sopra
      // anche al personaggio.
      depthTest: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    })
  );
  greeterBubbleSprite.visible = false;
  greeterBubbleSprite.renderOrder = CHARACTER_BUBBLE_RENDER_ORDER;
  greeterBubbleSprite.frustumCulled = false;
  cartelliDavantiATutto().add(greeterBubbleSprite);
  return greeterBubbleSprite;
}

export function updateGreeterSpeechBubble() {
  const greeter = deps.getCrowd()[deps.GREETER_INDEX];
  const sprite = ensureGreeterBubbleSprite();
  const nowMs = performance.now();
  const fadeDt = greeterBubbleLastMs ? Math.min(0.1, (nowMs - greeterBubbleLastMs) / 1000) : 0;
  greeterBubbleLastMs = nowMs;
  // Decide whether the bubble should be shown: proximity messages follow bubbleInRange,
  // timed messages follow bubbleUntil. Opacity then eases toward that over GREETER_BUBBLE_FADE_SEC.
  let show = false;
  if (greeter && deps.getCrowdGroup().visible && deps.isReady() && greeter.bubbleText) {
    show = greeter.bubbleProximity ? Boolean(greeter.bubbleInRange) : (greeter.bubbleUntil && nowMs < greeter.bubbleUntil);
  }
  const target = show ? GREETER_BUBBLE_MAX_OPACITY : 0;
  const durata = target > 0 ? GREETER_BUBBLE_ACCENSIONE_SEC : GREETER_BUBBLE_FADE_SEC;
  const stepOp = fadeDt > 0
    ? (fadeDt / durata) * GREETER_BUBBLE_MAX_OPACITY
    : target;
  let op = sprite.material.opacity ?? 0;
  if (op < target) op = Math.min(target, op + stepOp);
  else if (op > target) op = Math.max(target, op - stepOp);
  sprite.material.opacity = op;
  if (op <= 0.001 || !greeter || !greeter.bubbleText) { sprite.visible = false; return; }
  const tex = getGreeterBubbleTexture(greeter.bubbleText, { greeter: true });
  if (tex.__animated && tex.__draw && nowMs - tex.__lastDrawMs >= GREETER_BUBBLE_ANIMATION_INTERVAL_MS) {
    tex.__lastDrawMs = nowMs;
    tex.__draw(nowMs);
    tex.needsUpdate = true;
  }
  if (sprite.material.map !== tex) { sprite.material.map = tex; sprite.material.needsUpdate = true; }
  // Anchor purely to the body (group world position) at a constant height above the head.
  // No head bone: the head yaws to track the player and bobs with the animation, which made the
  // bubble drift as you looked around. This keeps it dead fixed relative to the character.
  greeter.group.getWorldPosition(greeterBubbleWorldScratch);
  greeterBubbleWorldScratch.y += deps.TARGET_HEIGHT * greeter.group.scale.y + GREETER_BUBBLE_HEAD_GAP;
  {
    // fuori dai muri e dai pannelli prima di appoggiarlo
    const hGia = GREETER_BUBBLE_WORLD_HEIGHT * (greeter.bubbleSizeScale || 1);
    scansaOstacoli(greeterBubbleWorldScratch, hGia * (getGreeterBubbleTexture(greeter.bubbleText, { greeter: true }).__aspect || 2), hGia);
  }
  sprite.position.copy(greeterBubbleWorldScratch);
  // Y-only billboard: yaw to face the camera horizontally, stay upright (no pitch/roll tilt).
  sprite.rotation.set(0, Math.atan2(deps.getCamera().position.x - sprite.position.x, deps.getCamera().position.z - sprite.position.z), 0);
  const h = GREETER_BUBBLE_WORLD_HEIGHT * (greeter.bubbleSizeScale || 1);
  const aspect = tex.__aspect || 2;
  // L'apertura va a orologio, non al passo della dissolvenza: un frame lungo (la prima
  // generazione della texture ne fa uno) la faceva finire in 30ms, cioe' invisibile.
  if (!sprite.visible) sprite.userData.apertaDa = nowMs;
  montaCartello(sprite, greeterBubbleWorldScratch.y, h * aspect, h, puntoApertura(nowMs, sprite.userData.apertaDa), op);
  sprite.visible = true;
}

// ---------- I cartelli non entrano dentro le cose ----------
//
// Un cartello sta sopra la testa di chi parla e guarda la camera: quando il personaggio
// cammina rasente un palazzo o passa davanti al terminale contatti, il pannello finiva
// dentro il muro e si vedeva mezzo mangiato (2026-09-19). Qui viene spinto fuori.
//
// Due tipi di ostacolo, trattati diversamente perche' sono fatti diversamente:
//   - i palazzi hanno gia' i loro collisori a pianta (x, z, semiampiezze, smusso), gli stessi
//     che usano i personaggi per non attraversare i muri: si riusa quel risolutore;
//   - i pannelli (terminale, cartelloni dei reparti) sono superfici sospese, senza pianta
//     utile: si prende il loro ingombro in 3D e si scosta il cartello verso la camera, che
//     e' la direzione in cui resta leggibile.

const scatolaOstacolo = new THREE.Box3();
const puntoScansato = new THREE.Vector3();
const versoCamera = new THREE.Vector3();
const margineOstacolo = new THREE.Vector3();   // riusato: questa funzione gira a ogni frame
let ostacoliSospesi = null;

/** Gli ingombri dei pannelli sospesi, presi una volta sola: non si muovono. */
function ingombriPannelli() {
  if (ostacoliSospesi) return ostacoliSospesi;
  ostacoliSospesi = [];
  const scena = deps.getScene?.();
  if (!scena) return ostacoliSospesi;
  scena.traverse((oggetto) => {
    if (!oggetto.isGroup) return;
    const nome = oggetto.name || '';
    if (!/^(contact-terminal|city-department-board|city-role-board)/.test(nome)) return;
    const scatola = new THREE.Box3().setFromObject(oggetto);
    if (scatola.isEmpty()) return;
    ostacoliSospesi.push(scatola);
  });
  return ostacoliSospesi;
}

/** Ricomincia a cercare i pannelli: serve se la scena viene ricostruita. */
export function dimenticaIngombriCartelli() {
  ostacoliSospesi = null;
}

/**
 * Sposta `posizione` in modo che un cartello largo `larghezza` e alto `altezza` non finisca
 * dentro un palazzo o dentro un pannello. Torna true se ha dovuto spostarlo.
 */
export function scansaOstacoli(posizione, larghezza, altezza) {
  let spostato = false;
  const mezzaL = larghezza / 2;
  const mezzaA = altezza / 2;

  const palazzi = deps.getColliderRecords?.() || [];
  for (const record of palazzi) {
    if (!record?.collider) continue;
    puntoScansato.copy(posizione);
    if (resolveTronRunnerRoundedCollider(puntoScansato, record.collider, mezzaL)) {
      posizione.x = puntoScansato.x;
      posizione.z = puntoScansato.z;
      spostato = true;
    }
  }

  const camera = deps.getCamera?.();
  if (!camera) return spostato;
  for (const scatola of ingombriPannelli()) {
    margineOstacolo.set(mezzaL, mezzaA, mezzaL);
    scatolaOstacolo.copy(scatola).expandByVector(margineOstacolo);
    if (!scatolaOstacolo.containsPoint(posizione)) continue;
    // fuori verso la camera, un passo per volta: e' la direzione in cui il cartello si legge
    versoCamera.copy(camera.position).sub(posizione);
    versoCamera.y = 0;
    if (versoCamera.lengthSq() < 1e-6) continue;
    versoCamera.normalize();
    for (let passo = 0; passo < 24 && scatolaOstacolo.containsPoint(posizione); passo += 1) {
      posizione.addScaledVector(versoCamera, mezzaL * 0.5);
      spostato = true;
    }
  }
  return spostato;
}

// I cartelli non compaiono: si aprono dal basso verso l'alto, come un pannello che si monta
// (chiesto il 2026-09-18, prima era un popup). Il bordo inferiore resta fermo e l'altezza
// cresce fino alla misura piena; l'opacita' arriva al massimo molto prima della fine, cosi'
// si legge "costruzione" e non "dissolvenza".
const APPARIZIONE_MS = 420;                // quanto dura l'apertura, a orologio
const APPARIZIONE_ESPONENTE = 3;           // quanto l'apertura rallenta in chiusura
const APPARIZIONE_OPACITA_ANTICIPO = 2.4;  // il pieno di opacita' a ~40% dell'apertura

/** A che punto sta l'apertura, in base a quanto tempo e' passato da quando e' partita. */
export function puntoApertura(nowMs, inizioMs) {
  if (!Number.isFinite(inizioMs)) return 1;
  return THREE.MathUtils.clamp((nowMs - inizioMs) / APPARIZIONE_MS, 0, 1);
}

/** Il cartello montato all'altezza giusta per il punto `t` (0..1) della sua apparizione. */
export function montaCartello(sprite, baseY, larghezza, altezza, t, opacitaPiena) {
  const avanzamento = THREE.MathUtils.clamp(t, 0, 1);
  const aperto = 1 - (1 - avanzamento) ** APPARIZIONE_ESPONENTE;   // parte svelto, si posa
  const altezzaOra = Math.max(altezza * aperto, 0.0001);
  sprite.scale.set(larghezza, altezzaOra, 1);
  // il bordo di sotto non si muove: cresce solo verso l'alto
  sprite.position.y = baseY - altezza / 2 + altezzaOra / 2;
  sprite.material.opacity = Math.min(1, avanzamento * APPARIZIONE_OPACITA_ANTICIPO) * opacitaPiena;
}

// ---------- Crowd ambient speech bubbles (pool of world sprites, like the greeter's) ----------
const CROWD_BUBBLE_POOL_SIZE = 4; // only the nearest few talkers show at once (readability + perf)
const CROWD_BUBBLE_SIZE_SCALE = 1.5; // crowd bubbles 50% larger than the base bubble height
const crowdBubbleWorldScratch = new THREE.Vector3();
const orientamentoFermo = new THREE.Quaternion();   // riusati: questo giro e' a ogni frame
const orientamentoEuler = new THREE.Euler();
let crowdBubbleSprites = null;
const crowdBubbleTalkers = [];
// I cartelli vanno dentro un Group loro, e il renderOrder va messo SUL GRUPPO.
//
// three.js ordina prima per gruppo e poi per oggetto (in projectObject il renderOrder di un
// Group diventa il groupOrder di tutti i suoi figli, e painterSortStable confronta groupOrder
// per primo). I cartelloni dei dipartimenti e il terminale contatti vivono dentro Group con
// renderOrder 30 e 34; i cartelli stavano appesi alla scena, cioe' gruppo 0, e finivano
// disegnati prima: il loro renderOrder altissimo non veniva nemmeno messo a confronto, e i
// pannelli ci passavano sopra (2026-09-18, segnalato con due fotografie).
let contenitoreCartelli = null;
function cartelliDavantiATutto() {
  if (!contenitoreCartelli) {
    contenitoreCartelli = new THREE.Group();
    contenitoreCartelli.name = 'character-bubbles';
    contenitoreCartelli.renderOrder = CHARACTER_BUBBLE_RENDER_ORDER;
    contenitoreCartelli.frustumCulled = false;
    deps.getScene().add(contenitoreCartelli);
  }
  return contenitoreCartelli;
}

function ensureCrowdBubbleSprites() {
  if (crowdBubbleSprites) return crowdBubbleSprites;
  crowdBubbleSprites = [];
  for (let i = 0; i < CROWD_BUBBLE_POOL_SIZE; i += 1) {
    const sprite = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: true, toneMapped: false, side: THREE.DoubleSide })
    );
    sprite.visible = false;
    sprite.renderOrder = CHARACTER_BUBBLE_RENDER_ORDER;
    sprite.frustumCulled = false;
    cartelliDavantiATutto().add(sprite);
    crowdBubbleSprites.push(sprite);
  }
  return crowdBubbleSprites;
}
export function updateTronRunnerCrowdSpeechBubbles() {
  const sprites = ensureCrowdBubbleSprites();
  crowdBubbleTalkers.length = 0;
  const nowMs = performance.now();
  if (deps.getCrowdGroup().visible && deps.isReady()) {
    for (const member of deps.getCrowd()) {
      if (!member.talkText || nowMs >= member.talkUntil || !member.group.visible) continue;
      const dx = deps.getCamera().position.x - member.group.position.x;
      const dz = deps.getCamera().position.z - member.group.position.z;
      crowdBubbleTalkers.push({ member, distSq: dx * dx + dz * dz });
    }
    // The stationary idle character at civic 2 (same approach trigger / hysteresis as the crowd).
    if (deps.getIdleGroup().visible) {
      const idle = deps.getIdleTalk();
      deps.getIdleGroup().getWorldPosition(crowdBubbleWorldScratch);
      const dx = deps.getCamera().position.x - crowdBubbleWorldScratch.x;
      const dz = deps.getCamera().position.z - crowdBubbleWorldScratch.z;
      const idleDistSq = dx * dx + dz * dz;
      if (idle.talkArmed && idleDistSq <= deps.CROWD_TALK_RANGE * deps.CROWD_TALK_RANGE) {
        idle.talkText = idle.talkLines[0];
        idle.talkStart = nowMs;
        idle.talkUntil = nowMs + deps.CROWD_TALK_DURATION_MS;
        idle.talkArmed = false;
      } else if (!idle.talkArmed && idleDistSq > deps.CROWD_TALK_REARM_RANGE * deps.CROWD_TALK_REARM_RANGE) {
        idle.talkArmed = true;
      }
      if (idle.talkText && nowMs < idle.talkUntil) crowdBubbleTalkers.push({ member: idle, distSq: idleDistSq });
    }
    crowdBubbleTalkers.sort((a, b) => a.distSq - b.distSq);
  }
  for (let i = 0; i < sprites.length; i += 1) {
    const sprite = sprites[i];
    const entry = crowdBubbleTalkers[i];
    if (!entry) { sprite.visible = false; sprite.material.opacity = 0; continue; }
    const member = entry.member;
    // Time-based fade: in over 0.3s, out over 0.4s before talkUntil.
    const fadeIn = (nowMs - member.talkStart) / 120;   // pieno mentre si apre, vedi montaCartello
    const fadeOut = (member.talkUntil - nowMs) / 400;
    const opacity = THREE.MathUtils.clamp(Math.min(fadeIn, fadeOut, 1), 0, 1) * CROWD_BUBBLE_MAX_OPACITY;
    if (opacity <= 0.001) { sprite.visible = false; sprite.material.opacity = 0; continue; }
    const tex = getGreeterBubbleTexture(member.talkText);
    if (sprite.material.map !== tex) { sprite.material.map = tex; sprite.material.needsUpdate = true; }
    member.group.getWorldPosition(crowdBubbleWorldScratch);
    crowdBubbleWorldScratch.y += deps.TARGET_HEIGHT * member.group.scale.y + GREETER_BUBBLE_HEAD_GAP;
    {
      const hGia = GREETER_BUBBLE_WORLD_HEIGHT * CROWD_BUBBLE_SIZE_SCALE;
      scansaOstacoli(crowdBubbleWorldScratch, hGia * (tex.__aspect || 2), hGia);
    }
    sprite.position.copy(crowdBubbleWorldScratch);
    // Chi sta in pausa tiene il cartello fermo (2026-09-19): non cammina e non si gira, e
    // un cartello che lo insegue mentre gli giri intorno faceva pubblicita' invece che una
    // persona appoggiata al muro. Il suo resta orientato come lui; quelli della folla, che
    // passano e vanno, continuano a voltarsi verso chi legge.
    if (member.group === deps.getIdleGroup?.()) {
      member.group.getWorldQuaternion(orientamentoFermo);
      orientamentoEuler.setFromQuaternion(orientamentoFermo, 'YXZ');
      sprite.rotation.set(0, orientamentoEuler.y, 0);
    } else {
      sprite.rotation.set(0, Math.atan2(deps.getCamera().position.x - sprite.position.x, deps.getCamera().position.z - sprite.position.z), 0);
    }
    const aspect = tex.__aspect || 2;
    const h = GREETER_BUBBLE_WORLD_HEIGHT * CROWD_BUBBLE_SIZE_SCALE;
    montaCartello(sprite, crowdBubbleWorldScratch.y, h * aspect, h, puntoApertura(nowMs, member.talkStart), opacity);
    sprite.visible = true;
  }
}
