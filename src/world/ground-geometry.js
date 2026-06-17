import * as THREE from 'three';

// ---------- Ground geometry helpers ----------
// Pure builders/mutators for the flat street-edge "ground" meshes: convex-ordered polygon shapes,
// box segments, and line-loop perimeters. They operate only on the passed meshes/points (no scene or
// shared-state coupling), so they are plain imports. The scene-attaching wrapper (addGroundLineLoop)
// and the LED-material registry stay in main.js. orderedGroundPolygon is private (used only here).

function orderedGroundPolygon(points) {
  const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length;
  const cz = points.reduce((sum, p) => sum + p[1], 0) / points.length;
  return points.slice().sort((a, b) =>
    Math.atan2(a[1] - cz, a[0] - cx) - Math.atan2(b[1] - cz, b[0] - cx)
  );
}

export function groundShapeGeometry(points) {
  const ordered = orderedGroundPolygon(points);
  const shape = new THREE.Shape();
  shape.moveTo(ordered[0][0], -ordered[0][1]);
  for (let i = 1; i < ordered.length; i++) shape.lineTo(ordered[i][0], -ordered[i][1]);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function setGroundShape(mesh, points) {
  mesh.geometry.dispose();
  mesh.geometry = groundShapeGeometry(points);
}

export function setGroundSegment(mesh, p1, p2, thickness = 0.22, height = 0.08) {
  const v1 = new THREE.Vector3(p1[0], 0, p1[1]);
  const v2 = new THREE.Vector3(p2[0], 0, p2[1]);
  const len = v1.distanceTo(v2);
  mesh.geometry.dispose();
  mesh.geometry = new THREE.BoxGeometry(thickness, height, Math.max(0.01, len));
  mesh.position.set((p1[0] + p2[0]) / 2, mesh.position.y, (p1[1] + p2[1]) / 2);
  const dir = new THREE.Vector3().subVectors(v2, v1).normalize();
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
}

export function setGroundLineLoop(line, points, y = 0.54) {
  const vertices = [];
  for (const [x, z] of points) vertices.push(x, y, z);
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry();
  line.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  line.computeLineDistances?.();
}
