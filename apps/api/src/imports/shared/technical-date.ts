export type TechnicalDateValue =
  | { readonly kind: 'absent' }
  | { readonly kind: 'date'; readonly value: string }
  | { readonly kind: 'date-time'; readonly value: string }
  | { readonly kind: 'invalid'; readonly value: unknown }

export function parseTechnicalIsoDate(rawValue: unknown): TechnicalDateValue {
  if (rawValue === undefined || rawValue === null) {
    return { kind: 'absent' }
  }

  if (typeof rawValue !== 'string') {
    return { kind: 'invalid', value: rawValue }
  }

  const value = rawValue.trim()
  if (value.length === 0) {
    return { kind: 'absent' }
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateMatch !== null && isValidDateMatch(dateMatch)) {
    return { kind: 'date', value }
  }

  const dateTimeMatch =
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})?$/.exec(
      value,
    )
  if (dateTimeMatch !== null && isValidDateTimeMatch(dateTimeMatch)) {
    return { kind: 'date-time', value: value.replace(' ', 'T') }
  }

  return { kind: 'invalid', value: rawValue }
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
