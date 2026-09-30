import type { OperationalSnapshotHttpEntry } from './operational-snapshot-contract'

export interface OperationalSnapshotTableRow {
  readonly index: number
  readonly processNumber: string | undefined
  readonly customerReference: string | undefined
  readonly result: 'assessed' | 'unassessable'
  readonly resultLabel: 'Avaliado' | 'Não avaliável'
  readonly reasonCode: string | undefined
  readonly stage: string | undefined
  readonly criticality: string | undefined
  readonly alert: string | undefined
  readonly blockingDeviationCount: number | undefined
  readonly nonBlockingDeviationCount: number | undefined
  readonly digitalOriginal: string | undefined
  readonly physicalOriginal: string | undefined
  readonly mercante: string | undefined
}

export function projectOperationalSnapshotRows(
  entries: readonly OperationalSnapshotHttpEntry[],
): readonly OperationalSnapshotTableRow[] {
  return entries.map((entry) => {
    if (entry.result.status === 'unassessable') {
      return {
        index: entry.index,
        processNumber: entry.processNumber,
        customerReference: entry.customerReference,
        result: entry.result.status,
        resultLabel: 'Não avaliável',
        reasonCode:
          entry.result.deviationSummaryProjection.correlation.reasonCode,
        stage: undefined,
        criticality: undefined,
        alert: undefined,
        blockingDeviationCount: undefined,
        nonBlockingDeviationCount: undefined,
        digitalOriginal: undefined,
        physicalOriginal: undefined,
        mercante: undefined,
      }
    }

    const assessment = entry.result.assessment
    return {
      index: entry.index,
      processNumber: entry.processNumber,
      customerReference: entry.customerReference,
      result: entry.result.status,
      resultLabel: 'Avaliado',
      reasonCode: undefined,
      stage: assessment.operationalStage.stage,
      criticality:
        assessment.criticality.classificationStatus === 'classified'
          ? String(assessment.criticality.criticality)
          : 'Não classificada',
      alert: assessment.alert.alert,
      blockingDeviationCount:
        assessment.deviationSummary.openBlockingDeviationCount,
      nonBlockingDeviationCount:
        assessment.deviationSummary.openNonBlockingDeviationCount,
      digitalOriginal: assessment.digitalOriginal.status,
      physicalOriginal: assessment.physicalOriginal.status,
      mercante: assessment.mercante.status,
    }
  })
}
