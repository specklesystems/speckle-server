import { BadRequestError } from '@/modules/shared/errors'
import { isGraphQLError } from '@/modules/shared/helpers/graphqlHelper'
import type { ApolloServerOptions, BaseContext } from '@apollo/server'
import { ensureError } from '@speckle/shared'
import { omit } from 'lodash-es'
import VError from 'verror'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'

/**
 * Some VError implementation details that we want to remove from object representations
 * of VErrors once they're converted to them
 */
const VERROR_TRASH_PROPS = ['jse_shortmsg', 'jse_cause', 'jse_info']

/**
 * Builds apollo server error formatter
 */
export function buildErrorFormatter(params: {
  includeStacktraceInErrorResponses: boolean
}): ApolloServerOptions<BaseContext>['formatError'] {
  const { includeStacktraceInErrorResponses } = params

  // TODO: Add support for client-aware errors and obfuscate everything else
  return function (formattedError, error) {
    let realError = error || formattedError
    const writableFormattedError = { ...formattedError }

    if (isGraphQLError(realError) && realError.originalError) {
      realError = realError.originalError
    }

    // If error is a ZodError, convert its message to something more readable
    if (realError instanceof ZodError) {
      writableFormattedError.message = fromZodError(realError).message
      writableFormattedError.extensions = {
        ...(writableFormattedError.extensions || {}),
        code: BadRequestError.code
      }
    }

    // If VError, handle info & stack trace
    if (realError instanceof VError) {
      writableFormattedError.extensions = {
        ...(writableFormattedError.extensions || {}),
        ...(VError.info(realError) || {})
      }
    }

    // Clean up extensions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extensions = writableFormattedError.extensions || ({} as Record<string, any>)

    // Getting rid of redundant info
    delete extensions.originalError

    // Updating exception metadata in extensions
    if (extensions.exception) {
      extensions.exception = omit(extensions.exception, VERROR_TRASH_PROPS)

      if (includeStacktraceInErrorResponses) {
        extensions.exception.stacktrace =
          realError instanceof VError
            ? VError.fullStack(realError)
            : ensureError(realError).stack
      } else {
        delete extensions.exception.stacktrace
      }
    }

    return {
      message: writableFormattedError.message,
      locations: writableFormattedError.locations,
      path: writableFormattedError.path,
      extensions
    }
  }
}
