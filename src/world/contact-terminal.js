import * as THREE from 'three';
import { boardPerimeterPoseSignature, resolveBoardPerimeterPose } from './board-perimeter-pose.js';

export const CONTACT_TERMINAL_ENABLED = true;
export const CONTACT_TERMINAL_TARGET_CIVIC = 2;
export const CONTACT_TERMINAL_WIDTH = 31.5;
export const CONTACT_TERMINAL_HEIGHT = 15.75;
export const CONTACT_TERMINAL_TEXTURE_WIDTH = 1024;
export const CONTACT_TERMINAL_TEXTURE_HEIGHT = 512;

const CONTACT_TERMINAL_INNER_SLIDE = 0.68;
const CONTACT_TERMINAL_FOCUS_DISTANCE = 24;
const CONTACT_TERMINAL_FOCUS_MS = 680;
const CONTACT_TERMINAL_RETURN_MS = 540;
const CONTACT_TERMINAL_PANEL_OPACITY = 0.46 * 0.7;
const CONTACT_TERMINAL_TEXT_OPACITY = 0.96 * 1.25 * 0.7;
const CONTACT_TERMINAL_REVEAL_EPSILON = 0.0015;
const CONTACT_TERMINAL_POSE_CHECK_MS = 250;

export const CONTACT_TERMINAL_STATES = Object.freeze({
  HIDDEN: 'hidden',
  AVAILABLE: 'available',
  FOCUSING: 'focusing',
  ACTIVE: 'active',
  RETURNING: 'returning',
});

/**
 * Uno dei cinque stati qui sopra. Da `let state = CONTACT_TERMINAL_STATES.HIDDEN` tsc
 * deduceva il letterale 'hidden' e ogni confronto con gli altri quattro era un TS2367
 * "comparison appears to be unintentional" (13), piu' 5 TS2322 sulle assegnazioni.
 * Verificato prima di annotare: tutti e quattro gli altri stati vengono assegnati
 * davvero dal controller (beginFocus, completeFocus, beginReturn, completeReturn,
 * setAvailable), nessun ramo morto (2026-09-20).
 * @typedef {typeof CONTACT_TERMINAL_STATES[keyof typeof CONTACT_TERMINAL_STATES]} StatoTerminale
 */

export const CONTACT_TERMINAL_CONTACTS = Object.freeze([
  Object.freeze({
    label: 'EMAIL',
    value: 'info@avstudio.ai',
    uri: 'mailto:info@avstudio.ai',
    announcement: 'Email selezionata',
  }),
  Object.freeze({
    label: 'DIRECT LINE',
    value: '+39 351 7436 007',
    uri: 'tel:+393517436007',
    announcement: 'Telefono selezionato',
  }),
]);

export function contactTerminalAvailability({
  distance,
  alignment,
  revealComplete,
  enabled,
  cameraFree,
}) {
  return Boolean(
    revealComplete
    && enabled
    && cameraFree
    && Number.isFinite(distance)
    && distance <= 42
    && Number.isFinite(alignment)
    && alignment >= 0.45
  );
}

export function horizontalContactMetrics(cameraPosition, cameraForward, boardPosition) {
  const toBoardX = (boardPosition?.x ?? 0) - (cameraPosition?.x ?? 0);
  const toBoardZ = (boardPosition?.z ?? 0) - (cameraPosition?.z ?? 0);
  const distance = Math.hypot(toBoardX, toBoardZ);
  const forwardLength = Math.hypot(cameraForward?.x ?? 0, cameraForward?.z ?? 0);
  const alignment = distance > 1e-9 && forwardLength > 1e-9
    ? ((toBoardX / distance) * ((cameraForward?.x ?? 0) / forwardLength))
      + ((toBoardZ / distance) * ((cameraForward?.z ?? 0) / forwardLength))
    : 0;
  return { distance, alignment };
}

export function nextContactSelection(current, delta, count = CONTACT_TERMINAL_CONTACTS.length) {
  const size = Math.max(1, Math.trunc(count));
  return ((Math.trunc(current) + Math.trunc(delta)) % size + size) % size;
}

export function contactTerminalUri(index) {
  return CONTACT_TERMINAL_CONTACTS[index]?.uri ?? null;
}

/**
 * @param {{ code?: string, repeat?: boolean }} event
 * @param {{ state?: StatoTerminale }} [snapshot] la fotografia del controller
 */
export function contactTerminalKeyCommand(event, { state } = {}) {
  if (event?.repeat) return { handled: false, command: null };
  const code = event?.code;
  if (code === 'KeyE' && state === CONTACT_TERMINAL_STATES.AVAILABLE) {
    return { handled: true, command: 'enter' };
  }
  if (
    (code === 'KeyE' || code === 'Escape')
    && (
      state === CONTACT_TERMINAL_STATES.FOCUSING
      || state === CONTACT_TERMINAL_STATES.ACTIVE
      || state === CONTACT_TERMINAL_STATES.RETURNING
    )
  ) {
    return { handled: true, command: 'return' };
  }
  if (state !== CONTACT_TERMINAL_STATES.ACTIVE) return { handled: false, command: null };
  if (code === 'ArrowUp' || code === 'ArrowLeft') {
    return { handled: true, command: 'select', delta: -1 };
  }
  if (code === 'ArrowDown' || code === 'ArrowRight') {
    return { handled: true, command: 'select', delta: 1 };
  }
  if (code === 'Enter') return { handled: true, command: 'activate' };
  return { handled: false, command: null };
}

export function createContactTerminalStateController() {
  /** @type {StatoTerminale} */
  let state = CONTACT_TERMINAL_STATES.HIDDEN;
  let available = false;
  let selection = 0;
  let savedPose = false;
  let lastRequestedAction = null;
  let lastInputSource = null;

  return {
    setAvailable(next) {
      available = Boolean(next);
      if (state === CONTACT_TERMINAL_STATES.HIDDEN || state === CONTACT_TERMINAL_STATES.AVAILABLE) {
        state = available ? CONTACT_TERMINAL_STATES.AVAILABLE : CONTACT_TERMINAL_STATES.HIDDEN;
      }
      return state;
    },
    beginFocus() {
      if (state !== CONTACT_TERMINAL_STATES.AVAILABLE) return false;
      selection = 0;
      savedPose = true;
      state = CONTACT_TERMINAL_STATES.FOCUSING;
      return true;
    },
    completeFocus() {
      if (state !== CONTACT_TERMINAL_STATES.FOCUSING) return false;
      state = CONTACT_TERMINAL_STATES.ACTIVE;
      return true;
    },
    beginReturn() {
      if (state !== CONTACT_TERMINAL_STATES.FOCUSING && state !== CONTACT_TERMINAL_STATES.ACTIVE) return false;
      state = CONTACT_TERMINAL_STATES.RETURNING;
      return true;
    },
    completeReturn(nextAvailable = available) {
      if (state !== CONTACT_TERMINAL_STATES.RETURNING) return false;
      available = Boolean(nextAvailable);
      savedPose = false;
      state = available ? CONTACT_TERMINAL_STATES.AVAILABLE : CONTACT_TERMINAL_STATES.HIDDEN;
      return true;
    },
    select(delta) {
      selection = nextContactSelection(selection, delta);
      return selection;
    },
    setSelection(index) {
      selection = nextContactSelection(index, 0);
      return selection;
    },
    recordAction(uri, source) {
      lastRequestedAction = uri;
      lastInputSource = source;
    },
    // Cheap accessors for the per-frame paths: update(), syncDomState() and
    // isCameraOwned() only ever need one field, and snapshot() allocates a
    // six-field object every time it is asked for it.
    getState() {
      return state;
    },
    getAvailable() {
      return available;
    },
    getSelection() {
      return selection;
    },
    snapshot() {
      return {
        state,
        available,
        selection,
        savedPose,
        lastRequestedAction,
        lastInputSource,
      };
    },
  };
}

function easeOutQuart(value) {
  return 1 - Math.pow(1 - THREE.MathUtils.clamp(value, 0, 1), 4);
}

function setElementHidden(element, hidden) {
  if (element && element.hidden !== hidden) element.hidden = hidden;
}

/** @param {DipendenzeTerminale} deps */
function addContactTerminalFrame(group, width, height, deps, z = 0.16) {
  const halfWidth = width * 0.5;
  const halfHeight = height * 0.5;
  const thickness = 0.18;
  const color = deps.PAL?.tealLight ?? 0x8ffcff;
  deps.addElStripRectFrame(group, halfWidth, halfHeight, z, color, thickness, { depthWrite: false });
}

function drawContactTerminalTexture(board, selection, state) {
  const { canvas, ctx } = board;
  const width = canvas.width;
  const height = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(0, 12, 15, 0.96)';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.shadowColor = 'rgba(98, 247, 255, 0.72)';
  ctx.shadowBlur = 14;
  ctx.strokeStyle = 'rgba(143, 252, 255, 0.94)';
  ctx.lineWidth = 4;
  ctx.strokeRect(28, 28, width - 56, height - 56);
  ctx.restore();
  ctx.strokeStyle = 'rgba(98, 247, 255, 0.32)';
  ctx.lineWidth = 2;
  ctx.strokeRect(45, 52, width - 90, height - 82);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '900 29px Menlo, Consolas, monospace';
  ctx.shadowColor = 'rgba(98, 247, 255, 0.62)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(224, 254, 255, 0.98)';
  ctx.fillText('AVSTUDIO CONTACT TERMINAL', 62, 67);
  ctx.shadowBlur = 0;
  ctx.font = '700 16px Menlo, Consolas, monospace';
  ctx.fillStyle = 'rgba(98, 247, 255, 0.72)';
  ctx.fillText('SECURE DIRECT CHANNELS', 62, 101);
  ctx.textAlign = 'right';
  ctx.fillText('NODE 02 / ONLINE', width - 62, 101);

  const rowTop = 134;
  const rowHeight = 126;
  const rowGap = 16;
  CONTACT_TERMINAL_CONTACTS.forEach((contact, index) => {
    const top = rowTop + index * (rowHeight + rowGap);
    const selected = index === selection;
    ctx.fillStyle = selected ? 'rgba(245, 184, 75, 0.13)' : 'rgba(0, 74, 88, 0.18)';
    ctx.fillRect(62, top, width - 124, rowHeight);
    ctx.strokeStyle = selected ? 'rgba(245, 184, 75, 0.96)' : 'rgba(98, 247, 255, 0.25)';
    ctx.lineWidth = selected ? 4 : 2;
    ctx.strokeRect(62, top, width - 124, rowHeight);

    ctx.textAlign = 'left';
    ctx.font = '900 23px Menlo, Consolas, monospace';
    ctx.fillStyle = selected ? 'rgba(255, 222, 154, 1)' : 'rgba(143, 252, 255, 0.88)';
    ctx.fillText(`${String(index + 1).padStart(2, '0')}${selected ? ' >' : ''}`, 84, top + 35);
    ctx.font = '800 18px Menlo, Consolas, monospace';
    ctx.fillText(contact.label, 178, top + 35);
    ctx.font = '900 27px Menlo, Consolas, monospace';
    ctx.fillStyle = 'rgba(238, 255, 255, 0.98)';
    ctx.fillText(contact.value, 84, top + 86);
  });

  ctx.font = '700 15px Menlo, Consolas, monospace';
  ctx.fillStyle = 'rgba(98, 247, 255, 0.62)';
  ctx.textAlign = 'left';
  const activeLabel = state === CONTACT_TERMINAL_STATES.ACTIVE ? 'SELECT CHANNEL / ENTER TO CONNECT' : 'DIRECT ROUTING READY';
  ctx.fillText(activeLabel, 62, height - 46);

  board.texture.needsUpdate = true;
  board.textureUpdates += 1;
}

/**
 * Un nodo della scena visto da traverse(), che passa anche gruppi e luci: i campi di
 * Mesh ci sono forse, e il codice li controlla prima di usarli. Senza questo tipo tsc
 * vedeva solo Object3D e ogni `.material` era un TS2339 (2026-09-20).
 * @typedef {THREE.Object3D & Partial<THREE.Mesh>} NodoForseMesh
 */
/** @param {DipendenzeTerminale} deps */
function createContactBoard(deps, record) {
  const canvas = deps.createCanvas();
  canvas.width = CONTACT_TERMINAL_TEXTURE_WIDTH;
  canvas.height = CONTACT_TERMINAL_TEXTURE_HEIGHT;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = deps.renderer.capabilities.getMaxAnisotropy?.() || 1;

  const textMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity: CONTACT_TERMINAL_TEXT_OPACITY,
    alphaTest: 0.012,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x001216,
    metalness: 0.45,
    roughness: 0.18,
    envMap: deps.reflectionEnvMap ?? null,
    envMapIntensity: 0.72,
    emissive: 0x00333b,
    emissiveIntensity: 0.25,
    transparent: true,
    opacity: CONTACT_TERMINAL_PANEL_OPACITY,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
  });
  const group = new THREE.Group();
  group.name = 'contact-terminal-2';
  group.renderOrder = 30;
  const panelMesh = new THREE.Mesh(new THREE.PlaneGeometry(CONTACT_TERMINAL_WIDTH, CONTACT_TERMINAL_HEIGHT), panelMaterial);
  panelMesh.name = 'contact-terminal-panel-2';
  panelMesh.renderOrder = 28;
  panelMesh.frustumCulled = false;
  group.add(panelMesh);
  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(CONTACT_TERMINAL_WIDTH * 0.96, CONTACT_TERMINAL_HEIGHT * 0.96),
    textMaterial,
  );
  textMesh.name = 'contact-terminal-text-2';
  textMesh.position.z = 0.12;
  textMesh.renderOrder = 32;
  textMesh.frustumCulled = false;
  group.add(textMesh);
  addContactTerminalFrame(group, CONTACT_TERMINAL_WIDTH, CONTACT_TERMINAL_HEIGHT, deps);

  const hitMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
    side: THREE.DoubleSide,
  });
  hitMaterial.visible = false;
  const rowY = [1.35, -3.03];
  const hitMeshes = CONTACT_TERMINAL_CONTACTS.map((contact, index) => {
    const hit = new THREE.Mesh(
      new THREE.PlaneGeometry(CONTACT_TERMINAL_WIDTH * 0.86, CONTACT_TERMINAL_HEIGHT * 0.245),
      hitMaterial,
    );
    hit.name = `contact-terminal-hit-${index}`;
    hit.position.set(0, rowY[index], 0.22);
    hit.userData.contactTerminalIndex = index;
    hit.renderOrder = 34;
    group.add(hit);
    return hit;
  });

  const revealMaterials = [];
  group.traverse((/** @type {NodoForseMesh} */ object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (!material || material === hitMaterial || !Number.isFinite(material.opacity)) return;
      material.transparent = true;
      material.depthTest = true;
      material.depthWrite = false;
      material.userData.contactTerminalBaseOpacity = material.opacity;
      revealMaterials.push(material);
    });
  });
  group.visible = false;
  deps.scene.add(group);

  return {
    record,
    group,
    panelMesh,
    textMesh,
    hitMeshes,
    revealMaterials,
    canvas,
    ctx,
    texture,
    textureUpdates: 0,
    position: new THREE.Vector3(),
    yaw: 0,
    perimeterSide: 'record-center',
    perimeterSynced: false,
  };
}

// Built once instead of per frame: prefersReducedMotion() is read every frame
// while the camera transition runs, and matchMedia() allocates a fresh
// MediaQueryList on each call. The list is live, so .matches stays current.
const defaultReducedMotionQuery = globalThis.matchMedia
  ? globalThis.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

function defaultActivateUri(uri) {
  if (typeof window !== 'undefined') window.location.href = uri;
}

/**
 * Un elemento del DOM come lo vede il terminale: nascondere, mettere a fuoco, misurare,
 * ascoltare. Le prove passano stub costruiti su EventTarget, percio' il tipo elenca solo
 * quello che il runtime tocca davvero, non HTMLElement intero.
 * @typedef {EventTarget & {
 *   hidden?: boolean,
 *   textContent?: string,
 *   focus?: (opzioni?: { preventScroll?: boolean }) => void,
 *   getBoundingClientRect?: () => { left: number, top: number, width: number, height: number },
 * }} ElementoTerminale
 */

/**
 * Tutto quello che il runtime del terminale legge da `deps`. I default dentro
 * createContactTerminalRuntime ne coprono una parte; il resto (scena, camera, renderer,
 * bottoni, palazzi) arriva da city-wiring o, nelle prove, da stub. Senza questo tipo tsc
 * deduceva `deps` dai soli default e dava per inesistenti i campi iniettati: 23 errori,
 * piu' 4 chiamate con argomenti su segnaposto `() => {}` (2026-09-20). Niente `any`:
 * dove le prove passano uno stub, il tipo dice il minimo che il runtime usa.
 * @typedef {object} DipendenzeTerminale
 * @property {() => HTMLCanvasElement} createCanvas
 * @property {() => number} getBottomY
 * @property {() => ({ z?: number } | null)} getPlayerSpawn
 * @property {() => boolean} getRevealComplete
 * @property {() => number} getRevealFactor
 * @property {() => boolean} getEffectEnabled
 * @property {() => boolean} getOtherCameraActive
 * @property {() => number} getYaw
 * @property {(valore: number) => void} setYaw
 * @property {() => number} getPitch
 * @property {(valore: number) => void} setPitch
 * @property {() => number} getViewRoll
 * @property {(valore: number) => void} setViewRoll
 * @property {() => void} applyCameraLook
 * @property {() => void} clearMovement
 * @property {() => void} clearViewMotion
 * @property {() => void} stopMouseLook
 * @property {(opzioni?: { requestPointerLock?: boolean }) => void} resumeMouseLook mouse-look.resumeMouseLookInput; il ritorno non si usa
 * @property {() => void} resetMobileMovement
 * @property {() => boolean} getPointerLocked
 * @property {() => boolean} prefersReducedMotion
 * @property {() => boolean} isMobile
 * @property {(uri: string) => void} activateUri
 * @property {EventTarget | undefined} eventTarget
 * @property {{ pushState?: (dati: unknown, titolo: string, url?: string) => void, back?: () => void } | undefined} history
 * @property {string | undefined} locationHref
 * @property {{ classList?: { toggle: (nome: string, forza?: boolean) => boolean } } | undefined} body
 * @property {() => number} now
 * @property {THREE.Scene} [scene]
 * @property {THREE.Camera} [camera]
 * @property {{ capabilities: { getMaxAnisotropy?: () => number }, domElement: ElementoTerminale }} [renderer]
 * @property {THREE.Texture | null} [reflectionEnvMap]
 * @property {{ tealLight?: number }} [PAL]
 * @property {(gruppo: THREE.Object3D, mezzaLarghezza: number, mezzaAltezza: number, z: number, colore: number, spessore: number, opzioni?: object) => void} [addElStripRectFrame] building-leds.addElStripRectFrame; il ritorno non si usa
 * @property {Array<{ civicNumberValue: number, mesh?: { position?: { z?: number } } }>} [sideBuildingRecords]
 * @property {ElementoTerminale} [actionButton]
 * @property {ElementoTerminale} [backButton]
 * @property {ElementoTerminale} [interactionSurface]
 * @property {ElementoTerminale} [liveRegion]
 */

/** @param {Partial<DipendenzeTerminale>} [injected] */
export function createContactTerminalRuntime(injected = {}) {
  /** @type {DipendenzeTerminale} */
  const deps = {
    createCanvas: () => document.createElement('canvas'),
    getBottomY: () => 0,
    getPlayerSpawn: () => null,
    getRevealComplete: () => false,
    getRevealFactor: () => 0,
    getEffectEnabled: () => CONTACT_TERMINAL_ENABLED,
    getOtherCameraActive: () => false,
    getYaw: () => 0,
    setYaw: () => {},
    getPitch: () => 0,
    setPitch: () => {},
    getViewRoll: () => 0,
    setViewRoll: () => {},
    applyCameraLook: () => {},
    clearMovement: () => {},
    clearViewMotion: () => {},
    stopMouseLook: () => {},
    resumeMouseLook: () => {},
    resetMobileMovement: () => {},
    getPointerLocked: () => false,
    prefersReducedMotion: () => defaultReducedMotionQuery?.matches === true,
    isMobile: () => false,
    activateUri: defaultActivateUri,
    eventTarget: globalThis.window,
    history: globalThis.history,
    locationHref: globalThis.location?.href,
    body: globalThis.document?.body,
    now: () => performance.now(),
    ...injected,
  };
  const controller = createContactTerminalStateController();
  const record = deps.sideBuildingRecords?.find((item) => item.civicNumberValue === CONTACT_TERMINAL_TARGET_CIVIC) ?? null;
  const board = record ? createContactBoard(deps, record) : null;
  const scratchForward = new THREE.Vector3();
  const scratchNormal = new THREE.Vector3();
  const scratchFocusPosition = new THREE.Vector3();
  const scratchFocusQuaternion = new THREE.Quaternion();
  const scratchLookMatrix = new THREE.Matrix4();
  const transitionFromPosition = new THREE.Vector3();
  const transitionToPosition = new THREE.Vector3();
  const transitionFromQuaternion = new THREE.Quaternion();
  const transitionToQuaternion = new THREE.Quaternion();
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  let savedCameraPose = null;
  let transitionStartedAt = 0;
  let transitionDurationMs = 0;
  let transitionProgress = 0;
  let lastDistance = Number.POSITIVE_INFINITY;
  let lastAlignment = -1;
  let lastRevealFactor = -1;
  let lastVisible = false;
  let lastPoseCheckAt = -Infinity;
  let lastPoseSignature = '';
  let historyEntryActive = false;

  function currentPlayerZ() {
    return deps.getPlayerSpawn()?.z ?? deps.camera?.position?.z ?? record?.mesh?.position?.z ?? 0;
  }

  function syncBoardPose() {
    if (!board) return;
    const options = {
      bottomY: deps.getBottomY(),
      boardHeight: CONTACT_TERMINAL_HEIGHT,
      playerZ: currentPlayerZ(),
      innerSlide: CONTACT_TERMINAL_INNER_SLIDE,
    };
    const pose = resolveBoardPerimeterPose(record, options);
    board.position.set(pose.x, pose.y, pose.z);
    board.yaw = pose.yaw;
    board.perimeterSide = pose.perimeterSide;
    board.perimeterSynced = pose.perimeterSynced;
    board.group.position.copy(board.position);
    board.group.rotation.y = board.yaw;
    board.group.updateWorldMatrix(true, true);
    lastPoseSignature = boardPerimeterPoseSignature(record, options);
  }

  function syncReveal() {
    if (!board) return;
    const factor = THREE.MathUtils.clamp(Number(deps.getRevealFactor()) || 0, 0, 1);
    const visible = Boolean(deps.getEffectEnabled() && factor > 0.002);
    if (Math.abs(factor - lastRevealFactor) < CONTACT_TERMINAL_REVEAL_EPSILON && visible === lastVisible) return;
    lastRevealFactor = factor;
    lastVisible = visible;
    board.group.visible = visible;
    board.revealMaterials.forEach((material) => {
      const baseOpacity = material.userData.contactTerminalBaseOpacity ?? material.opacity;
      material.opacity = baseOpacity * factor;
    });
  }

  function announce(message) {
    if (deps.liveRegion) deps.liveRegion.textContent = message;
  }

  function isCameraOwned() {
    const state = controller.getState();
    return state === CONTACT_TERMINAL_STATES.FOCUSING
      || state === CONTACT_TERMINAL_STATES.ACTIVE
      || state === CONTACT_TERMINAL_STATES.RETURNING;
  }

  function syncDomState() {
    const state = controller.getState();
    const cameraOwned = isCameraOwned();
    setElementHidden(deps.actionButton, state !== CONTACT_TERMINAL_STATES.AVAILABLE);
    setElementHidden(deps.backButton, !cameraOwned);
    deps.body?.classList?.toggle('contact-terminal-focus', cameraOwned);
    deps.body?.classList?.toggle('contact-terminal-available', state === CONTACT_TERMINAL_STATES.AVAILABLE);
  }

  function drawTexture() {
    if (!board) return;
    drawContactTerminalTexture(board, controller.getSelection(), controller.getState());
  }

  function refreshAvailability() {
    if (!board || isCameraOwned()) return controller.getAvailable();
    deps.camera.getWorldDirection(scratchForward);
    const metrics = horizontalContactMetrics(deps.camera.position, scratchForward, board.position);
    lastDistance = metrics.distance;
    lastAlignment = metrics.alignment;
    const available = contactTerminalAvailability({
      distance: lastDistance,
      alignment: lastAlignment,
      revealComplete: deps.getRevealComplete(),
      enabled: deps.getEffectEnabled() && board.group.visible,
      cameraFree: !deps.getOtherCameraActive(),
    });
    controller.setAvailable(available);
    syncDomState();
    return available;
  }

  function focusPose() {
    scratchNormal.set(0, 0, 1).applyAxisAngle(THREE.Object3D.DEFAULT_UP, board.yaw).normalize();
    scratchFocusPosition.copy(board.position).addScaledVector(scratchNormal, CONTACT_TERMINAL_FOCUS_DISTANCE);
    scratchLookMatrix.lookAt(scratchFocusPosition, board.position, THREE.Object3D.DEFAULT_UP);
    scratchFocusQuaternion.setFromRotationMatrix(scratchLookMatrix);
    return { position: scratchFocusPosition, quaternion: scratchFocusQuaternion };
  }

  function setTransitionTarget(position, quaternion, durationMs) {
    transitionFromPosition.copy(deps.camera.position);
    transitionFromQuaternion.copy(deps.camera.quaternion);
    transitionToPosition.copy(position);
    transitionToQuaternion.copy(quaternion);
    transitionStartedAt = deps.now();
    transitionDurationMs = durationMs;
    transitionProgress = 0;
  }

  function applyTransition(progress) {
    const eased = easeOutQuart(progress);
    deps.camera.position.lerpVectors(transitionFromPosition, transitionToPosition, eased);
    deps.camera.quaternion.slerpQuaternions(transitionFromQuaternion, transitionToQuaternion, eased);
    transitionProgress = progress;
  }

  function pushMobileHistory() {
    if (!deps.isMobile() || historyEntryActive || !deps.history?.pushState) return;
    try {
      deps.history.pushState({ contactTerminal: true }, '', deps.locationHref);
      historyEntryActive = true;
    } catch (_) {}
  }

  function consumeMobileHistory() {
    if (!historyEntryActive) return;
    historyEntryActive = false;
    try { deps.history?.back?.(); } catch (_) {}
  }

  function finishFocus() {
    applyTransition(1);
    controller.completeFocus();
    transitionProgress = 1;
    drawTexture();
    syncDomState();
    deps.interactionSurface?.focus?.({ preventScroll: true });
    announce(CONTACT_TERMINAL_CONTACTS[0].announcement);
  }

  function beginFocus() {
    if (!board || !controller.beginFocus()) return false;
    deps.clearMovement();
    deps.clearViewMotion();
    savedCameraPose = {
      position: deps.camera.position.clone(),
      quaternion: deps.camera.quaternion.clone(),
      yaw: deps.getYaw(),
      pitch: deps.getPitch(),
      roll: deps.getViewRoll(),
      pointerLocked: Boolean(deps.getPointerLocked()),
    };
    deps.resetMobileMovement();
    deps.stopMouseLook();
    const target = focusPose();
    setTransitionTarget(target.position, target.quaternion, CONTACT_TERMINAL_FOCUS_MS);
    pushMobileHistory();
    drawTexture();
    syncDomState();
    announce('Contatti avstudio aperti');
    if (deps.prefersReducedMotion()) finishFocus();
    return true;
  }

  function finishReturn() {
    const resumeMouseLook = !deps.isMobile();
    const requestPointerLock = Boolean(savedCameraPose?.pointerLocked);
    applyTransition(1);
    deps.setYaw(savedCameraPose?.yaw ?? deps.getYaw());
    deps.setPitch(savedCameraPose?.pitch ?? deps.getPitch());
    deps.setViewRoll(savedCameraPose?.roll ?? deps.getViewRoll());
    deps.applyCameraLook();
    controller.completeReturn(false);
    savedCameraPose = null;
    transitionProgress = 1;
    refreshAvailability();
    drawTexture();
    syncDomState();
    deps.renderer.domElement?.focus?.({ preventScroll: true });
    if (resumeMouseLook) deps.resumeMouseLook({ requestPointerLock });
    announce('Ritorno alla demo');
  }

  function beginReturn(source = 'control', { consumeHistory = true } = {}) {
    if (!savedCameraPose || !controller.beginReturn()) return false;
    setTransitionTarget(savedCameraPose.position, savedCameraPose.quaternion, CONTACT_TERMINAL_RETURN_MS);
    drawTexture();
    syncDomState();
    if (consumeHistory) consumeMobileHistory();
    if (deps.prefersReducedMotion()) finishReturn();
    return true;
  }

  function setSelection(index, source) {
    const previous = controller.snapshot().selection;
    controller.setSelection(index);
    const next = controller.snapshot().selection;
    if (next === previous) return next;
    drawTexture();
    announce(CONTACT_TERMINAL_CONTACTS[next].announcement);
    if (source) controller.recordAction(controller.snapshot().lastRequestedAction, source);
    return next;
  }

  function moveSelection(delta) {
    const next = controller.select(delta);
    drawTexture();
    announce(CONTACT_TERMINAL_CONTACTS[next].announcement);
    return next;
  }

  function activateSelection(source) {
    const selection = controller.snapshot().selection;
    const uri = contactTerminalUri(selection);
    if (!uri) return false;
    controller.recordAction(uri, source);
    try { deps.activateUri(uri); } catch (_) {}
    return true;
  }

  function handleKeyDown(event) {
    const result = contactTerminalKeyCommand(event, controller.snapshot());
    if (!result.handled) return false;
    event.preventDefault?.();
    if (result.command === 'enter') beginFocus();
    else if (result.command === 'return') beginReturn('keyboard');
    else if (result.command === 'select') moveSelection(result.delta);
    else if (result.command === 'activate') activateSelection('keyboard');
    return true;
  }

  // The canvas fills the viewport and only changes with it, so its rect is read
  // once and kept until a resize instead of on every pointer event.
  let cachedCanvasRect = null;
  function canvasRect() {
    if (!cachedCanvasRect || !cachedCanvasRect.width || !cachedCanvasRect.height) {
      cachedCanvasRect = deps.renderer.domElement.getBoundingClientRect();
    }
    return cachedCanvasRect;
  }
  function invalidateCanvasRect() {
    cachedCanvasRect = null;
  }

  function hitIndexForPointer(event) {
    if (!board || controller.getState() !== CONTACT_TERMINAL_STATES.ACTIVE) return null;
    const rect = canvasRect();
    if (!rect.width || !rect.height) return null;
    pointerNdc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    board.group.updateWorldMatrix(true, true);
    deps.camera.updateMatrixWorld(true);
    raycaster.setFromCamera(pointerNdc, deps.camera);
    const hit = raycaster.intersectObjects(board.hitMeshes, false)[0];
    return Number.isInteger(hit?.object?.userData?.contactTerminalIndex)
      ? hit.object.userData.contactTerminalIndex
      : null;
  }

  function handlePointerMove(event) {
    const index = hitIndexForPointer(event);
    if (index === null) return false;
    setSelection(index);
    return true;
  }

  // A hit-test costs a layout read, a recursive world-matrix update on the board,
  // a camera matrix update and a raycast. pointermove is not guaranteed to be
  // coalesced to one event per frame (high polling-rate mice deliver several), so
  // the listener only records the last position and update() runs a single
  // hit-test per frame with it.
  let pendingPointerMove = false;
  const pendingPointerMoveEvent = { clientX: 0, clientY: 0 };

  function queuePointerMove(event) {
    pendingPointerMoveEvent.clientX = event.clientX;
    pendingPointerMoveEvent.clientY = event.clientY;
    pendingPointerMove = true;
  }

  function flushPendingPointerMove() {
    if (!pendingPointerMove) return;
    pendingPointerMove = false;
    handlePointerMove(pendingPointerMoveEvent);
  }

  function handlePointerClick(event) {
    const index = hitIndexForPointer(event);
    if (index === null) return false;
    event.preventDefault?.();
    setSelection(index);
    return activateSelection(event.pointerType === 'touch' || deps.isMobile() ? 'touch' : 'pointer');
  }

  function update(now = deps.now()) {
    if (!board) {
      controller.setAvailable(false);
      syncDomState();
      return;
    }
    flushPendingPointerMove();
    syncReveal();
    if (!isCameraOwned() && now - lastPoseCheckAt >= CONTACT_TERMINAL_POSE_CHECK_MS) {
      lastPoseCheckAt = now;
      const signature = boardPerimeterPoseSignature(record, {
        bottomY: deps.getBottomY(),
        boardHeight: CONTACT_TERMINAL_HEIGHT,
        playerZ: currentPlayerZ(),
        innerSlide: CONTACT_TERMINAL_INNER_SLIDE,
      });
      if (signature !== lastPoseSignature) syncBoardPose();
    }
    const state = controller.getState();
    if (state === CONTACT_TERMINAL_STATES.FOCUSING || state === CONTACT_TERMINAL_STATES.RETURNING) {
      if (deps.prefersReducedMotion()) return;
      const progress = THREE.MathUtils.clamp((now - transitionStartedAt) / Math.max(1, transitionDurationMs), 0, 1);
      applyTransition(progress);
      if (progress >= 1) {
        if (state === CONTACT_TERMINAL_STATES.FOCUSING) finishFocus();
        else finishReturn();
      }
      return;
    }
    refreshAvailability();
  }

  function inspect() {
    const snapshot = controller.snapshot();
    return {
      enabled: CONTACT_TERMINAL_ENABLED,
      visible: Boolean(board?.group.visible),
      civicNumberValue: record?.civicNumberValue ?? null,
      perimeterSide: board?.perimeterSide ?? null,
      perimeterSynced: Boolean(board?.perimeterSynced),
      worldPosition: board ? { x: board.position.x, y: board.position.y, z: board.position.z } : null,
      yaw: board?.yaw ?? null,
      state: snapshot.state,
      distance: Number.isFinite(lastDistance) ? lastDistance : null,
      alignment: Number.isFinite(lastAlignment) ? lastAlignment : null,
      availability: snapshot.available,
      selection: snapshot.selection,
      selectedContact: CONTACT_TERMINAL_CONTACTS[snapshot.selection]?.label ?? null,
      savedPose: snapshot.savedPose,
      savedPointerLock: savedCameraPose?.pointerLocked ?? null,
      lastRequestedAction: snapshot.lastRequestedAction,
      lastInputSource: snapshot.lastInputSource,
      transitionProgress,
      historyEntryActive,
      textureWidth: board?.canvas.width ?? CONTACT_TERMINAL_TEXTURE_WIDTH,
      textureHeight: board?.canvas.height ?? CONTACT_TERMINAL_TEXTURE_HEIGHT,
      textureUpdates: board?.textureUpdates ?? 0,
      hitTargetCount: board?.hitMeshes.length ?? 0,
    };
  }

  if (board) {
    syncBoardPose();
    drawTexture();
  }
  syncDomState();
  deps.actionButton?.addEventListener?.('click', beginFocus);
  deps.backButton?.addEventListener?.('click', () => beginReturn('back-button'));
  deps.renderer?.domElement?.addEventListener?.('pointermove', queuePointerMove);
  deps.eventTarget?.addEventListener?.('resize', invalidateCanvasRect);
  deps.renderer?.domElement?.addEventListener?.('click', handlePointerClick);
  deps.eventTarget?.addEventListener?.('popstate', () => {
    if (!historyEntryActive || !isCameraOwned()) return;
    historyEntryActive = false;
    beginReturn('history', { consumeHistory: false });
  });

  return {
    update,
    inspect,
    beginFocus,
    beginReturn,
    handleKeyDown,
    handlePointerMove,
    handlePointerClick,
    activateSelection,
    ownsCamera: isCameraOwned,
    getBoard: () => board,
  };
}

let contactTerminalRuntime = null;

/** @param {Partial<DipendenzeTerminale>} deps */
export function initContactTerminal(deps) {
  contactTerminalRuntime = createContactTerminalRuntime(deps);
  if (typeof window !== 'undefined') window.__contactTerminalInspect = () => contactTerminalRuntime.inspect();
  return contactTerminalRuntime;
}

export function updateContactTerminal(now) {
  contactTerminalRuntime?.update(now);
}

export function contactTerminalOwnsCamera() {
  return contactTerminalRuntime?.ownsCamera() ?? false;
}

export function handleContactTerminalKeyDown(event) {
  return contactTerminalRuntime?.handleKeyDown(event) ?? false;
}

export function contactTerminalInspect() {
  return contactTerminalRuntime?.inspect() ?? {
    enabled: CONTACT_TERMINAL_ENABLED,
    visible: false,
    civicNumberValue: null,
    state: CONTACT_TERMINAL_STATES.HIDDEN,
  };
}
