// ctx.js — the world/context object (design §4).
// Holds ONLY genuinely-shared infra (scene / camera / renderer / composer) plus state slices
// that have a single clear owner. Subsystems read their own slice; a subsystem's private state
// stays in that subsystem's module. Guard against this becoming the next controlEls god-object:
// do NOT dump unrelated globals here. Slices and flag accessors are added by the phase that owns
// each subsystem (A1..B), not all at once.
//
// scene / camera / renderer are created once (const) in main.js before createCtx() runs, so they
// are held by value. composer is created later (deferred postprocessing setup) and is reassignable,
// so it is exposed via a late-bound getter rather than captured null at creation time.
export function createCtx({ scene, camera, renderer, getComposer }) {
  return {
    scene,
    camera,
    renderer,
    get composer() {
      return getComposer();
    },
    state: {
      reveal: {},
      runner: {},
      perf: {},
    },
    flags: {},
  };
}
