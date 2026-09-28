import type { CivilDate } from '../civil-date.js'
import {
  determineDigitalOriginalStatus,
  type DigitalOriginalDecision,
} from '../digital-original/determine-digital-original-status.js'
import { recognizeDigitalOriginalEvidence } from '../digital-original/recognize-digital-original-evidence.js'
import {
  determineMercanteStatus,
  type MercanteDecision,
} from '../mercante/determine-mercante-status.js'
import { recognizeMercanteEvidence } from '../mercante/recognize-mercante-evidence.js'
import {
  determineOperationalAlert,
  type OperationalAlertDecision,
} from '../operational-alerts/determine-operational-alert.js'
import {
  determineOperationalCriticality,
  type OperationalCriticalityDecision,
} from '../operational-criticality/determine-operational-criticality.js'
import {
  recognizeOperationalEvent,
  type OperationalEventRecognition,
} from '../operational-events/recognize-operational-event.js'
import {
  determineMonitoringEligibility,
  type MonitoringEligibilityDecision,
  type MonitoringTransportMode,
} from '../operational-monitoring/determine-monitoring-eligibility.js'
import { recognizeOperationalMonitoringObservationEvidence } from '../operational-monitoring/recognize-observation-evidence.js'
import {
  determineOperationalStage,
  type OperationalStageDecision,
} from '../operational-stages/determine-operational-stage.js'
import {
  determinePhysicalOriginalStatus,
  type PhysicalOriginalDecision,
} from '../physical-original/determine-physical-original-status.js'
import { recognizePhysicalOriginalEvidence } from '../physical-original/recognize-physical-original-evidence.js'

export interface OperationalDeviationSummary {
  readonly openBlockingDeviationCount: number
  readonly openNonBlockingDeviationCount: number
  readonly openUnclassifiedDeviationCount: number
  readonly hasOpenDigitalOriginalDeviation: boolean
  readonly hasOpenPhysicalOriginalDeviation: boolean
}

export interface OperationalAssessmentFacts {
  readonly transportMode: MonitoringTransportMode
  readonly observation: string | undefined
  readonly hasProcessId: boolean
  readonly hasRegistration: boolean
  readonly estimatedArrivalDate: CivilDate | undefined
  readonly hasArrival: boolean
  readonly evaluationDate: CivilDate
  readonly hasMercanteReference: boolean
  readonly hasHouseReference: boolean
  readonly hasCargoAgent: boolean
  readonly hasOriginalReceiptDate: boolean
  readonly deviationSummary: OperationalDeviationSummary
}

export interface OperationalAssessment {
  readonly monitoringEligibility: MonitoringEligibilityDecision
  readonly operationalEvent: OperationalEventRecognition
  readonly operationalStage: OperationalStageDecision
  readonly criticality: OperationalCriticalityDecision
  readonly alert: OperationalAlertDecision
  readonly digitalOriginal: DigitalOriginalDecision
  readonly physicalOriginal: PhysicalOriginalDecision
  readonly mercante: MercanteDecision
  readonly deviationSummary: OperationalDeviationSummary
}

export function assessOperationalProcess(
  facts: OperationalAssessmentFacts,
): OperationalAssessment {
  const monitoringEligibility = determineMonitoringEligibility({
    hasProcessId: facts.hasProcessId,
    hasEstimatedArrival: facts.estimatedArrivalDate !== undefined,
    hasArrival: facts.hasArrival,
    hasRegistration: facts.hasRegistration,
    transportMode: facts.transportMode,
    observationEvidence: recognizeOperationalMonitoringObservationEvidence(
      facts.observation,
    ),
  })

  const operationalEvent = recognizeOperationalEvent(facts.observation)
  const operationalStage = determineAssessmentStage(operationalEvent, facts)

  const criticality = determineOperationalCriticality({
    estimatedArrivalDate: facts.estimatedArrivalDate,
    hasArrival: facts.hasArrival,
    evaluationDate: facts.evaluationDate,
  })

  const digitalOriginal = determineDigitalOriginalStatus({
    transportMode: facts.transportMode,
    recognizedEvidence: recognizeDigitalOriginalEvidence(facts.observation),
    hasOpenDigitalOriginalDeviation:
      facts.deviationSummary.hasOpenDigitalOriginalDeviation,
  })

  const physicalOriginal = determinePhysicalOriginalStatus({
    transportMode: facts.transportMode,
    hasHouseReference: facts.hasHouseReference,
    hasCargoAgent: facts.hasCargoAgent,
    recognizedEvidence: recognizePhysicalOriginalEvidence(facts.observation),
    hasOriginalReceiptDate: facts.hasOriginalReceiptDate,
    hasOpenPhysicalOriginalDeviation:
      facts.deviationSummary.hasOpenPhysicalOriginalDeviation,
    estimatedArrivalDate: facts.estimatedArrivalDate,
    evaluationDate: facts.evaluationDate,
  })

  const mercante = determineMercanteStatus({
    transportMode: facts.transportMode,
    hasMercanteReference: facts.hasMercanteReference,
    recognizedEvidence: recognizeMercanteEvidence(facts.observation),
    estimatedArrivalDate: facts.estimatedArrivalDate,
    evaluationDate: facts.evaluationDate,
    digitalOriginalStatus: digitalOriginal.status,
  })

  const alert = determineOperationalAlert({
    stage: operationalStage.stage,
    blockingDeviationCount: facts.deviationSummary.openBlockingDeviationCount,
    nonBlockingDeviationCount:
      facts.deviationSummary.openNonBlockingDeviationCount,
    estimatedArrivalDate: facts.estimatedArrivalDate,
    hasArrival: facts.hasArrival,
    evaluationDate: facts.evaluationDate,
  })

  return {
    monitoringEligibility,
    operationalEvent,
    operationalStage,
    criticality,
    alert,
    digitalOriginal,
    physicalOriginal,
    mercante,
    deviationSummary: facts.deviationSummary,
  }
}

function determineAssessmentStage(
  operationalEvent: OperationalEventRecognition,
  facts: OperationalAssessmentFacts,
): OperationalStageDecision {
  if (operationalEvent.event === 'TYPING_COMPLETED') {
    return determineOperationalStage({
      event: operationalEvent.event,
      transportMode: facts.transportMode,
      hasMercanteReference: facts.hasMercanteReference,
    })
  }

  return determineOperationalStage({ event: operationalEvent.event })
}
