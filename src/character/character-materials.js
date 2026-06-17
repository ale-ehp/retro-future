import * as THREE from 'three';

export function applyTronRunnerCrowdColorToMaterial(material, preset) {
  if (!material || !preset || preset.label === 'current') return material;
  if (material.color?.isColor) material.color.copy(preset.bodyColor);
  if (material.emissive?.isColor) material.emissive.copy(preset.emissiveColor);
  material.needsUpdate = true;
  return material;
}

export function makeTronRunnerCrowdSuitMaterial({
  baseMaterial,
  colorPreset,
  emissiveIntensity,
  ledBloom,
}) {
  const material = baseMaterial.clone();
  material.opacity = 1;
  material.transparent = false;
  material.depthWrite = true;
  material.depthTest = true;
  material.emissiveIntensity = emissiveIntensity;
  material.userData.tronRunnerBaseOpacity = 1;
  material.userData.tronRunnerBaseEmissiveIntensity = material.emissiveIntensity;
  material.userData.tronRunnerLedBloomBoost = ledBloom;
  return applyTronRunnerCrowdColorToMaterial(material, colorPreset);
}

export function makeTronMainPlayerBodySuitMaterial({
  baseMaterial,
  blackColor,
}) {
  const material = baseMaterial.clone();
  material.color.copy(blackColor);
  material.emissive.set(0x001216);
  material.emissiveIntensity = 0.22;
  material.metalness = 0.44;
  material.roughness = 0.62;
  material.envMapIntensity = 0.025;
  material.depthWrite = false;
  material.depthTest = true;
  material.transparent = false;
  material.userData.tronRunnerBaseEmissiveIntensity = material.emissiveIntensity;
  material.userData.tronRunnerLedBloomBoost = 1.25;
  return material;
}

export function makeTronMainPlayerBodyLedMaterial(color) {
  return new THREE.MeshBasicMaterial({
    color,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    opacity: 0.92,
    toneMapped: false,
    transparent: true,
  });
}

export function makeTronRunnerReflectionMaterial({
  suitTexture,
}) {
  return new THREE.MeshBasicMaterial({
    color: 0x12343a,
    map: suitTexture,
    blending: THREE.NormalBlending,
    depthTest: false,
    depthWrite: false,
    opacity: 0,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true,
    userData: { tronRunnerReflectionLayer: 'body' },
  });
}

export function makeTronRunnerReflectionBodyMaterial(options) {
  return makeTronRunnerReflectionMaterial(options);
}

export function makeTronRunnerReflectionLedMaterial({
  colorPreset = null,
  ledMaskTexture,
}) {
  const color = colorPreset?.reflectionLedColor || new THREE.Color(0xbaffff);
  return new THREE.MeshBasicMaterial({
    color,
    map: ledMaskTexture,
    alphaMap: ledMaskTexture,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    opacity: 0,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true,
    userData: { tronRunnerReflectionLayer: 'led' },
  });
}
