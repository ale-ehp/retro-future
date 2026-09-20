function finiteOr(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function structuralPadBounds(record) {
  const polygon = record?.basePad?.hitPolygon;
  if (!Array.isArray(polygon) || polygon.length === 0) return null;
  const points = polygon.filter((point) => (
    Array.isArray(point)
    && Number.isFinite(point[0])
    && Number.isFinite(point[1])
  ));
  if (points.length === 0) return null;
  const xs = points.map((point) => point[0]);
  const zs = points.map((point) => point[1]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  };
}

/**
 * Le opzioni hanno campi senza default (playerZ): tsc deduceva il tipo dai soli default e
 * li dava per inesistenti (2026-09-20). Tipi, non bug.
 * @param record
 * @param {{ bottomY?: number, boardHeight?: number, playerZ?: number, innerSlide?: number }} [opzioni]
 */
export function resolveBoardPerimeterPose(record, {
  bottomY = 0,
  boardHeight = 0,
  playerZ,
  innerSlide = 0,
} = {}) {
  const meshX = finiteOr(record?.mesh?.position?.x);
  const meshZ = finiteOr(record?.mesh?.position?.z);
  const pose = {
    x: meshX,
    y: finiteOr(bottomY) + finiteOr(boardHeight) * 0.5,
    z: meshZ,
    yaw: 0,
    perimeterSide: 'record-center',
    perimeterSynced: false,
  };
  const bounds = structuralPadBounds(record);
  const border = record?.basePad?.border?.position;
  if (!bounds || !border || !Number.isFinite(border.x) || !Number.isFinite(border.z)) return pose;

  const playerSideSign = finiteOr(playerZ, meshZ) >= meshZ ? 1 : -1;
  const centerX = (bounds.minX + bounds.maxX) * 0.5;
  const roadSideX = meshX < 0 ? bounds.maxX : bounds.minX;
  const slide = finiteOr(innerSlide);
  pose.x = border.x + centerX + (roadSideX - centerX) * slide;
  pose.z = border.z + (playerSideSign > 0 ? bounds.maxZ : bounds.minZ) + playerSideSign * 0.35;
  pose.yaw = playerSideSign > 0 ? 0 : Math.PI;
  pose.perimeterSide = 'start-player';
  pose.perimeterSynced = true;
  return pose;
}

export function boardPerimeterPoseSignature(record, options = {}) {
  const bounds = structuralPadBounds(record);
  return [
    finiteOr(options.bottomY).toFixed(3),
    finiteOr(options.boardHeight).toFixed(3),
    finiteOr(options.playerZ, record?.mesh?.position?.z).toFixed(3),
    finiteOr(options.innerSlide).toFixed(4),
    finiteOr(record?.mesh?.position?.x).toFixed(3),
    finiteOr(record?.mesh?.position?.z).toFixed(3),
    finiteOr(record?.basePad?.border?.position?.x).toFixed(3),
    finiteOr(record?.basePad?.border?.position?.z).toFixed(3),
    finiteOr(bounds?.minX).toFixed(3),
    finiteOr(bounds?.maxX).toFixed(3),
    finiteOr(bounds?.minZ).toFixed(3),
    finiteOr(bounds?.maxZ).toFixed(3),
  ].join('|');
}
