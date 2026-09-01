// ---------- mouse-look / pointer-lock camera input (A3b) ----------
// Pointer-lock + drag-fallback + touch look that drives the camera yaw/pitch. Self-contained INPUT slice:
// all of its drag/lock bookkeeping is module-private; orientation (yaw/pitch) is reached only through
// injected getter+setter closures (the drone-intro A3a convention — yaw/pitch stay main lets), and the
// per-frame tron-disc-cursor + the mobile-movement-pad stay in main and are injected / left untouched.
// main calls initMouseLook(ctx, deps) once to wire deps + register the DOM handlers, and imports the
// handful of fns the rest of the app still calls (isMouseLookEnabled / updatePointerLockHint /
// stopMouseLookInput) plus getPointerLocked / getUnlockedMouseLookActive for the disc-cursor + debug inspect.

// ---------- module-private input state ----------
let pointerLocked = false;
let dragging = false;
let dragCandidate = false;
let unlockedMouseLookActive = false;
let lastX = 0, lastY = 0;
let lookTouchIdentifier = null;
let dragStartX = 0, dragStartY = 0;
let unlockedMouseLookNeedsOrigin = false;
let suppressNextPointerLockMove = false;
let pointerLockLookEnabledAt = 0;
let pointerClickLookSuppressedUntil = 0;
let ignoredPointerLookMoves = 0;

// ---------- injected deps (assigned in initMouseLook) ----------
let getYaw = null;
let setYaw = null;
let getPitch = null;
let setPitch = null;
let applyCameraLook = null;
let PITCH_LIMIT = Math.PI * 0.49;
let lockEl = null;
let DRAG_ACTIVATE_PX = 4;
let POINTER_LOCK_SETTLE_MS = 220;
let POINTER_CLICK_SUPPRESS_MS = 420;
let clearVerticalMovementState = null;
let setTronDiscCursorVisible = null;
let handleTronDiscCursorMove = null;
let tronDiscCursorState = null;
let welcomeWindowUsesTouchPrompt = null;
let requestLandscapeFullscreen = null;
let isMobileMovementControlTarget = null;
let getCityRevealComplete = null;
let getMouseSensitivityScale = null;
let contactTerminalOwnsCamera = null;

// ---------- exported accessors (read by main's disc-cursor + debug inspect) ----------
export function getPointerLocked() {
  return pointerLocked;
}

export function getUnlockedMouseLookActive() {
  return unlockedMouseLookActive;
}

export function mouseLookAllowed({ revealComplete, contactCameraOwned }) {
  return Boolean(revealComplete && !contactCameraOwned);
}

export function isMouseLookEnabled() {
  return mouseLookAllowed({
    revealComplete: getCityRevealComplete?.(),
    contactCameraOwned: contactTerminalOwnsCamera?.(),
  });
}

export function getCameraTouchCandidates(touchList, movementTargetFn = isMobileMovementControlTarget) {
  const isMovementTarget = typeof movementTargetFn === 'function' ? movementTargetFn : () => false;
  return Array.from(touchList || []).filter((touch) => !isMovementTarget(touch.target));
}

export function acceptsSingleCameraTouch(touchList, movementTargetFn = isMobileMovementControlTarget) {
  return getCameraTouchCandidates(touchList, movementTargetFn).length === 1;
}

// ---------- control fns ----------
function suppressPointerLook(ms = POINTER_CLICK_SUPPRESS_MS, moveCount = 8) {
  suppressNextPointerLockMove = true;
  pointerClickLookSuppressedUntil = Math.max(pointerClickLookSuppressedUntil, performance.now() + ms);
  ignoredPointerLookMoves = Math.max(ignoredPointerLookMoves, moveCount);
}

export function updatePointerLockHint() {
  const lockHint = document.getElementById('lock-hint');
  if (!lockHint) return;
  if (welcomeWindowUsesTouchPrompt()) {
    lockHint.textContent = isMouseLookEnabled()
      ? 'trascina per guardare'
      : 'touch attivo dopo il reveal';
    return;
  }
  lockHint.textContent = isMouseLookEnabled()
    ? (pointerLocked || unlockedMouseLookActive ? 'mouse look active · ESC to release' : 'click canvas to lock')
    : 'mouse disabled until reveal complete';
}

function syncMouseLookCursorState() {
  document.body.classList.toggle('mouse-look-engaged', pointerLocked || unlockedMouseLookActive);
  lockEl.classList.toggle('dragging', pointerLocked || unlockedMouseLookActive);
  setTronDiscCursorVisible(tronDiscCursorState.pointerInside);
}

export function stopMouseLookInput() {
  dragging = false;
  dragCandidate = false;
  lookTouchIdentifier = null;
  unlockedMouseLookActive = false;
  unlockedMouseLookNeedsOrigin = false;
  suppressNextPointerLockMove = false;
  ignoredPointerLookMoves = 0;
  if (document.pointerLockElement === lockEl) {
    try { document.exitPointerLock?.(); } catch (_) {}
  }
  pointerLocked = false;
  syncMouseLookCursorState();
  updatePointerLockHint();
}

export function resumeMouseLookInput({ requestPointerLock = false } = {}) {
  if (!isMouseLookEnabled() || !lockEl) return false;
  dragging = false;
  dragCandidate = false;
  lookTouchIdentifier = null;
  unlockedMouseLookActive = true;
  unlockedMouseLookNeedsOrigin = true;
  clearVerticalMovementState?.();
  suppressPointerLook();
  lockEl.focus?.({ preventScroll: true });
  syncMouseLookCursorState();
  updatePointerLockHint();
  if (requestPointerLock) {
    try {
      const lockRequest = lockEl.requestPointerLock?.();
      lockRequest?.catch?.(() => {});
    } catch (_) {}
  }
  return true;
}

// ---------- init: wire deps + register the DOM handlers ----------
export function initMouseLook(ctx, injected) {
  ({
    getYaw,
    setYaw,
    getPitch,
    setPitch,
    applyCameraLook,
    PITCH_LIMIT,
    lockEl,
    DRAG_ACTIVATE_PX,
    POINTER_LOCK_SETTLE_MS,
    POINTER_CLICK_SUPPRESS_MS,
    clearVerticalMovementState,
    setTronDiscCursorVisible,
    handleTronDiscCursorMove,
    tronDiscCursorState,
    welcomeWindowUsesTouchPrompt,
    requestLandscapeFullscreen,
    isMobileMovementControlTarget,
    getCityRevealComplete,
    getMouseSensitivityScale,
  } = injected);
  contactTerminalOwnsCamera = injected.contactTerminalOwnsCamera || (() => false);

  lockEl.addEventListener('click', (e) => {
    if (!isMouseLookEnabled()) {
      e.preventDefault();
      stopMouseLookInput();
      return;
    }
    suppressPointerLook();
    clearVerticalMovementState();
    if (!pointerLocked) {
      dragging = false;
      dragCandidate = false;
      unlockedMouseLookActive = true;
      unlockedMouseLookNeedsOrigin = false;
      lastX = e.clientX;
      lastY = e.clientY;
      pointerLockLookEnabledAt = performance.now() + POINTER_LOCK_SETTLE_MS;
      syncMouseLookCursorState();
      updatePointerLockHint();
      try {
        const lockRequest = lockEl.requestPointerLock?.();
        lockRequest?.catch?.(() => {});
      } catch (_) {}
    }
  });
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = (document.pointerLockElement === lockEl);
    clearVerticalMovementState();
    if (pointerLocked) {
      dragging = false;
      dragCandidate = false;
      unlockedMouseLookActive = false;
      suppressPointerLook(POINTER_LOCK_SETTLE_MS, 8);
      pointerLockLookEnabledAt = performance.now() + POINTER_LOCK_SETTLE_MS;
    }
    syncMouseLookCursorState();
    updatePointerLockHint();
  });

  window.addEventListener('mousemove', (e) => {
    handleTronDiscCursorMove(e);
    if (!isMouseLookEnabled()) {
      stopMouseLookInput();
      return;
    }
    if (pointerLocked) {
      if (
        suppressNextPointerLockMove ||
        ignoredPointerLookMoves > 0 ||
        performance.now() < pointerLockLookEnabledAt ||
        performance.now() < pointerClickLookSuppressedUntil
      ) {
        suppressNextPointerLockMove = false;
        ignoredPointerLookMoves = Math.max(0, ignoredPointerLookMoves - 1);
        return;
      }
      setYaw(getYaw() - e.movementX * 0.0022 * getMouseSensitivityScale());
      setPitch(getPitch() - e.movementY * 0.0022 * getMouseSensitivityScale());
      setPitch(Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, getPitch())));
      applyCameraLook();
    } else if (unlockedMouseLookActive) {
      if (unlockedMouseLookNeedsOrigin) {
        unlockedMouseLookNeedsOrigin = false;
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      if (Math.abs(dx) <= 0.001 && Math.abs(dy) <= 0.001) return;
      setYaw(getYaw() - dx * 0.0035 * getMouseSensitivityScale());
      setPitch(getPitch() - dy * 0.0035 * getMouseSensitivityScale());
      setPitch(Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, getPitch())));
      applyCameraLook();
    } else if (dragCandidate || dragging) {
      if (!dragging) {
        const totalDx = e.clientX - dragStartX;
        const totalDy = e.clientY - dragStartY;
        if (Math.hypot(totalDx, totalDy) < DRAG_ACTIVATE_PX) return;
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      setYaw(getYaw() - dx * 0.0035 * getMouseSensitivityScale());
      setPitch(getPitch() - dy * 0.0035 * getMouseSensitivityScale());
      setPitch(Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, getPitch())));
      applyCameraLook();
    }
  });
  document.addEventListener('pointerleave', () => setTronDiscCursorVisible(false), { passive: true });
  window.addEventListener('blur', () => setTronDiscCursorVisible(false));
  // fallback drag-rotate when pointer lock unavailable / declined
  lockEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (!isMouseLookEnabled()) {
      stopMouseLookInput();
      return;
    }
    clearVerticalMovementState();
    suppressPointerLook();
    if (pointerLocked) return;
    unlockedMouseLookActive = false;
    unlockedMouseLookNeedsOrigin = false;
    // A tiny drag activates rotate-fallback when browser pointer lock is unavailable,
    // declined, or not yet engaged after the click gesture.
    dragCandidate = true;
    dragging = false;
    dragStartX = lastX = e.clientX;
    dragStartY = lastY = e.clientY;
  });
  window.addEventListener('mouseup', () => {
    if (pointerLocked) suppressPointerLook(180, 3);
    dragging = false;
    dragCandidate = false;
  });
  document.addEventListener('mousedown', (e) => {
    if (e.target === lockEl) return;
    unlockedMouseLookActive = false;
    syncMouseLookCursorState();
    updatePointerLockHint();
  });

  // touch fallback (mobile)
  lockEl.addEventListener('touchstart', (e) => {
    if (!isMouseLookEnabled()) {
      e.preventDefault();
      stopMouseLookInput();
      return;
    }
    e.preventDefault();
    if (lookTouchIdentifier !== null) return;
    const cameraTouches = getCameraTouchCandidates(e.touches);
    if (cameraTouches.length !== 1) return;
    const touch = getCameraTouchCandidates(e.changedTouches).find((item) => item.identifier === cameraTouches[0].identifier) || cameraTouches[0];
    if (!touch) return;
    requestLandscapeFullscreen('look-touch');
    lookTouchIdentifier = touch.identifier;
    dragging = true;
    lastX = touch.clientX;
    lastY = touch.clientY;
  }, { passive: false });
  window.addEventListener('touchend', (e) => {
    if (lookTouchIdentifier === null) {
      dragging = false;
      return;
    }
    const ended = Array.from(e.changedTouches).some((touch) => touch.identifier === lookTouchIdentifier);
    if (ended) {
      dragging = false;
      lookTouchIdentifier = null;
    }
  });
  window.addEventListener('touchcancel', (e) => {
    if (lookTouchIdentifier === null) {
      dragging = false;
      return;
    }
    const cancelled = Array.from(e.changedTouches).some((touch) => touch.identifier === lookTouchIdentifier);
    if (cancelled) {
      dragging = false;
      lookTouchIdentifier = null;
    }
  });
  window.addEventListener('touchmove', (e) => {
    if (!isMouseLookEnabled()) {
      stopMouseLookInput();
      return;
    }
    // touchmove fires at (or above) the refresh rate for as long as a finger is
    // dragging, so walk the live TouchList instead of materializing it through
    // Array.from().filter() plus a find() closure on every single event.
    const touches = e.touches;
    let cameraTouchCount = 0;
    let t = null;
    for (let i = 0; i < touches.length; i += 1) {
      const touch = touches[i];
      if (isMobileMovementControlTarget(touch.target)) continue;
      cameraTouchCount += 1;
      if (touch.identifier === lookTouchIdentifier) t = touch;
    }
    if (cameraTouchCount > 1) {
      e.preventDefault();
      return;
    }
    if (!dragging || lookTouchIdentifier === null) return;
    e.preventDefault();
    if (cameraTouchCount !== 1 || !t) return;
    const dx = t.clientX - lastX, dy = t.clientY - lastY;
    lastX = t.clientX; lastY = t.clientY;
    setYaw(getYaw() - dx * 0.0035 * getMouseSensitivityScale());
    setPitch(getPitch() - dy * 0.0035 * getMouseSensitivityScale());
    setPitch(Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, getPitch())));
    applyCameraLook();
  }, { passive: false });
}
