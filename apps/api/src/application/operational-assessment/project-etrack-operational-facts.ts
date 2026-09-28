import type { CivilDate } from '@gestao-operacional/domain'

type ETrackOperationalTechnicalDate =
  | { readonly kind: 'absent' }
  | { readonly kind: 'date'; readonly value: string }
  | { readonly kind: 'date-time'; readonly value: string }
  | { readonly kind: 'invalid'; readonly value: unknown }

type ETrackOperationalTechnicalTransportMode =
  | { readonly kind: 'absent' }
  | { readonly kind: 'known'; readonly value: 'Aérea' | 'Marítima' }
  | { readonly kind: 'unknown'; readonly value: string }

interface ETrackOperationalTechnicalIssue {
  readonly code: string
  readonly field?: string
  readonly value?: unknown
}

export interface ETrackOperationalProjectionInput {
  readonly trace: ETrackOperationalProjectionTrace
  readonly normalizedData: {
    readonly processNumber: string | undefined
    readonly customerReference: string | undefined
    readonly estimatedArrival: ETrackOperationalTechnicalDate
    readonly arrival: ETrackOperationalTechnicalDate
    readonly transportMode: ETrackOperationalTechnicalTransportMode
    readonly registrationDate: ETrackOperationalTechnicalDate
    readonly mercanteNumber: string | undefined
    readonly originalDate: ETrackOperationalTechnicalDate
    readonly notes: string | undefined
    readonly house: string | undefined
    readonly agent: string | undefined
  }
  readonly issues: readonly ETrackOperationalTechnicalIssue[]
}

export interface ETrackOperationalProjectionTrace {
  readonly source: 'etrack'
  readonly sourceVersion: string
  readonly rowNumber: number
}

export type ETrackOperationalTransportMode = 'air' | 'maritime' | 'unknown'

export type ETrackOperationalCivilDate = CivilDate

export interface ETrackOperationalFacts {
  readonly processNumber: string | undefined
  readonly customerReference: string | undefined
  readonly transportMode: ETrackOperationalTransportMode
  readonly observation: string | undefined
  readonly hasProcessId: boolean
  readonly hasRegistration: boolean
  readonly estimatedArrivalDate: ETrackOperationalCivilDate | undefined
  readonly hasArrival: boolean
  readonly hasMercanteReference: boolean
  readonly hasHouseReference: boolean
  readonly hasCargoAgent: boolean
  readonly hasOriginalReceiptDate: boolean
}

export type ETrackOperationalProjectionIssueCode =
  | 'INVALID_ESTIMATED_ARRIVAL_DATE'
  | 'INVALID_ARRIVAL_DATE'
  | 'INVALID_REGISTRATION_DATE'
  | 'INVALID_ORIGINAL_RECEIPT_DATE'
  | 'INVALID_OPERATIONAL_TEXT_VALUE'
  | 'INVALID_SOURCE_VERSION'
  | 'INVALID_ROW_NUMBER'

export type ETrackOperationalProjectionFact =
  | 'processNumber'
  | 'customerReference'
  | 'transportMode'
  | 'observation'
  | 'hasRegistration'
  | 'estimatedArrivalDate'
  | 'hasArrival'
  | 'hasMercanteReference'
  | 'hasHouseReference'
  | 'hasCargoAgent'
  | 'hasOriginalReceiptDate'
  | 'sourceVersion'
  | 'rowNumber'

export interface ETrackOperationalProjectionIssue {
  readonly code: ETrackOperationalProjectionIssueCode
  readonly fact: ETrackOperationalProjectionFact
  readonly value: unknown
}

export type ETrackOperationalProjectionResult =
  | {
      readonly status: 'ready'
      readonly trace: ETrackOperationalProjectionTrace
      readonly facts: ETrackOperationalFacts
      readonly issues: readonly []
    }
  | {
      readonly status: 'invalid'
      readonly trace: ETrackOperationalProjectionTrace
      readonly issues: readonly ETrackOperationalProjectionIssue[]
    }

interface ProjectedDate {
  readonly value: ETrackOperationalCivilDate | undefined
  readonly issue: ETrackOperationalProjectionIssue | undefined
}

export function projectETrackOperationalFacts(
  importedRow: ETrackOperationalProjectionInput,
): ETrackOperationalProjectionResult {
  const normalized = importedRow.normalizedData
  const estimatedArrival = projectCivilDate(
    normalized.estimatedArrival,
    'INVALID_ESTIMATED_ARRIVAL_DATE',
    'estimatedArrivalDate',
  )
  const arrival = projectCivilDate(
    normalized.arrival,
    'INVALID_ARRIVAL_DATE',
    'hasArrival',
  )
  const registration = projectCivilDate(
    normalized.registrationDate,
    'INVALID_REGISTRATION_DATE',
    'hasRegistration',
  )
  const originalReceipt = projectCivilDate(
    normalized.originalDate,
    'INVALID_ORIGINAL_RECEIPT_DATE',
    'hasOriginalReceiptDate',
  )

  const issues = [
    ...projectTraceIssues(importedRow.trace),
    ...projectRelevantTextIssues(importedRow.issues),
    estimatedArrival.issue,
    arrival.issue,
    registration.issue,
    originalReceipt.issue,
  ].filter(
    (issue): issue is ETrackOperationalProjectionIssue => issue !== undefined,
  )

  if (issues.length > 0) {
    return { status: 'invalid', trace: importedRow.trace, issues }
  }

  return {
    status: 'ready',
    trace: importedRow.trace,
    facts: {
      processNumber: normalized.processNumber,
      customerReference: normalized.customerReference,
      transportMode: projectTransportMode(normalized.transportMode),
      observation: normalized.notes,
      hasProcessId: normalized.processNumber !== undefined,
      hasRegistration: registration.value !== undefined,
      estimatedArrivalDate: estimatedArrival.value,
      hasArrival: arrival.value !== undefined,
      hasMercanteReference: normalized.mercanteNumber !== undefined,
      hasHouseReference: normalized.house !== undefined,
      hasCargoAgent: normalized.agent !== undefined,
      hasOriginalReceiptDate: originalReceipt.value !== undefined,
    },
    issues: [],
  }
}

function projectCivilDate(
  technicalDate: ETrackOperationalTechnicalDate,
  code: Exclude<
    ETrackOperationalProjectionIssueCode,
    'INVALID_OPERATIONAL_TEXT_VALUE'
  >,
  fact: Extract<
    ETrackOperationalProjectionFact,
    | 'estimatedArrivalDate'
    | 'hasArrival'
    | 'hasRegistration'
    | 'hasOriginalReceiptDate'
  >,
): ProjectedDate {
  if (technicalDate.kind === 'absent') {
    return { value: undefined, issue: undefined }
  }

  if (technicalDate.kind === 'invalid') {
    return {
      value: undefined,
      issue: { code, fact, value: technicalDate.value },
    }
  }

  return {
    value: {
      year: Number(technicalDate.value.slice(0, 4)),
      month: Number(technicalDate.value.slice(5, 7)),
      day: Number(technicalDate.value.slice(8, 10)),
    },
    issue: undefined,
  }
}

function projectTransportMode(
  transportMode: ETrackOperationalTechnicalTransportMode,
): ETrackOperationalTransportMode {
  if (transportMode.kind !== 'known') {
    return 'unknown'
  }

  return transportMode.value === 'Aérea' ? 'air' : 'maritime'
}

function projectTraceIssues(
  trace: ETrackOperationalProjectionTrace,
): readonly ETrackOperationalProjectionIssue[] {
  const sourceVersionIssues: readonly ETrackOperationalProjectionIssue[] =
    trace.sourceVersion.trim().length === 0
      ? [
          {
            code: 'INVALID_SOURCE_VERSION',
            fact: 'sourceVersion',
            value: trace.sourceVersion,
          },
        ]
      : []
  const rowNumberIssues: readonly ETrackOperationalProjectionIssue[] =
    Number.isInteger(trace.rowNumber) && trace.rowNumber > 0
      ? []
      : [
          {
            code: 'INVALID_ROW_NUMBER',
            fact: 'rowNumber',
            value: trace.rowNumber,
          },
        ]

  return [...sourceVersionIssues, ...rowNumberIssues]
}

function projectRelevantTextIssues(
  importIssues: readonly ETrackOperationalTechnicalIssue[],
): readonly ETrackOperationalProjectionIssue[] {
  return importIssues.flatMap<ETrackOperationalProjectionIssue>((issue) => {
    if (issue.code !== 'invalid_text_value') {
      return []
    }

    const fact = textFactForSourceField(issue.field)
    return fact === undefined
      ? []
      : [
          {
            code: 'INVALID_OPERATIONAL_TEXT_VALUE',
            fact,
            value: issue.value,
          },
        ]
  })
}

function textFactForSourceField(
  field: string | undefined,
): ETrackOperationalProjectionFact | undefined {
  switch (field) {
    case 'Numero do Processo':
      return 'processNumber'
    case 'Referencia Cliente':
      return 'customerReference'
    case 'Via Transporte':
      return 'transportMode'
    case 'Nº CE MERCANTE':
      return 'hasMercanteReference'
    case 'Observações':
      return 'observation'
    case 'House':
      return 'hasHouseReference'
    case 'Agente':
      return 'hasCargoAgent'
    default:
      return undefined
  }
}
