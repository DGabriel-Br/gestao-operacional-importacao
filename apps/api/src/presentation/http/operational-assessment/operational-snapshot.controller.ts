import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common'
import {
  runOperationalSnapshot,
  type RunOperationalSnapshotInput,
  type OperationalSnapshotUseCaseResult,
} from '../../../application/operational-assessment/run-operational-snapshot'
import {
  parseOperationalSnapshotHttpRequest,
  toOperationalSnapshotHttpResponse,
  type OperationalSnapshotHttpBadRequestResponse,
  type OperationalSnapshotHttpResponse,
} from './operational-snapshot-http'

type ExecuteOperationalSnapshot = (
  input: RunOperationalSnapshotInput,
) => OperationalSnapshotUseCaseResult

export function handleOperationalSnapshotHttpRequest(
  body: unknown,
  executeSnapshot: ExecuteOperationalSnapshot = runOperationalSnapshot,
): OperationalSnapshotHttpResponse {
  const parsed = parseOperationalSnapshotHttpRequest(body)

  if (parsed.status === 'invalid') {
    const response: OperationalSnapshotHttpBadRequestResponse = {
      status: 'bad_request',
      issues: parsed.issues,
    }
    throw new BadRequestException(response)
  }

  return toOperationalSnapshotHttpResponse(executeSnapshot(parsed.input))
}

@Controller('operational-assessment')
export class OperationalSnapshotController {
  @Post('snapshot')
  @HttpCode(HttpStatus.OK)
  createSnapshot(@Body() body: unknown): OperationalSnapshotHttpResponse {
    return handleOperationalSnapshotHttpRequest(body)
  }
}
