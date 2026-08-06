import assert from 'node:assert/strict';
import test from 'node:test';

import {
  boardPerimeterPoseSignature,
  resolveBoardPerimeterPose,
} from './board-perimeter-pose.js';

const record = {
  civicNumberValue: 2,
  mesh: { position: { x: 80, z: 760 } },
  basePad: {
    border: { position: { x: 4, z: 7 } },
    hitPolygon: [[40, 740], [100, 740], [100, 770], [40, 770]],
  },
  civicNumberGroup: { position: { x: 9999, y: 9999, z: 9999 } },
};

test('board perimeter pose uses the structural pad on the start-player side', () => {
  assert.deepEqual(resolveBoardPerimeterPose(record, {
    bottomY: 4.1,
    boardHeight: 15.75,
    playerZ: 800,
    innerSlide: 0.68,
  }), {
    x: 53.599999999999994,
    y: 11.975,
    z: 777.35,
    yaw: 0,
    perimeterSide: 'start-player',
    perimeterSynced: true,
  });
});

test('board perimeter pose flips toward a player on the opposite Z side', () => {
  const pose = resolveBoardPerimeterPose(record, {
    bottomY: 4.1,
    boardHeight: 15.75,
    playerZ: 700,
    innerSlide: 0.68,
  });

  assert.equal(pose.z, 746.65);
  assert.equal(pose.yaw, Math.PI);
  assert.equal(pose.perimeterSide, 'start-player');
});

test('animated civic-number coordinates cannot change board placement or signatures', () => {
  const options = {
    bottomY: 4.1,
    boardHeight: 15.75,
    playerZ: 800,
    innerSlide: 0.68,
  };
  const beforePose = resolveBoardPerimeterPose(record, options);
  const beforeSignature = boardPerimeterPoseSignature(record, options);
  record.civicNumberGroup.position = { x: -5000, y: -5000, z: -5000 };

  assert.deepEqual(resolveBoardPerimeterPose(record, options), beforePose);
  assert.equal(boardPerimeterPoseSignature(record, options), beforeSignature);
});

test('board perimeter pose falls back to the building center without pad geometry', () => {
  assert.deepEqual(resolveBoardPerimeterPose({
    mesh: { position: { x: -12, z: 34 } },
  }, {
    bottomY: 2,
    boardHeight: 10,
    playerZ: 90,
    innerSlide: 0.68,
  }), {
    x: -12,
    y: 7,
    z: 34,
    yaw: 0,
    perimeterSide: 'record-center',
    perimeterSynced: false,
  });
});
