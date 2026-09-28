import { describe, expect, it } from 'vitest'
import { importETrackRow } from '../../imports/etrack/etrack-importer'
import { projectETrackOperationalFacts } from './project-etrack-operational-facts'

const completeRow: Readonly<Record<string, unknown>> = {
  'Numero do Processo': '0401IG-0001-26',
  'Referencia Cliente': '420001/2026',
  'Data da Previsão de Chegada': '2026-09-28',
  'Data Chegada': '2026-09-29T10:30:00-03:00',
  'Via Transporte': 'Marítima',
  'Data Registro': '2026-09-30',
  'Nº CE MERCANTE': '000123456789',
  'Datas Originais': '2026-10-01',
  Observações: '  MERCANTE ABERTO // Originais OK.  ',
  House: '001234567890',
  Master: '009876543210',
  Agente: 'AGENTE FICTÍCIO',
  'Data do Faturamento': '2026-10-02',
}

function project(rawData: Readonly<Record<string, unknown>>) {
  return projectETrackOperationalFacts(
    importETrackRow({
      sourceVersion: 'export-2026-09-28',
      rowNumber: 2,
      rawData,
    }),
  )
}

function projectWithTrace(
  sourceVersion: string,
  rowNumber: number,
  rawData: Readonly<Record<string, unknown>> = completeRow,
) {
  const importedRow = importETrackRow({
    sourceVersion: 'valid-source-version',
    rowNumber: 2,
    rawData,
  })

  return projectETrackOperationalFacts({
    ...importedRow,
    trace: { source: 'etrack', sourceVersion, rowNumber },
    issues: [],
  })
}

function rowWith(
  overrides: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return { ...completeRow, ...overrides }
}

describe('projectETrackOperationalFacts', () => {
  it('projects a complete valid row into operational source facts', () => {
    const result = project(completeRow)

    expect(result).toEqual({
      status: 'ready',
      trace: {
        source: 'etrack',
        sourceVersion: 'export-2026-09-28',
        rowNumber: 2,
      },
      facts: {
        processNumber: '0401IG-0001-26',
        customerReference: '420001/2026',
        transportMode: 'maritime',
        observation: '  MERCANTE ABERTO // Originais OK.  ',
        hasProcessId: true,
        hasRegistration: true,
        estimatedArrivalDate: { year: 2026, month: 9, day: 28 },
        hasArrival: true,
        hasMercanteReference: true,
        hasHouseReference: true,
        hasCargoAgent: true,
        hasOriginalReceiptDate: true,
      },
      issues: [],
    })
  })

  it('preserves process number and customer reference without changing their identifiers', () => {
    const result = project(
      rowWith({
        'Numero do Processo': '0007-IG/ABC-26',
        'Referencia Cliente': '000420/2026-A',
      }),
    )

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.facts.processNumber).toBe('0007-IG/ABC-26')
      expect(result.facts.customerReference).toBe('000420/2026-A')
    }
  })

  it('preserves safely converted numeric identifiers as text', () => {
    const result = project(
      rowWith({
        'Numero do Processo': 401000126,
        'Referencia Cliente': 4200012026,
      }),
    )

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.facts.processNumber).toBe('401000126')
      expect(result.facts.customerReference).toBe('4200012026')
    }
  })

  it('keeps a missing process identifier explicit without inventing a value', () => {
    const result = project(rowWith({ 'Numero do Processo': '   ' }))

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.facts.processNumber).toBeUndefined()
      expect(result.facts.hasProcessId).toBe(false)
    }
  })

  it.each([
    ['Aérea', 'air'],
    ['Marítima', 'maritime'],
    ['Ferroviária', 'unknown'],
    [undefined, 'unknown'],
  ] as const)('maps transport mode %s to %s', (sourceMode, expectedMode) => {
    const result = project(rowWith({ 'Via Transporte': sourceMode }))

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.facts.transportMode).toBe(expectedMode)
    }
  })

  it('preserves the observation exactly without interpreting its content', () => {
    const observation =
      '  Digitação OK // PENDÊNCIA NO MERCANTE\nOriginais OK.  '
    const result = project(rowWith({ Observações: observation }))

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.facts.observation).toBe(observation)
      expect(Object.keys(result.facts)).not.toContain('operationalEvent')
      expect(Object.keys(result.facts)).not.toContain('mercanteStatus')
    }
  })

  it('allows an absent observation without inventing content', () => {
    const result = project(rowWith({ Observações: '   ' }))

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.facts.observation).toBeUndefined()
    }
  })

  it('projects an absent ETA as absence', () => {
    const result = project(
      rowWith({ 'Data da Previsão de Chegada': undefined }),
    )

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.facts.estimatedArrivalDate).toBeUndefined()
    }
  })

  it.each([
    ['2026-09-28', { year: 2026, month: 9, day: 28 }],
    ['2026-09-28T08:15:00', { year: 2026, month: 9, day: 28 }],
  ] as const)(
    'projects ETA %s to its written civil date',
    (value, expected) => {
      const result = project(rowWith({ 'Data da Previsão de Chegada': value }))

      expect(result.status).toBe('ready')
      if (result.status === 'ready') {
        expect(result.facts.estimatedArrivalDate).toEqual(expected)
      }
    },
  )

  it('does not shift the written civil date when a date-time offset crosses UTC day', () => {
    const result = project(
      rowWith({
        'Data da Previsão de Chegada': '2026-09-28T23:30:00-03:00',
      }),
    )

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.facts.estimatedArrivalDate).toEqual({
        year: 2026,
        month: 9,
        day: 28,
      })
    }
  })

  it.each([
    [
      'Data da Previsão de Chegada',
      'INVALID_ESTIMATED_ARRIVAL_DATE',
      'estimatedArrivalDate',
    ],
    ['Data Chegada', 'INVALID_ARRIVAL_DATE', 'hasArrival'],
    ['Data Registro', 'INVALID_REGISTRATION_DATE', 'hasRegistration'],
    [
      'Datas Originais',
      'INVALID_ORIGINAL_RECEIPT_DATE',
      'hasOriginalReceiptDate',
    ],
  ] as const)(
    'rejects invalid temporal field %s instead of treating it as absent',
    (field, code, fact) => {
      const result = project(rowWith({ [field]: '28/09/2026' }))

      expect(result).toEqual({
        status: 'invalid',
        trace: {
          source: 'etrack',
          sourceVersion: 'export-2026-09-28',
          rowNumber: 2,
        },
        issues: [
          {
            code,
            fact,
            value: '28/09/2026',
          },
        ],
      })
    },
  )

  it.each([
    ['Data Chegada', 'hasArrival'],
    ['Data Registro', 'hasRegistration'],
    ['Datas Originais', 'hasOriginalReceiptDate'],
  ] as const)(
    'maps absence and presence of %s to %s without retaining the date',
    (field, fact) => {
      const absentResult = project(rowWith({ [field]: undefined }))
      const presentResult = project(
        rowWith({ [field]: '2026-09-28T23:30:00+14:00' }),
      )

      expect(absentResult.status).toBe('ready')
      expect(presentResult.status).toBe('ready')
      if (absentResult.status === 'ready' && presentResult.status === 'ready') {
        expect(absentResult.facts[fact]).toBe(false)
        expect(presentResult.facts[fact]).toBe(true)
      }
    },
  )

  it.each([
    ['Nº CE MERCANTE', 'hasMercanteReference'],
    ['House', 'hasHouseReference'],
    ['Agente', 'hasCargoAgent'],
  ] as const)('maps technical text presence of %s to %s', (field, fact) => {
    const absentResult = project(rowWith({ [field]: '   ' }))
    const presentResult = project(rowWith({ [field]: '  0001/A  ' }))

    expect(absentResult.status).toBe('ready')
    expect(presentResult.status).toBe('ready')
    if (absentResult.status === 'ready' && presentResult.status === 'ready') {
      expect(absentResult.facts[fact]).toBe(false)
      expect(presentResult.facts[fact]).toBe(true)
    }
  })

  it('accumulates every invalid operational date', () => {
    const result = project(
      rowWith({
        'Data da Previsão de Chegada': 'invalid-eta',
        'Data Chegada': 'invalid-arrival',
        'Data Registro': 'invalid-registration',
        'Datas Originais': 'invalid-original',
      }),
    )

    expect(result.status).toBe('invalid')
    if (result.status === 'invalid') {
      expect(result.issues.map((issue) => issue.code)).toEqual([
        'INVALID_ESTIMATED_ARRIVAL_DATE',
        'INVALID_ARRIVAL_DATE',
        'INVALID_REGISTRATION_DATE',
        'INVALID_ORIGINAL_RECEIPT_DATE',
      ])
    }
  })

  it('ignores raw additional fields and source fields outside this projection', () => {
    const result = project(
      rowWith({
        Master: 'MASTER-IGNORED',
        'Data do Faturamento': 'invalid-but-out-of-scope',
        'Campo adicional': 'preserved only by the importer',
      }),
    )

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(Object.keys(result.facts)).not.toContain('master')
      expect(Object.keys(result.facts)).not.toContain('billingDate')
      expect(Object.keys(result.facts)).not.toContain('rawData')
      expect(Object.keys(result.facts)).not.toContain('Campo adicional')
    }
  })

  it('rejects a technically invalid relevant text instead of turning it into absence', () => {
    const invalidText = { unsafe: true }
    const result = project(rowWith({ 'Nº CE MERCANTE': invalidText }))

    expect(result).toEqual({
      status: 'invalid',
      trace: {
        source: 'etrack',
        sourceVersion: 'export-2026-09-28',
        rowNumber: 2,
      },
      issues: [
        {
          code: 'INVALID_OPERATIONAL_TEXT_VALUE',
          fact: 'hasMercanteReference',
          value: invalidText,
        },
      ],
    })
  })

  it.each([
    ['', 2, 'INVALID_SOURCE_VERSION', 'sourceVersion', ''],
    ['export-2026-09-28', 0, 'INVALID_ROW_NUMBER', 'rowNumber', 0],
  ] as const)(
    'rejects an invalid trace with %s and row %s even without importer issues',
    (sourceVersion, rowNumber, code, fact, value) => {
      const result = projectWithTrace(sourceVersion, rowNumber)

      expect(result).toEqual({
        status: 'invalid',
        trace: {
          source: 'etrack',
          sourceVersion,
          rowNumber,
        },
        issues: [{ code, fact, value }],
      })
    },
  )
})
