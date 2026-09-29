import { describe, expect, it } from 'vitest'
import type { CivilDate } from '../civil-date.js'
import {
  determineMercanteStatus,
  type MercanteFacts,
  type MercanteReasonCode,
  type MercanteStatus,
} from './determine-mercante-status.js'
import { recognizeMercanteEvidence } from './recognize-mercante-evidence.js'

const evaluationDate = civilDate(2026, 9, 27)
const noEvidence = recognizeMercanteEvidence('Sem evidência de Mercante')
const pendingEvidence = recognizeMercanteEvidence('Pendência no Mercante')
const checkedEvidence = recognizeMercanteEvidence(
  'Mercante conferido com BL e sistema',
)
const openedEvidence = recognizeMercanteEvidence('Mercante aberto')

function civilDate(year: number, month: number, day: number): CivilDate {
  return { year, month, day }
}

function facts(overrides: Partial<MercanteFacts> = {}): MercanteFacts {
  return {
    transportMode: 'maritime',
    hasMercanteReference: true,
    recognizedEvidence: noEvidence,
    estimatedArrivalDate: undefined,
    evaluationDate,
    digitalOriginalStatus: 'RECEIVED',
    ...overrides,
  }
}

function expectStatus(
  input: MercanteFacts,
  status: MercanteStatus,
  reasonCode: MercanteReasonCode,
): void {
  const result = determineMercanteStatus(input)

  expect(result.status).toBe(status)
  expect(result.reasonCode).toBe(reasonCode)
  expect(result.evaluatedFacts).toEqual(input)
  expect(result.recognizedEvidence).toEqual(input.recognizedEvidence)
}

describe('Mercante applicability', () => {
  it.each(['air', 'other'] as const)(
    'does not apply to %s transport',
    (transportMode) => {
      const input = facts({
        transportMode,
        recognizedEvidence: pendingEvidence,
      })

      expectStatus(input, 'NOT_APPLICABLE', 'MERCANTE_NOT_APPLICABLE')
      expect(determineMercanteStatus(input).issues).toEqual([])
    },
  )

  it('keeps applicability indeterminate for unknown transport', () => {
    const input = facts({
      transportMode: 'unknown',
      recognizedEvidence: checkedEvidence,
    })

    expectStatus(input, 'UNIDENTIFIED', 'MERCANTE_APPLICABILITY_UNDETERMINED')
    expect(determineMercanteStatus(input).issues).toEqual([
      { code: 'UNKNOWN_TRANSPORT_MODE_FOR_MERCANTE' },
    ])
  })
})

describe('Mercante definitive textual evidence precedence', () => {
  it('reports a maritime pending Mercante', () => {
    const input = facts({ recognizedEvidence: pendingEvidence })

    expectStatus(input, 'PENDING', 'MERCANTE_PENDING_EVIDENCE_LATEST')
  })

  it('reports a maritime checked Mercante', () => {
    const input = facts({ recognizedEvidence: checkedEvidence })

    expectStatus(input, 'CHECKED', 'MERCANTE_CHECKED_EVIDENCE_LATEST')
  })

  it.each([
    [
      'Pendência no Mercante // Mercante conferido com BL e sistema',
      'CHECKED',
      'MERCANTE_CHECKED_EVIDENCE_LATEST',
    ],
    [
      'Mercante conferido com BL e sistema // Pendência no Mercante',
      'PENDING',
      'MERCANTE_PENDING_EVIDENCE_LATEST',
    ],
  ] as const)(
    'preserves the latest definitive evidence from %s',
    (observation, status, reasonCode) => {
      const input = facts({
        recognizedEvidence: recognizeMercanteEvidence(observation),
      })

      expectStatus(input, status, reasonCode)
    },
  )

  it.each([
    [
      'pending with overdue ETA and received BL',
      pendingEvidence,
      civilDate(2026, 9, 7),
      'RECEIVED',
      'PENDING',
      'MERCANTE_PENDING_EVIDENCE_LATEST',
    ],
    [
      'checked with overdue ETA and pending BL',
      checkedEvidence,
      civilDate(2026, 9, 7),
      'AWAITING',
      'CHECKED',
      'MERCANTE_CHECKED_EVIDENCE_LATEST',
    ],
  ] as const)(
    'keeps %s ahead of ETA and digital original',
    (
      _description,
      recognizedEvidence,
      estimatedArrivalDate,
      digitalOriginalStatus,
      status,
      reasonCode,
    ) => {
      const input = facts({
        hasMercanteReference: false,
        recognizedEvidence,
        estimatedArrivalDate,
        digitalOriginalStatus,
      })

      expectStatus(input, status, reasonCode)
    },
  )
})

describe('Mercante existence and digital original projection', () => {
  it.each([
    ['Mercante reference', noEvidence],
    ['Mercante opened evidence', openedEvidence],
    [
      'Mercante available evidence',
      recognizeMercanteEvidence('Mercante disponível'),
    ],
    [
      'Mercante consulted evidence',
      recognizeMercanteEvidence('Mercante consultado'),
    ],
  ] as const)(
    'is ready to check from %s when the digital original is available',
    (_description, recognizedEvidence) => {
      const input = facts({
        hasMercanteReference: recognizedEvidence === noEvidence,
        recognizedEvidence,
      })
      const result = determineMercanteStatus(input)

      expectStatus(input, 'READY_TO_CHECK', 'MERCANTE_READY_TO_CHECK')
      expect(result.evidence.mercanteExists).toBe(true)
      expect(result.evidence.digitalOriginalAvailability).toBe('AVAILABLE')
    },
  )

  it('does not treat a Mercante reference as checked', () => {
    const input = facts({ hasMercanteReference: true })

    expect(determineMercanteStatus(input).status).toBe('READY_TO_CHECK')
    expect(determineMercanteStatus(input).status).not.toBe('CHECKED')
  })

  it('does not treat opened Mercante evidence as checked', () => {
    const input = facts({
      hasMercanteReference: false,
      recognizedEvidence: openedEvidence,
    })

    expect(determineMercanteStatus(input).status).toBe('READY_TO_CHECK')
    expect(determineMercanteStatus(input).status).not.toBe('CHECKED')
  })

  it.each([
    ['RECEIVED', 'READY_TO_CHECK', 'MERCANTE_READY_TO_CHECK'],
    [
      'RECEIVED_WITH_OPEN_DEVIATION',
      'READY_TO_CHECK',
      'MERCANTE_READY_TO_CHECK',
    ],
    [
      'AWAITING',
      'AWAITING_DIGITAL_ORIGINAL',
      'MERCANTE_AWAITING_DIGITAL_ORIGINAL',
    ],
    [
      'PENDING_WITHOUT_OPEN_DEVIATION',
      'AWAITING_DIGITAL_ORIGINAL',
      'MERCANTE_AWAITING_DIGITAL_ORIGINAL',
    ],
  ] as const)(
    'projects digital original %s to Mercante status %s',
    (digitalOriginalStatus, status, reasonCode) => {
      const input = facts({ digitalOriginalStatus })

      expectStatus(input, status, reasonCode)
    },
  )

  it('requires verification when the digital original is unidentified', () => {
    const input = facts({ digitalOriginalStatus: 'UNIDENTIFIED' })

    expectStatus(input, 'VERIFY', 'MERCANTE_REQUIRES_VERIFICATION')
    expect(determineMercanteStatus(input).issues).toEqual([
      { code: 'DIGITAL_ORIGINAL_UNIDENTIFIED_FOR_MERCANTE' },
    ])
  })

  it('preserves an inconsistent not-applicable digital original for maritime Mercante', () => {
    const input = facts({ digitalOriginalStatus: 'NOT_APPLICABLE' })

    expectStatus(input, 'VERIFY', 'MERCANTE_REQUIRES_VERIFICATION')
    expect(determineMercanteStatus(input).issues).toEqual([
      { code: 'DIGITAL_ORIGINAL_NOT_APPLICABLE_FOR_MARITIME_MERCANTE' },
    ])
  })
})

describe('missing Mercante signed ETA window', () => {
  it.each([
    ['ETA today', evaluationDate, 0],
    ['ETA in seven days', civilDate(2026, 10, 4), 7],
  ] as const)(
    'reports missing within seven days for %s',
    (_description, estimatedArrivalDate, expectedDifference) => {
      const input = facts({
        hasMercanteReference: false,
        estimatedArrivalDate,
      })
      const result = determineMercanteStatus(input)

      expectStatus(
        input,
        'MISSING_WITHIN_SEVEN_DAYS',
        'MERCANTE_MISSING_WITHIN_SEVEN_DAYS',
      )
      expect(result.evidence.etaDayDifference).toBe(expectedDifference)
      expect(result.evidence.mercanteExists).toBe(false)
    },
  )

  it.each([
    ['ETA twenty days overdue', civilDate(2026, 9, 7), -20],
    ['ETA yesterday', civilDate(2026, 9, 26), -1],
    ['ETA in eight days', civilDate(2026, 10, 5), 8],
  ] as const)(
    'awaits opening for %s',
    (_description, estimatedArrivalDate, expectedDifference) => {
      const input = facts({
        hasMercanteReference: false,
        estimatedArrivalDate,
      })

      expectStatus(input, 'AWAITING_OPENING', 'MERCANTE_AWAITING_OPENING')
      expect(determineMercanteStatus(input).evidence.etaDayDifference).toBe(
        expectedDifference,
      )
    },
  )

  it('awaits opening when ETA is absent', () => {
    const input = facts({
      hasMercanteReference: false,
      estimatedArrivalDate: undefined,
    })

    expectStatus(input, 'AWAITING_OPENING', 'MERCANTE_AWAITING_OPENING')
    expect(
      determineMercanteStatus(input).evidence.etaDayDifference,
    ).toBeUndefined()
  })

  it.each([
    [civilDate(2026, 1, 29), civilDate(2026, 2, 5)],
    [civilDate(2025, 12, 29), civilDate(2026, 1, 5)],
  ] as const)(
    'uses calendar days across evaluation %o and ETA %o',
    (caseEvaluationDate, estimatedArrivalDate) => {
      const input = facts({
        hasMercanteReference: false,
        evaluationDate: caseEvaluationDate,
        estimatedArrivalDate,
      })

      expectStatus(
        input,
        'MISSING_WITHIN_SEVEN_DAYS',
        'MERCANTE_MISSING_WITHIN_SEVEN_DAYS',
      )
    },
  )
})
