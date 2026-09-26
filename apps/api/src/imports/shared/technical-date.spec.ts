import { describe, expect, it } from 'vitest'
import { parseTechnicalIsoDate } from './technical-date'

describe('technical ISO date parsing', () => {
  it.each([undefined, null, '', '   '])(
    'represents %s as technical absence',
    (value) => {
      expect(parseTechnicalIsoDate(value)).toEqual({ kind: 'absent' })
    },
  )

  it.each([
    ['2026-09-26', { kind: 'date', value: '2026-09-26' }],
    [' 2024-02-29 ', { kind: 'date', value: '2024-02-29' }],
  ])('recognizes the calendar date %s', (value, expected) => {
    expect(parseTechnicalIsoDate(value)).toEqual(expected)
  })

  it.each([
    ['2026-09-26 16:20', { kind: 'date-time', value: '2026-09-26T16:20' }],
    [
      '2026-09-26T16:20:30.123456789-03:00',
      {
        kind: 'date-time',
        value: '2026-09-26T16:20:30.123456789-03:00',
      },
    ],
    [
      '2026-09-26T16:20:30Z',
      { kind: 'date-time', value: '2026-09-26T16:20:30Z' },
    ],
  ])(
    'recognizes the date-time %s without timezone conversion',
    (value, expected) => {
      expect(parseTechnicalIsoDate(value)).toEqual(expected)
    },
  )

  it.each([
    '2026-02-30',
    '2026-09-26T24:00',
    '2026-09-26T16:20:30+24:00',
    '26/09/2026',
  ])('keeps the invalid textual value %s explicit', (value) => {
    expect(parseTechnicalIsoDate(value)).toEqual({ kind: 'invalid', value })
  })

  it('keeps a non-textual value explicit without coercion', () => {
    expect(parseTechnicalIsoDate(20260926)).toEqual({
      kind: 'invalid',
      value: 20260926,
    })
  })
})
