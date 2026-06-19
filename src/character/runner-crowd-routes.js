import {
  TRON_RUNNER_CROWD_BUILDING_GUARD,
  TRON_RUNNER_CROWD_COLLISION_RADIUS,
  TRON_RUNNER_CROWD_EXCLUDED_CIVICS,
  TRON_RUNNER_CROWD_GROUND_OFFSET,
  TRON_RUNNER_CROWD_LOOP_FRONT_ONLY,
  TRON_RUNNER_CROWD_PATH_MODE,
  TRON_RUNNER_CROWD_REACH_RADIUS,
  TRON_RUNNER_CROWD_ROUTE_RECORD_SPREAD,
  TRON_RUNNER_CROWD_SIDEWALK_LANE_EDGE_INSET,
  TRON_RUNNER_CROWD_SIDEWALK_ROUTE_END_INSET,
  TRON_RUNNER_CROWD_SIDE_STREET_GROUP_EXTRA_COUNT,
  TRON_RUNNER_CROWD_START_CLUSTER_COUNT,
} from './characters.js';
import {
  tronRunnerCrowdBuildRoute as tronRunnerCrowdBuildRouteCore,
  tronRunnerCrowdCandidateRecords as tronRunnerCrowdCandidateRecordsCore,
  tronRunnerCrowdDetectedSideStreetLanes as tronRunnerCrowdDetectedSideStreetLanesCore,
  tronRunnerCrowdFallbackPlacement as tronRunnerCrowdFallbackPlacementCore,
  tronRunnerCrowdLoopRouteForRecord as tronRunnerCrowdLoopRouteForRecordCore,
  tronRunnerCrowdRoadFacingRoutePoint as tronRunnerCrowdRoadFacingRoutePointCore,
  tronRunnerCrowdRoadFacingStart as tronRunnerCrowdRoadFacingStartCore,
  tronRunnerCrowdRouteForRecord as tronRunnerCrowdRouteForRecordCore,
  tronRunnerCrowdRouteStyleForIndex as tronRunnerCrowdRouteStyleForIndexCore,
  tronRunnerCrowdRouteStyleOrdinal as tronRunnerCrowdRouteStyleOrdinalCore,
  tronRunnerCrowdSecondaryStreetSummary as tronRunnerCrowdSecondaryStreetSummaryCore,
  tronRunnerCrowdSideStreetLaneAssignment,
  tronRunnerCrowdSideStreetLateralRoute as tronRunnerCrowdSideStreetLateralRouteCore,
  tronRunnerCrowdSideStreetPairs as tronRunnerCrowdSideStreetPairsCore,
  tronRunnerCrowdSideStreetRouteForPair as tronRunnerCrowdSideStreetRouteForPairCore,
  tronRunnerCrowdStartPlayerRoute as tronRunnerCrowdStartPlayerRouteCore,
} from './character-routes.js';

export function createTronRunnerCrowdRoutesRuntime({
  getSideBuildingRecords,
  getDynamicRoadCenter,
  getDynamicRoadLength,
  roadHexBoundaryLimits,
  getRoadHalf,
  getRoadTopY,
  getStreetEdgeWidth,
  getSideBuildingVisualWidth,
  getDroneAnchor,
  pointInPolygon,
  resolveRoundedCollider,
  gridBlock,
  sideBase,
}) {
  function fallbackPlacement(index) {
    return tronRunnerCrowdFallbackPlacementCore({
      index,
      limits: roadHexBoundaryLimits(),
      dynamicRoadCenter: getDynamicRoadCenter(),
      dynamicRoadLength: getDynamicRoadLength(),
      gridBlock,
      roadHalf: getRoadHalf(),
      roadTopY: getRoadTopY(),
      groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
    });
  }

  function candidateRecords() {
    return tronRunnerCrowdCandidateRecordsCore({
      records: getSideBuildingRecords(),
      excludedCivics: TRON_RUNNER_CROWD_EXCLUDED_CIVICS,
      gridBlock,
    });
  }

  function loopRouteForRecord(record, index) {
    return tronRunnerCrowdLoopRouteForRecordCore({
      record,
      index,
      buildingGuard: TRON_RUNNER_CROWD_BUILDING_GUARD,
      collisionRadius: TRON_RUNNER_CROWD_COLLISION_RADIUS,
      roadTopY: getRoadTopY(),
      groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
      frontOnly: TRON_RUNNER_CROWD_LOOP_FRONT_ONLY,
    });
  }

  function sideStreetPairs(records) {
    return tronRunnerCrowdSideStreetPairsCore(records, gridBlock);
  }

  function roadFacingRoutePoint(record, offsetZ = 0) {
    return tronRunnerCrowdRoadFacingRoutePointCore({
      record,
      offsetZ,
      edgeInsetBase: TRON_RUNNER_CROWD_SIDEWALK_LANE_EDGE_INSET,
      buildingGuard: TRON_RUNNER_CROWD_BUILDING_GUARD,
      roadTopY: getRoadTopY(),
      groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
      pointInPolygon,
      resolveRoundedCollider,
    });
  }

  function sideStreetRouteForPair(pair, index) {
    return tronRunnerCrowdSideStreetRouteForPairCore({
      pair,
      index,
      gridBlock,
      sideBase,
      roadHalf: getRoadHalf(),
      roadTopY: getRoadTopY(),
      groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
      roadFacingRoutePoint,
    });
  }

  function detectedSideStreetLanes(records) {
    return tronRunnerCrowdDetectedSideStreetLanesCore({
      records,
      collisionRadius: TRON_RUNNER_CROWD_COLLISION_RADIUS,
      gridBlock,
      roadHalf: getRoadHalf(),
      streetEdgeWidth: getStreetEdgeWidth(),
      sideBuildingWidth: getSideBuildingVisualWidth(),
    });
  }

  function secondaryStreetSummary(records) {
    const lanes = detectedSideStreetLanes(records);
    return tronRunnerCrowdSecondaryStreetSummaryCore(lanes);
  }

  function routeStyleOrdinal(routeIndex, style) {
    return tronRunnerCrowdRouteStyleOrdinalCore({
      routeIndex,
      style,
      routeStyleForIndex,
    });
  }

  function sideStreetLateralRoute(lane, index, ordinal = 0, assignment = null) {
    return tronRunnerCrowdSideStreetLateralRouteCore({
      lane,
      ordinal,
      assignment,
      y: getRoadTopY() + TRON_RUNNER_CROWD_GROUND_OFFSET,
      gridBlock,
    });
  }

  function routeStyleForIndex(routeIndex) {
    const records = candidateRecords();
    const laneCount = detectedSideStreetLanes(records).length;
    return tronRunnerCrowdRouteStyleForIndexCore({
      routeIndex,
      laneCount,
      sideStreetGroupExtraCount: TRON_RUNNER_CROWD_SIDE_STREET_GROUP_EXTRA_COUNT,
      pathMode: TRON_RUNNER_CROWD_PATH_MODE,
    });
  }

  function startPlayerRoute(index) {
    return tronRunnerCrowdStartPlayerRouteCore({
      index,
      anchor: getDroneAnchor(),
      limits: roadHexBoundaryLimits(),
      roadHalf: getRoadHalf(),
      gridBlock,
      startClusterCount: TRON_RUNNER_CROWD_START_CLUSTER_COUNT,
      roadTopY: getRoadTopY(),
      groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
    });
  }

  function routeForRecord(record, index) {
    return tronRunnerCrowdRouteForRecordCore({
      record,
      index,
      pathMode: TRON_RUNNER_CROWD_PATH_MODE,
      routeEndInset: TRON_RUNNER_CROWD_SIDEWALK_ROUTE_END_INSET,
      reachRadius: TRON_RUNNER_CROWD_REACH_RADIUS,
      laneEdgeInset: TRON_RUNNER_CROWD_SIDEWALK_LANE_EDGE_INSET,
      buildingGuard: TRON_RUNNER_CROWD_BUILDING_GUARD,
      roadTopY: getRoadTopY(),
      groundOffset: TRON_RUNNER_CROWD_GROUND_OFFSET,
      pointInPolygon,
    });
  }

  function buildRoute(index) {
    const records = candidateRecords();
    return tronRunnerCrowdBuildRouteCore({
      index,
      records,
      startClusterCount: TRON_RUNNER_CROWD_START_CLUSTER_COUNT,
      routeRecordSpread: TRON_RUNNER_CROWD_ROUTE_RECORD_SPREAD,
      startPlayerRoute,
      routeStyleForIndex,
      sideStreetPairs,
      detectedSideStreetLanes,
      routeStyleOrdinal,
      sideStreetLaneAssignment: tronRunnerCrowdSideStreetLaneAssignment,
      loopRouteForRecord,
      sideStreetLateralRoute,
      sideStreetRouteForPair,
      routeForRecord,
    });
  }

  function roadFacingStart(route, index, fallback) {
    return tronRunnerCrowdRoadFacingStartCore({
      route,
      index,
      fallback,
      collisionRadius: TRON_RUNNER_CROWD_COLLISION_RADIUS,
      pointInPolygon,
    });
  }

  return {
    buildRoute,
    candidateRecords,
    detectedSideStreetLanes,
    fallbackPlacement,
    roadFacingStart,
    secondaryStreetSummary,
  };
}
