import { BaseError } from '@/modules/shared/errors'
import { ApolloError } from 'apollo-server-express'
import { GraphQLError } from 'graphql'

export const shouldLogAsInfoLevel = (err: unknown): boolean => {
  if (err instanceof GraphQLError) {
    if (!!err.cause && shouldLogAsInfoLevel(err.cause)) return true
    if (
      [
        // https://www.apollographql.com/docs/apollo-server/v2/data/errors#error-codes
        'GRAPHQL_PARSE_FAILED',
        'GRAPHQL_VALIDATION_FAILED',
        'BAD_USER_INPUT',
        'UNAUTHENTICATED',
        'FORBIDDEN',
        'PERSISTED_QUERY_NOT_FOUND',
        'PERSISTED_QUERY_NOT_SUPPORTED'
      ].includes(
        err.extensions?.code //FIXME the extensions are empty at this stage so this doesn't work, though extensions is later present when errorFormat (buildErrorFormatter) is run
      )
    )
      //NOTE while we do care about these types of error if the source of the query is a Speckle component, but we can't determine that context here and it is for that component to handle the error
      return true
    //HACK the below isn't great, but compensates for the empty extensions in GraphQLError, see comment above
    if (err.message.startsWith('Syntax Error:')) return true //TODO add further cases for the codes above
  }

  return (
    (err instanceof BaseError &&
      !!err.info().statusCode &&
      typeof err.info().statusCode === 'number' &&
      err.info().statusCode < 500) ||
    err instanceof ApolloError
  )
}
