export interface OperationalSnapshotHttpRequest {
  readonly evaluationDate: string
  readonly etrackRows: unknown
  readonly ecomexRows: unknown
}

export interface OperationalSnapshotHttpIssue {
  readonly code: string
  readonly severity?: string
}

export interface OperationalSnapshotHttpTrace {
  readonly source: string
  readonly sourceVersion: string
  readonly rowNumber: number
}

export interface OperationalSnapshotHttpWarning {
  readonly index: number
  readonly trace: OperationalSnapshotHttpTrace
  readonly issues: readonly OperationalSnapshotHttpIssue[]
}

export interface OperationalSnapshotHttpFailure {
  readonly index: number
  readonly trace: OperationalSnapshotHttpTrace
  readonly importIssues: readonly OperationalSnapshotHttpIssue[]
  readonly projectionIssues: readonly OperationalSnapshotHttpIssue[]
}

export interface OperationalSnapshotHttpAssessment {
  readonly operationalStage: { readonly stage: string }
  readonly criticality:
    | {
        readonly classificationStatus: 'classified'
        readonly criticality: number
      }
    | {
        readonly classificationStatus: 'unclassified'
        readonly criticality?: undefined
      }
  readonly alert: { readonly alert: string }
  readonly digitalOriginal: { readonly status: string }
  readonly physicalOriginal: { readonly status: string }
  readonly mercante: { readonly status: string }
  readonly deviationSummary: {
    readonly openBlockingDeviationCount: number
    readonly openNonBlockingDeviationCount: number
  }
}

export interface AssessedOperationalSnapshotEntryResult {
  readonly status: 'assessed'
  readonly assessment: OperationalSnapshotHttpAssessment
}

export interface UnassessableOperationalSnapshotEntryResult {
  readonly status: 'unassessable'
  readonly deviationSummaryProjection: {
    readonly correlation: { readonly reasonCode: string }
  }
}

export interface OperationalSnapshotHttpEntry {
  readonly index: number
  readonly processNumber: string | undefined
  readonly customerReference: string | undefined
  readonly result:
    | AssessedOperationalSnapshotEntryResult
    | UnassessableOperationalSnapshotEntryResult
}

export interface OperationalSnapshotHttpDiagnosticReference {
  readonly firstIndex: number
  readonly processNumber: string | undefined
  readonly customerReference: string
}

export interface OperationalSnapshotHttpDiagnostic {
  readonly code: string
  readonly legacyCorrelationKey?: string
  readonly references?: readonly OperationalSnapshotHttpDiagnosticReference[]
}

export interface ReadyOperationalSnapshotHttpResponse {
  readonly status: 'ready'
  readonly evaluationDate: string
  readonly warnings: {
    readonly etrack: readonly OperationalSnapshotHttpWarning[]
    readonly ecomex: readonly OperationalSnapshotHttpWarning[]
  }
  readonly batch: {
    readonly entries: readonly OperationalSnapshotHttpEntry[]
    readonly diagnostics: readonly OperationalSnapshotHttpDiagnostic[]
  }
}

export interface InvalidSourceDataOperationalSnapshotHttpResponse {
  readonly status: 'invalid_source_data'
  readonly evaluationDate: string
  readonly failures: {
    readonly etrack: readonly OperationalSnapshotHttpFailure[]
    readonly ecomex: readonly OperationalSnapshotHttpFailure[]
  }
}

export interface BadRequestOperationalSnapshotHttpResponse {
  readonly status: 'bad_request'
  readonly issues: readonly {
    readonly path: string
    readonly code: string
  }[]
}

export type OperationalSnapshotHttpResponse =
  | ReadyOperationalSnapshotHttpResponse
  | InvalidSourceDataOperationalSnapshotHttpResponse
  | BadRequestOperationalSnapshotHttpResponse
