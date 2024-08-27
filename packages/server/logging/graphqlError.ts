import { ApolloError } from 'apollo-server-express'
import { GraphQLError } from 'graphql'

export const shouldLogAsInfoLevel = (err: unknown) => {
  return (
    (err instanceof GraphQLError &&
      ['FORBIDDEN', 'STREAM_NOT_FOUND', 'STREAM_INVALID_ACCESS_ERROR'].includes(
        err.extensions?.code
      )) ||
    err instanceof ApolloError
  )
}
