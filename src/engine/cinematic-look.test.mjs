import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TRON_CINEMATIC_LOOK_SHADER,
  cinematicLookRequestedFromParams,
} from './shaders.js';

test('cinematic look defaults on and can be disabled from the URL', () => {
  assert.equal(cinematicLookRequestedFromParams(new URLSearchParams('')), true);
  assert.equal(cinematicLookRequestedFromParams(new URLSearchParams('look.cinematic=1')), true);
  assert.equal(cinematicLookRequestedFromParams(new URLSearchParams('look.cinematic=on')), true);
  assert.equal(cinematicLookRequestedFromParams(new URLSearchParams('cinematicLook=1')), true);
  assert.equal(cinematicLookRequestedFromParams(new URLSearchParams('look=cinematic')), true);
  assert.equal(cinematicLookRequestedFromParams(new URLSearchParams('look.cinematic=0')), false);
  assert.equal(cinematicLookRequestedFromParams(new URLSearchParams('cinematicLook=0')), false);
  assert.equal(cinematicLookRequestedFromParams(new URLSearchParams('look=classic')), false);
});

test('cinematic look shader exposes subtle filmic controls', () => {
  assert.equal(TRON_CINEMATIC_LOOK_SHADER.name, 'TronCinematicLook');
  assert.ok(TRON_CINEMATIC_LOOK_SHADER.uniforms.intensity.value > 0);
  assert.ok(TRON_CINEMATIC_LOOK_SHADER.uniforms.grainStrength.value > 0);
  assert.ok(TRON_CINEMATIC_LOOK_SHADER.uniforms.chromaticStrength.value > 0);
  assert.match(TRON_CINEMATIC_LOOK_SHADER.fragmentShader, /vignette/);
  assert.match(TRON_CINEMATIC_LOOK_SHADER.fragmentShader, /chromaticStrength/);
});
