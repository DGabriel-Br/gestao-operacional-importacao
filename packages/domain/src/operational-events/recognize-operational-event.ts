export const LEGACY_OPERATIONAL_EVENT_CATALOG = [
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
] as const

export type OperationalEvent =
  (typeof LEGACY_OPERATIONAL_EVENT_CATALOG)[number]['event']

export type OperationalEventRecognitionReasonCode =
  | 'OPERATIONAL_EVENT_RECOGNIZED'
  | 'OBSERVATION_ABSENT'
  | 'OBSERVATION_EMPTY'
  | 'OBSERVATION_BLANK'
  | 'NO_KNOWN_OPERATIONAL_EVENT'

type OperationalEventConfiguredText =
  (typeof LEGACY_OPERATIONAL_EVENT_CATALOG)[number]['configuredText']

export interface RecognizedOperationalEvent {
  readonly recognized: true
  readonly event: OperationalEvent
  readonly reasonCode: 'OPERATIONAL_EVENT_RECOGNIZED'
  readonly matchedEvidence: {
    readonly configuredText: OperationalEventConfiguredText
    readonly normalizedText: string
  }
  readonly normalizedStartPosition: number
  readonly issues: readonly []
}

export interface UnidentifiedOperationalEvent {
  readonly recognized: false
  readonly event: 'UNIDENTIFIED'
  readonly reasonCode: Exclude<
    OperationalEventRecognitionReasonCode,
    'OPERATIONAL_EVENT_RECOGNIZED'
  >
  readonly matchedEvidence: undefined
  readonly normalizedStartPosition: undefined
  readonly issues: readonly []
}

export type OperationalEventRecognition =
  RecognizedOperationalEvent | UnidentifiedOperationalEvent

interface NormalizedCatalogEntry {
  readonly event: OperationalEvent
  readonly configuredText: OperationalEventConfiguredText
  readonly normalizedText: string
}

interface EventMatch extends NormalizedCatalogEntry {
  readonly normalizedStartPosition: number
}

const ISOLATED_ARTICLES = new Set(['a', 'o', 'as', 'os', 'um', 'uma'])

const NORMALIZED_EVENT_CATALOG: readonly NormalizedCatalogEntry[] =
  LEGACY_OPERATIONAL_EVENT_CATALOG.map((entry) => ({
    ...entry,
    normalizedText: normalizeLegacyOperationalEventText(entry.configuredText),
  }))

export function recognizeOperationalEvent(
  observation: string | undefined,
): OperationalEventRecognition {
  if (observation === undefined) {
    return unidentified('OBSERVATION_ABSENT')
  }

  if (observation.length === 0) {
    return unidentified('OBSERVATION_EMPTY')
  }

  if (observation.trim().length === 0) {
    return unidentified('OBSERVATION_BLANK')
  }

  const normalizedObservation = normalizeLegacyOperationalEventText(observation)
  const selectedMatch = selectFarthestFirstMatch(normalizedObservation)

  if (selectedMatch === undefined) {
    return unidentified('NO_KNOWN_OPERATIONAL_EVENT')
  }

  return {
    recognized: true,
    event: selectedMatch.event,
    reasonCode: 'OPERATIONAL_EVENT_RECOGNIZED',
    matchedEvidence: {
      configuredText: selectedMatch.configuredText,
      normalizedText: selectedMatch.normalizedText,
    },
    normalizedStartPosition: selectedMatch.normalizedStartPosition,
    issues: [],
  }
}

export function normalizeLegacyOperationalEventText(text: string): string {
  const normalizedText = text
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/ +/g, ' ')
    .trim()

  return normalizedText
    .split(' ')
    .filter((token) => !ISOLATED_ARTICLES.has(token))
    .join(' ')
}

function selectFarthestFirstMatch(
  normalizedObservation: string,
): EventMatch | undefined {
  let selectedMatch: EventMatch | undefined

  for (const event of NORMALIZED_EVENT_CATALOG) {
    const zeroBasedPosition = normalizedObservation.indexOf(
      event.normalizedText,
    )

    if (zeroBasedPosition < 0) {
      continue
    }

    const match: EventMatch = {
      ...event,
      normalizedStartPosition: zeroBasedPosition + 1,
    }

    if (
      selectedMatch === undefined ||
      match.normalizedStartPosition > selectedMatch.normalizedStartPosition
    ) {
      selectedMatch = match
    }
  }

  return selectedMatch
}

function unidentified(
  reasonCode: UnidentifiedOperationalEvent['reasonCode'],
): UnidentifiedOperationalEvent {
  return {
    recognized: false,
    event: 'UNIDENTIFIED',
    reasonCode,
    matchedEvidence: undefined,
    normalizedStartPosition: undefined,
    issues: [],
  }
}
