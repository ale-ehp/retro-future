// I cartelli non devono infilarsi nei palazzi ne' nei pannelli sospesi come il terminale
// contatti (chiesto il 2026-09-19: si vedevano mezzi mangiati dal muro).
//
// scansaOstacoli() e' verificabile qui perche' prende tutto da fuori: basta iniettare una
// scena finta con dentro un palazzo e un terminale veri.
import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {
  initSpeechBubbles,
  scansaOstacoli,
  dimenticaIngombriCartelli,
} from './character/speech-bubbles.js';

const LARGHEZZA = 4;
const ALTEZZA = 1.6;

function preparaScena({ palazzi = [], pannelli = [], camera = new THREE.Vector3(0, 6, 60) } = {}) {
  const scena = new THREE.Scene();
  for (const p of pannelli) {
    const gruppo = new THREE.Group();
    gruppo.name = p.nome;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.larghezza, p.altezza, p.profondita));
    mesh.position.set(p.x, p.y, p.z);
    gruppo.add(mesh);
    scena.add(gruppo);
  }
  scena.updateMatrixWorld(true);
  dimenticaIngombriCartelli();
  initSpeechBubbles({
    THREE,
    getScene: () => scena,
    getCamera: () => ({ position: camera }),
    getColliderRecords: () => palazzi,
    TARGET_HEIGHT: 8.66,
  });
  return scena;
}

test('un cartello dentro un palazzo viene spinto fuori', () => {
  preparaScena({ palazzi: [{ collider: { x: 0, z: 0, hw: 10, hd: 10, chamfer: 0 } }] });
  const dentro = new THREE.Vector3(2, 6, 3);   // in pieno muro
  const spostato = scansaOstacoli(dentro, LARGHEZZA, ALTEZZA);
  assert.equal(spostato, true);
  const fuoriX = Math.abs(dentro.x) >= 10 + LARGHEZZA / 2 - 1e-6;
  const fuoriZ = Math.abs(dentro.z) >= 10 + LARGHEZZA / 2 - 1e-6;
  assert.ok(fuoriX || fuoriZ, `resta dentro: ${dentro.x.toFixed(2)}, ${dentro.z.toFixed(2)}`);
});

test('un cartello gia\' fuori non viene toccato', () => {
  preparaScena({ palazzi: [{ collider: { x: 0, z: 0, hw: 10, hd: 10, chamfer: 0 } }] });
  const fuori = new THREE.Vector3(40, 6, 40);
  const copia = fuori.clone();
  assert.equal(scansaOstacoli(fuori, LARGHEZZA, ALTEZZA), false);
  assert.deepEqual([fuori.x, fuori.y, fuori.z], [copia.x, copia.y, copia.z]);
});

test('un cartello dentro il terminale esce verso la camera', () => {
  preparaScena({
    pannelli: [{ nome: 'contact-terminal-1', x: 0, y: 6, z: 0, larghezza: 8, altezza: 4, profondita: 1 }],
    camera: new THREE.Vector3(0, 6, 40),
  });
  const dentro = new THREE.Vector3(0, 6, 0);
  assert.equal(scansaOstacoli(dentro, LARGHEZZA, ALTEZZA), true);
  // la camera sta a z positivo: il cartello deve essersi mosso da quella parte, e uscire
  assert.ok(dentro.z > 0.5 + LARGHEZZA / 2, `z finale ${dentro.z.toFixed(2)}`);
});

test('vale anche per i cartelloni dei reparti', () => {
  preparaScena({
    pannelli: [{ nome: 'city-department-board-2', x: 20, y: 6, z: 0, larghezza: 8, altezza: 4, profondita: 1 }],
    camera: new THREE.Vector3(20, 6, 40),
  });
  const dentro = new THREE.Vector3(20, 6, 0);
  assert.equal(scansaOstacoli(dentro, LARGHEZZA, ALTEZZA), true);
  assert.ok(dentro.z > 0.5 + LARGHEZZA / 2);
});

test('senza ostacoli non succede nulla, e non esplode', () => {
  preparaScena();
  const libero = new THREE.Vector3(5, 6, 5);
  assert.equal(scansaOstacoli(libero, LARGHEZZA, ALTEZZA), false);
});
