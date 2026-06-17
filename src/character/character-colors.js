import * as THREE from 'three';
import {
  TRON_RUNNER_SUIT_COLOR,
  TRON_RUNNER_SUIT_EMISSIVE,
} from './characters.js';

export const TRON_RUNNER_CROWD_COLOR_PLAN = [
  'current',
  'orange',
  'current',
  'red',
  'green',
  'current',
  'orange',
  'red',
  'current',
  'green',
  'purple',
  'blue',
  'magenta',
  'gold',
  'ice',
];

export const TRON_RUNNER_CROWD_COLOR_PRESETS = {
  current: {
    label: 'current',
    name: 'current cyan',
    bodyColor: TRON_RUNNER_SUIT_COLOR.clone(),
    emissiveColor: TRON_RUNNER_SUIT_EMISSIVE.clone(),
    reflectionLedColor: new THREE.Color(0xbaffff),
  },
  orange: {
    label: 'orange',
    name: 'orange',
    bodyColor: new THREE.Color(0xffb168),
    emissiveColor: new THREE.Color(0xff7a20),
    reflectionLedColor: new THREE.Color(0xff9d35),
  },
  red: {
    label: 'red',
    name: 'red',
    bodyColor: new THREE.Color(0xff6a6a),
    emissiveColor: new THREE.Color(0xff2536),
    reflectionLedColor: new THREE.Color(0xff4350),
  },
  green: {
    label: 'green',
    name: 'green',
    bodyColor: new THREE.Color(0x66ff9a),
    emissiveColor: new THREE.Color(0x2fd37a),
    reflectionLedColor: new THREE.Color(0x57ff93),
  },
  purple: {
    label: 'purple',
    name: 'purple',
    bodyColor: new THREE.Color(0xc985ff),
    emissiveColor: new THREE.Color(0x9d4dff),
    reflectionLedColor: new THREE.Color(0xd6a6ff),
  },
  blue: {
    label: 'blue',
    name: 'blue',
    bodyColor: new THREE.Color(0x78aaff),
    emissiveColor: new THREE.Color(0x2f75ff),
    reflectionLedColor: new THREE.Color(0x74b6ff),
  },
  magenta: {
    label: 'magenta',
    name: 'magenta',
    bodyColor: new THREE.Color(0xff78d6),
    emissiveColor: new THREE.Color(0xff35b2),
    reflectionLedColor: new THREE.Color(0xff91df),
  },
  gold: {
    label: 'gold',
    name: 'gold',
    bodyColor: new THREE.Color(0xffe078),
    emissiveColor: new THREE.Color(0xffc536),
    reflectionLedColor: new THREE.Color(0xffe98a),
  },
  ice: {
    label: 'ice',
    name: 'ice',
    bodyColor: new THREE.Color(0xb9fbff),
    emissiveColor: new THREE.Color(0x63f1ff),
    reflectionLedColor: new THREE.Color(0xc5ffff),
  },
};
