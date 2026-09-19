// La luminosita' dei personaggi ha un tetto, ed e' una trappola.
//
// Il 2026-09-19, alzando TRON_RUNNER_CROWD_LED_EMISSIVE_INTENSITY da 2.4 a 3 non cambiava
// nulla: tronRunnerCrowdLedEmissiveIntensity() taglia il risultato con un clamp, e i
// personaggi ci sbattevano gia' contro. Prima queste prove leggevano il numero del clamp
// nel sorgente; ora chiamano la funzione e guardano se un aumento passa davvero.
import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { installaDocumentoFinto } from '../test/finti-dom.mjs';
import {
  TRON_RUNNER_IDLE_CHARACTER_BRIGHTNESS,
  TRON_RUNNER_IDLE_CHARACTER_CIVIC,
} from './character/characters.js';
import { tronRunnerCrowdLedEmissiveIntensity, tronRunnerCharacterLedDefaultScale } from './character/runner-crowd-leds.js';
import { createTronRunnerIdleCharacterRuntime } from './character/runner-idle-character.js';

const aRiposo = () => tronRunnerCrowdLedEmissiveIntensity({ ledBrightness: tronRunnerCharacterLedDefaultScale(), ledBloom: 1 });
const con = (fattore) => tronRunnerCrowdLedEmissiveIntensity({ ledBrightness: tronRunnerCharacterLedDefaultScale() * fattore, ledBloom: 1 });

test('un aumento di luminosita\' arriva davvero: a riposo non si sta gia\' contro il tetto', () => {
  const base = aRiposo();
  assert.ok(base > 0);
  // +25% deve dare +25%: se il tetto fosse gia' raggiunto, il risultato non si muoverebbe
  assert.ok(Math.abs(con(1.25) / base - 1.25) < 0.01, `+25% di luminosita\' da\' x${(con(1.25) / base).toFixed(3)}`);
  // e c'e' spazio per raddoppiare, cosi' la prossima modifica non e' silenziosamente inutile
  assert.ok(Math.abs(con(2) / base - 2) < 0.01, `x2 di luminosita\' da\' x${(con(2) / base).toFixed(3)}: il tetto e\' troppo vicino`);
});

test('il tetto esiste e resta finito', () => {
  const enorme = con(1e6);
  assert.ok(Number.isFinite(enorme) && enorme < aRiposo() * 1000, `senza tetto: ${enorme}`);
});

test('chi sta fermo e\' piu\' luminoso degli altri, e la base memorizzata lo sa', () => {
  // La base memorizzata (tronRunnerBaseEmissiveIntensity) e' quella a cui il battito della
  // musica riporta il materiale: se restasse quella comune, il fermo tornerebbe come gli
  // altri al primo battito. Qui si costruisce il personaggio con un materiale finto a 1.
  assert.ok(TRON_RUNNER_IDLE_CHARACTER_BRIGHTNESS > 1, 'il fermo deve staccarsi dagli altri');
  installaDocumentoFinto();
  const record = {
    civicNumberValue: TRON_RUNNER_IDLE_CHARACTER_CIVIC,
    sign: 1,
    mesh: { position: { x: 80, y: 0, z: 760 } },
    collider: { x: 80, z: 760, hw: 30, hd: 30, chamfer: 0 },
    basePad: { border: { position: { x: 4, z: 7 } }, hitPolygon: [[40, 740], [100, 740], [100, 770], [40, 770]] },
  };
  const runtime = createTronRunnerIdleCharacterRuntime({
    scene: new THREE.Scene(),
    runnerWalker: new THREE.Group(),
    crowdBox: new THREE.Box3(),
    cloneRunnerSkeleton: () => (m) => m.clone(),
    resolveRoundedCollider: () => false,
    crowdRecordRoadDir: () => 1,
    crowdColorPresetForIndex: () => ({}),
    makeCrowdSuitMaterial: () => new THREE.MeshStandardMaterial({ emissiveIntensity: 1 }),
    surfaceYForPoint: () => ({ y: 4.1, surface: 'road' }),
    syncRevealIdleVisibility() {},
    getSideBuildingRecords: () => [record],
    getPlayerSpawn: () => ({ z: 800 }),
    sideBuildingSpacing: 100,
    sideDoorFaceOffset: 1,
    gridBlock: 10,
  });
  const modello = new THREE.Group();
  modello.add(new THREE.Mesh(new THREE.BoxGeometry(1, 5, 1), new THREE.MeshStandardMaterial()));
  runtime.build(modello);
  assert.equal(runtime.character.built, true, runtime.character.error);
  const materiale = runtime.character.materials[0];
  assert.ok(Math.abs(materiale.emissiveIntensity - TRON_RUNNER_IDLE_CHARACTER_BRIGHTNESS) < 1e-9, `emissiva a ${materiale.emissiveIntensity}`);
  assert.equal(materiale.userData.tronRunnerBaseEmissiveIntensity, materiale.emissiveIntensity, 'la base memorizzata non segue: il battito lo riallinea agli altri');
});
