import { BaseError } from '@/modules/shared/errors'

export type ExecutionEngineErrorResponse = {
  /**
   * Human readable error message
   */
  message: string
  statusCode: number
  /**
   * Error code
   */
  statusMessage: string
}

export type ExecutionEngineErrorRequest = {
  method: string
  url: string
  body?: Record<string, unknown>
}

export class ExecutionEngineFailedResponseError extends BaseError {
  static code = 'EXECUTION_ENGINE_FAILED_RESPONSE_ERROR'
  static defaultMessage = 'Request to automate execution engine failed'

  public response: ExecutionEngineErrorResponse
  public request: ExecutionEngineErrorRequest

  constructor(
    response: ExecutionEngineErrorResponse,
    request: ExecutionEngineErrorRequest
  ) {
    super(
      'Automate API Failed: ' + response.statusMessage ||
        ExecutionEngineFailedResponseError.defaultMessage
    )
    this.response = response
    this.request = request
  }
}

export class ExecutionEngineBadResponseBodyError extends BaseError {
  static code = 'EXECUTION_ENGINE_BAD_RESPONSE_BODY_ERROR'
  static defaultMessage = 'Automate API returned an unexpected response'

  public request: ExecutionEngineErrorRequest

  constructor(request: ExecutionEngineErrorRequest) {
    super(ExecutionEngineBadResponseBodyError.defaultMessage)
    this.request = request
  }
}
