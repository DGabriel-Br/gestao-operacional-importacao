import { describe, expect, it } from 'vitest'
import {
  LEGACY_OPERATIONAL_EVENT_CATALOG,
  normalizeLegacyOperationalEventText,
  recognizeOperationalEvent,
  type OperationalEvent,
} from './recognize-operational-event.js'

const isolatedEventCases: readonly [
  observation: string,
  expectedEvent: OperationalEvent,
][] = [
  ['Processo em análise crítica', 'CRITICAL_ANALYSIS_STARTED'],
  ['Pendência apontada', 'PENDING_ISSUE_REPORTED'],
  ['Recebemos retorno das pendências', 'PENDING_ISSUES_RETURNED'],
  ['Processo encaminhado para a digitação', 'SENT_TO_TYPING'],
  ['Encaminhado para digitação', 'SENT_TO_TYPING'],
  ['Erro ao gerar a DUIMP', 'DUIMP_GENERATION_ERROR'],
  ['Digitação OK', 'TYPING_COMPLETED'],
  ['Processo encaminhado para conferência', 'SENT_TO_REVIEW'],
  ['Encaminhado para conferência', 'SENT_TO_REVIEW'],
  ['Processo conferido', 'PROCESS_REVIEWED'],
]

describe('legacy operational event catalog', () => {
  it('keeps the ten configured events as distinct domain codes', () => {
    expect(LEGACY_OPERATIONAL_EVENT_CATALOG).toEqual([
      {
        event: 'CRITICAL_ANALYSIS_STARTED',
        configuredText: 'Processo em análise crítica',
      },
      {
        event: 'PENDING_ISSUE_REPORTED',
        configuredText: 'Pendência apontada',
      },
      {
        event: 'PENDING_ISSUES_RETURNED',
        configuredText: 'Recebemos retorno das pendências',
      },
      {
        event: 'PROCESS_SENT_TO_TYPING',
        configuredText: 'Processo encaminhado para a digitação',
      },
      {
        event: 'SENT_TO_TYPING',
        configuredText: 'Encaminhado para digitação',
      },
      {
        event: 'DUIMP_GENERATION_ERROR',
        configuredText: 'Erro ao gerar a DUIMP',
      },
      {
        event: 'TYPING_COMPLETED',
        configuredText: 'Digitação OK',
      },
      {
        event: 'PROCESS_SENT_TO_REVIEW',
        configuredText: 'Processo encaminhado para conferência',
      },
      {
        event: 'SENT_TO_REVIEW',
        configuredText: 'Encaminhado para conferência',
      },
      {
        event: 'PROCESS_REVIEWED',
        configuredText: 'Processo conferido',
      },
    ])
  })

  it('produces a unique normalized search key for every configured event', () => {
    const normalizedKeys = LEGACY_OPERATIONAL_EVENT_CATALOG.map((entry) =>
      normalizeLegacyOperationalEventText(entry.configuredText),
    )

    expect(new Set(normalizedKeys).size).toBe(normalizedKeys.length)
  })

  it('has no normalized keys that can match at the same starting position', () => {
    const normalizedKeys = LEGACY_OPERATIONAL_EVENT_CATALOG.map((entry) =>
      normalizeLegacyOperationalEventText(entry.configuredText),
    )

    for (const [index, key] of normalizedKeys.entries()) {
      for (const otherKey of normalizedKeys.slice(index + 1)) {
        expect(key.startsWith(otherKey) || otherKey.startsWith(key)).toBe(false)
      }
    }
  })
})

describe('operational event recognition', () => {
  it.each(isolatedEventCases)(
    'characterizes the isolated configured text %s',
    (observation, expectedEvent) => {
      const result = recognizeOperationalEvent(observation)

      expect(result.recognized).toBe(true)
      expect(result.event).toBe(expectedEvent)
      expect(result.reasonCode).toBe('OPERATIONAL_EVENT_RECOGNIZED')
      expect(result.issues).toEqual([])
    },
  )

  it('normalizes case and the explicitly mapped accents', () => {
    const result = recognizeOperationalEvent('PROCESSO EM ANALISE CRÍTICA')

    expect(result.event).toBe('CRITICAL_ANALYSIS_STARTED')
  })

  it('replaces punctuation between words with spaces', () => {
    const result = recognizeOperationalEvent('Pendência...apontada')

    expect(result.event).toBe('PENDING_ISSUE_REPORTED')
  })

  it('collapses multiple spaces', () => {
    const result = recognizeOperationalEvent(
      'Recebemos   retorno das    pendências',
    )

    expect(result.event).toBe('PENDING_ISSUES_RETURNED')
  })

  it('removes the characterized isolated articles from both texts', () => {
    const result = recognizeOperationalEvent('Erro ao gerar uma DUIMP')

    expect(result.event).toBe('DUIMP_GENERATION_ERROR')
  })

  it('finds a known event with additional text before and after it', () => {
    const result = recognizeOperationalEvent(
      'Status anterior. Digitação OK. Aguardando continuidade.',
    )

    expect(result.event).toBe('TYPING_COMPLETED')
    expect(result.recognized).toBe(true)
    if (result.recognized) {
      expect(result.normalizedStartPosition).toBe(17)
      expect(result.matchedEvidence).toEqual({
        configuredText: 'Digitação OK',
        normalizedText: 'digitacao ok',
      })
    }
  })

  it('returns an unidentified event for present text without a known event', () => {
    expect(recognizeOperationalEvent('Aguardando documentos externos')).toEqual(
      {
        recognized: false,
        event: 'UNIDENTIFIED',
        reasonCode: 'NO_KNOWN_OPERATIONAL_EVENT',
        matchedEvidence: undefined,
        normalizedStartPosition: undefined,
        issues: [],
      },
    )
  })

  it('distinguishes an absent observation', () => {
    expect(recognizeOperationalEvent(undefined).reasonCode).toBe(
      'OBSERVATION_ABSENT',
    )
  })

  it('distinguishes an empty observation', () => {
    expect(recognizeOperationalEvent('').reasonCode).toBe('OBSERVATION_EMPTY')
  })

  it('distinguishes an observation containing only spaces', () => {
    expect(recognizeOperationalEvent('  \t  ').reasonCode).toBe(
      'OBSERVATION_BLANK',
    )
  })

  it('selects the event whose first match is farther right', () => {
    const result = recognizeOperationalEvent(
      'Processo em análise crítica // Digitação OK',
    )

    expect(result.event).toBe('TYPING_COMPLETED')
  })

  it('respects the reversed textual positions of different events', () => {
    const result = recognizeOperationalEvent(
      'Digitação OK // Processo em análise crítica',
    )

    expect(result.event).toBe('CRITICAL_ANALYSIS_STARTED')
  })

  it('selects the short typing event inside the long configured text', () => {
    const result = recognizeOperationalEvent(
      'Processo encaminhado para a digitação',
    )

    expect(result.event).toBe('SENT_TO_TYPING')
    if (result.recognized) {
      expect(result.normalizedStartPosition).toBe(10)
      expect(result.matchedEvidence.configuredText).toBe(
        'Encaminhado para digitação',
      )
    }
  })

  it('selects the short review event inside the long configured text', () => {
    const result = recognizeOperationalEvent(
      'Processo encaminhado para conferência',
    )

    expect(result.event).toBe('SENT_TO_REVIEW')
    if (result.recognized) {
      expect(result.normalizedStartPosition).toBe(10)
      expect(result.matchedEvidence.configuredText).toBe(
        'Encaminhado para conferência',
      )
    }
  })

  it('uses the first position when the selected event is repeated', () => {
    const result = recognizeOperationalEvent(
      'Digitação OK // texto intermediário // Digitação OK',
    )

    expect(result.event).toBe('TYPING_COMPLETED')
    if (result.recognized) {
      expect(result.normalizedStartPosition).toBe(1)
    }
  })

  it('does not treat a later repetition as the semantically last event', () => {
    const result = recognizeOperationalEvent(
      'Digitação OK // Processo conferido // Digitação OK',
    )

    expect(result.event).toBe('PROCESS_REVIEWED')
  })

  it('does not recognize an incomplete event', () => {
    expect(recognizeOperationalEvent('Erro ao gerar').event).toBe(
      'UNIDENTIFIED',
    )
  })

  it('does not recognize the correct words in the wrong order', () => {
    expect(recognizeOperationalEvent('OK digitação').event).toBe('UNIDENTIFIED')
  })

  it('normalizes special characters around event words', () => {
    expect(recognizeOperationalEvent('Processo@conferido').event).toBe(
      'PROCESS_REVIEWED',
    )
  })

  it('characterizes a line break between event words as concatenation after CLEAN', () => {
    expect(recognizeOperationalEvent('Digitação\nOK').event).toBe(
      'UNIDENTIFIED',
    )
  })

  it('replaces a non-breaking space before matching', () => {
    expect(recognizeOperationalEvent('Digitação\u00a0OK').event).toBe(
      'TYPING_COMPLETED',
    )
  })

  it('selects the farthest first match in a realistic observation separated by slashes', () => {
    const result = recognizeOperationalEvent(
      'Processo em análise crítica // Pendência apontada // Digitação OK // texto livre',
    )

    expect(result.event).toBe('TYPING_COMPLETED')
  })

  it('does not expose an operational stage', () => {
    const result = recognizeOperationalEvent('Processo conferido')

    expect(result).not.toHaveProperty('stage')
  })
})
