import * as THREE from 'three';
import { retroFutureSignOpacity, retroFutureSignScale } from '../sign-opacity.js';

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
}

// ---------- Greeter welcome speech bubble (3D world sprite, like the //error sign) ----------
const greeterBubbleWorldScratch = new THREE.Vector3();
const GREETER_BUBBLE_HEAD_GAP = 1.1;       // world units above the head
export const GREETER_BUBBLE_WORLD_HEIGHT = retroFutureSignScale(1.5); // sprite height in world units at sizeScale 1
const GREETER_BUBBLE_FADE_SEC = 0.5;       // dissolve in/out time
export const GREETER_BUBBLE_MAX_OPACITY = retroFutureSignOpacity(1);
export const CROWD_BUBBLE_MAX_OPACITY = retroFutureSignOpacity(1);
export const CROWD_BUBBLE_PANEL_FILL_STYLE = 'rgba(0,3,4,0.94)';
export const CROWD_BUBBLE_TEXT_FILL_STYLE = 'rgba(255,255,255,1)';
const CROWD_BUBBLE_TEXT_SHADOW_STYLE = 'rgba(123,255,255,0.88)';
export const GREETER_BUBBLE_PANEL_FILL_STYLE = 'rgba(0,3,4,0.96)';
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

function drawGreeterBubbleCanvas(canvas, ctx, lines, nowMs = 0, panelFillStyle = CROWD_BUBBLE_PANEL_FILL_STYLE) {
  const pad = 30;
  const maxTextW = canvas.width - pad * 2 - 120;
  let fontPx = 84;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const widest = () => {
    return Math.max(...lines.map((line) => measureGreeterBubbleLine(ctx, line, fontPx)));
  };
  while (fontPx > 28 && widest() > maxTextW) fontPx -= 2;
  const lineH = fontPx * 1.24;
  const blockH = lineH * lines.length;
  const panelH = blockH + 70;
  const panelW = Math.min(canvas.width - pad, Math.max(...lines.map((line) => measureGreeterBubbleLine(ctx, line, fontPx))) + 170);
  const px = (canvas.width - panelW) / 2;
  const py = (canvas.height - panelH) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // panel
  ctx.save();
  ctx.shadowColor = 'rgba(98,247,255,0.55)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = panelFillStyle;
  ctx.beginPath();
  ctx.roundRect(px, py, panelW, panelH, 18);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(143,252,255,0.9)';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(98,247,255,0.8)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect(px, py, panelW, panelH, 18);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // text
  ctx.fillStyle = CROWD_BUBBLE_TEXT_FILL_STYLE;
  ctx.shadowColor = CROWD_BUBBLE_TEXT_SHADOW_STYLE;
  ctx.shadowBlur = 10;
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

function makeGreeterBubbleTexture(html, options = {}) {
  const lines = String(html).split(/<br\s*\/?>/i).map((s) => s.trim());
  const canvas = document.createElement('canvas');
  canvas.width = 896;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  const animated = lines.some(isGreeterBubbleLogoLine);
  const panelFillStyle = characterBubblePanelFillStyle(options.greeter ? 'greeter' : 'crowd');
  drawGreeterBubbleCanvas(canvas, ctx, lines, performance.now(), panelFillStyle);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, deps.getRenderer().capabilities.getMaxAnisotropy?.() || 1);
  texture.__aspect = canvas.width / canvas.height;
  texture.__animated = animated;
  texture.__draw = animated
    ? (nowMs) => drawGreeterBubbleCanvas(canvas, ctx, lines, nowMs, panelFillStyle)
    : null;
  return texture;
}

function getGreeterBubbleTexture(html, options = {}) {
  const cacheKey = `${options.greeter ? 'greeter' : 'crowd'}:${html}`;
  let tex = greeterBubbleTextureCache.get(cacheKey);
  if (!tex) {
    tex = makeGreeterBubbleTexture(html, options);
    greeterBubbleTextureCache.set(cacheKey, tex);
  }
  return tex;
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
      depthTest: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    })
  );
  greeterBubbleSprite.visible = false;
  greeterBubbleSprite.renderOrder = 26;
  greeterBubbleSprite.frustumCulled = false;
  deps.getScene().add(greeterBubbleSprite);
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
  const stepOp = fadeDt > 0
    ? (fadeDt / GREETER_BUBBLE_FADE_SEC) * GREETER_BUBBLE_MAX_OPACITY
    : target;
  let op = sprite.material.opacity ?? 0;
  if (op < target) op = Math.min(target, op + stepOp);
  else if (op > target) op = Math.max(target, op - stepOp);
  sprite.material.opacity = op;
  if (op <= 0.001 || !greeter || !greeter.bubbleText) { sprite.visible = false; return; }
  const tex = getGreeterBubbleTexture(greeter.bubbleText, { greeter: true });
  if (tex.__animated && tex.__draw) {
    tex.__draw(nowMs);
    tex.needsUpdate = true;
  }
  if (sprite.material.map !== tex) { sprite.material.map = tex; sprite.material.needsUpdate = true; }
  // Anchor purely to the body (group world position) at a constant height above the head.
  // No head bone: the head yaws to track the player and bobs with the animation, which made the
  // bubble drift as you looked around. This keeps it dead fixed relative to the character.
  greeter.group.getWorldPosition(greeterBubbleWorldScratch);
  greeterBubbleWorldScratch.y += deps.TARGET_HEIGHT * greeter.group.scale.y + GREETER_BUBBLE_HEAD_GAP;
  sprite.position.copy(greeterBubbleWorldScratch);
  // Y-only billboard: yaw to face the camera horizontally, stay upright (no pitch/roll tilt).
  sprite.rotation.set(0, Math.atan2(deps.getCamera().position.x - sprite.position.x, deps.getCamera().position.z - sprite.position.z), 0);
  const h = GREETER_BUBBLE_WORLD_HEIGHT * (greeter.bubbleSizeScale || 1);
  const aspect = tex.__aspect || 2;
  sprite.scale.set(h * aspect, h, 1);
  sprite.visible = true;
}

// ---------- Crowd ambient speech bubbles (pool of world sprites, like the greeter's) ----------
const CROWD_BUBBLE_POOL_SIZE = 4; // only the nearest few talkers show at once (readability + perf)
const CROWD_BUBBLE_SIZE_SCALE = 1.5; // crowd bubbles 50% larger than the base bubble height
const crowdBubbleWorldScratch = new THREE.Vector3();
let crowdBubbleSprites = null;
const crowdBubbleTalkers = [];
function ensureCrowdBubbleSprites() {
  if (crowdBubbleSprites) return crowdBubbleSprites;
  crowdBubbleSprites = [];
  for (let i = 0; i < CROWD_BUBBLE_POOL_SIZE; i += 1) {
    const sprite = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false, side: THREE.DoubleSide })
    );
    sprite.visible = false;
    sprite.renderOrder = 26;
    sprite.frustumCulled = false;
    deps.getScene().add(sprite);
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
    const fadeIn = (nowMs - member.talkStart) / 300;
    const fadeOut = (member.talkUntil - nowMs) / 400;
    const opacity = THREE.MathUtils.clamp(Math.min(fadeIn, fadeOut, 1), 0, 1) * CROWD_BUBBLE_MAX_OPACITY;
    if (opacity <= 0.001) { sprite.visible = false; sprite.material.opacity = 0; continue; }
    const tex = getGreeterBubbleTexture(member.talkText);
    if (sprite.material.map !== tex) { sprite.material.map = tex; sprite.material.needsUpdate = true; }
    member.group.getWorldPosition(crowdBubbleWorldScratch);
    crowdBubbleWorldScratch.y += deps.TARGET_HEIGHT * member.group.scale.y + GREETER_BUBBLE_HEAD_GAP;
    sprite.position.copy(crowdBubbleWorldScratch);
    sprite.rotation.set(0, Math.atan2(deps.getCamera().position.x - sprite.position.x, deps.getCamera().position.z - sprite.position.z), 0);
    const aspect = tex.__aspect || 2;
    const h = GREETER_BUBBLE_WORLD_HEIGHT * CROWD_BUBBLE_SIZE_SCALE;
    sprite.scale.set(h * aspect, h, 1);
    sprite.material.opacity = opacity;
    sprite.visible = true;
  }
}
