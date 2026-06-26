import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
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

test('female runner GLB is meshopt compressed and configured in loader', () => {
  const femaleModelUrl = new URL('../character-mockups/assets/models/girl12-fullbody-tron.glb', import.meta.url);
  const meshoptDecoderUrl = new URL('../meshopt_decoder.module.js', import.meta.url);

  assert.ok(existsSync(femaleModelUrl), 'female runner GLB should exist');
  assert.ok(statSync(femaleModelUrl).size < 2_000_000, 'female runner GLB should stay below 2 MB');
  assert.ok(existsSync(meshoptDecoderUrl), 'meshopt decoder should be shipped with retro future assets');
  assert.match(htmlSource, /"three\/addons\/libs\/meshopt_decoder\.module\.js": "\.\/meshopt_decoder\.module\.js"/);
  assert.match(mainSource, /import\('three\/addons\/libs\/meshopt_decoder\.module\.js'\)/);
  assert.match(mainSource, /RunnerMeshoptDecoder = MeshoptDecoder/);
  assert.match(mainSource, /loader\.setMeshoptDecoder\(RunnerMeshoptDecoder\)/);
});

test('welcome cover button starts the existing reveal flow', () => {
  assert.match(mainSource, /document\.getElementById\('welcome-start-button'\)/);
  assert.match(mainSource, /welcomeStartButton\?\.addEventListener\('click'/);
  assert.match(mainSource, /triggerBackspaceDroneIntro\('welcome-button'\)/);
});

test('welcome cover page stays static while the button starts the reveal flow', () => {
  assert.match(mainSource, /function isEventInsideWelcomeStartButton\(event\)/);
  assert.match(mainSource, /welcomeStartButton\?\.getBoundingClientRect\(\)/);
  assert.match(mainSource, /welcomeWindowOverlay\?\.addEventListener\('click'/);
  assert.match(mainSource, /isEventInsideWelcomeStartButton\(event\)/);
  assert.match(mainSource, /triggerWelcomeButtonStart\(event\)/);
  assert.doesNotMatch(mainSource, /setupWelcomeWindowMotion\(welcomeWindowMotion, welcomeMotionDeps\)/);
  assert.match(mainSource, /const welcomeWindowMotionAllowed = false/);
  assert.doesNotMatch(cssSource, /\.welcome-start-button:hover\s*\{[\s\S]*transform:\s*translateY/);
});

test('welcome cover hides HUD until dismissed', () => {
  assert.match(htmlSource, /<body class="[^"]*\bwelcome-cover-visible\b[^"]*"/);
  assert.match(cssSource, /body\.welcome-cover-visible\s+#hud-tl/);
  assert.match(cssSource, /body\.welcome-cover-visible\s+#settings-toggle/);
  assert.match(mainSource, /document\.body\.classList\.remove\('welcome-cover-visible'\)/);
});

test('welcome cover renders as an instant opaque black page', () => {
  assert.ok(
    htmlSource.indexOf('id="welcome-window-overlay"') < htmlSource.indexOf('id="hud-tl"'),
    'welcome cover should appear before HUD markup so it can paint immediately',
  );
  assert.match(cssSource, /#welcome-window-overlay\s*\{[\s\S]*z-index:\s*120/);
  assert.match(cssSource, /#welcome-window-overlay\s*\{[\s\S]*background:\s*oklch\(0% 0 0\)/);
  assert.match(cssSource, /#welcome-window-overlay\s*\{[\s\S]*color:\s*oklch\(96% 0\.018 220\)/);
  assert.match(cssSource, /body\.welcome-cover-visible\s*\{[\s\S]*background:\s*oklch\(0% 0 0\)/);
  assert.match(cssSource, /body\.welcome-cover-visible\s+#loader\s*\{[\s\S]*z-index:\s*20/);
  assert.match(cssSource, /body\.welcome-cover-visible\s+\.welcome-action\s*\{[\s\S]*display:\s*none/);
});

test('welcome cover shows four colored anime GLB department heads below the start button', () => {
  assert.ok(
    htmlSource.indexOf('id="welcome-start-button"') < htmlSource.indexOf('class="welcome-departments"'),
    'department tiles should render below the start button',
  );
  const labels = Array.from(htmlSource.matchAll(/class="welcome-department-label">([^<]+)/g), (match) => match[1]);
  assert.deepEqual(labels, [
    'Dipartimento 1',
    'Dipartimento 2',
    'Dipartimento 3',
    'Dipartimento 4',
  ]);
  assert.doesNotMatch(htmlSource, /welcome-wireframe-profile/);
  assert.doesNotMatch(htmlSource, /welcome-department-wireframe/);
  assert.equal((htmlSource.match(/class="welcome-department-face/g) || []).length, 4);
  assert.equal((htmlSource.match(/data-head-model="assets\/models\/anime-head-practice\.glb"/g) || []).length, 4);
  assert.equal((htmlSource.match(/data-head-color="/g) || []).length, 4);
  assert.doesNotMatch(htmlSource, /data-instant-face=['"]procedural-3d['"]/);
  assert.doesNotMatch(htmlSource, /drawWelcomeDepartmentFace/);
  assert.doesNotMatch(htmlSource, /procedural-3d-canvas/);
  assert.ok(
    htmlSource.indexOf('<script type="importmap">') < htmlSource.indexOf('initWelcomeDepartmentHeads'),
    'import map should be available before the GLB head module',
  );
  assert.ok(
    htmlSource.indexOf('initWelcomeDepartmentHeads') < htmlSource.indexOf('./src/main.js'),
    'department heads should start before the main city module',
  );
  assert.match(htmlSource, /import \* as THREE from 'three';/);
  assert.match(htmlSource, /import \{ GLTFLoader \} from 'three\/addons\/loaders\/GLTFLoader\.js';/);
  assert.match(htmlSource, /mode:\s*'anime-head-glb'/);
  assert.match(htmlSource, /function isHeadTintTarget\(node\)/);
  assert.match(htmlSource, /function applyHeadFeatureTint\(root, colorValue\)/);
  assert.match(htmlSource, /node\.userData\.welcomeHeadFeatureTinted = true/);
  assert.doesNotMatch(htmlSource, /function colorizeHead\(root, colorValue\)/);
  assert.doesNotMatch(htmlSource, /node\.material = new THREE\.MeshStandardMaterial/);
  assert.match(htmlSource, /hitTarget:\s*canvas\.closest\('\.welcome-department-card'\) \|\| canvas/);
  assert.match(htmlSource, /view\.hitTarget\.addEventListener\('pointerenter'/);
  assert.match(htmlSource, /view\.hitTarget\.addEventListener\('pointermove'/);
  assert.match(htmlSource, /view\.hitTarget\.addEventListener\('pointerleave'/);
  assert.match(htmlSource, /hoverActive:\s*false/);
  assert.match(htmlSource, /targetYaw/);
  const headModelUrl = new URL('../assets/models/anime-head-practice.glb', import.meta.url);
  assert.ok(existsSync(headModelUrl), 'anime head GLB asset should be copied into retro-future assets');
  assert.ok(statSync(headModelUrl).size > 100_000, 'anime head GLB asset should not be empty');
  assert.match(cssSource, /\.welcome-start-button\s*\{[\s\S]*position:\s*relative[\s\S]*z-index:\s*3/);
  assert.match(cssSource, /\.welcome-departments\s*\{[\s\S]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(cssSource, /\.welcome-departments\s*\{[^}]*pointer-events:\s*auto/);
  assert.match(cssSource, /\.welcome-department-card\s*\{[\s\S]*background:[\s\S]*oklch\(3% 0\.006 250\)/);
  assert.match(cssSource, /\.welcome-department-face\s*\{[\s\S]*background:\s*oklch\(0% 0 0\)/);
  assert.match(cssSource, /\.welcome-department-face\s*\{[\s\S]*filter:[\s\S]*drop-shadow\(0 0 13px oklch\(78% 0\.16 195/);
  assert.match(cssSource, /@media \(max-width: 760px\)[\s\S]*\.welcome-departments\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
});
