import {
  TRON_RUNNER_CROWD_COLOR_PLAN,
  TRON_RUNNER_CROWD_COLOR_PRESETS,
} from './character-colors.js';
import {
  makeTronRunnerCrowdSuitMaterial,
} from './character-materials.js';
import {
  tronRunnerCrowdLedEmissiveIntensity,
} from './runner-crowd-leds.js';

export function createTronRunnerCrowdMaterialsRuntime({
  baseMaterial,
  getLedBrightness,
  getLedBloom,
}) {
  function colorPresetForIndex(index) {
    // The two start-cluster companions on the road by the landing point are colour-locked:
    // index 0 = cyan ('current'), index 1 = green. Everyone else follows the colour plan.
    if (index === 0) return TRON_RUNNER_CROWD_COLOR_PRESETS.current;
    if (index === 1) return TRON_RUNNER_CROWD_COLOR_PRESETS.green || TRON_RUNNER_CROWD_COLOR_PRESETS.current;
    const key = TRON_RUNNER_CROWD_COLOR_PLAN[index % TRON_RUNNER_CROWD_COLOR_PLAN.length] || 'current';
    return TRON_RUNNER_CROWD_COLOR_PRESETS[key] || TRON_RUNNER_CROWD_COLOR_PRESETS.current;
  }

  function makeSuitMaterial(colorPreset) {
    const ledBrightness = getLedBrightness();
    const ledBloom = getLedBloom();
    return makeTronRunnerCrowdSuitMaterial({
      baseMaterial,
      colorPreset,
      emissiveIntensity: tronRunnerCrowdLedEmissiveIntensity({
        ledBrightness,
        ledBloom,
      }),
      ledBloom,
    });
  }

  return {
    colorPresetForIndex,
    makeSuitMaterial,
  };
}
