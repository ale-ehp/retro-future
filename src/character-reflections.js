export function emptyTronRunnerCrowdReflection() {
  return {
    group: null,
    model: null,
    ledModel: null,
    mixer: null,
    ledMixer: null,
    action: null,
    ledAction: null,
    materials: [],
    bodyMaterials: [],
    ledMaterials: [],
    meshCount: 0,
    ledMeshCount: 0,
  };
}

export function applyTronRunnerCrowdReflectionState({
  member,
  group,
  bodyMaterials,
  ledMaterials,
  visible,
  bodyOpacity,
  ledOpacity,
  reflectionY,
  reflectionYScale,
}) {
  if (group) {
    group.visible = visible;
    group.position.y = reflectionY;
    group.scale.set(1, -reflectionYScale, 1);
  }
  for (const material of bodyMaterials) {
    material.userData.tronRunnerBaseOpacity = bodyOpacity;
    if (Math.abs((material.opacity ?? 0) - bodyOpacity) > 0.002) {
      material.opacity = bodyOpacity;
      material.needsUpdate = true;
    }
  }
  for (const material of ledMaterials) {
    material.userData.tronRunnerBaseOpacity = ledOpacity;
    if (Math.abs((material.opacity ?? 0) - ledOpacity) > 0.002) {
      material.opacity = ledOpacity;
      material.needsUpdate = true;
    }
  }
  member.dynamicReflectionVisible = visible;
  member.dynamicReflectionOpacity = bodyOpacity;
  member.dynamicReflectionBodyOpacity = bodyOpacity;
  member.dynamicReflectionLedOpacity = ledOpacity;
}
