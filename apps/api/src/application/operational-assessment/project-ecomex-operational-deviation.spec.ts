import { describe, expect, it } from 'vitest'
import { importEComexRow } from '../../imports/ecomex/ecomex-importer'
import { projectEComexOperationalDeviation } from './project-ecomex-operational-deviation'

const completeRow: Readonly<Record<string, unknown>> = {
  EMBARQUE: '00420001/2026-A',
  MODAL: 'MARITIMO',
  DESCR_DESVIO: 'Divergência de peso entre fatura e Packing List',
  INICIO: '2026-09-20',
  FIM: '2026-09-21T10:30:00-03:00',
  OBSERVACOES: '  Evidência preservada, com acentuação!\nLinha 2.  ',
  JUSTIFICATIVA: 'Justificativa sem efeito operacional',
  APONTADO_POR: 'PESSOA FICTÍCIA 01',
  CONCLUIDO_POR: 'PESSOA FICTÍCIA 02',
  EXPORT_NOME: 'EMPRESA FICTÍCIA',
  INVOICE: 'INV-001/2026',
}

function project(rawData: Readonly<Record<string, unknown>>) {
  return projectEComexOperationalDeviation(
    importEComexRow({
      sourceVersion: 'export-2026-09-28',
      rowNumber: 2,
      rawData,
    }),
  )
}

function rowWith(
  overrides: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return { ...completeRow, ...overrides }
}

describe('projectEComexOperationalDeviation', () => {
  it('projects a complete valid row and preserves its trace and domain decisions', () => {
    const result = project(completeRow)

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.deviation.trace).toEqual({
        source: 'ecomex',
        sourceVersion: 'export-2026-09-28',
        rowNumber: 2,
      })
      expect(result.deviation.ecomexShipmentReference).toBe('00420001/2026-A')
      expect(result.deviation.description).toBe(
        'Divergência de peso entre fatura e Packing List',
      )
      expect(result.deviation.observation).toBe(
        '  Evidência preservada, com acentuação!\nLinha 2.  ',
      )
      expect(result.deviation.impact).toEqual(
        expect.objectContaining({
          classificationStatus: 'classified',
          impact: 'BLOCKING',
          reasonCode: 'IMPACT_FROM_EXPLICIT_CATALOG',
        }),
      )
      expect(result.deviation.lifecycle).toEqual({
        lifecycle: 'CLOSED',
        reasonCode: 'END_PRESENT_MEANS_CLOSED',
        evaluatedFacts: { hasEnd: true },
        issues: [],
      })
      expect(result.issues).toEqual([])
    }
  })

  it('preserves EMBARQUE as source text without correlation normalization', () => {
    const result = project(rowWith({ EMBARQUE: '00042/AB-2026 X' }))

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.deviation.ecomexShipmentReference).toBe('00042/AB-2026 X')
      expect(Object.keys(result.deviation)).not.toContain('processId')
      expect(Object.keys(result.deviation)).not.toContain('correlationId')
    }
  })

  it('preserves description and observation as supplied by the technical boundary', () => {
    const description =
      'Desvio: Fatura com Assinatura com cor diferente de azul (INV)'
    const observation = '  Texto Interno, ÁÉÍÓÚ!\nSegunda  linha.  '
    const result = project(
      rowWith({ DESCR_DESVIO: description, OBSERVACOES: observation }),
    )

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.deviation.description).toBe(description)
      expect(result.deviation.observation).toBe(observation)
      expect(result.deviation.impact.evaluatedFacts).toEqual({
        description,
        observation,
      })
    }
  })

  it.each([
    [undefined, 'OPEN', 'MISSING_END_MEANS_OPEN'],
    ['2026-09-21', 'CLOSED', 'END_PRESENT_MEANS_CLOSED'],
    ['2026-09-21T23:30:00-03:00', 'CLOSED', 'END_PRESENT_MEANS_CLOSED'],
  ] as const)(
    'maps FIM %s through the domain lifecycle policy as %s',
    (end, lifecycle, reasonCode) => {
      const result = project(rowWith({ FIM: end }))

      expect(result.status).toBe('ready')
      if (result.status === 'ready') {
        expect(result.deviation.lifecycle).toEqual({
          lifecycle,
          reasonCode,
          evaluatedFacts: { hasEnd: end !== undefined },
          issues: [],
        })
      }
    },
  )

  it('rejects invalid FIM instead of treating it as OPEN or CLOSED', () => {
    const result = project(rowWith({ FIM: '21/09/2026' }))

    expect(result).toEqual({
      status: 'invalid',
      trace: {
        source: 'ecomex',
        sourceVersion: 'export-2026-09-28',
        rowNumber: 2,
      },
      issues: [
        {
          code: 'INVALID_END_DATE',
          fact: 'hasEnd',
          value: '21/09/2026',
        },
      ],
    })
  })

  it.each([
    ['Preço divergente', 'BLOCKING'],
    ['Falta Packing List', 'NON_BLOCKING'],
  ] as const)(
    'uses the domain catalog for %s as %s',
    (description, expectedImpact) => {
      const result = project(rowWith({ DESCR_DESVIO: description }))

      expect(result.status).toBe('ready')
      if (result.status === 'ready') {
        expect(result.deviation.impact).toEqual(
          expect.objectContaining({
            impact: expectedImpact,
            reasonCode: 'IMPACT_FROM_EXPLICIT_CATALOG',
          }),
        )
      }
    },
  )

  it('keeps an unknown valid description ready with the domain blocking fallback', () => {
    const result = project(
      rowWith({ DESCR_DESVIO: 'Descrição operacional ainda não catalogada' }),
    )

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.deviation.impact).toEqual(
        expect.objectContaining({
          classificationStatus: 'classified',
          impact: 'BLOCKING',
          reasonCode: 'UNKNOWN_DESCRIPTION_DEFAULTED_TO_BLOCKING',
        }),
      )
    }
  })

  it.each([
    [
      'Fatura com Assinatura com cor diferente de azul (INV)',
      'NON_BLOCKING',
      'IMPACT_FROM_EXPLICIT_CATALOG',
    ],
    [
      'Fatura com Assinatura com cor diferente de azul',
      'BLOCKING',
      'UNKNOWN_DESCRIPTION_DEFAULTED_TO_BLOCKING',
    ],
  ] as const)(
    'preserves the exact catalog distinction for %s',
    (description, impact, reasonCode) => {
      const result = project(rowWith({ DESCR_DESVIO: description }))

      expect(result.status).toBe('ready')
      if (result.status === 'ready') {
        expect(result.deviation.description).toBe(description)
        expect(result.deviation.impact).toEqual(
          expect.objectContaining({ impact, reasonCode }),
        )
      }
    },
  )

  it.each([
    [
      'A fatura não veio no pré-alerta.',
      'BLOCKING',
      'SIGNED_INVOICE_MISSING_FROM_PRE_ALERT',
    ],
    [
      'A fatura assinada já está disponível.',
      'NON_BLOCKING',
      'SIGNED_INVOICE_NON_BLOCKING_CONTEXT',
    ],
    [
      'A fatura não veio no pré-alerta; depois recebemos a fatura assinada.',
      'BLOCKING',
      'SIGNED_INVOICE_MISSING_FROM_PRE_ALERT',
    ],
  ] as const)(
    'passes signed invoice context intact for %s',
    (observation, impact, reasonCode) => {
      const result = project(
        rowWith({
          DESCR_DESVIO: 'Falta recebimento de fatura com assinatura',
          OBSERVACOES: observation,
        }),
      )

      expect(result.status).toBe('ready')
      if (result.status === 'ready') {
        expect(result.deviation.observation).toBe(observation)
        expect(result.deviation.impact).toEqual(
          expect.objectContaining({ impact, reasonCode }),
        )
      }
    },
  )

  it.each([
    ['EMBARQUE', undefined, 'MISSING_ECOMEX_SHIPMENT_REFERENCE'],
    ['EMBARQUE', { unsafe: true }, 'INVALID_ECOMEX_SHIPMENT_REFERENCE'],
    ['DESCR_DESVIO', undefined, 'MISSING_ECOMEX_DEVIATION_DESCRIPTION'],
    ['DESCR_DESVIO', { unsafe: true }, 'INVALID_ECOMEX_DEVIATION_DESCRIPTION'],
  ] as const)(
    'rejects unusable required source value %s',
    (field, value, code) => {
      const result = project(rowWith({ [field]: value }))

      expect(result.status).toBe('invalid')
      if (result.status === 'invalid') {
        expect(result.issues).toContainEqual(
          expect.objectContaining({ code, value }),
        )
      }
    },
  )

  it('rejects an invalid operational observation instead of treating it as absent', () => {
    const invalidObservation = { unsafe: true }
    const result = project(rowWith({ OBSERVACOES: invalidObservation }))

    expect(result.status).toBe('invalid')
    if (result.status === 'invalid') {
      expect(result.issues).toContainEqual({
        code: 'INVALID_ECOMEX_OBSERVATION',
        fact: 'observation',
        value: invalidObservation,
      })
    }
  })

  it.each([
    ['', 2, 'INVALID_SOURCE_VERSION', 'sourceVersion', ''],
    ['export-2026-09-28', 0, 'INVALID_ROW_NUMBER', 'rowNumber', 0],
  ] as const)(
    'rejects invalid trace values without relying on importer issues',
    (sourceVersion, rowNumber, code, fact, value) => {
      const imported = importEComexRow({
        sourceVersion: 'valid-source-version',
        rowNumber: 2,
        rawData: completeRow,
      })
      const result = projectEComexOperationalDeviation({
        ...imported,
        trace: { source: 'ecomex', sourceVersion, rowNumber },
        issues: [],
      })

      expect(result).toEqual({
        status: 'invalid',
        trace: { source: 'ecomex', sourceVersion, rowNumber },
        issues: [{ code, fact, value }],
      })
    },
  )

  it('ignores unrelated source issues and fields without changing impact or lifecycle', () => {
    const baseline = project(
      rowWith({
        FIM: undefined,
        DESCR_DESVIO: 'Preço divergente',
        OBSERVACOES: 'Evidência de classificação',
      }),
    )
    const result = project(
      rowWith({
        FIM: undefined,
        DESCR_DESVIO: 'Preço divergente',
        OBSERVACOES: 'Evidência de classificação',
        INICIO: 'data inválida e ignorada',
        CONCLUIDO_POR: 'PESSOA FICTÍCIA 02',
        JUSTIFICATIVA: 'Não muda o impacto',
        INVOICE: 'INV-IGNORADA',
        MODAL: 'MODAL DESCONHECIDO',
        CAMPO_ADICIONAL: 'fora da projeção',
      }),
    )

    expect(result).toEqual(baseline)
    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(Object.keys(result.deviation)).toEqual([
        'trace',
        'ecomexShipmentReference',
        'description',
        'observation',
        'impact',
        'lifecycle',
      ])
      expect(result.deviation.lifecycle.lifecycle).toBe('OPEN')
    }
  })
})
