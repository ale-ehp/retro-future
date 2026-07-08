import * as THREE from 'three';
import {
  GRID_BLOCK,
  SIDE_BUILDING_BASE,
  SIDE_BUILDING_SPACING,
} from './boulevard-constants.js';

export const BRIDGE_PAIR_5_6_INDEX = 2;
export const BRIDGE_PAIR_5_6_Y_OFFSET = 66;

export function createBridgeRuntime(deps) {
  const {
    overlayGroup,
    PAL,
    bridgeMaterials,
    getRoadHalf,
    getSideBuildingWidthScale,
    getStreetEdgeWidth,
    makeChamferedBox,
    createWetAsphaltFacadeMaterial,
    addBuildingEdges,
    readBridgeNumber,
    readBridgeVisible,
    updateBridgeControlOutputs,
  } = deps;

  const records = [];
  // Bridge frames are tuned in lockstep with the side buildings (same
  // updateBuildingMaterials call writes every entry), so one material serves all.
  let sharedLinkMaterial = null;
  let bridgeXOffset = 0;
  let bridgeZOffset = 0;
  let bridgeYOffset = 0;
  let bridgeSpanScale = 1;
  let bridgeHeightScale = 1;
  let bridgeDepthScale = 1;

  function spanLength(nextSideWidthScale = getSideBuildingWidthScale(), width = getStreetEdgeWidth()) {
    return 2 * (getRoadHalf() + width + SIDE_BUILDING_BASE * nextSideWidthScale / 2);
  }

  function updateLinks(nextSideWidthScale, nextSideSpacingScale, nextStreetEdgeWidth, nextXOffset, nextZOffset, nextYOffset, nextSpanScale, nextHeightScale, nextDepthScale) {
    bridgeXOffset = nextXOffset;
    bridgeZOffset = nextZOffset;
    bridgeYOffset = nextYOffset;
    bridgeSpanScale = nextSpanScale;
    bridgeHeightScale = nextHeightScale;
    bridgeDepthScale = nextDepthScale;
    const span = spanLength(nextSideWidthScale, nextStreetEdgeWidth);
    for (const record of records) {
      const visible = readBridgeVisible(record);
      record.visible = visible;
      record.mesh.position.set(
        bridgeXOffset + readBridgeNumber(record, 'xOffset'),
        record.baseY + bridgeYOffset + readBridgeNumber(record, 'yOffset'),
        record.zFactor * SIDE_BUILDING_SPACING * nextSideSpacingScale + bridgeZOffset + readBridgeNumber(record, 'zOffset')
      );
      record.mesh.scale.set(
        (span / record.baseWidth) * bridgeSpanScale * readBridgeNumber(record, 'spanScale'),
        bridgeHeightScale * readBridgeNumber(record, 'heightScale'),
        bridgeDepthScale * readBridgeNumber(record, 'depthScale')
      );
      record.mesh.visible = visible;
    }
    updateBridgeControlOutputs();
  }

  function addPortalFrame(z) {
    const heroPortal = Math.abs(z - GRID_BLOCK * 4) < 0.1;
    const linkWidth = spanLength();
    const linkBaseY = GRID_BLOCK * (heroPortal ? 7.4 : 6.2);
    const linkHeight = GRID_BLOCK * (heroPortal ? 1.18 : 0.92);
    const depth = GRID_BLOCK * (heroPortal ? 2.15 : 1.64);
    if (!sharedLinkMaterial) sharedLinkMaterial = createWetAsphaltFacadeMaterial(PAL.buildingSkin, 1.3);
    const linkMat = sharedLinkMaterial;

    const chamfer = 1.6;
    const link = new THREE.Mesh(makeChamferedBox(linkWidth, linkHeight, depth, chamfer), linkMat);
    link.position.set(0, linkBaseY, z);
    overlayGroup.add(link);
    bridgeMaterials.push(linkMat);
    const record = {
      index: records.length,
      mesh: link,
      visible: true,
      baseZ: z,
      zFactor: z / SIDE_BUILDING_SPACING,
      baseY: linkBaseY,
      baseWidth: linkWidth,
      baseHeight: linkHeight,
      baseDepth: depth,
    };
    records.push(record);
    addBuildingEdges(overlayGroup, linkWidth, linkHeight, depth, 0, linkBaseY, z, PAL.tealLight, chamfer * 0.6, 'bridge', { bridgeRecord: record });
  }

  function buildLinks(zs = [-144, -48, 48, 144]) {
    zs.forEach((z) => addPortalFrame(z));
  }

  function inspect() {
    return records.map((record) => ({
      index: record.index,
      baseZ: record.baseZ,
      visible: Boolean(record.mesh.visible),
      yOffset: readBridgeNumber(record, 'yOffset'),
      x: record.mesh.position.x,
      y: record.mesh.position.y,
      z: record.mesh.position.z,
    }));
  }

  return {
    records,
    spanLength,
    buildLinks,
    updateLinks,
    inspect,
    getXOffset: () => bridgeXOffset,
    getZOffset: () => bridgeZOffset,
    getYOffset: () => bridgeYOffset,
    getSpanScale: () => bridgeSpanScale,
    getHeightScale: () => bridgeHeightScale,
    getDepthScale: () => bridgeDepthScale,
  };
}
