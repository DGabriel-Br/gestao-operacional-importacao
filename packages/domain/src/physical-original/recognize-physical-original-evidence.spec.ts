import { describe, expect, it } from 'vitest'
import {
  LEGACY_PHYSICAL_ORIGINAL_EVIDENCE_CATALOG,
  recognizePhysicalOriginalEvidence,
} from './recognize-physical-original-evidence.js'

describe('physical original evidence recognition', () => {
  it('keeps only the characterized physical receipt text', () => {
    expect(LEGACY_PHYSICAL_ORIGINAL_EVIDENCE_CATALOG).toEqual([
      {
        evidence: 'RECEIVED',
        configuredText: 'Originais OK',
      },
    ])
  })

  it('recognizes Originais OK as physical receipt evidence', () => {
    expect(recognizePhysicalOriginalEvidence('Originais OK')).toEqual({
      recognized: true,
      evidence: 'RECEIVED',
      reasonCode: 'PHYSICAL_ORIGINAL_EVIDENCE_RECOGNIZED',
      matchedEvidence: {
        configuredText: 'Originais OK',
        normalizedText: 'originais ok',
      },
      normalizedStartPosition: 1,
      issues: [],
    })
  })

  it.each([
    'ORIGINAIS OK',
    'Originais ÓK',
    'Originais, OK',
    '  Originais    OK  ',
    'Originais\u00a0OK',
    'Status anterior // Originais OK // próximo passo',
  ])('recognizes only the characterized normalization in %s', (observation) => {
    const result = recognizePhysicalOriginalEvidence(observation)

    expect(result.recognized).toBe(true)
    expect(result.evidence).toBe('RECEIVED')
  })

  it('distinguishes an absent observation', () => {
    expect(recognizePhysicalOriginalEvidence(undefined).reasonCode).toBe(
      'OBSERVATION_ABSENT',
    )
  })

  it('distinguishes an empty observation', () => {
    expect(recognizePhysicalOriginalEvidence('').reasonCode).toBe(
      'OBSERVATION_EMPTY',
    )
  })

  it('distinguishes an observation containing only spaces', () => {
    expect(recognizePhysicalOriginalEvidence('  \t  ').reasonCode).toBe(
      'OBSERVATION_BLANK',
    )
  })

  it.each([
    'Original digitalizado OK',
    'Originais',
    'OK Originais',
    'Originais recebidos OK',
    'Original\nOK',
  ])('does not over-recognize non-characterized text: %s', (observation) => {
    expect(recognizePhysicalOriginalEvidence(observation)).toEqual({
      recognized: false,
      evidence: 'UNIDENTIFIED',
      reasonCode: 'NO_KNOWN_PHYSICAL_ORIGINAL_EVIDENCE',
      matchedEvidence: undefined,
      normalizedStartPosition: undefined,
      issues: [],
    })
  })
})
