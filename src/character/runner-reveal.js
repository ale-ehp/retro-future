import * as THREE from 'three';
import {
  TRON_RUNNER_GROUND_SHADOW_ENABLED,
  TRON_RUNNER_IDLE_CHARACTER_ENABLED,
  TRON_RUNNER_REAL_SHADOW_ENABLED,
  TRON_RUNNER_REVEAL_DURATION_MS,
  TRON_RUNNER_REVEAL_EMISSIVE_BOOST,
  TRON_RUNNER_REVEAL_ENABLED,
  TRON_RUNNER_REVEAL_SCAN_CORE_OPACITY,
  TRON_RUNNER_REVEAL_SCAN_OUTER_OPACITY,
  TRON_RUNNER_REVEAL_SCAN_RADIUS,
  TRON_RUNNER_REVEAL_SCAN_TUBE,
  TRON_RUNNER_SOURCE_CHARACTER_VISIBLE,
  TRON_RUNNER_TARGET_HEIGHT,
} from './characters.js';
import {
  createTronRunnerRevealVisualCache,
} from './runner-state.js';

function baseMaterialOpacity(material, fallback = 1) {
  return Number.isFinite(material?.userData?.tronRunnerBaseOpacity)
    ? material.userData.tronRunnerBaseOpacity
    : fallback;
}

function revealEase(t) {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export function createTronRunnerRevealRuntime({
  runnerState,
  runnerParts,
  runnerWalker,
  crowd,
  idleCharacter,
  idleCharacterGroup,
  syncCrowdVisibility,
  getCityRevealComplete,
}) {
  let startedAt = 0;
  let progress = TRON_RUNNER_REVEAL_ENABLED ? 0 : 1;
  let rawProgress = TRON_RUNNER_REVEAL_ENABLED ? 0 : 1;
  let active = false;
  let complete = !TRON_RUNNER_REVEAL_ENABLED;
  const visualCache = createTronRunnerRevealVisualCache();

  function makeScan() {
    const scanMaterial = new THREE.MeshBasicMaterial({
      color: 0x62f7ff,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0,
      toneMapped: false,
      transparent: true,
    });
    const scan = new THREE.Group();
    scan.name = 'tron-runner-reveal-scan';
    scan.visible = false;
    const outer = new THREE.Mesh(
      new THREE.TorusGeometry(TRON_RUNNER_REVEAL_SCAN_RADIUS, TRON_RUNNER_REVEAL_SCAN_TUBE, 8, 96),
      scanMaterial
    );
    outer.name = 'tron-runner-reveal-scan-ring';
    outer.rotation.x = Math.PI / 2;
    outer.scale.set(1, 0.58, 1);
    scan.add(outer);
    const inner = new THREE.Mesh(
      new THREE.TorusGeometry(TRON_RUNNER_REVEAL_SCAN_RADIUS * 0.72, TRON_RUNNER_REVEAL_SCAN_TUBE * 0.55, 8, 72),
      scanMaterial.clone()
    );
    inner.name = 'tron-runner-reveal-scan-core';
    inner.rotation.x = Math.PI / 2;
    inner.scale.set(1, 0.52, 1);
    scan.add(inner);
    return scan;
  }

  function setState(nextProgress, nextRawProgress, phase, nextActive, nextComplete) {
    progress = THREE.MathUtils.clamp(nextProgress, 0, 1);
    rawProgress = THREE.MathUtils.clamp(nextRawProgress, 0, 1);
    active = Boolean(nextActive);
    complete = Boolean(nextComplete);
    runnerState.reveal = {
      enabled: TRON_RUNNER_REVEAL_ENABLED,
      mode: 'post-city-scan-pulse',
      durationMs: TRON_RUNNER_REVEAL_DURATION_MS,
      phase,
      progress: Number(progress.toFixed(3)),
      rawProgress: Number(rawProgress.toFixed(3)),
      active,
      complete,
      visibleFactor: Number(progress.toFixed(3)),
      scanVisible: Boolean(runnerParts.revealScan?.visible),
      scanY: Number((runnerParts.revealScan?.position.y ?? 0).toFixed(3)),
      emissiveBoost: TRON_RUNNER_REVEAL_EMISSIVE_BOOST,
      scanOuterOpacity: TRON_RUNNER_REVEAL_SCAN_OUTER_OPACITY,
      scanCoreOpacity: TRON_RUNNER_REVEAL_SCAN_CORE_OPACITY,
    };
  }

  function revealVisible(factor = visibleFactor()) {
    return factor > 0.002 || active || complete;
  }

  function syncIdleVisibility(factor = visibleFactor()) {
    const visible = Boolean(
      TRON_RUNNER_IDLE_CHARACTER_ENABLED &&
      idleCharacter.built &&
      runnerState.ready &&
      revealVisible(factor)
    );
    idleCharacterGroup.visible = visible;
    idleCharacter.visible = visible;
  }

  function applyCrowdRevealVisuals(factor, revealComplete, activePulse) {
    const revealOpacity = revealComplete ? 1 : factor;
    for (const member of crowd) {
      for (const material of member.materials || []) {
        const baseOpacity = baseMaterialOpacity(material, material.opacity);
        const baseEmissive = Number.isFinite(material.userData?.tronRunnerBaseEmissiveIntensity)
          ? material.userData.tronRunnerBaseEmissiveIntensity
          : material.emissiveIntensity;
        material.transparent = !revealComplete;
        material.opacity = baseOpacity * revealOpacity;
        material.depthWrite = revealComplete;
        if (Number.isFinite(material.emissiveIntensity)) {
          material.emissiveIntensity = revealComplete
            ? baseEmissive
            : baseEmissive * (0.2 + factor * 0.8) + activePulse * TRON_RUNNER_REVEAL_EMISSIVE_BOOST;
        }
        material.needsUpdate = true;
      }
    }
    runnerState.crowdRevealMaterialOpacity = revealOpacity;
  }

  function applyIdleCharacterRevealVisuals(factor, revealComplete, activePulse) {
    syncIdleVisibility(factor);
    if (!idleCharacter.built) return;
    const revealOpacity = revealComplete ? 1 : factor;
    for (const material of idleCharacter.materials || []) {
      const baseOpacity = baseMaterialOpacity(material, material.opacity);
      const baseEmissive = Number.isFinite(material.userData?.tronRunnerBaseEmissiveIntensity)
        ? material.userData.tronRunnerBaseEmissiveIntensity
        : material.emissiveIntensity;
      material.transparent = !revealComplete;
      material.opacity = baseOpacity * revealOpacity;
      material.depthWrite = revealComplete;
      if (Number.isFinite(material.emissiveIntensity)) {
        material.emissiveIntensity = revealComplete
          ? baseEmissive
          : baseEmissive * (0.2 + factor * 0.8) + activePulse * TRON_RUNNER_REVEAL_EMISSIVE_BOOST;
      }
      material.needsUpdate = true;
    }
  }

  function applyVisuals() {
    const factor = visibleFactor();
    const revealComplete = factor >= 0.995 || !TRON_RUNNER_REVEAL_ENABLED;
    const activePulse = active ? Math.sin(Math.PI * rawProgress) : 0;
    const cacheProgress = Number(factor.toFixed(4));
    const cacheRawProgress = Number(rawProgress.toFixed(4));
    if (
      visualCache.ready === runnerState.ready &&
      visualCache.progress === cacheProgress &&
      visualCache.rawProgress === cacheRawProgress &&
      visualCache.active === active &&
      visualCache.complete === revealComplete &&
      visualCache.crowdCount === crowd.length &&
      visualCache.idleBuilt === idleCharacter.built &&
      visualCache.sourceVisible === TRON_RUNNER_SOURCE_CHARACTER_VISIBLE
    ) {
      return;
    }
    visualCache.ready = runnerState.ready;
    visualCache.progress = cacheProgress;
    visualCache.rawProgress = cacheRawProgress;
    visualCache.active = active;
    visualCache.complete = revealComplete;
    visualCache.crowdCount = crowd.length;
    visualCache.idleBuilt = idleCharacter.built;
    visualCache.sourceVisible = TRON_RUNNER_SOURCE_CHARACTER_VISIBLE;
    const shouldRenderRunner = Boolean(
      TRON_RUNNER_SOURCE_CHARACTER_VISIBLE &&
      runnerState.ready &&
      (factor > 0.002 || active || revealComplete)
    );
    runnerWalker.visible = shouldRenderRunner;
    syncCrowdVisibility();

    for (const material of runnerParts.materials) {
      const baseEmissive = Number.isFinite(material.userData.tronRunnerBaseEmissiveIntensity)
        ? material.userData.tronRunnerBaseEmissiveIntensity
        : material.emissiveIntensity;
      material.transparent = !revealComplete;
      material.opacity = revealComplete ? 1 : factor;
      material.depthWrite = revealComplete;
      material.emissiveIntensity = revealComplete
        ? baseEmissive
        : baseEmissive * (0.2 + factor * 0.8) + activePulse * TRON_RUNNER_REVEAL_EMISSIVE_BOOST;
      material.needsUpdate = true;
    }
    applyCrowdRevealVisuals(factor, revealComplete, activePulse);
    applyIdleCharacterRevealVisuals(factor, revealComplete, activePulse);

    const groundShadow = runnerParts.groundShadow;
    if (groundShadow?.material) {
      const baseOpacity = baseMaterialOpacity(groundShadow.material, groundShadow.material.opacity);
      groundShadow.visible = shouldRenderRunner && TRON_RUNNER_GROUND_SHADOW_ENABLED && baseOpacity * factor > 0.002;
      groundShadow.material.opacity = baseOpacity * factor;
      groundShadow.material.needsUpdate = true;
    }

    const realShadowReceiver = runnerParts.realShadowReceiver;
    if (realShadowReceiver?.material) {
      const baseOpacity = baseMaterialOpacity(realShadowReceiver.material, realShadowReceiver.material.opacity);
      realShadowReceiver.visible = shouldRenderRunner && baseOpacity * factor > 0.002;
      realShadowReceiver.material.opacity = baseOpacity * factor;
      realShadowReceiver.material.needsUpdate = true;
      runnerState.realShadowOpacity = baseOpacity * factor;
    }

    if (runnerParts.realShadowLight) {
      runnerParts.realShadowLight.visible = shouldRenderRunner && TRON_RUNNER_REAL_SHADOW_ENABLED && factor > 0.01;
      runnerParts.realShadowLight.intensity = shouldRenderRunner && TRON_RUNNER_REAL_SHADOW_ENABLED ? 0.16 * factor : 0;
    }

    const reflectionGroup = runnerParts.reflectionGroup;
    const reflectionFactor = revealComplete ? 1 : factor;
    if (reflectionGroup) reflectionGroup.visible = shouldRenderRunner && reflectionGroup.visible && reflectionFactor > 0.01;
    for (const material of runnerParts.reflectionMaterials || []) {
      const baseOpacity = baseMaterialOpacity(material, material.opacity);
      material.opacity = baseOpacity * reflectionFactor;
      material.needsUpdate = true;
    }
    runnerState.dynamicReflectionOpacity *= reflectionFactor;
    runnerState.dynamicReflectionBodyOpacity *= reflectionFactor;
    runnerState.dynamicReflectionLedOpacity *= reflectionFactor;

    const scan = runnerParts.revealScan;
    if (scan) {
      const scanPulse = active ? Math.sin(Math.PI * rawProgress) : 0;
      const scanY = TRON_RUNNER_TARGET_HEIGHT * THREE.MathUtils.lerp(0.06, 0.98, progress);
      scan.position.y = scanY;
      scan.visible = active && scanPulse > 0.02;
      scan.scale.setScalar(1 + scanPulse * 0.08);
      scan.traverse((object) => {
        if (!object.material) return;
        object.material.opacity = scanPulse * (object.name.includes('core')
          ? TRON_RUNNER_REVEAL_SCAN_CORE_OPACITY
          : TRON_RUNNER_REVEAL_SCAN_OUTER_OPACITY);
        object.material.needsUpdate = true;
      });
    }

    const phase = complete ? 'complete' : active ? 'active' : 'waiting-city';
    setState(factor, rawProgress, phase, active, complete);
  }

  function reset() {
    startedAt = 0;
    const revealComplete = !TRON_RUNNER_REVEAL_ENABLED;
    setState(
      revealComplete ? 1 : 0,
      revealComplete ? 1 : 0,
      revealComplete ? 'complete' : 'waiting-city',
      false,
      revealComplete
    );
    applyVisuals();
  }

  function start(now) {
    if (!TRON_RUNNER_REVEAL_ENABLED) {
      setState(1, 1, 'complete', false, true);
      applyVisuals();
      return;
    }
    startedAt = now;
    setState(0, 0, 'active', true, false);
    applyVisuals();
  }

  function update(now) {
    if (!runnerState.ready) {
      reset();
      return;
    }
    if (!TRON_RUNNER_REVEAL_ENABLED) {
      setState(1, 1, 'complete', false, true);
      applyVisuals();
      return;
    }
    if (!getCityRevealComplete()) {
      if (startedAt || progress > 0 || complete) reset();
      else applyVisuals();
      return;
    }
    if (!startedAt && !complete) {
      start(now);
      return;
    }
    if (complete) {
      applyVisuals();
      return;
    }
    const raw = THREE.MathUtils.clamp((now - startedAt) / TRON_RUNNER_REVEAL_DURATION_MS, 0, 1);
    const eased = revealEase(raw);
    if (raw >= 1) {
      setState(1, 1, 'complete', false, true);
    } else {
      setState(eased, raw, 'active', true, false);
    }
    applyVisuals();
  }

  function visibleFactor() {
    return THREE.MathUtils.clamp(TRON_RUNNER_REVEAL_ENABLED ? progress : 1, 0, 1);
  }

  function isComplete() {
    return complete;
  }

  function isActive() {
    return active;
  }

  function startedAtTime() {
    return startedAt;
  }

  function progressValue() {
    return progress;
  }

  return {
    applyVisuals,
    isActive,
    isComplete,
    makeScan,
    progress: progressValue,
    revealVisible,
    reset,
    startedAt: startedAtTime,
    syncIdleVisibility,
    update,
    visibleFactor,
  };
}
