// ?forceMobile=1 activates the mobile performance profile on any device — used
// by the per-subsystem benchmark harness to exercise the real mobile fill path
// (fixed 2x pixel ratio, balanced sky, lite floor, fx.* toggles) on desktop /
// headless. Read once; a plain load (no param) is unaffected.
const FORCE_MOBILE_PROFILE = (() => {
  try {
    return new URLSearchParams(window.location.search).get('forceMobile') === '1';
  } catch {
    return false;
  }
})();

export function mobilePerformanceProfileForced() {
  return FORCE_MOBILE_PROFILE;
}

export function mobilePerformanceProfileState(query) {
  const mediaQueryMatches = Boolean(query.matches);
  const touchPoints = Number.isFinite(navigator.maxTouchPoints) ? navigator.maxTouchPoints : 0;
  const touchActive = touchPoints > 0;
  const widthActive = window.innerWidth <= 760;
  const forced = FORCE_MOBILE_PROFILE;
  const reasons = [];
  if (mediaQueryMatches) reasons.push('media-query');
  if (touchActive) reasons.push('touch');
  if (widthActive) reasons.push('width');
  if (forced) reasons.push('force');
  return {
    active: reasons.length > 0,
    mediaQueryMatches,
    touchPoints,
    touchActive,
    widthActive,
    forced,
    reasons,
  };
}

export function mobilePerformanceProfileActive(query) {
  if (FORCE_MOBILE_PROFILE) return true;
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
