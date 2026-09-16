export interface RecoveryMetrics {
  initialFailureDetected: boolean;
  recoveryAttempted: boolean;
  recoverySuccessful: boolean;
  recoverySteps: number;
  recoveryDurationMs: number;
  recoveryCostUsd: number;
  recoveryScore: number; // 0.0 to 1.0
}

export class RecoveryEvaluator {
  public static evaluate(
    initialFailure: boolean,
    finalPassed: boolean,
    stepsAfterFailure: number,
    durationMs: number,
    costUsd: number
  ): RecoveryMetrics {
    if (!initialFailure) {
      // If there was no initial failure, recovery wasn't needed
      return {
        initialFailureDetected: false,
        recoveryAttempted: false,
        recoverySuccessful: true,
        recoverySteps: 0,
        recoveryDurationMs: 0,
        recoveryCostUsd: 0,
        recoveryScore: 1.0,
      };
    }

    const recoveryAttempted = stepsAfterFailure > 0;
    const recoverySuccessful = initialFailure && finalPassed;

    let recoveryScore = 0.0;
    if (recoverySuccessful) {
      // Higher score if recovered in fewer steps
      recoveryScore = Math.max(0.5, 1.0 - stepsAfterFailure * 0.05);
    } else if (recoveryAttempted) {
      recoveryScore = 0.25; // partial credit for attempting recovery
    }

    return {
      initialFailureDetected: true,
      recoveryAttempted,
      recoverySuccessful,
      recoverySteps: stepsAfterFailure,
      recoveryDurationMs: durationMs,
      recoveryCostUsd: costUsd,
      recoveryScore,
    };
  }
}
