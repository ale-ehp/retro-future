import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
const htmlSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('../retro-future.css', import.meta.url), 'utf8');

test('boot waits for female crowd before draining queue and prewarming textures', () => {
  const body = mainSource.match(/async function bootSceneWithFinalDefaults\(\) \{([\s\S]*?)\n\}/)?.[1] || '';
  const orchestrationIndex = body.indexOf('await tronRunnerOrchestration.load();');
  const femaleIndex = body.indexOf('await loadTronRunnerFemaleCrowd();');
  const drainIndex = body.indexOf('await tronRunnerCrowdRuntime.drainBuildQueue();');
  const skinPrewarmIndex = body.indexOf('prewarmSkinnedMeshBoneTextures(scene);');
  const texturePrewarmIndex = body.indexOf('prewarmSceneTextureUploads(scene);');

  assert.notEqual(orchestrationIndex, -1);
  assert.notEqual(femaleIndex, -1);
  assert.notEqual(drainIndex, -1);
  assert.notEqual(skinPrewarmIndex, -1);
  assert.notEqual(texturePrewarmIndex, -1);
  assert.ok(orchestrationIndex < femaleIndex);
  assert.ok(femaleIndex < drainIndex);
  assert.ok(drainIndex < skinPrewarmIndex);
  assert.ok(skinPrewarmIndex < texturePrewarmIndex);
});

test('boot renders hidden skinned meshes once before postprocessing prewarm', () => {
  const body = mainSource.match(/async function bootSceneWithFinalDefaults\(\) \{([\s\S]*?)\n\}/)?.[1] || '';
  const texturePrewarmIndex = body.indexOf('prewarmSceneTextureUploads(scene);');
  const skinnedRenderIndex = body.indexOf('prewarmHiddenSkinnedMeshRender(scene);');
  const postPrewarmIndex = body.indexOf('prewarmPostProcessingPasses();');

  assert.notEqual(texturePrewarmIndex, -1);
  assert.notEqual(skinnedRenderIndex, -1);
  assert.notEqual(postPrewarmIndex, -1);
  assert.ok(texturePrewarmIndex < skinnedRenderIndex);
  assert.ok(skinnedRenderIndex < postPrewarmIndex);
});

test('welcome cover button starts the existing reveal flow', () => {
  assert.match(mainSource, /document\.getElementById\('welcome-start-button'\)/);
  assert.match(mainSource, /welcomeStartButton\?\.addEventListener\('click'/);
  assert.match(mainSource, /triggerBackspaceDroneIntro\('welcome-button'\)/);
});

test('welcome cover hides HUD until dismissed', () => {
  assert.match(htmlSource, /<body class="[^"]*\bwelcome-cover-visible\b[^"]*"/);
  assert.match(cssSource, /body\.welcome-cover-visible\s+#hud-tl/);
  assert.match(cssSource, /body\.welcome-cover-visible\s+#settings-toggle/);
  assert.match(mainSource, /document\.body\.classList\.remove\('welcome-cover-visible'\)/);
});

test('welcome cover renders as an instant opaque white page', () => {
  assert.ok(
    htmlSource.indexOf('id="welcome-window-overlay"') < htmlSource.indexOf('id="hud-tl"'),
    'welcome cover should appear before HUD markup so it can paint immediately',
  );
  assert.match(cssSource, /#welcome-window-overlay\s*\{[\s\S]*z-index:\s*120/);
  assert.match(cssSource, /#welcome-window-overlay\s*\{[\s\S]*background:\s*oklch\(99\.2% 0\.004 250\)/);
  assert.match(cssSource, /#welcome-window-overlay\s*\{[\s\S]*color:\s*oklch\(18% 0\.01 255\)/);
  assert.match(cssSource, /body\.welcome-cover-visible\s*\{[\s\S]*background:\s*oklch\(99\.2% 0\.004 250\)/);
  assert.match(cssSource, /body\.welcome-cover-visible\s+#loader\s*\{[\s\S]*z-index:\s*20/);
  assert.match(cssSource, /body\.welcome-cover-visible\s+\.welcome-action\s*\{[\s\S]*display:\s*none/);
});
