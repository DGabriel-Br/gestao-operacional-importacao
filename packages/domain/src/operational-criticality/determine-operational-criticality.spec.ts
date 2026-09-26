import { describe, expect, it } from 'vitest'
import {
  determineOperationalCriticality,
  type CivilDate,
  type OperationalCriticality,
  type OperationalCriticalityFacts,
  type OperationalCriticalityReasonCode,
} from './determine-operational-criticality.js'

const evaluationDate = civilDate(2026, 9, 26)

function civilDate(year: number, month: number, day: number): CivilDate {
  return { year, month, day }
}

function facts(
  overrides: Partial<OperationalCriticalityFacts> = {},
): OperationalCriticalityFacts {
  return {
    estimatedArrivalDate: undefined,
    hasArrival: false,
    evaluationDate,
    ...overrides,
  }
}

const etaDifferenceCases: readonly [
  description: string,
  estimatedArrivalDate: CivilDate,
  expectedCriticality: OperationalCriticality,
  expectedReasonCode: OperationalCriticalityReasonCode,
][] = [
  [
    'ETA on the evaluation date',
    civilDate(2026, 9, 26),
    3,
    'ETA_DAY_DIFFERENCE_AT_MOST_FIVE',
  ],
  [
    'ETA one day after the evaluation date',
    civilDate(2026, 9, 27),
    3,
    'ETA_DAY_DIFFERENCE_AT_MOST_FIVE',
  ],
  [
    'ETA exactly five days after the evaluation date',
    civilDate(2026, 10, 1),
    3,
    'ETA_DAY_DIFFERENCE_AT_MOST_FIVE',
  ],
  [
    'ETA six days after the evaluation date',
    civilDate(2026, 10, 2),
    2,
    'ETA_DAY_DIFFERENCE_AT_MOST_SEVEN',
  ],
  [
    'ETA exactly seven days after the evaluation date',
    civilDate(2026, 10, 3),
    2,
    'ETA_DAY_DIFFERENCE_AT_MOST_SEVEN',
  ],
  [
    'ETA eight days after the evaluation date',
    civilDate(2026, 10, 4),
    1,
    'ETA_DAY_DIFFERENCE_BEYOND_SEVEN',
  ],
  [
    'ETA far after the evaluation date',
    civilDate(2027, 9, 26),
    1,
    'ETA_DAY_DIFFERENCE_BEYOND_SEVEN',
  ],
  [
    'ETA one day before the evaluation date',
    civilDate(2026, 9, 25),
    3,
    'ETA_DAY_DIFFERENCE_AT_MOST_FIVE',
  ],
  [
    'ETA twenty days before the evaluation date',
    civilDate(2026, 9, 6),
    3,
    'ETA_DAY_DIFFERENCE_AT_MOST_FIVE',
  ],
]

const calendarBoundaryCases: readonly [
  description: string,
  evaluationDate: CivilDate,
  estimatedArrivalDate: CivilDate,
  expectedCriticality: OperationalCriticality,
][] = [
  ['a leap-day crossing', civilDate(2024, 2, 25), civilDate(2024, 3, 2), 2],
  ['a month crossing', civilDate(2026, 1, 31), civilDate(2026, 2, 6), 2],
  ['a year crossing', civilDate(2025, 12, 31), civilDate(2026, 1, 6), 2],
  [
    'the non-leap secular year 2100',
    civilDate(2100, 2, 25),
    civilDate(2100, 3, 2),
    3,
  ],
  [
    'the leap year 2000 divisible by 400',
    civilDate(2000, 2, 25),
    civilDate(2000, 3, 2),
    2,
  ],
]

describe('operational criticality determination', () => {
  it('leaves criticality unclassified when ETA and arrival are absent', () => {
    const input = facts()

    expect(determineOperationalCriticality(input)).toEqual({
      classificationStatus: 'unclassified',
      criticality: undefined,
      reasonCode: 'MISSING_ETA',
      evaluatedFacts: input,
      issues: [],
    })
  })

  it('leaves criticality unclassified when arrival exists without ETA', () => {
    const input = facts({ hasArrival: true })

    expect(determineOperationalCriticality(input)).toEqual({
      classificationStatus: 'unclassified',
      criticality: undefined,
      reasonCode: 'MISSING_ETA',
      evaluatedFacts: input,
      issues: [],
    })
  })

  it('classifies arrived cargo as 4 when ETA is on the evaluation date', () => {
    const input = facts({
      estimatedArrivalDate: civilDate(2026, 9, 26),
      hasArrival: true,
    })

    expect(determineOperationalCriticality(input)).toEqual({
      classificationStatus: 'classified',
      criticality: 4,
      reasonCode: 'CARGO_ARRIVED',
      evaluatedFacts: input,
      issues: [],
    })
  })

  it('classifies arrived cargo as 4 for a distant ETA without requiring an arrival date', () => {
    const input = facts({
      estimatedArrivalDate: civilDate(2027, 9, 26),
      hasArrival: true,
    })

    expect(determineOperationalCriticality(input)).toEqual({
      classificationStatus: 'classified',
      criticality: 4,
      reasonCode: 'CARGO_ARRIVED',
      evaluatedFacts: input,
      issues: [],
    })
  })

  it.each(etaDifferenceCases)(
    'classifies %s',
    (
      _description,
      estimatedArrivalDate,
      expectedCriticality,
      expectedReasonCode,
    ) => {
      const input = facts({ estimatedArrivalDate })

      expect(determineOperationalCriticality(input)).toEqual({
        classificationStatus: 'classified',
        criticality: expectedCriticality,
        reasonCode: expectedReasonCode,
        evaluatedFacts: input,
        issues: [],
      })
    },
  )

  it.each(calendarBoundaryCases)(
    'uses Gregorian calendar days across %s',
    (
      _description,
      caseEvaluationDate,
      estimatedArrivalDate,
      expectedCriticality,
    ) => {
      const result = determineOperationalCriticality(
        facts({
          estimatedArrivalDate,
          evaluationDate: caseEvaluationDate,
        }),
      )

      expect(result.classificationStatus).toBe('classified')
      expect(result.criticality).toBe(expectedCriticality)
    },
  )

  it('treats source times already projected to the same civil date identically', () => {
    const morningEtaAsCivilDate = civilDate(2026, 9, 26)
    const lateEvaluationAsCivilDate = civilDate(2026, 9, 26)

    const result = determineOperationalCriticality(
      facts({
        estimatedArrivalDate: morningEtaAsCivilDate,
        evaluationDate: lateEvaluationAsCivilDate,
      }),
    )

    expect(result.classificationStatus).toBe('classified')
    expect(result.criticality).toBe(3)
    expect(result.reasonCode).toBe('ETA_DAY_DIFFERENCE_AT_MOST_FIVE')
  })
})
