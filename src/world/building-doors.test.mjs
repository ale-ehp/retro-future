import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_BASE_PAD_Y } from './boulevard-constants.js';
import {
  SIDE_BUILDING_CIVIC_NUMBER_BRIGHT_STROKE_STYLE,
  SIDE_BUILDING_CIVIC_NUMBER_DEPTH_TEST,
  SIDE_BUILDING_CIVIC_NUMBER_FIXED,
  SIDE_BUILDING_CIVIC_NUMBER_HIGHLIGHT_STROKE_STYLE,
  SIDE_DOOR_FIXED,
  buildSideBuildingDoorBatches,
  initBuildingDoors,
  sideBuildingDoorLedMeshes,
} from './building-doors.js';

test('building civic number signs are 50 percent larger in world space', () => {
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_FIXED.singleWidth, 88.5);
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_FIXED.doubleWidth, 136.5);
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_FIXED.height, 70.5);
});

test('building civic number signs render above background geometry', () => {
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_DEPTH_TEST, false);
});

test('building civic number text is 25 percent brighter', () => {
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_BRIGHT_STROKE_STYLE, 'rgba(179,255,255,1)');
  assert.equal(SIDE_BUILDING_CIVIC_NUMBER_HIGHLIGHT_STROKE_STYLE, 'rgba(255,255,255,1)');
});

test('side building doors start above the base pad surface', () => {
  assert.ok(
    SIDE_DOOR_FIXED.y >= DEFAULT_BASE_PAD_Y,
    `expected side door y ${SIDE_DOOR_FIXED.y} to be at or above base pad ${DEFAULT_BASE_PAD_Y}`
  );
});

test('i LED delle porte, costruiti davvero, fanno depthTest', async () => {
  // Prima (fino al 2026-09-19) si cercava nel sorgente la riga `depthTest: SIDE_BUILDING_
  // DOOR_LED_DEPTH_TEST`; qui si costruiscono le porte e si guarda il materiale del LED.
  const THREE = await import('three');
  const { installaDocumentoFinto, rendererFinto } = await import('../../test/finti-dom.mjs');
  installaDocumentoFinto();
  initBuildingDoors({
    overlayGroup: new THREE.Group(),
    renderer: rendererFinto(),
    reflectionEnvMap: null,
    PAL: { tealLight: 0x8ffcff },
    sideBuildingRecords: [],
    laneZ: [],
    refreshCullingBounds() {},
    tunedColor: (c) => new THREE.Color(c),
    createWetAsphaltFacadeMaterial: (c) => new THREE.MeshStandardMaterial({ color: c }),
  });
  buildSideBuildingDoorBatches();
  assert.ok(sideBuildingDoorLedMeshes.length >= 1, 'nessuna mesh LED costruita');
  for (const mesh of sideBuildingDoorLedMeshes) {
    assert.ok(!Array.isArray(mesh.material));
    assert.equal(mesh.material.depthTest, true, `${mesh.name} non fa depthTest: il LED passerebbe attraverso i muri`);
    assert.equal(mesh.material.depthWrite, false, `${mesh.name} scrive profondita'`);
  }
});
