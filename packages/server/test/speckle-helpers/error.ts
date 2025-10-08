import { BaseError } from '@/modules/shared/errors'
import VError from 'verror'

/**
 * Generic VError-enhanced error for usage in tests
 */
export class TestError extends BaseError {
  static code = 'TEST_ERROR'
  static message = 'Error occurred in a test'
}

/**
 * Ensure VError.cause & info are reported properly in stack trace
 */
export const fixStackTrace = (err: unknown) => {
  if (err instanceof BaseError) {
    const info = VError.info(err)
    const hasInfo = Object.keys(info).length > 0

    err.stack = `${VError.fullStack(err)}${
      hasInfo ? '\nInfo:\n' + JSON.stringify(info, undefined, 4) + '\n' : ''
    }`
  }
}
