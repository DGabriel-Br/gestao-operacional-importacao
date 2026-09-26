import { describe, expect, it } from 'vitest'
import { recognizeOperationalMonitoringObservationEvidence } from './recognize-observation-evidence.js'

describe('operational monitoring observation evidence', () => {
  it.each([
    'AGDO CONFIRMAÇÃO DE TRANSBORDO DO AGENTE DE CARGA',
    'Status: agdo., confirma o transbordo\ndo agente / de carga.',
  ])('recognizes the legacy transshipment sequence in %s', (observation) => {
    expect(
      recognizeOperationalMonitoringObservationEvidence(observation),
    ).toEqual({
      awaitingTransshipmentConfirmation: true,
      awaitingBerthingData: false,
    })
  })

  it.each([
    'AGENTE DE CARGA: AGDO CONFIRMA TRANSBORDO',
    'AGDO CONFIRMA TRANSBORDO DO AGENTE',
  ])(
    'does not generalize an incomplete legacy sequence in %s',
    (observation) => {
      expect(
        recognizeOperationalMonitoringObservationEvidence(observation)
          .awaitingTransshipmentConfirmation,
      ).toBe(false)
    },
  )

  it.each([
    'Aguardando dados de atracação',
    'AGUARDANDO... DADOS PARA ATRACAMENTO',
  ])('recognizes the legacy berthing sequence in %s', (observation) => {
    expect(
      recognizeOperationalMonitoringObservationEvidence(observation),
    ).toEqual({
      awaitingTransshipmentConfirmation: false,
      awaitingBerthingData: true,
    })
  })

  it('requires the characterized order for berthing evidence', () => {
    expect(
      recognizeOperationalMonitoringObservationEvidence(
        'Dados recebidos; aguardando atracação.',
      ).awaitingBerthingData,
    ).toBe(false)
  })

  it.each([undefined, '', '   \n\t'])('returns no evidence for %s', (value) => {
    expect(recognizeOperationalMonitoringObservationEvidence(value)).toEqual({
      awaitingTransshipmentConfirmation: false,
      awaitingBerthingData: false,
    })
  })
})
