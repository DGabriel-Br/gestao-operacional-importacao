import {
  ECOMEX_REQUIRED_HEADERS,
  ECOMEX_SOURCE,
  type EComexDateValue,
  type EComexHeaderValidationResult,
  type EComexImportIssue,
  type EComexRowImportResult,
  type EComexRowInput,
  type EComexTransportModeValue,
} from './ecomex-contract'

type NormalizedText =
  | {
      readonly state: 'absent' | 'invalid'
      readonly value: undefined
      readonly issues: readonly EComexImportIssue[]
    }
  | {
      readonly state: 'value'
      readonly value: string
      readonly issues: readonly EComexImportIssue[]
    }

interface NormalizedDate {
  readonly value: EComexDateValue
  readonly issues: readonly EComexImportIssue[]
}

interface NormalizedTransportMode {
  readonly value: EComexTransportModeValue
  readonly issues: readonly EComexImportIssue[]
}

export function validateEComexHeaders(
  headers: readonly unknown[],
): EComexHeaderValidationResult {
  const structuralIssues: readonly EComexImportIssue[] =
    headers.length === 0
      ? [
          {
            kind: 'structural_error',
            severity: 'error',
            code: 'empty_header_set',
            message: 'O conjunto de cabeçalhos do eComex está vazio.',
          },
        ]
      : []

  const invalidHeaderIssues = headers.flatMap<EComexImportIssue>((header) =>
    typeof header === 'string'
      ? []
      : [
          {
            kind: 'header_error',
            severity: 'error',
            code: 'invalid_header',
            message: 'O cabeçalho do eComex deve ser texto.',
            value: header,
          },
        ],
  )

  const headerCounts = new Map<string, number>()
  for (const header of headers) {
    if (typeof header === 'string') {
      headerCounts.set(header, (headerCounts.get(header) ?? 0) + 1)
    }
  }

  const missingHeaderIssues =
    ECOMEX_REQUIRED_HEADERS.flatMap<EComexImportIssue>((requiredHeader) =>
      headerCounts.has(requiredHeader)
        ? []
        : [
            {
              kind: 'header_error',
              severity: 'error',
              code: 'missing_required_header',
              message: `Cabeçalho obrigatório ausente: ${requiredHeader}.`,
              field: requiredHeader,
            },
          ],
    )

  const duplicateHeaderIssues = [
    ...headerCounts.entries(),
  ].flatMap<EComexImportIssue>(([header, count]) =>
    count > 1
      ? [
          {
            kind: 'header_error',
            severity: 'error',
            code: 'duplicate_header',
            message: `Cabeçalho duplicado: ${header}.`,
            field: header,
          },
        ]
      : [],
  )

  return {
    source: ECOMEX_SOURCE,
    issues: [
      ...structuralIssues,
      ...invalidHeaderIssues,
      ...missingHeaderIssues,
      ...duplicateHeaderIssues,
    ],
  }
}

export function importEComexRow(input: EComexRowInput): EComexRowImportResult {
  const shipmentReference = normalizeText(
    input.rawData.EMBARQUE,
    'EMBARQUE',
    input.rowNumber,
  )
  const transportMode = normalizeTransportMode(
    input.rawData.MODAL,
    input.rowNumber,
  )
  const deviationDescription = normalizeText(
    input.rawData.DESCR_DESVIO,
    'DESCR_DESVIO',
    input.rowNumber,
  )
  const start = normalizeDate(input.rawData.INICIO, 'INICIO', input.rowNumber)
  const end = normalizeDate(input.rawData.FIM, 'FIM', input.rowNumber)
  const notes = normalizeNarrative(
    input.rawData.OBSERVACOES,
    'OBSERVACOES',
    input.rowNumber,
  )
  const justification = normalizeNarrative(
    input.rawData.JUSTIFICATIVA,
    'JUSTIFICATIVA',
    input.rowNumber,
  )
  const reportedBy = normalizeText(
    input.rawData.APONTADO_POR,
    'APONTADO_POR',
    input.rowNumber,
  )
  const completedBy = normalizeText(
    input.rawData.CONCLUIDO_POR,
    'CONCLUIDO_POR',
    input.rowNumber,
  )
  const exportName = normalizeText(
    input.rawData.EXPORT_NOME,
    'EXPORT_NOME',
    input.rowNumber,
  )
  const invoice = normalizeText(
    input.rawData.INVOICE,
    'INVOICE',
    input.rowNumber,
  )

  return {
    trace: {
      source: ECOMEX_SOURCE,
      sourceVersion: input.sourceVersion,
      rowNumber: input.rowNumber,
    },
    rawData: { ...input.rawData },
    normalizedData: {
      shipmentReference: shipmentReference.value,
      transportMode: transportMode.value,
      deviationDescription: deviationDescription.value,
      start: start.value,
      end: end.value,
      notes: notes.value,
      justification: justification.value,
      reportedBy: reportedBy.value,
      completedBy: completedBy.value,
      exportName: exportName.value,
      invoice: invoice.value,
    },
    issues: [
      ...validateTrace(input),
      ...shipmentReference.issues,
      ...requiredValueIssue(shipmentReference, 'EMBARQUE', input.rowNumber),
      ...transportMode.issues,
      ...deviationDescription.issues,
      ...requiredValueIssue(
        deviationDescription,
        'DESCR_DESVIO',
        input.rowNumber,
      ),
      ...start.issues,
      ...end.issues,
      ...notes.issues,
      ...justification.issues,
      ...reportedBy.issues,
      ...completedBy.issues,
      ...exportName.issues,
      ...invoice.issues,
    ],
  }
}

function requiredValueIssue(
  normalizedText: NormalizedText,
  field: 'EMBARQUE' | 'DESCR_DESVIO',
  rowNumber: number,
): readonly EComexImportIssue[] {
  return normalizedText.state === 'absent'
    ? [
        {
          kind: 'row_error',
          severity: 'error',
          code: 'missing_required_value',
          message: `${field} está vazio.`,
          field,
          rowNumber,
        },
      ]
    : []
}

function validateTrace(input: EComexRowInput): readonly EComexImportIssue[] {
  const sourceVersionIssues: readonly EComexImportIssue[] =
    input.sourceVersion.trim().length === 0
      ? [
          {
            kind: 'structural_error',
            severity: 'error',
            code: 'missing_source_version',
            message: 'A versão da fonte eComex deve ser informada.',
          },
        ]
      : []
  const rowNumberIssues: readonly EComexImportIssue[] =
    Number.isInteger(input.rowNumber) && input.rowNumber > 0
      ? []
      : [
          {
            kind: 'row_error',
            severity: 'error',
            code: 'invalid_row_number',
            message: 'O número da linha deve ser um inteiro positivo.',
            rowNumber: input.rowNumber,
            value: input.rowNumber,
          },
        ]

  return [...sourceVersionIssues, ...rowNumberIssues]
}

function normalizeText(
  rawValue: unknown,
  field: string,
  rowNumber: number,
): NormalizedText {
  if (rawValue === undefined || rawValue === null) {
    return { state: 'absent', value: undefined, issues: [] }
  }

  if (typeof rawValue === 'string') {
    const value = rawValue.trim()
    return value.length === 0
      ? { state: 'absent', value: undefined, issues: [] }
      : { state: 'value', value, issues: [] }
  }

  if (typeof rawValue === 'bigint') {
    return { state: 'value', value: rawValue.toString(), issues: [] }
  }

  if (typeof rawValue === 'number' && Number.isSafeInteger(rawValue)) {
    return { state: 'value', value: rawValue.toString(), issues: [] }
  }

  return {
    state: 'invalid',
    value: undefined,
    issues: [
      {
        kind: 'invalid_value',
        severity: 'error',
        code: 'invalid_text_value',
        message: `${field} não pode ser representado com segurança como texto.`,
        field,
        rowNumber,
        value: rawValue,
      },
    ],
  }
}

function normalizeNarrative(
  rawValue: unknown,
  field: 'OBSERVACOES' | 'JUSTIFICATIVA',
  rowNumber: number,
): NormalizedText {
  if (typeof rawValue !== 'string') {
    return normalizeText(rawValue, field, rowNumber)
  }

  return rawValue.trim().length === 0
    ? { state: 'absent', value: undefined, issues: [] }
    : { state: 'value', value: rawValue, issues: [] }
}

function normalizeDate(
  rawValue: unknown,
  field: 'INICIO' | 'FIM',
  rowNumber: number,
): NormalizedDate {
  if (rawValue === undefined || rawValue === null) {
    return { value: { kind: 'absent' }, issues: [] }
  }

  if (typeof rawValue !== 'string') {
    return invalidDate(rawValue, field, rowNumber)
  }

  const value = rawValue.trim()
  if (value.length === 0) {
    return { value: { kind: 'absent' }, issues: [] }
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateMatch !== null && isValidDateMatch(dateMatch)) {
    return { value: { kind: 'date', value }, issues: [] }
  }

  const dateTimeMatch =
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})?$/.exec(
      value,
    )
  if (dateTimeMatch !== null && isValidDateTimeMatch(dateTimeMatch)) {
    return {
      value: { kind: 'date-time', value: value.replace(' ', 'T') },
      issues: [],
    }
  }

  return invalidDate(rawValue, field, rowNumber)
}

function invalidDate(
  rawValue: unknown,
  field: 'INICIO' | 'FIM',
  rowNumber: number,
): NormalizedDate {
  return {
    value: { kind: 'invalid', value: rawValue },
    issues: [
      {
        kind: 'invalid_value',
        severity: 'error',
        code: 'invalid_date',
        message: `${field} não possui uma representação técnica de data reconhecida.`,
        field,
        rowNumber,
        value: rawValue,
      },
    ],
  }
}

function isValidDateMatch(match: RegExpExecArray): boolean {
  return isValidCalendarDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  )
}

function isValidDateTimeMatch(match: RegExpExecArray): boolean {
  const dateIsValid = isValidCalendarDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  )
  const timeIsValid =
    Number(match[4]) <= 23 &&
    Number(match[5]) <= 59 &&
    (match[6] === undefined || Number(match[6]) <= 59)
  const offset = match[8]
  const offsetIsValid =
    offset === undefined || offset === 'Z' || isValidOffset(offset)

  return dateIsValid && timeIsValid && offsetIsValid
}

function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (month < 1 || month > 12 || day < 1) {
    return false
  }

  const daysByMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]
  return day <= (daysByMonth[month - 1] ?? 0)
}

function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)
}

function isValidOffset(offset: string): boolean {
  const match = /^[+-](\d{2}):(\d{2})$/.exec(offset)
  return match !== null && Number(match[1]) <= 23 && Number(match[2]) <= 59
}

function normalizeTransportMode(
  rawValue: unknown,
  rowNumber: number,
): NormalizedTransportMode {
  const normalizedText = normalizeText(rawValue, 'MODAL', rowNumber)

  if (normalizedText.state !== 'value') {
    return {
      value: { kind: 'absent' },
      issues: normalizedText.issues,
    }
  }

  if (normalizedText.value === 'AEREO' || normalizedText.value === 'MARITIMO') {
    return {
      value: { kind: 'known', value: normalizedText.value },
      issues: [],
    }
  }

  return {
    value: { kind: 'unknown', value: normalizedText.value },
    issues: [
      {
        kind: 'unknown_value',
        severity: 'warning',
        code: 'unknown_transport_mode',
        message: 'MODAL possui um valor ainda não reconhecido no eComex.',
        field: 'MODAL',
        rowNumber,
        value: normalizedText.value,
      },
    ],
  }
}
