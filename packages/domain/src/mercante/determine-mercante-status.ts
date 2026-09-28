import { differenceInCivilDays, type CivilDate } from '../civil-date.js'
import type { DigitalOriginalStatus } from '../digital-original/determine-digital-original-status.js'
import type { MercanteEvidence } from './recognize-mercante-evidence.js'

export type MercanteTransportMode = 'air' | 'maritime' | 'other' | 'unknown'

export type MercanteStatus =
  | 'NOT_APPLICABLE'
  | 'PENDING'
  | 'CHECKED'
  | 'MISSING_WITHIN_SEVEN_DAYS'
  | 'AWAITING_OPENING'
  | 'AWAITING_DIGITAL_ORIGINAL'
  | 'READY_TO_CHECK'
  | 'VERIFY'
  | 'UNIDENTIFIED'

export type MercanteDigitalOriginalAvailability =
  'AVAILABLE' | 'PENDING' | 'UNKNOWN' | 'INCONSISTENT'

export interface MercanteFacts {
  readonly transportMode: MercanteTransportMode
  /** Must represent confirmed presence or confirmed absence. */
  readonly hasMercanteReference: boolean
  readonly recognizedEvidence: MercanteEvidence
  readonly estimatedArrivalDate: CivilDate | undefined
  readonly evaluationDate: CivilDate
  readonly digitalOriginalStatus: DigitalOriginalStatus
}

export type MercanteReasonCode =
  | 'MERCANTE_NOT_APPLICABLE'
  | 'MERCANTE_APPLICABILITY_UNDETERMINED'
  | 'MERCANTE_PENDING_EVIDENCE_LATEST'
  | 'MERCANTE_CHECKED_EVIDENCE_LATEST'
  | 'MERCANTE_MISSING_WITHIN_SEVEN_DAYS'
  | 'MERCANTE_AWAITING_OPENING'
  | 'MERCANTE_AWAITING_DIGITAL_ORIGINAL'
  | 'MERCANTE_READY_TO_CHECK'
  | 'MERCANTE_REQUIRES_VERIFICATION'

export type MercanteIssue = Readonly<{
  code:
    | 'UNKNOWN_TRANSPORT_MODE_FOR_MERCANTE'
    | 'DIGITAL_ORIGINAL_UNIDENTIFIED_FOR_MERCANTE'
    | 'DIGITAL_ORIGINAL_NOT_APPLICABLE_FOR_MARITIME_MERCANTE'
}>

export interface MercanteDecisionEvidence {
  readonly mercanteExists: boolean
  readonly etaDayDifference: number | undefined
  readonly digitalOriginalAvailability:
    MercanteDigitalOriginalAvailability | undefined
}

export interface MercanteDecision {
  readonly status: MercanteStatus
  readonly reasonCode: MercanteReasonCode
  readonly evaluatedFacts: MercanteFacts
  readonly recognizedEvidence: MercanteEvidence
  readonly evidence: MercanteDecisionEvidence
  readonly issues: readonly MercanteIssue[]
}

export function determineMercanteStatus(
  facts: MercanteFacts,
): MercanteDecision {
  const mercanteExists = hasMercanteExistenceEvidence(facts)

  switch (facts.transportMode) {
    case 'air':
    case 'other':
      return decision(
        'NOT_APPLICABLE',
        'MERCANTE_NOT_APPLICABLE',
        facts,
        mercanteExists,
      )

    case 'unknown':
      return decision(
        'UNIDENTIFIED',
        'MERCANTE_APPLICABILITY_UNDETERMINED',
        facts,
        mercanteExists,
        undefined,
        undefined,
        [{ code: 'UNKNOWN_TRANSPORT_MODE_FOR_MERCANTE' }],
      )

    case 'maritime':
      return determineMaritimeMercanteStatus(facts, mercanteExists)
  }

  return assertNever(facts.transportMode)
}

function determineMaritimeMercanteStatus(
  facts: MercanteFacts,
  mercanteExists: boolean,
): MercanteDecision {
  if (facts.recognizedEvidence.recognized) {
    if (facts.recognizedEvidence.evidence === 'PENDING') {
      return decision(
        'PENDING',
        'MERCANTE_PENDING_EVIDENCE_LATEST',
        facts,
        true,
      )
    }

    if (facts.recognizedEvidence.evidence === 'CHECKED') {
      return decision(
        'CHECKED',
        'MERCANTE_CHECKED_EVIDENCE_LATEST',
        facts,
        true,
      )
    }
  }

  if (!mercanteExists) {
    return determineMissingMercanteStatus(facts)
  }

  const digitalOriginalAvailability = projectDigitalOriginalAvailability(
    facts.digitalOriginalStatus,
  )

  switch (digitalOriginalAvailability) {
    case 'AVAILABLE':
      return decision(
        'READY_TO_CHECK',
        'MERCANTE_READY_TO_CHECK',
        facts,
        true,
        undefined,
        digitalOriginalAvailability,
      )

    case 'PENDING':
      return decision(
        'AWAITING_DIGITAL_ORIGINAL',
        'MERCANTE_AWAITING_DIGITAL_ORIGINAL',
        facts,
        true,
        undefined,
        digitalOriginalAvailability,
      )

    case 'UNKNOWN':
      return decision(
        'VERIFY',
        'MERCANTE_REQUIRES_VERIFICATION',
        facts,
        true,
        undefined,
        digitalOriginalAvailability,
        [{ code: 'DIGITAL_ORIGINAL_UNIDENTIFIED_FOR_MERCANTE' }],
      )

    case 'INCONSISTENT':
      return decision(
        'VERIFY',
        'MERCANTE_REQUIRES_VERIFICATION',
        facts,
        true,
        undefined,
        digitalOriginalAvailability,
        [
          {
            code: 'DIGITAL_ORIGINAL_NOT_APPLICABLE_FOR_MARITIME_MERCANTE',
          },
        ],
      )
  }

  return assertNever(digitalOriginalAvailability)
}

function determineMissingMercanteStatus(
  facts: MercanteFacts,
): MercanteDecision {
  if (facts.estimatedArrivalDate === undefined) {
    return decision(
      'AWAITING_OPENING',
      'MERCANTE_AWAITING_OPENING',
      facts,
      false,
    )
  }

  const etaDayDifference = differenceInCivilDays(
    facts.estimatedArrivalDate,
    facts.evaluationDate,
  )

  return etaDayDifference <= 7
    ? decision(
        'MISSING_WITHIN_SEVEN_DAYS',
        'MERCANTE_MISSING_WITHIN_SEVEN_DAYS',
        facts,
        false,
        etaDayDifference,
      )
    : decision(
        'AWAITING_OPENING',
        'MERCANTE_AWAITING_OPENING',
        facts,
        false,
        etaDayDifference,
      )
}

function hasMercanteExistenceEvidence(facts: MercanteFacts): boolean {
  return facts.hasMercanteReference || facts.recognizedEvidence.recognized
}

function projectDigitalOriginalAvailability(
  status: DigitalOriginalStatus,
): MercanteDigitalOriginalAvailability {
  switch (status) {
    case 'RECEIVED':
    case 'RECEIVED_WITH_OPEN_DEVIATION':
      return 'AVAILABLE'

    case 'AWAITING':
    case 'PENDING_WITHOUT_OPEN_DEVIATION':
      return 'PENDING'

    case 'UNIDENTIFIED':
      return 'UNKNOWN'

    case 'NOT_APPLICABLE':
      return 'INCONSISTENT'
  }

  return assertNever(status)
}

function decision(
  status: MercanteStatus,
  reasonCode: MercanteReasonCode,
  evaluatedFacts: MercanteFacts,
  mercanteExists: boolean,
  etaDayDifference?: number,
  digitalOriginalAvailability?: MercanteDigitalOriginalAvailability,
  issues: readonly MercanteIssue[] = [],
): MercanteDecision {
  return {
    status,
    reasonCode,
    evaluatedFacts,
    recognizedEvidence: evaluatedFacts.recognizedEvidence,
    evidence: {
      mercanteExists,
      etaDayDifference,
      digitalOriginalAvailability,
    },
    issues,
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected Mercante decision value: ${String(value)}`)
}
