import { describe, expect, it } from 'vitest'
import {
  classifyDeviationImpact,
  LEGACY_DEVIATION_IMPACT_CATALOG,
  normalizeLegacyDeviationText,
  type DeviationImpact,
  type DeviationImpactFacts,
} from './classify-deviation-impact.js'

const nonBlockingDescriptions = [
  'Problema no Mercante',
  'Falta Packing List',
  'Documentos originais não recebidos do Agente de Carga',
  'Avarias antes do registro da DI',
  'Falta certificado de origem',
  'Fatura com Assinatura com cor diferente de azul (INV)',
] as const

const blockingDescriptions = [
  'Divergência de peso entre fatura e Packing List',
  'Preço divergente',
  'Correção do B/L / AWB',
  'Falta recebimento de fatura com assinatura',
  'Divergência de peso bruto entre HAWB/HBL e Invoice',
  'Divergência entre HAWB/BL e Faturas',
  'Falta lançar linhas no eComex',
  'Divergência na condição de pagamento entre fatura e pedido',
] as const

function facts(
  description: string | undefined,
  observation?: string,
): DeviationImpactFacts {
  return { description, observation }
}

function expectClassifiedImpact(
  description: string,
  expectedImpact: DeviationImpact,
): void {
  const result = classifyDeviationImpact(facts(description))

  expect(result.classificationStatus).toBe('classified')
  expect(result.impact).toBe(expectedImpact)
  expect(result.reasonCode).toBe('IMPACT_FROM_EXPLICIT_CATALOG')
  expect(result.evidence.source).toBe('explicit_catalog')
  expect(result.evidence.matchedCatalogDescription).toBe(description)
  expect(result.issues).toEqual([])
}

describe('deviation impact catalog', () => {
  it('has one unique normalized key for every characterized description', () => {
    const normalizedDescriptions = LEGACY_DEVIATION_IMPACT_CATALOG.map(
      ({ description }) => normalizeLegacyDeviationText(description),
    )

    expect(new Set(normalizedDescriptions).size).toBe(
      normalizedDescriptions.length,
    )
  })

  it.each(nonBlockingDescriptions)(
    'classifies %s as non-blocking',
    (description) => {
      expectClassifiedImpact(description, 'NON_BLOCKING')
    },
  )

  it.each(blockingDescriptions)('classifies %s as blocking', (description) => {
    expectClassifiedImpact(description, 'BLOCKING')
  })

  it('classifies the exact configured INV description as non-blocking', () => {
    const description = 'Fatura com Assinatura com cor diferente de azul (INV)'
    const result = classifyDeviationImpact(facts(description))

    expect(result.classificationStatus).toBe('classified')
    expect(result.impact).toBe('NON_BLOCKING')
    expect(result.reasonCode).toBe('IMPACT_FROM_EXPLICIT_CATALOG')
    expect(result.evidence.matchedCatalogDescription).toBe(description)
  })
})

describe('legacy deviation text normalization', () => {
  it.each([
    'Desvio: Preço divergente',
    'PREÇO DIVERGENTE',
    'Preco divergente',
    'Preço, divergente',
    '  Preço    divergente  ',
    'Preço\u00a0divergente',
  ])('matches a configured description after normalizing %s', (description) => {
    const result = classifyDeviationImpact(facts(description))

    expect(result.classificationStatus).toBe('classified')
    expect(result.impact).toBe('BLOCKING')
    expect(result.reasonCode).toBe('IMPACT_FROM_EXPLICIT_CATALOG')
    expect(result.evidence.normalizedDescription).toBe('preco divergente')
    expect(result.evidence.matchedCatalogDescription).toBe('Preço divergente')
  })

  it('removes the deviation prefix only when it starts the description', () => {
    const result = classifyDeviationImpact(
      facts('Informação Desvio: Preço divergente'),
    )

    expect(result.impact).toBe('BLOCKING')
    expect(result.reasonCode).toBe('UNKNOWN_DESCRIPTION_DEFAULTED_TO_BLOCKING')
    expect(result.evidence.normalizedDescription).toBe(
      'informacao desvio preco divergente',
    )
  })
})

describe('signed invoice contextual impact', () => {
  const description = 'Falta recebimento de fatura com assinatura'

  it.each([
    ['A fatura não veio no pré-alerta.', 'a fatura nao veio no pre alerta'],
    [
      'A fatura não recebida durante o pré-alerta.',
      'a fatura nao recebida durante o pre alerta',
    ],
    [
      'A fatura não enviada junto ao pré-alerta.',
      'a fatura nao enviada junto ao pre alerta',
    ],
  ])(
    'classifies the pre-alert context as blocking: %s',
    (observation, normalizedObservation) => {
      const input = facts(description, observation)
      const result = classifyDeviationImpact(input)

      expect(result).toEqual({
        classificationStatus: 'classified',
        impact: 'BLOCKING',
        reasonCode: 'SIGNED_INVOICE_MISSING_FROM_PRE_ALERT',
        evaluatedFacts: input,
        evidence: {
          source: 'signed_invoice_pre_alert_context',
          normalizedDescription: 'falta recebimento de fatura com assinatura',
          normalizedObservation,
          matchedCatalogDescription: description,
          matchedContext: 'PRE_ALERT_MISSING_SIGNED_INVOICE',
        },
        issues: [],
      })
    },
  )

  it.each([
    'Recebemos a fatura com assinatura.',
    'Recebemos a fatura assinada.',
    'Favor enviar a via correta e assinada.',
  ])(
    'classifies the signed-invoice context as non-blocking: %s',
    (observation) => {
      const result = classifyDeviationImpact(facts(description, observation))

      expect(result.classificationStatus).toBe('classified')
      expect(result.impact).toBe('NON_BLOCKING')
      expect(result.reasonCode).toBe('SIGNED_INVOICE_NON_BLOCKING_CONTEXT')
      expect(result.evidence.source).toBe('signed_invoice_non_blocking_context')
      expect(result.evidence.matchedContext).toBe('SIGNED_INVOICE_AVAILABLE')
    },
  )

  it.each([undefined, '', 'Aguardando retorno do fornecedor.'])(
    'uses the explicit blocking catalog without recognized context: %s',
    (observation) => {
      const result = classifyDeviationImpact(facts(description, observation))

      expect(result.impact).toBe('BLOCKING')
      expect(result.reasonCode).toBe('IMPACT_FROM_EXPLICIT_CATALOG')
      expect(result.evidence.source).toBe('explicit_catalog')
    },
  )

  it('gives the pre-alert context precedence when both context families match', () => {
    const result = classifyDeviationImpact(
      facts(
        description,
        'A fatura não veio no pré-alerta. Favor enviar a fatura assinada.',
      ),
    )

    expect(result.impact).toBe('BLOCKING')
    expect(result.reasonCode).toBe('SIGNED_INVOICE_MISSING_FROM_PRE_ALERT')
    expect(result.evidence.matchedContext).toBe(
      'PRE_ALERT_MISSING_SIGNED_INVOICE',
    )
  })

  it.each([
    'O pré-alerta chegou; a fatura não veio depois.',
    'A fatura foi enviada sem assinatura.',
    'Enviar o documento assinado.',
  ])('does not over-recognize the contextual text %s', (observation) => {
    const result = classifyDeviationImpact(facts(description, observation))

    expect(result.impact).toBe('BLOCKING')
    expect(result.reasonCode).toBe('IMPACT_FROM_EXPLICIT_CATALOG')
    expect(result.evidence.matchedContext).toBeUndefined()
  })

  it('does not apply signed-invoice context to another description', () => {
    const result = classifyDeviationImpact(
      facts('Falta Packing List', 'A fatura não veio no pré-alerta.'),
    )

    expect(result.impact).toBe('NON_BLOCKING')
    expect(result.reasonCode).toBe('IMPACT_FROM_EXPLICIT_CATALOG')
  })
})

describe('deviation impact fallback and absence', () => {
  it('defaults an unknown useful description to blocking', () => {
    const input = facts('Descrição ainda não catalogada', 'Texto preservado.')

    expect(classifyDeviationImpact(input)).toEqual({
      classificationStatus: 'classified',
      impact: 'BLOCKING',
      reasonCode: 'UNKNOWN_DESCRIPTION_DEFAULTED_TO_BLOCKING',
      evaluatedFacts: input,
      evidence: {
        source: 'unknown_description_fallback',
        normalizedDescription: 'descricao ainda nao catalogada',
        normalizedObservation: 'texto preservado',
        matchedCatalogDescription: undefined,
        matchedContext: undefined,
      },
      issues: [],
    })
  })

  it('does not generalize the configured INV description to the unsuffixed variant', () => {
    const result = classifyDeviationImpact(
      facts('Fatura com Assinatura com cor diferente de azul'),
    )

    expect(result.impact).toBe('BLOCKING')
    expect(result.reasonCode).toBe('UNKNOWN_DESCRIPTION_DEFAULTED_TO_BLOCKING')
    expect(result.evidence.matchedCatalogDescription).toBeUndefined()
  })

  it.each([undefined, '', '   ', 'Desvio:', '...'])(
    'leaves an unusable description unclassified: %s',
    (description) => {
      const input = facts(description)

      expect(classifyDeviationImpact(input)).toEqual({
        classificationStatus: 'unclassified',
        impact: undefined,
        reasonCode: 'MISSING_DEVIATION_DESCRIPTION',
        evaluatedFacts: input,
        evidence: {
          source: 'missing_description',
          normalizedDescription: '',
          normalizedObservation: '',
          matchedCatalogDescription: undefined,
          matchedContext: undefined,
        },
        issues: [{ code: 'MISSING_DEVIATION_DESCRIPTION' }],
      })
    },
  )
})
