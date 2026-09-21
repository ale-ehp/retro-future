import * as THREE from 'three';
import { fxEnabled } from '../engine/fx-debug-toggles.js';
import { retroFutureSignOpacity, retroFutureSignScale, retroFutureSignTextOpacity } from '../sign-opacity.js';
import { boardPerimeterPoseSignature, resolveBoardPerimeterPose } from './board-perimeter-pose.js';

export function cityDepartmentPageItems(page, config) {
  const start = page * config.rows;
  return config.departments.slice(start, start + config.rows);
}

function cityDepartmentBoardChar(oldText, newText, row, index, progress, textureUpdates, config) {
  const total = config.rows * config.charSlots;
  const cursor = progress * total;
  const charCursor = row * config.charSlots + index;
  if (cursor >= charCursor + 1) return newText[index] || ' ';
  if (cursor <= charCursor) return oldText[index] || ' ';
  const scrambleIndex = (row * 17 + index * 11 + textureUpdates * 3) % config.scramble.length;
  return config.scramble[scrambleIndex];
}

export function cityDepartmentInterpolatedText(oldText, newText, row, progress, textureUpdates, config) {
  const oldPadded = oldText.padEnd(config.charSlots, ' ');
  const newPadded = newText.padEnd(config.charSlots, ' ');
  let result = '';
  for (let i = 0; i < config.charSlots; i++) {
    result += cityDepartmentBoardChar(oldPadded, newPadded, row, i, progress, textureUpdates, config);
  }
  return result.trimEnd();
}

let deps = null;
let scene = null;
let camera = null;
let renderer = null;
let reflectionEnvMap = null;
let PAL = null;
let elStrip = null;
let addElStripRectFrame = null;
let sideBuildingRecords = null;
let DEFAULT_DRONE_LANDING_POSE = null;
let TRON_RUNNER_REVEAL_ENABLED = false;

// ---------- City department departures boards ----------
export const CITY_DEPARTMENT_BOARD_ENABLED = true;
const CITY_DEPARTMENT_BOARD_TARGET_CIVICS = Object.freeze([1]);
const CITY_DEPARTMENT_BOARD_ROWS = 6;
const CITY_DEPARTMENT_BOARD_CHAR_SLOTS = 28;
const CITY_DEPARTMENT_BOARD_HOLD_MS = 2600;
const CITY_DEPARTMENT_BOARD_SWITCH_MS = 1100;
const CITY_DEPARTMENT_BOARD_SWITCH_STAGGER_MS = 0;
// The board redraws only while a page switch is running (~1.1s every ~3.7s), but
// every redraw re-rasterizes the whole canvas and re-uploads it. 8Hz still reads
// as a mechanical flip-board and cuts a third of that recurring work.
const CITY_DEPARTMENT_BOARD_TEXTURE_FPS = 8;
const CITY_DEPARTMENT_BOARD_TEXTURE_SCALE = 0.5;
const CITY_DEPARTMENT_BOARD_TEXTURE_WIDTH = 2048;
const CITY_DEPARTMENT_BOARD_TEXTURE_HEIGHT = 1024;
export const CITY_DEPARTMENT_BOARD_WIDTH = retroFutureSignScale(21);
export const CITY_DEPARTMENT_BOARD_HEIGHT = retroFutureSignScale(10.5);
export const CITY_DEPARTMENT_BOARD_DEPTH_TEST = true;
const CITY_DEPARTMENT_BOARD_INNER_SLIDE = 0.68;
const CITY_DEPARTMENT_BOARD_REVEAL_EPS = 0.0015;
const CITY_DEPARTMENT_BOARD_REVEAL_WITH_RUNNERS = true;
const CITY_DEPARTMENT_BOARD_RAW_PANEL_BASE_OPACITY = 0.46;
const CITY_DEPARTMENT_BOARD_RAW_TEXT_BASE_OPACITY = 0.96;
export const CITY_DEPARTMENT_BOARD_PANEL_BASE_OPACITY = retroFutureSignOpacity(CITY_DEPARTMENT_BOARD_RAW_PANEL_BASE_OPACITY);
export const CITY_DEPARTMENT_BOARD_TEXT_BASE_OPACITY = retroFutureSignTextOpacity(CITY_DEPARTMENT_BOARD_RAW_TEXT_BASE_OPACITY);
// Leva di debug runtime (?boardUpload=0, o si spegne da console). Sta dietro un
// guard perche' i test in node importano questo modulo senza DOM: senza il guard
// l'import esplode prima ancora di arrivare alle asserzioni.
if (typeof window !== 'undefined') {
  window.__cityDepartmentBoardTextureUploadEnabled = new URLSearchParams(location.search).get('boardUpload') !== '0';
}
const CITY_DEPARTMENT_BOARD_SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 /&';
const CITY_DEPARTMENTS = Object.freeze([
  'Tech Engineering',
  'AI / ML',
  'Product & Design',
  'Strategy & Business',
  'Sales',
  'Marketing',
  'Legal / Compliance',
  'Domain Experts',
  'Operations / Finance',
  'Support & Delivery',
  'Data & Analytics',
  'Specialists',
]);
const cityDepartmentBoardState = {
  nextSwitchAt: 0,
  cycle: 0,
  updateOptimized: true,
  poseSyncs: 0,
  poseSkips: 0,
  revealWrites: 0,
  revealSkips: 0,
  lastPoseSignature: '',
  lastRevealFactor: -1,
  lastRevealVisible: null,
};
const cityDepartmentBoards = [];
let cityDepartmentBoardPanelMat = null;

function createCityDepartmentBoardTextureResources() {
  const canvas = document.createElement('canvas');
  canvas.width = CITY_DEPARTMENT_BOARD_TEXTURE_WIDTH * CITY_DEPARTMENT_BOARD_TEXTURE_SCALE;
  canvas.height = CITY_DEPARTMENT_BOARD_TEXTURE_HEIGHT * CITY_DEPARTMENT_BOARD_TEXTURE_SCALE;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity: CITY_DEPARTMENT_BOARD_TEXT_BASE_OPACITY,
    alphaTest: 0.012,
    depthWrite: false,
    depthTest: CITY_DEPARTMENT_BOARD_DEPTH_TEST,
    toneMapped: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  });
  return { canvas, ctx, texture, material };
}

const cityDepartmentBoardTextConfig = {
  rows: CITY_DEPARTMENT_BOARD_ROWS,
  charSlots: CITY_DEPARTMENT_BOARD_CHAR_SLOTS,
  scramble: CITY_DEPARTMENT_BOARD_SCRAMBLE,
  departments: CITY_DEPARTMENTS,
};

// Everything on the board that never changes between redraws — the header, the
// section label, the row backgrounds and separators and the status line — is
// rasterized once here and blitted back with a single drawImage per redraw. It
// used to be re-drawn from scratch on every frame of every switch, shadowed
// fillText passes included, which is the most expensive thing a 2D context does.
function buildCityDepartmentBoardStaticLayer(board) {
  const w = CITY_DEPARTMENT_BOARD_TEXTURE_WIDTH;
  const h = CITY_DEPARTMENT_BOARD_TEXTURE_HEIGHT;
  const layer = document.createElement('canvas');
  layer.width = board.canvas.width;
  layer.height = board.canvas.height;
  const ctx = layer.getContext('2d');
  ctx.setTransform(layer.width / w, 0, 0, layer.height / h, 0, 0);
  ctx.font = '900 54px Menlo, Consolas, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(98, 247, 255, 0.58)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(210, 252, 255, 0.96)';
  ctx.fillText('AVSTUDIO TERMINAL', 118, 122);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(238, 255, 255, 0.92)';
  ctx.fillText('AVSTUDIO TERMINAL', 118, 122);
  ctx.shadowBlur = 5;
  ctx.font = '700 30px Menlo, Consolas, monospace';
  ctx.fillStyle = 'rgba(98, 247, 255, 0.70)';
  ctx.fillText('DEPARTMENTS BOARD', 118, 178);

  const rowTop = 260;
  const rowHeight = 104;
  ctx.shadowBlur = 0;
  for (let row = 0; row < CITY_DEPARTMENT_BOARD_ROWS; row++) {
    const y = rowTop + row * rowHeight;
    ctx.fillStyle = row % 2 === 0 ? 'rgba(0, 88, 106, 0.16)' : 'rgba(0, 38, 46, 0.16)';
    ctx.fillRect(118, y - 46, w - 236, 76);
    ctx.strokeStyle = 'rgba(98, 247, 255, 0.24)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(118, y + 42);
    ctx.lineTo(w - 118, y + 42);
    ctx.stroke();
  }

  ctx.shadowColor = 'rgba(98, 247, 255, 0.58)';
  ctx.shadowBlur = 4;
  ctx.font = '700 28px Menlo, Consolas, monospace';
  ctx.fillStyle = 'rgba(98, 247, 255, 0.56)';
  ctx.textAlign = 'left';
  ctx.fillText('STATUS: ROUTING ACTIVE', 118, h - 106);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return layer;
}

function drawCityDepartmentBoardTexture(board, now = performance.now()) {
  if (!board?.ctx || !board?.canvas || !board?.texture || !board?.state) return;
  const drawStartedAt = performance.now();
  const state = board.state;
  const ctx = board.ctx;
  const pixelW = board.canvas.width;
  const pixelH = board.canvas.height;
  const w = CITY_DEPARTMENT_BOARD_TEXTURE_WIDTH;
  const h = CITY_DEPARTMENT_BOARD_TEXTURE_HEIGHT;
  const switchProgress = state.switching
    ? THREE.MathUtils.clamp((now - state.switchStartedAt) / CITY_DEPARTMENT_BOARD_SWITCH_MS, 0, 1)
    : 0;
  const oldItems = cityDepartmentPageItems(state.page, cityDepartmentBoardTextConfig);
  const newItems = cityDepartmentPageItems(state.targetPage, cityDepartmentBoardTextConfig);
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.004);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, pixelW, pixelH);
  ctx.setTransform(pixelW / w, 0, 0, pixelH / h, 0, 0);
  ctx.fillStyle = 'rgba(0, 12, 15, 0.22)';
  ctx.fillRect(0, 0, w, h);

  const glow = 18 + pulse * 10;
  ctx.save();
  ctx.shadowColor = 'rgba(98, 247, 255, 0.72)';
  ctx.shadowBlur = glow;
  ctx.strokeStyle = 'rgba(143, 252, 255, 0.92)';
  ctx.lineWidth = 8;
  ctx.strokeRect(58, 58, w - 116, h - 116);
  ctx.strokeStyle = 'rgba(98, 247, 255, 0.34)';
  ctx.lineWidth = 3;
  ctx.strokeRect(92, 104, w - 184, h - 164);
  ctx.restore();

  // Static chrome (header, section label, row backgrounds and separators, status
  // line) comes back as one blit, drawn here — right after the frame and before
  // any row text, exactly where those pieces sat in the original draw order.
  if (!board.staticLayer) board.staticLayer = buildCityDepartmentBoardStaticLayer(board);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(board.staticLayer, 0, 0);
  ctx.setTransform(pixelW / w, 0, 0, pixelH / h, 0, 0);

  ctx.font = '700 30px Menlo, Consolas, monospace';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(98, 247, 255, 0.58)';
  ctx.shadowBlur = 5;
  ctx.fillStyle = 'rgba(98, 247, 255, 0.70)';
  ctx.textAlign = 'right';
  ctx.fillText(`PAGE ${state.switching ? state.targetPage + 1 : state.page + 1}/2`, w - 118, 178);

  const rowTop = 260;
  const rowHeight = 104;
  ctx.textAlign = 'left';
  for (let row = 0; row < CITY_DEPARTMENT_BOARD_ROWS; row++) {
    const y = rowTop + row * rowHeight;
    const oldIndex = state.page * CITY_DEPARTMENT_BOARD_ROWS + row + 1;
    const newIndex = state.targetPage * CITY_DEPARTMENT_BOARD_ROWS + row + 1;
    const activeIndex = state.switching && switchProgress > (row + 1) / CITY_DEPARTMENT_BOARD_ROWS * 0.82
      ? newIndex
      : oldIndex;
    const oldLabel = oldItems[row] || '';
    const newLabel = newItems[row] || '';
    const label = state.switching
      ? cityDepartmentInterpolatedText(oldLabel, newLabel, row, switchProgress, state.textureUpdates, cityDepartmentBoardTextConfig)
      : oldLabel;
    const scan = state.switching
      ? Math.max(0, 1 - Math.abs(switchProgress * CITY_DEPARTMENT_BOARD_ROWS - row) * 0.8)
      : 0;

    ctx.font = '900 44px Menlo, Consolas, monospace';
    ctx.shadowBlur = 5 + scan * 8;
    ctx.fillStyle = scan > 0.15 ? 'rgba(236, 255, 255, 0.98)' : 'rgba(143, 252, 255, 0.86)';
    ctx.fillText(String(activeIndex).padStart(2, '0'), 148, y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(236, 255, 255, 0.86)';
    ctx.fillText(String(activeIndex).padStart(2, '0'), 148, y);
    ctx.font = '900 52px Menlo, Consolas, monospace';
    ctx.shadowBlur = 5 + scan * 8;
    ctx.fillStyle = scan > 0.15 ? 'rgba(230, 255, 255, 0.98)' : 'rgba(178, 252, 255, 0.94)';
    ctx.fillText(label.toUpperCase(), 270, y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(236, 255, 255, 0.82)';
    ctx.fillText(label.toUpperCase(), 270, y);

    if (scan > 0.01) {
      ctx.fillStyle = `rgba(98, 247, 255, ${0.18 * scan})`;
      ctx.fillRect(118, y - 46, w - 236, 76);
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  state.lastCanvasDrawMs = performance.now() - drawStartedAt;
  state.totalCanvasDrawMs += state.lastCanvasDrawMs;
  if (window.__cityDepartmentBoardTextureUploadEnabled !== false) {
    board.texture.needsUpdate = true;
    state.textureUploadRequests++;
  } else {
    state.textureUploadSkips++;
  }
  state.textureUpdates++;
}

export function addCityDepartmentFrame(group, width, height, z = 0.06) {
  const hw = width / 2;
  const hh = height / 2;
  const thick = 0.18;
  const color = PAL.tealLight;
  addElStripRectFrame(group, hw, hh, z, color, thick, { depthWrite: false });
}

export function cityDepartmentBoardBottomY() {
  return Number.isFinite(deps.getDroneLandingPose()?.y) ? deps.getDroneLandingPose().y : DEFAULT_DRONE_LANDING_POSE.y;
}

function syncCityDepartmentBoardPerimeterPose(board) {
  const record = board.record;
  const pose = resolveBoardPerimeterPose(record, {
    bottomY: cityDepartmentBoardBottomY(),
    boardHeight: board.boardHeight,
    playerZ: deps.getPlayerSpawn()?.z ?? camera.position.z ?? record?.mesh?.position?.z,
    innerSlide: CITY_DEPARTMENT_BOARD_INNER_SLIDE,
  });
  board.boardPosition.set(pose.x, pose.y, pose.z);
  board.yaw = pose.yaw;
  board.perimeterSide = pose.perimeterSide;
  board.perimeterSynced = pose.perimeterSynced;
  board.group.position.copy(board.boardPosition);
  board.group.rotation.y = board.yaw;
}

function cityDepartmentBoardPoseSignature() {
  const bottomY = cityDepartmentBoardBottomY();
  const playerZ = deps.getPlayerSpawn()?.z ?? camera.position.z ?? 0;
  const parts = [];
  for (const board of cityDepartmentBoards) {
    parts.push(
      board.civicNumberValue,
      boardPerimeterPoseSignature(board.record, {
        bottomY,
        boardHeight: board.boardHeight,
        playerZ,
        innerSlide: CITY_DEPARTMENT_BOARD_INNER_SLIDE,
      }),
    );
  }
  return parts.join('|');
}

/**
 * Un nodo della scena visto da traverse(), che passa anche gruppi e luci: i campi di
 * Mesh ci sono forse, e il codice li controlla prima di usarli. Senza questo tipo tsc
 * vedeva solo Object3D e ogni `.material` era un TS2339 (2026-09-20).
 * @typedef {THREE.Object3D & Partial<THREE.Mesh>} NodoForseMesh
 */
function createCityDepartmentBoard(record, boardIndex = cityDepartmentBoards.length) {
  const textureResources = createCityDepartmentBoardTextureResources();
  const board = {
    record,
    civicNumberValue: record.civicNumberValue,
    group: new THREE.Group(),
    boardPosition: new THREE.Vector3(0, cityDepartmentBoardBottomY() + CITY_DEPARTMENT_BOARD_HEIGHT * 0.5, 0),
    boardWidth: CITY_DEPARTMENT_BOARD_WIDTH,
    boardHeight: CITY_DEPARTMENT_BOARD_HEIGHT,
    yaw: 0,
    perimeterSynced: false,
    textMesh: null,
    panelMesh: null,
    revealMaterials: [],
    canvas: textureResources.canvas,
    ctx: textureResources.ctx,
    texture: textureResources.texture,
    textMaterial: textureResources.material,
    state: {
      page: 0,
      targetPage: 0,
      switching: false,
      switchStartedAt: 0,
      nextSwitchAt: 0,
      lastTextureAt: 0,
      textureUpdates: 0,
      textureUploadRequests: 0,
      textureUploadSkips: 0,
      lastCanvasDrawMs: 0,
      totalCanvasDrawMs: 0,
      switchDelayMs: boardIndex * CITY_DEPARTMENT_BOARD_SWITCH_STAGGER_MS,
    },
  };
  board.group.name = `city-department-board-${record.civicNumberValue}`;
  syncCityDepartmentBoardPerimeterPose(board);
  board.group.renderOrder = 30;

  const panel = new THREE.Mesh(new THREE.PlaneGeometry(board.boardWidth, board.boardHeight), cityDepartmentBoardPanelMat);
  panel.name = `city-department-board-panel-${record.civicNumberValue}`;
  panel.renderOrder = 28;
  panel.frustumCulled = false;
  board.group.add(panel);
  board.panelMesh = panel;

  const text = new THREE.Mesh(new THREE.PlaneGeometry(board.boardWidth * 0.96, board.boardHeight * 0.96), board.textMaterial);
  text.name = `city-department-board-text-${record.civicNumberValue}`;
  text.position.z = 0.12;
  text.renderOrder = 32;
  text.frustumCulled = false;
  board.group.add(text);
  board.textMesh = text;
  addCityDepartmentFrame(board.group, board.boardWidth, board.boardHeight, 0.16);
  board.group.traverse((/** @type {NodoForseMesh} */ object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (!material || !Number.isFinite(material.opacity)) return;
      material.transparent = true;
      material.depthTest = CITY_DEPARTMENT_BOARD_DEPTH_TEST;
      material.depthWrite = false;
      material.userData.cityDepartmentBoardBaseOpacity = material.opacity;
      board.revealMaterials.push(material);
    });
  });
  board.group.visible = false;
  scene.add(board.group);
  cityDepartmentBoards.push(board);
}

function buildCityDepartmentBoards() {
  if (!CITY_DEPARTMENT_BOARD_ENABLED || cityDepartmentBoards.length) return;
  const now = performance.now();
  for (const civic of CITY_DEPARTMENT_BOARD_TARGET_CIVICS) {
    const record = sideBuildingRecords.find((item) => item.civicNumberValue === civic);
    if (record) createCityDepartmentBoard(record, cityDepartmentBoards.length);
  }
  cityDepartmentBoardState.nextSwitchAt = now + CITY_DEPARTMENT_BOARD_HOLD_MS;
  for (const board of cityDepartmentBoards) {
    board.state.nextSwitchAt = now + CITY_DEPARTMENT_BOARD_HOLD_MS + board.state.switchDelayMs;
    drawCityDepartmentBoardTexture(board, now);
  }
}

// Pose signatures only change when layout controls / spawn poses move, so
// rebuilding the ~12-string signature every frame is pure GC churn: recheck
// on a 250ms cadence instead (worst case: pose lags one interval on a drag).
export const CITY_BOARD_POSE_CHECK_INTERVAL_MS = 250;

export function updateCityDepartmentBoards(now) {
  if (!cityDepartmentBoards.length) return;
  if (now - (cityDepartmentBoardState.lastPoseCheckMs || 0) >= CITY_BOARD_POSE_CHECK_INTERVAL_MS) {
    cityDepartmentBoardState.lastPoseCheckMs = now;
    const poseSignature = cityDepartmentBoardPoseSignature();
    if (poseSignature !== cityDepartmentBoardState.lastPoseSignature) {
      cityDepartmentBoardState.lastPoseSignature = poseSignature;
      cityDepartmentBoardState.poseSyncs += 1;
      for (const board of cityDepartmentBoards) syncCityDepartmentBoardPerimeterPose(board);
    } else {
      cityDepartmentBoardState.poseSkips += 1;
    }
  }
  const revealFactor = cityDepartmentBoardRevealFactor();
  syncCityDepartmentBoardRevealVisibility(revealFactor);
  if (revealFactor <= 0.002) {
    cityDepartmentBoardState.nextSwitchAt = now + CITY_DEPARTMENT_BOARD_HOLD_MS;
    for (const board of cityDepartmentBoards) {
      board.state.nextSwitchAt = now + CITY_DEPARTMENT_BOARD_HOLD_MS + board.state.switchDelayMs;
    }
    return;
  }
  const minFrameMs = 1000 / CITY_DEPARTMENT_BOARD_TEXTURE_FPS;
  for (const board of cityDepartmentBoards) {
    const state = board.state;
    let completedSwitch = false;
    if (!state.switching && now >= state.nextSwitchAt) {
      state.switching = true;
      state.targetPage = (state.page + 1) % 2;
      state.switchStartedAt = now;
    }
    const progress = state.switching
      ? THREE.MathUtils.clamp((now - state.switchStartedAt) / CITY_DEPARTMENT_BOARD_SWITCH_MS, 0, 1)
      : 0;
    if (state.switching && progress >= 1) {
      state.switching = false;
      state.page = state.targetPage;
      state.nextSwitchAt = now + CITY_DEPARTMENT_BOARD_HOLD_MS;
      completedSwitch = true;
      cityDepartmentBoardState.cycle++;
    }
    if (state.switching || completedSwitch || state.lastTextureAt === 0) {
      if (!completedSwitch && now - state.lastTextureAt < minFrameMs) continue;
      state.lastTextureAt = now;
      drawCityDepartmentBoardTexture(board, now);
    }
  }
  let minNextSwitchAt = Number.POSITIVE_INFINITY;
  for (const board of cityDepartmentBoards) {
    const next = board.state.nextSwitchAt || Number.POSITIVE_INFINITY;
    if (next < minNextSwitchAt) minNextSwitchAt = next;
  }
  cityDepartmentBoardState.nextSwitchAt = minNextSwitchAt;
  const glow = 0.10 + 0.05 * Math.sin(now * 0.005);
  cityDepartmentBoardPanelMat.emissiveIntensity = (0.20 + glow) * THREE.MathUtils.lerp(0.35, 1, revealFactor);
}

export function cityDepartmentBoardRevealFactor() {
  if (!CITY_DEPARTMENT_BOARD_REVEAL_WITH_RUNNERS || !TRON_RUNNER_REVEAL_ENABLED) return 1;
  if (!deps.getCityRevealComplete() || !deps.getRunnerReady()) return 0;
  if (deps.getRevealComplete()) return 1;
  if (!deps.getRevealStartedAt() && !deps.getRevealActive()) return 0;
  return THREE.MathUtils.clamp(deps.getRevealProgress(), 0, 1);
}

function syncCityDepartmentBoardRevealVisibility(revealFactor = cityDepartmentBoardRevealFactor()) {
  const factor = THREE.MathUtils.clamp(revealFactor, 0, 1);
  const visible = Boolean(CITY_DEPARTMENT_BOARD_ENABLED && (factor > 0.002 || deps.getRevealActive()) && fxEnabled('deptBoards'));
  if (
    Math.abs(factor - cityDepartmentBoardState.lastRevealFactor) < CITY_DEPARTMENT_BOARD_REVEAL_EPS
    && cityDepartmentBoardState.lastRevealVisible === visible
  ) {
    cityDepartmentBoardState.revealSkips += 1;
    return;
  }
  cityDepartmentBoardState.lastRevealFactor = factor;
  cityDepartmentBoardState.lastRevealVisible = visible;
  for (const board of cityDepartmentBoards) {
    if (board.group.visible !== visible) board.group.visible = visible;
    for (const material of board.revealMaterials) {
      const baseOpacity = Number.isFinite(material.userData.cityDepartmentBoardBaseOpacity)
        ? material.userData.cityDepartmentBoardBaseOpacity
        : material.opacity;
      const nextOpacity = baseOpacity * factor;
      if (Math.abs((material.opacity ?? 0) - nextOpacity) < CITY_DEPARTMENT_BOARD_REVEAL_EPS) continue;
      material.opacity = nextOpacity;
      // opacity is a uniform; no needsUpdate/program refresh required for the fade
      cityDepartmentBoardState.revealWrites += 1;
    }
  }
}

export function cityDepartmentBoardInspect() {
  const firstBoard = cityDepartmentBoards[0] || null;
  const firstState = firstBoard?.state || null;
  const now = performance.now();
  return {
    enabled: CITY_DEPARTMENT_BOARD_ENABLED,
    targetCivics: [...CITY_DEPARTMENT_BOARD_TARGET_CIVICS],
    count: cityDepartmentBoards.length,
    visible: Boolean(firstBoard?.group?.visible),
    revealWithRunners: CITY_DEPARTMENT_BOARD_REVEAL_WITH_RUNNERS,
    revealFactor: Number(cityDepartmentBoardRevealFactor().toFixed(3)),
    page: firstState?.page ?? 0,
    targetPage: firstState?.targetPage ?? 0,
    switching: cityDepartmentBoards.some((board) => board.state?.switching),
    textureUpdates: cityDepartmentBoards.reduce((sum, board) => sum + (board.state?.textureUpdates || 0), 0),
    nextSwitchAt: cityDepartmentBoardState.nextSwitchAt,
    cycle: cityDepartmentBoardState.cycle,
    rows: CITY_DEPARTMENT_BOARD_ROWS,
    items: cityDepartmentPageItems(firstState?.page ?? 0, cityDepartmentBoardTextConfig),
    innerSlide: CITY_DEPARTMENT_BOARD_INNER_SLIDE,
    textureFps: CITY_DEPARTMENT_BOARD_TEXTURE_FPS,
    switchStaggerMs: CITY_DEPARTMENT_BOARD_SWITCH_STAGGER_MS,
    textureUploadEnabled: window.__cityDepartmentBoardTextureUploadEnabled !== false,
    bottomY: cityDepartmentBoardBottomY(),
    textureWidth: firstBoard?.canvas?.width ?? CITY_DEPARTMENT_BOARD_TEXTURE_WIDTH * CITY_DEPARTMENT_BOARD_TEXTURE_SCALE,
    textureHeight: firstBoard?.canvas?.height ?? CITY_DEPARTMENT_BOARD_TEXTURE_HEIGHT * CITY_DEPARTMENT_BOARD_TEXTURE_SCALE,
    textureScale: CITY_DEPARTMENT_BOARD_TEXTURE_SCALE,
    textureMipmaps: firstBoard?.texture?.generateMipmaps ?? false,
    panelBaseOpacity: CITY_DEPARTMENT_BOARD_PANEL_BASE_OPACITY,
    textBaseOpacity: CITY_DEPARTMENT_BOARD_TEXT_BASE_OPACITY,
    panelOpacity: firstBoard?.panelMesh?.material?.opacity ?? null,
    textOpacity: firstBoard?.textMaterial?.opacity ?? null,
    updateOptimized: cityDepartmentBoardState.updateOptimized,
    runtime: {
      poseSyncs: cityDepartmentBoardState.poseSyncs,
      poseSkips: cityDepartmentBoardState.poseSkips,
      revealWrites: cityDepartmentBoardState.revealWrites,
      revealSkips: cityDepartmentBoardState.revealSkips,
      lastRevealFactor: Number(Math.max(0, cityDepartmentBoardState.lastRevealFactor).toFixed(3)),
      lastRevealVisible: cityDepartmentBoardState.lastRevealVisible,
    },
    boards: cityDepartmentBoards.map((board) => ({
      civicNumberValue: board.civicNumberValue,
      visible: Boolean(board.group.visible),
      children: board.group.children.length,
      perimeterSynced: board.perimeterSynced,
      perimeterSide: board.perimeterSide,
      yaw: board.yaw,
      boardWidth: board.boardWidth,
      boardHeight: board.boardHeight,
      boardBottomY: board.boardPosition.y - board.boardHeight * 0.5,
      page: board.state.page,
      targetPage: board.state.targetPage,
      switching: board.state.switching,
      switchDelayMs: board.state.switchDelayMs,
      switchStartedAt: board.state.switchStartedAt,
      nextSwitchAt: board.state.nextSwitchAt,
      switchProgress: board.state.switching
        ? THREE.MathUtils.clamp((now - board.state.switchStartedAt) / CITY_DEPARTMENT_BOARD_SWITCH_MS, 0, 1)
        : 0,
      textureUpdates: board.state.textureUpdates,
      textureUploadRequests: board.state.textureUploadRequests,
      textureUploadSkips: board.state.textureUploadSkips,
      lastCanvasDrawMs: board.state.lastCanvasDrawMs,
      totalCanvasDrawMs: board.state.totalCanvasDrawMs,
      textureWidth: board.canvas.width,
      textureHeight: board.canvas.height,
      panelOpacity: board.panelMesh?.material?.opacity ?? null,
      textOpacity: board.textMaterial?.opacity ?? null,
      boardPosition: {
        x: board.boardPosition.x,
        y: board.boardPosition.y,
        z: board.boardPosition.z,
      },
    })),
  };
}
if (typeof window !== 'undefined') window.__cityDepartmentBoardInspect = cityDepartmentBoardInspect;

export function getCityDepartmentBoards() {
  return cityDepartmentBoards;
}

export function initCityDepartmentBoards(d) {
  deps = d;
  ({
    scene,
    camera,
    renderer,
    reflectionEnvMap,
    PAL,
    elStrip,
    addElStripRectFrame,
    sideBuildingRecords,
    DEFAULT_DRONE_LANDING_POSE,
    TRON_RUNNER_REVEAL_ENABLED,
  } = d);
  cityDepartmentBoardPanelMat = new THREE.MeshStandardMaterial({
  color: 0x001216,
  metalness: 0.45,
  roughness: 0.18,
  envMap: reflectionEnvMap,
  envMapIntensity: 0.72,
  emissive: 0x00333b,
  emissiveIntensity: 0.22,
  transparent: true,
  opacity: CITY_DEPARTMENT_BOARD_PANEL_BASE_OPACITY,
  depthWrite: false,
  depthTest: CITY_DEPARTMENT_BOARD_DEPTH_TEST,
  side: THREE.DoubleSide,
});
  buildCityDepartmentBoards();
}
