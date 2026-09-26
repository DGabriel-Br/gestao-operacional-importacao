import { describe, expect, it } from 'vitest'
import {
  determineMonitoringEligibility,
  type MonitoringEligibilityFacts,
} from './determine-monitoring-eligibility.js'
import { recognizeOperationalMonitoringObservationEvidence } from './recognize-observation-evidence.js'

const noObservationEvidence = {
  awaitingTransshipmentConfirmation: false,
  awaitingBerthingData: false,
} as const

function facts(
  overrides: Partial<MonitoringEligibilityFacts> = {},
): MonitoringEligibilityFacts {
  return {
    hasProcessId: true,
    hasEstimatedArrival: false,
    hasArrival: false,
    hasRegistration: false,
    transportMode: 'air',
    observationEvidence: noObservationEvidence,
    ...overrides,
  }
}

describe('operational monitoring eligibility', () => {
  it('includes a process with ETA and without registration', () => {
    const result = determineMonitoringEligibility(
      facts({ hasEstimatedArrival: true }),
    )

    expect(result.eligibility).toBe('eligible')
    expect(result.reasonCodes).toEqual(['HAS_ETA'])
    expect(result.issues).toEqual([])
  })

  it('keeps an arrived process with ETA when it has no registration', () => {
    const input = facts({ hasEstimatedArrival: true, hasArrival: true })

    const result = determineMonitoringEligibility(input)

    expect(result.eligibility).toBe('eligible')
    expect(result.reasonCodes).toEqual(['HAS_ETA'])
    expect(result.evaluatedFacts).toEqual(input)
  })

  it('excludes a process with ETA when it is already registered', () => {
    const result = determineMonitoringEligibility(
      facts({ hasEstimatedArrival: true, hasRegistration: true }),
    )

    expect(result.eligibility).toBe('ineligible')
    expect(result.reasonCodes).toEqual(['ALREADY_REGISTERED'])
  })

  it('excludes a process without ETA or characterized exception', () => {
    const result = determineMonitoringEligibility(facts())

    expect(result.eligibility).toBe('ineligible')
    expect(result.reasonCodes).toEqual(['NO_TRACKING_TRIGGER'])
  })

  it('includes a process awaiting transshipment confirmation without ETA', () => {
    const result = determineMonitoringEligibility(
      facts({
        observationEvidence: {
          awaitingTransshipmentConfirmation: true,
          awaitingBerthingData: false,
        },
      }),
    )

    expect(result.eligibility).toBe('eligible')
    expect(result.reasonCodes).toEqual(['AWAITING_TRANSSHIPMENT_CONFIRMATION'])
  })

  it('includes a maritime process awaiting berthing data without ETA', () => {
    const result = determineMonitoringEligibility(
      facts({
        transportMode: 'maritime',
        observationEvidence: {
          awaitingTransshipmentConfirmation: false,
          awaitingBerthingData: true,
        },
      }),
    )

    expect(result.eligibility).toBe('eligible')
    expect(result.reasonCodes).toEqual(['AWAITING_BERTHING_DATA'])
  })

  it('does not apply the maritime berthing exception to an air process', () => {
    const result = determineMonitoringEligibility(
      facts({
        transportMode: 'air',
        observationEvidence: {
          awaitingTransshipmentConfirmation: false,
          awaitingBerthingData: true,
        },
      }),
    )

    expect(result.eligibility).toBe('ineligible')
    expect(result.reasonCodes).toEqual(['BERTHING_EVIDENCE_NOT_APPLICABLE'])
    expect(result.issues).toEqual([])
  })

  it('excludes a record without a process identifier', () => {
    const result = determineMonitoringEligibility(
      facts({ hasProcessId: false, hasEstimatedArrival: true }),
    )

    expect(result.eligibility).toBe('ineligible')
    expect(result.reasonCodes).toEqual(['MISSING_PROCESS_ID'])
  })

  it('excludes a process with empty observation and no ETA', () => {
    const result = determineMonitoringEligibility(
      facts({
        observationEvidence:
          recognizeOperationalMonitoringObservationEvidence(''),
      }),
    )

    expect(result.eligibility).toBe('ineligible')
    expect(result.reasonCodes).toEqual(['NO_TRACKING_TRIGGER'])
  })

  it('excludes a registered process even with transshipment evidence', () => {
    const result = determineMonitoringEligibility(
      facts({
        hasRegistration: true,
        observationEvidence: {
          awaitingTransshipmentConfirmation: true,
          awaitingBerthingData: false,
        },
      }),
    )

    expect(result.eligibility).toBe('ineligible')
    expect(result.reasonCodes).toEqual(['ALREADY_REGISTERED'])
  })

  it('reports unknown modal when berthing evidence cannot be applied', () => {
    const result = determineMonitoringEligibility(
      facts({
        transportMode: 'unknown',
        observationEvidence: {
          awaitingTransshipmentConfirmation: false,
          awaitingBerthingData: true,
        },
      }),
    )

    expect(result.eligibility).toBe('undetermined')
    expect(result.reasonCodes).toEqual(['BERTHING_APPLICABILITY_UNDETERMINED'])
    expect(result.issues).toEqual([
      { code: 'UNKNOWN_TRANSPORT_MODE_FOR_BERTHING_EVIDENCE' },
    ])
  })

  it('keeps the modal issue when ETA independently establishes eligibility', () => {
    const result = determineMonitoringEligibility(
      facts({
        hasEstimatedArrival: true,
        transportMode: 'unknown',
        observationEvidence: {
          awaitingTransshipmentConfirmation: false,
          awaitingBerthingData: true,
        },
      }),
    )

    expect(result.eligibility).toBe('eligible')
    expect(result.reasonCodes).toEqual(['HAS_ETA'])
    expect(result.issues).toEqual([
      { code: 'UNKNOWN_TRANSPORT_MODE_FOR_BERTHING_EVIDENCE' },
    ])
  })

  it('reports every characterized reason that supports eligibility', () => {
    const result = determineMonitoringEligibility(
      facts({
        hasEstimatedArrival: true,
        observationEvidence: {
          awaitingTransshipmentConfirmation: true,
          awaitingBerthingData: false,
        },
      }),
    )

    expect(result.eligibility).toBe('eligible')
    expect(result.reasonCodes).toEqual([
      'HAS_ETA',
      'AWAITING_TRANSSHIPMENT_CONFIRMATION',
    ])
  })
})
