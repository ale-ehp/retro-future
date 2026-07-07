import * as THREE from 'three';
import {
  TRON_RUNNER_DYNAMIC_REFLECTION_BODY_MAX_OPACITY,
  TRON_RUNNER_DYNAMIC_REFLECTION_BODY_OPACITY_MULTIPLIER,
  TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
  TRON_RUNNER_DYNAMIC_REFLECTION_LED_MAX_OPACITY,
  TRON_RUNNER_DYNAMIC_REFLECTION_LED_OPACITY_MULTIPLIER,
  TRON_RUNNER_DYNAMIC_REFLECTION_MAX_OPACITY,
  TRON_RUNNER_DYNAMIC_REFLECTION_OPACITY_SCALE,
  TRON_RUNNER_DYNAMIC_REFLECTION_Y,
  TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE,
  TRON_RUNNER_SOURCE_CHARACTER_VISIBLE,
} from './characters.js';
import {
  makeTronRunnerReflectionBodyMaterial,
  makeTronRunnerReflectionLedMaterial,
  makeTronRunnerReflectionMaterial,
} from './character-materials.js';

export function createTronRunnerReflectionRigRuntime({
  runnerWalker,
  runnerParts,
  runnerState,
  suitTexture,
  ledMaskTexture,
  getBasePadMaterialResponse,
  getRoadReflect,
  getRoadRoughness,
  getRoadMetalness,
}) {
  function makeMaterial() {
    return makeTronRunnerReflectionMaterial({ suitTexture });
  }

  function makeBodyMaterial() {
    return makeTronRunnerReflectionBodyMaterial({ suitTexture });
  }

  function makeLedMaterial(colorPreset = null) {
    return makeTronRunnerReflectionLedMaterial({
      colorPreset,
      ledMaskTexture,
    });
  }

  function opacityForSurface(surface) {
    if (!TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED) return 0;
    const isSidewalk = surface === 'sidewalk';
    const basePadMaterial = getBasePadMaterialResponse();
    const reflect = isSidewalk ? basePadMaterial.reflect : Number(getRoadReflect() ?? 0);
    const roughness = isSidewalk ? basePadMaterial.roughness : Number(getRoadRoughness() ?? 1);
    const metalness = isSidewalk ? basePadMaterial.metalness : Number(getRoadMetalness() ?? 0);
    const reflectLimit = isSidewalk ? 3.5 : 2.5;
    const reflectAmount = THREE.MathUtils.clamp(reflect / Math.max(0.001, reflectLimit), 0, 1);
    const smoothness = THREE.MathUtils.clamp(1 - roughness, 0, 1);
    const materialResponse = THREE.MathUtils.lerp(0.86, 1.04, THREE.MathUtils.clamp(metalness, 0, 1));
    const opacity = reflectAmount * smoothness * materialResponse * TRON_RUNNER_DYNAMIC_REFLECTION_MAX_OPACITY;
    return THREE.MathUtils.clamp(opacity, 0, TRON_RUNNER_DYNAMIC_REFLECTION_MAX_OPACITY);
  }

  function bodyOpacityForSurface(surface) {
    return Math.min(
      TRON_RUNNER_DYNAMIC_REFLECTION_BODY_MAX_OPACITY,
      opacityForSurface(surface) * TRON_RUNNER_DYNAMIC_REFLECTION_BODY_OPACITY_MULTIPLIER
    ) * TRON_RUNNER_DYNAMIC_REFLECTION_OPACITY_SCALE;
  }

  function ledOpacityForSurface(surface) {
    return Math.min(
      TRON_RUNNER_DYNAMIC_REFLECTION_LED_MAX_OPACITY,
      opacityForSurface(surface) * TRON_RUNNER_DYNAMIC_REFLECTION_LED_OPACITY_MULTIPLIER
    ) * TRON_RUNNER_DYNAMIC_REFLECTION_OPACITY_SCALE;
  }

  function updateDynamicReflection() {
    const group = runnerParts.reflectionGroup;
    const bodyMaterials = runnerParts.reflectionBodyMaterials || [];
    const ledMaterials = runnerParts.reflectionLedMaterials || [];
    const bodyOpacity = bodyOpacityForSurface(runnerState.surface);
    const ledOpacity = ledOpacityForSurface(runnerState.surface);
    const visible = Boolean(
      TRON_RUNNER_SOURCE_CHARACTER_VISIBLE &&
      TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED &&
      group &&
      runnerParts.reflectionModel &&
      bodyOpacity > 0.005
    );
    if (group) {
      group.visible = visible;
      group.position.y = TRON_RUNNER_DYNAMIC_REFLECTION_Y;
      group.scale.set(1, -TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE, 1);
    }
    for (const material of bodyMaterials) {
      material.userData.tronRunnerBaseOpacity = bodyOpacity;
      // opacity is a uniform; skip the redundant write + program refresh when unchanged (mirrors character-reflections)
      if (Math.abs((material.opacity ?? 0) - bodyOpacity) > 0.002) {
        material.opacity = bodyOpacity;
      }
    }
    for (const material of ledMaterials) {
      material.userData.tronRunnerBaseOpacity = ledOpacity;
      if (Math.abs((material.opacity ?? 0) - ledOpacity) > 0.002) {
        material.opacity = ledOpacity;
      }
    }
    runnerState.dynamicReflectionVisible = visible;
    runnerState.dynamicReflectionOpacity = bodyOpacity;
    runnerState.dynamicReflectionBodyOpacity = bodyOpacity;
    runnerState.dynamicReflectionLedOpacity = ledOpacity;
    runnerState.dynamicReflectionSurface = runnerState.surface;
    runnerState.dynamicReflectionMeshCount = runnerParts.dynamicReflectionMeshCount;
    runnerState.dynamicReflectionLedMeshCount = runnerParts.dynamicReflectionLedMeshCount;
    runnerState.dynamicReflectionAnimated = Boolean(runnerParts.reflectionMixer && runnerParts.reflectionLedMixer);
  }

  return {
    makeMaterial,
    makeBodyMaterial,
    makeLedMaterial,
    opacityForSurface,
    bodyOpacityForSurface,
    ledOpacityForSurface,
    updateDynamicReflection,
  };
}
