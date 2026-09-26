import { differenceInCivilDays, type CivilDate } from '../civil-date.js'
import type { OperationalStage } from '../operational-stages/determine-operational-stage.js'

export type OperationalAlert =
  | 'UNIDENTIFIED_EVENT'
  | 'BLOCKING_DEVIATIONS_OPEN'
  | 'ONLY_NON_BLOCKING_DEVIATIONS'
  | 'PENDING_WITHOUT_OPEN_DEVIATION'
  | 'TYPING_ERROR_REQUIRES_CORRECTION'
  | 'ETA_OVERDUE_WITHOUT_ARRIVAL'
  | 'PRIORITIZE_CRITICAL_ANALYSIS'
  | 'PRIORITIZE_SEND_TO_TYPING'
  | 'PRIORITIZE_TYPING'
  | 'CRITICAL_ANALYSIS_IN_PROGRESS'
  | 'READY_TO_SEND_TO_TYPING'
  | 'TYPING_IN_PROGRESS'
  | 'NO_OPERATIONAL_ACTION'
  | 'READY_TO_SEND_TO_REVIEW'
  | 'AWAITING_REVIEW_RETURN'
  | 'READY_TO_REGISTER'
  | 'AWAITING_CCT_OPENING'

export type OperationalAlertReasonCode =
  | 'STAGE_REQUIRES_OBSERVATION_REVIEW'
  | 'PENDING_HAS_BLOCKING_DEVIATIONS'
  | 'PENDING_HAS_ONLY_NON_BLOCKING_DEVIATIONS'
  | 'PENDING_HAS_NO_OPEN_DEVIATIONS'
  | 'TYPING_ERROR_PRESENT'
  | 'ETA_IS_OVERDUE_WITHOUT_ARRIVAL'
  | 'ETA_WITHIN_FIVE_DAYS_FOR_CRITICAL_ANALYSIS'
  | 'ETA_WITHIN_FIVE_DAYS_FOR_AWAITING_TYPING'
  | 'ETA_WITHIN_FIVE_DAYS_FOR_TYPING'
  | 'ALERT_MAPPED_FROM_STAGE'
  | 'NO_OPERATIONAL_ACTION_FOR_STAGE'

/** Deviation counts represent open deviations with a classified impact. */
export interface OperationalAlertFacts {
  readonly stage: OperationalStage
  readonly blockingDeviationCount: number
  readonly nonBlockingDeviationCount: number
  readonly estimatedArrivalDate: CivilDate | undefined
  readonly hasArrival: boolean
  readonly evaluationDate: CivilDate
}

export interface OperationalAlertDecision {
  readonly alert: OperationalAlert
  readonly reasonCode: OperationalAlertReasonCode
  readonly evaluatedFacts: OperationalAlertFacts
  readonly issues: readonly []
}

type StageHandledBeforeDefault =
  'REVIEW_OBSERVATION' | 'PENDING' | 'TYPING_ERROR'

type DefaultAlertStage = Exclude<OperationalStage, StageHandledBeforeDefault>

interface StageAlertMapping {
  readonly alert: OperationalAlert
  readonly reasonCode:
    'ALERT_MAPPED_FROM_STAGE' | 'NO_OPERATIONAL_ACTION_FOR_STAGE'
}

const DEFAULT_ALERT_BY_STAGE = {
  CRITICAL_ANALYSIS: {
    alert: 'CRITICAL_ANALYSIS_IN_PROGRESS',
    reasonCode: 'ALERT_MAPPED_FROM_STAGE',
  },
  AWAITING_TYPING: {
    alert: 'READY_TO_SEND_TO_TYPING',
    reasonCode: 'ALERT_MAPPED_FROM_STAGE',
  },
  TYPING: {
    alert: 'TYPING_IN_PROGRESS',
    reasonCode: 'ALERT_MAPPED_FROM_STAGE',
  },
  TYPING_COMPLETED: {
    alert: 'NO_OPERATIONAL_ACTION',
    reasonCode: 'NO_OPERATIONAL_ACTION_FOR_STAGE',
  },
  AWAITING_MERCANTE: {
    alert: 'NO_OPERATIONAL_ACTION',
    reasonCode: 'NO_OPERATIONAL_ACTION_FOR_STAGE',
  },
  AWAITING_CCT: {
    alert: 'AWAITING_CCT_OPENING',
    reasonCode: 'ALERT_MAPPED_FROM_STAGE',
  },
  READY_FOR_REVIEW: {
    alert: 'READY_TO_SEND_TO_REVIEW',
    reasonCode: 'ALERT_MAPPED_FROM_STAGE',
  },
  IN_REVIEW: {
    alert: 'AWAITING_REVIEW_RETURN',
    reasonCode: 'ALERT_MAPPED_FROM_STAGE',
  },
  AWAITING_REGISTRATION: {
    alert: 'READY_TO_REGISTER',
    reasonCode: 'ALERT_MAPPED_FROM_STAGE',
  },
} as const satisfies Record<DefaultAlertStage, StageAlertMapping>

export function determineOperationalAlert(
  facts: OperationalAlertFacts,
): OperationalAlertDecision {
  const { stage } = facts

  if (stage === 'REVIEW_OBSERVATION') {
    return decision(
      'UNIDENTIFIED_EVENT',
      'STAGE_REQUIRES_OBSERVATION_REVIEW',
      facts,
    )
  }

  if (stage === 'PENDING') {
    return determinePendingAlert(facts)
  }

  if (stage === 'TYPING_ERROR') {
    return decision(
      'TYPING_ERROR_REQUIRES_CORRECTION',
      'TYPING_ERROR_PRESENT',
      facts,
    )
  }

  const etaDayDifference =
    facts.estimatedArrivalDate === undefined
      ? undefined
      : differenceInCivilDays(facts.estimatedArrivalDate, facts.evaluationDate)

  if (
    etaDayDifference !== undefined &&
    etaDayDifference < 0 &&
    !facts.hasArrival
  ) {
    return decision(
      'ETA_OVERDUE_WITHOUT_ARRIVAL',
      'ETA_IS_OVERDUE_WITHOUT_ARRIVAL',
      facts,
    )
  }

  if (
    etaDayDifference !== undefined &&
    etaDayDifference >= 0 &&
    etaDayDifference <= 5
  ) {
    if (stage === 'CRITICAL_ANALYSIS') {
      return decision(
        'PRIORITIZE_CRITICAL_ANALYSIS',
        'ETA_WITHIN_FIVE_DAYS_FOR_CRITICAL_ANALYSIS',
        facts,
      )
    }

    if (stage === 'AWAITING_TYPING') {
      return decision(
        'PRIORITIZE_SEND_TO_TYPING',
        'ETA_WITHIN_FIVE_DAYS_FOR_AWAITING_TYPING',
        facts,
      )
    }

    if (stage === 'TYPING') {
      return decision(
        'PRIORITIZE_TYPING',
        'ETA_WITHIN_FIVE_DAYS_FOR_TYPING',
        facts,
      )
    }
  }

  const mapping = DEFAULT_ALERT_BY_STAGE[stage]

  return decision(mapping.alert, mapping.reasonCode, facts)
}

function determinePendingAlert(
  facts: OperationalAlertFacts,
): OperationalAlertDecision {
  if (facts.blockingDeviationCount > 0) {
    return decision(
      'BLOCKING_DEVIATIONS_OPEN',
      'PENDING_HAS_BLOCKING_DEVIATIONS',
      facts,
    )
  }

  if (facts.nonBlockingDeviationCount > 0) {
    return decision(
      'ONLY_NON_BLOCKING_DEVIATIONS',
      'PENDING_HAS_ONLY_NON_BLOCKING_DEVIATIONS',
      facts,
    )
  }

  return decision(
    'PENDING_WITHOUT_OPEN_DEVIATION',
    'PENDING_HAS_NO_OPEN_DEVIATIONS',
    facts,
  )
}

function decision(
  alert: OperationalAlert,
  reasonCode: OperationalAlertReasonCode,
  evaluatedFacts: OperationalAlertFacts,
): OperationalAlertDecision {
  return { alert, reasonCode, evaluatedFacts, issues: [] }
}
