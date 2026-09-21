// Le scorciatoie di ispezione: window.__tronInspect e compagne, quello che si scrive
// in console per vedere dove sta ogni cosa nella scena.
//
// Spostato qui da main.js senza cambiare la logica (tappa 5, 2026-09-19). Misurato
// prima di tagliare: il dominio legge e basta, non scrive niente fuori e nessuno legge
// niente da qui. Le diciotto cose che guarda arrivano da initInspectHooks(), chiamata
// dove stava il codice; la larghezza della strada passa da un getter perche' cambia.
//
// Tutto il pezzo sono assegnazioni a window, quindi sta dentro la funzione: due di esse
// (__tronRevealProfile, __tronSpikeInspect) leggono una proprieta' al momento
// dell'assegnazione, non dentro una closure, e all'import quegli oggetti non esistono.
//
// Attenzione: il gate visivo chiama __tronInspect ma NON __tronPerfInspect. Un nome
// sbagliato li' dentro lo becca solo il typecheck (2026-09-19, verificato in pagina).
import { isCameraCollisionDisabled } from '../camera/camera-collision.js';
import { tronDiscCursorState } from '../camera/disc-cursor.js';
import { droneIntroInspect } from '../camera/drone-intro.js';
import { getPointerLocked, getUnlockedMouseLookActive, isMouseLookEnabled } from '../camera/mouse-look.js';
import { player } from '../camera/player-state.js';
import {
  tronRunnerCrowdRuntime,
  tronRunnerIdleCharacterRuntime,
  tronRunnerOrchestration,
} from '../character/runner-wiring.js';
import { applyPlayerSpawn, captureLivePlayerSpawn } from '../controls/control-panel.js';
import { mobileTouchControlsInspect } from '../controls/mobile-movement.js';
import {
  BASE_PAD_CULLING_BOUNDS_MARGIN,
  BASE_PAD_FRUSTUM_CULLING_ENABLED,
  basePadHexClipMesh,
  basePadLedBatch,
} from '../world/base-pads.js';
import { boulevard } from '../world/boulevard-layout.js';
import { boundaryErrorInspect, getTronNoclipEnabled } from '../world/boundary-error.js';
import {
  inspectSideBuildingCivicNumberCulling,
  inspectSideBuildingDoorBatching,
  sideBuildingCivicNumberGroups,
} from '../world/building-doors.js';
import { mainBuildingRecords, sideBuildingRecords } from '../world/buildings.js';
import { cityDepartmentBoardInspect, cityRoleBoardInspect } from '../world/city-boards.js';
import {
  CITY_REVEAL_MAIN_BUILDING_LED_WIREFRAME_ENABLED,
  CITY_REVEAL_ROAD_GRID_EXTRA_BLOCKS,
  CITY_REVEAL_ROAD_GRID_PROCEDURAL,
  CITY_REVEAL_ROAD_GRID_RENDER_ORDER,
  CITY_REVEAL_ROAD_SOLID_BACKING_ENABLED,
  CITY_REVEAL_ROAD_SOLID_FADE_ENABLED,
  CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED,
  cityRevealArmedAt,
  cityRevealBackplate,
  cityRevealBackplateMat,
  cityRevealBackplateOpacityScale,
  cityRevealComplete,
  cityRevealDelayMs,
  cityRevealEffectiveDelayMs,
  cityRevealEstimatedVisibleObjects,
  cityRevealFadeMs,
  cityRevealFrontZ,
  cityRevealMainBuildingSlowDiagnostics,
  cityRevealRealClipPlane,
  cityRevealRoadFadeObjects,
  cityRevealRoadGridAlphaFactor,
  cityRevealRoadGridBounds,
  cityRevealRoadGridExtraWidth,
  cityRevealRoadGridFadeAt,
  cityRevealRoadGridGroup,
  cityRevealRoadGridHalfWidth,
  cityRevealRoadGridObjects,
  cityRevealRoadGridSkippedPerimeterSegments,
  cityRevealRoadSolidTopY,
  cityRevealScanGlow,
  cityRevealSidewalkWireY,
  cityRevealSolidObjects,
  cityRevealStartedAt,
  cityRevealSweepEndZ,
  cityRevealSweepProgress,
  cityRevealSweepStartZ,
  cityRevealWaitingForVisibleFrame,
  cityRevealWireAlpha,
  cityRevealWireGroup,
  cityRevealWireObjects,
  cityRevealWireOpacityScale,
  cityRevealWireframeDensity,
  cityRevealWireframeEnabled,
  isCityRevealCompositeActive,
  isCityRevealRealRevealActive,
} from '../world/city-reveal-wireframe.js';
import {
  CITY_REVEAL_ROAD_FADE_BANDS,
  CITY_REVEAL_ROAD_FADE_MAX_OPACITY,
  CITY_REVEAL_ROAD_GRID_FADE_BANDS,
  cityRevealRoadFadeMaterials,
  cityRevealRoadGridMat,
} from '../world/city-reveal-materials.js';
import {
  BLOOM_RESOLUTION_CAP,
  CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS,
  CITY_REVEAL_RENDER_ORDER,
  CITY_REVEAL_SWEEP_MODE,
} from '../world/config.js';
import { contactTerminalInspect } from '../world/contact-terminal.js';
import { facadeLedRuntimeInspect, sideBuildingLedLayoutInspect } from '../world/facade-led-treatment.js';
import {
  hexRoadTiles,
  hexUpdateEnabled,
  recoveringHexTiles,
  roadTileTopY,
} from '../world/hex-tiles.js';
import {
  hiddenSkinnedRenderPrewarmStats,
  postProcessingPrewarmStats,
  sceneTexturePrewarmStats,
  skinnedMeshPrewarmStats,
} from './boot-prewarm.js';
import {
  adaptiveRenderTargetInspect,
  hasDroneIntroLanded,
  isBloomPassActive,
  isBloomRevealBypassed,
  mobilePerformanceProfileInspect,
  post,
  shouldBypassBloomForRevealPerformance,
  shouldUseComposer,
} from './post-pipeline.js';

/** @type {import('three').PerspectiveCamera} */ let camera = null;
/** @type {import('three').WebGLRenderer} */ let renderer = null;
/** @type {ReturnType<typeof import('../controls/controls.js').createControlEls>} */ let controlEls = null;
/** @type {any} */ let fpsEl = null;
/** @type {any} */ let bridges = null;
/** @type {any} */ let skyDome = null;
/** @type {any} */ let performanceDiagnostics = null;
/** @type {any} */ let cityRevealProfiler = null;
/** @type {any} */ let cityRevealRender = null;
/** @type {any} */ let cityRevealMainLedReveal = null;
/** @type {any} */ let mainFacadeVerticalRevealState = null;
/** @type {any} */ let welcomeWindowMotion = null;
/** @type {any} */ let cinematicGroundingSettings = null;
let droneIntroHeroShotEnabled = false;
let hexRoadInspect = () => /** @type {any} */ (null);
let buildingLedBatchInspect = () => /** @type {any} */ (null);
let postRevealPerfIsolationInspect = () => /** @type {any} */ (null);
let getDynamicRoadSurfaceWidth = () => 0;

/** Registra le scorciatoie su window, dove stava il codice in main.js. */
export function initInspectHooks(deps) {
  ({
    camera, renderer, controlEls, fpsEl, bridges, skyDome, performanceDiagnostics,
    cityRevealProfiler, cityRevealRender, cityRevealMainLedReveal,
    mainFacadeVerticalRevealState, welcomeWindowMotion, cinematicGroundingSettings,
    droneIntroHeroShotEnabled, hexRoadInspect, buildingLedBatchInspect,
    postRevealPerfIsolationInspect, getDynamicRoadSurfaceWidth,
  } = deps);

  window.__tronInspect = () => ({
    cameraX: camera.position.x,
    cameraY: camera.position.y,
    cameraZ: camera.position.z,
    cameraPitch: player.pitch,
    cameraYaw: player.yaw,
    noclip: getTronNoclipEnabled(),
    cameraCollisionDisabled: isCameraCollisionDisabled(),
    mouseLookEnabled: isMouseLookEnabled(),
    cityRevealProfile: cityRevealProfiler.inspect(),
    sideBuildingCivicNumberCount: sideBuildingCivicNumberGroups.length,
    sideBuildingCivicNumberCulling: inspectSideBuildingCivicNumberCulling(),
    sideBuildingDoorBatching: inspectSideBuildingDoorBatching(),
    sideBuildingCivicNumbers: sideBuildingRecords.map((record) => ({
      value: record.civicNumberValue,
      visible: Boolean(record.civicNumberGroup?.visible),
      layers: record.civicNumberGroup?.children.length ?? 0,
      x: record.civicNumberGroup?.position.x ?? null,
      y: record.civicNumberGroup?.position.y ?? null,
      z: record.civicNumberGroup?.position.z ?? null,
      rotationY: record.civicNumberGroup?.rotation.y ?? null,
      scaleX: record.civicNumberGroup?.scale.x ?? null,
      scaleY: record.civicNumberGroup?.scale.y ?? null,
    })),
    sideBuildingLedLayouts: sideBuildingRecords.map((record) => sideBuildingLedLayoutInspect(record)),
    bridgeLinks: bridges.inspect(),
    tronRunner: tronRunnerOrchestration.inspect(),
    tronRunnerCrowd: tronRunnerCrowdRuntime.inspect(),
    tronRunnerIdleCharacter: tronRunnerIdleCharacterRuntime.inspect(),
    surfaceReflections: {
      roadReflect: Number(controlEls.roadReflect.value),
      roadBuildingReflect: Number(controlEls.roadBuildingReflect.value),
      roadMetalness: Number(controlEls.roadMetalness.value),
      roadRoughness: Number(controlEls.roadRoughness.value),
      roadNormal: Number(controlEls.roadNormal.value),
      basePadReflect: Number(controlEls.basePadReflect.value),
      basePadMetalness: Number(controlEls.basePadMetalness.value),
      basePadRoughness: Number(controlEls.basePadRoughness.value),
      basePadNormal: Number(controlEls.basePadNormal.value),
      basePadTextureRepeat: Number(controlEls.basePadTextureRepeat.value),
    },
    pointerLocked: getPointerLocked(),
    unlockedMouseLookActive: getUnlockedMouseLookActive(),
    tronDiscCursor: {
      visible: tronDiscCursorState.visible,
      pointerInside: tronDiscCursorState.pointerInside,
      x: Number(tronDiscCursorState.x.toFixed(1)),
      y: Number(tronDiscCursorState.y.toFixed(1)),
      speed: Number(tronDiscCursorState.speed.toFixed(1)),
      spinDegPerSec: Number(tronDiscCursorState.spinDegPerSec.toFixed(1)),
      targetSpinDegPerSec: Number(tronDiscCursorState.targetSpinDegPerSec.toFixed(1)),
    },
    mobileTouchControls: mobileTouchControlsInspect(),
    footsteps: window.__tronFootstepInspect?.(),
    music: window.__tronMusicInspect?.(),
    equalizer: window.__labEqualizerInspect?.(),
    welcomePanelMotion: { ...welcomeWindowMotion.state },
    cityDepartmentBoards: cityDepartmentBoardInspect(),
    contactTerminal: contactTerminalInspect(),
    cityRoleBoard: cityRoleBoardInspect(),
    backspaceIntroTriggered: player.backspaceIntroTriggered,
    cameraCollisionUnlockedByBackspace: player.cameraCollisionUnlockedByBackspace,
    droneIntro: {
      ...droneIntroInspect(),
      heroShot: droneIntroHeroShotEnabled,
      landed: hasDroneIntroLanded(),
      landingPose: { ...player.droneLandingPose },
    },
    playerSpawn: { ...player.playerSpawn },
    fps: fpsEl.textContent,
    pixelRatio: renderer.getPixelRatio(),
    antialiasMode: post.antialiasMode,
    bloomActive: isBloomPassActive(),
    hexUpdateEnabled,
    cityRevealWireAlpha,
    cityRevealBackplateAlpha: cityRevealBackplateMat.opacity,
    cityRevealBackplateVisible: cityRevealBackplate.visible,
    cityRevealSkyPassActive: Boolean(cityRevealRender.getSkyPass()?.enabled),
    ...skyDome.inspectRevealSky(),
    cityRevealSweepMode: CITY_REVEAL_SWEEP_MODE,
    cityRevealFrontZ,
    cityRevealSweepStartZ,
    cityRevealSweepEndZ,
    cityRevealSweepProgress,
    cityRevealArmed: cityRevealArmedAt > 0,
    cityRevealArmedElapsedMs: cityRevealArmedAt > 0 ? Number((performance.now() - cityRevealArmedAt).toFixed(1)) : 0,
    cityRevealMainBuildingSlow: cityRevealMainBuildingSlowDiagnostics(),
    cityRevealRealPrewarm: cityRevealRender.inspectRealPrewarm(),
    cityRevealMainFacadeVerticalLed: { ...mainFacadeVerticalRevealState },
    cityRevealStarted: cityRevealStartedAt > 0,
    cityRevealComplete,
    cityRevealWaitingForBackspace: cityRevealWireframeEnabled && !player.backspaceIntroTriggered && !cityRevealStartedAt && !cityRevealComplete,
    cityRevealWaitingForVisibleFrame,
    cityRevealClipPlaneNormal: {
      x: cityRevealRealClipPlane.normal.x,
      y: cityRevealRealClipPlane.normal.y,
      z: cityRevealRealClipPlane.normal.z,
    },
    cityRevealClipPlaneConstant: cityRevealRealClipPlane.constant,
    cityRevealClipPlaneGroundFrontZ: -cityRevealRealClipPlane.constant / cityRevealRealClipPlane.normal.z,
    cityRevealRenderOrder: CITY_REVEAL_RENDER_ORDER,
    cityRevealCompositeActive: isCityRevealCompositeActive(),
    cityRevealRealRevealActive: isCityRevealRealRevealActive(),
    cityRevealRealClipActive: Boolean(cityRevealRender.getScenePass()?.clipReveal || isCityRevealRealRevealActive()),
    cityRevealComposerPasses: {
      ...cityRevealRender.inspectPasses(),
      mainLedReveal: Boolean(cityRevealMainLedReveal.getPass()?.enabled),
    },
    cityRevealScanGlow: cityRevealScanGlow.inspect(),
    ...cityRevealMainLedReveal.inspect(),
    cityRevealWireAaMode: 'global-fxaa-only',
    cityRevealWireAaLocalized: false,
    cityRevealVisibleObjects: cityRevealEstimatedVisibleObjects(),
    cityRevealWireObjects: cityRevealWireObjects.length,
    cityRevealSolidObjects: cityRevealSolidObjects.length,
    cityRevealMainBuildingLedWireObjects: cityRevealWireObjects.filter((object) => object.userData.cityRevealRole === 'main-led-wire').length,
    cityRevealMainBuildingLedWireEnabled: CITY_REVEAL_MAIN_BUILDING_LED_WIREFRAME_ENABLED,
    cityRevealBridgeSolidObjects: cityRevealSolidObjects.filter((object) => object.userData.cityRevealRole === 'bridge-solid').length,
    cityRevealBridgeLedWireObjects: cityRevealWireObjects.filter((object) => object.userData.cityRevealRole === 'bridge-led-wire').length,
    cityRevealRoadSolidObjects: cityRevealSolidObjects.filter((object) => object.userData.cityRevealRole === 'road-solid').length,
    cityRevealSidewalkStats: (() => {
      const pads = [...sideBuildingRecords, ...mainBuildingRecords]
        .map((record) => record.basePad)
        .filter((pad) => pad?.hitPolygon?.length);
      const roadTopY = roadTileTopY();
      const roadSolidTopY = cityRevealRoadSolidTopY();
      const surfaceYs = pads.flatMap((pad) => [pad.topY, pad.innerTopY].filter(Number.isFinite));
      const wireYs = surfaceYs.map((topY) => cityRevealSidewalkWireY(topY));
      const minSurfaceY = surfaceYs.length ? Math.min(...surfaceYs) : null;
      const minWireY = wireYs.length ? Math.min(...wireYs) : null;
      const sidewalkObjects = pads.flatMap((pad) => [
        pad.mesh,
        pad.curbRamp,
        pad.innerMesh,
        pad.border,
        pad.innerBorder,
      ].filter(Boolean));
      const basePadLedRenderableBatches = basePadLedBatch.batches.filter((batch) => batch.mesh);
      const basePadLedCullingEnabledCount = basePadLedRenderableBatches.filter((batch) => batch.mesh.frustumCulled).length;
      const basePadLedVisibleBatchCount = basePadLedRenderableBatches.filter((batch) => batch.mesh.visible).length;
      const sidewalkCullingEnabledCount =
        sidewalkObjects.filter((object) => object.frustumCulled).length +
        basePadLedCullingEnabledCount +
        (basePadHexClipMesh.frustumCulled ? 1 : 0);
      return {
        pads: pads.length,
        roadTopY,
        roadSolidTopY,
        minSurfaceY,
        minWireY,
        realSurfaceMarginOverRoad: Number.isFinite(minSurfaceY) ? minSurfaceY - roadTopY : null,
        wireMarginOverRoadSolid: Number.isFinite(minWireY) ? minWireY - roadSolidTopY : null,
        realBelowRoadCount: surfaceYs.filter((topY) => topY <= roadTopY + 0.001).length,
        wireHiddenByRoadSolidCount: wireYs.filter((wireY) => wireY <= roadSolidTopY + 0.001).length,
        sidewalkRenderableObjects: sidewalkObjects.length,
        basePadObjectCullingEnabled: BASE_PAD_FRUSTUM_CULLING_ENABLED,
        basePadCullingBoundsMargin: BASE_PAD_CULLING_BOUNDS_MARGIN,
        sidewalkCullingDisabled: sidewalkCullingEnabledCount === 0,
        sidewalkCullingEnabledCount,
        basePadLedBatchFrustumCulled: basePadLedRenderableBatches.length > 0 && basePadLedCullingEnabledCount === basePadLedRenderableBatches.length,
        basePadLedBatchObjects: basePadLedRenderableBatches.length,
        basePadLedBatchVisibleObjects: basePadLedVisibleBatchCount,
        basePadLedBatchRenderOrder: basePadLedRenderableBatches[0]?.mesh?.renderOrder ?? null,
        basePadLedBatchTransparent: Boolean(basePadLedBatch.material?.transparent),
        basePadLedBatchDepthWrite: Boolean(basePadLedBatch.material?.depthWrite),
        basePadLedBatchDepthTest: Boolean(basePadLedBatch.material?.depthTest),
        basePadLedBatchCount: basePadLedBatch.count,
        basePadHexClipFrustumCulled: Boolean(basePadHexClipMesh.frustumCulled),
      };
    })(),
    cityRevealRoadFadeObjects: cityRevealRoadFadeObjects.length,
    cityRevealRoadFadeVisibleObjects: cityRevealRoadFadeObjects.filter((object) => cityRevealWireGroup.visible && object.visible !== false && object.material?.visible && object.material?.opacity > 0.002).length,
    cityRevealRoadFadeBands: CITY_REVEAL_ROAD_FADE_BANDS,
    cityRevealRoadFadeMaxOpacity: CITY_REVEAL_ROAD_FADE_MAX_OPACITY,
    cityRevealRoadFadeOuterOpacity: cityRevealRoadFadeMaterials.at(-1)?.opacity ?? 0,
    cityRevealRoadGridObjects: cityRevealRoadGridObjects.length,
    cityRevealRoadGridVisibleObjects: cityRevealRoadGridObjects.filter((object) => cityRevealRoadGridGroup.visible && object.visible !== false && object.material?.visible && object.material?.opacity > 0.002).length,
    cityRevealRoadGridSkippedPerimeterSegments,
    cityRevealRoadGridDepthTest: cityRevealRoadGridMat.depthTest,
    cityRevealRoadGridBaseOpacity: cityRevealRoadGridMat.userData.baseOpacity,
    cityRevealRoadGridRenderOrder: CITY_REVEAL_ROAD_GRID_RENDER_ORDER,
    cityRevealRoadGridLayerOrder: 'below-wire-buildings',
    cityRevealRoadGridMode: CITY_REVEAL_ROAD_GRID_PROCEDURAL ? 'procedural-extended-wire-grid' : 'extended-wire-grid',
    cityRevealRoadGridAlphaFactor,
    cityRevealRoadSolidFadeEnabled: CITY_REVEAL_ROAD_SOLID_FADE_ENABLED,
    cityRevealRoadGridProcedural: CITY_REVEAL_ROAD_GRID_PROCEDURAL,
    cityRevealRoadGridExtraBlocks: CITY_REVEAL_ROAD_GRID_EXTRA_BLOCKS,
    cityRevealRoadGridZExtraBlocks: CITY_REVEAL_ROAD_GRID_EXTRA_BLOCKS,
    cityRevealRoadGridFadeEnabled: CITY_REVEAL_ROAD_GRID_EXTRA_BLOCKS > 0,
    cityRevealRoadGridFadeBands: CITY_REVEAL_ROAD_GRID_FADE_BANDS,
    cityRevealRoadGridFadeWidth: cityRevealRoadGridExtraWidth(),
    cityRevealRoadHalfWidth: getDynamicRoadSurfaceWidth() / 2,
    cityRevealRoadGridLineHalfWidth: getDynamicRoadSurfaceWidth() / 2,
    cityRevealRoadGridHalfWidth: cityRevealRoadGridHalfWidth(),
    cityRevealRoadGridFadeSamples: (() => {
      const bounds = cityRevealRoadGridBounds();
      return {
        center: cityRevealRoadGridFadeAt(0, boulevard.dynamicRoadCenter, bounds),
        left: cityRevealRoadGridFadeAt(-bounds.gridHalfW, boulevard.dynamicRoadCenter, bounds),
        right: cityRevealRoadGridFadeAt(bounds.gridHalfW, boulevard.dynamicRoadCenter, bounds),
        near: cityRevealRoadGridFadeAt(0, bounds.gridMinZ, bounds),
        far: cityRevealRoadGridFadeAt(0, bounds.gridMaxZ, bounds),
        halfLeft: cityRevealRoadGridFadeAt(-(bounds.roadHalfW + bounds.fadeWidth * 0.5), boulevard.dynamicRoadCenter, bounds),
        halfFar: cityRevealRoadGridFadeAt(0, bounds.roadMaxZ + bounds.fadeWidth * 0.5, bounds),
      };
    })(),
    cityRevealRoadSolidBackingEnabled: CITY_REVEAL_ROAD_SOLID_BACKING_ENABLED,
    cityRevealSidewalkInternalLinesEnabled: CITY_REVEAL_SIDEWALK_INTERNAL_LINES_ENABLED,
    cityRevealDensityObjects: cityRevealWireObjects.filter((object) => object.userData.cityRevealRole === 'wire-density').length,
    fx: {
      performanceMode: post.performanceMode,
      antialiasMode: post.antialiasMode,
      fxaaEnabled: Boolean(post.fxaaPass?.enabled),
      bloomEnabled: post.bloomEnabled,
      bloomPassEnabled: Boolean(post.bloomPass?.enabled),
      bloomRevealBypassed: isBloomRevealBypassed(),
      bloomRevealBypassActive: shouldBypassBloomForRevealPerformance(),
      bloomActive: isBloomPassActive(),
      cinematicLookEnabled: post.cinematicLookEnabled,
      cinematicLookPassEnabled: Boolean(post.cinematicLookPass?.enabled),
      temporalAaEnabled: post.temporalAaEnabled,
      temporalAaPassEnabled: Boolean(post.temporalAaPass?.enabled),
      cinematicGrounding: cinematicGroundingSettings,
      bloomStrength: post.bloomPass?.strength ?? 0,
      bloomRadius: post.bloomPass?.radius ?? 0,
      bloomThreshold: post.bloomPass?.threshold ?? 0,
      bloomResolutionScale: post.bloomResolutionScale,
      bloomActiveMips: post.bloomPass?.activeMips ?? 0,
      bloomUpdateStride: post.bloomPass?.updateStride ?? 0,
      bloomCacheReady: Boolean(post.bloomPass?._hasCachedBloom),
      bloomResolutionCap: BLOOM_RESOLUTION_CAP,
      manualRenderScale: post.manualRenderScale,
      requestedPixelRatio: post.requestedPixelRatio,
      activePixelRatio: post.activePixelRatio,
      adaptiveRenderTarget: adaptiveRenderTargetInspect(),
      mobileProfile: mobilePerformanceProfileInspect(),
    },
    wireframeFx: {
      enabled: cityRevealWireframeEnabled,
      delayMs: cityRevealDelayMs,
      extraDelayMs: CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS,
      effectiveDelayMs: cityRevealEffectiveDelayMs(),
      fadeMs: cityRevealFadeMs,
      density: cityRevealWireframeDensity,
      opacity: cityRevealWireOpacityScale,
      backplate: cityRevealBackplateOpacityScale,
    },
    hexRoad: hexRoadInspect(),
    buildingLedBatches: buildingLedBatchInspect(),
    fxLed: facadeLedRuntimeInspect(),
    render: { ...renderer.info.render },
    memory: { ...renderer.info.memory },
  });
  window.__tronRunnerInspect = () => tronRunnerOrchestration.inspect();
  window.__tronRevealProfile = cityRevealProfiler.inspect;
  window.__tronSpikeInspect = performanceDiagnostics.spikeSummary;
  window.__tronCaptureLiveSpawn = captureLivePlayerSpawn;
  window.__tronApplyPlayerSpawn = applyPlayerSpawn;
  window.__tronPerfInspect = () => ({
    fps: fpsEl.textContent,
    pixelRatio: renderer.getPixelRatio(),
    activePixelRatio: post.activePixelRatio,
    adaptiveRenderTarget: adaptiveRenderTargetInspect(),
    manualRenderScale: post.manualRenderScale,
    dynamicQualityScale: post.dynamicQualityScale,
    performanceMode: post.performanceMode,
    composerActive: shouldUseComposer(),
    bloomEnabled: post.bloomEnabled,
    bloomPassEnabled: Boolean(post.bloomPass?.enabled),
    bloomRevealBypassed: isBloomRevealBypassed(),
    bloomRevealBypassActive: shouldBypassBloomForRevealPerformance(),
    bloomActive: isBloomPassActive(),
    fxaaEnabled: Boolean(post.fxaaPass?.enabled),
    antialiasMode: post.antialiasMode,
    cinematicLookEnabled: post.cinematicLookEnabled,
    cinematicLookPassEnabled: Boolean(post.cinematicLookPass?.enabled),
    temporalAaEnabled: post.temporalAaEnabled,
    temporalAaPassEnabled: Boolean(post.temporalAaPass?.enabled),
    cinematicGrounding: cinematicGroundingSettings,
    bloomResolutionScale: post.bloomResolutionScale,
    bloomResolutionCap: BLOOM_RESOLUTION_CAP,
    bloomActiveMips: post.bloomPass?.activeMips ?? 0,
    bloomUpdateStride: post.bloomPass?.updateStride ?? 0,
    bloomTemporalStride: post.bloomTemporalAppliedStride,
    bloomCacheReady: Boolean(post.bloomPass?._hasCachedBloom),
    mobileProfile: mobilePerformanceProfileInspect(),
    wireframeFx: {
      enabled: cityRevealWireframeEnabled,
      delayMs: cityRevealDelayMs,
      extraDelayMs: CITY_REVEAL_AUDIO_SYNC_EXTRA_DELAY_MS,
      effectiveDelayMs: cityRevealEffectiveDelayMs(),
      fadeMs: cityRevealFadeMs,
      density: cityRevealWireframeDensity,
      opacity: cityRevealWireOpacityScale,
      backplate: cityRevealBackplateOpacityScale,
    },
    storm: skyDome.inspectStorm(),
    skyBake: skyDome.inspectSkyBake(),
    temporalAa: post.temporalAaPass?.inspect(),
    hexUpdateEnabled,
    hexTiles: hexRoadTiles.length,
    hexRoad: hexRoadInspect(),
    buildingLedBatches: buildingLedBatchInspect(),
    recoveringHexTiles: recoveringHexTiles.size,
    ...boundaryErrorInspect(),
    liveDiagnostics: performanceDiagnostics.summary(),
    skinnedMeshPrewarm: { ...skinnedMeshPrewarmStats },
    texturePrewarm: { ...sceneTexturePrewarmStats },
    hiddenSkinnedRenderPrewarm: { ...hiddenSkinnedRenderPrewarmStats },
    postProcessingPrewarm: { ...postProcessingPrewarmStats },
    postRevealIsolation: postRevealPerfIsolationInspect(),
    render: { ...renderer.info.render },
    memory: { ...renderer.info.memory },
  });
}
