const AWAITING_TRANSSHIPMENT_CONFIRMATION_PATTERN =
  /\bagdo\b.*\bconfirma[a-z0-9]*\b.*\btransbordo\b.*\bagente\b.*\bcarga\b/

const AWAITING_BERTHING_DATA_PATTERN =
  /\baguardando\b.*\bdados\b.*\batraca[a-z0-9]*\b/

export interface MonitoringObservationEvidence {
  readonly awaitingTransshipmentConfirmation: boolean
  readonly awaitingBerthingData: boolean
}

export function recognizeOperationalMonitoringObservationEvidence(
  observation: string | undefined,
): MonitoringObservationEvidence {
  const normalizedObservation = normalizeLegacyObservation(observation)

  return {
    awaitingTransshipmentConfirmation:
      AWAITING_TRANSSHIPMENT_CONFIRMATION_PATTERN.test(normalizedObservation),
    awaitingBerthingData: AWAITING_BERTHING_DATA_PATTERN.test(
      normalizedObservation,
    ),
  }
}

function normalizeLegacyObservation(observation: string | undefined): string {
  if (observation === undefined) {
    return ''
  }

  return observation
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
