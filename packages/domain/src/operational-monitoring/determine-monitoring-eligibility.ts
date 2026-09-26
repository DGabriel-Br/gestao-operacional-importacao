import type { MonitoringObservationEvidence } from './recognize-observation-evidence.js'

export type MonitoringTransportMode = 'air' | 'maritime' | 'unknown'

export type MonitoringEligibility = 'eligible' | 'ineligible' | 'undetermined'

export interface MonitoringEligibilityFacts {
  readonly hasProcessId: boolean
  readonly hasEstimatedArrival: boolean
  readonly hasArrival: boolean
  readonly hasRegistration: boolean
  readonly transportMode: MonitoringTransportMode
  readonly observationEvidence: MonitoringObservationEvidence
}

export type MonitoringEligibilityReasonCode =
  | 'HAS_ETA'
  | 'AWAITING_TRANSSHIPMENT_CONFIRMATION'
  | 'AWAITING_BERTHING_DATA'
  | 'ALREADY_REGISTERED'
  | 'MISSING_PROCESS_ID'
  | 'BERTHING_EVIDENCE_NOT_APPLICABLE'
  | 'BERTHING_APPLICABILITY_UNDETERMINED'
  | 'NO_TRACKING_TRIGGER'

export type MonitoringEligibilityIssue = Readonly<{
  code: 'UNKNOWN_TRANSPORT_MODE_FOR_BERTHING_EVIDENCE'
}>

export interface MonitoringEligibilityDecision {
  readonly eligibility: MonitoringEligibility
  readonly reasonCodes: readonly MonitoringEligibilityReasonCode[]
  readonly evaluatedFacts: MonitoringEligibilityFacts
  readonly issues: readonly MonitoringEligibilityIssue[]
}

export function determineMonitoringEligibility(
  facts: MonitoringEligibilityFacts,
): MonitoringEligibilityDecision {
  const hasUnknownBerthingApplicability =
    facts.transportMode === 'unknown' &&
    facts.observationEvidence.awaitingBerthingData
  const issues: readonly MonitoringEligibilityIssue[] =
    hasUnknownBerthingApplicability
      ? [{ code: 'UNKNOWN_TRANSPORT_MODE_FOR_BERTHING_EVIDENCE' }]
      : []
  const blockingReasons: MonitoringEligibilityReasonCode[] = []

  if (!facts.hasProcessId) {
    blockingReasons.push('MISSING_PROCESS_ID')
  }

  if (facts.hasRegistration) {
    blockingReasons.push('ALREADY_REGISTERED')
  }

  if (blockingReasons.length > 0) {
    return decision('ineligible', blockingReasons, facts, issues)
  }

  const eligibilityReasons: MonitoringEligibilityReasonCode[] = []

  if (facts.hasEstimatedArrival) {
    eligibilityReasons.push('HAS_ETA')
  }

  if (facts.observationEvidence.awaitingTransshipmentConfirmation) {
    eligibilityReasons.push('AWAITING_TRANSSHIPMENT_CONFIRMATION')
  }

  if (
    facts.transportMode === 'maritime' &&
    facts.observationEvidence.awaitingBerthingData
  ) {
    eligibilityReasons.push('AWAITING_BERTHING_DATA')
  }

  if (eligibilityReasons.length > 0) {
    return decision('eligible', eligibilityReasons, facts, issues)
  }

  if (
    facts.transportMode === 'air' &&
    facts.observationEvidence.awaitingBerthingData
  ) {
    return decision('ineligible', ['BERTHING_EVIDENCE_NOT_APPLICABLE'], facts)
  }

  if (hasUnknownBerthingApplicability) {
    return decision(
      'undetermined',
      ['BERTHING_APPLICABILITY_UNDETERMINED'],
      facts,
      issues,
    )
  }

  return decision('ineligible', ['NO_TRACKING_TRIGGER'], facts)
}

function decision(
  eligibility: MonitoringEligibility,
  reasonCodes: readonly MonitoringEligibilityReasonCode[],
  evaluatedFacts: MonitoringEligibilityFacts,
  issues: readonly MonitoringEligibilityIssue[] = [],
): MonitoringEligibilityDecision {
  return { eligibility, reasonCodes, evaluatedFacts, issues }
}
