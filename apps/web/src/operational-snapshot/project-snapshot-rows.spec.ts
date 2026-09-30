import { describe, expect, it } from 'vitest'
import type { ReadyOperationalSnapshotHttpResponse } from './operational-snapshot-contract'
import { projectOperationalSnapshotRows } from './project-snapshot-rows'

describe('projectOperationalSnapshotRows', () => {
  it('projects assessed values without calculating operational decisions', () => {
    const rows = projectOperationalSnapshotRows([
      assessedEntry({
        processNumber: '0101BC-0793-26',
        customerReference: '420587/2026',
      }),
    ])

    expect(rows).toEqual([
      {
        index: 0,
        processNumber: '0101BC-0793-26',
        customerReference: '420587/2026',
        result: 'assessed',
        resultLabel: 'Avaliado',
        reasonCode: undefined,
        stage: 'IN_REVIEW',
        criticality: '3',
        alert: 'AWAITING_REVIEW_RETURN',
        blockingDeviationCount: 2,
        nonBlockingDeviationCount: 1,
        digitalOriginal: 'NOT_APPLICABLE',
        physicalOriginal: 'PENDING_WITHOUT_OPEN_DEVIATION',
        mercante: 'NOT_APPLICABLE',
      },
    ])
  })

  it('keeps unassessable entries in their original order', () => {
    const entries: ReadyOperationalSnapshotHttpResponse['batch']['entries'] = [
      assessedEntry({ processNumber: 'A' }),
      unassessableEntry({ processNumber: 'B' }),
      assessedEntry({ processNumber: 'C' }),
    ]

    expect(
      projectOperationalSnapshotRows(entries).map((row) => ({
        processNumber: row.processNumber,
        result: row.result,
      })),
    ).toEqual([
      { processNumber: 'A', result: 'assessed' },
      { processNumber: 'B', result: 'unassessable' },
      { processNumber: 'C', result: 'assessed' },
    ])
  })

  it('shows the backend reason for an unassessable entry without inventing statuses', () => {
    expect(projectOperationalSnapshotRows([unassessableEntry()])).toEqual([
      {
        index: 1,
        processNumber: undefined,
        customerReference: undefined,
        result: 'unassessable',
        resultLabel: 'Não avaliável',
        reasonCode: 'CUSTOMER_REFERENCE_MISSING',
        stage: undefined,
        criticality: undefined,
        alert: undefined,
        blockingDeviationCount: undefined,
        nonBlockingDeviationCount: undefined,
        digitalOriginal: undefined,
        physicalOriginal: undefined,
        mercante: undefined,
      },
    ])
  })

  it('does not project raw source data into result rows', () => {
    const row = projectOperationalSnapshotRows([assessedEntry()])[0]

    expect(row).not.toHaveProperty('rawData')
    expect(JSON.stringify(row)).not.toContain('PRIVATE_SOURCE_VALUE')
  })
})

function assessedEntry(
  overrides: Partial<
    ReadyOperationalSnapshotHttpResponse['batch']['entries'][number]
  > = {},
): ReadyOperationalSnapshotHttpResponse['batch']['entries'][number] {
  return {
    index: 0,
    processNumber: 'PROCESS-1',
    customerReference: '420001/2026',
    result: {
      status: 'assessed',
      assessment: {
        operationalStage: { stage: 'IN_REVIEW' },
        criticality: {
          classificationStatus: 'classified',
          criticality: 3,
        },
        alert: { alert: 'AWAITING_REVIEW_RETURN' },
        digitalOriginal: { status: 'NOT_APPLICABLE' },
        physicalOriginal: { status: 'PENDING_WITHOUT_OPEN_DEVIATION' },
        mercante: { status: 'NOT_APPLICABLE' },
        deviationSummary: {
          openBlockingDeviationCount: 2,
          openNonBlockingDeviationCount: 1,
        },
      },
    },
    ...overrides,
  }
}

function unassessableEntry(
  overrides: Partial<
    ReadyOperationalSnapshotHttpResponse['batch']['entries'][number]
  > = {},
): ReadyOperationalSnapshotHttpResponse['batch']['entries'][number] {
  return {
    index: 1,
    processNumber: undefined,
    customerReference: undefined,
    result: {
      status: 'unassessable',
      deviationSummaryProjection: {
        correlation: { reasonCode: 'CUSTOMER_REFERENCE_MISSING' },
      },
    },
    ...overrides,
  }
}
