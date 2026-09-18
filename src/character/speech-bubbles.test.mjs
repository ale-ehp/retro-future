import assert from 'node:assert/strict';
import test from 'node:test';
import { retroFutureSignOpacity } from '../sign-opacity.js';

import {
  CROWD_BUBBLE_MAX_OPACITY,
  CROWD_BUBBLE_PANEL_FILL_STYLE,
  CROWD_BUBBLE_TEXT_FILL_STYLE,
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
  CHARACTER_BUBBLE_RENDER_ORDER,
  characterBubbleBackgroundOpacityInspect,
  characterBubblePanelFillStyle,
  greeterBubbleLogoAnimationState,
  isGreeterBubbleLogoLine,
  resetCharacterBubbleBackgroundOpacity,
  setCharacterBubbleBackgroundOpacity,
} from './speech-bubbles.js';

test('greeter bubble treats avstudio.ai as a branded logo line', () => {
  assert.equal(isGreeterBubbleLogoLine('avstudio.ai'), true);
  assert.equal(isGreeterBubbleLogoLine(' avstudio.ai '), true);
  assert.equal(isGreeterBubbleLogoLine('Benvenuto in'), false);
});

test('greeter bubble uses animated tron orange logo treatment', () => {
  assert.equal(GREETER_BUBBLE_LOGO_EFFECT_ID, 'tron-orange');
  assert.equal(GREETER_BUBBLE_LOGO_AI_ANIMATION_ENABLED, true);
  assert.equal(GREETER_BUBBLE_LOGO_AV_FILL_ALPHA, 1);
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

test('i cartelli dei personaggi restano fuori dallo sconto del 30 percento', () => {
  // Scelta del 2026-09-18: opachi. Il moltiplicatore di sign-opacity.js vale ancora per i
  // cartelloni della citta', le porte e l'avviso di confine, non per chi parla.
  assert.equal(GREETER_BUBBLE_MAX_OPACITY, 1);
  assert.equal(CROWD_BUBBLE_MAX_OPACITY, 1);
  assert.equal(retroFutureSignOpacity(1), 0.7);
});

test('speech bubble signs are 50 percent larger in world space', () => {
  assert.equal(GREETER_BUBBLE_WORLD_HEIGHT, 2.25);
});

test('character bubble backgrounds are visibly dark and opaque', () => {
  resetCharacterBubbleBackgroundOpacity();
  assert.equal(CROWD_BUBBLE_PANEL_FILL_STYLE, 'rgba(0,3,4,1)');
  assert.equal(GREETER_BUBBLE_PANEL_FILL_STYLE, 'rgba(0,3,4,1)');
  assert.equal(characterBubblePanelFillStyle('crowd'), CROWD_BUBBLE_PANEL_FILL_STYLE);
  assert.equal(characterBubblePanelFillStyle('greeter'), GREETER_BUBBLE_PANEL_FILL_STYLE);
});

test('speech bubble text is 25 percent brighter', () => {
  assert.equal(CROWD_BUBBLE_TEXT_FILL_STYLE, 'rgba(255,255,255,1)');
});

test('character speech bubbles render above terminal role boards', () => {
  assert.ok(CHARACTER_BUBBLE_RENDER_ORDER > 35);
});

test('character bubble background opacity command spans transparent to opaque', () => {
  assert.equal(setCharacterBubbleBackgroundOpacity(0).opacity, 0);
  assert.equal(characterBubblePanelFillStyle('crowd'), 'rgba(0,3,4,0)');
  assert.equal(characterBubblePanelFillStyle('greeter'), 'rgba(0,3,4,0)');

  assert.equal(setCharacterBubbleBackgroundOpacity(0.5).opacity, 0.5);
  assert.equal(characterBubblePanelFillStyle('crowd'), 'rgba(0,3,4,0.5)');
  assert.equal(characterBubblePanelFillStyle('greeter'), 'rgba(0,3,4,0.5)');

  assert.equal(setCharacterBubbleBackgroundOpacity(1).opacity, 1);
  assert.equal(characterBubblePanelFillStyle('crowd'), 'rgba(0,3,4,1)');
  assert.equal(characterBubblePanelFillStyle('greeter'), 'rgba(0,3,4,1)');
  assert.equal(characterBubbleBackgroundOpacityInspect().command, 'setCartelliSfondoOpacity(0..1)');
  resetCharacterBubbleBackgroundOpacity();
});
