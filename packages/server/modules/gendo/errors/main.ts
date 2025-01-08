import { BaseError } from '@/modules/shared/errors/base'

export class GendoRenderRequestError extends BaseError {
  static code = 'GENDO_RENDER_REQUEST_ERROR'
  static defaultMessage = 'Error requesting Gendo render'
  static statusCode = 502
}

export class GendoRenderRequestNotFoundError extends BaseError {
  static code = 'GENDO_RENDER_REQUEST_NOT_FOUND'
  static defaultMessage = 'Gendo render request not found'
  static statusCode = 404
}

export class InsufficientGendoRenderCreditsError extends BaseError {
  static code = 'INSUFFICIENT_GENDO_RENDER_CREDITS'
  static defaultMessage =
    'You do not have enough GendoAi credits left for the operation'
  static statusCode = 402
}
