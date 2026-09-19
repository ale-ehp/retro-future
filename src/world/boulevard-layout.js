// La mappa del boulevard: quanto e' larga la strada, quanto sono grandi e distanti i
// palazzi, dove cadono i bordi, gli incroci e le strade laterali.
//
// Spostato qui da main.js senza cambiare la logica (tappa 5, 2026-09-19). I valori
// puri (larghezze di base, distanze massime) stavano gia' in boulevard-constants.js:
// qui c'e' quello che i cursori del pannello muovono e la geometria che ne deriva.
//
// I 28 numeri regolabili stanno nell'oggetto mutabile `boulevard`: fuori di qui
// `streetEdgeWidth` si scrive `boulevard.streetEdgeWidth`. Ci sono tutti perche'
// tutti e 28 vengono letti o scritti da fuori (applyLiveControls li scrive, la
// scena e l'ispezione li leggono). Quello che serve solo qui dentro
// (buildingStreetEdgeRecords, mainBuildingStreetEdgeRecord, STREET_EDGE_BLOCK_MAX_DEPTH)
// resta un `let` o un `const` normale.
//
// Gli oggetti di scena su cui il layout agisce (i due marciapiedi e le loro
// piastrelle, le strade laterali, i bordi longitudinali, i controlli) arrivano da
// initBoulevardLayout(), chiamata in main.js appena dopo che esistono tutti.
import * as THREE from 'three';
import { roadBaseY } from '../config/costanti.js';
import {
  SIDE_BUILDING_BASE,
  SIDE_BUILDING_SPACING,
  SIDE_BUILDING_MIN_CLEARANCE,
  MAIN_BUILDING_BASE,
  MAIN_BUILDING_Z,
  MAIN_ROAD_WIDTH,
  MAIN_ROAD_LENGTH,
  MAIN_ROAD_Z,
  SIDE_ROAD_WIDTH,
  GRID_BLOCK,
  STREET_EDGE_WIDTH_DEFAULT,
  DEFAULT_BASE_PAD_Y,
  DEFAULT_BASE_PAD_THICKNESS,
  MAX_BUILDING_AXIS_SCALE,
} from './boulevard-constants.js';
import { setGroundShape, setGroundSegment, setGroundLineLoop } from './ground-geometry.js';
import {
  updateZTileBand,
  compactHexTileBatchesForTiles,
  hexTileRadius,
  setHexTileLayoutPosition,
} from './hex-tiles.js';

/** @type {any} */ let streetEdgeLeft = null;
/** @type {any} */ let streetEdgeRight = null;
/** @type {any[]} */ let streetEdgeLeftTiles = [];
/** @type {any[]} */ let streetEdgeRightTiles = [];
/** @type {any[]} */ let sideRoadRecords = [];
/** @type {any[]} */ let longitudinalRoadEdgeRecords = [];
/** @type {any} */ let controlEls = null;
let CROSS_STREET_MAX_LENGTH = 0;

/** Gli oggetti di scena su cui agisce il layout, iniettati da main.js. */
export function initBoulevardLayout(deps) {
  ({
    streetEdgeLeft, streetEdgeRight, streetEdgeLeftTiles, streetEdgeRightTiles,
    sideRoadRecords, longitudinalRoadEdgeRecords, controlEls, CROSS_STREET_MAX_LENGTH,
  } = deps);
}

// ---------- Exact boulevard map constants (pure values -> world/boulevard-constants.js) ----------
// The road band is seeded for the CURRENT control values; ensureHexRoadTileCoverage
// (called from updateMainRoadLength) tops it up when sliders grow the requirement,
// so the old slider-extreme constants (DYNAMIC_ROAD_MAX_LENGTH & co.) are gone.
export const boulevard = {
  streetEdgeWidth: 0,
  sideBuildingWidthScale: 2,
  sideBuildingDepthScale: 1,
  sideBuildingSpacingScale: 1,
  mainBuildingWidthScale: 2,
  mainBuildingDepthScale: 1,
  mainBuildingZ: MAIN_BUILDING_Z,
  mainBuildingY: 0,
  mainBuildingSaturation: 1.2,
  boulevardWidthScale: 1,
  sideBuildingBasePadScale: 1.12,
  sideBuildingBasePadXScale: 1,
  sideBuildingBasePadY: DEFAULT_BASE_PAD_Y,
  sideBuildingBasePadThickness: DEFAULT_BASE_PAD_THICKNESS,
  sideBuildingBasePadCut: 10,
  sideBuildingBasePadRadius: 1.2,
  mainBuildingBasePadScale: 1.12,
  mainBuildingBasePadXScale: 1,
  mainBuildingBasePadZScale: 1,
  mainBuildingBasePadY: DEFAULT_BASE_PAD_Y,
  mainBuildingBasePadThickness: DEFAULT_BASE_PAD_THICKNESS,
  mainBuildingBasePadCut: 12,
  mainBuildingBasePadRadius: 1.5,
  crossRoadWidth: SIDE_ROAD_WIDTH,
  crossStreetEdgeWidth: 0,
  dynamicRoadLength: MAIN_ROAD_LENGTH,
  dynamicRoadCenter: MAIN_ROAD_Z,
  roadSideHexExtraRows: 3,
};


export function sideBuildingVisualWidth() {
  return SIDE_BUILDING_BASE * boulevard.sideBuildingWidthScale;
}

function sideBuildingZSpacing() {
  return SIDE_BUILDING_SPACING * boulevard.sideBuildingSpacingScale;
}

export function safeSideBuildingSpacingScale(requestedScale, depthScale) {
  const input = controlEls?.sideBuildingSpacingScale;
  const min = Number(input?.min ?? 1);
  const max = Number(input?.max ?? 8);
  const requested = Number.isFinite(requestedScale) ? requestedScale : min;
  const depth = Number.isFinite(depthScale) ? Math.max(0.01, depthScale) : 1;
  const noOverlapScale = (SIDE_BUILDING_BASE * depth + SIDE_BUILDING_MIN_CLEARANCE) / SIDE_BUILDING_SPACING;
  return THREE.MathUtils.clamp(Math.max(requested, noOverlapScale), min, max);
}

function sideBuildingVisualDepth() {
  return SIDE_BUILDING_BASE * boulevard.sideBuildingDepthScale;
}

export function boulevardRoadWidth(scale = boulevard.boulevardWidthScale) {
  return MAIN_ROAD_WIDTH * scale;
}

export function roadHalf(scale = boulevard.boulevardWidthScale) {
  return boulevardRoadWidth(scale) / 2;
}

function sideBuildingX(sign) {
  return sign * (roadHalf() + boulevard.streetEdgeWidth + sideBuildingVisualWidth() / 2);
}

function crossStreetVisualLength(width = boulevard.streetEdgeWidth, sideWidth = sideBuildingVisualWidth(), roadWidthScale = boulevard.boulevardWidthScale) {
  return 2 * (roadHalf(roadWidthScale) + width + sideWidth);
}

function crossStreetSideSegmentLength(width = boulevard.streetEdgeWidth, sideWidth = sideBuildingVisualWidth()) {
  return Math.max(0.01, width + sideWidth);
}

function roadSideHexExtraWidth(rows = boulevard.roadSideHexExtraRows) {
  return Math.max(0, rows) * GRID_BLOCK;
}

function sideBuildingBasePadWidthForRoad(nextSideWidthScale = boulevard.sideBuildingWidthScale, nextSideDepthScale = boulevard.sideBuildingDepthScale, padScale = boulevard.sideBuildingBasePadScale, padXScale = boulevard.sideBuildingBasePadXScale) {
  const footprintWidth = SIDE_BUILDING_BASE * nextSideWidthScale;
  const footprintDepth = SIDE_BUILDING_BASE * nextSideDepthScale;
  return Math.max(footprintWidth, footprintDepth) * padScale * padXScale;
}

function mainBuildingBasePadWidthForRoad(nextMainWidthScale = boulevard.mainBuildingWidthScale, nextMainDepthScale = boulevard.mainBuildingDepthScale, padScale = boulevard.mainBuildingBasePadScale, padXScale = boulevard.mainBuildingBasePadXScale) {
  const footprintWidth = MAIN_BUILDING_BASE * nextMainWidthScale;
  const footprintDepth = MAIN_BUILDING_BASE * nextMainDepthScale;
  return Math.max(footprintWidth, footprintDepth) * padScale * padXScale;
}

export function roadSurfaceWidthForBuildings(
  nextSideWidthScale = boulevard.sideBuildingWidthScale,
  nextMainWidthScale = boulevard.mainBuildingWidthScale,
  width = boulevard.streetEdgeWidth,
  roadWidthScale = boulevard.boulevardWidthScale,
  nextSideDepthScale = boulevard.sideBuildingDepthScale,
  nextSidePadScale = boulevard.sideBuildingBasePadScale,
  nextSidePadXScale = boulevard.sideBuildingBasePadXScale,
  nextMainDepthScale = boulevard.mainBuildingDepthScale,
  nextMainPadScale = boulevard.mainBuildingBasePadScale,
  nextMainPadXScale = boulevard.mainBuildingBasePadXScale,
  nextSideHexExtraRows = boulevard.roadSideHexExtraRows
) {
  const baseRoadWidth = boulevardRoadWidth(roadWidthScale);
  const sideFootprintWidth = SIDE_BUILDING_BASE * nextSideWidthScale;
  const sidePadWidth = sideBuildingBasePadWidthForRoad(nextSideWidthScale, nextSideDepthScale, nextSidePadScale, nextSidePadXScale);
  const mainFootprintWidth = MAIN_BUILDING_BASE * nextMainWidthScale;
  const mainPadWidth = mainBuildingBasePadWidthForRoad(nextMainWidthScale, nextMainDepthScale, nextMainPadScale, nextMainPadXScale);
  const extraWidth = roadSideHexExtraWidth(nextSideHexExtraRows);
  const sideSpan = baseRoadWidth + 2 * (width + sideFootprintWidth / 2 + sidePadWidth / 2 + extraWidth);
  const mainSpan = Math.max(mainFootprintWidth, mainPadWidth) + extraWidth * 2;
  return Math.max(baseRoadWidth, sideSpan, mainSpan);
}

function cornerBevelLength(width) {
  return Math.max(0.01, Math.min(width, boulevard.crossStreetEdgeWidth));
}

function cornerPadPoints(sideSign, zSign, z, width) {
  const half = roadHalf();
  const base = [
    [half, boulevard.crossRoadWidth / 2],
    [half + width, boulevard.crossRoadWidth / 2],
    [half + width, boulevard.crossRoadWidth / 2 + boulevard.crossStreetEdgeWidth],
    [half, boulevard.crossRoadWidth / 2 + boulevard.crossStreetEdgeWidth],
  ];
  return base.map(([x, dz]) => [sideSign * x, z + zSign * dz]);
}

function cornerDiagonalPoints(sideSign, zSign, z, width) {
  const half = roadHalf();
  const miter = cornerBevelLength(width);
  return [
    [sideSign * half, z + zSign * (boulevard.crossRoadWidth / 2)],
    [sideSign * (half + miter), z + zSign * (boulevard.crossRoadWidth / 2 + miter)],
  ];
}

function cornerRoadPerimeterSegments(sideSign, zSign, z, width) {
  const half = roadHalf();
  const roadEdge = boulevard.crossRoadWidth / 2;
  const streetEdgeEdge = boulevard.crossRoadWidth / 2 + boulevard.crossStreetEdgeWidth;
  const localSegments = [
    [[half, roadEdge], [half + width, roadEdge]],
    [[half, roadEdge], [half, streetEdgeEdge]],
  ];
  return localSegments.map(([a, b]) => [
    [sideSign * a[0], z + zSign * a[1]],
    [sideSign * b[0], z + zSign * b[1]],
  ]);
}

function cornerCutPoints(sideSign, zSign, z, width) {
  const half = roadHalf();
  const cutX = Math.min(Math.max(width * 0.62, 6), 16);
  const cutZ = Math.min(Math.max(boulevard.crossStreetEdgeWidth * 0.72, 6), 14);
  const base = [
    [half, boulevard.crossRoadWidth / 2],
    [half + cutX, boulevard.crossRoadWidth / 2],
    [half, boulevard.crossRoadWidth / 2 + cutZ],
  ];
  return base.map(([x, dz]) => [sideSign * x, z + zSign * dz]);
}

function mainStreetEdgeRoadMaskPoints(sideSign, z, width) {
  const half = roadHalf();
  const base = [
    [half, -boulevard.crossRoadWidth / 2],
    [half + width, -boulevard.crossRoadWidth / 2],
    [half + width, boulevard.crossRoadWidth / 2],
    [half, boulevard.crossRoadWidth / 2],
  ];
  return base.map(([x, dz]) => [sideSign * x, z + dz]);
}

function pointInPolygon2D(x, z, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], zi = polygon[i][1];
    const xj = polygon[j][0], zj = polygon[j][1];
    const crosses = (zi > z) !== (zj > z);
    if (crosses) {
      const xAtZ = ((xj - xi) * (z - zi)) / ((zj - zi) || 1e-6) + xi;
      if (x < xAtZ) inside = !inside;
    }
  }
  return inside;
}

function applyTilePolygonClip(tiles, polygon, isVisible = true) {
  for (const tile of tiles) {
    tile.visible = tile.visible && isVisible && pointInPolygon2D(tile.userData.x, tile.userData.z, polygon);
  }
}

function intersectionTracePoints(z) {
  const rx = roadHalf() * 0.62;
  const rz = Math.max(12, boulevard.crossRoadWidth * 0.48);
  const cut = Math.min(10, rz * 0.45);
  return [
    [-rx, z - rz + cut],
    [-rx + cut, z - rz],
    [rx - cut, z - rz],
    [rx, z - rz + cut],
    [rx, z + rz - cut],
    [rx - cut, z + rz],
    [-rx + cut, z + rz],
    [-rx, z + rz - cut],
  ];
}

const buildingStreetEdgeRecords = [];
let mainBuildingStreetEdgeRecord = null;
const STREET_EDGE_BLOCK_MAX_DEPTH = SIDE_BUILDING_BASE * MAX_BUILDING_AXIS_SCALE;

function streetEdgeBlockVisualDepth(nextSideDepthScale = boulevard.sideBuildingDepthScale, nextSideSpacingScale = boulevard.sideBuildingSpacingScale) {
  const targetDepth = SIDE_BUILDING_BASE * nextSideDepthScale;
  const streetGap = boulevard.crossRoadWidth + boulevard.crossStreetEdgeWidth * 2;
  const maxWithoutOverlap = SIDE_BUILDING_SPACING * nextSideSpacingScale - streetGap - GRID_BLOCK * 0.5;
  return Math.max(GRID_BLOCK, Math.min(targetDepth, maxWithoutOverlap));
}

function streetEdgeBlockPoints(sign, z, width, depth) {
  const half = roadHalf();
  const innerX = sign * half;
  const outerX = sign * (half + width);
  const z0 = z - depth / 2;
  const z1 = z + depth / 2;
  return [
    [innerX, z0],
    [outerX, z0],
    [outerX, z1],
    [innerX, z1],
  ];
}

function mainBuildingStreetEdgePoints(z = boulevard.mainBuildingZ, width = boulevard.streetEdgeWidth, nextMainWidthScale = boulevard.mainBuildingWidthScale, nextMainDepthScale = boulevard.mainBuildingDepthScale) {
  const buildingWidth = MAIN_BUILDING_BASE * nextMainWidthScale;
  const buildingDepth = MAIN_BUILDING_BASE * nextMainDepthScale;
  const frontZ = z + buildingDepth / 2;
  const outerZ = frontZ + Math.max(0.01, width);
  const halfW = buildingWidth / 2;
  return [
    [-halfW, frontZ],
    [halfW, frontZ],
    [halfW, outerZ],
    [-halfW, outerZ],
  ];
}

function updateStreetEdgeTileBand(tiles, sign, width) {
  const centerX = sign * (roadHalf() + width / 2);
  updateZTileBand(tiles, centerX, boulevard.dynamicRoadCenter, width, boulevard.dynamicRoadLength);
}

export function updateStreetEdgeLayout(width) {
  boulevard.streetEdgeWidth = width;
  const visible = width > 0.1 && STREET_EDGE_WIDTH_DEFAULT > 0;
  streetEdgeLeft.visible = visible;
  streetEdgeRight.visible = visible;
  streetEdgeLeft.scale.x = visible ? width / STREET_EDGE_WIDTH_DEFAULT : 0.001;
  streetEdgeRight.scale.x = visible ? width / STREET_EDGE_WIDTH_DEFAULT : 0.001;
  streetEdgeLeft.position.x = -(roadHalf() + width / 2);
  streetEdgeRight.position.x = roadHalf() + width / 2;
  updateStreetEdgeTileBand(streetEdgeLeftTiles, -1, width);
  updateStreetEdgeTileBand(streetEdgeRightTiles, 1, width);
}

export function updateBuildingStreetEdgeBlocks(nextSideSpacingScale, width, nextSideDepthScale) {
  const depth = streetEdgeBlockVisualDepth(nextSideDepthScale, nextSideSpacingScale);
  for (const record of buildingStreetEdgeRecords) {
    const z = record.zFactor * SIDE_BUILDING_SPACING * nextSideSpacingScale;
    const blockPoints = streetEdgeBlockPoints(record.sign, z, width, depth);

    setGroundShape(record.mesh, blockPoints);
    record.mesh.position.y = 0.14;
    record.mesh.visible = width > 0.1 && depth > 0.1;
    setGroundLineLoop(record.perimeter, blockPoints, 0.54);
    record.perimeter.visible = record.mesh.visible;
  }
}

export function updateMainBuildingStreetEdgeBlock(nextMainWidthScale, nextMainDepthScale, nextMainZ, width) {
  if (!mainBuildingStreetEdgeRecord) return;
  const points = mainBuildingStreetEdgePoints(nextMainZ, width, nextMainWidthScale, nextMainDepthScale);
  setGroundShape(mainBuildingStreetEdgeRecord.mesh, points);
  mainBuildingStreetEdgeRecord.mesh.position.y = 0.14;
  mainBuildingStreetEdgeRecord.mesh.visible = width > 0.1;
  setGroundLineLoop(mainBuildingStreetEdgeRecord.perimeter, points, 0.54);
  mainBuildingStreetEdgeRecord.perimeter.visible = mainBuildingStreetEdgeRecord.mesh.visible;
}

function getLongitudinalRoadEdgeIntervals(nextSideSpacingScale) {
  const minZ = boulevard.dynamicRoadCenter - boulevard.dynamicRoadLength / 2;
  const maxZ = boulevard.dynamicRoadCenter + boulevard.dynamicRoadLength / 2;
  const halfGap = boulevard.crossRoadWidth / 2 + boulevard.crossStreetEdgeWidth + 1.5;
  const gaps = sideRoadRecords
    .map((record) => {
      const z = record.zFactor * SIDE_BUILDING_SPACING * nextSideSpacingScale;
      return {
        min: Math.max(minZ, z - halfGap),
        max: Math.min(maxZ, z + halfGap),
      };
    })
    .filter((gap) => gap.max > minZ && gap.min < maxZ)
    .sort((a, b) => a.min - b.min);

  const intervals = [];
  let cursor = minZ;
  for (const gap of gaps) {
    if (gap.min > cursor + 1) intervals.push([cursor, gap.min]);
    cursor = Math.max(cursor, gap.max);
  }
  if (cursor < maxZ - 1) intervals.push([cursor, maxZ]);
  return intervals;
}

export function updateLongitudinalRoadEdges(nextSideSpacingScale) {
  for (const record of longitudinalRoadEdgeRecords) {
    record.mesh.visible = false;
  }
}

function updateIntersectionNode(record, z, blockLength, streetEdgeW) {
  const showCornerStreetEdges = false;
  for (const item of record.roadMasks) {
    setGroundShape(item.mesh, mainStreetEdgeRoadMaskPoints(item.sideSign, z, streetEdgeW));
    item.mesh.visible = false;
  }
  for (const item of record.cornerPads) {
    setGroundShape(item.mesh, cornerPadPoints(item.sideSign, item.zSign, z, blockLength));
    item.mesh.visible = showCornerStreetEdges;
  }
  for (const item of record.cornerCuts) {
    setGroundShape(item.mesh, cornerCutPoints(item.sideSign, item.zSign, z, blockLength));
    item.mesh.visible = false;
  }
  for (const item of record.diagonalLines) {
    const diagPts = cornerDiagonalPoints(item.sideSign, item.zSign, z, blockLength);
    setGroundSegment(item.mesh, diagPts[0], diagPts[1], 0.20, 0.055);
    item.mesh.visible = showCornerStreetEdges;
  }
  let perimeterIndex = 0;
  [-1, 1].forEach((sideSign) => {
    [-1, 1].forEach((zSign) => {
      const segments = cornerRoadPerimeterSegments(sideSign, zSign, z, blockLength);
      segments.forEach(([a, b]) => {
        const item = record.perimeterLines[perimeterIndex++];
        if (!item) return;
        setGroundSegment(item.mesh, a, b, 0.14, 0.045);
        item.mesh.visible = showCornerStreetEdges;
      });
    });
  });

  const tracePts = intersectionTracePoints(z);
  record.traceLines.forEach((line, index) => {
    setGroundSegment(line, tracePts[index], tracePts[(index + 1) % tracePts.length], 0.12, 0.035);
  });
}

function applyMainStreetEdgeIntersectionClips(nextSideSpacingScale) {
  const cutHalfZ = boulevard.crossRoadWidth / 2 + boulevard.crossStreetEdgeWidth + hexTileRadius * 0.22;
  for (const tiles of [streetEdgeLeftTiles, streetEdgeRightTiles]) {
    for (const tile of tiles) {
      if (!tile.visible) continue;
      for (const record of sideRoadRecords) {
        const z = record.zFactor * SIDE_BUILDING_SPACING * nextSideSpacingScale;
        if (Math.abs(tile.userData.z - z) <= cutHalfZ) {
          tile.visible = false;
          break;
        }
      }
    }
  }
}

export function updateSideRoadLayout(nextSideSpacingScale, width) {
  const roadLength = crossStreetVisualLength(width, SIDE_BUILDING_BASE * boulevard.sideBuildingWidthScale);
  const sideSegmentLength = crossStreetSideSegmentLength(width, SIDE_BUILDING_BASE * boulevard.sideBuildingWidthScale);
  for (const record of sideRoadRecords) {
    const z = record.zFactor * SIDE_BUILDING_SPACING * nextSideSpacingScale;
    record.road.position.set(0, roadBaseY + 0.02, z);
    record.road.scale.set(roadLength / CROSS_STREET_MAX_LENGTH, boulevard.crossRoadWidth, 1);
    for (const tile of record.roadTiles) {
      tile.userData.centerX = 0;
      tile.userData.centerZ = z;
      tile.userData.halfW = boulevard.crossRoadWidth / 2;
      tile.userData.halfL = roadLength / 2;
      setHexTileLayoutPosition(tile, false);
    }
    compactHexTileBatchesForTiles(record.roadTiles);

    for (const streetEdge of record.crossStreetEdges) {
      const x = streetEdge.xSign * (roadHalf() + sideSegmentLength / 2);
      streetEdge.mesh.position.set(x, 0.11, z + streetEdge.zSign * (boulevard.crossRoadWidth / 2 + boulevard.crossStreetEdgeWidth / 2));
      streetEdge.mesh.scale.set(sideSegmentLength / CROSS_STREET_MAX_LENGTH, Math.max(0.001, boulevard.crossStreetEdgeWidth), 1);
      streetEdge.mesh.visible = false;
    }
    for (const band of record.streetEdgeTiles) {
      const x = band.xSign * (roadHalf() + sideSegmentLength / 2);
      updateZTileBand(
        band.tiles,
        x,
        z + band.zSign * (boulevard.crossRoadWidth / 2 + boulevard.crossStreetEdgeWidth / 2),
        boulevard.crossStreetEdgeWidth,
        sideSegmentLength
      );
      for (const tile of band.tiles) tile.visible = false;
      compactHexTileBatchesForTiles(band.tiles);
    }

    for (const line of record.roadEdgeLines) {
      const offset = line.edge === 'road' ? boulevard.crossRoadWidth / 2 : boulevard.crossRoadWidth / 2 + boulevard.crossStreetEdgeWidth;
      const visibleLength = Math.max(0.01, sideSegmentLength);
      line.mesh.position.set(line.xSign * (roadHalf() + visibleLength / 2), line.edge === 'road' ? 0.37 : 0.35, z + line.zSign * offset);
      line.mesh.scale.x = visibleLength / CROSS_STREET_MAX_LENGTH;
      line.mesh.visible = line.edge === 'road' || boulevard.crossStreetEdgeWidth > 0.1;
    }

    updateIntersectionNode(record.intersection, z, width, width);
  }
  applyMainStreetEdgeIntersectionClips(nextSideSpacingScale);
}

