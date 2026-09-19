// applyLiveControls: la funzione che rilegge tutto il pannello e riapplica la scena.
//
// Spostata qui da main.js senza cambiare una riga (tappa 5, 2026-09-19). E' 691 righe
// in un pezzo solo: sta in un file suo perche' insieme al resto del pannello avrebbe
// sfondato il limite di 1.500 righe, non perche' vada spezzata. Con lei vengono le tre
// cose che la governano: quali cursori sono cambiati (fastScopeForControl), come si
// uniscono due ambiti (mergeLiveControlScope) e quando si riapplica (scheduleLiveControls,
// una volta per fotogramma).
//
// Le funzioni che applica gruppo per gruppo stanno in controls/control-panel.js e
// arrivano da li'; le dipendenze da main arrivano da initLiveControls().

import { collisioni } from '../camera/camera-collision.js';
import { player } from '../camera/player-state.js';
import {
  applyCharacterControlsFromUI,
  applyCinematicGroundingInitialControls,
} from '../character/runner-wiring.js';
import {
  applyAntialiasControls,
  applyBloomEnabled,
  applyRenderResolution,
  invalidateBloomTemporalCache,
  post,
} from '../engine/post-pipeline.js';
import { getRoadReflectionEnvMap, setRoadBuildingReflection } from '../engine/reflection-env.js';
import {
  applyBasePadMaterialSettings,
  applyBasePadRuntimeSettings,
  updateBasePadHexInfluence,
  updateBasePadLedStrips,
} from '../world/base-pads.js';
import {
  boulevard,
  roadSurfaceWidthForBuildings,
  safeSideBuildingSpacingScale,
  updateBuildingStreetEdgeBlocks,
  updateLongitudinalRoadEdges,
  updateMainBuildingStreetEdgeBlock,
  updateSideRoadLayout,
  updateStreetEdgeLayout,
} from '../world/boulevard-layout.js';
import {
  applyBoundaryErrorVisualSettings,
  applyRoadBoundaryHexVisualSettings,
  updateRoadBoundaryHexMaterial,
  updateRoadBoundaryHexRows,
  updateRoadBoundaryPulseLayout,
} from '../world/boundary-error.js';
import { updateSideBuildingDoorMaterials } from '../world/building-doors.js';
import { updateEdgeStrips } from '../world/building-leds.js';
import {
  bridgeMaterials,
  mainBuildingColliders,
  mainBuildingMaterials,
  mainBuildingMeshes,
  sideBuildingColliders,
  sideBuildingMaterials,
  sideBuildingMeshes,
  updateBuildingFootprints,
  updateBuildingMaterials,
  updateBuildingScale,
} from '../world/buildings.js';
import { FSR_MANUAL_CONTROL_IDS, MAX_RENDER_PIXEL_RATIO } from '../world/config.js';
import {
  invalidateMainFacadeVerticalRevealLedBounds,
  setFacadeLedRuntimeSettings,
} from '../world/facade-led-treatment.js';
import {
  applyHexRuntimeSettings,
  hexTileActiveColor,
  hexTileBaseColor,
  hexTileDisplayActiveColor,
  hexTileDisplayBaseColor,
  setHexRoadMaterialGlow,
  setHexTileGap,
  setHexTileHeightScale,
  setHexTileScale,
  updateHexTileLayout,
  updateStreetEdgeHexTileScale,
} from '../world/hex-tiles.js';
import {
  AUDIO_FX_FAST_CONTROL_IDS,
  BASE_PAD_MATERIAL_FAST_CONTROL_IDS,
  BOUNDARY_ERROR_FAST_CONTROL_IDS,
  BUILDING_MATERIAL_FAST_CONTROL_IDS,
  CHARACTER_FAST_CONTROL_IDS,
  HEX_RUNTIME_FAST_CONTROL_IDS,
  LIGHT_FAST_CONTROL_IDS,
  MOVEMENT_FAST_CONTROL_IDS,
  POST_FAST_CONTROL_IDS,
  ROAD_MATERIAL_FAST_CONTROL_IDS,
  SKY_FAST_CONTROL_IDS,
  WIREFRAME_FAST_CONTROL_IDS,
} from './controls.js';
import * as THREE from 'three';
import {
  pannello,
  applyBasePadMaterialControlsFromUI,
  applyBoundaryErrorControlsFromUI,
  applyBuildingMaterialControlsFromUI,
  applyFsrUpscaleControlsFromUI,
  applyHexRuntimeControlsFromUI,
  applyLightControlsFromUI,
  applyMovementControlsFromUI,
  applyPostControlsFromUI,
  applyRoadMaterialControlsFromUI,
  applyTronSoundtrackIntroFxControlsFromUI,
  applyWireframeFxControlsFromUI,
  formatOffsetLabel,
  refreshRoadTileInstances,
  sceneLightResponse,
  tunedColor,
  updateGroundLedMaterials,
  updateRoadTileMaterials,
} from './control-panel.js';

/** @type {any} */ let ambientLight = null;
/** @type {any} */ let applySkyControlsFromUI = null;
/** @type {any} */ let applySkyPreset = null;
/** @type {any} */ let applyStormControlsFromUI = null;
/** @type {any} */ let bridges = null;
/** @type {ReturnType<typeof import('./controls.js').createControlEls>} */ let controlEls = null;
/** @type {any} */ let dirKey = null;
/** @type {any} */ let domeMat = null;
/** @type {any} */ let hexTileDisplayBaseEmissive = null;
/** @type {any} */ let hexTileDisplayHitEmissive = null;
/** @type {any} */ let PAL = null;
/** @type {any} */ let renderer = null;
/** @type {any} */ let roadBoundaryHexRowOffsets = null;
/** @type {any} */ let roadMat = null;
/** @type {any} */ let setFixedCameraFov = null;
/** @type {any} */ let updateRoadSurfaceWidth = null;
/** @type {any} */ let computeDynamicRoadBounds = null;
/** @type {any} */ let updateMainRoadLength = null;

/** Le dipendenze da main.js. */
export function initLiveControls(deps) {
  ({
  ambientLight, applySkyControlsFromUI, applySkyPreset, applyStormControlsFromUI, bridges,
  controlEls, dirKey, domeMat, hexTileDisplayBaseEmissive, hexTileDisplayHitEmissive, PAL,
  renderer, roadBoundaryHexRowOffsets, roadMat, setFixedCameraFov, updateRoadSurfaceWidth,
  computeDynamicRoadBounds, updateMainRoadLength,
  } = deps);
}

let liveControlsFrame = 0;
let liveControlsScope = null;
function fastScopeForControl(target) {
  if (!target?.id) return 'all';
  if (FSR_MANUAL_CONTROL_IDS.has(target.id) && controlEls.fsrPreset) {
    controlEls.fsrPreset.value = 'custom';
  }
  if (SKY_FAST_CONTROL_IDS.has(target.id)) return 'sky';
  if (POST_FAST_CONTROL_IDS.has(target.id)) return 'post';
  if (WIREFRAME_FAST_CONTROL_IDS.has(target.id)) return 'wireframe';
  if (AUDIO_FX_FAST_CONTROL_IDS.has(target.id)) return 'audio-fx';
  if (MOVEMENT_FAST_CONTROL_IDS.has(target.id)) return 'movement';
  if (CHARACTER_FAST_CONTROL_IDS.has(target.id)) return 'character';
  if (LIGHT_FAST_CONTROL_IDS.has(target.id)) return 'light';
  if (HEX_RUNTIME_FAST_CONTROL_IDS.has(target.id)) return 'hex-runtime';
  if (ROAD_MATERIAL_FAST_CONTROL_IDS.has(target.id)) return 'road-material';
  if (BUILDING_MATERIAL_FAST_CONTROL_IDS.has(target.id)) return 'building-material';
  if (BASE_PAD_MATERIAL_FAST_CONTROL_IDS.has(target.id)) return 'base-pad-material';
  if (BOUNDARY_ERROR_FAST_CONTROL_IDS.has(target.id)) return 'boundary-error';
  return 'all';
}

function mergeLiveControlScope(currentScope, nextScope) {
  if (!currentScope) return nextScope;
  if (currentScope === nextScope) return currentScope;
  if (currentScope === 'all' || nextScope === 'all') return 'all';
  return 'all';
}

export function scheduleLiveControls(event) {
  const target = event?.currentTarget || event?.target;
  const nextScope = fastScopeForControl(target);
  liveControlsScope = mergeLiveControlScope(liveControlsScope, nextScope);
  if (liveControlsFrame) return;
  liveControlsFrame = requestAnimationFrame(() => {
    const scope = liveControlsScope || 'all';
    liveControlsFrame = 0;
    liveControlsScope = null;
    if (scope === 'sky') applySkyControlsFromUI();
    else if (scope === 'post') applyPostControlsFromUI();
    else if (scope === 'wireframe') applyWireframeFxControlsFromUI();
    else if (scope === 'audio-fx') applyTronSoundtrackIntroFxControlsFromUI();
    else if (scope === 'movement') applyMovementControlsFromUI();
    else if (scope === 'character') applyCharacterControlsFromUI();
    else if (scope === 'light') applyLightControlsFromUI();
    else if (scope === 'hex-runtime') applyHexRuntimeControlsFromUI();
    else if (scope === 'road-material') applyRoadMaterialControlsFromUI();
    else if (scope === 'building-material') applyBuildingMaterialControlsFromUI();
    else if (scope === 'base-pad-material') applyBasePadMaterialControlsFromUI();
    else if (scope === 'boundary-error') applyBoundaryErrorControlsFromUI();
    else applyLiveControls();
  });
}

// Previous argument list of updateBuildingFootprints, compared field by field so
// a re-run with identical inputs costs nothing. Starts empty, so the first call
// through applyLiveControls always builds the footprints.
const lastBuildingFootprintInputs = [];

function buildingFootprintInputsChanged(...inputs) {
  if (lastBuildingFootprintInputs.length !== inputs.length) {
    lastBuildingFootprintInputs.length = 0;
    lastBuildingFootprintInputs.push(...inputs);
    return true;
  }
  let changed = false;
  for (let i = 0; i < inputs.length; i += 1) {
    if (lastBuildingFootprintInputs[i] !== inputs[i]) {
      lastBuildingFootprintInputs[i] = inputs[i];
      changed = true;
    }
  }
  return changed;
}

export function applyLiveControls() {
  const offset = Number(controlEls.hexOffset.value);
  const radius = Number(controlEls.hexRadius.value);
  const dropDelay = Number(controlEls.hexDropDelay.value);
  const dropSpeed = Number(controlEls.hexDropSpeed.value);
  const recovery = Number(controlEls.hexRecovery.value);
  const tileHeight = Number(controlEls.tileHeight.value);
  const tileScale = Number(controlEls.tileScale.value);
  const hexGap = Number(controlEls.hexGap.value);
  const tileHitLight = Number(controlEls.tileHitLight.value);
  const playerTileLight = Number(controlEls.playerTileLight.value);
  const roadNormal = Number(controlEls.roadNormal.value);
  const ambient = Number(controlEls.ambientLight.value);
  const key = Number(controlEls.keyLight.value);
  const exposure = Number(controlEls.exposure.value);
  const skyChoice = controlEls.skyChoice.value;
  const skyQuality = controlEls.skyQuality.value;
  const skyBrightness = Number(controlEls.skyBrightness.value);
  const skyHue = Number(controlEls.skyHue.value);
  const skyCloudContrast = Number(controlEls.skyCloudContrast.value);
  const nextBoulevardWidthScale = Number(controlEls.boulevardWidthScale.value);
  const roadLight = Number(controlEls.roadLight.value);
  const roadReflect = Number(controlEls.roadReflect.value);
  const roadBuildingReflect = Number(controlEls.roadBuildingReflect.value);
  const roadMetalness = Number(controlEls.roadMetalness.value);
  const roadRoughness = Number(controlEls.roadRoughness.value);
  const roadHue = Number(controlEls.roadHue.value);
  const roadSat = Number(controlEls.roadSat.value);
  const roadBright = Number(controlEls.roadBright.value);
  const nextRoadBoundaryHexEnabled = controlEls.roadBoundaryHexEnabled.value === 'on';
  const nextRoadBoundaryHexRows = Number(controlEls.roadBoundaryHexRows.value);
  const nextRoadSideHexExtraRows = Number(controlEls.roadSideHexExtraRows.value);
  const nextRoadBoundaryHexBrightness = Number(controlEls.roadBoundaryHexBrightness.value);
  const nextRoadBoundaryHexOpacity = Number(controlEls.roadBoundaryHexOpacity.value);
  const nextRoadBoundaryHexY = Number(controlEls.roadBoundaryHexY.value);
  const nextRoadBoundaryHexRowOffsets = controlEls.roadBoundaryRowY.map((input) => Number(input?.value ?? 0));
  const nextRoadBoundaryHexOutset = Number(controlEls.roadBoundaryHexOutset.value);
  const nextRoadBoundaryCollisionEnabled = controlEls.roadBoundaryCollisionEnabled.value === 'on';
  const nextRoadBoundaryCollisionMargin = Number(controlEls.roadBoundaryCollisionMargin.value);
  const nextRoadBoundaryCameraLead = Number(controlEls.roadBoundaryCameraLead.value);
  const nextRoadBoundaryPulseStrength = Number(controlEls.roadBoundaryPulseStrength.value);
  const nextBoundaryErrorVisible = controlEls.boundaryErrorVisible.value === 'on';
  const nextBoundaryErrorSize = Number(controlEls.boundaryErrorSize.value);
  const nextBoundaryErrorAnchor = controlEls.boundaryErrorAnchor.value;
  const nextBoundaryErrorAnimation = Number(controlEls.boundaryErrorAnimation.value);
  const nextBoundaryErrorDuration = Number(controlEls.boundaryErrorDuration.value) / 1000;
  const nextBoundaryErrorGlitch = Number(controlEls.boundaryErrorGlitch.value);
  const nextBoundaryErrorRenderMode = controlEls.boundaryErrorRenderMode.value;
  const nextBoundaryErrorFloorLightEnabled = controlEls.boundaryErrorFloorLightEnabled.value === 'on';
  const nextBoundaryErrorFloorLightRadius = Number(controlEls.boundaryErrorFloorLightRadius.value);
  const nextBoundaryErrorFloorLightIntensity = Number(controlEls.boundaryErrorFloorLightIntensity.value);
  const nextBoundaryErrorFloorLightOpacity = Number(controlEls.boundaryErrorFloorLightOpacity.value);
  const nextBoundaryErrorFloorLightHue = Number(controlEls.boundaryErrorFloorLightHue.value);
  const nextBoundaryErrorFloorLightY = Number(controlEls.boundaryErrorFloorLightY.value);
  const nextBoundaryErrorFloorLightSoftness = Number(controlEls.boundaryErrorFloorLightSoftness.value);
  const nextStreetEdgeWidth = 0;
  const nextCrossRoadWidth = 0;
  const nextCrossStreetEdgeWidth = 0;
  const ledBrightness = Number(controlEls.ledBrightness.value);
  const ledThickness = Number(controlEls.ledThickness.value);
  const nextLedDistance = Number(controlEls.ledDistance.value);
  const nextBuildingHorizontalLedDistance = Number(controlEls.buildingHorizontalLedDistance.value);
  const nextBuildingHorizontalLedThickness = Number(controlEls.buildingHorizontalLedThickness.value);
  const nextBuildingHorizontalLedRadius = Number(controlEls.buildingHorizontalLedRadius.value);
  const ledHue = Number(controlEls.ledHue.value);
  const basePadLedBrightness = Number(controlEls.basePadLedBrightness.value);
  const basePadLedThickness = Number(controlEls.basePadLedThickness.value);
  const basePadLedOffset = Number(controlEls.basePadLedOffset.value);
  const basePadLedHue = Number(controlEls.basePadLedHue.value);
  const nextBasePadGlobalY = Number(controlEls.basePadGlobalY.value);
  const nextBasePadCurbEnabled = controlEls.basePadCurbEnabled.value === 'on';
  const nextBasePadCurbWidth = Number(controlEls.basePadCurbWidth.value);
  const nextBasePadInnerRaise = Number(controlEls.basePadInnerRaise.value);
  const nextBasePadCurbSlope = Number(controlEls.basePadCurbSlope.value);
  const nextBasePadCurbRadius = Number(controlEls.basePadCurbRadius.value);
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
  const nextBasePadBevelSize = Number(controlEls.basePadBevelSize.value);
  const nextBasePadBevelSegments = Number(controlEls.basePadBevelSegments.value);
  const nextBasePadFlatShading = controlEls.basePadFlatShading.value === 'on';
  const nextBasePadBorderOpacity = Number(controlEls.basePadBorderOpacity.value);
  const nextBasePadBorderBrightness = Number(controlEls.basePadBorderBright.value);
  const buildingLowLedOffset = Number(controlEls.buildingLowLedOffset.value);
  const buildingHighLedOffset = Number(controlEls.buildingHighLedOffset.value);
  const nextBuildingVerticalLedLength = Number(controlEls.buildingVerticalLedLength.value);
  const nextBuildingVerticalLedY = Number(controlEls.buildingVerticalLedY.value);
  const nextBuildingLowLedY = Number(controlEls.buildingLowLedY.value);
  const nextBuildingHighLedY = Number(controlEls.buildingHighLedY.value);
  const nextBuildingFacadeLedNormal = Number(controlEls.buildingFacadeLedNormal.value);
  const nextBuildingFacadeLedX = Number(controlEls.buildingFacadeLedX.value);
  const nextBuildingFacadeLedY = Number(controlEls.buildingFacadeLedY.value);
  const nextBuildingFacadeLedZ = Number(controlEls.buildingFacadeLedZ.value);
  const nextSideFacadeSegmentOffsets = (controlEls.buildingFacadeLedSegmentControls || []).map((controls) => ({
    u: Number(controls.u.value),
    y: Number(controls.y.value),
    normal: Number(controls.normal.value),
  }));
  const nextBridgeXOffset = Number(controlEls.bridgeXOffset.value);
  const nextBridgeZOffset = Number(controlEls.bridgeZOffset.value);
  const nextBridgeYOffset = Number(controlEls.bridgeYOffset.value);
  const nextBridgeSpanScale = Number(controlEls.bridgeSpanScale.value);
  const nextBridgeHeightScale = Number(controlEls.bridgeHeightScale.value);
  const nextBridgeDepthScale = Number(controlEls.bridgeDepthScale.value);
  const bridgeLowLedOffset = Number(controlEls.bridgeLowLedOffset.value);
  const bridgeHighLedOffset = Number(controlEls.bridgeHighLedOffset.value);
  const roadEdgeBrightness = 0;
  const medianBrightness = 0;
  const nextCollisionPadding = Number(controlEls.collisionPadding.value);
  const nextMainBuildingCollisionPadding = Number(controlEls.mainBuildingCollisionPadding.value);
  const nextCameraMinHeight = Number(controlEls.cameraMinHeight.value);
  const nextWalkSpeed = Number(controlEls.walkSpeed.value);
  const nextSprintSpeed = Number(controlEls.sprintSpeed.value);
  const nextBackwardSpeedScale = Number(controlEls.backwardSpeedScale.value);
  const nextStrafeSpeedScale = Number(controlEls.strafeSpeedScale.value);
  const nextDiagonalSpeedScale = Number(controlEls.diagonalSpeedScale.value);
  const nextVerticalSpeed = Number(controlEls.verticalSpeed.value);
  const nextMovementAccel = Number(controlEls.movementAccel.value);
  const nextMovementDecel = Number(controlEls.movementDecel.value);
  const nextWalkBob = Number(controlEls.walkBob.value);
  const nextRunBob = Number(controlEls.runBob.value);
  const nextStrafeBobScale = Number(controlEls.strafeBobScale.value);
  const nextBackwardBobScale = Number(controlEls.backwardBobScale.value);
  const nextWalkStepRate = Number(controlEls.walkStepRate.value);
  const nextRunStepRate = Number(controlEls.runStepRate.value);
  const nextStepSnap = Number(controlEls.stepSnap.value);
  const nextMovementSway = Number(controlEls.movementSway.value);
  const nextMovementRoll = Number(controlEls.movementRoll.value);
  const nextStrafeLean = Number(controlEls.strafeLean.value);
  const nextHeadMotionSmoothing = Number(controlEls.headMotionSmoothing.value);
  const nextMouseSensitivity = Number(controlEls.mouseSensitivity.value);
  const sideBuildingBrightness = Number(controlEls.sideBuildingBrightness.value);
  const sideBuildingHue = Number(controlEls.sideBuildingHue.value);
  const sideBuildingMetalness = Number(controlEls.sideBuildingMetalness.value);
  const sideBuildingRoughness = Number(controlEls.sideBuildingRoughness.value);
  const sideBuildingReflect = Number(controlEls.sideBuildingReflect.value);
  const sideBuildingEmissive = Number(controlEls.sideBuildingEmissive.value);
  const nextSideBuildingWidthScale = Number(controlEls.sideBuildingWidthScale.value);
  const nextSideBuildingDepthScale = Number(controlEls.sideBuildingDepthScale.value);
  const requestedSideBuildingSpacingScale = Number(controlEls.sideBuildingSpacingScale.value);
  const nextSideBuildingSpacingScale = safeSideBuildingSpacingScale(requestedSideBuildingSpacingScale, nextSideBuildingDepthScale);
  if (Math.abs(nextSideBuildingSpacingScale - requestedSideBuildingSpacingScale) > 0.001) {
    controlEls.sideBuildingSpacingScale.value = nextSideBuildingSpacingScale.toFixed(2);
  }
  const sideBuildingScale = Number(controlEls.sideBuildingScale.value);
  const nextSideBuildingBasePadScale = Number(controlEls.sideBuildingBasePadScale.value);
  const nextSideBuildingBasePadXScale = Number(controlEls.sideBuildingBasePadXScale.value);
  const nextSideBuildingBasePadY = Number(controlEls.sideBuildingBasePadY.value);
  const nextSideBuildingBasePadThickness = Number(controlEls.sideBuildingBasePadThickness.value);
  const nextSideBuildingBasePadCut = Number(controlEls.sideBuildingBasePadCut.value);
  const nextSideBuildingBasePadRadius = Number(controlEls.sideBuildingBasePadRadius.value);
  const mainBuildingBrightness = Number(controlEls.mainBuildingBrightness.value);
  const mainBuildingHue = Number(controlEls.mainBuildingHue.value);
  const nextMainBuildingSaturation = Number(controlEls.mainBuildingSaturation.value);
  const mainBuildingMetalness = Number(controlEls.mainBuildingMetalness.value);
  const mainBuildingRoughness = Number(controlEls.mainBuildingRoughness.value);
  const mainBuildingReflect = Number(controlEls.mainBuildingReflect.value);
  const mainBuildingEmissive = Number(controlEls.mainBuildingEmissive.value);
  const nextMainBuildingWidthScale = Number(controlEls.mainBuildingWidthScale.value);
  const nextMainBuildingDepthScale = Number(controlEls.mainBuildingDepthScale.value);
  const nextMainBuildingZ = Number(controlEls.mainBuildingZ.value);
  const nextMainBuildingY = Number(controlEls.mainBuildingY.value);
  const mainBuildingScale = Number(controlEls.mainBuildingScale.value);
  const nextMainBuildingBasePadScale = Number(controlEls.mainBuildingBasePadScale.value);
  const nextMainBuildingBasePadXScale = Number(controlEls.mainBuildingBasePadXScale.value);
  const nextMainBuildingBasePadZScale = Number(controlEls.mainBuildingBasePadZScale.value);
  const nextMainBuildingBasePadY = Number(controlEls.mainBuildingBasePadY.value);
  const nextMainBuildingBasePadThickness = Number(controlEls.mainBuildingBasePadThickness.value);
  const nextMainBuildingBasePadCut = Number(controlEls.mainBuildingBasePadCut.value);
  const nextMainBuildingBasePadRadius = Number(controlEls.mainBuildingBasePadRadius.value);
  const mainBuildingLedBrightness = Number(controlEls.mainLedBrightnessUi.value);
  const mainBuildingLedThickness = Number(controlEls.mainLedThicknessUi.value);
  const mainBuildingLedDistance = Number(controlEls.mainLedVerticalDistanceUi.value);
  const nextMainBuildingHorizontalLedDistance = Number(controlEls.mainLedHorizontalDistanceUi.value);
  const nextMainBuildingHorizontalLedThickness = Number(controlEls.mainLedHorizontalThicknessUi.value);
  const nextMainBuildingHorizontalLedRadius = Number(controlEls.mainLedHorizontalRadiusUi.value);
  const mainBuildingLedHue = Number(controlEls.mainLedHueUi.value);
  const mainBuildingLowLedOffset = Number(controlEls.mainLedLowOffsetUi.value);
  const mainBuildingHighLedOffset = Number(controlEls.mainLedHighOffsetUi.value);
  const nextMainBuildingVerticalLedLength = Number(controlEls.mainLedVerticalLengthUi.value);
  const nextMainBuildingVerticalLedY = Number(controlEls.mainLedVerticalYUi.value);
  const nextMainBuildingLowLedY = Number(controlEls.mainLedLowYUi.value);
  const nextMainBuildingHighLedY = Number(controlEls.mainLedHighYUi.value);
  const nextMainBuildingFacadeLedBrightness = Number(controlEls.mainFacadeLedBrightnessUi.value);
  const nextMainBuildingFacadeLedNormal = Number(controlEls.mainFacadeLedNormalUi.value);
  const nextMainBuildingFacadeLedX = Number(controlEls.mainFacadeLedXUi.value);
  const nextMainBuildingFacadeLedY = Number(controlEls.mainFacadeLedYUi.value);
  const nextMainBuildingFacadeLedZ = Number(controlEls.mainFacadeLedZUi.value);
  const nextMainBuildingFacadeLedThickness = Number(controlEls.mainFacadeLedThicknessUi.value);
  const nextMainFacadeSegmentOffsets = controlEls.mainFacadeLedSegmentControls.map((controls) => ({
    u: Number(controls.u.value),
    y: Number(controls.y.value),
    normal: Number(controls.normal.value),
  }));
  const nextPerformanceMode = controlEls.performanceMode.value;
  const nextRenderResolution = Number(controlEls.renderResolution.value);
  const nextAntialiasMode = controlEls.aaMode.value;
  const nextBloomEnabled = controlEls.bloomEnabled.value;
  const bloomStrength = Number(controlEls.bloomStrength.value);
  const bloomRadius = Number(controlEls.bloomRadius.value);
  const bloomThreshold = Number(controlEls.bloomThreshold.value);
  const bloomQuality = Number(controlEls.bloomQuality.value);
  const pixelRatio = Math.min(Number(controlEls.pixelRatio.value) || MAX_RENDER_PIXEL_RATIO, MAX_RENDER_PIXEL_RATIO);
  controlEls.pixelRatio.value = pixelRatio.toFixed(2);
  const previousPerformanceMode = post.performanceMode;

  applyHexRuntimeSettings({ offset, radius, dropDelay, dropSpeed, recovery, tileHitLight, playerTileLight });
  setHexTileHeightScale(tileHeight);
  setHexTileScale(tileScale);
  setHexTileGap(hexGap);
  setRoadBuildingReflection(roadBuildingReflect);
  boulevard.sideBuildingWidthScale = nextSideBuildingWidthScale;
  boulevard.sideBuildingDepthScale = nextSideBuildingDepthScale;
  boulevard.sideBuildingSpacingScale = nextSideBuildingSpacingScale;
  boulevard.mainBuildingWidthScale = nextMainBuildingWidthScale;
  boulevard.mainBuildingDepthScale = nextMainBuildingDepthScale;
  boulevard.mainBuildingZ = nextMainBuildingZ;
  boulevard.mainBuildingY = nextMainBuildingY;
  boulevard.mainBuildingSaturation = nextMainBuildingSaturation;
  setFacadeLedRuntimeSettings({
    side: {
      normal: nextBuildingFacadeLedNormal,
      x: nextBuildingFacadeLedX,
      y: nextBuildingFacadeLedY,
      z: nextBuildingFacadeLedZ,
      segments: nextSideFacadeSegmentOffsets,
    },
    main: {
      brightness: nextMainBuildingFacadeLedBrightness,
      normal: nextMainBuildingFacadeLedNormal,
      x: nextMainBuildingFacadeLedX,
      y: nextMainBuildingFacadeLedY,
      z: nextMainBuildingFacadeLedZ,
      thickness: nextMainBuildingFacadeLedThickness,
      segments: nextMainFacadeSegmentOffsets,
    },
  });
  applyBasePadRuntimeSettings({
    globalY: nextBasePadGlobalY,
    curbEnabled: nextBasePadCurbEnabled,
    curbWidth: nextBasePadCurbWidth,
    innerRaise: nextBasePadInnerRaise,
    curbSlope: nextBasePadCurbSlope,
    curbRadius: nextBasePadCurbRadius,
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
    bevelSize: nextBasePadBevelSize,
    bevelSegments: nextBasePadBevelSegments,
    flatShading: nextBasePadFlatShading,
    borderOpacity: nextBasePadBorderOpacity,
    borderBrightness: nextBasePadBorderBrightness,
  });
  boulevard.sideBuildingBasePadScale = nextSideBuildingBasePadScale;
  boulevard.sideBuildingBasePadXScale = nextSideBuildingBasePadXScale;
  boulevard.sideBuildingBasePadY = nextSideBuildingBasePadY;
  boulevard.sideBuildingBasePadThickness = nextSideBuildingBasePadThickness;
  boulevard.sideBuildingBasePadCut = nextSideBuildingBasePadCut;
  boulevard.sideBuildingBasePadRadius = nextSideBuildingBasePadRadius;
  boulevard.mainBuildingBasePadScale = nextMainBuildingBasePadScale;
  boulevard.mainBuildingBasePadXScale = nextMainBuildingBasePadXScale;
  boulevard.mainBuildingBasePadZScale = nextMainBuildingBasePadZScale;
  boulevard.mainBuildingBasePadY = nextMainBuildingBasePadY;
  boulevard.mainBuildingBasePadThickness = nextMainBuildingBasePadThickness;
  boulevard.mainBuildingBasePadCut = nextMainBuildingBasePadCut;
  boulevard.mainBuildingBasePadRadius = nextMainBuildingBasePadRadius;
  applyRoadBoundaryHexVisualSettings({
    roadBoundaryHexEnabled: nextRoadBoundaryHexEnabled,
    roadBoundaryHexRows: nextRoadBoundaryHexRows,
    roadBoundaryHexFillBrightness: nextRoadBoundaryHexBrightness,
    roadBoundaryHexAlpha: nextRoadBoundaryHexOpacity,
    roadBoundaryHexY: nextRoadBoundaryHexY,
    roadBoundaryHexOutsetScale: nextRoadBoundaryHexOutset,
  });
  boulevard.roadSideHexExtraRows = nextRoadSideHexExtraRows;
  nextRoadBoundaryHexRowOffsets.forEach((value, index) => {
    roadBoundaryHexRowOffsets[index] = value;
  });
  collisioni.roadBoundaryCollisionEnabled = nextRoadBoundaryCollisionEnabled;
  collisioni.roadBoundaryCollisionMargin = nextRoadBoundaryCollisionMargin;
  collisioni.roadBoundaryCameraLead = nextRoadBoundaryCameraLead;
  applyBoundaryErrorVisualSettings({
    roadBoundaryPulseStrength: nextRoadBoundaryPulseStrength,
    boundaryErrorVisible: nextBoundaryErrorVisible,
    boundaryErrorSize: nextBoundaryErrorSize,
    boundaryErrorAnchor: nextBoundaryErrorAnchor,
    boundaryErrorAnimation: nextBoundaryErrorAnimation,
    boundaryErrorDuration: nextBoundaryErrorDuration,
    boundaryErrorGlitch: nextBoundaryErrorGlitch,
    boundaryErrorRenderMode: nextBoundaryErrorRenderMode,
    boundaryErrorFloorLightEnabled: nextBoundaryErrorFloorLightEnabled,
    boundaryErrorFloorLightRadius: nextBoundaryErrorFloorLightRadius,
    boundaryErrorFloorLightIntensity: nextBoundaryErrorFloorLightIntensity,
    boundaryErrorFloorLightOpacity: nextBoundaryErrorFloorLightOpacity,
    boundaryErrorFloorLightHue: nextBoundaryErrorFloorLightHue,
    boundaryErrorFloorLightY: nextBoundaryErrorFloorLightY,
    boundaryErrorFloorLightSoftness: nextBoundaryErrorFloorLightSoftness,
  });
  boulevard.boulevardWidthScale = nextBoulevardWidthScale;
  boulevard.crossRoadWidth = nextCrossRoadWidth;
  boulevard.crossStreetEdgeWidth = nextCrossStreetEdgeWidth;
  updateRoadSurfaceWidth(roadSurfaceWidthForBuildings(
    nextSideBuildingWidthScale,
    nextMainBuildingWidthScale,
    nextStreetEdgeWidth,
    nextBoulevardWidthScale,
    nextSideBuildingDepthScale,
    nextSideBuildingBasePadScale,
    nextSideBuildingBasePadXScale,
    nextMainBuildingDepthScale,
    nextMainBuildingBasePadScale,
    nextMainBuildingBasePadXScale,
    nextRoadSideHexExtraRows
  ));
  const roadBounds = computeDynamicRoadBounds(nextSideBuildingSpacingScale, nextSideBuildingDepthScale, nextMainBuildingDepthScale);
  updateMainRoadLength(roadBounds.center, roadBounds.length);
  updateHexTileLayout();
  updateRoadBoundaryHexRows();
  updateRoadBoundaryPulseLayout();
  updateStreetEdgeLayout(nextStreetEdgeWidth);
  updateBuildingStreetEdgeBlocks(nextSideBuildingSpacingScale, nextStreetEdgeWidth, nextSideBuildingDepthScale);
  updateMainBuildingStreetEdgeBlock(nextMainBuildingWidthScale, nextMainBuildingDepthScale, nextMainBuildingZ, nextStreetEdgeWidth);
  updateSideRoadLayout(nextSideBuildingSpacingScale, nextStreetEdgeWidth);
  updateLongitudinalRoadEdges(nextSideBuildingSpacingScale);
  updateStreetEdgeHexTileScale();
  collisioni.collisionPadding = nextCollisionPadding;
  collisioni.mainBuildingCollisionPadding = nextMainBuildingCollisionPadding;
  player.cameraMinHeight = nextCameraMinHeight;
  player.speedBase = nextWalkSpeed;
  player.speedSprint = nextSprintSpeed;
  player.backwardSpeedScale = nextBackwardSpeedScale;
  player.strafeSpeedScale = nextStrafeSpeedScale;
  player.diagonalSpeedScale = nextDiagonalSpeedScale;
  player.verticalSpeed = nextVerticalSpeed;
  player.movementAcceleration = nextMovementAccel;
  player.movementDeceleration = nextMovementDecel;
  player.walkBobAmount = nextWalkBob;
  player.runBobAmount = nextRunBob;
  player.strafeBobScale = nextStrafeBobScale;
  player.backwardBobScale = nextBackwardBobScale;
  player.walkStepRate = nextWalkStepRate;
  player.runStepRate = nextRunStepRate;
  player.stepSnapAmount = nextStepSnap;
  player.movementSwayAmount = nextMovementSway;
  player.movementRollAmount = nextMovementRoll;
  player.strafeLeanAmount = nextStrafeLean;
  player.headMotionSmoothing = nextHeadMotionSmoothing;
  player.mouseSensitivityScale = nextMouseSensitivity;

  ambientLight.intensity = ambient;
  dirKey.intensity = key;
  renderer.toneMappingExposure = exposure;
  applySkyPreset(skyChoice, skyBrightness, skyHue, skyQuality);
  applyStormControlsFromUI();
  domeMat.uniforms.uCloudContrast.value = skyCloudContrast;
  setFixedCameraFov();
  post.performanceMode = nextPerformanceMode;
  post.manualRenderScale = nextRenderResolution;
  post.requestedBloomResolutionScale = bloomQuality;
  post.requestedPixelRatio = pixelRatio;
  applyFsrUpscaleControlsFromUI();
  applyAntialiasControls(nextAntialiasMode);
  applyBloomEnabled(nextBloomEnabled);
  if (post.performanceMode !== previousPerformanceMode || post.performanceMode === 'quality') {
    post.dynamicQualityScale = 1;
    post.performanceAdjustCooldown = 0;
  }
  applyRenderResolution(post.requestedPixelRatio);

  const lightResponse = sceneLightResponse(ambient, key);
  const roadLightFactor = 0.92 + roadLight * 0.95;
  applyBasePadMaterialSettings(lightResponse);
  hexTileDisplayBaseColor.copy(tunedColor(hexTileBaseColor, roadHue, roadSat, roadBright * roadLightFactor * lightResponse.surface));
  hexTileDisplayActiveColor.copy(tunedColor(hexTileActiveColor, roadHue, roadSat, roadBright * roadLightFactor * lightResponse.surface));
  const roadEmissive = new THREE.Color(0x061419).lerp(new THREE.Color(0x7df6ff), Math.min(1, roadLight / 1.5));
  hexTileDisplayBaseEmissive.copy(roadEmissive).multiplyScalar(lightResponse.emissive);
  hexTileDisplayHitEmissive.copy(tunedColor(new THREE.Color(0x7df6ff), roadHue, roadSat, Math.max(1, roadBright * 1.25)));
  pannello.hexTileBaseEmissiveIntensity = roadLight * 0.36 * lightResponse.emissive + lightResponse.floorFill;

  roadMat.color.set(0x000000);

  const hexInstanceGlow = 1.25 + tileHitLight * 1.1 + playerTileLight * 1.4 + roadLight * 0.25;
  updateRoadBoundaryHexMaterial(ledHue, roadLightFactor);
  updateRoadTileMaterials((material) => {
    material.color.copy(hexTileDisplayBaseColor);
    material.emissive.copy(roadEmissive);
    material.emissiveIntensity = roadLight * 0.36 * lightResponse.emissive + lightResponse.floorFill;
    material.envMap = getRoadReflectionEnvMap();
    material.envMapIntensity = roadReflect * lightResponse.reflection;
    material.metalness = roadMetalness;
    material.roughness = roadRoughness;
    material.normalScale.set(roadNormal, roadNormal);
    setHexRoadMaterialGlow(material, hexInstanceGlow, hexTileDisplayBaseColor);
  });

  bridges.updateLinks(nextSideBuildingWidthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth, nextBridgeXOffset, nextBridgeZOffset, nextBridgeYOffset, nextBridgeSpanScale, nextBridgeHeightScale, nextBridgeDepthScale);
  updateEdgeStrips(ledBrightness, ledThickness, nextLedDistance, ledHue, mainBuildingLedBrightness, mainBuildingLedThickness, mainBuildingLedDistance, mainBuildingLedHue, nextBuildingHorizontalLedDistance, nextMainBuildingHorizontalLedDistance, nextBuildingHorizontalLedThickness, nextMainBuildingHorizontalLedThickness, nextBuildingHorizontalLedRadius, nextMainBuildingHorizontalLedRadius, buildingLowLedOffset, buildingHighLedOffset, bridgeLowLedOffset, bridgeHighLedOffset, mainBuildingLowLedOffset, mainBuildingHighLedOffset, nextBuildingVerticalLedLength, nextMainBuildingVerticalLedLength, nextBuildingVerticalLedY, nextBuildingLowLedY, nextBuildingHighLedY, nextMainBuildingVerticalLedY, nextMainBuildingLowLedY, nextMainBuildingHighLedY, sideBuildingScale, mainBuildingScale, nextSideBuildingWidthScale, nextSideBuildingDepthScale, nextMainBuildingWidthScale, nextMainBuildingDepthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth, tunedColor);
  updateSideBuildingDoorMaterials(ledBrightness, ledHue);
  updateGroundLedMaterials(roadEdgeBrightness, medianBrightness, ledHue);
  updateBuildingMaterials(sideBuildingMaterials, PAL.buildingSkin, sideBuildingBrightness, sideBuildingHue, sideBuildingMetalness, sideBuildingRoughness, sideBuildingReflect, sideBuildingEmissive, lightResponse);
  updateBuildingMaterials(bridgeMaterials, PAL.buildingSkin, sideBuildingBrightness, sideBuildingHue, sideBuildingMetalness, sideBuildingRoughness, sideBuildingReflect, sideBuildingEmissive, lightResponse);
  updateBuildingMaterials(mainBuildingMaterials, PAL.mainSkin, mainBuildingBrightness, mainBuildingHue, mainBuildingMetalness, mainBuildingRoughness, mainBuildingReflect, mainBuildingEmissive, lightResponse, nextMainBuildingSaturation);
  // updateBuildingFootprints rebuilds every base pad from scratch — a dispose +
  // new ExtrudeGeometry (bevelled, with recomputed normals) per pad, up to five
  // per building across 13 buildings. applyLiveControls re-runs once per animation
  // frame for as long as ANY unscoped slider is held down, so without this guard a
  // drag on, say, the ambient light rebuilt the whole city's base pad geometry 60
  // times a second. Skip the rebuild unless one of its own inputs actually moved.
  // Besides its arguments the rebuild also reads module state set earlier in this
  // function: roadHalf() (boulevard width), the base pad runtime settings (global
  // Y and the curb parameters) and the hex tile height/scale (road top Y, hit
  // half-size). Those go into the comparison too, or a drag on one of them
  // would leave the pads where they were.
  if (buildingFootprintInputsChanged(
    nextSideBuildingWidthScale, nextSideBuildingDepthScale, nextMainBuildingWidthScale,
    nextMainBuildingDepthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth,
    nextMainBuildingZ, nextMainBuildingY,
    boulevard.sideBuildingBasePadScale, boulevard.sideBuildingBasePadXScale, boulevard.sideBuildingBasePadY,
    boulevard.sideBuildingBasePadThickness, boulevard.sideBuildingBasePadCut, boulevard.sideBuildingBasePadRadius,
    boulevard.mainBuildingBasePadScale, boulevard.mainBuildingBasePadXScale, boulevard.mainBuildingBasePadZScale,
    boulevard.mainBuildingBasePadY, boulevard.mainBuildingBasePadThickness, boulevard.mainBuildingBasePadCut,
    boulevard.mainBuildingBasePadRadius,
    nextBoulevardWidthScale,
    nextBasePadGlobalY, nextBasePadCurbEnabled, nextBasePadCurbWidth,
    nextBasePadInnerRaise, nextBasePadCurbSlope, nextBasePadCurbRadius,
    tileHeight, tileScale,
  )) {
    updateBuildingFootprints(nextSideBuildingWidthScale, nextSideBuildingDepthScale, nextMainBuildingWidthScale, nextMainBuildingDepthScale, nextSideBuildingSpacingScale, nextStreetEdgeWidth, nextMainBuildingZ, nextMainBuildingY, {
      sideBuildingBasePadScale: boulevard.sideBuildingBasePadScale,
      sideBuildingBasePadXScale: boulevard.sideBuildingBasePadXScale,
      sideBuildingBasePadY: boulevard.sideBuildingBasePadY,
      sideBuildingBasePadThickness: boulevard.sideBuildingBasePadThickness,
      sideBuildingBasePadCut: boulevard.sideBuildingBasePadCut,
      sideBuildingBasePadRadius: boulevard.sideBuildingBasePadRadius,
      mainBuildingBasePadScale: boulevard.mainBuildingBasePadScale,
      mainBuildingBasePadXScale: boulevard.mainBuildingBasePadXScale,
      mainBuildingBasePadZScale: boulevard.mainBuildingBasePadZScale,
      mainBuildingBasePadY: boulevard.mainBuildingBasePadY,
      mainBuildingBasePadThickness: boulevard.mainBuildingBasePadThickness,
      mainBuildingBasePadCut: boulevard.mainBuildingBasePadCut,
      mainBuildingBasePadRadius: boulevard.mainBuildingBasePadRadius,
    });
    invalidateMainFacadeVerticalRevealLedBounds();
  }
  updateBasePadLedStrips(basePadLedBrightness, basePadLedThickness, basePadLedOffset, basePadLedHue);
  updateBuildingScale(sideBuildingMeshes, sideBuildingColliders, sideBuildingScale);
  updateBuildingScale(mainBuildingMeshes, mainBuildingColliders, mainBuildingScale);
  updateBasePadHexInfluence();
  refreshRoadTileInstances();

  if (post.bloomPass) {
    post.bloomPass.enabled = post.bloomEnabled;
    post.bloomPass.strength = bloomStrength;
    post.bloomPass.radius = bloomRadius;
    post.bloomPass.threshold = bloomThreshold;
    invalidateBloomTemporalCache();
  }

  controlEls.hexOffsetVal.textContent = formatOffsetLabel(offset);
  controlEls.hexRadiusVal.textContent = radius.toFixed(1);
  controlEls.hexDropDelayVal.textContent = `${dropDelay.toFixed(0)} ms`;
  controlEls.hexDropSpeedVal.textContent = dropSpeed.toFixed(1);
  controlEls.hexRecoveryVal.textContent = recovery.toFixed(1);
  controlEls.tileHeightVal.textContent = tileHeight.toFixed(2);
  controlEls.tileScaleVal.textContent = tileScale.toFixed(2);
  controlEls.hexGapVal.textContent = hexGap.toFixed(2);
  controlEls.tileHitLightVal.textContent = tileHitLight.toFixed(2);
  controlEls.playerTileLightVal.textContent = playerTileLight.toFixed(2);
  controlEls.roadNormalVal.textContent = roadNormal.toFixed(2);
  controlEls.ambientVal.textContent = ambient.toFixed(2);
  controlEls.keyVal.textContent = key.toFixed(2);
  controlEls.exposureVal.textContent = exposure.toFixed(2);
  controlEls.skyBrightnessVal.textContent = skyBrightness.toFixed(2);
  controlEls.skyHueVal.textContent = skyHue.toFixed(0);
  controlEls.skyCloudContrastVal.textContent = skyCloudContrast.toFixed(2);
  controlEls.boulevardWidthScaleVal.textContent = `${nextBoulevardWidthScale.toFixed(2)}x`;
  controlEls.roadLightVal.textContent = roadLight.toFixed(2);
  controlEls.roadReflectVal.textContent = roadReflect.toFixed(2);
  controlEls.roadBuildingReflectVal.textContent = roadBuildingReflect.toFixed(2);
  controlEls.roadMetalnessVal.textContent = roadMetalness.toFixed(2);
  controlEls.roadRoughnessVal.textContent = roadRoughness.toFixed(2);
  controlEls.roadHueVal.textContent = roadHue.toFixed(0);
  controlEls.roadSatVal.textContent = roadSat.toFixed(2);
  controlEls.roadBrightVal.textContent = roadBright.toFixed(2);
  controlEls.roadBoundaryHexEnabledVal.textContent = nextRoadBoundaryHexEnabled ? 'on' : 'off';
  controlEls.roadBoundaryHexRowsVal.textContent = nextRoadBoundaryHexRows.toFixed(0);
  controlEls.roadSideHexExtraRowsVal.textContent = `${nextRoadSideHexExtraRows.toFixed(0)} file`;
  controlEls.roadBoundaryHexBrightnessVal.textContent = nextRoadBoundaryHexBrightness.toFixed(2);
  controlEls.roadBoundaryHexOpacityVal.textContent = nextRoadBoundaryHexOpacity.toFixed(2);
  controlEls.roadBoundaryHexYVal.textContent = nextRoadBoundaryHexY.toFixed(2);
  controlEls.roadBoundaryRowYVal.forEach((output, index) => {
    if (output) output.textContent = nextRoadBoundaryHexRowOffsets[index].toFixed(2);
  });
  controlEls.roadBoundaryHexOutsetVal.textContent = nextRoadBoundaryHexOutset.toFixed(2);
  controlEls.roadBoundaryCollisionEnabledVal.textContent = nextRoadBoundaryCollisionEnabled ? 'on' : 'off';
  controlEls.roadBoundaryCollisionMarginVal.textContent = nextRoadBoundaryCollisionMargin.toFixed(1);
  controlEls.roadBoundaryCameraLeadVal.textContent = nextRoadBoundaryCameraLead.toFixed(1);
  controlEls.roadBoundaryPulseStrengthVal.textContent = nextRoadBoundaryPulseStrength.toFixed(2);
  controlEls.boundaryErrorVisibleVal.textContent = nextBoundaryErrorVisible ? 'on' : 'off';
  controlEls.boundaryErrorSizeVal.textContent = nextBoundaryErrorSize.toFixed(2);
  controlEls.boundaryErrorAnchorVal.textContent = nextBoundaryErrorAnchor === 'wall' ? 'muro' : 'camera';
  controlEls.boundaryErrorAnimationVal.textContent = nextBoundaryErrorAnimation.toFixed(2);
  controlEls.boundaryErrorDurationVal.textContent = `${Math.round(nextBoundaryErrorDuration * 1000)} ms`;
  controlEls.boundaryErrorGlitchVal.textContent = nextBoundaryErrorGlitch.toFixed(2);
  controlEls.boundaryErrorRenderModeVal.textContent = nextBoundaryErrorRenderMode;
  controlEls.boundaryErrorFloorLightEnabledVal.textContent = nextBoundaryErrorFloorLightEnabled ? 'on' : 'off';
  controlEls.boundaryErrorFloorLightRadiusVal.textContent = nextBoundaryErrorFloorLightRadius.toFixed(1);
  controlEls.boundaryErrorFloorLightIntensityVal.textContent = nextBoundaryErrorFloorLightIntensity.toFixed(2);
  controlEls.boundaryErrorFloorLightOpacityVal.textContent = nextBoundaryErrorFloorLightOpacity.toFixed(2);
  controlEls.boundaryErrorFloorLightHueVal.textContent = nextBoundaryErrorFloorLightHue.toFixed(0);
  controlEls.boundaryErrorFloorLightYVal.textContent = nextBoundaryErrorFloorLightY.toFixed(2);
  controlEls.boundaryErrorFloorLightSoftnessVal.textContent = nextBoundaryErrorFloorLightSoftness.toFixed(2);
  controlEls.ledBrightnessVal.textContent = ledBrightness.toFixed(2);
  controlEls.ledThicknessVal.textContent = ledThickness.toFixed(2);
  controlEls.ledDistanceVal.textContent = nextLedDistance.toFixed(2);
  controlEls.buildingHorizontalLedDistanceVal.textContent = nextBuildingHorizontalLedDistance.toFixed(2);
  controlEls.buildingHorizontalLedThicknessVal.textContent = nextBuildingHorizontalLedThickness.toFixed(2);
  controlEls.buildingHorizontalLedRadiusVal.textContent = nextBuildingHorizontalLedRadius.toFixed(2);
  controlEls.ledHueVal.textContent = ledHue.toFixed(0);
  controlEls.basePadLedBrightnessVal.textContent = basePadLedBrightness.toFixed(2);
  controlEls.basePadLedThicknessVal.textContent = basePadLedThickness.toFixed(2);
  controlEls.basePadLedOffsetVal.textContent = basePadLedOffset.toFixed(2);
  controlEls.basePadLedHueVal.textContent = basePadLedHue.toFixed(0);
  controlEls.basePadGlobalYVal.textContent = nextBasePadGlobalY.toFixed(2);
  controlEls.basePadCurbEnabledVal.textContent = nextBasePadCurbEnabled ? 'on' : 'off';
  controlEls.basePadCurbWidthVal.textContent = nextBasePadCurbWidth.toFixed(2);
  controlEls.basePadInnerRaiseVal.textContent = nextBasePadInnerRaise.toFixed(2);
  controlEls.basePadCurbSlopeVal.textContent = nextBasePadCurbSlope.toFixed(2);
  controlEls.basePadCurbRadiusVal.textContent = nextBasePadCurbRadius.toFixed(2);
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
  controlEls.basePadBevelSizeVal.textContent = nextBasePadBevelSize.toFixed(2);
  controlEls.basePadBevelSegmentsVal.textContent = nextBasePadBevelSegments.toFixed(0);
  controlEls.basePadFlatShadingVal.textContent = nextBasePadFlatShading ? 'on' : 'off';
  controlEls.basePadBorderOpacityVal.textContent = nextBasePadBorderOpacity.toFixed(2);
  controlEls.basePadBorderBrightVal.textContent = nextBasePadBorderBrightness.toFixed(2);
  controlEls.buildingLowLedOffsetVal.textContent = buildingLowLedOffset.toFixed(2);
  controlEls.buildingHighLedOffsetVal.textContent = buildingHighLedOffset.toFixed(2);
  controlEls.buildingVerticalLedLengthVal.textContent = `${Math.round(nextBuildingVerticalLedLength * 100)}%`;
  controlEls.buildingVerticalLedYVal.textContent = nextBuildingVerticalLedY.toFixed(1);
  controlEls.buildingLowLedYVal.textContent = nextBuildingLowLedY.toFixed(1);
  controlEls.buildingHighLedYVal.textContent = nextBuildingHighLedY.toFixed(1);
  controlEls.buildingFacadeLedNormalVal.textContent = nextBuildingFacadeLedNormal.toFixed(2);
  controlEls.buildingFacadeLedXVal.textContent = nextBuildingFacadeLedX.toFixed(2);
  controlEls.buildingFacadeLedYVal.textContent = nextBuildingFacadeLedY.toFixed(2);
  controlEls.buildingFacadeLedZVal.textContent = nextBuildingFacadeLedZ.toFixed(2);
  (controlEls.buildingFacadeLedSegmentControls || []).forEach((controls, index) => {
    const offset = nextSideFacadeSegmentOffsets[index];
    controls.uVal.textContent = offset.u.toFixed(2);
    controls.yVal.textContent = offset.y.toFixed(2);
    controls.normalVal.textContent = offset.normal.toFixed(2);
  });
  controlEls.bridgeXOffsetVal.textContent = nextBridgeXOffset.toFixed(1);
  controlEls.bridgeZOffsetVal.textContent = nextBridgeZOffset.toFixed(1);
  controlEls.bridgeYOffsetVal.textContent = nextBridgeYOffset.toFixed(1);
  controlEls.bridgeSpanScaleVal.textContent = nextBridgeSpanScale.toFixed(2);
  controlEls.bridgeHeightScaleVal.textContent = nextBridgeHeightScale.toFixed(2);
  controlEls.bridgeDepthScaleVal.textContent = nextBridgeDepthScale.toFixed(2);
  controlEls.bridgeLowLedOffsetVal.textContent = bridgeLowLedOffset.toFixed(2);
  controlEls.bridgeHighLedOffsetVal.textContent = bridgeHighLedOffset.toFixed(2);
  controlEls.collisionPaddingVal.textContent = nextCollisionPadding.toFixed(1);
  controlEls.mainBuildingCollisionPaddingVal.textContent = nextMainBuildingCollisionPadding.toFixed(1);
  controlEls.cameraMinHeightVal.textContent = nextCameraMinHeight.toFixed(1);
  controlEls.walkSpeedVal.textContent = nextWalkSpeed.toFixed(0);
  controlEls.sprintSpeedVal.textContent = nextSprintSpeed.toFixed(0);
  controlEls.backwardSpeedScaleVal.textContent = nextBackwardSpeedScale.toFixed(2);
  controlEls.strafeSpeedScaleVal.textContent = nextStrafeSpeedScale.toFixed(2);
  controlEls.diagonalSpeedScaleVal.textContent = nextDiagonalSpeedScale.toFixed(2);
  controlEls.verticalSpeedVal.textContent = nextVerticalSpeed.toFixed(0);
  controlEls.movementAccelVal.textContent = nextMovementAccel.toFixed(1);
  controlEls.movementDecelVal.textContent = nextMovementDecel.toFixed(1);
  controlEls.walkBobVal.textContent = nextWalkBob.toFixed(2);
  controlEls.runBobVal.textContent = nextRunBob.toFixed(2);
  controlEls.strafeBobScaleVal.textContent = nextStrafeBobScale.toFixed(2);
  controlEls.backwardBobScaleVal.textContent = nextBackwardBobScale.toFixed(2);
  controlEls.walkStepRateVal.textContent = nextWalkStepRate.toFixed(2);
  controlEls.runStepRateVal.textContent = nextRunStepRate.toFixed(2);
  controlEls.stepSnapVal.textContent = nextStepSnap.toFixed(2);
  controlEls.movementSwayVal.textContent = nextMovementSway.toFixed(2);
  controlEls.movementRollVal.textContent = nextMovementRoll.toFixed(3);
  controlEls.strafeLeanVal.textContent = nextStrafeLean.toFixed(3);
  controlEls.headMotionSmoothingVal.textContent = nextHeadMotionSmoothing.toFixed(1);
  controlEls.mouseSensitivityVal.textContent = nextMouseSensitivity.toFixed(2);
  controlEls.sideBuildingBrightnessVal.textContent = sideBuildingBrightness.toFixed(2);
  controlEls.sideBuildingHueVal.textContent = sideBuildingHue.toFixed(0);
  controlEls.sideBuildingMetalnessVal.textContent = sideBuildingMetalness.toFixed(2);
  controlEls.sideBuildingRoughnessVal.textContent = sideBuildingRoughness.toFixed(2);
  controlEls.sideBuildingReflectVal.textContent = sideBuildingReflect.toFixed(2);
  controlEls.sideBuildingEmissiveVal.textContent = sideBuildingEmissive.toFixed(2);
  controlEls.sideBuildingWidthScaleVal.textContent = nextSideBuildingWidthScale.toFixed(2);
  controlEls.sideBuildingDepthScaleVal.textContent = nextSideBuildingDepthScale.toFixed(2);
  controlEls.sideBuildingSpacingScaleVal.textContent = nextSideBuildingSpacingScale.toFixed(2);
  controlEls.sideBuildingScaleVal.textContent = sideBuildingScale.toFixed(2);
  controlEls.sideBuildingBasePadScaleVal.textContent = `${nextSideBuildingBasePadScale.toFixed(2)}x`;
  controlEls.sideBuildingBasePadXScaleVal.textContent = nextSideBuildingBasePadXScale.toFixed(2);
  controlEls.sideBuildingBasePadYVal.textContent = nextSideBuildingBasePadY.toFixed(2);
  controlEls.sideBuildingBasePadThicknessVal.textContent = nextSideBuildingBasePadThickness.toFixed(2);
  controlEls.sideBuildingBasePadCutVal.textContent = nextSideBuildingBasePadCut.toFixed(1);
  controlEls.sideBuildingBasePadRadiusVal.textContent = nextSideBuildingBasePadRadius.toFixed(1);
  controlEls.mainBuildingBrightnessVal.textContent = mainBuildingBrightness.toFixed(2);
  controlEls.mainBuildingHueVal.textContent = mainBuildingHue.toFixed(0);
  controlEls.mainBuildingSaturationVal.textContent = nextMainBuildingSaturation.toFixed(2);
  controlEls.mainBuildingMetalnessVal.textContent = mainBuildingMetalness.toFixed(2);
  controlEls.mainBuildingRoughnessVal.textContent = mainBuildingRoughness.toFixed(2);
  controlEls.mainBuildingReflectVal.textContent = mainBuildingReflect.toFixed(2);
  controlEls.mainBuildingEmissiveVal.textContent = mainBuildingEmissive.toFixed(2);
  controlEls.mainBuildingWidthScaleVal.textContent = nextMainBuildingWidthScale.toFixed(2);
  controlEls.mainBuildingDepthScaleVal.textContent = nextMainBuildingDepthScale.toFixed(2);
  controlEls.mainBuildingZVal.textContent = nextMainBuildingZ.toFixed(0);
  controlEls.mainBuildingYVal.textContent = nextMainBuildingY.toFixed(0);
  controlEls.mainBuildingScaleVal.textContent = mainBuildingScale.toFixed(2);
  controlEls.mainBuildingBasePadScaleVal.textContent = `${nextMainBuildingBasePadScale.toFixed(2)}x`;
  controlEls.mainBuildingBasePadXScaleVal.textContent = nextMainBuildingBasePadXScale.toFixed(2);
  controlEls.mainBuildingBasePadZScaleVal.textContent = nextMainBuildingBasePadZScale.toFixed(2);
  controlEls.mainBuildingBasePadYVal.textContent = nextMainBuildingBasePadY.toFixed(2);
  controlEls.mainBuildingBasePadThicknessVal.textContent = nextMainBuildingBasePadThickness.toFixed(2);
  controlEls.mainBuildingBasePadCutVal.textContent = nextMainBuildingBasePadCut.toFixed(1);
  controlEls.mainBuildingBasePadRadiusVal.textContent = nextMainBuildingBasePadRadius.toFixed(1);
  controlEls.mainBuildingLedBrightnessVal.textContent = mainBuildingLedBrightness.toFixed(2);
  controlEls.mainBuildingLedThicknessVal.textContent = mainBuildingLedThickness.toFixed(2);
  controlEls.mainBuildingLedDistanceVal.textContent = mainBuildingLedDistance.toFixed(2);
  controlEls.mainBuildingHorizontalLedDistanceVal.textContent = nextMainBuildingHorizontalLedDistance.toFixed(2);
  controlEls.mainBuildingHorizontalLedThicknessVal.textContent = nextMainBuildingHorizontalLedThickness.toFixed(2);
  controlEls.mainBuildingHorizontalLedRadiusVal.textContent = nextMainBuildingHorizontalLedRadius.toFixed(2);
  controlEls.mainBuildingLedHueVal.textContent = mainBuildingLedHue.toFixed(0);
  controlEls.mainBuildingLowLedOffsetVal.textContent = mainBuildingLowLedOffset.toFixed(2);
  controlEls.mainBuildingHighLedOffsetVal.textContent = mainBuildingHighLedOffset.toFixed(2);
  controlEls.mainBuildingVerticalLedLengthVal.textContent = `${Math.round(nextMainBuildingVerticalLedLength * 100)}%`;
  controlEls.mainBuildingVerticalLedYVal.textContent = nextMainBuildingVerticalLedY.toFixed(1);
  controlEls.mainBuildingLowLedYVal.textContent = nextMainBuildingLowLedY.toFixed(1);
  controlEls.mainBuildingHighLedYVal.textContent = nextMainBuildingHighLedY.toFixed(1);
  controlEls.mainLedBrightnessUiVal.textContent = mainBuildingLedBrightness.toFixed(2);
  controlEls.mainLedHueUiVal.textContent = mainBuildingLedHue.toFixed(0);
  controlEls.mainLedVerticalDistanceUiVal.textContent = mainBuildingLedDistance.toFixed(2);
  controlEls.mainLedThicknessUiVal.textContent = mainBuildingLedThickness.toFixed(2);
  controlEls.mainLedVerticalLengthUiVal.textContent = `${Math.round(nextMainBuildingVerticalLedLength * 100)}%`;
  controlEls.mainLedVerticalYUiVal.textContent = nextMainBuildingVerticalLedY.toFixed(1);
  controlEls.mainLedHorizontalDistanceUiVal.textContent = nextMainBuildingHorizontalLedDistance.toFixed(2);
  controlEls.mainLedHorizontalThicknessUiVal.textContent = nextMainBuildingHorizontalLedThickness.toFixed(2);
  controlEls.mainLedHorizontalRadiusUiVal.textContent = nextMainBuildingHorizontalLedRadius.toFixed(2);
  controlEls.mainLedLowOffsetUiVal.textContent = mainBuildingLowLedOffset.toFixed(2);
  controlEls.mainLedLowYUiVal.textContent = nextMainBuildingLowLedY.toFixed(1);
  controlEls.mainLedHighOffsetUiVal.textContent = mainBuildingHighLedOffset.toFixed(2);
  controlEls.mainLedHighYUiVal.textContent = nextMainBuildingHighLedY.toFixed(1);
  controlEls.mainFacadeLedBrightnessUiVal.textContent = nextMainBuildingFacadeLedBrightness.toFixed(2);
  controlEls.mainFacadeLedNormalUiVal.textContent = nextMainBuildingFacadeLedNormal.toFixed(2);
  controlEls.mainFacadeLedXUiVal.textContent = nextMainBuildingFacadeLedX.toFixed(2);
  controlEls.mainFacadeLedYUiVal.textContent = nextMainBuildingFacadeLedY.toFixed(2);
  controlEls.mainFacadeLedZUiVal.textContent = nextMainBuildingFacadeLedZ.toFixed(2);
  controlEls.mainFacadeLedThicknessUiVal.textContent = `${nextMainBuildingFacadeLedThickness.toFixed(2)}x`;
  controlEls.mainFacadeLedSegmentControls.forEach((controls, index) => {
    const offset = nextMainFacadeSegmentOffsets[index];
    controls.uVal.textContent = offset.u.toFixed(2);
    controls.yVal.textContent = offset.y.toFixed(2);
    controls.normalVal.textContent = offset.normal.toFixed(2);
  });
  controlEls.renderResolutionVal.textContent = `${Math.round(nextRenderResolution * 100)}%`;
  controlEls.bloomVal.textContent = bloomStrength.toFixed(2);
  controlEls.bloomRadiusVal.textContent = bloomRadius.toFixed(2);
  controlEls.bloomThresholdVal.textContent = bloomThreshold.toFixed(2);
  controlEls.bloomQualityVal.textContent = bloomQuality.toFixed(2);
  controlEls.pixelRatioVal.textContent = pixelRatio.toFixed(2);
  applyTronSoundtrackIntroFxControlsFromUI();
  applyCinematicGroundingInitialControls();
  applyCharacterControlsFromUI();
}
