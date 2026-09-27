export type DigitalOriginalEvidenceKind =
  'RECEIVED' | 'AWAITING' | 'UNIDENTIFIED'

interface LegacyDigitalOriginalEvidenceCatalogEntry {
  readonly evidence: Exclude<DigitalOriginalEvidenceKind, 'UNIDENTIFIED'>
  readonly configuredText: string
}

export const LEGACY_DIGITAL_ORIGINAL_EVIDENCE_CATALOG = [
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
] as const satisfies readonly LegacyDigitalOriginalEvidenceCatalogEntry[]

type DigitalOriginalConfiguredText =
  (typeof LEGACY_DIGITAL_ORIGINAL_EVIDENCE_CATALOG)[number]['configuredText']

export type DigitalOriginalEvidenceReasonCode =
  | 'DIGITAL_ORIGINAL_EVIDENCE_RECOGNIZED'
  | 'OBSERVATION_ABSENT'
  | 'OBSERVATION_EMPTY'
  | 'OBSERVATION_BLANK'
  | 'NO_KNOWN_DIGITAL_ORIGINAL_EVIDENCE'

export interface RecognizedDigitalOriginalEvidence {
  readonly recognized: true
  readonly evidence: Exclude<DigitalOriginalEvidenceKind, 'UNIDENTIFIED'>
  readonly reasonCode: 'DIGITAL_ORIGINAL_EVIDENCE_RECOGNIZED'
  readonly matchedEvidence: {
    readonly configuredText: DigitalOriginalConfiguredText
    readonly normalizedText: string
  }
  readonly normalizedStartPosition: number
  readonly issues: readonly []
}

export interface UnidentifiedDigitalOriginalEvidence {
  readonly recognized: false
  readonly evidence: 'UNIDENTIFIED'
  readonly reasonCode: Exclude<
    DigitalOriginalEvidenceReasonCode,
    'DIGITAL_ORIGINAL_EVIDENCE_RECOGNIZED'
  >
  readonly matchedEvidence: undefined
  readonly normalizedStartPosition: undefined
  readonly issues: readonly []
}

export type DigitalOriginalEvidence =
  RecognizedDigitalOriginalEvidence | UnidentifiedDigitalOriginalEvidence

interface NormalizedCatalogEntry {
  readonly evidence: Exclude<DigitalOriginalEvidenceKind, 'UNIDENTIFIED'>
  readonly configuredText: DigitalOriginalConfiguredText
  readonly normalizedText: string
}

interface DigitalOriginalEvidenceMatch extends NormalizedCatalogEntry {
  readonly normalizedStartPosition: number
}

const NORMALIZED_DIGITAL_ORIGINAL_EVIDENCE_CATALOG: readonly NormalizedCatalogEntry[] =
  LEGACY_DIGITAL_ORIGINAL_EVIDENCE_CATALOG.map((entry) => ({
    ...entry,
    normalizedText: normalizeLegacyDigitalOriginalText(entry.configuredText),
  }))

export function recognizeDigitalOriginalEvidence(
  observation: string | undefined,
): DigitalOriginalEvidence {
  if (observation === undefined) {
    return unidentified('OBSERVATION_ABSENT')
  }

  if (observation.length === 0) {
    return unidentified('OBSERVATION_EMPTY')
  }

  if (observation.trim().length === 0) {
    return unidentified('OBSERVATION_BLANK')
  }

  const normalizedObservation = normalizeLegacyDigitalOriginalText(observation)
  const selectedMatch = selectLatestMatch(normalizedObservation)

  if (selectedMatch === undefined) {
    return unidentified('NO_KNOWN_DIGITAL_ORIGINAL_EVIDENCE')
  }

  return {
    recognized: true,
    evidence: selectedMatch.evidence,
    reasonCode: 'DIGITAL_ORIGINAL_EVIDENCE_RECOGNIZED',
    matchedEvidence: {
      configuredText: selectedMatch.configuredText,
      normalizedText: selectedMatch.normalizedText,
    },
    normalizedStartPosition: selectedMatch.normalizedStartPosition,
    issues: [],
  }
}

export function normalizeLegacyDigitalOriginalText(text: string): string {
  return text
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
}

function selectLatestMatch(
  normalizedObservation: string,
): DigitalOriginalEvidenceMatch | undefined {
  let selectedMatch: DigitalOriginalEvidenceMatch | undefined

  for (const catalogEntry of NORMALIZED_DIGITAL_ORIGINAL_EVIDENCE_CATALOG) {
    const zeroBasedPosition = normalizedObservation.lastIndexOf(
      catalogEntry.normalizedText,
    )

    if (zeroBasedPosition < 0) {
      continue
    }

    const match: DigitalOriginalEvidenceMatch = {
      ...catalogEntry,
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
  reasonCode: UnidentifiedDigitalOriginalEvidence['reasonCode'],
): UnidentifiedDigitalOriginalEvidence {
  return {
    recognized: false,
    evidence: 'UNIDENTIFIED',
    reasonCode,
    matchedEvidence: undefined,
    normalizedStartPosition: undefined,
    issues: [],
  }
}
