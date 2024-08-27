import { ApolloError } from 'apollo-server-express'
import { GraphQLError } from 'graphql'

export const shouldLogAsInfoLevel = (err: unknown) =>
  (err instanceof GraphQLError &&
    [
      'FORBIDDEN',
      'STREAM_NOT_FOUND',
      'STREAM_INVALID_ACCESS_ERROR',
      'UNAUTHORIZED_ACCESS_ERROR',
      'BRANCH_NOT_FOUND',
      'COMMIT_NOT_FOUND',
      'NO_INVITE_FOUND',
      'DUPLICATE_BRANCH_NAME_ERROR',
      'OBJECT_NOT_FOUND',
      'USER_INPUT_ERROR'
    ].includes(err.extensions?.code)) ||
  err instanceof ApolloError
