import type { CivilDate } from '@gestao-operacional/domain'
import { describe, expect, it } from 'vitest'
import type { EComexRowInput } from '../../imports/ecomex/ecomex-contract'
import type { ETrackRowInput } from '../../imports/etrack/etrack-contract'
import {
  runOperationalSnapshot,
  type OperationalSnapshotUseCaseResult,
} from './run-operational-snapshot'

const evaluationDate: CivilDate = { year: 2026, month: 9, day: 29 }

function etrackRow(
  rawData: Readonly<Record<string, unknown>> = {},
  rowNumber = 2,
): ETrackRowInput {
  return {
    sourceVersion: 'etrack-export-2026-09-29',
    rowNumber,
    rawData: {
      'Numero do Processo': `PROCESS-${rowNumber}`,
      'Referencia Cliente': `${420000 + rowNumber}/2026`,
      'Data da Previsão de Chegada': '2026-10-02',
      'Via Transporte': 'Marítima',
      Observações: 'Processo em análise crítica',
      Agente: 'Agente de Carga',
      ...rawData,
    },
  }
}

function ecomexRow(
  rawData: Readonly<Record<string, unknown>> = {},
  rowNumber = 2,
): EComexRowInput {
  return {
    sourceVersion: 'ecomex-export-2026-09-29',
    rowNumber,
    rawData: {
      EMBARQUE: `${420000 + rowNumber}/2026`,
      DESCR_DESVIO: 'Preço divergente',
      OBSERVACOES: 'Evidência preservada',
      ...rawData,
    },
  }
}

function readyResult(
  result: OperationalSnapshotUseCaseResult,
): Extract<OperationalSnapshotUseCaseResult, { status: 'ready' }> {
  expect(result.status).toBe('ready')
  if (result.status !== 'ready') {
    throw new Error('Expected a ready operational snapshot')
  }

  return result
}

function invalidResult(
  result: OperationalSnapshotUseCaseResult,
): Extract<
  OperationalSnapshotUseCaseResult,
  { status: 'invalid_source_data' }
> {
  expect(result.status).toBe('invalid_source_data')
  if (result.status !== 'invalid_source_data') {
    throw new Error('Expected invalid source data')
  }

  return result
}

describe('runOperationalSnapshot', () => {
  it('returns a ready empty batch for two valid empty sources', () => {
    const result = readyResult(
      runOperationalSnapshot({
        etrackRows: [],
        ecomexRows: [],
        evaluationDate,
      }),
    )

    expect(result).toEqual({
      status: 'ready',
      evaluationDate,
      etrackProjections: [],
      ecomexProjections: [],
      batchAssessment: { evaluationDate, entries: [], diagnostics: [] },
    })
  })

  it('assesses one valid eTrack row with an empty eComex source', () => {
    const result = readyResult(
      runOperationalSnapshot({
        etrackRows: [etrackRow()],
        ecomexRows: [],
        evaluationDate,
      }),
    )

    expect(result.batchAssessment.entries).toHaveLength(1)
    expect(result.batchAssessment.entries[0]?.result.status).toBe('assessed')
    expect(result.ecomexProjections).toEqual([])
  })

  it('preserves several eTrack rows and their input order', () => {
    const result = readyResult(
      runOperationalSnapshot({
        etrackRows: [
          etrackRow({ 'Numero do Processo': 'PROCESS-C' }, 2),
          etrackRow({ 'Numero do Processo': 'PROCESS-A' }, 3),
          etrackRow({ 'Numero do Processo': 'PROCESS-B' }, 4),
        ],
        ecomexRows: [],
        evaluationDate,
      }),
    )

    expect(
      result.batchAssessment.entries.map((entry) => entry.processNumber),
    ).toEqual(['PROCESS-C', 'PROCESS-A', 'PROCESS-B'])
  })

  it('projects both sources and assesses a correlated deviation', () => {
    const result = readyResult(
      runOperationalSnapshot({
        etrackRows: [etrackRow({ 'Referencia Cliente': '420001/2026' })],
        ecomexRows: [ecomexRow({ EMBARQUE: 'ABC-420001/2026' })],
        evaluationDate,
      }),
    )

    const entry = result.batchAssessment.entries[0]?.result
    expect(entry?.status).toBe('assessed')
    if (entry?.status === 'assessed') {
      expect(entry.assessment.deviationSummary).toMatchObject({
        openBlockingDeviationCount: 1,
        openNonBlockingDeviationCount: 0,
      })
    }
  })

  it('assesses multiple processes against multiple projected deviations', () => {
    const result = readyResult(
      runOperationalSnapshot({
        etrackRows: [
          etrackRow({ 'Referencia Cliente': '420001/2026' }, 2),
          etrackRow({ 'Referencia Cliente': '420002/2026' }, 3),
        ],
        ecomexRows: [
          ecomexRow({ EMBARQUE: '420001/2026' }, 2),
          ecomexRow(
            {
              EMBARQUE: '420002/2026',
              DESCR_DESVIO: 'Falta Packing List',
            },
            3,
          ),
        ],
        evaluationDate,
      }),
    )

    const first = result.batchAssessment.entries[0]?.result
    const second = result.batchAssessment.entries[1]?.result
    expect(first?.status).toBe('assessed')
    expect(second?.status).toBe('assessed')
    if (first?.status === 'assessed' && second?.status === 'assessed') {
      expect(first.assessment.deviationSummary).toMatchObject({
        openBlockingDeviationCount: 1,
        openNonBlockingDeviationCount: 0,
      })
      expect(second.assessment.deviationSummary).toMatchObject({
        openBlockingDeviationCount: 0,
        openNonBlockingDeviationCount: 1,
      })
    }
  })

  it('uses the explicit evaluation date for every process and is deterministic', () => {
    const input = {
      etrackRows: [etrackRow({}, 2), etrackRow({}, 3)],
      ecomexRows: [],
      evaluationDate,
    } as const

    const first = readyResult(runOperationalSnapshot(input))
    const second = runOperationalSnapshot(input)

    expect(first).toEqual(second)
    expect(first.batchAssessment.evaluationDate).toBe(evaluationDate)
    for (const entry of first.batchAssessment.entries) {
      expect(entry.result.evaluationDate).toBe(evaluationDate)
    }
  })

  it('blocks a technically invalid eTrack row even when its operational projection is ready', () => {
    const result = invalidResult(
      runOperationalSnapshot({
        etrackRows: [etrackRow({ 'Data do Faturamento': 'not-a-date' })],
        ecomexRows: [],
        evaluationDate,
      }),
    )

    expect(result.etrackFailures).toHaveLength(1)
    expect(result.etrackFailures[0]).toMatchObject({
      index: 0,
      trace: { source: 'etrack', rowNumber: 2 },
      projectionIssues: [],
    })
    expect(result.etrackFailures[0]?.importIssues).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        code: 'invalid_date',
        field: 'Data do Faturamento',
      }),
    )
    expect(result).not.toHaveProperty('batchAssessment')
  })

  it('blocks an eTrack row whose operational projection is invalid', () => {
    const result = invalidResult(
      runOperationalSnapshot({
        etrackRows: [
          etrackRow({ 'Data da Previsão de Chegada': 'not-a-date' }),
        ],
        ecomexRows: [],
        evaluationDate,
      }),
    )

    expect(result.etrackFailures[0]?.projectionIssues).toContainEqual({
      code: 'INVALID_ESTIMATED_ARRIVAL_DATE',
      fact: 'estimatedArrivalDate',
      value: 'not-a-date',
    })
  })

  it('blocks a technically invalid eComex row even when the ignored field does not invalidate its projection', () => {
    const result = invalidResult(
      runOperationalSnapshot({
        etrackRows: [],
        ecomexRows: [ecomexRow({ INICIO: 'not-a-date' })],
        evaluationDate,
      }),
    )

    expect(result.ecomexFailures).toHaveLength(1)
    expect(result.ecomexFailures[0]).toMatchObject({
      index: 0,
      trace: { source: 'ecomex', rowNumber: 2 },
      projectionIssues: [],
    })
    expect(result.ecomexFailures[0]?.importIssues).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        code: 'invalid_date',
        field: 'INICIO',
      }),
    )
  })

  it('blocks an invalid FIM instead of manufacturing an OPEN or CLOSED deviation', () => {
    const result = invalidResult(
      runOperationalSnapshot({
        etrackRows: [],
        ecomexRows: [ecomexRow({ FIM: 'not-a-date' })],
        evaluationDate,
      }),
    )

    expect(result.ecomexFailures[0]?.projectionIssues).toContainEqual({
      code: 'INVALID_END_DATE',
      fact: 'hasEnd',
      value: 'not-a-date',
    })
    expect(result).not.toHaveProperty('batchAssessment')
  })

  it('accumulates every failure from both sources before returning', () => {
    const result = invalidResult(
      runOperationalSnapshot({
        etrackRows: [
          etrackRow({ 'Data do Faturamento': 'invalid-a' }, 2),
          etrackRow({ 'Data da Previsão de Chegada': 'invalid-b' }, 3),
        ],
        ecomexRows: [
          ecomexRow({ INICIO: 'invalid-c' }, 2),
          ecomexRow({ FIM: 'invalid-d' }, 3),
        ],
        evaluationDate,
      }),
    )

    expect(result.etrackFailures.map((failure) => failure.index)).toEqual([
      0, 1,
    ])
    expect(result.ecomexFailures.map((failure) => failure.index)).toEqual([
      0, 1,
    ])
    expect(result).not.toHaveProperty('batchAssessment')
  })

  it('does not discard an invalid line to assess the remaining valid data', () => {
    const result = invalidResult(
      runOperationalSnapshot({
        etrackRows: [etrackRow()],
        ecomexRows: [ecomexRow(), ecomexRow({ FIM: 'invalid' }, 3)],
        evaluationDate,
      }),
    )

    expect(result.ecomexFailures).toHaveLength(1)
    expect(result).not.toHaveProperty('batchAssessment')
    expect(result).not.toHaveProperty('etrackProjections')
  })

  it('preserves acceptable importer warnings without blocking the snapshot', () => {
    const result = readyResult(
      runOperationalSnapshot({
        etrackRows: [etrackRow({ 'Via Transporte': 'Ferroviária' })],
        ecomexRows: [ecomexRow({ MODAL: 'RODOVIARIO' })],
        evaluationDate,
      }),
    )

    expect(result.etrackProjections[0]?.importIssues).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'unknown_transport_mode',
      }),
    ])
    expect(result.ecomexProjections[0]?.importIssues).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'unknown_transport_mode',
      }),
    ])
  })

  it('keeps an unknown but valid deviation ready for the Domain fallback', () => {
    const result = readyResult(
      runOperationalSnapshot({
        etrackRows: [etrackRow({ 'Referencia Cliente': '420001/2026' })],
        ecomexRows: [
          ecomexRow({
            EMBARQUE: '420001/2026',
            DESCR_DESVIO: 'Descrição ainda não catalogada',
          }),
        ],
        evaluationDate,
      }),
    )

    expect(result.ecomexProjections[0]?.deviation.impact).toMatchObject({
      classificationStatus: 'classified',
      impact: 'BLOCKING',
      reasonCode: 'UNKNOWN_DESCRIPTION_DEFAULTED_TO_BLOCKING',
    })
  })

  it('preserves valid duplicate eComex lines as separate deviations', () => {
    const result = readyResult(
      runOperationalSnapshot({
        etrackRows: [etrackRow({ 'Referencia Cliente': '420001/2026' })],
        ecomexRows: [
          ecomexRow({ EMBARQUE: '420001/2026' }, 2),
          ecomexRow({ EMBARQUE: '420001/2026' }, 3),
        ],
        evaluationDate,
      }),
    )

    const entry = result.batchAssessment.entries[0]?.result
    expect(entry?.status).toBe('assessed')
    if (entry?.status === 'assessed') {
      expect(entry.assessment.deviationSummary.openBlockingDeviationCount).toBe(
        2,
      )
    }
  })

  it('keeps the snapshot ready and preserves the batch collision diagnostic', () => {
    const result = readyResult(
      runOperationalSnapshot({
        etrackRows: [
          etrackRow(
            {
              'Numero do Processo': 'PROCESS-A',
              'Referencia Cliente': 'ABC-001/2026',
            },
            2,
          ),
          etrackRow(
            {
              'Numero do Processo': 'PROCESS-B',
              'Referencia Cliente': 'XYZ-001/2026',
            },
            3,
          ),
        ],
        ecomexRows: [ecomexRow({ EMBARQUE: '001/2026' })],
        evaluationDate,
      }),
    )

    expect(result.batchAssessment.diagnostics).toEqual([
      expect.objectContaining({
        code: 'LEGACY_ETRACK_CORRELATION_KEY_COLLISION',
        legacyCorrelationKey: '0012026',
      }),
    ])
    expect(
      result.batchAssessment.entries.map((entry) => entry.result.status),
    ).toEqual(['assessed', 'assessed'])
  })

  it('keeps a technically valid missing customer reference as an unassessable entry in a ready snapshot', () => {
    const result = readyResult(
      runOperationalSnapshot({
        etrackRows: [etrackRow({ 'Referencia Cliente': undefined })],
        ecomexRows: [],
        evaluationDate,
      }),
    )

    expect(result.etrackProjections[0]?.facts.customerReference).toBeUndefined()
    expect(result.batchAssessment.entries[0]?.result.status).toBe(
      'unassessable',
    )
  })

  it('returns a ready empty batch for an empty eTrack source and valid eComex rows', () => {
    const result = readyResult(
      runOperationalSnapshot({
        etrackRows: [],
        ecomexRows: [ecomexRow()],
        evaluationDate,
      }),
    )

    expect(result.ecomexProjections).toHaveLength(1)
    expect(result.batchAssessment.entries).toEqual([])
  })

  it('preserves U+FFFD exactly and does not attempt an encoding repair', () => {
    const corruptedDescription =
      'Documentos originais n�o recebidos do Agente de Carga'
    const result = readyResult(
      runOperationalSnapshot({
        etrackRows: [etrackRow({ 'Referencia Cliente': '420001/2026' })],
        ecomexRows: [
          ecomexRow({
            EMBARQUE: '420001/2026',
            DESCR_DESVIO: corruptedDescription,
          }),
        ],
        evaluationDate,
      }),
    )

    expect(result.ecomexProjections[0]?.deviation.description).toBe(
      corruptedDescription,
    )
    expect(result.ecomexProjections[0]?.deviation.impact).toMatchObject({
      impact: 'BLOCKING',
      reasonCode: 'UNKNOWN_DESCRIPTION_DEFAULTED_TO_BLOCKING',
    })
  })
})
