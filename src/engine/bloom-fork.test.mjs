// Il fork di UnrealBloomPass in vendor/ ha campi che upstream non ha, e main.js li usa.
//
// Fino al 2026-09-19 si cercavano nel sorgente del vendor le righe `this.compositeToInput
// = true;` e `bloomTexture() {`. Qui il pass viene costruito davvero (senza GPU: la
// costruzione crea solo oggetti) e si guarda che l'interfaccia ci sia. Se un aggiornamento
// di three sovrascrive il fork, questa prova lo dice prima che main.js muoia a runtime.
import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

test('il fork del bloom espone le leve che main.js usa', () => {
  const pass = new UnrealBloomPass(new THREE.Vector2(64, 64), 1, 0.4, 0.85);
  assert.equal(pass.compositeToInput, true, 'di default il bloom si somma nel buffer della scena');
  assert.equal(typeof pass.bloomTexture, 'function', 'senza bloomTexture() il look cinematico non puo\' sommarlo lui');
  assert.ok(Number.isInteger(pass.activeMips) && pass.activeMips >= 1, 'activeMips: quanti livelli di blur elaborare');
  assert.ok(Number.isInteger(pass.updateStride) && pass.updateStride >= 1, 'updateStride: ogni quanti frame ricalcolare');
  assert.equal(typeof pass._hasCachedBloom, 'boolean', '_hasCachedBloom: main.js lo azzera a ogni resize');
});
