import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TRON_CINEMATIC_LOOK_SHADER,
  TRON_FSR_UPSCALE_SHADER,
  linearPipelineRequestedFromParams,
  shaderEncodesOutput,
  withOutputEncode,
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

test('la catena colore lineare e il default, con rollback su ?pipeline=0', () => {
  const params = (query) => new URLSearchParams(query);
  assert.equal(linearPipelineRequestedFromParams(params('')), true, 'deve essere il default');
  assert.equal(linearPipelineRequestedFromParams(params('pipeline=linear')), true);
  for (const rollback of ['pipeline=0', 'pipeline=off', 'pipeline=legacy', 'pipeline=classic']) {
    assert.equal(linearPipelineRequestedFromParams(params(rollback)), false, rollback);
  }
  // L'encode di output deve stare in uno e un solo pass: withOutputEncode lo
  // accende o lo spegne, e nessuno shader lo porta cablato dentro.
  assert.equal(shaderEncodesOutput(withOutputEncode(TRON_CINEMATIC_LOOK_SHADER, true)), true);
  assert.equal(shaderEncodesOutput(withOutputEncode(TRON_CINEMATIC_LOOK_SHADER, false)), false);
  assert.equal(shaderEncodesOutput(TRON_CINEMATIC_LOOK_SHADER), false, 'lo shader nudo non deve gia codificare');
  assert.equal(shaderEncodesOutput(TRON_FSR_UPSCALE_SHADER), false, 'lo shader nudo non deve gia codificare');
});
