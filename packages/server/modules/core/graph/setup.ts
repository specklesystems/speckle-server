import { ApolloServerOptions, BaseContext } from '@apollo/server'
import { GraphQLError } from 'graphql'
import _ from 'lodash'
import { VError } from 'verror'
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
    if (realError instanceof GraphQLError && realError.originalError) {
      realError = realError.originalError
    }

    // If error is a ZodError, convert its message to something more readable
    if (realError instanceof ZodError) {
      return {
        ...formattedError,
        message: fromZodError(realError).message,
        extensions: { ...formattedError.extensions, code: 'BAD_REQUEST' }
      }
    }

    // If error isn't a VError child, don't do anything extra
    if (!(realError instanceof VError)) {
      return formattedError
    }

    // Converting VError based error to Apollo's format
    const extensions = {
      ...(formattedError.extensions || {}),
      ...(VError.info(realError) || {})
    }

    // Getting rid of redundant info
    delete extensions.originalError

    // Updating exception metadata in extensions
    if (extensions.exception) {
      extensions.exception = _.omit(extensions.exception, VERROR_TRASH_PROPS)

      if (includeStacktraceInErrorResponses) {
        extensions.exception.stacktrace = VError.fullStack(realError)
      } else {
        delete extensions.exception.stacktrace
      }
    }

    return {
      message: formattedError.message,
      locations: formattedError.locations,
      path: formattedError.path,
      extensions
    }
  }
}
