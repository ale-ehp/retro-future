import * as THREE from 'three';

export function resolveTronRunnerRoundedCollider(point, collider, padding) {
  const dx = point.x - collider.x;
  const dz = point.z - collider.z;
  const sx = dx >= 0 ? 1 : -1;
  const sz = dz >= 0 ? 1 : -1;
  const ax = Math.abs(dx);
  const az = Math.abs(dz);
  const hx = collider.hw + padding;
  const hz = collider.hd + padding;
  const radius = THREE.MathUtils.clamp((collider.chamfer || 0) + padding, 0, Math.min(hx, hz) * 0.98);
  if (radius <= 0.001) {
    if (ax >= hx || az >= hz) return false;
    const pushX = hx - ax;
    const pushZ = hz - az;
    if (pushX < pushZ) point.x = collider.x + sx * hx;
    else point.z = collider.z + sz * hz;
    return true;
  }

  const innerX = hx - radius;
  const innerZ = hz - radius;
  const qx = ax - innerX;
  const qz = az - innerZ;
  if (qx > 0 && qz > 0) {
    const dist = Math.hypot(qx, qz);
    if (dist >= radius) return false;
    const nx = dist > 1e-5 ? qx / dist : Math.SQRT1_2;
    const nz = dist > 1e-5 ? qz / dist : Math.SQRT1_2;
    point.x = collider.x + sx * (innerX + nx * radius);
    point.z = collider.z + sz * (innerZ + nz * radius);
    return true;
  }

  if (ax >= hx || az >= hz) return false;
  const pushX = hx - ax;
  const pushZ = hz - az;
  if (pushX < pushZ) point.x = collider.x + sx * hx;
  else point.z = collider.z + sz * hz;
  return true;
}

export function tronRunnerCrowdPointInsideRoute({
  member,
  x,
  z,
  pointInPolygon,
}) {
  const pad = member.route?.pad;
  const polygon = member.route?.polygon;
  if (!pad?.border || !polygon?.length) return true;
  const localX = x - pad.border.position.x;
  const localZ = z - pad.border.position.z;
  return pointInPolygon(localX, localZ, polygon);
}

export function tronRunnerCrowdColliderLabel(record) {
  if (Number.isFinite(record?.civicNumberValue)) return `building-${record.civicNumberValue}`;
  return record?.collider?.role || 'building';
}

export function tronRunnerCrowdBuildingCollisionDiagnostic({
  member,
  records,
  padding,
  resolveRoundedCollider,
  colliderLabel,
}) {
  let colliding = false;
  let correction = 0;
  let label = '';
  for (const record of records) {
    const point = {
      x: member.group.position.x,
      z: member.group.position.z,
    };
    const beforeX = point.x;
    const beforeZ = point.z;
    if (!resolveRoundedCollider(point, record.collider, padding)) continue;
    const nextCorrection = Math.hypot(point.x - beforeX, point.z - beforeZ);
    colliding = true;
    if (nextCorrection >= correction) {
      correction = nextCorrection;
      label = colliderLabel(record);
    }
  }
  return {
    colliding,
    correction,
    label,
  };
}

export function resolveTronRunnerCrowdCollision(member, point, collisionsEnabled, getColliderRecords, buildingGuard, pointInsideRoute) {
  if (!collisionsEnabled) return false;
  let collided = false;
  for (const record of getColliderRecords()) {
    const beforeX = point.x;
    const beforeZ = point.z;
    if (resolveTronRunnerRoundedCollider(point, record.collider, buildingGuard)) {
      collided = true;
      if (!pointInsideRoute(member, point.x, point.z)) {
        point.x = beforeX;
        point.z = beforeZ;
      }
    }
  }
  if (!pointInsideRoute(member, point.x, point.z)) {
    collided = true;
    const current = member.group.position;
    point.x = current.x;
    point.z = current.z;
  }
  return collided;
}
