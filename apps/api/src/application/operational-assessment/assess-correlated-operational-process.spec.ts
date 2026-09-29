import type { CivilDate } from '@gestao-operacional/domain'
import { describe, expect, it } from 'vitest'
import type {
  CorrelatedOperationalDeviations,
  OpenDeviationImpactAggregation,
  UncorrelatableOperationalDeviations,
} from './correlate-operational-deviations'
import {
  projectEComexOperationalDeviation,
  type EComexOperationalDeviation,
} from './project-ecomex-operational-deviation'
import type { ETrackOperationalFacts } from './project-etrack-operational-facts'
import { assessCorrelatedOperationalProcess } from './assess-correlated-operational-process'

const evaluationDate = civilDate(2026, 9, 28)
const zeroAggregation: OpenDeviationImpactAggregation = {
  matchedDeviationCount: 0,
  openDeviationCount: 0,
  openBlockingDeviationCount: 0,
  openNonBlockingDeviationCount: 0,
  openUnclassifiedDeviationCount: 0,
}

function civilDate(year: number, month: number, day: number): CivilDate {
  return { year, month, day }
}

function etrackFacts(
  overrides: Partial<ETrackOperationalFacts> = {},
): ETrackOperationalFacts {
  return {
    processNumber: '0001/2026',
    customerReference: '420001/2026',
    transportMode: 'maritime',
    observation: 'Digitação OK // Original digitalizado OK // Mercante aberto',
    hasProcessId: true,
    hasRegistration: false,
    estimatedArrivalDate: civilDate(2026, 10, 3),
    hasArrival: false,
    hasMercanteReference: true,
    hasHouseReference: false,
    hasCargoAgent: true,
    hasOriginalReceiptDate: true,
    ...overrides,
  }
}

function correlated(
  overrides: Partial<CorrelatedOperationalDeviations> = {},
): CorrelatedOperationalDeviations {
  const matchedDeviations = overrides.matchedDeviations ?? []

  return {
    status: 'correlated',
    rawCustomerReference: '420001/2026',
    legacyCorrelationKey: '4200012026',
    matchedDeviations,
    aggregation: {
      ...zeroAggregation,
      matchedDeviationCount: matchedDeviations.length,
    },
    reasonCode:
      matchedDeviations.length === 0
        ? 'NO_MATCHING_ECOMEX_DEVIATIONS'
        : 'MATCHING_ECOMEX_DEVIATIONS_FOUND',
    issues: [],
    ...overrides,
  }
}

function uncorrelatable(): UncorrelatableOperationalDeviations {
  return {
    status: 'uncorrelatable',
    rawCustomerReference: undefined,
    reasonCode: 'CUSTOMER_REFERENCE_MISSING',
    issues: [
      {
        code: 'CUSTOMER_REFERENCE_MISSING',
        rawCustomerReference: undefined,
      },
    ],
  }
}

interface DeviationOptions {
  readonly description?: string
  readonly observation?: string
  readonly rowNumber?: number
}

function deviation(options: DeviationOptions = {}): EComexOperationalDeviation {
  const description =
    options.description ??
    'Documentos originais não recebidos do Agente de Carga'
  const observation = options.observation

  const result = projectEComexOperationalDeviation({
    trace: {
      source: 'ecomex',
      sourceVersion: 'export-2026-09-29',
      rowNumber: options.rowNumber ?? 2,
    },
    normalizedData: {
      shipmentReference: '420001/2026',
      deviationDescription: description,
      end: { kind: 'absent' },
      notes: observation,
    },
    issues: [],
  })

  if (result.status !== 'ready') {
    throw new Error('Expected a ready eComex fixture')
  }

  return result.deviation
}

describe('assessCorrelatedOperationalProcess', () => {
  it('assesses a correlated process with zero matches and a legitimate zero summary', () => {
    const facts = etrackFacts()
    const correlation = correlated()

    const result = assessCorrelatedOperationalProcess({
      etrackFacts: facts,
      deviationCorrelation: correlation,
      evaluationDate,
    })

    expect(result.status).toBe('assessed')
    if (result.status !== 'assessed') {
      throw new Error('Expected an assessed result')
    }
    expect(result.etrackFacts).toBe(facts)
    expect(result.deviationSummaryProjection.correlation).toBe(correlation)
    expect(result.assessment.deviationSummary).toEqual({
      openBlockingDeviationCount: 0,
      openNonBlockingDeviationCount: 0,
      openUnclassifiedDeviationCount: 0,
      hasOpenDigitalOriginalDeviation: false,
      hasOpenPhysicalOriginalDeviation: false,
    })
  })

  it('returns unassessable for an unusable correlation without manufacturing a summary', () => {
    const facts = etrackFacts({ customerReference: undefined })
    const correlation = uncorrelatable()

    const result = assessCorrelatedOperationalProcess({
      etrackFacts: facts,
      deviationCorrelation: correlation,
      evaluationDate,
    })

    expect(result).toEqual({
      status: 'unassessable',
      etrackFacts: facts,
      evaluationDate,
      deviationSummaryProjection: {
        status: 'uncorrelatable',
        correlation,
      },
    })
    expect(result).not.toHaveProperty('assessment')
    expect(result).not.toHaveProperty('assessmentFacts')
  })

  it('maps every prepared fact explicitly into OperationalAssessmentFacts', () => {
    const facts = etrackFacts({
      observation: '  Texto preservado // sem normalização  ',
      hasRegistration: true,
      hasArrival: true,
      hasMercanteReference: false,
      hasHouseReference: true,
      hasCargoAgent: false,
      hasOriginalReceiptDate: false,
    })

    const result = assessCorrelatedOperationalProcess({
      etrackFacts: facts,
      deviationCorrelation: correlated(),
      evaluationDate,
    })

    expect(result.status).toBe('assessed')
    if (result.status === 'assessed') {
      expect(result.assessmentFacts).toEqual({
        transportMode: facts.transportMode,
        observation: facts.observation,
        hasProcessId: facts.hasProcessId,
        hasRegistration: facts.hasRegistration,
        estimatedArrivalDate: facts.estimatedArrivalDate,
        hasArrival: facts.hasArrival,
        evaluationDate,
        hasMercanteReference: facts.hasMercanteReference,
        hasHouseReference: facts.hasHouseReference,
        hasCargoAgent: facts.hasCargoAgent,
        hasOriginalReceiptDate: facts.hasOriginalReceiptDate,
        deviationSummary: result.deviationSummaryProjection.summary,
      })
    }
  })

  it('uses the explicit evaluation date and remains deterministic', () => {
    const input = {
      etrackFacts: etrackFacts({
        observation: 'Processo em análise crítica',
        estimatedArrivalDate: civilDate(2026, 10, 3),
      }),
      deviationCorrelation: correlated(),
      evaluationDate,
    }

    const first = assessCorrelatedOperationalProcess(input)
    const second = assessCorrelatedOperationalProcess(input)

    expect(first).toEqual(second)
    expect(first.status).toBe('assessed')
    if (first.status === 'assessed') {
      expect(first.assessment.alert.alert).toBe('PRIORITIZE_CRITICAL_ANALYSIS')
      expect(first.assessmentFacts.evaluationDate).toBe(evaluationDate)
    }
  })

  it('preserves process identifiers as Application context without changing decisions', () => {
    const firstFacts = etrackFacts({
      processNumber: '0001/2026',
      customerReference: '420001/2026',
    })
    const secondFacts = etrackFacts({
      processNumber: 'PREFIXO-0001/2026',
      customerReference: 'CLIENTE 420001/2026',
    })
    const correlation = correlated()

    const first = assessCorrelatedOperationalProcess({
      etrackFacts: firstFacts,
      deviationCorrelation: correlation,
      evaluationDate,
    })
    const second = assessCorrelatedOperationalProcess({
      etrackFacts: secondFacts,
      deviationCorrelation: correlation,
      evaluationDate,
    })

    expect(first.status).toBe('assessed')
    expect(second.status).toBe('assessed')
    if (first.status === 'assessed' && second.status === 'assessed') {
      expect(first.etrackFacts).toBe(firstFacts)
      expect(second.etrackFacts).toBe(secondFacts)
      expect(first.assessment).toEqual(second.assessment)
    }
  })

  it('preserves a collision issue while still executing the assessment', () => {
    const correlation = correlated({
      issues: [
        {
          code: 'LEGACY_CORRELATION_REFERENCE_COLLISION',
          legacyCorrelationKey: '4200012026',
          ecomexShipmentReferences: ['ABC420001/2026', 'XYZ420001/2026'],
        },
      ],
    })

    const result = assessCorrelatedOperationalProcess({
      etrackFacts: etrackFacts(),
      deviationCorrelation: correlation,
      evaluationDate,
    })

    expect(result.status).toBe('assessed')
    if (result.status === 'assessed') {
      expect(result.deviationSummaryProjection.correlation.issues).toBe(
        correlation.issues,
      )
      expect(result.assessment).toBeDefined()
    }
  })

  it('preserves open unclassified deviations without inventing alert behavior', () => {
    const correlation = correlated({
      aggregation: {
        ...zeroAggregation,
        openDeviationCount: 2,
        openUnclassifiedDeviationCount: 2,
      },
    })

    const result = assessCorrelatedOperationalProcess({
      etrackFacts: etrackFacts(),
      deviationCorrelation: correlation,
      evaluationDate,
    })

    expect(result.status).toBe('assessed')
    if (result.status === 'assessed') {
      expect(
        result.assessment.deviationSummary.openUnclassifiedDeviationCount,
      ).toBe(2)
      expect(result.assessment.alert.alert).toBe('READY_TO_SEND_TO_REVIEW')
    }
  })

  it.each([
    {
      name: 'blocking',
      aggregation: {
        ...zeroAggregation,
        openDeviationCount: 2,
        openBlockingDeviationCount: 2,
      },
      expectedAlert: 'BLOCKING_DEVIATIONS_OPEN',
    },
    {
      name: 'only non-blocking',
      aggregation: {
        ...zeroAggregation,
        openDeviationCount: 1,
        openNonBlockingDeviationCount: 1,
      },
      expectedAlert: 'ONLY_NON_BLOCKING_DEVIATIONS',
    },
  ] as const)(
    'lets Domain decide the pending alert for $name deviations',
    ({ aggregation, expectedAlert }) => {
      const result = assessCorrelatedOperationalProcess({
        etrackFacts: etrackFacts({ observation: 'Pendência apontada' }),
        deviationCorrelation: correlated({ aggregation }),
        evaluationDate,
      })

      expect(result.status).toBe('assessed')
      if (result.status === 'assessed') {
        expect(result.assessment.operationalStage.stage).toBe('PENDING')
        expect(result.assessment.alert.alert).toBe(expectedAlert)
      }
    },
  )

  it('wires an OPEN digital-original deviation into the Domain decision', () => {
    const digitalDeviation = deviation({
      observation: 'BL original digitalizado',
    })
    const correlation = correlated({
      matchedDeviations: [digitalDeviation],
      aggregation: {
        matchedDeviationCount: 1,
        openDeviationCount: 1,
        openBlockingDeviationCount: 0,
        openNonBlockingDeviationCount: 1,
        openUnclassifiedDeviationCount: 0,
      },
    })

    const result = assessCorrelatedOperationalProcess({
      etrackFacts: etrackFacts({
        observation: 'Aguardando envio do BL original digitalizado',
      }),
      deviationCorrelation: correlation,
      evaluationDate,
    })

    expect(result.status).toBe('assessed')
    if (result.status === 'assessed') {
      expect(
        result.assessment.deviationSummary.hasOpenDigitalOriginalDeviation,
      ).toBe(true)
      expect(result.assessment.digitalOriginal.status).toBe('AWAITING')
    }
  })

  it('wires an OPEN physical-original deviation into the Domain decision', () => {
    const physicalDeviation = deviation({
      observation: 'AWB original físico',
    })
    const correlation = correlated({
      matchedDeviations: [physicalDeviation],
      aggregation: {
        matchedDeviationCount: 1,
        openDeviationCount: 1,
        openBlockingDeviationCount: 0,
        openNonBlockingDeviationCount: 1,
        openUnclassifiedDeviationCount: 0,
      },
    })

    const result = assessCorrelatedOperationalProcess({
      etrackFacts: etrackFacts({
        observation: 'Processo em análise crítica',
        hasOriginalReceiptDate: false,
      }),
      deviationCorrelation: correlation,
      evaluationDate,
    })

    expect(result.status).toBe('assessed')
    if (result.status === 'assessed') {
      expect(
        result.assessment.deviationSummary.hasOpenPhysicalOriginalDeviation,
      ).toBe(true)
      expect(result.assessment.physicalOriginal.status).toBe('AWAITING')
    }
  })

  it('preserves AWAITING_MERCANTE together with READY_TO_CHECK', () => {
    const result = assessCorrelatedOperationalProcess({
      etrackFacts: etrackFacts({
        observation:
          'Digitação OK // Mercante aberto // Original digitalizado OK',
        hasMercanteReference: false,
      }),
      deviationCorrelation: correlated(),
      evaluationDate,
    })

    expect(result.status).toBe('assessed')
    if (result.status === 'assessed') {
      expect(result.assessment.operationalStage.stage).toBe('AWAITING_MERCANTE')
      expect(result.assessment.mercante.status).toBe('READY_TO_CHECK')
    }
  })

  it('preserves READY_FOR_REVIEW together with AWAITING_DIGITAL_ORIGINAL', () => {
    const digitalDeviation = deviation({
      observation: 'BL original digitalizado',
    })
    const result = assessCorrelatedOperationalProcess({
      etrackFacts: etrackFacts({
        observation:
          'Digitação OK // Aguardando envio do BL original digitalizado',
        hasMercanteReference: true,
      }),
      deviationCorrelation: correlated({
        matchedDeviations: [digitalDeviation],
        aggregation: {
          matchedDeviationCount: 1,
          openDeviationCount: 1,
          openBlockingDeviationCount: 0,
          openNonBlockingDeviationCount: 1,
          openUnclassifiedDeviationCount: 0,
        },
      }),
      evaluationDate,
    })

    expect(result.status).toBe('assessed')
    if (result.status === 'assessed') {
      expect(result.assessment.operationalStage.stage).toBe('READY_FOR_REVIEW')
      expect(result.assessment.mercante.status).toBe(
        'AWAITING_DIGITAL_ORIGINAL',
      )
    }
  })

  it('does not short-circuit an ineligible monitoring decision', () => {
    const result = assessCorrelatedOperationalProcess({
      etrackFacts: etrackFacts({ hasRegistration: true }),
      deviationCorrelation: correlated(),
      evaluationDate,
    })

    expect(result.status).toBe('assessed')
    if (result.status === 'assessed') {
      expect(result.assessment.monitoringEligibility.eligibility).toBe(
        'ineligible',
      )
      expect(result.assessment.operationalStage.stage).toBe('READY_FOR_REVIEW')
    }
  })

  it('does not short-circuit an undetermined monitoring decision', () => {
    const result = assessCorrelatedOperationalProcess({
      etrackFacts: etrackFacts({
        transportMode: 'unknown',
        observation: 'Aguardando dados de atracação // Digitação OK',
        estimatedArrivalDate: undefined,
        hasOriginalReceiptDate: false,
      }),
      deviationCorrelation: correlated(),
      evaluationDate,
    })

    expect(result.status).toBe('assessed')
    if (result.status === 'assessed') {
      expect(result.assessment.monitoringEligibility.eligibility).toBe(
        'undetermined',
      )
      expect(result.assessment.operationalStage.stage).toBe('TYPING_COMPLETED')
      expect(result.assessment.mercante.status).toBe('UNIDENTIFIED')
    }
  })

  it('preserves independent Domain reactions to an overdue ETA', () => {
    const result = assessCorrelatedOperationalProcess({
      etrackFacts: etrackFacts({
        observation: 'Processo em análise crítica',
        estimatedArrivalDate: civilDate(2026, 9, 8),
        hasMercanteReference: false,
        hasOriginalReceiptDate: false,
      }),
      deviationCorrelation: correlated({
        aggregation: {
          ...zeroAggregation,
          openDeviationCount: 1,
          openNonBlockingDeviationCount: 1,
        },
      }),
      evaluationDate,
    })

    expect(result.status).toBe('assessed')
    if (result.status === 'assessed') {
      expect(result.assessment.criticality.criticality).toBe(3)
      expect(result.assessment.alert.alert).toBe('ETA_OVERDUE_WITHOUT_ARRIVAL')
      expect(result.assessment.physicalOriginal.status).toBe(
        'PENDING_WITHOUT_OPEN_DEVIATION',
      )
      expect(result.assessment.mercante.status).toBe('AWAITING_OPENING')
    }
  })
})
