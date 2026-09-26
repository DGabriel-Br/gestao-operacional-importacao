import { describe, expect, it } from 'vitest'
import {
  determineOperationalCriticality,
  type CivilDate,
} from '../operational-criticality/determine-operational-criticality.js'
import type { OperationalStage } from '../operational-stages/determine-operational-stage.js'
import {
  determineOperationalAlert,
  type OperationalAlert,
  type OperationalAlertFacts,
  type OperationalAlertReasonCode,
} from './determine-operational-alert.js'

const evaluationDate = civilDate(2026, 9, 26)

function civilDate(year: number, month: number, day: number): CivilDate {
  return { year, month, day }
}

function facts(
  overrides: Partial<OperationalAlertFacts> = {},
): OperationalAlertFacts {
  return {
    stage: 'TYPING_COMPLETED',
    blockingDeviationCount: 0,
    nonBlockingDeviationCount: 0,
    estimatedArrivalDate: undefined,
    hasArrival: false,
    evaluationDate,
    ...overrides,
  }
}

function expectAlert(
  input: OperationalAlertFacts,
  alert: OperationalAlert,
  reasonCode: OperationalAlertReasonCode,
): void {
  expect(determineOperationalAlert(input)).toEqual({
    alert,
    reasonCode,
    evaluatedFacts: input,
    issues: [],
  })
}

describe('operational alert stage mapping', () => {
  it('requires attention when the stage asks for observation review', () => {
    const input = facts({ stage: 'REVIEW_OBSERVATION' })

    expectAlert(
      input,
      'UNIDENTIFIED_EVENT',
      'STAGE_REQUIRES_OBSERVATION_REVIEW',
    )
  })

  it('requires correction when the stage represents a typing error', () => {
    const input = facts({ stage: 'TYPING_ERROR' })

    expectAlert(
      input,
      'TYPING_ERROR_REQUIRES_CORRECTION',
      'TYPING_ERROR_PRESENT',
    )
  })

  it.each<
    [
      stage: OperationalStage,
      alert: OperationalAlert,
      reasonCode: OperationalAlertReasonCode,
    ]
  >([
    [
      'CRITICAL_ANALYSIS',
      'CRITICAL_ANALYSIS_IN_PROGRESS',
      'ALERT_MAPPED_FROM_STAGE',
    ],
    ['AWAITING_TYPING', 'READY_TO_SEND_TO_TYPING', 'ALERT_MAPPED_FROM_STAGE'],
    ['TYPING', 'TYPING_IN_PROGRESS', 'ALERT_MAPPED_FROM_STAGE'],
    [
      'TYPING_COMPLETED',
      'NO_OPERATIONAL_ACTION',
      'NO_OPERATIONAL_ACTION_FOR_STAGE',
    ],
    [
      'AWAITING_MERCANTE',
      'NO_OPERATIONAL_ACTION',
      'NO_OPERATIONAL_ACTION_FOR_STAGE',
    ],
    ['READY_FOR_REVIEW', 'READY_TO_SEND_TO_REVIEW', 'ALERT_MAPPED_FROM_STAGE'],
    ['IN_REVIEW', 'AWAITING_REVIEW_RETURN', 'ALERT_MAPPED_FROM_STAGE'],
    ['AWAITING_REGISTRATION', 'READY_TO_REGISTER', 'ALERT_MAPPED_FROM_STAGE'],
    ['AWAITING_CCT', 'AWAITING_CCT_OPENING', 'ALERT_MAPPED_FROM_STAGE'],
  ])('maps stage %s to alert %s without ETA', (stage, alert, reasonCode) => {
    expectAlert(facts({ stage }), alert, reasonCode)
  })
})

describe('pending operational alerts', () => {
  it('preserves one blocking deviation in the evaluated facts', () => {
    const input = facts({
      stage: 'PENDING',
      blockingDeviationCount: 1,
    })

    expectAlert(
      input,
      'BLOCKING_DEVIATIONS_OPEN',
      'PENDING_HAS_BLOCKING_DEVIATIONS',
    )
    expect(
      determineOperationalAlert(input).evaluatedFacts.blockingDeviationCount,
    ).toBe(1)
  })

  it('preserves multiple blocking deviations and gives them precedence over non-blocking deviations', () => {
    const input = facts({
      stage: 'PENDING',
      blockingDeviationCount: 3,
      nonBlockingDeviationCount: 4,
    })

    expectAlert(
      input,
      'BLOCKING_DEVIATIONS_OPEN',
      'PENDING_HAS_BLOCKING_DEVIATIONS',
    )
  })

  it('reports only non-blocking deviations when no blocking deviation exists', () => {
    const input = facts({
      stage: 'PENDING',
      nonBlockingDeviationCount: 2,
    })

    expectAlert(
      input,
      'ONLY_NON_BLOCKING_DEVIATIONS',
      'PENDING_HAS_ONLY_NON_BLOCKING_DEVIATIONS',
    )
  })

  it('reports an inconsistency when pending has no open deviation', () => {
    const input = facts({ stage: 'PENDING' })

    expectAlert(
      input,
      'PENDING_WITHOUT_OPEN_DEVIATION',
      'PENDING_HAS_NO_OPEN_DEVIATIONS',
    )
  })
})

describe('legacy IFS precedence', () => {
  const overdueEta = civilDate(2026, 9, 25)

  it.each<
    [
      description: string,
      overrides: Partial<OperationalAlertFacts>,
      alert: OperationalAlert,
      reasonCode: OperationalAlertReasonCode,
    ]
  >([
    [
      'observation review',
      { stage: 'REVIEW_OBSERVATION' },
      'UNIDENTIFIED_EVENT',
      'STAGE_REQUIRES_OBSERVATION_REVIEW',
    ],
    [
      'pending with blocking deviations',
      { stage: 'PENDING', blockingDeviationCount: 2 },
      'BLOCKING_DEVIATIONS_OPEN',
      'PENDING_HAS_BLOCKING_DEVIATIONS',
    ],
    [
      'pending with only non-blocking deviations',
      { stage: 'PENDING', nonBlockingDeviationCount: 2 },
      'ONLY_NON_BLOCKING_DEVIATIONS',
      'PENDING_HAS_ONLY_NON_BLOCKING_DEVIATIONS',
    ],
    [
      'pending without deviations',
      { stage: 'PENDING' },
      'PENDING_WITHOUT_OPEN_DEVIATION',
      'PENDING_HAS_NO_OPEN_DEVIATIONS',
    ],
    [
      'typing error',
      { stage: 'TYPING_ERROR' },
      'TYPING_ERROR_REQUIRES_CORRECTION',
      'TYPING_ERROR_PRESENT',
    ],
  ])(
    'keeps %s ahead of an overdue ETA',
    (_description, overrides, alert, reasonCode) => {
      expectAlert(
        facts({ ...overrides, estimatedArrivalDate: overdueEta }),
        alert,
        reasonCode,
      )
    },
  )

  it.each<OperationalStage>([
    'CRITICAL_ANALYSIS',
    'AWAITING_TYPING',
    'TYPING',
    'AWAITING_MERCANTE',
    'READY_FOR_REVIEW',
    'IN_REVIEW',
    'AWAITING_REGISTRATION',
    'AWAITING_CCT',
    'TYPING_COMPLETED',
  ])('lets an overdue ETA override the normal alert for %s', (stage) => {
    expectAlert(
      facts({ stage, estimatedArrivalDate: overdueEta }),
      'ETA_OVERDUE_WITHOUT_ARRIVAL',
      'ETA_IS_OVERDUE_WITHOUT_ARRIVAL',
    )
  })

  it('does not report overdue when arrival is present', () => {
    expectAlert(
      facts({
        stage: 'READY_FOR_REVIEW',
        estimatedArrivalDate: overdueEta,
        hasArrival: true,
      }),
      'READY_TO_SEND_TO_REVIEW',
      'ALERT_MAPPED_FROM_STAGE',
    )
  })
})

describe('future ETA priority window', () => {
  it.each<
    [
      stage: Extract<
        OperationalStage,
        'CRITICAL_ANALYSIS' | 'AWAITING_TYPING' | 'TYPING'
      >,
      eta: CivilDate,
      alert: OperationalAlert,
      reasonCode: OperationalAlertReasonCode,
    ]
  >([
    [
      'CRITICAL_ANALYSIS',
      civilDate(2026, 9, 26),
      'PRIORITIZE_CRITICAL_ANALYSIS',
      'ETA_WITHIN_FIVE_DAYS_FOR_CRITICAL_ANALYSIS',
    ],
    [
      'CRITICAL_ANALYSIS',
      civilDate(2026, 10, 1),
      'PRIORITIZE_CRITICAL_ANALYSIS',
      'ETA_WITHIN_FIVE_DAYS_FOR_CRITICAL_ANALYSIS',
    ],
    [
      'AWAITING_TYPING',
      civilDate(2026, 10, 1),
      'PRIORITIZE_SEND_TO_TYPING',
      'ETA_WITHIN_FIVE_DAYS_FOR_AWAITING_TYPING',
    ],
    [
      'TYPING',
      civilDate(2026, 10, 1),
      'PRIORITIZE_TYPING',
      'ETA_WITHIN_FIVE_DAYS_FOR_TYPING',
    ],
  ])('prioritizes %s for ETA %o', (stage, eta, alert, reasonCode) => {
    expectAlert(facts({ stage, estimatedArrivalDate: eta }), alert, reasonCode)
  })

  it.each<[stage: OperationalStage, alert: OperationalAlert]>([
    ['CRITICAL_ANALYSIS', 'CRITICAL_ANALYSIS_IN_PROGRESS'],
    ['AWAITING_TYPING', 'READY_TO_SEND_TO_TYPING'],
    ['TYPING', 'TYPING_IN_PROGRESS'],
  ])(
    'uses the normal alert for %s when ETA is six days away',
    (stage, alert) => {
      expectAlert(
        facts({ stage, estimatedArrivalDate: civilDate(2026, 10, 2) }),
        alert,
        'ALERT_MAPPED_FROM_STAGE',
      )
    },
  )

  it('keeps future priority even when arrival is present', () => {
    expectAlert(
      facts({
        stage: 'CRITICAL_ANALYSIS',
        estimatedArrivalDate: civilDate(2026, 10, 1),
        hasArrival: true,
      }),
      'PRIORITIZE_CRITICAL_ANALYSIS',
      'ETA_WITHIN_FIVE_DAYS_FOR_CRITICAL_ANALYSIS',
    )
  })

  it('does not prioritize a stage outside the three characterized priority branches', () => {
    expectAlert(
      facts({
        stage: 'AWAITING_MERCANTE',
        estimatedArrivalDate: civilDate(2026, 9, 26),
      }),
      'NO_OPERATIONAL_ACTION',
      'NO_OPERATIONAL_ACTION_FOR_STAGE',
    )
  })

  it('does not reuse criticality 3 as the future priority condition for an overdue ETA', () => {
    const estimatedArrivalDate = civilDate(2026, 9, 6)

    expect(
      determineOperationalCriticality({
        estimatedArrivalDate,
        hasArrival: false,
        evaluationDate,
      }).criticality,
    ).toBe(3)

    expectAlert(
      facts({
        stage: 'CRITICAL_ANALYSIS',
        estimatedArrivalDate,
      }),
      'ETA_OVERDUE_WITHOUT_ARRIVAL',
      'ETA_IS_OVERDUE_WITHOUT_ARRIVAL',
    )
  })

  it.each<[stage: OperationalStage, alert: OperationalAlert]>([
    ['CRITICAL_ANALYSIS', 'CRITICAL_ANALYSIS_IN_PROGRESS'],
    ['AWAITING_TYPING', 'READY_TO_SEND_TO_TYPING'],
    ['TYPING', 'TYPING_IN_PROGRESS'],
  ])('does not prioritize %s when ETA is absent', (stage, alert) => {
    expectAlert(facts({ stage }), alert, 'ALERT_MAPPED_FROM_STAGE')
  })

  it.each([
    [civilDate(2026, 1, 31), civilDate(2026, 2, 5)],
    [civilDate(2025, 12, 31), civilDate(2026, 1, 5)],
  ])(
    'uses calendar days across evaluation %o and ETA %o',
    (caseEvaluationDate, estimatedArrivalDate) => {
      expectAlert(
        facts({
          stage: 'TYPING',
          evaluationDate: caseEvaluationDate,
          estimatedArrivalDate,
        }),
        'PRIORITIZE_TYPING',
        'ETA_WITHIN_FIVE_DAYS_FOR_TYPING',
      )
    },
  )
})

describe('deviation count independence outside pending', () => {
  it('ignores blocking deviation count outside pending', () => {
    expectAlert(
      facts({ stage: 'IN_REVIEW', blockingDeviationCount: 7 }),
      'AWAITING_REVIEW_RETURN',
      'ALERT_MAPPED_FROM_STAGE',
    )
  })

  it('ignores non-blocking deviation count outside pending', () => {
    expectAlert(
      facts({ stage: 'AWAITING_CCT', nonBlockingDeviationCount: 7 }),
      'AWAITING_CCT_OPENING',
      'ALERT_MAPPED_FROM_STAGE',
    )
  })
})
