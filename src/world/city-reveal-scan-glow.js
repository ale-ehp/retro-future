import * as THREE from 'three';

export function createCityRevealScanGlow(deps) {
  const {
    wireScene,
    color,
    gridBlock,
    getDynamicRoadSurfaceWidth,
    getSideBuildingRecords,
    getMainBuildingRecords,
    getBridgeRecords,
    getRoadTopY,
    getState,
  } = deps;

  const CITY_REVEAL_SCAN_GLOW_ENABLED = true;
  const CITY_REVEAL_SCAN_GLOW_OPACITY = 0.18;
  const CITY_REVEAL_SCAN_GLOW_RENDER_ORDER = 9;
  const CITY_REVEAL_SCAN_GLOW_EDGE_PADDING = gridBlock * 5;
  const CITY_REVEAL_SCAN_GLOW_HEIGHT_PADDING = gridBlock * 2;
  const cityRevealScanGlowGeometry = new THREE.BufferGeometry();
  cityRevealScanGlowGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.5, 0, 0,
    0.5, 0, 0,
    -0.5, 1, 1,
    0.5, 1, 1,
  ], 3));
  cityRevealScanGlowGeometry.setAttribute('uv', new THREE.Float32BufferAttribute([
    0, 0,
    1, 0,
    0, 1,
    1, 1,
  ], 2));
  cityRevealScanGlowGeometry.setIndex([0, 1, 2, 2, 1, 3]);
  const cityRevealScanGlowMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        float sideFade = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));
        float verticalFade = smoothstep(0.0, 0.10, vUv.y) * (1.0 - smoothstep(0.88, 1.0, vUv.y));
        float scan = 0.84 + 0.16 * sin(vUv.y * 34.0 - uTime * 5.5);
        float alpha = uOpacity * sideFade * verticalFade * scan;
        gl_FragColor = vec4(uColor * (1.35 + scan * 0.45), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const cityRevealScanGlowMesh = new THREE.Mesh(cityRevealScanGlowGeometry, cityRevealScanGlowMat);
  cityRevealScanGlowMesh.name = 'city-reveal-scan-glow';
  cityRevealScanGlowMesh.frustumCulled = false;
  cityRevealScanGlowMesh.visible = false;
  cityRevealScanGlowMesh.renderOrder = CITY_REVEAL_SCAN_GLOW_RENDER_ORDER;
  wireScene.add(cityRevealScanGlowMesh);
  // Reused across frames: dimensions() runs once per frame for the whole sweep,
  // which is the window the app already treats as performance-critical.
  const scanGlowDimensionsScratch = { width: 0, height: 0, centerX: 0, baseY: 0 };
  let scanGlowBoundsMinX = 0;
  let scanGlowBoundsMaxX = 0;
  let scanGlowBoundsMaxY = 0;

  function accumulateScanGlowBuildingBounds(records) {
    for (const record of records) {
      const collider = record?.collider;
      if (!collider) continue;
      const halfWidth = Math.abs(Number.isFinite(collider.hw) ? collider.hw : record.baseW * 0.5 || 0);
      scanGlowBoundsMinX = Math.min(scanGlowBoundsMinX, collider.x - halfWidth);
      scanGlowBoundsMaxX = Math.max(scanGlowBoundsMaxX, collider.x + halfWidth);
      scanGlowBoundsMaxY = Math.max(scanGlowBoundsMaxY, (Number.isFinite(collider.y) ? collider.y : 0) + (Number.isFinite(collider.h) ? collider.h : 0));
    }
  }

  function dimensions() {
    // Walk the two record arrays in place: spreading them into one temporary
    // array allocated a fresh copy of every building record every frame.
    scanGlowBoundsMinX = -getDynamicRoadSurfaceWidth() * 0.5;
    scanGlowBoundsMaxX = getDynamicRoadSurfaceWidth() * 0.5;
    scanGlowBoundsMaxY = 230;
    accumulateScanGlowBuildingBounds(getSideBuildingRecords());
    accumulateScanGlowBuildingBounds(getMainBuildingRecords());
    let minX = scanGlowBoundsMinX;
    let maxX = scanGlowBoundsMaxX;
    let maxY = scanGlowBoundsMaxY;
    for (const bridge of getBridgeRecords()) {
      if (!bridge?.mesh?.visible) continue;
      const halfWidth = Math.abs((bridge.baseWidth || 0) * bridge.mesh.scale.x) * 0.5;
      minX = Math.min(minX, bridge.mesh.position.x - halfWidth);
      maxX = Math.max(maxX, bridge.mesh.position.x + halfWidth);
      maxY = Math.max(maxY, bridge.mesh.position.y + Math.abs((bridge.baseHeight || 0) * bridge.mesh.scale.y) * 0.5);
    }
    scanGlowDimensionsScratch.width = Math.max(getDynamicRoadSurfaceWidth() + CITY_REVEAL_SCAN_GLOW_EDGE_PADDING * 2, (maxX - minX) + CITY_REVEAL_SCAN_GLOW_EDGE_PADDING * 2);
    scanGlowDimensionsScratch.height = Math.max(gridBlock * 8, maxY + CITY_REVEAL_SCAN_GLOW_HEIGHT_PADDING);
    scanGlowDimensionsScratch.centerX = (minX + maxX) * 0.5;
    scanGlowDimensionsScratch.baseY = getRoadTopY() + 0.22;
    return scanGlowDimensionsScratch;
  }

  function update(now = performance.now()) {
    const state = getState();
    const active = Boolean(
      CITY_REVEAL_SCAN_GLOW_ENABLED &&
      state.wireframeEnabled &&
      state.startedAt > 0 &&
      !state.complete &&
      state.wireAlpha > 0.002 &&
      state.sweepProgress > 0.002 &&
      state.sweepProgress < 0.998
    );
    const pulse = Math.sin(Math.PI * THREE.MathUtils.clamp(state.sweepProgress, 0, 1));
    const opacity = active ? CITY_REVEAL_SCAN_GLOW_OPACITY * state.wireAlpha * THREE.MathUtils.clamp(0.35 + pulse * 0.65, 0, 1) : 0;
    cityRevealScanGlowMesh.visible = opacity > 0.003;
    cityRevealScanGlowMat.uniforms.uOpacity.value = opacity;
    cityRevealScanGlowMat.uniforms.uTime.value = (Number.isFinite(now) ? now : performance.now()) * 0.001;
    if (!cityRevealScanGlowMesh.visible) return;
    const nextDimensions = dimensions();
    cityRevealScanGlowMesh.position.set(nextDimensions.centerX, nextDimensions.baseY, state.frontZ + nextDimensions.baseY);
    cityRevealScanGlowMesh.scale.set(nextDimensions.width, nextDimensions.height, nextDimensions.height);
  }

  function inspect() {
    const state = getState();
    return {
      enabled: CITY_REVEAL_SCAN_GLOW_ENABLED,
      objectCount: 1,
      visible: Boolean(cityRevealScanGlowMesh.visible),
      opacity: Number(cityRevealScanGlowMat.uniforms.uOpacity.value.toFixed(4)),
      frontZ: Number(state.frontZ.toFixed(3)),
      width: Number(cityRevealScanGlowMesh.scale.x.toFixed(2)),
      height: Number(cityRevealScanGlowMesh.scale.y.toFixed(2)),
      renderOrder: cityRevealScanGlowMesh.renderOrder,
      attachedTo: 'cityRevealFrontZ',
    };
  }

  return {
    update,
    inspect,
  };
}
