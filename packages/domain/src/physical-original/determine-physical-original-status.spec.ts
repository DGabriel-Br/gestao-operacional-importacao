import { describe, expect, it } from 'vitest'
import type { CivilDate } from '../civil-date.js'
import {
  determinePhysicalOriginalApplicability,
  determinePhysicalOriginalStatus,
  type PhysicalOriginalFacts,
  type PhysicalOriginalStatus,
} from './determine-physical-original-status.js'
import { recognizePhysicalOriginalEvidence } from './recognize-physical-original-evidence.js'

const evaluationDate = civilDate(2026, 9, 27)
const receivedEvidence = recognizePhysicalOriginalEvidence('Originais OK')
const unidentifiedEvidence = recognizePhysicalOriginalEvidence(
  'Sem evidência física reconhecida',
)

function civilDate(year: number, month: number, day: number): CivilDate {
  return { year, month, day }
}

function facts(
  overrides: Partial<PhysicalOriginalFacts> = {},
): PhysicalOriginalFacts {
  return {
    transportMode: 'maritime',
    hasHouseReference: false,
    hasCargoAgent: true,
    recognizedEvidence: unidentifiedEvidence,
    hasOriginalReceiptDate: false,
    hasOpenPhysicalOriginalDeviation: false,
    estimatedArrivalDate: civilDate(2026, 10, 4),
    evaluationDate,
    ...overrides,
  }
}

function expectStatus(
  input: PhysicalOriginalFacts,
  status: PhysicalOriginalStatus,
  reasonCode: ReturnType<typeof determinePhysicalOriginalStatus>['reasonCode'],
): void {
  const result = determinePhysicalOriginalStatus(input)

  expect(result.status).toBe(status)
  expect(result.reasonCode).toBe(reasonCode)
  expect(result.evaluatedFacts).toEqual(input)
}

describe('physical original applicability', () => {
  it.each(['maritime', 'air'] as const)(
    'applies to a regular %s process',
    (transportMode) => {
      const input = {
        transportMode,
        hasHouseReference: false,
        hasCargoAgent: false,
      } as const

      expect(determinePhysicalOriginalApplicability(input)).toEqual({
        applicability: 'APPLICABLE',
        reasonCode: 'PHYSICAL_ORIGINAL_APPLICABLE',
        evaluatedFacts: input,
        issues: [],
      })
    },
  )

  it('matches the legacy FEDEX exception only for air with House and without cargo agent', () => {
    const input = {
      transportMode: 'air',
      hasHouseReference: true,
      hasCargoAgent: false,
    } as const

    expect(determinePhysicalOriginalApplicability(input)).toEqual({
      applicability: 'NOT_APPLICABLE',
      reasonCode: 'LEGACY_FEDEX_EXCEPTION_MATCHED',
      evaluatedFacts: input,
      issues: [],
    })
  })

  it.each([
    ['air without House and without agent', 'air', false, false],
    ['air with House and agent', 'air', true, true],
    ['maritime with House and without agent', 'maritime', true, false],
  ] as const)(
    'does not infer the legacy FEDEX exception for %s',
    (_description, transportMode, hasHouseReference, hasCargoAgent) => {
      expect(
        determinePhysicalOriginalApplicability({
          transportMode,
          hasHouseReference,
          hasCargoAgent,
        }).applicability,
      ).toBe('APPLICABLE')
    },
  )

  it.each([
    ['other', 'UNSUPPORTED_TRANSPORT_MODE_FOR_PHYSICAL_ORIGINAL'],
    ['unknown', 'UNKNOWN_TRANSPORT_MODE_FOR_PHYSICAL_ORIGINAL'],
  ] as const)(
    'keeps applicability undetermined for %s transport',
    (transportMode, issueCode) => {
      const result = determinePhysicalOriginalApplicability({
        transportMode,
        hasHouseReference: true,
        hasCargoAgent: false,
      })

      expect(result.applicability).toBe('UNDETERMINED')
      expect(result.reasonCode).toBe(
        'PHYSICAL_ORIGINAL_APPLICABILITY_UNDETERMINED',
      )
      expect(result.issues).toEqual([{ code: issueCode }])
    },
  )
})

describe('physical original receipt', () => {
  it('reports maritime receipt from Datas Originais without an open deviation', () => {
    const input = facts({ hasOriginalReceiptDate: true })

    expectStatus(input, 'RECEIVED', 'PHYSICAL_ORIGINAL_RECEIVED')
    expect(
      determinePhysicalOriginalStatus(input).evidence.receiptSources,
    ).toEqual(['ORIGINAL_RECEIPT_DATE'])
  })

  it('reports maritime receipt from Originais OK without Datas Originais', () => {
    const input = facts({ recognizedEvidence: receivedEvidence })

    expectStatus(input, 'RECEIVED', 'PHYSICAL_ORIGINAL_RECEIVED')
    expect(
      determinePhysicalOriginalStatus(input).evidence.receiptSources,
    ).toEqual(['OBSERVATION'])
  })

  it('preserves both independent receipt sources when they coexist', () => {
    const input = facts({
      recognizedEvidence: receivedEvidence,
      hasOriginalReceiptDate: true,
    })

    expect(
      determinePhysicalOriginalStatus(input).evidence.receiptSources,
    ).toEqual(['ORIGINAL_RECEIPT_DATE', 'OBSERVATION'])
  })

  it.each([
    ['Datas Originais', { hasOriginalReceiptDate: true }],
    ['Originais OK', { recognizedEvidence: receivedEvidence }],
  ] as const)(
    'preserves %s receipt with an open deviation as an inconsistency',
    (_description, receiptFacts) => {
      const input = facts({
        ...receiptFacts,
        hasOpenPhysicalOriginalDeviation: true,
      })
      const result = determinePhysicalOriginalStatus(input)

      expectStatus(
        input,
        'RECEIVED_WITH_OPEN_DEVIATION',
        'PHYSICAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION',
      )
      expect(result.issues).toEqual([
        { code: 'PHYSICAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION' },
      ])
    },
  )

  it.each([
    ['air with Datas Originais', { hasOriginalReceiptDate: true }],
    ['air with Originais OK', { recognizedEvidence: receivedEvidence }],
  ] as const)(
    'reports receipt for regular %s',
    (_description, receiptFacts) => {
      const input = facts({ transportMode: 'air', ...receiptFacts })

      expectStatus(input, 'RECEIVED', 'PHYSICAL_ORIGINAL_RECEIVED')
    },
  )

  it('keeps receipt authoritative when ETA is more than seven days away', () => {
    const input = facts({
      hasOriginalReceiptDate: true,
      estimatedArrivalDate: civilDate(2026, 10, 20),
    })

    expectStatus(input, 'RECEIVED', 'PHYSICAL_ORIGINAL_RECEIVED')
  })

  it.each([
    [false, 'RECEIVED', 'PHYSICAL_ORIGINAL_RECEIVED'],
    [
      true,
      'RECEIVED_WITH_OPEN_DEVIATION',
      'PHYSICAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION',
    ],
  ] as const)(
    'keeps receipt authoritative for an overdue ETA when open deviation is %s',
    (hasOpenPhysicalOriginalDeviation, status, reasonCode) => {
      const input = facts({
        hasOriginalReceiptDate: true,
        hasOpenPhysicalOriginalDeviation,
        estimatedArrivalDate: civilDate(2026, 9, 26),
      })

      expectStatus(input, status, reasonCode)
    },
  )

  it('does not use Original digitalizado OK as physical receipt evidence', () => {
    const input = facts({
      recognizedEvidence: recognizePhysicalOriginalEvidence(
        'Original digitalizado OK',
      ),
      estimatedArrivalDate: undefined,
    })

    expectStatus(input, 'UNIDENTIFIED', 'PHYSICAL_ORIGINAL_ETA_ABSENT')
    expect(
      determinePhysicalOriginalStatus(input).evidence.receiptSources,
    ).toEqual([])
  })
})

describe('legacy FEDEX exception precedence', () => {
  it.each([
    ['Datas Originais', { hasOriginalReceiptDate: true }],
    ['Originais OK', { recognizedEvidence: receivedEvidence }],
  ] as const)(
    'keeps the exception not applicable even with %s receipt evidence',
    (_description, receiptFacts) => {
      const input = facts({
        transportMode: 'air',
        hasHouseReference: true,
        hasCargoAgent: false,
        ...receiptFacts,
      })

      expectStatus(input, 'NOT_APPLICABLE', 'LEGACY_FEDEX_EXCEPTION_MATCHED')
    },
  )

  it('keeps the legacy exception ahead of an overdue ETA', () => {
    const input = facts({
      transportMode: 'air',
      hasHouseReference: true,
      hasCargoAgent: false,
      estimatedArrivalDate: civilDate(2026, 9, 7),
      hasOpenPhysicalOriginalDeviation: true,
    })

    expectStatus(input, 'NOT_APPLICABLE', 'LEGACY_FEDEX_EXCEPTION_MATCHED')
  })
})

describe('physical original upper-bound-only seven-day window', () => {
  it('awaits the physical original inside the window with an open deviation', () => {
    const input = facts({ hasOpenPhysicalOriginalDeviation: true })

    expectStatus(
      input,
      'AWAITING',
      'PHYSICAL_ORIGINAL_AWAITING_WITH_OPEN_DEVIATION',
    )
  })

  it('reports pending without an open deviation inside the window', () => {
    const input = facts()
    const result = determinePhysicalOriginalStatus(input)

    expectStatus(
      input,
      'PENDING_WITHOUT_OPEN_DEVIATION',
      'PHYSICAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION',
    )
    expect(result.issues).toEqual([
      { code: 'PHYSICAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION' },
    ])
  })

  it.each([
    ['the evaluation date', evaluationDate, evaluationDate, 0],
    ['exactly seven days', evaluationDate, civilDate(2026, 10, 4)],
    ['a month boundary', civilDate(2026, 1, 29), civilDate(2026, 2, 5), 7],
    ['a year boundary', civilDate(2025, 12, 29), civilDate(2026, 1, 5), 7],
  ] as const)(
    'includes %s in the seven-day window',
    (
      _description,
      caseEvaluationDate,
      estimatedArrivalDate,
      expectedDifference = 7,
    ) => {
      const input = facts({
        evaluationDate: caseEvaluationDate,
        estimatedArrivalDate,
        hasOpenPhysicalOriginalDeviation: true,
      })
      const result = determinePhysicalOriginalStatus(input)

      expect(result.status).toBe('AWAITING')
      expect(result.evidence.etaDayDifference).toBe(expectedDifference)
    },
  )

  it.each([false, true])(
    'keeps ETA beyond seven days unidentified when deviation presence is %s',
    (hasOpenPhysicalOriginalDeviation) => {
      const input = facts({
        estimatedArrivalDate: civilDate(2026, 10, 5),
        hasOpenPhysicalOriginalDeviation,
      })

      expectStatus(
        input,
        'UNIDENTIFIED',
        'PHYSICAL_ORIGINAL_ETA_OUTSIDE_SEVEN_DAY_WINDOW',
      )
    },
  )

  it('keeps an absent ETA unidentified without receipt evidence', () => {
    const input = facts({ estimatedArrivalDate: undefined })

    expectStatus(input, 'UNIDENTIFIED', 'PHYSICAL_ORIGINAL_ETA_ABSENT')
  })

  it.each([
    [
      'yesterday with an open deviation',
      civilDate(2026, 9, 26),
      true,
      'AWAITING',
      'PHYSICAL_ORIGINAL_AWAITING_WITH_OPEN_DEVIATION',
      -1,
    ],
    [
      'yesterday without an open deviation',
      civilDate(2026, 9, 26),
      false,
      'PENDING_WITHOUT_OPEN_DEVIATION',
      'PHYSICAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION',
      -1,
    ],
    [
      'twenty days overdue with an open deviation',
      civilDate(2026, 9, 7),
      true,
      'AWAITING',
      'PHYSICAL_ORIGINAL_AWAITING_WITH_OPEN_DEVIATION',
      -20,
    ],
    [
      'twenty days overdue without an open deviation',
      civilDate(2026, 9, 7),
      false,
      'PENDING_WITHOUT_OPEN_DEVIATION',
      'PHYSICAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION',
      -20,
    ],
  ] as const)(
    'includes %s in the legacy upper-bound-only window',
    (
      _description,
      estimatedArrivalDate,
      hasOpenPhysicalOriginalDeviation,
      status,
      reasonCode,
      expectedDifference,
    ) => {
      const input = facts({
        estimatedArrivalDate,
        hasOpenPhysicalOriginalDeviation,
      })
      const result = determinePhysicalOriginalStatus(input)

      expectStatus(input, status, reasonCode)
      expect(result.evidence.etaDayDifference).toBe(expectedDifference)
    },
  )
})

describe('physical original undetermined applicability', () => {
  it.each(['other', 'unknown'] as const)(
    'does not infer applicability for %s transport',
    (transportMode) => {
      const input = facts({
        transportMode,
        hasOriginalReceiptDate: true,
      })

      expectStatus(
        input,
        'UNIDENTIFIED',
        'PHYSICAL_ORIGINAL_APPLICABILITY_UNDETERMINED',
      )
    },
  )
})
