import * as THREE from 'three';

const CITY_REVEAL_REAL_PREWARM_TARGET_SIZE = 4;

export function createCityRevealRenderRuntime(deps) {
  const {
    renderer,
    scene,
    camera,
    domeMesh,
    getComposer,
    cityRevealSkyScene,
    cityRevealOverlayScene,
    cityRevealOverlayCamera,
    cityRevealWireScene,
    cityRevealRoadGridScene,
    cityRevealMainLedReveal,
    cityRevealRealClipPlane,
    refreshCityRevealSweepBounds,
    setCityRevealSweepFront,
    cityRevealFrontForProgress,
    isCityRevealCompositeActive,
    isCityRevealRealRevealActive,
    isCityRevealBackplateActive,
    syncCityRevealSkyDome,
    renderCityRevealSkyBase,
    syncGlobalFxaaPass,
    shouldUseComposer,
  } = deps;

  let cityRevealSkyPass = null;
  let cityRevealOverlayPass = null;
  let cityRevealWirePass = null;
  let cityRevealRoadGridPass = null;
  let cityRevealScenePass = null;
  let cityRevealRealPrewarmTarget = null;
  let cityRevealRealPrewarmStatus = 'pending';
  let cityRevealRealPrewarmMs = 0;
  let cityRevealRealPrewarmError = '';

  function createCityRevealScenePass() {
    return {
      enabled: true,
      needsSwap: false,
      clear: true,
      clearDepth: false,
      clipReveal: false,
      renderToScreen: false,
      setSize() {},
      render(rendererInstance, writeBuffer, readBuffer) {
        const previousAutoClear = rendererInstance.autoClear;
        const previousClippingPlanes = rendererInstance.clippingPlanes;
        const previousSceneBackground = scene.background;
        const previousDomeVisible = domeMesh.visible;
        rendererInstance.autoClear = false;
        rendererInstance.setRenderTarget(this.renderToScreen ? null : readBuffer);
        if (this.clearDepth) rendererInstance.clearDepth();
        if (this.clear) {
          rendererInstance.clear(
            rendererInstance.autoClearColor,
            rendererInstance.autoClearDepth,
            rendererInstance.autoClearStencil
          );
        }
        rendererInstance.clippingPlanes = this.clipReveal ? [cityRevealRealClipPlane] : [];
        if (this.clipReveal) {
          scene.background = null;
          domeMesh.visible = false;
        }
        rendererInstance.render(scene, camera);
        scene.background = previousSceneBackground;
        domeMesh.visible = previousDomeVisible;
        rendererInstance.clippingPlanes = previousClippingPlanes;
        rendererInstance.autoClear = previousAutoClear;
      },
    };
  }

  function syncComposerPasses() {
    if (!cityRevealScenePass) return;
    const wireActive = isCityRevealCompositeActive();
    const realRevealActive = isCityRevealRealRevealActive();
    const mainLedRevealActive = cityRevealMainLedReveal.isOverlayActive();
    cityRevealMainLedReveal.syncOverlayLayers();
    syncGlobalFxaaPass();
    if (cityRevealSkyPass) cityRevealSkyPass.enabled = wireActive;
    if (cityRevealOverlayPass) cityRevealOverlayPass.enabled = wireActive && isCityRevealBackplateActive();
    if (cityRevealWirePass) cityRevealWirePass.enabled = wireActive;
    if (cityRevealRoadGridPass) cityRevealRoadGridPass.enabled = wireActive;
    cityRevealScenePass.enabled = !wireActive || realRevealActive;
    cityRevealScenePass.clear = !wireActive;
    cityRevealScenePass.clearDepth = realRevealActive;
    cityRevealScenePass.clipReveal = realRevealActive;
    cityRevealMainLedReveal.setPassEnabled(mainLedRevealActive);
    if (!mainLedRevealActive) cityRevealMainLedReveal.resetScissorState();
  }

  function renderSceneWithCityRevealClip() {
    const previousClippingPlanes = renderer.clippingPlanes;
    const previousSceneBackground = scene.background;
    const previousDomeVisible = domeMesh.visible;
    renderer.clippingPlanes = [cityRevealRealClipPlane];
    scene.background = null;
    domeMesh.visible = false;
    renderer.render(scene, camera);
    scene.background = previousSceneBackground;
    domeMesh.visible = previousDomeVisible;
    renderer.clippingPlanes = previousClippingPlanes;
  }

  function prewarmRealPass() {
    if (cityRevealRealPrewarmStatus === 'done' || cityRevealRealPrewarmStatus === 'running') return;
    cityRevealRealPrewarmStatus = 'running';
    cityRevealRealPrewarmError = '';
    const started = performance.now();
    const previousTarget = renderer.getRenderTarget();
    const previousAutoClear = renderer.autoClear;
    const previousClippingPlanes = renderer.clippingPlanes;
    const previousSceneBackground = scene.background;
    const previousDomeVisible = domeMesh.visible;
    const previousCameraLayerMask = camera.layers.mask;
    try {
      refreshCityRevealSweepBounds();
      setCityRevealSweepFront(cityRevealFrontForProgress(0.04));
      if (!cityRevealRealPrewarmTarget) {
        cityRevealRealPrewarmTarget = new THREE.WebGLRenderTarget(
          CITY_REVEAL_REAL_PREWARM_TARGET_SIZE,
          CITY_REVEAL_REAL_PREWARM_TARGET_SIZE,
          { depthBuffer: true, stencilBuffer: false }
        );
        cityRevealRealPrewarmTarget.texture.name = 'city-reveal-real-prewarm-target';
      }
      renderer.setRenderTarget(cityRevealRealPrewarmTarget);
      renderer.autoClear = true;
      renderer.clippingPlanes = [cityRevealRealClipPlane];
      scene.background = null;
      domeMesh.visible = false;
      camera.layers.set(0);
      renderer.compile(scene, camera);
      renderer.render(scene, camera);
      cityRevealRealPrewarmStatus = 'done';
    } catch (error) {
      cityRevealRealPrewarmStatus = 'error';
      cityRevealRealPrewarmError = error?.message || String(error);
      console.warn('[city-reveal-prewarm]', cityRevealRealPrewarmError);
    } finally {
      camera.layers.mask = previousCameraLayerMask;
      scene.background = previousSceneBackground;
      domeMesh.visible = previousDomeVisible;
      renderer.clippingPlanes = previousClippingPlanes;
      renderer.autoClear = previousAutoClear;
      renderer.setRenderTarget(previousTarget);
      cityRevealRealPrewarmMs = performance.now() - started;
      // one-shot prewarm: the guard above prevents re-entry, so free the target's GL buffers now
      cityRevealRealPrewarmTarget?.dispose();
      cityRevealRealPrewarmTarget = null;
    }
  }

  function renderCompositeFrame() {
    const active = isCityRevealCompositeActive();
    cityRevealMainLedReveal.syncOverlayLayers();
    if (shouldUseComposer()) {
      syncComposerPasses();
      if (active) syncCityRevealSkyDome();
      getComposer().render();
      return;
    }

    const previousAutoClear = renderer.autoClear;
    if (!active) {
      renderer.render(scene, camera);
      renderer.autoClear = previousAutoClear;
      return;
    }

    renderCityRevealSkyBase();
    renderer.autoClear = false;
    if (isCityRevealBackplateActive()) renderer.render(cityRevealOverlayScene, cityRevealOverlayCamera);
    renderer.render(cityRevealRoadGridScene, camera);
    renderer.render(cityRevealWireScene, camera);
    const realRevealActive = isCityRevealRealRevealActive();
    if (realRevealActive) {
      renderer.clearDepth();
      renderSceneWithCityRevealClip();
      cityRevealMainLedReveal.renderOverlay(renderer);
    }
    renderer.autoClear = previousAutoClear;
  }

  function addComposerPasses(composer, { RenderPass }) {
    cityRevealSkyPass = new RenderPass(cityRevealSkyScene, camera);
    cityRevealSkyPass.clear = true;
    cityRevealOverlayPass = new RenderPass(cityRevealOverlayScene, cityRevealOverlayCamera);
    cityRevealOverlayPass.clear = false;
    cityRevealWirePass = new RenderPass(cityRevealWireScene, camera);
    cityRevealWirePass.clear = false;
    cityRevealRoadGridPass = new RenderPass(cityRevealRoadGridScene, camera);
    cityRevealRoadGridPass.clear = false;
    cityRevealScenePass = createCityRevealScenePass();
    cityRevealMainLedReveal.createPass();
    syncComposerPasses();
    composer.addPass(cityRevealSkyPass);
    composer.addPass(cityRevealOverlayPass);
    composer.addPass(cityRevealRoadGridPass);
    composer.addPass(cityRevealWirePass);
    composer.addPass(cityRevealScenePass);
    composer.addPass(cityRevealMainLedReveal.getPass());
  }

  function clearComposerPasses() {
    cityRevealSkyPass = null;
    cityRevealOverlayPass = null;
    cityRevealWirePass = null;
    cityRevealRoadGridPass = null;
    cityRevealScenePass = null;
    cityRevealMainLedReveal.clearPass();
  }

  function inspectPasses() {
    return {
      overlay: Boolean(cityRevealOverlayPass?.enabled),
      wireframe: Boolean(cityRevealWirePass?.enabled),
      roadGrid: Boolean(cityRevealRoadGridPass?.enabled),
      realCity: Boolean(cityRevealScenePass?.enabled),
    };
  }

  function inspectRealPrewarm() {
    return {
      status: cityRevealRealPrewarmStatus,
      durationMs: Number(cityRevealRealPrewarmMs.toFixed(2)),
      error: cityRevealRealPrewarmError,
      targetSize: CITY_REVEAL_REAL_PREWARM_TARGET_SIZE,
    };
  }

  return {
    addComposerPasses,
    clearComposerPasses,
    syncComposerPasses,
    renderCompositeFrame,
    prewarmRealPass,
    inspectRealPrewarm,
    inspectPasses,
    getSkyPass: () => cityRevealSkyPass,
    getOverlayPass: () => cityRevealOverlayPass,
    getWirePass: () => cityRevealWirePass,
    getRoadGridPass: () => cityRevealRoadGridPass,
    getScenePass: () => cityRevealScenePass,
  };
}
