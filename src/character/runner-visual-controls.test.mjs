import assert from 'node:assert/strict';
import test from 'node:test';

import * as runnerVisualControls from './runner-visual-controls.js';

test('cinematic grounding is opt-in from URL parameters', () => {
  assert.equal(typeof runnerVisualControls.cinematicGroundingSettingsFromParams, 'function');

  assert.deepEqual(
    runnerVisualControls.cinematicGroundingSettingsFromParams(new URLSearchParams('')),
    {
      enabled: false,
      floorReflection: 0.16,
      floorReflectionScale: 0.55,
      shadowSoftness: 1.15,
      shadowPulse: 0.08,
      shadowCyan: 0,
      shadowOffsetZ: 0.2,
    }
  );

  assert.deepEqual(
    runnerVisualControls.cinematicGroundingSettingsFromParams(new URLSearchParams('cinematicGrounding=1')),
    {
      enabled: true,
      floorReflection: 0.31,
      floorReflectionScale: 0.78,
      shadowSoftness: 1.35,
      shadowPulse: 0.12,
      shadowCyan: 0.28,
      shadowOffsetZ: 0.26,
    }
  );

  assert.equal(
    runnerVisualControls.cinematicGroundingSettingsFromParams(new URLSearchParams('grounding=cinematic')).enabled,
    true
  );
  assert.equal(
    runnerVisualControls.cinematicGroundingSettingsFromParams(new URLSearchParams('cinematicGrounding=0')).enabled,
    false
  );
});
