import type {
  BadRequestOperationalSnapshotHttpResponse,
  InvalidSourceDataOperationalSnapshotHttpResponse,
  OperationalSnapshotHttpRequest,
  OperationalSnapshotHttpResponse,
  ReadyOperationalSnapshotHttpResponse,
} from './operational-snapshot-contract'

export type { OperationalSnapshotHttpRequest } from './operational-snapshot-contract'

export const OPERATIONAL_SNAPSHOT_ENDPOINT =
  '/api/backend/operational-assessment/snapshot'

type FetchOperationalSnapshot = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>

export async function requestOperationalSnapshot(
  request: OperationalSnapshotHttpRequest,
  fetcher: FetchOperationalSnapshot = fetch,
): Promise<OperationalSnapshotHttpResponse> {
  const response = await fetcher(OPERATIONAL_SNAPSHOT_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  })
  const body = await parseResponseJson(response)

  if (response.status === 200 && isReadyResponse(body)) {
    return body
  }

  if (response.status === 200 && isInvalidSourceDataResponse(body)) {
    return body
  }

  if (response.status === 400 && isBadRequestResponse(body)) {
    return body
  }

  throw new Error(
    `Unexpected operational snapshot HTTP status: ${response.status}`,
  )
}

async function parseResponseJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown
  } catch {
    throw new Error('Operational snapshot response is not valid JSON')
  }
}

function isReadyResponse(
  value: unknown,
): value is ReadyOperationalSnapshotHttpResponse {
  return isRecord(value) && value.status === 'ready'
}

function isInvalidSourceDataResponse(
  value: unknown,
): value is InvalidSourceDataOperationalSnapshotHttpResponse {
  return isRecord(value) && value.status === 'invalid_source_data'
}

function isBadRequestResponse(
  value: unknown,
): value is BadRequestOperationalSnapshotHttpResponse {
  return isRecord(value) && value.status === 'bad_request'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
