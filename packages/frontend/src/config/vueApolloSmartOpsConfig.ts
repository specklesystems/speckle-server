import {
  ApolloErrorType,
  ApolloOperationErrorHandlerFunction,
  ProcessedApolloError
} from 'vue-apollo-smart-ops'

/**
 * Error handler used in our auto-generated graphql operation functions
 */
export const handleApolloError: ApolloOperationErrorHandlerFunction = (error) => {
  const allErrors: ProcessedApolloError[] = []

  if (error.networkError) {
    const networkError: ProcessedApolloError = {
      type: ApolloErrorType.NETWORK_ERROR,
      error: error.networkError,
      message: error.message
    }
    allErrors.push(networkError)
  } else {
    for (const gqlError of error.graphQLErrors || []) {
      const basicError: ProcessedApolloError = {
        type: ApolloErrorType.SERVER_ERROR,
        error: gqlError,
        path: gqlError.path,
        message: gqlError.message
      }
      allErrors.push(basicError)
    }
  }

  return {
    allErrors
  }
}
