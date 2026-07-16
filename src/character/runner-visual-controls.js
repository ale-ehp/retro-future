import * as THREE from 'three';
import {
  TRON_RUNNER_CHARACTER_LED_EMISSIVE_MAX,
  TRON_RUNNER_CONTACT_SHADOW_MAX_OPACITY,
  TRON_RUNNER_CONTACT_SHADOW_ROUNDNESS,
  TRON_RUNNER_CROWD_DISTANCE_DRIVEN_WALK_ENABLED,
  TRON_RUNNER_DISTANCE_DRIVEN_WALK_ENABLED,
  TRON_RUNNER_GROUND_SHADOW_ENABLED,
  TRON_RUNNER_LIGHTING_MODE,
  TRON_RUNNER_SHADOW_COLOR,
  TRON_RUNNER_SHADOW_CYAN_COLOR,
  TRON_RUNNER_SUIT_COLOR,
  TRON_RUNNER_SUIT_EMISSIVE,
  TRON_RUNNER_SUIT_TEXTURE_MODE,
  TRON_RUNNER_TARGET_HEIGHT,
  TRON_RUNNER_WALK_CYCLE_DISTANCE,
} from './characters.js';
import {
  makeTronRunnerShadowTexture,
} from './character-textures.js';

const TRUEY = new Set(['1', 'true', 'on', 'yes']);
const FALSEY = new Set(['0', 'false', 'off', 'no']);

const DEFAULT_GROUNDING_SETTINGS = Object.freeze({
  enabled: false,
  floorReflection: 0.16,
  floorReflectionScale: 0.55,
  shadowSoftness: 1.15,
  shadowPulse: 0.08,
  shadowCyan: 0,
  shadowOffsetZ: 0.2,
});

const CINEMATIC_GROUNDING_SETTINGS = Object.freeze({
  enabled: true,
  floorReflection: 0.31,
  floorReflectionScale: 0.78,
  shadowSoftness: 1.35,
  shadowPulse: 0.12,
  shadowCyan: 0.28,
  shadowOffsetZ: 0.26,
});

export function cinematicGroundingSettingsFromParams(params) {
  const explicit = params?.get?.('cinematicGrounding') ?? params?.get?.('grounding.cinematic');
  if (explicit != null) {
    const normalized = String(explicit).trim().toLowerCase();
    if (FALSEY.has(normalized)) return { ...DEFAULT_GROUNDING_SETTINGS };
    if (TRUEY.has(normalized)) return { ...CINEMATIC_GROUNDING_SETTINGS };
  }
  const grounding = String(params?.get?.('grounding') || '').trim().toLowerCase();
  if (grounding === 'cinematic') return { ...CINEMATIC_GROUNDING_SETTINGS };
  if (grounding === 'default' || grounding === 'classic' || FALSEY.has(grounding)) {
    return { ...DEFAULT_GROUNDING_SETTINGS };
  }
  return { ...DEFAULT_GROUNDING_SETTINGS };
}

export function createTronRunnerShadowTextureState(renderer) {
  return {
    texture: makeTronRunnerShadowTexture(renderer),
    softness: 0.9,
  };
}

function suitLightIntensity(bodyAmount, fillAmount, materialDepth = 0.5) {
  return THREE.MathUtils.clamp(
    0.035 + bodyAmount * 0.025 + fillAmount * 0.006 + materialDepth * 0.018,
    0.025,
    0.16
  );
}

function modelLineIntensity(lineAmount, keyAmount, rimAmount, keyShape = 1, rimShape = 1) {
  if (lineAmount <= 0.001) return 0;
  return THREE.MathUtils.clamp(
    0.08 + lineAmount * 0.09 + keyAmount * 0.025 * keyShape + rimAmount * 0.018 * rimShape,
    0,
    0.62
  );
}

export function applyTronRunnerVisualControls({
  renderer,
  runnerWalker,
  runnerState,
  runnerParts,
  suitTexture,
  suitEmissiveTexture,
  shadowTextureState,
  controls,
  visualDistanceWalked,
  effectiveAnimationSpeed,
  ledScale,
  ledDefaultScale,
  applyCrowdLedControls,
  syncCrowdScaleAndGround,
  applyRevealVisuals,
}) {
  const bodyAmount = THREE.MathUtils.clamp(controls.bodyLight, 0, 3);
  const keyAmount = THREE.MathUtils.clamp(controls.keyLight, 0, 3);
  const rimAmount = THREE.MathUtils.clamp(controls.rimLight, 0, 3);
  const fillAmount = THREE.MathUtils.clamp(controls.fillLight, 0, 3);
  const keyShape = THREE.MathUtils.clamp(controls.keyLightY / 3.1, 0, 1.8);
  const rimShape = THREE.MathUtils.clamp(controls.rimLightX / 1.9, 0.1, 1.8);
  const materialDepth = THREE.MathUtils.clamp((controls.keyLightZ + 4) / 10, 0, 1);
  const selfLightIntensity = suitLightIntensity(bodyAmount, fillAmount, materialDepth);
  const lineIntensity = modelLineIntensity(controls.lineLight, keyAmount, rimAmount, keyShape, rimShape);
  const floorAmount = TRON_RUNNER_GROUND_SHADOW_ENABLED
    ? THREE.MathUtils.clamp(controls.floorReflection, 0, 1.2)
    : 0;
  const materialReflect = THREE.MathUtils.clamp(controls.materialReflect, 0, 2);
  const materialMetalness = THREE.MathUtils.clamp(controls.materialMetalness, 0, 1);
  const materialRoughness = THREE.MathUtils.clamp(controls.materialRoughness, 0.02, 1);
  const shadowSoftness = THREE.MathUtils.clamp(controls.shadowSoftness, 0.2, 1.6);
  const shadowCyan = THREE.MathUtils.clamp(controls.shadowCyan, 0, 1);
  const ledMax = THREE.MathUtils.clamp(
    TRON_RUNNER_CHARACTER_LED_EMISSIVE_MAX * Math.max(1, ledDefaultScale > 0 ? ledScale / ledDefaultScale : 1),
    0.5,
    12
  );
  runnerWalker.scale.setScalar(Math.max(0.01, controls.scale));
  runnerState.scale = controls.scale;
  runnerState.targetHeight = TRON_RUNNER_TARGET_HEIGHT * controls.scale;
  runnerState.walkSpeed = controls.walkSpeed;
  runnerState.animationSpeed = controls.animationSpeed;
  runnerState.effectiveAnimationSpeed = effectiveAnimationSpeed;
  runnerState.strideSync = controls.strideSync;
  runnerState.distanceDrivenWalk = {
    enabled: TRON_RUNNER_DISTANCE_DRIVEN_WALK_ENABLED,
    crowdEnabled: TRON_RUNNER_CROWD_DISTANCE_DRIVEN_WALK_ENABLED,
    cycleDistance: TRON_RUNNER_WALK_CYCLE_DISTANCE,
    visualDistance: Number(visualDistanceWalked.toFixed(3)),
  };
  runnerState.materialReflect = materialReflect;
  runnerState.materialMetalness = materialMetalness;
  runnerState.materialRoughness = materialRoughness;
  runnerState.shadowSoftness = shadowSoftness;
  runnerState.shadowPulse = controls.shadowPulse;
  runnerState.shadowCyan = shadowCyan;
  runnerState.shadowOffsetX = controls.shadowOffsetX;
  runnerState.shadowOffsetZ = controls.shadowOffsetZ;
  runnerState.groundShadowEnabled = TRON_RUNNER_GROUND_SHADOW_ENABLED;
  runnerState.contactShadowMaxOpacity = TRON_RUNNER_CONTACT_SHADOW_MAX_OPACITY;
  runnerState.cinematicGrounding = controls.cinematicGrounding || { enabled: false };
  runnerState.runnerLightingMode = TRON_RUNNER_LIGHTING_MODE;
  runnerState.suitTextureMode = TRON_RUNNER_SUIT_TEXTURE_MODE;
  runnerState.ledBrightness = controls.ledBrightness;
  runnerState.ledBloom = controls.ledBloom;
  runnerState.ledScale = ledScale;
  runnerState.ledEmissiveMax = ledMax;
  runnerState.selfLightIntensity = selfLightIntensity;
  runnerState.modelLineIntensity = lineIntensity;
  runnerState.pointLightCount = 0;
  runnerState.keyLightY = controls.keyLightY;
  runnerState.keyLightZ = controls.keyLightZ;
  runnerState.rimLightX = controls.rimLightX;
  runnerState.fillLightY = controls.fillLightY;

  for (const material of runnerParts.materials) {
    material.map = suitTexture;
    material.emissiveMap = suitEmissiveTexture;
    material.color.copy(TRON_RUNNER_SUIT_COLOR).multiplyScalar(0.82 + bodyAmount * 0.035 + materialDepth * 0.035);
    material.emissive.copy(TRON_RUNNER_SUIT_EMISSIVE);
    material.emissiveIntensity = THREE.MathUtils.clamp(
      (0.34 + selfLightIntensity * 1.05 + lineIntensity * 0.78) * ledScale,
      0.18,
      ledMax
    );
    material.envMapIntensity = materialReflect * 0.12;
    material.metalness = materialMetalness;
    material.roughness = materialRoughness;
    material.userData.tronRunnerBaseOpacity = 1;
    material.userData.tronRunnerBaseEmissiveIntensity = material.emissiveIntensity;
    material.needsUpdate = true;
  }
  applyCrowdLedControls();
  if (runnerParts.activeAction) {
    runnerParts.activeAction.setEffectiveTimeScale(runnerState.effectiveAnimationSpeed);
  }
  if (runnerParts.reflectionActiveAction) {
    runnerParts.reflectionActiveAction.setEffectiveTimeScale(runnerState.effectiveAnimationSpeed);
  }
  if (runnerParts.reflectionLedActiveAction) {
    runnerParts.reflectionLedActiveAction.setEffectiveTimeScale(runnerState.effectiveAnimationSpeed);
  }
  if (runnerParts.groundShadow) {
    runnerParts.groundShadow.visible = TRON_RUNNER_GROUND_SHADOW_ENABLED && floorAmount > 0.001;
    if (Math.abs(shadowSoftness - shadowTextureState.softness) > 0.001) {
      const oldTexture = shadowTextureState.texture;
      shadowTextureState.texture = makeTronRunnerShadowTexture(renderer, shadowSoftness);
      shadowTextureState.softness = shadowSoftness;
      runnerParts.groundShadow.material.alphaMap = shadowTextureState.texture;
      oldTexture?.dispose?.();
    }
    runnerParts.groundShadow.material.color
      .copy(TRON_RUNNER_SHADOW_COLOR)
      .lerp(TRON_RUNNER_SHADOW_CYAN_COLOR, shadowCyan);
    runnerParts.groundShadow.position.set(controls.shadowOffsetX, 0.025, controls.shadowOffsetZ);
    runnerParts.groundShadow.scale.set(
      controls.floorReflectionScale,
      TRON_RUNNER_CONTACT_SHADOW_ROUNDNESS * controls.floorReflectionScale,
      controls.floorReflectionScale
    );
    const groundShadowOpacity = THREE.MathUtils.clamp(
      floorAmount * 0.78,
      0,
      TRON_RUNNER_CONTACT_SHADOW_MAX_OPACITY
    );
    runnerParts.groundShadow.material.userData.tronRunnerBaseOpacity = groundShadowOpacity;
    runnerParts.groundShadow.material.opacity = groundShadowOpacity;
    runnerParts.groundShadow.material.needsUpdate = true;
  }
  runnerParts.keyLight = null;
  runnerParts.leftRim = null;
  runnerParts.rightRim = null;
  runnerParts.lowFill = null;
  syncCrowdScaleAndGround();
  applyRevealVisuals();
}
