/** A valid Gregorian calendar date supplied by a trusted domain boundary. */
export interface CivilDate {
  readonly year: number
  readonly month: number
  readonly day: number
}

/** Returns `date - referenceDate` in Gregorian calendar days. */
export function differenceInCivilDays(
  date: CivilDate,
  referenceDate: CivilDate,
): number {
  return toGregorianOrdinal(date) - toGregorianOrdinal(referenceDate)
}

function toGregorianOrdinal(date: CivilDate): number {
  const completedYears = date.year - 1

  return (
    completedYears * 365 +
    Math.floor(completedYears / 4) -
    Math.floor(completedYears / 100) +
    Math.floor(completedYears / 400) +
    daysBeforeMonth(date) +
    date.day
  )
}

function daysBeforeMonth(date: CivilDate): number {
  const baseDays = Math.floor((367 * date.month - 362) / 12)

  if (date.month <= 2) {
    return baseDays
  }

  return baseDays + (isGregorianLeapYear(date.year) ? -1 : -2)
}

function isGregorianLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}
