// Il ciclo dei frame: tick(), il contatore degli FPS e il ridimensionamento della
// finestra.
//
// Spostato qui da main.js per ultimo e senza toccare una riga dell'ordine interno
// (tappa 5, 2026-09-19): l'ORDINE in cui tick aggiorna i sottosistemi E' logica, non
// stile. src/ordine-boot-frame.test.mjs legge questo file per impedire che cambi.
//
// Il contatore vive nell'oggetto `frame`: retroSceneReady in main.js azzera `last`,
// `fpsLast`, `fpsAccum` e `fpsFrames` prima del primo fotogramma, e quattro moduli
// leggono `latestMeasuredFps`. Il resto e' privato di qui.
//
// `frame.last` nasce adesso all'import invece che a meta' del corpo di main: non
// cambia niente, perche' retroSceneReady lo riscrive col tempo del primo fotogramma.

import { updateTronDiscCursor } from '../camera/disc-cursor.js';
import { updateDroneIntroFlight } from '../camera/drone-intro.js';
import { applyViewMotionOffset, removeViewMotionOffset } from '../camera/player-state.js';
import {
  tronRunnerBeatPulse,
  tronRunnerCrowd,
  tronRunnerCrowdGroup,
  tronRunnerCrowdRuntime,
  tronRunnerCrowdRuntimeStats,
  tronRunnerOrchestration,
  tronRunnerReveal,
} from '../character/runner-wiring.js';
import { updateGreeterSpeechBubble, updateTronRunnerCrowdSpeechBubbles } from '../character/speech-bubbles.js';
import { updateStartPositionLiveLabel } from '../controls/control-panel.js';
import { labEqualizerGroup, updateLabEqualizer } from '../controls/equalizer.js';
import { applyMovement, updateWalkSimulation } from '../controls/movement.js';
import { initAtmosphereParticles, updateAtmosphereParticles } from '../world/atmosphere-particles.js';
import {
  boundaryErrorNeedsUpdate,
  updateBoundaryError,
  updateRoadBoundaryPulse,
} from '../world/boundary-error.js';
import { updateCityDepartmentBoards, updateCityRoleBoard } from '../world/city-boards.js';
import {
  cityRevealComplete,
  isCityRevealCompositeActive,
  isCityRevealPerformanceCritical,
  updateCityRevealWireframe,
} from '../world/city-reveal-wireframe.js';
import {
  cityRevealProfiler,
  cityRevealRender,
  shouldUpdateTronRunnerSourceCharacter,
  updateMainFacadeVerticalReveal,
} from '../world/city-wiring.js';
import { SECONDARY_EFFECT_UPDATE_STRIDE } from '../world/config.js';
import { contactTerminalOwnsCamera, updateContactTerminal } from '../world/contact-terminal.js';
import { updateEdgePulse } from '../world/energy-pulse.js';
import { flushHexTileBatchUploads, stepHexRoadTiles } from '../world/hex-tiles.js';
import { fxEnabled, fxToggleInspect } from './fx-debug-toggles.js';
import {
  applyRenderResolution,
  applyTemporalAaJitterForRender,
  clearTemporalAaJitterForRender,
  post,
  shouldBypassBloomForRevealPerformance,
  syncBloomLookMerge,
  syncBloomTemporalBudget,
  syncCinematicLookPass,
  syncCityRevealPerformanceProfile,
  syncComposerBufferRoles,
  syncTemporalAaPass,
  tunePerformanceBudget,
} from './post-pipeline.js';
import {
  maybeStartRetroBenchmarkAuto,
  retroBenchmarkRuntime,
  retroBenchmarkSearchParams,
} from './retro-benchmark-runtime.js';
import { updateStaticCityCulling } from './static-city-culling.js';
import { createTechBreakdownOverlay, techBreakdownRequestedFromParams } from './tech-breakdown-overlay.js';

/** @type {any} */ let scene = null;
/** @type {any} */ let camera = null;
/** @type {any} */ let renderer = null;
/** @type {any} */ let controlEls = null;
/** @type {any} */ let fpsEl = null;
/** @type {any} */ let PAL = null;
/** @type {any} */ let performanceDiagnostics = null;
/** @type {any} */ let postRevealPerfIsolationState = null;
/** @type {any} */ let skyDome = null;
/** @type {any} */ let hexRoadInspect = null;
/** @type {any} */ let syncHexRoadLodForFrame = null;
/** @type {any} */ let syncTronDiscRevealWaiting = null;

/** Le dipendenze da main.js, nello stesso punto in cui stava il codice. */
export function initFrameLoop(deps) {
  ({
    scene, camera, renderer, controlEls, fpsEl, PAL, performanceDiagnostics,
    postRevealPerfIsolationState, skyDome, hexRoadInspect, syncHexRoadLodForFrame,
    syncTronDiscRevealWaiting,
  } = deps);
}

/** Il contatore del ciclo: `frame.last` e i tre degli FPS li azzera retroSceneReady. */
export const frame = {
  secondaryEffectFrame: 0,
  boundaryErrorAccumulatedDt: 0,
  viewportResizeFrame: 0,
  last: performance.now(),
  fpsAccum: 0,
  fpsFrames: 0,
  fpsLast: 0,
  startPositionLabelLast: 0,
  latestMeasuredFps: 0,
};
frame.fpsLast = frame.last;

export function applyViewportResize() {
  frame.viewportResizeFrame = 0;
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  if (post.composer) post.composer.setSize(w, h);
  applyRenderResolution(Number(controlEls.pixelRatio.value));
}
window.addEventListener('resize', () => {
  if (frame.viewportResizeFrame) return;
  frame.viewportResizeFrame = requestAnimationFrame(applyViewportResize);
});


function collectTechBreakdownStats() {
  const fxInspect = fxToggleInspect();
  const fxDisabled = Object.entries(fxInspect.toggles || {})
    .filter(([, entry]) => entry.applied === false)
    .map(([name]) => name);
  return {
    ...performanceDiagnostics.summary(frame.latestMeasuredFps),
    skyBake: skyDome.inspectSkyBake(),
    temporalAa: post.temporalAaPass?.inspect() || { enabled: false, profile: post.temporalAaSettings.profile },
    webgpu: { roadmap: 'compute TAA + motion vectors' },
    hexRoad: hexRoadInspect(),
    fxDisabled,
  };
}

const techBreakdownOverlay = techBreakdownRequestedFromParams(retroBenchmarkSearchParams)
  ? createTechBreakdownOverlay({ getStats: collectTechBreakdownStats })
  : null;

export function tick(now) {
  requestAnimationFrame(tick);
  const frameStartedAt = performance.now();
  const rawRafDtMs = Math.max(0, now - frame.last);
  const dt = Math.min(0.05, rawRafDtMs / 1000); frame.last = now;
  updateTronDiscCursor(dt);
  frame.fpsAccum += dt; frame.fpsFrames++;
  if (now - frame.fpsLast > 500) {
    const measuredFps = frame.fpsFrames / frame.fpsAccum;
    frame.latestMeasuredFps = measuredFps;
    fpsEl.textContent = measuredFps.toFixed(0);
    performanceDiagnostics.update(measuredFps);
    tunePerformanceBudget(measuredFps);
    frame.fpsAccum = 0; frame.fpsFrames = 0; frame.fpsLast = now;
  }
  removeViewMotionOffset();
  const droneIntroWasActive = updateDroneIntroFlight(now);
  updateContactTerminal(now);
  const contactTerminalCameraOwned = contactTerminalOwnsCamera();
  if (!droneIntroWasActive && !contactTerminalCameraOwned) applyMovement(dt);
  syncHexRoadLodForFrame();
  const revealPerformanceCritical = isCityRevealPerformanceCritical();
  if (!revealPerformanceCritical) {
    stepHexRoadTiles(dt);
    updateRoadBoundaryPulse(dt);
    frame.secondaryEffectFrame++;
    const updateSecondaryEffects = frame.secondaryEffectFrame % SECONDARY_EFFECT_UPDATE_STRIDE === 0;
    frame.boundaryErrorAccumulatedDt = Math.min(0.12, frame.boundaryErrorAccumulatedDt + dt);
    if (updateSecondaryEffects || boundaryErrorNeedsUpdate()) {
      updateBoundaryError(frame.boundaryErrorAccumulatedDt);
      frame.boundaryErrorAccumulatedDt = 0;
    }
    if (!contactTerminalCameraOwned) updateWalkSimulation(dt);
    if (shouldUpdateTronRunnerSourceCharacter()) tronRunnerOrchestration.update(dt);
    if (postRevealPerfIsolationState.crowd) {
      tronRunnerCrowdRuntime.update(dt);
    } else {
      tronRunnerCrowdGroup.visible = false;
      tronRunnerCrowdRuntimeStats.cullingVisibleCount = 0;
      tronRunnerCrowdRuntimeStats.cullingHiddenCount = tronRunnerCrowd.length;
      tronRunnerCrowdRuntimeStats.activeReflectionCount = 0;
    }
  } else {
    tronRunnerCrowdRuntimeStats.performanceFreezeFrameCount += 1;
  }
  if (now - frame.startPositionLabelLast > 180) {
    updateStartPositionLiveLabel();
    frame.startPositionLabelLast = now;
  }
  if (!contactTerminalCameraOwned) applyViewMotionOffset();
  skyDome.update(now);
  // Sky background bake (on by default, desktop and mobile; ?skyBake=0 turns it
  // off, ?skyBake=1 forces it): only in steady state — post-reveal with no reveal
  // compositing active — so the reveal's own sky is untouched.
  skyDome.syncSkyBackgroundBake(now, cityRevealComplete && !isCityRevealCompositeActive());
  if (!revealPerformanceCritical) {
    updateCityDepartmentBoards(now);
    updateCityRoleBoard();
    flushHexTileBatchUploads();
    const edgePulseSeconds = now * 0.001;
    updateEdgePulse(edgePulseSeconds);
    updateAtmosphereParticles(cityRevealComplete, edgePulseSeconds);
    if (fxEnabled('speechBubbles')) {
      updateGreeterSpeechBubble();
      updateTronRunnerCrowdSpeechBubbles();
    }
  }
  updateCityRevealWireframe(now);
  syncTronDiscRevealWaiting();
  syncCityRevealPerformanceProfile();
  maybeStartRetroBenchmarkAuto(now);
  const postRevealPerformanceCritical = isCityRevealPerformanceCritical();
  const bypassBloomForReveal = shouldBypassBloomForRevealPerformance();
  if (post.bloomPass) post.bloomPass.enabled = post.bloomEnabled && postRevealPerfIsolationState.bloom && !bypassBloomForReveal && fxEnabled('bloom');
  syncBloomTemporalBudget();
  syncCinematicLookPass(now);
  syncTemporalAaPass();
  syncBloomLookMerge();
  if (!postRevealPerformanceCritical) {
    if (postRevealPerfIsolationState.equalizer) {
      updateLabEqualizer(now, dt);
    } else if (labEqualizerGroup.visible) {
      labEqualizerGroup.visible = false;
    }
    tronRunnerReveal.update(now);
    tronRunnerBeatPulse.update();
    updateMainFacadeVerticalReveal();
  }
  updateStaticCityCulling();
  const renderStartedAt = performance.now();
  const captureRevealRenderInfo = cityRevealProfiler.shouldRun() || cityRevealProfiler.isCapturing();
  const previousRendererInfoAutoReset = renderer.info.autoReset;
  if (captureRevealRenderInfo) {
    renderer.info.autoReset = false;
    renderer.info.reset();
  }
  performanceDiagnostics.pollGpuTimerSamples();
  performanceDiagnostics.beginGpuTimerSample();
  const temporalAaJittered = applyTemporalAaJitterForRender();
  syncComposerBufferRoles();
  try {
    cityRevealRender.renderCompositeFrame();
  } finally {
    clearTemporalAaJitterForRender(temporalAaJittered);
    performanceDiagnostics.endGpuTimerSample();
  }
  // Handed over by reference: the profiler copies the four counters it needs on
  // the spot, and info.render is only reset by the next render call.
  const frameRenderInfo = captureRevealRenderInfo ? renderer.info.render : null;
  if (captureRevealRenderInfo) renderer.info.autoReset = previousRendererInfoAutoReset;
  const frameEndedAt = performance.now();
  performanceDiagnostics.timing.updateMs = renderStartedAt - frameStartedAt;
  performanceDiagnostics.timing.renderMs = frameEndedAt - renderStartedAt;
  performanceDiagnostics.timing.frameMs = frameEndedAt - frameStartedAt;
  performanceDiagnostics.updateRollingMetrics(dt, performanceDiagnostics.timing.frameMs, performanceDiagnostics.timing.updateMs, performanceDiagnostics.timing.renderMs);
  performanceDiagnostics.recordSpike({
    now,
    rawRafDtMs,
    updateMs: performanceDiagnostics.timing.updateMs,
    renderMs: performanceDiagnostics.timing.renderMs,
    frameMs: performanceDiagnostics.timing.frameMs,
  });
  cityRevealProfiler.recordFrame({
    now,
    dt,
    updateMs: performanceDiagnostics.timing.updateMs,
    renderMs: performanceDiagnostics.timing.renderMs,
    frameMs: performanceDiagnostics.timing.frameMs,
    renderInfo: frameRenderInfo,
  });
  retroBenchmarkRuntime.recordFrame({
    now,
    rafDtMs: rawRafDtMs,
    updateMs: performanceDiagnostics.timing.updateMs,
    renderMs: performanceDiagnostics.timing.renderMs,
    frameMs: performanceDiagnostics.timing.frameMs,
    // recordFrame reads these fields synchronously (and early-returns when idle),
    // so pass the live info objects instead of allocating a copy every frame
    renderInfo: renderer.info.render,
    memoryInfo: renderer.info.memory,
  });
  techBreakdownOverlay?.update(now);
}
