import { describe, expect, it } from 'vitest'
import {
  LEGACY_MERCANTE_EVIDENCE_CATALOG,
  recognizeMercanteEvidence,
  type MercanteEvidenceKind,
} from './recognize-mercante-evidence.js'

function expectEvidence(
  observation: string,
  expectedEvidence: Exclude<MercanteEvidenceKind, 'UNIDENTIFIED'>,
  expectedConfiguredText: string,
): void {
  const result = recognizeMercanteEvidence(observation)

  expect(result.recognized).toBe(true)
  expect(result.evidence).toBe(expectedEvidence)
  expect(result.reasonCode).toBe('MERCANTE_EVIDENCE_RECOGNIZED')
  expect(result.matchedEvidence?.configuredText).toBe(expectedConfiguredText)
  expect(result.issues).toEqual([])
}

describe('Mercante evidence catalog', () => {
  it('keeps only the five characterized texts', () => {
    expect(LEGACY_MERCANTE_EVIDENCE_CATALOG).toEqual([
      { evidence: 'PENDING', configuredText: 'Pendência no Mercante' },
      { evidence: 'CHECKED', configuredText: 'Mercante conferido com BL' },
      { evidence: 'EXISTS', configuredText: 'Mercante aberto' },
      { evidence: 'EXISTS', configuredText: 'Mercante disponível' },
      { evidence: 'EXISTS', configuredText: 'Mercante consultado' },
    ])
  })
})

describe('Mercante pending and checked evidence recognition', () => {
  it('recognizes pending evidence', () => {
    expectEvidence('Pendência no Mercante', 'PENDING', 'Pendência no Mercante')
  })

  it.each([
    'MERCANTE CONFERIDO COM BL E SISTEMA',
    'MERCANTE CONFERIDO COM BL, AGUARDANDO DIGITAÇÃO',
  ])('recognizes the characterized checked fragment in %s', (observation) => {
    expectEvidence(observation, 'CHECKED', 'Mercante conferido com BL')
  })

  it('selects checked when it follows pending', () => {
    expect(
      recognizeMercanteEvidence(
        'Pendência no Mercante // Mercante conferido com BL e sistema',
      ).evidence,
    ).toBe('CHECKED')
  })

  it('selects pending when it follows checked', () => {
    expect(
      recognizeMercanteEvidence(
        'Mercante conferido com BL e sistema // Pendência no Mercante',
      ).evidence,
    ).toBe('PENDING')
  })

  it.each([
    [
      'Pendência no Mercante // Mercante conferido com BL // Pendência no Mercante',
      'PENDING',
    ],
    [
      'Mercante conferido com BL // Pendência no Mercante // Mercante conferido com BL',
      'CHECKED',
    ],
  ] as const)(
    'uses the latest repeated definitive evidence in %s',
    (observation, expectedEvidence) => {
      expect(recognizeMercanteEvidence(observation).evidence).toBe(
        expectedEvidence,
      )
    },
  )

  it('keeps definitive evidence ahead of a later existence-only fragment', () => {
    expect(
      recognizeMercanteEvidence('Pendência no Mercante // Mercante disponível')
        .evidence,
    ).toBe('PENDING')
  })
})

describe('Mercante existence evidence recognition', () => {
  it.each([
    ['Mercante aberto', 'Mercante aberto'],
    ['Mercante disponível', 'Mercante disponível'],
    ['Mercante consultado', 'Mercante consultado'],
  ] as const)('recognizes existence from %s', (observation, configuredText) => {
    expectEvidence(observation, 'EXISTS', configuredText)
  })

  it('preserves the latest existence evidence when no definitive evidence exists', () => {
    expectEvidence(
      'Mercante aberto // Mercante consultado',
      'EXISTS',
      'Mercante consultado',
    )
  })
})

describe('Mercante evidence normalization and limits', () => {
  it.each([
    'PENDÊNCIA NO MERCANTE',
    'Pendencia no Mercante',
    'Pendência, no: Mercante',
    '  Pendência   no   Mercante  ',
    'Pendência\u00a0no\u00a0Mercante',
    'Texto anterior // Pendência no Mercante // texto posterior',
  ])('recognizes only the characterized normalization in %s', (observation) => {
    expect(recognizeMercanteEvidence(observation).evidence).toBe('PENDING')
  })

  it('distinguishes an absent observation', () => {
    expect(recognizeMercanteEvidence(undefined).reasonCode).toBe(
      'OBSERVATION_ABSENT',
    )
  })

  it('distinguishes an empty observation', () => {
    expect(recognizeMercanteEvidence('').reasonCode).toBe('OBSERVATION_EMPTY')
  })

  it('distinguishes an observation containing only spaces', () => {
    expect(recognizeMercanteEvidence('  \t  ').reasonCode).toBe(
      'OBSERVATION_BLANK',
    )
  })

  it.each([
    'Pendência Mercante',
    'Mercante conferido',
    'Conferido com BL',
    'Mercante indisponível',
    'Consulta do Mercante',
  ])('does not over-recognize non-characterized text: %s', (observation) => {
    expect(recognizeMercanteEvidence(observation)).toEqual({
      recognized: false,
      evidence: 'UNIDENTIFIED',
      reasonCode: 'NO_KNOWN_MERCANTE_EVIDENCE',
      matchedEvidence: undefined,
      normalizedStartPosition: undefined,
      issues: [],
    })
  })
})
