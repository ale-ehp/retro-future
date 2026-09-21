// I tabelloni dei ruoli: un pannello per ogni numero civico, accanto alla porta.
//
// Perche' sta in un file suo (2026-09-21): city-boards.js era 1.200 righe e conteneva due
// tabelloni diversi. Quelli dei reparti scorrono le pagine con l'effetto a caratteri; questi
// sono fissi, ancorati alla porta del palazzo, e disegnano dodici settori. Condividono solo
// la cornice e due misure, che adesso arrivano per import invece che per vicinanza.
//
// La texture si disegna sempre in uno spazio virtuale 2048x1024 e il canvas vero e' un
// quarto: 512x256, senza mipmap, circa 19 MB di GPU risparmiati su dodici tabelloni. Il
// testo e' piu' morbido solo se ci si mette davanti, identico a distanza normale.
import * as THREE from 'three';
import { fxEnabled } from '../engine/fx-debug-toggles.js';
import { retroFutureSignOpacity, retroFutureSignScale, retroFutureSignTextOpacity } from '../sign-opacity.js';
/**
 * `traverse()` passa anche gruppi e luci, non solo mesh: il nodo e' un Object3D che
 * FORSE ha i campi di Mesh. Un cast a Mesh sui gruppi sarebbe una bugia.
 * @typedef {THREE.Object3D & Partial<THREE.Mesh>} NodoForseMesh
 */

import {
  CITY_BOARD_POSE_CHECK_INTERVAL_MS,
  addCityDepartmentFrame,
  cityDepartmentBoardBottomY,
  cityDepartmentBoardRevealFactor,
} from './city-boards.js';

// Le dipendenze arrivano da initCityRoleBoards: prima erano le stesse variabili di
// modulo dei tabelloni dei reparti, riusate perche' stavano nello stesso file.
let renderer = null;
let scene = null;
let sideBuildingRecords = [];
let sideDoorWidth = 0;
let sideDoorHeight = 0;
let sideDoorScale = 0;
let sideDoorY = 0;
let sideDoorFaceOffset = 0;
let SIDE_BUILDING_CIVIC_NUMBER_FIXED = null;

// ---------- City role boards: fixed sector boards beside civic doors ----------
export const CITY_ROLE_BOARD_ENABLED = true;
const CITY_ROLE_BOARD_TARGET_CIVICS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
// Role boards draw entirely in the 2048x1024 virtual space (setTransform in drawCityRoleBoardTexture),
// so this scale only sets the output canvas resolution. 0.25 -> 512x256, ~19MB GPU saved across 12 boards
// (no mipmaps). Text is softer only when standing right at a board; identical at normal distance.
const CITY_ROLE_BOARD_TEXTURE_SCALE = 0.25;
const CITY_ROLE_BOARD_TEXTURE_WIDTH = 2048;
const CITY_ROLE_BOARD_TEXTURE_HEIGHT = 1024;
export const CITY_ROLE_BOARD_WIDTH = retroFutureSignScale(12);
export const CITY_ROLE_BOARD_HEIGHT = retroFutureSignScale(6);
export const CITY_ROLE_BOARD_DEPTH_TEST = true;
const CITY_ROLE_BOARD_WALL_CENTER_WIDTH = retroFutureSignScale(24);
const CITY_ROLE_BOARD_RAW_PANEL_BASE_OPACITY = 0.40;
const CITY_ROLE_BOARD_RAW_TEXT_BASE_OPACITY = 0.96;
export const CITY_ROLE_BOARD_PANEL_BASE_OPACITY = retroFutureSignOpacity(CITY_ROLE_BOARD_RAW_PANEL_BASE_OPACITY);
export const CITY_ROLE_BOARD_TEXT_BASE_OPACITY = retroFutureSignTextOpacity(CITY_ROLE_BOARD_RAW_TEXT_BASE_OPACITY);
const CITY_ROLE_BOARD_SLOT_COUNT = 6;
const CITY_ROLE_BOARD_REVEAL_EPS = 0.0015;
/**
 * Non tutti i settori hanno `note`: senza dichiararla opzionale tsc la dava per inesistente
 * sull'unione dei quattro letterali (2026-09-20).
 * @type {ReadonlyArray<Readonly<{ civicNumberValue: number, label: string, roles: readonly string[], note?: string }>>}
 */
const CITY_ROLE_BOARD_SECTORS = Object.freeze([
  Object.freeze({
    civicNumberValue: 1,
    label: 'Tech Engineering',
    roles: Object.freeze([
      'Senior Frontend Engineer',
      'Backend / Edge & Delivery Engineer',
      'Workflow / Agent Orchestration Engineer',
      'Data / RAG Engineer',
      'Platform & Security Engineer',
    ]),
  }),
  Object.freeze({
    civicNumberValue: 2,
    label: 'AI / ML',
    roles: Object.freeze([
      'LLM / RAG / Multi-modal Engineer',
      'AI Safety / Eval Engineer',
      'Conversational AI Designer / Voice',
      'AI/ML Training Engineer',
    ]),
  }),
  Object.freeze({
    civicNumberValue: 3,
    label: 'Product & Design',
    roles: Object.freeze([
      'Product Manager & UX Research',
      'Product Designer (UX/UI)',
      'Brand / Visual / 3D Designer',
      'Copywriter / UX Writer / Localization',
    ]),
  }),
  Object.freeze({
    civicNumberValue: 4,
    label: 'Strategy & Business',
    roles: Object.freeze([
      'Founder / CEO',
      'Strategy & Partnerships Lead',
      'Market & Competitive Researcher',
    ]),
  }),
  Object.freeze({
    civicNumberValue: 5,
    label: 'Sales',
    roles: Object.freeze([
      'SDR / BDR',
      'Account Executive',
      'CSM + Customer Operations',
    ]),
  }),
  Object.freeze({
    civicNumberValue: 6,
    label: 'Marketing',
    roles: Object.freeze([
      'CMO / Head of Marketing',
      'Content & Multimedia Lead',
      'Growth & Marketing Ops Engineer',
      'Social / Community / PR / Events',
    ]),
  }),
  Object.freeze({
    civicNumberValue: 7,
    label: 'Legal / Compliance',
    roles: Object.freeze([
      'Legal Counsel',
      'GDPR & InfoSec Officer (DPO)',
      'AI Act Compliance Specialist',
      'Regulatory Specialist Settoriale',
    ]),
  }),
  Object.freeze({
    civicNumberValue: 8,
    label: 'Domain Experts',
    roles: Object.freeze([
      'Regulated Professionals Lead',
      'Health & Personal Services Lead',
      'Asset-Heavy Sales Lead',
      'Commerce & Hospitality Lead',
      'B2B Operations Lead',
      'HR Lead',
    ]),
  }),
  Object.freeze({
    civicNumberValue: 9,
    label: 'Operations / Finance',
    roles: Object.freeze([
      'COO / Operations & People',
      'CFO / Finance',
    ]),
  }),
  Object.freeze({
    civicNumberValue: 10,
    label: 'Support & Delivery',
    roles: Object.freeze([]),
    note: '0 final roles - in CSM / Backend',
  }),
  Object.freeze({
    civicNumberValue: 11,
    label: 'Data & Analytics',
    roles: Object.freeze([
      'Data Engineer',
      'Analytics Engineer / BI / BA',
    ]),
  }),
  Object.freeze({
    civicNumberValue: 12,
    label: 'Specialists',
    roles: Object.freeze([
      'AI Audit & ROI Analyst',
      'Change Management / AI Trainer / Documentation',
      'Demo / Showcase Engineer',
      'AI Visibility & Search Lead (GEO/SEO)',
    ]),
  }),
]);
const cityRoleBoardPanelMat = new THREE.MeshBasicMaterial({
  color: 0x001216,
  transparent: true,
  opacity: CITY_ROLE_BOARD_PANEL_BASE_OPACITY,
  depthWrite: false,
  depthTest: CITY_ROLE_BOARD_DEPTH_TEST,
  side: THREE.DoubleSide,
});
const cityRoleBoards = [];
const cityRoleBoardRuntimeStats = {
  updateOptimized: true,
  poseSyncs: 0,
  poseSkips: 0,
  revealWrites: 0,
  revealSkips: 0,
  lastPoseSignature: '',
  lastRevealFactor: -1,
  lastVisibleCount: -1,
};

function createCityRoleBoardTextureResources() {
  const canvas = document.createElement('canvas');
  canvas.width = CITY_ROLE_BOARD_TEXTURE_WIDTH * CITY_ROLE_BOARD_TEXTURE_SCALE;
  canvas.height = CITY_ROLE_BOARD_TEXTURE_HEIGHT * CITY_ROLE_BOARD_TEXTURE_SCALE;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = Math.min(2, renderer.capabilities.getMaxAnisotropy?.() || 1);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity: CITY_ROLE_BOARD_TEXT_BASE_OPACITY,
    alphaTest: 0.012,
    depthWrite: false,
    depthTest: CITY_ROLE_BOARD_DEPTH_TEST,
    toneMapped: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  });
  return { canvas, ctx, texture, material };
}

function fitCityRoleBoardText(ctx, text, maxWidth) {
  const value = String(text || '').toUpperCase();
  if (ctx.measureText(value).width <= maxWidth) return value;
  let trimmed = value;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}...`;
}

function drawCityRoleBoardTexture(board) {
  const ctx = board.ctx;
  const pixelW = board.canvas.width;
  const pixelH = board.canvas.height;
  const w = CITY_ROLE_BOARD_TEXTURE_WIDTH;
  const h = CITY_ROLE_BOARD_TEXTURE_HEIGHT;
  const sector = board.sector;
  const rowCount = Math.max(CITY_ROLE_BOARD_SLOT_COUNT, sector.roles.length);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, pixelW, pixelH);
  ctx.setTransform(pixelW / w, 0, 0, pixelH / h, 0, 0);
  ctx.fillStyle = 'rgba(0, 12, 15, 0.24)';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.shadowColor = 'rgba(98, 247, 255, 0.72)';
  ctx.shadowBlur = 22;
  ctx.strokeStyle = 'rgba(143, 252, 255, 0.92)';
  ctx.lineWidth = 8;
  ctx.strokeRect(58, 58, w - 116, h - 116);
  ctx.strokeStyle = 'rgba(98, 247, 255, 0.34)';
  ctx.lineWidth = 3;
  ctx.strokeRect(92, 104, w - 184, h - 164);
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '900 54px Menlo, Consolas, monospace';
  ctx.shadowColor = 'rgba(98, 247, 255, 0.58)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(210, 252, 255, 0.96)';
  ctx.fillText('AVSTUDIO ROLE BOARD', 118, 120);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(238, 255, 255, 0.92)';
  ctx.fillText('AVSTUDIO ROLE BOARD', 118, 120);

  const left = 118;
  const right = 118;
  const top = 190;
  const bottom = 74;
  const sectorHeaderH = 126;
  const listTop = top + sectorHeaderH + 28;
  const rowH = (h - listTop - bottom) / rowCount;

  ctx.fillStyle = 'rgba(0, 88, 106, 0.18)';
  ctx.fillRect(left, top, w - left - right, sectorHeaderH);
  ctx.strokeStyle = 'rgba(98, 247, 255, 0.36)';
  ctx.lineWidth = 3;
  ctx.strokeRect(left, top, w - left - right, sectorHeaderH);
  ctx.font = '900 72px Menlo, Consolas, monospace';
  ctx.shadowColor = 'rgba(98, 247, 255, 0.62)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(230, 255, 255, 0.98)';
  ctx.fillText(fitCityRoleBoardText(ctx, sector.label, w - left - right - 80), left + 34, top + 64);
  ctx.shadowBlur = 0;

  for (let row = 0; row < rowCount; row += 1) {
    const y = listTop + row * rowH;
    const rowMid = y + rowH * 0.5;
    const role = sector.roles[row] || '';
    const filled = role.length > 0;
    const isNoteRow = !filled && row === 0 && sector.note;

    ctx.save();
    ctx.fillStyle = filled || isNoteRow
      ? (row % 2 === 0 ? 'rgba(0, 88, 106, 0.17)' : 'rgba(0, 38, 46, 0.20)')
      : 'rgba(2, 24, 29, 0.25)';
    ctx.strokeStyle = filled || isNoteRow ? 'rgba(98, 247, 255, 0.30)' : 'rgba(98, 247, 255, 0.16)';
    ctx.lineWidth = filled || isNoteRow ? 2 : 1.5;
    if (!filled && !isNoteRow) ctx.setLineDash([10, 12]);
    ctx.fillRect(left, y, w - left - right, rowH - 8);
    ctx.strokeRect(left, y, w - left - right, rowH - 8);
    ctx.restore();

    if (!filled && !isNoteRow) continue;

    ctx.textAlign = 'center';
    ctx.font = '900 34px Menlo, Consolas, monospace';
    ctx.shadowColor = 'rgba(98, 247, 255, 0.50)';
    ctx.shadowBlur = 5;
    ctx.fillStyle = 'rgba(210, 252, 255, 0.95)';
    ctx.fillText(filled ? String(row + 1).padStart(2, '0') : '00', left + 52, rowMid);
    ctx.shadowBlur = 0;

    ctx.textAlign = 'left';
    ctx.font = filled ? '900 42px Menlo, Consolas, monospace' : '900 38px Menlo, Consolas, monospace';
    ctx.fillStyle = filled ? 'rgba(226, 255, 255, 0.92)' : 'rgba(143, 252, 255, 0.74)';
    const label = filled ? role : sector.note;
    ctx.fillText(fitCityRoleBoardText(ctx, label, w - left - right - 160), left + 126, rowMid);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  board.texture.needsUpdate = true;
  board.textureUpdates += 1;
}

export function syncCityRoleBoardDoorPose(board) {
  const record = board.record || sideBuildingRecords.find((item) => item.civicNumberValue === board.civicNumberValue);
  if (!record) return;
  board.record = record;
  const faceSign = record.sign < 0 ? 1 : -1;
  const doorWorldWidth = sideDoorWidth * sideDoorScale;
  const doorWorldHeight = sideDoorHeight * sideDoorScale;
  const wallX = record.mesh.position.x + faceSign * (
    record.collider.hw + sideDoorFaceOffset + SIDE_BUILDING_CIVIC_NUMBER_FIXED.faceOffset + 0.1
  );
  const doorY = sideDoorY;
  const doorZ = record.mesh.position.z;
  const rightAlongFacade = record.sign < 0 ? 1 : -1;
  board.boardPosition.set(
    wallX,
    doorY + doorWorldHeight * 0.56,
    doorZ + rightAlongFacade * (doorWorldWidth * 0.5 + CITY_ROLE_BOARD_WALL_CENTER_WIDTH * 0.5 + 1.2)
  );
  board.yaw = faceSign > 0 ? Math.PI / 2 : -Math.PI / 2;
  board.group.position.copy(board.boardPosition);
  board.group.rotation.set(0, board.yaw, 0);
  board.doorSynced = true;
}

function cityRoleBoardPoseSignature() {
  const parts = [
    sideDoorWidth.toFixed(3),
    sideDoorHeight.toFixed(3),
    sideDoorScale.toFixed(4),
    sideDoorY.toFixed(3),
    sideDoorFaceOffset.toFixed(3),
  ];
  for (const board of cityRoleBoards) {
    const record = board.record || sideBuildingRecords.find((item) => item.civicNumberValue === board.civicNumberValue);
    if (!record?.mesh || !record.collider) continue;
    parts.push(
      board.civicNumberValue,
      record.mesh.position.x.toFixed(3),
      record.mesh.position.z.toFixed(3),
      record.collider.hw.toFixed(3),
      record.sign,
    );
  }
  return parts.join('|');
}

function syncCityRoleBoardRevealVisibility(revealFactor = cityDepartmentBoardRevealFactor()) {
  const factor = THREE.MathUtils.clamp(revealFactor, 0, 1);
  let visibleCount = 0;
  for (const board of cityRoleBoards) {
    if (CITY_ROLE_BOARD_ENABLED && board.enabled && factor > 0.002) visibleCount += 1;
  }
  if (
    Math.abs(factor - cityRoleBoardRuntimeStats.lastRevealFactor) < CITY_ROLE_BOARD_REVEAL_EPS
    && visibleCount === cityRoleBoardRuntimeStats.lastVisibleCount
  ) {
    cityRoleBoardRuntimeStats.revealSkips += 1;
    return;
  }
  cityRoleBoardRuntimeStats.lastRevealFactor = factor;
  cityRoleBoardRuntimeStats.lastVisibleCount = visibleCount;
  for (const board of cityRoleBoards) {
    const visible = Boolean(CITY_ROLE_BOARD_ENABLED && board.enabled && factor > 0.002 && fxEnabled('roleBoards'));
    if (board.group.visible !== visible) board.group.visible = visible;
    for (const material of board.revealMaterials) {
      const baseOpacity = Number.isFinite(material.userData.cityRoleBoardBaseOpacity)
        ? material.userData.cityRoleBoardBaseOpacity
        : material.opacity;
      const nextOpacity = baseOpacity * factor;
      if (Math.abs((material.opacity ?? 0) - nextOpacity) < CITY_ROLE_BOARD_REVEAL_EPS) continue;
      material.opacity = nextOpacity;
      // opacity is a uniform; no needsUpdate/program refresh required for the fade
      cityRoleBoardRuntimeStats.revealWrites += 1;
    }
  }
}

function createCityRoleBoard(record, sector) {
  const textureResources = createCityRoleBoardTextureResources();
  const board = {
    enabled: true,
    record,
    sector,
    civicNumberValue: record.civicNumberValue,
    group: new THREE.Group(),
    boardPosition: new THREE.Vector3(0, cityDepartmentBoardBottomY() + CITY_ROLE_BOARD_HEIGHT * 0.5, 0),
    boardWidth: CITY_ROLE_BOARD_WIDTH,
    boardHeight: CITY_ROLE_BOARD_HEIGHT,
    yaw: 0,
    textMesh: null,
    panelMesh: null,
    revealMaterials: [],
    canvas: textureResources.canvas,
    ctx: textureResources.ctx,
    texture: textureResources.texture,
    textMaterial: textureResources.material,
    doorSynced: false,
    textureUpdates: 0,
  };
  board.group.name = `city-role-board-civic-${record.civicNumberValue}`;
  syncCityRoleBoardDoorPose(board);
  board.group.renderOrder = 34;

  const panel = new THREE.Mesh(new THREE.PlaneGeometry(board.boardWidth, board.boardHeight), cityRoleBoardPanelMat);
  panel.name = `city-role-board-panel-civic-${record.civicNumberValue}`;
  panel.renderOrder = 31;
  panel.frustumCulled = true;
  board.group.add(panel);
  board.panelMesh = panel;

  const text = new THREE.Mesh(new THREE.PlaneGeometry(board.boardWidth * 0.96, board.boardHeight * 0.96), board.textMaterial);
  text.name = `city-role-board-text-civic-${record.civicNumberValue}`;
  text.position.z = 0.12;
  text.renderOrder = 35;
  text.frustumCulled = true;
  board.group.add(text);
  board.textMesh = text;
  addCityDepartmentFrame(board.group, board.boardWidth, board.boardHeight, 0.16);
  board.group.traverse((/** @type {NodoForseMesh} */ object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (!material || !Number.isFinite(material.opacity)) return;
      material.transparent = true;
      material.depthTest = CITY_ROLE_BOARD_DEPTH_TEST;
      material.depthWrite = false;
      material.userData.cityRoleBoardBaseOpacity = material.opacity;
      board.revealMaterials.push(material);
    });
  });
  board.group.visible = false;
  scene.add(board.group);
  drawCityRoleBoardTexture(board);
  return board;
}

function buildCityRoleBoards() {
  if (!CITY_ROLE_BOARD_ENABLED || cityRoleBoards.length) return;
  for (const civicNumberValue of CITY_ROLE_BOARD_TARGET_CIVICS) {
    const record = sideBuildingRecords.find((item) => item.civicNumberValue === civicNumberValue);
    const sector = CITY_ROLE_BOARD_SECTORS.find((item) => item.civicNumberValue === civicNumberValue);
    if (!record || !sector) continue;
    cityRoleBoards.push(createCityRoleBoard(record, sector));
  }
  syncCityRoleBoardRevealVisibility(0);
}

export function updateCityRoleBoard() {
  if (!cityRoleBoards.length) return;
  const now = performance.now();
  if (now - (cityRoleBoardRuntimeStats.lastPoseCheckMs || 0) >= CITY_BOARD_POSE_CHECK_INTERVAL_MS) {
    cityRoleBoardRuntimeStats.lastPoseCheckMs = now;
    const poseSignature = cityRoleBoardPoseSignature();
    if (poseSignature !== cityRoleBoardRuntimeStats.lastPoseSignature) {
      cityRoleBoardRuntimeStats.lastPoseSignature = poseSignature;
      cityRoleBoardRuntimeStats.poseSyncs += 1;
      for (const board of cityRoleBoards) syncCityRoleBoardDoorPose(board);
    } else {
      cityRoleBoardRuntimeStats.poseSkips += 1;
    }
  }
  syncCityRoleBoardRevealVisibility();
}

export function cityRoleBoardInspect() {
  const firstBoard = cityRoleBoards[0] || null;
  const factor = cityDepartmentBoardRevealFactor();
  return {
    enabled: CITY_ROLE_BOARD_ENABLED,
    built: cityRoleBoards.length > 0,
    count: cityRoleBoards.length,
    targetCivic: firstBoard?.civicNumberValue ?? null,
    targetCivics: [...CITY_ROLE_BOARD_TARGET_CIVICS],
    selectedSector: firstBoard?.sector?.label ?? null,
    roles: [...(firstBoard?.sector?.roles || [])],
    roleCount: firstBoard?.sector?.roles?.length ?? 0,
    visible: cityRoleBoards.some((board) => board.group.visible),
    visibleCount: cityRoleBoards.filter((board) => board.group.visible).length,
    revealFactor: Number(factor.toFixed(3)),
    textureUpdates: cityRoleBoards.reduce((sum, board) => sum + board.textureUpdates, 0),
    doorSynced: cityRoleBoards.every((board) => board.doorSynced),
    boardWidth: firstBoard?.boardWidth ?? CITY_ROLE_BOARD_WIDTH,
    boardHeight: firstBoard?.boardHeight ?? CITY_ROLE_BOARD_HEIGHT,
    textureWidth: firstBoard?.canvas?.width ?? CITY_ROLE_BOARD_TEXTURE_WIDTH * CITY_ROLE_BOARD_TEXTURE_SCALE,
    textureHeight: firstBoard?.canvas?.height ?? CITY_ROLE_BOARD_TEXTURE_HEIGHT * CITY_ROLE_BOARD_TEXTURE_SCALE,
    textureScale: CITY_ROLE_BOARD_TEXTURE_SCALE,
    textureMipmaps: firstBoard?.texture?.generateMipmaps ?? false,
    panelMaterialType: cityRoleBoardPanelMat.type,
    textMaterialType: firstBoard?.textMaterial?.type ?? null,
    panelBaseOpacity: CITY_ROLE_BOARD_PANEL_BASE_OPACITY,
    textBaseOpacity: CITY_ROLE_BOARD_TEXT_BASE_OPACITY,
    panelOpacity: firstBoard?.panelMesh?.material?.opacity ?? null,
    textOpacity: firstBoard?.textMaterial?.opacity ?? null,
    updateOptimized: cityRoleBoardRuntimeStats.updateOptimized,
    runtime: {
      poseSyncs: cityRoleBoardRuntimeStats.poseSyncs,
      poseSkips: cityRoleBoardRuntimeStats.poseSkips,
      revealWrites: cityRoleBoardRuntimeStats.revealWrites,
      revealSkips: cityRoleBoardRuntimeStats.revealSkips,
      lastRevealFactor: Number(Math.max(0, cityRoleBoardRuntimeStats.lastRevealFactor).toFixed(3)),
    },
    sectors: CITY_ROLE_BOARD_SECTORS.map((sector) => ({
      civicNumberValue: sector.civicNumberValue,
      label: sector.label,
      roleCount: sector.roles.length,
      roles: [...sector.roles],
      note: sector.note || null,
    })),
    boards: cityRoleBoards.map((board) => {
      const door = board.record?.sideDoor;
      return {
        civicNumberValue: board.civicNumberValue,
        selectedSector: board.sector.label,
        roles: [...board.sector.roles],
        roleCount: board.sector.roles.length,
        note: board.sector.note || null,
        visible: Boolean(board.group.visible),
        revealFactor: Number(factor.toFixed(3)),
        textureUpdates: board.textureUpdates,
        doorSynced: board.doorSynced,
        boardWidth: board.boardWidth,
        boardHeight: board.boardHeight,
        textureWidth: board.canvas.width,
        textureHeight: board.canvas.height,
        textureMipmaps: board.texture.generateMipmaps,
        textMaterialType: board.textMaterial.type,
        panelOpacity: board.panelMesh?.material?.opacity ?? null,
        textOpacity: board.textMaterial?.opacity ?? null,
        boardChildren: board.group.children.length,
        yaw: board.yaw,
        boardPosition: {
          x: board.boardPosition.x,
          y: board.boardPosition.y,
          z: board.boardPosition.z,
        },
        doorPosition: {
          x: door?.position?.x ?? null,
          y: door?.position?.y ?? null,
          z: door?.position?.z ?? null,
        },
      };
    }),
  };
}
if (typeof window !== 'undefined') window.__cityRoleBoardInspect = cityRoleBoardInspect;

export function getCityRoleBoards() {
  return cityRoleBoards;
}

export function initCityRoleBoards(d) {
  ({
    renderer,
    scene,
    sideBuildingRecords,
    sideDoorWidth,
    sideDoorHeight,
    sideDoorScale,
    sideDoorY,
    sideDoorFaceOffset,
    SIDE_BUILDING_CIVIC_NUMBER_FIXED,
  } = d);
  buildCityRoleBoards();
}
