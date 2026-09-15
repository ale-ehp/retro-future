import * as THREE from 'three';

// ---------- tron-disc cursor ----------
// The spinning neon disc that follows the pointer while mouse-look is NOT engaged (it hides under
// pointer-lock / unlocked-drag — that gating is read from mouse-look via getPointerLocked /
// getUnlockedMouseLookActive). handleTronDiscCursorMove is driven from the mouse-look mousemove handler;
// updateTronDiscCursor is ticked by the render loop. tronDiscCursorState is exported so mouse-look (its
// pointerInside) and the debug inspect can read it. main calls initDiscCursor(deps) once to wire the DOM
// refs + the two mouse-look getters.

const TRON_DISC_CURSOR_IDLE_SPIN = 78;
const TRON_DISC_CURSOR_MAX_SPIN = 28500;
const TRON_DISC_CURSOR_SPEED_GAIN = 12.8;
export const tronDiscCursorState = {
  x: -100,
  y: -100,
  lastX: Number.NaN,
  lastY: Number.NaN,
  lastAt: 0,
  pointerInside: false,
  visible: false,
  revealWaiting: false,
  speed: 0,
  rotationDeg: 0,
  spinDegPerSec: TRON_DISC_CURSOR_IDLE_SPIN,
  targetSpinDegPerSec: TRON_DISC_CURSOR_IDLE_SPIN,
};

// ---------- injected deps (assigned in initDiscCursor) ----------
// False until the DOM has been written at least once, so the first call always
// applies the classes/styles even though the state already reads as hidden.
let tronDiscCursorVisibilityApplied = false;
let tronDiscCursor = null;
let lockEl = null;
let getPointerLocked = null;
let getUnlockedMouseLookActive = null;

function writeTronDiscCursorTransform() {
  if (!tronDiscCursor) return;
  tronDiscCursor.style.transform = `translate3d(${tronDiscCursorState.x}px, ${tronDiscCursorState.y}px, 0) translate(-50%, -50%) rotate(${tronDiscCursorState.rotationDeg.toFixed(2)}deg)`;
}

// lockEl is the full-viewport canvas: its rect only moves with the viewport, so
// it is measured once and re-read on resize instead of on every mousemove (a
// layout read per event, right after the render loop has written to the DOM).
let cachedLockRect = null;

export function invalidateTronDiscCursorSurfaceRect() {
  cachedLockRect = null;
}

function tronDiscCursorSurfaceRect() {
  if (!cachedLockRect || !cachedLockRect.width || !cachedLockRect.height) {
    cachedLockRect = lockEl.getBoundingClientRect();
  }
  return cachedLockRect;
}

function isTronDiscCursorSurfaceEvent(event) {
  if (!tronDiscCursor || !event || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return false;
  const target = event.target;
  if (target?.closest?.('#hud-controls, #settings-toggle')) return false;
  const rect = tronDiscCursorSurfaceRect();
  return event.clientX >= rect.left
    && event.clientX <= rect.right
    && event.clientY >= rect.top
    && event.clientY <= rect.bottom;
}

export function setTronDiscCursorVisible(visible) {
  const shouldShow = Boolean(visible && !getPointerLocked() && !getUnlockedMouseLookActive());
  // Called from the mousemove handler on every event: without this guard the four
  // DOM writes below ran continuously while the pointer moved, even though they
  // only ever matter on a visibility transition.
  if (shouldShow === tronDiscCursorState.visible && tronDiscCursorVisibilityApplied) return;
  tronDiscCursorVisibilityApplied = true;
  tronDiscCursorState.visible = shouldShow;
  document.body.classList.toggle('tron-disc-cursor-visible', shouldShow);
  tronDiscCursor?.classList.toggle('is-hidden', !shouldShow);
  if (tronDiscCursor) {
    tronDiscCursor.style.opacity = shouldShow ? '1' : '0';
    tronDiscCursor.style.visibility = shouldShow ? 'visible' : 'hidden';
  }
}

export function setTronDiscCursorRevealWaiting(waiting, anchorEvent = null) {
  const next = Boolean(waiting);
  tronDiscCursorState.revealWaiting = next;
  tronDiscCursor?.classList.toggle('is-reveal-waiting', next);
  if (next && Number.isFinite(anchorEvent?.clientX) && Number.isFinite(anchorEvent?.clientY)) {
    const now = performance.now();
    tronDiscCursorState.x = anchorEvent.clientX;
    tronDiscCursorState.y = anchorEvent.clientY;
    tronDiscCursorState.lastX = anchorEvent.clientX;
    tronDiscCursorState.lastY = anchorEvent.clientY;
    tronDiscCursorState.lastAt = now;
    tronDiscCursorState.pointerInside = true;
    tronDiscCursorState.targetSpinDegPerSec = Math.max(
      tronDiscCursorState.targetSpinDegPerSec,
      TRON_DISC_CURSOR_IDLE_SPIN * 2.4
    );
    writeTronDiscCursorTransform();
    setTronDiscCursorVisible(true);
  }
}

export function handleTronDiscCursorMove(event) {
  if (!tronDiscCursor) return;
  // while pointer-locked (steady gameplay) the disc cursor can never show, so skip the
  // getBoundingClientRect + closest() + DOM writes this handler would otherwise do every mousemove
  if (getPointerLocked()) {
    if (tronDiscCursorState.visible) setTronDiscCursorVisible(false);
    return;
  }
  const inside = isTronDiscCursorSurfaceEvent(event);
  tronDiscCursorState.pointerInside = inside;
  if (!inside) {
    setTronDiscCursorVisible(false);
    return;
  }
  const now = performance.now();
  const dtMs = Math.max(1, now - (tronDiscCursorState.lastAt || now));
  const hasLast = Number.isFinite(tronDiscCursorState.lastX) && Number.isFinite(tronDiscCursorState.lastY);
  const dx = hasLast ? event.clientX - tronDiscCursorState.lastX : 0;
  const dy = hasLast ? event.clientY - tronDiscCursorState.lastY : 0;
  const speed = Math.hypot(dx, dy) / dtMs * 1000;
  tronDiscCursorState.x = event.clientX;
  tronDiscCursorState.y = event.clientY;
  tronDiscCursorState.lastX = event.clientX;
  tronDiscCursorState.lastY = event.clientY;
  tronDiscCursorState.lastAt = now;
  tronDiscCursorState.speed = speed;
  tronDiscCursorState.targetSpinDegPerSec = THREE.MathUtils.clamp(
    TRON_DISC_CURSOR_IDLE_SPIN + speed * TRON_DISC_CURSOR_SPEED_GAIN,
    TRON_DISC_CURSOR_IDLE_SPIN,
    TRON_DISC_CURSOR_MAX_SPIN
  );
  setTronDiscCursorVisible(true);
}

export function updateTronDiscCursor(dt) {
  if (!tronDiscCursor) return;
  // When hidden (pointer-locked / walking — the steady state) the element is visibility:hidden,
  // so the per-frame transform write is invisible; skip it (re-show resets via handleTronDiscCursorMove).
  if (!tronDiscCursorState.visible) return;
  const spinDecay = Math.min(1, dt * 2.8);
  const spinEase = Math.min(1, dt * 12);
  const restingTarget = tronDiscCursorState.visible ? TRON_DISC_CURSOR_IDLE_SPIN : 0;
  tronDiscCursorState.targetSpinDegPerSec = THREE.MathUtils.lerp(
    tronDiscCursorState.targetSpinDegPerSec,
    restingTarget,
    spinDecay
  );
  tronDiscCursorState.spinDegPerSec = THREE.MathUtils.lerp(
    tronDiscCursorState.spinDegPerSec,
    tronDiscCursorState.targetSpinDegPerSec,
    spinEase
  );
  tronDiscCursorState.rotationDeg = (tronDiscCursorState.rotationDeg + tronDiscCursorState.spinDegPerSec * dt) % 360;
  writeTronDiscCursorTransform();
}

// ---------- init: wire DOM refs + mouse-look gating getters ----------
export function initDiscCursor(injected) {
  ({ tronDiscCursor, lockEl, getPointerLocked, getUnlockedMouseLookActive } = injected);
  tronDiscCursorVisibilityApplied = false;
  invalidateTronDiscCursorSurfaceRect();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', invalidateTronDiscCursorSurfaceRect);
  }
}
