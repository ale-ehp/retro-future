// La geometria del fronte del rivelo: dove passa, cosa copre, dove rallenta.
//
// Perche' sta in un file suo (2026-09-21): city-reveal-wireframe.js era 1.235 righe e
// teneva insieme tre mestieri. Qui c'e' quello che si calcola senza guardare la scena:
// funzioni pure, nessuno stato di modulo toccato. Misurato prima di staccarle.
//
// Il fronte e' inclinato a 45 gradi, quindi "quanto sono avanti" non e' la sola z: e'
// z meno y. Per questo ogni oggetto porta nel suo userData il minimo e il massimo di quel
// valore, calcolati una volta alla costruzione: nel frame si confrontano due numeri invece
// di riattraversare la geometria.
//
// Il rallentamento sul palazzo principale e' una riparametrizzazione del progresso: si
// pesa il tratto che attraversa il palazzo e si spalma il tempo di conseguenza. Perche'
// meta' velocita' e non un altro valore non e' scritto in nessun commit, e non lo invento
// qui. Le dipendenze arrivano come argomenti, non come stato letto di nascosto: cosi' la
// funzione si prova con tre numeri e un elenco finto.
import * as THREE from 'three';
import { MAIN_BUILDING_BASE } from './boulevard-constants.js';

export const CITY_REVEAL_MAIN_BUILDING_SLOW_SPEED = 0.5;

export function cityRevealSweepValueAt(z, y = 0) {
  const safeZ = Number.isFinite(z) ? z : 0;
  const safeY = Number.isFinite(y) ? y : 0;
  return safeZ - safeY;
}

export function cityRevealBoxSweepBounds(centerZ, halfDepth, centerY = 0, halfHeight = 0) {
  const safeZ = Number.isFinite(centerZ) ? centerZ : 0;
  const safeY = Number.isFinite(centerY) ? centerY : 0;
  const hd = Math.abs(Number.isFinite(halfDepth) ? halfDepth : 0);
  const hh = Math.abs(Number.isFinite(halfHeight) ? halfHeight : 0);
  const values = [
    cityRevealSweepValueAt(safeZ - hd, safeY - hh),
    cityRevealSweepValueAt(safeZ + hd, safeY - hh),
    cityRevealSweepValueAt(safeZ - hd, safeY + hh),
    cityRevealSweepValueAt(safeZ + hd, safeY + hh),
  ];
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function setCityRevealObjectBounds(object, minZ, maxZ, minSweep = null, maxSweep = null) {
  if (!object) return object;
  const safeMin = Number.isFinite(minZ) ? minZ : 0;
  const safeMax = Number.isFinite(maxZ) ? maxZ : safeMin;
  object.userData.cityRevealMinZ = Math.min(safeMin, safeMax);
  object.userData.cityRevealMaxZ = Math.max(safeMin, safeMax);
  object.userData.cityRevealZ = (object.userData.cityRevealMinZ + object.userData.cityRevealMaxZ) * 0.5;
  const fallbackY = Number.isFinite(object.position?.y) ? object.position.y : 0;
  const fallbackMinSweep = cityRevealSweepValueAt(object.userData.cityRevealMinZ, fallbackY);
  const fallbackMaxSweep = cityRevealSweepValueAt(object.userData.cityRevealMaxZ, fallbackY);
  const safeMinSweep = Number.isFinite(minSweep) ? minSweep : Math.min(fallbackMinSweep, fallbackMaxSweep);
  const safeMaxSweep = Number.isFinite(maxSweep) ? maxSweep : Math.max(fallbackMinSweep, fallbackMaxSweep);
  object.userData.cityRevealMinSweep = Math.min(safeMinSweep, safeMaxSweep);
  object.userData.cityRevealMaxSweep = Math.max(safeMinSweep, safeMaxSweep);
  object.userData.cityRevealSweep = (object.userData.cityRevealMinSweep + object.userData.cityRevealMaxSweep) * 0.5;
  return object;
}

export function setCityRevealObjectBoundsFromPoints(object, points) {
  let minZ = Infinity;
  let maxZ = -Infinity;
  let minSweep = Infinity;
  let maxSweep = -Infinity;
  for (const point of points) {
    minZ = Math.min(minZ, point.z);
    maxZ = Math.max(maxZ, point.z);
    const sweep = cityRevealSweepValueAt(point.z, point.y);
    minSweep = Math.min(minSweep, sweep);
    maxSweep = Math.max(maxSweep, sweep);
  }
  return setCityRevealObjectBounds(object, minZ, maxZ, minSweep, maxSweep);
}

export function setCityRevealObjectBoxBounds(object, height, depth, y, z) {
  const halfDepth = Math.abs(Number.isFinite(depth) ? depth : 0) * 0.5;
  const sweepBounds = cityRevealBoxSweepBounds(z, halfDepth, y, Math.abs(Number.isFinite(height) ? height : 0) * 0.5);
  return setCityRevealObjectBounds(object, z - halfDepth, z + halfDepth, sweepBounds.min, sweepBounds.max);
}

export function setCityRevealObjectBoundsFromBox(object, box) {
  if (!box || box.isEmpty?.()) return setCityRevealObjectBounds(object, 0, 0);
  const centerZ = (box.min.z + box.max.z) * 0.5;
  const centerY = (box.min.y + box.max.y) * 0.5;
  const sweepBounds = cityRevealBoxSweepBounds(centerZ, (box.max.z - box.min.z) * 0.5, centerY, (box.max.y - box.min.y) * 0.5);
  return setCityRevealObjectBounds(object, box.min.z, box.max.z, sweepBounds.min, sweepBounds.max);
}

export function translateCityRevealObjectBounds(object, zOffset, yOffset = 0) {
  if (!object || !Number.isFinite(zOffset)) return object;
  const minZ = object.userData.cityRevealMinZ;
  const maxZ = object.userData.cityRevealMaxZ;
  const minSweep = object.userData.cityRevealMinSweep;
  const maxSweep = object.userData.cityRevealMaxSweep;
  if (!Number.isFinite(minZ) || !Number.isFinite(maxZ)) return object;
  const sweepOffset = cityRevealSweepValueAt(zOffset, yOffset);
  return setCityRevealObjectBounds(
    object,
    minZ + zOffset,
    maxZ + zOffset,
    Number.isFinite(minSweep) ? minSweep + sweepOffset : null,
    Number.isFinite(maxSweep) ? maxSweep + sweepOffset : null
  );
}

export function cityRevealMainBuildingSlowZone(getMainBuildingRecords) {
  const record = getMainBuildingRecords()[0];
  const collider = record?.collider;
  if (!record?.mesh || !collider) return null;
  const boxDepth = Math.abs(Number.isFinite(collider.hd) ? collider.hd * 2 : record.baseD || MAIN_BUILDING_BASE);
  const boxHeight = Math.abs(Number.isFinite(collider.h) ? collider.h : 230);
  const centerY = (Number.isFinite(collider.y) ? collider.y : record.mesh.position.y || 0) + boxHeight * 0.5;
  const centerZ = Number.isFinite(collider.z) ? collider.z : record.mesh.position.z;
  if (![boxDepth, boxHeight, centerY, centerZ].every(Number.isFinite) || boxDepth <= 0 || boxHeight <= 0) return null;
  const bounds = cityRevealBoxSweepBounds(centerZ, boxDepth * 0.5, centerY, boxHeight * 0.5);
  return {
    low: bounds.min,
    high: bounds.max,
    centerZ,
    centerY,
    depth: boxDepth,
    height: boxHeight,
  };
}

export function cityRevealWarpProgressForMainBuilding(progress, { sweepStartZ, sweepEndZ, getMainBuildingRecords }) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  const total = sweepStartZ - sweepEndZ;
  const zone = cityRevealMainBuildingSlowZone(getMainBuildingRecords);
  const speed = THREE.MathUtils.clamp(CITY_REVEAL_MAIN_BUILDING_SLOW_SPEED, 0.05, 1);
  if (!zone || speed >= 0.999 || !Number.isFinite(total) || total <= 0) {
    return { progress: t, active: false, zone: null };
  }

  const zoneStartDistance = THREE.MathUtils.clamp(sweepStartZ - zone.high, 0, total);
  const zoneEndDistance = THREE.MathUtils.clamp(sweepStartZ - zone.low, 0, total);
  const zoneDistance = zoneEndDistance - zoneStartDistance;
  if (!Number.isFinite(zoneDistance) || zoneDistance <= 0.001) {
    return { progress: t, active: false, zone: null };
  }

  const weight = 1 / speed;
  const weightedTotal = total + zoneDistance * (weight - 1);
  const weightedDistance = t * weightedTotal;
  let distance;
  if (weightedDistance <= zoneStartDistance) {
    distance = weightedDistance;
  } else if (weightedDistance <= zoneStartDistance + zoneDistance * weight) {
    distance = zoneStartDistance + (weightedDistance - zoneStartDistance) / weight;
  } else {
    distance = zoneStartDistance + zoneDistance + (weightedDistance - zoneStartDistance - zoneDistance * weight);
  }
  distance = THREE.MathUtils.clamp(distance, 0, total);
  const active = distance >= zoneStartDistance && distance <= zoneEndDistance;
  return {
    progress: distance / total,
    active,
    zone: {
      ...zone,
      startProgress: zoneStartDistance / total,
      endProgress: zoneEndDistance / total,
      speed,
      weight,
    },
  };
}
