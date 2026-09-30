import { describe, expect, it, vi } from 'vitest'
import {
  requestOperationalSnapshot,
  type OperationalSnapshotHttpRequest,
} from './operational-snapshot-client'

const request: OperationalSnapshotHttpRequest = {
  evaluationDate: '2026-09-29',
  etrackRows: [{ sourceVersion: 'etrack-v1', rowNumber: 2, rawData: {} }],
  ecomexRows: [],
}

describe('requestOperationalSnapshot', () => {
  it('posts the evaluation date and parsed source values to the same-origin route', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(200, {
        status: 'ready',
        evaluationDate: '2026-09-29',
        warnings: { etrack: [], ecomex: [] },
        batch: { entries: [], diagnostics: [] },
      }),
    )

    await requestOperationalSnapshot(request, fetcher)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith(
      '/api/backend/operational-assessment/snapshot',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      },
    )
  })

  it('discriminates a ready response', async () => {
    const response = await requestOperationalSnapshot(request, async () =>
      jsonResponse(200, {
        status: 'ready',
        evaluationDate: '2026-09-29',
        warnings: { etrack: [], ecomex: [] },
        batch: { entries: [], diagnostics: [] },
      }),
    )

    expect(response.status).toBe('ready')
  })

  it('preserves a batch collision diagnostic in a ready response', async () => {
    const diagnostic = {
      code: 'LEGACY_ETRACK_CORRELATION_KEY_COLLISION',
      legacyCorrelationKey: '0012026',
      references: [
        {
          firstIndex: 0,
          processNumber: 'PROCESS-A',
          customerReference: 'ABC-001/2026',
        },
        {
          firstIndex: 1,
          processNumber: 'PROCESS-B',
          customerReference: 'XYZ-001/2026',
        },
      ],
    }
    const response = await requestOperationalSnapshot(request, async () =>
      jsonResponse(200, {
        status: 'ready',
        evaluationDate: '2026-09-29',
        warnings: { etrack: [], ecomex: [] },
        batch: { entries: [], diagnostics: [diagnostic] },
      }),
    )

    expect(response.status).toBe('ready')
    if (response.status === 'ready') {
      expect(response.batch.diagnostics).toEqual([diagnostic])
    }
  })

  it('discriminates invalid source data returned with HTTP 200', async () => {
    const response = await requestOperationalSnapshot(request, async () =>
      jsonResponse(200, {
        status: 'invalid_source_data',
        evaluationDate: '2026-09-29',
        failures: { etrack: [], ecomex: [] },
      }),
    )

    expect(response.status).toBe('invalid_source_data')
  })

  it('discriminates a bad request returned with HTTP 400', async () => {
    const response = await requestOperationalSnapshot(request, async () =>
      jsonResponse(400, {
        status: 'bad_request',
        issues: [{ path: 'evaluationDate', code: 'INVALID_EVALUATION_DATE' }],
      }),
    )

    expect(response).toEqual({
      status: 'bad_request',
      issues: [{ path: 'evaluationDate', code: 'INVALID_EVALUATION_DATE' }],
    })
  })

  it('does not reinterpret HTTP 500 as a bad request', async () => {
    await expect(
      requestOperationalSnapshot(request, async () =>
        jsonResponse(500, { status: 'bad_request', issues: [] }),
      ),
    ).rejects.toThrow('Unexpected operational snapshot HTTP status: 500')
  })

  it('treats invalid response JSON as a server response error', async () => {
    await expect(
      requestOperationalSnapshot(
        request,
        async () => new Response('not-json', { status: 200 }),
      ),
    ).rejects.toThrow('Operational snapshot response is not valid JSON')
  })
})

function jsonResponse(status: number, value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
