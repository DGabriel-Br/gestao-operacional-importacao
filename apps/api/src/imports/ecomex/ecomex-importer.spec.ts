import { describe, expect, it } from 'vitest'
import { ECOMEX_HEADERS, type EComexRowInput } from './ecomex-contract'
import { importEComexRow, validateEComexHeaders } from './ecomex-importer'

const completeRow = {
  EMBARQUE: '420001/2026',
  MODAL: 'MARITIMO',
  DESCR_DESVIO: 'Desvio: Exemplo técnico',
  INICIO: '2026-09-20',
  FIM: '2026-09-21T10:30:00-03:00',
  OBSERVACOES: '  Texto livre, com acentuação!\nSegunda linha.  ',
  JUSTIFICATIVA: '  Justificativa recebida da fonte.  ',
  APONTADO_POR: 'PESSOA FICTÍCIA 01',
  CONCLUIDO_POR: 'PESSOA FICTÍCIA 02',
  EXPORT_NOME: 'EMPRESA FICTÍCIA',
  INVOICE: 'INV-001/2026',
} as const

function rowInput(rawData: Readonly<Record<string, unknown>>): EComexRowInput {
  return {
    sourceVersion: 'export-2026-09-26',
    rowNumber: 2,
    rawData,
  }
}

describe('eComex header contract', () => {
  it('accepts known headers and additional fields', () => {
    const result = validateEComexHeaders([...ECOMEX_HEADERS, 'CAMPO_ADICIONAL'])

    expect(result).toEqual({ source: 'ecomex', issues: [] })
  })

  it.each(['EMBARQUE', 'DESCR_DESVIO'] as const)(
    'reports the missing required header %s',
    (missingHeader) => {
      const headers = ECOMEX_HEADERS.filter(
        (header) => header !== missingHeader,
      )
      const result = validateEComexHeaders(headers)

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          kind: 'header_error',
          code: 'missing_required_header',
          field: missingHeader,
        }),
      )
    },
  )

  it('reports an empty header set as a structural error', () => {
    const result = validateEComexHeaders([])

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        kind: 'structural_error',
        code: 'empty_header_set',
      }),
    )
  })

  it.each(['EMBARQUE', 'DESCR_DESVIO'] as const)(
    'reports the duplicated required header %s',
    (duplicatedHeader) => {
      const result = validateEComexHeaders([
        ...ECOMEX_HEADERS,
        duplicatedHeader,
      ])

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          kind: 'header_error',
          code: 'duplicate_header',
          field: duplicatedHeader,
        }),
      )
    },
  )
})

describe('eComex row import', () => {
  it('imports a complete valid row with traceability', () => {
    const result = importEComexRow(rowInput(completeRow))

    expect(result.trace).toEqual({
      source: 'ecomex',
      sourceVersion: 'export-2026-09-26',
      rowNumber: 2,
    })
    expect(result.rawData).toEqual(completeRow)
    expect(result.normalizedData).toEqual({
      shipmentReference: '420001/2026',
      transportMode: { kind: 'known', value: 'MARITIMO' },
      deviationDescription: 'Desvio: Exemplo técnico',
      start: { kind: 'date', value: '2026-09-20' },
      end: { kind: 'date-time', value: '2026-09-21T10:30:00-03:00' },
      notes: '  Texto livre, com acentuação!\nSegunda linha.  ',
      justification: '  Justificativa recebida da fonte.  ',
      reportedBy: 'PESSOA FICTÍCIA 01',
      completedBy: 'PESSOA FICTÍCIA 02',
      exportName: 'EMPRESA FICTÍCIA',
      invoice: 'INV-001/2026',
    })
    expect(result.issues).toEqual([])
  })

  it('normalizes empty optional cells as technical absence', () => {
    const result = importEComexRow(
      rowInput({
        EMBARQUE: '420001/2026',
        DESCR_DESVIO: 'Descrição técnica',
        MODAL: null,
        INICIO: '',
        FIM: '   ',
        OBSERVACOES: undefined,
        JUSTIFICATIVA: null,
        APONTADO_POR: '',
        CONCLUIDO_POR: ' ',
        EXPORT_NOME: undefined,
        INVOICE: null,
      }),
    )

    expect(result.normalizedData).toEqual({
      shipmentReference: '420001/2026',
      transportMode: { kind: 'absent' },
      deviationDescription: 'Descrição técnica',
      start: { kind: 'absent' },
      end: { kind: 'absent' },
      notes: undefined,
      justification: undefined,
      reportedBy: undefined,
      completedBy: undefined,
      exportName: undefined,
      invoice: undefined,
    })
    expect(result.issues).toEqual([])
  })

  it.each(['EMBARQUE', 'DESCR_DESVIO'] as const)(
    'reports an empty required value in %s without deciding line acceptance',
    (field) => {
      const result = importEComexRow(
        rowInput({
          EMBARQUE: '420001/2026',
          DESCR_DESVIO: 'Descrição técnica',
          [field]: '   ',
        }),
      )

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          kind: 'row_error',
          code: 'missing_required_value',
          field,
          rowNumber: 2,
        }),
      )
    },
  )

  it('removes external spaces only from structured text fields', () => {
    const result = importEComexRow(
      rowInput({
        EMBARQUE: '  420001/2026  ',
        DESCR_DESVIO: '  Desvio: Exemplo técnico  ',
        APONTADO_POR: '  PESSOA FICTÍCIA  ',
        INVOICE: '  INV-001  ',
      }),
    )

    expect(result.normalizedData.shipmentReference).toBe('420001/2026')
    expect(result.normalizedData.deviationDescription).toBe(
      'Desvio: Exemplo técnico',
    )
    expect(result.normalizedData.reportedBy).toBe('PESSOA FICTÍCIA')
    expect(result.normalizedData.invoice).toBe('INV-001')
  })

  it('preserves EMBARQUE and INVOICE as complete text identifiers', () => {
    const result = importEComexRow(
      rowInput({
        EMBARQUE: '00420001/2026-A',
        DESCR_DESVIO: 'Descrição técnica',
        INVOICE: '00 INV-001/2026-B',
      }),
    )

    expect(result.normalizedData.shipmentReference).toBe('00420001/2026-A')
    expect(result.normalizedData.invoice).toBe('00 INV-001/2026-B')
  })

  it('converts safe numeric identifier cells to text', () => {
    const result = importEComexRow(
      rowInput({
        EMBARQUE: 420001,
        DESCR_DESVIO: 'Descrição técnica',
        INVOICE: 1001,
      }),
    )

    expect(result.normalizedData.shipmentReference).toBe('420001')
    expect(result.normalizedData.invoice).toBe('1001')
  })

  it.each([
    ['date', '2026-09-20', { kind: 'date', value: '2026-09-20' }],
    [
      'date-time',
      '2026-09-20 14:30:00',
      { kind: 'date-time', value: '2026-09-20T14:30:00' },
    ],
    ['empty value', ' ', { kind: 'absent' }],
  ])(
    'represents INICIO as %s without timezone conversion',
    (_, value, expected) => {
      const result = importEComexRow(
        rowInput({
          EMBARQUE: '420001/2026',
          DESCR_DESVIO: 'Descrição técnica',
          INICIO: value,
        }),
      )

      expect(result.normalizedData.start).toEqual(expected)
    },
  )

  it('keeps invalid INICIO explicit', () => {
    const result = importEComexRow(
      rowInput({
        EMBARQUE: '420001/2026',
        DESCR_DESVIO: 'Descrição técnica',
        INICIO: '2026-02-30',
      }),
    )

    expect(result.normalizedData.start).toEqual({
      kind: 'invalid',
      value: '2026-02-30',
    })
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        kind: 'invalid_value',
        code: 'invalid_date',
        field: 'INICIO',
      }),
    )
  })

  it.each([
    ['valid date', '2026-09-21', { kind: 'date', value: '2026-09-21' }],
    ['empty value', '', { kind: 'absent' }],
  ])(
    'represents FIM as %s without operational interpretation',
    (_, value, expected) => {
      const result = importEComexRow(
        rowInput({
          EMBARQUE: '420001/2026',
          DESCR_DESVIO: 'Descrição técnica',
          FIM: value,
        }),
      )

      expect(result.normalizedData.end).toEqual(expected)
      expect(result.normalizedData).not.toHaveProperty('isOpen')
    },
  )

  it('keeps invalid FIM explicit without classifying the deviation', () => {
    const result = importEComexRow(
      rowInput({
        EMBARQUE: '420001/2026',
        DESCR_DESVIO: 'Descrição técnica',
        FIM: 'data inválida',
      }),
    )

    expect(result.normalizedData.end).toEqual({
      kind: 'invalid',
      value: 'data inválida',
    })
    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: 'FIM', code: 'invalid_date' }),
    )
    expect(result.normalizedData).not.toHaveProperty('isOpen')
  })

  it.each(['AEREO', 'MARITIMO'] as const)(
    'represents the known eComex modal %s without canonical mapping',
    (modal) => {
      const result = importEComexRow(
        rowInput({
          EMBARQUE: '420001/2026',
          DESCR_DESVIO: 'Descrição técnica',
          MODAL: modal,
        }),
      )

      expect(result.normalizedData.transportMode).toEqual({
        kind: 'known',
        value: modal,
      })
      expect(result.issues).toEqual([])
    },
  )

  it('preserves an unknown modal and reports a non-fatal issue', () => {
    const result = importEComexRow(
      rowInput({
        EMBARQUE: '420001/2026',
        DESCR_DESVIO: 'Descrição técnica',
        MODAL: 'RODOVIARIO',
      }),
    )

    expect(result.normalizedData.transportMode).toEqual({
      kind: 'unknown',
      value: 'RODOVIARIO',
    })
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        kind: 'unknown_value',
        severity: 'warning',
        code: 'unknown_transport_mode',
      }),
    )
  })

  it('preserves DESCR_DESVIO without removing its prefix or classifying it', () => {
    const description = 'Desvio: Falta recebimento de documento fictício'
    const result = importEComexRow(
      rowInput({ EMBARQUE: '420001/2026', DESCR_DESVIO: description }),
    )

    expect(result.normalizedData.deviationDescription).toBe(description)
    expect(result.normalizedData).not.toHaveProperty('impact')
    expect(result.normalizedData).not.toHaveProperty('classification')
  })

  it('preserves OBSERVACOES semantically without interpreting content', () => {
    const notes =
      '  ÁÉÍÓÚ, pontuação!?\nSegunda linha  com  espaços. Fatura assinada.  '
    const result = importEComexRow(
      rowInput({
        EMBARQUE: '420001/2026',
        DESCR_DESVIO: 'Descrição técnica',
        OBSERVACOES: notes,
      }),
    )

    expect(result.normalizedData.notes).toBe(notes)
    expect(result.normalizedData).not.toHaveProperty('impact')
  })

  it('preserves JUSTIFICATIVA as uninterpreted source content', () => {
    const justification = '  Texto livre; não implica conclusão.\nLinha 2.  '
    const result = importEComexRow(
      rowInput({
        EMBARQUE: '420001/2026',
        DESCR_DESVIO: 'Descrição técnica',
        JUSTIFICATIVA: justification,
      }),
    )

    expect(result.normalizedData.justification).toBe(justification)
  })

  it('preserves source names without creating identities', () => {
    const result = importEComexRow(
      rowInput({
        EMBARQUE: '420001/2026',
        DESCR_DESVIO: 'Descrição técnica',
        APONTADO_POR: 'PESSOA FICTÍCIA 01',
        CONCLUIDO_POR: 'PESSOA FICTÍCIA 02',
        EXPORT_NOME: 'EMPRESA FICTÍCIA',
      }),
    )

    expect(result.normalizedData.reportedBy).toBe('PESSOA FICTÍCIA 01')
    expect(result.normalizedData.completedBy).toBe('PESSOA FICTÍCIA 02')
    expect(result.normalizedData.exportName).toBe('EMPRESA FICTÍCIA')
  })

  it('preserves additional fields only in raw data', () => {
    const rawData = {
      EMBARQUE: '420001/2026',
      DESCR_DESVIO: 'Descrição técnica',
      CAMPO_ADICIONAL: 'valor preservado',
    }
    const result = importEComexRow(rowInput(rawData))

    expect(result.rawData).toEqual(rawData)
    expect(result.normalizedData).not.toHaveProperty('CAMPO_ADICIONAL')
    expect(result.issues).toEqual([])
  })

  it('returns normalized data and accumulated issues for a partially invalid row', () => {
    const result = importEComexRow(
      rowInput({
        EMBARQUE: '420001/2026',
        DESCR_DESVIO: 'Descrição técnica',
        INICIO: 'não é data',
        CONCLUIDO_POR: { unexpected: true },
        INVOICE: 'INV-001',
      }),
    )

    expect(result.normalizedData.shipmentReference).toBe('420001/2026')
    expect(result.normalizedData.start.kind).toBe('invalid')
    expect(result.normalizedData.completedBy).toBeUndefined()
    expect(result.normalizedData.invoice).toBe('INV-001')
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'INICIO', kind: 'invalid_value' }),
        expect.objectContaining({
          field: 'CONCLUIDO_POR',
          kind: 'invalid_value',
        }),
      ]),
    )
  })

  it('normalizes strings containing only spaces as technical absence', () => {
    const result = importEComexRow(
      rowInput({
        EMBARQUE: '420001/2026',
        DESCR_DESVIO: 'Descrição técnica',
        OBSERVACOES: '   ',
        JUSTIFICATIVA: '\t\n',
        INVOICE: '   ',
      }),
    )

    expect(result.normalizedData.notes).toBeUndefined()
    expect(result.normalizedData.justification).toBeUndefined()
    expect(result.normalizedData.invoice).toBeUndefined()
  })
})
