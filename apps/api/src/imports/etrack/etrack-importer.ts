import {
  ETRACK_REQUIRED_HEADERS,
  ETRACK_SOURCE,
  type ETrackDateValue,
  type ETrackHeaderValidationResult,
  type ETrackImportIssue,
  type ETrackRowImportResult,
  type ETrackRowInput,
  type ETrackTransportModeValue,
} from './etrack-contract'

type NormalizedText =
  | {
      readonly state: 'absent' | 'invalid'
      readonly value: undefined
      readonly issues: readonly ETrackImportIssue[]
    }
  | {
      readonly state: 'value'
      readonly value: string
      readonly issues: readonly ETrackImportIssue[]
    }

interface NormalizedDate {
  readonly value: ETrackDateValue
  readonly issues: readonly ETrackImportIssue[]
}

interface NormalizedTransportMode {
  readonly value: ETrackTransportModeValue
  readonly issues: readonly ETrackImportIssue[]
}

export function validateETrackHeaders(
  headers: readonly unknown[],
): ETrackHeaderValidationResult {
  const structuralIssues: readonly ETrackImportIssue[] =
    headers.length === 0
      ? [
          {
            kind: 'structural_error',
            severity: 'error',
            code: 'empty_header_set',
            message: 'O conjunto de cabeçalhos do eTrack está vazio.',
          },
        ]
      : []

  const invalidHeaderIssues = headers.flatMap<ETrackImportIssue>((header) =>
    typeof header === 'string'
      ? []
      : [
          {
            kind: 'header_error',
            severity: 'error',
            code: 'invalid_header',
            message: 'O cabeçalho do eTrack deve ser texto.',
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

  const requiredHeaderIssues =
    ETRACK_REQUIRED_HEADERS.flatMap<ETrackImportIssue>((requiredHeader) => {
      const count = headerCounts.get(requiredHeader) ?? 0

      if (count === 0) {
        return [
          {
            kind: 'header_error',
            severity: 'error',
            code: 'missing_required_header',
            message: `Cabeçalho obrigatório ausente: ${requiredHeader}.`,
            field: requiredHeader,
          },
        ]
      }

      if (count > 1) {
        return [
          {
            kind: 'header_error',
            severity: 'error',
            code: 'duplicate_header',
            message: `Cabeçalho duplicado: ${requiredHeader}.`,
            field: requiredHeader,
          },
        ]
      }

      return []
    })

  return {
    source: ETRACK_SOURCE,
    issues: [
      ...structuralIssues,
      ...invalidHeaderIssues,
      ...requiredHeaderIssues,
    ],
  }
}

export function importETrackRow(input: ETrackRowInput): ETrackRowImportResult {
  const processNumber = normalizeText(
    input.rawData['Numero do Processo'],
    'Numero do Processo',
    input.rowNumber,
  )
  const customerReference = normalizeText(
    input.rawData['Referencia Cliente'],
    'Referencia Cliente',
    input.rowNumber,
  )
  const estimatedArrival = normalizeDate(
    input.rawData['Data da Previsão de Chegada'],
    'Data da Previsão de Chegada',
    input.rowNumber,
  )
  const arrival = normalizeDate(
    input.rawData['Data Chegada'],
    'Data Chegada',
    input.rowNumber,
  )
  const transportMode = normalizeTransportMode(
    input.rawData['Via Transporte'],
    input.rowNumber,
  )
  const registrationDate = normalizeDate(
    input.rawData['Data Registro'],
    'Data Registro',
    input.rowNumber,
  )
  const mercanteNumber = normalizeText(
    input.rawData['Nº CE MERCANTE'],
    'Nº CE MERCANTE',
    input.rowNumber,
  )
  const originalDate = normalizeDate(
    input.rawData['Datas Originais'],
    'Datas Originais',
    input.rowNumber,
  )
  const notes = normalizeObservation(
    input.rawData['Observações'],
    input.rowNumber,
  )
  const house = normalizeText(input.rawData.House, 'House', input.rowNumber)
  const master = normalizeText(input.rawData.Master, 'Master', input.rowNumber)
  const agent = normalizeText(input.rawData.Agente, 'Agente', input.rowNumber)
  const billingDate = normalizeDate(
    input.rawData['Data do Faturamento'],
    'Data do Faturamento',
    input.rowNumber,
  )

  const metadataIssues = validateTrace(input)
  const requiredValueIssues: readonly ETrackImportIssue[] =
    processNumber.state === 'absent'
      ? [
          {
            kind: 'row_error',
            severity: 'error',
            code: 'missing_required_value',
            message: 'Numero do Processo está vazio.',
            field: 'Numero do Processo',
            rowNumber: input.rowNumber,
          },
        ]
      : []

  return {
    trace: {
      source: ETRACK_SOURCE,
      sourceVersion: input.sourceVersion,
      rowNumber: input.rowNumber,
    },
    rawData: { ...input.rawData },
    normalizedData: {
      processNumber: processNumber.value,
      customerReference: customerReference.value,
      estimatedArrival: estimatedArrival.value,
      arrival: arrival.value,
      transportMode: transportMode.value,
      registrationDate: registrationDate.value,
      mercanteNumber: mercanteNumber.value,
      originalDate: originalDate.value,
      notes: notes.value,
      house: house.value,
      master: master.value,
      agent: agent.value,
      billingDate: billingDate.value,
    },
    issues: [
      ...metadataIssues,
      ...processNumber.issues,
      ...requiredValueIssues,
      ...customerReference.issues,
      ...estimatedArrival.issues,
      ...arrival.issues,
      ...transportMode.issues,
      ...registrationDate.issues,
      ...mercanteNumber.issues,
      ...originalDate.issues,
      ...notes.issues,
      ...house.issues,
      ...master.issues,
      ...agent.issues,
      ...billingDate.issues,
    ],
  }
}

function validateTrace(input: ETrackRowInput): readonly ETrackImportIssue[] {
  const sourceVersionIssues: readonly ETrackImportIssue[] =
    input.sourceVersion.trim().length === 0
      ? [
          {
            kind: 'structural_error',
            severity: 'error',
            code: 'missing_source_version',
            message: 'A versão da fonte eTrack deve ser informada.',
          },
        ]
      : []
  const rowNumberIssues: readonly ETrackImportIssue[] =
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

function normalizeObservation(
  rawValue: unknown,
  rowNumber: number,
): NormalizedText {
  if (typeof rawValue !== 'string') {
    return normalizeText(rawValue, 'Observações', rowNumber)
  }

  return rawValue.trim().length === 0
    ? { state: 'absent', value: undefined, issues: [] }
    : { state: 'value', value: rawValue, issues: [] }
}

function normalizeDate(
  rawValue: unknown,
  field: string,
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
  field: string,
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
  const normalizedText = normalizeText(rawValue, 'Via Transporte', rowNumber)

  if (normalizedText.state !== 'value') {
    return {
      value: { kind: 'absent' },
      issues: normalizedText.issues,
    }
  }

  if (normalizedText.value === 'Aérea' || normalizedText.value === 'Marítima') {
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
        message: 'Via Transporte possui um valor ainda não reconhecido.',
        field: 'Via Transporte',
        rowNumber,
        value: normalizedText.value,
      },
    ],
  }
}
