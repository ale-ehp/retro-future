// ---------- keyboard input layer ----------
// Owns the shared `keys` state object and the window keydown/keyup/blur + document visibilitychange
// listeners (extracted in A3c-2). `keys` is an exported shared object (Object.create(null), mutated
// in place) that movement's applyMovement reads (injected there) and main's road-boundary lead-input
// check + resetCameraHeightToDefault read (imported). The keydown handler is an input ROUTER: its
// early-return branches (Escape / welcome-Space / Backspace / KeyH / KeyP / footstep warm-up) call
// into other subsystems via injected callbacks, then the tail records the key into `keys`. main calls
// initKeyboard(deps) once to wire those callbacks and register the listeners (registration timing is
// identical to before — still during synchronous module eval, before any input is possible).

import { stopMouseLookInput } from '../camera/mouse-look.js';
import { movementVelocity } from './movement.js';

// ---------- exported shared state ----------
export const keys = Object.create(null);

// ---------- keyboard-private ----------
const FOOTSTEP_AUDIO_USER_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight',
]);

function isTextEditingTarget(target) {
  if (!target) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'TEXTAREA') return true;
  if (tag !== 'INPUT') return false;
  const type = (target.type || 'text').toLowerCase();
  return ['text', 'search', 'url', 'email', 'password', 'number', 'tel'].includes(type);
}

// ---------- injected deps (assigned in initKeyboard) ----------
let DEMO_START_KEY = null;
let welcomeWindowVisible = null;
let ensureFootstepAudioReady = null;
let triggerBackspaceDroneIntro = null;
let resetCameraHeightToDefault = null;
let captureLivePlayerSpawn = null;
let getBackspaceIntroTriggered = null;
let handleContactTerminalKeyDown = null;

export function routeContactTerminalKeyDown(event, handler) {
  if (event?.repeat || typeof handler !== 'function') return false;
  return Boolean(handler(event));
}

export function initKeyboard(deps) {
  DEMO_START_KEY = deps.DEMO_START_KEY;
  welcomeWindowVisible = deps.welcomeWindowVisible;
  ensureFootstepAudioReady = deps.ensureFootstepAudioReady;
  triggerBackspaceDroneIntro = deps.triggerBackspaceDroneIntro;
  resetCameraHeightToDefault = deps.resetCameraHeightToDefault;
  captureLivePlayerSpawn = deps.captureLivePlayerSpawn;
  getBackspaceIntroTriggered = deps.getBackspaceIntroTriggered;
  handleContactTerminalKeyDown = deps.handleContactTerminalKeyDown;

  window.addEventListener('keydown', (e) => {
    if (routeContactTerminalKeyDown(e, handleContactTerminalKeyDown)) return;
    if (e.repeat) return;
    if (e.code === 'Escape') {
      stopMouseLookInput();
      return;
    }
    if (e.code === DEMO_START_KEY && welcomeWindowVisible() && !isTextEditingTarget(e.target)) {
      e.preventDefault();
      ensureFootstepAudioReady();
      triggerBackspaceDroneIntro('welcome-space');
      return;
    }
    if (e.code === 'Backspace' && !isTextEditingTarget(e.target)) {
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyH') {
      e.preventDefault();
      resetCameraHeightToDefault();
      return;
    }
    if (e.code === 'KeyP') {
      e.preventDefault();
      captureLivePlayerSpawn();
      return;
    }
    if (getBackspaceIntroTriggered() && !isTextEditingTarget(e.target) && FOOTSTEP_AUDIO_USER_KEYS.has(e.code)) {
      ensureFootstepAudioReady();
    }
    keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      for (const k in keys) keys[k] = false;
      movementVelocity.y = 0;
    }
  });
}
