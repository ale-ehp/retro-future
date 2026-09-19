// Dove finiscono i cartelli dei personaggi dentro la scena, e con quali materiali.
//
// Fino al 2026-09-19 queste cose si verificavano leggendo il sorgente con espressioni
// regolari: passavano anche quando il codice non faceva quello che il testo diceva. Qui
// si costruisce una scena finta, si fanno girare gli aggiornatori veri e si guarda cosa
// c'e' dentro, come fa cartelli-collisioni.test.mjs. Nessuna di queste prove si rompe per
// un cambio di misura o di stile: si rompono se cambia il COMPORTAMENTO.
//
// Tre fatti da tenere fermi, ognuno gia' costato un bug:
//   1. i cartelli stanno in un Group loro con il renderOrder piu' alto della scena, perche'
//      three.js confronta prima il renderOrder del gruppo e poi quello dell'oggetto: appesi
//      alla scena il loro numero non veniva nemmeno guardato (2026-09-18);
//   2. i loro materiali fanno depthTest ma non depthWrite, cosi' chi parla copre il proprio
//      cartello e i pannelli della citta' (che non scrivono profondita') non lo nascondono;
//   3. il cartello di chi sta in pausa resta orientato come lui, non insegue la camera
//      (2026-09-19); quelli della folla continuano a voltarsi verso chi legge.
import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { installaDocumentoFinto, rendererFinto } from '../../test/finti-dom.mjs';
import {
  CHARACTER_BUBBLE_RENDER_ORDER,
  dimenticaIngombriCartelli,
  initSpeechBubbles,
  updateGreeterSpeechBubble,
  updateTronRunnerCrowdSpeechBubbles,
} from './speech-bubbles.js';

installaDocumentoFinto();

// Il modulo tiene i suoi sprite e il suo Group in variabili di modulo, creati una volta e
// appesi alla prima scena che vede: qui c'e' UNA scena per tutto il file, e le prove
// cambiano solo camera e personaggi.
const scena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
camera.position.set(0, 6, 40);

function personaggio(x, z, yaw = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  scena.add(g);
  return g;
}

// L'orologio e' finto e avanza di un frame abbondante a ogni aggiornamento: le dissolvenze
// dei cartelli vanno a tempo, e due aggiornamenti a distanza di microsecondi (come li fa
// una prova) lascerebbero l'opacita' sotto la soglia di visibilita'. In scena i frame
// stanno a 16ms l'uno dall'altro.
let adesso = 10_000;
performance.now = () => adesso;
const chiAccoglie = { group: personaggio(0, 0), bubbleText: 'Benvenuto', bubbleUntil: Infinity, bubbleSizeScale: 1 };
const dellaFolla = { group: personaggio(-10, 0), talkText: 'Ciao', talkStart: adesso - 1000, talkUntil: adesso + 600_000 };
const fermo = personaggio(10, 0, 0.7);
// chi sta in pausa e' un "membro" a se': la sua parlata porta il suo gruppo
const parlataFermo = { group: fermo, talkArmed: false, talkLines: ['Pausa'], talkText: 'Pausa', talkStart: adesso - 1000, talkUntil: adesso + 600_000 };
const gruppoFolla = new THREE.Group();
gruppoFolla.visible = true;

dimenticaIngombriCartelli();
initSpeechBubbles({
  THREE,
  getScene: () => scena,
  getCamera: () => camera,
  getRenderer: rendererFinto,
  getColliderRecords: () => [],
  getCrowd: () => [chiAccoglie, dellaFolla],
  getCrowdGroup: () => gruppoFolla,
  getIdleGroup: () => fermo,
  getIdleTalk: () => parlataFermo,
  isReady: () => true,
  GREETER_INDEX: 0,
  TARGET_HEIGHT: 8.66,
  CROWD_TALK_RANGE: 60,
  CROWD_TALK_REARM_RANGE: 80,
  CROWD_TALK_DURATION_MS: 5000,
});

function aggiorna() {
  adesso += 100;
  updateGreeterSpeechBubble();
  updateTronRunnerCrowdSpeechBubbles();
}

const gruppoCartelli = () => scena.getObjectByName('character-bubbles');
/** I cartelli visibili: i Mesh del gruppo (instanceof, cosi' tsc sa che hanno un materiale). */
const cartelliVisibili = () => gruppoCartelli().children.filter((c) => c.visible && c instanceof THREE.Mesh);
const cartelloSopra = (g) => cartelliVisibili().find((c) => Math.abs(c.position.x - g.position.x) < 1e-6 && Math.abs(c.position.z - g.position.z) < 1e-6);

test('i cartelli stanno in un Group loro, e il renderOrder alto sta sul gruppo', () => {
  aggiorna();
  const gruppo = gruppoCartelli();
  assert.ok(gruppo instanceof THREE.Group, 'manca il Group character-bubbles nella scena');
  assert.equal(gruppo.renderOrder, CHARACTER_BUBBLE_RENDER_ORDER);
  assert.ok(gruppo.children.length >= 3, `solo ${gruppo.children.length} cartelli nel gruppo`);
  for (const c of gruppo.children) assert.equal(c.parent, gruppo);
  // e nessun cartello e' appeso direttamente alla scena, dove il numero non varrebbe
  const appesi = scena.children.filter((o) => o instanceof THREE.Mesh && o.renderOrder === CHARACTER_BUBBLE_RENDER_ORDER);
  assert.deepEqual(appesi, []);
});

test('i cartelli fanno depthTest ma non depthWrite', () => {
  aggiorna();
  const visibili = cartelliVisibili();
  assert.equal(visibili.length, 3, 'chi accoglie, uno della folla e chi sta fermo');
  for (const c of gruppoCartelli().children) {
    assert.ok(c instanceof THREE.Mesh && !Array.isArray(c.material));
    assert.equal(c.material.depthTest, true, 'senza depthTest il cartello passa sopra a chi lo tiene');
    assert.equal(c.material.depthWrite, false, 'con depthWrite il cartello nasconderebbe cio\' che ha dietro');
    assert.equal(c.material.transparent, true);
  }
});

test('il cartello di chi sta fermo non insegue la camera, quelli della folla si\'', () => {
  camera.position.set(0, 6, 40);
  aggiorna();
  const fermoPrima = cartelloSopra(fermo).rotation.y;
  const follaPrima = cartelloSopra(dellaFolla.group).rotation.y;
  assert.ok(Math.abs(fermoPrima - fermo.rotation.y) < 1e-6, `orientato a ${fermoPrima}, il personaggio a ${fermo.rotation.y}`);

  camera.position.set(45, 6, -30);   // dall'altra parte
  aggiorna();
  const fermoDopo = cartelloSopra(fermo).rotation.y;
  const follaDopo = cartelloSopra(dellaFolla.group).rotation.y;
  assert.ok(Math.abs(fermoDopo - fermoPrima) < 1e-6, `il cartello del fermo si e' girato: ${fermoPrima} -> ${fermoDopo}`);
  assert.ok(Math.abs(follaDopo - follaPrima) > 0.5, `quello della folla non si e' voltato: ${follaPrima} -> ${follaDopo}`);
  // e chi accoglie si volta anche lui
  const accoglieDopo = cartelloSopra(chiAccoglie.group).rotation.y;
  const attesoAccoglie = Math.atan2(camera.position.x - 0, camera.position.z - 0);
  assert.ok(Math.abs(accoglieDopo - attesoAccoglie) < 1e-6);
});

test('un cartello sta sopra la testa di chi lo tiene, in scala con lui', () => {
  camera.position.set(0, 6, 40);
  fermo.scale.setScalar(0.5);
  aggiorna();
  const cartello = cartelloSopra(fermo);
  // sopra la testa: piu' in alto dell'altezza del personaggio in scala, e non oltre il doppio
  const testa = 8.66 * 0.5;
  assert.ok(cartello.position.y > testa, `sta a ${cartello.position.y}, la testa a ${testa}`);
  assert.ok(cartello.position.y < testa * 2, `troppo in alto: ${cartello.position.y}`);
  fermo.scale.setScalar(1);
});
