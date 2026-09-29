import {
  classifyDeviationImpact,
  determineDeviationLifecycle,
  type OperationalDeviationSummary,
} from '@gestao-operacional/domain'
import { describe, expect, it } from 'vitest'
import {
  correlateOperationalDeviations,
  type CorrelatedOperationalDeviations,
  type OpenDeviationImpactAggregation,
  type UncorrelatableOperationalDeviations,
} from './correlate-operational-deviations'
import type { EComexOperationalDeviation } from './project-ecomex-operational-deviation'
import type { ETrackOperationalFacts } from './project-etrack-operational-facts'
import {
  composeOperationalDeviationSummary,
  createDocumentLegacyCorrelationKey,
} from './compose-operational-deviation-summary'

const DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION =
  'Documentos originais não recebidos do Agente de Carga'

const zeroAggregation: OpenDeviationImpactAggregation = {
  matchedDeviationCount: 0,
  openDeviationCount: 0,
  openBlockingDeviationCount: 0,
  openNonBlockingDeviationCount: 0,
  openUnclassifiedDeviationCount: 0,
}

interface DeviationOptions {
  readonly description?: string
  readonly observation?: string
  readonly lifecycle?: 'OPEN' | 'CLOSED'
  readonly rowNumber?: number
  readonly reference?: string
}

function deviation(options: DeviationOptions = {}): EComexOperationalDeviation {
  const description = options.description ?? 'Preço divergente'
  const observation = options.observation

  return {
    trace: {
      source: 'ecomex',
      sourceVersion: 'export-2026-09-28',
      rowNumber: options.rowNumber ?? 2,
    },
    ecomexShipmentReference: options.reference ?? '420001/2026',
    description,
    observation,
    impact: classifyDeviationImpact({ description, observation }),
    lifecycle: determineDeviationLifecycle({
      hasEnd: options.lifecycle === 'CLOSED',
    }),
  }
}

function correlated(
  matchedDeviations: readonly EComexOperationalDeviation[] = [],
  aggregation: OpenDeviationImpactAggregation = {
    ...zeroAggregation,
    matchedDeviationCount: matchedDeviations.length,
  },
  issues: CorrelatedOperationalDeviations['issues'] = [],
  rawCustomerReference = '420001/2026',
): CorrelatedOperationalDeviations {
  return {
    status: 'correlated',
    rawCustomerReference,
    legacyCorrelationKey: rawCustomerReference.replace(/[^0-9]/g, ''),
    matchedDeviations,
    aggregation,
    reasonCode:
      matchedDeviations.length === 0
        ? 'NO_MATCHING_ECOMEX_DEVIATIONS'
        : 'MATCHING_ECOMEX_DEVIATIONS_FOUND',
    issues,
  }
}

function etrackFacts(customerReference: string): ETrackOperationalFacts {
  return {
    processNumber: '0001/2026',
    customerReference,
    transportMode: 'maritime',
    observation: undefined,
    hasProcessId: true,
    hasRegistration: false,
    estimatedArrivalDate: undefined,
    hasArrival: false,
    hasMercanteReference: false,
    hasHouseReference: false,
    hasCargoAgent: false,
    hasOriginalReceiptDate: false,
  }
}

function summaryOf(
  correlation: CorrelatedOperationalDeviations,
): OperationalDeviationSummary {
  const result = composeOperationalDeviationSummary(correlation)
  expect(result.status).toBe('ready')
  if (result.status !== 'ready') {
    throw new Error('Expected a ready summary')
  }
  return result.summary
}

describe('createDocumentLegacyCorrelationKey', () => {
  it.each([
    ['ABC001/2026', '001/2026'],
    ['001-2026', '0012026'],
    [' 001 / 2026 ', '001/2026'],
    ['0001/0026', '0001/0026'],
  ])('preserves only ASCII digits and slash for %s', (input, expected) => {
    expect(createDocumentLegacyCorrelationKey(input)).toBe(expected)
  })
})

describe('composeOperationalDeviationSummary', () => {
  it('builds a legitimate zero summary for a correlated result without matches', () => {
    const correlation = correlated()

    expect(composeOperationalDeviationSummary(correlation)).toEqual({
      status: 'ready',
      correlation,
      summary: {
        openBlockingDeviationCount: 0,
        openNonBlockingDeviationCount: 0,
        openUnclassifiedDeviationCount: 0,
        hasOpenDigitalOriginalDeviation: false,
        hasOpenPhysicalOriginalDeviation: false,
      },
      issues: [],
    })
  })

  it('copies all three OPEN counts from correlation without reaggregating deviations', () => {
    const existingAggregation: OpenDeviationImpactAggregation = {
      matchedDeviationCount: 8,
      openDeviationCount: 7,
      openBlockingDeviationCount: 3,
      openNonBlockingDeviationCount: 2,
      openUnclassifiedDeviationCount: 2,
    }

    expect(
      summaryOf(correlated([], existingAggregation)),
    ).toEqual<OperationalDeviationSummary>({
      openBlockingDeviationCount: 3,
      openNonBlockingDeviationCount: 2,
      openUnclassifiedDeviationCount: 2,
      hasOpenDigitalOriginalDeviation: false,
      hasOpenPhysicalOriginalDeviation: false,
    })
  })

  it.each(['Problema no Mercante', 'Falta Packing List'])(
    'does not treat another NON_BLOCKING deviation as documentary: %s',
    (description) => {
      const openDeviation = deviation({ description })

      expect(
        summaryOf(
          correlated([openDeviation], {
            matchedDeviationCount: 1,
            openDeviationCount: 1,
            openBlockingDeviationCount: 0,
            openNonBlockingDeviationCount: 1,
            openUnclassifiedDeviationCount: 0,
          }),
        ),
      ).toMatchObject({
        hasOpenDigitalOriginalDeviation: false,
        hasOpenPhysicalOriginalDeviation: false,
      })
    },
  )

  it.each([
    'BL original digitalizado',
    'conhecimento original digitalizado',
    'originais digitalizados',
    'orignal digitalizado',
  ])('recognizes a digital term before digitaliz: %s', (observation) => {
    const candidate = deviation({
      description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
      observation,
    })

    expect(
      summaryOf(
        correlated([candidate], {
          matchedDeviationCount: 1,
          openDeviationCount: 1,
          openBlockingDeviationCount: 0,
          openNonBlockingDeviationCount: 1,
          openUnclassifiedDeviationCount: 0,
        }),
      ).hasOpenDigitalOriginalDeviation,
    ).toBe(true)
  })

  it.each([
    'digitalização do BL original',
    'digitalizado conhecimento original',
  ])('recognizes digitaliz before a digital term: %s', (observation) => {
    const candidate = deviation({
      description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
      observation,
    })

    expect(
      summaryOf(correlated([candidate])).hasOpenDigitalOriginalDeviation,
    ).toBe(true)
  })

  it.each(['digitalizado', 'original recebido', 'documentação digital pronta'])(
    'does not generalize incomplete digital text: %s',
    (observation) => {
      const candidate = deviation({
        description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
        observation,
      })

      expect(
        summaryOf(correlated([candidate])).hasOpenDigitalOriginalDeviation,
      ).toBe(false)
    },
  )

  it.each([
    'conhecimento original físico',
    'BL original fisico',
    'AWB original físico',
    'HAWB orignal fisico',
  ])('recognizes characterized physical evidence: %s', (observation) => {
    const candidate = deviation({
      description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
      observation,
    })

    expect(
      summaryOf(correlated([candidate])).hasOpenPhysicalOriginalDeviation,
    ).toBe(true)
  })

  it.each(['BL físico', 'documento original físico', 'original físico AWB'])(
    'does not generalize unsupported physical text: %s',
    (observation) => {
      const candidate = deviation({
        description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
        observation,
      })

      expect(
        summaryOf(correlated([candidate])).hasOpenPhysicalOriginalDeviation,
      ).toBe(false)
    },
  )

  it('matches the documentary description case-insensitively with nao or não', () => {
    const digital = deviation({
      description: 'DOCUMENTOS ORIGINAIS NAO RECEBIDOS DO AGENTE DE CARGA',
      observation: 'BL original digitalizado',
      rowNumber: 10,
    })
    const physical = deviation({
      description: 'documentos originais não recebidos do agente de carga',
      observation: 'AWB original físico',
      rowNumber: 11,
    })

    expect(summaryOf(correlated([digital, physical]))).toMatchObject({
      hasOpenDigitalOriginalDeviation: true,
      hasOpenPhysicalOriginalDeviation: true,
    })
  })

  it('does not generalize a similar documentary description', () => {
    const similarDescription = deviation({
      description: 'Documento original não recebido do Agente de Carga',
      observation: 'BL original digitalizado // AWB original físico',
    })

    expect(summaryOf(correlated([similarDescription]))).toMatchObject({
      hasOpenDigitalOriginalDeviation: false,
      hasOpenPhysicalOriginalDeviation: false,
    })
  })

  it.each([
    ['digital', 'BL original digitalizado'],
    ['physical', 'AWB original físico'],
  ] as const)(
    'does not let a CLOSED %s deviation activate a flag',
    (kind, observation) => {
      const closedCandidate = deviation({
        description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
        observation,
        lifecycle: 'CLOSED',
      })
      const summary = summaryOf(
        correlated([closedCandidate], {
          matchedDeviationCount: 1,
          openDeviationCount: 0,
          openBlockingDeviationCount: 0,
          openNonBlockingDeviationCount: 0,
          openUnclassifiedDeviationCount: 0,
        }),
      )

      expect(
        kind === 'digital'
          ? summary.hasOpenDigitalOriginalDeviation
          : summary.hasOpenPhysicalOriginalDeviation,
      ).toBe(false)
    },
  )

  it('can activate the digital and physical flags independently in one summary', () => {
    const digital = deviation({
      description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
      observation: 'BL original digitalizado',
      rowNumber: 20,
    })
    const physical = deviation({
      description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
      observation: 'conhecimento original físico',
      rowNumber: 21,
    })

    expect(summaryOf(correlated([digital, physical]))).toMatchObject({
      hasOpenDigitalOriginalDeviation: true,
      hasOpenPhysicalOriginalDeviation: true,
    })
  })

  it('keeps general matches and counts while restricting flags by slash-preserving key', () => {
    const slashMatchWithoutEvidence = deviation({
      description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
      observation: 'Sem evidência documental específica',
      reference: 'ABC001/2026',
      rowNumber: 30,
    })
    const hyphenGeneralMatchWithDigitalEvidence = deviation({
      description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
      observation: 'BL original digitalizado',
      reference: '001-2026',
      rowNumber: 31,
    })
    const correlation = correlateOperationalDeviations(
      etrackFacts('001/2026'),
      [slashMatchWithoutEvidence, hyphenGeneralMatchWithDigitalEvidence],
    )

    expect(correlation.status).toBe('correlated')
    if (correlation.status !== 'correlated') {
      throw new Error('Expected correlated deviations')
    }
    expect(correlation.matchedDeviations).toHaveLength(2)
    expect(correlation.aggregation.openNonBlockingDeviationCount).toBe(2)
    expect(summaryOf(correlation)).toMatchObject({
      openNonBlockingDeviationCount: 2,
      hasOpenDigitalOriginalDeviation: false,
      hasOpenPhysicalOriginalDeviation: false,
    })
  })

  it('lets only the slash-compatible general match activate a documentary flag', () => {
    const slashMatch = deviation({
      description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
      observation: 'BL original digitalizado',
      reference: 'ABC001/2026',
      rowNumber: 32,
    })
    const hyphenGeneralMatch = deviation({
      description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
      observation: 'AWB original físico',
      reference: '001-2026',
      rowNumber: 33,
    })
    const correlation = correlateOperationalDeviations(
      etrackFacts('001/2026'),
      [slashMatch, hyphenGeneralMatch],
    )

    expect(correlation.status).toBe('correlated')
    if (correlation.status !== 'correlated') {
      throw new Error('Expected correlated deviations')
    }
    expect(summaryOf(correlation)).toMatchObject({
      openNonBlockingDeviationCount: 2,
      hasOpenDigitalOriginalDeviation: true,
      hasOpenPhysicalOriginalDeviation: false,
    })
  })

  it('preserves collision issues and duplicate counts from the general correlation', () => {
    const first = deviation({
      description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
      observation: 'BL original digitalizado',
      reference: 'ABC-001/2026',
      rowNumber: 40,
    })
    const second = deviation({
      description: DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION,
      observation: 'BL original digitalizado',
      reference: 'XYZ-001/2026',
      rowNumber: 41,
    })
    const collisionIssues: CorrelatedOperationalDeviations['issues'] = [
      {
        code: 'LEGACY_CORRELATION_REFERENCE_COLLISION',
        legacyCorrelationKey: '0012026',
        ecomexShipmentReferences: ['ABC-001/2026', 'XYZ-001/2026'],
      },
    ]
    const correlation = correlated(
      [first, second],
      {
        matchedDeviationCount: 2,
        openDeviationCount: 2,
        openBlockingDeviationCount: 0,
        openNonBlockingDeviationCount: 2,
        openUnclassifiedDeviationCount: 0,
      },
      collisionIssues,
      '001/2026',
    )
    const result = composeOperationalDeviationSummary(correlation)

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.correlation.matchedDeviations).toEqual([first, second])
      expect(result.correlation.issues).toBe(collisionIssues)
      expect(result.summary.openNonBlockingDeviationCount).toBe(2)
      expect(result.summary.hasOpenDigitalOriginalDeviation).toBe(true)
    }
  })

  it('preserves an uncorrelatable result without manufacturing zero facts', () => {
    const correlation: UncorrelatableOperationalDeviations = {
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

    const result = composeOperationalDeviationSummary(correlation)

    expect(result).toEqual({ status: 'uncorrelatable', correlation })
    expect(result).not.toHaveProperty('summary')
  })
})
