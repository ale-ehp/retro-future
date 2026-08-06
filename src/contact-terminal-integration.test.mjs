import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
const htmlSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('../retro-future.css', import.meta.url), 'utf8');
const smokeSource = readFileSync(new URL('../../../../scripts/smoke-retro-future.mjs', import.meta.url), 'utf8');

test('main composes contact terminal with camera and input ownership', () => {
  assert.match(mainSource, /from '\.\/world\/contact-terminal\.js'/);
  assert.match(mainSource, /initContactTerminal\(\{/);
  assert.match(mainSource, /handleContactTerminalKeyDown/);
  assert.match(mainSource, /contactTerminalOwnsCamera/);
  assert.match(mainSource, /updateContactTerminal\(now\)/);
  assert.match(mainSource, /contactTerminalOwnsCamera:\s*contactTerminalOwnsCamera/);
  assert.match(mainSource, /handleContactTerminalKeyDown:\s*handleContactTerminalKeyDown/);
  assert.match(mainSource, /resetMobileMovement:\s*resetMobileMovementInput/);
  assert.match(mainSource, /resumeMouseLook:\s*resumeMouseLookInput/);

  const tickBody = mainSource.match(/function tick\(now\) \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(tickBody, /const contactTerminalCameraOwned = contactTerminalOwnsCamera\(\)/);
  assert.match(tickBody, /!droneIntroWasActive && !contactTerminalCameraOwned/);
  assert.match(tickBody, /if \(!contactTerminalCameraOwned\) updateWalkSimulation\(dt\)/);
  assert.match(tickBody, /if \(!contactTerminalCameraOwned\) applyViewMotionOffset\(\)/);
});

test('contact terminal UI uses semantic controls and accessible status', () => {
  assert.match(htmlSource, /<button id="contact-terminal-action"[^>]*type="button"[^>]*hidden/);
  assert.match(htmlSource, /<button id="contact-terminal-back"[^>]*aria-label="Torna alla demo"[^>]*hidden/);
  assert.match(htmlSource, /<div id="contact-terminal-surface"[^>]*tabindex="-1"[^>]*role="group"/);
  assert.match(htmlSource, /<div id="contact-terminal-live"[^>]*aria-live="polite"/);
  assert.match(htmlSource, /'\.\/src\/world\/contact-terminal\.js'/);
});

test('contact controls provide stable desktop and mobile hit targets', () => {
  assert.match(cssSource, /#contact-terminal-action\s*\{[\s\S]*min-height:\s*44px/);
  assert.match(cssSource, /#contact-terminal-back\s*\{[\s\S]*width:\s*44px[\s\S]*height:\s*44px/);
  assert.match(cssSource, /body\.contact-terminal-focus #mobile-movement-pad/);
  assert.match(cssSource, /body\.contact-terminal-focus \.splat-input-overlay/);
  assert.match(cssSource, /@media \(hover: none\), \(pointer: coarse\)[\s\S]*#contact-terminal-action\s*\{[\s\S]*min-height:\s*48px/);
  assert.match(cssSource, /@media \(hover: none\), \(pointer: coarse\)[\s\S]*#contact-terminal-back\s*\{[\s\S]*width:\s*48px[\s\S]*height:\s*48px/);
  assert.match(cssSource, /env\(safe-area-inset-right\)/);
  assert.match(cssSource, /env\(safe-area-inset-top\)/);
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)[\s\S]*#contact-terminal-action/);
});

test('smoke gate validates civic 2 contact terminal diagnostics', () => {
  assert.match(smokeSource, /__contactTerminalInspect/);
  assert.match(smokeSource, /contactTerminal\.civicNumberValue === 2/);
  assert.match(smokeSource, /contactTerminal\.perimeterSide === 'start-player'/);
  assert.match(smokeSource, /contactTerminal\.hitTargetCount === 2/);
  assert.match(smokeSource, /contactTerminal\.textureWidth === 1024/);
  assert.match(smokeSource, /contactTerminal\.textureHeight === 512/);
});
