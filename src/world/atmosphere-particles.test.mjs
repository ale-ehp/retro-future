import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as atmosphereParticles from './atmosphere-particles.js';

test('cinematic atmosphere is opt-in and supports an explicit rollback', () => {
  assert.equal(typeof atmosphereParticles.cinematicAtmosphereSettingsFromParams, 'function');

  const resolve = atmosphereParticles.cinematicAtmosphereSettingsFromParams;
  assert.equal(resolve(new URLSearchParams('')).enabled, false);
  assert.equal(resolve(new URLSearchParams('cinematicAtmosphere=1')).enabled, true);
  assert.equal(resolve(new URLSearchParams('cinematicAtmosphere=on')).enabled, true);
  assert.equal(resolve(new URLSearchParams('atmosphere=cinematic')).enabled, true);
  assert.equal(resolve(new URLSearchParams('cinematicAtmosphere=0')).enabled, false);
});

test('cinematic atmosphere keeps a cheaper mobile profile', () => {
  assert.equal(typeof atmosphereParticles.cinematicAtmosphereSettingsFromParams, 'function');

  const resolve = atmosphereParticles.cinematicAtmosphereSettingsFromParams;
  const desktop = resolve(new URLSearchParams('cinematicAtmosphere=1'), { mobile: false });
  const mobile = resolve(new URLSearchParams('cinematicAtmosphere=1'), { mobile: true });

  assert.equal(desktop.profile, 'desktop');
  assert.equal(desktop.shaftsEnabled, true);
  assert.equal(desktop.drawCallBudget, 3);
  assert.ok(desktop.fogDensity > 0);
  assert.ok(desktop.hazeOpacity > 0);

  assert.equal(mobile.profile, 'mobile');
  assert.equal(mobile.shaftsEnabled, false);
  assert.equal(mobile.drawCallBudget, 1);
  assert.ok(mobile.fogDensity < desktop.fogDensity);
  assert.ok(mobile.hazeOpacity < desktop.hazeOpacity);
});

test('cinematic atmosphere controller applies and restores scene fog', () => {
  assert.equal(typeof atmosphereParticles.createCinematicAtmosphere, 'function');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 10000);
  const settings = atmosphereParticles.cinematicAtmosphereSettingsFromParams(
    new URLSearchParams('cinematicAtmosphere=1'),
    { mobile: false },
  );
  const controller = atmosphereParticles.createCinematicAtmosphere({ scene, camera, settings });

  assert.equal(controller.inspect().active, false);
  assert.equal(controller.inspect().shaftCount, 2);
  assert.equal(controller.inspect().drawCallBudget, 3);
  controller.update(true, 2.5);
  assert.ok(scene.fog instanceof THREE.FogExp2);
  assert.equal(controller.inspect().active, true);
  assert.equal(controller.inspect().fogApplied, true);

  controller.update(false, 3);
  assert.equal(scene.fog, null);
  assert.equal(controller.inspect().active, false);
  controller.dispose();
});

test('cinematic atmosphere controller omits shafts on mobile', () => {
  assert.equal(typeof atmosphereParticles.createCinematicAtmosphere, 'function');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 10000);
  const settings = atmosphereParticles.cinematicAtmosphereSettingsFromParams(
    new URLSearchParams('cinematicAtmosphere=1'),
    { mobile: true },
  );
  const controller = atmosphereParticles.createCinematicAtmosphere({ scene, camera, settings });

  assert.equal(controller.inspect().profile, 'mobile');
  assert.equal(controller.inspect().shaftCount, 0);
  assert.equal(controller.inspect().drawCallBudget, 1);
  controller.dispose();
});
