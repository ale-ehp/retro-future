import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { MOBILE_PERFORMANCE_PIXEL_RATIO_CAP } from './world/config.js';

const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
const htmlSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('../retro-future.css', import.meta.url), 'utf8');
const discCursorSource = readFileSync(new URL('./camera/disc-cursor.js', import.meta.url), 'utf8');
const shadersSource = readFileSync(new URL('./engine/shaders.js', import.meta.url), 'utf8');
const temporalAaSource = readFileSync(new URL('./engine/temporal-aa-pass.js', import.meta.url), 'utf8');

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

test('disc cursor shows three rotating wait notches during the reveal', () => {
  assert.match(htmlSource, /<span class="disc-wait-ring" aria-hidden="true">/);
  assert.equal((htmlSource.match(/class="disc-wait-notch"/g) || []).length, 3);
  assert.match(cssSource, /#tron-disc-cursor \.disc-wait-ring\s*\{[\s\S]*animation:\s*tron-disc-wait-orbit/);
  assert.match(cssSource, /#tron-disc-cursor \.disc-wait-notch\s*\{[\s\S]*background:\s*linear-gradient/);
  assert.match(cssSource, /#tron-disc-cursor \.disc-wait-notch:nth-child\(2\)\s*\{[\s\S]*rotate\(120deg\)/);
  assert.match(cssSource, /#tron-disc-cursor \.disc-wait-notch:nth-child\(3\)\s*\{[\s\S]*rotate\(240deg\)/);
  assert.match(cssSource, /#tron-disc-cursor\.is-reveal-waiting \.disc-wait-ring\s*\{[\s\S]*opacity:\s*1/);
  assert.match(cssSource, /@keyframes tron-disc-wait-orbit\s*\{[\s\S]*rotate\(360deg\)/);
  assert.match(discCursorSource, /revealWaiting:\s*false/);
  assert.match(discCursorSource, /export function setTronDiscCursorRevealWaiting\(waiting, anchorEvent = null\)/);
  assert.match(discCursorSource, /tronDiscCursor\?\.classList\.toggle\('is-reveal-waiting', next\)/);
  assert.match(mainSource, /setTronDiscCursorRevealWaiting\(true, event\)/);
  assert.match(mainSource, /setTronDiscCursorRevealWaiting\(tronDiscRevealWaitingActive\)/);
});

test('reveal wait label pulses in the bottom right during the reveal', () => {
  const waitLabelRule = cssSource.match(/#tron-reveal-wait-label\s*\{[^}]*\}/)?.[0] ?? '';

  assert.match(
    htmlSource,
    /<div id="tron-reveal-wait-label" aria-hidden="true"><span class="tron-wait-text">Attendi<\/span><span class="tron-wait-dots" aria-hidden="true"><span class="tron-wait-dot">.<\/span><span class="tron-wait-dot">.<\/span><span class="tron-wait-dot">.<\/span><\/span><\/div>/,
  );
  assert.doesNotMatch(htmlSource, /WHAIT/);
  assert.match(waitLabelRule, /position:\s*fixed/);
  assert.match(waitLabelRule, /right:\s*max\(72px, env\(safe-area-inset-right\)\)/);
  assert.match(waitLabelRule, /bottom:\s*max\(42px, env\(safe-area-inset-bottom\)\)/);
  assert.doesNotMatch(waitLabelRule, /left:\s*max\(18px, env\(safe-area-inset-left\)\)/);
  assert.match(waitLabelRule, /font-size:\s*clamp\(24px, 2\.2vw, 30px\)/);
  assert.match(waitLabelRule, /text-align:\s*right/);
  assert.match(waitLabelRule, /text-transform:\s*none/);
  assert.match(waitLabelRule, /pointer-events:\s*none/);
  assert.match(waitLabelRule, /opacity:\s*0/);
  assert.match(cssSource, /#tron-reveal-wait-label\.is-active\s*\{[\s\S]*animation:\s*tron-reveal-wait-label-pulse/);
  assert.match(cssSource, /#tron-reveal-wait-label\.is-active \.tron-wait-dot\s*\{[\s\S]*animation:\s*tron-wait-dot-scan/);
  assert.match(cssSource, /#tron-reveal-wait-label \.tron-wait-dot:nth-child\(1\)\s*\{[\s\S]*animation-delay:\s*0s/);
  assert.match(cssSource, /#tron-reveal-wait-label \.tron-wait-dot:nth-child\(2\)\s*\{[\s\S]*animation-delay:\s*0\.16s/);
  assert.match(cssSource, /#tron-reveal-wait-label \.tron-wait-dot:nth-child\(3\)\s*\{[\s\S]*animation-delay:\s*0\.32s/);
  assert.match(cssSource, /@keyframes tron-reveal-wait-label-pulse\s*\{[\s\S]*text-shadow/);
  assert.match(cssSource, /@keyframes tron-wait-dot-scan\s*\{[\s\S]*transform:\s*translateY\(-0\.14em\)/);
  assert.match(mainSource, /const tronRevealWaitLabel = document\.getElementById\('tron-reveal-wait-label'\)/);
  assert.match(mainSource, /tronRevealWaitLabel\?\.classList\.toggle\('is-active', tronDiscRevealWaitingActive\)/);
});

test('mobile performance HUD shows only the FPS row', () => {
  assert.match(htmlSource, /<div class="perf-live-row perf-live-primary"><span>FPS<\/span><strong id="fps">--<\/strong><\/div>/);
  assert.match(htmlSource, /<div class="perf-live-row"><span>Theo<\/span><span id="perf-theoretical-fps"/);
  assert.match(cssSource, /@media \(max-width: 760px\), \(hover: none\), \(pointer: coarse\) \{[\s\S]*#hud-tl\s*\{[\s\S]*width:\s*max-content/);
  assert.match(cssSource, /@media \(max-width: 760px\), \(hover: none\), \(pointer: coarse\) \{[\s\S]*#hud-tl \.perf-live-overlay\s*\{[\s\S]*width:\s*max-content/);
  assert.match(cssSource, /@media \(max-width: 760px\), \(hover: none\), \(pointer: coarse\) \{[\s\S]*#hud-tl > :not\(\.perf-live-overlay\)\s*\{[\s\S]*display:\s*none !important/);
  assert.match(cssSource, /@media \(max-width: 760px\), \(hover: none\), \(pointer: coarse\) \{[\s\S]*#hud-tl \.perf-live-row:not\(\.perf-live-primary\)\s*\{[\s\S]*display:\s*none/);
  assert.match(cssSource, /@media \(max-width: 760px\), \(hover: none\), \(pointer: coarse\) \{[\s\S]*#hud-tl \.perf-live-primary\s*\{[\s\S]*display:\s*flex/);
  assert.match(cssSource, /@media \(max-width: 760px\), \(hover: none\), \(pointer: coarse\) \{[\s\S]*#hud-tl \.perf-live-primary\s*\{[\s\S]*width:\s*max-content/);
  assert.match(cssSource, /@media \(max-width: 760px\), \(hover: none\), \(pointer: coarse\) \{[\s\S]*#hud-tl \.perf-live-primary strong\s*\{[\s\S]*min-width:\s*2ch/);
});

test('mobile performance caps pixel ratio at native scale', () => {
  assert.equal(MOBILE_PERFORMANCE_PIXEL_RATIO_CAP, 1);
});

test('sky bake spread is recorded in benchmark and perf inspectors', () => {
  assert.match(mainSource, /skyBake:\s*skyDome\.inspectSkyBake\(\)/);
  assert.match(mainSource, /skyBakeSpread:\s*skyDome\.inspectSkyBake\(\)\.spread/);
  assert.match(mainSource, /skyBakeFaceStride:\s*skyDome\.inspectSkyBake\(\)\.faceStride/);
});

test('tech breakdown overlay is URL-gated and fed from live diagnostics', () => {
  assert.match(mainSource, /createTechBreakdownOverlay/);
  assert.match(mainSource, /techBreakdownRequestedFromParams\(retroBenchmarkSearchParams\)/);
  assert.match(mainSource, /performanceDiagnostics\.summary\(latestMeasuredFps\)/);
  assert.match(mainSource, /fxToggleInspect\(\)/);
  assert.match(mainSource, /skyBake:\s*skyDome\.inspectSkyBake\(\)/);
  assert.match(mainSource, /hexRoad:\s*hexRoadInspect\(\)/);
  assert.match(mainSource, /techBreakdownOverlay\?\.update\(now\)/);
  assert.match(cssSource, /\.tech-breakdown-overlay\s*\{/);
  assert.match(cssSource, /\.tech-breakdown-overlay\s*\{[\s\S]*z-index:\s*82/);
  assert.match(cssSource, /\.tech-breakdown-overlay dd\s*\{[\s\S]*text-overflow:\s*ellipsis/);
});

test('cinematic look pass is default-on with URL rollback and inserted after FSR output', () => {
  assert.match(shadersSource, /export function cinematicLookRequestedFromParams/);
  assert.match(shadersSource, /export const TRON_CINEMATIC_LOOK_SHADER/);
  assert.match(shadersSource, /return true;/);
  assert.match(shadersSource, /look === 'classic'/);
  assert.match(mainSource, /cinematicLookRequestedFromParams\(new URLSearchParams\(window\.location\.search\)\)/);
  assert.match(mainSource, /cinematicLookEnabled/);
  assert.match(mainSource, /new ShaderPass\(TRON_CINEMATIC_LOOK_SHADER\)/);
  assert.match(mainSource, /composer\.addPass\(fsrUpscalePass\)[\s\S]*composer\.addPass\(cinematicLookPass\)/);
  assert.match(mainSource, /cinematicLookPass\?\.enabled/);
  assert.match(mainSource, /cinematicLookPassEnabled:\s*Boolean\(cinematicLookPass\?\.enabled\)/);
});

test('temporal AA defaults on and runs after the cinematic look pass', () => {
  assert.match(temporalAaSource, /export class TemporalAaPass/);
  assert.match(temporalAaSource, /export function temporalAaRequestedFromParams/);
  assert.match(mainSource, /temporalAaRequestedFromParams\(new URLSearchParams\(window\.location\.search\)\)/);
  assert.match(mainSource, /new TemporalAaPass\(/);
  assert.match(mainSource, /composer\.addPass\(cinematicLookPass\)[\s\S]*composer\.addPass\(temporalAaPass\)/);
  assert.match(mainSource, /applyTemporalAaJitterForRender\(\)/);
  assert.match(mainSource, /clearTemporalAaJitterForRender\(temporalAaJittered\)/);
  assert.match(mainSource, /temporalAaPass\?\.enabled/);
  assert.match(mainSource, /temporalAa:\s*temporalAaPass\?\.inspect\(\)/);
});

test('retro benchmark is query-startable and exports diagnostic json', () => {
  assert.match(mainSource, /createRetroBenchmarkRuntime/);
  assert.match(mainSource, /RETRO_BENCHMARK_DEFAULT_DURATION_MS/);
  assert.match(mainSource, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(mainSource, /benchmarkSeconds/);
  assert.match(mainSource, /retroBenchmarkAutoStartPending/);
  assert.match(mainSource, /cityRevealComplete[\s\S]*window\.__retroBenchmarkStart/);
  assert.match(mainSource, /window\.__retroBenchmarkStart\s*=/);
  assert.match(mainSource, /window\.__retroBenchmarkInspect\s*=/);
  assert.match(mainSource, /window\.__retroBenchmarkDownload\s*=/);
  assert.match(mainSource, /retroBenchmarkRuntime\.recordFrame\(\{/);
  assert.match(mainSource, /performanceDiagnostics\.canvasSummary\(\)/);
  assert.match(mainSource, /hexRoad:\s*hexRoadInspect\(\)/);
  assert.match(mainSource, /WEBGL_debug_renderer_info/);
  assert.match(cssSource, /\.retro-benchmark-panel\s*\{/);
  assert.match(cssSource, /\.retro-benchmark-panel\s*\{[\s\S]*z-index:\s*130/);
  assert.match(cssSource, /\.retro-benchmark-actions\s+button/);
});

test('hex road LOD updates before reveal-critical work is skipped', () => {
  const tickBody = mainSource.match(/function tick\(now\) \{([\s\S]*?)\n\}/)?.[1] || '';
  const lodSyncIndex = tickBody.indexOf('syncHexRoadLodForFrame();');
  const revealCriticalIndex = tickBody.indexOf('const revealPerformanceCritical = isCityRevealPerformanceCritical();');
  const skippedStepIndex = tickBody.indexOf('if (!revealPerformanceCritical) {');

  assert.notEqual(lodSyncIndex, -1);
  assert.notEqual(revealCriticalIndex, -1);
  assert.notEqual(skippedStepIndex, -1);
  assert.ok(lodSyncIndex < revealCriticalIndex);
  assert.ok(revealCriticalIndex < skippedStepIndex);
});

test('mobile reveal keeps bloom bypassed for the whole critical reveal window', () => {
  const body = mainSource.match(/function shouldBypassBloomForRevealPerformance\(\) \{([\s\S]*?)\n\}/)?.[1] || '';

  assert.match(body, /isCityRevealPerformanceCritical\(\)/);
  assert.match(body, /mobilePerformanceProfileActive\(\)/);
  assert.match(body, /!hasDroneIntroLanded\(\)/);
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
  assert.match(cssSource, /\.welcome-start-button\s*\{[\s\S]*margin-block:\s*clamp\(36px, 5\.4vh, 58px\) clamp\(18px, 2\.8vh, 28px\)/);
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

test('welcome cover offers a text link back to the home below the start button', () => {
  assert.match(htmlSource, /<a class="welcome-home-link" href="\/">torna alla home<\/a>/);
  assert.ok(
    htmlSource.indexOf('id="welcome-start-button"') < htmlSource.indexOf('class="welcome-home-link"'),
    'home link should render below the start button',
  );
  assert.ok(
    htmlSource.indexOf('class="welcome-home-link"') < htmlSource.indexOf('class="welcome-action"'),
    'home link should stay in the welcome action area',
  );
  assert.match(cssSource, /\.welcome-home-link\s*\{[\s\S]*position:\s*relative[\s\S]*z-index:\s*3/);
  assert.match(cssSource, /\.welcome-home-link\s*\{[\s\S]*display:\s*inline-flex/);
  assert.match(cssSource, /\.welcome-home-link\s*\{[\s\S]*color:\s*oklch\(96% 0\.018 220/);
  assert.match(cssSource, /\.welcome-home-link:hover\s*\{[\s\S]*color:\s*oklch\(100% 0\.006 220/);
  assert.match(cssSource, /\.welcome-home-link:focus-visible\s*\{[\s\S]*outline:\s*2px solid/);
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
