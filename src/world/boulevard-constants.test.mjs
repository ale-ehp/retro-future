// boulevard-constants.js e' la mappa esatta del boulevard: quasi tutti i valori
// sono derivati aritmeticamente da altri, quindi cambiarne uno a mano rompe una
// relazione geometrica senza che niente lo segnali. Qui vengono fissate le
// relazioni, non i numeri: se qualcuno allarga un edificio senza rifare i conti
// della campata dei ponti, il test cade.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BRIDGE_BUILDING_CLEARANCE,
  BRIDGE_HALF_SPAN,
  BRIDGE_INNER_BUILDING_FACE_X,
  GRID_BLOCK,
  MAIN_ROAD_BASE_LENGTH,
  MAIN_ROAD_LENGTH,
  MAIN_ROAD_WIDTH,
  MAIN_ROAD_Z,
  SIDE_BUILDING_BASE,
  SIDE_BUILDING_GAP,
  SIDE_BUILDING_MIN_CLEARANCE,
  SIDE_BUILDING_SPACING,
  SIDE_BUILDING_X,
  SIDE_ROAD_WIDTH,
  SIDE_ROAD_X,
  START_SIDE_EXTENSION,
  laneZ,
} from './boulevard-constants.js';

test('le misure derivate restano agganciate al modulo della griglia', () => {
  assert.equal(SIDE_ROAD_WIDTH, GRID_BLOCK * 2);
  assert.equal(SIDE_BUILDING_BASE, GRID_BLOCK * 6);
  assert.equal(SIDE_BUILDING_GAP, GRID_BLOCK * 2);
  assert.equal(SIDE_BUILDING_SPACING, SIDE_BUILDING_BASE + SIDE_BUILDING_GAP);
  assert.equal(START_SIDE_EXTENSION, GRID_BLOCK * 10);
});

test('la campata dei ponti si ferma prima della facciata interna degli edifici', () => {
  assert.equal(BRIDGE_INNER_BUILDING_FACE_X, SIDE_BUILDING_X - SIDE_BUILDING_BASE / 2);
  assert.equal(BRIDGE_HALF_SPAN, BRIDGE_INNER_BUILDING_FACE_X - BRIDGE_BUILDING_CLEARANCE);
  assert.ok(BRIDGE_HALF_SPAN > 0, 'campata degenere');
  assert.ok(
    BRIDGE_HALF_SPAN < BRIDGE_INNER_BUILDING_FACE_X,
    'il ponte arriverebbe dentro la facciata',
  );
});

test("l'asse delle traverse sta fuori dalla carreggiata principale e dentro la fascia edifici", () => {
  // Le traverse sono corte (SIDE_ROAD_LENGTH = 40) e corrono negli spazi fra le
  // file di edifici, quindi il loro asse X cade dentro la fascia occupata dagli
  // edifici laterali: non e' una parallela che ci deve stare accanto. Cio' che
  // deve valere e' che non tagli la carreggiata principale e che resti dalla
  // parte interna della fila.
  assert.ok(SIDE_ROAD_X - SIDE_ROAD_WIDTH / 2 > MAIN_ROAD_WIDTH / 2, 'la traversa invade la carreggiata principale');
  assert.ok(SIDE_ROAD_X < SIDE_BUILDING_X, "l'asse della traversa supera il centro degli edifici");
});

test('la carreggiata principale si allunga solo dal lato di partenza', () => {
  assert.equal(MAIN_ROAD_LENGTH, MAIN_ROAD_BASE_LENGTH + START_SIDE_EXTENSION);
  assert.equal(MAIN_ROAD_Z, START_SIDE_EXTENSION / 2);
  assert.ok(MAIN_ROAD_LENGTH > MAIN_ROAD_BASE_LENGTH);
});

test('le sei corsie sono simmetriche, equidistanti e non si sovrappongono', () => {
  assert.equal(laneZ.length, 6);
  const ordinate = laneZ.slice().sort((a, b) => a - b);
  assert.deepEqual(laneZ, ordinate, 'le corsie non sono in ordine');
  assert.equal(laneZ[0], -laneZ[5]);
  assert.equal(laneZ[1], -laneZ[4]);
  assert.equal(laneZ[2], -laneZ[3]);
  const passi = laneZ.slice(1).map((z, i) => z - laneZ[i]);
  for (const passo of passi) {
    assert.ok(Math.abs(passo - SIDE_BUILDING_SPACING) < 1e-9, `passo irregolare: ${passo}`);
  }
  assert.ok(
    SIDE_BUILDING_SPACING >= SIDE_BUILDING_BASE + SIDE_BUILDING_MIN_CLEARANCE,
    'due edifici adiacenti si compenetrano',
  );
});
