// Il prewarm e il boot: caricare texture e ossa sulla GPU prima che si vedano, e
// far partire la scena con i valori finali dei controlli.
//
// Spostato qui da main.js senza cambiare la logica (tappa 5, 2026-09-19). Misurato
// prima di tagliare: il dominio non scrive niente fuori e non chiama nessuna funzione
// di main; legge cinque cose (scena, camera, renderer, diagnostica, runtime del rivelo)
// che arrivano da initBootPrewarm(), chiamata dove stava il codice. Niente gira
// all'import, quindi qui non serve spostare le costruzioni dentro l'init.
//
// L'ORDINE dentro bootSceneWithFinalDefaults e' logica, non stile: prima si svuota la
// coda della folla, poi si scaldano ossa e texture, i post-processing per ultimi.
// src/ordine-boot-frame.test.mjs legge questo file per impedire che cambi.
import { ensureFootstepAudioReady, waitForNextFrame } from '../audio/player-footsteps.js';
import { scheduleDroneIntroAutoFlight } from '../camera/drone-intro.js';
import { player } from '../camera/player-state.js';
import { tronRunnerCrowdRuntime, tronRunnerOrchestration } from '../character/runner-wiring.js';
import { SCENE_TEXTURE_PREWARM_KEYS } from '../config/costanti.js';
import { applyBridgeFixedDefaults } from '../controls/bridge-controls.js';
import { applyPlayerSpawn, controlSettingsRuntime, loadStoredPlayerSpawn } from '../controls/control-panel.js';
import { buildLabEqualizer } from '../controls/equalizer.js';
import { applyLiveControls } from '../controls/live-controls.js';
import { setTronNoclip } from '../world/boundary-error.js';
import {
  restoreCityRevealWireframeState,
  setCityRevealPostProcessingPrewarmState,
  snapshotCityRevealWireframeState,
} from '../world/city-reveal-wireframe.js';
import { post } from './post-pipeline.js';
import * as THREE from 'three';

/** @type {import('three').Scene} */ let scene = null;
/** @type {import('three').PerspectiveCamera} */ let camera = null;
/** @type {import('three').WebGLRenderer} */ let renderer = null;
/** @type {any} */ let performanceDiagnostics = null;
/** @type {any} */ let cityRevealRender = null;

/** Le dipendenze da main.js, nello stesso punto in cui stava il codice. */
export function initBootPrewarm(deps) {
  ({ scene, camera, renderer, performanceDiagnostics, cityRevealRender } = deps);
}

export const sceneTexturePrewarmStats = {
  supported: false,
  attempted: 0,
  uploaded: 0,
  errors: 0,
  durationMs: 0,
};
export const postProcessingPrewarmStats = {
  attempted: false,
  rendered: false,
  postRevealRendered: false,
  errors: 0,
  durationMs: 0,
  texturesAfter: 0,
};
export const skinnedMeshPrewarmStats = {
  attempted: 0,
  created: 0,
  uploaded: 0,
  errors: 0,
  durationMs: 0,
};
export const hiddenSkinnedRenderPrewarmStats = {
  attempted: 0,
  forcedVisible: 0,
  forcedUnculled: 0,
  rendered: false,
  errors: 0,
  durationMs: 0,
  texturesBefore: 0,
  texturesAfter: 0,
};

function prewarmTextureUpload(texture, seen) {
  if (!texture?.isTexture || seen.has(texture)) return;
  seen.add(texture);
  sceneTexturePrewarmStats.attempted += 1;
  try {
    renderer.initTexture?.(texture);
    sceneTexturePrewarmStats.uploaded += 1;
  } catch {
    sceneTexturePrewarmStats.errors += 1;
  }
}

function prewarmMaterialTextureUploads(material, seen) {
  if (!material) return;
  for (const key of SCENE_TEXTURE_PREWARM_KEYS) {
    prewarmTextureUpload(material[key], seen);
  }
  for (const uniform of Object.values(material.uniforms || {})) {
    prewarmTextureUpload(uniform?.value, seen);
  }
}

function prewarmSceneTextureUploads(root = scene) {
  const started = performance.now();
  sceneTexturePrewarmStats.supported = typeof renderer.initTexture === 'function';
  sceneTexturePrewarmStats.attempted = 0;
  sceneTexturePrewarmStats.uploaded = 0;
  sceneTexturePrewarmStats.errors = 0;
  if (!sceneTexturePrewarmStats.supported) return sceneTexturePrewarmStats;
  const seen = new Set();
  root.traverse((object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) prewarmMaterialTextureUploads(material, seen);
  });
  sceneTexturePrewarmStats.durationMs = Number((performance.now() - started).toFixed(2));
  return sceneTexturePrewarmStats;
}

function prewarmSkinnedMeshBoneTextures(root = scene) {
  const started = performance.now();
  skinnedMeshPrewarmStats.attempted = 0;
  skinnedMeshPrewarmStats.created = 0;
  skinnedMeshPrewarmStats.uploaded = 0;
  skinnedMeshPrewarmStats.errors = 0;
  const seenSkeletons = new Set();
  root.traverse((object) => {
    if (!object?.isSkinnedMesh || !object.skeleton || seenSkeletons.has(object.skeleton)) return;
    seenSkeletons.add(object.skeleton);
    skinnedMeshPrewarmStats.attempted += 1;
    try {
      if (!object.skeleton.boneTexture && typeof object.skeleton.computeBoneTexture === 'function') {
        object.skeleton.computeBoneTexture();
        skinnedMeshPrewarmStats.created += 1;
      }
      if (object.skeleton.boneTexture) {
        renderer.initTexture?.(object.skeleton.boneTexture);
        skinnedMeshPrewarmStats.uploaded += 1;
      }
    } catch {
      skinnedMeshPrewarmStats.errors += 1;
    }
  });
  skinnedMeshPrewarmStats.durationMs = Number((performance.now() - started).toFixed(2));
  return skinnedMeshPrewarmStats;
}

async function prewarmHiddenSkinnedMeshRender(root = scene) {
  const started = performance.now();
  hiddenSkinnedRenderPrewarmStats.attempted = 0;
  hiddenSkinnedRenderPrewarmStats.forcedVisible = 0;
  hiddenSkinnedRenderPrewarmStats.forcedUnculled = 0;
  hiddenSkinnedRenderPrewarmStats.rendered = false;
  hiddenSkinnedRenderPrewarmStats.errors = 0;
  hiddenSkinnedRenderPrewarmStats.texturesBefore = renderer.info.memory?.textures ?? 0;
  hiddenSkinnedRenderPrewarmStats.texturesAfter = hiddenSkinnedRenderPrewarmStats.texturesBefore;
  if (typeof renderer.render !== 'function') return hiddenSkinnedRenderPrewarmStats;

  const visibilityState = [];
  const frustumState = [];
  const seenVisibility = new Set();
  try {
    root.traverse((object) => {
      if (!object?.isSkinnedMesh) return;
      hiddenSkinnedRenderPrewarmStats.attempted += 1;
      if (object.frustumCulled) {
        frustumState.push([object, object.frustumCulled]);
        object.frustumCulled = false;
        hiddenSkinnedRenderPrewarmStats.forcedUnculled += 1;
      }
      let current = object;
      while (current && current !== root.parent) {
        if (!seenVisibility.has(current) && current.visible === false) {
          seenVisibility.add(current);
          visibilityState.push([current, current.visible]);
          current.visible = true;
          hiddenSkinnedRenderPrewarmStats.forcedVisible += 1;
        }
        if (current === root) break;
        current = current.parent;
      }
    });

    if (hiddenSkinnedRenderPrewarmStats.attempted > 0) {
      const target = new THREE.WebGLRenderTarget(4, 4, {
        depthBuffer: true,
        stencilBuffer: false,
      });
      // The program variant depends on the bound render target (output colour
      // space and tone mapping are only applied when drawing to the screen), and
      // the real frames draw the scene into the composer's target, never to the
      // screen. So both the compile and the warm render below run with an
      // off-screen target bound, or the compile would link the on-screen variants
      // and the render would compile the whole set again, synchronously.
      const withPrewarmTarget = (run) => {
        const previousRenderTarget = renderer.getRenderTarget();
        const previousAutoClear = renderer.autoClear;
        renderer.setRenderTarget(target);
        renderer.autoClear = true;
        try {
          return run();
        } finally {
          renderer.setRenderTarget(previousRenderTarget);
          renderer.autoClear = previousAutoClear;
        }
      };
      try {
        // compileAsync lets the driver link the program set on its own threads
        // (KHR_parallel_shader_compile) instead of blocking this task on every
        // program in turn. Its program creation is synchronous — only the link
        // wait is deferred — so the target is bound just for the call, not
        // across the await, where a frame could otherwise render into it.
        if (typeof renderer.compileAsync === 'function') {
          try {
            await withPrewarmTarget(() => renderer.compileAsync(root, camera));
          } catch {
            hiddenSkinnedRenderPrewarmStats.errors += 1;
          }
        }
        withPrewarmTarget(() => {
          renderer.clear();
          renderer.render(root, camera);
        });
        hiddenSkinnedRenderPrewarmStats.rendered = true;
      } finally {
        target.dispose();
      }
    }
  } catch {
    hiddenSkinnedRenderPrewarmStats.errors += 1;
  } finally {
    for (let i = visibilityState.length - 1; i >= 0; i -= 1) {
      visibilityState[i][0].visible = visibilityState[i][1];
    }
    for (let i = frustumState.length - 1; i >= 0; i -= 1) {
      frustumState[i][0].frustumCulled = frustumState[i][1];
    }
    hiddenSkinnedRenderPrewarmStats.durationMs = Number((performance.now() - started).toFixed(2));
    hiddenSkinnedRenderPrewarmStats.texturesAfter = renderer.info.memory?.textures ?? 0;
    performanceDiagnostics.setLastTextureCount(hiddenSkinnedRenderPrewarmStats.texturesAfter);
  }
  return hiddenSkinnedRenderPrewarmStats;
}

function prewarmPostProcessingPasses() {
  postProcessingPrewarmStats.attempted = true;
  postProcessingPrewarmStats.rendered = false;
  postProcessingPrewarmStats.postRevealRendered = false;
  postProcessingPrewarmStats.errors = 0;
  const started = performance.now();
  if (!post.composer) return postProcessingPrewarmStats;
  const previousPostEnabled = post.postEnabled;
  const previousBloomEnabled = post.bloomPass?.enabled;
  const previousFxaaEnabled = post.fxaaPass?.enabled;
  const previousRevealState = snapshotCityRevealWireframeState();
  try {
    post.postEnabled = true;
    if (post.bloomPass) post.bloomPass.enabled = true;
    if (post.fxaaPass) post.fxaaPass.enabled = post.antialiasMode === 'fxaa';
    cityRevealRender.syncComposerPasses();
    post.composer.render();
    postProcessingPrewarmStats.rendered = true;
    setCityRevealPostProcessingPrewarmState();
    cityRevealRender.syncComposerPasses();
    post.composer.render();
    postProcessingPrewarmStats.postRevealRendered = true;
  } catch {
    postProcessingPrewarmStats.errors += 1;
  } finally {
    restoreCityRevealWireframeState(previousRevealState);
    post.postEnabled = previousPostEnabled;
    if (post.bloomPass) post.bloomPass.enabled = previousBloomEnabled;
    if (post.fxaaPass) post.fxaaPass.enabled = previousFxaaEnabled;
    cityRevealRender.syncComposerPasses();
    postProcessingPrewarmStats.durationMs = Number((performance.now() - started).toFixed(2));
    postProcessingPrewarmStats.texturesAfter = renderer.info.memory?.textures ?? 0;
    performanceDiagnostics.setLastTextureCount(postProcessingPrewarmStats.texturesAfter);
  }
  return postProcessingPrewarmStats;
}

export async function bootSceneWithFinalDefaults() {
  await controlSettingsRuntime.loadProjectCanonicalDefaults();
  controlSettingsRuntime.loadStoredControlDefaults();
  controlSettingsRuntime.applyRetroFutureRevealTimingDefaults();
  controlSettingsRuntime.applyFullResolutionFsrDefaults();
  applyBridgeFixedDefaults();
  loadStoredPlayerSpawn();
  applyLiveControls();
  buildLabEqualizer({ visible: false });
  setTronNoclip(false, { silent: true });
  applyPlayerSpawn(player.playerSpawn, false);
  await tronRunnerOrchestration.load();
  await tronRunnerCrowdRuntime.drainBuildQueue();
  // Each of these is a heavy synchronous block (bone-texture uploads, a full
  // scene compile + render, two composer renders, then a compile with the reveal
  // clip planes). Chained without a break they form one long main-thread task —
  // hundreds of ms on mobile with input and paint frozen throughout. Yield to the
  // browser between them, and let the driver link programs in parallel where it
  // can (compileAsync, KHR_parallel_shader_compile) before the warm render.
  prewarmSkinnedMeshBoneTextures(scene);
  await waitForNextFrame();
  prewarmSceneTextureUploads(scene);
  await waitForNextFrame();
  await prewarmHiddenSkinnedMeshRender(scene);
  await waitForNextFrame();
  prewarmPostProcessingPasses();
  await waitForNextFrame();
  await ensureFootstepAudioReady();
  await cityRevealRender.prewarmRealPass();
  scheduleDroneIntroAutoFlight();
}

