import { BaseError } from '@/modules/shared/errors'
import { isUserGraphqlError } from '@/modules/shared/helpers/graphqlHelper'
import { ApolloError } from '@apollo/client/core'
import { ensureError } from '@speckle/shared'
import { GraphQLError } from 'graphql'
import type { Logger } from 'pino'

interface LogFn {
  (logger: Logger, e: unknown, obj?: unknown, msg?: string, ...args: unknown[]): void
}

/**
 * Uses the provided error to determine which log level to use, and adds the error to the logger instance.
 * @param logger The logger instance
 * @param e The error which will be used to determine the log level. It will be added to the logger instance.
 * @param obj The object providing additional context to the log message (see Pino documentation https://github.com/pinojs/pino/blob/main/docs/api.md#logging-method-parameters)
 * @param msg The message to log (see Pino documentation https://github.com/pinojs/pino/blob/main/docs/api.md#logging-method-parameters)
 * @param args Additional arguments to log (see Pino documentation https://github.com/pinojs/pino/blob/main/docs/api.md#logging-method-parameters)
 */
export const logWithErr: LogFn = (logger, e, obj, msg?, ...args) => {
  const err = ensureError(e)
  if (shouldLogAsInfoLevel(err)) return logger.child({ err }).info(obj, msg, ...args)
  if (shouldLogAsWarnLevel(err)) return logger.child({ err }).warn(obj, msg, ...args)
  return logger.child({ err }).error(obj, msg, ...args)
}

export const shouldLogAsInfoLevel = (err: unknown): boolean => {
  if (err instanceof GraphQLError) {
    if (isUserGraphqlError(err)) return true
    if (err.message === 'Connection is closed.') return true
    if (!!err.cause && shouldLogAsInfoLevel(err.cause)) return true
    if (!!err.originalError && shouldLogAsInfoLevel(err.originalError)) return true
  }

  if (
    err instanceof BaseError &&
    !!err.info().statusCode &&
    typeof err.info().statusCode === 'number' &&
    err.info().statusCode < 500
  )
    return true

  return err instanceof ApolloError
}

const shouldLogAsWarnLevel = (err: unknown): boolean => {
  if (!(err instanceof GraphQLError)) return false

  if (err.message.startsWith('Cannot return null for non-nullable field')) return true
  if (
    /Variable\s"(\$[^\s]+)"\sof non-null type\s"([^\s]+)"\smust not be null\./.test(
      err.message
    )
  )
    return true
  if (
    /Cannot query field\s"([^\s]+)"\son type\s"([^\s]+)"\. Did you mean\s"([^\s]+)"\?/.test(
      err.message
    )
  )
    return true
  if (!!err.cause && shouldLogAsWarnLevel(err.cause)) return true
  if (!!err.originalError && shouldLogAsWarnLevel(err.originalError)) return true

  return false
}
