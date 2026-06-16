import * as THREE from 'three';

export function tronRunnerCrowdFallbackPlacement({
  index,
  limits,
  dynamicRoadCenter,
  dynamicRoadLength,
  gridBlock,
  roadHalf,
  roadTopY,
  groundOffset,
}) {
  const row = index % 5;
  const side = index < 5 ? -1 : 1;
  const minZ = dynamicRoadCenter - dynamicRoadLength * 0.5 + gridBlock * 8;
  const maxZ = dynamicRoadCenter + dynamicRoadLength * 0.5 - gridBlock * 8;
  const z = THREE.MathUtils.clamp(
    THREE.MathUtils.lerp(minZ, maxZ, (row + 1) / 6),
    limits.minZ + gridBlock * 3,
    limits.maxZ - gridBlock * 3
  );
  const x = THREE.MathUtils.clamp(
    side * Math.max(gridBlock * 2, roadHalf * 0.34),
    limits.minX + gridBlock * 2,
    limits.maxX - gridBlock * 2
  );
  return {
    x,
    y: roadTopY + groundOffset,
    z,
    yaw: side < 0 ? 0 : Math.PI,
    surface: 'road-fallback',
  };
}

export function tronRunnerCrowdCandidateRecords({
  records,
  excludedCivics,
  gridBlock,
}) {
  return records
    .filter((record) =>
      record.mesh?.visible !== false &&
      record.basePad?.hitPolygon?.length &&
      record.collider &&
      !excludedCivics.has(record.civicNumberValue)
    )
    .sort((a, b) => {
      const az = Number(a.mesh?.position?.z ?? 0);
      const bz = Number(b.mesh?.position?.z ?? 0);
      if (Math.abs(az - bz) > gridBlock * 0.5) return bz - az;
      return (a.sign || 0) - (b.sign || 0);
    });
}

export function tronRunnerCrowdRecordRoadDir(record) {
  const x = record?.collider?.x ?? record?.mesh?.position?.x ?? record?.sign ?? 1;
  return x < 0 ? 1 : -1;
}

export function tronRunnerCrowdRoutePoint(record, localX, localZ, y) {
  const pad = record.basePad;
  return {
    x: pad.border.position.x + localX,
    y,
    z: pad.border.position.z + localZ,
  };
}

export function tronRunnerCrowdSideStreetPairs(records, gridBlock) {
  const rows = new Map();
  for (const record of records) {
    const z = Number(record.mesh?.position?.z ?? 0);
    const key = String(Math.round(z / Math.max(1, gridBlock)));
    let row = rows.get(key);
    if (!row) {
      row = { z, left: null, right: null };
      rows.set(key, row);
    }
    if ((record.sign || 0) < 0) row.left = record;
    else row.right = record;
  }
  return [...rows.values()]
    .filter((row) => row.left && row.right)
    .sort((a, b) => b.z - a.z);
}

export function tronRunnerCrowdSecondaryStreetSummary(lanes) {
  const streets = new Map();
  for (const lane of lanes) {
    let street = streets.get(lane.streetId);
    if (!street) {
      street = {
        id: lane.streetId,
        z: Number(lane.z.toFixed(2)),
        lanes: [],
      };
      streets.set(lane.streetId, street);
    }
    street.lanes.push({
      side: lane.sideName,
      label: lane.label,
      innerX: Number(lane.innerX.toFixed(2)),
      outerX: Number(lane.outerX.toFixed(2)),
    });
  }
  return {
    streetCount: streets.size,
    laneCount: lanes.length,
    streets: [...streets.values()],
  };
}

export function tronRunnerCrowdRouteStyleOrdinal({
  routeIndex,
  style,
  routeStyleForIndex,
}) {
  let ordinal = 0;
  for (let i = 0; i <= routeIndex; i += 1) {
    if (routeStyleForIndex(i) !== style) continue;
    if (i === routeIndex) return ordinal;
    ordinal += 1;
  }
  return ordinal;
}

export function tronRunnerCrowdSideStreetLaneAssignment(lanes, ordinal = 0) {
  if (!lanes.length) return null;
  if (ordinal < lanes.length) {
    return {
      lane: lanes[ordinal],
      laneOrdinal: ordinal,
      groupIndex: 0,
      groupCount: 1,
    };
  }
  const extraOrdinal = ordinal - lanes.length;
  const targetIndexes = [
    Math.min(lanes.length - 1, Math.max(0, Math.floor(lanes.length * 0.25))),
    Math.min(lanes.length - 1, Math.max(0, Math.floor(lanes.length * 0.75))),
  ].filter((value, index, list) => list.indexOf(value) === index);
  const targetIndex = targetIndexes[Math.floor(extraOrdinal / 2) % targetIndexes.length] ?? 0;
  return {
    lane: lanes[targetIndex],
    laneOrdinal: targetIndex,
    groupIndex: (extraOrdinal % 2) + 1,
    groupCount: 3,
  };
}

export function tronRunnerCrowdSideStreetLateralRoute({
  lane,
  ordinal = 0,
  assignment = null,
  y,
  gridBlock,
}) {
  if (!lane) return null;
  const groupIndex = Number(assignment?.groupIndex ?? 0);
  const groupCount = Number(assignment?.groupCount ?? 1);
  const laneOrdinal = Number(assignment?.laneOrdinal ?? ordinal);
  const groupOffset = groupCount > 1
    ? (groupIndex - (groupCount - 1) * 0.5) * Math.min(gridBlock * 0.18, 2.4)
    : 0;
  const laneJitter = groupOffset || (((laneOrdinal % 3) - 1) * Math.min(gridBlock * 0.12, 1.6));
  const z = lane.z + laneJitter;
  const points = [
    { x: lane.innerX, y, z },
    { x: lane.outerX, y, z },
  ];
  if (laneOrdinal % 2) points.reverse();
  const startProgress = groupCount > 1
    ? THREE.MathUtils.clamp(0.5 + (groupIndex - (groupCount - 1) * 0.5) * 0.08, 0.34, 0.66)
    : 0.5;
  return {
    mode: 'side-street-lateral',
    points,
    label: lane.label,
    cluster: 'side-street-lateral',
    surface: 'road-fallback',
    sideStreetId: lane.streetId,
    sideStreetSide: lane.sideName,
    sideStreetLateralOrdinal: ordinal,
    sideStreetGroupIndex: groupIndex,
    sideStreetGroupCount: groupCount,
    startProgress,
  };
}

export function tronRunnerCrowdRouteStyleForIndex({
  routeIndex,
  laneCount,
  sideStreetGroupExtraCount,
  pathMode,
}) {
  const sideStreetRouteCount = laneCount + sideStreetGroupExtraCount;
  if (routeIndex < sideStreetRouteCount) return 'side-street-lateral';
  const fallbackIndex = routeIndex - sideStreetRouteCount;
  const fallbackCycle = [
    'single-building-loop',
    pathMode,
    'single-building-loop',
  ];
  return fallbackCycle[fallbackIndex % fallbackCycle.length];
}
