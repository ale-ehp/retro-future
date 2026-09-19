import assert from 'node:assert/strict';
import test from 'node:test';

import {
  skyBakeFaceStride,
  skyBakeSpreadRequestedFromParams,
} from './sky-dome.js';

test('la luminosita\' del cielo passa fino al tetto dello shader, poi si ferma', async () => {
  // Prima (fino al 2026-09-19) si leggeva nel sorgente `SKY_BRIGHTNESS_SHADER_MAX = 2.4` e
  // nel markup `value="4.8"`. Qui si costruisce la cupola e si applica la luminosita': sotto
  // il tetto un aumento arriva allo shader, sopra il tetto no. Il tetto dichiarato e quello
  // misurato devono coincidere, altrimenti inspectStorm() racconta un numero falso.
  const THREE = await import('three');
  const { installaDocumentoFinto, rendererFinto } = await import('../../test/finti-dom.mjs');
  installaDocumentoFinto();
  globalThis.window = /** @type {any} */ ({ matchMedia: () => ({ matches: false }) });
  globalThis.location = /** @type {any} */ ({ search: '' });
  const { createSkyDome } = await import(`./sky-dome.js?brightness-test=${Date.now()}`);
  const renderer = /** @type {any} */ ({
    ...rendererFinto(),
    render() {}, setRenderTarget() {}, getRenderTarget: () => null, clippingPlanes: [], autoClear: true,
  });
  const dome = createSkyDome({
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    renderer,
    controlEls: { skyQuality: { value: 'balanced' }, skyBrightness: { value: '1' } },
    tunedColor: (base, hue, s, b) => base.clone().multiplyScalar(b),
    getRevealBudgetActive: () => false,
  });
  const uniforme = () => dome.inspectStorm().brightnessUniform;
  const tetto = dome.inspectStorm().brightnessMax;
  dome.applySkyPreset('grid', 1, 0);
  const a1 = uniforme();
  dome.applySkyPreset('grid', 1.5, 0);
  assert.ok(uniforme() > a1, 'sotto il tetto un aumento deve arrivare allo shader');
  dome.applySkyPreset('grid', tetto * 10, 0);
  assert.equal(uniforme(), tetto, 'sopra il tetto lo shader deve fermarsi al tetto dichiarato');
  dome.applySkyPreset('grid', tetto * 100, 0);
  assert.equal(uniforme(), tetto);
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
