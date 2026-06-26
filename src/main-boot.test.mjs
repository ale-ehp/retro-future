import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
const htmlSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('../retro-future.css', import.meta.url), 'utf8');

test('boot drains the runner crowd queue before prewarming textures', () => {
  const body = mainSource.match(/async function bootSceneWithFinalDefaults\(\) \{([\s\S]*?)\n\}/)?.[1] || '';
  const orchestrationIndex = body.indexOf('await tronRunnerOrchestration.load();');
  const drainIndex = body.indexOf('await tronRunnerCrowdRuntime.drainBuildQueue();');
  const skinPrewarmIndex = body.indexOf('prewarmSkinnedMeshBoneTextures(scene);');
  const texturePrewarmIndex = body.indexOf('prewarmSceneTextureUploads(scene);');

  assert.notEqual(orchestrationIndex, -1);
  assert.notEqual(drainIndex, -1);
  assert.notEqual(skinPrewarmIndex, -1);
  assert.notEqual(texturePrewarmIndex, -1);
  assert.doesNotMatch(body, /loadTronRunnerFemaleCrowd/);
  assert.ok(orchestrationIndex < drainIndex);
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

test('female12 runner GLB and meshopt decoder are fully removed', () => {
  const femaleModelUrl = new URL('../character-mockups/assets/models/girl12-fullbody-tron.glb', import.meta.url);
  const meshoptDecoderUrl = new URL('../meshopt_decoder.module.js', import.meta.url);

  assert.ok(!existsSync(femaleModelUrl), 'female12 GLB should be removed');
  assert.ok(!existsSync(meshoptDecoderUrl), 'meshopt decoder should be removed with female12');
  assert.doesNotMatch(htmlSource, /meshopt_decoder|girl12-fullbody-tron|TRON_RUNNER_FEMALE/);
  assert.doesNotMatch(mainSource, /meshopt_decoder|RunnerMeshoptDecoder|setMeshoptDecoder|girl12-fullbody-tron|TRON_RUNNER_FEMALE|loadTronRunnerFemaleCrowd/);
});

test('disc cursor does not intercept mouse input', () => {
  assert.match(cssSource, /#tron-disc-cursor\s*\{[^}]*pointer-events:\s*none/);
  assert.doesNotMatch(cssSource, /#tron-disc-cursor\s*\{[^}]*pointer-events:\s*auto/);
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

test('welcome cover schedules the city boot after the first paint', () => {
  assert.doesNotMatch(htmlSource, /<script type="module" src="\.\/src\/main\.js"><\/script>/);
  assert.match(htmlSource, /function scheduleRetroFutureCityBoot\(\)/);
  assert.match(htmlSource, /requestAnimationFrame\(\(\) => \{[\s\S]*import\('\.\/src\/main\.js'\)/);
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

test('welcome cover uses the start button as the only department prompt', () => {
  assert.match(htmlSource, /<h1 id="welcome-window-title">Ti aspettavi una pagina con reparti e foto\.<\/h1>/);
  assert.match(htmlSource, /<button id="welcome-start-button" class="welcome-start-button" type="button">\s*Esplora i reparti\s*<\/button>/);
  assert.doesNotMatch(htmlSource, /class="welcome-copy"/);
  assert.doesNotMatch(htmlSource, /Esplora tutti i reparti/);
  assert.doesNotMatch(htmlSource, /Puoi esplorare qui tutti i reparti:/);
  assert.match(cssSource, /\.welcome-body h1\s*\{[\s\S]*font-size:\s*clamp\(22px, 3\.5vw, 48px\)/);
  assert.match(cssSource, /\.welcome-body h1\s*\{[\s\S]*line-height:\s*1\.24/);
  assert.match(cssSource, /\.welcome-start-button\s*\{[\s\S]*min-width:\s*min\(520px, 88vw\)/);
  assert.match(cssSource, /\.welcome-start-button\s*\{[\s\S]*min-height:\s*123px/);
  assert.match(cssSource, /\.welcome-start-button\s*\{[\s\S]*margin-block:\s*clamp\(36px, 5\.4vh, 58px\) clamp\(42px, 6\.2vh, 64px\)/);
  assert.match(cssSource, /\.welcome-start-button\s*\{[\s\S]*padding:\s*0 28px/);
  assert.match(cssSource, /\.welcome-start-button\s*\{[\s\S]*transition:\s*none/);
  assert.match(cssSource, /\.welcome-start-button\s*\{[\s\S]*animation:\s*welcome-start-button-pulse 1s/);
  assert.match(cssSource, /\.welcome-start-button:hover\s*\{[\s\S]*background:\s*oklch\(96% 0\.012 95\)/);
  assert.match(cssSource, /\.welcome-start-button:hover\s*\{[\s\S]*animation:\s*none/);
  assert.match(cssSource, /\.welcome-start-button:hover\s*\{[\s\S]*filter:\s*none/);
  assert.match(cssSource, /@keyframes welcome-start-button-pulse\s*\{/);
  assert.match(cssSource, /@keyframes welcome-start-button-pulse\s*\{[\s\S]*background-color:\s*oklch\(73% 0\.19 45\)/);
  assert.match(cssSource, /@keyframes welcome-start-button-pulse\s*\{[\s\S]*filter:\s*brightness\(1\.08\) saturate\(1\.04\) drop-shadow/);
  assert.match(cssSource, /@keyframes welcome-start-button-pulse\s*\{[\s\S]*0 0 18px oklch\(73% 0\.19 45 \/ 0\.22\)/);
  assert.match(cssSource, /@keyframes welcome-start-button-pulse\s*\{[\s\S]*0 0 42px oklch\(73% 0\.19 45 \/ 0\.1\)/);
  assert.doesNotMatch(cssSource, /0 0 30px oklch\(78% 0\.2 45 \/ 0\.34\)/);
  assert.doesNotMatch(cssSource, /0 0 0 8px/);
  assert.doesNotMatch(cssSource, /transform:\s*scale\(1\.025\)/);
});

test('welcome department tiles fit all four columns without clipping the last card', () => {
  assert.match(cssSource, /\.welcome-departments\s*\{[\s\S]*gap:\s*24px/);
  assert.match(cssSource, /\.welcome-departments\s*\{[\s\S]*width:\s*min\(960px, calc\(100vw - 48px\)\)/);
  assert.match(cssSource, /\.welcome-department-card\s*\{[\s\S]*min-height:\s*198px/);
  assert.match(cssSource, /\.welcome-department-face\s*\{[\s\S]*width:\s*min\(210px, 100%\)/);
  assert.match(cssSource, /\.welcome-department-face\s*\{[\s\S]*height:\s*145px/);
});

test('welcome department heads move only on the horizontal axis with smoothed easing', () => {
  assert.match(htmlSource, /function animateWelcomeHeadMotion\(now\)/);
  assert.match(htmlSource, /requestAnimationFrame\(animateWelcomeHeadMotion\)/);
  assert.match(htmlSource, /const headEase = 1 - Math\.exp\(-dt \* 10\)/);
  assert.match(htmlSource, /const nx =/);
  assert.match(htmlSource, /view\.targetPitch = 0/);
  assert.doesNotMatch(htmlSource, /view\.currentPitch = view\.targetPitch/);
  assert.doesNotMatch(htmlSource, /view\.currentYaw = view\.targetYaw/);
  assert.match(htmlSource, /view\.head\.rotation\.y = view\.baseYaw \+ view\.currentYaw/);
  assert.match(htmlSource, /view\.head\.rotation\.x = view\.basePitch/);
});

test('welcome cover shows four colored anime GLB department heads above the start button', () => {
  assert.ok(
    htmlSource.indexOf('class="welcome-departments"') < htmlSource.indexOf('id="welcome-start-button"'),
    'department tiles should render above the start button',
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
  assert.equal((htmlSource.match(/style="--welcome-head-accent:/g) || []).length, 0);
  assert.doesNotMatch(htmlSource, /--welcome-head-accent/);
  assert.doesNotMatch(htmlSource, /data-instant-face=['"]procedural-3d['"]/);
  assert.doesNotMatch(htmlSource, /drawWelcomeDepartmentFace/);
  assert.doesNotMatch(htmlSource, /procedural-3d-canvas/);
  assert.ok(
    htmlSource.indexOf('<script type="importmap">') < htmlSource.indexOf('initWelcomeDepartmentHeads'),
    'import map should be available before the GLB head module',
  );
  assert.ok(
    htmlSource.indexOf('scheduleWelcomeDepartmentHeads') < htmlSource.indexOf('./src/main.js'),
    'department head scheduler should mount before the main city module',
  );
  assert.doesNotMatch(htmlSource, /^import \* as THREE from 'three';/m);
  assert.doesNotMatch(htmlSource, /^import \{ GLTFLoader \} from 'three\/addons\/loaders\/GLTFLoader\.js';/m);
  assert.match(htmlSource, /Promise\.all\(\[\s*import\('three'\),\s*import\('three\/addons\/loaders\/GLTFLoader\.js'\)/);
  assert.match(htmlSource, /function scheduleWelcomeDepartmentHeads\(\)/);
  assert.match(htmlSource, /requestAnimationFrame\(\(\) => \{/);
  assert.match(htmlSource, /requestIdleCallback/);
  assert.match(htmlSource, /status:\s*state\.status/);
  assert.match(htmlSource, /state\.status = 'scheduled'/);
  assert.match(htmlSource, /state\.status = 'loading'/);
  assert.match(htmlSource, /state\.status = 'ready'/);
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
  assert.doesNotMatch(cssSource, /\.welcome-department-card::before/);
  assert.doesNotMatch(cssSource, /--welcome-head-glow|--welcome-head-placeholder-opacity|clip-path:\s*polygon/);
  assert.match(cssSource, /\.welcome-department-face\s*\{[\s\S]*background:\s*oklch\(0% 0 0\)/);
  assert.match(cssSource, /\.welcome-department-face\s*\{[\s\S]*opacity:\s*0/);
  assert.match(cssSource, /\.welcome-department-face\.is-head-ready\s*\{[\s\S]*opacity:\s*1/);
  assert.doesNotMatch(htmlSource, /view\.hitTarget\.style\.setProperty\('--welcome-head-placeholder-opacity', '0'\)/);
  assert.match(htmlSource, /view\.canvas\.style\.opacity = '1'/);
  assert.match(cssSource, /\.welcome-department-face\s*\{[\s\S]*filter:[\s\S]*drop-shadow\(0 0 13px oklch\(78% 0\.16 195/);
  assert.match(cssSource, /@media \(max-width: 760px\)[\s\S]*\.welcome-departments\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
});
