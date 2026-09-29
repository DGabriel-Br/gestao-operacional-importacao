import {
  assessOperationalProcess,
  type CivilDate,
  type OperationalAssessment,
  type OperationalAssessmentFacts,
} from '@gestao-operacional/domain'
import {
  composeOperationalDeviationSummary,
  type ReadyOperationalDeviationSummaryProjection,
  type UncorrelatableOperationalDeviationSummaryProjection,
} from './compose-operational-deviation-summary'
import type { OperationalDeviationCorrelationResult } from './correlate-operational-deviations'
import type { ETrackOperationalFacts } from './project-etrack-operational-facts'

export interface AssessCorrelatedOperationalProcessInput {
  readonly etrackFacts: ETrackOperationalFacts
  readonly deviationCorrelation: OperationalDeviationCorrelationResult
  readonly evaluationDate: CivilDate
}

export interface AssessedOperationalProcessResult {
  readonly status: 'assessed'
  readonly etrackFacts: ETrackOperationalFacts
  readonly evaluationDate: CivilDate
  readonly deviationSummaryProjection: ReadyOperationalDeviationSummaryProjection
  readonly assessmentFacts: OperationalAssessmentFacts
  readonly assessment: OperationalAssessment
}

export interface UnassessableOperationalProcessResult {
  readonly status: 'unassessable'
  readonly etrackFacts: ETrackOperationalFacts
  readonly evaluationDate: CivilDate
  readonly deviationSummaryProjection: UncorrelatableOperationalDeviationSummaryProjection
}

export type OperationalAssessmentApplicationResult =
  AssessedOperationalProcessResult | UnassessableOperationalProcessResult

export function assessCorrelatedOperationalProcess(
  input: AssessCorrelatedOperationalProcessInput,
): OperationalAssessmentApplicationResult {
  const deviationSummaryProjection = composeOperationalDeviationSummary(
    input.deviationCorrelation,
  )

  if (deviationSummaryProjection.status === 'uncorrelatable') {
    return {
      status: 'unassessable',
      etrackFacts: input.etrackFacts,
      evaluationDate: input.evaluationDate,
      deviationSummaryProjection,
    }
  }

  const assessmentFacts: OperationalAssessmentFacts = {
    transportMode: input.etrackFacts.transportMode,
    observation: input.etrackFacts.observation,
    hasProcessId: input.etrackFacts.hasProcessId,
    hasRegistration: input.etrackFacts.hasRegistration,
    estimatedArrivalDate: input.etrackFacts.estimatedArrivalDate,
    hasArrival: input.etrackFacts.hasArrival,
    evaluationDate: input.evaluationDate,
    hasMercanteReference: input.etrackFacts.hasMercanteReference,
    hasHouseReference: input.etrackFacts.hasHouseReference,
    hasCargoAgent: input.etrackFacts.hasCargoAgent,
    hasOriginalReceiptDate: input.etrackFacts.hasOriginalReceiptDate,
    deviationSummary: deviationSummaryProjection.summary,
  }

  return {
    status: 'assessed',
    etrackFacts: input.etrackFacts,
    evaluationDate: input.evaluationDate,
    deviationSummaryProjection,
    assessmentFacts,
    assessment: assessOperationalProcess(assessmentFacts),
  }
}
