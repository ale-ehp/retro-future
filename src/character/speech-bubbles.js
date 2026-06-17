import * as THREE from 'three';

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
export function initSpeechBubbles(injected) { deps = injected; }

// ---------- Greeter welcome speech bubble (3D world sprite, like the //error sign) ----------
const greeterBubbleWorldScratch = new THREE.Vector3();
const GREETER_BUBBLE_HEAD_GAP = 1.1;       // world units above the head
const GREETER_BUBBLE_WORLD_HEIGHT = 1.5;   // sprite height in world units at sizeScale 1
const GREETER_BUBBLE_FADE_SEC = 0.5;       // dissolve in/out time
let greeterBubbleSprite = null;
let greeterBubbleLastMs = 0;
const greeterBubbleTextureCache = new Map();

function makeGreeterBubbleTexture(html) {
  const lines = String(html).split(/<br\s*\/?>/i).map((s) => s.trim());
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  const pad = 30;
  const maxTextW = canvas.width - pad * 2 - 120;
  let fontPx = 74;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const widest = () => {
    ctx.font = `700 ${fontPx}px Menlo, Consolas, monospace`;
    return Math.max(...lines.map((l) => ctx.measureText(l).width));
  };
  while (fontPx > 28 && widest() > maxTextW) fontPx -= 2;
  const lineH = fontPx * 1.24;
  const blockH = lineH * lines.length;
  const panelH = blockH + 56;
  const panelW = Math.min(canvas.width - pad, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 150);
  const px = (canvas.width - panelW) / 2;
  const py = (canvas.height - panelH) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // panel
  ctx.save();
  ctx.shadowColor = 'rgba(98,247,255,0.55)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = 'rgba(0,16,20,0.78)';
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
  ctx.font = `700 ${fontPx}px Menlo, Consolas, monospace`;
  ctx.fillStyle = 'rgba(205,252,255,0.98)';
  ctx.shadowColor = 'rgba(98,247,255,0.7)';
  ctx.shadowBlur = 10;
  const cy = canvas.height / 2 - blockH / 2 + lineH / 2;
  lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, cy + i * lineH));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, deps.getRenderer().capabilities.getMaxAnisotropy?.() || 1);
  texture.__aspect = canvas.width / canvas.height;
  return texture;
}

function getGreeterBubbleTexture(html) {
  let tex = greeterBubbleTextureCache.get(html);
  if (!tex) { tex = makeGreeterBubbleTexture(html); greeterBubbleTextureCache.set(html, tex); }
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
  const target = show ? 1 : 0;
  const stepOp = fadeDt > 0 ? fadeDt / GREETER_BUBBLE_FADE_SEC : (target ? 1 : 0);
  let op = sprite.material.opacity ?? 0;
  if (op < target) op = Math.min(target, op + stepOp);
  else if (op > target) op = Math.max(target, op - stepOp);
  sprite.material.opacity = op;
  if (op <= 0.001 || !greeter || !greeter.bubbleText) { sprite.visible = false; return; }
  const tex = getGreeterBubbleTexture(greeter.bubbleText);
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
    const opacity = THREE.MathUtils.clamp(Math.min(fadeIn, fadeOut, 1), 0, 1);
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
