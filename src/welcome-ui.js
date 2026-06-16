import * as THREE from 'three';

function applyWelcomeWindowMotion(motion, deps) {
  motion.frame = 0;
  if (!deps.panel || !motion.next) return;
  const next = motion.next;
  deps.panel.style.setProperty('--welcome-move-x', `${next.moveX}px`);
  deps.panel.style.setProperty('--welcome-move-y', `${next.moveY}px`);
  deps.panel.style.setProperty('--welcome-bend-y', `${next.bendY}deg`);
  deps.panel.style.setProperty('--welcome-tilt-x', `${next.tiltX}deg`);
  deps.panel.style.setProperty('--welcome-origin-x', `${next.originX}%`);
  deps.overlay.classList.add('is-motion-active');
  motion.state = { active: true, ...next };
}

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

export function setupWelcomeWindowMotion(motion, deps) {
  if (!deps.overlay || !deps.panel || !deps.motionAllowed) return;
  window.addEventListener('pointermove', (event) => {
    if (!deps.isVisible()) return;
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const x = THREE.MathUtils.clamp(event.clientX / width, 0, 1);
    const y = THREE.MathUtils.clamp(event.clientY / height, 0, 1);
    const nx = x - 0.5;
    const ny = y - 0.5;
    motion.next = {
      moveX: (nx * 4).toFixed(2),
      moveY: (ny * 2).toFixed(2),
      bendY: (nx * -5).toFixed(3),
      tiltX: (ny * -0.8).toFixed(3),
      originX: (50 - nx * 12).toFixed(2),
      cursorX: (x * 100).toFixed(2),
      cursorY: (y * 100).toFixed(2),
    };
    if (!motion.frame) {
      motion.frame = requestAnimationFrame(() => applyWelcomeWindowMotion(motion, deps));
    }
  }, { passive: true });
  document.addEventListener('pointerleave', () => resetWelcomeWindowMotion(motion, deps), { passive: true });
  window.addEventListener('blur', () => resetWelcomeWindowMotion(motion, deps));
}
