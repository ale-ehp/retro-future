import { inLingua } from '../lingua.js';

export function resetWelcomeWindowMotion(motion, deps) {
  if (motion.frame) {
    cancelAnimationFrame(motion.frame);
    motion.frame = 0;
  }
  motion.next = null;
  if (deps.panel) {
    deps.panel.style.setProperty('--welcome-move-x', '0px');
    deps.panel.style.setProperty('--welcome-move-y', '0px');
    deps.panel.style.setProperty('--welcome-bend-y', '0deg');
    deps.panel.style.setProperty('--welcome-tilt-x', '0deg');
    deps.panel.style.setProperty('--welcome-origin-x', '50%');
  }
  deps.overlay?.classList.remove('is-motion-active');
  motion.state = {
    active: false,
    moveX: '0.00',
    moveY: '0.00',
    bendY: '0.000',
    tiltX: '0.000',
    originX: '50.00',
    cursorX: '50.00',
    cursorY: '50.00',
  };
}

export function dismissWelcomeWindow(state, deps) {
  if (!deps.overlay || state.dismissed) return;
  deps.resetMotion();
  state.dismissed = true;
  deps.overlay.classList.add('is-dismissed');
  deps.overlay.setAttribute('aria-hidden', 'true');
}

export function welcomeWindowVisible(state, deps) {
  return Boolean(deps.overlay && !state.dismissed);
}

export function welcomeWindowUsesTouchPrompt(deps) {
  return Boolean(deps.touchQuery.matches || deps.mobileQuery.matches || navigator.maxTouchPoints > 0);
}

export function applyWelcomeWindowInputMode(deps) {
  if (!deps.keyLabel) return;
  const useTouchPrompt = welcomeWindowUsesTouchPrompt(deps);
  deps.action?.classList.toggle('is-touch-prompt', useTouchPrompt);
  // Le etichette del tasto arrivano gia' tradotte dal markup (data-*), ma questo prefisso
  // era scritto a mano e rimetteva l'italiano sulla pagina inglese (2026-09-18).
  if (deps.actionPrefix) deps.actionPrefix.textContent = useTouchPrompt ? '' : inLingua({ it: 'Premi ', en: 'Press ' });
  deps.keyLabel.textContent = useTouchPrompt
    ? (deps.keyLabel.dataset.touchLabel || 'Clicca')
    : (deps.keyLabel.dataset.desktopLabel || '[Spazio]');
  const lookInputLabel = document.getElementById('look-input-label');
  if (lookInputLabel) lookInputLabel.textContent = welcomeWindowUsesTouchPrompt(deps) ? 'Touch' : 'Mouse';
  deps.updatePointerLockHint();
}

export function triggerWelcomeWindowTouch(event, state, deps) {
  if (!welcomeWindowVisible(state, deps)) return;
  if (!welcomeWindowUsesTouchPrompt(deps)) return;
  if (event.target?.closest?.('button, a, input, select, textarea')) return;
  event.preventDefault?.();
  deps.ensureFootstepAudioReady();
  deps.triggerBackspaceDroneIntro('welcome-touch');
}

