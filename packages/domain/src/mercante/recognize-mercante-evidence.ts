export type MercanteEvidenceKind =
  'PENDING' | 'CHECKED' | 'EXISTS' | 'UNIDENTIFIED'

interface LegacyMercanteEvidenceCatalogEntry {
  readonly evidence: Exclude<MercanteEvidenceKind, 'UNIDENTIFIED'>
  readonly configuredText: string
}

export const LEGACY_MERCANTE_EVIDENCE_CATALOG = [
  { evidence: 'PENDING', configuredText: 'Pendência no Mercante' },
  { evidence: 'CHECKED', configuredText: 'Mercante conferido com BL' },
  { evidence: 'EXISTS', configuredText: 'Mercante aberto' },
  { evidence: 'EXISTS', configuredText: 'Mercante disponível' },
  { evidence: 'EXISTS', configuredText: 'Mercante consultado' },
] as const satisfies readonly LegacyMercanteEvidenceCatalogEntry[]

type MercanteConfiguredText =
  (typeof LEGACY_MERCANTE_EVIDENCE_CATALOG)[number]['configuredText']

export type MercanteEvidenceReasonCode =
  | 'MERCANTE_EVIDENCE_RECOGNIZED'
  | 'OBSERVATION_ABSENT'
  | 'OBSERVATION_EMPTY'
  | 'OBSERVATION_BLANK'
  | 'NO_KNOWN_MERCANTE_EVIDENCE'

export interface RecognizedMercanteEvidence {
  readonly recognized: true
  readonly evidence: Exclude<MercanteEvidenceKind, 'UNIDENTIFIED'>
  readonly reasonCode: 'MERCANTE_EVIDENCE_RECOGNIZED'
  readonly matchedEvidence: {
    readonly configuredText: MercanteConfiguredText
    readonly normalizedText: string
  }
  readonly normalizedStartPosition: number
  readonly issues: readonly []
}

export interface UnidentifiedMercanteEvidence {
  readonly recognized: false
  readonly evidence: 'UNIDENTIFIED'
  readonly reasonCode: Exclude<
    MercanteEvidenceReasonCode,
    'MERCANTE_EVIDENCE_RECOGNIZED'
  >
  readonly matchedEvidence: undefined
  readonly normalizedStartPosition: undefined
  readonly issues: readonly []
}

export type MercanteEvidence =
  RecognizedMercanteEvidence | UnidentifiedMercanteEvidence

interface NormalizedCatalogEntry {
  readonly evidence: Exclude<MercanteEvidenceKind, 'UNIDENTIFIED'>
  readonly configuredText: MercanteConfiguredText
  readonly normalizedText: string
}

interface MercanteEvidenceMatch extends NormalizedCatalogEntry {
  readonly normalizedStartPosition: number
}

const NORMALIZED_MERCANTE_EVIDENCE_CATALOG: readonly NormalizedCatalogEntry[] =
  LEGACY_MERCANTE_EVIDENCE_CATALOG.map((entry) => ({
    ...entry,
    normalizedText: normalizeLegacyMercanteText(entry.configuredText),
  }))

export function recognizeMercanteEvidence(
  observation: string | undefined,
): MercanteEvidence {
  if (observation === undefined) {
    return unidentified('OBSERVATION_ABSENT')
  }

  if (observation.length === 0) {
    return unidentified('OBSERVATION_EMPTY')
  }

  if (observation.trim().length === 0) {
    return unidentified('OBSERVATION_BLANK')
  }

  const normalizedObservation = normalizeLegacyMercanteText(observation)
  const selectedMatch =
    selectLatestMatch(normalizedObservation, ['PENDING', 'CHECKED']) ??
    selectLatestMatch(normalizedObservation, ['EXISTS'])

  if (selectedMatch === undefined) {
    return unidentified('NO_KNOWN_MERCANTE_EVIDENCE')
  }

  return {
    recognized: true,
    evidence: selectedMatch.evidence,
    reasonCode: 'MERCANTE_EVIDENCE_RECOGNIZED',
    matchedEvidence: {
      configuredText: selectedMatch.configuredText,
      normalizedText: selectedMatch.normalizedText,
    },
    normalizedStartPosition: selectedMatch.normalizedStartPosition,
    issues: [],
  }
}

export function normalizeLegacyMercanteText(text: string): string {
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
  acceptedEvidence: readonly Exclude<MercanteEvidenceKind, 'UNIDENTIFIED'>[],
): MercanteEvidenceMatch | undefined {
  let selectedMatch: MercanteEvidenceMatch | undefined

  for (const catalogEntry of NORMALIZED_MERCANTE_EVIDENCE_CATALOG) {
    if (!acceptedEvidence.includes(catalogEntry.evidence)) {
      continue
    }

    const zeroBasedPosition = normalizedObservation.lastIndexOf(
      catalogEntry.normalizedText,
    )

    if (zeroBasedPosition < 0) {
      continue
    }

    const match: MercanteEvidenceMatch = {
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
  reasonCode: UnidentifiedMercanteEvidence['reasonCode'],
): UnidentifiedMercanteEvidence {
  return {
    recognized: false,
    evidence: 'UNIDENTIFIED',
    reasonCode,
    matchedEvidence: undefined,
    normalizedStartPosition: undefined,
    issues: [],
  }
}
