import type {
  CivilDate,
  DigitalOriginalStatus,
  MercanteStatus,
  OperationalAlert,
  OperationalAssessment,
  OperationalCriticality,
  OperationalEvent,
  OperationalStage,
  PhysicalOriginalStatus,
} from '@gestao-operacional/domain'
import { describe, expect, it } from 'vitest'
import { assessCorrelatedOperationalProcess } from '../assess-correlated-operational-process'
import { correlateOperationalDeviations } from '../correlate-operational-deviations'
import {
  projectEComexOperationalDeviation,
  type EComexOperationalDeviation,
} from '../project-ecomex-operational-deviation'
import type { ETrackOperationalFacts } from '../project-etrack-operational-facts'

const SNAPSHOT_EVALUATION_DATE: CivilDate = {
  year: 2026,
  month: 9,
  day: 29,
}

const DIFFERENTIAL_DIMENSIONS = [
  'operationalEvent',
  'operationalStage',
  'criticality',
  'openBlockingDeviationCount',
  'openNonBlockingDeviationCount',
  'alert',
  'digitalOriginal',
  'physicalOriginal',
  'mercante',
] as const

type DifferentialDimension = (typeof DIFFERENTIAL_DIMENSIONS)[number]
type DifferentialOutcome = 'MATCH' | 'MISMATCH' | 'NOT_COMPARABLE'
type MismatchCategory =
  | 'DOMAIN_RULE_DIFFERENCE'
  | 'LEGACY_IMPORTED_TEXT_CORRUPTION_CONFIRMED'
  | 'LEGACY_CORRELATION_DIFFERENCE'
  | 'LEGACY_EMPTY_VS_EXPLICIT_STATE'
  | 'FIXTURE_DATA_UNCERTAIN'

interface ComparableOperationalSnapshot {
  readonly operationalEvent: OperationalEvent | 'UNIDENTIFIED'
  readonly operationalStage: OperationalStage
  readonly criticality: OperationalCriticality | 'UNCLASSIFIED'
  readonly openBlockingDeviationCount: number
  readonly openNonBlockingDeviationCount: number
  readonly alert: OperationalAlert
  readonly digitalOriginal: DigitalOriginalStatus
  readonly physicalOriginal: PhysicalOriginalStatus | 'LEGACY_BLANK'
  readonly mercante: MercanteStatus
}

interface DifferentialDiagnostic {
  readonly category: MismatchCategory
  readonly firstProbableBoundary: string
  readonly note: string
}

interface NotComparableReason {
  readonly category: Extract<
    MismatchCategory,
    'LEGACY_EMPTY_VS_EXPLICIT_STATE' | 'FIXTURE_DATA_UNCERTAIN'
  >
  readonly note: string
}

interface LegacySnapshotFixture {
  readonly reference: string
  readonly processNumber: string
  readonly scenario: string
  readonly etrackFacts: ETrackOperationalFacts
  readonly ecomexDeviations: readonly EComexOperationalDeviation[]
  readonly legacyExpectation: ComparableOperationalSnapshot
  readonly expectedMismatches?: readonly DifferentialDimension[]
  readonly expectedActualDifferences?: Readonly<
    Partial<ComparableOperationalSnapshot>
  >
  readonly mismatchDiagnostics?: Readonly<
    Partial<Record<DifferentialDimension, DifferentialDiagnostic>>
  >
  readonly notComparable?: Readonly<
    Partial<Record<DifferentialDimension, NotComparableReason>>
  >
  readonly fixtureNotes?: readonly string[]
  readonly semanticEquivalenceNotes?: Readonly<
    Partial<Record<DifferentialDimension, string>>
  >
}

interface DifferentialDimensionResult {
  readonly dimension: DifferentialDimension
  readonly legacyValue: unknown
  readonly actualValue: unknown
  readonly outcome: DifferentialOutcome
  readonly diagnostic?: DifferentialDiagnostic
  readonly note?: string
}

interface LegacyDifferentialEvaluation {
  readonly reference: string
  readonly processNumber: string
  readonly assessment: OperationalAssessment
  readonly dimensions: readonly DifferentialDimensionResult[]
}

interface DeviationFixtureInput {
  readonly reference: string
  readonly description: string
  readonly observation?: string
  readonly lifecycle?: 'OPEN' | 'CLOSED'
  readonly rowNumber: number
}

function etrackFacts(
  reference: string,
  processNumber: string,
  overrides: Partial<ETrackOperationalFacts>,
): ETrackOperationalFacts {
  return {
    processNumber,
    customerReference: reference,
    transportMode: 'maritime',
    observation: undefined,
    hasProcessId: true,
    hasRegistration: false,
    estimatedArrivalDate: undefined,
    hasArrival: false,
    hasMercanteReference: false,
    hasHouseReference: false,
    hasCargoAgent: false,
    hasOriginalReceiptDate: false,
    ...overrides,
  }
}

function deviation(input: DeviationFixtureInput): EComexOperationalDeviation {
  const result = projectEComexOperationalDeviation({
    trace: {
      source: 'ecomex',
      sourceVersion: 'legacy-snapshot-2026-09-29',
      rowNumber: input.rowNumber,
    },
    normalizedData: {
      shipmentReference: input.reference,
      deviationDescription: input.description,
      end:
        input.lifecycle === 'CLOSED'
          ? { kind: 'date', value: '2026-09-28' }
          : { kind: 'absent' },
      notes: input.observation,
    },
    issues: [],
  })

  if (result.status !== 'ready') {
    throw new Error(`Invalid static eComex fixture at row ${input.rowNumber}`)
  }

  return result.deviation
}

const documentDescription =
  'Documentos originais não recebidos do Agente de Carga'
const signedInvoiceDescription =
  'Fatura com Assinatura com cor diferente de azul (INV)'

const importedTextCorruptionDiagnostic = (
  dimension: string,
): DifferentialDiagnostic => ({
  category: 'LEGACY_IMPORTED_TEXT_CORRUPTION_CONFIRMED',
  firstProbableBoundary:
    'physical eComex export -> legacy Google Sheets import boundary',
  note: `${dimension}: Google Sheets stored U+FFFD in the imported description while Config stored não intact; the original byte-level corruption point remains undetermined.`,
})

const LEGACY_SNAPSHOT_FIXTURES: readonly LegacySnapshotFixture[] = [
  {
    reference: '420587/2026',
    processNumber: '0101BC-0793-26',
    scenario: 'Aéreo em conferência',
    etrackFacts: etrackFacts('420587/2026', '0101BC-0793-26', {
      transportMode: 'air',
      observation: 'Encaminhado para conferência',
      estimatedArrivalDate: { year: 2026, month: 9, day: 30 },
    }),
    ecomexDeviations: [],
    legacyExpectation: {
      operationalEvent: 'SENT_TO_REVIEW',
      operationalStage: 'IN_REVIEW',
      criticality: 3,
      openBlockingDeviationCount: 0,
      openNonBlockingDeviationCount: 0,
      alert: 'AWAITING_REVIEW_RETURN',
      digitalOriginal: 'NOT_APPLICABLE',
      physicalOriginal: 'PENDING_WITHOUT_OPEN_DEVIATION',
      mercante: 'NOT_APPLICABLE',
    },
  },
  {
    reference: '420579/2026',
    processNumber: '0201RS-2922-26',
    scenario: 'Marítimo sem ETA e aguardando Mercante',
    etrackFacts: etrackFacts('420579/2026', '0201RS-2922-26', {
      observation:
        'Aguardando envio do BL original digitalizado // Digitação OK',
    }),
    ecomexDeviations: [],
    legacyExpectation: {
      operationalEvent: 'TYPING_COMPLETED',
      operationalStage: 'AWAITING_MERCANTE',
      criticality: 'UNCLASSIFIED',
      openBlockingDeviationCount: 0,
      openNonBlockingDeviationCount: 0,
      alert: 'NO_OPERATIONAL_ACTION',
      digitalOriginal: 'PENDING_WITHOUT_OPEN_DEVIATION',
      physicalOriginal: 'UNIDENTIFIED',
      mercante: 'AWAITING_OPENING',
    },
    semanticEquivalenceNotes: {
      physicalOriginal:
        'The legacy blank is compared as UNIDENTIFIED because ETA and receipt evidence are absent, as explicitly allowed for this snapshot case.',
    },
  },
  {
    reference: '420589/2026',
    processNumber: '0401IG-6793-26',
    scenario: 'Pendência com cinco desvios impeditivos',
    etrackFacts: etrackFacts('420589/2026', '0401IG-6793-26', {
      transportMode: 'air',
      observation: 'Pendência apontada',
      estimatedArrivalDate: { year: 2026, month: 10, day: 2 },
    }),
    ecomexDeviations: Array.from({ length: 5 }, (_, index) =>
      deviation({
        reference: '420589/2026',
        description: `Snapshot blocking deviation ${index + 1}`,
        rowNumber: 100 + index,
      }),
    ),
    legacyExpectation: {
      operationalEvent: 'PENDING_ISSUE_REPORTED',
      operationalStage: 'PENDING',
      criticality: 3,
      openBlockingDeviationCount: 5,
      openNonBlockingDeviationCount: 0,
      alert: 'BLOCKING_DEVIATIONS_OPEN',
      digitalOriginal: 'NOT_APPLICABLE',
      physicalOriginal: 'PENDING_WITHOUT_OPEN_DEVIATION',
      mercante: 'NOT_APPLICABLE',
    },
    fixtureNotes: [
      'The five source descriptions were not supplied. Distinct OPEN rows preserve the observed blocking decisions and verify that correlation does not deduplicate them.',
    ],
  },
  {
    reference: '420586/2026',
    processNumber: '0101BC-0652-26',
    scenario: 'Aéreo chegado com original físico recebido',
    etrackFacts: etrackFacts('420586/2026', '0101BC-0652-26', {
      transportMode: 'air',
      observation: 'Processo conferido',
      estimatedArrivalDate: { year: 2026, month: 9, day: 29 },
      hasArrival: true,
      hasOriginalReceiptDate: true,
    }),
    ecomexDeviations: [],
    legacyExpectation: {
      operationalEvent: 'PROCESS_REVIEWED',
      operationalStage: 'AWAITING_REGISTRATION',
      criticality: 4,
      openBlockingDeviationCount: 0,
      openNonBlockingDeviationCount: 0,
      alert: 'READY_TO_REGISTER',
      digitalOriginal: 'NOT_APPLICABLE',
      physicalOriginal: 'RECEIVED',
      mercante: 'NOT_APPLICABLE',
    },
  },
  {
    reference: '420583/2026',
    processNumber: '0201RS-2962-26',
    scenario: 'Mercante existente, BL digital pendente e desvios abertos',
    etrackFacts: etrackFacts('420583/2026', '0201RS-2962-26', {
      observation:
        'Aguardando envio do BL original digitalizado // Digitação OK',
      estimatedArrivalDate: { year: 2026, month: 10, day: 2 },
      hasMercanteReference: true,
    }),
    ecomexDeviations: [
      deviation({
        reference: '420583/2026',
        description: signedInvoiceDescription,
        rowNumber: 201,
      }),
      deviation({
        reference: '420583/2026',
        description: documentDescription,
        rowNumber: 202,
      }),
    ],
    legacyExpectation: {
      operationalEvent: 'TYPING_COMPLETED',
      operationalStage: 'READY_FOR_REVIEW',
      criticality: 3,
      openBlockingDeviationCount: 1,
      openNonBlockingDeviationCount: 1,
      alert: 'READY_TO_SEND_TO_REVIEW',
      digitalOriginal: 'PENDING_WITHOUT_OPEN_DEVIATION',
      physicalOriginal: 'PENDING_WITHOUT_OPEN_DEVIATION',
      mercante: 'AWAITING_DIGITAL_ORIGINAL',
    },
    expectedMismatches: [
      'openBlockingDeviationCount',
      'openNonBlockingDeviationCount',
    ],
    expectedActualDifferences: {
      openBlockingDeviationCount: 0,
      openNonBlockingDeviationCount: 2,
    },
    mismatchDiagnostics: {
      openBlockingDeviationCount:
        importedTextCorruptionDiagnostic('blocking count'),
      openNonBlockingDeviationCount:
        importedTextCorruptionDiagnostic('non-blocking count'),
    },
    fixtureNotes: [
      'The documentary deviation observation was not supplied, so the fixture preserves it as absent and does not infer a documentary flag.',
    ],
  },
  {
    reference: '420573/2026',
    processNumber: '0201RS-2900-26',
    scenario: 'Mercante conferido e BL digital recebido',
    etrackFacts: etrackFacts('420573/2026', '0201RS-2900-26', {
      observation:
        'Original digitalizado OK // MERCANTE CONFERIDO COM BL E SISTEMA // Digitação OK',
      estimatedArrivalDate: { year: 2026, month: 10, day: 7 },
      hasMercanteReference: true,
    }),
    ecomexDeviations: [
      deviation({
        reference: '420573/2026',
        description: signedInvoiceDescription,
        lifecycle: 'CLOSED',
        rowNumber: 301,
      }),
      deviation({
        reference: '420573/2026',
        description: documentDescription,
        observation: 'conhecimento original digitalizado',
        rowNumber: 302,
      }),
    ],
    legacyExpectation: {
      operationalEvent: 'TYPING_COMPLETED',
      operationalStage: 'READY_FOR_REVIEW',
      criticality: 1,
      openBlockingDeviationCount: 1,
      openNonBlockingDeviationCount: 0,
      alert: 'READY_TO_SEND_TO_REVIEW',
      digitalOriginal: 'RECEIVED',
      physicalOriginal: 'LEGACY_BLANK',
      mercante: 'CHECKED',
    },
    expectedMismatches: [
      'openBlockingDeviationCount',
      'openNonBlockingDeviationCount',
      'digitalOriginal',
    ],
    expectedActualDifferences: {
      openBlockingDeviationCount: 0,
      openNonBlockingDeviationCount: 1,
      digitalOriginal: 'RECEIVED_WITH_OPEN_DEVIATION',
    },
    mismatchDiagnostics: {
      openBlockingDeviationCount:
        importedTextCorruptionDiagnostic('blocking count'),
      openNonBlockingDeviationCount:
        importedTextCorruptionDiagnostic('non-blocking count'),
      digitalOriginal: importedTextCorruptionDiagnostic(
        'digital original status',
      ),
    },
    notComparable: {
      physicalOriginal: {
        category: 'LEGACY_EMPTY_VS_EXPLICIT_STATE',
        note: 'The legacy cell is blank while the Domain explicitly returns UNIDENTIFIED; no semantic equivalence was authorized for this case.',
      },
    },
  },
  {
    reference: '420562/2026',
    processNumber: '0201RS-2838-26',
    scenario: 'Digitação coexistindo com Mercante conferido',
    etrackFacts: etrackFacts('420562/2026', '0201RS-2838-26', {
      observation:
        'Encaminhado para digitação // Original digitalizado OK // Originais OK // MERCANTE CONFERIDO COM BL E SISTEMA',
      estimatedArrivalDate: { year: 2026, month: 9, day: 29 },
      hasMercanteReference: true,
      hasOriginalReceiptDate: true,
    }),
    ecomexDeviations: [
      deviation({
        reference: '420562/2026',
        description: 'Preço divergente',
        lifecycle: 'CLOSED',
        rowNumber: 401,
      }),
      deviation({
        reference: '420562/2026',
        description: documentDescription,
        observation: 'conhecimento original digitalizado',
        lifecycle: 'CLOSED',
        rowNumber: 402,
      }),
    ],
    legacyExpectation: {
      operationalEvent: 'SENT_TO_TYPING',
      operationalStage: 'TYPING',
      criticality: 3,
      openBlockingDeviationCount: 0,
      openNonBlockingDeviationCount: 0,
      alert: 'PRIORITIZE_TYPING',
      digitalOriginal: 'RECEIVED',
      physicalOriginal: 'RECEIVED',
      mercante: 'CHECKED',
    },
  },
  {
    reference: '420575/2026',
    processNumber: '0201RS-2907-26',
    scenario: 'Sem referência Mercante, documentos recebidos',
    etrackFacts: etrackFacts('420575/2026', '0201RS-2907-26', {
      observation: 'Original digitalizado OK // Originais OK // Digitação OK',
      estimatedArrivalDate: { year: 2026, month: 10, day: 7 },
      hasOriginalReceiptDate: true,
    }),
    ecomexDeviations: [
      deviation({
        reference: '420575/2026',
        description: documentDescription,
        observation: 'conhecimento original digitalizado',
        rowNumber: 501,
      }),
    ],
    legacyExpectation: {
      operationalEvent: 'TYPING_COMPLETED',
      operationalStage: 'AWAITING_MERCANTE',
      criticality: 1,
      openBlockingDeviationCount: 1,
      openNonBlockingDeviationCount: 0,
      alert: 'NO_OPERATIONAL_ACTION',
      digitalOriginal: 'RECEIVED',
      physicalOriginal: 'RECEIVED',
      mercante: 'AWAITING_OPENING',
    },
    expectedMismatches: [
      'openBlockingDeviationCount',
      'openNonBlockingDeviationCount',
      'digitalOriginal',
    ],
    expectedActualDifferences: {
      openBlockingDeviationCount: 0,
      openNonBlockingDeviationCount: 1,
      digitalOriginal: 'RECEIVED_WITH_OPEN_DEVIATION',
    },
    mismatchDiagnostics: {
      openBlockingDeviationCount:
        importedTextCorruptionDiagnostic('blocking count'),
      openNonBlockingDeviationCount:
        importedTextCorruptionDiagnostic('non-blocking count'),
      digitalOriginal: importedTextCorruptionDiagnostic(
        'digital original status',
      ),
    },
  },
]

function assessmentSnapshot(
  assessment: OperationalAssessment,
): ComparableOperationalSnapshot {
  return {
    operationalEvent: assessment.operationalEvent.event,
    operationalStage: assessment.operationalStage.stage,
    criticality:
      assessment.criticality.classificationStatus === 'classified'
        ? assessment.criticality.criticality
        : 'UNCLASSIFIED',
    openBlockingDeviationCount:
      assessment.deviationSummary.openBlockingDeviationCount,
    openNonBlockingDeviationCount:
      assessment.deviationSummary.openNonBlockingDeviationCount,
    alert: assessment.alert.alert,
    digitalOriginal: assessment.digitalOriginal.status,
    physicalOriginal: assessment.physicalOriginal.status,
    mercante: assessment.mercante.status,
  }
}

function compareLegacySnapshotValues(
  fixture: LegacySnapshotFixture,
  actual: ComparableOperationalSnapshot,
): readonly DifferentialDimensionResult[] {
  return DIFFERENTIAL_DIMENSIONS.map((dimension) => {
    const legacyValue = fixture.legacyExpectation[dimension]
    const actualValue = actual[dimension]
    const notComparable = fixture.notComparable?.[dimension]

    if (notComparable !== undefined) {
      return {
        dimension,
        legacyValue,
        actualValue,
        outcome: 'NOT_COMPARABLE',
        note: notComparable.note,
      }
    }

    const outcome = Object.is(legacyValue, actualValue) ? 'MATCH' : 'MISMATCH'
    const diagnostic = fixture.mismatchDiagnostics?.[dimension]
    const note = fixture.semanticEquivalenceNotes?.[dimension]

    return {
      dimension,
      legacyValue,
      actualValue,
      outcome,
      ...(diagnostic === undefined ? {} : { diagnostic }),
      ...(note === undefined ? {} : { note }),
    }
  })
}

function evaluateLegacySnapshotFixture(
  fixture: LegacySnapshotFixture,
): LegacyDifferentialEvaluation {
  const deviationCorrelation = correlateOperationalDeviations(
    fixture.etrackFacts,
    fixture.ecomexDeviations,
  )
  const result = assessCorrelatedOperationalProcess({
    etrackFacts: fixture.etrackFacts,
    deviationCorrelation,
    evaluationDate: SNAPSHOT_EVALUATION_DATE,
  })

  if (result.status !== 'assessed') {
    throw new Error(
      `Expected snapshot process ${fixture.reference} to be assessable`,
    )
  }

  return {
    reference: fixture.reference,
    processNumber: fixture.processNumber,
    assessment: result.assessment,
    dimensions: compareLegacySnapshotValues(
      fixture,
      assessmentSnapshot(result.assessment),
    ),
  }
}

function expectedOutcome(
  fixture: LegacySnapshotFixture,
  dimension: DifferentialDimension,
): DifferentialOutcome {
  if (fixture.notComparable?.[dimension] !== undefined) {
    return 'NOT_COMPARABLE'
  }

  return fixture.expectedMismatches?.includes(dimension) ? 'MISMATCH' : 'MATCH'
}

describe('legacy differential comparator', () => {
  const baseFixture = LEGACY_SNAPSHOT_FIXTURES[0]
  if (baseFixture === undefined) {
    throw new Error('Expected a base legacy fixture')
  }

  it('returns MATCH for equal values', () => {
    const actual = baseFixture.legacyExpectation

    const results = compareLegacySnapshotValues(baseFixture, actual)

    expect(results.every((result) => result.outcome === 'MATCH')).toBe(true)
  })

  it('returns MISMATCH without preventing comparison of later dimensions', () => {
    const actual = {
      ...baseFixture.legacyExpectation,
      operationalEvent: 'UNIDENTIFIED' as const,
    }

    const results = compareLegacySnapshotValues(baseFixture, actual)

    expect(results[0]?.outcome).toBe('MISMATCH')
    expect(results.slice(1).every((result) => result.outcome === 'MATCH')).toBe(
      true,
    )
  })

  it('returns NOT_COMPARABLE for a deliberately omitted legacy dimension', () => {
    const fixture: LegacySnapshotFixture = {
      ...baseFixture,
      notComparable: {
        physicalOriginal: {
          category: 'LEGACY_EMPTY_VS_EXPLICIT_STATE',
          note: 'Legacy cell was blank.',
        },
      },
    }

    const results = compareLegacySnapshotValues(
      fixture,
      baseFixture.legacyExpectation,
    )

    expect(
      results.find((result) => result.dimension === 'physicalOriginal'),
    ).toMatchObject({ outcome: 'NOT_COMPARABLE' })
  })

  it('keeps dimension order deterministic', () => {
    const results = compareLegacySnapshotValues(
      baseFixture,
      baseFixture.legacyExpectation,
    )

    expect(results.map((result) => result.dimension)).toEqual(
      DIFFERENTIAL_DIMENSIONS,
    )
  })
})

describe('legacy snapshot 2026-09-29', () => {
  it('freezes the evaluation date and the eight selected processes', () => {
    expect(SNAPSHOT_EVALUATION_DATE).toEqual({
      year: 2026,
      month: 9,
      day: 29,
    })
    expect(
      LEGACY_SNAPSHOT_FIXTURES.map((fixture) => fixture.reference),
    ).toEqual([
      '420587/2026',
      '420579/2026',
      '420589/2026',
      '420586/2026',
      '420583/2026',
      '420573/2026',
      '420562/2026',
      '420575/2026',
    ])
  })

  it('keeps the reviewed aggregate matrix and explicit legacy blank visible', () => {
    const dimensions = LEGACY_SNAPSHOT_FIXTURES.flatMap(
      (fixture) => evaluateLegacySnapshotFixture(fixture).dimensions,
    )
    const outcomeCounts = dimensions.reduce<
      Record<DifferentialOutcome, number>
    >(
      (counts, dimension) => ({
        ...counts,
        [dimension.outcome]: counts[dimension.outcome] + 1,
      }),
      { MATCH: 0, MISMATCH: 0, NOT_COMPARABLE: 0 },
    )
    const legacyBlank = dimensions.find(
      (dimension) =>
        dimension.dimension === 'physicalOriginal' &&
        dimension.legacyValue === 'LEGACY_BLANK',
    )

    expect(outcomeCounts).toEqual({
      MATCH: 63,
      MISMATCH: 8,
      NOT_COMPARABLE: 1,
    })
    expect(
      dimensions
        .filter((dimension) => dimension.outcome === 'MISMATCH')
        .every(
          (dimension) =>
            dimension.diagnostic?.category ===
            'LEGACY_IMPORTED_TEXT_CORRUPTION_CONFIRMED',
        ),
    ).toBe(true)
    expect(legacyBlank).toMatchObject({
      actualValue: 'UNIDENTIFIED',
      outcome: 'NOT_COMPARABLE',
    })
  })

  it.each(LEGACY_SNAPSHOT_FIXTURES)(
    '$reference produces the reviewed differential matrix',
    (fixture) => {
      const evaluation = evaluateLegacySnapshotFixture(fixture)

      expect(evaluation.dimensions).toHaveLength(DIFFERENTIAL_DIMENSIONS.length)
      expect(evaluation.dimensions.map((result) => result.outcome)).toEqual(
        DIFFERENTIAL_DIMENSIONS.map((dimension) =>
          expectedOutcome(fixture, dimension),
        ),
      )
      expect(
        evaluation.dimensions
          .filter((result) => result.outcome === 'MISMATCH')
          .every((result) => result.diagnostic !== undefined),
      ).toBe(true)
      for (const result of evaluation.dimensions.filter(
        (dimension) => dimension.outcome === 'MISMATCH',
      )) {
        expect(result.actualValue).toBe(
          fixture.expectedActualDifferences?.[result.dimension],
        )
      }
    },
  )
})
