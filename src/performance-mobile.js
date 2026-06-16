export function mobilePerformanceProfileState(query) {
  const mediaQueryMatches = Boolean(query.matches);
  const touchPoints = Number.isFinite(navigator.maxTouchPoints) ? navigator.maxTouchPoints : 0;
  const touchActive = touchPoints > 0;
  const widthActive = window.innerWidth <= 760;
  const reasons = [];
  if (mediaQueryMatches) reasons.push('media-query');
  if (touchActive) reasons.push('touch');
  if (widthActive) reasons.push('width');
  return {
    active: reasons.length > 0,
    mediaQueryMatches,
    touchPoints,
    touchActive,
    widthActive,
    reasons,
  };
}

export function mobilePerformanceProfileActive(query) {
  const touchPoints = Number.isFinite(navigator.maxTouchPoints) ? navigator.maxTouchPoints : 0;
  return Boolean(query.matches || touchPoints > 0 || window.innerWidth <= 760);
}

export function effectiveRenderScaleForDevice(active, baseScale, cap) {
  return active ? Math.min(baseScale, cap) : baseScale;
}

export function effectivePixelRatioForDevice(active, basePixelRatio, cap) {
  return active ? Math.min(basePixelRatio, cap) : basePixelRatio;
}

export function effectiveBloomScaleForDevice(active, baseScale, cap) {
  return active ? Math.min(baseScale, cap) : baseScale;
}
