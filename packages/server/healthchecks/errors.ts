import { BaseError } from '@/modules/shared/errors'

export class LivenessError extends BaseError {
  static defaultMessage = 'The application is not yet alive. Please try again later.'
  static code = 'LIVENESS_ERROR'
  static statusCode = 500
}

export class ReadinessError extends BaseError {
  static defaultMessage =
    'The application is not ready to accept requests. Please try again later.'
  static code = 'READINESS_ERROR'
  static statusCode = 500
}
