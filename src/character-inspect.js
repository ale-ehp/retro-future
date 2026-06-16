export function inspectTronRunnerMaterials(model) {
  const opacities = [];
  const emissiveIntensities = [];
  const colors = new Set();
  let transparentMaterialCount = 0;
  model?.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    if (Number.isFinite(object.material.opacity)) opacities.push(object.material.opacity);
    if (Number.isFinite(object.material.emissiveIntensity)) emissiveIntensities.push(object.material.emissiveIntensity);
    if (object.material.transparent) transparentMaterialCount += 1;
    const colorHex = object.material.color?.getHexString?.();
    if (colorHex) colors.add(colorHex);
  });
  return {
    materialMinOpacity: Number((opacities.length ? Math.min(...opacities) : 1).toFixed(3)),
    materialMaxOpacity: Number((opacities.length ? Math.max(...opacities) : 1).toFixed(3)),
    materialMaxEmissiveIntensity: Number((emissiveIntensities.length ? Math.max(...emissiveIntensities) : 0).toFixed(3)),
    transparentMaterialCount,
    materialColors: [...colors],
  };
}

export function countBy(items, keyForItem) {
  return items.reduce((counts, item) => {
    const key = keyForItem(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

export function sumBy(items, valueForItem) {
  return items.reduce((sum, item) => sum + valueForItem(item), 0);
}

export function maxBy(items, valueForItem, fallback = 0) {
  return items.length ? Math.max(...items.map(valueForItem)) : fallback;
}

export function minBy(items, valueForItem, fallback = 0) {
  return items.length ? Math.min(...items.map(valueForItem)) : fallback;
}

export function sideStreetCoverage(streets, members) {
  return streets.map((street) => {
    const assigned = members.filter((member) => member.sideStreetId === street.id);
    return {
      id: street.id,
      z: street.z,
      left: assigned.filter((member) => member.sideStreetSide === 'left').length,
      right: assigned.filter((member) => member.sideStreetSide === 'right').length,
    };
  });
}

export function sideStreetGroupedSegments(coverage) {
  return coverage.flatMap((street) => (
    ['left', 'right']
      .filter((side) => street[side] >= 2)
      .map((side) => ({
        id: street.id,
        side,
        count: street[side],
      }))
  ));
}

export function tronRunnerIdleCharacterInspect({
  idleCharacter,
  idleCharacterGroup,
  crowdBox,
  boundsCenter,
  enabled,
  colorPreset,
  liftPx,
  yLift,
  leanDeg,
}) {
  let bounds = null;
  if (idleCharacter.built && idleCharacterGroup.children.length) {
    crowdBox.setFromObject(idleCharacterGroup);
    if (!crowdBox.isEmpty()) {
      const center = crowdBox.getCenter(boundsCenter);
      bounds = {
        minX: Number(crowdBox.min.x.toFixed(2)),
        minY: Number(crowdBox.min.y.toFixed(2)),
        minZ: Number(crowdBox.min.z.toFixed(2)),
        maxX: Number(crowdBox.max.x.toFixed(2)),
        maxY: Number(crowdBox.max.y.toFixed(2)),
        maxZ: Number(crowdBox.max.z.toFixed(2)),
        centerX: Number(center.x.toFixed(2)),
        centerY: Number(center.y.toFixed(2)),
        centerZ: Number(center.z.toFixed(2)),
      };
    }
  }
  return {
    enabled,
    built: idleCharacter.built,
    visible: Boolean(idleCharacterGroup.visible),
    targetCivic: idleCharacter.targetCivic,
    recordCivic: idleCharacter.recordCivic,
    error: idleCharacter.error,
    pose: idleCharacter.pose,
    poseApplied: idleCharacter.poseApplied,
    poseBoneCount: idleCharacter.poseBoneCount,
    poseBoneNames: idleCharacter.poseBoneNames,
    upperArmPoseApplied: idleCharacter.upperArmPoseApplied,
    colorPreset,
    static: idleCharacter.static,
    locked: idleCharacter.locked,
    anchor: idleCharacter.anchor,
    perimeterClearance: idleCharacter.perimeterClearance,
    cornerFaceInset: idleCharacter.cornerFaceInset,
    roundedColliderResolved: idleCharacter.roundedColliderResolved,
    roundedCorrection: Number((idleCharacter.roundedCorrection ?? 0).toFixed(3)),
    roundedRadius: Number((idleCharacter.roundedRadius ?? 0).toFixed(3)),
    cornerFlatInset: Number((idleCharacter.cornerFlatInset ?? 0).toFixed(3)),
    frontWallClearance: Number((idleCharacter.frontWallClearance ?? 0).toFixed(3)),
    wallContactEps: Number((idleCharacter.wallContactEps ?? 0).toFixed(3)),
    roadDir: idleCharacter.roadDir,
    placementSource: idleCharacter.placementSource,
    corner: idleCharacter.corner,
    startSideSign: idleCharacter.startSideSign,
    surface: idleCharacter.surface,
    liftPx,
    yLift: Number(yLift.toFixed(3)),
    x: Number((idleCharacter.x ?? 0).toFixed(2)),
    y: Number((idleCharacter.y ?? 0).toFixed(2)),
    z: Number((idleCharacter.z ?? 0).toFixed(2)),
    yaw: Number((idleCharacter.yaw ?? 0).toFixed(3)),
    leanDeg,
    materialCount: idleCharacter.materials?.length ?? 0,
    groupChildren: idleCharacterGroup.children.length,
    bounds,
  };
}
