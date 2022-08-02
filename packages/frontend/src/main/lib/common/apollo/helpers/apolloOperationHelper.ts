import { ApolloError, FetchResult } from '@apollo/client/core'
import { GraphQLError } from 'graphql'

/**
 * Convert an error thrown during $apollo.mutate() into a fetch result
 */
export function convertThrowIntoFetchResult(err: unknown): FetchResult {
  let gqlErrors: readonly GraphQLError[]
  if (err instanceof ApolloError) {
    gqlErrors = err.graphQLErrors
  } else if (err instanceof Error) {
    gqlErrors = [new GraphQLError(err.message)]
  } else {
    gqlErrors = [new GraphQLError(err + '')]
  }

  return {
    data: undefined,
    errors: gqlErrors
  }
}
