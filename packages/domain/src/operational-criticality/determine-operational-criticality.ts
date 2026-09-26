/** A valid Gregorian calendar date supplied by a trusted domain boundary. */
export interface CivilDate {
  readonly year: number
  readonly month: number
  readonly day: number
}

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

function differenceInCivilDays(
  estimatedArrivalDate: CivilDate,
  evaluationDate: CivilDate,
): number {
  return (
    toGregorianOrdinal(estimatedArrivalDate) -
    toGregorianOrdinal(evaluationDate)
  )
}

function toGregorianOrdinal(date: CivilDate): number {
  const completedYears = date.year - 1

  return (
    completedYears * 365 +
    Math.floor(completedYears / 4) -
    Math.floor(completedYears / 100) +
    Math.floor(completedYears / 400) +
    daysBeforeMonth(date) +
    date.day
  )
}

function daysBeforeMonth(date: CivilDate): number {
  const baseDays = Math.floor((367 * date.month - 362) / 12)

  if (date.month <= 2) {
    return baseDays
  }

  return baseDays + (isGregorianLeapYear(date.year) ? -1 : -2)
}

function isGregorianLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
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
