import { describe, expect, it } from 'vitest'
import type { CivilDate } from '../civil-date.js'
import {
  assessOperationalProcess,
  type OperationalAssessmentFacts,
} from './assess-operational-process.js'

const evaluationDate = civilDate(2026, 9, 28)

function civilDate(year: number, month: number, day: number): CivilDate {
  return { year, month, day }
}

function facts(
  overrides: Partial<OperationalAssessmentFacts> = {},
): OperationalAssessmentFacts {
  return {
    transportMode: 'maritime',
    observation: 'Digitação OK // Original digitalizado OK // Mercante aberto',
    hasProcessId: true,
    hasRegistration: false,
    estimatedArrivalDate: civilDate(2026, 10, 3),
    hasArrival: false,
    evaluationDate,
    hasMercanteReference: true,
    hasHouseReference: false,
    hasCargoAgent: true,
    hasOriginalReceiptDate: true,
    deviationSummary: {
      openBlockingDeviationCount: 0,
      openNonBlockingDeviationCount: 0,
      openUnclassifiedDeviationCount: 0,
      hasOpenDigitalOriginalDeviation: false,
      hasOpenPhysicalOriginalDeviation: false,
    },
    ...overrides,
  }
}

describe('operational process assessment composition', () => {
  it('preserves every independent decision in a coherent maritime scenario', () => {
    const input = facts()

    const assessment = assessOperationalProcess(input)

    expect(assessment.monitoringEligibility.eligibility).toBe('eligible')
    expect(assessment.operationalEvent.event).toBe('TYPING_COMPLETED')
    expect(assessment.operationalStage.stage).toBe('READY_FOR_REVIEW')
    expect(assessment.criticality.criticality).toBe(3)
    expect(assessment.alert.alert).toBe('READY_TO_SEND_TO_REVIEW')
    expect(assessment.digitalOriginal.status).toBe('RECEIVED')
    expect(assessment.physicalOriginal.status).toBe('RECEIVED')
    expect(assessment.mercante.status).toBe('READY_TO_CHECK')
    expect(assessment.deviationSummary).toEqual(input.deviationSummary)
  })

  it('uses ready deviation counts for a pending alert without altering other dimensions', () => {
    const input = facts({
      observation: 'Pendência apontada // Original digitalizado OK',
      deviationSummary: {
        openBlockingDeviationCount: 2,
        openNonBlockingDeviationCount: 1,
        openUnclassifiedDeviationCount: 3,
        hasOpenDigitalOriginalDeviation: false,
        hasOpenPhysicalOriginalDeviation: false,
      },
    })

    const assessment = assessOperationalProcess(input)

    expect(assessment.operationalStage.stage).toBe('PENDING')
    expect(assessment.alert.alert).toBe('BLOCKING_DEVIATIONS_OPEN')
    expect(assessment.alert.evaluatedFacts.blockingDeviationCount).toBe(2)
    expect(assessment.criticality.criticality).toBe(3)
    expect(assessment.digitalOriginal.status).toBe('RECEIVED')
    expect(assessment.deviationSummary.openUnclassifiedDeviationCount).toBe(3)
  })

  it('preserves the air legacy FEDEX exception independently from other dimensions', () => {
    const assessment = assessOperationalProcess(
      facts({
        transportMode: 'air',
        observation: 'Digitação OK // Original digitalizado OK',
        hasHouseReference: true,
        hasCargoAgent: false,
      }),
    )

    expect(assessment.operationalStage.stage).toBe('AWAITING_CCT')
    expect(assessment.alert.alert).toBe('AWAITING_CCT_OPENING')
    expect(assessment.digitalOriginal.status).toBe('NOT_APPLICABLE')
    expect(assessment.physicalOriginal.status).toBe('NOT_APPLICABLE')
    expect(assessment.physicalOriginal.reasonCode).toBe(
      'LEGACY_FEDEX_EXCEPTION_MATCHED',
    )
    expect(assessment.mercante.status).toBe('NOT_APPLICABLE')
  })

  it('keeps unknown transport uncertainty local to each applicable dimension', () => {
    const assessment = assessOperationalProcess(
      facts({
        transportMode: 'unknown',
        observation: 'Digitação OK',
        hasOriginalReceiptDate: false,
      }),
    )

    expect(assessment.operationalStage.stage).toBe('TYPING_COMPLETED')
    expect(assessment.digitalOriginal.status).toBe('UNIDENTIFIED')
    expect(assessment.physicalOriginal.status).toBe('UNIDENTIFIED')
    expect(assessment.mercante.status).toBe('UNIDENTIFIED')
    expect(assessment).not.toHaveProperty('overallStatus')
    expect(assessment).not.toHaveProperty('issues')
  })

  it('composes observation review and its primary alert from an unidentified event', () => {
    const assessment = assessOperationalProcess(
      facts({ observation: 'Sem evento operacional conhecido' }),
    )

    expect(assessment.operationalEvent.event).toBe('UNIDENTIFIED')
    expect(assessment.operationalStage.stage).toBe('REVIEW_OBSERVATION')
    expect(assessment.alert.alert).toBe('UNIDENTIFIED_EVENT')
  })

  it('preserves independent reactions to the same overdue ETA', () => {
    const assessment = assessOperationalProcess(
      facts({
        observation: 'Processo em análise crítica',
        hasMercanteReference: false,
        hasOriginalReceiptDate: false,
        estimatedArrivalDate: civilDate(2026, 9, 8),
        deviationSummary: {
          openBlockingDeviationCount: 0,
          openNonBlockingDeviationCount: 0,
          openUnclassifiedDeviationCount: 0,
          hasOpenDigitalOriginalDeviation: false,
          hasOpenPhysicalOriginalDeviation: true,
        },
      }),
    )

    expect(assessment.criticality.criticality).toBe(3)
    expect(assessment.alert.alert).toBe('ETA_OVERDUE_WITHOUT_ARRIVAL')
    expect(assessment.physicalOriginal.status).toBe('AWAITING')
    expect(assessment.mercante.status).toBe('MISSING_WITHIN_SEVEN_DAYS')
  })

  it('keeps awaiting Mercante stage while textual existence makes Mercante ready to check', () => {
    const assessment = assessOperationalProcess(
      facts({
        observation:
          'Digitação OK // Mercante aberto // Original digitalizado OK',
        hasMercanteReference: false,
      }),
    )

    expect(assessment.operationalStage.stage).toBe('AWAITING_MERCANTE')
    expect(assessment.mercante.status).toBe('READY_TO_CHECK')
  })

  it('keeps ready for review stage while Mercante awaits the digital original', () => {
    const assessment = assessOperationalProcess(
      facts({
        observation:
          'Digitação OK // Aguardando envio do BL original digitalizado',
        hasMercanteReference: true,
        deviationSummary: {
          openBlockingDeviationCount: 0,
          openNonBlockingDeviationCount: 0,
          openUnclassifiedDeviationCount: 0,
          hasOpenDigitalOriginalDeviation: true,
          hasOpenPhysicalOriginalDeviation: false,
        },
      }),
    )

    expect(assessment.operationalStage.stage).toBe('READY_FOR_REVIEW')
    expect(assessment.digitalOriginal.status).toBe('AWAITING')
    expect(assessment.mercante.status).toBe('AWAITING_DIGITAL_ORIGINAL')
  })

  it('does not short-circuit remaining dimensions when monitoring is ineligible', () => {
    const assessment = assessOperationalProcess(
      facts({ hasRegistration: true }),
    )

    expect(assessment.monitoringEligibility.eligibility).toBe('ineligible')
    expect(assessment.operationalEvent.event).toBe('TYPING_COMPLETED')
    expect(assessment.operationalStage.stage).toBe('READY_FOR_REVIEW')
    expect(assessment.criticality.criticality).toBe(3)
    expect(assessment.digitalOriginal.status).toBe('RECEIVED')
    expect(assessment.physicalOriginal.status).toBe('RECEIVED')
    expect(assessment.mercante.status).toBe('READY_TO_CHECK')
  })

  it('does not short-circuit remaining dimensions when monitoring is undetermined', () => {
    const assessment = assessOperationalProcess(
      facts({
        transportMode: 'unknown',
        observation: 'Aguardando dados de atracação // Digitação OK',
        estimatedArrivalDate: undefined,
        hasOriginalReceiptDate: false,
      }),
    )

    expect(assessment.monitoringEligibility.eligibility).toBe('undetermined')
    expect(assessment.operationalEvent.event).toBe('TYPING_COMPLETED')
    expect(assessment.operationalStage.stage).toBe('TYPING_COMPLETED')
    expect(assessment.criticality.classificationStatus).toBe('unclassified')
    expect(assessment.alert.alert).toBe('NO_OPERATIONAL_ACTION')
    expect(assessment.digitalOriginal.status).toBe('UNIDENTIFIED')
    expect(assessment.physicalOriginal.status).toBe('UNIDENTIFIED')
    expect(assessment.mercante.status).toBe('UNIDENTIFIED')
  })
})
