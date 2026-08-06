import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const demoRoots = [join(dirname(fileURLToPath(import.meta.url)), '..')];

const expectedBanks = {
  road: ['ROUTER1A.wav', 'ROUTER1B.wav', 'ROUTER2A.wav', 'ROUTER2B.wav'],
  sidewalk: ['GLASS1A.wav', 'GLASS1B.wav', 'GLASS2A.wav', 'GLASS2B.wav'],
};

function assertWav(path) {
  const header = readFileSync(path).subarray(0, 12);
  assert.equal(header.subarray(0, 4).toString('ascii'), 'RIFF', `${path} must be RIFF`);
  assert.equal(header.subarray(8, 12).toString('ascii'), 'WAVE', `${path} must be WAVE`);
  assert.ok(statSync(path).size > 8000, `${path} should not be an empty placeholder`);
}

for (const root of demoRoots) {
  const htmlPath = join(root, 'index.html');
  const html = readFileSync(htmlPath, 'utf8');

  assert.match(html, /TRON_FOOTSTEP_BANKS/, `${htmlPath} should define footstep banks`);
  assert.match(html, /ensureFootstepAudioReady/, `${htmlPath} should lazy-load audio after user gesture`);
  assert.match(html, /playFootstepForSurface/, `${htmlPath} should play surface-aware footstep samples`);
  assert.match(html, /window\.__tronFootstepInspect/, `${htmlPath} should expose footstep diagnostics`);
  assert.match(html, /walkSurfaceKind\s*=\s*padHit\s*\?\s*'sidewalk'\s*:\s*'road'/, `${htmlPath} should keep road/sidewalk surface detection`);

  for (const [surface, files] of Object.entries(expectedBanks)) {
    assert.match(html, new RegExp(`${surface}: \\[`), `${htmlPath} should include a ${surface} bank`);
    for (const file of files) {
      const rel = `audio/footsteps/${surface}/${file}`;
      assert.ok(html.includes(rel), `${htmlPath} should reference ${rel}`);
      assertWav(join(root, rel));
    }
  }
}

console.log('tron footstep audio verified');
