import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CROWD_BUBBLE_MAX_OPACITY,
  CROWD_BUBBLE_PANEL_FILL_STYLE,
  GREETER_BUBBLE_MAX_OPACITY,
  GREETER_BUBBLE_PANEL_FILL_STYLE,
  GREETER_BUBBLE_WORLD_HEIGHT,
  GREETER_BUBBLE_LOGO_AI_GLITCH_SLICE_OPACITY,
  GREETER_BUBBLE_LOGO_AI_IDLE_OFFSET_PX,
  GREETER_BUBBLE_LOGO_AI_MAIN_MIN_OPACITY,
  GREETER_BUBBLE_LOGO_AI_ANIMATION_ENABLED,
  GREETER_BUBBLE_LOGO_AV_FILL_ALPHA,
  GREETER_BUBBLE_LOGO_EFFECT_ID,
  GREETER_BUBBLE_LOGO_STUDIO_FILL_ALPHA,
  GREETER_BUBBLE_LOGO_WORDMARK_FONT_WEIGHT,
  GREETER_BUBBLE_LOGO_WORDMARK_OUTLINE_STYLE,
  GREETER_BUBBLE_LOGO_WORDMARK_OUTLINE_WIDTH_RATIO,
  GREETER_BUBBLE_LOGO_WORDMARK_FILL_STYLE,
  greeterBubbleLogoAnimationState,
  isGreeterBubbleLogoLine,
} from './speech-bubbles.js';

test('greeter bubble treats avstudio.ai as a branded logo line', () => {
  assert.equal(isGreeterBubbleLogoLine('avstudio.ai'), true);
  assert.equal(isGreeterBubbleLogoLine(' avstudio.ai '), true);
  assert.equal(isGreeterBubbleLogoLine('Benvenuto in'), false);
});

test('greeter bubble uses animated tron orange logo treatment', () => {
  assert.equal(GREETER_BUBBLE_LOGO_EFFECT_ID, 'tron-orange');
  assert.equal(GREETER_BUBBLE_LOGO_AI_ANIMATION_ENABLED, true);
  assert.ok(GREETER_BUBBLE_LOGO_AV_FILL_ALPHA >= 0.76);
  assert.equal(GREETER_BUBBLE_LOGO_STUDIO_FILL_ALPHA, 1);
  assert.equal(GREETER_BUBBLE_LOGO_WORDMARK_FILL_STYLE, 'rgba(255,255,255,1)');
  assert.equal(GREETER_BUBBLE_LOGO_WORDMARK_FONT_WEIGHT, 400);
  assert.equal(GREETER_BUBBLE_LOGO_WORDMARK_OUTLINE_STYLE, 'rgba(0,16,20,0.82)');
  assert.ok(GREETER_BUBBLE_LOGO_WORDMARK_OUTLINE_WIDTH_RATIO >= 0.046);
  assert.equal(GREETER_BUBBLE_LOGO_AI_IDLE_OFFSET_PX, 1.3);
  assert.equal(GREETER_BUBBLE_LOGO_AI_GLITCH_SLICE_OPACITY, 1);
  assert.equal(GREETER_BUBBLE_LOGO_AI_MAIN_MIN_OPACITY, 1);
  assert.notDeepEqual(
    greeterBubbleLogoAnimationState(0),
    greeterBubbleLogoAnimationState(600)
  );
  assert.equal(greeterBubbleLogoAnimationState(0).aiMainOpacity, 1);
  assert.equal(greeterBubbleLogoAnimationState(600).aiMainOpacity, 1);
});

test('speech bubble signs use the shared 30 percent opacity reduction', () => {
  assert.equal(GREETER_BUBBLE_MAX_OPACITY, 0.7);
  assert.equal(CROWD_BUBBLE_MAX_OPACITY, 0.7);
});

test('speech bubble signs are 50 percent larger in world space', () => {
  assert.equal(GREETER_BUBBLE_WORLD_HEIGHT, 2.25);
});

test('greeter bubble background is 30 percent darker and more opaque than crowd bubbles', () => {
  assert.equal(CROWD_BUBBLE_PANEL_FILL_STYLE, 'rgba(0,16,20,0.78)');
  assert.equal(GREETER_BUBBLE_PANEL_FILL_STYLE, 'rgba(0,8,10,0.90)');
});
