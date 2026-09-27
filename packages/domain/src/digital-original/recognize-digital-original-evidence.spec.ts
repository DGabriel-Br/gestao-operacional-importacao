import { describe, expect, it } from 'vitest'
import {
  LEGACY_DIGITAL_ORIGINAL_EVIDENCE_CATALOG,
  recognizeDigitalOriginalEvidence,
  type DigitalOriginalEvidence,
} from './recognize-digital-original-evidence.js'

function expectEvidence(
  observation: string,
  expectedEvidence: Extract<
    DigitalOriginalEvidence,
    { recognized: true }
  >['evidence'],
  expectedConfiguredText: string,
): void {
  const result = recognizeDigitalOriginalEvidence(observation)

  expect(result.recognized).toBe(true)
  expect(result.evidence).toBe(expectedEvidence)
  expect(result.reasonCode).toBe('DIGITAL_ORIGINAL_EVIDENCE_RECOGNIZED')
  expect(result.matchedEvidence?.configuredText).toBe(expectedConfiguredText)
  expect(result.issues).toEqual([])
}

describe('digital original evidence recognition', () => {
  it('keeps exactly the three characterized evidence texts', () => {
    expect(LEGACY_DIGITAL_ORIGINAL_EVIDENCE_CATALOG).toEqual([
      {
        evidence: 'AWAITING',
        configuredText: 'Aguardando envio do BL original digitalizado',
      },
      {
        evidence: 'RECEIVED',
        configuredText: 'Original digitalizado OK',
      },
      {
        evidence: 'RECEIVED',
        configuredText: 'Originais OK',
      },
    ])
  })

  it.each([
    ['Original digitalizado OK', 'Original digitalizado OK'],
    ['Originais OK', 'Originais OK'],
  ] as const)(
    'recognizes received evidence from %s',
    (observation, configuredText) => {
      expectEvidence(observation, 'RECEIVED', configuredText)
    },
  )

  it('recognizes awaiting evidence', () => {
    expectEvidence(
      'Aguardando envio do BL original digitalizado',
      'AWAITING',
      'Aguardando envio do BL original digitalizado',
    )
  })

  it.each([
    'ORIGINAL DIGITALIZADO OK',
    'Óriginal digitalizado OK',
    'Original, digitalizado: OK',
    '  Original    digitalizado   OK  ',
    'Original\u00a0digitalizado\u00a0OK',
    'Status anterior // Original digitalizado OK // próximo passo',
  ])('recognizes only the characterized normalization in %s', (observation) => {
    expectEvidence(observation, 'RECEIVED', 'Original digitalizado OK')
  })

  it('selects received evidence when it appears after awaiting evidence', () => {
    const result = recognizeDigitalOriginalEvidence(
      'Aguardando envio do BL original digitalizado // Original digitalizado OK',
    )

    expect(result.evidence).toBe('RECEIVED')
    expect(result.normalizedStartPosition).toBe(46)
  })

  it('selects awaiting evidence when it appears after received evidence', () => {
    const result = recognizeDigitalOriginalEvidence(
      'Original digitalizado OK // Aguardando envio do BL original digitalizado',
    )

    expect(result.evidence).toBe('AWAITING')
    expect(result.normalizedStartPosition).toBe(26)
  })

  it('selects Originais OK when it appears after awaiting evidence', () => {
    expect(
      recognizeDigitalOriginalEvidence(
        'Aguardando envio do BL original digitalizado // Originais OK',
      ).evidence,
    ).toBe('RECEIVED')
  })

  it('selects awaiting evidence when it appears after Originais OK', () => {
    expect(
      recognizeDigitalOriginalEvidence(
        'Originais OK // Aguardando envio do BL original digitalizado',
      ).evidence,
    ).toBe('AWAITING')
  })

  it('uses the last occurrence of a repeated evidence family', () => {
    const result = recognizeDigitalOriginalEvidence(
      'Original digitalizado OK // Aguardando envio do BL original digitalizado // Original digitalizado OK',
    )

    expect(result.evidence).toBe('RECEIVED')
    expect(result.normalizedStartPosition).toBe(71)
  })

  it.each([
    'Original digitalizado',
    'Aguardando envio do BL original',
    'OK digitalizado original',
  ])(
    'does not over-recognize incomplete or reordered text: %s',
    (observation) => {
      expect(recognizeDigitalOriginalEvidence(observation)).toEqual({
        recognized: false,
        evidence: 'UNIDENTIFIED',
        reasonCode: 'NO_KNOWN_DIGITAL_ORIGINAL_EVIDENCE',
        matchedEvidence: undefined,
        normalizedStartPosition: undefined,
        issues: [],
      })
    },
  )

  it('characterizes CLEAN removing a line break without adding a space', () => {
    expect(
      recognizeDigitalOriginalEvidence('Original\ndigitalizado OK').evidence,
    ).toBe('UNIDENTIFIED')
  })

  it('distinguishes an absent observation', () => {
    expect(recognizeDigitalOriginalEvidence(undefined).reasonCode).toBe(
      'OBSERVATION_ABSENT',
    )
  })

  it('distinguishes an empty observation', () => {
    expect(recognizeDigitalOriginalEvidence('').reasonCode).toBe(
      'OBSERVATION_EMPTY',
    )
  })

  it('distinguishes an observation containing only spaces', () => {
    expect(recognizeDigitalOriginalEvidence('  \t  ').reasonCode).toBe(
      'OBSERVATION_BLANK',
    )
  })
})
