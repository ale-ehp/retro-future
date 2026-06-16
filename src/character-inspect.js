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
