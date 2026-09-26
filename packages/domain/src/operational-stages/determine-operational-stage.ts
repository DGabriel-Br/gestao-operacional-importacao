import type { OperationalEvent } from '../operational-events/operational-event.js'

export type OperationalStage =
  | 'CRITICAL_ANALYSIS'
  | 'PENDING'
  | 'AWAITING_TYPING'
  | 'TYPING'
  | 'TYPING_ERROR'
  | 'TYPING_COMPLETED'
  | 'AWAITING_MERCANTE'
  | 'AWAITING_CCT'
  | 'READY_FOR_REVIEW'
  | 'IN_REVIEW'
  | 'AWAITING_REGISTRATION'
  | 'REVIEW_OBSERVATION'

export type StageOperationalEvent = OperationalEvent | 'UNIDENTIFIED'

export type StageTransportMode = 'air' | 'maritime' | 'other' | 'unknown'

type DirectStageEvent = Exclude<
  StageOperationalEvent,
  'TYPING_COMPLETED' | 'UNIDENTIFIED'
>

export type OperationalStageFacts =
  | Readonly<{
      event: DirectStageEvent | 'UNIDENTIFIED'
    }>
  | Readonly<{
      event: 'TYPING_COMPLETED'
      transportMode: StageTransportMode
      hasMercanteReference: boolean
    }>

export type OperationalStageReasonCode =
  | 'STAGE_MAPPED_FROM_EVENT'
  | 'UNIDENTIFIED_EVENT_REQUIRES_REVIEW'
  | 'TYPING_COMPLETED_MARITIME_WITHOUT_MERCANTE'
  | 'TYPING_COMPLETED_MARITIME_WITH_MERCANTE'
  | 'TYPING_COMPLETED_AIR'
  | 'TYPING_COMPLETED_OTHER_MODE'

export interface OperationalStageDecision {
  readonly stage: OperationalStage
  readonly reasonCode: OperationalStageReasonCode
  readonly evaluatedFacts: OperationalStageFacts
  readonly issues: readonly []
}

const DIRECT_STAGE_BY_EVENT = {
  CRITICAL_ANALYSIS_STARTED: 'CRITICAL_ANALYSIS',
  PENDING_ISSUE_REPORTED: 'PENDING',
  PENDING_ISSUES_RETURNED: 'AWAITING_TYPING',
  PROCESS_SENT_TO_TYPING: 'TYPING',
  SENT_TO_TYPING: 'TYPING',
  DUIMP_GENERATION_ERROR: 'TYPING_ERROR',
  PROCESS_SENT_TO_REVIEW: 'IN_REVIEW',
  SENT_TO_REVIEW: 'IN_REVIEW',
  PROCESS_REVIEWED: 'AWAITING_REGISTRATION',
} as const satisfies Record<DirectStageEvent, OperationalStage>

export function determineOperationalStage(
  facts: OperationalStageFacts,
): OperationalStageDecision {
  if (facts.event === 'TYPING_COMPLETED') {
    return determineTypingCompletedStage(facts)
  }

  if (facts.event === 'UNIDENTIFIED') {
    return decision(
      'REVIEW_OBSERVATION',
      'UNIDENTIFIED_EVENT_REQUIRES_REVIEW',
      { event: facts.event },
    )
  }

  return decision(
    DIRECT_STAGE_BY_EVENT[facts.event],
    'STAGE_MAPPED_FROM_EVENT',
    { event: facts.event },
  )
}

function determineTypingCompletedStage(
  facts: Extract<OperationalStageFacts, { event: 'TYPING_COMPLETED' }>,
): OperationalStageDecision {
  switch (facts.transportMode) {
    case 'air':
      return decision('AWAITING_CCT', 'TYPING_COMPLETED_AIR', facts)

    case 'maritime':
      return facts.hasMercanteReference
        ? decision(
            'READY_FOR_REVIEW',
            'TYPING_COMPLETED_MARITIME_WITH_MERCANTE',
            facts,
          )
        : decision(
            'AWAITING_MERCANTE',
            'TYPING_COMPLETED_MARITIME_WITHOUT_MERCANTE',
            facts,
          )

    case 'other':
      return decision('TYPING_COMPLETED', 'TYPING_COMPLETED_OTHER_MODE', facts)

    case 'unknown':
      return decision('TYPING_COMPLETED', 'TYPING_COMPLETED_OTHER_MODE', facts)
  }

  return assertNever(facts.transportMode)
}

function decision(
  stage: OperationalStage,
  reasonCode: OperationalStageReasonCode,
  evaluatedFacts: OperationalStageFacts,
): OperationalStageDecision {
  return { stage, reasonCode, evaluatedFacts, issues: [] }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected stage transport mode: ${String(value)}`)
}
