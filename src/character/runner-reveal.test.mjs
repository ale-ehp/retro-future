// Il rez dei personaggi: si formano dal basso mentre un anello di luce sale, ognuno sulla
// propria altezza. Prima (rez-visibile.test.mjs, fino al 2026-09-19) si leggeva il sorgente
// per vedere che ci fossero scritte le funzioni giuste. Qui si crea il runtime vero con
// personaggi finti di altezze diverse e si guarda dove sta il taglio, frame dopo frame.
//
// Due bug gia' visti guidano le prove:
//   - il taglio saliva fino all'altezza del personaggio giocante (8.66) anche per la folla,
//     che e' alta 5: l'anello superava la testa e continuava nel vuoto (2026-09-18);
//   - il gruppo della folla restava nascosto per un secondo mentre il rez andava avanti,
//     cosi' si vedeva un corpo gia' fatto per tre quarti spuntare dal nulla (2026-09-18).
import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createTronRunnerRevealRuntime } from './runner-reveal.js';
import { syncTronRunnerCrowdVisibilityState } from './runner-crowd-runtime.js';
import { TRON_RUNNER_REVEAL_DURATION_MS, TRON_RUNNER_SOURCE_CHARACTER_VISIBLE } from './characters.js';

/** Un personaggio finto: un parallelepipedo alto `h` con i piedi a terra e un materiale. */
function personaggio(h, x = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, 0);
  const material = new THREE.MeshStandardMaterial({ emissiveIntensity: 1 });
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(1, h, 1), material);
  corpo.position.y = h / 2;
  group.add(corpo);
  return { group, materials: [material], altezza: h };
}

/** @param {{ cittaFinita?: () => boolean }} [opzioni] */
function scenaDiProva({ cittaFinita = () => true } = {}) {
  const scena = new THREE.Scene();
  const runnerWalker = new THREE.Group();
  scena.add(runnerWalker);
  const basso = personaggio(4, -10);
  const alto = personaggio(8, 10);
  const fermo = personaggio(6, 0);
  scena.add(basso.group, alto.group, fermo.group);
  const runnerState = { ready: true, reveal: null, crowdRevealMaterialOpacity: 1, dynamicReflectionOpacity: 1, dynamicReflectionBodyOpacity: 1, dynamicReflectionLedOpacity: 1 };
  const idleCharacter = { built: true, visible: false, materials: fermo.materials };
  const runtime = createTronRunnerRevealRuntime({
    runnerState,
    runnerParts: { materials: [], revealScan: null, groundShadow: null, reflectionGroup: null, reflectionMaterials: [] },
    runnerWalker,
    crowd: [basso, alto],
    idleCharacter,
    idleCharacterGroup: fermo.group,
    syncCrowdVisibility: () => {},
    getCityRevealComplete: cittaFinita,
  });
  return { scena, runtime, runnerState, runnerWalker, basso, alto, fermo, idleCharacter };
}

/** A che quota sta il taglio di un personaggio (Infinity = non tagliato). */
const taglio = (p) => p.group.userData.pianoRez?.[0]?.constant ?? Number.POSITIVE_INFINITY;
const tagliato = (p) => Boolean(p.materials[0].clippingPlanes);
const anelli = (scena) => scena.getObjectByName('tron-runner-rez-rings');

/** Porta il runtime fino a quando il rez e' partito, e torna l'istante di partenza. */
function avviaRez(runtime, da = 5000) {
  let t = da;
  for (let i = 0; i < 400 && !runtime.isActive(); i += 1) { t += 16; runtime.update(t); }
  assert.ok(runtime.isActive(), 'il rez non e\' mai partito');
  return runtime.startedAt();
}

test('finche\' la citta\' non e\' finita nessuno si materializza', () => {
  const { runtime, runnerState, basso } = scenaDiProva({ cittaFinita: () => false });
  for (let t = 5000; t < 20_000; t += 500) runtime.update(t);
  assert.equal(runtime.isActive(), false);
  assert.equal(runnerState.reveal.phase, 'waiting-city');
  assert.ok(tagliato(basso), 'il corpo deve restare tagliato, non pieno');
  assert.ok(taglio(basso) < basso.altezza * 0.15, `il taglio sta a ${taglio(basso)}: si vede gia\' il corpo`);
});

test('dopo la citta\' il rez parte entro poco, e la sua durata e\' quella dichiarata', () => {
  const { runtime } = scenaDiProva();
  const partenza = avviaRez(runtime, 5000);
  assert.ok(partenza - 5000 <= TRON_RUNNER_REVEAL_DURATION_MS * 2, `ha aspettato ${partenza - 5000}ms prima di partire`);
  runtime.update(partenza + TRON_RUNNER_REVEAL_DURATION_MS - 1);
  assert.equal(runtime.isComplete(), false);
  runtime.update(partenza + TRON_RUNNER_REVEAL_DURATION_MS);
  assert.equal(runtime.isComplete(), true);
});

test('il taglio sale dai piedi alla testa di CIASCUNO, e non oltre', () => {
  const { runtime, basso, alto, fermo } = scenaDiProva();
  const partenza = avviaRez(runtime);
  let precedente = { basso: -Infinity, alto: -Infinity, fermo: -Infinity };
  for (let frazione = 0.02; frazione < 1; frazione += 0.07) {
    runtime.update(partenza + TRON_RUNNER_REVEAL_DURATION_MS * frazione);
    for (const [nome, p] of Object.entries({ basso, alto, fermo })) {
      const q = taglio(p);
      assert.ok(tagliato(p), `${nome}: a ${frazione.toFixed(2)} non e\' piu\' tagliato`);
      assert.ok(q >= 0, `${nome}: taglio sotto i piedi (${q})`);
      // un filo sopra la testa e' voluto (il corpo si forma dietro la luce), oltre no
      assert.ok(q <= p.altezza * 1.1, `${nome}: taglio a ${q.toFixed(2)} su un'altezza di ${p.altezza}`);
      assert.ok(q >= precedente[nome], `${nome}: il taglio e\' sceso`);
      precedente[nome] = q;
    }
    // a parita' di avanzamento chi e' basso ha il taglio piu' basso: ognuno sulla sua misura
    assert.ok(taglio(basso) < taglio(alto), `basso ${taglio(basso)} vs alto ${taglio(alto)}`);
  }
  runtime.update(partenza + TRON_RUNNER_REVEAL_DURATION_MS + 1);
  for (const p of [basso, alto, fermo]) {
    assert.equal(tagliato(p), false, 'a rez finito il corpo e\' pieno, senza piano di taglio');
  }
});

test('l\'anello di luce sta alla quota del taglio di ciascuno, appeso alla scena e non al sorgente', () => {
  const { scena, runtime, runnerWalker, basso, alto, fermo } = scenaDiProva();
  assert.ok(!TRON_RUNNER_SOURCE_CHARACTER_VISIBLE, 'il personaggio sorgente e\' invisibile per scelta: un anello appeso a lui non lo vede nessuno');
  const partenza = avviaRez(runtime);
  runtime.update(partenza + TRON_RUNNER_REVEAL_DURATION_MS * 0.5);
  const mesh = anelli(scena);
  assert.ok(mesh instanceof THREE.InstancedMesh, 'manca l\'InstancedMesh degli anelli');
  assert.equal(mesh.parent, scena, 'gli anelli devono stare nella scena');
  assert.notEqual(mesh.parent, runnerWalker);
  assert.equal(mesh.visible, true);
  assert.equal(mesh.count, 3, 'un anello per personaggio: due della folla e il fermo');
  const matrice = new THREE.Matrix4();
  const posizione = new THREE.Vector3();
  const soggetti = [basso, alto, fermo];
  soggetti.forEach((p, i) => {
    mesh.getMatrixAt(i, matrice);
    posizione.setFromMatrixPosition(matrice);
    assert.ok(Math.abs(posizione.x - p.group.position.x) < 1e-6, 'anello sotto il personaggio sbagliato');
    assert.ok(posizione.y > 0 && posizione.y <= p.altezza, `anello a ${posizione.y.toFixed(2)} su un'altezza di ${p.altezza}`);
    assert.ok(Math.abs(posizione.y - taglio(p)) < p.altezza * 0.1, `anello a ${posizione.y.toFixed(2)}, taglio a ${taglio(p).toFixed(2)}`);
  });
  runtime.update(partenza + TRON_RUNNER_REVEAL_DURATION_MS + 1);
  assert.equal(anelli(scena).visible, false, 'a rez finito la luce si spegne');
});

test('il gruppo della folla si accende con il rez, senza mangiarsene l\'inizio', () => {
  const gruppo = new THREE.Group();
  gruppo.visible = false;
  const membro = { group: new THREE.Group(), baseVisible: false };
  const state = { appearArmedAt: 0 };
  const mostra = (now) => syncTronRunnerCrowdVisibilityState({
    crowd: [membro],
    group: gruppo,
    state,
    crowdEnabled: true,
    cullingEnabled: false,
    getVisibleFactor: () => 0.01,
    revealVisible: () => true,
    isRunnerReady: () => true,
    now: () => now,
    updateReflection: () => {},
    syncMemberMatrixUpdates: () => {},
  });
  mostra(5000);
  // Il rez dura TRON_RUNNER_REVEAL_DURATION_MS: se il gruppo compare piu' tardi del 5% di
  // quella durata, la materializzazione comincia a porte chiuse e si vede un popup.
  mostra(5000 + TRON_RUNNER_REVEAL_DURATION_MS * 0.05);
  assert.equal(gruppo.visible, true, 'la folla e\' ancora nascosta mentre il rez va avanti');
  assert.equal(membro.group.visible, true);
});
