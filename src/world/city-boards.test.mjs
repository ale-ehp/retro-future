import assert from 'node:assert/strict';
import test from 'node:test';

function assertNear(actual, expected) {
  assert.ok(
    Math.abs(actual - expected) < 1e-12,
    `expected ${actual} to be near ${expected}`
  );
}

// I due moduli dei tabelloni, all'import, leggono solo `location.search` e controlla che `window` esista:
// la prova gli da' quel minimo. Il doppio cast dice a tsc che e' una finta dichiarata,
// non una Window vera (2026-09-20).
function fingiFinestra() {
  globalThis.window = /** @type {Window & typeof globalThis} */ (/** @type {unknown} */ ({}));
  globalThis.location = /** @type {Location} */ (/** @type {unknown} */ ({ search: '' }));
}

test('city board signs use the shared 30 percent opacity reduction', async () => {
  fingiFinestra();
  const cityBoards = await import(`./city-boards.js?opacity-test=${Date.now()}`);
  const roleBoards = await import(`./city-role-boards.js?opacity-test=${Date.now()}`);

  assertNear(cityBoards.CITY_DEPARTMENT_BOARD_PANEL_BASE_OPACITY, 0.46 * 0.7);
  assertNear(cityBoards.CITY_DEPARTMENT_BOARD_TEXT_BASE_OPACITY, 0.96 * 1.25 * 0.7);
  assertNear(roleBoards.CITY_ROLE_BOARD_PANEL_BASE_OPACITY, 0.4 * 0.7);
  assertNear(roleBoards.CITY_ROLE_BOARD_TEXT_BASE_OPACITY, 0.96 * 1.25 * 0.7);
});

test('city board signs are 50 percent larger in world space', async () => {
  fingiFinestra();
  const cityBoards = await import(`./city-boards.js?size-test=${Date.now()}`);
  const roleBoards = await import(`./city-role-boards.js?size-test=${Date.now()}`);

  assert.equal(cityBoards.CITY_DEPARTMENT_BOARD_WIDTH, 31.5);
  assert.equal(cityBoards.CITY_DEPARTMENT_BOARD_HEIGHT, 15.75);
  assert.equal(roleBoards.CITY_ROLE_BOARD_WIDTH, 18);
  assert.equal(roleBoards.CITY_ROLE_BOARD_HEIGHT, 9);
});

test('city board signs respect foreground character depth', async () => {
  fingiFinestra();
  const cityBoards = await import(`./city-boards.js?depth-test=${Date.now()}`);
  const roleBoards = await import(`./city-role-boards.js?depth-test=${Date.now()}`);

  assert.equal(cityBoards.CITY_DEPARTMENT_BOARD_DEPTH_TEST, true);
  assert.equal(roleBoards.CITY_ROLE_BOARD_DEPTH_TEST, true);
});

// I tabelloni non scrivono profondita' e il loro gruppo sta sotto i cartelli dei
// personaggi. Prima si leggeva nel sorgente che ci fosse scritto `depthWrite: false`
// (2026-09-19): qui il tabellone viene costruito davvero e si guarda il materiale. Se
// un tabellone scrivesse profondita' coprirebbe il cartello di chi ci passa davanti,
// che fa depthTest (vedi character/cartelli-scena.test.mjs).
test('i tabelloni costruiti non scrivono profondita\' e stanno sotto i cartelli', async () => {
  const THREE = await import('three');
  const { installaDocumentoFinto, rendererFinto } = await import('../../test/finti-dom.mjs');
  const { CHARACTER_BUBBLE_RENDER_ORDER } = await import('../character/speech-bubbles.js');
  installaDocumentoFinto();
  globalThis.window = /** @type {any} */ ({});
  globalThis.location = /** @type {any} */ ({ search: '' });
  const cityBoards = await import(`./city-boards.js?scene-test=${Date.now()}`);
  const scene = new THREE.Scene();
  const records = [
    { civicNumberValue: 1, sign: -1, mesh: { position: { x: -80, z: 760 }, visible: true }, collider: { hw: 30, hd: 30, x: -80, z: 760 } },
    {
      civicNumberValue: 2, sign: 1, mesh: { position: { x: 80, z: 760 }, visible: true }, collider: { hw: 30, hd: 30, x: 80, z: 760 },
      basePad: { border: { position: { x: 4, z: 7 } }, hitPolygon: [[40, 740], [100, 740], [100, 770], [40, 770]] },
    },
  ];
  cityBoards.initCityDepartmentBoards({
    scene,
    camera: new THREE.PerspectiveCamera(),
    renderer: rendererFinto(),
    reflectionEnvMap: null,
    PAL: new Proxy({}, { get: () => 0x8ffcff }),
    elStrip: () => new THREE.Object3D(),
    addElStripRectFrame: (group) => { const f = new THREE.Object3D(); group.add(f); return f; },
    sideBuildingRecords: records,
    DEFAULT_DRONE_LANDING_POSE: { x: 0, y: 4.1, z: 828, spawnYaw: 0, spawnPitch: 0 },
    TRON_RUNNER_REVEAL_ENABLED: true,
    getDroneLandingPose: () => ({ x: 0, y: 4.1, z: 828, spawnYaw: 0, spawnPitch: 0 }),
    getPlayerSpawn: () => ({ x: 0, y: 4.1, z: 800 }),
    getCityRevealComplete: () => true,
    getRunnerReady: () => true,
    getRevealComplete: () => true,
    getRevealStartedAt: () => 0,
    getRevealActive: () => false,
    getRevealProgress: () => 1,
  });
  cityBoards.updateCityDepartmentBoards(1000);

  const boards = cityBoards.getCityDepartmentBoards();
  assert.ok(boards.length >= 1, 'nessun tabellone costruito');
  let mesh = 0;
  for (const board of boards) {
    assert.ok(board.group instanceof THREE.Group);
    assert.ok(board.group.renderOrder < CHARACTER_BUBBLE_RENDER_ORDER, `il gruppo del tabellone disegna a ${board.group.renderOrder}, sopra i cartelli`);
    board.group.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return;
      mesh += 1;
      assert.equal(o.material.depthWrite, false, `${o.name} scrive profondita'`);
      assert.equal(o.material.depthTest, true, `${o.name} non fa depthTest`);
    });
  }
  assert.ok(mesh >= 2, `solo ${mesh} mesh nei tabelloni: pannello e testo attesi`);
});
