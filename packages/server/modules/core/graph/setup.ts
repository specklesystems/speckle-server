import { ApolloServerOptions, BaseContext } from '@apollo/server'
import { Authz } from '@speckle/shared'
import { GraphQLError } from 'graphql'
import _, { isObjectLike } from 'lodash'
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let extensions: { [key: string]: any } = {
      ...(formattedError.extensions || {})
    }

    if (realError instanceof VError) {
      extensions = _.omit(
        {
          ...extensions,
          ...(VError.info(realError) || {}),
          stacktrace: VError.fullStack(realError)
        },
        VERROR_TRASH_PROPS
      )
    } else if (Authz.isAuthPolicyError(realError)) {
      extensions = {
        ...extensions,
        code: realError.code,
        ...(isObjectLike(realError.payload)
          ? realError.payload
          : { payload: realError.payload })
      }
    }

    // Getting rid of redundant info
    delete extensions.originalError
    if (!includeStacktraceInErrorResponses) {
      delete extensions.stacktrace
    }

    return {
      message: formattedError.message,
      locations: formattedError.locations,
      path: formattedError.path,
      extensions
    }
  }
}
