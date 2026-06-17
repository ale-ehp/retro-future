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

export function tronRunnerCrowdPointClearOfRecord({
  record,
  worldX,
  worldZ,
  padding,
  resolveRoundedCollider,
}) {
  if (!record?.collider) return true;
  const point = { x: worldX, z: worldZ };
  return !resolveRoundedCollider(point, record.collider, padding);
}

export function tronRunnerCrowdPadPointSafe({
  record,
  localX,
  localZ,
  polygon,
  padding,
  pointInPolygon,
  resolveRoundedCollider,
}) {
  const pad = record?.basePad;
  if (!pad?.border || !polygon?.length) return false;
  if (!pointInPolygon(localX, localZ, polygon)) return false;
  return tronRunnerCrowdPointClearOfRecord({
    record,
    worldX: pad.border.position.x + localX,
    worldZ: pad.border.position.z + localZ,
    padding,
    resolveRoundedCollider,
  });
}

export function tronRunnerCrowdLoopRouteForRecord({
  record,
  index,
  buildingGuard,
  collisionRadius,
  roadTopY,
  groundOffset,
  frontOnly,
}) {
  const pad = record?.basePad;
  const polygon = pad?.hitPolygon;
  if (!record || !pad?.border || !polygon?.length || !record.collider) return null;
  const roadDir = tronRunnerCrowdRecordRoadDir(record);
  const colliderX = record.collider.x - pad.border.position.x;
  const colliderZ = record.collider.z - pad.border.position.z;
  const guard = buildingGuard + collisionRadius * 1.35;
  const roadX = colliderX + roadDir * (record.collider.hw + guard);
  const outerX = colliderX - roadDir * (record.collider.hw + guard);
  const nearZ = colliderZ - record.collider.hd - guard;
  const farZ = colliderZ + record.collider.hd + guard;

  const y = (pad.innerTopY ?? pad.topY ?? roadTopY) + groundOffset;
  if (frontOnly) {
    const points = [
      { x: pad.border.position.x + roadX, y, z: pad.border.position.z + nearZ },
      { x: pad.border.position.x + roadX, y, z: pad.border.position.z + farZ },
    ];
    if (index % 2) points.reverse();
    return {
      mode: 'single-building-front-patrol',
      record,
      pad,
      polygon: null,
      points,
      label: `front-building-${record.civicNumberValue ?? index + 1}`,
      cluster: 'building-front',
      surface: 'sidewalk',
    };
  }
  const localPoints = [
    { x: roadX, z: nearZ },
    { x: roadX, z: farZ },
    { x: outerX, z: farZ },
    { x: outerX, z: nearZ },
  ];
  const points = localPoints.map((point) => tronRunnerCrowdRoutePoint(record, point.x, point.z, y));
  if (index % 2) points.reverse();
  return {
    mode: 'single-building-loop',
    record,
    pad,
    polygon: null,
    points,
    label: `loop-building-${record.civicNumberValue ?? index + 1}`,
    cluster: 'building-loop',
    surface: 'sidewalk',
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

export function tronRunnerCrowdRoadFacingRoutePoint({
  record,
  offsetZ = 0,
  edgeInsetBase,
  buildingGuard,
  roadTopY,
  groundOffset,
  pointInPolygon,
  resolveRoundedCollider,
}) {
  const pad = record?.basePad;
  const polygon = pad?.hitPolygon;
  if (!record || !pad?.border || !polygon?.length) return null;
  const xs = polygon.map(([x]) => x);
  const zs = polygon.map(([, z]) => z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const roadDir = tronRunnerCrowdRecordRoadDir(record);
  const edgeInset = Math.max(edgeInsetBase + 0.8, 2);
  const localX = roadDir > 0 ? maxX - edgeInset : minX + edgeInset;
  const localZ = THREE.MathUtils.clamp(offsetZ, minZ + edgeInset, maxZ - edgeInset);
  const safe = tronRunnerCrowdPadPointSafe({
    record,
    localX,
    localZ,
    polygon,
    padding: buildingGuard,
    pointInPolygon,
    resolveRoundedCollider,
  });
  if (!safe) return null;
  const y = (pad.innerTopY ?? pad.topY ?? roadTopY) + groundOffset;
  return tronRunnerCrowdRoutePoint(record, localX, localZ, y);
}

export function tronRunnerCrowdSideStreetRouteForPair({
  pair,
  index,
  gridBlock,
  sideBase,
  roadHalf,
  roadTopY,
  groundOffset,
  roadFacingRoutePoint,
}) {
  if (!pair?.left || !pair?.right) return null;
  const offsetStep = Math.min(gridBlock * 0.22, sideBase * 0.16);
  const offsetZ = ((index % 3) - 1) * offsetStep;
  const left = roadFacingRoutePoint(pair.left, offsetZ);
  const right = roadFacingRoutePoint(pair.right, offsetZ);
  if (!left || !right) return null;
  const z = (left.z + right.z) * 0.5;
  const y = roadTopY + groundOffset;
  const points = [
    left,
    { x: -roadHalf * 0.42, y, z },
    { x: roadHalf * 0.42, y, z },
    right,
  ];
  if (index % 2) points.reverse();
  return {
    mode: 'side-street-crossing',
    points,
    label: `side-street-${Math.round(pair.z)}`,
    cluster: 'side-street',
    surface: 'road-fallback',
  };
}

export function tronRunnerCrowdDetectedSideStreetLanes({
  records,
  collisionRadius,
  gridBlock,
  roadHalf,
  streetEdgeWidth,
  sideBuildingWidth,
}) {
  const lanes = [];
  const bySide = new Map();
  for (const record of records) {
    const sideSign = Math.sign(record.sign || record.mesh?.position?.x || 1) || 1;
    let sideRecords = bySide.get(sideSign);
    if (!sideRecords) {
      sideRecords = [];
      bySide.set(sideSign, sideRecords);
    }
    sideRecords.push(record);
  }

  for (const [sideSign, sideRecords] of bySide) {
    const sorted = sideRecords
      .filter((record) => record.mesh?.visible !== false && record.collider)
      .sort((a, b) => Number(a.mesh?.position?.z ?? 0) - Number(b.mesh?.position?.z ?? 0));
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const az = Number(a.mesh?.position?.z ?? 0);
      const bz = Number(b.mesh?.position?.z ?? 0);
      const clearZ = Math.abs(bz - az) - (a.collider.hd + b.collider.hd);
      if (clearZ < collisionRadius * 5) continue;
      const z = (az + bz) * 0.5;
      const inset = Math.max(gridBlock * 0.7, collisionRadius * 2.8);
      const innerX = sideSign * (roadHalf + inset);
      const outerX = sideSign * (roadHalf + streetEdgeWidth + sideBuildingWidth - inset);
      if (Math.abs(outerX - innerX) < gridBlock * 2.2) continue;
      lanes.push({
        sideSign,
        z,
        innerX,
        outerX,
        gapIndex: i + 1,
        sideName: sideSign < 0 ? 'left' : 'right',
      });
    }
  }

  const sortedLanes = lanes.sort((a, b) => {
    if (Math.abs(a.z - b.z) > gridBlock * 0.5) return b.z - a.z;
    return a.sideSign - b.sideSign;
  });
  let streetIndex = 0;
  let lastZ = null;
  for (const lane of sortedLanes) {
    if (lastZ === null || Math.abs(lane.z - lastZ) > gridBlock * 0.5) {
      streetIndex += 1;
      lastZ = lane.z;
    }
    lane.streetIndex = streetIndex;
    lane.streetId = `S${String(streetIndex).padStart(2, '0')}`;
    lane.label = `secondary-${lane.streetId}-${lane.sideName}`;
  }
  return sortedLanes;
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

export function tronRunnerCrowdStartPlayerRoute({
  index,
  anchor,
  limits,
  roadHalf,
  gridBlock,
  startClusterCount,
  roadTopY,
  groundOffset,
}) {
  const laneXs = [-0.28, 0.28, -0.56, 0.56, 0].map((ratio) => (
    THREE.MathUtils.clamp(
      ratio * roadHalf,
      limits.minX + gridBlock * 1.5,
      limits.maxX - gridBlock * 1.5
    )
  ));
  const slot = index % startClusterCount;
  const x = laneXs[slot] ?? 0;
  const zCenter = THREE.MathUtils.clamp(
    anchor.z - gridBlock * 1.5,
    limits.minZ + gridBlock * 4,
    limits.maxZ - gridBlock * 4
  );
  const zOffset = (slot - (startClusterCount - 1) * 0.5) * gridBlock * 0.55;
  const zA = THREE.MathUtils.clamp(zCenter + zOffset + gridBlock * 2.2, limits.minZ + gridBlock * 3, limits.maxZ - gridBlock * 3);
  const zB = THREE.MathUtils.clamp(zCenter + zOffset - gridBlock * 3.6, limits.minZ + gridBlock * 3, limits.maxZ - gridBlock * 3);
  const y = roadTopY + groundOffset;
  return {
    mode: 'player-start-road-loop',
    points: [
      { x, y, z: zA },
      { x, y, z: zB },
    ],
    label: `player-start-${slot + 1}`,
    cluster: 'player-start',
    surface: 'road-fallback',
  };
}

export function tronRunnerCrowdRouteForRecord({
  record,
  index,
  pathMode,
  routeEndInset,
  reachRadius,
  laneEdgeInset,
  buildingGuard,
  roadTopY,
  groundOffset,
  pointInPolygon,
}) {
  const pad = record?.basePad;
  const polygon = pad?.hitPolygon;
  if (!record || !pad?.border || !polygon?.length || !record.collider) return null;
  const xs = polygon.map(([x]) => x);
  const zs = polygon.map(([, z]) => z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  if (maxX - minX < 2 || maxZ - minZ < 2) return null;

  const colliderX = record.collider.x - pad.border.position.x;
  const effectiveRouteEndInset = Math.min(
    routeEndInset,
    Math.max(1, (maxZ - minZ) * 0.34)
  );
  const routeNear = minZ + effectiveRouteEndInset;
  const routeFar = maxZ - effectiveRouteEndInset;
  if (routeFar - routeNear < reachRadius * 3) return null;

  const roadDir = (record.sign || 1) < 0 ? 1 : -1;
  const roadEdgeX = roadDir > 0
    ? maxX - laneEdgeInset
    : minX + laneEdgeInset;
  const guardX = colliderX + roadDir * (record.collider.hw + buildingGuard);
  let routeLaneX = null;
  for (let step = 0; step <= 36; step += 1) {
    const candidateX = roadEdgeX - roadDir * step * 0.35;
    const outsideBuilding = roadDir > 0 ? candidateX >= guardX : candidateX <= guardX;
    if (!outsideBuilding) break;
    if (
      pointInPolygon(candidateX, routeNear, polygon)
      && pointInPolygon(candidateX, routeFar, polygon)
    ) {
      routeLaneX = candidateX;
      break;
    }
  }
  if (routeLaneX === null) return null;

  const padX = pad.border.position.x;
  const padZ = pad.border.position.z;
  const y = (pad.innerTopY ?? pad.topY ?? roadTopY) + groundOffset;
  const points = [
    { x: padX + routeLaneX, y, z: padZ + routeNear },
    { x: padX + routeLaneX, y, z: padZ + routeFar },
  ];
  if (index % 2) points.reverse();
  return {
    mode: pathMode,
    record,
    pad,
    polygon,
    points,
    label: `building-${record.civicNumberValue ?? index + 1}`,
  };
}

export function tronRunnerCrowdBuildRoute({
  index,
  records,
  startClusterCount,
  routeRecordSpread,
  startPlayerRoute,
  routeStyleForIndex,
  sideStreetPairs,
  detectedSideStreetLanes,
  routeStyleOrdinal,
  sideStreetLaneAssignment,
  loopRouteForRecord,
  sideStreetLateralRoute,
  sideStreetRouteForPair,
  routeForRecord,
}) {
  const startCluster = index < startClusterCount;
  if (startCluster) {
    const route = startPlayerRoute(index);
    route.spawnSlot = index;
    route.activeRouteRecords = startClusterCount;
    return route;
  }
  if (!records.length) return null;
  const routeIndex = index - startClusterCount;
  const routeRecords = records;
  const activeCount = Math.min(
    routeRecords.length,
    routeRecordSpread
  );
  const record = routeRecords[routeIndex % Math.max(1, activeCount)];
  const style = routeStyleForIndex(routeIndex);
  const pairs = style === 'side-street-crossing'
    ? sideStreetPairs(routeRecords)
    : [];
  const sideStreetPair = pairs.length
    ? pairs[routeIndex % pairs.length]
    : null;
  const lanes = style === 'side-street-lateral'
    ? detectedSideStreetLanes(routeRecords)
    : [];
  const sideStreetLateralOrdinal = style === 'side-street-lateral'
    ? routeStyleOrdinal(routeIndex, style)
    : 0;
  const sideStreetAssignment = style === 'side-street-lateral'
    ? sideStreetLaneAssignment(lanes, sideStreetLateralOrdinal)
    : null;
  const sideStreetLane = sideStreetAssignment?.lane ?? null;
  const route = (
    style === 'single-building-loop'
      ? loopRouteForRecord(record, routeIndex)
      : style === 'side-street-lateral'
        ? sideStreetLateralRoute(sideStreetLane, routeIndex, sideStreetLateralOrdinal, sideStreetAssignment)
      : style === 'side-street-crossing'
        ? sideStreetRouteForPair(sideStreetPair, routeIndex)
        : null
  ) || routeForRecord(record, routeIndex);
  if (route) {
    route.spawnSlot = Math.floor(routeIndex / Math.max(1, activeCount));
    route.activeRouteRecords = activeCount;
    route.cluster = route.cluster || 'city';
    route.requestedStyle = style;
  }
  return route;
}

export function tronRunnerCrowdRoadFacingStart({
  route,
  index,
  fallback,
  collisionRadius,
  pointInPolygon,
}) {
  if (!route?.points?.length) return { placement: fallback, waypointIndex: 0, mode: 'fallback' };
  if (!route.record) {
    if (route.points.length >= 2 && Number.isFinite(route.startProgress)) {
      const a = route.points[0];
      const b = route.points[1];
      const progress = THREE.MathUtils.clamp(route.startProgress, 0, 1);
      const x = THREE.MathUtils.lerp(a.x, b.x, progress);
      const y = THREE.MathUtils.lerp(a.y, b.y, progress);
      const z = THREE.MathUtils.lerp(a.z, b.z, progress);
      return {
        placement: {
          x,
          y,
          z,
          yaw: Math.atan2(b.x - a.x, b.z - a.z),
        },
        waypointIndex: 1,
        mode: route.mode || 'route-midpoint',
      };
    }
    const startIndex = index % route.points.length;
    const point = route.points[startIndex] || fallback;
    const next = route.points[(startIndex + 1) % route.points.length] || point;
    return {
      placement: {
        x: point.x,
        y: point.y,
        z: point.z,
        yaw: Math.atan2(next.x - point.x, next.z - point.z),
      },
      waypointIndex: (startIndex + 1) % route.points.length,
      mode: route.mode || 'route-corner',
    };
  }
  const sign = Number(route.record?.sign || Math.sign(route.record?.mesh?.position?.x) || 1);
  const xs = route.points.map((point) => point.x);
  const innerX = sign < 0 ? Math.max(...xs) : Math.min(...xs);
  const innerPoints = route.points
    .map((point, pointIndex) => ({ point, pointIndex }))
    .filter(({ point }) => Math.abs(point.x - innerX) < 0.05)
    .sort((a, b) => a.point.z - b.point.z);
  if (innerPoints.length < 2) return { placement: route.points[index % route.points.length] || fallback, waypointIndex: 0, mode: 'route-corner' };

  const low = innerPoints[0];
  const high = innerPoints[innerPoints.length - 1];
  const spawnSlot = Number.isFinite(route.spawnSlot) ? route.spawnSlot : index;
  const stagger = [0.18, 0.38, 0.62, 0.82][spawnSlot % 4];
  const towardHigh = spawnSlot % 2 === 0;
  const z = THREE.MathUtils.lerp(low.point.z, high.point.z, stagger);
  const pad = route.pad;
  let roadSideX = innerX;
  if (pad?.border && route.polygon?.length) {
    for (let step = 0; step <= 36; step += 1) {
      const candidateX = innerX - sign * step;
      const localX = candidateX - pad.border.position.x;
      const localZ = z - pad.border.position.z;
      if (!pointInPolygon(localX, localZ, route.polygon)) break;
      roadSideX = candidateX;
    }
    roadSideX += sign * collisionRadius * 1.8;
  }
  return {
    placement: {
      x: roadSideX,
      y: low.point.y,
      z,
      yaw: towardHigh ? 0 : Math.PI,
    },
    waypointIndex: towardHigh ? high.pointIndex : low.pointIndex,
    mode: 'road-facing-sidewalk',
  };
}
