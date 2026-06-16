import * as THREE from 'three';

export function fitTronRunnerModel(model, targetHeight) {
  const initialBox = new THREE.Box3().setFromObject(model);
  const initialSize = initialBox.getSize(new THREE.Vector3());
  model.scale.setScalar(targetHeight / Math.max(initialSize.y, 0.001));
  model.scale.x *= 0.74;
  model.scale.z *= 0.70;
  const fittedBox = new THREE.Box3().setFromObject(model);
  model.position.set(
    -(fittedBox.min.x + fittedBox.max.x) * 0.5,
    -fittedBox.min.y,
    -(fittedBox.min.z + fittedBox.max.z) * 0.5
  );
}

export function makeTronRunnerActionSet(gltf, mixer) {
  const actions = {};
  for (const clip of gltf.animations) {
    const action = mixer.clipAction(clip);
    action.enabled = true;
    actions[clip.name] = action;
  }
  const idleName = gltf.animations.find((clip) => /idle/i.test(clip.name))?.name || gltf.animations[0]?.name;
  const walkName = gltf.animations.find((clip) => /walk/i.test(clip.name))?.name || idleName;
  const runName = gltf.animations.find((clip) => /run/i.test(clip.name))?.name || walkName;
  return {
    actions,
    actionNames: { idle: idleName, walk: walkName, run: runName },
  };
}

export function createTronRunnerCrowdMemberRecord({
  index,
  group,
  model,
  material,
  mixer,
  action,
  colorPreset,
  reflection,
  route,
  startInfo,
  speed,
  speedScaleOffset,
  animationScaleOffset,
  walkCycleOffset,
  groundOffset,
}) {
  return {
    index,
    group,
    model,
    materials: [material],
    mixer,
    action,
    colorPreset: colorPreset.label,
    colorName: colorPreset.name,
    reflectionGroup: reflection.group,
    reflectionModel: reflection.model,
    reflectionLedModel: reflection.ledModel,
    reflectionMixer: reflection.mixer,
    reflectionLedMixer: reflection.ledMixer,
    reflectionAction: reflection.action,
    reflectionLedAction: reflection.ledAction,
    reflectionMaterials: reflection.materials,
    reflectionBodyMaterials: reflection.bodyMaterials,
    reflectionLedMaterials: reflection.ledMaterials,
    dynamicReflectionMeshCount: reflection.meshCount,
    dynamicReflectionLedMeshCount: reflection.ledMeshCount,
    dynamicReflectionVisible: false,
    dynamicReflectionOpacity: 0,
    dynamicReflectionBodyOpacity: 0,
    dynamicReflectionLedOpacity: 0,
    route,
    waypointIndex: startInfo.waypointIndex ?? 0,
    speed,
    speedScaleOffset,
    animationScaleOffset,
    walkCycleOffset,
    lastEffectiveAnimationSpeed: null,
    startMode: startInfo.mode,
    baseVisible: false,
    cullingVisible: false,
    cullingInFrustum: false,
    cullingReason: 'group-hidden',
    cullingDistance: 0,
    state: 'walk',
    stateUntil: 0,
    lodStride: 1,
    lodDistance: 0,
    lodDt: 0,
    mixerDt: 0,
    avoidanceNeighbors: 0,
    avoidanceOverlap: 0,
    lastMovedAt: 0,
    stuckSince: 0,
    stuckEscapes: 0,
    surface: route?.surface || (route ? 'sidewalk' : 'road-fallback'),
    groundOffset,
    distanceWalked: 0,
    lastMovedDistance: 0,
    collisionCount: 0,
    lastCollision: false,
  };
}

function normalizeTronRunnerIdleBoneName(name) {
  return String(name || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function findTronRunnerIdleBone(model, patterns, exactKeys = []) {
  const normalizedKeys = exactKeys.map(normalizeTronRunnerIdleBoneName);
  let exact = null;
  let fallback = null;
  model.traverse((object) => {
    if (!object.isBone) return;
    const key = normalizeTronRunnerIdleBoneName(object.name);
    if (!exact && normalizedKeys.includes(key)) exact = object;
    if (!fallback && patterns.some((pattern) => pattern.test(key))) fallback = object;
  });
  return exact || fallback;
}

function rotateTronRunnerIdleBone(model, patterns, rotation, exactKeys = []) {
  const bone = findTronRunnerIdleBone(model, patterns, exactKeys);
  if (!bone) return null;
  bone.rotation.set(rotation.x, rotation.y, rotation.z);
  bone.updateMatrixWorld(true);
  return bone.name || 'bone';
}

export function poseTronRunnerIdleCharacterArmsCrossed(model, idleCharacter) {
  if (!model) return [];
  const posed = [];
  const poseSpecs = [
    { label: 'spine', exactKeys: ['mixamorigSpine2', 'mixamorigSpine1', 'mixamorigSpine'], patterns: [/spine2$/, /spine1$/, /spine$/], rotation: { x: -0.05, y: 0.03, z: 0.08 } },
    { label: 'leftUpperArm', exactKeys: ['mixamorigLeftArm', 'leftUpperArm', 'leftArm'], patterns: [/mixamorigleftarm$/, /leftupperarm$/, /leftarm$/], rotation: { x: 0.34, y: 0.72, z: -1.34 } },
    { label: 'leftForeArm', exactKeys: ['mixamorigLeftForeArm', 'leftForeArm', 'leftLowerArm'], patterns: [/mixamorigleftforearm$/, /leftforearm$/, /leftlowerarm$/], rotation: { x: 0.08, y: -0.56, z: -2.18 } },
    { label: 'leftHand', exactKeys: ['mixamorigLeftHand', 'leftHand', 'leftWrist'], patterns: [/mixamoriglefthand$/, /lefthand$/, /leftwrist$/], rotation: { x: -0.08, y: 0.24, z: -0.28 } },
    { label: 'rightUpperArm', exactKeys: ['mixamorigRightArm', 'rightUpperArm', 'rightArm'], patterns: [/mixamorigrightarm$/, /rightupperarm$/, /rightarm$/], rotation: { x: 0.34, y: -0.72, z: 1.34 } },
    { label: 'rightForeArm', exactKeys: ['mixamorigRightForeArm', 'rightForeArm', 'rightLowerArm'], patterns: [/mixamorigrightforearm$/, /rightforearm$/, /rightlowerarm$/], rotation: { x: 0.08, y: 0.56, z: 2.18 } },
    { label: 'rightHand', exactKeys: ['mixamorigRightHand', 'rightHand', 'rightWrist'], patterns: [/mixamorigrighthand$/, /righthand$/, /rightwrist$/], rotation: { x: -0.08, y: -0.24, z: 0.28 } },
  ];
  for (const spec of poseSpecs) {
    const boneName = rotateTronRunnerIdleBone(model, spec.patterns, spec.rotation, spec.exactKeys);
    if (boneName) posed.push(boneName);
  }
  const posedKeys = posed.map(normalizeTronRunnerIdleBoneName);
  const hasLeftUpper = posedKeys.includes('mixamorigleftarm') || posedKeys.some((key) => /left(upper)?arm$/.test(key));
  const hasRightUpper = posedKeys.includes('mixamorigrightarm') || posedKeys.some((key) => /right(upper)?arm$/.test(key));
  idleCharacter.poseApplied = posed.length >= 4;
  idleCharacter.poseBoneCount = posed.length;
  idleCharacter.poseBoneNames = posed;
  idleCharacter.upperArmPoseApplied = hasLeftUpper && hasRightUpper;
  model.updateMatrixWorld(true);
  return posed;
}
