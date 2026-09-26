import { describe, expect, it } from 'vitest'
import { differenceInCivilDays, type CivilDate } from './civil-date.js'

function civilDate(year: number, month: number, day: number): CivilDate {
  return { year, month, day }
}

describe('civil date difference', () => {
  it.each([
    [civilDate(2026, 9, 25), civilDate(2026, 9, 26), -1],
    [civilDate(2026, 9, 26), civilDate(2026, 9, 26), 0],
    [civilDate(2026, 10, 1), civilDate(2026, 9, 26), 5],
  ])(
    'returns the signed difference between %o and %o',
    (date, referenceDate, expected) => {
      expect(differenceInCivilDays(date, referenceDate)).toBe(expected)
    },
  )
})
