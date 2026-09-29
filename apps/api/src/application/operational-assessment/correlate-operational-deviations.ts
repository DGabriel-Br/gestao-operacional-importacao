import type { EComexOperationalDeviation } from './project-ecomex-operational-deviation'
import type { ETrackOperationalFacts } from './project-etrack-operational-facts'

export type OperationalDeviationCorrelationReasonCode =
  | 'CUSTOMER_REFERENCE_MISSING'
  | 'CUSTOMER_REFERENCE_HAS_NO_DIGITS'
  | 'NO_MATCHING_ECOMEX_DEVIATIONS'
  | 'MATCHING_ECOMEX_DEVIATIONS_FOUND'

export type OperationalDeviationCorrelationIssue =
  | {
      readonly code: 'CUSTOMER_REFERENCE_MISSING'
      readonly rawCustomerReference: undefined
    }
  | {
      readonly code: 'CUSTOMER_REFERENCE_HAS_NO_DIGITS'
      readonly rawCustomerReference: string
    }
  | {
      readonly code: 'LEGACY_CORRELATION_REFERENCE_COLLISION'
      readonly legacyCorrelationKey: string
      readonly ecomexShipmentReferences: readonly string[]
    }

type UncorrelatableOperationalDeviationIssue = Extract<
  OperationalDeviationCorrelationIssue,
  {
    readonly code:
      'CUSTOMER_REFERENCE_MISSING' | 'CUSTOMER_REFERENCE_HAS_NO_DIGITS'
  }
>

type CorrelatedOperationalDeviationIssue = Extract<
  OperationalDeviationCorrelationIssue,
  { readonly code: 'LEGACY_CORRELATION_REFERENCE_COLLISION' }
>

export interface OpenDeviationImpactAggregation {
  readonly matchedDeviationCount: number
  readonly openDeviationCount: number
  readonly openBlockingDeviationCount: number
  readonly openNonBlockingDeviationCount: number
  readonly openUnclassifiedDeviationCount: number
}

export interface CorrelatedOperationalDeviations {
  readonly status: 'correlated'
  readonly rawCustomerReference: string
  readonly legacyCorrelationKey: string
  readonly matchedDeviations: readonly EComexOperationalDeviation[]
  readonly aggregation: OpenDeviationImpactAggregation
  readonly reasonCode: Extract<
    OperationalDeviationCorrelationReasonCode,
    'NO_MATCHING_ECOMEX_DEVIATIONS' | 'MATCHING_ECOMEX_DEVIATIONS_FOUND'
  >
  readonly issues: readonly CorrelatedOperationalDeviationIssue[]
}

export interface UncorrelatableOperationalDeviations {
  readonly status: 'uncorrelatable'
  readonly rawCustomerReference: string | undefined
  readonly reasonCode: Extract<
    OperationalDeviationCorrelationReasonCode,
    'CUSTOMER_REFERENCE_MISSING' | 'CUSTOMER_REFERENCE_HAS_NO_DIGITS'
  >
  readonly issues: readonly [UncorrelatableOperationalDeviationIssue]
}

export type OperationalDeviationCorrelationResult =
  CorrelatedOperationalDeviations | UncorrelatableOperationalDeviations

export function createLegacyCorrelationKey(
  reference: string | undefined,
): string | undefined {
  if (reference === undefined) {
    return undefined
  }

  const digits = reference.replace(/[^0-9]/g, '')
  return digits.length === 0 ? undefined : digits
}

export function correlateOperationalDeviations(
  etrackFacts: ETrackOperationalFacts,
  ecomexDeviations: readonly EComexOperationalDeviation[],
): OperationalDeviationCorrelationResult {
  const rawCustomerReference = etrackFacts.customerReference

  if (rawCustomerReference === undefined) {
    return {
      status: 'uncorrelatable',
      rawCustomerReference,
      reasonCode: 'CUSTOMER_REFERENCE_MISSING',
      issues: [{ code: 'CUSTOMER_REFERENCE_MISSING', rawCustomerReference }],
    }
  }

  const legacyCorrelationKey = createLegacyCorrelationKey(rawCustomerReference)
  if (legacyCorrelationKey === undefined) {
    return {
      status: 'uncorrelatable',
      rawCustomerReference,
      reasonCode: 'CUSTOMER_REFERENCE_HAS_NO_DIGITS',
      issues: [
        { code: 'CUSTOMER_REFERENCE_HAS_NO_DIGITS', rawCustomerReference },
      ],
    }
  }

  const matchedDeviations = ecomexDeviations.filter(
    (deviation) =>
      createLegacyCorrelationKey(deviation.ecomexShipmentReference) ===
      legacyCorrelationKey,
  )
  const issues = detectReferenceCollision(
    legacyCorrelationKey,
    matchedDeviations,
  )

  return {
    status: 'correlated',
    rawCustomerReference,
    legacyCorrelationKey,
    matchedDeviations,
    aggregation: aggregateOpenDeviationImpacts(matchedDeviations),
    reasonCode:
      matchedDeviations.length === 0
        ? 'NO_MATCHING_ECOMEX_DEVIATIONS'
        : 'MATCHING_ECOMEX_DEVIATIONS_FOUND',
    issues,
  }
}

function aggregateOpenDeviationImpacts(
  matchedDeviations: readonly EComexOperationalDeviation[],
): OpenDeviationImpactAggregation {
  return matchedDeviations.reduce<OpenDeviationImpactAggregation>(
    (aggregation, deviation) => {
      const matchedAggregation = {
        ...aggregation,
        matchedDeviationCount: aggregation.matchedDeviationCount + 1,
      }

      if (deviation.lifecycle.lifecycle === 'CLOSED') {
        return matchedAggregation
      }

      const openAggregation = {
        ...matchedAggregation,
        openDeviationCount: matchedAggregation.openDeviationCount + 1,
      }

      if (deviation.impact.classificationStatus === 'unclassified') {
        return {
          ...openAggregation,
          openUnclassifiedDeviationCount:
            openAggregation.openUnclassifiedDeviationCount + 1,
        }
      }

      return deviation.impact.impact === 'BLOCKING'
        ? {
            ...openAggregation,
            openBlockingDeviationCount:
              openAggregation.openBlockingDeviationCount + 1,
          }
        : {
            ...openAggregation,
            openNonBlockingDeviationCount:
              openAggregation.openNonBlockingDeviationCount + 1,
          }
    },
    {
      matchedDeviationCount: 0,
      openDeviationCount: 0,
      openBlockingDeviationCount: 0,
      openNonBlockingDeviationCount: 0,
      openUnclassifiedDeviationCount: 0,
    },
  )
}

function detectReferenceCollision(
  legacyCorrelationKey: string,
  matchedDeviations: readonly EComexOperationalDeviation[],
): readonly CorrelatedOperationalDeviationIssue[] {
  const distinctReferences = matchedDeviations.reduce<readonly string[]>(
    (references, deviation) =>
      references.includes(deviation.ecomexShipmentReference)
        ? references
        : [...references, deviation.ecomexShipmentReference],
    [],
  )

  return distinctReferences.length > 1
    ? [
        {
          code: 'LEGACY_CORRELATION_REFERENCE_COLLISION',
          legacyCorrelationKey,
          ecomexShipmentReferences: distinctReferences,
        },
      ]
    : []
}
