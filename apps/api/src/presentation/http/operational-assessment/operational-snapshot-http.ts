import type { CivilDate } from '@gestao-operacional/domain'
import type { EComexImportIssue } from '../../../imports/ecomex/ecomex-contract'
import type { ETrackImportIssue } from '../../../imports/etrack/etrack-contract'
import { parseTechnicalIsoDate } from '../../../imports/shared/technical-date'
import type {
  EComexOperationalSourceFailure,
  ETrackOperationalSourceFailure,
  OperationalSnapshotUseCaseResult,
  ReadyEComexOperationalSourceProjection,
  ReadyETrackOperationalSourceProjection,
  RunOperationalSnapshotInput,
} from '../../../application/operational-assessment/run-operational-snapshot'
import type { OperationalBatchAssessment } from '../../../application/operational-assessment/assess-operational-batch'

export interface OperationalSnapshotHttpSourceRow {
  readonly sourceVersion: string
  readonly rowNumber: number
  readonly rawData: Readonly<Record<string, unknown>>
}

export interface OperationalSnapshotHttpRequest {
  readonly evaluationDate: string
  readonly etrackRows: readonly OperationalSnapshotHttpSourceRow[]
  readonly ecomexRows: readonly OperationalSnapshotHttpSourceRow[]
}

export type OperationalSnapshotHttpRequestIssueCode =
  | 'INVALID_BODY'
  | 'INVALID_EVALUATION_DATE'
  | 'INVALID_ETRACK_ROWS'
  | 'INVALID_ECOMEX_ROWS'
  | 'INVALID_ROW'
  | 'INVALID_SOURCE_VERSION'
  | 'INVALID_ROW_NUMBER'
  | 'INVALID_RAW_DATA'

export interface OperationalSnapshotHttpRequestIssue {
  readonly path: string
  readonly code: OperationalSnapshotHttpRequestIssueCode
}

export type OperationalSnapshotHttpRequestParseResult =
  | {
      readonly status: 'valid'
      readonly input: RunOperationalSnapshotInput
    }
  | {
      readonly status: 'invalid'
      readonly issues: readonly OperationalSnapshotHttpRequestIssue[]
    }

export interface OperationalSnapshotHttpBadRequestResponse {
  readonly status: 'bad_request'
  readonly issues: readonly OperationalSnapshotHttpRequestIssue[]
}

export interface ETrackHttpSourceWarning {
  readonly index: number
  readonly trace: ReadyETrackOperationalSourceProjection['trace']
  readonly issues: readonly ETrackImportIssue[]
}

export interface EComexHttpSourceWarning {
  readonly index: number
  readonly trace: ReadyEComexOperationalSourceProjection['trace']
  readonly issues: readonly EComexImportIssue[]
}

export interface ReadyOperationalSnapshotHttpResponse {
  readonly status: 'ready'
  readonly evaluationDate: string
  readonly warnings: {
    readonly etrack: readonly ETrackHttpSourceWarning[]
    readonly ecomex: readonly EComexHttpSourceWarning[]
  }
  readonly batch: {
    readonly entries: OperationalBatchAssessment['entries']
    readonly diagnostics: OperationalBatchAssessment['diagnostics']
  }
}

export interface InvalidSourceDataOperationalSnapshotHttpResponse {
  readonly status: 'invalid_source_data'
  readonly evaluationDate: string
  readonly failures: {
    readonly etrack: readonly ETrackOperationalSourceFailure[]
    readonly ecomex: readonly EComexOperationalSourceFailure[]
  }
}

export type OperationalSnapshotHttpResponse =
  | ReadyOperationalSnapshotHttpResponse
  | InvalidSourceDataOperationalSnapshotHttpResponse

interface ParsedSourceRows {
  readonly rows: readonly OperationalSnapshotHttpSourceRow[]
  readonly issues: readonly OperationalSnapshotHttpRequestIssue[]
}

export function parseOperationalSnapshotHttpRequest(
  body: unknown,
): OperationalSnapshotHttpRequestParseResult {
  if (!isRecord(body)) {
    return {
      status: 'invalid',
      issues: [{ path: '$', code: 'INVALID_BODY' }],
    }
  }

  const evaluationDate = parseEvaluationDate(body.evaluationDate)
  const etrackRows = parseSourceRows(
    body.etrackRows,
    'etrackRows',
    'INVALID_ETRACK_ROWS',
  )
  const ecomexRows = parseSourceRows(
    body.ecomexRows,
    'ecomexRows',
    'INVALID_ECOMEX_ROWS',
  )
  const issues = [
    ...(evaluationDate === undefined
      ? [
          {
            path: 'evaluationDate',
            code: 'INVALID_EVALUATION_DATE' as const,
          },
        ]
      : []),
    ...etrackRows.issues,
    ...ecomexRows.issues,
  ]

  if (issues.length > 0 || evaluationDate === undefined) {
    return { status: 'invalid', issues }
  }

  return {
    status: 'valid',
    input: {
      evaluationDate,
      etrackRows: etrackRows.rows,
      ecomexRows: ecomexRows.rows,
    },
  }
}

export function toOperationalSnapshotHttpResponse(
  result: OperationalSnapshotUseCaseResult,
): OperationalSnapshotHttpResponse {
  if (result.status === 'invalid_source_data') {
    return {
      status: result.status,
      evaluationDate: formatCivilDate(result.evaluationDate),
      failures: {
        etrack: result.etrackFailures,
        ecomex: result.ecomexFailures,
      },
    }
  }

  return {
    status: result.status,
    evaluationDate: formatCivilDate(result.evaluationDate),
    warnings: {
      etrack: collectETrackWarnings(result.etrackProjections),
      ecomex: collectEComexWarnings(result.ecomexProjections),
    },
    batch: {
      entries: result.batchAssessment.entries,
      diagnostics: result.batchAssessment.diagnostics,
    },
  }
}

function parseEvaluationDate(value: unknown): CivilDate | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const parsed = parseTechnicalIsoDate(value)
  if (parsed.kind !== 'date' || parsed.value !== value) {
    return undefined
  }

  return {
    year: Number(value.slice(0, 4)),
    month: Number(value.slice(5, 7)),
    day: Number(value.slice(8, 10)),
  }
}

function parseSourceRows(
  value: unknown,
  path: 'etrackRows' | 'ecomexRows',
  arrayIssueCode: 'INVALID_ETRACK_ROWS' | 'INVALID_ECOMEX_ROWS',
): ParsedSourceRows {
  if (!Array.isArray(value)) {
    return {
      rows: [],
      issues: [{ path, code: arrayIssueCode }],
    }
  }

  const rows: OperationalSnapshotHttpSourceRow[] = []
  const issues: OperationalSnapshotHttpRequestIssue[] = []

  for (const [index, candidate] of value.entries()) {
    const rowPath = `${path}[${index}]`
    if (!isRecord(candidate)) {
      issues.push({ path: rowPath, code: 'INVALID_ROW' })
      continue
    }

    const rowIssues: OperationalSnapshotHttpRequestIssue[] = []
    if (typeof candidate.sourceVersion !== 'string') {
      rowIssues.push({
        path: `${rowPath}.sourceVersion`,
        code: 'INVALID_SOURCE_VERSION',
      })
    }
    if (typeof candidate.rowNumber !== 'number') {
      rowIssues.push({
        path: `${rowPath}.rowNumber`,
        code: 'INVALID_ROW_NUMBER',
      })
    }
    if (!isRecord(candidate.rawData)) {
      rowIssues.push({
        path: `${rowPath}.rawData`,
        code: 'INVALID_RAW_DATA',
      })
    }

    issues.push(...rowIssues)
    if (
      rowIssues.length === 0 &&
      typeof candidate.sourceVersion === 'string' &&
      typeof candidate.rowNumber === 'number' &&
      isRecord(candidate.rawData)
    ) {
      rows.push({
        sourceVersion: candidate.sourceVersion,
        rowNumber: candidate.rowNumber,
        rawData: candidate.rawData,
      })
    }
  }

  return { rows, issues }
}

function collectETrackWarnings(
  projections: readonly ReadyETrackOperationalSourceProjection[],
): readonly ETrackHttpSourceWarning[] {
  return projections.flatMap<ETrackHttpSourceWarning>((projection) => {
    const issues = projection.importIssues.filter(
      (issue) => issue.severity === 'warning',
    )
    return issues.length === 0
      ? []
      : [
          {
            index: projection.index,
            trace: projection.trace,
            issues,
          },
        ]
  })
}

function collectEComexWarnings(
  projections: readonly ReadyEComexOperationalSourceProjection[],
): readonly EComexHttpSourceWarning[] {
  return projections.flatMap<EComexHttpSourceWarning>((projection) => {
    const issues = projection.importIssues.filter(
      (issue) => issue.severity === 'warning',
    )
    return issues.length === 0
      ? []
      : [
          {
            index: projection.index,
            trace: projection.trace,
            issues,
          },
        ]
  })
}

function formatCivilDate(value: CivilDate): string {
  return `${value.year.toString().padStart(4, '0')}-${value.month
    .toString()
    .padStart(2, '0')}-${value.day.toString().padStart(2, '0')}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
