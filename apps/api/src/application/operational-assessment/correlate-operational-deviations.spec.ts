import {
  classifyDeviationImpact,
  determineDeviationLifecycle,
  type DeviationImpactDecision,
} from '@gestao-operacional/domain'
import { describe, expect, it } from 'vitest'
import type { EComexOperationalDeviation } from './project-ecomex-operational-deviation'
import type { ETrackOperationalFacts } from './project-etrack-operational-facts'
import {
  correlateOperationalDeviations,
  createLegacyCorrelationKey,
} from './correlate-operational-deviations'

function etrackFacts(
  overrides: Partial<ETrackOperationalFacts> = {},
): ETrackOperationalFacts {
  return {
    processNumber: '0401IG-0001-26',
    customerReference: '420001/2026',
    transportMode: 'maritime',
    observation: 'Observação do processo',
    hasProcessId: true,
    hasRegistration: false,
    estimatedArrivalDate: { year: 2026, month: 9, day: 28 },
    hasArrival: false,
    hasMercanteReference: false,
    hasHouseReference: false,
    hasCargoAgent: true,
    hasOriginalReceiptDate: false,
    ...overrides,
  }
}

interface DeviationOptions {
  readonly reference?: string
  readonly rowNumber?: number
  readonly description?: string
  readonly observation?: string
  readonly impact?: DeviationImpactDecision
  readonly lifecycle?: 'OPEN' | 'CLOSED'
}

function deviation(options: DeviationOptions = {}): EComexOperationalDeviation {
  const description = options.description ?? 'Preço divergente'
  const observation = options.observation
  const impact =
    options.impact ??
    classifyDeviationImpact({
      description,
      observation,
    })

  return {
    trace: {
      source: 'ecomex',
      sourceVersion: 'export-2026-09-28',
      rowNumber: options.rowNumber ?? 2,
    },
    ecomexShipmentReference: options.reference ?? '420001/2026',
    description,
    observation,
    impact,
    lifecycle: determineDeviationLifecycle({
      hasEnd: options.lifecycle === 'CLOSED',
    }),
  }
}

describe('legacy correlation key', () => {
  it.each([
    ['4200012026', '4200012026'],
    ['420001/2026', '4200012026'],
    ['420001-2026', '4200012026'],
    ['420001 2026', '4200012026'],
    ['ABC420001/2026', '4200012026'],
    ['ABC-0001/2026', '00012026'],
  ])('removes only non-ASCII digits from %s', (reference, expected) => {
    expect(createLegacyCorrelationKey(reference)).toBe(expected)
  })

  it.each([undefined, 'ABC', '/// --- ...'])(
    'does not produce an empty usable key for %s',
    (reference) => {
      expect(createLegacyCorrelationKey(reference)).toBeUndefined()
    },
  )
})

describe('operational deviation correlation', () => {
  it.each([
    ['4200012026', '4200012026'],
    ['420001/2026', '420001-2026'],
    ['420001 2026', 'ABC420001/2026'],
  ])(
    'correlates customer reference %s with eComex reference %s',
    (customerReference, ecomexShipmentReference) => {
      const matchedDeviation = deviation({
        reference: ecomexShipmentReference,
      })

      const result = correlateOperationalDeviations(
        etrackFacts({ customerReference }),
        [matchedDeviation],
      )

      expect(result.status).toBe('correlated')
      if (result.status === 'correlated') {
        expect(result.rawCustomerReference).toBe(customerReference)
        expect(result.legacyCorrelationKey).toBe('4200012026')
        expect(result.matchedDeviations).toEqual([matchedDeviation])
        expect(result.reasonCode).toBe('MATCHING_ECOMEX_DEVIATIONS_FOUND')
      }
    },
  )

  it('preserves leading zeroes and does not compare keys numerically', () => {
    const matching = deviation({ reference: 'ABC-0001/2026', rowNumber: 2 })
    const numericallySimilar = deviation({ reference: '1/2026', rowNumber: 3 })

    const result = correlateOperationalDeviations(
      etrackFacts({ customerReference: '0001-2026' }),
      [matching, numericallySimilar],
    )

    expect(result.status).toBe('correlated')
    if (result.status === 'correlated') {
      expect(result.legacyCorrelationKey).toBe('00012026')
      expect(result.matchedDeviations).toEqual([matching])
    }
  })

  it('keeps missing customer reference explicitly uncorrelatable', () => {
    const result = correlateOperationalDeviations(
      etrackFacts({ customerReference: undefined }),
      [deviation()],
    )

    expect(result).toEqual({
      status: 'uncorrelatable',
      rawCustomerReference: undefined,
      reasonCode: 'CUSTOMER_REFERENCE_MISSING',
      issues: [
        {
          code: 'CUSTOMER_REFERENCE_MISSING',
          rawCustomerReference: undefined,
        },
      ],
    })
  })

  it.each(['ABC', '/// --- ...'])(
    'keeps customer reference without digits uncorrelatable: %s',
    (customerReference) => {
      const result = correlateOperationalDeviations(
        etrackFacts({ customerReference }),
        [deviation({ reference: 'XYZ' })],
      )

      expect(result).toEqual({
        status: 'uncorrelatable',
        rawCustomerReference: customerReference,
        reasonCode: 'CUSTOMER_REFERENCE_HAS_NO_DIGITS',
        issues: [
          {
            code: 'CUSTOMER_REFERENCE_HAS_NO_DIGITS',
            rawCustomerReference: customerReference,
          },
        ],
      })
    },
  )

  it('treats zero matches as a successful correlation with zero counts', () => {
    const result = correlateOperationalDeviations(etrackFacts(), [
      deviation({ reference: '999999/2026' }),
    ])

    expect(result).toEqual({
      status: 'correlated',
      rawCustomerReference: '420001/2026',
      legacyCorrelationKey: '4200012026',
      matchedDeviations: [],
      aggregation: {
        matchedDeviationCount: 0,
        openDeviationCount: 0,
        openBlockingDeviationCount: 0,
        openNonBlockingDeviationCount: 0,
        openUnclassifiedDeviationCount: 0,
      },
      reasonCode: 'NO_MATCHING_ECOMEX_DEVIATIONS',
      issues: [],
    })
  })

  it('ignores an eComex reference that has no digits instead of matching an empty key', () => {
    const result = correlateOperationalDeviations(etrackFacts(), [
      deviation({ reference: 'EMBARQUE-SEM-NUMERO' }),
    ])

    expect(result.status).toBe('correlated')
    if (result.status === 'correlated') {
      expect(result.matchedDeviations).toEqual([])
      expect(result.aggregation.matchedDeviationCount).toBe(0)
    }
  })

  it('preserves every one-to-many match in input order with its trace', () => {
    const first = deviation({ reference: '420001/2026', rowNumber: 7 })
    const second = deviation({ reference: '420001-2026', rowNumber: 11 })

    const result = correlateOperationalDeviations(etrackFacts(), [
      first,
      deviation({ reference: '999999/2026', rowNumber: 9 }),
      second,
    ])

    expect(result.status).toBe('correlated')
    if (result.status === 'correlated') {
      expect(result.matchedDeviations).toEqual([first, second])
      expect(result.matchedDeviations.map(({ trace }) => trace)).toEqual([
        {
          source: 'ecomex',
          sourceVersion: 'export-2026-09-28',
          rowNumber: 7,
        },
        {
          source: 'ecomex',
          sourceVersion: 'export-2026-09-28',
          rowNumber: 11,
        },
      ])
    }
  })

  it('counts only OPEN deviations using their existing impact decisions', () => {
    const unclassifiedImpact = classifyDeviationImpact({
      description: undefined,
      observation: undefined,
    })
    const deviations = [
      deviation({ rowNumber: 2, lifecycle: 'OPEN' }),
      deviation({ rowNumber: 3, lifecycle: 'OPEN' }),
      deviation({
        rowNumber: 4,
        description: 'Falta Packing List',
        lifecycle: 'OPEN',
      }),
      deviation({
        rowNumber: 5,
        description: 'Falta certificado de origem',
        lifecycle: 'OPEN',
      }),
      deviation({
        rowNumber: 6,
        impact: unclassifiedImpact,
        lifecycle: 'OPEN',
      }),
      deviation({ rowNumber: 7, lifecycle: 'CLOSED' }),
    ]

    const result = correlateOperationalDeviations(etrackFacts(), deviations)

    expect(result.status).toBe('correlated')
    if (result.status === 'correlated') {
      expect(result.matchedDeviations).toEqual(deviations)
      expect(result.aggregation).toEqual({
        matchedDeviationCount: 6,
        openDeviationCount: 5,
        openBlockingDeviationCount: 2,
        openNonBlockingDeviationCount: 2,
        openUnclassifiedDeviationCount: 1,
      })
    }
  })

  it('keeps a CLOSED deviation traceable while excluding it from OPEN counts', () => {
    const closed = deviation({ lifecycle: 'CLOSED', rowNumber: 15 })

    const result = correlateOperationalDeviations(etrackFacts(), [closed])

    expect(result.status).toBe('correlated')
    if (result.status === 'correlated') {
      expect(result.matchedDeviations).toEqual([closed])
      expect(result.aggregation).toEqual({
        matchedDeviationCount: 1,
        openDeviationCount: 0,
        openBlockingDeviationCount: 0,
        openNonBlockingDeviationCount: 0,
        openUnclassifiedDeviationCount: 0,
      })
    }
  })

  it('counts equivalent OPEN lines separately without deduplication', () => {
    const first = deviation({ rowNumber: 20 })
    const second = deviation({ rowNumber: 21 })

    const result = correlateOperationalDeviations(etrackFacts(), [
      first,
      second,
    ])

    expect(result.status).toBe('correlated')
    if (result.status === 'correlated') {
      expect(result.matchedDeviations).toEqual([first, second])
      expect(result.aggregation.openBlockingDeviationCount).toBe(2)
      expect(result.issues).toEqual([])
    }
  })

  it('reports a lossy-key collision without removing either raw reference', () => {
    const first = deviation({ reference: 'ABC-001/2026', rowNumber: 30 })
    const second = deviation({ reference: 'XYZ-001/2026', rowNumber: 31 })

    const result = correlateOperationalDeviations(
      etrackFacts({ customerReference: '001/2026' }),
      [first, second],
    )

    expect(result.status).toBe('correlated')
    if (result.status === 'correlated') {
      expect(result.matchedDeviations).toEqual([first, second])
      expect(result.aggregation.openBlockingDeviationCount).toBe(2)
      expect(result.issues).toEqual([
        {
          code: 'LEGACY_CORRELATION_REFERENCE_COLLISION',
          legacyCorrelationKey: '0012026',
          ecomexShipmentReferences: ['ABC-001/2026', 'XYZ-001/2026'],
        },
      ])
    }
  })

  it('uses contained decisions without reclassifying source description or observation', () => {
    const nonBlockingDecision = classifyDeviationImpact({
      description: 'Falta Packing List',
      observation: undefined,
    })
    const preclassified = deviation({
      description: 'Preço divergente',
      observation: 'Texto que não deve ser reinterpretado',
      impact: nonBlockingDecision,
    })

    const result = correlateOperationalDeviations(etrackFacts(), [
      preclassified,
    ])

    expect(result.status).toBe('correlated')
    if (result.status === 'correlated') {
      expect(result.matchedDeviations[0]?.impact).toBe(nonBlockingDecision)
      expect(result.aggregation.openNonBlockingDeviationCount).toBe(1)
      expect(result.aggregation.openBlockingDeviationCount).toBe(0)
    }
  })

  it('does not use process number, modal or extra invoice data for matching', () => {
    const withExtraInvoice = {
      ...deviation({ reference: '420001/2026' }),
      invoice: 'INV-DOES-NOT-PARTICIPATE',
    }
    const first = correlateOperationalDeviations(
      etrackFacts({
        processNumber: 'PROCESS-A',
        transportMode: 'air',
        observation: 'Observação A',
      }),
      [withExtraInvoice],
    )
    const second = correlateOperationalDeviations(
      etrackFacts({
        processNumber: 'PROCESS-B',
        transportMode: 'unknown',
        observation: 'Observação B',
      }),
      [withExtraInvoice],
    )

    expect(first).toEqual(second)
  })

  it('keeps counts independent from eComex input order while preserving match order', () => {
    const blocking = deviation({ rowNumber: 40 })
    const nonBlocking = deviation({
      rowNumber: 41,
      description: 'Falta Packing List',
    })
    const forward = correlateOperationalDeviations(etrackFacts(), [
      blocking,
      nonBlocking,
    ])
    const reverse = correlateOperationalDeviations(etrackFacts(), [
      nonBlocking,
      blocking,
    ])

    expect(forward.status).toBe('correlated')
    expect(reverse.status).toBe('correlated')
    if (forward.status === 'correlated' && reverse.status === 'correlated') {
      expect(forward.aggregation).toEqual(reverse.aggregation)
      expect(forward.matchedDeviations).toEqual([blocking, nonBlocking])
      expect(reverse.matchedDeviations).toEqual([nonBlocking, blocking])
    }
  })
})
