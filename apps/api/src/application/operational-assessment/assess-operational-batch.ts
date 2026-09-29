import type { CivilDate } from '@gestao-operacional/domain'
import {
  assessCorrelatedOperationalProcess,
  type OperationalAssessmentApplicationResult,
} from './assess-correlated-operational-process'
import {
  correlateOperationalDeviations,
  createLegacyCorrelationKey,
} from './correlate-operational-deviations'
import type { EComexOperationalDeviation } from './project-ecomex-operational-deviation'
import type { ETrackOperationalFacts } from './project-etrack-operational-facts'

export interface AssessOperationalBatchInput {
  readonly etrackFacts: readonly ETrackOperationalFacts[]
  readonly ecomexDeviations: readonly EComexOperationalDeviation[]
  readonly evaluationDate: CivilDate
}

export interface OperationalBatchAssessmentEntry {
  readonly index: number
  readonly processNumber: string | undefined
  readonly customerReference: string | undefined
  readonly result: OperationalAssessmentApplicationResult
}

export interface LegacyETrackCorrelationReference {
  readonly firstIndex: number
  readonly processNumber: string | undefined
  readonly customerReference: string
}

export interface LegacyETrackCorrelationKeyCollisionDiagnostic {
  readonly code: 'LEGACY_ETRACK_CORRELATION_KEY_COLLISION'
  readonly legacyCorrelationKey: string
  readonly references: readonly LegacyETrackCorrelationReference[]
}

export type OperationalBatchAssessmentDiagnostic =
  LegacyETrackCorrelationKeyCollisionDiagnostic

export interface OperationalBatchAssessment {
  readonly evaluationDate: CivilDate
  readonly entries: readonly OperationalBatchAssessmentEntry[]
  readonly diagnostics: readonly OperationalBatchAssessmentDiagnostic[]
}

interface LegacyCorrelationReferenceGroup {
  readonly legacyCorrelationKey: string
  readonly references: LegacyETrackCorrelationReference[]
}

export function assessOperationalBatch(
  input: AssessOperationalBatchInput,
): OperationalBatchAssessment {
  const entries = input.etrackFacts.map<OperationalBatchAssessmentEntry>(
    (etrackFacts, index) => {
      const deviationCorrelation = correlateOperationalDeviations(
        etrackFacts,
        input.ecomexDeviations,
      )

      return {
        index,
        processNumber: etrackFacts.processNumber,
        customerReference: etrackFacts.customerReference,
        result: assessCorrelatedOperationalProcess({
          etrackFacts,
          deviationCorrelation,
          evaluationDate: input.evaluationDate,
        }),
      }
    },
  )

  return {
    evaluationDate: input.evaluationDate,
    entries,
    diagnostics: detectLegacyETrackCorrelationKeyCollisions(input.etrackFacts),
  }
}

function detectLegacyETrackCorrelationKeyCollisions(
  etrackFacts: readonly ETrackOperationalFacts[],
): readonly LegacyETrackCorrelationKeyCollisionDiagnostic[] {
  const groups: LegacyCorrelationReferenceGroup[] = []

  for (const [index, facts] of etrackFacts.entries()) {
    const customerReference = facts.customerReference
    const legacyCorrelationKey = createLegacyCorrelationKey(customerReference)

    if (customerReference === undefined || legacyCorrelationKey === undefined) {
      continue
    }

    const group = groups.find(
      (candidate) => candidate.legacyCorrelationKey === legacyCorrelationKey,
    )
    const reference: LegacyETrackCorrelationReference = {
      firstIndex: index,
      processNumber: facts.processNumber,
      customerReference,
    }

    if (group === undefined) {
      groups.push({ legacyCorrelationKey, references: [reference] })
      continue
    }

    if (
      !group.references.some(
        (candidate) => candidate.customerReference === customerReference,
      )
    ) {
      group.references.push(reference)
    }
  }

  return groups
    .filter((group) => group.references.length > 1)
    .map((group) => ({
      code: 'LEGACY_ETRACK_CORRELATION_KEY_COLLISION',
      legacyCorrelationKey: group.legacyCorrelationKey,
      references: group.references,
    }))
}
