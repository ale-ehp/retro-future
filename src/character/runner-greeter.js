// Chi ti accoglie: dove nasce, come ti porta davanti al tabellone dei reparti, come ti
// guarda mentre parla e cosa dice.
//
// Spostato qui da runner-crowd-runtime.js senza cambiare una riga (tappa 5, 2026-09-19).
// Quel file era 1.506 righe, l'unico di src/ sopra il limite di 1.500, e questo era il
// pezzo con la giuntura piu' pulita: non legge e non scrive niente del resto del file,
// tutto quello che gli serve arriva dai parametri.
// Quello che dice chi ti accoglie quando ti porta davanti al tabellone. Il <br> e' la riga
// in cui spezzare il cartello, non decorazione: senza, il testo esce dal pannello.
export const GREETER_FOLLOW_BUBBLE_TEXT = { it: 'Seguimi', en: 'Follow me' };

export const GREETER_BOARD_BUBBLE_TEXT = {
  it: 'Qui puoi vedere<br>i nostri reparti',
  en: 'Here you can see<br>our departments',
};

export const TRON_RUNNER_GREETER_START_SIDE_OFFSET = 2.8;
export const TRON_RUNNER_GREETER_START_BACK_OFFSET = 16;
export const TRON_RUNNER_GREETER_GREET_DISTANCE = 7.4;
// La seconda riga resta 'avstudio.ai' in entrambe le lingue: e' quella che
// speech-bubbles.js riconosce per disegnarci il logo al posto del testo.
export const TRON_RUNNER_WELCOME_BUBBLE_TEXT = {
  it: 'Benvenuto in<br>avstudio.ai',
  en: 'Welcome to<br>avstudio.ai',
};
export const TRON_RUNNER_WELCOME_BUBBLE_DURATION_MS = 3600;
// Meta' di quanto era (2026-09-19): 1.55 riempiva mezzo schermo da vicino.
export const TRON_RUNNER_WELCOME_BUBBLE_SIZE_SCALE = 0.775;
export const TRON_RUNNER_FOLLOW_PROMPT_DELAY_MS = 1500;

export function tronRunnerGreeterStartPosition({
  droneLandingPose,
  routeStart,
  sideOffset = TRON_RUNNER_GREETER_START_SIDE_OFFSET,
  backOffset = TRON_RUNNER_GREETER_START_BACK_OFFSET,
} = {}) {
  const landingX = Number.isFinite(droneLandingPose?.x) ? droneLandingPose.x : 0;
  const baseZ = Number.isFinite(droneLandingPose?.z)
    ? droneLandingPose.z
    : (Number.isFinite(routeStart?.z) ? routeStart.z : 0);
  const y = Number.isFinite(routeStart?.y) ? routeStart.y : 0;
  return {
    x: landingX + sideOffset,
    y,
    z: baseZ - backOffset,
  };
}

const greeterBoardAnchorScratch = { x: 0, z: 0, cx: 0, cz: 0 };

export function resolveGreeterBoardAnchorRuntime({
  getCityDepartmentBoards,
  sideGap,
  frontGap,
}) {
  const boards = getCityDepartmentBoards();
  if (!boards || !boards.length) return null;
  const board = boards.find((b) => b?.group?.visible && b?.boardPosition) || boards[0];
  if (!board || !board.boardPosition) return null;
  const yaw = board.yaw || 0;
  const halfWidth = (board.boardWidth || 21) * 0.5;
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);
  const normalX = Math.sin(yaw);
  const normalZ = Math.cos(yaw);
  greeterBoardAnchorScratch.x = board.boardPosition.x + rightX * (halfWidth + sideGap) + normalX * frontGap;
  greeterBoardAnchorScratch.z = board.boardPosition.z + rightZ * (halfWidth + sideGap) + normalZ * frontGap;
  greeterBoardAnchorScratch.cx = board.boardPosition.x;
  greeterBoardAnchorScratch.cz = board.boardPosition.z;
  return greeterBoardAnchorScratch;
}

export function switchGreeterActionToRunRuntime(mixer, fromAction, runActionKey, member) {
  if (!mixer || !member.runClip) return null;
  const run = member[runActionKey] || mixer.clipAction(member.runClip);
  member[runActionKey] = run;
  run.enabled = true;
  run.setEffectiveTimeScale(1);
  run.setEffectiveWeight(1);
  run.play();
  if (fromAction && fromAction !== run) {
    fromAction.stop();
    fromAction.setEffectiveWeight(0);
  }
  return run;
}

// Hard-switch idle -> run weights: the run clip is driven by ground distance,
// so a crossfade would not progress when mixer.update(0) is used for sync.
export function startGreeterWalkingToBoardRuntime(member) {
  member.greetPosed = false;
  if (member.runClip && member.mixer) {
    member.walkAction = member.walkAction || member.action;
    const run = switchGreeterActionToRunRuntime(member.mixer, member.idleAction || member.walkAction, 'runAction', member);
    if (run) member.action = run;
    const rRun = switchGreeterActionToRunRuntime(member.reflectionMixer, member.reflectionIdleAction || member.reflectionAction, 'reflectionRunAction', member);
    if (rRun) member.reflectionAction = rRun;
    const lRun = switchGreeterActionToRunRuntime(member.reflectionLedMixer, member.reflectionLedIdleAction || member.reflectionLedAction, 'reflectionLedRunAction', member);
    if (lRun) member.reflectionLedAction = lRun;
    return;
  }
  const walk = member.action;
  const idle = member.idleAction;
  if (walk) {
    walk.enabled = true;
    walk.setEffectiveTimeScale(1);
    walk.setEffectiveWeight(1);
    walk.play();
  }
  if (idle) {
    idle.stop();
    idle.setEffectiveWeight(0);
  }
  if (member.reflectionAction) {
    member.reflectionAction.enabled = true;
    member.reflectionAction.setEffectiveWeight(1);
    member.reflectionAction.play();
  }
  if (member.reflectionIdleAction) {
    member.reflectionIdleAction.stop();
    member.reflectionIdleAction.setEffectiveWeight(0);
  }
  if (member.reflectionLedAction) {
    member.reflectionLedAction.enabled = true;
    member.reflectionLedAction.setEffectiveWeight(1);
    member.reflectionLedAction.play();
  }
  if (member.reflectionLedIdleAction) {
    member.reflectionLedIdleAction.stop();
    member.reflectionLedIdleAction.setEffectiveWeight(0);
  }
}

export function applyGreeterHeadLookRuntime({
  camera,
  maxYaw,
  yawSign,
  lerpAngle,
}, member, dt) {
  if (!member.headBone) {
    member.model?.traverse((object) => {
      if (!member.headBone && object.isBone && /head$/i.test(object.name)) member.headBone = object;
    });
  }
  if (!member.headBone) return;
  const lookYaw = Math.atan2(camera.position.x - member.group.position.x, camera.position.z - member.group.position.z);
  let rel = lookYaw - member.group.rotation.y;
  rel = Math.atan2(Math.sin(rel), Math.cos(rel));
  rel = Math.min(maxYaw, Math.max(-maxYaw, rel)) * yawSign;
  member.headLookYaw = lerpAngle(member.headLookYaw ?? 0, rel, Math.min(1, dt * 4));
  member.headBone.rotation.y = member.headLookYaw;
  if (!member.reflectionHeadBone && member.reflectionModel) {
    member.reflectionModel.traverse((object) => {
      if (!member.reflectionHeadBone && object.isBone && /head$/i.test(object.name)) {
        member.reflectionHeadBone = object;
      }
    });
  }
  if (member.reflectionHeadBone) member.reflectionHeadBone.rotation.y = member.headLookYaw;
}

export function setGreeterBubbleRuntime(member, html, durationMs, now, sizeScale = 1) {
  member.bubbleText = html;
  member.bubbleUntil = now + durationMs;
  member.bubbleSizeScale = sizeScale;
  member.bubbleProximity = false;
}
