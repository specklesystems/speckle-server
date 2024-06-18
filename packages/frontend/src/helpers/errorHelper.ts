import { ApolloError, ServerError, ServerParseError } from '@apollo/client/core'
import { NetworkError } from '@apollo/client/errors'
import { has, isString } from 'lodash'

/**
 * Base application error
 */
export abstract class BaseError extends Error {
  /**
   * Default message if none is passed
   */
  static defaultMessage = 'Unexpected error occurred!'

  constructor(message?: string, options?: ErrorOptions) {
    message ||= new.target.defaultMessage
    super(message, options)
  }
}

const isServerError = (err: Error): err is ServerError =>
  has(err, 'response') && has(err, 'result') && has(err, 'statusCode')
const isServerParseError = (err: Error): err is ServerParseError =>
  has(err, 'response') && has(err, 'bodyText') && has(err, 'statusCode')

export function isInvalidAuth(error: ApolloError | NetworkError) {
  const networkError = error instanceof ApolloError ? error.networkError : error
  if (
    !networkError ||
    (!isServerError(networkError) && !isServerParseError(networkError))
  )
    return false

  const statusCode = networkError.statusCode
  const hasCorrectCode = [403].includes(statusCode)
  if (!hasCorrectCode) return false

  const message: string | undefined = (
    isServerError(networkError)
      ? isString(networkError.result)
        ? networkError.result
        : networkError.result?.error
      : networkError.bodyText
  ) as string | undefined

  return (message || '').toLowerCase().includes('token')
}
