import type { TechnicalDateValue } from '../shared/technical-date'

export const ECOMEX_SOURCE = 'ecomex' as const

export const ECOMEX_HEADERS = [
  'EMBARQUE',
  'MODAL',
  'DESCR_DESVIO',
  'INICIO',
  'FIM',
  'OBSERVACOES',
  'JUSTIFICATIVA',
  'APONTADO_POR',
  'CONCLUIDO_POR',
  'EXPORT_NOME',
  'INVOICE',
] as const

export const ECOMEX_REQUIRED_HEADERS = ['EMBARQUE', 'DESCR_DESVIO'] as const

export type EComexHeader = (typeof ECOMEX_HEADERS)[number]

export type EComexDateValue = TechnicalDateValue

export type EComexTransportModeValue =
  | { readonly kind: 'absent' }
  | {
      readonly kind: 'known'
      readonly value: 'AEREO' | 'MARITIMO'
    }
  | { readonly kind: 'unknown'; readonly value: string }

export type EComexIssueKind =
  | 'structural_error'
  | 'header_error'
  | 'row_error'
  | 'invalid_value'
  | 'unknown_value'

export interface EComexImportIssue {
  readonly kind: EComexIssueKind
  readonly severity: 'error' | 'warning'
  readonly code: string
  readonly message: string
  readonly field?: string
  readonly rowNumber?: number
  readonly value?: unknown
}

export interface EComexHeaderValidationResult {
  readonly source: typeof ECOMEX_SOURCE
  readonly issues: readonly EComexImportIssue[]
}

export interface EComexNormalizedRecord {
  readonly shipmentReference: string | undefined
  readonly transportMode: EComexTransportModeValue
  readonly deviationDescription: string | undefined
  readonly start: EComexDateValue
  readonly end: EComexDateValue
  readonly notes: string | undefined
  readonly justification: string | undefined
  readonly reportedBy: string | undefined
  readonly completedBy: string | undefined
  readonly exportName: string | undefined
  readonly invoice: string | undefined
}

export interface EComexRowInput {
  readonly sourceVersion: string
  readonly rowNumber: number
  readonly rawData: Readonly<Record<string, unknown>>
}

export interface EComexRowImportResult {
  readonly trace: {
    readonly source: typeof ECOMEX_SOURCE
    readonly sourceVersion: string
    readonly rowNumber: number
  }
  readonly rawData: Readonly<Record<string, unknown>>
  readonly normalizedData: EComexNormalizedRecord
  readonly issues: readonly EComexImportIssue[]
}
