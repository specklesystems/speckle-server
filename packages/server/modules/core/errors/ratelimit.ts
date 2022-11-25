import { RateLimitBreached } from '@/modules/core/services/ratelimiter'
import { BaseError } from '@/modules/shared/errors'
import { Options } from 'verror'

export class RateLimitError extends BaseError {
  static defaultMessage =
    'You have sent too many requests. You are being rate limited. Please try again later.'
  static code = 'RATE_LIMIT_ERROR'

  rateLimitBreached: RateLimitBreached

  constructor(
    rateLimitBreached: RateLimitBreached,
    message?: string | null | undefined,
    options: Options | Error | undefined = undefined
  ) {
    super(message || RateLimitError.defaultMessage, options)
    this.rateLimitBreached = rateLimitBreached
  }
}
