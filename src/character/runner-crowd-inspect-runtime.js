// La fotografia diagnostica della folla, staccata dal runtime che la fa camminare.
//
// Perche' sta in un file suo (2026-09-21): e' una funzione sola da 236 righe che non
// partecipa al frame. Costruisce un oggetto di ispezione per la console e per il gate
// visivo, leggendo lo stato che le viene passato: non muove niente, non alloca niente
// che sopravviva alla chiamata, e non e' chiamata dal ciclo dei frame. Tenerla dentro
// runner-crowd-runtime.js faceva un file di 1.353 righe dove la parte che gira sessanta
// volte al secondo e la parte che gira quando apri la console stavano mescolate.
//
// Non ha stato proprio: tutto arriva da `state`, l'oggetto che runner-wiring.js compone.
import {
  countBy,
  inspectTronRunnerMaterials,
  maxBy,
  minBy,
  sideStreetCoverage as buildSideStreetCoverage,
  sideStreetGroupedSegments as buildSideStreetGroupedSegments,
  sumBy,
} from './character-inspect.js';
import {
  tronRunnerCharacterLedDefaultScale,
  tronRunnerCharacterLedScale,
} from './runner-crowd-leds.js';

export function inspectTronRunnerCrowdRuntime(state) {
  const crowdRuntime = state.runtime();
  const runnerScale = Number(state.runnerWalker.scale.x.toFixed(4));
  const runnerTargetHeight = state.targetHeight * state.runnerWalker.scale.y;
  const runnerHeightFromRoad = state.runnerWalker.position.y - state.roadTopY();
  const now = state.now();
  const members = state.crowd.map((member) => {
    state.crowdBox.setFromObject(member.group);
    state.crowdBox.getSize(state.crowdSize);
    const buildingCollision = crowdRuntime.buildingCollisionDiagnostic(member);
    const heightFromRoad = member.group.position.y - state.roadTopY();
    const targetHeight = state.targetHeight * member.group.scale.y;
    const materialInspect = inspectTronRunnerMaterials(member.model);
    return {
      index: member.index + 1,
      localIndex: (member.localIndex ?? member.index) + 1,
      kind: member.kind ?? 'runner',
      source: member.source ?? 'soldier',
      visible: Boolean(state.crowdGroup.visible && member.group.visible),
      x: Number(member.group.position.x.toFixed(2)),
      y: Number(member.group.position.y.toFixed(2)),
      z: Number(member.group.position.z.toFixed(2)),
      scale: Number(member.group.scale.x.toFixed(4)),
      targetHeight: Number(targetHeight.toFixed(3)),
      heightFromRoad: Number(heightFromRoad.toFixed(3)),
      groundOffset: Number((member.groundOffset ?? state.groundOffset).toFixed(3)),
      surface: member.surface,
      routeMode: member.route?.mode ?? 'fallback-road',
      routeLabel: member.route?.label ?? 'fallback',
      routeCluster: member.route?.cluster ?? 'city',
      sideStreetId: member.route?.sideStreetId ?? '',
      sideStreetSide: member.route?.sideStreetSide ?? '',
      sideStreetLateralOrdinal: member.route?.sideStreetLateralOrdinal ?? null,
      sideStreetGroupIndex: member.route?.sideStreetGroupIndex ?? null,
      sideStreetGroupCount: member.route?.sideStreetGroupCount ?? null,
      startMode: member.startMode ?? 'unknown',
      colorPreset: member.colorPreset ?? 'current',
      colorName: member.colorName ?? 'current cyan',
      ...materialInspect,
      walkActionTime: Number((member.action?.time ?? 0).toFixed(3)),
      walkClipDuration: Number((member.action?.getClip?.()?.duration ?? 0).toFixed(3)),
      walkCycleOffset: Number((member.walkCycleOffset ?? 0).toFixed(3)),
      state: member.state ?? 'walk',
      greetStage: member.greetStage ?? '',
      bubbleText: member.bubbleText ?? '',
      lodStride: member.lodStride ?? 1,
      lodDistance: Number((member.lodDistance ?? 0).toFixed(1)),
      cullingVisible: Boolean(member.cullingVisible),
      cullingInFrustum: Boolean(member.cullingInFrustum),
      cullingReason: member.cullingReason ?? 'unknown',
      cullingDistance: Number((member.cullingDistance ?? 0).toFixed(1)),
      avoidanceNeighbors: member.avoidanceNeighbors ?? 0,
      avoidanceOverlap: Number((member.avoidanceOverlap ?? 0).toFixed(3)),
      stuckMs: member.stuckSince ? Number(Math.max(0, now - member.stuckSince).toFixed(0)) : 0,
      stuckEscapes: member.stuckEscapes ?? 0,
      buildingCollision: buildingCollision.colliding,
      buildingCollisionCorrection: Number(buildingCollision.correction.toFixed(3)),
      buildingCollisionLabel: buildingCollision.label,
      dynamicReflectionVisible: Boolean(member.dynamicReflectionVisible),
      dynamicReflectionMode: member.reflectionGroup?.userData?.tronRunnerReflectionMode ?? 'mesh-clone',
      dynamicReflectionBudgetActive: Boolean(member.dynamicReflectionBudgetActive),
      dynamicReflectionRank: member.dynamicReflectionRank ?? null,
      dynamicReflectionDistance: Number.isFinite(member.dynamicReflectionDistance)
        ? Number(member.dynamicReflectionDistance.toFixed(1))
        : null,
      dynamicReflectionOpacity: Number((member.dynamicReflectionOpacity ?? 0).toFixed(3)),
      dynamicReflectionBodyOpacity: Number((member.dynamicReflectionBodyOpacity ?? 0).toFixed(3)),
      dynamicReflectionLedOpacity: Number((member.dynamicReflectionLedOpacity ?? 0).toFixed(3)),
      dynamicReflectionMeshCount: member.dynamicReflectionMeshCount ?? 0,
      dynamicReflectionLedMeshCount: member.dynamicReflectionLedMeshCount ?? 0,
      waypointIndex: member.waypointIndex ?? 0,
      distanceWalked: Number((member.distanceWalked ?? 0).toFixed(2)),
      lastMovedDistance: Number((member.lastMovedDistance ?? 0).toFixed(4)),
      recentlyMoved: now - (member.lastMovedAt || 0) < 360,
      collisionCount: member.collisionCount ?? 0,
      lastCollision: Boolean(member.lastCollision),
      sizeY: Number(state.crowdSize.y.toFixed(3)),
    };
  });
  const scaleDeltas = members.map((member) => Math.abs(member.scale - runnerScale));
  const targetHeightDeltas = members.map((member) => Math.abs(member.targetHeight - runnerTargetHeight));
  const heightFromRoadDeltas = members.map((member) => Math.abs(member.heightFromRoad - runnerHeightFromRoad));
  const groundOffsetDeltas = members.map((member) => Math.abs(member.groundOffset - state.groundOffset));
  const stateCounts = countBy(members, (member) => member.state);
  const routeDistribution = countBy(members, (member) => member.routeMode || 'fallback-road');
  const lodStrideCounts = countBy(members, (member) => String(member.lodStride || 1));
  const colorCounts = countBy(members, (member) => member.colorPreset || 'current');
  const femaleMembers = members.filter((member) => member.kind === 'female');
  const femaleWhiteCount = femaleMembers.filter((member) => member.colorPreset === 'white').length;
  const sideStreetSummary = state.routes.secondaryStreetSummary(state.routes.candidateRecords());
  const sideStreetCoverage = buildSideStreetCoverage(sideStreetSummary.streets, members);
  const sideStreetGroupedSegments = buildSideStreetGroupedSegments(sideStreetCoverage);
  const materialMinOpacity = minBy(members, (member) => member.materialMinOpacity, 1);
  const materialMaxEmissiveIntensity = maxBy(members, (member) => member.materialMaxEmissiveIntensity, 0);
  const transparentMaterialCount = sumBy(members, (member) => member.transparentMaterialCount);
  return {
    enabled: state.crowdEnabled,
    mode: state.pathMode,
    count: state.crowd.length,
    visibleCount: members.filter((member) => member.visible).length,
    greeterFollowDelayMs: state.greeterFollowDelayMs,
    colorCounts,
    female: {
      enabled: Boolean(state.female?.enabled),
      modelUrl: state.female?.modelUrl ?? '',
      requestedCount: state.female?.requestedCount ?? 0,
      whiteRequestedCount: state.female?.whiteRequestedCount ?? 0,
      colorPlan: state.female?.colorPlan ?? [],
      loaded: Boolean(state.female?.loaded),
      queued: Boolean(state.female?.queued),
      count: femaleMembers.length,
      whiteCount: femaleWhiteCount,
      visibleCount: femaleMembers.filter((member) => member.visible).length,
      error: state.female?.error ?? '',
    },
    routeDistribution,
    sideStreetDetectedStreetCount: sideStreetSummary.streetCount,
    sideStreetDetectedLaneCount: sideStreetSummary.laneCount,
    sideStreetDetectedStreets: sideStreetSummary.streets,
    sideStreetCoverage,
    sideStreetGroupedSegments,
    materialMinOpacity: Number(materialMinOpacity.toFixed(3)),
    materialMaxEmissiveIntensity: Number(materialMaxEmissiveIntensity.toFixed(3)),
    crowdRevealMaterialOpacity: Number((state.runnerState.crowdRevealMaterialOpacity ?? 0).toFixed(3)),
    characterLedBrightnessMultiplier: state.getLedBrightness(),
    characterLedBloomBoost: state.getLedBloom(),
    characterLedScale: Number(tronRunnerCharacterLedScale({
      ledBrightness: state.getLedBrightness(),
      ledBloom: state.getLedBloom(),
    }).toFixed(3)),
    characterLedDefaultScale: Number(tronRunnerCharacterLedDefaultScale().toFixed(3)),
    characterLedEmissiveMax: Number((state.runnerState.ledEmissiveMax ?? state.characterLedEmissiveMax).toFixed(3)),
    transparentMaterialCount,
    sidewalkMembers: members.filter((member) => member.surface === 'sidewalk').length,
    routeLoopMembers: members.filter((member) => member.routeMode === state.pathMode).length,
    startClusterMembers: members.filter((member) => member.routeCluster === 'player-start').length,
    sideStreetLateralMembers: members.filter((member) => (
      member.routeMode === 'side-street-lateral' && Math.abs(member.x) > state.roadHalf()
    )).length,
    movingMembers: members.filter((member) => member.recentlyMoved).length,
    stuckMembers: members.filter((member) => member.stuckMs > state.deadlockMs).length,
    stuckEscapes: sumBy(members, (member) => member.stuckEscapes),
    collisionEnabled: state.collisionEnabled,
    collisionCount: sumBy(members, (member) => member.collisionCount),
    buildingCollisionMembers: members.filter((member) => member.buildingCollision).length,
    maxBuildingCollisionCorrection: Number(maxBy(members, (member) => member.buildingCollisionCorrection, 0).toFixed(3)),
    requestedCount: state.requestedCount,
    cloneSource: 'runner-post-fit-model',
    skeletonClone: Boolean(state.getCloneRunnerSkeleton()),
    sharedMaterial: true,
    dynamicReflections: {
      enabled: state.dynamicReflectionEnabled,
      mode: 'mesh-clone',
      maxActive: state.reflectionMaxActive,
      budgetLimit: state.stats.reflectionBudgetLimit,
      fpsBudgetLimit: state.stats.reflectionFpsBudgetLimit,
      nearDistance: state.reflectionNearDistance,
      minFps: state.reflectionMinFps,
      postRevealRamp: {
        enabled: state.reflectionPostRevealRampEnabled,
        active: state.stats.reflectionPostRevealRampActive,
        durationMs: state.reflectionPostRevealRampMs,
        elapsedMs: Number(state.stats.reflectionPostRevealElapsedMs.toFixed(1)),
        progress: Number(state.stats.reflectionPostRevealProgress.toFixed(3)),
        rampLimit: state.stats.reflectionPostRevealRampLimit,
      },
      distanceSkippedCount: state.stats.reflectionDistanceSkippedCount,
      budgetActiveCount: state.stats.activeReflectionCount,
      candidateCount: state.stats.reflectionCandidateCount,
      visibleCount: members.filter((member) => member.dynamicReflectionVisible).length,
      meshCount: sumBy(members, (member) => member.dynamicReflectionMeshCount || 0),
      ledMeshCount: sumBy(members, (member) => member.dynamicReflectionLedMeshCount || 0),
      maxOpacity: Number(maxBy(members, (member) => member.dynamicReflectionOpacity || 0, 0).toFixed(3)),
      bodyOpacity: Number(maxBy(members, (member) => member.dynamicReflectionBodyOpacity || 0, 0).toFixed(3)),
      ledOpacity: Number(maxBy(members, (member) => member.dynamicReflectionLedOpacity || 0, 0).toFixed(3)),
      yScale: state.reflectionYScale,
    },
    culling: {
      enabled: state.cullingEnabled,
      maxDistance: state.cullDistance,
      radius: state.cullRadius,
      culledLodStride: state.culledLodStride,
      visibleCount: state.stats.cullingVisibleCount,
      hiddenCount: state.stats.cullingHiddenCount,
      distanceHiddenCount: state.stats.cullingDistanceHiddenCount,
      frustumHiddenCount: state.stats.cullingFrustumHiddenCount,
      minDistance: Number(state.stats.cullingMinDistance.toFixed(1)),
      maxObservedDistance: Number(state.stats.cullingMaxDistance.toFixed(1)),
    },
    build: {
      status: state.buildStats.status,
      built: state.buildStats.built,
      requested: state.buildStats.requested,
      progress: Number((state.buildStats.built / Math.max(1, state.buildStats.requested)).toFixed(3)),
      durationMs: Number(state.buildStats.durationMs.toFixed(2)),
      lastChunkMs: Number(state.buildStats.lastChunkMs.toFixed(2)),
      queued: Boolean(state.buildQueueState.job || state.buildQueueState.queue?.length),
      queueLength: state.buildQueueState.queue?.length ?? 0,
    },
    intelligence: {
      enabled: state.intelligenceEnabled,
      mode: 'waypoint-state-machine',
      avoidanceEnabled: state.avoidanceEnabled,
      avoidanceRadius: state.avoidanceRadius,
      avoidancePairs: state.stats.avoidancePairs,
      maxAvoidanceOverlap: Number(state.stats.maxAvoidanceOverlap.toFixed(3)),
      spatialGridCell: state.spatialCell,
      gridCells: state.stats.gridCells,
      lodEnabled: state.intelligenceEnabled,
      distanceReuseEnabled: state.distanceCacheEnabled,
      distanceCalculations: state.stats.distanceCalculations,
      distanceReuses: state.stats.distanceReuses,
      lodNearDistance: state.lodNearDistance,
      lodMidDistance: state.lodMidDistance,
      lodStrideCounts,
      targetFps: state.targetFps,
      updateIntervalMs: Number((state.updateInterval * 1000).toFixed(2)),
      updateCount: state.stats.updateCount,
      skippedFrameCount: state.stats.skippedFrameCount,
      performanceFreezeFrameCount: state.stats.performanceFreezeFrameCount,
      lastStepMs: Number((state.stats.lastStepDt * 1000).toFixed(2)),
      stateCounts,
      lastThinkMs: Number(state.stats.lastThinkMs.toFixed(3)),
      maxThinkMs: Number(state.stats.maxThinkMs.toFixed(3)),
    },
    scaleLock: state.scaleLock,
    sourceScale: runnerScale,
    sourceTargetHeight: Number(runnerTargetHeight.toFixed(3)),
    sourceHeightFromRoad: Number(runnerHeightFromRoad.toFixed(3)),
    maxScaleDelta: Number((scaleDeltas.length ? Math.max(...scaleDeltas) : 0).toFixed(4)),
    maxTargetHeightDelta: Number((targetHeightDeltas.length ? Math.max(...targetHeightDeltas) : 0).toFixed(4)),
    maxHeightFromRoadDelta: Number((heightFromRoadDeltas.length ? Math.max(...heightFromRoadDeltas) : 0).toFixed(4)),
    maxGroundOffsetDelta: Number((groundOffsetDeltas.length ? Math.max(...groundOffsetDeltas) : 0).toFixed(4)),
    members,
  };
}
