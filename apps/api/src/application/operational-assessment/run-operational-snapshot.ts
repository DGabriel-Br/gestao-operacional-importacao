import type { CivilDate } from '@gestao-operacional/domain'
import {
  type EComexImportIssue,
  type EComexRowInput,
} from '../../imports/ecomex/ecomex-contract'
import { importEComexRow } from '../../imports/ecomex/ecomex-importer'
import {
  type ETrackImportIssue,
  type ETrackRowInput,
} from '../../imports/etrack/etrack-contract'
import { importETrackRow } from '../../imports/etrack/etrack-importer'
import {
  assessOperationalBatch,
  type OperationalBatchAssessment,
} from './assess-operational-batch'
import {
  projectEComexOperationalDeviation,
  type EComexOperationalDeviation,
  type EComexOperationalDeviationProjectionIssue,
  type EComexOperationalDeviationTrace,
} from './project-ecomex-operational-deviation'
import {
  projectETrackOperationalFacts,
  type ETrackOperationalFacts,
  type ETrackOperationalProjectionIssue,
  type ETrackOperationalProjectionTrace,
} from './project-etrack-operational-facts'

export interface RunOperationalSnapshotInput {
  readonly etrackRows: readonly ETrackRowInput[]
  readonly ecomexRows: readonly EComexRowInput[]
  readonly evaluationDate: CivilDate
}

export interface ReadyETrackOperationalSourceProjection {
  readonly index: number
  readonly trace: ETrackOperationalProjectionTrace
  readonly facts: ETrackOperationalFacts
  readonly importIssues: readonly ETrackImportIssue[]
}

export interface ReadyEComexOperationalSourceProjection {
  readonly index: number
  readonly trace: EComexOperationalDeviationTrace
  readonly deviation: EComexOperationalDeviation
  readonly importIssues: readonly EComexImportIssue[]
}

export interface ETrackOperationalSourceFailure {
  readonly index: number
  readonly trace: ETrackOperationalProjectionTrace
  readonly importIssues: readonly ETrackImportIssue[]
  readonly projectionIssues: readonly ETrackOperationalProjectionIssue[]
}

export interface EComexOperationalSourceFailure {
  readonly index: number
  readonly trace: EComexOperationalDeviationTrace
  readonly importIssues: readonly EComexImportIssue[]
  readonly projectionIssues: readonly EComexOperationalDeviationProjectionIssue[]
}

export interface ReadyOperationalSnapshotUseCaseResult {
  readonly status: 'ready'
  readonly evaluationDate: CivilDate
  readonly etrackProjections: readonly ReadyETrackOperationalSourceProjection[]
  readonly ecomexProjections: readonly ReadyEComexOperationalSourceProjection[]
  readonly batchAssessment: OperationalBatchAssessment
}

export interface InvalidSourceDataOperationalSnapshotUseCaseResult {
  readonly status: 'invalid_source_data'
  readonly evaluationDate: CivilDate
  readonly etrackFailures: readonly ETrackOperationalSourceFailure[]
  readonly ecomexFailures: readonly EComexOperationalSourceFailure[]
}

export type OperationalSnapshotUseCaseResult =
  | ReadyOperationalSnapshotUseCaseResult
  | InvalidSourceDataOperationalSnapshotUseCaseResult

interface ETrackSourceProjectionCollection {
  readonly ready: readonly ReadyETrackOperationalSourceProjection[]
  readonly failures: readonly ETrackOperationalSourceFailure[]
}

interface EComexSourceProjectionCollection {
  readonly ready: readonly ReadyEComexOperationalSourceProjection[]
  readonly failures: readonly EComexOperationalSourceFailure[]
}

export function runOperationalSnapshot(
  input: RunOperationalSnapshotInput,
): OperationalSnapshotUseCaseResult {
  const etrack = projectETrackSourceRows(input.etrackRows)
  const ecomex = projectEComexSourceRows(input.ecomexRows)

  if (etrack.failures.length > 0 || ecomex.failures.length > 0) {
    return {
      status: 'invalid_source_data',
      evaluationDate: input.evaluationDate,
      etrackFailures: etrack.failures,
      ecomexFailures: ecomex.failures,
    }
  }

  const batchAssessment = assessOperationalBatch({
    etrackFacts: etrack.ready.map((projection) => projection.facts),
    ecomexDeviations: ecomex.ready.map((projection) => projection.deviation),
    evaluationDate: input.evaluationDate,
  })

  return {
    status: 'ready',
    evaluationDate: input.evaluationDate,
    etrackProjections: etrack.ready,
    ecomexProjections: ecomex.ready,
    batchAssessment,
  }
}

function projectETrackSourceRows(
  rows: readonly ETrackRowInput[],
): ETrackSourceProjectionCollection {
  const ready: ReadyETrackOperationalSourceProjection[] = []
  const failures: ETrackOperationalSourceFailure[] = []

  for (const [index, row] of rows.entries()) {
    const importedRow = importETrackRow(row)
    const projection = projectETrackOperationalFacts(importedRow)
    const hasImportError = importedRow.issues.some(
      (issue) => issue.severity === 'error',
    )

    if (hasImportError || projection.status === 'invalid') {
      failures.push({
        index,
        trace: importedRow.trace,
        importIssues: importedRow.issues,
        projectionIssues:
          projection.status === 'invalid' ? projection.issues : [],
      })
      continue
    }

    ready.push({
      index,
      trace: projection.trace,
      facts: projection.facts,
      importIssues: importedRow.issues,
    })
  }

  return { ready, failures }
}

function projectEComexSourceRows(
  rows: readonly EComexRowInput[],
): EComexSourceProjectionCollection {
  const ready: ReadyEComexOperationalSourceProjection[] = []
  const failures: EComexOperationalSourceFailure[] = []

  for (const [index, row] of rows.entries()) {
    const importedRow = importEComexRow(row)
    const projection = projectEComexOperationalDeviation(importedRow)
    const hasImportError = importedRow.issues.some(
      (issue) => issue.severity === 'error',
    )

    if (hasImportError || projection.status === 'invalid') {
      failures.push({
        index,
        trace: importedRow.trace,
        importIssues: importedRow.issues,
        projectionIssues:
          projection.status === 'invalid' ? projection.issues : [],
      })
      continue
    }

    ready.push({
      index,
      trace: projection.deviation.trace,
      deviation: projection.deviation,
      importIssues: importedRow.issues,
    })
  }

  return { ready, failures }
}
