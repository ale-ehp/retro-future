import * as THREE from 'three';
import {
  getHexTileHeightScale,
  getHexTileScale,
  hexTileColumnStep,
  hexTileGeo,
  hexTileRadius,
  hexTileRowStep,
  roadTileTopY,
} from './hex-tiles.js';

// ---------- boundary-error VISUAL subsystem ----------
// The "//error" wall/sprite/overlay + glitch texture + floor-light + road-boundary pulse meshes +
// boundary-hex perimeter rows + noclip toggle. This is the VISUAL half only — the collision logic
// (roadHexBoundaryLimits, isCameraCollisionDisabled, road-boundary collision resolution) stays in
// main.js and is extracted later (A3).
//
// Design (rearchitecting spec §4-correct): this subsystem's PRIVATE state lives here as module-level
// `let`s + setters (the established city-boards / facade-led-controls / equalizer pattern), NOT dumped
// into ctx.state. The ONLY genuinely cross-subsystem field is `noclipEnabled` (this module writes it
// via setTronNoclip; main's collision `isCameraCollisionDisabled` reads it via getTronNoclipEnabled),
// so it lives in ctx.state.boundaryError. Hex-lattice / dynamic-road / culling deps are injected by
// main and stay in main until A3, then re-pointed.
//
// NOTE: the world ctx is held as `world` (NOT `ctx`) on purpose — the texture factories below declare
// `const ctx = canvas.getContext('2d')`, so a module-level `ctx` would be a footgun.

// ---------- world ctx + injected deps (assigned in initBoundaryError) ----------
let world = null;
let scene = null;
let camera = null;
// injected under their original names → moved bodies stay verbatim
let roadHexBoundaryLimits = null;
let roadBoundaryHexRowOffsets = null; // main owns the array (mutated by applyLiveControls); passed by ref
let tunedColor = null;
let refreshCullingBounds = null;
let movementVelocity = null;
let controlEls = null;
let cyan = 0x62f7ff;
// injected getters for reassignable main `let`s (must read live, not snapshot)
let getDynamicRoadSurfaceWidth = null;
let getDynamicRoadLength = null;
let getDynamicRoadCenter = null;

// ---------- module-private constants ----------
const ROAD_BOUNDARY_PULSE_HEIGHT = 8;
const ROAD_BOUNDARY_ROW_MAX = 10; // mirrors main's offsets-array length; used to clamp the row index
const ROAD_BOUNDARY_PULSE_EDGES = ['minX', 'maxX', 'minZ', 'maxZ'];
const BOUNDARY_ERROR_WALL_RELOCATE_THRESHOLD = 3.5;
const BOUNDARY_ERROR_OLD_FADE_SECONDS = 1;
const boundaryErrorHalfFovRad = THREE.MathUtils.degToRad(100); // 200 degree total visibility cone.
const boundaryErrorRenderHalfFovRad = THREE.MathUtils.degToRad(58); // keep the panel out of side/back view.

// ---------- module-private scratch ----------
const boundaryErrorWorldPosition = new THREE.Vector3();
const boundaryErrorPinnedWallPosition = new THREE.Vector3();
const boundaryErrorNextWallPosition = new THREE.Vector3();
const boundaryErrorWallCheckPosition = new THREE.Vector3();
const boundaryErrorScreenPosition = new THREE.Vector3();
const boundaryErrorCameraForward = new THREE.Vector3();
const boundaryErrorViewVector = new THREE.Vector3();
const boundaryErrorPlaneNormal = new THREE.Vector3(0, 0, 1);
const boundaryErrorWallNormal = new THREE.Vector3(0, 0, 1);
// private instance-compose scratch (own copies of the hex-tile scratch; quaternion is always identity)
const boundaryHexInstanceMatrix = new THREE.Matrix4();
const boundaryHexInstancePosition = new THREE.Vector3();
const boundaryHexInstanceQuaternion = new THREE.Quaternion();
const boundaryHexInstanceScale = new THREE.Vector3();

// ---------- module-private tunable state (visual; defaults match the former main.js decls) ----------
let roadBoundaryHexEnabled = true;
let roadBoundaryHexRows = 2;
let roadBoundaryHexY = -0.18;
let roadBoundaryHexAlpha = 0.32;
let roadBoundaryHexFillBrightness = 1;
let roadBoundaryHexOutsetScale = 1;
let roadBoundaryPulseStrength = 0.46;
let boundaryErrorVisible = true;
let boundaryErrorSize = 1;
let boundaryErrorAnchor = 'wall';
let boundaryErrorAnimation = 0.7;
let boundaryErrorDuration = 3;
let boundaryErrorGlitch = 0.65;
let boundaryErrorRenderMode = '3d';
let boundaryErrorFloorLightEnabled = true;
let boundaryErrorFloorLightRadius = 12;
let boundaryErrorFloorLightIntensity = 1;
let boundaryErrorFloorLightOpacity = 0.42;
let boundaryErrorFloorLightHue = 0;
let boundaryErrorFloorLightY = 0.18;
let boundaryErrorFloorLightSoftness = 0.85;
let boundaryErrorFloorLightTextureSoftness = -1;
let boundaryErrorPulse = 0;
let boundaryErrorAge = 0;
let boundaryErrorEdge = 'maxX';

// ---------- module-private runtime state ----------
let roadBoundaryHexBatch = null;
let roadBoundaryHexCapacity = 0;
let roadBoundaryHexCount = 0;
const roadBoundaryPulseMeshes = {};
let lastRoadBoundaryPulseEdge = null;
let lastRoadBoundaryPulseAt = 0;
let boundaryErrorOldWallFade = 0;
let boundaryErrorOldWallFadeStartedAt = 0;
let boundaryErrorTextureLastAge = -Infinity;
let boundaryErrorTextureLastStrength = -1;

// ---------- meshes / materials / textures (built in initBoundaryError, after scene exists) ----------
let boundaryErrorOverlay = null;
let roadBoundaryHexMat = null;
let roadBoundaryHexFillMat = null;
let roadBoundaryHexBottomMat = null;
let roadBoundaryPulseMat = null;
let boundaryErrorTexture = null;
let boundaryErrorSprite = null;
let boundaryErrorWallMesh = null;
let boundaryErrorOldWallMesh = null;
let boundaryErrorBaseImage = null;
let boundaryErrorGlitchCanvas = null;
let boundaryErrorFloorLightMat = null;
let boundaryErrorFloorLightMesh = null;

// ---------- textures ----------
function makeBoundaryErrorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const panelX = 72;
  const panelY = 58;
  const panelW = 624;
  const panelH = 214;
  const headerH = 42;

  ctx.save();
  ctx.shadowColor = 'rgba(98,247,255,0.62)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = 'rgba(4,17,21,0.76)';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.restore();

  ctx.fillStyle = 'rgba(101,242,255,0.12)';
  ctx.fillRect(panelX, panelY, panelW, headerH);
  ctx.fillStyle = 'rgba(2,9,12,0.72)';
  ctx.fillRect(panelX + 20, panelY + headerH + 18, panelW - 40, panelH - headerH - 38);

  ctx.strokeStyle = 'rgba(214,253,255,0.94)';
  ctx.lineWidth = 3.2;
  ctx.shadowColor = 'rgba(98,247,255,0.86)';
  ctx.shadowBlur = 16;
  ctx.strokeRect(panelX, panelY, panelW, panelH);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(98,247,255,0.34)';
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX + 18, panelY + headerH + 16, panelW - 36, panelH - headerH - 34);

  ctx.font = '900 34px Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(232,254,255,0.96)';
  ctx.shadowColor = 'rgba(98,247,255,0.88)';
  ctx.shadowBlur = 10;
  ctx.fillText('x', panelX + panelW - 31, panelY + headerH * 0.52);

  ctx.font = '900 84px Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(98,247,255,0.92)';
  ctx.shadowBlur = 24;
  ctx.fillStyle = 'rgba(18,94,104,0.38)';
  ctx.fillText('//error', 394, 187);
  ctx.fillStyle = 'rgba(232,254,255,0.96)';
  ctx.fillText('//error', 384, 176);
  ctx.shadowBlur = 6;
  ctx.strokeStyle = 'rgba(98,247,255,0.86)';
  ctx.lineWidth = 2.4;
  ctx.strokeText('//error', 384, 176);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = 'rgba(98,247,255,0.9)';
  for (let y = panelY + headerH + 24; y < panelY + panelH - 18; y += 8) {
    ctx.fillRect(panelX + 24, y, panelW - 48, 1);
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeBoundaryErrorGlitchTexture(phase = 0, strength = 0.65) {
  const canvas = boundaryErrorGlitchCanvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(boundaryErrorBaseImage, 0, 0);
  const amount = THREE.MathUtils.clamp(strength, 0, 2);
  if (amount <= 0.001) return canvas;
  const seed = Math.floor(phase * 1000) % 997;
  const slices = 3 + Math.floor(amount * 5);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < slices; i++) {
    const y = 118 + ((seed * 17 + i * 31) % 118);
    const h = 3 + ((seed + i * 13) % 14) * amount;
    const shift = (((seed + i * 7) % 2) ? 1 : -1) * (4 + ((seed + i * 19) % 22)) * amount;
    ctx.globalAlpha = 0.22 + amount * 0.12;
    ctx.drawImage(canvas, 130, y, 500, h, 130 + shift, y, 500, h);
  }
  ctx.globalAlpha = Math.min(0.46, amount * 0.24);
  ctx.fillStyle = 'rgba(98,247,255,0.85)';
  for (let i = 0; i < 5; i++) {
    const y = 112 + ((seed * 11 + i * 41) % 132);
    const x = 146 + ((seed * 23 + i * 37) % 430);
    ctx.fillRect(x, y, 60 + ((seed + i * 5) % 160), 2 + amount * 1.4);
  }
  ctx.restore();
  return canvas;
}

function updateBoundaryErrorGlitchTexture(glitchSnap) {
  if (boundaryErrorGlitch <= 0.001) {
    if (boundaryErrorTexture.image !== boundaryErrorBaseImage) {
      boundaryErrorTexture.image = boundaryErrorBaseImage;
      boundaryErrorTexture.source.data = boundaryErrorBaseImage;
      boundaryErrorTexture.needsUpdate = true;
    }
    boundaryErrorTextureLastAge = -Infinity;
    boundaryErrorTextureLastStrength = -1;
    return;
  }
  const nextStrength = boundaryErrorGlitch * (0.45 + boundaryErrorPulse * 0.55);
  const textureAgeDelta = boundaryErrorAge - boundaryErrorTextureLastAge;
  if (
    textureAgeDelta < 0.08 &&
    Math.abs(nextStrength - boundaryErrorTextureLastStrength) < 0.08
  ) {
    return;
  }
  const nextImage = makeBoundaryErrorGlitchTexture(
    boundaryErrorAge + glitchSnap,
    nextStrength
  );
  boundaryErrorTexture.image = nextImage;
  boundaryErrorTexture.source.data = nextImage;
  boundaryErrorTexture.needsUpdate = true;
  boundaryErrorTextureLastAge = boundaryErrorAge;
  boundaryErrorTextureLastStrength = nextStrength;
}

function makeBoundaryErrorFloorLightTexture(softness = 0.85) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const center = canvas.width / 2;
  const falloff = THREE.MathUtils.clamp(softness, 0.2, 1.8);
  const gradient = ctx.createRadialGradient(center, center, 2, center, center, center);
  gradient.addColorStop(0, 'rgba(255,255,255,0.88)');
  gradient.addColorStop(Math.min(0.82, 0.16 * falloff), 'rgba(255,255,255,0.34)');
  gradient.addColorStop(Math.min(0.94, 0.46 * falloff), 'rgba(255,255,255,0.11)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function refreshBoundaryErrorFloorLightTexture() {
  const nextSoftness = Number(boundaryErrorFloorLightSoftness.toFixed(3));
  if (Math.abs(boundaryErrorFloorLightTextureSoftness - nextSoftness) < 0.001) return;
  boundaryErrorFloorLightTextureSoftness = nextSoftness;
  boundaryErrorFloorLightMat.map?.dispose?.();
  boundaryErrorFloorLightMat.map = makeBoundaryErrorFloorLightTexture(nextSoftness);
  boundaryErrorFloorLightMat.needsUpdate = true;
}

// ---------- wall / sprite / overlay hide + noclip ----------
function hideBoundaryErrorOldWall() {
  boundaryErrorOldWallMesh.visible = false;
  boundaryErrorOldWallFade = 0;
  boundaryErrorOldWallMesh.material.opacity = 0;
}

export function hideBoundaryErrorVisuals(keepOldWall = true) {
  boundaryErrorSprite.visible = false;
  boundaryErrorWallMesh.visible = false;
  if (!keepOldWall) hideBoundaryErrorOldWall();
  boundaryErrorOverlay.style.opacity = '0';
  boundaryErrorOverlay.style.setProperty('--error-glitch-opacity', '0');
  boundaryErrorOverlay.style.setProperty('--error-glitch-x', '0');
  boundaryErrorFloorLightMesh.visible = false;
}

function syncTronNoclipControl() {
  if (!controlEls.noclipEnabled) return;
  const value = world.state.boundaryError.noclipEnabled ? 'on' : 'off';
  controlEls.noclipEnabled.value = value;
  controlEls.noclipEnabledVal.textContent = value;
}

export function setTronNoclip(enabled = !world.state.boundaryError.noclipEnabled, options = {}) {
  world.state.boundaryError.noclipEnabled = Boolean(enabled);
  if (world.state.boundaryError.noclipEnabled) {
    boundaryErrorPulse = 0;
    hideBoundaryErrorVisuals(false);
    movementVelocity.set(0, 0, 0);
  }
  syncTronNoclipControl();
  const status = {
    noclip: world.state.boundaryError.noclipEnabled,
    command: 'tronNoclip() toggles, tronNoclip(true) enables, tronNoclip(false) disables',
  };
  if (!options.silent) console.log(`TRON noclip ${world.state.boundaryError.noclipEnabled ? 'on' : 'off'}`, status);
  return status;
}

// ---------- boundary-hex perimeter rows ----------
function roadBoundaryAlignedGridPosition(col, row) {
  const xStep = hexTileColumnStep();
  const zStep = hexTileRowStep();
  const localX = col * xStep;
  const zOffset = (col & 1) ? zStep * 0.5 : 0;
  const localZ = row * zStep + zOffset;
  return [localX, getDynamicRoadCenter() + localZ];
}

function roadBoundaryHexPositions() {
  if (!roadBoundaryHexEnabled || roadBoundaryHexRows <= 0) return [];
  const limits = roadHexBoundaryLimits();
  const positions = [];
  // same-grid-as-road-hexes: perimeter tiles are sampled from the boulevard hex lattice.
  const xStep = hexTileColumnStep();
  const zStep = hexTileRowStep();
  const halfW = getDynamicRoadSurfaceWidth() / 2;
  const halfL = getDynamicRoadLength() / 2;
  const rowStep = Math.max(xStep, zStep) * Math.max(0.2, roadBoundaryHexOutsetScale);
  const band = rowStep * roadBoundaryHexRows;
  const edgeBleed = hexTileRadius * 0.08;
  const minCol = Math.floor((limits.visualMinX - band) / xStep) - 1;
  const maxCol = Math.ceil((limits.visualMaxX + band) / xStep) + 1;
  const minRow = Math.floor((-halfL - band) / zStep) - 2;
  const maxRow = Math.ceil((halfL + band) / zStep) + 2;
  for (let col = minCol; col <= maxCol; col++) {
    for (let row = minRow; row <= maxRow; row++) {
      const [x, z] = roadBoundaryAlignedGridPosition(col, row);
      const localZ = z - getDynamicRoadCenter();
      const insideRoad =
        Math.abs(x) <= halfW + edgeBleed &&
        Math.abs(localZ) <= halfL + edgeBleed;
      if (insideRoad) continue;
      const nearRoad =
        Math.abs(x) <= halfW + band &&
        Math.abs(localZ) <= halfL + band;
      if (!nearRoad) continue;
      const outsideX = Math.max(0, Math.abs(x) - halfW);
      const outsideZ = Math.max(0, Math.abs(localZ) - halfL);
      const rowIndex = THREE.MathUtils.clamp(
        Math.floor(Math.max(outsideX, outsideZ) / Math.max(0.001, rowStep)),
        0,
        Math.min(ROAD_BOUNDARY_ROW_MAX - 1, Math.max(0, roadBoundaryHexRows - 1))
      );
      positions.push({
        x,
        y: roadBoundaryHexY + (roadBoundaryHexRowOffsets[rowIndex] || 0),
        z,
        row: rowIndex,
      });
    }
  }
  return positions;
}

function ensureRoadBoundaryHexCapacity(count) {
  if (roadBoundaryHexBatch && roadBoundaryHexCapacity >= count) return;
  if (roadBoundaryHexBatch) {
    scene.remove(roadBoundaryHexBatch);
    roadBoundaryHexBatch.geometry.dispose();
  }
  roadBoundaryHexCapacity = Math.max(1, Math.ceil(count * 1.2));
  roadBoundaryHexBatch = new THREE.InstancedMesh(hexTileGeo, [roadBoundaryHexMat, roadBoundaryHexFillMat, roadBoundaryHexBottomMat], roadBoundaryHexCapacity);
  roadBoundaryHexBatch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  roadBoundaryHexBatch.frustumCulled = true;
  roadBoundaryHexBatch.renderOrder = 2;
  scene.add(roadBoundaryHexBatch);
}

export function updateRoadBoundaryHexRows() {
  const positions = roadBoundaryHexPositions();
  ensureRoadBoundaryHexCapacity(positions.length);
  const boundaryScaleY = Math.max(0.22, getHexTileHeightScale() * 0.58);
  boundaryHexInstanceScale.set(getHexTileScale(), boundaryScaleY, getHexTileScale());
  positions.forEach((point, index) => {
    boundaryHexInstancePosition.set(point.x, point.y, point.z);
    boundaryHexInstanceMatrix.compose(boundaryHexInstancePosition, boundaryHexInstanceQuaternion, boundaryHexInstanceScale);
    roadBoundaryHexBatch.setMatrixAt(index, boundaryHexInstanceMatrix);
  });
  roadBoundaryHexCount = positions.length;
  roadBoundaryHexBatch.count = roadBoundaryHexCount;
  roadBoundaryHexBatch.visible = roadBoundaryHexCount > 0;
  roadBoundaryHexBatch.instanceMatrix.needsUpdate = true;
  refreshCullingBounds(roadBoundaryHexBatch);
}

export function updateRoadBoundaryHexMaterial(hueDeg, brightness = 1) {
  const sideColor = tunedColor(new THREE.Color(0x5ddfed), hueDeg, 1, Math.max(0.2, brightness));
  const fillBrightness = Math.max(0.02, brightness * roadBoundaryHexFillBrightness);
  const fillColor = tunedColor(new THREE.Color(0x5ddfed), hueDeg, 1, fillBrightness);
  const fillEmissive = tunedColor(new THREE.Color(0x0b6f7d), hueDeg, 1, Math.max(0.2, fillBrightness));
  roadBoundaryHexMat.color.copy(sideColor);
  roadBoundaryHexMat.emissive.copy(tunedColor(new THREE.Color(0x0b6f7d), hueDeg, 1, Math.max(0.32, brightness)));
  roadBoundaryHexMat.opacity = 0.38;
  roadBoundaryHexFillMat.color.copy(fillColor);
  roadBoundaryHexFillMat.emissive.copy(fillEmissive);
  roadBoundaryHexFillMat.emissiveIntensity = 0.1 + roadBoundaryHexFillBrightness * 0.26;
  roadBoundaryHexFillMat.opacity = roadBoundaryHexAlpha;
  roadBoundaryHexBottomMat.color.copy(fillColor);
  roadBoundaryHexBottomMat.emissive.copy(fillEmissive);
  roadBoundaryHexBottomMat.emissiveIntensity = roadBoundaryHexFillMat.emissiveIntensity;
  roadBoundaryHexBottomMat.opacity = 0;
}

// ---------- road-boundary pulse ----------
function ensureRoadBoundaryPulseMeshes() {
  if (roadBoundaryPulseMeshes.minX) return;
  ROAD_BOUNDARY_PULSE_EDGES.forEach((edge) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), roadBoundaryPulseMat.clone());
    mesh.visible = false;
    mesh.userData.edge = edge;
    mesh.userData.pulse = 0;
    mesh.frustumCulled = true;
    mesh.renderOrder = 8;
    scene.add(mesh);
    roadBoundaryPulseMeshes[edge] = mesh;
  });
}

function setRoadBoundaryPulseGeometry(mesh, width, height) {
  mesh.geometry.dispose();
  mesh.geometry = new THREE.PlaneGeometry(Math.max(0.01, width), Math.max(0.01, height));
  refreshCullingBounds(mesh);
}

export function updateRoadBoundaryPulseLayout() {
  ensureRoadBoundaryPulseMeshes();
  const limits = roadHexBoundaryLimits();
  const centerZ = (limits.minZ + limits.maxZ) * 0.5;
  const centerY = roadTileTopY() + ROAD_BOUNDARY_PULSE_HEIGHT * 0.5;
  const width = limits.maxX - limits.minX;
  const length = limits.maxZ - limits.minZ;

  setRoadBoundaryPulseGeometry(roadBoundaryPulseMeshes.minZ, width, ROAD_BOUNDARY_PULSE_HEIGHT);
  roadBoundaryPulseMeshes.minZ.rotation.set(0, 0, 0);
  roadBoundaryPulseMeshes.minZ.position.set(0, centerY, limits.minZ);

  setRoadBoundaryPulseGeometry(roadBoundaryPulseMeshes.maxZ, width, ROAD_BOUNDARY_PULSE_HEIGHT);
  roadBoundaryPulseMeshes.maxZ.rotation.set(0, Math.PI, 0);
  roadBoundaryPulseMeshes.maxZ.position.set(0, centerY, limits.maxZ);

  setRoadBoundaryPulseGeometry(roadBoundaryPulseMeshes.minX, length, ROAD_BOUNDARY_PULSE_HEIGHT);
  roadBoundaryPulseMeshes.minX.rotation.set(0, Math.PI / 2, 0);
  roadBoundaryPulseMeshes.minX.position.set(limits.minX, centerY, centerZ);

  setRoadBoundaryPulseGeometry(roadBoundaryPulseMeshes.maxX, length, ROAD_BOUNDARY_PULSE_HEIGHT);
  roadBoundaryPulseMeshes.maxX.rotation.set(0, -Math.PI / 2, 0);
  roadBoundaryPulseMeshes.maxX.position.set(limits.maxX, centerY, centerZ);
}

export function triggerRoadBoundaryPulse(edge) {
  const now = performance.now();
  if (edge === lastRoadBoundaryPulseEdge && now - lastRoadBoundaryPulseAt < 120) return;
  lastRoadBoundaryPulseEdge = edge;
  lastRoadBoundaryPulseAt = now;
  updateRoadBoundaryPulseLayout();
  const mesh = roadBoundaryPulseMeshes[edge];
  if (!mesh) return;
  mesh.userData.pulse = 1;
  mesh.visible = true;
}

export function updateRoadBoundaryPulse(dt) {
  ensureRoadBoundaryPulseMeshes();
  for (const edge of ROAD_BOUNDARY_PULSE_EDGES) {
    const mesh = roadBoundaryPulseMeshes[edge];
    if (!mesh) continue;
    const pulse = Math.max(0, (mesh.userData.pulse || 0) - dt * 1.8);
    mesh.userData.pulse = pulse;
    mesh.visible = pulse > 0.01;
    mesh.material.opacity = Math.pow(pulse, 1.35) * roadBoundaryPulseStrength;
    mesh.scale.setScalar(1 + (1 - pulse) * 0.045);
    mesh.scale.y = 1 + (1 - pulse) * 0.72;
  }
}

// ---------- error wall / sprite / overlay ----------
function boundaryErrorPointForEdge(edge, target = boundaryErrorWorldPosition) {
  const limits = roadHexBoundaryLimits();
  const inset = 1.45;
  const x = THREE.MathUtils.clamp(camera.position.x, limits.minX, limits.maxX);
  const z = THREE.MathUtils.clamp(camera.position.z, limits.minZ, limits.maxZ);
  const y = Math.max(camera.position.y - 0.18, roadTileTopY() + 2.2);
  if (edge === 'minX') return target.set(limits.minX + inset, y, z);
  if (edge === 'maxX') return target.set(limits.maxX - inset, y, z);
  if (edge === 'minZ') return target.set(x, y, limits.minZ + inset);
  return target.set(x, y, limits.maxZ - inset);
}

function boundaryErrorViewDotTo(point = boundaryErrorWorldPosition) {
  camera.getWorldDirection(boundaryErrorCameraForward);
  boundaryErrorViewVector.subVectors(point, camera.position);
  boundaryErrorCameraForward.y = 0;
  boundaryErrorViewVector.y = 0;
  if (boundaryErrorViewVector.lengthSq() < 1e-6 || boundaryErrorCameraForward.lengthSq() < 1e-6) return 1;
  boundaryErrorCameraForward.normalize();
  boundaryErrorViewVector.normalize();
  return boundaryErrorCameraForward.dot(boundaryErrorViewVector);
}

function isBoundaryErrorInView(point = boundaryErrorWorldPosition, halfFovRad = boundaryErrorHalfFovRad) {
  return boundaryErrorViewDotTo(point) >= Math.cos(halfFovRad);
}

function isBoundaryErrorRenderable(point = boundaryErrorWorldPosition) {
  if (!isBoundaryErrorInView(point, boundaryErrorRenderHalfFovRad)) return false;
  boundaryErrorScreenPosition.copy(point).project(camera);
  if (boundaryErrorScreenPosition.z < -1 || boundaryErrorScreenPosition.z > 1) return false;
  return Math.abs(boundaryErrorScreenPosition.x) <= 1.08 && Math.abs(boundaryErrorScreenPosition.y) <= 1.08;
}

function boundaryErrorNormalForEdge(edge, target = boundaryErrorWallNormal) {
  if (edge === 'minX') return target.set(1, 0, 0);
  if (edge === 'maxX') return target.set(-1, 0, 0);
  if (edge === 'minZ') return target.set(0, 0, 1);
  return target.set(0, 0, -1);
}

function orientBoundaryErrorWallMesh(edge) {
  boundaryErrorNormalForEdge(edge, boundaryErrorWallNormal);
  boundaryErrorWallMesh.quaternion.setFromUnitVectors(boundaryErrorPlaneNormal, boundaryErrorWallNormal);
}

function stashCurrentBoundaryErrorWallMesh() {
  if (!boundaryErrorWallMesh.visible || boundaryErrorWallMesh.material.opacity <= 0.01) return;
  boundaryErrorOldWallMesh.position.copy(boundaryErrorWallMesh.position);
  boundaryErrorOldWallMesh.quaternion.copy(boundaryErrorWallMesh.quaternion);
  boundaryErrorOldWallMesh.scale.copy(boundaryErrorWallMesh.scale);
  boundaryErrorOldWallMesh.material.opacity = boundaryErrorWallMesh.material.opacity;
  boundaryErrorOldWallMesh.visible = true;
  boundaryErrorOldWallFade = 1;
  boundaryErrorOldWallFadeStartedAt = performance.now();
}

function updateOldBoundaryErrorWallMesh(dt) {
  if (!boundaryErrorOldWallMesh.visible) return;
  const elapsed = Math.max(0, (performance.now() - boundaryErrorOldWallFadeStartedAt) / 1000);
  boundaryErrorOldWallFade = Math.max(0, 1 - elapsed / BOUNDARY_ERROR_OLD_FADE_SECONDS);
  boundaryErrorOldWallMesh.material.opacity = Math.pow(boundaryErrorOldWallFade, 1.35);
  if (boundaryErrorOldWallFade <= 0.001) {
    boundaryErrorOldWallMesh.visible = false;
    boundaryErrorOldWallMesh.material.opacity = 0;
  }
}

function updateBoundaryErrorFloorLight(alpha) {
  if (!boundaryErrorFloorLightEnabled || alpha <= 0.01) {
    boundaryErrorFloorLightMesh.visible = false;
    return;
  }
  refreshBoundaryErrorFloorLightTexture();
  boundaryErrorFloorLightMesh.visible = true;
  boundaryErrorFloorLightMesh.position.set(
    boundaryErrorWorldPosition.x,
    roadTileTopY() + boundaryErrorFloorLightY,
    boundaryErrorWorldPosition.z
  );
  const diameter = Math.max(0.5, boundaryErrorFloorLightRadius * 2);
  boundaryErrorFloorLightMesh.scale.set(diameter, diameter, 1);
  boundaryErrorFloorLightMat.color.copy(tunedColor(new THREE.Color(cyan), boundaryErrorFloorLightHue, 1, 0.72 + boundaryErrorFloorLightIntensity * 0.34));
  boundaryErrorFloorLightMat.opacity = THREE.MathUtils.clamp(alpha * boundaryErrorFloorLightOpacity * boundaryErrorFloorLightIntensity, 0, 1.25);
}

export function triggerBoundaryError(edge = 'maxX') {
  if (!boundaryErrorVisible) return;
  boundaryErrorPointForEdge(edge, boundaryErrorNextWallPosition);
  if (boundaryErrorAnchor === 'wall' && boundaryErrorPulse > 0.05) {
    const moved = boundaryErrorEdge !== edge ||
      boundaryErrorPinnedWallPosition.distanceToSquared(boundaryErrorNextWallPosition) >
        BOUNDARY_ERROR_WALL_RELOCATE_THRESHOLD * BOUNDARY_ERROR_WALL_RELOCATE_THRESHOLD;
    if (!moved) {
      boundaryErrorPulse = Math.max(boundaryErrorPulse, 0.98);
      return;
    }
    stashCurrentBoundaryErrorWallMesh();
  }
  boundaryErrorEdge = edge;
  boundaryErrorWorldPosition.copy(boundaryErrorNextWallPosition);
  boundaryErrorPinnedWallPosition.copy(boundaryErrorNextWallPosition);
  if (!isBoundaryErrorInView(boundaryErrorWorldPosition)) {
    boundaryErrorPulse = 0;
    updateBoundaryError(0);
    return;
  }
  boundaryErrorPulse = 1;
  boundaryErrorAge = 0;
  updateBoundaryError(0);
}

export function updateBoundaryError(dt) {
  updateOldBoundaryErrorWallMesh(dt);
  boundaryErrorAge += dt;
  boundaryErrorPulse = Math.max(0, boundaryErrorPulse - dt / Math.max(0.4, boundaryErrorDuration));
  const visible = boundaryErrorVisible && boundaryErrorPulse > 0.01;
  if (!visible) {
    hideBoundaryErrorVisuals();
    return;
  }

  const alpha = Math.pow(boundaryErrorPulse, 1.9);
  const glitchPulse = boundaryErrorGlitch * boundaryErrorPulse;
  const flicker = boundaryErrorAnimation * glitchPulse * (
    Math.sin(boundaryErrorAge * 74) * 0.5 +
    Math.sin(boundaryErrorAge * 131) * 0.32
  );
  const glitchSnap = Math.max(0, Math.sin(boundaryErrorAge * 39.0) * Math.sin(boundaryErrorAge * 91.0));
  const scalePulse = 1 + boundaryErrorAnimation * boundaryErrorPulse * 0.035;

  if (boundaryErrorAnchor === 'wall') {
    boundaryErrorWallCheckPosition.copy(boundaryErrorPinnedWallPosition);
  } else {
    boundaryErrorPointForEdge(boundaryErrorEdge, boundaryErrorWallCheckPosition);
  }
  if (!isBoundaryErrorRenderable(boundaryErrorWallCheckPosition)) {
    boundaryErrorPulse = 0;
    hideBoundaryErrorVisuals();
    return;
  }

  if (boundaryErrorAnchor === 'camera') {
    camera.getWorldDirection(boundaryErrorCameraForward);
    boundaryErrorWorldPosition
      .copy(camera.position)
      .addScaledVector(boundaryErrorCameraForward, 8 + boundaryErrorSize * 2.2);
    boundaryErrorWorldPosition.y += 0.15;
  } else {
    boundaryErrorWorldPosition.copy(boundaryErrorPinnedWallPosition);
  }
  updateBoundaryErrorFloorLight(alpha);
  updateBoundaryErrorGlitchTexture(glitchSnap);

  if (boundaryErrorAnchor === 'wall') {
    boundaryErrorSprite.visible = false;
    boundaryErrorWallMesh.visible = true;
    boundaryErrorWallMesh.position.copy(boundaryErrorWorldPosition);
    boundaryErrorWallMesh.position.addScaledVector(boundaryErrorNormalForEdge(boundaryErrorEdge, boundaryErrorWallNormal), 0.12);
    orientBoundaryErrorWallMesh(boundaryErrorEdge);
    boundaryErrorWallMesh.scale.set(boundaryErrorSize * 11.5, boundaryErrorSize * 5.4, 1);
    boundaryErrorWallMesh.material.opacity = alpha;
    boundaryErrorOverlay.style.opacity = '0';
    return;
  }

  if (boundaryErrorRenderMode === '3d') {
    boundaryErrorWallMesh.visible = false;
    boundaryErrorSprite.visible = true;
    boundaryErrorSprite.position.copy(boundaryErrorWorldPosition);
    boundaryErrorSprite.position.x += glitchSnap * boundaryErrorGlitch * 0.035;
    boundaryErrorSprite.position.y += flicker * 0.08;
    boundaryErrorSprite.scale.set(boundaryErrorSize * 11.5 * scalePulse, boundaryErrorSize * 5.4 * scalePulse, 1);
    boundaryErrorSprite.material.opacity = alpha;
    boundaryErrorSprite.material.rotation = flicker * 0.009;
    boundaryErrorOverlay.style.opacity = '0';
    return;
  }

  boundaryErrorWallMesh.visible = false;
  boundaryErrorSprite.visible = false;
  boundaryErrorOverlay.style.opacity = String(alpha);
  boundaryErrorOverlay.style.fontSize = `${Math.round(18 + boundaryErrorSize * 28)}px`;
  boundaryErrorOverlay.style.filter = `brightness(${1 + boundaryErrorAnimation * boundaryErrorPulse * 0.35})`;
  if (boundaryErrorAnchor === 'wall') {
    boundaryErrorScreenPosition.copy(boundaryErrorWorldPosition).project(camera);
    const behindCamera = boundaryErrorScreenPosition.z < -1 || boundaryErrorScreenPosition.z > 1;
    const screenX = behindCamera ? 50 : (boundaryErrorScreenPosition.x * 0.5 + 0.5) * 100;
    const screenY = behindCamera ? 46 : (-boundaryErrorScreenPosition.y * 0.5 + 0.5) * 100;
    boundaryErrorOverlay.style.left = `${THREE.MathUtils.clamp(screenX, 8, 92)}%`;
    boundaryErrorOverlay.style.top = `${THREE.MathUtils.clamp(screenY, 12, 88)}%`;
  } else {
    boundaryErrorOverlay.style.left = '50%';
    boundaryErrorOverlay.style.top = '46%';
  }
  const jitterX = flicker * 5 + glitchSnap * boundaryErrorGlitch * 9;
  const jitterY = Math.sin(boundaryErrorAge * 93) * boundaryErrorAnimation * boundaryErrorPulse * 1.8;
  boundaryErrorOverlay.style.setProperty('--error-glitch-opacity', String(THREE.MathUtils.clamp(boundaryErrorGlitch * boundaryErrorPulse * 0.34, 0, 0.7)));
  boundaryErrorOverlay.style.setProperty('--error-glitch-x', `${(glitchSnap * boundaryErrorGlitch * 0.22).toFixed(3)}em`);
  boundaryErrorOverlay.style.transform = `translate(calc(-50% + ${jitterX.toFixed(2)}px), calc(-50% + ${jitterY.toFixed(2)}px)) scale(${scalePulse.toFixed(3)})`;
}

// ---------- collision-side hook + tick/inspect accessors (read/clear module-private state) ----------
export function clearBoundaryError() {
  boundaryErrorPulse = 0;
  hideBoundaryErrorVisuals();
}

export function boundaryErrorNeedsUpdate() {
  return boundaryErrorPulse > 0.98 || boundaryErrorOldWallMesh.visible;
}

export function getTronNoclipEnabled() {
  return Boolean(world && world.state.boundaryError && world.state.boundaryError.noclipEnabled);
}

export function getRoadBoundaryHexStats() {
  return {
    count: roadBoundaryHexCount,
    capacity: roadBoundaryHexCapacity,
    visible: Boolean(roadBoundaryHexBatch?.visible),
  };
}

export function boundaryErrorInspect() {
  return {
    boundaryErrorPulse,
    boundaryErrorTextureAge: boundaryErrorTextureLastAge,
  };
}

// ---------- control-write setters (visual vars only; collision vars stay in main) ----------
export function applyBoundaryErrorVisualSettings(values) {
  roadBoundaryPulseStrength = values.roadBoundaryPulseStrength;
  boundaryErrorVisible = values.boundaryErrorVisible;
  boundaryErrorSize = values.boundaryErrorSize;
  boundaryErrorAnchor = values.boundaryErrorAnchor;
  boundaryErrorAnimation = values.boundaryErrorAnimation;
  boundaryErrorDuration = values.boundaryErrorDuration;
  boundaryErrorGlitch = values.boundaryErrorGlitch;
  boundaryErrorRenderMode = values.boundaryErrorRenderMode;
  boundaryErrorFloorLightEnabled = values.boundaryErrorFloorLightEnabled;
  boundaryErrorFloorLightRadius = values.boundaryErrorFloorLightRadius;
  boundaryErrorFloorLightIntensity = values.boundaryErrorFloorLightIntensity;
  boundaryErrorFloorLightOpacity = values.boundaryErrorFloorLightOpacity;
  boundaryErrorFloorLightHue = values.boundaryErrorFloorLightHue;
  boundaryErrorFloorLightY = values.boundaryErrorFloorLightY;
  boundaryErrorFloorLightSoftness = values.boundaryErrorFloorLightSoftness;
  refreshBoundaryErrorFloorLightTexture();
  if (!boundaryErrorVisible) {
    boundaryErrorPulse = 0;
    hideBoundaryErrorVisuals(false);
  }
  if (!boundaryErrorFloorLightEnabled) boundaryErrorFloorLightMesh.visible = false;
}

export function applyRoadBoundaryHexVisualSettings(values) {
  roadBoundaryHexEnabled = values.roadBoundaryHexEnabled;
  roadBoundaryHexRows = values.roadBoundaryHexRows;
  roadBoundaryHexFillBrightness = values.roadBoundaryHexFillBrightness;
  roadBoundaryHexAlpha = values.roadBoundaryHexAlpha;
  roadBoundaryHexY = values.roadBoundaryHexY;
  roadBoundaryHexOutsetScale = values.roadBoundaryHexOutsetScale;
}

// ---------- init: wire deps, build meshes/materials in the scene, do the initial layout ----------
export function initBoundaryError(ctx, injected) {
  world = ctx;
  scene = ctx.scene;
  camera = ctx.camera;
  ({
    roadHexBoundaryLimits,
    roadBoundaryHexRowOffsets,
    tunedColor,
    refreshCullingBounds,
    movementVelocity,
    controlEls,
    cyan,
    getDynamicRoadSurfaceWidth,
    getDynamicRoadLength,
    getDynamicRoadCenter,
  } = injected);
  const reflectionEnvMap = injected.reflectionEnvMap;

  world.state.boundaryError = { noclipEnabled: false };

  boundaryErrorOverlay = document.getElementById('boundary-error-overlay');

  roadBoundaryHexMat = new THREE.MeshStandardMaterial({
    color: 0x5ddfed,
    metalness: 0.42,
    roughness: 0.32,
    envMap: reflectionEnvMap,
    envMapIntensity: 0.55,
    emissive: 0x0b6f7d,
    emissiveIntensity: 0.16,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  roadBoundaryHexFillMat = new THREE.MeshStandardMaterial({
    color: 0x5ddfed,
    metalness: 0.36,
    roughness: 0.34,
    envMap: reflectionEnvMap,
    envMapIntensity: 0.48,
    emissive: 0x0b6f7d,
    emissiveIntensity: 0.24,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  roadBoundaryHexBottomMat = roadBoundaryHexFillMat.clone();
  roadBoundaryHexBottomMat.opacity = 0;
  roadBoundaryHexBottomMat.depthWrite = false;
  roadBoundaryPulseMat = new THREE.MeshBasicMaterial({
    color: 0x7df6ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });

  boundaryErrorTexture = makeBoundaryErrorTexture();
  boundaryErrorSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: boundaryErrorTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  }));
  boundaryErrorSprite.visible = false;
  boundaryErrorSprite.renderOrder = 24;
  scene.add(boundaryErrorSprite);

  boundaryErrorWallMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: boundaryErrorTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    })
  );
  boundaryErrorWallMesh.visible = false;
  boundaryErrorWallMesh.frustumCulled = false;
  boundaryErrorWallMesh.renderOrder = 24;
  scene.add(boundaryErrorWallMesh);

  boundaryErrorOldWallMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: boundaryErrorTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    })
  );
  boundaryErrorOldWallMesh.visible = false;
  boundaryErrorOldWallMesh.frustumCulled = false;
  boundaryErrorOldWallMesh.renderOrder = 23;
  scene.add(boundaryErrorOldWallMesh);

  boundaryErrorBaseImage = boundaryErrorTexture.image;
  boundaryErrorGlitchCanvas = document.createElement('canvas');
  boundaryErrorGlitchCanvas.width = 768;
  boundaryErrorGlitchCanvas.height = 360;

  boundaryErrorFloorLightMat = new THREE.MeshBasicMaterial({
    color: cyan,
    map: makeBoundaryErrorFloorLightTexture(boundaryErrorFloorLightSoftness),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  boundaryErrorFloorLightMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), boundaryErrorFloorLightMat);
  boundaryErrorFloorLightMesh.rotation.x = -Math.PI / 2;
  boundaryErrorFloorLightMesh.visible = false;
  boundaryErrorFloorLightMesh.frustumCulled = false;
  boundaryErrorFloorLightMesh.renderOrder = 7;
  scene.add(boundaryErrorFloorLightMesh);

  updateRoadBoundaryHexRows();
  updateRoadBoundaryPulseLayout();

  window.tronNoclip = setTronNoclip;
  window.noclip = setTronNoclip;
}
