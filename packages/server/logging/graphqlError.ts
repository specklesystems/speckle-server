import { BaseError } from '@/modules/shared/errors'
import { isUserGraphqlError } from '@/modules/shared/helpers/graphqlHelper'
import { ApolloError } from '@apollo/client/core'
import { GraphQLError } from 'graphql'

export const shouldLogAsInfoLevel = (err: unknown): boolean => {
  if (err instanceof GraphQLError) {
    if (isUserGraphqlError(err)) return true
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
