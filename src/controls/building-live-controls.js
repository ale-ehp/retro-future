export function createBuildingLiveControlsRuntime(deps) {
  const {
    controlEls,
    PAL,
    sceneLightResponse,
    updateBuildingMaterials,
    sideBuildingMaterials,
    bridgeMaterials,
    mainBuildingMaterials,
    getMainBuildingSaturation,
    setMainBuildingSaturation,
    applyBasePadMaterialRuntimeSettings,
    applyBasePadMaterialSettings,
  } = deps;

  function applyBuildingMaterialControlsFromUI() {
    const ambient = Number(controlEls.ambientLight.value);
    const key = Number(controlEls.keyLight.value);
    const lightResponse = sceneLightResponse(ambient, key);
    const sideBuildingBrightness = Number(controlEls.sideBuildingBrightness.value);
    const sideBuildingHue = Number(controlEls.sideBuildingHue.value);
    const sideBuildingMetalness = Number(controlEls.sideBuildingMetalness.value);
    const sideBuildingRoughness = Number(controlEls.sideBuildingRoughness.value);
    const sideBuildingReflect = Number(controlEls.sideBuildingReflect.value);
    const sideBuildingEmissive = Number(controlEls.sideBuildingEmissive.value);
    const mainBuildingBrightness = Number(controlEls.mainBuildingBrightness.value);
    const mainBuildingHue = Number(controlEls.mainBuildingHue.value);
    setMainBuildingSaturation(Number(controlEls.mainBuildingSaturation.value));
    const mainBuildingSaturation = getMainBuildingSaturation();
    const mainBuildingMetalness = Number(controlEls.mainBuildingMetalness.value);
    const mainBuildingRoughness = Number(controlEls.mainBuildingRoughness.value);
    const mainBuildingReflect = Number(controlEls.mainBuildingReflect.value);
    const mainBuildingEmissive = Number(controlEls.mainBuildingEmissive.value);
    updateBuildingMaterials(sideBuildingMaterials, PAL.buildingSkin, sideBuildingBrightness, sideBuildingHue, sideBuildingMetalness, sideBuildingRoughness, sideBuildingReflect, sideBuildingEmissive, lightResponse);
    updateBuildingMaterials(bridgeMaterials, PAL.buildingSkin, sideBuildingBrightness, sideBuildingHue, sideBuildingMetalness, sideBuildingRoughness, sideBuildingReflect, sideBuildingEmissive, lightResponse);
    updateBuildingMaterials(mainBuildingMaterials, PAL.mainSkin, mainBuildingBrightness, mainBuildingHue, mainBuildingMetalness, mainBuildingRoughness, mainBuildingReflect, mainBuildingEmissive, lightResponse, mainBuildingSaturation);
    controlEls.sideBuildingBrightnessVal.textContent = sideBuildingBrightness.toFixed(2);
    controlEls.sideBuildingHueVal.textContent = sideBuildingHue.toFixed(0);
    controlEls.sideBuildingMetalnessVal.textContent = sideBuildingMetalness.toFixed(2);
    controlEls.sideBuildingRoughnessVal.textContent = sideBuildingRoughness.toFixed(2);
    controlEls.sideBuildingReflectVal.textContent = sideBuildingReflect.toFixed(2);
    controlEls.sideBuildingEmissiveVal.textContent = sideBuildingEmissive.toFixed(2);
    controlEls.mainBuildingBrightnessVal.textContent = mainBuildingBrightness.toFixed(2);
    controlEls.mainBuildingHueVal.textContent = mainBuildingHue.toFixed(0);
    controlEls.mainBuildingSaturationVal.textContent = mainBuildingSaturation.toFixed(2);
    controlEls.mainBuildingMetalnessVal.textContent = mainBuildingMetalness.toFixed(2);
    controlEls.mainBuildingRoughnessVal.textContent = mainBuildingRoughness.toFixed(2);
    controlEls.mainBuildingReflectVal.textContent = mainBuildingReflect.toFixed(2);
    controlEls.mainBuildingEmissiveVal.textContent = mainBuildingEmissive.toFixed(2);
  }

  function applyBasePadMaterialControlsFromUI() {
    const nextBasePadTextureMode = controlEls.basePadTextureMode.value;
    const nextBasePadTextureRepeat = Number(controlEls.basePadTextureRepeat.value);
    const nextBasePadTextureRotation = Number(controlEls.basePadTextureRotation.value);
    const nextBasePadNormalStrength = Number(controlEls.basePadNormal.value);
    const nextBasePadHue = Number(controlEls.basePadHue.value);
    const nextBasePadSaturation = Number(controlEls.basePadSat.value);
    const nextBasePadBrightness = Number(controlEls.basePadBright.value);
    const nextBasePadMetalness = Number(controlEls.basePadMetalness.value);
    const nextBasePadRoughness = Number(controlEls.basePadRoughness.value);
    const nextBasePadReflect = Number(controlEls.basePadReflect.value);
    const nextBasePadEmissive = Number(controlEls.basePadEmissive.value);
    const nextBasePadFlatShading = controlEls.basePadFlatShading.value === 'on';
    const nextBasePadBorderOpacity = Number(controlEls.basePadBorderOpacity.value);
    const nextBasePadBorderBrightness = Number(controlEls.basePadBorderBright.value);
    applyBasePadMaterialRuntimeSettings({
      textureMode: nextBasePadTextureMode,
      textureRepeat: nextBasePadTextureRepeat,
      textureRotation: nextBasePadTextureRotation,
      normalStrength: nextBasePadNormalStrength,
      hue: nextBasePadHue,
      saturation: nextBasePadSaturation,
      brightness: nextBasePadBrightness,
      metalness: nextBasePadMetalness,
      roughness: nextBasePadRoughness,
      reflect: nextBasePadReflect,
      emissive: nextBasePadEmissive,
      flatShading: nextBasePadFlatShading,
      borderOpacity: nextBasePadBorderOpacity,
      borderBrightness: nextBasePadBorderBrightness,
    });
    const lightResponse = sceneLightResponse(Number(controlEls.ambientLight.value), Number(controlEls.keyLight.value));
    applyBasePadMaterialSettings(lightResponse);
    controlEls.basePadTextureModeVal.textContent = nextBasePadTextureMode;
    controlEls.basePadTextureRepeatVal.textContent = `${nextBasePadTextureRepeat.toFixed(2)}x`;
    controlEls.basePadTextureRotationVal.textContent = nextBasePadTextureRotation.toFixed(0);
    controlEls.basePadNormalVal.textContent = nextBasePadNormalStrength.toFixed(2);
    controlEls.basePadHueVal.textContent = nextBasePadHue.toFixed(0);
    controlEls.basePadSatVal.textContent = nextBasePadSaturation.toFixed(2);
    controlEls.basePadBrightVal.textContent = nextBasePadBrightness.toFixed(2);
    controlEls.basePadMetalnessVal.textContent = nextBasePadMetalness.toFixed(2);
    controlEls.basePadRoughnessVal.textContent = nextBasePadRoughness.toFixed(2);
    controlEls.basePadReflectVal.textContent = nextBasePadReflect.toFixed(2);
    controlEls.basePadEmissiveVal.textContent = nextBasePadEmissive.toFixed(3);
    controlEls.basePadFlatShadingVal.textContent = nextBasePadFlatShading ? 'on' : 'off';
    controlEls.basePadBorderOpacityVal.textContent = nextBasePadBorderOpacity.toFixed(2);
    controlEls.basePadBorderBrightVal.textContent = nextBasePadBorderBrightness.toFixed(2);
  }

  return {
    applyBuildingMaterialControlsFromUI,
    applyBasePadMaterialControlsFromUI,
  };
}
