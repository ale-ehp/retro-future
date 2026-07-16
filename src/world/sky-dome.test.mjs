import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  skyBakeFaceStride,
  skyBakeSpreadRequestedFromParams,
} from './sky-dome.js';

const htmlSource = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const skyDomeSource = readFileSync(new URL('./sky-dome.js', import.meta.url), 'utf8');
const canonicalSettings = JSON.parse(
  readFileSync(new URL('../../demo-5-boulevard-canonical-settings.json', import.meta.url), 'utf8')
);

test('sky brightness default is raised by twenty percent end to end', () => {
  assert.match(skyDomeSource, /SKY_BRIGHTNESS_SHADER_MAX\s*=\s*2\.4/);
  assert.match(skyDomeSource, /clamp\(brightness,\s*0\.05,\s*SKY_BRIGHTNESS_SHADER_MAX\)/);
  assert.match(skyDomeSource, /brightnessUniform:\s*domeMat\.uniforms\.uBrightness\.value/);
  assert.match(skyDomeSource, /brightnessMax:\s*SKY_BRIGHTNESS_SHADER_MAX/);
  assert.match(
    htmlSource,
    /id="sky-brightness-val">4\.80<\/output>[\s\S]*id="sky-brightness"[^>]*max="4\.8"[^>]*value="4\.8"/
  );
  assert.equal(canonicalSettings.settings['sky-brightness'], 4.8);
});

test('sky bake spread flag defaults on and accepts explicit URL overrides', () => {
  assert.equal(skyBakeSpreadRequestedFromParams(new URLSearchParams(''), true), true);
  assert.equal(skyBakeSpreadRequestedFromParams(new URLSearchParams('skyBakeSpread=1'), false), true);
  assert.equal(skyBakeSpreadRequestedFromParams(new URLSearchParams('skyBakeSpread=0'), true), false);
  assert.equal(skyBakeSpreadRequestedFromParams(new URLSearchParams('skyBakeSpread=nope'), true), true);
});

test('sky bake spreads a full cube rebake across the original stride window', () => {
  assert.equal(skyBakeFaceStride(12), 2);
  assert.equal(skyBakeFaceStride(6), 1);
  assert.equal(skyBakeFaceStride(1), 1);
});
