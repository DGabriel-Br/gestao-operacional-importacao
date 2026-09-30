export interface OperationalSnapshotSourceInputTexts {
  readonly etrackRowsText: string
  readonly ecomexRowsText: string
}

export interface ValidOperationalSnapshotSourceInputs {
  readonly status: 'valid'
  readonly etrackRows: unknown
  readonly ecomexRows: unknown
}

export interface InvalidOperationalSnapshotSourceInputs {
  readonly status: 'invalid'
  readonly errors: {
    readonly etrackRows?: 'INVALID_JSON'
    readonly ecomexRows?: 'INVALID_JSON'
  }
}

export type OperationalSnapshotSourceInputParseResult =
  ValidOperationalSnapshotSourceInputs | InvalidOperationalSnapshotSourceInputs

export function parseOperationalSnapshotSourceInputs(
  input: OperationalSnapshotSourceInputTexts,
): OperationalSnapshotSourceInputParseResult {
  const etrackRows = parseJson(input.etrackRowsText)
  const ecomexRows = parseJson(input.ecomexRowsText)
  const errors: InvalidOperationalSnapshotSourceInputs['errors'] = {
    ...(etrackRows.status === 'invalid'
      ? { etrackRows: 'INVALID_JSON' as const }
      : {}),
    ...(ecomexRows.status === 'invalid'
      ? { ecomexRows: 'INVALID_JSON' as const }
      : {}),
  }

  if (etrackRows.status === 'invalid' || ecomexRows.status === 'invalid') {
    return { status: 'invalid', errors }
  }

  return {
    status: 'valid',
    etrackRows: etrackRows.value,
    ecomexRows: ecomexRows.value,
  }
}

type JsonParseResult =
  | { readonly status: 'valid'; readonly value: unknown }
  | { readonly status: 'invalid' }

function parseJson(value: string): JsonParseResult {
  try {
    return { status: 'valid', value: JSON.parse(value) as unknown }
  } catch {
    return { status: 'invalid' }
  }
}
