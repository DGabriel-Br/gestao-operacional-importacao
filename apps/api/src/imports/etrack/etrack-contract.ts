export const ETRACK_SOURCE = 'etrack' as const

export const ETRACK_HEADERS = [
  'Numero do Processo',
  'Referencia Cliente',
  'Data da Previsão de Chegada',
  'Data Chegada',
  'Via Transporte',
  'Data Registro',
  'Nº CE MERCANTE',
  'Datas Originais',
  'Observações',
  'House',
  'Master',
  'Agente',
  'Data do Faturamento',
] as const

export const ETRACK_REQUIRED_HEADERS = ['Numero do Processo'] as const

export type ETrackHeader = (typeof ETRACK_HEADERS)[number]

export type ETrackDateValue =
  | { readonly kind: 'absent' }
  | { readonly kind: 'date'; readonly value: string }
  | { readonly kind: 'date-time'; readonly value: string }
  | { readonly kind: 'invalid'; readonly value: unknown }

export type ETrackTransportModeValue =
  | { readonly kind: 'absent' }
  | {
      readonly kind: 'known'
      readonly value: 'Aérea' | 'Marítima'
    }
  | { readonly kind: 'unknown'; readonly value: string }

export type ETrackIssueKind =
  | 'structural_error'
  | 'header_error'
  | 'row_error'
  | 'invalid_value'
  | 'unknown_value'

export interface ETrackImportIssue {
  readonly kind: ETrackIssueKind
  readonly severity: 'error' | 'warning'
  readonly code: string
  readonly message: string
  readonly field?: string
  readonly rowNumber?: number
  readonly value?: unknown
}

export interface ETrackHeaderValidationResult {
  readonly source: typeof ETRACK_SOURCE
  readonly issues: readonly ETrackImportIssue[]
}

export interface ETrackNormalizedRecord {
  readonly processNumber: string | undefined
  readonly customerReference: string | undefined
  readonly estimatedArrival: ETrackDateValue
  readonly arrival: ETrackDateValue
  readonly transportMode: ETrackTransportModeValue
  readonly registrationDate: ETrackDateValue
  readonly mercanteNumber: string | undefined
  readonly originalDate: ETrackDateValue
  readonly notes: string | undefined
  readonly house: string | undefined
  readonly master: string | undefined
  readonly agent: string | undefined
  readonly billingDate: ETrackDateValue
}

export interface ETrackRowInput {
  readonly sourceVersion: string
  readonly rowNumber: number
  readonly rawData: Readonly<Record<string, unknown>>
}

export interface ETrackRowImportResult {
  readonly trace: {
    readonly source: typeof ETRACK_SOURCE
    readonly sourceVersion: string
    readonly rowNumber: number
  }
  readonly rawData: Readonly<Record<string, unknown>>
  readonly normalizedData: ETrackNormalizedRecord
  readonly issues: readonly ETrackImportIssue[]
}
