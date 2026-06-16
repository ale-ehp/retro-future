export function tronRunnerPhaseCrossed(previous, current, target) {
  if (previous === null || previous === undefined) return false;
  if (current >= previous) return previous < target && current >= target;
  return previous < target || current >= target;
}

export function tronRunnerWalkCycleFootstep({
  phase,
  movedDistance,
  previousPhase,
  footstepPhase,
  lastFootstepIndex,
  footstepSide,
  contacts,
  strideLength,
}) {
  if (phase !== null) {
    if (movedDistance <= 0.001 || previousPhase === null) {
      return {
        contact: { triggered: false, syncSource: 'walk-cycle', phase },
        nextWalkCyclePhase: phase,
        nextFootstepPhase: footstepPhase,
        nextFootstepIndex: lastFootstepIndex,
        nextFootstepSide: footstepSide,
      };
    }
    for (const contact of contacts) {
      if (tronRunnerPhaseCrossed(previousPhase, phase, contact.phase)) {
        return {
          contact: { triggered: true, side: contact.side, syncSource: 'walk-cycle', phase },
          nextWalkCyclePhase: phase,
          nextFootstepPhase: footstepPhase,
          nextFootstepIndex: lastFootstepIndex,
          nextFootstepSide: footstepSide,
        };
      }
    }
    return {
      contact: { triggered: false, syncSource: 'walk-cycle', phase },
      nextWalkCyclePhase: phase,
      nextFootstepPhase: footstepPhase,
      nextFootstepIndex: lastFootstepIndex,
      nextFootstepSide: footstepSide,
    };
  }

  const nextFootstepPhase = footstepPhase + movedDistance / strideLength * Math.PI;
  const nextStepIndex = Math.floor(nextFootstepPhase / Math.PI);
  if (movedDistance <= 0.001 || nextStepIndex === lastFootstepIndex) {
    return {
      contact: { triggered: false, syncSource: 'distance-phase' },
      nextWalkCyclePhase: previousPhase,
      nextFootstepPhase,
      nextFootstepIndex: lastFootstepIndex,
      nextFootstepSide: footstepSide,
    };
  }
  const nextFootstepSide = 1 - footstepSide;
  return {
    contact: {
      triggered: true,
      side: nextFootstepSide ? 'right' : 'left',
      syncSource: 'distance-phase',
    },
    nextWalkCyclePhase: previousPhase,
    nextFootstepPhase,
    nextFootstepIndex: nextStepIndex,
    nextFootstepSide,
  };
}
