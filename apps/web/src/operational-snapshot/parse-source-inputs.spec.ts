import { describe, expect, it } from 'vitest'
import { parseOperationalSnapshotSourceInputs } from './parse-source-inputs'

describe('parseOperationalSnapshotSourceInputs', () => {
  it('accepts empty arrays for both sources', () => {
    expect(
      parseOperationalSnapshotSourceInputs({
        etrackRowsText: '[]',
        ecomexRowsText: '[]',
      }),
    ).toEqual({ status: 'valid', etrackRows: [], ecomexRows: [] })
  })

  it('reports invalid eTrack JSON without parsing source semantics', () => {
    expect(
      parseOperationalSnapshotSourceInputs({
        etrackRowsText: '[}',
        ecomexRowsText: '[]',
      }),
    ).toEqual({
      status: 'invalid',
      errors: { etrackRows: 'INVALID_JSON' },
    })
  })

  it('reports invalid eComex JSON', () => {
    expect(
      parseOperationalSnapshotSourceInputs({
        etrackRowsText: '[]',
        ecomexRowsText: '[}',
      }),
    ).toEqual({
      status: 'invalid',
      errors: { ecomexRows: 'INVALID_JSON' },
    })
  })

  it('accumulates syntax errors from both fields', () => {
    expect(
      parseOperationalSnapshotSourceInputs({
        etrackRowsText: '{',
        ecomexRowsText: 'not-json',
      }),
    ).toEqual({
      status: 'invalid',
      errors: {
        etrackRows: 'INVALID_JSON',
        ecomexRows: 'INVALID_JSON',
      },
    })
  })

  it('preserves parsed values without semantic normalization', () => {
    const result = parseOperationalSnapshotSourceInputs({
      etrackRowsText: JSON.stringify([
        {
          sourceVersion: ' version with spaces ',
          rowNumber: '2',
          rawData: { Observacoes: '  Texto COM Acento  ' },
        },
      ]),
      ecomexRowsText: JSON.stringify({ syntactically: 'valid' }),
    })

    expect(result).toEqual({
      status: 'valid',
      etrackRows: [
        {
          sourceVersion: ' version with spaces ',
          rowNumber: '2',
          rawData: { Observacoes: '  Texto COM Acento  ' },
        },
      ],
      ecomexRows: { syntactically: 'valid' },
    })
  })

  it('preserves U+FFFD exactly', () => {
    const result = parseOperationalSnapshotSourceInputs({
      etrackRowsText: '[]',
      ecomexRowsText:
        '[{"rawData":{"DESCR_DESVIO":"Documentos n\ufffdo recebidos"}}]',
    })

    expect(result.status).toBe('valid')
    if (result.status === 'valid') {
      expect(result.ecomexRows).toEqual([
        { rawData: { DESCR_DESVIO: 'Documentos n\ufffdo recebidos' } },
      ])
    }
  })
})
