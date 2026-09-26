import { describe, expect, it } from 'vitest'
import { ETRACK_HEADERS, type ETrackRowInput } from './etrack-contract'
import { importETrackRow, validateETrackHeaders } from './etrack-importer'

const completeRow = {
  'Numero do Processo': '0401IG-0001-26',
  'Referencia Cliente': '420001/2026',
  'Data da Previsão de Chegada': '2026-10-01',
  'Data Chegada': '2026-10-02T09:30:00',
  'Via Transporte': 'Marítima',
  'Data Registro': '2026-10-03',
  'Nº CE MERCANTE': '000123456789',
  'Datas Originais': '2026-10-04',
  Observações: 'Texto técnico preservado, com acentuação e pontuação.',
  House: '001234567890',
  Master: '009876543210',
  Agente: 'AGENTE FICTÍCIO',
  'Data do Faturamento': '2026-10-05T14:45:30-03:00',
} as const

function rowInput(rawData: Readonly<Record<string, unknown>>): ETrackRowInput {
  return {
    sourceVersion: 'export-2026-09-26',
    rowNumber: 2,
    rawData,
  }
}

describe('eTrack header contract', () => {
  it('accepts the known headers and additional fields', () => {
    const result = validateETrackHeaders([...ETRACK_HEADERS, 'Campo adicional'])

    expect(result).toEqual({ source: 'etrack', issues: [] })
  })

  it('reports a missing required header explicitly', () => {
    const result = validateETrackHeaders(['Referencia Cliente'])

    expect(result.issues).toEqual([
      expect.objectContaining({
        kind: 'header_error',
        code: 'missing_required_header',
        field: 'Numero do Processo',
      }),
    ])
  })

  it('reports an empty header set as a structural error', () => {
    const result = validateETrackHeaders([])

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        kind: 'structural_error',
        code: 'empty_header_set',
      }),
    )
  })

  it('reports a duplicated required header', () => {
    const result = validateETrackHeaders([
      'Numero do Processo',
      'Numero do Processo',
    ])

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        kind: 'header_error',
        code: 'duplicate_header',
        field: 'Numero do Processo',
      }),
    )
  })
})

describe('eTrack row import', () => {
  it('imports a complete valid row with traceability', () => {
    const result = importETrackRow(rowInput(completeRow))

    expect(result.trace).toEqual({
      source: 'etrack',
      sourceVersion: 'export-2026-09-26',
      rowNumber: 2,
    })
    expect(result.rawData).toEqual(completeRow)
    expect(result.normalizedData).toEqual({
      processNumber: '0401IG-0001-26',
      customerReference: '420001/2026',
      estimatedArrival: { kind: 'date', value: '2026-10-01' },
      arrival: { kind: 'date-time', value: '2026-10-02T09:30:00' },
      transportMode: { kind: 'known', value: 'Marítima' },
      registrationDate: { kind: 'date', value: '2026-10-03' },
      mercanteNumber: '000123456789',
      originalDate: { kind: 'date', value: '2026-10-04' },
      notes: 'Texto técnico preservado, com acentuação e pontuação.',
      house: '001234567890',
      master: '009876543210',
      agent: 'AGENTE FICTÍCIO',
      billingDate: {
        kind: 'date-time',
        value: '2026-10-05T14:45:30-03:00',
      },
    })
    expect(result.issues).toEqual([])
  })

  it('normalizes empty optional cells as technical absence', () => {
    const result = importETrackRow(
      rowInput({
        'Numero do Processo': 'PROCESS-001',
        'Referencia Cliente': '',
        'Data da Previsão de Chegada': '   ',
        'Via Transporte': null,
        House: undefined,
      }),
    )

    expect(result.normalizedData.customerReference).toBeUndefined()
    expect(result.normalizedData.estimatedArrival).toEqual({ kind: 'absent' })
    expect(result.normalizedData.transportMode).toEqual({ kind: 'absent' })
    expect(result.normalizedData.house).toBeUndefined()
    expect(result.issues).toEqual([])
  })

  it('reports an empty process number without deciding line acceptance', () => {
    const result = importETrackRow(
      rowInput({
        'Numero do Processo': '   ',
        'Referencia Cliente': '420001/2026',
      }),
    )

    expect(result.normalizedData.processNumber).toBeUndefined()
    expect(result.normalizedData.customerReference).toBe('420001/2026')
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        kind: 'row_error',
        code: 'missing_required_value',
        field: 'Numero do Processo',
        rowNumber: 2,
      }),
    )
  })

  it('removes external spaces from identifiers and preserves observations', () => {
    const notes = '  Linha 1\nLinha 2  com  espaços internos.  '
    const result = importETrackRow(
      rowInput({
        'Numero do Processo': '  0401IG-0001-26  ',
        'Referencia Cliente': '  420001/2026  ',
        Observações: notes,
      }),
    )

    expect(result.normalizedData.processNumber).toBe('0401IG-0001-26')
    expect(result.normalizedData.customerReference).toBe('420001/2026')
    expect(result.normalizedData.notes).toBe(notes)
  })

  it('keeps numeric identifiers, House, Master and Mercante as text', () => {
    const result = importETrackRow(
      rowInput({
        'Numero do Processo': '000401',
        'Referencia Cliente': '000420001',
        House: '000001',
        Master: '000002',
        'Nº CE MERCANTE': '000003',
      }),
    )

    expect(result.normalizedData).toEqual(
      expect.objectContaining({
        processNumber: '000401',
        customerReference: '000420001',
        house: '000001',
        master: '000002',
        mercanteNumber: '000003',
      }),
    )
  })

  it('converts safe numeric cells to their textual representation', () => {
    const result = importETrackRow(
      rowInput({
        'Numero do Processo': 401,
        'Referencia Cliente': 420001,
        House: 1001,
        Master: 1002,
        'Nº CE MERCANTE': 1003,
      }),
    )

    expect(result.normalizedData).toEqual(
      expect.objectContaining({
        processNumber: '401',
        customerReference: '420001',
        house: '1001',
        master: '1002',
        mercanteNumber: '1003',
      }),
    )
  })

  it.each([
    ['date', '2026-09-26', { kind: 'date', value: '2026-09-26' }],
    [
      'date-time',
      '2026-09-26 16:20:30',
      { kind: 'date-time', value: '2026-09-26T16:20:30' },
    ],
    ['empty date', ' ', { kind: 'absent' }],
  ])(
    'represents a valid %s without timezone conversion',
    (_, value, expected) => {
      const result = importETrackRow(
        rowInput({
          'Numero do Processo': 'PROCESS-002',
          'Data Chegada': value,
        }),
      )

      expect(result.normalizedData.arrival).toEqual(expected)
    },
  )

  it('keeps an invalid date explicit and reports its issue', () => {
    const result = importETrackRow(
      rowInput({
        'Numero do Processo': 'PROCESS-003',
        'Data Registro': '2026-02-30',
      }),
    )

    expect(result.normalizedData.registrationDate).toEqual({
      kind: 'invalid',
      value: '2026-02-30',
    })
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        kind: 'invalid_value',
        code: 'invalid_date',
        field: 'Data Registro',
      }),
    )
  })

  it.each(['Aérea', 'Marítima'] as const)(
    'represents the known modal %s without deriving operational meaning',
    (transportMode) => {
      const result = importETrackRow(
        rowInput({
          'Numero do Processo': 'PROCESS-004',
          'Via Transporte': transportMode,
        }),
      )

      expect(result.normalizedData.transportMode).toEqual({
        kind: 'known',
        value: transportMode,
      })
      expect(result.issues).toEqual([])
    },
  )

  it('preserves an unknown modal and reports a non-fatal issue', () => {
    const result = importETrackRow(
      rowInput({
        'Numero do Processo': 'PROCESS-005',
        'Via Transporte': 'Ferroviária',
      }),
    )

    expect(result.normalizedData.transportMode).toEqual({
      kind: 'unknown',
      value: 'Ferroviária',
    })
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        kind: 'unknown_value',
        severity: 'warning',
        code: 'unknown_transport_mode',
      }),
    )
  })

  it('preserves a long observation without semantic normalization', () => {
    const observation =
      'Registro livre: ÁÉÍÓÚ; pontuação!?\nSegunda linha com  dois espaços e CÓDIGO-001. '.repeat(
        20,
      )
    const result = importETrackRow(
      rowInput({
        'Numero do Processo': 'PROCESS-006',
        Observações: observation,
      }),
    )

    expect(result.normalizedData.notes).toBe(observation)
  })

  it('preserves additional fields in raw data without projecting them', () => {
    const rawData = {
      'Numero do Processo': 'PROCESS-007',
      'Campo adicional': 'valor preservado',
    }
    const result = importETrackRow(rowInput(rawData))

    expect(result.rawData).toEqual(rawData)
    expect(result.normalizedData).not.toHaveProperty('Campo adicional')
    expect(result.issues).toEqual([])
  })

  it('returns normalized data and issues for a partially invalid row', () => {
    const result = importETrackRow(
      rowInput({
        'Numero do Processo': '0401IG-0001-26',
        'Referencia Cliente': '420001/2026',
        'Data da Previsão de Chegada': 'não é uma data',
        House: { unexpected: true },
      }),
    )

    expect(result.normalizedData.processNumber).toBe('0401IG-0001-26')
    expect(result.normalizedData.customerReference).toBe('420001/2026')
    expect(result.normalizedData.estimatedArrival.kind).toBe('invalid')
    expect(result.normalizedData.house).toBeUndefined()
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'invalid_value',
          field: 'Data da Previsão de Chegada',
        }),
        expect.objectContaining({
          kind: 'invalid_value',
          field: 'House',
        }),
      ]),
    )
  })

  it('preserves process number and customer reference in full', () => {
    const result = importETrackRow(
      rowInput({
        'Numero do Processo': '0401IG-0001-26',
        'Referencia Cliente': '420001/2026',
      }),
    )

    expect(result.normalizedData.processNumber).toBe('0401IG-0001-26')
    expect(result.normalizedData.customerReference).toBe('420001/2026')
  })
})
