import 'reflect-metadata'
import { BadRequestException, HttpStatus, RequestMethod } from '@nestjs/common'
import {
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants'
import { describe, expect, it, vi } from 'vitest'
import { runOperationalSnapshot } from '../../../application/operational-assessment/run-operational-snapshot'
import {
  handleOperationalSnapshotHttpRequest,
  OperationalSnapshotController,
} from './operational-snapshot.controller'
import { parseOperationalSnapshotHttpRequest } from './operational-snapshot-http'

function validBody(
  overrides: Readonly<Record<string, unknown>> = {},
): Readonly<Record<string, unknown>> {
  return {
    evaluationDate: '2026-09-29',
    etrackRows: [],
    ecomexRows: [],
    ...overrides,
  }
}

function etrackRow(
  rawData: Readonly<Record<string, unknown>> = {},
  rowNumber = 2,
): Readonly<Record<string, unknown>> {
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
): Readonly<Record<string, unknown>> {
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

function badRequestResponse(body: unknown): unknown {
  try {
    handleOperationalSnapshotHttpRequest(body)
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException)
    return (error as BadRequestException).getResponse()
  }

  throw new Error('Expected BadRequestException')
}

describe('operational snapshot HTTP contract', () => {
  it('registers exactly POST /operational-assessment/snapshot with HTTP 200', () => {
    const method = OperationalSnapshotController.prototype.createSnapshot

    expect(
      Reflect.getMetadata(PATH_METADATA, OperationalSnapshotController),
    ).toBe('operational-assessment')
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('snapshot')
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(
      RequestMethod.POST,
    )
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, method)).toBe(HttpStatus.OK)
  })

  it('converts a strict evaluation date into CivilDate', () => {
    expect(parseOperationalSnapshotHttpRequest(validBody())).toEqual({
      status: 'valid',
      input: {
        evaluationDate: { year: 2026, month: 9, day: 29 },
        etrackRows: [],
        ecomexRows: [],
      },
    })
  })

  it.each([
    [
      'missing evaluationDate',
      validBody({ evaluationDate: undefined }),
      'evaluationDate',
      'INVALID_EVALUATION_DATE',
    ],
    [
      'non-string evaluationDate',
      validBody({ evaluationDate: 20260929 }),
      'evaluationDate',
      'INVALID_EVALUATION_DATE',
    ],
    [
      'Brazilian evaluationDate',
      validBody({ evaluationDate: '29/09/2026' }),
      'evaluationDate',
      'INVALID_EVALUATION_DATE',
    ],
    [
      'date-time evaluationDate',
      validBody({ evaluationDate: '2026-09-29T10:00:00' }),
      'evaluationDate',
      'INVALID_EVALUATION_DATE',
    ],
    [
      'impossible evaluationDate',
      validBody({ evaluationDate: '2026-02-30' }),
      'evaluationDate',
      'INVALID_EVALUATION_DATE',
    ],
    [
      'evaluationDate with whitespace',
      validBody({ evaluationDate: ' 2026-09-29 ' }),
      'evaluationDate',
      'INVALID_EVALUATION_DATE',
    ],
    [
      'missing etrackRows',
      validBody({ etrackRows: undefined }),
      'etrackRows',
      'INVALID_ETRACK_ROWS',
    ],
    [
      'non-array etrackRows',
      validBody({ etrackRows: {} }),
      'etrackRows',
      'INVALID_ETRACK_ROWS',
    ],
    [
      'missing ecomexRows',
      validBody({ ecomexRows: undefined }),
      'ecomexRows',
      'INVALID_ECOMEX_ROWS',
    ],
    [
      'non-array ecomexRows',
      validBody({ ecomexRows: {} }),
      'ecomexRows',
      'INVALID_ECOMEX_ROWS',
    ],
    [
      'non-object row',
      validBody({ etrackRows: [null] }),
      'etrackRows[0]',
      'INVALID_ROW',
    ],
    [
      'non-object rawData',
      validBody({ etrackRows: [{ ...etrackRow(), rawData: [] }] }),
      'etrackRows[0].rawData',
      'INVALID_RAW_DATA',
    ],
    [
      'textual rowNumber',
      validBody({ etrackRows: [{ ...etrackRow(), rowNumber: '2' }] }),
      'etrackRows[0].rowNumber',
      'INVALID_ROW_NUMBER',
    ],
    [
      'numeric sourceVersion',
      validBody({ etrackRows: [{ ...etrackRow(), sourceVersion: 1 }] }),
      'etrackRows[0].sourceVersion',
      'INVALID_SOURCE_VERSION',
    ],
  ])('returns HTTP 400 for %s', (_name, body, path, code) => {
    expect(badRequestResponse(body)).toEqual({
      status: 'bad_request',
      issues: [expect.objectContaining({ path, code })],
    })
  })

  it('rejects a non-object body without coercion', () => {
    expect(badRequestResponse(null)).toEqual({
      status: 'bad_request',
      issues: [{ path: '$', code: 'INVALID_BODY' }],
    })
  })

  it('accumulates independent request contract issues', () => {
    expect(
      badRequestResponse({
        evaluationDate: '29/09/2026',
        etrackRows: 'not-an-array',
        ecomexRows: null,
      }),
    ).toEqual({
      status: 'bad_request',
      issues: [
        { path: 'evaluationDate', code: 'INVALID_EVALUATION_DATE' },
        { path: 'etrackRows', code: 'INVALID_ETRACK_ROWS' },
        { path: 'ecomexRows', code: 'INVALID_ECOMEX_ROWS' },
      ],
    })
  })

  it('does not execute the use case when the HTTP contract is invalid', () => {
    const executeSnapshot = vi.fn(runOperationalSnapshot)

    expect(() =>
      handleOperationalSnapshotHttpRequest(
        validBody({ evaluationDate: '29/09/2026' }),
        executeSnapshot,
      ),
    ).toThrow(BadRequestException)
    expect(executeSnapshot).not.toHaveBeenCalled()
  })

  it('calls runOperationalSnapshot once for a valid request', () => {
    const executeSnapshot = vi.fn(runOperationalSnapshot)

    handleOperationalSnapshotHttpRequest(validBody(), executeSnapshot)

    expect(executeSnapshot).toHaveBeenCalledTimes(1)
    expect(executeSnapshot).toHaveBeenCalledWith({
      evaluationDate: { year: 2026, month: 9, day: 29 },
      etrackRows: [],
      ecomexRows: [],
    })
  })

  it('returns ready with an empty batch for a valid empty request', () => {
    expect(handleOperationalSnapshotHttpRequest(validBody())).toEqual({
      status: 'ready',
      evaluationDate: '2026-09-29',
      warnings: { etrack: [], ecomex: [] },
      batch: { entries: [], diagnostics: [] },
    })
  })

  it('delegates a valid body through the registered controller method', () => {
    const controller = new OperationalSnapshotController()

    expect(controller.createSnapshot(validBody())).toMatchObject({
      status: 'ready',
      batch: { entries: [], diagnostics: [] },
    })
  })

  it('returns ready for valid operational eTrack data', () => {
    const response = handleOperationalSnapshotHttpRequest(
      validBody({ etrackRows: [etrackRow()] }),
    )

    expect(response.status).toBe('ready')
    if (response.status === 'ready') {
      expect(response.batch.entries[0]?.result.status).toBe('assessed')
    }
  })

  it('returns ready for valid correlated eTrack and eComex data', () => {
    const response = handleOperationalSnapshotHttpRequest(
      validBody({
        etrackRows: [etrackRow({ 'Referencia Cliente': '420001/2026' })],
        ecomexRows: [ecomexRow({ EMBARQUE: '420001/2026' })],
      }),
    )

    expect(response.status).toBe('ready')
    if (response.status === 'ready') {
      const result = response.batch.entries[0]?.result
      expect(result?.status).toBe('assessed')
      if (result?.status === 'assessed') {
        expect(
          result.assessment.deviationSummary.openBlockingDeviationCount,
        ).toBe(1)
      }
    }
  })

  it.each([
    [
      'technically invalid eTrack row',
      validBody({
        etrackRows: [etrackRow({ 'Numero do Processo': undefined })],
      }),
      'etrack',
    ],
    [
      'invalid ETA',
      validBody({
        etrackRows: [
          etrackRow({ 'Data da Previsão de Chegada': 'not-a-date' }),
        ],
      }),
      'etrack',
    ],
    [
      'invalid FIM',
      validBody({ ecomexRows: [ecomexRow({ FIM: 'not-a-date' })] }),
      'ecomex',
    ],
  ])(
    'returns HTTP 200 plus invalid_source_data for %s',
    (_name, body, source) => {
      const response = handleOperationalSnapshotHttpRequest(body)

      expect(response.status).toBe('invalid_source_data')
      if (response.status === 'invalid_source_data') {
        expect(response.failures[source as 'etrack' | 'ecomex']).toHaveLength(1)
      }
    },
  )

  it('keeps a missing customer reference as ready with an unassessable entry', () => {
    const response = handleOperationalSnapshotHttpRequest(
      validBody({
        etrackRows: [etrackRow({ 'Referencia Cliente': undefined })],
      }),
    )

    expect(response.status).toBe('ready')
    if (response.status === 'ready') {
      expect(response.batch.entries[0]?.result.status).toBe('unassessable')
    }
  })

  it('preserves batch collision diagnostics in a ready response', () => {
    const response = handleOperationalSnapshotHttpRequest(
      validBody({
        etrackRows: [
          etrackRow({ 'Referencia Cliente': 'ABC-001/2026' }, 2),
          etrackRow({ 'Referencia Cliente': 'XYZ-001/2026' }, 3),
        ],
        ecomexRows: [ecomexRow({ EMBARQUE: '001/2026' })],
      }),
    )

    expect(response.status).toBe('ready')
    if (response.status === 'ready') {
      expect(response.batch.diagnostics).toEqual([
        expect.objectContaining({
          code: 'LEGACY_ETRACK_CORRELATION_KEY_COLLISION',
        }),
      ])
    }
  })

  it('returns acceptable technical warnings without changing the HTTP result', () => {
    const response = handleOperationalSnapshotHttpRequest(
      validBody({
        etrackRows: [etrackRow({ 'Via Transporte': 'Ferroviária' })],
        ecomexRows: [ecomexRow({ MODAL: 'RODOVIARIO' })],
      }),
    )

    expect(response.status).toBe('ready')
    if (response.status === 'ready') {
      expect(response.warnings.etrack[0]?.issues[0]?.code).toBe(
        'unknown_transport_mode',
      )
      expect(response.warnings.ecomex[0]?.issues[0]?.code).toBe(
        'unknown_transport_mode',
      )
    }
  })

  it('preserves rawData including U+FFFD until the Application boundary', () => {
    const rawData = {
      EMBARQUE: '420001/2026',
      DESCR_DESVIO: 'Documentos originais n�o recebidos do Agente de Carga',
    }
    const row = ecomexRow(rawData)
    const executeSnapshot = vi.fn(runOperationalSnapshot)

    handleOperationalSnapshotHttpRequest(
      validBody({ ecomexRows: [row] }),
      executeSnapshot,
    )

    const input = executeSnapshot.mock.calls[0]?.[0]
    expect(input?.ecomexRows[0]?.rawData).toBe(row.rawData)
    expect(input?.ecomexRows[0]?.rawData.DESCR_DESVIO).toBe(
      rawData.DESCR_DESVIO,
    )
  })

  it('does not echo the complete rawData in the response', () => {
    const response = handleOperationalSnapshotHttpRequest(
      validBody({
        etrackRows: [etrackRow({ PRIVATE_EXTRA_FIELD: 'DO_NOT_ECHO' })],
      }),
    )

    expect(JSON.stringify(response)).not.toContain('PRIVATE_EXTRA_FIELD')
    expect(JSON.stringify(response)).not.toContain('DO_NOT_ECHO')
  })
})
