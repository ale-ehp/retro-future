import * as THREE from 'three';
import {
  TRON_RUNNER_CHARACTER_LED_BLOOM_BOOST,
  TRON_RUNNER_CHARACTER_LED_BRIGHTNESS_MULTIPLIER,
  TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY,
} from './characters.js';

export function tronRunnerCharacterLedDefaultScale() {
  return TRON_RUNNER_CHARACTER_LED_BRIGHTNESS_MULTIPLIER * TRON_RUNNER_CHARACTER_LED_BLOOM_BOOST;
}

export function tronRunnerCharacterLedScale({ ledBrightness, ledBloom }) {
  return Math.max(0, ledBrightness) * Math.max(0, ledBloom);
}

export function tronRunnerCrowdLedEmissiveIntensity({ ledBrightness, ledBloom }) {
  const defaultScale = tronRunnerCharacterLedDefaultScale();
  const scale = defaultScale > 0
    ? tronRunnerCharacterLedScale({ ledBrightness, ledBloom }) / defaultScale
    : 1;
  return THREE.MathUtils.clamp(TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY * scale, 0, 12);
}

export function applyTronRunnerCrowdLedControls({
  crowd,
  ledBrightness,
  ledBloom,
  beatPulse,
}) {
  beatPulse.markBaseChanged();
  const emissiveIntensity = tronRunnerCrowdLedEmissiveIntensity({ ledBrightness, ledBloom });
  for (const member of crowd) {
    const materials = member.materials?.length ? member.materials : [];
    if (!materials.length) {
      member.model?.traverse((object) => {
        const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
        objectMaterials.forEach((material) => {
          if (!material || !Number.isFinite(material.emissiveIntensity)) return;
          materials.push(material);
        });
      });
      member.materials = [...new Set(materials)];
    }
    for (const material of member.materials || []) {
      if (!material || !Number.isFinite(material.emissiveIntensity)) continue;
      material.emissiveIntensity = emissiveIntensity;
      material.userData.tronRunnerBaseEmissiveIntensity = emissiveIntensity;
      material.needsUpdate = true;
    }
  }
  beatPulse.update();
}
