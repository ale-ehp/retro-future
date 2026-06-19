import * as THREE from 'three';
import {
  makeTronRunnerActionSet,
  fitTronRunnerModel,
} from './character-build.js';
import {
  TRON_RUNNER_CONTACT_SHADOW_MAX_OPACITY,
  TRON_RUNNER_CONTACT_SHADOW_ROUNDNESS,
  TRON_RUNNER_DEFAULT_SPEED,
  TRON_RUNNER_DISTANCE_DRIVEN_WALK_ENABLED,
  TRON_RUNNER_DYNAMIC_REFLECTION_BODY_RENDER_ORDER,
  TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
  TRON_RUNNER_DYNAMIC_REFLECTION_LED_RENDER_ORDER,
  TRON_RUNNER_DYNAMIC_REFLECTION_Y,
  TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE,
  TRON_RUNNER_ENABLED,
  TRON_RUNNER_FREE_ROAM_COLLISIONS_ENABLED,
  TRON_RUNNER_FREE_ROAM_COLLISION_RADIUS,
  TRON_RUNNER_FREE_ROAM_ENABLED,
  TRON_RUNNER_FREE_ROAM_FOOTSTEPS_ENABLED,
  TRON_RUNNER_FREE_ROAM_REACH_RADIUS,
  TRON_RUNNER_FREE_ROAM_SIDEWALK_INSET,
  TRON_RUNNER_GROUND_OFFSET,
  TRON_RUNNER_GROUND_SHADOW_ENABLED,
  TRON_RUNNER_MODEL_URL,
  TRON_RUNNER_REAL_SHADOW_ENABLED,
  TRON_RUNNER_REAL_SHADOW_LAYER,
  TRON_RUNNER_REAL_SHADOW_RECEIVER_RADIUS,
  TRON_RUNNER_ROUTE_OFFSET,
  TRON_RUNNER_SIDEWALK_INSET,
  TRON_RUNNER_SIDEWALK_SIGN,
  TRON_RUNNER_SOURCE_CHARACTER_VISIBLE,
  TRON_RUNNER_SUIT_TEXTURE_MODE,
  TRON_RUNNER_TARGET_HEIGHT,
} from './characters.js';
import {
  resetTronRunnerAutonomy,
} from './runner-controller.js';
import {
  playTronRunnerAction,
  syncTronRunnerActionSetToDistance,
} from './runner-animation.js';
import {
  tronRunnerFootstepAudioState,
  updateTronRunnerAutonomyFootsteps,
} from './runner-footsteps.js';

export function createTronRunnerOrchestrationRuntime({
  runnerWalker,
  runnerParts,
  runnerState,
  runnerMotion,
  autonomy,
  footstepRuntime,
  npcSpatialBus,
  renderer,
  runnerSuitMaterial,
  runnerShadowMaterial,
  runnerRealShadowMaterial,
  reveal,
  loadGltfClass,
  cloneRunnerSkeleton,
  effectiveAnimationSpeed,
  applyVisualControls,
  buildCrowd,
  buildIdleCharacter,
  updateRealShadowRig,
  updateDynamicReflection,
  surfaceYAt,
  roadTileTopY,
  roadHexBoundaryLimits,
  resolveRoundedCollider,
  lerpAngle,
  getWalkSpeed,
  getFloorReflection,
  getShadowPulse,
  getDynamicRoadCenter,
  getDynamicRoadLength,
  getGridBlock,
  getRoadHalf,
  getStreetEdgeWidth,
  getSideBuildingRecords,
  getMainBuildingRecords,
  getBuildingColliders,
  getMainBuildingCollisionPadding,
  getCollisionPadding,
  getPlayerSpawn,
  sideBuildingSpacing,
  doorHalfHeight,
  makeReflectionBodyMaterial,
  makeReflectionLedMaterial,
}) {
  const runnerBox = new THREE.Box3();
  const runnerSize = new THREE.Vector3();

  function droneAnchor() {
    const playerSpawn = getPlayerSpawn();
    return {
      x: Number.isFinite(playerSpawn?.x) ? playerSpawn.x : 0,
      z: Number.isFinite(playerSpawn?.z) ? playerSpawn.z : getDynamicRoadCenter(),
    };
  }

  function waypointForSideBuilding(record) {
    const pad = record?.basePad;
    const points = pad?.innerHitPolygon?.length ? pad.innerHitPolygon : pad?.hitPolygon;
    if (!record || !pad?.border || !points?.length) return null;
    const localXs = points.map(([x]) => x);
    const localZs = points.map(([, z]) => z);
    const roadFacingX = record.sign < 0 ? Math.max(...localXs) : Math.min(...localXs);
    const safeX = roadFacingX + record.sign * TRON_RUNNER_FREE_ROAM_SIDEWALK_INSET;
    const minZ = Math.min(...localZs) + 2;
    const maxZ = Math.max(...localZs) - 2;
    const localZ = THREE.MathUtils.clamp(0, minZ, maxZ);
    return {
      x: pad.border.position.x + safeX,
      z: pad.border.position.z + localZ,
      surface: 'sidewalk',
      label: `sidewalk-${record.civicNumberValue ?? 'building'}`,
    };
  }

  function roadWaypoint(z, label = 'road') {
    const limits = roadHexBoundaryLimits();
    return {
      x: THREE.MathUtils.clamp(0, limits.minX + 2, limits.maxX - 2),
      z: THREE.MathUtils.clamp(z, limits.minZ + 2, limits.maxZ - 2),
      surface: 'road',
      label,
    };
  }

  function rotateWaypointsToAnchor(waypoints, anchor) {
    if (!waypoints.length) return waypoints;
    let bestIndex = 0;
    let bestDistance = Infinity;
    waypoints.forEach((point, index) => {
      const distance = Math.hypot(point.x - anchor.x, point.z - anchor.z);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    return waypoints.slice(bestIndex).concat(waypoints.slice(0, bestIndex));
  }

  function freeRoamRouteSpec() {
    const gridBlock = getGridBlock();
    const rows = [...new Set(getSideBuildingRecords()
      .filter((record) => record.mesh?.visible !== false && record.basePad?.hitPolygon?.length)
      .map((record) => Number(record.mesh.position.z.toFixed(3))))]
      .sort((a, b) => b - a);
    const waypoints = [];
    rows.forEach((z, index) => {
      const rowRecords = getSideBuildingRecords()
        .filter((record) => Math.abs(record.mesh.position.z - z) < gridBlock)
        .sort((a, b) => a.sign - b.sign);
      const left = rowRecords.find((record) => record.sign < 0);
      const right = rowRecords.find((record) => record.sign > 0);
      const firstSide = index % 2 === 0 ? left : right;
      const secondSide = index % 2 === 0 ? right : left;
      const first = waypointForSideBuilding(firstSide);
      const second = waypointForSideBuilding(secondSide);
      if (first) waypoints.push(first);
      waypoints.push(roadWaypoint(z, `road-${z}`));
      if (second) waypoints.push(second);
      waypoints.push(roadWaypoint(z, `road-return-${z}`));
    });
    const mainRecords = getMainBuildingRecords();
    if (mainRecords[0]?.basePad?.hitPolygon?.length) {
      const z = mainRecords[0].mesh.position.z + mainRecords[0].collider.hd + gridBlock * 1.5;
      waypoints.push(roadWaypoint(z, 'main-road-front'));
    }
    const anchor = droneAnchor();
    const rotated = rotateWaypointsToAnchor(waypoints.filter(Boolean), anchor);
    if (!rotated.length) return null;
    return {
      mode: 'free-roam',
      closed: true,
      waypoints: rotated,
      waypointCount: rotated.length,
      x: rotated[0].x,
      zA: rotated[0].z,
      zB: rotated[1]?.z ?? rotated[0].z,
      anchor,
    };
  }

  function resolveAutonomyCollision(point) {
    let collision = false;
    if (TRON_RUNNER_FREE_ROAM_COLLISIONS_ENABLED) {
      for (const collider of getBuildingColliders()) {
        const basePadding = collider.role === 'main-building' ? getMainBuildingCollisionPadding() : getCollisionPadding();
        if (resolveRoundedCollider(point, collider, basePadding + TRON_RUNNER_FREE_ROAM_COLLISION_RADIUS)) {
          collision = true;
        }
      }
      const limits = roadHexBoundaryLimits();
      const nextX = THREE.MathUtils.clamp(point.x, limits.minX, limits.maxX);
      const nextZ = THREE.MathUtils.clamp(point.z, limits.minZ, limits.maxZ);
      if (Math.abs(nextX - point.x) > 0.001 || Math.abs(nextZ - point.z) > 0.001) collision = true;
      point.x = nextX;
      point.z = nextZ;
    }
    return collision;
  }

  function updateAutonomyState(route, movedDistance = 0, collision = false) {
    runnerState.autonomy = {
      mode: route?.mode || 'free-roam',
      collisionEnabled: TRON_RUNNER_FREE_ROAM_COLLISIONS_ENABLED,
      footstepsEnabled: TRON_RUNNER_FREE_ROAM_FOOTSTEPS_ENABLED,
      waypointIndex: autonomy.waypointIndex,
      waypointCount: route?.waypointCount ?? route?.waypoints?.length ?? 0,
      targetLabel: route?.waypoints?.[autonomy.waypointIndex]?.label ?? '',
      distanceWalked: Number(autonomy.distanceWalked.toFixed(2)),
      lastMoveDistance: Number(movedDistance.toFixed(3)),
      collisionCount: autonomy.collisionCount,
      lastCollision: collision,
      lastFootstepSurface: autonomy.lastFootstepSurface,
      lastFootstepSample: autonomy.lastFootstepSample,
      lastFootstepPlayed: autonomy.lastFootstepPlayed,
      audio: tronRunnerFootstepAudioState(autonomy, npcSpatialBus),
    };
  }

  function updateFreeRoam(dt, route) {
    const waypoints = route?.waypoints || [];
    if (!waypoints.length) return null;
    if (!autonomy.initialized) {
      autonomy.initialized = true;
      autonomy.waypointIndex = 1 % waypoints.length;
      return {
        x: waypoints[0].x,
        z: waypoints[0].z,
        directionX: 0,
        directionZ: 1,
        movedDistance: 0,
        collision: false,
      };
    }

    let target = waypoints[autonomy.waypointIndex % waypoints.length];
    const currentX = runnerWalker.position.x;
    const currentZ = runnerWalker.position.z;
    let dx = target.x - currentX;
    let dz = target.z - currentZ;
    let distance = Math.hypot(dx, dz);
    if (distance <= TRON_RUNNER_FREE_ROAM_REACH_RADIUS) {
      autonomy.waypointIndex = (autonomy.waypointIndex + 1) % waypoints.length;
      target = waypoints[autonomy.waypointIndex];
      dx = target.x - currentX;
      dz = target.z - currentZ;
      distance = Math.hypot(dx, dz);
    }
    const directionX = distance > 0.001 ? dx / distance : Math.sin(runnerMotion.yaw);
    const directionZ = distance > 0.001 ? dz / distance : Math.cos(runnerMotion.yaw);
    const step = Math.min(distance, Math.max(0, getWalkSpeed() * dt));
    const point = {
      x: currentX + directionX * step,
      z: currentZ + directionZ * step,
    };
    const collision = resolveAutonomyCollision(point);
    const movedDistance = Math.hypot(point.x - currentX, point.z - currentZ);
    autonomy.distanceWalked += movedDistance;
    if (collision) {
      autonomy.collisionCount += 1;
      if (movedDistance < Math.max(0.02, step * 0.2)) {
        autonomy.waypointIndex = (autonomy.waypointIndex + 1) % waypoints.length;
      }
    }
    autonomy.lastCollision = collision;
    return {
      x: point.x,
      z: point.z,
      directionX,
      directionZ,
      movedDistance,
      collision,
    };
  }

  function routeSpec() {
    const gridBlock = getGridBlock();
    if (TRON_RUNNER_FREE_ROAM_ENABLED) {
      const freeRoamRoute = freeRoamRouteSpec();
      if (freeRoamRoute) return freeRoamRoute;
    }
    const dynamicRoadCenter = getDynamicRoadCenter();
    const dynamicRoadLength = getDynamicRoadLength();
    const minZ = dynamicRoadCenter - dynamicRoadLength * 0.5 + gridBlock * 5;
    const maxZ = dynamicRoadCenter + dynamicRoadLength * 0.5 - gridBlock * 5;
    const playerSpawn = getPlayerSpawn();
    const anchorZ = THREE.MathUtils.clamp((playerSpawn?.z ?? maxZ) - gridBlock * 8, minZ + gridBlock * 12, maxZ - gridBlock * 4);
    const sidewalkRecords = getSideBuildingRecords()
      .filter((record) => record.sign === TRON_RUNNER_SIDEWALK_SIGN && record.basePad?.hitPolygon?.length)
      .sort((a, b) => Math.abs(a.mesh.position.z - anchorZ) - Math.abs(b.mesh.position.z - anchorZ));
    const sidewalkRecord = sidewalkRecords[0];
    const pad = sidewalkRecord?.basePad;
    const padLocalXs = pad?.innerHitPolygon?.length ? pad.innerHitPolygon.map(([x]) => x) : pad?.hitPolygon?.map(([x]) => x);
    const padLocalZs = pad?.innerHitPolygon?.length ? pad.innerHitPolygon.map(([, z]) => z) : pad?.hitPolygon?.map(([, z]) => z);
    const padMinZ = padLocalZs?.length ? Math.min(...padLocalZs) + pad.border.position.z : minZ;
    const padMaxZ = padLocalZs?.length ? Math.max(...padLocalZs) + pad.border.position.z : maxZ;
    const padInnerEdgeX = padLocalXs?.length
      ? (TRON_RUNNER_SIDEWALK_SIGN < 0 ? Math.max(...padLocalXs) : Math.min(...padLocalXs))
      : 0;
    const x = pad
      ? pad.border.position.x + padInnerEdgeX + TRON_RUNNER_SIDEWALK_SIGN * TRON_RUNNER_SIDEWALK_INSET
      : TRON_RUNNER_SIDEWALK_SIGN * Math.max(10, getRoadHalf() + getStreetEdgeWidth() + TRON_RUNNER_SIDEWALK_INSET);
    const padStartZ = THREE.MathUtils.clamp(anchorZ - gridBlock * 1.6, padMinZ + 2, padMaxZ - 2);
    const padEndZ = THREE.MathUtils.clamp(anchorZ - gridBlock * 6.2, padMinZ + 2, padMaxZ - 2);
    const zA = Math.abs(padStartZ - padEndZ) > 4 ? padStartZ : THREE.MathUtils.clamp(padMaxZ - 3, minZ, maxZ);
    const zB = Math.abs(padStartZ - padEndZ) > 4 ? padEndZ : THREE.MathUtils.clamp(padMinZ + 3, minZ, maxZ);
    return {
      mode: 'sidewalk-line',
      x,
      zA,
      zB,
      padZ: sidewalkRecord?.mesh.position.z ?? null,
    };
  }

  function loadGltf() {
    const Loader = loadGltfClass();
    return new Promise((resolve, reject) => {
      new Loader().load(TRON_RUNNER_MODEL_URL, resolve, undefined, reject);
    });
  }

  async function load() {
    const Loader = loadGltfClass();
    if (!TRON_RUNNER_ENABLED || !Loader) {
      runnerState.error = Loader ? '' : 'GLTF loader unavailable';
      return false;
    }
    const route = routeSpec();
    runnerState.route = route;
    runnerState.doorHalfHeight = doorHalfHeight();
    runnerState.surfaceY = surfaceYAt(route.x, route.zA);
    resetTronRunnerAutonomy({
      autonomy,
      footstepBus: npcSpatialBus,
    });
    updateAutonomyState(route);
    try {
      const sourceReflectionNeeded = TRON_RUNNER_SOURCE_CHARACTER_VISIBLE && TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED;
      const [gltf, reflectionGltf] = await Promise.all([
        loadGltf(),
        sourceReflectionNeeded ? loadGltf() : Promise.resolve(null),
      ]);
      runnerWalker.clear();
      const model = gltf.scene;
      model.name = 'soldier-rigged-runner-city';
      model.rotation.y = Math.PI;
      runnerParts.materials = [];
      runnerParts.reflectionMaterials = [];
      runnerParts.reflectionBodyMaterials = [];
      runnerParts.reflectionLedMaterials = [];
      runnerParts.realShadowCasterCount = 0;
      runnerParts.dynamicReflectionMeshCount = 0;
      runnerParts.dynamicReflectionLedMeshCount = 0;
      runnerParts.revealScan = null;
      model.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.frustumCulled = false;
        obj.castShadow = TRON_RUNNER_REAL_SHADOW_ENABLED;
        obj.receiveShadow = false;
        obj.layers.enable(TRON_RUNNER_REAL_SHADOW_LAYER);
        if (TRON_RUNNER_REAL_SHADOW_ENABLED) runnerParts.realShadowCasterCount += 1;
        obj.material = runnerSuitMaterial.clone();
        runnerParts.materials.push(obj.material);
      });
      fitTronRunnerModel(model, TRON_RUNNER_TARGET_HEIGHT);
      runnerWalker.add(model);
      const revealScan = reveal.makeScan();
      runnerWalker.add(revealScan);

      let reflectionGroup = null;
      let reflectionModel = null;
      let reflectionLedModel = null;
      let reflectionMixer = null;
      let reflectionLedMixer = null;
      let reflectionActionSet = { actions: {}, actionNames: null };
      let reflectionLedActionSet = { actions: {}, actionNames: null };
      if (reflectionGltf?.scene) {
        reflectionGroup = new THREE.Group();
        reflectionGroup.name = 'tron-runner-dynamic-reflection';
        reflectionGroup.position.y = TRON_RUNNER_DYNAMIC_REFLECTION_Y;
        reflectionGroup.scale.set(1, -TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE, 1);
        reflectionGroup.visible = false;
        reflectionModel = reflectionGltf.scene;
        reflectionModel.name = 'soldier-rigged-runner-city-reflection';
        reflectionModel.rotation.y = Math.PI;
        fitTronRunnerModel(reflectionModel, TRON_RUNNER_TARGET_HEIGHT);
        const cloneSkeleton = cloneRunnerSkeleton();
        reflectionLedModel = cloneSkeleton
          ? cloneSkeleton(reflectionModel)
          : reflectionModel.clone(true);
        reflectionLedModel.name = 'soldier-rigged-runner-city-reflection-led';
        reflectionModel.traverse((obj) => {
          if (!obj.isMesh) return;
          obj.frustumCulled = false;
          obj.castShadow = false;
          obj.receiveShadow = false;
          obj.renderOrder = TRON_RUNNER_DYNAMIC_REFLECTION_BODY_RENDER_ORDER;
          obj.material = makeReflectionBodyMaterial();
          runnerParts.reflectionMaterials.push(obj.material);
          runnerParts.reflectionBodyMaterials.push(obj.material);
          runnerParts.dynamicReflectionMeshCount += 1;
        });
        reflectionLedModel.traverse((obj) => {
          if (!obj.isMesh) return;
          obj.frustumCulled = false;
          obj.castShadow = false;
          obj.receiveShadow = false;
          obj.renderOrder = TRON_RUNNER_DYNAMIC_REFLECTION_LED_RENDER_ORDER;
          obj.material = makeReflectionLedMaterial();
          runnerParts.reflectionMaterials.push(obj.material);
          runnerParts.reflectionLedMaterials.push(obj.material);
          runnerParts.dynamicReflectionLedMeshCount += 1;
        });
        reflectionGroup.add(reflectionModel);
        reflectionGroup.add(reflectionLedModel);
        runnerWalker.add(reflectionGroup);
        reflectionMixer = new THREE.AnimationMixer(reflectionModel);
        reflectionLedMixer = new THREE.AnimationMixer(reflectionLedModel);
        reflectionActionSet = makeTronRunnerActionSet(reflectionGltf, reflectionMixer);
        reflectionLedActionSet = makeTronRunnerActionSet(reflectionGltf, reflectionLedMixer);
      }

      const groundShadow = new THREE.Mesh(new THREE.CircleGeometry(1.15, 48), runnerShadowMaterial);
      groundShadow.rotation.x = -Math.PI / 2;
      groundShadow.position.set(0, 0.025, 0.2);
      groundShadow.scale.set(1, TRON_RUNNER_CONTACT_SHADOW_ROUNDNESS, 1);
      runnerWalker.add(groundShadow);

      const realShadowReceiver = new THREE.Mesh(
        new THREE.CircleGeometry(TRON_RUNNER_REAL_SHADOW_RECEIVER_RADIUS, 72),
        runnerRealShadowMaterial.clone()
      );
      realShadowReceiver.name = 'tron-runner-real-shadow-receiver';
      realShadowReceiver.rotation.x = -Math.PI / 2;
      realShadowReceiver.position.set(0, 0.012, 0.2);
      realShadowReceiver.receiveShadow = TRON_RUNNER_REAL_SHADOW_ENABLED;
      realShadowReceiver.castShadow = false;
      realShadowReceiver.depthWrite = false;
      realShadowReceiver.renderOrder = 3;
      realShadowReceiver.layers.enable(TRON_RUNNER_REAL_SHADOW_LAYER);
      runnerWalker.add(realShadowReceiver);

      const mixer = new THREE.AnimationMixer(model);
      const actionSet = makeTronRunnerActionSet(gltf, mixer);
      runnerParts.actionNames = actionSet.actionNames;
      runnerParts.model = model;
      runnerParts.mixer = mixer;
      runnerParts.actions = actionSet.actions;
      runnerParts.skeletonGlow = null;
      runnerParts.groundShadow = groundShadow;
      runnerParts.realShadowReceiver = realShadowReceiver;
      runnerParts.reflectionGroup = reflectionGroup;
      runnerParts.reflectionModel = reflectionModel;
      runnerParts.reflectionLedModel = reflectionLedModel;
      runnerParts.reflectionMixer = reflectionMixer;
      runnerParts.reflectionLedMixer = reflectionLedMixer;
      runnerParts.reflectionActions = reflectionActionSet.actions;
      runnerParts.reflectionLedActions = reflectionLedActionSet.actions;
      runnerParts.reflectionActionNames = reflectionActionSet.actionNames;
      runnerParts.reflectionLedActionNames = reflectionLedActionSet.actionNames;
      runnerParts.reflectionActiveAction = null;
      runnerParts.reflectionLedActiveAction = null;
      runnerParts.revealScan = revealScan;
      runnerParts.keyLight = null;
      runnerParts.leftRim = null;
      runnerParts.rightRim = null;
      runnerParts.lowFill = null;
      playTronRunnerAction({
        runnerParts,
        runnerState,
        effectiveTimeScale: effectiveAnimationSpeed(),
        kind: 'walk',
      });
      applyVisualControls();
      buildCrowd(model, gltf.animations);
      buildIdleCharacter(model);

      runnerMotion.elapsed = 0;
      runnerMotion.visualDistanceWalked = 0;
      runnerMotion.yaw = 0;
      runnerState.ready = true;
      runnerState.loaded = 1;
      runnerState.error = '';
      reveal.reset();
      update(0);
      return true;
    } catch (error) {
      runnerWalker.visible = false;
      runnerState.ready = false;
      runnerState.error = error?.message || String(error);
      console.warn('[tron-runner]', runnerState.error);
      return false;
    }
  }

  function update(dt) {
    if (!runnerState.ready && !runnerParts.model) return;
    runnerMotion.elapsed += Math.min(dt, 0.05);
    const route = runnerState.route || routeSpec();
    let x = route.x;
    let z = route.zA;
    let directionX = 0;
    let directionZ = 1;
    let movedDistance = 0;
    let collision = false;
    if (route.mode === 'free-roam') {
      const next = updateFreeRoam(dt, route);
      if (next) {
        x = next.x;
        z = next.z;
        directionX = next.directionX;
        directionZ = next.directionZ;
        movedDistance = next.movedDistance;
        collision = next.collision;
      }
    } else {
      const span = Math.max(1, Math.abs(route.zA - route.zB));
      const loopDistance = span * 2;
      const phase = ((TRON_RUNNER_ROUTE_OFFSET + runnerMotion.elapsed * getWalkSpeed() / loopDistance) % 1 + 1) % 1;
      const forwardLeg = phase < 0.5;
      const t = forwardLeg ? phase * 2 : (1 - phase) * 2;
      z = THREE.MathUtils.lerp(route.zA, route.zB, t);
      directionZ = route.zB >= route.zA
        ? (forwardLeg ? 1 : -1)
        : (forwardLeg ? -1 : 1);
      movedDistance = Math.hypot(x - runnerWalker.position.x, z - runnerWalker.position.z);
    }
    runnerMotion.targetYaw = Math.atan2(directionX, directionZ);
    runnerMotion.yaw = lerpAngle(runnerMotion.yaw, runnerMotion.targetYaw, Math.min(1, dt * 9));
    runnerWalker.position.set(x, surfaceYAt(x, z), z);
    runnerWalker.rotation.set(0, runnerMotion.yaw, 0);
    if (TRON_RUNNER_DISTANCE_DRIVEN_WALK_ENABLED && runnerParts.activeAction) {
      runnerMotion.visualDistanceWalked += movedDistance;
      syncTronRunnerActionSetToDistance({
        runnerParts,
        distance: runnerMotion.visualDistanceWalked,
      });
    } else {
      runnerParts.mixer?.update(dt);
      runnerParts.reflectionMixer?.update(dt);
      runnerParts.reflectionLedMixer?.update(dt);
    }
    if (runnerState.distanceDrivenWalk) {
      runnerState.distanceDrivenWalk.visualDistance = Number(runnerMotion.visualDistanceWalked.toFixed(3));
    }
    footstepRuntime.movedDistance = movedDistance;
    footstepRuntime.dt = dt;
    footstepRuntime.yaw = runnerMotion.yaw;
    footstepRuntime.walkSpeed = getWalkSpeed();
    updateTronRunnerAutonomyFootsteps(footstepRuntime);
    updateAutonomyState(route, movedDistance, collision);
    updateRealShadowRig();
    updateDynamicReflection();

    if (runnerParts.groundShadow) {
      if (!TRON_RUNNER_GROUND_SHADOW_ENABLED) {
        runnerParts.groundShadow.visible = false;
        runnerParts.groundShadow.material.userData.tronRunnerBaseOpacity = 0;
        runnerParts.groundShadow.material.opacity = 0;
        return;
      }
      const phasePulse = runnerMotion.elapsed * 4.65;
      const c = Math.cos(phasePulse);
      const shadowPulse = 1 + (1 - Math.abs(c)) * THREE.MathUtils.clamp(getShadowPulse(), 0, 1.5);
      const groundShadowOpacity = THREE.MathUtils.clamp(
        getFloorReflection() * 0.78 * shadowPulse,
        0,
        TRON_RUNNER_CONTACT_SHADOW_MAX_OPACITY
      );
      runnerParts.groundShadow.material.userData.tronRunnerBaseOpacity = groundShadowOpacity;
      runnerParts.groundShadow.material.opacity = groundShadowOpacity;
    }
  }

  function inspect() {
    if (runnerParts.model) {
      runnerBox.setFromObject(runnerWalker);
      runnerBox.getSize(runnerSize);
    } else {
      runnerSize.set(0, 0, 0);
    }
    const runnerMaterial = runnerParts.materials[0] || null;
    const realShadowMaterial = runnerParts.realShadowReceiver?.material || null;
    const realShadowReceiverType = realShadowMaterial?.isShadowMaterial || realShadowMaterial?.type === 'ShadowMaterial'
      ? 'shadow-material'
      : null;
    const groundShadowScaleX = runnerParts.groundShadow?.scale?.x ?? 0;
    const groundShadowScaleZ = runnerParts.groundShadow?.scale?.y ?? 0;
    return {
      ...runnerState,
      x: Number(runnerWalker.position.x.toFixed(2)),
      y: Number(runnerWalker.position.y.toFixed(2)),
      z: Number(runnerWalker.position.z.toFixed(2)),
      yaw: Number(runnerMotion.yaw.toFixed(3)),
      visible: runnerWalker.visible,
      sourceCharacterVisible: TRON_RUNNER_SOURCE_CHARACTER_VISIBLE,
      groundShadowVisible: Boolean(runnerParts.groundShadow?.visible),
      groundShadowOpacity: Number((runnerParts.groundShadow?.material?.opacity ?? 0).toFixed(3)),
      groundShadowScaleX: Number(groundShadowScaleX.toFixed(3)),
      groundShadowScaleZ: Number(groundShadowScaleZ.toFixed(3)),
      contactShadowRoundness: groundShadowScaleX > 0
        ? Number((groundShadowScaleZ / groundShadowScaleX).toFixed(3))
        : 0,
      shadowMapEnabled: Boolean(renderer.shadowMap?.enabled),
      shadowMapType: renderer.shadowMap?.type ?? null,
      realShadowEnabled: TRON_RUNNER_REAL_SHADOW_ENABLED,
      realShadowReceiverType,
      realShadowReceiverGeometryType: runnerParts.realShadowReceiver?.geometry?.type ?? null,
      realShadowReceiverRadius: TRON_RUNNER_REAL_SHADOW_RECEIVER_RADIUS,
      realShadowReceiverVisible: Boolean(runnerParts.realShadowReceiver?.visible),
      realShadowReceiverOpacity: Number((runnerParts.realShadowReceiver?.material?.opacity ?? 0).toFixed(3)),
      realShadowLightCastShadow: Boolean(runnerParts.realShadowLight?.castShadow),
      realShadowLightVisible: Boolean(runnerParts.realShadowLight?.visible),
      realShadowLightIntensity: Number((runnerParts.realShadowLight?.intensity ?? 0).toFixed(3)),
      realShadowMapSize: runnerParts.realShadowLight?.shadow?.mapSize?.x ?? 0,
      realShadowCasterCount: runnerParts.realShadowCasterCount,
      dynamicReflection: {
        enabled: TRON_RUNNER_DYNAMIC_REFLECTION_ENABLED,
        visible: Boolean(runnerParts.reflectionGroup?.visible),
        opacity: Number((runnerState.dynamicReflectionOpacity ?? 0).toFixed(3)),
        bodyOpacity: Number((runnerState.dynamicReflectionBodyOpacity ?? 0).toFixed(3)),
        ledOpacity: Number((runnerState.dynamicReflectionLedOpacity ?? 0).toFixed(3)),
        surface: runnerState.dynamicReflectionSurface,
        meshCount: runnerParts.dynamicReflectionMeshCount,
        ledMeshCount: runnerParts.dynamicReflectionLedMeshCount,
        animated: Boolean(runnerParts.reflectionMixer && runnerParts.reflectionLedMixer),
        yScale: TRON_RUNNER_DYNAMIC_REFLECTION_Y_SCALE,
      },
      suitColorHex: runnerMaterial?.color?.getHexString?.() ?? null,
      suitEmissiveHex: runnerMaterial?.emissive?.getHexString?.() ?? null,
      suitEmissiveIntensity: Number((runnerMaterial?.emissiveIntensity ?? 0).toFixed(3)),
      suitTextureMode: TRON_RUNNER_SUIT_TEXTURE_MODE,
      suitMapEnabled: Boolean(runnerMaterial?.map?.isTexture),
      suitEmissiveMapEnabled: Boolean(runnerMaterial?.emissiveMap?.isTexture),
      ledStripCount: 0,
      ledStripIntensity: 0,
      modelLineIntensity: Number((runnerState.modelLineIntensity ?? 0).toFixed(3)),
      skeletonHelperPresent: Boolean(runnerParts.skeletonGlow),
      skeletonHelperVisible: Boolean(runnerParts.skeletonGlow?.visible),
      keyLightLayerMask: null,
      modelLightLayerEnabled: false,
      pointLightCount: [
        runnerParts.keyLight,
        runnerParts.leftRim,
        runnerParts.rightRim,
        runnerParts.lowFill,
      ].filter(Boolean).length,
      heightFromRoad: Number((runnerWalker.position.y - roadTileTopY()).toFixed(2)),
      surface: runnerState.surface,
      sizeX: Number(runnerSize.x.toFixed(2)),
      sizeY: Number(runnerSize.y.toFixed(2)),
      sizeZ: Number(runnerSize.z.toFixed(2)),
    };
  }

  return {
    load,
    update,
    inspect,
    routeSpec,
    updateFreeRoam,
    updateAutonomyState,
  };
}
