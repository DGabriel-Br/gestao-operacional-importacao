import {
  classifyDeviationImpact,
  determineDeviationLifecycle,
  type DeviationImpactDecision,
  type DeviationLifecycleDecision,
} from '@gestao-operacional/domain'

type EComexOperationalTechnicalDate =
  | { readonly kind: 'absent' }
  | { readonly kind: 'date'; readonly value: string }
  | { readonly kind: 'date-time'; readonly value: string }
  | { readonly kind: 'invalid'; readonly value: unknown }

interface EComexOperationalTechnicalIssue {
  readonly code: string
  readonly field?: string
  readonly value?: unknown
}

export interface EComexOperationalDeviationProjectionInput {
  readonly trace: EComexOperationalDeviationTrace
  readonly normalizedData: {
    readonly shipmentReference: string | undefined
    readonly deviationDescription: string | undefined
    readonly end: EComexOperationalTechnicalDate
    readonly notes: string | undefined
  }
  readonly issues: readonly EComexOperationalTechnicalIssue[]
}

export interface EComexOperationalDeviationTrace {
  readonly source: 'ecomex'
  readonly sourceVersion: string
  readonly rowNumber: number
}

export interface EComexOperationalDeviation {
  readonly trace: EComexOperationalDeviationTrace
  readonly ecomexShipmentReference: string
  readonly description: string
  readonly observation: string | undefined
  readonly impact: DeviationImpactDecision
  readonly lifecycle: DeviationLifecycleDecision
}

export type EComexOperationalDeviationProjectionIssueCode =
  | 'MISSING_ECOMEX_SHIPMENT_REFERENCE'
  | 'INVALID_ECOMEX_SHIPMENT_REFERENCE'
  | 'MISSING_ECOMEX_DEVIATION_DESCRIPTION'
  | 'INVALID_ECOMEX_DEVIATION_DESCRIPTION'
  | 'INVALID_ECOMEX_OBSERVATION'
  | 'INVALID_END_DATE'
  | 'INVALID_SOURCE_VERSION'
  | 'INVALID_ROW_NUMBER'

export type EComexOperationalDeviationProjectionFact =
  | 'ecomexShipmentReference'
  | 'description'
  | 'observation'
  | 'hasEnd'
  | 'sourceVersion'
  | 'rowNumber'

export interface EComexOperationalDeviationProjectionIssue {
  readonly code: EComexOperationalDeviationProjectionIssueCode
  readonly fact: EComexOperationalDeviationProjectionFact
  readonly value: unknown
}

export type EComexOperationalDeviationProjectionResult =
  | {
      readonly status: 'ready'
      readonly deviation: EComexOperationalDeviation
      readonly issues: readonly []
    }
  | {
      readonly status: 'invalid'
      readonly trace: EComexOperationalDeviationTrace
      readonly issues: readonly EComexOperationalDeviationProjectionIssue[]
    }

export function projectEComexOperationalDeviation(
  importedRow: EComexOperationalDeviationProjectionInput,
): EComexOperationalDeviationProjectionResult {
  const normalized = importedRow.normalizedData
  const shipmentReferenceIssue = projectRequiredTextIssue(
    normalized.shipmentReference,
    'EMBARQUE',
    'MISSING_ECOMEX_SHIPMENT_REFERENCE',
    'INVALID_ECOMEX_SHIPMENT_REFERENCE',
    'ecomexShipmentReference',
    importedRow.issues,
  )
  const descriptionIssue = projectRequiredTextIssue(
    normalized.deviationDescription,
    'DESCR_DESVIO',
    'MISSING_ECOMEX_DEVIATION_DESCRIPTION',
    'INVALID_ECOMEX_DEVIATION_DESCRIPTION',
    'description',
    importedRow.issues,
  )
  const observationIssue = projectOptionalTextIssue(
    'OBSERVACOES',
    'INVALID_ECOMEX_OBSERVATION',
    'observation',
    importedRow.issues,
  )
  const endIssue =
    normalized.end.kind === 'invalid'
      ? issue('INVALID_END_DATE', 'hasEnd', normalized.end.value)
      : undefined

  const issues = [
    ...projectTraceIssues(importedRow.trace),
    shipmentReferenceIssue,
    descriptionIssue,
    observationIssue,
    endIssue,
  ].filter(
    (
      projectionIssue,
    ): projectionIssue is EComexOperationalDeviationProjectionIssue =>
      projectionIssue !== undefined,
  )

  if (
    issues.length > 0 ||
    normalized.shipmentReference === undefined ||
    normalized.deviationDescription === undefined ||
    normalized.end.kind === 'invalid'
  ) {
    return { status: 'invalid', trace: importedRow.trace, issues }
  }

  const impact = classifyDeviationImpact({
    description: normalized.deviationDescription,
    observation: normalized.notes,
  })
  const lifecycle = determineDeviationLifecycle({
    hasEnd: normalized.end.kind !== 'absent',
  })

  return {
    status: 'ready',
    deviation: {
      trace: importedRow.trace,
      ecomexShipmentReference: normalized.shipmentReference,
      description: normalized.deviationDescription,
      observation: normalized.notes,
      impact,
      lifecycle,
    },
    issues: [],
  }
}

function projectRequiredTextIssue(
  value: string | undefined,
  sourceField: 'EMBARQUE' | 'DESCR_DESVIO',
  missingCode: Extract<
    EComexOperationalDeviationProjectionIssueCode,
    'MISSING_ECOMEX_SHIPMENT_REFERENCE' | 'MISSING_ECOMEX_DEVIATION_DESCRIPTION'
  >,
  invalidCode: Extract<
    EComexOperationalDeviationProjectionIssueCode,
    'INVALID_ECOMEX_SHIPMENT_REFERENCE' | 'INVALID_ECOMEX_DEVIATION_DESCRIPTION'
  >,
  fact: Extract<
    EComexOperationalDeviationProjectionFact,
    'ecomexShipmentReference' | 'description'
  >,
  importIssues: readonly EComexOperationalTechnicalIssue[],
): EComexOperationalDeviationProjectionIssue | undefined {
  const invalidSourceIssue = findInvalidTextIssue(sourceField, importIssues)
  if (invalidSourceIssue !== undefined) {
    return issue(invalidCode, fact, invalidSourceIssue.value)
  }

  return value === undefined ? issue(missingCode, fact, value) : undefined
}

function projectOptionalTextIssue(
  sourceField: 'OBSERVACOES',
  code: 'INVALID_ECOMEX_OBSERVATION',
  fact: 'observation',
  importIssues: readonly EComexOperationalTechnicalIssue[],
): EComexOperationalDeviationProjectionIssue | undefined {
  const invalidSourceIssue = findInvalidTextIssue(sourceField, importIssues)
  return invalidSourceIssue === undefined
    ? undefined
    : issue(code, fact, invalidSourceIssue.value)
}

function findInvalidTextIssue(
  sourceField: string,
  importIssues: readonly EComexOperationalTechnicalIssue[],
): EComexOperationalTechnicalIssue | undefined {
  return importIssues.find(
    (importIssue) =>
      importIssue.code === 'invalid_text_value' &&
      importIssue.field === sourceField,
  )
}

function projectTraceIssues(
  trace: EComexOperationalDeviationTrace,
): readonly EComexOperationalDeviationProjectionIssue[] {
  const sourceVersionIssues: readonly EComexOperationalDeviationProjectionIssue[] =
    trace.sourceVersion.trim().length === 0
      ? [issue('INVALID_SOURCE_VERSION', 'sourceVersion', trace.sourceVersion)]
      : []
  const rowNumberIssues: readonly EComexOperationalDeviationProjectionIssue[] =
    Number.isInteger(trace.rowNumber) && trace.rowNumber > 0
      ? []
      : [issue('INVALID_ROW_NUMBER', 'rowNumber', trace.rowNumber)]

  return [...sourceVersionIssues, ...rowNumberIssues]
}

function issue(
  code: EComexOperationalDeviationProjectionIssueCode,
  fact: EComexOperationalDeviationProjectionFact,
  value: unknown,
): EComexOperationalDeviationProjectionIssue {
  return { code, fact, value }
}
