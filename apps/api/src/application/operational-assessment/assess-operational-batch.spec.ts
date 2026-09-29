import type { CivilDate } from '@gestao-operacional/domain'
import { describe, expect, it } from 'vitest'
import {
  projectEComexOperationalDeviation,
  type EComexOperationalDeviation,
} from './project-ecomex-operational-deviation'
import type { ETrackOperationalFacts } from './project-etrack-operational-facts'
import { assessOperationalBatch } from './assess-operational-batch'

const evaluationDate: CivilDate = { year: 2026, month: 9, day: 29 }

function etrackFacts(
  customerReference: string | undefined,
  overrides: Partial<ETrackOperationalFacts> = {},
): ETrackOperationalFacts {
  return {
    processNumber: `PROCESS-${customerReference ?? 'MISSING'}`,
    customerReference,
    transportMode: 'maritime',
    observation: 'Processo em análise crítica',
    hasProcessId: true,
    hasRegistration: false,
    estimatedArrivalDate: { year: 2026, month: 10, day: 2 },
    hasArrival: false,
    hasMercanteReference: true,
    hasHouseReference: false,
    hasCargoAgent: true,
    hasOriginalReceiptDate: true,
    ...overrides,
  }
}

function deviation(
  ecomexShipmentReference: string,
  rowNumber = 2,
  description = 'Preço divergente',
): EComexOperationalDeviation {
  const projection = projectEComexOperationalDeviation({
    trace: {
      source: 'ecomex',
      sourceVersion: 'export-2026-09-29',
      rowNumber,
    },
    normalizedData: {
      shipmentReference: ecomexShipmentReference,
      deviationDescription: description,
      end: { kind: 'absent' },
      notes: undefined,
    },
    issues: [],
  })

  if (projection.status !== 'ready') {
    throw new Error('Expected a ready eComex fixture')
  }

  return projection.deviation
}

describe('assessOperationalBatch', () => {
  it('returns a valid empty batch', () => {
    expect(
      assessOperationalBatch({
        etrackFacts: [],
        ecomexDeviations: [],
        evaluationDate,
      }),
    ).toEqual({ evaluationDate, entries: [], diagnostics: [] })
  })

  it('assesses one process and preserves its Application context', () => {
    const facts = etrackFacts('420001/2026', {
      processNumber: '0401IG-0001-26',
    })
    const result = assessOperationalBatch({
      etrackFacts: [facts],
      ecomexDeviations: [],
      evaluationDate,
    })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0]).toMatchObject({
      index: 0,
      processNumber: '0401IG-0001-26',
      customerReference: '420001/2026',
      result: { status: 'assessed' },
    })
    expect(result.entries[0]?.result.etrackFacts).toBe(facts)
  })

  it('preserves input order across multiple assessed processes', () => {
    const facts = [
      etrackFacts('100/2026', { processNumber: 'PROCESS-C' }),
      etrackFacts('200/2026', { processNumber: 'PROCESS-A' }),
      etrackFacts('300/2026', { processNumber: 'PROCESS-B' }),
    ]

    const result = assessOperationalBatch({
      etrackFacts: facts,
      ecomexDeviations: [],
      evaluationDate,
    })

    expect(result.entries.map((entry) => entry.index)).toEqual([0, 1, 2])
    expect(result.entries.map((entry) => entry.processNumber)).toEqual([
      'PROCESS-C',
      'PROCESS-A',
      'PROCESS-B',
    ])
    expect(result.entries.map((entry) => entry.result.status)).toEqual([
      'assessed',
      'assessed',
      'assessed',
    ])
  })

  it('keeps processing after an unassessable process', () => {
    const result = assessOperationalBatch({
      etrackFacts: [
        etrackFacts('100/2026'),
        etrackFacts(undefined),
        etrackFacts('300/2026'),
      ],
      ecomexDeviations: [],
      evaluationDate,
    })

    expect(result.entries.map((entry) => entry.result.status)).toEqual([
      'assessed',
      'unassessable',
      'assessed',
    ])
  })

  it('returns a valid batch when every process is unassessable', () => {
    const result = assessOperationalBatch({
      etrackFacts: [etrackFacts(undefined), etrackFacts('SEM-DIGITOS')],
      ecomexDeviations: [],
      evaluationDate,
    })

    expect(result.entries.map((entry) => entry.result.status)).toEqual([
      'unassessable',
      'unassessable',
    ])
    expect(result.diagnostics).toEqual([])
  })

  it('uses the same explicit evaluation date for every process', () => {
    const result = assessOperationalBatch({
      etrackFacts: [etrackFacts('100/2026'), etrackFacts('200/2026')],
      ecomexDeviations: [],
      evaluationDate,
    })

    expect(result.evaluationDate).toBe(evaluationDate)
    for (const entry of result.entries) {
      expect(entry.result.evaluationDate).toBe(evaluationDate)
      expect(entry.result.status).toBe('assessed')
      if (entry.result.status === 'assessed') {
        expect(entry.result.assessmentFacts.evaluationDate).toBe(evaluationDate)
      }
    }
  })

  it('is deterministic for the same inputs', () => {
    const input = {
      etrackFacts: [etrackFacts('420001/2026')],
      ecomexDeviations: [deviation('420001/2026')],
      evaluationDate,
    } as const

    expect(assessOperationalBatch(input)).toEqual(assessOperationalBatch(input))
  })

  it('does not diagnose distinct usable keys as a collision', () => {
    const result = assessOperationalBatch({
      etrackFacts: [etrackFacts('ABC-001/2026'), etrackFacts('XYZ-002/2026')],
      ecomexDeviations: [],
      evaluationDate,
    })

    expect(result.diagnostics).toEqual([])
  })

  it('diagnoses distinct raw references that collapse to one legacy key', () => {
    const result = assessOperationalBatch({
      etrackFacts: [
        etrackFacts('ABC-001/2026', { processNumber: 'PROCESS-A' }),
        etrackFacts('XYZ-001/2026', { processNumber: 'PROCESS-B' }),
      ],
      ecomexDeviations: [],
      evaluationDate,
    })

    expect(result.diagnostics).toEqual([
      {
        code: 'LEGACY_ETRACK_CORRELATION_KEY_COLLISION',
        legacyCorrelationKey: '0012026',
        references: [
          {
            firstIndex: 0,
            processNumber: 'PROCESS-A',
            customerReference: 'ABC-001/2026',
          },
          {
            firstIndex: 1,
            processNumber: 'PROCESS-B',
            customerReference: 'XYZ-001/2026',
          },
        ],
      },
    ])
  })

  it('does not treat an exact repeated raw reference as normalization loss', () => {
    const result = assessOperationalBatch({
      etrackFacts: [
        etrackFacts('ABC-001/2026', { processNumber: 'PROCESS-A' }),
        etrackFacts('ABC-001/2026', { processNumber: 'PROCESS-B' }),
      ],
      ecomexDeviations: [],
      evaluationDate,
    })

    expect(result.diagnostics).toEqual([])
  })

  it('excludes missing and digitless references from collision detection', () => {
    const result = assessOperationalBatch({
      etrackFacts: [
        etrackFacts(undefined),
        etrackFacts('SEM-DIGITOS'),
        etrackFacts('OUTRA-REFERENCIA'),
      ],
      ecomexDeviations: [],
      evaluationDate,
    })

    expect(result.diagnostics).toEqual([])
    expect(
      result.entries.every((entry) => entry.result.status === 'unassessable'),
    ).toBe(true)
  })

  it('groups three distinct raw references in one ordered diagnostic', () => {
    const result = assessOperationalBatch({
      etrackFacts: [
        etrackFacts('A-001/2026', { processNumber: 'PROCESS-A' }),
        etrackFacts('B-001/2026', { processNumber: 'PROCESS-B' }),
        etrackFacts('A-001/2026', { processNumber: 'PROCESS-A-REPEATED' }),
        etrackFacts('C-001/2026', { processNumber: 'PROCESS-C' }),
      ],
      ecomexDeviations: [],
      evaluationDate,
    })

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]?.references).toEqual([
      {
        firstIndex: 0,
        processNumber: 'PROCESS-A',
        customerReference: 'A-001/2026',
      },
      {
        firstIndex: 1,
        processNumber: 'PROCESS-B',
        customerReference: 'B-001/2026',
      },
      {
        firstIndex: 3,
        processNumber: 'PROCESS-C',
        customerReference: 'C-001/2026',
      },
    ])
  })

  it('keeps diagnostics ordered by the first occurrence of each collision key', () => {
    const result = assessOperationalBatch({
      etrackFacts: [
        etrackFacts('A-002/2026'),
        etrackFacts('A-001/2026'),
        etrackFacts('B-001/2026'),
        etrackFacts('B-002/2026'),
      ],
      ecomexDeviations: [],
      evaluationDate,
    })

    expect(
      result.diagnostics.map((diagnostic) => diagnostic.legacyCorrelationKey),
    ).toEqual(['0022026', '0012026'])
  })

  it('preserves the legacy effect where two colliding processes receive the same deviation', () => {
    const sharedDeviation = deviation('001/2026')
    const result = assessOperationalBatch({
      etrackFacts: [
        etrackFacts('ABC-001/2026', { processNumber: 'PROCESS-A' }),
        etrackFacts('XYZ-001/2026', { processNumber: 'PROCESS-B' }),
      ],
      ecomexDeviations: [sharedDeviation],
      evaluationDate,
    })

    expect(result.entries.map((entry) => entry.result.status)).toEqual([
      'assessed',
      'assessed',
    ])
    for (const entry of result.entries) {
      if (entry.result.status === 'assessed') {
        expect(
          entry.result.deviationSummaryProjection.correlation.matchedDeviations,
        ).toEqual([sharedDeviation])
        expect(
          entry.result.assessment.deviationSummary.openBlockingDeviationCount,
        ).toBe(1)
      }
    }
    expect(result.diagnostics).toHaveLength(1)
  })

  it('preserves an individual eComex collision issue independently of batch diagnostics', () => {
    const result = assessOperationalBatch({
      etrackFacts: [etrackFacts('001/2026')],
      ecomexDeviations: [
        deviation('ABC-001/2026', 2),
        deviation('XYZ-001/2026', 3),
      ],
      evaluationDate,
    })

    expect(result.diagnostics).toEqual([])
    const entryResult = result.entries[0]?.result
    expect(entryResult?.status).toBe('assessed')
    if (entryResult?.status === 'assessed') {
      expect(entryResult.deviationSummaryProjection.correlation.issues).toEqual(
        [
          {
            code: 'LEGACY_CORRELATION_REFERENCE_COLLISION',
            legacyCorrelationKey: '0012026',
            ecomexShipmentReferences: ['ABC-001/2026', 'XYZ-001/2026'],
          },
        ],
      )
    }
  })

  it('uses the general digits-only key rather than the documentary slash-preserving key', () => {
    const result = assessOperationalBatch({
      etrackFacts: [etrackFacts('001/2026'), etrackFacts('001-2026')],
      ecomexDeviations: [],
      evaluationDate,
    })

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]?.legacyCorrelationKey).toBe('0012026')
    expect(
      result.diagnostics[0]?.references.map((item) => item.customerReference),
    ).toEqual(['001/2026', '001-2026'])
  })

  it('does not add a global status, priority, score, or structural counters', () => {
    const result = assessOperationalBatch({
      etrackFacts: [etrackFacts('001/2026')],
      ecomexDeviations: [],
      evaluationDate,
    })

    expect(Object.keys(result)).toEqual([
      'evaluationDate',
      'entries',
      'diagnostics',
    ])
    expect(result).not.toHaveProperty('status')
    expect(result).not.toHaveProperty('priority')
    expect(result).not.toHaveProperty('score')
    expect(result).not.toHaveProperty('assessedCount')
  })
})
