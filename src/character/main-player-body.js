import * as THREE from 'three';
import {
  TRON_MAIN_PLAYER_BODY_BLACK_COLOR,
  TRON_MAIN_PLAYER_BODY_CAMERA_OFFSET,
  TRON_MAIN_PLAYER_BODY_ENABLED,
  TRON_MAIN_PLAYER_BODY_LED_COLOR,
  TRON_MAIN_PLAYER_BODY_REVEAL_WITH_CHARACTERS,
  TRON_MAIN_PLAYER_BODY_SCALE,
} from './characters.js';
import {
  makeTronMainPlayerBodyLedMaterial,
  makeTronMainPlayerBodySuitMaterial,
} from './character-materials.js';
import {
  createTronMainPlayerBodyState,
} from './runner-state.js';

export function createTronMainPlayerBodyRuntime({
  baseMaterial,
  camera,
  getCharacterRevealDone,
  getCityRevealComplete,
  getMovementHorizontalSpeed,
  getSpeedBase,
  getWalkStepRate,
  getRunStepRate,
  getMovementRunMix,
  getMovementStrafeDirection,
  getMovementStrafeMix,
  getBeatMultiplier,
}) {
  const group = new THREE.Group();
  group.name = 'tron-main-player-body';
  group.visible = false;

  const state = createTronMainPlayerBodyState();
  const parts = [];
  const ledMaterials = [];
  const offsetWorld = new THREE.Vector3();
  let suitMaterial = null;
  let ledMaterial = null;

  function createSuitMaterial() {
    return makeTronMainPlayerBodySuitMaterial({
      baseMaterial,
      blackColor: TRON_MAIN_PLAYER_BODY_BLACK_COLOR,
    });
  }

  function makeLimbGeometry(radius, length) {
    if (THREE.CapsuleGeometry) {
      return new THREE.CapsuleGeometry(radius, length, 4, 10);
    }
    return new THREE.CylinderGeometry(radius, radius, length + radius * 2, 10, 1);
  }

  function registerObject(object) {
    object.renderOrder = 8;
    object.frustumCulled = false;
    if (object.children?.length) object.children.forEach(registerObject);
  }

  function addLedStrip(parent, length, width, zOffset, xOffset = 0) {
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(width, length, 0.014),
      ledMaterial
    );
    led.name = `${parent.name}-led`;
    led.position.set(xOffset, 0, zOffset);
    registerObject(led);
    parent.add(led);
    ledMaterials.push(ledMaterial);
    return led;
  }

  function addLimb({
    name,
    type,
    side = 0,
    x = 0,
    y = 0,
    z = 0,
    radius = 0.045,
    length = 0.36,
    rotationX = 0,
    rotationY = 0,
    rotationZ = 0,
    ledWidth = 0.018,
    ledLengthScale = 0.76,
  }) {
    const limb = new THREE.Group();
    limb.name = name;
    limb.position.set(x, y, z);
    limb.rotation.set(rotationX, rotationY, rotationZ);
    limb.userData.restPosition = limb.position.clone();
    limb.userData.restRotation = limb.rotation.clone();
    limb.userData.type = type;
    limb.userData.side = side;

    const mesh = new THREE.Mesh(makeLimbGeometry(radius, length), suitMaterial);
    mesh.name = `${name}-suit`;
    registerObject(mesh);
    limb.add(mesh);
    addLedStrip(limb, length * ledLengthScale, ledWidth, radius + 0.011);
    registerObject(limb);
    group.add(limb);
    parts.push(limb);
    return limb;
  }

  function addFoot({ name, side, x, y, z }) {
    const foot = new THREE.Group();
    foot.name = name;
    foot.position.set(x, y, z);
    foot.rotation.set(THREE.MathUtils.degToRad(82), 0, side * THREE.MathUtils.degToRad(3));
    foot.userData.restPosition = foot.position.clone();
    foot.userData.restRotation = foot.rotation.clone();
    foot.userData.type = 'foot';
    foot.userData.side = side;

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.34), suitMaterial);
    mesh.name = `${name}-suit`;
    registerObject(mesh);
    foot.add(mesh);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.011, 0.24), ledMaterial);
    led.name = `${name}-led`;
    led.position.set(0, 0.045, -0.02);
    registerObject(led);
    foot.add(led);
    ledMaterials.push(ledMaterial);
    registerObject(foot);
    group.add(foot);
    parts.push(foot);
    return foot;
  }

  function build() {
    if (state.ready || !TRON_MAIN_PLAYER_BODY_ENABLED) return;
    group.clear();
    parts.length = 0;
    ledMaterials.length = 0;
    suitMaterial = createSuitMaterial();
    ledMaterial = makeTronMainPlayerBodyLedMaterial(TRON_MAIN_PLAYER_BODY_LED_COLOR);

    addLimb({
      name: 'main-player-left-upper-arm',
      type: 'arm',
      side: -1,
      x: -0.34,
      y: -0.33,
      z: -0.78,
      radius: 0.044,
      length: 0.34,
      rotationX: THREE.MathUtils.degToRad(-18),
      rotationZ: THREE.MathUtils.degToRad(-12),
    });
    addLimb({
      name: 'main-player-right-upper-arm',
      type: 'arm',
      side: 1,
      x: 0.34,
      y: -0.33,
      z: -0.78,
      radius: 0.044,
      length: 0.34,
      rotationX: THREE.MathUtils.degToRad(-18),
      rotationZ: THREE.MathUtils.degToRad(12),
    });
    addLimb({
      name: 'main-player-left-forearm',
      type: 'forearm',
      side: -1,
      x: -0.31,
      y: -0.58,
      z: -0.88,
      radius: 0.039,
      length: 0.36,
      rotationX: THREE.MathUtils.degToRad(-38),
      rotationZ: THREE.MathUtils.degToRad(-8),
    });
    addLimb({
      name: 'main-player-right-forearm',
      type: 'forearm',
      side: 1,
      x: 0.31,
      y: -0.58,
      z: -0.88,
      radius: 0.039,
      length: 0.36,
      rotationX: THREE.MathUtils.degToRad(-38),
      rotationZ: THREE.MathUtils.degToRad(8),
    });
    addLimb({
      name: 'main-player-left-thigh',
      type: 'leg',
      side: -1,
      x: -0.16,
      y: -0.67,
      z: -1.08,
      radius: 0.052,
      length: 0.38,
      rotationX: THREE.MathUtils.degToRad(10),
      rotationZ: THREE.MathUtils.degToRad(-3),
    });
    addLimb({
      name: 'main-player-right-thigh',
      type: 'leg',
      side: 1,
      x: 0.16,
      y: -0.67,
      z: -1.08,
      radius: 0.052,
      length: 0.38,
      rotationX: THREE.MathUtils.degToRad(10),
      rotationZ: THREE.MathUtils.degToRad(3),
    });
    addLimb({
      name: 'main-player-left-shin',
      type: 'shin',
      side: -1,
      x: -0.16,
      y: -0.93,
      z: -1.0,
      radius: 0.046,
      length: 0.34,
      rotationX: THREE.MathUtils.degToRad(-2),
      rotationZ: THREE.MathUtils.degToRad(-2),
    });
    addLimb({
      name: 'main-player-right-shin',
      type: 'shin',
      side: 1,
      x: 0.16,
      y: -0.93,
      z: -1.0,
      radius: 0.046,
      length: 0.34,
      rotationX: THREE.MathUtils.degToRad(-2),
      rotationZ: THREE.MathUtils.degToRad(2),
    });
    addFoot({
      name: 'main-player-left-foot',
      side: -1,
      x: -0.16,
      y: -1.11,
      z: -1.1,
    });
    addFoot({
      name: 'main-player-right-foot',
      side: 1,
      x: 0.16,
      y: -1.11,
      z: -1.1,
    });

    group.scale.setScalar(TRON_MAIN_PLAYER_BODY_SCALE);
    state.ready = true;
    state.limbCount = parts.length;
    state.ledCount = ledMaterials.length;
  }

  function shouldShow() {
    if (!TRON_MAIN_PLAYER_BODY_ENABLED || !state.ready) return false;
    if (!TRON_MAIN_PLAYER_BODY_REVEAL_WITH_CHARACTERS) return true;
    return Boolean(getCityRevealComplete() && getCharacterRevealDone());
  }

  function update(dt) {
    if (!state.ready) return;
    const visible = shouldShow();
    group.visible = visible;
    state.visible = visible;
    if (!visible) return;

    group.position.copy(camera.position).add(offsetWorld.copy(TRON_MAIN_PLAYER_BODY_CAMERA_OFFSET).applyQuaternion(camera.quaternion));
    group.quaternion.copy(camera.quaternion);

    const movementHorizontalSpeed = getMovementHorizontalSpeed();
    const speedBase = getSpeedBase();
    const speedFactor = THREE.MathUtils.clamp(movementHorizontalSpeed / Math.max(1, speedBase), 0, 1.65);
    const targetWalkAmount = speedFactor > 0.025 ? speedFactor : 0;
    state.walkAmount = THREE.MathUtils.lerp(
      state.walkAmount,
      targetWalkAmount,
      Math.min(1, dt * 10)
    );
    state.speed = Number(movementHorizontalSpeed.toFixed(3));
    if (state.walkAmount > 0.015) {
      const cadence = THREE.MathUtils.lerp(getWalkStepRate(), getRunStepRate(), getMovementRunMix());
      const pace = THREE.MathUtils.clamp(speedFactor, 0.5, 1.85);
      state.phase += dt * cadence * Math.PI * 2 * pace;
    }

    const walkAmount = state.walkAmount;
    const phase = state.phase;
    const bodyBob = Math.abs(Math.sin(phase)) * 0.024 * walkAmount;
    const strafeBias = getMovementStrafeDirection() * getMovementStrafeMix() * 0.035 * walkAmount;
    for (const part of parts) {
      const restPosition = part.userData.restPosition;
      const restRotation = part.userData.restRotation;
      const side = part.userData.side || 0;
      const partPhase = phase + (side > 0 ? Math.PI : 0);
      const swing = Math.sin(partPhase) * walkAmount;
      const lift = Math.max(0, Math.sin(partPhase)) * walkAmount;
      part.position.copy(restPosition);
      part.rotation.copy(restRotation);

      if (part.userData.type === 'arm' || part.userData.type === 'forearm') {
        const armScale = part.userData.type === 'forearm' ? 0.46 : 0.34;
        part.rotation.x += swing * armScale;
        part.rotation.z += side * 0.035 * walkAmount + strafeBias;
        part.position.y += bodyBob * 0.6;
        part.position.z += Math.abs(swing) * 0.025;
      } else if (part.userData.type === 'leg' || part.userData.type === 'shin') {
        const legScale = part.userData.type === 'shin' ? 0.38 : 0.3;
        part.rotation.x += swing * legScale;
        part.position.y += lift * 0.035 - bodyBob * 0.35;
        part.position.z += swing * 0.035;
      } else if (part.userData.type === 'foot') {
        part.rotation.x += swing * 0.24;
        part.position.y += lift * 0.03 - bodyBob * 0.25;
        part.position.z += swing * 0.045;
      }
    }

    const beatMultiplier = getBeatMultiplier();
    const ledOpacity = THREE.MathUtils.clamp(0.72 + walkAmount * 0.12 + (beatMultiplier - 1) * 0.07, 0.62, 1);
    for (const material of ledMaterials) {
      material.opacity = ledOpacity;
    }
    if (suitMaterial) {
      suitMaterial.emissiveIntensity = THREE.MathUtils.clamp(0.18 + walkAmount * 0.08, 0.16, 0.34);
    }
  }

  function inspect() {
    return {
      ...state,
      groupVisible: group.visible,
      position: {
        x: Number(group.position.x.toFixed(3)),
        y: Number(group.position.y.toFixed(3)),
        z: Number(group.position.z.toFixed(3)),
      },
      scale: Number(group.scale.x.toFixed(3)),
    };
  }

  return {
    group,
    get enabled() {
      return TRON_MAIN_PLAYER_BODY_ENABLED;
    },
    build,
    update,
    inspect,
  };
}
