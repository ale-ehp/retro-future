// ctx.js: the world/context object passed to the subsystems in src/world, src/camera
// and src/controls.
//
// It holds ONLY genuinely-shared infrastructure (scene / camera / renderer / composer)
// plus `state`, where a subsystem may park a field that another subsystem has to read.
// A subsystem's private state stays in that subsystem's module. Guard against this
// becoming the next controlEls god-object: do NOT dump unrelated globals here.
//
// scene / camera / renderer are created once (const) in main.js before createCtx() runs,
// so they are held by value. composer is created later (deferred postprocessing setup)
// and is reassignable, so it is exposed via a late-bound getter rather than captured
// null at creation time.
//
// `state` starts empty on purpose: each slice is created by the subsystem that owns it,
// the way world/boundary-error.js creates state.boundaryError for the noclip flag, which
// today is the only genuinely cross-subsystem field.
export function createCtx({ scene, camera, renderer, getComposer }) {
  return {
    scene,
    camera,
    renderer,
    get composer() {
      return getComposer();
    },
    state: {},
  };
}
