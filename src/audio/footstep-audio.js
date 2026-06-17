import * as THREE from 'three';

export function pickFootstepSample(footstepBuffers, footstepVariantCursor, surfaceKind, side) {
  const surface = footstepBuffers[surfaceKind]?.length ? surfaceKind : 'road';
  const candidates = (footstepBuffers[surface] || []).filter((sample) => sample.side === side);
  if (!candidates.length) return null;
  const cursor = footstepVariantCursor[surface][side] % candidates.length;
  footstepVariantCursor[surface][side] += 1;
  return { surface, sample: candidates[cursor] };
}

export function setFootstepAudioParam(param, value, time) {
  if (param?.setValueAtTime) param.setValueAtTime(value, time);
}

export function setFootstepPannerPosition(panner, origin, now) {
  if (!panner || !origin) return;
  if ('positionX' in panner) {
    setFootstepAudioParam(panner.positionX, origin.x, now);
    setFootstepAudioParam(panner.positionY, origin.y, now);
    setFootstepAudioParam(panner.positionZ, origin.z, now);
  } else {
    panner.setPosition?.(origin.x, origin.y, origin.z);
  }
}

export function footstepInverseDistanceGain(distance, refDistance, maxDistance, rolloffFactor) {
  if (!Number.isFinite(distance)) return 1;
  if (distance <= refDistance) return 1;
  if (distance >= maxDistance) return 0;
  return THREE.MathUtils.clamp(
    refDistance / (refDistance + rolloffFactor * (distance - refDistance)),
    0,
    1
  );
}
