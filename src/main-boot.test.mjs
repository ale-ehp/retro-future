import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');

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
