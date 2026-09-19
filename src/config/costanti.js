// Costanti pure di main.js, spostate qui senza cambiare una virgola (tappa 5, 2026-09-19).
//
// Solo numeri, stringhe e oggetti congelati che non dipendono da niente a runtime: la
// configurazione, non la logica. main.js le importa con lo stesso nome, cosi' il codice che
// le usa non cambia. I commenti che le accompagnavano sono venuti con loro.

// ---------- pannello controlli ----------
export const CHARACTER_BUBBLE_BG_OPACITY_RANGE_MULTIPLIER = 3;

// ---------- giocatore: spawn, camera, passi ----------
export const PLAYER_SPAWN_KEY = 'tron-boulevard-player-spawn';

export const PLAYER_SPAWN_LEGACY_Z = 842.7866151854931;

export const PLAYER_SPAWN_DEFAULT_Z = 866.7866151854931;

export const DRONE_LANDING_KEY = 'tron-boulevard-drone-landing';

export const PITCH_LIMIT = Math.PI * 0.49;

export const DEMO_START_KEY = 'Space';

export const welcomeWindowMotionAllowed = false;

export const DRAG_ACTIVATE_PX = 4;

export const POINTER_LOCK_SETTLE_MS = 220;

export const POINTER_CLICK_SUPPRESS_MS = 420;

export const WALK_SURFACE_SNAP_TOLERANCE = 0.45;

export const FOOTSTEP_MIN_INTERVAL_MS = 105;

export const FOOTSTEP_PLAYER_BUS = 'player-local';

export const FOOTSTEP_NPC_SPATIAL_BUS = 'npc-spatial';

export const FOOTSTEP_PLAYER_VOLUME_SCALE = 1.2;

// ---------- strada e confini ----------
export const roadBaseY = -1.55;

export const ROAD_BOUNDARY_ROW_MAX = 10;

// Player-vs-person stop distance (centre to centre). Tight so you can get nearly
// shoulder-to-shoulder before being blocked, unlike the wall collision padding.
export const TRON_RUNNER_CROWD_PLAYER_COLLISION_DISTANCE = 1.6;

// ---------- folla e chi accoglie ----------
// Occasional standstill at a waypoint so the crowd reads as people, not marchers.
// Distance-driven walk freezes the legs while paused (no moonwalk).
export const TRON_RUNNER_CROWD_PAUSE_CHANCE = 0.28;

export const TRON_RUNNER_CROWD_PAUSE_MIN_MS = 900;

export const TRON_RUNNER_CROWD_PAUSE_MAX_MS = 2800;

// The green companion (member index 1) greets the player: it walks over deliberately
// when the city is revealed, stops at a welcoming distance and turns to face the player,
// then stays put. The cyan member behaves like a normal crowd member.
export const TRON_RUNNER_GREETER_INDEX = 1;

export const GREETER_SPEED_MULTIPLIER = 1.155; // 30% slower than the previous 1.65 approach pace

export const GREETER_RUN_SPEED_BOOST = 3.064;  // keeps board run 30% faster overall after slower approach

export const GREETER_HEAD_MAX_YAW = 1.3963; // +/-80deg => 160deg total head turn, no neck over-rotation

export const GREETER_HEAD_YAW_SIGN = 1;

// After the welcome bubble dissolves the greeter walks over to the departures board
// (the "12 reparti" tabellone) and posts up just past its right-hand edge, facing the player.
// 2026-09-19: era 2.4, e da li' il cartello di chi accoglie andava a sovrapporsi al terminale
// contatti. Spostato piu' a destra: il cartello ha dove stare senza doversi scansare.
export const GREETER_BOARD_SIDE_GAP = 5.2;  // clearance beyond the board's right edge (world units)

export const GREETER_BOARD_FRONT_GAP = 1.4; // step toward the player off the board plane (no clipping)

export const GREETER_BOARD_REACH = 0.8;     // arrival radius at the board anchor

export const GREETER_BOARD_BUBBLE_RANGE = 32.0; // "Qui vedi i nostri reparti" shows within 32m of the greeter

export const GREETER_BOARD_STANCE_DEG = 45; // at the board the body sits 45deg between player and board

// ---------- resa e boot ----------
// Mobile renders at a FIXED target pixel ratio instead of the adaptive ~720p
// budget. Lowered to 1.7 (user decision): fill scales with pixel COUNT, so 1.7x
// is (1.7/2)^2 = 0.72 = ~28% fewer pixels than 2x, and FXAA hides the softness.
// A forced ratio (mobile default or ?pixelRatio=N) pins the render resolution:
// it bypasses the mobile caps + adaptive target, and disables the auto quality
// downscaler (tunePerformanceBudget) so it stays put in a benchmark.
// ?pixelRatio=2 still forces the old resolution for A/B.
export const MOBILE_TARGET_PIXEL_RATIO = 1.7;

export const SCENE_TEXTURE_PREWARM_KEYS = Object.freeze([
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
  'alphaMap',
  'aoMap',
  'bumpMap',
  'displacementMap',
  'lightMap',
  'specularMap',
  'envMap',
]);
