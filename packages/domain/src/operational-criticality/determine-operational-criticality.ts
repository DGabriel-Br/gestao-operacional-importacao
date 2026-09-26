import { differenceInCivilDays, type CivilDate } from '../civil-date.js'

export type { CivilDate } from '../civil-date.js'

export type OperationalCriticality = 1 | 2 | 3 | 4

export interface OperationalCriticalityFacts {
  readonly estimatedArrivalDate: CivilDate | undefined
  readonly hasArrival: boolean
  readonly evaluationDate: CivilDate
}

export type OperationalCriticalityReasonCode =
  | 'MISSING_ETA'
  | 'CARGO_ARRIVED'
  | 'ETA_DAY_DIFFERENCE_AT_MOST_FIVE'
  | 'ETA_DAY_DIFFERENCE_AT_MOST_SEVEN'
  | 'ETA_DAY_DIFFERENCE_BEYOND_SEVEN'

export interface ClassifiedOperationalCriticalityDecision {
  readonly classificationStatus: 'classified'
  readonly criticality: OperationalCriticality
  readonly reasonCode: Exclude<OperationalCriticalityReasonCode, 'MISSING_ETA'>
  readonly evaluatedFacts: OperationalCriticalityFacts
  readonly issues: readonly []
}

export interface UnclassifiedOperationalCriticalityDecision {
  readonly classificationStatus: 'unclassified'
  readonly criticality: undefined
  readonly reasonCode: 'MISSING_ETA'
  readonly evaluatedFacts: OperationalCriticalityFacts
  readonly issues: readonly []
}

export type OperationalCriticalityDecision =
  | ClassifiedOperationalCriticalityDecision
  | UnclassifiedOperationalCriticalityDecision

export function determineOperationalCriticality(
  facts: OperationalCriticalityFacts,
): OperationalCriticalityDecision {
  if (facts.estimatedArrivalDate === undefined) {
    return unclassified(facts)
  }

  if (facts.hasArrival) {
    return classified(4, 'CARGO_ARRIVED', facts)
  }

  const etaDayDifference = differenceInCivilDays(
    facts.estimatedArrivalDate,
    facts.evaluationDate,
  )

  if (etaDayDifference <= 5) {
    return classified(3, 'ETA_DAY_DIFFERENCE_AT_MOST_FIVE', facts)
  }

  if (etaDayDifference <= 7) {
    return classified(2, 'ETA_DAY_DIFFERENCE_AT_MOST_SEVEN', facts)
  }

  return classified(1, 'ETA_DAY_DIFFERENCE_BEYOND_SEVEN', facts)
}

function classified(
  criticality: OperationalCriticality,
  reasonCode: Exclude<OperationalCriticalityReasonCode, 'MISSING_ETA'>,
  evaluatedFacts: OperationalCriticalityFacts,
): ClassifiedOperationalCriticalityDecision {
  return {
    classificationStatus: 'classified',
    criticality,
    reasonCode,
    evaluatedFacts,
    issues: [],
  }
}

function unclassified(
  evaluatedFacts: OperationalCriticalityFacts,
): UnclassifiedOperationalCriticalityDecision {
  return {
    classificationStatus: 'unclassified',
    criticality: undefined,
    reasonCode: 'MISSING_ETA',
    evaluatedFacts,
    issues: [],
  }
}
