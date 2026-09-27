import type { DigitalOriginalEvidence } from './recognize-digital-original-evidence.js'

export type DigitalOriginalTransportMode =
  'air' | 'maritime' | 'other' | 'unknown'

export type DigitalOriginalStatus =
  | 'NOT_APPLICABLE'
  | 'RECEIVED'
  | 'AWAITING'
  | 'PENDING_WITHOUT_OPEN_DEVIATION'
  | 'RECEIVED_WITH_OPEN_DEVIATION'
  | 'UNIDENTIFIED'

export interface DigitalOriginalFacts {
  readonly transportMode: DigitalOriginalTransportMode
  readonly recognizedEvidence: DigitalOriginalEvidence
  /** Must represent confirmed presence or confirmed absence. */
  readonly hasOpenDigitalOriginalDeviation: boolean
}

export type DigitalOriginalReasonCode =
  | 'DIGITAL_ORIGINAL_NOT_APPLICABLE'
  | 'DIGITAL_ORIGINAL_RECEIVED'
  | 'DIGITAL_ORIGINAL_AWAITING_WITH_OPEN_DEVIATION'
  | 'DIGITAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION'
  | 'DIGITAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION'
  | 'DIGITAL_ORIGINAL_EVIDENCE_NOT_IDENTIFIED'
  | 'DIGITAL_ORIGINAL_APPLICABILITY_UNDETERMINED'

export type DigitalOriginalIssue = Readonly<{
  code:
    | 'DIGITAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION'
    | 'DIGITAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION'
    | 'UNKNOWN_TRANSPORT_MODE_FOR_DIGITAL_ORIGINAL'
}>

export interface DigitalOriginalDecision {
  readonly status: DigitalOriginalStatus
  readonly reasonCode: DigitalOriginalReasonCode
  readonly evaluatedFacts: DigitalOriginalFacts
  readonly recognizedEvidence: DigitalOriginalEvidence
  readonly issues: readonly DigitalOriginalIssue[]
}

export function determineDigitalOriginalStatus(
  facts: DigitalOriginalFacts,
): DigitalOriginalDecision {
  switch (facts.transportMode) {
    case 'air':
    case 'other':
      return decision(
        'NOT_APPLICABLE',
        'DIGITAL_ORIGINAL_NOT_APPLICABLE',
        facts,
      )

    case 'unknown':
      return decision(
        'UNIDENTIFIED',
        'DIGITAL_ORIGINAL_APPLICABILITY_UNDETERMINED',
        facts,
        [{ code: 'UNKNOWN_TRANSPORT_MODE_FOR_DIGITAL_ORIGINAL' }],
      )

    case 'maritime':
      return determineMaritimeDigitalOriginalStatus(facts)
  }

  return assertNever(facts.transportMode)
}

function determineMaritimeDigitalOriginalStatus(
  facts: DigitalOriginalFacts,
): DigitalOriginalDecision {
  if (!facts.recognizedEvidence.recognized) {
    return decision(
      'UNIDENTIFIED',
      'DIGITAL_ORIGINAL_EVIDENCE_NOT_IDENTIFIED',
      facts,
    )
  }

  if (facts.recognizedEvidence.evidence === 'AWAITING') {
    return facts.hasOpenDigitalOriginalDeviation
      ? decision(
          'AWAITING',
          'DIGITAL_ORIGINAL_AWAITING_WITH_OPEN_DEVIATION',
          facts,
        )
      : decision(
          'PENDING_WITHOUT_OPEN_DEVIATION',
          'DIGITAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION',
          facts,
          [{ code: 'DIGITAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION' }],
        )
  }

  return facts.hasOpenDigitalOriginalDeviation
    ? decision(
        'RECEIVED_WITH_OPEN_DEVIATION',
        'DIGITAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION',
        facts,
        [{ code: 'DIGITAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION' }],
      )
    : decision('RECEIVED', 'DIGITAL_ORIGINAL_RECEIVED', facts)
}

function decision(
  status: DigitalOriginalStatus,
  reasonCode: DigitalOriginalReasonCode,
  evaluatedFacts: DigitalOriginalFacts,
  issues: readonly DigitalOriginalIssue[] = [],
): DigitalOriginalDecision {
  return {
    status,
    reasonCode,
    evaluatedFacts,
    recognizedEvidence: evaluatedFacts.recognizedEvidence,
    issues,
  }
}

function assertNever(value: never): never {
  throw new Error(
    `Unexpected digital original transport mode: ${String(value)}`,
  )
}
