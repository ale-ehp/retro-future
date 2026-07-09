// ---------------------------------------------------------------------------
// Central mobile-perf DEBUG TOGGLE registry for per-subsystem GPU-fill A/B.
//
// The demo is fill-bound on mobile (GPU fragment/overdraw; see the mobile FPS
// roadmap). To find where the frame time actually goes, every graphics
// subsystem can be independently switched off from the URL to measure its
// contribution:  ?fx.sky=0  ?fx.particles=0  ?fx.hexFloor=0  ...
//
// Contract:
//   - DEFAULT ON. A load with no fx.* params renders exactly as production.
//   - MOBILE-GATED. A toggle only takes effect when the mobile performance
//     profile is active (touch device, <=760px, or ?forceMobile=1). On a plain
//     desktop the param is RECORDED but NOT applied, so desktop output stays
//     byte-identical even when an fx.* param is present in the URL.
//   - SELF-DOCUMENTING. fxLevers() reports the applied state of every toggle
//     the code touched, which the benchmark writes into
//     environment.levers.fx so each capture records which subsystems were off.
//
// Turning a toggle OFF only skips that subsystem's RENDERING (a .visible=false,
// a pass.enabled=false, or a zeroed shader uniform). Update/simulation logic is
// left running so nothing downstream breaks.
// ---------------------------------------------------------------------------

import { mobilePerformanceProfileActive } from './performance-mobile.js';
import { MOBILE_PERFORMANCE_QUERY } from '../world/config.js';

const FALSEY = new Set(['0', 'false', 'off', 'no']);

const params = (() => {
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams('');
  }
})();

const mobileQuery = (() => {
  try {
    return window.matchMedia(MOBILE_PERFORMANCE_QUERY);
  } catch {
    return { matches: false };
  }
})();

// fx toggles only bite when the mobile perf path is active (or ?forceMobile=1).
function gatingActive() {
  try {
    return mobilePerformanceProfileActive(mobileQuery);
  } catch {
    return false;
  }
}

// name -> { requested: bool (param wants it on), applied: bool (after gating) }
const registry = new Map();

function readRequested(name) {
  const raw = params.get(`fx.${name}`);
  if (raw == null) return true; // absent = on
  return !FALSEY.has(String(raw).trim().toLowerCase());
}

// Returns whether the named subsystem should render. false ONLY when the URL
// asks for ?fx.<name>=0 AND the mobile perf profile is active.
export function fxEnabled(name) {
  let entry = registry.get(name);
  if (!entry) {
    entry = { requested: readRequested(name) };
    registry.set(name, entry);
  }
  entry.applied = entry.requested || !gatingActive();
  return entry.applied;
}

// Applied state of every toggle referenced so far (all subsystems register at
// boot, before the benchmark auto-starts) — for environment.levers.fx.
export function fxLevers() {
  const out = {};
  for (const [name, entry] of registry) {
    out[name] = entry.applied !== false;
  }
  return out;
}

// Full inspector (requested vs applied + gating) for console debugging.
export function fxToggleInspect() {
  const toggles = {};
  for (const [name, entry] of registry) {
    toggles[name] = { requested: entry.requested, applied: entry.applied !== false };
  }
  return { gatingActive: gatingActive(), forceMobile: params.get('forceMobile') === '1', toggles };
}
