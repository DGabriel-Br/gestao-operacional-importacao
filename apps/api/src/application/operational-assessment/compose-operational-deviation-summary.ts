import type { OperationalDeviationSummary } from '@gestao-operacional/domain'
import type {
  CorrelatedOperationalDeviations,
  OperationalDeviationCorrelationResult,
  UncorrelatableOperationalDeviations,
} from './correlate-operational-deviations'
import type { EComexOperationalDeviation } from './project-ecomex-operational-deviation'

const DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION =
  /documentos originais n[aã]o recebidos do agente de carga/i
const DIGITAL_ORIGINAL_OBSERVATION =
  /(original|orignal|originais|bl|conhecimento).*(digitaliz)|digitaliz.*(original|orignal|originais|bl|conhecimento)/
const PHYSICAL_ORIGINAL_OBSERVATION =
  /(conhecimento|bl|awb|hawb).*(original|orignal).*f[ií]sico/

export interface ReadyOperationalDeviationSummaryProjection {
  readonly status: 'ready'
  readonly correlation: CorrelatedOperationalDeviations
  readonly summary: OperationalDeviationSummary
  readonly issues: readonly []
}

export interface UncorrelatableOperationalDeviationSummaryProjection {
  readonly status: 'uncorrelatable'
  readonly correlation: UncorrelatableOperationalDeviations
}

export type OperationalDeviationSummaryProjectionResult =
  | ReadyOperationalDeviationSummaryProjection
  | UncorrelatableOperationalDeviationSummaryProjection

export function createDocumentLegacyCorrelationKey(reference: string): string {
  return reference.replace(/[^0-9/]/g, '')
}

export function composeOperationalDeviationSummary(
  correlation: OperationalDeviationCorrelationResult,
): OperationalDeviationSummaryProjectionResult {
  if (correlation.status === 'uncorrelatable') {
    return { status: 'uncorrelatable', correlation }
  }

  const documentCorrelationKey = createDocumentLegacyCorrelationKey(
    correlation.rawCustomerReference,
  )
  const documentaryDeviations = correlation.matchedDeviations.filter(
    (deviation) =>
      createDocumentLegacyCorrelationKey(deviation.ecomexShipmentReference) ===
      documentCorrelationKey,
  )

  return {
    status: 'ready',
    correlation,
    summary: {
      openBlockingDeviationCount:
        correlation.aggregation.openBlockingDeviationCount,
      openNonBlockingDeviationCount:
        correlation.aggregation.openNonBlockingDeviationCount,
      openUnclassifiedDeviationCount:
        correlation.aggregation.openUnclassifiedDeviationCount,
      hasOpenDigitalOriginalDeviation: documentaryDeviations.some(
        isOpenDigitalOriginalDeviation,
      ),
      hasOpenPhysicalOriginalDeviation: documentaryDeviations.some(
        isOpenPhysicalOriginalDeviation,
      ),
    },
    issues: [],
  }
}

function isOpenDigitalOriginalDeviation(
  deviation: EComexOperationalDeviation,
): boolean {
  return (
    isOpenDocumentaryDeviation(deviation) &&
    deviation.observation !== undefined &&
    DIGITAL_ORIGINAL_OBSERVATION.test(deviation.observation.toLowerCase())
  )
}

function isOpenPhysicalOriginalDeviation(
  deviation: EComexOperationalDeviation,
): boolean {
  return (
    isOpenDocumentaryDeviation(deviation) &&
    deviation.observation !== undefined &&
    PHYSICAL_ORIGINAL_OBSERVATION.test(deviation.observation.toLowerCase())
  )
}

function isOpenDocumentaryDeviation(
  deviation: EComexOperationalDeviation,
): boolean {
  return (
    deviation.lifecycle.lifecycle === 'OPEN' &&
    DOCUMENT_ORIGINAL_DEVIATION_DESCRIPTION.test(deviation.description)
  )
}
