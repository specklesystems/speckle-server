import { RateLimitBreached } from '@/modules/core/utils/ratelimiter'
import { BaseError } from '@/modules/shared/errors'
import { Options } from 'verror'

export class RateLimitError extends BaseError {
  static defaultMessage =
    'You have sent too many requests. You are being rate limited. Please try again later.'
  static code = 'RATE_LIMIT_ERROR'
  static statusCode = 429

  rateLimitBreached: RateLimitBreached

  constructor(
    rateLimitBreached: RateLimitBreached,
    message?: string,
    options?: Options | Error
  ) {
    super(message || RateLimitError.defaultMessage, options)
    this.rateLimitBreached = rateLimitBreached
  }
}
