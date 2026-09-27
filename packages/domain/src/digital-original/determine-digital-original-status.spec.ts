import { describe, expect, it } from 'vitest'
import {
  determineDigitalOriginalStatus,
  type DigitalOriginalDecision,
  type DigitalOriginalFacts,
  type DigitalOriginalReasonCode,
  type DigitalOriginalStatus,
} from './determine-digital-original-status.js'
import {
  recognizeDigitalOriginalEvidence,
  type DigitalOriginalEvidence,
} from './recognize-digital-original-evidence.js'

const receivedEvidence = recognizeDigitalOriginalEvidence(
  'Original digitalizado OK',
)
const awaitingEvidence = recognizeDigitalOriginalEvidence(
  'Aguardando envio do BL original digitalizado',
)
const unidentifiedEvidence = recognizeDigitalOriginalEvidence(
  'Sem informação documental reconhecida',
)

function facts(
  overrides: Partial<DigitalOriginalFacts> = {},
): DigitalOriginalFacts {
  return {
    transportMode: 'maritime',
    recognizedEvidence: unidentifiedEvidence,
    hasOpenDigitalOriginalDeviation: false,
    ...overrides,
  }
}

function expectDecision(
  input: DigitalOriginalFacts,
  status: DigitalOriginalStatus,
  reasonCode: DigitalOriginalReasonCode,
  issues: DigitalOriginalDecision['issues'] = [],
): void {
  expect(determineDigitalOriginalStatus(input)).toEqual({
    status,
    reasonCode,
    evaluatedFacts: input,
    recognizedEvidence: input.recognizedEvidence,
    issues,
  })
}

describe('digital original status determination for maritime transport', () => {
  it('reports a received digital original without an open related deviation', () => {
    const input = facts({ recognizedEvidence: receivedEvidence })

    expectDecision(input, 'RECEIVED', 'DIGITAL_ORIGINAL_RECEIVED')
  })

  it('awaits the digital original when evidence and open deviation agree', () => {
    const input = facts({
      recognizedEvidence: awaitingEvidence,
      hasOpenDigitalOriginalDeviation: true,
    })

    expectDecision(
      input,
      'AWAITING',
      'DIGITAL_ORIGINAL_AWAITING_WITH_OPEN_DEVIATION',
    )
  })

  it('preserves pending evidence without the expected open deviation as an inconsistency', () => {
    const input = facts({ recognizedEvidence: awaitingEvidence })

    expectDecision(
      input,
      'PENDING_WITHOUT_OPEN_DEVIATION',
      'DIGITAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION',
      [{ code: 'DIGITAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION' }],
    )
  })

  it('preserves received evidence with an open deviation as an inconsistency', () => {
    const input = facts({
      recognizedEvidence: receivedEvidence,
      hasOpenDigitalOriginalDeviation: true,
    })

    expectDecision(
      input,
      'RECEIVED_WITH_OPEN_DEVIATION',
      'DIGITAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION',
      [{ code: 'DIGITAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION' }],
    )
  })

  it.each([false, true])(
    'keeps status unidentified without textual evidence when open deviation is %s',
    (hasOpenDigitalOriginalDeviation) => {
      const input = facts({ hasOpenDigitalOriginalDeviation })

      expectDecision(
        input,
        'UNIDENTIFIED',
        'DIGITAL_ORIGINAL_EVIDENCE_NOT_IDENTIFIED',
      )
    },
  )
})

describe('digital original applicability', () => {
  it.each([
    ['air', awaitingEvidence],
    ['air', receivedEvidence],
    ['other', awaitingEvidence],
    ['other', receivedEvidence],
  ] as const)(
    'does not apply to %s transport with %s evidence',
    (transportMode, recognizedEvidence) => {
      const input = facts({
        transportMode,
        recognizedEvidence: recognizedEvidence as DigitalOriginalEvidence,
        hasOpenDigitalOriginalDeviation: true,
      })

      expectDecision(input, 'NOT_APPLICABLE', 'DIGITAL_ORIGINAL_NOT_APPLICABLE')
    },
  )

  it.each([receivedEvidence, awaitingEvidence, unidentifiedEvidence])(
    'does not assume maritime applicability for an unknown mode with %s evidence',
    (recognizedEvidence) => {
      const input = facts({ transportMode: 'unknown', recognizedEvidence })

      expectDecision(
        input,
        'UNIDENTIFIED',
        'DIGITAL_ORIGINAL_APPLICABILITY_UNDETERMINED',
        [{ code: 'UNKNOWN_TRANSPORT_MODE_FOR_DIGITAL_ORIGINAL' }],
      )
    },
  )
})
