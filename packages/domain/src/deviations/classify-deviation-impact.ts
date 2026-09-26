export type DeviationImpact = 'BLOCKING' | 'NON_BLOCKING'

export interface DeviationImpactFacts {
  readonly description: string | undefined
  readonly observation: string | undefined
}

export type DeviationImpactReasonCode =
  | 'IMPACT_FROM_EXPLICIT_CATALOG'
  | 'SIGNED_INVOICE_MISSING_FROM_PRE_ALERT'
  | 'SIGNED_INVOICE_NON_BLOCKING_CONTEXT'
  | 'UNKNOWN_DESCRIPTION_DEFAULTED_TO_BLOCKING'
  | 'MISSING_DEVIATION_DESCRIPTION'

export type DeviationImpactEvidenceSource =
  | 'explicit_catalog'
  | 'signed_invoice_pre_alert_context'
  | 'signed_invoice_non_blocking_context'
  | 'unknown_description_fallback'
  | 'missing_description'

export type DeviationImpactContext =
  'PRE_ALERT_MISSING_SIGNED_INVOICE' | 'SIGNED_INVOICE_AVAILABLE'

export type DeviationImpactIssue = Readonly<{
  code: 'MISSING_DEVIATION_DESCRIPTION'
}>

interface LegacyDeviationImpactCatalogEntry {
  readonly description: string
  readonly impact: DeviationImpact
}

export const LEGACY_DEVIATION_IMPACT_CATALOG = [
  { description: 'Problema no Mercante', impact: 'NON_BLOCKING' },
  { description: 'Falta Packing List', impact: 'NON_BLOCKING' },
  {
    description: 'Documentos originais não recebidos do Agente de Carga',
    impact: 'NON_BLOCKING',
  },
  {
    description: 'Avarias antes do registro da DI',
    impact: 'NON_BLOCKING',
  },
  { description: 'Falta certificado de origem', impact: 'NON_BLOCKING' },
  {
    description: 'Fatura com Assinatura com cor diferente de azul (INV)',
    impact: 'NON_BLOCKING',
  },
  {
    description: 'Divergência de peso entre fatura e Packing List',
    impact: 'BLOCKING',
  },
  { description: 'Preço divergente', impact: 'BLOCKING' },
  { description: 'Correção do B/L / AWB', impact: 'BLOCKING' },
  {
    description: 'Falta recebimento de fatura com assinatura',
    impact: 'BLOCKING',
  },
  {
    description: 'Divergência de peso bruto entre HAWB/HBL e Invoice',
    impact: 'BLOCKING',
  },
  {
    description: 'Divergência entre HAWB/BL e Faturas',
    impact: 'BLOCKING',
  },
  { description: 'Falta lançar linhas no eComex', impact: 'BLOCKING' },
  {
    description: 'Divergência na condição de pagamento entre fatura e pedido',
    impact: 'BLOCKING',
  },
] as const satisfies readonly LegacyDeviationImpactCatalogEntry[]

type CatalogDescription =
  (typeof LEGACY_DEVIATION_IMPACT_CATALOG)[number]['description']

export interface DeviationImpactEvidence {
  readonly source: DeviationImpactEvidenceSource
  readonly normalizedDescription: string
  readonly normalizedObservation: string
  readonly matchedCatalogDescription: CatalogDescription | undefined
  readonly matchedContext: DeviationImpactContext | undefined
}

export interface ClassifiedDeviationImpactDecision {
  readonly classificationStatus: 'classified'
  readonly impact: DeviationImpact
  readonly reasonCode: Exclude<
    DeviationImpactReasonCode,
    'MISSING_DEVIATION_DESCRIPTION'
  >
  readonly evaluatedFacts: DeviationImpactFacts
  readonly evidence: DeviationImpactEvidence
  readonly issues: readonly []
}

export interface UnclassifiedDeviationImpactDecision {
  readonly classificationStatus: 'unclassified'
  readonly impact: undefined
  readonly reasonCode: 'MISSING_DEVIATION_DESCRIPTION'
  readonly evaluatedFacts: DeviationImpactFacts
  readonly evidence: DeviationImpactEvidence
  readonly issues: readonly [DeviationImpactIssue]
}

export type DeviationImpactDecision =
  ClassifiedDeviationImpactDecision | UnclassifiedDeviationImpactDecision

interface NormalizedCatalogEntry {
  readonly description: CatalogDescription
  readonly normalizedDescription: string
  readonly impact: DeviationImpact
}

const SIGNED_INVOICE_DESCRIPTION =
  'Falta recebimento de fatura com assinatura' as const

const NORMALIZED_SIGNED_INVOICE_DESCRIPTION = normalizeLegacyDeviationText(
  SIGNED_INVOICE_DESCRIPTION,
)

const NORMALIZED_DEVIATION_IMPACT_CATALOG: readonly NormalizedCatalogEntry[] =
  LEGACY_DEVIATION_IMPACT_CATALOG.map((entry) => ({
    ...entry,
    normalizedDescription: normalizeLegacyDeviationText(entry.description),
  }))

const SIGNED_INVOICE_PRE_ALERT_PATTERNS = [
  /\bnao veio\b.*\bpre alerta\b/,
  /\bnao recebida\b.*\bpre alerta\b/,
  /\bnao enviada\b.*\bpre alerta\b/,
] as const

const SIGNED_INVOICE_NON_BLOCKING_PATTERNS = [
  /\bfatura com assinatura\b/,
  /\bfatura assinada\b/,
  /\benviar\b.*\bassinada\b/,
] as const

export function classifyDeviationImpact(
  facts: DeviationImpactFacts,
): DeviationImpactDecision {
  const normalizedDescription = normalizeLegacyDeviationText(facts.description)
  const normalizedObservation = normalizeLegacyDeviationText(facts.observation)

  if (normalizedDescription.length === 0) {
    return unclassified(facts, normalizedObservation)
  }

  if (normalizedDescription === NORMALIZED_SIGNED_INVOICE_DESCRIPTION) {
    if (matchesAny(normalizedObservation, SIGNED_INVOICE_PRE_ALERT_PATTERNS)) {
      return classified(
        'BLOCKING',
        'SIGNED_INVOICE_MISSING_FROM_PRE_ALERT',
        facts,
        evidence(
          'signed_invoice_pre_alert_context',
          normalizedDescription,
          normalizedObservation,
          SIGNED_INVOICE_DESCRIPTION,
          'PRE_ALERT_MISSING_SIGNED_INVOICE',
        ),
      )
    }

    if (
      matchesAny(normalizedObservation, SIGNED_INVOICE_NON_BLOCKING_PATTERNS)
    ) {
      return classified(
        'NON_BLOCKING',
        'SIGNED_INVOICE_NON_BLOCKING_CONTEXT',
        facts,
        evidence(
          'signed_invoice_non_blocking_context',
          normalizedDescription,
          normalizedObservation,
          SIGNED_INVOICE_DESCRIPTION,
          'SIGNED_INVOICE_AVAILABLE',
        ),
      )
    }
  }

  const catalogMatch = NORMALIZED_DEVIATION_IMPACT_CATALOG.find(
    (entry) => entry.normalizedDescription === normalizedDescription,
  )

  if (catalogMatch !== undefined) {
    return classified(
      catalogMatch.impact,
      'IMPACT_FROM_EXPLICIT_CATALOG',
      facts,
      evidence(
        'explicit_catalog',
        normalizedDescription,
        normalizedObservation,
        catalogMatch.description,
      ),
    )
  }

  return classified(
    'BLOCKING',
    'UNKNOWN_DESCRIPTION_DEFAULTED_TO_BLOCKING',
    facts,
    evidence(
      'unknown_description_fallback',
      normalizedDescription,
      normalizedObservation,
    ),
  )
}

export function normalizeLegacyDeviationText(text: string | undefined): string {
  if (text === undefined) {
    return ''
  }

  return text
    .toLowerCase()
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/^\s*desvio:\s*/, '')
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/ +/g, ' ')
    .trim()
}

function matchesAny(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

function evidence(
  source: DeviationImpactEvidenceSource,
  normalizedDescription: string,
  normalizedObservation: string,
  matchedCatalogDescription?: CatalogDescription,
  matchedContext?: DeviationImpactContext,
): DeviationImpactEvidence {
  return {
    source,
    normalizedDescription,
    normalizedObservation,
    matchedCatalogDescription,
    matchedContext,
  }
}

function classified(
  impact: DeviationImpact,
  reasonCode: ClassifiedDeviationImpactDecision['reasonCode'],
  evaluatedFacts: DeviationImpactFacts,
  impactEvidence: DeviationImpactEvidence,
): ClassifiedDeviationImpactDecision {
  return {
    classificationStatus: 'classified',
    impact,
    reasonCode,
    evaluatedFacts,
    evidence: impactEvidence,
    issues: [],
  }
}

function unclassified(
  evaluatedFacts: DeviationImpactFacts,
  normalizedObservation: string,
): UnclassifiedDeviationImpactDecision {
  return {
    classificationStatus: 'unclassified',
    impact: undefined,
    reasonCode: 'MISSING_DEVIATION_DESCRIPTION',
    evaluatedFacts,
    evidence: evidence('missing_description', '', normalizedObservation),
    issues: [{ code: 'MISSING_DEVIATION_DESCRIPTION' }],
  }
}
