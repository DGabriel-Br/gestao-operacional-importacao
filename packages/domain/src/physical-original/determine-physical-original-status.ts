import { differenceInCivilDays, type CivilDate } from '../civil-date.js'
import type { PhysicalOriginalEvidence } from './recognize-physical-original-evidence.js'

export type PhysicalOriginalTransportMode =
  'air' | 'maritime' | 'other' | 'unknown'

export type PhysicalOriginalStatus =
  | 'NOT_APPLICABLE'
  | 'RECEIVED'
  | 'AWAITING'
  | 'PENDING_WITHOUT_OPEN_DEVIATION'
  | 'RECEIVED_WITH_OPEN_DEVIATION'
  | 'UNIDENTIFIED'

export type PhysicalOriginalApplicability =
  'APPLICABLE' | 'NOT_APPLICABLE' | 'UNDETERMINED'

export interface PhysicalOriginalApplicabilityFacts {
  readonly transportMode: PhysicalOriginalTransportMode
  /** Must represent confirmed presence or confirmed absence. */
  readonly hasHouseReference: boolean
  /** Must represent confirmed presence or confirmed absence. */
  readonly hasCargoAgent: boolean
}

export type PhysicalOriginalApplicabilityReasonCode =
  | 'PHYSICAL_ORIGINAL_APPLICABLE'
  | 'LEGACY_FEDEX_EXCEPTION_MATCHED'
  | 'PHYSICAL_ORIGINAL_APPLICABILITY_UNDETERMINED'

export type PhysicalOriginalApplicabilityIssue = Readonly<{
  code:
    | 'UNSUPPORTED_TRANSPORT_MODE_FOR_PHYSICAL_ORIGINAL'
    | 'UNKNOWN_TRANSPORT_MODE_FOR_PHYSICAL_ORIGINAL'
}>

export interface PhysicalOriginalApplicabilityDecision {
  readonly applicability: PhysicalOriginalApplicability
  readonly reasonCode: PhysicalOriginalApplicabilityReasonCode
  readonly evaluatedFacts: PhysicalOriginalApplicabilityFacts
  readonly issues: readonly PhysicalOriginalApplicabilityIssue[]
}

export interface PhysicalOriginalFacts extends PhysicalOriginalApplicabilityFacts {
  readonly recognizedEvidence: PhysicalOriginalEvidence
  /** Must represent confirmed presence or confirmed absence. */
  readonly hasOriginalReceiptDate: boolean
  /** Must represent confirmed presence or confirmed absence. */
  readonly hasOpenPhysicalOriginalDeviation: boolean
  readonly estimatedArrivalDate: CivilDate | undefined
  readonly evaluationDate: CivilDate
}

export type PhysicalOriginalReasonCode =
  | 'LEGACY_FEDEX_EXCEPTION_MATCHED'
  | 'PHYSICAL_ORIGINAL_APPLICABILITY_UNDETERMINED'
  | 'PHYSICAL_ORIGINAL_RECEIVED'
  | 'PHYSICAL_ORIGINAL_AWAITING_WITH_OPEN_DEVIATION'
  | 'PHYSICAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION'
  | 'PHYSICAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION'
  | 'PHYSICAL_ORIGINAL_ETA_ABSENT'
  | 'PHYSICAL_ORIGINAL_ETA_OUTSIDE_SEVEN_DAY_WINDOW'

export type PhysicalOriginalIssue =
  | PhysicalOriginalApplicabilityIssue
  | Readonly<{
      code:
        | 'PHYSICAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION'
        | 'PHYSICAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION'
        | 'MISSING_ETA_FOR_PHYSICAL_ORIGINAL'
        | 'ETA_OUTSIDE_PHYSICAL_ORIGINAL_SEVEN_DAY_WINDOW'
    }>

export type PhysicalOriginalReceiptSource =
  'ORIGINAL_RECEIPT_DATE' | 'OBSERVATION'

export interface PhysicalOriginalDecisionEvidence {
  readonly recognizedEvidence: PhysicalOriginalEvidence
  readonly receiptSources: readonly PhysicalOriginalReceiptSource[]
  readonly etaDayDifference: number | undefined
}

export interface PhysicalOriginalDecision {
  readonly status: PhysicalOriginalStatus
  readonly reasonCode: PhysicalOriginalReasonCode
  readonly evaluatedFacts: PhysicalOriginalFacts
  readonly applicability: PhysicalOriginalApplicabilityDecision
  readonly evidence: PhysicalOriginalDecisionEvidence
  readonly issues: readonly PhysicalOriginalIssue[]
}

export function determinePhysicalOriginalApplicability(
  facts: PhysicalOriginalApplicabilityFacts,
): PhysicalOriginalApplicabilityDecision {
  switch (facts.transportMode) {
    case 'air':
      return facts.hasHouseReference && !facts.hasCargoAgent
        ? applicabilityDecision(
            'NOT_APPLICABLE',
            'LEGACY_FEDEX_EXCEPTION_MATCHED',
            facts,
          )
        : applicabilityDecision(
            'APPLICABLE',
            'PHYSICAL_ORIGINAL_APPLICABLE',
            facts,
          )

    case 'maritime':
      return applicabilityDecision(
        'APPLICABLE',
        'PHYSICAL_ORIGINAL_APPLICABLE',
        facts,
      )

    case 'other':
      return applicabilityDecision(
        'UNDETERMINED',
        'PHYSICAL_ORIGINAL_APPLICABILITY_UNDETERMINED',
        facts,
        [{ code: 'UNSUPPORTED_TRANSPORT_MODE_FOR_PHYSICAL_ORIGINAL' }],
      )

    case 'unknown':
      return applicabilityDecision(
        'UNDETERMINED',
        'PHYSICAL_ORIGINAL_APPLICABILITY_UNDETERMINED',
        facts,
        [{ code: 'UNKNOWN_TRANSPORT_MODE_FOR_PHYSICAL_ORIGINAL' }],
      )
  }

  return assertNever(facts.transportMode)
}

export function determinePhysicalOriginalStatus(
  facts: PhysicalOriginalFacts,
): PhysicalOriginalDecision {
  const applicability = determinePhysicalOriginalApplicability({
    transportMode: facts.transportMode,
    hasHouseReference: facts.hasHouseReference,
    hasCargoAgent: facts.hasCargoAgent,
  })
  const receiptSources = determineReceiptSources(facts)

  if (applicability.applicability === 'NOT_APPLICABLE') {
    return decision(
      'NOT_APPLICABLE',
      'LEGACY_FEDEX_EXCEPTION_MATCHED',
      facts,
      applicability,
      receiptSources,
    )
  }

  if (applicability.applicability === 'UNDETERMINED') {
    return decision(
      'UNIDENTIFIED',
      'PHYSICAL_ORIGINAL_APPLICABILITY_UNDETERMINED',
      facts,
      applicability,
      receiptSources,
      undefined,
      applicability.issues,
    )
  }

  if (receiptSources.length > 0) {
    return facts.hasOpenPhysicalOriginalDeviation
      ? decision(
          'RECEIVED_WITH_OPEN_DEVIATION',
          'PHYSICAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION',
          facts,
          applicability,
          receiptSources,
          undefined,
          [{ code: 'PHYSICAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION' }],
        )
      : decision(
          'RECEIVED',
          'PHYSICAL_ORIGINAL_RECEIVED',
          facts,
          applicability,
          receiptSources,
        )
  }

  if (facts.estimatedArrivalDate === undefined) {
    return decision(
      'UNIDENTIFIED',
      'PHYSICAL_ORIGINAL_ETA_ABSENT',
      facts,
      applicability,
      receiptSources,
      undefined,
      [{ code: 'MISSING_ETA_FOR_PHYSICAL_ORIGINAL' }],
    )
  }

  const etaDayDifference = differenceInCivilDays(
    facts.estimatedArrivalDate,
    facts.evaluationDate,
  )

  if (etaDayDifference > 7) {
    return decision(
      'UNIDENTIFIED',
      'PHYSICAL_ORIGINAL_ETA_OUTSIDE_SEVEN_DAY_WINDOW',
      facts,
      applicability,
      receiptSources,
      etaDayDifference,
      [{ code: 'ETA_OUTSIDE_PHYSICAL_ORIGINAL_SEVEN_DAY_WINDOW' }],
    )
  }

  return facts.hasOpenPhysicalOriginalDeviation
    ? decision(
        'AWAITING',
        'PHYSICAL_ORIGINAL_AWAITING_WITH_OPEN_DEVIATION',
        facts,
        applicability,
        receiptSources,
        etaDayDifference,
      )
    : decision(
        'PENDING_WITHOUT_OPEN_DEVIATION',
        'PHYSICAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION',
        facts,
        applicability,
        receiptSources,
        etaDayDifference,
        [{ code: 'PHYSICAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION' }],
      )
}

function determineReceiptSources(
  facts: PhysicalOriginalFacts,
): readonly PhysicalOriginalReceiptSource[] {
  const sources: PhysicalOriginalReceiptSource[] = []

  if (facts.hasOriginalReceiptDate) {
    sources.push('ORIGINAL_RECEIPT_DATE')
  }

  if (facts.recognizedEvidence.recognized) {
    sources.push('OBSERVATION')
  }

  return sources
}

function applicabilityDecision(
  applicability: PhysicalOriginalApplicability,
  reasonCode: PhysicalOriginalApplicabilityReasonCode,
  evaluatedFacts: PhysicalOriginalApplicabilityFacts,
  issues: readonly PhysicalOriginalApplicabilityIssue[] = [],
): PhysicalOriginalApplicabilityDecision {
  return { applicability, reasonCode, evaluatedFacts, issues }
}

function decision(
  status: PhysicalOriginalStatus,
  reasonCode: PhysicalOriginalReasonCode,
  evaluatedFacts: PhysicalOriginalFacts,
  applicability: PhysicalOriginalApplicabilityDecision,
  receiptSources: readonly PhysicalOriginalReceiptSource[],
  etaDayDifference?: number,
  issues: readonly PhysicalOriginalIssue[] = [],
): PhysicalOriginalDecision {
  return {
    status,
    reasonCode,
    evaluatedFacts,
    applicability,
    evidence: {
      recognizedEvidence: evaluatedFacts.recognizedEvidence,
      receiptSources,
      etaDayDifference,
    },
    issues,
  }
}

function assertNever(value: never): never {
  throw new Error(
    `Unexpected physical original transport mode: ${String(value)}`,
  )
}
