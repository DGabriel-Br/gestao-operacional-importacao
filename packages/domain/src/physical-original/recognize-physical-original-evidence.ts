export type PhysicalOriginalEvidenceKind = 'RECEIVED' | 'UNIDENTIFIED'

interface LegacyPhysicalOriginalEvidenceCatalogEntry {
  readonly evidence: Exclude<PhysicalOriginalEvidenceKind, 'UNIDENTIFIED'>
  readonly configuredText: string
}

export const LEGACY_PHYSICAL_ORIGINAL_EVIDENCE_CATALOG = [
  {
    evidence: 'RECEIVED',
    configuredText: 'Originais OK',
  },
] as const satisfies readonly LegacyPhysicalOriginalEvidenceCatalogEntry[]

type PhysicalOriginalConfiguredText =
  (typeof LEGACY_PHYSICAL_ORIGINAL_EVIDENCE_CATALOG)[number]['configuredText']

export type PhysicalOriginalEvidenceReasonCode =
  | 'PHYSICAL_ORIGINAL_EVIDENCE_RECOGNIZED'
  | 'OBSERVATION_ABSENT'
  | 'OBSERVATION_EMPTY'
  | 'OBSERVATION_BLANK'
  | 'NO_KNOWN_PHYSICAL_ORIGINAL_EVIDENCE'

export interface RecognizedPhysicalOriginalEvidence {
  readonly recognized: true
  readonly evidence: 'RECEIVED'
  readonly reasonCode: 'PHYSICAL_ORIGINAL_EVIDENCE_RECOGNIZED'
  readonly matchedEvidence: {
    readonly configuredText: PhysicalOriginalConfiguredText
    readonly normalizedText: string
  }
  readonly normalizedStartPosition: number
  readonly issues: readonly []
}

export interface UnidentifiedPhysicalOriginalEvidence {
  readonly recognized: false
  readonly evidence: 'UNIDENTIFIED'
  readonly reasonCode: Exclude<
    PhysicalOriginalEvidenceReasonCode,
    'PHYSICAL_ORIGINAL_EVIDENCE_RECOGNIZED'
  >
  readonly matchedEvidence: undefined
  readonly normalizedStartPosition: undefined
  readonly issues: readonly []
}

export type PhysicalOriginalEvidence =
  RecognizedPhysicalOriginalEvidence | UnidentifiedPhysicalOriginalEvidence

const NORMALIZED_RECEIVED_TEXT = normalizeLegacyPhysicalOriginalText(
  LEGACY_PHYSICAL_ORIGINAL_EVIDENCE_CATALOG[0].configuredText,
)

export function recognizePhysicalOriginalEvidence(
  observation: string | undefined,
): PhysicalOriginalEvidence {
  if (observation === undefined) {
    return unidentified('OBSERVATION_ABSENT')
  }

  if (observation.length === 0) {
    return unidentified('OBSERVATION_EMPTY')
  }

  if (observation.trim().length === 0) {
    return unidentified('OBSERVATION_BLANK')
  }

  const normalizedObservation = normalizeLegacyPhysicalOriginalText(observation)
  const zeroBasedPosition = normalizedObservation.indexOf(
    NORMALIZED_RECEIVED_TEXT,
  )

  if (zeroBasedPosition < 0) {
    return unidentified('NO_KNOWN_PHYSICAL_ORIGINAL_EVIDENCE')
  }

  return {
    recognized: true,
    evidence: 'RECEIVED',
    reasonCode: 'PHYSICAL_ORIGINAL_EVIDENCE_RECOGNIZED',
    matchedEvidence: {
      configuredText:
        LEGACY_PHYSICAL_ORIGINAL_EVIDENCE_CATALOG[0].configuredText,
      normalizedText: NORMALIZED_RECEIVED_TEXT,
    },
    normalizedStartPosition: zeroBasedPosition + 1,
    issues: [],
  }
}

export function normalizeLegacyPhysicalOriginalText(text: string): string {
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

function unidentified(
  reasonCode: UnidentifiedPhysicalOriginalEvidence['reasonCode'],
): UnidentifiedPhysicalOriginalEvidence {
  return {
    recognized: false,
    evidence: 'UNIDENTIFIED',
    reasonCode,
    matchedEvidence: undefined,
    normalizedStartPosition: undefined,
    issues: [],
  }
}
