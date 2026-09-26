import { describe, expect, it } from 'vitest'
import {
  determineOperationalStage,
  type OperationalStage,
  type OperationalStageFacts,
  type StageOperationalEvent,
  type StageTransportMode,
} from './determine-operational-stage.js'

function typingCompletedFacts(
  overrides: Partial<
    Extract<OperationalStageFacts, { event: 'TYPING_COMPLETED' }>
  > = {},
): Extract<OperationalStageFacts, { event: 'TYPING_COMPLETED' }> {
  return {
    event: 'TYPING_COMPLETED',
    transportMode: 'unknown',
    hasMercanteReference: false,
    ...overrides,
  }
}

const directlyMappedEvents: readonly [
  event: Exclude<StageOperationalEvent, 'TYPING_COMPLETED' | 'UNIDENTIFIED'>,
  expectedStage: OperationalStage,
][] = [
  ['CRITICAL_ANALYSIS_STARTED', 'CRITICAL_ANALYSIS'],
  ['PENDING_ISSUE_REPORTED', 'PENDING'],
  ['PENDING_ISSUES_RETURNED', 'AWAITING_TYPING'],
  ['PROCESS_SENT_TO_TYPING', 'TYPING'],
  ['SENT_TO_TYPING', 'TYPING'],
  ['DUIMP_GENERATION_ERROR', 'TYPING_ERROR'],
  ['PROCESS_SENT_TO_REVIEW', 'IN_REVIEW'],
  ['SENT_TO_REVIEW', 'IN_REVIEW'],
  ['PROCESS_REVIEWED', 'AWAITING_REGISTRATION'],
]

describe('operational stage determination', () => {
  it.each(directlyMappedEvents)('maps %s to %s', (event, expectedStage) => {
    const input = { event } as const

    expect(determineOperationalStage(input)).toEqual({
      stage: expectedStage,
      reasonCode: 'STAGE_MAPPED_FROM_EVENT',
      evaluatedFacts: input,
      issues: [],
    })
  })

  it('requires observation review for an unidentified event', () => {
    const input = { event: 'UNIDENTIFIED' } as const

    expect(determineOperationalStage(input)).toEqual({
      stage: 'REVIEW_OBSERVATION',
      reasonCode: 'UNIDENTIFIED_EVENT_REQUIRES_REVIEW',
      evaluatedFacts: input,
      issues: [],
    })
  })

  it('awaits Mercante after completed typing for maritime transport without a reference', () => {
    const input = typingCompletedFacts({
      transportMode: 'maritime',
      hasMercanteReference: false,
    })

    expect(determineOperationalStage(input)).toEqual({
      stage: 'AWAITING_MERCANTE',
      reasonCode: 'TYPING_COMPLETED_MARITIME_WITHOUT_MERCANTE',
      evaluatedFacts: input,
      issues: [],
    })
  })

  it('is ready for review after completed typing for maritime transport with a reference', () => {
    const input = typingCompletedFacts({
      transportMode: 'maritime',
      hasMercanteReference: true,
    })

    expect(determineOperationalStage(input)).toEqual({
      stage: 'READY_FOR_REVIEW',
      reasonCode: 'TYPING_COMPLETED_MARITIME_WITH_MERCANTE',
      evaluatedFacts: input,
      issues: [],
    })
  })

  it.each([false, true])(
    'awaits CCT after completed typing for air transport with Mercante reference %s',
    (hasMercanteReference) => {
      const input = typingCompletedFacts({
        transportMode: 'air',
        hasMercanteReference,
      })

      expect(determineOperationalStage(input)).toEqual({
        stage: 'AWAITING_CCT',
        reasonCode: 'TYPING_COMPLETED_AIR',
        evaluatedFacts: input,
        issues: [],
      })
    },
  )

  it.each<StageTransportMode>(['other', 'unknown'])(
    'keeps typing completed as the stage for %s transport',
    (transportMode) => {
      const input = typingCompletedFacts({
        transportMode,
        hasMercanteReference: true,
      })

      expect(determineOperationalStage(input)).toEqual({
        stage: 'TYPING_COMPLETED',
        reasonCode: 'TYPING_COMPLETED_OTHER_MODE',
        evaluatedFacts: input,
        issues: [],
      })
    },
  )

  it.each<[StageTransportMode, boolean]>([
    ['air', false],
    ['air', true],
    ['maritime', false],
    ['maritime', true],
    ['other', false],
    ['other', true],
    ['unknown', false],
    ['unknown', true],
  ])(
    'ignores transport %s and Mercante reference %s for a directly mapped event',
    (transportMode, hasMercanteReference) => {
      const inputWithIrrelevantFacts = {
        event: 'PENDING_ISSUE_REPORTED',
        transportMode,
        hasMercanteReference,
      } as const

      const result = determineOperationalStage(inputWithIrrelevantFacts)

      expect(result.stage).toBe('PENDING')
      expect(result.reasonCode).toBe('STAGE_MAPPED_FROM_EVENT')
      expect(result.evaluatedFacts).toEqual({
        event: 'PENDING_ISSUE_REPORTED',
      })
    },
  )
})
