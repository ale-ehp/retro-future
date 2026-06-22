export const RETRO_FUTURE_SIGN_OPACITY_MULTIPLIER = 0.7;
export const RETRO_FUTURE_SIGN_SIZE_MULTIPLIER = 1.5;
export const RETRO_FUTURE_SIGN_TEXT_BRIGHTNESS_MULTIPLIER = 1.25;

export function retroFutureSignOpacity(opacity = 1) {
  const value = Number.isFinite(opacity) ? opacity : 1;
  return Math.max(0, Math.min(1, value * RETRO_FUTURE_SIGN_OPACITY_MULTIPLIER));
}

export function retroFutureSignScale(size = 1) {
  const value = Number.isFinite(size) ? size : 1;
  return value * RETRO_FUTURE_SIGN_SIZE_MULTIPLIER;
}

export function retroFutureSignTextOpacity(opacity = 1) {
  const value = Number.isFinite(opacity) ? opacity : 1;
  return retroFutureSignOpacity(value * RETRO_FUTURE_SIGN_TEXT_BRIGHTNESS_MULTIPLIER);
}
