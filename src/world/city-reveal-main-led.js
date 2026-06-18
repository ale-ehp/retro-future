import * as THREE from 'three';

export function createCityRevealMainLed(deps) {
  const {
    scene,
    camera,
    domeMesh,
    getCityRevealStartedAt,
    getCityRevealEffectiveDelayMs,
    isCityRevealRealRevealActive,
    getMainFacadeVerticalRevealProgress,
    getSideBuildingRecords,
    getMainBuildingRecords,
    getBridgeRecords,
  } = deps;
  let pass = null;

  const CITY_REVEAL_MAIN_LED_LAYER = 2;
  const mainBuildingVerticalRevealOverlayObjects = new Set();
  let mainBuildingVerticalRevealOverlayLayerActive = false;
  const CITY_REVEAL_MAIN_LED_VISIBLE_DELAY_MS = 1500;
  const CITY_REVEAL_MAIN_LED_OVERLAY_COMPLETE_PROGRESS = 0.999;
  const CITY_REVEAL_MAIN_LED_SCISSOR_ENABLED = true;
  const CITY_REVEAL_MAIN_LED_SCISSOR_PADDING_PX = 96;
  const CITY_REVEAL_MAIN_LED_SCISSOR_MIN_WIDTH_RATIO = 0.16;
  const CITY_REVEAL_MAIN_LED_SCISSOR_MIN_HEIGHT_RATIO = 0.34;
  const cityRevealMainLedDepthMat = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
  });
  const cityRevealMainLedDepthScene = new THREE.Scene();
  const cityRevealMainLedDepthGroup = new THREE.Group();
  const cityRevealMainLedDepthProxyGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cityRevealMainLedDepthProxyObjects = [];
  let cityRevealMainLedDepthProxyVisibleCount = 0;
  let cityRevealMainLedDepthProxyLastMode = 'idle';
  cityRevealMainLedDepthScene.add(cityRevealMainLedDepthGroup);
  const cityRevealMainLedScissorBox = new THREE.Box3();
  const cityRevealMainLedScissorObjectBox = new THREE.Box3();
  const cityRevealMainLedScissorCorner = new THREE.Vector3();
  const cityRevealMainLedScissorBufferSize = new THREE.Vector2();
  const cityRevealMainLedPreviousScissor = new THREE.Vector4();
  const cityRevealMainLedScissorState = {
    enabled: CITY_REVEAL_MAIN_LED_SCISSOR_ENABLED,
    active: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    targetWidth: 0,
    targetHeight: 0,
    paddingPx: CITY_REVEAL_MAIN_LED_SCISSOR_PADDING_PX,
  };
  function setCityRevealMainLedObjectLayer(object, layer) {
    if (!object?.layers) return;
    object.layers.disableAll();
    object.layers.enable(layer);
  }

  function registerOverlayObject(object) {
    if (!object) return;
    mainBuildingVerticalRevealOverlayObjects.add(object);
    if (mainBuildingVerticalRevealOverlayLayerActive) {
      setCityRevealMainLedObjectLayer(object, CITY_REVEAL_MAIN_LED_LAYER);
    }
  }

  function revealElapsedMs(now = performance.now()) {
    if (!getCityRevealStartedAt()) return 0;
    return Math.max(0, now - getCityRevealStartedAt() - getCityRevealEffectiveDelayMs() - CITY_REVEAL_MAIN_LED_VISIBLE_DELAY_MS);
  }

  function isOverlayActive(now = performance.now()) {
    return isCityRevealRealRevealActive()
      && revealElapsedMs(now) > 0
      && getMainFacadeVerticalRevealProgress() < CITY_REVEAL_MAIN_LED_OVERLAY_COMPLETE_PROGRESS
      && mainBuildingVerticalRevealOverlayObjects.size > 0;
  }

  function syncOverlayLayers() {
    const active = isOverlayActive();
    if (active === mainBuildingVerticalRevealOverlayLayerActive) return;
    mainBuildingVerticalRevealOverlayLayerActive = active;
    const layer = active ? CITY_REVEAL_MAIN_LED_LAYER : 0;
    for (const object of mainBuildingVerticalRevealOverlayObjects) {
      setCityRevealMainLedObjectLayer(object, layer);
    }
  }

  function ensureCityRevealMainLedDepthProxyCount(count) {
    while (cityRevealMainLedDepthProxyObjects.length < count) {
      const proxy = new THREE.Mesh(cityRevealMainLedDepthProxyGeometry, cityRevealMainLedDepthMat);
      proxy.name = 'city-reveal-main-led-depth-proxy';
      proxy.frustumCulled = false;
      proxy.visible = false;
      cityRevealMainLedDepthProxyObjects.push(proxy);
      cityRevealMainLedDepthGroup.add(proxy);
    }
  }

  function cityRevealMainLedDepthSources() {
    const sources = [];
    for (const record of [...getSideBuildingRecords(), ...getMainBuildingRecords()]) {
      const collider = record.collider;
      if (!record.mesh || !collider) continue;
      const width = Math.abs(collider.hw * 2);
      const height = Math.abs(collider.h);
      const depth = Math.abs(collider.hd * 2);
      if (![width, height, depth].every(Number.isFinite) || width <= 0.001 || height <= 0.001 || depth <= 0.001) continue;
      sources.push({
        visible: record.mesh.visible !== false,
        x: Number.isFinite(collider.x) ? collider.x : record.mesh.position.x,
        y: (Number.isFinite(collider.y) ? collider.y : record.mesh.position.y) + height * 0.5,
        z: Number.isFinite(collider.z) ? collider.z : record.mesh.position.z,
        width,
        height,
        depth,
      });
    }
    for (const record of getBridgeRecords()) {
      if (!record.mesh) continue;
      const width = Math.abs(record.baseWidth * record.mesh.scale.x);
      const height = Math.abs(record.baseHeight * record.mesh.scale.y);
      const depth = Math.abs(record.baseDepth * record.mesh.scale.z);
      if (![width, height, depth].every(Number.isFinite) || width <= 0.001 || height <= 0.001 || depth <= 0.001) continue;
      sources.push({
        visible: record.mesh.visible !== false,
        x: record.mesh.position.x,
        y: record.mesh.position.y + height * 0.5,
        z: record.mesh.position.z,
        width,
        height,
        depth,
      });
    }
    return sources;
  }

  function syncCityRevealMainLedDepthProxies() {
    const sources = cityRevealMainLedDepthSources();
    ensureCityRevealMainLedDepthProxyCount(sources.length);
    cityRevealMainLedDepthProxyVisibleCount = 0;
    for (let i = 0; i < cityRevealMainLedDepthProxyObjects.length; i++) {
      const proxy = cityRevealMainLedDepthProxyObjects[i];
      const source = sources[i];
      if (!source || !source.visible) {
        proxy.visible = false;
        continue;
      }
      proxy.position.set(source.x, source.y, source.z);
      proxy.scale.set(source.width, source.height, source.depth);
      proxy.visible = true;
      cityRevealMainLedDepthProxyVisibleCount++;
    }
    cityRevealMainLedDepthGroup.visible = cityRevealMainLedDepthProxyVisibleCount > 0;
    return cityRevealMainLedDepthProxyVisibleCount;
  }

  function resetScissorState() {
    cityRevealMainLedScissorState.active = false;
    cityRevealMainLedScissorState.x = 0;
    cityRevealMainLedScissorState.y = 0;
    cityRevealMainLedScissorState.width = 0;
    cityRevealMainLedScissorState.height = 0;
    cityRevealMainLedScissorState.targetWidth = 0;
    cityRevealMainLedScissorState.targetHeight = 0;
  }

  function cityRevealMainLedTargetSize(rendererInstance, target) {
    if (target?.width && target?.height) {
      return { width: target.width, height: target.height };
    }
    rendererInstance.getDrawingBufferSize(cityRevealMainLedScissorBufferSize);
    return {
      width: cityRevealMainLedScissorBufferSize.x,
      height: cityRevealMainLedScissorBufferSize.y,
    };
  }

  function cityRevealMainLedOverlayScissorRect(rendererInstance, target = null) {
    if (!CITY_REVEAL_MAIN_LED_SCISSOR_ENABLED) {
      resetScissorState();
      return null;
    }
    cityRevealMainLedScissorBox.makeEmpty();
    let hasBounds = false;
    for (const object of mainBuildingVerticalRevealOverlayObjects) {
      if (!object?.visible) continue;
      cityRevealMainLedScissorObjectBox.setFromObject(object);
      if (cityRevealMainLedScissorObjectBox.isEmpty()) continue;
      cityRevealMainLedScissorBox.union(cityRevealMainLedScissorObjectBox);
      hasBounds = true;
    }
    const { width: targetWidth, height: targetHeight } = cityRevealMainLedTargetSize(rendererInstance, target);
    if (!hasBounds || targetWidth <= 0 || targetHeight <= 0) {
      resetScissorState();
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const min = cityRevealMainLedScissorBox.min;
    const max = cityRevealMainLedScissorBox.max;
    for (let ix = 0; ix < 2; ix++) {
      for (let iy = 0; iy < 2; iy++) {
        for (let iz = 0; iz < 2; iz++) {
          cityRevealMainLedScissorCorner.set(
            ix ? max.x : min.x,
            iy ? max.y : min.y,
            iz ? max.z : min.z
          );
          cityRevealMainLedScissorCorner.project(camera);
          if (![
            cityRevealMainLedScissorCorner.x,
            cityRevealMainLedScissorCorner.y,
            cityRevealMainLedScissorCorner.z,
          ].every(Number.isFinite)) continue;
          const x = (cityRevealMainLedScissorCorner.x * 0.5 + 0.5) * targetWidth;
          const y = (-cityRevealMainLedScissorCorner.y * 0.5 + 0.5) * targetHeight;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (![minX, minY, maxX, maxY].every(Number.isFinite) || maxX <= minX || maxY <= minY) {
      resetScissorState();
      return null;
    }

    const pixelScale = targetWidth / Math.max(1, window.innerWidth || targetWidth);
    const padding = CITY_REVEAL_MAIN_LED_SCISSOR_PADDING_PX * Math.max(1, pixelScale);
    const minWidth = targetWidth * CITY_REVEAL_MAIN_LED_SCISSOR_MIN_WIDTH_RATIO;
    const minHeight = targetHeight * CITY_REVEAL_MAIN_LED_SCISSOR_MIN_HEIGHT_RATIO;
    const unclampedWidth = Math.max(maxX - minX + padding * 2, minWidth);
    const unclampedHeight = Math.max(maxY - minY + padding * 2, minHeight);
    const rectWidth = Math.min(targetWidth, Math.ceil(unclampedWidth));
    const rectHeight = Math.min(targetHeight, Math.ceil(unclampedHeight));
    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;
    const left = Math.floor(THREE.MathUtils.clamp(centerX - rectWidth * 0.5, 0, Math.max(0, targetWidth - rectWidth)));
    const top = Math.floor(THREE.MathUtils.clamp(centerY - rectHeight * 0.5, 0, Math.max(0, targetHeight - rectHeight)));
    const rect = {
      x: left,
      y: Math.max(0, targetHeight - top - rectHeight),
      width: rectWidth,
      height: rectHeight,
      targetWidth,
      targetHeight,
    };
    cityRevealMainLedScissorState.active = rect.width < targetWidth || rect.height < targetHeight;
    cityRevealMainLedScissorState.x = rect.x;
    cityRevealMainLedScissorState.y = rect.y;
    cityRevealMainLedScissorState.width = rect.width;
    cityRevealMainLedScissorState.height = rect.height;
    cityRevealMainLedScissorState.targetWidth = targetWidth;
    cityRevealMainLedScissorState.targetHeight = targetHeight;
    return cityRevealMainLedScissorState.active ? rect : null;
  }

  function renderOverlay(rendererInstance, target = null) {
    if (!isOverlayActive()) {
      resetScissorState();
      return;
    }
    syncOverlayLayers();
    const previousAutoClear = rendererInstance.autoClear;
    const previousClippingPlanes = rendererInstance.clippingPlanes;
    const previousSceneBackground = scene.background;
    const previousDomeVisible = domeMesh.visible;
    const previousCameraLayerMask = camera.layers.mask;
    const previousOverrideMaterial = scene.overrideMaterial;
    const previousScissorTest = rendererInstance.getScissorTest();
    rendererInstance.getScissor(cityRevealMainLedPreviousScissor);
    const scissorRect = cityRevealMainLedOverlayScissorRect(rendererInstance, target);
    rendererInstance.autoClear = false;
    rendererInstance.setRenderTarget(target);
    rendererInstance.clippingPlanes = [];
    scene.background = null;
    domeMesh.visible = false;
    if (scissorRect) {
      rendererInstance.setScissorTest(true);
      rendererInstance.setScissor(scissorRect.x, scissorRect.y, scissorRect.width, scissorRect.height);
    }
    rendererInstance.clearDepth();
    camera.layers.set(0);
    const depthProxyCount = syncCityRevealMainLedDepthProxies();
    if (depthProxyCount > 0) {
      cityRevealMainLedDepthProxyLastMode = 'proxy-depth-mask';
      rendererInstance.render(cityRevealMainLedDepthScene, camera);
    } else {
      cityRevealMainLedDepthProxyLastMode = 'scene-depth-mask-fallback';
      scene.overrideMaterial = cityRevealMainLedDepthMat;
      rendererInstance.render(scene, camera);
      scene.overrideMaterial = previousOverrideMaterial;
    }
    camera.layers.set(CITY_REVEAL_MAIN_LED_LAYER);
    rendererInstance.render(scene, camera);
    camera.layers.mask = previousCameraLayerMask;
    scene.overrideMaterial = previousOverrideMaterial;
    scene.background = previousSceneBackground;
    domeMesh.visible = previousDomeVisible;
    rendererInstance.clippingPlanes = previousClippingPlanes;
    rendererInstance.autoClear = previousAutoClear;
    rendererInstance.setScissor(
      cityRevealMainLedPreviousScissor.x,
      cityRevealMainLedPreviousScissor.y,
      cityRevealMainLedPreviousScissor.z,
      cityRevealMainLedPreviousScissor.w
    );
    rendererInstance.setScissorTest(previousScissorTest);
  }

  function createPass() {
    pass = {
      enabled: false,
      needsSwap: false,
      clear: false,
      renderToScreen: false,
      setSize() {},
      render(rendererInstance, writeBuffer, readBuffer) {
        if (!this.enabled) return;
        renderOverlay(rendererInstance, this.renderToScreen ? null : readBuffer);
      },
    };
    return pass;
  }

  function clearPass() {
    pass = null;
  }

  function getPass() {
    return pass;
  }

  function setPassEnabled(enabled) {
    if (pass) pass.enabled = enabled;
  }

  function getDepthProxyVisibleCount() {
    return cityRevealMainLedDepthProxyVisibleCount;
  }

  function getDepthProxyLastMode() {
    return cityRevealMainLedDepthProxyLastMode;
  }

  function getOverlayObjectCount() {
    return mainBuildingVerticalRevealOverlayObjects.size;
  }

  function getDepthGroup() {
    return cityRevealMainLedDepthGroup;
  }

  function inspect() {
    return {
      cityRevealMainLedRevealOverlayObjects: mainBuildingVerticalRevealOverlayObjects.size,
      cityRevealMainLedRevealLayerActive: mainBuildingVerticalRevealOverlayLayerActive,
      cityRevealMainLedRevealDelayMs: CITY_REVEAL_MAIN_LED_VISIBLE_DELAY_MS,
      cityRevealMainLedRevealElapsedMs: revealElapsedMs(),
      cityRevealMainLedRevealReady: isOverlayActive(),
      cityRevealMainLedRevealOptimization: {
        skipCompletedOverlay: true,
        completeProgress: CITY_REVEAL_MAIN_LED_OVERLAY_COMPLETE_PROGRESS,
        currentProgress: Number(getMainFacadeVerticalRevealProgress().toFixed(4)),
        scissorEnabled: CITY_REVEAL_MAIN_LED_SCISSOR_ENABLED,
        scissorActive: cityRevealMainLedScissorState.active,
        scissor: {
          x: cityRevealMainLedScissorState.x,
          y: cityRevealMainLedScissorState.y,
          width: cityRevealMainLedScissorState.width,
          height: cityRevealMainLedScissorState.height,
          targetWidth: cityRevealMainLedScissorState.targetWidth,
          targetHeight: cityRevealMainLedScissorState.targetHeight,
          paddingPx: cityRevealMainLedScissorState.paddingPx,
        },
      },
      cityRevealMainLedOverlayMode: cityRevealMainLedDepthProxyLastMode,
      cityRevealMainLedDepthProxyObjects: cityRevealMainLedDepthProxyObjects.length,
      cityRevealMainLedDepthProxyVisibleObjects: cityRevealMainLedDepthProxyVisibleCount,
    };
  }

  return {
    visibleDelayMs: CITY_REVEAL_MAIN_LED_VISIBLE_DELAY_MS,
    registerOverlayObject,
    revealElapsedMs,
    isOverlayActive,
    syncOverlayLayers,
    renderOverlay,
    createPass,
    clearPass,
    getPass,
    setPassEnabled,
    resetScissorState,
    getDepthProxyVisibleCount,
    getDepthProxyLastMode,
    getOverlayObjectCount,
    getDepthGroup,
    inspect,
  };
}
