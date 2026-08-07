// ---------- mobile movement pad + landscape fullscreen ----------
// The on-screen virtual joystick (active only in mobile landscape) plus the landscape-fullscreen
// request flow. Dormant on desktop. mobileTouchControlsState is the shared interface: the pad writes
// movement.{x,z,magnitude,enabled} here and main's applyMovement reads it; __tronInspect reads the
// snapshot. requestLandscapeFullscreen + isMobileMovementControlTarget are also used by the mouse-look
// touch handlers (injected there). main calls initMobileMovement(deps) once to wire the perf/diagnostics/
// viewport deps + the pad DOM refs and register all the touch/orientation/fullscreen listeners.

const MOBILE_MOVEMENT_PAD_RADIUS = 58;
const MOBILE_MOVEMENT_PAD_DEADZONE = 0.12;
// null fuori dal browser: i test in node importano questo modulo senza DOM.
const mobileLandscapeQuery = typeof window !== 'undefined' ? window.matchMedia('(orientation: landscape)') : null;

export const mobileTouchControlsState = {
  landscape: false,
  fullscreen: {
    supported: false,
    active: false,
    landscape: false,
    lastAttemptSource: '',
    lastAttemptAt: 0,
    attemptId: 0,
    lastResult: 'idle',
    lastError: '',
  },
  movement: {
    enabled: false,
    active: false,
    pointerId: null,
    x: 0,
    z: 0,
    magnitude: 0,
  },
};

// ---------- injected deps (assigned in initMobileMovement) ----------
let mobilePerformanceProfileActive = null;
let performanceDiagnosticsCanvasSummary = null;
let applyViewportResize = null;
let mobileMovementPadEl = null;
let mobileMovementKnobEl = null;

function isMobileLandscapeMode() {
  return Boolean(mobilePerformanceProfileActive() && (mobileLandscapeQuery?.matches || window.innerWidth > window.innerHeight));
}

function currentFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function requestFullscreenSupported() {
  const target = document.documentElement;
  return Boolean(target.requestFullscreen || target.webkitRequestFullscreen);
}

function updateMobileTouchControlsState() {
  const landscape = isMobileLandscapeMode();
  mobileTouchControlsState.landscape = landscape;
  mobileTouchControlsState.fullscreen.supported = requestFullscreenSupported();
  mobileTouchControlsState.fullscreen.active = Boolean(currentFullscreenElement());
  mobileTouchControlsState.fullscreen.landscape = landscape;
  mobileTouchControlsState.movement.enabled = Boolean(landscape && mobileMovementPadEl);
  document.body.classList.toggle('mobile-landscape', mobileTouchControlsState.movement.enabled);
  if (!mobileTouchControlsState.movement.enabled) resetMobileMovementPad();
  return mobileTouchControlsState;
}

export function requestLandscapeFullscreen(source = 'auto') {
  updateMobileTouchControlsState();
  const fs = mobileTouchControlsState.fullscreen;
  const attemptId = fs.attemptId + 1;
  fs.attemptId = attemptId;
  fs.lastAttemptSource = source;
  fs.lastAttemptAt = performance.now();
  fs.lastError = '';
  if (!fs.landscape) {
    fs.lastResult = 'skipped-not-landscape';
    return Promise.resolve(false);
  }
  if (fs.active) {
    fs.lastResult = 'already-fullscreen';
    return Promise.resolve(true);
  }
  const target = document.documentElement;
  const request = target.requestFullscreen || target.webkitRequestFullscreen;
  if (!request) {
    fs.lastResult = 'unsupported';
    return Promise.resolve(false);
  }
  try {
    const requestArgs = target.requestFullscreen ? [{ navigationUI: 'hide' }] : [];
    const result = request.call(target, ...requestArgs);
    if (result?.then) {
      return result.then(() => {
        if (fs.attemptId !== attemptId) return Boolean(currentFullscreenElement());
        fs.lastResult = 'entered';
        fs.lastError = '';
        updateMobileTouchControlsState();
        return true;
      }).catch((error) => {
        if (fs.attemptId !== attemptId) return Boolean(currentFullscreenElement());
        fs.lastResult = 'blocked';
        fs.lastError = error?.message || String(error);
        updateMobileTouchControlsState();
        return false;
      });
    }
    fs.lastResult = 'requested';
    updateMobileTouchControlsState();
    return Promise.resolve(true);
  } catch (error) {
    fs.lastResult = 'blocked';
    fs.lastError = error?.message || String(error);
    updateMobileTouchControlsState();
    return Promise.resolve(false);
  }
}

function resetMobileMovementPad() {
  mobileTouchControlsState.movement.active = false;
  mobileTouchControlsState.movement.pointerId = null;
  mobileTouchControlsState.movement.x = 0;
  mobileTouchControlsState.movement.z = 0;
  mobileTouchControlsState.movement.magnitude = 0;
  if (mobileMovementKnobEl) {
    mobileMovementKnobEl.style.transform = 'translate3d(-50%, -50%, 0)';
  }
}

export function resetMobileMovementInput() {
  resetMobileMovementPad();
}

function updateMobileMovementPadFromPoint(clientX, clientY) {
  if (!mobileMovementPadEl || !mobileMovementKnobEl) return;
  const rect = mobileMovementPadEl.getBoundingClientRect();
  const centerX = rect.left + rect.width * 0.5;
  const centerY = rect.top + rect.height * 0.5;
  const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.5);
  const rawX = (clientX - centerX) / radius;
  const rawY = (clientY - centerY) / radius;
  const length = Math.min(1, Math.hypot(rawX, rawY));
  const deadzone = MOBILE_MOVEMENT_PAD_DEADZONE;
  const normalized = length <= deadzone ? 0 : (length - deadzone) / (1 - deadzone);
  const unitX = length > 0 ? rawX / length : 0;
  const unitY = length > 0 ? rawY / length : 0;
  const x = unitX * normalized;
  const y = unitY * normalized;
  mobileTouchControlsState.movement.x = x;
  mobileTouchControlsState.movement.z = y;
  mobileTouchControlsState.movement.magnitude = normalized;
  const knobX = x * MOBILE_MOVEMENT_PAD_RADIUS * 0.54;
  const knobY = y * MOBILE_MOVEMENT_PAD_RADIUS * 0.54;
  mobileMovementKnobEl.style.transform = `translate3d(calc(-50% + ${knobX.toFixed(1)}px), calc(-50% + ${knobY.toFixed(1)}px), 0)`;
}

export function mobileTouchControlsInspect() {
  updateMobileTouchControlsState();
  return {
    landscape: mobileTouchControlsState.landscape,
    fullscreen: { ...mobileTouchControlsState.fullscreen },
    movement: {
      ...mobileTouchControlsState.movement,
      pointerId: mobileTouchControlsState.movement.pointerId,
      x: Number(mobileTouchControlsState.movement.x.toFixed(3)),
      z: Number(mobileTouchControlsState.movement.z.toFixed(3)),
      magnitude: Number(mobileTouchControlsState.movement.magnitude.toFixed(3)),
    },
    resolution: performanceDiagnosticsCanvasSummary(),
  };
}

export function isMobileMovementControlTarget(target) {
  return Boolean(target?.closest?.('#mobile-movement-pad'));
}

function releaseMobileMovementPointer(event) {
  if (mobileTouchControlsState.movement.pointerId !== null && event?.pointerId !== mobileTouchControlsState.movement.pointerId) return;
  resetMobileMovementPad();
}

function scheduleMobileLandscapeRefresh(source = 'resize') {
  window.requestAnimationFrame(() => {
    updateMobileTouchControlsState();
    requestLandscapeFullscreen(source);
    applyViewportResize();
  });
}

// ---------- init: wire deps + register the touch / orientation / fullscreen listeners ----------
export function initMobileMovement(injected) {
  ({
    mobilePerformanceProfileActive,
    performanceDiagnosticsCanvasSummary,
    applyViewportResize,
    mobileMovementPadEl,
    mobileMovementKnobEl,
  } = injected);

  mobileMovementPadEl?.addEventListener('pointerdown', (event) => {
    updateMobileTouchControlsState();
    if (!mobileTouchControlsState.movement.enabled) return;
    event.preventDefault();
    requestLandscapeFullscreen('movement-pad');
    mobileTouchControlsState.movement.active = true;
    mobileTouchControlsState.movement.pointerId = event.pointerId;
    mobileMovementPadEl.setPointerCapture?.(event.pointerId);
    updateMobileMovementPadFromPoint(event.clientX, event.clientY);
  }, { passive: false });

  mobileMovementPadEl?.addEventListener('pointermove', (event) => {
    if (!mobileTouchControlsState.movement.active || mobileTouchControlsState.movement.pointerId !== event.pointerId) return;
    event.preventDefault();
    updateMobileMovementPadFromPoint(event.clientX, event.clientY);
  }, { passive: false });

  mobileMovementPadEl?.addEventListener('pointerup', releaseMobileMovementPointer);
  mobileMovementPadEl?.addEventListener('pointercancel', releaseMobileMovementPointer);
  window.addEventListener('blur', resetMobileMovementPad);

  window.addEventListener('orientationchange', () => scheduleMobileLandscapeRefresh('orientationchange'));
  window.addEventListener('resize', () => updateMobileTouchControlsState());
  document.addEventListener('fullscreenchange', updateMobileTouchControlsState);
  document.addEventListener('webkitfullscreenchange', updateMobileTouchControlsState);
  window.addEventListener('pointerdown', (event) => {
    if (isMobileMovementControlTarget(event.target)) return;
    if (isMobileLandscapeMode()) requestLandscapeFullscreen('page-pointerdown');
  }, { passive: true });
  window.addEventListener('touchstart', (event) => {
    if (isMobileMovementControlTarget(event.target)) return;
    if (isMobileLandscapeMode()) {
      requestLandscapeFullscreen('page-touchstart');
    }
  }, { passive: true, capture: true });
  updateMobileTouchControlsState();
}
