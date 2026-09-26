export type DeviationLifecycle = 'OPEN' | 'CLOSED'

/** `hasEnd` must represent confirmed presence or confirmed absence. */
export interface DeviationLifecycleFacts {
  readonly hasEnd: boolean
}

export type DeviationLifecycleReasonCode =
  'MISSING_END_MEANS_OPEN' | 'END_PRESENT_MEANS_CLOSED'

export interface DeviationLifecycleDecision {
  readonly lifecycle: DeviationLifecycle
  readonly reasonCode: DeviationLifecycleReasonCode
  readonly evaluatedFacts: DeviationLifecycleFacts
  readonly issues: readonly []
}

export function determineDeviationLifecycle(
  facts: DeviationLifecycleFacts,
): DeviationLifecycleDecision {
  return facts.hasEnd
    ? {
        lifecycle: 'CLOSED',
        reasonCode: 'END_PRESENT_MEANS_CLOSED',
        evaluatedFacts: facts,
        issues: [],
      }
    : {
        lifecycle: 'OPEN',
        reasonCode: 'MISSING_END_MEANS_OPEN',
        evaluatedFacts: facts,
        issues: [],
      }
}
