import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const controlsSource = readFileSync(new URL('./controls.js', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('../main.js', import.meta.url), 'utf8');

test('character settings expose speech bubble background opacity control', () => {
  assert.match(
    html,
    /<section class="control-panel" data-panel="character">[\s\S]*id="character-bubble-bg-opacity"/
  );
  assert.match(
    html,
    /id="character-bubble-bg-opacity"[^>]*max="3"[^>]*value="2\.88"/
  );
  assert.match(html, /id="character-bubble-bg-opacity-val"/);
  assert.match(
    controlsSource,
    /characterBubbleBgOpacity:\s*document\.getElementById\('character-bubble-bg-opacity'\)/
  );
  assert.match(
    controlsSource,
    /characterBubbleBgOpacityVal:\s*document\.getElementById\('character-bubble-bg-opacity-val'\)/
  );
  assert.match(controlsSource, /'character-bubble-bg-opacity'/);
  assert.match(mainSource, /CHARACTER_BUBBLE_BG_OPACITY_RANGE_MULTIPLIER\s*=\s*3/);
  assert.match(
    mainSource,
    /setCharacterBubbleBackgroundOpacity\(\s*characterBubbleBgOpacity\s*\/\s*CHARACTER_BUBBLE_BG_OPACITY_RANGE_MULTIPLIER\s*\)/
  );
});
